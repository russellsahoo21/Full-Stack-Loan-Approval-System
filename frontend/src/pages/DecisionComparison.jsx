import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Zap, AlertCircle, TrendingDown, TrendingUp,
  Shield, Scale, ArrowRight, BarChart3, FileText, History, 
  ChevronDown, ChevronUp
} from 'lucide-react';
import { applicationApi } from '../services/api';
import clsx from 'clsx';

const DECISION_CONFIG = {
  APPROVED: {
    label: 'APPROVED',
    emoji: '🟢',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_30px_rgba(34,197,94,0.15)]',
  },
  REJECTED: {
    label: 'REJECTED',
    emoji: '🔴',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
  },
  EXCEPTION_REQUIRED: {
    label: 'EXCEPTION',
    emoji: '🟡',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
  },
  APPROVED_VIA_EXCEPTION: {
    label: 'APPROVED ✓',
    emoji: '🟢',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: '',
  },
  REJECTED_VIA_EXCEPTION: {
    label: 'REJECTED ✗',
    emoji: '🔴',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: '',
  },
};

const getDecisionConfig = (d) => DECISION_CONFIG[d] || DECISION_CONFIG['EXCEPTION_REQUIRED'];

const ImpactBadge = ({ level }) => {
  const config = {
    HIGH: 'bg-red-500/10 text-red-400 border-red-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    NONE: 'bg-[#222] text-gray-500 border-[#333]',
  };
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-[11px] font-bold border', config[level] || config['NONE'])}>
      {level} IMPACT
    </span>
  );
};

const RuleRow = ({ beforeRule, afterRule, isChanged }) => {
  const [expanded, setExpanded] = useState(false);
  const before = beforeRule;
  const after = afterRule;

  return (
    <div
      className={clsx(
        'border rounded-xl overflow-hidden transition-all duration-200',
        isChanged ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#222] bg-[#111]'
      )}
    >
      <div className="grid grid-cols-[80px_1fr_1fr] items-center">
        {/* Rule Code */}
        <div className={clsx(
          'p-4 border-r flex items-center gap-2',
          isChanged ? 'border-amber-500/20' : 'border-[#222]'
        )}>
          <span className={clsx(
            'px-2 py-0.5 border font-mono text-[11px] font-bold rounded',
            isChanged
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-[#1a1a1a] border-[#333] text-gray-400'
          )}>
            {before?.ruleCode || after?.ruleCode}
          </span>
        </div>

        {/* Before */}
        <div className={clsx('p-4 border-r', isChanged ? 'border-amber-500/20' : 'border-[#222]')}>
          {before ? (
            <div className="flex items-center gap-2">
              {before.passed
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              }
              <div>
                <div className={clsx('text-xs font-bold', before.passed ? 'text-emerald-400' : 'text-red-400')}>
                  {before.passed ? 'PASS' : 'FAIL'}
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                  {before.thresholdRequired}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Actual: <span className="text-white font-bold">{before.actualValue}</span>
                </div>
              </div>
            </div>
          ) : <span className="text-gray-600 text-xs">—</span>}
        </div>

        {/* After */}
        <div className="p-4">
          {after ? (
            <div className="flex items-center gap-2">
              {after.passed
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              }
              <div>
                <div className={clsx('text-xs font-bold', after.passed ? 'text-emerald-400' : 'text-red-400')}>
                  {after.passed ? 'PASS' : 'FAIL'}
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                  {after.thresholdRequired}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Actual: <span className="text-white font-bold">{after.actualValue}</span>
                </div>
              </div>
            </div>
          ) : <span className="text-gray-600 text-xs">—</span>}
        </div>
      </div>

      {isChanged && (
        <div className="px-4 pb-3 border-t border-amber-500/20 pt-3">
          <div className="flex items-center gap-2 text-[11px] text-amber-400">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="font-semibold">
              {before?.description || after?.description}: Result changed {before?.passed ? 'PASS → FAIL' : 'FAIL → PASS'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const DecisionComparison = () => {
  const { id, targetVersion } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAudit, setIsSavingAudit] = useState(false);
  const [auditSaved, setAuditSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComparison = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await applicationApi.evaluateVersion(id, targetVersion);
        if (res.success) {
          setData(res.comparison);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load comparison data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchComparison();
  }, [id, targetVersion]);

  const handleSaveAudit = async () => {
    setIsSavingAudit(true);
    try {
      await applicationApi.reRunAndSave(id, targetVersion);
      setAuditSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save audit record');
    } finally {
      setIsSavingAudit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-amber-500/20 rounded-full animate-spin border-t-amber-500" />
          <Zap className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-400 text-sm animate-pulse">Running BRE Engine under v{targetVersion}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-red-400">{error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Go Back
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { before, after, analysis, applicantName, applicantId, applicationId, loanAmount } = data;
  const beforeConfig = getDecisionConfig(before?.decision);
  const afterConfig = getDecisionConfig(after?.decision);

  // Merge scorecards for comparison
  const allRuleCodes = [...new Set([
    ...(before?.scorecard || []).map(r => r.ruleCode),
    ...(after?.scorecard || []).map(r => r.ruleCode)
  ])];

  const changedRuleCodes = new Set((analysis?.changedRules || []).map(r => r.ruleCode));

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/applications/${id}`)}
            className="p-2 bg-[#161616] border border-[#333] hover:border-gray-500 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              Decision Comparison
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {applicationId} · {applicantName} · v{before?.version} vs v{after?.version}
            </p>
          </div>
        </div>

        {/* Save Audit Button */}
        {!auditSaved ? (
          <button
            onClick={handleSaveAudit}
            disabled={isSavingAudit}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            {isSavingAudit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
            {isSavingAudit ? 'Saving...' : 'Save to Audit Trail'}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Audit Record Saved
          </div>
        )}
      </div>

      {/* BEFORE vs AFTER Decision Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* BEFORE */}
        <div className={clsx(
          'rounded-2xl border p-6 text-center space-y-3 transition-all',
          beforeConfig.bg, beforeConfig.border, beforeConfig.glow
        )}>
          <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Before</div>
          <div className="text-5xl">{beforeConfig.emoji}</div>
          <div className={clsx('text-2xl font-black tracking-tight', beforeConfig.color)}>
            {beforeConfig.label}
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#111]/60 border border-[#333] rounded-full">
            <span className="text-xs text-gray-400 font-mono">Rule Set</span>
            <span className="text-xs font-bold text-white font-mono">v{before?.version}</span>
          </div>
          {before?.evaluationResult?.riskGrade && (
            <div className="text-xs text-gray-500">{before.evaluationResult.riskGrade}</div>
          )}
        </div>

        {/* AFTER */}
        <div className={clsx(
          'rounded-2xl border p-6 text-center space-y-3 transition-all',
          afterConfig.bg, afterConfig.border, afterConfig.glow
        )}>
          <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">After</div>
          <div className="text-5xl">{afterConfig.emoji}</div>
          <div className={clsx('text-2xl font-black tracking-tight', afterConfig.color)}>
            {afterConfig.label}
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#111]/60 border border-[#333] rounded-full">
            <span className="text-xs text-gray-400 font-mono">Rule Set</span>
            <span className="text-xs font-bold text-white font-mono">v{after?.version}</span>
          </div>
          {after?.evaluationResult?.riskGrade && (
            <div className="text-xs text-gray-500">{after.evaluationResult.riskGrade}</div>
          )}
        </div>
      </div>

      {/* Decision Changed Banner */}
      {analysis?.decisionChanged ? (
        <div className="bg-amber-500/8 border border-amber-500/25 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-500/15 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-white text-sm">Decision Changed</h3>
                <ImpactBadge level={analysis?.impactLevel} />
              </div>
              <p className="text-xs text-gray-400">
                The policy change from v{before?.version} → v{after?.version} caused the decision to shift from{' '}
                <span className={clsx('font-bold', beforeConfig.color)}>{before?.decision}</span>
                {' → '}
                <span className={clsx('font-bold', afterConfig.color)}>{after?.decision}</span>.
                Original decision remains immutable.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-400 font-semibold">
            No decision change — applicant would still receive the same outcome under v{after?.version}.
          </span>
        </div>
      )}

      {/* Impact Analysis */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Rules Evaluated', value: analysis?.rulesEvaluated || 0, icon: Shield, color: 'text-gray-400' },
          { label: 'Rules Changed', value: analysis?.changedRules?.length || 0, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Rules Passed', value: analysis?.rulesPassed || 0, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Rules Failed', value: analysis?.rulesFailed || 0, icon: XCircle, color: 'text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 text-center">
            <Icon className={clsx('w-5 h-5 mx-auto mb-2', color)} />
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-[11px] text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Why did decision change? */}
      {analysis?.primaryChangedRule && (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#222] flex items-center gap-2 bg-[#141414]">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Why Did the Decision Change?</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Primary Cause</div>
            {analysis.changedRules.map((rule, idx) => (
              <div key={idx} className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold rounded">
                    {rule.ruleCode}
                  </span>
                  <span className="text-white text-sm font-semibold">{rule.description}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-gray-500 mb-1">Before (v{before?.version})</div>
                    <div className="font-mono text-gray-300">{rule.before?.thresholdRequired}</div>
                    <div className={clsx('font-bold mt-1', rule.before?.passed ? 'text-emerald-400' : 'text-red-400')}>
                      {rule.before?.passed ? '✓ PASS' : '✕ FAIL'}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">After (v{after?.version})</div>
                    <div className="font-mono text-gray-300">{rule.after?.thresholdRequired}</div>
                    <div className={clsx('font-bold mt-1', rule.after?.passed ? 'text-emerald-400' : 'text-red-400')}>
                      {rule.after?.passed ? '✓ PASS' : '✕ FAIL'}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 pt-2 border-t border-[#222]">
                  Applicant value:{' '}
                  <span className="text-white font-bold font-mono">{rule.before?.actualValue}</span>
                  {' — '}
                  {rule.before?.passed && !rule.after?.passed ? 'Previously passed, now fails the tightened threshold.' :
                   !rule.before?.passed && rule.after?.passed ? 'Previously failed, now passes the relaxed threshold.' :
                   'Result changed.'}
                </div>
              </div>
            ))}

            {/* Decision transition arrow */}
            <div className="flex items-center justify-center gap-4 py-4">
              <div className={clsx('px-5 py-2.5 rounded-xl border text-sm font-bold', beforeConfig.bg, beforeConfig.border, beforeConfig.color)}>
                {before?.decision}
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <div className="w-8 h-px bg-[#333]" />
                <ArrowRight className="w-4 h-4" />
                <div className="w-8 h-px bg-[#333]" />
              </div>
              <div className={clsx('px-5 py-2.5 rounded-xl border text-sm font-bold', afterConfig.bg, afterConfig.border, afterConfig.color)}>
                {after?.decision}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Rule-by-Rule Scorecard */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="bg-[#141414] border-b border-[#222] grid grid-cols-[80px_1fr_1fr] text-[11px] font-bold text-gray-500 uppercase tracking-widest">
          <div className="p-4 border-r border-[#222]">Rule</div>
          <div className="p-4 border-r border-[#222] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#444]" />
            Before (v{before?.version})
          </div>
          <div className="p-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            After (v{after?.version})
          </div>
        </div>
        <div className="p-4 space-y-2">
          {allRuleCodes.map((code) => {
            const beforeRule = (before?.scorecard || []).find(r => r.ruleCode === code);
            const afterRule = (after?.scorecard || []).find(r => r.ruleCode === code);
            return (
              <RuleRow
                key={code}
                beforeRule={beforeRule}
                afterRule={afterRule}
                isChanged={changedRuleCodes.has(code)}
              />
            );
          })}
        </div>
      </div>

      {/* Immutability Notice */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-500">
          <span className="text-gray-300 font-semibold">Original decision is immutable.</span>
          {' '}Application #{applicationId} was evaluated under v{before?.version} and its decision of{' '}
          <span className={clsx('font-bold', beforeConfig.color)}>{before?.decision}</span>
          {' '}will never be overwritten. This comparison is for analysis only.
          {' '}Use "Save to Audit Trail" to record this re-evaluation permanently.
        </div>
      </div>
    </div>
  );
};

export default DecisionComparison;
