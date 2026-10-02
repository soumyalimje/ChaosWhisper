// Web Audio API procedural sound synthesizer
// Zero external audio files — 100% synthesized in-browser

class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  scheduleTone({ frequency, startTime, duration, type = 'sine', volume = 0.1, endFrequency }) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);
    if (endFrequency) {
      osc.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);
    }
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Sci-fi click for UI interaction
  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Crash / Chaos alarm sound
  playAlarm() {
    try {
      this.init();
      if (!this.ctx) return;
      const startTime = this.ctx.currentTime;
      [0, 0.14, 0.28].forEach((offset) => {
        this.scheduleTone({
          frequency: 330,
          startTime: startTime + offset,
          duration: 0.12,
          type: 'square',
          volume: 0.08,
          endFrequency: 180
        });
      });
    } catch {}
  }

  // Election won / Recovery chime
  playRecovery() {
    try {
      this.init();
      if (!this.ctx) return;
      const startTime = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((frequency, index) => {
        this.scheduleTone({
          frequency,
          startTime: startTime + index * 0.075,
          duration: 0.45,
          type: 'triangle',
          volume: 0.1
        });
      });
    } catch {}
  }

  // Voice command recognized blip
  playVoiceBeep() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {}
  }
}

export const soundFX = new SoundFX();
