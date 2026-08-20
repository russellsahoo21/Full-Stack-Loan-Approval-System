import React, { useState, useEffect } from 'react';
import { 
  Landmark, Activity, Sliders, RefreshCw, CheckCircle, 
  TrendingUp, TrendingDown, Percent, Shield, AlertTriangle, 
  Calculator, ArrowRight, Gauge, Cpu, Check
} from 'lucide-react';
import { macroApi } from '../services/api';
import { formatCurrency } from '../utils/masking';
import { useAuth, ROLES } from '../context/AuthContext';

const MPC_PRESETS = [
  {
    name: 'Current RBI Baseline (6.50%)',
    repoRate: 6.50,
    inflation: 5.10,
    riskWeight: 125,
    stance: 'Withdrawal of Accommodation (Neutral Hold)',
    desc: 'Prevailing RBI repo rate benchmark with standard NBFC spreads.'
  },
  {
    name: 'Hawkish MPC Hike (+50 bps)',
    repoRate: 7.00,
    inflation: 6.20,
    riskWeight: 150,
    stance: 'Aggressive Tightening (Inflation Surge)',
    desc: 'Simulates +50 bps policy rate hike to combat rising CPI food/fuel inflation.'
  },
  {
    name: 'Dovish MPC Cut (-50 bps)',
    repoRate: 6.00,
    inflation: 4.20,
    riskWeight: 100,
    stance: 'Accommodative Growth Stimulus',
    desc: 'Simulates a rate cut to stimulate credit growth and boost consumer spending.'
  },
  {
    name: 'Severe Macro Shock (+150 bps)',
    repoRate: 8.00,
    inflation: 7.80,
    riskWeight: 175,
    stance: 'Crisis Defense (Currency & Capital Outflow)',
    desc: 'Emergency tightening to defend against extreme global interest rate divergence.'
  }
];

const MacroBenchmarkStudio = () => {
  const { currentRole } = useAuth();
  const [macroData, setMacroData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Interactive Slider State
  const [repoRate, setRepoRate] = useState(6.50);
  const [inflation, setInflation] = useState(5.10);
  const [riskWeight, setRiskWeight] = useState(125);
  const [monetaryStance, setMonetaryStance] = useState('Neutral Hold');

  // Borrower EMI Sensitivity Calculator State
  const [calcLoanType, setCalcLoanType] = useState('HOME');
  const [calcAmount, setCalcAmount] = useState(2500000);
  const [calcTenure, setCalcTenure] = useState(240); // 20 years
  const [calcCibil, setCalcCibil] = useState(760);

  const fetchBenchmark = async () => {
    setIsLoading(true);
    try {
      const res = await macroApi.getCurrent();
      if (res?.success && res.data) {
        setMacroData(res.data);
        setRepoRate(res.data.rbiRepoRate || 6.50);
        setInflation(res.data.cpiInflationRate || 5.10);
        setRiskWeight(res.data.rbiUnsecuredRiskWeight || 125);
        setMonetaryStance(res.data.monetaryStance || 'Neutral Hold');
      }
    } catch (e) {
      console.warn('Failed to load benchmark data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  const handleApplyBenchmark = async (newRepo, newInf, newRw, newStance) => {
    setIsUpdating(true);
    setSuccessMessage('');
    try {
      const payload = {
        rbiRepoRate: newRepo ?? repoRate,
        cpiInflationRate: newInf ?? inflation,
        rbiUnsecuredRiskWeight: newRw ?? riskWeight,
        monetaryStance: newStance ?? monetaryStance
      };
      const res = await macroApi.updateBenchmark(payload);
      if (res?.success && res.data) {
        setMacroData(res.data);
        setSuccessMessage(`✓ EBLR Benchmarks updated live: RBI Repo Rate is now ${payload.rbiRepoRate}% p.a.`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update benchmark');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = async () => {
    setIsUpdating(true);
    try {
      const res = await macroApi.reset();
      if (res?.success && res.data) {
        setMacroData(res.data);
        setRepoRate(6.50);
        setInflation(5.10);
        setRiskWeight(125);
        setSuccessMessage('✓ Reset to official RBI 6.50% baseline benchmark');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (e) {
      alert('Failed to reset benchmark');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePresetSelect = (p) => {
    setRepoRate(p.repoRate);
    setInflation(p.inflation);
    setRiskWeight(p.riskWeight);
    setMonetaryStance(p.stance);
    handleApplyBenchmark(p.repoRate, p.inflation, p.riskWeight, p.stance);
  };

  // Calculate live facility rates from current slider state
  const computeFacilityRate = (facilityKey) => {
    const spreads = {
      HOME: 2.00,
      CAR: 3.00,
      PERSONAL: 5.50,
      BUSINESS: 4.50,
      EDUCATION: 4.00
    };
    const baseSpread = spreads[facilityKey] || 5.00;
    const surcharge = (riskWeight > 100 && facilityKey === 'PERSONAL') ? ((riskWeight - 100) / 100) * 0.50 : 0;
    return Math.round((repoRate + baseSpread + surcharge) * 100) / 100;
  };

  // Borrower EMI Calculator output
  const activeCalcRate = computeFacilityRate(calcLoanType);
  const r = activeCalcRate / 100 / 12;
  const n = calcTenure;
  const p = calcAmount;
  const calculatedEMI = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const totalRepayment = calculatedEMI * n;
  const totalInterest = totalRepayment - p;

  return (
    <div className="max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>RBI Macro Benchmark & EBLR Pricing Studio</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Regulated External Benchmark Lending Rate (EBLR) engine linking loan facilities to the government repo rate.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isUpdating}
            className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-gray-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to RBI Baseline</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleApplyBenchmark()}
            disabled={isUpdating}
            className="px-4 py-2 bg-white text-black font-bold text-xs hover:bg-gray-200 transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-50"
          >
            {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" /> : <CheckCircle className="w-3.5 h-3.5 text-black" />}
            <span>Apply Benchmark Live</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-white/10 border border-white/30 text-white p-3 text-xs flex items-center gap-2 font-mono animate-in fade-in">
          <Check className="w-4 h-4 text-white" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top 4 Live Macro Indicators Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-[#333] p-4 space-y-1 shadow-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">RBI Policy Repo Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">{repoRate.toFixed(2)}%</span>
            <span className="text-[10px] px-2 py-0.5 bg-white/10 text-white border border-white/20 font-mono font-bold">EBLR BASE</span>
          </div>
          <p className="text-[10px] text-gray-500">Benchmark for floating rate credit</p>
        </div>

        <div className="bg-[#111] border border-[#333] p-4 space-y-1 shadow-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">CPI Inflation Headline</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">{inflation.toFixed(2)}%</span>
            <span className="text-[10px] px-2 py-0.5 bg-white/10 text-white border border-white/20 font-mono font-bold">RBI TOLERANCE</span>
          </div>
          <p className="text-[10px] text-gray-500">Influences real yield spreads</p>
        </div>

        <div className="bg-[#111] border border-[#333] p-4 space-y-1 shadow-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">1-Year MCLR Baseline</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">{(macroData?.mclr1Year || 8.85).toFixed(2)}%</span>
            <span className="text-[10px] px-2 py-0.5 bg-white/10 text-white border border-white/20 font-mono font-bold">MARGINAL COST</span>
          </div>
          <p className="text-[10px] text-gray-500">Internal bank funding cutoff</p>
        </div>

        <div className="bg-[#111] border border-[#333] p-4 space-y-1 shadow-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Unsecured Risk Weight</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">{riskWeight}%</span>
            <span className="text-[10px] px-2 py-0.5 bg-white/10 text-white border border-white/20 font-mono font-bold">CAPITAL CHARGE</span>
          </div>
          <p className="text-[10px] text-gray-500">RBI mandate for personal loans</p>
        </div>
      </div>

      {/* Main Grid: Interactive MPC Controller & Facility Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Sliders & MPC Simulation Presets (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interactive Benchmark Controller */}
          <div className="bg-[#111] border border-[#333] p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-white" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Market Benchmark Parameters
                </h2>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">
                Stance: <span className="text-white font-bold">{monetaryStance}</span>
              </span>
            </div>

            {/* Repo Rate Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-300">RBI Policy Repo Rate Benchmark</span>
                <span className="font-bold text-white font-mono text-sm">{repoRate.toFixed(2)}% p.a.</span>
              </div>
              <input
                type="range"
                min="4.50"
                max="9.50"
                step="0.25"
                value={repoRate}
                onChange={(e) => setRepoRate(Number(e.target.value))}
                className="w-full h-2 bg-[#222] accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>4.50% (Dovish Easing)</span>
                <span>6.50% (Baseline)</span>
                <span>9.50% (Extreme Crisis)</span>
              </div>
            </div>

            {/* Inflation Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-300">CPI Headline Inflation Rate</span>
                <span className="font-bold text-white font-mono text-sm">{inflation.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="3.00"
                max="10.00"
                step="0.10"
                value={inflation}
                onChange={(e) => setInflation(Number(e.target.value))}
                className="w-full h-2 bg-[#222] accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>3.00% (Below Target)</span>
                <span>5.10% (Target Band)</span>
                <span>10.00% (Hyperinflation)</span>
              </div>
            </div>

            {/* Unsecured Risk Weight Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-300">RBI Unsecured Risk Weight Multiplier</span>
                <span className="font-bold text-white font-mono text-sm">{riskWeight}%</span>
              </div>
              <input
                type="range"
                min="100"
                max="175"
                step="25"
                value={riskWeight}
                onChange={(e) => setRiskWeight(Number(e.target.value))}
                className="w-full h-2 bg-[#222] accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>100% (Standard)</span>
                <span>125% (Current RBI Mandate)</span>
                <span>175% (Tight Surcharge)</span>
              </div>
            </div>
          </div>

          {/* Monetary Policy Committee (MPC) Presets */}
          <div className="bg-[#111] border border-[#333] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
              <Cpu className="w-4 h-4 text-white" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Simulate RBI Monetary Policy (MPC) Rate Decision
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MPC_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className={`p-4 text-left border transition-all space-y-1.5 ${
                    repoRate === p.repoRate 
                      ? 'bg-white text-black border-white shadow-lg' 
                      : 'bg-[#181818] border-[#2a2a2a] text-gray-300 hover:border-[#444] hover:bg-[#202020]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{p.name}</span>
                    <span className="font-mono font-extrabold text-xs">{p.repoRate.toFixed(2)}%</span>
                  </div>
                  <p className={`text-[11px] leading-snug ${repoRate === p.repoRate ? 'text-gray-800' : 'text-gray-400'}`}>
                    {p.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic EBLR Facility Rate Matrix */}
          <div className="bg-[#111] border border-[#333] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-white" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Dynamic Facility APR Matrix
                </h2>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                Formula: Repo ({repoRate.toFixed(2)}%) + Spread
              </span>
            </div>

            <div className="divide-y divide-[#222] text-xs">
              {[
                { key: 'HOME', name: 'Home Loan', spread: 2.00, tag: 'Secured Mortgage' },
                { key: 'CAR', name: 'Car Loan', spread: 3.00, tag: 'Auto Asset' },
                { key: 'PERSONAL', name: 'Personal Loan', spread: 5.50, tag: 'Unsecured Consumer' },
                { key: 'BUSINESS', name: 'Business Loan', spread: 4.50, tag: 'MSME Capital' },
                { key: 'EDUCATION', name: 'Education Loan', spread: 4.00, tag: 'Priority Sector' },
              ].map((fac) => {
                const calculatedRate = computeFacilityRate(fac.key);
                return (
                  <div key={fac.key} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{fac.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{fac.tag}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Base Spread: +{fac.spread.toFixed(2)}% over Repo
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-white font-mono text-sm block">
                        {calculatedRate.toFixed(2)}% p.a.
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase font-mono">Dynamic Floating APR</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Real-Time Borrower EMI Sensitivity Simulator (1 col) */}
        <div className="space-y-6">
          <div className="bg-[#111] border border-[#333] p-6 space-y-6 shadow-2xl sticky top-24">
            <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
              <Calculator className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Borrower EMI Sensitivity
              </h3>
            </div>

            {/* Facility Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400">Select Facility</label>
              <select
                value={calcLoanType}
                onChange={(e) => setCalcLoanType(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] text-white px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="HOME">Home Loan ({computeFacilityRate('HOME')}% p.a.)</option>
                <option value="CAR">Car Loan ({computeFacilityRate('CAR')}% p.a.)</option>
                <option value="PERSONAL">Personal Loan ({computeFacilityRate('PERSONAL')}% p.a.)</option>
                <option value="BUSINESS">Business Loan ({computeFacilityRate('BUSINESS')}% p.a.)</option>
                <option value="EDUCATION">Education Loan ({computeFacilityRate('EDUCATION')}% p.a.)</option>
              </select>
            </div>

            {/* Principal Amount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400">Loan Principal (₹)</label>
              <input
                type="number"
                step="50000"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="w-full bg-[#181818] border border-[#333] text-white px-3 py-2 text-xs font-mono font-bold focus:outline-none"
              />
            </div>

            {/* Tenure */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400">Tenure (Months)</label>
              <input
                type="number"
                step="12"
                value={calcTenure}
                onChange={(e) => setCalcTenure(Number(e.target.value))}
                className="w-full bg-[#181818] border border-[#333] text-white px-3 py-2 text-xs font-mono font-bold focus:outline-none"
              />
            </div>

            {/* Calculated Output Box */}
            <div className="bg-[#161616] p-4 border border-[#2a2a2a] space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Dynamic EBLR Rate:</span>
                <span className="font-extrabold text-white font-mono">{activeCalcRate.toFixed(2)}% p.a.</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Monthly EMI:</span>
                <span className="font-extrabold text-white font-mono text-sm">{formatCurrency(calculatedEMI)}/mo</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Interest Payable:</span>
                <span className="font-bold text-white font-mono">{formatCurrency(totalInterest)}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Cost of Loan:</span>
                <span className="font-bold text-white font-mono">{formatCurrency(totalRepayment)}</span>
              </div>
            </div>

            <div className="p-3 bg-[#141414] border border-white/10 text-[11px] text-gray-400 space-y-1">
              <span className="font-bold text-white block">🏛️ RBI EBLR Compliance Note:</span>
              <p className="leading-relaxed">
                Under RBI Circular DBR.Dir.BC.No.14/13.03.00/2019-20, all new retail floating loans are linked to the external repo benchmark with transparent spread reset intervals.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default MacroBenchmarkStudio;
