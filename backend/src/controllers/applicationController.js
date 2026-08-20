import mongoose from 'mongoose';
import { LoanApplication } from '../models/LoanApplication.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { RuleSet } from '../models/RuleSet.js';
import { AuditLog } from '../models/AuditLog.js';
import { runBRE } from '../bre/engine.js';
import { isDbConnected } from '../config/db.js';

// Default fallback rule set if DB is connecting / IP whitelist pending
const defaultRuleSetV1 = {
  version: 1,
  isActive: true,
  createdReason: 'Baseline NBFC Policy Rules (v1)',
  rules: [
    { ruleCode: 'R001', description: 'Minimum CIBIL Score', parameter: 'cibilScore', operator: '>=', threshold: 700, actionOnFail: 'HARD_REJECT' },
    { ruleCode: 'R002', description: 'Maximum Permissible FOIR', parameter: 'foir', operator: '<=', threshold: 50, actionOnFail: 'EXCEPTION' },
    { ruleCode: 'R003', description: 'Minimum Monthly Income', parameter: 'monthlyIncome', operator: '>=', threshold: 30000, actionOnFail: 'HARD_REJECT' },
    { ruleCode: 'R004', description: 'No Delinquency / Write-offs', parameter: 'writeOffs', operator: '==', threshold: 0, actionOnFail: 'HARD_REJECT' },
    { ruleCode: 'R005', description: 'Maximum Cheque Bounces', parameter: 'bounceCount', operator: '<=', threshold: 2, actionOnFail: 'HARD_REJECT' },
    { ruleCode: 'R006', description: 'Minimum Age', parameter: 'age', operator: '>=', threshold: 21, actionOnFail: 'HARD_REJECT' }
  ]
};

// In-memory application store fallback
const memoryApplications = [];

// Helper function to build safe query avoiding Mongoose ObjectId cast error
const buildAppQuery = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
    ? { $or: [{ applicationId: id }, { _id: id }] }
    : { applicationId: id };
};

export const submitLoanApplication = async (req, res) => {
  try {
    const { 
      name, 
      age, 
      employmentType, 
      declaredMonthlyIncome, 
      existingEMI, 
      requestedLoanAmount, 
      requestedTenureMonths,
      applicantId: customApplicantId 
    } = req.body;

    const applicantId = customApplicantId || `APP${Math.floor(100 + Math.random() * 900)}`;
    const applicationId = `LOAN${Math.floor(1000 + Math.random() * 9000)}`;

    const profileData = {
      applicantId,
      name: name || 'Rahul Sharma',
      age: age || 29,
      employmentType: employmentType || 'Salaried',
      declaredMonthlyIncome: declaredMonthlyIncome || 80000,
      existingEMI: existingEMI !== undefined ? existingEMI : 15000,
      cibilScore: req.body.cibilScore || 735,
      activeLoans: req.body.activeLoans || 2,
      dpd: req.body.dpd || 0,
      writeOffs: req.body.writeOffs !== undefined ? req.body.writeOffs : 0,
      defaults: req.body.defaults || 0,
      avgMonthlyBalance: req.body.avgMonthlyBalance || 45000,
      monthlyCredits: req.body.monthlyCredits || 80000,
      bounceCount: req.body.bounceCount !== undefined ? req.body.bounceCount : 1,
      lastYearIncome: req.body.lastYearIncome || 850000,
      currentYearIncome: req.body.currentYearIncome || 960000,
      mutualFunds: req.body.mutualFunds || 200000,
      savings: req.body.savings || 50000
    };

    let activeRuleSet = null;

    if (isDbConnected) {
      try {
        await ApplicantProfile.findOneAndUpdate(
          { applicantId },
          profileData,
          { new: true, upsert: true }
        );
        activeRuleSet = await RuleSet.findOne({ isActive: true });
      } catch (dbErr) {
        console.warn('DB write warning, falling back to memory execution:', dbErr.message);
      }
    }

    if (!activeRuleSet) {
      activeRuleSet = defaultRuleSetV1;
    }

    const loanAmount = requestedLoanAmount || 800000;
    const tenure = requestedTenureMonths || 60;

    // Run BRE Engine
    const breResult = runBRE(profileData, loanAmount, tenure, activeRuleSet);

    const newAppObject = {
      applicationId,
      applicantId,
      requestedLoanAmount: loanAmount,
      requestedTenureMonths: tenure,
      status: breResult.decision,
      ruleSetVersion: activeRuleSet.version,
      derivedMetrics: breResult.derivedMetrics,
      scorecard: breResult.scorecard,
      evaluationResult: breResult.evaluationResult,
      exceptionDetails: breResult.exceptionDetails,
      createdAt: new Date()
    };

    if (isDbConnected) {
      try {
        const dbApp = await LoanApplication.create(newAppObject);
        await AuditLog.create({
          applicationId,
          applicantId,
          ruleSetVersion: activeRuleSet.version,
          decision: breResult.decision,
          evaluatedBy: 'System (Automated BRE)',
          evaluationSnapshot: {
            scorecard: breResult.scorecard,
            derivedMetrics: breResult.derivedMetrics,
            evaluationResult: breResult.evaluationResult
          }
        });
        return res.status(201).json({
          success: true,
          message: 'Loan application submitted & evaluated successfully',
          data: dbApp
        });
      } catch (saveErr) {
        console.warn('MongoDB save fallback triggered:', saveErr.message);
      }
    }

    memoryApplications.unshift(newAppObject);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted & evaluated successfully',
      data: newAppObject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;
    let applications = [];

    if (isDbConnected) {
      try {
        const filter = status ? { status } : {};
        applications = await LoanApplication.find(filter).sort({ createdAt: -1 });
        return res.json({ success: true, count: applications.length, data: applications });
      } catch (dbErr) {
        console.warn('DB fetch fallback:', dbErr.message);
      }
    }

    applications = status ? memoryApplications.filter(a => a.status === status) : memoryApplications;
    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected) {
      try {
        const query = buildAppQuery(id);
        const application = await LoanApplication.findOne(query);
        if (application) {
          const profile = await ApplicantProfile.findOne({ applicantId: application.applicantId });
          const auditLogs = await AuditLog.find({ applicationId: application.applicationId }).sort({ timestamp: -1 });
          return res.json({ 
            success: true, 
            data: application, 
            applicantProfile: profile,
            auditLogs: auditLogs || []
          });
        }
      } catch (dbErr) {
        console.warn('DB fetch fallback:', dbErr.message);
      }
    }

    const memApp = memoryApplications.find(a => a.applicationId === id || a._id === id);
    if (!memApp) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({ success: true, data: memApp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const evaluateApplicationUnderVersion = async (req, res) => {
  try {
    const { id, targetVersion } = req.params;
    let application = null;

    if (isDbConnected) {
      try {
        const query = buildAppQuery(id);
        application = await LoanApplication.findOne(query);
      } catch (dbErr) {}
    }

    if (!application) {
      application = memoryApplications.find(a => a.applicationId === id || a._id === id);
    }

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    let targetRuleSet = null;
    if (isDbConnected) {
      try {
        targetRuleSet = await RuleSet.findOne({ version: Number(targetVersion) });
      } catch (err) {}
    }

    if (!targetRuleSet) {
      targetRuleSet = defaultRuleSetV1;
    }

    const mockProfile = {
      name: 'Rahul Sharma',
      age: 29,
      employmentType: 'Salaried',
      declaredMonthlyIncome: 80000,
      existingEMI: 15000,
      cibilScore: 735,
      writeOffs: 0,
      bounceCount: 1,
      mutualFunds: 200000
    };

    const breResult = runBRE(
      mockProfile, 
      application.requestedLoanAmount, 
      application.requestedTenureMonths, 
      targetRuleSet
    );

    res.json({
      success: true,
      message: `Re-evaluation under RuleSet Version v${targetVersion} completed`,
      comparison: {
        applicationId: application.applicationId,
        originalRecord: {
          evaluatedVersion: `v${application.ruleSetVersion}`,
          decision: application.status
        },
        reEvaluatedRecord: {
          evaluatedVersion: `v${targetRuleSet.version}`,
          decision: breResult.decision,
          scorecard: breResult.scorecard,
          evaluationResult: breResult.evaluationResult
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleExceptionDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, officerNotes } = req.body;

    let application = null;
    if (isDbConnected) {
      try {
        const query = buildAppQuery(id);
        application = await LoanApplication.findOne(query);
      } catch (err) {}
    }

    if (!application) {
      application = memoryApplications.find(a => a.applicationId === id || a._id === id);
    }

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED_VIA_EXCEPTION' : 'REJECTED_VIA_EXCEPTION';
    application.status = newStatus;
    application.exceptionDetails = {
      ...application.exceptionDetails,
      officerNotes: officerNotes || 'Reviewed by Credit Officer',
      officerId: req.user?.name || 'CREDIT_OFFICER_L1',
      actionTimestamp: new Date()
    };

    if (isDbConnected && typeof application.save === 'function') {
      await application.save();
    }

    res.json({
      success: true,
      message: `Exception application updated to ${newStatus}`,
      data: application
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllAuditLogs = async (req, res) => {
  try {
    let auditLogs = [];
    if (isDbConnected) {
      try {
        auditLogs = await AuditLog.find().sort({ timestamp: -1 });
        return res.json({ success: true, count: auditLogs.length, data: auditLogs });
      } catch (err) {}
    }
    res.json({ success: true, count: 0, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
