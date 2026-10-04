import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio, AlertCircle, Send } from 'lucide-react';
import { parseVoiceCommand } from '../utils/voiceParser';
import { soundFX } from '../utils/audioEffects';
import { aiVoice } from '../utils/aiVoice';

export default function ControlDeck({
  onExecuteAction,
  lastVoiceCmd,
  onOpenReport,
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
