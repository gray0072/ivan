'use strict';

(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  // Render at the device's pixel density (capped for performance, see canvasScale); all drawing stays in CSS pixels
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    const dpr = canvasScale(W, H);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- Difficulty ----------
  let difficultyKey = 'medium';
  let difficulty = DIFFICULTIES[difficultyKey];

  // ---------- World ----------
  // depthFrac: 1 = right at the sea floor (dark, small fish, lots of food), 0 = at the surface (light, big rivals)
  function depthFrac(y) { return clamp((y - SURFACE_Y) / WATER_DEPTH, 0, 1); }

  // ---------- Leaps out of the water ----------
  // Gravity grows slowly with size, so big fish don't hang in the air for ages (the path is still a true parabola)
  function gravityForR(r) { return GRAVITY * Math.pow(r / BASE_R, 0.35); }

  // ---------- Stages (size tiers, shared by player and NPCs for readability) ----------
  function stageIndexForR(r) {
    for (let i = 0; i < STAGES.length; i++) if (r <= STAGES[i].maxR) return i;
    return STAGES.length - 1;
  }

  // ---------- Player ----------
  const player = {
    x: 0, y: FLOOR_Y - WATER_DEPTH / 2,
    air: null,      // { vx, vy, g } while flying above the surface
    heading: 0,
    r: BASE_R,
    turnInput: 0,
    boost: 1,       // stamina 0..difficulty.boostMax
    boosting: false,
    wagPhase: 0,
    stunTimer: 0,
    invulnTimer: 0,
    alive: true,
    growQueue: []   // pending growth from meals, applied gradually over GROW_TIME
  };

  function playerArea() { return player.r * player.r; }
  function growFish(e, area) { e.r = Math.min(MAX_R, Math.sqrt(Math.max(0, e.r * e.r + area))); }
  function growPlayer(area, eff) { growFish(player, area * eff); }
  // Meals (player's and NPCs') grow the fish gradually over GROW_TIME
  // Every meal also plays the bite animation
  function queueGrowth(area, e = player, isFood = false) {
    e.growQueue.push({ area, left: GROW_TIME });
    // sharks and bigger just swallow plankton, no visible bite
    if (!isFood || stageIndexForR(e.r) < NO_FOOD_CHOMP_STAGE) e.chompT = CHOMP_TIME;
  }
  // 0 = closed .. 1 = wide open: opens fast, snaps shut
  function chompOpen(e) {
    if (!(e.chompT > 0)) return 0;
    const t = 1 - e.chompT / CHOMP_TIME;
    return t < 0.35 ? t / 0.35 : Math.pow(1 - (t - 0.35) / 0.65, 2);
  }
  function applyQueuedGrowth(dt, e = player) {
    if (e.chompT > 0) e.chompT -= dt;
    const q = e.growQueue;
    for (let i = q.length - 1; i >= 0; i--) {
      const step = Math.min(dt, q[i].left);
      growFish(e, q[i].area * step / GROW_TIME);
      q[i].left -= step;
      if (q[i].left <= 0) q.splice(i, 1);
    }
  }

  // Power law through both ends: weight ∝ r^4.8 (10 g at BASE_R … 200 t at MAX_R)
  const WEIGHT_EXP = Math.log(MAX_WEIGHT_G / BASE_WEIGHT_G) / Math.log(MAX_R / BASE_R);
  function weightForR(r) { return BASE_WEIGHT_G * Math.pow(r / BASE_R, WEIGHT_EXP); }
  function formatWeight(g) {
    const fmt = (v, unit) => (v < 10 ? v.toFixed(1) : Math.round(v)) + ' ' + unit;
    if (g < 1000) return Math.round(g) + ' g';
    if (g < 1e6) return fmt(g / 1e3, 'kg');
    return fmt(g / 1e6, 't');
  }
  function lengthCmForR(r) { return BASE_LENGTH_CM * Math.cbrt(weightForR(r) / BASE_WEIGHT_G); }
  function formatLength(cm) {
    if (cm < 100) return Math.round(cm) + ' cm';
    const m = cm / 100;
    return (m < 10 ? m.toFixed(1) : Math.round(m)) + ' m';
  }
  function sizeText(r) { return formatWeight(weightForR(r)) + ' · ' + formatLength(lengthCmForR(r)); }

  function speedForR(r) { return clamp(150 - (r - BASE_R) * 0.35, 77, 150); }
  function turnRateForR(r) { return clamp(2.6 - (r - BASE_R) * 0.011, 0.8, 2.6); }

  // ---------- Camera ----------
  function currentZoom() { return clamp(1.15 - (player.r - BASE_R) / 220, 0.5, 1.15); }
  function worldToScreen(wx, wy) {
    const z = currentZoom();
    return { x: (wx - player.x) * z + W / 2, y: (wy - player.y) * z + H / 2, z };
  }
  // Distance from the player at which an object reaching `extent` world units from its center is fully off-screen
  function offscreenDist(extent) {
    return Math.hypot(W, H) / (2 * currentZoom()) + extent + 40;
  }
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

  // Big players see a wider area full of equally big fish, so thin the crowd out as the player grows:
  // fewer bots, spread over a larger area
  function npcSpawnRadius() { return SPAWN_RADIUS * clamp(player.r / 200, 1, 1.5); }
  function npcCullDist() { return npcSpawnRadius() * (CULL_DIST / SPAWN_RADIUS); }
  function npcCount() { return Math.round(NPC_COUNT * clamp(1.2 - player.r / 800, 0.6, 1)); }

  // ---------- Game state ----------
  let gameState = 'start'; // start | playing | paused | over
  let elapsed = 0;         // in-game seconds for the current run (pauses don't count)
  let cheated = false;
  let reachedFinalStage = false;
  let reachedMaxSize = false;
  let lastStageIndex = 0;

  // ---------- Food ----------
  const foods = [];
  function foodCount() { return Math.round(FOOD_COUNT * difficulty.food); }
  function spawnFood() {
    let x, y, tries = 0;
    do {
      x = player.x + rand(-SPAWN_RADIUS, SPAWN_RADIUS);
      y = rand(Math.max(player.y - SPAWN_RADIUS, SURFACE_Y + 12), Math.min(player.y + SPAWN_RADIUS, FLOOR_Y));
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
  const npcs = [];
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
    const R = npcSpawnRadius();
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
      speedVar: rand(1 - NPC_SPEED_SPREAD, 1 + NPC_SPEED_SPREAD)  // each fish is a little faster or slower
    });
  }

  // ---------- Jellyfish (hazard, not lethal) ----------
  const jellies = [];

  // ---------- Hit shapes (match what drawFish / the jellyfish renderer actually draw) ----------
  // Fish: circles along the body axis, [offset along heading, radius], both in units of r
  function fishCircles(x, y, r, heading) {
    const c = Math.cos(heading), s = Math.sin(heading);
    return FISH_HIT.map(([o, cr]) => ({ x: x + c * o * r, y: y + s * o * r, r: cr * r }));
  }
  function mouthCircle(x, y, r, heading) {
    return { x: x + Math.cos(heading) * MOUTH_HIT[0] * r, y: y + Math.sin(heading) * MOUTH_HIT[0] * r, r: MOUTH_HIT[1] * r };
  }
  function circlesOverlap(a, b) {
    for (const p of a) for (const q of b) if (dist(p.x, p.y, q.x, q.y) < p.r + q.r) return true;
    return false;
  }
  function circlesHitPoint(circles, x, y, r) {
    for (const p of circles) if (dist(p.x, p.y, x, y) < p.r + r) return true;
    return false;
  }
  // Recomputed once per frame; both collision and rendering read these cached values
  function updateJellyGeometry(j) {
    j.bellR = j.r * (1 + 0.06 * Math.sin(j.bob * 2));
    j.baseY = j.y + Math.sin(j.bob) * 3;
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
    const reach = cr + JELLY_TENTACLE_HALF_W;
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

  function spawnJelly() {
    const minD = offscreenDist(26 * 2.5);
    const { x, y } = spawnPointAround(minD, Math.max(SPAWN_RADIUS, minD), JELLY_SURFACE_MARGIN);
    const j = {
      x, y,
      r: rand(16, 26),
      heading: rand(0, Math.PI * 2),
      bob: rand(0, Math.PI * 2),
      hue: JELLY_HUES[Math.floor(Math.random() * JELLY_HUES.length)],
      tent: [{}, {}, {}, {}]
    };
    updateJellyGeometry(j);
    jellies.push(j);
  }

  // ---------- Seagulls (fly over the water; a leaping fish can snatch one, or get snatched) ----------
  const birds = [];
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

  // Feathers from an eaten gull: they tumble and sway down, then float on the water and fade
  const feathers = [];
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

  function resetWorld() {
    foods.length = 0;
    npcs.length = 0;
    jellies.length = 0;
    birds.length = 0;
    const fc = foodCount();
    for (let i = 0; i < fc; i++) spawnFood();
    const nc = npcCount();
    for (let i = 0; i < nc; i++) spawnNpc();
    for (let i = 0; i < JELLY_COUNT; i++) spawnJelly();
    for (let i = 0; i < BIRD_COUNT; i++) spawnBird(true);
  }

  // ---------- Particles ----------
  const particles = [];
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

  // Bubbles rise and wobble instead of decelerating like burst particles
  const bubbles = [];
  let bubbleTimer = 0;
  function spawnBubble(x, y, r) {
    bubbles.push({ x, y, r, life: rand(0.9, 1.5), maxLife: 1.5, phase: rand(0, Math.PI * 2) });
  }

  // ---------- Splashes: ballistic droplets, surface foam and entry bubbles ----------
  const drops = [];   // { x, y, vx, vy, r, g }
  const foams = [];   // { x, w, h (spray crown height), life, maxLife }
  function onScreenX(x, extent) { return Math.abs(x - player.x) < offscreenDist(extent); }
  // Other fish's splashes fade with distance from the player (half a screen away = half volume) and are
  // louder or quieter than the player's own depending on how big the fish is compared to the player
  function splashVolume(e) {
    if (e === player) return 1;
    const ref = Math.min(W, H) / (2 * currentZoom());
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
    playSplash(clamp(r / 300, 0, 1), entering, splashVolume(e), e === player);
  }

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

  // ---------- Overlay / flow ----------
  const overlay = document.getElementById('overlay');
  const panels = {
    menu: document.getElementById('menu'),
    gameOver: document.getElementById('gameOver'),
    king: document.getElementById('kingPanel')
  };
  function showPanel(name) {
    overlay.style.display = 'flex';
    for (const key in panels) panels[key].hidden = key !== name;
  }

  document.querySelectorAll('#menu .btn[data-difficulty]').forEach((btn) => {
    btn.addEventListener('click', () => startGame(btn.dataset.difficulty));
  });
  document.getElementById('againBtn').addEventListener('click', () => startGame(difficultyKey));
  document.getElementById('menuBtn').addEventListener('click', () => showPanel('menu'));
  document.getElementById('restartBtn').addEventListener('click', () => {
    fireworks.stop();
    startGame(difficultyKey);
  });
  document.getElementById('continueBtn').addEventListener('click', () => {
    fireworks.stop();
    overlay.style.display = 'none';
    resetTouches();
    player.invulnTimer = Math.max(player.invulnTimer, 1.5);
    gameState = 'playing';
  });

  // ---------- Milestone time records (per milestone and difficulty; runs with cheats never count) ----------
  const MILESTONES = {
    king: {
      storage: 'fishFrenzy.bestKingTime.',
      icon: '👑',
      title: 'You are the Sea King!',
      sub: 'You climbed all the way to the top of the food chain. Jellyfish can\'t sting you anymore — eat them!',
      epic: false
    },
    max: {
      storage: 'fishFrenzy.bestMaxTime.',
      icon: '🐋',
      title: 'Maximum size reached!',
      sub: 'You are the biggest fish in the sea — this is as big as anyone can get. From here on, eating won\'t make you any bigger.',
      epic: true
    }
  };
  function loadBest(storageKey) {
    try {
      const v = parseFloat(localStorage.getItem(storageKey));
      return isFinite(v) ? v : null;
    } catch (err) { return null; }
  }
  function saveBest(storageKey, v) {
    try { localStorage.setItem(storageKey, String(v)); } catch (err) { /* storage blocked */ }
  }

  function showMilestoneDialog(kind) {
    const m = MILESTONES[kind];
    gameState = 'paused';
    resetTouches();
    const storageKey = m.storage + difficultyKey;
    const prevBest = loadBest(storageKey);
    const isRecord = !cheated && (prevBest === null || elapsed < prevBest);
    if (isRecord) saveBest(storageKey, elapsed);
    const best = isRecord ? elapsed : prevBest;
    document.getElementById('kingIcon').textContent = m.icon;
    document.getElementById('kingTitle').textContent = m.title;
    document.getElementById('kingSub').textContent = m.sub;
    document.getElementById('kingTime').textContent = formatTime(elapsed);
    document.getElementById('kingBest').textContent = best === null ? '—' : formatTime(best);
    document.getElementById('kingDiff').textContent = difficulty.label;
    document.getElementById('kingRecord').hidden = !isRecord;
    document.getElementById('kingCheat').hidden = !cheated;
    panels.king.classList.toggle('epic', m.epic);
    showPanel('king');
    if (m.epic) {
      fireworks.start();
      playFanfare();
    }
  }

  function showBanner(text) {
    const el = document.getElementById('banner');
    el.textContent = text;
    el.style.opacity = '1';
    clearTimeout(showBanner._t);
    showBanner._t = setTimeout(() => { el.style.opacity = '0'; }, 2200);
  }

  function startGame(key) {
    enterFullscreen();
    ensureAudio();
    resetTouches();
    difficultyKey = key;
    difficulty = DIFFICULTIES[key];
    document.getElementById('difficultyName').textContent = difficulty.label;
    overlay.style.display = 'none';
    gameState = 'playing';
    elapsed = 0;
    cheated = false;
    reachedFinalStage = false;
    reachedMaxSize = false;
    lastStageIndex = 0;
    player.x = 0;
    player.y = FLOOR_Y - WATER_DEPTH / 2;
    player.air = null;
    player.heading = 0;
    player.r = BASE_R;
    player.growQueue.length = 0;
    player.turnInput = 0;
    player.boost = difficulty.boostMax;
    player.stunTimer = 0;
    player.invulnTimer = SPAWN_GRACE;
    player.alive = true;
    player.caught = false;
    particles.length = 0;
    bubbles.length = 0;
    drops.length = 0;
    foams.length = 0;
    feathers.length = 0;
    resetWorld();
  }

  function endGame(reason) {
    gameState = 'over';
    playGameOver();
    resetTouches();
    document.getElementById('gameOverTitle').textContent = '💀 ' + reason;
    document.getElementById('gameOverText').textContent =
      'Your result: ' + sizeText(player.r) + ', stage: ' + STAGES[stageIndexForR(player.r)].name + ' (' + difficulty.label + ')';
    showPanel('gameOver');
  }

  // ---------- Test cheat: digits set the player's size (1-5 = each stage, 6-9 = bigger Sea King, 0 = max size) ----------
  window.addEventListener('keydown', (e) => {
    if (gameState !== 'playing' || e.repeat) return;
    const level = parseInt(e.key, 10);
    if (!(level >= 0 && level <= 9)) return;
    cheated = true;
    player.r = CHEAT_RADII[level];
    player.growQueue.length = 0;
    // Going down lets stage-ups fire again; going up is left to update(), so the Sea King dialog can be tested
    const si = stageIndexForR(player.r);
    if (si < lastStageIndex) lastStageIndex = si;
    showBanner('Cheat: level ' + (level === 0 ? 'MAX' : level) + ' — ' + STAGES[si].name);
  });

  // ---------- NPC helpers ----------
  function npcSpeed(r) { return speedForR(r) * 0.9 * difficulty.npcSpeed; }
  // Cruising bots stay this far below the surface (their back just under it); only leaps, chases and escapes break it
  function npcSurfaceMargin(r) { return r * 0.9 + 40; }

  function updateNpc(n, dt) {
    if (n.stunTimer > 0) n.stunTimer -= dt;
    if (n.leapCooldown > 0) n.leapCooldown -= dt;
    if (n.leapTimer > 0) n.leapTimer -= dt;
    if (n.air) {
      n.wagPhase += dt * 4;
      if (updateAirborne(n, dt)) {
        // back in the water: level out on the same side and carry on
        n.mode = 'wander';
        n.leapTimer = 0;
        n.wanderTarget = n.leapDir > 0 ? 0.35 : Math.PI - 0.35;
        n.wanderTimer = rand(1, 2);
      }
      return;
    }

    // Look around for the nearest threat (bigger) and prey (smaller) among player + other npcs only once per
    // reaction interval, like a human reaction delay; in between the fish acts on what it saw last time
    n.thinkTimer -= dt;
    if (n.thinkTimer <= 0) {
      n.thinkTimer = difficulty.npcReaction * rand(1 - NPC_REACTION_SPREAD, 1 + NPC_REACTION_SPREAD);
      let threatDx = 0, threatDy = 0, threatDist = Infinity;
      let preyDx = 0, preyDy = 0, preyDist = Infinity;
      const consider = (ox, oy, or_) => {
        const d = dist(n.x, n.y, ox, oy);
        if (or_ > n.r * EAT_MARGIN && d < n.r * 9 + 90 && d < threatDist) {
          threatDist = d; threatDx = ox - n.x; threatDy = oy - n.y;
        }
        if (n.r > or_ * EAT_MARGIN && d < n.r * 7 + 70 && d < preyDist) {
          preyDist = d; preyDx = ox - n.x; preyDy = oy - n.y;
        }
      };
      if (player.alive && player.invulnTimer <= 0) consider(player.x, player.y, player.r);
      for (const other of npcs) {
        if (other === n) continue;
        consider(other.x, other.y, other.r);
      }
      if (threatDist < Infinity) n.seen = { mode: 'flee', heading: Math.atan2(-threatDy, -threatDx) };
      else if (preyDist < Infinity) n.seen = { mode: 'chase', heading: Math.atan2(preyDy, preyDx) };
      else n.seen = null;
    }
    // Imperfect flee / chase: the aim error drifts smoothly within ±npcAimError, so there's no jitter
    n.aimErrTimer -= dt;
    if (n.aimErrTimer <= 0) {
      n.aimErrTimer = rand(NPC_AIM_ERR_HOLD[0], NPC_AIM_ERR_HOLD[1]);
      n.aimErrTarget = rand(-1, 1) * difficulty.npcAimError * Math.PI / 180;
    }
    n.aimErr += (n.aimErrTarget - n.aimErr) * clamp(dt * NPC_AIM_ERR_EASE, 0, 1);

    let jellyDx = 0, jellyDy = 0, jellyDist = Infinity;
    for (const j of jellies) {
      const d = dist(n.x, n.y, j.x, j.y) - j.r - n.r;
      if (d < JELLY_AVOID_DIST && d < jellyDist) {
        jellyDist = d; jellyDx = j.x - n.x; jellyDy = j.y - n.y;
      }
    }

    let desiredHeading;
    let speedMul = 1;
    if (jellyDist < Infinity) {
      n.mode = 'avoid';
      desiredHeading = Math.atan2(-jellyDy, -jellyDx);
    } else if (n.seen) {
      n.mode = n.seen.mode;
      desiredHeading = n.seen.heading + n.aimErr;
      speedMul = n.mode === 'flee' ? 1.15 : 1.2;
    } else if (n.leapTimer > 0) {
      // a playful leap: dash steeply up at the surface
      n.mode = 'leap';
      desiredHeading = Math.atan2(-Math.sin(MAX_LEAP_ELEV), n.leapDir * Math.cos(MAX_LEAP_ELEV));
      speedMul = 1.7;
    } else {
      n.mode = 'wander';
      n.wanderTimer -= dt;
      if (n.wanderTimer <= 0) {
        n.wanderTarget = n.heading + rand(-1.4, 1.4);
        n.wanderTimer = rand(1, 2.5);
      }
      desiredHeading = n.wanderTarget;
      if (n.leapCooldown <= 0 && n.stunTimer <= 0 && n.y - SURFACE_Y < NPC_LEAP_ZONE + n.r * 1.5 &&
          Math.random() < NPC_LEAP_CHANCE * dt) {
        // enough time to reach the surface at dash speed, plus a little to line up
        n.leapTimer = (n.y - SURFACE_Y) / (npcSpeed(n.r) * 1.7 * Math.sin(MAX_LEAP_ELEV)) + 2;
        n.leapDir = Math.cos(n.heading) >= 0 ? 1 : -1;
        n.leapCooldown = rand(6, 15);
      }
    }

    // Never aim into the sea floor - bend the desired direction along/away from it instead,
    // otherwise flee/chase would keep re-aiming down every frame and the fish would vibrate in place.
    if (n.y > FLOOR_Y - NPC_FLOOR_MARGIN) {
      const dx = Math.cos(desiredHeading);
      let dy = Math.sin(desiredHeading);
      if (dy > 0) dy = -dy;
      desiredHeading = Math.atan2(dy, dx);
    }
    // Cruising fish bend away from the surface the same way
    if ((n.mode === 'wander' || n.mode === 'avoid') && n.y < SURFACE_Y + npcSurfaceMargin(n.r)) {
      const dx = Math.cos(desiredHeading);
      let dy = Math.sin(desiredHeading);
      if (dy < 0) dy = -dy;
      desiredHeading = Math.atan2(dy, dx);
      n.wanderTarget = desiredHeading;
    }

    // Turn smoothly toward the desired heading: proportional to the error (eases in, no overshoot wobble),
    // capped by the size's turn rate
    const turnRate = turnRateForR(n.r);
    n.heading += clamp(angDiff(desiredHeading, n.heading) * NPC_TURN_GAIN, -turnRate, turnRate) * dt;

    n.wagPhase += dt * (n.stunTimer > 0 ? 3 : speedMul > 1.5 ? 14 : 7);
    const sp = npcSpeed(n.r) * n.speedVar * speedMul * (n.stunTimer > 0 ? JELLY_STUN_SLOW : 1);
    n.x += Math.cos(n.heading) * sp * dt;
    n.y += Math.sin(n.heading) * sp * dt;

    if (n.y > FLOOR_Y) n.y = FLOOR_Y;
    // chases, escapes and leaps are fast enough to fly out; anything slower skims along the surface
    if (n.y < SURFACE_Y && trySurfaceLeap(n, sp, speedMul > 1.1 && n.stunTimer <= 0)) return;

    if (n.stunTimer <= 0) {
      const nc = fishCircles(n.x, n.y, n.r, n.heading);
      for (const j of jellies) {
        if (fishHitsJelly(nc, j)) {
          n.r = Math.max(5, Math.sqrt(n.r * n.r * (1 - JELLY_SHRINK)));
          n.stunTimer = JELLY_STUN_TIME;
          burst(n.x, n.y, `hsl(${j.hue},90%,72%)`, 10, 110);
          break;
        }
      }
    }
  }

  // NPCs eat food they happen to touch (they never steer toward it) and smaller NPCs their mouth reaches,
  // by the same rules as the player: mouth only, and noticeably bigger to eat a fish
  function npcsEat(dt) {
    for (let k = npcs.length - 1; k >= 0; k--) {
      const n = npcs[k];
      if (!n.air) continue;
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i];
        const hit = fishMeetsGull(n, b);
        if (!hit) continue;
        const onScreen = onScreenX(b.x, 60);
        const vol = splashVolume(n);
        if (hit === 'eaten') {
          queueGrowth(b.r * b.r * 0.55, n);
          if (onScreen) featherBurst(b.x, b.y);
          birds.splice(i, 1);
          if (onScreen) playDeadGull(vol);
        } else if (hit === 'scared') {
          if (onScreen) { featherBurst(b.x, b.y, 5); playGullScared(vol); }
        } else {
          if (onScreen) playGullCatch(vol);
          npcs.splice(k, 1);
          break;
        }
      }
    }
    for (const n of npcs) {
      applyQueuedGrowth(dt, n);
      if (n.air) continue;
      const m = [mouthCircle(n.x, n.y, n.r, n.heading)];
      const reach = n.r * (MOUTH_HIT[0] + MOUTH_HIT[1]) + FOOD_R * FOOD_AURA;
      for (let i = foods.length - 1; i >= 0; i--) {
        const f = foods[i];
        if (Math.abs(f.x - n.x) > reach || Math.abs(f.y - n.y) > reach) continue;
        if (circlesHitPoint(m, f.x, f.y, f.r * FOOD_AURA)) {
          queueGrowth(f.r * f.r, n, true);
          if (onScreenX(f.x, 20)) burst(f.x, f.y, f.color, 4, 50);
          foods.splice(i, 1);
        }
      }
    }
    for (let a = npcs.length - 1; a >= 0; a--) {
      const n = npcs[a];
      if (!n || n.air) continue;
      let m = null;
      for (let b = npcs.length - 1; b >= 0; b--) {
        const o = npcs[b];
        if (o === n || o.air || n.r <= o.r * EAT_MARGIN) continue;
        if (dist(n.x, n.y, o.x, o.y) > (n.r + o.r) * 1.7) continue;
        m = m || [mouthCircle(n.x, n.y, n.r, n.heading)];
        if (circlesOverlap(m, fishCircles(o.x, o.y, o.r, o.heading))) {
          queueGrowth(o.r * o.r * 0.55, n);
          if (onScreenX(o.x, o.r * 2)) burst(o.x, o.y, '#ff8a65', 10, 110);
          npcs.splice(b, 1);
          if (b < a) a--;
        }
      }
    }
  }

  // ---------- Update ----------
  let last = performance.now();
  function update(dt) {
    // after a gull snatched the player, keep it flying off with the catch behind the game-over panel
    if (gameState === 'over' && player.caught) for (const b of birds) if (b.leaving) updateBird(b, dt);
    if (gameState !== 'playing') return;

    elapsed += dt;
    if (player.stunTimer > 0) player.stunTimer -= dt;
    if (player.invulnTimer > 0) player.invulnTimer -= dt;

    let turnTarget = (keys['ArrowRight'] || keys['d'] ? 1 : 0) - (keys['ArrowLeft'] || keys['a'] ? 1 : 0);
    // Joystick points in the direction to swim; turn toward it proportionally
    if (joystick.id !== null && Math.hypot(joystick.dx, joystick.dy) / JOY_RADIUS > JOY_DEADZONE) {
      const want = Math.atan2(joystick.dy, joystick.dx);
      turnTarget += clamp(angDiff(want, player.heading) * 2.5, -1, 1);
    }
    turnTarget = clamp(turnTarget, -1, 1);
    // no steering in the air: the leap follows its arc
    if (player.air) turnTarget = 0;
    player.turnInput += (turnTarget - player.turnInput) * clamp(dt * 5, 0, 1);

    const wantsBoost = !player.air && (keys['ArrowUp'] || keys['w'] || keys['Control'] || isTouchBoosting()) && player.boost > 0.05 && player.stunTimer <= 0;
    player.boosting = wantsBoost;
    player.wagPhase += dt * (player.air ? 4 : wantsBoost ? 14 : 7);
    if (wantsBoost) player.boost = clamp(player.boost - dt * BOOST_DRAIN, 0, difficulty.boostMax);
    else player.boost = clamp(player.boost + dt * BOOST_REGEN * difficulty.boostRegen, 0, difficulty.boostMax);

    if (player.air) {
      updateAirborne(player, dt);
    } else {
      player.heading += player.turnInput * turnRateForR(player.r) * dt;
      const sp = speedForR(player.r) * (player.boosting ? 1.7 : 1) * (player.stunTimer > 0 ? JELLY_STUN_SLOW : 1);
      player.x += Math.cos(player.heading) * sp * dt;
      player.y += Math.sin(player.heading) * sp * dt;
      player.y = Math.min(player.y, FLOOR_Y);
      // a dash (or a fry's plain swim) is enough to fly out; otherwise the fish skims along the surface
      if (player.y < SURFACE_Y) trySurfaceLeap(player, sp, player.boosting);
    }

    if (player.boosting) {
      bubbleTimer -= dt;
      if (bubbleTimer <= 0) {
        bubbleTimer = 0.06;
        const bx = player.x - Math.cos(player.heading) * player.r * 1.2;
        const by = player.y - Math.sin(player.heading) * player.r * 1.2;
        spawnBubble(bx + rand(-3, 3), by + rand(-3, 3), rand(1.5, 3.5) + player.r * 0.04);
      }
    }

    for (const j of jellies) {
      j.bob += dt * 2;
      j.x += Math.cos(j.heading) * 14 * dt;
      j.y += Math.sin(j.heading) * 14 * dt;
      if (j.y > FLOOR_Y) { j.y = FLOOR_Y; j.heading = -j.heading; }
      if (j.y < SURFACE_Y + JELLY_SURFACE_MARGIN) { j.y = SURFACE_Y + JELLY_SURFACE_MARGIN; j.heading = -j.heading; }
      updateJellyGeometry(j);
    }

    for (const n of npcs) updateNpc(n, dt);
    npcsEat(dt);

    // Recycle entities that drifted too far in this infinite world, and keep counts topped up nearby
    // Cull distances never drop below "fully off-screen + margin", or zoomed-out views on big screens
    // would see things vanish (and spawn/cull would fight each other)
    const foodCull = Math.max(CULL_DIST, offscreenDist(10) + 300);
    for (let i = foods.length - 1; i >= 0; i--) if (dist(player.x, player.y, foods[i].x, foods[i].y) > foodCull) foods.splice(i, 1);
    const npcCull = npcCullDist();
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
    const jellyCull = Math.max(CULL_DIST, offscreenDist(26 * 2.5) + 600);
    for (let i = jellies.length - 1; i >= 0; i--) if (dist(player.x, player.y, jellies[i].x, jellies[i].y) > jellyCull) jellies.splice(i, 1);
    const fc = foodCount();
    while (foods.length < fc) spawnFood();
    while (npcs.length < npcCount()) spawnNpc();
    while (jellies.length < JELLY_COUNT) spawnJelly();
    for (const b of birds) updateBird(b, dt);
    for (let i = birds.length - 1; i >= 0; i--) {
      if (Math.abs(birds[i].x - player.x) > birdCull() || birds[i].h > BIRD_LEAVE_H) birds.splice(i, 1);
    }
    while (birds.length < BIRD_COUNT) spawnBird(false);

    applyQueuedGrowth(dt);

    // Player eats food (mouth only)
    const pm = [mouthCircle(player.x, player.y, player.r, player.heading)];

    // Leaping at gulls: a fry gets snatched, a small fish knocks the gull away, anything bigger eats it
    if (player.air) {
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i];
        const hit = fishMeetsGull(player, b);
        if (hit === 'eaten') {
          queueGrowth(b.r * b.r * 0.55);
          featherBurst(b.x, b.y);
          birds.splice(i, 1);
          playDeadGull();
          showBanner('🐦 Gull snack!');
        } else if (hit === 'scared') {
          featherBurst(b.x, b.y, 5);
          playGullScared();
          showBanner('🐦 Shoo! The gull flew off');
        } else if (hit === 'caught') {
          player.alive = false;
          player.caught = true;
          playGullCatch();
          endGame('A seagull got you!');
          return;
        }
      }
    }
    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      f.bob += dt * 3;
      // the mouth only has to reach the food's glow, not the tiny core
      if (circlesHitPoint(pm, f.x, f.y, f.r * FOOD_AURA)) {
        queueGrowth(f.r * f.r, player, true);
        burst(f.x, f.y, f.color, 6, 60);
        foods.splice(i, 1);
        playEatSmall();
      }
    }

    // Player vs npc: the bigger fish eats only when its mouth reaches any part of the smaller one,
    // so trailing right behind a big fish's tail is safe until it turns around
    let pc = fishCircles(player.x, player.y, player.r, player.heading);
    for (let i = npcs.length - 1; i >= 0; i--) {
      const n = npcs[i];
      // cheap bounding check before the exact shape test (tail reaches ~1.6r behind the center)
      if (dist(player.x, player.y, n.x, n.y) > (player.r + n.r) * 1.7) continue;
      if (player.r > n.r * EAT_MARGIN) {
        if (circlesOverlap(pm, fishCircles(n.x, n.y, n.r, n.heading))) {
          queueGrowth(n.r * n.r * 0.55);
          burst(n.x, n.y, '#ff8a65', 14, 140);
          npcs.splice(i, 1);
          playEatBig();
        }
      } else if (n.r > player.r * EAT_MARGIN && player.invulnTimer <= 0) {
        if (circlesOverlap([mouthCircle(n.x, n.y, n.r, n.heading)], pc)) {
          burst(player.x, player.y, '#ef5350', 24, 200);
          player.alive = false;
          endGame('You got eaten!');
          return;
        }
      }
      // similar sizes just pass each other with no effect
    }

    // Player vs jellyfish: a hazard, until the Sea King can simply eat them (mouth only, no stings)
    const isKing = stageIndexForR(player.r) === STAGES.length - 1;
    pc = fishCircles(player.x, player.y, player.r, player.heading);
    for (let i = jellies.length - 1; i >= 0; i--) {
      const j = jellies[i];
      if (isKing) {
        if (fishHitsJelly(pm, j)) {
          queueGrowth(j.r * j.r * 0.3);
          burst(j.x, j.baseY, `hsl(${j.hue},90%,72%)`, 16, 140);
          jellies.splice(i, 1);
          playEatBig();
        }
      } else if (player.stunTimer <= 0 && fishHitsJelly(pc, j)) {
        growPlayer(-playerArea() * JELLY_SHRINK, 1);
        player.r = Math.max(BASE_R * 0.6, player.r);
        player.stunTimer = JELLY_STUN_TIME;
        burst(player.x, player.y, `hsl(${j.hue},90%,72%)`, 16, 140);
        playSting();
      }
    }

    const afterStage = stageIndexForR(player.r);
    if (afterStage > lastStageIndex) {
      lastStageIndex = afterStage;
      playLevelUp();
      if (afterStage === STAGES.length - 1 && !reachedFinalStage) {
        reachedFinalStage = true;
        showMilestoneDialog('king');
      } else {
        showBanner('New stage: ' + STAGES[afterStage].name + '!');
      }
    }
    if (gameState === 'playing' && !reachedMaxSize && player.r >= MAX_R) {
      reachedMaxSize = true;
      player.growQueue.length = 0;
      showMilestoneDialog('max');
    }

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
        f.y = SURFACE_Y + surfaceWave(f.x, performance.now() / 1000);  // bobbing on the swell
        f.rot += Math.sin(f.phase) * 0.3 * dt;
      }
    }
    for (let i = foams.length - 1; i >= 0; i--) {
      foams[i].life -= dt;
      if (foams[i].life <= 0) foams.splice(i, 1);
    }

    document.getElementById('sizeText').textContent = sizeText(player.r);
    const si = stageIndexForR(player.r);
    const stage = STAGES[si];
    document.getElementById('stageName').textContent = stage.name;
    const prevMax = si > 0 ? STAGES[si - 1].maxR : 0;
    // In the last stage the bar tracks progress toward the size cap instead
    const stageTop = stage.maxR === Infinity ? MAX_R : stage.maxR;
    const growFrac = clamp((player.r - prevMax) / (stageTop - prevMax), 0, 1);
    document.getElementById('growBar').style.width = (growFrac * 100) + '%';
    document.getElementById('growLabel').textContent =
      player.r >= MAX_R ? 'Maximum size' : stage.maxR === Infinity ? 'Growth to max size' : 'Growth to next stage';
    document.getElementById('boostBar').style.width = (player.boost / difficulty.boostMax * 100) + '%';
    document.getElementById('depthBar').style.width = (depthFrac(player.y) * 100) + '%';
  }

  // ---------- Rendering ----------
  // Body and tail as one closed outline; the tail tips swing around the tail joint by `wag` radians
  function fishBodyPath(r, wag) {
    const jx = -0.85 * r;
    const cw = Math.cos(wag), sw = Math.sin(wag);
    const tp = (x, y) => { const dx = x - jx; return [jx + dx * cw - y * sw, dx * sw + y * cw]; };
    let a, b;
    ctx.beginPath();
    ctx.moveTo(jx, -0.16 * r);
    // back, rounded snout, belly
    ctx.bezierCurveTo(-0.4 * r, -0.68 * r, 0.45 * r, -0.72 * r, 0.82 * r, -0.32 * r);
    ctx.bezierCurveTo(1.04 * r, -0.12 * r, 1.04 * r, 0.16 * r, 0.82 * r, 0.34 * r);
    ctx.bezierCurveTo(0.45 * r, 0.72 * r, -0.4 * r, 0.68 * r, jx, 0.16 * r);
    // tail: lower lobe, notch, upper lobe
    a = tp(-1.2 * r, 0.28 * r); b = tp(-1.78 * r, 0.72 * r);
    ctx.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    a = tp(-1.58 * r, 0.22 * r); b = tp(-1.46 * r, 0);
    ctx.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    a = tp(-1.58 * r, -0.22 * r); b = tp(-1.78 * r, -0.72 * r);
    ctx.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    a = tp(-1.2 * r, -0.28 * r);
    ctx.quadraticCurveTo(a[0], a[1], jx, -0.16 * r);
    ctx.closePath();
  }

  function drawFish(sx, sy, r, heading, color, z, outline, wagPhase, chomp = 0) {
    const wag = Math.sin(wagPhase) * 0.22;
    // Mirror vertically when swimming left so the belly stays down; squash near vertical for a rolling look
    const roll = clamp(Math.cos(heading) * 3, -1, 1);
    const flip = (roll < 0 ? -1 : 1) * Math.max(0.72, Math.abs(roll));
    const finColor = shade(color, -0.3);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(heading);
    ctx.scale(z, z * flip);

    // dorsal and ventral fins, behind the body
    ctx.fillStyle = finColor;
    ctx.beginPath();
    // fins ripple with the swim stroke, lagging a little behind the tail
    const dorsal = Math.sin(wagPhase - 0.8);
    const ventral = Math.sin(wagPhase - 1.6);
    ctx.moveTo(0.3 * r, -0.5 * r);
    ctx.quadraticCurveTo((-0.05 + dorsal * 0.06) * r, (-1.05 - dorsal * 0.05) * r, (-0.6 + dorsal * 0.1) * r, (-0.9 + Math.abs(dorsal) * 0.06) * r);
    ctx.quadraticCurveTo(-0.5 * r, -0.65 * r, -0.5 * r, -0.4 * r);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.05 * r, 0.52 * r);
    ctx.quadraticCurveTo((-0.3 + ventral * 0.06) * r, (0.9 + ventral * 0.05) * r, (-0.55 + ventral * 0.1) * r, (0.78 - Math.abs(ventral) * 0.06) * r);
    ctx.quadraticCurveTo(-0.5 * r, 0.6 * r, -0.48 * r, 0.42 * r);
    ctx.closePath();
    ctx.fill();

    // body + tail: dark back, light belly
    const g = ctx.createLinearGradient(0, -0.7 * r, 0, 0.7 * r);
    g.addColorStop(0, shade(color, -0.35));
    g.addColorStop(0.45, color);
    g.addColorStop(1, shade(color, 0.55));
    fishBodyPath(r, wag);
    ctx.fillStyle = g;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = clamp(2.5 / z, 1, 6) / 1.5;
      ctx.stroke();
    }

    // soft gloss along the back
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.ellipse(0.05 * r, -0.36 * r, 0.5 * r, 0.12 * r, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // gill line
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = Math.max(0.8, r * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0.18 * r, 0, 0.42 * r, -0.85, 0.85);
    ctx.stroke();

    // mouth; while biting, a dark wedge opens into the snout (clipped to the body outline)
    if (chomp > 0.02) {
      ctx.save();
      fishBodyPath(r, wag);
      ctx.clip();
      ctx.fillStyle = '#3b1219';
      ctx.beginPath();
      ctx.moveTo(0.6 * r, 0.1 * r);
      ctx.lineTo(1.15 * r, (0.1 - 0.34 * chomp) * r);
      ctx.lineTo(1.15 * r, (0.1 + 0.28 * chomp) * r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(0.7, r * 0.04);
    ctx.beginPath();
    ctx.arc(0.8 * r, 0.1 * r, 0.12 * r, 0.3, 1.5);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // pectoral fin, over the body: flaps around its base, rowing slightly out of phase with the tail
    ctx.save();
    ctx.translate(0.22 * r, 0.14 * r);
    ctx.rotate(Math.sin(wagPhase * 0.9 + 1.2) * 0.35);
    ctx.fillStyle = shade(color, 0.25);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0.06 * r, 0);
    ctx.quadraticCurveTo(-0.2 * r, 0.46 * r, -0.47 * r, 0.32 * r);
    ctx.quadraticCurveTo(-0.24 * r, 0.16 * r, -0.12 * r, -0.04 * r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // eye
    const eyeR = Math.max(1.2, r * 0.15);
    const ex = 0.56 * r, ey = -0.16 * r;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10202b';
    ctx.beginPath();
    ctx.arc(ex + eyeR * 0.25, ey, eyeR * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(ex + eyeR * 0.05, ey - eyeR * 0.3, eyeR * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawTouchControls() {
    if (!isCoarsePointer || gameState !== 'playing') return;

    // Zone hint while the spawn grace is active
    if (player.invulnTimer > 0) {
      const a = clamp(player.invulnTimer / SPAWN_GRACE, 0, 1);
      const splitX = W * STEER_ZONE_FRAC;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 18px Segoe UI, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drag to steer', splitX / 2, H - 40);
      ctx.fillText('Hold to dash', splitX + (W - splitX) / 2, H - 40);
      ctx.restore();
    }

    if (joystick.id !== null) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(joystick.baseX, joystick.baseY, JOY_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(joystick.baseX + joystick.dx, joystick.baseY + joystick.dy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function render() {
    const z = currentZoom();
    const stage = STAGES[stageIndexForR(player.r)];
    const df = depthFrac(player.y);

    const cam = { x: player.x, y: player.y, z, floorY: FLOOR_Y, surfaceY: SURFACE_Y, df, t: performance.now() / 1000, W, H };
    drawSky(ctx, cam);
    drawWater(ctx, cam);
    drawHills(ctx, cam);
    drawSeabed(ctx, cam);

    // food, with a soft glow that shows up in darker water
    for (const f of foods) {
      const p = worldToScreen(f.x, f.y);
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      const r = f.r * z * (1 + Math.sin(f.bob) * 0.15);
      ctx.globalAlpha = 0.12 + 0.2 * df;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * FOOD_AURA, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const j of jellies) drawJelly(j, z, df);
    for (const b of birds) drawBird(b, z);

    // npc fish, with danger/prey outline for readability
    for (const n of npcs) {
      const p = worldToScreen(n.x, n.y);
      const rr = n.r * z * 2;
      if (p.x < -rr || p.x > W + rr || p.y < -rr || p.y > H + rr) continue;
      const color = STAGES[stageIndexForR(n.r)].color;
      let outline = 'rgba(255,255,255,0.35)';
      if (player.r > n.r * EAT_MARGIN) outline = '#69f0ae';
      else if (n.r > player.r * EAT_MARGIN) outline = '#ff5252';
      drawFish(p.x, p.y, n.r, n.heading, color, z, outline, n.wagPhase, chompOpen(n));
    }

    // player
    const pp = worldToScreen(player.x, player.y);
    if (player.invulnTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(performance.now() / 120) * 0.2;
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, (player.r + 8) * z, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // a player snatched by a gull is drawn in its beak instead
    if (!player.caught) drawFish(pp.x, pp.y, player.r, player.heading, stage.color, z, player.stunTimer > 0 ? '#f06292' : 'rgba(255,255,255,0.6)', player.wagPhase, chompOpen(player));

    // the surface film goes over the fish, so anything half out of the water reads as crossing it
    drawSurface(ctx, cam, foams);
    drawFeathers(z);

    // splash droplets: short streaks along their motion
    ctx.lineCap = 'round';
    for (const d of drops) {
      const p = worldToScreen(d.x, d.y);
      if (p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) continue;
      const R = Math.max(0.8, d.r * z);
      const tx = p.x - d.vx * 0.018 * z, ty = p.y - d.vy * 0.018 * z;
      // a thin blue rim keeps the drops readable against the pale sky
      ctx.strokeStyle = 'rgba(70,150,200,0.45)';
      ctx.lineWidth = R * 2 + 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(225,246,255,0.95)';
      ctx.lineWidth = R * 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(p.x - R * 0.3, p.y - R * 0.3, R * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineCap = 'butt';

    // particles
    for (const pt of particles) {
      const p = worldToScreen(pt.x, pt.y);
      ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pt.r * z, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // bubbles
    ctx.lineWidth = 1;
    for (const b of bubbles) {
      const p = worldToScreen(b.x, b.y);
      const a = clamp(b.life / b.maxLife, 0, 1);
      const R = b.r * z;
      ctx.strokeStyle = `rgba(220,245,255,${0.7 * a})`;
      ctx.fillStyle = `rgba(220,245,255,${0.12 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`;
      ctx.beginPath();
      ctx.arc(p.x - R * 0.35, p.y - R * 0.35, R * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    if (player.stunTimer > 0) {
      ctx.fillStyle = `rgba(240,98,146,${clamp(player.stunTimer / 1.2, 0, 1) * 0.25})`;
      ctx.fillRect(0, 0, W, H);
    }

    drawVignette(ctx, cam);
    drawTouchControls();
  }

  // Side-view seagull: white body and head, grey wings with black tips, yellow beak
  function drawBird(b, z) {
    const p = worldToScreen(b.x, b.y);
    const R = b.r * z * BIRD_DRAW_SCALE;
    if (p.x < -R * 4 || p.x > W + R * 4 || p.y < -R * 4 || p.y > H + R * 4) return;
    const u = b.glide > 0 ? 0.15 : Math.sin(b.flap);  // wing up (+1) .. down (-1)
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(b.vx < 0 ? -R : R, R);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.2 / R;
    ctx.strokeStyle = 'rgba(40,52,64,0.55)';

    const wing = (lift, color) => {
      const ex = -0.3, ey = -0.2 - 1.3 * lift;
      const tx = -1.3, ty = -0.4 - 2.3 * lift;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0.45, -0.25);
      ctx.quadraticCurveTo(0.1, ey - 0.15, ex, ey);
      ctx.lineTo(tx, ty);
      ctx.quadraticCurveTo(-0.6, ey + 0.35, -0.45, -0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // black wingtip
      ctx.fillStyle = '#26303a';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(lerp(ex, tx, 0.6), lerp(ey, ty, 0.6) - 0.12);
      ctx.lineTo(lerp(ex, tx, 0.62), lerp(ey, ty, 0.62) + 0.18);
      ctx.closePath();
      ctx.fill();
    };
    wing(u * 0.85, '#8e9aa6');  // far wing, behind the body

    // tail
    ctx.fillStyle = '#e8edf1';
    ctx.beginPath();
    ctx.moveTo(-0.9, -0.15);
    ctx.lineTo(-1.8, -0.3);
    ctx.lineTo(-1.75, 0.12);
    ctx.lineTo(-0.9, 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // body and head
    const g = ctx.createLinearGradient(0, -0.5, 0, 0.45);
    g.addColorStop(0, '#dfe5ea');
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.1, 0.45, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(1.0, -0.38, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // beak with the gull's red spot, and the eye
    ctx.fillStyle = '#f6c343';
    ctx.beginPath();
    ctx.moveTo(1.3, -0.46);
    ctx.lineTo(1.85, -0.34);
    ctx.lineTo(1.3, -0.24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0453a';
    ctx.beginPath();
    ctx.arc(1.62, -0.31, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b232b';
    ctx.beginPath();
    ctx.arc(1.1, -0.47, 0.07, 0, Math.PI * 2);
    ctx.fill();

    wing(u, '#b7c2cc');  // near wing, over the body
    ctx.restore();
    // a caught fish dangles from the beak, head up, tail wriggling
    if (b.carry) {
      const dir = b.vx < 0 ? -1 : 1;
      const fz = b.carry.r * z;
      drawFish(p.x + dir * 1.6 * R, p.y - 0.3 * R + 0.72 * fz, b.carry.r, -Math.PI / 2 + dir * 0.25, b.carry.color, z,
        'rgba(255,255,255,0.6)', b.carry.wagPhase);
    }
  }

  function drawFeathers(z) {
    for (const f of feathers) {
      const p = worldToScreen(f.x, f.y);
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      const L = f.len * z;
      ctx.save();
      ctx.globalAlpha = clamp(f.life, 0, 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(f.rot);
      ctx.fillStyle = f.grey ? '#aab4be' : '#f7f9fb';
      ctx.strokeStyle = 'rgba(60,70,80,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, L, L * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-L * 1.2, 0);
      ctx.lineTo(L, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Drawn from the same cached geometry that circleHitsJelly() tests against
  function drawJelly(j, z, df) {
    const p = worldToScreen(j.x, j.baseY);
    const R = j.bellR * z;
    if (p.x < -R * 3 || p.x > W + R * 3 || p.y < -R * 3 || p.y > H + R * 3) return;
    const h = j.hue;

    // glow, stronger in dark water
    const halo = ctx.createRadialGradient(p.x, p.y - R * 0.3, R * 0.2, p.x, p.y - R * 0.3, R * 2.2);
    halo.addColorStop(0, `hsla(${h},90%,70%,${0.1 + 0.25 * df})`);
    halo.addColorStop(1, `hsla(${h},90%,70%,0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(p.x - R * 2.2, p.y - R * 2.5, R * 4.4, R * 4.4);

    // tentacles, behind the bell
    ctx.strokeStyle = `hsla(${h},85%,78%,0.75)`;
    ctx.lineWidth = JELLY_TENTACLE_HALF_W * 2 * z;
    ctx.lineCap = 'round';
    for (const t of j.tent) {
      const a = worldToScreen(t.x0, t.y0), c = worldToScreen(t.cx, t.cy), b = worldToScreen(t.x2, t.y2);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // bell with a scalloped rim
    const g = ctx.createRadialGradient(p.x - R * 0.25, p.y - R * 0.7, R * 0.1, p.x, p.y - R * 0.3, R * 1.1);
    g.addColorStop(0, `hsla(${h},100%,93%,0.92)`);
    g.addColorStop(0.5, `hsla(${h},85%,72%,0.62)`);
    g.addColorStop(1, `hsla(${h},80%,55%,0.45)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, Math.PI, 0);
    const sc = 5;
    for (let k = 0; k < sc; k++) {
      const x1 = p.x + R - (k * 2 * R) / sc, x2 = p.x + R - ((k + 1) * 2 * R) / sc;
      ctx.quadraticCurveTo((x1 + x2) / 2, p.y + R * 0.14, x2, p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `hsla(${h},95%,88%,0.8)`;
    ctx.lineWidth = Math.max(1, 1.3 * z);
    ctx.stroke();

    // inner glow and a highlight
    ctx.fillStyle = `hsla(${h},100%,90%,0.45)`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - R * 0.36, R * 0.38, R * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1, 1.6 * z);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(p.x, p.y, R * 0.74, Math.PI * 1.15, Math.PI * 1.42);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  const frameDue = frameLimiter();
  function loop(now) {
    requestAnimationFrame(loop);
    if (!frameDue(now)) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    render();
  }
  requestAnimationFrame(loop);
})();
