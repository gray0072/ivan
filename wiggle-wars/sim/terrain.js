'use strict';

// Wiggle Wars — the land as a bitmap of one byte per world pixel (1 = solid, 0 = air). Explosions
// carve circles out of it, a plank adds a rotated beam; each change is emitted ('carve', 'plank')
// so render/terrainview.js changes its canvas the same way. Also the questions the physics asks:
// solid(), a surface normal, whether a circle fits, the places a worm can stand.

const Terrain = (() => {
  let bits = new Uint8Array(WORLD_W * WORLD_H);

  function reset() { bits = new Uint8Array(WORLD_W * WORLD_H); return bits; }
  function data() { return bits; }

  function solid(x, y) {
    x |= 0; y |= 0;
    if (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H) return false;
    return bits[y * WORLD_W + x] !== 0;
  }

  function carve(cx, cy, r) {
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(WORLD_W - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(WORLD_H - 1, Math.ceil(cy + r));
    const r2 = r * r;
    for (let y = y0; y <= y1; y++) {
      const dy = y - cy, row = y * WORLD_W;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        if (dx * dx + dy * dy <= r2) bits[row + x] = 0;
      }
    }
    GameEvents.emit('carve', { x: cx, y: cy, r });
  }

  // the four corners of a beam centred on (cx, cy)
  function plankCorners(cx, cy, angle, len, thick) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const hx = len / 2, hy = thick / 2;
    return [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]].map(([u, v]) => [cx + u * c - v * s, cy + u * s + v * c]);
  }
  // is the point inside the beam
  function inPlank(px, py, cx, cy, angle, len, thick) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const dx = px - cx, dy = py - cy;
    const u = dx * c + dy * s, v = -dx * s + dy * c;
    return Math.abs(u) <= len / 2 && Math.abs(v) <= thick / 2;
  }
  function addPlank(cx, cy, angle, len, thick) {
    const pts = plankCorners(cx, cy, angle, len, thick);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(WORLD_W - 1, Math.ceil(Math.max(...xs)));
    const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(WORLD_H - 1, Math.ceil(Math.max(...ys)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (inPlank(x, y, cx, cy, angle, len, thick)) bits[y * WORLD_W + x] = 1;
    }
    GameEvents.emit('plank', { x: cx, y: cy, angle, len, thick });
  }

  // the direction away from the land around (x, y), from the solid points in a ring of radius r;
  // null when nothing solid is near
  function normal(x, y, r = 5) {
    let nx = 0, ny = 0, hit = false;
    for (let a = 0; a < 16; a++) {
      const ang = a * Math.PI / 8;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      for (const k of [0.5, 1]) {
        if (solid(x + dx * r * k, y + dy * r * k)) { nx -= dx; ny -= dy; hit = true; }
      }
    }
    if (!hit) return null;
    const l = Math.hypot(nx, ny);
    return l < 1e-6 ? { x: 0, y: -1 } : { x: nx / l, y: ny / l };
  }

  // does a circle of radius r centred on (cx, cy) touch the land
  function circleHits(cx, cy, r) {
    if (solid(cx, cy)) return true;
    for (let a = 0; a < 12; a++) {
      const ang = a * Math.PI / 6;
      if (solid(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r)) return true;
    }
    for (let a = 0; a < 6; a++) {
      const ang = a * Math.PI / 3 + 0.5;
      if (solid(cx + Math.cos(ang) * r * 0.55, cy + Math.sin(ang) * r * 0.55)) return true;
    }
    return false;
  }

  // the places a worm can stand: feet on the land, free room above, out of the water;
  // `step` px apart along x, every surface of a column (caves have several)
  function standSpots(step = 6, water = WATER_Y, margin = 20) {
    const out = [];
    for (let x = margin; x < WORLD_W - margin; x += step) {
      for (let y = 24; y < water - 24; y++) {
        if (!solid(x, y) && solid(x, y + 1)) {
          let free = true;
          for (let k = 1; k <= 24 && free; k += 2) if (solid(x, y - k) || solid(x - 6, y - k) || solid(x + 6, y - k)) free = false;
          if (free && solid(x - 4, y + 4) && solid(x + 4, y + 4)) out.push({ x, y });
        }
      }
    }
    return out;
  }

  return { reset, data, solid, carve, addPlank, plankCorners, inPlank, normal, circleHits, standSpots };
})();
