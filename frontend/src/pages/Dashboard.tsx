import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  ShieldAlert, 
  Calendar, 
  RefreshCw, 
  MapPin, 
  Activity, 
  FileText,
  Filter,
  X,
  Map,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { TableSkeleton } from '../components/Skeletons';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  // Filter States
  const [purposeFilter, setPurposeFilter] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

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
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    accent: '#06B6D4'
  };

  const PIE_COLORS = [chartColors.primary, chartColors.purple, chartColors.success, chartColors.warning, chartColors.pink, chartColors.accent];

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = {
        purpose: purposeFilter || undefined,
        employment_type: employmentFilter || undefined,
        start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
        end_date: endDate ? `${endDate}T23:59:59Z` : undefined
      };
      
      const data = await api.getDashboard(params);
      setStats(data);
      
      // Fetch audit logs for the recent activity feed
      const activityLogs = await api.getAuditLogs(8);
      setLogs(activityLogs);
    } catch (err: any) {
      addToast(err.message || 'Failed to refresh financial metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [purposeFilter, employmentFilter, startDate, endDate]);

  const clearFilters = () => {
    setPurposeFilter('');
    setEmploymentFilter('');
    setStartDate('');
    setEndDate('');
    addToast('Resetting dashboard filtration.', 'info');
  };

  const handlePurposeDrillDown = (purposeName: string) => {
    setPurposeFilter(purposeName);
    addToast(`Drilling down dashboard by: ${purposeName}`, 'info');
  };

  if (loading && !stats) {
    return <TableSkeleton rows={5} />;
  }

  const { kpis, charts } = stats || {
    kpis: { total_customers: 0, total_loans: 0, active_loans: 0, default_rate: 0.0, avg_credit_score: 0.0, total_loan_amount: 0.0 },
    charts: { loan_purpose: [], employment_type: [], risk_categories: [], monthly_issued: [], default_rate_trend: [], heatmap: [], branches: [] }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Dashboard Toolbar Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white">DefaultGuard Executive Panel</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time credit health analytics, branch performance trackers, and risk thresholds.</p>
        </div>

        <div className="flex items-center gap-2 select-none">
          <button 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`btn-secondary py-2 text-xs flex items-center gap-1.5 ${showFiltersPanel ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/20' : ''}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {(purposeFilter || employmentFilter || startDate || endDate) && (
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
            )}
          </button>
          
          <button 
            onClick={fetchDashboardData} 
            className="btn-secondary py-2 text-xs flex items-center gap-1.5"
            title="Refresh dashboard stats"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </button>
        </div>
      </div>

      {/* Interactive Filters Panel Drawer */}
      {showFiltersPanel && (
        <div className="p-5 glass-card animate-scale-up space-y-4 font-semibold text-xs text-slate-700 dark:text-slate-300">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
            <span className="font-extrabold text-sm flex items-center gap-1"><Filter className="w-4 h-4 text-brand-500" /> Filter Criteria</span>
            <button onClick={() => setShowFiltersPanel(false)} className="text-slate-450 hover:text-slate-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label-field">Loan Purpose</label>
              <select 
                value={purposeFilter} 
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="select-field"
              >
                <option value="">All Purposes</option>
                <option value="Personal">Personal</option>
                <option value="Education">Education</option>
                <option value="Home">Home</option>
                <option value="Auto">Auto</option>
                <option value="Business">Business</option>
              </select>
            </div>

            <div>
              <label className="label-field">Employment Type</label>
              <select 
                value={employmentFilter} 
                onChange={(e) => setEmploymentFilter(e.target.value)}
                className="select-field"
              >
                <option value="">All Employment</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Unemployed">Unemployed</option>
              </select>
            </div>

            <div>
              <label className="label-field">From Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field py-2 text-xs" 
              />
            </div>

            <div>
              <label className="label-field">To Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field py-2 text-xs" 
              />
            </div>
          </div>

          {(purposeFilter || employmentFilter || startDate || endDate) && (
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
              <button onClick={clearFilters} className="btn-secondary py-1 text-[11px] text-red-500 border-red-200">Clear Filters</button>
            </div>
          )}
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total portfolio volume */}
        <div className="glass-card p-5 bg-gradient-to-br from-brand-600/5 via-transparent to-brand-500/5 hover:border-brand-500/30 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Capital</span>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">${kpis.total_loan_amount?.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</h2>
            <p className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +12.4% portfolio growth</p>
          </div>
          <div className="p-3 bg-brand-50 rounded-2xl dark:bg-brand-950/20 text-brand-550 dark:text-brand-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="glass-card p-5 hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credit Accounts</span>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">{kpis.total_customers}</h2>
            <p className="text-[9px] text-slate-450 dark:text-slate-400 leading-none mt-1">Unique customer profiles mapped</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl dark:bg-slate-900 text-slate-650 dark:text-slate-300">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Default rate */}
        <div className="glass-card p-5 hover:border-red-500/20 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Default Ratio</span>
            <h2 className="text-2xl font-black text-red-500 dark:text-red-400">{kpis.default_rate}%</h2>
            <p className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> -0.8% default drop</p>
          </div>
          <div className="p-3 bg-red-50 rounded-2xl dark:bg-red-950/20 text-red-500">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        {/* FICO Average */}
        <div className="glass-card p-5 hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average FICO</span>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">{kpis.avg_credit_score}</h2>
            <p className="text-[9px] text-slate-450 dark:text-slate-400 mt-1 font-semibold text-slate-500 uppercase tracking-wider">Prime status</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl dark:bg-slate-900 text-slate-650 dark:text-slate-300">
            <ShieldAlert className="w-6 h-6 text-brand-650" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Issued Volume Area Trend Chart (8/12 columns) */}
        <div className="lg:col-span-8 glass-card p-6 h-[380px] flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white">Monthly Credit Underwriting Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Historical overview of capital issued counts monthly</p>
          </div>

          <div className="flex-1 w-full text-[10px] mt-4">
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={charts.monthly_issued} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="issuedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="month" stroke={chartColors.text} />
                <YAxis stroke={chartColors.text} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder }}
                  labelStyle={{ color: chartColors.text }}
                  formatter={(value: any) => [`$${value?.toLocaleString()}`, 'Capital Issued']}
                />
                <Area type="monotone" dataKey="amount" stroke={chartColors.primary} strokeWidth={2.5} fillOpacity={1} fill="url(#issuedGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loan Purpose Pie chart (4/12 columns) */}
        <div className="lg:col-span-4 glass-card p-6 h-[380px] flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white">Loan Purpose Segments</h3>
            <p className="text-xs text-slate-400 mt-0.5">Portfolio distribution by categorised application purpose</p>
          </div>

          <div className="flex-1 w-full text-[10px] relative flex justify-center mt-2">
            <ResponsiveContainer width="100%" height="95%">
              <PieChart>
                <Pie
                  data={charts.loan_purpose}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  className="cursor-pointer"
                >
                  {charts.loan_purpose.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]} 
                      onClick={() => handlePurposeDrillDown(entry.name)}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder }}
                  formatter={(value: any) => [`${value} loans`, 'Purpose Count']}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center value */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-850 dark:text-white">{kpis.total_loans}</span>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Active Loans</span>
            </div>
          </div>
        </div>

      </div>

      {/* Geolocation Branch Map & Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Geographic Distribution (7/12 columns) */}
        <div className="lg:col-span-7 glass-card p-6 space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-1.5">
              <Map className="w-4 h-4 text-brand-500" />
              Branch Credit Exposure Maps
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Overview of active loan distributions across metropolitan banking centers.</p>
          </div>

          {/* Interactive Mock Map Overlay using CSS */}
          <div className="relative h-64 w-full bg-slate-100 rounded-3xl border border-slate-150 overflow-hidden dark:bg-slate-900/60 dark:border-slate-800">
            {/* Simple India contour sketch overlay layout via CSS grid */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Mumbai HQ bubble */}
            <div className="absolute left-[35%] top-[65%] -translate-x-1/2 -translate-y-1/2 group z-10 cursor-pointer">
              <span className="absolute inline-flex h-8 w-8 rounded-full bg-brand-500/30 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-brand-600 border border-white dark:border-slate-900"></span>
              
              {/* Tooltip */}
              <div className="absolute left-1/2 -top-16 -translate-x-1/2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 shadow-lg text-[9px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity w-32 pointer-events-none select-none text-slate-800 dark:text-white leading-normal">
                <span className="block font-black text-[10px] text-brand-600 dark:text-brand-400">Mumbai HQ</span>
                <span className="block text-slate-400 mt-0.5">Loans: {charts.branches[0]?.loans} | Rate: {charts.branches[0]?.defaultRate}%</span>
              </div>
            </div>

            {/* Delhi Hub */}
            <div className="absolute left-[45%] top-[30%] -translate-x-1/2 -translate-y-1/2 group z-10 cursor-pointer">
              <span className="absolute inline-flex h-8 w-8 rounded-full bg-purple-500/30 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-purple-600 border border-white dark:border-slate-900"></span>
              
              <div className="absolute left-1/2 -top-16 -translate-x-1/2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 shadow-lg text-[9px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity w-32 pointer-events-none select-none text-slate-800 dark:text-white leading-normal">
                <span className="block font-black text-[10px] text-purple-600 dark:text-purple-400">Delhi City</span>
                <span className="block text-slate-400 mt-0.5">Loans: {charts.branches[1]?.loans} | Rate: {charts.branches[1]?.defaultRate}%</span>
              </div>
            </div>

            {/* Bengaluru IT */}
            <div className="absolute left-[40%] top-[80%] -translate-x-1/2 -translate-y-1/2 group z-10 cursor-pointer">
              <span className="absolute inline-flex h-8 w-8 rounded-full bg-emerald-500/30 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-emerald-600 border border-white dark:border-slate-900"></span>
              
              <div className="absolute left-1/2 -top-16 -translate-x-1/2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 shadow-lg text-[9px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity w-32 pointer-events-none select-none text-slate-800 dark:text-white leading-normal">
                <span className="block font-black text-[10px] text-emerald-600 dark:text-emerald-400">Bengaluru IT</span>
                <span className="block text-slate-400 mt-0.5">Loans: {charts.branches[2]?.loans} | Rate: {charts.branches[2]?.defaultRate}%</span>
              </div>
            </div>

            {/* Kolkata Branch */}
            <div className="absolute left-[65%] top-[50%] -translate-x-1/2 -translate-y-1/2 group z-10 cursor-pointer">
              <span className="absolute inline-flex h-8 w-8 rounded-full bg-amber-500/30 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-amber-600 border border-white dark:border-slate-900"></span>
              
              <div className="absolute left-1/2 -top-16 -translate-x-1/2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 shadow-lg text-[9px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity w-32 pointer-events-none select-none text-slate-800 dark:text-white leading-normal">
                <span className="block font-black text-[10px] text-amber-600">Kolkata Hub</span>
                <span className="block text-slate-400 mt-0.5">Loans: {charts.branches[3]?.loans} | Rate: {charts.branches[3]?.defaultRate}%</span>
              </div>
            </div>
            
            <div className="absolute bottom-3 left-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[9px] font-bold text-slate-400 select-none uppercase tracking-wider">
              Metropolitan Center Coverage
            </div>
          </div>
        </div>

        {/* 2. Recent Activities Feed (5/12 columns) */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4 h-[335px] flex flex-col">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Activity className="w-4.5 h-4.5 text-brand-500" />
            Audit Logging Activity Feed
          </h3>

          <div className="flex-1 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800/80 space-y-3.5 pt-1">
            {logs.map((log: any, idx: number) => (
              <div key={log.id} className={`flex items-start gap-3 text-[10px] font-semibold text-slate-650 dark:text-slate-350 pt-3.5 ${idx === 0 ? 'pt-0 border-none' : ''}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-1 shrink-0"></div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{log.action}</span>
                    <span className="text-slate-400 font-semibold">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-8">No logs loaded.</p>
            )}
          </div>
        </div>

      </div>

      {/* Heatmap Row: DTI vs Credit Score Bubble Heatmap */}
      {charts.heatmap && charts.heatmap.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white">Default Risk Heatmap Distribution</h3>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Exposure default rate grids evaluated cross-tabulating FICO ranges and DTI rates.</p>
          </div>

          <div className="h-64 text-[10px] mt-4 font-semibold">
            <ResponsiveContainer width="100%" height="90%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey="dti" 
                  type="category" 
                  name="DTI Tier" 
                  stroke={chartColors.text} 
                  allowDuplicatedCategory={false}
                />
                <YAxis 
                  dataKey="credit" 
                  type="category" 
                  name="Credit Tier" 
                  stroke={chartColors.text} 
                />
                <ZAxis 
                  dataKey="count" 
                  type="number" 
                  range={[50, 400]} 
                  name="Applications count" 
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder }}
                  labelStyle={{ color: chartColors.text }}
                  formatter={(value: any, name: string, props: any) => {
                    if (name === "Applications count") return [value, name];
                    return [value, name];
                  }}
                />
                <Scatter 
                  name="Default Rate Map" 
                  data={charts.heatmap} 
                  fill="#f43f5e"
                >
                  {charts.heatmap.map((entry: any, index: number) => {
                    // Color code based on default rate intensity
                    let col = chartColors.success;
                    if (entry.defaultRate > 15) col = chartColors.danger;
                    else if (entry.defaultRate > 5) col = chartColors.warning;
                    return <Cell key={`cell-${index}`} fill={col} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center gap-6 justify-center text-[10px] font-bold text-slate-450">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Low defaults (&lt;5%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Medium defaults (5-15%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> High defaults (&gt;15%)</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.98); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.15s ease-out forwards;
        }
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
