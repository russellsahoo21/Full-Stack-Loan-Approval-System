import express from 'express';
import { 
  fetchBureauReport, 
  KNOWN_BUREAU_PROFILES, 
  isValidPAN, 
  isValidAadhaar 
} from '../services/bureauService.js';

const router = express.Router();

// Fetch Bureau & KYC report by PAN or Aadhaar
router.post('/fetch-report', async (req, res) => {
  try {
    const { identifier, name } = req.body;
    
    if (!identifier || identifier.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid PAN Card number (e.g. ABCDE1234F) or Aadhaar number.' 
      });
    }

    const clean = identifier.trim().toUpperCase().replace(/\s+/g, '');

    // Format validation check
    const isPan = isValidPAN(clean);
    const isAadhaar = isValidAadhaar(clean);

    if (!isPan && !isAadhaar && clean.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid identification format. PAN must be 10 alphanumeric characters (e.g. ABCDE1234F) or Aadhaar must be 12 digits.'
      });
    }

    const bureauData = await fetchBureauReport(clean, name);

    return res.json({
      success: true,
      message: 'KYC & Credit Bureau report fetched successfully',
      data: bureauData
    });
  } catch (error) {
    console.error('Bureau fetch error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch bureau report'
    });
  }
});

// Get list of standard demo profiles for quick selection in UI
router.get('/demo-profiles', (req, res) => {
  try {
    const demos = KNOWN_BUREAU_PROFILES.map((p) => ({
      panNumber: p.panNumber,
      aadhaarNumber: p.aadhaarNumber,
      name: p.name,
      applicantId: p.applicantId,
      cibilScore: p.cibilScore,
      scoreCategory: p.scoreCategory,
      declaredMonthlyIncome: p.declaredMonthlyIncome,
      existingEMI: p.existingEMI,
      employmentType: p.employmentType,
      mutualFunds: p.mutualFunds,
      savings: p.savings,
      writeOffs: p.writeOffs,
      bounceCount: p.bounceCount,
      expectedOutcome: p.expectedOutcome,
      creditSummary: p.creditSummary
    }));

    return res.json({
      success: true,
      data: demos
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get ALL pre-configured mock bureau entries with full telemetry
router.get('/all', (req, res) => {
  try {
    return res.json({
      success: true,
      totalCount: KNOWN_BUREAU_PROFILES.length,
      bureauSource: 'CIBIL / Experian / NSDL / UIDAI Mock Gateway',
      data: KNOWN_BUREAU_PROFILES
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
