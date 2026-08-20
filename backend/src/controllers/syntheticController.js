import { ApplicantProfile } from '../models/ApplicantProfile.js';

export const getSyntheticProfile = async (req, res) => {
  try {
    const { applicantId } = req.params;
    let profile = await ApplicantProfile.findOne({ applicantId });

    if (!profile) {
      // Default synthetic profile fallback
      profile = {
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

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSyntheticProfile = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const profile = await ApplicantProfile.findOneAndUpdate(
      { applicantId },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
