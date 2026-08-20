// Macro Benchmark & RBI Repo-Linked Dynamic Pricing Engine
// Compliant with RBI External Benchmark Lending Rate (EBLR) Guidelines

export const DEFAULT_MACRO_BENCHMARK = {
  rbiRepoRate: 6.50,          // Current RBI Policy Repo Rate (%)
  rbiReverseRepoRate: 6.25,   // Standing Deposit Facility / Reverse Repo (%)
  cpiInflationRate: 5.10,     // Annualized CPI Headline Inflation (%)
  gSec10YYield: 7.05,         // 10-Year Indian Government Benchmark Bond Yield (%)
  mclr1Year: 8.85,            // 1-Year Marginal Cost of Funds Based Lending Rate (%)
  rbiUnsecuredRiskWeight: 125,// RBI Capital Charge Multiplier for Unsecured Credit (%)
  lastMpcMeetingDate: '2024-04-05',
  monetaryStance: 'Withdrawal of Accommodation (Hawkish Hold)',
  source: 'Reserve Bank of India (RBI) & Financial Benchmarks India (FBIL)',
  isLiveMarketFeed: true,
  lastUpdated: new Date().toISOString()
};

// Facility Base Spreads over RBI Policy Repo Rate
export const FACILITY_SPREAD_CONFIGS = {
  HOME: {
    label: 'Home Loan',
    baseSpread: 2.00,       // 6.50% (Repo) + 2.00% = 8.50%
    riskWeightMultiplier: 0.75, // Lower capital charge for secured mortgages
    minRate: 7.50,
    maxRate: 12.00,
    category: 'Secured Priority Mortgage'
  },
  CAR: {
    label: 'Car Loan',
    baseSpread: 3.00,       // 6.50% (Repo) + 3.00% = 9.50%
    riskWeightMultiplier: 1.00,
    minRate: 8.50,
    maxRate: 14.50,
    category: 'Secured Vehicle Asset'
  },
  PERSONAL: {
    label: 'Personal Loan',
    baseSpread: 5.50,       // 6.50% (Repo) + 5.50% = 12.00% - 14.50%
    riskWeightMultiplier: 1.25, // RBI 125% risk weight on unsecured personal loans
    minRate: 11.00,
    maxRate: 24.00,
    category: 'Unsecured Consumer Credit'
  },
  BUSINESS: {
    label: 'Business Loan',
    baseSpread: 4.50,       // 6.50% (Repo) + 4.50% = 11.00% - 13.50%
    riskWeightMultiplier: 1.00,
    minRate: 9.50,
    maxRate: 18.00,
    category: 'MSME Working Capital'
  },
  EDUCATION: {
    label: 'Education Loan',
    baseSpread: 4.00,       // 6.50% (Repo) + 4.00% = 10.50%
    riskWeightMultiplier: 0.75,
    minRate: 8.50,
    maxRate: 14.00,
    category: 'Priority Sector Education'
  }
};

// Mutable active state
let currentBenchmark = { ...DEFAULT_MACRO_BENCHMARK };

export const getMacroBenchmark = () => {
  return {
    ...currentBenchmark,
    facilityRates: calculateFacilityRates(currentBenchmark.rbiRepoRate)
  };
};

export const updateMacroBenchmark = (updates) => {
  if (updates.rbiRepoRate !== undefined) {
    const rate = Number(updates.rbiRepoRate);
    if (!isNaN(rate) && rate >= 3.0 && rate <= 15.0) {
      currentBenchmark.rbiRepoRate = Math.round(rate * 100) / 100;
    }
  }

  if (updates.cpiInflationRate !== undefined) {
    currentBenchmark.cpiInflationRate = Number(updates.cpiInflationRate);
  }
  if (updates.gSec10YYield !== undefined) {
    currentBenchmark.gSec10YYield = Number(updates.gSec10YYield);
  }
  if (updates.mclr1Year !== undefined) {
    currentBenchmark.mclr1Year = Number(updates.mclr1Year);
  }
  if (updates.rbiUnsecuredRiskWeight !== undefined) {
    currentBenchmark.rbiUnsecuredRiskWeight = Number(updates.rbiUnsecuredRiskWeight);
  }
  if (updates.monetaryStance) {
    currentBenchmark.monetaryStance = updates.monetaryStance;
  }

  currentBenchmark.lastUpdated = new Date().toISOString();

  return getMacroBenchmark();
};

export const resetMacroBenchmark = () => {
  currentBenchmark = { 
    ...DEFAULT_MACRO_BENCHMARK, 
    lastUpdated: new Date().toISOString() 
  };
  return getMacroBenchmark();
};

/**
 * Calculates base annual interest rate for each facility type dynamically linked to repo rate
 */
export const calculateFacilityRates = (repoRate = currentBenchmark.rbiRepoRate) => {
  const result = {};
  
  for (const [facility, cfg] of Object.entries(FACILITY_SPREAD_CONFIGS)) {
    // Additional inflation/risk-weight macro premium
    const riskWeightSurcharge = (currentBenchmark.rbiUnsecuredRiskWeight > 100 && facility === 'PERSONAL') 
      ? ((currentBenchmark.rbiUnsecuredRiskWeight - 100) / 100) * 0.50 
      : 0;

    const baseCalculatedRate = Math.round((repoRate + cfg.baseSpread + riskWeightSurcharge) * 100) / 100;
    const finalRate = Math.max(cfg.minRate, Math.min(cfg.maxRate, baseCalculatedRate));

    result[facility] = {
      facility,
      label: cfg.label,
      repoRate,
      baseSpread: cfg.baseSpread,
      riskWeightSurcharge,
      finalBaseRate: finalRate,
      formula: `EBLR [Repo ${repoRate}%] + Spread [${cfg.baseSpread}%]${riskWeightSurcharge > 0 ? ` + RBI Risk Surcharge [${riskWeightSurcharge}%]` : ''} = ${finalRate}% p.a.`
    };
  }

  return result;
};

/**
 * Calculates dynamic personalized borrower APR based on Live EBLR Repo Rate + Risk Premium
 */
export const calculateDynamicBorrowerAPR = ({
  loanType = 'PERSONAL',
  cibilScore = 750,
  foir = 40,
  isNtc = false,
  alternateScore = 80,
  writeOffs = 0,
  bounceCount = 0
}) => {
  const facility = (loanType || 'PERSONAL').toUpperCase();
  const facilityInfo = calculateFacilityRates()[facility] || calculateFacilityRates()['PERSONAL'];
  const baseRate = facilityInfo.finalBaseRate;

  let riskAdjustment = 0;

  if (isNtc) {
    // NTC / Alternate cashflow scored borrower
    if (alternateScore >= 85) riskAdjustment = 0.50;
    else if (alternateScore >= 70) riskAdjustment = 1.25;
    else riskAdjustment = 2.50;
  } else {
    // Bureau Scored Borrower
    if (cibilScore >= 780) riskAdjustment = -0.50; // Super prime discount
    else if (cibilScore >= 740) riskAdjustment = 0.00; // Prime standard
    else if (cibilScore >= 700) riskAdjustment = +1.00; // Near prime
    else if (cibilScore >= 650) riskAdjustment = +2.25; // Subprime
    else riskAdjustment = +3.75; // High risk

    // FOIR stretch premium
    if (foir > 50) riskAdjustment += 0.50;
    if (foir > 60) riskAdjustment += 0.75;

    // Cheque bounce penalty
    if (bounceCount === 1) riskAdjustment += 0.25;
    else if (bounceCount >= 2) riskAdjustment += 0.75;
  }

  const finalApr = Math.round((baseRate + riskAdjustment) * 100) / 100;

  return {
    finalApr: Math.max(7.50, Math.min(26.00, finalApr)),
    repoRate: currentBenchmark.rbiRepoRate,
    baseRate,
    baseSpread: facilityInfo.baseSpread,
    riskAdjustment: Math.round(riskAdjustment * 100) / 100,
    eblrFormula: `EBLR Base [Repo ${currentBenchmark.rbiRepoRate}% + ${facilityInfo.baseSpread}%] + Borrower Risk Spread [${riskAdjustment >= 0 ? `+${riskAdjustment}` : riskAdjustment}%] = ${finalApr}%`
  };
};
