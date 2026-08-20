import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ApplicantProfile } from './models/ApplicantProfile.js';
import { RuleSet } from './models/RuleSet.js';
import { runBRE } from './bre/engine.js';
import { LoanApplication } from './models/LoanApplication.js';
import { AuditLog } from './models/AuditLog.js';

dotenv.config();

const testBRE = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- Testing BRE Engine & Data Flow ---');

    const profile = await ApplicantProfile.findOne({ applicantId: 'APP001' });
    const activeRuleSet = await RuleSet.findOne({ isActive: true });

    console.log('Applicant Profile:', profile.name, '(CIBIL:', profile.cibilScore, ')');
    console.log('Active RuleSet Version: v' + activeRuleSet.version);

    const breResult = runBRE(profile, 800000, 60, activeRuleSet);

    console.log('\n--- BRE Calculation Results ---');
    console.log('Derived Metrics:', breResult.derivedMetrics);
    console.log('Decision:', breResult.decision);
    console.log('Evaluation Result:', breResult.evaluationResult);

    console.log('\n--- Scorecard ---');
    breResult.scorecard.forEach(item => {
      console.log(`[${item.ruleCode}] ${item.description}: ${item.actualValue} vs ${item.thresholdRequired} => ${item.passed ? 'PASSED' : 'FAILED'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

testBRE();
