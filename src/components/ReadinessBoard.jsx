import React from 'react';
import { ArrowRight, CheckCircle2, Circle, Crosshair, Play, RotateCcw, ShieldCheck, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';

const SCENARIOS = [
  {
    id: 'payment-failure',
    label: 'Payment Timeout Drill',
    impact: 'Payment Gateway timeout (>800ms)',
    category: 'Microservices',
    objective: 'Enforce bounded 800ms client timeout and verify order fallback decoupling.',
    actionLabel: 'Inject Payment Failure',
    action: { type: 'CRASH_SERVICE', payload: 'payments', voice: 'Scenario: Payment timeout failure injected' }
  },
  {
    id: 'circuit-breaker',
    label: 'Circuit Breaker Fallback Drill',
    impact: 'Cascading dependency saturation',
    category: 'Resilience Pattern',
    objective: 'Trip circuit breaker on downstream failure and verify synthetic fallback response.',
    actionLabel: 'Trip Circuit Breakers',
    action: { type: 'TRIP_BREAKER', payload: null, voice: 'Scenario: Circuit breaker tripped to open state' }
  },
  {
    id: 'two-node-failure',
    label: 'Two-Node Consensus Drill',
    impact: 'Simultaneous loss of 2 cluster nodes',
    category: 'Consensus Quorum',
    objective: 'Verify election for Term N+1 completes safely with exactly 3 surviving nodes.',
    actionLabel: 'Crash 2 Raft Nodes',
    action: { type: 'CRASH_TWO_NODES', payload: null, voice: 'Scenario: Two nodes crashed. Quorum margin at zero.' }
  },
  {
    id: 'quorum-loss',
    label: 'Quorum Collapse (< 3) Alert Drill',
    impact: '3 nodes down (Quorum lost)',
    category: 'Consensus Safety',
    objective: 'Enforce split-brain fencing, freeze uncommitted writes, and emit P0 emergency alert.',
    actionLabel: 'Trigger Quorum Loss',
    action: { type: 'CASCADE_FAILURE', payload: null, voice: 'Scenario: Quorum lost. Cluster writes fenced.' }
  },
  {
    id: 'regional-failover',
    label: 'AWS Regional Failover Runbook',
    impact: 'Primary AWS us-east-1 blackout',
    category: 'Multi-Region Cloud',
    objective: 'Execute Route 53 low-TTL DNS shift and verify traffic drains cleanly to us-west-2.',
    actionLabel: 'Blackout US-East Region',
    action: { type: 'CRASH_REGION', payload: 'us-east-1', voice: 'Scenario: Regional blackout. Route 53 failing over.' }
  },
  {
    id: 'black-friday',
    label: 'Black Friday 150k RPS Drill',
    impact: '10x traffic storm & cache stampede',
    category: 'Peak Load Chaos',
    objective: 'Measure auto-scaling recovery, Redis resilience, and database isolation under flood.',
    actionLabel: 'Launch Mega Drill',
    action: { type: 'RUN_BLACK_FRIDAY', payload: null, voice: 'Scenario: Black Friday traffic flood injected.' }
  }
];

export { SCENARIOS };

export default function ReadinessBoard({ activeScenario, completedScenarios, onRunScenario, onHeal }) {
  const completedCount = completedScenarios.length;
  const readiness = Math.round((completedCount / SCENARIOS.length) * 100);
  const active = SCENARIOS.find((scenario) => scenario.id === activeScenario);

  return (
    <section className="border border-cyan-500/20 bg-slate-900/85 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                SRE Incident Readiness Board
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-2.5 py-0.5 font-bold">
                {completedCount} / {SCENARIOS.length} Certified
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Execute standardized resilience drills, observe failure blast radius, apply remediation guidance, and restore to certify readiness.
            </p>
          </div>
        </div>

        {/* Readiness Meter */}
        <div className="flex items-center gap-3 font-mono bg-slate-950/70 px-4 py-2 rounded-2xl border border-slate-800">
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">System Readiness</div>
            <div className={`text-base font-extrabold ${readiness === 100 ? 'text-emerald-400' : 'text-cyan-300'}`}>
              {readiness}%
            </div>
          </div>
          <div className="w-24 h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                readiness === 100 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`}
              style={{ width: `${readiness}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Grid of 6 Scenarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SCENARIOS.map((scenario) => {
          const isComplete = completedScenarios.includes(scenario.id);
          const isActive = activeScenario === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all duration-300 ${
                isActive
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                  : isComplete
                  ? 'border-emerald-500/30 bg-slate-950/50 hover:border-emerald-500/50'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold text-cyan-400/90 tracking-wider">
                      {scenario.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-100 mt-0.5">{scenario.label}</h3>
                  </div>
                  {isComplete ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Passed
                    </span>
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-1" />
                  )}
                </div>

                <div className="text-[10px] text-rose-300 font-mono mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="truncate">{scenario.impact}</span>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-400 mt-2 min-h-[36px] font-sans">
                  {scenario.objective}
                </p>
              </div>

              <button
                onClick={() => onRunScenario(scenario)}
                disabled={Boolean(activeScenario && !isActive)}
                className={`mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-mono font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
                  isActive
                    ? 'bg-rose-950/70 border-rose-500 text-rose-200 animate-pulse'
                    : isComplete
                    ? 'border-emerald-600/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/40'
                    : 'border-cyan-700/60 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 shadow-sm'
                }`}
              >
                <Play className="w-3 h-3" />
                {isActive ? 'Drill In-Flight' : isComplete ? 'Re-run Drill' : scenario.actionLabel}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer bar with completion / restore */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 pt-3.5">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          {active ? (
            <span>
              Drill active: <strong className="text-cyan-300">{active.label}</strong>. Study the remediation plan above, then click Restore to certify.
            </span>
          ) : (
            <span>Select any drill to test resilience under fire and unlock concrete engineering runbooks.</span>
          )}
        </div>

        {activeScenario && (
          <button
            onClick={onHeal}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 px-4 py-2.5 text-xs font-mono font-extrabold transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-950" />
            Certify & Restore Cluster
            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        )}
      </div>
    </section>
  );
}
