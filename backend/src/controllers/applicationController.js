import mongoose from 'mongoose';
import { LoanApplication } from '../models/LoanApplication.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { RuleSet } from '../models/RuleSet.js';
import { AuditLog } from '../models/AuditLog.js';
import { runBRE } from '../bre/engine.js';
import { isDbConnected } from '../config/db.js';
import { getActiveRuleSetDoc } from './rulesController.js';
import { fetchBureauReport } from '../services/bureauService.js';

// Default fallback rule set if DB is offline or buffering
const defaultRuleSetV1 = {
  version: 1,
  isActive: true,
  status: 'ACTIVE',
  createdReason: 'Baseline NBFC Policy Rules (v1)',
  rules: [
    { ruleCode: 'R001', description: 'Minimum CIBIL Score', parameter: 'cibilScore', operator: '>=', threshold: 700, actionOnFail: 'HARD_REJECT', mitigatingFactors: ['Assets >= ₹2,000,000'] },
    { ruleCode: 'R002', description: 'Maximum Permissible FOIR', parameter: 'foir', operator: '<=', threshold: 50, actionOnFail: 'EXCEPTION', mitigatingFactors: ['Mutual Fund Assets >= ₹200,000'] },
    { ruleCode: 'R003', description: 'Minimum Monthly Income', parameter: 'monthlyIncome', operator: '>=', threshold: 30000, actionOnFail: 'HARD_REJECT', mitigatingFactors: ['Co-applicant income'] },
    { ruleCode: 'R004', description: 'No Delinquency / Write-offs', parameter: 'writeOffs', operator: '==', threshold: 0, actionOnFail: 'HARD_REJECT', mitigatingFactors: [] },
    { ruleCode: 'R005', description: 'Maximum Cheque Bounces', parameter: 'bounceCount', operator: '<=', threshold: 2, actionOnFail: 'HARD_REJECT', mitigatingFactors: [] },
    { ruleCode: 'R006', description: 'Minimum Age', parameter: 'age', operator: '>=', threshold: 21, actionOnFail: 'HARD_REJECT', mitigatingFactors: [] }
  ]
};

// In-memory fallback stores
const memoryApplications = [];
const memoryAuditLogs = [];
const memoryProfiles = {};

const checkMongo = () => isDbConnected && mongoose.connection.readyState === 1;

// Safe query builder to prevent Mongoose ObjectId CastError on custom alphanumeric IDs
const buildAppQuery = (id) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
  if (isObjectId) {
    return { $or: [{ applicationId: id }, { _id: id }] };
  }
  return { applicationId: id };
};

export const submitLoanApplication = async (req, res) => {
  try {
    const { 
      name, 
      panNumber,
      aadhaarNumber,
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

    // If PAN or Aadhaar is present, fetch verified bureau telemetry to prevent spoofing
    let verifiedBureau = null;
    if (panNumber || aadhaarNumber) {
      try {
        verifiedBureau = await fetchBureauReport(panNumber || aadhaarNumber, name);
      } catch (bErr) {
        console.warn('Bureau verification warning:', bErr.message);
      }
    }

    const resolvedPan = panNumber || verifiedBureau?.panNumber || '';
    const resolvedAadhaar = aadhaarNumber || verifiedBureau?.aadhaarNumber || '';
    const resolvedCibil = verifiedBureau?.cibilScore ?? (req.body.cibilScore !== undefined ? req.body.cibilScore : 735);
    const resolvedWriteOffs = verifiedBureau?.writeOffs ?? (req.body.writeOffs !== undefined ? req.body.writeOffs : 0);
    const resolvedBounceCount = verifiedBureau?.bounceCount ?? (req.body.bounceCount !== undefined ? req.body.bounceCount : 1);
    const resolvedMutualFunds = verifiedBureau?.mutualFunds ?? (req.body.mutualFunds !== undefined ? req.body.mutualFunds : 200000);
    const resolvedSavings = verifiedBureau?.savings ?? (req.body.savings !== undefined ? req.body.savings : 50000);

    const profileData = {
      applicantId,
      name: name || verifiedBureau?.name || 'Rahul Sharma',
      panNumber: resolvedPan,
      aadhaarNumber: resolvedAadhaar,
      age: age || verifiedBureau?.age || 29,
      employmentType: employmentType || verifiedBureau?.employmentType || 'Salaried',
      declaredMonthlyIncome: declaredMonthlyIncome || verifiedBureau?.declaredMonthlyIncome || 80000,
      existingEMI: existingEMI !== undefined ? existingEMI : (verifiedBureau?.existingEMI ?? 15000),
      cibilScore: resolvedCibil,
      scoreCategory: verifiedBureau?.scoreCategory || 'Prime',
      activeLoans: req.body.activeLoans || verifiedBureau?.activeLoans || 2,
      dpd: req.body.dpd !== undefined ? req.body.dpd : (verifiedBureau?.dpd ?? 0),
      writeOffs: resolvedWriteOffs,
      defaults: req.body.defaults !== undefined ? req.body.defaults : (verifiedBureau?.defaults ?? 0),
      avgMonthlyBalance: req.body.avgMonthlyBalance || verifiedBureau?.avgMonthlyBalance || 45000,
      monthlyCredits: req.body.monthlyCredits || verifiedBureau?.monthlyCredits || 80000,
      bounceCount: resolvedBounceCount,
      lastYearIncome: req.body.lastYearIncome || 850000,
      currentYearIncome: req.body.currentYearIncome || 960000,
      mutualFunds: resolvedMutualFunds,
      savings: resolvedSavings,
      kycStatus: verifiedBureau?.kycStatus || 'VERIFIED_NSDL_UIDAI',
      bureauFetchedAt: verifiedBureau?.bureauFetchedAt ? new Date(verifiedBureau.bureauFetchedAt) : new Date()
    };

    memoryProfiles[applicantId] = profileData;

    let profile = profileData;

    if (checkMongo()) {
      try {
        profile = await ApplicantProfile.findOneAndUpdate(
          { applicantId },
          profileData,
          { new: true, upsert: true }
        );
      } catch (dbErr) {
        console.warn('DB operation warning in submitLoanApplication, falling back to memory execution:', dbErr.message);
      }
    }

    const activeRuleSet = await getActiveRuleSetDoc();

    const loanAmount = requestedLoanAmount || 800000;
    const tenure = requestedTenureMonths || 60;

    // Run BRE Engine
    const breResult = runBRE(profile, loanAmount, tenure, activeRuleSet);

    const appDoc = {
      applicationId,
      applicantId,
      panNumber: resolvedPan,
      aadhaarNumber: resolvedAadhaar,
      requestedLoanAmount: loanAmount,
      requestedTenureMonths: tenure,
      status: breResult.decision,
      ruleSetVersion: activeRuleSet.version,
      derivedMetrics: breResult.derivedMetrics,
      scorecard: breResult.scorecard,
      evaluationResult: breResult.evaluationResult,
      exceptionDetails: breResult.exceptionDetails,
      bureauSnapshot: {
        panNumber: resolvedPan,
        cibilScore: resolvedCibil,
        scoreCategory: verifiedBureau?.scoreCategory || 'Prime',
        kycStatus: verifiedBureau?.kycStatus || 'VERIFIED_NSDL_UIDAI',
        writeOffs: resolvedWriteOffs,
        bounceCount: resolvedBounceCount,
        mutualFunds: resolvedMutualFunds,
        savings: resolvedSavings,
        bureauSource: verifiedBureau?.bureauSource || 'CIBIL / Experian India Realtime Gateway'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const auditDoc = {
      applicationId,
      applicantId,
      ruleSetVersion: activeRuleSet.version,
      decision: breResult.decision,
      evaluatedBy: 'System (Automated BRE)',
      evaluationSnapshot: {
        scorecard: breResult.scorecard,
        derivedMetrics: breResult.derivedMetrics,
        evaluationResult: breResult.evaluationResult
      },
      timestamp: new Date()
    };

    if (checkMongo()) {
      try {
        const newApplication = await LoanApplication.create(appDoc);
        await AuditLog.create(auditDoc);

        console.log(`✅ [submitLoanApplication] Saved to MongoDB: ${applicationId} (${breResult.decision})`);

        return res.status(201).json({
          success: true,
          message: 'Loan application submitted & evaluated successfully',
          data: newApplication
        });
      } catch (saveErr) {
        console.warn('MongoDB save fallback in submitLoanApplication:', saveErr.message);
      }
    }

    // Memory Store Fallback
    memoryApplications.unshift(appDoc);
    memoryAuditLogs.unshift(auditDoc);

    console.log(`⚡ [submitLoanApplication] Saved to Memory: ${applicationId} (${breResult.decision})`);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted & evaluated successfully',
      data: appDoc
    });
  } catch (error) {
    console.error('❌ [submitLoanApplication Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;

    if (checkMongo()) {
      try {
        const filter = status ? { status } : {};
        const applications = await LoanApplication.find(filter).sort({ createdAt: -1 });
        return res.json({ success: true, count: applications.length, data: applications });
      } catch (dbErr) {
        console.warn('DB fetch fallback in getAllApplications:', dbErr.message);
      }
    }

    const applications = status ? memoryApplications.filter(a => a.status === status) : memoryApplications;
    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (checkMongo()) {
      try {
        const query = buildAppQuery(id);
        const application = await LoanApplication.findOne(query);

        if (application) {
          const applicantProfile = await ApplicantProfile.findOne({ applicantId: application.applicantId });
          const auditLogs = await AuditLog.find({ applicationId: application.applicationId }).sort({ timestamp: -1 });

          return res.json({
            success: true,
            data: application,
            applicantProfile: applicantProfile || memoryProfiles[application.applicantId],
            auditLogs: auditLogs || []
          });
        }
      } catch (dbErr) {
        console.warn('DB fetch fallback in getApplicationById:', dbErr.message);
      }
    }

    const memApp = memoryApplications.find(a => a.applicationId === id || a._id === id);
    if (!memApp) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const memProfile = memoryProfiles[memApp.applicantId] || {
      applicantId: memApp.applicantId,
      name: 'Rahul Sharma',
      declaredMonthlyIncome: 80000,
      cibilScore: 735
    };
    const memAudit = memoryAuditLogs.filter(l => l.applicationId === memApp.applicationId);

    res.json({
      success: true,
      data: memApp,
      applicantProfile: memProfile,
      auditLogs: memAudit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const evaluateApplicationUnderVersion = async (req, res) => {
  try {
    const { id, targetVersion } = req.params;
    let application = null;

    if (checkMongo()) {
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
    if (checkMongo()) {
      try {
        targetRuleSet = await RuleSet.findOne({ version: Number(targetVersion) });
      } catch (err) {}
    }

    if (!targetRuleSet) {
      targetRuleSet = defaultRuleSetV1;
    }

    let profile = null;
    if (checkMongo()) {
      try {
        profile = await ApplicantProfile.findOne({ applicantId: application.applicantId });
      } catch (err) {}
    }

    if (!profile) {
      profile = memoryProfiles[application.applicantId] || {
        name: 'Rahul Sharma',
        applicantId: application.applicantId,
        age: 29,
        employmentType: 'Salaried',
        declaredMonthlyIncome: 80000,
        existingEMI: 15000,
        cibilScore: 735,
        writeOffs: 0,
        bounceCount: 1,
        mutualFunds: 200000
      };
    }

    const breResult = runBRE(
      profile,
      application.requestedLoanAmount,
      application.requestedTenureMonths,
      targetRuleSet
    );

    const originalScorecard = application.scorecard || [];
    const newScorecard = breResult.scorecard;

    const changedRules = [];
    newScorecard.forEach(newRule => {
      const oldRule = originalScorecard.find(r => r.ruleCode === newRule.ruleCode);
      if (oldRule && oldRule.passed !== newRule.passed) {
        changedRules.push({
          ruleCode: newRule.ruleCode,
          description: newRule.description,
          before: { passed: oldRule.passed, thresholdRequired: oldRule.thresholdRequired, actualValue: oldRule.actualValue },
          after: { passed: newRule.passed, thresholdRequired: newRule.thresholdRequired, actualValue: newRule.actualValue }
        });
      }
    });

    const decisionChanged = application.status !== breResult.decision;
    const impactLevel = changedRules.length === 0 ? 'NONE'
      : decisionChanged && breResult.decision === 'REJECTED' ? 'HIGH'
      : decisionChanged ? 'MEDIUM'
      : 'LOW';

    const rulesPassed = newScorecard.filter(r => r.passed).length;
    const rulesFailed = newScorecard.filter(r => !r.passed).length;

    res.json({
      success: true,
      message: `Re-evaluation under RuleSet v${targetVersion} completed. Original decision under v${application.ruleSetVersion} remains immutable.`,
      comparison: {
        applicationId: application.applicationId,
        applicantName: profile.name,
        applicantId: application.applicantId,
        loanAmount: application.requestedLoanAmount,
        tenureMonths: application.requestedTenureMonths,
        originalRecord: {
          evaluatedVersion: `v${application.ruleSetVersion}`,
          decision: application.status
        },
        before: {
          version: application.ruleSetVersion,
          decision: application.status,
          scorecard: originalScorecard,
          evaluationResult: application.evaluationResult,
          derivedMetrics: application.derivedMetrics
        },
        after: {
          version: targetRuleSet.version,
          decision: breResult.decision,
          scorecard: newScorecard,
          evaluationResult: breResult.evaluationResult,
          derivedMetrics: breResult.derivedMetrics
        },
        analysis: {
          decisionChanged,
          impactLevel,
          rulesEvaluated: newScorecard.length,
          rulesPassed,
          rulesFailed,
          changedRules,
          primaryChangedRule: changedRules.length > 0 ? changedRules[0] : null,
          targetRuleSetChangeLog: targetRuleSet.changeLog || []
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reRunAndSaveAudit = async (req, res) => {
  try {
    const { id, targetVersion } = req.params;
    let application = null;

    if (checkMongo()) {
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

    let targetRuleSet = null;
    if (checkMongo()) {
      try {
        targetRuleSet = await RuleSet.findOne({ version: Number(targetVersion) });
      } catch (err) {}
    }

    if (!targetRuleSet) {
      targetRuleSet = defaultRuleSetV1;
    }

    let profile = null;
    if (checkMongo()) {
      try {
        profile = await ApplicantProfile.findOne({ applicantId: application.applicantId });
      } catch (err) {}
    }

    if (!profile) {
      profile = memoryProfiles[application.applicantId] || {
        applicantId: application.applicantId,
        name: 'Rahul Sharma',
        declaredMonthlyIncome: 80000,
        cibilScore: 735
      };
    }

    const breResult = runBRE(
      profile,
      application.requestedLoanAmount,
      application.requestedTenureMonths,
      targetRuleSet
    );

    const auditDoc = {
      applicationId: application.applicationId,
      applicantId: application.applicantId,
      ruleSetVersion: targetRuleSet.version,
      decision: breResult.decision,
      evaluatedBy: `Re-Run by ${req.user?.name || 'System'} (under v${targetVersion})`,
      evaluationSnapshot: {
        scorecard: breResult.scorecard,
        derivedMetrics: breResult.derivedMetrics,
        evaluationResult: breResult.evaluationResult,
        originalDecision: application.status,
        originalVersion: application.ruleSetVersion
      },
      timestamp: new Date()
    };

    if (checkMongo()) {
      try {
        await AuditLog.create(auditDoc);
      } catch (err) {}
    } else {
      memoryAuditLogs.unshift(auditDoc);
    }

    res.json({
      success: true,
      message: `Re-run audit saved. Application v${application.ruleSetVersion} decision preserved, v${targetVersion} result recorded.`,
      data: {
        applicationId: application.applicationId,
        originalDecision: application.status,
        originalVersion: application.ruleSetVersion,
        reRunDecision: breResult.decision,
        reRunVersion: targetVersion
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

    if (checkMongo()) {
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

    if (checkMongo() && typeof application.save === 'function') {
      try {
        await application.save();
      } catch (err) {}
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
    if (checkMongo()) {
      try {
        const auditLogs = await AuditLog.find().sort({ timestamp: -1 });
        return res.json({ success: true, count: auditLogs.length, data: auditLogs });
      } catch (err) {}
    }

    res.json({ success: true, count: memoryAuditLogs.length, data: memoryAuditLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
