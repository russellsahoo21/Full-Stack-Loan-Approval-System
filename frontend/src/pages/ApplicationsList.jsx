import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Filter, RefreshCw, ChevronRight, 
  CheckCircle, XCircle, AlertTriangle, Download, ArrowUpDown, Sparkles 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { applicationApi } from '../services/api';
import { formatCurrency } from '../utils/masking';
import clsx from 'clsx';

const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.getAll();
      if (res.success) {
        setApplications(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApps = applications.filter((app) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (app.applicationId || '').toLowerCase().includes(term) ||
      (app.applicantId || '').toLowerCase().includes(term);

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'APPROVED') return matchesSearch && (app.status === 'APPROVED' || app.status === 'APPROVED_VIA_EXCEPTION');
    if (statusFilter === 'REJECTED') return matchesSearch && (app.status === 'REJECTED' || app.status === 'REJECTED_VIA_EXCEPTION');
    if (statusFilter === 'EXCEPTION_REQUIRED') return matchesSearch && app.status === 'EXCEPTION_REQUIRED';

    return matchesSearch && app.status === statusFilter;
  });

  const formatStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">STP Approved</span>;
      case 'APPROVED_VIA_EXCEPTION':
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Override Approved</span>;
      case 'REJECTED':
      case 'REJECTED_VIA_EXCEPTION':
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>;
      case 'EXCEPTION_REQUIRED':
      default:
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Exception Required</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Loan Applications Master</h1>
            <span className="text-xs bg-[#222] border border-[#333] text-gray-300 font-mono px-2.5 py-0.5 rounded-full">
              {applications.length} Records
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">
            Central ledger of all automated and officer-evaluated loan applications in MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchApplications}
            disabled={isLoading}
            className="p-2.5 bg-[#161616] border border-[#333] hover:border-gray-500 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <Link
            to="/applications/new"
            className="px-4 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-gray-200 transition-all flex items-center gap-2 shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Application</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-[#111] border border-[#333] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'APPROVED', 'EXCEPTION_REQUIRED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                statusFilter === st 
                  ? "bg-white text-black shadow-sm" 
                  : "bg-[#181818] text-gray-400 hover:text-white border border-[#2a2a2a]"
              )}
            >
              {st === 'ALL' ? 'All Applications' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by ID or Applicant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[#181818] border border-[#333] text-white rounded-lg text-xs focus:ring-1 focus:ring-white focus:border-white outline-none w-full sm:w-64 placeholder-gray-500 transition-all"
          />
        </div>
      </div>

      {/* Master Applications Table */}
      <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#161616]">
              <tr className="text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium border-b border-[#333]">Application ID</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Applicant</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Loan Amount</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Tenure</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">FOIR %</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Status</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Rule Version</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <span>Loading applications ledger...</span>
                  </td>
                </tr>
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-gray-500">
                    <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-300 font-semibold">No applications match your filter</p>
                    <p className="text-xs text-gray-500 mt-1">Try resetting the search or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.applicationId || app._id} className="hover:bg-[#181818] transition-colors">
                    <td className="px-6 py-4 font-bold text-white font-mono">
                      {app.applicationId}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <span className="font-semibold text-white">{app.applicantId}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {formatCurrency(app.requestedLoanAmount)}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-medium">
                      {app.requestedTenureMonths} Months
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-gray-300">
                      {app.derivedMetrics?.foir || '-'}%
                    </td>
                    <td className="px-6 py-4">
                      {formatStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-400">
                      v{app.ruleSetVersion}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/applications/${app.applicationId || app._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#222] hover:bg-white text-gray-300 hover:text-black font-semibold rounded-lg transition-all"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsList;
