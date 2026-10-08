'use strict';

// Fish rules shared by the player and the NPCs: depth, stages, growth from meals, length and weight,
// speed and turning, and the hit shapes. Used by the rest of sim/, the renderer and the screens.

// depthFrac: 1 = right at the sea floor (dark, small fish, lots of food), 0 = at the surface (light, big rivals)
function depthFrac(y) { return clamp((y - SURFACE_Y) / WATER_DEPTH, 0, 1); }

// Gravity grows slowly with size, so big fish don't hang in the air for ages (the path is still a true parabola)
function gravityForR(r) { return GRAVITY * Math.pow(r / BASE_R, 0.35); }

// ---------- Stages (size tiers, shared by player and NPCs for readability) ----------
function stageIndexForR(r) {
  for (let i = 0; i < STAGES.length; i++) if (r <= STAGES[i].maxR) return i;
  return STAGES.length - 1;
}

// ---------- Growth ----------
function playerArea() { return player.r * player.r; }
function growFish(e, area) { e.r = Math.min(MAX_R, Math.sqrt(Math.max(0, e.r * e.r + area))); }
function growPlayer(area, eff) { growFish(player, area * eff); }
// Meals (player's and NPCs') grow the fish gradually over GROW_TIME
// Every meal also plays the bite animation; `isFish` marks an eaten fish (speeds up the player's boost regen)
function queueGrowth(area, e = player, isFood = false, isFish = false) {
  e.growQueue.push({ area, left: GROW_TIME, isFish });
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

// ---------- Length and weight ----------
// Power law through both ends: length ∝ r^1.81 (5 cm at BASE_R … 29 m at MAX_R), weight ∝ length³
const LENGTH_EXP = Math.log(MAX_LENGTH_CM / MIN_LENGTH_CM) / Math.log(MAX_R / BASE_R);
function lengthCmForR(r) { return MIN_LENGTH_CM * Math.pow(r / BASE_R, LENGTH_EXP); }
function weightForR(r) { return MAX_WEIGHT_G * Math.pow(lengthCmForR(r) / MAX_LENGTH_CM, 3); }
function formatWeight(g) {
  const fmt = (v, unit) => (v < 10 ? v.toFixed(1) : Math.round(v)) + ' ' + unit;
  if (g < 1000) return fmt(g, 'g');
  if (g < 1e6) return fmt(g / 1e3, 'kg');
  return fmt(g / 1e6, 't');
}
function formatLength(cm) {
  if (cm < 100) return Math.round(cm) + ' cm';
  const m = cm / 100;
  return (m < 10 ? m.toFixed(1) : Math.round(m)) + ' m';
}
function sizeText(r) { return formatWeight(weightForR(r)) + ' · ' + formatLength(lengthCmForR(r)); }

// ---------- Swimming ----------
// Relative to the player: fish up to the player's size follow the size curve, bigger ones slow down from the player's speed
function speedForR(r) {
  const own = SPEED_BASE * Math.pow(Math.min(r, player.r) / BASE_R, SPEED_EXP);
  return r <= player.r ? own : own * Math.pow(player.r / r, BIGGER_SLOW_EXP);
}
function turnRateForR(r) { return clamp(2.6 - (r - BASE_R) * 0.011, 0.8, 2.6); }
// Wag phase speed for a fish of radius r swimming at speedMul × its cruise speed (×2 at the player's full dash)
function wagRate(r, speedMul) {
  return WAG_RATE * (1 + (speedMul - 1) / (BOOST_MUL - 1)) * Math.pow(r / BASE_R, -WAG_SIZE_EXP);
}

// ---------- Hit shapes (match what drawFish actually draws) ----------
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
