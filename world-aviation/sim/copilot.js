'use strict';

// ============================================================
// World Aviation — the first officer taxis in
// Once the pilot has flown COPILOT.FLIGHTS flights in the type, Enter
// after the landing hands the taxi to the stand to the first officer
// (Game.toggleCopilot). The first officer works the throttle, the
// brakes and the nosewheel: steers for the guidance arrow's point
// (pure pursuit, sim/guidance.js) and keeps COPILOT.SPEED_SHARE of the
// taxi speed limit (sim/taxilimit.js), while the time may run up to
// COPILOT.TIME_ACCEL (Flight.timeAccelMax). On the stand's lead-in it
// keeps to the lead-in's line, and COPILOT.AFTER_TURN_M plus
// COPILOT.AFTER_TURN_LEN of the aeroplane's length past the end of the
// turn into it (at least COPILOT.PARK_LEFT_M short of the stand) it
// stops and gives the controls back: only the straight run onto the
// stop bar is left, and parking is the pilot's. The stick or the
// brakes, or Enter again, take them back at any moment (game.js).
// State in fl.copilot: { on, thrI, done }. No drawing; used by game.js.
// ============================================================

const Copilot = {
  // where along the route the stand's lead-in (the route's last leg) leaves the apron lane, and
  // its length
  leadIn(route) {
    const n = route.length;
    let total = 0;
    for (let i = 0; i + 1 < n; i++) total += Math.hypot(route[i + 1].x - route[i].x, route[i + 1].z - route[i].z);
    const len = Math.hypot(route[n - 1].x - route[n - 2].x, route[n - 1].z - route[n - 2].z);
    return { at: total - len, len };
  },
  // how far along the route the first officer stops (len: the aeroplane's length): on the
  // lead-in, past where the turn into it ends (the curve of LAYOUT.FILLET_STAND_R at that corner,
  // sim/world.js buildFillets; none when the lead-in goes straight on; a route that starts on the
  // apron lane, planned anew there, turns off it square) by COPILOT.AFTER_TURN_M and a share of
  // the length, so that a long aeroplane has straightened up too — but at least
  // COPILOT.PARK_LEFT_M short of the stand
  handoverAt(route, len) {
    const n = route.length;
    if (n < 2) return 0;
    const li = this.leadIn(route);
    let turn = LAYOUT.FILLET_STAND_R;
    if (n > 2) {
      turn = 0;
      const a = route[n - 3], b = route[n - 2], c = route[n - 1];
      const ux = b.x - a.x, uz = b.z - a.z, vx = c.x - b.x, vz = c.z - b.z;
      const ang = Math.acos(clamp((ux * vx + uz * vz) / ((Math.hypot(ux, uz) * Math.hypot(vx, vz)) || 1), -1, 1));
      if (ang > 25 * DEG && ang < 155 * DEG) turn = LAYOUT.FILLET_STAND_R * Math.tan(ang / 2);
    }
    const past = COPILOT.AFTER_TURN_M + COPILOT.AFTER_TURN_LEN * (len || 0);
    return li.at + Math.max(0, Math.min(turn + past, li.len - COPILOT.PARK_LEFT_M));
  },
  // the metres still to taxi before the handover (none without a route)
  left(fl) {
    const g = fl.guidance;
    return g && g.route && g.route.length > 1 ? this.handoverAt(g.route, fl.dims.len) - g.along : 0;
  },
  // the metres still to taxi before the turn into the stand begins (none without a route)
  toTurnIn(fl) {
    const g = fl.guidance;
    return g && g.route && g.route.length > 1 ? this.leadIn(g.route).at - LAYOUT.FILLET_STAND_R - g.along : 0;
  },

  // Each frame, instead of the pilot's controls (dt: the simulated seconds of the frame). Sets
  // fl.copilot.done once the aeroplane stands still at the handover point.
  update(fl, dt) {
    const c = fl.copilot, st = fl.st, g = fl.guidance;
    st.parkingBrake = false;
    const speed = Math.hypot(st.vel.x, st.vel.z);
    if (!g || !g.route || !g.target) {
      // (no route this frame: stand on the brakes)
      fl.setThrottle(0); st.brakeInput = 1; st.rudder = 0;
      return;
    }
    // the speed: the limit with what is coming, and a stop at the handover point
    const left = this.left(fl);
    const lim = TaxiLimit.along(fl.arrival, g.route, g.along, COPILOT.DECEL_MS2);
    let want = Math.min(lim.now * KTS * COPILOT.SPEED_SHARE, Math.sqrt(2 * COPILOT.DECEL_MS2 * Math.max(0, left)));
    if (left < 1.5) want = 0;
    const err = want - speed;
    c.thrI = clamp(c.thrI + COPILOT.THROTTLE_I * err * dt, 0, COPILOT.MAX_THROTTLE);
    if (want === 0) {
      fl.setThrottle(0);
      st.brakeInput = 1;
      if (speed < 0.3) c.done = true;
    } else {
      fl.setThrottle(clamp(c.thrI + COPILOT.THROTTLE_P * err, 0, COPILOT.MAX_THROTTLE));
      st.brakeInput = err < -COPILOT.BRAKE_FROM_MS ? clamp((-err - COPILOT.BRAKE_FROM_MS) * COPILOT.BRAKE_P, 0, 1) : 0;
    }
    // the nosewheel: the curve that meets the arrow's point (pure pursuit), as a share of the
    // steering the speed allows (Flight.groundStep); rolling down the runway to the exit, the
    // centreline a carrot ahead until the exit's curve begins (the arrow leans towards the exit
    // from far down the runway); on the stand's lead-in its line a carrot ahead, past the stand if
    // need be (aimed at the stand itself, the nose points at it from a metre or two aside and
    // never lines up with the stand)
    const a = fl.arrival, carrot = Math.max(30, fl.dims.len * 0.65);
    let tgt = g.target;
    if (g.along < -carrot - LAYOUT.FILLET_EXIT_R) tgt = World.at(a, World.local(a, st.pos.x, st.pos.z).t + carrot, 0);
    else if (g.along > this.leadIn(g.route).at) {
      const r = g.route, A = r[r.length - 2], B = r[r.length - 1], len = Math.hypot(B.x - A.x, B.z - A.z);
      const ux = (B.x - A.x) / len, uz = (B.z - A.z) / len;
      const k = (st.pos.x - A.x) * ux + (st.pos.z - A.z) * uz + carrot;
      tgt = { x: A.x + ux * k, z: A.z + uz * k };
    }
    const alpha = wrapDeg(bearingDeg(st.pos.x, st.pos.z, tgt.x, tgt.z) - fl.headingDeg()) * DEG;
    const look = clamp(Math.hypot(tgt.x - st.pos.x, tgt.z - st.pos.z), 10, carrot);
    const steer = Math.atan(2 * fl.dims.len * 0.38 * Math.sin(alpha) / look);
    const steerMax = SIM.NOSEWHEEL_MAX_STEER_DEG * DEG * clamp(1 - speed / 26, 0.06, 1);
    st.rudder = clamp(steer / steerMax, -1, 1);
  }
};
