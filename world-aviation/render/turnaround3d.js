'use strict';

// ============================================================
// World Aviation — the turnaround at the arrival stand (three.js):
// once the engines are off (PARKED) the ground crew's vehicles drive
// up to the own aeroplane, while the camera flies out and holds the
// aeroplane in the middle of its shot before the debrief (Game's
// outro, TURNAROUND in constants.js):
//   - a belt loader to the aft hold (on the right, the baggage trains
//     come and stop beside it: baggage3d.js),
//   - a fuel truck at the right wing: under it where it fits, else
//     just short of its leading edge (a turboprop's too),
//   - a catering truck at the rear right door of a big passenger jet,
//   - an airstair truck at the front door where there is no jet bridge,
//   - at a cargo stand the main-deck loader (or a forklift) at the
//     cargo door.
// Each comes along the service road from some way off, keeping right
// as the baggage trains do, and down the side in a lane that keeps
// off the aeroplane (render/servicing.js): to a place behind the wing
// outside the wingtip — or, where the stand next door leaves no room,
// under the outer wing with headroom to spare — then in square to the
// fuselage; the fuel truck straight down between the engines to the
// wing, the one that goes under it. The aeroplane is taken where it
// really stands (a little off the stand's line, or turned). One goes
// after another, on each side the one going furthest down first, and
// one whose place lies on another's way waits until that one has gone
// by, so none passes one already standing. An ambulance, a fire engine
// or a police car waiting at the stand (responders3d.js) on the way of
// one drives off first, and that one sets off once it is off its way.
// A vehicle stops for a baggage train, a responder or another vehicle
// just ahead (and the trains for it: baggage3d.js), and no train comes
// to the aeroplane before they are all there (arrived).
// done() says when all are there and have stood a moment (the debrief
// may come).
// A GA stand has none (its load waits there: ga3d.js).
// Built into the arrival airport's frame (rec.frame: x = across,
// z = -t). Used by Scene3D.update and Game (the outro's end).
// ============================================================

const Turnaround3D = {
  // per frame, for every airport built: gate the arrival gate when rec is the arrival airport and
  // the aeroplane is parked there (else null: whatever stood there goes), time in seconds
  update(rec, fl, gate, time) {
    const on = gate && fl.phase === 'PARKED' && !fl.practice;
    const r = rec.turnaround;
    if (r && (!on || r.fl !== fl || r.gate !== gate)) {
      rec.frame.remove(r.group);
      r.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      rec.turnaround = null;
      if (this.now === r) this.now = null;
    }
    if (!on) return;
    if (!rec.turnaround) { rec.turnaround = this.build(rec, fl, gate, time); this.now = rec.turnaround; }
    const t = rec.turnaround, dt = clamp(time - (t.time === undefined ? time : t.time), 0, 0.2);
    t.time = time;
    t.t += dt;
    for (const v of t.vehicles) {
      if (t.t < v.delay || v.after.some(([o, s]) => o.s < s) || v.resp.some((r) => !Responders3D.clear(r))) continue;
      v.holder.visible = true;
      v.on = true;
      if (v.s < v.track.len) {
        // (something just ahead: wait for it, never for good)
        if (this.inWay(rec, t, v)) v.stuck += dt; else v.stuck = 0;
        if (v.stuck > 0 && v.stuck < TURNAROUND.WAIT_MAX_S) continue;
        v.s = Math.min(v.track.len, v.s + dt * trackSpeed(v.track, v.s) * TURNAROUND.SPEED_K);
        this.pose(v);
        if (v.s >= v.track.len) v.at = t.t;
      }
    }
  },

  // a baggage train or another of the crew's vehicles in front of v: a point of its body within
  // TURNAROUND.GAP_M of its track over the TURNAROUND.LOOK_M past its front
  inWay(rec, t, v) {
    const others = [];
    for (const o of t.vehicles) if (o !== v && o.on) others.push(...o.pieces);
    for (const tr of rec.trains || []) if (tr.state !== 'hall') others.push(...tr.pieces);
    for (const r of Responders3D.waiting(rec, t.fl)) others.push(...Responders3D.pieces(r));
    if (!others.length) return false;
    for (let d = v.half + 1; d <= v.half + TURNAROUND.LOOK_M; d += 1.5) {
      const q = trackAt(v.track, v.s + d);
      for (const p of others) if (Math.hypot(p.t - q.t, p.across - q.across) < TURNAROUND.GAP_M) return true;
    }
    return false;
  },

  // all the crew's vehicles of the turnaround at the arrival stand are in their places (none: not
  // parked yet; a GA stand's turnaround has none)
  arrived() {
    const t = this.now;
    return !!t && t.vehicles.every((v) => v.at !== undefined);
  },

  // all the vehicles there, and the last one has stood TURNAROUND.LINGER_S (or none came)
  done() {
    const t = this.now;
    if (!t) return false;
    if (!t.vehicles.length) return t.t > TURNAROUND.LINGER_S;
    return t.vehicles.every((v) => v.at !== undefined && t.t - v.at > TURNAROUND.LINGER_S);
  },

  build(rec, fl, gate, time) {
    const L = LAYOUT, ac = fl.ac, d = aircraftDims(ac), a = rec.a;
    const R = d.radius, Lc = d.len, S = d.span, jet = ac.engineType === 'jet';
    const sill = Math.max(1.0, d.gearH - R * 0.3);
    const doorZ = Lc / 2 - frontDoorFromNose(Lc);
    const bridges = a.terminal === 'big' || a.terminal === 'medium';
    const group = new THREE.Group();
    const body = new THREE.MeshLambertMaterial({ vertexColors: true });
    const rng = makeRng(hashStr(fl.contract ? fl.contract.id : a.id));
    const pose = this.poseOf(rec, fl, gate), room = Servicing.room(a, gate);
    // what comes: [model, side (+1 left, +t; -1 right), its place along the fuselage (z, + the
    // nose), out from the fuselage's side, the fuel truck, the belt loader]
    const jobs = [];
    if (!gate.ga) {
      if (gate.cargo) {
        const cargoZ = doorZ - Math.min(8, Lc * 0.2);
        jobs.push(sill > 2.4 ? [(k) => Vehicles.highLoader(k, sill, rng), 1, cargoZ, 5.2] : [(k) => Vehicles.forklift(k, true, rng), 1, cargoZ, 3.2]);
      } else if (!bridges) jobs.push([(k) => Vehicles.stairs(k, sill), 1, doorZ, 4.2]);
      if (Lc > 15) jobs.push([(k) => Vehicles.beltLoader(k), -1, -Lc * 0.22, 4.6, false, true]);
      jobs.push([(k) => Vehicles.fuelTruck(k), -1, Lc * 0.02, Math.max(S * 0.2, jet ? 13.5 : 7), true]);
      if (jet && Lc > 35 && !gate.cargo) jobs.push([(k) => Vehicles.catering(k), -1, -Lc * 0.38, 3.8]);
    }
    // on each side the one going furthest from the road first
    jobs.sort((p, q) => p[1] - q[1] || p[2] - q[2]);
    let holdZ = -Lc * 0.22;
    const vehicles = jobs.map(([model, side, z, out, fuel, belt]) => {
      const k = kit();
      model(k);
      const holder = new THREE.Group();
      holder.add(k.mesh(body));
      holder.visible = false;
      group.add(holder);
      const box = new THREE.Box3().setFromObject(holder);
      const size = { w: Math.max(-box.min.x, box.max.x), h: box.max.y, front: box.max.z, rear: -box.min.z };
      // along the road from TURNAROUND.FROM_M off on its right-hand lane (as the baggage trains
      // keep right), then down the side and in square to the fuselage — the fuel truck straight
      // down to the wing
      const lane = L.SERVICE_ROAD - side * BAG_LANE, from = [gate.t + side * TURNAROUND.FROM_M, lane];
      const at = (x, zz) => Servicing.at(pose, side * x, zz), down = (o) => at(o, Servicing.zAt(pose, side * o, lane));
      let corners;
      const f = fuel ? Servicing.fuel(ac, pose, side, R + out, size, lane) : null;
      if (f) corners = [from, down(f.o), at(f.o, f.z)];
      else {
        // (its place moved along the fuselage if it stood in an engine or under the wing)
        const oMin = Math.max(R + TURNAROUND.OUT_M, R + out + 8), x = R + out, zz = Servicing.place(ac, pose, side, x, z, size);
        if (belt) holdZ = zz;
        const way = (o) => [from, down(o), at(o, zz), at(x, zz)];
        corners = way(Servicing.lane(ac, pose, oMin, Math.max(oMin, room - size.w - 1), size, way));
      }
      const v = { holder, track: makeTrack(corners), s: 0, delay: 0, after: [], resp: [], on: false, stuck: 0, pieces: [], fuel: !!fuel, size,
        half: Math.max(size.front, size.rear) };
      this.pose(v);
      return v;
    });
    // one whose place lies on another's way waits until that one has gone by it (and starts after it)
    const T = Servicing.trackPts.bind(Servicing);
    for (const v of vehicles) {
      const e = trackAt(v.track, v.track.len), b = trackAt(v.track, v.track.len - 1), l = Math.hypot(e.t - b.t, e.across - b.across) || 1;
      v.place = Servicing.body(e.t, e.across, (e.t - b.t) / l, (e.across - b.across) / l, v.size);
    }
    for (const v of vehicles) {
      for (const o of vehicles) {
        if (o === v) continue;
        const pts = T(o.track), bp = Servicing.bodyPts(v.place);
        let last = -1;
        pts.forEach(([pt, pa], j) => {
          if (bp.some(([bt, ba]) => Math.hypot(bt - pt, ba - pa) < v.size.w + o.size.w + SERVICE.BODY_PAD_M)) last = j;
        });
        if (last >= 0 && last * 2 * BAG_STEP < o.track.len - 1) v.after.push([o, last * 2 * BAG_STEP + o.half + 2]);
      }
    }
    // the order: as sorted, each after the ones it waits for
    const order = [], left = vehicles.slice();
    while (left.length) {
      let i = left.findIndex((v) => v.after.every(([o]) => order.indexOf(o) >= 0));
      // (two on each other's way: the first as sorted goes without waiting)
      if (i < 0) { i = 0; left[0].after = left[0].after.filter(([o]) => order.indexOf(o) >= 0); }
      order.push(left.splice(i, 1)[0]);
    }
    order.forEach((v, i) => { v.delay = i * TURNAROUND.STAGGER_S; });
    // a responder standing on the way of one, or where it stops: off first, that one after it
    for (const r of Responders3D.waiting(rec, fl)) {
      const p = r.spot;
      for (const v of vehicles) {
        const pad = v.size.w + SERVICE.BODY_PAD_M;
        if (!T(v.track).some(([pt, pa]) => Math.abs(pt - p.t) < p.ht + pad && Math.abs(pa - p.across) < p.ha + pad)) continue;
        Responders3D.leave(r, time);
        v.resp.push(r);
      }
    }
    rec.frame.add(group);
    return { fl, gate, group, vehicles, pose, holdZ, t: 0, time };
  },

  // the aeroplane where it stands in the stand's frame (its centre and its nose's direction);
  // the stand's own pose if it is not by the stand
  poseOf(rec, fl, gate) {
    const st = fl.st;
    rec.frame.updateWorldMatrix(true, false);
    const l0 = rec.frame.worldToLocal(new THREE.Vector3(st.pos.x, st.pos.y, st.pos.z));
    const l1 = rec.frame.worldToLocal(new THREE.Vector3(st.pos.x + Math.sin(st.hdg) * 10, st.pos.y, st.pos.z - Math.cos(st.hdg) * 10));
    const ft = -(l1.z - l0.z), fa = l1.x - l0.x, n = Math.hypot(ft, fa);
    const p = { t: -l0.z, a: l0.x, ft: ft / n, fa: fa / n };
    if (!(n > 1e-6) || Math.abs(p.t - gate.t) > 20 || Math.abs(p.a - World.standAcross(fl.dims.len)) > 20 || p.fa < 0.8) return Servicing.standPose(gate, fl.dims.len);
    return p;
  },

  // where the fuel truck of a turnaround stands (null: none), for the baggage trains to keep clear of
  fuelBody(t) {
    const v = t && t.vehicles.find((o) => o.fuel);
    return v ? v.place : null;
  },

  // a vehicle at s along its track, turned the way it goes (the airport's frame: x across, z -t),
  // and the points along its body others keep clear of (pieces)
  pose(v) {
    const q = trackAt(v.track, v.s), b = trackAt(v.track, Math.max(0, v.s - 1)), f = trackAt(v.track, Math.min(v.track.len, v.s + 1));
    v.holder.position.set(q.across, 0, -q.t);
    const dt = f.t - b.t, da = f.across - b.across, l = Math.hypot(dt, da);
    if (l > 1e-3) { v.holder.rotation.y = Math.atan2(da, -dt); v.dir = { t: dt / l, across: da / l }; }
    const u = v.dir || { t: 0, across: 0 };
    v.pieces.length = 0;
    for (const k of [-1, -0.5, 0, 0.5, 1]) v.pieces.push({ t: q.t + u.t * k * v.half, across: q.across + u.across * k * v.half });
  }
};
