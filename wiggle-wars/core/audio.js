'use strict';

// Wiggle Wars — the Web Audio engine and the sound recipes, all synthesized (no audio files).
// Every sound goes through one master gain, set to 0 while the sound is off. Played only by
// ui/sounds.js (game events → sounds) and the fireworks. Loops (the jetpack, the drill) start
// and stop by name.

const SOUND_KEY = 'wiggleWars.sound';
let audioCtx = null;
let audioOut = null;
let soundOn = true;
try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch (e) { /* storage blocked */ }

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    audioOut = audioCtx.createGain();
    audioOut.gain.value = soundOn ? 1 : 0;
    audioOut.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function setSound(on) {
  soundOn = on;
  if (audioOut) audioOut.gain.value = on ? 1 : 0;
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
}

// one oscillator gliding from f0 to f1, with a fast attack and an exponential fade
function tone(f0, f1, dur, type, vol, delay = 0) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(audioOut);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

let noiseBuf = null;
function noiseBuffer() {
  if (!noiseBuf) {
    const sr = audioCtx.sampleRate;
    noiseBuf = audioCtx.createBuffer(1, sr * 2, sr);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}
// filtered noise with a filter sweep from f0 to f1
function noise(dur, vol, type, f0, f1, q = 1, delay = 0) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffer();
  const f = audioCtx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t0);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(audioOut);
  src.start(t0, Math.random());
  src.stop(t0 + dur + 0.05);
}
function notes(list, type, vol, step, len) {
  list.forEach((f, i) => tone(f, f, len || step * 1.6, type, vol, i * step));
}

const Sfx = {
  // size 0..1 (a bomblet … dynamite)
  boom(size) {
    const s = clamp(size, 0.1, 1);
    noise(0.35 + s * 0.9, 0.25 + s * 0.3, 'lowpass', 1800 + s * 1200, 80);
    tone(110 - s * 40, 30, 0.3 + s * 0.6, 'sine', 0.35 + s * 0.25);
    noise(0.08, 0.15, 'highpass', 3000, 1500);
  },
  launch() { noise(0.45, 0.16, 'bandpass', 600, 2600, 1.4); tone(180, 90, 0.2, 'sawtooth', 0.04); },
  throw() { noise(0.18, 0.1, 'bandpass', 900, 1800, 1); },
  clink() { tone(1700, 1500, 0.06, 'triangle', 0.06); tone(2600, 2400, 0.05, 'sine', 0.03, 0.01); },
  fuseTick() { tone(2400, 2400, 0.025, 'square', 0.025); },
  shotgun() { noise(0.25, 0.32, 'lowpass', 4000, 300); tone(160, 60, 0.15, 'square', 0.12); },
  whack(hit) { noise(0.12, hit ? 0.3 : 0.12, 'bandpass', hit ? 1200 : 2400, 400, 2); if (hit) tone(300, 120, 0.12, 'triangle', 0.15); },
  jump() { tone(320, 640, 0.14, 'triangle', 0.08); },
  flip() { tone(300, 900, 0.22, 'triangle', 0.08); },
  land(hard) { noise(0.12, hard ? 0.25 : 0.1, 'lowpass', 700, 120); if (hard) tone(140, 60, 0.15, 'sine', 0.2); },
  splash(small) { noise(small ? 0.4 : 0.9, small ? 0.12 : 0.25, 'lowpass', 2500, 300); for (let i = 0; i < 4; i++) tone(600 + i * 120, 900 + i * 160, 0.06, 'sine', 0.03, 0.15 + i * 0.09); },
  crate() { tone(520, 520, 0.12, 'triangle', 0.06); tone(780, 780, 0.15, 'triangle', 0.06, 0.1); },
  crateLand() { noise(0.12, 0.15, 'lowpass', 600, 150); tone(180, 120, 0.1, 'sine', 0.12); },
  pickup() { notes([880, 1175, 1568], 'triangle', 0.07, 0.07); },
  heal() { notes([660, 880, 1100, 1320], 'sine', 0.06, 0.06); },
  mineBeep() { tone(1500, 1500, 0.06, 'square', 0.04); },
  mineArm() { tone(900, 1300, 0.08, 'square', 0.03); },
  teleport() { tone(400, 2400, 0.35, 'sine', 0.07); tone(600, 3000, 0.35, 'triangle', 0.04, 0.05); },
  plank() { tone(220, 200, 0.1, 'square', 0.08); noise(0.15, 0.15, 'bandpass', 2000, 900, 3, 0.02); tone(1800, 1800, 0.06, 'square', 0.03, 0.12); },
  power() { notes([523, 784, 1047, 1568], 'square', 0.04, 0.06); },
  turn() { tone(660, 660, 0.12, 'sine', 0.06); tone(990, 990, 0.18, 'sine', 0.06, 0.1); },
  tick() { tone(1200, 1200, 0.05, 'square', 0.04); },
  oof() { tone(330, 180, 0.18, 'triangle', 0.1); },
  bye() { notes([523, 494, 466, 440], 'triangle', 0.06, 0.12); },
  airstrike() { noise(2.2, 0.12, 'bandpass', 300, 900, 0.8); tone(200, 180, 2, 'sawtooth', 0.02); },
  select() { tone(1100, 1300, 0.04, 'sine', 0.05); },
  refuse() { tone(220, 200, 0.12, 'square', 0.06); },
  charge() { tone(200, 800, CHARGE_TIME, 'sawtooth', 0.02); },
  win() { notes([523, 659, 784, 1047, 784, 1047, 1319], 'triangle', 0.12, 0.12, 0.3); },
  lose() { notes([392, 370, 349, 262], 'sawtooth', 0.07, 0.35, 0.5); },
  suddenDeath() { for (let i = 0; i < 3; i++) { tone(440, 440, 0.25, 'square', 0.05, i * 0.5); tone(330, 330, 0.25, 'square', 0.05, i * 0.5 + 0.25); } },
  water() { noise(1.2, 0.15, 'lowpass', 300, 900); },
  rocket() { tone(rand(500, 700), rand(1300, 1700), 0.45, 'sine', 0.025); },
  bang() { tone(rand(80, 110), 30, 0.7, 'triangle', 0.25); noise(0.4, 0.06, 'highpass', 3000, 1200); }
};

// sounds that last while something runs: the jetpack's hiss, the drill's grind
const Loops = (() => {
  const on = {};
  function start(name) {
    if (!audioCtx || on[name]) return;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer();
    src.loop = true;
    const f = audioCtx.createBiquadFilter();
    const g = audioCtx.createGain();
    if (name === 'drill') { f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 3; g.gain.value = 0.25; }
    else { f.type = 'lowpass'; f.frequency.value = 1400; g.gain.value = 0.12; }
    src.connect(f).connect(g).connect(audioOut);
    let osc = null;
    if (name === 'drill') {
      osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 95;
      const og = audioCtx.createGain(); og.gain.value = 0.04;
      osc.connect(og).connect(audioOut); osc.start();
    }
    src.start();
    on[name] = { src, osc };
  }
  function stop(name) {
    const l = on[name];
    if (!l) return;
    try { l.src.stop(); if (l.osc) l.osc.stop(); } catch (e) { /* already stopped */ }
    delete on[name];
  }
  function stopAll() { for (const n of Object.keys(on)) stop(n); }
  return { start, stop, stopAll };
})();
