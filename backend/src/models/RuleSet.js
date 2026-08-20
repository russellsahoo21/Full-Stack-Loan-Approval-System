import mongoose from 'mongoose';

const singleRuleSchema = new mongoose.Schema({
  ruleCode: { type: String, required: true }, // e.g. R001
  description: { type: String, required: true },
  parameter: { 
    type: String, 
    required: true,
    enum: ['cibilScore', 'foir', 'monthlyIncome', 'writeOffs', 'bounceCount', 'age', 'activeLoans', 'dpd']
  },
  operator: { 
    type: String, 
    required: true, 
    enum: ['>=', '<=', '==', '>', '<', '!='] 
  },
  threshold: { type: mongoose.Schema.Types.Mixed, required: true },
  actionOnFail: { 
    type: String, 
    required: true, 
    enum: ['HARD_REJECT', 'EXCEPTION'] 
  },
  mitigatingFactors: [{ type: String }]
});

const changeLogEntrySchema = new mongoose.Schema({
  ruleCode: { type: String },
  description: { type: String },
  oldThreshold: { type: mongoose.Schema.Types.Mixed },
  newThreshold: { type: mongoose.Schema.Types.Mixed },
  oldActionOnFail: { type: String },
  newActionOnFail: { type: String },
  changedBy: { type: String }
}, { _id: false });

const ruleSetSchema = new mongoose.Schema({
  version: { type: Number, required: true, unique: true },
  isActive: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'SCHEDULED'],
    default: 'ARCHIVED'
  },
  effectiveFrom: { type: Date, default: Date.now },
  createdReason: { type: String, default: 'Policy update' },
  createdBy: { type: String, default: 'POLICY_ADMIN' },
  changeLog: [changeLogEntrySchema],
  rules: [singleRuleSchema]
}, { timestamps: true });

export const RuleSet = mongoose.model('RuleSet', ruleSetSchema);
