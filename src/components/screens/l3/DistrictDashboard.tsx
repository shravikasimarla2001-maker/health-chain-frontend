import React, { useState } from 'react';
import {
  Building,
  AlertTriangle,
  Bed,
  ArrowRightLeft,
  Users,
  FileCheck,
  CheckCircle2,
  TrendingUp,
  Filter,
  Calendar,
} from 'lucide-react';

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

const RANCHI_PHCS: PhcOverview[] = [
  {
    id: 'phc-ori',
    name: 'Ormanjhi PHC',
    medicalOfficer: 'Dr. Rameshwar Mahto',
    stockStatus: 'CRITICAL',
    totalBeds: 38,
    occupiedBeds: 26,
    staffPresentCount: 5,
    totalStaffCount: 6,
    pendingIndents: 1,
    fifteenDayStockDays: 4,
    bufferDaysRemaining: 1,
  },
  {
    id: 'phc-kan',
    name: 'Kanke PHC',
    medicalOfficer: 'Dr. S. Kispotta',
    stockStatus: 'ADEQUATE',
    totalBeds: 45,
    occupiedBeds: 29,
    staffPresentCount: 8,
    totalStaffCount: 8,
    pendingIndents: 1,
    fifteenDayStockDays: 14,
    bufferDaysRemaining: 8,
  },
  {
    id: 'phc-bun',
    name: 'Bundu PHC',
    medicalOfficer: 'Dr. Alok Baraik',
    stockStatus: 'REORDER',
    totalBeds: 30,
    occupiedBeds: 21,
    staffPresentCount: 4,
    totalStaffCount: 5,
    pendingIndents: 0,
    fifteenDayStockDays: 9,
    bufferDaysRemaining: 4,
  },
  {
    id: 'phc-sil',
    name: 'Silli PHC',
    medicalOfficer: 'Dr. Meena Soren',
    stockStatus: 'ADEQUATE',
    totalBeds: 25,
    occupiedBeds: 12,
    staffPresentCount: 5,
    totalStaffCount: 5,
    pendingIndents: 0,
    fifteenDayStockDays: 15,
    bufferDaysRemaining: 10,
  },
];

interface DistrictDashboardProps {
  onNavigate: (screen: string) => void;
}

export const DistrictDashboard: React.FC<DistrictDashboardProps> = ({ onNavigate }) => {
  const [selectedPhcId, setSelectedPhcId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'15_DAYS' | 'BUFFER_DAYS'>('15_DAYS');

  const filteredPhcs =
    selectedPhcId === 'ALL' ? RANCHI_PHCS : RANCHI_PHCS.filter((p) => p.id === selectedPhcId);

  const totalBeds = filteredPhcs.reduce((acc, p) => acc + p.totalBeds, 0);
  const occupiedBeds = filteredPhcs.reduce((acc, p) => acc + p.occupiedBeds, 0);
  const totalStaffPresent = filteredPhcs.reduce((acc, p) => acc + p.staffPresentCount, 0);
  const totalStaff = filteredPhcs.reduce((acc, p) => acc + p.totalStaffCount, 0);
  const pendingIndentsCount = filteredPhcs.reduce((acc, p) => acc + p.pendingIndents, 0);

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800">🔴 CRITICAL</span>;
      case 'REORDER':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">🟡 REORDER</span>;
      case 'ADEQUATE':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">🟢 SAFE</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="district-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-800/40 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/60 text-amber-300 border border-amber-700/50">
                L3 — District User
              </span>
              <span className="text-xs text-slate-400">Ranchi District Hub</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2">Ranchi District Healthcare Operations</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              PHC-wise aggregated monitoring across Ranchi District, hospital bed availability, PHC indent approvals, and local stock redistribution.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('indent_approvals')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              Indent Approvals ({pendingIndentsCount})
            </button>
            <button
              type="button"
              onClick={() => onNavigate('redistribution_recommendations')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              Redistribution AI
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar: PHC Filter & Time Horizon Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold text-slate-300">Select PHC Facility View:</span>
          <select
            value={selectedPhcId}
            onChange={(e) => setSelectedPhcId(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All PHCs (Ranchi District Aggregated)</option>
            {RANCHI_PHCS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
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

      {/* Combined Metric Cards (Stock + Beds + Staff) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>District Stock Runway</span>
            <span className="text-amber-400 font-mono font-bold">
              {viewMode === '15_DAYS' ? '15-Day Runway' : 'Buffer Threshold'}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {viewMode === '15_DAYS' ? '10.5 Days Avg' : '5.7 Buffer Days'}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Critical Shortage: <strong className="text-red-400">Ormanjhi PHC</strong></span>
            <span>{filteredPhcs.length} PHC Facilities</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>District Bed Occupancy</span>
            <Bed className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {occupiedBeds} <span className="text-xs font-normal text-slate-400">/ {totalBeds} occupied</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Occupancy Rate: <strong className="text-amber-400">{Math.round((occupiedBeds / totalBeds) * 100)}%</strong></span>
            <span className="text-emerald-400">{totalBeds - occupiedBeds} Vacant</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>District Staff Duty Roster</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {totalStaffPresent} <span className="text-xs font-normal text-slate-400">/ {totalStaff} on duty</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Attendance Rate: <strong className="text-emerald-400">{Math.round((totalStaffPresent / totalStaff) * 100)}%</strong></span>
            <span className="text-emerald-400 font-medium">All MOs Present</span>
          </div>
        </div>
      </div>

      {/* PHC Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-400" />
            PHC Facilities Summary ({filteredPhcs.length} Facility{filteredPhcs.length > 1 ? 'ies' : ''})
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
              {filteredPhcs.map((phc) => (
                <tr key={phc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{phc.name}</td>
                  <td className="py-3.5 px-4 text-slate-300">{phc.medicalOfficer}</td>
                  <td className="py-3.5 px-4">{getStockBadge(phc.stockStatus)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                    {viewMode === '15_DAYS'
                      ? `${phc.fifteenDayStockDays} Days Stock Left`
                      : `${phc.bufferDaysRemaining} Days Buffer Left`}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-100">{phc.occupiedBeds}</span> / {phc.totalBeds} beds ({Math.round((phc.occupiedBeds / phc.totalBeds) * 100)}%)
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
                      <span className="text-slate-500 text-xs">No pending indents</span>
                    )}
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
