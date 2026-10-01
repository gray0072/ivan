// Synthesized sound effects (Web Audio, no files).

const Sfx = (() => {
  let ctx = null;
  let master = null;
  let noiseBuf = null;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // One oscillator note with a quick attack and exponential decay.
  function tone(freq, start, dur, o = {}) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + start;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    if (o.vibrato) {
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = o.vibrato;
      lg.gain.value = freq * 0.03;
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    const peak = o.gain || 0.25;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (o.attack || 0.008));
    if (o.hold) g.gain.setValueAtTime(peak, t + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (o.lowpass) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lowpass;
      g.connect(f);
      out = f;
    }
    osc.connect(g);
    out.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Filtered noise burst; freq can sweep to `to`.
  function noise(start, dur, o = {}) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + start;
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = c.createGain();
    const peak = o.gain || 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (o.attack || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  return {
    unlock: ac,
    click() { tone(900, 0, 0.06, { type: 'triangle', gain: 0.12 }); },
    correct() {
      tone(784, 0, 0.18, { type: 'triangle', gain: 0.25 });
      tone(1175, 0.09, 0.3, { type: 'triangle', gain: 0.25 });
    },
    wrong() {
      tone(220, 0, 0.28, { type: 'square', gain: 0.1, to: 150, lowpass: 900 });
      tone(165, 0.12, 0.3, { type: 'square', gain: 0.09, to: 110, lowpass: 700 });
    },
    tick() { tone(1500, 0, 0.05, { type: 'sine', gain: 0.12 }); },
    pour() {
      noise(0, 0.9, { freq: 900, to: 1400, q: 1.5, gain: 0.12, attack: 0.1 });
      for (let i = 0; i < 5; i++) tone(500 + Math.random() * 400, 0.15 + i * 0.13, 0.08, { gain: 0.08, to: 1100 + Math.random() * 400 });
    },
    whoosh() { noise(0, 0.32, { freq: 400, to: 1800, q: 2, gain: 0.18 }); },
    bonk() {
      tone(200, 0, 0.18, { type: 'sine', gain: 0.35, to: 60 });
      tone(620, 0, 0.08, { type: 'square', gain: 0.08, lowpass: 2000 });
      tone(420, 0.05, 0.35, { type: 'triangle', gain: 0.12, to: 700, vibrato: 18 });
    },
    plop() { tone(300, 0, 0.12, { gain: 0.15, to: 120 }); noise(0, 0.15, { freq: 500, gain: 0.08, filter: 'lowpass' }); },
    groan() {
      const f0 = 85 + Math.random() * 25;
      tone(f0, 0, 0.9, { type: 'sawtooth', gain: 0.1, to: f0 * 0.75, vibrato: 5, lowpass: 600, attack: 0.15, hold: 0.4 });
    },
    rise() { noise(0, 0.4, { freq: 300, to: 150, filter: 'lowpass', gain: 0.15 }); },
    coins() {
      [0, 0.1, 0.2, 0.3].forEach((t, i) => tone(i % 2 ? 1760 : 1320, t, 0.18, { type: 'square', gain: 0.06, lowpass: 5000 }));
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, { type: 'triangle', gain: 0.22 }));
      [523, 659, 784].forEach(f => tone(f * 2, 0.5, 0.9, { type: 'triangle', gain: 0.12, hold: 0.3 }));
    },
    firework() {
      tone(160 + Math.random() * 60, 0, 0.25, { type: 'sine', gain: 0.25, to: 60 });
      noise(0.02, 0.5, { freq: 2200, to: 900, q: 0.7, gain: 0.12, attack: 0.005 });
      for (let i = 0; i < 5; i++) noise(0.15 + Math.random() * 0.4, 0.03, { freq: 3000 + Math.random() * 2000, q: 2, gain: 0.12, attack: 0.002 });
    },
    gems() {
      [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, i * 0.07, 0.35, { type: 'sine', gain: 0.1 }));
    },
    star() {
      [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.09, 0.5, { type: 'sine', gain: 0.18 }));
    },
    lose() {
      // Sad trombone: wah wah wah wahhh.
      [196, 185, 175].forEach((f, i) => tone(f, i * 0.42, 0.4, { type: 'sawtooth', gain: 0.14, lowpass: 1100, attack: 0.03, hold: 0.25 }));
      tone(165, 1.26, 1.2, { type: 'sawtooth', gain: 0.14, lowpass: 1000, attack: 0.03, hold: 0.8, vibrato: 6, to: 150 });
    },
    boss() {
      // Drum hits and a low growl.
      [0, 0.18, 0.36].forEach(t => tone(90, t, 0.25, { type: 'sine', gain: 0.4, to: 45 }));
      tone(70, 0.5, 1.0, { type: 'sawtooth', gain: 0.14, to: 55, vibrato: 7, lowpass: 500, attack: 0.1, hold: 0.5 });
    },
    clank() {
      tone(1400 + Math.random() * 300, 0, 0.12, { type: 'square', gain: 0.07, lowpass: 3000 });
      tone(260, 0, 0.15, { type: 'triangle', gain: 0.18, to: 180 });
    },
    whistle() {
      tone(880, 0, 0.5, { type: 'triangle', gain: 0.14, vibrato: 4, hold: 0.35 });
      tone(1108, 0, 0.5, { type: 'triangle', gain: 0.1, vibrato: 4, hold: 0.35 });
      noise(0, 0.5, { freq: 3000, q: 3, gain: 0.05 });
    },
    crash() {
      noise(0, 0.9, { freq: 600, to: 150, filter: 'lowpass', gain: 0.35, attack: 0.005 });
      [0, 0.12, 0.25].forEach(t => tone(120 + Math.random() * 60, t, 0.3, { type: 'square', gain: 0.1, to: 50, lowpass: 900 }));
    },
    burner() { noise(0, 0.8, { freq: 250, to: 500, filter: 'lowpass', gain: 0.3, attack: 0.05 }); },
    splash() {
      noise(0, 0.7, { freq: 1500, to: 400, q: 0.8, gain: 0.3, attack: 0.01 });
      tone(180, 0, 0.3, { gain: 0.2, to: 70 });
    },
    crackle() {
      noise(0, 0.5, { freq: 700, to: 1200, q: 0.8, gain: 0.12, attack: 0.05 });
      for (let i = 0; i < 6; i++) noise(Math.random() * 0.5, 0.03, { freq: 2500 + Math.random() * 2000, q: 2, gain: 0.25, attack: 0.002 });
    },
    howl() {
      tone(420, 0, 1.4, { type: 'sine', gain: 0.12, to: 640, vibrato: 5, attack: 0.3, hold: 0.8 });
      tone(840, 0, 1.4, { type: 'sine', gain: 0.03, to: 1280, attack: 0.3, hold: 0.8 });
    },
    yelp() { tone(900, 0, 0.25, { type: 'sawtooth', gain: 0.08, to: 1400, lowpass: 2500 }); },
    thunder() {
      noise(0, 1.6, { freq: 300, to: 60, filter: 'lowpass', gain: 0.45, attack: 0.01 });
      noise(0.1, 1.2, { freq: 900, to: 200, filter: 'lowpass', gain: 0.15 });
    },
    chirp() {
      [0, 0.25, 0.9, 1.1].forEach(t => tone(2600 + Math.random() * 600, t, 0.12, { gain: 0.07, to: 3800 }));
    },
    scream() { tone(700, 0, 0.5, { type: 'sawtooth', gain: 0.08, to: 1100, vibrato: 9, lowpass: 2500 }); },
  };
})();
