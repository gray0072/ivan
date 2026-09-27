'use strict';

// Demo mode pilot: steers the player like a bot (same reaction delay and aim error), but with a wider view,
// plankton hunting as a Fry, blended escapes, prey leading and a dash saved for hunting and escapes.
// `w` gives access to the game's world state and the bot helpers shared with the NPCs (see game.js).
function createDemoPilot(w) {
  const { player, npcs, foods, stageIndexForR, speedForR, turnRateForR, npcSpeed, npcSurfaceMargin,
    nearestJelly, avoidEdges, botAimError } = w;
  const pilot = { dash: false, spending: false, reset, turnTarget: demoTurnTarget };

  function reset() {
    pilot.dash = pilot.spending = false;
    player.thinkTimer = 0;
    player.seen = null;
    player.aimErr = player.aimErrTarget = player.aimErrTimer = 0;
    player.wanderTarget = player.heading;
    player.wanderTimer = 0;
  }

  // Looks around once per reaction interval and picks what to do: flee, chase a fish, or (as a Fry) grab plankton
  function demoThink() {
    const n = player;
    n.seen = null;
    // Flee from every threat in view at once, so escaping one predator doesn't mean swimming into another.
    // Closer ones weigh more; one showing its tail can't bite right now, so it weighs less.
    let fx = 0, fy = 0, dangerDist = Infinity;
    for (const o of npcs) {
      if (o.r <= n.r * EAT_MARGIN) continue;
      const dx = o.x - n.x, dy = o.y - n.y, d = Math.hypot(dx, dy) || 1;
      const range = (n.r * 9 + 90) * DEMO_VIEW_MUL + o.r;  // a big fish is noticed further away
      if (d > range) continue;
      const facing = (Math.cos(o.heading) * -dx + Math.sin(o.heading) * -dy) / d > 0 ? 1 : DEMO_TAIL_THREAT;
      const weight = facing * (1 - d / range) * (1 - d / range) + 0.01;
      fx -= dx / d * weight;
      fy -= dy / d * weight;
      // the dash is spent only on predators within a bot's own (shorter) view
      if (d - o.r < n.r * 9 + 90) dangerDist = Math.min(dangerDist, d);
    }
    if (fx || fy) {
      n.seen = { mode: 'flee', heading: Math.atan2(fy, fx), dash: dangerDist < Infinity };
      return;
    }
    // Chase the most rewarding fish in view: meal size over distance
    const preyRange = (n.r * 7 + 70) * DEMO_VIEW_MUL;
    let best = null, bestScore = 0;
    for (const o of npcs) {
      if (n.r <= o.r * EAT_MARGIN) continue;
      const d = dist(n.x, n.y, o.x, o.y);
      if (d > preyRange) continue;
      const score = o.r * o.r / (d + n.r * 2);
      if (score > bestScore) { bestScore = score; best = o; }
    }
    if (best) { n.seen = { mode: 'chase', target: best }; return; }
    // A Fry grabs the nearest plankton, preferring what's ahead (turning around is slow);
    // plankton right under the surface is skipped, the fry stays away from the gulls there
    if (stageIndexForR(n.r) > DEMO_FOOD_MAX_STAGE) return;
    const top = SURFACE_Y + npcSurfaceMargin(n.r);
    let bestCost = DEMO_FOOD_RANGE * 2;
    for (const f of foods) {
      if (f.y < top) continue;
      const d = dist(n.x, n.y, f.x, f.y);
      if (d > DEMO_FOOD_RANGE) continue;
      const cost = d * (1 + 0.6 * Math.abs(angDiff(Math.atan2(f.y - n.y, f.x - n.x), n.heading)));
      if (cost < bestCost) { bestCost = cost; best = f; }
    }
    if (best) n.seen = { mode: 'food', target: best };
  }
  // Heading to where the prey will be when we get there, not where it is now
  function interceptHeading(o) {
    const d = dist(player.x, player.y, o.x, o.y);
    const t = Math.min(d / (speedForR(player.r) * 1.7), DEMO_LEAD_MAX);
    const osp = npcSpeed(o.r) * o.speedVar;
    return Math.atan2(o.y + Math.sin(o.heading) * osp * t - player.y, o.x + Math.cos(o.heading) * osp * t - player.x);
  }
  // Called every frame: returns the turn input -1..1 and sets pilot.dash (whether to hold the dash)
  function demoTurnTarget(dt) {
    const s0 = player.seen;
    // a chosen target is tracked continuously; if it's gone (eaten by someone), look around again at once
    const lost = s0 && s0.target && !(s0.mode === 'chase' ? npcs : foods).includes(s0.target);
    player.thinkTimer -= dt;
    if (player.thinkTimer <= 0 || lost) {
      player.thinkTimer = w.difficulty.npcReaction * rand(1 - NPC_REACTION_SPREAD, 1 + NPC_REACTION_SPREAD);
      demoThink();
    }
    botAimError(player, dt);
    const s = player.seen;
    const reserve = player.boost > w.difficulty.boostMax * DEMO_DASH_RESERVE;
    // Full stamina would just go to waste: spend it on hunting and feeding, down to the escape reserve
    if (player.boost >= w.difficulty.boostMax * 0.98) pilot.spending = true;
    else if (!reserve) pilot.spending = false;
    const jellyRange = JELLY_AVOID_DIST * DEMO_VIEW_MUL;
    const jelly = stageIndexForR(player.r) >= JELLY_EATER_STAGE ? null : nearestJelly(player, jellyRange);
    // a Fry never leaves the water: that's where the gulls get it
    let want, cruising = stageIndexForR(player.r) <= GULL_PREY_STAGE;
    pilot.dash = false;
    if (s && s.mode === 'flee') {
      want = s.heading + player.aimErr;
      pilot.dash = s.dash;
    } else if (jelly) {
      want = Math.atan2(-jelly.dy, -jelly.dx);
      cruising = true;
    } else if (s && s.mode === 'chase') {
      want = interceptHeading(s.target) + player.aimErr;
      // dash in for the kill when it's close and ahead, keeping some stamina for an escape
      const d = dist(player.x, player.y, s.target.x, s.target.y);
      const ahead = Math.abs(angDiff(want, player.heading)) < 0.6;
      pilot.dash = reserve && ahead && (pilot.spending || d < player.r * 5 + 80);
    } else if (s && s.mode === 'food') {
      want = Math.atan2(s.target.y - player.y, s.target.x - player.x);
      cruising = true;
      pilot.dash = pilot.spending && Math.abs(angDiff(want, player.heading)) < 0.6;
    } else {
      player.wanderTimer -= dt;
      if (player.wanderTimer <= 0) {
        player.wanderTarget = player.heading + rand(-1.4, 1.4);
        player.wanderTimer = rand(1, 2.5);
      }
      want = player.wanderTarget;
      cruising = true;
    }
    want = avoidEdges(player, want, cruising);
    // same proportional turn as the bots (gain per radian, capped by the turn rate)
    return clamp(angDiff(want, player.heading) * NPC_TURN_GAIN / turnRateForR(player.r), -1, 1);
  }

  return pilot;
}
