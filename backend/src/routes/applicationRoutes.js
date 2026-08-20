import express from 'express';
import { 
  submitLoanApplication, 
  getAllApplications, 
  getApplicationById, 
  evaluateApplicationUnderVersion, 
  handleExceptionDecision 
} from '../controllers/applicationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/apply', submitLoanApplication);
router.get('/all', getAllApplications);
router.get('/:id', getApplicationById);
router.get('/:id/evaluate-version/:targetVersion', evaluateApplicationUnderVersion);
router.post('/:id/exception', protect, authorize('CREDIT_OFFICER_L1', 'CREDIT_OFFICER_L2', 'POLICY_ADMIN'), handleExceptionDecision);

export default router;
