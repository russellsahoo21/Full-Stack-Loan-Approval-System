import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Save, RefreshCw, CheckCircle2, History, Sparkles,
  ShieldAlert, Edit3, X, ChevronRight, GitBranch, Zap,
  ArrowRight, Clock, AlertTriangle
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

const DEFAULT_RULE_TEMPLATES = [
  { ruleCode: 'R001', description: 'Minimum CIBIL Score', parameter: 'cibilScore', operator: '>=', threshold: 700, actionOnFail: 'HARD_REJECT', mitigatingFactors: ['Assets >= ₹2,000,000'] },
  { ruleCode: 'R002', description: 'Maximum Permissible FOIR', parameter: 'foir', operator: '<=', threshold: 50, actionOnFail: 'EXCEPTION', mitigatingFactors: ['Mutual Fund Assets >= ₹200,000'] },
  { ruleCode: 'R003', description: 'Minimum Monthly Income', parameter: 'monthlyIncome', operator: '>=', threshold: 30000, actionOnFail: 'HARD_REJECT', mitigatingFactors: ['Co-applicant income'] },
  { ruleCode: 'R004', description: 'No Delinquency / Write-offs', parameter: 'writeOffs', operator: '==', threshold: 0, actionOnFail: 'HARD_REJECT', mitigatingFactors: [] },
  { ruleCode: 'R005', description: 'Maximum Cheque Bounces', parameter: 'bounceCount', operator: '<=', threshold: 2, actionOnFail: 'HARD_REJECT', mitigatingFactors: [] },
  { ruleCode: 'R006', description: 'Minimum Age', parameter: 'age', operator: '>=', threshold: 21, actionOnFail: 'HARD_REJECT', mitigatingFactors: [] },
];

// Inline Edit Panel for single rule patching
const InlineEditPanel = ({ rule, onSubmit, onCancel, isSubmitting }) => {
  const [newThreshold, setNewThreshold] = useState(rule.threshold);
  const [newAction, setNewAction] = useState(rule.actionOnFail);
  const [changeReason, setChangeReason] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0]
  );

  const thresholdChanged = Number(newThreshold) !== Number(rule.threshold);
  const actionChanged = newAction !== rule.actionOnFail;
  const hasChanges = thresholdChanged || actionChanged;

  return (
    <div className="mt-3 bg-[#0e0e0e] border border-amber-500/30 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Edit3 className="w-3.5 h-3.5" />
          Edit Rule: {rule.ruleCode}
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current Threshold (read-only) */}
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">
            Current Threshold
          </label>
          <div className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2">
            <span className="text-gray-400 text-sm font-mono">{rule.operator}</span>
            <span className="text-white font-bold font-mono text-sm">{rule.threshold}</span>
            <span className="text-xs text-gray-600 ml-auto">(read-only)</span>
          </div>
        </div>

        {/* New Threshold */}
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">
            New Threshold <span className="text-amber-400">*</span>
          </label>
          <div className="flex items-center gap-2 bg-[#141414] border border-amber-500/30 rounded-lg px-3 py-2">
            <span className="text-gray-400 text-sm font-mono">{rule.operator}</span>
            <input
              type="number"
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
              className="flex-1 bg-transparent text-white font-bold font-mono text-sm focus:outline-none"
              autoFocus
            />
            {thresholdChanged && (
              <div className="flex items-center gap-1 text-[10px] shrink-0">
                <span className="text-gray-500 line-through">{rule.threshold}</span>
                <ArrowRight className="w-2.5 h-2.5 text-amber-400" />
                <span className="text-amber-400 font-bold">{newThreshold}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action on Fail */}
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">
            Action on Fail
          </label>
          <select
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-amber-500/50 text-white text-sm rounded-lg px-3 py-2 focus:outline-none transition-all"
          >
            <option value="HARD_REJECT">🔴 HARD_REJECT</option>
            <option value="EXCEPTION">🟡 EXCEPTION</option>
          </select>
        </div>

        {/* Effective From */}
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">
            Effective From
          </label>
          <div className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Change Reason */}
      <div>
        <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">
          Change Reason <span className="text-amber-400">*</span>
        </label>
        <input
          type="text"
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
          placeholder="e.g. Tightening CIBIL policy for high-risk applicants post Q3 review..."
          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-amber-500/50 text-white rounded-lg px-4 py-2.5 text-xs focus:outline-none transition-all placeholder-gray-600"
        />
      </div>

      {/* Preview */}
      {hasChanges && changeReason && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 text-xs">
          <div className="text-amber-400 font-bold mb-1">Preview — New Version Will Be Created:</div>
          <div className="text-gray-300">
            {rule.ruleCode} · {rule.description}
            {thresholdChanged && (
              <span className="ml-2">
                threshold: <span className="line-through text-gray-500">{rule.threshold}</span>
                {' → '}
                <span className="text-amber-400 font-bold">{newThreshold}</span>
              </span>
            )}
            {actionChanged && (
              <span className="ml-2">
                action: <span className="line-through text-gray-500">{rule.actionOnFail}</span>
                {' → '}
                <span className="text-amber-400 font-bold">{newAction}</span>
              </span>
            )}
          </div>
          <div className="text-gray-500 mt-1">Reason: {changeReason}</div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-[#1a1a1a] border border-[#333] hover:border-gray-500 text-gray-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit({ newThreshold: Number(newThreshold), newActionOnFail: newAction, changeReason, effectiveFrom })}
          disabled={isSubmitting || !hasChanges || !changeReason}
          className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        >
          {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {isSubmitting ? 'Creating Version...' : 'Create New Version'}
        </button>
      </div>
    </div>
  );
};

const RuleConfigurator = () => {
  const navigate = useNavigate();
  const [activeRuleSet, setActiveRuleSet] = useState(null);
  const [rules, setRules] = useState(DEFAULT_RULE_TEMPLATES);
  const [versionHistory, setVersionHistory] = useState([]);
  const [createdReason, setCreatedReason] = useState('Policy adjustment: tightened risk parameters');

  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccessMsg, setDeploySuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Inline edit state
  const [editingRuleIdx, setEditingRuleIdx] = useState(null);
  const [isPatching, setIsPatching] = useState(false);
  const [patchSuccessMsg, setPatchSuccessMsg] = useState('');

  const fetchRulesData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const activeRes = await rulesApi.getActive();
      if (activeRes.success && activeRes.data) {
        setActiveRuleSet(activeRes.data);
        setRules(activeRes.data.rules || DEFAULT_RULE_TEMPLATES);
      }
      try {
        const versionsRes = await rulesApi.getVersions();
        if (versionsRes.success) setVersionHistory(versionsRes.data || []);
      } catch (e) {
        console.warn('Could not fetch rule versions history:', e);
      }
    } catch (err) {
      console.warn('Using default rule templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRulesData(); }, []);

  const handleThresholdChange = (index, val) => {
    setDeploySuccessMsg('');
    const updated = [...rules];
    updated[index].threshold = Number(val);
    setRules(updated);
  };

  const handleActionChange = (index, newAction) => {
    setDeploySuccessMsg('');
    const updated = [...rules];
    updated[index].actionOnFail = newAction;
    setRules(updated);
  };

  const handleDeployNewVersion = async () => {
    if (!createdReason) { alert('Please provide a policy update justification reason.'); return; }
    setIsDeploying(true);
    setDeploySuccessMsg('');
    setErrorMessage('');
    try {
      const res = await rulesApi.createVersion({ rules, createdReason });
      if (res.success && res.data) {
        setDeploySuccessMsg(`Version v${res.data.version} activated live! Zero backend code changes required.`);
        await fetchRulesData();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to deploy new rule set version');
    } finally {
      setIsDeploying(false);
    }
  };

  // Patch single rule → new version
  const handlePatchRule = async (rule, { newThreshold, newActionOnFail, changeReason, effectiveFrom }) => {
    setIsPatching(true);
    setPatchSuccessMsg('');
    setErrorMessage('');
    try {
      const res = await rulesApi.patchVersion({
        ruleCode: rule.ruleCode,
        newThreshold,
        newActionOnFail,
        changeReason,
        effectiveFrom,
        changedBy: 'Credit Policy Admin'
      });
      if (res.success) {
        setPatchSuccessMsg(`✓ Version v${res.newVersion} created — ${rule.ruleCode} threshold: ${rule.threshold} → ${newThreshold}`);
        setEditingRuleIdx(null);
        await fetchRulesData();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create patch version');
    } finally {
      setIsPatching(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Settings className="w-7 h-7 text-white" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Configurable BRE Studio</h1>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-mono font-bold">
              v{activeRuleSet?.version || '1'} (Active Live)
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">
            Edit individual rules to create versioned policy updates, or deploy a full new version.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeline button */}
          <button
            onClick={() => navigate('/admin/rules/timeline')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#161616] border border-[#333] hover:border-amber-500/50 rounded-xl text-sm text-gray-400 hover:text-amber-400 transition-all"
          >
            <GitBranch className="w-4 h-4" />
            <span>Version Timeline</span>
          </button>

          <button
            onClick={fetchRulesData}
            disabled={isLoading}
            className="p-2.5 bg-[#161616] border border-[#333] hover:border-gray-500 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleDeployNewVersion}
            disabled={isDeploying}
            className="px-5 py-2.5 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200 transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.15)] disabled:opacity-50"
          >
            {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isDeploying ? 'Activating Policy...' : 'Deploy Full Version'}</span>
          </button>
        </div>
      </div>

      {/* Patch success */}
      {patchSuccessMsg && (
        <div className="bg-amber-500/8 border border-amber-500/25 text-amber-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Zap className="w-4 h-4" />
          <span>{patchSuccessMsg}</span>
        </div>
      )}

      {/* Deploy success */}
      {deploySuccessMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{deploySuccessMsg}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <ShieldAlert className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Full version deploy reason */}
      <div className="bg-[#111] border border-[#333] rounded-xl p-5 space-y-3">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Full Version Deploy — Policy Changelog Reason (for v{(activeRuleSet?.version || 1) + 1})
        </label>
        <input
          type="text"
          value={createdReason}
          onChange={(e) => setCreatedReason(e.target.value)}
          placeholder="State reason for policy modification..."
          className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-4 py-2.5 text-xs focus:outline-none transition-all placeholder-gray-600"
        />
        <p className="text-[11px] text-gray-600">
          💡 For changing a single rule, use the <span className="text-amber-400">Edit</span> button on any rule card below instead of a full deploy.
        </p>
      </div>

      {/* Rule Cards */}
      <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-[#333] bg-[#161616] flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">Active Underwriting Rules</h3>
          <span className="text-xs text-gray-400">Click Edit on any rule to create a precise version</span>
        </div>

        <div className="divide-y divide-[#222]">
          {rules.map((rule, idx) => (
            <div key={idx} className="p-6 hover:bg-[#161616] transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#222] border border-[#333] text-gray-300 font-mono text-[11px] font-bold rounded">
                      {rule.ruleCode}
                    </span>
                    <h4 className="font-bold text-white text-sm">{rule.description}</h4>
                  </div>
                  <div className="text-xs text-gray-400">
                    {PARAM_LABELS[rule.parameter] || rule.parameter}{' '}
                    <code className="text-amber-400 font-mono">{rule.operator}</code>{' '}
                    <span className="text-white font-bold">{rule.threshold}</span>
                  </div>
                  {rule.mitigatingFactors?.length > 0 && (
                    <div className="text-[11px] text-gray-500">
                      Mitigating: {rule.mitigatingFactors.join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Action badge */}
                  <span className={clsx(
                    'px-2.5 py-1 rounded-full text-[11px] font-bold border',
                    rule.actionOnFail === 'HARD_REJECT'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                  )}>
                    {rule.actionOnFail === 'HARD_REJECT' ? '🔴 HARD REJECT' : '🟡 EXCEPTION'}
                  </span>

                  {/* Threshold quick input */}
                  <div className={clsx(
                    "w-36 bg-[#181818] border p-2.5 rounded-xl transition-all",
                    activeRuleSet?.rules?.[idx] && Number(rule.threshold) !== Number(activeRuleSet.rules[idx].threshold)
                      ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "border-[#2a2a2a]"
                  )}>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                      <span>Threshold</span>
                      {activeRuleSet?.rules?.[idx] && Number(rule.threshold) !== Number(activeRuleSet.rules[idx].threshold) && (
                        <span className="text-amber-400 font-bold text-[9px] animate-pulse">MODIFIED</span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={rule.threshold}
                      onChange={(e) => handleThresholdChange(idx, e.target.value)}
                      className={clsx(
                        "w-full bg-[#111] border text-center px-2 py-1 rounded text-sm font-bold font-mono focus:outline-none transition-all",
                        activeRuleSet?.rules?.[idx] && Number(rule.threshold) !== Number(activeRuleSet.rules[idx].threshold)
                          ? "border-amber-500/60 text-amber-300"
                          : "border-[#333] text-white"
                      )}
                    />
                  </div>

                  {/* Quick Deploy button if threshold changed */}
                  {activeRuleSet?.rules?.[idx] && Number(rule.threshold) !== Number(activeRuleSet.rules[idx].threshold) && (
                    <button
                      onClick={() => handlePatchRule(activeRuleSet.rules[idx], {
                        newThreshold: Number(rule.threshold),
                        newActionOnFail: rule.actionOnFail,
                        changeReason: `Direct threshold update for ${rule.ruleCode}: ${activeRuleSet.rules[idx].threshold} → ${rule.threshold}`,
                        effectiveFrom: new Date().toISOString().split('T')[0]
                      })}
                      disabled={isPatching}
                      className="flex items-center gap-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all shrink-0"
                    >
                      {isPatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>Save v{(activeRuleSet?.version || 1) + 1}</span>
                    </button>
                  )}

                  {/* Edit button */}
                  <button
                    onClick={() => setEditingRuleIdx(editingRuleIdx === idx ? null : idx)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0',
                      editingRuleIdx === idx
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-amber-500/50 hover:text-amber-400'
                    )}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {editingRuleIdx === idx ? 'Cancel' : 'Advanced'}
                  </button>
                </div>
              </div>

              {/* Inline edit panel */}
              {editingRuleIdx === idx && (
                <InlineEditPanel
                  rule={rule}
                  onSubmit={(data) => handlePatchRule(rule, data)}
                  onCancel={() => setEditingRuleIdx(null)}
                  isSubmitting={isPatching}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Version History */}
      {versionHistory.length > 0 && (
        <div className="bg-[#111] rounded-xl border border-[#333] p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-white text-sm">Policy Version Changelog History</h3>
            </div>
            <button
              onClick={() => navigate('/admin/rules/timeline')}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Full Timeline
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {versionHistory.slice(0, 5).map((v) => (
              <div
                key={v.version}
                className={clsx(
                  'p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs',
                  v.isActive ? 'bg-amber-500/5 border-amber-500/30' : 'bg-[#181818] border-[#2a2a2a]'
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">v{v.version}</span>
                    {v.isActive && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                        ACTIVE
                      </span>
                    )}
                    {v.changeLog?.length > 0 && (
                      <span className="text-[10px] text-gray-500">
                        {v.changeLog.length} rule{v.changeLog.length > 1 ? 's' : ''} changed
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 mt-1">{v.createdReason}</p>
                  {v.changeLog?.map((cl, i) => (
                    <div key={i} className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                      <span className="text-amber-400 font-mono">{cl.ruleCode}</span>
                      <span>{cl.oldThreshold}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                      <span className="text-white font-bold">{cl.newThreshold}</span>
                    </div>
                  ))}
                </div>
                <div className="text-right text-[11px] text-gray-500 shrink-0">
                  <div>By {v.createdBy || 'POLICY_ADMIN'}</div>
                  <div className="font-mono">{new Date(v.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            ))}
            {versionHistory.length > 5 && (
              <button
                onClick={() => navigate('/admin/rules/timeline')}
                className="w-full text-center text-xs text-gray-500 hover:text-amber-400 transition-colors py-2"
              >
                View all {versionHistory.length} versions in Timeline →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleConfigurator;
