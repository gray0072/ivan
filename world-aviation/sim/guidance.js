'use strict';

// ============================================================
// World Aviation — the guidance arrow
// On the ground the arrow points at a carrot a little way ahead
// on the taxi route (pure pursuit), so it already turns towards the
// next leg as you come up to a corner. The route follows the pilot:
//   - a missed turn (well off the route, the route behind you) gives
//     a new route on from the nearest junction ahead, so the arrow
//     never points back at a turn already passed;
//   - on the landing roll the exit is the nearest one still ahead (its
//     curve not begun yet); roll past it and the arrow moves on to the
//     next one — until you turn onto it, then it stays (the first
//     officer taxiing takes the first one still reachable at its speed:
//     room to slow down to its turn-off speed before its curve); while
//     it is still far, the arrow leans towards it (its turn-off at the edge);
//   - lining up, it leads onto the centreline ahead, never back to
//     the line-up point.
// In the air without the autopilot it gives the bearing to the
// runway. No drawing: ui/hud.js shows fl.guidance. Used by game.js;
// the route and how far along it the aeroplane is serve the taxi
// speed limits (sim/taxilimit.js) and the first officer (sim/copilot.js).
// ============================================================

const Guidance = {
  update(game) {
    const fl = game.flight, st = fl.st;
    if (!fl.guidance) fl.guidance = { visible: false, bearing: 0, dist: 0, remaining: 0 };
    const g = fl.guidance;
    g.visible = false;
    g.remaining = 0;
    g.route = null;             // the taxi route followed now, and how far along it the aeroplane is
    g.along = 0;                // (metres; less than 0 still rolling down the runway to its exit)
    g.target = null;            // the point the arrow points at (the first officer steers for it too)
    let target = null;
    const p = fl.phase;
    const look = Math.max(30, fl.dims.len * 0.65);         // the carrot, this far ahead on the taxi line
    if (p === 'TAXI_OUT') {
      const a = fl.world;
      let prog = World.routeProgress(a, fl.route, st.pos.x, st.pos.z, look);
      if (prog && this.missed(prog, st)) {
        const r = this.routeAhead(a, st, a.nodes.hold);
        if (r) { fl.route = r; prog = World.routeProgress(a, r, st.pos.x, st.pos.z, look); }
      }
      if (prog) {
        target = prog.carrot; g.remaining = prog.remaining; g.deviation = prog.deviation;
        g.route = fl.route; g.along = prog.totalLength - prog.remaining;
      }
    } else if (p === 'HOLD_SHORT') {
      target = fl.world.nodes.hold;
      if (Math.hypot(target.x - st.pos.x, target.z - st.pos.z) < 12) target = null;
    } else if (p === 'TAKEOFF' && st.onGround) {
      // onto the centreline ahead (never back to the line-up point), then straight down it
      const a = fl.world;
      const loc = World.local(a, st.pos.x, st.pos.z);
      const off = Math.abs(loc.across);
      const ahead = off < SIM.LINEUP_ACROSS_M * 2 ? 300 : Math.max(look, off);
      target = World.at(a, Math.max(a.nodes.rwyStart.t + 15, loc.t + ahead), 0);
    } else if (p === 'EXIT' && game.arrivalRoute) {
      const a = fl.arrival;
      const loc = World.local(a, st.pos.x, st.pos.z);
      const rolling = Math.abs(loc.across) < RWY_HALF_WIDTH + 5 && Math.abs(wrapDeg(fl.headingDeg() - a.hdgDeg)) < SIM.EXIT_COMMIT_DEG;
      let lead = 0;
      if (rolling) {
        // still on the runway and not turning off yet: the nearest exit ahead (the first officer
        // taxiing: the first one still reachable at its speed, and it slows down for the one it
        // picked, so that one stays; so does the one whose curve you are already turning onto —
        // a rapid exit's is long)
        const cur = game.arrivalRoute[0], speed = Math.hypot(st.vel.x, st.vel.z);
        const onCurve = cur.kind === 'exit' && loc.t > cur.t - cur.turnBack && loc.t < cur.t + 30 &&
          (loc.across > 3 || wrapDeg(fl.headingDeg() - a.hdgDeg) > 3);
        let exit = cur;
        if (!onCurve && fl.copilot && fl.copilot.on) {
          const reach = this.exitFor(a, loc.t, speed, true);
          if (!(cur.kind === 'exit' && cur.t > loc.t && cur.t >= reach.t)) exit = reach;
        } else if (!onCurve) exit = this.exitFor(a, loc.t, speed, false);
        if (exit !== game.arrivalRoute[0]) game.arrivalRoute = World.findRoute(a, exit, game.arrivalGate.node);
        lead = exit.t - loc.t;
      }
      let prog = World.routeProgress(a, game.arrivalRoute, st.pos.x, st.pos.z, look);
      if (prog && !rolling && this.missed(prog, st)) {
        const r = this.routeAhead(a, st, game.arrivalGate.node);
        if (r) { game.arrivalRoute = r; prog = World.routeProgress(a, r, st.pos.x, st.pos.z, look); }
      }
      if (prog) {
        const stand = game.arrivalRoute[game.arrivalRoute.length - 1];
        // while the exit is still more than a carrot ahead: at the point where its turn-off
        // meets the runway's edge (the arrow leans towards the exit, more as it comes up, and
        // never off the paving); into the stand, the stop bar itself for the last few metres
        target = lead > look ? World.at(a, game.arrivalRoute[0].aimT, RWY_HALF_WIDTH)
          : prog.remaining < look * 0.6 ? stand : prog.carrot;
        g.remaining = prog.remaining + Math.max(0, lead); g.deviation = prog.deviation;
        g.route = game.arrivalRoute; g.along = prog.totalLength - prog.remaining - Math.max(0, lead);
      }
    } else if (!st.onGround && !fl.ap.on && !fl.navFailed && (p === 'DESCENT' || p === 'APPROACH' || p === 'CRUISE')) {
      g.visible = true;
      g.bearing = fl.navTarget().hdg;
      g.dist = fl.distToRunwayNm() * NM;
      return;
    }
    if (!target) return;
    g.visible = true;
    g.target = target;
    g.bearing = bearingDeg(st.pos.x, st.pos.z, target.x, target.z);
    g.dist = g.remaining || Math.hypot(target.x - st.pos.x, target.z - st.pos.z);
  },

  // the runway exit to take from t: the first one whose curve (SIM.EXIT_CUT of it cut) still
  // begins at least SIM.EXIT_MIN_LEAD_M ahead — reachable: far enough ahead to slow from this
  // speed (m/s) to its turn-off speed (its radius's limit, sim/taxilimit.js) at
  // SIM.EXIT_DECEL_MS2; the runway's end if none is left
  exitFor(a, t, speed, reachable) {
    for (const n of a.exits) {
      const v0 = TaxiLimit.turnKt(n.exitR) * KTS;
      const room = Math.max(SIM.EXIT_MIN_LEAD_M, reachable ? Math.max(0, speed * speed - v0 * v0) / (2 * SIM.EXIT_DECEL_MS2) : 0);
      if (n.t - n.turnBack * (1 - SIM.EXIT_CUT) - t > room) return n;
    }
    return a.exits[a.exits.length - 1];
  },

  // a missed turn: well off the route, and the nearest point of it is behind the aeroplane
  missed(prog, st) {
    if (prog.deviation < SIM.REROUTE_DEVIATION_M || !prog.closest) return false;
    const fx = hdgX(st.hdg), fz = hdgZ(st.hdg);
    return (prog.closest.x - st.pos.x) * fx + (prog.closest.z - st.pos.z) * fz < 0;
  },

  // a route to dest from the nearest junction ahead (off the runway, no other stand)
  routeAhead(a, st, dest) {
    const fx = hdgX(st.hdg), fz = hdgZ(st.hdg);
    let best = null, bestScore = Infinity;
    for (const n of a.nodeList) {
      if (n !== dest && (n.kind === 'gate' || n.kind === 'exit' || n.kind === 'lineup')) continue;
      const dx = n.x - st.pos.x, dz = n.z - st.pos.z, d = Math.hypot(dx, dz);
      if (d > 600) continue;
      const ang = d > 1 ? Math.acos(clamp((dx * fx + dz * fz) / d, -1, 1)) / DEG : 0;
      if (ang > 75 && d > 15) continue;
      const score = d * (1 + ang / 60);
      if (score < bestScore) { bestScore = score; best = n; }
    }
    if (!best) return null;
    const r = World.findRoute(a, best, dest, [fx, fz]);
    return r.length > 1 || best === dest ? r : null;
  },

  // the middle of a taxi route's longest straight run off the runway, the apron and the stand, in
  // the airport's frame (t along the runway, across towards the terminal), and its direction (dt,
  // da) — where the fire engines stand for a water salute (render/salute3d.js; the flight school's
  // graduation flight, sim/lesson.js, counts the aeroplane through it); null: no such run
  longestRun(route) {
    let best = null;
    for (let i = 0; route && i + 1 < route.length; i++) {
      const n1 = route[i], n2 = route[i + 1];
      const e = n1.edges.find((x) => x.to === n2);
      if (!e || e.kind === 'runway' || e.kind === 'apron' || e.kind === 'stand') continue;
      const len = Math.hypot(n2.t - n1.t, n2.across - n1.across);
      if (len > 60 && (!best || len > best.len)) best = { len, t: (n1.t + n2.t) / 2, across: (n1.across + n2.across) / 2, dt: (n2.t - n1.t) / len, da: (n2.across - n1.across) / len };
    }
    return best;
  }
};
