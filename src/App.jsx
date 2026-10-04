import React, { useState, useEffect, useCallback, useRef } from 'react';
import ClusterCanvas from './components/ClusterCanvas';
import ControlDeck from './components/ControlDeck';
import MetricsPanel from './components/MetricsPanel';
import EventLog from './components/EventLog';
import PostMortemModal from './components/PostMortemModal';
import RealWorldProbe from './components/RealWorldProbe';
import ReadinessBoard from './components/ReadinessBoard';
import { soundFX } from './utils/audioEffects';
import { aiVoice } from './utils/aiVoice';
import { Cpu, Mic, RefreshCw, FileText, Globe, Layers, Flame, DollarSign } from 'lucide-react';

const INITIAL_NODES = [
  { id: 1, role: 'LEADER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 2, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 3, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 4, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
  { id: 5, role: 'FOLLOWER', status: 'ONLINE', term: 1, logsCount: 28 },
];

const INITIAL_MICROSERVICES = [
  { id: 'gateway', name: 'Edge API Gateway', role: 'INGRESS', rps: 18400, latency: 12, status: 'ONLINE', breaker: 'CLOSED' },
  { id: 'auth', name: 'Auth & IAM Service', role: 'SECURITY', rps: 14200, latency: 18, status: 'ONLINE', breaker: 'CLOSED' },
  { id: 'orders', name: 'Order Engine', role: 'CORE', rps: 9800, latency: 24, status: 'ONLINE', breaker: 'CLOSED' },
  { id: 'payments', name: 'Payment Gateway', role: 'FINANCIAL', rps: 6400, latency: 65, status: 'ONLINE', breaker: 'CLOSED' },
  { id: 'database', name: 'DynamoDB Cluster', role: 'DATA', rps: 22000, latency: 8, status: 'ONLINE', breaker: 'CLOSED' },
  { id: 'cache', name: 'Redis Cache Layer', role: 'CACHE', rps: 34000, latency: 2, status: 'ONLINE', breaker: 'CLOSED' },
  { id: 'kafka', name: 'Kafka Event Bus', role: 'STREAMING', rps: 45000, latency: 5, status: 'ONLINE', breaker: 'CLOSED' },
];

const INITIAL_REGIONS = [
  { id: 'us-east-1', name: 'US-East (N. Virginia)', role: 'PRIMARY', trafficPct: 42, latency: 18, status: 'ONLINE' },
  { id: 'us-west-2', name: 'US-West (Oregon)', role: 'SECONDARY', trafficPct: 24, latency: 45, status: 'ONLINE' },
  { id: 'eu-west-1', name: 'EU-West (Frankfurt)', role: 'EMEA', trafficPct: 20, latency: 88, status: 'ONLINE' },
  { id: 'ap-south-1', name: 'AP-South (Mumbai)', role: 'APAC', trafficPct: 10, latency: 140, status: 'ONLINE' },
  { id: 'ap-northeast-1', name: 'AP-East (Tokyo)', role: 'APAC', trafficPct: 4, latency: 165, status: 'ONLINE' },
];

const ELECTION_TIMEOUT_MS = 2400;
const ELECTION_RETRY_BACKOFF_MS = 1000;

export default function App() {
  const [activeTopology, setActiveTopology] = useState('MICROSERVICES');
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [microservices, setMicroservices] = useState(INITIAL_MICROSERVICES);
  const [cloudRegions, setCloudRegions] = useState(INITIAL_REGIONS);
  const [isolatedNodes, setIsolatedNodes] = useState([]);
  const [packets, setPackets] = useState([]);
  const [term, setTerm] = useState(1);
  const [latency, setLatency] = useState(18);
  const [isMuted, setIsMuted] = useState(false);
  const [isDdosActive, setIsDdosActive] = useState(false);
  const [lastVoiceCmd, setLastVoiceCmd] = useState('');
  const [screenAlert, setScreenAlert] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRealWorldProbe, setShowRealWorldProbe] = useState(false);
  const [mttrHistory, setMttrHistory] = useState([850, 920, 780]);
  const [totalDowntimeLoss, setTotalDowntimeLoss] = useState(0);
  const [activeScenario, setActiveScenario] = useState(null);
  const [completedScenarios, setCompletedScenarios] = useState([]);

  const [logs, setLogs] = useState([
    { id: 1, time: '12:00:01', type: 'HEARTBEAT', message: 'Incident rehearsal initialized: simulated e-commerce service mesh operational.' },
    { id: 2, time: '12:00:03', type: 'HEARTBEAT', message: 'Simulated multi-region routing synchronized. Baseline latency: 18ms.' }
  ]);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const microservicesRef = useRef(microservices);
  microservicesRef.current = microservices;
  const cloudRegionsRef = useRef(cloudRegions);
  cloudRegionsRef.current = cloudRegions;
  const termRef = useRef(term);
  termRef.current = term;
  const isolatedRef = useRef(isolatedNodes);
  isolatedRef.current = isolatedNodes;
  const electionInFlightRef = useRef(false);
  const lastLeaderHeartbeatRef = useRef(Date.now());
  const electionRetryAtRef = useRef(0);
  const disasterStartTimeRef = useRef(0);
  const activeScenarioRef = useRef(activeScenario);
  activeScenarioRef.current = activeScenario;
  const executeActionRef = useRef(null);

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

  const runReadinessScenario = useCallback((scenario) => {
    if (activeScenarioRef.current) return;
    setActiveScenario(scenario.id);
    addLog('CHAOS', `READINESS DRILL: ${scenario.label} started. Objective: ${scenario.objective}`);
    executeActionRef.current?.(scenario.action.type, scenario.action.payload, scenario.action.voice);
  }, [addLog]);

  const completeReadinessScenario = useCallback(() => {
    if (!activeScenarioRef.current) return;
    executeActionRef.current?.('HEAL_ALL', null, 'Readiness drill: Restore and complete');
  }, []);

  // Financial Loss Calculation per minute
  let financialLossPerMin = 0;
  const offlineServices = microservices.filter((s) => s.status === 'OFFLINE');
  if (offlineServices.some((s) => s.id === 'payments')) financialLossPerMin += 18500;
  if (offlineServices.some((s) => s.id === 'database')) financialLossPerMin += 24000;
  if (offlineServices.some((s) => s.id === 'gateway')) financialLossPerMin += 32000;
  if (offlineServices.some((s) => s.id === 'auth')) financialLossPerMin += 14000;
  const offlineRegions = cloudRegions.filter((r) => r.status === 'OFFLINE');
  financialLossPerMin += offlineRegions.length * 12500;
  const offlineRaft = nodes.filter((n) => n.status === 'OFFLINE');
  financialLossPerMin += offlineRaft.length * 6000;

  // Real-time Downtime Loss Accumulator
  useEffect(() => {
    if (financialLossPerMin > 0) {
      const interval = setInterval(() => {
        setTotalDowntimeLoss((prev) => prev + Math.round(financialLossPerMin / 60));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [financialLossPerMin]);

  // Quorum & Resilience Calculations
  const activeLeader = nodes.find((n) => n.role === 'LEADER' && n.status === 'ONLINE' && !isolatedNodes.includes(n.id));
  const activeLeaderId = activeLeader ? activeLeader.id : null;
  const onlineCount = nodes.filter((n) => n.status === 'ONLINE' && !isolatedNodes.includes(n.id)).length;

  let calculatedScore = 100;
  calculatedScore -= offlineServices.length * 15;
  calculatedScore -= offlineRegions.length * 12;
  calculatedScore -= offlineRaft.length * 10;
  if (isDdosActive) calculatedScore -= 18;
  if (latency > 100) calculatedScore -= 12;
  const resiliencyScore = Math.max(12, Math.min(100, calculatedScore));

  const avgMttr = mttrHistory.length > 0
    ? Math.round(mttrHistory.reduce((a, b) => a + b, 0) / mttrHistory.length)
    : 850;

  // Raft Simulation Loop
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

  // Packet animation loop
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

  // Raft Election Algorithm
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

    setNodes((prev) =>
      prev.map((n) =>
        n.id === newCandidate.id
          ? { ...n, role: 'CANDIDATE', term: nextTerm }
          : n.role === 'LEADER'
          ? { ...n, role: 'FOLLOWER' }
          : n
      )
    );

    setTimeout(() => {
      const voters = nodesRef.current.filter(
        (n) => n.status === 'ONLINE' && !isolatedRef.current.includes(n.id)
      );

      if (voters.length >= 3) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === newCandidate.id
              ? { ...n, role: 'LEADER', logsCount: n.logsCount + 1 }
              : { ...n, role: 'FOLLOWER', term: nextTerm }
          )
        );

        if (disasterStartTimeRef.current > 0) {
          const mttr = Date.now() - disasterStartTimeRef.current;
          setMttrHistory((prev) => [...prev.slice(-9), Math.max(450, mttr)]);
          disasterStartTimeRef.current = 0;
        }

        if (!isMuted) soundFX.playRecovery();
        aiVoice.speak(`Server ${newCandidate.id} elected Primary Leader. Quorum restored.`);
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

  // Automated Watchdog
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

  // Central Action Handler
  const handleExecuteAction = useCallback((action, payload, rawVoiceText) => {
    if (rawVoiceText) {
      setLastVoiceCmd(rawVoiceText);
      addLog('VOICE', `Instruction: "${rawVoiceText}"`);
    }

    switch (action) {
      // 1. Topology Switch
      case 'SET_TOPOLOGY': {
        setActiveTopology(payload);
        addLog('HEARTBEAT', `Topology perspective switched to ${payload}.`);
        break;
      }

      // 2. Microservice Crash & Automated Circuit Breaker Cascade
      case 'CRASH_SERVICE': {
        const targetId = payload || 'payments';
        triggerScreenAlert();
        if (!isMuted) soundFX.playAlarm();

        setMicroservices((prev) =>
          prev.map((s) => {
            if (s.id === targetId) return { ...s, status: 'OFFLINE' };
            // Automated Netflix Circuit Breaker Trip
            if ((targetId === 'payments' || targetId === 'database') && s.id === 'orders') {
              return { ...s, breaker: 'TRIPPED' };
            }
            if (targetId === 'database' && s.id === 'payments') {
              return { ...s, breaker: 'TRIPPED' };
            }
            return s;
          })
        );

        addLog('CHAOS', `MICROSERVICE CRASH: Service "${targetId}" forced OFFLINE. Circuit breakers tripped on upstream dependencies.`);
        break;
      }

      // 3. AWS Region Blackout
      case 'CRASH_REGION': {
        const targetReg = payload || 'us-east-1';
        triggerScreenAlert();
        if (!isMuted) soundFX.playAlarm();

        setCloudRegions((prev) =>
          prev.map((r) => (r.id === targetReg ? { ...r, status: 'OFFLINE' } : r))
        );
        setLatency(168);
        addLog('CHAOS', `REGIONAL BLACKOUT: AWS region "${targetReg}" collapsed. Route 53 failing over.`);
        break;
      }

      // 4. Circuit Breakers
      case 'TRIP_BREAKER': {
        setMicroservices((prev) =>
          prev.map((s) => (s.id === 'orders' || s.id === 'payments' ? { ...s, breaker: 'TRIPPED' } : s))
        );
        addLog('CHAOS', 'CIRCUIT BREAKER: Manually tripped on Orders & Payments. Fallback responses active.');
        break;
      }
      case 'RESET_BREAKER': {
        setMicroservices((prev) => prev.map((s) => ({ ...s, breaker: 'CLOSED' })));
        addLog('RECOVERY', 'CIRCUIT BREAKER: All circuit breakers reset to CLOSED.');
        break;
      }

      // 5. Black Friday Mega Drill
      case 'RUN_BLACK_FRIDAY': {
        triggerScreenAlert();
        setIsDdosActive(true);
        setLatency(650);
        addLog('CHAOS', 'BLACK FRIDAY DRILL: 150k RPS peak traffic flood injected. Cache stampede in progress.');

        // Step 1: Trip Cache and Latency
        setTimeout(() => {
          setMicroservices((prev) =>
            prev.map((s) => (s.id === 'cache' ? { ...s, status: 'OFFLINE' } : s))
          );
          addLog('CHAOS', 'BLACK FRIDAY STEP 1: Redis Cache overwhelmed. Database load critical.');
          aiVoice.speak('Warning! Redis Cache offline. Database load critical.');
        }, 1800);

        // Step 2: Trip Payments & Circuit Breaker
        setTimeout(() => {
          setMicroservices((prev) =>
            prev.map((s) =>
              s.id === 'payments'
                ? { ...s, status: 'OFFLINE' }
                : s.id === 'orders'
                ? { ...s, breaker: 'TRIPPED' }
                : s
            )
          );
          addLog('CHAOS', 'BLACK FRIDAY STEP 2: Payment Gateway failed. Order Engine circuit breaker tripped to protect DB.');
          aiVoice.speak('Payment Gateway collapsed. Automated circuit breaker tripped to protect cluster.');
        }, 3800);

        // Step 3: Auto-Healing
        setTimeout(() => {
          setMicroservices(INITIAL_MICROSERVICES);
          setIsDdosActive(false);
          setLatency(18);
          addLog('RECOVERY', 'BLACK FRIDAY RESOLVED: Auto-scaling and circuit breakers absorbed shock. Systems nominal.');
          aiVoice.speak('Drill complete. Autonomous resiliency preserved cluster integrity.');
        }, 7500);
        break;
      }

      // 6. Cost Impact Query
      case 'COST_IMPACT': {
        const msg = `Financial risk assessment: Current downtime burn rate is ${financialLossPerMin.toLocaleString()} dollars per minute. Total loss during this incident: ${totalDowntimeLoss.toLocaleString()} dollars.`;
        aiVoice.speak(msg);
        addLog('VOICE', msg);
        break;
      }

      // 7. Raft Core Actions
      case 'CRASH_LEADER': {
        const leader = nodesRef.current.find((n) => n.role === 'LEADER' && n.status === 'ONLINE');
        if (leader) {
          if (disasterStartTimeRef.current === 0) disasterStartTimeRef.current = Date.now();
          triggerScreenAlert();
          if (!isMuted) soundFX.playAlarm();
          setNodes((prev) =>
            prev.map((n) => (n.id === leader.id ? { ...n, status: 'OFFLINE' } : n))
          );
          addLog('CHAOS', `CRASH TRIGGERED: Primary Leader (Server ${leader.id}) terminated.`);
        }
        break;
      }

      case 'CRASH_NODE': {
        const targetId = payload || 1;
        if (disasterStartTimeRef.current === 0) disasterStartTimeRef.current = Date.now();
        triggerScreenAlert();
        setNodes((prev) =>
          prev.map((n) => (n.id === targetId ? { ...n, status: 'OFFLINE' } : n))
        );
        if (!isMuted) soundFX.playAlarm();
        addLog('CHAOS', `SERVER CRASH: Server ${targetId} forced OFFLINE.`);
        break;
      }

      case 'ISOLATE_NODE': {
        const targetId = payload || 2;
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
        setTimeout(() => {
          setIsDdosActive(false);
          setLatency(18);
          addLog('RECOVERY', 'DDoS MITIGATED: Traffic scrubbed. Latency normalized to 18ms.');
          aiVoice.speak('DDoS traffic scrubbed. Latency normalized.');
        }, 7000);
        break;
      }

      case 'CASCADE_FAILURE': {
        if (disasterStartTimeRef.current === 0) disasterStartTimeRef.current = Date.now();
        triggerScreenAlert();
        addLog('CHAOS', 'CASCADE DISASTER: Sequential node failure initiated.');
        setNodes((prev) => prev.map((n) => (n.id === 1 ? { ...n, status: 'OFFLINE' } : n)));
        setTimeout(() => {
          setNodes((prev) => prev.map((n) => (n.id === 2 ? { ...n, status: 'OFFLINE' } : n)));
        }, 1500);
        setTimeout(() => {
          setNodes((prev) => prev.map((n) => (n.id === 3 ? { ...n, status: 'OFFLINE' } : n)));
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

      // Universal Heal & Restore All
      case 'HEAL_ALL': {
        if (disasterStartTimeRef.current > 0) {
          const mttr = Date.now() - disasterStartTimeRef.current;
          setMttrHistory((prev) => [...prev.slice(-9), Math.max(450, mttr)]);
          disasterStartTimeRef.current = 0;
        }
        setNodes((prev) => prev.map((n) => ({ ...n, status: 'ONLINE' })));
        setMicroservices(INITIAL_MICROSERVICES);
        setCloudRegions(INITIAL_REGIONS);
        setIsolatedNodes([]);
        setIsDdosActive(false);
        setLatency(18);
        if (!isMuted) soundFX.playRecovery();
        addLog('RECOVERY', 'SIMULATION RESET COMPLETE: All modeled services, regions, and consensus nodes restored.');
        if (activeScenarioRef.current) {
          const scenarioId = activeScenarioRef.current;
          setCompletedScenarios((prev) => prev.includes(scenarioId) ? prev : [...prev, scenarioId]);
          addLog('RECOVERY', `READINESS DRILL COMPLETE: ${scenarioId} evidence recorded.`);
          setActiveScenario(null);
        }
        break;
      }

      case 'STATUS_REPORT': {
        const offSvc = microservicesRef.current.filter((s) => s.status === 'OFFLINE').length;
        const offReg = cloudRegionsRef.current.filter((r) => r.status === 'OFFLINE').length;
        const msg = `Status report: Resiliency score ${resiliencyScore} percent. Active topology: ${activeTopology}. ${offSvc} microservices offline. ${offReg} cloud regions degraded. Estimated risk: ${financialLossPerMin.toLocaleString()} dollars per minute.`;
        aiVoice.speak(msg);
        addLog('VOICE', msg);
        break;
      }

      case 'BLAST_RADIUS': {
        const msg = `Blast radius evaluation: ${100 - resiliencyScore} percent system degradation. Financial impact at ${financialLossPerMin.toLocaleString()} dollars per minute.`;
        aiVoice.speak(msg);
        addLog('VOICE', msg);
        break;
      }

      case 'RUN_AUDIT': {
        addLog('CHAOS', 'RESILIENCE AUDIT: Running multi-tier infrastructure stress drill...');
        aiVoice.speak('Initiating multi-tier infrastructure stress drill.');
        handleExecuteAction('CRASH_SERVICE', 'payments', 'Audit: Kill Payments');
        setTimeout(() => {
          handleExecuteAction('HEAL_ALL', null, 'Audit: Restore All');
          aiVoice.speak('Resilience audit complete. All services verified.');
        }, 4500);
        break;
      }

      case 'UNKNOWN': {
        addLog('CHAOS', `Command not recognized: "${rawVoiceText}". Try: "Kill Payment Gateway", "Blackout US East", "Black Friday Drill", "Heal Cluster"...`);
        break;
      }

      default:
        break;
    }
  }, [addLog, isMuted, triggerElection, resiliencyScore, activeTopology, financialLossPerMin, totalDowntimeLoss]);

  executeActionRef.current = handleExecuteAction;

  // Click handlers for canvas items
  const handleServiceClick = (serviceId) => {
    soundFX.playClick();
    const svc = microservices.find((s) => s.id === serviceId);
    if (svc && svc.status === 'ONLINE') {
      handleExecuteAction('CRASH_SERVICE', serviceId, `Manual: Crash ${svc.name}`);
    } else {
      setMicroservices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, status: 'ONLINE', breaker: 'CLOSED' } : s))
      );
      addLog('RECOVERY', `Manual: Revived ${serviceId}`);
    }
  };

  const handleRegionClick = (regionId) => {
    soundFX.playClick();
    const reg = cloudRegions.find((r) => r.id === regionId);
    if (reg && reg.status === 'ONLINE') {
      handleExecuteAction('CRASH_REGION', regionId, `Manual: Blackout ${reg.name}`);
    } else {
      setCloudRegions((prev) =>
        prev.map((r) => (r.id === regionId ? { ...r, status: 'ONLINE' } : r))
      );
      addLog('RECOVERY', `Manual: Restored region ${regionId}`);
    }
  };

  const handleNodeClick = (nodeId) => {
    soundFX.playClick();
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, status: n.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' }
          : n
      )
    );
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
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  SIMULATION LAB v3.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Voice-controlled distributed-systems incident rehearsal
              </p>
              <p className="text-[10px] text-amber-300/80 font-mono mt-1">
                Safe by design: simulated failures only · business impact figures are illustrative
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Black Friday Drill Quick Action */}
            <button
              onClick={() => handleExecuteAction('RUN_BLACK_FRIDAY', null, 'Black Friday Mega Drill')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 hover:bg-red-900/60 text-xs font-mono font-bold transition-all cursor-pointer shadow-lg shadow-red-950/40"
              title="Simulate 150k RPS Black Friday Peak Outage Drill"
            >
              <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Black Friday Drill</span>
            </button>

            {/* SRE Incident Post-Mortem Quick Button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 text-xs font-mono font-bold transition-all cursor-pointer shadow-lg shadow-purple-950/30"
              title="Generate incident rehearsal report"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Incident Report</span>
            </button>

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
              Heal All
            </button>
          </div>
        </div>
      </header>

      {/* Main Cockpit Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-5">
        <div className="max-w-3xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 mb-1">Practice before production</div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100">Turn failure response into measurable readiness.</h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Choose a rehearsal, observe the blast radius, then restore the system and export evidence your team can act on.</p>
        </div>

        <ReadinessBoard
          activeScenario={activeScenario}
          completedScenarios={completedScenarios}
          onRunScenario={runReadinessScenario}
          onHeal={completeReadinessScenario}
        />

        {/* Dynamic Mission Status & Glassmorphism Metrics with Resiliency Score */}
        <MetricsPanel
          term={term}
          quorumCount={onlineCount}
          totalNodes={nodes.length}
          latency={latency}
          leaderId={activeLeaderId}
          isDdosActive={isDdosActive}
          resiliencyScore={resiliencyScore}
          avgMttr={avgMttr}
          onOpenReport={() => setShowReportModal(true)}
        />

        {/* Read-only HTTP probe panel (when toggled) */}
        {showRealWorldProbe && (
          <RealWorldProbe onLogEvent={addLog} />
        )}

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
              activeTopology={activeTopology}
              onSelectTopology={setActiveTopology}
              microservices={microservices}
              cloudRegions={cloudRegions}
              onServiceClick={handleServiceClick}
              onRegionClick={handleRegionClick}
              financialLossPerMin={financialLossPerMin}
              totalDowntimeLoss={totalDowntimeLoss}
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
          onOpenReport={() => setShowReportModal(true)}
          onToggleProbe={() => setShowRealWorldProbe((prev) => !prev)}
          showProbe={showRealWorldProbe}
        />
      </main>

      {/* Incident rehearsal report modal */}
      <PostMortemModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        nodes={nodes}
        term={term}
        logs={logs}
        mttrHistory={mttrHistory}
        resiliencyScore={resiliencyScore}
        completedScenarios={completedScenarios}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <span>ChaosWhisper Simulation Lab v3.0 · Built hands-free with Wispr Flow</span>
      </footer>
    </div>
  );
}
