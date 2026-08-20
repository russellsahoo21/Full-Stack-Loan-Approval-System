import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { RuleSet } from './models/RuleSet.js';
import { ApplicantProfile } from './models/ApplicantProfile.js';

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

    const applicantUser = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      password: 'rahul123',
      role: 'APPLICANT'
    });

    console.log('Users seeded: Admin, Officer, Applicant');

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

    // Seed Applicant Profile APP001 (Rahul Sharma)
    await ApplicantProfile.create({
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

    console.log('Applicant Profile APP001 (Rahul Sharma) seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
