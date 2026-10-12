'use strict';

// ============================================================
// World Aviation — the camera's flights at both ends of a flight
// (CINEMATIC in constants.js), used by Game and Scene3D:
//   - the intro: before the start a wide shot of the aeroplane
//     with the terminal ahead of it (at the gate) or the runway
//     (at the holding point), then the camera sweeps in behind
//     it, over the tail fin and along the roof, and drops into
//     the captain's seat, where the cockpit view begins;
//   - the outro: parked at the arrival gate, the camera rises
//     out of the cockpit, back over the fin and out to a wide
//     shot of the aeroplane at its gate, holds it, and the
//     debrief follows (watched from outside: from that view, by
//     way of a point clear of the aeroplane, out to the same shot);
//   - the tour: from the briefing, a look round the departure or
//     the arrival airport, its runway and terminal, ending at the
//     own aeroplane (Game.startTour);
//   - around: from the hangar, round a type in flight from every
//     side, over it and under it (ui/showcase.js);
//   - after a collision (ui/incident.js): crash — outside on the
//     spot, shaken at first, circling it slowly; tow — beside the
//     nose while a tug pulls the aeroplane back; toward — the camera
//     turning from where it is to look at something new (the police
//     driving up).
// The path is a spline through a few keys in the aeroplane's own
// axes (x right, y up, z forward), scaled to its size; the times
// of the keys are part of the spline, so it eases in and out and
// never jerks between them. The aeroplane stands still meanwhile
// (Game does not run the simulation during a shot).
// ============================================================

const Cinematic = {
  shot: null,      // { kind: 'intro' | 'outro', t, dur, hold, times, keys, inT0, inT1 }

  get active() { return !!this.shot; },

  // a shot for this flight: 'intro' (the camera comes in from the left, the captain's side) or
  // 'outro' (out to the right, so the two ends of a flight are not the same picture);
  // opts.atRunway: the intro at the holding point; opts.from: the camera (THREE) of the view
  // outside the pilot taxied in watching: the outro begins there, not in the seat
  start(kind, fl, opts) {
    const atRunway = !!(opts && opts.atRunway);
    const d = fl.dims, L = d.len, R = d.fus / 2, Z = Math.max(d.len, d.span);
    const k = L / 18, o = VIEW.COCKPIT_EYE;
    const E = [o.x * k + VIEW.COCKPIT_SEAT_X * d.fus, o.y * k, o.z * k];
    const intro = kind === 'intro', s = intro ? -1 : 1;
    // where the cockpit looks (Scene3D.cockpitPose: ahead and a little down)
    const D = L * 1.5;
    const F = [E[0], E[1] - 0.06 * D, E[2] + D];
    // the wide shot, behind and above, off to one side, looking past the nose at the terminal
    // (or across to the runway, which runs off to the right of the holding point)
    const behind = (deg, r, y) => [s * Math.sin(deg * DEG) * r, y, -Math.cos(deg * DEG) * r];
    const wideLook = atRunway ? [Z * 0.3, 0, L * 0.5 + 45] : [0, 2, L * 0.5 + 15];
    // (the outro ends on the whole aeroplane in the middle of the picture, from behind and above,
    // three quarters on, far enough for it to fit the narrower side of the view)
    const aspect = typeof window !== 'undefined' && window.innerHeight ? window.innerWidth / window.innerHeight : 1.6;
    const half = Math.min(25 * DEG, Math.atan(Math.tan(25 * DEG) * aspect));
    const far = Z * CINEMATIC.OUTRO_FIT / Math.tan(half) + CINEMATIC.OUTRO_PAD_M, el = CINEMATIC.OUTRO_ELEV_DEG * DEG;
    const keys = [
      // eye, look, field of view
      intro ? [...behind(40, Z * 1.9 + 50, Z * 0.8 + 25), ...wideLook, 50]
        : [...behind(CINEMATIC.OUTRO_AZ_DEG, far * Math.cos(el), far * Math.sin(el) + R), 0, R * 0.6, 0, 50],
      [...behind(16, Z * 0.95 + 18, Z * 0.42 + 10), 0, R, L * 0.45, 54],
      [s * Z * 0.08, R * 2.9 + L * 0.1 + 3, -L * 0.62, E[0], E[1], E[2] + L * 1.2, 62],   // over the tail fin
      [E[0], R + L * 0.05 + 1, E[2] - L * 0.16, ...F, 66],                                  // just above the roof
      [...E, ...F, VIEW.FOV_DEG]                                                              // the captain's eye
    ];
    let times = [0, 0.42, 0.74, 0.9, 1];
    if (!intro) { keys.reverse(); times = times.map((t) => 1 - t).reverse(); }
    const dur = intro ? CINEMATIC.INTRO_S : CINEMATIC.OUTRO_S;
    this.shot = {
      kind, t: 0, dur, hold: intro ? 0 : CINEMATIC.OUTRO_HOLD_S,
      times: times.map((t) => t * dur), keys,
      // the stretch inside the cockpit (the eye to the roof key)
      inT0: (intro ? times[3] : 0) * dur, inT1: (intro ? 1 : times[1]) * dur
    };
    if (!intro && opts && opts.from) {
      // from the view outside: the camera where it is (in the aeroplane's axes), half way a point
      // out of the way of the aeroplane (round it at CINEMATIC.FROM_CLEAR of its size, above
      // its fin), and the wide shot
      const wide = keys[keys.length - 1], cam = opts.from, p = fl.st.pos, ax = fl.st.axes || fl.updateAxes();
      const loc = (q) => {
        const dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z;
        return [dx * ax.right.x + dy * ax.right.y + dz * ax.right.z, dx * ax.up.x + dy * ax.up.y + dz * ax.up.z,
          dx * ax.nose.x + dy * ax.nose.y + dz * ax.nose.z];
      };
      const dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      const dist = Math.max(10, dir.x * (p.x - cam.position.x) + dir.y * (p.y - cam.position.y) + dir.z * (p.z - cam.position.z));
      const e0 = loc(cam.position), l0 = loc(cam.position.clone().addScaledVector(dir, dist));
      // (looking straight down, the top view: a little ahead, so the camera's up stays the sky's)
      const dy = Math.abs(l0[1] - e0[1]);
      if (Math.hypot(l0[0] - e0[0], l0[2] - e0[2]) < 0.15 * dy) l0[2] = e0[2] + 0.15 * dy;
      const mid = wide.map((v, i) => (v + (i < 3 ? e0[i] : i < 6 ? l0[i - 3] : cam.fov)) / 2);
      const r = Math.hypot(mid[0], mid[2]), need = Z * CINEMATIC.FROM_CLEAR + 10;
      if (r < need) {
        const ux = r > 1 ? mid[0] / r : wide[0] / Math.hypot(wide[0], wide[2]), uz = r > 1 ? mid[2] / r : wide[2] / Math.hypot(wide[0], wide[2]);
        mid[0] = ux * need; mid[2] = uz * need;
      }
      mid[1] = Math.max(mid[1], R * 2.9 + L * 0.1 + 3);
      this.shot.keys = [[...e0, ...l0, cam.fov], mid, wide];
      this.shot.times = [0, 0.5 * dur, dur];
      this.shot.inT0 = this.shot.inT1 = -1;
    }
    this.vec = this.shot.keys[0].slice();
    this.eval();
  },

  // A look round airport a (TOUR, from the briefing): in on the approach, low down the runway
  // on its left, a climbing turn to the right at the far end, back along the apron and the
  // terminal, down to the own aeroplane (fl, standing at its stand or the holding point) and
  // slowly round it from the runway side. The keys are in the world (x, y, z), each piece as
  // long as the camera takes at TOUR.SPEED_MS; marks: when the runway, the apron and the
  // aeroplane come into the picture (the captions, Game)
  tour(fl, a) {
    const H = a.half, p = World.local(a, fl.st.pos.x, fl.st.pos.z), d = fl.dims;
    // (on a screen held upright the aeroplane is seen from further off, so it fits across)
    const Z = Math.max(d.len, d.span) * clamp(1.2 * Scene3D.h / Math.max(1, Scene3D.w), 1, 2.2), up = d.fus;
    const W = (t, across, h) => { const q = World.at(a, t, across); return [q.x, a.elev + h, q.z]; };
    const key = (eye, look, fov) => [...W(...eye), ...W(...look), fov];
    const own = [p.t, p.across, up * 0.6];
    const T = LAYOUT.TERMINAL;
    const keys = [
      key([-H - TOUR.APPROACH_M, -TOUR.APPROACH_M * 0.12, TOUR.START_AGL_M], [-H + 300, 0, 0], 50),
      key([-H - 900, -140, 80], [-H + 350, 0, 0], 54),
      key([-H + 150, -70, 24], [-H + 1000, 0, 4], 62),                                   // over the threshold
      key([0, -70, 26], [H, 10, 4], 62),                                                 // down the runway
      key([H - 250, -70, 34], [H + 500, 120, 10], 60),                                   // the far end
      key([H + 650, 160, 120], [H + 250, T + 300, 30], 58),                              // a climbing turn to the right
      key([a.cargoT1 + 450, T + 230, 135], [a.apronT, T, 15], 40),                       // the terminal's roof, zoomed in
      key([a.cargoT1 + 150, 170, 95], [a.apronT, T, 8], 55),                             // the apron
      key([p.t + Z * 3 + 120, p.across - Z * 2 - 90, Z * 0.9 + 45], own, 50),            // down to the aeroplane
      key([p.t + Z * 1.3 + 12, p.across - Z * 1.15 - 8, Z * 0.32 + 9], own, 46),         // and round it
      key([p.t - Z * 1.3 - 12, p.across - Z * 1.0 - 8, Z * 0.26 + 7], own, 46)
    ];
    const times = [0];
    for (let i = 1; i < keys.length; i++) {
      const dist = Math.hypot(keys[i][0] - keys[i - 1][0], keys[i][1] - keys[i - 1][1], keys[i][2] - keys[i - 1][2]);
      const min = i === keys.length - 2 ? TOUR.CLOSE_S[0] : i === keys.length - 1 ? TOUR.CLOSE_S[1] : 1.5;
      times.push(times[i - 1] + Math.max(min, dist / TOUR.SPEED_MS));
    }
    const dur = times[times.length - 1];
    this.shot = {
      kind: 'tour', t: 0, dur, hold: TOUR.HOLD_S, times, keys, world: true, chord: true,
      inT0: -1, inT1: -1,          // never inside the cockpit
      marks: { runway: times[2] - 1.5, apron: times[5], own: times[8] }
    };
    this.vec = keys[0].slice();
    this.eval();
  },

  // A look at the own aeroplane in flight (SHOWCASE, from the hangar: ui/showcase.js): the
  // camera goes SWEEP_DEG round it from START_DEG, its height a sine through over it and under
  // its belly, coming in from a little further off; keys in the aeroplane's own axes every
  // KEY_S or so along that orbit. shot.reach: the farthest the camera gets from it, metres.
  around(fl) {
    const d = fl.dims, S = SHOWCASE;
    // (on a screen held upright it is seen from further off, so it fits across)
    const R = (Math.max(d.len, d.span) * S.DIST + S.DIST_M) * clamp(1.2 * Scene3D.h / Math.max(1, Scene3D.w), 1, 2.2);
    const n = Math.max(4, Math.round(S.DUR_S / S.KEY_S));
    const keys = [], times = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const az = (S.START_DEG - S.SWEEP_DEG * u) * DEG;
      const el = (S.MID_DEG + S.SWING_DEG * Math.sin(2 * Math.PI * u)) * DEG;
      const r = R * (1 + S.IN * (1 - smoothstep(0, 0.15, u)));
      keys.push([r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az), 0, d.fus * 0.15, 0, S.FOV_DEG]);
      times.push(u * S.DUR_S);
    }
    this.shot = { kind: 'around', t: 0, dur: S.DUR_S, hold: S.HOLD_S, times, keys, inT0: -1, inT1: -1, reach: R * (1 + S.IN) };
    this.vec = keys[0].slice();
    this.eval();
  },

  // After a collision (ui/incident.js): c, the contact (sim/collide.js: where it touched, the
  // obstacle's middle). The camera comes in on the spot from a little further off, shaken at
  // first (opts.shake: 0..1 of INCIDENT.SHAKE_M), and circles it slowly (INCIDENT.ORBIT_S,
  // ORBIT_DEG), looking between the spot and the aeroplane's middle, from the side of the spot
  // away from the obstacle turned so both are seen — the first side clear of the buildings. It
  // never ends by itself: Game ends it.
  crash(fl, c, opts) {
    const st = fl.st, d = fl.dims, Z = Math.max(d.len, d.span);
    const look = [lerp(c.x, st.pos.x, 0.35), lerp(c.y, st.pos.y, 0.35), lerp(c.z, st.pos.z, 0.35)];
    const D = clamp(Z * 0.6 + 16, 24, 95), H = D * 0.42 + 3;
    let bx = c.x - c.ox, bz = c.z - c.oz;
    if (Math.hypot(bx, bz) < 0.5) { bx = c.x - st.pos.x; bz = c.z - st.pos.z; }
    if (Math.hypot(bx, bz) < 0.5) { bx = Math.sin(st.hdg); bz = -Math.cos(st.hdg); }
    const base = Math.atan2(bx, bz);
    const at = (ang, dist, h) => [look[0] + Math.sin(ang) * dist, look[1] + h, look[2] + Math.cos(ang) * dist];
    const a = fl.nearestApt();
    const clear = (p) => !a || !Collide.nearBuilding(a, new THREE.Vector3(p[0], p[1], p[2]), 6);
    let deg = 60;
    for (const t of [60, -60, 90, -90, 30, -30, 120, -120, 0, 150, -150, 180]) {
      const ang = base + t * DEG;
      if (clear(at(ang, D, H)) && clear(at(ang, D * 0.6, H * 0.8)) && clear(at(ang, D * 1.35, H * 1.2))) { deg = t; break; }
    }
    const ang = base + deg * DEG, s = deg < 0 ? -1 : 1;
    const keys = [
      [...at(ang, D * 1.35, H * 1.2), ...look, 52],
      [...at(ang, D, H), ...look, 50],
      [...at(ang + s * INCIDENT.ORBIT_DEG * DEG, D * 0.95, H), ...look, 48]
    ];
    this.shot = {
      kind: 'crash', t: 0, dur: INCIDENT.ORBIT_S, hold: Infinity, times: [0, INCIDENT.CRASH_S, INCIDENT.ORBIT_S], keys, world: true,
      inT0: -1, inT1: -1, shake: INCIDENT.SHAKE_M * ((opts && opts.shake) || 0)
    };
    this.vec = keys[0].slice();
    this.eval();
  },

  // the tug pulling the aeroplane back (dur seconds): beside the nose on one side (side: +1 the
  // right), a little ahead, looking back along the aeroplane, drifting in; rides with the
  // aeroplane as it moves. It never ends by itself.
  tow(fl, side, dur) {
    const d = fl.dims, L = d.len, S = d.span, R = d.fus / 2;
    const x = side * (S * 0.5 + 12), y = R * 2 + L * 0.12 + 4;
    const keys = [
      [x * 1.08, y * 1.1, L * 0.9 + 10, 0, 0, L * 0.25, 50],
      [x, y, L * 0.6 + 8, 0, 0, L * 0.05, 50]
    ];
    this.shot = { kind: 'tow', t: 0, dur: Math.max(1, dur), hold: Infinity, times: [0, Math.max(1, dur)], keys, inT0: -1, inT1: -1 };
    this.vec = keys[0].slice();
    this.eval();
  },

  // from the camera where it is now (a world shot) to look at `look` (world [x, y, z]) in
  // INCIDENT.FADE_S * 3, the eye moved by `move` [dx, dy, dz] meanwhile. It never ends by itself.
  toward(look, move) {
    const v = this.vec.slice(), m = move || [0, 0, 0], T = INCIDENT.FADE_S * 3;
    const keys = [v, [v[0] + m[0], v[1] + m[1], v[2] + m[2], look[0], look[1], look[2], v[6]]];
    this.shot = { kind: 'toward', t: 0, dur: T, hold: Infinity, times: [0, T], keys, world: true, inT0: -1, inT1: -1 };
    this.vec = keys[0].slice();
    this.eval();
  },

  stop() { this.shot = null; },
  // to the end (Game ends the shot on the next update)
  skip() { if (this.shot) this.shot.t = this.shot.dur + this.shot.hold; },

  // advances the shot; true once it is over
  update(dt) {
    const sh = this.shot;
    if (!sh) return true;
    sh.t += dt;
    this.eval();
    return sh.t >= sh.dur + sh.hold;
  },

  // the camera inside the cockpit (the own aeroplane hidden, the cockpit frame drawn)
  inside() {
    const sh = this.shot;
    return !!sh && sh.t >= sh.inT0 && sh.t <= sh.inT1;
  },
  // how far the cockpit frame and the panel have faded in: 0 at the roof, 1 at the eye
  insideAmount() {
    const sh = this.shot;
    if (!this.inside()) return 0;
    const f = clamp((sh.t - sh.inT0) / Math.max(1e-3, sh.inT1 - sh.inT0), 0, 1);
    return sh.kind === 'intro' ? smoothstep(0, 1, f) : smoothstep(0, 1, 1 - f);
  },

  // the spline at the shot's time: Hermite pieces with tangents from the neighbouring keys,
  // weighted by the times between them (a non-uniform Catmull-Rom), still at both ends
  eval() {
    const sh = this.shot, T = sh.times, K = sh.keys, n = K.length;
    const t = clamp(sh.t, 0, sh.dur);
    let i = 0;
    while (i < n - 2 && t > T[i + 1]) i++;
    const h = T[i + 1] - T[i], u = h > 0 ? (t - T[i]) / h : 1;
    const u2 = u * u, u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    const tan = (j, c) => {
      if (j === 0 || j === n - 1) return 0;
      // the tour: the chord between the neighbours (pieces of very different lengths, a long
      // straight one into a tight turn, would otherwise overshoot, below the ground)
      if (sh.chord) return (K[j + 1][c] - K[j - 1][c]) / (T[j + 1] - T[j - 1]);
      const a = (K[j][c] - K[j - 1][c]) / (T[j] - T[j - 1]), b = (K[j + 1][c] - K[j][c]) / (T[j + 1] - T[j]);
      return (a * (T[j + 1] - T[j]) + b * (T[j] - T[j - 1])) / (T[j + 1] - T[j - 1]);
    };
    for (let c = 0; c < this.vec.length; c++) {
      this.vec[c] = h00 * K[i][c] + h10 * h * tan(i, c) + h01 * K[i + 1][c] + h11 * h * tan(i + 1, c);
    }
  },

  // the camera now, in the world: Scene3D.placeCamera
  pose(fl, ax) {
    const p = fl.st.pos, v = this.vec;
    if (this.shot && this.shot.world) {
      const eye = new THREE.Vector3(v[0], v[1], v[2]), sh = this.shot;
      // shaken at the impact, dying away
      if (sh.shake && sh.t < INCIDENT.SHAKE_S) {
        const k = sh.shake * Math.pow(1 - sh.t / INCIDENT.SHAKE_S, 2), t = sh.t;
        eye.x += Math.sin(t * 47) * k; eye.y += Math.sin(t * 61 + 1) * k * 0.6; eye.z += Math.sin(t * 53 + 2) * k;
      }
      return { eye, look: new THREE.Vector3(v[3], v[4], v[5]), up: new THREE.Vector3(0, 1, 0), fov: v[6] };
    }
    const W = (x, y, z) => new THREE.Vector3(
      p.x + ax.right.x * x + ax.up.x * y + ax.nose.x * z,
      p.y + ax.right.y * x + ax.up.y * y + ax.nose.y * z,
      p.z + ax.right.z * x + ax.up.z * y + ax.nose.z * z);
    return { eye: W(v[0], v[1], v[2]), look: W(v[3], v[4], v[5]), up: new THREE.Vector3(ax.up.x, ax.up.y, ax.up.z), fov: v[6] };
  }
};
