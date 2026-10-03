import React from 'react';
import { Activity, Shield, Hash, Gauge, Server, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function MetricsPanel({ term, quorumCount, totalNodes, latency, leaderId, isDdosActive }) {
  const quorumPercentage = Math.round((quorumCount / totalNodes) * 100);
  const isQuorumHealthy = quorumCount >= Math.floor(totalNodes / 2) + 1;

  return (
    <div className="space-y-3">
      {/* Dynamic Mission Control Crisis Banner */}
      <div
        className={`px-5 py-3 rounded-2xl border flex items-center justify-between transition-all duration-500 shadow-xl ${
          isDdosActive
            ? 'bg-red-950/70 border-red-500/80 text-red-200 shadow-red-950/50 animate-pulse'
            : !leaderId
            ? 'bg-amber-950/70 border-amber-500/80 text-amber-200 shadow-amber-950/50 animate-pulse'
            : !isQuorumHealthy
            ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-rose-950/60 animate-bounce'
            : 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border-emerald-500/40 text-emerald-200 shadow-emerald-950/30'
        }`}
      >
        <div className="flex items-center gap-3">
          {!leaderId || !isQuorumHealthy || isDdosActive ? (
            <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}

          <div>
            <div className="text-xs font-mono font-bold tracking-wider uppercase">
              {isDdosActive
                ? '🚨 EMERGENCY: SYNTHETIC DDoS TRAFFIC STORM ACTIVE'
                : !leaderId
                ? '⚡ CRISIS: PRIMARY LEADER DOWN · AUTOMATED ELECTION IN FLIGHT'
                : !isQuorumHealthy
                ? '🛑 CRITICAL FAULT: CLUSTER QUORUM LOST · DATA WRITES HALTED'
                : '🟢 MISSION STATUS: OPTIMAL · ALL 5 SERVERS SYNCHRONIZED'}
            </div>
            <div className="text-[11px] text-slate-300 font-sans">
              {isDdosActive
                ? 'Synthetic packet flood saturating RPC channels. High latency simulated.'
                : !leaderId
                ? 'Remaining servers are holding an emergency vote using the Raft consensus algorithm.'
                : !isQuorumHealthy
                ? 'Less than majority alive. Cannot achieve consensus safely.'
                : 'Raft consensus heartbeat pulse broadcasting every 1.8 seconds. Zero data loss.'}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400">SURVIVAL:</span>
          <span className={isQuorumHealthy ? 'text-emerald-400' : 'text-rose-400'}>
            {quorumCount}/{totalNodes} ({quorumPercentage}%)
          </span>
        </div>
      </div>

      {/* 4 Glassmorphism Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* 1. Raft Term Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              Consensus Term
            </span>
            <div className="text-2xl font-mono font-bold text-slate-100 mt-1">
              TERM {term}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Election Epoch</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-800/80 flex items-center justify-center text-cyan-300 font-mono font-bold text-base shadow-lg shadow-cyan-950/40">
            {term}
          </div>
        </div>

        {/* 2. Quorum State Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Cluster Quorum
            </span>
            <div className="text-2xl font-mono font-bold text-slate-100 mt-1 flex items-baseline gap-1.5">
              <span>{quorumCount}/{totalNodes}</span>
              <span className="text-xs text-slate-400 font-normal">Online</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Majority &ge; 3 servers</div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-xs shadow-lg ${
              isQuorumHealthy
                ? 'bg-emerald-950/50 border border-emerald-500/70 text-emerald-300 shadow-emerald-950/40'
                : 'bg-rose-950/60 border border-rose-500 text-rose-300 shadow-rose-950/50 animate-pulse'
            }`}
          >
            {isQuorumHealthy ? 'HEALTHY' : 'CRITICAL'}
          </div>
        </div>

        {/* 3. P99 Latency Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              P99 Latency
            </span>
            <div className="text-2xl font-mono font-bold text-slate-100 mt-1 flex items-baseline gap-1">
              <span>{latency}</span>
              <span className="text-xs text-slate-400 font-normal">ms</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">RPC response time</div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold shadow-lg ${
              latency > 150
                ? 'bg-amber-950/50 border border-amber-500/70 text-amber-300 shadow-amber-950/40 animate-pulse'
                : 'bg-slate-800/80 border border-slate-700 text-slate-300'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Active Primary Leader */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Active Primary
            </span>
            <div className="text-xl font-mono font-bold text-slate-100 mt-1">
              {leaderId ? `SERVER-${leaderId}` : 'ELECTING...'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Authoritative Leader</div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold shadow-lg ${
              leaderId
                ? 'bg-emerald-950/50 border border-emerald-500/70 text-emerald-300 shadow-emerald-950/40'
                : 'bg-amber-950/50 border border-amber-500/70 text-amber-300 shadow-amber-950/40 animate-spin'
            }`}
          >
            {leaderId ? `S${leaderId}` : '?'}
          </div>
        </div>
      </div>
    </div>
  );
}
