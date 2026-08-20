/**
 * Smart Credit Underwriting Business Rules Engine (BRE) Engine
 */

export const calculateDerivedMetrics = (profile, requestedLoanAmount, requestedTenureMonths) => {
  const annualRate = 0.115; // 11.5% synthetic base interest rate
  const r = annualRate / 12;
  const n = requestedTenureMonths || 60;
  
  // Proposed EMI calculation
  const proposedEMI = Math.round(
    (requestedLoanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  );

  const declaredMonthlyIncome = profile.declaredMonthlyIncome || 1;
  const existingEMI = profile.existingEMI || 0;

  // FOIR = ((Existing EMI + Proposed EMI) / Monthly Income) * 100
  const foir = parseFloat((((existingEMI + proposedEMI) / declaredMonthlyIncome) * 100).toFixed(2));

  // LTI = Loan Requested / (Monthly Income * 12)
  const lti = parseFloat((requestedLoanAmount / (declaredMonthlyIncome * 12)).toFixed(2));

  // Income Trend = ((Current Year Income - Last Year Income) / Last Year Income) * 100
  const lastYearIncome = profile.lastYearIncome || 1;
  const currentYearIncome = profile.currentYearIncome || lastYearIncome;
  const incomeTrendPercent = parseFloat(
    (((currentYearIncome - lastYearIncome) / lastYearIncome) * 100).toFixed(2)
  );

  // Bounce Ratio (in 6 months)
  const bounceCount = profile.bounceCount || 0;
  const bounceRatio = parseFloat((bounceCount / 6).toFixed(2));

  return {
    proposedEMI,
    foir,
    lti,
    incomeTrendPercent,
    bounceRatio
  };
};

/**
 * Option A: Dynamic Risk Level Index (0% - 100%)
 * Higher Loan Amount -> Higher Utilization & Debt -> HIGHER RISK LEVEL %
 */
export const calculateDynamicRiskIndex = (profile, requestedLoanAmount, maxEligibleLoanAmount, derivedMetrics) => {
  // 1. CIBIL Risk Component (0 to 35 Risk %): Lower CIBIL = Higher Risk %
  const cibil = profile.cibilScore || 700;
  const cibilRisk = Math.min(35, Math.max(0, ((850 - cibil) / 550) * 35));

  // 2. FOIR Risk Component (0 to 35 Risk %): Higher FOIR = Higher Risk %
  const foir = derivedMetrics.foir || 30;
  const foirRisk = Math.min(35, Math.max(0, (foir / 65) * 35));

  // 3. Loan Ask vs Max Bank Eligibility Utilization Risk Component (0 to 25 Risk %):
  // As requested loan amount INCREASES (e.g., ₹5L -> ₹8L -> ₹11L), Risk Level % INCREASES!
  let amountRisk = 12;
  if (maxEligibleLoanAmount && maxEligibleLoanAmount > 0) {
    const ratio = requestedLoanAmount / maxEligibleLoanAmount;
    amountRisk = Math.min(25, Math.max(0, Math.round(ratio * 20)));
  }

  // 4. Default / Bounce History Risk Component (0 to 5 Risk %):
  let historyRisk = 0;
  if (profile.writeOffs > 0) historyRisk += 5;
  if (profile.bounceCount > 0) historyRisk += Math.min(5, profile.bounceCount * 2);

  const totalRiskIndex = Math.min(99, Math.max(5, Math.round(cibilRisk + foirRisk + amountRisk + historyRisk)));
  return totalRiskIndex;
};

export const evaluateRule = (operator, actualValue, threshold) => {
  switch (operator) {
    case '>=':
      return Number(actualValue) >= Number(threshold);
    case '<=':
      return Number(actualValue) <= Number(threshold);
    case '==':
      return Number(actualValue) === Number(threshold);
    case '>':
      return Number(actualValue) > Number(threshold);
    case '<':
      return Number(actualValue) < Number(threshold);
    case '!=':
      return Number(actualValue) !== Number(threshold);
    default:
      return false;
  }
};

export const runBRE = (profile, requestedLoanAmount, requestedTenureMonths, ruleSet) => {
  const derivedMetrics = calculateDerivedMetrics(profile, requestedLoanAmount, requestedTenureMonths);
  
  const scorecard = [];
  const deviations = [];
  const failedRules = [];
  let hasHardReject = false;
  let hasException = false;

  const parameterValues = {
    cibilScore: profile.cibilScore,
    foir: derivedMetrics.foir,
    monthlyIncome: profile.declaredMonthlyIncome,
    writeOffs: profile.writeOffs,
    bounceCount: profile.bounceCount,
    age: profile.age,
    activeLoans: profile.activeLoans,
    dpd: profile.dpd
  };

  ruleSet.rules.forEach((rule) => {
    const actualValue = parameterValues[rule.parameter];
    const passed = evaluateRule(rule.operator, actualValue, rule.threshold);

    let failedReason = null;
    if (!passed) {
      failedReason = `${rule.description} failed: ${rule.parameter} is ${actualValue}, required ${rule.operator} ${rule.threshold}`;
      deviations.push(failedReason);
      failedRules.push(rule);
      
      if (rule.actionOnFail === 'HARD_REJECT') {
        hasHardReject = true;
      } else if (rule.actionOnFail === 'EXCEPTION') {
        hasException = true;
      }
    }

    scorecard.push({
      ruleCode: rule.ruleCode,
      description: rule.description,
      thresholdRequired: `${rule.parameter} ${rule.operator} ${rule.threshold}`,
      actualValue: String(actualValue),
      passed,
      actionOnFail: rule.actionOnFail,
      failedReason
    });
  });

  // Decision Hierarchy & Conflict Resolution
  let decision = 'APPROVED';
  if (hasHardReject) {
    decision = 'REJECTED';
  } else if (hasException) {
    decision = 'EXCEPTION_REQUIRED';
  }

  // Pricing & Eligibility Calculation
  let riskGrade = 'Grade A (Low Risk)';
  let interestRatePercent = 10.5;

  if (profile.cibilScore >= 730 && derivedMetrics.foir <= 45 && derivedMetrics.incomeTrendPercent >= 0) {
    riskGrade = 'Grade A (Low Risk)';
    interestRatePercent = 10.5;
  } else if (profile.cibilScore >= 680 && derivedMetrics.foir <= 55) {
    riskGrade = 'Grade B (Medium Risk)';
    interestRatePercent = 12.0;
  } else {
    riskGrade = 'Grade C (High Risk)';
    interestRatePercent = 14.0;
  }

  // Max Eligible Loan Calculation based on Max FOIR 50%
  const maxAllowableEMI = 0.50 * profile.declaredMonthlyIncome;
  const maxNewEMIBuffer = maxAllowableEMI - profile.existingEMI;

  let maxEligibleLoanAmount = 0;
  if (maxNewEMIBuffer > 0) {
    const monthlyRate = interestRatePercent / 100 / 12;
    const n = requestedTenureMonths;
    maxEligibleLoanAmount = Math.round(
      maxNewEMIBuffer * ((1 - Math.pow(1 + monthlyRate, -n)) / monthlyRate)
    );
  }

  // Dynamically calculate Risk Index (Option A: Higher amount -> Higher Risk Level %)
  const riskScore = calculateDynamicRiskIndex(profile, requestedLoanAmount, maxEligibleLoanAmount, derivedMetrics);

  // Generate Explainability Badges
  const whySummaryBadges = [
    `CIBIL Score: ${profile.cibilScore}`,
    `FOIR: ${derivedMetrics.foir}% (Max allowable 50%)`,
    `Income Trend: ${derivedMetrics.incomeTrendPercent >= 0 ? '+' : ''}${derivedMetrics.incomeTrendPercent}%`,
    `Write-offs: ${profile.writeOffs}`,
    `Risk Band: ${riskGrade} (${interestRatePercent}% interest)`,
    `Underwriting Risk Index: ${riskScore}%`
  ];

  // Extract mitigating factors if exception required
  const mitigatingFactors = [];
  if (profile.mutualFunds && profile.mutualFunds > 0) {
    mitigatingFactors.push(`Mutual Funds Asset Buffer: ₹${profile.mutualFunds.toLocaleString()}`);
  }
  if (profile.savings && profile.savings > 0) {
    mitigatingFactors.push(`Savings Balance Buffer: ₹${profile.savings.toLocaleString()}`);
  }
  if (derivedMetrics.incomeTrendPercent > 10) {
    mitigatingFactors.push(`Strong Positive Income Growth: +${derivedMetrics.incomeTrendPercent}% year-over-year`);
  }

  return {
    derivedMetrics,
    scorecard,
    decision,
    evaluationResult: {
      decision,
      riskGrade,
      riskScore,
      interestRatePercent,
      maxEligibleLoanAmount,
      whySummaryBadges
    },
    exceptionDetails: {
      deviations,
      mitigatingFactors
    }
  };
};
