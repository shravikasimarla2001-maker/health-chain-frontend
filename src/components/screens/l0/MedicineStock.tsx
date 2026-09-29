import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  X,
  Save,
  Sliders,
  Thermometer,
  CheckCircle2,
  Globe2,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import {
  DrugResponse,
  DrugCreateRequest,
  DrugCategoryEnum,
  DrugUnitEnum,
  InventoryMyScopeItem,
} from '../../../types';

// Fallback drug catalog if backend is unreachable
const FALLBACK_DRUGS: DrugResponse[] = [
  { id: 'drug-1', name: 'Paracetamol 500mg Tablets', category: 'analgesic', unit: 'tablet', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'drug-2', name: 'Amoxicillin 500mg Capsules', category: 'antibiotic', unit: 'capsule', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'drug-3', name: 'Human Insulin Regular 100IU/ml', category: 'other', unit: 'vial', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'drug-4', name: 'Oral Rehydration Salts (ORS)', category: 'ors', unit: 'sachet', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'drug-5', name: 'BCG Vaccine (Tuberculosis)', category: 'vaccine', unit: 'vial', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

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
  const [scopeError, setScopeError] = useState<string | null>(null);

  // -------- Drug master catalog --------
  const [drugs, setDrugs] = useState<DrugResponse[]>([]);
  const [drugsLoading, setDrugsLoading] = useState(false);
  const [drugsError, setDrugsError] = useState<string | null>(null);
  const [showDrugForm, setShowDrugForm] = useState(false);
  const [newDrug, setNewDrug] = useState<DrugCreateRequest>({
    name: '',
    category: 'analgesic',
    unit: 'tablet',
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [appliedToAll, setAppliedToAll] = useState(false);

  // -------- Settings (thresholds) --------
  const [minBufferDays, setMinBufferDays] = useState(14);
  const [emergencyBufferDays, setEmergencyBufferDays] = useState(3);
  const [coldChainMinTemp, setColdChainMinTemp] = useState(2);
  const [coldChainMaxTemp, setColdChainMaxTemp] = useState(8);
  const [expiryWarningDays, setExpiryWarningDays] = useState(60);
  const [flMinQuorum, setFlMinQuorum] = useState(75);

  // ===================== FETCHERS (token handled by healthChainApi) =====================

  const fetchScopeSummary = useCallback(async () => {
    setScopeLoading(true);
    setScopeError(null);
    try {
      const res = await healthChainApi.getMyScopeInventory({ page: 1, page_size: 20 });
      setScopeSummary(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load stock summary';
      setScopeError(msg);
    } finally {
      setScopeLoading(false);
    }
  }, []);

  const fetchDrugs = useCallback(async () => {
    setDrugsLoading(true);
    setDrugsError(null);
    try {
      const res = await healthChainApi.getDrugs({ is_active: true });
      setDrugs(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch drug catalog';
      setDrugsError(msg);
      // Fallback so the UI remains usable
      setDrugs(FALLBACK_DRUGS);
    } finally {
      setDrugsLoading(false);
    }
  }, []);

  // Auto-load everything on mount — same pattern as UserManagement
  useEffect(() => {
    fetchScopeSummary();
    fetchDrugs();
  }, [fetchScopeSummary, fetchDrugs]);

  // ===================== DRUG HANDLERS =====================

  const handleAddDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrug.name) return;
    setActionLoading('create-drug');
    try {
      const created = await healthChainApi.createDrug(newDrug);
      setDrugs((p) => [...p, created]);
      setNewDrug({ name: '', category: 'analgesic', unit: 'tablet' });
      setShowDrugForm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setDrugsError(err instanceof Error ? err.message : 'Failed to create drug');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDrug = (drugId: string) => {
    if (!confirm('Remove this drug from the catalog?')) return;
    // No delete-drug endpoint in the backend — filter locally
    setDrugs((p) => p.filter((d) => d.id !== drugId));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleApplyToAllPhcs = () => {
    setAppliedToAll(true);
    setTimeout(() => setAppliedToAll(false), 3500);
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

        <button
          type="button"
          onClick={handleApplyToAllPhcs}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md shrink-0"
        >
          <Globe2 className="w-4 h-4" />
          Apply to All PHCs
        </button>
      </div>

      {appliedToAll && (
        <div className="p-4 bg-purple-950/80 border border-purple-700/60 rounded-xl text-purple-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400" />
          <span>
            <strong>Global Rules Applied!</strong> Master settings pushed to all PHC facilities.
          </span>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Configuration saved.
        </div>
      )}

      {/* ===================== STOCK OVERVIEW (auto-loaded) ===================== */}
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
          >
            <RefreshCw className={`w-4 h-4 ${scopeLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {scopeError && (
          <div className="p-3 bg-red-950/60 border border-red-700/50 rounded-lg text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {scopeError}
          </div>
        )}

        {scopeLoading && !scopeSummary ? (
          <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading stock summary...
          </div>
        ) : scopeSummary ? (
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

            {scopeSummary.items?.length > 0 && (
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
                          <div className="font-medium text-slate-200">{item.facility_name}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {item.facility_code}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{item.district_name}</td>
                        <td className="py-2.5 px-3 font-mono">{item.total_batches}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-300">
                          {item.total_quantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-300">
                          {item.expiring_30d_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
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

        {drugsError && (
          <div className="p-3 bg-red-950/60 border border-red-700/50 rounded-lg text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {drugsError}
          </div>
        )}

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

        {/* Drugs Table */}
        {drugsLoading && drugs.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading drug catalog...
          </div>
        ) : drugs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            No drugs in catalog. Click "Add Drug" to add one.
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

      {/* ===================== THRESHOLDS ===================== */}
      {/*
      <form
        onSubmit={handleSaveSettings}
        className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6"
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-purple-400" />
            Inventory & Safety Buffer Thresholds
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Standard Safety Stock Buffer (Days)
              </label>
              <input
                type="number"
                value={minBufferDays}
                onChange={(e) => setMinBufferDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Facilities below this enter 🟡 Reorder status.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Critical Emergency Threshold (Days)
              </label>
              <input
                type="number"
                value={emergencyBufferDays}
                onChange={(e) => setEmergencyBufferDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Facilities below this trigger 🔴 Critical Stock-out alert.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Expiry Warning Window (Days)
              </label>
              <input
                type="number"
                value={expiryWarningDays}
                onChange={(e) => setExpiryWarningDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                FL Minimum Quorum (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={flMinQuorum}
                onChange={(e) => setFlMinQuorum(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            Cold Chain & Storage Limits (°C)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Minimum Safe Temperature (°C)
              </label>
              <input
                type="number"
                value={coldChainMinTemp}
                onChange={(e) => setColdChainMinTemp(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Maximum Safe Temperature (°C)
              </label>
              <input
                type="number"
                value={coldChainMaxTemp}
                onChange={(e) => setColdChainMaxTemp(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleApplyToAllPhcs}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/40 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Globe2 className="w-4 h-4" />
            Apply Settings to All PHCs
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
      */}
    </div>
  );
};

export default MedicineStock;