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

// Applicants can submit applications
router.post('/apply', submitLoanApplication);

// Only Admins and Credit Officers can view all applications
router.get('/all', protect, authorize('POLICY_ADMIN', 'CREDIT_OFFICER_L1', 'CREDIT_OFFICER_L2'), getAllApplications);

// Protected application lookup by ID
router.get('/:id', protect, getApplicationById);

// Version evaluation comparison (Admin & Officers)
router.get('/:id/evaluate-version/:targetVersion', protect, authorize('POLICY_ADMIN', 'CREDIT_OFFICER_L1', 'CREDIT_OFFICER_L2'), evaluateApplicationUnderVersion);

// Exception decision approval/rejection (Admin & Officers)
router.post('/:id/exception', protect, authorize('CREDIT_OFFICER_L1', 'CREDIT_OFFICER_L2', 'POLICY_ADMIN'), handleExceptionDecision);

export default router;
