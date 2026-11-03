'use strict';

// Yacht — small helpers shared by the screens and the fireworks.

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rand(a, b) { return a + Math.random() * (b - a); }

// text of the players (names) put into innerHTML
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// a score the way the sheet writes it in a sum: −5, 0, 12 (a real minus sign)
function numText(v) {
  return v < 0 ? '−' + Math.abs(v) : String(v);
}
// a number with a sign: +4, −2
function signed(v) {
  return v > 0 ? '+' + v : numText(v);
}
// an average with one decimal, in the language's own way
function dec1(v) {
  return v.toLocaleString(I18N.lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

const isCoarsePointer = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

function enterFullscreen() {
  if (!isCoarsePointer) return;
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el, { navigationUI: 'hide' });
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* unsupported (iPhone Safari): the game still works windowed */ }
}

// Canvas backing-store scale for the fireworks, with a limit on huge screens
function canvasScale(w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  return Math.min(dpr, Math.sqrt(2560 * 1440 / Math.max(1, w * h)));
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
