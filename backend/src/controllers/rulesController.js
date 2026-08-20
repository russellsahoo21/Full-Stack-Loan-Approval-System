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
    const { rules, createdReason } = req.body;

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
