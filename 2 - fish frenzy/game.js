'use strict';

(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- Difficulty ----------
  const DIFFICULTIES = {
    easy:   { label: 'Easy',   food: 1.2, npcSpeed: 0.9, boostMax: 1.5,  boostRegen: 1.5 },
    medium: { label: 'Medium', food: 1.0, npcSpeed: 1.0, boostMax: 1.0,  boostRegen: 1.0 },
    hard:   { label: 'Hard',   food: 0.8, npcSpeed: 1.1, boostMax: 0.75, boostRegen: 0.75 }
  };
  let difficultyKey = 'medium';
  let difficulty = DIFFICULTIES[difficultyKey];

  // ---------- World (infinite in x and upward; a hard sea floor is the only boundary) ----------
  const FLOOR_Y = 3000;          // world y of the sea floor; nothing can go below it
  const DEPTH_RANGE = 1600;      // how many world units above the floor the depth gradient spans
  const SPAWN_RADIUS = 1400;     // entities are kept populated within this radius of the player
  const CULL_DIST = 2000;        // entities farther than this are recycled back near the player
  const NPC_FLOOR_MARGIN = 60;   // bots start steering away from the floor this far above it

  // depthFrac: 1 = right at the sea floor (dark, small fish, lots of food), 0 = shallow/high up (light, big rivals)
  function depthFrac(y) { return clamp((y - (FLOOR_Y - DEPTH_RANGE)) / DEPTH_RANGE, 0, 1); }

  // ---------- Stages (size tiers, shared by player and NPCs for readability) ----------
  const STAGES = [
    { name: 'Fry',          maxR: 25,       color: '#ffd54f' },
    { name: 'Small Fish',   maxR: 45,       color: '#4fc3f7' },
    { name: 'Big Fish',     maxR: 75,       color: '#66bb6a' },
    { name: 'Shark',        maxR: 120,      color: '#90a4ae' },
    { name: 'Sea King',     maxR: Infinity, color: '#ba68c8' }
  ];
  function stageIndexForR(r) {
    for (let i = 0; i < STAGES.length; i++) if (r <= STAGES[i].maxR) return i;
    return STAGES.length - 1;
  }

  const EAT_MARGIN = 1.15; // must be this much bigger (in radius) to eat / be eaten

  // ---------- Player ----------
  const BASE_R = 14;
  const BOOST_DRAIN = 0.6;
  const BOOST_REGEN = 0.25;
  const player = {
    x: 0, y: FLOOR_Y - DEPTH_RANGE / 2,
    heading: 0,
    r: BASE_R,
    turnInput: 0,
    boost: 1,       // stamina 0..difficulty.boostMax
    boosting: false,
    wagPhase: 0,
    stunTimer: 0,
    invulnTimer: 0,
    alive: true
  };
  const SPAWN_GRACE = 2.5;

  function playerArea() { return player.r * player.r; }
  function growPlayer(area, eff) {
    const newArea = playerArea() + area * eff;
    player.r = Math.sqrt(newArea);
  }

  function speedForR(r) { return clamp(150 - (r - BASE_R) * 0.35, 58, 150); }
  function turnRateForR(r) { return clamp(2.6 - (r - BASE_R) * 0.011, 0.8, 2.6); }

  // ---------- Camera ----------
  function currentZoom() { return clamp(1.15 - (player.r - BASE_R) / 220, 0.5, 1.15); }
  function worldToScreen(wx, wy) {
    const z = currentZoom();
    return { x: (wx - player.x) * z + W / 2, y: (wy - player.y) * z + H / 2, z };
  }
  // Keep spawns (bots, jellyfish) safely outside the visible screen, not just outside a fixed world radius
  function minSpawnDist() {
    return clamp(Math.hypot(W, H) / (2 * currentZoom()) + 120, 400, SPAWN_RADIUS * 0.85);
  }

  // ---------- Game state ----------
  let score = 0;
  let gameState = 'start'; // start | playing | paused | over
  let elapsed = 0;         // in-game seconds for the current run (pauses don't count)
  let cheated = false;
  let reachedFinalStage = false;
  let lastStageIndex = 0;

  // ---------- Food ----------
  const foods = [];
  const FOOD_COUNT = 130;
  const FOOD_R = 3.2;
  function foodCount() { return Math.round(FOOD_COUNT * difficulty.food); }
  function spawnFood() {
    let x, y, tries = 0;
    do {
      x = player.x + rand(-SPAWN_RADIUS, SPAWN_RADIUS);
      y = Math.min(player.y + rand(-SPAWN_RADIUS, SPAWN_RADIUS), FLOOR_Y);
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
  const NPC_COUNT = 24;
  function pickNpcRadius(y) {
    const roll = Math.random();
    let base;
    if (roll < 0.55) base = player.r * rand(0.28, 0.9);       // prey
    else if (roll < 0.8) base = player.r * rand(0.9, 1.15);   // neutral
    else base = player.r * rand(1.15, 1.9);                  // threat
    // near the floor, fish skew much smaller; higher up, they skew much bigger
    const depthMul = lerp(2.1, 0.45, depthFrac(y));
    return clamp(base * depthMul, 5, 600);
  }
  function spawnNpc() {
    let x, y, tries = 0;
    const minDist = minSpawnDist();
    do {
      x = player.x + rand(-SPAWN_RADIUS, SPAWN_RADIUS);
      y = Math.min(player.y + rand(-SPAWN_RADIUS, SPAWN_RADIUS), FLOOR_Y);
      tries++;
    } while (dist(x, y, player.x, player.y) < minDist && tries < 20);
    const heading = rand(0, Math.PI * 2);
    npcs.push({
      x, y,
      r: pickNpcRadius(y),
      heading,
      wanderTarget: heading,
      wanderTimer: rand(0.5, 2),
      mode: 'wander',
      stunTimer: 0,
      wagPhase: rand(0, Math.PI * 2),
      hue: Math.random()
    });
  }

  // ---------- Jellyfish (hazard, not lethal) ----------
  const jellies = [];
  const JELLY_COUNT = 7;
  const JELLY_SHRINK = 0.1;      // fraction of area lost per sting
  const JELLY_STUN_TIME = 1.2;
  const JELLY_STUN_SLOW = 0.4;
  const JELLY_AVOID_DIST = 45;   // gap (edge to edge) at which fish start steering away
  const JELLY_TENTACLE_HALF_W = 1.5;

  // ---------- Hit shapes (match what drawFish / the jellyfish renderer actually draw) ----------
  // Fish: circles along the body axis, [offset along heading, radius], both in units of r
  const FISH_HIT = [[0.6, 0.33], [0.15, 0.45], [-0.45, 0.34], [-1.3, 0.28]];
  function fishCircles(x, y, r, heading) {
    const c = Math.cos(heading), s = Math.sin(heading);
    return FISH_HIT.map(([o, cr]) => ({ x: x + c * o * r, y: y + s * o * r, r: cr * r }));
  }
  function circlesOverlap(a, b) {
    for (const p of a) for (const q of b) if (dist(p.x, p.y, q.x, q.y) < p.r + q.r) return true;
    return false;
  }
  function circlesHitPoint(circles, x, y, r) {
    for (const p of circles) if (dist(p.x, p.y, x, y) < p.r + r) return true;
    return false;
  }
  function jellyBobY(j) { return Math.sin(j.bob) * 3; }
  function jellyTentacle(j, i) {
    const x1 = j.x + i * 0.5 * j.r, y1 = j.y + jellyBobY(j);
    return { x1, y1, x2: x1 + Math.sin(j.bob + i) * 0.2 * j.r, y2: y1 + 1.1 * j.r };
  }
  // Jellyfish = a half-disk bell (flat side down) plus three tentacle segments
  function circleHitsJelly(cx, cy, cr, j) {
    const px = cx - j.x, py = cy - (j.y + jellyBobY(j));
    const bellDist = py <= 0 ? Math.hypot(px, py) - j.r : distToSegment(px, py, -j.r, 0, j.r, 0);
    if (bellDist < cr) return true;
    for (let i = -1; i <= 1; i++) {
      const t = jellyTentacle(j, i);
      if (distToSegment(cx, cy, t.x1, t.y1, t.x2, t.y2) < cr + JELLY_TENTACLE_HALF_W) return true;
    }
    return false;
  }
  function fishHitsJelly(circles, j) {
    for (const c of circles) if (circleHitsJelly(c.x, c.y, c.r, j)) return true;
    return false;
  }

  function spawnJelly() {
    let x, y, tries = 0;
    const minDist = minSpawnDist();
    do {
      x = player.x + rand(-SPAWN_RADIUS, SPAWN_RADIUS);
      y = Math.min(player.y + rand(-SPAWN_RADIUS, SPAWN_RADIUS), FLOOR_Y);
      tries++;
    } while (dist(x, y, player.x, player.y) < minDist && tries < 20);
    jellies.push({
      x, y,
      r: rand(16, 26),
      heading: rand(0, Math.PI * 2),
      bob: rand(0, Math.PI * 2)
    });
  }

  function resetWorld() {
    foods.length = 0;
    npcs.length = 0;
    jellies.length = 0;
    const fc = foodCount();
    for (let i = 0; i < fc; i++) spawnFood();
    for (let i = 0; i < NPC_COUNT; i++) spawnNpc();
    for (let i = 0; i < JELLY_COUNT; i++) spawnJelly();
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
  document.getElementById('restartBtn').addEventListener('click', () => startGame(difficultyKey));
  document.getElementById('continueBtn').addEventListener('click', () => {
    overlay.style.display = 'none';
    resetTouches();
    player.invulnTimer = Math.max(player.invulnTimer, 1.5);
    gameState = 'playing';
  });

  // ---------- Sea King time records (per difficulty; runs with cheats never count) ----------
  function bestKey(key) { return 'fishFrenzy.bestKingTime.' + key; }
  function loadBest(key) {
    try {
      const v = parseFloat(localStorage.getItem(bestKey(key)));
      return isFinite(v) ? v : null;
    } catch (err) { return null; }
  }
  function saveBest(key, v) {
    try { localStorage.setItem(bestKey(key), String(v)); } catch (err) { /* storage blocked */ }
  }

  function showKingDialog() {
    gameState = 'paused';
    resetTouches();
    const prevBest = loadBest(difficultyKey);
    const isRecord = !cheated && (prevBest === null || elapsed < prevBest);
    if (isRecord) saveBest(difficultyKey, elapsed);
    const best = isRecord ? elapsed : prevBest;
    document.getElementById('kingTime').textContent = formatTime(elapsed);
    document.getElementById('kingBest').textContent = best === null ? '—' : formatTime(best);
    document.getElementById('kingDiff').textContent = difficulty.label;
    document.getElementById('kingRecord').hidden = !isRecord;
    document.getElementById('kingCheat').hidden = !cheated;
    showPanel('king');
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
    score = 0;
    reachedFinalStage = false;
    lastStageIndex = 0;
    player.x = 0;
    player.y = FLOOR_Y - DEPTH_RANGE / 2;
    player.heading = 0;
    player.r = BASE_R;
    player.turnInput = 0;
    player.boost = difficulty.boostMax;
    player.stunTimer = 0;
    player.invulnTimer = SPAWN_GRACE;
    player.alive = true;
    particles.length = 0;
    resetWorld();
  }

  function endGame(reason) {
    gameState = 'over';
    playGameOver();
    resetTouches();
    document.getElementById('gameOverTitle').textContent = '💀 ' + reason;
    document.getElementById('gameOverText').textContent =
      'Your result: ' + score + ' points, stage: ' + STAGES[stageIndexForR(player.r)].name + ' (' + difficulty.label + ')';
    showPanel('gameOver');
  }

  // ---------- Test cheat: digits 1-9 set the player's size (1-5 = each stage, 6-9 = bigger Sea King) ----------
  const CHEAT_RADII = [BASE_R, 30, 55, 95, 130, 180, 240, 320, 420];
  window.addEventListener('keydown', (e) => {
    if (gameState !== 'playing' || e.repeat) return;
    const level = parseInt(e.key, 10);
    if (!(level >= 1 && level <= 9)) return;
    cheated = true;
    player.r = CHEAT_RADII[level - 1];
    // Going down lets stage-ups fire again; going up is left to update(), so the Sea King dialog can be tested
    const si = stageIndexForR(player.r);
    if (si < lastStageIndex) lastStageIndex = si;
    showBanner('Cheat: level ' + level + ' — ' + STAGES[si].name);
  });

  // ---------- NPC helpers ----------
  function npcSpeed(r) { return speedForR(r) * 0.9 * difficulty.npcSpeed; }

  function updateNpc(n, dt) {
    // Find nearest threat (bigger) and nearest prey (smaller) among player + other npcs
    let threatDx = 0, threatDy = 0, threatDist = Infinity;
    let preyDx = 0, preyDy = 0, preyDist = Infinity;

    function consider(ox, oy, or_) {
      const d = dist(n.x, n.y, ox, oy);
      if (or_ > n.r * EAT_MARGIN && d < n.r * 9 + 90 && d < threatDist) {
        threatDist = d; threatDx = ox - n.x; threatDy = oy - n.y;
      }
      if (n.r > or_ * EAT_MARGIN && d < n.r * 7 + 70 && d < preyDist) {
        preyDist = d; preyDx = ox - n.x; preyDy = oy - n.y;
      }
    }
    if (player.alive && player.invulnTimer <= 0) consider(player.x, player.y, player.r);
    for (const other of npcs) {
      if (other === n) continue;
      consider(other.x, other.y, other.r);
    }

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
    } else if (threatDist < Infinity) {
      n.mode = 'flee';
      desiredHeading = Math.atan2(-threatDy, -threatDx);
      speedMul = 1.15;
    } else if (preyDist < Infinity) {
      n.mode = 'chase';
      desiredHeading = Math.atan2(preyDy, preyDx);
      speedMul = 1.2;
    } else {
      n.mode = 'wander';
      n.wanderTimer -= dt;
      if (n.wanderTimer <= 0) {
        n.wanderTarget = n.heading + rand(-1.4, 1.4);
        n.wanderTimer = rand(1, 2.5);
      }
      desiredHeading = n.wanderTarget;
    }

    // Never aim into the sea floor - bend the desired direction along/away from it instead,
    // otherwise flee/chase would keep re-aiming down every frame and the fish would vibrate in place.
    if (n.y > FLOOR_Y - NPC_FLOOR_MARGIN) {
      const dx = Math.cos(desiredHeading);
      let dy = Math.sin(desiredHeading);
      if (dy > 0) dy = -dy;
      desiredHeading = Math.atan2(dy, dx);
    }

    // Turn smoothly toward the desired heading instead of snapping to it every frame
    const turnRate = turnRateForR(n.r);
    n.heading += clamp(angDiff(desiredHeading, n.heading), -turnRate * dt, turnRate * dt);

    if (n.stunTimer > 0) n.stunTimer -= dt;
    n.wagPhase += dt * (n.stunTimer > 0 ? 3 : 7);
    const sp = npcSpeed(n.r) * speedMul * (n.stunTimer > 0 ? JELLY_STUN_SLOW : 1);
    n.x += Math.cos(n.heading) * sp * dt;
    n.y += Math.sin(n.heading) * sp * dt;

    if (n.y > FLOOR_Y) n.y = FLOOR_Y;

    if (n.stunTimer <= 0) {
      const nc = fishCircles(n.x, n.y, n.r, n.heading);
      for (const j of jellies) {
        if (fishHitsJelly(nc, j)) {
          n.r = Math.max(5, Math.sqrt(n.r * n.r * (1 - JELLY_SHRINK)));
          n.stunTimer = JELLY_STUN_TIME;
          burst(n.x, n.y, '#f06292', 10, 110);
          break;
        }
      }
    }
  }

  // ---------- Update ----------
  let last = performance.now();
  function update(dt) {
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
    player.turnInput += (turnTarget - player.turnInput) * clamp(dt * 5, 0, 1);
    player.heading += player.turnInput * turnRateForR(player.r) * dt;

    const wantsBoost = (keys['ArrowUp'] || keys['w'] || keys['Control'] || isTouchBoosting()) && player.boost > 0.05 && player.stunTimer <= 0;
    player.boosting = wantsBoost;
    player.wagPhase += dt * (wantsBoost ? 14 : 7);
    if (wantsBoost) player.boost = clamp(player.boost - dt * BOOST_DRAIN, 0, difficulty.boostMax);
    else player.boost = clamp(player.boost + dt * BOOST_REGEN * difficulty.boostRegen, 0, difficulty.boostMax);

    let sp = speedForR(player.r) * (player.boosting ? 1.7 : 1) * (player.stunTimer > 0 ? JELLY_STUN_SLOW : 1);
    player.x += Math.cos(player.heading) * sp * dt;
    player.y += Math.sin(player.heading) * sp * dt;

    player.y = Math.min(player.y, FLOOR_Y); // the sea floor is the only boundary

    for (const n of npcs) updateNpc(n, dt);

    // Recycle entities that drifted too far in this infinite world, and keep counts topped up nearby
    for (let i = foods.length - 1; i >= 0; i--) if (dist(player.x, player.y, foods[i].x, foods[i].y) > CULL_DIST) foods.splice(i, 1);
    for (let i = npcs.length - 1; i >= 0; i--) if (dist(player.x, player.y, npcs[i].x, npcs[i].y) > CULL_DIST) npcs.splice(i, 1);
    for (let i = jellies.length - 1; i >= 0; i--) if (dist(player.x, player.y, jellies[i].x, jellies[i].y) > CULL_DIST) jellies.splice(i, 1);
    const fc = foodCount();
    while (foods.length < fc) spawnFood();
    while (npcs.length < NPC_COUNT) spawnNpc();
    while (jellies.length < JELLY_COUNT) spawnJelly();

    // Player eats food
    let pc = fishCircles(player.x, player.y, player.r, player.heading);
    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      f.bob += dt * 3;
      if (circlesHitPoint(pc, f.x, f.y, f.r)) {
        growPlayer(f.r * f.r, 1.0);
        score += 1;
        burst(f.x, f.y, f.color, 6, 60);
        foods.splice(i, 1);
        playEatSmall();
      }
    }

    // Player vs npc interactions
    pc = fishCircles(player.x, player.y, player.r, player.heading);
    for (let i = npcs.length - 1; i >= 0; i--) {
      const n = npcs[i];
      // cheap bounding check before the exact shape test (tail reaches ~1.6r behind the center)
      if (dist(player.x, player.y, n.x, n.y) > (player.r + n.r) * 1.7) continue;
      if (circlesOverlap(pc, fishCircles(n.x, n.y, n.r, n.heading))) {
        if (player.r > n.r * EAT_MARGIN) {
          growPlayer(n.r * n.r, 0.55);
          score += Math.round(n.r);
          burst(n.x, n.y, '#ff8a65', 14, 140);
          npcs.splice(i, 1);
          playEatBig();
        } else if (n.r > player.r * EAT_MARGIN) {
          if (player.invulnTimer > 0) continue;
          burst(player.x, player.y, '#ef5350', 24, 200);
          player.alive = false;
          endGame('You got eaten!');
          return;
        }
        // else: similar size, just bounce past each other, no effect
      }
    }

    // Player vs jellyfish (hazard, not lethal)
    pc = fishCircles(player.x, player.y, player.r, player.heading);
    for (const j of jellies) {
      j.bob += dt * 2;
      j.x += Math.cos(j.heading) * 14 * dt;
      j.y += Math.sin(j.heading) * 14 * dt;
      if (j.y > FLOOR_Y) { j.y = FLOOR_Y; j.heading = -j.heading; }
      if (player.stunTimer <= 0 && fishHitsJelly(pc, j)) {
        growPlayer(-playerArea() * JELLY_SHRINK, 1);
        player.r = Math.max(BASE_R * 0.6, player.r);
        player.stunTimer = JELLY_STUN_TIME;
        burst(player.x, player.y, '#f06292', 16, 140);
        playSting();
      }
    }

    const afterStage = stageIndexForR(player.r);
    if (afterStage > lastStageIndex) {
      lastStageIndex = afterStage;
      playLevelUp();
      if (afterStage === STAGES.length - 1 && !reachedFinalStage) {
        reachedFinalStage = true;
        showKingDialog();
      } else {
        showBanner('New stage: ' + STAGES[afterStage].name + '!');
      }
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

    document.getElementById('score').textContent = score;
    const si = stageIndexForR(player.r);
    const stage = STAGES[si];
    document.getElementById('stageName').textContent = stage.name + ' (r=' + Math.round(player.r) + ')';
    const prevMax = si > 0 ? STAGES[si - 1].maxR : 0;
    const growFrac = stage.maxR === Infinity ? 1 : clamp((player.r - prevMax) / (stage.maxR - prevMax), 0, 1);
    document.getElementById('growBar').style.width = (growFrac * 100) + '%';
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
    ctx.moveTo(r, 0.04 * r);
    ctx.bezierCurveTo(0.85 * r, -0.55 * r, -0.35 * r, -0.62 * r, jx, -0.12 * r);
    a = tp(-1.2 * r, -0.25 * r); b = tp(-1.8 * r, -0.7 * r);
    ctx.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    a = tp(-1.55 * r, -0.2 * r); b = tp(-1.45 * r, 0);
    ctx.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    a = tp(-1.55 * r, 0.2 * r); b = tp(-1.8 * r, 0.7 * r);
    ctx.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    a = tp(-1.2 * r, 0.25 * r);
    ctx.quadraticCurveTo(a[0], a[1], jx, 0.12 * r);
    ctx.bezierCurveTo(-0.35 * r, 0.64 * r, 0.85 * r, 0.55 * r, r, 0.04 * r);
    ctx.closePath();
  }

  function drawFish(sx, sy, r, heading, color, z, outline, wagPhase) {
    const wag = Math.sin(wagPhase) * 0.22;
    // Mirror vertically when swimming left so the belly stays down; squash near vertical for a rolling look
    const roll = clamp(Math.cos(heading) * 3, -1, 1);
    const flip = (roll < 0 ? -1 : 1) * Math.max(0.35, Math.abs(roll));
    const finColor = shade(color, -0.3);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(heading);
    ctx.scale(z, z * flip);

    // dorsal and ventral fins, behind the body
    ctx.fillStyle = finColor;
    ctx.beginPath();
    ctx.moveTo(0.3 * r, -0.4 * r);
    ctx.quadraticCurveTo(-0.05 * r, -0.95 * r, -0.55 * r, -0.78 * r);
    ctx.lineTo(-0.45 * r, -0.35 * r);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.1 * r, 0.4 * r);
    ctx.quadraticCurveTo(-0.3 * r, 0.75 * r, -0.52 * r, 0.62 * r);
    ctx.lineTo(-0.45 * r, 0.35 * r);
    ctx.closePath();
    ctx.fill();

    // body + tail: dark back, light belly
    const g = ctx.createLinearGradient(0, -0.6 * r, 0, 0.6 * r);
    g.addColorStop(0, shade(color, -0.35));
    g.addColorStop(0.45, color);
    g.addColorStop(1, shade(color, 0.55));
    fishBodyPath(r, wag);
    ctx.fillStyle = g;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = clamp(2.5 / z, 1, 6);
      ctx.stroke();
    }

    // gill line
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = Math.max(0.8, r * 0.05);
    ctx.beginPath();
    ctx.arc(0.2 * r, 0, 0.32 * r, -0.95, 0.95);
    ctx.stroke();

    // pectoral fin, over the body
    ctx.fillStyle = shade(color, 0.25);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0.3 * r, 0.12 * r);
    ctx.quadraticCurveTo(0.05 * r, 0.5 * r, -0.2 * r, 0.4 * r);
    ctx.lineTo(0.12 * r, 0.1 * r);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // eye
    const eyeR = Math.max(1.2, r * 0.13);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0.6 * r, -0.13 * r, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10202b';
    ctx.beginPath();
    ctx.arc(0.6 * r + eyeR * 0.25, -0.13 * r, eyeR * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0.6 * r + eyeR * 0.05, -0.13 * r - eyeR * 0.3, eyeR * 0.22, 0, Math.PI * 2);
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

    // Water color: bright/shallow near the surface, dark near the sea floor
    const br = Math.round(lerp(96, 3, df));
    const bgc = Math.round(lerp(186, 10, df));
    const bb = Math.round(lerp(212, 24, df));
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, `rgb(${clamp(br + 25, 0, 255)},${clamp(bgc + 45, 0, 255)},${clamp(bb + 55, 0, 255)})`);
    bg.addColorStop(1, `rgb(${br},${bgc},${bb})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Sea floor (the only boundary in this infinite world)
    const floorScreenY = worldToScreen(player.x, FLOOR_Y).y;
    if (floorScreenY < H) {
      const top = Math.max(0, floorScreenY);
      const floorGrad = ctx.createLinearGradient(0, top, 0, H);
      floorGrad.addColorStop(0, 'rgba(80,63,38,0.95)');
      floorGrad.addColorStop(1, '#241a0e');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, top, W, H - top);

      ctx.strokeStyle = 'rgba(255,224,130,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, floorScreenY);
      ctx.lineTo(W, floorScreenY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const yy = floorScreenY + 16 * z * i;
        if (yy > H) break;
        ctx.beginPath();
        for (let sx = 0; sx <= W; sx += 24) {
          const wx = player.x + (sx - W / 2) / z;
          const yOff = Math.sin(wx * 0.01 + i) * 4 * z;
          if (sx === 0) ctx.moveTo(sx, yy + yOff); else ctx.lineTo(sx, yy + yOff);
        }
        ctx.stroke();
      }
    }

    // food
    for (const f of foods) {
      const p = worldToScreen(f.x, f.y);
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      const r = f.r * z * (1 + Math.sin(f.bob) * 0.15);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // jellyfish
    // drawn from the same geometry circleHitsJelly() tests against
    for (const j of jellies) {
      const p = worldToScreen(j.x, j.y + jellyBobY(j));
      if (p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) continue;
      ctx.fillStyle = 'rgba(240,98,146,0.55)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, j.r * z, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(240,98,146,0.8)';
      ctx.lineWidth = JELLY_TENTACLE_HALF_W * 2 * z;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        const t = jellyTentacle(j, i);
        const a = worldToScreen(t.x1, t.y1), b = worldToScreen(t.x2, t.y2);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }

    // npc fish, with danger/prey outline for readability
    for (const n of npcs) {
      const p = worldToScreen(n.x, n.y);
      const rr = n.r * z * 2;
      if (p.x < -rr || p.x > W + rr || p.y < -rr || p.y > H + rr) continue;
      const color = STAGES[stageIndexForR(n.r)].color;
      let outline = 'rgba(255,255,255,0.35)';
      if (player.r > n.r * EAT_MARGIN) outline = '#69f0ae';
      else if (n.r > player.r * EAT_MARGIN) outline = '#ff5252';
      drawFish(p.x, p.y, n.r, n.heading, color, z, outline, n.wagPhase);
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
    drawFish(pp.x, pp.y, player.r, player.heading, stage.color, z, player.stunTimer > 0 ? '#f06292' : 'rgba(255,255,255,0.6)', player.wagPhase);

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

    if (player.stunTimer > 0) {
      ctx.fillStyle = `rgba(240,98,146,${clamp(player.stunTimer / 1.2, 0, 1) * 0.25})`;
      ctx.fillRect(0, 0, W, H);
    }

    drawTouchControls();
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
