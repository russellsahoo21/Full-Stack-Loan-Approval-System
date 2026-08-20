import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, XCircle, AlertTriangle, ArrowLeft, 
  IndianRupee, Percent, Calendar, ShieldCheck, 
  HelpCircle, RefreshCw, Check, X, AlertCircle, 
  Sparkles, History, User, MessageSquare, Scale, ArrowRight 
} from 'lucide-react';
import { formatCurrency, maskPAN, maskMobile } from '../utils/masking';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth, ROLES } from '../context/AuthContext';
import { applicationApi, rulesApi } from '../services/api';
import clsx from 'clsx';

const RiskGauge = ({ grade = 'Grade A', score = 25 }) => {
  const data = [
    { name: 'Risk', value: score },
    { name: 'Safety Buffer', value: 100 - score },
  ];
  // Option A Risk Colors: Low Risk (<=35%) = GREEN, Medium Risk (36-65%) = YELLOW, High Risk (>65%) = RED
  const COLORS = [
    score <= 35 ? '#22c55e' : score <= 65 ? '#f59e0b' : '#ef4444', 
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
        <span className="text-xl font-extrabold text-white leading-none">{score}%</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Risk Level</span>
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
    EXCEPTION_REQUIRED: {
      color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      icon: <AlertTriangle className="w-8 h-8 text-yellow-400" />,
      title: 'Exception Required (Manual Underwriter Escalation)',
      desc: 'Application requires manual review by Credit Approver due to non-critical rule deviations.'
    }
  };

  const currentStatus = statusConfig[application.status] || statusConfig.EXCEPTION_REQUIRED;
  const isOfficerOrAdmin = [ROLES.ADMIN, ROLES.L1, ROLES.L2].includes(currentRole);

  // Option A Dynamic Risk Level % calculation: Higher Loan Amount -> Higher Risk Level %
  const calculateDynamicScore = () => {
    if (application.evaluationResult?.riskScore !== undefined) {
      return application.evaluationResult.riskScore;
    }

    const cibil = profile?.cibilScore || 700;
    const cibilRisk = Math.min(35, Math.max(0, ((850 - cibil) / 550) * 35));
    
    const foir = application.derivedMetrics?.foir || 30;
    const foirRisk = Math.min(35, Math.max(0, (foir / 65) * 35));

    const reqAmt = application.requestedLoanAmount || 1;
    const maxEligible = application.evaluationResult?.maxEligibleLoanAmount || reqAmt;

    let amountRisk = 12;
    if (maxEligible > 0) {
      const ratio = reqAmt / maxEligible;
      amountRisk = Math.min(25, Math.max(0, Math.round(ratio * 20)));
    }

    let historyRisk = 0;
    if (profile?.writeOffs > 0) historyRisk += 5;
    if (profile?.bounceCount > 0) historyRisk += Math.min(5, profile.bounceCount * 2);

    return Math.min(99, Math.max(5, Math.round(cibilRisk + foirRisk + amountRisk + historyRisk)));
  };

  const riskScore = calculateDynamicScore();


  return (
    <div className="max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 space-y-8">
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

      {/* Decision Summary Card */}
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
                  {application.evaluationResult?.interestRatePercent || 11.5}%
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
              <p className="text-[11px] text-gray-500">CIBIL: {profile?.cibilScore || 735} • DPD: {profile?.dpd || 0}</p>
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
      {application.status === 'EXCEPTION_REQUIRED' && isOfficerOrAdmin && (
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
          <HelpCircle className="w-4 h-4 text-gray-500" />
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
                    !rule.passed && rule.actionOnFail === 'EXCEPTION' && "bg-yellow-500/5",
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

      {/* Re-Run Engine: Evaluate under different version */}
      {isOfficerOrAdmin && ruleVersions.length > 0 && (
        <div className="bg-[#111] border border-[#333] rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222]">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Re-Run Engine</h3>
                <p className="text-xs text-gray-400">
                  Re-evaluate this application under a different rule version. Original decision is immutable.
                </p>
              </div>
            </div>
          </div>

          {/* Current decision */}
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between">
            <div className="text-xs">
              <div className="text-gray-500 mb-1">Current Decision</div>
              <div className="font-bold text-white">{application.status}</div>
            </div>
            <div className="text-xs text-right">
              <div className="text-gray-500 mb-1">Evaluated Under</div>
              <span className="font-mono font-bold text-amber-400">Rule Set v{application.ruleSetVersion}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">
                Select Target Version
              </label>
              <select
                value={selectedSimVersion}
                onChange={(e) => setSelectedSimVersion(Number(e.target.value))}
                className="w-full bg-[#181818] border border-[#333] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50 transition-all"
              >
                {ruleVersions.map(v => (
                  <option key={v.version} value={v.version}>
                    v{v.version}{v.isActive ? ' (Active — Current)' : ''}{v.version === application.ruleSetVersion ? ' (Original)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="shrink-0 mt-5">
              <button
                onClick={() => navigate(`/applications/${id}/compare/${selectedSimVersion}`)}
                disabled={selectedSimVersion === application.ruleSetVersion}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-Run & Compare
              </button>
            </div>
          </div>

          {selectedSimVersion === application.ruleSetVersion && (
            <p className="text-[11px] text-gray-600 text-center">
              Select a different version to compare. Current application was evaluated under v{application.ruleSetVersion}.
            </p>
          )}
        </div>
      )}

      {/* Immutable Audit Trail Timeline */}
      <div className="bg-[#111] rounded-xl border border-[#333] p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-white text-sm">Immutable Audit Trail</h3>
          </div>
          <span className="text-[11px] text-gray-600">{auditLogs.length} entries — never deleted</span>
        </div>

        <div className="relative">
          {auditLogs.length > 1 && (
            <div className="absolute left-[13px] top-3 bottom-3 w-px bg-[#2a2a2a]" />
          )}
          <div className="space-y-3 text-xs">
            {auditLogs.length === 0 ? (
              <div className="text-gray-500 py-2">No audit modifications recorded.</div>
            ) : (
              auditLogs.map((log, idx) => {
                const isReRun = log.evaluatedBy?.toLowerCase().includes('re-run');
                const decisionColor = log.decision === 'APPROVED' || log.decision === 'APPROVED_VIA_EXCEPTION'
                  ? 'text-emerald-400' : log.decision === 'REJECTED' || log.decision === 'REJECTED_VIA_EXCEPTION'
                  ? 'text-red-400' : 'text-amber-400';
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={clsx(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 relative z-10 border',
                      isReRun
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[#252525] border-[#333]'
                    )}>
                      {isReRun
                        ? <RefreshCw className="w-3 h-3 text-amber-400" />
                        : <User className="w-3.5 h-3.5 text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 bg-[#181818] border border-[#2a2a2a] rounded-xl p-3.5">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="font-semibold text-white">{log.evaluatedBy}</span>
                        <span className="text-[10px] text-gray-500 font-mono shrink-0">
                          {new Date(log.timestamp || log.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Decision:</span>
                        <span className={clsx('font-bold', decisionColor)}>{log.decision}</span>
                        <span className="text-gray-600">·</span>
                        <span className="text-gray-500 font-mono">RuleSet v{log.ruleSetVersion}</span>
                      </div>
                      {log.evaluationSnapshot?.officerNotes && (
                        <p className="text-gray-400 mt-1.5 italic border-t border-[#222] pt-1.5">
                          "{log.evaluationSnapshot.officerNotes}"
                        </p>
                      )}
                      {isReRun && log.evaluationSnapshot?.originalDecision && (
                        <p className="text-[11px] text-amber-400/70 mt-1">
                          Re-run only — original decision ({log.evaluationSnapshot.originalDecision} under v{log.evaluationSnapshot.originalVersion}) remains unchanged.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
