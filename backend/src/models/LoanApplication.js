import mongoose from 'mongoose';

const scorecardItemSchema = new mongoose.Schema({
  ruleCode: { type: String, required: true },
  description: { type: String, required: true },
  reasonCode: { type: String },
  thresholdRequired: { type: String, required: true },
  actualValue: { type: String, required: true },
  passed: { type: Boolean, required: true },
  actionOnFail: { type: String, required: true },
  failedReason: { type: String }
});

const loanApplicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true }, // e.g. LOAN1001
  applicantId: { type: String, required: true }, // e.g. APP001
  panNumber: { type: String },
  aadhaarNumber: { type: String },
  requestedLoanAmount: { type: Number, required: true },
  requestedTenureMonths: { type: Number, required: true },
  loanType: { type: String, enum: ['PERSONAL', 'HOME', 'CAR', 'EDUCATION', 'BUSINESS'], default: 'PERSONAL' },
  profileSnapshot: { type: mongoose.Schema.Types.Mixed },
  
  status: { 
    type: String, 
    enum: ['APPROVED', 'REJECTED', 'INSUFFICIENT_DATA', 'EXCEPTION_L1_REQUIRED', 'EXCEPTION_L2_REQUIRED', 'APPROVED_VIA_EXCEPTION', 'REJECTED_VIA_EXCEPTION'], 
    required: true 
  },
  
  ruleSetVersion: { type: Number, required: true },
  
  derivedMetrics: {
    proposedEMI: { type: Number },
    foir: { type: Number },
    lti: { type: Number },
    incomeTrendPercent: { type: Number },
    bounceRatio: { type: Number }
  },
  
  scorecard: [scorecardItemSchema],
  
  evaluationResult: {
    decision: { type: String },
    riskGrade: { type: String }, // 'Grade A', 'Grade B', 'Grade C'
    riskScore: { type: Number }, // Dynamic risk level index 0-100%
    interestRatePercent: { type: Number },
    maxEligibleLoanAmount: { type: Number },
    whySummaryBadges: [{ type: String }],
    missingCriticalFields: [{ type: String }]
  },

  bureauSnapshot: {
    panNumber: { type: String },
    cibilScore: { type: Number },
    scoreCategory: { type: String },
    kycStatus: { type: String },
    writeOffs: { type: Number },
    bounceCount: { type: Number },
    mutualFunds: { type: Number },
    savings: { type: Number },
    bureauSource: { type: String }
  },

  // Credit Exception Intelligence & Case Clustering Fields
  exceptionProfileCode: { type: String }, // 'E-01', 'E-02', etc.
  triageGroup: { type: String, enum: ['GROUP_A', 'GROUP_B', 'GROUP_C'], default: 'GROUP_B' },
  escalatedToL2: { type: Boolean, default: false },
  escalatedBy: { type: String },
  escalatedAt: { type: Date },
  escalationNotes: { type: String },
  l2Decision: { type: String },
  l2DecisionBy: { type: String },
  l2DecisionAt: { type: Date },
  l2OfficerNotes: { type: String },
  
  exceptionDetails: {
    exceptionLevel: { type: String },
    deviations: [{ type: String }],
    mitigatingFactors: [{ type: String }],
    officerNotes: { type: String },
    officerId: { type: String },
    actionTimestamp: { type: Date }
  }
}, { timestamps: true });

export const LoanApplication = mongoose.model('LoanApplication', loanApplicationSchema);
