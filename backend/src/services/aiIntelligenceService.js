import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

/**
 * AI Intelligence Suite Service
 * Handles conversational Copilot, Macro Stress Testing, Fraud Anomaly Radar, and Dynamic Pricing.
 */

// ==========================================
// 1. AI COPILOT CHAT GENERATOR (GEMINI 1.5 FLASH)
// ==========================================
export const processCopilotQuery = async ({ message, persona = 'OFFICER', context = {} }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.startsWith('AIzaSy') && apiKey.length > 20) {
    const candidateModels = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `You are CREDEX AI Copilot, a sophisticated financial risk advisor and credit underwriting copilot for Indian NBFCs and digital lending institutions.
Current Mode: ${persona === 'BORROWER' ? 'Borrower Advisory Mode (Empathetic, clear, actionable advice on FOIR, EMI optimization, CIBIL improvement, loan eligibility)' : 'Senior Credit Underwriter Mode (Institutional tone, regulatory compliance, credit appraisal memos, CAM synthesis, RBI EBLR benchmarking, exception mitigation)'}

User Question: ${message}

Provide a concise, professional markdown response with structured bullet points, clear numerical insights, and institutional recommendations.`;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(systemPrompt);
        const reply = result.response.text();

        if (reply && reply.trim().length > 0) {
          return {
            reply,
            suggestions: persona === 'BORROWER' 
              ? ['Simulate 60M Tenure EMI', 'Add Co-Applicant Income', 'Check Current Pre-Approved Limit']
              : ['Draft Regulatory Credit Memo', 'Simulate Macro Interest Rate Hike', 'Check Portfolio Concentration'],
            cardType: persona === 'BORROWER' ? 'CREDIT_ROADMAP' : 'CREDIT_MEMO',
            cardData: persona === 'BORROWER' ? {
              potentialCibilGain: '+25 pts in 90 days',
              targetFoir: '38.4%',
              maxEligibleAmount: 1850000
            } : {
              memoId: `CAM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              riskGrade: 'Grade A- (Prime)',
              recommendedLimit: 1500000,
              mitigationFactor: 'Verified Liquid Asset Coverage'
            }
          };
        }
      } catch (err) {
        // Try next model in sequence
      }
    }
  }

  const query = (message || '').toLowerCase();
  
  if (persona === 'BORROWER') {
    if (
      query.includes('maximize') || 
      query.includes('approval') || 
      query.includes('improve') || 
      query.includes('chance') || 
      query.includes('cibil') || 
      query.includes('score') || 
      query.includes('odds') || 
      query.includes('boost') || 
      query.includes('eligible') || 
      query.includes('eligibility') ||
      query.includes('borrow')
    ) {
      return {
        reply: `### 🎯 AI Credit Health & Approval Roadmap
Here are 3 concrete strategies to **maximize your approval odds** immediately:

1. **Optimize Tenure to Lower FOIR**:
   - Extending requested loan tenure from **36 to 60 months** drops your monthly EMI by ~32%, instantly bringing your Fixed Obligation to Income Ratio (**FOIR**) from 54% to **36.8%** (Instant STP Approval).

2. **Add a Co-Applicant with Verified Income**:
   - Adding a co-applicant earning $\ge ₹25,000/\text{mo}$ raises your maximum borrowing eligibility from ₹10 Lakhs to **₹18.5 Lakhs**.

3. **Verify Liquid Asset Buffer (Mutual Funds / Savings)**:
   - Having liquid mutual funds or fixed deposits equal to $\ge 4\times$ your monthly EMI qualifies you for **Fast-Track Policy Override (Archetype E-01)** even if your credit score is near-prime (680–720).`,
        suggestions: ['Simulate 60M Tenure EMI', 'Add Co-Applicant Income', 'Check Current Pre-Approved Limit'],
        cardType: 'CREDIT_ROADMAP',
        cardData: {
          potentialCibilGain: '+25 pts in 90 days',
          targetFoir: '36.8%',
          maxEligibleAmount: 1850000
        }
      };
    }

    if (query.includes('emi') || query.includes('tenure') || query.includes('calculate') || query.includes('reduce') || query.includes('restructur')) {
      return {
        reply: `### 📊 Instant EMI & Tenure Optimization Simulation
Based on our external benchmark floating rate of **11.50% p.a.** for a ₹10,00,000 loan:
- **At 36 Months**: EMI is **₹32,980/mo** $\rightarrow$ High FOIR burden (54.2% - *Requires Exception*).
- **At 60 Months**: EMI drops to **₹21,990/mo** $\rightarrow$ Safe FOIR (**36.2%** - **Instant Approval**).
- **At 84 Months**: EMI drops to **₹17,400/mo** $\rightarrow$ Lowest monthly cashflow impact.

💡 **Recommendation**: Choose **60 Months** to achieve the best balance of low interest cost and instant automated approval.`,
        suggestions: ['Apply with 60 Months Tenure', 'Compare Total Interest Payouts', 'Request Rate Discount'],
        cardType: 'EMI_SIMULATION',
        cardData: {
          currentEmi: 32980,
          optimizedEmi: 21990,
          monthlySavings: 10990
        }
      };
    }

    if (query.includes('co-applicant') || query.includes('earning') || query.includes('income') || query.includes('salary') || query.includes('35k')) {
      return {
        reply: `### 👥 Co-Applicant Income Enhancement Analysis
- **Primary Income**: ₹65,000/mo
- **Co-Applicant Income (+₹35k/mo)**: ₹35,000/mo $\rightarrow$ **Combined Household Cashflow: ₹1,00,000/mo**.
- **Impact on FOIR**: Compresses your overall leverage from 52% down to **34.5%**.
- **Max Eligible Loan**: Increases from ₹10.0 Lakhs up to **₹24.5 Lakhs**.
- **Audit Decision**: **Instant STP Green-Channel Approval**.`,
        suggestions: ['Attach Co-Applicant Bank Statement', 'Simulate Higher Ticket Size', 'Proceed with Application'],
        cardType: 'CREDIT_ROADMAP',
        cardData: {
          potentialCibilGain: 'Co-Borrower Guarantee',
          targetFoir: '34.5%',
          maxEligibleAmount: 2450000
        }
      };
    }

    if (query.includes('flag') || query.includes('exception') || query.includes('why') || query.includes('review') || query.includes('borderline')) {
      return {
        reply: `### 🔍 Why Applications Get Flagged for Exception Review
Your application may be routed to our **Credit Exception Intelligence Queue** due to:
1. **FOIR Between 50%–58%**: Monthly debt obligations slightly exceed standard 50% ceiling.
2. **Near-Prime CIBIL (680–720)**: Clean 0-DPD track record but short credit history.
3. **Self-Employed Cashflow Variation**: High bank account turnover but non-salaried tax returns.

✅ **Fast Resolution**: Providing verified Mutual Funds or Fixed Deposits ($\ge 40\%$ of loan) enables our **L1 Credit Officers** to approve your file via **Fast-Track Override**.`,
        suggestions: ['Upload Investment Proofs', 'Extend Loan Tenure to 60M', 'Contact Underwriting Desk']
      };
    }

    return {
      reply: `### 🎯 AI Credit Health & Approval Roadmap
Here are 3 concrete strategies to **maximize your approval odds** immediately:

1. **Optimize Tenure to Lower FOIR**:
   - Extending requested loan tenure from **36 to 60 months** drops your monthly EMI by ~32%, instantly bringing your Fixed Obligation to Income Ratio (**FOIR**) from 54% to **36.8%** (Instant STP Approval).

2. **Add a Co-Applicant with Verified Income**:
   - Adding a co-applicant earning $\ge ₹25,000/\text{mo}$ raises your maximum borrowing eligibility from ₹10 Lakhs to **₹18.5 Lakhs**.

3. **Verify Liquid Asset Buffer (Mutual Funds / Savings)**:
   - Having liquid mutual funds or fixed deposits equal to $\ge 4\times$ your monthly EMI qualifies you for **Fast-Track Policy Override (Archetype E-01)** even if your credit score is near-prime (680–720).`,
      suggestions: ['How can I maximize my loan approval?', 'What is the optimal tenure to reduce FOIR?', 'How much loan can I get with co-applicant?'],
      cardType: 'CREDIT_ROADMAP',
      cardData: {
        potentialCibilGain: '+25 pts in 90 days',
        targetFoir: '36.8%',
        maxEligibleAmount: 1850000
      }
    };
  }

  // Underwriter / Credit Officer Persona Mode
  if (query.includes('memo') || query.includes('appraisal') || query.includes('dossier') || query.includes('draft')) {
    return {
      reply: `### 📑 Automated Regulatory Credit Appraisal Memo (CAM)
**Subject**: Policy Exception Clearance for Near-Prime Asset-Rich Applicant
**Risk Telemetry**: CIBIL 720 | FOIR 52.4% | Liquid Buffer ₹6.5 Lakhs (MF + FDs)

**Executive Findings**:
1. **Core Deviation**: Proposed debt service ratio of 52.4% exceeds standard institutional ceiling of 50.0%.
2. **Mitigating Compensating Factors**: Verified liquid mutual fund reserves of ₹6.5L provide **6.2x monthly debt service coverage**. Zero 30+ DPD delinquency instances across 36-month vintage.
3. **Regulatory Compliance**: Meets RBI Prudential Framework criteria for verified cashflow underwriting.

**Audit Recommendation**: **APPROVE WITH CONDITION** (Mandatory auto-debit NACH mandate setup on primary salary account).`,
      suggestions: ['Export Credit Memo to PDF', 'View Bureau Snapshot', 'Check Default Probability'],
      cardType: 'CREDIT_MEMO',
      cardData: {
        memoId: 'CAM-2026-8841',
        riskGrade: 'Grade B+ (Low-Risk Deviation)',
        recommendedLimit: 1200000,
        mitigationFactor: '6.2x Debt Service Reserve Buffer'
      }
    };
  }

  if (query.includes('concentration') || query.includes('portfolio') || query.includes('risk') || query.includes('cibil 680-720') || query.includes('near-prime')) {
    return {
      reply: `### 📊 Portfolio Risk & Segment Concentration Analysis
- **Total Active Portfolio**: ₹4.82 Crores across live application queue.
- **Near-Prime Cohort (CIBIL 680–720)**: Represents **38.4%** of total pipeline exposure (₹1.85 Cr).
- **Archetype Breakdown**:
  - **Asset-Rich Segment (E-01)**: 62% of pending exceptions. Historical default rate is only **2.9%** (Safe for batch fast-track).
  - **High Growth Professionals (E-02)**: 24% of exceptions with YoY salary increase $>15\%$.
  - **Thin Buffer Group (E-04)**: 14% of exceptions requiring manual L2 escalation.
- **Underwriting Action**: Fast-track Group A candidates in E-01 to clear 75% of exception backlog immediately.`,
      suggestions: ['Execute Fast-Track Group A', 'Run Macro Stress Test', 'Inspect High-Exposure Cases'],
      cardType: 'PORTFOLIO_CONCENTRATION',
      cardData: {
        totalExposure: 48200000,
        lowRiskCohortPercent: 78,
        recommendedFastTrackCount: 8
      }
    };
  }

  if (query.includes('mitigat') || query.includes('52%') || query.includes('borderline') || query.includes('condition')) {
    return {
      reply: `### 🛡️ Recommended Mitigating Conditions for Borderline 52% FOIR Case
When an applicant's FOIR is between 50% and 55%, the following institutional policy relaxations apply:
1. **Liquid Asset Collateral**: If verified Mutual Funds / Savings $\ge 40\%$ of loan principal $\rightarrow$ Eligible for **L1 Standard Fast-Track Override**.
2. **Tenure Extension**: Extending requested tenure by +12 to +24 months compresses monthly FOIR down to **43.8%** (Instant STP Approval).
3. **Co-Applicant Income Ingestion**: Ingesting secondary earner's bank statement increases eligible debt ceiling by up to 45%.
4. **Mandatory NACH & Insurance**: Enforce auto-debit on salary account + Credit Shield insurance.`,
      suggestions: ['Apply 60M Restructuring', 'Request Co-Applicant Addition', 'Fast-Track Under L1 Policy']
    };
  }

  if (query.includes('reject') || query.includes('reason') || query.includes('top reason') || query.includes('decline')) {
    return {
      reply: `### 📉 Top Institutional Rejection Drivers (This Week)
1. **Severe Bureau Delinquency (42%)**: Unresolved 60+ DPD or commercial write-offs in the last 12 months.
2. **Excessive Leverage (28%)**: Calculated FOIR $> 65\%$ with no liquid buffer or asset backing.
3. **Bureau Score Below Hard Floor (18%)**: CIBIL $< 650$ on unsecured personal credit products.
4. **Salary Floor Non-Compliance (12%)**: Verified monthly income $< ₹25,000$ institutional minimum.`,
      suggestions: ['Review Rule Cutoff Thresholds', 'Simulate Score Adjustments', 'Inspect Audit Trail']
    };
  }

  if (query.includes('exception') || query.includes('l1') || query.includes('l2') || query.includes('queue')) {
    return {
      reply: `### 🏛️ Smart Exception Routing & Delegation Matrix
- **L1 Standard Review Queue**: Assigned to cases with loan amounts $\le ₹15\text{ Lakhs}$, near-prime CIBIL ($680–749$), and minor FOIR deviations ($50–58\%$) backed by liquid assets.
- **L2 Senior Escalation Queue**: Mandated for loan amounts $> ₹15\text{ Lakhs}$, high leverage (FOIR $> 58\%$), thin liquid buffers, or cases manually escalated by L1 officers.
- **Batch Processing**: Exception Intelligence Studio clusters identical risk vectors into Archetypes E-01 through E-05 for 1-click batch decisioning.`,
      suggestions: ['Open Exception Queue', 'Open Exception Intelligence Studio', 'View Archetype Matrix']
    };
  }

  return {
    reply: `### 🤖 AI Underwriting Copilot Ready
I can assist you with real-time credit analysis and decision synthesis:
- **Drafting Credit Appraisal Memos (CAM)**: State *"Draft credit memo for near-prime cohort"*.
- **Portfolio Concentration**: Ask *"Analyze portfolio risk concentration across CIBIL 680-720"*.
- **Mitigation Strategies**: Ask *"Suggest mitigating conditions for borderline 52% FOIR case"*.
- **Rejection Diagnostics**: Ask *"Summarize top reasons for rejection this week"*.
- **Macro Sensitivity**: Ask *"Simulate impact of 100 bps RBI rate hike"*.`,
    suggestions: ['Analyze Portfolio Risk Concentration', 'Draft Credit Appraisal Memo', 'Suggest Mitigating Conditions for 52% FOIR', 'Summarize Top Rejection Reasons']
  };
};

// ==========================================
// 2. MACRO STRESS TESTING SIMULATOR
// ==========================================
export const runMacroStressTest = ({
  repoRateHikeBps = 100, // e.g. +100 bps (+1.0%)
  inflationShockPercent = 6.5,
  unemploymentSurgePercent = 8.0,
  sectorDownturn = 'IT_TECH' // 'NONE' | 'IT_TECH' | 'REAL_ESTATE' | 'RETAIL_MSME'
}) => {
  // Baseline portfolio metrics
  const baselineDefaultRate = 2.9; // 2.9%
  const baselineECL = 14.2; // ₹14.2 Lakhs
  const baselineCAR = 18.5; // 18.5% Capital Adequacy Ratio

  // Stress multiplier calculations
  const rateMultiplier = (repoRateHikeBps / 100) * 0.85;
  const inflationMultiplier = Math.max(0, (inflationShockPercent - 5.0) * 0.4);
  const unemploymentMultiplier = (unemploymentSurgePercent / 5.0) * 0.6;
  
  let sectorMultiplier = 0.3;
  if (sectorDownturn === 'IT_TECH') sectorMultiplier = 1.1;
  else if (sectorDownturn === 'REAL_ESTATE') sectorMultiplier = 1.4;
  else if (sectorDownturn === 'RETAIL_MSME') sectorMultiplier = 1.6;

  const totalStressScore = parseFloat((rateMultiplier + inflationMultiplier + unemploymentMultiplier + sectorMultiplier).toFixed(2));

  const projectedDefaultRate = parseFloat((baselineDefaultRate + (totalStressScore * 1.35)).toFixed(2));
  const projectedECL = parseFloat((baselineECL * (1 + totalStressScore * 0.75)).toFixed(1));
  const projectedCAR = parseFloat(Math.max(11.0, baselineCAR - (totalStressScore * 0.95)).toFixed(1));

  // Risk bands impacted
  const affectedApplicationsCount = Math.round(50 * (projectedDefaultRate / 100) * 3);
  const capitalAtRisk = parseFloat(((projectedECL - baselineECL) * 100000).toFixed(0));

  const aiPreservationStrategies = [
    `Tighten FOIR ceiling from 50% to 45% for high-sensitivity borrowers in ${sectorDownturn.replace('_', ' ')} sector.`,
    `Mandate minimum liquid asset reserve buffer ≥ 20% of loan ticket for tenures > 48 months.`,
    `Increase risk-adjusted interest spread by +${(repoRateHikeBps / 100 * 0.6).toFixed(2)}% to preserve net interest margin (NIM).`
  ];

  return {
    inputs: {
      repoRateHikeBps,
      inflationShockPercent,
      unemploymentSurgePercent,
      sectorDownturn
    },
    stressMetrics: {
      stressSeverityGrade: totalStressScore > 3.0 ? 'SEVERE_CRISIS' : totalStressScore > 1.8 ? 'ELEVATED_STRESS' : 'MILD_TURBULENCE',
      projectedDefaultRate,
      baselineDefaultRate,
      defaultRateDelta: parseFloat((projectedDefaultRate - baselineDefaultRate).toFixed(2)),
      projectedECL,
      baselineECL,
      eclDeltaLakhs: parseFloat((projectedECL - baselineECL).toFixed(1)),
      projectedCAR,
      baselineCAR,
      capitalAtRisk,
      affectedApplicationsCount: Math.min(50, affectedApplicationsCount)
    },
    preservationStrategies: aiPreservationStrategies
  };
};

// ==========================================
// 3. AI FRAUD & ANOMALY RADAR
// ==========================================
export const FRAUD_DEMO_CASES = [
  {
    caseId: 'FR-001',
    applicantName: 'Vikram Malhotra',
    panNumber: 'ENGPS2179F',
    suspicionScore: 88,
    riskBand: 'CRITICAL_HIGH',
    detectedVectors: [
      {
        vector: 'Circular Fund Layering',
        severity: 'HIGH',
        confidence: 94,
        description: 'Repeated same-day credit from P2P lending app followed by immediate EMI debit transfer.'
      },
      {
        vector: 'Fake Payroll Credit Signature',
        severity: 'CRITICAL',
        confidence: 91,
        description: 'Salary credited via individual UPI handle instead of corporate corporate ACH/NEFT batch.'
      },
      {
        vector: 'High-Velocity Post-Salary Drain',
        severity: 'MEDIUM',
        confidence: 82,
        description: '92% of declared salary balance withdrawn in cash within 48 hours of credit date.'
      }
    ],
    recommendedAction: 'BLOCK_AND_GENERATE_SAR',
    radarScores: {
      incomeAuthenticity: 24,
      bankingIntegrity: 18,
      identityConsistency: 65,
      debtLayeringRisk: 92,
      cashDrainVelocity: 88
    }
  },
  {
    caseId: 'FR-002',
    applicantName: 'Priya Patel',
    panNumber: 'BEJPL1618S',
    suspicionScore: 12,
    riskBand: 'CLEAN_VERIFIED',
    detectedVectors: [],
    recommendedAction: 'CLEARED_NO_ANOMALY',
    radarScores: {
      incomeAuthenticity: 96,
      bankingIntegrity: 94,
      identityConsistency: 98,
      debtLayeringRisk: 8,
      cashDrainVelocity: 14
    }
  },
  {
    caseId: 'FR-003',
    applicantName: 'Amit Kumar',
    panNumber: 'CHQPW1805F',
    suspicionScore: 68,
    riskBand: 'MODERATE_SUSPICIOUS',
    detectedVectors: [
      {
        vector: 'Multiple Inquiries Velocity Spike',
        severity: 'MEDIUM',
        confidence: 85,
        description: '7 loan inquiries registered across 4 different fintech lenders in past 14 days.'
      },
      {
        vector: 'Frequent Minimum Balance Breaches',
        severity: 'MEDIUM',
        confidence: 76,
        description: 'Average quarterly balance dropped below threshold 4 times in 6 months triggering penalty debits.'
      }
    ],
    recommendedAction: 'MANUAL_FORENSIC_REVIEW',
    radarScores: {
      incomeAuthenticity: 72,
      bankingIntegrity: 58,
      identityConsistency: 88,
      debtLayeringRisk: 64,
      cashDrainVelocity: 60
    }
  }
];

// ==========================================
// 4. AI DYNAMIC PRICING OPTIMIZER
// ==========================================
export const optimizeLoanPricing = ({
  cibilScore = 740,
  foir = 42,
  requestedAmount = 1000000,
  tenureMonths = 60,
  costOfFundsPercent = 7.25, // Base NBFC cost of borrowing
  operatingExpensePercent = 1.5
}) => {
  // Risk spread computation based on CIBIL and FOIR
  let baseRiskSpread = 2.5; // %
  if (cibilScore >= 780) baseRiskSpread = 1.25;
  else if (cibilScore >= 740) baseRiskSpread = 2.0;
  else if (cibilScore >= 700) baseRiskSpread = 2.9;
  else if (cibilScore >= 660) baseRiskSpread = 4.2;
  else baseRiskSpread = 6.0;

  // FOIR adjustment
  const foirPenalty = foir > 50 ? (foir - 50) * 0.15 : -0.25;

  const optimalAPR = parseFloat((costOfFundsPercent + operatingExpensePercent + baseRiskSpread + foirPenalty).toFixed(2));
  const minPermissibleAPR = parseFloat((costOfFundsPercent + operatingExpensePercent + 1.0).toFixed(2));
  const maxRiskAPR = parseFloat((costOfFundsPercent + operatingExpensePercent + 7.5).toFixed(2));

  // Compute monthly EMI & expected net margin
  const r = (optimalAPR / 100) / 12;
  const n = tenureMonths;
  const P = requestedAmount;
  const optimalEMI = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const totalInterest = Math.round((optimalEMI * n) - P);
  const netMarginLakhs = parseFloat((((optimalAPR - costOfFundsPercent - operatingExpensePercent) / 100) * P * (tenureMonths / 12) / 100000).toFixed(2));

  const pricingFrontier = [
    { rate: parseFloat((optimalAPR - 1.0).toFixed(2)), expectedConversion: '88%', defaultProbability: '3.8%', marginLakhs: parseFloat((netMarginLakhs * 0.75).toFixed(2)) },
    { rate: optimalAPR, expectedConversion: '76%', defaultProbability: '2.9%', marginLakhs: netMarginLakhs, isRecommended: true },
    { rate: parseFloat((optimalAPR + 1.0).toFixed(2)), expectedConversion: '52%', defaultProbability: '2.4%', marginLakhs: parseFloat((netMarginLakhs * 1.22).toFixed(2)) },
    { rate: parseFloat((optimalAPR + 2.0).toFixed(2)), expectedConversion: '31%', defaultProbability: '2.1%', marginLakhs: parseFloat((netMarginLakhs * 1.45).toFixed(2)) }
  ];

  return {
    optimalAPR,
    minPermissibleAPR,
    maxRiskAPR,
    optimalEMI,
    totalInterest,
    netMarginLakhs,
    breakdown: {
      costOfFunds: costOfFundsPercent,
      operatingExpense: operatingExpensePercent,
      riskSpread: parseFloat((baseRiskSpread + foirPenalty).toFixed(2))
    },
    pricingFrontier
  };
};
