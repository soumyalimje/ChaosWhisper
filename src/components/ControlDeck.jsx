import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Zap, ShieldCheck, Clock, Radio, RefreshCw, Volume2, AlertCircle, Crosshair, Crown, Flame, Bot, Send } from 'lucide-react';
import { parseVoiceCommand } from '../utils/voiceParser';
import { soundFX } from '../utils/audioEffects';
import { aiVoice } from '../utils/aiVoice';

export default function ControlDeck({ onExecuteAction, lastVoiceCmd, isMuted, setIsMuted, nodes, activeLeaderId, latency }) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micError, setMicError] = useState('');
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState(true);
  const [manualInput, setManualInput] = useState('');

  const recognitionRef = useRef(null);
  const lastExecutedTimeRef = useRef(0);
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  // Initialize Speech Recognition
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
        setLiveTranscript(combined);

        // Instant Hands-Free Intent Match
        const parsed = parseVoiceCommand(combined);
        if (parsed && parsed.action !== 'UNKNOWN') {
          const now = Date.now();
          // Debounce same execution within 1.2 seconds
          if (now - lastExecutedTimeRef.current > 1200) {
            lastExecutedTimeRef.current = now;
            soundFX.playVoiceBeep();

            // Speak AI voice response
            if (voiceAssistantEnabled && parsed.speechResponse) {
              aiVoice.speak(parsed.speechResponse);
            }

            // Execute action immediately without user click!
            onExecuteAction(parsed.action, parsed.nodeId, combined);

            // Clear text display after execution
            setTimeout(() => setLiveTranscript(''), 2500);
          }
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition notice:', e.error);
        if (e.error === 'not-allowed') {
          setMicError('Microphone permission required! Click the lock icon in the browser URL bar to allow.');
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Auto-reconnect if meant to keep listening (True Hands-Free)
        if (isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // will restart on next interaction
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition not available in this context:', err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, [onExecuteAction, voiceAssistantEnabled]);

  const toggleListening = () => {
    soundFX.init();
    setMicError('');

    if (!speechSupported) {
      setMicError('Web Speech API is not supported in this browser. Please open in Google Chrome, Brave, or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    } else {
      setIsListening(true);
      isListeningRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Recognition start caught:', err);
        }
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    soundFX.init();
    const parsed = parseVoiceCommand(manualInput);
    if (parsed && parsed.action !== 'UNKNOWN') {
      if (voiceAssistantEnabled && parsed.speechResponse) {
        aiVoice.speak(parsed.speechResponse);
      }
      onExecuteAction(parsed.action, parsed.nodeId, manualInput);
    } else {
      onExecuteAction('CRASH_LEADER', null, manualInput);
    }
    setManualInput('');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
      {/* Top Banner: Glowing Siri/Wispr Voice Orb & Status */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-5 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Glowing Animated Voice Orb Button */}
          <button
            onClick={toggleListening}
            className={`relative flex items-center justify-center w-16 h-16 rounded-3xl transition-all duration-500 cursor-pointer shadow-2xl ${
              isListening
                ? 'bg-gradient-to-tr from-rose-600 via-pink-500 to-purple-600 text-white shadow-[0_0_35px_rgba(244,63,94,0.5)] ring-4 ring-rose-500/30 scale-105'
                : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95'
            }`}
            title="Click to toggle continuous voice listening"
          >
            {isListening ? (
              <>
                <span className="absolute inset-0 rounded-3xl bg-rose-500 animate-ping opacity-30" />
                <Mic className="w-8 h-8 relative z-10 animate-bounce" />
              </>
            ) : (
              <MicOff className="w-7 h-7" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isListening ? 'text-rose-400 animate-spin' : 'text-slate-500'}`} />
                Wispr Flow Hands-Free Command Plane
              </span>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isListening
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isListening ? '🎙️ LISTENING CONTINUOUSLY' : 'MIC OFF (CLICK ORB TO START)'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-1 font-mono">
              {isListening ? (
                liveTranscript ? (
                  <span className="text-cyan-300 font-semibold animate-pulse">
                    Heard: "{liveTranscript}"
                  </span>
                ) : (
                  <span className="text-emerald-400/90 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Hands-free active. Just speak: "Crash Leader", "Simulate DDoS", "Heal Cluster"...
                  </span>
                )
              ) : (
                'Click the Orb to enable 100% hands-free voice operations'
              )}
            </p>
          </div>
        </div>

        {/* AI Voice Toggle & FX Mute Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const next = !voiceAssistantEnabled;
              setVoiceAssistantEnabled(next);
              aiVoice.toggle(next);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              voiceAssistantEnabled
                ? 'bg-purple-950/60 border-purple-500/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
            title="Toggle AI voice speaking responses back to you"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            {voiceAssistantEnabled ? 'AI VOICE: ON' : 'AI VOICE: MUTED'}
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              isMuted
                ? 'bg-slate-800 border-slate-700 text-slate-500'
                : 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            }`}
            title="Toggle Web Audio sound effects"
          >
            <Volume2 className="w-4 h-4" />
            {isMuted ? 'FX OFF' : 'FX ON'}
          </button>
        </div>
      </div>

      {/* Mic Permission Warning */}
      {micError && (
        <div className="mt-4 p-3.5 bg-rose-950/60 border border-rose-500/80 rounded-2xl flex items-center gap-3 text-xs text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Real-Time Executed Command Banner */}
      {lastVoiceCmd && (
        <div className="mt-4 px-4 py-3 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 border border-cyan-500/40 rounded-2xl flex items-center justify-between text-xs font-mono shadow-xl">
          <span className="text-cyan-400 flex items-center gap-2 font-bold tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            VOICE COMMAND EXECUTED:
          </span>
          <span className="text-slate-100 font-bold bg-cyan-500/20 px-2 py-0.5 rounded-lg border border-cyan-500/30">
            "{lastVoiceCmd}"
          </span>
        </div>
      )}

      {/* Target Node Strike Row */}
      <div className="mt-5 rounded-2xl border border-rose-900/40 bg-slate-950/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
              <Crosshair className="h-4 w-4 text-rose-400" />
              Target Specific Server
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">
              Say: <span className="text-cyan-300 font-semibold">"Crash Server 1"</span> or click any server to inject failure:
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(nodes || []).map((node) => (
              <button
                key={node.id}
                onClick={() => {
                  soundFX.playClick();
                  onExecuteAction('CRASH_NODE', node.id, `Crash Server ${node.id}`);
                }}
                disabled={node.status === 'OFFLINE'}
                className={`relative flex min-w-[76px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
                  node.status === 'OFFLINE'
                    ? 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600 opacity-50'
                    : 'border-rose-800/60 bg-rose-950/40 text-rose-200 hover:border-rose-400 hover:bg-rose-900/60 shadow-lg shadow-rose-950/40'
                }`}
              >
                {activeLeaderId === node.id && <Crown className="h-3.5 w-3.5 text-emerald-400" />}
                SERVER-{node.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Epic Chaos Scenarios Grid */}
      <div className="pt-5">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Epic Chaos Scenarios
          </span>
          <span className="text-slate-500 text-[10px]">Just speak these commands aloud hands-free</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => {
              soundFX.playClick();
              if (voiceAssistantEnabled) aiVoice.speak('Primary leader terminated. Emergency election starting.');
              onExecuteAction('CRASH_LEADER', null, 'Crash Leader');
            }}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 hover:bg-rose-900/50 hover:border-rose-400 transition-all text-xs font-mono font-bold active:scale-95 cursor-pointer shadow-lg shadow-rose-950/30"
          >
            <Zap className="w-4 h-4 text-rose-400" />
            Crash Leader
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              if (voiceAssistantEnabled) aiVoice.speak('Warning! Distributed Denial of Service attack detected. Flooding packets.');
              onExecuteAction('SIMULATE_DDOS', null, 'Simulate DDoS Flood');
            }}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-red-950/50 border border-red-700/60 text-red-200 hover:bg-red-900/60 hover:border-red-400 transition-all text-xs font-mono font-bold active:scale-95 cursor-pointer shadow-lg shadow-red-950/40"
          >
            <Flame className="w-4 h-4 text-red-400 animate-pulse" />
            DDoS Storm
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              if (voiceAssistantEnabled) aiVoice.speak('Network partition applied. Server 2 isolated.');
              onExecuteAction('ISOLATE_NODE', 2, 'Isolate Server 2');
            }}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 hover:bg-amber-900/50 hover:border-amber-400 transition-all text-xs font-mono font-bold active:scale-95 cursor-pointer shadow-lg shadow-amber-950/30"
          >
            <Radio className="w-4 h-4 text-amber-400" />
            Isolate Srv 2
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              if (voiceAssistantEnabled) aiVoice.speak('Latency injected. Three hundred fifty millisecond network lag.');
              onExecuteAction('INJECT_LATENCY', null, 'Inject Latency');
            }}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-200 hover:bg-indigo-900/50 hover:border-indigo-400 transition-all text-xs font-mono font-bold active:scale-95 cursor-pointer shadow-lg shadow-indigo-950/30"
          >
            <Clock className="w-4 h-4 text-indigo-400" />
            +350ms Jitter
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              if (voiceAssistantEnabled) aiVoice.speak('All nodes restored. Cluster healthy and balanced.');
              onExecuteAction('HEAL_ALL', null, 'Heal Cluster');
            }}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/60 text-emerald-200 hover:bg-emerald-900/60 hover:border-emerald-400 transition-all text-xs font-mono font-bold active:scale-95 cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Heal Cluster
          </button>
        </div>
      </div>

      {/* Dictation Input Fallback */}
      <form onSubmit={handleManualSubmit} className="mt-5 flex gap-2 pt-4 border-t border-slate-800/80">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Dictate via Wispr Flow here or type any command: 'Crash Server 1', 'Simulate DDoS', 'Heal All'..."
          className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 outline-none transition-all placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </form>
    </div>
  );
}
