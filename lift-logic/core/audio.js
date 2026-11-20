'use strict';

// Lift Logic — the Web Audio engine: the sound recipes (all synthesized, no audio files) and the lift music,
// a few short procedural loops. Every sound goes through one master gain, 0 while the sound is off; the
// music has its own gain under it, 0 while the music is off; everything stops while the page is hidden. Played
// only by ui/sounds.js and the screens.

let audioCtx = null;
let audioOut = null;
let musicOut = null;
let soundOn = Store.get(KEYS.sound) !== 'off';
let musicOn = Store.get(KEYS.music) !== 'off';

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    audioOut = audioCtx.createGain();
    audioOut.gain.value = soundOn ? 1 : 0;
    audioOut.connect(audioCtx.destination);
    musicOut = audioCtx.createGain();
    musicOut.gain.value = musicOn ? 0.5 : 0;
    musicOut.connect(audioOut);
  }
  if (audioCtx.state !== 'running' && !document.hidden) audioCtx.resume();
}
// a game in the background is silent: the whole audio (the music, the hum, a chime on its way) is suspended
// while the page is hidden — another app, another tab, the phone locked — and goes on where it stopped
document.addEventListener('visibilitychange', () => {
  if (!audioCtx) return;
  if (document.hidden) audioCtx.suspend();
  else audioCtx.resume();
});
function setSound(on) {
  soundOn = on;
  if (audioOut) audioOut.gain.value = on ? 1 : 0;
  Store.set(KEYS.sound, on ? 'on' : 'off');
}
function setMusic(on) {
  musicOn = on;
  if (musicOut) musicOut.gain.value = on ? 0.5 : 0;
  Store.set(KEYS.music, on ? 'on' : 'off');
}

function tone(f0, f1, dur, type, vol, delay = 0, out = null) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(out || audioOut);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}
let noiseBuf = null;
function noise(dur, vol, type, f0, f1, delay = 0) {
  if (!audioCtx) return;
  if (!noiseBuf) {
    const sr = audioCtx.sampleRate;
    noiseBuf = audioCtx.createBuffer(1, sr, sr);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = audioCtx.currentTime + delay;
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuf;
  const f = audioCtx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(f0, t0);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(audioOut);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}
const notes = (list, type, vol, step, len) => list.forEach((f, i) => tone(f, f, len || step * 1.5, type, vol, i * step));

const Sfx = {
  // once going up, twice going down — as real lifts do
  chime(down) { tone(1046, 1046, 0.9, 'sine', 0.12); tone(2093, 2093, 0.5, 'sine', 0.03); if (down) { tone(830, 830, 0.9, 'sine', 0.12, 0.45); tone(1661, 1661, 0.5, 'sine', 0.03, 0.45); } },
  doors() { noise(0.5, 0.05, 'bandpass', 900, 500); },
  click() { tone(1800, 1600, 0.04, 'square', 0.03); },
  plusOne() { notes([880, 1320], 'triangle', 0.06, 0.07); },
  grumble() { tone(220, 140, 0.35, 'sawtooth', 0.05); tone(180, 120, 0.3, 'sawtooth', 0.04, 0.12); },
  buzzer() { tone(140, 140, 0.4, 'square', 0.05); },
  start() { notes([523, 659, 784], 'triangle', 0.08, 0.08); },
  stop() { notes([784, 523], 'triangle', 0.07, 0.09); },
  star(i) { tone(1046 * Math.pow(1.26, i), 1046 * Math.pow(1.26, i), 0.4, 'triangle', 0.1); tone(2093 * Math.pow(1.26, i), 2093, 0.3, 'sine', 0.03); },
  pass() { notes([523, 659, 784, 1046, 784, 1046], 'triangle', 0.11, 0.11, 0.3); },
  fail() { notes([392, 370, 330], 'triangle', 0.07, 0.25, 0.4); },
  place() { tone(660, 880, 0.07, 'sine', 0.06); },
  remove() { tone(500, 260, 0.1, 'triangle', 0.06); },
  error() { tone(300, 240, 0.15, 'square', 0.04); },
  tap() { tone(1200, 1300, 0.03, 'sine', 0.04); },
  rocket() { tone(500 + Math.random() * 200, 1500, 0.4, 'sine', 0.02); },
  bang() { tone(90, 30, 0.6, 'triangle', 0.2); noise(0.35, 0.05, 'highpass', 3000, 1200); }
};

// the motor's soft hum while a lift moves (pitch by speed)
const Hum = (() => {
  let osc = null, g = null;
  function set(speed) {
    if (!audioCtx) return;
    if (!osc) {
      osc = audioCtx.createOscillator(); osc.type = 'sawtooth';
      const f = audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
      g = audioCtx.createGain(); g.gain.value = 0;
      osc.connect(f).connect(g).connect(audioOut); osc.start();
    }
    const t = audioCtx.currentTime;
    osc.frequency.setTargetAtTime(55 + speed * 40, t, 0.1);
    g.gain.setTargetAtTime(speed > 0.01 ? 0.025 : 0, t, 0.15);
  }
  return { set };
})();

// The lift music: a four-chord loop with bass, soft chords and a little tune, scheduled ahead. 'calm' while
// editing, 'lively' during a run (a bit faster in a rush), silent otherwise.
const Music = (() => {
  // seventh chords in semitones from A3 (220 Hz): Imaj7 – vi7 – ii7 – V7 in F, and a second loop in C
  const SONGS = {
    calm: { bpm: 84, chords: [[-4, 0, 3, 7], [-7, -4, 0, 3], [-2, 1, 5, 8], [-9, -5, -2, 1]], melody: [12, null, 10, 8, null, 7, 8, null] },
    lively: { bpm: 112, chords: [[3, 7, 10, 14], [0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 8]], melody: [15, 14, 12, null, 10, 12, null, 7] }
  };
  let mode = null, timer = null, nextT = 0, step = 0, tempo = 1;
  const freq = (semi) => 220 * Math.pow(2, semi / 12);
  function schedule() {
    if (!audioCtx || !mode) return;
    const song = SONGS[mode];
    const beat = 60 / (song.bpm * tempo) / 2; // eighth notes
    while (nextT < audioCtx.currentTime + 0.4) {
      const bar = Math.floor(step / 8) % song.chords.length, k = step % 8;
      const chord = song.chords[bar], d = nextT - audioCtx.currentTime;
      if (k === 0 || k === 3 || k === 6) tone(freq(chord[0] - 12), freq(chord[0] - 12), beat * 2.2, 'triangle', 0.09, Math.max(0, d), musicOut);
      if (k === 2 || k === 5) for (const n of chord.slice(1)) tone(freq(n), freq(n), beat * 1.4, 'sine', 0.025, Math.max(0, d), musicOut);
      const m = song.melody[(step + bar * 3) % song.melody.length];
      if (m !== null && (k % 2 === 0 || mode === 'lively')) tone(freq(m + (bar % 2 ? 2 : 0)), freq(m + (bar % 2 ? 2 : 0)), beat * 1.2, 'triangle', 0.035, Math.max(0, d), musicOut);
      nextT += beat;
      step++;
    }
  }
  function play(m) {
    if (m === mode) return;
    mode = m;
    if (!m) { clearInterval(timer); timer = null; return; }
    if (!audioCtx) return;
    nextT = audioCtx.currentTime + 0.1;
    step = 0;
    if (!timer) timer = setInterval(schedule, 120);
  }
  function setTempo(k) { tempo = k; }
  return { play, setTempo, get mode() { return mode; } };
})();
