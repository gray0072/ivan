#!/usr/bin/env node
'use strict';

// Arlanda Rising — checks the turnaround's bar and card (Turnaround.steps, drawn by render/traffic.js and written by
// ui/cards.js) against what the sim does. Plays the campaign at one difficulty with the reference strategies, mission
// after mission with the airport carried over (as tools/missions-check.js), and after every ops step checks each
// aircraft at a stand:
//   - each step's state is one of later / wait / coming / going / done and its share in 0–1; a done step is full;
//   - passengers off, the services and the fuel are done exactly when the sim would let boarding begin (tr.off, tr.svc
//     and the bags, the fuel 'done' and past fuelEnd), and boarding is done exactly when the sim has it ready;
//   - the fuel stays empty while its vehicle drives (the truck's card says 'to'), fills only from the moment it is at
//     the wing (fuelStart) to fuelEnd, and the oil company's fuel progresses instead of jumping;
//   - the shares never go back (off, services, fuel; boarding may when snow or heat slow it as it runs);
//   - boarding's minutes are the sim's: when the sim makes a flight ready its boarding time is full;
//   - a step that waits says why, and when boarding begins every step before it is done.
// It prints, per mission, the aircraft and the ways seen (fuel by truck / oil company / robot / stand charger / mobile
// charger / hydrogen, the bags by hand, de-icing, overnight, the snow's or the heat's slowdown, late passengers) and the
// first few failures; exits 1 on any failure. Run it after changing sim/turnaround.js, the bar or the card.
//
// Usage: node arlanda-rising/tools/turnaround-check.js [mission id…] [--difficulty easy|medium|hard]

const vm = require('vm');
const ctx = require('./sim-files').context();

const args = process.argv.slice(2);
const di = args.indexOf('--difficulty');
const diff = di >= 0 ? args[di + 1] : 'medium';
const only = args.filter((a, i) => !a.startsWith('--') && (di < 0 || i !== di + 1));

const fails = vm.runInContext(`(() => {
  const ONLY = ${JSON.stringify(only)}, D = ${JSON.stringify(diff)}, EPS = 1e-6;
  const STATES = ['later', 'wait', 'coming', 'going', 'done'];
  let failCount = 0;
  function check(id) {
    const seen = {}, fails = [], prev = {};
    const fail = (f, msg) => { if (fails.length < 8) fails.push(fmtClock(S.clock) + ' ' + f.no + ' (' + f.type + '): ' + msg); failCount++; };
    const see = (k) => { seen[k] = (seen[k] || 0) + 1; };
    return {
      seen, fails,
      // before the sim's step: what the view says now, to compare with what the step does
      before() {
        const out = {};
        for (const f of S.ops ? S.ops.flights : []) if (f.tr && (f.st === 'turn' || f.st === 'parked')) out[f.id] = { ready: f.tr.ready, board: f.tr.board, fuel: f.tr.fuel };
        return out;
      },
      after(was) {
        if (!S.ops) return;
        const t = S.clock;
        for (const f of S.ops.flights) {
          const tr = f.tr;
          if (!tr || !(f.st === 'turn' || f.st === 'parked')) continue;
          const v = Turnaround.steps(f, t);
          for (const k of ['off', 'svc', 'fuel', 'board']) {
            const s = v[k];
            if (STATES.indexOf(s.st) < 0) fail(f, k + ': state ' + s.st);
            if (!(s.u >= 0 && s.u <= 1)) fail(f, k + ': share ' + s.u);
            if (s.st === 'done' && s.u !== 1) fail(f, k + ': done but ' + s.u);
            if (s.st !== 'done' && s.u >= 1 && k !== 'board') fail(f, k + ': full but ' + s.st);
            if (s.st === 'wait' && !s.why) fail(f, k + ': waits without a reason');
            if (s.st === 'coming' && !(s.drive >= 0 && s.drive <= 1)) fail(f, k + ': drive ' + s.drive);
          }
          // done exactly when the sim would go on
          const offDone = f.inBlock === null || t >= tr.off;
          if ((v.off.st === 'done') !== offDone) fail(f, 'off ' + v.off.st + ', the sim ' + offDone);
          const svcDone = t >= tr.svc && (!tr.bags || tr.bags === 'done');
          if ((v.svc.st === 'done') !== svcDone) fail(f, 'services ' + v.svc.st + ', the sim ' + svcDone);
          const fuelDone = (tr.fuel === 'done' || tr.fuel === 'going') && tr.fuelEnd !== null && t >= tr.fuelEnd;
          if ((v.fuel.st === 'done') !== fuelDone) fail(f, 'fuel ' + v.fuel.st + ', the sim ' + tr.fuel);
          if ((v.board.st === 'done') !== (tr.ready !== null)) fail(f, 'boarding ' + v.board.st + ', ready ' + tr.ready);
          // the fuel: empty while its vehicle drives, filling only at the wing
          const by = v.fuel.by;
          see('fuel:' + by);
          if (tr.fuel === 'going' && t < tr.fuelEnd) {
            const at = Turnaround.fuelStart(tr);
            if (t < at && (v.fuel.st !== 'coming' || v.fuel.u !== 0)) fail(f, 'fuel ' + v.fuel.st + ' ' + v.fuel.u.toFixed(2) + ' while its ' + by + ' drives');
            if (t >= at && v.fuel.st !== 'going') fail(f, 'fuel ' + v.fuel.st + ' at the wing');
            if (t >= at && Math.abs(v.fuel.u - (t - at) / (tr.fuelEnd - at)) > EPS) fail(f, 'fuel share ' + v.fuel.u.toFixed(3) + ' not the time at the wing');
            if (by === 'truck') {
              const w = Fleet.truck(tr.truck);
              if (!w || w.f !== f) fail(f, 'its truck ' + tr.truck + ' is elsewhere');
              else if ((w.step === 'to') !== (v.fuel.st === 'coming')) fail(f, 'truck ' + w.step + ' but the bar ' + v.fuel.st);
              if (Math.abs(at - (tr.fuelFrom + FUEL_DRIVE / 2)) > EPS) fail(f, 'the truck at the wing at ' + at);
            }
            if (by === 'mobile' && Math.abs(at - tr.fuelFrom - CHARGE_DRIVE / 2) > EPS) fail(f, 'the charger at the wing at ' + at);
            if (by === 'oil' && t > at) see('oil fuel in progress');
            if (v.fuel.st === 'going' && v.fuel.u > 0 && v.fuel.u < 1) see('fuel mid-way:' + by);
            if (v.fuel.st === 'coming') see('fuel coming:' + by);
          }
          if (tr.fuel === 'asked' || tr.fuel === 'queued' || tr.fuel === 'cqueued') { if (v.fuel.st !== 'wait') fail(f, 'fuel ' + tr.fuel + ' but ' + v.fuel.st); else see('fuel waits:' + v.fuel.why); }
          // the shares never go back
          const p = prev[f.id];
          if (p) for (const k of ['off', 'svc', 'fuel']) if (v[k].u < p[k] - EPS) fail(f, k + ' went back ' + p[k].toFixed(3) + ' → ' + v[k].u.toFixed(3));
          prev[f.id] = { off: v.off.u, svc: v.svc.u, fuel: v.fuel.u };
          // what the step did: boarding begun with everything before it done; ready with its minutes full
          const w0 = was[f.id];
          if (w0 && w0.board === null && tr.board !== null) {
            see('boarding begun');
            for (const k of ['off', 'svc', 'fuel']) if (v[k].st !== 'done') fail(f, 'boarding begun with ' + k + ' ' + v[k].st);
          }
          if (w0 && w0.ready === null && tr.ready !== null) {
            const r = tr.ready; tr.ready = null;
            const b = Turnaround.steps(f, t).board;
            tr.ready = r;
            if (b.timeU < 1 - EPS) fail(f, 'ready with boarding at ' + b.timeU.toFixed(3));
            if (f.missed) see('late passengers left behind');
          }
          if (v.board.st === 'wait') see('boarding waits:' + v.board.why);
          if (v.svc.st === 'wait') see('services wait: ' + v.svc.why);
          if (tr.bags) see('bags by hand or team');
          if (f.inBlock === null) see('overnight');
          if (v.deice) see('de-icing:' + v.deice.st);
          if (Turnaround.slow() > 1) see('slowed (snow or heat)');
          if (AIRCRAFT[f.type].seats >= 220) see('wide-body');
        }
      }
    };
  }
  const report = [];
  let world = null;
  // the missions before the last one asked for are played too (unchecked), for the airport they leave
  const last = ONLY.length ? Math.max(...ONLY.map((o) => MISSIONS.findIndex((x) => x.id === o))) : MISSIONS.length - 1;
  for (const m of MISSIONS.slice(0, last + 1)) {
    if (!STRATEGIES[m.id]) { world = null; continue; }
    const want = !ONLY.length || ONLY.includes(m.id);
    Missions.start(m.id, D, world);
    const r = Strategy.runner(STRATEGIES[m.id]), c = want ? check(m.id) : null;
    let steps = 0;
    for (;;) {
      const status = S.mission.status;
      if (status === 'stageDone') { Missions.next(); continue; }
      if (status !== 'running') break;
      Strategy.act(r);
      if (S.mission.status !== 'running') continue;
      const was = c ? c.before() : null;
      Sim.step();
      if (c) c.after(was);
      if (++steps > 2e6) throw new Error(m.id + ': does not end');
    }
    world = S.mission.status === 'done' ? Missions.world() : null;
    if (c) report.push({ id: m.id, seen: c.seen, fails: c.fails });
  }
  for (const r of report) {
    const keys = Object.keys(r.seen).sort();
    console.log(r.id.padEnd(5) + (r.fails.length ? ' FAIL ' : ' ok   ') + keys.map((k) => k + ' ' + r.seen[k]).join(' · '));
    for (const x of r.fails) console.log('        ' + x);
  }
  return failCount;
})()`, ctx);
console.log(fails ? fails + ' failures' : 'all the turnarounds agree with the sim');
process.exit(fails ? 1 : 0);
