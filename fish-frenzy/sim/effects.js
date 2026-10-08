'use strict';

// Short-lived effects: burst particles, bubbles, splashes (droplets, foam, a 'splash' event) and gull feathers.
// Spawned by the rest of sim/, moved by updateEffects every frame, drawn by render.js.

// ---------- Particles ----------
function burst(x, y, color, count, spread) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(20, spread);
    particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: rand(0.3, 0.7),
      maxLife: 0.7,
      color,
      r: rand(2, 4)
    });
  }
}

function spawnBubble(x, y, r) {
  bubbles.push({ x, y, r, life: rand(0.9, 1.5), maxLife: 1.5, phase: rand(0, Math.PI * 2) });
}

// Feathers from an eaten gull: they tumble and sway down, then float on the water and fade
function featherBurst(x, y, count = 16) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(20, 110);
    feathers.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
      rot: rand(0, Math.PI * 2), vr: rand(-4, 4), phase: rand(0, Math.PI * 2),
      len: rand(4, 7), grey: Math.random() < 0.35, life: rand(2.5, 4)
    });
  }
}

// ---------- Splashes: ballistic droplets, surface foam and entry bubbles ----------
// Other fish's sounds (ui/sounds.js) fade with distance from the player (half a screen away = half volume) and are
// louder or quieter than the player's own depending on how big the fish is compared to the player
function splashVolume(e) {
  if (e === player) return 1;
  const ref = Math.min(screenW, screenH) / (2 * currentZoom());
  const d = dist(e.x, e.y, player.x, player.y);
  const sizeMul = clamp(Math.pow(e.r / player.r, SPLASH_SIZE_EXP), SPLASH_SIZE_MUL[0], SPLASH_SIZE_MUL[1]);
  return sizeMul / (1 + (d / ref) * (d / ref));
}
function splash(e, speed, entering) {
  const x = e.x, r = e.r;
  if (!onScreenX(x, r * 3 + 400)) return;
  const g = gravityForR(r);
  const count = Math.round(clamp(14 + r * 0.15, 14, 50) * (entering ? 1.4 : 1));
  for (let i = 0; i < count; i++) {
    // a crown of drops: the wider out they start, the more they lean outward
    const u = rand(-1, 1);
    const a = -Math.PI / 2 + u * 0.75 + rand(-0.15, 0.15);
    const sp = speed * rand(0.35, 0.95) * (1 - Math.abs(u) * 0.35);
    drops.push({
      x: x + u * r * 0.7, y: SURFACE_Y - 1,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      r: rand(0.7, 1.5) * (2.2 + r * 0.04), g
    });
  }
  foams.push({ x, w: r * 1.3 + 8, h: Math.max(r * 0.6, speed * (entering ? 0.3 : 0.18)), life: 1.4, maxLife: 1.4 });
  if (entering) {
    for (let i = 0; i < count * 0.6; i++) {
      spawnBubble(x + rand(-0.8, 0.8) * r, SURFACE_Y + rand(4, r * 1.2 + 10), rand(1.5, 3.5) + r * 0.05);
    }
  }
  GameEvents.emit('splash', { fish: e, entering });
}

// ---------- Moving them all ----------
function updateEffects(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.life -= dt;
    if (b.life <= 0) { bubbles.splice(i, 1); continue; }
    b.phase += dt * 6;
    b.y -= (35 + b.r * 6) * dt;
    b.x += Math.sin(b.phase) * 12 * dt;
    if (b.y < SURFACE_Y) bubbles.splice(i, 1);  // popped at the surface
  }
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.vy += d.g * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (d.y > SURFACE_Y && d.vy > 0) drops.splice(i, 1);
  }
  for (let i = feathers.length - 1; i >= 0; i--) {
    const f = feathers[i];
    f.life -= dt;
    if (f.life <= 0) { feathers.splice(i, 1); continue; }
    f.phase += dt * 3;
    if (!f.floating) {
      // air drag quickly kills the burst, then a slow swaying fall
      f.vx *= Math.pow(0.1, dt);
      f.vy = Math.min(f.vy + 120 * dt, 28);
      f.x += (f.vx + Math.sin(f.phase) * 18) * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
      if (f.y >= SURFACE_Y) f.floating = true;
    } else {
      f.y = SURFACE_Y + surfaceWave(f.x, performance.now() / 1000);  // bobbing on the swell (scenery.js)
      f.rot += Math.sin(f.phase) * 0.3 * dt;
    }
  }
  for (let i = foams.length - 1; i >= 0; i--) {
    foams[i].life -= dt;
    if (foams[i].life <= 0) foams.splice(i, 1);
  }
}
