'use strict';

// ============================================================
// World Aviation — the first officer taxis in
// Once the pilot has flown COPILOT.FLIGHTS flights in the type, Enter
// after the landing hands the taxi to the stand to the first officer
// (Game.toggleCopilot). The first officer works the throttle, the
// brakes and the nosewheel: steers for a point on the taxi route a
// little ahead (pure pursuit along the route the arrow follows,
// sim/guidance.js; its own point, nearer than the arrow's) and keeps
// COPILOT.SPEED_SHARE of the taxi speed limit (sim/taxilimit.js; the
// turns no faster than its nosewheel takes them with room to spare),
// while the time may run up to
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
  // COPILOT.PARK_LEFT_M short of where it parks (a long one short of the stand: World.standAcross)
  handoverAt(route, len) {
    if (route.length < 2) return 0;
    const li = this.leadIn(route);
    const past = COPILOT.AFTER_TURN_M + COPILOT.AFTER_TURN_LEN * (len || 0);
    const short = LAYOUT.STAND - World.standAcross(len);
    return li.at + Math.max(0, Math.min(this.turnIn(route) + past, li.len - short - COPILOT.PARK_LEFT_M));
  },
  // how far down the lead-in the turn into it ends (metres from the corner)
  turnIn(route) {
    const n = route.length;
    if (n < 3) return LAYOUT.FILLET_STAND_R;
    const a = route[n - 3], b = route[n - 2], c = route[n - 1];
    const ux = b.x - a.x, uz = b.z - a.z, vx = c.x - b.x, vz = c.z - b.z;
    const ang = Math.acos(clamp((ux * vx + uz * vz) / ((Math.hypot(ux, uz) * Math.hypot(vx, vz)) || 1), -1, 1));
    return ang > 25 * DEG && ang < 155 * DEG ? LAYOUT.FILLET_STAND_R * Math.tan(ang / 2) : 0;
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

  // the fastest the nosewheel steering (Flight.steerMax: the lock shrinks with the speed) turns
  // this aeroplane on a curve of radius R (metres) with COPILOT.STEER_SHARE of the lock, kt (room
  // to catch a turn begun a little late) — a long one (the A380, the 747) takes the turn into a
  // stand at walking pace, a short one at the limit; a turn the other way round just after another
  // (reverse: off the taxiway onto the apron lane and at once into a stand) with
  // COPILOT.REVERSE_STEER_SHARE, slower: the nosewheel takes seconds to go over from one lock to
  // the other, and a 747 at 7 kt was carried 12 m wide meanwhile
  turnKt(fl, R, reverse) {
    const steer = Math.atan(fl.dims.len * 0.38 / Math.max(R, 1)) / (reverse ? COPILOT.REVERSE_STEER_SHARE : COPILOT.STEER_SHARE);
    const k = Math.sqrt(Math.min(1, steer / (SIM.NOSEWHEEL_MAX_STEER_DEG * DEG)));
    return Math.max(COPILOT.MIN_TURN_MS, SIM.NOSEWHEEL_FADE_MS * (1 - k)) / KTS;
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
    // the speed: the limit with what is coming (a turn no faster than this aeroplane's nosewheel
    // holds its curve: turnKt), and a stop at the handover point
    const left = this.left(fl);
    const lim = TaxiLimit.along(fl.arrival, g.route, g.along, COPILOT.DECEL_MS2, (R, rev) => this.turnKt(fl, R, rev));
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
    // the nosewheel: the curve that meets a point on the taxi line ahead (pure pursuit), as a share
    // of the steering the speed allows (Flight.steerMax); rolling down the runway to the exit, the
    // centreline a carrot ahead until the exit's curve begins (the arrow leans towards the exit
    // from far down the runway); on the stand's lead-in, once the turn into it is behind (cutting
    // its curve, a 747 swung 12 m wide), its line ahead, past the stand if need be
    // (aimed at the stand itself, the nose points at it from a metre or two aside and never lines
    // up with the stand). Off the runway its own point, nearer than the arrow's (COPILOT.LOOK_*:
    // by the wheelbase and the speed): with the arrow's 49 m a 747 cut the curves between the
    // short legs by the apron and was carried wide after them, and came onto the lead-in's line
    // only metres before the stand.
    const a = fl.arrival, carrot = Math.max(30, fl.dims.len * 0.65), wb = fl.dims.len * 0.38;
    const near = Math.min(carrot, Math.max(COPILOT.LOOK_MIN_M, wb * COPILOT.LOOK_WB + speed * COPILOT.LOOK_S));
    let tgt = g.target, look = carrot;
    if (g.along < -carrot - (g.route[0].turnBack || LAYOUT.FILLET_EXIT_R)) tgt = World.at(a, World.local(a, st.pos.x, st.pos.z).t + carrot, 0);
    else if (g.along > this.leadIn(g.route).at + this.turnIn(g.route)) {
      const r = g.route, A = r[r.length - 2], B = r[r.length - 1], len = Math.hypot(B.x - A.x, B.z - A.z);
      const ux = (B.x - A.x) / len, uz = (B.z - A.z) / len;
      const k = (st.pos.x - A.x) * ux + (st.pos.z - A.z) * uz + near;
      tgt = { x: A.x + ux * k, z: A.z + uz * k };
      look = near;
    } else {
      const prog = World.routeProgress(a, g.route, st.pos.x, st.pos.z, near, true);
      if (prog && prog.carrot) { tgt = prog.carrot; look = near; }
    }
    const alpha = wrapDeg(bearingDeg(st.pos.x, st.pos.z, tgt.x, tgt.z) - fl.headingDeg()) * DEG;
    look = clamp(Math.hypot(tgt.x - st.pos.x, tgt.z - st.pos.z), 10, look);
    const steer = Math.atan(2 * wb * Math.sin(alpha) / look);
    const steerMax = fl.steerMax(speed);
    st.rudder = clamp(steer / steerMax, -1, 1);
  }
};
