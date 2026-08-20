import express from 'express';
import { 
  processCopilotQuery, 
  runMacroStressTest, 
  optimizeLoanPricing, 
  FRAUD_DEMO_CASES 
} from '../services/aiIntelligenceService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// 1. POST /api/ai/copilot/chat
router.post('/copilot/chat', protect, async (req, res) => {
  try {
    const { message, persona, context } = req.body;
    const response = await processCopilotQuery({ message, persona, context });
    return res.json({
      success: true,
      data: response
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST /api/ai/stress-test/simulate
router.post('/stress-test/simulate', protect, (req, res) => {
  try {
    const { repoRateHikeBps, inflationShockPercent, unemploymentSurgePercent, sectorDownturn } = req.body;
    const simulationResult = runMacroStressTest({
      repoRateHikeBps: Number(repoRateHikeBps) || 100,
      inflationShockPercent: Number(inflationShockPercent) || 6.5,
      unemploymentSurgePercent: Number(unemploymentSurgePercent) || 8.0,
      sectorDownturn: sectorDownturn || 'IT_TECH'
    });

    return res.json({
      success: true,
      data: simulationResult
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GET /api/ai/fraud/cases & POST /api/ai/fraud/analyze
router.get('/fraud/cases', protect, (req, res) => {
  return res.json({
    success: true,
    count: FRAUD_DEMO_CASES.length,
    data: FRAUD_DEMO_CASES
  });
});

router.post('/fraud/analyze', protect, (req, res) => {
  try {
    const { panNumber, caseId } = req.body;
    const match = FRAUD_DEMO_CASES.find(c => c.caseId === caseId || c.panNumber === panNumber) || FRAUD_DEMO_CASES[0];
    return res.json({
      success: true,
      data: match
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. POST /api/ai/pricing/optimize
router.post('/pricing/optimize', protect, (req, res) => {
  try {
    const { cibilScore, foir, requestedAmount, tenureMonths, costOfFundsPercent } = req.body;
    const pricing = optimizeLoanPricing({
      cibilScore: Number(cibilScore) || 740,
      foir: Number(foir) || 42,
      requestedAmount: Number(requestedAmount) || 1000000,
      tenureMonths: Number(tenureMonths) || 60,
      costOfFundsPercent: Number(costOfFundsPercent) || 7.25
    });

    return res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
