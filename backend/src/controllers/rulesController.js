import mongoose from 'mongoose';
import { RuleSet } from '../models/RuleSet.js';
import { isDbConnected } from '../config/db.js';

// Default in-memory rule set versions store
const memoryRuleSets = [
  {
    version: 1,
    isActive: true,
    status: 'ACTIVE',
    createdReason: 'Baseline NBFC Policy Rules (v1)',
    createdBy: 'Policy Admin',
    createdAt: new Date(),
    rules: [
      { ruleCode: 'R001', description: 'Minimum CIBIL Score', parameter: 'cibilScore', operator: '>=', threshold: 700, actionOnFail: 'HARD_REJECT', mitigatingFactors: ['Assets >= ₹2,000,000'] },
      { ruleCode: 'R002', description: 'Maximum Permissible FOIR', parameter: 'foir', operator: '<=', threshold: 50, actionOnFail: 'EXCEPTION', mitigatingFactors: ['Mutual Fund Assets >= ₹200,000'] },
      { ruleCode: 'R003', description: 'Minimum Monthly Income', parameter: 'monthlyIncome', operator: '>=', threshold: 30000, actionOnFail: 'HARD_REJECT' },
      { ruleCode: 'R004', description: 'No Delinquency / Write-offs', parameter: 'writeOffs', operator: '==', threshold: 0, actionOnFail: 'HARD_REJECT' },
      { ruleCode: 'R005', description: 'Maximum Cheque Bounces', parameter: 'bounceCount', operator: '<=', threshold: 2, actionOnFail: 'HARD_REJECT' },
      { ruleCode: 'R006', description: 'Minimum Age', parameter: 'age', operator: '>=', threshold: 21, actionOnFail: 'HARD_REJECT' }
    ]
  }
];

const checkMongo = () => isDbConnected && mongoose.connection.readyState === 1;

export const getActiveRuleSet = async (req, res) => {
  try {
    if (checkMongo()) {
      try {
        const activeRuleSet = await RuleSet.findOne({ isActive: true });
        if (activeRuleSet) {
          return res.json({ success: true, data: activeRuleSet });
        }
      } catch (dbErr) {
        console.warn('DB fetch fallback:', dbErr.message);
      }
    }

    const activeSet = memoryRuleSets.find(r => r.isActive) || memoryRuleSets[0];
    res.json({ success: true, data: activeSet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllRuleVersions = async (req, res) => {
  try {
    if (checkMongo()) {
      try {
        const versions = await RuleSet.find().sort({ version: -1 });
        if (versions && versions.length > 0) {
          return res.json({ success: true, count: versions.length, data: versions });
        }
      } catch (dbErr) {
        console.warn('DB fetch fallback:', dbErr.message);
      }
    }

    res.json({ success: true, count: memoryRuleSets.length, data: memoryRuleSets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRuleSetByVersion = async (req, res) => {
  try {
    const versionNum = Number(req.params.version);

    if (checkMongo()) {
      try {
        const ruleSet = await RuleSet.findOne({ version: versionNum });
        if (ruleSet) {
          return res.json({ success: true, data: ruleSet });
        }
      } catch (dbErr) {
        console.warn('DB fetch fallback:', dbErr.message);
      }
    }

    const set = memoryRuleSets.find(r => r.version === versionNum);
    if (!set) {
      return res.status(404).json({ success: false, message: `Rule set version ${req.params.version} not found` });
    }

    res.json({ success: true, data: set });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNewRuleVersion = async (req, res) => {
  try {
    const { rules, createdReason, effectiveFrom } = req.body;

    let nextVersion = 2;

    if (checkMongo()) {
      try {
        const latestSet = await RuleSet.findOne().sort({ version: -1 });
        nextVersion = latestSet ? latestSet.version + 1 : (memoryRuleSets[0]?.version || 1) + 1;

        await RuleSet.updateMany({ isActive: true }, { isActive: false, status: 'ARCHIVED' });
        const dbRuleSet = await RuleSet.create({
          version: nextVersion,
          isActive: true,
          status: 'ACTIVE',
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
          createdReason: createdReason || `Created version ${nextVersion}`,
          createdBy: req.user?.name || 'POLICY_ADMIN',
          rules: rules || memoryRuleSets[0].rules
        });

        // Sync to memory
        memoryRuleSets.forEach(r => { r.isActive = false; r.status = 'ARCHIVED'; });
        memoryRuleSets.unshift(dbRuleSet.toObject());

        return res.status(201).json({
          success: true,
          message: `Version v${nextVersion} activated successfully! Zero backend code changes needed.`,
          data: dbRuleSet
        });
      } catch (dbErr) {
        console.warn('DB write fallback in createNewRuleVersion:', dbErr.message);
      }
    }

    // Memory fallback
    const maxVer = memoryRuleSets.reduce((max, r) => (r.version > max ? r.version : max), 1);
    nextVersion = maxVer + 1;

    memoryRuleSets.forEach(r => { r.isActive = false; r.status = 'ARCHIVED'; });
    const newRuleSet = {
      version: nextVersion,
      isActive: true,
      status: 'ACTIVE',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      createdReason: createdReason || `Created version ${nextVersion}`,
      createdBy: req.user?.name || 'POLICY_ADMIN',
      createdAt: new Date(),
      rules: rules || memoryRuleSets[0].rules
    };
    memoryRuleSets.unshift(newRuleSet);

    res.status(201).json({
      success: true,
      message: `Version v${nextVersion} activated successfully! Zero backend code changes needed.`,
      data: newRuleSet
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Patch a single rule threshold → automatically creates a new version
 * preserving all other rules unchanged. Generates a changeLog entry.
 */
export const patchRuleAndCreateVersion = async (req, res) => {
  try {
    const { ruleCode, newThreshold, newActionOnFail, changeReason, effectiveFrom, changedBy } = req.body;

    if (!ruleCode || newThreshold === undefined) {
      return res.status(400).json({ success: false, message: 'ruleCode and newThreshold are required' });
    }

    let currentActive = null;

    if (checkMongo()) {
      try {
        currentActive = await RuleSet.findOne({ isActive: true });
      } catch (err) {
        console.warn('DB read fallback in patchRuleAndCreateVersion:', err.message);
      }
    }

    if (!currentActive) {
      currentActive = memoryRuleSets.find(r => r.isActive) || memoryRuleSets[0];
    }

    // Find the rule being changed
    const targetRule = currentActive.rules.find(r => r.ruleCode === ruleCode);
    if (!targetRule) {
      return res.status(404).json({ success: false, message: `Rule ${ruleCode} not found in active rule set` });
    }

    // Build change log entry
    const changeLogEntry = {
      ruleCode: targetRule.ruleCode,
      description: targetRule.description,
      oldThreshold: targetRule.threshold,
      newThreshold: Number(newThreshold),
      oldActionOnFail: targetRule.actionOnFail,
      newActionOnFail: newActionOnFail || targetRule.actionOnFail,
      changedBy: changedBy || req.user?.name || 'POLICY_ADMIN',
      timestamp: new Date()
    };

    // Clone all rules from current active, patching the changed one
    const patchedRules = currentActive.rules.map(rule => {
      if (rule.ruleCode === ruleCode) {
        return {
          ruleCode: rule.ruleCode,
          description: rule.description,
          parameter: rule.parameter,
          operator: rule.operator,
          threshold: Number(newThreshold),
          actionOnFail: newActionOnFail || rule.actionOnFail,
          mitigatingFactors: rule.mitigatingFactors || []
        };
      }
      return {
        ruleCode: rule.ruleCode,
        description: rule.description,
        parameter: rule.parameter,
        operator: rule.operator,
        threshold: rule.threshold,
        actionOnFail: rule.actionOnFail,
        mitigatingFactors: rule.mitigatingFactors || []
      };
    });

    let nextVersion = (currentActive.version || 1) + 1;

    if (checkMongo()) {
      try {
        const latestSet = await RuleSet.findOne().sort({ version: -1 });
        if (latestSet) {
          nextVersion = latestSet.version + 1;
        }

        // Archive current active
        await RuleSet.updateMany({ isActive: true }, { isActive: false, status: 'ARCHIVED' });

        // Create new version with change log in MongoDB
        const dbRuleSet = await RuleSet.create({
          version: nextVersion,
          isActive: true,
          status: 'ACTIVE',
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
          createdReason: changeReason || `Patched ${ruleCode}: ${changeLogEntry.oldThreshold} → ${changeLogEntry.newThreshold}`,
          createdBy: changedBy || req.user?.name || 'POLICY_ADMIN',
          changeLog: [changeLogEntry],
          rules: patchedRules
        });

        // Sync memory store
        memoryRuleSets.forEach(r => { r.isActive = false; r.status = 'ARCHIVED'; });
        memoryRuleSets.unshift(dbRuleSet.toObject ? dbRuleSet.toObject() : dbRuleSet);

        return res.status(201).json({
          success: true,
          message: `Version v${nextVersion} created — ${ruleCode} threshold: ${changeLogEntry.oldThreshold} → ${changeLogEntry.newThreshold}`,
          data: dbRuleSet,
          changeLog: changeLogEntry,
          previousVersion: currentActive.version,
          newVersion: nextVersion
        });
      } catch (dbErr) {
        console.warn('DB write fallback in patchRuleAndCreateVersion:', dbErr.message);
      }
    }

    // Memory Fallback
    const maxVer = memoryRuleSets.reduce((max, r) => (r.version > max ? r.version : max), 1);
    nextVersion = maxVer + 1;

    memoryRuleSets.forEach(r => { r.isActive = false; r.status = 'ARCHIVED'; });
    const newRuleSet = {
      version: nextVersion,
      isActive: true,
      status: 'ACTIVE',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      createdReason: changeReason || `Patched ${ruleCode}: ${changeLogEntry.oldThreshold} → ${changeLogEntry.newThreshold}`,
      createdBy: changedBy || req.user?.name || 'POLICY_ADMIN',
      changeLog: [changeLogEntry],
      rules: patchedRules,
      createdAt: new Date()
    };
    memoryRuleSets.unshift(newRuleSet);

    res.status(201).json({
      success: true,
      message: `Version v${nextVersion} created — ${ruleCode} threshold: ${changeLogEntry.oldThreshold} → ${changeLogEntry.newThreshold}`,
      data: newRuleSet,
      changeLog: changeLogEntry,
      previousVersion: currentActive.version,
      newVersion: nextVersion
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
