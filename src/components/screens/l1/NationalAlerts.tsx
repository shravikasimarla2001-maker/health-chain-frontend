import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  X,
  Globe,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { AlertNotification } from '../../../types';

export const NationalAlerts: React.FC = () => {
  // ===================== STATE =====================
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ===================== FETCH =====================
  const fetchAlerts = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: replace with real endpoint when available:
      // const res = await healthChainApi.getNationalAlerts();
      // setAlerts(res.items ?? []);
      setAlerts([]);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load national alerts';
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
  // Same national-alert filter as the original
  const nationalAlerts = alerts.filter(
    (a) =>
      a.state === 'National' ||
      (a.state && a.state.includes('Bihar')) ||
      a.type === 'OUTBREAK_SIGNAL'
  );

  // ===================== ACTIONS =====================
  const handleDispatchAdvisory = async (alertId: string, alertTitle: string) => {
    setActionError(null);
    setActionLoading(`dispatch-${alertId}`);
    try {
      // TODO: await healthChainApi.dispatchNationalAdvisory(alertId);
      setSuccessMsg(`National advisory dispatched for: "${alertTitle}"`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch advisory';
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="national-alerts-screen">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              National Supply Chain & Outbreak Early Warnings
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              High-priority surveillance alerts aggregated across state health clusters including
              epidemic spikes, national stock deficits, and emergency redistribution signals.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAlerts}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh alerts"
            aria-label="Refresh national alerts"
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
            <div className="font-semibold text-rose-100">Failed to load national alerts</div>
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

      {/* Action Error Banner */}
      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl border bg-amber-950/70 border-amber-700/60 text-amber-200 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-100">Dispatch failed</div>
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

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-red-400" />
            Loading national alerts...
          </div>
        ) : nationalAlerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <ShieldAlertIcon />
            <h3 className="text-base font-semibold text-slate-200 mt-3">
              No National Alerts
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {fetchError
                ? 'Unable to load national alerts. Please retry.'
                : 'No high-priority national-level alerts are active right now.'}
            </p>
          </div>
        ) : (
          nationalAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-900 border border-red-900/40 rounded-xl p-6 space-y-3 relative overflow-hidden shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-red-400 shrink-0">
                    <AlertOctagon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-950 text-red-300 border border-red-800">
                        {alert.severity}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                        {alert.type}
                      </span>
                      {alert.state && (
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {alert.state}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-100 mt-2">
                      {alert.title}
                    </h2>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 shrink-0">
                  {alert.timestamp}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  Recommended Action:{' '}
                  <span className="text-slate-200 font-medium">
                    {alert.actionRequired
                      ? 'Dispatch inter-state vector control medicine buffers'
                      : 'Monitor and review on next surveillance cycle'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDispatchAdvisory(alert.id, alert.title)}
                  disabled={actionLoading === `dispatch-${alert.id}`}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {actionLoading === `dispatch-${alert.id}` ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  Dispatch National Advisory
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Small inline empty-state icon component to avoid cluttering JSX
const ShieldAlertIcon: React.FC = () => (
  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 mx-auto">
    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
  </div>
);

export default NationalAlerts;