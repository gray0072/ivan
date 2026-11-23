#!/usr/bin/env node
'use strict';

// Arlanda Rising — the Free Play bot, v1 (spec/freeplay.md "The bot"). Loads the game's logic in Node (no DOM,
// tools/sim-files.js) and plays Free Play (sim/free.js) from the forest of 1958 for N played months with a plain builder:
// each step it starts every stage the next milestone of the history needs (and the optional ones it names) as soon as a
// crew is free, borrowing what the cash lacks within the loan room; it does every tray task once it has waited --react game
// minutes (or leaves the tray to the duty manager with --notray), buys nothing small, hires nobody and answers nothing.
// It prints, per played month, the history's year and the milestone it waits for (and what it still needs built), the
// day's flights (arrivals, departures, on time, lost), the tasks by hand / duty manager / teams, the real seconds at ▶
// the month takes by pace (attention, cruise, idle day, night — FreePace.stepSeconds, the browser's own function), the
// milliseconds of computing of the day and the night, the cash and the loans; then the totals and the chapter reached.
// It fails (exit 1) when:
//   - a game played again from the same start ends differently (determinism);
//   - a game saved and resumed in the middle of a played day, and in the middle of a night, ends differently;
//   - a played day takes more than DAY_MS_MAX milliseconds of computing;
//   - a month never reaches its dawn (the loop is stuck);
//   - the builder has not reached --chapter (default 3) by the last month.
//
// Usage: node arlanda-rising/tools/freeplay-bot.js [--months 48] [--difficulty medium] [--react 2] [--notray]
//        [--auto normal|gentle|off] [--chapter 3] [--quiet]

const vm = require('vm');
const ctx = require('./sim-files').context();

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const cfg = { months: +opt('months', 48), difficulty: opt('difficulty', 'medium'), react: +opt('react', 2), chapter: +opt('chapter', 3),
  tray: !args.includes('--notray'), auto: opt('auto', 'normal'), quiet: args.includes('--quiet') };

const out = vm.runInContext(`(() => {
  const CFG = ${JSON.stringify(cfg)};
  const DAY_MS_MAX = 3000;           // ms of computing a played day may take in Node
  // the builder: every stage the next milestone needs, as soon as a crew is free, borrowing what the cash lacks
  function build() {
    const m = Free.pending();
    if (!m) return;
    for (const r of Free.missing(m)) {
      const [pid, sid] = r.split('.'), def = PROJECTS[pid], p = Construction.state(pid);
      if (!p) continue;
      for (const s of sid ? [sid] : Object.keys(def.stages).filter((k) => !def.stages[k].optional)) {
        if (Construction.cannot(pid, s)) continue;
        const price = def.stages[s].price * (p.finance === 'grant' ? 1 - GRANT_SHARE : 1);
        if (S.money < price) Finance.borrow(price - S.money + 1e6);
        if (S.money < price * 0.5) return;
        Actions.start(pid, s, 'normal');
      }
    }
  }
  // one game; cut: { month, phase: 'day' | 'night', at: steps into it } — saved there, thrown away, resumed from the save
  function play(cut) {
    GameEvents.mute && GameEvents.mute(true);
    Free.start(CFG.difficulty, { auto: CFG.auto, seed: 'bot' });
    const months = [];
    let cur = null, cuts = 0, guard = 0;
    const open = () => { cur = { month: S.free.month, date: Calendar.date(S.day), sec: { attention: 0, cruise: 0, idle: 0, night: 0 }, msDay: 0, msNight: 0, steps: 0 }; };
    while (!S.ops) { build(); Sim.step(); if (++guard > 400) throw new Error('the first dawn never comes'); }
    open();
    let phaseSteps = 0, wasOps = true;
    while (S.free.month <= CFG.months) {
      if (cur.steps % 60 === 0 || !S.ops) build();
      if (CFG.tray && S.ops) for (const t of S.ops.tasks.slice()) if (S.clock - t.t0 >= CFG.react) Tasks.doTask(t.id);
      const mode = FreePace.mode();
      cur.sec[mode.pace] += FreePace.stepSeconds(mode);
      const t0 = Date.now(), ops = !!S.ops, month = S.free.month;
      Sim.step();
      const ms = Date.now() - t0;
      if (ops) cur.msDay += ms; else cur.msNight += ms;
      cur.steps++;
      phaseSteps = (!!S.ops === wasOps) ? phaseSteps + 1 : 0;
      wasOps = !!S.ops;
      if (ops && !S.ops) cur.day = S.free.last;
      if (S.free.month !== month) {
        const m = Free.pending();
        Object.assign(cur, { money: Math.round(S.money), loans: Math.round(S.loans), year: Math.floor(S.free.year * 10) / 10,
          next: m ? m.id : '-', missing: m ? Free.missing(m).join(',') : '', chapter: m ? m.chapter : CHAPTERS.length + 1 });
        months.push(cur); open();
      }
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
  const lastDay = a.months.reduce((k, m, i) => (m.day && m.day.dep ? i : k), 0) + 1;
  const day = play({ month: Math.max(2, Math.min(CFG.months - 1, lastDay)), phase: 'day', at: 1500 }), night = play({ month: Math.max(2, CFG.months - 2), phase: 'night', at: 9 });
  const problems = [];
  if (a.state !== b.state) problems.push('a game played again from the same start ends differently');
  if (!day.cuts) problems.push('the resume test never cut a played day');
  else if (day.state !== a.state) problems.push('a game resumed in the middle of a played day ends differently');
  if (!night.cuts) problems.push('the resume test never cut a night');
  else if (night.state !== a.state) problems.push('a game resumed in the middle of a night ends differently');
  for (const m of a.months) if (m.msDay > DAY_MS_MAX) problems.push('month ' + m.month + ': the played day took ' + m.msDay + ' ms of computing');
  const reached = a.months.length ? a.months[a.months.length - 1].chapter : 1;
  if (reached < CFG.chapter) problems.push('the builder is in chapter ' + reached + ' after ' + CFG.months + ' months (wanted ' + CFG.chapter + ')');
  return JSON.stringify({ months: a.months, problems, reached });
})()`, ctx);

const r = JSON.parse(out);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const f1 = (x) => (x < 10 ? x.toFixed(1) : String(Math.round(x)));
const tot = { attention: 0, cruise: 0, idle: 0, night: 0, msDay: 0, msNight: 0, dep: 0, tasks: 0 };
if (!cfg.quiet) console.log('month  month    year   waits for          arr  dep  on time lost  hand/duty/team   real s at ▶: attention cruise idle night = month   ms day/night  cash/loans MSEK');
for (const m of r.months) {
  const d = m.day || {}, s = m.sec, all = s.attention + s.cruise + s.idle + s.night;
  for (const k of ['attention', 'cruise', 'idle', 'night']) tot[k] += s[k];
  tot.msDay += m.msDay; tot.msNight += m.msNight; tot.dep += d.dep || 0; tot.tasks += d.tasks || 0;
  if (cfg.quiet) continue;
  console.log(String(m.month).padStart(5) + '  ' + MON[m.date.m - 1].padEnd(7) + String(m.year).padStart(6) + '   ' + (m.next + (m.missing ? ' ' + m.missing : '')).slice(0, 18).padEnd(18) +
    String(d.arr || 0).padStart(4) + String(d.dep || 0).padStart(5) + ((d.dep ? Math.round(d.onTime / d.dep * 100) + '%' : '-').padStart(9)) + String(d.lost || 0).padStart(5) +
    ('  ' + (d.tasks || 0) + '/' + (d.duty || 0) + '/' + (d.people || 0)).padEnd(17) +
    '   ' + [s.attention, s.cruise, s.idle, s.night].map((x) => f1(x).padStart(6)).join(' ') + ' = ' + f1(all).padStart(5) +
    ('   ' + m.msDay + '/' + m.msNight).padEnd(14) + '  ' + (m.money / 1e6).toFixed(1) + '/' + (m.loans / 1e6).toFixed(0));
}
const all = tot.attention + tot.cruise + tot.idle + tot.night, n = r.months.length || 1;
console.log(`${n} played months from the forest: chapter ${r.reached} reached · ${(all / 60).toFixed(1)} real min at ▶ (attention ${(tot.attention / 60).toFixed(1)}, cruise ${(tot.cruise / 60).toFixed(1)}, ` +
  `idle ${(tot.idle / 60).toFixed(1)}, night ${(tot.night / 60).toFixed(1)}) · ${f1(all / n)} s a month · ${tot.dep} departures, ${tot.tasks} tasks by hand · ` +
  `${Math.round(tot.msDay / n)} ms a played day, ${Math.round(tot.msNight / n)} ms a night of computing`);
for (const p of r.problems) console.log('   ! ' + p);
if (!r.problems.length) console.log('ok: deterministic, resumed in a day and in a night the same');
process.exit(r.problems.length ? 1 : 0);
