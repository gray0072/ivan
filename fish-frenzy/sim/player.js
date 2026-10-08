'use strict';

// The player's fish: swimming, the dash and its stamina, leaps, and everything it meets — gulls, plankton,
// other fish and jellyfish. Driven by game.js, which reads the controls and handles the stage-ups and the end.

let bubbleTimer = 0;

// turnTarget: -1..1 from the keys, the joystick or the demo pilot; boostHeld: the dash is being asked for
function updatePlayer(dt, turnTarget, boostHeld) {
  // no steering in the air: the leap follows its arc
  if (player.air) turnTarget = 0;
  player.turnInput += (turnTarget - player.turnInput) * clamp(dt * 5, 0, 1);

  const wantsBoost = !player.air && boostHeld && player.boost > 0.05 && player.stunTimer <= 0;
  player.boosting = wantsBoost;
  player.wagPhase += dt * (player.air ? wagRate(player.r, 1) * 4 / WAG_RATE : wagRate(player.r, wantsBoost ? BOOST_MUL : 1));
  if (wantsBoost) player.boost = clamp(player.boost - dt * BOOST_DRAIN, 0, difficulty.boostMax);
  else {
    // growing into an eaten fish recharges the boost faster
    const regenMul = player.growQueue.some((g) => g.isFish) ? FISH_MEAL_REGEN_MUL : 1;
    player.boost = clamp(player.boost + dt * BOOST_REGEN * difficulty.boostRegen * regenMul, 0, difficulty.boostMax);
  }

  if (player.air) {
    updateAirborne(player, dt);
  } else {
    player.heading += player.turnInput * turnRateForR(player.r) * dt;
    const sp = speedForR(player.r) * (player.boosting ? BOOST_MUL : 1) * (player.stunTimer > 0 ? JELLY_STUN_SLOW : 1);
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
}

// Meals and hazards, each reported as a game event (core/events.js); returns the cause of death, or null
function playerCollisions(dt) {
  // Player eats food (mouth only)
  const pm = [mouthCircle(player.x, player.y, player.r, player.heading)];

  // Leaping at gulls: a fry gets snatched, a small fish knocks the gull away, anything bigger eats it
  if (player.air) {
    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i];
      const hit = fishMeetsGull(player, b);
      if (hit) GameEvents.emit('gull', { fish: player, hit });
      if (hit === 'eaten') {
        queueGrowth(b.r * b.r * difficulty.meal);
        featherBurst(b.x, b.y);
        birds.splice(i, 1);
      } else if (hit === 'scared') {
        featherBurst(b.x, b.y, 5);
      } else if (hit === 'caught') {
        player.alive = false;
        player.caught = true;
        return 'A seagull got you!';
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
      GameEvents.emit('eat', { fish: player, what: 'food' });
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
        queueGrowth(n.r * n.r * difficulty.meal, player, false, true);
        burst(n.x, n.y, '#ff8a65', 14, 140);
        npcs.splice(i, 1);
        GameEvents.emit('eat', { fish: player, what: 'fish' });
      }
    } else if (n.r > player.r * EAT_MARGIN && player.invulnTimer <= 0) {
      if (circlesOverlap([mouthCircle(n.x, n.y, n.r, n.heading)], pc)) {
        burst(player.x, player.y, '#ef5350', 24, 200);
        player.alive = false;
        return 'You got eaten!';
      }
    }
    // similar sizes just pass each other with no effect
  }

  // Player vs jellyfish: a hazard, until a Shark or bigger can simply eat them (mouth only, no stings)
  const eatsJelly = stageIndexForR(player.r) >= JELLY_EATER_STAGE;
  pc = fishCircles(player.x, player.y, player.r, player.heading);
  for (let i = jellies.length - 1; i >= 0; i--) {
    const j = jellies[i];
    if (eatsJelly) {
      if (fishHitsJelly(pm, j)) {
        queueGrowth(j.r * j.r * 0.3);
        burst(j.x, j.baseY, `hsl(${j.hue},90%,72%)`, 16, 140);
        jellies.splice(i, 1);
        GameEvents.emit('eat', { fish: player, what: 'jelly' });
      }
    } else if (player.stunTimer <= 0 && fishHitsJelly(pc, j)) {
      growPlayer(-playerArea() * jellyShrink(j), 1);
      player.r = Math.max(BASE_R * 0.6, player.r);
      player.stunTimer = JELLY_STUN_TIME;
      burst(player.x, player.y, `hsl(${j.hue},90%,72%)`, 16, 140);
      GameEvents.emit('sting', { fish: player });
    }
  }
  return null;
}
