import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
  MapPin,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';

interface PhcForecastItem {
  phc: string;
  projected30DayDemand: string;
  predictedRisk: string;
  recommendedAction: string;
  confidence: string;
}

export const DistrictForecast: React.FC = () => {
  // ===================== STATE =====================
  const [phcForecasts, setPhcForecasts] = useState<PhcForecastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ===================== FETCH =====================
  const fetchForecasts = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: replace with real endpoint when available:
      // const res = await healthChainApi.getDistrictForecast();
      // setPhcForecasts(res.phcs ?? []);
      setPhcForecasts([]);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load district forecast';
      setPhcForecasts([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchForecasts();
  }, [fetchForecasts]);

  // Risk-color helper (unchanged logic)
  const getRiskColor = (risk: string) => {
    if (risk.includes('HIGH') || risk.includes('CRITICAL')) return 'text-red-300';
    if (risk.includes('MEDIUM')) return 'text-amber-300';
    return 'text-emerald-300';
  };

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="district-forecast-screen">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-amber-400" />
              Per-PHC 30-Day Demand & Outbreak Forecast
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Machine-learning powered 30-day medicine consumption projections and risk scores
              for district health centers.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchForecasts}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh forecast"
            aria-label="Refresh district forecast"
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
            <div className="font-semibold text-rose-100">Failed to load forecast</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={fetchForecasts}
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

      {/* Forecast List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            Loading district forecast...
          </div>
        ) : phcForecasts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <LineChart className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">
              No district forecast available
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {fetchError
                ? 'Unable to load forecast. Please retry.'
                : 'The next FL round will produce a fresh per-PHC forecast.'}
            </p>
          </div>
        ) : (
          phcForecasts.map((pf) => (
            <div
              key={pf.phc}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <span className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {pf.phc}
                </span>
                {pf.confidence && (
                  <span className="text-xs px-2.5 py-0.5 rounded font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800">
                    Model Confidence: {pf.confidence}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Projected 30-Day Consumption:</span>
                  <div className="text-slate-200 font-medium mt-1">
                    {pf.projected30DayDemand || <span className="text-slate-600">—</span>}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Stock-out Vulnerability:</span>
                  <div className={`font-medium mt-1 ${getRiskColor(pf.predictedRisk)}`}>
                    {pf.predictedRisk || <span className="text-slate-600">—</span>}
                  </div>
                </div>
              </div>

              {pf.recommendedAction && (
                <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Prescribed Action:{' '}
                  <strong className="text-slate-200">{pf.recommendedAction}</strong>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DistrictForecast;