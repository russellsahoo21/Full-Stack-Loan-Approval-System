export const REQUIRED_PROFILE_FIELDS = [
  'name',
  'age',
  'employmentType',
  'declaredMonthlyIncome',
  'requestedLoanAmount',
  'requestedTenureMonths',
  'cibilScore',
  'writeOffs',
  'bounceCount',
  'avgMonthlyBalance',
  'monthlyCredits'
];

export const DEFAULT_POLICY_CONFIG = {
  baseAnnualRatePercent: 11.5,
  maxFoirPercent: 50,
  highLoanEscalationAmount: 1500000,
  l1EscalationCount: 2,
  eligibilityTenureMonths: 60,
  assetBufferThreshold: 200000,
  pricingBands: [
    {
      riskGrade: 'Grade A (Low Risk)',
      interestRatePercent: 10.5,
      conditions: [
        { parameter: 'cibilScore', operator: '>=', threshold: 730 },
        { parameter: 'foir', operator: '<=', threshold: 45 },
        { parameter: 'incomeTrendPercent', operator: '>=', threshold: 0 }
      ]
    },
    {
      riskGrade: 'Grade B (Medium Risk)',
      interestRatePercent: 12,
      conditions: [
        { parameter: 'cibilScore', operator: '>=', threshold: 680 },
        { parameter: 'foir', operator: '<=', threshold: 55 }
      ]
    },
    {
      riskGrade: 'Grade C (High Risk)',
      interestRatePercent: 14,
      conditions: []
    }
  ]
};

export const DEFAULT_RULES = [
  {
    ruleCode: 'R001',
    description: 'Minimum CIBIL Score',
    parameter: 'cibilScore',
    operator: '>=',
    threshold: 700,
    actionOnFail: 'EXCEPTION_L1',
    reasonCode: 'BUREAU_SCORE_BELOW_POLICY',
    mitigatingFactors: ['Liquid assets above policy buffer']
  },
  {
    ruleCode: 'R002',
    description: 'Maximum Permissible FOIR',
    parameter: 'foir',
    operator: '<=',
    threshold: 50,
    actionOnFail: 'EXCEPTION_L1',
    reasonCode: 'FOIR_ABOVE_POLICY',
    mitigatingFactors: ['Strong cash flow or low loan-to-income ratio']
  },
  {
    ruleCode: 'R003',
    description: 'Minimum Monthly Income',
    parameter: 'monthlyIncome',
    operator: '>=',
    threshold: 30000,
    actionOnFail: 'HARD_REJECT',
    reasonCode: 'INCOME_BELOW_MINIMUM',
    mitigatingFactors: ['Co-applicant income']
  },
  {
    ruleCode: 'R004',
    description: 'No Delinquency / Write-offs',
    parameter: 'writeOffs',
    operator: '==',
    threshold: 0,
    actionOnFail: 'HARD_REJECT',
    reasonCode: 'WRITE_OFF_PRESENT',
    mitigatingFactors: []
  },
  {
    ruleCode: 'R005',
    description: 'Maximum Cheque Bounces',
    parameter: 'bounceCount',
    operator: '<=',
    threshold: 2,
    actionOnFail: 'EXCEPTION_L2',
    reasonCode: 'BANKING_BOUNCES_ABOVE_POLICY',
    mitigatingFactors: ['High average monthly balance']
  },
  {
    ruleCode: 'R006',
    description: 'Minimum Age',
    parameter: 'age',
    operator: '>=',
    threshold: 21,
    actionOnFail: 'HARD_REJECT',
    reasonCode: 'AGE_BELOW_MINIMUM',
    mitigatingFactors: []
  }
];

export const DEFAULT_RULE_SET = {
  version: 1,
  isActive: true,
  createdReason: 'Baseline NBFC Policy Rules (v1)',
  createdBy: 'Policy Admin',
  createdAt: new Date(),
  config: DEFAULT_POLICY_CONFIG,
  rules: DEFAULT_RULES
};

export const IN_MEMORY_RULE_SETS = [{ ...DEFAULT_RULE_SET }];

/**
 * Per-loan-type configuration.
 * Each entry specifies:
 *   - label, icon, description: display metadata
 *   - baseAnnualRatePercent: interest rate used for EMI calculation
 *   - maxFoirPercent: FOIR ceiling for this product
 *   - maxLoanAmount: upper cap for the loan
 *   - tenureOptions: allowed tenure values in months
 *   - defaultTenureMonths: pre-selected tenure
 *   - ruleOverrides: array of { ruleCode, overrides } — patches threshold/actionOnFail per loan type
 *   - excludedRuleCodes: rule codes to skip entirely for this loan type
 */
export const LOAN_TYPE_CONFIGS = {
  PERSONAL: {
    label: 'Personal Loan',
    icon: '👤',
    description: 'For personal expenses, travel, weddings or emergencies',
    baseAnnualRatePercent: 14.5,
    maxFoirPercent: 50,
    maxLoanAmount: 2500000,
    defaultTenureMonths: 36,
    tenureOptions: [12, 24, 36, 48, 60],
    ruleOverrides: [],
    excludedRuleCodes: []
  },
  HOME: {
    label: 'Home Loan',
    icon: '🏠',
    description: 'Purchase, construct or renovate residential property',
    baseAnnualRatePercent: 8.5,
    maxFoirPercent: 55,
    maxLoanAmount: 50000000,
    defaultTenureMonths: 180,
    tenureOptions: [60, 84, 120, 180, 240, 300, 360],
    // Property is collateral — write-offs go to L2 exception instead of hard reject
    ruleOverrides: [
      { ruleCode: 'R004', overrides: { actionOnFail: 'EXCEPTION_L2', description: 'Write-offs / Defaults (Collateral-backed — exception path)' } }
    ],
    excludedRuleCodes: []
  },
  CAR: {
    label: 'Car Loan',
    icon: '🚗',
    description: 'Finance a new or pre-owned vehicle purchase',
    baseAnnualRatePercent: 9.5,
    maxFoirPercent: 50,
    maxLoanAmount: 5000000,
    defaultTenureMonths: 60,
    tenureOptions: [12, 24, 36, 48, 60, 72, 84],
    // Vehicle is collateral — write-offs become L1 exception instead of hard reject
    ruleOverrides: [
      { ruleCode: 'R004', overrides: { actionOnFail: 'EXCEPTION_L1', description: 'Write-offs / Defaults (Vehicle-collateral — exception path)' } }
    ],
    excludedRuleCodes: []
  },
  EDUCATION: {
    label: 'Education Loan',
    icon: '🎓',
    description: 'Fund higher education in India or abroad',
    baseAnnualRatePercent: 10.5,
    maxFoirPercent: 60,
    maxLoanAmount: 5000000,
    defaultTenureMonths: 84,
    tenureOptions: [24, 36, 60, 84, 96, 120],
    // Relaxed CIBIL (650) for students with limited credit history
    // Relaxed income minimum (₹15k — co-applicant/parent income)
    // Write-offs go to L1 exception path, not hard reject
    ruleOverrides: [
      { ruleCode: 'R001', overrides: { threshold: 650, description: 'Minimum CIBIL Score (Education — relaxed to 650)' } },
      { ruleCode: 'R003', overrides: { threshold: 15000, description: 'Minimum Monthly Income (Education — co-applicant eligible)' } },
      { ruleCode: 'R004', overrides: { actionOnFail: 'EXCEPTION_L1', description: 'Write-offs / Defaults (Education — exception path)' } }
    ],
    excludedRuleCodes: []
  },
  BUSINESS: {
    label: 'Business Loan',
    icon: '💼',
    description: 'Capital for business expansion, working capital or equipment',
    baseAnnualRatePercent: 12.5,
    maxFoirPercent: 45,
    maxLoanAmount: 10000000,
    defaultTenureMonths: 48,
    tenureOptions: [12, 24, 36, 48, 60, 72, 84],
    // Stricter: bounce threshold tightened from 2 → 1
    // Write-off remains HARD_REJECT (default), no override needed
    ruleOverrides: [
      { ruleCode: 'R005', overrides: { threshold: 1, description: 'Maximum Cheque Bounces (Business — strict: max 1)' } }
    ],
    excludedRuleCodes: []
  }
};
