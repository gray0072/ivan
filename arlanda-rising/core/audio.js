'use strict';

// Arlanda Rising — the sound engine: everything is synthesized with Web Audio (no recorded files, no brands'
// jingles) and goes through one master gain, so Sound Off (arlandaRising.sound) is silent from the first frame
// and switching it applies at once. The recipes: a jet's roar and a propeller's drone (filtered noise and a
// buzz, louder when the map is zoomed in), the PA chime, a ping for a new task, a click, coins, a rising chord,
// a sad trombone, the ploughs' rumble, an alarm and the newspaper's press. ui/sounds.js decides what is heard.

const Sfx = (() => {
  let ctx = null, master = null, noiseBuf = null;
  let on = Store.get(KEYS.sound) !== 'off';

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain();
    master.gain.value = on ? 0.6 : 0;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  // browsers start audio only after a tap or a key: game.js calls this from the first one
  function unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {}); }
  function setOn(v) {
    on = !!v;
    Store.set(KEYS.sound, on ? 'on' : 'off');
    if (master) master.gain.setTargetAtTime(on ? 0.6 : 0, ctx.currentTime, 0.02);
  }
  function ready() { return on && ensure() && ctx.state === 'running'; }

  function env(g, t, a, peak, hold, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  }
  function tone(freq, dur, type, vol, when, slide) {
    if (!ready()) return;
    const t = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    env(g, t, 0.01, vol || 0.2, dur * 0.4, dur * 0.6);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  // filtered noise: a roar (jet), a hiss, a rumble
  function noise(dur, f0, f1, vol, q, when, attack) {
    if (!ready()) return;
    const t = ctx.currentTime + (when || 0);
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; src.loop = true;
    f.type = 'bandpass'; f.Q.value = q || 0.8;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, attack || dur * 0.3, vol, dur * 0.2, dur * 0.5);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.1);
  }

  const S = {
    jet(vol) { noise(3.2, 500, 1600, 0.22 * vol, 0.6, 0, 1.2); noise(3.2, 2400, 4200, 0.06 * vol, 2, 0, 1.4); },
    jetLand(vol) { noise(2.4, 1400, 500, 0.18 * vol, 0.7, 0, 0.4); noise(1.6, 700, 300, 0.2 * vol, 0.8, 0.7, 0.2); },
    prop(vol) {
      noise(3, 180, 260, 0.2 * vol, 3, 0, 1);
      for (let i = 0; i < 6; i++) tone(92 + i * 2, 0.5, 'sawtooth', 0.025 * vol, i * 0.45);
    },
    chime() { tone(784, 0.5, 'sine', 0.18); tone(659, 0.5, 'sine', 0.18, 0.28); tone(523, 0.8, 'sine', 0.18, 0.56); },
    ping() { tone(1175, 0.18, 'triangle', 0.14); tone(1568, 0.22, 'triangle', 0.1, 0.07); },
    click() { tone(660, 0.06, 'square', 0.06); },
    coins() { for (let i = 0; i < 5; i++) tone(1300 + i * 140, 0.1, 'triangle', 0.1, i * 0.07); },
    chord() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.9, 'triangle', 0.1, i * 0.09)); },
    sad() { [392, 370, 349, 294].forEach((f, i) => tone(f, i === 3 ? 0.9 : 0.35, 'sawtooth', 0.07, i * 0.38, i === 3 ? 260 : null)); },
    rumble() { noise(2.5, 90, 120, 0.25, 2, 0, 0.5); for (let i = 0; i < 4; i++) tone(1800, 0.05, 'square', 0.03, 0.3 + i * 0.5); },
    alarm() { for (let i = 0; i < 4; i++) tone(i % 2 ? 660 : 880, 0.22, 'square', 0.08, i * 0.24); },
    press() { for (let i = 0; i < 3; i++) noise(0.18, 300, 200, 0.25, 1, i * 0.32, 0.01); }
  };

  return { unlock, setOn, get on() { return on; }, play(name, vol) { if (S[name]) S[name](vol === undefined ? 1 : vol); } };
})();
