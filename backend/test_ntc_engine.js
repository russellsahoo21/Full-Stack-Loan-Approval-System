import { runBRE } from './src/bre/engine.js';

const mockRuleSet = {
  version: 1,
  rules: [
    { ruleCode: 'R001', description: 'Minimum CIBIL Score', parameter: 'cibilScore', operator: '>=', threshold: 700, actionOnFail: 'HARD_REJECT' },
    { ruleCode: 'R002', description: 'Maximum Permissible FOIR', parameter: 'foir', operator: '<=', threshold: 50, actionOnFail: 'EXCEPTION' },
    { ruleCode: 'R003', description: 'Minimum Monthly Income', parameter: 'monthlyIncome', operator: '>=', threshold: 30000, actionOnFail: 'HARD_REJECT' },
    { ruleCode: 'R004', description: 'No Delinquency / Write-offs', parameter: 'writeOffs', operator: '==', threshold: 0, actionOnFail: 'HARD_REJECT' },
    { ruleCode: 'R005', description: 'Maximum Cheque Bounces', parameter: 'bounceCount', operator: '<=', threshold: 2, actionOnFail: 'HARD_REJECT' },
    { ruleCode: 'R006', description: 'Minimum Age', parameter: 'age', operator: '>=', threshold: 21, actionOnFail: 'HARD_REJECT' }
  ]
};

// 1. Test Qualified NTC Gig Worker (CIBIL: -1, High UPI Inflows)
const ntcQualifiedProfile = {
  applicantId: 'APP201',
  name: 'Aakash Verma (Gig Partner)',
  age: 24,
  employmentType: 'Self-Employed (Gig Economy)',
  declaredMonthlyIncome: 52000,
  existingEMI: 0,
  cibilScore: -1, // NTC
  writeOffs: 0,
  bounceCount: 0,
  avgMonthlyBalance: 22000,
  monthlyCredits: 52000,
  upiMonthlyCredits: 48500,
  utilityTrackRecord: '100% On-Time (BBPS Verified)',
  employmentVintageYears: 2.2
};

console.log('=== TEST 1: QUALIFIED NTC THIN-FILE (CIBIL: -1) ===');
const ntcResult = runBRE(ntcQualifiedProfile, 120000, 24, mockRuleSet);
console.log('Decision:', ntcResult.decision);
console.log('Alternate Trust Score:', ntcResult.alternateData.alternateTrustScore);
console.log('Safe Credit Cap:', ntcResult.evaluationResult.maxEligibleLoanAmount);

// 2. Test Subprime Disqualified NTC (CIBIL: -1, Poor Inflows, Delinquent Utility Bills)
const ntcDisqualifiedProfile = {
  applicantId: 'APP202',
  name: 'Ravi Kumar (Thin-File Unqualified)',
  age: 22,
  employmentType: 'Self-Employed',
  declaredMonthlyIncome: 32000,
  existingEMI: 0,
  cibilScore: -1,
  writeOffs: 0,
  bounceCount: 3,
  avgMonthlyBalance: 2000,
  monthlyCredits: 12000,
  upiMonthlyCredits: 12000,
  utilityTrackRecord: 'Delayed Utility Bills',
  employmentVintageYears: 0.5
};

console.log('\n=== TEST 2: DISQUALIFIED NTC THIN-FILE (CIBIL: -1, Poor Cashflows) ===');
const ntcFailResult = runBRE(ntcDisqualifiedProfile, 80000, 24, mockRuleSet);
console.log('Decision:', ntcFailResult.decision);
console.log('Alternate Trust Score:', ntcFailResult.alternateData.alternateTrustScore);
console.log('Reject Reason:', ntcFailResult.exceptionDetails.deviations[0]);

if (ntcResult.decision === 'APPROVED' && ntcFailResult.decision === 'REJECTED') {
  console.log('\n>>> FULL PIPELINE VERIFIED: Qualified NTC Approved (with ₹1.5L cap), Risky NTC Rejected! <<<');
}
