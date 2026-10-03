import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  X,
  Calendar,
  Package,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import {
  FacilityForecastResponse,
  FacilityForecastItem,
  FacilityDrugForecastResponse,
} from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { ALL_PHCS } from '../../../data/geoConstants';

const DEFAULT_FACILITY_ID = '150038ee-f99b-42ea-acb8-656fe0335361'; // Ormanjhi PHC

export const PhcForecastView: React.FC = () => {
  const { user } = useAuth();

  // Facility ID resolution: user's facility scope or default facility ID
  const activeFacilityId = (user?.scope_level?.toUpperCase() === 'PHC' && user?.scope_id)
    ? user.scope_id
    : DEFAULT_FACILITY_ID;

  const facilityName = ALL_PHCS.find((p) => p.id === activeFacilityId)?.name || 'Ormanjhi PHC';

  // ===================== STATE =====================
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [forecastData, setForecastData] = useState<FacilityForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Selected drug for deep inspection
  const [selectedDrug, setSelectedDrug] = useState<FacilityForecastItem | null>(null);
  const [drugDetail, setDrugDetail] = useState<FacilityDrugForecastResponse | null>(null);
  const [loadingDrugDetail, setLoadingDrugDetail] = useState<boolean>(false);

  // ===================== FETCH =====================
  const fetchForecast = useCallback(async () => {
    setRefreshing(true);
    setFetchError(null);
    try {
      const res = await healthChainApi.getFacilityForecast(activeFacilityId, horizonDays);
      setForecastData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load PHC demand forecast';
      setFetchError(msg);
      setForecastData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFacilityId, horizonDays]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Deep inspect a specific drug forecast
  const handleInspectDrug = async (item: FacilityForecastItem) => {
    setSelectedDrug(item);
    setLoadingDrugDetail(true);
    try {
      const res = await healthChainApi.getFacilityDrugForecast(activeFacilityId, item.drug_id, horizonDays);
      setDrugDetail(res);
    } catch {
      setDrugDetail(null);
    } finally {
      setLoadingDrugDetail(false);
    }
  };

  const getRiskBadgeClass = (risk?: string) => {
    if (!risk) return 'bg-slate-800 text-slate-400';
    const r = risk.toUpperCase();
    switch (r) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-950/70 border-red-800 text-red-300';
      case 'REORDER':
      case 'MODERATE':
        return 'bg-amber-950/70 border-amber-800 text-amber-300';
      default:
        return 'bg-emerald-950/70 border-emerald-800 text-emerald-300';
    }
  };

  const items = forecastData?.items ?? [];
  const criticalCount = items.filter((i) => i.risk_level?.toUpperCase() === 'CRITICAL').length;
  const reorderCount = items.filter((i) => i.risk_level?.toUpperCase() === 'REORDER').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="phc-forecast-view-screen">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-950 text-teal-300 border border-teal-800">
                Federated Model Serving
              </span>
              <span className="text-xs text-slate-400">
                Facility: <strong className="text-slate-200">{facilityName}</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              AI Medicine Demand Forecast &amp; Shortage Warning
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Model-driven consumption projections calculated by federated edge checkpoints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Horizon selector */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setHorizonDays(7)}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  horizonDays === 7
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setHorizonDays(14)}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  horizonDays === 14
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                14 Days
              </button>
            </div>

            <button
              type="button"
              onClick={fetchForecast}
              disabled={refreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
              title="Refresh demand forecast"
              aria-label="Refresh PHC forecast"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Critical Shortage Risks (&lt;2 Days Buffer)</span>
          <div className="text-2xl font-bold text-red-400 mt-1 flex items-center gap-2">
            {criticalCount} Drugs
            {criticalCount > 0 && <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />}
          </div>
          <div className="text-xs text-red-400/90 mt-1">Requires emergency transfer indent</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Reorder Threshold Drugs (&lt;5 Days Buffer)</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {reorderCount} Drugs
          </div>
          <div className="text-xs text-amber-400/90 mt-1">Routine replenishment window</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Serving FL Checkpoint</span>
          <div className="text-base font-bold text-slate-200 mt-1 truncate">
            {forecastData?.model_version || '—'}
          </div>
          <div className="text-xs text-teal-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Federated model active
          </div>
        </div>
      </div>

      {/* Fetch Error Banner */}
      {fetchError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl border bg-rose-950/80 border-rose-700/60 text-rose-200 text-xs flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-100">Failed to load PHC demand forecast</div>
              <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchForecast}
            className="text-rose-300 hover:text-rose-100 text-xs font-semibold px-2 py-1 rounded border border-rose-700/60 hover:bg-rose-900/40"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading / Empty / Content */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
          Loading PHC forecast projections from backend...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-300">
            No PHC forecast available
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {fetchError ? 'Unable to reach backend forecast service.' : 'No forecast records generated yet.'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Forecasted Medicines for {facilityName} ({horizonDays}-Day Horizon)</span>
            <span>Click any medicine to view daily trajectory curve</span>
          </div>

          {items.map((item) => {
            const isCritical = item.risk_level?.toUpperCase() === 'CRITICAL';

            return (
              <div
                key={item.drug_id || item.drug_name}
                onClick={() => handleInspectDrug(item)}
                className={`bg-slate-900 border rounded-xl p-5 space-y-3 cursor-pointer transition-all hover:border-teal-600/60 hover:shadow-lg ${
                  isCritical ? 'border-red-900/60 bg-red-950/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-slate-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      {item.drug_name}
                    </span>
                    {item.category && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 uppercase">
                        {item.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getRiskBadgeClass(
                        item.risk_level
                      )}`}
                    >
                      {item.risk_level}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500">In-Hand Stock:</span>
                    <div className="font-bold text-slate-200 mt-0.5">
                      {item.current_stock != null ? item.current_stock.toLocaleString() : '—'} {item.unit || 'units'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Projected {horizonDays}-Day Need:</span>
                    <div className="font-bold text-teal-400 mt-0.5">
                      {item.predicted_demand != null ? item.predicted_demand.toLocaleString() : '—'} {item.unit || 'units'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Buffer Health:</span>
                    <div
                      className={`font-bold mt-0.5 ${
                        item.buffer_days_remaining != null && item.buffer_days_remaining < 2
                          ? 'text-red-400'
                          : item.buffer_days_remaining != null && item.buffer_days_remaining < 5
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {item.buffer_days_remaining != null ? `${item.buffer_days_remaining.toFixed(1)} Days Left` : '—'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Projected Deficit:</span>
                    <div
                      className={`font-bold mt-0.5 ${
                        (item.deficit ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {item.deficit != null ? (item.deficit > 0 ? `-${item.deficit} units` : 'Surplus') : '—'}
                    </div>
                  </div>
                </div>

                {item.recommendation && (
                  <div className="text-xs text-slate-400 flex items-start gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-800/60">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      <strong className="text-slate-300">Prescriptive Action:</strong> {item.recommendation}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Drug Demand Curve Modal */}
      {selectedDrug && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-100">{selectedDrug.drug_name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold border ${getRiskBadgeClass(
                      selectedDrug.risk_level
                    )}`}
                  >
                    {selectedDrug.risk_level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Facility: <strong className="text-slate-200">{facilityName}</strong> | {horizonDays}-Day Daily Forecast Trajectory
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDrug(null);
                  setDrugDetail(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Daily Bars */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Predicted Daily Consumption Breakdown
              </span>

              {loadingDrugDetail ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Loading daily granularity...
                </div>
              ) : (() => {
                const points =
                  drugDetail?.items?.[0]?.daily_forecast ||
                  (drugDetail as any)?.daily_forecast ||
                  selectedDrug.daily_forecast;

                if (!points || points.length === 0) {
                  return (
                    <div className="p-4 bg-slate-950 rounded-lg text-xs text-slate-500 text-center">
                      Daily granularity not returned by the forecast model.
                    </div>
                  );
                }

                const maxVal = Math.max(...points.map((d: any) => d.predicted_consumption), 1);

                return (
                  <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    {points.map((pt: any, idx: number) => {
                      const pct = Math.min(100, Math.round((pt.predicted_consumption / maxVal) * 100));

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-300">{pt.date}</span>
                            <span className="font-mono text-teal-400 font-semibold">
                              {pt.predicted_consumption} {selectedDrug.unit || 'units'}
                              {pt.confidence_lower != null && pt.confidence_upper != null && (
                                <span className="text-slate-500 font-normal ml-2">
                                  (CI: {pt.confidence_lower}–{pt.confidence_upper})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-teal-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Prescriptive Action */}
            {(drugDetail?.recommendation || selectedDrug.recommendation) && (
              <div className="p-3.5 bg-teal-950/30 border border-teal-900/60 rounded-lg text-xs text-teal-200">
                <strong>Recommended Clinical Action:</strong> {drugDetail?.recommendation || selectedDrug.recommendation}
              </div>
            )}

            <div className="flex justify-end border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedDrug(null);
                  setDrugDetail(null);
                }}
                className="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-xs font-medium border border-slate-700"
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

export default PhcForecastView;
