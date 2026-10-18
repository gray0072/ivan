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
//   parallel taxiway  across = TWY_OFFSET, with the holding point, the rapid
//                     exits slanting onto it ahead and the last exit square
//   apron lane        across = APRON_LANE, gate stands at across = STAND
//   terminal          across = TERMINAL (and past the terminals, along the
//                     same apron, the tower, the cargo stands and their cargo
//                     terminal or shed, then the general aviation and rescue
//                     area: the GA stands, the air ambulance's stand, the
//                     helicopter pads, the fire station)
//
// The taxi network is a small graph so the game can route from a gate to
// the holding point and from a runway exit back to a gate (the quickest
// way, sharp turns avoided), and give centreline guidance while you taxi.
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
    // the terminals and their stands by the airport's size and runway (LAYOUT.TERMINAL_PLANS):
    // from one terminal with one stand (tiny) to three terminals of five (big, a long runway)
    let plan = null;
    for (const p of LAYOUT.TERMINAL_PLANS[def.terminal] || LAYOUT.TERMINAL_PLANS.small) if (def.rwyLen >= p[0] || !plan) plan = p;
    const terminals = plan[1], gatesPerTerminal = plan[2], cargoStands = plan[3] || 1;
    const size = def.terminal || 'small';
    const paxGates = terminals * gatesPerTerminal, gaStands = LAYOUT.GA_STANDS[size] || 2;
    return Object.assign({}, def, {
      rwyName: String(def.rwy).padStart(2, '0'),
      rwyOpposite: String(((def.rwy + 17) % 36) + 1).padStart(2, '0'),
      hdg: hdgDeg * DEG, hdgDeg, half: def.rwyLen / 2, rwyHalfWidth: RWY_HALF_WIDTH,
      mountainous: !!def.mountainous, arctic: !!def.arctic,
      // a remote strip: an airfield of the bush operators alone (render/ga3d.js dresses it so)
      remote: def.aptClass.length === 1 && def.aptClass[0] === 'bush',
      // the stands: the terminals' first (paxGates), then the cargo stands, the GA stands (gaFirst
      // on) and the air ambulance's stand last (medevacGate); gateCount in all
      terminals, gatesPerTerminal, paxGates, cargoStands,
      gaFirst: paxGates + cargoStands, gaStands, medevacGate: paxGates + cargoStands + gaStands,
      pads: LAYOUT.GA_PADS[size] || 1,
      gateCount: paxGates + cargoStands + gaStands + 1
    });
  },
  // the terminal (1, 2, 3) of a stand, by its index, 'C' for a cargo stand, 'G' for one in the
  // general aviation and rescue area (the air ambulance's too)
  terminalOf(a, i) { return i >= a.gaFirst ? 'G' : i >= a.paxGates ? 'C' : Math.floor(i / a.gatesPerTerminal) + 1; },
  // the part of the apron a stand is in: 'pax' (a terminal's), 'cargo', 'ga' or 'medevac'
  zoneOf(a, i) { return i >= a.medevacGate ? 'medevac' : i >= a.gaFirst ? 'ga' : i >= a.paxGates ? 'cargo' : 'pax'; },
  // does a contract carry freight (from and to the cargo stands), not passengers or a patient?
  freight(c) { return !!c && c.type !== 'pax' && c.type !== 'medevac'; },
  // where a contract's flight parks: the bush and air ambulance operators work from the GA stands
  // (a patient from and to the air ambulance's stand) in a type small enough for them
  // (LAYOUT.GA_MAX_SPAN; a bigger one carries their freight from the cargo stands and a patient
  // from a terminal's gate); other freight goes from and to the cargo stands, passengers the terminals
  zoneFor(c) {
    const ac = c && AIRCRAFT.find((x) => x.id === c.aircraftId);
    if (c && (c.faction === 'bush' || c.type === 'medevac') && (!ac || ac.dims.span <= LAYOUT.GA_MAX_SPAN)) {
      return c.type === 'medevac' ? 'medevac' : 'ga';
    }
    return this.freight(c) ? 'cargo' : 'pax';
  },
  // a flight's stands, drawn when its contract is made (zone: zoneFor): passengers from the
  // terminal nearest the departure end of the runway (T1, the first along it) to any gate; freight
  // from a cargo stand to a cargo stand, bush work from a GA stand to a GA stand, a patient from
  // the air ambulance's stand to the air ambulance's stand
  pickGates(from, to, rng, zone) {
    if (zone === 'cargo') return { depGate: from.paxGates + rng.int(0, from.cargoStands - 1), arrGate: to.paxGates + rng.int(0, to.cargoStands - 1) };
    if (zone === 'ga') return { depGate: from.gaFirst + rng.int(0, from.gaStands - 1), arrGate: to.gaFirst + rng.int(0, to.gaStands - 1) };
    if (zone === 'medevac') return { depGate: from.medevacGate, arrGate: to.medevacGate };
    return { depGate: rng.int(0, from.gatesPerTerminal - 1), arrGate: rng.int(0, to.paxGates - 1) };
  },
  // may a contract still use the stands it has (drawn before the cargo or the GA stands were
  // there, or never drawn: an older save's)?
  gatesValid(c, from, to) {
    if (!(c.depGate >= 0 && c.arrGate >= 0) || c.depGate >= from.gateCount || c.arrGate >= to.gateCount) return false;
    const zone = this.zoneFor(c);
    if (zone === 'pax') return c.depGate < from.gatesPerTerminal && c.arrGate < to.paxGates;
    return this.zoneOf(from, c.depGate) === zone && this.zoneOf(to, c.arrGate) === zone;
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
    Terrain.fitAirports(this.airports);
    Terrain.buildAirportGrid(this.airports);
    this.key = key;
  },

  // world point from runway-local coordinates
  at(a, t, across) {
    return { x: a.x + a.dirX * t + a.perX * across, z: a.z + a.dirZ * t + a.perZ * across };
  },
  // how far across the player's aeroplane, len metres long, parks on a stand (its middle):
  // LAYOUT.STAND, or further out for a long one, so that its nose stays short of the service road
  // (STAND_NOSE). (The parked aeroplanes stand at LAYOUT.STAND whatever their length: a 777-300ER
  // or a 747-8F moved out would have its tail in the way of an An-225 turning onto the apron lane.)
  standAcross(len) { return Math.min(LAYOUT.STAND, LAYOUT.STAND_NOSE - (len || 0) / 2); },
  // ... and that point in the world, on gate's centre line: { x, z, across }
  standSpot(a, gate, len) {
    const across = this.standAcross(len), p = this.at(a, gate.t, across);
    return { x: p.x, z: p.z, across };
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

    const L = LAYOUT, gates = a.gateCount;
    // the stands along the apron: the terminals' (a gap between two terminals), then the cargo
    // stands further on (CARGO_GAP: the tower stands in it at a big or a medium airport), then
    // the general aviation and rescue area: the GA stands, the air ambulance's stand, the
    // helicopter pads and the fire station
    a.apronT0 = -a.half + a.rwyLen * L.APRON_START;
    a.standT = [];
    for (let i = 0; i < a.paxGates; i++) {
      a.standT.push(a.apronT0 + 80 + (i + 0.5) * L.GATE_SPACING + (this.terminalOf(a, i) - 1) * L.TERMINAL_GAP);
    }
    const lastPax = a.standT[a.paxGates - 1], gap = L.CARGO_GAP[a.terminal] || L.CARGO_GAP.small;
    for (let j = 0; j < a.cargoStands; j++) a.standT.push(lastPax + L.GATE_SPACING + L.CARGO_SPACING * j + gap);
    // the passenger part of the apron, to paxT1 (its terminal's middle: apronT)
    a.paxT1 = lastPax + 120;
    a.apronT = (a.apronT0 + a.paxT1) / 2;
    a.cargoT0 = a.standT[a.paxGates] - 70;           // the cargo part, from here to cargoT1
    a.cargoT1 = a.standT[a.gaFirst - 1] + 120;
    for (let j = 0; j < a.gaStands; j++) a.standT.push(a.cargoT1 + L.GA_GAP + L.GA_SPACING * j);
    a.standT.push(a.standT[a.medevacGate - 1] + L.MEDEVAC_GAP);
    // the helicopter pads (t along the apron) and the fire station's middle
    a.padT = [];
    for (let j = 0; j < a.pads; j++) a.padT.push(a.standT[a.medevacGate] + L.PAD_GAP + L.PAD_SPACING * j);
    a.fireT = a.padT[a.padT.length - 1] + L.FIRE_GAP;
    a.apronT1 = a.fireT + L.FIRE_ALONG / 2 + 40;
    // the helicopters standing on them (HELICOPTERS), noses out to the apron: the rescue one on
    // the first (a Mi-8 in Russia), the air ambulance's on the second
    a.helipads = a.padT.map((t, j) => {
      const kind = j === 0 ? (a.country === 'Russia' ? 'sarRu' : 'sar') : 'hems';
      const p = this.at(a, t, L.STAND + 10);
      return { t, across: L.STAND + 10, x: p.x, z: p.z, kind, heli: HELICOPTERS[kind] };
    });

    this.buildNetwork(a, gates);
    this.buildBuildings(a);
    return a;
  },

  // (skip: the rapid exits, by their EXITS fraction, to leave out — markExitTurns)
  buildNetwork(a, gateCount, skip) {
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
    const link = (id1, id2, kind, width, rapid) => {
      const n1 = nodes[id1], n2 = nodes[id2];
      const w = width || L.TWY_WIDTHS[a.terminal] || L.TWY_WIDTH;
      n1.edges.push({ to: n2, kind, width: w, rapid: !!rapid });
      n2.edges.push({ to: n1, kind, width: w, rapid: !!rapid });
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
    // the rapid exits: off the runway EXIT_ANGLE_DEG ahead, onto the taxiway ahead. Each meets the
    // taxiway where a lane goes on into the apron, when one is near (moved up to EXIT_SHIFT_M for
    // it; one that would meet it past the apron's end moves back to its last lane, up to
    // EXIT_SHIFT_BACK_M): to a stand behind, the way goes on through the lane and back along the
    // apron lane, turning no more than a right angle at a time. One that would meet the taxiway
    // too near its end (a short strip), or too near the exit before it, is left out, and so is one
    // no way to a stand would take (markExitTurns).
    const slant = L.TWY_OFFSET / Math.tan(L.EXIT_ANGLE_DEG * DEG);
    const spots = this.laneSpots(a, a.standT).filter((s) => this.laneClear(a, a.standT, s.t));
    const taken = new Set();
    L.EXITS.forEach((f) => {
      if (skip && skip.has(f)) return;
      let tj = -a.half + a.rwyLen * f + slant;
      const prev = a.exits.length ? a.exits[a.exits.length - 1].t + slant : -Infinity;
      const beyond = tj > a.apronT1 - 15;
      let near = null;
      for (const s of spots) {
        const d = s.t - tj;
        if (taken.has(s) || s.t < prev + L.EXIT_MIN_GAP_M || !(Math.abs(d) <= L.EXIT_SHIFT_M || (beyond && d < 0 && -d <= L.EXIT_SHIFT_BACK_M))) continue;
        if (!near || Math.abs(d) < Math.abs(near.t - tj)) near = s;
      }
      if (near) { tj = near.t; taken.add(near); }
      if (tj > a.half - 60 - L.EXIT_END_CLEAR_M || tj < prev + L.EXIT_MIN_GAP_M) return;
      const i = a.exits.length;
      const ex = add('exR' + i, tj - slant, 0, 'exit');
      twyChain.push(add('exT' + i, tj, L.TWY_OFFSET, 'taxi'));
      link('exR' + i, 'exT' + i, 'connector', 0, true);
      ex.rapid = true;
      ex.frac = f;
      rwyChain.push('exR' + i);
      a.exits.push(ex);
    });
    // the last one at the runway's end, a right angle
    add('rwyEnd', a.half - 60, 0, 'exit');
    twyChain.push(add('twyEnd', a.half - 60, L.TWY_OFFSET, 'taxi'));
    link('rwyEnd', 'twyEnd', 'connector');
    rwyChain.push('rwyEnd');
    a.exits.push(nodes.rwyEnd);
    for (let i = 0; i + 1 < rwyChain.length; i++) link(rwyChain[i], rwyChain[i + 1], 'runway', RWY_HALF_WIDTH * 2);

    // the apron: a lane in front of the stands, and lanes off the taxiway into it (apronLanes)
    const laneChain = [];
    const standT = a.standT;
    const lanes = this.apronLanes(a, standT, twyChain.slice());
    lanes.forEach((ln, k) => {
      laneChain.push(add('laneX' + k, ln.t, L.APRON_LANE, 'apron'));
      // (a lane across from a runway exit joins the taxiway at the exit's node: a crossing)
      const tw = ln.at || add('apX' + k, ln.t, L.TWY_OFFSET, 'taxi');
      if (!ln.at) twyChain.push(tw);
      link('laneX' + k, tw.id, 'taxi');
    });
    a.apronLanes = lanes.map((ln) => ln.t);

    a.gates = [];
    for (let i = 0; i < gateCount; i++) {
      const term = this.terminalOf(a, i), zone = this.zoneOf(a, i), cargo = zone === 'cargo';
      const ga = zone === 'ga' || zone === 'medevac';
      const t = standT[i];
      const lane = add('lane' + i, t, L.APRON_LANE, 'apron');
      const stand = add('stand' + i, t, L.STAND, 'gate');
      link('lane' + i, 'stand' + i, 'stand', 40);
      laneChain.push(lane);
      // a cargo stand is numbered C1, C2 ... at the cargo terminal (a big airport) or on the
      // cargo apron (a smaller one), a GA stand G1, G2 ... (the air ambulance's the last of
      // them); its plate on the lead-in line and its board say so
      const pre = cargo ? 'C' : ga ? 'G' : '';
      const number = cargo ? i - a.paxGates + 1 : ga ? i - a.gaFirst + 1 : i + 1;
      a.gates.push({
        id: a.id + '-' + pre + number, name: (pre ? 'Stand ' + pre : 'Gate ') + number, number, index: i,
        terminal: term, terminals: a.terminals, zone, cargo, ga, medevac: zone === 'medevac',
        bigCargo: cargo && a.terminal === 'big', plate: pre + number,
        t, standX: stand.x, standZ: stand.z,
        parkHdg: (a.hdgDeg + 90) % 360,              // nose-in, facing the terminal
        laneNode: lane, node: stand,
        parked: this.parkedType(a, i)                // the aeroplane parked there (hidden on the stands a flight uses)
      });
    }
    // chain the taxiway and the apron lane in order along the runway
    twyChain.sort((p, q) => p.t - q.t);
    for (let i = 0; i + 1 < twyChain.length; i++) link(twyChain[i].id, twyChain[i + 1].id, 'taxi');
    laneChain.sort((p, q) => p.t - q.t);
    for (let i = 0; i + 1 < laneChain.length; i++) link(laneChain[i].id, laneChain[i + 1].id, 'apron', 40);

    // the paved surface, for the cheap ground test at 60 Hz
    a.apronRect = { t0: a.apronT0, t1: a.apronT1, a0: L.APRON_LANE - 45, a1: L.TERMINAL - 30 };   // (up to the terminal's front)
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
    // (a rapid exit no way to a stand takes would only lead back onto the runway: built again
    // without it)
    const idle = this.markExitTurns(a);
    if (idle.length) return this.buildNetwork(a, gateCount, new Set([...(skip || []), ...idle.map((n) => n.frac)]));
    a.fillets = this.buildFillets(a);
    // each exit's turn off the runway (its curve on the landing side): the radius (exitR), how far
    // before the node it leaves the centreline (turnBack) and where it crosses the runway's edge
    // (aimT, the arrow's point on the landing roll)
    for (const n of a.exits) {
      const off = n.edges.find((e) => e.kind !== 'runway').to;
      const f = this.filletAt(a, n, this.runwayBehind(n), off);
      const R = f ? f.R : 0, d = f ? f.d : 0;
      const turn = Math.atan2(Math.abs(off.across - n.across), off.t - n.t), e = RWY_HALF_WIDTH;
      n.exitR = R || LAYOUT.FILLET_R;
      n.turnBack = d;
      n.aimT = R * (1 - Math.cos(turn)) >= e ? n.t - d + Math.sqrt(R * R - (R - e) * (R - e)) : n.t + e / Math.tan(turn);
    }
  },

  // A rapid exit's turns where it meets the taxiway (onto the taxiway ahead, back onto it behind,
  // on into the lane to the apron) are the ways off the runway; taken the other way round they
  // lead back up onto it. Only those a way from the exit to a stand takes (findRoute) get a
  // curve: the turn onto the taxiway ahead at an early exit, say, with the cargo and GA stands
  // further on, but not at a later one, where you would only turn off the taxiway onto the
  // runway taxiing back from its end. Each such junction's exitTurns: { from: the exit's node on
  // the runway, to: the nodes its kept turns lead to }. Returns the rapid exits that keep none
  // (every way from them goes on down the runway to its end: past the apron, say).
  markExitTurns(a) {
    const idle = [];
    for (const ex of a.exits) {
      if (!ex.rapid) continue;
      const j = ex.edges.find((e) => e.kind !== 'runway').to, to = new Set();
      for (const r of this.findRoutes(a, ex, a.gates.map((g) => g.node))) {
        const k = r.indexOf(j);
        if (k > 0 && r[k - 1] === ex && k + 1 < r.length) to.add(r[k + 1]);
      }
      j.exitTurns = { from: ex, to };
      if (!to.size) idle.push(ex);
    }
    return idle;
  },
  // is the turn at node n between the lines to p and to q one left without a curve (markExitTurns)?
  turnDropped(n, p, q) {
    const x = n.exitTurns;
    return !!x && (p === x.from ? !x.to.has(q) : q === x.from && !x.to.has(p));
  },

  // the node behind n along the runway (the way a landing rolls in from)
  runwayBehind(n) {
    const e = n.edges.find((x) => x.kind === 'runway' && x.to.t < n.t);
    return e ? e.to : null;
  },
  // the fillet (World.buildFillets) at node n between the lines to p and to q, if there is one
  filletAt(a, n, p, q) {
    for (const f of (a.filletsAt && a.filletsAt[n.id]) || []) {
      if ((f.ends[0] === p && f.ends[1] === q) || (f.ends[0] === q && f.ends[1] === p)) return f;
    }
    return null;
  },

  // The lanes off the parallel taxiway into the apron, as [{ t, at }] along the runway: at both
  // ends of the apron, in the gap between two terminals (and before the cargo stands), and
  // between the stands of a terminal (or the cargo stands), so that at most LANE_MAX_STANDS
  // stands lie between two lanes and every stand has one beside it.
  // A lane that would meet the taxiway just beside a runway exit meets it at the exit's node
  // (`at`: a crossing, not two junctions a few metres apart), or moves away from it, unless
  // either brings it too close to a stand; then a lane between the stands is left out (an end one
  // stays where it was). A rapid exit was already moved to meet the taxiway at a lane's place
  // (laneSpots), so that lane crosses there.
  apronLanes(a, standT, twyNodes) {
    const L = LAYOUT;
    const ts = this.laneSpots(a, standT);
    const out = [], used = new Set();
    const clear = (t) => this.laneClear(a, standT, t);
    for (const ln of ts) {
      let near = null;
      for (const nd of twyNodes) if (Math.abs(nd.t - ln.t) < L.LANE_SNAP_M && (!near || Math.abs(nd.t - ln.t) < Math.abs(near.t - ln.t))) near = nd;
      if (near) {
        // onto the exit, else far enough from it for two junctions, else (between stands) none
        const away = near.t + Math.sign(ln.t - near.t || 1) * L.LANE_SNAP_M;
        if (clear(near.t)) { if (!used.has(near)) { used.add(near); out.push({ t: near.t, at: near }); } continue; }
        if (clear(away)) { out.push({ t: away, at: null }); continue; }
        if (!ln.end) continue;
      }
      out.push({ t: ln.t, at: null });
    }
    return out;
  },
  // may a lane into the apron meet the apron lane at t: far enough from every stand, inside the apron?
  laneClear(a, standT, t) {
    return standT.every((s) => Math.abs(s - t) >= LAYOUT.LANE_STAND_CLEAR_M) && t > a.apronT0 + 15 && t < a.apronT1 - 15;
  },
  // where the lanes into the apron go, before they meet the taxiway's junctions (apronLanes), as
  // [{ t, end }]
  laneSpots(a, standT) {
    const L = LAYOUT, n = a.gatesPerTerminal;
    const ts = [{ t: a.apronT0 + 40, end: true }];
    // the stands in rows: each terminal's, then the cargo stands, then the GA stands with the
    // air ambulance's (a lane every LANE_MAX_GA of those: the light aeroplanes need less room)
    const rows = [];
    for (let k = 0; k < a.terminals; k++) rows.push(standT.slice(k * n, k * n + n));
    rows.push(standT.slice(a.paxGates, a.gaFirst));
    rows.push(standT.slice(a.gaFirst));
    rows.forEach((gs, k) => {
      const groups = Math.ceil(gs.length / (k === rows.length - 1 ? L.LANE_MAX_GA : L.LANE_MAX_STANDS));
      for (let j = 1; j < groups; j++) {
        const i = Math.round(j * gs.length / groups);
        ts.push({ t: (gs[i - 1] + gs[i]) / 2 });
      }
      if (k + 1 < rows.length) ts.push({ t: (gs[gs.length - 1] + rows[k + 1][0]) / 2 });
    });
    ts.push({ t: a.apronT1 - 40, end: true });
    return ts;
  },

  // Where two taxi lines meet at an angle (a corner, a T, the stands off the apron lane, an exit
  // or the line-up off the runway) the pavement gets a fillet and the centreline a curve: an arc
  // tangent to both lines, so the turns are round, as on a real airfield (off the runway a wide
  // one on each side, its yellow line leading off the runway centreline). Each fillet: its arc
  // as [t, across] points and as world points, the pavement width, and whether it is on the
  // apron (already paved), and for the taxi limits (sim/taxilimit.js) its node, the two nodes its
  // lines lead to (ends), its radius R and how far from the node it meets each line (d), and for
  // the drawing (render/taxiways.js) its centre c ([t, across]) and its angles (from a1, through
  // da); by node in a.filletsAt. Off a rapid exit only the turn the landing roll takes gets one (not back
  // against the landing), and where it meets the taxiway only the turns a way to a stand takes
  // (markExitTurns: the others would lead from the taxiway back up onto the runway).
  // The arc's radius is the one for that kind of turn (FILLET_R, FILLET_STAND_R, FILLET_EXIT_R;
  // FILLET_RAPID_R for a rapid exit's turns of up to a right angle), less where a line is too
  // short for it: where it meets each line it must stay on that line's
  // straight run from the node (past the nodes in line with it). On a taxiway that run ends at
  // the next junction, and the arc takes at most 0.45 of it, so the curves of two junctions never
  // meet; on the apron the run goes on to the end of the lane and the arc may take 0.9 of it
  // (the lead-in curves of neighbouring stands may cross there, as on a real apron) — the stands
  // and the lanes are only 20-40 m apart along the apron lane, and the turn into a stand would
  // otherwise be cramped into less than 20 m. But a curve leaves its line only where the line is
  // still painted: where the curves at the far end of the run are the line's only ways on
  // (trimCurve: a corner, the stem of a T) and the two would overlap on it, they share the run in
  // proportion to their radii, so one leaves the line just where the other takes it over (the
  // first stand's turn and the corner into the lane at the apron's end, 80 m apart: 40 m each).
  // And two curves a route may take one after the other, too close together for both (a lane's
  // corner onto the apron lane and the turn into a stand 22-40 m on), share the run between them,
  // so the route as it is driven (smoothRoute) never steps back.
  buildFillets(a) {
    const out = [];
    const TAXI = ['taxi', 'connector', 'apron', 'stand'];
    const unit = (p, q) => { const l = Math.hypot(q.t - p.t, q.across - p.across) || 1; return [(q.t - p.t) / l, (q.across - p.across) / l]; };
    const run = (n, e, apron) => {
      const u = unit(n, e.to);
      let len = 0, from = n, to = e.to;
      for (let guard = 0; guard < 80; guard++) {
        len += Math.hypot(to.t - from.t, to.across - from.across);
        if (!apron && to.edges.length > 2) break;
        const on = to.edges.find((x) => x.to !== from && x.kind !== 'runway' && (() => { const v = unit(to, x.to); return u[0] * v[0] + u[1] * v[1] > 0.999; })());
        if (!on) break;
        from = to; to = on.to;
      }
      return { len, end: to, prev: from };
    };
    // the arc of fillet f with radius R, tangent to its two lines (unit vectors u, v from the node)
    const shape = (f, R) => {
      const n = f.node, u = f.u, v = f.v, half = Math.tan(f.ang / 2);
      const d = R / half;                                        // from the node to where the arc meets each line
      const bis = [u[0] + v[0], u[1] + v[1]], bl = Math.hypot(bis[0], bis[1]);
      const cDist = R / Math.sin(f.ang / 2);
      const c = [n.t + bis[0] / bl * cDist, n.across + bis[1] / bl * cDist];
      const p1 = [n.t + u[0] * d, n.across + u[1] * d], p2 = [n.t + v[0] * d, n.across + v[1] * d];
      const a1 = Math.atan2(p1[1] - c[1], p1[0] - c[0]);
      let da = Math.atan2(p2[1] - c[1], p2[0] - c[0]) - a1;
      while (da > Math.PI) da -= TAU;
      while (da < -Math.PI) da += TAU;
      const steps = Math.max(4, Math.ceil(Math.abs(da) / (8 * DEG)), Math.ceil(Math.abs(da) * R / 12));
      const pts = [];
      for (let k = 0; k <= steps; k++) {
        const q = a1 + da * k / steps;
        pts.push([c[0] + Math.cos(q) * R, c[1] + Math.sin(q) * R]);
      }
      Object.assign(f, { pts, world: pts.map(([t, ac]) => this.at(a, t, ac)), R, d, c, a1, da });
    };
    for (const n of a.nodeList) {
      const offRunway = n.kind === 'exit' || n.kind === 'lineup';
      const es = n.edges.filter((e) => TAXI.indexOf(e.kind) >= 0 || (offRunway && e.kind === 'runway'));
      for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
        const e1 = es[i], e2 = es[j];
        if (e1.kind === 'runway' && e2.kind === 'runway') continue;
        if (this.turnDropped(n, e1.to, e2.to)) continue;           // back up onto a rapid exit
        const exit =e1.kind === 'runway' || e2.kind === 'runway';
        const l1 = Math.hypot(e1.to.t - n.t, e1.to.across - n.across), l2 = Math.hypot(e2.to.t - n.t, e2.to.across - n.across);
        if (l1 < 1 || l2 < 1) continue;
        const u = [(e1.to.t - n.t) / l1, (e1.to.across - n.across) / l1];
        const v = [(e2.to.t - n.t) / l2, (e2.to.across - n.across) / l2];
        const ang = Math.acos(clamp(u[0] * v[0] + u[1] * v[1], -1, 1));
        if (ang < 25 * DEG || ang > 155 * DEG) continue;           // nearly straight on, or a hairpin
        if (exit && ang < 80 * DEG) continue;                      // off the runway back against the landing
        const apron = e1.kind === 'apron' || e1.kind === 'stand' || e2.kind === 'apron' || e2.kind === 'stand';
        const rapid = (e1.rapid || e2.rapid) && ang > 89 * DEG;
        // (turning back off a rapid exit: the exit's own run shared with its curve off the
        // runway, the taxiway's run behind with nothing as long as itself)
        const back = (e1.rapid || e2.rapid) && !exit && ang <= 89 * DEG;
        const half = Math.tan(ang / 2);
        // (along the runway itself the run is its whole length: an exit's arc starts on it)
        const r1 = e1.kind === 'runway' ? Infinity : run(n, e1, apron).len, r2 = e2.kind === 'runway' ? Infinity : run(n, e2, apron).len;
        const want = rapid ? LAYOUT.FILLET_RAPID_R : back ? LAYOUT.FILLET_BACK_R : exit ? LAYOUT.FILLET_EXIT_R : apron ? LAYOUT.FILLET_STAND_R : LAYOUT.FILLET_R;
        const share = (e, r) => (back ? (e.rapid ? 0.5 : 0.75) : apron ? 0.9 : 0.45) * r;
        const R = Math.min(want, Math.min(share(e1, r1), share(e2, r2)) * half);
        const f = { w: Math.min(e1.width, e2.width), apron, node: n, ends: [e1.to, e2.to], u, v, ang };
        shape(f, R);
        out.push(f);
      }
    }
    a.filletsAt = {};
    for (const f of out) (a.filletsAt[f.node.id] = a.filletsAt[f.node.id] || []).push(f);
    // (two curves overlapping on a run whose far end the curves there take over: shared)
    for (const f of out) {
      for (const k of [0, 1]) {
        const e = f.node.edges.find((x) => x.to === f.ends[k]);
        if (!e || e.kind === 'runway') continue;
        const r = run(f.node, e, f.apron), g = this.trimCurve(a, r.end, r.prev);
        if (!g || g === f || f.d + g.d <= r.len + 0.01) continue;
        const s = r.len / (f.d + g.d);
        shape(f, f.R * s); shape(g, g.R * s);
      }
    }
    // (two curves a route may take one after the other, p - n ... q - s, closer together than
    // they need on the straight run between them, n to q: they share it, each taking at most
    // half unless the other needs less, so the line as it is driven (smoothRoute) never steps
    // back. A route never leaves a stand (a departure starts on the apron lane, pushed back), so
    // two stands' lead-in curves with the lane between them are left as they are.)
    for (const f of out) {
      for (const k of [0, 1]) {
        const p = f.ends[1 - k], e = f.node.edges.find((x) => x.to === f.ends[k]);
        if (!e || e.kind === 'runway' || p.kind === 'gate') continue;
        const u = unit(f.node, e.to);
        let from = f.node, to = e.to, len = 0;
        for (let guard = 0; guard < 80; guard++) {
          len += Math.hypot(to.t - from.t, to.across - from.across);
          for (const g of a.filletsAt[to.id] || []) {
            if (g === f || g.ends.indexOf(from) < 0 || f.d + g.d <= len) continue;
            const h = len / 2, df = g.d < h ? len - g.d : Math.min(f.d, h), dg = f.d < h ? len - f.d : Math.min(g.d, h);
            shape(f, f.R * df / f.d); shape(g, g.R * dg / g.d);
          }
          const on = to.edges.find((x) => x.to !== from && x.kind !== 'runway' && (() => { const v = unit(to, x.to); return u[0] * v[0] + u[1] * v[1] > 0.999; })());
          if (!on) break;
          from = to; to = on.to;
        }
      }
    }
    return out;
  },

  // The curve at node n where the taxi line towards node m stops, or null where it runs on to
  // the node. It stops where the curves (buildFillets) leave it when they are its only ways on
  // at n: no line leads on straight from it there (within 25°) and every turn the network takes
  // from it at n has a curve; then where the nearest of them leaves it. Used for the painted
  // lines (render/taxiways.js) and to keep the curves on the painted line (buildFillets).
  trimCurve(a, n, m) {
    const TAXI = ['taxi', 'connector', 'apron', 'stand'];
    const offRunway = n.kind === 'exit' || n.kind === 'lineup';
    const lm = Math.hypot(m.t - n.t, m.across - n.across) || 1;
    const u = [(m.t - n.t) / lm, (m.across - n.across) / lm];
    let best = null;
    for (const e of n.edges) {
      if (e.to === m || !(TAXI.indexOf(e.kind) >= 0 || (offRunway && e.kind === 'runway'))) continue;
      if (this.turnDropped(n, m, e.to)) continue;                // (no way on: markExitTurns)
      const l = Math.hypot(e.to.t - n.t, e.to.across - n.across) || 1;
      const ang = Math.acos(clamp((u[0] * (e.to.t - n.t) + u[1] * (e.to.across - n.across)) / l, -1, 1));
      if (ang > 155 * DEG) return null;                          // a line goes on straight from it
      if (ang < 25 * DEG) continue;                              // (a hairpin: not a way on)
      const f = this.filletAt(a, n, m, e.to);
      if (!f) {
        if (e.kind === 'runway' && ang < 80 * DEG) continue;     // (back against the landing: never a curve)
        return null;                                             // a square turn: the line runs to the node
      }
      if (!best || f.d < best.d) best = f;
    }
    return best;
  },

  // the push back from a stand, as a tug does it: straight back, tail first, out of the stand
  // towards the apron lane, round a quarter turn onto the lane, the tail swinging away from the
  // holding point, and a little further straight along it (PUSHBACK_STRAIGHTEN of r, the nose
  // wheel and the tug lining up), so the aeroplane stops on the lane r (by the aeroplane's
  // length) past the stand's lane node, its nose towards the threshold (from where it parks:
  // standAcross; from: from there instead — a parked aeroplane's LAYOUT.STAND, sim/traffic.js).
  // The turn is no circle: it tightens and opens again smoothly (pushTurn), as the tug turns the
  // nose wheel in and out, so the tow bar never jumps round (World.tow).
  // pose(k): the position and heading k (0..1) of the way along it
  pushbackPath(a, gate, len, from) {
    const L = LAYOUT, start = from === undefined ? this.standAcross(len) : from, lead = start - L.APRON_LANE;
    const r = clamp(len * SIM.PUSHBACK_R_SHARE, SIM.PUSHBACK_R_MIN_M, Math.min(SIM.PUSHBACK_R_MAX_M, lead));
    const rt = r - Math.min(r / 2, Math.max(SIM.PUSHBACK_STRAIGHTEN_MIN_M, r * SIM.PUSHBACK_STRAIGHTEN)), T = this.pushTurn(), turnLen = rt * T.len;
    const straight = lead - rt, total = straight + turnLen + (r - rt);
    // a nose direction in runway-local terms (along, across) as a heading
    const hdgOf = (nt, na) => Math.atan2(a.dirX * nt + a.perX * na, -(a.dirZ * nt + a.perZ * na));
    const pose = (k) => {
      const s = clamp(k, 0, 1) * total;
      let t = gate.t, across = start - s, nt = 0, na = 1;
      if (s > straight + turnLen) {
        t = gate.t + rt + (s - straight - turnLen); across = L.APRON_LANE;
        nt = -1; na = 0;
      } else if (s > straight) {
        const u = clamp((s - straight) / turnLen, 0, 1) * T.n, i = Math.min(T.n - 1, Math.floor(u)), f = u - i;
        const go = lerp(T.go[i], T.go[i + 1], f), side = lerp(T.side[i], T.side[i + 1], f), th = lerp(T.th[i], T.th[i + 1], f);
        t = gate.t + rt * side; across = L.APRON_LANE + rt - rt * go;
        nt = -Math.sin(th); na = Math.cos(th);
      }
      const p = this.at(a, t, across);
      return { x: p.x, z: p.z, hdg: hdgOf(nt, na), t, across };
    };
    return { r, length: total, pose, end: pose(1) };
  },
  // the push back's quarter turn, 1 by 1 (built once): the way it goes (go), how far it has come
  // aside (side) and turned (th) at n + 1 even steps along it, and its length; the turn tightens
  // over the first PUSHBACK_TURN_EASE of it, holds, and opens over the last (a cosine each)
  pushTurn() {
    if (this.pushTurnTable) return this.pushTurnTable;
    const n = 240, sub = 16, q = SIM.PUSHBACK_TURN_EASE;
    const bend = (v) => v < q ? (1 - Math.cos(Math.PI * v / q)) / 2 : v > 1 - q ? (1 - Math.cos(Math.PI * (1 - v) / q)) / 2 : 1;
    let area = 0;
    for (let i = 0; i < n * sub; i++) area += bend((i + 0.5) / (n * sub)) / (n * sub);
    const k = Math.PI / 2 / area, go = [0], side = [0], th = [0];
    let x = 0, y = 0, h = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < sub; j++) {
        const v = (i * sub + j + 0.5) / (n * sub), dh = k * bend(v) / (n * sub);
        x += Math.cos(h + dh / 2) / (n * sub); y += Math.sin(h + dh / 2) / (n * sub); h += dh;
      }
      go.push(x); side.push(y); th.push(h);
    }
    // (scaled to come out 1 by 1: the turn is the same either way round, so x and y end alike)
    for (let i = 0; i <= n; i++) { go[i] /= x; side[i] /= y; }
    th[n] = Math.PI / 2;
    this.pushTurnTable = { n, go, side, th, len: 1 / x };
    return this.pushTurnTable;
  },

  // the tug on its tow bar at the nose gear of an aeroplane being pushed back (pose: the
  // aeroplane's { x, z, hdg }, len: its length), turning as a real one does: the bar is pinned to
  // the nose gear and turns the nose wheel, so it points the way the nose gear rolls; the tug is
  // pinned to the bar's other end and follows that pin as a trailer follows its hitch (steering
  // all four wheels, its middle rolls only along its own length), so in a turn it swings out
  // and the bar bends at both pins. s: the state of the last call (null: straight at the nose,
  // as the tug waits at the gate); returns it, with x, z: the tug's middle, ry: its heading as
  // three.js turns it (+z ahead, towards the aeroplane), bar: the bar's angle off the tug's axis
  tow(s, pose, len) {
    const fx = hdgX(pose.hdg), fz = hdgZ(pose.hdg), g = len * SIM.NOSE_GEAR_SHARE;
    const nx = pose.x + fx * g, nz = pose.z + fz * g, rear = SIM.TUG_HITCH_M;
    if (!s) s = { nx, nz, bx: fx, bz: fz, rx: nx + fx * (SIM.TOW_BAR_M + rear), rz: nz + fz * (SIM.TOW_BAR_M + rear), x: 0, z: 0, ry: 0, bar: 0 };
    const dx = nx - s.nx, dz = nz - s.nz, d = Math.hypot(dx, dz);
    if (d > 1e-3) {
      // the nose wheel rolls the way the nose gear goes; the bar on the aeroplane's nose side of it
      const sg = dx * fx + dz * fz < 0 ? -1 : 1;
      s.bx = sg * dx / d; s.bz = sg * dz / d; s.nx = nx; s.nz = nz;
    }
    const hx = nx + s.bx * SIM.TOW_BAR_M, hz = nz + s.bz * SIM.TOW_BAR_M;
    let ux = hx - s.rx, uz = hz - s.rz;
    const ul = Math.hypot(ux, uz) || 1;
    ux /= ul; uz /= ul;
    s.rx = hx - ux * rear; s.rz = hz - uz * rear;
    s.x = hx - ux * SIM.TUG_HITCH_M; s.z = hz - uz * SIM.TUG_HITCH_M;
    s.ry = Math.atan2(ux, uz);
    s.bar = wrapRad(Math.atan2(-s.bx, -s.bz) - s.ry);
    return s;
  },

  // the stands a flight takes at an airport: its own, and for an aeroplane wider than the
  // airport's stands are made for (LAYOUT.MAX_SPAN) the ones either side of it at the same
  // terminal (or among the cargo stands) too, kept free (no parked aeroplane there:
  // render/scene3d.js, sim/collide.js)
  standsFor(a, gate, ac) {
    if (!gate) return [];
    if (!ac || ac.dims.span <= (LAYOUT.MAX_SPAN[a.terminal] || LAYOUT.MAX_SPAN.big)) return [gate];
    return a.gates.filter((g) => Math.abs(g.index - gate.index) <= 1 && g.terminal === gate.terminal);
  },

  // the type parked at stand i (PARKED_TYPES, a freighter at a cargo stand: PARKED_CARGO_TYPES,
  // a light aeroplane at a GA stand: PARKED_GA_TYPES, the air ambulance's at its own):
  // drawn by render/airport3d.js, run into by sim/collide.js
  parkedType(a, i) {
    const zone = this.zoneOf(a, i);
    let id;
    if (zone === 'medevac') id = PARKED_MEDEVAC_TYPE;
    else if (zone === 'ga') id = PARKED_GA_TYPES[(hashStr(a.id) + i) % PARKED_GA_TYPES.length];
    else {
      const cargo = zone === 'cargo', table = cargo ? PARKED_CARGO_TYPES : PARKED_TYPES;
      const kinds = table[a.terminal] || table.tiny;
      id = kinds[(hashStr(a.id) + (cargo ? i - a.paxGates : i)) % kinds.length];
    }
    return AIRCRAFT.find((x) => x.id === id) || null;
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
    const h = term === 'big' ? 26 : term === 'medium' ? 16 : 11;          // (a big one gets a roof of its own on top: render/airport3d.js)
    // one building along the whole passenger apron, or one per terminal round its stands (b.term,
    // b.terms); a remote strip's is a small house by its stand (render/ga3d.js)
    if (a.remote) put(a.standT[0], L.TERMINAL - 30 + 18, 70, 36, 9, 'terminal');
    else if (a.terminals === 1) put(a.apronT, L.TERMINAL, a.paxT1 - a.apronT0 - 60, 60, h, 'terminal');
    else {
      for (let k = 1; k <= a.terminals; k++) {
        const gs = a.gates.filter((g) => g.terminal === k);
        put((gs[0].t + gs[gs.length - 1].t) / 2, L.TERMINAL, gs.length * L.GATE_SPACING + 20, 60, h, 'terminal');
      }
    }
    b.filter((x) => x.kind === 'terminal').forEach((x, i, all) => { x.term = i + 1; x.terms = all.length; });
    // past them, round the cargo stands, the cargo terminal (a big airport, b.big) or the cargo
    // shed (CARGO_BUILDING): its apron front on the terminals' line, the dock doors for the trucks
    // in its far end, and the truck yard before them (a.cargoYard; render/cargo3d.js dresses
    // the area: the freight, the loaders, the trucks, a crane)
    const cs = a.gates.filter((g) => g.cargo);
    const [ch, cd] = CARGO_BUILDING[term] || CARGO_BUILDING.small;
    put((cs[0].t + cs[cs.length - 1].t) / 2, L.TERMINAL - 30 + cd / 2, cs.length * L.CARGO_SPACING + 20, cd, ch, 'cargo');
    const cb = b[b.length - 1];
    cb.big = term === 'big';
    a.cargoYard = { t0: cb.t + cb.along / 2, t1: cb.t + cb.along / 2 + 62, a0: L.TERMINAL - 30, a1: L.TERMINAL + 36 };
    // the tower, between the passenger and the cargo areas: the bigger the airport, the taller (b.size
    // picks its design, render/airport3d.js). At a big or a medium airport it stands on its own on
    // the terminals' line, halfway between the last terminal and the cargo building; at a small or
    // a tiny one it rises from the terminal's far end, over its roof, set back from the glass
    // (b.onTerminal: no base building of its own)
    const lastTerm = b.filter((x) => x.kind === 'terminal').pop();
    const termEnd = lastTerm.t + lastTerm.along / 2;
    if (TOWER_ON_TERMINAL[term]) {
      put(termEnd - 9, L.TERMINAL - 30 + Math.min(26, lastTerm.acrossSize * 0.6), 10, 10, TOWER_H[term] || 20, 'tower');
      b[b.length - 1].onTerminal = true;
    } else {
      const tw = term === 'big' ? 30 : 20;
      put((termEnd + cb.t - cb.along / 2) / 2, L.TERMINAL, tw, tw, TOWER_H[term] || 32, 'tower');
    }
    b[b.length - 1].size = term;
    // past the cargo area, behind the GA stands, the air ambulance's stand, the helicopter pads and
    // at the end of the row (GA_BUILDINGS, their apron fronts on the terminals' line): the GA
    // terminal with the bush operators' hangar, the air ambulance's hangar, the rescue station and
    // the fire station (render/ga3d.js)
    const gaB = (kind, t, along) => {
      const [gh, gd] = GA_BUILDINGS[kind][term] || GA_BUILDINGS[kind].small;
      put(t, L.TERMINAL - 30 + gd / 2, along, gd, gh, kind);
    };
    const gs = a.gates.filter((g) => g.zone === 'ga'), mg = a.gates[a.medevacGate];
    gaB('ga', (gs[0].t + gs[gs.length - 1].t) / 2, gs.length * L.GA_SPACING + 8);
    gaB('medevac', mg.t, 44);
    gaB('rescue', (a.padT[0] + a.padT[a.padT.length - 1]) / 2, a.padT.length * L.PAD_SPACING + 10);
    gaB('fire', a.fireT, L.FIRE_ALONG);
    // the hangars (HANGARS): more and bigger ones at a bigger airport, side by side down the
    // runway from the apron, the doors all on one line
    let end = a.apronT0 - 25;
    for (const [along, acrossSize, hh, shape] of HANGARS[term] || HANGARS.medium) {
      put(end - along / 2, L.HANGAR_DOORS + acrossSize / 2, along, acrossSize, hh, 'hangar');
      b[b.length - 1].shape = shape;
      end -= along + 30;
    }
    put(a.apronT1 + 120, L.STAND, 60, 60, 10, 'fuel');
    a.buildings = b;
    // how far the airport's things reach along the runway either way (the ground texture, the
    // levelled ground round the field)
    a.tMin = Math.min(-a.half, ...b.map((x) => x.t - x.along / 2));
    a.tMax = Math.max(a.half, ...b.map((x) => x.t + x.along / 2));
    // the landside behind the terminal, beyond its car park (render/landside3d.js): the bigger
    // the airport, the more there is — offices, a hotel, a multi-storey car park
    a.landside = (LANDSIDE[term] || []).map(([dt, across, along, acrossSize, h, kind]) => {
      const p = this.at(a, a.apronT + dt, across);
      return { x: p.x, z: p.z, t: a.apronT + dt, across, along, acrossSize, h, kind };
    });
  },

  // The quickest taxi route from one node to another: Dijkstra over the node graph, a node reached
  // along an edge being the state, so the turns count. A leg costs its time at its limit
  // (TAXI.STRAIGHT_KT, the apron lane APRON_KT, a stand's lead-in STAND_KT; along the runway four
  // times the taxiway's), a turn TAXI.ROUTE_TURN_S for a right angle, by the square of the angle
  // (a gentle one costs little), one sharper than a right angle ROUTE_SHARP_K times more, and one
  // sharper than ROUTE_MAX_TURN_DEG is never taken. dir: the way the aeroplane faces at the start, [x, z] (off a runway exit the runway's
  // heading when not given); with no route that way, any.
  findRoute(a, startNode, endNode, dir) {
    if (!startNode || !endNode) return [];
    return this.findRoutes(a, startNode, [endNode], dir)[0];
  },
  // the quickest routes from startNode to each of endNodes (as findRoute), in one search
  findRoutes(a, startNode, endNodes, dir) {
    if (!dir && startNode.kind === 'exit') dir = [a.dirX, a.dirZ];
    const T = TAXI, maxCos = Math.cos(T.ROUTE_MAX_TURN_DEG * DEG);
    const speed = (k) => KTS * (k === 'apron' ? T.APRON_KT : k === 'stand' ? T.STAND_KT : k === 'runway' ? T.STRAIGHT_KT / 4 : T.STRAIGHT_KT);
    const states = new Map();
    const start = { n: startNode, from: null, cost: 0, prev: null, done: false };
    states.set(startNode.id + '<', start);
    const open = [start];
    // (each end node: the state it was first reached in, the quickest)
    const found = new Map(endNodes.map((n) => [n, n === startNode ? start : null]));
    let left = endNodes.filter((n) => n !== startNode).length;
    while (open.length && left) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i].cost < open[bi].cost) bi = i;
      const s = open[bi];
      open[bi] = open[open.length - 1]; open.pop();
      if (s.done) continue;
      s.done = true;
      if (found.has(s.n) && !found.get(s.n)) { found.set(s.n, s); if (!--left) break; }
      let ix = 0, iz = 0;
      if (s.from) { const l = Math.hypot(s.n.x - s.from.x, s.n.z - s.from.z) || 1; ix = (s.n.x - s.from.x) / l; iz = (s.n.z - s.from.z) / l; }
      else if (dir) { const l = Math.hypot(dir[0], dir[1]) || 1; ix = dir[0] / l; iz = dir[1] / l; }
      for (const e of s.n.edges) {
        if (e.to === s.from) continue;
        const len = Math.hypot(e.to.x - s.n.x, e.to.z - s.n.z);
        if (len < 0.01) continue;
        let turn = 0;
        if (ix || iz) {
          const cos = clamp((ix * (e.to.x - s.n.x) + iz * (e.to.z - s.n.z)) / len, -1, 1);
          if (cos < maxCos) continue;
          const k = Math.acos(cos) / (Math.PI / 2);
          turn = T.ROUTE_TURN_S * k * k * (k > 1.05 ? T.ROUTE_SHARP_K : 1);
        }
        const c = s.cost + turn + len / speed(e.kind);
        const key = e.to.id + '<' + s.n.id;
        let st = states.get(key);
        if (!st) { st = { n: e.to, from: s.n, cost: Infinity, prev: null, done: false }; states.set(key, st); }
        if (!st.done && c < st.cost) { st.cost = c; st.prev = s; open.push(st); }
      }
    }
    const missing = endNodes.filter((n) => !found.get(n));
    const retry = missing.length && dir && (dir[0] || dir[1]) ? this.findRoutes(a, startNode, missing, [0, 0]) : null;
    return endNodes.map((n) => {
      const s = found.get(n);
      if (!s) return retry ? retry[missing.indexOf(n)] : [startNode];
      const path = [];
      for (let p = s, guard = 0; p && guard++ < 400; p = p.prev) path.unshift(p.n);
      return path;
    });
  },

  // A taxi route as it is driven: its nodes, each corner that has a fillet (buildFillets) taken
  // on the fillet's arc instead (a route starting at a runway exit: the exit's curve off the
  // runway first). { pts: [{x, z}], S: the distance along at each point, first: for each node
  // of the route the index of its first point }. Kept on the route (a route is never changed).
  smoothRoute(a, route) {
    if (route.smooth) return route.smooth;
    const pts = [], first = [];
    const arc = (n, p, q) => {
      const f = p && q ? this.filletAt(a, n, p, q) : null;
      if (!f) return false;
      const w = f.ends[0] === p ? f.world : f.world.slice().reverse();
      for (const v of w) pts.push({ x: v.x, z: v.z });
      return true;
    };
    route.forEach((n, i) => {
      first.push(pts.length);
      const p = i ? route[i - 1] : n.kind === 'exit' ? this.runwayBehind(n) : null;
      if (arc(n, p, route[i + 1])) return;
      // (a node the arc before it has already passed on the line — a long curve onto the apron
      // lane ending past the next node — is left out, so the way never steps back to it: its
      // first point is the arc's end)
      const l = pts[pts.length - 1];
      if (l && p && i && (n.x - l.x) * (n.x - p.x) + (n.z - l.z) * (n.z - p.z) <= 0) { first[i] = pts.length - 1; return; }
      // (and so is one the curve after it already begins before — the route's first node on the
      // apron lane, with the corner off it close ahead: the way begins where that curve does)
      const q = route[i + 1], g = q && route[i + 2] ? this.filletAt(a, q, n, route[i + 2]) : null;
      if (g) {
        const s = g.ends[0] === n ? g.world[0] : g.world[g.world.length - 1];
        if ((s.x - n.x) * (q.x - n.x) + (s.z - n.z) * (q.z - n.z) < 0) return;
      }
      pts.push({ x: n.x, z: n.z });
    });
    const S = [0];
    for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    route.smooth = { pts, S, first };
    return route.smooth;
  },
  // the point of a smoothed route (smoothRoute) nearest to (x, z) among its points from index i0
  // to i1: { x, z, s } (s: the distance along it)
  nearestOn(sm, x, z, i0, i1) {
    const P = sm.pts;
    let best = null, bd = Infinity;
    for (let i = Math.max(0, i0); i < Math.min(P.length - 1, i1); i++) {
      const p = P[i], q = P[i + 1], dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz || 1;
      const u = clamp(((x - p.x) * dx + (z - p.z) * dz) / l2, 0, 1);
      const cx = p.x + dx * u, cz = p.z + dz * u, d = (cx - x) * (cx - x) + (cz - z) * (cz - z);
      if (d < bd) { bd = d; best = { x: cx, z: cz, s: sm.S[i] + u * (sm.S[i + 1] - sm.S[i]) }; }
    }
    return best || { x: P[0].x, z: P[0].z, s: 0 };
  },

  // Where am I on this route, and where do I steer next? `look` (metres) adds a carrot: the
  // point that far ahead along the route line, so following it keeps you on the line (driven: that
  // far along the line as it is driven, round the fillets' arcs, from its nearest point — the first
  // officer's, who steers for it closely; the arrow's point is the route line's taken onto the arcs).
  // The leg you are on is remembered on the route (route.seg) and moves on in order: onto the
  // next leg once that one is nearer and this one mostly behind you (past its end, or near it),
  // back one leg only when the previous one is much nearer. So a later leg that passes close by
  // (the apron lane beside the taxiway) never takes over, and at a corner, even one you missed
  // a little, the carrot is already on the next leg.
  // (The legs' lengths are worked out once and kept on the route, route.lens / route.total: a
  // route is never changed, only replaced.)
  routeProgress(a, route, x, z, look, driven) {
    if (!route || route.length < 2) return null;
    if (!route.lens || route.lens.length !== route.length - 1) {
      route.lens = [];
      route.total = 0;
      for (let i = 0; i < route.length - 1; i++) {
        const dx = route[i + 1].x - route[i].x, dz = route[i + 1].z - route[i].z, l = Math.sqrt(dx * dx + dz * dz);
        route.lens.push(l); route.total += l;
      }
    }
    const lens = route.lens, total = route.total;
    const proj = (i) => {
      const p1 = route[i], p2 = route[i + 1];
      const dx = p2.x - p1.x, dz = p2.z - p1.z;
      const t = clamp(((x - p1.x) * dx + (z - p1.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
      const cx = p1.x + t * dx, cz = p1.z + t * dz;
      return { t, d2: (x - cx) * (x - cx) + (z - cz) * (z - cz), toEnd: (1 - t) * lens[i] };
    };
    const last = route.length - 2;
    let seg = clamp(route.seg || 0, 0, last), cur = proj(seg);
    while (seg < last) {
      const nxt = proj(seg + 1);
      if (nxt.d2 <= cur.d2 && (cur.t > 0.5 || cur.toEnd < 40)) { seg++; cur = nxt; } else break;
    }
    if (seg > 0) {
      const prev = proj(seg - 1);
      if (prev.t < 1 && prev.d2 < cur.d2 * 0.25) { seg--; cur = prev; }
    }
    route.seg = seg;
    const bestSeg = seg, bestT = cur.t, bestD2 = cur.d2;
    let done = 0;
    for (let i = 0; i < bestSeg; i++) done += lens[i];
    done += lens[bestSeg] * bestT;
    const nextIdx = Math.min(bestSeg + 1, route.length - 1);
    const tgt = route[nextIdx];
    const sm = a && a.filletsAt ? this.smoothRoute(a, route) : null;
    // walk `look` metres along the route from the closest point
    let carrot = null;
    if (look && sm && driven) {
      // (the first officer's: `look` metres along the line as it is driven from its nearest point)
      const P = sm.pts, S = sm.S, fi = sm.first;
      const near = this.nearestOn(sm, x, z, fi[bestSeg], (fi[bestSeg + 2] !== undefined ? fi[bestSeg + 2] : P.length) + 1);
      const s = near.s + look;
      let k = 0;
      while (k < P.length - 2 && S[k + 1] < s) k++;
      const f = clamp((s - S[k]) / ((S[k + 1] - S[k]) || 1), 0, 1);
      carrot = { x: lerp(P[k].x, P[k + 1].x, f), z: lerp(P[k].z, P[k + 1].z, f) };
    } else if (look) {
      let s = done + look, i = 0;
      while (i < lens.length - 1 && s > lens[i]) { s -= lens[i]; i++; }
      const f = clamp(s / (lens[i] || 1), 0, 1);
      carrot = { x: lerp(route[i].x, route[i + 1].x, f), z: lerp(route[i].z, route[i + 1].z, f) };
      // on the curve where the corner has one (the fillet's arc), so the arrow and the first
      // officer steering for it go round it, not to the corner and across
      if (sm) {
        const fi = sm.first;
        const c = this.nearestOn(sm, carrot.x, carrot.z, fi[i], (fi[i + 2] !== undefined ? fi[i + 2] : sm.pts.length) + 1);
        carrot = { x: c.x, z: c.z };
      }
    }
    // how far off the route, from the line as it is driven too (round the corners on the fillets'
    // arcs: its nearest point on the leg you are on, the corner ahead and the next leg): measured
    // from the corners' square lines, the middle of a sharp turn's curve (135° off a rapid exit:
    // 28 m inside the corner) read as a missed turn, and the new route led across the grass
    let deviation = Math.sqrt(bestD2);
    let closest = { x: route[bestSeg].x + bestT * (route[bestSeg + 1].x - route[bestSeg].x), z: route[bestSeg].z + bestT * (route[bestSeg + 1].z - route[bestSeg].z) };
    if (sm) {
      const fi = sm.first;
      const near = this.nearestOn(sm, x, z, fi[bestSeg], (fi[bestSeg + 2] !== undefined ? fi[bestSeg + 2] : sm.pts.length) + 1);
      deviation = Math.hypot(near.x - x, near.z - z);
      closest = { x: near.x, z: near.z };
    }
    return {
      carrot,
      deviation,
      progress: total > 0 ? done / total : 1,
      remaining: Math.max(0, total - done),
      target: tgt,
      final: nextIdx === route.length - 1,
      distToTarget: Math.hypot(tgt.x - x, tgt.z - z),
      closest,
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
