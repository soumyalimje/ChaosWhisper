// Interactive AI Voice Response Engine (Text-to-Speech)
// Makes ChaosWhisper speak back like an autonomous Mission Control AI

class AIVoiceEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voice = null;
    this.enabled = true;
    this.init();
  }

  init() {
    if (!this.synth) return;
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Prefer modern natural English voices (e.g. Samantha, Karen, Google US, Daniel)
      this.voice =
        voices.find((v) => v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Natural')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
    };

    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }

  speak(text) {
    if (!this.enabled || !this.synth) return;

    try {
      // Cancel previous speech to keep response fast & snappy
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) utterance.voice = this.voice;
      utterance.pitch = 1.05;
      utterance.rate = 1.15; // Crisp, fast military/tech cadence
      utterance.volume = 0.85;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis prevented:', e);
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (!enabled && this.synth) {
      this.synth.cancel();
    }
  }
}

export const aiVoice = new AIVoiceEngine();
