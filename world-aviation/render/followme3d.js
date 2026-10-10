'use strict';

// ============================================================
// World Aviation — the FOLLOW ME car (three.js), on the pilot's
// first landing at an airport (fl.followMe, set by game.js)
//   - it waits on the taxiway FOLLOW_ME.WAIT_M past the runway exit
//     the guidance arrow picks (moving on to the next one while the
//     landing roll passes an exit), and once the aeroplane turns off
//     the runway it drives ahead of it along the taxi route
//     (sim/guidance.js), its back FOLLOW_ME.GAP_M plus FOLLOW_ME.LEAD_S
//     seconds of the aeroplane's speed past the nose, setting off in
//     time to get up to that speed: it waits when the aeroplane stops
//     and never backs up; caught up, it speeds up (harder still inside
//     GAP_M) and goes up to RUN_KT instead of MAX_KT
//   - by the stand it drives on along the apron lane past the wingtip
//     of the aeroplane turning in (less where the apron ends), pulls
//     off the lane to the runway side and waits there, out of the way
//     (it gets there even when the aeroplane is parked first)
//   - a yellow car with black and yellow checks along its sides, the
//     lit FOLLOW ME board on the roof facing back at the pilot, and an
//     amber beacon flashing
// A missed turn's new route: the car carries on from where it is on it.
// Used by Scene3D.update.
// ============================================================

const CAR_HALF_M = 2.2;           // (half the car's length)

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
  },

  // per frame: dt real seconds, time the scene's clock, dark 0..1
  update(fl, dt, time, dark) {
    const car = this.group;
    if (!car) return;
    if (this.fl !== fl) { this.fl = fl; this.path = null; this.route = null; this.s = 0; this.v = 0; this.moved = false; }
    const p = fl.phase, g = fl.guidance;
    if (!fl.followMe || !(p === 'EXIT' || p === 'SHUTDOWN' || p === 'PARKED')) { car.visible = false; return; }
    if (p === 'EXIT' && g && g.route && g.route.length > 2) {
      if (g.route !== this.route) this.follow(fl, g.route);
      // ahead of the nose by the gap and the lead, setting off in time to get up to the aeroplane's
      // speed, at its speed once there, and slowing down to stop at the end of its way; it waits
      // until the aeroplane turns off the runway
      const F = FOLLOW_ME, st = fl.st, sdt = dt * fl.env.timeAccel;
      const vAc = Math.min(Math.hypot(st.vel.x, st.vel.z), F.RUN_KT * KTS);
      const nose = g.along + fl.dims.len / 2, gap = this.s - CAR_HALF_M - nose, lead = F.GAP_M + F.LEAD_S * vAc;
      const target = nose + CAR_HALF_M + lead + Math.max(0, vAc * vAc - this.v * this.v) / (2 * F.ACCEL_MS2);
      const cap = (gap < lead ? F.RUN_KT : F.MAX_KT) * KTS;           // caught up: faster than a car leads
      const want = this.moved || g.along >= 0 ? Math.max(0, vAc + (target - this.s) * 0.5) : 0;
      this.drive(Math.min(want, cap), gap < F.GAP_M ? F.RUN_ACCEL_MS2 : F.ACCEL_MS2, sdt);
    } else if (this.path && this.s < this.end) {
      // the aeroplane on its stand: on to the car's own waiting place beside it
      this.drive(FOLLOW_ME.MAX_KT * KTS, FOLLOW_ME.ACCEL_MS2, dt * fl.env.timeAccel);
    }
    if (!this.path) { car.visible = false; return; }
    const q = this.at(this.s), a = this.at(this.s - 3), b = this.at(this.s + 3);
    car.visible = true;
    car.position.set(q.x, Terrain.surfaceAt(q.x, q.z), q.z);
    car.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    // the beacon: a flash a cycle, brighter at night
    const on = ((time % FOLLOW_ME.FLASH_S) / FOLLOW_ME.FLASH_S) < 0.35;
    this.beaconMat.color.setHex(on ? 0xffb030 : 0x5a3208);
    this.glow.visible = on;
    this.glow.material.size = 2.4 + 2.6 * dark;
    this.glow.material.opacity = 0.55 + 0.45 * dark;
  },

  // towards the speed `want` (m/s) at `accel`, braking to stop at the end of its way; never backs up
  drive(want, accel, sdt) {
    want = Math.min(want, Math.sqrt(2 * FOLLOW_ME.BRAKE_MS2 * Math.max(0, this.end - this.s)));
    this.v = want > this.v ? Math.min(want, this.v + accel * sdt) : Math.max(want, this.v - FOLLOW_ME.BRAKE_MS2 * sdt);
    this.s = Math.min(this.end, this.s + this.v * sdt);
    if (this.end - this.s < 0.05) { this.s = this.end; this.v = 0; }
    if (this.v > 0.5) this.moved = true;
  },

  // The car's way along a (new) taxi route: the route without the stand, on along the apron lane;
  // the same distances along it as the guidance's. Not moved yet, it waits past the route's exit
  // (a new route on the landing roll is a later exit); moved, it carries on from where it is.
  follow(fl, route) {
    const n = route.length;
    const pts = route.slice(0, n - 1).map((r) => ({ x: r.x, z: r.z }));
    const S = [0];
    for (let i = 0; i + 1 < pts.length; i++) S.push(S[i] + Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z));
    // on along the apron lane past the wingtip of the aeroplane turning in (as far as the apron
    // goes), then off the lane to the runway side, out of the way
    const F = FOLLOW_ME, a = fl.arrival, lane = route[n - 2], prev = route[n - 3];
    const dt = lane.t - prev.t, dl = Math.hypot(lane.x - prev.x, lane.z - prev.z) || 1;
    const room = dt > 0 ? a.apronT1 - 20 - lane.t : lane.t - (a.apronT0 + 20);
    const ext = Math.abs(dt) > dl * 0.7 ? clamp(Math.max(F.PARK_MIN_M, fl.dims.span / 2 + F.PARK_CLEAR_M), 0, room) : 0;   // (the last leg along the lane)
    const ux = (lane.x - prev.x) / dl, uz = (lane.z - prev.z) / dl;
    const add = (d, off) => {
      const q = pts[pts.length - 1], x = lane.x + ux * d - a.perX * off, z = lane.z + uz * d - a.perZ * off;
      pts.push({ x, z });
      S.push(S[S.length - 1] + Math.hypot(x - q.x, z - q.z));
    };
    if (ext > F.PULL_RUN_M + 5) { add(ext - F.PULL_RUN_M, 0); add(ext, F.PULL_M); }
    else if (ext > 1) add(ext, 0);
    const was = this.path ? this.at(this.s) : null;
    this.route = route; this.path = pts; this.S = S; this.end = S[S.length - 1];
    if (!this.moved || !was) { this.s = Math.min(this.end, S[1] + FOLLOW_ME.WAIT_M); this.v = 0; return; }
    // the nearest point of the new way to where the car is
    let best = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz || 1;
      const u = clamp(((was.x - p.x) * dx + (was.z - p.z) * dz) / l2, 0, 1);
      const d = Math.hypot(p.x + dx * u - was.x, p.z + dz * u - was.z);
      if (d < best) { best = d; this.s = S[i] + u * (S[i + 1] - S[i]); }
    }
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
