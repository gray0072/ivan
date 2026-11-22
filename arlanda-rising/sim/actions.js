'use strict';

// Arlanda Rising — everything the player can do, as one list of calls: the tray's tasks, dragging an aircraft
// to a stand, opening and closing check-in desks, sending the ploughs, the runway direction when it is
// calm, the fee level, the small builds (and selling a shop back), the projects' stages, pace, mods and money, the decisions,
// loans. The screens call these, and so do the reference strategies (sim/strategy.js). Each returns true
// when it did something.

const Actions = {
  task(id, choice) { return !!S.ops && Tasks.doTask(id, choice); },
  // done on the map instead of the tray: the matching task leaves the tray as done by the player
  doneByHand(kind, target) {
    const n = S.ops.tasks.length;
    S.ops.tasks = S.ops.tasks.filter((k) => !(k.kind === kind && k.target === target));
    if (S.ops.tasks.length < n) S.mission.st.tasksPlayer++;
  },
  stand(flightId, standId) {
    const f = S.ops && Flights.get(flightId), st = Airport.stand(standId);
    if (!f || !st || !Stands.fits(st, f.type) || f.inBlock !== null || Flights.over(f)) return false;
    if (!Stands.assign(f, st)) return false;
    this.doneByHand('stand', f.id);
    return true;
  },
  // the desks, lanes and booths the player opens or closes: with a team or a system running them, the player's choice
  // holds for COUNTER_HOLD_MIN before they take over again (sim/passengers.js `runCounters`)
  hold(k) { S.ops.hold = S.ops.hold || {}; S.ops.hold[k] = S.clock + COUNTER_HOLD_MIN; },
  desks(n) {
    if (!S.ops) return false;
    const was = S.ops.desksOpen;
    S.ops.desksOpen = clamp(Math.round(n), 0, S.airport.desks);
    if (S.ops.desksOpen > was) this.doneByHand('checkin', 'desks');
    if (S.ops.desksOpen !== was) this.hold('desks');
    return S.ops.desksOpen !== was;
  },
  plough(surface) {
    if (!S.ops || !Runways.plough(surface)) return false;
    this.doneByHand('plough', surface);
    return true;
  },
  dir(d) { if (['01', '19'].indexOf(d) < 0) return false; S.airport.prefDir = d; return true; },
  fees(level) { if (!FEE_LEVELS[level]) return false; S.airport.fees = level; return true; },
  // a small build of the buy menu: refused when its year has not come, a later mission opens it, what it needs is not
  // there or it is at its limit (Airport.why); a decision's option builds through Airport.buy, past the locks
  buy(kind) {
    if (Airport.why(kind) || !Airport.buy(kind)) return false;
    // a vehicle bought in ops time joins at once
    if (S.ops && kind === 'fuelTruck') S.ops.trucks.push(0);
    if (S.ops && kind === 'deicer' && S.ops.deicers) S.ops.deicers.push(0);
    return true;
  },
  // an own shop sold back to free its cells in the terminal (by its item id, or the last bought of a kind)
  sell(what) { return Airport.sell(what); },
  start(project, stage, pace) { return !!S.plan && Construction.start(project, stage, pace); },
  pace(project, stage, pace) { return Construction.pace(project, stage, pace); },
  mod(project, mod) { return Construction.mod(project, mod); },
  finance(project, how) { return Construction.finance(project, how); },
  choose(option) { return Plan.choose(option); },
  borrow(amount) { return Finance.borrow(amount) > 0; },
  repay(amount) { return Finance.repay(amount) > 0; },
  // session 3: people and systems (in plan time and between missions; overtime in ops time)
  hire(dom) { return People.hire(dom); },
  upgrade(dom, how) { return Systems.upgrade(dom, how); },
  // session 7: a system bought straight from the hands or from a team (how: 'keep' / 'layoff' the team), a team hired
  // back beside a system as its fallback
  system(dom, how) { return Systems.upgrade(dom, how, Systems.nextSystem(dom)); },
  hireBack(dom) { return People.hireBack(dom); },
  hireIT(n) { return People.hireIT(n); },
  train(dept) { return People.train(dept); },
  temps(dept) { return People.temps(dept); },
  summer(how) { return People.summer(how); },
  overtime(dept) { return People.overtime(dept); },
  drill(dom) { return Systems.drill(dom); },
  manager(id) { return People.hireManager(id); },
  raise(dept, give) { return People.raise(dept, give); },
  // session 4: a brand in a unit (and closing one), a route incentive to court an airline or for one flying, an offer
  // of the Office's board
  brand(unitId, brandId) { return Terminal.place(unitId, brandId); },
  closeBrand(unitId) { return Terminal.close(unitId); },
  court(code, share) { return Airlines.court(code, share); },
  incentive(code, share) { return Airlines.incentive(code, share); },
  offer(i, optionId) { return Offers.take(i, optionId); },
  // session 5: security lanes and passport booths open (in ops time), biofuel, the drill of a domain
  lanes(n) {
    if (!S.ops || !Terminal.openLane(n)) return false;
    this.doneByHand('lane', 'lanes');
    this.hold('lanes');
    return true;
  },
  booths(n) {
    if (!S.ops || !Terminal.openBooth(n)) return false;
    this.doneByHand('booth', 'booths');
    this.hold('booths');
    return true;
  },
  biofuel(share) { return Green.biofuel(share); },
  // session 6: terminals closed and opened again, rehiring a department's jobs (or every one), drills everywhere, the
  // mobile charger sent to an electric aircraft
  mothball(term) { return !S.ops && Terminal.mothball(term); },
  reopen(term) { return !S.ops && Terminal.reopen(term); },
  rehire(dept) { return !S.ops && (dept ? People.rehire(dept) : People.rehireAll()); },
  drillAll() { return Systems.drillAll(); },
  charge(flightId) {
    const f = S.ops && Flights.get(flightId);
    if (!f || !Tasks.valid('charge', flightId)) return false;
    f.tr.fuel = 'cqueued';
    this.doneByHand('charge', flightId);
    return true;
  },
  deice(flightId) {
    const f = S.ops && Flights.get(flightId);
    if (!f || !Tasks.valid('deice', flightId)) return false;
    f.tr.deice = 'queued';
    this.doneByHand('deice', flightId);
    return true;
  }
};
