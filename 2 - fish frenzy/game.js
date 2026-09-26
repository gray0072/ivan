'use strict';

(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  // Render at the device's pixel density (capped for performance); all drawing stays in CSS pixels
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
  const MAX_R = 500;   // hard size cap for the player and every spawned fish
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
    alive: true,
    growQueue: []   // pending growth from meals, applied gradually over GROW_TIME
  };
  const SPAWN_GRACE = 2.5;
  const GROW_TIME = 5;

  function playerArea() { return player.r * player.r; }
  function growPlayer(area, eff) {
    const newArea = playerArea() + area * eff;
    player.r = Math.min(MAX_R, Math.sqrt(Math.max(0, newArea)));
  }
  function queueGrowth(area) { player.growQueue.push({ area, left: GROW_TIME }); }
  function applyQueuedGrowth(dt) {
    const q = player.growQueue;
    for (let i = q.length - 1; i >= 0; i--) {
      const step = Math.min(dt, q[i].left);
      growPlayer(q[i].area * step / GROW_TIME, 1);
      q[i].left -= step;
      if (q[i].left <= 0) q.splice(i, 1);
    }
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
  function minSpawnDist(radius) {
    return clamp(Math.hypot(W, H) / (2 * currentZoom()) + 120, 400, radius * 0.85);
  }

  // Big players see a wider area full of equally big fish, so thin the crowd out as the player grows:
  // fewer bots, spread over a larger area
  function npcSpawnRadius() { return SPAWN_RADIUS * clamp(player.r / 200, 1, 1.5); }
  function npcCullDist() { return npcSpawnRadius() * (CULL_DIST / SPAWN_RADIUS); }
  function npcCount() { return Math.round(NPC_COUNT * clamp(1.2 - player.r / 800, 0.6, 1)); }

  // ---------- Game state ----------
  let score = 0;
  let gameState = 'start'; // start | playing | paused | over
  let elapsed = 0;         // in-game seconds for the current run (pauses don't count)
  let cheated = false;
  let reachedFinalStage = false;
  let reachedMaxSize = false;
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
    return clamp(base * depthMul, 5, MAX_R);
  }
  function spawnNpc() {
    let x, y, tries = 0;
    const R = npcSpawnRadius();
    const minDist = minSpawnDist(R);
    do {
      x = player.x + rand(-R, R);
      y = Math.min(player.y + rand(-R, R), FLOOR_Y);
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
  const JELLY_TENTACLE_HALF_W = 1.8;
  const JELLY_HUES = [330, 285, 205, 25, 170, 55];

  // ---------- Hit shapes (match what drawFish / the jellyfish renderer actually draw) ----------
  // Fish: circles along the body axis, [offset along heading, radius], both in units of r
  const FISH_HIT = [[0.55, 0.4], [0.05, 0.56], [-0.45, 0.4], [-1.3, 0.28]];
  function fishCircles(x, y, r, heading) {
    const c = Math.cos(heading), s = Math.sin(heading);
    return FISH_HIT.map(([o, cr]) => ({ x: x + c * o * r, y: y + s * o * r, r: cr * r }));
  }
  // The only part that can eat: the head in front of the gill line
  const MOUTH_HIT = [0.72, 0.32];
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
    let x, y, tries = 0;
    const minDist = minSpawnDist(SPAWN_RADIUS);
    do {
      x = player.x + rand(-SPAWN_RADIUS, SPAWN_RADIUS);
      y = Math.min(player.y + rand(-SPAWN_RADIUS, SPAWN_RADIUS), FLOOR_Y);
      tries++;
    } while (dist(x, y, player.x, player.y) < minDist && tries < 20);
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

  function resetWorld() {
    foods.length = 0;
    npcs.length = 0;
    jellies.length = 0;
    const fc = foodCount();
    for (let i = 0; i < fc; i++) spawnFood();
    const nc = npcCount();
    for (let i = 0; i < nc; i++) spawnNpc();
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

  // Bubbles rise and wobble instead of decelerating like burst particles
  const bubbles = [];
  let bubbleTimer = 0;
  function spawnBubble(x, y, r) {
    bubbles.push({ x, y, r, life: rand(0.9, 1.5), maxLife: 1.5, phase: rand(0, Math.PI * 2) });
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
    score = 0;
    reachedFinalStage = false;
    reachedMaxSize = false;
    lastStageIndex = 0;
    player.x = 0;
    player.y = FLOOR_Y - DEPTH_RANGE / 2;
    player.heading = 0;
    player.r = BASE_R;
    player.growQueue.length = 0;
    player.turnInput = 0;
    player.boost = difficulty.boostMax;
    player.stunTimer = 0;
    player.invulnTimer = SPAWN_GRACE;
    player.alive = true;
    particles.length = 0;
    bubbles.length = 0;
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

  // ---------- Test cheat: digits set the player's size (1-5 = each stage, 6-9 = bigger Sea King, 0 = max size) ----------
  const CHEAT_RADII = [MAX_R, BASE_R, 30, 55, 95, 130, 180, 240, 320, 420];
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
          burst(n.x, n.y, `hsl(${j.hue},90%,72%)`, 10, 110);
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
      updateJellyGeometry(j);
    }

    for (const n of npcs) updateNpc(n, dt);

    // Recycle entities that drifted too far in this infinite world, and keep counts topped up nearby
    for (let i = foods.length - 1; i >= 0; i--) if (dist(player.x, player.y, foods[i].x, foods[i].y) > CULL_DIST) foods.splice(i, 1);
    const npcCull = npcCullDist();
    for (let i = npcs.length - 1; i >= 0; i--) if (dist(player.x, player.y, npcs[i].x, npcs[i].y) > npcCull) npcs.splice(i, 1);
    // When the target count drops (player grew), retire the farthest off-screen bots
    const offscreen = minSpawnDist(npcSpawnRadius());
    while (npcs.length > npcCount()) {
      let far = -1, farD = offscreen;
      for (let i = 0; i < npcs.length; i++) {
        const d = dist(player.x, player.y, npcs[i].x, npcs[i].y);
        if (d > farD) { farD = d; far = i; }
      }
      if (far < 0) break;
      npcs.splice(far, 1);
    }
    for (let i = jellies.length - 1; i >= 0; i--) if (dist(player.x, player.y, jellies[i].x, jellies[i].y) > CULL_DIST) jellies.splice(i, 1);
    const fc = foodCount();
    while (foods.length < fc) spawnFood();
    while (npcs.length < npcCount()) spawnNpc();
    while (jellies.length < JELLY_COUNT) spawnJelly();

    applyQueuedGrowth(dt);

    // Player eats food (mouth only)
    const pm = [mouthCircle(player.x, player.y, player.r, player.heading)];
    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      f.bob += dt * 3;
      if (circlesHitPoint(pm, f.x, f.y, f.r)) {
        queueGrowth(f.r * f.r);
        score += 1;
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
          score += Math.round(n.r);
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
          score += Math.round(j.r);
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
    }

    document.getElementById('score').textContent = score;
    const si = stageIndexForR(player.r);
    const stage = STAGES[si];
    document.getElementById('stageName').textContent = stage.name + ' (r=' + Math.round(player.r) + ')';
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

  function drawFish(sx, sy, r, heading, color, z, outline, wagPhase) {
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
    ctx.moveTo(0.3 * r, -0.5 * r);
    ctx.quadraticCurveTo(-0.05 * r, -1.05 * r, -0.6 * r, -0.9 * r);
    ctx.quadraticCurveTo(-0.5 * r, -0.65 * r, -0.5 * r, -0.4 * r);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.05 * r, 0.52 * r);
    ctx.quadraticCurveTo(-0.3 * r, 0.9 * r, -0.55 * r, 0.78 * r);
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
      ctx.lineWidth = clamp(2.5 / z, 1, 6);
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

    // mouth
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(0.7, r * 0.04);
    ctx.beginPath();
    ctx.arc(0.8 * r, 0.1 * r, 0.12 * r, 0.3, 1.5);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // pectoral fin, over the body
    ctx.fillStyle = shade(color, 0.25);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0.28 * r, 0.14 * r);
    ctx.quadraticCurveTo(0.02 * r, 0.6 * r, -0.25 * r, 0.46 * r);
    ctx.quadraticCurveTo(-0.02 * r, 0.3 * r, 0.1 * r, 0.1 * r);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

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

    const cam = { x: player.x, y: player.y, z, floorY: FLOOR_Y, df, t: performance.now() / 1000, W, H };
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
      ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const j of jellies) drawJelly(j, z, df);

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

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
