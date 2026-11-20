'use strict';

// Arlanda Rising — the departing passengers as flows: each flight's passengers come to the terminal between
// PAX_ARRIVE_FIRST and PAX_ARRIVE_LAST minutes before departure and join one check-in queue (first come,
// first served) that the open desks work through. The wait, the longest wait, the time left for the café
// (more free time airside = more spending) and the car park's takings are counted as they pass; a long
// queue makes the "open a desk" task. Used by sim/ops.js, sim/turnaround.js (boarding waits for them).

const Passengers = {
  // minutes a passenger joining the queue now would wait
  wait() {
    const q = S.ops.queue.reduce((s, c) => s + c[1], 0);
    if (q < 0.5) return 0;
    return S.ops.desksOpen > 0 ? q / (S.ops.desksOpen * DESK_RATE) : 999;
  },
  queued(f) { return S.ops.queue.some((c) => c[0] === f.id); },
  // a flight that will not leave from here: its passengers leave the queue
  drop(f) { S.ops.queue = S.ops.queue.filter((c) => c[0] !== f.id); },

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
      const last = o.queue[o.queue.length - 1];
      if (last && last[0] === f.id && t - last[2] < 1) last[1] += n;
      else o.queue.push([f.id, n, t]);
    }
    // the desks work through the queue
    let cap = o.desksOpen * DESK_RATE * dt;
    const st = S.mission.st;
    while (cap > 1e-9 && o.queue.length) {
      const c = o.queue[0], x = Math.min(cap, c[1]);
      c[1] -= x; cap -= x;
      const f = this.flight(c[0]), w = t - c[2];
      if (f) {
        f.checked += x; f.waitSum += x * w; f.paxServed += x;
        // the time left before boarding, for the café
        const free = clamp((f.std - BOARD_LEAD - t) / SHOP_MINUTES_FULL, 0, 1);
        Finance.book('shops', x * SHOP_SPEND * Airport.shopShare() * free);
        Finance.book('parking', x * PARKING_PER_PAX * Airport.parkingShare());
      }
      st.paxServed += x; st.paxWaitSum += x * w; st.maxWait = Math.max(st.maxWait, w);
      if (c[1] < 1e-6) o.queue.shift();
    }
    Finance.book('desks', -o.desksOpen * DESK_COST_HOUR * dt / 60);
    // a long queue: open a desk
    if (this.wait() >= CHECKIN_TASK_WAIT && o.desksOpen < S.airport.desks && !Tasks.pending('checkin', 'desks')) Tasks.need('checkin', 'desks');
  },
  flight(id) { return Flights.get(id); }
};
