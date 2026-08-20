import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, GitBranch, CheckCircle2, Archive, Clock,
  ChevronRight, Calendar, User, FileText, Zap, RefreshCw,
  TrendingUp, TrendingDown, Minus, Shield, AlertTriangle
} from 'lucide-react';
import { rulesApi } from '../services/api';
import clsx from 'clsx';

const PARAM_LABELS = {
  cibilScore: 'CIBIL Score',
  foir: 'FOIR %',
  monthlyIncome: 'Monthly Income ₹',
  writeOffs: 'Write-offs',
  bounceCount: 'Bounce Count',
  age: 'Age (Years)',
  activeLoans: 'Active Loans',
  dpd: 'DPD',
};

const StatusBadge = ({ status, isActive }) => {
  if (isActive || status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-bold tracking-wider">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
        ACTIVE
      </span>
    );
  }
  if (status === 'SCHEDULED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full text-[11px] font-bold tracking-wider">
        <Clock className="w-3 h-3" />
        SCHEDULED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#222] text-gray-500 border border-[#333] rounded-full text-[11px] font-bold tracking-wider">
      <Archive className="w-3 h-3" />
      ARCHIVED
    </span>
  );
};

const ThresholdDiff = ({ oldVal, newVal }) => {
  if (oldVal === undefined || newVal === undefined) return null;
  const changed = oldVal !== newVal;
  const increased = Number(newVal) > Number(oldVal);
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 font-mono">{oldVal}</span>
      <ChevronRight className="w-3 h-3 text-gray-600" />
      <span className={clsx('font-mono font-bold', changed ? (increased ? 'text-red-400' : 'text-green-400') : 'text-gray-400')}>
        {newVal}
      </span>
      {changed && (
        increased
          ? <TrendingUp className="w-3 h-3 text-red-400" />
          : <TrendingDown className="w-3 h-3 text-green-400" />
      )}
    </div>
  );
};

const RuleVersionTimeline = () => {
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      setIsLoading(true);
      try {
        const res = await rulesApi.getVersions();
        if (res.success) {
          const sorted = [...(res.data || [])].sort((a, b) => a.version - b.version);
          setVersions(sorted);
          // Select the active version by default
          const active = sorted.find(v => v.isActive) || sorted[sorted.length - 1];
          if (active) setSelectedVersion(active);
        }
      } catch (err) {
        console.error('Failed to load rule versions', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVersions();
  }, []);

  const getVersionStatus = (v) => {
    if (v.isActive) return 'ACTIVE';
    if (v.status === 'SCHEDULED') return 'SCHEDULED';
    return 'ARCHIVED';
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/rules')}
          className="p-2 bg-[#161616] border border-[#333] hover:border-gray-500 rounded-xl text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Rule Version Timeline</h1>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            Complete history of credit policy rule versions — every change preserved immutably.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
          <span className="ml-3 text-gray-500 text-sm">Loading version history...</span>
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No rule versions found. Deploy your first version from the BRE Studio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* LEFT: Timeline */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 space-y-2 overflow-y-auto max-h-[80vh]">
            <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Version History
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[18px] top-3 bottom-3 w-px bg-[#2a2a2a]" />

              <div className="space-y-1">
                {versions.map((v, idx) => {
                  const isSelected = selectedVersion?.version === v.version;
                  const status = getVersionStatus(v);
                  return (
                    <button
                      key={v.version}
                      onClick={() => setSelectedVersion(v)}
                      className={clsx(
                        'w-full text-left flex items-start gap-4 p-3 rounded-xl transition-all group',
                        isSelected
                          ? 'bg-amber-500/10 border border-amber-500/30'
                          : 'hover:bg-[#181818] border border-transparent'
                      )}
                    >
                      {/* Node dot */}
                      <div className="relative z-10 mt-0.5 flex-shrink-0">
                        <div className={clsx(
                          'w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold font-mono transition-all',
                          status === 'ACTIVE'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : status === 'SCHEDULED'
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : isSelected
                            ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                            : 'border-[#444] bg-[#1a1a1a] text-gray-500'
                        )}>
                          v{v.version}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={clsx(
                            'font-bold text-sm',
                            isSelected ? 'text-white' : 'text-gray-300'
                          )}>
                            Version v{v.version}
                          </span>
                          <StatusBadge status={status} isActive={v.isActive} />
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 truncate">{v.createdReason}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          {new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Detail Panel */}
          {selectedVersion && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Version Header Card */}
              <div className={clsx(
                'rounded-2xl border p-6',
                selectedVersion.isActive
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-[#111] border-[#2a2a2a]'
              )}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white font-mono">Version v{selectedVersion.version}</h2>
                      <StatusBadge status={getVersionStatus(selectedVersion)} isActive={selectedVersion.isActive} />
                    </div>
                    <p className="text-gray-300 text-sm">{selectedVersion.createdReason}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500 space-y-1 shrink-0">
                    <div className="flex items-center gap-2 justify-end">
                      <User className="w-3.5 h-3.5" />
                      <span>{selectedVersion.createdBy || 'POLICY_ADMIN'}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(selectedVersion.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                    {selectedVersion.effectiveFrom && (
                      <div className="flex items-center gap-2 justify-end">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-400">
                          Effective: {new Date(selectedVersion.effectiveFrom).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Change Log (if patch version) */}
              {selectedVersion.changeLog && selectedVersion.changeLog.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <h3 className="font-semibold text-amber-400 text-sm">What Changed in This Version</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedVersion.changeLog.map((entry, idx) => (
                      <div key={idx} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-[#222] border border-[#333] text-amber-400 font-mono text-[11px] font-bold rounded">
                            {entry.ruleCode}
                          </span>
                          <span className="text-white text-sm font-semibold">{entry.description}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <div className="text-gray-500 mb-1">Threshold</div>
                            <ThresholdDiff oldVal={entry.oldThreshold} newVal={entry.newThreshold} />
                          </div>
                          {entry.oldActionOnFail !== entry.newActionOnFail && (
                            <div>
                              <div className="text-gray-500 mb-1">Action on Fail</div>
                              <ThresholdDiff oldVal={entry.oldActionOnFail} newVal={entry.newActionOnFail} />
                            </div>
                          )}
                          <div>
                            <div className="text-gray-500 mb-1">Changed by</div>
                            <span className="text-gray-300">{entry.changedBy || 'POLICY_ADMIN'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules Table */}
              <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-white text-sm">Rules in This Version</h3>
                  </div>
                  <span className="text-xs text-gray-500">{selectedVersion.rules?.length || 0} rules</span>
                </div>
                <div className="divide-y divide-[#1a1a1a]">
                  {(selectedVersion.rules || []).map((rule, idx) => {
                    // Check if this rule was changed in changeLog
                    const wasChanged = selectedVersion.changeLog?.some(c => c.ruleCode === rule.ruleCode);
                    return (
                      <div
                        key={idx}
                        className={clsx(
                          'px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors',
                          wasChanged ? 'bg-amber-500/5' : 'hover:bg-[#161616]'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={clsx(
                            'px-2 py-0.5 border font-mono text-[11px] font-bold rounded shrink-0',
                            wasChanged
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-[#222] border-[#333] text-gray-400'
                          )}>
                            {rule.ruleCode}
                          </span>
                          <div>
                            <div className="text-white text-sm font-medium">{rule.description}</div>
                            <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                              {PARAM_LABELS[rule.parameter] || rule.parameter} {rule.operator}{' '}
                              <span className="text-white font-bold">{rule.threshold}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {wasChanged && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                              CHANGED
                            </span>
                          )}
                          <span className={clsx(
                            'px-2.5 py-1 rounded-full text-[11px] font-bold border',
                            rule.actionOnFail === 'HARD_REJECT'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          )}>
                            {rule.actionOnFail === 'HARD_REJECT' ? '🔴 HARD REJECT' : '🟡 EXCEPTION'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RuleVersionTimeline;
