'use strict';

// Arlanda Rising — ops time: a stage of an operations mission, one game hour about OPS_HOUR_SECONDS at ▶. At
// the start it makes the stage's weather and flights, clears the stands and opens the stage's desks; each
// step (OPS_STEP_MIN game minutes) runs the scripted events, the runways and the snow, the flights, the
// check-in queue, the task tray, the running costs and the meters, in that order. The stage's state is
// S.ops; it ends at its last minute once every flight is gone (or OPS_OVERTIME later at the latest).

const OPS_OVERTIME = 60;   // game minutes a stage may run past its end while flights are still here

const Ops = {
  begin(stage) {
    const from = clockMin(stage.from), to = clockMin(stage.to);
    S.clock = from;
    for (const st of S.airport.stands) { st.occ = null; st.res = null; st.closed = false; }
    for (const r of S.airport.runways) { r.busyUntil = 0; r.plough = null; r.closedUntil = 0; r.closedFor = null; r.snow = (stage.snowStart || 0); }
    S.airport.apron.snow = stage.snowStart || 0;
    S.airport.apron.plough = null;
    S.ops = {
      from, to, weather: null, flights: [], tasks: [], later: [], queue: [],
      desksOpen: Math.min(S.airport.desks, stage.desks !== undefined ? stage.desks : 1),
      trucks: new Array(Airport.fuelTrucks()).fill(0), convoy: 0, ploughQueue: [], dir: null, sec: [],
      events: (stage.events || []).map((e, i) => ({ i, at: clockMin(e.at), done: false })),
      down: {}, overtime: {}, absence: {}, strike: null
    };
    // session 5: the lanes opened at the start when security is a domain, the border's booths, the de-icing trucks
    if (Terminal.secDomain() && S.airport.lanes) S.ops.lanesOpen = Math.min(S.airport.lanes, stage.lanes !== undefined ? stage.lanes : S.airport.lanes);
    if (Terminal.borderOn()) { S.ops.border = []; S.ops.boothsOpen = Math.min(S.airport.booths, stage.booths !== undefined ? stage.booths : S.airport.booths); }
    if (S.domains.deice !== undefined) S.ops.deicers = new Array(Airport.count('deicer')).fill(0);
    // the people of the day: who is away, who is on strike
    if (S.people) {
      for (const d of Object.keys(S.people.depts)) S.ops.absence[d] = People.absence(d) + ((stage.sick || {})[d] || 0);
      const s = S.people.strike;
      if (s && S.day >= s.from && S.day < s.to) S.ops.strike = s.dept;
    }
    if (S.ops.strike) S.mission.st.struck = 1;
    S.ops.weather = Weather.make(stage.weather, from, to);
    S.ops.flights = Schedule.make(stage);
    Events.begin(stage);
    // the aircraft parked overnight stand on the best stands that fit
    for (const f of S.ops.flights) if (f.st === 'parked') Turnaround.park(f, Stands.best(f));
    // the passengers who came before the stage began are through check-in already
    for (const f of S.ops.flights) {
      const share = clamp((from - (f.std - PAX_ARRIVE_FIRST)) / (PAX_ARRIVE_FIRST - PAX_ARRIVE_LAST), 0, 1);
      f.checked = f.booked * share;
    }
  },
  step() {
    const dt = OPS_STEP_MIN, stage = Missions.stage();
    for (const e of S.ops.events) if (!e.done && S.clock >= e.at) { e.done = true; this.event(stage.events[e.i]); }
    Systems.step(dt);
    Events.step();
    Runways.step(dt);
    Flights.step();
    Passengers.step(dt);
    Tasks.step();
    Finance.running(dt);
    Meters.step(dt);
    S.clock += dt;
    S.mission.st.minutes += dt;
  },
  // a scripted event of the stage
  event(e) {
    // a scripted event the player prevented (session 4: a flag set by a decision)
    if (e.unless && S.flags[e.unless]) { logEvent('script', { what: 'prevented', text: null }); return; }
    if (e.do === 'closeStand') {
      const st = S.airport.stands.find((s) => s.name === e.stand);
      if (st) st.closed = true;
    } else if (e.do === 'openStand') {
      const st = S.airport.stands.find((s) => s.name === e.stand);
      if (st) st.closed = false;
    } else if (e.do === 'strike') {
      // a strike called this morning: the team works at STRIKE_CAPACITY for the rest of the stage
      if (People.has(e.dept)) { S.ops.strike = e.dept; S.mission.st.struck = 1; logEvent('strikeNow', { dept: e.dept }); }
    } else if (e.do === 'fail') Systems.fail(e.dom, e.min, e.deep);
    else if (e.do === 'power') Systems.powerCut(e.min);
    else if (e.do === 'lanesShut') S.ops.lanesShut = e.n;
    else if (e.do === 'sick') { if (People.has(e.dept)) S.ops.absence[e.dept] = (S.ops.absence[e.dept] || 0) + e.share; }
    else if (Events.scripted(e)) { /* session 5: a VIP flight, a thunderstorm, a moose, the ash cloud… (sim/events.js) */ }
    else if (e.do === 'emergency') {
      // the next aircraft to land declares an emergency: it goes first, and the fire service meets it
      const f = S.ops.flights.filter((x) => (x.st === 'sched' || x.st === 'inbound' || x.st === 'approach') && x.eta !== null && x.eta >= S.clock - 5)
        .sort((a, b) => a.eta - b.eta)[0];
      if (f) { f.mayday = true; logEvent('mayday', { flight: f.no }); }
    }
    logEvent('script', { what: e.do, text: e.text || null });
  },
  ended() {
    const all = S.ops.flights.every((f) => Flights.over(f) || f.st === 'sched' && f.eta >= S.ops.to || (f.stay && f.inBlock !== null));
    return (S.clock >= S.ops.to && all) || S.clock >= S.ops.to + OPS_OVERTIME;
  },
  end() { Flights.close(); }
};
