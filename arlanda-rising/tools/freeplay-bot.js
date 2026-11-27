#!/usr/bin/env node
'use strict';

// Arlanda Rising — the Free Play bot (spec/freeplay.md "The bot"; the balance it measures: docs/freeplay-balance.md).
// Loads the game's logic in Node (no DOM, tools/sim-files.js) and the director's policy (tools/freeplay-policy.js:
// profiles reference / hands / notray / idle, the human hands model) and plays Free Play (sim/free.js) — from the forest
// of 1958 to the end of the history, or N played months, or from a milestone of the history (the owner having built all
// before it and the airport equipped like the campaign's of the time). Real time is counted at ▶ from the pace
// (FreePace.stepSeconds, the browser's own function), the hands do tasks at a person's speed in that real time.
//
// Modes:
//   (default)        one game from the forest; per played month a line (with --months-table), per era (chapter) a line:
//                    (the chapter of the milestone reached last) played months, real minutes at ▶ (attention / cruise / idle / night), hand tasks a real minute of
//                    attention (mean and the busiest minute), tasks missed (to the duty manager), departures a played day,
//                    on time, the cash at its lowest and at the era's end, the loans, months in debt; then the totals and
//                    the verdict against the targets (BANDS) when the game reached the end of the history
//   --from <id>      start at the history's milestone <id> (e.g. 3-1): the owner builds everything before it (Free.cheatNext),
//                    the airport gets the vehicles, desks, teams and systems of the time, then N months (--months, 6) are played
//   --stages         --from each chapter's first milestone in turn, --months (4) each: one line per stage of the game, fast
//   --check          also the determinism and resume tests: the game played again, saved and resumed in the middle of a
//                    played day and of a night, must end the same (slow: four games)
//   --report         write docs/freeplay-balance.md (the reference, Medium, from the forest) — regenerate after tuning
//
// Fails (exit 1) when: --check finds a difference; a played day takes more than DAY_MS_MAX ms of computing; a month never
// reaches its dawn; and for a whole game of the reference profile: the total real time is outside TOTAL_MIN (minutes at
// ▶), an era is outside its band (BANDS ± BAND_TOL), the busiest real minute passes BUSY_MAX hand tasks, the hand era's
// mean is under HAND_MIN tasks a minute, the owner would have replaced the director (Finance.replaced).
//
// Usage: node arlanda-rising/tools/freeplay-bot.js [--profile reference|hands|notray|idle] [--difficulty medium]
//        [--months N] [--from 3-1 | --stages] [--hands 5] [--react 3] [--auto normal|gentle|off] [--check] [--report]
//        [--months-table [--why]] [--money] [--quiet] [--set "NAME=value;NAME=value"]

const fs = require('fs'), path = require('path'), vm = require('vm');
const { root, context } = require('./sim-files');

// the targets (spec/freeplay.md "How long it lasts"): real minutes at ▶ of each era (chapter) for the reference at Medium
const BANDS = [30, 25, 20, 22, 25, 20, 15, 20];
const BAND_TOL = 0.4;                 // ± share of an era's band accepted
const TOTAL_MIN = [150, 210];         // real minutes at ▶ of the whole history
const BUSY_MAX = 8;                   // hand tasks in the busiest real minute, at most
const HAND_MIN = 2;                   // hand tasks a real minute of attention in the hand era (chapter 1), at least
const DAY_MS_MAX = 3000;              // ms of computing a played day may take in Node

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);
const cfg = { profile: opt('profile', 'reference'), difficulty: opt('difficulty', 'medium'), months: opt('months', null), from: opt('from', null),
  hands: +opt('hands', 5), react: +opt('react', 3), auto: opt('auto', 'normal') };

// --set NAME=value[;NAME=value…]: constants replaced for a trial (tools/sim-files.js), e.g. --set "FREE_BUILD_X=0.5;FREE_CHAPTER_MONTHS=[8,8,6,7,8,6,5,6]"
const SET = {};
for (const kv of (opt('set', '') || '').split(';').filter(Boolean)) { const i = kv.indexOf('='); SET[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); }

function load() {
  const ctx = context(SET);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'freeplay-policy.js'), 'utf8'), ctx, { filename: 'tools/freeplay-policy.js' });
  vm.runInContext(GAME, ctx, { filename: 'freeplay-bot (game)' });
  return ctx;
}

// the game's side, run inside the vm context: play(cfg, cut) → { months, eras, problems, state }
const GAME = `
var Bot = {
  // the airport equipped like the campaign's of the time: the reached milestones' items, desks, teams, systems, IT people
  equip() { const t = FreeBot.target(); Missions.setup({ items: t.items, desks: t.desks, domains: t.domains, it: t.it }); },
  // the history moved on by the owner to milestone \`id\` (reached)
  jump(id) {
    const i = MISSIONS.indexOf(MISSION[id]);
    if (i < 0) throw new Error('no milestone ' + id);
    while (S.free.next <= i) if (!Free.cheatNext()) break;
    this.equip();
  },
  // why the milestone's missing stages are not being built: each stage not done with Construction.cannot (or 'building')
  why(m) {
    const out = [];
    for (const r of Free.missing(m)) {
      const [pid, sid] = r.split('.'), def = PROJECTS[pid], p = Construction.state(pid);
      if (!p) { out.push(pid + ':closed'); continue; }
      for (const s of sid ? [sid] : Object.keys(def.stages).filter((k) => !def.stages[k].optional)) {
        if (Construction.stageDone(pid, s)) continue;
        const st = p.stages[s];
        out.push(pid + '.' + s + ':' + (st && st.on ? 'building ' + Math.round(st.p * 100) + '%' : Construction.cannot(pid, s) || 'free'));
      }
    }
    return out.join(' ');
  },
  play(c, cut) {
    GameEvents.mute && GameEvents.mute(true);
    Free.start(c.difficulty, { auto: c.auto, seed: 'bot' });
    FreeBot.init({ profile: c.profile, hands: c.hands, react: c.react });
    if (c.from) this.jump(c.from);
    const start = S.free.month, limit = c.months ? +c.months : 400;
    const months = [];
    let realT = 0, cur = null, cuts = 0, phaseSteps = 0, wasOps = !!S.ops;
    const open = () => {
      // the era the airport is in: the chapter of the milestone reached last
      cur = { month: S.free.month, date: Calendar.date(S.day), chapter: MISSIONS[Math.max(0, S.free.next - 1)].chapter,
        sec: { attention: 0, cruise: 0, idle: 0, night: 0 }, msDay: 0, msNight: 0, steps: 0, cashMin: S.money };
    };
    open();
    while (S.free.month - start < limit) {
      FreeBot.beforeStep(realT);
      const mode = FreePace.mode(), sec = FreePace.stepSeconds(mode);
      cur.sec[mode.pace] += sec;
      realT += sec;
      const t0 = Date.now(), ops = !!S.ops, month = S.free.month;
      Sim.step();
      const ms = Date.now() - t0;
      if (ops) cur.msDay += ms; else cur.msNight += ms;
      cur.steps++;
      cur.cashMin = Math.min(cur.cashMin, S.money);
      phaseSteps = (!!S.ops === wasOps) ? phaseSteps + 1 : 0;
      wasOps = !!S.ops;
      if (ops && !S.ops) { cur.day = S.free.last; cur.hands = FreeBot.dayStats(); FreeBot.newDay(); }
      if (S.free.month !== month) {
        const m = Free.pending();
        Object.assign(cur, { money: Math.round(S.money), loans: Math.round(S.loans), debt: S.debtMonths, replaced: Finance.replaced(),
          year: Math.floor(S.free.year * 10) / 10, next: m ? m.id : '-', missing: m ? Free.missing(m).join(',') : '', why: m ? this.why(m) : '',
          teams: Object.keys(S.domains).filter((d) => S.domains[d] === 1).length, systems: Object.keys(S.domains).filter((d) => S.domains[d] >= 2).length,
          hand: Object.keys(S.domains).filter((d) => !S.domains[d]).length });
        const fh = S.finance.history[S.finance.history.length - 1];
        cur.fin = fh && fh !== this.lastFin ? { in: fh.in, out: fh.out } : null;
        this.lastFin = fh;
        months.push(cur);
        open();
        if (!Free.pending() && !c.months) break;
      }
      if (cur.steps > 20000) throw new Error('month ' + S.free.month + ' never reaches its dawn');
      if (cut && cut.month === S.free.month && cut.phase === (S.ops ? 'day' : 'night') && cut.at === phaseSteps) {
        const snap = JSON.stringify(Missions.save());
        S = null; Missions.checkpoint = null; Missions.startWorld = null;
        Missions.resume(JSON.parse(snap));
        cuts++;
      }
    }
    return { months, cuts, end: !Free.pending(), state: JSON.stringify(S) };
  }
};`;

function run(c, cut) { const ctx = load(); ctx.__c = c; ctx.__cut = cut || null; return JSON.parse(vm.runInContext('JSON.stringify(Bot.play(__c, __cut))', ctx)); }

// ---------- the numbers ----------
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const f1 = (x) => (Math.abs(x) < 10 ? x.toFixed(1) : String(Math.round(x)));
const mio = (x) => (x / 1e6).toFixed(0);

// one group of months (an era, a stage, the whole game): its sums
function sum(ms) {
  const g = { months: ms.length, sec: { attention: 0, cruise: 0, idle: 0, night: 0 }, tasks: 0, came: 0, missed: 0, dep: 0, onTime: 0, flyDays: 0,
    busy: 0, cashMin: Infinity, cashEnd: 0, loans: 0, debt: 0, replaced: false, msDay: 0, year0: null, year1: null, teams: 0, systems: 0, hand: 0 };
  for (const m of ms) {
    for (const k of Object.keys(g.sec)) g.sec[k] += m.sec[k];
    const d = m.day || {}, h = m.hands || { tasks: 0, came: {}, minutes: {} };
    g.tasks += h.tasks;
    g.came += Object.values(h.came || {}).reduce((a, b) => a + b, 0);
    g.missed += d.duty || 0;
    if (d.dep) { g.dep += d.dep; g.onTime += d.onTime; g.flyDays++; }
    for (const v of Object.values(h.minutes || {})) g.busy = Math.max(g.busy, v);
    g.cashMin = Math.min(g.cashMin, m.cashMin);
    g.cashEnd = m.money; g.loans = Math.max(g.loans, m.loans); g.debt = Math.max(g.debt, m.debt); g.replaced = g.replaced || m.replaced;
    g.msDay = Math.max(g.msDay, m.msDay);
    if (g.year0 === null) g.year0 = m.year; g.year1 = m.year;
    g.teams = m.teams; g.systems = m.systems; g.hand = m.hand;
  }
  g.real = (g.sec.attention + g.sec.cruise + g.sec.idle + g.sec.night) / 60;
  g.rate = g.sec.attention > 0 ? g.tasks / (g.sec.attention / 60) : 0;
  return g;
}
const HEAD = 'stage        months  years          real min at ▶ (attn/cruise/idle/night)  min/month  tasks/min busiest  came missed  dep/day on time  teams/sys/hand  cash low/end, loans MSEK  debt';
function line(label, g) {
  return label.padEnd(13) + String(g.months).padStart(6) + '  ' + (g.year0 + '–' + g.year1 + ' ').padEnd(15) +
    (f1(g.real) + ' (' + [g.sec.attention, g.sec.cruise, g.sec.idle, g.sec.night].map((s) => f1(s / 60)).join('/') + ')').padEnd(39) +
    f1(g.real / Math.max(1, g.months)).padStart(9) + '  ' + f1(g.rate).padStart(9) + String(g.busy).padStart(8) +
    String(g.came).padStart(6) + String(g.missed).padStart(7) + String(Math.round(g.dep / Math.max(1, g.flyDays))).padStart(9) +
    ((g.dep ? Math.round(g.onTime / g.dep * 100) + '%' : '-').padStart(8)) + ('  ' + g.teams + '/' + g.systems + '/' + g.hand).padEnd(16) +
    ('  ' + mio(g.cashMin) + '/' + mio(g.cashEnd) + ', ' + mio(g.loans)).padEnd(26) + String(g.debt).padStart(5) + (g.replaced ? ' REPLACED' : '');
}
function monthLine(m) {
  const d = m.day || {}, s = m.sec, all = s.attention + s.cruise + s.idle + s.night, h = m.hands || { tasks: 0 };
  return String(m.month).padStart(5) + '  ' + MON[m.date.m - 1] + ' ' + String(m.year).padStart(6) + '  ' + (m.next + (m.missing ? ' ' + m.missing : '')).slice(0, 22).padEnd(22) +
    String(d.dep || 0).padStart(4) + ((d.dep ? Math.round(d.onTime / d.dep * 100) + '%' : '-').padStart(6)) + ('  ' + h.tasks + '/' + (d.duty || 0) + '/' + (d.people || 0)).padEnd(14) +
    [s.attention, s.cruise, s.idle, s.night].map((x) => f1(x).padStart(5)).join(' ') + ' = ' + f1(all).padStart(4) + ' s' +
    ('   ' + m.msDay + ' ms').padEnd(11) + '  ' + mio(m.money) + '/' + mio(m.loans) + ' MSEK' + ('  ' + m.teams + '/' + m.systems + '/' + m.hand) + (WHY ? '   came ' + Object.entries((m.hands || {}).came || {}).map(([k, v]) => k + ' ' + v).join(', ') + (m.why ? '   ' + m.why : '') : '');
}
const WHY = flag('why');

// the eras of a game, by the chapter of the milestone reached last when each month began
function eras(months) {
  const out = [];
  for (const m of months) { const c = Math.min(m.chapter, BANDS.length); (out[c - 1] = out[c - 1] || []).push(m); }
  return out;
}

function verdict(r, g, es) {
  const problems = [];
  for (const m of r.months) if (m.msDay > DAY_MS_MAX) problems.push('month ' + m.month + ': the played day took ' + m.msDay + ' ms of computing');
  if (cfg.profile !== 'reference' || cfg.from || cfg.months) return problems;
  if (!r.end) problems.push('the history did not reach its end');
  if (g.real < TOTAL_MIN[0] || g.real > TOTAL_MIN[1]) problems.push('the whole game takes ' + f1(g.real) + ' real min at ▶ (wanted ' + TOTAL_MIN.join('–') + ')');
  es.forEach((e, i) => {
    if (!e) return;
    const x = sum(e), lo = BANDS[i] * (1 - BAND_TOL), hi = BANDS[i] * (1 + BAND_TOL);
    if (x.real < lo || x.real > hi) problems.push('era ' + (i + 1) + ' takes ' + f1(x.real) + ' min (wanted ' + f1(lo) + '–' + f1(hi) + ')');
  });
  if (g.busy > BUSY_MAX) problems.push('the busiest real minute had ' + g.busy + ' hand tasks (at most ' + BUSY_MAX + ')');
  if (es[0] && sum(es[0]).rate < HAND_MIN) problems.push('the hand era has ' + f1(sum(es[0]).rate) + ' hand tasks a minute of attention (at least ' + HAND_MIN + ')');
  if (g.replaced) problems.push('the owner would have replaced the director (months in debt)');
  return problems;
}

function report(r, g, es) {
  const L = [];
  L.push('# Arlanda Rising — Free Play balance', '');
  L.push('Generated by `node arlanda-rising/tools/freeplay-bot.js --report` (the reference director, ' + cfg.difficulty + ', hands ' + cfg.hands + ' tasks a real minute after ' + cfg.react + ' s, Auto pace ' + cfg.auto + '). Do not edit by hand; the targets are in spec/freeplay.md "How long it lasts".', '');
  L.push('| Era | Played months | Years | Real min at ▶ | Target | Attention / cruise / idle / night | Min a month | Hand tasks a min of attention | Busiest min | Dep. a day | On time | Teams / systems / by hand | Cash low / end, loans (MSEK) |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  es.forEach((e, i) => {
    if (!e) return;
    const x = sum(e);
    L.push(`| ${i + 1} ${CH[i] || ''} | ${x.months} | ${x.year0}–${x.year1} | ${f1(x.real)} | ${BANDS[i]} | ${[x.sec.attention, x.sec.cruise, x.sec.idle, x.sec.night].map((s) => f1(s / 60)).join(' / ')} | ${f1(x.real / x.months)} | ${f1(x.rate)} | ${x.busy} | ${Math.round(x.dep / Math.max(1, x.flyDays))} | ${x.dep ? Math.round(x.onTime / x.dep * 100) + ' %' : '–'} | ${x.teams} / ${x.systems} / ${x.hand} | ${mio(x.cashMin)} / ${mio(x.cashEnd)}, ${mio(x.loans)} |`);
  });
  L.push(`| **All** | ${g.months} | ${g.year0}–${g.year1} | **${f1(g.real)}** | ${TOTAL_MIN.join('–')} | ${[g.sec.attention, g.sec.cruise, g.sec.idle, g.sec.night].map((s) => f1(s / 60)).join(' / ')} | ${f1(g.real / g.months)} | ${f1(g.rate)} | ${g.busy} | ${Math.round(g.dep / Math.max(1, g.flyDays))} | ${g.dep ? Math.round(g.onTime / g.dep * 100) + ' %' : '–'} | | ${mio(g.cashMin)} / ${mio(g.cashEnd)}, ${mio(g.loans)} |`, '');
  const p = verdict(r, g, es);
  L.push(p.length ? 'Outside the targets:' : 'Every era within its band, the whole game within ' + TOTAL_MIN.join('–') + ' min.', '');
  for (const x of p) L.push('- ' + x);
  L.push('', '## Month by month', '', '```', 'month  date         waits for              dep  on t  hand/duty/team  attn cruise idle night = month      ms day   cash/loans  teams/sys/hand');
  for (const m of r.months) L.push(monthLine(m));
  L.push('```', '');
  fs.writeFileSync(path.join(root, 'docs', 'freeplay-balance.md'), L.join('\n'));
}
let CH = [];

// --money: the books by era, MSEK a played month by line
function money(months) {
  const es = eras(months);
  es.forEach((e, i) => {
    if (!e) return;
    const t = {};
    for (const m of e) if (m.fin) {
      for (const [k, v] of Object.entries(m.fin.in)) t['+' + k] = (t['+' + k] || 0) + v;
      for (const [k, v] of Object.entries(m.fin.out)) t['-' + k] = (t['-' + k] || 0) - v;
    }
    const n = e.length;
    console.log('era ' + (i + 1) + ' MSEK a month: ' + Object.entries(t).filter(([k]) => k !== '+loans' && k !== '-loans').sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).map(([k, v]) => k + ' ' + (v / n / 1e6).toFixed(1)).join(', ') +
      '  | loans ' + (((t['+loans'] || 0) + (t['-loans'] || 0)) / 1e6).toFixed(0));
  });
}

// ---------- main ----------
function main() {
  const t0 = Date.now();
  const ctx0 = load();
  CH = JSON.parse(vm.runInContext('JSON.stringify(CHAPTERS.map((c) => c.name || c.title || ""))', ctx0));
  if (flag('stages')) {
    const firsts = JSON.parse(vm.runInContext('JSON.stringify(CHAPTERS.map((c, i) => (MISSIONS.find((m) => m.chapter === i + 1) || {}).id).filter(Boolean))', ctx0));
    console.log(HEAD);
    const problems = [];
    for (const id of firsts) {
      const c = Object.assign({}, cfg, { from: id, months: cfg.months || 4 });
      const r = run(c);
      const g = sum(r.months);
      console.log(line('from ' + id, g));
      for (const m of r.months) if (m.msDay > DAY_MS_MAX) problems.push(id + ' month ' + m.month + ': the played day took ' + m.msDay + ' ms');
    }
    for (const p of problems) console.log('   ! ' + p);
    console.log(`(${((Date.now() - t0) / 1000).toFixed(0)} s of computing)`);
    process.exit(problems.length ? 1 : 0);
  }
  const r = run(cfg);
  const g = sum(r.months), es = eras(r.months);
  if (flag('months-table')) {
    console.log('month  date         waits for              dep  on t  hand/duty/team  attn cruise idle night = month      ms day   cash/loans  teams/sys/hand');
    for (const m of r.months) console.log(monthLine(m));
  }
  if (!flag('quiet')) {
    console.log(HEAD);
    es.forEach((e, i) => { if (e) console.log(line('era ' + (i + 1), sum(e))); });
  }
  console.log(line('all', g));
  const problems = verdict(r, g, es);
  if (flag('check')) {
    const again = run(cfg);
    if (again.state !== r.state) problems.push('a game played again from the same start ends differently');
    const lastDay = r.months.reduce((k, m, i) => (m.day && m.day.dep ? r.months[i].month : k), 2);
    const cm = cfg.from || cfg.months ? Math.max(1, Math.min(lastDay, r.months[r.months.length - 1].month - 1)) : lastDay;
    const day = run(cfg, { month: cm, phase: 'day', at: 1500 }), night = run(cfg, { month: Math.max(1, cm - 1), phase: 'night', at: 9 });
    if (!day.cuts) problems.push('the resume test never cut a played day');
    else if (day.state !== r.state) problems.push('a game resumed in the middle of a played day ends differently');
    if (!night.cuts) problems.push('the resume test never cut a night');
    else if (night.state !== r.state) problems.push('a game resumed in the middle of a night ends differently');
    if (!problems.some((p) => /differently|never cut/.test(p))) console.log('ok: deterministic, resumed in a day and in a night the same');
  }
  if (flag('money')) money(r.months);
  if (flag('report')) { report(r, g, es); console.log('wrote docs/freeplay-balance.md'); }
  for (const p of problems) console.log('   ! ' + p);
  console.log(`(${((Date.now() - t0) / 1000).toFixed(0)} s of computing)`);
  process.exit(problems.length ? 1 : 0);
}
main();
