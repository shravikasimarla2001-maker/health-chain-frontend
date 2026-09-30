import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  X,
  Calendar,
  Package,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';

interface PhcForecastItem {
  drug: string;
  currentStock: string;
  predicted30DayNeed: string;
  bufferDeficit: string;
  risk: 'CRITICAL' | 'REORDER' | 'ADEQUATE';
  reason: string;
}

export const PhcForecastView: React.FC = () => {
  // ===================== STATE =====================
  const [forecastItems, setForecastItems] = useState<PhcForecastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ===================== FETCH =====================
  const fetchForecast = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: replace with real endpoint when available:
      // const res = await healthChainApi.getPhcForecast();
      // setForecastItems(res.items ?? []);
      setForecastItems([]);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load PHC forecast';
      setForecastItems([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // ===================== HELPERS =====================
  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-950/70 border-red-800 text-red-300';
      case 'REORDER':
        return 'bg-amber-950/70 border-amber-800 text-amber-300';
      default:
        return 'bg-emerald-950/70 border-emerald-800 text-emerald-300';
    }
  };

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="phc-forecast-view-screen">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              PHC AI Demand Forecast &amp; Replenishment
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Predictive consumption model tailored to local seasonal morbidity trends and
              historical OPD prescription volume.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchForecast}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh forecast"
            aria-label="Refresh PHC forecast"
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
            <div className="font-semibold text-rose-100">Failed to load PHC forecast</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={fetchForecast}
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

      {/* Loading / Empty / Content */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
          Loading PHC forecast...
        </div>
      ) : forecastItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-300">
            No PHC forecast available
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {fetchError
              ? 'Retry once the backend is reachable.'
              : 'The next FL round will produce a fresh per-PHC forecast.'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {forecastItems.map((item) => (
            <div
              key={item.drug}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {item.drug}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold border ${getRiskBadgeClass(
                    item.risk
                  )}`}
                >
                  {item.risk}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500">Current In-Hand:</span>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {item.currentStock || <span className="text-slate-600">—</span>}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Projected 30-Day Need:</span>
                  <div className="font-bold text-teal-400 mt-0.5">
                    {item.predicted30DayNeed || <span className="text-slate-600">—</span>}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Expected Gap:</span>
                  <div
                    className={`font-bold mt-0.5 ${
                      item.bufferDeficit.includes('-')
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {item.bufferDeficit || <span className="text-slate-600">—</span>}
                  </div>
                </div>
              </div>

              {item.reason && (
                <div className="text-xs text-slate-400 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    Epidemiological Driver:{' '}
                    <span className="text-slate-300">{item.reason}</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhcForecastView;