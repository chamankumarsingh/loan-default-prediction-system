import React from 'react';
import { Sun, Moon, Bell, Search, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 dark:bg-slate-900 dark:border-slate-800 shrink-0">
      {/* Search Everywhere Bar */}
      <div className="flex items-center gap-3 w-96 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
        <input
          type="text"
          placeholder="Search customers, predictions, reports..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all duration-200 dark:bg-slate-950/40 dark:border-slate-800 dark:focus:bg-slate-950 dark:focus:border-brand-400 dark:text-slate-200"
        />
      </div>

      {/* Action Items */}
      <div className="flex items-center gap-4">
        {/* System Health Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full dark:bg-emerald-950/30">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider dark:text-emerald-400">
            ML engine online
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200/50 dark:hover:bg-slate-850 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-800"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications Icon */}
        <button
          className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200/50 dark:hover:bg-slate-850 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-800 relative"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-brand-500 rounded-full absolute top-2 right-2.5"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* Workspace Display Info */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500 dark:bg-slate-850 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Active Station</p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">{user?.role} Portal</p>
          </div>
        </div>
      </div>
    </header>
  );
};
