import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, ROLES, DEMO_USERS } from '../context/AuthContext';
import { ShieldCheck, ChevronRight, AlertCircle, Sparkles, UserCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, switchRole } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await login({ email, password });
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Invalid email or password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setError('');
    setIsSubmitting(true);
    await switchRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div 
        className="absolute inset-0 z-0 opacity-15 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: '70px 70px',
          maskImage: 'linear-gradient(to bottom, black, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 90%)'
        }}
      />
      
      <div className="absolute w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -top-[200px] -right-[100px] z-0 pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 border border-white/20 bg-[#0a0a0a] rounded-xl flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Smart Underwriting Platform</h1>
          <p className="text-gray-400 mt-1 text-sm">Sign in to access the Business Rules & Credit Engine</p>
        </div>

        {/* Quick Demo Personas Panel */}
        <div className="bg-[#111]/80 border border-[#333] rounded-xl p-4 mb-4 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Demo Switcher (1-Click)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin(ROLES.ADMIN)}
              className="px-2.5 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-[#555] rounded-lg text-left transition-all text-xs group"
            >
              <div className="font-semibold text-white group-hover:text-amber-400">Policy Admin</div>
              <div className="text-[10px] text-gray-500 truncate">Risk Manager</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin(ROLES.L1)}
              className="px-2.5 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-[#555] rounded-lg text-left transition-all text-xs group"
            >
              <div className="font-semibold text-white group-hover:text-blue-400">Officer L1</div>
              <div className="text-[10px] text-gray-500 truncate">Approver L1</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin(ROLES.L2)}
              className="px-2.5 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-[#555] rounded-lg text-left transition-all text-xs group"
            >
              <div className="font-semibold text-white group-hover:text-purple-400">Officer L2</div>
              <div className="text-[10px] text-gray-500 truncate">Credit Head</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin(ROLES.APPLICANT)}
              className="px-2.5 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-[#555] rounded-lg text-left transition-all text-xs group"
            >
              <div className="font-semibold text-white group-hover:text-emerald-400">Applicant</div>
              <div className="text-[10px] text-gray-500 truncate">Rahul S.</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all placeholder-gray-600"
                placeholder="admin@nbfc.com"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <span className="text-xs text-gray-500">Default: admin123</span>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all placeholder-gray-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-6 bg-white text-black font-semibold rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'} <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Need a new account? <Link to="/signup" className="text-white hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
