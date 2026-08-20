import { runBRE } from './bre/engine.js';

const testBRE = () => {
  console.log('--- Testing BRE Engine Escalation Logic ---\n');

  const ruleSet = {
    version: 1,
    rules: [
      { ruleCode: 'R001', description: 'Min CIBIL', parameter: 'cibilScore', operator: '>=', threshold: 700, actionOnFail: 'HARD_REJECT' },
      { ruleCode: 'R002', description: 'Max FOIR', parameter: 'foir', operator: '<=', threshold: 50, actionOnFail: 'EXCEPTION_L1' },
      { ruleCode: 'R003', description: 'Max Bounces', parameter: 'bounceCount', operator: '<=', threshold: 1, actionOnFail: 'EXCEPTION_L1' },
      { ruleCode: 'R004', description: 'Write-offs', parameter: 'writeOffs', operator: '==', threshold: 0, actionOnFail: 'EXCEPTION_L2' }
    ]
  };

  const baseProfile = {
    name: 'Test Applicant',
    employmentType: 'Salaried',
    avgMonthlyBalance: 40000,
    monthlyCredits: 50000,
    lastYearIncome: 550000,
    currentYearIncome: 600000,
    mutualFunds: 200000,
    savings: 50000
  };

  // Case 1: L1 Exception (High FOIR)
  const profile1 = { ...baseProfile, cibilScore: 750, declaredMonthlyIncome: 50000, existingEMI: 40000, bounceCount: 0, writeOffs: 0, age: 30 };
  const result1 = runBRE(profile1, 100000, 12, ruleSet);
  console.log('Case 1 (High FOIR only) Decision:', result1.decision); // Expected: EXCEPTION_L1_REQUIRED

  // Case 2: Escalate to L2 Exception (High FOIR + High Bounces = 2x L1)
  const profile2 = { ...baseProfile, cibilScore: 750, declaredMonthlyIncome: 50000, existingEMI: 40000, bounceCount: 2, writeOffs: 0, age: 30 };
  const result2 = runBRE(profile2, 100000, 12, ruleSet);
  console.log('Case 2 (2x L1 rule fails) Decision:', result2.decision); // Expected: EXCEPTION_L2_REQUIRED

  // Case 3: Escalate to L2 Exception (High Loan Amount > 15L + L1)
  const profile3 = { ...baseProfile, cibilScore: 750, declaredMonthlyIncome: 100000, existingEMI: 60000, bounceCount: 0, writeOffs: 0, age: 30 };
  const result3 = runBRE(profile3, 2000000, 60, ruleSet);
  console.log('Case 3 (High Loan > 15L + 1x L1) Decision:', result3.decision); // Expected: EXCEPTION_L2_REQUIRED

  // Case 4: L2 Exception (Direct rule fail)
  const profile4 = { ...baseProfile, cibilScore: 750, declaredMonthlyIncome: 100000, existingEMI: 10000, bounceCount: 0, writeOffs: 1, age: 30 };
  const result4 = runBRE(profile4, 100000, 12, ruleSet);
  console.log('Case 4 (Direct L2 rule fail) Decision:', result4.decision); // Expected: EXCEPTION_L2_REQUIRED
};

testBRE();
