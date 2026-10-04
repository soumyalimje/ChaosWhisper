import React, { useState } from 'react';
import { Check, Clipboard, Code2, Download, GitPullRequest, ListChecks, ShieldCheck, Target } from 'lucide-react';

const PLANS = {
  'payment-failure': {
    title: 'Harden the payment dependency',
    problem: 'Checkout requests continue to depend on a payment provider after the provider becomes unhealthy.',
    why: 'Without bounded timeouts and a breaker, slow payment calls consume worker capacity and turn a dependency outage into an order-system outage.',
    change: 'Add a short client timeout, retry only safe/idempotent operations with capped backoff, and return an explicit pending-payment fallback when the breaker is open.',
    code: `const payment = withTimeout(paymentClient, 800);\nconst result = await breaker.execute(() => payment.authorize(request));\nreturn result ?? { status: 'PENDING_PAYMENT' };`,
    test: 'Simulate payment timeout and 5xx responses. Assert the breaker opens, requests stop waiting after 800ms, and orders return the documented fallback.',
    verify: 'P99 order latency stays below the agreed threshold, checkout remains explainable to the user, and breaker recovery succeeds after the provider is healthy.',
    issue: 'Reliability: bound payment dependency failure',
  },
  'leader-election': {
    title: 'Prove safe leader failover',
    problem: 'The primary consensus node disappears and the cluster must elect exactly one replacement without losing quorum.',
    why: 'A fast election is not enough if a minority can commit writes or two leaders appear during a partition.',
    change: 'Add an integration test around heartbeat timeout, term increment, majority voting, and rejection of stale-term leaders.',
    code: `await cluster.stop('node-1');\nawait eventually(() => expect(cluster.leader()).toBe('node-2'));\nexpect(cluster.term()).toBeGreaterThan(previousTerm);\nexpect(cluster.committedLeaders()).toHaveLength(1);`,
    test: 'Kill one node, then two nodes, and finally partition a follower. Assert one leader with a higher term and no commits without a majority.',
    verify: 'Election completes within the recovery objective, quorum remains authoritative, and stale candidates cannot commit entries.',
    issue: 'Reliability: verify single-leader failover under quorum pressure',
  },
  'regional-failover': {
    title: 'Make regional failover observable and reversible',
    problem: 'Traffic remains exposed to a failed primary region until routing, health checks, and data-safety conditions agree.',
    why: 'Blind failover can send users to an unhealthy target or create split-brain writes across regions.',
    change: 'Use independent health checks, an explicit failover state, traffic-drain time, and a documented rollback condition before restoring the primary region.',
    code: `if (health.primary === 'OFFLINE' && health.secondary === 'READY') {\n  await router.shiftTraffic('secondary', { drainMs: 30000 });\n  audit.record('REGION_FAILOVER');\n}`,
    test: 'Make the primary health check fail, assert traffic shifts only to a ready secondary, and verify rollback waits for recovery plus data convergence.',
    verify: 'Error rate and latency recover within the objective, traffic distribution is visible, and the event log contains failover and rollback evidence.',
    issue: 'Reliability: rehearse regional failover with rollback evidence',
  },
};

const fallbackPlan = {
  title: 'Turn the observed failure into an engineering task',
  problem: 'A simulated component degraded and its dependencies were exposed.',
  why: 'The next action should be specific enough for an engineer to implement and verify.',
  change: 'Create a bounded failure test, document the expected fallback, and add an observable recovery signal.',
  code: `await injectFailure('dependency');\nawait expect(system).toRemainAvailable();\nawait expect(metrics.recoveryTime).toBeWithinObjective();`,
  test: 'Repeat the scenario in an automated test and assert the expected safety behavior.',
  verify: 'The system contains the failure, recovers within the objective, and leaves evidence for the next review.',
  issue: 'Reliability: convert rehearsal finding into a test',
};

export function getEngineeringPlan(scenarioId) {
  return PLANS[scenarioId] || fallbackPlan;
}

function toMarkdown(plan) {
  return `# Engineering Action Plan: ${plan.title}\n\n## Problem\n${plan.problem}\n\n## Why it matters\n${plan.why}\n\n## Recommended change\n${plan.change}\n\n## Implementation sketch\n\`\`\`js\n${plan.code}\n\`\`\`\n\n## Verification test\n${plan.test}\n\n## Success signal\n${plan.verify}\n\n## Suggested issue\n${plan.issue}\n`;
}

export default function EngineeringActionPlan({ scenarioId, hasEvidence }) {
  const [copied, setCopied] = useState(false);
  const plan = getEngineeringPlan(scenarioId);
  const markdown = toMarkdown(plan);

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const downloadPlan = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chaoswhisper-engineering-action-plan.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="border border-amber-500/25 bg-slate-900/85 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">Engineering Action Plan</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
                {hasEvidence ? 'Evidence captured' : 'Next engineering step'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Convert simulation evidence into an implementable change and a test.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={copyPlan} className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-2 text-[10px] font-mono font-bold text-slate-300 hover:text-white hover:border-amber-500/50">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy brief'}
          </button>
          <button onClick={downloadPlan} className="flex items-center gap-1.5 rounded-lg border border-amber-600/50 bg-amber-950/50 px-2.5 py-2 text-[10px] font-mono font-bold text-amber-200 hover:bg-amber-900/60">
            <Download className="w-3.5 h-3.5" />
            Download .md
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
        <PlanBlock icon={Target} label="Problem" value={plan.problem} />
        <PlanBlock icon={ShieldCheck} label="Why it happened" value={plan.why} />
        <PlanBlock icon={Code2} label="Code/config change" value={plan.change} />
        <PlanBlock icon={ListChecks} label="Test to write" value={plan.test} />
        <PlanBlock icon={GitPullRequest} label="Verify improvement" value={plan.verify} />
      </div>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">Implementation sketch</div>
        <pre className="overflow-x-auto text-[11px] leading-relaxed text-cyan-200 font-mono whitespace-pre-wrap">{plan.code}</pre>
      </div>
    </section>
  );
}

function PlanBlock({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-amber-400" />
        {label}
      </div>
      <p className="text-[10px] leading-relaxed text-slate-300">{value}</p>
    </div>
  );
}
