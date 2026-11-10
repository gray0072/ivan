'use strict';

// Wiggle Wars — bodies on the land: worms and the objects (crates, mines, barrels, targets,
// gravestones). A body is a circle of radius r standing on its feet (x, y = the lowest air pixel
// under it). On the ground it walks pixel by pixel up and down small steps; in the air it falls,
// bounces off walls when thrown and lands; landing hard hurts a worm; the water drowns it.
// Used by sim/turn.js (each step), sim/weapons.js (pushes) and sim/ai.js (trying steps).

const Physics = (() => {
  const S = Terrain.solid;

  // does a body of radius r with its feet at (x, y) fit in the air
  function fits(x, y, r = WORM_R) {
    const cy = y - r;
    if (S(x, y) || S(x, cy) || S(x, y - 2 * r + 1)) return false;
    const k = r * 0.72;
    return !(S(x - k, cy - k) || S(x + k, cy - k) || S(x - k, cy + k * 0.8) || S(x + k, cy + k * 0.8) ||
      S(x - r + 1, cy) || S(x + r - 1, cy));
  }
  function onGround(x, y, r = WORM_R) {
    const k = Math.max(2, r * 0.45);
    return S(x, y + 1) || S(x - k, y + 1) || S(x + k, y + 1);
  }

  // one pixel of walking: the new feet, or null when a wall is in the way;
  // { x, y, fall: true } when it walks off an edge
  function stepFrom(x, y, dir, r = WORM_R) {
    const nx = x + dir;
    for (const dy of [0, -1, 1, -2, 2, -3, 3, -4, 4]) {
      if (Math.abs(dy) > STEP_UP) continue;
      if (fits(nx, y + dy, r) && onGround(nx, y + dy, r)) return { x: nx, y: y + dy };
    }
    if (fits(nx, y, r)) return { x: nx, y, fall: true };
    return null;
  }

  function walk(b, dir, dt) {
    if (!b.grounded) return false;
    b.facing = dir;
    b.walkAcc = (b.walkAcc || 0) + WALK_SPEED * dt;
    let moved = false;
    while (b.walkAcc >= 1) {
      b.walkAcc -= 1;
      const s = stepFrom(b.x, b.y, dir, b.r || WORM_R);
      if (!s) { b.walkAcc = 0; break; }
      b.x = s.x; b.y = s.y; moved = true;
      if (s.fall) {
        b.grounded = false; b.vx = dir * WALK_SPEED * 0.8; b.vy = 0; b.thrown = false; b.walkAcc = 0;
        break;
      }
    }
    return moved;
  }

  function jump(b, back) {
    if (!b.grounded) return false;
    b.grounded = false; b.thrown = false; b.air = 0;
    b.vx = back ? -b.facing * FLIP_VX : b.facing * JUMP_VX;
    b.vy = -(back ? FLIP_VY : JUMP_VY);
    b.flip = !!back;
    b.y -= 1;
    return true;
  }

  // push a body out of the land it got stuck in (a plank on it, a teleport into a corner)
  function unstick(b, r) {
    for (let k = 1; k <= 14; k++) {
      if (fits(b.x, b.y - k, r)) { b.y -= k; return true; }
    }
    for (let k = 1; k <= 10; k++) {
      if (fits(b.x - k, b.y, r)) { b.x -= k; return true; }
      if (fits(b.x + k, b.y, r)) { b.x += k; return true; }
    }
    return false;
  }

  // settle the feet on the floor after a landing
  function snapDown(b, r) {
    for (let k = 0; k < 6 && !onGround(b.x, b.y, r); k++) {
      if (fits(b.x, b.y + 1, r)) b.y += 1; else break;
    }
  }

  function land(b, r) {
    b.impact = b.hardest || 0; b.hardest = 0;
    b.grounded = true; b.vx = 0; b.vy = 0; b.parachute = false; b.flip = false;
    if (!fits(b.x, b.y, r)) unstick(b, r);
    snapDown(b, r);
  }

  // one physics step of a body; returns 'land' (with b.impact), 'water' or null
  function update(b, dt, g) {
    const r = b.r || WORM_R;
    if (b.grounded) {
      if (!fits(b.x, b.y, r)) unstick(b, r);
      // supported: land under the feet, or wedged so it can't move down
      if (!onGround(b.x, b.y, r) && fits(b.x, b.y + 1, r)) { b.grounded = false; b.vx = 0; b.vy = 0; b.thrown = false; b.air = 0; }
      else return null;
    }
    b.air = (b.air || 0) + dt;
    if (b.parachute) { b.vy = CRATE_FALL; b.vx = 0; } else b.vy += g * dt;
    const sp = Math.hypot(b.vx, b.vy);
    const n = Math.max(1, Math.ceil(sp * dt / 1.5));
    const sx = b.vx * dt / n, sy = b.vy * dt / n;
    let result = null;
    for (let i = 0; i < n; i++) {
      const nx = b.x + sx, ny = b.y + sy;
      if (fits(nx, ny, r)) { b.x = nx; b.y = ny; continue; }
      const nrm = Terrain.normal(nx, ny - r, r + 3) || { x: 0, y: -1 };
      const into = -(b.vx * nrm.x + b.vy * nrm.y);
      const floor = nrm.y < -0.55;
      if (floor) b.hardest = Math.max(b.hardest || 0, into);
      if (floor && (!b.thrown || into < LAND_SPEED || Math.hypot(b.vx, b.vy) < LAND_SPEED)) {
        land(b, r);
        result = 'land';
        break;
      }
      // bounce off the wall or the ceiling
      if (into > 0) {
        b.vx += (1 + BOUNCE) * into * nrm.x;
        b.vy += (1 + BOUNCE) * into * nrm.y;
        b.vx *= 0.85; b.vy *= 0.85;
      } else { b.vx *= 0.5; b.vy *= 0.5; }
      if (!b.thrown) b.vx *= 0.3;
      if (!fits(b.x, b.y, r)) unstick(b, r);
      // slow and wedged between slopes: it stays there
      if (Math.hypot(b.vx, b.vy) < 40 && !fits(b.x, b.y + 1, r)) { b.hardest = Math.max(b.hardest || 0, into); land(b, r); result = 'land'; }
      break;
    }
    if (b.y - r > match.water || b.x < -400 || b.x > WORLD_W + 400) result = 'water';
    return result;
  }

  return { fits, onGround, stepFrom, walk, jump, update, unstick };
})();
