'use strict';

// Arlanda Rising — the turnaround at the stand, the little Gantt bar over each aircraft: the passengers off,
// cleaning, catering and bags (done by the airline's own handlers), fuel (a fuel truck the player sends
// while the turnaround is worked by hand, else the oil company's), boarding (only once its passengers are
// through check-in, or BOARD_WAIT_MAX past departure without the late ones), then pushback at the planned
// time. Snow on the apron makes every step slower. Session 3: the bags (the carts sent by hand, the handlers or the
// belts; boarding waits for them) and the announcement of a late flight. Used by sim/flights.js.

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
    // the bags by hand or by the baggage team: the carts must be sent before the services can finish
    if (f.paxArr > 0 && (S.mission.hands.indexOf('bags') >= 0 || (S.domains.baggage || 0) > 0)) { f.tr.bags = 'asked'; Tasks.need('bags', f.id); }
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
  // the carts sent to an aircraft's bags (lost: some go to the wrong flight)
  bags(f, lost) {
    if (!f || !f.tr || f.tr.bags !== 'asked') return true;
    f.tr.bags = 'going';
    f.tr.bagsEnd = S.clock + BAG_CART_MIN * this.slow();
    f.tr.bagsFrom = S.clock;
    if (lost) { f.lostBags = Math.max(1, Math.round(f.paxArr * LOST_BAG_SHARE)); S.mission.st.lostBags += f.lostBags; }
    logEvent('bags', { flight: f.no });
    return true;
  },
  step(f) {
    const t = S.clock, tr = f.tr;
    if (!tr) return;
    if (tr.bags === 'going' && t >= tr.bagsEnd) tr.bags = 'done';
    // a late flight: its delay must be told to the passengers waiting at the gate
    if (!f.ann && tr.ready === null && t >= f.std + ANNOUNCE_LEAD && f.booked > 0 &&
      (S.mission.hands.indexOf('announce') >= 0 || (S.domains.info || 0) > 0)) { f.ann = 'asked'; f.annAsk = t; Tasks.need('announce', f.id); }
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
    if (tr.board === null && tr.fuel === 'done' && t >= tr.fuelEnd && t >= tr.svc && (!tr.bags || tr.bags === 'done') && t >= f.std - BOARD_LEAD) tr.board = t;
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
