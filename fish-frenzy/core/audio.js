'use strict';

let audioCtx = null;
let audioOut = null;   // the master gain every sound goes through: 0 while the sound is off
// Sound on / off (the start screen and the pause), remembered between visits
const SOUND_KEY = 'fishFrenzy.sound';
let soundOn = true;
try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch (err) { /* storage blocked */ }
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioOut = audioCtx.createGain();
    audioOut.gain.value = soundOn ? 1 : 0;
    audioOut.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function setSound(on) {
  soundOn = on;
  if (audioOut) audioOut.gain.value = on ? 1 : 0;
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (err) { /* storage blocked */ }
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
  osc.connect(gain).connect(audioOut);
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
    osc.connect(gain).connect(audioOut);
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
    osc.connect(gain).connect(audioOut);
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
  osc.connect(bp).connect(gain).connect(audioOut);
  osc.start(t0); lfo.start(t0);
  osc.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
}
// Gull sounds take a volume (1 = the player's own encounter; other fish pass less by distance and size)
// Dead seagull: a chomp, a startled "KYAAH!", then a strangled, sagging "aaa-uhh..."
function playDeadGull(volume = 1) {
  if (!audioCtx || volume < SPLASH_MIN_VOL) return;
  const t0 = audioCtx.currentTime;
  tone(260, 80, 0.14, 'sine', 0.25 * volume);
  gullVoice(t0 + 0.04, [[0, 950], [0.07, 1550], [0.26, 1150]], 0.28, 0.2 * volume, 38, 70);
  gullVoice(t0 + 0.36, [[0, 900], [0.25, 620], [0.8, 170]], 0.85, 0.14 * volume, 13, 90);
}
// Knocked gull: a soft thump and an indignant "kek-kek!"
function playGullScared(volume = 1) {
  if (!audioCtx || volume < SPLASH_MIN_VOL) return;
  const t0 = audioCtx.currentTime;
  tone(180, 90, 0.1, 'sine', 0.2 * volume);
  gullVoice(t0 + 0.05, [[0, 1100], [0.06, 1500], [0.12, 1250]], 0.13, 0.18 * volume, 30, 60);
  gullVoice(t0 + 0.22, [[0, 1150], [0.06, 1550], [0.12, 1300]], 0.13, 0.16 * volume, 30, 60);
}
// Gull snatching a fish: a snap of the beak and a triumphant laughing "ha-ha-haaa"
function playGullCatch(volume = 1) {
  if (!audioCtx || volume < SPLASH_MIN_VOL) return;
  const t0 = audioCtx.currentTime;
  tone(900, 400, 0.06, 'square', 0.12 * volume);
  gullVoice(t0 + 0.08, [[0, 1250], [0.1, 1400]], 0.12, 0.18 * volume, 25, 50);
  gullVoice(t0 + 0.24, [[0, 1250], [0.1, 1400]], 0.12, 0.18 * volume, 25, 50);
  gullVoice(t0 + 0.4, [[0, 1300], [0.15, 1500], [0.5, 1100]], 0.5, 0.17 * volume, 20, 70);
}

// A splash is three layers: a soft "whoosh" of noise through two stacked non-resonant low-passes (no hiss or ring,
// the old single filter over white noise sounded like a metal sheet), a low "plop" of the air cavity (a sine gliding
// down) and a few quiet bubble blips (short sines gliding up). size 0..1 makes it longer and deeper, a splashdown is
// louder than a take-off. volume scales it (the player's own splash plays at 1; other fish pass a volume from distance
// and size)
let lastSplashAt = 0;
function playSplash(size, entering, volume = 1, own = true) {
  if (!audioCtx || volume < SPLASH_MIN_VOL) return;
  const t0 = audioCtx.currentTime;
  // several splashes in one moment would just clip; the player's own splash is always heard
  if (!own && t0 - lastSplashAt < 0.08) return;
  lastSplashAt = t0;
  const level = (entering ? 1 : 0.55) * (0.7 + size * 0.5) * volume;
  const dur = 0.3 + size * 0.5;

  // whoosh: noise with a soft 10 ms attack and a smooth tail
  const sr = audioCtx.sampleRate;
  const buf = audioCtx.createBuffer(1, Math.ceil(sr * dur), sr);
  const data = buf.getChannelData(0);
  const attack = 0.01 * sr;
  for (let i = 0; i < data.length; i++) {
    const env = i < attack ? i / attack : Math.pow(1 - (i - attack) / (data.length - attack), 2.2);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const out = audioCtx.createGain();
  out.gain.value = 0.34 * level;
  let node = src;
  for (let k = 0; k < 2; k++) {
    const f = audioCtx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = -3;  // dB: no resonant peak
    f.frequency.setValueAtTime(1500 - size * 800, t0);
    f.frequency.exponentialRampToValueAtTime(260 - size * 120, t0 + dur);
    node = node.connect(f);
  }
  node.connect(out).connect(audioOut);
  src.start(t0);

  // plop: the collapsing air cavity, deeper for bigger fish; the main body of a splashdown
  const plopDur = 0.12 + size * 0.18;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = 'sine';
  const f0 = (entering ? 260 : 340) * (1 - size * 0.6);
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.45, t0 + plopDur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime((entering ? 0.3 : 0.15) * level, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + plopDur);
  osc.connect(g).connect(audioOut);
  osc.start(t0);
  osc.stop(t0 + plopDur + 0.02);

  // bubbles: a few quiet rising blips scattered over the tail
  const blips = 2 + Math.round(size * 3 + Math.random() * 2);
  for (let i = 0; i < blips; i++) {
    const t = t0 + 0.04 + Math.random() * dur * 0.7;
    const bf = (500 + Math.random() * 700) * (1 - size * 0.4);
    const bo = audioCtx.createOscillator();
    const bg = audioCtx.createGain();
    bo.type = 'sine';
    bo.frequency.setValueAtTime(bf, t);
    bo.frequency.exponentialRampToValueAtTime(bf * 1.6, t + 0.05);
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(0.05 * level, t + 0.006);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    bo.connect(bg).connect(audioOut);
    bo.start(t);
    bo.stop(t + 0.08);
  }
}
