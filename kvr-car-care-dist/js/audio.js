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

  // Realistic Car Door Open Sound: Handle click, latch release & heavy door swing
  carDoorOpen() {
    if (this.isMuted()) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Handle Latch Snap / Click (High metallic impulse)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1600, now);
      osc1.frequency.exponentialRampToValueAtTime(450, now + 0.04);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.04);

      // 2. Door Lock Mechanism Release (Clack)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      const t2 = now + 0.045;
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(380, t2);
      osc2.frequency.exponentialRampToValueAtTime(95, t2 + 0.07);
      gain2.gain.setValueAtTime(0.32, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.07);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t2);
      osc2.stop(t2 + 0.07);

      // 3. Heavy Door Hinge Swing & Seal Thud (Low resonant thump)
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      const t3 = now + 0.11;
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(110, t3);
      osc3.frequency.exponentialRampToValueAtTime(35, t3 + 0.18);
      gain3.gain.setValueAtTime(0.38, t3);
      gain3.gain.exponentialRampToValueAtTime(0.001, t3 + 0.18);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(t3);
      osc3.stop(t3 + 0.18);
    } catch (e) {
      console.warn('Audio carDoorOpen error:', e);
    }
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
