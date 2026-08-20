import express from 'express';
import { 
  getActiveRuleSet, 
  getAllRuleVersions, 
  getRuleSetByVersion, 
  createNewRuleVersion 
} from '../controllers/rulesController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Read rules and versions (all authenticated users can inspect versions)
router.get('/active', getActiveRuleSet);
router.get('/versions', protect, getAllRuleVersions);
router.get('/version/:version', protect, getRuleSetByVersion);

// Version creation restricted to Policy Admin
router.post('/new-version', protect, authorize('POLICY_ADMIN'), createNewRuleVersion);

export default router;
