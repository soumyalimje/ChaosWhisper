// Natural Language Intent Parser with Epic Disaster Scenarios

export function parseVoiceCommand(transcript) {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.toLowerCase().trim();

  // 1. Epic Disaster Scenarios
  if (text.includes('ddos') || text.includes('attack') || text.includes('flood') || text.includes('surge') || text.includes('traffic storm')) {
    return {
      action: 'SIMULATE_DDOS',
      label: 'DDoS Traffic Storm Injected',
      speechResponse: 'Warning! Massive distributed packet flood detected. Latency critical.'
    };
  }

  if (text.includes('cascade') || text.includes('chain reaction') || text.includes('domino')) {
    return {
      action: 'CASCADE_FAILURE',
      label: 'Cascade Multi-Node Failure Triggered',
      speechResponse: 'Alert! Cascading node failures initiated across cluster.'
    };
  }

  // 2. Specific node crash (e.g. "crash node 2", "kill 3", "crash server 1")
  const nodeNumMatch = text.match(/(?:node|server|number)?\s*([1-5])/);
  const targetNodeId = nodeNumMatch ? parseInt(nodeNumMatch[1], 10) : null;

  // 3. Crash Leader / Kill Leader
  if (text.includes('crash leader') || text.includes('kill leader') || text.includes('stop leader') || text.includes('leader down') || text.includes('terminate leader')) {
    return {
      action: 'CRASH_LEADER',
      label: 'Crash Current Leader',
      speechResponse: 'Primary leader terminated. Initiating emergency Raft election.'
    };
  }

  // If user says "crash node 2" or "kill node 3"
  if ((text.includes('crash') || text.includes('kill') || text.includes('stop') || text.includes('destroy') || text.includes('terminate')) && targetNodeId) {
    return {
      action: 'CRASH_NODE',
      nodeId: targetNodeId,
      label: `Crash Node ${targetNodeId}`,
      speechResponse: `Node ${targetNodeId} offline. Re-routing cluster mesh.`
    };
  }

  // 4. Isolate / Partition
  if (text.includes('isolate') || text.includes('partition') || text.includes('disconnect') || text.includes('sever') || text.includes('cut')) {
    const id = targetNodeId || 2;
    return {
      action: 'ISOLATE_NODE',
      nodeId: id,
      label: `Isolate Node ${id}`,
      speechResponse: `Network partition applied. Node ${id} isolated from consensus.`
    };
  }

  // 5. Heal / Revive / Restore / Fix / Nominal
  if (text.includes('heal') || text.includes('revive') || text.includes('restore') || text.includes('fix') || text.includes('reconnect') || text.includes('recover') || text.includes('nominal')) {
    return {
      action: 'HEAL_ALL',
      label: 'Heal Cluster & Reconnect All',
      speechResponse: 'Restoration sequence initiated. All nodes online. Systems nominal.'
    };
  }

  // 6. Latency / Jitter / Delay
  if (text.includes('latency') || text.includes('jitter') || text.includes('delay') || text.includes('slow')) {
    return {
      action: 'INJECT_LATENCY',
      label: 'Inject 350ms Network Latency',
      speechResponse: 'Network degradation applied. 350 millisecond RPC jitter active.'
    };
  }

  // 7. Election / Vote
  if (text.includes('election') || text.includes('vote') || text.includes('elect')) {
    return {
      action: 'FORCE_ELECTION',
      label: 'Trigger Emergency Election',
      speechResponse: 'Emergency election broadcasted across all followers.'
    };
  }

  // Fallback: If user just said "crash" or "kill"
  if (text.includes('crash') || text.includes('kill') || text.includes('down')) {
    return {
      action: 'CRASH_LEADER',
      label: 'Crash Current Leader',
      speechResponse: 'Primary leader terminated. Emergency failover in progress.'
    };
  }

  return { action: 'UNKNOWN', text, label: `Unrecognized: "${text}"` };
}
