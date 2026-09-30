import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertOctagon,
  Flame,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { AlertNotification } from '../../../types';

export const StateAlerts: React.FC = () => {
  // ===================== STATE =====================
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ===================== FETCH =====================
  const fetchAlerts = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: replace with real endpoint when available:
      // const res = await healthChainApi.getStateAlerts();
      // setAlerts(res.items ?? []);
      setAlerts([]);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load state alerts';
      setAlerts([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // ===================== FILTER =====================
  // Same state-alert filter as original
  const stateAlerts = alerts.filter(
    (a) =>
      a.state === 'Jharkhand' ||
      a.district === 'Bokaro' ||
      a.district === 'Ramgarh'
  );

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="state-alerts-screen">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-emerald-400" />
              State Supply Chain & Cold Chain Deviation Alerts
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Monitor district-level cold storage excursions, near-expiry drug batches, and buffer
              stock alerts across the state.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAlerts}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh alerts"
            aria-label="Refresh state alerts"
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
            <div className="font-semibold text-rose-100">Failed to load state alerts</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={fetchAlerts}
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

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
            Loading state alerts...
          </div>
        ) : stateAlerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-70" />
            <h3 className="text-base font-semibold text-slate-200">No State Alerts</h3>
            <p className="text-sm text-slate-400 mt-1">
              {fetchError
                ? 'Unable to load state alerts. Please retry.'
                : 'All district supply chain and cold chain signals are normal.'}
            </p>
          </div>
        ) : (
          stateAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 shrink-0">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-red-950/70 border-red-800 text-red-300'
                            : 'bg-amber-950/70 border-amber-800 text-amber-300'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                        {alert.type}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {alert.district ? `${alert.district} District` : 'Statewide'}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-100 mt-2">{alert.title}</h2>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 shrink-0">{alert.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StateAlerts;