import React, { useState, useEffect, useCallback } from 'react';
import {
  Hospital,
  Package,
  Bed,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  RefreshCw,
  AlertCircle,
  X,
  MapPin,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { useAuth } from '../../../context/AuthContext';
import { InventoryItem, BedCategory, StaffMember } from '../../../types';
import { ALL_PHCS } from '../../../data/geoConstants';

interface PhcDashboardProps {
  facilityId?: string;
  inventory?: InventoryItem[];
  beds?: BedCategory[];
  staff?: StaffMember[];
  onNavigate: (screen: string) => void;
}

export const PhcDashboard: React.FC<PhcDashboardProps> = ({
  facilityId,
  inventory,
  beds,
  staff,
  onNavigate,
}) => {
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'15_DAYS' | 'BUFFER_DAYS'>('15_DAYS');

  // Local state used only when parent didn't pass data
  const [localInventory, setLocalInventory] = useState<InventoryItem[]>([]);
  const [localBeds, setLocalBeds] = useState<BedCategory[]>([]);
  const [localStaff, setLocalStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Only fetch when parent passed NO data at all for that specific category
  const needsInventoryFetch = !Array.isArray(inventory);
  const needsBedsFetch = !Array.isArray(beds);
  const needsStaffFetch = !Array.isArray(staff);
  const needsAnyFetch = needsInventoryFetch || needsBedsFetch || needsStaffFetch;

  const safeInventory = Array.isArray(inventory) ? inventory : localInventory;
  const safeBeds = Array.isArray(beds) ? beds : localBeds;
  const safeStaff = Array.isArray(staff) ? staff : localStaff;

  // ===================== RESOLVE PHC FROM geoConstants =====================
  // Priority: explicit facilityId prop → user scope_id → none
  const resolvedPhcId =
    facilityId ||
    (user?.scope_id && user.scope_id.length > 10 ? user.scope_id : null) ||
    null;

  const currentPhc = resolvedPhcId
    ? ALL_PHCS.find((p) => p.id === resolvedPhcId) || null
    : null;

  // If ID was provided but not found in geoConstants, flag it
  const unknownPhcId = resolvedPhcId && !currentPhc ? resolvedPhcId : null;

  const phcName = currentPhc?.name || null;
  const phcCode = currentPhc?.code || null;

  // Names for the geo-labels — pulled from geoConstants when available.
  // (If your PhcGeo type exposes district/state names, they'll appear here.)
  const districtName =
    (currentPhc as any)?.districtName ||
    (currentPhc as any)?.district_name ||
    null;
  const stateName =
    (currentPhc as any)?.stateName ||
    (currentPhc as any)?.state_name ||
    null;

  const locationParts = [phcName, districtName, stateName].filter(Boolean);
  const locationLabel = locationParts.length > 0 ? locationParts.join(', ') : null;

  // ===================== FETCH =====================
  const fetchDashboard = useCallback(async () => {
    if (!needsAnyFetch) return;
    setLoading(true);
    try {
      // TODO: replace with real endpoints when available:
      // const [inv, bd, st] = await Promise.all([
      //   needsInventoryFetch ? healthChainApi.getPhcInventory() : Promise.resolve(inventory),
      //   needsBedsFetch ? healthChainApi.getPhcBeds() : Promise.resolve(beds),
      //   needsStaffFetch ? healthChainApi.getPhcStaff() : Promise.resolve(staff),
      // ]);
      // setLocalInventory(inv ?? []);
      // setLocalBeds(bd ?? []);
      // setLocalStaff(st ?? []);

      // Until the endpoints exist, keep arrays empty (no fake fallback)
      if (needsInventoryFetch) setLocalInventory([]);
      if (needsBedsFetch) setLocalBeds([]);
      if (needsStaffFetch) setLocalStaff([]);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load PHC dashboard';
      if (needsInventoryFetch) setLocalInventory([]);
      if (needsBedsFetch) setLocalBeds([]);
      if (needsStaffFetch) setLocalStaff([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [needsAnyFetch, needsInventoryFetch, needsBedsFetch, needsStaffFetch, inventory, beds, staff]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ===================== DERIVED =====================
  const criticalCount = safeInventory.filter((i) => i.status === 'CRITICAL').length;
  const reorderCount = safeInventory.filter((i) => i.status === 'REORDER').length;
  const adequateCount = safeInventory.filter((i) => i.status === 'ADEQUATE').length;

  const totalBeds = safeBeds.reduce((acc, b) => acc + (b.total || 0), 0);
  const occupiedBeds = safeBeds.reduce((acc, b) => acc + (b.occupied || 0), 0);
  const availableBeds = Math.max(totalBeds - occupiedBeds, 0);
  const bedUtilization =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const presentStaff = safeStaff.filter(
    (s) => s.status === 'PRESENT' || s.status === 'ON_DUTY'
  ).length;

  const hasAnyData =
    safeInventory.length > 0 || safeBeds.length > 0 || safeStaff.length > 0;

  const isLoading = loading && !hasAnyData;

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="phc-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border border-teal-800/40 rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-900/60 text-teal-300 border border-teal-700/50">
                L5 — Primary Health Centre (Own PHC Only)
              </span>
              {locationLabel ? (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {locationLabel}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Facility Overview</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2">
              {phcName ? `${phcName} Dashboard` : 'PHC Facility Dashboard'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time clinical drug inventory, inpatient bed occupancy tracker, daily staff
              attendance roster, and district indent requisitions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDashboard}
              disabled={loading || !needsAnyFetch}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!needsAnyFetch ? 'Data provided by parent' : 'Refresh dashboard'}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('inventory_management')}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Package className="w-4 h-4" />
              Manage Stock
            </button>
          </div>
        </div>
      </div>

      {/* Unknown PHC ID Warning */}
      {unknownPhcId && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            PHC ID <code className="font-mono">{unknownPhcId}</code> not found in the
            geoConstants catalog. Displaying generic dashboard.
          </span>
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
            <div className="font-semibold text-rose-100">Failed to load PHC dashboard</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          {needsAnyFetch && (
            <button
              type="button"
              onClick={fetchDashboard}
              className="text-rose-300 hover:text-rose-100 text-[11px] font-semibold px-2 py-1 rounded border border-rose-700/60 hover:bg-rose-900/40 transition-colors"
            >
              Retry
            </button>
          )}
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

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Hospital className="w-4 h-4 text-teal-400" />
          <span className="font-semibold text-slate-300">Facility:</span>
          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono">
            {phcName
              ? `${phcName}${phcCode ? ` (${phcCode})` : ''}`
              : unknownPhcId
              ? `${unknownPhcId} (unrecognized)`
              : 'PHC Context'}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <Calendar className="w-4 h-4 text-slate-400 ml-1" />
          <span className="text-slate-400 font-medium mr-1">Projection Mode:</span>
          <button
            type="button"
            onClick={() => setViewMode('15_DAYS')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === '15_DAYS'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            15-Day Demand View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('BUFFER_DAYS')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === 'BUFFER_DAYS'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Buffer Days Remaining
          </button>
        </div>
      </div>

      {/* Loading / Empty */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
          Loading PHC dashboard...
        </div>
      ) : !hasAnyData ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Hospital className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-300">
            No PHC data available
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {fetchError
              ? 'Retry once the backend is reachable.'
              : 'Awaiting facility data from the parent screen or API.'}
          </div>
          {needsAnyFetch && !fetchError && (
            <button
              type="button"
              onClick={fetchDashboard}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigate('inventory_management')}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-700 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Drug Inventory Health
                </span>
                <Package className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">
                  {safeInventory.length}
                </span>
                <span className="text-xs text-slate-400">monitored drugs</span>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                  🔴 {criticalCount} Critical
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                  🟡 {reorderCount} Reorder
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  🟢 {adequateCount} Safe
                </span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('bed_management')}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-700 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Inpatient Bed Occupancy
                </span>
                <Bed className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">{occupiedBeds}</span>
                <span className="text-xs text-slate-400">/ {totalBeds} occupied</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-semibold">
                  {availableBeds} beds vacant
                </span>
                <span className="text-slate-400 font-mono">{bedUtilization}% utilized</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('staff_attendance')}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-700 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Staff On Duty</span>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400">{presentStaff}</span>
                <span className="text-xs text-slate-400">
                  / {safeStaff.length} rostered staff
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {safeStaff.length > 0 && presentStaff === safeStaff.length
                  ? 'All rostered staff present'
                  : 'Partial attendance'}
              </div>
            </div>
          </div>

          {/* Critical Stock-Out Banner */}
          {criticalCount > 0 && (
            <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-900/80 text-red-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-200">
                    🔴 Critical Shortage Alert: {criticalCount} medicine
                    {criticalCount > 1 ? 's' : ''} below safety runway
                  </h3>
                  <p className="text-xs text-red-300 mt-0.5">
                    Review the full inventory list and place a district replenishment request.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('stock_request')}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Order from District
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('redistribution_requests')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Inbound Peer Pull
                </button>
              </div>
            </div>
          )}

          {/* Snapshots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Package className="w-4 h-4 text-teal-400" />
                  Clinical Drug Stock Status
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('inventory_management')}
                  className="text-xs text-teal-400 hover:text-teal-300 font-medium"
                >
                  Full Inventory &rarr;
                </button>
              </div>

              {safeInventory.length === 0 ? (
                <div className="p-6 bg-slate-950 rounded-lg border border-slate-800 text-center text-xs text-slate-500">
                  No inventory records for this facility.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {safeInventory.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{item.name}</div>
                        <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                          Batch: {item.batchNumber} • Exp: {item.expiryDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-100">
                          {item.currentStock}{' '}
                          <span className="text-[11px] font-normal text-slate-400">
                            {item.unit}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {viewMode === '15_DAYS'
                            ? `${item.daysOfSupply ?? 0} Days Supply`
                            : `Buffer: ${Math.max(0, (item.daysOfSupply ?? 0) - 2)} Days`}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 ${
                            item.status === 'CRITICAL'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : item.status === 'REORDER'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {item.status === 'CRITICAL'
                            ? '🔴 Critical'
                            : item.status === 'REORDER'
                            ? '🟡 Reorder'
                            : '🟢 Adequate'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-blue-400" />
                  Inpatient Bed Utilization
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('bed_management')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Update Occupancy &rarr;
                </button>
              </div>

              {safeBeds.length === 0 ? (
                <div className="p-6 bg-slate-950 rounded-lg border border-slate-800 text-center text-xs text-slate-500">
                  No bed categories registered for this facility.
                </div>
              ) : (
                <div className="space-y-3">
                  {safeBeds.map((b) => {
                    const util = b.total > 0 ? b.occupied / b.total : 0;
                    return (
                      <div
                        key={b.id}
                        className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5"
                      >
                        <div className="flex justify-between font-medium text-slate-200">
                          <span>{b.name}</span>
                          <span className="font-mono text-slate-300">
                            {b.occupied} / {b.total} (
                            {Math.max(b.total - b.occupied, 0)} vacant)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              util > 0.85
                                ? 'bg-red-500'
                                : util > 0.6
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${util * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PhcDashboard;