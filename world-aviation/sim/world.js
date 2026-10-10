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
//   terminal          across = TERMINAL (and past the terminals, along the
//                     same apron, the tower, the cargo stands and their cargo
//                     terminal or shed, then the general aviation and rescue
//                     area: the GA stands, the air ambulance's stand, the
//                     helicopter pads, the fire station)
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
      const w = width || L.TWY_WIDTHS[a.terminal] || L.TWY_WIDTH;
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
    a.fillets = this.buildFillets(a);
  },

  // The lanes off the parallel taxiway into the apron, as [{ t, at }] along the runway: at both
  // ends of the apron, in the gap between two terminals (and before the cargo stands), and
  // between the stands of a terminal (or the cargo stands), so that at most LANE_MAX_STANDS
  // stands lie between two lanes and every stand has one beside it.
  // A lane that would meet the taxiway just beside a runway exit meets it at the exit's node
  // (`at`: a crossing, not two junctions a few metres apart), or moves away from it, unless
  // either brings it too close to a stand; then a lane between the stands is left out (an end one
  // stays where it was).
  apronLanes(a, standT, twyNodes) {
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
    const out = [];
    const clear = (t) => standT.every((s) => Math.abs(s - t) >= L.LANE_STAND_CLEAR_M) && t > a.apronT0 + 15 && t < a.apronT1 - 15;
    for (const ln of ts) {
      const near = twyNodes.find((nd) => Math.abs(nd.t - ln.t) < L.LANE_SNAP_M);
      if (near) {
        // onto the exit, else far enough from it for two junctions, else (between stands) none
        const away = near.t + Math.sign(ln.t - near.t || 1) * L.LANE_SNAP_M;
        if (clear(near.t)) { out.push({ t: near.t, at: near }); continue; }
        if (clear(away)) { out.push({ t: away, at: null }); continue; }
        if (!ln.end) continue;
      }
      out.push({ t: ln.t, at: null });
    }
    return out;
  },

  // Where two taxi lines meet at an angle (a corner, a T, the stands off the apron lane, an exit
  // or the line-up off the runway) the pavement gets a fillet and the centreline a curve: an arc
  // tangent to both lines, so the turns are round, as on a real airfield (off the runway a wide
  // one on each side, its yellow line leading off the runway centreline). Each fillet: its arc
  // as [t, across] points and as world points, the pavement width, and whether it is on the
  // apron (already paved).
  // The arc's radius is the one for that kind of turn (FILLET_R, FILLET_STAND_R, FILLET_EXIT_R),
  // less where a line is too short for it: where it meets each line it must stay on that line's
  // straight run from the node (past the nodes in line with it). On a taxiway that run ends at
  // the next junction, and the arc takes at most 0.45 of it, so the curves of two junctions never
  // meet; on the apron the run goes on to the end of the lane and the arc may take 0.9 of it
  // (the lead-in curves of neighbouring stands may cross there, as on a real apron) — the stands
  // and the lanes are only 20-40 m apart along the apron lane, and the turn into a stand would
  // otherwise be cramped into less than 20 m.
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
      return len;
    };
    for (const n of a.nodeList) {
      const offRunway = n.kind === 'exit' || n.kind === 'lineup';
      const es = n.edges.filter((e) => TAXI.indexOf(e.kind) >= 0 || (offRunway && e.kind === 'runway'));
      for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
        const e1 = es[i], e2 = es[j];
        if (e1.kind === 'runway' && e2.kind === 'runway') continue;
        const exit = e1.kind === 'runway' || e2.kind === 'runway';
        const l1 = Math.hypot(e1.to.t - n.t, e1.to.across - n.across), l2 = Math.hypot(e2.to.t - n.t, e2.to.across - n.across);
        if (l1 < 1 || l2 < 1) continue;
        const u = [(e1.to.t - n.t) / l1, (e1.to.across - n.across) / l1];
        const v = [(e2.to.t - n.t) / l2, (e2.to.across - n.across) / l2];
        const ang = Math.acos(clamp(u[0] * v[0] + u[1] * v[1], -1, 1));
        if (ang < 25 * DEG || ang > 155 * DEG) continue;           // nearly straight on, or a hairpin
        const apron = e1.kind === 'apron' || e1.kind === 'stand' || e2.kind === 'apron' || e2.kind === 'stand';
        const half = Math.tan(ang / 2);
        // (along the runway itself the run is its whole length: an exit's arc starts on it)
        const r1 = e1.kind === 'runway' ? Infinity : run(n, e1, apron), r2 = e2.kind === 'runway' ? Infinity : run(n, e2, apron);
        const R = Math.min(exit ? LAYOUT.FILLET_EXIT_R : apron ? LAYOUT.FILLET_STAND_R : LAYOUT.FILLET_R, (apron ? 0.9 : 0.45) * Math.min(r1, r2) * half);
        const d = R / half;                                        // from the node to where the arc meets each line
        const bis = [u[0] + v[0], u[1] + v[1]], bl = Math.hypot(bis[0], bis[1]);
        const cDist = R / Math.sin(ang / 2);
        const c = [n.t + bis[0] / bl * cDist, n.across + bis[1] / bl * cDist];
        const p1 = [n.t + u[0] * d, n.across + u[1] * d], p2 = [n.t + v[0] * d, n.across + v[1] * d];
        const a1 = Math.atan2(p1[1] - c[1], p1[0] - c[0]);
        let da = Math.atan2(p2[1] - c[1], p2[0] - c[0]) - a1;
        while (da > Math.PI) da -= TAU;
        while (da < -Math.PI) da += TAU;
        const steps = Math.max(4, Math.ceil(Math.abs(da) / (8 * DEG)));
        const pts = [];
        for (let k = 0; k <= steps; k++) {
          const q = a1 + da * k / steps;
          pts.push([c[0] + Math.cos(q) * R, c[1] + Math.sin(q) * R]);
        }
        out.push({ pts, world: pts.map(([t, ac]) => this.at(a, t, ac)), w: Math.min(e1.width, e2.width), apron });
      }
    }
    return out;
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
  // The leg you are on is remembered on the route (route.seg) and moves on in order: onto the
  // next leg once that one is nearer and this one mostly behind you (past its end, or near it),
  // back one leg only when the previous one is much nearer. So a later leg that passes close by
  // (the apron lane beside the taxiway) never takes over, and at a corner, even one you missed
  // a little, the carrot is already on the next leg.
  routeProgress(a, route, x, z, look) {
    if (!route || route.length < 2) return null;
    let total = 0;
    const lens = [];
    for (let i = 0; i < route.length - 1; i++) {
      const l = Math.hypot(route[i + 1].x - route[i].x, route[i + 1].z - route[i].z);
      lens.push(l); total += l;
    }
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
      closest: { x: route[bestSeg].x + bestT * (route[bestSeg + 1].x - route[bestSeg].x), z: route[bestSeg].z + bestT * (route[bestSeg + 1].z - route[bestSeg].z) },
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
