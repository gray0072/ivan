'use strict';

// Lift Logic — the building view's camera and layout: the canvas size (devicePixelRatio-aware), the height
// of a floor, where the landings, the shafts and the rooms are, scrolling a tall building (drag, the wheel,
// following a lift), zoom (pinch, ctrl+wheel), and what a tap hits (a person, a cabin). Also the moving
// bits that are only for the eye: people walking away, floating words. Used by render/building.js and
// game.js.

const View = (() => {
  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d');
  const st = {
    w: 0, h: 0, scale: 1, zoom: 1, camY: 0, follow: 1, manual: false, eyes: false,
    leaving: [], words: [], pos: {}, lastTap: 0
  };

  function resize() {
    const r = canvas.getBoundingClientRect();
    st.w = Math.max(1, Math.round(r.width));
    st.h = Math.max(1, Math.round(r.height));
    st.scale = canvasScale(st.w, st.h);
    canvas.width = Math.round(st.w * st.scale);
    canvas.height = Math.round(st.h * st.scale);
  }

  // the geometry of the building on screen for this frame
  function layout() {
    if (!run) return null;
    const n = run.floors.length, lifts = run.lifts.length;
    const ground = Math.min(26, st.h * 0.07), top = 16;
    const fit = (st.h - ground - top) / n;
    const fh = clamp(fit, FLOOR_PX_MIN, FLOOR_PX_MAX) * st.zoom;
    const numW = 30;
    const sw = clamp(fh * 0.95, 36, 64);
    const free = st.w - numW - lifts * sw;
    const landW = clamp(free * 0.45, 96, 340);
    const shaftX = numW + landW;
    const roomsX = shaftX + lifts * sw;
    const totalH = n * fh;
    const view = st.h - ground - top;
    // scrolling: the followed lift in the middle, unless the player scrolled
    let camY = 0;
    if (totalH > view) {
      const maxCam = totalH - view;
      if (!st.manual) {
        const L = run.lifts[st.follow - 1] || run.lifts[0];
        st.camY = clamp(L.pos * fh + fh / 2 - view / 2, 0, maxCam);
      }
      st.camY = clamp(st.camY, 0, maxCam);
      camY = st.camY;
    } else st.camY = 0;
    const baseY = st.h - ground + camY; // the bottom of floor index 0
    return { n, fh, numW, sw, landW, shaftX, roomsX, ground, baseY, top, totalH, view,
      floorY: (i) => baseY - (i + 1) * fh, shaftLeft: (k) => shaftX + k * sw };
  }

  // ---------- input ----------
  const pointers = new Map();
  let pinch0 = null, drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), z: st.zoom }; drag = null; }
    else drag = { x: e.offsetX, y: e.offsetY, cam: st.camY, moved: false };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (pinch0 && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      st.zoom = clamp(pinch0.z * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(10, pinch0.d), 0.6, 2.2);
      return;
    }
    if (drag) {
      const dy = e.offsetY - drag.y;
      if (Math.abs(dy) > 6) drag.moved = true;
      if (drag.moved) { st.manual = true; st.camY = drag.cam + dy; }
    }
  });
  const up = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch0 = null;
    if (drag && !drag.moved && pointers.size === 0) tap(e.offsetX, e.offsetY);
    if (pointers.size === 0) drag = null;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); drag = null; pinch0 = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey) st.zoom = clamp(st.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.6, 2.2);
    else { st.manual = true; st.camY -= e.deltaY; }
  }, { passive: false });
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  // a tap: the minimap scrolls there, a person shows their card, a cabin is followed and shows its plan
  function tap(x, y) {
    if (!run) return;
    const g = layout();
    if (Minimap.tap(x, y, g)) return;
    for (const id of Object.keys(st.pos)) {
      const p = st.pos[id];
      if (p.person && Math.abs(x - p.x) < g.fh * 0.3 && y < p.y + 4 && y > p.y - g.fh * 0.85) { Hud.personCard(p.person, x, y); return; }
    }
    for (const L of run.lifts) {
      const cx = g.shaftLeft(L.n - 1), cy = g.baseY - (L.pos + 1) * g.fh;
      if (x >= cx && x <= cx + g.sw && y >= cy && y <= cy + g.fh) { st.follow = L.n; st.manual = false; Hud.cabinCard(L, x, y); return; }
    }
    Hud.closeCard();
  }

  // ---------- what is only for the eye ----------
  function word(text, x, y, color) { st.words.push({ text, x, y, color, t: 0 }); }
  function reset() { st.leaving = []; st.words = []; st.pos = {}; st.manual = false; st.follow = 1; }

  window.addEventListener('resize', resize);
  return { canvas, ctx, st, resize, layout, word, reset };
})();
