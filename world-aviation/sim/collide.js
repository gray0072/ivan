'use strict';

// ============================================================
// World Aviation — collisions with the buildings and the parked aeroplanes
// Every physics step (Flight.update) the own aeroplane, as spheres along
// its fuselage, wings, tail and engines (Airframe.samples), turned by its
// heading, pitch and bank, is tested against the obstacles of the nearest
// airport: its buildings (the terminals, the tower, the hangars, the fuel
// farm, the cargo warehouse, the landside behind the terminal) as boxes,
// and the aeroplanes parked at its stands (all but the stands this flight
// uses, Flight.gatesInUse) as the prisms of their type (Airframe.solids).
//   - in the air, or on the ground at COLLIDE.CRASH_KT or more: the flight
//     is lost (Flight.fail 'collision');
//   - slower, on the ground: a touch — the aeroplane stops dead where it
//     was last clear, the damage grows with the speed (COLLIDE.BUMP_DAMAGE
//     at CRASH_KT, a quarter of it at a crawl), once per obstacle until it
//     has been clear of it for COLLIDE.BUMP_REPEAT_S; repairs on the debrief.
// Not tested while the tug has the aeroplane (GATE, PUSHBACK) or once it is
// parked (SHUTDOWN, PARKED). No drawing: the messages go through
// Flight.warn / Flight.fail. Used by sim/flight.js.
// ============================================================

const COLLIDE_SKIP_PHASES = ['GATE', 'PUSHBACK', 'SHUTDOWN', 'PARKED'];

// what was hit, as the messages name it (translated by hand in data/lang-*.js)
const OBSTACLE_NAMES = {
  terminal: 'the terminal',
  tower: 'the control tower',
  hangar: 'a hangar',
  fuel: 'the fuel farm',
  warehouse: 'the cargo warehouse',
  carpark: 'the car park building',
  hotel: 'the hotel',
  office: 'an office building',
  parked: 'a parked {type}'
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
    a.obstacleTop = out.reduce((m, o) => Math.max(m, o.top), a.elev) - a.elev;
    a.obstacleReach = out.reduce((m, o) => Math.max(m, Math.hypot(o.ox - a.x, o.oz - a.z) + o.rad), 0);
    a.obstacles = out;
    return out;
  },

  step(fl) {
    const st = fl.st;
    const c = fl.collide || (fl.collide = { clear: null, last: null, count: 0 });
    if (fl.failure) return;
    if (COLLIDE_SKIP_PHASES.indexOf(fl.phase) >= 0) { this.keepClear(c, st); return; }
    const a = fl.nearestApt();
    const obs = this.obstacles(a);
    const reach = Math.max(fl.dims.len, fl.dims.span) / 2 + 2;
    if (st.pos.y - reach > a.elev + a.obstacleTop || Math.hypot(st.pos.x - a.x, st.pos.z - a.z) > a.obstacleReach + reach) {
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
    for (const ob of obs) {
      if (ob.gate && used.indexOf(ob.gate) >= 0) continue;
      if (Math.hypot(ob.ox - st.pos.x, ob.oz - st.pos.z) > ob.rad + reach || st.pos.y - reach > ob.top) continue;
      if (this.touches(ob, pts, samples.length)) { this.hit(fl, c, ob); return; }
    }
    this.keepClear(c, st);
  },

  // is a point within `margin` metres of a building of the airport (the parked aeroplanes left
  // out)? The cameras riding with the aeroplane keep out of them (render/scene3d.js). A terminal
  // counts with its roof as drawn (b.roofAt, set by render/airport3d.js: a big one's rises up to
  // 18 m over the box and overhangs the apron by up to COLLIDE.ROOF_LIP_M)
  nearBuilding(a, p, margin) {
    const probe = [{ x: p.x, y: p.y, z: p.z, r: margin }];
    for (const ob of this.obstacles(a)) {
      if (ob.kind === 'parked') continue;
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

  keepClear(c, st) {
    if (!c.clear) c.clear = {};
    c.clear.x = st.pos.x; c.clear.z = st.pos.z; c.clear.hdg = st.hdg;
  },

  // does any sphere reach into one of the obstacle's prisms?
  touches(ob, pts, count) {
    for (let i = 0; i < count; i++) {
      const p = pts[i];
      const rx = p.x - ob.ox, rz = p.z - ob.oz;
      const lx = rx * ob.ax.x + rz * ob.ax.z, lz = rx * ob.az.x + rz * ob.az.z, ly = p.y - ob.base;
      for (const s of ob.solids) {
        if (ly < s.y0 - p.r || ly > s.y1 + p.r) continue;
        if (lx * lx + lz * lz > (s.rad + p.r) * (s.rad + p.r)) continue;
        let out = -Infinity;
        for (const e of s.edges) out = Math.max(out, e.nx * lx + e.nz * lz - e.d);
        if (out <= p.r) return true;
      }
    }
    return false;
  },

  hit(fl, c, ob) {
    const st = fl.st;
    const speed = fl.groundSpeedKt();
    const what = tr(OBSTACLE_NAMES[ob.kind] || OBSTACLE_NAMES.office, { type: ob.type ? ob.type.name : '' });
    if (!st.onGround) { fl.fail('collision', tr('Collision — you flew into {what}.', { what })); return; }
    if (speed >= COLLIDE.CRASH_KT) { fl.fail('collision', tr('Collision — you hit {what} at {v} kt.', { what, v: Math.round(speed) })); return; }
    // a touch: stopped dead where it was last clear
    if (c.clear) { st.pos.x = c.clear.x; st.pos.z = c.clear.z; st.hdg = c.clear.hdg; }
    st.vel.x = 0; st.vel.z = 0; st.yawRate = 0; st.turnRate = 0;
    if (!c.last || c.last.ob !== ob || fl.elapsed - c.last.t > COLLIDE.BUMP_REPEAT_S) {
      const dmg = COLLIDE.BUMP_DAMAGE * Math.max(0.25, speed / COLLIDE.CRASH_KT);
      st.damage = Math.min(1, st.damage + dmg);
      c.count++;
      fl.warn('COLLIDE', tr('You touched {what} at {v} kt — the aircraft is damaged', { what, v: Math.max(1, Math.round(speed)) }));
    }
    c.last = { ob, t: fl.elapsed };
  }
};
