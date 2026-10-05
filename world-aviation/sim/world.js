'use strict';

// ============================================================
// World Aviation — the world: airports with runways, taxi networks
// and gates, plus the weather at each of them.
//
// Every airport is laid out from its real position and runway heading,
// in runway-local coordinates (see LAYOUT in constants.js):
//
//   t      metres along the runway from its middle, positive towards the
//          departure end (the runway is flown from t = -half to +half)
//   across metres to the right of the centreline
//
//   runway            across = 0
//   parallel taxiway  across = TWY_OFFSET, with exits and the holding point
//   apron lane        across = APRON_LANE, gate stands at across = STAND
//   terminal          across = TERMINAL
//
// The taxi network is a small graph so the game can route from a gate to
// the holding point and from a runway exit back to a gate, and give
// centreline guidance while you taxi.
//
// World.list / World.byId hold every airport's static data (for the career
// and the screens). World.prepare(from, to) builds one flight's world: the
// projection around the route, the terrain, and the airports in that area
// with their positions and layouts (World.airports / World.here).
// ============================================================

const RWY_HALF_WIDTH = LAYOUT.RWY_HALF_WIDTH;

const World = {
  list: [],           // every airport, static data
  byId: {},
  airports: [],       // the airports of the current flight's world, placed and laid out
  here: {},
  key: '',

  init() {
    this.list = AIRPORTS.map((def) => this.meta(def));
    this.byId = {};
    for (const a of this.list) this.byId[a.id] = a;
  },

  // static data of an airport: everything that does not depend on where the world is centred
  meta(def) {
    const hdgDeg = (def.rwy * 10) % 360;
    return Object.assign({}, def, {
      rwyName: String(def.rwy).padStart(2, '0'),
      rwyOpposite: String(((def.rwy + 17) % 36) + 1).padStart(2, '0'),
      hdg: hdgDeg * DEG, hdgDeg, half: def.rwyLen / 2, rwyHalfWidth: RWY_HALF_WIDTH,
      mountainous: !!def.mountainous, arctic: !!def.arctic,
      gateCount: def.terminal === 'big' ? 4 : def.terminal === 'medium' ? 3 : 2
    });
  },

  // Build the world of a flight from one airport to another
  prepare(fromId, toId) {
    const key = fromId + '>' + toId;
    if (this.key === key) return;
    const a = this.byId[fromId], b = this.byId[toId];
    Theatre.setRoute(a.lat, a.lon, b.lat, b.lon);
    const pa = Theatre.toWorld(a.lat, a.lon), pb = Theatre.toWorld(b.lat, b.lon);
    const S = WORLD.SCALE * 1000, m = WORLD.MARGIN_KM * S, half = WORLD.MIN_SPAN_KM * S / 2;
    const cx = (pa.x + pb.x) / 2, cz = (pa.z + pb.z) / 2;
    const box = {
      x0: Math.min(pa.x - m, pb.x - m, cx - half), x1: Math.max(pa.x + m, pb.x + m, cx + half),
      z0: Math.min(pa.z - m, pb.z - m, cz - half), z1: Math.max(pa.z + m, pb.z + m, cz + half)
    };
    TERRAIN.aptGrid = null;
    Terrain.build(box);
    // the airports inside the area (not the far side of the globe)
    this.airports = [];
    this.here = {};
    for (const meta of this.list) {
      if (geoDistanceNm(meta.lat, meta.lon, Theatre.lat0, Theatre.lon0) > 4000) continue;
      const p = Theatre.toWorld(meta.lat, meta.lon);
      if (p.x < box.x0 || p.x > box.x1 || p.z < box.z0 || p.z > box.z1) continue;
      const placed = this.makeAirport(meta, p);
      this.airports.push(placed);
      this.here[meta.id] = placed;
    }
    Terrain.buildAirportGrid(this.airports);
    this.key = key;
  },

  // world point from runway-local coordinates
  at(a, t, across) {
    return { x: a.x + a.dirX * t + a.perX * across, z: a.z + a.dirZ * t + a.perZ * across };
  },
  // runway-local coordinates of a world point
  local(a, x, z) {
    const dx = x - a.x, dz = z - a.z;
    return { t: dx * a.dirX + dz * a.dirZ, across: dx * a.perX + dz * a.perZ };
  },

  // an airport placed in the current flight's world, with its runway, taxiways, gates and buildings
  makeAirport(meta, p) {
    const hdg = meta.hdg;
    const a = Object.assign({}, meta, {
      x: p.x, z: p.z,
      dirX: hdgX(hdg), dirZ: hdgZ(hdg),
      perX: hdgX(hdg + Math.PI / 2), perZ: hdgZ(hdg + Math.PI / 2)
    });
    const r = a.half + LAYOUT.CORRIDOR_LEN, o = LAYOUT.TERMINAL + 1800;
    a.flattenR2 = r * r + o * o;
    a.thr = this.at(a, -a.half, 0);         // the threshold: take-off and landing start here
    a.end = this.at(a, a.half, 0);          // the far end of the runway

    const gates = a.gateCount;
    a.apronT0 = -a.half + a.rwyLen * LAYOUT.APRON_START;
    a.apronT1 = a.apronT0 + gates * LAYOUT.GATE_SPACING + 160;
    a.apronT = (a.apronT0 + a.apronT1) / 2;

    this.buildNetwork(a, gates);
    this.buildBuildings(a);
    return a;
  },

  buildNetwork(a, gateCount) {
    const L = LAYOUT;
    const nodes = {};
    a.nodes = nodes;
    a.nodeList = [];
    const add = (id, t, across, kind) => {
      const p = this.at(a, t, across);
      const n = { id, x: p.x, z: p.z, t, across, kind, edges: [] };
      nodes[id] = n;
      a.nodeList.push(n);
      return n;
    };
    const link = (id1, id2, kind, width) => {
      const n1 = nodes[id1], n2 = nodes[id2];
      const w = width || L.TWY_WIDTH;
      n1.edges.push({ to: n2, kind, width: w });
      n2.edges.push({ to: n1, kind, width: w });
    };

    const t0 = -a.half + L.HOLD_T;
    add('rwyStart', t0, 0, 'lineup');
    add('hold', t0, L.HOLD_OFFSET, 'hold');
    add('twyStart', t0, L.TWY_OFFSET, 'taxi');
    link('rwyStart', 'hold', 'connector');
    link('hold', 'twyStart', 'connector');

    const rwyChain = ['rwyStart'];
    const twyChain = [nodes.twyStart];
    a.exits = [];
    L.EXITS.forEach((f, i) => {
      const t = -a.half + a.rwyLen * f;
      add('exR' + i, t, 0, 'exit');
      twyChain.push(add('exT' + i, t, L.TWY_OFFSET, 'taxi'));
      link('exR' + i, 'exT' + i, 'connector');
      rwyChain.push('exR' + i);
      a.exits.push(nodes['exR' + i]);
    });
    add('rwyEnd', a.half - 60, 0, 'exit');
    twyChain.push(add('twyEnd', a.half - 60, L.TWY_OFFSET, 'taxi'));
    link('rwyEnd', 'twyEnd', 'connector');
    rwyChain.push('rwyEnd');
    a.exits.push(nodes.rwyEnd);
    for (let i = 0; i + 1 < rwyChain.length; i++) link(rwyChain[i], rwyChain[i + 1], 'runway', RWY_HALF_WIDTH * 2);

    // the apron: a lane in front of the stands, joined to the taxiway at both ends
    const laneChain = [];
    laneChain.push(add('laneA', a.apronT0 + 40, L.APRON_LANE, 'apron'));
    laneChain.push(add('laneB', a.apronT1 - 40, L.APRON_LANE, 'apron'));
    twyChain.push(add('apA', a.apronT0 + 40, L.TWY_OFFSET, 'taxi'));
    twyChain.push(add('apB', a.apronT1 - 40, L.TWY_OFFSET, 'taxi'));
    link('laneA', 'apA', 'taxi');
    link('laneB', 'apB', 'taxi');

    a.gates = [];
    for (let i = 0; i < gateCount; i++) {
      const t = a.apronT0 + 80 + (i + 0.5) * L.GATE_SPACING;
      const lane = add('lane' + i, t, L.APRON_LANE, 'apron');
      const stand = add('stand' + i, t, L.STAND, 'gate');
      link('lane' + i, 'stand' + i, 'stand', 40);
      laneChain.push(lane);
      a.gates.push({
        id: a.id + '-' + (i + 1), name: 'Gate ' + (i + 1), number: i + 1, index: i,
        t, standX: stand.x, standZ: stand.z,
        parkHdg: (a.hdgDeg + 90) % 360,              // nose-in, facing the terminal
        laneNode: lane, node: stand
      });
    }
    // chain the taxiway and the apron lane in order along the runway
    twyChain.sort((p, q) => p.t - q.t);
    for (let i = 0; i + 1 < twyChain.length; i++) link(twyChain[i].id, twyChain[i + 1].id, 'taxi');
    laneChain.sort((p, q) => p.t - q.t);
    for (let i = 0; i + 1 < laneChain.length; i++) link(laneChain[i].id, laneChain[i + 1].id, 'apron', 40);

    // the paved surface, for the cheap ground test at 60 Hz
    a.apronRect = { t0: a.apronT0, t1: a.apronT1, a0: L.APRON_LANE - 45, a1: L.STAND + 40 };
    a.twySegs = [];
    const seen = {};
    for (const n of a.nodeList) {
      for (const e of n.edges) {
        if (e.kind === 'runway') continue;              // the runway has its own rectangle test
        const key = n.id < e.to.id ? n.id + '|' + e.to.id : e.to.id + '|' + n.id;
        if (seen[key]) continue;
        seen[key] = 1;
        a.twySegs.push({ x1: n.x, z1: n.z, x2: e.to.x, z2: e.to.z, w: e.width, kind: e.kind });
      }
    }
  },

  buildBuildings(a) {
    const L = LAYOUT;
    const b = [];
    // along / acrossSize are the building's size along the runway and across it
    const put = (t, across, along, acrossSize, h, kind) => {
      const p = this.at(a, t, across);
      b.push({ x: p.x, z: p.z, t, across, along, acrossSize, h, kind });
    };
    const term = a.terminal;
    const h = term === 'big' ? 22 : term === 'medium' ? 16 : 11;
    put(a.apronT, L.TERMINAL, a.apronT1 - a.apronT0 - 60, 60, h, 'terminal');
    put(a.apronT1 + 50, L.TERMINAL, 14, 14, 32, 'tower');
    for (let i = 0; i < (term === 'big' ? 3 : 2); i++) {
      put(a.apronT0 - 60 - i * 95, L.TERMINAL - 10, 80, 70, 14, 'hangar');
    }
    put(a.apronT1 + 160, L.STAND, 60, 60, 10, 'fuel');
    put(a.apronT1 + 270, L.STAND + 20, 110, 60, 9, 'warehouse');
    a.buildings = b;
  },

  // which runway exit to take: the first one still ahead of t
  exitAhead(a, t) {
    for (const n of a.exits) if (n.t > t + 30) return n;
    return a.exits[a.exits.length - 1];
  },

  // Dijkstra over the airport node graph
  findRoute(a, startNode, endNode) {
    if (!startNode || !endNode) return [];
    const dist = new Map(), prev = new Map(), done = new Set();
    for (const n of a.nodeList) dist.set(n, Infinity);
    dist.set(startNode, 0);
    while (true) {
      let best = null, bestD = Infinity;
      for (const n of a.nodeList) {
        if (done.has(n)) continue;
        const d = dist.get(n);
        if (d < bestD) { bestD = d; best = n; }
      }
      if (!best || best === endNode) break;
      done.add(best);
      for (const e of best.edges) {
        const w = Math.hypot(e.to.x - best.x, e.to.z - best.z) * (e.kind === 'runway' ? 4 : 1);
        const nd = bestD + w;
        if (nd < dist.get(e.to)) { dist.set(e.to, nd); prev.set(e.to, best); }
      }
    }
    if (dist.get(endNode) === Infinity) return [startNode];
    const path = [];
    let cur = endNode, guard = 0;
    while (cur && guard++ < 200) { path.unshift(cur); cur = prev.get(cur); }
    return path;
  },

  // Where am I on this route, and where do I steer next? `look` (metres) adds a carrot: the
  // point that far ahead along the route line, so following it keeps you on the line.
  routeProgress(a, route, x, z, look) {
    if (!route || route.length < 2) return null;
    let bestSeg = 0, bestT = 0, bestD2 = Infinity, total = 0, acc = 0;
    const lens = [];
    for (let i = 0; i < route.length - 1; i++) {
      const l = Math.hypot(route[i + 1].x - route[i].x, route[i + 1].z - route[i].z);
      lens.push(l); total += l;
    }
    for (let i = 0; i < route.length - 1; i++) {
      const p1 = route[i], p2 = route[i + 1];
      const dx = p2.x - p1.x, dz = p2.z - p1.z;
      const len2 = dx * dx + dz * dz || 1;
      let t = ((x - p1.x) * dx + (z - p1.z) * dz) / len2;
      t = clamp(t, 0, 1);
      const cx = p1.x + t * dx, cz = p1.z + t * dz;
      const d2 = (x - cx) * (x - cx) + (z - cz) * (z - cz);
      if (d2 < bestD2) { bestD2 = d2; bestSeg = i; bestT = t; }
      acc += lens[i];
    }
    let done = 0;
    for (let i = 0; i < bestSeg; i++) done += lens[i];
    done += lens[bestSeg] * bestT;
    const nextIdx = Math.min(bestSeg + 1, route.length - 1);
    const tgt = route[nextIdx];
    // walk `look` metres along the route from the closest point
    let carrot = null;
    if (look) {
      let s = done + look, i = 0;
      while (i < lens.length - 1 && s > lens[i]) { s -= lens[i]; i++; }
      const f = clamp(s / (lens[i] || 1), 0, 1);
      carrot = { x: lerp(route[i].x, route[i + 1].x, f), z: lerp(route[i].z, route[i + 1].z, f) };
    }
    return {
      carrot,
      deviation: Math.sqrt(bestD2),
      progress: total > 0 ? done / total : 1,
      remaining: Math.max(0, total - done),
      target: tgt,
      final: nextIdx === route.length - 1,
      distToTarget: Math.hypot(tgt.x - x, tgt.z - z),
      totalLength: total
    };
  },

  // ---------- Weather ----------
  weatherFor(a, rng, difficulty, opts) {
    opts = opts || {};
    const lat = a.lat;
    const month = opts.month !== undefined ? opts.month : rng.int(0, 11);
    const season = Math.cos((month - 6.5) / 12 * TAU) * (lat < 0 ? -1 : 1);   // +1 midsummer, -1 midwinter
    const baseTemp = seasonTemp(lat, season) - a.elev * 0.0065;
    const temp = baseTemp + rng.range(-3.5, 3.5);
    const stormy = rng.chance(difficulty.id === 'hard' ? WEATHER.STORM_CHANCE_HARD : 0.16);
    const lowCloud = rng.chance(a.arctic ? 0.45 : 0.3);
    const qnh = Math.round(rng.range(WEATHER.QNH_RANGE[0], WEATHER.QNH_RANGE[1]));
    // the runway in use is the one into the wind, so the wind blows from roughly ahead
    const dir = (a.hdgDeg + rng.range(-WEATHER.WIND_OFF_RUNWAY_MAX, WEATHER.WIND_OFF_RUNWAY_MAX) + 360) % 360;
    let speed = rng.range(WEATHER.WIND_SURFACE_MIN, stormy ? 26 : 15) * (0.75 + (a.arctic ? 0.35 : 0));
    speed *= difficulty.windFactor;
    const gust = (stormy ? rng.range(10, WEATHER.GUST_MAX) : rng.range(0, 6)) * difficulty.windFactor;
    const turbulence = clamp((stormy ? 1.1 : 0.5) * difficulty.turbulence * rng.range(0.7, 1.3) +
      (a.mountainous ? 0.35 : 0), 0, 2.2);
    const vis = Math.round(lowCloud ? rng.range(WEATHER.VIS_POOR, 9000) : rng.range(12000, WEATHER.VIS_GOOD));
    const cloudBase = Math.round(lowCloud ? rng.range(WEATHER.CLOUD_BASE_MIN, 1600) : rng.range(2600, WEATHER.CLOUD_BASE_MAX));
    const cloudTop = Math.round(cloudBase + rng.range(1100, 3400));
    const precip = lowCloud && vis < 9000 ? (temp < WEATHER.SNOW_TEMP_THRESHOLD ? 'snow' : 'rain') : 'none';
    const icing = temp - 6.5 * cloudBase / 1000 < WEATHER.ICING_TEMP_MAX && temp > WEATHER.ICING_TEMP_MIN;
    return {
      dir, speed, gust, turbulence, qnh, temp, vis, cloudBase, cloudTop,
      precip, icing, stormy, lowCloud, snow: precip === 'snow'
    };
  },

  cruiseWeather(rng, difficulty, lat) {
    const stormy = rng.chance(difficulty.id === 'hard' ? 0.55 : 0.3);
    return {
      dir: rng.range(0, 360),
      speed: rng.range(WEATHER.WIND_ALT_MIN, stormy ? WEATHER.WIND_ALT_MAX : 52),
      gust: stormy ? rng.range(15, 40) : rng.range(0, 12),
      turbulence: stormy ? 1.5 * difficulty.turbulence : 0.35 * difficulty.turbulence,
      temp: seasonTemp(lat, 0) - 16 + rng.range(-6, 2),
      stormy, cells: stormy ? rng.int(1, 3) : 0
    };
  }
};

// Mean temperature at sea level for a latitude and a season (-1 midwinter .. +1 midsummer), deg C
function seasonTemp(lat, season) {
  const a = Math.abs(lat);
  return 28 - 0.5 * Math.max(0, a - 15) + season * (1 + 0.18 * a);
}
