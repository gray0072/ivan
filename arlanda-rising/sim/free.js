'use strict';

// Arlanda Rising — Free Play from the forest, the non-stop driver (spec/freeplay.md, step 1 of its plan: the time core).
// A played day stands for a month: each month the 15th (FREE_DAY_OF_MONTH) is flown flight by flight from 05:00
// (FREE_DAY_FROM) to 23:30 (FREE_DAY_TO) by the same ops modules as a mission's stage; then the night runs the other days up
// to the next month's 15th in summary, one Plan.dayCore a step (building, the traffic in summary, the running costs, the
// people, the systems, the month's books) — and the played day's own rest with them (its building and the costs of the
// hours not flown; its traffic was flown). The game is a mission of its own (id 'free', its definition kept in the state)
// with two stages that take turns: 0 the night (S.plan), 1 the played day (S.ops), made afresh at every dawn from the
// airlines' routes, spread over the day by the waves of each airline's kind (data/freeplay.js FREE_WAVES), with the
// month's weather (FREE_CLIMATE). A based airline's late arrivals stay the night on their stands and leave in the next
// morning's wave from the same stand. The small builds bought at night are there at dawn. The pace of the clock is
// sim/freepace.js; `advance` maps real seconds to steps by it. Deterministic: a day is made from the world's seed and the
// played month (`hashOf('free', seed, month)`), and everything else is in S, so a game resumed in a day or a night goes on
// exactly (tools/freeplay-bot.js checks it). Its own state is S.free. Today's rounds (sim/freeplay.js) still run the
// Free Play of the start screen until step 5 of the plan.

const Free = {
  // a new game from an era preset (FREE_ERAS): the era's airport built by the owner, then the nights up to the first
  // played day. `opts`: { auto: 'normal' | 'gentle' | 'off' } (Auto pace)
  start(eraId, difficulty, opts) {
    const era = FREE_ERAS.find((x) => x.id === eraId);
    if (!era) throw new Error('no Free Play era ' + eraId);
    const def = { id: 'free', name: era.name, kind: 'free', free: true, date: era.date, requires: era.requires, setup: era.setup,
      stages: [{ name: 'Night', mode: 'plan', days: 0, goal: [] }, { name: 'Played day', mode: 'ops', from: FREE_DAY_FROM, to: FREE_DAY_TO, flights: [], goal: [] }],
      goal: [], stars: [] };
    Missions.start('free', difficulty, null, def);
    S.free = { v: 1, era: eraId, month: 0, auto: (opts && opts.auto) || 'normal', watch: false, nightDays: 0, overnight: [], last: null };
    S.plan.crews = FREE_CREWS + (S.mission.crews || 0);
    this.night();
  },
  on() { return !!(S && S.free); },
  // the first played day on or after `day`: the 15th of its month, else of the next one
  nextPlayed(day) {
    const d = Calendar.date(day);
    const t = Calendar.dayOf(d.y, d.m, FREE_DAY_OF_MONTH);
    return t >= day ? t : Calendar.dayOf(d.m === 12 ? d.y + 1 : d.y, d.m === 12 ? 1 : d.m + 1, FREE_DAY_OF_MONTH);
  },
  // the night begins: it runs to the next played day
  night() {
    S.plan.end = this.nextPlayed(S.day);
    S.free.nightDays = S.plan.end - S.day;
  },

  // one step of the game: a step of the played day (OPS_STEP_MIN), or a day of the night
  step() {
    if (S.ops) {
      Ops.step();
      if (Ops.ended()) this.dusk();
      return;
    }
    if (S.day < S.plan.end) Plan.dayCore();
    if (S.day >= S.plan.end) this.dawn();
  },
  // real seconds at a speed become steps by the pace (sim/freepace.js): S.mission.acc is the part of the next step run
  advance(realSec, speed) {
    let budget = realSec * speed, n = 0;
    let cost = FreePace.ease(FreePace.stepSeconds(), realSec);
    while (budget > 0 && Sim.playing() && n < FREE_STEPS_FRAME_MAX) {
      const need = (1 - S.mission.acc) * cost;
      if (budget < need) { S.mission.acc += budget / cost; break; }
      budget -= need;
      S.mission.acc = 0;
      const wasOps = !!S.ops;
      this.step();
      n++;
      // a new step may be at another pace (a task came, the day ended): eased on the next frame, at once at dusk and dawn
      cost = wasOps === !!S.ops ? Math.max(cost, FreePace.stepSeconds()) : FreePace.ease(FreePace.stepSeconds(), 0);
    }
  },

  // the played day is over: the aircraft staying the night noted, the night begun with the played day's own rest
  dusk() {
    Ops.end();
    const o = S.ops, st = S.mission.st, flown = S.clock - o.from;
    S.free.overnight = o.flights.filter((f) => f.stay && f.nightstop && f.inBlock !== null && !Flights.over(f)).map((f) => {
      const p = { al: f.al, type: f.type, stand: f.stand, load: Math.round(f.booked / Math.max(1, AIRCRAFT[f.type].seats) * 100) / 100 || 0.7 };
      if (f.intl !== (AIRLINES[f.al] || {}).intl) p.intl = f.intl;
      return p;
    });
    S.free.last = { month: S.free.month, day: S.day, arr: st.arr, dep: st.dep, onTime: st.onTime, lost: st.diverted + st.cancelled,
      tasks: st.tasksPlayer, duty: st.tasksDuty, people: st.tasksPeople, minutes: Math.round(flown), income: Math.round(st.income), cost: Math.round(st.cost) };
    Goals.add(S.mission.total, st);
    S.ops = null;
    S.mission.stage = 0;
    S.mission.st = Goals.newStats();
    S.mission.acc = 0;
    S.plan = { day0: S.day, end: S.day, crews: FREE_CREWS + (S.mission.crews || 0), buys: [], pending: null, choices: [], extra: [] };
    S.clock = FREE_DAY_TO;
    Plan.dayCore({ traffic: false, minutes: Math.max(0, 1440 - flown) });
    this.night();
    logEvent('freeDusk', { month: S.free.month });
  },
  // the next played day begins: what was bought at night is there, the day's flights and weather made
  dawn() {
    for (const b of S.plan.buys) Airport.finishBuy(b.kind, b.term);
    Goals.add(S.mission.total, S.mission.st);
    S.plan = null;
    S.free.month++;
    const stage = this.dayStage();
    Missions.def().stages[1] = stage;
    S.mission.stage = 1;
    S.mission.st = Goals.newStats();
    S.mission.acc = 0;
    S.mission.hands = People.withHands(stage.hands.slice());
    Ops.begin(stage);
    logEvent('freeDawn', { month: S.free.month });
  },

  // ---------- the played day ----------
  dayStage() {
    let rs = hashOf('free', S.seed, S.free.month);
    const rnd = () => { const r = rngNext(rs); rs = r[1]; return r[0]; };
    const m = Calendar.month();
    const flights = this.flights(rnd, m), weather = this.weather(rnd, m);
    return { name: 'Played day', mode: 'ops', from: FREE_DAY_FROM, to: FREE_DAY_TO, weather, flights, hands: this.hands(), goal: [],
      desks: (S.domains.checkin || 0) > 0 ? S.airport.desks : FREE_DESKS_DAWN };
  },
  // every kind of task of the domains the airport has: those still at level 0 are the player's hands
  hands() {
    const out = [];
    for (const d of Object.keys(S.domains)) for (const k of (DOMAINS[d] || {}).tasks || []) out.push(k);
    return out;
  },
  // the day's flights: last night's aircraft leaving in the morning wave, then each route's flights of the day (its perDay
  // by the season and the demand, rounded by chance) at their places in their airline's wave
  flights(rnd, m) {
    const out = [], season = m >= 6 && m <= 8 ? 1.2 : (m === 12 || m <= 2) ? 0.9 : 1;
    let base = 100;
    const parked = S.free.overnight || [];
    parked.forEach((p, i) => {
      const at = Math.round(FREE_MORNING_DEP[0] + (FREE_MORNING_DEP[1] - FREE_MORNING_DEP[0]) * (i + 0.5) / parked.length);
      const line = { al: p.al, type: p.type, n: 1, from: at, to: at, parked: true, load: p.load, parkAt: p.stand, base: 900 + i };
      if (p.intl !== undefined) line.intl = p.intl;
      out.push(line);
    });
    for (const code of Object.keys(S.airlines)) {
      const kind = (AIRLINES[code] || {}).kind, wave = FREE_WAVES[kind] || FREE_WAVES.network;
      const based = FREE_NIGHTSTOP_KINDS.indexOf(kind) >= 0;
      for (const r of S.airlines[code].routes || []) {
        if (r.months && r.months.indexOf(m) < 0) continue;
        const x = r.perDay * season * (AIRCRAFT[r.type].cargo ? 1 : Summary.demand());
        const n = Math.floor(x) + (rnd() < x - Math.floor(x) ? 1 : 0), turn = FREE_TURN[r.type] || 45;
        for (let i = 0; i < n; i++) {
          let at = clamp(this.waveAt(wave, (i + 0.5) / n) + (rnd() * 2 - 1) * FREE_JITTER_MIN, FREE_DAY_FROM + 20, FREE_LAST_DEP);
          const night = based && at >= FREE_NIGHTSTOP_FROM;
          if (!night) at = Math.min(at, FREE_LAST_DEP - turn);
          at = Math.round(at);
          const line = { al: code, type: r.type, n: 1, from: at, to: at, turn: night ? 1440 : turn, load: r.load || 0.7, base };
          if (night) { line.stay = true; line.nightstop = true; }
          for (const k of ['intl', 'ns', 'cargo']) if (r[k] !== undefined) line[k] = r[k];
          out.push(line);
        }
        base += 100;
      }
    }
    return out;
  },
  // the minute of the day at the share `q` (0..1) of a wave's arrivals
  waveAt(wave, q) {
    const total = wave.reduce((s, w) => s + w, 0);
    let left = q * total;
    for (let h = 0; h < 24; h++) {
      if (left <= wave[h] && wave[h] > 0) return h * 60 + 60 * left / wave[h];
      left -= wave[h];
    }
    return FREE_LAST_DEP;
  },
  // the played day's weather from the month's climate: the temperature, the wind, perhaps a snowfall or a morning fog
  weather(rnd, m) {
    const c = FREE_CLIMATE[m - 1];
    const w = { temp: Math.round(c.temp + (rnd() * 2 - 1) * 4), wind: [[20, 190, 210, 240, 270][Math.floor(rnd() * 5)], Math.round(5 + rnd() * 12)] };
    if (rnd() < c.snow) {
      const t0 = Math.round(FREE_DAY_FROM + rnd() * (FREE_DAY_TO - FREE_DAY_FROM - 240));
      w.snow = [[t0, t0 + Math.round(60 + rnd() * 120), Math.round((1 + rnd() * 2) * 10) / 10]];
      w.temp = Math.min(w.temp, -1);
    }
    if (rnd() < c.fog) {
      const t0 = Math.round(FREE_DAY_FROM + rnd() * 120);
      w.fog = [[t0, t0 + Math.round(40 + rnd() * 50), 200 + Math.round(rnd() * 300)]];
    }
    return w;
  },

  // the nights a piece of work of `days` more days takes (hiring, a system, a clearance; a project's stage passes its days
  // × FREE_BUILD_X): the dawns until the first one it is done by — 1 is *Ready tomorrow*, 3 *in 3 nights*
  nights(days) {
    const end = S.day + days;
    let d = S.ops ? this.nextPlayed(S.day + 1) : S.plan.end, n = 1;
    while (d < end && n < 1200) { d = this.nextPlayed(d + 1); n++; }
    return n;
  }
};
