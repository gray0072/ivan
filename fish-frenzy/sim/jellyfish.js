'use strict';

// Jellyfish: drifting and pulsing, their bell-and-tentacles shape (cached once per frame for both the hit tests
// and render.js) and how much a sting takes. Spawned in spawn.js; stings and meals are in npc.js and player.js.

// Recomputed once per frame; both collision and rendering read these cached values
function updateJellyGeometry(j) {
  j.bellR = j.r * (1 + 0.06 * Math.sin(j.bob * 2));
  j.baseY = j.y + Math.sin(j.bob) * 3 * j.scale;
  for (let k = 0; k < 4; k++) {
    const t = j.tent[k];
    const u = (k - 1.5) / 1.5;
    const len = j.bellR * (k === 1 || k === 2 ? 1.35 : 1.05);
    t.x0 = j.x + u * 0.6 * j.bellR;
    t.y0 = j.baseY;
    t.cx = t.x0 + Math.sin(j.bob * 1.3 + k) * 0.28 * j.bellR;
    t.cy = t.y0 + len * 0.5;
    t.x2 = t.x0 + Math.sin(j.bob * 1.3 + k + 1.2) * 0.2 * j.bellR;
    t.y2 = t.y0 + len;
    // midpoint of the quadratic curve, so the hit test follows the bend in two segments
    t.mx = 0.25 * t.x0 + 0.5 * t.cx + 0.25 * t.x2;
    t.my = 0.25 * t.y0 + 0.5 * t.cy + 0.25 * t.y2;
  }
}
// Jellyfish = a half-disk bell (flat side down) plus four curved tentacles
function circleHitsJelly(cx, cy, cr, j) {
  const px = cx - j.x, py = cy - j.baseY;
  const bellDist = py <= 0 ? Math.hypot(px, py) - j.bellR : distToSegment(px, py, -j.bellR, 0, j.bellR, 0);
  if (bellDist < cr) return true;
  const reach = cr + j.tentHalfW;
  for (const t of j.tent) {
    if (distToSegment(cx, cy, t.x0, t.y0, t.mx, t.my) < reach) return true;
    if (distToSegment(cx, cy, t.mx, t.my, t.x2, t.y2) < reach) return true;
  }
  return false;
}
function fishHitsJelly(circles, j) {
  for (const c of circles) if (circleHitsJelly(c.x, c.y, c.r, j)) return true;
  return false;
}

// Share of area a sting takes: more from a bigger jellyfish
function jellyShrink(j) {
  return JELLY_SHRINK + (JELLY_SHRINK_BIG - JELLY_SHRINK) * (j.scale - 1) / (JELLY_SCALE_MAX - 1);
}

// Bounce off the surface by the top of the bell and off the floor by the tentacle tips
function updateJellies(dt) {
  for (const j of jellies) {
    j.bob += dt * j.pulse;
    j.x += Math.cos(j.heading) * j.speed * dt;
    j.y += Math.sin(j.heading) * j.speed * dt;
    const low = FLOOR_Y - j.r * JELLY_TENTACLE_REACH, high = SURFACE_Y + JELLY_SURFACE_MARGIN + j.r;
    if (j.y > low) { j.y = low; j.heading = -j.heading; }
    if (j.y < high) { j.y = high; j.heading = -j.heading; }
    updateJellyGeometry(j);
  }
}
