import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Check,
  X,
  RefreshCw,
  Phone,
  Shield,
  AlertCircle,
  Copy,
  Building,
  Building2,
  MapPin,
  Stethoscope,
  Globe,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { UserResponse, UserCreateRequest, ScopeLevelEnum } from '../../../types';
import { SEED_ACCOUNTS } from '../../../data/seedAccounts';
import { useLanguage } from '../../../context/LanguageContext';
import {
  ALL_STATES,
  ALL_DISTRICTS,
  ALL_PHCS,
  getDistrictsForState,
  getPhcsForDistrict,
  resolveGeoLocation,
  BACKEND_STATE_IDS,
  BACKEND_DISTRICT_IDS,
  BACKEND_PHC_IDS,
} from '../../../data/geoConstants';

export const UserManagement: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resetModalData, setResetModalData] = useState<{ email: string; newPassword?: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Form State for UserCreate
  const [formFullName, setFormFullName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('Test@123');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formScopeLevel, setFormScopeLevel] = useState<ScopeLevelEnum>('phc');
  const [formRoleName, setFormRoleName] = useState<string>('PHC Operator');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Geographic Cascading State for Creation Modal
  const [selectedStateId, setSelectedStateId] = useState<string>(BACKEND_STATE_IDS.JHARKHAND);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(BACKEND_DISTRICT_IDS.RANCHI);
  const [selectedPhcId, setSelectedPhcId] = useState<string>(BACKEND_PHC_IDS.ORMANJHI);

  // Synchronize Geographic selections when state or district changes
  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    const districts = getDistrictsForState(stateId);
    if (districts.length > 0) {
      const firstDistrict = districts[0];
      setSelectedDistrictId(firstDistrict.id);
      const phcs = getPhcsForDistrict(firstDistrict.id);
      if (phcs.length > 0) {
        setSelectedPhcId(phcs[0].id);
      }
    }
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    const phcs = getPhcsForDistrict(districtId);
    if (phcs.length > 0) {
      setSelectedPhcId(phcs[0].id);
    }
  };

  // Synchronize Scope Level and assigned default roles
  const handleScopeLevelChange = (level: ScopeLevelEnum) => {
    setFormScopeLevel(level);
    switch (level) {
      case 'platform':
        setFormRoleName('Super Admin');
        break;
      case 'national':
        setFormRoleName('National Viewer');
        break;
      case 'state':
        setFormRoleName('State Approver');
        break;
      case 'district':
        setFormRoleName('District Approver');
        break;
      case 'phc':
      default:
        setFormRoleName('PHC Operator');
        break;
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await healthChainApi.getUsers({
        page_size: 100,
        search: search.trim() || undefined,
        scope_level: scopeFilter !== 'ALL' ? scopeFilter : undefined,
      });
      if (res && res.items) {
        setUsers(res.items);
      }
    } catch (err: unknown) {
      console.warn('API error fetching users, using fallback seed accounts:', err);
      // Fallback to seed accounts
      const fallback: UserResponse[] = SEED_ACCOUNTS.map((acc, idx) => ({
        id: `seed-usr-${idx + 1}`,
        email: acc.email,
        full_name: acc.name,
        is_active: true,
        scope_level: acc.scope.toLowerCase() as any,
        scope_id: acc.scope === 'PHC' ? BACKEND_PHC_IDS.ORMANJHI : null,
        roles: [{ id: `r-${idx}`, name: acc.role, description: acc.description }],
        permissions: acc.permissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone: '+91 98765 43210',
        must_change_password: false,
      }));
      setUsers(fallback);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, scopeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: UserResponse) => {
    try {
      if (user.is_active) {
        await healthChainApi.deactivateUser(user.id);
        showNotification('success', `User account ${user.email} has been deactivated.`);
      } else {
        await healthChainApi.activateUser(user.id);
        showNotification('success', `User account ${user.email} has been reactivated.`);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user status';
      showNotification('error', msg);
    }
  };

  const handleResetPassword = async (user: UserResponse) => {
    try {
      const res = await healthChainApi.resetUserPassword(user.id);
      setResetModalData({
        email: user.email,
        newPassword: res.new_password || 'Test@123',
      });
      showNotification('success', `Password successfully reset for ${user.email}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed';
      showNotification('error', msg);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName || !formEmail || !formPassword) return;

    // Determine final scope_id based on scope_level
    let calculatedScopeId: string | null = null;
    if (formScopeLevel === 'state') {
      calculatedScopeId = selectedStateId;
    } else if (formScopeLevel === 'district') {
      calculatedScopeId = selectedDistrictId;
    } else if (formScopeLevel === 'phc') {
      calculatedScopeId = selectedPhcId;
    }

    setIsSubmitting(true);
    try {
      const payload: UserCreateRequest = {
        email: formEmail.trim().toLowerCase(),
        full_name: formFullName.trim(),
        password: formPassword,
        phone: formPhone.trim() || null,
        is_active: formIsActive,
        scope_level: formScopeLevel,
        scope_id: calculatedScopeId,
        role_names: [formRoleName],
      };

      const created = await healthChainApi.createUser(payload);
      showNotification('success', `User ${created.full_name} (${created.email}) created successfully.`);
      setShowAddModal(false);
      // Reset text inputs
      setFormFullName('');
      setFormEmail('');
      setFormPassword('Test@123');
      setFormPhone('');
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      showNotification('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (resetModalData?.newPassword) {
      navigator.clipboard.writeText(resetModalData.newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filtered district and PHC lists for the creation modal
  const districtsForSelectedState = getDistrictsForState(selectedStateId);
  const phcsForSelectedDistrict = getPhcsForDistrict(selectedDistrictId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="user-management-screen">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            {t('users.title')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('users.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={refreshing}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {t('action.refresh')}
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            {t('users.create_btn')}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Scope Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          {['ALL', 'PLATFORM', 'NATIONAL', 'STATE', 'DISTRICT', 'PHC'].map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setScopeFilter(scope)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                scopeFilter === scope
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {scope === 'ALL' ? 'All Scopes' : scope}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User & Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Scope Level</th>
                <th className="py-3 px-4">Assigned Jurisdiction / Facility</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                    Loading user accounts from API...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No users found matching current filter.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleName =
                    user.roles?.[0]?.name ||
                    (typeof user.roles?.[0] === 'string' ? user.roles[0] : 'User');
                  const geo = resolveGeoLocation(user.scope_id);

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          {user.full_name}
                          {user.must_change_password && (
                            <span className="px-1.5 py-0.2 bg-amber-950 border border-amber-800 text-amber-300 rounded text-[10px]">
                              Pass Reset Req
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono">{user.email}</div>
                        {user.phone && (
                          <div className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-purple-950/60 border border-purple-800 text-purple-300">
                          <Shield className="w-3 h-3 text-purple-400" />
                          {roleName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="uppercase text-[11px] font-bold tracking-wide text-slate-300 font-mono">
                          {user.scope_level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-medium text-teal-300 text-xs flex items-center gap-1">
                            {user.scope_level === 'state' && <Building2 className="w-3 h-3" />}
                            {user.scope_level === 'district' && <MapPin className="w-3 h-3" />}
                            {user.scope_level === 'phc' && <Stethoscope className="w-3 h-3" />}
                            {geo.name}
                          </div>
                          {geo.details && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {geo.details}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            user.is_active
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                              : 'bg-red-950/60 text-red-400 border-red-800'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleResetPassword(user)}
                            title="Reset User Password"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                              user.is_active
                                ? 'bg-red-950/40 border-red-900/60 text-red-400 hover:bg-red-900/60'
                                : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400 hover:bg-emerald-900/60'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Result Modal */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                Password Reset Successfully
              </h3>
              <button
                type="button"
                onClick={() => setResetModalData(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              The backend generated a new temporary password for <strong>{resetModalData.email}</strong>:
            </p>
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-700 rounded-lg">
              <code className="text-sm font-mono text-emerald-400 font-bold">{resetModalData.newPassword}</code>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="text-[11px] text-slate-500">
              The user will be required to change their password upon their next login session.
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setResetModalData(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                Create New Role & User Account
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="e.g. Dr. Anita Sharma"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                    required
                    minLength={2}
                    maxLength={150}
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Official HSC Email *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. anita.sharma@hsc.gov.in"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Initial Password * (min 8 chars)</label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Scope Level *</label>
                  <select
                    value={formScopeLevel}
                    onChange={(e) => handleScopeLevelChange(e.target.value as ScopeLevelEnum)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
                  >
                    <option value="platform">platform (L0 Platform Admin)</option>
                    <option value="national">national (L1 National Governance)</option>
                    <option value="state">state (L2 State Health Department)</option>
                    <option value="district">district (L3 District Health Society)</option>
                    <option value="phc">phc (L5 Primary Health Centre)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Assigned Role *</label>
                  <select
                    value={formRoleName}
                    onChange={(e) => setFormRoleName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
                  >
                    {formScopeLevel === 'platform' && <option value="Super Admin">Super Admin</option>}
                    {formScopeLevel === 'national' && <option value="National Viewer">National Viewer</option>}
                    {formScopeLevel === 'state' && <option value="State Approver">State Approver</option>}
                    {formScopeLevel === 'district' && <option value="District Approver">District Approver</option>}
                    {formScopeLevel === 'phc' && (
                      <>
                        <option value="PHC Operator">PHC Operator</option>
                        <option value="PHC Approver">PHC Approver (MO)</option>
                      </>
                    )}
                    {/* Fallback all roles */}
                    <option value="Super Admin">Super Admin (L0)</option>
                    <option value="National Viewer">National Viewer (L1)</option>
                    <option value="State Approver">State Approver (L2)</option>
                    <option value="District Approver">District Approver (L3)</option>
                    <option value="PHC Approver">PHC Approver (MO)</option>
                    <option value="PHC Operator">PHC Operator</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC JURISDICTION / SCOPE DROPDOWNS BASED ON GEO CONSTANTS */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-400" />
                  <span>Geographic Jurisdiction Configuration:</span>
                </div>

                {/* Scope: State */}
                {formScopeLevel === 'state' && (
                  <div>
                    <label className="block font-medium text-slate-400 mb-1">Select State *</label>
                    <select
                      value={selectedStateId}
                      onChange={(e) => setSelectedStateId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                      required
                    >
                      {ALL_STATES.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name} ({state.code}) — {state.region} Region ({state.districts.length} districts)
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      User will govern all districts and healthcare facilities in {ALL_STATES.find(s => s.id === selectedStateId)?.name || 'the state'}.
                    </span>
                  </div>
                )}

                {/* Scope: District */}
                {formScopeLevel === 'district' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Filter by State</label>
                      <select
                        value={selectedStateId}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500 text-xs"
                      >
                        {ALL_STATES.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name} ({state.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Select District *</label>
                      <select
                        value={selectedDistrictId}
                        onChange={(e) => setSelectedDistrictId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                        required
                      >
                        {districtsForSelectedState.map((dist) => (
                          <option key={dist.id} value={dist.id}>
                            {dist.name} District ({dist.code}) — {dist.phcs.length} PHCs
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Assigned jurisdiction: {districtsForSelectedState.find(d => d.id === selectedDistrictId)?.name || 'District'} District.
                      </span>
                    </div>
                  </div>
                )}

                {/* Scope: PHC */}
                {formScopeLevel === 'phc' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-medium text-slate-400 mb-1">State</label>
                        <select
                          value={selectedStateId}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500 text-xs"
                        >
                          {ALL_STATES.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-medium text-slate-400 mb-1">District</label>
                        <select
                          value={selectedDistrictId}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500 text-xs"
                        >
                          {districtsForSelectedState.map((dist) => (
                            <option key={dist.id} value={dist.id}>
                              {dist.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-400 mb-1">
                        Select Primary Health Centre (PHC) *
                      </label>
                      <select
                        value={selectedPhcId}
                        onChange={(e) => setSelectedPhcId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                        required
                      >
                        {phcsForSelectedDistrict.map((phc) => (
                          <option key={phc.id} value={phc.id}>
                            {phc.name} ({phc.code}) — {phc.bedCapacity || 20} Beds ({phc.facilityType || 'PHC'})
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-teal-400 mt-1 block">
                        Assigned facility: {phcsForSelectedDistrict.find(p => p.id === selectedPhcId)?.name || 'PHC'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Scope: Platform / National */}
                {(formScopeLevel === 'platform' || formScopeLevel === 'national') && (
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-200">Pan-India National Jurisdiction</span>
                      <p className="text-[11px] text-slate-500">
                        This role has full access across all 28 states, 8 UTs, and affiliated health centres.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-0"
                />
                <label htmlFor="formIsActive" className="text-slate-300 select-none">
                  Activate account immediately upon creation
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  {isSubmitting ? 'Provisioning...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
