import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Play,
  Square,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Layers,
  X,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { FlRound } from '../../../types';

export const FlOrchestration: React.FC = () => {
  // ===================== STATE =====================
  const [rounds, setRounds] = useState<FlRound[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ROUNDS' | 'NODES' | 'HYPERPARAMS'>('ROUNDS');

  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentRound = rounds[0] ?? null;

  // ===================== FETCH =====================
  const fetchRounds = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: replace with real endpoint when available:
      // const res = await healthChainApi.getFlRounds();
      // setRounds(res.items ?? []);
      // setIsRunning(res.currentRoundStatus === 'IN_PROGRESS');
      setRounds([]);
      setIsRunning(false);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch FL rounds';
      setRounds([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  // ===================== ROUND CONTROLS =====================
  const handleToggleRound = async () => {
    if (!currentRound) return;
    setActionError(null);
    setActionLoading(isRunning ? 'pause' : 'resume');
    try {
      if (isRunning) {
        // TODO: await healthChainApi.pauseFlRound(currentRound.roundNumber)
        setIsRunning(false);
      } else {
        // TODO: await healthChainApi.resumeFlRound(currentRound.roundNumber)
        setIsRunning(true);
      }
      // Optimistically update local list (will be overwritten by next fetch)
      setRounds((prev) =>
        prev.map((r, idx) =>
          idx === 0
            ? { ...r, status: isRunning ? 'PAUSED' : 'IN_PROGRESS' }
            : r
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle FL round';
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualRefresh = async () => {
    await fetchRounds();
  };

  const hasRounds = rounds.length > 0;

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="fl-orchestration-screen">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-800">
              FedAvg Orchestration Engine
            </span>
            <span className="text-xs text-slate-400">
              Differential Privacy (ε=1.2, δ=1e-5)
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Federated Learning Training & Aggregation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Decentralized demand forecasting and stock-out risk model trained collaboratively
            across edge hospital nodes without raw patient data leaving facilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh rounds"
            aria-label="Refresh FL rounds"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleToggleRound}
            disabled={!currentRound || actionLoading !== null}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {actionLoading === 'pause' || actionLoading === 'resume' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Working...
              </>
            ) : isRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> Pause Round
                {currentRound ? ` #${currentRound.roundNumber}` : ''}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Resume Training
              </>
            )}
          </button>
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
            <div className="font-semibold text-rose-100">Failed to load FL rounds</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
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

      {/* ===== Action Error Banner ===== */}
      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl border bg-amber-950/70 border-amber-700/60 text-amber-200 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-100">Action failed</div>
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

      {/* ===== Loading State ===== */}
      {loading && !hasRounds && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          Loading FL rounds...
        </div>
      )}

      {/* ===== Empty State ===== */}
      {!loading && !hasRounds && !fetchError && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <Layers className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <div className="text-sm font-semibold text-slate-300">No FL rounds available</div>
          <div className="text-xs text-slate-500 mt-1">
            Start a federated training round from the orchestrator to see metrics here.
          </div>
        </div>
      )}

      {/* ===== Round KPI Cards ===== */}
      {hasRounds && currentRound && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-400">Current Round Status</div>
            <div className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
              Round #{currentRound.roundNumber}
              <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800 font-normal">
                {isRunning ? 'IN_PROGRESS' : 'PAUSED'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Started: {currentRound.startTime || '—'}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-400">Global Model Accuracy</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {currentRound.globalAccuracy !== null && currentRound.globalAccuracy !== undefined
                ? `${currentRound.globalAccuracy}%`
                : <span className="text-slate-600">—</span>}
            </div>
            <div className="text-xs text-emerald-500 mt-2">
              {currentRound.globalAccuracy !== null && currentRound.globalAccuracy !== undefined
                ? 'Target benchmark: >90%'
                : 'No accuracy data'}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-400">
              Categorical Cross-Entropy Loss
            </div>
            <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
              {currentRound.loss !== null && currentRound.loss !== undefined
                ? currentRound.loss
                : <span className="text-slate-600">—</span>}
            </div>
            <div className="text-xs text-slate-400 mt-2">Downward trajectory</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-400">Node Participation</div>
            <div className="text-xl font-bold text-slate-100 mt-1">
              {currentRound.participatingNodes !== null && currentRound.totalNodes !== null ? (
                <>
                  {currentRound.participatingNodes} / {currentRound.totalNodes} Nodes
                </>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {currentRound.participatingNodes !== null && currentRound.totalNodes !== null
                ? `${((currentRound.participatingNodes / currentRound.totalNodes) * 100).toFixed(1)}% quorum reached`
                : 'No participation data'}
            </div>
          </div>
        </div>
      )}

      {/* ===== Progress & Convergence bar ===== */}
      {hasRounds && currentRound && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Current Round Aggregation Convergence
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gradient weight vector verification and secure multi-party computation check
              </p>
            </div>
            <span className="text-sm font-bold text-purple-400 font-mono">
              {currentRound.convergenceProgress ?? 0}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 transition-all duration-500"
              style={{ width: `${currentRound.convergenceProgress ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* ===== Round History Table ===== */}
      {hasRounds && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Federated Round History & Model Checkpoints
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Round</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Global Accuracy</th>
                  <th className="py-3 px-4">Loss</th>
                  <th className="py-3 px-4">Participating Nodes</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rounds.map((r) => (
                  <tr key={r.roundNumber} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-100">
                      Round #{r.roundNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : r.status === 'IN_PROGRESS'
                            ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {r.globalAccuracy !== null && r.globalAccuracy !== undefined
                        ? `${r.globalAccuracy}%`
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {r.loss !== null && r.loss !== undefined
                        ? r.loss
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {r.participatingNodes !== null && r.totalNodes !== null
                        ? `${r.participatingNodes} / ${r.totalNodes}`
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {r.startTime || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {r.completedTime || (r.status === 'IN_PROGRESS' ? 'Ongoing...' : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};