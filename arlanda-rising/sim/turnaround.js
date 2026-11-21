'use strict';

// Arlanda Rising — the turnaround at the stand, the little Gantt bar over each aircraft: the passengers off,
// cleaning, catering and bags (done by the airline's own handlers), fuel (a fuel truck the player sends
// while the turnaround is worked by hand, else the oil company's), boarding (only once its passengers are
// through check-in, or BOARD_WAIT_MAX past departure without the late ones), then pushback at the planned
// time. Snow on the apron makes every step slower. Session 3: the bags (the carts sent by hand, the handlers or the
// belts; boarding waits for them) and the announcement of a late flight. Session 5: de-icing in the cold, by a truck at
// the stand before pushback, or at a remote pad on the way out (sim/flights.js). Used by sim/flights.js.

const Turnaround = {
  slow() {
    let k = S.airport.apron.snow >= SNOW_APRON_SLOW_MM ? SNOW_APRON_SLOW : 1;
    // session 6: the heat slows the people on the ramp (not the robots)
    if (this.hot() && Systems.working('turnaround') < 2 && !S.flags.shaded) k *= HEAT_SLOW;
    return k;
  },
  hot() { return !!(S.ops && S.ops.weather && Weather.now().temp >= HEAT_TEMP); },
  // session 6: the services' minutes — faster with the apron robots working
  svcK() { return Systems.working('turnaround') >= 2 ? ROBOT_X : 1; },
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
    f.tr = { off, svc: off + AIRCRAFT[f.type].svc * k * this.svcK(), fuel: 'wait', fuelEnd: null, board: null, ready: null };
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
    // session 6: an electric aircraft charges — at a stand with a charger by itself, else from the mobile charger sent to
    // it (by hand or by the ramp team); a hydrogen one takes on fuel from the depot
    const A = AIRCRAFT[f.type];
    if (tr.fuel === 'wait' && t >= tr.off && (A.electric || A.hydrogen)) {
      const st = Airport.stand(f.stand);
      // in a blackout the stands' chargers are dark: only the mobile chargers' batteries work
      if (A.hydrogen || (st && st.charge && !(S.ops.blackout > t))) { tr.fuel = 'going'; tr.fuelFrom = t; tr.fuelEnd = t + (A.hydrogen ? H2_MIN : CHARGE_MIN) * this.slow(); tr.charge = A.electric ? 'stand' : 'h2'; }
      else if (S.mission.hands.indexOf('charge') >= 0 || S.domains.turnaround > 0) { tr.fuel = 'asked'; tr.charge = 'mobile'; Tasks.need('charge', f.id); }
      else { tr.fuel = 'cqueued'; tr.charge = 'mobile'; }
    }
    if (tr.fuel === 'cqueued') {
      const ch = S.ops.chargers = S.ops.chargers || new Array(Math.max(1, Airport.count('mcharger'))).fill(0);
      const i = ch.findIndex((busy) => busy <= t);
      if (i >= 0) {
        const ct = CHARGE_MOBILE_MIN * this.slow();
        ch[i] = t + 3 + ct;
        tr.fuelFrom = t; tr.fuelEnd = t + 1.5 + ct; tr.fuel = 'going';
        logEvent('charging', { flight: f.no });
      }
    }
    // fuel, after the passengers are off
    if (tr.fuel === 'wait' && t >= tr.off) {
      if (S.mission.hands.indexOf('fuel') >= 0 || S.domains.turnaround > 0) { tr.fuel = 'asked'; Tasks.need('fuel', f.id); }
      else { tr.fuel = 'done'; tr.fuelEnd = t + this.fuelTime(f.type) * this.slow(); }
    }
    // session 6: the apron robots bring their own fuel carts: no waiting for a truck
    if (tr.fuel === 'queued' && Systems.working('turnaround') >= 2) {
      tr.fuelFrom = t; tr.fuelEnd = t + FUEL_DRIVE / 2 + this.fuelTime(f.type) * this.slow() * ROBOT_X; tr.fuel = 'going';
    }
    if (tr.fuel === 'queued') {
      const i = S.ops.trucks.findIndex((busy) => busy <= t);
      if (i >= 0) {
        const ft = this.fuelTime(f.type) * this.slow();
        S.ops.trucks[i] = t + FUEL_DRIVE + ft;
        tr.fuelEnd = t + FUEL_DRIVE / 2 + ft;
        tr.fuelFrom = t;                // for the map: the truck sets off
        tr.truck = i;                   // … which one (its card)
        tr.fuel = 'going';
        Fleet.fuelled(i, f);
        logEvent('fuelling', { flight: f.no });
      }
    }
    if (tr.fuel === 'going' && t >= tr.fuelEnd) tr.fuel = 'done';
    // boarding: services and fuel done, and not before BOARD_LEAD minutes ahead of departure
    if (tr.board === null && tr.fuel === 'done' && t >= tr.fuelEnd && t >= tr.svc && (!tr.bags || tr.bags === 'done') && t >= f.std - BOARD_LEAD) tr.board = t;
    if (tr.board !== null && tr.ready === null) {
      const allIn = f.checked >= f.booked - 0.5 && !Passengers.queued(f);
      // session 6: with biometric boarding the face is the boarding pass
      const done = t >= tr.board + f.booked * BOARD_PER_PAX * this.slow() * (Systems.working('border') >= 3 ? BIO_BOARD_X : 1);
      if (done && allIn) tr.ready = t;
      else if (done && t >= f.std + BOARD_WAIT_MAX) {
        f.missed = Math.round(f.booked - f.checked);
        S.mission.st.missed += f.missed;
        Passengers.drop(f);
        tr.ready = t;
      }
    }
    // session 5: de-icing in the cold once boarding has begun — a truck at the stand (sent by hand, or by the crew), or
    // on the way out at a remote pad
    if (tr.board !== null && tr.deice === undefined) {
      tr.deice = !this.deiceNeed(f) ? 'none' : Systems.working('deice') >= 2 ? 'pad' : 'asked';
      if (tr.deice === 'asked') Tasks.need('deice', f.id);
    }
    if (tr.deice === 'queued') {
      const trucks = S.ops.deicers || [];
      const i = trucks.findIndex((busy) => busy <= t);
      if (i >= 0 || !trucks.length) {
        const k = this.slow() * (trucks.length ? 1 : 2);
        if (i >= 0) trucks[i] = t + 2 + DEICE_MIN * k;
        tr.deiceFrom = t; tr.deiceEnd = t + 1 + DEICE_MIN * k; tr.deice = 'going';
        this.glycol();
        logEvent('deicing', { flight: f.no });
      }
    }
    if (tr.deice === 'going' && t >= tr.deiceEnd) tr.deice = 'done';
    const iced = !tr.deice || tr.deice === 'none' || tr.deice === 'pad' || tr.deice === 'done';
    if (tr.ready !== null && t >= f.std && iced) Flights.pushback(f);
  },
  // session 5: every departure needs de-icing at or below DEICE_TEMP, once a mission has opened the domain
  deiceNeed(f) { return S.domains.deice !== undefined && !f.training && Weather.now().temp <= DEICE_TEMP; },
  // the fluid of one de-icing (less with glycol recovery)
  glycol() { Finance.book('deicing', -GLYCOL_COST * (Systems.working('deice') >= 3 ? 1 - GLYCOL_RECOVER : 1)); }
};
