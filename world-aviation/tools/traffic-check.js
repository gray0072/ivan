#!/usr/bin/env node
'use strict';

// ============================================================
// World Aviation — the other aeroplanes (sim/traffic.js) at every airport, run headless.
//
//   node world-aviation/tools/traffic-check.js [ID ...] [--verbose]
//
// For each airport (all of them, or the ones named) it builds the flight's world as a flight
// there does, with every chance of TRAFFIC.CHANCE at 1, and runs the real AirTraffic code
// against a scripted player:
//   - departures: from each of the first terminal's stands (up to three) and once from the
//     holding point (the short start), the player sits out the intro, waits, is pushed back
//     (World.pushbackPath), starts the engines, taxis the arrow's route to the holding point at
//     7 m/s (slowing for another aeroplane ahead as the first officer does, AirTraffic.copilotCap),
//     holds, lines up and takes off;
//   - arrivals: to three of the stands, the player flies the final from 17 nm at 140 kt down the
//     glide path, lands, slows down, takes the exit the arrow gives and taxis to the stand.
// Every 0.1 s it tests the player against the others as sim/collide.js does (Collide.step: the
// prisms of their types) and checks the runway: none of the others on it (or low over it) with
// the player on it, but one rolling for take-off well ahead. It checks that every way of theirs
// on the ground lies on the pavement, that the departure ahead takes off, that the arrival ahead
// is parked before the player touches down and the one after parks (or goes around).
// It prints the problems (all the runs with --verbose) and exits with 1 if there was one; run it
// after changing sim/traffic.js, TRAFFIC, the taxi network or the stands.
// The logic files run in a vm context with a few stubs (no rendering, no sound, no DOM).
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const FILES = ['constants.js', 'data/airports.js', 'data/airport-names.js', 'data/countries.js', 'data/airlines.js', 'data/geodata.js',
  'core/i18n.js', 'core/utils.js', 'sim/terrain.js', 'sim/world.js', 'core/audio.js', 'sim/flight.js', 'sim/airframe.js', 'sim/collide.js',
  'sim/guidance.js', 'sim/taxilimit.js', 'sim/copilot.js', 'sim/traffic.js'];

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const ids = args.filter((a) => !a.startsWith('--'));

const noop = () => {};
const ctx = vm.createContext({
  console, Math, Date, JSON, Object, Array, Number, String, Map, Set, Float32Array, Float64Array, Uint8Array, Int32Array, isFinite, parseFloat,
  setTimeout: noop, clearTimeout: noop,
  window: {}, navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem: noop },
  document: { createElement: () => ({ getContext: () => null }), querySelectorAll: () => [], documentElement: {} },
  performance: { now: () => 0 }, HUD: { push: noop }
});
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });

const run = vm.runInContext(`(function (xId, verbose) {
  if (!World.list.length) World.init();
  for (const k in TRAFFIC.CHANCE) if (k !== 'tiny') TRAFFIC.CHANCE[k] = [1, 1, 1];
  const X = World.byId[xId];
  if (!X) return { id: xId, error: 'no such airport' };
  // the other end some 200 nm away
  let Y = null, best = Infinity;
  for (const o of World.list) {
    if (o === X) continue;
    const d = Math.abs(geoDistanceNm(o.lat, o.lon, X.lat, X.lon) - 200);
    if (d < best) { best = d; Y = o; }
  }
  World.key = '';
  World.prepare(X.id, Y.id);
  const a = World.here[X.id], b = World.here[Y.id];
  const out = { id: X.id, name: X.name, runs: [] };
  if (a.remote || a.terminal === 'tiny') { out.skipped = true; return out; }
  const types = ['B738'].concat(a.terminal === 'big' ? ['B77W'] : a.terminal === 'small' ? ['AT76'] : []);
  const DT = 0.1;

  // ---- the checks of one step
  const check = (fl, r, t) => {
    const st = fl.st, A = fl.nearestApt();
    // the player against the others, as Collide.step does (the tug's phases too)
    const ph = fl.phase;
    if (ph === 'GATE' || ph === 'PUSHBACK') fl.phase = 'TAXI_OUT';
    Collide.step(fl);
    fl.phase = ph;
    if (fl.incident || fl.failure) {
      const c = fl.incident || fl.failure.contact || {};
      r.problems.push(Math.round(t) + ' s ' + ph + ': touched ' + (c.what || (fl.failure && fl.failure.text)));
      fl.incident = null; fl.failure = null;
      return false;
    }
    // the runway: the player on it, one of the others on it too (but one rolling well ahead)
    if (AirTraffic.playerOnStrip(A)) {
      const pt = World.local(A, st.pos.x, st.pos.z).t;
      for (const m of AirTraffic.movers) {
        if (m.a !== A || m.gone || m.agl > 60 || !AirTraffic.onStrip(A, m.x, m.z)) continue;
        const L = m.legs[m.leg];
        if (L && L.type === 'roll' && World.local(A, m.x, m.z).t > pt + 200) continue;
        r.problems.push(Math.round(t) + ' s ' + ph + ': the ' + m.kind + ' (' + m.ac.id + ') on the runway with the player (' + (L ? L.name || L.type : '-') + ')');
        return false;
      }
    }
    return true;
  };
  // every way on the ground on the pavement (with the player at that airport)
  const paved = (fl, r, plan) => {
    for (const p of [plan.dep, plan.ahead, plan.behind]) {
      if (!p || !p.track || p.a !== fl.nearestApt()) continue;
      const tr = p.track;
      let off = 0;
      for (let i = 0; i < tr.n; i += 2) if (!fl.surfaceAt(tr.X[i], tr.Z[i]).onPavement) off++;
      if (off) r.problems.push('the ' + p.kind + "'s way (" + p.ac.id + ') off the pavement at ' + off + ' points');
    }
  };
  const along = (sm, s) => {
    const P = sm.pts, S = sm.S;
    let i = 0;
    while (i < P.length - 2 && S[i + 1] < s) i++;
    const k = clamp((s - S[i]) / ((S[i + 1] - S[i]) || 1), 0, 1);
    return { x: lerp(P[i].x, P[i + 1].x, k), z: lerp(P[i].z, P[i + 1].z, k), h: Math.atan2(P[i + 1].x - P[i].x, -(P[i + 1].z - P[i].z)) };
  };

  // ---- a departure: from stand gi (or the holding point)
  const departure = (typeId, gi, skip) => {
    const ac = AIRCRAFT.find((x) => x.id === typeId), gate = a.gates[gi];
    const fl = Flight.init({ aircraft: ac, from: a, to: b, contract: { payloadKg: 0 }, gate, skipPushback: skip });
    const plan = AirTraffic.start(fl, { seed: 1000 + gi, skipPushback: skip, arrGate: b.gates[0] });
    fl.gatesInUse = (skip ? [] : World.standsFor(a, gate, ac)).concat(AirTraffic.reserved());
    const r = { what: 'dep ' + typeId + ' ' + (skip ? 'hold' : gate.name), traffic: plan.dep ? plan.dep.start + ' ' + plan.dep.ac.id : 'none', problems: [] };
    paved(fl, r, plan);
    const st = fl.st, len = fl.dims.len;
    const push = skip ? null : World.pushbackPath(a, gate, len);
    let sm = null, s = 0, v = 0, mode = skip ? 'intro' : 'intro', tm = 0, rolledT = null, airT = null, line = null;
    const dep = AirTraffic.movers.find((m) => m.kind === 'dep');
    let depRolled = false;
    for (let t = 0; t < 900; t += DT) {
      tm += DT;
      const intro = t < CINEMATIC.INTRO_S;
      if (mode === 'intro' && !intro) { mode = skip ? 'cleared' : 'gate'; tm = 0; }
      if (mode === 'gate' && tm > 4) { mode = 'push'; fl.setPhase('PUSHBACK'); tm = 0; }
      if (mode === 'push') {
        const q = push.pose(smoothstep(0, 1, clamp(tm / SIM.PUSHBACK_S, 0, 1)));
        st.pos.x = q.x; st.pos.z = q.z; st.hdg = q.hdg;
        if (tm >= SIM.PUSHBACK_S) { mode = 'start'; fl.setPhase('ENGINE_START'); tm = 0; }
      }
      if (mode === 'start' && tm > 12) {
        // (from the push back's end, past the stand's lane node, onto the route)
        const sm0 = World.smoothRoute(a, fl.route);
        sm = { pts: [{ x: st.pos.x, z: st.pos.z }].concat(sm0.pts), S: [0] };
        for (let i = 1; i < sm.pts.length; i++) sm.S.push(sm.S[i - 1] + Math.hypot(sm.pts[i].x - sm.pts[i - 1].x, sm.pts[i].z - sm.pts[i - 1].z));
        mode = 'taxi'; fl.setPhase('TAXI_OUT'); s = 0; v = 0;
      }
      if (mode === 'taxi') {
        fl.guidance = { route: fl.route, along: Math.max(0, s - sm.S[1]) };
        const cap = AirTraffic.copilotCap(fl);
        v = Math.min(v + 0.5 * DT, 7, cap);
        s += v * DT;
        const q = along(sm, s);
        st.vel.x = (q.x - st.pos.x) / DT; st.vel.z = (q.z - st.pos.z) / DT;
        st.pos.x = q.x; st.pos.z = q.z; st.hdg = q.h;
        if (s >= sm.S[sm.S.length - 1] - 0.5) { mode = 'hold'; fl.setPhase('HOLD_SHORT'); tm = 0; st.vel.x = st.vel.z = 0; fl.guidance = null; }
      }
      if (mode === 'hold' && tm > 15) { mode = 'cleared'; fl.setPhase('TAKEOFF'); tm = 0; }
      if (mode === 'cleared' && tm > 4) {
        // onto the runway: the holding point, the line-up point, then down the centreline
        const n = a.nodes, p0 = { x: st.pos.x, z: st.pos.z };
        line = [p0, n.rwyStart, World.at(a, n.rwyStart.t + 80, 0), World.at(a, a.half + 20000, 0)];
        const S = [0];
        for (let i = 1; i < line.length; i++) S.push(S[i - 1] + Math.hypot(line[i].x - line[i - 1].x, line[i].z - line[i - 1].z));
        sm = { pts: line, S }; s = 0; v = 0; mode = 'roll';
      }
      if (mode === 'roll') {
        v = Math.min(v + (s < 100 ? 0.4 : 2) * DT, s < 100 ? 6 : 200);
        s += v * DT;
        const q = along(sm, s);
        st.vel.x = (q.x - st.pos.x) / DT; st.vel.z = (q.z - st.pos.z) / DT;
        st.pos.x = q.x; st.pos.z = q.z; st.hdg = q.h;
        if (v > 75 && st.onGround) { st.onGround = false; airT = t; }
        if (!st.onGround) st.pos.y += v * 0.1 * DT;
      }
      AirTraffic.update(fl, DT, intro);
      fl.events.length = 0;
      if (dep && dep.legs[dep.leg] && dep.legs[dep.leg].type === 'roll' && !dep.onGround) depRolled = true;
      if (!check(fl, r, t)) break;
      if (airT !== null && t - airT > 60) break;
    }
    if (dep && !depRolled && !dep.gone) r.problems.push('the departure (' + dep.ac.id + ') never took off: ' + (dep.legs[dep.leg] ? dep.legs[dep.leg].name || dep.legs[dep.leg].type : '-') + ' at ' + Math.round(dep.s) + ' m');
    if (airT === null) r.problems.push('the player never took off (' + mode + ')');
    return r;
  };

  // ---- an arrival at stand gi
  const arrival = (typeId, gi) => {
    const ac = AIRCRAFT.find((x) => x.id === typeId), gate = a.gates[gi];
    const fl = Flight.init({ aircraft: ac, from: b, to: a, contract: { payloadKg: 0 }, gate: b.gates[0], skipPushback: true });
    const plan = AirTraffic.start(fl, { seed: 2000 + gi, arrGate: gate });
    fl.gatesInUse = World.standsFor(a, gate, ac).concat(AirTraffic.reserved());
    const r = { what: 'arr ' + typeId + ' ' + gate.name, traffic: (plan.ahead ? 'ahead ' + plan.ahead.ac.id + ' ' + plan.ahead.gate.name : 'no ahead') + ', ' + (plan.behind ? 'behind ' + plan.behind.ac.id + ' ' + plan.behind.gate.name : 'no behind'), problems: [] };
    const st = fl.st, tan = Math.tan(SIM.GLIDESLOPE_DEG * DEG);
    let t0 = -a.half - 17 * NM, v = 140 * KTS, mode = 'final', sm = null, s = 0, tdT = null, parkedT = null, aheadParkedAt = null;
    st.onGround = false; st.wasAirborne = true;
    fl.setPhase('APPROACH');
    for (let t = 0; t < 1500; t += DT) {
      if (mode === 'final') {
        t0 += v * DT;
        const p = World.at(a, t0, 0), agl = Math.max(0, (-a.half + 300 - t0) * tan);
        st.pos.x = p.x; st.pos.z = p.z; st.pos.y = a.elev + st.gearH + agl; st.hdg = a.hdg;
        st.vel.x = hdgX(a.hdg) * v; st.vel.z = hdgZ(a.hdg) * v;
        if (agl <= 0) {
          st.onGround = true; mode = 'rollout'; fl.setPhase('ROLLOUT'); tdT = t; fl.landed = { fpm: 100 };
          paved(fl, r, plan);
          const A = AirTraffic.movers.find((m) => m.kind === 'ahead');
          if (plan.ahead && plan.ahead.spawned && A && !A.parked) r.problems.push('the arrival ahead (' + A.ac.id + ') not parked at the touchdown: ' + (A.legs[A.leg] ? A.legs[A.leg].type : '-'));
        }
      } else if (mode === 'rollout') {
        v = Math.max(15 * KTS, v - 2 * DT);
        t0 += v * DT;
        const p = World.at(a, t0, 0);
        st.pos.x = p.x; st.pos.z = p.z; st.vel.x = hdgX(a.hdg) * v; st.vel.z = hdgZ(a.hdg) * v;
        if (v <= 15 * KTS + 0.01) {
          const exit = Guidance.exitFor(a, t0, v);
          const route = World.findRoute(a, exit, gate.node);
          // (rolling on down the runway to the exit's curve first)
          const sm0 = World.smoothRoute(a, route);
          sm = { pts: [{ x: st.pos.x, z: st.pos.z }].concat(sm0.pts), S: [0] };
          for (let i = 1; i < sm.pts.length; i++) sm.S.push(sm.S[i - 1] + Math.hypot(sm.pts[i].x - sm.pts[i - 1].x, sm.pts[i].z - sm.pts[i - 1].z));
          r.route = route; s = 0; mode = 'taxi'; fl.setPhase('EXIT');
        }
      } else if (mode === 'taxi') {
        fl.guidance = { route: r.route, along: Math.max(0, s - (sm.S[1] || 0)) };
        const cap = AirTraffic.copilotCap(fl);
        v = Math.min(v + 0.5 * DT, 8, cap);
        s += v * DT;
        const q = along(sm, s);
        st.vel.x = (q.x - st.pos.x) / DT; st.vel.z = (q.z - st.pos.z) / DT;
        st.pos.x = q.x; st.pos.z = q.z; st.hdg = q.h;
        if (s >= sm.S[sm.S.length - 1] - 0.5) { mode = 'parked'; fl.setPhase('SHUTDOWN'); parkedT = t; st.vel.x = st.vel.z = 0; fl.guidance = null; }
      }
      AirTraffic.update(fl, DT, false);
      fl.events.length = 0;
      const A = AirTraffic.movers.find((m) => m.kind === 'ahead');
      if (A && A.parked && aheadParkedAt === null) aheadParkedAt = t;
      if (!check(fl, r, t)) break;
      const B = AirTraffic.movers.find((m) => m.kind === 'behind');
      if (parkedT !== null && (!B || B.parked || B.gone) && t - parkedT > 5) break;
    }
    const B = AirTraffic.movers.find((m) => m.kind === 'behind');
    if (plan.behind && plan.behind.spawned && B && !B.parked) r.problems.push('the arrival behind (' + B.ac.id + ') not parked in the end: ' + (B.legs[B.leg] ? B.legs[B.leg].type : '-') + ' at ' + Math.round(B.s) + ' m');
    r.traffic += plan.behind && plan.behind.spawned && !B ? ' (went around)' : '';
    if (parkedT === null) r.problems.push('the player never parked (' + mode + ')');
    return r;
  };

  const T1 = a.gates.filter((g) => g.zone === 'pax' && g.terminal === 1).slice(0, 3);
  const pax = a.gates.filter((g) => g.zone === 'pax');
  for (const ty of types) {
    for (const g of T1) out.runs.push(departure(ty, g.index, false));
    out.runs.push(departure(ty, T1[0].index, true));
    for (const g of [pax[0], pax[Math.floor(pax.length / 2)], pax[pax.length - 1]]) out.runs.push(arrival(ty, g.index));
  }
  AirTraffic.stop();
  return out;
})`, ctx);

const list = ids.length ? ids : vm.runInContext('AIRPORTS.map((a) => a.id)', ctx);
const bad = [];
const t0 = Date.now();
for (const id of list) {
  const res = run(id, verbose);
  if (res.error) { console.log(id + ': ' + res.error); continue; }
  if (res.skipped) { if (verbose) console.log(res.id.padEnd(4) + ' (no traffic: tiny or remote)'); continue; }
  const flagged = res.runs.filter((r) => r.problems.length);
  console.log(res.id.padEnd(4) + ' ' + res.name.slice(0, 30).padEnd(30) + ' ' + res.runs.length + ' runs' + (flagged.length ? '  <- ' + flagged.length + ' with problems' : ' ok'));
  for (const r of res.runs) {
    if (!r.problems.length && !verbose) continue;
    console.log('     ' + r.what.padEnd(24) + ' ' + r.traffic);
    for (const p of r.problems) console.log('        ✗ ' + p);
  }
  if (flagged.length) bad.push(res.id);
}
console.log('\n' + list.length + ' airports, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s' + (bad.length ? ' — problems at: ' + bad.join(' ') : ' — all fine'));
process.exitCode = bad.length ? 1 : 0;
