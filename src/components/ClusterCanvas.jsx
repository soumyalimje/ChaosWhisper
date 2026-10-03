import React from 'react';
import { Crown, AlertTriangle, ShieldAlert, Cpu, Zap, Activity } from 'lucide-react';

export default function ClusterCanvas({ nodes, packets, isolatedNodes, onNodeClick, activeLeaderId, term, isDdosActive }) {
  const width = 680;
  const height = 480;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 175;

  // Calculate coordinates in a pentagon
  const getNodeCoordinates = (index, total = 5) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const nodeCoords = (nodes || []).map((n, i) => ({
    ...n,
    ...getNodeCoordinates(i, nodes.length)
  }));

  // Unique pairs of nodes for connection lines
  const connections = [];
  for (let i = 0; i < nodeCoords.length; i++) {
    for (let j = i + 1; j < nodeCoords.length; j++) {
      const from = nodeCoords[i];
      const to = nodeCoords[j];
      const isSevered =
        from.status === 'OFFLINE' ||
        to.status === 'OFFLINE' ||
        isolatedNodes.includes(from.id) ||
        isolatedNodes.includes(to.id);

      const isLeaderLine = from.id === activeLeaderId || to.id === activeLeaderId;

      connections.push({
        id: `${from.id}-${to.id}`,
        from,
        to,
        isSevered,
        isLeaderLine
      });
    }
  }

  return (
    <div className="relative w-full h-[520px] bg-gradient-to-b from-slate-950 via-[#070b14] to-slate-950 rounded-3xl border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden flex items-center justify-center p-4">
      {/* Background Cyberpunk Grid & Radial Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* SVG Canvas for High-Tech Laser Mesh and Flying Packets */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {/* Neon Glow Filters */}
          <filter id="neonGlowCyan" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neonGlowRed" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neonGlowEmerald" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <radialGradient id="centerCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="80%" stopColor="#0284c7" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Central Rotating Radar Rings */}
        <circle cx={centerX} cy={centerY} r="120" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 8" fill="none" opacity="0.4" />
        <circle cx={centerX} cy={centerY} r="75" fill="url(#centerCore)" />
        <circle cx={centerX} cy={centerY} r="45" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.6" className="animate-spin-slow" />
        <circle cx={centerX} cy={centerY} r="28" fill="#090d16" stroke={activeLeaderId ? '#10b981' : '#f59e0b'} strokeWidth="2" filter="url(#neonGlowCyan)" />

        {/* Central Core Text */}
        <text x={centerX} y={centerY - 4} textAnchor="middle" fill="#f1f5f9" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">
          RAFT
        </text>
        <text x={centerX} y={centerY + 10} textAnchor="middle" fill={activeLeaderId ? '#34d399' : '#fbbf24'} fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="600">
          TERM {term}
        </text>

        {/* Connection Laser Lines */}
        {connections.map((c) => {
          return (
            <g key={c.id}>
              {/* Underlying glow line */}
              <line
                x1={c.from.x}
                y1={c.from.y}
                x2={c.to.x}
                y2={c.to.y}
                stroke={c.isSevered ? '#f43f5e' : c.isLeaderLine ? '#06b6d4' : '#334155'}
                strokeWidth={c.isSevered ? 2 : c.isLeaderLine ? 2.5 : 1}
                strokeDasharray={c.isSevered ? '6 6' : 'none'}
                strokeOpacity={c.isSevered ? 0.6 : c.isLeaderLine ? 0.7 : 0.25}
                filter={c.isSevered ? 'url(#neonGlowRed)' : c.isLeaderLine ? 'url(#neonGlowCyan)' : undefined}
              />

              {/* Broken Cable Spark Icon */}
              {c.isSevered && (
                <g transform={`translate(${(c.from.x + c.to.x) / 2}, ${(c.from.y + c.to.y) / 2})`}>
                  <circle r="7" fill="#881337" stroke="#f43f5e" strokeWidth="1.5" />
                  <line x1="-3" y1="-3" x2="3" y2="3" stroke="#fff" strokeWidth="1.5" />
                  <line x1="3" y1="-3" x2="-3" y2="3" stroke="#fff" strokeWidth="1.5" />
                </g>
              )}
            </g>
          );
        })}

        {/* Flying Packets (Heartbeats & Raft Messages) */}
        {packets.map((pkt) => {
          const from = nodeCoords.find((n) => n.id === pkt.from);
          const to = nodeCoords.find((n) => n.id === pkt.to);
          if (!from || !to) return null;

          const currentX = from.x + (to.x - from.x) * pkt.progress;
          const currentY = from.y + (to.y - from.y) * pkt.progress;

          const packetColor =
            pkt.type === 'VOTE_REQUEST' ? '#f59e0b' :
            pkt.type === 'VOTE_GRANTED' ? '#10b981' :
            pkt.type === 'DDOS_FLOOD' ? '#f43f5e' :
            '#38bdf8';

          return (
            <g key={pkt.id}>
              {/* Outer Glow Halo */}
              <circle
                cx={currentX}
                cy={currentY}
                r={pkt.type === 'DDOS_FLOOD' ? 6 : 4}
                fill={packetColor}
                opacity="0.9"
                filter="url(#neonGlowCyan)"
              />
              {/* Inner Core Bright Dot */}
              <circle cx={currentX} cy={currentY} r="2" fill="#ffffff" />
            </g>
          );
        })}
      </svg>

      {/* Interactive HTML Node Badges */}
      <div className="relative w-[680px] h-[480px] pointer-events-auto">
        {nodeCoords.map((node) => {
          const isLeader = node.role === 'LEADER' && node.status !== 'OFFLINE';
          const isCandidate = node.role === 'CANDIDATE' && node.status !== 'OFFLINE';
          const isOffline = node.status === 'OFFLINE';
          const isIsolated = isolatedNodes.includes(node.id);

          return (
            <div
              key={node.id}
              onClick={() => onNodeClick(node.id)}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`group absolute cursor-pointer select-none transition-all duration-300 ${
                isOffline ? 'scale-90 opacity-70' : 'hover:scale-110 active:scale-95'
              }`}
            >
              {/* Outer Neon Aura for Leader */}
              {isLeader && (
                <div className="absolute -inset-4 rounded-3xl bg-emerald-500/25 blur-md animate-pulse" />
              )}
              {isCandidate && (
                <div className="absolute -inset-3 rounded-3xl bg-amber-500/20 blur-md animate-ping" />
              )}
              {isOffline && (
                <div className="absolute -inset-2 rounded-3xl bg-rose-500/20 blur-sm" />
              )}

              {/* Node Card Core */}
              <div
                className={`relative flex flex-col items-center justify-center w-28 h-28 rounded-2xl p-2 border backdrop-blur-xl shadow-2xl transition-all ${
                  isOffline
                    ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 shadow-rose-900/40'
                    : isLeader
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                    : isCandidate
                    ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-amber-500/30 ring-2 ring-amber-400/50'
                    : 'bg-slate-900/90 border-cyan-500/40 text-cyan-200 hover:border-cyan-400 shadow-cyan-500/20'
                }`}
              >
                {/* Role Icon Header */}
                <div className="flex items-center justify-center mb-1">
                  {isOffline ? (
                    <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
                  ) : isLeader ? (
                    <Crown className="w-6 h-6 text-emerald-300 animate-bounce" />
                  ) : isCandidate ? (
                    <AlertTriangle className="w-6 h-6 text-amber-300 animate-spin" />
                  ) : (
                    <Cpu className="w-6 h-6 text-cyan-300" />
                  )}
                </div>

                {/* Node Label */}
                <span className="text-xs font-mono font-bold tracking-wider text-slate-100">
                  SERVER-{node.id}
                </span>

                {/* Human-Readable Status Role */}
                <span
                  className={`mt-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-tight ${
                    isOffline
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                      : isLeader
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                      : isCandidate
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                      : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80'
                  }`}
                >
                  {isOffline ? 'CRASHED' : isLeader ? 'LEADER (BOSS)' : isCandidate ? 'VOTING...' : 'FOLLOWER'}
                </span>

                {/* Subtext info */}
                <div className="mt-1 flex items-center gap-1 text-[9px] font-mono text-slate-400">
                  <Activity className="w-2.5 h-2.5 text-cyan-400" />
                  <span>Log #{node.logsCount}</span>
                </div>

                {/* Term Counter Badge */}
                <div className="absolute -top-2 -right-2 bg-slate-900 border border-slate-700 text-cyan-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                  T:{node.term}
                </div>

                {/* Isolated Tag */}
                {isIsolated && !isOffline && (
                  <div className="absolute -bottom-2 bg-amber-500 text-slate-950 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                    ISOLATED
                  </div>
                )}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                <div className="bg-slate-900/95 border border-cyan-500/40 rounded-xl p-2.5 text-[11px] font-mono whitespace-nowrap shadow-2xl text-slate-200 backdrop-blur-md">
                  <div className="font-bold text-cyan-300">Server #{node.id} Details</div>
                  <div>Role: <span className={isLeader ? 'text-emerald-400' : isOffline ? 'text-rose-400' : 'text-slate-300'}>{isOffline ? 'OFFLINE (DEAD)' : node.role}</span></div>
                  <div>Raft Term: <span className="text-cyan-400">{node.term}</span></div>
                  <div>Committed Logs: <span className="text-amber-400">{node.logsCount}</span></div>
                  <div className="text-[10px] text-slate-400 mt-1 border-t border-slate-800 pt-1">Click node to crash or revive</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Overlay Badges */}
      <div className="absolute left-6 top-5 flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-slate-400">
        <span className={`h-2 w-2 rounded-full ${activeLeaderId ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-amber-400 animate-ping'}`} />
        <span>{activeLeaderId ? `LEADER ACTIVE · NODE-${activeLeaderId}` : 'LEADER DOWN · VOTING IN PROGRESS'}</span>
      </div>

      <div className="absolute right-6 top-5 flex items-center gap-2 text-[11px] font-mono text-cyan-400">
        <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>{isDdosActive ? '🚨 DDoS TRAFFIC FLOOD ACTIVE' : '5-NODE RAFT MESH'}</span>
      </div>
    </div>
  );
}
