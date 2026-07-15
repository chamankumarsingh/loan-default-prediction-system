import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Lock, User, AlertCircle, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUser, setForgotUser] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const data = await api.login({ username, password });
      // Call with 5 parameters to save refresh token
      login(data.access_token, data.refresh_token, data.username, data.email, data.role);
      addToast(`Welcome back, ${data.username}! You are logged in as ${data.role}.`, 'success');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please try again.');
      addToast('Sign in failed. Check credentials.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUser || !forgotEmail) return;
    setIsResetting(true);

    try {
      const res = await api.resetPassword({ username: forgotUser, email: forgotEmail });
      addToast(res.detail || 'Password reset link sent to your email.', 'success');
      setShowForgotModal(false);
      setForgotUser('');
      setForgotEmail('');
    } catch (err: any) {
      addToast(err.message || 'Credentials match failed.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-950 via-slate-900 to-slate-950 px-4 relative overflow-hidden select-none">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brand-600 p-3.5 rounded-2xl text-white shadow-xl shadow-brand-500/20 mb-3 hover:scale-105 transition-transform duration-300">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wider uppercase">DefaultGuard</h1>
          <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mt-0.5">Loan Intelligence Portal</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-100">Portal Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">Access requires authorized credentials. Enforced under audit logging.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold animate-scale-up">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label-field text-slate-400">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter employee username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-155 focus:border-brand-500 focus:bg-slate-955 outline-none transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-extrabold text-slate-450 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-bold text-brand-400 hover:text-brand-350 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-155 focus:border-brand-500 focus:bg-slate-955 outline-none transition-all duration-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-350 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 bg-brand-655 hover:bg-brand-555 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-600/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authorizing...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-6 border-t border-slate-800/80 pt-4 flex flex-col gap-1 items-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Demo Access</span>
            <span className="text-[10px] text-slate-400">admin / AdminPass123!</span>
          </div>
        </div>
      </div>

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white">Reset Account Password</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-450 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="label-field text-slate-400">Your Corporate Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. analyst"
                  value={forgotUser}
                  onChange={(e) => setForgotUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-150 focus:border-brand-500 focus:bg-slate-950 outline-none transition-all duration-200 text-xs"
                />
              </div>

              <div>
                <label className="label-field text-slate-400">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. analyst@bankdefault.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-150 focus:border-brand-500 focus:bg-slate-950 outline-none transition-all duration-200 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isResetting || !forgotUser || !forgotEmail}
                className="w-full btn-primary py-2.5 mt-2 flex items-center justify-center gap-1.5"
              >
                {isResetting ? 'Verifying...' : 'Request Password Reset'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
