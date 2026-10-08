'use strict';

// Seagulls fly over the water; a leaping fish can snatch one, scare it off, or get snatched itself.
// Used by spawn.js (resetWorld), npc.js and player.js (fishMeetsGull) and game.js (updateBirds).

// The gull takes off up and away; with `carry` it holds that fish in its beak
function birdLeave(b, carry) {
  b.leaving = true;
  b.carry = carry;
  if (Math.abs(b.vx) < 70) b.vx = Math.sign(b.vx || 1) * 70;
}
// A leaping fish `e` touching gull `b`: fry get snatched, small fish scare the gull off, bigger fish eat it.
// Returns 'caught' | 'scared' | 'eaten' | null
function fishMeetsGull(e, b) {
  if (b.leaving) return null;
  const stage = stageIndexForR(e.r);
  const hitR = b.r * BIRD_HIT;
  if (stage > GULL_SCARE_STAGE) {
    return circlesHitPoint([mouthCircle(e.x, e.y, e.r, e.heading)], b.x, b.y, hitR) ? 'eaten' : null;
  }
  if (!circlesHitPoint(fishCircles(e.x, e.y, e.r, e.heading), b.x, b.y, hitR)) return null;
  if (stage <= GULL_PREY_STAGE && !(e === player && player.invulnTimer > 0)) {
    birdLeave(b, { r: e.r, color: STAGES[stage].color, wagPhase: e.wagPhase || 0 });
    return 'caught';
  }
  birdLeave(b, null);
  return 'scared';
}
function birdCull() { return Math.max(BIRD_RANGE, offscreenDist(60) + 400); }
function spawnBird(anywhere) {
  const minD = anywhere ? 0 : offscreenDist(60);
  const dx = rand(minD, Math.max(birdCull() - 100, minD + 200)) * (Math.random() < 0.5 ? -1 : 1);
  const dir = Math.random() < 0.5 ? -1 : 1;
  birds.push({
    x: player.x + dx,
    // more gulls low down, where even small fish can get them
    h: BIRD_MIN_H + Math.pow(Math.random(), 1.6) * (BIRD_MAX_H - BIRD_MIN_H),
    y: 0,
    r: rand(7, 11),
    vx: dir * rand(45, 85),
    flap: rand(0, Math.PI * 2),
    bob: rand(0, Math.PI * 2),
    glide: 0,
    leaving: false,   // flying away up and off: after a hit, or with a caught fish
    carry: null       // { r, color, wagPhase } of a fish held in the beak
  });
  updateBird(birds[birds.length - 1], 0);
}
function updateBird(b, dt) {
  if (b.leaving) {
    b.x += b.vx * BIRD_LEAVE_SPEED * dt;
    b.h += BIRD_LEAVE_CLIMB * dt;
    b.y = SURFACE_Y - b.h;
    b.flap += dt * 16;
    b.glide = 0;
    if (b.carry) b.carry.wagPhase += dt * 12;
    return;
  }
  b.x += b.vx * dt;
  b.bob += dt * 0.8;
  b.y = SURFACE_Y - b.h + Math.sin(b.bob) * 6;
  // flap for a while, then glide with the wings held out
  if (b.glide > 0) b.glide -= dt;
  else {
    b.flap += dt * 9;
    if (Math.random() < dt * 0.25) b.glide = rand(0.8, 2);
  }
}
// Every gull flies on; the ones left far behind or flown off high are replaced by new ones out of view
function updateBirds(dt) {
  for (const b of birds) updateBird(b, dt);
  for (let i = birds.length - 1; i >= 0; i--) {
    if (Math.abs(birds[i].x - player.x) > birdCull() || birds[i].h > BIRD_LEAVE_H) birds.splice(i, 1);
  }
  while (birds.length < BIRD_COUNT) spawnBird(false);
}
