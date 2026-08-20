import { RuleSet } from '../models/RuleSet.js';
import { isDbConnected } from '../config/db.js';

// Default in-memory rule set versions store
const memoryRuleSets = [
  {
    version: 1,
    isActive: true,
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

// Helper to get or auto-seed the active rule set
const getOrCreateActiveRuleSet = async () => {
  if (isDbConnected) {
    try {
      let activeRuleSet = await RuleSet.findOne({ isActive: true });
      if (!activeRuleSet) {
        // If DB connected but no active RuleSet exists, check for any RuleSet
        const latest = await RuleSet.findOne().sort({ version: -1 });
        if (latest) {
          latest.isActive = true;
          latest.status = 'ACTIVE';
          await latest.save();
          return latest;
        }

        // Auto-seed Baseline Version 1 into MongoDB
        console.log('⚡ [BRE Rules] Auto-seeding Baseline RuleSet v1 into MongoDB...');
        activeRuleSet = await RuleSet.create({
          version: 1,
          isActive: true,
          status: 'ACTIVE',
          createdReason: 'Baseline NBFC Policy Rules (v1)',
          createdBy: 'Policy Admin',
          rules: memoryRuleSets[0].rules
        });
      }
      return activeRuleSet;
    } catch (dbErr) {
      console.warn('⚠️ [Rules] DB fetch failed, using memory fallback:', dbErr.message);
    }
  }

  // Memory fallback
  return memoryRuleSets.find(r => r.isActive) || memoryRuleSets[0];
};

export const getActiveRuleSet = async (req, res) => {
  try {
    const activeRuleSet = await getOrCreateActiveRuleSet();
    res.json({ success: true, data: activeRuleSet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllRuleVersions = async (req, res) => {
  try {
    if (isDbConnected) {
      try {
        let versions = await RuleSet.find().sort({ version: -1 });
        if (versions.length === 0) {
          // Auto-seed Baseline v1
          const baseline = await getOrCreateActiveRuleSet();
          versions = [baseline];
        }
        return res.json({ success: true, count: versions.length, data: versions });
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

    if (isDbConnected) {
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

    if (isDbConnected) {
      try {
        // Find latest version number
        const latestSet = await RuleSet.findOne().sort({ version: -1 });
        const nextVersion = latestSet ? latestSet.version + 1 : 1;

        // Archive all previous versions in MongoDB
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

        return res.status(201).json({
          success: true,
          message: `Version v${nextVersion} activated successfully! Zero backend code changes needed.`,
          data: dbRuleSet
        });
      } catch (dbErr) {
        console.warn('DB write fallback:', dbErr.message);
      }
    }

    // Memory fallback
    const latestVersion = memoryRuleSets.length > 0 ? Math.max(...memoryRuleSets.map(r => r.version)) : 0;
    const nextVersion = latestVersion + 1;

    memoryRuleSets.forEach(r => r.isActive = false);
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

    // Get active rule set (auto-seeds Baseline v1 if MongoDB collection is empty)
    const currentActive = await getOrCreateActiveRuleSet();

    if (!currentActive || !currentActive.rules) {
      return res.status(400).json({ success: false, message: 'No active rule set available to patch from' });
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
      changedBy: changedBy || req.user?.name || 'POLICY_ADMIN'
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

    if (isDbConnected) {
      try {
        // Find next version number
        const latestSet = await RuleSet.findOne().sort({ version: -1 });
        const nextVersion = latestSet ? latestSet.version + 1 : (currentActive.version || 1) + 1;

        // Archive current active
        await RuleSet.updateMany({ isActive: true }, { isActive: false, status: 'ARCHIVED' });

        // Create new version with change log
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

        return res.status(201).json({
          success: true,
          message: `Version v${nextVersion} created — ${ruleCode} threshold: ${changeLogEntry.oldThreshold} → ${changeLogEntry.newThreshold}`,
          data: dbRuleSet,
          changeLog: changeLogEntry,
          previousVersion: currentActive.version,
          newVersion: nextVersion
        });
      } catch (dbErr) {
        console.warn('DB patch write fallback:', dbErr.message);
      }
    }

    // In-memory fallback
    const latestVersion = memoryRuleSets.length > 0 ? Math.max(...memoryRuleSets.map(r => r.version)) : 0;
    const nextVersion = latestVersion + 1;

    memoryRuleSets.forEach(r => r.isActive = false);
    const newRuleSet = {
      version: nextVersion,
      isActive: true,
      status: 'ACTIVE',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      createdReason: changeReason || `Patched ${ruleCode}: ${changeLogEntry.oldThreshold} → ${changeLogEntry.newThreshold}`,
      createdBy: changedBy || req.user?.name || 'POLICY_ADMIN',
      createdAt: new Date(),
      changeLog: [changeLogEntry],
      rules: patchedRules
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
