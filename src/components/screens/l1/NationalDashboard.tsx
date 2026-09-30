import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  AlertTriangle,
  Bed,
  Users,
  Filter,
  Calendar,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { ALL_STATES } from '../../../data/geoConstants';

interface StateSummary {
  code: string;
  name: string;
  stockOutRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  totalFacilities: number;
  totalBeds: number;
  occupiedBeds: number;
  staffAttendanceRate: number;
  activeCriticalAlerts: number;
  fifteenDayStockDays: number;
  bufferDaysRemaining: number;
}

interface NationalDashboardProps {
  onNavigate: (screen: string) => void;
}

export const NationalDashboard: React.FC<NationalDashboardProps> = ({ onNavigate }) => {
  const [selectedStateCode, setSelectedStateCode] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'15_DAYS' | 'BUFFER_DAYS'>('15_DAYS');

  // ===================== DATA STATE =====================
  const [stateData, setStateData] = useState<StateSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ===================== FETCH =====================
  const fetchNationalSummary = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: replace with real endpoint when available:
      // const res = await healthChainApi.getNationalDashboardSummary();
      // setStateData(res.states ?? []);
      setStateData([]);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load national dashboard';
      setStateData([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNationalSummary();
  }, [fetchNationalSummary]);

  // ===================== FILTERING =====================
  // Show only states that exist in geoConstants (as the original did)
  const availableStates = stateData.filter((st) =>
    ALL_STATES.some((s) => s.code.toUpperCase() === st.code.toUpperCase())
  );

  const filteredStates =
    selectedStateCode === 'ALL'
      ? availableStates
      : availableStates.filter((st) => st.code === selectedStateCode);

  // ===================== AGGREGATES =====================
  const totalFacilities = filteredStates.reduce((acc, st) => acc + (st.totalFacilities || 0), 0);
  const totalBeds = filteredStates.reduce((acc, st) => acc + (st.totalBeds || 0), 0);
  const occupiedBeds = filteredStates.reduce((acc, st) => acc + (st.occupiedBeds || 0), 0);
  const avgStaff =
    filteredStates.length > 0
      ? Math.round(
          filteredStates.reduce((acc, st) => acc + (st.staffAttendanceRate || 0), 0) /
            filteredStates.length
        )
      : 0;
  const totalCriticalAlerts = filteredStates.reduce(
    (acc, st) => acc + (st.activeCriticalAlerts || 0),
    0
  );
  const avgFifteenDay =
    filteredStates.length > 0
      ? (
          filteredStates.reduce((acc, st) => acc + (st.fifteenDayStockDays || 0), 0) /
          filteredStates.length
        ).toFixed(1)
      : '0.0';
  const avgBufferDays =
    filteredStates.length > 0
      ? (
          filteredStates.reduce((acc, st) => acc + (st.bufferDaysRemaining || 0), 0) /
          filteredStates.length
        ).toFixed(1)
      : '0.0';

  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

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
            🔴 HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-950 text-yellow-400 border border-yellow-800">
            🟡 WARNING
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
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="national-dashboard">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border border-blue-800/40 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                L1 — National User
              </span>
              <span className="text-xs text-slate-400">
                All India Health Supply Chain Command
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2">
              National Health Logistics Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              State-wise aggregated surveillance, stock-out vulnerability, hospital bed capacity,
              staff attendance, and inter-state distribution pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchNationalSummary}
              disabled={refreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('national_alerts')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              National Inbox ({totalCriticalAlerts})
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
            <div className="font-semibold text-rose-100">Failed to load national dashboard</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={fetchNationalSummary}
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

      {/* Loading state */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          Loading national surveillance data...
        </div>
      ) : filteredStates.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Globe className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-300">
            No national data available
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {fetchError
              ? 'Retry once the backend is reachable.'
              : 'No state reports have been received yet.'}
          </div>
        </div>
      ) : (
        <>
          {/* Control Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-semibold text-slate-300">Geographic View Filter:</span>
              <select
                value={selectedStateCode}
                onChange={(e) => setSelectedStateCode(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All States (Available in System)</option>
                {availableStates.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <Calendar className="w-4 h-4 text-slate-400 ml-1" />
              <span className="text-slate-400 font-medium mr-1">Projection Horizon:</span>
              <button
                type="button"
                onClick={() => setViewMode('15_DAYS')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  viewMode === '15_DAYS'
                    ? 'bg-blue-600 text-white shadow-sm'
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

          {/* 3 Combined Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Essential Medicine Stock Horizon</span>
                <span className="text-blue-400 font-mono font-bold">
                  {viewMode === '15_DAYS' ? '15-Day Runway' : 'Buffer Days'}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-100">
                {viewMode === '15_DAYS'
                  ? `${avgFifteenDay} Days Avg`
                  : `${avgBufferDays} Buffer Days`}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Critical States:{' '}
                  <strong className="text-red-400">
                    {filteredStates.filter((s) => s.stockOutRisk === 'CRITICAL').length} States
                  </strong>
                </span>
                <span>{totalFacilities.toLocaleString()} Facilities</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>National Hospital Beds Capacity</span>
                <Bed className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-300">
                {occupiedBeds.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {totalBeds.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Occupancy Rate: <strong className="text-blue-400">{occupancyRate}%</strong>
                </span>
                <span className="text-emerald-400">
                  {Math.max(totalBeds - occupiedBeds, 0).toLocaleString()} Vacant
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Medical Staff Duty Attendance</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{avgStaff}%</div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Doctors / Nurses / ANM</span>
                <span className="text-emerald-400 font-medium">Active Monitoring</span>
              </div>
            </div>
          </div>

          {/* State-Wise Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  State-Wise Supply & Capacity Breakdown ({filteredStates.length} State
                  {filteredStates.length > 1 ? 's' : ''})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {viewMode === '15_DAYS'
                    ? 'Displaying estimated 15-day stock run-out days per state'
                    : 'Displaying safety buffer threshold days remaining'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4">Stock Status Indicator</th>
                    <th className="py-3 px-4">
                      {viewMode === '15_DAYS' ? '15-Day Stock Runway' : 'Safety Buffer Days'}
                    </th>
                    <th className="py-3 px-4">Beds (Occupied / Total)</th>
                    <th className="py-3 px-4">Staff Attendance</th>
                    <th className="py-3 px-4 text-right">Critical Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStates.map((st) => (
                    <tr key={st.code} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-slate-800 text-[11px] font-mono flex items-center justify-center text-slate-300">
                          {st.code}
                        </span>
                        {st.name}
                      </td>
                      <td className="py-3.5 px-4">{getRiskBadge(st.stockOutRisk)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {viewMode === '15_DAYS'
                          ? `${st.fifteenDayStockDays} Days Stock Left`
                          : `${st.bufferDaysRemaining} Days Buffer Left`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-semibold text-slate-100">
                          {st.occupiedBeds.toLocaleString()}
                        </span>{' '}
                        / {st.totalBeds.toLocaleString()} (
                        {st.totalBeds > 0
                          ? Math.round((st.occupiedBeds / st.totalBeds) * 100)
                          : 0}
                        %)
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-medium">
                        {st.staffAttendanceRate}%
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            st.activeCriticalAlerts > 5
                              ? 'text-red-400 bg-red-950/80 border border-red-800'
                              : 'text-slate-300 bg-slate-800'
                          }`}
                        >
                          {st.activeCriticalAlerts} Alerts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};