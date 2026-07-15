import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  FileText, 
  ArrowRight, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  BrainCircuit,
  X,
  FileDown
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { TableSkeleton } from '../components/Skeletons';

export const Reports: React.FC = () => {
  const [historyData, setHistoryData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  const { addToast } = useToast();
  const { theme } = useTheme();

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getPredictionHistory({ page, limit: 10 });
      setHistoryData(res);
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch prediction logs.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handleDownloadPortfolio = async (format: 'csv' | 'excel') => {
    try {
      addToast(`Generating ${format.toUpperCase()} portfolio download...`, 'info');
      const blob = format === 'csv'
        ? await api.downloadPortfolioCsv()
        : await api.downloadPortfolioExcel();
        
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bank_loan_portfolio.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Portfolio file downloaded.', 'success');
    } catch (err) {
      addToast('Download failed.', 'error');
    }
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      addToast('Generating PDF assessment report...', 'info');
      const blob = await api.downloadPredictionPdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `risk_assessment_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('PDF downloaded successfully.', 'success');
    } catch (err) {
      addToast('Failed to download PDF report.', 'error');
    }
  };

  const handleOpenLog = (log: any) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  // Helper to color-code risk badges
  const getRiskColor = (rating: string) => {
    if (rating === 'High') return 'bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
    if (rating === 'Medium') return 'bg-amber-50 text-amber-550 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    return 'bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white flex items-center gap-2">
          Reports & Export Center
          <FileSpreadsheet className="w-6 h-6 text-brand-600" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Export credit portfolios, download single prediction logs, and audit underwriting decisions.
        </p>
      </div>

      {/* Export Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Loan Portfolio Export */}
        <div className="glass-card p-6 flex flex-col justify-between h-56">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Data</span>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white mt-1">Underwritten Loan Portfolio</h3>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
              Download the entire list of bank clients, including credit score tiers, debt-to-income metrics, amounts, and underwriting status.
            </p>
          </div>
          <div className="flex gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
            <button
              onClick={() => handleDownloadPortfolio('csv')}
              className="flex-1 btn-secondary text-xs flex items-center justify-center gap-2 py-2"
            >
              <FileDown className="w-4 h-4 text-slate-400" />
              CSV Spreadsheet
            </button>
            <button
              onClick={() => handleDownloadPortfolio('excel')}
              className="flex-1 btn-primary text-xs flex items-center justify-center gap-2 py-2"
            >
              <FileDown className="w-4 h-4 text-slate-200" />
              Excel Workbook
            </button>
          </div>
        </div>

        {/* Diagnostic Metadata Export */}
        <div className="glass-card p-6 flex flex-col justify-between h-56">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model Diagnostics</span>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white mt-1">ML Model Calibration Report</h3>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
              Export standard ML evaluation statistics including training hyperparameters, Confusion Matrix arrays, ROC curve coordinates, and global importances.
            </p>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
            <button
              onClick={async () => {
                try {
                  const diag = await api.getDiagnostics();
                  const blob = new Blob([JSON.stringify(diag, null, 2)], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'model_diagnostics.json');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  addToast('Model diagnostics JSON file downloaded.', 'success');
                } catch (err: any) {
                  addToast(err.message || 'Failed to download diagnostics.', 'error');
                }
              }}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-2 py-2"
            >
              <FileDown className="w-4 h-4 text-slate-400" />
              Export Diagnostics JSON
            </button>
          </div>
        </div>

      </div>

      {/* Prediction History Logs Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Credit Risk Assessment History</h3>
            <p className="text-xs text-slate-400 mt-0.5">Logs of recent loan applications processed by DefaultGuard ML Engine</p>
          </div>
        </div>

        {loadingHistory ? (
          <TableSkeleton rows={6} />
        ) : !historyData || historyData.items.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-450 text-sm">
            No historical prediction logs found. Run a prediction to create entries.
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200/50 text-slate-500 uppercase font-semibold select-none dark:bg-slate-900/40 dark:border-slate-800">
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Assigned Risk</th>
                    <th className="px-6 py-4">Probability of Default</th>
                    <th className="px-6 py-4">Confidence Score</th>
                    <th className="px-6 py-4">Assessment Date</th>
                    <th className="px-6 py-4 text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyData.items.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {log.customer?.first_name} {log.customer?.last_name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{log.customer?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getRiskColor(log.risk_rating)}`}>
                          {log.risk_rating} Risk
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-850 dark:text-white">
                        {(log.risk_probability * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">
                        {(log.confidence_score * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-slate-450 dark:text-slate-400 font-semibold">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenLog(log)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-350 transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(log.id)}
                            className="p-2 bg-brand-50 hover:bg-brand-100 text-brand-650 rounded-xl dark:bg-brand-950/20 dark:hover:bg-brand-950/40 dark:text-brand-400 transition-colors"
                            title="Download PDF Report"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center select-none text-xs font-semibold text-slate-500">
              <span>Showing Page {page} of {historyData.pages} (Total: {historyData.total} logs)</span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(historyData.pages, p + 1))}
                  disabled={page === historyData.pages}
                  className="btn-secondary py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- PREDICTION INSPECTION MODAL --- */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Risk Evaluation Details</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inspection Content */}
            <div className="p-6 space-y-4 text-xs font-semibold text-slate-650 dark:text-slate-350">
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-400">Client Profile</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedLog.customer?.first_name} {selectedLog.customer?.last_name}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-400">Decision Classification</span>
                <span className={`px-2 py-0.5 rounded border ${getRiskColor(selectedLog.risk_rating)}`}>
                  {selectedLog.risk_rating} Risk
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-400">Calculated Default Prob</span>
                <span className="text-slate-800 dark:text-white">{(selectedLog.risk_probability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-400">Assessment Confidence</span>
                <span className="text-slate-800 dark:text-white">{(selectedLog.confidence_score * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-400">Calculated DTI Ratio</span>
                <span className="text-slate-800 dark:text-white">
                  {(selectedLog.explanation?.calculated_dti * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-400">Monthly EMI Quote</span>
                <span className="text-slate-800 dark:text-white">
                  ${selectedLog.explanation?.calculated_emi?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-400">Eligibility score</span>
                <span className="text-brand-500 font-bold">{selectedLog.explanation?.eligibility_score} / 100</span>
              </div>

              {/* SHAP explanation log snippets */}
              <div className="pt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Significant Attribution Shifts</h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedLog.explanation?.risk_increasers?.map((ri: any, idx: number) => (
                    <div key={`ri-${idx}`} className="flex justify-between bg-red-500/5 text-red-500/90 border border-red-500/10 p-2 rounded-xl text-[10px]">
                      <span>{ri.description}</span>
                      <span>+{ri.impact * 100}% default risk</span>
                    </div>
                  ))}
                  {selectedLog.explanation?.risk_reducers?.map((rr: any, idx: number) => (
                    <div key={`rr-${idx}`} className="flex justify-between bg-emerald-500/5 text-emerald-500/90 border border-emerald-500/10 p-2 rounded-xl text-[10px]">
                      <span>{rr.description}</span>
                      <span>{rr.impact * 100}% default risk</span>
                    </div>
                  ))}
                  {(!selectedLog.explanation?.risk_increasers?.length && !selectedLog.explanation?.risk_reducers?.length) && (
                    <p className="text-slate-400 italic text-center py-2">No shift attributions recorded for this profile.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedLog.id)}
                  className="btn-primary py-2 text-xs flex items-center justify-center gap-1.5 flex-grow"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="btn-secondary py-2 text-xs flex-grow"
                >
                  Close Details
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
