import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ChevronRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate login
    // In the real app, we'd check credentials. For now, just use mock context login
    login({ name: 'Alex Doe (Mock)', email });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients similar to landing page */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
        backgroundSize: '70px 70px',
        maskImage: 'linear-gradient(to bottom, black, transparent 90%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 90%)'
      }}></div>
      
      <div className="absolute w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -top-[200px] -right-[100px] z-0 pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 border border-white/20 bg-[#0a0a0a] rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-gray-400 mt-2 text-sm">Enter your credentials to access the NBFC Engine</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all placeholder-gray-600"
                placeholder="alex@nbfc.com"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Forgot password?</a>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all placeholder-gray-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-8 bg-white text-black font-semibold rounded-lg px-4 py-3 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Log In <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <Link to="/signup" className="text-white hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
