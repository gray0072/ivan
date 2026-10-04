'use strict';

// ============================================================
// World Aviation — synthesized sound (Web Audio, no files)
//
// Two continuous voices (engine and wind) whose pitch and volume
// follow the engines, the airspeed and the weather, plus short
// one-shots for the gear, the warnings, the checklist clicks
// and the touchdown.
// ============================================================

const Audio2 = {
  ctx: null, master: null, ready: false, muted: false,
  eng: null, wind: null, caution: null,

  init() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (err) { return; }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(c.destination);

    // engine: two detuned saws through a lowpass, plus a rumble
    const eg = c.createGain(); eg.gain.value = 0;
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 900; filt.Q.value = 0.7;
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 60;
    const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = 90;
    const o3 = c.createOscillator(); o3.type = 'sine'; o3.frequency.value = 30;
    const rumble = c.createGain(); rumble.gain.value = 0.5;
    o1.connect(eg); o2.connect(eg); o3.connect(rumble); rumble.connect(eg);
    eg.connect(filt); filt.connect(this.master);
    o1.start(); o2.start(); o3.start();
    this.eng = { gain: eg, filt, o1, o2, o3 };

    // wind: filtered noise
    const noise = this.noiseSource();
    const wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 700; wf.Q.value = 0.6;
    const wg = c.createGain(); wg.gain.value = 0;
    noise.connect(wf); wf.connect(wg); wg.connect(this.master);
    this.wind = { gain: wg, filt: wf, noise };

    this.ready = true;
  },

  noiseSource() {
    const c = this.ctx;
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true; src.start();
    return src;
  },

  resume() {
    if (!this.ready) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
  },

  // continuous voices, called every frame
  update(dt, fl, sys) {
    if (!this.ready) return;
    if (!fl) {
      const now0 = this.ctx.currentTime;
      this.eng.gain.gain.setTargetAtTime(0, now0, 0.1);
      this.wind.gain.gain.setTargetAtTime(0, now0, 0.1);
      return;
    }
    const st = fl.st;
    let n1 = 0, egt = 0, fire = 0;
    if (sys) for (const e of sys.engines) { n1 = Math.max(n1, e.running ? e.n1 : 0); egt = Math.max(egt, e.egt); fire = Math.max(fire, e.fire ? 1 : 0); }
    const base = fl.ac.engineType === 'prop' ? 26 + n1 * 105 : 120 + n1 * 320;
    const now = this.ctx.currentTime;
    this.eng.o1.frequency.setTargetAtTime(base, now, 0.08);
    this.eng.o2.frequency.setTargetAtTime(base * 1.5, now, 0.08);
    this.eng.o3.frequency.setTargetAtTime(base * 0.5, now, 0.1);
    this.eng.filt.frequency.setTargetAtTime(300 + n1 * 1500 + egt * 0.6 + fire * 900, now, 0.15);
    const vol = st.onGround ? 0.1 + n1 * 0.22 : 0.06 + n1 * 0.2;
    this.eng.gain.gain.setTargetAtTime(this.muted ? 0 : vol, now, 0.1);
    const windVol = clamp(st.tas / 120, 0, 1) * 0.22 + (Scene3D.inCloud || 0) * 0.05;
    this.wind.gain.gain.setTargetAtTime(this.muted ? 0 : windVol, now, 0.2);
    this.wind.filt.frequency.setTargetAtTime(400 + st.tas * 3, now, 0.2);
  },

  // one-shots
  cue(name) {
    if (!this.ready || this.muted) return;
    const c = this.ctx;
    const beep = (freq, dur, type, gain, slide) => {
      const o = c.createOscillator(), g = c.createGain(), now = c.currentTime;
      o.type = type || 'sine'; o.frequency.value = freq;
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, now + dur);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(gain || 0.18, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(this.master);
      o.start(now); o.stop(now + dur + 0.05);
    };
    const thump = (freq, dur, gain) => {
      const o = c.createOscillator(), g = c.createGain(), now = c.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(freq, now);
      o.frequency.exponentialRampToValueAtTime(freq * 0.3, now + dur);
      g.gain.setValueAtTime(gain, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(this.master);
      o.start(now); o.stop(now + dur + 0.05);
    };
    switch (name) {
      case 'caution':
        beep(880, 0.16, 'square', 0.14);
        setTimeout(() => this.cue('caution2'), 220);
        break;
      case 'caution2': beep(660, 0.2, 'square', 0.12); break;
      case 'warning': beep(440, 0.5, 'sawtooth', 0.16, 300); break;
      case 'click': beep(1200, 0.05, 'square', 0.08); break;
      case 'resolved': beep(700, 0.1, 'sine', 0.12); setTimeout(() => beep(1050, 0.14, 'sine', 0.12), 90); break;
      case 'starter': beep(220, 0.5, 'sawtooth', 0.08, 160); break;
      case 'lightoff': thump(90, 0.3, 0.3); break;
      case 'idle': thump(70, 0.4, 0.25); break;
      case 'shutdown': thump(60, 0.5, 0.2); break;
      case 'touchdown': thump(48, 0.35, 0.42); break;
      case 'crash': thump(40, 1.4, 0.6); break;
      case 'gear': thump(70, 0.18, 0.2); setTimeout(() => thump(70, 0.18, 0.2), 220); break;
      case 'good': beep(880, 0.12, 'sine', 0.14); setTimeout(() => beep(1320, 0.2, 'sine', 0.14), 110); break;
      case 'bad': beep(300, 0.35, 'sawtooth', 0.14, 150); break;
      case 'page': beep(520, 0.06, 'sine', 0.07); break;
      default: beep(600, 0.08, 'sine', 0.1);
    }
  }
};
