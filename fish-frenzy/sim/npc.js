'use strict';

// NPC fish: their speed and dash tank, the bot brain (look around with a reaction delay, flee, chase, wander,
// leap, keep clear of jellyfish, the floor and the surface) and what they eat. The demo pilot (demo.js) reuses
// nearestJelly / jellyEscapeHeading / avoidEdges. Driven by game.js every frame.

// ---------- Speed and stamina ----------
function npcSpeed(r) { return speedForR(r) * 0.9 * difficulty.npcSpeed; }
function npcBoostMax() { return difficulty.boostMax * difficulty.npcBoost; }
// Cruising bots stay this far below the surface (their back just under it); only leaps, chases and escapes break it
function npcSurfaceMargin(r) { return r * 0.9 + 40; }

// ---------- Bot brain ----------
// Look around for the nearest threat (bigger) and prey (smaller) among player + other npcs only once per
// reaction interval, like a human reaction delay; in between the fish acts on what it saw last time
function botThink(n, dt) {
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
}
// Distance a fish of radius r covers while turning around: its turning radius at cruise speed
function turnRadius(r) { return speedForR(r) / turnRateForR(r); }
// The closest jellyfish within `gap` (edge to edge) plus the fish's turning radius, as an offset { dx, dy }
// from the fish to the nearest point of its bell and tentacles, or null
function nearestJelly(n, gap = JELLY_AVOID_DIST) {
  let best = null, bestDist = gap + turnRadius(n.r);
  for (const j of jellies) {
    // nearest point on the vertical stalk from the bell's center down through the tentacles
    const py = clamp(n.y, j.y, j.y + j.r * JELLY_TENTACLE_REACH);
    const d = dist(n.x, n.y, j.x, py) - j.r - n.r;
    if (d < bestDist) { bestDist = d; best = { dx: j.x - n.x, dy: py - n.y }; }
  }
  return best;
}
// Heading away from a jellyfish. Near the surface an upward escape would be bent straight back down into it
// by the "stay under the surface" rule (avoidEdges), so there the fish slips past sideways instead
function jellyEscapeHeading(n, jelly) {
  const away = Math.atan2(-jelly.dy, -jelly.dx);
  if (jelly.dy > 0 && n.y < SURFACE_Y + npcSurfaceMargin(n.r) + n.r) return jelly.dx > 0 ? Math.PI : 0;
  return away;
}
// Never aim into the sea floor - bend the desired direction along/away from it instead,
// otherwise flee/chase would keep re-aiming down every frame and the fish would vibrate in place.
// Cruising fish bend away from the surface the same way.
function avoidEdges(n, heading, cruising) {
  if (n.y > FLOOR_Y - NPC_FLOOR_MARGIN) {
    const dx = Math.cos(heading);
    let dy = Math.sin(heading);
    if (dy > 0) dy = -dy;
    heading = Math.atan2(dy, dx);
  }
  if (cruising && n.y < SURFACE_Y + npcSurfaceMargin(n.r)) {
    const dx = Math.cos(heading);
    let dy = Math.sin(heading);
    if (dy < 0) dy = -dy;
    heading = Math.atan2(dy, dx);
    n.wanderTarget = heading;
  }
  return heading;
}

// ---------- Swimming, leaping and stings ----------
function updateNpc(n, dt) {
  if (n.stunTimer > 0) n.stunTimer -= dt;
  if (n.leapCooldown > 0) n.leapCooldown -= dt;
  if (n.leapTimer > 0) n.leapTimer -= dt;
  if (n.air) {
    n.wagPhase += dt * wagRate(n.r, 1) * 4 / WAG_RATE;
    if (updateAirborne(n, dt)) {
      // back in the water: level out on the same side and carry on
      n.mode = 'wander';
      n.leapTimer = 0;
      n.wanderTarget = n.leapDir > 0 ? 0.35 : Math.PI - 0.35;
      n.wanderTimer = rand(1, 2);
    }
    return;
  }

  botThink(n, dt);
  const eatsJelly = stageIndexForR(n.r) >= JELLY_EATER_STAGE;
  const jelly = eatsJelly ? null : nearestJelly(n);

  let desiredHeading;
  let speedMul = 1;
  if (jelly) {
    n.mode = 'avoid';
    desiredHeading = jellyEscapeHeading(n, jelly);
  } else if (n.seen) {
    n.mode = n.seen.mode;
    desiredHeading = n.seen.heading + n.aimErr;
    speedMul = n.mode === 'flee' ? 1.15 : 1.2;
  } else if (n.leapTimer > 0) {
    // a playful leap: dash steeply up at the surface
    n.mode = 'leap';
    desiredHeading = Math.atan2(-Math.sin(MAX_LEAP_ELEV), n.leapDir * Math.cos(MAX_LEAP_ELEV));
    speedMul = BOOST_MUL;
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
      n.leapTimer = (n.y - SURFACE_Y) / (npcSpeed(n.r) * BOOST_MUL * Math.sin(MAX_LEAP_ELEV)) + 2;
      n.leapDir = Math.cos(n.heading) >= 0 ? 1 : -1;
      n.leapCooldown = rand(6, 15);
    }
  }

  // Dash away from a predator or after prey: start only on a full tank and burn it all (or until the chase ends);
  // the tank then comes back full all at once after npcBoostRecharge, so the dashes stay rare, visible bursts
  const hunted = n.mode === 'flee' || n.mode === 'chase';
  if (n.dashing && (!hunted || n.stunTimer > 0 || n.boost <= 0)) {
    n.dashing = false;
    n.boost = 0;
    n.boostCooldown = difficulty.npcBoostRecharge;
  } else if (!n.dashing && hunted && n.stunTimer <= 0 && n.boostCooldown <= 0) {
    n.dashing = true;
    n.boost = npcBoostMax();
  }
  if (n.dashing) {
    speedMul += NPC_BOOST_ADD;
    n.boost -= dt * BOOST_DRAIN;
  } else if (n.boostCooldown > 0) {
    n.boostCooldown -= dt;
  }

  desiredHeading = avoidEdges(n, desiredHeading, n.mode === 'wander' || n.mode === 'avoid');

  // Turn smoothly toward the desired heading: proportional to the error (eases in, no overshoot wobble),
  // capped by the size's turn rate
  const turnRate = turnRateForR(n.r);
  n.heading += clamp(angDiff(desiredHeading, n.heading) * NPC_TURN_GAIN, -turnRate, turnRate) * dt;

  n.wagPhase += dt * (n.stunTimer > 0 ? wagRate(n.r, 1) * 3 / WAG_RATE : wagRate(n.r, speedMul));
  const sp = npcSpeed(n.r) * n.speedVar * speedMul * (n.stunTimer > 0 ? JELLY_STUN_SLOW : 1);
  n.x += Math.cos(n.heading) * sp * dt;
  n.y += Math.sin(n.heading) * sp * dt;

  if (n.y > FLOOR_Y) n.y = FLOOR_Y;
  // chases, escapes and leaps are fast enough to fly out; anything slower skims along the surface
  if (n.y < SURFACE_Y && trySurfaceLeap(n, sp, speedMul > 1.1 && n.stunTimer <= 0)) return;

  if (n.stunTimer <= 0 && !eatsJelly) {
    const nc = fishCircles(n.x, n.y, n.r, n.heading);
    for (const j of jellies) {
      if (fishHitsJelly(nc, j)) {
        n.r = Math.max(5, Math.sqrt(n.r * n.r * (1 - jellyShrink(j))));
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
      if (onScreen) GameEvents.emit('gull', { fish: n, hit });
      if (hit === 'eaten') {
        queueGrowth(b.r * b.r * NPC_MEAL, n);
        if (onScreen) featherBurst(b.x, b.y);
        birds.splice(i, 1);
      } else if (hit === 'scared') {
        if (onScreen) featherBurst(b.x, b.y, 5);
      } else {
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
    if (stageIndexForR(n.r) < JELLY_EATER_STAGE) continue;
    for (let i = jellies.length - 1; i >= 0; i--) {
      const j = jellies[i];
      if (dist(n.x, n.y, j.x, j.y) > n.r * 2 + j.r * 2.5) continue;
      if (fishHitsJelly(m, j)) {
        queueGrowth(j.r * j.r * 0.3, n);
        if (onScreenX(j.x, j.r * 3)) burst(j.x, j.baseY, `hsl(${j.hue},90%,72%)`, 12, 120);
        jellies.splice(i, 1);
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
        queueGrowth(o.r * o.r * NPC_MEAL, n);
        if (onScreenX(o.x, o.r * 2)) burst(o.x, o.y, '#ff8a65', 10, 110);
        npcs.splice(b, 1);
        if (b < a) a--;
      }
    }
  }
}
