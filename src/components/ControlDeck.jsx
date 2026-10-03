import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Zap, ShieldCheck, Clock, Radio, Volume2, AlertCircle, Crosshair, Crown, Flame, Bot, Send, Gauge, FileText, Globe, Layers, Server, DollarSign } from 'lucide-react';
import { parseVoiceCommand } from '../utils/voiceParser';
import { soundFX } from '../utils/audioEffects';
import { aiVoice } from '../utils/aiVoice';

export default function ControlDeck({
  onExecuteAction,
  lastVoiceCmd,
  isMuted,
  setIsMuted,
  nodes,
  activeLeaderId,
  latency,
  onOpenReport,
  onToggleProbe,
  showProbe,
  activeTopology = 'MICROSERVICES',
  microservices = [],
  cloudRegions = []
}) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micError, setMicError] = useState('');
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0); // 1.0x conversational default
  const [manualInput, setManualInput] = useState('');

  const recognitionRef = useRef(null);
  const lastExecutedTimeRef = useRef(0);
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;
  const processedIndexRef = useRef(0);

  // Stable refs — keeps recognition alive without recreating it on every render
  const onExecuteActionRef = useRef(onExecuteAction);
  onExecuteActionRef.current = onExecuteAction;
  const onOpenReportRef = useRef(onOpenReport);
  onOpenReportRef.current = onOpenReport;
  const voiceAssistantEnabledRef = useRef(voiceAssistantEnabled);
  voiceAssistantEnabledRef.current = voiceAssistantEnabled;

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
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError('');
        processedIndexRef.current = 0;
        // No startup beep — mic activates silently
      };

      recognition.onresult = (event) => {
        let activeTranscript = '';
        let hasFinal = false;

        for (let i = processedIndexRef.current; i < event.results.length; ++i) {
          const res = event.results[i];
          activeTranscript += res[0].transcript + ' ';
          if (res.isFinal) {
            hasFinal = true;
          }
        }
        activeTranscript = activeTranscript.trim();
        setLiveTranscript(activeTranscript);

        if (!activeTranscript) return;

        // Intelligent Intent Matching
        const parsed = parseVoiceCommand(activeTranscript, hasFinal);

        if (parsed && parsed.action !== 'UNKNOWN') {
          const now = Date.now();
          if (now - lastExecutedTimeRef.current > 700) {
            lastExecutedTimeRef.current = now;
            processedIndexRef.current = event.results.length;

            soundFX.playVoiceBeep();

            // 1. Spoken Speed Switch ("Speed 2.5", "Speed 1.5", "Speed 1")
            if (parsed.action === 'SET_SPEED') {
              setVoiceSpeed(parsed.speed);
              aiVoice.setRate(parsed.speed);
              if (voiceAssistantEnabledRef.current && parsed.speechResponse) {
                aiVoice.speak(parsed.speechResponse);
              }
              setTimeout(() => setLiveTranscript(''), 2000);
              return;
            }

            // 2. Spoken Voice Assistant Mute/Unmute
            if (parsed.action === 'MUTE_VOICE') {
              setVoiceAssistantEnabled(false);
              aiVoice.toggle(false);
              setTimeout(() => setLiveTranscript(''), 2000);
              return;
            }
            if (parsed.action === 'UNMUTE_VOICE') {
              setVoiceAssistantEnabled(true);
              aiVoice.toggle(true);
              aiVoice.speak('Voice assistant active.');
              setTimeout(() => setLiveTranscript(''), 2000);
              return;
            }

            // 3. Spoken Post-Mortem Export
            if (parsed.action === 'GENERATE_REPORT') {
              if (onOpenReportRef.current) onOpenReportRef.current();
              if (voiceAssistantEnabledRef.current) aiVoice.speak('SRE Incident Post-Mortem report compiled.');
              setTimeout(() => setLiveTranscript(''), 2000);
              return;
            }

            // Speak clear response
            if (voiceAssistantEnabledRef.current && parsed.speechResponse) {
              aiVoice.speak(parsed.speechResponse);
            }

            // Execute the action with payload (serviceId, regionId, topology, or nodeId)
            const payload = parsed.serviceId || parsed.regionId || parsed.topology || parsed.nodeId || null;
            onExecuteActionRef.current(parsed.action, payload, activeTranscript);

            setTimeout(() => setLiveTranscript(''), 2200);
          }
        } else if (hasFinal) {
          processedIndexRef.current = event.results.length;
          setTimeout(() => setLiveTranscript(''), 2500);
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition notice:', e.error);
        if (e.error === 'not-allowed') {
          setMicError('Microphone permission required! Click the lock icon in the browser URL bar to allow.');
          setIsListening(false);
          isListeningRef.current = false;
        } else if (e.error === 'no-speech') {
          setMicError('No speech detected. Try again, or use the text command field below.');
        } else if (e.error === 'network' || e.error === 'audio-capture') {
          setMicError('Voice input is unavailable right now. Use the text command field below to continue the rehearsal.');
        }
      };

      recognition.onend = () => {
        processedIndexRef.current = 0;
        if (isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleListening = () => {
    soundFX.init();
    setMicError('');

    if (!speechSupported) {
      setMicError('Browser speech recognition is unavailable. Use the text command field below, or open this demo in Chrome, Brave, or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      processedIndexRef.current = 0;
      setLiveTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    } else {
      setIsListening(true);
      isListeningRef.current = true;
      processedIndexRef.current = 0;
      setLiveTranscript('');
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
    const parsed = parseVoiceCommand(manualInput, true);
    if (parsed && parsed.action !== 'UNKNOWN') {
      if (parsed.action === 'SET_SPEED') {
        handleSpeedChange(parsed.speed);
      } else if (parsed.action === 'GENERATE_REPORT') {
        if (onOpenReport) onOpenReport();
      } else {
        if (voiceAssistantEnabled && parsed.speechResponse) {
          aiVoice.speak(parsed.speechResponse);
        }
        const payload = parsed.serviceId || parsed.regionId || parsed.topology || parsed.nodeId || null;
        onExecuteAction(parsed.action, payload, manualInput);
      }
    } else {
      onExecuteAction('UNKNOWN', null, manualInput);
    }
    setManualInput('');
  };

  const handleSpeedChange = (speed) => {
    setVoiceSpeed(speed);
    aiVoice.setRate(speed);
    if (voiceAssistantEnabled) {
      aiVoice.speak(`Speed ${speed}x.`);
    }
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
                Voice Command Plane
              </span>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isListening
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
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
                    Listening active. Try: "Kill Payment Gateway", "Blackout US East", "Black Friday Drill", "Status Report"...
                  </span>
                )
              ) : (
                'Optional voice input. Use the text command field below if speech recognition is unavailable.'
              )}
            </p>
          </div>
        </div>

        {/* AI voice, speed control, and rehearsal actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* User Requested Speed Presets: 1x, 1.5x, 2.5x */}
          <div className="flex items-center bg-slate-950/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 gap-1.5 shadow-inner" title="Calibrate AI speaking speed (1x, 1.5x, 2.5x)">
            <Gauge className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Speed:</span>
            {[
              { label: '1x Normal', val: 1.0 },
              { label: '1.5x Fast', val: 1.5 },
              { label: '2.5x Turbo', val: 2.5 }
            ].map((preset) => (
              <button
                key={preset.val}
                onClick={() => handleSpeedChange(preset.val)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  voiceSpeed === preset.val
                    ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] ring-1 ring-purple-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

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

          {/* Read-only HTTP probe toggle */}
          <button
            onClick={onToggleProbe}
            className={`px-3 py-2 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              showProbe
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle the read-only HTTP resilience probe"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            {showProbe ? 'HIDE PROBE' : 'HTTP PROBE'}
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

      {/* Dynamic Target Component Strike Row (Adapts to Active Topology) */}
      <div className="mt-5 rounded-2xl border border-rose-900/40 bg-slate-950/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
              <Crosshair className="h-4 w-4 text-rose-400" />
              Target Architecture Component ({activeTopology})
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">
              Speak or click any component to inject failure:
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* View 1: Microservices */}
            {activeTopology === 'MICROSERVICES' &&
              microservices.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => {
                    soundFX.playClick();
                    if (voiceAssistantEnabled) aiVoice.speak(`Service ${svc.name} offline.`);
                    onExecuteAction('CRASH_SERVICE', svc.id, `Crash ${svc.name}`);
                  }}
                  disabled={svc.status === 'OFFLINE'}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
                    svc.status === 'OFFLINE'
                      ? 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600 opacity-50'
                      : 'border-rose-800/60 bg-rose-950/40 text-rose-200 hover:border-rose-400 hover:bg-rose-900/60 shadow-lg shadow-rose-950/40'
                  }`}
                >
                  {svc.name}
                </button>
              ))}

            {/* View 2: AWS Global Regions */}
            {activeTopology === 'GLOBAL_CLOUD' &&
              cloudRegions.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => {
                    soundFX.playClick();
                    if (voiceAssistantEnabled) aiVoice.speak(`Region ${reg.name} blackout.`);
                    onExecuteAction('CRASH_REGION', reg.id, `Blackout ${reg.name}`);
                  }}
                  disabled={reg.status === 'OFFLINE'}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
                    reg.status === 'OFFLINE'
                      ? 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600 opacity-50'
                      : 'border-rose-800/60 bg-rose-950/40 text-rose-200 hover:border-rose-400 hover:bg-rose-900/60 shadow-lg shadow-rose-950/40'
                  }`}
                >
                  {reg.id}
                </button>
              ))}

            {/* View 3: Raft Servers */}
            {activeTopology === 'RAFT_CLUSTER' &&
              (nodes || []).map((node) => (
                <button
                  key={node.id}
                  onClick={() => {
                    soundFX.playClick();
                    if (voiceAssistantEnabled) aiVoice.speak(`Server ${node.id} offline.`);
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

      {/* Failure rehearsal scenarios */}
      <div className="pt-5">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Failure Rehearsal Scenarios
          </span>
          <span className="text-slate-500 text-[10px]">Recommended flow: drill → report → heal</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => {
              soundFX.playClick();
              if (voiceAssistantEnabled) aiVoice.speak('Payment Gateway offline. Downstream checkout degraded.');
              onExecuteAction('CRASH_SERVICE', 'payments', 'Kill Payment Gateway');
            }}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-rose-950/50 border border-rose-800/70 text-rose-200 hover:bg-rose-900/60 hover:border-rose-400 transition-all text-xs font-mono font-bold active:scale-95 cursor-pointer shadow-lg shadow-rose-950/40"
          >
            <Zap className="w-4 h-4 text-rose-400" />
            Kill Payments
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              if (voiceAssistantEnabled) aiVoice.speak('AWS US-East 1 blackout. Global Route 53 failing over.');
              onExecuteAction('CRASH_REGION', 'us-east-1', 'Blackout US-East-1');
            }}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-orange-950/50 border border-orange-700/60 text-orange-200 hover:bg-orange-900/60 hover:border-orange-400 transition-all text-xs font-mono font-bold active:scale-95 cursor-pointer shadow-lg shadow-orange-950/40"
          >
            <Globe className="w-4 h-4 text-orange-400" />
            Blackout US-East
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              if (voiceAssistantEnabled) aiVoice.speak('Circuit breaker tripped. Fallback responses active.');
              onExecuteAction('TRIP_BREAKER', null, 'Trip Circuit Breakers');
            }}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-amber-950/50 border border-amber-700/60 text-amber-200 hover:bg-amber-900/60 hover:border-amber-400 transition-all text-xs font-mono font-bold active:scale-95 cursor-pointer shadow-lg shadow-amber-950/40"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Trip Breakers
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onExecuteAction('RUN_BLACK_FRIDAY', null, 'Black Friday 150k RPS Drill');
            }}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-red-950/60 border border-red-600/70 text-red-200 hover:bg-red-900/70 hover:border-red-400 transition-all text-xs font-mono font-bold active:scale-95 cursor-pointer shadow-lg shadow-red-950/50"
          >
            <Flame className="w-4 h-4 text-red-400 animate-pulse" />
            Black Friday Drill
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              if (voiceAssistantEnabled) aiVoice.speak('Cluster restored. All services and nodes online.');
              onExecuteAction('HEAL_ALL', null, 'Heal Cluster');
            }}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/70 text-emerald-200 hover:bg-emerald-900/70 hover:border-emerald-400 transition-all text-xs font-mono font-bold active:scale-95 cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Heal All
          </button>
        </div>
      </div>

      {/* Text command fallback */}
      <form onSubmit={handleManualSubmit} className="mt-5 flex gap-2 pt-4 border-t border-slate-800/80">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Type a command: 'Kill Payment Gateway', 'Blackout US East', 'Black Friday Drill', 'Speed 1.5'..."
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
