import mongoose from 'mongoose';
import { LoanApplication } from '../models/LoanApplication.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { RuleSet } from '../models/RuleSet.js';
import { AuditLog } from '../models/AuditLog.js';
import { runBRE } from '../bre/engine.js';

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
      mutualFunds: req.body.mutualFunds !== undefined ? req.body.mutualFunds : 200000,
      savings: req.body.savings !== undefined ? req.body.savings : 50000
    };

    // Upsert applicant profile in MongoDB with updated telemetry
    const profile = await ApplicantProfile.findOneAndUpdate(
      { applicantId },
      profileData,
      { new: true, upsert: true }
    );

    // Get active RuleSet
    let activeRuleSet = await RuleSet.findOne({ isActive: true });
    if (!activeRuleSet) {
      activeRuleSet = await RuleSet.findOne().sort({ version: -1 });
    }

    if (!activeRuleSet) {
      return res.status(400).json({ success: false, message: 'No active RuleSet found in database. Seed rules first.' });
    }

    const loanAmount = requestedLoanAmount || 800000;
    const tenure = requestedTenureMonths || 60;

    // Run BRE Engine
    const breResult = runBRE(profile, loanAmount, tenure, activeRuleSet);

    // Save Loan Application document in MongoDB
    const newApplication = await LoanApplication.create({
      applicationId,
      applicantId,
      requestedLoanAmount: loanAmount,
      requestedTenureMonths: tenure,
      status: breResult.decision,
      ruleSetVersion: activeRuleSet.version,
      derivedMetrics: breResult.derivedMetrics,
      scorecard: breResult.scorecard,
      evaluationResult: breResult.evaluationResult,
      exceptionDetails: breResult.exceptionDetails
    });

    // Save Immutable Audit Log in MongoDB
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

    console.log(`✅ [submitLoanApplication] Saved application ${applicationId} for ${applicantId} with status: ${breResult.decision}`);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted & evaluated successfully',
      data: newApplication
    });
  } catch (error) {
    console.error('❌ [submitLoanApplication Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const applications = await LoanApplication.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = buildAppQuery(id);
    const application = await LoanApplication.findOne(query);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const applicantProfile = await ApplicantProfile.findOne({ applicantId: application.applicantId });
    const auditLogs = await AuditLog.find({ applicationId: application.applicationId }).sort({ timestamp: -1 });

    res.json({
      success: true,
      data: application,
      applicantProfile,
      auditLogs: auditLogs || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

<<<<<<< HEAD
// Re-evaluate application against any specific RuleSet Version (enhanced with full comparison)
=======
>>>>>>> main
export const evaluateApplicationUnderVersion = async (req, res) => {
  try {
    const { id, targetVersion } = req.params;
    const query = buildAppQuery(id);
    const application = await LoanApplication.findOne(query);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const targetRuleSet = await RuleSet.findOne({ version: Number(targetVersion) });
    if (!targetRuleSet) {
      return res.status(404).json({ success: false, message: `RuleSet Version v${targetVersion} not found` });
    }

    let profile = await ApplicantProfile.findOne({ applicantId: application.applicantId });
    if (!profile) {
      profile = {
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
    }

    // Run BRE under the target version
    const breResult = runBRE(
      profile,
      application.requestedLoanAmount,
      application.requestedTenureMonths,
      targetRuleSet
    );

    // Build rule-level comparison: which rules changed result?
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

    // Stats
    const rulesPassed = newScorecard.filter(r => r.passed).length;
    const rulesFailed = newScorecard.filter(r => !r.passed).length;

    res.json({
      success: true,
<<<<<<< HEAD
      message: `Re-evaluation under RuleSet v${targetVersion} completed. Original decision under v${application.ruleSetVersion} remains immutable.`,
      comparison: {
        applicationId: application.applicationId,
        applicantName: profile.name,
        applicantId: application.applicantId,
        loanAmount: application.requestedLoanAmount,
        tenureMonths: application.requestedTenureMonths,
        before: {
          version: application.ruleSetVersion,
          decision: application.status,
          scorecard: originalScorecard,
          evaluationResult: application.evaluationResult,
          derivedMetrics: application.derivedMetrics
=======
      message: `Re-evaluation under RuleSet Version v${targetVersion} completed`,
      comparison: {
        applicationId: application.applicationId,
        originalRecord: {
          evaluatedVersion: `v${application.ruleSetVersion}`,
          decision: application.status
>>>>>>> main
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

// Re-run under a version AND save immutable audit record
export const reRunAndSaveAudit = async (req, res) => {
  try {
    const { id, targetVersion } = req.params;
    const application = await LoanApplication.findOne(buildAppQuery(id));

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const targetRuleSet = await RuleSet.findOne({ version: Number(targetVersion) });
    if (!targetRuleSet) {
      return res.status(404).json({ success: false, message: `RuleSet version ${targetVersion} not found` });
    }

    const profile = await ApplicantProfile.findOne({ applicantId: application.applicantId });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Applicant profile not found' });
    }

    const breResult = runBRE(
      profile,
      application.requestedLoanAmount,
      application.requestedTenureMonths,
      targetRuleSet
    );

    // Save immutable audit trail entry for this re-run
    await AuditLog.create({
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
      }
    });

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

// Exception handling by Credit Officer (L1/L2)
export const handleExceptionDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, officerNotes } = req.body;

    const query = buildAppQuery(id);
    const application = await LoanApplication.findOne(query);

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

    await application.save();

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
    const auditLogs = await AuditLog.find().sort({ timestamp: -1 });
    res.json({ success: true, count: auditLogs.length, data: auditLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
