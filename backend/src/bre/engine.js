import { DEFAULT_POLICY_CONFIG, REQUIRED_PROFILE_FIELDS, LOAN_TYPE_CONFIGS } from './policy.js';

export const calculateDerivedMetrics = (profile, requestedLoanAmount, requestedTenureMonths, policyConfig = DEFAULT_POLICY_CONFIG) => {
  const annualRate = (policyConfig.baseAnnualRatePercent || DEFAULT_POLICY_CONFIG.baseAnnualRatePercent) / 100;
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
  if (actualValue === undefined || actualValue === null || actualValue === '') {
    return false;
  }
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

const getParameterValues = (profile, derivedMetrics) => ({
  cibilScore: profile.cibilScore,
  foir: derivedMetrics.foir,
  monthlyIncome: profile.declaredMonthlyIncome,
  writeOffs: profile.writeOffs,
  bounceCount: profile.bounceCount,
  age: profile.age,
  activeLoans: profile.activeLoans,
  dpd: profile.dpd,
  lti: derivedMetrics.lti,
  incomeTrendPercent: derivedMetrics.incomeTrendPercent,
  avgMonthlyBalance: profile.avgMonthlyBalance,
  monthlyCredits: profile.monthlyCredits,
  mutualFunds: profile.mutualFunds,
  savings: profile.savings
});

const conditionsPass = (conditions = [], parameterValues) => {
  return conditions.every((condition) => (
    evaluateRule(condition.operator, parameterValues[condition.parameter], condition.threshold)
  ));
};

const findPricingBand = (policyConfig, parameterValues) => {
  const bands = policyConfig.pricingBands?.length
    ? policyConfig.pricingBands
    : DEFAULT_POLICY_CONFIG.pricingBands;

  return bands.find((band) => conditionsPass(band.conditions, parameterValues)) || bands[bands.length - 1];
};

export const getMissingCriticalFields = (profile, requestedLoanAmount, requestedTenureMonths) => {
  const enrichedProfile = {
    ...profile,
    requestedLoanAmount,
    requestedTenureMonths
  };

  return REQUIRED_PROFILE_FIELDS.filter((field) => (
    enrichedProfile[field] === undefined ||
    enrichedProfile[field] === null ||
    enrichedProfile[field] === ''
  ));
};

/**
 * Applies loan-type rule overrides and exclusions to the base ruleset.
 * Returns a new array of rules with per-type thresholds/actions patched in.
 */
const applyLoanTypeRules = (baseRules, loanType) => {
  const loanConfig = LOAN_TYPE_CONFIGS[loanType];
  if (!loanConfig) return baseRules;

  const { ruleOverrides = [], excludedRuleCodes = [] } = loanConfig;

  return baseRules
    .filter(rule => !excludedRuleCodes.includes(rule.ruleCode))
    .map(rule => {
      const override = ruleOverrides.find(o => o.ruleCode === rule.ruleCode);
      if (!override) return rule;
      return { ...rule, ...override.overrides };
    });
};

export const runBRE = (profile, requestedLoanAmount, requestedTenureMonths, ruleSet, loanType = 'PERSONAL') => {
  const loanTypeConfig = LOAN_TYPE_CONFIGS[loanType] || LOAN_TYPE_CONFIGS['PERSONAL'];

  const policyConfig = {
    ...DEFAULT_POLICY_CONFIG,
    ...(ruleSet?.config || {}),
    // Loan-type rate and FOIR override everything else
    baseAnnualRatePercent: loanTypeConfig.baseAnnualRatePercent,
    maxFoirPercent: loanTypeConfig.maxFoirPercent
  };
  const derivedMetrics = calculateDerivedMetrics(profile, requestedLoanAmount, requestedTenureMonths, policyConfig);
  const missingCriticalFields = getMissingCriticalFields(profile, requestedLoanAmount, requestedTenureMonths);
  
  const scorecard = [];
  const deviations = [];
  const failedRules = [];
  let hasHardReject = false;
  let hasL1Exception = false;
  let hasL2Exception = false;
  let l1ExceptionCount = 0;

  const parameterValues = getParameterValues(profile, derivedMetrics);

  // Apply loan-type rule filtering: exclusions + threshold/action overrides
  const effectiveRules = applyLoanTypeRules(ruleSet.rules, loanType);

  effectiveRules.forEach((rule) => {
    const actualValue = parameterValues[rule.parameter];
    const passed = evaluateRule(rule.operator, actualValue, rule.threshold);

    let failedReason = null;
    if (!passed) {
      failedReason = `${rule.description} failed: ${rule.parameter} is ${actualValue}, required ${rule.operator} ${rule.threshold}`;
      deviations.push(failedReason);
      failedRules.push(rule);
      
      if (rule.actionOnFail === 'HARD_REJECT') {
        hasHardReject = true;
      } else if (rule.actionOnFail === 'EXCEPTION_L1' || rule.actionOnFail === 'EXCEPTION') {
        hasL1Exception = true;
        l1ExceptionCount++;
      } else if (rule.actionOnFail === 'EXCEPTION_L2') {
        hasL2Exception = true;
      }
    }

    scorecard.push({
      ruleCode: rule.ruleCode,
      description: rule.description,
      reasonCode: rule.reasonCode,
      thresholdRequired: `${rule.parameter} ${rule.operator} ${rule.threshold}`,
      actualValue: actualValue === undefined || actualValue === null || actualValue === '' ? 'MISSING' : String(actualValue),
      passed,
      actionOnFail: rule.actionOnFail,
      failedReason
    });
  });

  // Decision Hierarchy & Conflict Resolution
  let decision = 'APPROVED';
  let exceptionLevel = null;

  // Escalation Logic
  if (missingCriticalFields.length > 0) {
    decision = 'INSUFFICIENT_DATA';
    deviations.unshift(`Missing critical field(s): ${missingCriticalFields.join(', ')}`);
  } else if (hasL1Exception) {
    if (l1ExceptionCount >= policyConfig.l1EscalationCount) {
      hasL2Exception = true;
      deviations.push("SYSTEM ESCALATION: Multiple L1 deviations triggered an automatic L2 escalation.");
    }
    if (requestedLoanAmount > policyConfig.highLoanEscalationAmount) {
      hasL2Exception = true;
      deviations.push(`SYSTEM ESCALATION: High loan amount above ${policyConfig.highLoanEscalationAmount} with deviations triggered an automatic L2 escalation.`);
    }
  }

  if (decision === 'INSUFFICIENT_DATA') {
    exceptionLevel = null;
  } else if (hasHardReject) {
    decision = 'REJECTED';
  } else if (hasL2Exception) {
    decision = 'EXCEPTION_L2_REQUIRED';
    exceptionLevel = 'L2';
  } else if (hasL1Exception) {
    decision = 'EXCEPTION_L1_REQUIRED';
    exceptionLevel = 'L1';
  }

  // Pricing & Eligibility Calculation
  const pricingBand = findPricingBand(policyConfig, parameterValues);
  const riskGrade = pricingBand.riskGrade;
  const interestRatePercent = pricingBand.interestRatePercent;

  const maxAllowableEMI = (policyConfig.maxFoirPercent / 100) * profile.declaredMonthlyIncome;
  const maxNewEMIBuffer = maxAllowableEMI - profile.existingEMI;

  let maxEligibleLoanAmount = 0;
  if (maxNewEMIBuffer > 0) {
    const monthlyRate = interestRatePercent / 100 / 12;
    const n = requestedTenureMonths || policyConfig.eligibilityTenureMonths;
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
      whySummaryBadges,
      missingCriticalFields
    },
    exceptionDetails: {
      exceptionLevel,
      deviations,
      mitigatingFactors
    }
  };
};
