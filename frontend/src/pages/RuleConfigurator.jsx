import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Play, RefreshCw, AlertTriangle, 
  Info, CheckCircle2, History, Plus, Trash2, Sparkles, ShieldAlert 
} from 'lucide-react';
import { rulesApi } from '../services/api';
import clsx from 'clsx';

const DEFAULT_RULE_TEMPLATES = [
  {
    ruleCode: 'R001',
    description: 'Minimum CIBIL Score',
    parameter: 'cibilScore',
    operator: '>=',
    threshold: 700,
    actionOnFail: 'HARD_REJECT',
    mitigatingFactors: ['Assets >= ₹2,000,000'],
  },
  {
    ruleCode: 'R002',
    description: 'Maximum Permissible FOIR',
    parameter: 'foir',
    operator: '<=',
    threshold: 50,
    actionOnFail: 'EXCEPTION',
    mitigatingFactors: ['Mutual Fund Assets >= ₹200,000', 'Low LTI ratio'],
  },
  {
    ruleCode: 'R003',
    description: 'Minimum Monthly Income',
    parameter: 'monthlyIncome',
    operator: '>=',
    threshold: 30000,
    actionOnFail: 'HARD_REJECT',
    mitigatingFactors: ['Co-applicant income'],
  },
  {
    ruleCode: 'R004',
    description: 'No Delinquency / Write-offs',
    parameter: 'writeOffs',
    operator: '==',
    threshold: 0,
    actionOnFail: 'HARD_REJECT',
    mitigatingFactors: [],
  },
  {
    ruleCode: 'R005',
    description: 'Maximum Cheque Bounces',
    parameter: 'bounceCount',
    operator: '<=',
    threshold: 2,
    actionOnFail: 'HARD_REJECT',
    mitigatingFactors: [],
  },
  {
    ruleCode: 'R006',
    description: 'Minimum Age',
    parameter: 'age',
    operator: '>=',
    threshold: 21,
    actionOnFail: 'HARD_REJECT',
    mitigatingFactors: [],
  },
];

const RuleConfigurator = () => {
  const [activeRuleSet, setActiveRuleSet] = useState(null);
  const [rules, setRules] = useState(DEFAULT_RULE_TEMPLATES);
  const [versionHistory, setVersionHistory] = useState([]);
  const [createdReason, setCreatedReason] = useState('Policy adjustment: tightened risk parameters');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccessMsg, setDeploySuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchRulesData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // 1. Get active rule set
      const activeRes = await rulesApi.getActive();
      if (activeRes.success && activeRes.data) {
        setActiveRuleSet(activeRes.data);
        setRules(activeRes.data.rules || DEFAULT_RULE_TEMPLATES);
      }

      // 2. Get version history
      try {
        const versionsRes = await rulesApi.getVersions();
        if (versionsRes.success) {
          setVersionHistory(versionsRes.data || []);
        }
      } catch (e) {
        console.warn('Could not fetch rule versions history:', e);
      }
    } catch (err) {
      console.warn('Using default rule templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesData();
  }, []);

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
    if (!createdReason) {
      alert('Please provide a policy update justification reason.');
      return;
    }

    setIsDeploying(true);
    setDeploySuccessMsg('');
    setErrorMessage('');

    try {
      const res = await rulesApi.createVersion({
        rules,
        createdReason,
      });

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

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-7 h-7 text-white" />
              <span>Configurable BRE Studio</span>
            </h1>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-mono font-bold">
              v{activeRuleSet?.version || '1'} (Active Live)
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">
            Adjust core policy thresholds, severity knockouts, and mitigating rules in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            <span>{isDeploying ? 'Activating Policy...' : 'Deploy & Activate Version'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
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

      {/* Live Policy Deployment Banner */}
      <div className="bg-[#111] border border-[#333] rounded-xl p-5 shadow-lg space-y-3">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Policy Changelog & Audit Reason for Next Version (e.g. v{(activeRuleSet?.version || 1) + 1})
        </label>
        <input
          type="text"
          value={createdReason}
          onChange={(e) => setCreatedReason(e.target.value)}
          placeholder="State reason for policy modification (e.g., Q3 risk tightening, adjusting minimum CIBIL cutoff)..."
          className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg px-4 py-2.5 text-xs focus:outline-none transition-all placeholder-gray-600"
        />
      </div>

      {/* Rule Sliders & Rule Grid */}
      <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-[#333] bg-[#161616] flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">Active Underwriting Rules</h3>
          <span className="text-xs text-gray-400">Zero-code policy agility</span>
        </div>

        <div className="divide-y divide-[#222]">
          {rules.map((rule, idx) => (
            <div key={idx} className="p-6 hover:bg-[#161616] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#222] border border-[#333] text-gray-300 font-mono text-[11px] font-bold rounded">
                    {rule.ruleCode}
                  </span>
                  <h4 className="font-bold text-white text-sm">{rule.description}</h4>
                </div>
                <div className="text-xs text-gray-400">
                  Parameter: <code className="text-amber-400 font-mono">{rule.parameter}</code> {rule.operator} <span className="text-white font-bold">{rule.threshold}</span>
                </div>
                {rule.mitigatingFactors?.length > 0 && (
                  <div className="text-[11px] text-gray-500 mt-1">
                    Mitigating factors: {rule.mitigatingFactors.join(', ')}
                  </div>
                )}
              </div>

              {/* Threshold Controls */}
              <div className="w-full md:w-80 bg-[#181818] border border-[#2a2a2a] p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Threshold Value:</span>
                  <input
                    type="number"
                    value={rule.threshold}
                    onChange={(e) => handleThresholdChange(idx, e.target.value)}
                    className="w-24 bg-[#111] border border-[#333] text-white text-right px-2 py-1 rounded text-sm font-bold font-mono focus:outline-none"
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-gray-400">Action on Fail:</span>
                  <select
                    value={rule.actionOnFail}
                    onChange={(e) => handleActionChange(idx, e.target.value)}
                    className="bg-[#111] border border-[#333] text-white text-xs rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="HARD_REJECT">HARD_REJECT</option>
                    <option value="EXCEPTION">EXCEPTION</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Versions Drawer */}
      {versionHistory.length > 0 && (
        <div className="bg-[#111] rounded-xl border border-[#333] p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
            <History className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-white text-sm">Policy Version Changelog History</h3>
          </div>

          <div className="space-y-3">
            {versionHistory.map((v) => (
              <div 
                key={v.version}
                className={clsx(
                  "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs",
                  v.isActive ? "bg-amber-500/5 border-amber-500/30" : "bg-[#181818] border-[#2a2a2a]"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">RuleSet Version v{v.version}</span>
                    {v.isActive && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">
                        ACTIVE LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 mt-1">{v.createdReason}</p>
                </div>

                <div className="text-right text-[11px] text-gray-500 shrink-0">
                  <div>Created by {v.createdBy || 'POLICY_ADMIN'}</div>
                  <div className="font-mono">{new Date(v.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleConfigurator;
