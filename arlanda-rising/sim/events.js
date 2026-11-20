'use strict';

// Arlanda Rising — the events of an ops stage beyond the old scripted ones (session 5): a thunderstorm that closes every
// runway for a while, a moose or a flock of geese on the arrivals' runway, a lost child who stops the security lanes, a
// stand kept for a state flight, a bad software update, the ash cloud that closes the sky. A mission's stage may script
// them (`events: [{ at, do, min, text }]`), and from chapter 5 a mission may turn on the random ones (setup `events`,
// data/events.js): one at most per ops stage, made at the stage's start from the state's own generator, so a resumed
// stage has the same one. The random one waits in S.ops.rnd; the stands kept and the lanes stopped come back by
// themselves. Used by sim/ops.js; the screens show the event's line (log `randomEvent`).

const Events = {
  // at an ops stage's start: perhaps a random event later in it
  begin(stage) {
    if (!S.airport.events || stage.calm) return;
    if (rand() >= EVENT_CHANCE * diff().weather) return;
    const m = Calendar.month(), list = RANDOM_EVENTS.filter((e) => !e.months || e.months.indexOf(m) >= 0);
    let w = 0;
    for (const e of list) w += e.weight;
    let r = rand() * w, pick = list[0];
    for (const e of list) { r -= e.weight; if (r < 0) { pick = e; break; } }
    const span = Math.max(0, S.ops.to - S.ops.from - EVENT_GAP - 40);
    S.ops.rnd = { id: pick.id, at: S.ops.from + EVENT_GAP + Math.round(rand() * span), done: false,
      min: pick.min ? Math.round(randRange(pick.min[0], pick.min[1])) : 0 };
  },
  // every ops step: the random event when it is due, the stands kept and the lanes stopped given back
  step() {
    const o = S.ops;
    if (o.rnd && !o.rnd.done && S.clock >= o.rnd.at) {
      o.rnd.done = true;
      const e = RANDOM_EVENTS.find((x) => x.id === o.rnd.id);
      this.run(e.do, o.rnd.min);
      logEvent('randomEvent', { id: e.id, text: e.text });
      if (e.pax) o.paxAfter = { at: S.clock + o.rnd.min, pts: e.pax };
    }
    if (o.paxAfter && S.clock >= o.paxAfter.at) { Meters.change({ passengers: o.paxAfter.pts }); o.paxAfter = null; }
    if (o.kept) {
      o.kept = o.kept.filter((k) => {
        if (S.clock < k.until) return true;
        const st = Airport.stand(k.stand);
        if (st) st.closed = false;
        return false;
      });
    }
  },
  // a scripted event of the stage that is one of these: true when it was
  scripted(e) {
    if (['storm', 'wildlife', 'secPause', 'vipStand', 'update', 'ash'].indexOf(e.do) < 0) return false;
    this.run(e.do, e.min || 0);
    return true;
  },
  run(kind, min) {
    const t = S.clock, o = S.ops;
    if (kind === 'storm') {
      for (const rw of S.airport.runways) this.close(rw, t + min, 'storm');
    } else if (kind === 'wildlife') {
      const rw = Runways.forArr();
      if (rw) this.close(rw, t + min, 'wildlife');
    } else if (kind === 'ash') {
      // the airspace closes: nothing lands or takes off for the rest of the stage
      for (const rw of S.airport.runways) this.close(rw, o.to + OPS_OVERTIME + 600, 'ash');
      o.ash = true;
    } else if (kind === 'secPause') {
      o.secPause = t + min;
    } else if (kind === 'vipStand') {
      // the biggest stand by the terminal that is free now
      const st = S.airport.stands.filter((s) => s.contact && !s.closed && !s.occ && !s.res)
        .sort((a, b) => SIZE_CODES.indexOf(b.code) - SIZE_CODES.indexOf(a.code))[0];
      if (st) { st.closed = true; (o.kept = o.kept || []).push({ stand: st.id, until: t + (min || VIP_STAND_MIN) }); }
    } else if (kind === 'emergency') {
      Ops.event({ do: 'emergency' });
    } else if (kind === 'update') {
      const d = Object.keys(S.domains).filter((x) => S.domains[x] >= 2 && !Systems.down(x)).sort()[0];
      if (d) Systems.fail(d);
    }
  },
  close(rw, until, why) {
    if (rw.closedUntil && rw.closedUntil > until) return;
    rw.closedUntil = until;
    rw.closedFor = why;
  },
  // the security lanes stopped (a lost child)
  secPaused() { return !!(S.ops && S.ops.secPause && S.clock < S.ops.secPause); }
};
