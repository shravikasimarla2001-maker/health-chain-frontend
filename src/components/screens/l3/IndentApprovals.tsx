import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { INITIAL_INDENTS } from '../../../data/mockAppData';
import { IndentRequest } from '../../../types';

export const IndentApprovals: React.FC = () => {
  const [indents, setIndents] = useState<IndentRequest[]>(INITIAL_INDENTS);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const getApprovalMatrixLevel = (qty: number, isEmergency?: boolean) => {
    if (isEmergency) {
      return { label: '⚡ Emergency (Pre-Approved)', color: 'bg-red-950 text-red-300 border-red-800' };
    }
    if (qty < 200) {
      return { label: '🟢 <5% Supplier Stock (Peer-Only Approval)', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
    }
    if (qty <= 500) {
      return { label: '🟡 5-15% Supplier Stock (Peer + Supervisor Approval)', color: 'bg-amber-950 text-amber-300 border-amber-800' };
    }
    return { label: '🔴 >15% Supplier Stock (Peer + National Approval)', color: 'bg-purple-950 text-purple-300 border-purple-800' };
  };

  const handleApprove = (id: string, qty: number) => {
    setIndents(
      indents.map((i) =>
        i.id === id ? { ...i, status: 'APPROVED', approvedQty: qty } : i
      )
    );
    setActionMsg(`Indent ${id} approved for ${qty} units. District warehouse dispatch initiated.`);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleReject = (id: string) => {
    setIndents(indents.map((i) => (i.id === id ? { ...i, status: 'REJECTED' } : i)));
    setActionMsg(`Indent ${id} rejected.`);
    setTimeout(() => setActionMsg(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="indent-approvals-screen">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-amber-400" />
          PHC Stock Indent Requisitions & Approval Matrix
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review PULL (Demand-Driven) and PUSH (Forecast-Driven) stock requisitions submitted by PHCs using the National Approval Matrix (&lt;5% Peer, 5-15% Peer+Supervisor, &gt;15% Peer+National, Emergency Pre-Approved).
        </p>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {actionMsg}
        </div>
      )}

      {/* Approval Matrix Legend Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
        <div className="font-semibold text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          National Supply Chain Approval Matrix Rules:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono">
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-300">
            &lt;5% Stock: Peer Only
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-amber-300">
            5-15% Stock: Peer + Supervisor
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-purple-300">
            &gt;15% Stock: Peer + National
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-red-300">
            Emergency: Pre-Approved
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {indents.map((indent) => {
          const matrixInfo = getApprovalMatrixLevel(
            indent.requestedQty,
            indent.urgency === 'EMERGENCY'
          );
          const isPushMode = indent.indentNumber.includes('PUSH');

          return (
            <div key={indent.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded">
                    {indent.indentNumber}
                  </span>
                  <span className="font-semibold text-slate-100 text-sm">{indent.phcName}</span>

                  {/* Mode Badge */}
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${isPushMode ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-blue-950 text-blue-300 border-blue-800'}`}>
                    {isPushMode ? 'PUSH (Forecast-Driven)' : 'PULL (Demand-Driven)'}
                  </span>

                  {/* Matrix Rule Tag */}
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${matrixInfo.color}`}>
                    {matrixInfo.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Date: {indent.createdAt}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-semibold border ${
                      indent.status === 'APPROVED' || indent.status === 'DELIVERED'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                        : indent.status === 'REJECTED'
                        ? 'bg-red-950/60 text-red-400 border-red-800'
                        : 'bg-amber-950/60 text-amber-300 border-amber-800'
                    }`}
                  >
                    {indent.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500">Requested Medicine:</span>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">{indent.drugName}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{indent.drugCode}</div>
                </div>

                <div>
                  <span className="text-slate-500">PHC Requested Quantity:</span>
                  <div className="text-base font-bold text-amber-400 mt-0.5">{indent.requestedQty.toLocaleString()} units</div>
                </div>

                <div>
                  <span className="text-slate-500">AI Recommended Buffer:</span>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">{indent.recommendedQty.toLocaleString()} units</div>
                </div>
              </div>

              {indent.notes && (
                <div className="text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
                  <strong>Justification Note:</strong> {indent.notes}
                </div>
              )}

              {indent.status === 'PENDING' ? (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleReject(indent.id)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    Reject Requisition
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(indent.id, indent.requestedQty)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Indent ({indent.requestedQty})
                  </button>
                </div>
              ) : (
                <div className="text-right text-xs text-slate-400 pt-1">
                  Approved Quantity: <strong className="text-emerald-400">{indent.approvedQty || indent.requestedQty} units</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
