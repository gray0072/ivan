'use strict';

// Yacht — the Web Audio engine and the sound recipes, all synthesized (no audio files). Every sound
// goes through one master gain, set to 0 while the sound is off. Played only by ui/sounds.js (game
// events → sounds) and the fireworks.

const SOUND_KEY = 'yacht.sound';
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
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(audioOut);
  src.start(t0, Math.random());
  src.stop(t0 + dur + 0.05);
}
function notes(list, type, vol, step, len) {
  list.forEach((f, i) => tone(f, f, len || step * 1.6, type, vol, i * step));
}

const Sfx = {
  // dice knocking about in a leather cup: dull clicks, the leather taking the high end away
  rattle(ms) {
    const clicks = Math.round(ms / 42);
    for (let i = 0; i < clicks; i++) {
      const at = (i / clicks) * (ms / 1000) + rand(0, 0.02);
      noise(0.03, rand(0.1, 0.22), 'bandpass', rand(900, 1700), 700, at, 3);
    }
    noise(ms / 1000, 0.05, 'lowpass', 500, 300);
  },
  // dice landing on the table and rolling to a stop
  clatter(dice, ms) {
    for (let i = 0; i < dice * 4; i++) {
      const at = Math.pow(i / (dice * 4), 1.5) * (ms / 1000);
      noise(0.025, rand(0.08, 0.2) * (1 - 0.6 * i / (dice * 4)), 'bandpass', rand(1800, 3200), 1400, at, 4);
    }
  },
  hold() { tone(900, 700, 0.05, 'triangle', 0.09); },
  release() { tone(600, 760, 0.05, 'triangle', 0.07); },
  write() { noise(0.09, 0.08, 'highpass', 2600, 4200); tone(620, 620, 0.1, 'sine', 0.07, 0.03); },
  good() { noise(0.09, 0.08, 'highpass', 2600, 4200); notes([660, 880], 'triangle', 0.08, 0.08); },
  bad() { tone(180, 120, 0.22, 'triangle', 0.14); },
  general() { notes([523, 659, 784, 1047, 1319], 'triangle', 0.1, 0.09, 0.3); },
  undo() { tone(520, 340, 0.12, 'sine', 0.07); },
  fanfare() { notes([523, 659, 784, 1047, 784, 1047, 1319], 'triangle', 0.12, 0.12, 0.3); },
  rocket() { tone(rand(500, 700), rand(1300, 1700), 0.45, 'sine', 0.025); },
  bang() { tone(rand(80, 110), 30, 0.7, 'triangle', 0.25); noise(0.4, 0.06, 'highpass', 3000, 1200); }
};
