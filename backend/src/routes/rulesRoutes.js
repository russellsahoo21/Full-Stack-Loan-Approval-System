import express from 'express';
import { 
  getActiveRuleSet, 
  getAllRuleVersions, 
  getRuleSetByVersion, 
  createNewRuleVersion 
} from '../controllers/rulesController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/active', getActiveRuleSet);
router.get('/versions', getAllRuleVersions);
router.get('/version/:version', getRuleSetByVersion);
router.post('/new-version', protect, authorize('POLICY_ADMIN'), createNewRuleVersion);

export default router;
