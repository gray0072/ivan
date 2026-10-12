'use strict';

// ============================================================
// World Aviation — the turnaround at the arrival stand (three.js):
// once the engines are off (PARKED) the ground crew's vehicles drive
// up to the own aeroplane, while the camera flies out and holds the
// aeroplane in the middle of its shot before the debrief (Game's
// outro, TURNAROUND in constants.js):
//   - a belt loader to the aft hold (on the right, the baggage trains
//     come and stop beside it: baggage3d.js),
//   - a fuel truck under the right wing (a jet's; a turboprop's at
//     its wing too),
//   - a catering truck at the rear right door of a big passenger jet,
//   - an airstair truck at the front door where there is no jet bridge,
//   - at a cargo stand the main-deck loader (or a forklift) at the
//     cargo door.
// Each comes along the service road's lane on the stands' side from
// some way off, turns down beside the aeroplane well out from the
// fuselage and comes in square to it, one after another. done() says
// when all are there and have stood a moment (the debrief may come).
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
      if (t.t < v.delay) continue;
      v.holder.visible = true;
      if (v.s < v.track.len) {
        v.s = Math.min(v.track.len, v.s + dt * trackSpeed(v.track, v.s) * TURNAROUND.SPEED_K);
        this.pose(v);
        if (v.s >= v.track.len) v.at = t.t;
      }
    }
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
    const doorAcross = L.STAND + Lc / 2 - frontDoorFromNose(Lc);
    const bridges = a.terminal === 'big' || a.terminal === 'medium';
    const group = new THREE.Group();
    const body = new THREE.MeshLambertMaterial({ vertexColors: true });
    const rng = makeRng(hashStr(fl.contract ? fl.contract.id : a.id));
    // what comes: [model, side (+1 left, +t; -1 right), its place across, out from the fuselage's side]
    const jobs = [];
    if (!gate.ga) {
      if (gate.cargo) {
        const cargoDoor = doorAcross - Math.min(8, Lc * 0.2);
        jobs.push(sill > 2.4 ? [(k) => Vehicles.highLoader(k, sill, rng), 1, cargoDoor, 5.2] : [(k) => Vehicles.forklift(k, true, rng), 1, cargoDoor, 3.2]);
      } else if (!bridges) jobs.push([(k) => Vehicles.stairs(k, sill), 1, doorAcross, 4.2]);
      if (Lc > 15) jobs.push([(k) => Vehicles.beltLoader(k), -1, L.STAND - Lc * 0.22, 4.6]);
      jobs.push([(k) => Vehicles.fuelTruck(k), -1, L.STAND + Lc * 0.02, Math.max(S * 0.2, jet ? 13.5 : 7)]);
      if (jet && Lc > 35 && !gate.cargo) jobs.push([(k) => Vehicles.catering(k), -1, L.STAND - Lc * 0.38, 3.8]);
    }
    const lane = L.SERVICE_ROAD - BAG_LANE;
    const vehicles = jobs.map(([model, side, across, out], i) => {
      const k = kit();
      model(k);
      const holder = new THREE.Group();
      holder.add(k.mesh(body));
      holder.visible = false;
      group.add(holder);
      // along the lane from TURNAROUND.FROM_M off, down beside the aeroplane well out from the
      // fuselage (TURNAROUND.OUT_M, further than its own place), and in square to it
      const tEnd = gate.t + side * (R + out), tOut = gate.t + side * Math.max(R + TURNAROUND.OUT_M, R + out + 8);
      const track = makeTrack([[gate.t + side * TURNAROUND.FROM_M, lane], [tOut, lane], [tOut, across], [tEnd, across]]);
      const v = { holder, track, s: 0, delay: i * TURNAROUND.STAGGER_S };
      this.pose(v);
      return v;
    });
    rec.frame.add(group);
    return { fl, gate, group, vehicles, t: 0, time };
  },

  // a vehicle at s along its track, turned the way it goes (the airport's frame: x across, z -t)
  pose(v) {
    const q = trackAt(v.track, v.s), b = trackAt(v.track, Math.max(0, v.s - 1)), f = trackAt(v.track, Math.min(v.track.len, v.s + 1));
    v.holder.position.set(q.across, 0, -q.t);
    if (Math.hypot(f.t - b.t, f.across - b.across) > 1e-3) v.holder.rotation.y = Math.atan2(f.across - b.across, -(f.t - b.t));
  }
};
