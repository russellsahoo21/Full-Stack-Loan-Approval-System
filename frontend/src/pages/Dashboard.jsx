import React from 'react';
import { Activity, Clock, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/masking';
import { Link } from 'react-router-dom';

const MetricCard = ({ title, value, change, isPositive, icon: Icon }) => (
  <div className="bg-[#111] border border-[#333] rounded-xl p-6 hover:border-[#555] transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-lg bg-[#222] flex items-center justify-center text-gray-300">
        <Icon className="w-5 h-5" />
      </div>
      <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {change}
      </div>
    </div>
    <div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, currentRole } = useAuth();

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-gray-400 mt-1">Here is the overview of your credit pipeline.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Applications (Mtd)" 
          value="1,248" 
          change="+12.5%" 
          isPositive={true} 
          icon={Activity} 
        />
        <MetricCard 
          title="STP Approval Rate" 
          value="42.8%" 
          change="-2.1%" 
          isPositive={false} 
          icon={CheckCircle} 
        />
        <MetricCard 
          title="Pending Exceptions" 
          value="156" 
          change="+18" 
          isPositive={false} 
          icon={Clock} 
        />
        <MetricCard 
          title="Hard Rejects" 
          value="28.4%" 
          change="-1.2%" 
          isPositive={true} 
          icon={XCircle} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Queue */}
        <div className="lg:col-span-2 bg-[#111] border border-[#333] rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#333] flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Recent Applications</h2>
            <Link to="/exceptions" className="text-sm text-gray-400 hover:text-white flex items-center">
              View Queue
            </Link>
          </div>
          <div className="divide-y divide-[#333]">
            {[
              { id: 'APP-987654', name: 'Rahul Sharma', amount: 1200000, status: 'Exception', date: '2 mins ago' },
              { id: 'APP-987655', name: 'Priya Patel', amount: 3500000, status: 'Approved', date: '15 mins ago' },
              { id: 'APP-987656', name: 'Amit Kumar', amount: 850000, status: 'Exception', date: '1 hour ago' },
              { id: 'APP-987657', name: 'Sneha Gupta', amount: 450000, status: 'Rejected', date: '2 hours ago' },
            ].map((app) => (
              <div key={app.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center text-gray-400 flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{app.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{app.id}</div>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between items-end gap-1">
                  <div className="text-sm font-medium text-white">{formatCurrency(app.amount)}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                      app.status === 'Approved' ? 'bg-green-500/10 text-green-500' :
                      app.status === 'Rejected' ? 'bg-red-500/10 text-red-500' :
                      'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {app.status}
                    </span>
                    <span className="text-xs text-gray-500">{app.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-[#111] border border-[#333] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">System Health</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">BRE Engine Latency</span>
                <span className="text-white font-medium">124ms</span>
              </div>
              <div className="w-full bg-[#222] rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">API Gateway Uptime</span>
                <span className="text-white font-medium">99.99%</span>
              </div>
              <div className="w-full bg-[#222] rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '99%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">CIBIL API Limit</span>
                <span className="text-white font-medium">85%</span>
              </div>
              <div className="w-full bg-[#222] rounded-full h-1.5">
                <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-[#333]">
            <div className="text-sm text-gray-400 mb-2">Active Rule Version</div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-[#222] border border-[#444] rounded text-xs font-mono text-white">v2.4.1</span>
              <span className="text-xs text-green-500 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
