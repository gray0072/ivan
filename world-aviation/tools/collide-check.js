#!/usr/bin/env node
'use strict';

// ============================================================
// World Aviation — does every aeroplane fit the airports? Headless.
//
//   node world-aviation/tools/collide-check.js [ID ...] [--type A388,B748F] [--step 2] [--verbose]
//
// For each airport (all, or the ones named) and each type (all, or the ones named) it lays the
// airport out as a flight does (World.makeAirport) and drives the aeroplane, as a kinematic
// nosewheel-steered pure pursuit of the guidance's carrot, along every taxi route the game
// gives: from every stand's push-back point on the apron lane to the line-up, and from every
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
const ids = args.filter((a, i) => !a.startsWith('--') && !['--type', '--step'].includes(args[i - 1]));

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
      const d = aircraftDims(ac), samples = Airframe.samples(ac), pts = [];
      const reach = Math.max(d.len, d.span) / 2 + 2;
      const wb = d.len * 0.38, kMax = Math.tan(SIM.NOSEWHEEL_MAX_STEER_DEG * DEG) / wb;
      const look = Math.max(30, d.len * 0.65);
      // the pose (x, z, heading) against every obstacle but the parked aeroplanes on the stands in use
      const test = (x, z, hdg, used) => {
        poses++;
        const nx = Math.sin(hdg), nz = -Math.cos(hdg), rx = Math.cos(hdg), rz = Math.sin(hdg), y = a.elev + d.gearH;
        samples.forEach((s, i) => { pts[i] = { x: x + nx * s.z - rx * s.x, y: y + s.y, z: z + nz * s.z - rz * s.x, r: s.r }; });
        for (const ob of obs) {
          if (ob.gate && used.indexOf(ob.gate) >= 0) continue;
          if (Math.hypot(ob.ox - x, ob.oz - z) > ob.rad + reach) continue;
          if (Collide.touches(ob, pts, samples.length)) return ob;
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
          const left = Math.hypot(end.x - x, end.z - z);
          if (!prog || (prog.remaining < 1.5 && left < 1.5)) break;
          const tgt = prog.remaining < look * 0.6 ? end : prog.carrot;
          const ang = wrapRad(Math.atan2(tgt.x - x, -(tgt.z - z)) - hdg);
          const dist = Math.max(1, Math.hypot(tgt.x - x, tgt.z - z));
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
        // out: from the push-back point on the apron lane (the tug's last pose) to the line-up
        const lane = gate.laneNode, used = World.standsFor(a, gate, ac);
        const out = World.findRoute(a, lane, a.nodes.rwyStart);
        drive(out, lane.x, lane.z, wrapRad(a.hdg + Math.PI), used, 'out of ' + gate.name);
        // in: from every exit, rolling down the runway, to the stand, then parked on it
        for (const ex of a.exits) {
          const r = World.findRoute(a, ex, gate.node);
          const p0 = World.at(a, ex.t - 40, 0);
          const endPose = drive([{ x: p0.x, z: p0.z, t: ex.t - 40, across: 0 }].concat(r), p0.x, p0.z, a.hdg, used, 'in from ' + ex.id + ' to ' + gate.name);
          if (endPose && ex === a.exits[0]) {
            const ob = test(gate.standX, gate.standZ, gate.parkHdg * DEG, used);
            if (ob) report('parked on ' + gate.name, ob, 0);
          }
        }
      }
    }
  }
  return { hits, poses, apts: apts.length, types: acs.length };
})`, ctx);

const t0 = Date.now();
const res = run(ids, types, step);
console.log(res.apts + ' airports x ' + res.types + ' types, ' + res.poses + ' poses, ' + res.hits.length + ' touches, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
if (verbose) console.log('step ' + step + ' m');
process.exit(res.hits.length ? 1 : 0);
