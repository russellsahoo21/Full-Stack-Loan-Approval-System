import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FileText, List, Settings, ShieldAlert, LayoutDashboard, ChevronDown, User, LogOut, Menu } from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';
import clsx from 'clsx';

const MainLayout = () => {
  const { currentRole, switchRole, user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: [ROLES.RM, ROLES.L1, ROLES.L2, ROLES.ADMIN] },
    { name: 'New App', path: '/applications/new', icon: FileText, roles: [ROLES.RM, ROLES.L1, ROLES.L2, ROLES.ADMIN] },
    { name: 'Exceptions', path: '/exceptions', icon: List, roles: [ROLES.L1, ROLES.L2, ROLES.ADMIN] },
    { name: 'BRE Studio', path: '/admin/rules', icon: Settings, roles: [ROLES.ADMIN] },
  ];

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-[#333] flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-[#333]">
          <ShieldAlert className="text-white w-8 h-8 mr-2" />
          <span className="font-bold text-xl tracking-tight text-white">Smart Underwriting</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu</div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            if (!link.roles.includes(currentRole)) return null;
            
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-sm transition-colors",
                  isActive ? "bg-white text-black" : "text-gray-400 hover:bg-[#222] hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" /> {link.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-[#333]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-[#222] rounded-full flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentRole}</p>
            </div>
            <LogOut className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* Top Navbar */}
        <header className="h-16 bg-[#111] border-b border-[#333] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center md:hidden">
            <Menu className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-4">
            {/* Role Switcher */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-[#222] border border-[#333] px-3 py-1.5 rounded-md text-sm font-medium text-white hover:bg-[#333] transition-colors">
                Role: {currentRole} <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-[#111] rounded-md shadow-lg border border-[#333] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Switch Role</div>
                  {Object.values(ROLES).map(role => (
                    <button
                      key={role}
                      onClick={() => switchRole(role)}
                      className={clsx(
                        "w-full text-left px-4 py-2 text-sm transition-colors flex justify-between items-center",
                        currentRole === role ? "bg-white text-black font-medium" : "text-gray-300 hover:bg-[#222]"
                      )}
                    >
                      {role} {currentRole === role && <span className="text-black">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="bg-[#111] border-t border-[#333] py-4 px-6 mt-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 Smart Underwriting NBFC. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Compliance</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
