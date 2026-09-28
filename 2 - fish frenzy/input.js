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

// Space/Enter activate the default button of whichever overlay panel is visible
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' && e.key !== 'Enter') return;
  const ov = document.getElementById('overlay');
  if (!ov || ov.style.display === 'none') return;
  e.preventDefault();
  if (e.repeat) return;
  const panel = Array.from(ov.children).find((c) => !c.hidden);
  const btn = panel && (panel.querySelector('.btn.default') || panel.querySelector('.btn'));
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
