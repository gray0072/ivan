'use strict';

// City Builder — fires and floods. A fire burns a building down unless a fire station's truck,
// driving along the roads, gets there first; it may jump to the neighbours. A spring flood spreads
// from the water over the shore (an embankment stops it) and damages what it reaches.
// Used by sim/city.js (monthDisasters, disastersUpdate) and the cheats in game.js.

function rectGap(a, b) {
  const da = def(a), db = def(b);
  const gx = Math.max(a.x - (b.x + db.w), b.x - (a.x + da.w), 0);
  const gy = Math.max(a.y - (b.y + db.h), b.y - (a.y + da.h), 0);
  return Math.max(gx, gy);
}
function canBurn(b) { return def(b).burns && !b.ruin && !b.fire; }

// once a month: maybe a fire, maybe (in spring) a flood
function monthDisasters() {
  if (city.milestone < DISASTER_MILESTONE) return;
  const dif = DIFFICULTY[city.difficulty];
  if (Math.random() < 1 / dif.fireMonths) startFire();
  if (!city.flood && SPRING_MONTHS.includes(cityDate().month) && Math.random() < 1 / (dif.floodYears * SPRING_MONTHS.length)) startFlood();
}

// sets a random building (factories more often) or `b` on fire
function startFire(b) {
  if (!b) {
    const list = city.buildings.filter(canBurn);
    if (!list.length) return null;
    const w = list.map((x) => (x.type === 'factory' ? FIRE_FACTORY_WEIGHT : 1));
    let r = Math.random() * w.reduce((s, v) => s + v, 0);
    b = list.find((x, i) => (r -= w[i]) < 0) || list[0];
  }
  b.fire = 0.001;
  b.spreadT = 0;
  run.happyDirty = true;
  GameEvents.emit('fire', { b });
  return b;
}

function burnDown(b) {
  b.fire = 0;
  b.ruin = true;
  b.damaged = false;
  b.residents = 0;
  b.level = Math.min(b.level, 1);
  run.happyDirty = true;
  GameEvents.emit('burnedDown', { b });
}

// a truck for a burning building from the nearest free station covering it, along the roads
function dispatch(b) {
  if (run.trucks.some((t) => t.target === b)) return;
  const st = coveringStation(b.x, b.y);
  if (!st || st.damaged || st.fire || run.trucks.some((t) => t.station === st)) return;
  const path = roadPath(roadsAround(st), roadsAround(b));
  if (!path) return;
  run.trucks.push({ station: st, target: b, path, pos: 0, state: 'go', t: 0 });
  GameEvents.emit('truckOut', { b });
}

function fireUpdate(dt) {
  for (const b of city.buildings) {
    if (!b.fire) continue;
    b.fire += dt;
    dispatch(b);
    b.spreadT = (b.spreadT || 0) + dt;
    if (b.spreadT >= FIRE_SPREAD_EVERY) {
      b.spreadT = 0;
      if (Math.random() < FIRE_SPREAD_CHANCE) {
        const near = city.buildings.filter((n) => n !== b && canBurn(n) && rectGap(b, n) <= FIRE_SPREAD_GAP);
        if (near.length) { const n = pick(near); n.fire = 0.001; n.spreadT = 0; GameEvents.emit('fireSpread', { b: n }); }
      }
    }
    if (b.fire >= FIRE_BURN_TIME) burnDown(b);
  }
  for (let i = run.trucks.length - 1; i >= 0; i--) {
    const t = run.trucks[i];
    if (t.state === 'go' && !t.target.fire) {
      // burnt down (or out) before the truck got there: turn back
      t.path = t.path.slice(0, Math.floor(t.pos) + 1).reverse();
      t.pos = 0;
      t.state = 'back';
    }
    if (t.state === 'go' || t.state === 'back') {
      t.pos += TRUCK_SPEED * dt;
      if (t.pos >= t.path.length - 1) {
        t.pos = t.path.length - 1;
        if (t.state === 'back') { run.trucks.splice(i, 1); continue; }
        t.state = 'work';
        t.t = 0;
      }
    } else if (t.state === 'work') {
      t.t += dt;
      if (t.t >= EXTINGUISH_TIME) {
        if (t.target.fire) {
          t.target.fire = 0;
          t.target.damaged = true;
          run.happyDirty = true;
          GameEvents.emit('extinguished', { b: t.target });
        }
        t.path = t.path.slice().reverse();
        t.pos = 0;
        t.state = 'back';
      }
    }
  }
}

// ---------- floods ----------

function startFlood() {
  const N = MAP_SIZE * MAP_SIZE;
  const reach = randInt(FLOOD_REACH_MIN, FLOOD_REACH_MAX);
  const dist = new Int8Array(N).fill(-1);
  const blocked = (i) => { const b = run.byId.get(run.occ[i]); return b && b.type === 'embankment'; };
  let ring = [];
  for (let i = 0; i < N; i++) if (city.terrain[i] === T_WATER) ring.push(i);
  const seen = new Uint8Array(N);
  for (const i of ring) seen[i] = 1;
  for (let step = 0; step < reach; step++) {
    const next = [];
    for (const i of ring) {
      const x = i % MAP_SIZE, y = (i / MAP_SIZE) | 0;
      for (const [dx, dy] of DIRS) {
        if (!inMap(x + dx, y + dy)) continue;
        const j = idx(x + dx, y + dy);
        if (seen[j]) continue;
        seen[j] = 1;
        if (blocked(j)) continue;
        dist[j] = step;
        next.push(j);
      }
    }
    ring = next;
  }
  city.flood = { reach, level: 0, phase: 'rise', t: 0, dist, hit: 0 };
  GameEvents.emit('flood', {});
}

function floodUpdate(dt) {
  const f = city.flood;
  if (!f) return;
  f.t += dt;
  if (f.phase === 'rise') {
    f.level = f.reach * Math.min(1, f.t / FLOOD_RISE_TIME);
    let hit = 0;
    for (const b of city.buildings) {
      if (b.damaged || b.ruin || b.type === 'embankment') continue;
      const d = def(b);
      let wet = false;
      for (let y = b.y; y < b.y + d.h && !wet; y++) for (let x = b.x; x < b.x + d.w && !wet; x++) wet = isFlooded(x, y);
      if (wet) { b.damaged = true; b.fire = 0; hit++; }
    }
    if (hit) { f.hit += hit; run.happyDirty = true; GameEvents.emit('floodDamage', { count: hit }); }
    if (f.t >= FLOOD_RISE_TIME) { f.phase = 'hold'; f.t = 0; }
  } else if (f.phase === 'hold') {
    if (f.t >= FLOOD_HOLD) { f.phase = 'fall'; f.t = 0; }
  } else {
    f.level = f.reach * Math.max(0, 1 - f.t / FLOOD_RISE_TIME);
    if (f.t >= FLOOD_RISE_TIME) { city.flood = null; GameEvents.emit('floodOver', { hit: f.hit }); }
  }
}

function disastersUpdate(dt) {
  fireUpdate(dt);
  floodUpdate(dt);
}
