'use strict';

// ============================================================
// World Aviation — the FOLLOW ME car (three.js), on the pilot's
// first landing at an airport (fl.followMe, set by game.js)
//   - it waits on the taxiway FOLLOW_ME.WAIT_M past the runway exit
//     the guidance arrow picks (moving on to the next one while the
//     landing roll passes an exit), and once the aeroplane turns off
//     the runway it drives ahead of it along the taxi route
//     (sim/guidance.js), its corners on the fillets' arcs as the
//     aeroplane takes them (World.smoothRoute), its back FOLLOW_ME.GAP_M
//     plus FOLLOW_ME.LEAD_S seconds of the aeroplane's speed past the
//     nose, setting off in time to get up to that speed: it waits when
//     the aeroplane stops and never backs up; caught up, it speeds up
//     (harder still inside GAP_M) and goes up to RUN_KT instead of MAX_KT
//   - by the stand it drives on along the apron lane past the stand
//     ahead of the aeroplane turning in, turns off it on an arc
//     (FOLLOW_ME.TURN_R) and drives up beside the stand to its waiting
//     place (Responders3D.layout: beside the front of the fuselage, ahead
//     of the wing and the engines, outside the emergency services called
//     to that side, so it never stands in one nor drives through one on
//     its way), facing the terminal, and waits there (it gets there even
//     when the aeroplane is parked first)
//   - as the engines wind down (SHUTDOWN), before the ground crew comes,
//     it drives on up to the service road, round onto the lane that
//     keeps right towards its home and along it to its place by the
//     first baggage hall's door, and parks there, its beacon off (its
//     parked twin there, baggage3d.js, is hidden while it is out)
//   - off the taxi route it drives at most APRON_KT and waits for any
//     vehicle just ahead of it (a baggage train, the ground crew's, the
//     emergency services: Traffic in baggage3d.js), and they for it
//   - a yellow car with black and yellow checks along its sides, the
//     lit FOLLOW ME board on the roof facing back at the pilot, and an
//     amber beacon flashing
// A missed turn's new route: the car carries on from where it is on it.
// Used by Scene3D.update.
// ============================================================

const FollowMe3D = {
  init(scene) {
    const group = new THREE.Group();
    const k = kit();
    Vehicles.car(k, '#f2c418');
    for (let i = 0; i < 7; i++) k.box(1.82, 0.3, 0.6, 0, 0.62, -1.8 + i * 0.6, i % 2 ? '#f2c418' : '#15171a');
    k.box(0.12, 0.5, 0.12, -0.6, 1.75, -0.4, '#2a2d31').box(0.12, 0.5, 0.12, 0.6, 1.75, -0.4, '#2a2d31')
      .box(2.1, 0.8, 0.22, 0, 2.35, -0.4, '#111214');
    group.add(k.mesh());
    // the board, lit, facing back at the aeroplane following
    const c = document.createElement('canvas');
    c.width = 256; c.height = 88;
    const g = c.getContext('2d');
    g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, 256, 88);
    g.fillStyle = '#ffd21a'; g.font = '900 46px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('FOLLOW ME', 128, 46, 240);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.69), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
    board.rotation.y = Math.PI;
    board.position.set(0, 2.35, -0.52);
    group.add(board);
    // the beacon
    this.beaconMat = new THREE.MeshBasicMaterial({ color: 0xff9a1a });
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 10), this.beaconMat);
    beacon.position.set(0, 2.86, -0.4);
    group.add(beacon);
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute([0, 2.86, -0.4], 3));
    this.glow = new THREE.Points(pg, new THREE.PointsMaterial({
      map: new THREE.CanvasTexture(glowCanvas()), color: 0xff9a1a, size: 2.4, sizeAttenuation: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: true
    }));
    group.add(this.glow);
    group.visible = false;
    scene.add(group);
    this.group = group;
    this.fl = null;
    this.rec = null;
    this.home = null;
    this.pieces = [];
    this.waitFor = null;
  },

  // per frame: dt real seconds, time the scene's clock, dark 0..1
  update(fl, dt, time, dark) {
    const car = this.group;
    if (!car) return;
    if (this.fl !== fl) {
      this.fl = fl; this.path = null; this.route = null; this.s = 0; this.v = 0; this.moved = false; this.spot = null;
      this.leaving = false; this.stuck = 0; this.routeEnd = 0; this.meetKey = '';
    }
    const p = fl.phase, g = fl.guidance;
    const rec = fl.followMe && (p === 'EXIT' || p === 'SHUTDOWN' || p === 'PARKED') && Scene3D.airports3D ? Scene3D.airports3D.get(fl.arrival.id) : null;
    if (!rec) { this.hide(); return; }
    this.rec = rec;
    const F = FOLLOW_ME, sdt = dt * fl.env.timeAccel;
    // (another emergency service called meanwhile: the waiting place planned anew, beyond it)
    const mk = (fl.meet || []).join(',');
    if (this.route && !this.leaving && mk !== this.meetKey) this.follow(fl, this.route);
    let want = 0, accel = F.ACCEL_MS2;
    if (p === 'EXIT' && g && g.route && g.route.length > 2) {
      if (g.route !== this.route) this.follow(fl, g.route);
      // ahead of the nose by the gap and the lead, setting off in time to get up to the aeroplane's
      // speed, at its speed once there, and slowing down to stop at the end of its way; it waits
      // until the aeroplane turns off the runway
      const st = fl.st;
      const vAc = Math.min(Math.hypot(st.vel.x, st.vel.z), F.RUN_KT * KTS);
      // (the nose on the car's own way, which takes the corners on their curves: off the runway the
      // guidance's distance, which is less than 0 there)
      const ac = g.along < 0 ? g.along : this.project(st.pos.x, st.pos.z);
      const nose = ac + fl.dims.len / 2, gap = this.s - F.CAR_LEN / 2 - nose, lead = F.GAP_M + F.LEAD_S * vAc;
      const target = nose + F.CAR_LEN / 2 + lead + Math.max(0, vAc * vAc - this.v * this.v) / (2 * F.ACCEL_MS2);
      const cap = (gap < lead ? F.RUN_KT : F.MAX_KT) * KTS;           // caught up: faster than a car leads
      want = Math.min(this.moved || g.along >= 0 ? Math.max(0, vAc + (target - this.s) * 0.5) : 0, cap);
      if (gap < F.GAP_M) accel = F.RUN_ACCEL_MS2;
    } else if (this.path) {
      // the engines winding down: off home along the service road
      if (p !== 'EXIT' && !this.leaving) this.leave(fl);
      // the aeroplane on its stand: on to the car's own waiting place beside it, or home
      want = this.s < this.end ? F.APRON_KT * KTS : 0;
    }
    if (!this.path) { this.hide(); return; }
    // off the taxi route (up beside the stand, on the service road): no faster than APRON_KT, and
    // waiting for whoever is just ahead
    if (this.s >= this.routeEnd) want = Math.min(want, F.APRON_KT * KTS);
    if (this.held(rec, sdt)) want = 0;
    this.drive(want, accel, sdt);
    const q = this.at(this.s), a = this.at(this.s - 3), b = this.at(this.s + 3);
    car.visible = true;
    // (its parked twin by the baggage hall is this car: hidden while it is out)
    this.setHome(rec.followMeHome);
    car.position.set(q.x, Terrain.surfaceAt(q.x, q.z), q.z);
    car.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    // the points along its body, for the apron's other vehicles to keep clear of (Traffic)
    const A = fl.arrival, lq = World.local(A, q.x, q.z), la = World.local(A, a.x, a.z), lb = World.local(A, b.x, b.z);
    const dl = Math.hypot(lb.t - la.t, lb.across - la.across) || 1, ut = (lb.t - la.t) / dl, ua = (lb.across - la.across) / dl, half = F.CAR_LEN / 2;
    this.pieces = [-1, -0.5, 0, 0.5, 1].map((k) => ({ t: lq.t + ut * k * half, across: lq.across + ua * k * half }));
    // (never solid: leading, it keeps its own distance ahead, and by the stand it waits where an
    // aeroplane stopping a little past the stop bar could reach it)
    // the beacon: a flash a cycle, brighter at night (off once it is parked at home)
    const on = !(this.leaving && this.s >= this.end) && ((time % F.FLASH_S) / F.FLASH_S) < 0.35;
    this.beaconMat.color.setHex(on ? 0xffb030 : 0x5a3208);
    this.glow.visible = on;
    this.glow.material.size = 2.4 + 2.6 * dark;
    this.glow.material.opacity = 0.55 + 0.45 * dark;
  },

  // not out: the car hidden, its parked twin by the baggage hall shown
  hide() {
    this.group.visible = false;
    this.rec = null;
    this.waitFor = null;
    this.setHome(null);
  },
  // the parked twin hidden (home: rec.followMeHome of the airport the car is out at), the one hidden before shown again
  setHome(home) {
    if (this.home && this.home !== home) this.home.mesh.visible = true;
    this.home = home || null;
    if (this.home) this.home.mesh.visible = false;
  },
  // the car out at the airport rec (seen by its other vehicles: Traffic.around)
  on(rec) { return !!(this.group && this.group.visible && this.rec === rec); },

  // towards the speed `want` (m/s) at `accel`, braking to stop at the end of its way; never backs up
  drive(want, accel, sdt) {
    want = Math.min(want, Math.sqrt(2 * FOLLOW_ME.BRAKE_MS2 * Math.max(0, this.end - this.s)));
    this.v = want > this.v ? Math.min(want, this.v + accel * sdt) : Math.max(want, this.v - FOLLOW_ME.BRAKE_MS2 * sdt);
    this.s = Math.min(this.end, this.s + this.v * sdt);
    if (this.end - this.s < 0.05) { this.s = this.end; this.v = 0; }
    if (this.v > 0.5) this.moved = true;
  },

  // a vehicle just ahead of the car (FOLLOW_ME.LOOK_M past its front and its braking distance,
  // within CLEAR_M of its way: Traffic.ahead): true while it waits for it, at most WAIT_MAX_S
  held(rec, sdt) {
    const F = FOLLOW_ME, half = F.CAR_LEN / 2, A = this.fl.arrival;
    const to = Math.min(half + F.LOOK_M + this.v * this.v / (2 * F.BRAKE_MS2), this.end - this.s + half);
    const pos = (d) => { const w = this.at(this.s + d); return World.local(A, w.x, w.z); };
    const who = to > half + 1 ? Traffic.ahead(this, Traffic.around(rec, this), pos, half + 1, to, F.CLEAR_M) : (this.waitFor = null);
    this.stuck = who ? this.stuck + sdt : 0;
    return this.stuck > 0 && this.stuck < F.WAIT_MAX_S;
  },

  // The car's way along a (new) taxi route: the route without the stand, its corners on the
  // fillets' curves (World.smoothRoute, as the aeroplane follows them), on along the apron lane
  // past the stand and round up beside it to its waiting place. Not moved yet, it waits past the
  // route's exit (a new route on the landing roll is a later exit); moved, it carries on from
  // where it is.
  follow(fl, route) {
    const a = fl.arrival, n = route.length, gate = Scene3D.arrivalGate, F = FOLLOW_ME;
    const sm = World.smoothRoute(a, route.slice(0, n - 1));
    // (from the exit's node: the exit's curve off the runway is the aeroplane's, not the car's)
    const i0 = sm.first[1] - sm.first[0] > 1 ? sm.first[1] - 1 : sm.first[0];
    // (it waits past the first junction off the runway: past the end of its curve, if it has one)
    const waitI = sm.first[2] !== undefined ? sm.first[2] - 1 : sm.first[1];
    // runway-local (two curves close together share the run between them, World.buildFillets, so
    // the way never steps back)
    const loc = [];
    let waitK = 0;
    for (let i = i0; i < sm.pts.length; i++) {
      const q = World.local(a, sm.pts[i].x, sm.pts[i].z), m = loc.length, l = loc[m - 1];
      if (m && Math.hypot(q.t - l.t, q.across - l.across) < 0.05) continue;
      loc.push(q);
      if (i <= waitI) waitK = loc.length - 1;
    }
    if (loc.length < 2) return;
    // on along the apron lane the way it goes to past the stand (coming straight up to the stand,
    // to the side its home is on), round off it and up beside the stand to the car's waiting place,
    // outside the emergency services called to that side; the turn off the lane at least TURN_R
    // past the end of the route's last curve, so it is a whole arc of TURN_R
    const last = loc[loc.length - 1], before = loc[loc.length - 2];
    const home = Scene3D.airports3D && Scene3D.airports3D.get(a.id) ? Scene3D.airports3D.get(a.id).followMeHome : null;
    const dt = last.t - before.t, dn = Math.hypot(dt, last.across - before.across) || 1, along = Math.abs(dt) > dn * 0.7;
    const side = along ? Math.sign(dt) : (home && Math.sign(home.t - gate.t)) || 1;
    const lay = modelLayout(fl.ac), pl = Responders3D.layout(lay, fl.meet, side).followMe;
    let tUp = gate.t + side * pl.y;
    if (along && side * (tUp - last.t) < F.TURN_R) tUp = last.t + side * F.TURN_R;
    this.spot = { t: tUp, across: World.standAcross(fl.dims.len) + pl.z, side };
    const tail = roundCorners([[before.t, before.across], [last.t, last.across], [tUp, last.across], [tUp, this.spot.across]], F.TURN_R);
    const all = loc.slice(0, loc.length - 2).concat(tail);
    const pts = all.map((q) => World.at(a, q.t, q.across));
    const S = [0];
    for (let i = 0; i + 1 < pts.length; i++) S.push(S[i] + Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z));
    this.acS = null;
    const was = this.path ? this.at(this.s) : null;
    this.route = route; this.meetKey = (fl.meet || []).join(','); this.path = pts; this.S = S; this.end = S[S.length - 1];
    this.routeEnd = S[loc.length - 2];
    if (!this.moved || !was) { this.s = Math.min(this.end, S[clamp(waitK, 1, S.length - 1)] + F.WAIT_M); this.v = 0; return; }
    // the nearest point of the new way to where the car is
    let best = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz || 1;
      const u = clamp(((was.x - p.x) * dx + (was.z - p.z) * dz) / l2, 0, 1);
      const d = Math.hypot(p.x + dx * u - was.x, p.z + dz * u - was.z);
      if (d < best) { best = d; this.s = S[i] + u * (S[i + 1] - S[i]); }
    }
  },

  // home: from its waiting place (or wherever it has got to on the way there) on up to the service
  // road, round onto the lane that keeps right towards its home (rec.followMeHome, by the first
  // baggage hall's door: baggage3d.js), along it and in to its place by the glass, the way it parks
  // there; with no home it stays where it waited
  leave(fl) {
    this.leaving = true;
    const sp = this.spot, rec = Scene3D.airports3D ? Scene3D.airports3D.get(fl.arrival.id) : null, h = rec && rec.followMeHome;
    if (!sp || !h) return;
    const dir = Math.sign(h.t - sp.t) || 1, lane = LAYOUT.SERVICE_ROAD + dir * BAG_LANE;
    const tail = roundCorners([[sp.t, sp.across], [sp.t, lane], [h.t - dir * 19, lane], [h.t - dir * 10, h.across], [h.t, h.across]], FOLLOW_ME.TURN_R);
    this.path = this.path.slice(); this.S = this.S.slice();
    for (const q of tail.slice(1)) {
      const w = World.at(fl.arrival, q.t, q.across), l = this.path[this.path.length - 1];
      this.path.push({ x: w.x, z: w.z });
      this.S.push(this.S[this.S.length - 1] + Math.hypot(w.x - l.x, w.z - l.z));
    }
    this.end = this.S[this.S.length - 1];
  },

  // how far along the car's way the aeroplane is (its nearest point, searched near the last one,
  // so a later stretch passing close by never takes over)
  project(x, z) {
    const P = this.path, S = this.S, near = this.acS !== null && this.acS !== undefined;
    let best = Infinity, out = this.acS || 0;
    for (let i = 0; i + 1 < P.length; i++) {
      if (near && (S[i + 1] < this.acS - 60 || S[i] > this.acS + 150)) continue;
      const p = P[i], q = P[i + 1], dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz || 1;
      const u = clamp(((x - p.x) * dx + (z - p.z) * dz) / l2, 0, 1);
      const d = Math.hypot(p.x + dx * u - x, p.z + dz * u - z);
      if (d < best) { best = d; out = S[i] + u * (S[i + 1] - S[i]); }
    }
    this.acS = out;
    return out;
  },

  // the point s metres along the car's way
  at(s) {
    const P = this.path, S = this.S;
    s = clamp(s, 0, this.end);
    let i = 0;
    while (i < P.length - 2 && S[i + 1] < s) i++;
    const u = clamp((s - S[i]) / ((S[i + 1] - S[i]) || 1), 0, 1);
    return { x: P[i].x + (P[i + 1].x - P[i].x) * u, z: P[i].z + (P[i + 1].z - P[i].z) * u };
  }
};

// A way through the corners [[t, across], ...], each inner corner taken on a circular arc of
// radius r, less where its legs are too short for that (a leg shared by the arcs at its two ends
// in proportion, the last one keeping a fifth of it straight): [{ t, across }] from the first
// corner to the last, the arcs in pieces of 2 m or less.
function roundCorners(corners, r) {
  const n = corners.length;
  const len = (i) => Math.hypot(corners[i + 1][0] - corners[i][0], corners[i + 1][1] - corners[i][1]);
  // each inner corner's turn and how far along its legs its arc wants (r tan(turn / 2))
  const turn = [], want = [];
  for (let i = 0; i < n; i++) {
    turn.push(0); want.push(0);
    if (i === 0 || i === n - 1) continue;
    const p = corners[i - 1], c = corners[i], q = corners[i + 1], l1 = len(i - 1), l2 = len(i);
    if (l1 < 0.05 || l2 < 0.05) continue;
    const u = [(c[0] - p[0]) / l1, (c[1] - p[1]) / l1], v = [(q[0] - c[0]) / l2, (q[1] - c[1]) / l2];
    const cross = u[0] * v[1] - u[1] * v[0], tn = Math.atan2(Math.abs(cross), u[0] * v[0] + u[1] * v[1]);
    if (tn < 2 * DEG) continue;
    turn[i] = tn * Math.sign(cross);
    want[i] = r * Math.tan(tn / 2);
  }
  // (the arcs at both ends of a leg too long for it: both shortened in proportion)
  const d = want.slice();
  for (let i = 0; i + 1 < n; i++) {
    const room = len(i) * (i + 1 === n - 1 ? 0.8 : 1), sum = want[i] + want[i + 1];
    if (sum > room) { const k = room / sum; d[i] = Math.min(d[i], want[i] * k); d[i + 1] = Math.min(d[i + 1], want[i + 1] * k); }
  }
  const out = [{ t: corners[0][0], across: corners[0][1] }];
  for (let i = 1; i < n; i++) {
    const c = corners[i];
    if (!turn[i] || d[i] < 0.05) { if (i === n - 1 || len(i) >= 0.05) out.push({ t: c[0], across: c[1] }); continue; }
    const p = corners[i - 1], l1 = len(i - 1), u = [(c[0] - p[0]) / l1, (c[1] - p[1]) / l1];
    const tn = Math.abs(turn[i]), sg = Math.sign(turn[i]), rr = d[i] / Math.tan(tn / 2);
    // (the arc from d before the corner to d after it, its centre rr inside the turn)
    const a1 = [c[0] - u[0] * d[i], c[1] - u[1] * d[i]], ctr = [a1[0] - u[1] * rr * sg, a1[1] + u[0] * rr * sg];
    const a0 = Math.atan2(a1[1] - ctr[1], a1[0] - ctr[0]);
    const steps = Math.max(2, Math.ceil(tn * rr / 2), Math.ceil(tn / (10 * DEG)));
    for (let k = 0; k <= steps; k++) {
      const ang = a0 + sg * tn * k / steps;
      out.push({ t: ctr[0] + Math.cos(ang) * rr, across: ctr[1] + Math.sin(ang) * rr });
    }
  }
  return out;
}
