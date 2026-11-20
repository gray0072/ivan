'use strict';

// Arlanda Rising — a mission's life: its start (the calendar jumps to its date with the time between run in
// summary, the owner builds the historical projects it needs, its setup gives the budget, the airlines and
// the projects to build), its stages one after another (each start a checkpoint for Retry stage), the
// judging of each stage's goal, and at the end the stars and the Real Arlanda medal. The running mission
// is S.mission; `save()` gives what the autosave writes and `resume()` takes it back. Used by sim/sim.js,
// the screens and tools/missions-check.js.

const Missions = {
  checkpoint: null,   // S as JSON at the current stage's start (Retry stage)
  startWorld: null,   // S as JSON at the mission's start, before its first stage (Restart mission)

  // the mission's definition: from the list, or the one Free Play made (kept in the state)
  def() { return S.mission.def || MISSION[S.mission.id]; },
  stage() { return this.def().stages[S.mission.stage]; },

  // `world`: the campaign's airport to go on from (null: a new campaign, the forest of 1958)
  start(id, difficulty, world, def) {
    const m = def || MISSION[id];
    if (!m) throw new Error('no mission ' + id);
    S = world ? JSON.parse(JSON.stringify(world)) : newWorld(hashOf('arlanda', id), difficulty);
    S.difficulty = difficulty;
    S.cheated = false;          // a cheat marks this run only
    S.mission = null; S.ops = null; S.plan = null;
    const day0 = Calendar.parse(m.date);
    const log0 = S.log.length;
    const meanwhile = S.day < day0 ? Summary.skip(day0) : null;
    S.day = Math.max(S.day, day0);
    // what the people did meanwhile: rounds settled, strikes, managers poached or retired, raises asked
    if (meanwhile) meanwhile.news = S.log.slice(log0).filter((e) => MEANWHILE_NEWS.indexOf(e.type) >= 0).slice(-6);
    People.settleAsks();
    for (const p of m.requires || []) { const [pid, sid] = p.split('.'); if (sid) Construction.ownerStage(pid, sid); else Construction.ownerBuilds(pid); }
    this.setup(m.setup || {});
    // a campaign that comes in below zero gets the owner's loan, so it never gets stuck
    if (S.money < 0) { const gap = -S.money; S.loans += gap; Finance.book('owner loan', gap); S.debtMonths = 0; if (meanwhile) meanwhile.ownerLoan = gap; }
    S.mission = { id, stage: -1, status: 'running', results: [], hands: [], st: null, total: Goals.newStats(),
      money0: S.money, choices: {}, grants: m.grants || [], partners: m.partners || [], meanwhile, acc: 0, stars: 0, medal: false, judged: null,
      projects: ((m.setup || {}).projects || []).slice() };
    if (def) S.mission.def = def;
    // a Challenge Day starts from the owner's airport of its year: no "Meanwhile…" of the decades before
    if (m.challenge) S.mission.meanwhile = null;
    // session 4: a concession's partner builds the train with its own money
    if (S.airport.trainDeal === 'concession' && Construction.state('arlandaExpress') && !Construction.done('arlandaExpress')) {
      S.mission.partners.push('arlandaExpress');
      Construction.state('arlandaExpress').finance = 'partner';
    }
    this.startWorld = JSON.stringify(S);
    this.beginStage(0);
  },
  // what the mission brings: the owner's budget, the loan limit, the projects to build, the owner's vehicles
  // and desks, the airlines' planned routes, whether the airport is open to traffic
  setup(u) {
    if (u.budget) Finance.book('owner', u.budget * diff().money);
    // session 4: the owner tops the money up to this (a mission opened without the campaign, after a cheat's jump)
    if (u.minMoney && S.money < u.minMoney * diff().money) Finance.book('owner', u.minMoney * diff().money - S.money);
    // the room the owner gives for new loans, on top of what is owed already
    if (u.loanLimit !== undefined) S.loanLimit = S.loans + u.loanLimit * diff().money;
    if (u.open !== undefined) S.airport.open = u.open;
    for (const p of u.projects || []) Construction.open(p);
    for (const kind of Object.keys(u.items || {})) while (Airport.count(kind) < u.items[kind]) Airport.addItem(kind);
    if (u.desks) S.airport.desks = Math.max(S.airport.desks, u.desks);
    // session 4: from chapter 4 (openSkies) the routes the player won stay, and the flights moved to rivals stay away
    if (u.openSkies) S.airport.openSkies = true;
    for (const code of Object.keys(u.airlines || {})) {
      const al = Meters.airline(code), own = S.airport.openSkies ? (al.routes || []).filter((r) => r.own) : [];
      al.routes = u.airlines[code].map((r) => Object.assign({}, r)).concat(own);
      if (S.airport.openSkies) Airlines.applyCut(code);
    }
    // the real endings: an airline after its last year at Arlanda flies no more (a merger, a bankruptcy)
    if (S.airport.openSkies) {
      const y = Calendar.year();
      for (const code of Object.keys(S.airlines)) { const yy = (AIRLINES[code] || {}).years; if (yy && yy[1] && yy[1] < y && (S.airlines[code].routes || []).length) { S.airlines[code].routes = []; logEvent('airlineEnded', { al: code }); } }
    }
    for (const code of Object.keys(u.terms || {})) Meters.airline(code).term = u.terms[code];
    Meters.updateAirlines();
    if (u.units && !S.airport.units) S.airport.units = [];
    Terminal.ensure();
    if (u.lanes) S.airport.lanes = Math.max(S.airport.lanes || 0, u.lanes);
    if (u.rivals) S.airport.rivals = Object.assign({}, u.rivals);
    if (u.trainDeal && !S.airport.trainDeal) S.airport.trainDeal = u.trainDeal;
    // session 5: the Schengen border and its booths, the security rules of the day, random events, the owner's name, the
    // green rating and the permit
    if (u.schengen) S.airport.schengen = true;
    if (u.booths) S.airport.booths = Math.max(S.airport.booths || 0, u.booths);
    if (u.secRule !== undefined) S.airport.secRule = Math.max(S.airport.secRule || 0, u.secRule);
    if (u.events) S.airport.events = true;
    if (u.owner) S.owner = u.owner;
    if (u.green) S.airport.green = true;
    if (u.permit) S.airport.permit = Object.assign({}, u.permit);
    if (u.brands) for (const b of u.brands) if (!Terminal.units(b[0]).some((x) => x.brand === b[1])) { const free = Terminal.units(b[0]).find((x) => !x.brand && Terminal.fits(x, b[1])); if (free) { free.brand = b[1]; free.since = S.day; free.price = UNIT_FIT[free.size]; } }
    // session 3: the domains the mission opens (at least at a level: the owner's arrangement), the levels it
    // lets the Office buy, IT people
    for (const d of u.opens || []) if (S.domains[d] === undefined) S.domains[d] = 0;
    for (const d of Object.keys(u.domains || {})) {
      while ((S.domains[d] || 0) < u.domains[d]) {
        if (!S.domains[d]) { S.domains[d] = 1; People.dept(d); } else { Systems.rec(d).kept = true; Systems.installed(d); }
      }
    }
    for (const d of Object.keys(u.unlock || {})) this.unlock(d, u.unlock[d]);
    // a strike notice the mission starts with
    if (u.strike) { People.ensure(); People.dept(u.strike.dept); const from = Calendar.parse(u.strike.from); S.people.strike = { dept: u.strike.dept, from, to: from + STRIKE_DAYS, settle: WAGE_DEMAND }; }
    for (const id of u.managers || []) if (!S.people || !Object.values(S.people.managers).some((m) => m.id === id)) People.hireManager(id);
    if (u.it && (!S.people || S.people.it < u.it)) People.hireIT(u.it - (S.people ? S.people.it : 0));
    People.updateMeter();
  },
  // a level the Office may buy from now on
  unlock(d, lv) {
    S.unlock = S.unlock || {};
    S.unlock[d] = Math.max(S.unlock[d] || 0, lv);
    if (S.domains[d] === undefined) S.domains[d] = 0;
  },
  beginStage(i) {
    const m = this.def(), stage = m.stages[i];
    S.mission.stage = i;
    S.mission.st = null;
    if (stage.date) { const d = Calendar.parse(stage.date); if (d > S.day) Summary.skip(d); }
    S.mission.status = 'running';
    S.mission.st = Goals.newStats();
    S.mission.acc = 0;
    S.mission.hands = (stage.hands || m.hands || []).slice();
    if (stage.mode === 'ops') Ops.begin(stage); else Plan.begin(stage);
    this.checkpoint = JSON.stringify(S);
    logEvent('stageStart', { stage: i });
  },
  ended() {
    if (S.mission.forceEnd) return true;
    if (S.ops) return Ops.ended();
    if (!S.plan || S.plan.pending) return false;
    const stage = this.stage();
    if (S.day >= S.plan.end) return true;
    // ends early once its goal is met and no work is still going on
    return !!stage.endEarly && Construction.active() === 0 && Goals.passed(stage.goal, S.mission.st);
  },
  endStage() {
    if (S.ops) Ops.end();
    const m = this.def(), i = S.mission.stage, stage = this.stage(), st = S.mission.st;
    const goals = Goals.all(stage.goal, st);
    const replaced = Finance.replaced();
    const pass = !!S.mission.forceWin || (goals.every((g) => g.ok) && !replaced);
    S.mission.forceWin = false; S.mission.forceEnd = false;
    S.mission.results[i] = { pass, goals, st, replaced };
    S.ops = null; S.plan = null;
    logEvent('stageEnd', { stage: i, pass });
    if (!pass) { S.mission.status = 'stageFailed'; return; }
    Goals.add(S.mission.total, st);
    if (i < m.stages.length - 1) S.mission.status = 'stageDone';
    else this.finish();
  },
  next() { if (S.mission.status === 'stageDone') this.beginStage(S.mission.stage + 1); },
  retry() { S = JSON.parse(this.checkpoint); },
  restart() { S = JSON.parse(this.startWorld); this.beginStage(0); },
  finish() {
    const m = this.def(), tot = S.mission.total;
    const goal = Goals.all(m.goal, tot), stars = Goals.all(m.stars, tot);
    const pass = goal.every((g) => g.ok);
    S.mission.judged = { goal, stars };
    S.mission.status = pass ? 'done' : 'failed';
    S.mission.stars = pass ? 1 + stars.filter((g) => g.ok).length : 0;
    // Real Arlanda: the real airport's number of that year, beaten
    if (pass && m.real) S.mission.medal = Goals.check(m.real, tot).ok;
    // a cheated run keeps its result on screen but saves no stars, medal or record (the progress checks this)
    S.mission.cheated = !!S.cheated;
    if (S.cheated) S.mission.medal = false;
    logEvent('missionEnd', { stars: S.mission.stars, pass });
  },
  // the campaign's airport after the mission: the world without the mission
  world() {
    const w = JSON.parse(JSON.stringify(S));
    w.mission = null; w.ops = null; w.plan = null; w.log = [];
    return w;
  },
  // what the autosave writes, and taking it back (the mission goes on at that very moment, paused)
  save() { return { state: S, checkpoint: this.checkpoint, startWorld: this.startWorld }; },
  resume(data) {
    S = typeof data.state === 'string' ? JSON.parse(data.state) : JSON.parse(JSON.stringify(data.state));
    this.checkpoint = data.checkpoint;
    this.startWorld = data.startWorld;
  },
  // real minutes at ▶ the stages played so far took: ops by the game minutes, plan by the days and decisions
  minutes(st) {
    return (st.minutes * OPS_HOUR_SECONDS / 60 + st.days * PLAN_DAY_SECONDS + st.decisions * DECISION_SECONDS) / 60;
  }
};

// the kinds of log entries the "Meanwhile…" card tells
const MEANWHILE_NEWS = ['settled', 'strikeNotice', 'strikeOver', 'poached', 'retired', 'raiseAsk', 'teamReady', 'systemLive', 'routeCut', 'incentiveEnd'];
