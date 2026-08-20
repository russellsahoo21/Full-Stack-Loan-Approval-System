import { LoanApplication } from '../models/LoanApplication.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { RuleSet } from '../models/RuleSet.js';
import { AuditLog } from '../models/AuditLog.js';
import { runBRE } from '../bre/engine.js';

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
    const application = await LoanApplication.findOne({ 
      $or: [{ applicationId: id }, { _id: id }] 
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const profile = await ApplicantProfile.findOne({ applicantId: application.applicantId });

    res.json({ 
      success: true, 
      data: application, 
      applicantProfile: profile 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Demo Proof: Re-evaluate application against any specific RuleSet Version
export const evaluateApplicationUnderVersion = async (req, res) => {
  try {
    const { id, targetVersion } = req.params;
    const application = await LoanApplication.findOne({ 
      $or: [{ applicationId: id }, { _id: id }] 
    });

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

    res.json({
      success: true,
      message: `Re-evaluation under RuleSet Version v${targetVersion} completed (Original decision under v${application.ruleSetVersion} remains immutable).`,
      comparison: {
        applicationId: application.applicationId,
        applicantName: profile.name,
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

// Exception handling by Credit Officer (L1/L2)
export const handleExceptionDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, officerNotes } = req.body; // action: 'APPROVE' or 'REJECT'

    const application = await LoanApplication.findOne({ 
      $or: [{ applicationId: id }, { _id: id }] 
    });

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
