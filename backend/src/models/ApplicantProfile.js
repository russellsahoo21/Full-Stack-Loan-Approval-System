import mongoose from 'mongoose';

const applicantProfileSchema = new mongoose.Schema({
  applicantId: { type: String, required: true, unique: true }, // e.g. APP001
  name: { type: String, required: true },
  panNumber: { type: String }, // e.g. ABCDE1234F
  aadhaarNumber: { type: String }, // e.g. 987654321098
  age: { type: Number, required: true },
  employmentType: { type: String, required: true }, // 'Salaried', 'Self-Employed'
  declaredMonthlyIncome: { type: Number, required: true },
  existingEMI: { type: Number, required: true },
  
  // Synthetic Data (Bureau, Banking, ITR, Assets)
  cibilScore: { type: Number, default: 735 },
  scoreCategory: { type: String, default: 'Prime' },
  activeLoans: { type: Number, default: 2 },
  dpd: { type: Number, default: 0 },
  writeOffs: { type: Number, default: 0 },
  defaults: { type: Number, default: 0 },
  avgMonthlyBalance: { type: Number, default: 45000 },
  monthlyCredits: { type: Number, default: 80000 },
  upiMonthlyCredits: { type: Number, default: 80000 },
  utilityTrackRecord: { type: String, default: '100% On-Time (BBPS Verified)' },
  employmentVintageYears: { type: Number, default: 2.0 },
  bounceCount: { type: Number, default: 1 },
  lastYearIncome: { type: Number, default: 850000 },
  currentYearIncome: { type: Number, default: 960000 },
  mutualFunds: { type: Number, default: 200000 },
  savings: { type: Number, default: 50000 },
  kycStatus: { type: String, default: 'VERIFIED_NSDL_UIDAI' },
  bureauFetchedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const ApplicantProfile = mongoose.model('ApplicantProfile', applicantProfileSchema);
