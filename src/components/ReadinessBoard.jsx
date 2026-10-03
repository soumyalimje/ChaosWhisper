import React from 'react';
import { ArrowRight, CheckCircle2, Circle, Crosshair, Play, RotateCcw, ShieldCheck } from 'lucide-react';

const SCENARIOS = [
  {
    id: 'payment-failure',
    label: 'Checkout outage',
    impact: 'Payment dependency fails',
    objective: 'Verify circuit breakers protect order flow.',
    actionLabel: 'Run payment drill',
    action: { type: 'CRASH_SERVICE', payload: 'payments', voice: 'Scenario: Payment dependency failure' }
  },
  {
    id: 'leader-election',
    label: 'Leader failover',
    impact: 'Primary consensus node fails',
    objective: 'Measure election and quorum recovery.',
    actionLabel: 'Run leader drill',
    action: { type: 'CRASH_LEADER', payload: null, voice: 'Scenario: Leader failover' }
  },
  {
    id: 'regional-failover',
    label: 'Regional failover',
    impact: 'Primary region goes offline',
    objective: 'Observe latency and traffic-risk changes.',
    actionLabel: 'Run region drill',
    action: { type: 'CRASH_REGION', payload: 'us-east-1', voice: 'Scenario: Regional failover' }
  }
];

export { SCENARIOS };

export default function ReadinessBoard({ activeScenario, completedScenarios, onRunScenario, onHeal }) {
  const completedCount = completedScenarios.length;
  const readiness = Math.round((completedCount / SCENARIOS.length) * 100);
  const active = SCENARIOS.find((scenario) => scenario.id === activeScenario);

  return (
    <section className="border border-cyan-500/20 bg-slate-900/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">Readiness Board</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-2 py-0.5">
                Practice loop
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Run a failure, inspect the evidence, then restore the system to complete the rehearsal.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Team readiness</div>
            <div className="text-lg font-bold text-cyan-300">{readiness}%</div>
          </div>
          <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${readiness}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SCENARIOS.map((scenario) => {
          const isComplete = completedScenarios.includes(scenario.id);
          const isActive = activeScenario === scenario.id;
          return (
            <div key={scenario.id} className={`rounded-xl border p-3 transition-colors ${isActive ? 'border-cyan-400/70 bg-cyan-950/20' : 'border-slate-800 bg-slate-950/50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-100">{scenario.label}</div>
                  <div className="text-[10px] text-rose-300 mt-1">{scenario.impact}</div>
                </div>
                {isComplete ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <Circle className="w-4 h-4 text-slate-600 shrink-0" />}
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400 mt-2 min-h-8">{scenario.objective}</p>
              <button
                onClick={() => onRunScenario(scenario)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-cyan-700/60 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 px-2 py-2 text-[10px] font-mono font-bold transition-colors"
              >
                <Play className="w-3 h-3" />
                {isComplete ? 'Run again' : scenario.actionLabel}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          {active ? `Active: ${active.label}. Restore after the drill to record evidence.` : 'Choose a rehearsal to create a measurable readiness result.'}
        </div>
        {activeScenario && (
          <button onClick={onHeal} className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/60 text-emerald-200 px-3 py-2 text-[10px] font-mono font-bold hover:bg-emerald-900/70 transition-colors">
            <RotateCcw className="w-3 h-3" />
            Restore & complete
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </section>
  );
}
