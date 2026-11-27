'use strict';

// Arlanda Rising — the pace of Free Play (spec/freeplay.md "Adaptive pace"): which pace the clock runs at and why, and the
// real seconds the next sim step takes at ▶. Attention — the missions' OPS_HOUR_SECONDS a game hour — while the player
// has something to do: a task in the tray, a task for their hands due within FREE_LOOKAHEAD_MIN, a snowfall about to
// begin while the ploughs are theirs, an emergency or a system down with no one beside it, 👁️ Watch held, or Auto pace Off; cruise (Normal or
// Gentle) when nothing needs them; the night, FREE_NIGHT_SECONDS for all of it; a played day with no traffic at all,
// FREE_IDLE_DAY_SECONDS. The sim steps the same whatever the pace (OPS_STEP_MIN in the day, a day at night), so the pace
// never changes a result: it only maps real seconds to steps (sim/free.js `advance`, through Sim.advance), and
// tools/freeplay-bot.js counts a game's real time from the same `stepSeconds`. The easing from one pace to the next
// (`ease`) is the screen's own and lives outside S.

const FreePace = {
  cur: null,     // the eased real seconds of a step (the screen's, not saved)
  night: null,   // … and whether it was a night step

  // a kind of task the player's hands do now: theirs in this game, and its domain not worked by a team or a system
  hand(kind) { return S.mission.hands.indexOf(kind) >= 0 && !(Systems.working(TASK_DOMAIN[kind]) > 0); },

  // the pace now and why: { pace: 'attention' | 'cruise' | 'night' | 'idle', why, n }
  mode() {
    if (!S.ops) return { pace: 'night', why: 'night' };
    if (!S.ops.flights.length) return { pace: 'idle', why: 'idle' };
    if (S.free.watch) return { pace: 'attention', why: 'watch' };
    if (S.free.auto === 'off') return { pace: 'attention', why: 'off' };
    if (S.ops.tasks.length) return { pace: 'attention', why: 'tray', n: S.ops.tasks.length };
    const why = this.soon();
    return why ? { pace: 'attention', why } : { pace: 'cruise', why: 'cruise' };
  },
  // what is about to need the player within FREE_LOOKAHEAD_MIN: 'soon' (a task for their hands), 'snow', 'incident', or null
  soon() {
    const t = S.clock, look = t + FREE_LOOKAHEAD_MIN;
    const stand = this.hand('stand'), fuel = this.hand('fuel'), bags = this.hand('bags'), ann = this.hand('announce');
    for (const f of S.ops.flights) {
      if (Flights.over(f)) continue;
      if (f.mayday) return 'incident';
      const coming = f.st === 'sched' || f.st === 'inbound' || f.st === 'approach' || f.st === 'taxiIn' || f.st === 'waitStand';
      if (coming && f.eta !== null) {
        // a stand to pick before it lands; the carts and the fuel once it is in
        if (stand && !f.stand && f.eta - STAND_TASK_LEAD <= look) return 'soon';
        if ((fuel || bags) && f.eta <= look) return 'soon';
      }
      const tr = f.tr;
      if (tr && tr.ready === null) {
        if (fuel && tr.fuel === 'wait' && tr.off <= look) return 'soon';
        if (ann && !f.ann && f.booked > 0 && f.std + ANNOUNCE_LEAD <= look) return 'soon';
      }
    }
    // a snowfall about to begin while the ploughs are the player's (once it lies, the plough tasks in the tray keep the pace)
    if (this.hand('plough') && S.ops.weather.snow.some((p) => p[0] > t && p[0] <= look)) return 'snow';
    // a system down with nobody beside it: its tasks come to the tray
    if (S.ops.down && Object.keys(S.ops.down).some((d) => Systems.working(d) === 0)) return 'incident';
    return null;
  },
  // real seconds per game hour at ▶ by day
  hourSeconds(pace) {
    if (pace === 'attention') return OPS_HOUR_SECONDS;
    return S.free.auto === 'gentle' ? FREE_GENTLE_HOUR_SECONDS : FREE_CRUISE_HOUR_SECONDS;
  },
  // real seconds the next step takes at ▶ (`mode` worked out already, or now)
  stepSeconds(mode) {
    const m = mode || this.mode();
    if (m.pace === 'night') return FREE_NIGHT_SECONDS / Math.max(1, S.free.nightDays);
    if (m.pace === 'idle') return FREE_IDLE_DAY_SECONDS * OPS_STEP_MIN / (FREE_DAY_TO - FREE_DAY_FROM);
    return this.hourSeconds(m.pace) * OPS_STEP_MIN / 60;
  },
  // the step's seconds the screen runs at: eased toward `target` over FREE_PACE_EASE real seconds (within a day or a
  // night; dusk and dawn jump at once)
  ease(target, realSec) {
    const night = !S.ops;
    if (this.cur === null || night !== this.night || !(realSec > 0)) { this.cur = target; this.night = night; return target; }
    this.cur *= Math.pow(target / this.cur, Math.min(1, 3 * realSec / FREE_PACE_EASE));
    return this.cur;
  }
};
