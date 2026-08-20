import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, AlertTriangle, ArrowLeft, 
  IndianRupee, Percent, Calendar, ShieldCheck, 
  HelpCircle, ChevronDown, Check, X, AlertCircle 
} from 'lucide-react';
import { formatCurrency } from '../utils/masking';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';

const MOCK_DECISION = {
  id: 'APP-987654',
  status: 'EXCEPTION_REQUIRED',
  applicantName: 'Rahul Sharma',
  terms: {
    eligibleAmount: 1200000,
    interestRate: 14.5,
    tenure: 36,
    emi: 41285
  },
  riskGrade: 'B',
  riskScore: 72,
  rules: [
    { id: 'R01', name: 'Minimum CIBIL Score', variable: 'cibilScore', observed: 710, threshold: '>= 700', status: 'PASS', severity: 'LOW', reason: '' },
    { id: 'R02', name: 'Maximum FOIR %', variable: 'foir', observed: '45%', threshold: '<= 50%', status: 'PASS', severity: 'MEDIUM', reason: '' },
    { id: 'R03', name: 'Avg Monthly Balance (6M)', variable: 'amb', observed: '₹85,000', threshold: '>= ₹50,000', status: 'PASS', severity: 'LOW', reason: '' },
    { id: 'R04', name: 'Recent Cheque Bounces', variable: 'bounces6M', observed: 2, threshold: '<= 1', status: 'EXCEPTION', severity: 'HIGH', reason: 'EXC-BNC-02: Exceeds allowed bounce limit' },
    { id: 'R05', name: 'Business Vintage (Years)', variable: 'vintage', observed: 3.5, threshold: '>= 3', status: 'PASS', severity: 'MEDIUM', reason: '' },
  ]
};

const RiskGauge = ({ score }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remainder', value: 100 - score },
  ];
  const COLORS = [
    score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444', 
    '#333'
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
      <div className="absolute top-[50%] flex flex-col items-center">
        <span className="text-2xl font-bold text-white leading-none">{score}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Score</span>
      </div>
    </div>
  );
};

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = MOCK_DECISION; 
  
  const statusConfig = {
    APPROVED: {
      color: 'bg-green-500/10 border-green-500/20 text-green-500',
      icon: <CheckCircle className="w-8 h-8 text-green-500" />,
      title: 'Straight-Through Approved',
      desc: 'Application passed all BRE rules successfully.'
    },
    REJECTED: {
      color: 'bg-red-500/10 border-red-500/20 text-red-500',
      icon: <XCircle className="w-8 h-8 text-red-500" />,
      title: 'Hard Rejected',
      desc: 'Application failed critical knock-out rules.'
    },
    EXCEPTION_REQUIRED: {
      color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
      icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
      title: 'Exception Required (L1 Escalate)',
      desc: 'Application failed non-critical rules and requires manual override.'
    }
  };

  const currentStatus = statusConfig[data.status] || statusConfig.EXCEPTION_REQUIRED;

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#222] rounded-full transition-colors text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Application {data.id}</h1>
            <p className="text-sm text-gray-500">{data.applicantName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {data.status === 'EXCEPTION_REQUIRED' && (
            <button className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-medium rounded-md hover:bg-yellow-500/20 transition-colors shadow-sm text-sm">
              Escalate to L2
            </button>
          )}
          <button className="px-4 py-2 bg-[#222] border border-[#333] text-white font-medium rounded-md hover:bg-[#333] transition-colors shadow-sm text-sm">
            View Original Documents
          </button>
        </div>
      </div>

      <div className={clsx("rounded-xl p-6 mb-8 border flex flex-col sm:flex-row items-start gap-4", currentStatus.color)}>
        <div className="bg-[#111] p-2 rounded-full border border-[#333]">
          {currentStatus.icon}
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1 text-white">{currentStatus.title}</h2>
          <p className="text-sm opacity-90">{currentStatus.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-[#111] rounded-xl border border-[#333] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#333] bg-[#1a1a1a] flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-white">Calculated Loan Terms</h3>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Eligible Amount</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(data.terms.eligibleAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Interest Rate</p>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-white">{data.terms.interestRate}</p>
                <Percent className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Tenure</p>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-white">{data.terms.tenure}</p>
                <span className="text-sm text-gray-500 font-medium">months</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Est. EMI</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(data.terms.emi)}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#333] bg-[#1a1a1a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-white">Risk Assessment</h3>
            </div>
            <div className={clsx(
              "w-8 h-8 rounded flex items-center justify-center font-bold text-lg",
              data.riskGrade === 'A' || data.riskGrade === 'B' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
            )}>
              {data.riskGrade}
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center">
            <RiskGauge score={data.riskScore} />
          </div>
        </div>
      </div>

      <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-lg">Rule Engine Explainability</h3>
            <p className="text-sm text-gray-400 mt-1">Detailed breakdown of policy evaluation rules for this application.</p>
          </div>
          <HelpCircle className="w-5 h-5 text-gray-500 hidden sm:block" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium border-b border-[#333]">Rule Name</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Observed Value</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Configured Threshold</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Severity</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Status</th>
                <th className="px-6 py-4 font-medium border-b border-[#333]">Reason / Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222] text-sm">
              {data.rules.map((rule) => (
                <tr key={rule.id} className={clsx(
                  "transition-colors hover:bg-[#1a1a1a]",
                  rule.status === 'EXCEPTION' && "bg-yellow-500/5"
                )}>
                  <td className="px-6 py-4 text-white font-medium">
                    {rule.name}
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{rule.id}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-300">{rule.observed}</td>
                  <td className="px-6 py-4 text-gray-400">{rule.threshold}</td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "text-xs font-medium px-2.5 py-1 rounded",
                      rule.severity === 'HIGH' ? 'bg-red-500/20 text-red-500' :
                      rule.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-[#222] text-gray-300'
                    )}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {rule.status === 'PASS' ? (
                      <span className="flex items-center gap-1.5 text-green-500 font-medium text-xs px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full w-max">
                        <Check className="w-3.5 h-3.5" /> PASS
                      </span>
                    ) : rule.status === 'FAIL' ? (
                      <span className="flex items-center gap-1.5 text-red-500 font-medium text-xs px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full w-max">
                        <X className="w-3.5 h-3.5" /> FAIL
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-yellow-500 font-medium text-xs px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full w-max">
                        <AlertCircle className="w-3.5 h-3.5" /> EXCEPTION
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {rule.reason ? (
                      <span className="text-xs bg-[#222] text-gray-300 px-2 py-1 rounded font-mono border border-[#333]">
                        {rule.reason}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default ApplicationDetail;
