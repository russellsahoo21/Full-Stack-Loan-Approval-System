import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  applicationId: { type: String, required: true },
  applicantId: { type: String, required: true },
  ruleSetVersion: { type: Number, required: true },
  decision: { type: String, required: true },
  evaluatedBy: { type: String, default: 'System (Automated BRE)' },
  evaluationSnapshot: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
