import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  CheckCircle2,
  Calendar,
  Building,
  RefreshCw,
  Edit2,
  X,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  StaffMember,
  RosterItemResponse,
  AttendanceStatusEnum,
  AttendanceSummaryResponse,
} from '../../../types';

interface StaffAttendanceProps {
  staff: StaffMember[];
  onUpdateStaff: (staff: StaffMember[]) => void;
}

const KNOWN_PHCS = [
  { id: '150038ee-f99b-42ea-acb8-656fe0335361', name: 'Ormanjhi PHC (Ranchi)' },
  { id: 'a1b912f5-0abb-4bf9-b88c-8dd73234e33b', name: 'Kanke PHC (Ranchi)' },
  { id: 'a34855ee-eb73-40ff-adba-8f4e990a5b86', name: 'Patratu PHC (Ramgarh)' },
  { id: '46ba4355-9b57-45a4-91c1-a1f8de0f78cb', name: 'Gola PHC (Ramgarh)' },
  { id: 'c7fd5081-6dd9-434b-8217-ed4e48f16c2a', name: 'Hingna PHC (Nagpur)' },
  { id: '5682ba02-a5fd-429a-b6e1-f4de6d99c491', name: 'Kamptee PHC (Nagpur)' },
];

export const StaffAttendance: React.FC<StaffAttendanceProps> = ({ staff = [], onUpdateStaff }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const initialFacilityId =
    (user?.scope_id && user.scope_id.length > 10 ? user.scope_id : null) ||
    '150038ee-f99b-42ea-acb8-656fe0335361';

  const [activeFacilityId, setActiveFacilityId] = useState<string>(initialFacilityId);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [roster, setRoster] = useState<RosterItemResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<RosterItemResponse | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<AttendanceStatusEnum>('present');
  const [correctionReason, setCorrectionReason] = useState<string>('Biometric machine sync correction');
  const [correctionRemarks, setCorrectionRemarks] = useState<string>('');
  const [isCorrecting, setIsCorrecting] = useState<boolean>(false);

  // Summary State
  const [summary, setSummary] = useState<AttendanceSummaryResponse | null>(null);
  const [showSummaryView, setShowSummaryView] = useState<boolean>(false);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ===================== LOAD ROSTER =====================
  const loadRoster = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await healthChainApi.getFacilityRoster(activeFacilityId, selectedDate);
      setRoster(data || []);
      setFetchError(null);
    } catch (err: unknown) {
      // No fake fallback — surface the error and clear the roster
      const msg = err instanceof Error ? err.message : 'Failed to load staff roster';
      setFetchError(msg);
      setRoster([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFacilityId, selectedDate]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  // ===================== LOAD SUMMARY =====================
  const loadSummary = async () => {
    setShowSummaryView(true);
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const res = await healthChainApi.getFacilityAttendanceSummary(
        activeFacilityId,
        firstDay,
        selectedDate
      );
      setSummary(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch attendance summary';
      setSummaryError(msg);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  // ===================== QUICK MARK =====================
  const handleQuickMark = async (staffItem: RosterItemResponse, status: AttendanceStatusEnum) => {
    try {
      await healthChainApi.markAttendance(activeFacilityId, {
        user_id: staffItem.user_id,
        status,
        attendance_date: selectedDate,
        check_in_time: status === 'absent' ? null : new Date().toISOString(),
        remarks: status === 'on_duty' ? 'Field / OPD duty' : undefined,
      });
      showToast('success', `${staffItem.full_name} marked as ${status.toUpperCase()}.`);
      await loadRoster();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record attendance';
      showToast('error', msg);
    }
  };

  // ===================== BULK MARK =====================
  const handleBulkMarkPresent = async () => {
    if (roster.length === 0) return;
    try {
      await healthChainApi.bulkMarkAttendance(activeFacilityId, {
        attendance_date: selectedDate,
        entries: roster.map((r) => ({
          user_id: r.user_id,
          status: 'present',
          check_in_time: new Date().toISOString(),
          remarks: 'Bulk duty mark',
        })),
      });
      showToast(
        'success',
        `All ${roster.length} staff members marked PRESENT for ${selectedDate}.`
      );
      await loadRoster();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk attendance recording failed';
      showToast('error', msg);
    }
  };

  // ===================== CORRECTION =====================
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget?.attendance_id || correctionReason.length < 10) return;

    setIsCorrecting(true);
    try {
      await healthChainApi.correctAttendance(activeFacilityId, correctionTarget.attendance_id, {
        status: correctionStatus,
        reason: correctionReason.trim(),
        remarks: correctionRemarks.trim() || undefined,
        check_in_time: correctionStatus === 'absent' ? null : new Date().toISOString(),
      });
      showToast(
        'success',
        `Attendance record corrected to ${correctionStatus.toUpperCase()} for ${correctionTarget.full_name}.`
      );
      setCorrectionTarget(null);
      await loadRoster();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Correction failed';
      showToast('error', msg);
    } finally {
      setIsCorrecting(false);
    }
  };

  // ===================== DERIVED =====================
  const markedCount = roster.filter((r) => r.status !== null).length;
  const presentCount = roster.filter(
    (r) => r.status === 'present' || r.status === 'on_duty'
  ).length;
  const absentCount = roster.filter((r) => r.status === 'absent').length;
  const leaveCount = roster.filter((r) => r.status === 'leave').length;
  const attendanceRate =
    roster.length > 0 ? Math.round((presentCount / roster.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="staff-attendance-screen">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            {t('attendance.title')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('attendance.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadRoster}
            disabled={refreshing}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {t('action.refresh')}
          </button>
          <button
            type="button"
            onClick={loadSummary}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Monthly Summary
          </button>
          <button
            type="button"
            onClick={handleBulkMarkPresent}
            disabled={roster.length === 0}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t('attendance.mark_all_btn')}
          </button>
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
            <div className="font-semibold text-rose-100">Failed to load staff roster</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={loadRoster}
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

      {/* Facility & Date Selector Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
            <Building className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target Facility:</span>
          </div>
          <select
            value={activeFacilityId}
            onChange={(e) => setActiveFacilityId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {KNOWN_PHCS.map((phc) => (
              <option key={phc.id} value={phc.id}>
                {phc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Roster Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Present / On Duty:</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {presentCount} / {roster.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {attendanceRate}% duty coverage
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Absent / Leave:</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {absentCount + leaveCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {roster.length - markedCount} unmarked
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Staff Member &amp; Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Check-Out Time</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Roster Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    Loading staff roster for {selectedDate}...
                  </td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {fetchError
                      ? 'Unable to load roster. Please retry.'
                      : 'No staff members assigned to this facility roster.'}
                  </td>
                </tr>
              ) : (
                roster.map((member) => {
                  const isPresent = member.status === 'present' || member.status === 'on_duty';
                  const isAbsent = member.status === 'absent';
                  const isLeave = member.status === 'leave';

                  return (
                    <tr key={member.user_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        <div>{member.full_name}</div>
                        <div className="text-slate-400 text-[11px] font-mono">
                          {member.user_email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border uppercase ${
                            isPresent
                              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                              : isAbsent
                              ? 'bg-red-950/70 border-red-800 text-red-300'
                              : isLeave
                              ? 'bg-amber-950/70 border-amber-800 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {member.status ? member.status : 'Unrecorded'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {member.check_in_time
                          ? new Date(member.check_in_time).toLocaleTimeString()
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {member.check_out_time
                          ? new Date(member.check_out_time).toLocaleTimeString()
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs truncate max-w-[160px]">
                        {member.remarks || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickMark(member, 'present')}
                            className="px-2 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition"
                            title="Mark Present"
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickMark(member, 'absent')}
                            className="px-2 py-1 bg-red-600/80 hover:bg-red-500 text-white rounded text-[11px] font-medium transition"
                            title="Mark Absent"
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickMark(member, 'on_duty')}
                            className="px-2 py-1 bg-blue-600/80 hover:bg-blue-500 text-white rounded text-[11px] font-medium transition"
                            title="Mark On Duty"
                          >
                            On Duty
                          </button>
                          {member.attendance_id && (
                            <button
                              type="button"
                              onClick={() => {
                                setCorrectionTarget(member);
                                setCorrectionStatus(member.status || 'present');
                                setCorrectionReason(
                                  'Biometric record correction per supervisor review'
                                );
                                setCorrectionRemarks(member.remarks || '');
                              }}
                              className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                              title="Audit Correction"
                              aria-label="Audit correction"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Correction */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                Attendance Correction
              </h3>
              <button
                type="button"
                onClick={() => setCorrectionTarget(null)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div>
                Staff Member: <strong>{correctionTarget.full_name}</strong>
              </div>
              <div>
                Attendance Date:{' '}
                <span className="font-mono text-teal-400">{selectedDate}</span>
              </div>
              <div>
                Current Status:{' '}
                <span className="font-mono uppercase text-amber-300">
                  {correctionTarget.status || 'unrecorded'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Corrected Status *
                </label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value as AttendanceStatusEnum)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                >
                  <option value="present">present</option>
                  <option value="absent">absent</option>
                  <option value="on_duty">on_duty</option>
                  <option value="leave">leave</option>
                  <option value="half_day">half_day</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Mandatory Correction Reason * (min 10 characters)
                </label>
                <textarea
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Explain reason for discrepancy (e.g. fingerprint sensor malfunction)..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                  minLength={10}
                  maxLength={500}
                />
                <span className="text-[10px] text-slate-500">
                  {correctionReason.length}/500 chars (min 10)
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Optional Remarks
                </label>
                <input
                  type="text"
                  value={correctionRemarks}
                  onChange={(e) => setCorrectionRemarks(e.target.value)}
                  placeholder="Supervisor notes..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCorrecting || correctionReason.length < 10}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-1.5"
                >
                  {isCorrecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Summary View */}
      {showSummaryView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" />
                Facility Attendance Summary
              </h3>
              <button
                type="button"
                onClick={() => setShowSummaryView(false)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {summaryLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
                Loading monthly summary...
              </div>
            ) : summaryError ? (
              <div
                role="alert"
                className="p-3 bg-rose-950/70 border border-rose-800/60 rounded-lg text-rose-200 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-rose-100">Failed to load summary</div>
                  <div className="text-rose-300/90 mt-0.5">{summaryError}</div>
                </div>
                <button
                  type="button"
                  onClick={loadSummary}
                  className="text-rose-300 hover:text-rose-100 text-[11px] font-semibold px-2 py-1 rounded border border-rose-700/60 hover:bg-rose-900/40 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : !summary ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No summary data available for this period.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Total Records:</span>
                  <div className="text-xl font-bold text-slate-100 mt-1">
                    {summary.total_records}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Attendance Rate:</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {summary.attendance_rate}%
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Present Count:</span>
                  <div className="text-lg font-bold text-emerald-300 mt-1">
                    {summary.present_count}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Absent Count:</span>
                  <div className="text-lg font-bold text-red-400 mt-1">
                    {summary.absent_count}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">On Duty:</span>
                  <div className="text-lg font-bold text-blue-300 mt-1">
                    {summary.on_duty_count}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Leave Count:</span>
                  <div className="text-lg font-bold text-amber-300 mt-1">
                    {summary.leave_count}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSummaryView(false)}
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

export default StaffAttendance;