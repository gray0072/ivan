#!/usr/bin/env node
'use strict';

// ============================================================
// World Aviation — the ready routes round the world checked against the rules (sim/rtw.js).
//
//   node world-aviation/tools/rtw-check.js [--type A359]
//
// For each route of RTW_ROUTES, both ways round: its legs (the distance, the change of
// longitude, what breaks the rules), the km against RTW.MIN_KM, the longitude flown, and
// every type that may take it round (Rtw.check with every class's types; --type: that one
// alone, with its legs' errors). Exits with 1 when a route does not count for any type.
//
// The logic files run in a vm context with a few stubs, the way the game loads them.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const FILES = ['constants.js', 'data/airports.js', 'data/airport-names.js', 'data/countries.js', 'data/airlines.js', 'data/mriya.js', 'data/rtw.js',
  'core/i18n.js', 'core/utils.js', 'data/geodata.js', 'sim/terrain.js', 'sim/world.js', 'career.js', 'sim/rtw.js'];

const args = process.argv.slice(2);
const typeArg = args.indexOf('--type') >= 0 ? args[args.indexOf('--type') + 1] : null;

const noop = () => {};
const ctx = vm.createContext({
  console, Math, Date, JSON, Object, Array, Number, String, Map, Set, Float32Array, Uint8Array, Int32Array, isFinite, parseFloat,
  setTimeout: noop, clearTimeout: noop,
  window: {}, navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem: noop },
  document: { createElement: () => ({ getContext: () => null }), querySelectorAll: () => [], documentElement: {} },
  performance: { now: () => 0 }
});
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });

const out = vm.runInContext(`(function (typeArg) {
  World.init();
  Career.data = { base: CAREER.HOME_BASE, regions: REGIONS.map((r) => r.id), courses: COURSES.map((c) => c.id), rtw: Rtw.blank() };
  const types = AIRCRAFT.filter((a) => Rtw.classOf(a) && (!typeArg || a.id === typeArg));
  const lines = [];
  let bad = 0;
  for (const r of RTW_ROUTES) {
    for (const rev of [false, true]) {
      const plan = Rtw.routePlan(r.id, rev);
      const geo = Rtw.check(plan, null);
      const ok = types.filter((a) => Rtw.check(plan, a).ok);
      lines.push((r.name + (rev ? ' (westbound)' : ' (eastbound)')).padEnd(30) + plan.join(' '));
      lines.push('  ' + Math.round(geo.km) + ' km (min ' + RTW.MIN_KM + ')  ' + Math.round(geo.deg) + '°  ' + (geo.ok ? 'counts' : 'DOES NOT COUNT') +
        '  longest leg ' + Math.round(Math.max(...geo.legs.map((l) => l.nm))) + ' nm');
      lines.push('  types: ' + (ok.length ? ok.map((a) => a.id + ' (' + Rtw.classOf(a).id + ')').join(', ') : 'NONE'));
      if (typeArg) {
        const chk = Rtw.check(plan, types[0]);
        for (const l of chk.legs) lines.push('    ' + l.from.id + ' > ' + l.to.id + '  ' + Math.round(l.nm) + ' nm  ' + l.dl.toFixed(1) + '°' + (l.err ? '  ' + l.err : ''));
      }
      if (!geo.ok || !ok.length) bad++;
    }
  }
  return { text: lines.join('\\n'), bad };
})`, ctx)(typeArg);

console.log(out.text);
if (out.bad) { console.log('\n' + out.bad + ' route(s) that do not count'); process.exit(1); }
