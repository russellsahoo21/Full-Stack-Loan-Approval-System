import { DEFAULT_POLICY_CONFIG, REQUIRED_PROFILE_FIELDS, LOAN_TYPE_CONFIGS } from './policy.js';

export const calculateDerivedMetrics = (profile, requestedLoanAmount, requestedTenureMonths, policyConfig = DEFAULT_POLICY_CONFIG) => {
  const annualRate = (policyConfig?.baseAnnualRatePercent || DEFAULT_POLICY_CONFIG.baseAnnualRatePercent) / 100;
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
 * 🇮🇳 Alternate Cashflow Underwriting Engine (For NTC / Thin-File Borrowers: CIBIL -1 / 0)
 * Evaluates UPI Inflows, BBPS Utility Discipline, Vintage, and Banking Buffer
 */
export const calculateAlternateTrustScore = (profile, derivedMetrics) => {
  let score = 0;
  const breakdown = [];

  // 1. UPI & Digital Cashflow Velocity (Max 35 pts)
  const credits = profile.upiMonthlyCredits || profile.monthlyCredits || profile.declaredMonthlyIncome || 0;
  if (credits >= 45000) {
    score += 35;
    breakdown.push({ factor: 'UPI & Digital Monthly Inflows (₹45k+)', points: 35, maxPoints: 35, status: 'EXCELLENT', detail: `₹${credits.toLocaleString()}/mo verified velocity` });
  } else if (credits >= 30000) {
    score += 25;
    breakdown.push({ factor: 'UPI & Digital Monthly Inflows (₹30k - ₹45k)', points: 25, maxPoints: 35, status: 'GOOD', detail: `₹${credits.toLocaleString()}/mo verified velocity` });
  } else {
    score += 15;
    breakdown.push({ factor: 'UPI & Digital Monthly Inflows (< ₹30k)', points: 15, maxPoints: 35, status: 'MODERATE', detail: `₹${credits.toLocaleString()}/mo verified velocity` });
  }

  // 2. Utility & Rent Payment Track Record via BBPS (Max 30 pts)
  const bounces = profile.bounceCount || 0;
  const utilityTrack = profile.utilityTrackRecord || 'ON_TIME';
  if (bounces === 0 && !String(utilityTrack).toLowerCase().includes('delayed')) {
    score += 30;
    breakdown.push({ factor: 'BBPS Utility & Rent Discipline', points: 30, maxPoints: 30, status: 'PRISTINE', detail: '100% on-time electricity/gas/mobile bills, 0 ECS bounces' });
  } else if (bounces <= 1) {
    score += 18;
    breakdown.push({ factor: 'BBPS Utility Bills (Minor Late Settlement)', points: 18, maxPoints: 30, status: 'ACCEPTABLE', detail: '1 minor delay in 6 months' });
  } else {
    score += 5;
    breakdown.push({ factor: 'BBPS Utility Delays / ECS Bounces Detected', points: 5, maxPoints: 30, status: 'RISKY', detail: `${bounces} bounce incidents` });
  }

  // 3. Platform / Employment Vintage (Max 25 pts)
  const vintage = profile.employmentVintageYears !== undefined ? profile.employmentVintageYears : (profile.age >= 23 ? 2.2 : 1.2);
  if (vintage >= 1.5) {
    score += 25;
    breakdown.push({ factor: `Platform / Gig Vintage (${vintage} Yrs ≥ 1.5 Yrs)`, points: 25, maxPoints: 25, status: 'HIGH_STABILITY', detail: 'Vintage ≥ 1.5 years in active gig/self-employment' });
  } else if (vintage >= 1.0) {
    score += 18;
    breakdown.push({ factor: `Platform / Gig Vintage (${vintage} Yrs)`, points: 18, maxPoints: 25, status: 'MODERATE_STABILITY', detail: 'Vintage ≥ 1 year' });
  } else {
    score += 10;
    breakdown.push({ factor: 'Platform / Gig Vintage (< 1 Yr)', points: 10, maxPoints: 25, status: 'NEW_ENTRANT', detail: 'Recent entrant in gig ecosystem' });
  }

  // 4. Banking Liquidity Buffer (Max 10 pts)
  const avgBal = profile.avgMonthlyBalance || 0;
  if (avgBal >= 20000) {
    score += 10;
    breakdown.push({ factor: 'Average Monthly Bank Balance (≥ ₹20k)', points: 10, maxPoints: 10, status: 'HEALTHY', detail: `₹${avgBal.toLocaleString()} average balance` });
  } else if (avgBal >= 8000) {
    score += 7;
    breakdown.push({ factor: 'Average Monthly Bank Balance (₹8k - ₹20k)', points: 7, maxPoints: 10, status: 'ADEQUATE', detail: `₹${avgBal.toLocaleString()} average balance` });
  } else {
    score += 3;
    breakdown.push({ factor: 'Average Monthly Bank Balance (< ₹8k)', points: 3, maxPoints: 10, status: 'LOW', detail: `₹${avgBal.toLocaleString()} average balance` });
  }

  const totalScore = Math.min(100, Math.max(0, score));
  return { totalScore, breakdown };
};

/**
 * Dynamic Risk Level Index (0% - 100%)
 */
export const calculateDynamicRiskIndex = (profile, requestedLoanAmount, maxEligibleLoanAmount, derivedMetrics) => {
  // 1. CIBIL Risk Component (0 to 35 Risk %): Lower CIBIL = Higher Risk %
  const cibil = profile.cibilScore > 0 ? profile.cibilScore : 710;
  const cibilRisk = Math.min(35, Math.max(0, ((850 - cibil) / 550) * 35));

  // 2. FOIR Risk Component (0 to 35 Risk %): Higher FOIR = Higher Risk %
  const foir = derivedMetrics.foir || 30;
  const foirRisk = Math.min(35, Math.max(0, (foir / 65) * 35));

  // 3. Loan Ask vs Max Bank Eligibility Utilization Risk Component (0 to 25 Risk %):
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
  
  // Check if applicant is New-To-Credit (NTC) / Thin-File (CIBIL -1, 0, or null)
  const isNtc = profile.cibilScore === -1 || profile.cibilScore === 0 || profile.cibilScore === null || profile.cibilScore === undefined;
  const alternateData = calculateAlternateTrustScore(profile, derivedMetrics);

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
    let actualValue = parameterValues[rule.parameter];
    let passed = false;
    let failedReason = null;

    // Handle NTC Alternate Cashflow Policy for CIBIL rule
    if (rule.parameter === 'cibilScore' && isNtc) {
      if (alternateData.totalScore >= 65) {
        passed = true;
        actualValue = `NTC (CIBIL: -1) → Alt Trust Score: ${alternateData.totalScore}/100 [QUALIFIED]`;
      } else {
        passed = false;
        failedReason = `NTC Thin-File: Alternate Trust Score is ${alternateData.totalScore}/100, required >= 65 cutoff`;
        deviations.push(failedReason);
        failedRules.push(rule);
        hasHardReject = true;
      }
    } else {
      passed = evaluateRule(rule.operator, actualValue, rule.threshold);

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
  let riskGrade = pricingBand.riskGrade;
  let interestRatePercent = pricingBand.interestRatePercent;

  if (isNtc) {
    riskGrade = 'NTC Prime (Alternate Cashflow Engine)';
    interestRatePercent = 13.5;
  }

  const maxAllowableEMI = ((policyConfig.maxFoirPercent || 50) / 100) * profile.declaredMonthlyIncome;
  const maxNewEMIBuffer = maxAllowableEMI - profile.existingEMI;

  let maxEligibleLoanAmount = 0;
  if (maxNewEMIBuffer > 0) {
    const monthlyRate = interestRatePercent / 100 / 12;
    const n = requestedTenureMonths || policyConfig.eligibilityTenureMonths;
    maxEligibleLoanAmount = Math.round(
      maxNewEMIBuffer * ((1 - Math.pow(1 + monthlyRate, -n)) / monthlyRate)
    );
  }

  // If NTC / Thin-file borrower, apply Safe Credit Cap (Max ₹1.5 Lakhs)
  if (isNtc && decision === 'APPROVED') {
    maxEligibleLoanAmount = Math.min(maxEligibleLoanAmount || 150000, 150000);
  }

  // Dynamically calculate Risk Index
  const riskScore = calculateDynamicRiskIndex(
    isNtc ? { ...profile, cibilScore: 710 } : profile, 
    requestedLoanAmount, 
    maxEligibleLoanAmount, 
    derivedMetrics
  );

  // Generate Explainability Badges
  const whySummaryBadges = isNtc ? [
    `🇮🇳 NTC Thin-File (CIBIL: -1 / No Prior History)`,
    `⚡ Alternate Trust Score: ${alternateData.totalScore}/100 (Cashflow Verified)`,
    `💰 UPI Velocity: ₹${(profile.upiMonthlyCredits || profile.monthlyCredits || profile.declaredMonthlyIncome || 0).toLocaleString()}/mo`,
    `🛡️ Safe Credit Cap: ₹1,50,000 (Thin-File Guardrail)`,
    `Risk Band: ${riskGrade} (${interestRatePercent}% interest)`
  ] : [
    `CIBIL Score: ${profile.cibilScore}`,
    `FOIR: ${derivedMetrics.foir}% (Max allowable 50%)`,
    `Income Trend: ${derivedMetrics.incomeTrendPercent >= 0 ? '+' : ''}${derivedMetrics.incomeTrendPercent}%`,
    `Write-offs: ${profile.writeOffs}`,
    `Risk Band: ${riskGrade} (${interestRatePercent}% interest)`,
    `Underwriting Risk Index: ${riskScore}%`
  ];

  // Extract mitigating factors if exception required or NTC
  const mitigatingFactors = [];
  if (isNtc) {
    mitigatingFactors.push(`NTC Alternate Cashflow Approval: Trust Score ${alternateData.totalScore}/100 with verified UPI digital inflows`);
  }
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
    alternateData: {
      isNtc,
      alternateTrustScore: alternateData.totalScore,
      breakdown: alternateData.breakdown,
      safeCreditCap: 150000
    },
    evaluationResult: {
      decision,
      riskGrade,
      riskScore,
      interestRatePercent,
      maxEligibleLoanAmount,
      whySummaryBadges,
      missingCriticalFields,
      alternateData: {
        isNtc,
        alternateTrustScore: alternateData.totalScore,
        breakdown: alternateData.breakdown,
        safeCreditCap: 150000
      }
    },
    exceptionDetails: {
      exceptionLevel,
      deviations,
      mitigatingFactors
    }
  };
};
