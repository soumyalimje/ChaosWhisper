// Natural Language intent parser for Voice Chaos Commands (Ultra-flexible matching)

export function parseVoiceCommand(transcript) {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.toLowerCase().trim();

  // 1. Specific node crash (e.g. "crash node 2", "kill 3", "crash server 1")
  const nodeNumMatch = text.match(/(?:node|server|number)?\s*([1-5])/);
  const targetNodeId = nodeNumMatch ? parseInt(nodeNumMatch[1], 10) : null;

  // 2. Crash Leader / Kill Leader (or just "crash", "kill" without number)
  if (text.includes('crash leader') || text.includes('kill leader') || text.includes('stop leader') || text.includes('leader down')) {
    return { action: 'CRASH_LEADER', label: 'Crash Current Leader' };
  }

  // If user says "crash node 2" or "kill node 3"
  if ((text.includes('crash') || text.includes('kill') || text.includes('stop') || text.includes('destroy')) && targetNodeId) {
    return { action: 'CRASH_NODE', nodeId: targetNodeId, label: `Crash Node ${targetNodeId}` };
  }

  // 3. Isolate / Partition
  if (text.includes('isolate') || text.includes('partition') || text.includes('disconnect') || text.includes('sever') || text.includes('cut')) {
    const id = targetNodeId || 2;
    return { action: 'ISOLATE_NODE', nodeId: id, label: `Isolate Node ${id}` };
  }

  // 4. Heal / Revive / Restore / Fix
  if (text.includes('heal') || text.includes('revive') || text.includes('restore') || text.includes('fix') || text.includes('reconnect') || text.includes('recover')) {
    return { action: 'HEAL_ALL', label: 'Heal Cluster & Reconnect All' };
  }

  // 5. Latency / Jitter / Delay
  if (text.includes('latency') || text.includes('jitter') || text.includes('delay') || text.includes('slow')) {
    return { action: 'INJECT_LATENCY', label: 'Inject 350ms Network Latency' };
  }

  // 6. Election / Vote
  if (text.includes('election') || text.includes('vote') || text.includes('elect')) {
    return { action: 'FORCE_ELECTION', label: 'Trigger Emergency Election' };
  }

  // Fallback: If user just said "crash" or "kill"
  if (text.includes('crash') || text.includes('kill') || text.includes('down')) {
    return { action: 'CRASH_LEADER', label: 'Crash Current Leader' };
  }

  return { action: 'UNKNOWN', text, label: `Unrecognized: "${text}"` };
}
