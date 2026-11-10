'use strict';

// Wiggle Wars — keys, mouse and touch turned into what game.js needs: the keys held (by e.code),
// the touch joystick in the left half of the screen (it appears where the finger lands), taps
// and one-finger drags elsewhere (a weapon's target, panning the view), two-finger pinch-zoom,
// the mouse (click, drag to pan, wheel to zoom, right button for the arsenal) and fullscreen on
// phones. The on-screen buttons (Fire, Jump…) are DOM elements wired in ui/hud.js.
// game.js fills Input.handlers: key(e, down), tap(x, y), pan(dx, dy), zoom(f, x, y),
// hover(x, y | null), menu(), joyAllowed() → bool.

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

const Input = (() => {
  const handlers = {};
  const keys = {};
  const joystick = { active: false, id: null, x0: 0, y0: 0, x: 0, y: 0 };
  const touches = new Map();
  let pinch = null, hadPinch = false, drag = null;
  const call = (name, ...a) => (handlers[name] ? handlers[name](...a) : undefined);
  const now = () => performance.now() / 1000;

  function attach(canvas) {
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (!joystick.active && t.clientX < window.innerWidth / 2 && call('joyAllowed')) {
          Object.assign(joystick, { active: true, id: t.identifier, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, t0: now() });
          continue;
        }
        touches.set(t.identifier, { x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, t0: now(), moved: false });
      }
      if (touches.size >= 2) startPinch();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (joystick.active && t.identifier === joystick.id) { joystick.x = t.clientX; joystick.y = t.clientY; continue; }
        const p = touches.get(t.identifier);
        if (!p) continue;
        const dx = t.clientX - p.x, dy = t.clientY - p.y;
        p.x = t.clientX; p.y = t.clientY;
        if (Math.hypot(p.x - p.x0, p.y - p.y0) > TAP_MOVE) p.moved = true;
        if (!pinch && p.moved) call('pan', dx, dy);
      }
      if (pinch && touches.size >= 2) {
        const s = pinchState();
        call('zoom', s.d / pinch.d, s.mx, s.my);
        call('pan', s.mx - pinch.mx, s.my - pinch.my);
        pinch = s;
      }
    }, { passive: false });

    const end = (e) => {
      for (const t of e.changedTouches) {
        if (joystick.active && t.identifier === joystick.id) {
          joystick.active = false; joystick.id = null;
          // a short touch that never moved is a tap (a weapon's target in the left half)
          if (e.type === 'touchend' && Math.hypot(joystick.x - joystick.x0, joystick.y - joystick.y0) < TAP_MOVE && now() - joystick.t0 < TAP_TIME) call('tap', joystick.x0, joystick.y0);
          continue;
        }
        const p = touches.get(t.identifier);
        if (!p) continue;
        touches.delete(t.identifier);
        if (e.type === 'touchend' && !p.moved && !hadPinch && now() - p.t0 < TAP_TIME) call('tap', p.x, p.y);
      }
      if (touches.size < 2) pinch = null;
      if (!touches.size) hadPinch = false;
    };
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('touchcancel', end);

    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      drag = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, moved: false };
    });
    window.addEventListener('mousemove', (e) => {
      if (e.target === canvas) call('hover', e.clientX, e.clientY);
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (Math.hypot(drag.x - drag.x0, drag.y - drag.y0) > 5) drag.moved = true;
      if (drag.moved) call('pan', dx, dy);
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button !== 0 || !drag) return;
      if (!drag.moved && e.target === canvas) call('tap', e.clientX, e.clientY);
      drag = null;
    });
    canvas.addEventListener('mouseleave', () => call('hover', null, null));
    canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); call('menu'); });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      call('zoom', Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
    }, { passive: false });
  }

  function startPinch() { pinch = pinchState(); hadPinch = true; for (const p of touches.values()) p.moved = true; }
  function pinchState() {
    const [a, b] = [...touches.values()];
    return { d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  }

  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const was = keys[e.code];
    keys[e.code] = true;
    call('key', e, true, !!was);
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    call('key', e, false, false);
  });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; joystick.active = false; touches.clear(); });

  // the joystick's deflection, −1 … 1 on each axis, 0 inside the dead zone
  function stick() {
    if (!joystick.active) return { x: 0, y: 0 };
    let dx = (joystick.x - joystick.x0) / JOY_R, dy = (joystick.y - joystick.y0) / JOY_R;
    const d = Math.hypot(dx, dy);
    if (d > 1) { dx /= d; dy /= d; }
    if (d < JOY_DEAD) return { x: 0, y: 0 };
    return { x: dx, y: dy };
  }
  function release() { joystick.active = false; touches.clear(); pinch = null; drag = null; }

  return { handlers, keys, joystick, attach, stick, release };
})();
