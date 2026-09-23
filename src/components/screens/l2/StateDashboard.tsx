import React, { useState } from 'react';
import {
  MapPin,
  AlertTriangle,
  Bed,
  ArrowLeftRight,
  TrendingUp,
  Users,
  CheckCircle2,
  Filter,
  Calendar,
  Layers,
} from 'lucide-react';

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

const JHARKHAND_DISTRICTS: DistrictMetric[] = [
  {
    code: 'RAN',
    name: 'Ranchi District',
    facilitiesCount: 42,
    stockOutRisk: 'MEDIUM',
    bedOccupancyPercent: 78,
    totalBeds: 2400,
    occupiedBeds: 1872,
    staffAttendanceRate: 89.2,
    criticalShortages: ['Paracetamol 500mg', 'Insulin Regular'],
    fifteenDayStockDays: 10,
    bufferDaysRemaining: 4,
    lastDataSync: '3 mins ago',
  },
  {
    code: 'BOK',
    name: 'Bokaro District',
    facilitiesCount: 28,
    stockOutRisk: 'HIGH',
    bedOccupancyPercent: 84,
    totalBeds: 1600,
    occupiedBeds: 1344,
    staffAttendanceRate: 83.5,
    criticalShortages: ['Anti-Rabies Vaccine', 'ORS Sachets'],
    fifteenDayStockDays: 5,
    bufferDaysRemaining: 2,
    lastDataSync: '5 mins ago',
  },
  {
    code: 'RAM',
    name: 'Ramgarh District',
    facilitiesCount: 22,
    stockOutRisk: 'LOW',
    bedOccupancyPercent: 62,
    totalBeds: 950,
    occupiedBeds: 589,
    staffAttendanceRate: 92.1,
    criticalShortages: ['None'],
    fifteenDayStockDays: 14,
    bufferDaysRemaining: 8,
    lastDataSync: '12 mins ago',
  },
  {
    code: 'DHN',
    name: 'Dhanbad District',
    facilitiesCount: 36,
    stockOutRisk: 'LOW',
    bedOccupancyPercent: 71,
    totalBeds: 2100,
    occupiedBeds: 1491,
    staffAttendanceRate: 88.0,
    criticalShortages: ['Oxygen Cylinders (Low Buffer)'],
    fifteenDayStockDays: 12,
    bufferDaysRemaining: 6,
    lastDataSync: '8 mins ago',
  },
];

interface StateDashboardProps {
  onNavigate: (screen: string) => void;
}

export const StateDashboard: React.FC<StateDashboardProps> = ({ onNavigate }) => {
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'15_DAYS' | 'BUFFER_DAYS'>('15_DAYS');

  const filteredDistricts =
    selectedDistrictCode === 'ALL'
      ? JHARKHAND_DISTRICTS
      : JHARKHAND_DISTRICTS.filter((d) => d.code === selectedDistrictCode);

  const totalFacilities = filteredDistricts.reduce((acc, d) => acc + d.facilitiesCount, 0);
  const totalBeds = filteredDistricts.reduce((acc, d) => acc + d.totalBeds, 0);
  const occupiedBeds = filteredDistricts.reduce((acc, d) => acc + d.occupiedBeds, 0);
  const avgStaff = Math.round(
    filteredDistricts.reduce((acc, d) => acc + d.staffAttendanceRate, 0) / filteredDistricts.length
  );

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800">🔴 CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">🔴 HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-950 text-yellow-400 border border-yellow-800">🟡 MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">🟢 SAFE</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="state-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                L2 — State User
              </span>
              <span className="text-xs text-slate-400">Jharkhand State Health Operations</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2">Jharkhand State Supply Chain Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              District-wise aggregated medicine buffer inventory, intra-state redistribution queues, bed occupancy trackers, and FL model contributions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('state_redistribution')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Intra-State Transfers
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

      {/* Toolbar: District Filter & Time Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-slate-300">Select District View:</span>
          <select
            value={selectedDistrictCode}
            onChange={(e) => setSelectedDistrictCode(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Districts (Jharkhand Aggregated)</option>
            {JHARKHAND_DISTRICTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name} ({d.code})
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

      {/* Combined Metric Cards (Stock + Beds + Staff) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Essential Drug Stock Status</span>
            <span className="text-emerald-400 font-mono font-bold">
              {viewMode === '15_DAYS' ? '15-Day Projection' : 'Buffer Threshold'}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {viewMode === '15_DAYS' ? '10.2 Days Avg' : '5.0 Buffer Days'}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Critical Shortage: <strong className="text-amber-400">Bokaro District</strong></span>
            <span>{totalFacilities} PHCs Monitored</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>State Hospital Bed Occupancy</span>
            <Bed className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {occupiedBeds.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ {totalBeds.toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Occupancy Rate: <strong className="text-emerald-400">{Math.round((occupiedBeds / totalBeds) * 100)}%</strong></span>
            <span className="text-slate-300">{(totalBeds - occupiedBeds).toLocaleString()} Vacant</span>
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
            <span className="text-emerald-400 font-medium">88%+ Operational</span>
          </div>
        </div>
      </div>

      {/* District-wise Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          District-Wise Inventory & Bed Capacity Breakdown ({filteredDistricts.length} District{filteredDistricts.length > 1 ? 's' : ''})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Stock-out Risk</th>
                <th className="py-3 px-4">
                  {viewMode === '15_DAYS' ? '15-Day Stock Runway' : 'Safety Buffer Days'}
                </th>
                <th className="py-3 px-4">Beds (Occupied / Total)</th>
                <th className="py-3 px-4">Staff Attendance</th>
                <th className="py-3 px-4">Active Critical Shortages</th>
                <th className="py-3 px-4 text-right">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredDistricts.map((dist) => (
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
                    <span className="font-semibold text-slate-100">{dist.occupiedBeds.toLocaleString()}</span> /{' '}
                    {dist.totalBeds.toLocaleString()} ({Math.round((dist.occupiedBeds / dist.totalBeds) * 100)}%)
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400 font-medium">
                    {dist.staffAttendanceRate}%
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {dist.criticalShortages.map((item, idx) => (
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
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400 font-mono">{dist.lastDataSync}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
