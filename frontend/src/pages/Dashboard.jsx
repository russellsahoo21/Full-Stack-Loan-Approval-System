import React, { useState, useEffect } from 'react';
import { 
  Activity, Clock, CheckCircle, XCircle, ArrowUpRight, 
  Users, RefreshCw, AlertTriangle, ShieldCheck, 
  ChevronRight, Database, FileText, Settings, Sparkles 
} from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';
import { formatCurrency } from '../utils/masking';
import { Link } from 'react-router-dom';
import { applicationApi, healthApi, rulesApi } from '../services/api';

const MetricCard = ({ title, value, change, isPositive, icon: Icon, subtitle }) => (
  <div className="bg-[#111] border border-[#333] rounded-xl p-6 hover:border-[#555] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-white">
        <Icon className="w-5 h-5 text-gray-200" />
      </div>
      {change && (
        <div className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
          {change}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</h3>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user, currentRole } = useAuth();

  const [applications, setApplications] = useState([]);
  const [activeRuleSet, setActiveRuleSet] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [latency, setLatency] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      // 1. Fetch Applications (if admin/officer)
      let apps = [];
      try {
        const appsRes = await applicationApi.getAll();
        if (appsRes.success) {
          apps = appsRes.data || [];
        }
      } catch (e) {
        console.warn('Could not fetch all applications (may need officer login):', e);
      }
      setApplications(apps);

      // 2. Fetch Active Rule Set
      try {
        const rulesRes = await rulesApi.getActive();
        if (rulesRes.success) {
          setActiveRuleSet(rulesRes.data);
        }
      } catch (e) {
        console.warn('Could not fetch active rule set:', e);
      }

      // 3. Fetch Health
      try {
        const healthRes = await healthApi.getHealth();
        setHealthStatus(healthRes);
      } catch (e) {
        setHealthStatus({ status: 'OFFLINE', message: 'Backend unreachable' });
      }

      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
    } catch (err) {
      setError('Unable to reach backend services. Showing local cached view.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentRole]);

  // Derived metrics from live applications
  const totalApps = applications.length;
  const approvedApps = applications.filter(a => a.status === 'APPROVED' || a.status === 'APPROVED_VIA_EXCEPTION').length;
  const exceptionApps = applications.filter(a => a.status.includes('EXCEPTION') && a.status.includes('REQUIRED')).length;
  const rejectedApps = applications.filter(a => a.status === 'REJECTED' || a.status === 'REJECTED_VIA_EXCEPTION').length;

  const stpRate = totalApps > 0 ? ((approvedApps / totalApps) * 100).toFixed(1) : '100';
  const rejectRate = totalApps > 0 ? ((rejectedApps / totalApps) * 100).toFixed(1) : '0';

  const formatStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'APPROVED_VIA_EXCEPTION':
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Approved</span>;
      case 'REJECTED':
      case 'REJECTED_VIA_EXCEPTION':
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>;
      case 'INSUFFICIENT_DATA':
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">Insufficient Data</span>;
      case 'EXCEPTION_REQUIRED':
      case 'EXCEPTION_L1_REQUIRED':
      case 'EXCEPTION_L2_REQUIRED':
      default:
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Exception Required</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-1 rounded-full font-mono border border-[#333]">
              {user?.role || 'Guest'}
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">
            Live Business Rules Engine (BRE) overview, real-time credit metrics & pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-gray-300 hover:text-white rounded-lg text-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-white' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <Link
            to="/applications/new"
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-lg text-sm hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Application</span>
          </Link>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Total Applications" 
          value={isLoading ? '...' : totalApps > 0 ? totalApps.toString() : '0'} 
          change={totalApps > 0 ? `${totalApps} Processed` : 'Live Pipeline'} 
          isPositive={true} 
          icon={Activity} 
          subtitle="Processed through automated BRE"
        />
        <MetricCard 
          title="STP Approval Rate" 
          value={isLoading ? '...' : `${stpRate}%`} 
          change={`${approvedApps} Approved`} 
          isPositive={true} 
          icon={CheckCircle} 
          subtitle="Straight-Through Processing"
        />
        <MetricCard 
          title="Pending Exceptions" 
          value={isLoading ? '...' : exceptionApps.toString()} 
          change={exceptionApps > 0 ? 'Requires Override' : 'Queue Clear'} 
          isPositive={exceptionApps === 0} 
          icon={Clock} 
          subtitle="Awaiting Credit Officer action"
        />
        <MetricCard 
          title="Hard Rejections" 
          value={isLoading ? '...' : `${rejectRate}%`} 
          change={`${rejectedApps} Knockouts`} 
          isPositive={false} 
          icon={XCircle} 
          subtitle="Failed policy eligibility rules"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications Table */}
        <div className="lg:col-span-2 bg-[#111] border border-[#333] rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="px-6 py-4 border-b border-[#333] flex justify-between items-center bg-[#161616]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <h2 className="text-base font-semibold text-white">Recent Underwritten Applications</h2>
            </div>
            <Link 
              to="/applications" 
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View All Applications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#222] flex-1">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="text-sm">Loading applications from MongoDB...</span>
              </div>
            ) : applications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <FileText className="w-10 h-10 text-gray-600 mb-3" />
                <p className="text-sm text-gray-300 font-medium">No applications found in the pipeline yet</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Submit a new loan application via manual entry or bulk preset to run the Business Rules Engine.
                </p>
                <Link
                  to="/applications/new"
                  className="mt-4 px-4 py-2 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] rounded-lg text-xs font-semibold text-white transition-all"
                >
                  Create First Application
                </Link>
              </div>
            ) : (
              applications.slice(0, 5).map((app) => (
                <Link
                  key={app.applicationId || app._id}
                  to={`/applications/${app.applicationId || app._id}`}
                  className="px-6 py-4 flex items-center justify-between hover:bg-[#181818] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-[#333] flex items-center justify-center text-gray-400 flex-shrink-0 group-hover:border-gray-500 transition-colors">
                      <Users className="w-4 h-4 text-gray-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {app.applicationId}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>Applicant: {app.applicantId}</span>
                        <span>•</span>
                        <span>v{app.ruleSetVersion}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-sm font-bold text-white">
                      {formatCurrency(app.requestedLoanAmount)}
                    </div>
                    <div className="flex items-center gap-2">
                      {formatStatusBadge(app.status)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* System & BRE Engine Health Card */}
        <div className="bg-[#111] border border-[#333] rounded-xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-400" />
                <h2 className="text-base font-semibold text-white">BRE Engine Telemetry</h2>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${healthStatus?.status === 'UP' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {healthStatus?.status || 'Active'}
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>API & Engine Latency</span>
                  <span className="text-white font-mono font-medium">{latency}ms</span>
                </div>
                <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(10, latency / 5))}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Active Rule Set</span>
                  <span className="text-amber-400 font-mono font-medium">v{activeRuleSet?.version || '1'} (Active)</span>
                </div>
                <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full w-full" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  {activeRuleSet?.rules?.length || 6} configurable risk rules configured
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Policy Agility Mode</span>
                  <span className="text-blue-400 font-mono font-medium">Zero-Downtime</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Versioned rule sets evaluate live without redeploying backend code.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#222] space-y-3">
            <Link
              to="/admin/rules"
              className="w-full py-2 px-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Configure BRE Studio</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/synthetic-sandbox"
              className="w-full py-2 px-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Synthetic Profile Sandbox</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
