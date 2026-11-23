#!/usr/bin/env node
'use strict';

// Arlanda Rising — one mission flight by flight, for balancing: plays the campaign with the reference strategies up to the
// mission (at one difficulty), then the mission itself (or doing nothing with --idle), and prints at the end of each stage
// its flights (planned and real times, stand, waits at check-in / security / the border, delay and the airport's part),
// what happened (failures, random events, flights lost) and the stage's goals; with --counters every quarter hour of an
// ops stage the check-in desks, security lanes and passport booths open, their waits and who runs them (you, the team,
// the system; "held" while the player's own − / + holds); --choices=id=option,… gives the idle run those decisions (to
// see what a choice does alone); --strategy=id plays the mission with another mission's reference strategy. Loads the
// same files as missions-check.js.
// Usage: node arlanda-rising/tools/debug-mission.js <mission id> [easy|medium|hard] [--idle [--choices=id=option,…]]
//        [--strategy=id] [--flights] [--counters]

const vm = require('vm');
const ctx = require('./sim-files').context();
const args = process.argv.slice(2);
const [id, d = 'medium'] = args.filter((a) => !a.startsWith('--'));
vm.runInContext(`(() => {
  const ID = ${JSON.stringify(id)}, D = ${JSON.stringify(d)}, IDLE = ${args.includes('--idle')}, FLIGHTS = ${args.includes('--flights')}, COUNTERS = ${args.includes('--counters')}, STRAT = ${JSON.stringify((args.find((a) => a.startsWith('--strategy=')) || '').slice(11))},
    CHOICES = ${JSON.stringify(Object.fromEntries(((args.find((a) => a.startsWith('--choices=')) || '').slice(10) || '').split(',').filter(Boolean).map((kv) => kv.split('='))))};
  let target = false;
  const end = Missions.endStage.bind(Missions);
  Missions.endStage = function () {
    if (target) {
      const i = S.mission.stage, log0 = S.log.length;
      if (S.ops && FLIGHTS) for (const f of S.ops.flights) {
        const w = (a, b) => (b ? (a / b).toFixed(1) : '-');
        console.log('  ' + f.no.padEnd(8) + f.type.padEnd(5) + ' sta ' + (f.sta === null ? '  -  ' : fmtClock(f.sta)) + ' eta ' + (f.eta === null ? '  -  ' : fmtClock(f.eta)) +
          ' std ' + fmtClock(f.std) + ' off ' + (f.offBlock ? fmtClock(f.offBlock) : '  -  ') + ' ' + f.st.padEnd(9) + ' stand ' + ((Airport.stand(f.stand) || {}).name || '-').padEnd(3) +
          ' waits ' + w(f.waitSum, f.paxServed) + '/' + w(f.secWait, f.secServed) + '/' + w(f.borderWait, f.borderServed) + ' delay ' + Math.round(f.delay) + ' (' + Math.round(f.adelay) + ')' +
          (f.tr ? ' deice ' + (f.tr.deice || '-') : '') + (f.missed ? ' missed ' + f.missed : ''));
      }
      end();
      const res = S.mission.results[i];
      console.log('--- stage ' + (i + 1) + ' ' + res.goals.map((g) => (g.ok ? 'ok ' : 'NO ') + g.goal.k + '=' + g.value).join(' ') + '  money ' + Math.round(S.money / 1e6) +
        ' MSEK  green ' + Green.rating() + ' perDay ' + Green.perDay().toFixed(1) + '  meters ' + Object.keys(S.meters).map((k) => k[0] + Math.round(S.meters[k])).join(' ') + '  tasks ' + res.st.tasksPlayer + '/' + res.st.tasksDuty + '/' + res.st.tasksPeople + '/' + res.st.tasksSys);
      for (const e of S.log.filter((e) => ['randomEvent', 'failure', 'strikeNow', 'diverted', 'cancelled', 'closeCall', 'permitBroken', 'chosen', 'systemLive', 'teamReady'].indexOf(e.type) >= 0 && e.day >= S.day - 200).slice(-14))
        console.log('    ' + e.type + ' ' + fmtClock(e.t) + ' ' + (e.id || e.dom || e.flight || '') + (e.option ? ' → ' + e.option : ''));
    } else end();
  };
  let world = null;
  for (const m of MISSIONS) {
    target = m.id === ID;
    Missions.start(m.id, D, world);
    const r = Strategy.runner(target && IDLE ? { choices: CHOICES } : STRATEGIES[target && STRAT ? STRAT : m.id]);
    for (let n = 0; n < 3e6; n++) {
      const st = S.mission.status;
      if (st === 'stageDone') { Missions.next(); continue; }
      if (st !== 'running') break;
      Strategy.act(r);
      if (S.mission.status !== 'running') continue;
      Sim.step();
      // --counters: every quarter hour of an ops stage the desks, lanes and booths open, the waits, who runs them
      if (target && COUNTERS && S.ops && Math.abs(S.clock / 15 - Math.round(S.clock / 15)) < 1e-6) {
        const by = (k) => (Passengers.runBy(k) || 'you') + (Passengers.held(k) ? ' (held)' : '');
        console.log('    ' + fmtClock(S.clock) + ' desks ' + S.ops.desksOpen + '/' + S.airport.desks + ' wait ' + Passengers.wait().toFixed(1) + ' ' + by('desks') +
          (Terminal.lanes() ? ' · lanes ' + Terminal.lanes() + '/' + Terminal.lanesUp() + ' wait ' + Passengers.secWait().toFixed(1) + ' ' + by('lanes') : '') +
          (Terminal.borderOn() ? ' · booths ' + Terminal.booths() + '/' + S.airport.booths + ' wait ' + Math.min(99, Passengers.borderWait()).toFixed(1) + ' ' + by('booths') : '') +
          ' · tray ' + S.ops.tasks.length);
      }
    }
    if (target) { console.log('mission ' + S.mission.status + ' stars ' + S.mission.stars + ' ' + JSON.stringify(S.mission.judged && S.mission.judged.stars.map((g) => g.goal.k + '=' + g.value))); break; }
    world = Missions.world();
  }
})()`, ctx);
