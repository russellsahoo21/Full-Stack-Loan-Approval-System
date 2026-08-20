import { RuleSet } from '../models/RuleSet.js';
import { isDbConnected } from '../config/db.js';
import { IN_MEMORY_RULE_SETS } from '../bre/policy.js';

// Default in-memory rule set versions store
const memoryRuleSets = IN_MEMORY_RULE_SETS;

export const getActiveRuleSet = async (req, res) => {
  try {
    if (isDbConnected) {
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
    if (isDbConnected) {
      try {
        const versions = await RuleSet.find().sort({ version: -1 });
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
    const { rules, config, createdReason } = req.body;

    const maxVer = memoryRuleSets.reduce((max, r) => r.version > max ? r.version : max, 1);
    const nextVersion = maxVer + 1;

    // Deactivate previous active rule set in memory
    memoryRuleSets.forEach(r => r.isActive = false);

    const newRuleSet = {
      version: nextVersion,
      isActive: true,
      createdReason: createdReason || `Created version ${nextVersion}`,
      createdBy: req.user?.name || 'POLICY_ADMIN',
      createdAt: new Date(),
      config: config || memoryRuleSets[0].config,
      rules: rules || memoryRuleSets[0].rules
    };

    memoryRuleSets.unshift(newRuleSet);

    if (isDbConnected) {
      try {
        await RuleSet.updateMany({ isActive: true }, { isActive: false });
        const dbRuleSet = await RuleSet.create({
          version: nextVersion,
          isActive: true,
          createdReason: createdReason || `Created version ${nextVersion}`,
          createdBy: req.user?.name || 'POLICY_ADMIN',
          config: config || memoryRuleSets[0].config,
          rules: rules || memoryRuleSets[0].rules
        });
        return res.status(201).json({
          success: true,
          message: `Version ${nextVersion} activated successfully! Zero backend code changes needed.`,
          data: dbRuleSet
        });
      } catch (dbErr) {
        console.warn('DB write fallback:', dbErr.message);
      }
    }

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
 * Patch a single rule in the active rule set by ruleCode and auto-create a new version.
 * Body: { ruleCode, patch: { threshold?, operator?, actionOnFail? }, createdReason? }
 */
export const patchRuleAndCreateVersion = async (req, res) => {
  try {
    const { ruleCode, patch, createdReason } = req.body;

    if (!ruleCode || !patch) {
      return res.status(400).json({ success: false, message: 'ruleCode and patch object are required.' });
    }

    // Get the current active rule set
    let baseRuleSet = memoryRuleSets.find(r => r.isActive) || memoryRuleSets[0];

    if (isDbConnected) {
      try {
        const dbActive = await RuleSet.findOne({ isActive: true });
        if (dbActive) baseRuleSet = dbActive.toObject();
      } catch (dbErr) {
        console.warn('DB fetch fallback:', dbErr.message);
      }
    }

    // Find and patch the target rule
    const ruleIndex = baseRuleSet.rules.findIndex(r => r.ruleCode === ruleCode);
    if (ruleIndex === -1) {
      return res.status(404).json({ success: false, message: `Rule with ruleCode '${ruleCode}' not found in active rule set.` });
    }

    const patchedRules = baseRuleSet.rules.map(r =>
      r.ruleCode === ruleCode ? { ...r, ...patch } : { ...r }
    );

    const maxVer = memoryRuleSets.reduce((max, r) => r.version > max ? r.version : max, 1);
    const nextVersion = maxVer + 1;

    memoryRuleSets.forEach(r => r.isActive = false);

    const newRuleSet = {
      version: nextVersion,
      isActive: true,
      createdReason: createdReason || `Patched rule ${ruleCode} — auto-versioned`,
      createdBy: req.user?.name || 'POLICY_ADMIN',
      createdAt: new Date(),
      config: baseRuleSet.config,
      rules: patchedRules
    };

    memoryRuleSets.unshift(newRuleSet);

    if (isDbConnected) {
      try {
        await RuleSet.updateMany({ isActive: true }, { isActive: false });
        const dbRuleSet = await RuleSet.create({
          version: nextVersion,
          isActive: true,
          createdReason: newRuleSet.createdReason,
          createdBy: newRuleSet.createdBy,
          config: newRuleSet.config,
          rules: newRuleSet.rules
        });
        return res.status(201).json({
          success: true,
          message: `Rule ${ruleCode} patched and saved as version ${nextVersion}.`,
          data: dbRuleSet
        });
      } catch (dbErr) {
        console.warn('DB write fallback:', dbErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Rule ${ruleCode} patched and saved as version ${nextVersion}.`,
      data: newRuleSet
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

