'use strict';

// Arlanda Rising — the turnaround at the stand, the little Gantt bar over each aircraft: the passengers off,
// cleaning, catering and bags (done by the airline's own handlers), fuel (a fuel truck the player sends
// while the turnaround is worked by hand, else the oil company's), boarding (only once its passengers are
// through check-in, or BOARD_WAIT_MAX past departure without the late ones), then pushback at the planned
// time. Snow on the apron makes every step slower. Used by sim/flights.js.

const Turnaround = {
  slow() { return S.airport.apron.snow >= SNOW_APRON_SLOW_MM ? SNOW_APRON_SLOW : 1; },
  fuelTime(type) { return AIRCRAFT[type].mtow * FUEL_MIN_PER_T; },
  // the shortest turnaround of a flight with nothing waiting: off, the longer of services and fuel, on
  minTime(f) {
    const a = AIRCRAFT[f.type];
    return f.paxArr * DEBOARD_PER_PAX + 1 + Math.max(a.svc, FUEL_DRIVE / 2 + this.fuelTime(f.type)) + f.booked * BOARD_PER_PAX;
  },
  begin(f) {
    const t = S.clock, k = this.slow();
    f.inBlock = t;
    f.st = 'turn';
    const off = t + (f.paxArr * DEBOARD_PER_PAX + 1) * k;
    f.tr = { off, svc: off + AIRCRAFT[f.type].svc * k, fuel: 'wait', fuelEnd: null, board: null, ready: null };
    // with everything on time here it could leave at: from its real arrival time, by the nearest stand
    f.earliest = f.eta + TAXI_BASE + 1 + this.minTime(f);
  },
  // an aircraft parked overnight: only fuel and boarding are left
  park(f, st) {
    st.occ = f.id;
    f.stand = st.id;
    f.inBlock = null;
    f.st = 'turn';
    const t = S.clock;
    f.tr = { off: t, svc: t, fuel: 'wait', fuelEnd: null, board: null, ready: null };
    f.earliest = f.std;
  },
  step(f) {
    const t = S.clock, tr = f.tr;
    if (!tr) return;
    // fuel, after the passengers are off
    if (tr.fuel === 'wait' && t >= tr.off) {
      if (S.mission.hands.indexOf('fuel') >= 0 || S.domains.turnaround > 0) { tr.fuel = 'asked'; Tasks.need('fuel', f.id); }
      else { tr.fuel = 'done'; tr.fuelEnd = t + this.fuelTime(f.type) * this.slow(); }
    }
    if (tr.fuel === 'queued') {
      const i = S.ops.trucks.findIndex((busy) => busy <= t);
      if (i >= 0) {
        const ft = this.fuelTime(f.type) * this.slow();
        S.ops.trucks[i] = t + FUEL_DRIVE + ft;
        tr.fuelEnd = t + FUEL_DRIVE / 2 + ft;
        tr.fuelFrom = t;                // for the map: the truck sets off
        tr.fuel = 'going';
        logEvent('fuelling', { flight: f.no });
      }
    }
    if (tr.fuel === 'going' && t >= tr.fuelEnd) tr.fuel = 'done';
    // boarding: services and fuel done, and not before BOARD_LEAD minutes ahead of departure
    if (tr.board === null && tr.fuel === 'done' && t >= tr.fuelEnd && t >= tr.svc && t >= f.std - BOARD_LEAD) tr.board = t;
    if (tr.board !== null && tr.ready === null) {
      const allIn = f.checked >= f.booked - 0.5 && !Passengers.queued(f);
      const done = t >= tr.board + f.booked * BOARD_PER_PAX * this.slow();
      if (done && allIn) tr.ready = t;
      else if (done && t >= f.std + BOARD_WAIT_MAX) {
        f.missed = Math.round(f.booked - f.checked);
        S.mission.st.missed += f.missed;
        Passengers.drop(f);
        tr.ready = t;
      }
    }
    if (tr.ready !== null && t >= f.std) Flights.pushback(f);
  }
};
