import React, { useState, useEffect, useCallback } from 'react';
import {
  Building,
  Bed,
  Users,
  Filter,
  Calendar,
  RefreshCw,
  AlertCircle,
  X,
  MapPin,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { ALL_PHCS, resolveUserDistrict, getPhcsForDistrict } from '../../../data/geoConstants';
import { useAuth } from '../../../context/AuthContext';

interface PhcOverview {
  id: string;
  name: string;
  medicalOfficer: string;
  stockStatus: 'CRITICAL' | 'REORDER' | 'ADEQUATE';
  totalBeds: number;
  occupiedBeds: number;
  staffPresentCount: number;
  totalStaffCount: number;
  pendingIndents: number;
  fifteenDayStockDays: number;
  bufferDaysRemaining: number;
}

interface DistrictDashboardProps {
  onNavigate: (screen: string) => void;
}

export const DistrictDashboard: React.FC<DistrictDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const districtGeo = resolveUserDistrict(user);
  const districtPhcs = getPhcsForDistrict(districtGeo.id);

  const [selectedPhcId, setSelectedPhcId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'15_DAYS' | 'BUFFER_DAYS'>('15_DAYS');

  // ===================== DATA STATE =====================
  const [phcs, setPhcs] = useState<PhcOverview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ===================== FETCH =====================
  const fetchPhcs = useCallback(async () => {
    setRefreshing(true);
    setFetchError(null);
    try {
      const phcPromises = districtPhcs.map(async (geo) => {
        let totalBeds = 0;
        let occupiedBeds = 0;
        let stockStatus: 'CRITICAL' | 'REORDER' | 'ADEQUATE' = 'ADEQUATE';
        let fifteenDayStockDays = 0;
        let bufferDaysRemaining = 0;

        try {
          const bedSummary = await healthChainApi.getFacilityBedSummary(geo.id);
          if (bedSummary) {
            totalBeds = bedSummary.total_beds || 0;
            occupiedBeds = bedSummary.total_occupied || 0;
          }
        } catch {
          // No live beds found for this facility
        }

        try {
          const forecast = await healthChainApi.getFacilityForecast(geo.id, 7);
          if (forecast?.items && forecast.items.length > 0) {
            const hasCrit = forecast.items.some((i) => i.risk_level?.toUpperCase() === 'CRITICAL');
            const hasReorder = forecast.items.some((i) => i.risk_level?.toUpperCase() === 'REORDER');
            if (hasCrit) stockStatus = 'CRITICAL';
            else if (hasReorder) stockStatus = 'REORDER';

            const bufferItem = forecast.items.find((i) => i.buffer_days_remaining !== undefined);
            if (bufferItem && bufferItem.buffer_days_remaining !== undefined) {
              bufferDaysRemaining = Math.round(bufferItem.buffer_days_remaining);
              fifteenDayStockDays = bufferDaysRemaining + 7;
            }
          }
        } catch {
          // No live forecast found for this facility
        }

        return {
          id: geo.id,
          name: `${geo.name} (${geo.code})`,
          medicalOfficer: '—',
          stockStatus,
          totalBeds,
          occupiedBeds,
          staffPresentCount: 0,
          totalStaffCount: 0,
          pendingIndents: 0,
          fifteenDayStockDays,
          bufferDaysRemaining,
        };
      });

      const metrics = await Promise.all(phcPromises);
      setPhcs(metrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load district dashboard';
      setPhcs([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [districtPhcs]);

  useEffect(() => {
    fetchPhcs();
  }, [fetchPhcs]);

  // ===================== FILTERING =====================
  // Only show PHCs that belong under this specific District from geoConstants
  const availablePhcs = phcs.filter((p) =>
    districtPhcs.some(
      (geo) =>
        geo.id === p.id ||
        geo.code.toUpperCase() === p.id?.toUpperCase() ||
        geo.name.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(geo.name.toLowerCase())
    )
  );

  const filteredPhcs =
    selectedPhcId === 'ALL'
      ? availablePhcs
      : availablePhcs.filter((p) => p.id === selectedPhcId);

  // ===================== AGGREGATES =====================
  const totalBeds = filteredPhcs.reduce((acc, p) => acc + (p.totalBeds || 0), 0);
  const occupiedBeds = filteredPhcs.reduce((acc, p) => acc + (p.occupiedBeds || 0), 0);
  const totalStaffPresent = filteredPhcs.reduce(
    (acc, p) => acc + (p.staffPresentCount || 0),
    0
  );
  const totalStaff = filteredPhcs.reduce((acc, p) => acc + (p.totalStaffCount || 0), 0);
  const pendingIndentsCount = filteredPhcs.reduce(
    (acc, p) => acc + (p.pendingIndents || 0),
    0
  );

  const occupancyRate =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const staffAttendanceRate =
    totalStaff > 0 ? Math.round((totalStaffPresent / totalStaff) * 100) : 0;

  const avgFifteenDay =
    filteredPhcs.length > 0
      ? (
          filteredPhcs.reduce((acc, p) => acc + (p.fifteenDayStockDays || 0), 0) /
          filteredPhcs.length
        ).toFixed(1)
      : '0.0';
  const avgBufferDays =
    filteredPhcs.length > 0
      ? (
          filteredPhcs.reduce((acc, p) => acc + (p.bufferDaysRemaining || 0), 0) /
          filteredPhcs.length
        ).toFixed(1)
      : '0.0';

  // Worst-stock PHC (for the "Critical Shortage" callout)
  const worstPhc = filteredPhcs
    .slice()
    .sort((a, b) => {
      const rank = { CRITICAL: 0, REORDER: 1, ADEQUATE: 2 };
      return rank[a.stockStatus] - rank[b.stockStatus];
    })[0];

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800">
            🔴 CRITICAL
          </span>
        );
      case 'REORDER':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
            🟡 REORDER
          </span>
        );
      case 'ADEQUATE':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            🟢 SAFE
          </span>
        );
    }
  };

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="district-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-800/40 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/60 text-amber-300 border border-amber-700/50">
                L3 — {districtGeo.name} District User
              </span>
              <span className="text-xs text-slate-400">
                {districtGeo.name} District Operations &bull; State: {districtGeo.stateName} &bull; Code: {districtGeo.code}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2">
              {districtGeo.name} District Healthcare Operations
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              PHC-wise aggregated monitoring, hospital bed availability, PHC indent approvals,
              and local stock redistribution across {districtPhcs.length} facilities under {districtGeo.name} District.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPhcs}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh dashboard"
            aria-label="Refresh district dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Fetch Error Banner */}
      {fetchError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl border bg-rose-950/80 border-rose-700/60 text-rose-200 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-100">
              Failed to load district dashboard
            </div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={fetchPhcs}
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

      {/* Loading / Empty states */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
          Loading district dashboard...
        </div>
      ) : filteredPhcs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Building className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-300">
            No PHC data available for {districtGeo.name} District
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {fetchError
              ? 'Retry once the backend is reachable.'
              : `No reported PHC facility records under ${districtGeo.name} District (${districtGeo.stateName}).`}
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-slate-300">Select PHC Facility View:</span>
              <select
                value={selectedPhcId}
                onChange={(e) => setSelectedPhcId(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All PHCs ({districtGeo.name} District - {districtPhcs.length} Facilities)</option>
                {districtPhcs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <Calendar className="w-4 h-4 text-slate-400 ml-1" />
              <span className="text-slate-400 font-medium mr-1">Time Horizon:</span>
              <button
                type="button"
                onClick={() => setViewMode('15_DAYS')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  viewMode === '15_DAYS'
                    ? 'bg-amber-600 text-white shadow-sm'
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
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Buffer Days Remaining
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>District Stock Runway</span>
                <span className="text-amber-400 font-mono font-bold">
                  {viewMode === '15_DAYS' ? '15-Day Runway' : 'Buffer Threshold'}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-100">
                {viewMode === '15_DAYS'
                  ? `${avgFifteenDay} Days Avg`
                  : `${avgBufferDays} Buffer Days`}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Worst Stock:{' '}
                  <strong className="text-red-400">
                    {worstPhc ? worstPhc.name : '—'}
                  </strong>
                </span>
                <span>{filteredPhcs.length} PHC Facilities</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>District Bed Occupancy</span>
                <Bed className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {occupiedBeds}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {totalBeds} occupied
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Occupancy Rate: <strong className="text-amber-400">{occupancyRate}%</strong>
                </span>
                <span className="text-emerald-400">
                  {Math.max(totalBeds - occupiedBeds, 0)} Vacant
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>District Staff Duty Roster</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {totalStaffPresent}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {totalStaff} on duty
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Attendance Rate:{' '}
                  <strong className="text-emerald-400">{staffAttendanceRate}%</strong>
                </span>
                <span className="text-emerald-400 font-medium">Active Monitoring</span>
              </div>
            </div>
          </div>

          {/* PHC Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                PHC Facilities Summary ({filteredPhcs.length} Facilit
                {filteredPhcs.length === 1 ? 'y' : 'ies'})
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('phc_management')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                Manage All PHCs &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">PHC Facility</th>
                    <th className="py-3 px-4">Medical Officer In-Charge</th>
                    <th className="py-3 px-4">Stock Health</th>
                    <th className="py-3 px-4">
                      {viewMode === '15_DAYS' ? '15-Day Stock Runway' : 'Safety Buffer Days'}
                    </th>
                    <th className="py-3 px-4">Bed Occupancy</th>
                    <th className="py-3 px-4">Duty Attendance</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPhcs.map((phc) => {
                    const occRate =
                      phc.totalBeds > 0
                        ? Math.round((phc.occupiedBeds / phc.totalBeds) * 100)
                        : 0;
                    return (
                      <tr key={phc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-100">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {phc.name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {phc.medicalOfficer || '—'}
                        </td>
                        <td className="py-3.5 px-4">{getStockBadge(phc.stockStatus)}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          {viewMode === '15_DAYS'
                            ? `${phc.fifteenDayStockDays} Days Stock Left`
                            : `${phc.bufferDaysRemaining} Days Buffer Left`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-100">
                            {phc.occupiedBeds}
                          </span>{' '}
                          / {phc.totalBeds} beds ({occRate}%)
                        </td>
                        <td className="py-3.5 px-4 font-medium text-emerald-400">
                          {phc.staffPresentCount} / {phc.totalStaffCount} Present
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {phc.pendingIndents > 0 ? (
                            <button
                              type="button"
                              onClick={() => onNavigate('indent_approvals')}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors"
                            >
                              Review Indent ({phc.pendingIndents})
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs">
                              No pending indents
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DistrictDashboard;