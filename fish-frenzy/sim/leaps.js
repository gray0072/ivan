'use strict';

// Leaps out of the water, for the player and the NPCs alike: the launch at the surface and the ballistic
// flight back down. Used by npc.js and player.js.

// Called when a fish's center crosses the surface going up. With enough upward speed it launches on a
// ballistic arc (returns true); otherwise it's held at the surface and just skims along it, back and fins out.
function trySurfaceLeap(e, sp, boosting) {
  const g = gravityForR(e.r);
  const v = boosting ? Math.max(sp, Math.sqrt(2 * g * LEAP_HEIGHT * e.r)) : sp;
  const elev = Math.min(Math.asin(clamp(-Math.sin(e.heading), 0, 1)), MAX_LEAP_ELEV);
  const dir = Math.cos(e.heading) >= 0 ? 1 : -1;
  const vx = dir * Math.cos(elev) * v, vy = -Math.sin(elev) * v;
  if (vy * vy / (2 * g) < MIN_LEAP * e.r) {
    e.y = SURFACE_Y;
    return false;
  }
  e.y = SURFACE_Y;
  e.air = { vx, vy, g, dripTimer: 0 };
  e.heading = Math.atan2(vy, vx);
  splash(e, -vy, false);
  return true;
}
// Flight above the water: gravity only, the nose follows the velocity. Returns true on splashdown.
function updateAirborne(e, dt) {
  const a = e.air;
  a.vy += a.g * dt;
  e.x += a.vx * dt;
  e.y += a.vy * dt;
  e.heading = Math.atan2(a.vy, a.vx);
  // water streams off the tail
  a.dripTimer -= dt;
  if (a.dripTimer <= 0 && onScreenX(e.x, e.r * 2)) {
    a.dripTimer = 0.04;
    const tx = e.x - Math.cos(e.heading) * e.r * 1.4, ty = e.y - Math.sin(e.heading) * e.r * 1.4;
    if (ty < SURFACE_Y) drops.push({
      x: tx + rand(-0.2, 0.2) * e.r, y: ty + rand(-0.2, 0.2) * e.r,
      vx: a.vx * rand(0.1, 0.4), vy: a.vy * rand(0.1, 0.4),
      r: rand(0.5, 1) * (1.2 + e.r * 0.03), g: a.g
    });
  }
  if (e.y >= SURFACE_Y && a.vy > 0) {
    e.y = SURFACE_Y + 1;
    splash(e, a.vy, true);
    e.air = null;
    return true;
  }
  return false;
}
