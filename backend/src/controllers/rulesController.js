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
    const { rules, createdReason } = req.body;
    
    // Find latest version number
    const latestSet = await RuleSet.findOne().sort({ version: -1 });
    const nextVersion = latestSet ? latestSet.version + 1 : 1;

    // Deactivate previous active rule set
    await RuleSet.updateMany({ isActive: true }, { isActive: false });

    // Create and activate new version
    const newRuleSet = await RuleSet.create({
      version: nextVersion,
      isActive: true,
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
