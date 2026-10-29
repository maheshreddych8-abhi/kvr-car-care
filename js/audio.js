// KVR Car Care - Web Audio API Sound Effects Synthesizer
// Clean, organic procedural audio effects with zero external audio dependencies

class KVRSoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('kvr_sound_muted', this.muted ? '1' : '0');
    return this.muted;
  }

  isMuted() {
    if (localStorage.getItem('kvr_sound_muted') === '1') {
      this.muted = true;
    }
    return this.muted;
  }

  // Organic UI "Pop" sound for buttons, cards, taps
  pop(frequency = 520) {
    if (this.isMuted()) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = this.ctx.currentTime;
      osc.type = 'sine';

      // Pitch drop creates the classic juicy "bubble pop"
      osc.frequency.setValueAtTime(frequency * 1.6, startTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.4, startTime + 0.08);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.08);
    } catch (e) {
      console.warn('Audio pop error:', e);
    }
  }

  // Soft high click for small toggles/checkboxes
  click() {
    if (this.isMuted()) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, startTime);
      osc.frequency.exponentialRampToValueAtTime(250, startTime + 0.04);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.04);
    } catch (e) {}
  }

  // Uplifting 2-note chime for success, job completed, invoice generated
  success() {
    if (this.isMuted()) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [587.33, 880]; // D5 -> A5

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {}
  }

  // Attention alert chime for new incoming service request
  alert() {
    if (this.isMuted()) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25]; // A4, C#5, E5 arpeggio

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch (e) {}
  }

  // Playful car horn "beep beep"
  carHorn() {
    if (this.isMuted()) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const beeps = [0, 0.14]; // two short beeps

      beeps.forEach((offset) => {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + offset;

        osc1.type = 'sawtooth';
        osc2.type = 'sine';

        // Dual tone harmonic horn sound ~415Hz + ~500Hz
        osc1.frequency.setValueAtTime(415, startTime);
        osc2.frequency.setValueAtTime(510, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + 0.09);
        osc2.stop(startTime + 0.09);
      });
    } catch (e) {}
  }
}

// Global instance
window.kvrAudio = new KVRSoundEffects();

// Auto-attach touch & click pop listeners to interactive buttons
document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e) => {
    // Unlock Web Audio context
    window.kvrAudio.init();

    const target = e.target.closest('button, a, input[type="radio"], input[type="checkbox"], .kvr-interactive, select');
    if (target) {
      if (target.dataset.sound === 'horn') {
        window.kvrAudio.carHorn();
      } else if (target.dataset.sound === 'success') {
        window.kvrAudio.success();
      } else {
        window.kvrAudio.pop();
      }
    }
  });
});
