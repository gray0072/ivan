#!/usr/bin/env node
'use strict';

// ============================================================
// World Aviation — does every aeroplane fit the airports? Headless.
//
//   node world-aviation/tools/collide-check.js [ID ...] [--type A388,B748F] [--step 2] [--jobs N] [--verbose]
//
// The airports are checked by --jobs worker processes at once (by default the cores less one, at
// most 12), each handed the next airport as it finishes one. A pose looks only at the obstacles
// within the aeroplane's reach of its 40 m cell of the ground, and places the aeroplane's spheres
// only once one is there: all 141 airports with all 21 types take about two minutes.
//
// For each airport (all, or the ones named) and each type (all, or the ones named) it lays the
// airport out as a flight does (World.makeAirport) and drives the aeroplane, as a kinematic
// nosewheel-steered pure pursuit of the guidance's carrot, along every taxi route the game
// gives: every stand's push back (World.pushbackPath), from there to the line-up, and from every
// runway exit to every stand, then parked on the stand. Each pose is tested against the
// airport's buildings, helicopters and parked aeroplanes the way sim/collide.js tests it (the stand the
// flight uses, World.standsFor, has no parked aeroplane). Reports every touch: the airport, the type, the route,
// what was touched and where along the route. A clean layout prints only the summary.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const os = require('os');

try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) { /* not allowed: fine */ }

const ROOT = path.join(__dirname, '..');
const FILES = ['constants.js', 'data/airports.js', 'data/airport-names.js', 'data/countries.js', 'core/i18n.js', 'core/utils.js',
  'sim/world.js', 'sim/flight.js', 'sim/airframe.js', 'sim/collide.js'];

const args = process.argv.slice(2);
const opt = (k, d) => (args.indexOf(k) >= 0 ? args[args.indexOf(k) + 1] : d);
const verbose = args.includes('--verbose');
const types = opt('--type', '');
const step = +opt('--step', 2);
const ids = args.filter((a, i) => !a.startsWith('--') && !['--type', '--step', '--jobs'].includes(args[i - 1]));

const noop = () => {};
const ctx = vm.createContext({
  console, Math, Date, JSON, Object, Array, Number, String, Map, Set, Float32Array, Uint8Array, Int32Array, isFinite, parseFloat,
  setTimeout: noop, clearTimeout: noop,
  window: {}, navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem: noop },
  document: { createElement: () => ({ getContext: () => null }), querySelectorAll: () => [], documentElement: {} },
  performance: { now: () => 0 }
});
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });

const run = vm.runInContext(`(function (ids, typeList, step) {
  World.init();
  const apts = ids.length ? ids.map((id) => World.byId[id]).filter(Boolean) : World.list;
  const acs = typeList ? typeList.split(',').map((id) => AIRCRAFT.find((t) => t.id === id)).filter(Boolean) : AIRCRAFT;
  const hits = [];
  let poses = 0;
  for (const meta of apts) {
    const a = World.makeAirport(meta, { x: 0, z: 0 });
    const obs = Collide.obstacles(a);
    for (const ac of acs) {
      const d = aircraftDims(ac), samples = Airframe.samples(ac), n = samples.length;
      const pts = samples.map(() => ({ x: 0, y: 0, z: 0, r: 0 }));
      const reach = Math.max(d.len, d.span) / 2 + 2;
      const wb = d.len * 0.38, kMax = Math.tan(SIM.NOSEWHEEL_MAX_STEER_DEG * DEG) / wb;
      const look = Math.max(30, d.len * 0.65);
      // the obstacles this aeroplane may reach from each CELL-metre cell of the ground (most of the
      // taxiways reach none): a pose looks only at its cell's
      const CELL = 40, cells = new Map(), key = (i, j) => (i + 5000) * 10000 + j + 5000;
      for (const ob of obs) {
        const r = ob.rad + reach + CELL * 0.75;
        for (let i = Math.floor((ob.ox - r) / CELL); i <= Math.floor((ob.ox + r) / CELL); i++) {
          for (let j = Math.floor((ob.oz - r) / CELL); j <= Math.floor((ob.oz + r) / CELL); j++) {
            const cx = (i + 0.5) * CELL - ob.ox, cz = (j + 0.5) * CELL - ob.oz;
            if (cx * cx + cz * cz > r * r) continue;
            const k = key(i, j);
            if (!cells.has(k)) cells.set(k, []);
            cells.get(k).push(ob);
          }
        }
      }
      // the pose (x, z, heading) against every obstacle but the parked aeroplanes on the stands in
      // use; the spheres placed only once an obstacle is in reach
      const test = (x, z, hdg, used) => {
        poses++;
        const near = cells.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
        if (!near) return null;
        let placed = false;
        for (const ob of near) {
          if (ob.gate && used.indexOf(ob.gate) >= 0) continue;
          const dx = ob.ox - x, dz = ob.oz - z, lim = ob.rad + reach;
          if (dx * dx + dz * dz > lim * lim) continue;
          if (!placed) {
            placed = true;
            const nx = Math.sin(hdg), nz = -Math.cos(hdg), rx = Math.cos(hdg), rz = Math.sin(hdg), y = a.elev + d.gearH;
            for (let i = 0; i < n; i++) {
              const s = samples[i], p = pts[i];
              p.x = x + nx * s.z - rx * s.x; p.y = y + s.y; p.z = z + nz * s.z - rz * s.x; p.r = s.r;
            }
          }
          if (Collide.touches(ob, pts, n)) return ob;
        }
        return null;
      };
      const report = (what, ob, along) => {
        const line = meta.id + ' ' + ac.id + ' ' + what + ': ' + (ob.kind === 'parked' ? 'parked ' + ob.type.id + ' at ' + ob.gate.name : ob.kind) + ' after ' + Math.round(along) + ' m';
        hits.push(line);
        console.log(line);
      };
      // drive a route from (x, z, hdg); stops at its end, or at the first touch
      const drive = (route, x, z, hdg, used, what) => {
        route.seg = 0;
        let along = 0;
        const end = route[route.length - 1];
        for (let k = 0; k < 20000; k++) {
          const prog = World.routeProgress(a, route, x, z, look);
          const ex = end.x - x, ez = end.z - z, left = Math.sqrt(ex * ex + ez * ez);
          if (!prog || (prog.remaining < 1.5 && left < 1.5)) break;
          const tgt = prog.remaining < look * 0.6 ? end : prog.carrot;
          const tx = tgt.x - x, tz = tgt.z - z;
          const ang = wrapRad(Math.atan2(tx, -tz) - hdg);
          const dist = Math.max(1, Math.sqrt(tx * tx + tz * tz));
          const kk = clamp(2 * Math.sin(ang) / dist, -kMax, kMax);
          const ds = Math.min(step, left);
          hdg = wrapRad(hdg + kk * ds);
          x += Math.sin(hdg) * ds; z += -Math.cos(hdg) * ds; along += ds;
          const ob = test(x, z, hdg, used);
          if (ob) { report(what, ob, along); return null; }
        }
        return { x, z, hdg };
      };
      for (const gate of a.gates) {
        // (a GA stand takes only the types up to LAYOUT.GA_MAX_SPAN: World.zoneFor)
        if (gate.ga && ac.dims.span > LAYOUT.GA_MAX_SPAN) continue;
        // the push back (World.pushbackPath), then out: from where the tug lets go on the apron
        // lane to the line-up
        const lane = gate.laneNode, used = World.standsFor(a, gate, ac);
        const push = World.pushbackPath(a, gate, d.len);
        let pushed = true;
        for (let s = 0; s <= push.length; s += step) {
          const q = push.pose(s / push.length), ob = test(q.x, q.z, q.hdg, used);
          if (ob) { report('pushed back from ' + gate.name, ob, s); pushed = false; break; }
        }
        const out = World.findRoute(a, lane, a.nodes.rwyStart, [-a.dirX, -a.dirZ]);
        if (pushed) drive(out, push.end.x, push.end.z, push.end.hdg, used, 'out of ' + gate.name);
        // in: from every exit, rolling down the runway from before its curve, to the stand, then
        // parked on it
        for (const ex of a.exits) {
          const r = World.findRoute(a, ex, gate.node);
          const t0 = ex.t - ex.turnBack - 40, p0 = World.at(a, t0, 0);
          const endPose = drive([{ x: p0.x, z: p0.z, t: t0, across: 0 }].concat(r), p0.x, p0.z, a.hdg, used, 'in from ' + ex.id + ' to ' + gate.name);
          if (endPose && ex === a.exits[0]) {
            const spot = World.standSpot(a, gate, d.len), ob = test(spot.x, spot.z, gate.parkHdg * DEG, used);
            if (ob) report('parked on ' + gate.name, ob, 0);
          }
        }
      }
    }
  }
  return { hits, poses, apts: apts.length, types: acs.length };
})`, ctx);

// A worker (forked below): checks the airport and type it is sent, one pair at a time, and sends
// back each result
if (args.includes('--worker')) {
  process.on('message', (m) => {
    if (m.id) process.send(run([m.id], m.type, step));
    else process.exit(0);
  });
  return;
}

const t0 = Date.now();
const known = vm.runInContext('World.init(), World.list.map((a) => a.id)', ctx);
const all = ids.length ? ids.filter((id) => known.includes(id)) : known;
const typeIds = vm.runInContext('AIRCRAFT.map((t) => t.id)', ctx).filter((id) => !types || types.split(',').includes(id));
const pairs = [];
for (const id of all) for (const type of typeIds) pairs.push({ id, type });
const jobs = Math.max(1, Math.min(pairs.length, +opt('--jobs', Math.min(12, os.cpus().length - 1))));
const done = (res) => {
  console.log(all.length + ' airports x ' + typeIds.length + ' types, ' + res.poses + ' poses, ' + res.hits.length + ' touches, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s' + (jobs > 1 ? ' (' + jobs + ' jobs)' : ''));
  if (verbose) console.log('step ' + step + ' m');
  process.exit(res.hits.length ? 1 : 0);
};
if (jobs === 1) done(run(all, types, step));
else {
  // the airport and type pairs handed out one at a time to `jobs` workers, the biggest airports
  // first, so the workers finish together
  const { fork } = require('child_process');
  const size = vm.runInContext('(id) => World.byId[id].rwyLen * (World.byId[id].gateCount + 4)', ctx);
  const queue = pairs.sort((p, q) => size(q.id) - size(p.id));
  const total = { hits: [], poses: 0 };
  let running = jobs;
  for (let w = 0; w < jobs; w++) {
    const child = fork(__filename, args.concat('--worker'));
    const next = () => child.send(queue.length ? queue.shift() : {});
    child.on('message', (res) => {
      total.hits.push(...res.hits); total.poses += res.poses;
      next();
    });
    child.on('exit', (code) => {
      if (code) total.hits.push('a worker failed (exit code ' + code + ')');
      if (--running === 0) done(total);
    });
    next();
  }
}
