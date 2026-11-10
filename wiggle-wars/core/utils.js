'use strict';

// Wiggle Wars — small helpers shared by every other file: math, a seeded random generator,
// smooth noise for the maps, the canvas scale for the device and a frame limiter.

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
function shuffle(list, rnd = Math.random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
const DEG = Math.PI / 180;

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

// a stable 0..1 number for an integer point (texture that must not flicker)
function hash2(x, y, salt = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(salt | 0, 1103515245);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// smooth 1D value noise 0..1 from a table of random values, `scale` px between them
function noise1(table, x, scale) {
  const f = x / scale, i = Math.floor(f), t = f - i;
  const a = table[((i % table.length) + table.length) % table.length];
  const b = table[(((i + 1) % table.length) + table.length) % table.length];
  const s = t * t * (3 - 2 * t);
  return a + (b - a) * s;
}
// smooth 2D value noise 0..1 from a seed
function noise2(seed, x, y, scale) {
  const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy);
  const tx = fx - ix, ty = fy - iy;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed), c = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}

// amt < 0 darkens toward black, amt > 0 lightens toward white
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const target = amt < 0 ? 0 : 255, k = Math.abs(amt);
  const ch = (v) => Math.round(v + (target - v) * k);
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Canvas backing-store scale: the device's pixel density (capped), lowered on huge screens so the
// canvas never holds more than about 2560×1440 pixels
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
