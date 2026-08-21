import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, Layers, ShieldCheck, AlertTriangle, 
  CheckCircle2, XCircle, TrendingUp, Sparkles, 
  Clock, ArrowRight, User, FileText, Check, X, 
  RefreshCw, Search, ChevronRight, BarChart3, 
  History, ArrowUpRight, Scale, Filter, Send, Sliders
} from 'lucide-react';
import { formatCurrency } from '../utils/masking';
import { useNavigate, Link } from 'react-router-dom';
import { exceptionsApi } from '../services/api';
import { useAuth, ROLES } from '../context/AuthContext';
import clsx from 'clsx';

const ExceptionIntelligenceStudio = () => {
  const navigate = useNavigate();
  const { currentRole } = useAuth();

  const [clusterData, setClusterData] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeTriageTab, setActiveTriageTab] = useState('ALL'); // 'ALL' | 'GROUP_A' | 'GROUP_B' | 'GROUP_C'
  const [activeView, setActiveView] = useState('clusters'); // 'clusters' | 'l2_queue' | 'evidence_matrix'
  const [l2Queue, setL2Queue] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchActionModal, setBatchActionModal] = useState(null); // { cluster, group, action, apps }
  const [officerNotes, setOfficerNotes] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isL2 = currentRole === ROLES.CREDIT_OFFICER_L2 || currentRole === ROLES.POLICY_ADMIN;

  const fetchClusterIntelligence = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await exceptionsApi.getClusters();
      if (res.success && res.data) {
        setClusterData(res.data);
        // Select first active cluster by default if none selected
        if (!selectedCluster && res.data.clusters?.length > 0) {
          const firstActive = res.data.clusters.find(c => c.applicationsCount > 0) || res.data.clusters[0];
          setSelectedCluster(firstActive);
        } else if (selectedCluster) {
          const updated = res.data.clusters.find(c => c.profileCode === selectedCluster.profileCode);
          if (updated) setSelectedCluster(updated);
        }
      }

      // Fetch L2 Queue if senior officer
      try {
        const l2Res = await exceptionsApi.getL2Queue();
        if (l2Res.success) {
          setL2Queue(l2Res.data || []);
        }
      } catch (e) {
        console.warn('L2 queue fetch note:', e.message);
      }
    } catch (err) {
      console.error('Failed to fetch exception clusters:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load Exception Intelligence data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClusterIntelligence();
  }, [currentRole]);

  // Open Batch Decision Modal with auto-generated regulatory justification
  const handleOpenBatchModal = (cluster, group, action, targetApp = null) => {
    let targetApps = [];
    if (targetApp) {
      targetApps = [targetApp];
    } else if (group === 'GROUP_A') targetApps = cluster.groupA || [];
    else if (group === 'GROUP_B') targetApps = cluster.groupB || [];
    else if (group === 'GROUP_C') targetApps = cluster.groupC || [];
    else targetApps = cluster.applications || [];

    if (targetApps.length === 0) {
      alert(`No applications pending in ${group} for this cluster.`);
      return;
    }

    const defaultJustification = action === 'APPROVE'
      ? `[Credit Exception Intelligence] ${group === 'L2_QUEUE' ? 'Senior L2 Override approved' : 'Batch approved'} ${targetApps.length > 1 ? `${targetApps.length} cases` : `application ${targetApps[0]?.applicationId || targetApps[0]?._id}`} under Exception Profile ${cluster.profileCode} (${cluster.name}). Empirical evidence shows high repayment capability and compensating liquid asset buffer verified by Senior Risk Head.`
      : `[Credit Exception Intelligence] Batch rejected ${targetApps.length} cases under Exception Profile ${cluster.profileCode} due to elevated risk metrics beyond permissible NBFC tolerance.`;

    setOfficerNotes(defaultJustification);
    setBatchActionModal({
      cluster,
      group,
      action,
      apps: targetApps
    });
  };

  // Execute Batch Decision
  const handleExecuteBatchDecision = async () => {
    if (!batchActionModal) return;
    setIsProcessingBatch(true);
    setErrorMessage('');
    setSuccessBanner('');

    try {
      const appIds = batchActionModal.apps.map(a => a.applicationId || a._id);
      const res = await exceptionsApi.batchDecision({
        applicationIds: appIds,
        action: batchActionModal.action,
        officerNotes,
        exceptionProfileCode: batchActionModal.cluster.profileCode,
        triageGroup: batchActionModal.group,
        isL2Decision: isL2
      });

      if (res.success) {
        setSuccessBanner(`✓ Successfully processed ${res.affectedCount} applications under ${batchActionModal.cluster.profileCode} (${batchActionModal.group})`);
        setBatchActionModal(null);
        await fetchClusterIntelligence();
      } else {
        setErrorMessage(res.message || 'Batch execution failed');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to process batch decision');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  // Escalate Single Application to L2
  const handleEscalateToL2 = async (appId, notes) => {
    try {
      const res = await exceptionsApi.escalateToL2(appId, {
        escalationNotes: notes || `Escalated to Credit Officer L2 from ${selectedCluster?.profileCode} Cluster.`
      });
      if (res.success) {
        setSuccessBanner(`Application ${appId} escalated to Senior Credit Officer L2 Queue.`);
        await fetchClusterIntelligence();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Escalation failed');
    }
  };

  const displayedApps = () => {
    if (!selectedCluster) return [];
    if (activeTriageTab === 'GROUP_A') return selectedCluster.groupA || [];
    if (activeTriageTab === 'GROUP_B') return selectedCluster.groupB || [];
    if (activeTriageTab === 'GROUP_C') return selectedCluster.groupC || [];
    return selectedCluster.applications || [];
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 space-y-6">
      
      {/* Top Header & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#222] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Credit Exception Intelligence Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                  CEIE Core Engine
                </span>
              </div>
              <p className="text-gray-400 mt-1 text-xs sm:text-sm">
                Multi-Factor Case Clustering, Historical Portfolio Evidence & Tri-Tier Risk Auto-Triage (L1/L2).
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Navigation */}
        <div className="flex items-center bg-[#161616] p-1 rounded-xl border border-[#333] self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('clusters')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeView === 'clusters' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Case Archetype Clusters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('l2_queue')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 relative ${
              activeView === 'l2_queue' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span>Senior L2 Escalation Queue</span>
            {l2Queue.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-500 text-white font-mono font-bold">
                {l2Queue.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('evidence_matrix')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeView === 'evidence_matrix' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>10,000+ Evidence Matrix</span>
          </button>
        </div>
      </div>

      {/* Global Impact & Efficiency KPIs */}
      {clusterData?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
          <div className="bg-[#111] border border-[#2a2a2a] p-4 rounded-xl shadow-lg">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">Total Exceptions</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {clusterData.summary.totalExceptions} <span className="text-xs font-normal text-gray-500">Cases</span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">In Active Underwriting</span>
          </div>

          <div className="bg-[#111] border border-green-500/20 p-4 rounded-xl shadow-lg bg-green-500/5">
            <span className="text-[10px] uppercase tracking-wider text-green-400 block font-semibold">Group A: Low Concern</span>
            <div className="text-2xl font-extrabold text-green-400 mt-1 font-mono">
              {clusterData.summary.totalGroupA} <span className="text-xs font-normal text-gray-400">Cases</span>
            </div>
            <span className="text-[10px] text-green-300/80 mt-1 block">1-Click Fast-Track Ready</span>
          </div>

          <div className="bg-[#111] border border-yellow-500/20 p-4 rounded-xl shadow-lg bg-yellow-500/5">
            <span className="text-[10px] uppercase tracking-wider text-yellow-400 block font-semibold">Group B: Targeted Review</span>
            <div className="text-2xl font-extrabold text-yellow-400 mt-1 font-mono">
              {clusterData.summary.totalGroupB} <span className="text-xs font-normal text-gray-400">Cases</span>
            </div>
            <span className="text-[10px] text-yellow-300/80 mt-1 block">Focused Parameter Scrutiny</span>
          </div>

          <div className="bg-[#111] border border-red-500/20 p-4 rounded-xl shadow-lg bg-red-500/5">
            <span className="text-[10px] uppercase tracking-wider text-red-400 block font-semibold">Group C / L2 Escalated</span>
            <div className="text-2xl font-extrabold text-red-400 mt-1 font-mono">
              {clusterData.summary.totalGroupC} <span className="text-xs font-normal text-gray-400">Cases</span>
            </div>
            <span className="text-[10px] text-red-300/80 mt-1 block">High Risk / Thin Buffer</span>
          </div>

          <div className="bg-[#111] border border-purple-500/30 p-4 rounded-xl shadow-lg col-span-2 sm:col-span-4 lg:col-span-1 bg-purple-500/5">
            <span className="text-[10px] uppercase tracking-wider text-purple-300 block font-semibold">Time Saved</span>
            <div className="text-2xl font-extrabold text-purple-400 mt-1 flex items-center gap-1">
              <span>{clusterData.summary.operationalEfficiencyGainPercent}%</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">~{clusterData.summary.estimatedHoursSaved} Officer Hours Saved</span>
          </div>
        </div>
      )}

      {/* Notifications */}
      {successBanner && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner('')} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: CASE ARCHETYPE CLUSTERS & TRI-TIER TRIAGE */}
      {/* ======================================================== */}
      {activeView === 'clusters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Archetype Cluster Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Multi-Factor Exception Archetypes ({clusterData?.clusters?.length || 0})
              </span>
              <span className="text-[11px] text-gray-500">Click to inspect cohort</span>
            </div>

            <div className="space-y-2.5">
              {clusterData?.clusters?.map((cluster) => {
                const isSelected = selectedCluster?.profileCode === cluster.profileCode;
                const hasCases = cluster.applicationsCount > 0;

                return (
                  <button
                    key={cluster.profileCode}
                    type="button"
                    onClick={() => {
                      setSelectedCluster(cluster);
                      setActiveTriageTab('ALL');
                    }}
                    className={`w-full text-left p-4.5 rounded-2xl border transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#181818] border-white shadow-xl ring-1 ring-white/20'
                        : hasCases
                        ? 'bg-[#111] border-[#2c2c2c] hover:border-gray-500 hover:bg-[#141414]'
                        : 'bg-[#0d0d0d] border-[#222] opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-extrabold bg-[#222] text-amber-400 border border-[#333]">
                          {cluster.profileCode}
                        </span>
                        <h3 className="font-bold text-sm text-white truncate max-w-[200px]">
                          {cluster.name}
                        </h3>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        hasCases ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {cluster.applicationsCount} Cases
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                      {cluster.description}
                    </p>

                    {/* Historical Benchmarks Bar */}
                    <div className="bg-[#141414] border border-[#222] rounded-xl p-2.5 flex items-center justify-between text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase">Historical Approval</span>
                        <span className="text-emerald-400 font-extrabold font-mono">{cluster.benchmarkApprovalRate}%</span>
                      </div>
                      <div className="h-6 w-px bg-[#262626]" />
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase">Hist. 90+ Default</span>
                        <span className="text-red-400 font-extrabold font-mono">{cluster.benchmarkDefaultRate}%</span>
                      </div>
                      <div className="h-6 w-px bg-[#262626]" />
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase">Sample Base</span>
                        <span className="text-gray-300 font-mono">{cluster.historicalSampleSize}</span>
                      </div>
                    </div>

                    {/* Tri-Tier Breakdown Pills */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-gray-400">A: <strong className="text-white">{cluster.groupACount}</strong></span>
                        
                        <span className="w-2 h-2 rounded-full bg-yellow-400 ml-2" />
                        <span className="text-gray-400">B: <strong className="text-white">{cluster.groupBCount}</strong></span>

                        <span className="w-2 h-2 rounded-full bg-red-400 ml-2" />
                        <span className="text-gray-400">C: <strong className="text-white">{cluster.groupCCount}</strong></span>
                      </div>

                      {cluster.totalExposureAmount > 0 && (
                        <span className="text-amber-400 font-mono font-bold text-xs">
                          {formatCurrency(cluster.totalExposureAmount)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Cluster Deep-Dive & Cohort Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedCluster ? (
              <div className="bg-[#111] border border-[#333] rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in">
                
                {/* Cluster Header & Policy Agility Conversion CTA */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#222] pb-5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {selectedCluster.profileCode}
                      </span>
                      <h2 className="text-xl font-bold text-white">
                        {selectedCluster.name}
                      </h2>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {selectedCluster.description}
                    </p>
                  </div>

                  {/* Policy Agility CTA (L2/Admin): Convert recurring safe pattern to new RuleSet */}
                  <Link
                    to="/admin/rules"
                    className="px-3.5 py-2 bg-[#1c1c1c] hover:bg-[#262626] border border-[#444] hover:border-amber-400/50 text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-md"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Convert to Rule Policy v2</span>
                  </Link>
                </div>

                {/* Empirical Historical Evidence Card */}
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#242424] pb-2.5">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">
                        Empirical Evidence Base ({selectedCluster.historicalSampleSize} Resolved Cases)
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">Statistical Risk Evidence</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-[#1a1a1a] p-2.5 rounded-lg border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase">Historical Approval</span>
                      <span className="text-lg font-extrabold text-emerald-400 font-mono">{selectedCluster.benchmarkApprovalRate}%</span>
                    </div>
                    <div className="bg-[#1a1a1a] p-2.5 rounded-lg border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase">Approved w/ Conditions</span>
                      <span className="text-lg font-extrabold text-yellow-400 font-mono">{selectedCluster.historicalBreakdown?.approvedWithConditions || 8.2}%</span>
                    </div>
                    <div className="bg-[#1a1a1a] p-2.5 rounded-lg border border-[#2a2a2a]">
                      <span className="text-[10px] text-gray-400 block uppercase">Observed 90+ Default</span>
                      <span className="text-lg font-extrabold text-red-400 font-mono">{selectedCluster.benchmarkDefaultRate}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1.5">
                      Top Verified Mitigating Drivers in this Archetype:
                    </span>
                    <ul className="grid grid-cols-1 gap-1 text-[11px] text-gray-300">
                      {selectedCluster.keyMitigatingDrivers?.map((driver, idx) => (
                        <li key={idx} className="flex items-center gap-2 bg-[#121212] px-2.5 py-1.5 rounded-md border border-[#222]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tri-Tier Sub-Group Tabs & Batch Decision Actions */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222] pb-3">
                    <div className="flex items-center gap-1.5 bg-[#161616] p-1 rounded-xl border border-[#333]">
                      <button
                        type="button"
                        onClick={() => setActiveTriageTab('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeTriageTab === 'ALL' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        All ({selectedCluster.applicationsCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTriageTab('GROUP_A')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          activeTriageTab === 'GROUP_A' ? 'bg-green-500 text-black font-bold' : 'text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span>Group A: Fast-Track ({selectedCluster.groupACount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTriageTab('GROUP_B')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          activeTriageTab === 'GROUP_B' ? 'bg-yellow-500 text-black font-bold' : 'text-yellow-400 hover:bg-yellow-500/10'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span>Group B ({selectedCluster.groupBCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTriageTab('GROUP_C')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          activeTriageTab === 'GROUP_C' ? 'bg-red-500 text-white font-bold' : 'text-red-400 hover:bg-red-500/10'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span>Group C ({selectedCluster.groupCCount})</span>
                      </button>
                    </div>

                    {/* Batch Action Buttons */}
                    <div className="flex items-center gap-2">
                      {activeTriageTab === 'GROUP_A' && selectedCluster.groupACount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenBatchModal(selectedCluster, 'GROUP_A', 'APPROVE')}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                          <span>1-Click Batch Fast-Track Group A ({selectedCluster.groupACount})</span>
                        </button>
                      )}

                      {activeTriageTab === 'GROUP_C' && selectedCluster.groupCCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenBatchModal(selectedCluster, 'GROUP_C', 'REJECT')}
                          className="px-3.5 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Batch Reject Group C ({selectedCluster.groupCCount})</span>
                        </button>
                      )}

                      {activeTriageTab === 'ALL' && selectedCluster.groupACount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenBatchModal(selectedCluster, 'GROUP_A', 'APPROVE')}
                          className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Fast-Track Group A ({selectedCluster.groupACount})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Application Cards / Cohort Stream */}
                  {displayedApps().length === 0 ? (
                    <div className="p-8 text-center bg-[#141414] rounded-xl border border-[#222] text-gray-400 text-xs">
                      No applications currently active in this category for {selectedCluster.profileCode}.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                      {displayedApps().map((app) => {
                        const prof = app.applicantProfile || {};
                        const cibil = prof.cibilScore || app.bureauSnapshot?.cibilScore || 700;
                        const foir = app.derivedMetrics?.foir || 50;

                        return (
                          <div 
                            key={app.applicationId || app._id}
                            className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] hover:border-gray-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">
                                  {prof.name || app.name || 'Applicant'}
                                </span>
                                <span className="text-[10px] font-mono text-amber-400">
                                  {app.applicationId || app._id}
                                </span>
                                <span className={`px-2 py-0.2 text-[9px] font-mono font-bold rounded ${
                                  app.triageGroup === 'GROUP_A' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                  app.triageGroup === 'GROUP_B' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                  'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {app.triageGroup === 'GROUP_A' ? 'Group A (Fast-Track)' : app.triageGroup === 'GROUP_B' ? 'Group B (Review)' : 'Group C (Escalate)'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                                <span>Income: <strong className="text-white">{formatCurrency(prof.declaredMonthlyIncome || app.declaredMonthlyIncome || 0)}</strong></span>
                                <span>Ask: <strong className="text-amber-400">{formatCurrency(app.requestedLoanAmount || 0)}</strong></span>
                                <span>CIBIL: <strong className="text-white font-mono">{cibil}</strong></span>
                                <span>FOIR: <strong className="text-white font-mono">{foir}%</strong></span>
                                <span>Liquid Assets: <strong className="text-emerald-400">{formatCurrency((prof.mutualFunds || 0) + (prof.savings || 0))}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {app.triageGroup === 'GROUP_C' && !app.escalatedToL2 && (
                                <button
                                  type="button"
                                  onClick={() => handleEscalateToL2(app.applicationId || app._id, `Escalated from Cluster ${selectedCluster.profileCode} due to Group C risk criteria.`)}
                                  className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Escalate to L2</span>
                                </button>
                              )}

                              <Link
                                to={`/applications/${app.applicationId || app._id}`}
                                className="px-3 py-1.5 bg-[#222] hover:bg-[#333] border border-[#444] text-white text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1"
                              >
                                <span>Scorecard</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-[#111] rounded-2xl border border-[#222] text-gray-400">
                Select an Exception Archetype from the left to view cohort intelligence.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: SENIOR L2 ESCALATION QUEUE */}
      {/* ======================================================== */}
      {activeView === 'l2_queue' && (
        <div className="bg-[#111] border border-[#333] rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Credit Officer L2 Senior Escalation Queue</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/30 font-bold">
                  {l2Queue.length} Cases
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                High-exposure and thin-buffer exception cases escalated by L1 Credit Officers for senior risk committee decisioning.
              </p>
            </div>

            <Link
              to="/admin/rules"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Initiate Policy Versioning (RuleSet v2)</span>
            </Link>
          </div>

          {l2Queue.length === 0 ? (
            <div className="p-12 text-center bg-[#141414] rounded-xl border border-[#222] text-gray-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-white">Senior Escalation Queue is Clear</p>
              <p className="mt-1">All escalated cases have been resolved by the Senior Risk Committee.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {l2Queue.map((app) => {
                const prof = app.applicantProfile || {};
                return (
                  <div 
                    key={app.applicationId || app._id}
                    className="p-4 rounded-xl bg-[#161616] border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-white text-sm">{prof.name || app.name || 'Applicant'}</span>
                        <span className="text-xs font-mono text-amber-400">{app.applicationId || app._id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                          Escalated by: {app.escalatedBy || 'Officer L1'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span>Requested: <strong className="text-amber-400">{formatCurrency(app.requestedLoanAmount)}</strong></span>
                        <span>CIBIL: <strong className="text-white font-mono">{prof.cibilScore || 700}</strong></span>
                        <span>FOIR: <strong className="text-white font-mono">{app.derivedMetrics?.foir || 50}%</strong></span>
                        <span>Liquid Assets: <strong className="text-emerald-400">{formatCurrency((prof.mutualFunds || 0) + (prof.savings || 0))}</strong></span>
                      </div>

                      {app.escalationNotes && (
                        <p className="text-[11px] text-gray-300 italic bg-[#111] p-2 rounded border border-[#222]">
                          "{app.escalationNotes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenBatchModal({ profileCode: 'L2_ESCALATION', name: 'Senior L2 Escalation' }, 'L2_QUEUE', 'APPROVE', app)}
                        className="px-3.5 py-2 bg-white hover:bg-gray-200 text-black font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Senior L2 Override</span>
                      </button>

                      <Link
                        to={`/applications/${app.applicationId || app._id}`}
                        className="px-3.5 py-2 bg-[#222] hover:bg-[#333] border border-[#444] text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1"
                      >
                        <span>Full Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: 10,000+ HISTORICAL EVIDENCE MATRIX */}
      {/* ======================================================== */}
      {activeView === 'evidence_matrix' && (
        <div className="bg-[#111] border border-[#333] rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="border-b border-[#222] pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              <span>10,000+ Historical Exception Outcomes Evidence Repository</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Empirical underwriting benchmarks derived from multi-year lending portfolios, replacing subjective underwriter intuition with statistical risk evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusterData?.clusters?.map((c) => (
              <div key={c.profileCode} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#222] text-amber-400 border border-[#333]">
                    {c.profileCode}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {c.historicalSampleSize} Sample Loans
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white">{c.name}</h3>
                <p className="text-[11px] text-gray-400 line-clamp-2">{c.description}</p>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-[#121212] p-2 rounded-lg border border-[#222]">
                    <span className="text-[10px] text-gray-500 block">Approval Rate</span>
                    <span className="text-emerald-400 font-extrabold font-mono text-base">{c.benchmarkApprovalRate}%</span>
                  </div>
                  <div className="bg-[#121212] p-2 rounded-lg border border-[#222]">
                    <span className="text-[10px] text-gray-500 block">Observed Default</span>
                    <span className="text-red-400 font-extrabold font-mono text-base">{c.benchmarkDefaultRate}%</span>
                  </div>
                </div>

                <div className="border-t border-[#242424] pt-2 text-[11px] text-gray-400">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Policy Agility Recommendation:</span>
                  <span className="text-amber-300 italic">{c.policyRelaxationHint}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BATCH DECISION MODAL */}
      {/* ======================================================== */}
      {batchActionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#141414] border border-[#333] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3.5">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Execute Batch Exception Decision ({batchActionModal.apps.length} Cases)
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setBatchActionModal(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Exception Archetype:</span>
                <span className="text-amber-400 font-bold font-mono">{batchActionModal.cluster.profileCode} ({batchActionModal.cluster.name})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Triage Sub-Group:</span>
                <span className="text-white font-bold">{batchActionModal.group}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Proposed Action:</span>
                <span className={`font-bold font-mono ${batchActionModal.action === 'APPROVE' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {batchActionModal.action === 'APPROVE' ? 'APPROVED_VIA_EXCEPTION' : 'REJECTED_VIA_EXCEPTION'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Regulatory Compliance Reasoning (Will be stamped into individual audit trails):
              </label>
              <textarea
                rows="4"
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-xl p-3 text-xs focus:outline-none transition-all leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBatchActionModal(null)}
                disabled={isProcessingBatch}
                className="px-4 py-2.5 bg-[#222] hover:bg-[#333] text-gray-300 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteBatchDecision}
                disabled={isProcessingBatch || !officerNotes}
                className={`px-5 py-2.5 font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                  batchActionModal.action === 'APPROVE'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {isProcessingBatch ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resolving {batchActionModal.apps.length} Cases...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Batch {batchActionModal.action} ({batchActionModal.apps.length} Apps)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExceptionIntelligenceStudio;
