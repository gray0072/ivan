'use strict';

// City Builder — building, demolishing and repairing: where each thing may stand, what it costs,
// and the lines of road, embankment or bulldozer drawn with a drag. Every change is reported as
// a game event (built, roadBuilt, bulldozed, repaired, cantBuild). Used by game.js and ui/info.js.

function isFlooded(x, y) {
  const f = city.flood;
  return !!f && f.dist[idx(x, y)] >= 0 && f.dist[idx(x, y)] < f.level;
}
function isHighway(x, y) { return y === city.highwayY && x < HIGHWAY_LEN; }
function nextToWater(x, y) {
  return DIRS.some(([dx, dy]) => inMap(x + dx, y + dy) && city.terrain[idx(x + dx, y + dy)] === T_WATER);
}

// can `type` stand with its top corner on (x, y)? → { ok, cost, reason }
function placeCheck(type, x, y) {
  const d = BUILDINGS[type];
  if (!unlocked(type)) return { ok: false, cost: d.price, reason: 'Not unlocked yet' };
  let cost = d.price;
  for (let ty = y; ty < y + d.h; ty++) for (let tx = x; tx < x + d.w; tx++) {
    if (!inMap(tx, ty)) return { ok: false, cost, reason: 'Outside the map' };
    const i = idx(tx, ty);
    if (city.terrain[i] === T_WATER) return { ok: false, cost, reason: 'Can\'t build on water' };
    if (run.occ[i] || city.road[i]) return { ok: false, cost, reason: 'Something is already here' };
    if (isFlooded(tx, ty)) return { ok: false, cost, reason: 'Flooded' };
    if (city.terrain[i] === T_FOREST) cost += FOREST_CLEAR_PRICE;
  }
  if (d.shore && !nextToWater(x, y)) return { ok: false, cost, reason: 'Only on the shore, next to water' };
  if (city.money < cost) return { ok: false, cost, reason: 'Not enough money' };
  return { ok: true, cost };
}

function placeBuilding(type, x, y) {
  const c = placeCheck(type, x, y);
  if (!c.ok) { GameEvents.emit('cantBuild', { reason: c.reason }); return null; }
  const d = BUILDINGS[type];
  const b = {
    id: city.nextId++, type, x, y, level: type === 'house' ? 1 : 0, residents: 0, workers: 0,
    happy: 50, happyMonths: 0, sadMonths: 0, damaged: false, fire: 0, ruin: false, connected: false,
    variant: Math.floor(Math.random() * 8)
  };
  for (let ty = y; ty < y + d.h; ty++) for (let tx = x; tx < x + d.w; tx++) {
    const i = idx(tx, ty);
    city.terrain[i] = T_GRASS;
    run.occ[i] = b.id;
  }
  city.buildings.push(b);
  run.byId.set(b.id, b);
  city.money -= c.cost;
  run.linksDirty = true;
  GameEvents.emit('built', { b, cost: c.cost, big: d.w * d.h > 1 });
  return b;
}

function removeBuilding(b) {
  const d = def(b);
  for (let ty = b.y; ty < b.y + d.h; ty++) for (let tx = b.x; tx < b.x + d.w; tx++) run.occ[idx(tx, ty)] = 0;
  city.buildings.splice(city.buildings.indexOf(b), 1);
  run.byId.delete(b.id);
  run.trucks = run.trucks.filter((t) => t.target !== b && t.station !== b);
  run.linksDirty = true;
}

// ---------- lines: road, embankment, bulldozer ----------

// the tiles from (x0, y0) to (x1, y1): first along the longer side, then the shorter one (an L)
function lineTiles(x0, y0, x1, y1) {
  const out = [];
  const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
  let x = x0, y = y0;
  const push = () => { if (inMap(x, y)) out.push([x, y]); };
  const alongX = () => { while (x !== x1) { x += dx; push(); } };
  const alongY = () => { while (y !== y1) { y += dy; push(); } };
  push();
  if (Math.abs(x1 - x0) >= Math.abs(y1 - y0)) { alongX(); alongY(); } else { alongY(); alongX(); }
  return out;
}

// what one tile of a line costs: { cost, ok } (ok = false: this tile is skipped)
function lineTileCost(tool, x, y) {
  const i = idx(x, y);
  if (tool === 'road') {
    if (city.road[i]) return { ok: false, cost: 0, have: true };
    if (run.occ[i] || isFlooded(x, y)) return { ok: false, cost: 0 };
    let cost = city.terrain[i] === T_WATER ? BRIDGE_PRICE : ROAD_PRICE;
    if (city.terrain[i] === T_FOREST) cost += FOREST_CLEAR_PRICE;
    return { ok: true, cost };
  }
  if (tool === 'embankment') {
    if (!unlocked('embankment')) return { ok: false, cost: 0 };
    const c = placeCheck('embankment', x, y);
    return { ok: c.ok || c.reason === 'Not enough money', cost: c.cost };
  }
  // bulldozer
  const b = buildingAt(x, y);
  if (b) return { ok: true, cost: BULLDOZE_PRICE, b };
  if (city.road[i] && !isHighway(x, y)) return { ok: true, cost: BULLDOZE_PRICE };
  if (city.terrain[i] === T_FOREST) return { ok: true, cost: FOREST_CLEAR_PRICE };
  return { ok: false, cost: 0 };
}

// the cost of the whole line (a building counted once), and the tiles that will change
function linePlan(tool, tiles) {
  let cost = 0;
  const seen = new Set(), steps = [];
  for (const [x, y] of tiles) {
    const c = lineTileCost(tool, x, y);
    if (!c.ok) continue;
    if (c.b) { if (seen.has(c.b.id)) continue; seen.add(c.b.id); }
    cost += c.cost;
    steps.push({ x, y, cost: c.cost, b: c.b });
  }
  return { cost, steps };
}

// builds / clears the line as far as the money goes
function applyLine(tool, tiles) {
  const plan = linePlan(tool, tiles);
  let done = 0, spent = 0, short = false;
  for (const s of plan.steps) {
    if (city.money < s.cost) { short = true; break; }
    const i = idx(s.x, s.y);
    if (tool === 'road') {
      city.road[i] = 1;
      if (city.terrain[i] === T_FOREST) city.terrain[i] = T_GRASS;
      city.money -= s.cost;
    } else if (tool === 'embankment') {
      if (!placeBuilding('embankment', s.x, s.y)) continue;
    } else {
      if (s.b) removeBuilding(s.b);
      else if (city.road[i]) city.road[i] = 0;
      else city.terrain[i] = T_GRASS;
      city.money -= s.cost;
    }
    spent += s.cost;
    done++;
  }
  if (done) {
    run.linksDirty = true;
    if (tool === 'road') GameEvents.emit('roadBuilt', { count: done, cost: spent });
    else if (tool === 'bulldoze') GameEvents.emit('bulldozed', { count: done, cost: spent });
  }
  if (short) GameEvents.emit('cantBuild', { reason: 'Not enough money' });
  else if (!done && tool !== 'embankment') GameEvents.emit('cantBuild', { reason: tool === 'bulldoze' ? 'Nothing to remove here' : 'Can\'t build a road here' });
  return done;
}

// ---------- the info panel's buttons ----------

function repairCost(b) { return Math.round(def(b).price * REPAIR_SHARE); }
function repair(b) {
  if (!b.damaged || b.fire) return false;
  const cost = repairCost(b);
  if (city.money < cost) { GameEvents.emit('cantBuild', { reason: 'Not enough money' }); return false; }
  city.money -= cost;
  b.damaged = false;
  run.happyDirty = true;
  GameEvents.emit('repaired', { b, cost });
  return true;
}
function damagedBuildings() { return city.buildings.filter((b) => b.damaged && !b.fire && !b.ruin); }
function repairAllCost() { return damagedBuildings().reduce((s, b) => s + repairCost(b), 0); }
function repairAll() {
  let n = 0;
  for (const b of damagedBuildings()) {
    if (city.money < repairCost(b)) { GameEvents.emit('cantBuild', { reason: 'Not enough money' }); break; }
    city.money -= repairCost(b);
    b.damaged = false;
    n++;
  }
  if (n) { run.happyDirty = true; GameEvents.emit('repaired', { count: n }); }
  return n;
}
function demolish(b) {
  if (city.money < BULLDOZE_PRICE) { GameEvents.emit('cantBuild', { reason: 'Not enough money' }); return false; }
  city.money -= BULLDOZE_PRICE - Math.round(def(b).price * DEMOLISH_REFUND);
  removeBuilding(b);
  GameEvents.emit('bulldozed', { count: 1, cost: BULLDOZE_PRICE });
  return true;
}
