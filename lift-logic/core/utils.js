'use strict';

// Lift Logic — small helpers shared by every other file: math, a seeded random generator, a stable
// hash of texts and numbers (for the comic lines), time formatting and the canvas scale for the device.

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

// a repeatable random generator (mulberry32): the same seed gives the same day
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// a stable 32-bit hash of any number of strings / numbers
function hashOf(...parts) {
  let h = 2166136261 >>> 0;
  const s = parts.map((p) => String(p)).join('|');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

// 75.3 → "1:15"
function fmtTime(s) {
  s = Math.max(0, Math.floor(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
// minutes since midnight → "08:05"
function fmtClock(min) {
  min = ((Math.floor(min) % 1440) + 1440) % 1440;
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}
// a number for a stat: one decimal when it has one
function fmtNum(v) {
  if (typeof v !== 'number' || !isFinite(v)) return String(v);
  return Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1);
}

// amt < 0 darkens toward black, amt > 0 lightens toward white
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const target = amt < 0 ? 0 : 255, k = Math.abs(amt);
  const ch = (v) => Math.round(v + (target - v) * k);
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

// Canvas backing-store scale: the device's pixel density (capped), lowered on huge screens
const MAX_DPR = 2.5;
const MAX_RENDER_PIXELS = 2560 * 1440;
function canvasScale(w, h, maxPixels = MAX_RENDER_PIXELS) {
  const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, MAX_DPR);
  return Math.min(dpr, Math.sqrt(maxPixels / Math.max(1, w * h)));
}

// For requestAnimationFrame loops: on 120/144 Hz monitors it skips frames to hold ~MAX_FPS
function frameLimiter() {
  const step = 1000 / MAX_FPS;
  let next = 0;
  return (now) => {
    if (now < next - 2) return false;
    next = Math.max(next + step, now);
    return true;
  };
}

const isCoarsePointer = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

// fullscreen on phones, from a button's handler; iPhone Safari has none, the game then runs windowed
function enterFullscreen() {
  if (!isCoarsePointer) return;
  try {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } catch (e) { /* no fullscreen here */ }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// A tap handled on pointerup opens or changes what is under the finger; the click the browser sends right after
// it would land on that new thing — a key of the number pad, the backdrop of a dialog, a button of the block
// toolbar. Every pointerup tap calls this, and the one click that follows it is dropped.
let clickSwallowTimer = 0;
function swallowClick(e) {
  window.removeEventListener('click', swallowClick, true);
  clearTimeout(clickSwallowTimer);
  e.preventDefault();
  e.stopPropagation();
}
function swallowNextClick() {
  window.removeEventListener('click', swallowClick, true);
  window.addEventListener('click', swallowClick, true);
  clearTimeout(clickSwallowTimer);
  clickSwallowTimer = setTimeout(() => window.removeEventListener('click', swallowClick, true), CLICK_SWALLOW_MS);
}
