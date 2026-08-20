import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from './models/User.js';
import { RuleSet } from './models/RuleSet.js';
import { ApplicantProfile } from './models/ApplicantProfile.js';
import { LoanApplication } from './models/LoanApplication.js';
import { AuditLog } from './models/AuditLog.js';
import { runBRE } from './bre/engine.js';
import { KNOWN_BUREAU_PROFILES } from './services/bureauService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/loan_approval_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await RuleSet.deleteMany({});
    await ApplicantProfile.deleteMany({});
    await LoanApplication.deleteMany({});
    await AuditLog.deleteMany({});

    // Seed Users
    const admin = await User.create({
      name: 'Policy Admin',
      email: 'admin@nbfc.com',
      password: 'admin123',
      role: 'POLICY_ADMIN'
    });

    const officer = await User.create({
      name: 'Credit Officer L1',
      email: 'officer1@nbfc.com',
      password: 'officer123',
      role: 'CREDIT_OFFICER_L1'
    });

    const officer2 = await User.create({
      name: 'Credit Officer L2',
      email: 'officer2@nbfc.com',
      password: 'officer123',
      role: 'CREDIT_OFFICER_L2'
    });

    const applicantUser = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      password: 'rahul123',
      role: 'APPLICANT'
    });

    console.log('Users seeded: Admin, Officer L1, Officer L2, Applicant');

    // Seed RuleSet v1
    const ruleSetV1 = await RuleSet.create({
      version: 1,
      isActive: true,
      status: 'ACTIVE',
      createdReason: 'Initial baseline NBFC lending policy (v1)',
      createdBy: admin.name,
      rules: [
        {
          ruleCode: 'R001',
          description: 'Minimum CIBIL Score',
          parameter: 'cibilScore',
          operator: '>=',
          threshold: 700,
          actionOnFail: 'HARD_REJECT',
          mitigatingFactors: ['Assets >= ₹2,000,000']
        },
        {
          ruleCode: 'R002',
          description: 'Maximum Permissible FOIR',
          parameter: 'foir',
          operator: '<=',
          threshold: 50,
          actionOnFail: 'EXCEPTION',
          mitigatingFactors: ['Liquid Assets >= 40% of loan', 'Positive salary trend >= 10%']
        },
        {
          ruleCode: 'R003',
          description: 'Minimum Monthly Declared Income',
          parameter: 'monthlyIncome',
          operator: '>=',
          threshold: 30000,
          actionOnFail: 'HARD_REJECT',
          mitigatingFactors: ['Co-applicant Income']
        },
        {
          ruleCode: 'R004',
          description: 'Zero Active Write-Offs / Defaults',
          parameter: 'writeOffs',
          operator: '==',
          threshold: 0,
          actionOnFail: 'HARD_REJECT',
          mitigatingFactors: []
        },
        {
          ruleCode: 'R005',
          description: 'Max Permissible Cheque Bounces (6M)',
          parameter: 'bounceCount',
          operator: '<=',
          threshold: 2,
          actionOnFail: 'HARD_REJECT',
          mitigatingFactors: ['AMB >= 3x EMI']
        },
        {
          ruleCode: 'R006',
          description: 'Minimum Applicant Age',
          parameter: 'age',
          operator: '>=',
          threshold: 21,
          actionOnFail: 'HARD_REJECT',
          mitigatingFactors: []
        }
      ]
    });

    console.log('RuleSet v1 seeded and set as active!');

    // Seed all 50 Applicant Profiles
    const createdProfiles = [];
    for (const p of KNOWN_BUREAU_PROFILES) {
      const prof = await ApplicantProfile.create({
        applicantId: p.applicantId,
        name: p.name,
        panNumber: p.panNumber,
        aadhaarNumber: p.aadhaarNumber,
        age: p.age,
        employmentType: p.employmentType,
        declaredMonthlyIncome: p.declaredMonthlyIncome,
        existingEMI: p.existingEMI,
        cibilScore: p.cibilScore,
        scoreCategory: p.scoreCategory,
        activeLoans: p.activeLoans,
        dpd: p.dpd,
        writeOffs: p.writeOffs,
        defaults: p.writeOffs,
        avgMonthlyBalance: p.avgMonthlyBalance,
        monthlyCredits: p.monthlyCredits,
        bounceCount: p.bounceCount,
        lastYearIncome: p.lastYearIncome,
        currentYearIncome: p.currentYearIncome,
        mutualFunds: p.mutualFunds,
        savings: p.savings,
        kycStatus: p.kycStatus
      });
      createdProfiles.push(prof);
    }

    console.log(`Seeded ${createdProfiles.length} Applicant Profiles into MongoDB Atlas.`);

    // Run BRE and generate full 50-application underwriting portfolio
    let appIndex = 1001;
    for (let i = 0; i < createdProfiles.length; i++) {
      const prof = createdProfiles[i];
      const appId = `LOAN${appIndex++}`;
      
      // Dynamic loan requests based on income
      const loanAmount = Math.max(300000, Math.round((prof.declaredMonthlyIncome * (prof.cibilScore > 740 ? 10 : 8)) / 50000) * 50000);
      const tenure = 60;

      const breRes = runBRE(prof, loanAmount, tenure, ruleSetV1);

      // Create application
      await LoanApplication.create({
        applicationId: appId,
        applicantId: prof.applicantId,
        panNumber: prof.panNumber,
        aadhaarNumber: prof.aadhaarNumber,
        requestedLoanAmount: loanAmount,
        requestedTenureMonths: tenure,
        status: breRes.decision,
        ruleSetVersion: ruleSetV1.version,
        derivedMetrics: breRes.derivedMetrics,
        scorecard: breRes.scorecard,
        evaluationResult: breRes.evaluationResult,
        bureauSnapshot: {
          panNumber: prof.panNumber,
          cibilScore: prof.cibilScore,
          scoreCategory: prof.scoreCategory,
          kycStatus: prof.kycStatus,
          writeOffs: prof.writeOffs,
          bounceCount: prof.bounceCount,
          mutualFunds: prof.mutualFunds,
          savings: prof.savings,
          bureauSource: 'CIBIL / Experian Gateway'
        },
        exceptionDetails: breRes.exceptionDetails
      });

      await AuditLog.create({
        applicationId: appId,
        applicantId: prof.applicantId,
        ruleSetVersion: ruleSetV1.version,
        decision: breRes.decision,
        evaluatedBy: 'System (Automated BRE Engine)',
        evaluationSnapshot: {
          scorecard: breRes.scorecard,
          derivedMetrics: breRes.derivedMetrics,
          evaluationResult: breRes.evaluationResult
        },
        timestamp: new Date()
      });
    }

    console.log(`Seeded 50 Loan Applications with full scorecards and audit logs!`);
    console.log('✅ Seeding complete! Database is fully populated.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
