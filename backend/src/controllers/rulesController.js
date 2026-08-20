import { RuleSet } from '../models/RuleSet.js';

export const getActiveRuleSet = async (req, res) => {
  try {
    const activeRuleSet = await RuleSet.findOne({ isActive: true });
    if (!activeRuleSet) {
      return res.status(404).json({ success: false, message: 'No active rule set found' });
    }
    res.json({ success: true, data: activeRuleSet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllRuleVersions = async (req, res) => {
  try {
    const versions = await RuleSet.find().sort({ version: -1 });
    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRuleSetByVersion = async (req, res) => {
  try {
    const ruleSet = await RuleSet.findOne({ version: req.params.version });
    if (!ruleSet) {
      return res.status(404).json({ success: false, message: `Rule set version ${req.params.version} not found` });
    }
    res.json({ success: true, data: ruleSet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNewRuleVersion = async (req, res) => {
  try {
    const { rules, createdReason, effectiveFrom } = req.body;

    // Find latest version number
    const latestSet = await RuleSet.findOne().sort({ version: -1 });
    const nextVersion = latestSet ? latestSet.version + 1 : 1;

    // Archive all previous versions
    await RuleSet.updateMany({ isActive: true }, { isActive: false, status: 'ARCHIVED' });

    // Create and activate new version
    const newRuleSet = await RuleSet.create({
      version: nextVersion,
      isActive: true,
      status: 'ACTIVE',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      createdReason: createdReason || `Created version ${nextVersion}`,
      createdBy: req.user?.name || 'POLICY_ADMIN',
      rules
    });

    res.status(201).json({
      success: true,
      message: `Version ${nextVersion} activated successfully! Zero backend code changes needed.`,
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

    // Get current active rule set to clone from
    const currentActive = await RuleSet.findOne({ isActive: true });
    if (!currentActive) {
      return res.status(400).json({ success: false, message: 'No active rule set found to patch from' });
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

    // Find next version
    const latestSet = await RuleSet.findOne().sort({ version: -1 });
    const nextVersion = latestSet ? latestSet.version + 1 : 1;

    // Archive current active
    await RuleSet.updateMany({ isActive: true }, { isActive: false, status: 'ARCHIVED' });

    // Create new version with change log
    const newRuleSet = await RuleSet.create({
      version: nextVersion,
      isActive: true,
      status: 'ACTIVE',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      createdReason: changeReason || `Patched ${ruleCode}: ${changeLogEntry.oldThreshold} → ${changeLogEntry.newThreshold}`,
      createdBy: changedBy || req.user?.name || 'POLICY_ADMIN',
      changeLog: [changeLogEntry],
      rules: patchedRules
    });

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
