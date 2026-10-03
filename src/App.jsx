import React, { useState, useEffect, useCallback, useRef } from 'react';
import ClusterCanvas from './components/ClusterCanvas';
import ControlDeck from './components/ControlDeck';
import MetricsPanel from './components/MetricsPanel';
import EventLog from './components/EventLog';
import { soundFX } from './utils/audioEffects';
import { aiVoice } from './utils/aiVoice';
import { ShieldCheck, Cpu, Mic, RefreshCw, Activity, Volume2 } from 'lucide-react';

const INITIAL_NODES = [
  { id: 1, role: 'LEADER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 2, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 3, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 4, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 5, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
];

const ELECTION_TIMEOUT_MS = 2400;
const ELECTION_RETRY_BACKOFF_MS = 1000;

export default function App() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [isolatedNodes, setIsolatedNodes] = useState([]);
  const [packets, setPackets] = useState([]);
  const [term, setTerm] = useState(1);
  const [latency, setLatency] = useState(18);
  const [isMuted, setIsMuted] = useState(false);
  const [isDdosActive, setIsDdosActive] = useState(false);
  const [lastVoiceCmd, setLastVoiceCmd] = useState('');
  const [screenAlert, setScreenAlert] = useState(false);
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
  const lastLeaderHeartbeatRef = useRef(Date.now());
  const electionRetryAtRef = useRef(0);

  const triggerScreenAlert = () => {
    setScreenAlert(true);
    setTimeout(() => setScreenAlert(false), 800);
  };

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
        const targets = nodesRef.current.filter(
          (n) => n.id !== leader.id && n.status === 'ONLINE' && !isolatedRef.current.includes(n.id)
        );

        const newPackets = targets.map((t) => ({
          id: `hb-${leader.id}-${t.id}-${Date.now()}-${Math.random()}`,
          from: leader.id,
          to: t.id,
          type: 'HEARTBEAT',
          progress: 0,
        }));

        setPackets((prev) => [...prev.slice(-15), ...newPackets]);
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
          .map((p) => ({ ...p, progress: p.progress + (p.type === 'DDOS_FLOOD' ? 0.06 : 0.038) }))
          .filter((p) => p.progress < 1)
      );
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 3. Trigger Election Mechanism (Raft Algorithm)
  const triggerElection = useCallback(() => {
    if (electionInFlightRef.current) return;

    const candidates = nodesRef.current.filter(
      (n) => n.status === 'ONLINE' && !isolatedRef.current.includes(n.id) && n.role !== 'LEADER'
    );

    if (candidates.length === 0) {
      addLog('CHAOS', 'Quorum impossible: No eligible online candidates remain!');
      return;
    }

    electionInFlightRef.current = true;
    const newCandidate = candidates[0];
    const nextTerm = termRef.current + 1;
    setTerm(nextTerm);

    addLog('ELECTION', `Missed heartbeats! Node ${newCandidate.id} initiated Term ${nextTerm} election.`);

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

    // Collect votes after voting round
    setTimeout(() => {
      const voters = nodesRef.current.filter(
        (n) => n.status === 'ONLINE' && !isolatedRef.current.includes(n.id)
      );

      if (voters.length >= 3) {
        // Quorum won!
        setNodes((prev) =>
          prev.map((n) =>
            n.id === newCandidate.id
              ? { ...n, role: 'LEADER', logsCount: n.logsCount + 1 }
              : { ...n, role: 'FOLLOWER', term: nextTerm }
          )
        );

        if (!isMuted) soundFX.playRecovery();
        aiVoice.speak(`Server ${newCandidate.id} elected as new Primary Leader. Quorum restored.`);
        addLog(
          'RECOVERY',
          `Quorum achieved (${voters.length}/5 votes). Node ${newCandidate.id} elected Primary Leader for Term ${nextTerm}.`
        );
      } else {
        addLog('CHAOS', `Election split-brain: Only ${voters.length}/5 votes gathered. Retrying election.`);
      }
      electionInFlightRef.current = false;
    }, 900);
  }, [addLog, isMuted]);

  // Automated Election Watchdog
  useEffect(() => {
    const checkLeaderTimeout = () => {
      const leader = nodesRef.current.find(
        (n) => n.role === 'LEADER' && n.status === 'ONLINE' && !isolatedRef.current.includes(n.id)
      );

      if (leader) {
        lastLeaderHeartbeatRef.current = Date.now();
        electionRetryAtRef.current = 0;
        return;
      }

      const now = Date.now();
      if (now - lastLeaderHeartbeatRef.current >= ELECTION_TIMEOUT_MS && now >= electionRetryAtRef.current) {
        electionRetryAtRef.current = now + ELECTION_RETRY_BACKOFF_MS;
        triggerElection();
      }
    };

    const timeoutInterval = setInterval(checkLeaderTimeout, 250);
    checkLeaderTimeout();
    return () => clearInterval(timeoutInterval);
  }, [nodes, isolatedNodes, triggerElection]);

  // 4. Central Action Handler (Triggered by Voice or UI)
  const handleExecuteAction = useCallback((action, nodeId, rawVoiceText) => {
    if (rawVoiceText) {
      setLastVoiceCmd(rawVoiceText);
      addLog('VOICE', `Spoken instruction: "${rawVoiceText}"`);
    }

    switch (action) {
      case 'CRASH_LEADER': {
        const leader = nodesRef.current.find((n) => n.role === 'LEADER' && n.status === 'ONLINE');
        if (leader) {
          triggerScreenAlert();
          if (!isMuted) soundFX.playAlarm();
          setNodes((prev) =>
            prev.map((n) => (n.id === leader.id ? { ...n, status: 'OFFLINE' } : n))
          );
          addLog('CHAOS', `CRASH TRIGGERED: Primary Leader (Server ${leader.id}) terminated.`);
        } else {
          addLog('CHAOS', 'No active leader currently online.');
        }
        break;
      }

      case 'CRASH_NODE': {
        const targetId = nodeId || 1;
        triggerScreenAlert();
        setNodes((prev) =>
          prev.map((n) => (n.id === targetId ? { ...n, status: 'OFFLINE' } : n))
        );
        if (!isMuted) soundFX.playAlarm();
        addLog('CHAOS', `SERVER CRASH: Server ${targetId} forced OFFLINE.`);
        break;
      }

      case 'ISOLATE_NODE': {
        const targetId = nodeId || 2;
        triggerScreenAlert();
        setIsolatedNodes((prev) =>
          prev.includes(targetId) ? prev : [...prev, targetId]
        );
        if (!isMuted) soundFX.playAlarm();
        addLog('CHAOS', `NETWORK PARTITION: Server ${targetId} isolated from cluster mesh.`);
        break;
      }

      case 'SIMULATE_DDOS': {
        triggerScreenAlert();
        setIsDdosActive(true);
        setLatency(780);
        addLog('CHAOS', 'SYNTHETIC DDoS: Injected 800+ RPC/s traffic storm across cluster.');

        // Spawn rapid flood packets
        const floodPackets = [];
        for (let i = 1; i <= 5; i++) {
          floodPackets.push({
            id: `ddos-${Date.now()}-${i}-${Math.random()}`,
            from: i,
            to: (i % 5) + 1,
            type: 'DDOS_FLOOD',
            progress: 0,
          });
        }
        setPackets((prev) => [...prev, ...floodPackets]);

        setTimeout(() => {
          setIsDdosActive(false);
          setLatency(18);
          addLog('RECOVERY', 'DDoS MITIGATED: Traffic scrubbed. Latency normalized to 18ms.');
          aiVoice.speak('DDoS traffic mitigated. Cluster bandwidth stabilized.');
        }, 7000);
        break;
      }

      case 'CASCADE_FAILURE': {
        triggerScreenAlert();
        addLog('CHAOS', 'CASCADE DISASTER: Sequential node failure initiated.');
        // Kill Node 1 immediately
        setNodes((prev) => prev.map((n) => (n.id === 1 ? { ...n, status: 'OFFLINE' } : n)));

        // Kill Node 2 after 1.5s
        setTimeout(() => {
          setNodes((prev) => prev.map((n) => (n.id === 2 ? { ...n, status: 'OFFLINE' } : n)));
          addLog('CHAOS', 'CASCADE STEP 2: Server 2 collapsed.');
        }, 1500);

        // Kill Node 3 after 3s
        setTimeout(() => {
          setNodes((prev) => prev.map((n) => (n.id === 3 ? { ...n, status: 'OFFLINE' } : n)));
          addLog('CHAOS', 'CASCADE STEP 3: Server 3 collapsed. Quorum critical (2/5).');
          aiVoice.speak('Emergency alert! Quorum lost. Three servers down.');
        }, 3000);
        break;
      }

      case 'INJECT_LATENCY': {
        setLatency(385);
        addLog('CHAOS', 'HIGH JITTER: Injected 350ms synthetic network delay on RPC channels.');
        setTimeout(() => {
          setLatency(18 + Math.floor(Math.random() * 6));
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
        setIsDdosActive(false);
        setLatency(18);
        setNodes((prev) =>
          prev.map((n) => ({ ...n, status: 'ONLINE' }))
        );
        if (!isMuted) soundFX.playRecovery();
        addLog('RECOVERY', 'CLUSTER FULLY HEALED: All network partitions cleared and nodes revived.');
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
      addLog('CHAOS', `Manual Toggle: Server ${nodeId} crashed.`);
    } else {
      addLog('RECOVERY', `Manual Toggle: Server ${nodeId} revived.`);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-all duration-300 ${
      screenAlert ? 'ring-8 ring-rose-500/40 ring-inset' : ''
    }`}>
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Cpu className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-cyan-100 to-slate-400 bg-clip-text text-transparent">
                  ChaosWhisper
                </h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                  v2.0-ULTRA
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Voice-Driven Distributed Systems Resiliency Cockpit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wispr Flow Live Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-cyan-500/40 text-xs text-slate-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Built with <strong>Wispr Flow</strong></span>
            </div>

            <button
              onClick={() => handleExecuteAction('HEAL_ALL', null, 'Reset All')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        </div>
      </header>

      {/* Main Cockpit Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-5">
        {/* Dynamic Mission Status & Glassmorphism Metrics */}
        <MetricsPanel
          term={term}
          quorumCount={onlineCount}
          totalNodes={nodes.length}
          latency={latency}
          leaderId={activeLeaderId}
          isDdosActive={isDdosActive}
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
              term={term}
              isDdosActive={isDdosActive}
            />
          </div>

          <div className="lg:col-span-1">
            <EventLog logs={logs} onClearLogs={() => setLogs([])} />
          </div>
        </div>

        {/* Bottom Control Deck: Continuous Voice Control + Chaos Injections */}
        <ControlDeck
          onExecuteAction={handleExecuteAction}
          lastVoiceCmd={lastVoiceCmd}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          nodes={nodes}
          activeLeaderId={activeLeaderId}
          latency={latency}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <span>ChaosWhisper 2.0 · Voice-Driven Cloud Infrastructure Operations · Built hands-free with Wispr Flow</span>
      </footer>
    </div>
  );
}
