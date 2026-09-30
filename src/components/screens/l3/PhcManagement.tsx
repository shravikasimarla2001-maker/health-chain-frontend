import React, { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle2,
  Edit2,
  MapPin,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';

interface PhcDetail {
  id: string;
  name: string;
  code: string;
  moName: string;
  moPhone: string;
  generalBeds: number;
  oxygenBeds: number;
  icuBeds: number;
  distanceFromDistrictHubKm: number;
}

export const PhcManagement: React.FC = () => {
  // ===================== STATE =====================
  const [phcs, setPhcs] = useState<PhcDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit-phone-inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState('');

  // ===================== FETCH =====================
  const fetchPhcs = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: replace with real endpoint when available:
      // const res = await healthChainApi.getDistrictPhcs();
      // setPhcs(res.items ?? []);
      setPhcs([]);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load PHC directory';
      setPhcs([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPhcs();
  }, [fetchPhcs]);

  // ===================== ACTIONS =====================
  const handleStartEdit = (phc: PhcDetail) => {
    setEditingId(phc.id);
    setEditPhone(phc.moPhone);
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPhone('');
  };

  const handleSaveEdit = async (id: string) => {
    setActionError(null);
    setActionLoading(`save-${id}`);
    try {
      // TODO: await healthChainApi.updatePhcMoPhone(id, editPhone);
      setPhcs((prev) =>
        prev.map((p) => (p.id === id ? { ...p, moPhone: editPhone } : p))
      );
      setEditingId(null);
      setEditPhone('');
      setSuccessMsg('Medical Officer phone updated.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save contact';
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="phc-management-screen">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-amber-400" />
              District PHC Facilities & Medical Officer Directory
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Maintain facility records, verified bed infrastructure capacity, and official
              medical officer contact channels.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchPhcs}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh PHC directory"
            aria-label="Refresh PHC directory"
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
            <div className="font-semibold text-rose-100">Failed to load PHC directory</div>
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

      {/* Action Error Banner */}
      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl border bg-amber-950/70 border-amber-700/60 text-amber-200 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-100">Update failed</div>
            <div className="text-amber-300/90 mt-0.5">{actionError}</div>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-amber-300 hover:text-amber-100"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Loading / Empty / Cards */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
          Loading PHC directory...
        </div>
      ) : phcs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Stethoscope className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-300">
            No PHC records available
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {fetchError
              ? 'Retry once the backend is reachable.'
              : 'No facilities registered in your scope yet.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phcs.map((phc) => (
            <div
              key={phc.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-100">{phc.name}</h2>
                  <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {phc.code}
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {phc.distanceFromDistrictHubKm} km away
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Medical Officer:</span>
                  <span className="font-semibold text-slate-200">
                    {phc.moName || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Phone:</span>
                  {editingId === phc.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs w-32 focus:outline-none focus:border-amber-500"
                        aria-label="Medical Officer phone"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(phc.id)}
                        disabled={actionLoading === `save-${phc.id}`}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold disabled:opacity-50 flex items-center gap-1"
                      >
                        {actionLoading === `save-${phc.id}` && (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        )}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-slate-400 hover:text-slate-200 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300">
                        {phc.moPhone || '—'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(phc)}
                        className="text-slate-500 hover:text-amber-400"
                        aria-label="Edit phone"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-500 text-[11px]">General</div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">
                    {phc.generalBeds} Beds
                  </div>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-500 text-[11px]">Oxygen</div>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">
                    {phc.oxygenBeds} Beds
                  </div>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-500 text-[11px]">ICU / High Care</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {phc.icuBeds} Beds
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhcManagement;