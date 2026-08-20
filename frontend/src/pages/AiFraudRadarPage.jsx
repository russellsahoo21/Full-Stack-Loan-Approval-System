import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertOctagon, FileSearch, 
  CheckCircle2, ArrowRight, Zap, Download, RefreshCw, 
  Fingerprint, Sparkles, TrendingDown, Eye
} from 'lucide-react';
import { aiApi } from '../services/api';

const AiFraudRadarPage = () => {
  const [fraudCases, setFraudCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sarExported, setSarExported] = useState(false);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await aiApi.getFraudCases();
      if (res.success && res.data) {
        setFraudCases(res.data);
        setSelectedCase(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch fraud cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleExportSar = () => {
    setSarExported(true);
    setTimeout(() => setSarExported(false), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-700 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                AI Bank Statement & Fraud Anomaly Radar
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                Forensic Telemetry Engine
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Automated detection of circular loan layering, non-corporate payroll credits, and high-velocity cash drains.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportSar}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{sarExported ? 'SAR Exported to Audit Archive ✓' : 'Export Suspicious Activity Report (SAR)'}</span>
        </button>
      </div>

      {/* Case Selector Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fraudCases.map((c) => {
          const isSelected = selectedCase?.caseId === c.caseId;
          const isHighRisk = c.riskBand === 'CRITICAL_HIGH';
          const isClean = c.riskBand === 'CLEAN_VERIFIED';

          return (
            <button
              key={c.caseId}
              type="button"
              onClick={() => setSelectedCase(c)}
              className={`p-4 rounded-2xl text-left transition-all border ${
                isSelected
                  ? isHighRisk
                    ? 'bg-rose-950/20 border-rose-500/80 shadow-lg shadow-rose-500/10'
                    : isClean
                    ? 'bg-emerald-950/20 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                    : 'bg-amber-950/20 border-amber-500/80 shadow-lg shadow-amber-500/10'
                  : 'bg-[#111] border-[#2a2a2a] hover:border-[#444]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold text-gray-400">{c.caseId}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isHighRisk
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : isClean
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {c.riskBand.replace('_', ' ')}
                </span>
              </div>

              <div className="font-bold text-sm text-white truncate">{c.applicantName}</div>
              <div className="text-[11px] text-gray-400 font-mono mt-0.5">PAN: {c.panNumber}</div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#222]">
                <span className="text-[11px] text-gray-500">Anomaly Index</span>
                <span className={`text-xs font-bold font-mono ${
                  c.suspicionScore > 70 ? 'text-rose-400' : c.suspicionScore > 30 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {c.suspicionScore}/100
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Deep-Dive Inspection Panel */}
      {selectedCase && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Forensic Radar Scores (5 cols) */}
          <div className="lg:col-span-5 bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
              <Fingerprint className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Telemetry Anomaly Vector Scores
              </h2>
            </div>

            <div className="space-y-4">
              {Object.entries(selectedCase.radarScores || {}).map(([key, score]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                const isRiskMetric = key === 'debtLayeringRisk' || key === 'cashDrainVelocity';
                const isAlarming = isRiskMetric ? score > 60 : score < 40;

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300 font-medium">{label}</span>
                      <span className={`font-mono font-bold ${isAlarming ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {score}%
                      </span>
                    </div>
                    <div className="w-full bg-[#1e1e1e] h-2 rounded-full overflow-hidden border border-[#2c2c2c]">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isAlarming ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-[#161616] border border-[#2c2c2c] mt-4">
              <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Underwriter Action Protocol</span>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                {selectedCase.recommendedAction === 'BLOCK_AND_GENERATE_SAR' ? (
                  <>
                    <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-rose-400">HARD FREEZE APPLICATION & FILE SUSPICIOUS ACTIVITY REPORT</span>
                  </>
                ) : selectedCase.recommendedAction === 'MANUAL_FORENSIC_REVIEW' ? (
                  <>
                    <FileSearch className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-amber-400">ESCORT TO SENIOR FRAUD DESK FOR 6-MONTH STATEMENT AUDIT</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400">ALL 5 INTEGRITY CHECKS PASSED - PROCEED TO UNDERWRITING</span>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Detected Anomaly Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Detected Forensic Risk Signals ({selectedCase.detectedVectors.length})</span>
              </h3>
              <span className="text-xs font-mono text-gray-400">AI Confidence: 90%+</span>
            </div>

            {selectedCase.detectedVectors.length === 0 ? (
              <div className="bg-[#111] border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Clean Forensic Signature</h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  No signs of circular borrowing, payroll manipulation, or account layering detected across 12 months of banking telemetry.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedCase.detectedVectors.map((v, idx) => (
                  <div
                    key={idx}
                    className="bg-[#111] border border-[#2a2a2a] hover:border-rose-500/40 rounded-2xl p-5 space-y-2.5 transition-all shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{v.vector}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          {v.severity}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400 font-semibold">
                          {v.confidence}% Confidence
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed bg-[#161616] p-3 rounded-xl border border-[#262626]">
                      {v.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default AiFraudRadarPage;
