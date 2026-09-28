'use strict';

// ---------- Keyboard ----------
const keys = {};
const STEER_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'Control'];
window.addEventListener('keydown', (e) => {
  if (STEER_KEYS.includes(e.key)) { keys[e.key] = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  if (STEER_KEYS.includes(e.key)) { keys[e.key] = false; e.preventDefault(); }
});

// ---------- Overlay menus: arrows move between the buttons, Space/Enter press the focused one ----------
// With nothing focused yet, the panel's default button counts as focused (the one Space/Enter press, where arrows start)
const NAV_DIRS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
function visiblePanel() {
  const ov = document.getElementById('overlay');
  if (!ov || ov.style.display === 'none') return null;
  return Array.from(ov.children).find((c) => !c.hidden) || null;
}
// The nearest button in the arrow's direction. Buttons in the same row (for ← →) or column (for ↑ ↓), i.e. overlapping
// the current one across the move, always win; otherwise being off to the side counts double
function navTarget(buttons, from, [dx, dy]) {
  const f = from.getBoundingClientRect();
  const fx = f.left + f.width / 2, fy = f.top + f.height / 2;
  let best = null, bestScore = Infinity;
  for (const el of buttons) {
    if (el === from) continue;
    const b = el.getBoundingClientRect();
    const bx = b.left + b.width / 2, by = b.top + b.height / 2;
    const along = (bx - fx) * dx + (by - fy) * dy;
    if (along <= 1) continue;
    const inLine = dx ? b.top < f.bottom && b.bottom > f.top : b.left < f.right && b.right > f.left;
    const score = along + 2 * Math.abs((bx - fx) * dy - (by - fy) * dx) + (inLine ? 0 : 1e6);
    if (score < bestScore) { bestScore = score; best = el; }
  }
  return best;
}
window.addEventListener('keydown', (e) => {
  const panel = visiblePanel();
  if (!panel) return;
  const buttons = Array.from(panel.querySelectorAll('.btn')).filter((b) => b.offsetParent !== null);
  const focused = buttons.includes(document.activeElement) ? document.activeElement : null;
  const fallback = panel.querySelector('.btn.default') || buttons[0];
  if (NAV_DIRS[e.key]) {
    e.preventDefault();
    const from = focused || fallback;
    const next = from && (navTarget(buttons, from, NAV_DIRS[e.key]) || from);
    if (next) next.focus();
    return;
  }
  if (e.code !== 'Space' && e.key !== 'Enter') return;
  e.preventDefault();
  if (e.repeat) return;
  const btn = focused || fallback;
  if (btn) btn.click();
});

// ---------- Touch: floating joystick in the left half, hold in the right half to dash ----------
const STEER_ZONE_FRAC = 1 / 2;
const JOY_RADIUS = 60;
const JOY_DEADZONE = 0.2;
const joystick = { id: null, baseX: 0, baseY: 0, dx: 0, dy: 0 };
const boostTouchIds = new Set();

function isTouchBoosting() { return boostTouchIds.size > 0; }
function resetTouches() {
  joystick.id = null;
  joystick.dx = joystick.dy = 0;
  boostTouchIds.clear();
}

{
  const touchCanvas = document.getElementById('game');

  touchCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * STEER_ZONE_FRAC && joystick.id === null) {
        joystick.id = t.identifier;
        joystick.baseX = t.clientX;
        joystick.baseY = t.clientY;
        joystick.dx = joystick.dy = 0;
      } else {
        boostTouchIds.add(t.identifier);
      }
    }
  }, { passive: false });

  touchCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== joystick.id) continue;
      let dx = t.clientX - joystick.baseX;
      let dy = t.clientY - joystick.baseY;
      const len = Math.hypot(dx, dy);
      if (len > JOY_RADIUS) { dx *= JOY_RADIUS / len; dy *= JOY_RADIUS / len; }
      joystick.dx = dx;
      joystick.dy = dy;
    }
  }, { passive: false });

  function endTouches(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === joystick.id) {
        joystick.id = null;
        joystick.dx = joystick.dy = 0;
      }
      boostTouchIds.delete(t.identifier);
    }
  }
  touchCanvas.addEventListener('touchend', endTouches);
  touchCanvas.addEventListener('touchcancel', endTouches);
}

// ---------- Fullscreen (phones/tablets only; must be called from a user gesture) ----------
const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

function enterFullscreen() {
  if (!isCoarsePointer) return;
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el, { navigationUI: 'hide' });
    if (p && p.catch) p.catch(() => {});
  } catch (err) { /* unsupported (e.g. iPhone Safari) - game still works windowed */ }
}
// Switching apps drops fullscreen, and the browser only allows it again from a user gesture:
// the first tap after coming back (touchend counts as one) restores it
window.addEventListener('touchend', enterFullscreen);
