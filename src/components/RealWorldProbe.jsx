import React, { useState } from 'react';
import { Globe, Play, Activity, AlertTriangle, CheckCircle, Clock, Zap, RefreshCw } from 'lucide-react';
import { soundFX } from '../utils/audioEffects';

export default function RealWorldProbe({ onLogEvent }) {
  const [targetUrl, setTargetUrl] = useState('https://httpbin.org/get');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ sent: 0, successes: 0, failures: 0, avgLatency: 0 });

  const runProbe = async (burstCount = 3) => {
    if (!targetUrl.trim() || isRunning) return;

    soundFX.playClick();
    setIsRunning(true);
    let totalTime = 0;
    let successCount = 0;
    let failCount = 0;
    const probeRunResults = [];

    for (let i = 1; i <= burstCount; i++) {
      const startTime = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(targetUrl, {
          method: 'GET',
          signal: controller.signal,
          mode: 'cors'
        });
        clearTimeout(timeoutId);

        const elapsed = Math.round(performance.now() - startTime);
        totalTime += elapsed;
        successCount++;

        probeRunResults.unshift({
          id: Date.now() + Math.random(),
          time: new Date().toLocaleTimeString(),
          url: targetUrl,
          status: res.status,
          latency: elapsed,
          success: true
        });
      } catch (err) {
        const elapsed = Math.round(performance.now() - startTime);
        totalTime += elapsed;
        failCount++;

        probeRunResults.unshift({
          id: Date.now() + Math.random(),
          time: new Date().toLocaleTimeString(),
          url: targetUrl,
          status: err.name === 'AbortError' ? 'TIMEOUT (4s)' : 'CORS / NET ERR',
          latency: elapsed,
          success: false
        });
      }
    }

    const newSent = stats.sent + burstCount;
    const newSuccesses = stats.successes + successCount;
    const newFailures = stats.failures + failCount;
    const newAvg = Math.round(totalTime / burstCount);

    setStats({
      sent: newSent,
      successes: newSuccesses,
      failures: newFailures,
      avgLatency: newAvg
    });

    setResults((prev) => [...probeRunResults, ...prev].slice(0, 15));
    setIsRunning(false);

    if (onLogEvent) {
      onLogEvent(
        failCount > 0 ? 'CHAOS' : 'RECOVERY',
        `REAL-WORLD PROBE: ${burstCount} requests sent to ${targetUrl}. Avg Latency: ${newAvg}ms (${successCount} OK, ${failCount} Fail).`
      );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Read-Only HTTP Resilience Probe
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold uppercase">
                GET ONLY
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Sends small GET bursts to an endpoint and records browser-observed latency, timeouts, and status codes. No mutations.
            </p>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Latency: </span>
            <span className="text-cyan-400 font-bold">{stats.avgLatency}ms</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Pass Rate: </span>
            <span className="text-emerald-400 font-bold">
              {stats.sent > 0 ? Math.round((stats.successes / stats.sent) * 100) : 100}%
            </span>
          </div>
        </div>
      </div>

      {/* Target URL Input Bar */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="Enter any HTTP/REST endpoint URL (e.g. http://localhost:8000/health)"
            className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 outline-none transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => runProbe(1)}
            disabled={isRunning}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Ping 1x
          </button>

          <button
            onClick={() => runProbe(5)}
            disabled={isRunning}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-cyan-500/20"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            GET Burst 5x
          </button>
        </div>
      </div>

      {/* Live Probe Results Stream */}
      {results.length > 0 && (
        <div className="mt-4 border border-slate-800/80 rounded-2xl bg-slate-950/60 p-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
          {results.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80"
            >
              <div className="flex items-center gap-2">
                {r.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span className="text-slate-400 text-[10px]">{r.time}</span>
                <span className="text-slate-200 truncate max-w-[280px]">{r.url}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  r.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  STATUS: {r.status}
                </span>
                <span className="text-cyan-400 font-bold text-[11px]">{r.latency}ms</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
