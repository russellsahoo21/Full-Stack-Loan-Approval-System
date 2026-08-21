import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, List, Settings, ShieldAlert, LayoutDashboard,
  ChevronDown, User, LogOut, Menu, Sparkles, History,
  Database, Layers, Check, BrainCircuit, Bot, Activity,
  ShieldCheck, Percent, Zap, Landmark
} from 'lucide-react';
import MacroMarketTicker from '../components/MacroMarketTicker';
import { useAuth, ROLES, ROLE_LABELS } from '../context/AuthContext';
import clsx from 'clsx';

const MainLayout = () => {
  const { currentRole, switchRole, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navSections = [
    {
      title: 'Core Underwriting',
      links: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2]
        },
        {
          name: currentRole === ROLES.APPLICANT ? 'My Applications' : 'All Applications',
          path: '/applications',
          icon: Layers,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2, ROLES.APPLICANT]
        },
        {
          name: currentRole === ROLES.APPLICANT ? 'Apply for Loan' : 'New Application',
          path: '/applications/new',
          icon: FileText,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2, ROLES.APPLICANT]
        },
        {
          name: 'Exception Intelligence',
          path: '/exception-intelligence',
          icon: BrainCircuit,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2]
        },
        {
          name: 'Exception Queue',
          path: '/exceptions',
          icon: List,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2]
        },
      ]
    },
    {
      title: 'AI Intelligence Suite',
      badge: 'AI Powered',
      links: [
        {
          name: 'AI Underwrite Copilot',
          path: '/ai-copilot',
          icon: Bot,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2, ROLES.APPLICANT]
        },
        {
          name: 'Macro Stress Lab',
          path: '/ai-stress-testing',
          icon: Activity,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2]
        },
        {
          name: 'Dynamic Pricing AI',
          path: '/ai-pricing-optimizer',
          icon: Percent,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2]
        },
      ]
    },
    {
      title: 'Governance & Admin',
      links: [
        {
          name: 'BRE Studio',
          path: '/admin/rules',
          icon: Settings,
          roles: [ROLES.ADMIN]
        },
        {
          name: 'Macro Benchmarks & Repo',
          path: '/macro-benchmarks',
          icon: Landmark,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2, ROLES.APPLICANT]
        },
        {
          name: 'Synthetic Sandbox',
          path: '/synthetic-sandbox',
          icon: Sparkles,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2]
        },
        {
          name: 'Audit Trail',
          path: '/audit-logs',
          icon: History,
          roles: [ROLES.ADMIN, ROLES.L1, ROLES.L2]
        },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] text-white">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-[#111] border-r border-[#2a2a2a] flex flex-col hidden md:flex sticky top-0 h-screen z-30">
        <Link to={currentRole === ROLES.APPLICANT ? "/applications" : "/dashboard"} className="h-16 flex items-center px-6 border-b border-[#2a2a2a] gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">Smart Underwrite</span>
        </Link>

        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto no-scrollbar">
          {navSections.map((section, sIdx) => {
            const visibleLinks = section.links.filter(l => l.roles.includes(currentRole));
            if (visibleLinks.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {section.title}
                  </span>
                  {section.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {section.badge}
                    </span>
                  )}
                </div>

                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={clsx(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-all",
                        isActive
                          ? "bg-white text-black shadow-sm font-bold"
                          : "text-gray-400 hover:bg-[#1c1c1c] hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-3 border-t border-[#2a2a2a] bg-[#0e0e0e]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-[#161616] border border-[#2a2a2a]">
            <div className="w-8 h-8 bg-[#252525] border border-[#333] rounded-full flex items-center justify-center text-white shrink-0">
              <User className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-amber-400 truncate font-mono">{ROLE_LABELS[currentRole] || currentRole}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#222] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* Top Navbar */}
        <header className="h-16 bg-[#111] border-b border-[#2a2a2a] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20 backdrop-blur-md bg-opacity-95">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-[#222] rounded-lg text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-white">Smart Underwriting</span>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#181818] border border-[#333] hover:border-amber-500/40 px-3 py-1.5 rounded-xl text-xs transition-colors">
              <span className="text-gray-400">Active Persona:</span>
              <select
                value={currentRole}
                onChange={(e) => switchRole(e.target.value)}
                className="bg-transparent text-amber-400 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value={ROLES.ADMIN} className="bg-[#181818] text-white">👑 Policy Admin (Risk Head)</option>
                <option value={ROLES.L1} className="bg-[#181818] text-white">🛡️ Credit Officer L1</option>
                <option value={ROLES.L2} className="bg-[#181818] text-white">🛡️ Credit Officer L2</option>
                <option value={ROLES.APPLICANT} className="bg-[#181818] text-white">👤 Applicant / Borrower</option>
              </select>
            </div>
          </div>
        </header>

        {/* Live Macro Market & RBI Repo Ticker */}
        <MacroMarketTicker />

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111] border-b border-[#333] p-4 space-y-3 animate-in slide-in-from-top duration-300 max-h-[80vh] overflow-y-auto">
            {navSections.map((section, sIdx) => {
              const visibleLinks = section.links.filter(l => l.roles.includes(currentRole));
              if (visibleLinks.length === 0) return null;

              return (
                <div key={sIdx} className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">
                    {section.title}
                  </div>
                  {visibleLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={clsx(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium",
                          isActive ? "bg-white text-black font-bold" : "text-gray-400"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-[#111] border-t border-[#2a2a2a] py-4 px-8 mt-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 Smart Underwriting NBFC Engine. Regulatory Compliant.</p>
            <div className="flex gap-4">
              <Link to="/audit-logs" className="hover:text-white transition-colors">Audit Trail</Link>
              <Link to="/admin/rules" className="hover:text-white transition-colors">BRE Policy Studio</Link>
              <Link to="/synthetic-sandbox" className="hover:text-white transition-colors">Telemetry Sandbox</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
