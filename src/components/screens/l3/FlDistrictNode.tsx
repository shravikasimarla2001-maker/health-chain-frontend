import React from 'react';
import { Activity, Server, ShieldCheck, CheckCircle2, Lock, Cpu, RefreshCw, Layers, Globe2 } from 'lucide-react';

export const FlDistrictNode: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="fl-district-node-screen">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/60 text-amber-300 border border-amber-700/50">
            L3 Edge Node — Federated Learning
          </span>
          <span className="text-xs text-slate-400">NVIDIA FLARE Topology</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mt-2 flex items-center gap-2">
          <Activity className="w-6 h-6 text-amber-400" />
          Ranchi District Edge Node Telemetry & Privacy Engine
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          District acts as the primary data node. Patient records & raw stock logs never leave the district. Only encrypted gradient weights are transmitted to the State Aggregator for global fine-tuning.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Node Status</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE EDGE NODE
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">Heartbeat: 4s ago</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Local Validation Accuracy</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">94.2%</div>
          <div className="text-xs text-emerald-400 mt-1">+1.4% fine-tuned in Round #14</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Edge Resource Load</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">14% CPU</div>
          <div className="text-xs text-slate-400 mt-1">RAM: 1.8 GB / 8.0 GB</div>
        </div>
      </div>

      {/* FL Hierarchy Topology Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          Federated Architecture Pipeline (District &rarr; State &rarr; National)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-lg border border-amber-800/60 space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> 1. District Edge Node
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 border border-amber-800">Your Node</span>
            </div>
            <p className="text-slate-400">
              Trains local XGBoost / Prophet models on local PHC stock & patient OPD trends.
            </p>
            <div className="text-emerald-400 font-mono text-[11px] pt-1">
              ✓ Data Privacy Secured (Local Only)
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-indigo-800/60 space-y-2">
            <div className="flex items-center justify-between font-bold text-indigo-300">
              <span className="flex items-center gap-1.5">
                <Server className="w-4 h-4" /> 2. State Aggregator
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 border border-indigo-800">JH State</span>
            </div>
            <p className="text-slate-400">
              Receives anonymized model weight vectors from Ranchi, Bokaro, Ramgarh & Dhanbad.
            </p>
            <div className="text-indigo-400 font-mono text-[11px] pt-1">
              ✓ Weighted FedAvg Aggregation
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-blue-800/60 space-y-2">
            <div className="flex items-center justify-between font-bold text-blue-300">
              <span className="flex items-center gap-1.5">
                <Globe2 className="w-4 h-4" /> 3. National Global Aggregator
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 border border-blue-800">L1 Command</span>
            </div>
            <p className="text-slate-400">
              Aggregates state updates into Global Model v2.4 and broadcasts back to District nodes for local fine-tuning.
            </p>
            <div className="text-blue-400 font-mono text-[11px] pt-1">
              ✓ Global Sync Completed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
