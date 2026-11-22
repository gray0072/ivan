#!/usr/bin/env node
'use strict';

// Arlanda Rising — the balancing checker. Loads the game's logic (no DOM) in Node and plays the campaign with
// the reference strategies (data/strategies/), mission after mission with the airport carried over, at every
// difficulty. For each mission it reports the stars, the money, the meters, on-time share, delays, queues,
// tasks and its minutes at ▶. It fails when:
//   - the reference does not pass a mission, or misses ★★★ on Easy or Medium;
//   - doing nothing (no moves, the tray left to the duty manager, every decision its default) passes;
//   - the previous chapter's exam strategy gets ★★★ (each chapter needs its new ideas);
//   - a Real Arlanda medal is out of the reference's reach on every difficulty;
//   - a mission is longer than MISSION_MINUTES_MAX or a stage longer than STAGE_MINUTES_MAX at ▶;
//   - a mission starts with more check-in desks than the halls have room for, or more remote stands than their row
//     (Airport.cap: the limits the buy menu shows);
//   - a goal about something to add (built, fireCat, chargers, estate, runways, brands — not one marked `keep`) is
//     already met when its mission starts: bought ahead, it would end its stage at once (data/missions `unlocks` keeps
//     such things locked until their mission);
//   - the reference's cash goes below zero in a mission, or it starts one on the owner's loan (at any difficulty);
//   - a reference strategy buys a small build its mission has not opened yet, a small build is in no category of the
//     buy menu (BUY_MENU) or in two, a mission unlocks what is not a small build or what another mission unlocks;
//   - a mission saved and resumed in the middle of each stage (the autosave) ends differently from one
//     played straight through;
//   - the reference plays a dated stage (a stage's `date`, the first stage the mission's `date`) more than
//     SLIP_DAYS_MAX days after its date, at any difficulty: a date only moves the calendar forward, so the plan days of
//     the mission or of the one before that run past it put "26 June" or Christmas on a later day.
// The strategy of the mission before is tried too, as a warning when it already gets ★★★.
//
// --money prints, per mission and difficulty, the owner's budget, the cash, the debt and the loan room at its start
// and end, and its lowest cash (the budgets table of docs/missions.md).
//
// Usage: node arlanda-rising/tools/missions-check.js [mission id…] [--verbose] [--money]

const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const ctx = { console, Math, JSON, Object, Array, Number, String, Set, Map, Error, Date, isNaN, isFinite, parseInt, parseFloat };
vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });

const chapterFiles = (dir) => fs.readdirSync(path.join(root, dir)).filter((f) => /^ch\d+\.js$/.test(f))
  .sort((a, b) => parseInt(a.slice(2), 10) - parseInt(b.slice(2), 10)).map((f) => dir + '/' + f);
['constants.js', 'data/aircraft.js', 'data/airlines.js', 'data/buildings.js', 'data/masterplan.js', 'data/domains.js', 'data/people.js',
  'data/terminals.js', 'data/brands.js', 'data/events.js',
  'data/missions/missions.js', ...chapterFiles('data/missions'), 'data/strategies/strategies.js', ...chapterFiles('data/strategies'),
  'core/utils.js', 'core/events.js', 'core/storage.js',
  'sim/state.js', 'sim/calendar.js', 'sim/weather.js', 'sim/finance.js', 'sim/meters.js', 'sim/terminal.js', 'sim/airlines.js', 'sim/people.js', 'sim/systems.js', 'sim/airport.js', 'sim/stands.js',
  'sim/fleet.js', 'sim/schedule.js', 'sim/runways.js', 'sim/passengers.js', 'sim/turnaround.js', 'sim/flights.js', 'sim/tasks.js',
  'sim/construction.js', 'sim/summary.js', 'sim/plan.js', 'sim/ops.js', 'sim/goals.js', 'sim/missions.js', 'sim/actions.js',
  'sim/sim.js', 'sim/strategy.js', 'sim/cheats.js', 'sim/offers.js', 'sim/invest.js', 'sim/events.js', 'sim/green.js', 'sim/stats.js', 'data/challenges.js', 'sim/challenges.js'].forEach(load);

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const moneyTable = args.includes('--money');
const only = args.filter((a) => !a.startsWith('--'));

const out = vm.runInContext(`(() => {
  const ADD_GOALS = ['built', 'fireCat', 'chargers', 'estate', 'runways', 'brands'];
  const SLIP_DAYS_MAX = 3;                   // days a dated stage may be played after its date (an endEarly stage's slack)
  // the buy menu's data: every small build in exactly one category, every kind a mission opens a small build named by
  // that mission only
  const menuOf = {}, setup = [];
  for (const c of BUY_MENU) for (const k of c.items) { if (menuOf[k]) setup.push(k + ' is in two categories of BUY_MENU'); menuOf[k] = c.id; }
  for (const k of Object.keys(BUILDINGS)) if (BUILDINGS[k].small && !menuOf[k]) setup.push(k + ' is in no category of BUY_MENU');
  const opener = {};
  for (const m of MISSIONS) for (const k of m.unlocks || []) {
    if (!BUILDINGS[k] || !BUILDINGS[k].small) setup.push(m.id + ' unlocks ' + k + ', not a small build');
    if (opener[k]) setup.push(k + ' is unlocked by ' + opener[k] + ' and ' + m.id);
    opener[k] = m.id;
  }
  // plays a mission from a world with a strategy; cutAt: [steps…] after which the game is saved, thrown away
  // and resumed from the save (the autosave's test)
  function play(id, d, world, strat, cutAt, def) {
    Missions.start(id, d, world, def);
    // what the mission starts with stays within the limits the player sees (Airport.cap): the desks the halls have
    // room for, the remote stands
    const over = ['desk', 'stand'].filter((k) => Airport.owned(k) > Airport.cap(k).max).map((k) => k + ' ' + Airport.owned(k) + '/' + Airport.cap(k).max);
    // a goal about something to add — a build, the fire category, chargers, rent, runways, brands — is not met before the
    // mission starts (else what was bought ahead would end its stage at once); \`keep: true\` marks a goal to keep what is there
    const st0 = Goals.newStats(), md = Missions.def(), early = [];
    const ahead = (g, where) => { if (ADD_GOALS.indexOf(g.k) >= 0 && !g.keep) { const c = Goals.check(g, st0); if (c.ok) early.push(where + ' ' + g.k + (g.kind ? ' ' + g.kind : '') + '=' + c.value); } };
    md.stages.forEach((s, k) => (s.goal || []).forEach((g) => ahead(g, 'stage ' + (k + 1))));
    (md.goal || []).concat(md.stars || []).forEach((g) => ahead(g, 'mission'));
    // the money at the start: the owner's budget is in it already
    const cash = () => ({ cash: S.money, debt: S.loans, room: Finance.room() });
    const at0 = Object.assign(cash(), { budget: ((md.setup || {}).budget || 0) * diff().money });
    let r = Strategy.runner(strat), steps = 0, stageSteps = 0, cuts = 0;
    // the lowest cash in the mission, and the owner's loan a campaign that came in below zero got at its start
    let low = S.money;
    const ownerLoan = (S.mission.meanwhile && S.mission.meanwhile.ownerLoan) || 0;
    const stageMin = [];
    // the days each dated stage is played after its date
    const slips = [];
    const dated = () => {
      const k = S.mission.stage, date = md.stages[k].date || (k === 0 ? md.date : null);
      const late = date ? S.day - Calendar.parse(date) : 0;
      if (late > SLIP_DAYS_MAX) slips.push('stage ' + (k + 1) + ' dated ' + date + ' played ' + late + ' days late');
    };
    dated();
    for (;;) {
      const status = S.mission.status;
      if (status === 'stageDone') { Missions.next(); stageSteps = 0; dated(); continue; }
      if (status !== 'running') break;
      Strategy.act(r);
      if (S.mission.status !== 'running') continue;
      if (!Sim.playing()) throw new Error(id + ': a decision without a default waits');
      Sim.step();
      steps++; stageSteps++;
      if (S.money < low) low = S.money;
      if (cutAt && cutAt[S.mission.stage] === stageSteps && S.mission.status === 'running') {
        const snap = JSON.stringify({ save: Missions.save(), r });
        S = null; Missions.checkpoint = null; Missions.startWorld = null;
        const o = JSON.parse(snap);
        Missions.resume(o.save);
        r = o.r;
        cuts++;
      }
      if (steps > 2e6) throw new Error(id + ': does not end');
    }
    const m = S.mission, tot = m.total;
    for (const res of m.results) if (res) stageMin.push(+Missions.minutes(res.st).toFixed(1));
    return {
      status: m.status, stars: m.stars, medal: m.medal, cuts, over, early, slips, low, ownerLoan, at0, at1: cash(), state: JSON.stringify(S),
      failedStage: m.status === 'stageFailed' ? m.stage : null,
      failed: m.status === 'stageFailed' ? m.results[m.stage].goals.filter((g) => !g.ok).map((g) => g.goal.k + '=' + g.value) : [],
      judged: m.judged ? m.judged.stars.map((g) => (g.ok ? '✓ ' : '✗ ') + g.goal.k + '=' + g.value) : [],
      stages: m.results.map((res) => res && res.goals.map((g) => (g.ok ? '✓ ' : '✗ ') + g.goal.k + '=' + g.value).join(' ')),
      minutes: +Missions.minutes(tot).toFixed(1), stageMin,
      money: Math.round((S.money - S.loans) / 1e5) / 10, onTime: tot.dep ? Math.round(tot.onTime / tot.dep * 100) : null,
      delay: tot.dep ? +(tot.delaySum / tot.dep).toFixed(1) : null, wait: tot.paxServed ? +(tot.paxWaitSum / tot.paxServed).toFixed(1) : null,
      lost: tot.diverted + tot.cancelled, tasks: tot.tasksPlayer + '/' + tot.tasksDuty, closeCalls: tot.closeCalls,
      meters: Object.keys(S.meters).map((k) => k[0].toUpperCase() + Math.round(S.meters[k])).join(' '),
      world: m.status === 'done' ? Missions.world() : null,
      score: CHALLENGE[id] ? Challenges.score(tot) : null
    };
  }
  const only = ${JSON.stringify(only)};
  const report = [];
  const worlds = {};                         // the reference's airport before each mission, per difficulty
  const exams = {};
  for (const m of MISSIONS) if (m.kind === 'exam') exams[m.chapter] = m.id;
  for (const d of DIFFICULTY_ORDER) {
    let world = null;
    for (const m of MISSIONS) {
      worlds[d + m.id] = world;
      if (!STRATEGIES[m.id]) { world = null; continue; }
      const res = play(m.id, d, world, STRATEGIES[m.id]);
      res.world && (world = res.world);
      worlds['res' + d + m.id] = res;
    }
  }
  for (let i = 0; i < MISSIONS.length; i++) {
    const m = MISSIONS[i];
    if (only.length && !only.includes(m.id)) continue;
    const r = { id: m.id, name: m.name, problems: [], warnings: [], diffs: {} };
    report.push(r);
    if (!STRATEGIES[m.id]) { r.problems.push('no reference strategy'); continue; }
    for (const d of DIFFICULTY_ORDER) {
      const res = worlds['res' + d + m.id];
      delete res.world;
      r.diffs[d] = res;
      if (res.status !== 'done') r.problems.push(d + ': the reference fails' + (res.failedStage !== null ? ' stage ' + (res.failedStage + 1) + ' (' + res.failed.join(', ') + ')' : ''));
      else if (d !== 'hard' && res.stars < 3) r.problems.push(d + ': the reference gets ' + res.stars + ' stars (' + res.judged.join(', ') + ')');
      if (res.over.length) r.problems.push(d + ': starts past a limit (' + res.over.join(', ') + ')');
      if (res.early.length) r.problems.push(d + ': a goal is met at the start (' + res.early.join(', ') + ')');
      if (res.slips.length) r.problems.push(d + ': the calendar slips (' + res.slips.join(', ') + ')');
      // the reference pays its way: its cash never goes below zero, and it never needs the owner's loan to start
      if (res.low < -1) r.problems.push(d + ': the cash of the reference goes below zero (' + (res.low / 1e6).toFixed(1) + ' MSEK)');
      if (res.ownerLoan) r.problems.push(d + ': the reference starts on a loan of the owner (' + (res.ownerLoan / 1e6).toFixed(1) + ' MSEK)');
    }
    // the reference buys nothing its mission has not opened yet (it would be refused)
    for (const mv of STRATEGIES[m.id].moves || []) {
      const at = mv.do === 'buy' && Missions.unlockAt(mv.kind);
      if (at && MISSIONS.indexOf(MISSION[at]) > i) r.problems.push('the reference buys ' + mv.kind + ', opened only in ' + at);
    }
    const md = r.diffs.medium;
    if (md.minutes > MISSION_MINUTES_MAX) r.problems.push('takes ' + md.minutes + ' min at ▶ (max ' + MISSION_MINUTES_MAX + ')');
    md.stageMin.forEach((x, k) => { if (x > STAGE_MINUTES_MAX) r.problems.push('stage ' + (k + 1) + ' takes ' + x + ' min at ▶'); });
    const start = worlds['medium' + m.id];
    // doing nothing must not pass
    const idle = play(m.id, 'medium', start, {});
    r.idle = idle.status === 'done' ? idle.stars : 0;
    if (idle.status === 'done') r.problems.push('doing nothing passes (' + idle.stars + ' stars)');
    r.idleWhy = idle.status === 'done' ? '' : 'stage ' + (idle.failedStage + 1) + ': ' + idle.failed.join(', ');
    // the previous chapter's exam strategy, and the mission before's strategy
    const naive = exams[m.chapter - 1];
    if (naive && m.kind !== 'exam') {
      try { const res = play(m.id, 'medium', start, STRATEGIES[naive]); if (res.stars >= 3) r.problems.push('the strategy of ' + naive + ' already gets ★★★'); } catch (e) { /* it does not fit */ }
    }
    const prev = MISSIONS[i - 1];
    if (prev && prev.chapter === m.chapter && STRATEGIES[prev.id]) {
      try { const res = play(m.id, 'medium', start, STRATEGIES[prev.id]); r.prev = res.stars; if (res.stars >= 3) r.warnings.push('the strategy of ' + prev.id + ' already gets ★★★'); } catch (e) { r.prev = '-'; }
    }
    if (m.real && !DIFFICULTY_ORDER.some((d) => r.diffs[d].medal)) r.problems.push('the Real Arlanda medal is out of reach');
    // the autosave: saved and resumed in the middle of each stage, the same end
    const cut = m.stages.map((s, k) => 7 + ((k * 37 + m.n * 13) % 50));
    const resumed = play(m.id, 'medium', start, STRATEGIES[m.id], cut);
    r.resumes = resumed.cuts;
    if (!resumed.cuts) r.problems.push('the resume test never cut the mission');
    if (resumed.state !== md.state) r.problems.push('a resumed mission ends differently (' + resumed.cuts + ' resumes)');
    for (const d of DIFFICULTY_ORDER) delete r.diffs[d].state;
  }
  // the Challenge Days: each from its own airport, with its reference strategy
  for (const c of CHALLENGES) {
    if (only.length && !only.includes(c.id)) continue;
    const r = { id: c.id, name: c.name, problems: [], warnings: [], diffs: {}, challenge: true };
    report.push(r);
    if (!STRATEGIES[c.id]) { r.problems.push('no reference strategy'); continue; }
    for (const d of DIFFICULTY_ORDER) {
      const res = play(c.id, d, null, STRATEGIES[c.id], null, Challenges.def(c.id));
      r.diffs[d] = res;
      if (res.status !== 'done') r.problems.push(d + ': the reference fails' + (res.failedStage !== null ? ' stage ' + (res.failedStage + 1) + ' (' + res.failed.join(', ') + ')' : ' (score ' + res.score + ')'));
      else if (d !== 'hard' && res.stars < 3) r.problems.push(d + ': the reference gets ' + res.stars + ' stars (score ' + res.score + ')');
      if (res.over.length) r.problems.push(d + ': starts past a limit (' + res.over.join(', ') + ')');
    }
    const idle = play(c.id, 'medium', null, {}, null, Challenges.def(c.id));
    r.idle = idle.status === 'done' ? idle.stars : 0;
    r.idleWhy = 'score ' + idle.score;
    if (idle.stars >= 3) r.problems.push('doing nothing gets ★★★ (' + idle.score + ')');
    const cut = c.stages.map((s, k) => 7 + ((k * 37 + 11) % 50));
    const resumed = play(c.id, 'medium', null, STRATEGIES[c.id], cut, Challenges.def(c.id));
    r.resumes = resumed.cuts;
    if (resumed.state !== r.diffs.medium.state) r.problems.push('a resumed challenge ends differently');
    for (const d of DIFFICULTY_ORDER) { delete r.diffs[d].state; delete r.diffs[d].world; }
  }
  if (setup.length) report.unshift({ id: 'data', name: 'the buy menu', problems: setup, warnings: [], diffs: {} });
  return JSON.stringify(report);
})()`, ctx);

let bad = 0;
for (const r of JSON.parse(out)) {
  const m = r.diffs.medium;
  const stars = ['easy', 'medium', 'hard'].map((d) => (r.diffs[d] ? r.diffs[d].stars : '-')).join('/');
  console.log(`${r.id.padEnd(5)} ${r.name.padEnd(24)} ★ ${stars}` + (r.challenge ? '  score ' + ['easy', 'medium', 'hard'].map((d) => r.diffs[d] ? r.diffs[d].score : '-').join('/') + ' idle ' + r.idleWhy : '') + (m ? `  ${m.minutes} min [${m.stageMin.join(' ')}]  ${m.money} MSEK  on time ${m.onTime === null ? '-' : m.onTime + '%'}` +
    ` delay ${m.delay === null ? '-' : m.delay} wait ${m.wait === null ? '-' : m.wait} lost ${m.lost} tasks ${m.tasks} cc ${m.closeCalls}  ${m.meters}` +
    `  idle ★${r.idle}${r.prev !== undefined ? ' prev ★' + r.prev : ''}  resumed ×${r.resumes}` : ''));
  if (verbose && m) {
    for (const d of ['easy', 'medium', 'hard']) {
      const x = r.diffs[d];
      console.log('      ' + d.padEnd(7) + x.stages.map((s, k) => 'S' + (k + 1) + ' ' + s).join(' | ') + '  stars: ' + x.judged.join(', ') +
        `  [${x.money} MSEK, on time ${x.onTime}%, delay ${x.delay}, wait ${x.wait}, lost ${x.lost}, ${x.meters}]`);
    }
    if (r.idleWhy) console.log('      idle fails ' + r.idleWhy);
  }
  if (moneyTable && m) {
    const M = (x) => (x / 1e6).toFixed(1);
    for (const d of ['easy', 'medium', 'hard']) {
      const x = r.diffs[d], a = x.at0, b = x.at1;
      console.log('      money ' + d.padEnd(7) + 'owner +' + M(a.budget) + ' · start cash ' + M(a.cash) + ' debt ' + M(a.debt) + ' room ' + M(a.room) +
        ' → end cash ' + M(b.cash) + ' debt ' + M(b.debt) + ' room ' + M(b.room) + ' · lowest cash ' + M(x.low) + ' (MSEK)');
    }
  }
  for (const w of r.warnings) console.log('   ? ' + w);
  for (const p of r.problems) { console.log('   ! ' + p); bad++; }
}
process.exit(bad ? 1 : 0);
