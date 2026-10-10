'use strict';

// ============================================================
// World Aviation — the first officer taxis in
// Once the pilot has flown COPILOT.FLIGHTS flights in the type, Enter
// after the landing hands the taxi to the stand to the first officer
// (Game.toggleCopilot). The first officer works the throttle, the
// brakes and the nosewheel: steers for the guidance arrow's point
// (pure pursuit, sim/guidance.js) and keeps COPILOT.SPEED_SHARE of the
// taxi speed limit (sim/taxilimit.js), while the time may run up to
// COPILOT.TIME_ACCEL (Flight.timeAccelMax). COPILOT.HANDOVER_M before
// the stand's lead-in leaves the apron lane the first officer stops
// and gives the controls back: parking is the pilot's. The stick or
// the brakes, or Enter again, take them back at any moment (game.js).
// State in fl.copilot: { on, thrI, done }. No drawing; used by game.js.
// ============================================================

const Copilot = {
  // how far along the route the first officer stops: COPILOT.HANDOVER_M before the stand's
  // lead-in (the route's last leg) leaves the apron lane
  handoverAt(route) {
    const n = route.length;
    if (n < 2) return 0;
    let total = 0;
    for (let i = 0; i + 1 < n; i++) total += Math.hypot(route[i + 1].x - route[i].x, route[i + 1].z - route[i].z);
    return total - Math.hypot(route[n - 1].x - route[n - 2].x, route[n - 1].z - route[n - 2].z) - COPILOT.HANDOVER_M;
  },
  // the metres still to taxi before the handover (none without a route)
  left(fl) {
    const g = fl.guidance;
    return g && g.route && g.route.length > 1 ? this.handoverAt(g.route) - g.along : 0;
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
    // from far down the runway)
    const a = fl.arrival, carrot = Math.max(30, fl.dims.len * 0.65);
    let tgt = g.target;
    if (g.along < -carrot - LAYOUT.FILLET_EXIT_R) tgt = World.at(a, World.local(a, st.pos.x, st.pos.z).t + carrot, 0);
    const alpha = wrapDeg(bearingDeg(st.pos.x, st.pos.z, tgt.x, tgt.z) - fl.headingDeg()) * DEG;
    const look = clamp(Math.hypot(tgt.x - st.pos.x, tgt.z - st.pos.z), 10, carrot);
    const steer = Math.atan(2 * fl.dims.len * 0.38 * Math.sin(alpha) / look);
    const steerMax = SIM.NOSEWHEEL_MAX_STEER_DEG * DEG * clamp(1 - speed / 26, 0.06, 1);
    st.rudder = clamp(steer / steerMax, -1, 1);
  }
};
