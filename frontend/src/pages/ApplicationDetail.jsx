import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, XCircle, AlertTriangle, ArrowLeft, 
  IndianRupee, Percent, Calendar, ShieldCheck, 
  HelpCircle, RefreshCw, Check, X, AlertCircle, 
  Sparkles, History, User, MessageSquare, Scale, ArrowRight, Download 
} from 'lucide-react';
import { formatCurrency, maskPAN, maskMobile } from '../utils/masking';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth, ROLES } from '../context/AuthContext';
import { applicationApi, rulesApi } from '../services/api';
import clsx from 'clsx';

const RiskGauge = ({ grade = 'Grade A', score = 85 }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remainder', value: 100 - score },
  ];
  const COLORS = [
    score >= 75 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#ef4444', 
    '#222'
  ];

  return (
    <div className="relative w-32 h-32 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={40}
            outerRadius={55}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-[45%] flex flex-col items-center">
        <span className="text-xl font-extrabold text-white leading-none">{score}</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{grade.split(' ')[0]}</span>
      </div>
    </div>
  );
};

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, currentRole } = useAuth();

  const [application, setApplication] = useState(null);
  const [profile, setProfile] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [ruleVersions, setRuleVersions] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Exception Decision Controls
  const [overrideNotes, setOverrideNotes] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Version Simulation State
  const [selectedSimVersion, setSelectedSimVersion] = useState(1);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchApplicationDetails = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await applicationApi.getById(id);
      if (res.success && res.data) {
        setApplication(res.data);
        setProfile(res.applicantProfile);
        setAuditLogs(res.auditLogs || []);
      } else {
        setErrorMessage(res.message || 'Application not found');
      }

      // Fetch rule versions for comparison tool
      try {
        const vRes = await rulesApi.getVersions();
        if (vRes.success && vRes.data) {
          setRuleVersions(vRes.data);
          if (vRes.data.length > 0) {
            setSelectedSimVersion(vRes.data[0].version);
          }
        }
      } catch (e) {
        // public version fallback
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load application data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const handleExceptionDecision = async (action) => {
    if (!overrideNotes) {
      alert('Please enter justification / compliance notes before submitting.');
      return;
    }
    setIsProcessingAction(true);
    try {
      const res = await applicationApi.exceptionDecision(id, {
        action,
        officerNotes: overrideNotes,
      });
      if (res.success) {
        setOverrideNotes('');
        await fetchApplicationDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process exception decision');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRunVersionSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await applicationApi.evaluateVersion(id, selectedSimVersion);
      if (res.success) {
        setSimulationResult(res.comparison);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to evaluate under selected version');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportScorecard = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      applicationId: application.applicationId,
      applicantId: application.applicantId,
      status: application.status,
      ruleSetVersion: application.ruleSetVersion,
      requestedLoanAmount: application.requestedLoanAmount,
      requestedTenureMonths: application.requestedTenureMonths,
      derivedMetrics: application.derivedMetrics,
      evaluationResult: application.evaluationResult,
      scorecard: application.scorecard,
      exceptionDetails: application.exceptionDetails,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scorecard_${application.applicationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-white" />
        <p className="text-sm">Fetching immutable application record from database...</p>
      </div>
    );
  }

  if (errorMessage || !application) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Application Record Not Found</h2>
        <p className="text-sm text-gray-400">{errorMessage || 'The requested application ID does not exist.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const statusConfig = {
    APPROVED: {
      color: 'bg-green-500/10 border-green-500/30 text-green-400',
      icon: <CheckCircle className="w-8 h-8 text-green-400" />,
      title: 'Straight-Through Processing (STP) Approved',
      desc: 'Application satisfied all automated credit policy rules under the active rule set.'
    },
    APPROVED_VIA_EXCEPTION: {
      color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: <CheckCircle className="w-8 h-8 text-emerald-400" />,
      title: 'Approved Via Credit Officer Exception Override',
      desc: 'Manual approval confirmed with audited officer justification & mitigating factors.'
    },
    REJECTED_VIA_EXCEPTION: {
      color: 'bg-red-500/10 border-red-500/30 text-red-400',
      icon: <XCircle className="w-8 h-8 text-red-400" />,
      title: 'Rejected After Exception Review',
      desc: 'Credit Officer reviewed exception deviations and upheld rejection.'
    },
    REJECTED: {
      color: 'bg-red-500/10 border-red-500/30 text-red-400',
      icon: <XCircle className="w-8 h-8 text-red-400" />,
      title: 'Hard Policy Knockout (Rejected)',
      desc: 'Application failed one or more critical knock-out risk rules.'
    },
    INSUFFICIENT_DATA: {
      color: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      icon: <AlertTriangle className="w-8 h-8 text-sky-400" />,
      title: 'Insufficient Data',
      desc: 'Application is missing one or more critical normalized profile fields required for automated underwriting.'
    },
    EXCEPTION_L1_REQUIRED: {
      color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      icon: <AlertTriangle className="w-8 h-8 text-yellow-400" />,
      title: 'L1 Exception Required',
      desc: 'Application requires review by a Level 1 Credit Officer.'
    },
    EXCEPTION_L2_REQUIRED: {
      color: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      icon: <AlertTriangle className="w-8 h-8 text-orange-400" />,
      title: 'L2 Exception Required (Escalated)',
      desc: 'Application requires review by a Level 2 Credit Head due to multiple deviations or high loan amount.'
    },
    EXCEPTION_REQUIRED: {
      color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      icon: <AlertTriangle className="w-8 h-8 text-yellow-400" />,
      title: 'Exception Required',
      desc: 'Application requires manual review.'
    }
  };

  const currentStatus = statusConfig[application.status] || statusConfig.EXCEPTION_REQUIRED;
  const isOfficerOrAdmin = [ROLES.ADMIN, ROLES.L1, ROLES.L2].includes(currentRole);

  const riskScore = application.evaluationResult?.riskGrade?.includes('Grade A') ? 88 
    : application.evaluationResult?.riskGrade?.includes('Grade B') ? 68 
    : 42;

  return (
    <div className="application-detail-page max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 space-y-8">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-[#161616] hover:bg-[#222] border border-[#333] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Application {application.applicationId}
              </h1>
              <span className="text-xs bg-[#222] border border-[#444] text-gray-300 font-mono px-2 py-0.5 rounded">
                v{application.ruleSetVersion} Policy
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Applicant: <span className="text-white font-medium">{profile?.name || application.applicantId}</span> ({application.applicantId})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/applications"
            className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
          >
            All Applications
          </Link>
          <Link
            to="/exceptions"
            className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
          >
            Exception Queue
          </Link>
        </div>
      </div>

      <div className={clsx("rounded-xl p-6 border flex flex-col sm:flex-row items-start gap-4 shadow-lg", currentStatus.color)}>
        <div className="bg-[#111] p-2.5 rounded-xl border border-white/10 shrink-0">
          {currentStatus.icon}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h2 className="text-lg font-bold text-white">{currentStatus.title}</h2>
            <span className="text-[11px] font-mono uppercase bg-black/40 px-2.5 py-1 rounded border border-white/10">
              Evaluated under RuleSet v{application.ruleSetVersion}
            </span>
          </div>
          <p className="text-xs opacity-90 leading-relaxed">{currentStatus.desc}</p>
        </div>
      </div>

      {/* Verified Bureau & KYC Telemetry Ribbon */}
      <div className="bg-[#111] border border-[#333] rounded-xl p-4.5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Verified Bureau & KYC Identity:</span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {profile?.panNumber || application.panNumber || 'PAN RECORDED'}
              </span>
              {(profile?.aadhaarNumber || application.aadhaarNumber) && (
                <span className="text-[11px] font-mono text-gray-400">
                  • Aadhaar: {profile?.aadhaarNumber || application.aadhaarNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Verified via CIBIL / NSDL Gateway • Tamper-proof Bureau Fetch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-[#181818] border border-[#2a2a2a] px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-gray-400">Verified CIBIL:</span>
            <span className={`font-mono font-bold ${
              (profile?.cibilScore || 700) >= 730 ? 'text-green-400' :
              (profile?.cibilScore || 700) >= 680 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {profile?.cibilScore || 735}
            </span>
          </div>

          <div className="bg-[#181818] border border-[#2a2a2a] px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-gray-400">Write-offs:</span>
            <span className={`font-mono font-bold ${(profile?.writeOffs || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {profile?.writeOffs || 0}
            </span>
          </div>

          <div className="bg-[#181818] border border-[#2a2a2a] px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-gray-400">Liquid Buffer:</span>
            <span className="font-mono font-bold text-amber-400">
              {formatCurrency((profile?.mutualFunds || 0) + (profile?.savings || 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Calculated Loan Terms & Risk Assessment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculated Terms */}
        <div className="lg:col-span-2 bg-[#111] rounded-xl border border-[#333] overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-[#333] bg-[#161616] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-white text-sm">Calculated Loan Terms & Eligibility</h3>
            </div>
            <span className="text-[11px] text-gray-400">Automated Pricing Engine</span>
          </div>

          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Requested Amount</p>
              <p className="text-xl font-bold text-white">{formatCurrency(application.requestedLoanAmount)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Applicant ask</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Max Eligibility</p>
              <p className="text-xl font-bold text-emerald-400">
                {formatCurrency(application.evaluationResult?.maxEligibleLoanAmount || application.requestedLoanAmount)}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Based on 50% max FOIR</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Interest Rate</p>
              <div className="flex items-center gap-1">
                <p className="text-xl font-bold text-white">
                  {application.evaluationResult?.interestRatePercent ?? 'N/A'}%
                </p>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Risk-adjusted</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Proposed EMI</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(application.derivedMetrics?.proposedEMI || 0)}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{application.requestedTenureMonths} mo tenure</p>
            </div>
          </div>

          {/* Derived Metrics Footer */}
          <div className="bg-[#141414] px-6 py-3 border-t border-[#222] grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Calculated FOIR: </span>
              <span className="text-white font-bold">{application.derivedMetrics?.foir || 0}%</span>
            </div>
            <div>
              <span className="text-gray-500">Loan-to-Income: </span>
              <span className="text-white font-bold">{application.derivedMetrics?.lti || 0}x</span>
            </div>
            <div>
              <span className="text-gray-500">Income Trend: </span>
              <span className="text-white font-bold">
                {application.derivedMetrics?.incomeTrendPercent > 0 ? '+' : ''}
                {application.derivedMetrics?.incomeTrendPercent || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Risk Assessment Card */}
        <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="px-6 py-4 border-b border-[#333] bg-[#161616] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-white text-sm">Risk Assessment Band</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white font-mono">
              {application.evaluationResult?.riskGrade || 'Grade A'}
            </span>
          </div>

          <div className="p-4 flex flex-col items-center justify-center flex-1">
            <RiskGauge 
              grade={application.evaluationResult?.riskGrade || 'Grade A'} 
              score={riskScore} 
            />
            <div className="text-center mt-2">
              <p className="text-xs font-semibold text-gray-300">
                {application.evaluationResult?.riskGrade || 'Grade A (Low Risk)'}
              </p>
              <p className="text-[11px] text-gray-500">CIBIL: {profile?.cibilScore ?? 'N/A'} • DPD: {profile?.dpd ?? 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Explainability Badges */}
      {application.evaluationResult?.whySummaryBadges?.length > 0 && (
        <div className="bg-[#111] border border-[#333] rounded-xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>BRE Explainability Badges (Underwriting Rationale)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {application.evaluationResult.whySummaryBadges.map((badge, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] text-gray-200 text-xs font-medium rounded-lg"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Exception Review & Decision Box (For Pending Exceptions) */}
      {application.status.includes('EXCEPTION') && application.status.includes('REQUIRED') && isOfficerOrAdmin && (
        <div className="bg-[#111] border-2 border-yellow-500/40 rounded-xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#333]">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base font-bold text-white">Credit Officer Exception Override Action</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-lg">
              <h4 className="font-semibold text-red-400 mb-1">Triggered Policy Deviations:</h4>
              <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                {application.exceptionDetails?.deviations?.length > 0 
                  ? application.exceptionDetails.deviations.map((d, i) => <li key={i}>{d}</li>)
                  : <li>Non-critical rule failed threshold</li>}
              </ul>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-lg">
              <h4 className="font-semibold text-emerald-400 mb-1">Identified Mitigating Factors:</h4>
              <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                {application.exceptionDetails?.mitigatingFactors?.length > 0
                  ? application.exceptionDetails.mitigatingFactors.map((m, i) => <li key={i}>{m}</li>)
                  : <li>High asset buffer declared</li>}
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Approver Justification & Compliance Notes (Mandatory for Audit Log)
            </label>
            <textarea
              rows="3"
              value={overrideNotes}
              onChange={(e) => setOverrideNotes(e.target.value)}
              placeholder="e.g. CIBIL score is 680 (below 700 limit), but applicant holds ₹5 Lakhs in Mutual Funds. Approved via exception."
              className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-lg p-3 text-xs focus:outline-none transition-all placeholder-gray-600"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleExceptionDecision('REJECT')}
              disabled={isProcessingAction || !overrideNotes}
              className="flex-1 py-2.5 px-4 bg-transparent border border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold rounded-lg text-xs transition-all disabled:opacity-40"
            >
              {isProcessingAction ? 'Processing...' : 'Reject Application'}
            </button>
            <button
              onClick={() => handleExceptionDecision('APPROVE')}
              disabled={isProcessingAction || !overrideNotes}
              className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-200 text-black font-bold rounded-lg text-xs transition-all shadow-md disabled:opacity-40"
            >
              {isProcessingAction ? 'Processing...' : 'Approve Override via Exception'}
            </button>
          </div>
        </div>
      )}

      {/* Rule Engine Explainability Scorecard Table */}
      <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-[#333] bg-[#161616] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm">Rule Engine Scorecard (Live Execution Breakdown)</h3>
            <p className="text-xs text-gray-400 mt-0.5">Observed applicant telemetry against active policy parameters.</p>
          </div>
          <div className="flex items-center gap-2">
            {isOfficerOrAdmin && (
              <button
                onClick={handleExportScorecard}
                title="Export Scorecard JSON"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-gray-500 text-gray-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            )}
            <HelpCircle className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-3.5 font-medium border-b border-[#333]">Rule Code</th>
                <th className="px-6 py-3.5 font-medium border-b border-[#333]">Description</th>
                <th className="px-6 py-3.5 font-medium border-b border-[#333]">Observed Value</th>
                <th className="px-6 py-3.5 font-medium border-b border-[#333]">Configured Threshold</th>
                <th className="px-6 py-3.5 font-medium border-b border-[#333]">Action on Fail</th>
                <th className="px-6 py-3.5 font-medium border-b border-[#333]">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222] text-xs">
              {application.scorecard?.map((rule, idx) => (
                <tr 
                  key={idx}
                  className={clsx(
                    "hover:bg-[#181818] transition-colors",
                    !rule.passed && rule.actionOnFail.startsWith('EXCEPTION') && "bg-yellow-500/5",
                    !rule.passed && rule.actionOnFail === 'HARD_REJECT' && "bg-red-500/5"
                  )}
                >
                  <td className="px-6 py-3.5 font-mono text-white font-semibold">
                    {rule.ruleCode}
                  </td>
                  <td className="px-6 py-3.5 text-gray-300 font-medium">
                    {rule.description}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-white">
                    {rule.actualValue}
                  </td>
                  <td className="px-6 py-3.5 text-gray-400 font-mono">
                    {rule.thresholdRequired}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={clsx(
                      "text-[10px] font-semibold px-2 py-0.5 rounded",
                      rule.actionOnFail === 'HARD_REJECT' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    )}>
                      {rule.actionOnFail}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {rule.passed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-semibold text-[11px]">
                        <Check className="w-3 h-3" /> PASS
                      </span>
                    ) : (
                      <span className={clsx(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] border",
                        rule.actionOnFail === 'HARD_REJECT' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      )}>
                        <X className="w-3 h-3" /> FAIL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Agility Tool: Evaluate Under Specific Version */}
      <div className="bg-[#111] border border-[#333] rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Policy Version Simulator (Agility Demo)</h3>
              <p className="text-xs text-gray-400">
                Simulate how this application evaluates under different historical rule versions without altering original records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSimVersion}
              onChange={(e) => setSelectedSimVersion(Number(e.target.value))}
              className="bg-[#181818] border border-[#333] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none"
            >
              {ruleVersions.length > 0 ? ruleVersions.map(v => (
                <option key={v.version} value={v.version}>
                  RuleSet v{v.version} {v.isActive ? '(Active)' : ''}
                </option>
              )) : (
                <option value={1}>RuleSet v1 (Default)</option>
              )}
            </select>

            <button
              onClick={handleRunVersionSimulation}
              disabled={isSimulating}
              className="px-3.5 py-1.5 bg-white text-black font-bold rounded-lg text-xs hover:bg-gray-200 transition-all flex items-center gap-1 shadow-md disabled:opacity-50"
            >
              {isSimulating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>Simulate</span>
            </button>
          </div>
        </div>

        {simulationResult && (
          <div className="bg-[#181818] border border-indigo-500/30 rounded-xl p-4 animate-in fade-in space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-indigo-400">Simulation Comparison Result</span>
              <span className="text-gray-400 font-mono">Original: v{application.ruleSetVersion} ➔ Simulated: {simulationResult.reEvaluatedRecord?.evaluatedVersion}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#111] p-3 rounded-lg border border-[#333]">
                <span className="text-gray-500 uppercase tracking-wider block mb-1">Original Record (v{application.ruleSetVersion})</span>
                <div className="text-sm font-bold text-white">{application.status}</div>
              </div>

              <div className="bg-[#111] p-3 rounded-lg border border-indigo-500/40">
                <span className="text-indigo-400 uppercase tracking-wider block mb-1">
                  Simulated Decision ({simulationResult.reEvaluatedRecord?.evaluatedVersion})
                </span>
                <div className="text-sm font-bold text-white">
                  {simulationResult.reEvaluatedRecord?.decision}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Immutable Audit Trail Timeline */}
      <div className="bg-[#111] rounded-xl border border-[#333] p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-white text-sm">Immutable Audit Trail</h3>
        </div>

        <div className="space-y-4 text-xs">
          {auditLogs.length === 0 ? (
            <div className="text-gray-500 py-2">No previous audit modifications recorded.</div>
          ) : (
            auditLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-[#181818] border border-[#2a2a2a] rounded-lg">
                <div className="w-7 h-7 rounded-full bg-[#252525] flex items-center justify-center text-gray-400 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-semibold text-white">{log.evaluatedBy}</span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300">
                    Decision: <strong className="text-white">{log.decision}</strong> (RuleSet v{log.ruleSetVersion})
                  </p>
                  {log.evaluationSnapshot?.officerNotes && (
                    <p className="text-gray-400 mt-1 italic">
                      "{log.evaluationSnapshot.officerNotes}"
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
