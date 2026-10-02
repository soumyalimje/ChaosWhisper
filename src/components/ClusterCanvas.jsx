import React from 'react';
import { Crown, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';

export default function ClusterCanvas({ nodes, packets, isolatedNodes, onNodeClick, activeLeaderId }) {
  // SVG canvas dimensions
  const width = 640;
  const height = 460;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 170;

  // Calculate coordinates in a pentagon
  const getNodeCoordinates = (index, total = 5) => {
    // Start at top (angle -PI/2)
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const nodeCoords = nodes.map((n, i) => ({
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
    <div className="relative w-full h-[480px] bg-slate-950/80 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden flex items-center justify-center p-4">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* SVG Canvas for Lines and Flying Packets */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id="leaderGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Connection Mesh Lines */}
        {connections.map((c) => {
          return (
            <g key={c.id}>
              <line
                x1={c.from.x}
                y1={c.from.y}
                x2={c.to.x}
                y2={c.to.y}
                stroke={c.isSevered ? '#f43f5e' : c.isLeaderLine ? '#38bdf8' : '#334155'}
                strokeWidth={c.isSevered ? 1.5 : c.isLeaderLine ? 2 : 1}
                strokeDasharray={c.isSevered ? '6 6' : 'none'}
                strokeOpacity={c.isSevered ? 0.35 : c.isLeaderLine ? 0.5 : 0.25}
              />
              {c.isSevered && (
                <circle
                  cx={(c.from.x + c.to.x) / 2}
                  cy={(c.from.y + c.to.y) / 2}
                  r="3.5"
                  fill="#f43f5e"
                  opacity="0.8"
                />
              )}
            </g>
          );
        })}

        {/* Traveling Message Packets (Raft Heartbeats & RPCs) */}
        {packets.map((pkt) => {
          const from = nodeCoords.find((n) => n.id === pkt.from);
          const to = nodeCoords.find((n) => n.id === pkt.to);
          if (!from || !to) return null;

          const currentX = from.x + (to.x - from.x) * pkt.progress;
          const currentY = from.y + (to.y - from.y) * pkt.progress;

          const packetColor =
            pkt.type === 'VOTE_REQUEST' ? '#f59e0b' :
            pkt.type === 'VOTE_GRANTED' ? '#10b981' :
            '#38bdf8';

          return (
            <circle
              key={pkt.id}
              cx={currentX}
              cy={currentY}
              r={pkt.type === 'HEARTBEAT' ? 3.5 : 5}
              fill={packetColor}
              filter="url(#glow)"
            />
          );
        })}

        {/* Central Cluster Hub Indicator */}
        <circle cx={centerX} cy={centerY} r="60" fill="url(#leaderGlow)" />
        <circle cx={centerX} cy={centerY} r="30" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.4" />
      </svg>

      {/* Interactive Node Badges (HTML Overlay) */}
      <div className="relative w-[640px] h-[460px] pointer-events-auto">
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
                isOffline ? 'opacity-60 scale-95' : 'hover:scale-110 active:scale-95'
              }`}
            >
              {/* Outer Pulse Ring for Leader */}
              {isLeader && (
                <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
              )}
              {isCandidate && (
                <div className="absolute -inset-2 rounded-full bg-amber-500/20 animate-pulse" />
              )}

              {/* Node Card Core */}
              <div
                className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl p-2 border backdrop-blur-md shadow-xl transition-all ${
                  isOffline
                    ? 'bg-rose-950/40 border-rose-800/60 shadow-rose-900/20'
                    : isLeader
                    ? 'bg-emerald-950/50 border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                    : isCandidate
                    ? 'bg-amber-950/50 border-amber-500 shadow-amber-500/20 ring-2 ring-amber-500/40'
                    : 'bg-slate-900/90 border-slate-700 hover:border-cyan-500/60 shadow-cyan-500/10'
                }`}
              >
                {/* Role Icon */}
                <div className="mb-1 flex items-center justify-center">
                  {isOffline ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  ) : isLeader ? (
                    <Crown className="w-5 h-5 text-emerald-400 animate-bounce" />
                  ) : isCandidate ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 animate-spin" />
                  ) : (
                    <Cpu className="w-5 h-5 text-cyan-400" />
                  )}
                </div>

                {/* Node Label */}
                <span className="text-xs font-bold font-mono tracking-wider text-slate-100">
                  NODE-{node.id}
                </span>

                {/* Status Badge */}
                <span
                  className={`mt-1 text-[10px] px-1.5 py-0.5 rounded font-mono font-medium tracking-tight ${
                    isOffline
                      ? 'bg-rose-500/20 text-rose-300'
                      : isLeader
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : isCandidate
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {node.status === 'OFFLINE' ? 'DEAD' : node.role}
                </span>

                {/* Term Counter indicator */}
                <div className="absolute -top-1.5 -right-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-mono px-1 rounded-full">
                  T:{node.term}
                </div>

                {isIsolated && (
                  <div className="absolute -bottom-1 bg-amber-600 text-slate-900 text-[8px] font-bold px-1 rounded">
                    ISOLATED
                  </div>
                )}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] font-mono whitespace-nowrap shadow-2xl text-slate-200">
                  <div>Status: <span className={isOffline ? 'text-rose-400' : 'text-emerald-400'}>{node.status}</span></div>
                  <div>Raft Term: <span className="text-cyan-400">{node.term}</span></div>
                  <div>Log Entries: <span className="text-amber-400">{node.logsCount}</span></div>
                  <div className="text-[9px] text-slate-400 mt-1">Click to toggle crash/revive</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
