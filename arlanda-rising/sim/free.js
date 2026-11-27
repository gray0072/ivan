'use strict';

// Arlanda Rising — Free Play (spec/freeplay.md): one airport from the pine forest of 1958 on, with no missions and no
// stages — the time runs all the way. A played day stands for a month: each month the 15th (FREE_DAY_OF_MONTH) is flown
// flight by flight from 05:00 (FREE_DAY_FROM) to 23:30 (FREE_DAY_TO) by the same ops modules as a mission's stage; then
// the night runs the other days up to the next month's 15th in summary, one Plan.dayCore a step (building, the traffic in
// summary, the running costs, the people, the systems, the month's books) — and the played day's own rest with them (its
// building and the costs of the hours not flown; its traffic was flown). The game is a mission of its own (id 'free', its
// definition kept in the state) with two stages that take turns: 0 the night, 1 the played day (S.ops), made afresh at
// every dawn; its plan state (S.plan: the crews, the small builds being fitted) stays all the time, so the player builds,
// hires and buys in the day too (what is bought in the day is there at once, at night at dawn).
//
// The history: the campaign's missions are its milestones, in their order. Each dawn the history's year (S.free.year)
// moves on at its chapter's pace (FREE_CHAPTER_MONTHS) — but never past the date of the next milestone whose projects
// (its `requires`) the player has not built yet. A milestone reached (its date passed, its projects standing) brings what
// the history brought then (its setup's FREE_HISTORY_KEYS: the owner's budget, the airlines' routes of the year, the rules
// of the time, the levels the Office may buy…), its owner's grants, and opens the projects of its setup; the projects the
// next milestone needs are open for building all the time. The calendar's months run one a played month (the seasons),
// its year is the history's (Calendar.year / yearOf, S.free.years).
//
// The day's flights come from the airlines' routes, spread over the day by the waves of each airline's kind
// (data/freeplay.js FREE_WAVES), with the month's weather (FREE_CLIMATE); a based airline's late arrivals stay the night on
// their stands and leave in the next morning's wave from the same stand. The pace of the clock is sim/freepace.js;
// `advance` maps real seconds to steps by it. Deterministic: a day is made from the world's seed and the played month
// (`hashOf('free', seed, month)`), and everything else is in S, so a game resumed in a day or a night goes on exactly
// (tools/freeplay-bot.js checks it). Its own state is S.free.

const Free = {
  // a new game: the forest of 1958, the first milestone's budget, then the nights up to the first played day. `opts`:
  // { auto: 'normal' | 'gentle' | 'off' (Auto pace), seed }
  start(difficulty, opts) {
    const o = opts || {};
    const def = { id: 'free', name: 'Free Play', kind: 'free', free: true, date: MISSIONS[0].date, setup: {},
      stages: [{ name: 'Night', mode: 'plan', days: 0, goal: [] }, { name: 'Played day', mode: 'ops', from: FREE_DAY_FROM, to: FREE_DAY_TO, flights: [], goal: [] }],
      goal: [], stars: [] };
    Missions.start('free', difficulty, null, def);
    const seed = hashOf('free', o.seed !== undefined ? o.seed : 'arlanda') >>> 0;
    S.seed = seed; S.rng = seed;
    S.mission.projects = [];
    S.free = { v: 2, month: 0, auto: o.auto || 'normal', watch: false, nightDays: 0, overnight: [], last: null, hand: {}, sample: {},
      year: this.dateYear(MISSIONS[0].date), years: [[S.day, Calendar.date(S.day).y]], next: 0 };
    S.plan.crews = FREE_CREWS + (S.mission.crews || 0);
    this.history(0);
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
    if (S.day < S.plan.end) Plan.dayCore({ moneyX: this.moneyX() });
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
    this.sampleDay();
    Goals.add(S.mission.total, st);
    S.ops = null;
    S.mission.stage = 0;
    S.mission.st = Goals.newStats();
    S.mission.acc = 0;
    S.plan.day0 = S.day;
    S.clock = FREE_DAY_TO;
    Plan.dayCore({ traffic: false, minutes: Math.max(0, 1440 - flown), moneyX: this.moneyX() });
    this.night();
    logEvent('freeDusk', { month: S.free.month });
  },
  // the next played day begins: what was bought at night is there, the history moves on, the day's flights and weather made
  dawn() {
    for (const b of S.plan.buys) Airport.finishBuy(b.kind, b.term);
    S.plan.buys = [];
    Goals.add(S.mission.total, S.mission.st);
    S.free.month++;
    this.history(1);
    const stage = this.dayStage();
    Missions.def().stages[1] = stage;
    S.mission.stage = 1;
    S.mission.st = Goals.newStats();
    S.mission.acc = 0;
    S.mission.hands = People.withHands(stage.hands.slice());
    S.plan.day0 = S.day;
    Ops.begin(stage);
    logEvent('freeDawn', { month: S.free.month });
  },

  // × the money of a night's day — its traffic in summary and its running costs: the history's months a played month
  // stands for at its chapter's pace (`rate`), × FREE_MONEY_X, at least 1 — so the airport earns over the history's years
  // what the campaign's airport earned between its missions, and the projects keep their prices; 1 before the airport
  // opens (the forest years earn nothing, and their costs are the owner's budget's)
  moneyX() { return S.airport.open ? Math.max(1, Math.round(this.rate() * 12 * FREE_MONEY_X * 100) / 100) : 1; },

  // ---------- the played day as a sample of the month ----------
  // a tray task of the player's hands done (`ok`) or left to the duty manager, counted by its domain for the day
  handTask(kind, ok) {
    const d = TASK_DOMAIN[kind];
    if (!d) return;
    const h = S.free.hand = S.free.hand || {}, c = h[d] = h[d] || [0, 0];
    c[ok ? 0 : 1]++;
  },
  // at dusk: the share of each hand domain's tasks the player did becomes the month's sample (a domain with fewer than
  // FREE_SAMPLE_MIN tasks keeps the last one), and the count starts again
  sampleDay() {
    const sm = S.free.sample = S.free.sample || {};
    for (const [d, c] of Object.entries(S.free.hand || {})) if (c[0] + c[1] >= FREE_SAMPLE_MIN) sm[d] = Math.round(c[0] / (c[0] + c[1]) * 100) / 100;
    S.free.hand = {};
  },
  // the share of a hand domain's loss in summary (sim/summary.js) the night counts: all of it with no tray work, less by
  // FREE_DAY_WEIGHT × the share of its tasks the player did in the played day
  manualShare(d) { return 1 - FREE_DAY_WEIGHT * ((S.free.sample || {})[d] || 0); },

  // ---------- the history ----------
  // "1965-05-03" → 1965.34: a date as a year with its part gone
  dateYear(s) { const p = String(s).split('-').map(Number); return p[0] + ((p[1] || 1) - 1) / 12 + ((p[2] || 1) - 1) / 365; },
  // the milestone the history waits for, or null after the last
  pending() { return MISSIONS[S.free.next] || null; },
  // the history has reached the mission `id`
  reached(id) { const i = MISSIONS.indexOf(MISSION[id]); return i >= 0 && i < S.free.next; },
  // what a milestone needs built that is not: its `requires` ("project" or "project.stage") not done yet
  missing(m) {
    return (m.requires || []).filter((r) => { const [p, s] = r.split('.'); return s ? !Construction.stageDone(p, s) : !Construction.done(p); });
  },
  // the year a played month moves the history on: its chapter's years over its months — the chapter of the milestone
  // reached last, whose years run to the next chapter's first milestone
  rate() {
    const m = MISSIONS[Math.max(0, S.free.next - 1)], c = m.chapter;
    const first = (ch) => { const x = MISSIONS.find((y) => y.chapter === ch); return x ? this.dateYear(x.date) : null; };
    const a = first(c), b = first(c + 1) || this.dateYear(MISSIONS[MISSIONS.length - 1].date) + 1;
    return (b - a) / (FREE_CHAPTER_MONTHS[c - 1] || 8);
  },
  // the history moves on by `months` played months: the year, the milestones reached, the projects opened
  history(months) {
    const f = S.free;
    if (months) f.year += this.rate() * months;
    for (let m = this.pending(); m; m = this.pending()) {
      // the owner's projects (the state's runway, Terminal 3, Sky City…) are built by the owner once the history reaches
      // the milestone's date, as between the campaign's missions
      if (f.year >= this.dateYear(m.date) - 1 / 365 - 1e-9) {
        for (const r of this.missing(m)) {
          const [p, s] = r.split('.');
          if (!this.owners(p)) continue;
          if (s) Construction.ownerStage(p, s); else Construction.ownerBuilds(p);
          logEvent('ownerBuilt', { project: p });
        }
      }
      if (this.missing(m).length) { f.year = Math.min(f.year, this.dateYear(m.date) - 1 / 365); break; }
      if (f.year < this.dateYear(m.date)) break;
      this.reach(m);
    }
    const y = Math.floor(f.year + 1e-9);
    if (f.years[f.years.length - 1][1] !== y) f.years.push([S.day, y]);
    if (f.years.length > 400) f.years.splice(1, f.years.length - 400);
    // the ladder: a level of a domain the airport has opens in its year (data/domains.js `from`), as the history's own
    // milestones open them — a team in 1963, the first systems from 1980 (what else it needs, Systems.cannot says)
    for (const d of Object.keys(S.domains)) {
      const L = (DOMAINS[d] || {}).levels || [];
      for (let lv = 1; lv < L.length; lv++) if (L[lv].from && y >= L[lv].from && ((S.unlock || {})[d] || 0) < lv) Missions.unlock(d, lv);
    }
    // the projects the next milestone needs: open for building
    const next = this.pending();
    if (next) for (const r of next.requires || []) { const p = r.split('.')[0]; if (!this.owners(p)) this.open(p); }
  },
  // a project the owner builds: one no mission gives the player to build (the player's pier is theirs)
  owners(id) {
    if (!this._player) {
      this._player = { pier2040: true };
      for (const m of MISSIONS) for (const p of (m.setup || {}).projects || []) this._player[p] = true;
    }
    return !this._player[id];
  },
  // a milestone reached: what the history brought then
  reach(m) {
    const u = {}, s = m.setup || {};
    for (const k of FREE_HISTORY_KEYS) if (s[k] !== undefined) u[k] = s[k];
    if (u.airlines && !S.airport.runways.length) delete u.airlines;
    Missions.setup(u);
    S.mission.grants = S.mission.grants.concat(m.grants || []);
    for (const p of s.projects || []) this.open(p);
    Construction.grants();
    S.free.next++;
    logEvent('history', { id: m.id, year: Math.floor(this.dateYear(m.date)) });
  },
  // a project open for building, in the plan panel's list (the player's pier: the plain finger design)
  open(id) {
    if (!PROJECTS[id]) return;
    const p = Construction.open(id);
    if (id === 'pier2040' && !S.airport.pierDesign) { S.airport.pierDesign = 'finger'; p.k = PROJECTS.pier2040.designs.finger.k; }
    // the train of a concession: its partner builds it with its own money
    if (id === 'arlandaExpress' && S.airport.trainDeal === 'concession' && !p.done) p.finance = 'partner';
    if (S.mission.projects.indexOf(id) < 0) S.mission.projects.push(id);
  },
  // a cheat: the owner builds what the next milestone needs and the history reaches it at once
  cheatNext() {
    const m = this.pending();
    if (!m) return null;
    for (const r of this.missing(m)) { const [p, s] = r.split('.'); this.open(p); if (s) Construction.ownerStage(p, s); else Construction.ownerBuilds(p); }
    S.free.year = Math.max(S.free.year, this.dateYear(m.date));
    this.history(0);
    return m;
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
  // every kind of task of the domains the airport has, once it has what the task is done with (a fuel truck, a plough, a
  // mobile charger, a de-icing truck, a lane, a booth; before its first fuel truck the oil company fuels by itself): those
  // still at level 0 are the player's hands
  hands() {
    const has = { fuel: Airport.fuelTrucks() > 0, plough: Airport.count('plough') > 0, charge: Airport.count('mcharger') > 0, deice: Airport.count('deicer') > 0,
      checkin: S.airport.desks > 0, lane: (S.airport.lanes || 0) > 0, booth: (S.airport.booths || 0) > 0 };
    const out = [];
    for (const d of Object.keys(S.domains)) for (const k of (DOMAINS[d] || {}).tasks || []) if (has[k] !== false) out.push(k);
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
    // no traffic before the airport opens (its runway, apron and terminal standing: the history's milestone 1-4)
    if (!S.airport.open || !S.airport.runways.length) return out;
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
