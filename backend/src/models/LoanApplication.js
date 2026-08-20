import mongoose from 'mongoose';

const scorecardItemSchema = new mongoose.Schema({
  ruleCode: { type: String, required: true },
  description: { type: String, required: true },
  thresholdRequired: { type: String, required: true },
  actualValue: { type: String, required: true },
  passed: { type: Boolean, required: true },
  actionOnFail: { type: String, required: true },
  failedReason: { type: String }
});

const loanApplicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true }, // e.g. LOAN1001
  applicantId: { type: String, required: true }, // e.g. APP001
  requestedLoanAmount: { type: Number, required: true },
  requestedTenureMonths: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['APPROVED', 'REJECTED', 'EXCEPTION_REQUIRED', 'APPROVED_VIA_EXCEPTION', 'REJECTED_VIA_EXCEPTION'], 
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
    interestRatePercent: { type: Number },
    maxEligibleLoanAmount: { type: Number },
    whySummaryBadges: [{ type: String }]
  },
  
  exceptionDetails: {
    deviations: [{ type: String }],
    mitigatingFactors: [{ type: String }],
    officerNotes: { type: String },
    officerId: { type: String },
    actionTimestamp: { type: Date }
  }
}, { timestamps: true });

export const LoanApplication = mongoose.model('LoanApplication', loanApplicationSchema);
