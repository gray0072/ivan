'use strict';

// Arlanda Rising — the departing passengers as flows: each flight's passengers come to the terminal between
// PAX_ARRIVE_FIRST and PAX_ARRIVE_LAST minutes before departure and join one check-in queue (first come,
// first served) that the open desks work through. From chapter 4 (S.airport.lanes) they then queue for security,
// where every lane works. Once through, the time left for the shops (more free time airside = more spending: the
// cafés and the brands of the flight's terminal, sim/terminal.js), the car park's takings and the train's are
// counted. The waits, the longest wait and the passengers through are counted as they pass; a long check-in queue
// makes the "open a desk" task. Session 5: the flights outside Schengen queue a third time, at the border's passport
// booths, after security; a long queue there makes the "open a booth" task, and with security a domain of its own, a
// long security queue the "open a lane" task. Used by sim/ops.js, sim/turnaround.js (boarding waits for them).

const Passengers = {
  // minutes a passenger joining the queue now would wait
  wait() {
    const q = S.ops.queue.reduce((s, c) => s + c[1], 0);
    if (q < 0.5) return 0;
    return S.ops.desksOpen > 0 ? q / (S.ops.desksOpen * DESK_RATE * People.deskRate()) : 999;
  },
  // … at security
  secWait() {
    const lanes = Terminal.lanes(), q = (S.ops.sec || []).reduce((s, c) => s + c[1], 0);
    if (q < 0.5 || !lanes) return 0;
    return q / (lanes * Terminal.laneRate());
  },
  // … at the border (session 5)
  borderWait() {
    const b = Terminal.booths(), q = (S.ops.border || []).reduce((s, c) => s + c[1], 0);
    if (q < 0.5) return 0;
    return b ? q / (b * Terminal.boothRate()) : 999;
  },
  queued(f) {
    return S.ops.queue.some((c) => c[0] === f.id) || (S.ops.sec || []).some((c) => c[0] === f.id) || (S.ops.border || []).some((c) => c[0] === f.id);
  },
  // a flight that will not leave from here: its passengers leave the queues
  drop(f) {
    S.ops.queue = S.ops.queue.filter((c) => c[0] !== f.id);
    if (S.ops.sec) S.ops.sec = S.ops.sec.filter((c) => c[0] !== f.id);
    if (S.ops.border) S.ops.border = S.ops.border.filter((c) => c[0] !== f.id);
  },

  step(dt) {
    const t = S.clock, o = S.ops;
    if (!S.airport.desks) return;
    // new passengers at the doors
    const span = PAX_ARRIVE_FIRST - PAX_ARRIVE_LAST;
    for (const f of o.flights) {
      if (!f.booked || f.st === 'diverted' || f.st === 'cancelled' || f.st === 'gone' || f.st === 'taxiOut') continue;
      const a = f.std - PAX_ARRIVE_FIRST, b = f.std - PAX_ARRIVE_LAST;
      if (t + dt <= a || t >= b) continue;
      const n = f.booked * (Math.min(t + dt, b) - Math.max(t, a)) / span;
      this.join(o.queue, f.id, n, t);
    }
    // the desks work through the queue
    let cap = o.desksOpen * DESK_RATE * People.deskRate() * dt;
    const st = S.mission.st, lanes = Terminal.lanes();
    while (cap > 1e-9 && o.queue.length) {
      const c = o.queue[0], x = Math.min(cap, c[1]);
      c[1] -= x; cap -= x;
      const f = this.flight(c[0]), w = t - c[2];
      if (f) {
        f.waitSum += x * w; f.paxServed += x;
        if (lanes) this.join(o.sec, f.id, x, t); else this.through(f, x, t);
      }
      st.paxServed += x; st.paxWaitSum += x * w; st.maxWait = Math.max(st.maxWait, w);
      if (c[1] < 1e-6) o.queue.shift();
    }
    Finance.book('desks', -o.desksOpen * DESK_COST_HOUR * dt / 60);
    // security: every lane works (session 5: every lane opened)
    if (lanes) {
      // a lost child stops the lanes for a while (session 5)
      let sc = Events.secPaused() ? 0 : lanes * Terminal.laneRate() * dt;
      while (sc > 1e-9 && o.sec.length) {
        const c = o.sec[0], x = Math.min(sc, c[1]);
        c[1] -= x; sc -= x;
        const f = this.flight(c[0]), w = t - c[2];
        if (f) {
          f.secWait = (f.secWait || 0) + x * w; f.secServed = (f.secServed || 0) + x;
          // session 5: a flight outside Schengen goes on to passport control
          if (Terminal.nonSchengen(f)) this.join(o.border = o.border || [], f.id, x, t); else this.through(f, x, t);
        }
        st.secServed = (st.secServed || 0) + x; st.secWaitSum = (st.secWaitSum || 0) + x * w;
        if (c[1] < 1e-6) o.sec.shift();
      }
      Finance.book('security', -lanes * LANE_COST_HOUR * dt / 60);
    }
    // the border: the booths open work through its queue
    if (o.border && o.border.length) {
      let bc = Terminal.booths() * Terminal.boothRate() * dt;
      while (bc > 1e-9 && o.border.length) {
        const c = o.border[0], x = Math.min(bc, c[1]);
        c[1] -= x; bc -= x;
        const f = this.flight(c[0]), w = t - c[2];
        if (f) { f.borderWait = (f.borderWait || 0) + x * w; f.borderServed = (f.borderServed || 0) + x; this.through(f, x, t); }
        st.borderServed = (st.borderServed || 0) + x; st.borderWaitSum = (st.borderWaitSum || 0) + x * w;
        if (c[1] < 1e-6) o.border.shift();
      }
    }
    // a long queue: open a desk (session 5: a lane, a booth)
    if (this.wait() >= CHECKIN_TASK_WAIT && o.desksOpen < S.airport.desks && !Tasks.pending('checkin', 'desks')) Tasks.need('checkin', 'desks');
    if (Terminal.secDomain() && lanes && lanes < Terminal.lanesUp() && !Tasks.pending('lane', 'lanes')) {
      const at = Systems.working('security') >= 2 ? SEC_SENSOR_WAIT : SEC_TASK_WAIT;
      if (this.secWait() >= at) Tasks.need('lane', 'lanes');
    }
    if (Terminal.borderOn() && S.domains.border !== undefined && Terminal.booths() < S.airport.booths && !Tasks.pending('booth', 'booths')) {
      const at = Systems.working('border') >= 2 ? SEC_SENSOR_WAIT : BORDER_TASK_WAIT;
      if (this.borderWait() >= at) Tasks.need('booth', 'booths');
    }
  },
  // passengers join the end of a queue (one group per flight and minute)
  join(q, id, n, t) {
    const last = q[q.length - 1];
    if (last && last[0] === id && t - last[2] < 1) last[1] += n;
    else q.push([id, n, t]);
  },
  // passengers through to the gates: what they spend in the time left before boarding, the car park, the train
  through(f, x, t) {
    f.checked += x;
    const free = clamp((f.std - BOARD_LEAD - t) / SHOP_MINUTES_FULL, 0, 1);
    Finance.book('shops', x * SHOP_SPEND * Airport.shopShare() * free);
    const brands = Terminal.spendOf(f);
    if (brands) { Finance.book('shops', x * brands * free); S.mission.st.brandsIn = (S.mission.st.brandsIn || 0) + x * brands * free; }
    // session 5: Sky City's brands, landside, whatever the time left
    const sky = S.airport.units ? Terminal.skySpend(f.intl, Terminal.leisure(f.al), Calendar.month()) : 0;
    if (sky) { Finance.book('shops', x * sky); S.mission.st.brandsIn = (S.mission.st.brandsIn || 0) + x * sky; }
    Finance.book('parking', x * PARKING_PER_PAX * Airport.parkingShare());
    Finance.book('rail', x * Terminal.trainIncome());
  },
  flight(id) { return Flights.get(id); }
};
