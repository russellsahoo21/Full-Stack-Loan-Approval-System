import { runBRE, calculateDerivedMetrics, calculateAlternateTrustScore } from './src/bre/engine.js';
import { DEFAULT_RULE_SET, LOAN_TYPE_CONFIGS } from './src/bre/policy.js';

console.log('🧪 =========================================================================');
console.log('🧪 RUNNING COMPREHENSIVE BRE ENGINE & DECISION MATRIX UNIT TEST SUITE');
console.log('🧪 =========================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName} - ${details}`);
  }
}

// -----------------------------------------------------------------------------
// TEST SUITE 1: PRIME APPROVAL COMBINATIONS
// -----------------------------------------------------------------------------
console.log('--- TEST SUITE 1: Prime Approval Evaluation ---');
const primeApplicant = {
  applicantId: 'TEST_PRIME',
  name: 'Rahul Prime',
  age: 29,
  employmentType: 'Salaried',
  declaredMonthlyIncome: 100000,
  existingEMI: 10000,
  cibilScore: 780,
  writeOffs: 0,
  bounceCount: 0,
  avgMonthlyBalance: 50000,
  monthlyCredits: 100000,
  mutualFunds: 500000,
  savings: 200000
};

const primeRes = runBRE(primeApplicant, 500000, 36, DEFAULT_RULE_SET, 'PERSONAL');
assert(primeRes.decision === 'APPROVED', 'Prime Applicant with CIBIL 780 & low FOIR evaluates to APPROVED');
assert(primeRes.scorecard.every(s => s.passed), 'All 6 standard policy rules passed for Prime Applicant');
assert(primeRes.derivedMetrics.foir < 35, 'Derived FOIR is well within standard policy threshold (< 35%)');

// -----------------------------------------------------------------------------
// TEST SUITE 2: HARD REJECT COMBINATIONS (DELINQUENCY, LOW CIBIL, BOUNCES)
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: Hard Reject Combinations ---');

// 2a. Delinquency / Write-offs
const writeOffApplicant = { ...primeApplicant, writeOffs: 1 };
const writeOffRes = runBRE(writeOffApplicant, 500000, 36, DEFAULT_RULE_SET);
assert(writeOffRes.decision === 'REJECTED', 'Applicant with write-offs > 0 evaluates to REJECTED');

// 2b. Minimum Monthly Income Below Cutoff (Hard Reject)
const lowIncomeApplicant = { ...primeApplicant, declaredMonthlyIncome: 18000 };
const lowIncomeRes = runBRE(lowIncomeApplicant, 500000, 36, DEFAULT_RULE_SET);
assert(lowIncomeRes.decision === 'REJECTED', 'Applicant with monthly income ₹18,000 (< ₹30,000 cutoff) evaluates to REJECTED');

// 2c. Underage Applicant
const underAgeApplicant = { ...primeApplicant, age: 19 };
const underAgeRes = runBRE(underAgeApplicant, 500000, 36, DEFAULT_RULE_SET);
assert(underAgeRes.decision === 'REJECTED', 'Applicant under 21 years old evaluates to REJECTED');

// -----------------------------------------------------------------------------
// TEST SUITE 3: CREDIT EXCEPTION L1 vs L2 ROUTING MATRIX
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: Credit Exception Routing (L1 Standard vs L2 Escalated) ---');

// 3a. Single FOIR Deviation with Low/Mid Exposure (<= 15L) -> L1 Review
const l1Applicant = {
  ...primeApplicant,
  declaredMonthlyIncome: 65000,
  existingEMI: 22000,
  cibilScore: 715,
  mutualFunds: 550000,
  savings: 150000
};
const l1Res = runBRE(l1Applicant, 1200000, 60, DEFAULT_RULE_SET);
assert(l1Res.decision === 'EXCEPTION_L1_REQUIRED', 'Single FOIR deviation with ₹12L loan routes to EXCEPTION_L1_REQUIRED');
assert(l1Res.exceptionDetails?.exceptionLevel === 'L1', 'Exception level tagged as L1');
assert(l1Res.exceptionDetails?.mitigatingFactors?.length > 0, 'Mitigating asset buffers properly recognized in exceptionDetails');

// 3b. High Loan Exposure (> 15L) with FOIR Deviation -> Automatic L2 Escalation
const l2Res = runBRE(l1Applicant, 2500000, 60, DEFAULT_RULE_SET);
assert(l2Res.decision === 'EXCEPTION_L2_REQUIRED', 'High loan amount (₹25L > ₹15L cap) with deviation automatically escalates to EXCEPTION_L2_REQUIRED');
assert(l2Res.exceptionDetails?.exceptionLevel === 'L2', 'Exception level tagged as L2 Senior Head');

// -----------------------------------------------------------------------------
// TEST SUITE 4: NTC / THIN-FILE ALTERNATE CASHFLOW UNDERWRITING
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: NTC / Thin-File Alternate Cashflow Engine ---');

const qualifiedNtcApplicant = {
  applicantId: 'NTC_PASS',
  name: 'Sumit Student',
  age: 21,
  employmentType: 'Student',
  declaredMonthlyIncome: 38000,
  existingEMI: 0,
  cibilScore: -1, // Thin-file
  writeOffs: 0,
  bounceCount: 0,
  avgMonthlyBalance: 16000,
  monthlyCredits: 38000,
  upiMonthlyCredits: 48500,
  utilityTrackRecord: '100% On-Time (BBPS Verified)',
  employmentVintageYears: 2.0
};
const ntcPassRes = runBRE(qualifiedNtcApplicant, 45000, 12, DEFAULT_RULE_SET);
assert(ntcPassRes.decision === 'APPROVED', 'Qualified NTC applicant (UPI flow + on-time utility) evaluates to APPROVED');
assert(ntcPassRes.alternateData?.alternateTrustScore >= 65, 'NTC Alternate Trust Score >= 65 cutoff');
assert(ntcPassRes.evaluationResult?.maxEligibleLoanAmount <= 150000, 'NTC Safe Credit Cap enforced (Max ₹1.5 Lakhs)');

const riskyNtcApplicant = {
  ...qualifiedNtcApplicant,
  upiMonthlyCredits: 2000,
  avgMonthlyBalance: 500,
  utilityTrackRecord: 'Frequent Delays (>30 DPD)',
  employmentVintageYears: 0.2
};
const ntcFailRes = runBRE(riskyNtcApplicant, 45000, 12, DEFAULT_RULE_SET);
assert(ntcFailRes.decision === 'REJECTED', 'Risky NTC applicant with poor cashflow & utility delays evaluates to REJECTED');

// -----------------------------------------------------------------------------
// TEST SUITE 5: MULTI-LOAN PRODUCT CATEGORY POLICIES
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 5: Loan Product Category Policies ---');
const homeLoanApplicant = {
  ...primeApplicant,
  declaredMonthlyIncome: 150000,
  existingEMI: 30000
};
const homeLoanRes = runBRE(homeLoanApplicant, 4000000, 180, DEFAULT_RULE_SET, 'HOME');
assert(homeLoanRes.decision === 'APPROVED', 'Home Loan evaluated with 8.5% p.a. base rate and 55% max FOIR');

const eduLoanApplicant = {
  ...primeApplicant,
  declaredMonthlyIncome: 60000,
  existingEMI: 15000
};
const eduLoanRes = runBRE(eduLoanApplicant, 800000, 84, DEFAULT_RULE_SET, 'EDUCATION');
assert(eduLoanRes.decision === 'APPROVED', 'Education Loan evaluated with 10.5% p.a. base rate and 60% max FOIR');

console.log('\n=========================================================================');
console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} ASSERTIONS PASSED (${Math.round(passedTests/totalTests*100)}%)`);
console.log('=========================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
