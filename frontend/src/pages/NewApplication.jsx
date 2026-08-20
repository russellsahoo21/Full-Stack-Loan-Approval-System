import React, { useEffect, useState } from 'react';
import { 
  UploadCloud, FileJson, CheckCircle2, AlertCircle, 
  ChevronRight, Calculator, User, Building, CreditCard, 
  Sparkles, RefreshCw, AlertTriangle, ArrowRight, Tag,
  Search, ShieldCheck, Fingerprint, Database, Check
} from 'lucide-react';
import { maskPAN, maskMobile, maskAccountNumber, formatCurrency } from '../utils/masking';
import { useNavigate } from 'react-router-dom';
import { applicationApi, rulesApi, bureauApi } from '../services/api';
import { useAuth, ROLES } from '../context/AuthContext';

// Mirrors backend policy.js LOAN_TYPE_CONFIGS
const LOAN_TYPE_CONFIGS = {
  PERSONAL: {
    label: 'Personal Loan',
    icon: '👤',
    description: 'Expenses, travel, weddings',
    baseAnnualRatePercent: 14.5,
    maxFoirPercent: 50,
    maxLoanAmount: 2500000,
    defaultTenureMonths: 36,
    tenureOptions: [12, 24, 36, 48, 60],
    color: 'from-violet-500/20 to-purple-500/10',
    borderColor: 'border-violet-500/40',
    textColor: 'text-white'
  },
  HOME: {
    label: 'Home Loan',
    icon: '🏠',
    description: 'Purchase, construct or renovate',
    baseAnnualRatePercent: 8.5,
    maxFoirPercent: 55,
    maxLoanAmount: 50000000,
    defaultTenureMonths: 180,
    tenureOptions: [60, 84, 120, 180, 240, 300, 360],
    color: 'from-emerald-500/20 to-green-500/10',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-white'
  },
  CAR: {
    label: 'Car Loan',
    icon: '🚗',
    description: 'New or pre-owned vehicle',
    baseAnnualRatePercent: 9.5,
    maxFoirPercent: 50,
    maxLoanAmount: 5000000,
    defaultTenureMonths: 60,
    tenureOptions: [12, 24, 36, 48, 60, 72, 84],
    color: 'from-blue-500/20 to-sky-500/10',
    borderColor: 'border-blue-500/40',
    textColor: 'text-white'
  },
  EDUCATION: {
    label: 'Education Loan',
    icon: '🎓',
    description: 'Higher education in India or abroad',
    baseAnnualRatePercent: 10.5,
    maxFoirPercent: 60,
    maxLoanAmount: 5000000,
    defaultTenureMonths: 84,
    tenureOptions: [24, 36, 60, 84, 96, 120],
    color: 'from-amber-500/20 to-yellow-500/10',
    borderColor: 'border-amber-500/40',
    textColor: 'text-white'
  },
  BUSINESS: {
    label: 'Business Loan',
    icon: '💼',
    description: 'Working capital or expansion',
    baseAnnualRatePercent: 12.5,
    maxFoirPercent: 45,
    maxLoanAmount: 10000000,
    defaultTenureMonths: 48,
    tenureOptions: [12, 24, 36, 48, 60, 72, 84],
    color: 'from-rose-500/20 to-red-500/10',
    borderColor: 'border-rose-500/40',
    textColor: 'text-white'
  }
};

const NewApplication = () => {
  const navigate = useNavigate();
  const { currentRole } = useAuth();
  
  const [activeTab, setActiveTab] = useState('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeRuleSet, setActiveRuleSet] = useState(null);

  // All known mock profiles from sample_loan_applications.csv
  const [bureauProfiles, setBureauProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('APP101');
  const [panInput, setPanInput] = useState('ABCPA1431F');
  const [aadhaarInput, setAadhaarInput] = useState('987654321098');
  const [isFetchingBureau, setIsFetchingBureau] = useState(false);
  const [bureauVerified, setBureauVerified] = useState(false);

  // Core Application Form Data
  const [formData, setFormData] = useState({
    name: 'Rahul Sharma',
    age: 23,
    employmentType: 'Self-Employed',
    declaredMonthlyIncome: 75000,
    existingEMI: 11250,
    requestedLoanAmount: 600000,
    requestedTenureMonths: 60,
    applicantId: 'APP101',
    panNumber: 'ABCPA1431F',
    aadhaarNumber: '987654321098',
    cibilScore: 750,
    scoreCategory: 'Super-Prime (Exceptional)',
    activeLoans: 1,
    dpd: 0,
    writeOffs: 0,
    bounceCount: 0,
    avgMonthlyBalance: 45000,
    monthlyCredits: 75000,
    mutualFunds: 250000,
    savings: 80000,
    loanType: 'PERSONAL',
  });

  const [jsonPayload, setJsonPayload] = useState(JSON.stringify(formData, null, 2));

  // Load all 50 bureau profiles and active rules on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [rulesRes, bureauRes] = await Promise.all([
          rulesApi.getActive().catch(() => null),
          bureauApi.getAll().catch(() => null)
        ]);

        if (rulesRes?.success) {
          setActiveRuleSet(rulesRes.data);
        }

        if (bureauRes?.success && bureauRes.data) {
          setBureauProfiles(bureauRes.data);
          if (bureauRes.data.length > 0) {
            const first = bureauRes.data[0];
            setSelectedProfileId(first.applicantId);
            setPanInput(first.panNumber || '');
            setAadhaarInput(first.aadhaarNumber || '');
          }
        }
      } catch (err) {
        console.warn('Initial data load warning:', err);
      }
    };

    initData();
  }, []);

  // Populate form with auto-retrieved mock bureau data
  const populateProfile = (profile) => {
    if (!profile) return;
    setPanInput(profile.panNumber || '');
    setAadhaarInput(profile.aadhaarNumber || '');
    setSelectedProfileId(profile.applicantId || '');
    setBureauVerified(true);

    setFormData(prev => ({
      ...prev,
      name: profile.name || prev.name,
      age: profile.age ?? prev.age,
      employmentType: profile.employmentType || prev.employmentType,
      declaredMonthlyIncome: profile.declaredMonthlyIncome ?? prev.declaredMonthlyIncome,
      existingEMI: profile.existingEMI ?? prev.existingEMI,
      requestedLoanAmount: profile.requestedLoanAmount || prev.requestedLoanAmount,
      requestedTenureMonths: profile.requestedTenureMonths || prev.requestedTenureMonths,
      applicantId: profile.applicantId || prev.applicantId,
      panNumber: profile.panNumber || prev.panNumber,
      aadhaarNumber: profile.aadhaarNumber || prev.aadhaarNumber,
      cibilScore: profile.cibilScore ?? prev.cibilScore,
      scoreCategory: profile.scoreCategory || 'Prime',
      activeLoans: profile.activeLoans ?? 1,
      dpd: profile.dpd ?? 0,
      writeOffs: profile.writeOffs ?? 0,
      bounceCount: profile.bounceCount ?? 0,
      avgMonthlyBalance: profile.avgMonthlyBalance ?? 30000,
      monthlyCredits: profile.monthlyCredits ?? profile.declaredMonthlyIncome ?? 50000,
      mutualFunds: profile.mutualFunds ?? 0,
      savings: profile.savings ?? 0,
    }));
  };

  // Fetch report by PAN / Aadhaar identifier
  const handleFetchBureauData = async (identifierToUse) => {
    const id = identifierToUse || panInput || aadhaarInput;
    if (!id || id.trim() === '') {
      setErrorMessage('Please enter a PAN Card (e.g. ABCPA1431F) or 12-digit Aadhaar Number.');
      return;
    }

    setIsFetchingBureau(true);
    setErrorMessage('');

    try {
      const res = await bureauApi.fetchReport(id.trim());
      if (res.success && res.data) {
        populateProfile(res.data);
      } else {
        setErrorMessage(res.message || 'Applicant not found in Mock Bureau Database.');
        setBureauVerified(false);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to connect to Bureau Gateway.');
      setBureauVerified(false);
    } finally {
      setIsFetchingBureau(false);
    }
  };

  // Handle Quick Dropdown Selector change
  const handleDropdownSelect = (appId) => {
    setSelectedProfileId(appId);
    setBureauVerified(false);
    const found = bureauProfiles.find(p => p.applicantId === appId);
    if (found) {
      setPanInput(found.panNumber || '');
      setAadhaarInput(found.aadhaarNumber || '');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'name' || field === 'employmentType' || field === 'loanType' || field === 'panNumber' || field === 'aadhaarNumber'
        ? value 
        : Number(value)
    }));
  };

  const handleLoanTypeChange = (loanType) => {
    const cfg = LOAN_TYPE_CONFIGS[loanType];
    setFormData(prev => ({
      ...prev,
      loanType,
      requestedTenureMonths: cfg?.defaultTenureMonths || prev.requestedTenureMonths,
      requestedLoanAmount: Math.min(prev.requestedLoanAmount, cfg?.maxLoanAmount || prev.requestedLoanAmount)
    }));
  };

  const getRuleThreshold = (parameter, fallback) => {
    const rule = activeRuleSet?.rules?.find((item) => item.parameter === parameter);
    return Number(rule?.threshold ?? fallback);
  };

  // Live Metric Calculations
  const calculateLiveMetrics = () => {
    const loanTypeConfig = LOAN_TYPE_CONFIGS[formData.loanType] || LOAN_TYPE_CONFIGS['PERSONAL'];
    const baseRate = loanTypeConfig.baseAnnualRatePercent 
      ?? Number(activeRuleSet?.config?.baseAnnualRatePercent ?? 11.5);
    const maxFoirPercent = loanTypeConfig.maxFoirPercent 
      ?? getRuleThreshold('foir', activeRuleSet?.config?.maxFoirPercent ?? 50);

    const annualRate = baseRate / 100;
    const r = annualRate / 12;
    const n = formData.requestedTenureMonths || loanTypeConfig.defaultTenureMonths || 60;
    const p = formData.requestedLoanAmount || 0;
    
    let proposedEMI = 0;
    if (p > 0 && n > 0) {
      proposedEMI = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }
    
    const income = formData.declaredMonthlyIncome || 1;
    const totalEMI = (formData.existingEMI || 0) + proposedEMI;
    const foir = ((totalEMI / income) * 100).toFixed(1);
    const lti = (p / (income * 12)).toFixed(1);

    return { proposedEMI, foir, lti, maxFoirPercent, baseAnnualRatePercent: baseRate };
  };

  const liveMetrics = calculateLiveMetrics();

  // Multi-Stage Realistic Submission Animation
  const handleApply = async (payload) => {
    setErrorMessage('');
    setIsSubmitting(true);
    
    try {
      setSubmitStage('1/3 Binding KYC & Bureau Records...');
      await new Promise((r) => setTimeout(r, 800));

      setSubmitStage('2/3 Executing BRE Policy Checks...');
      await new Promise((r) => setTimeout(r, 900));

      setSubmitStage('3/3 Generating Audit Scorecard...');
      await new Promise((r) => setTimeout(r, 700));

      const dataToSubmit = payload || formData;
      const res = await applicationApi.apply(dataToSubmit);
      if (res.success && res.data) {
        navigate(`/applications/${res.data.applicationId || res.data._id}`);
      } else {
        setErrorMessage(res.message || 'Underwriting evaluation failed');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit application to BRE backend.');
    } finally {
      setIsSubmitting(false);
      setSubmitStage('');
    }
  };

  const handleJsonSubmit = () => {
    try {
      const parsed = JSON.parse(jsonPayload);
      handleApply(parsed);
    } catch (err) {
      setErrorMessage('Invalid JSON payload. Please fix the syntax and try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Loan Application Ingestion</span>
          </h1>
          <p className="text-gray-400 mt-1 text-xs">
            Enter PAN Card or Aadhaar to automatically fetch verified Bureau & KYC telemetry from the mock repository.
          </p>
        </div>

        {/* Tab Selection */}
        {currentRole !== ROLES.APPLICANT && (
          <div className="bg-[#161616] p-1 border border-[#333] flex">
            <button 
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'manual' ? 'bg-white text-black font-bold shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              KYC & Bureau Form
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'upload' ? 'bg-white text-black font-bold shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Bulk / JSON Ingestion
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-white/10 border border-white/30 text-white p-4 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bulk JSON Upload Tab */}
      {activeTab === 'upload' && (
        <div className="bg-[#111] border border-[#333] p-8 text-center space-y-4 shadow-xl">
          <div className="mx-auto w-16 h-16 bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-white">
            <UploadCloud className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Upload Consolidated Loan Package</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
              Upload JSON payload with applicant details, bureau telemetry, and bank statement parameters.
            </p>
          </div>
          <textarea
            value={jsonPayload}
            onChange={(e) => setJsonPayload(e.target.value)}
            className="w-full max-w-3xl h-72 bg-[#181818] border border-[#333] focus:border-white text-white p-4 text-xs font-mono focus:outline-none transition-all text-left"
            spellCheck="false"
          />
          <div className="pt-2">
            <button
              type="button"
              onClick={handleJsonSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-white text-black font-bold text-xs hover:bg-gray-200 transition-all inline-flex items-center gap-2 shadow-lg"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
              <span>Ingest & Evaluate JSON</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Manual / KYC-Based Form */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Form: KYC Fetch & Bureau Telemetry (2 cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* STEP 1: Quick PAN / Aadhaar KYC Fetcher */}
            <div className="bg-[#111] border border-[#333] p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-white" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Step 1: Automated KYC & Bureau Verification
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20">
                  50 Mock Profiles Seeded
                </span>
              </div>

              {/* Quick Select Profile from sample_loan_applications.csv */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-300">
                  Quick Select Mock Applicant (From sample_loan_applications.csv)
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => handleDropdownSelect(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] focus:border-white text-white px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all cursor-pointer"
                >
                  {bureauProfiles.map((p) => (
                    <option key={p.applicantId} value={p.applicantId}>
                      [{p.applicantId}] {p.name} — PAN: {p.panNumber} (CIBIL: {p.cibilScore})
                    </option>
                  ))}
                </select>
              </div>

              {/* Or Direct Input: PAN Card & Aadhaar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    PAN Card Number (10 Chars)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={panInput}
                    onChange={(e) => {
                      setPanInput(e.target.value.toUpperCase());
                      setBureauVerified(false);
                    }}
                    placeholder="e.g. ABCPA1431F"
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white px-3.5 py-2.5 text-xs font-mono uppercase focus:outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    Aadhaar Number (12 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarInput}
                    onChange={(e) => {
                      setAadhaarInput(e.target.value);
                      setBureauVerified(false);
                    }}
                    placeholder="e.g. 987654321098"
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleFetchBureauData()}
                  disabled={isFetchingBureau}
                  className="px-4 py-2.5 bg-white text-black font-bold text-xs hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isFetchingBureau ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Fetch & Verify Bureau Records</span>
                </button>
              </div>

              {/* Unverified Placeholder State */}
              {!bureauVerified && (
                <div className="bg-[#141414] border border-[#333] p-5 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-semibold">
                    <Fingerprint className="w-4 h-4 text-white" />
                    <span>KYC & Bureau Telemetry Dossier Pending Verification</span>
                  </div>
                  <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                    Click the <span className="text-white font-bold">"Fetch & Verify Bureau Records"</span> button above to retrieve verified NSDL/UIDAI identity and CIBIL score telemetry.
                  </p>
                </div>
              )}

              {/* Verified Telemetry Dossier Display */}
              {bureauVerified && (
                <div className="bg-[#141414] border border-white/20 p-4 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold text-white uppercase">
                        Verified Bureau & KYC Telemetry Dossier
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-white/10 text-white border border-white/20">
                      ✓ NSDL & CIBIL GATEWAY LIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-[#1c1c1c] p-2.5 border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase font-semibold">Verified Name</span>
                      <span className="font-bold text-white truncate block">{formData.name}</span>
                    </div>

                    <div className="bg-[#1c1c1c] p-2.5 border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase font-semibold">Monthly Income</span>
                      <span className="font-bold text-white font-mono block">{formatCurrency(formData.declaredMonthlyIncome)}/mo</span>
                    </div>

                    <div className="bg-[#1c1c1c] p-2.5 border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase font-semibold">Existing EMI</span>
                      <span className="font-bold text-white font-mono block">{formatCurrency(formData.existingEMI)}/mo</span>
                    </div>

                    <div className="bg-[#1c1c1c] p-2.5 border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase font-semibold">CIBIL Score</span>
                      <span className="font-bold text-white font-mono block">{formData.cibilScore} ({formData.scoreCategory})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-[#1c1c1c] p-2.5 border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase font-semibold">Active Loans</span>
                      <span className="font-bold text-white font-mono block">{formData.activeLoans} Active Facility</span>
                    </div>

                    <div className="bg-[#1c1c1c] p-2.5 border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase font-semibold">Cheque Bounces</span>
                      <span className="font-bold text-white font-mono block">{formData.bounceCount} (Last 6M)</span>
                    </div>

                    <div className="bg-[#1c1c1c] p-2.5 border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase font-semibold">Write-Offs / Defaults</span>
                      <span className="font-bold text-white font-mono block">{formData.writeOffs} Records</span>
                    </div>

                    <div className="bg-[#1c1c1c] p-2.5 border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase font-semibold">Liquid Mutual Funds</span>
                      <span className="font-bold text-white font-mono block">{formatCurrency(formData.mutualFunds)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Loan Configuration */}
            <div className="bg-[#111] border border-[#333] p-6 space-y-5 shadow-2xl">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
                <Tag className="w-5 h-5 text-white" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Step 2: Loan Requirements & Facility Selection
                </h2>
              </div>

              {/* Loan Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-300">
                  Select Loan Facility
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {Object.entries(LOAN_TYPE_CONFIGS).map(([key, cfg]) => {
                    const isSelected = formData.loanType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleLoanTypeChange(key)}
                        className={`flex flex-col items-center gap-1.5 p-3 border transition-all ${
                          isSelected
                            ? 'bg-white text-black border-white font-bold shadow-lg'
                            : 'bg-[#181818] border-[#2a2a2a] text-gray-300 hover:border-[#444] hover:bg-[#1e1e1e]'
                        }`}
                      >
                        <span className="text-xl leading-none">{cfg.icon}</span>
                        <span className="text-[11px] font-bold text-center leading-tight">{cfg.label}</span>
                        <span className="text-[10px] font-mono">{cfg.baseAnnualRatePercent}% p.a.</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Requested Amount & Tenure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    Requested Loan Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={formData.requestedLoanAmount}
                    onChange={(e) => handleInputChange('requestedLoanAmount', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white px-3.5 py-2.5 text-sm font-bold font-mono focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    Requested Tenure (Months)
                  </label>
                  <select
                    value={formData.requestedTenureMonths}
                    onChange={(e) => handleInputChange('requestedTenureMonths', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white px-3.5 py-2.5 text-xs focus:outline-none transition-all cursor-pointer"
                  >
                    {(LOAN_TYPE_CONFIGS[formData.loanType]?.tenureOptions || [12,24,36,48,60]).map(mo => (
                      <option key={mo} value={mo}>
                        {mo} Months ({mo >= 12 ? `${Math.round(mo / 12 * 10) / 10} Year${mo === 12 ? '' : 's'}` : `${mo} mo`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

          </div>

          {/* Right Sidebar: Realtime Underwriting Preview & 1-Click Submission (1 col) */}
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#333] p-6 space-y-6 shadow-2xl sticky top-24">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
                <Calculator className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Underwriting Preview
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-[#161616] p-4 border border-[#2a2a2a] space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Proposed EMI:</span>
                    <span className="font-bold text-white font-mono text-sm">{formatCurrency(liveMetrics.proposedEMI)}/mo</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Total Monthly FOIR:</span>
                    <span className="font-bold text-white font-mono">{liveMetrics.foir}%</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Policy FOIR Ceiling:</span>
                    <span className="text-gray-400 font-mono">{liveMetrics.maxFoirPercent}%</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Loan-to-Income (LTI):</span>
                    <span className="font-bold text-white font-mono">{liveMetrics.lti}x Annual</span>
                  </div>
                </div>

                <div className="p-3 bg-[#141414] border border-white/10 text-[11px] text-gray-400 space-y-1">
                  <div className="flex items-center gap-1 text-white font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Automated BRE Decisioning</span>
                  </div>
                  <p className="leading-relaxed">
                    Evaluates live across 6 risk rules including CIBIL threshold, FOIR limits, AMB turnover, and zero write-offs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApply()}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-white text-black hover:bg-gray-200 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-2xl disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span className="font-mono">{submitStage || 'Evaluating RuleSet...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Loan Application</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default NewApplication;
