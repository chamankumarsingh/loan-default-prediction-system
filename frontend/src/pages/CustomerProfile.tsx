import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Plus, 
  FileText, 
  Trash2, 
  MessageSquare,
  Tags,
  Download,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Briefcase,
  GraduationCap,
  Heart,
  Home as HomeIcon,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { TableSkeleton } from '../components/Skeletons';

export const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Document Modal States
  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('PDF');
  const [docSize, setDocSize] = useState('1.5 MB');

  // Tags States
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const { addToast } = useToast();
  const { user } = useAuth();

  const fetchProfile = async () => {
    try {
      const data = await api.getCustomerProfile(customerId);
      setProfile(data);
      setTagsInput(data.customer.tags.join(', '));
    } catch (err: any) {
      addToast(err.message || 'Failed to retrieve profile workspace.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchProfile();
    }
  }, [customerId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);

    try {
      const note = await api.addCustomerNote(customerId, newNote);
      setProfile((prev: any) => ({
        ...prev,
        notes: [note, ...prev.notes]
      }));
      setNewNote('');
      addToast('Internal note recorded successfully.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save note.', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm('Delete this audit note?')) return;
    try {
      await api.deleteCustomerNote(noteId);
      setProfile((prev: any) => ({
        ...prev,
        notes: prev.notes.filter((n: any) => n.id !== noteId)
      }));
      addToast('Audit note deleted.', 'success');
    } catch (err: any) {
      addToast('Failed to delete note.', 'error');
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    try {
      const doc = await api.uploadMockDocument(customerId, docName, docType, docSize);
      setProfile((prev: any) => ({
        ...prev,
        documents: [doc, ...prev.documents]
      }));
      setDocName('');
      setShowDocModal(false);
      addToast('Mock verification document uploaded.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Upload failed.', 'error');
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!window.confirm('Delete this document mapping?')) return;
    try {
      await api.deleteMockDocument(docId);
      setProfile((prev: any) => ({
        ...prev,
        documents: prev.documents.filter((d: any) => d.id !== docId)
      }));
      addToast('Document record deleted.', 'success');
    } catch (err: any) {
      addToast('Failed to remove document.', 'error');
    }
  };

  const handleSaveTags = async () => {
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t !== '');

    try {
      await api.updateCustomerTags(customerId, parsedTags);
      setProfile((prev: any) => ({
        ...prev,
        customer: {
          ...prev.customer,
          tags: parsedTags
        }
      }));
      setIsEditingTags(false);
      addToast('Tags metadata updated.', 'success');
    } catch (err: any) {
      addToast('Failed to save tags.', 'error');
    }
  };

  const triggerDownload = (name: string) => {
    addToast(`Downloading document cache: ${name}...`, 'info');
  };

  const getLoanStatusStyle = (status: string) => {
    const config = {
      Approved: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
      Rejected: 'bg-red-50 text-red-650 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
      Pending: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      Defaulted: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50'
    };
    return config[status as 'Approved' | 'Rejected' | 'Pending' | 'Defaulted'] || 'bg-slate-100';
  };

  if (loading) {
    return <TableSkeleton rows={6} />;
  }

  if (!profile) {
    return (
      <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="font-bold text-slate-800 dark:text-white">Workspace Loading Failed</h2>
        <p className="text-xs text-slate-400 mt-2">Could not find a valid bank customer mapping for ID #{customerId}.</p>
        <Link to="/customers" className="btn-primary mt-6 text-xs">Return to Directory</Link>
      </div>
    );
  }

  const { customer, loans, notes, documents } = profile;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: 'Registry', to: '/customers' },
          { label: `${customer.first_name} ${customer.last_name}` },
          { label: 'CRM Profile Workspace' }
        ]} 
      />

      {/* Main Header Profile Panel */}
      <div className="glass-card p-6 bg-gradient-to-r from-brand-950 via-brand-900 to-slate-900 text-white border-none flex flex-col md:flex-row md:items-center justify-between gap-6 glow-brand">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-3xl font-black uppercase text-brand-200">
            {customer.first_name.substring(0, 1)}{customer.last_name.substring(0, 1)}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{customer.first_name} {customer.last_name}</h1>
            <p className="text-xs text-brand-200 font-semibold mt-1">Profile ID: # {customer.id} | Underwriting Account</p>
            
            {/* Contact details */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Member: {new Date(customer.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action tags */}
        <div className="flex flex-col gap-2 items-end">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Active Flags</span>
          <div className="flex flex-wrap gap-2 justify-end max-w-xs">
            {customer.tags.map((tag: string, idx: number) => (
              <span 
                key={idx} 
                className="text-[10px] font-bold bg-white/10 border border-white/10 text-brand-200 px-2.5 py-1 rounded-md uppercase"
              >
                {tag}
              </span>
            ))}
            {customer.tags.length === 0 && (
              <span className="text-[10px] text-slate-400 italic">No account flags</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SIDEBAR: Demographics Metadata (Left Column - 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              Demographic Particulars
            </h3>

            <div className="space-y-3.5 text-xs font-semibold text-slate-650 dark:text-slate-350">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Age / Gender</span>
                <span className="text-slate-800 dark:text-white">{customer.age} yrs / {customer.gender}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Marital Status</span>
                <span className="text-slate-800 dark:text-white">{customer.marital_status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Education Tier</span>
                <span className="text-slate-800 dark:text-white">{customer.education}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Employment status</span>
                <span className="text-slate-800 dark:text-white">{customer.employment_type} ({customer.job_experience} yrs exp)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><HomeIcon className="w-3.5 h-3.5" /> Home Ownership</span>
                <span className="text-slate-800 dark:text-white">{customer.home_ownership}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-bold">Annual Income</span>
                <span className="text-emerald-500 font-bold">${customer.annual_income?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Tags Editor */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <Tags className="w-4 h-4 text-brand-500" />
              Categorisation Tags
            </h3>
            
            {isEditingTags ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. VIP, VIP Gold, High Risk"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="input-field text-xs py-2"
                />
                <p className="text-[10px] text-slate-400 font-semibold">Separate tag categories using commas.</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsEditingTags(false)} className="btn-secondary py-1 text-[11px]">Cancel</button>
                  <button onClick={handleSaveTags} className="btn-primary py-1 text-[11px]">Save</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-450">Tags allow segmenting clients in directory registry filters.</p>
                <button 
                  onClick={() => setIsEditingTags(true)} 
                  className="w-full btn-secondary text-xs py-1.5 flex items-center justify-center gap-1"
                >
                  Manage Profile Tags
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WORKSPACE SECTIONS (Right Column - 8/12) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. Loan Timeline */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <Clock className="w-4 h-4 text-brand-500" />
              Chronological Loan Application History
            </h3>

            {loans.length === 0 ? (
              <p className="text-xs text-slate-450 italic text-center py-6">No historical loans underwritten for this client.</p>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 pt-2">
                {loans.map((loan: any) => (
                  <div key={loan.id} className="relative group">
                    {/* Timeline dot */}
                    <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-brand-500 dark:border-slate-900 group-hover:scale-110 transition-transform"></span>
                    
                    <div className="glass-card p-4 hover:border-slate-350 dark:hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                            ${loan.loan_amount?.toLocaleString()} Underwrite
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {loan.loan_purpose}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 mt-2 text-[10px] text-slate-400 font-semibold">
                          <span>Term: {loan.loan_term} Months</span>
                          <span>FICO Score: {loan.credit_score}</span>
                          <span>DTI: {(loan.debt_to_income_ratio * 100).toFixed(1)}%</span>
                          <span>EMI: ${loan.emi?.toLocaleString()}/mo</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getLoanStatusStyle(loan.status)}`}>
                          {loan.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(loan.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Audit Notes */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-500" />
              Underwriter Audit Notes
            </h3>

            {/* Note creation input */}
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                placeholder="Write an internal operational review note..."
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="input-field text-xs resize-none"
              ></textarea>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>
            </form>

            {/* List notes */}
            <div className="space-y-4 pt-2 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
              {notes.map((note: any, idx: number) => (
                <div key={note.id} className={`flex items-start justify-between gap-4 pt-3 ${idx === 0 ? 'pt-0 border-none' : ''}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <span>Author: {note.author}</span>
                      <span>•</span>
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {note.text}
                    </p>
                  </div>

                  {(note.author === user?.username) && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-slate-450 italic text-center py-4">No audit notes recorded for this customer.</p>
              )}
            </div>
          </div>

          {/* 3. Verification Documents */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-500" />
                Document Verification Repository
              </h3>
              <button
                onClick={() => setShowDocModal(true)}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Map Document
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc: any) => {
                const isExcel = doc.file_type === 'XLSX';
                return (
                  <div 
                    key={doc.id}
                    className="p-3.5 border border-slate-150 rounded-2xl dark:border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-350 dark:hover:border-slate-750 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-xl shrink-0 ${isExcel ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400'}`}>
                        {isExcel ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={doc.name}>
                          {doc.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                          {doc.file_type} • {doc.file_size} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => triggerDownload(doc.name)}
                        className="p-1.5 text-slate-450 hover:text-slate-650 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-855 transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 text-slate-450 hover:text-red-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-855 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {documents.length === 0 && (
                <div className="md:col-span-2 p-6 text-center text-slate-400 italic text-xs">
                  No verification documents mapped to this profile.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* --- MOCK DOCUMENT UPLOAD MODAL --- */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Map Verification Document</h3>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-650 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoc} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="label-field">Document Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tax_Transcript_2025"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">File Format</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="select-field"
                  >
                    <option value="PDF">PDF</option>
                    <option value="JPG">JPG Image</option>
                    <option value="PNG">PNG Image</option>
                    <option value="XLSX">Excel Sheet</option>
                  </select>
                </div>

                <div>
                  <label className="label-field">File Size</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.2 MB"
                    value={docSize}
                    onChange={(e) => setDocSize(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button type="button" onClick={() => setShowDocModal(false)} className="btn-secondary py-2">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2">
                  Map Document
                </button>
              </div>
            </form>
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
