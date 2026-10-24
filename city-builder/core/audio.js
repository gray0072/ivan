'use strict';

// City Builder — the Web Audio engine and the sound recipes, all synthesized (no audio files).
// Every sound goes through one master gain, set to 0 while the sound is off. Played only by
// ui/sounds.js (game events → sounds) and the fireworks.

const SOUND_KEY = 'cityBuilder.sound';
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
// a burst of noise through a filter whose frequency glides from f0 to f1
function noise(dur, vol, type, f0, f1, delay = 0, q = 0.8) {
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
  build() { tone(160, 90, 0.18, 'sine', 0.3); noise(0.12, 0.12, 'lowpass', 900, 200); },
  bigBuild() { tone(120, 60, 0.35, 'sine', 0.35); noise(0.3, 0.15, 'lowpass', 700, 150); tone(523, 523, 0.15, 'triangle', 0.06, 0.12); tone(784, 784, 0.25, 'triangle', 0.06, 0.2); },
  road() { tone(900, 600, 0.04, 'square', 0.04); noise(0.06, 0.06, 'highpass', 2500, 1500); },
  bulldoze() { noise(0.45, 0.22, 'lowpass', 600, 120); tone(70, 45, 0.4, 'sawtooth', 0.08); },
  error() { tone(200, 180, 0.12, 'square', 0.07); tone(150, 140, 0.16, 'square', 0.07, 0.11); },
  click() { tone(1200, 1000, 0.03, 'sine', 0.06); },
  coins(n) {
    const k = Math.min(4, Math.max(1, n));
    for (let i = 0; i < k; i++) { tone(1800, 1800, 0.08, 'square', 0.025, i * 0.07); tone(2400, 2400, 0.12, 'sine', 0.03, i * 0.07 + 0.03); }
  },
  grow() { notes([660, 880, 1320], 'triangle', 0.06, 0.07); },
  alarm() {
    for (let i = 0; i < 3; i++) { tone(880, 880, 0.22, 'square', 0.05, i * 0.5); tone(660, 660, 0.22, 'square', 0.05, i * 0.5 + 0.25); }
  },
  flood() { noise(1.6, 0.25, 'lowpass', 300, 1200); noise(1.2, 0.12, 'bandpass', 600, 300, 0.5, 2); tone(140, 70, 0.8, 'sine', 0.12, 0.2); },
  splashOut() { noise(0.6, 0.15, 'lowpass', 1500, 300); },
  repair() { tone(1400, 1400, 0.05, 'square', 0.04); tone(1400, 1400, 0.05, 'square', 0.04, 0.12); tone(1800, 1800, 0.08, 'square', 0.04, 0.24); },
  burnDown() { noise(0.9, 0.22, 'lowpass', 400, 60); tone(110, 40, 0.8, 'sawtooth', 0.1); },
  milestone() { notes([523, 659, 784, 1047, 784, 1047, 1319], 'triangle', 0.12, 0.12, 0.3); },
  bankrupt() { notes([392, 370, 349, 262], 'sawtooth', 0.08, 0.35, 0.5); },
  debt() { tone(300, 300, 0.15, 'triangle', 0.08); tone(240, 240, 0.25, 'triangle', 0.08, 0.16); },
  rocket() { tone(rand(500, 700), rand(1300, 1700), 0.45, 'sine', 0.025); },
  bang() { tone(rand(80, 110), 30, 0.7, 'triangle', 0.25); noise(0.4, 0.06, 'highpass', 3000, 1200); }
};

// the city's hum while the game runs: filtered noise, louder the bigger the city
const Ambience = (() => {
  let src = null, gain = null;
  function start() {
    if (!audioCtx || src) return;
    src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer();
    src.loop = true;
    const f = audioCtx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 380;
    gain = audioCtx.createGain();
    gain.gain.value = 0;
    src.connect(f).connect(gain).connect(audioOut);
    src.start();
  }
  function stop() {
    if (!src) return;
    try { src.stop(); } catch (e) { /* already stopped */ }
    src = null; gain = null;
  }
  // level 0..1
  function set(level) {
    if (gain) gain.gain.setTargetAtTime(0.05 * clamp(level, 0, 1), audioCtx.currentTime, 0.5);
  }
  return { start, stop, set };
})();
