'use strict';

// Arlanda Rising — a flight's way through an ops stage: the stand task before it lands, the approach (holding
// while the runway is closed, sent to another airport after HOLD_MAX), the landing, taxiing in, waiting on
// the taxiway when it has no free stand, the turnaround (sim/turnaround.js), pushback, taxiing out and the
// take-off (or a cancellation after DEP_WAIT_MAX). Its delay and the part of it the airport caused are
// counted at pushback. Used by sim/ops.js; the flights live in S.ops.flights.

const Flights = {
  get(id) { return S.ops ? S.ops.flights.find((f) => f.id === id) || null : null; },
  // the flight has left the stage one way or another
  over(f) { return f.st === 'gone' || f.st === 'diverted' || f.st === 'cancelled'; },
  taxiTime(f) { const st = f.stand && Airport.stand(f.stand); return TAXI_BASE + (st ? st.dist : 2); },

  step() {
    const t = S.clock, rw = Runways.inUse();
    // arrivals first, in the order they came to the field, then departures in the order they are ready
    const arr = [], dep = [];
    for (const f of S.ops.flights) {
      switch (f.st) {
        case 'sched':
          if (t >= f.eta - STAND_TASK_LEAD) { f.st = 'inbound'; if (!f.stand) Tasks.need('stand', f.id); }
          break;
        case 'inbound':
          if (t >= f.eta) { f.st = 'approach'; f.holdFrom = t; }
          break;
        case 'approach': arr.push(f); break;
        case 'taxiIn':
          if (t >= f.at) this.toStand(f);
          break;
        case 'waitStand': this.toStand(f); break;
        case 'turn': case 'parked': Turnaround.step(f); break;
        case 'taxiOut': if (t >= f.at) dep.push(f); break;
      }
    }
    // an aircraft in an emergency goes first
    arr.sort((a, b) => (b.mayday ? 1 : 0) - (a.mayday ? 1 : 0) || a.holdFrom - b.holdFrom);
    for (const f of arr) {
      // the fire service must fit the aircraft: a bigger one is sent to another airport
      if (AIRCRAFT[f.type].cat > Airport.fireCat() && !f.mayday && !f.waiver) { this.divert(f, rw, 'fire'); continue; }
      if (Runways.canUse(rw)) this.land(f, rw);
      else if (t - f.holdFrom >= HOLD_MAX) this.divert(f, rw);
    }
    dep.sort((a, b) => a.at - b.at);
    for (const f of dep) {
      if (Runways.canUse(rw)) this.takeOff(f, rw);
      else if (t - f.offBlock >= DEP_WAIT_MAX) this.cancel(f);
    }
  },
  land(f, rw) {
    Runways.use(rw, f, true);
    f.landed = S.clock;
    f.rdir = S.ops.dir;
    f.st = 'taxiIn';
    f.at = S.clock + this.taxiTime(f) + f.extraTaxi;
    f.extraTaxi = 0;
    S.mission.st.arr++;
    // after an emergency landing the runway stays closed while the fire service checks it (longer, and a close
    // call, when the fire category is too low for the aircraft)
    if (f.mayday) {
      const low = AIRCRAFT[f.type].cat > Airport.fireCat();
      rw.closedUntil = S.clock + (low ? EMERGENCY_CLOSE_LOW : EMERGENCY_CLOSE);
      if (low) Meters.closeCall();
      S.mission.st.emergencies++;
      logEvent('emergencyLanded', { flight: f.no, low });
    }
  },
  toStand(f) {
    const st = f.stand && Airport.stand(f.stand);
    if (st && (!st.occ || st.occ === f.id) && (!st.res || st.res === f.id)) {
      if (f.extraTaxi) { f.st = 'taxiIn'; f.at = S.clock + f.extraTaxi; f.extraTaxi = 0; return; }
      st.occ = f.id; st.res = null;
      Turnaround.begin(f);
    } else f.st = 'waitStand';
  },
  pushback(f) {
    f.offBlock = S.clock;
    Stands.release(f);
    f.delay = Math.max(0, S.clock - f.std);
    // the airport's part: later than the aircraft could have gone with everything on time here
    f.adelay = Math.max(0, S.clock - Math.max(f.std, f.earliest || f.std));
    f.st = 'taxiOut';
    f.at = S.clock + this.taxiTime(f);
    const st = S.mission.st;
    st.dep++;
    st.delaySum += f.delay;
    st.adelaySum += f.adelay;
    if (f.delay <= ONTIME_MIN) st.onTime++;
    if (f.adelay > ONTIME_MIN) Finance.book('penalties', -(f.adelay - ONTIME_MIN) * DELAY_PENALTY_MIN);
    this.pay(f);
    Meters.departed(f);
    logEvent('pushback', { flight: f.no, delay: Math.round(f.delay) });
  },
  // the fees of a departure, paid at pushback
  pay(f) {
    const fees = Finance.departureFees(f.type, f.booked - f.missed, f.intl, f.al);
    Finance.book('landing', fees.landing);
    Finance.book('passenger', fees.pax);
    if (f.inBlock !== null && f.offBlock - f.inBlock > STAND_FREE_MIN) Finance.book('stands', (f.offBlock - f.inBlock - STAND_FREE_MIN) / 60 * STAND_FEE_HOUR);
  },
  takeOff(f, rw) {
    Runways.use(rw, f, false);
    f.st = 'gone';
    // for the map: when it rolled and which way
    f.airborne = S.clock;
    f.rdir = S.ops.dir;
  },
  divert(f, rw, why) {
    f.st = 'diverted';
    f.divertedAt = S.clock;
    Stands.release(f);
    Tasks.drop(f.id);
    Passengers.drop(f);
    S.mission.st.diverted++;
    // the airport pays when it caused it (snow, the dark without lights, Safety), not for fog
    const cause = why || Runways.closedWhy(rw);
    if (cause !== 'fog' && cause !== 'wind') Finance.book('penalties', -DIVERT_PENALTY);
    Meters.lost(f);
    logEvent('diverted', { flight: f.no, why: cause });
  },
  cancel(f) {
    f.st = 'cancelled';
    S.mission.st.cancelled++;
    Meters.lost(f);
    logEvent('cancelled', { flight: f.no });
  },
  // at the stage's forced end: what is still here counts as late
  close() {
    for (const f of S.ops.flights) {
      if (this.over(f) || f.st === 'taxiOut') continue;
      if (f.st === 'sched' || f.st === 'inbound') { f.st = 'gone'; continue; }   // still far away: the next stage's
      const st = S.mission.st;
      st.dep++;
      f.delay = Math.max(0, S.clock - f.std);
      st.delaySum += f.delay; st.adelaySum += f.delay;
      f.st = 'gone';
    }
  }
};
