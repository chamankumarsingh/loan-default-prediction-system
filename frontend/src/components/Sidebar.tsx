import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Users, 
  FileSpreadsheet, 
  ShieldAlert, 
  LogOut,
  TrendingUp,
  LineChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  
  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/predict', label: 'Risk Predictor', icon: <BrainCircuit className="w-5 h-5" /> },
    { to: '/customers', label: 'Customers', icon: <Users className="w-5 h-5" /> },
    { to: '/analytics', label: 'BI Analytics', icon: <LineChart className="w-5 h-5" /> },
    { to: '/reports', label: 'Reports Center', icon: <FileSpreadsheet className="w-5 h-5" /> },
  ];

  // Only show Admin Panel if user is an Admin
  if (user?.role === 'Admin') {
    navItems.push({ 
      to: '/admin', 
      label: 'Admin Control', 
      icon: <ShieldAlert className="w-5 h-5" /> 
    });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-400 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="bg-brand-600 p-2 rounded-xl text-white shadow-lg shadow-brand-500/20">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-white tracking-wider uppercase">DefaultGuard</h1>
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Loan Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600/10 text-brand-400 border-l-4 border-brand-500 pl-3 font-semibold'
                  : 'hover:bg-slate-800/50 hover:text-slate-200'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Profile & Logout Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-brand-700/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold uppercase">
            {user?.username.substring(0, 2)}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm text-slate-200 truncate">{user?.username}</h4>
            <span className="inline-block text-[10px] bg-slate-800 text-brand-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
