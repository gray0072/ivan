#!/usr/bin/env node
'use strict';

// Arlanda Rising — the Free Play bot, v0 (spec/freeplay.md "The bot", step 1 of its plan: the time core). Loads the game's
// logic in Node (no DOM, tools/sim-files.js) and plays the non-stop Free Play (sim/free.js) for N played months from an
// era preset (FREE_ERAS) with its routes as they are — no director yet (step 4): it does every tray task once it has
// waited --react game minutes (or leaves the tray to the duty manager with --notray) and answers nothing. It prints, per
// played month, its date, the day's flights (arrivals, departures, on time, lost), the tasks done by hand / by the duty
// manager / by the teams, the real seconds at ▶ the month takes by pace (attention, cruise, idle day, night) worked out
// from the same function the browser runs at (FreePace.stepSeconds), the milliseconds of computing of the day and of the
// night, and the cash; then the totals. It fails (exit 1) when:
//   - a game played again from the same start ends differently (determinism);
//   - a game saved and resumed in the middle of a played day, and in the middle of a night, ends differently;
//   - a played day takes more than FREE_DAY_MS_MAX milliseconds of computing;
//   - a month never reaches its dawn (the loop is stuck).
//
// Usage: node arlanda-rising/tools/freeplay-bot.js [--era 1963] [--months 24] [--difficulty medium] [--react 2] [--notray]
//        [--auto normal|gentle|off] [--quiet]

const vm = require('vm');
const ctx = require('./sim-files').context();

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const cfg = { era: opt('era', '1963'), months: +opt('months', 24), difficulty: opt('difficulty', 'medium'), react: +opt('react', 2),
  tray: !args.includes('--notray'), auto: opt('auto', 'normal'), quiet: args.includes('--quiet') };

const out = vm.runInContext(`(() => {
  const CFG = ${JSON.stringify(cfg)};
  const DAY_MS_MAX = 3000;           // FREE_DAY_MS_MAX: ms of computing a played day may take in Node
  // one game; cut: { month, phase: 'day' | 'night', at: steps into it } — saved there, thrown away, resumed from the save
  function play(cut) {
    GameEvents.mute && GameEvents.mute(true);
    Free.start(CFG.era, CFG.difficulty, { auto: CFG.auto });
    const months = [];
    let cur = null, cuts = 0, guard = 0;
    const open = () => { cur = { month: S.free.month, date: Calendar.date(S.day), sec: { attention: 0, cruise: 0, idle: 0, night: 0 }, why: {}, msDay: 0, msNight: 0, steps: 0 }; };
    // the first played day begins at the first dawn
    while (!S.ops) { Sim.step(); if (++guard > 400) throw new Error('the first dawn never comes'); }
    open();
    let phaseSteps = 0, wasOps = true;
    while (S.free.month <= CFG.months) {
      // the player: the tray's tasks once they have waited CFG.react game minutes
      if (CFG.tray && S.ops) for (const t of S.ops.tasks.slice()) if (S.clock - t.t0 >= CFG.react) Tasks.doTask(t.id);
      const mode = FreePace.mode();
      cur.sec[mode.pace] += FreePace.stepSeconds(mode);
      cur.why[mode.why] = (cur.why[mode.why] || 0) + 1;
      const t0 = Date.now(), ops = !!S.ops, month = S.free.month;
      Sim.step();
      const ms = Date.now() - t0;
      if (ops) cur.msDay += ms; else cur.msNight += ms;
      cur.steps++;
      phaseSteps = (!!S.ops === wasOps) ? phaseSteps + 1 : 0;
      wasOps = !!S.ops;
      if (ops && !S.ops) cur.day = S.free.last;
      if (S.free.month !== month) { cur.money = Math.round(S.money); cur.loans = Math.round(S.loans); months.push(cur); open(); }
      if (cur.steps > 20000) throw new Error('month ' + S.free.month + ' never reaches its dawn');
      if (cut && cut.month === S.free.month && cut.phase === (S.ops ? 'day' : 'night') && cut.at === phaseSteps) {
        const snap = JSON.stringify(Missions.save());
        S = null; Missions.checkpoint = null; Missions.startWorld = null;
        Missions.resume(JSON.parse(snap));
        cuts++;
      }
    }
    return { months, cuts, state: JSON.stringify(S) };
  }
  const a = play(null), b = play(null);
  const day = play({ month: 3, phase: 'day', at: 2111 }), night = play({ month: 5, phase: 'night', at: 9 });
  const problems = [];
  if (a.state !== b.state) problems.push('a game played again from the same start ends differently');
  if (!day.cuts) problems.push('the resume test never cut a played day');
  else if (day.state !== a.state) problems.push('a game resumed in the middle of a played day ends differently');
  if (!night.cuts) problems.push('the resume test never cut a night');
  else if (night.state !== a.state) problems.push('a game resumed in the middle of a night ends differently');
  for (const m of a.months) if (m.msDay > DAY_MS_MAX) problems.push('month ' + m.month + ': the played day took ' + m.msDay + ' ms of computing');
  return JSON.stringify({ months: a.months, problems, era: CFG.era });
})()`, ctx);

const r = JSON.parse(out);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const f1 = (x) => (x < 10 ? x.toFixed(1) : String(Math.round(x)));
const tot = { attention: 0, cruise: 0, idle: 0, night: 0, msDay: 0, msNight: 0, dep: 0, tasks: 0 };
if (!cfg.quiet) console.log('month  date       arr  dep  on time  lost  tasks hand/duty/team   real s at ▶: attention cruise idle night = month   ms day/night   cash MSEK');
for (const m of r.months) {
  const d = m.day || {}, s = m.sec, all = s.attention + s.cruise + s.idle + s.night;
  for (const k of ['attention', 'cruise', 'idle', 'night']) tot[k] += s[k];
  tot.msDay += m.msDay; tot.msNight += m.msNight; tot.dep += d.dep || 0; tot.tasks += d.tasks || 0;
  if (cfg.quiet) continue;
  console.log(String(m.month).padStart(5) + '  ' + (MON[m.date.m - 1] + ' ' + m.date.y).padEnd(9) + String(d.arr || 0).padStart(5) + String(d.dep || 0).padStart(5) +
    ((d.dep ? Math.round(d.onTime / d.dep * 100) + '%' : '-').padStart(9)) + String(d.lost || 0).padStart(6) +
    ('   ' + (d.tasks || 0) + '/' + (d.duty || 0) + '/' + (d.people || 0)).padEnd(21) +
    '   ' + [s.attention, s.cruise, s.idle, s.night].map((x) => f1(x).padStart(6)).join(' ') + ' = ' + f1(all).padStart(5) +
    ('   ' + m.msDay + '/' + m.msNight).padEnd(15) + '  ' + (m.money / 1e6).toFixed(1).padStart(8));
}
const all = tot.attention + tot.cruise + tot.idle + tot.night, n = r.months.length || 1;
console.log(`${n} played months from ${r.era}: ${(all / 60).toFixed(1)} real min at ▶ (attention ${(tot.attention / 60).toFixed(1)}, cruise ${(tot.cruise / 60).toFixed(1)}, ` +
  `idle ${(tot.idle / 60).toFixed(1)}, night ${(tot.night / 60).toFixed(1)}) · ${f1(all / n)} s a month · ${tot.dep} departures, ${tot.tasks} tasks by hand · ` +
  `${Math.round(tot.msDay / n)} ms a played day, ${Math.round(tot.msNight / n)} ms a night of computing`);
for (const p of r.problems) console.log('   ! ' + p);
if (!r.problems.length) console.log('ok: deterministic, resumed in a day and in a night the same');
process.exit(r.problems.length ? 1 : 0);
