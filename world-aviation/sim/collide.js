'use strict';

// ============================================================
// World Aviation — collisions with the buildings, the parked aeroplanes
// and the vehicles on the apron
// Every physics step (Flight.update) the own aeroplane, as spheres along
// its fuselage, wings, tail and engines (Airframe.samples), turned by its
// heading, pitch and bank, is tested against the obstacles of the nearest
// airport: its buildings (the terminals, the tower, the hangars, the fuel
// farm, the cargo terminal or shed, the GA terminal, the air ambulance's
// hangar, the rescue station, the fire station, the landside behind the
// terminal) as boxes, the aeroplanes parked at its stands (all but the stands
// this flight uses, Flight.gatesInUse) as the prisms of their type
// (Airframe.solids), the helicopters on their pads (their body and the
// disc of the main rotor), and the vehicles (a.vehicles: the ones standing
// at the stands, the baggage trains, the FOLLOW ME car, the emergency
// services and the van for the load; the scene places them and keeps the
// moving ones where it draws them — with no scene, as in the headless
// runs, there are none).
//   - in the air, or on the ground at COLLIDE.CRASH_KT or more (a vehicle:
//     COLLIDE.POLICE_KT): the flight is lost (Flight.fail 'collision');
//   - a vehicle from CRASH_KT up to POLICE_KT: the police stop the flight
//     (Flight.fail 'police', a small fine);
//   - slower, on the ground: a touch — the aeroplane stops dead where it
//     was last clear, the damage grows with the speed (COLLIDE.BUMP_DAMAGE
//     at CRASH_KT, a quarter of it at a crawl) and the flight waits
//     (Flight.incident) for the pilot to pay the compensation and go on, or
//     to end it (ui/incident.js); going on, a tug pulls the aeroplane back
//     along the way it came (towPath / towAt: the trail of its poses).
// What happened goes with the failure or the incident as its `contact`
// (where, what, how fast) for the camera that shows it. Not tested while the
// tug has the aeroplane (GATE, PUSHBACK) or once it is parked (SHUTDOWN,
// PARKED). No drawing: the messages go through Flight.fail and
// Flight.incident. Used by sim/flight.js; the vehicles are placed by the
// render/ files that draw them (vehicle, placeVehicle).
// ============================================================

const COLLIDE_SKIP_PHASES = ['GATE', 'PUSHBACK', 'SHUTDOWN', 'PARKED'];

// what was hit, as the messages name it (translated by hand in data/lang-*.js)
const OBSTACLE_NAMES = {
  terminal: 'the terminal',
  tower: 'the control tower',
  hangar: 'a hangar',
  fuel: 'the fuel farm',
  cargo: 'the cargo terminal',
  cargoShed: 'the cargo shed',
  ga: 'the general aviation terminal',
  medevac: 'the air ambulance hangar',
  rescue: 'the rescue station',
  fire: 'the fire station',
  heli: 'a parked {type}',
  carpark: 'the car park building',
  hotel: 'the hotel',
  office: 'an office building',
  parked: 'a parked {type}'
};

// the vehicles, by their COLLIDE.VEHICLES kind (translated by hand in data/lang-*.js)
const VEHICLE_NAMES = {
  tug: 'a pushback tug',
  tractor: 'a baggage tractor',
  cart: 'a baggage cart',
  beltLoader: 'a belt loader',
  fuelTruck: 'a fuel truck',
  catering: 'a catering truck',
  gpu: 'a ground power unit',
  stairs: 'an airstair truck',
  highLoader: 'a cargo loader',
  forklift: 'a forklift',
  ambulance: 'an ambulance',
  pickup: 'a pickup',
  van: 'a van',
  car: 'a car',
  police: 'the police car',
  fire: 'a fire engine'
};

const Collide = {
  pts: [],                    // the own aeroplane's spheres in the world, this step

  // the obstacles of an airport, made once per placed airport: { kind, ox, oz (the origin),
  // ax, az (its x and z axes on the ground), base (the world height of its y = 0), solids,
  // rad (round its origin), top (world height), gate, type }
  obstacles(a) {
    if (a.obstacles) return a.obstacles;
    const out = [];
    const along = { x: a.dirX, z: a.dirZ }, across = { x: a.perX, z: a.perZ };
    for (const b of (a.buildings || []).concat(a.landside || [])) {
      const h = b.h + (b.kind === 'tower' ? COLLIDE.TOWER_CAB_M : 0);
      const solid = convexPrism([[-b.along / 2, -b.acrossSize / 2], [b.along / 2, -b.acrossSize / 2], [b.along / 2, b.acrossSize / 2], [-b.along / 2, b.acrossSize / 2]], 0, h);
      out.push({ kind: b.kind, ox: b.x, oz: b.z, ax: along, az: across, base: a.elev, solids: [solid], rad: solid.rad, top: a.elev + h, bld: b });
    }
    for (const gate of a.gates || []) {
      const type = gate.parked;
      if (!type) continue;
      const h = gate.parkHdg * DEG, solids = Airframe.solids(type);
      const base = a.elev + aircraftDims(type).gearH;
      let top = 0, rad = 0;
      for (const s of solids) { top = Math.max(top, s.y1); rad = Math.max(rad, s.rad); }
      // the model's x is its left wing, its z the nose
      out.push({ kind: 'parked', ox: gate.standX, oz: gate.standZ, ax: { x: -Math.cos(h), z: -Math.sin(h) }, az: { x: Math.sin(h), z: -Math.cos(h) },
        base, solids, rad, top: base + top, gate, type });
    }
    // the helicopters: the body along the across axis (the nose out to the apron), the rotor's disc
    // round the mast a little ahead of the middle
    for (const p of a.helipads || []) {
      const H = p.heli, oct = [];
      for (let i = 0; i < 8; i++) oct.push([Math.cos(i * TAU / 8) * H.rotorR, -H.len * 0.08 + Math.sin(i * TAU / 8) * H.rotorR]);
      const solids = [
        convexPrism([[-1.6, -H.len / 2], [1.6, -H.len / 2], [1.6, H.len / 2], [-1.6, H.len / 2]], 0, H.h - 0.8),
        convexPrism(oct, H.h - 0.9, H.h)
      ];
      const rad = Math.max(solids[0].rad, solids[1].rad);
      out.push({ kind: 'heli', ox: p.x, oz: p.z, ax: along, az: across, base: a.elev, solids, rad, top: a.elev + H.h, heli: H });
    }
    a.obstacleTop = out.reduce((m, o) => Math.max(m, o.top), a.elev) - a.elev;
    a.obstacleReach = out.reduce((m, o) => Math.max(m, Math.hypot(o.ox - a.x, o.oz - a.z) + o.rad), 0);
    a.obstacles = out;
    return out;
  },

  // ---------- the vehicles (placed by the scene) ----------
  // a new vehicle of airport a, of a COLLIDE.VEHICLES kind; gate: the stand it stands at (left
  // out with the stand's parked aeroplane when the flight uses that stand). Off until placed.
  vehicle(a, kind, gate) {
    const v = { kind, gate: gate || null, on: false, x: 0, z: 0, fx: 0, fz: -1, ob: null };
    (a.vehicles || (a.vehicles = [])).push(v);
    return v;
  },
  // gone (the scene took it away)
  dropVehicle(a, v) {
    const i = a.vehicles ? a.vehicles.indexOf(v) : -1;
    if (i >= 0) a.vehicles.splice(i, 1);
  },
  // places it at (x, z) of the airport's frame as the scene builds it (x across, z = -t), turned
  // by ry about the vertical (its forward: +z turned by ry)
  placeVehicle(v, a, x, z, ry) {
    const p = World.at(a, -z, x), ft = -Math.cos(ry), fa = Math.sin(ry);
    v.x = p.x; v.z = p.z;
    v.fx = a.dirX * ft + a.perX * fa; v.fz = a.dirZ * ft + a.perZ * fa;
    v.on = true;
  },
  // ... or in the world, its forward turned by ry from +z (as three.js turns it)
  placeVehicleWorld(v, x, z, ry) {
    v.x = x; v.z = z; v.fx = Math.sin(ry); v.fz = Math.cos(ry);
    v.on = true;
  },
  // its box as an obstacle, where it is now
  vehicleOb(a, v) {
    let ob = v.ob;
    if (!ob) {
      const [w, z0, z1, h] = COLLIDE.VEHICLES[v.kind] || COLLIDE.VEHICLES.car;
      const solid = convexPrism([[-w / 2, z0], [w / 2, z0], [w / 2, z1], [-w / 2, z1]], 0, h);
      ob = v.ob = { kind: 'vehicle', vehicle: v, ox: 0, oz: 0, ax: { x: 0, z: 0 }, az: { x: 0, z: 0 }, base: a.elev, solids: [solid], rad: solid.rad, top: a.elev + h };
    }
    ob.ox = v.x; ob.oz = v.z;
    ob.az.x = v.fx; ob.az.z = v.fz;
    ob.ax.x = -v.fz; ob.ax.z = v.fx;
    return ob;
  },

  step(fl) {
    const st = fl.st;
    const c = fl.collide || (fl.collide = { clear: null, trail: [] });
    if (fl.failure || fl.incident) return;
    if (COLLIDE_SKIP_PHASES.indexOf(fl.phase) >= 0) {
      if (fl.phase === 'GATE') c.trail.length = 0;
      this.keepClear(c, st);
      return;
    }
    const a = fl.nearestApt();
    const obs = this.obstacles(a);
    const reach = Math.max(fl.dims.len, fl.dims.span) / 2 + 2;
    const nearObs = !(st.pos.y - reach > a.elev + a.obstacleTop || Math.hypot(st.pos.x - a.x, st.pos.z - a.z) > a.obstacleReach + reach);
    // (the vehicles are all low, on the ground)
    const vs = a.vehicles && a.vehicles.length && st.pos.y - reach < a.elev + 6 ? a.vehicles : null;
    if (!nearObs && !vs) {
      this.keepClear(c, st);
      return;
    }
    // the spheres in the world
    const ax = fl.updateAxes(), n = ax.nose, r = ax.right, u = ax.up;
    const samples = Airframe.samples(fl.ac), pts = this.pts;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i], p = pts[i] || (pts[i] = { x: 0, y: 0, z: 0, r: 0 });
      p.x = st.pos.x + n.x * s.z - r.x * s.x + u.x * s.y;
      p.y = st.pos.y + n.y * s.z - r.y * s.x + u.y * s.y;
      p.z = st.pos.z + n.z * s.z - r.z * s.x + u.z * s.y;
      p.r = s.r;
    }
    const used = fl.gatesInUse || [];
    if (nearObs) {
      for (const ob of obs) {
        if (ob.gate && used.indexOf(ob.gate) >= 0) continue;
        if (Math.hypot(ob.ox - st.pos.x, ob.oz - st.pos.z) > ob.rad + reach || st.pos.y - reach > ob.top) continue;
        const k = this.touchAt(ob, pts, samples.length);
        if (k >= 0) { this.hit(fl, c, ob, pts[k]); return; }
      }
    }
    if (vs) {
      for (const v of vs) {
        if (!v.on || (v.gate && used.indexOf(v.gate) >= 0)) continue;
        if (Math.hypot(v.x - st.pos.x, v.z - st.pos.z) > reach + 8) continue;
        const ob = this.vehicleOb(a, v);
        if (st.pos.y - reach > ob.top) continue;
        const k = this.touchAt(ob, pts, samples.length);
        if (k >= 0) { this.hit(fl, c, ob, pts[k]); return; }
      }
    }
    this.keepClear(c, st);
  },

  // is a point within `margin` metres of a building of the airport (the parked aeroplanes and
  // the helicopters left out)? The cameras riding with the aeroplane keep out of them
  // (render/scene3d.js). A terminal counts with its roof as drawn (b.roofAt, set by
  // render/airport3d.js: a big one's rises up to 18 m over the box and overhangs the apron by up
  // to COLLIDE.ROOF_LIP_M)
  nearBuilding(a, p, margin) {
    const probe = [{ x: p.x, y: p.y, z: p.z, r: margin }];
    for (const ob of this.obstacles(a)) {
      if (ob.kind === 'parked' || ob.kind === 'heli') continue;
      const b = ob.bld;
      if (ob.kind === 'terminal' && b && b.roofAt) {
        const rx = p.x - ob.ox, rz = p.z - ob.oz;
        const lx = rx * ob.ax.x + rz * ob.ax.z, lz = rx * ob.az.x + rz * ob.az.z;
        if (Math.abs(lx) > b.along / 2 + COLLIDE.ROOF_LIP_M + margin) continue;
        if (lz < -b.acrossSize / 2 - COLLIDE.ROOF_LIP_M - margin || lz > b.acrossSize / 2 + margin) continue;
        if (p.y - ob.base < b.roofAt(b.t + lx, b.across + lz) + margin) return true;
        continue;
      }
      if (p.y - margin > ob.top) continue;
      if (Math.hypot(ob.ox - p.x, ob.oz - p.z) > ob.rad + margin) continue;
      if (this.touches(ob, probe, 1)) return true;
    }
    return false;
  },

  // the pose clear of everything, and the way the aeroplane came: a pose every TRAIL_STEP_M,
  // TRAIL_M of them kept
  keepClear(c, st) {
    if (!c.clear) c.clear = {};
    c.clear.x = st.pos.x; c.clear.z = st.pos.z; c.clear.hdg = st.hdg;
    const tr = c.trail, last = tr[tr.length - 1];
    if (last && Math.hypot(st.pos.x - last.x, st.pos.z - last.z) < COLLIDE.TRAIL_STEP_M) return;
    tr.push({ x: st.pos.x, z: st.pos.z, hdg: st.hdg });
    if (tr.length > COLLIDE.TRAIL_M / COLLIDE.TRAIL_STEP_M + 1) tr.shift();
  },

  // does any sphere reach into one of the obstacle's prisms? touchAt: the first that does (its
  // index), or -1
  touches(ob, pts, count) { return this.touchAt(ob, pts, count) >= 0; },
  touchAt(ob, pts, count) {
    for (let i = 0; i < count; i++) {
      const p = pts[i];
      const rx = p.x - ob.ox, rz = p.z - ob.oz;
      const lx = rx * ob.ax.x + rz * ob.ax.z, lz = rx * ob.az.x + rz * ob.az.z, ly = p.y - ob.base;
      for (const s of ob.solids) {
        if (ly < s.y0 - p.r || ly > s.y1 + p.r) continue;
        if (lx * lx + lz * lz > (s.rad + p.r) * (s.rad + p.r)) continue;
        let out = -Infinity;
        for (const e of s.edges) out = Math.max(out, e.nx * lx + e.nz * lz - e.d);
        if (out <= p.r) return i;
      }
    }
    return -1;
  },

  // the obstacle as the messages name it
  nameOf(ob) {
    if (ob.kind === 'vehicle') return tr(VEHICLE_NAMES[ob.vehicle.kind] || VEHICLE_NAMES.car);
    const kind = ob.kind === 'cargo' && !ob.bld.big ? 'cargoShed' : ob.kind;
    return tr(OBSTACLE_NAMES[kind] || OBSTACLE_NAMES.office, { type: ob.type ? ob.type.name : ob.heli ? tr(ob.heli.name) : '' });
  },

  // p: the sphere that touched
  hit(fl, c, ob, p) {
    const st = fl.st;
    const speed = fl.groundSpeedKt();
    const what = this.nameOf(ob);
    const vehicle = ob.kind === 'vehicle';
    // what the camera shows (ui/incident.js): the spot, the obstacle's middle, what it was
    const contact = {
      kind: vehicle ? 'vehicle' : ob.kind === 'parked' || ob.kind === 'heli' ? ob.kind : 'building',
      what, speed, air: !st.onGround, x: p.x, y: p.y, z: p.z, ox: ob.ox, oz: ob.oz, top: ob.top
    };
    if (!st.onGround) { contact.tier = 'crash'; fl.fail('collision', tr('Collision — you flew into {what}.', { what }), contact); return; }
    const v = Math.max(1, Math.round(speed));
    if (speed >= (vehicle ? COLLIDE.POLICE_KT : COLLIDE.CRASH_KT)) {
      contact.tier = 'crash';
      fl.fail('collision', tr('Collision — you hit {what} at {v} kt.', { what, v }), contact);
      return;
    }
    // stopped dead where it was last clear
    if (c.clear) { st.pos.x = c.clear.x; st.pos.z = c.clear.z; st.hdg = c.clear.hdg; }
    st.vel.x = 0; st.vel.z = 0; st.yawRate = 0; st.turnRate = 0;
    st.damage = Math.min(1, st.damage + COLLIDE.BUMP_DAMAGE * clamp(speed / COLLIDE.CRASH_KT, 0.25, 1));
    if (speed >= COLLIDE.CRASH_KT) {
      contact.tier = 'police';
      fl.fail('police', tr('You hit {what} at {v} kt — the police stopped the flight.', { what, v }), contact);
      return;
    }
    contact.tier = 'touch';
    contact.text = tr('You touched {what} at {v} kt — the aircraft is damaged', { what, v });
    fl.incident = contact;
    Audio2.cue('bump');
  },

  // ---------- the tug after a touch ----------
  // the way back: from where the aeroplane stands back along its trail, COLLIDE.TOW_M (or as far
  // as the trail goes): { pts: [{ x, z, hdg }], len, keep (the trail's poses left after it) }
  towPath(fl) {
    const c = fl.collide, st = fl.st;
    const pts = [{ x: st.pos.x, z: st.pos.z, hdg: st.hdg }];
    const trail = c ? c.trail : [];
    let len = 0, keep = trail.length;
    for (let i = trail.length - 1; i >= 0 && len < COLLIDE.TOW_M; i--) {
      const q = trail[i], p = pts[pts.length - 1];
      const d = Math.hypot(q.x - p.x, q.z - p.z);
      keep = i + 1;
      if (d < 0.05) continue;
      // (no further than TOW_M: the last piece cut short)
      if (len + d > COLLIDE.TOW_M) {
        const k = (COLLIDE.TOW_M - len) / d;
        pts.push({ x: lerp(p.x, q.x, k), z: lerp(p.z, q.z, k), hdg: lerpAngle(p.hdg, q.hdg, k) });
        len = COLLIDE.TOW_M;
        break;
      }
      pts.push(q);
      len += d;
    }
    return { pts, len, keep };
  },
  // the aeroplane at s metres along the way back, nose the way it was when it passed there
  towAt(fl, path, s) {
    const st = fl.st, P = path.pts;
    let i = 0, d = clamp(s, 0, path.len);
    while (i < P.length - 2) {
      const l = Math.hypot(P[i + 1].x - P[i].x, P[i + 1].z - P[i].z);
      if (d <= l) break;
      d -= l; i++;
    }
    const p = P[i], q = P[Math.min(i + 1, P.length - 1)];
    const l = Math.hypot(q.x - p.x, q.z - p.z), k = l > 1e-6 ? clamp(d / l, 0, 1) : 1;
    st.pos.x = lerp(p.x, q.x, k); st.pos.z = lerp(p.z, q.z, k);
    st.hdg = lerpAngle(p.hdg, q.hdg, k);
    st.vel.x = 0; st.vel.z = 0; st.yawRate = 0; st.turnRate = 0;
  },
  // pulled clear: the trail goes on from there
  towDone(fl, path) {
    const c = fl.collide;
    this.towAt(fl, path, path.len);
    if (!c) return;
    c.trail.length = Math.min(c.trail.length, path.keep);
    this.keepClear(c, fl.st);
  }
};
