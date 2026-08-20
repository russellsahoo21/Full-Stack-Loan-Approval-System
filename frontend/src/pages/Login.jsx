import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ChevronRight, AlertCircle, Lock, Mail } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
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
        setError(res.message || 'User is not registered or credentials are invalid.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. User may not be registered.');
    } finally {
      setIsSubmitting(false);
    }
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
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 border border-white/20 bg-[#0a0a0a] rounded-xl flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sign In to Platform</h1>
          <p className="text-gray-400 mt-1 text-xs">Enter your registered email and password to access the system</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-7 shadow-2xl backdrop-blur-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all placeholder-gray-600"
                placeholder="name@nbfc.com"
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all placeholder-gray-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-2 bg-white text-black font-bold rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 text-xs"
          >
            {isSubmitting ? 'Verifying Account...' : 'Sign In'} <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-white font-semibold underline underline-offset-4 hover:text-gray-200">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
