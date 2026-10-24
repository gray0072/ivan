'use strict';

// City Builder — small helpers shared by every other file: math, a seeded random generator,
// the canvas scale for the device and a frame limiter.

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

// a repeatable random generator (mulberry32): the same seed gives the same map
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

// a stable 0..1 number for a tile (decoration that must not flicker between frames)
function hash2(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// distance from a point to a rectangle of tiles [x, x + w] × [y, y + h] (0 inside)
function distToRect(px, py, x, y, w, h) {
  const dx = Math.max(x - px, 0, px - (x + w));
  const dy = Math.max(y - py, 0, py - (y + h));
  return Math.hypot(dx, dy);
}

// $12 345 — money with a thin space between the thousands, a minus before the $ when negative
function money(v) {
  const s = Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (v < 0 ? '−$' : '$') + s;
}
function number(v) { return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

// amt < 0 darkens toward black, amt > 0 lightens toward white
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const target = amt < 0 ? 0 : 255, k = Math.abs(amt);
  const ch = (v) => Math.round(v + (target - v) * k);
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

// Canvas backing-store scale: the device's pixel density (capped), lowered on huge screens so the
// canvas never holds more than about 2560×1440 pixels
const MAX_DPR = 2.5;
const MAX_RENDER_PIXELS = 2560 * 1440;
function canvasScale(w, h, maxPixels = MAX_RENDER_PIXELS) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
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
