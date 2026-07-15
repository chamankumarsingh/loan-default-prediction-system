import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { 
  LineChart as LineIcon, 
  CheckSquare, 
  Sliders, 
  SlidersHorizontal,
  HelpCircle,
  Database,
  RefreshCw,
  GitBranch
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { TableSkeleton } from '../components/Skeletons';

export const Analytics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const chartColors = {
    grid: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#64748b' : '#94a3b8',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '#1e293b' : '#e2e8f0',
    primary: '#2563EB',
    success: '#10B981',
    danger: '#EF4444'
  };

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const data = await api.getDiagnostics();
      setDiagnostics(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to load model diagnostics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  if (loading) {
    return <TableSkeleton rows={5} />;
  }

  if (!diagnostics) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-slate-450 italic text-sm">Failed to retrieve model analytics. Ensure the model has been trained.</p>
        <button onClick={fetchDiagnostics} className="btn-primary mt-6 text-xs flex items-center gap-1.5 mx-auto">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const { metrics, feature_importances } = diagnostics;
  const cm = metrics.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 };
  const totalCm = cm.tn + cm.fp + cm.fn + cm.tp;

  // Accuracy breakdown stats for displaying
  const metricsCards = [
    { label: 'Accuracy', val: `${(metrics.accuracy * 100).toFixed(1)}%`, desc: 'Correct classification ratio' },
    { label: 'Precision', val: `${(metrics.precision * 100).toFixed(1)}%`, desc: 'Ratio of true positives to total predicted positives' },
    { label: 'Recall (Sensitivity)', val: `${(metrics.recall * 100).toFixed(1)}%`, desc: 'Ratio of defaults caught by the model' },
    { label: 'F1 Score', val: `${(metrics.f1 * 100).toFixed(1)}%`, desc: 'Harmonic mean of precision and recall' },
    { label: 'ROC-AUC Area', val: `${(metrics.auc * 100).toFixed(1)}%`, desc: 'Overall model sorting performance score' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Business Intelligence & Model Performance' }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white flex items-center gap-2">
            Intelligence & Diagnostics
            <LineIcon className="w-6 h-6 text-brand-650" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze default classifier tuning, evaluate ROC and Precision-Recall boundaries, and inspect global feature coefficient weights.
          </p>
        </div>
        <button
          onClick={fetchDiagnostics}
          className="btn-secondary py-2 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recalculate Diagnostics
        </button>
      </div>

      {/* Accuracy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {metricsCards.map((card, idx) => (
          <div key={idx} className="glass-card p-5 flex flex-col justify-between h-36">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</span>
            <span className="text-3xl font-black tracking-tight text-brand-600 dark:text-brand-400 mt-2">{card.val}</span>
            <p className="text-[9px] text-slate-450 dark:text-slate-400 leading-tight mt-2">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ROC Curve Chart (6/12) */}
        <div className="lg:col-span-6 glass-card p-6 h-[400px] flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white">Receiver Operating Characteristic (ROC)</h3>
            <p className="text-xs text-slate-400 mt-0.5">True Positive Rate vs False Positive Rate curve</p>
          </div>
          <div className="flex-1 w-full text-[10px] mt-4">
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={metrics.roc_curve} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rocGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="fpr" type="number" domain={[0, 1]} stroke={chartColors.text} tickFormatter={(v) => v.toFixed(1)} />
                <YAxis type="number" domain={[0, 1]} stroke={chartColors.text} tickFormatter={(v) => v.toFixed(1)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder }}
                  labelStyle={{ color: chartColors.text }}
                  formatter={(value: any) => [value.toFixed(3), 'Rate']}
                />
                <ReferenceLine x={0} y={0} stroke={chartColors.text} strokeDasharray="3 3" />
                <line x1="0" y1="200" x2="200" y2="0" stroke="#cccccc" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="tpr" stroke={chartColors.primary} strokeWidth={2.5} fillOpacity={1} fill="url(#rocGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precision-Recall Curve Chart (6/12) */}
        <div className="lg:col-span-6 glass-card p-6 h-[400px] flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white">Precision-Recall Curve</h3>
            <p className="text-xs text-slate-400 mt-0.5">Precision vs Recall curve across decision boundaries</p>
          </div>
          <div className="flex-1 w-full text-[10px] mt-4">
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={metrics.pr_curve} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="prGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={chartColors.success} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="recall" type="number" domain={[0, 1]} stroke={chartColors.text} tickFormatter={(v) => v.toFixed(1)} />
                <YAxis type="number" domain={[0, 1]} stroke={chartColors.text} tickFormatter={(v) => v.toFixed(1)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder }}
                  labelStyle={{ color: chartColors.text }}
                  formatter={(value: any) => [value.toFixed(3), 'Ratio']}
                />
                <Area type="monotone" dataKey="precision" stroke={chartColors.success} strokeWidth={2.5} fillOpacity={1} fill="url(#prGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Confusion Matrix (5/12) */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-brand-500" />
              Model Confusion Matrix
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Classification results on testing holdout subset ({totalCm} cases)</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center pt-2 select-none">
            {/* True Negative */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl dark:bg-emerald-950/20">
              <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">True Negatives (TN)</span>
              <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{cm.tn}</span>
              <span className="block text-[9px] text-slate-400 mt-1">Predicted Non-Default correctly</span>
            </div>

            {/* False Positive */}
            <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl dark:bg-red-950/10">
              <span className="block text-[10px] font-bold text-red-500 uppercase tracking-wider">False Positives (FP)</span>
              <span className="block text-2xl font-black text-red-500 mt-1">{cm.fp}</span>
              <span className="block text-[9px] text-slate-400 mt-1">Predicted Default falsely (Type I)</span>
            </div>

            {/* False Negative */}
            <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl dark:bg-red-950/10">
              <span className="block text-[10px] font-bold text-red-500 uppercase tracking-wider">False Negatives (FN)</span>
              <span className="block text-2xl font-black text-red-500 mt-1">{cm.fn}</span>
              <span className="block text-[9px] text-slate-400 mt-1">Missed Default (Type II)</span>
            </div>

            {/* True Positive */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl dark:bg-emerald-950/20">
              <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">True Positives (TP)</span>
              <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{cm.tp}</span>
              <span className="block text-[9px] text-slate-400 mt-1">Predicted Default correctly</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-normal border border-slate-100 dark:border-slate-800/80">
            <strong>Key Insight:</strong> True Negatives and True Positives show correctly classified instances. Type II errors (False Negatives) are critical to limit, as they represent defaulted loans that the model predicted to be safe.
          </div>
        </div>

        {/* Global Feature Importance Chart (7/12) */}
        <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between h-[450px]">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-brand-500" />
              Global Feature Weights (Importance)
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Top 12 feature weights evaluated by Random Forest Gini impurity</p>
          </div>

          <div className="flex-1 w-full text-[10px] mt-4">
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                layout="vertical"
                data={feature_importances?.slice(0, 12)}
                margin={{ left: 10, right: 10, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                <XAxis type="number" stroke={chartColors.text} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis dataKey="feature" type="category" stroke={chartColors.text} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder }}
                  labelStyle={{ color: chartColors.text }}
                  formatter={(value: any) => [`${(value * 100).toFixed(2)}% weight`, 'Global Importance']}
                />
                <Bar dataKey="importance" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
