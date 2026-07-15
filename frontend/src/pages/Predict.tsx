import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Activity, 
  HelpCircle,
  FileText,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
  UserCheck,
  CheckCircle,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { RiskGauge } from '../components/RiskGauge';
import { RiskSpeedometer } from '../components/RiskSpeedometer';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface CustomerOption {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  education: string;
  marital_status: string;
  employment_type: string;
  job_experience: number;
  annual_income: number;
  home_ownership: string;
  monthly_income: number;
  created_at: string;
  updated_at?: string;
}

export const Predict: React.FC = () => {
  // Wizard steps: 1 (Demographics), 2 (Financials), 3 (Loan details), 4 (Verification)
  const [currentStep, setCurrentStep] = useState(1);

  // Customers autocomplete list
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  // Form Fields (Loan specifics)
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTerm, setLoanTerm] = useState('36');
  const [creditScore, setCreditScore] = useState('650');
  const [existingLoans, setExistingLoans] = useState('0');
  const [dependents, setDependents] = useState('0');
  const [loanPurpose, setLoanPurpose] = useState('Personal');
  const [prevDefaults, setPrevDefaults] = useState('0');
  const [savingsBal, setSavingsBal] = useState('');
  const [currentBal, setCurrentBal] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState<any>(null);
  
  const { addToast } = useToast();

  // Fetch customers on search input changes
  useEffect(() => {
    const searchCustomers = async () => {
      if (searchQuery.trim().length < 2) {
        setCustomers([]);
        return;
      }
      try {
        const data = await api.getCustomers({ search: searchQuery, limit: 10 });
        setCustomers(data.items);
      } catch (err) {
        console.error(err);
      }
    };
    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectCustomer = (cust: CustomerOption) => {
    setSelectedCustomer(cust);
    setSearchQuery(`${cust.first_name} ${cust.last_name}`);
    setShowCustDropdown(false);
    
    // Auto-populate default fields from customer details for step 2 financial metrics
    setSavingsBal(String(Math.round(cust.annual_income * 0.12)));
    setCurrentBal(String(Math.round(cust.annual_income * 0.05)));
    
    addToast(`Linked underwrite account: ${cust.first_name} ${cust.last_name}.`, 'info');
    
    // Jump to step 2 automatically for efficiency
    setCurrentStep(2);
  };

  const validateStep = (step: number) => {
    if (step === 1 && !selectedCustomer) {
      addToast('Please select a customer profile from the search directory.', 'warning');
      return false;
    }
    if (step === 2) {
      if (!savingsBal || Number(savingsBal) < 0) {
        addToast('Please enter a valid savings account balance.', 'warning');
        return false;
      }
      if (!currentBal || Number(currentBal) < 0) {
        addToast('Please enter a valid checking account balance.', 'warning');
        return false;
      }
    }
    if (step === 3) {
      if (!loanAmount || Number(loanAmount) <= 1000) {
        addToast('Please specify a loan amount greater than $1,000.', 'warning');
        return false;
      }
      if (Number(creditScore) < 300 || Number(creditScore) > 850) {
        addToast('FICO credit scores must be between 300 and 850.', 'warning');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleExecuteRiskEngine = async () => {
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    setLoadingMsg('Running mathematical preprocessing...');
    
    const payload = {
      customer_id: selectedCustomer.id,
      loan_amount: Number(loanAmount),
      loan_term: Number(loanTerm),
      credit_score: Number(creditScore),
      existing_loans: Number(existingLoans),
      number_of_dependents: Number(dependents),
      loan_purpose: loanPurpose,
      previous_defaults: Number(prevDefaults),
      savings_balance: Number(savingsBal),
      current_balance: Number(currentBal)
    };

    try {
      // Simulate pipeline delay
      setTimeout(() => setLoadingMsg('Evaluating Random Forest decision boundaries...'), 800);
      setTimeout(() => setLoadingMsg('Calculating perturbation attribution reasons...'), 1600);

      const res = await api.predict(payload);
      setTimeout(() => {
        setResult(res);
        setIsSubmitting(false);
        addToast('Credit risk assessment completed.', 'success');
      }, 2400);
    } catch (err: any) {
      addToast(err.message || 'Prediction failed. Check backend endpoints.', 'error');
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    try {
      addToast('Generating assessment report PDF...', 'info');
      const blob = await api.downloadPredictionPdf(result.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Loan_Risk_Assessment_${selectedCustomer?.last_name}_${result.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      addToast('Download completed successfully.', 'success');
    } catch (err) {
      addToast('PDF download failed. Check report exporter.', 'error');
    }
  };

  const resetWizard = () => {
    setResult(null);
    setSelectedCustomer(null);
    setSearchQuery('');
    setLoanAmount('');
    setSavingsBal('');
    setCurrentBal('');
    setCurrentStep(1);
  };

  const stepLabels = ['Demographics', 'Financial Metrics', 'Loan Structure', 'Risk Engine'];

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
      
      {/* Printable CSS override */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        <Breadcrumbs items={[{ label: 'Risk Underwriting Wizard' }]} />
      </div>

      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white flex items-center gap-2">
            Risk Underwriting Wizard
            <ShieldAlert className="w-6 h-6 text-brand-650" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conduct multi-step risk evaluations. Fetch demographic records, set parameters, and execute the classification engine.
          </p>
        </div>
      </div>

      {!result ? (
        /* --- WIZARD FORM IN PROGRESS --- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print">
          
          {/* Progress panel (Left 3 columns) */}
          <div className="lg:col-span-3 glass-card p-5 space-y-4">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Assessment Steps</h3>
            
            <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-5 py-2">
              {stepLabels.map((lbl, idx) => {
                const stepNum = idx + 1;
                const isCurrent = stepNum === currentStep;
                const isDone = stepNum < currentStep;
                return (
                  <div key={idx} className="relative flex items-center gap-3">
                    {/* Circle icon */}
                    <span className={`absolute -left-[25px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      isCurrent 
                        ? 'border-brand-500 bg-brand-500 text-white shadow-sm' 
                        : isDone 
                          ? 'border-emerald-500 bg-emerald-500 text-white' 
                          : 'border-slate-350 bg-white text-slate-450 dark:border-slate-800 dark:bg-slate-900'
                    }`}>
                      {isDone ? <Check className="w-2.5 h-2.5" /> : stepNum}
                    </span>
                    <span className={`text-xs font-semibold ${isCurrent ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-400 font-semibold'}`}>
                      {lbl}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form workspace (Right 9 columns) */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Step 1: Customer Demographics Autocomplete */}
            {currentStep === 1 && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-850 dark:text-white">Profile Registry Linkage</h2>
                  <p className="text-xs text-slate-400 mt-1">Select an active borrowing client from the bank CRM database to pull background metrics.</p>
                </div>

                <div className="relative">
                  <label className="label-field">Search Bank Registry</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type name, email, or telephone number to search..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowCustDropdown(true);
                      }}
                      className="input-field pl-10"
                    />
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>

                  {showCustDropdown && customers.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                      {customers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-between gap-4 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{c.first_name} {c.last_name}</span>
                            <span className="block text-[10px] text-slate-450 dark:text-slate-400">{c.email} • {c.phone}</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-650 dark:text-slate-350">
                            {c.employment_type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedCustomer && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl dark:bg-emerald-950/10 flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Account Linked successfully</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1 leading-normal">
                        System retrieved demographics for <strong>{selectedCustomer.first_name} {selectedCustomer.last_name}</strong> (Age: {selectedCustomer.age}, Gender: {selectedCustomer.gender}, Marital Status: {selectedCustomer.marital_status}, Education: {selectedCustomer.education}).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Financial Metrics */}
            {currentStep === 2 && selectedCustomer && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-850 dark:text-white">Client Financial Standing</h2>
                  <p className="text-xs text-slate-400 mt-1">Review verified profile liquidity. Set liquid check and current liabilities.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
                  <div>
                    <label className="label-field">Annual Base Salary ($)</label>
                    <input
                      type="text"
                      disabled
                      value={`$ ${selectedCustomer.annual_income?.toLocaleString()}`}
                      className="input-field bg-slate-50 dark:bg-slate-900/60 opacity-80 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="label-field">Job Experience (Years)</label>
                    <input
                      type="text"
                      disabled
                      value={`${selectedCustomer.job_experience} Years`}
                      className="input-field bg-slate-50 dark:bg-slate-900/60 opacity-80 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="label-field">Savings Account Balance ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 15000"
                      value={savingsBal}
                      onChange={(e) => setSavingsBal(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label-field">Checking Account Balance ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={currentBal}
                      onChange={(e) => setCurrentBal(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label-field">Active Co-existing Loans (Count)</label>
                    <select
                      value={existingLoans}
                      onChange={(e) => setExistingLoans(e.target.value)}
                      className="select-field"
                    >
                      <option value="0">0 Loans</option>
                      <option value="1">1 Active Loan</option>
                      <option value="2">2 Active Loans</option>
                      <option value="3">3+ Active Loans</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Loan Parameters */}
            {currentStep === 3 && selectedCustomer && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-850 dark:text-white">Proposed Loan Parameters</h2>
                  <p className="text-xs text-slate-400 mt-1">Configure requesting loan capital details, purpose, and FICO risk score.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
                  <div>
                    <label className="label-field">Request Capital Amount ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 25000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label-field">Loan Maturity Duration (Months)</label>
                    <select
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(e.target.value)}
                      className="select-field"
                    >
                      <option value="12">12 Months (1 Year)</option>
                      <option value="24">24 Months (2 Years)</option>
                      <option value="36">36 Months (3 Years)</option>
                      <option value="48">48 Months (4 Years)</option>
                      <option value="60">60 Months (5 Years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-field">Loan Category Purpose</label>
                    <select
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      className="select-field"
                    >
                      <option value="Personal">Personal Loan</option>
                      <option value="Education">Education Tuition</option>
                      <option value="Home">Home Purchase</option>
                      <option value="Auto">Auto Loan</option>
                      <option value="Business">Business Venture</option>
                      <option value="Other">Other Miscellaneous</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-field">FICO Credit Bureau Score</label>
                    <input
                      type="number"
                      required
                      min={300}
                      max={850}
                      placeholder="e.g. 680"
                      value={creditScore}
                      onChange={(e) => setCreditScore(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label-field">Previous Default Counts</label>
                    <select
                      value={prevDefaults}
                      onChange={(e) => setPrevDefaults(e.target.value)}
                      className="select-field"
                    >
                      <option value="0">0 Defaults (Clean Credit)</option>
                      <option value="1">1 Prior Delinquency</option>
                      <option value="2">2+ Prior Defaults</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-field">Number of Dependents</label>
                    <select
                      value={dependents}
                      onChange={(e) => setDependents(e.target.value)}
                      className="select-field"
                    >
                      <option value="0">0 Dependents</option>
                      <option value="1">1 Dependent</option>
                      <option value="2">2 Dependents</option>
                      <option value="3">3+ Dependents</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Verification & Executing */}
            {currentStep === 4 && selectedCustomer && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-850 dark:text-white">Verify Credit Application Summary</h2>
                  <p className="text-xs text-slate-400 mt-1">Review the checklist details before triggering the Random Forest classification calculations.</p>
                </div>

                {isSubmitting ? (
                  /* Loading screen during ML pipeline runs */
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{loadingMsg}</span>
                  </div>
                ) : (
                  <div className="space-y-4 font-semibold text-xs text-slate-655 dark:text-slate-355">
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Client Profile</span>
                        <span className="font-bold text-slate-800 dark:text-white text-sm">{selectedCustomer.first_name} {selectedCustomer.last_name}</span>
                      </div>
                      
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">FICO score</span>
                        <span className="font-bold text-slate-800 dark:text-white text-sm">{creditScore}</span>
                      </div>

                      <div className="mt-2">
                        <span className="text-[10px] text-slate-400 block uppercase">Requested Capital</span>
                        <span className="font-bold text-emerald-500 text-sm">$ {Number(loanAmount)?.toLocaleString()}</span>
                      </div>

                      <div className="mt-2">
                        <span className="text-[10px] text-slate-400 block uppercase">Term / Purpose</span>
                        <span className="font-bold text-slate-800 dark:text-white text-sm">{loanTerm} mo / {loanPurpose}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-[10px] text-slate-450 leading-relaxed font-medium mt-4">
                      <Info className="w-4 h-4 text-brand-500 shrink-0" />
                      <span>
                        Executing the assessment will immediately log this check inside the security audit trails, evaluate default hazard risks, and output mitigations list.
                      </span>
                    </div>

                    <button
                      onClick={handleExecuteRiskEngine}
                      className="w-full btn-primary py-3 mt-4 text-xs font-extrabold flex items-center justify-center gap-1.5"
                    >
                      <Activity className="w-4 h-4" />
                      Execute Risk Underwriting Engine
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            {!isSubmitting && (
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="btn-secondary py-2 text-xs flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                
                {currentStep < 4 ? (
                  <button
                    onClick={handleNextStep}
                    className="btn-primary py-2 text-xs flex items-center gap-1"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            )}
            
          </div>
        </div>
      ) : (
        /* --- RESULTS VIEW DISPLAYED (PRINTABLE) --- */
        <div className="space-y-6 print-area">
          
          {/* Top Panel Actions (Only visible in portal browser, hidden in print) */}
          <div className="flex justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 no-print">
            <button onClick={resetWizard} className="btn-secondary py-1.5 text-xs">
              Evaluate New Loan
            </button>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="btn-secondary py-1.5 text-xs flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" /> Print Layout
              </button>
              <button onClick={handleDownloadPDF} className="btn-primary py-1.5 text-xs flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Download Report PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Speedometer Gauges Card (4/12 columns) */}
            <div className="lg:col-span-4 glass-card p-6 flex flex-col items-center">
              <h3 className="font-extrabold text-sm text-slate-850 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 w-full text-center">
                Risk Engine Evaluation
              </h3>
              
              <RiskSpeedometer probability={result.risk_probability} rating={result.risk_rating} />
              
              <div className="w-full text-center border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 text-xs font-semibold text-slate-550 dark:text-slate-350">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Confidence Score:</span>
                  <span>{(result.confidence_score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Calculated EMI:</span>
                  <span className="text-emerald-500 font-extrabold">${result.explanation.calculated_emi?.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Debt-to-Income (DTI):</span>
                  <span>{(result.explanation.calculated_dti * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Explanations Card (8/12 columns) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Feature Attribution Drivers */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-white">AI Explanations: Principal Risk Drivers</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400">Perturbation impact shifts compared against populations medians.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Risk Increasers */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> High Risk Contributors
                    </span>
                    <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {result.explanation.risk_increasers.map((ri: any, idx: number) => (
                        <li key={idx} className="flex justify-between p-2.5 bg-red-500/5 rounded-xl border border-red-500/10">
                          <span>{ri.feature}</span>
                          <span className="text-red-500">+{Math.round(ri.impact * 100)}% shift</span>
                        </li>
                      ))}
                      {result.explanation.risk_increasers.length === 0 && (
                        <p className="text-slate-450 italic">No significant risk contributors detected.</p>
                      )}
                    </ul>
                  </div>

                  {/* Risk Reducers */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5" /> Positive Mitigating Factors
                    </span>
                    <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {result.explanation.risk_reducers.map((rr: any, idx: number) => (
                        <li key={idx} className="flex justify-between p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                          <span>{rr.feature}</span>
                          <span className="text-emerald-500">{Math.round(rr.impact * 100)}% shift</span>
                        </li>
                      ))}
                      {result.explanation.risk_reducers.length === 0 && (
                        <p className="text-slate-450 italic">No significant mitigating factors detected.</p>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommended Underwriter Actions */}
              {result.explanation.recommended_actions && (
                <div className="glass-card p-6 space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-1.5">
                    <CheckCircle className="w-4.5 h-4.5 text-brand-500" />
                    Recommended Risk Mitigations
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400">Underwriting actions suggested to secure loan serviceability limits.</p>
                  
                  <ul className="space-y-2 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {result.explanation.recommended_actions.map((act: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/85">
                        <ArrowRight className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Similar Historical Cases */}
              {result.explanation.similar_customers && (
                <div className="glass-card p-6 space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-white">
                    Outcome Reference: Nearest Neighbor Historical Profiles
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400">
                    Verified loan outcomes from SQLite matching similar score, income, and age attributes.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {result.explanation.similar_customers.map((sim: any, idx: number) => {
                      const isDefaulted = sim.status === 'Defaulted' || sim.status === 'Rejected';
                      return (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-2xl border ${isDefaulted ? 'bg-red-500/5 border-red-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}
                        >
                          <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{sim.name}</span>
                          <div className="space-y-1 text-[10px] text-slate-450 font-semibold mt-2">
                            <div>Score: <strong className="text-slate-750 dark:text-slate-300">{sim.credit_score}</strong></div>
                            <div>Capital: <strong className="text-slate-750 dark:text-slate-300">${sim.loan_amount?.toLocaleString()}</strong></div>
                            <div>Income: <strong className="text-slate-750 dark:text-slate-300">${sim.income?.toLocaleString()}</strong></div>
                          </div>
                          
                          <span className={`inline-block mt-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            sim.status === 'Approved' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : sim.status === 'Defaulted'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {sim.status}
                          </span>
                        </div>
                      );
                    })}
                    {result.explanation.similar_customers.length === 0 && (
                      <p className="md:col-span-3 text-xs text-slate-400 italic text-center py-4">No matching comparative historical profiles found.</p>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
