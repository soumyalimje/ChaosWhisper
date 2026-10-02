import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

export default function EventLog({ logs, onClearLogs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getTagColor = (type) => {
    switch (type) {
      case 'CHAOS':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'ELECTION':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'RECOVERY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'VOICE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'HEARTBEAT':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Raft Consensus Event Log
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {logs.length} EVENTS
          </span>
        </div>

        <button
          onClick={onClearLogs}
          className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition-colors"
          title="Clear logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrolling Log Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px]">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-start gap-2 leading-relaxed"
          >
            {/* Timestamp */}
            <span className="text-slate-500 text-[10px] shrink-0 pt-0.5">
              {log.time}
            </span>

            {/* Tag */}
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getTagColor(
                log.type
              )}`}
            >
              {log.type}
            </span>

            {/* Message Body */}
            <span className="text-slate-300 break-words">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
