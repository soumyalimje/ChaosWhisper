// Intelligent Natural Language Intent Parser for Chaos Engineering Cockpit
// Accurately maps spoken words, numbers, and homophones to cluster actions.

const NUMBER_MAP = {
  '1': 1, 'one': 1, 'first': 1,
  '2': 2, 'two': 2, 'second': 2, 'to': 2, 'too': 2,
  '3': 3, 'three': 3, 'third': 3,
  '4': 4, 'four': 4, 'fourth': 4, 'for': 4, 'fore': 4,
  '5': 5, 'five': 5, 'fifth': 5,
};

function extractTargetNode(text) {
  const serverPattern = /(?:server|node|srv|worker|machine|target|number|#)\s*(one|first|two|second|to|too|three|third|four|fourth|for|fore|five|fifth|[1-5])\b/i;
  const match = text.match(serverPattern);
  if (match) {
    const key = match[1].toLowerCase();
    if (NUMBER_MAP[key]) return NUMBER_MAP[key];
  }

  const actionWithNumber = /(?:crash|kill|isolate|partition|stop|terminate|sever|drop)\s+(?:the\s+)?(one|first|two|second|to|too|three|third|four|fourth|for|fore|five|fifth|[1-5])\b/i;
  const matchAction = text.match(actionWithNumber);
  if (matchAction) {
    const key = matchAction[1].toLowerCase();
    if (NUMBER_MAP[key]) return NUMBER_MAP[key];
  }

  return null;
}

export function parseVoiceCommand(transcript, isFinal = false) {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.toLowerCase().trim();
  if (!text) return null;

  const targetNodeId = extractTargetNode(text);

  // 1. Spoken Speed Changes ("Speed 2.5", "Speed 1.5", "Speed 1", "Normal speed", "Turbo")
  if (text.includes('2.5') || text.includes('two point five') || text.includes('turbo')) {
    return {
      action: 'SET_SPEED',
      speed: 2.5,
      label: 'Set Voice Speed to 2.5x',
      speechResponse: 'Speech speed set to 2.5x turbo.'
    };
  }
  if (text.includes('1.5') || text.includes('one point five') || text.includes('faster speed')) {
    return {
      action: 'SET_SPEED',
      speed: 1.5,
      label: 'Set Voice Speed to 1.5x',
      speechResponse: 'Speech speed set to 1.5x.'
    };
  }
  if (text.includes('speed 1') || text.includes('normal speed') || text.includes('speed one')) {
    return {
      action: 'SET_SPEED',
      speed: 1.0,
      label: 'Set Voice Speed to 1.0x',
      speechResponse: 'Speech speed set to 1.0x normal.'
    };
  }

  // 2. Topology View Switching (AWS Cloud vs Netflix Microservices vs Raft)
  if (text.includes('microservice') || text.includes('service mesh') || text.includes('netflix mode')) {
    return {
      action: 'SET_TOPOLOGY',
      topology: 'MICROSERVICES',
      label: 'Switch to Microservices Mesh Topology',
      speechResponse: 'Switching view to Tier-1 Microservice Dependency Mesh.'
    };
  }
  if (text.includes('global cloud') || text.includes('aws') || text.includes('multi region') || text.includes('cloud topology')) {
    return {
      action: 'SET_TOPOLOGY',
      topology: 'GLOBAL_CLOUD',
      label: 'Switch to AWS Global Cloud Topology',
      speechResponse: 'Switching view to AWS Multi-Region Global Infrastructure.'
    };
  }
  if (text.includes('raft') || text.includes('consensus view') || text.includes('raft cluster')) {
    return {
      action: 'SET_TOPOLOGY',
      topology: 'RAFT',
      label: 'Switch to Raft Consensus Cluster',
      speechResponse: 'Switching view to Raft Consensus Cluster.'
    };
  }

  // 3. Black Friday Drill / Mega Stress Drill
  if (text.includes('black friday') || text.includes('mega drill') || text.includes('stress drill')) {
    return {
      action: 'RUN_BLACK_FRIDAY',
      label: 'Simulate Black Friday 10x Traffic Storm',
      speechResponse: 'Initiating Black Friday peak load drill. 150,000 requests per second active.'
    };
  }

  // Readiness Board scenario shortcuts
  if (text.includes('payment drill') || text.includes('checkout drill')) {
    return {
      action: 'CRASH_SERVICE',
      serviceId: 'payments',
      label: 'Run Checkout Outage Rehearsal',
      speechResponse: 'Starting checkout outage rehearsal. Payment dependency failure simulated.'
    };
  }
  if (text.includes('leader drill') || text.includes('failover drill')) {
    return {
      action: 'CRASH_LEADER',
      label: 'Run Leader Failover Rehearsal',
      speechResponse: 'Starting leader failover rehearsal. Election timing is now being measured.'
    };
  }
  if (text.includes('region drill') || text.includes('regional drill')) {
    return {
      action: 'CRASH_REGION',
      regionId: 'us-east-1',
      label: 'Run Regional Failover Rehearsal',
      speechResponse: 'Starting regional failover rehearsal. Primary region is simulated offline.'
    };
  }

  // 4. Financial & Downtime Cost Impact Queries
  if (text.includes('financial') || text.includes('cost impact') || text.includes('revenue at risk') || text.includes('money lost') || text.includes('downtime cost')) {
    return {
      action: 'COST_IMPACT',
      label: 'Query Downtime Financial Impact'
    };
  }

  // 5. Circuit Breaker Controls
  if (text.includes('trip circuit') || text.includes('open circuit') || text.includes('trip breaker')) {
    return {
      action: 'TRIP_BREAKER',
      label: 'Trip Microservice Circuit Breaker',
      speechResponse: 'Circuit breaker tripped. Fallback responses active.'
    };
  }
  if (text.includes('reset circuit') || text.includes('close breaker') || text.includes('restore breaker')) {
    return {
      action: 'RESET_BREAKER',
      label: 'Reset All Circuit Breakers',
      speechResponse: 'Circuit breakers reset to closed state. Normal routing restored.'
    };
  }

  // 6. Targeted Microservice Crashes (Payment, Database, Auth, Gateway, Cache, Kafka)
  if (text.includes('payment') || text.includes('stripe')) {
    return {
      action: 'CRASH_SERVICE',
      serviceId: 'payments',
      label: 'Crash Payment Gateway Service',
      speechResponse: 'Payment Gateway offline. Downstream checkout degraded.'
    };
  }
  if (text.includes('database') || text.includes('db') || text.includes('postgres') || text.includes('dynamo')) {
    return {
      action: 'CRASH_SERVICE',
      serviceId: 'database',
      label: 'Crash DynamoDB Primary Cluster',
      speechResponse: 'Database cluster offline. Writes failing across services.'
    };
  }
  if (text.includes('auth') || text.includes('iam') || text.includes('login')) {
    return {
      action: 'CRASH_SERVICE',
      serviceId: 'auth',
      label: 'Crash Auth & IAM Service',
      speechResponse: 'Authentication service offline. Token validation halted.'
    };
  }
  if (text.includes('gateway') || text.includes('ingress') || text.includes('edge')) {
    return {
      action: 'CRASH_SERVICE',
      serviceId: 'gateway',
      label: 'Crash Edge API Gateway',
      speechResponse: 'Critical: Edge API Gateway offline. Total ingress severed.'
    };
  }
  if (text.includes('cache') || text.includes('redis')) {
    return {
      action: 'CRASH_SERVICE',
      serviceId: 'cache',
      label: 'Crash Redis Cache Layer',
      speechResponse: 'Redis cache offline. Database experiencing cache stampede.'
    };
  }
  if (text.includes('kafka') || text.includes('queue') || text.includes('streaming')) {
    return {
      action: 'CRASH_SERVICE',
      serviceId: 'kafka',
      label: 'Crash Kafka Streaming Pipeline',
      speechResponse: 'Kafka streaming pipeline offline. Asynchronous events queued.'
    };
  }

  // 7. Targeted AWS Region Blackouts
  if (text.includes('virginia') || text.includes('us east') || text.includes('us-east-1')) {
    return {
      action: 'CRASH_REGION',
      regionId: 'us-east-1',
      label: 'AWS us-east-1 Regional Blackout',
      speechResponse: 'AWS US-East 1 blackout. Global Route 53 failing over to US-West.'
    };
  }
  if (text.includes('oregon') || text.includes('us west') || text.includes('us-west-2')) {
    return {
      action: 'CRASH_REGION',
      regionId: 'us-west-2',
      label: 'AWS us-west-2 Regional Blackout',
      speechResponse: 'AWS US-West 2 blackout. Traffic rerouted.'
    };
  }
  if (text.includes('frankfurt') || text.includes('europe') || text.includes('eu west') || text.includes('eu-west-1')) {
    return {
      action: 'CRASH_REGION',
      regionId: 'eu-west-1',
      label: 'AWS eu-west-1 Regional Blackout',
      speechResponse: 'European cloud region offline. Latency increased.'
    };
  }
  if (text.includes('mumbai') || text.includes('india') || text.includes('ap south') || text.includes('ap-south-1')) {
    return {
      action: 'CRASH_REGION',
      regionId: 'ap-south-1',
      label: 'AWS ap-south-1 Regional Blackout',
      speechResponse: 'Asia-Pacific cloud region offline.'
    };
  }

  // 8. Enterprise SRE Queries (Status, Blast Radius, Post-Mortem, Audit)
  if (text.includes('status report') || text.includes('cluster status') || text.includes('health check') || text.includes('system status')) {
    return {
      action: 'STATUS_REPORT',
      label: 'Query Cluster Health Status'
    };
  }

  if (text.includes('blast radius') || text.includes('impact analysis') || text.includes('impact report')) {
    return {
      action: 'BLAST_RADIUS',
      label: 'Query Blast Radius Analysis'
    };
  }

  if (
    text.includes('post mortem') ||
    text.includes('postmortem') ||
    text.includes('incident report') ||
    text.includes('export report') ||
    text.includes('generate report')
  ) {
    return {
      action: 'GENERATE_REPORT',
      label: 'Generate SRE Incident Post-Mortem',
      speechResponse: 'Incident post-mortem report compiled.'
    };
  }

  if (text.includes('resilience audit') || text.includes('run audit') || text.includes('test resilience')) {
    return {
      action: 'RUN_AUDIT',
      label: 'Run Automated Resilience Audit',
      speechResponse: 'Initiating automated cluster resiliency stress audit.'
    };
  }

  // 9. Heal / Restore All Cluster Nodes (Highest priority recovery)
  if (
    /\b(heal|restore|recover|revive|reconnect|fix|nominal|reset)\b/i.test(text) ||
    text.includes('all online') ||
    text.includes('bring back') ||
    text.includes('clear partition')
  ) {
    return {
      action: 'HEAL_ALL',
      label: 'Heal Cluster & Reconnect All',
      speechResponse: 'Cluster restored. All services and nodes online.'
    };
  }

  // 10. Specific Server Crash (e.g. "crash server 2", "kill node 3", "server 1 down")
  if (
    targetNodeId &&
    (/\b(crash|kill|terminate|stop|destroy|drop|shutdown|break|offline|disable|down|die)\b/i.test(text) ||
      text.includes('take down'))
  ) {
    return {
      action: 'CRASH_NODE',
      nodeId: targetNodeId,
      label: `Crash Server ${targetNodeId}`,
      speechResponse: `Server ${targetNodeId} offline. Re-routing cluster mesh.`
    };
  }

  // 11. Crash Leader / Kill Leader (Explicit target: leader / primary)
  if (
    /\b(crash|kill|stop|destroy|terminate|drop|shutdown)\s+(?:the\s+)?(leader|primary)\b/i.test(text) ||
    /\b(leader|primary)\s+(crash|down|offline|die|killed)\b/i.test(text) ||
    text.includes('leader down') ||
    text.includes('take down leader')
  ) {
    return {
      action: 'CRASH_LEADER',
      label: 'Crash Current Leader',
      speechResponse: 'Primary leader offline. Emergency election initiated.'
    };
  }

  // 12. Isolate / Network Partition (e.g. "isolate server 2", "partition node 3", "network partition")
  if (/\b(isolate|partition|disconnect|sever|cut off|split)\b/i.test(text)) {
    const id = targetNodeId || 2;
    return {
      action: 'ISOLATE_NODE',
      nodeId: id,
      label: `Isolate Server ${id}`,
      speechResponse: `Server ${id} isolated from consensus network.`
    };
  }

  // 13. Simulate DDoS / Traffic Flood
  if (
    /\b(ddos|d dos|dos|packet flood|traffic flood|traffic storm|storm|flood|surge)\b/i.test(text) ||
    text.includes('flood attack') ||
    text.includes('simulate ddos')
  ) {
    return {
      action: 'SIMULATE_DDOS',
      label: 'DDoS Traffic Storm Injected',
      speechResponse: 'Warning! High volume DDoS packet flood detected.'
    };
  }

  // 14. Cascade Failure (Sequential domino collapse)
  if (
    /\b(cascade|cascading|chain reaction|domino|dominoes|catastrophe|collapse)\b/i.test(text) ||
    text.includes('cascade failure')
  ) {
    return {
      action: 'CASCADE_FAILURE',
      label: 'Cascade Multi-Node Failure Triggered',
      speechResponse: 'Alert! Cascade multi-node failure initiated.'
    };
  }

  // 15. Inject Latency / Jitter
  if (
    /\b(latency|jitter|lag|network delay|delay|slow down|high ping|350ms)\b/i.test(text) ||
    text.includes('inject latency') ||
    text.includes('add latency') ||
    text.includes('add jitter')
  ) {
    return {
      action: 'INJECT_LATENCY',
      label: 'Inject 350ms Network Latency',
      speechResponse: 'Three hundred fifty millisecond network latency injected.'
    };
  }

  // 16. Trigger / Force Emergency Election
  if (
    /\b(election|vote|re-elect|re elect|elect|force vote|call vote)\b/i.test(text) ||
    text.includes('trigger election') ||
    text.includes('force election') ||
    text.includes('new leader')
  ) {
    return {
      action: 'FORCE_ELECTION',
      label: 'Trigger Emergency Election',
      speechResponse: 'Emergency election broadcasted across all followers.'
    };
  }

  // 17. AI Voice Control (Mute/Unmute by voice)
  if (/\b(mute voice|mute assistant|silence assistant|quiet mode)\b/i.test(text)) {
    return {
      action: 'MUTE_VOICE',
      label: 'Mute AI Voice',
      speechResponse: 'Voice assistant muted.'
    };
  }
  if (/\b(unmute voice|enable voice|turn on voice)\b/i.test(text)) {
    return {
      action: 'UNMUTE_VOICE',
      label: 'Unmute AI Voice',
      speechResponse: 'Voice assistant active.'
    };
  }

  // 18. Conservative Fallback: ONLY when the utterance is finalized or explicitly single-word "crash"
  if (isFinal) {
    const singleWordCrash = /^(?:please\s+)?(?:crash|kill|take down)$/i.test(text);
    if (singleWordCrash) {
      return {
        action: 'CRASH_LEADER',
        label: 'Crash Current Leader',
        speechResponse: 'Primary leader terminated. Emergency failover in progress.'
      };
    }
  }

  return { action: 'UNKNOWN', text, label: `Unrecognized: "${text}"` };
}
