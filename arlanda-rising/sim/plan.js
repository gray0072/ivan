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
    p.buys = p.buys.filter((b) => { if (S.day >= b.done) { Airport.finishBuy(b.kind); return false; } return true; });
    Summary.day();
    Finance.running(1440);
    S.day++;
    People.day();
    Systems.day();
    if (S.people && S.people.strike && S.day >= S.people.strike.from && S.day < S.people.strike.to) S.mission.st.struck = 1;
    S.mission.st.days++;
    Finance.checkMonth();
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
      al.routes = (al.routes || []).concat(a.routes);
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
  }
};
