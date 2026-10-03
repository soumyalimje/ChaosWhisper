// Interactive AI Voice Response Engine (Text-to-Speech)
// Makes ChaosWhisper speak back like an autonomous Mission Control AI
// Tuned for responsive, snappy, natural conversational cadence.

class AIVoiceEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voice = null;
    this.enabled = true;
    this.rate = 1.0; // Crisp, responsive conversational speed (1.0x default)
    this.pitch = 1.0; // Natural pitch
    this.init();
  }

  init() {
    if (!this.synth) return;

    const loadVoices = () => {
      const voices = this.synth.getVoices();
      if (!voices || voices.length === 0) return;

      // Prefer natural, high-clarity English voices (especially on macOS / Chrome)
      const preferredNames = [
        'Ava (Premium)',
        'Ava (Enhanced)',
        'Samantha (Enhanced)',
        'Karen (Enhanced)',
        'Karen',
        'Google US English',
        'Victoria',
        'Moira',
        'Daniel',
        'Samantha',
      ];

      for (const name of preferredNames) {
        const found = voices.find((v) => v.name.includes(name));
        if (found) {
          this.voice = found;
          break;
        }
      }

      if (!this.voice) {
        this.voice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
      }
    };

    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }

  speak(text) {
    if (!this.enabled || !this.synth || !text) return;

    try {
      // Cancel previous speech safely to prevent queue delays
      this.synth.cancel();

      // Ensure voice is assigned
      if (!this.voice) {
        const voices = this.synth.getVoices();
        if (voices && voices.length > 0) {
          this.voice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
        }
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) utterance.voice = this.voice;
      utterance.pitch = this.pitch;
      utterance.rate = this.rate; // Supports 1x, 1.5x, 2.5x seamlessly
      utterance.volume = 0.95;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis prevented:', e);
    }
  }

  setRate(newRate) {
    const parsed = parseFloat(newRate);
    if (!isNaN(parsed)) {
      this.rate = Math.max(0.7, Math.min(3.0, parsed));
    }
  }

  getRate() {
    return this.rate;
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (!enabled && this.synth) {
      this.synth.cancel();
    }
  }
}

export const aiVoice = new AIVoiceEngine();
