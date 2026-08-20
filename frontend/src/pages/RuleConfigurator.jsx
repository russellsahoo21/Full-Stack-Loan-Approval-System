import React, { useState } from 'react';
import { Settings, Save, Play, RefreshCw, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

const INITIAL_RULES = [
  { id: 'R01', name: 'Minimum CIBIL Score', description: 'Minimum credit score required for straight-through processing.', variable: 'cibilScore', min: 300, max: 900, step: 10, value: 700, unit: 'points' },
  { id: 'R02', name: 'Maximum FOIR', description: 'Fixed Obligations to Income Ratio cap.', variable: 'foir', min: 10, max: 80, step: 1, value: 50, unit: '%' },
  { id: 'R03', name: 'Avg Monthly Balance (6M)', description: 'Minimum average bank balance maintained over 6 months.', variable: 'amb', min: 10000, max: 200000, step: 5000, value: 50000, unit: '₹' },
  { id: 'R04', name: 'Max Cheque Bounces (6M)', description: 'Maximum allowed inward return limit in the last 6 months.', variable: 'bounces6M', min: 0, max: 5, step: 1, value: 1, unit: 'bounces' },
];

const RuleConfigurator = () => {
  const [rules, setRules] = useState(INITIAL_RULES);
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSliderChange = (id, newValue) => {
    setSaveSuccess(false);
    setRules(prev => prev.map(rule => rule.id === id ? { ...rule, value: Number(newValue) } : rule));
  };

  const handleSaveAndReEvaluate = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      setIsSimulating(true);
      setTimeout(() => {
        setIsSimulating(false);
      }, 1500);
      
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Settings className="w-8 h-8 text-white" />
            BRE Configurator Studio
          </h1>
          <p className="text-gray-400 mt-2">Adjust core policy thresholds in real-time. Changes affect new applications immediately.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {saveSuccess && !isSaving && (
            <span className="text-sm font-medium text-green-500 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Rules Saved
            </span>
          )}
          <button 
            onClick={handleSaveAndReEvaluate}
            disabled={isSaving || isSimulating}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-70"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Deploying...' : 'Deploy & Re-Evaluate'}
          </button>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-8 flex items-start gap-3 text-yellow-500">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong className="font-semibold block mb-1">Live Environment Warning</strong>
          Modifying these thresholds will immediately impact the Straight-Through Processing (STP) rates and exception volumes. Ensure Risk Management approval before deploying.
        </div>
      </div>

      <div className="bg-[#111] rounded-xl shadow-sm border border-[#333] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#333] bg-[#1a1a1a] flex items-center justify-between">
          <h3 className="font-semibold text-white text-lg">Active Risk Rules</h3>
          <span className="text-xs font-semibold bg-[#333] text-gray-300 px-2 py-1 rounded border border-[#444]">v2.4.1 (Live)</span>
        </div>
        
        <div className="divide-y divide-[#333]">
          {rules.map((rule) => (
            <div key={rule.id} className="p-6 transition-colors hover:bg-[#1a1a1a] flex flex-col md:flex-row md:items-center gap-8">
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono bg-[#333] border border-[#444] text-gray-300 px-1.5 py-0.5 rounded">{rule.id}</span>
                  <h4 className="font-semibold text-white">{rule.name}</h4>
                </div>
                <p className="text-sm text-gray-400 mb-2">{rule.description}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                  <Info className="w-3.5 h-3.5" />
                  Engine Var: {rule.variable}
                </div>
              </div>

              <div className="flex-1 max-w-md bg-[#0a0a0a] p-4 rounded-lg border border-[#333] relative">
                {isSimulating && (
                  <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-400">Threshold Value</span>
                  <div className="bg-white/10 text-white font-bold px-3 py-1 rounded border border-[#444] text-lg">
                    {rule.unit === '₹' ? '₹' : ''}
                    {rule.value}
                    {rule.unit !== '₹' ? ` ${rule.unit}` : ''}
                  </div>
                </div>
                
                <input 
                  type="range"
                  min={rule.min}
                  max={rule.max}
                  step={rule.step}
                  value={rule.value}
                  onChange={(e) => handleSliderChange(rule.id, e.target.value)}
                  className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer focus:outline-none"
                  style={{
                    accentColor: '#ffffff'
                  }}
                />
                <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
                  <span>{rule.unit === '₹' ? '₹' : ''}{rule.min}</span>
                  <span>{rule.unit === '₹' ? '₹' : ''}{rule.max}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
      
      <div className={clsx(
        "mt-8 transition-all duration-500 transform",
        isSimulating ? "opacity-0 translate-y-4" : saveSuccess ? "opacity-100 translate-y-0" : "opacity-0 hidden"
      )}>
        <div className="bg-[#111] p-6 rounded-xl border border-green-500/30 flex items-start gap-4">
          <div className="bg-green-500/10 p-3 rounded-full text-green-500 shrink-0 border border-green-500/20">
            <Play className="w-6 h-6 ml-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg mb-1">Impact Simulation Complete</h3>
            <p className="text-sm text-gray-400 mb-4">Re-evaluation of the last 1,000 applications using the new thresholds yielded the following projected impact:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">STP Approval Rate</div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white">42.5%</span>
                  <span className="text-sm text-red-500 font-medium pb-0.5">↓ 2.1%</span>
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">L1 Exceptions</div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white">28.0%</span>
                  <span className="text-sm text-green-500 font-medium pb-0.5">↑ 1.5%</span>
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Hard Rejects</div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white">29.5%</span>
                  <span className="text-sm text-gray-500 font-medium pb-0.5">+ 0.6%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default RuleConfigurator;
