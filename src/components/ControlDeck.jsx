import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Zap, ShieldCheck, Clock, Radio, RefreshCw, Volume2 } from 'lucide-react';
import { parseVoiceCommand } from '../utils/voiceParser';
import { soundFX } from '../utils/audioEffects';

export default function ControlDeck({ onExecuteAction, lastVoiceCmd, isMuted, setIsMuted }) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      soundFX.playVoiceBeep();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interim || finalTranscript);

      if (finalTranscript) {
        const parsed = parseVoiceCommand(finalTranscript);
        if (parsed && parsed.action !== 'UNKNOWN') {
          soundFX.playVoiceBeep();
          onExecuteAction(parsed.action, parsed.nodeId, finalTranscript);
          setTimeout(() => setInterimTranscript(''), 2000);
        }
      }
    };

    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      if (e.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we intended to stay listening
      if (isListening) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    setRecognitionInstance(recognition);

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [onExecuteAction, isListening]);

  const toggleListening = () => {
    soundFX.init();
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Brave.');
      return;
    }
    if (isListening) {
      setIsListening(false);
      if (recognitionInstance) recognitionInstance.stop();
    } else {
      setIsListening(true);
      if (recognitionInstance) {
        try {
          recognitionInstance.start();
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
      {/* Voice Control Primary Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={toggleListening}
            className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 shadow-xl ${
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
                {isListening ? 'LISTENING LIVE' : 'MIC STANDBY'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              {isListening
                ? interimTranscript
                  ? `Heard: "${interimTranscript}"`
                  : 'Say commands: "Crash Leader", "Isolate Node 2", "Heal Cluster"'
                : 'Click mic to activate voice commands or dictate via Wispr Flow'}
            </p>
          </div>
        </div>

        {/* Audio Mute & Simulated Test Input */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              isMuted
                ? 'bg-slate-800 border-slate-700 text-slate-500'
                : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-400'
            }`}
            title="Toggle procedural audio sound effects"
          >
            <Volume2 className="w-4 h-4" />
            {isMuted ? 'MUTED' : 'FX ON'}
          </button>
        </div>
      </div>

      {/* Recognized Voice Command Feedback Banner */}
      {lastVoiceCmd && (
        <div className="my-3 px-3 py-2 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
          <span className="text-cyan-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            VOICE INTENT DETECTED:
          </span>
          <span className="text-slate-200 font-bold">"{lastVoiceCmd}"</span>
        </div>
      )}

      {/* Manual Action Trigger Grid */}
      <div className="pt-4">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <span>Direct Chaos Triggers</span>
          <span className="text-slate-600">(Or trigger via speech)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('CRASH_LEADER', null, 'Crash Leader (Manual Trigger)');
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/50 hover:border-rose-500 transition-all text-xs font-medium active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            Crash Leader
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('ISOLATE_NODE', 2, 'Isolate Node 2 (Manual Trigger)');
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 hover:bg-amber-900/50 hover:border-amber-500 transition-all text-xs font-medium active:scale-95"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            Isolate Node 2
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('INJECT_LATENCY', null, 'Inject Latency (Manual Trigger)');
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/50 hover:border-indigo-500 transition-all text-xs font-medium active:scale-95"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            +350ms Jitter
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('FORCE_ELECTION', null, 'Force Election (Manual Trigger)');
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-300 hover:bg-purple-900/50 hover:border-purple-500 transition-all text-xs font-medium active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            Trigger Vote
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('HEAL_ALL', null, 'Heal All (Manual Trigger)');
            }}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-500 transition-all text-xs font-medium active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Heal Cluster
          </button>
        </div>
      </div>
    </div>
  );
}
