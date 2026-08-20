import React, { useState, useEffect } from 'react';
import { 
  Activity, Sliders, AlertTriangle, TrendingUp, 
  ShieldCheck, ShieldAlert, Sparkles, RefreshCw, 
  ArrowRight, CheckCircle2, DollarSign, Layers, BarChart3
} from 'lucide-react';
import { formatCurrency } from '../utils/masking';
import { aiApi } from '../services/api';

const AiStressTestingPage = () => {
  const [repoRateHikeBps, setRepoRateHikeBps] = useState(125);
  const [inflationShockPercent, setInflationShockPercent] = useState(7.2);
  const [unemploymentSurgePercent, setUnemploymentSurgePercent] = useState(9.5);
  const [sectorDownturn, setSectorDownturn] = useState('IT_TECH');

  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await aiApi.stressTestSimulate({
        repoRateHikeBps,
        inflationShockPercent,
        unemploymentSurgePercent,
        sectorDownturn
      });
      if (res.success && res.data) {
        setSimulationResult(res.data);
      }
    } catch (err) {
      console.error('Stress test simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [repoRateHikeBps, inflationShockPercent, unemploymentSurgePercent, sectorDownturn]);

  const sm = simulationResult?.stressMetrics;

  return (
    <div className="max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                AI Macroeconomic Stress Testing Lab
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                Monte Carlo Risk Model
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Simulate portfolio degradation under repo rate hikes, inflation surges, and sectoral recession shocks.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setRepoRateHikeBps(50);
            setInflationShockPercent(5.5);
            setUnemploymentSurgePercent(6.0);
            setSectorDownturn('NONE');
          }}
          className="px-3.5 py-2 bg-[#181818] hover:bg-[#222] border border-[#333] text-gray-300 text-xs font-semibold rounded-xl transition-all self-start sm:self-auto"
        >
          Reset to Baseline
        </button>
      </div>

      {/* Main Grid: Control Sliders (5 cols) vs Projected Impact Dashboard (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Stress Controls & Sliders (5 cols) */}
        <div className="lg:col-span-5 bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Macroeconomic Shock Vectors
            </h2>
          </div>

          {/* Slider 1: Repo Rate Hike */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-semibold">RBI Repo Rate Shock</span>
              <span className="text-amber-400 font-mono font-extrabold">+{repoRateHikeBps} bps (+{(repoRateHikeBps / 100).toFixed(2)}%)</span>
            </div>
            <input
              type="range"
              min={0}
              max={300}
              step={25}
              value={repoRateHikeBps}
              onChange={(e) => setRepoRateHikeBps(Number(e.target.value))}
              className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>0 bps (Neutral)</span>
              <span>+150 bps</span>
              <span>+300 bps (Extreme)</span>
            </div>
          </div>

          {/* Slider 2: Headline Inflation */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-semibold">CPI Inflation Rate</span>
              <span className="text-orange-400 font-mono font-extrabold">{inflationShockPercent}%</span>
            </div>
            <input
              type="range"
              min={4.0}
              max={12.0}
              step={0.2}
              value={inflationShockPercent}
              onChange={(e) => setInflationShockPercent(Number(e.target.value))}
              className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>4.0% (Target)</span>
              <span>8.0%</span>
              <span>12.0% (Hyper)</span>
            </div>
          </div>

          {/* Slider 3: Unemployment Surge */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-semibold">Urban Unemployment Rate</span>
              <span className="text-red-400 font-mono font-extrabold">{unemploymentSurgePercent}%</span>
            </div>
            <input
              type="range"
              min={4.0}
              max={18.0}
              step={0.5}
              value={unemploymentSurgePercent}
              onChange={(e) => setUnemploymentSurgePercent(Number(e.target.value))}
              className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>4.0% (Full Emp.)</span>
              <span>10.0%</span>
              <span>18.0% (Recession)</span>
            </div>
          </div>

          {/* Dropdown 4: Sectoral Downturn */}
          <div className="space-y-2 pt-2 border-t border-[#222]">
            <label className="block text-xs font-semibold text-gray-300">
              Sector-Specific Crisis Focus
            </label>
            <select
              value={sectorDownturn}
              onChange={(e) => setSectorDownturn(e.target.value)}
              className="w-full bg-[#181818] border border-[#333] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 transition-all font-semibold"
            >
              <option value="NONE">None (Broad Market Stress)</option>
              <option value="IT_TECH">IT & Tech Services (Layoffs & Export Slowdown)</option>
              <option value="REAL_ESTATE">Real Estate & Construction Slump</option>
              <option value="RETAIL_MSME">Retail Trade & MSME Cash Flow Freeze</option>
            </select>
          </div>

          {/* Quick Preset Buttons */}
          <div className="pt-2">
            <span className="text-[11px] text-gray-500 font-semibold block mb-2">Historical Crisis Presets:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRepoRateHikeBps(175);
                  setInflationShockPercent(8.5);
                  setUnemploymentSurgePercent(11.0);
                  setSectorDownturn('IT_TECH');
                }}
                className="p-2 bg-[#161616] hover:bg-[#222] border border-[#333] text-gray-300 rounded-lg text-[11px] font-medium transition-all"
              >
                2022 Global Rate Shock
              </button>

              <button
                type="button"
                onClick={() => {
                  setRepoRateHikeBps(250);
                  setInflationShockPercent(10.5);
                  setUnemploymentSurgePercent(15.0);
                  setSectorDownturn('REAL_ESTATE');
                }}
                className="p-2 bg-[#161616] hover:bg-[#222] border border-[#333] text-gray-300 rounded-lg text-[11px] font-medium transition-all"
              >
                Severe Stagflation Crisis
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Projected Impact Gauges & AI Mitigations (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Top Impact KPIs */}
          {sm && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-[#111] border border-red-500/30 p-4 rounded-xl shadow-lg bg-red-500/5">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">Projected Default</span>
                <div className="text-2xl font-extrabold text-red-400 mt-1 font-mono">
                  {sm.projectedDefaultRate}%
                </div>
                <span className="text-[10px] text-red-300 mt-0.5 block font-mono">
                  +{sm.defaultRateDelta}% vs Base ({sm.baselineDefaultRate}%)
                </span>
              </div>

              <div className="bg-[#111] border border-orange-500/30 p-4 rounded-xl shadow-lg bg-orange-500/5">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">Expected Loss (ECL)</span>
                <div className="text-2xl font-extrabold text-orange-400 mt-1 font-mono">
                  ₹{sm.projectedECL}L
                </div>
                <span className="text-[10px] text-orange-300 mt-0.5 block font-mono">
                  +₹{sm.eclDeltaLakhs}L Stress Loss
                </span>
              </div>

              <div className="bg-[#111] border border-blue-500/30 p-4 rounded-xl shadow-lg bg-blue-500/5">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">Capital Ratio (CAR)</span>
                <div className="text-2xl font-extrabold text-blue-400 mt-1 font-mono">
                  {sm.projectedCAR}%
                </div>
                <span className="text-[10px] text-blue-300 mt-0.5 block font-mono">
                  RBI Floor: 15.0%
                </span>
              </div>

              <div className="bg-[#111] border border-purple-500/30 p-4 rounded-xl shadow-lg bg-purple-500/5">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">Severity Grade</span>
                <div className="text-lg font-extrabold text-purple-300 mt-2 truncate">
                  {sm.stressSeverityGrade.replace('_', ' ')}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  {sm.affectedApplicationsCount} loans in danger zone
                </span>
              </div>
            </div>
          )}

          {/* Visual Loss Degradation Frontier */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Portfolio Loss Tolerance & Buffer Coverage
                </h3>
              </div>
              <span className="text-xs font-mono text-gray-400">Total Portfolio: ₹4.82 Cr</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Standard Baseline Provisioning</span>
                  <span className="font-mono text-emerald-400">₹14.2 Lakhs (Adequate)</span>
                </div>
                <div className="w-full bg-[#1c1c1c] h-3 rounded-full overflow-hidden border border-[#2c2c2c]">
                  <div className="bg-emerald-500 h-full w-[25%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Stressed Expected Loss (ECL Exposure)</span>
                  <span className="font-mono text-orange-400">₹{sm?.projectedECL} Lakhs (+{Math.round(((sm?.projectedECL || 14.2) / 14.2 - 1) * 100)}% Surge)</span>
                </div>
                <div className="w-full bg-[#1c1c1c] h-3 rounded-full overflow-hidden border border-[#2c2c2c]">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-red-500 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((sm?.projectedECL || 14.2) / 45) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Capital Preservation Action Plan */}
          {simulationResult?.preservationStrategies && (
            <div className="bg-[#131313] border border-purple-500/30 rounded-2xl p-6 space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-[#242424] pb-2.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">
                  AI Underwriting Policy Recommendations under this Stress Scenario
                </h3>
              </div>

              <div className="space-y-2">
                {simulationResult.preservationStrategies.map((strat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-[#181818] p-3 rounded-xl border border-[#2c2c2c]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-200 leading-relaxed font-medium">{strat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AiStressTestingPage;
