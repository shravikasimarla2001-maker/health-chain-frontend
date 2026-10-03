import React, { useState, useEffect } from 'react';
import { BrainCircuit, RefreshCw, ShieldCheck, Layers } from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { FlStatusResponse, FlRoundDetailResponse } from '../../../types';

export const FlGlobalOverview: React.FC = () => {
  const [status, setStatus] = useState<FlStatusResponse | null>(null);
  const [rounds, setRounds] = useState<FlRoundDetailResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchFlStatus = async () => {
    setRefreshing(true);
    setFetchError(null);
    try {
      const [statusRes, roundsRes] = await Promise.all([
        healthChainApi.getFlStatus(),
        healthChainApi.listFlRounds({ page: 1, page_size: 10 }),
      ]);

      setStatus(statusRes);
      setRounds(roundsRes?.items ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch global FL status';
      setFetchError(msg);
      setStatus(null);
      setRounds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFlStatus();
  }, []);

  const activeRound = status?.active_round || rounds.find((r) => r.status?.toUpperCase() === 'RUNNING');
  const servingModel = status?.serving_model;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="fl-global-overview-screen">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Hierarchical FedAvg
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-400" />
            Global Federated Model Status &amp; Accuracy
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            National overview of AI demand prediction model accuracy, federated aggregation rounds, and participating nodes.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFlStatus}
          disabled={refreshing}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
          title="Refresh FL status"
          aria-label="Refresh FL status"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {fetchError && (
        <div className="p-4 rounded-xl border bg-rose-950/80 border-rose-700/60 text-rose-200 text-xs flex items-center justify-between">
          <span>{fetchError}</span>
          <button
            type="button"
            onClick={fetchFlStatus}
            className="text-xs font-semibold px-2 py-1 rounded border border-rose-700 hover:bg-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Global Forecast Accuracy</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {servingModel?.accuracy != null ? `${servingModel.accuracy.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-emerald-500 mt-1">
            {servingModel?.rmse != null ? `RMSE: ${servingModel.rmse}` : '—'}
            {servingModel?.loss != null ? ` | Loss: ${servingModel.loss.toFixed(3)}` : ''}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Active Aggregation Round</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            {activeRound ? `Round #${activeRound.round_number}` : 'None Active'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {activeRound?.status ? `Status: ${activeRound.status}` : 'Standby'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Participating Nodes</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            {activeRound?.participating_nodes_count != null && activeRound?.total_nodes_count != null
              ? `${activeRound.participating_nodes_count} / ${activeRound.total_nodes_count} Nodes`
              : status?.active_nodes_count != null
              ? `${status.active_nodes_count} Nodes`
              : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {activeRound?.convergence_rate != null ? `Convergence: ${activeRound.convergence_rate}%` : '—'}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Global Model Checkpoints
        </h2>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading checkpoints...</div>
        ) : rounds.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No federated learning checkpoints found on the backend.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {rounds.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-100">Round #{r.round_number}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    r.status?.toUpperCase() === 'COMPLETED'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                      : 'bg-purple-950/60 text-purple-300 border-purple-800'
                  }`}>
                    {r.status}
                  </span>
                  <span className="text-slate-400">
                    Nodes: {r.participating_nodes_count ?? '—'} / {r.total_nodes_count ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-emerald-400">
                    {r.global_accuracy != null ? `${r.global_accuracy.toFixed(1)}%` : '—'} accuracy
                  </span>
                  <span className="text-slate-500">
                    {r.started_at ? new Date(r.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlGlobalOverview;
