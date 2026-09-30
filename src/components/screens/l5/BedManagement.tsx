import React, { useState, useEffect, useCallback } from 'react';
import {
  Bed,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Building,
  RefreshCw,
  History,
  X,
  Power,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  BedCategory,
  BedInventoryResponse,
  BedSummaryResponse,
  BedTypeEnum,
  BedOccupancyLogResponse,
} from '../../../types';

interface BedManagementProps {
  beds: BedCategory[];
  onUpdateBeds: (beds: BedCategory[]) => void;
}

const KNOWN_PHCS = [
  { id: '150038ee-f99b-42ea-acb8-656fe0335361', name: 'Ormanjhi PHC (Ranchi)' },
  { id: 'a1b912f5-0abb-4bf9-b88c-8dd73234e33b', name: 'Kanke PHC (Ranchi)' },
  { id: 'a34855ee-eb73-40ff-adba-8f4e990a5b86', name: 'Patratu PHC (Ramgarh)' },
  { id: '46ba4355-9b57-45a4-91c1-a1f8de0f78cb', name: 'Gola PHC (Ramgarh)' },
  { id: 'c7fd5081-6dd9-434b-8217-ed4e48f16c2a', name: 'Hingna PHC (Nagpur)' },
  { id: '5682ba02-a5fd-429a-b6e1-f4de6d99c491', name: 'Kamptee PHC (Nagpur)' },
];

const ALL_BED_TYPES: BedTypeEnum[] = ['general', 'icu', 'oxygen', 'maternity', 'pediatric'];

export const BedManagement: React.FC<BedManagementProps> = ({ beds = [], onUpdateBeds }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const initialFacilityId =
    (user?.scope_id && user.scope_id.length > 10 ? user.scope_id : null) ||
    '150038ee-f99b-42ea-acb8-656fe0335361';

  const [activeFacilityId, setActiveFacilityId] = useState<string>(initialFacilityId);
  const [summary, setSummary] = useState<BedSummaryResponse | null>(null);
  const [bedTypesList, setBedTypesList] = useState<BedInventoryResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newBedType, setNewBedType] = useState<BedTypeEnum>('oxygen');
  const [newTotalBeds, setNewTotalBeds] = useState<number>(10);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const [showCapacityModal, setShowCapacityModal] = useState<boolean>(false);
  const [capacityTarget, setCapacityTarget] = useState<BedInventoryResponse | null>(null);
  const [targetNewCapacity, setTargetNewCapacity] = useState<number>(20);
  const [isUpdatingCapacity, setIsUpdatingCapacity] = useState<boolean>(false);

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<BedOccupancyLogResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ===================== FETCH =====================
  const loadBeds = useCallback(async () => {
    setRefreshing(true);
    try {
      const summaryData = await healthChainApi.getFacilityBedSummary(activeFacilityId);
      setSummary(summaryData);
      setBedTypesList(summaryData?.by_type || []);
      setFetchError(null); // clear on success
    } catch (err: unknown) {
      // No fake fallback — surface the error and leave data empty
      const msg = err instanceof Error ? err.message : 'Failed to load bed data';
      setFetchError(msg);
      setSummary(null);
      setBedTypesList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFacilityId]);

  useEffect(() => {
    loadBeds();
  }, [loadBeds]);

  // ===================== OCCUPANCY ADJUST =====================
  const handleAdjustOccupancy = async (bed: BedInventoryResponse, delta: number) => {
    const newCount = Math.max(0, Math.min(bed.total_beds, bed.occupied_beds + delta));
    if (newCount === bed.occupied_beds) return;

    try {
      const updated = await healthChainApi.updateBedOccupancy(activeFacilityId, bed.bed_type, {
        occupied_beds: newCount,
      });
      showToast(
        'success',
        `${bed.bed_type.toUpperCase()} bed occupancy updated to ${updated.occupied_beds}/${updated.total_beds}`
      );
      await loadBeds();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update occupancy';
      showToast('error', msg);
    }
  };

  // ===================== ADD BED TYPE =====================
  const handleAddBedType = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await healthChainApi.addBedType(activeFacilityId, {
        bed_type: newBedType,
        total_beds: Number(newTotalBeds),
      });
      showToast(
        'success',
        `Bed type ${newBedType.toUpperCase()} added with capacity ${newTotalBeds}.`
      );
      setShowAddModal(false);
      await loadBeds();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add bed type';
      showToast('error', msg);
    } finally {
      setIsAdding(false);
    }
  };

  // ===================== UPDATE CAPACITY =====================
  const handleUpdateCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capacityTarget) return;

    setIsUpdatingCapacity(true);
    try {
      await healthChainApi.updateBedOccupancy(activeFacilityId, capacityTarget.bed_type, {
        total_beds: Number(targetNewCapacity),
      });
      showToast(
        'success',
        `Total capacity for ${capacityTarget.bed_type.toUpperCase()} adjusted to ${targetNewCapacity}.`
      );
      setShowCapacityModal(false);
      setCapacityTarget(null);
      await loadBeds();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to adjust capacity';
      showToast('error', msg);
    } finally {
      setIsUpdatingCapacity(false);
    }
  };

  // ===================== TOGGLE ACTIVE =====================
  const handleToggleActive = async (bed: BedInventoryResponse) => {
    try {
      if (bed.is_active) {
        await healthChainApi.deactivateBed(activeFacilityId, bed.bed_type);
        showToast('success', `${bed.bed_type.toUpperCase()} ward has been deactivated.`);
      } else {
        await healthChainApi.activateBed(activeFacilityId, bed.bed_type);
        showToast('success', `${bed.bed_type.toUpperCase()} ward reactivated.`);
      }
      await loadBeds();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle ward status';
      showToast('error', msg);
    }
  };

  // ===================== AUDIT HISTORY =====================
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await healthChainApi.getBedHistory(activeFacilityId, { page_size: 50 });
      setHistoryLogs(res?.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load audit history';
      setHistoryError(msg);
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ===================== DERIVED =====================
  const totalBeds =
    summary?.total_beds ?? bedTypesList.reduce((acc, b) => acc + b.total_beds, 0);
  const totalOccupied =
    summary?.total_occupied ?? bedTypesList.reduce((acc, b) => acc + b.occupied_beds, 0);
  const totalAvailable =
    summary?.total_available ?? Math.max(totalBeds - totalOccupied, 0);
  const overallOccupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  const existingTypes = new Set(bedTypesList.map((b) => b.bed_type));
  const availableTypesToAdd = ALL_BED_TYPES.filter((bt) => !existingTypes.has(bt));

  const hasAnyBedData = bedTypesList.length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="bed-management-screen">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bed className="w-5 h-5 text-blue-400" />
            {t('beds.title')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('beds.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadBeds}
            disabled={refreshing}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {t('action.refresh')}
          </button>
          <button
            type="button"
            onClick={handleOpenHistory}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            {t('beds.audit_history')}
          </button>
          {availableTypesToAdd.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setNewBedType(availableTypesToAdd[0]);
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {t('beds.add_type_btn')}
            </button>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-200"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl border bg-rose-950/80 border-rose-700/60 text-rose-200 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-100">Failed to load bed data</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={loadBeds}
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

      {/* Facility Switcher & Live Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span>Target Facility:</span>
          </div>
          <select
            value={activeFacilityId}
            onChange={(e) => setActiveFacilityId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {KNOWN_PHCS.map((phc) => (
              <option key={phc.id} value={phc.id}>
                {phc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">{t('beds.total_beds')}:</span>
          <div className="text-2xl font-bold text-slate-100 mt-1">{totalBeds} Beds</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {bedTypesList.length} ward categories
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">{t('beds.occupied_beds')}:</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{totalOccupied} Beds</div>
          <div className="text-[11px] text-amber-500 mt-0.5">
            {overallOccupancyRate}% {t('beds.occupancy_rate')}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">{t('beds.available_beds')}:</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{totalAvailable} Beds</div>
          <div className="text-[11px] text-emerald-500 mt-0.5">Available for admissions</div>
        </div>
      </div>

      {/* Bed Type Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
            Loading bed wards from backend...
          </div>
        ) : !hasAnyBedData ? (
          <div className="col-span-2 p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            <Bed className="w-10 h-10 mx-auto mb-2 text-slate-700" />
            <div className="text-sm font-semibold text-slate-300">
              {fetchError ? 'Unable to load bed wards' : 'No bed wards configured'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {fetchError
                ? 'Retry once the backend is reachable.'
                : 'Click "Add Bed Type" above to configure General, Oxygen, or ICU wards.'}
            </div>
          </div>
        ) : (
          bedTypesList.map((bed) => {
            const occupancyRate =
              bed.total_beds > 0
                ? Math.round((bed.occupied_beds / bed.total_beds) * 100)
                : 0;
            const isHighOccupancy = occupancyRate >= 80;

            return (
              <div
                key={bed.id || bed.bed_type}
                className={`bg-slate-900 border rounded-xl p-5 space-y-4 shadow-sm transition-all ${
                  !bed.is_active
                    ? 'opacity-60 border-slate-800'
                    : isHighOccupancy
                    ? 'border-amber-700/60'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                        {bed.bed_type} Ward
                      </h2>
                      {!bed.is_active && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 border border-red-800 text-red-300 font-bold uppercase">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {bed.available_beds} vacant beds ready for admission
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                      isHighOccupancy
                        ? 'bg-red-950/80 border-red-800 text-red-300'
                        : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    }`}
                  >
                    {occupancyRate}% Occupancy
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isHighOccupancy ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Occupied: {bed.occupied_beds}</span>
                    <span>Total Capacity: {bed.total_beds}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={bed.occupied_beds <= 0 || !bed.is_active}
                      onClick={() => handleAdjustOccupancy(bed, -1)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1"
                      title="Discharge patient (-1)"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      Discharge
                    </button>
                    <button
                      type="button"
                      disabled={bed.occupied_beds >= bed.total_beds || !bed.is_active}
                      onClick={() => handleAdjustOccupancy(bed, 1)}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      title="Admit patient (+1)"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Admit
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCapacityTarget(bed);
                        setTargetNewCapacity(bed.total_beds);
                        setShowCapacityModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-slate-700 text-xs"
                      title="Adjust Total Capacity"
                      aria-label="Adjust total capacity"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(bed)}
                      className={`p-1.5 rounded border text-xs ${
                        bed.is_active
                          ? 'text-red-400 border-red-900 hover:bg-red-950/40'
                          : 'text-emerald-400 border-emerald-900 hover:bg-emerald-950/40'
                      }`}
                      title={bed.is_active ? 'Deactivate Ward' : 'Reactivate Ward'}
                      aria-label={bed.is_active ? 'Deactivate ward' : 'Reactivate ward'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Bed Type */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                Add Ward Bed Type (POST /beds/facility)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBedType} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Ward Type *</label>
                <select
                  value={newBedType}
                  onChange={(e) => setNewBedType(e.target.value as BedTypeEnum)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 uppercase"
                >
                  {availableTypesToAdd.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt} Ward
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Total Bed Capacity *
                </label>
                <input
                  type="number"
                  value={newTotalBeds}
                  onChange={(e) => setNewTotalBeds(Number(e.target.value))}
                  min={1}
                  max={1000}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-1.5"
                >
                  {isAdding && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isAdding ? 'Adding...' : 'Add Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Total Capacity */}
      {showCapacityModal && capacityTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                Adjust Capacity for {capacityTarget.bed_type.toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setShowCapacityModal(false)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCapacity} className="space-y-4 text-xs">
              <div className="text-slate-400">
                Currently Occupied:{' '}
                <strong className="text-slate-200">{capacityTarget.occupied_beds}</strong>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  New Total Bed Capacity *
                </label>
                <input
                  type="number"
                  value={targetNewCapacity}
                  onChange={(e) => setTargetNewCapacity(Number(e.target.value))}
                  min={capacityTarget.occupied_beds}
                  max={1000}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCapacityModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCapacity}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-1.5"
                >
                  {isUpdatingCapacity && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Audit Log History */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                Bed Occupancy Audit Logs
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyError && (
              <div
                role="alert"
                className="p-3 bg-rose-950/70 border border-rose-800/60 rounded-lg text-rose-200 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{historyError}</span>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Ward</th>
                    <th className="py-2.5 px-3">Occupied (Prev &rarr; New)</th>
                    <th className="py-2.5 px-3">Total (Prev &rarr; New)</th>
                    <th className="py-2.5 px-3">Operator ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-400" />
                        Loading audit log history...
                      </td>
                    </tr>
                  ) : historyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        {historyError
                          ? 'Unable to load audit history.'
                          : 'No occupancy changes logged yet.'}
                      </td>
                    </tr>
                  ) : (
                    historyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                          {new Date(log.recorded_at).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold uppercase text-slate-200">
                          {log.bed_type}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {log.previous_occupied} &rarr;{' '}
                          <span className="text-amber-400 font-bold">{log.new_occupied}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {log.previous_total} &rarr;{' '}
                          <span className="text-teal-400 font-bold">{log.new_total}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 truncate max-w-[100px]">
                          {log.recorded_by}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedManagement;