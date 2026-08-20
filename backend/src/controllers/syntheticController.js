import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { isDbConnected } from '../config/db.js';

// In-memory synthetic profiles store
const memoryProfiles = {
  APP001: {
    applicantId: 'APP001',
    name: 'Rahul Sharma',
    age: 29,
    employmentType: 'Salaried',
    declaredMonthlyIncome: 80000,
    existingEMI: 15000,
    cibilScore: 735,
    activeLoans: 2,
    dpd: 0,
    writeOffs: 0,
    defaults: 0,
    avgMonthlyBalance: 45000,
    monthlyCredits: 80000,
    bounceCount: 1,
    lastYearIncome: 850000,
    currentYearIncome: 960000,
    mutualFunds: 200000,
    savings: 50000
  }
};

export const getSyntheticProfile = async (req, res) => {
  try {
    const { applicantId } = req.params;

    if (isDbConnected) {
      try {
        const profile = await ApplicantProfile.findOne({ applicantId });
        if (profile) {
          return res.json({ success: true, data: profile });
        }
      } catch (dbErr) {
        console.warn('DB fetch fallback:', dbErr.message);
      }
    }

    if (!memoryProfiles[applicantId]) {
      memoryProfiles[applicantId] = {
        applicantId,
        name: 'Rahul Sharma',
        age: 29,
        employmentType: 'Salaried',
        declaredMonthlyIncome: 80000,
        existingEMI: 15000,
        cibilScore: 735,
        activeLoans: 2,
        dpd: 0,
        writeOffs: 0,
        defaults: 0,
        avgMonthlyBalance: 45000,
        monthlyCredits: 80000,
        bounceCount: 1,
        lastYearIncome: 850000,
        currentYearIncome: 960000,
        mutualFunds: 200000,
        savings: 50000
      };
    }

    res.json({ success: true, data: memoryProfiles[applicantId] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSyntheticProfile = async (req, res) => {
  try {
    const { applicantId } = req.params;

    if (!memoryProfiles[applicantId]) {
      memoryProfiles[applicantId] = { applicantId };
    }

    memoryProfiles[applicantId] = {
      ...memoryProfiles[applicantId],
      ...req.body
    };

    if (isDbConnected) {
      try {
        const dbProfile = await ApplicantProfile.findOneAndUpdate(
          { applicantId },
          req.body,
          { new: true, upsert: true }
        );
        return res.json({ success: true, data: dbProfile });
      } catch (dbErr) {
        console.warn('DB update fallback:', dbErr.message);
      }
    }

    res.json({ success: true, data: memoryProfiles[applicantId] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
