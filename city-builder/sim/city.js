'use strict';

// City Builder — the city's life, month by month: jobs, happiness, residents moving in and out,
// houses growing, taxes and upkeep, debt and bankruptcy, the milestones. Also the clock that turns
// game seconds into months. Used by game.js (cityUpdate each frame) and the info / budget panels
// (houseHappiness, the stats).

function isWorking(b) { return b.connected && !b.damaged && !b.ruin && !b.fire; }
function jobsOf(b) { return isWorking(b) ? def(b).jobs || 0 : 0; }

// the nearest fire station covering a tile, or null
function coveringStation(x, y) {
  let best = null, bestD = Infinity;
  for (const s of city.buildings) {
    if (s.type !== 'fireStation' || s.ruin) continue;
    const d = distToRect(x + 0.5, y + 0.5, s.x, s.y, 2, 2);
    if (d <= BUILDINGS.fireStation.cover && d < bestD) { best = s; bestD = d; }
  }
  return best;
}

// a house's happiness and what it is made of: { value, parts: [{ text, delta }] }
function houseHappiness(h) {
  const parts = [];
  const cx = h.x + 0.5, cy = h.y + 0.5;
  // one of each kind counts (the strongest); every factory after the first adds a little more smoke
  const best = {};
  let factories = 0;
  for (const b of city.buildings) {
    const d = def(b);
    if (!d.effect || !isWorking(b)) continue;
    if (distToRect(cx, cy, b.x, b.y, d.w, d.h) > d.effect.radius) continue;
    if (b.type === 'factory') factories++;
    if (!best[b.type] || Math.abs(d.effect.happy) > Math.abs(best[b.type])) best[b.type] = d.effect.happy;
  }
  const label = { shop: 'Shop nearby', park: 'Park nearby', school: 'School nearby', stadium: 'Stadium nearby',
    factory: 'Factory smoke', airport: 'Airport noise' };
  for (const type in best) {
    let delta = best[type];
    if (type === 'factory') delta -= Math.min(HAPPY_FACTORY_MAX + delta, (factories - 1) * HAPPY_EXTRA_FACTORY);
    parts.push({ text: label[type], delta });
  }
  if (coveringStation(h.x, h.y)) parts.push({ text: 'Fire station nearby', delta: HAPPY_FIRE_COVER });
  const u = city.stats.unemployment;
  if (u > 0.02) parts.push({ text: 'Not enough jobs', delta: -Math.round(u * HAPPY_UNEMPLOYMENT) });
  if (city.tax !== TAX_DEFAULT) parts.push({ text: city.tax > TAX_DEFAULT ? 'High taxes' : 'Low taxes', delta: (TAX_DEFAULT - city.tax) * HAPPY_TAX });
  if (h.damaged) parts.push({ text: 'Damaged', delta: -100 });
  const value = clamp(HAPPY_BASE + parts.reduce((s, p) => s + p.delta, 0), 0, 100);
  return { value, parts };
}

// population, jobs and happiness from the buildings as they are now (also between the months,
// so the HUD and the overlay follow what is built at once)
function refreshStats() {
  updateLinks();
  const st = city.stats;
  let pop = 0, jobs = 0;
  for (const b of city.buildings) {
    if (b.type === 'house') pop += b.residents;
    jobs += jobsOf(b);
  }
  st.population = pop;
  st.jobs = jobs;
  st.workforce = Math.round(pop * WORKER_SHARE);
  st.employed = Math.min(st.workforce, jobs);
  st.unemployment = st.workforce > 0 ? (st.workforce - st.employed) / st.workforce : 0;
  for (const b of city.buildings) b.workers = jobs > 0 ? Math.round(jobsOf(b) * st.employed / jobs) : 0;
  if (run.happyDirty) {
    run.happyDirty = false;
    for (const b of city.buildings) if (b.type === 'house') b.happy = houseHappiness(b).value;
  }
}

// how strongly new residents are drawn in: free jobs pull them, unemployment holds them back
function demand() {
  const st = city.stats;
  const free = st.jobs - st.workforce;
  const airports = city.buildings.filter((b) => b.type === 'airport' && isWorking(b)).length;
  return clamp(0.5 + free / Math.max(8, st.workforce * 0.25), DEMAND_MIN, DEMAND_MAX) + airports * (BUILDINGS.airport.arrivals - 1);
}

function monthStep() {
  run.happyDirty = true;
  refreshStats();
  const st = city.stats;
  const dem = demand();
  const schoolNear = (h) => city.buildings.some((s) => s.type === 'school' && isWorking(s) &&
    distToRect(h.x + 0.5, h.y + 0.5, s.x, s.y, 2, 2) <= BUILDINGS.school.effect.radius);

  // residents and houses
  for (const h of city.buildings) {
    if (h.type !== 'house') continue;
    const cap = HOUSE_CAPACITY[h.level];
    if (!h.connected || h.damaged || h.ruin) { h.residents = 0; continue; }
    if (h.happy < LEAVE_HAPPINESS) {
      h.residents -= Math.ceil(h.residents * 0.2);
    } else if (h.happy >= MOVE_IN_HAPPINESS && h.residents < cap) {
      const free = cap - h.residents;
      const want = free * ARRIVE_RATE * dem * (0.5 + h.happy / 100);
      h.residents = Math.min(cap, h.residents + Math.max(1, Math.floor(want + Math.random())));
    }
    // growing up a level, or down
    if (h.residents >= cap && h.happy >= GROW_HAPPINESS) h.happyMonths++;
    else h.happyMonths = 0;
    h.sadMonths = h.happy < SHRINK_HAPPINESS ? h.sadMonths + 1 : 0;
    if (h.happyMonths >= GROW_MONTHS && h.level < 3 && st.unemployment <= GROW_MAX_UNEMPLOYMENT && (h.level < 2 || schoolNear(h))) {
      h.level++;
      h.happyMonths = 0;
      GameEvents.emit('houseGrew', { b: h });
    } else if (h.sadMonths >= SHRINK_MONTHS && h.level > 1) {
      h.level--;
      h.sadMonths = 0;
      h.residents = Math.min(h.residents, HOUSE_CAPACITY[h.level]);
    }
  }
  run.happyDirty = true;
  refreshStats();

  // money
  const dif = DIFFICULTY[city.difficulty];
  st.taxRes = Math.round(st.population * city.tax / 100 * TAX_PER_RESIDENT * dif.taxMul);
  st.taxBiz = Math.round(st.employed * city.tax / 100 * TAX_PER_WORKER * dif.taxMul);
  let roads = 0;
  for (let i = 0; i < city.road.length; i++) if (city.road[i]) roads += city.terrain[i] === T_WATER ? BRIDGE_UPKEEP : ROAD_UPKEEP;
  st.upkeepRoads = Math.round(roads * dif.upkeepMul);
  st.upkeepBuildings = Math.round(city.buildings.reduce((s, b) => s + (b.ruin ? 0 : def(b).upkeep), 0) * dif.upkeepMul);
  st.income = st.taxRes + st.taxBiz;
  st.expense = st.upkeepRoads + st.upkeepBuildings;
  city.money += st.income - st.expense;
  city.month++;
  GameEvents.emit('month', { income: st.income, expense: st.expense });

  // debt
  if (city.money < 0) {
    city.debtMonths++;
    if (city.debtMonths >= dif.debtMonths) { GameEvents.emit('bankrupt', {}); return; }
    GameEvents.emit('debt', { left: dif.debtMonths - city.debtMonths });
  } else {
    city.debtMonths = 0;
  }

  // milestones
  while (city.milestone + 1 < MILESTONES.length && st.population >= MILESTONES[city.milestone + 1].pop) {
    city.milestone++;
    const m = MILESTONES[city.milestone];
    const record = city.cheated ? null : Storage.recordMilestone(city.difficulty, m.id, city.month);
    GameEvents.emit('milestone', { index: city.milestone, months: city.month, record });
  }
  if (!city.cheated) Storage.recordPopulation(city.difficulty, st.population);

  monthDisasters();
}

// advances the clock by dt game seconds (already multiplied by the speed)
function cityUpdate(dt) {
  run.time += dt;
  city.tick += dt;
  while (city.tick >= MONTH_SECONDS) {
    city.tick -= MONTH_SECONDS;
    monthStep();
  }
  refreshStats();
  disastersUpdate(dt);
}

// the date as { month: 0..11, year: 1.. }
function cityDate() { return { month: city.month % MONTHS_PER_YEAR, year: Math.floor(city.month / MONTHS_PER_YEAR) + 1 }; }
