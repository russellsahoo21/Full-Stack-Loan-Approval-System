import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, User, ShieldCheck, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { applicationApi } from '../services/api';
import { Link } from 'react-router-dom';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.getAuditLogs();
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const term = searchTerm.toLowerCase();
    return (l.applicationId || '').toLowerCase().includes(term) ||
           (l.applicantId || '').toLowerCase().includes(term) ||
           (l.evaluatedBy || '').toLowerCase().includes(term) ||
           (l.decision || '').toLowerCase().includes(term);
  });

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-7 h-7 text-white" />
              <span>Immutable Audit & Compliance Trail</span>
            </h1>
            <span className="text-xs bg-[#222] border border-[#333] text-gray-300 font-mono px-2.5 py-1 rounded-full">
              {logs.length} Audit Entries
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">
            Regulatory compliance ledger recording every BRE decision, snapshot, and officer exception override.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ID, actor, or decision..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#111] border border-[#333] text-white rounded-lg text-xs focus:ring-1 focus:ring-white focus:border-white outline-none w-64 placeholder-gray-500 transition-all"
            />
          </div>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2 bg-[#161616] border border-[#333] hover:border-gray-500 rounded-lg text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#161616]">
              <tr className="text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium border-b border-[#333]">Timestamp</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Application ID</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Applicant</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Evaluated By</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Policy Version</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Recorded Decision</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <span>Loading compliance audit logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                    <History className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-300 font-semibold">No audit logs recorded yet</p>
                    <p className="text-xs text-gray-500 mt-1">Audit logs are automatically created upon application evaluation or officer override.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-[#181818] transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-mono text-[11px]">
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-white font-mono">
                      {log.applicationId}
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-mono">
                      {log.applicantId}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <span className="font-semibold text-white">{log.evaluatedBy}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-amber-400">
                      v{log.ruleSetVersion}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-white/10 text-white font-mono">
                        {log.decision}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/applications/${log.applicationId}`}
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white font-semibold underline underline-offset-4"
                      >
                        <span>View Snapshot</span>
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

export default AuditLogsPage;
