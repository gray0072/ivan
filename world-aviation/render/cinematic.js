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
//     debrief follows.
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
  // opts.atRunway: the intro at the holding point; opts.fromOutside: the outro begins at the
  // roof, not in the seat (the pilot taxied in watching from outside)
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
    const keys = [
      // eye, look, field of view
      [...behind(40, Z * 1.9 + 50, Z * 0.8 + 25), ...wideLook, 50],
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
    if (!intro && opts && opts.fromOutside) this.shot.t = this.shot.inT1 + 1e-3;
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
    const W = (x, y, z) => new THREE.Vector3(
      p.x + ax.right.x * x + ax.up.x * y + ax.nose.x * z,
      p.y + ax.right.y * x + ax.up.y * y + ax.nose.y * z,
      p.z + ax.right.z * x + ax.up.z * y + ax.nose.z * z);
    return { eye: W(v[0], v[1], v[2]), look: W(v[3], v[4], v[5]), up: new THREE.Vector3(ax.up.x, ax.up.y, ax.up.z), fov: v[6] };
  }
};
