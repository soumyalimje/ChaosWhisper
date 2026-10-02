import React from 'react';
import { Activity, Shield, Hash, Gauge, Server } from 'lucide-react';

export default function MetricsPanel({ term, quorumCount, totalNodes, latency, leaderId, status }) {
  const quorumPercentage = Math.round((quorumCount / totalNodes) * 100);
  const isQuorumHealthy = quorumCount >= Math.floor(totalNodes / 2) + 1;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Raft Term Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-cyan-400" />
            Consensus Term
          </span>
          <div className="text-2xl font-mono font-bold text-slate-100 mt-1">
            TERM {term}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-mono font-bold">
          {term}
        </div>
      </div>

      {/* 2. Quorum State Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Cluster Quorum
          </span>
          <div className="text-2xl font-mono font-bold text-slate-100 mt-1 flex items-baseline gap-1.5">
            <span>{quorumCount}/{totalNodes}</span>
            <span className="text-xs text-slate-400 font-normal">({quorumPercentage}%)</span>
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold ${
            isQuorumHealthy
              ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-400'
              : 'bg-rose-950/40 border border-rose-800/60 text-rose-400 animate-pulse'
          }`}
        >
          {isQuorumHealthy ? 'OK' : 'LOST'}
        </div>
      </div>

      {/* 3. P99 Latency Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            P99 Latency
          </span>
          <div className="text-2xl font-mono font-bold text-slate-100 mt-1 flex items-baseline gap-1">
            <span>{latency}</span>
            <span className="text-xs text-slate-400 font-normal">ms</span>
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold ${
            latency > 200
              ? 'bg-amber-950/40 border border-amber-800/60 text-amber-400'
              : 'bg-slate-800/80 border border-slate-700 text-slate-300'
          }`}
        >
          <Activity className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Active Primary Leader */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            Active Primary
          </span>
          <div className="text-2xl font-mono font-bold text-slate-100 mt-1">
            {leaderId ? `NODE-${leaderId}` : 'NONE (VOTING)'}
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold ${
            leaderId
              ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-400'
              : 'bg-amber-950/40 border border-amber-800/60 text-amber-400 animate-spin'
          }`}
        >
          {leaderId ? `N${leaderId}` : '?'}
        </div>
      </div>
    </div>
  );
}
