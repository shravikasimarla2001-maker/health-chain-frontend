import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Sparkles,
  AlertCircle,
  Globe2,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';

// ===================== TYPES =====================
interface NationalForecastAggregate {
  horizon: string;
  projectedConsumptionIncrease: string;
  primarySurgeDriver: string;
  topShortageRisk: string;
  bufferHealthDays: string;
  aiAction: string;
  modelConfidencePct: number | null;
}

interface StateForecastItem {
  state: string;
  projectedConsumptionIncrease: string;
  primarySurgeDriver: string;
  topShortageRisk: string;
  bufferHealthDays: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}

// Empty shapes — no fake fallback data ever
const EMPTY_AGGREGATE: NationalForecastAggregate = {
  horizon: 'Next 30–90 days',
  projectedConsumptionIncrease: '',
  primarySurgeDriver: '',
  topShortageRisk: '',
  bufferHealthDays: '',
  aiAction: '',
  modelConfidencePct: null,
};

export const NationalForecast: React.FC = () => {
  // ===================== STATE =====================
  const [aggregate, setAggregate] = useState<NationalForecastAggregate | null>(null);
  const [stateForecasts, setStateForecasts] = useState<StateForecastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ===================== FETCH =====================
  const fetchForecast = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: replace with real endpoint when available:
      // const res = await healthChainApi.getNationalForecast();
      // setAggregate(res.aggregate);
      // setStateForecasts(res.states ?? []);
      setAggregate(null);
      setStateForecasts([]);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load national forecast';
      setAggregate(null);
      setStateForecasts([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // ===================== DERIVED =====================
  const hasAggregate = aggregate !== null;
  const hasStates = stateForecasts.length > 0;

  // Computed KPIs from the fetched state list (no hardcoded counts)
  const affectedStates = stateForecasts.length;
  const criticalStates = stateForecasts.filter((s) => s.urgency === 'CRITICAL').length;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-red-950/60 text-red-300 border-red-800';
      case 'HIGH':
        return 'bg-amber-950/60 text-amber-300 border-amber-800';
      case 'MODERATE':
        return 'bg-blue-950/60 text-blue-300 border-blue-800';
      case 'LOW':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const show = (value: string | number | null | undefined): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-slate-600">—</span>;
    }
    return value;
  };

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="national-forecast-screen">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                L1 — National
              </span>
              <span className="text-xs text-slate-400">Pan-India Demand Projection</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 mt-2">
              <Globe2 className="w-5 h-5 text-emerald-400" />
              National Demand Forecasting & Epidemic Spike Predictions
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              {aggregate?.horizon || EMPTY_AGGREGATE.horizon} aggregated medicine consumption
              projections across all Indian states and union territories, powered by decentralized
              federated learning nodes.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchForecast}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh forecast"
            aria-label="Refresh national forecast"
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

      {/* Loading state */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          Loading national forecast...
        </div>
      ) : !hasAggregate ? (
        /* Empty aggregate state */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <TrendingUp className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-300">
            No national forecast available
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {fetchError
              ? 'Retry once the backend is reachable.'
              : 'The next FL round will produce a fresh forecast.'}
          </div>
        </div>
      ) : (
        <>
          {/* National Aggregate Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <span className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Pan-India Aggregate Forecast
              </span>
              {aggregate.projectedConsumptionIncrease && (
                <span className="px-3 py-1 rounded text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                  {aggregate.projectedConsumptionIncrease} Expected Demand Spike
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">Epidemiological Driver:</span>
                <div className="text-slate-200 font-medium mt-1">
                  {show(aggregate.primarySurgeDriver)}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">Vulnerable Medicines (National):</span>
                <div className="text-red-300 font-medium mt-1">
                  {show(aggregate.topShortageRisk)}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">National Buffer Health:</span>
                <div className="text-amber-300 font-medium mt-1">
                  {show(aggregate.bufferHealthDays)}
                </div>
              </div>
            </div>

            {/* National KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  States Affected
                </div>
                <div className="text-xl font-bold text-slate-100 mt-1">
                  {affectedStates}
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  Critical States
                </div>
                <div className="text-xl font-bold text-red-300 mt-1">
                  {criticalStates}
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  Forecast Horizon
                </div>
                <div className="text-base font-bold text-slate-100 mt-1">
                  {show(aggregate.horizon)}
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  Model Confidence
                </div>
                <div className="text-xl font-bold text-emerald-300 mt-1">
                  {aggregate.modelConfidencePct !== null
                    ? `${aggregate.modelConfidencePct}%`
                    : <span className="text-slate-600">—</span>}
                </div>
              </div>
            </div>

            {aggregate.aiAction && (
              <div className="text-xs text-slate-400 flex items-start gap-1.5 pt-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">AI National Recommendation:</strong>{' '}
                  {aggregate.aiAction}
                </span>
              </div>
            )}
          </div>

          {/* Per-State Breakdown */}
          {hasStates ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  State-Level Forecast Breakdown
                </h2>
                <span className="text-xs text-slate-500">
                  {stateForecasts.length} states shown · sorted by urgency
                </span>
              </div>

              {stateForecasts.map((f) => (
                <div
                  key={f.state}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <span className="font-bold text-base text-slate-100 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      {f.state}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${getUrgencyColor(
                          f.urgency
                        )}`}
                      >
                        {f.urgency}
                      </span>
                      {f.projectedConsumptionIncrease && (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                          {f.projectedConsumptionIncrease} Expected Demand Spike
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500">Epidemiological Driver:</span>
                      <div className="text-slate-200 font-medium mt-1">
                        {show(f.primarySurgeDriver)}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500">Vulnerable Medicines:</span>
                      <div className="text-red-300 font-medium mt-1">
                        {show(f.topShortageRisk)}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500">Buffer Health:</span>
                      <div className="text-amber-300 font-medium mt-1">
                        {show(f.bufferHealthDays)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <MapPin className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <div className="text-sm text-slate-400">
                No state-level breakdown available
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Footer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <span>
          National forecast aggregates anonymized edge-node predictions from all state and district
          FL participants. No raw patient data leaves any facility. Predictions refresh every 24
          hours after the latest FL round converges.
        </span>
      </div>
    </div>
  );
};

export default NationalForecast;