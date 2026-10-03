import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  AlertTriangle,
  Bed,
  Users,
  Filter,
  Calendar,
  RefreshCw,
  AlertCircle,
  X,
  Building2,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { ALL_DISTRICTS, resolveUserState, getDistrictsForState } from '../../../data/geoConstants';
import { useAuth } from '../../../context/AuthContext';

interface DistrictMetric {
  code: string;
  name: string;
  facilitiesCount: number;
  stockOutRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  bedOccupancyPercent: number;
  totalBeds: number;
  occupiedBeds: number;
  staffAttendanceRate: number;
  criticalShortages: string[];
  fifteenDayStockDays: number;
  bufferDaysRemaining: number;
  lastDataSync: string;
}

interface StateDashboardProps {
  onNavigate: (screen: string) => void;
}

export const StateDashboard: React.FC<StateDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const stateGeo = resolveUserState(user);
  const stateDistricts = getDistrictsForState(stateGeo.id);

  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'15_DAYS' | 'BUFFER_DAYS'>('15_DAYS');

  // ===================== DATA STATE =====================
  const [districts, setDistricts] = useState<DistrictMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ===================== FETCH =====================
  const fetchDistricts = useCallback(async () => {
    setRefreshing(true);
    setFetchError(null);
    try {
      // Build district metrics from geoConstants for this state
      const districtPromises = stateDistricts.map(async (dist) => {
        let totalBeds = 0;
        let occupiedBeds = 0;

        // Fetch live bed summaries for PHCs under this district in parallel
        const bedResults = await Promise.allSettled(
          dist.phcs.map((phc) => healthChainApi.getFacilityBedSummary(phc.id))
        );

        for (const res of bedResults) {
          if (res.status === 'fulfilled' && res.value) {
            totalBeds += res.value.total_beds || 0;
            occupiedBeds += res.value.total_occupied || 0;
          }
        }

        return {
          code: dist.code,
          name: `${dist.name} District`,
          facilitiesCount: dist.phcs.length,
          stockOutRisk: 'LOW' as const,
          bedOccupancyPercent: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
          totalBeds,
          occupiedBeds,
          staffAttendanceRate: 0,
          criticalShortages: [],
          fifteenDayStockDays: 0,
          bufferDaysRemaining: 0,
          lastDataSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      });

      const metrics = await Promise.all(districtPromises);
      setDistricts(metrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load state dashboard';
      setDistricts([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [stateDistricts]);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  // ===================== FILTERING =====================
  // Only show districts belonging to this State from geoConstants
  const availableDistricts = districts.filter((d) =>
    stateDistricts.some((geo) => geo.code.toUpperCase() === d.code.toUpperCase())
  );

  const filteredDistricts =
    selectedDistrictCode === 'ALL'
      ? availableDistricts
      : availableDistricts.filter((d) => d.code === selectedDistrictCode);

  // ===================== AGGREGATES =====================
  const totalFacilities = filteredDistricts.reduce(
    (acc, d) => acc + (d.facilitiesCount || 0),
    0
  );
  const totalBeds = filteredDistricts.reduce((acc, d) => acc + (d.totalBeds || 0), 0);
  const occupiedBeds = filteredDistricts.reduce((acc, d) => acc + (d.occupiedBeds || 0), 0);
  const avgStaff =
    filteredDistricts.length > 0
      ? Math.round(
          filteredDistricts.reduce((acc, d) => acc + (d.staffAttendanceRate || 0), 0) /
            filteredDistricts.length
        )
      : 0;
  const avgFifteenDay =
    filteredDistricts.length > 0
      ? (
          filteredDistricts.reduce((acc, d) => acc + (d.fifteenDayStockDays || 0), 0) /
          filteredDistricts.length
        ).toFixed(1)
      : '0.0';
  const avgBufferDays =
    filteredDistricts.length > 0
      ? (
          filteredDistricts.reduce((acc, d) => acc + (d.bufferDaysRemaining || 0), 0) /
          filteredDistricts.length
        ).toFixed(1)
      : '0.0';

  const occupancyRate =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Find the district with highest risk for the "critical shortage" callout
  const worstDistrict = filteredDistricts
    .slice()
    .sort((a, b) => {
      const rank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return rank[a.stockOutRisk] - rank[b.stockOutRisk];
    })[0];

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800">
            🔴 CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
            🔴 HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-950 text-yellow-400 border border-yellow-800">
            🟡 MEDIUM
          </span>
        );
      case 'LOW':
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
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="state-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                L2 — {stateGeo.name} State User
              </span>
              <span className="text-xs text-slate-400">
                {stateGeo.name} State Operations ({stateGeo.code}) &bull; Region: {stateGeo.region}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2">
              {stateGeo.name} Supply Chain Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              District-wise aggregated medicine buffer inventory, intra-state redistribution
              queues, bed occupancy trackers, and FL model contributions across {stateDistricts.length} districts in {stateGeo.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchDistricts}
              disabled={refreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('state_alerts')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              State Alerts
            </button>
          </div>
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
              Failed to load state dashboard
            </div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={fetchDistricts}
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
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          Loading state dashboard...
        </div>
      ) : filteredDistricts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-300">
            No district data available for {stateGeo.name}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {fetchError
              ? 'Retry once the backend is reachable.'
              : `No reported district records under ${stateGeo.name} State.`}
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-slate-300">Select District View:</span>
              <select
                value={selectedDistrictCode}
                onChange={(e) => setSelectedDistrictCode(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Districts ({stateGeo.name} - {stateDistricts.length} Districts)</option>
                {stateDistricts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} District ({d.code})
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
                    ? 'bg-emerald-600 text-white shadow-sm'
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

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Essential Drug Stock Status</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {viewMode === '15_DAYS' ? '15-Day Projection' : 'Buffer Threshold'}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-100">
                {viewMode === '15_DAYS'
                  ? `${avgFifteenDay} Days Avg`
                  : `${avgBufferDays} Buffer Days`}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Worst District:{' '}
                  <strong className="text-amber-400">
                    {worstDistrict ? worstDistrict.name : '—'}
                  </strong>
                </span>
                <span>{totalFacilities} PHCs Monitored</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>State Hospital Bed Occupancy</span>
                <Bed className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {occupiedBeds.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {totalBeds.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Occupancy Rate:{' '}
                  <strong className="text-emerald-400">{occupancyRate}%</strong>
                </span>
                <span className="text-slate-300">
                  {Math.max(totalBeds - occupiedBeds, 0).toLocaleString()} Vacant
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Staff Duty Attendance</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{avgStaff}%</div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Primary Health Care Staff</span>
                <span className="text-emerald-400 font-medium">
                  {avgStaff >= 88 ? '88%+ Operational' : 'Below target'}
                </span>
              </div>
            </div>
          </div>

          {/* District-wise Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              District-Wise Inventory & Bed Capacity Breakdown ({filteredDistricts.length}{' '}
              District{filteredDistricts.length > 1 ? 's' : ''})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Stock-out Risk</th>
                    <th className="py-3 px-4">
                      {viewMode === '15_DAYS'
                        ? '15-Day Stock Runway'
                        : 'Safety Buffer Days'}
                    </th>
                    <th className="py-3 px-4">Beds (Occupied / Total)</th>
                    <th className="py-3 px-4">Staff Attendance</th>
                    <th className="py-3 px-4">Active Critical Shortages</th>
                    <th className="py-3 px-4 text-right">Last Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredDistricts.map((dist) => {
                    const occRate =
                      dist.totalBeds > 0
                        ? Math.round((dist.occupiedBeds / dist.totalBeds) * 100)
                        : 0;
                    return (
                      <tr key={dist.code} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-800 text-[11px] font-mono flex items-center justify-center text-slate-300">
                            {dist.code}
                          </span>
                          {dist.name}
                        </td>
                        <td className="py-3.5 px-4">{getRiskBadge(dist.stockOutRisk)}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          {viewMode === '15_DAYS'
                            ? `${dist.fifteenDayStockDays} Days Stock Left`
                            : `${dist.bufferDaysRemaining} Days Buffer Left`}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="font-semibold text-slate-100">
                            {dist.occupiedBeds.toLocaleString()}
                          </span>{' '}
                          / {dist.totalBeds.toLocaleString()} ({occRate}%)
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-medium">
                          {dist.staffAttendanceRate}%
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(dist.criticalShortages || []).map((item, idx) => (
                              <span
                                key={idx}
                                className={`px-1.5 py-0.5 rounded text-[11px] ${
                                  item === 'None'
                                    ? 'text-slate-500'
                                    : 'bg-red-950/80 text-red-300 border border-red-800'
                                }`}
                              >
                                {item}
                              </span>
                            ))}
                            {(dist.criticalShortages || []).length === 0 && (
                              <span className="text-slate-500 text-[11px]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                          {dist.lastDataSync || '—'}
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