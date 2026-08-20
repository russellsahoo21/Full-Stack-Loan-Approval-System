import React, { useState } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { 
  Search, Filter, Clock, CheckCircle, XCircle, 
  ChevronRight, AlertTriangle, MessageSquare, History, User, FileText
} from 'lucide-react';
import { formatCurrency } from '../utils/masking';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const MOCK_QUEUE = [
  { id: 'APP-987654', applicant: 'Rahul Sharma', amount: 1200000, level: 'L1', reason: 'EXC-BNC-02: Exceeds allowed bounce limit', date: '2023-10-27T10:30:00Z', status: 'PENDING' },
  { id: 'APP-987655', applicant: 'Priya Patel', amount: 3500000, level: 'L2', reason: 'EXC-FOIR-01: High FOIR (55%)', date: '2023-10-27T09:15:00Z', status: 'PENDING' },
  { id: 'APP-987656', applicant: 'Amit Kumar', amount: 850000, level: 'L1', reason: 'EXC-CBL-03: Minor CIBIL drop', date: '2023-10-26T16:45:00Z', status: 'PENDING' },
];

const MOCK_AUDIT_HISTORY = [
  { id: 1, action: 'APPLICATION_SUBMITTED', actor: 'RM - Jane Smith', date: '2023-10-27T10:00:00Z', comment: 'Initial document upload complete.' },
  { id: 2, action: 'BRE_EVALUATION', actor: 'System (BRE Engine)', date: '2023-10-27T10:05:00Z', comment: 'Failed Rule R04: Recent Cheque Bounces. Escalated to L1.' },
  { id: 3, action: 'ESCALATION_ROUTED', actor: 'System Workflow', date: '2023-10-27T10:06:00Z', comment: 'Added to L1 Exception Queue.' },
];

const ExceptionQueue = () => {
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null); 
  const [justification, setJustification] = useState('');

  const filteredQueue = MOCK_QUEUE.filter(app => {
    const matchesSearch = app.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.applicant.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (currentRole === ROLES.L1) return matchesSearch && app.level === 'L1';
    if (currentRole === ROLES.L2) return matchesSearch && app.level === 'L2';
    return matchesSearch;
  });

  const handleAction = (actionType) => {
    if (!justification) return;
    alert(`Mock Action: ${actionType} on ${selectedApp.id}\nJustification: ${justification}`);
    setSelectedApp(null);
    setJustification('');
  };

  return (
    <div className="max-w-7xl mx-auto flex h-[calc(100vh-8rem)] relative overflow-hidden">
      
      <div className={clsx("flex-1 flex flex-col transition-all duration-300 w-full", selectedApp ? "mr-[400px]" : "")}>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Exception Queue</h1>
            <p className="text-sm text-gray-400">Applications requiring manual override or escalation review.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input 
                type="text"
                placeholder="Search ID or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#111] border border-[#333] text-white rounded-md text-sm focus:ring-1 focus:ring-white focus:border-white outline-none w-64 placeholder-gray-500"
              />
            </div>
            <button className="p-2 bg-[#111] border border-[#333] rounded-md hover:bg-[#222] text-gray-400 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-[#111] rounded-xl border border-[#333] flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1a1a1a] sticky top-0 z-10">
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium border-b border-[#333]">Application</th>
                  <th className="px-6 py-4 font-medium border-b border-[#333]">Amount</th>
                  <th className="px-6 py-4 font-medium border-b border-[#333]">Exception Reason</th>
                  <th className="px-6 py-4 font-medium border-b border-[#333]">Aging</th>
                  <th className="px-6 py-4 font-medium border-b border-[#333]">Level</th>
                  <th className="px-6 py-4 font-medium border-b border-[#333]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222] text-sm">
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No applications found in your queue.
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((app) => (
                    <tr key={app.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{app.id}</div>
                        <div className="text-gray-400">{app.applicant}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {formatCurrency(app.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-md max-w-xs">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-xs leading-tight">{app.reason}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-500" />
                          2 Hours
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full border",
                          app.level === 'L1' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                        )}>
                          {app.level} Queue
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedApp(app)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-black bg-white hover:bg-gray-200 rounded-md transition-colors"
                        >
                          Review <ChevronRight className="w-4 h-4" />
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

      {selectedApp && (
        <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-[#0a0a0a] shadow-2xl border-l border-[#333] flex flex-col z-20 animate-in slide-in-from-right duration-300 rounded-l-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between bg-[#111]">
            <div>
              <h2 className="text-lg font-bold text-white">Review Exception</h2>
              <p className="text-sm text-gray-400">{selectedApp.id}</p>
            </div>
            <button 
              onClick={() => setSelectedApp(null)}
              className="p-2 hover:bg-[#222] rounded-full transition-colors text-gray-500"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Applicant</h3>
                  <p className="font-medium text-white">{selectedApp.applicant}</p>
                </div>
                <button 
                  onClick={() => navigate(`/applications/${selectedApp.id}`)}
                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1 border border-[#333] px-2 py-1 rounded-md hover:bg-[#222]"
                >
                  <FileText className="w-3.5 h-3.5" /> View App
                </button>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-500 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" /> Triggered Rule
                </h4>
                <p className="text-sm text-yellow-500/80 leading-relaxed">{selectedApp.reason}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> Audit Trail
              </h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-[#444] before:to-transparent">
                {MOCK_AUDIT_HISTORY.map((log) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#333] bg-[#111] text-gray-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-[#333] bg-[#111]">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-white text-xs">{log.actor}</div>
                        <time className="text-xs text-gray-500 font-mono">10:00 AM</time>
                      </div>
                      <div className="text-xs text-gray-400">{log.comment}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-auto border-t border-[#333] pt-6">
              <h3 className="text-sm font-semibold text-white mb-2">Approver Justification</h3>
              <div className="relative mb-4">
                <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <textarea 
                  rows="3"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Enter detailed reasoning for compliance..."
                  className="w-full pl-9 pr-4 py-2 bg-[#111] border border-[#333] text-white rounded-md text-sm focus:ring-1 focus:ring-white focus:border-white outline-none resize-none placeholder-gray-500"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction('REJECT')}
                  disabled={!justification}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-transparent border border-red-500/50 text-red-500 font-medium rounded-md hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button 
                  onClick={() => handleAction('APPROVE_EXCEPTION')}
                  disabled={!justification}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptionQueue;
