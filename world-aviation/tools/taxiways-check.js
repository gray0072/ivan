#!/usr/bin/env node
'use strict';

// ============================================================
// World Aviation — are the taxiways drawn right at every airport? Headless.
//
//   node world-aviation/tools/taxiways-check.js [ID ...] [--verbose]
//
// Lays every airport (or the ones named) out as a flight does (World.makeAirport) and works out
// its taxiway plan (render/taxiways.js), then checks it:
//   joins    every end of a centreline piece (a straight line, a curve) lies on another piece
//            going the same way (within 5 cm and 2°: a curve is sampled in chords), so the lines join without a step or a kink;
//            the ends allowed loose: on the runway centreline, past a stand, at a dead end;
//   on pave  every centreline point lies on pavement (a piece, the runway, the apron);
//   edges    just outside every edge line there is no pavement (an edge line inside the pavement
//            would be a stray line across it), and no edge line is a scrap under 1 m;
//   lights   counted by colour; no two of a kind closer than 2 m.
// Prints a line per airport with what it found (only the faulty ones without --verbose) and the
// time the plan took. Run it after changing the taxi network (sim/world.js), the curves or
// render/taxiways.js; tools/taxiways.html shows an airport's plan to look at.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const FILES = ['constants.js', 'data/airports.js', 'data/airport-names.js', 'data/countries.js', 'core/i18n.js', 'core/utils.js',
  'sim/world.js', 'render/taxiways.js'];
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const ids = args.filter((a) => !a.startsWith('--'));

const noop = () => {};
const ctx = vm.createContext({
  console, Math, Date, JSON, Object, Array, Number, String, Map, Set, Float32Array, isFinite,
  window: {}, navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem: noop },
  document: { createElement: () => ({ getContext: () => null }), querySelectorAll: () => [], documentElement: {} },
  performance: { now: () => Date.now() }
});
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });

const out = vm.runInContext(`(function (ids) {
  World.init();
  const apts = ids.length ? ids.map((id) => World.byId[id]).filter(Boolean) : World.list;
  const rows = [];
  for (const meta of apts) {
    const a = World.makeAirport(meta, { x: 0, z: 0 });
    const t0 = Date.now();
    const plan = Taxiways.plan(a);
    const ms = Date.now() - t0;
    const bad = [];
    const onPave = (q, m) => plan.rects.some((b) => q[0] > b[0] - m && q[0] < b[1] + m && q[1] > b[2] - m && q[1] < b[3] + m) ||
      plan.pieces.some((pc) => inside(pc, q, -m));
    // the nearest point of a polyline to q, with its direction there
    const near = (pts, q) => {
      let best = { d: Infinity };
      for (let i = 0; i + 1 < pts.length; i++) {
        const p = pts[i], r = pts[i + 1], dx = r[0] - p[0], dy = r[1] - p[1], l2 = dx * dx + dy * dy || 1;
        const k = clamp(((q[0] - p[0]) * dx + (q[1] - p[1]) * dy) / l2, 0, 1);
        const d = Math.hypot(q[0] - p[0] - dx * k, q[1] - p[1] - dy * k);
        if (d < best.d) best = { d, dir: [dx / Math.sqrt(l2), dy / Math.sqrt(l2)] };
      }
      return best;
    };
    const stands = a.gates.map((g) => [g.t, LAYOUT.STAND]);
    for (const ln of plan.lines) {
      const P = ln.pts, n = P.length;
      for (const [q, r] of [[P[0], P[1]], [P[n - 1], P[n - 2]]]) {
        const l = Math.hypot(q[0] - r[0], q[1] - r[1]) || 1, dir = [(q[0] - r[0]) / l, (q[1] - r[1]) / l];
        if (Math.abs(q[1]) < 0.05) continue;                                   // on the runway centreline
        if (stands.some((s) => Math.abs(s[0] - q[0]) < 0.1 && q[1] > s[1])) continue;   // past a stand
        if (a.nodeList.some((x) => x.edges.length === 1 && Math.hypot(x.t - q[0], x.across - q[1]) < 0.05)) continue;
        const ok = plan.lines.some((o) => {
          if (o === ln) return false;
          const h = near(o.pts, q);
          return h.d < 0.05 && Math.abs(dir[0] * h.dir[1] - dir[1] * h.dir[0]) < Math.sin(2 * DEG);
        });
        if (!ok) bad.push('loose or kinked centreline end at t ' + q[0].toFixed(1) + ', across ' + q[1].toFixed(1) + ' (' + ln.kind + (ln.curve ? ' curve' : '') + ')');
      }
      for (const q of P) if (!onPave(q, 0.5)) { bad.push('centreline off the pavement at t ' + q[0].toFixed(1) + ', across ' + q[1].toFixed(1)); break; }
    }
    let scraps = 0;
    for (const ed of plan.edges) {
      if (polyLen(ed.pts) < 1) scraps++;
      // (not within 2 m of its ends: where it stops at other pavement the probe may fall on that)
      const len = polyLen(ed.pts);
      for (let i = 0, s = 0; i < ed.pts.length; i++) {
        if (i) s += Math.hypot(ed.pts[i][0] - ed.pts[i - 1][0], ed.pts[i][1] - ed.pts[i - 1][1]);
        if (s < 2 || s > len - 2) continue;
        const q = ed.pts[i], m = ed.nrm[i], o = [q[0] + m[0] * (TWY_EDGE_IN + 0.3), q[1] + m[1] * (TWY_EDGE_IN + 0.3)];
        if (onPave(o, 0)) { bad.push('edge line inside the pavement at t ' + q[0].toFixed(1) + ', across ' + q[1].toFixed(1)); break; }
      }
    }
    if (scraps) bad.push(scraps + ' edge line scraps under 1 m');
    const count = { green: 0, yellow: 0, blue: 0 };
    let close = 0;
    for (let i = 0; i < plan.lights.length; i++) {
      const l = plan.lights[i];
      count[l.c]++;
      for (let j = i + 1; j < plan.lights.length; j++) {
        const o = plan.lights[j];
        if ((o.c === 'blue') === (l.c === 'blue') && Math.hypot(o.t - l.t, o.across - l.across) < 2) close++;
      }
    }
    if (close) bad.push(close + ' pairs of lights closer than 2 m');
    rows.push({ id: a.id, size: a.terminal + (a.remote ? ' remote' : ''), ms, pieces: plan.pieces.length, lines: plan.lines.length, edges: plan.edges.length, count, bad });
  }
  return JSON.stringify(rows);
})`, ctx)(ids);

let faulty = 0, total = 0;
for (const r of JSON.parse(out)) {
  total += r.ms;
  if (r.bad.length) faulty++;
  if (!verbose && !r.bad.length) continue;
  console.log(r.id.padEnd(4), r.size.padEnd(12), String(r.ms).padStart(4) + ' ms', r.pieces + ' pieces,', r.lines + ' lines,', r.edges + ' edge lines,',
    'lights ' + r.count.green + ' green, ' + r.count.yellow + ' yellow, ' + r.count.blue + ' blue');
  for (const b of r.bad.slice(0, 8)) console.log('     ' + b);
  if (r.bad.length > 8) console.log('     … ' + (r.bad.length - 8) + ' more');
}
console.log(JSON.parse(out).length + ' airports, ' + faulty + ' with faults; the plans took ' + total + ' ms');
process.exitCode = faulty ? 1 : 0;
