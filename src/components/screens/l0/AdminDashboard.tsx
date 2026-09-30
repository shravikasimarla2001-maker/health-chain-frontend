import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Server,
  Cpu,
  Users,
  CheckCircle2,
  Database,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';

interface AdminDashboardProps {
  onNavigate: (screen: string) => void;
}

// Shape for a single service status row
interface ServiceStatus {
  name: string;
  status: string;
  latency: string;
  load: string;
}

// Shape for FL round status
interface FlRoundStatus {
  roundNumber: number | null;
  convergencePct: number | null;
  participatingNodes: number | null;
  totalNodes: number | null;
  loss: number | null;
  etaMinutes: number | null;
}

// Shape for platform metrics
interface PlatformMetrics {
  activeNodes: number | null;
  totalNodes: number | null;
  globalModelAccuracy: number | null;
  accuracyDelta: number | null;
  registeredUsers: number | null;
}

// Initial (empty) states — no fake fallback data ever
const EMPTY_SERVICES: ServiceStatus[] = [];
const EMPTY_FL_ROUND: FlRoundStatus = {
  roundNumber: null,
  convergencePct: null,
  participatingNodes: null,
  totalNodes: null,
  loss: null,
  etaMinutes: null,
};
const EMPTY_METRICS: PlatformMetrics = {
  activeNodes: null,
  totalNodes: null,
  globalModelAccuracy: null,
  accuracyDelta: null,
  registeredUsers: null,
};

// Helper: render a value or an empty-state dash
const show = (value: string | number | null | undefined): React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-600">—</span>;
  }
  return value;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  // ===================== STATE =====================
  const [services, setServices] = useState<ServiceStatus[]>(EMPTY_SERVICES);
  const [flRound, setFlRound] = useState<FlRoundStatus>(EMPTY_FL_ROUND);
  const [metrics, setMetrics] = useState<PlatformMetrics>(EMPTY_METRICS);

  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const hasServices = services.length > 0;
  const hasFlRound = flRound.roundNumber !== null;
  const hasMetrics =
    metrics.activeNodes !== null ||
    metrics.globalModelAccuracy !== null ||
    metrics.registeredUsers !== null;

  // ===================== FETCHERS =====================
  // These will hit real endpoints once they exist on the backend.
  // Until then, they simply leave data empty (no fake fallback).

  const fetchMetrics = useCallback(async () => {
    try {
      // TODO: replace with real endpoint, e.g.:
      // const res = await healthChainApi.getAdminMetrics();
      // setMetrics(res);
      // For now: leave empty
      setMetrics(EMPTY_METRICS);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load platform metrics';
      setFetchError(msg);
      setMetrics(EMPTY_METRICS);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      // TODO: replace with real endpoint, e.g.:
      // const res = await healthChainApi.getServiceHealth();
      // setServices(res);
      setServices(EMPTY_SERVICES);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load service telemetry';
      setFetchError(msg);
      setServices(EMPTY_SERVICES);
    }
  }, []);

  const fetchFlRound = useCallback(async () => {
    try {
      // TODO: replace with real endpoint, e.g.:
      // const res = await healthChainApi.getCurrentFlRound();
      // setFlRound(res);
      setFlRound(EMPTY_FL_ROUND);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load FL round status';
      setFetchError(msg);
      setFlRound(EMPTY_FL_ROUND);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMetrics(), fetchServices(), fetchFlRound()]);
      setFetchError(null); // clear on success
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics, fetchServices, fetchFlRound]);

  // Initial load
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Refresh button handler — shows spinner while re-fetching
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchMetrics(), fetchServices(), fetchFlRound()]);
      setFetchError(null);
    } finally {
      setRefreshing(false);
    }
  };

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="l0-admin-dashboard">
      {/* Top Welcome / Status Banner */}
      <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border border-purple-800/40 rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-900/60 text-purple-300 border border-purple-700/50">
                L0 — Platform Control Plane
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2">
              Central System & FL Admin Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time platform telemetry, federated learning round orchestration, node registry,
              and access control across state and district clusters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('fl_orchestration')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Cpu className="w-4 h-4" />
              FL Orchestrator
            </button>
            <button
              type="button"
              onClick={() => onNavigate('node_management')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <Server className="w-4 h-4 text-purple-400" />
              Node Registry
            </button>
          </div>
        </div>
      </div>

      {/* ===== Sticky Fetch Error Banner ===== */}
      {fetchError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl border bg-rose-950/80 border-rose-700/60 text-rose-200 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-100">Failed to load dashboard data</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="text-rose-300 hover:text-rose-100 text-[11px] font-semibold px-2 py-1 rounded border border-rose-700/60 hover:bg-rose-900/40 transition-colors"
            aria-label="Retry"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => setFetchError(null)}
            className="text-rose-300 hover:text-rose-100"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading indicator (first load only) */}
      {loading && !hasMetrics && !hasServices && !hasFlRound && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          Loading platform telemetry...
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Active Nodes</span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {metrics.activeNodes !== null && metrics.totalNodes !== null ? (
              <>
                {metrics.activeNodes} / {metrics.totalNodes}
              </>
            ) : (
              <span className="text-slate-600">—</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.activeNodes !== null && metrics.totalNodes !== null
              ? 'Live telemetry connected'
              : 'No telemetry data'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Current FL Round</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {flRound.roundNumber !== null ? (
              `Round #${flRound.roundNumber}`
            ) : (
              <span className="text-slate-600">—</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {flRound.convergencePct !== null
              ? `${flRound.convergencePct}% convergence reached`
              : 'No active round'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Global Model Accuracy</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {metrics.globalModelAccuracy !== null ? (
              `${metrics.globalModelAccuracy}%`
            ) : (
              <span className="text-slate-600">—</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.accuracyDelta !== null
              ? `${metrics.accuracyDelta > 0 ? '+' : ''}${metrics.accuracyDelta}% from previous round`
              : 'No accuracy data'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Registered Users</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {metrics.registeredUsers !== null ? (
              metrics.registeredUsers
            ) : (
              <span className="text-slate-600">—</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.registeredUsers !== null ? 'Across hierarchical tiers' : 'No user data'}
          </div>
        </div>
      </div>

      {/* System Infrastructure Health & Active FL Round */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2 Cols: System Telemetry */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Core Microservices & Database Status
            </h2>
            {hasServices && (
              <span className="text-xs px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800 rounded">
                Services reported
              </span>
            )}
          </div>

          {hasServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((svc) => (
                <div
                  key={svc.name}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{svc.name}</span>
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {svc.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span>
                      Latency: <strong className="text-slate-300">{svc.latency}</strong>
                    </span>
                    <span>{svc.load}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-lg text-center">
              <Database className="w-10 h-10 mx-auto text-slate-700 mb-2" />
              <div className="text-sm text-slate-400">No service telemetry available</div>
              <div className="text-xs text-slate-600 mt-1">
                Connect a backend to view live microservice status.
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('user_management')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors"
            >
              Manage Users & Roles
            </button>
            <button
              type="button"
              onClick={() => onNavigate('node_management')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors"
            >
              Approve District Nodes
            </button>
            <button
              type="button"
              onClick={() => onNavigate('system_settings')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors"
            >
              Configure Master Data
            </button>
          </div>
        </div>

        {/* 1 Col: Live FL Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              {hasFlRound ? `FL Round #${flRound.roundNumber} Live` : 'Federated Learning'}
            </h2>
            <span className="text-xs font-mono text-purple-300">FedAvg</span>
          </div>

          {hasFlRound ? (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Convergence Progress</span>
                  <span className="font-semibold text-purple-300">
                    {flRound.convergencePct !== null ? `${flRound.convergencePct}%` : '—'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${flRound.convergencePct ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Participating Nodes:</span>
                  <span className="font-semibold text-slate-200">
                    {show(
                      flRound.participatingNodes !== null && flRound.totalNodes !== null
                        ? `${flRound.participatingNodes} of ${flRound.totalNodes}`
                        : null
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Loss:</span>
                  <span className="font-mono text-emerald-400">{show(flRound.loss)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Round Completion:</span>
                  <span className="text-slate-300">
                    {show(flRound.etaMinutes !== null ? `~${flRound.etaMinutes} minutes` : null)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 text-center">
              <Cpu className="w-10 h-10 mx-auto text-slate-700 mb-2" />
              <div className="text-sm text-slate-400">No active FL round</div>
              <div className="text-xs text-slate-600 mt-1">
                Start a round from the orchestrator.
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate('fl_orchestration')}
            className="w-full py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/60 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            Open FL Orchestration
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};