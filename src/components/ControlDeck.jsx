import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Zap, ShieldCheck, Clock, Radio, RefreshCw, Volume2, Send, AlertCircle, Crosshair, Crown } from 'lucide-react';
import { parseVoiceCommand } from '../utils/voiceParser';
import { soundFX } from '../utils/audioEffects';

export default function ControlDeck({ onExecuteAction, lastVoiceCmd, isMuted, setIsMuted, nodes, activeLeaderId, latency }) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [micError, setMicError] = useState('');
  const recognitionRef = useRef(null);
  const lastExecutedRef = useRef('');

  useEffect(() => {
    let recognition = null;
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setMicError('');
        soundFX.playVoiceBeep();
      };

      recognition.onresult = (event) => {
        let combined = '';
        for (let i = 0; i < event.results.length; ++i) {
          combined += event.results[i][0].transcript + ' ';
        }
        combined = combined.trim();
        setTranscript(combined);

        // Check if command matches
        const parsed = parseVoiceCommand(combined);
        if (parsed && parsed.action !== 'UNKNOWN') {
          const cmdKey = `${parsed.action}-${parsed.nodeId || ''}-${Date.now()}`;
          // Prevent firing same command within 1.5 seconds
          if (Date.now() - (lastExecutedRef.current.time || 0) > 1500) {
            lastExecutedRef.current = { time: Date.now(), key: cmdKey };
            soundFX.playVoiceBeep();
            onExecuteAction(parsed.action, parsed.nodeId, combined);
            setTimeout(() => setTranscript(''), 2000);
          }
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setMicError('Microphone blocked! Please click the lock icon in the Chrome URL bar and allow microphone access.');
          setIsListening(false);
        } else if (e.error !== 'no-speech') {
          setMicError(`Voice error: ${e.error}`);
        }
      };

      recognition.onend = () => {
        // Keep listening if user didn't explicitly toggle off
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            setIsListening(false);
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition not permitted in this context:', err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, [onExecuteAction, isListening]);

  const toggleListening = () => {
    soundFX.init();
    setMicError('');

    if (!speechSupported) {
      setMicError('Web Speech API is not supported in this browser. Please open in Google Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Start error:', err);
        // Sometimes it throws if already started
        setIsListening(true);
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    soundFX.init();
    const parsed = parseVoiceCommand(manualInput);
    if (parsed && parsed.action !== 'UNKNOWN') {
      soundFX.playVoiceBeep();
      onExecuteAction(parsed.action, parsed.nodeId, manualInput);
    } else {
      onExecuteAction('CRASH_LEADER', null, manualInput);
    }
    setManualInput('');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
      {/* Voice Control Primary Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={toggleListening}
            className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 shadow-xl cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white shadow-rose-500/30 ring-4 ring-rose-500/20 animate-pulse'
                : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white hover:shadow-cyan-500/25 hover:scale-105 active:scale-95'
            }`}
            title="Click to toggle Voice Control"
          >
            {isListening ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Radio className={`w-4 h-4 ${isListening ? 'text-rose-400 animate-spin' : 'text-slate-500'}`} />
                Wispr Flow Control Plane
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isListening
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isListening ? 'LISTENING LIVE' : 'MIC OFF (CLICK TO LISTEN)'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              {isListening
                ? transcript
                  ? `Hearing: "${transcript}"`
                  : 'Listening... Say: "Crash Leader", "Isolate Node 2", or "Heal Cluster"'
                : 'Click the mic button to allow voice recognition, or use Wispr Flow in the input bar below'}
            </p>
          </div>
        </div>

        {/* Audio Mute */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              isMuted
                ? 'bg-slate-800 border-slate-700 text-slate-500'
                : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-400'
            }`}
            title="Toggle procedural audio sound effects"
          >
            <Volume2 className="w-4 h-4" />
            {isMuted ? 'FX MUTED' : 'FX ON'}
          </button>
        </div>
      </div>

      {/* Mic Permission Warning if Blocked */}
      {micError && (
        <div className="mt-3 p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Wispr Flow Direct Dictation Bar */}
      <div className="mt-4">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Dictate with Wispr Flow here or type: e.g. 'Crash Leader', 'Isolate Node 2', 'Heal All'..."
              className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            Execute
          </button>
        </form>
      </div>

      {/* Recognized Voice Command Feedback Banner */}
      {lastVoiceCmd && (
        <div className="mt-3 px-3 py-2 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
          <span className="text-cyan-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            EXECUTED COMMAND:
          </span>
          <span className="text-slate-200 font-bold">"{lastVoiceCmd}"</span>
        </div>
      )}

      {/* Chaos Control Panel */}
      <div className="mt-4 rounded-xl border border-rose-900/50 bg-slate-950/70 p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-rose-300">
              <Crosshair className="h-3.5 w-3.5 text-rose-400" />
              Chaos Control
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Strike a specific node or disrupt the active RPC channel.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(nodes || []).map((node) => (
              <button
                key={node.id}
                onClick={() => {
                  soundFX.playClick();
                  onExecuteAction('CRASH_NODE', node.id, `Hit Node ${node.id}`);
                }}
                disabled={node.status === 'OFFLINE'}
                className={`relative flex min-w-[68px] items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-mono font-semibold transition-all active:scale-95 ${
                  node.status === 'OFFLINE'
                    ? 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600'
                    : 'border-rose-800/60 bg-rose-950/30 text-rose-300 hover:border-rose-500 hover:bg-rose-900/50'
                }`}
                title={node.status === 'OFFLINE' ? `Node ${node.id} is already offline` : `Terminate Node ${node.id}`}
              >
                {activeLeaderId === node.id && <Crown className="h-3 w-3 text-emerald-400" />}
                NODE-{node.id}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('CRASH_LEADER', null, 'Terminate Active Leader');
            }}
            disabled={!activeLeaderId}
            className="flex items-center justify-center gap-2 rounded-lg border border-rose-700/70 bg-rose-900/40 px-3 py-2.5 text-xs font-semibold text-rose-200 transition-all hover:bg-rose-800/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-600"
          >
            <Zap className="h-3.5 w-3.5" />
            Terminate Active Leader
          </button>
          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('INJECT_LATENCY', null, 'Inject 350ms RPC Jitter');
            }}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] ${
              latency > 18
                ? 'border-indigo-500/70 bg-indigo-900/50 text-indigo-200'
                : 'border-indigo-800/60 bg-indigo-950/30 text-indigo-300 hover:border-indigo-500 hover:bg-indigo-900/50'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {latency > 18 ? `${latency}ms RPC Jitter Active` : 'Inject 350ms RPC Jitter'}
          </button>
        </div>
      </div>

      {/* Manual Action Trigger Grid */}
      <div className="pt-4">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Quick Chaos Injections</span>
          <span className="text-slate-500 text-[10px]">Click any chip to test</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('CRASH_LEADER', null, 'Crash Leader');
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/50 hover:border-rose-500 transition-all text-xs font-medium active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            Crash Leader
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('ISOLATE_NODE', 2, 'Isolate Node 2');
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 hover:bg-amber-900/50 hover:border-amber-500 transition-all text-xs font-medium active:scale-95 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            Isolate Node 2
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('INJECT_LATENCY', null, 'Inject Latency');
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/50 hover:border-indigo-500 transition-all text-xs font-medium active:scale-95 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            +350ms Jitter
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('FORCE_ELECTION', null, 'Force Election');
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-300 hover:bg-purple-900/50 hover:border-purple-500 transition-all text-xs font-medium active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            Trigger Vote
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('HEAL_ALL', null, 'Heal Cluster');
            }}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-500 transition-all text-xs font-medium active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Heal Cluster
          </button>
        </div>
      </div>
    </div>
  );
}
