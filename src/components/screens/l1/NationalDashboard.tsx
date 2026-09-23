import React, { useState } from 'react';
import {
  Globe,
  TrendingUp,
  AlertTriangle,
  Bed,
  Users,
  ArrowUpRight,
  ArrowLeftRight,
  CheckCircle2,
  Filter,
  Calendar,
  Layers,
  ShieldCheck,
} from 'lucide-react';

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

const STATE_DATA: StateSummary[] = [
  {
    code: 'JH',
    name: 'Jharkhand',
    stockOutRisk: 'MEDIUM',
    riskScore: 38,
    totalFacilities: 1840,
    totalBeds: 12400,
    occupiedBeds: 8900,
    staffAttendanceRate: 88.4,
    activeCriticalAlerts: 3,
    fifteenDayStockDays: 11,
    bufferDaysRemaining: 5,
  },
  {
    code: 'BH',
    name: 'Bihar',
    stockOutRisk: 'HIGH',
    riskScore: 72,
    totalFacilities: 2450,
    totalBeds: 18200,
    occupiedBeds: 15400,
    staffAttendanceRate: 82.1,
    activeCriticalAlerts: 8,
    fifteenDayStockDays: 6,
    bufferDaysRemaining: 2,
  },
  {
    code: 'OR',
    name: 'Odisha',
    stockOutRisk: 'LOW',
    riskScore: 24,
    totalFacilities: 1620,
    totalBeds: 11200,
    occupiedBeds: 7200,
    staffAttendanceRate: 91.5,
    activeCriticalAlerts: 1,
    fifteenDayStockDays: 14,
    bufferDaysRemaining: 9,
  },
  {
    code: 'WB',
    name: 'West Bengal',
    stockOutRisk: 'MEDIUM',
    riskScore: 44,
    totalFacilities: 2180,
    totalBeds: 16500,
    occupiedBeds: 12100,
    staffAttendanceRate: 86.8,
    activeCriticalAlerts: 4,
    fifteenDayStockDays: 10,
    bufferDaysRemaining: 4,
  },
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    stockOutRisk: 'HIGH',
    riskScore: 68,
    totalFacilities: 4900,
    totalBeds: 34000,
    occupiedBeds: 28900,
    staffAttendanceRate: 84.0,
    activeCriticalAlerts: 12,
    fifteenDayStockDays: 7,
    bufferDaysRemaining: 3,
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    stockOutRisk: 'LOW',
    riskScore: 19,
    totalFacilities: 3200,
    totalBeds: 26000,
    occupiedBeds: 17500,
    staffAttendanceRate: 94.2,
    activeCriticalAlerts: 2,
    fifteenDayStockDays: 15,
    bufferDaysRemaining: 12,
  },
];

interface NationalDashboardProps {
  onNavigate: (screen: string) => void;
}

export const NationalDashboard: React.FC<NationalDashboardProps> = ({ onNavigate }) => {
  const [selectedStateCode, setSelectedStateCode] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'15_DAYS' | 'BUFFER_DAYS'>('15_DAYS');

  const filteredStates =
    selectedStateCode === 'ALL'
      ? STATE_DATA
      : STATE_DATA.filter((st) => st.code === selectedStateCode);

  const totalFacilities = filteredStates.reduce((acc, st) => acc + st.totalFacilities, 0);
  const totalBeds = filteredStates.reduce((acc, st) => acc + st.totalBeds, 0);
  const occupiedBeds = filteredStates.reduce((acc, st) => acc + st.occupiedBeds, 0);
  const avgStaff = Math.round(
    filteredStates.reduce((acc, st) => acc + st.staffAttendanceRate, 0) / filteredStates.length
  );
  const totalCriticalAlerts = filteredStates.reduce((acc, st) => acc + st.activeCriticalAlerts, 0);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800">🔴 CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">🔴 HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-950 text-yellow-400 border border-yellow-800">🟡 WARNING</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">🟢 SAFE</span>;
    }
  };

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
              <span className="text-xs text-slate-400">All India Health Supply Chain Command</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2">National Health Logistics Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              State-wise aggregated surveillance, stock-out vulnerability, hospital bed capacity, staff attendance, and inter-state distribution pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('cross_state_redistribution')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Inter-State Transfers
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

      {/* Control Toolbar: State Filter & Time Horizon Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        {/* State Filter Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-semibold text-slate-300">Geographic View Filter:</span>
          <select
            value={selectedStateCode}
            onChange={(e) => setSelectedStateCode(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All India (Aggregated Across States)</option>
            {STATE_DATA.map((st) => (
              <option key={st.code} value={st.code}>
                {st.name} ({st.code})
              </option>
            ))}
          </select>
        </div>

        {/* Time Horizon Toggle (15 Days vs Buffer Days) */}
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

      {/* 3 Combined Metric Cards (Stock + Beds + Staff) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Combined Card 1: Stock Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Essential Medicine Stock Horizon</span>
            <span className="text-blue-400 font-mono font-bold">
              {viewMode === '15_DAYS' ? '15-Day Runway' : 'Buffer Days'}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {viewMode === '15_DAYS' ? '11.4 Days Avg' : '5.2 Buffer Days'}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Critical Deficit States: <strong className="text-red-400">2 States (BH, UP)</strong></span>
            <span>{totalFacilities.toLocaleString()} Facilities</span>
          </div>
        </div>

        {/* Combined Card 2: Bed Capacity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>National Hospital Beds Capacity</span>
            <Bed className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-300">
            {occupiedBeds.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ {totalBeds.toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Occupancy Rate: <strong className="text-blue-400">{Math.round((occupiedBeds / totalBeds) * 100)}%</strong></span>
            <span className="text-emerald-400">{(totalBeds - occupiedBeds).toLocaleString()} Vacant</span>
          </div>
        </div>

        {/* Combined Card 3: Staff Strength */}
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

      {/* State-Wise Table View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              State-Wise Supply & Capacity Breakdown ({filteredStates.length} State{filteredStates.length > 1 ? 's' : ''})
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
                    <span className="font-semibold text-slate-100">{st.occupiedBeds.toLocaleString()}</span> /{' '}
                    {st.totalBeds.toLocaleString()} ({Math.round((st.occupiedBeds / st.totalBeds) * 100)}%)
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
    </div>
  );
};
