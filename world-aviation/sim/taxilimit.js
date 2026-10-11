'use strict';

// ============================================================
// World Aviation — the taxi speed limits
// By the ground speed, along the taxi route the arrow follows:
// TAXI.STRAIGHT_KT on a straight taxiway, through a turn of the route
// (its curve and TAXI.TURN_PAD_M either side of it) the speed its
// curve's radius allows (turnKt), TAXI.APRON_KT on the apron lane and
// TAXI.STAND_KT on the stand's lead-in. Before a slower
// stretch the limit comes down along a gentle braking
// (TAXI.DECEL_MS2), so the speed can always be brought down to it in
// time. Off a route (the engine start, the holding point) it is the
// apron's or the taxiway's, by where the aeroplane is.
// Each frame fl.taxi (null when not taxiing):
//   gs     the ground speed, kt
//   limit  the limit here
//   now    the limit with what is coming (the speed to keep now)
//   shown, shownKind  the limit to show and its stretch: the one here,
//          or the slower one ahead once it brings `now` down
//          ('taxiway' | 'turn' | 'apron' | 'stand'); ahead: true for the latter
//   level  0 within `now`, 1 over it, 2 (red) over TAXI.RED_OVER times
//          it — for TAXI.FINE_HOLD_S, a taxi overspeed
// No drawing: ui/hud.js and ui/instruments.js show it, game.js fines
// an overspeed, sim/copilot.js keeps to it.
// ============================================================

const TAXI_PHASES = ['ENGINE_START', 'TAXI_OUT', 'HOLD_SHORT', 'EXIT'];

const TaxiLimit = {
  update(fl) {
    const st = fl.st;
    if (!st.onGround || TAXI_PHASES.indexOf(fl.phase) < 0) { fl.taxi = null; return; }
    const gs = fl.groundSpeedKt();
    const g = fl.guidance;
    const lim = g && g.route && g.route.length > 1
      ? this.along(fl.phase === 'EXIT' ? fl.arrival : fl.world, g.route, g.along)
      : this.here(fl.nearestApt(), st.pos.x, st.pos.z);
    lim.gs = gs;
    lim.level = gs > lim.now * TAXI.RED_OVER ? 2 : gs > lim.now + 0.5 ? 1 : 0;
    fl.taxi = lim;
  },

  // the limits s metres along the route (a: its airport), slowing down for what is coming at
  // `decel` (m/s², TAXI.DECEL_MS2 when not given); turnCap(R), when given, the most a turn of
  // radius R may be taken at (kt: the first officer's own aeroplane, sim/copilot.js)
  along(a, route, s, decel, turnCap) {
    decel = decel || TAXI.DECEL_MS2;
    if (!route.zones) route.zones = this.zones(a, route);
    let limit = TAXI.STRAIGHT_KT, kind = 'taxiway', now = Infinity, ahead = null;
    for (const z of route.zones) {
      const kt = turnCap && z.kind === 'turn' ? Math.min(z.kt, turnCap(z.R)) : z.kt;
      if (s >= z.s0 && s <= z.s1) {
        if (kt < limit) { limit = kt; kind = z.kind; }
      } else if (z.s0 > s) {
        const v = Math.sqrt((kt * KTS) * (kt * KTS) + 2 * decel * (z.s0 - s)) / KTS;
        if (v < now) { now = v; ahead = z; }
      }
    }
    // (still rolling down the runway to the exit, s < 0, only the turn off it slows you down)
    if (s >= 0 ? limit <= now : !ahead) { now = limit; ahead = null; }
    now = Math.min(now, limit);
    const soon = ahead && now < limit;
    return { limit, now, shown: soon ? ahead.kt : limit, shownKind: soon ? ahead.kind : kind, ahead: !!soon };
  },

  // the limit where the aeroplane is, with no route to follow
  here(a, x, z) {
    let apron = false;
    if (a) {
      const loc = World.local(a, x, z), r = a.apronRect;
      apron = loc.t > r.t0 && loc.t < r.t1 && loc.across > r.a0 && loc.across < r.a1;
    }
    const kt = apron ? TAXI.APRON_KT : TAXI.STRAIGHT_KT, kind = apron ? 'apron' : 'taxiway';
    return { limit: kt, now: kt, shown: kt, shownKind: kind, ahead: false };
  },

  // a turn's limit by its curve's radius R (metres): the speed at TAXI.TURN_LAT_MS2 sideways, in
  // 5 kt steps (a knot over still rounds up), from TAXI.TURN_MIN_KT to the straight taxiway's
  turnKt(R) {
    const kt = Math.sqrt(TAXI.TURN_LAT_MS2 * Math.max(R, 1)) / KTS;
    return clamp(Math.floor((kt + 1) / 5) * 5, TAXI.TURN_MIN_KT, TAXI.STRAIGHT_KT);
  },

  // The slower stretches of a route, as [{ s0, s1, kt, kind }] in metres along it: the apron lane,
  // the stand's lead-in, and every corner turning more than TAXI.TURN_MIN_DEG, over its curve
  // (the fillet there, World.buildFillets: its radius gives the limit) and TAXI.TURN_PAD_M either
  // side. A route that starts at a runway exit turns off the runway there.
  zones(a, route) {
    const out = [], S = [0];
    for (let i = 0; i + 1 < route.length; i++) S.push(S[i] + Math.hypot(route[i + 1].x - route[i].x, route[i + 1].z - route[i].z));
    const edge = (n1, n2) => { const e = n1.edges.find((x) => x.to === n2); return e ? e.kind : 'taxi'; };
    const dir = (p, q) => { const l = Math.hypot(q.x - p.x, q.z - p.z) || 1; return [(q.x - p.x) / l, (q.z - p.z) / l]; };
    for (let i = 0; i + 1 < route.length; i++) {
      const k = edge(route[i], route[i + 1]);
      if (k === 'apron') out.push({ s0: S[i], s1: S[i + 1], kt: TAXI.APRON_KT, kind: 'apron' });
      else if (k === 'stand') out.push({ s0: S[i], s1: S[i + 1], kt: TAXI.STAND_KT, kind: 'stand' });
    }
    // the corner at route[i], coming from p
    const corner = (i, p) => {
      const n = route[i], u = dir(p, n), v = dir(n, route[i + 1]);
      const ang = Math.acos(clamp(u[0] * v[0] + u[1] * v[1], -1, 1));
      if (ang < TAXI.TURN_MIN_DEG * DEG) return;
      const f = a && World.filletAt(a, n, p, route[i + 1]);
      // (no fillet: a hairpin, or a corner too tight for one)
      const R = f ? f.R : LAYOUT.FILLET_STAND_R;
      const half = (f ? f.d : R * Math.tan(Math.min(ang, 150 * DEG) / 2)) + TAXI.TURN_PAD_M;
      // (into a stand or out of it, no faster than on its lead-in)
      const stand = edge(p, n) === 'stand' || edge(n, route[i + 1]) === 'stand';
      out.push({ s0: S[i] - half, s1: S[i] + half, kt: Math.min(this.turnKt(f ? R : 0), stand ? TAXI.STAND_KT : Infinity), kind: 'turn', R });
    };
    if (a && route[0].kind === 'exit') {
      const back = World.runwayBehind(route[0]);
      corner(0, back || World.at(a, route[0].t - 100, 0));
    }
    for (let i = 1; i + 1 < route.length; i++) corner(i, route[i - 1]);
    return out;
  }
};
