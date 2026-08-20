import mongoose from 'mongoose';

const singleRuleSchema = new mongoose.Schema({
  ruleCode: { type: String, required: true }, // e.g. R001
  description: { type: String, required: true },
  parameter: { 
    type: String, 
    required: true,
    enum: ['cibilScore', 'foir', 'monthlyIncome', 'writeOffs', 'bounceCount', 'age', 'activeLoans', 'dpd', 'lti', 'incomeTrendPercent']
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
    enum: ['HARD_REJECT', 'EXCEPTION_L1', 'EXCEPTION_L2', 'EXCEPTION'] 
  },
  reasonCode: { type: String },
  mitigatingFactors: [{ type: String }]
});

const ruleSetSchema = new mongoose.Schema({
  version: { type: Number, required: true, unique: true },
  isActive: { type: Boolean, default: false },
  createdReason: { type: String, default: 'Policy update' },
  createdBy: { type: String, default: 'POLICY_ADMIN' },
  config: { type: mongoose.Schema.Types.Mixed },
  rules: [singleRuleSchema]
}, { timestamps: true });

export const RuleSet = mongoose.model('RuleSet', ruleSetSchema);
