import mongoose from 'mongoose';
import { LoanApplication } from '../models/LoanApplication.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { RuleSet } from '../models/RuleSet.js';
import { AuditLog } from '../models/AuditLog.js';
import { runBRE } from '../bre/engine.js';

// Helper to look up by either MongoDB ObjectId or custom applicationId (e.g. LOAN1001)
const findApplicationByIdOrCustomId = async (id) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
  if (isObjectId) {
    return await LoanApplication.findOne({ $or: [{ applicationId: id }, { _id: id }] });
  }
  return await LoanApplication.findOne({ applicationId: id });
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

    // Get or create applicant synthetic profile
    let profile = await ApplicantProfile.findOne({ applicantId });
    if (!profile) {
      profile = await ApplicantProfile.create({
        applicantId,
        name: name || 'Rahul Sharma',
        age: age || 29,
        employmentType: employmentType || 'Salaried',
        declaredMonthlyIncome: declaredMonthlyIncome || 80000,
        existingEMI: existingEMI || 15000,
        cibilScore: req.body.cibilScore || 735,
        activeLoans: req.body.activeLoans || 2,
        dpd: req.body.dpd || 0,
        writeOffs: req.body.writeOffs || 0,
        defaults: req.body.defaults || 0,
        avgMonthlyBalance: req.body.avgMonthlyBalance || 45000,
        monthlyCredits: req.body.monthlyCredits || 80000,
        bounceCount: req.body.bounceCount || 1,
        lastYearIncome: req.body.lastYearIncome || 850000,
        currentYearIncome: req.body.currentYearIncome || 960000,
        mutualFunds: req.body.mutualFunds || 200000,
        savings: req.body.savings || 50000
      });
    } else {
      // Update form inputs
      if (declaredMonthlyIncome) profile.declaredMonthlyIncome = declaredMonthlyIncome;
      if (existingEMI !== undefined) profile.existingEMI = existingEMI;
      if (age) profile.age = age;
      if (name) profile.name = name;
      await profile.save();
    }

    // Get active rule set
    const activeRuleSet = await RuleSet.findOne({ isActive: true });
    if (!activeRuleSet) {
      return res.status(400).json({ success: false, message: 'No active RuleSet found in database. Seed rules first.' });
    }

    const loanAmount = requestedLoanAmount || 800000;
    const tenure = requestedTenureMonths || 60;

    // Run BRE Engine
    const breResult = runBRE(profile, loanAmount, tenure, activeRuleSet);

    // Save Loan Application
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

    // Write Immutable Audit Log
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

    res.status(201).json({
      success: true,
      message: 'Loan application submitted & evaluated successfully',
      data: newApplication
    });
  } catch (error) {
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
    const application = await findApplicationByIdOrCustomId(id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const profile = await ApplicantProfile.findOne({ applicantId: application.applicantId });
    const auditLogs = await AuditLog.find({ applicationId: application.applicationId }).sort({ timestamp: -1 });

    res.json({ 
      success: true, 
      data: application, 
      applicantProfile: profile,
      auditLogs: auditLogs || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Re-evaluate application against any specific RuleSet Version (enhanced with full comparison)
export const evaluateApplicationUnderVersion = async (req, res) => {
  try {
    const { id, targetVersion } = req.params;
    const application = await findApplicationByIdOrCustomId(id);

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
    const application = await findApplicationByIdOrCustomId(id);

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
    const { action, officerNotes } = req.body; // action: 'APPROVE' or 'REJECT'

    const application = await findApplicationByIdOrCustomId(id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (action === 'APPROVE') {
      application.status = 'APPROVED_VIA_EXCEPTION';
    } else if (action === 'REJECT') {
      application.status = 'REJECTED_VIA_EXCEPTION';
    } else {
      return res.status(400).json({ success: false, message: "Action must be 'APPROVE' or 'REJECT'" });
    }

    application.exceptionDetails = {
      ...application.exceptionDetails,
      officerNotes: officerNotes || 'Reviewed by Credit Officer',
      officerId: req.user?.name || req.user?.email || 'CREDIT_OFFICER_L1',
      actionTimestamp: new Date()
    };

    await application.save();

    // Audit log update
    await AuditLog.create({
      applicationId: application.applicationId,
      applicantId: application.applicantId,
      ruleSetVersion: application.ruleSetVersion,
      decision: application.status,
      evaluatedBy: `Credit Officer (${req.user?.name || 'Officer'})`,
      evaluationSnapshot: {
        officerNotes,
        exceptionDetails: application.exceptionDetails
      }
    });

    res.json({
      success: true,
      message: `Exception application updated to ${application.status}`,
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
