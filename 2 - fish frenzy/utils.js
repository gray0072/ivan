'use strict';

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
// standard normal sample (Box-Muller)
function randNormal() {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}
function angDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function lerp(a, b, t) { return a + (b - a) * t; }
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
// amt < 0 darkens toward black, amt > 0 lightens toward white
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const target = amt < 0 ? 0 : 255, k = Math.abs(amt);
  const ch = (v) => Math.round(v + (target - v) * k);
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}
function formatTime(s) {
  const m = Math.floor(s / 60);
  return m + ':' + (s % 60).toFixed(1).padStart(4, '0');
}
// Canvas backing-store scale: the device's pixel density (capped), then lowered further on huge screens so the
// canvas never holds more than MAX_RENDER_PIXELS (≈ 2560×1440); the browser upscales the rest
const MAX_DPR = 2.5;
const MAX_RENDER_PIXELS = 2560 * 1440;
function canvasScale(w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  return Math.min(dpr, Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, w * h)));
}
// Frame limiter for requestAnimationFrame loops: on 120/144 Hz monitors it skips frames to hold ~MAX_FPS,
// on 60 Hz ones every frame passes (the 2 ms slack absorbs timer jitter)
const MAX_FPS = 60;
function frameLimiter() {
  const step = 1000 / MAX_FPS;
  let next = 0;
  return (now) => {
    if (now < next - 2) return false;
    next = Math.max(next + step, now);
    return true;
  };
}
