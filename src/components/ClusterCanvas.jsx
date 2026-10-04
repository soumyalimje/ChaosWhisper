import React from 'react';
import { Crown, AlertTriangle, ShieldAlert, Cpu, Zap, Globe, Server, Database, Layers, Radio, Shield, DollarSign, Flame } from 'lucide-react';

export default function ClusterCanvas({
  nodes,
  packets,
  isolatedNodes,
  onNodeClick,
  activeLeaderId,
  term,
  isDdosActive,
  activeTopology = 'MICROSERVICES',
  onSelectTopology,
  microservices = [],
  cloudRegions = [],
  onServiceClick,
  onRegionClick,
  financialLossPerMin = 0,
  totalDowntimeLoss = 0
}) {
  const width = 720;
  const height = 520;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 180;

  // 1. RAFT TOPOLOGY COORDINATES
  const getNodeCoordinates = (index, total = 5) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const raftNodeCoords = (nodes || []).map((n, i) => ({
    ...n,
    ...getNodeCoordinates(i, nodes.length)
  }));

  // 2. MICROSERVICE MESH COORDINATES (Tier-1 E-Commerce Architecture)
  const servicePositions = {
    gateway: { x: centerX, y: 75 },
    auth: { x: centerX - 200, y: 180 },
    orders: { x: centerX, y: 210 },
    payments: { x: centerX + 200, y: 180 },
    database: { x: centerX, y: 360 },
    cache: { x: centerX - 190, y: 340 },
    kafka: { x: centerX + 190, y: 340 },
  };

  const microserviceLinks = [
    { from: 'gateway', to: 'auth' },
    { from: 'gateway', to: 'orders' },
    { from: 'orders', to: 'payments' },
    { from: 'orders', to: 'database' },
    { from: 'orders', to: 'cache' },
    { from: 'payments', to: 'kafka' },
    { from: 'database', to: 'kafka' },
  ];

  // 3. AWS GLOBAL CLOUD REGION COORDINATES (World-Map Style)
  const regionPositions = {
    'us-east-1': { x: 230, y: 180 },
    'us-west-2': { x: 120, y: 160 },
    'eu-west-1': { x: 420, y: 140 },
    'ap-south-1': { x: 520, y: 280 },
    'ap-northeast-1': { x: 620, y: 200 },
  };

  const regionLinks = [
    { from: 'us-west-2', to: 'us-east-1' },
    { from: 'us-east-1', to: 'eu-west-1' },
    { from: 'eu-west-1', to: 'ap-south-1' },
    { from: 'ap-south-1', to: 'ap-northeast-1' },
    { from: 'us-west-2', to: 'ap-northeast-1' },
  ];

  return (
    <div className="relative w-full h-[560px] bg-gradient-to-b from-slate-950 via-[#070b14] to-slate-950 rounded-3xl border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden flex flex-col justify-between p-4">
      {/* Background Cyberpunk Grid & Radial Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Bar: Interactive Architecture Switcher + Financial Loss Ticker */}
      <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-2.5 backdrop-blur-md">
        {/* Topology Selector Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {[
            { id: 'MICROSERVICES', label: 'Microservices Mesh (7)', icon: Layers },
            { id: 'GLOBAL_CLOUD', label: 'AWS Global Cloud (5)', icon: Globe },
            { id: 'RAFT_CLUSTER', label: 'Raft Consensus (5)', icon: Cpu },
          ].map((topo) => {
            const Icon = topo.icon;
            const active = activeTopology === topo.id;
            return (
              <button
                key={topo.id}
                onClick={() => onSelectTopology && onSelectTopology(topo.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{topo.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Financial Outage Loss Counter */}
        <div className="flex items-center gap-3 font-mono text-xs px-3 py-1 bg-slate-900/90 border border-rose-900/40 rounded-xl">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">Risk Rate:</span>
            <span className={`font-bold ${financialLossPerMin > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              ${financialLossPerMin.toLocaleString()}/min
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-[11px]">
            <span className="text-slate-500">Total Outage Loss:</span>
            <span className="text-amber-400 font-bold">${totalDowntimeLoss.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas for High-Tech Laser Mesh and Flying Packets */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <filter id="neonGlowCyan" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neonGlowRed" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neonGlowAmber" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ======================= VIEW 1: MICROSERVICES MESH ======================= */}
        {activeTopology === 'MICROSERVICES' && (
          <g>
            {/* Dependency connection lines */}
            {microserviceLinks.map((link) => {
              const p1 = servicePositions[link.from];
              const p2 = servicePositions[link.to];
              const s1 = microservices.find((s) => s.id === link.from);
              const s2 = microservices.find((s) => s.id === link.to);
              const isBroken = (s1 && s1.status === 'OFFLINE') || (s2 && s2.status === 'OFFLINE');
              const isBreakerTripped = (s1 && s1.breaker === 'TRIPPED') || (s2 && s2.breaker === 'TRIPPED');

              return (
                <g key={`${link.from}-${link.to}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isBroken ? '#f43f5e' : isBreakerTripped ? '#f59e0b' : '#0ea5e9'}
                    strokeWidth={isBroken ? 1 : isBreakerTripped ? 2 : 1.5}
                    strokeDasharray={isBroken ? '4 6' : isBreakerTripped ? '6 6' : 'none'}
                    opacity={isBroken ? 0.35 : 0.75}
                  />
                  {!isBroken && (
                    <circle r="2.5" fill={isBreakerTripped ? '#fbbf24' : '#38bdf8'} filter="url(#neonGlowCyan)">
                      <animateMotion
                        path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                        dur={isBreakerTripped ? '2.5s' : '1.4s'}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ======================= VIEW 2: GLOBAL CLOUD REGIONS ======================= */}
        {activeTopology === 'GLOBAL_CLOUD' && (
          <g>
            {regionLinks.map((link) => {
              const p1 = regionPositions[link.from];
              const p2 = regionPositions[link.to];
              const r1 = cloudRegions.find((r) => r.id === link.from);
              const r2 = cloudRegions.find((r) => r.id === link.to);
              const isSevered = (r1 && r1.status === 'OFFLINE') || (r2 && r2.status === 'OFFLINE');

              return (
                <g key={`${link.from}-${link.to}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isSevered ? '#f43f5e' : '#38bdf8'}
                    strokeWidth={isSevered ? 1 : 2}
                    strokeDasharray={isSevered ? '5 5' : 'none'}
                    opacity={isSevered ? 0.3 : 0.7}
                  />
                  {!isSevered && (
                    <circle r="3" fill="#38bdf8" filter="url(#neonGlowCyan)">
                      <animateMotion
                        path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ======================= VIEW 3: RAFT CONSENSUS CLUSTER ======================= */}
        {activeTopology === 'RAFT_CLUSTER' && (
          <g>
            <circle cx={centerX} cy={centerY} r="120" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 8" fill="none" opacity="0.4" />
            <circle cx={centerX} cy={centerY} r="75" fill="#090d16" stroke="#0284c7" strokeWidth="1" opacity="0.3" />
            <circle cx={centerX} cy={centerY} r="28" fill="#090d16" stroke={activeLeaderId ? '#10b981' : '#f59e0b'} strokeWidth="2" filter="url(#neonGlowCyan)" />
            <text x={centerX} y={centerY - 3} textAnchor="middle" fill="#f1f5f9" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">RAFT</text>
            <text x={centerX} y={centerY + 10} textAnchor="middle" fill={activeLeaderId ? '#34d399' : '#fbbf24'} fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="600">TERM {term}</text>

            {/* Raft connection lines */}
            {raftNodeCoords.map((from, i) =>
              raftNodeCoords.slice(i + 1).map((to) => {
                const isSevered = from.status === 'OFFLINE' || to.status === 'OFFLINE' || isolatedNodes.includes(from.id) || isolatedNodes.includes(to.id);
                return (
                  <line
                    key={`${from.id}-${to.id}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isSevered ? '#e11d48' : '#0284c7'}
                    strokeWidth={isSevered ? 1 : 1.5}
                    strokeDasharray={isSevered ? '4 6' : 'none'}
                    opacity={isSevered ? 0.25 : 0.6}
                  />
                );
              })
            )}

            {/* Flying Packets */}
            {packets.map((p) => {
              const src = raftNodeCoords.find((n) => n.id === p.from);
              const dst = raftNodeCoords.find((n) => n.id === p.to);
              if (!src || !dst) return null;
              const px = src.x + (dst.x - src.x) * p.progress;
              const py = src.y + (dst.y - src.y) * p.progress;
              return (
                <circle
                  key={p.id}
                  cx={px}
                  cy={py}
                  r={p.type === 'DDOS_FLOOD' ? 3.5 : 2.5}
                  fill={p.type === 'DDOS_FLOOD' ? '#ef4444' : '#38bdf8'}
                  filter={p.type === 'DDOS_FLOOD' ? 'url(#neonGlowRed)' : 'url(#neonGlowCyan)'}
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* ======================= HTML INTERACTIVE NODES LAYER ======================= */}
      <div className="relative w-full h-full pointer-events-auto">
        {/* 1. MICROSERVICES NODES */}
        {activeTopology === 'MICROSERVICES' &&
          microservices.map((svc) => {
            const pos = servicePositions[svc.id] || { x: 100, y: 100 };
            const isOffline = svc.status === 'OFFLINE';
            const isBreakerTripped = svc.breaker === 'TRIPPED';

            return (
              <div
                key={svc.id}
                onClick={() => onServiceClick && onServiceClick(svc.id)}
                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              >
                <div
                  className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 w-36 ${
                    isOffline
                      ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] opacity-75'
                      : isBreakerTripped
                      ? 'bg-amber-950/80 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/40 animate-pulse'
                      : 'bg-slate-900/90 border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-105'
                  }`}
                >
                  {/* Status Indicator Tag */}
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">{svc.role}</span>
                    <span
                      className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isOffline
                          ? 'bg-rose-500 text-slate-950'
                          : isBreakerTripped
                          ? 'bg-amber-500 text-slate-950 font-extrabold'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isOffline ? 'OFFLINE' : isBreakerTripped ? '⚡ TRIPPED' : 'HEALTHY'}
                    </span>
                  </div>

                  <span className="text-xs font-bold font-mono text-slate-100 text-center leading-tight truncate w-full">
                    {svc.name}
                  </span>

                  <div className="flex items-center justify-between w-full mt-2 text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-1">
                    <span>{svc.rps.toLocaleString()} RPS</span>
                    <span className={svc.latency > 50 ? 'text-amber-400 font-bold' : 'text-cyan-400'}>
                      {svc.latency}ms
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

        {/* 2. AWS GLOBAL CLOUD NODES */}
        {activeTopology === 'GLOBAL_CLOUD' &&
          cloudRegions.map((reg) => {
            const pos = regionPositions[reg.id] || { x: 100, y: 100 };
            const isOffline = reg.status === 'OFFLINE';

            return (
              <div
                key={reg.id}
                onClick={() => onRegionClick && onRegionClick(reg.id)}
                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              >
                <div
                  className={`p-3 rounded-2xl border transition-all duration-300 w-40 flex flex-col items-center ${
                    isOffline
                      ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] opacity-70'
                      : 'bg-slate-900/90 border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-105'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">{reg.role}</span>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isOffline ? 'bg-rose-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {isOffline ? 'BLACKOUT' : 'ROUTING'}
                    </span>
                  </div>

                  <span className="text-xs font-bold font-mono text-slate-100 text-center truncate w-full">
                    {reg.name}
                  </span>

                  <div className="flex items-center justify-between w-full mt-2 text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-1">
                    <span>{reg.trafficPct}% Traffic</span>
                    <span className="text-cyan-400">{reg.latency}ms</span>
                  </div>
                </div>
              </div>
            );
          })}

        {/* 3. RAFT CONSENSUS NODES */}
        {activeTopology === 'RAFT_CLUSTER' &&
          raftNodeCoords.map((node) => {
            const isLeader = activeLeaderId === node.id;
            const isOffline = node.status === 'OFFLINE';
            const isIsolated = isolatedNodes.includes(node.id);

            return (
              <div
                key={node.id}
                onClick={() => onNodeClick && onNodeClick(node.id)}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              >
                <div
                  className={`relative flex items-center justify-center w-20 h-20 rounded-3xl border-2 transition-all duration-300 ${
                    isOffline
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] opacity-70'
                      : isIsolated
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                      : isLeader
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-110 ring-4 ring-emerald-500/20'
                      : 'bg-slate-900/90 border-cyan-500/40 text-slate-200 hover:border-cyan-300 hover:scale-105'
                  }`}
                >
                  {isLeader && (
                    <Crown className="w-5 h-5 text-emerald-400 absolute -top-3 animate-bounce" />
                  )}

                  <div className="text-center font-mono">
                    <div className="text-xs font-bold">SRV-{node.id}</div>
                    <div className="text-[9px] text-slate-400">{isOffline ? 'OFFLINE' : node.role}</div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

    </div>
  );
}
