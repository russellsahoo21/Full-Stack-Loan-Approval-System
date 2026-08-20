import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, ROLES, ROLE_LABELS } from '../context/AuthContext';
import { ShieldCheck, ChevronRight, AlertCircle, User, Mail, Lock, Briefcase } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.APPLICANT);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await register({ name, email, password, role });
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Registration failed. User may already exist.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. User may already be registered with this email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div 
        className="absolute inset-0 z-0 opacity-15 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: '70px 70px',
          maskImage: 'linear-gradient(to bottom, black, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 90%)'
        }}
      />
      
      <div className="absolute w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -top-[200px] -left-[100px] z-0 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 border border-white/20 bg-[#0a0a0a] rounded-xl flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Platform Account</h1>
          <p className="text-gray-400 mt-1 text-xs">Register your user profile and role assignment</p>
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
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all placeholder-gray-600"
                placeholder="Jane Credit Officer"
              />
            </div>
          </div>
          
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
                placeholder="jane@nbfc.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Role Assignment
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all appearance-none cursor-pointer"
              >
                <option value={ROLES.APPLICANT}>{ROLE_LABELS[ROLES.APPLICANT]}</option>
                <option value={ROLES.L1}>{ROLE_LABELS[ROLES.L1]}</option>
                <option value={ROLES.L2}>{ROLE_LABELS[ROLES.L2]}</option>
                <option value={ROLES.ADMIN}>{ROLE_LABELS[ROLES.ADMIN]}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
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
            {isSubmitting ? 'Creating Account...' : 'Register Account'} <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-semibold underline underline-offset-4 hover:text-gray-200">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
