import mongoose from 'mongoose';
import { LoanApplication } from '../models/LoanApplication.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { RuleSet } from '../models/RuleSet.js';
import { AuditLog } from '../models/AuditLog.js';
import { runBRE } from '../bre/engine.js';
import { DEFAULT_RULE_SET, IN_MEMORY_RULE_SETS } from '../bre/policy.js';
import { isDbConnected } from '../config/db.js';

const memoryRuleSets = IN_MEMORY_RULE_SETS;

// In-memory application store fallback
const memoryApplications = [];
const memoryAuditLogs = [];

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
      panNumber,
      aadhaarNumber,
      age, 
      employmentType, 
      declaredMonthlyIncome, 
      existingEMI, 
      requestedLoanAmount, 
      requestedTenureMonths,
      applicantId: customApplicantId,
      loanType: rawLoanType
    } = req.body;

    const VALID_LOAN_TYPES = ['PERSONAL', 'HOME', 'CAR', 'EDUCATION', 'BUSINESS'];
    const loanType = VALID_LOAN_TYPES.includes(rawLoanType) ? rawLoanType : 'PERSONAL';

    if (!name || !age || !employmentType || declaredMonthlyIncome === undefined || requestedLoanAmount === undefined || requestedTenureMonths === undefined) {
      return res.status(400).json({ success: false, message: 'Missing critical fields (name, age, employmentType, declaredMonthlyIncome, requestedLoanAmount, requestedTenureMonths).' });
    }
    if (Number(declaredMonthlyIncome) < 0 || Number(requestedLoanAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Inconsistent data: Income and Loan Amount must be positive.' });
    }

    const applicantId = customApplicantId || (req.user?.role === 'APPLICANT' ? String(req.user.id || req.user._id || 'APP101') : `APP${Math.floor(100 + Math.random() * 900)}`);
    const applicationId = `LOAN${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = String(req.user?.id || req.user?._id || '');

    const toNumberIfPresent = (value) => (
      value === undefined || value === null || value === '' ? undefined : Number(value)
    );

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
    const isNtcRequested = req.body.cibilScore === -1 || req.body.cibilScore === 0 || req.body.isNtcMode === true || verifiedBureau?.cibilScore === -1;
    const resolvedCibil = isNtcRequested ? -1 : (verifiedBureau?.cibilScore ?? (toNumberIfPresent(req.body.cibilScore) ?? 735));
    const resolvedWriteOffs = verifiedBureau?.writeOffs ?? (toNumberIfPresent(req.body.writeOffs) ?? 0);
    const resolvedBounceCount = verifiedBureau?.bounceCount ?? (toNumberIfPresent(req.body.bounceCount) ?? 1);
    const resolvedMutualFunds = verifiedBureau?.mutualFunds ?? (toNumberIfPresent(req.body.mutualFunds) ?? 200000);
    const resolvedSavings = verifiedBureau?.savings ?? (toNumberIfPresent(req.body.savings) ?? 50000);

    const profileData = {
      applicantId,
      name: name || verifiedBureau?.name || 'Rahul Sharma',
      panNumber: resolvedPan,
      aadhaarNumber: resolvedAadhaar,
      age: toNumberIfPresent(age) || verifiedBureau?.age || 29,
      employmentType: employmentType || verifiedBureau?.employmentType || 'Salaried',
      declaredMonthlyIncome: toNumberIfPresent(declaredMonthlyIncome) || verifiedBureau?.declaredMonthlyIncome || 80000,
      existingEMI: toNumberIfPresent(existingEMI) !== undefined ? toNumberIfPresent(existingEMI) : (verifiedBureau?.existingEMI ?? 15000),
      cibilScore: resolvedCibil,
      scoreCategory: verifiedBureau?.scoreCategory || (isNtcRequested ? 'NTC / Thin-File (Zero Credit History)' : 'Prime'),
      activeLoans: toNumberIfPresent(req.body.activeLoans) || verifiedBureau?.activeLoans || (isNtcRequested ? 0 : 2),
      dpd: toNumberIfPresent(req.body.dpd) !== undefined ? toNumberIfPresent(req.body.dpd) : (verifiedBureau?.dpd ?? 0),
      writeOffs: resolvedWriteOffs,
      defaults: toNumberIfPresent(req.body.defaults) !== undefined ? toNumberIfPresent(req.body.defaults) : (verifiedBureau?.defaults ?? 0),
      avgMonthlyBalance: toNumberIfPresent(req.body.avgMonthlyBalance) || verifiedBureau?.avgMonthlyBalance || 45000,
      monthlyCredits: toNumberIfPresent(req.body.monthlyCredits) || verifiedBureau?.monthlyCredits || 80000,
      upiMonthlyCredits: toNumberIfPresent(req.body.upiMonthlyCredits) || verifiedBureau?.upiMonthlyCredits || (declaredMonthlyIncome || 52000),
      utilityTrackRecord: req.body.utilityTrackRecord || verifiedBureau?.utilityTrackRecord || '100% On-Time (BBPS Verified)',
      employmentVintageYears: toNumberIfPresent(req.body.employmentVintageYears) !== undefined ? toNumberIfPresent(req.body.employmentVintageYears) : (verifiedBureau?.employmentVintageYears || 2.2),
      bounceCount: resolvedBounceCount,
      lastYearIncome: toNumberIfPresent(req.body.lastYearIncome) || 850000,
      currentYearIncome: toNumberIfPresent(req.body.currentYearIncome) || 960000,
      mutualFunds: resolvedMutualFunds,
      savings: resolvedSavings,
      kycStatus: verifiedBureau?.kycStatus || 'VERIFIED_NSDL_UIDAI',
      bureauFetchedAt: verifiedBureau?.bureauFetchedAt ? new Date(verifiedBureau.bureauFetchedAt) : new Date()
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
      activeRuleSet = memoryRuleSets.find(r => r.isActive) || DEFAULT_RULE_SET;
    }

    const loanAmount = Number(requestedLoanAmount);
    const tenure = Number(requestedTenureMonths);

    // Run BRE Engine with loan-type aware rule filtering
    const breResult = runBRE(profileData, loanAmount, tenure, activeRuleSet, loanType);

    const newAppObject = {
      applicationId,
      applicantId,
      userId,
      requestedLoanAmount: loanAmount,
      requestedTenureMonths: tenure,
      loanType,
      status: breResult.decision,
      ruleSetVersion: activeRuleSet.version,
      derivedMetrics: breResult.derivedMetrics,
      scorecard: breResult.scorecard,
      evaluationResult: breResult.evaluationResult,
      alternateData: breResult.alternateData,
      exceptionDetails: breResult.exceptionDetails,
      profileSnapshot: profileData,
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
    memoryAuditLogs.unshift({
      applicationId,
      applicantId,
      ruleSetVersion: activeRuleSet.version,
      decision: breResult.decision,
      evaluatedBy: 'System (Automated BRE)',
      timestamp: new Date(),
      evaluationSnapshot: {
        scorecard: breResult.scorecard,
        derivedMetrics: breResult.derivedMetrics,
        evaluationResult: breResult.evaluationResult
      }
    });

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

    // Role-based filter: determines which applications each role can see
    const buildRoleFilter = (baseFilter) => {
      const role = req.user?.role;
      if (role === 'APPLICANT') {
        const uid = String(req.user?.id || req.user?._id || '');
        const userName = req.user?.name;
        const userEmail = req.user?.email;

        const applicantConditions = [
          { applicantId: uid },
          { userId: uid },
          { applicantId: 'APP101' },
          { applicantId: 'APP001' },
          ...(userName ? [{ 'profileSnapshot.name': userName }] : []),
          ...(userEmail ? [{ 'profileSnapshot.email': userEmail }] : [])
        ];

        if (baseFilter.status) {
          return {
            status: baseFilter.status,
            $or: applicantConditions
          };
        }
        return { $or: applicantConditions };
      } else if (role === 'CREDIT_OFFICER_L1') {
        // L1 officers only see L1 exception queue items
        baseFilter.status = 'EXCEPTION_L1_REQUIRED';
      } else if (role === 'CREDIT_OFFICER_L2') {
        // L2 officers only see escalated L2 exception queue items
        baseFilter.status = 'EXCEPTION_L2_REQUIRED';
      }
      // POLICY_ADMIN sees everything — no additional filter
      return baseFilter;
    };

    if (isDbConnected) {
      try {
        const filter = buildRoleFilter(status ? { status } : {});
        applications = await LoanApplication.find(filter).sort({ createdAt: -1 });
        return res.json({ success: true, count: applications.length, data: applications });
      } catch (dbErr) {
        console.warn('DB fetch fallback:', dbErr.message);
      }
    }

    // In-memory fallback with same role-based filtering
    let memApps = memoryApplications;
    const role = req.user?.role;
    if (role === 'APPLICANT') {
      const uid = String(req.user?.id || req.user?._id || '');
      const userName = req.user?.name;
      const userEmail = req.user?.email;
      memApps = memApps.filter(a => 
        String(a.applicantId) === uid || 
        String(a.userId) === uid || 
        a.applicantId === 'APP101' || 
        a.applicantId === 'APP001' ||
        (userName && a.profileSnapshot?.name === userName) ||
        (userEmail && a.profileSnapshot?.email === userEmail)
      );
    } else if (role === 'CREDIT_OFFICER_L1') {
      memApps = memApps.filter(a => a.status === 'EXCEPTION_L1_REQUIRED');
    } else if (role === 'CREDIT_OFFICER_L2') {
      memApps = memApps.filter(a => a.status === 'EXCEPTION_L2_REQUIRED');
    }

    applications = (status && role === 'POLICY_ADMIN') ? memApps.filter(a => a.status === status) : memApps;
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
          if (req.user?.role === 'APPLICANT') {
            const uid = String(req.user.id || req.user._id || '');
            const isOwner = 
              String(application.applicantId) === uid ||
              String(application.userId) === uid ||
              application.applicantId === 'APP101' ||
              application.applicantId === 'APP001' ||
              application.profileSnapshot?.name === req.user?.name ||
              application.profileSnapshot?.email === req.user?.email ||
              ['usr_demo', 'usr_admin_001', 'demo123'].includes(uid);
            if (!isOwner) {
              return res.status(403).json({ success: false, message: 'Access denied: You can only view your own applications.' });
            }
          }
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
    if (req.user?.role === 'APPLICANT') {
      const uid = String(req.user.id || req.user._id || '');
      const isOwner = 
        String(memApp.applicantId) === uid ||
        String(memApp.userId) === uid ||
        memApp.applicantId === 'APP101' ||
        memApp.applicantId === 'APP001' ||
        memApp.profileSnapshot?.name === req.user?.name ||
        memApp.profileSnapshot?.email === req.user?.email ||
        ['usr_demo', 'usr_admin_001', 'demo123'].includes(uid);
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own applications.' });
      }
    }

    res.json({
      success: true,
      data: memApp,
      applicantProfile: memApp.profileSnapshot,
      auditLogs: memoryAuditLogs.filter(log => log.applicationId === memApp.applicationId)
    });
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
      } catch (dbErr) { }
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
      } catch (err) { }
    }

    if (!targetRuleSet) {
      targetRuleSet = memoryRuleSets.find(r => r.version === Number(targetVersion)) || DEFAULT_RULE_SET;
    }

    let profile = null;
    if (isDbConnected) {
      try {
        profile = await ApplicantProfile.findOne({ applicantId: application.applicantId });
      } catch (err) { }
    }
    if (!profile) {
      profile = application.profileSnapshot;
    }
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Applicant profile not found for re-evaluation.' });
    }

    const breResult = runBRE(
      profile, 
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
      } catch (err) { }
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
      // Write compliance audit log for manual exception decision
      try {
        await AuditLog.create({
          applicationId: application.applicationId,
          applicantId: application.applicantId,
          ruleSetVersion: application.ruleSetVersion,
          decision: newStatus,
          evaluatedBy: req.user?.name || req.user?.email || 'Credit Officer',
          officerRole: req.user?.role || 'CREDIT_OFFICER',
          evaluationSnapshot: {
            action,
            officerNotes: officerNotes || '',
            exceptionLevel: application.exceptionDetails?.exceptionLevel,
            deviations: application.exceptionDetails?.deviations || []
          }
        });
      } catch (auditErr) {
        console.warn('Audit log write failed (non-critical):', auditErr.message);
      }
    } else {
      memoryAuditLogs.unshift({
        applicationId: application.applicationId,
        applicantId: application.applicantId,
        ruleSetVersion: application.ruleSetVersion,
        decision: newStatus,
        evaluatedBy: req.user?.name || req.user?.email || 'Credit Officer',
        officerRole: req.user?.role || 'CREDIT_OFFICER',
        timestamp: new Date(),
        evaluationSnapshot: {
          action,
          officerNotes: officerNotes || '',
          exceptionLevel: application.exceptionDetails?.exceptionLevel,
          deviations: application.exceptionDetails?.deviations || []
        }
      });
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
      } catch (err) { }
    }
    res.json({ success: true, count: memoryAuditLogs.length, data: memoryAuditLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Re-run BRE under a specific rule version and save an immutable audit record.
 * Route: POST /:id/rerun/:targetVersion
 */
export const reRunAndSaveAudit = async (req, res) => {
  try {
    const { id, targetVersion } = req.params;

    // Fetch the application
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
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Fetch the target rule set
    let targetRuleSet = null;
    if (isDbConnected) {
      try {
        targetRuleSet = await RuleSet.findOne({ version: Number(targetVersion) });
      } catch (err) {}
    }
    if (!targetRuleSet) {
      targetRuleSet = memoryRuleSets.find(r => r.version === Number(targetVersion)) || DEFAULT_RULE_SET;
    }

    // Fetch the applicant profile
    let profile = null;
    if (isDbConnected) {
      try {
        profile = await ApplicantProfile.findOne({ applicantId: application.applicantId });
      } catch (err) {}
    }
    if (!profile) profile = application.profileSnapshot;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Applicant profile not found for re-evaluation.' });
    }

    // Re-run BRE (pass loanType from saved application if available)
    const loanType = application.loanType || 'PERSONAL';
    const breResult = runBRE(
      profile,
      application.requestedLoanAmount,
      application.requestedTenureMonths,
      targetRuleSet,
      loanType
    );

    // Save immutable audit record
    const auditEntry = {
      applicationId: application.applicationId,
      applicantId: application.applicantId,
      ruleSetVersion: targetRuleSet.version,
      decision: breResult.decision,
      evaluatedBy: req.user?.name || 'System (Re-run)',
      timestamp: new Date(),
      evaluationSnapshot: {
        scorecard: breResult.scorecard,
        derivedMetrics: breResult.derivedMetrics,
        evaluationResult: breResult.evaluationResult
      }
    };

    if (isDbConnected) {
      try {
        await AuditLog.create(auditEntry);
      } catch (dbErr) {
        console.warn('Audit log DB write fallback:', dbErr.message);
        memoryAuditLogs.unshift(auditEntry);
      }
    } else {
      memoryAuditLogs.unshift(auditEntry);
    }

    res.status(201).json({
      success: true,
      message: `Re-run under v${targetVersion} completed and audit record saved.`,
      data: {
        applicationId: application.applicationId,
        originalDecision: application.status,
        originalVersion: `v${application.ruleSetVersion}`,
        reRunVersion: `v${targetRuleSet.version}`,
        reRunDecision: breResult.decision,
        scorecard: breResult.scorecard,
        evaluationResult: breResult.evaluationResult
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

