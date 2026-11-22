'use strict';

// Arlanda Rising — plan time: a stage of a build or business mission, one game day about PLAN_DAY_SECONDS at ▶.
// Each day the construction goes on, the small builds bought get finished, the airport's traffic runs in
// summary and the running costs are paid. A decision of the stage (the Offers board's pair of cards, a
// deal) stops the time until the player picks one of its options; each option's effects are applied by
// `choose`. The stage's state is S.plan.

const Plan = {
  begin(stage) {
    S.clock = 12 * 60;
    S.plan = {
      day0: S.day, end: S.day + stage.days, crews: (stage.crews || 2) + (S.mission.crews || 0), buys: [], pending: null,
      choices: (stage.choices || []).map((c) => ({ id: c.id, day: S.day + (c.at || 0), done: null })), extra: []
    };
    // session 5: the sky closed for days (the ash cloud): no traffic in summary until then
    if (stage.skyClosed) S.airport.skyClosed = S.day + stage.skyClosed;
    // session 7: a head who left since the last plan time: the two successors are offered
    People.offerHeads();
  },
  // a decision made on the way (Free Play's offers): its whole definition is kept in the state
  offer(def, inDays) {
    S.plan.extra.push(def);
    S.plan.choices.push({ id: def.id, day: S.day + (inDays || 0), done: null });
  },
  defs() { return (Missions.stage().choices || []).concat((S.plan && S.plan.extra) || []); },
  // the decision waiting for the player, with its definition from the mission's data
  pendingDef() {
    if (!S.plan || !S.plan.pending) return null;
    return this.defs().find((c) => c.id === S.plan.pending);
  },
  day() {
    const p = S.plan;
    for (const c of p.choices) {
      if (!c.done && S.day >= c.day) { p.pending = c.id; logEvent('decision', { id: c.id }); return; }
    }
    Construction.day();
    p.buys = p.buys.filter((b) => { if (S.day >= b.done) { Airport.finishBuy(b.kind, b.term); return false; } return true; });
    Summary.day();
    Finance.running(1440);
    S.day++;
    People.day();
    Systems.day();
    if (S.people && S.people.strike && S.day >= S.people.strike.from && S.day < S.people.strike.to) S.mission.st.struck = 1;
    S.mission.st.days++;
    Finance.checkMonth();
    Stats.day();
  },
  // the player picks an option of the waiting decision
  choose(optionId) {
    const def = this.pendingDef();
    if (!def) return false;
    const o = def.options.find((x) => x.id === optionId);
    if (!o) return false;
    this.apply(o);
    S.plan.choices.find((c) => c.id === def.id).done = optionId;
    S.mission.choices[def.id] = optionId;
    S.mission.st.decisions++;
    S.plan.pending = null;
    logEvent('chosen', { id: def.id, option: optionId });
    return true;
  },
  // what an option does: money, the meters, a slower stage, a flag, an airline's routes, a thing built, a crew
  apply(o) {
    if (o.money) Finance.book('deals', o.money);
    if (o.meters) Meters.change(o.meters);
    if (o.neighboursBase) S.airport.neighboursBase = (S.airport.neighboursBase || 72) + o.neighboursBase;
    if (o.extraDays) { const s = Construction.state(o.extraDays[0]); if (s) s.stages[o.extraDays[1]].extra += o.extraDays[2]; }
    if (o.flag) S.flags[o.flag] = true;
    for (const a of [o.airline, o.airline2]) {
      if (!a) continue;
      const al = Meters.airline(a.code);
      // from chapter 4 the routes won in a deal are the player's own: they stay from mission to mission
      al.routes = (al.routes || []).concat(S.airport.openSkies ? a.routes.map((r) => Object.assign({ own: true }, r)) : a.routes);
      if (S.airport.openSkies) al.cut = 0;
      if (a.mood !== undefined) al.mood = a.mood;
      Meters.updateAirlines();
    }
    for (const b of [].concat(o.build || [])) Airport.buy(b);
    if (o.fees) S.airport.fees = o.fees;
    // another crew for the rest of the mission
    if (o.crews) { S.mission.crews = (S.mission.crews || 0) + o.crews; S.plan.crews += o.crews; }
    // session 3: people, managers, unions, systems, projects
    if (o.hire) People.hire(o.hire);
    if (o.manager) People.hireManager(o.manager);
    if (o.union) People.wageRound(o.union.dept, o.union.how, o.union.offer);
    if (o.system) Systems.upgrade(o.system.dom, o.system.how);
    if (o.it) People.hireIT(o.it);
    if (o.temps) People.temps(o.temps);
    if (o.train) People.train(o.train);
    if (o.summer) People.summer(o.summer);
    if (o.project) { Construction.open(o.project); if (S.mission.projects.indexOf(o.project) < 0) S.mission.projects.push(o.project); }
    if (o.unlock) for (const d of Object.keys(o.unlock)) Missions.unlock(d, o.unlock[d]);
    if (o.routesOff) { const al = S.airlines[o.routesOff]; if (al) { al.routes = []; Meters.updateAirlines(); } }
    // session 4: a brand in a terminal, a route incentive (to court a new airline, or for one flying), a terminal for an
    // airline, the train's deal
    if (o.brand) Terminal.placeAny(o.brand.term, o.brand.id);
    if (o.court) Airlines.court(o.court.code, o.court.share);
    if (o.incentive) Airlines.incentive(o.incentive.code, o.incentive.share);
    if (o.term) Meters.airline(o.term.code).term = o.term.term;
    if (o.train) {
      S.airport.trainDeal = o.train;
      if (o.train === 'concession' && S.mission) { S.mission.partners = (S.mission.partners || []).concat(['arlandaExpress']); const p = Construction.state('arlandaExpress'); if (p) p.finance = 'partner'; }
    }
    if (o.rivalPull !== undefined && S.airport.rivals) S.airport.rivals.pull = o.rivalPull;
    // session 5: passport booths, security lanes, biofuel, the passengers stranded by the ash cloud (helped at a price),
    // the permit's caps (an appeal), random events turned on
    for (let i = 0; i < (o.booths || 0); i++) Airport.buy('booth');
    for (let i = 0; i < (o.lanes || 0); i++) Airport.buy('lane');
    if (o.biofuel !== undefined) Green.biofuel(o.biofuel);
    if (o.stranded) Finance.book('stranded', -o.stranded);
    if (o.permit) S.airport.permit = Object.assign({}, S.airport.permit || {}, o.permit);
    // session 6: the traffic a crisis leaves, terminals closed and opened again, rent relief for the brands, the staff's
    // crisis answer (furlough, lay-offs), rehiring, a drill everywhere, the design of the player's pier
    if (o.demand !== undefined) S.airport.demand = o.demand;
    for (const t of [].concat(o.mothball || [])) Terminal.mothball(t);
    for (const t of [].concat(o.reopen || [])) Terminal.reopen(t);
    if (o.relief !== undefined) Terminal.relief(o.relief);
    if (o.staff) People.crisis(o.staff.how, o.staff.share, o.staff.months);
    if (o.rehire) { if (o.rehire === true) People.rehireAll(); else for (const d of [].concat(o.rehire)) People.rehire(d); }
    if (o.drills) Systems.drillAll();
    // a second company's people, cleared already, fill a share of a department's empty jobs at once
    if (o.cutFill && People.has(o.cutFill.dept)) { const d = S.people.depts[o.cutFill.dept]; d.cut = Math.max(0, (d.cut || 0) - o.cutFill.share); People.updateMeter(); }
    if (o.pier) {
      S.airport.pierDesign = o.pier;
      const p = Construction.open('pier2040');
      p.k = PROJECTS.pier2040.designs[o.pier].k;
      if (S.mission.projects.indexOf('pier2040') < 0) S.mission.projects.push('pier2040');
    }
  }
};
