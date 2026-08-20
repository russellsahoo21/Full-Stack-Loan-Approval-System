import express from 'express';
import { 
  getActiveRuleSet, 
  getAllRuleVersions, 
  getRuleSetByVersion, 
  createNewRuleVersion,
  patchRuleAndCreateVersion
} from '../controllers/rulesController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Active rules can be read publicly (or by applicants)
router.get('/active', getActiveRuleSet);

// Version management restricted to Policy Admin
router.get('/versions', protect, authorize('POLICY_ADMIN'), getAllRuleVersions);
router.get('/version/:version', protect, authorize('POLICY_ADMIN'), getRuleSetByVersion);
router.post('/new-version', protect, authorize('POLICY_ADMIN'), createNewRuleVersion);

// Patch a single rule → create new version automatically
router.post('/patch-version', protect, authorize('POLICY_ADMIN'), patchRuleAndCreateVersion);

export default router;
