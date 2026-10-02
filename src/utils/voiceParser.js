// Natural Language intent parser for Voice Chaos Commands

export function parseVoiceCommand(transcript) {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.toLowerCase().trim();

  // 1. Crash leader
  if (text.includes('crash leader') || text.includes('kill leader') || text.includes('stop leader') || text.includes('leader down')) {
    return { action: 'CRASH_LEADER', label: 'Crash Current Leader' };
  }

  // 2. Specific node crash (e.g., "crash node 2", "kill node 3", "crash server 1")
  const crashMatch = text.match(/(?:crash|kill|terminate|stop|destroy)\s+(?:node|server)\s+([1-5])/);
  if (crashMatch) {
    const nodeId = parseInt(crashMatch[1], 10);
    return { action: 'CRASH_NODE', nodeId, label: `Crash Node ${nodeId}` };
  }

  // 3. Isolate / Partition node
  const isolateMatch = text.match(/(?:isolate|partition|disconnect|sever)\s+(?:node|server)?\s*([1-5])?/);
  if (isolateMatch) {
    const nodeId = isolateMatch[1] ? parseInt(isolateMatch[1], 10) : 1;
    return { action: 'ISOLATE_NODE', nodeId, label: `Isolate Node ${nodeId}` };
  }

  // 4. Heal / Revive all
  if (text.includes('heal') || text.includes('revive') || text.includes('restore') || text.includes('fix all') || text.includes('reconnect')) {
    return { action: 'HEAL_ALL', label: 'Heal Cluster & Reconnect All' };
  }

  // 5. Inject latency / jitter
  if (text.includes('latency') || text.includes('jitter') || text.includes('delay') || text.includes('slow')) {
    return { action: 'INJECT_LATENCY', label: 'Inject 350ms Network Latency' };
  }

  // 6. Force election / trigger election
  if (text.includes('election') || text.includes('vote') || text.includes('re-elect')) {
    return { action: 'FORCE_ELECTION', label: 'Trigger Emergency Election' };
  }

  // 7. General kill / crash
  if (text.includes('crash') || text.includes('kill')) {
    return { action: 'CRASH_LEADER', label: 'Crash Current Leader' };
  }

  return { action: 'UNKNOWN', text, label: `Unrecognized: "${text}"` };
}
