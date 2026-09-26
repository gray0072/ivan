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
