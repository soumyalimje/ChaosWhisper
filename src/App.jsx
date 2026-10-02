import React, { useState, useEffect, useCallback, useRef } from 'react';
import ClusterCanvas from './components/ClusterCanvas';
import ControlDeck from './components/ControlDeck';
import MetricsPanel from './components/MetricsPanel';
import EventLog from './components/EventLog';
import { soundFX } from './utils/audioEffects';
import { ShieldCheck, Cpu, Mic, Sparkles, RefreshCw } from 'lucide-react';

const INITIAL_NODES = [
  { id: 1, role: 'LEADER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 2, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 3, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 4, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 5, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
];

export default function App() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [isolatedNodes, setIsolatedNodes] = useState([]);
  const [packets, setPackets] = useState([]);
  const [term, setTerm] = useState(1);
  const [latency, setLatency] = useState(18);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVoiceCmd, setLastVoiceCmd] = useState('');
  const [logs, setLogs] = useState([
    { id: 1, time: '12:00:01', type: 'HEARTBEAT', message: 'Cluster initialized. Node 1 elected Primary Leader.' },
    { id: 2, time: '12:00:03', type: 'HEARTBEAT', message: 'Heartbeat broadcast sent to 4 followers (Round-trip: 18ms).' }
  ]);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const termRef = useRef(term);
  termRef.current = term;
  const isolatedRef = useRef(isolatedNodes);
  isolatedRef.current = isolatedNodes;
  const electionInFlightRef = useRef(false);

  const addLog = useCallback((type, message) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setLogs((prev) => [
      ...prev.slice(-45),
      { id: Date.now() + Math.random(), time: timeStr, type, message }
    ]);
  }, []);

  // Find active leader
  const activeLeader = nodes.find((n) => n.role === 'LEADER' && n.status === 'ONLINE' && !isolatedNodes.includes(n.id));
  const activeLeaderId = activeLeader ? activeLeader.id : null;

  // Quorum calculations
  const onlineCount = nodes.filter((n) => n.status === 'ONLINE' && !isolatedNodes.includes(n.id)).length;

  // 1. Simulation loop: Heartbeats & Packet movement
  useEffect(() => {
    const packetInterval = setInterval(() => {
      const leader = nodesRef.current.find(
        (n) => n.role === 'LEADER' && n.status === 'ONLINE' && !isolatedRef.current.includes(n.id)
      );

      if (leader) {
        // Send heartbeat packets to all active followers
        const targets = nodesRef.current.filter(
          (n) => n.id !== leader.id && n.status === 'ONLINE' && !isolatedRef.current.includes(n.id)
        );

        const newPackets = targets.map((t) => ({
          id: `hb-${leader.id}-${t.id}-${Date.now()}`,
          from: leader.id,
          to: t.id,
          type: 'HEARTBEAT',
          progress: 0,
        }));

        setPackets((prev) => [...prev.slice(-10), ...newPackets]);
      }
    }, 1800);

    return () => clearInterval(packetInterval);
  }, []);

  // 2. Animate packets smoothly
  useEffect(() => {
    let animId;
    const animate = () => {
      setPackets((prev) =>
        prev
          .map((p) => ({ ...p, progress: p.progress + 0.035 }))
          .filter((p) => p.progress < 1)
      );
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 3. Trigger Election Mechanism
  const triggerElection = useCallback(() => {
    const candidates = nodesRef.current.filter(
      (n) => n.status === 'ONLINE' && !isolatedRef.current.includes(n.id) && n.role !== 'LEADER'
    );

    if (candidates.length === 0) {
      addLog('CHAOS', 'Quorum impossible: No eligible online candidates remain!');
      return;
    }

    // Pick candidate with lowest ID
    const newCandidate = candidates[0];
    const nextTerm = termRef.current + 1;
    setTerm(nextTerm);

    addLog('ELECTION', `Heartbeat timeout! Node ${newCandidate.id} initiated Term ${nextTerm} election.`);

    // Set to candidate state
    setNodes((prev) =>
      prev.map((n) =>
        n.id === newCandidate.id
          ? { ...n, role: 'CANDIDATE', term: nextTerm }
          : n.role === 'LEADER'
          ? { ...n, role: 'FOLLOWER' }
          : n
      )
    );

    // Send vote requests
    setTimeout(() => {
      const voters = nodesRef.current.filter(
        (n) => n.status === 'ONLINE' && !isolatedRef.current.includes(n.id)
      );

      if (voters.length >= 3) {
        // Won election!
        setNodes((prev) =>
          prev.map((n) =>
            n.id === newCandidate.id
              ? { ...n, role: 'LEADER', logsCount: n.logsCount + 1 }
              : { ...n, role: 'FOLLOWER', term: nextTerm }
          )
        );

        if (!isMuted) soundFX.playRecovery();
        addLog(
          'RECOVERY',
          `Quorum achieved (${voters.length}/5 votes). Node ${newCandidate.id} elected Primary Leader for Term ${nextTerm}.`
        );
      } else {
        addLog('CHAOS', `Election split-brain: Only ${voters.length}/5 votes gathered. Retrying election.`);
      }
    }, 900);
  }, [addLog, isMuted]);

  // Check if leader died and trigger election automatically
  useEffect(() => {
    const leader = nodes.find((n) => n.role === 'LEADER' && n.status === 'ONLINE' && !isolatedNodes.includes(n.id));
    if (!leader) {
      const timer = setTimeout(() => {
        triggerElection();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [nodes, isolatedNodes, triggerElection]);

  // 4. Central Action Handler (Triggered by Voice or Buttons)
  const handleExecuteAction = useCallback((action, nodeId, rawVoiceText) => {
    if (rawVoiceText) {
      setLastVoiceCmd(rawVoiceText);
      addLog('VOICE', `Command parsed: "${rawVoiceText}"`);
    }

    switch (action) {
      case 'CRASH_LEADER': {
        const leader = nodesRef.current.find((n) => n.role === 'LEADER' && n.status === 'ONLINE');
        if (leader) {
          if (!isMuted) soundFX.playAlarm();
          setNodes((prev) =>
            prev.map((n) => (n.id === leader.id ? { ...n, status: 'OFFLINE' } : n))
          );
          addLog('CHAOS', `INJECTED CRASH: Primary Leader (Node ${leader.id}) terminated.`);
        } else {
          addLog('CHAOS', 'No active leader currently online to crash.');
        }
        break;
      }

      case 'CRASH_NODE': {
        const targetId = nodeId || 1;
        setNodes((prev) =>
          prev.map((n) => (n.id === targetId ? { ...n, status: 'OFFLINE' } : n))
        );
        if (!isMuted) soundFX.playAlarm();
        addLog('CHAOS', `INJECTED CRASH: Node ${targetId} forced OFFLINE.`);
        break;
      }

      case 'ISOLATE_NODE': {
        const targetId = nodeId || 2;
        setIsolatedNodes((prev) =>
          prev.includes(targetId) ? prev : [...prev, targetId]
        );
        if (!isMuted) soundFX.playAlarm();
        addLog('CHAOS', `NETWORK PARTITION: Node ${targetId} isolated from cluster mesh.`);
        break;
      }

      case 'INJECT_LATENCY': {
        setLatency(385);
        addLog('CHAOS', 'HIGH JITTER: Injected 350ms synthetic network delay on RPC channels.');
        setTimeout(() => {
          setLatency(18 + Math.floor(Math.random() * 8));
          addLog('HEARTBEAT', 'Latency normalized to 18ms baseline.');
        }, 6000);
        break;
      }

      case 'FORCE_ELECTION': {
        triggerElection();
        break;
      }

      case 'HEAL_ALL': {
        setIsolatedNodes([]);
        setNodes((prev) =>
          prev.map((n) => ({ ...n, status: 'ONLINE' }))
        );
        if (!isMuted) soundFX.playRecovery();
        addLog('RECOVERY', 'CLUSTER HEALED: All network partitions removed and nodes restored.');
        break;
      }

      default:
        break;
    }
  }, [addLog, isMuted, triggerElection]);

  // Click on a node to toggle crash/revive
  const handleNodeClick = (nodeId) => {
    soundFX.playClick();
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, status: n.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' }
          : n
      )
    );
    const target = nodes.find((n) => n.id === nodeId);
    if (target && target.status === 'ONLINE') {
      addLog('CHAOS', `Manual Toggle: Node ${nodeId} crashed.`);
    } else {
      addLog('RECOVERY', `Manual Toggle: Node ${nodeId} revived.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Cpu className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  ChaosWhisper
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                  v1.0-RAFT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Voice-Driven Distributed Systems Resiliency Cockpit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wispr Flow Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Built with <strong>Wispr Flow</strong></span>
            </div>

            <button
              onClick={() => handleExecuteAction('HEAL_ALL', null, 'Reset All')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Cluster
            </button>
          </div>
        </div>
      </header>

      {/* Main Cockpit Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-5">
        {/* Real-time Telemetry Metrics */}
        <MetricsPanel
          term={term}
          quorumCount={onlineCount}
          totalNodes={nodes.length}
          latency={latency}
          leaderId={activeLeaderId}
          status={activeLeaderId ? 'HEALTHY' : 'ELECTION'}
        />

        {/* Center Grid: Cluster Canvas (Left) + Live Event Log (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <ClusterCanvas
              nodes={nodes}
              packets={packets}
              isolatedNodes={isolatedNodes}
              onNodeClick={handleNodeClick}
              activeLeaderId={activeLeaderId}
            />
          </div>

          <div className="lg:col-span-1">
            <EventLog logs={logs} onClearLogs={() => setLogs([])} />
          </div>
        </div>

        {/* Bottom Control Deck: Voice Control Plane + Chaos Injections */}
        <ControlDeck
          onExecuteAction={handleExecuteAction}
          lastVoiceCmd={lastVoiceCmd}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <span>ChaosWhisper · Raft Consensus Simulator · Powered by Voice-Driven Development</span>
      </footer>
    </div>
  );
}
