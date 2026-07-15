import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast Render Area */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          const iconMap = {
            success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
            error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
            info: <Info className="w-5 h-5 text-brand-500 shrink-0" />
          };

          const bgMap = {
            success: 'bg-emerald-50/95 border-emerald-100 dark:bg-emerald-950/95 dark:border-emerald-900/50',
            warning: 'bg-amber-50/95 border-amber-100 dark:bg-amber-950/95 dark:border-amber-900/50',
            error: 'bg-red-50/95 border-red-100 dark:bg-red-950/95 dark:border-red-900/50',
            info: 'bg-brand-50/95 border-brand-100 dark:bg-brand-950/95 dark:border-brand-900/50'
          };

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm pointer-events-auto animate-slide-in ${bgMap[toast.type]}`}
            >
              {iconMap[toast.type]}
              <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* CSS Animation injected via style block */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
