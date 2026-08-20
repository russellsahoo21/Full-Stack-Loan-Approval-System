import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { RuleSet } from './models/RuleSet.js';
import { ApplicantProfile } from './models/ApplicantProfile.js';
import { LoanApplication } from './models/LoanApplication.js';
import { AuditLog } from './models/AuditLog.js';
import { runBRE } from './bre/engine.js';
import { DEFAULT_RULES, DEFAULT_POLICY_CONFIG } from './bre/policy.js';

dotenv.config();

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
      config: DEFAULT_POLICY_CONFIG,
      rules: DEFAULT_RULES
    });

    console.log('RuleSet v1 seeded and set as active!');

    // Seed Applicant Profiles
    const profile1 = await ApplicantProfile.create({
      applicantId: 'APP001',
      name: 'Rahul Sharma',
      age: 29,
      employmentType: 'Salaried',
      declaredMonthlyIncome: 80000,
      existingEMI: 15000,
      cibilScore: 735,
      activeLoans: 2,
      dpd: 0,
      writeOffs: 0,
      defaults: 0,
      avgMonthlyBalance: 45000,
      monthlyCredits: 80000,
      bounceCount: 1,
      lastYearIncome: 850000,
      currentYearIncome: 960000,
      mutualFunds: 200000,
      savings: 50000
    });

    const profile2 = await ApplicantProfile.create({
      applicantId: 'APP002',
      name: 'Priya Patel',
      age: 32,
      employmentType: 'Salaried',
      declaredMonthlyIncome: 95000,
      existingEMI: 28000,
      cibilScore: 720,
      activeLoans: 2,
      dpd: 0,
      writeOffs: 0,
      defaults: 0,
      avgMonthlyBalance: 60000,
      monthlyCredits: 95000,
      bounceCount: 1,
      lastYearIncome: 1050000,
      currentYearIncome: 1180000,
      mutualFunds: 500000,
      savings: 100000
    });

    const profile3 = await ApplicantProfile.create({
      applicantId: 'APP003',
      name: 'Amit Kumar',
      age: 26,
      employmentType: 'Salaried',
      declaredMonthlyIncome: 60000,
      existingEMI: 10000,
      cibilScore: 650,
      activeLoans: 3,
      dpd: 30,
      writeOffs: 1,
      defaults: 0,
      avgMonthlyBalance: 12000,
      monthlyCredits: 50000,
      bounceCount: 4,
      lastYearIncome: 650000,
      currentYearIncome: 720000,
      mutualFunds: 0,
      savings: 5000
    });

    const profile4 = await ApplicantProfile.create({
      applicantId: 'APP201',
      name: 'Sumit Kumar (Student / Intern)',
      panNumber: 'NTCPA9988G',
      aadhaarNumber: '912345678901',
      age: 21,
      employmentType: 'Student',
      declaredMonthlyIncome: 38000,
      existingEMI: 0,
      cibilScore: -1, // NTC Thin-File
      scoreCategory: 'NTC / Student Thin-File (CIBIL: -1)',
      activeLoans: 0,
      dpd: 0,
      writeOffs: 0,
      defaults: 0,
      avgMonthlyBalance: 16000,
      monthlyCredits: 38000,
      upiMonthlyCredits: 48500,
      utilityTrackRecord: '100% On-Time (BBPS Verified)',
      employmentVintageYears: 2.0,
      bounceCount: 0,
      lastYearIncome: 420000,
      currentYearIncome: 456000,
      mutualFunds: 15000,
      savings: 22000,
      kycStatus: 'VERIFIED_NSDL_UIDAI'
    });

    console.log('Applicant Profiles seeded: APP001 (Rahul), APP002 (Priya), APP003 (Amit), APP201 (Sumit Kumar - Student NTC)');

    // Run BRE & Seed Initial Loan Applications
    const appsToSeed = [
      { profile: profile1, amount: 800000, tenure: 60, appId: 'LOAN1001' },
      { profile: profile2, amount: 1200000, tenure: 60, appId: 'LOAN1002' },
      { profile: profile3, amount: 500000, tenure: 36, appId: 'LOAN1003' },
      { profile: profile4, amount: 45000, tenure: 12, appId: 'LOAN1004' },
    ];

    for (const item of appsToSeed) {
      const breRes = runBRE(item.profile, item.amount, item.tenure, ruleSetV1);
      
      const app = await LoanApplication.create({
        applicationId: item.appId,
        applicantId: item.profile.applicantId,
        panNumber: item.profile.panNumber,
        aadhaarNumber: item.profile.aadhaarNumber,
        requestedLoanAmount: item.amount,
        requestedTenureMonths: item.tenure,
        profileSnapshot: item.profile.toObject ? item.profile.toObject() : item.profile,
        status: breRes.decision,
        ruleSetVersion: ruleSetV1.version,
        derivedMetrics: breRes.derivedMetrics,
        scorecard: breRes.scorecard,
        evaluationResult: breRes.evaluationResult,
        alternateData: breRes.alternateData,
        exceptionDetails: breRes.exceptionDetails,
        bureauSnapshot: {
          panNumber: item.profile.panNumber,
          cibilScore: item.profile.cibilScore,
          scoreCategory: item.profile.scoreCategory,
          kycStatus: item.profile.kycStatus,
          writeOffs: item.profile.writeOffs,
          bounceCount: item.profile.bounceCount,
          mutualFunds: item.profile.mutualFunds,
          savings: item.profile.savings,
          upiMonthlyCredits: item.profile.upiMonthlyCredits,
          utilityTrackRecord: item.profile.utilityTrackRecord,
          employmentVintageYears: item.profile.employmentVintageYears,
          bureauSource: 'CIBIL / Experian India Realtime Gateway'
        }
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

    console.log('Initial Loan Applications seeded: LOAN1001 (APPROVED), LOAN1002 (EXCEPTION_REQUIRED), LOAN1003 (REJECTED), LOAN1004 (APPROVED_NTC_CASHFLOW)');

    console.log('✅ Seeding complete! Database is fully populated.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
