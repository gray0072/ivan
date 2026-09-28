'use strict';

// Demo mode pilot: steers the player like a bot, but with no reaction delay or aim error, a wider view,
// plankton hunting as a Fry, blended escapes, prey leading and a dash saved for hunting and escapes.
// `w` gives access to the game's world state and the bot helpers shared with the NPCs (see game.js).
function createDemoPilot(w) {
  const { player, npcs, foods, stageIndexForR, speedForR, turnRateForR, npcSpeed, npcSurfaceMargin,
    nearestJelly, avoidEdges } = w;
  const pilot = {
    dash: false, spending: false, reset, turnTarget: demoTurnTarget,
    time: 0, leaps: [], wasAir: false, skimTime: 0, diveUntil: 0   // surface habit, see updateSurfaceHabit
  };

  function reset() {
    pilot.dash = pilot.spending = pilot.wasAir = false;
    pilot.leaps.length = 0;
    pilot.skimTime = pilot.diveUntil = 0;
    player.seen = null;
    player.wanderTarget = player.heading;
    player.wanderTimer = 0;
  }

  // Looks around every frame (no reaction delay) and picks what to do: flee, chase a fish, or (as a Fry) grab plankton
  function demoThink() {
    const n = player;
    const prev = n.seen && n.seen.mode === 'chase' ? n.seen.target : null;
    n.seen = null;
    // Flee from every threat close enough to matter at once, so escaping one predator doesn't mean swimming
    // into another. Distance counts from the predator's mouth, so one showing its tail is further away than it
    // looks; closer ones weigh more, and one facing away weighs less. Threats further off are ignored, so a
    // hunt isn't abandoned because of a predator far away.
    const fleeRange = n.r * DEMO_FLEE_R + DEMO_FLEE_BASE;
    const threats = [];
    let fx = 0, fy = 0, dash = false;
    for (const o of npcs) {
      if (o.r <= n.r * EAT_MARGIN) continue;
      const gap = mouthGap(o, n.x, n.y, n.r);
      if (gap > fleeRange * 2) continue;
      threats.push(o);   // near enough to make prey around it off-limits
      if (gap > fleeRange) continue;
      const dx = o.x - n.x, dy = o.y - n.y, d = Math.hypot(dx, dy) || 1;
      const facing = (Math.cos(o.heading) * -dx + Math.sin(o.heading) * -dy) / d > 0 ? 1 : DEMO_TAIL_THREAT;
      const closeness = 1 - Math.max(gap, 0) / fleeRange;
      const weight = facing * closeness * closeness + 0.01;
      fx -= dx / d * weight;
      fy -= dy / d * weight;
      if (gap < fleeRange * DEMO_FLEE_DASH) dash = true;
    }
    if (fx || fy) {
      n.seen = { mode: 'flee', heading: Math.atan2(fy, fx), dash };
      return;
    }
    // Chase the most rewarding fish in view: meal size over distance. The current target gets a bonus,
    // so two similar fish don't make it flip back and forth every frame.
    const preyRange = (n.r * 7 + 70) * DEMO_VIEW_MUL;
    let best = null, bestScore = 0;
    for (const o of npcs) {
      if (n.r <= o.r * EAT_MARGIN) continue;
      const d = dist(n.x, n.y, o.x, o.y);
      if (d > preyRange) continue;
      // prey swimming right by a predator isn't worth the risk
      if (threats.some((t) => mouthGap(t, o.x, o.y, n.r) < fleeRange)) continue;
      const score = o.r * o.r / (d + n.r * 2) * (o === prev ? DEMO_TARGET_STICKY : 1);
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
  // Gap between predator o's mouth and a fish of radius r at (x, y)
  function mouthGap(o, x, y, r) {
    const mx = o.x + Math.cos(o.heading) * MOUTH_HIT[0] * o.r, my = o.y + Math.sin(o.heading) * MOUTH_HIT[0] * o.r;
    return dist(mx, my, x, y) - MOUTH_HIT[1] * o.r - r;
  }
  // Leaps and surface skims are counted; after a few in a row the fish dives deep for a while
  function updateSurfaceHabit(dt) {
    pilot.time += dt;
    if (player.air && !pilot.wasAir) pilot.leaps.push(pilot.time);
    pilot.wasAir = !!player.air;
    while (pilot.leaps.length && pilot.time - pilot.leaps[0] > DEMO_LEAP_WINDOW) pilot.leaps.shift();
    pilot.skimTime = !player.air && player.y < SURFACE_Y + player.r ? pilot.skimTime + dt : 0;
    if (pilot.leaps.length >= DEMO_MAX_LEAPS || pilot.skimTime > DEMO_MAX_SKIM) {
      pilot.diveUntil = pilot.time + DEMO_DIVE_TIME;
      pilot.leaps.length = 0;
      pilot.skimTime = 0;
    }
    if (player.y > SURFACE_Y + DEMO_DIVE_DEPTH + player.r * 2) pilot.diveUntil = 0;  // deep enough
    return pilot.time < pilot.diveUntil;
  }
  // Heading to where the prey will be when we get there, not where it is now
  function interceptHeading(o) {
    const d = dist(player.x, player.y, o.x, o.y);
    const t = Math.min(d / (speedForR(player.r) * BOOST_MUL), DEMO_LEAD_MAX);
    const osp = npcSpeed(o.r) * o.speedVar;
    return Math.atan2(o.y + Math.sin(o.heading) * osp * t - player.y, o.x + Math.cos(o.heading) * osp * t - player.x);
  }
  // Called every frame: returns the turn input -1..1 and sets pilot.dash (whether to hold the dash)
  function demoTurnTarget(dt) {
    demoThink();
    const diving = updateSurfaceHabit(dt);
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
      want = s.heading;
      pilot.dash = s.dash;
    } else if (jelly) {
      want = Math.atan2(-jelly.dy, -jelly.dx);
      cruising = true;
    } else if (s && s.mode === 'chase') {
      want = interceptHeading(s.target);
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
    if (diving) {
      // head down at an angle (a real escape still steers, but along the surface, not out of it)
      if (!(s && s.mode === 'flee')) want = Math.atan2(Math.sin(DEMO_DIVE_ANGLE), Math.cos(player.heading) >= 0 ? 1 : -1);
      cruising = true;
    }
    want = avoidEdges(player, want, cruising);
    // same proportional turn as the bots (gain per radian, capped by the turn rate)
    return clamp(angDiff(want, player.heading) * NPC_TURN_GAIN / turnRateForR(player.r), -1, 1);
  }

  return pilot;
}
