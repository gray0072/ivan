'use strict';

// Populating the infinite sea around the player: how many plankton, fish and jellyfish there should be for the
// screen and the zoom, where they appear (always off-screen), and recycling the ones left far behind.
// Used by game.js (resetWorld on a start, updatePopulation every frame).

// Area-uniform random point in the ring [minD, maxD] around the player, inside the water column
// (topMargin below the surface .. the floor). A point that lands outside is mirrored vertically, which
// keeps its distance; if the column is too thin for the ring, the point goes straight to the side.
function spawnPointAround(minD, maxD, topMargin) {
  maxD = Math.max(maxD, minD + 150);
  const top = SURFACE_Y + topMargin;
  for (let tries = 0; tries < 10; tries++) {
    const a = rand(0, Math.PI * 2);
    const d = Math.sqrt(rand(minD * minD, maxD * maxD));
    const dy = Math.abs(Math.sin(a) * d);
    let y = player.y + (Math.sin(a) < 0 ? -dy : dy);
    if (y > FLOOR_Y) y = player.y - dy;
    else if (y < top) y = player.y + dy;
    if (y >= top && y <= FLOOR_Y) return { x: player.x + Math.cos(a) * d, y };
  }
  return { x: player.x + (Math.random() < 0.5 ? -1 : 1) * rand(minD, maxD), y: rand(top, FLOOR_Y) };
}

// ---------- Counts ----------
// Spawn / cull distances: the visible screen size (larger side) in world units, so they grow as the camera zooms out
function spawnRadius() { return SPAWN_SCREENS * Math.max(screenW, screenH) / currentZoom(); }
function cullDist() { return spawnRadius() * CULL_MUL; }
// How many times more area this screen populates than the reference phone screen (REF_SCREEN_SIDE) at the same zoom
function fullScreenMul() {
  const area = (side) => {
    const R = SPAWN_SCREENS * side / currentZoom();
    return 2 * R * Math.min(2 * R, WATER_DEPTH);
  };
  return clamp(area(Math.max(screenW, screenH)) / area(REF_SCREEN_SIDE), 1, SCREEN_MUL_MAX);
}
// The lower graphics presets keep only a share (crowd) of that extra population, never going below the phone's
function screenMul() {
  const m = fullScreenMul();
  return Math.max(1, 1 + (m - 1) * crowdShare);
}
// Big players see a wider area full of equally big fish, so thin the crowd out as the player grows
function npcCount() { return Math.round(NPC_COUNT * clamp(1.2 - player.r / 800, 0.6, 1) * screenMul()); }
function jellyCount() { return Math.round(JELLY_COUNT * screenMul()); }
// The count follows the spawn box (clipped to the water column), so the density stays the same at any zoom
function foodCount() {
  const R = spawnRadius();
  const crowdCut = screenMul() / fullScreenMul();
  return Math.round(Math.min(FOOD_DENSITY * 2 * R * Math.min(2 * R, WATER_DEPTH), FOOD_MAX * fullScreenMul()) * crowdCut * difficulty.food);
}

// ---------- Food ----------
function spawnFood() {
  const R = spawnRadius();
  let x, y, tries = 0;
  do {
    x = player.x + rand(-R, R);
    y = rand(Math.max(player.y - R, SURFACE_Y + 12), Math.min(player.y + R, FLOOR_Y));
    tries++;
    // bias food density toward the sea floor: reject shallow spawns more often
  } while (Math.random() > lerp(0.22, 1, depthFrac(y)) && tries < 6);
  foods.push({
    x, y,
    r: FOOD_R,
    bob: rand(0, Math.PI * 2),
    color: ['#fff59d', '#a5d6a7', '#ffab91', '#80deea'][Math.floor(Math.random() * 4)]
  });
}

// ---------- NPC fish ----------
// Sizes cluster around the player's own size (log-normal ratio), so a big player meets big rivals
// rather than swarms of tiny fish. Depth shifts the center: smaller near the floor, bigger in the shallows.
// Spawns happen far away, so the depth used is mostly the player's (that's where the fish will be met).
function pickNpcRadius(y) {
  let ratio;
  if (Math.random() < 0.1) ratio = rand(0.3, 0.55);  // occasional small fry for variety
  else ratio = lerp(1.2, 0.8, depthFrac(lerp(player.y, y, 0.25))) * Math.exp(heavyTailNormal() * 0.25);
  const r = clamp(player.r * ratio, 5, MAX_R);
  if (r > GIANT_R && Math.random() > Math.pow(GIANT_R / r, GIANT_EXP)) return clamp(player.r * rand(0.3, 0.55), 5, MAX_R);
  return r;
}
// A standard normal with 20% of the mass moved from the middle to the tails: 80% of samples are plain
// normal, 20% are drawn only from |z| > 1. So the ±1σ band holds 0.8 × 68% = 55% instead of 68%,
// and clearly smaller / clearly bigger fish show up more often.
function heavyTailNormal() {
  let z = randNormal();
  if (Math.random() < TAIL_SHARE) while (Math.abs(z) <= 1) z = randNormal();
  return z;
}
function spawnNpc() {
  const R = spawnRadius();
  // the size depends on depth, so probe a spot first, then push it out far enough that
  // even the tail of a huge fish can't pop into view
  const probe = spawnPointAround(offscreenDist(0), R, 0);
  const r = pickNpcRadius(probe.y);
  const minD = offscreenDist(r * FISH_EXTENT);
  const { x, y } = spawnPointAround(minD, Math.max(R, minD), npcSurfaceMargin(r));
  const heading = rand(0, Math.PI * 2);
  npcs.push({
    x, y,
    r,
    heading,
    wanderTarget: heading,
    wanderTimer: rand(0.5, 2),
    mode: 'wander',
    air: null,
    leapTimer: 0,
    leapDir: 1,
    leapCooldown: rand(2, 10),
    stunTimer: 0,
    wagPhase: rand(0, Math.PI * 2),
    hue: Math.random(),
    growQueue: [],
    thinkTimer: rand(0, difficulty.npcReaction),  // time until the next look around
    seen: null,         // last noticed { mode: 'flee' | 'chase', heading }, kept until the next look
    aimErr: 0,          // current deviation from the ideal flee / chase direction (radians)
    aimErrTarget: 0,
    aimErrTimer: 0,
    boost: npcBoostMax(),  // dash stamina, see NPC_BOOST_ADD
    dashing: false,
    boostCooldown: 0,      // seconds until the spent tank comes back full
    speedVar: rand(1 - NPC_SPEED_SPREAD, 1 + NPC_SPEED_SPREAD)  // each fish is a little faster or slower
  });
}

// ---------- Jellyfish ----------
function spawnJelly() {
  const scale = 1 + (JELLY_SCALE_MAX - 1) * Math.pow(Math.random(), JELLY_SCALE_EXP);
  const r = rand(JELLY_R_MIN, JELLY_R_MAX) * scale;
  const minD = offscreenDist(r * 2.5);
  const { x, y } = spawnPointAround(minD, Math.max(spawnRadius(), minD), JELLY_SURFACE_MARGIN + r);
  const j = {
    x, y, r, scale,
    speed: JELLY_DRIFT / Math.sqrt(scale),
    pulse: JELLY_PULSE / Math.sqrt(scale),
    tentHalfW: JELLY_TENTACLE_HALF_W * Math.sqrt(scale),
    heading: rand(0, Math.PI * 2),
    bob: rand(0, Math.PI * 2),
    hue: JELLY_HUES[Math.floor(Math.random() * JELLY_HUES.length)],
    tent: [{}, {}, {}, {}]
  };
  updateJellyGeometry(j);
  jellies.push(j);
}

// ---------- The whole sea ----------
function resetWorld() {
  foods.length = 0;
  npcs.length = 0;
  jellies.length = 0;
  birds.length = 0;
  const fc = foodCount();
  for (let i = 0; i < fc; i++) spawnFood();
  const nc = npcCount();
  for (let i = 0; i < nc; i++) spawnNpc();
  const jc = jellyCount();
  for (let i = 0; i < jc; i++) spawnJelly();
  for (let i = 0; i < BIRD_COUNT; i++) spawnBird(true);
}

// Recycle entities that drifted too far in this infinite world, and keep counts topped up nearby
// Cull distances never drop below "fully off-screen + margin", or zoomed-out views on big screens
// would see things vanish (and spawn/cull would fight each other)
function updatePopulation() {
  const foodCull = Math.max(cullDist(), offscreenDist(10) + 300);
  for (let i = foods.length - 1; i >= 0; i--) if (dist(player.x, player.y, foods[i].x, foods[i].y) > foodCull) foods.splice(i, 1);
  const npcCull = cullDist();
  for (let i = npcs.length - 1; i >= 0; i--) {
    const n = npcs[i];
    if (dist(player.x, player.y, n.x, n.y) > Math.max(npcCull, offscreenDist(n.r * FISH_EXTENT) + 600)) npcs.splice(i, 1);
  }
  // When the target count drops (player grew), retire the farthest bots that are fully off-screen
  while (npcs.length > npcCount()) {
    let far = -1, farD = 0;
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      const d = dist(player.x, player.y, n.x, n.y);
      if (d > offscreenDist(n.r * FISH_EXTENT) && d > farD) { farD = d; far = i; }
    }
    if (far < 0) break;
    npcs.splice(far, 1);
  }
  for (let i = jellies.length - 1; i >= 0; i--) {
    const j = jellies[i];
    if (dist(player.x, player.y, j.x, j.y) > Math.max(cullDist(), offscreenDist(j.r * 2.5) + 600)) jellies.splice(i, 1);
  }
  const fc = foodCount();
  while (foods.length < fc) spawnFood();
  while (npcs.length < npcCount()) spawnNpc();
  const jc = jellyCount();
  while (jellies.length < jc) spawnJelly();
}
