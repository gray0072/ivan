'use strict';

// Wiggle Wars — the view on the world: where it looks (x, y = the world point in the middle of the
// screen) and how close (zoom = screen px per world px). It follows match.focus smoothly; a pan by
// the player holds it until something new needs following (a new focus) or follow() is called.
// Also the screen shake of big explosions. Used by render/ and game.js (pan, zoom, taps).

const Camera = (() => {
  const cam = { x: WORLD_W / 2, y: WORLD_H / 2, zoom: 1, w: 800, h: 600, shake: 0, sx: 0, sy: 0 };
  let manual = false, lastFocus = null, snapNext = true;

  function minZoom() { return Math.min(cam.w / (WORLD_W + 160), ZOOM_MAX); }
  function defaultZoom() { return clamp(Math.sqrt(cam.w * cam.h / (VIEW_W * VIEW_W * 0.5)), minZoom(), ZOOM_MAX); }
  function resize(w, h) {
    const first = cam.w === 800 && cam.h === 600;
    cam.w = w; cam.h = h;
    cam.zoom = first ? defaultZoom() : clamp(cam.zoom, minZoom(), ZOOM_MAX);
    clampView();
  }
  function reset() { cam.zoom = defaultZoom(); manual = false; lastFocus = null; snapNext = true; }

  function clampView() {
    const hw = cam.w / 2 / cam.zoom, hh = cam.h / 2 / cam.zoom;
    cam.x = hw * 2 > WORLD_W + 200 ? WORLD_W / 2 : clamp(cam.x, hw - 100, WORLD_W + 100 - hw);
    const top = match && match.kind === 'cavern' ? -30 : -500;
    cam.y = hh * 2 > WORLD_H + 90 - top ? (top + WORLD_H + 60) / 2 : clamp(cam.y, top + hh, WORLD_H + 60 - hh);
  }

  function focusPoint(f) {
    if (!f) return null;
    if (f.r !== undefined && f.team !== undefined && f.hp !== undefined) return { x: f.x, y: f.y - WORM_R - 20 }; // a worm, a bit above it
    return { x: f.x, y: f.y };
  }
  function update(dt) {
    const f = match && match.focus;
    if (f !== lastFocus) { lastFocus = f; manual = false; }
    const p = focusPoint(f);
    if (p && !manual) {
      if (snapNext) { cam.x = p.x; cam.y = p.y; snapNext = false; }
      else {
        const k = 1 - Math.exp(-CAMERA_LERP * dt);
        cam.x += (p.x - cam.x) * k;
        cam.y += (p.y - cam.y) * k;
      }
    }
    clampView();
    cam.shake = Math.max(0, cam.shake - dt * 30);
    cam.sx = (Math.random() - 0.5) * cam.shake;
    cam.sy = (Math.random() - 0.5) * cam.shake;
  }
  function pan(dx, dy) { manual = true; cam.x -= dx / cam.zoom; cam.y -= dy / cam.zoom; clampView(); }
  function zoomAt(f, sx, sy) {
    const before = toWorld(sx, sy);
    cam.zoom = clamp(cam.zoom * f, minZoom(), ZOOM_MAX);
    const after = toWorld(sx, sy);
    cam.x += before.x - after.x; cam.y += before.y - after.y;
    clampView();
  }
  function follow() { manual = false; }
  function focusOn(x, y) { manual = true; cam.x = x; cam.y = y; clampView(); }
  function shake(amount) { cam.shake = Math.min(14, cam.shake + amount); }

  function toScreen(x, y) { return { x: (x - cam.x) * cam.zoom + cam.w / 2 + cam.sx, y: (y - cam.y) * cam.zoom + cam.h / 2 + cam.sy }; }
  function toWorld(sx, sy) { return { x: (sx - cam.w / 2) / cam.zoom + cam.x, y: (sy - cam.h / 2) / cam.zoom + cam.y }; }
  // the canvas transform from world to screen
  function apply(ctx, dpr) {
    ctx.setTransform(dpr * cam.zoom, 0, 0, dpr * cam.zoom, dpr * (cam.w / 2 - cam.x * cam.zoom + cam.sx), dpr * (cam.h / 2 - cam.y * cam.zoom + cam.sy));
  }

  return { cam, resize, reset, update, pan, zoomAt, follow, focusOn, shake, toScreen, toWorld, apply, get manual() { return manual; } };
})();
