'use strict';

// City Builder — mouse, touch and keyboard turned into map gestures: hover, tap, a drag (a line of
// road or a pan, the game decides), two-finger pan and pinch, the wheel zoom; plus the arrow keys
// held for panning and fullscreen on phones. game.js fills Input.handlers and reads Input.keys.

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
  // hover(x, y | null), tap(x, y, touch), dragStart(x, y, touch) → 'line' | 'pan', dragMove(x, y),
  // dragEnd(x, y), cancel(), pan(dx, dy), zoom(factor, x, y), key(event)
  const handlers = {};
  const keys = {};          // e.code → held
  const pointers = new Map();
  let mode = null;          // null | 'pending' | 'line' | 'pan' | 'pinch' | 'done'
  let pinch = null;
  let canvas = null;

  function call(name, ...args) { return handlers[name] ? handlers[name](...args) : undefined; }
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function pinchState() {
    const [a, b] = [...pointers.values()];
    return { d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  }

  function down(e) {
    const p = pos(e);
    const touch = e.pointerType !== 'mouse';
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* already gone */ }
    pointers.set(e.pointerId, { x: p.x, y: p.y, sx: p.x, sy: p.y, touch });
    if (pointers.size === 1) {
      mode = !touch && e.button !== 0 ? 'pan' : 'pending';
    } else if (pointers.size === 2 && mode !== 'done') {
      if (mode === 'line') call('cancel');
      mode = 'pinch';
      pinch = pinchState();
    }
  }
  function move(e) {
    const p = pos(e);
    const pt = pointers.get(e.pointerId);
    if (!pt) {
      if (e.pointerType === 'mouse') call('hover', p.x, p.y);
      return;
    }
    const dx = p.x - pt.x, dy = p.y - pt.y;
    pt.x = p.x; pt.y = p.y;
    if (!pt.touch) call('hover', p.x, p.y);
    if (mode === 'pending' && Math.hypot(p.x - pt.sx, p.y - pt.sy) > TAP_SLOP) {
      mode = call('dragStart', pt.sx, pt.sy, pt.touch) === 'line' ? 'line' : 'pan';
      if (mode === 'pan') call('pan', p.x - pt.sx, p.y - pt.sy);
      else call('dragMove', p.x, p.y);
    } else if (mode === 'pan') {
      call('pan', dx, dy);
    } else if (mode === 'line') {
      call('dragMove', p.x, p.y);
    } else if (mode === 'pinch' && pointers.size >= 2) {
      const s = pinchState();
      call('zoom', s.d / pinch.d, s.mx, s.my);
      call('pan', s.mx - pinch.mx, s.my - pinch.my);
      pinch = s;
    }
  }
  function up(e, cancelled) {
    const pt = pointers.get(e.pointerId);
    if (!pt) return;
    pointers.delete(e.pointerId);
    if (!cancelled) {
      if (mode === 'pending') call('tap', pt.x, pt.y, pt.touch);
      else if (mode === 'line') call('dragEnd', pt.x, pt.y);
    } else if (mode === 'line') {
      call('cancel');
    }
    // after a pinch the last finger does nothing until it is lifted too
    mode = pointers.size ? 'done' : null;
  }

  function attach(cv) {
    canvas = cv;
    cv.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', (e) => up(e, false));
    window.addEventListener('pointercancel', (e) => up(e, true));
    cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !pointers.size) call('hover', null); });
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = pos(e);
      call('zoom', Math.exp(-clamp(e.deltaY, -120, 120) * 0.0018), p.x, p.y);
    }, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    const block = (e) => e.preventDefault();
    cv.addEventListener('touchstart', block, { passive: false });
    cv.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('keydown', (e) => { keys[e.code] = true; call('key', e); });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  }

  // a drag in progress (a line being drawn) is dropped, e.g. when the game pauses
  function reset() { pointers.clear(); mode = null; }

  return { handlers, keys, attach, reset, get dragging() { return mode === 'line'; } };
})();
