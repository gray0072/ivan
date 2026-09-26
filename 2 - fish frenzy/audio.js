'use strict';

let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function tone(freqStart, freqEnd, dur, type, gainVal) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
  gain.gain.setValueAtTime(gainVal, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}
function playEatSmall() { tone(rand(700, 900), 300, 0.09, 'sine', 0.12); }
function playEatBig() { tone(220, 70, 0.28, 'sawtooth', 0.18); }
function playSting() { tone(340, 90, 0.35, 'square', 0.16); }
function playLevelUp() {
  if (!audioCtx) return;
  const notes = [440, 554, 659, 880];
  notes.forEach((f, i) => {
    const t0 = audioCtx.currentTime + i * 0.09;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, t0);
    gain.gain.setValueAtTime(0.15, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.22);
  });
}
function playFanfare() {
  if (!audioCtx) return;
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  const times = [0, 0.12, 0.24, 0.36, 0.6, 0.72, 0.84];
  notes.forEach((f, i) => {
    const t0 = audioCtx.currentTime + times[i];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, t0);
    gain.gain.setValueAtTime(0.16, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + (i === notes.length - 1 ? 0.9 : 0.25));
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + 1);
  });
}
function playGameOver() { tone(220, 50, 0.7, 'sawtooth', 0.2); }

// A nasal, warbling voice: sawtooth through a bandpass, pitch following `points` ([time, Hz], from t0),
// with a fast vibrato for the gull's rasp
function gullVoice(t0, points, dur, vol, vibHz, vibDepth) {
  const osc = audioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(points[0][1], t0);
  for (const [t, f] of points.slice(1)) osc.frequency.exponentialRampToValueAtTime(f, t0 + t);
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.setValueAtTime(vibHz, t0);
  lfoGain.gain.setValueAtTime(vibDepth, t0);
  lfo.connect(lfoGain).connect(osc.frequency);
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(1700, t0);
  bp.Q.setValueAtTime(3, t0);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.setValueAtTime(vol, t0 + dur * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(bp).connect(gain).connect(audioCtx.destination);
  osc.start(t0); lfo.start(t0);
  osc.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
}
// Dead seagull: a chomp, a startled "KYAAH!", then a strangled, sagging "aaa-uhh..."
function playDeadGull() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  tone(260, 80, 0.14, 'sine', 0.25);
  gullVoice(t0 + 0.04, [[0, 950], [0.07, 1550], [0.26, 1150]], 0.28, 0.2, 38, 70);
  gullVoice(t0 + 0.36, [[0, 900], [0.25, 620], [0.8, 170]], 0.85, 0.14, 13, 90);
}

// Filtered noise burst; size 0..1 makes it longer and deeper, a splashdown is louder than a take-off
let lastSplashAt = 0;
function playSplash(size, entering) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  if (t0 - lastSplashAt < 0.08) return;  // several splashes in one moment would just clip
  lastSplashAt = t0;
  const dur = 0.25 + size * 0.45;
  const buf = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * dur), audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2600 - size * 1600, t0);
  filter.frequency.exponentialRampToValueAtTime(300 - size * 150, t0 + dur);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime((entering ? 0.22 : 0.12) * (0.7 + size * 0.5), t0);
  src.connect(filter).connect(gain).connect(audioCtx.destination);
  src.start(t0);
}
