import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { 
  Search, Filter, Clock, CheckCircle, XCircle, 
  ChevronRight, AlertTriangle, MessageSquare, History, 
  User, FileText, RefreshCw, AlertCircle, Sparkles, Check 
} from 'lucide-react';
import { formatCurrency } from '../utils/masking';
import { useNavigate, Link } from 'react-router-dom';
import { applicationApi } from '../services/api';
import clsx from 'clsx';

const ExceptionQueue = () => {
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null); 
  const [justification, setJustification] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchExceptions = async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.getAll();
      if (res.success) {
        // Backend already filters by role, but add a frontend guard for safety
        const allApps = res.data || [];
        let exceptions;
        if (currentRole === ROLES.L1) {
          exceptions = allApps.filter(app => app.status === 'EXCEPTION_L1_REQUIRED');
        } else if (currentRole === ROLES.L2) {
          exceptions = allApps.filter(app => app.status === 'EXCEPTION_L2_REQUIRED');
        } else {
          // Admin sees all exceptions
          exceptions = allApps.filter(app => app.status.includes('EXCEPTION') && app.status.includes('REQUIRED'));
        }
        setQueue(exceptions);
      }
    } catch (err) {
      console.warn('Failed to load exception queue from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const filteredQueue = queue.filter(app => {
    const term = searchTerm.toLowerCase();
    const idMatch = (app.applicationId || app._id || '').toLowerCase().includes(term);
    const applicantMatch = (app.applicantId || '').toLowerCase().includes(term);
    return idMatch || applicantMatch;
  });

  const handleAction = async (actionType) => {
    if (!justification) {
      alert('Please enter justification / compliance reasoning.');
      return;
    }
    setIsSubmittingAction(true);
    setActionSuccessMsg('');
    try {
      const appId = selectedApp.applicationId || selectedApp._id;
      const res = await applicationApi.exceptionDecision(appId, {
        action: actionType,
        officerNotes: justification,
      });

      if (res.success) {
        setActionSuccessMsg(`Application ${appId} successfully updated to ${res.data?.status || actionType}`);
        setSelectedApp(null);
        setJustification('');
        await fetchExceptions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process exception decision');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex h-[calc(100vh-8rem)] relative overflow-hidden animate-in fade-in duration-500">
      
      {/* Left List Area */}
      <div className={clsx("flex-1 flex flex-col transition-all duration-300 w-full", selectedApp ? "mr-[420px]" : "")}>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {currentRole === ROLES.L1 ? 'L1 Exception Queue' : currentRole === ROLES.L2 ? 'L2 Escalated Queue' : 'All Exception Queues'}
              </h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                currentRole === ROLES.L2 
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
              }`}>
                {queue.length} Pending
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {currentRole === ROLES.L1
                ? 'Minor policy deviations (FOIR, soft limits) awaiting your L1 underwriting review.'
                : currentRole === ROLES.L2
                ? 'Escalated high-risk or complex exceptions requiring Credit Head approval.'
                : 'Full exception queue across all tiers — L1 standard deviations and L2 escalations.'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/exception-intelligence"
              className="px-3.5 py-2 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 hover:border-purple-400 text-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Cluster Intelligence View</span>
            </Link>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input 
                type="text"
                placeholder="Search by ID or Applicant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#111] border border-[#333] text-white rounded-lg text-xs focus:ring-1 focus:ring-white focus:border-white outline-none w-56 placeholder-gray-500 transition-all"
              />
            </div>
            <button 
              onClick={fetchExceptions}
              disabled={isLoading}
              className="p-2 bg-[#111] border border-[#333] hover:border-gray-500 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        <div className="bg-[#111] rounded-xl border border-[#333] flex-1 overflow-hidden flex flex-col shadow-lg">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#161616] sticky top-0 z-10">
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3.5 font-medium border-b border-[#333]">Application ID</th>
                  <th className="px-6 py-3.5 font-medium border-b border-[#333]">Loan Amount</th>
                  <th className="px-6 py-3.5 font-medium border-b border-[#333]">Triggered Exception Reason</th>
                  <th className="px-6 py-3.5 font-medium border-b border-[#333]">Rule Version</th>
                  <th className="px-6 py-3.5 font-medium border-b border-[#333]">Queue Level</th>
                  <th className="px-6 py-3.5 font-medium border-b border-[#333]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222] text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                      <span>Loading pending exception applications...</span>
                    </td>
                  </tr>
                ) : filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                      <CheckCircle className="w-8 h-8 text-green-500/50 mx-auto mb-2" />
                      <p className="text-sm text-gray-300 font-semibold">Queue is clear!</p>
                      <p className="text-xs text-gray-500 mt-1">No applications currently awaiting credit exception review.</p>
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((app) => (
                    <tr key={app.applicationId || app._id} className="hover:bg-[#181818] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{app.applicationId}</div>
                        <div className="text-gray-400 font-mono text-[11px]">Applicant: {app.applicantId}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {formatCurrency(app.requestedLoanAmount)}
                        <div className="text-[10px] text-gray-500 font-normal">{app.requestedTenureMonths} Mo</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-start gap-1.5 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1.5 rounded-lg text-xs leading-relaxed">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span className="truncate">
                            {app.exceptionDetails?.deviations?.[0] || 'Deviation from standard policy parameter'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-400">
                        v{app.ruleSetVersion}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${app.status === 'EXCEPTION_L2_REQUIRED' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                          {app.status === 'EXCEPTION_L2_REQUIRED' ? 'L2 Review' : 'L1 Review'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedApp(app)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-black bg-white hover:bg-gray-200 rounded-lg transition-all shadow-sm"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Drawer Review Panel */}
      {selectedApp && (
        <div className="absolute right-0 top-0 bottom-0 w-[410px] bg-[#0d0d0d] shadow-2xl border-l border-[#333] flex flex-col z-20 animate-in slide-in-from-right duration-300 rounded-l-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between bg-[#141414]">
            <div>
              <h2 className="text-base font-bold text-white">Exception Decision Review</h2>
              <p className="text-xs text-gray-400 font-mono">{selectedApp.applicationId} • Applicant: {selectedApp.applicantId}</p>
            </div>
            <button 
              onClick={() => setSelectedApp(null)}
              className="p-1.5 hover:bg-[#222] rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Key Metrics */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Requested Loan:</span>
                <span className="text-white font-bold">{formatCurrency(selectedApp.requestedLoanAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tenure:</span>
                <span className="text-white font-medium">{selectedApp.requestedTenureMonths} Months</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>FOIR:</span>
                <span className="text-white font-bold">{selectedApp.derivedMetrics?.foir}%</span>
              </div>
            </div>

            {/* Deviations */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4" /> Triggered Policy Deviation
              </h4>
              <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                {selectedApp.exceptionDetails?.deviations?.map((d, i) => (
                  <li key={i}>{d}</li>
                )) || <li>Threshold exceeded</li>}
              </ul>
            </div>

            {/* Mitigating Factors */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4" /> Compensating Asset & Buffer Factors
              </h4>
              <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                {selectedApp.exceptionDetails?.mitigatingFactors?.map((m, i) => (
                  <li key={i}>{m}</li>
                )) || <li>Liquid asset buffer available</li>}
              </ul>
            </div>

            {/* Justification input */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Officer Underwriting Justification (Required)
              </label>
              <textarea 
                rows="4"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="State risk justification and compliance rationale..."
                className="w-full p-3 bg-[#161616] border border-[#333] text-white rounded-xl text-xs focus:ring-1 focus:ring-white focus:border-white outline-none resize-none placeholder-gray-600 transition-all"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                onClick={() => handleAction('REJECT')}
                disabled={!justification || isSubmittingAction}
                className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-transparent border border-red-500/50 text-red-400 font-bold rounded-xl text-xs hover:bg-red-500/10 transition-all disabled:opacity-40"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button 
                onClick={() => handleAction('APPROVE')}
                disabled={!justification || isSubmittingAction}
                className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-gray-200 transition-all shadow-md disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Override</span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => navigate(`/applications/${selectedApp.applicationId || selectedApp._id}`)}
                className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1 underline underline-offset-4"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Full Application Scorecard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptionQueue;
