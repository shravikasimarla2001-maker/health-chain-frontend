import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Play,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Layers,
  X,
  CheckCircle2,
  Server,
  ShieldCheck,
  Eye,
  Ban,
  Activity,
  Award,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import {
  FlRoundDetailResponse,
  FlModelResponse,
  FlStatusResponse,
} from '../../../types';

export const FlOrchestration: React.FC = () => {
  // ===================== STATE =====================
  const [statusSummary, setStatusSummary] = useState<FlStatusResponse | null>(null);
  const [rounds, setRounds] = useState<FlRoundDetailResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'ROUNDS' | 'SERVING_MODEL'>('ROUNDS');

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Selected round for detailed modal
  const [selectedRoundDetail, setSelectedRoundDetail] = useState<FlRoundDetailResponse | null>(null);
  const [loadingRoundDetail, setLoadingRoundDetail] = useState<boolean>(false);

  // Selected model for metadata inspection
  const [inspectedModel, setInspectedModel] = useState<FlModelResponse | null>(null);
  const [loadingModel, setLoadingModel] = useState<boolean>(false);

  // Check if active round exists
  const activeRound = statusSummary?.active_round || rounds.find((r) => r.status?.toUpperCase() === 'RUNNING') || null;
  const isRunning = activeRound?.status?.toUpperCase() === 'RUNNING';

  // ===================== FETCH DATA =====================
  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setActionError(null);
    try {
      const [statusRes, roundsRes] = await Promise.all([
        healthChainApi.getFlStatus(),
        healthChainApi.listFlRounds({ page: 1, page_size: 20 }),
      ]);

      setStatusSummary(statusRes);
      setRounds(roundsRes?.items ?? []);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch FL rounds';
      setFetchError(msg);
      setStatusSummary(null);
      setRounds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===================== TRIGGER NEW ROUND =====================
  const handleTriggerRound = async () => {
    setActionError(null);
    setActionSuccess(null);
    setActionLoading('trigger');
    try {
      const triggeredRes = await healthChainApi.triggerFlRound();
      setActionSuccess(triggeredRes.message || `Round #${triggeredRes.round_number} initiated successfully.`);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to trigger FL round';
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // ===================== ABANDON STUCK ROUND (Super Admin) =====================
  const handleAbandonRound = async (roundId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setActionLoading(`abandon-${roundId}`);
    try {
      await healthChainApi.abandonFlRound(roundId);
      setActionSuccess(`Round ${roundId.slice(0, 8)}... marked as ABANDONED.`);
      await fetchData();
      if (selectedRoundDetail?.id === roundId) {
        setSelectedRoundDetail(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to abandon round';
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // ===================== INSPECT ROUND DETAIL =====================
  const handleViewRoundDetail = async (round: FlRoundDetailResponse) => {
    setLoadingRoundDetail(true);
    setSelectedRoundDetail(round);
    try {
      const detail = await healthChainApi.getFlRoundDetail(round.id);
      setSelectedRoundDetail(detail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load round details';
      setActionError(msg);
    } finally {
      setLoadingRoundDetail(false);
    }
  };

  // ===================== INSPECT MODEL METADATA =====================
  const handleViewModelDetail = async (modelId: string) => {
    setLoadingModel(true);
    try {
      const model = await healthChainApi.getFlModel(modelId);
      setInspectedModel(model);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load model metadata';
      setActionError(msg);
    } finally {
      setLoadingModel(false);
    }
  };

  const servingModel = statusSummary?.serving_model ?? null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="fl-orchestration-screen">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              Hierarchical FedAvg Engine
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Federated Learning Training &amp; Orchestration
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Trigger hierarchical federated learning rounds across tiers, monitor model checkpoints,
            and inspect differential privacy metadata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh FL status and rounds"
            aria-label="Refresh FL rounds"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleTriggerRound}
            disabled={actionLoading !== null || isRunning}
            className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'trigger' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Dispatching Round...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Trigger New Round
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Success / Error Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl border bg-emerald-950/80 border-emerald-700/60 text-emerald-200 text-xs flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl border bg-rose-950/80 border-rose-700/60 text-rose-200 text-xs flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <div className="font-semibold">Action Error</div>
              <div className="text-rose-300 mt-0.5">{actionError}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sticky Fetch Error Banner */}
      {fetchError && (
        <div
          role="alert"
          className="p-4 rounded-xl border bg-rose-950/80 border-rose-700/60 text-rose-200 text-xs flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-100">Failed to load FL rounds</div>
              <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="text-rose-300 hover:text-rose-100 text-xs font-semibold px-2 py-1 rounded border border-rose-700/60 hover:bg-rose-900/40"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Training Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Orchestrator State</span>
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            {isRunning ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span>TRAINING</span>
              </>
            ) : statusSummary?.system_status ? (
              <span className="text-slate-300 font-medium uppercase">{statusSummary.system_status}</span>
            ) : (
              <span className="text-slate-500 font-medium">—</span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {activeRound ? (
              `Round #${activeRound.round_number} running`
            ) : statusSummary?.total_rounds_completed != null ? (
              `Completed rounds: ${statusSummary.total_rounds_completed}`
            ) : (
              '—'
            )}
          </div>
        </div>

        {/* Global Forecast Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Global Accuracy</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            {servingModel?.accuracy != null ? `${servingModel.accuracy.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-emerald-500/90 mt-2">
            {servingModel?.loss != null ? `Loss: ${servingModel.loss.toFixed(3)}` : '—'}
          </div>
        </div>

        {/* Serving Model Checkpoint */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Serving Global Model</span>
            <Award className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base font-bold text-slate-100 mt-2 truncate">
            {servingModel?.model_version || 'None Active'}
          </div>
          {servingModel?.id && (
            <button
              type="button"
              onClick={() => handleViewModelDetail(servingModel.id)}
              className="text-xs text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1 font-medium"
            >
              <Eye className="w-3 h-3" />
              Inspect model metadata
            </button>
          )}
        </div>

        {/* Connected Edge Nodes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Participating Nodes</span>
            <Server className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 mt-2">
            {activeRound?.participating_nodes_count != null && activeRound?.total_nodes_count != null ? (
              `${activeRound.participating_nodes_count} / ${activeRound.total_nodes_count}`
            ) : statusSummary?.active_nodes_count != null ? (
              `${statusSummary.active_nodes_count} Nodes`
            ) : (
              '—'
            )}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {activeRound?.convergence_rate != null ? `Convergence: ${activeRound.convergence_rate}%` : '—'}
          </div>
        </div>
      </div>

      {/* Active / Stuck Round Super Admin Emergency Banner */}
      {activeRound && (
        <div className="bg-purple-950/40 border border-purple-800/80 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
              </span>
              ACTIVE FEDERATED TRAINING ROUND #{activeRound.round_number}
            </div>
            <p className="text-xs text-slate-300">
              Convergence rate: <span className="font-mono text-purple-300">{activeRound.convergence_rate != null ? `${activeRound.convergence_rate}%` : '—'}</span>.
              {activeRound.started_at && ` Started: ${new Date(activeRound.started_at).toLocaleTimeString()}.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleViewRoundDetail(activeRound)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Live Tier Metrics
            </button>
            <button
              type="button"
              onClick={() => handleAbandonRound(activeRound.id)}
              disabled={actionLoading === `abandon-${activeRound.id}`}
              className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-semibold border border-rose-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Super Admin recovery for stuck or unresponsive rounds"
            >
              <Ban className="w-3.5 h-3.5" />
              Abandon Stuck Round
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 space-x-6 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('ROUNDS')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'ROUNDS'
              ? 'border-b-2 border-purple-500 text-purple-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Historical Rounds ({rounds.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('SERVING_MODEL');
            if (servingModel?.id) {
              handleViewModelDetail(servingModel.id);
            }
          }}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'SERVING_MODEL'
              ? 'border-b-2 border-purple-500 text-purple-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Active Model Metadata
        </button>
      </div>

      {/* TAB 1: HISTORICAL ROUNDS TABLE */}
      {activeTab === 'ROUNDS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Federated Round Registry &amp; Model Checkpoints
            </h2>
            <span className="text-xs text-slate-500">
              Differential Privacy Enforced
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              Loading FL rounds...
            </div>
          ) : rounds.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              No historical FL rounds found on the backend. Click &quot;Trigger New Round&quot; above to initiate training.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Round</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Loss</th>
                    <th className="py-3 px-4">Participating Nodes</th>
                    <th className="py-3 px-4">Initiated</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rounds.map((r) => {
                    const isRoundRunning = r.status?.toUpperCase() === 'RUNNING';
                    const isCompleted = r.status?.toUpperCase() === 'COMPLETED';

                    return (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                          Round #{r.round_number}
                          {isRoundRunning && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              isCompleted
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                : isRoundRunning
                                ? 'bg-purple-950/60 text-purple-300 border-purple-800 animate-pulse'
                                : 'bg-rose-950/60 text-rose-300 border-rose-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {r.global_accuracy != null ? `${r.global_accuracy.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {r.global_loss != null ? r.global_loss.toFixed(3) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="font-semibold text-slate-100">
                            {r.participating_nodes_count ?? '—'}
                          </span>
                          <span className="text-slate-500"> / {r.total_nodes_count ?? '—'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {r.started_at ? new Date(r.started_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {r.duration_seconds != null
                            ? `${Math.round(r.duration_seconds / 60)}m ${r.duration_seconds % 60}s`
                            : isRoundRunning
                            ? 'In progress'
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewRoundDetail(r)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs border border-slate-700 flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3 text-purple-400" />
                              Details
                            </button>
                            {isRoundRunning && (
                              <button
                                type="button"
                                onClick={() => handleAbandonRound(r.id)}
                                disabled={actionLoading === `abandon-${r.id}`}
                                className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded text-xs border border-rose-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                                title="Abandon stuck round"
                              >
                                <Ban className="w-3 h-3" />
                                Abandon
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SERVING MODEL METADATA */}
      {activeTab === 'SERVING_MODEL' && (
        <div className="space-y-6">
          {!servingModel ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-500 text-xs">
              No serving model checkpoint active on the backend.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Active in Production
                  </span>
                  <h2 className="text-lg font-bold text-slate-100 mt-2 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-400" />
                    {servingModel.model_version}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    ID: <span className="font-mono text-slate-300">{servingModel.id}</span>
                    {servingModel.round_number != null && ` | Round #${servingModel.round_number}`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Deployed</span>
                  <div className="text-sm font-semibold text-slate-200 mt-0.5">
                    {servingModel.created_at ? new Date(servingModel.created_at).toLocaleString() : '—'}
                  </div>
                </div>
              </div>

              {/* Architecture & Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-500">Model Architecture</span>
                  <div className="font-semibold text-slate-200 text-sm mt-1">
                    {servingModel.model_architecture || '—'}
                  </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-500">Trainable Parameters</span>
                  <div className="font-semibold text-slate-200 text-sm mt-1 font-mono">
                    {servingModel.parameters_count != null ? servingModel.parameters_count.toLocaleString() : '—'}
                  </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-500">Differential Privacy Guarantee</span>
                  <div className="font-semibold text-purple-300 text-sm mt-1 font-mono">
                    ε = {servingModel.differential_privacy_epsilon ?? '—'}, δ = {servingModel.differential_privacy_delta ?? '—'}
                  </div>
                </div>
              </div>

              {/* Evaluation Metrics */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Validation Performance
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500">MAE</span>
                    <div className="text-lg font-bold text-slate-100 font-mono mt-1">
                      {servingModel.mae != null ? servingModel.mae : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500">RMSE</span>
                    <div className="text-lg font-bold text-slate-100 font-mono mt-1">
                      {servingModel.rmse != null ? servingModel.rmse : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500">Loss</span>
                    <div className="text-lg font-bold text-slate-100 font-mono mt-1">
                      {servingModel.loss != null ? servingModel.loss.toFixed(3) : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500">Accuracy</span>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                      {servingModel.accuracy != null ? `${servingModel.accuracy.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Round Detail Modal */}
      {selectedRoundDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-100">
                    Round #{selectedRoundDetail.round_number} Details
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                    {selectedRoundDetail.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ID: <span className="font-mono text-slate-300">{selectedRoundDetail.id}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRoundDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingRoundDetail ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                Loading round metrics from backend...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500">Global Accuracy</span>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {selectedRoundDetail.global_accuracy != null ? `${selectedRoundDetail.global_accuracy.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500">Global Loss</span>
                    <div className="text-base font-bold text-slate-200 mt-0.5">
                      {selectedRoundDetail.global_loss != null ? selectedRoundDetail.global_loss.toFixed(3) : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500">Participating Nodes</span>
                    <div className="text-base font-bold text-slate-200 mt-0.5">
                      {selectedRoundDetail.participating_nodes_count != null ? `${selectedRoundDetail.participating_nodes_count} / ${selectedRoundDetail.total_nodes_count ?? '—'}` : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500">Convergence Rate</span>
                    <div className="text-base font-bold text-purple-400 mt-0.5">
                      {selectedRoundDetail.convergence_rate != null ? `${selectedRoundDetail.convergence_rate}%` : '—'}
                    </div>
                  </div>
                </div>

                {selectedRoundDetail.node_models && selectedRoundDetail.node_models.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                      Node Model Submissions ({selectedRoundDetail.node_models.length})
                    </h3>
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
                      {selectedRoundDetail.node_models.map((nm) => (
                        <div key={nm.id} className="p-3 bg-slate-950/60 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-200">
                              {nm.node_name || nm.node_id}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Tier: <span className="uppercase text-slate-400">{nm.tier}</span> | Samples: {nm.samples_count != null ? nm.samples_count.toLocaleString() : '—'}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-mono text-emerald-400 font-bold">
                                {nm.accuracy != null ? `${nm.accuracy}% acc` : '—'}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                loss: {nm.loss != null ? nm.loss : '—'}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                              {nm.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 rounded-lg text-xs text-slate-500 text-center">
                    No per-node model submissions recorded for this round.
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <span className="text-xs text-slate-500">
                {selectedRoundDetail.started_at ? `Started: ${new Date(selectedRoundDetail.started_at).toLocaleString()}` : ''}
              </span>

              <div className="flex items-center gap-2">
                {selectedRoundDetail.status?.toUpperCase() === 'RUNNING' && (
                  <button
                    type="button"
                    onClick={() => handleAbandonRound(selectedRoundDetail.id)}
                    className="px-3 py-1.5 bg-rose-950 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold hover:bg-rose-900 transition-colors"
                  >
                    Abandon Round
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedRoundDetail(null)}
                  className="px-4 py-1.5 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Metadata Modal */}
      {inspectedModel && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  Model Checkpoint Metadata
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Version: <span className="font-semibold text-slate-200">{inspectedModel.model_version}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedModel(null)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Model ID</span>
                  <div className="font-mono text-slate-200 break-all mt-1">{inspectedModel.id}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Originating Round</span>
                  <div className="font-semibold text-purple-400 mt-1">
                    {inspectedModel.round_number != null ? `Round #${inspectedModel.round_number}` : '—'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                <span className="text-slate-500">Architecture Definition</span>
                <div className="font-semibold text-slate-200 text-sm">
                  {inspectedModel.model_architecture || '—'}
                </div>
                <div className="text-slate-400">
                  Parameters: <span className="font-mono text-slate-200">{inspectedModel.parameters_count != null ? inspectedModel.parameters_count.toLocaleString() : '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Validation Accuracy</span>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {inspectedModel.accuracy != null ? `${inspectedModel.accuracy}%` : '—'}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Validation Loss</span>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {inspectedModel.loss != null ? inspectedModel.loss : '—'}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Serving Status</span>
                  <div className="text-base font-bold text-teal-400 mt-0.5">
                    {inspectedModel.is_active_serving ? 'ACTIVE' : 'STANDBY'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setInspectedModel(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
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
