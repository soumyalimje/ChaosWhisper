import React, { useState } from 'react';
import { FileText, Copy, Check, Download, X, ShieldAlert, Award, Clock, ArrowRight } from 'lucide-react';
import { getEngineeringPlan } from './EngineeringActionPlan';

export function generatePostMortemContent({ nodes, term, logs, mttrHistory, resiliencyScore, completedScenarios = [], scenarioId }) {
  const dateStr = new Date().toISOString();
  const leader = nodes.find((n) => n.role === 'LEADER' && n.status === 'ONLINE');
  const onlineCount = nodes.filter((n) => n.status === 'ONLINE').length;
  const avgMttr = mttrHistory.length > 0 
    ? Math.round(mttrHistory.reduce((a, b) => a + b, 0) / mttrHistory.length) 
    : 850;
  const engineeringPlan = getEngineeringPlan(scenarioId);

  return `# INCIDENT REHEARSAL REPORT
**Service Name:** ChaosWhisper Distributed Systems Simulation
**Date & Time:** ${dateStr}  
**Classification:** Simulated incident rehearsal
**Evidence Scope:** Browser simulation state and generated event log; not a production incident record or compliance certification
**Heuristic Resilience Score:** ${resiliencyScore}% (${resiliencyScore >= 90 ? 'nominal' : resiliencyScore >= 75 ? 'degraded' : 'quorum risk'})


## 1. Executive Summary
During this rehearsal, the browser simulation was subjected to voice- or text-triggered failure scenarios targeting consensus leaders, network partitions, and synthetic traffic floods. The Raft-inspired five-node model detected heartbeat failure and simulated an autonomous failover.

* **Current Epoch / Term:** Term ${term}
* **Current Operational Leader:** Server ${leader ? leader.id : 'N/A (Election In Flight)'}
* **Cluster Quorum Health:** ${onlineCount}/5 nodes operational (${Math.round((onlineCount / 5) * 100)}%)
* **Average Mean Time to Recovery (MTTR):** ${avgMttr}ms (measured within this rehearsal)
* **Readiness Scenarios Completed:** ${completedScenarios.length}/3


## 2. Blast Radius & Quorum Analysis
* **Consensus Quorum Tolerance:** $\\lfloor 5 / 2 \\rfloor + 1 = 3$ nodes required for authoritative commits.
* **Max Tolerated Simultaneous Failures:** 2 nodes ($f = \\frac{N-1}{2}$).
* **Current Fault Tolerance Margin:** ${Math.max(0, onlineCount - 3)} node(s) before quorum collapse.
* **Split-Brain Mitigation:** Monotonically increasing epoch terms model prevention of dual-leader partitioning.


## 3. Timestamped Incident Timeline
| Timestamp | Event Type | Description |
| :--- | :--- | :--- |
${logs.slice(-10).map((l) => `| ${l.time} | \`${l.type}\` | ${l.message} |`).join('\n')}


## 4. Architectural Hardening & SRE Recommendations
1. **Heartbeat Tuning:** Maintain heartbeat broadcast pulse between 150ms - 300ms to preserve election timeout boundaries ($2400ms$).
2. **Network Partition Resiliency:** Pre-configure witness nodes or lease-read mechanisms to minimize stale read probabilities during minority isolation.
3. **Automated Rollback:** Enforce automated traffic throttling when P99 RPC latency spikes above $250ms$ during DDoS storms.

## 5. Concrete Engineering Remediation Plan (5 Core Pillars)
  ### 1. WHAT IS BROKEN
${engineeringPlan.problem}

  ### 2. ROOT CAUSE ANALYSIS
${engineeringPlan.why}

  ### 3. PRODUCTION CODE CHANGE
\`\`\`${engineeringPlan.codeLang || 'typescript'}
${engineeringPlan.code}
\`\`\`

  ### 4. AUTOMATED FAILURE INJECTION
\`\`\`typescript
${engineeringPlan.test}
\`\`\`

  ### 5. VERIFICATION & PRODUCTION SIGNALS
${engineeringPlan.verify}


## 6. SRE Operational Runbook & Alert Configuration
${engineeringPlan.runbook}

**Estimated Business Value Protected:** ${engineeringPlan.roi || 'High Availability'}
**Suggested GitHub/Jira Issue:** \`${engineeringPlan.issue}\`

*Report compiled by ChaosWhisper from simulated state and event history.*

`;
}

export default function PostMortemModal({ isOpen, onClose, nodes, term, logs, mttrHistory, resiliencyScore, completedScenarios = [], scenarioId }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const markdownContent = generatePostMortemContent({ nodes, term, logs, mttrHistory, resiliencyScore, completedScenarios, scenarioId });

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chaoswhisper-postmortem-term-${term}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Incident Rehearsal Report
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ready to Export
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Generated from simulated timeline, blast radius, and recovery metrics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resilience Highlights */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Resilience:</span>
            <span className="font-bold text-emerald-400 text-sm">{resiliencyScore}%</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Evidence:</span>
            <span className="font-bold text-cyan-400">SIMULATED</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Report:</span>
            <span className="font-bold text-purple-400">DRILL ONLY</span>
          </div>
        </div>

        {/* Markdown Document Preview */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-slate-300 bg-slate-950/90 whitespace-pre-wrap leading-relaxed select-text">
          {markdownContent}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-[11px] text-slate-400 font-mono">
            Format: GitHub Flavored Markdown (simulation evidence)
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Markdown'}
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-500/25"
            >
              <Download className="w-4 h-4" />
              Download .MD File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
