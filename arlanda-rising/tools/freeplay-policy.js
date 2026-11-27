'use strict';

// Arlanda Rising — the Free Play director bot's policy (spec/freeplay.md "The bot"): test code, loaded into the vm context
// of tools/freeplay-bot.js after the game's logic (tools/sim-files.js), and playing only through what a player can do
// (sim/actions.js, the tray). It defines `FreeBot`:
//   FreeBot.init(cfg)   cfg: { profile, hands (tasks a real minute), react (real s before a task is touched) }
//   FreeBot.beforeStep(realT)   the player's moves before the next sim step, `realT` the real seconds at ▶ so far
//   FreeBot.dayStats()  what the hands did in the played day so far (and resets at each dawn)
//
// Profiles:
//   reference — plain, sensible play: builds what the next milestone of the history needs as soon as a crew is free
//               (borrowing what the cash lacks, keeping a reserve), equips the airport like the campaign's airport of the
//               time (the vehicles, desks, teams, systems and IT people of the milestones' setups, once each is open and
//               affordable), hires a team for a domain whose hand work passes HIRE_LOAD tasks a played day, repays loans
//               when rich;
//   hands     — the same without any team, system or IT person (automation never bought);
//   notray    — the reference, but leaves the tray to the duty manager;
//   idle      — builds, buys and hires nothing; the tray left to the duty manager.
//
// The human hands model: a task in the tray is touched `react` real seconds after it came, at most `hands` tasks a real
// minute, one at a time; real time is what the pace gives (FreePace.stepSeconds — the browser's own function), so the
// adaptive pace and the speed are part of what is measured. A task whose deadline passes first goes to the duty manager.

const FreeBot = {
  cfg: null,
  seen: null,        // task id → the real second it was first seen
  lastCame: null,    // the last played day's tasks that came to the tray, by kind
  free: 0,           // the real second the hands are free again
  day: null,         // the played day's hand work: { tasks, byKind, minutes: { real minute → tasks } }
  // the cash kept back: a month and a half of the running costs, at least RESERVE_MIN
  reserve() { const m = Airport.monthlyCost(); return Math.max(FreeBot.RESERVE_MIN * diff().money, 1.5 * (m.wages + m.upkeep + m.systems + m.interest + (m.security || 0))); },

  init(cfg) {
    this.cfg = Object.assign({ profile: 'reference', hands: 5, react: 3 }, cfg || {});
    this.seen = {};
    this.free = 0;
    this.newDay();
  },
  // a new played day: the last one's tasks that came to the tray, by kind, kept for the hiring
  newDay() { if (this.day) this.lastCame = this.day.came; this.day = { tasks: 0, byKind: {}, came: {}, minutes: {} }; },
  dayStats() { return this.day; },

  beforeStep(realT) {
    const p = this.cfg.profile;
    if (S.plan && S.plan.pending) { const def = Plan.pendingDef(); Plan.choose(def.default); }
    if (p !== 'idle') {
      // the player's planning moves: at night every day, in the day every half hour of the clock
      if (!S.ops || Math.abs(S.clock % 30) < OPS_STEP_MIN / 2) {
        this.build();
        if (!S.ops) {
          this.kit();
          if (p !== 'hands') this.staff();
          this.repay();
        }
      }
    }
    if (S.ops) this.watch(realT);
    if (S.ops && p !== 'idle' && p !== 'notray') this.tray(realT);
  },

  // the tasks that came to the tray: the real second each was first seen, and the day's count by kind
  watch(realT) {
    for (const t of S.ops.tasks) if (this.seen[t.id] === undefined) { this.seen[t.id] = realT; this.day.came[t.kind] = (this.day.came[t.kind] || 0) + 1; }
  },

  // ---------- the tray, by human hands ----------
  tray(realT) {
    const tasks = S.ops.tasks;
    if (realT < this.free || !tasks.length) return;
    // the oldest task first, as a person reads the tray
    let best = null;
    for (const t of tasks) if (realT - this.seen[t.id] >= this.cfg.react && (!best || t.due < best.due)) best = t;
    if (!best) return;
    const kind = best.kind;
    if (Tasks.doTask(best.id)) {
      this.free = realT + 60 / this.cfg.hands;
      const m = Math.floor(realT / 60);
      this.day.tasks++;
      this.day.byKind[kind] = (this.day.byKind[kind] || 0) + 1;
      this.day.minutes[m] = (this.day.minutes[m] || 0) + 1;
    }
    if (Object.keys(this.seen).length > 400) {
      const live = {};
      for (const t of tasks) live[t.id] = this.seen[t.id];
      this.seen = live;
    }
  },

  // ---------- building ----------
  // every stage the next milestone needs, as soon as a crew is free, borrowing what the cash lacks within the loan room
  build() {
    const m = Free.pending();
    if (!m) return;
    for (const r of Free.missing(m)) {
      const [pid, sid] = r.split('.'), def = PROJECTS[pid], p = Construction.state(pid);
      if (!p) continue;
      for (const s of sid ? [sid] : Object.keys(def.stages).filter((k) => !def.stages[k].optional)) {
        if (Construction.cannot(pid, s)) continue;
        const price = def.stages[s].price * (p.finance === 'grant' ? 1 - GRANT_SHARE : 1);
        if (S.money < price + this.reserve()) Finance.borrow(price + this.reserve() - S.money);
        if (S.money < price + this.reserve() / 2) return;
        Actions.start(pid, s, 'normal');
      }
    }
  },

  // ---------- the airport of the time ----------
  // what the reached milestones' setups gave the campaign's airport: the most of each item, the desks, the domains' levels
  // and the IT people
  target() {
    const t = { items: {}, desks: 0, domains: {}, it: 0 };
    for (let i = 0; i < S.free.next; i++) {
      const s = MISSIONS[i].setup || {};
      for (const k of Object.keys(s.items || {})) t.items[k] = Math.max(t.items[k] || 0, s.items[k]);
      if (s.desks) t.desks = Math.max(t.desks, s.desks);
      for (const d of Object.keys(s.domains || {})) t.domains[d] = Math.max(t.domains[d] || 0, s.domains[d]);
      if (s.it) t.it = Math.max(t.it, s.it);
    }
    return t;
  },
  // the level the Office offers (S.unlock), as the screens do
  open(d, lv) { return ((S.unlock || {})[d] || 0) >= lv; },
  afford(price) { return S.money - price > this.reserve(); },
  // the vehicles and small builds of the time, and the check-in desks
  kit() {
    const t = this.target();
    for (const kind of Object.keys(t.items)) {
      const b = BUILDINGS[kind];
      if (!b || !b.small) continue;
      while (Airport.count(kind) < t.items[kind] && this.afford(b.price) && Actions.buy(kind)) { /* one more */ }
    }
    if (t.desks) while (S.airport.desks < t.desks && this.afford(BUILDINGS.desk.price) && Actions.buy('desk')) { /* one more */ }
  },
  // the teams and systems of the time, and a team for a domain whose hand work is heavy
  staff() {
    const t = this.target();
    for (const d of Object.keys(t.domains)) {
      const lv = S.domains[d] || 0, want = t.domains[d];
      if (lv >= want || S.domains[d] === undefined || !this.open(d, lv + 1)) continue;
      if (Systems.cannot(d, lv + 1)) continue;
      if (!this.afford(Systems.price(d, 'keep', lv + 1) + (lv === 0 ? 3 * Systems.teamWages(d) : 0))) continue;
      if (lv + 1 >= 2) {
        const L = DOMAINS[d].levels[lv + 1];
        if ((L.it || 0) > 0 && (!S.people || S.people.it < Systems.itNeed() + L.it)) People.hireIT(Systems.itNeed() + L.it - (S.people ? S.people.it : 0));
      }
      Actions.upgrade(d, 'keep');
    }
    if (t.it && (!S.people || S.people.it < t.it)) People.hireIT(t.it - (S.people ? S.people.it : 0));
    // a team for the domain whose hand work was heaviest in the last played day
    const by = this.lastCame || {}, load = Object.keys(by).map((k) => [TASK_DOMAIN[k], by[k]]).sort((a, b) => b[1] - a[1]);
    for (const [d, n] of load) {
      if (n < FreeBot.HIRE_LOAD || (S.domains[d] || 0) > 0 || S.domains[d] === undefined || !this.open(d, 1)) continue;
      if (Systems.cannot(d, 1)) continue;
      if (!this.afford(Systems.price(d, 'keep', 1) + 3 * Systems.teamWages(d))) continue;
      Actions.upgrade(d, 'keep');
      break;
    }
  },
  // a loan when the cash runs below the reserve; repaid when rich
  repay() {
    if (S.money < this.reserve() / 2 && Finance.room() > 0) { Finance.borrow(this.reserve() - S.money); return; }
    if (S.loans > 0 && S.money > this.reserve() * 3) Finance.repay(Math.min(S.loans, S.money - this.reserve() * 2));
  }
};
// hand tasks of one kind in a played day above which the reference hires that domain's team (when it may)
FreeBot.HIRE_LOAD = 10;
// SEK kept back at least (× the difficulty's money)
FreeBot.RESERVE_MIN = 5e6;
