import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Filter,
  X,
  BrainCircuit,
  Eye,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeletons';

export const Customers: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Query parameters state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [genderFilter, setGenderFilter] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState('');
  const [housingFilter, setHousingFilter] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('35');
  const [gender, setGender] = useState('Male');
  const [education, setEducation] = useState('Bachelor');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [employmentType, setEmploymentType] = useState('Salaried');
  const [jobExperience, setJobExperience] = useState('5');
  const [annualIncome, setAnnualIncome] = useState('60000');
  const [homeOwnership, setHomeOwnership] = useState('Rent');

  const { addToast } = useToast();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({
        page,
        limit: 10,
        search,
        sort_by: sortBy,
        sort_order: sortOrder,
        gender: genderFilter || undefined,
        employment_type: employmentFilter || undefined,
        home_ownership: housingFilter || undefined
      });
      setData(res);
    } catch (err: any) {
      addToast(err.message || 'Failed to retrieve customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, sortBy, sortOrder, genderFilter, employmentFilter, housingFilter]);

  // Debounced search trigger
  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      fetchCustomers();
    }, 400);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleOpenAdd = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAge('35');
    setGender('Male');
    setEducation('Bachelor');
    setMaritalStatus('Single');
    setEmploymentType('Salaried');
    setJobExperience('5');
    setAnnualIncome('60000');
    setHomeOwnership('Rent');
    setShowAddModal(true);
  };

  const handleOpenEdit = (cust: any) => {
    setSelectedCust(cust);
    setFirstName(cust.first_name);
    setLastName(cust.last_name);
    setEmail(cust.email);
    setPhone(cust.phone);
    setAge(String(cust.age));
    setGender(cust.gender);
    setEducation(cust.education);
    setMaritalStatus(cust.marital_status);
    setEmploymentType(cust.employment_type);
    setJobExperience(String(cust.job_experience));
    setAnnualIncome(String(cust.annual_income));
    setHomeOwnership(cust.home_ownership);
    setShowEditModal(true);
  };

  const handleOpenView = (cust: any) => {
    navigate(`/customers/${cust.id}`);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        age: Number(age),
        gender,
        education,
        marital_status: maritalStatus,
        employment_type: employmentType,
        job_experience: Number(jobExperience),
        annual_income: Number(annualIncome),
        home_ownership: homeOwnership
      };
      await api.createCustomer(payload);
      addToast('Customer profile added successfully.', 'success');
      setShowAddModal(false);
      fetchCustomers();
    } catch (err: any) {
      addToast(err.message || 'Failed to create profile.', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        age: Number(age),
        gender,
        education,
        marital_status: maritalStatus,
        employment_type: employmentType,
        job_experience: Number(jobExperience),
        annual_income: Number(annualIncome),
        home_ownership: homeOwnership
      };
      await api.updateCustomer(selectedCust.id, payload);
      addToast('Customer profile updated.', 'success');
      setShowEditModal(false);
      fetchCustomers();
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile.', 'error');
    }
  };

  const handleDeleteCust = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer profile?')) return;
    try {
      await api.deleteCustomer(id);
      addToast('Customer deleted successfully.', 'success');
      fetchCustomers();
    } catch (err: any) {
      addToast(err.message || 'Delete operation failed.', 'error');
    }
  };

  const handleRunPredict = (cust: any) => {
    // Navigate to predict page, passing customer data as state
    navigate('/predict', { state: { customer: cust } });
  };

  const canWrite = hasRole(['Admin', 'Manager', 'Analyst']);
  const canDelete = hasRole(['Admin', 'Manager']);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white flex items-center gap-2">
            Customer Registry
            <Users className="w-6 h-6 text-brand-600" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register banking clients, view personal credentials, and manage profiles.
          </p>
        </div>

        <div className="flex gap-2">
          {canWrite && (
            <button
              onClick={() => addToast('Simulating bulk client CSV import...', 'info')}
              className="btn-secondary py-2 text-xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Import CSV
            </button>
          )}
          {canWrite && (
            <button
              onClick={handleOpenAdd}
              className="btn-primary py-2 text-xs flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-450 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center text-xs">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-medium text-slate-550 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </div>

          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            className="select-field py-1.5 px-3 w-32 border-slate-200"
          >
            <option value="">Gender: All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            value={employmentFilter}
            onChange={(e) => { setEmploymentFilter(e.target.value); setPage(1); }}
            className="select-field py-1.5 px-3 w-36 border-slate-200"
          >
            <option value="">Employment: All</option>
            <option value="Salaried">Salaried</option>
            <option value="Self-Employed">Self-Employed</option>
            <option value="Unemployed">Unemployed</option>
            <option value="Student">Student</option>
          </select>

          <select
            value={housingFilter}
            onChange={(e) => { setHousingFilter(e.target.value); setPage(1); }}
            className="select-field py-1.5 px-3 w-36 border-slate-200"
          >
            <option value="">Housing: All</option>
            <option value="Rent">Rented</option>
            <option value="Mortgage">Mortgage</option>
            <option value="Own">Owned</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : !data || data.items.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <p className="text-slate-450 text-sm">No customer records matching selected criteria.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/50 text-slate-500 uppercase font-semibold select-none dark:bg-slate-900/40 dark:border-slate-800">
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850" onClick={() => handleSort('first_name')}>
                    <div className="flex items-center gap-1">
                      Client Name
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850" onClick={() => handleSort('age')}>
                    <div className="flex items-center gap-1">
                      Age/Gender
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850" onClick={() => handleSort('employment_type')}>
                    <div className="flex items-center gap-1">
                      Employment
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850" onClick={() => handleSort('annual_income')}>
                    <div className="flex items-center gap-1">
                      Annual Income
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center gap-1">
                      Registered
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.items.map((cust: any) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      <button 
                        onClick={() => navigate(`/customers/${cust.id}`)}
                        className="hover:text-brand-500 hover:underline text-left"
                      >
                        {cust.first_name} {cust.last_name}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-650 dark:text-slate-350">{cust.email}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{cust.phone}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-650 dark:text-slate-350">
                      {cust.age} yrs / {cust.gender}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-semibold dark:bg-slate-800 dark:text-slate-400">
                        {cust.employment_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      ${cust.annual_income?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-450 dark:text-slate-400">
                      {new Date(cust.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {canWrite && (
                          <button
                            onClick={() => handleRunPredict(cust)}
                            className="p-2 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-xl dark:bg-brand-950/20 dark:hover:bg-brand-950/40 dark:text-brand-400 transition-colors"
                            title="Run Risk Prediction"
                          >
                            <BrainCircuit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenView(cust)}
                          className="p-2 bg-slate-100 hover:bg-slate-250 text-slate-500 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                          title="View Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canWrite && (
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="p-2 bg-slate-100 hover:bg-slate-250 text-slate-550 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteCust(cust.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl dark:bg-red-950/10 dark:hover:bg-red-950/20 dark:text-red-400 transition-colors"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center select-none text-xs font-semibold text-slate-500">
            <span>Showing Page {page} of {data.pages} (Total: {data.total} clients)</span>
            
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
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="btn-secondary py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                {showAddModal ? 'Register Customer Profile' : 'Modify Customer Details'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable */}
            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="label-field">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-field">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-field">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-field">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-field">Age (18+)</label>
                  <input
                    type="number"
                    required
                    min="18"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-field">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="select-field"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="label-field">Education</label>
                  <select
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="select-field"
                  >
                    <option value="High School">High School</option>
                    <option value="Bachelor">Bachelor Degree</option>
                    <option value="Master">Master Degree</option>
                    <option value="PhD">PhD Doctorate</option>
                  </select>
                </div>

                <div>
                  <label className="label-field">Marital Status</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="select-field"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>

                <div>
                  <label className="label-field">Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="select-field"
                  >
                    <option value="Salaried">Salaried</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Student">Student</option>
                  </select>
                </div>

                <div>
                  <label className="label-field">Job Experience (Years)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={jobExperience}
                    onChange={(e) => setJobExperience(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-field">Annual Income ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-field">Home Ownership</label>
                  <select
                    value={homeOwnership}
                    onChange={(e) => setHomeOwnership(e.target.value)}
                    className="select-field"
                  >
                    <option value="Rent">Renting</option>
                    <option value="Mortgage">Mortgage</option>
                    <option value="Own">Owned</option>
                  </select>
                </div>

              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800/85 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="btn-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW MODAL --- */}
      {showViewModal && selectedCust && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Customer Profile Credentials</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 space-y-4 text-sm font-semibold">
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450">Customer ID</span>
                <span className="text-slate-800 dark:text-slate-200"># {selectedCust.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450">Full Name</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedCust.first_name} {selectedCust.last_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450">Email Address</span>
                <span className="text-slate-850 dark:text-slate-150">{selectedCust.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450">Phone Number</span>
                <span className="text-slate-850 dark:text-slate-150">{selectedCust.phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450">Age / Gender</span>
                <span className="text-slate-805 dark:text-slate-195">{selectedCust.age} yrs / {selectedCust.gender}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450">Education Tier</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedCust.education}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450">Marital Status</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedCust.marital_status}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450">Employment class</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedCust.employment_type} ({selectedCust.job_experience} yrs exp)</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450">Home Ownership</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedCust.home_ownership}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450">Annual / Monthly Income</span>
                <span className="text-emerald-500">${selectedCust.annual_income?.toLocaleString()} (${selectedCust.monthly_income?.toLocaleString()}/mo)</span>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="btn-secondary py-2"
                >
                  Close Profile
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
