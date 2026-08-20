import express from 'express';
import { 
  getMacroBenchmark, 
  updateMacroBenchmark, 
  resetMacroBenchmark,
  calculateDynamicBorrowerAPR
} from '../services/macroBenchmarkService.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public / Authenticated read endpoint for live macro ticker and rates
router.get('/current', (req, res) => {
  try {
    const benchmark = getMacroBenchmark();
    res.json({
      success: true,
      data: benchmark
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update or Simulate RBI MPC Rate Decisions (Policy Admin / Officers)
router.post('/update-benchmark', protect, authorize('POLICY_ADMIN', 'CREDIT_OFFICER_L1', 'CREDIT_OFFICER_L2'), (req, res) => {
  try {
    const updated = updateMacroBenchmark(req.body);
    res.json({
      success: true,
      message: 'RBI Macroeconomic Benchmark & EBLR Rates updated live',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset benchmark back to standard RBI baseline
router.post('/reset', protect, authorize('POLICY_ADMIN'), (req, res) => {
  try {
    const reset = resetMacroBenchmark();
    res.json({
      success: true,
      message: 'Macroeconomic benchmark reset to RBI 6.50% baseline',
      data: reset
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Calculate test APR quote for a hypothetical borrower
router.post('/calculate-apr', (req, res) => {
  try {
    const result = calculateDynamicBorrowerAPR(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
