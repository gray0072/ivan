'use strict';

// ============================================================
// World Aviation — the cabin's reaction to the landing (synthesized, no files)
//
// Played by Audio2.cue('cabin', { mood, pax }) when Flight.touchdown has graded the landing
// with passengers on board (sim/flight.js, CABIN_REACTION in constants.js):
//   ovation   a soft one: the whole cabin claps, louder and longer, whistles
//   applause  a good one: most of the cabin claps
//   polite    a fair one: a few people clap
//   firm      the overhead bins rattle, a murmur
//   rough     an "ooh!", cups clink in the galley, chatter
//   hard      a gasp and a few yelps, the galley crashes, a baby cries, chatter
//   bounce    a collective "whoa" as the aeroplane comes down again (any clapping stops)
// The claps, knocks and clinks are rendered into a stereo buffer here (every person their own
// hands — the pitch, the pace, the seat to the left or right); the voices are formant-filtered
// oscillators. In the cockpit it is all muffled behind the door; outside it is faint.
// ============================================================

const Crowd = {
  bus: null, filt: null,
  cheers: [],              // the gains of the clapping, whistles and cheers still sounding

  // the cabin's own bus into the master, muffled by the view
  out() {
    const A = Audio2, c = A.ctx;
    if (!this.bus) {
      this.filt = c.createBiquadFilter(); this.filt.type = 'lowpass'; this.filt.Q.value = 0.5;
      this.bus = c.createGain();
      this.bus.connect(this.filt); this.filt.connect(A.master);
    }
    const inside = (typeof Scene3D === 'undefined' ? 'cockpit' : Scene3D.camMode || 'cockpit') === 'cockpit';
    this.filt.frequency.value = inside ? 3200 : 1100;
    this.bus.gain.value = inside ? 2.4 : 0.6;
    return this.bus;
  },

  play(mood, pax) {
    const A = Audio2;
    if (!A.ready || A.muted || !pax) return;
    const c = A.ctx, out = this.out(), t0 = c.currentTime;
    const rnd = (a, b) => a + Math.random() * (b - a);
    // how many separate claps the ear makes out: a full A380 is a roar, not 500 claps
    const crowd = clamp(Math.round(Math.sqrt(pax) * 2.4), 3, 42);
    if (mood === 'bounce') {
      // down again after the cheering started: it stops short
      for (const g of this.cheers) { g.gain.cancelScheduledValues(t0); g.gain.setTargetAtTime(0, t0, 0.07); }
    }
    this.cheers = [];
    switch (mood) {
      case 'ovation':
        this.applause(out, t0 + rnd(0.5, 0.8), crowd, rnd(5.5, 7), 1);
        for (let i = 0, n = clamp(Math.round(pax / 70), 1, 3); i < n; i++) this.whistle(out, t0 + rnd(1.0, 3.2), i === 0);
        this.voices(out, t0 + rnd(1.2, 1.8), Math.min(6, 1 + Math.round(pax / 40)), 'u', [180, 320], 1.25, 0.55, 0.05);   // "woo!"
        break;
      case 'applause':
        this.applause(out, t0 + rnd(0.6, 1.0), Math.max(3, Math.round(crowd * 0.75)), rnd(3.8, 5), 0.8);
        if (pax > 40 && Math.random() < 0.6) this.whistle(out, t0 + rnd(1.4, 2.6), false);
        break;
      case 'polite':
        this.applause(out, t0 + rnd(0.8, 1.3), clamp(Math.round(crowd * 0.2), 2, 7), rnd(2, 3), 0.55);
        break;
      case 'firm':
        this.rattle(out, t0 + 0.02, 0.5, 0.6);
        this.murmur(out, t0 + 0.9, Math.min(6, 2 + Math.round(pax / 60)), 2.6, 0.5);
        break;
      case 'rough':
        this.rattle(out, t0 + 0.02, 0.8, 1);
        this.clink(out, t0 + 0.05, 5, 0.6);
        this.voices(out, t0 + 0.12, Math.min(10, 3 + Math.round(pax / 30)), 'o', [110, 260], 0.85, 0.7, 0.07);   // "ooh!"
        this.murmur(out, t0 + 1.0, Math.min(8, 3 + Math.round(pax / 40)), 3.5, 0.75);
        break;
      case 'hard':
        this.rattle(out, t0 + 0.01, 1.3, 1.6);
        this.clink(out, t0 + 0.04, 12, 1);
        A.thump(out, 95, 0.35, 0.25);                                       // a galley drawer comes open
        this.breath(out, t0 + 0.05, 0.45);                                  // the gasp ...
        this.voices(out, t0 + 0.12, Math.min(12, 4 + Math.round(pax / 25)), 'a', [130, 300], 0.8, 0.6, 0.08);   // ... "ah!"
        this.voices(out, t0 + 0.2, rnd(2, 4) | 0, 'a', [420, 620], 1.15, 0.35, 0.045);  // a few yelps
        if (pax > 20) this.baby(out, t0 + rnd(1.2, 1.8));
        this.murmur(out, t0 + 1.3, Math.min(10, 4 + Math.round(pax / 30)), 4.5, 0.9);
        break;
      case 'bounce':
        this.voices(out, t0 + 0.15, Math.min(10, 3 + Math.round(pax / 30)), 'o', [120, 280], 0.8, 0.7, 0.065);   // "whoa"
        this.rattle(out, t0 + 0.02, 0.4, 0.5);
        break;
    }
  },

  // ---------- rendered hits: claps, knocks, clinks ----------
  // hits: { t (s), f (Hz), q, tau (s, the decay), amp, pan (-1 left .. 1 right), ring (a struck
  // cup or a can: inharmonic partials instead of filtered noise) }; returns a stereo buffer
  render(hits, dur) {
    const c = Audio2.ctx, sr = c.sampleRate, len = Math.ceil(dur * sr);
    const buf = c.createBuffer(2, len, sr), L = buf.getChannelData(0), R = buf.getChannelData(1);
    for (const h of hits) {
      const i0 = Math.floor(h.t * sr), n = Math.min(len - i0, Math.ceil(h.tau * 6 * sr));
      if (i0 < 0 || n <= 0) continue;
      const gl = h.amp * Math.sqrt(0.5 * (1 - h.pan)), gr = h.amp * Math.sqrt(0.5 * (1 + h.pan));
      const k = 1 / (h.tau * sr);
      if (h.ring) {
        const w = [1, 2.76, 5.40, 8.93].map((m) => 2 * Math.PI * h.f * m / sr), a = [1, 0.6, 0.35, 0.2];
        for (let i = 0; i < n; i++) {
          let s = 0;
          for (let p = 0; p < 4; p++) s += a[p] * Math.sin(w[p] * i) * Math.exp(-i * k * (1 + p * 0.7));
          L[i0 + i] += s * gl; R[i0 + i] += s * gr;
        }
        continue;
      }
      // filtered noise with a fast attack: a bandpass biquad (constant 0 dB peak)
      const w0 = 2 * Math.PI * h.f / sr, al = Math.sin(w0) / (2 * h.q), a0 = 1 + al;
      const b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w0) / a0, a2 = (1 - al) / a0;
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      const att = Math.max(1, Math.floor(0.0015 * sr));
      for (let i = 0; i < n; i++) {
        const x = (Math.random() * 2 - 1) * (i < att ? i / att : Math.exp(-(i - att) * k));
        const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = x; y2 = y1; y1 = y;
        L[i0 + i] += y * gl; R[i0 + i] += y * gr;
      }
    }
    return buf;
  },
  playBuf(out, buf, at, gain) {
    const c = Audio2.ctx, s = c.createBufferSource(), g = c.createGain();
    s.buffer = buf; g.gain.value = gain;
    s.connect(g); g.connect(out);
    s.start(at);
    return g;
  },

  // a crowd clapping: everyone joins within a moment, claps at their own pace with their own
  // hands, and stops on their own (the fewer left, the quieter it gets)
  applause(out, at, n, dur, loud) {
    const hits = [];
    for (let p = 0; p < n; p++) {
      const near = Math.random();                         // the rows nearer the front are louder
      const f = 900 + Math.random() * 1700, q = 0.9 + Math.random() * 1.6;
      const amp = (0.35 + 0.65 * near) * (0.7 + Math.random() * 0.6), pan = Math.random() * 1.6 - 0.8;
      const rate = 3.2 + Math.random() * 2.6;              // claps a second
      let t = Math.random() * 0.7 * (1 + Math.random());
      const end = dur * (0.45 + Math.random() * 0.55);
      while (t < end) {
        const fade = 1 - Math.pow(t / end, 3) * 0.7;
        hits.push({ t, f: f * (0.94 + Math.random() * 0.12), q, tau: 0.007 + Math.random() * 0.006, amp: amp * fade, pan });
        t += (1 / rate) * (0.88 + Math.random() * 0.24);
      }
    }
    // (a full cabin is louder than a few rows: up to +4 dB)
    this.cheers.push(this.playBuf(out, this.render(hits, dur + 0.3), at, loud * 3.2 / Math.sqrt(n) * (0.8 + 0.45 * clamp((n - 3) / 39, 0, 1))));
  },

  // the overhead bins and the trolleys: plastic knocks and latches, most of them at once
  rattle(out, at, dur, loud) {
    const hits = [];
    for (let i = 0, n = Math.round(14 + 26 * loud); i < n; i++) {
      const t = Math.pow(Math.random(), 1.8) * dur;
      hits.push({ t, f: 500 + Math.random() * 1400, q: 2 + Math.random() * 4, tau: 0.01 + Math.random() * 0.03,
        amp: (0.4 + Math.random() * 0.6) * (1 - t / dur * 0.6), pan: Math.random() * 1.8 - 0.9 });
    }
    this.playBuf(out, this.render(hits, dur + 0.3), at, 0.28 * loud);
  },

  // cups, glasses and cans in the galley: struck, bouncing, the last ones ringing on
  clink(out, at, n, loud) {
    const hits = [];
    for (let i = 0; i < n; i++) {
      const t = Math.pow(Math.random(), 1.5) * 0.9, f = 1400 + Math.random() * 2400;
      hits.push({ t, f, tau: 0.04 + Math.random() * 0.1, amp: 0.5 + Math.random() * 0.5, pan: Math.random() * 0.8 - 0.4, ring: true });
      if (Math.random() < 0.5) hits.push({ t: t + 0.08 + Math.random() * 0.1, f, tau: 0.03, amp: 0.3, pan: 0, ring: true });   // and bounces
    }
    this.playBuf(out, this.render(hits, 1.6), at, 0.09 * loud);
  },

  // ---------- voices ----------
  // a crowd saying one vowel together: each person a sawtooth at their own pitch through the
  // vowel's two formants, the pitch gliding by `glide` (1.25: up, a "woo!"; 0.8: down, an "ooh")
  voices(out, at, n, vowel, f0, glide, dur, gain) {
    const c = Audio2.ctx;
    const F = { o: [480, 860], a: [760, 1250], u: [330, 760] }[vowel] || [500, 1000];
    for (let i = 0; i < n; i++) {
      const s = at + Math.random() * 0.12, d = dur * (0.7 + Math.random() * 0.5);
      const o = c.createOscillator(); o.type = 'sawtooth';
      const p = f0[0] + Math.random() * (f0[1] - f0[0]);
      o.frequency.setValueAtTime(p, s);
      o.frequency.exponentialRampToValueAtTime(p * glide, s + d);
      const g = c.createGain(), pan = c.createStereoPanner ? c.createStereoPanner() : null;
      if (glide > 1) this.cheers.push(g);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(gain * (0.6 + Math.random() * 0.4) / Math.sqrt(n), s + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, s + d);
      for (const [fr, q, lv] of [[F[0] * (0.92 + Math.random() * 0.16), 6, 1], [F[1] * (0.92 + Math.random() * 0.16), 8, 0.6]]) {
        const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q;
        const l = c.createGain(); l.gain.value = lv * 3;
        o.connect(b); b.connect(l); l.connect(g);
      }
      if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; g.connect(pan); pan.connect(out); } else g.connect(out);
      o.start(s); o.stop(s + d + 0.05);
    }
  },

  // a whole cabin drawing breath at once
  breath(out, at, gain) {
    const c = Audio2.ctx, s = c.createBufferSource(); s.buffer = Audio2.noiseBuf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 0.6;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain * 0.3, at + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
    s.connect(f); f.connect(g); g.connect(out);
    s.start(at, Math.random()); s.stop(at + 0.4);
  },

  // a whistle through the fingers: a quick rise, a hold with a little vibrato, a fall (a
  // "wolf whistle" when long)
  whistle(out, at, long) {
    const c = Audio2.ctx, o = c.createOscillator(), g = c.createGain();
    const lfo = c.createOscillator(), lg = c.createGain();
    const top = 2300 + Math.random() * 700;
    lfo.frequency.value = 5.5; lg.gain.value = top * 0.012; lfo.connect(lg); lg.connect(o.frequency);
    o.frequency.setValueAtTime(top * 0.6, at);
    o.frequency.exponentialRampToValueAtTime(top, at + 0.12);
    let end = at + 0.45 + Math.random() * 0.2;
    o.frequency.setValueAtTime(top, end - 0.15);
    o.frequency.exponentialRampToValueAtTime(top * 0.8, end);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.075, at + 0.05);
    g.gain.setValueAtTime(0.075, end - 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    if (long) {                                         // the second half: up and down
      const s2 = end + 0.12, e2 = s2 + 0.7;
      o.frequency.setValueAtTime(top * 0.7, s2);
      o.frequency.exponentialRampToValueAtTime(top * 1.08, s2 + 0.25);
      o.frequency.exponentialRampToValueAtTime(top * 0.55, e2);
      g.gain.setValueAtTime(0.0001, s2);
      g.gain.exponentialRampToValueAtTime(0.075, s2 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, e2);
      end = e2;
    }
    o.connect(g); g.connect(out);
    o.start(at); lfo.start(at); o.stop(end + 0.05); lfo.stop(end + 0.05);
    this.cheers.push(g);
  },

  // a baby woken by the bump: three cries, each "waah" rising and falling, with a breath between
  baby(out, at) {
    const c = Audio2.ctx;
    let t = at;
    for (let i = 0; i < 3; i++) {
      const d = 0.7 + Math.random() * 0.5, f0 = 400 + Math.random() * 80;
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0 * 0.85, t);
      o.frequency.linearRampToValueAtTime(f0 * 1.12, t + d * 0.3);
      o.frequency.linearRampToValueAtTime(f0 * 0.8, t + d);
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 7; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.frequency);
      const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5;
      f1.frequency.setValueAtTime(600, t); f1.frequency.linearRampToValueAtTime(1150, t + 0.12);  // "w-aa"
      const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 7; f2.frequency.value = 2900;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.1);
      g.gain.setValueAtTime(0.1, t + d * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      const l2 = c.createGain(); l2.gain.value = 0.5;
      o.connect(f1); f1.connect(g); o.connect(f2); f2.connect(l2); l2.connect(g); g.connect(out);
      o.start(t); lfo.start(t); o.stop(t + d + 0.05); lfo.stop(t + d + 0.05);
      t += d + 0.3 + Math.random() * 0.25;
    }
  },

  // people talking all at once after a scare: each voice in syllables, a new vowel each time,
  // never quite words; it rises and dies away
  murmur(out, at, n, dur, loud) {
    const c = Audio2.ctx, sr = c.sampleRate, len = Math.ceil(dur * sr);
    const buf = c.createBuffer(2, len, sr), L = buf.getChannelData(0), R = buf.getChannelData(1);
    const bp = (f, q) => { const w = 2 * Math.PI * f / sr, al = Math.sin(w) / (2 * q), a0 = 1 + al; return [al / a0, -al / a0, -2 * Math.cos(w) / a0, (1 - al) / a0]; };
    for (let v = 0; v < n; v++) {
      const f0 = 100 + Math.random() * 140, pan = Math.random() * 1.6 - 0.8, amp = 0.5 + Math.random() * 0.5;
      const gl = amp * Math.sqrt(0.5 * (1 - pan)), gr = amp * Math.sqrt(0.5 * (1 + pan));
      let ph = 0, i = Math.floor(Math.random() * 0.6 * sr);
      const s1 = [0, 0, 0, 0], s2 = [0, 0, 0, 0];
      while (i < len) {
        const syl = Math.floor((0.1 + Math.random() * 0.16) * sr);
        const c1 = bp(300 + Math.random() * 500, 5), c2 = bp(900 + Math.random() * 1300, 7);
        const pitch = f0 * (0.9 + Math.random() * 0.2);
        for (let k = 0; k < syl && i < len; k++, i++) {
          ph += pitch / sr; if (ph > 1) ph -= 1;
          const env = Math.sin(Math.PI * k / syl);
          const x = (ph * 2 - 1) * env;
          const y1 = c1[0] * x + c1[1] * s1[1] - c1[2] * s1[2] - c1[3] * s1[3]; s1[1] = s1[0]; s1[0] = x; s1[3] = s1[2]; s1[2] = y1;
          const y2 = c2[0] * x + c2[1] * s2[1] - c2[2] * s2[2] - c2[3] * s2[3]; s2[1] = s2[0]; s2[0] = x; s2[3] = s2[2]; s2[2] = y2;
          const y = (y1 + y2 * 0.6) * Math.min(1, i / (0.5 * sr)) * Math.min(1, (len - i) / (1.2 * sr));
          L[i] += y * gl; R[i] += y * gr;
        }
        i += Math.floor(Math.random() * 0.12 * sr);       // a pause between syllables
      }
    }
    this.playBuf(out, buf, at, 0.5 * loud / Math.sqrt(n));
  }
};
