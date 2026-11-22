// audio.js — all sound is synthesised with WebAudio; no audio files, no network.
// A tiny synth: short oscillator blips with an envelope, plus a filtered noise
// burst for the smoke puff. Created lazily on the first user gesture so the
// browser's autoplay rules are never fought, and silent until then.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.alarmOsc = null;
    this.alarmGain = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      return true;
    } catch {
      return false;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopAlarm();
    return this.muted;
  }

  blip(freq, seconds, type, volume, slideTo) {
    if (this.muted || !this.ensure()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + seconds);
    gain.gain.setValueAtTime(volume || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  noise(seconds, volume) {
    if (this.muted || !this.ensure()) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume || 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t);
  }

  pickup() { this.blip(880, 0.12, 'sine', 0.12, 1320); }
  coin() { this.blip(1560, 0.09, 'triangle', 0.1, 2100); }
  coinLand() { this.blip(520, 0.08, 'square', 0.06, 380); }
  vaultTick() { this.blip(1200, 0.05, 'square', 0.05); }
  vaultOpen() { this.blip(220, 0.5, 'sawtooth', 0.1, 660); this.blip(880, 0.4, 'sine', 0.1, 1320); }
  smoke() { this.noise(0.5, 0.16); }
  step() { this.blip(140, 0.05, 'sine', 0.03, 90); }
  caught() {
    this.blip(330, 0.7, 'sawtooth', 0.14, 110);
    this.blip(165, 0.9, 'square', 0.08, 82);
  }
  win() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.blip(f, 0.28, 'triangle', 0.12), i * 130);
    });
  }
  click() { this.blip(700, 0.05, 'sine', 0.07); }

  // A low two-tone alarm hum while the meter is in the danger zone.
  startAlarm() {
    if (this.muted || !this.ensure() || this.alarmOsc) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 2.2;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain).connect(osc.frequency);
    const gain = this.ctx.createGain();
    gain.gain.value = 0.035;
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    lfo.start();
    this.alarmOsc = osc;
    this.alarmGain = gain;
    this.alarmLfo = lfo;
  }

  stopAlarm() {
    if (!this.alarmOsc) return;
    try { this.alarmOsc.stop(); this.alarmLfo.stop(); } catch { /* already stopped */ }
    this.alarmOsc = null;
    this.alarmGain = null;
    this.alarmLfo = null;
  }
}
