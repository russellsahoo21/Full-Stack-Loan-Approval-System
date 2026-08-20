import React, { useState } from 'react';
import { 
  UploadCloud, FileJson, CheckCircle2, AlertCircle, 
  ChevronRight, Calculator, User, Building, CreditCard, 
  Sparkles, RefreshCw, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { maskPAN, maskMobile, maskAccountNumber, formatCurrency } from '../utils/masking';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../services/api';

const PRESET_PERSONAS = [
  {
    id: 'RAHUL',
    badge: 'Expected: STP Approved',
    badgeColor: 'bg-green-500/10 text-green-400 border-green-500/20',
    name: 'Rahul Sharma',
    age: 29,
    employmentType: 'Salaried',
    declaredMonthlyIncome: 80000,
    existingEMI: 15000,
    requestedLoanAmount: 800000,
    requestedTenureMonths: 60,
    applicantId: 'APP001',
    cibilScore: 735,
    writeOffs: 0,
    bounceCount: 1,
    avgMonthlyBalance: 45000,
    monthlyCredits: 80000,
    mutualFunds: 200000,
    savings: 50000,
    description: 'High credit score (735), clean repayment history, healthy FOIR under 50%.'
  },
  {
    id: 'PRIYA',
    badge: 'Expected: Exception Required',
    badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    name: 'Priya Patel',
    age: 32,
    employmentType: 'Salaried',
    declaredMonthlyIncome: 95000,
    existingEMI: 18000,
    requestedLoanAmount: 1000000,
    requestedTenureMonths: 60,
    applicantId: 'APP002',
    cibilScore: 680,
    writeOffs: 0,
    bounceCount: 1,
    avgMonthlyBalance: 60000,
    monthlyCredits: 95000,
    mutualFunds: 500000,
    savings: 100000,
    description: 'CIBIL 680 is below standard 700 cutoff, but offset by ₹5L Mutual Funds liquid assets.'
  },
  {
    id: 'AMIT',
    badge: 'Expected: Hard Reject',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    name: 'Amit Kumar',
    age: 26,
    employmentType: 'Salaried',
    declaredMonthlyIncome: 60000,
    existingEMI: 10000,
    requestedLoanAmount: 500000,
    requestedTenureMonths: 36,
    applicantId: 'APP003',
    cibilScore: 650,
    writeOffs: 1,
    bounceCount: 4,
    avgMonthlyBalance: 12000,
    monthlyCredits: 50000,
    mutualFunds: 0,
    savings: 5000,
    description: 'Active write-off (1) and high cheque bounce count (4) trigger automatic policy knockout.'
  }
];

const NewApplication = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'presets' or 'upload'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State for Manual Ingestion
  const [formData, setFormData] = useState({
    name: 'Rahul Sharma',
    age: 29,
    employmentType: 'Salaried',
    declaredMonthlyIncome: 80000,
    existingEMI: 15000,
    requestedLoanAmount: 800000,
    requestedTenureMonths: 60,
    applicantId: 'APP001',
    cibilScore: 735,
    activeLoans: 2,
    dpd: 0,
    writeOffs: 0,
    bounceCount: 1,
    avgMonthlyBalance: 45000,
    monthlyCredits: 80000,
    mutualFunds: 200000,
    savings: 50000,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'name' || field === 'employmentType' || field === 'applicantId' 
        ? value 
        : Number(value) || 0
    }));
  };

  // Dynamic live metric calculations
  const calculateLiveMetrics = () => {
    const annualRate = 0.115;
    const r = annualRate / 12;
    const n = formData.requestedTenureMonths || 60;
    const p = formData.requestedLoanAmount || 0;
    
    let proposedEMI = 0;
    if (p > 0 && n > 0) {
      proposedEMI = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }
    
    const income = formData.declaredMonthlyIncome || 1;
    const totalEMI = (formData.existingEMI || 0) + proposedEMI;
    const foir = ((totalEMI / income) * 100).toFixed(1);
    const lti = (p / (income * 12)).toFixed(1);

    return { proposedEMI, foir, lti };
  };

  const liveMetrics = calculateLiveMetrics();

  const handleApply = async (payload) => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
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
    }
  };

  const handlePresetSelect = (preset) => {
    setFormData({
      name: preset.name,
      age: preset.age,
      employmentType: preset.employmentType,
      declaredMonthlyIncome: preset.declaredMonthlyIncome,
      existingEMI: preset.existingEMI,
      requestedLoanAmount: preset.requestedLoanAmount,
      requestedTenureMonths: preset.requestedTenureMonths,
      applicantId: preset.applicantId,
      cibilScore: preset.cibilScore,
      activeLoans: 2,
      dpd: 0,
      writeOffs: preset.writeOffs,
      bounceCount: preset.bounceCount,
      avgMonthlyBalance: preset.avgMonthlyBalance,
      monthlyCredits: preset.monthlyCredits,
      mutualFunds: preset.mutualFunds,
      savings: preset.savings,
    });
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Loan Application Ingestion</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Input applicant financials & bureau telemetry to execute real-time automated BRE underwriting.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="bg-[#161616] p-1 rounded-xl border border-[#333] flex">
          <button 
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'manual' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Manual Entry Form
          </button>
          <button 
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'presets' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Test Personas & Presets
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upload' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Bulk / JSON Ingestion
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset Personas Tab */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRESET_PERSONAS.map((p) => (
            <div 
              key={p.id}
              className="bg-[#111] border border-[#333] hover:border-gray-500 rounded-xl p-6 flex flex-col justify-between transition-all hover:shadow-[0_4px_25px_rgba(0,0,0,0.4)]"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{p.applicantId}</span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{p.description}</p>

                <div className="space-y-2 text-xs border-t border-[#222] pt-3">
                  <div className="flex justify-between text-gray-400">
                    <span>Requested Loan:</span>
                    <span className="text-white font-medium">{formatCurrency(p.requestedLoanAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Declared Income:</span>
                    <span className="text-white font-medium">{formatCurrency(p.declaredMonthlyIncome)}/mo</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>CIBIL Score:</span>
                    <span className="text-white font-medium font-mono">{p.cibilScore}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Cheque Bounces:</span>
                    <span className="text-white font-medium">{p.bounceCount}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Write-offs:</span>
                    <span className="text-white font-medium">{p.writeOffs}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#222] flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePresetSelect(p);
                    setActiveTab('manual');
                  }}
                  className="flex-1 py-2 px-3 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Load in Form
                </button>
                <button
                  type="button"
                  onClick={() => handleApply(p)}
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-3 bg-white text-black hover:bg-gray-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
                  <span>Run BRE</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk JSON Upload Tab */}
      {activeTab === 'upload' && (
        <div className="bg-[#111] border border-[#333] rounded-xl p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[#1a1a1a] border border-[#333] rounded-2xl flex items-center justify-center text-gray-400">
            <UploadCloud className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Upload Consolidated Loan Package</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
              Upload JSON/CSV payload with applicant details, bureau telemetry, and bank statement parameters.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => handleApply(PRESET_PERSONAS[0])}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-white text-black font-bold rounded-lg text-sm hover:bg-gray-200 transition-all inline-flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
              <span>Ingest & Evaluate Sample JSON</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Entry Form Tab */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Applicant & Loan Parameters */}
            <div className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
                <User className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-semibold text-white">Applicant & Loan Parameters</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Applicant ID</label>
                  <input
                    type="text"
                    value={formData.applicantId}
                    onChange={(e) => handleInputChange('applicantId', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => handleInputChange('employmentType', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all"
                  >
                    <option value="Salaried">Salaried (Tier-1 NBFC)</option>
                    <option value="Self-Employed">Self-Employed Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Declared Monthly Income (₹)</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.declaredMonthlyIncome}
                    onChange={(e) => handleInputChange('declaredMonthlyIncome', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm font-semibold focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Existing Monthly EMI (₹)</label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.existingEMI}
                    onChange={(e) => handleInputChange('existingEMI', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Requested Loan Amount (₹)</label>
                  <input
                    type="number"
                    step="50000"
                    value={formData.requestedLoanAmount}
                    onChange={(e) => handleInputChange('requestedLoanAmount', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm font-bold text-amber-400 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tenure (Months)</label>
                  <select
                    value={formData.requestedTenureMonths}
                    onChange={(e) => handleInputChange('requestedTenureMonths', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all"
                  >
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                    <option value={48}>48 Months (4 Years)</option>
                    <option value={60}>60 Months (5 Years)</option>
                    <option value={84}>84 Months (7 Years)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Credit Bureau & Synthetic Telemetry */}
            <div className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-semibold text-white">Bureau & Banking Telemetry</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">CIBIL Score (300-900)</label>
                  <input
                    type="number"
                    min="300"
                    max="900"
                    value={formData.cibilScore}
                    onChange={(e) => handleInputChange('cibilScore', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm font-mono font-bold focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Write-Offs / Defaults</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.writeOffs}
                    onChange={(e) => handleInputChange('writeOffs', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Cheque Bounces (6M)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bounceCount}
                    onChange={(e) => handleInputChange('bounceCount', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Avg Monthly Bal (AMB ₹)</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.avgMonthlyBalance}
                    onChange={(e) => handleInputChange('avgMonthlyBalance', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mutual Funds Buffer (₹)</label>
                  <input
                    type="number"
                    step="25000"
                    value={formData.mutualFunds}
                    onChange={(e) => handleInputChange('mutualFunds', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Savings Assets (₹)</label>
                  <input
                    type="number"
                    step="10000"
                    value={formData.savings}
                    onChange={(e) => handleInputChange('savings', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Calculated Scorecard & Submission Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-5 shadow-lg">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Live Derived Metrics Preview</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-[#181818] border border-[#2a2a2a] p-3.5 rounded-lg">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                    <span>Proposed Monthly EMI</span>
                    <span className="text-[10px] text-gray-500">@ 11.5% p.a.</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(liveMetrics.proposedEMI)}
                  </div>
                </div>

                <div className="bg-[#181818] border border-[#2a2a2a] p-3.5 rounded-lg">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                    <span>Fixed Obligation Ratio (FOIR)</span>
                    <span className={`text-[10px] font-semibold ${Number(liveMetrics.foir) <= 50 ? 'text-green-400' : 'text-amber-400'}`}>
                      {Number(liveMetrics.foir) <= 50 ? 'Pass (<=50%)' : 'Exceeds Cap'}
                    </span>
                  </div>
                  <div className={`text-xl font-bold ${Number(liveMetrics.foir) <= 50 ? 'text-white' : 'text-amber-400'}`}>
                    {liveMetrics.foir}%
                  </div>
                </div>

                <div className="bg-[#181818] border border-[#2a2a2a] p-3.5 rounded-lg">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                    <span>Loan-to-Income (LTI)</span>
                    <span className="text-[10px] text-gray-500">Annual multiplier</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {liveMetrics.lti}x Annual Income
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleApply()}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.15)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Executing BRE Evaluation...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Execute BRE Underwriting</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
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
