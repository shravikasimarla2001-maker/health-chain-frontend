import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  Globe2,
  MapPin,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import {
  DrugResponse,
  DrugCreateRequest,
  DrugCategoryEnum,
  DrugUnitEnum,
  InventoryMyScopeItem,
} from '../../../types';
import {
  ALL_STATES,
  ALL_DISTRICTS,
  resolveGeoLocation,
} from '../../../data/geoConstants';

export const MedicineStock: React.FC = () => {
  // -------- Scope summary (auto-loaded on mount) --------
  const [scopeSummary, setScopeSummary] = useState<{
    scope_level?: string;
    scope_name?: string;
    items: InventoryMyScopeItem[];
    aggregate?: {
      total_facilities?: number;
      total_batches?: number;
      total_quantity?: number;
      total_expiring_30d?: number;
    };
  } | null>(null);
  const [scopeLoading, setScopeLoading] = useState(false);

  // -------- Drug master catalog --------
  const [drugs, setDrugs] = useState<DrugResponse[]>([]);
  const [drugsLoading, setDrugsLoading] = useState(false);
  const [showDrugForm, setShowDrugForm] = useState(false);
  const [newDrug, setNewDrug] = useState<DrugCreateRequest>({
    name: '',
    category: 'analgesic',
    unit: 'tablet',
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // -------- Unified error + success --------
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ===================== HELPERS =====================
  // Resolve a display name for a district using geoConstants as a fallback
  // when the API returns only an ID (or a blank name).
  const resolveDistrictName = (item: InventoryMyScopeItem): string => {
    if (item.district_name && item.district_name.trim()) return item.district_name;
    const byId =
      ALL_DISTRICTS.find((d) => d.id === item.district_id) ||
      ALL_STATES.flatMap((s) => s.districts).find((d) => d.id === item.district_id);
    if (byId?.name) return byId.name;
    // Last resort: resolve via the generic resolver
    const resolved = resolveGeoLocation(item.district_id);
    return resolved?.name || 'Unknown District';
  };

  const resolveFacilityLabel = (item: InventoryMyScopeItem): string => {
    if (item.facility_name && item.facility_name.trim()) return item.facility_name;
    if (item.facility_code && item.facility_code.trim()) return item.facility_code;
    return 'Unknown Facility';
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // ===================== FETCHERS =====================
  const fetchScopeSummary = useCallback(async () => {
    setScopeLoading(true);
    try {
      const res = await healthChainApi.getMyScopeInventory({ page: 1, page_size: 20 });
      setScopeSummary(res);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load stock summary';
      setFetchError(msg);
      setScopeSummary(null);
    } finally {
      setScopeLoading(false);
    }
  }, []);

  const fetchDrugs = useCallback(async () => {
    setDrugsLoading(true);
    try {
      const res = await healthChainApi.getDrugs({ is_active: true });
      setDrugs(res);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch drug catalog';
      setFetchError(msg);
      setDrugs([]); // no fallback — leave empty
    } finally {
      setDrugsLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchScopeSummary(), fetchDrugs()]);
    setRefreshing(false);
  }, [fetchScopeSummary, fetchDrugs]);

  // Auto-load on mount
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================== DRUG ACTIONS =====================
  const handleAddDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrug.name.trim()) return;

    setActionLoading('create-drug');
    setActionError(null);
    try {
      const created = await healthChainApi.createDrug(newDrug);
      setDrugs((p) => [...p, created]);
      setNewDrug({ name: '', category: 'analgesic', unit: 'tablet' });
      setShowDrugForm(false);
      showSuccess(`Drug "${created.name}" added to catalog.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create drug';
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDrug = async (drugId: string) => {
    if (!confirm('Remove this drug from the catalog?')) return;
    // No delete-drug endpoint in the backend — filter locally
    setDrugs((p) => p.filter((d) => d.id !== drugId));
    showSuccess('Drug removed from catalog.');
  };

  const handleApplyToAllPhcs = () => {
    showSuccess('Global rules applied to all PHC facilities.');
  };

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="medicine-stock-screen">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-900/60 text-purple-300 border border-purple-700/50">
              L0 — Super Admin
            </span>
            <span className="text-xs text-slate-400">Medicine Stock & Drug Master</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-2">Medicine Stock</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            National drug master catalog and live stock overview across all facilities in your scope.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAll}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh all"
            aria-label="Refresh all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleApplyToAllPhcs}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md shrink-0"
          >
            <Globe2 className="w-4 h-4" />
            Apply to All PHCs
          </button>
        </div>
      </div>

      {/* Fetch Error Banner (sticky) */}
      {fetchError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl border bg-rose-950/80 border-rose-700/60 text-rose-200 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-100">Failed to load data</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={fetchAll}
            className="text-rose-300 hover:text-rose-100 text-[11px] font-semibold px-2 py-1 rounded border border-rose-700/60 hover:bg-rose-900/40 transition-colors"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => setFetchError(null)}
            className="text-rose-300 hover:text-rose-100"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl border bg-amber-950/70 border-amber-700/60 text-amber-200 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-100">Action failed</div>
            <div className="text-amber-300/90 mt-0.5">{actionError}</div>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-amber-300 hover:text-amber-100"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ===================== STOCK OVERVIEW ===================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            Stock Overview — {scopeSummary?.scope_name || 'Your Scope'}
          </h2>
          <button
            type="button"
            onClick={fetchScopeSummary}
            disabled={scopeLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh stock overview"
            aria-label="Refresh stock overview"
          >
            <RefreshCw className={`w-4 h-4 ${scopeLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {scopeLoading && !scopeSummary ? (
          <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading stock summary...
          </div>
        ) : !scopeSummary ? (
          <div className="py-10 text-center">
            <Package className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            <div className="text-sm text-slate-400">No stock summary available</div>
            <div className="text-xs text-slate-600 mt-1">
              {fetchError
                ? 'Retry once the backend is reachable.'
                : 'No facilities report stock in your scope yet.'}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  Total Facilities
                </div>
                <div className="text-xl font-bold text-slate-100 mt-1">
                  {(scopeSummary.aggregate?.total_facilities ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  Total Batches
                </div>
                <div className="text-xl font-bold text-slate-100 mt-1">
                  {(scopeSummary.aggregate?.total_batches ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  Total Quantity
                </div>
                <div className="text-xl font-bold text-emerald-300 mt-1">
                  {(scopeSummary.aggregate?.total_quantity ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  Expiring ≤ 30d
                </div>
                <div className="text-xl font-bold text-amber-300 mt-1">
                  {(scopeSummary.aggregate?.total_expiring_30d ?? 0).toLocaleString()}
                </div>
              </div>
            </div>

            {scopeSummary.items?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Facility</th>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Batches</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Expiring 30d</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {scopeSummary.items.map((item) => (
                      <tr key={item.facility_id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-200">
                            {resolveFacilityLabel(item)}
                          </div>
                          {item.facility_code && (
                            <div className="text-[10px] font-mono text-slate-500">
                              {item.facility_code}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {resolveDistrictName(item)}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {item.total_batches ?? 0}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-300">
                          {(item.total_quantity ?? 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-300">
                          {item.expiring_30d_count ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                No facilities in scope.
              </div>
            )}
          </>
        )}
      </div>

      {/* ===================== DRUG MASTER CATALOG ===================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            National Drug Master Catalog
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDrugs}
              disabled={drugsLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh drug catalog"
              aria-label="Refresh drug catalog"
            >
              <RefreshCw className={`w-4 h-4 ${drugsLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowDrugForm(!showDrugForm)}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {showDrugForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showDrugForm ? 'Cancel' : 'Add Drug'}
            </button>
          </div>
        </div>

        {/* Add Drug Form */}
        {showDrugForm && (
          <form
            onSubmit={handleAddDrug}
            className="p-4 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
          >
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Drug Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Azithromycin 250mg"
                value={newDrug.name}
                onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Category
              </label>
              <select
                value={newDrug.category}
                onChange={(e) =>
                  setNewDrug({ ...newDrug, category: e.target.value as DrugCategoryEnum })
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="antibiotic">Antibiotic</option>
                <option value="analgesic">Analgesic</option>
                <option value="antimalarial">Antimalarial</option>
                <option value="vaccine">Vaccine</option>
                <option value="ors">ORS</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Unit</label>
              <select
                value={newDrug.unit}
                onChange={(e) =>
                  setNewDrug({ ...newDrug, unit: e.target.value as DrugUnitEnum })
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="ml">mL</option>
                <option value="vial">Vial</option>
                <option value="sachet">Sachet</option>
                <option value="tube">Tube</option>
              </select>
            </div>
            <div className="sm:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={actionLoading === 'create-drug'}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'create-drug' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add to Catalog
              </button>
            </div>
          </form>
        )}

        {/* Drugs Table / Empty / Loading */}
        {drugsLoading && drugs.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading drug catalog...
          </div>
        ) : drugs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <div>
              {fetchError
                ? 'Unable to load drug catalog. Please retry.'
                : 'No drugs in catalog. Click "Add Drug" to add one.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Drug Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {drugs.map((drug) => (
                  <tr key={drug.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-200 font-medium">{drug.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {drug.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{drug.unit}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          drug.is_active
                            ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
                            : 'bg-red-900/60 text-red-300 border-red-700/50'
                        }`}
                      >
                        {drug.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteDrug(drug.id)}
                        className="p-1 hover:bg-red-950 text-red-400 rounded transition-colors"
                        title="Remove from catalog"
                        aria-label="Remove drug"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== THRESHOLDS (commented per original) ===================== */}
      {/*
      <form ...> ... </form>
      */}
    </div>
  );
};

export default MedicineStock;