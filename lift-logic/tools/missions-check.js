#!/usr/bin/env node
'use strict';

// Lift Logic — the balancing checker. Loads the sim/ files in Node, runs every mission's reference solution
// (data/solutions/) at every difficulty and reports whether it passes, the stars it gets and its numbers,
// and how close each star limit is. It fails when a reference doesn't get ★★★ on Medium, when an empty
// program passes, or when the previous chapter's exam solution (a "naïve" program) already gets ★★★ — so
// each mission needs its new idea. Proposed limits: ★★★ ≈ the reference × 1.1, ★★ ≈ × 1.4.
//
// Usage: node lift-logic/tools/missions-check.js [mission id…] [--verbose]

const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const ctx = { console, Math, JSON, Object, Array, Number, String, Set, Map, Error, isNaN, isFinite, parseInt, parseFloat };
vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });

['constants.js', 'data/blocks.js', 'data/lifts.js', 'data/people.js', 'data/buildings.js', 'data/missions/missions.js'].forEach(load);
const ids = vm.runInContext('BUILDINGS.map((b) => b.id)', ctx);
for (const id of ids) {
  if (fs.existsSync(path.join(root, 'data/missions', id + '.js'))) load('data/missions/' + id + '.js');
  if (fs.existsSync(path.join(root, 'data/solutions', id + '.js'))) load('data/solutions/' + id + '.js');
}
['core/utils.js', 'core/events.js', 'sim/state.js', 'sim/building.js', 'sim/lift.js', 'sim/people.js', 'sim/sensors.js',
  'sim/program.js', 'sim/vm.js', 'sim/run.js', 'sim/stats.js', 'sim/inspector.js'].forEach(load);

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const only = args.filter((a) => !a.startsWith('--'));

const out = vm.runInContext(`(() => {
  const only = ${JSON.stringify(only)};
  const report = [];
  const exams = {};
  for (const m of MISSIONS) if (m.kind === 'exam' && SOLUTIONS[m.id]) exams[m.chapter] = m.id;
  for (const m of MISSIONS) {
    if (only.length && !only.includes(m.id)) continue;
    const r = { id: m.id, name: m.name, problems: [], diffs: {} };
    report.push(r);
    if (!SOLUTIONS[m.id]) { r.problems.push('no reference solution'); continue; }
    let prog;
    try { prog = Prog.parse(SOLUTIONS[m.id]); } catch (e) { r.problems.push(e.message); continue; }
    const tooNew = Prog.ops(prog).filter((op) => BLOCK[op].ch > m.chapter);
    if (tooNew.length) r.problems.push('uses blocks of a later chapter: ' + tooNew.join(', '));
    for (const d of DIFFICULTY_ORDER) {
      const res = simulate(m, prog, d);
      const st = res.stats;
      r.diffs[d] = { stars: res.judged.stars, lines: res.judged.lines.map((l) => l.parts.map((p) => (p.ok ? '✓ ' : '✗ ') + p.key.replace(/\\{(\\w+)\\}/g, (a, k) => (p.params || {})[k]) + ' [' + p.value + ']').join(' + ')),
        avgWait: +st.avgWait.toFixed(1), maxWait: +st.maxWait.toFixed(1), energy: st.energy, blocks: st.blocks,
        delivered: st.delivered + '/' + st.total, gaveUp: st.gaveUp, furious: st.furious, time: Math.round(st.time), errors: Object.keys(res.run.errors).length,
        notes: Inspector.notes(res.run).map((n) => n.key) };
      if (Object.keys(res.run.errors).length) r.problems.push(d + ': the reference has errors: ' + JSON.stringify(Object.values(res.run.errors).map((e) => e.msg)));
    }
    if (r.diffs.medium.stars < 3) r.problems.push('the reference gets ' + r.diffs.medium.stars + ' stars on Medium');
    if (r.diffs.easy.stars < 3) r.problems.push('the reference gets ' + r.diffs.easy.stars + ' stars on Easy');
    const empty = simulate(m, Prog.parse('when ▶ clicked'), 'medium');
    if (empty.judged.pass) r.problems.push('an empty program passes');
    const naive = exams[m.chapter - 1];
    if (naive) {
      try {
        const res = simulate(m, Prog.parse(SOLUTIONS[naive]), 'medium');
        r.naive = { from: naive, stars: res.judged.stars, avgWait: +res.stats.avgWait.toFixed(1), energy: res.stats.energy };
        if (res.judged.stars >= 3) r.problems.push('the naive program (' + naive + ') already gets ★★★');
      } catch (e) { r.naive = { from: naive, error: e.message }; }
    }
    // the solution of the mission before in the same building should not already get ★★★
    const prev = MISSION[m.chapter + '-' + (m.n - 1)];
    if (prev && SOLUTIONS[prev.id] && m.kind !== 'fix' && m.kind !== 'fill') {
      const res = simulate(m, Prog.parse(SOLUTIONS[prev.id]), 'medium');
      r.prev = { from: prev.id, stars: res.judged.stars };
      if (res.judged.stars >= 3 && SOLUTIONS[prev.id].trim() !== SOLUTIONS[m.id].trim()) r.problems.push('the solution of ' + prev.id + ' already gets ★★★ (warning)');
    }
    const md = r.diffs.medium;
    r.propose = { avgWait3: +(md.avgWait * 1.1).toFixed(1), avgWait2: +(md.avgWait * 1.4).toFixed(1), maxWait3: +(md.maxWait * 1.1).toFixed(1), energy3: Math.ceil(md.energy * 1.1), energy2: Math.ceil(md.energy * 1.4) };
  }
  return JSON.stringify(report);
})()`, ctx);

let bad = 0;
for (const r of JSON.parse(out)) {
  const m = r.diffs.medium;
  const stars = ['easy', 'medium', 'hard'].map((d) => (r.diffs[d] ? r.diffs[d].stars : '-')).join('/');
  console.log(`${r.id.padEnd(5)} ${r.name.padEnd(26)} ★ ${stars}` + (m ? `  wait ${m.avgWait}/${m.maxWait}  ⚡${m.energy}  blocks ${m.blocks}  ${m.delivered} gave up ${m.gaveUp}${m.furious ? ' furious ' + m.furious : ''}  ${m.time}s` : '') +
    (r.naive ? `  naive(${r.naive.from}) ★${r.naive.stars} wait ${r.naive.avgWait} ⚡${r.naive.energy}` : ''));
  if (verbose && m) {
    for (const d of ['easy', 'medium', 'hard']) console.log('      ' + d.padEnd(7) + r.diffs[d].lines.join(' | ') + (r.diffs[d].notes.length ? '  notes: ' + r.diffs[d].notes.join(', ') : ''));
    console.log('      propose ' + JSON.stringify(r.propose));
  }
  for (const p of r.problems) { console.log('   ! ' + p); bad++; }
}
process.exit(bad ? 1 : 0);
