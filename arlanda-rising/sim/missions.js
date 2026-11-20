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

  def() { return MISSION[S.mission.id]; },
  stage() { return this.def().stages[S.mission.stage]; },

  // `world`: the campaign's airport to go on from (null: a new campaign, the forest of 1958)
  start(id, difficulty, world) {
    const m = MISSION[id];
    if (!m) throw new Error('no mission ' + id);
    S = world ? JSON.parse(JSON.stringify(world)) : newWorld(hashOf('arlanda', id), difficulty);
    S.difficulty = difficulty;
    S.cheated = false;          // a cheat marks this run only
    S.mission = null; S.ops = null; S.plan = null;
    const day0 = Calendar.parse(m.date);
    const meanwhile = S.day < day0 ? Summary.skip(day0) : null;
    S.day = Math.max(S.day, day0);
    for (const p of m.requires || []) Construction.ownerBuilds(p);
    this.setup(m.setup || {});
    // a campaign that comes in below zero gets the owner's loan, so it never gets stuck
    if (S.money < 0) { const gap = -S.money; S.loans += gap; Finance.book('owner loan', gap); S.debtMonths = 0; if (meanwhile) meanwhile.ownerLoan = gap; }
    S.mission = { id, stage: -1, status: 'running', results: [], hands: [], st: null, total: Goals.newStats(),
      money0: S.money, choices: {}, grants: m.grants || [], meanwhile, acc: 0, stars: 0, medal: false, judged: null };
    this.startWorld = JSON.stringify(S);
    this.beginStage(0);
  },
  // what the mission brings: the owner's budget, the loan limit, the projects to build, the owner's vehicles
  // and desks, the airlines' planned routes, whether the airport is open to traffic
  setup(u) {
    if (u.budget) Finance.book('owner', u.budget * diff().money);
    if (u.loanLimit !== undefined) S.loanLimit = u.loanLimit * diff().money;
    if (u.open !== undefined) S.airport.open = u.open;
    for (const p of u.projects || []) Construction.open(p);
    for (const kind of Object.keys(u.items || {})) while (Airport.count(kind) < u.items[kind]) Airport.addItem(kind);
    if (u.desks) S.airport.desks = Math.max(S.airport.desks, u.desks);
    for (const code of Object.keys(u.airlines || {})) Meters.airline(code).routes = u.airlines[code].map((r) => Object.assign({}, r));
    Meters.updateAirlines();
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
