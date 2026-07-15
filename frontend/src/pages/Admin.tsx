import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  UserPlus, 
  Trash2, 
  Edit, 
  History, 
  Key, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeletons';

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Analyst');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useToast();
  const { user: currentAuthUser } = useAuth();

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to load employee list.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await api.getAuditLogs(50);
      setLogs(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to retrieve system audit logs.', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const handleOpenAdd = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('Analyst');
    setError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (u: any) => {
    setSelectedUser(u);
    setUsername(u.username);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setIsActive(u.is_active);
    setError(null);
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('All fields are required.');
      return;
    }
    setError(null);

    try {
      const payload = { username, email, password, role };
      await api.createUser(payload);
      addToast(`Employee profile created for ${username}.`, 'success');
      setShowAddModal(false);
      fetchUsers();
      fetchLogs(); // refresh audit logs
    } catch (err: any) {
      setError(err.message || 'Failed to create user account.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload: any = { email, role, is_active: isActive };
      if (password) {
        payload.password = password; // Only update if set
      }
      await api.updateUser(selectedUser.id, payload);
      addToast(`Employee profile updated: ${username}.`, 'success');
      setShowEditModal(false);
      fetchUsers();
      fetchLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to update user details.');
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (u.username === currentAuthUser?.username) {
      addToast('Cannot delete your own administrator account.', 'warning');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user ${u.username}?`)) return;

    try {
      await api.deleteUser(u.id);
      addToast(`User account ${u.username} deleted.`, 'success');
      fetchUsers();
      fetchLogs();
    } catch (err: any) {
      addToast(err.message || 'Delete user failed.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white flex items-center gap-2">
            Administrator Controls
            <ShieldAlert className="w-6 h-6 text-brand-650" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage system operators, assign access privileges, and inspect the operational audit trail.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary text-xs flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          New User Account
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* User Account Registry Table (Left Column) */}
        <div className="xl:col-span-7 space-y-4">
          <h3 className="font-bold text-slate-850 dark:text-white">Operator Registry</h3>
          
          {loadingUsers ? (
            <TableSkeleton rows={4} />
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200/50 text-slate-500 uppercase font-semibold select-none dark:bg-slate-900/40 dark:border-slate-800">
                      <th className="px-6 py-4">Username / Email</th>
                      <th className="px-6 py-4">Role Privileges</th>
                      <th className="px-6 py-4">Account Status</th>
                      <th className="px-6 py-4 text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-850 dark:text-white">{u.username}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 border border-brand-100 dark:bg-brand-950/20 dark:text-brand-400 dark:border-brand-900/30">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-550 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                              title="Update Account"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={u.username === currentAuthUser?.username}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl dark:bg-red-950/10 dark:hover:bg-red-950/20 dark:text-red-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Audit Log Trail (Right Column) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Security Audit Trail
            </h3>
            <button
              onClick={fetchLogs}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 px-2.5 py-1 rounded-md text-slate-500 dark:text-slate-350 transition-colors font-semibold"
            >
              Refresh Audit
            </button>
          </div>

          {loadingLogs ? (
            <TableSkeleton rows={6} />
          ) : (
            <div className="glass-card p-5 max-h-[500px] overflow-y-auto space-y-4 divide-y divide-slate-100 dark:divide-slate-800/80">
              {logs.map((log, idx) => (
                <div key={log.id} className={`pt-3 ${idx === 0 ? 'pt-0 border-none' : ''}`}>
                  <div className="flex justify-between items-start text-[10px] font-semibold text-slate-400">
                    <span>{log.user?.username} ({log.user?.role})</span>
                    <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250 mt-1">{log.action}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{log.details}</p>
                  <span className="block text-[9px] text-slate-400/80 mt-1 italic font-semibold">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-center text-slate-400 italic py-6 text-xs">No audit events generated.</p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* --- ADD USER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-850 dark:text-white">Create Employee Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs font-semibold">
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="label-field">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                <label className="label-field">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-field">Access Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="select-field"
                >
                  <option value="Admin">Administrator</option>
                  <option value="Manager">Manager</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary py-2">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-850 dark:text-white">Modify Employee Credentials</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs font-semibold">
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="label-field">Username (locked)</label>
                <input
                  type="text"
                  disabled
                  value={username}
                  className="input-field bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-70"
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
                <label className="label-field">Change Password (optional)</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    placeholder="Leave empty to keep existing password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="label-field">Access Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={selectedUser?.username === currentAuthUser?.username}
                  className="select-field disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="Admin">Administrator</option>
                  <option value="Manager">Manager</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              {selectedUser?.username !== currentAuthUser?.username && (
                <div className="flex items-center gap-2.5 py-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-brand-600 border-slate-300 focus:ring-brand-500 focus:ring-offset-0 focus:ring-0"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-350 select-none cursor-pointer">
                    Account Active (Allow Portal Access)
                  </label>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary py-2">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2">
                  Save Changes
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
