'use strict';

// ============================================================
// World Aviation — the sounds of the Mriya's assembly hall, all
// synthesized through Audio2's master gain (so the Sound switch
// silences them):
//   Fanfare.play()   the fiftieth part fitted: six engines spool up
//                    under a brass fanfare with timpani, then
//                    fireworks whistle up, burst and crackle
//   Fanfare.snap()   a part locking into its place: a heavy clunk
//                    and a ring of metal
//   Fanfare.buy()    a part bought: a soft till chime
// Used by ui/mriya.js.
// ============================================================

const Fanfare = {
  ok() { return Audio2.ready && !Audio2.muted && Audio2.ctx; },
  out() { return Audio2.cockpit; },

  // a tone with an envelope: attack, hold, release (seconds from `at`)
  tone(at, freq, dur, type, gain, opts) {
    const c = Audio2.ctx, o = c.createOscillator(), g = c.createGain();
    opts = opts || {};
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, at);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, at + dur);
    if (opts.vibrato) {
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 5.2; lg.gain.value = freq * opts.vibrato;
      lfo.connect(lg); lg.connect(o.frequency);
      lfo.start(at + 0.25); lfo.stop(at + dur + 0.1);
    }
    let node = o;
    if (opts.lp) {
      // brass: the filter opens with the attack and closes a little as the note holds
      const f = c.createBiquadFilter();
      f.type = 'lowpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(opts.lp * 0.35, at);
      f.frequency.exponentialRampToValueAtTime(opts.lp, at + 0.08);
      f.frequency.exponentialRampToValueAtTime(opts.lp * 0.7, at + dur);
      o.connect(f); node = f;
    }
    const atk = opts.attack || 0.03;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + atk);
    g.gain.setValueAtTime(gain, at + Math.max(atk, dur - (opts.release || 0.3)));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    node.connect(g); g.connect(opts.dest || this.out());
    o.start(at); o.stop(at + dur + 0.05);
  },
  // noise through a filter, swelling or struck
  noise(at, dur, freq, q, gain, type, rise) {
    const c = Audio2.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = Audio2.noiseBuf; s.loop = true;
    f.type = type || 'bandpass'; f.Q.value = q || 1;
    f.frequency.setValueAtTime(freq, at);
    if (rise) f.frequency.exponentialRampToValueAtTime(freq * rise, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + (rise ? dur * 0.7 : 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(f); f.connect(g); g.connect(this.out());
    s.start(at, Math.random()); s.stop(at + dur + 0.05);
  },
  boom(at, freq, dur, gain) {
    const c = Audio2.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, at); o.frequency.exponentialRampToValueAtTime(freq * 0.4, at + dur);
    g.gain.setValueAtTime(gain, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(this.out());
    o.start(at); o.stop(at + dur + 0.05);
  },
  // a brass section: each note two detuned saws and a square an octave down, filtered
  brass(at, freqs, dur, gain) {
    for (const f of freqs) {
      this.tone(at, f, dur, 'sawtooth', gain, { lp: f * 6, vibrato: 0.004, attack: 0.06, release: 0.35 });
      this.tone(at, f * 1.004, dur, 'sawtooth', gain * 0.7, { lp: f * 5, attack: 0.07, release: 0.35 });
      this.tone(at, f / 2, dur, 'square', gain * 0.25, { lp: f * 2, attack: 0.08, release: 0.35 });
    }
  },

  play() {
    if (!this.ok()) return;
    const c = Audio2.ctx, t = c.currentTime + 0.05;
    // six D-18Ts spooling up: a whine climbing through the band, the roar swelling under it
    for (let i = 0; i < 6; i++) this.tone(t + i * 0.18, 380 + i * 7, 4.6, 'triangle', 0.02, { to: 2600 + i * 40, attack: 1.2, release: 1.4 });
    this.noise(t, 5.2, 180, 0.6, 0.22, 'lowpass', 7);
    this.tone(t, 42, 5.2, 'sine', 0.2, { to: 70, attack: 1.5, release: 1.5 });
    // the fanfare: G C E G rising, then the held chord, then a bigger one
    const G3 = 196, C4 = 261.63, E4 = 329.63, G4 = 392, C5 = 523.25, E5 = 659.25, F4 = 349.23, A4 = 440;
    const b = t + 1.6;
    this.brass(b, [G4], 0.22, 0.05);
    this.brass(b + 0.24, [C5], 0.22, 0.05);
    this.brass(b + 0.48, [E5], 0.22, 0.05);
    this.brass(b + 0.72, [C4, E4, G4, C5], 1.3, 0.035);
    this.boom(b + 0.72, 70, 1.1, 0.55);
    this.brass(b + 2.1, [F4, A4, C5], 0.5, 0.034);
    this.boom(b + 2.1, 62, 0.6, 0.4);
    this.brass(b + 2.65, [G3, G4, C5, E5], 2.6, 0.04);
    this.boom(b + 2.65, 55, 1.6, 0.7);
    this.boom(b + 3.0, 55, 1.2, 0.45);
    // the fireworks: a whistle up, the burst, and its crackle
    for (let k = 0; k < 9; k++) {
      const at = t + 2.2 + k * 0.75 + Math.random() * 0.4;
      this.tone(at, 500 + Math.random() * 300, 0.7, 'sine', 0.025, { to: 1700 + Math.random() * 600, attack: 0.05, release: 0.2 });
      const pop = at + 0.75;
      this.boom(pop, 90 + Math.random() * 40, 0.5, 0.35);
      this.noise(pop, 0.35, 900, 0.7, 0.3, 'bandpass');
      for (let j = 0; j < 14; j++) this.noise(pop + 0.15 + Math.random() * 0.9, 0.04, 2500 + Math.random() * 3000, 2, 0.08 + Math.random() * 0.06, 'bandpass');
    }
  },

  snap() {
    if (!this.ok()) return;
    const t = Audio2.ctx.currentTime;
    this.boom(t, 120, 0.25, 0.45);
    this.noise(t, 0.08, 1800, 1.5, 0.25, 'bandpass');
    this.tone(t + 0.01, 523, 0.5, 'sine', 0.06, { attack: 0.005, release: 0.45 });
    this.tone(t + 0.01, 1390, 0.35, 'sine', 0.03, { attack: 0.005, release: 0.3 });
  },

  buy() {
    if (!this.ok()) return;
    const t = Audio2.ctx.currentTime;
    this.tone(t, 1318, 0.25, 'sine', 0.07, { attack: 0.005, release: 0.2 });
    this.tone(t + 0.08, 1976, 0.4, 'sine', 0.06, { attack: 0.005, release: 0.35 });
  }
};
