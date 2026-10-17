'use strict';

// ============================================================
// World Aviation — the other aeroplanes at the two ends of a flight
//
// Three of them at most, each by its chance (TRAFFIC.CHANCE, by the
// airport's size; none at a tiny airport or a remote strip, none in a
// flight school's lesson or a practice landing), drawn when the flight
// starts (start), so the stands they need are kept empty from the
// beginning (reserved: no parked aeroplane, the bridge retracted):
//   - the departure ahead (plan.dep): at the gate start, the aeroplane
//     parked at a stand ahead on the player's way to the runway (its
//     push back clear of the player's stand) is pushed back a few
//     seconds into the flight, taxis to the runway, lines up and waits
//     there until the player comes near (or is holding, or cleared, or
//     at most LINEUP_WAIT_MAX_S), then takes off and flies away; with no
//     such stand it comes along the taxiway from beyond where the player
//     joins it; at the short start it is lined up in front of the player
//     at the holding point and rolls just after the intro;
//   - the arrival ahead (plan.ahead): joining the final as far out as
//     fits (AHEAD_NM) when the player is AHEAD_SPAWN_NM from the runway,
//     so that it has landed, left the runway and parked at its stand
//     AHEAD_MARGIN_S before the player could touch down at the player's
//     ground speed now (none if that does not fit) — the tower says so;
//   - the arrival behind (plan.behind): joining the final BEHIND_NM out
//     once the player is slowing down on the runway; from BEHIND_DECIDE_NM
//     out it goes around if the player is still on the runway (the tower
//     says so), else it lands, leaves the runway and taxis to its stand,
//     never onto the player's way to the stand ahead of the player.
// The rules that keep them out of the player's way:
//   - the runway is the player's while the player is on it (or over it,
//     low) or cleared onto it: a departure waits short of the holding
//     point (QUEUE_SHORT_M) and on the runway rolls only with nobody on
//     it ahead; an arrival behind goes around;
//   - on the ground each gives way to the player (as the baggage trains
//     do): it stops short of the ground the player covers now and over
//     the next GIVE_WAY_AHEAD_S seconds, and to one another (never both
//     waiting for each other) and, for a while, to a vehicle;
//   - the first officer brakes for one ahead on the way (copilotCap),
//     and the taxi prompt says so (ahead).
// They move along tracks: the taxi routes the player gets (World.findRoute,
// smoothRoute round the curves), resampled every TRACK_DS metres with a
// speed limit for each point (by where it runs and by its curve, braking
// ahead for the turns and the stop at the end); in the air along the
// extended centreline on the glide path. No drawing (render/traffic3d.js),
// no sound (core/audio.js reads loudest); the tower's lines go to the
// flight's messages. Collide.step runs into them as into the parked
// aeroplanes. Used by game.js, sim/collide.js and sim/copilot.js.
// ============================================================

const TRACK_DS = 2;          // metres between the points of a track

const AirTraffic = {
  movers: [],        // the other aeroplanes about now: { kind, a, ac, x, y, z, hdg, pitch, v, onGround, ... }
  plan: null,        // { dep, ahead, behind } (each null or its plan), stands: the stands they keep empty
  fl: null,          // the flight they go with
  time: 0,           // the traffic's clock, seconds since the flight's start
  introAt: null,     // when the intro was over (the traffic's clock), null before

  // ---------- the flight's plan ----------
  // opts: { off (none at all), seed, skipPushback, arrGate (the player's arrival stand) }
  start(fl, opts) {
    opts = opts || {};
    this.stop();
    this.fl = fl;
    const plan = this.plan = { dep: null, ahead: null, behind: null, stands: [] };
    if (!fl || opts.off) return plan;
    const rng = makeRng(((opts.seed || 1) ^ 0x2545f491) >>> 0);
    const chance = (a, k) => !a.remote && rng.chance((TRAFFIC.CHANCE[a.terminal] || TRAFFIC.CHANCE.tiny)[k]);
    const dep = fl.world, arr = fl.arrival;
    if (chance(dep, 0)) plan.dep = this.planDeparture(fl, rng, !!opts.skipPushback);
    if (arr && arr !== dep && opts.arrGate) {
      const mine = World.standsFor(arr, opts.arrGate, fl.ac), taken = [];
      if (chance(arr, 1)) plan.ahead = this.planArrival(arr, rng, mine, taken, 'ahead');
      if (plan.ahead) taken.push(plan.ahead.gate);
      if (chance(arr, 2)) plan.behind = this.planArrival(arr, rng, mine, taken, 'behind');
    }
    for (const p of [plan.dep, plan.ahead, plan.behind]) if (p && p.gate) plan.stands.push(p.gate);
    if (plan.dep) this.spawnDeparture(plan.dep);
    return plan;
  },
  stop() {
    this.movers = [];
    this.plan = null;
    this.fl = null;
    this.time = 0;
    this.introAt = null;
  },
  // the stands kept empty for them (no parked aeroplane: Scene3D.setFlightGates, Flight.gatesInUse)
  reserved() { return this.plan ? this.plan.stands.slice() : []; },

  // the type and the paint of an aeroplane parked at stand `gate` (as render/airport3d.js paints it)
  parkedAirline(a, gate) {
    const als = airlinesAt(a);
    return als.length ? als[gate.index % als.length].code : null;
  },
  // its radio call: the airline's code and a flight number, and the type
  callsign(rng, ac, airline) {
    const num = rng.int(101, 1899);
    return airline ? airline + ' ' + num + ' (' + ac.name + ')' : ac.name;
  },
  // the approach speed of a type, m/s
  vApp(ac) { return clamp(ac.vr * 0.95, 90, 150) * KTS; },

  planDeparture(fl, rng, skip) {
    const a = fl.world, N = a.nodes;
    if (!N || !N.rwyStart || !N.hold) return null;
    const mk = (ac, airline, extra) => Object.assign({ kind: 'dep', a, ac, airline, callsign: this.callsign(rng, ac, airline) }, extra);
    const typeHere = () => {
      const kinds = PARKED_TYPES[a.terminal] || PARKED_TYPES.tiny, als = airlinesAt(a), id = rng.pick(kinds);
      const ac = AIRCRAFT.find((x) => x.id === id);
      return ac ? { ac, airline: als.length ? rng.pick(als).code : null } : null;
    };
    if (skip) {
      // lined up in front of the player at the holding point
      const t = typeHere(), f = World.filletAt(a, N.rwyStart, N.hold, this.runwayNext(a));
      if (!t) return null;
      const p = World.at(a, N.rwyStart.t + (f ? f.d : LAYOUT.FILLET_EXIT_R) + TRAFFIC.LINEUP_M, 0);
      return mk(t.ac, t.airline, { start: 'lineup', x: p.x, z: p.z });
    }
    // a stand ahead on the player's way to the runway (towards the threshold), its push back's end
    // (the tail swinging away from the holding point, towards the player's stand) clear of the
    // player's stands; the nearest
    const mine = World.standsFor(a, fl.startGate, fl.ac), first = Math.min(...mine.map((g) => g.t));
    const P = fl.dims.span;
    let best = null, bestPush = null;
    for (const g of a.gates) {
      if (g.zone !== 'pax' || !g.parked || mine.indexOf(g) >= 0 || g.t >= first) continue;
      const d = aircraftDims(g.parked), push = World.pushbackPath(a, g, d.len, LAYOUT.STAND);
      const tail = g.t + push.r + d.len / 2 + 0.2 * (d.span + P) + TRAFFIC.PUSH_TAIL_PAD_M;
      if (tail > first || (best && g.t < best.t)) continue;
      best = g; bestPush = push;
    }
    if (best) {
      const tr = this.depTrack(a, best.laneNode, [-a.dirX, -a.dirZ], [bestPush.end]);
      if (tr) return mk(best.parked, this.parkedAirline(a, best), { start: 'stand', gate: best, push: bestPush, track: tr });
    }
    // none: it comes along the taxiway from TWY_LEAD_M past where the player's way joins it
    const join = (fl.route || []).find((n) => n.kind === 'taxi' && Math.abs(n.across - LAYOUT.TWY_OFFSET) < 1);
    if (!join) return null;
    const from = this.taxiwayNode(a, join.t + TRAFFIC.TWY_LEAD_M, join.t + TRAFFIC.TWY_LEAD_M * 0.6);
    const t = typeHere(), tr = from && this.depTrack(a, from, [-a.dirX, -a.dirZ], null);
    return t && tr ? mk(t.ac, t.airline, { start: 'taxiway', track: tr }) : null;
  },
  // the node of the parallel taxiway nearest to t (at least tMin along the runway)
  taxiwayNode(a, t, tMin) {
    let best = null;
    for (const n of a.nodeList) {
      if (n.kind !== 'taxi' || Math.abs(n.across - LAYOUT.TWY_OFFSET) > 1 || n.t < tMin) continue;
      if (!best || Math.abs(n.t - t) < Math.abs(best.t - t)) best = n;
    }
    return best;
  },
  // the runway node after the line-up point (down the runway)
  runwayNext(a) {
    const e = a.nodes.rwyStart.edges.find((x) => x.kind === 'runway');
    return e ? e.to : null;
  },
  // A departure's way from node `from` (setting off facing dir) to the line-up: the taxi route
  // through the holding point, round the line-up's curve and LINEUP_M down the centreline, where
  // it stops; lead: points before the route (the push back's end). Its holdS: where along it the
  // holding point is.
  depTrack(a, from, dir, lead) {
    const N = a.nodes, next = this.runwayNext(a);
    const r = World.findRoute(a, from, N.rwyStart, dir);
    if (!next || r.length < 2 || r[r.length - 1] !== N.rwyStart || r.indexOf(N.hold) < 0) return null;
    const route = r.concat([next]);
    const sm = World.smoothRoute(a, route);
    const pts = (lead || []).map((p) => ({ x: p.x, z: p.z })).concat(sm.pts.slice(0, sm.first[route.length - 1]));
    const end = pts[pts.length - 1], loc = World.local(a, end.x, end.z);
    pts.push(World.at(a, loc.t + TRAFFIC.LINEUP_M, 0));
    const tr = this.track(a, pts, 0);
    const h = sm.pts[sm.first[route.indexOf(N.hold)]];
    tr.holdS = this.nearestS(tr, h.x, h.z);
    return tr;
  },

  // An arrival's stand (not one of the player's, `mine`, nor next to them, nor one `taken`) and
  // its way there: the type parked at that stand lands at its approach speed, takes the first
  // exit it can make and the taxi route to the stand. Of the stands, one of the two quickest to
  // get to.
  planArrival(a, rng, mine, taken, kind) {
    const tTd = this.touchdownT(a);
    const out = [];
    for (const g of a.gates) {
      if (g.zone !== 'pax' || !g.parked || taken.indexOf(g) >= 0) continue;
      if (mine.some((k) => Math.abs(k.t - g.t) < LAYOUT.GATE_SPACING * 1.5)) continue;
      const ac = g.parked, v = this.vApp(ac) * 0.95;
      const exit = Guidance.exitFor(a, tTd, v, true);
      const route = World.findRoute(a, exit, g.node);
      if (route.length < 2 || route[route.length - 1] !== g.node) continue;
      const sm = World.smoothRoute(a, route);
      const tr = this.track(a, [World.at(a, tTd, 0)].concat(sm.pts), 0);
      out.push({ g, ac, tr, time: this.trackTime(tr, v) });
    }
    if (!out.length) return null;
    out.sort((p, q) => p.time - q.time);
    const c = out[Math.min(out.length - 1, rng.int(0, 1))];
    const airline = this.parkedAirline(a, c.g);
    return { kind, a, ac: c.ac, airline, callsign: this.callsign(rng, c.ac, airline), gate: c.g, track: c.tr, trackTime: c.time };
  },
  // where an arrival touches down: past the glide path's aim point (15 m over the threshold on
  // the glide slope) by its flare (FLARE_M)
  touchdownT(a) { return -a.half + (15 + TRAFFIC.FLARE_M) / Math.tan(SIM.GLIDESLOPE_DEG * DEG); },
  // its height over the runway at t on the final (the glide path, then the flare: a curve from
  // FLARE_M down to the touchdown, tangent to the glide path)
  finalAgl(a, t) {
    const tan = Math.tan(SIM.GLIDESLOPE_DEG * DEG), aim = -a.half + 15 / tan, f = aim - TRAFFIC.FLARE_M / tan;
    if (t <= f) return (aim - t) * tan;
    const u = clamp((t - f) / (2 * TRAFFIC.FLARE_M / tan), 0, 1);
    return TRAFFIC.FLARE_M * (1 - u) * (1 - u);
  },

  // ---------- tracks ----------
  // A way on the ground through the points [{ x, z }] of airport a, resampled every TRACK_DS
  // metres: x, z, the heading h, the speed limit v (m/s: on the runway none but its curve's, on
  // the apron lane APRON_KT, on a stand's lead-in STAND_KT, else TAXI_KT; in a curve no faster than
  // TURN_LAT_MS2 sideways; braking ahead for the turns, on the runway at ROLLOUT_DECEL_MS2, and
  // to vEnd at the end), rw (on the runway), len
  track(a, pts, vEnd) {
    const X = [], Z = [];
    X.push(pts[0].x); Z.push(pts[0].z);
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i], l = Math.hypot(q.x - p.x, q.z - p.z);
      if (l < 1e-6) continue;
      let s = TRACK_DS - carry;
      for (; s <= l + 1e-9; s += TRACK_DS) { X.push(p.x + (q.x - p.x) * s / l); Z.push(p.z + (q.z - p.z) * s / l); }
      carry = l - (s - TRACK_DS);
    }
    if (carry > 0.5) { const q = pts[pts.length - 1]; X.push(q.x); Z.push(q.z); }
    const n = X.length, H = new Float64Array(n), V = new Float64Array(n), RW = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
      H[i] = Math.atan2(X[i1] - X[i0], -(Z[i1] - Z[i0]));
    }
    const L = LAYOUT, T = TRAFFIC, r = a.apronRect;
    for (let i = 0; i < n; i++) {
      const loc = World.local(a, X[i], Z[i]);
      const rw = Math.abs(loc.across) < RWY_HALF_WIDTH + 5 && Math.abs(loc.t) < a.half + 60;
      const apron = loc.t > r.t0 && loc.t < r.t1 && loc.across > r.a0;
      let v = rw ? Infinity : (apron ? (loc.across > L.APRON_LANE + 20 ? T.STAND_KT : T.APRON_KT) : T.TAXI_KT) * KTS;
      const j0 = Math.max(0, i - 3), j1 = Math.min(n - 1, i + 3);
      const dh = Math.abs(wrapRad(H[j1] - H[j0]));
      if (dh > 0.01) v = Math.min(v, Math.max(T.TURN_MIN_KT * KTS, Math.sqrt(T.TURN_LAT_MS2 * (j1 - j0) * TRACK_DS / dh)));
      V[i] = v; RW[i] = rw ? 1 : 0;
    }
    V[n - 1] = vEnd || 0.4;
    for (let i = n - 2; i >= 0; i--) V[i] = Math.min(V[i], Math.sqrt(V[i + 1] * V[i + 1] + 2 * (RW[i] ? T.ROLLOUT_DECEL_MS2 : T.DECEL_MS2) * TRACK_DS));
    return { X, Z, H, V, RW, n, len: (n - 1) * TRACK_DS };
  },
  // the point s metres along a track: { x, z, h, i }
  at(tr, s) {
    const f = clamp(s / TRACK_DS, 0, tr.n - 1), i = Math.min(tr.n - 2, Math.floor(f)), k = f - i;
    if (tr.n < 2) return { x: tr.X[0], z: tr.Z[0], h: tr.H[0], i: 0 };
    return { x: lerp(tr.X[i], tr.X[i + 1], k), z: lerp(tr.Z[i], tr.Z[i + 1], k), h: lerpAngle(tr.H[i], tr.H[i + 1], k), i };
  },
  limitAt(tr, s) { return tr.V[clamp(Math.ceil(s / TRACK_DS), 0, tr.n - 1)]; },
  nearestS(tr, x, z) {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < tr.n; i++) { const d = (tr.X[i] - x) * (tr.X[i] - x) + (tr.Z[i] - z) * (tr.Z[i] - z); if (d < bd) { bd = d; bi = i; } }
    return bi * TRACK_DS;
  },
  // seconds along a track entered at v0 (m/s), keeping to its limits
  trackTime(tr, v0) {
    let t = 0;
    for (let i = 1; i < tr.n; i++) t += TRACK_DS / Math.max(0.5, Math.min(tr.V[i], v0));
    return t;
  },

  // ---------- the movers ----------
  mover(p) {
    const d = aircraftDims(p.ac);
    const m = {
      p, kind: p.kind, a: p.a, ac: p.ac, airline: p.airline, callsign: p.callsign, dims: d,
      r: Math.max(d.len, d.span) / 2,
      x: 0, y: p.a.elev + d.gearH, z: 0, hdg: p.a.hdg, pitch: 0, v: 0, t: 0, agl: 0,
      onGround: true, gear: 1, flaps: p.kind === 'dep' ? 0.35 : 1, engines: false, power: 0,
      lights: { nav: false, beacon: false, strobe: false, landing: false, taxi: false },
      legs: [], leg: 0, lt: 0, s: 0, waitFor: null, vehWait: 0, k: 1, gone: false, parked: false,
      tug: null                        // the push back's tug: { x, z, ry: turned as three.js turns it } (render/traffic3d.js draws it)
    };
    this.movers.push(m);
    return m;
  },
  spawnDeparture(p) {
    const m = this.mover(p), a = p.a;
    // (lined up on the runway, waiting to roll: 'lined')
    const roll = { type: 'roll' }, lined = { type: 'wait', name: 'lined', until: (mm) => this.rollOk(mm) };
    if (p.start === 'lineup') {
      m.x = p.x; m.z = p.z; m.hdg = a.hdg; m.engines = true;
      m.legs = [lined, roll];
    } else if (p.start === 'stand') {
      // parked at the stand (the engines off), pushed back, the engines started and the tug gone
      const pose = p.push.pose(0);
      m.x = pose.x; m.z = pose.z; m.hdg = pose.hdg;
      m.legs = [
        { type: 'wait', until: () => this.time >= TRAFFIC.PUSH_AT_S },
        { type: 'push', path: p.push },
        { type: 'wait', until: (mm) => mm.lt >= TRAFFIC.START_S },
        this.trackLeg(p.track, false), lined, roll];
      m.tugHome = this.tugSpot(pose, m.dims);
      m.tug = Object.assign({}, m.tugHome);
      m.gate = p.gate;
    } else {
      const q = this.at(p.track, 0);
      m.x = q.x; m.z = q.z; m.hdg = q.h; m.engines = true; m.v = this.limitAt(p.track, 0) * 0.8;
      m.legs = [this.trackLeg(p.track, false), lined, roll];
    }
    const tl = m.legs.find((l) => l.type === 'track');
    // (waiting short of the holding point while the player holds the runway)
    if (tl) { tl.queueS = p.track.holdS - TRAFFIC.QUEUE_SHORT_M - m.dims.len / 2; tl.stops.push({ s: tl.queueS, ok: () => this.runwayFreeForDeparture(a) }); }
    return m;
  },
  // an arrival on the final d nm out
  spawnFinal(p, d) {
    const m = this.mover(p), a = p.a;
    m.onGround = false; m.engines = true; m.v = this.vApp(p.ac);
    m.t = -a.half - d * NM;
    m.agl = this.finalAgl(a, m.t);
    m.legs = [{ type: 'final' }, this.trackLeg(p.track, p.kind === 'behind'), { type: 'park' }];
    this.place(m);
    return m;
  },
  trackLeg(tr, yieldRoute) { return { type: 'track', tr, stops: [], yieldRoute }; },
  // where the push back's tug waits and comes back to: at the nose gear of the aeroplane at the
  // stand, facing it
  tugSpot(pose, d) {
    const fx = hdgX(pose.hdg), fz = hdgZ(pose.hdg), k = d.len * 0.38 + 6;
    return { x: pose.x + fx * k, z: pose.z + fz * k, ry: Math.atan2(-fx, -fz) };
  },

  // ---------- each frame ----------
  // dt: the simulated seconds of the frame (real ones during the camera's flights); intro: the
  // intro's camera flight is on
  update(fl, dt, intro) {
    if (!this.plan || fl !== this.fl || !(dt > 0)) return;
    if (!intro && this.introAt === null) this.introAt = this.time;
    this.spawnArrivals(fl);
    const h = Math.max(TRAFFIC.STEP_S, dt / 200);
    for (let left = dt; left > 1e-6; left -= h) {
      const step = Math.min(h, left);
      this.time += step;
      for (const m of this.movers) if (!m.gone) this.step(m, step * m.k);
    }
    for (const m of this.movers) this.lightsFor(m);
    this.movers = this.movers.filter((m) => !m.gone);
  },

  spawnArrivals(fl) {
    const p = this.plan, ph = fl.phase, arr = fl.arrival;
    const A = p.ahead, B = p.behind;
    // (tried again each frame while it does not fit: the player slowing down may make it fit)
    if (A && !A.spawned && (ph === 'DESCENT' || ph === 'APPROACH') && fl.distToRunwayNm() <= TRAFFIC.AHEAD_SPAWN_NM) {
      const d = this.aheadNm(fl, A);
      if (d) {
        A.spawned = true;
        this.spawnFinal(A, d);
        fl.info(tr('Tower: number two — traffic ahead, {who}, on a {nm}-mile final', { who: A.callsign, nm: Math.round(d) }));
      }
    }
    if (B && !B.spawned && ph === 'ROLLOUT' && fl.nearestApt() === arr && fl.st.onGround && fl.groundSpeedKt() < TRAFFIC.BEHIND_SPAWN_KT) {
      B.spawned = true;
      this.spawnFinal(B, TRAFFIC.BEHIND_NM);
    }
    for (const m of this.movers) {
      const L = m.legs[m.leg];
      // the player is flying again (a touch-and-go): the one behind, still miles out, is gone
      if (m.kind === 'behind' && L && L.type === 'final' && !fl.st.onGround) m.gone = true;
      // the one ahead in a hurry with the player close behind it: still on its way to the stand
      if (m.kind === 'ahead') {
        const close = !fl.st.onGround && fl.distToRunwayNm() < TRAFFIC.HURRY_NM;
        m.k = !m.parked && m.onGround && (close || ph === 'ROLLOUT' || ph === 'EXIT') ? TRAFFIC.HURRY_K : 1;
        // (still on the runway with the player landing: never — but should it be, it is gone)
        if (m.onGround && !m.parked && this.onStrip(m.a, m.x, m.z) && fl.nearestApt() === m.a && fl.st.onGround && ph === 'ROLLOUT') m.gone = true;
      }
    }
  },
  // how far out the one landing ahead joins the final: the furthest of AHEAD_NM that has it parked
  // AHEAD_MARGIN_S before the player could touch down flying straight in at the ground speed now
  // (and well ahead of the player); 0: none fits
  aheadNm(fl, p) {
    const gs = Math.max(fl.groundSpeedKt(), 60) * KTS, dist = fl.distToRunwayNm();
    const eta = dist * NM / gs, v = this.vApp(p.ac), td = this.touchdownT(p.a) + p.a.half;
    for (let d = TRAFFIC.AHEAD_NM[1]; d >= TRAFFIC.AHEAD_NM[0] - 1e-9; d -= 0.25) {
      if (d > dist - 2) continue;
      if ((d * NM + td) / v + p.trackTime <= eta - TRAFFIC.AHEAD_MARGIN_S) return d;
    }
    return 0;
  },

  step(m, dt) {
    const L = m.legs[m.leg];
    if (!L) return;
    m.lt += dt;
    const next = () => { m.leg++; m.lt = 0; m.s = 0; };
    switch (L.type) {
      case 'wait':
        m.v = 0;
        if (L.until(m)) next();
        break;
      case 'push': {
        // tail first out of the stand and round onto the apron lane (World.pushbackPath)
        m.engines = true;
        const u = smoothstep(0, 1, clamp(m.lt / TRAFFIC.PUSH_S, 0, 1));
        const q = L.path.pose(u);
        m.v = L.path.length / TRAFFIC.PUSH_S;
        m.x = q.x; m.z = q.z; m.hdg = q.hdg;
        m.tug = this.tugSpot(q, m.dims);
        if (m.lt >= TRAFFIC.PUSH_S) { m.v = 0; m.tugFrom = Object.assign({}, m.tug); next(); }
        break;
      }
      case 'track': this.stepTrack(m, L, dt) && next(); break;
      case 'roll': this.stepRoll(m, dt); break;
      case 'final': this.stepFinal(m, dt) && next(); break;
      case 'goaround': this.stepGoAround(m, dt); break;
      case 'park':
        m.v = 0; m.parked = true;
        if (m.lt > TRAFFIC.ENGINES_OFF_S) m.engines = false;
        break;
    }
    if (m.tugFrom && L.type !== 'push') this.tugAway(m, dt);
  },
  // the tug, let go after the push back, drives off the nose back to the stand (TUG_AWAY_S, a
  // second after) and stays there
  tugAway(m, dt) {
    m.tugT = (m.tugT || 0) + dt;
    const k = clamp((m.tugT - 1) / TRAFFIC.TUG_AWAY_S, 0, 1);
    if (k >= 1 && m.tugDone) return;
    m.tugDone = k >= 1;
    const u = smoothstep(0, 1, k), A = m.tugFrom, B = m.tugHome;
    m.tug = { x: lerp(A.x, B.x, u), z: lerp(A.z, B.z, u), ry: lerpAngle(A.ry, B.ry, smoothstep(0, 0.6, k)) };
  },

  // along a track: its limits, its stops, giving way; true at its end
  stepTrack(m, L, dt) {
    const tr = L.tr, T = TRAFFIC;
    m.onGround = true;
    let want = this.limitAt(tr, m.s);
    let dec = T.DECEL_MS2 * 1.5;
    // a stop: waited at while not ok; once too near to stop at it comfortably, gone on past
    for (const st of L.stops) {
      if (st.done) continue;
      if (m.s >= st.s - 0.5) { if (st.ok(m)) st.done = true; else { want = 0; dec = T.STOP_DECEL_MS2; } continue; }
      if (!st.ok(m)) want = Math.min(want, Math.sqrt(2 * T.DECEL_MS2 * Math.max(0, st.s - m.s)));
      else if (st.s - m.s < m.v * m.v / (2 * T.STOP_DECEL_MS2) + 2) st.done = true;
    }
    if (this.blocked(m, L, dt)) { want = 0; dec = T.STOP_DECEL_MS2 * 1.3; }
    if (tr.RW[Math.min(tr.n - 1, Math.round(m.s / TRACK_DS))]) dec = Math.max(dec, T.ROLLOUT_DECEL_MS2 * 1.2);
    m.v = m.v < want ? Math.min(want, m.v + T.ACCEL_MS2 * dt) : Math.max(want, m.v - dec * dt);
    m.s = Math.min(tr.len, m.s + m.v * dt);
    const q = this.at(tr, m.s);
    m.x = q.x; m.z = q.z; m.hdg = q.h;
    m.y = m.a.elev + m.dims.gearH; m.pitch = 0; m.agl = 0;
    // (the reversers on the landing roll)
    m.power = tr.RW[q.i] && m.v > 25 && m.kind !== 'dep' ? 0.75 : m.v > 20 ? 0.35 : 0.22;
    if (m.s >= tr.len - 0.05) { m.v = 0; return true; }
    return false;
  },

  // the take-off: the roll down the centreline, the rotation, the climb straight out, the gear up;
  // gone GONE_M from the airport
  stepRoll(m, dt) {
    const a = m.a, T = TRAFFIC, ac = m.ac, vr = ac.vr * KTS, vlo = vr * 1.06;
    if (!m.rolling) { m.rolling = true; m.t = World.local(a, m.x, m.z).t; m.airT = null; }
    m.engines = true; m.power = 1;
    if (m.airT === null) {
      m.v += (ac.engineType === 'jet' ? T.TO_ACCEL_MS2 : T.TO_ACCEL_PROP_MS2) * dt;
      m.pitch = smoothstep(vr * 0.98, vlo, m.v) * 7 * DEG;
      if (m.v >= vlo) { m.airT = 0; m.onGround = false; }
      m.t += m.v * dt;
    } else {
      m.airT += dt;
      const g = smoothstep(0, 4, m.airT) * T.CLIMB_DEG * DEG;
      m.v = Math.min(T.CLIMB_KT * KTS, m.v + T.CLIMB_ACCEL_MS2 * dt);
      m.t += m.v * Math.cos(g) * dt;
      m.agl += m.v * Math.sin(g) * dt;
      m.pitch = 7 * DEG + g * 0.4;
      m.gear = clamp(1 - (m.airT - 3) / 6, 0, 1);
      if (m.agl > 300) m.flaps = Math.max(0, m.flaps - dt / 10);
      m.power = 0.9;
    }
    this.place(m);
    if (m.t > a.half + T.GONE_M) m.gone = true;
  },
  // on the final, down the glide path and the flare at its approach speed; from BEHIND_DECIDE_NM
  // out the one behind goes around with the player still on the runway; true on touchdown
  stepFinal(m, dt) {
    const a = m.a, tan = Math.tan(SIM.GLIDESLOPE_DEG * DEG), td = this.touchdownT(a);
    m.onGround = false; m.engines = true; m.gear = 1; m.flaps = 1; m.power = 0.45;
    m.t += m.v * dt;
    if (m.kind === 'behind' && !m.decided && -a.half - m.t < TRAFFIC.BEHIND_DECIDE_NM * NM) {
      m.decided = true;
      if (this.playerOnStrip(a)) {
        m.legs.splice(m.leg, m.legs.length - m.leg, { type: 'goaround' });
        m.lt = 0;
        const fl = this.fl;
        if (fl) fl.info(tr('Tower: {who}, go around — the runway is occupied', { who: m.callsign }));
        return false;
      }
    }
    m.agl = this.finalAgl(a, m.t);
    const flare = smoothstep(td - 2 * TRAFFIC.FLARE_M / tan, td, m.t);
    m.pitch = (2.5 + 3 * flare) * DEG;
    this.place(m);
    if (m.t >= td) {
      m.onGround = true; m.agl = 0; m.v *= 0.95; m.pitch = 0;
      m.s = 0;
      return true;
    }
    return false;
  },
  stepGoAround(m, dt) {
    const T = TRAFFIC;
    const g = smoothstep(0, 5, m.lt) * T.GA_DEG * DEG;
    m.power = 1; m.onGround = false;
    m.v = Math.min(T.CLIMB_KT * KTS, m.v + T.CLIMB_ACCEL_MS2 * dt);
    m.t += m.v * Math.cos(g) * dt;
    m.agl += m.v * Math.sin(g) * dt;
    m.pitch = (3 + 9 * smoothstep(0, 5, m.lt)) * DEG;
    m.gear = clamp(1 - (m.lt - 4) / 6, 0, 1);
    m.flaps = Math.max(0.4, m.flaps - dt / 12);
    this.place(m);
    if (m.t > m.a.half + T.GONE_M) m.gone = true;
  },
  // in the air over the extended centreline at t, agl over the runway
  place(m) {
    const p = World.at(m.a, m.t, 0);
    m.x = p.x; m.z = p.z; m.hdg = m.a.hdg;
    m.y = m.a.elev + m.dims.gearH + m.agl;
  },

  // ---------- the runway ----------
  // is (x, z) on the runway's strip (within STRIP_M of its edges, along it and a little past its ends)?
  onStrip(a, x, z) {
    const loc = World.local(a, x, z);
    return Math.abs(loc.across) < RWY_HALF_WIDTH + TRAFFIC.STRIP_M && loc.t > -a.half - 150 && loc.t < a.half + 150;
  },
  // the player on it, or low over it (60 m)
  playerOnStrip(a) {
    const fl = this.fl;
    if (!fl || fl.nearestApt() !== a || fl.altAgl() > 60) return false;
    return this.onStrip(a, fl.st.pos.x, fl.st.pos.z);
  },
  // may a departure go on past the holding point? Not while the player holds the runway: on it,
  // cleared onto it (TAKEOFF on the ground) or climbing out over the runway and past its end below 450 m
  runwayFreeForDeparture(a) {
    const fl = this.fl;
    if (!fl || fl.nearestApt() !== a) return true;
    const st = fl.st;
    if (fl.phase === 'TAKEOFF' && st.onGround) return false;
    if (this.playerOnStrip(a)) return false;
    if (!st.onGround && fl.altAgl() < 450) {
      const loc = World.local(a, st.pos.x, st.pos.z);
      if (Math.abs(loc.across) < 1500 && loc.t > -a.half && loc.t < a.half + 5000) return false;
    }
    return true;
  },
  // lined up, may it roll? Nobody on the runway ahead of it, and: at the short start the intro over
  // (and ROLL_AT_S), else the player near (holding, cleared, gone, ROLL_PLAYER_M from the
  // holding point) or LINEUP_WAIT_MAX_S waited
  rollOk(m) {
    const fl = this.fl, a = m.a;
    if (!fl || this.introAt === null) return false;
    const st = fl.st, mt = World.local(a, m.x, m.z).t;
    if (this.playerOnStrip(a) && World.local(a, st.pos.x, st.pos.z).t > mt) return false;
    if (m.p.start === 'lineup') return this.time - this.introAt >= TRAFFIC.ROLL_AT_S;
    if (fl.world !== a || ['HOLD_SHORT', 'TAKEOFF', 'CLIMB', 'CRUISE', 'DESCENT', 'APPROACH'].indexOf(fl.phase) >= 0) return true;
    if (m.lt >= TRAFFIC.LINEUP_WAIT_MAX_S) return true;
    const h = a.nodes.hold;
    return Math.hypot(st.pos.x - h.x, st.pos.z - h.z) < TRAFFIC.ROLL_PLAYER_M;
  },

  // ---------- giving way ----------
  // Must m stop on its track? With the ground the player covers now or over the next
  // GIVE_WAY_AHEAD_S (round the player, both halves of length or span and GIVE_WAY_PAD_M) on its
  // way just ahead (GIVE_WAY_GAP_M, or its stopping distance, further) and nearer the player than m
  // is now (moving away from the player it drives on); the same for the others (not one already
  // waiting for m); a vehicle in its way (up to VEHICLE_WAIT_S); and the one landing after
  // (yieldRoute) keeps off the player's way to the stand ahead of the player.
  blocked(m, L, dt) {
    const T = TRAFFIC, fl = this.fl, tr = L.tr;
    if (!fl) return false;
    m.waitFor = null;
    const look = Math.max(T.GIVE_WAY_GAP_M, m.v * m.v / (2 * T.STOP_DECEL_MS2) + 10) + m.r * 0.5;
    const ahead = [];
    for (let d = 4; d <= look; d += 4) { if (m.s + d > tr.len + 2) break; ahead.push(this.at(tr, m.s + d)); }
    if (!ahead.length) return false;
    const st = fl.st;
    const player = st.onGround || fl.altAgl() < 10 ? { x: st.pos.x, z: st.pos.z, vx: st.vel.x, vz: st.vel.z, r: Math.max(fl.dims.len, fl.dims.span) / 2 } : null;
    const meets = (o, R) => {
      for (let k = 0; k <= T.GIVE_WAY_AHEAD_S; k += 2) {
        const ox = o.x + o.vx * k, oz = o.z + o.vz * k, now = Math.hypot(m.x - ox, m.z - oz);
        for (const q of ahead) { const dq = Math.hypot(q.x - ox, q.z - oz); if (dq < R && dq < now - 0.5) return true; }
      }
      return false;
    };
    if (player && fl.nearestApt() === m.a && meets(player, player.r + m.r + T.GIVE_WAY_PAD_M)) return true;
    for (const o of this.movers) {
      if (o === m || o.gone || !o.onGround || o.a !== m.a || o.waitFor === m) continue;
      const ov = { x: o.x, z: o.z, vx: hdgX(o.hdg) * o.v, vz: hdgZ(o.hdg) * o.v };
      if (meets(ov, o.r + m.r + T.GIVE_WAY_PAD_M * 0.5)) { m.waitFor = o; return true; }
    }
    // a vehicle (placed by the scene: sim/collide.js) in its way
    let veh = false;
    for (const v of m.a.vehicles || []) {
      if (!v.on) continue;
      for (const q of ahead.slice(0, 8)) if (Math.hypot(q.x - v.x, q.z - v.z) < m.dims.span / 2 + 3) { veh = true; break; }
      if (veh) break;
    }
    m.vehWait = veh ? m.vehWait + dt : 0;
    if (veh && m.vehWait < T.VEHICLE_WAIT_S) return true;
    if (L.yieldRoute && this.onPlayerWay(m, ahead)) return true;
    return false;
  },
  // the player's way to the stand ahead of the player (the taxi route the arrow follows, from
  // where the player is on it): [{ x, z }]
  playerWay() {
    const fl = this.fl, g = fl && fl.guidance;
    if (!fl || !g || !g.route || g.route.length < 2 || fl.phase === 'SHUTDOWN' || fl.phase === 'PARKED') return null;
    const a = fl.phase === 'EXIT' ? fl.arrival : fl.world;
    const sm = World.smoothRoute(a, g.route);
    const out = [{ x: fl.st.pos.x, z: fl.st.pos.z }];
    for (let i = 0; i < sm.pts.length; i++) if (sm.S[i] > g.along) out.push(sm.pts[i]);
    return out;
  },
  // would m's way just ahead (points) come onto the player's way, while m is not on it already?
  onPlayerWay(m, ahead) {
    const way = this.playerWay();
    if (!way || way.length < 2 || this.fl.arrival !== m.a) return false;
    const C = m.dims.span / 2 + this.fl.dims.span / 2 + TRAFFIC.ROUTE_CLEAR_M;
    const dist = (x, z) => {
      let best = Infinity;
      for (let i = 0; i + 1 < way.length; i++) best = Math.min(best, pointSegDist(x, z, way[i].x, way[i].z, way[i + 1].x, way[i + 1].z));
      return best;
    };
    if (dist(m.x, m.z) < C) return false;
    for (const q of ahead) if (dist(q.x, q.z) < C) return true;
    return false;
  },

  // ---------- lights ----------
  // as a crew has them (Scene3D.lightsFor): the navigation lights and the beacon with the engines
  // running, the strobes on the runway and in the air, the landing lights on the runway and in the
  // air below 3 000 ft, the taxi light taxiing
  lightsFor(m) {
    const L = m.legs[m.leg], type = L ? L.type : 'park';
    const onRw = type === 'roll' || (type === 'track' && L.tr.RW[Math.min(L.tr.n - 1, Math.round(m.s / TRACK_DS))] === 1 && m.v > 3);
    const air = !m.onGround;
    const l = m.lights;
    l.nav = m.engines; l.beacon = m.engines;
    l.strobe = air || onRw;
    l.landing = (air && m.agl < 3000 * FT) || onRw;
    l.taxi = m.engines && m.onGround && !onRw && type === 'track';
    if (!m.engines) m.power = 0;
  },

  // ---------- what the others ask ----------
  // the ones on the ground at airport a (Collide.step runs into them)
  onGroundAt(a) { return this.movers.filter((m) => !m.gone && m.onGround && m.a === a); },
  // the points along m's body in the airport's frame { t, across } (the apron's vehicles keep
  // clear of them: Traffic in render/baggage3d.js)
  pieces(m) { return this.body(m).map((p) => World.local(m.a, p.x, p.z)); },
  // ... in the world: { x, z } along the fuselage and the wings
  body(m) {
    const d = m.dims, fx = hdgX(m.hdg), fz = hdgZ(m.hdg), rx = -fz, rz = fx, out = [];
    const add = (f, s) => out.push({ x: m.x + fx * f + rx * s, z: m.z + fz * f + rz * s });
    for (const f of [0.5, 0.25, 0, -0.25, -0.5]) add(f * d.len, 0);
    for (const s of [-0.45, -0.25, 0.25, 0.45]) add(-0.05 * d.len, s * d.span);
    return out;
  },
  // the departure still on the runway (lined up or rolling) the player's clearance is behind: its call
  departingAhead(fl) {
    if (fl !== this.fl) return null;
    for (const m of this.movers) {
      if (m.kind !== 'dep' || m.gone || m.a !== fl.world) continue;
      const L = m.legs[m.leg];
      // past the holding point on its way to the line-up, lined up, or rolling (and just off)
      if (L && ((L.type === 'track' && m.s > L.queueS + 1) || L.name === 'lined' || (L.type === 'roll' && m.agl < 300))) return m.callsign;
    }
    return null;
  },
  // The nearest one on the player's way ahead (within AHEAD_HINT_M along it): { m, d } — d the
  // metres along the way to where it is in the way; null
  ahead(fl) {
    if (fl !== this.fl) return null;
    const way = this.playerWay();
    if (!way || way.length < 2) return null;
    let best = null;
    // (a point of its body, fuselage or wing, within the player's half span and a little of the way)
    const C = fl.dims.span / 2 + 4;
    for (const m of this.movers) {
      if (m.gone || !m.onGround || m.a !== fl.nearestApt()) continue;
      const body = this.body(m);
      let along = 0;
      for (let i = 0; i + 1 < way.length && along < TRAFFIC.AHEAD_HINT_M; i++) {
        const p = way[i], q = way[i + 1], l = Math.hypot(q.x - p.x, q.z - p.z);
        for (const b of body) {
          if (pointSegDist(b.x, b.z, p.x, p.z, q.x, q.z) < C) {
            const u = clamp(((b.x - p.x) * (q.x - p.x) + (b.z - p.z) * (q.z - p.z)) / (l * l || 1), 0, 1);
            const d = along + u * l;
            if (d > 1 && (!best || d < best.d)) best = { m, d };
          }
        }
        along += l;
      }
    }
    return best && best.d <= TRAFFIC.AHEAD_HINT_M ? best : null;
  },
  // the fastest the first officer may taxi with one ahead on the way: stopping well short of it
  // (m/s; Infinity: none)
  copilotCap(fl) {
    const h = this.ahead(fl);
    if (!h) return Infinity;
    const gap = fl.dims.len / 2 + 15;
    return Math.sqrt(2 * COPILOT.DECEL_MS2 * Math.max(0, h.d - gap));
  },
  // the loudest one for a listener at p ({ x, y, z }): { power, dist, jet }; null
  loudest(p) {
    let best = null, bl = 0;
    for (const m of this.movers) {
      if (m.gone || !m.power) continue;
      const dist = Math.hypot(m.x - p.x, m.y - p.y, m.z - p.z), l = m.power / (dist + 120);
      if (l > bl) { bl = l; best = { power: m.power, dist, jet: m.ac.engineType === 'jet' }; }
    }
    return best;
  },

  // ---------- the cheat (Alt+7): one of them now ----------
  // on the ground at the departure a departure ahead along the taxiway, on the descent or the
  // approach an arrival on the final ahead (5 nm, or as close as fits), on the ground at the
  // arrival one landing after; its stand (an arrival) emptied now. Returns { text, stand }.
  cheat(fl, arrGate) {
    if (!this.plan || fl !== this.fl) this.start(fl, { off: true });
    const rng = makeRng((Date.now() & 0xffffff) >>> 0), p = this.plan, st = fl.st;
    const busy = (kind) => this.movers.some((m) => m.kind === kind && !m.gone && !m.parked);
    if (st.onGround && fl.nearestApt() === fl.world && ['GATE', 'PUSHBACK', 'ENGINE_START', 'TAXI_OUT', 'HOLD_SHORT'].indexOf(fl.phase) >= 0) {
      if (busy('dep')) return { text: 'a departure is already on its way' };
      const join = (fl.route || []).find((n) => n.kind === 'taxi' && Math.abs(n.across - LAYOUT.TWY_OFFSET) < 1) || fl.world.nodes.twyStart;
      const from = this.taxiwayNode(fl.world, join.t + TRAFFIC.TWY_LEAD_M, join.t + 100);
      const trk = from && this.depTrack(fl.world, from, [-fl.world.dirX, -fl.world.dirZ], null);
      const kinds = PARKED_TYPES[fl.world.terminal] || PARKED_TYPES.tiny, id = rng.pick(kinds), ac = AIRCRAFT.find((x) => x.id === id);
      if (!trk || !ac) return { text: 'no way for a departure here' };
      const als = airlinesAt(fl.world), airline = als.length ? rng.pick(als).code : null;
      p.dep = { kind: 'dep', a: fl.world, ac, airline, callsign: this.callsign(rng, ac, airline), start: 'taxiway', track: trk };
      this.spawnDeparture(p.dep);
      return { text: 'a departure ahead, taxiing to the runway' };
    }
    const arr = fl.arrival, kind = st.onGround ? 'behind' : 'ahead';
    if (busy(kind)) return { text: 'that arrival is already on its way' };
    // (the one planned, not come yet, else one for another free stand)
    const planned = p[kind] && !p[kind].spawned ? p[kind] : null;
    const ap = planned || this.planArrival(arr, rng, World.standsFor(arr, arrGate, fl.ac), this.plan.stands, kind);
    if (!ap) return { text: 'no free stand for an arrival' };
    if (kind === 'ahead') {
      const d = Math.min(5, fl.distToRunwayNm() - 2);
      if (st.onGround || d < 1.5) return { text: 'too close to the runway for an arrival ahead' };
      p.ahead = ap; ap.spawned = true;
      this.spawnFinal(ap, d);
    } else {
      p.behind = ap; ap.spawned = true;
      this.spawnFinal(ap, 4);
    }
    if (planned) return { text: 'an arrival on the final ' + (kind === 'ahead' ? 'ahead' : 'behind you') };
    this.plan.stands.push(ap.gate);
    return { text: 'an arrival on the final ' + (kind === 'ahead' ? 'ahead' : 'behind you'), stand: ap.gate };
  }
};
