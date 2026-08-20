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
          mitigatingFactors: ['Mutual Fund Assets >= ₹200,000', 'Low LTI ratio']
        },
        {
          ruleCode: 'R003',
          description: 'Minimum Monthly Income',
          parameter: 'monthlyIncome',
          operator: '>=',
          threshold: 30000,
          actionOnFail: 'HARD_REJECT',
          mitigatingFactors: ['Co-applicant income']
        },
        {
          ruleCode: 'R004',
          description: 'No Delinquency / Write-offs',
          parameter: 'writeOffs',
          operator: '==',
          threshold: 0,
          actionOnFail: 'HARD_REJECT',
          mitigatingFactors: []
        },
        {
          ruleCode: 'R005',
          description: 'Maximum Cheque Bounces',
          parameter: 'bounceCount',
          operator: '<=',
          threshold: 2,
          actionOnFail: 'HARD_REJECT',
          mitigatingFactors: []
        },
        {
          ruleCode: 'R006',
          description: 'Minimum Age',
          parameter: 'age',
          operator: '>=',
          threshold: 21,
          actionOnFail: 'HARD_REJECT',
          mitigatingFactors: []
        }
      ]
    });

    console.log('RuleSet v1 seeded and set as active!');

    // Seed Applicant Profiles
    const profile1 = await ApplicantProfile.create({
      applicantId: 'APP001',
      name: 'Rahul Sharma',
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '987654321098',
      age: 29,
      employmentType: 'Salaried',
      declaredMonthlyIncome: 80000,
      existingEMI: 15000,
      cibilScore: 745,
      scoreCategory: 'Prime (High Quality)',
      activeLoans: 2,
      dpd: 0,
      writeOffs: 0,
      defaults: 0,
      avgMonthlyBalance: 55000,
      monthlyCredits: 80000,
      bounceCount: 0,
      lastYearIncome: 850000,
      currentYearIncome: 960000,
      mutualFunds: 250000,
      savings: 75000,
      kycStatus: 'VERIFIED_NSDL_UIDAI'
    });

    const profile2 = await ApplicantProfile.create({
      applicantId: 'APP002',
      name: 'Priya Patel',
      panNumber: 'FGHIJ5678K',
      aadhaarNumber: '876543210987',
      age: 33,
      employmentType: 'Salaried',
      declaredMonthlyIncome: 95000,
      existingEMI: 28000,
      cibilScore: 720,
      scoreCategory: 'Near-Prime (Asset-Rich)',
      activeLoans: 2,
      dpd: 0,
      writeOffs: 0,
      defaults: 0,
      avgMonthlyBalance: 65000,
      monthlyCredits: 95000,
      bounceCount: 1,
      lastYearIncome: 1050000,
      currentYearIncome: 1180000,
      mutualFunds: 600000,
      savings: 120000,
      kycStatus: 'VERIFIED_NSDL_UIDAI'
    });

    const profile3 = await ApplicantProfile.create({
      applicantId: 'APP003',
      name: 'Amit Kumar',
      panNumber: 'KLMNO9012P',
      aadhaarNumber: '765432109876',
      age: 27,
      employmentType: 'Salaried',
      declaredMonthlyIncome: 55000,
      existingEMI: 12000,
      cibilScore: 640,
      scoreCategory: 'Sub-Prime (High Risk)',
      activeLoans: 3,
      dpd: 30,
      writeOffs: 1,
      defaults: 0,
      avgMonthlyBalance: 14000,
      monthlyCredits: 45000,
      bounceCount: 4,
      lastYearIncome: 650000,
      currentYearIncome: 720000,
      mutualFunds: 0,
      savings: 8000,
      kycStatus: 'VERIFIED_NSDL_UIDAI'
    });

    console.log('Applicant Profiles seeded: APP001 (Rahul), APP002 (Priya), APP003 (Amit)');

    // Run BRE & Seed Initial Loan Applications
    const appsToSeed = [
      { profile: profile1, amount: 800000, tenure: 60, appId: 'LOAN1001' },
      { profile: profile2, amount: 1200000, tenure: 60, appId: 'LOAN1002' },
      { profile: profile3, amount: 500000, tenure: 36, appId: 'LOAN1003' },
    ];

    for (const item of appsToSeed) {
      const breRes = runBRE(item.profile, item.amount, item.tenure, ruleSetV1);
      
      const app = await LoanApplication.create({
        applicationId: item.appId,
        applicantId: item.profile.applicantId,
        requestedLoanAmount: item.amount,
        requestedTenureMonths: item.tenure,
        status: breRes.decision,
        ruleSetVersion: ruleSetV1.version,
        derivedMetrics: breRes.derivedMetrics,
        scorecard: breRes.scorecard,
        evaluationResult: breRes.evaluationResult,
        exceptionDetails: breRes.exceptionDetails
      });

      await AuditLog.create({
        applicationId: item.appId,
        applicantId: item.profile.applicantId,
        ruleSetVersion: ruleSetV1.version,
        decision: breRes.decision,
        evaluatedBy: 'System (Automated BRE)',
        evaluationSnapshot: {
          scorecard: breRes.scorecard,
          derivedMetrics: breRes.derivedMetrics,
          evaluationResult: breRes.evaluationResult
        }
      });
    }

    console.log('Initial Loan Applications seeded: LOAN1001 (APPROVED), LOAN1002 (EXCEPTION_REQUIRED), LOAN1003 (REJECTED)');

    console.log('✅ Seeding complete! Database is fully populated.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
