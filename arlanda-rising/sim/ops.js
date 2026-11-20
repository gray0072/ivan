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
    for (const r of S.airport.runways) { r.busyUntil = 0; r.plough = null; r.snow = (stage.snowStart || 0); }
    S.airport.apron.snow = stage.snowStart || 0;
    S.airport.apron.plough = null;
    S.ops = {
      from, to, weather: null, flights: [], tasks: [], later: [], queue: [],
      desksOpen: Math.min(S.airport.desks, stage.desks !== undefined ? stage.desks : 1),
      trucks: new Array(Airport.fuelTrucks()).fill(0), convoy: 0, ploughQueue: [], dir: null,
      events: (stage.events || []).map((e, i) => ({ i, at: clockMin(e.at), done: false }))
    };
    S.ops.weather = Weather.make(stage.weather, from, to);
    S.ops.flights = Schedule.make(stage);
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
    if (e.do === 'closeStand') {
      const st = S.airport.stands.find((s) => s.name === e.stand);
      if (st) st.closed = true;
    } else if (e.do === 'openStand') {
      const st = S.airport.stands.find((s) => s.name === e.stand);
      if (st) st.closed = false;
    }
    logEvent('script', { what: e.do, text: e.text || null });
  },
  ended() {
    const all = S.ops.flights.every((f) => Flights.over(f) || f.st === 'sched' && f.eta >= S.ops.to);
    return (S.clock >= S.ops.to && all) || S.clock >= S.ops.to + OPS_OVERTIME;
  },
  end() { Flights.close(); }
};
