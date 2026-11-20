'use strict';

// Arlanda Rising — the people (SPEC.md "People"): a department for every domain handed to a team (and IT), with its
// morale, fatigue, skill, wage level and union; the absence of a day (the flu season, July's holidays, morale and
// fatigue, the temps), the share of a team's tasks that fall to the player's tray when it is short or on strike,
// overtime, training, hiring (two weeks, or the clearance's weeks), the wage rounds (accept, counter, the mediator,
// refuse — and the strike a week after the notice) and the managers (their perks and flaws, mood, raises, poaching,
// retiring). S.people is created by the first mission that needs it; a world without it (chapter 1) is untouched.
// The Staff meter is the departments' morale weighted by their jobs. Used by sim/tasks.js, sim/systems.js,
// sim/finance.js (wages), the plan's decisions and the screens.

const People = {
  // the people of the world, made when first needed
  ensure() {
    if (!S.people) S.people = { depts: {}, managers: {}, it: 0, strike: null, asks: [], summer: null, hiring: [] };
    return S.people;
  },
  dept(id) {
    const p = this.ensure();
    if (!p.depts[id]) p.depts[id] = { morale: MORALE_START, fatigue: 0, skill: SKILL_START, wageX: 1, temps: 0, union: { next: S.day + Math.round(WAGE_ROUND_MONTHS * 30.4), mood: 60 } };
    return p.depts[id];
  },
  has(id) { return !!(S.people && S.people.depts[id]); },
  // a manager's perk for a department (0 when none)
  perk(id, key) {
    const m = S.people && S.people.managers[id];
    const v = m && MANAGERS[m.id] && MANAGERS[m.id].perks[key];
    return v || 0;
  },
  manager(id) { return (S.people && S.people.managers[id]) || null; },

  // jobs of a department: its domain's level (a system keeps its own operators and, when kept, the old team)
  jobs(id) {
    if (id === 'it') return S.people ? S.people.it : 0;
    const lv = S.domains[id] || 0, L = DOMAINS[id] && DOMAINS[id].levels;
    if (!L || !lv) return 0;
    let n = L[lv].staff || 0;
    if (lv >= 2 && S.sys && S.sys[id] && S.sys[id].kept) n += L[1].staff || 0;
    return n;
  },

  // ---------- absence ----------
  // the share of a team away today: the season, morale, fatigue, the manager, the difficulty, less the temps
  absence(id) {
    if (!this.has(id) || (DEPTS[id] || {}).police) return 0;
    const d = S.people.depts[id], m = Calendar.month();
    let a = ABSENCE_BASE * (FLU[m] || 1);
    a *= 1 + Math.max(0, MORALE_BASE - d.morale) / 40 + d.fatigue / 100;
    a *= diff().failures * (this.perk(id, 'absence') || 1);
    if (m === 7 && S.people.summer !== 'spread') a += SUMMER_AWAY;
    if (d.temps && d.temps > S.day) a -= TEMPS_COVER;
    return clamp(a, 0, 0.9);
  },
  // the share of a people-level team's work it does itself right now (the rest comes to the tray)
  capacity(id) {
    if (!this.has(id)) return 1;
    if (this.striking(id)) return STRIKE_CAPACITY;
    if (S.ops && S.ops.overtime && S.ops.overtime[id]) return 1;
    const a = S.ops && S.ops.absence ? (S.ops.absence[id] || 0) : this.absence(id);
    return clamp(1 - Math.max(0, a - ABSENCE_SLACK) * SHORT_K, 0, 1);
  },
  striking(id) {
    const s = S.people && S.people.strike;
    if (!s || s.dept !== id) return false;
    if (S.ops && S.ops.strike !== undefined) return S.ops.strike === id;
    return S.day >= s.from && S.day < s.to;
  },
  // a team's delay and share of good choices for a task, with its skill and its manager
  work(id, L) {
    const d = this.has(id) ? S.people.depts[id] : null;
    const skill = d ? d.skill : SKILL_START;
    const delay = L.delay * (1.2 - 0.4 * skill / 100) * (1 - this.perk(id, 'fast')) * (1 + this.perk(id, 'slow'));
    const right = clamp(L.right + (skill - 60) / 400 + this.perk(id, 'right'), 0.3, 1);
    return { delay, right };
  },

  // passengers checked in per minute per open desk, × DESK_RATE: a team's skill, check-in computers working, a
  // slow manager
  deskRate() {
    const lv = S.domains.checkin || 0;
    if (!lv) return 1;
    const d = this.has('checkin') ? S.people.depts.checkin : null;
    let k = 0.8 + 0.4 * (d ? d.skill : SKILL_START) / 100;
    if (Systems.working('checkin') >= 2) k *= CHECKIN_SYSTEM_X;
    return k * (1 - this.perk('checkin', 'slow'));
  },

  // ---------- the Staff meter ----------
  updateMeter() {
    if (!S.people) return;
    let sum = 0, w = 0;
    for (const id of Object.keys(S.people.depts)) {
      const n = this.jobs(id);
      if (!n) continue;
      sum += S.people.depts[id].morale * n; w += n;
    }
    if (w) S.meters.staff = clamp(sum / w, 0, 100);
  },
  morale(id, delta) { if (this.has(id)) S.people.depts[id].morale = clamp(S.people.depts[id].morale + delta, 0, 100); },
  moraleAll(delta) { if (S.people) for (const id of Object.keys(S.people.depts)) this.morale(id, delta); this.updateMeter(); },

  // ---------- what the player does ----------
  // hire a team for a domain (level 0 → 1): at once between missions, after HIRE_DAYS (or the clearance) in plan time
  hire(dom) {
    const L = DOMAINS[dom] && DOMAINS[dom].levels[1];
    if (!L || (S.domains[dom] || 0) > 0 || Calendar.year() < L.from) return false;
    if (S.people && S.people.hiring.some((h) => h.dom === dom)) return false;
    Finance.book('hiring', -HIRE_COST * L.staff);
    const days = (DEPTS[dom].clearance && Calendar.year() >= DEPTS[dom].clearance) ? CLEARANCE_DAYS : HIRE_DAYS;
    if (S.plan) this.ensure().hiring.push({ dom, at: S.day + days });
    else this.hired(dom);
    logEvent('hire', { dom });
    return true;
  },
  hired(dom) {
    S.domains[dom] = Math.max(1, S.domains[dom] || 0);
    const d = this.dept(dom);
    d.skill = SKILL_START;
    this.updateMeter();
    logEvent('teamReady', { dom });
  },
  // more IT people
  hireIT(n) {
    if (!n) return false;
    this.ensure().it = Math.max(0, S.people.it + n);
    this.dept('it');
    if (n > 0) Finance.book('hiring', -HIRE_COST * n);
    this.updateMeter();
    return true;
  },
  train(id) {
    if (!this.has(id)) return false;
    const n = this.jobs(id);
    if (!n) return false;
    const d = S.people.depts[id];
    if (d.skill >= SKILL_MAX) return false;
    Finance.book('training', -TRAIN_COST * n);
    d.skill = Math.min(SKILL_MAX, d.skill + TRAIN_SKILL);
    this.morale(id, 3);
    return true;
  },
  // seasonal temps for a team, TEMPS_DAYS from now
  temps(id) {
    if (!this.has(id) || !this.jobs(id)) return false;
    const d = S.people.depts[id];
    if (d.temps > S.day) return false;
    d.temps = S.day + TEMPS_DAYS;
    logEvent('temps', { dom: id });
    return true;
  },
  tempJobs(id) { return Math.max(1, Math.round(this.jobs(id) * 0.3)); },
  // July's holidays spread over the summer (a bonus for those who move theirs), or not
  summer(how) {
    this.ensure();
    if (how === 'spread' && S.people.summer !== 'spread') {
      let jobs = 0;
      for (const id of Object.keys(S.people.depts)) jobs += this.jobs(id);
      Finance.book('wages', -SPREAD_COST * jobs);
    }
    S.people.summer = how;
    return true;
  },
  // overtime for a team in this ops stage: nobody missing, at a price, and tired people next time
  overtime(id) {
    if (!S.ops || !this.has(id) || (S.ops.overtime && S.ops.overtime[id]) || this.striking(id)) return false;
    const n = this.jobs(id);
    if (!n) return false;
    S.ops.overtime = S.ops.overtime || {};
    S.ops.overtime[id] = true;
    Finance.book('overtime', -n * STAFF_MONTH * S.people.depts[id].wageX / 30 * OVERTIME_STAGE * OVERTIME_X);
    S.people.depts[id].fatigue = Math.min(100, S.people.depts[id].fatigue + OVERTIME_FATIGUE);
    logEvent('overtime', { dom: id });
    return true;
  },

  // ---------- managers ----------
  hireManager(mid) {
    const m = MANAGERS[mid];
    if (!m || Calendar.year() < m.from) return false;
    this.ensure();
    this.dept(m.dept);
    S.people.managers[m.dept] = { id: mid, mood: 70, since: S.day, salaryX: m.salary, asked: S.day };
    this.morale(m.dept, this.perk(m.dept, 'morale'));
    this.updateMeter();
    logEvent('manager', { id: mid });
    return true;
  },
  // a manager's raise: given (mood up, salary up) or not (mood down)
  raise(dept, give) {
    const m = this.manager(dept);
    if (!m) return false;
    S.people.asks = S.people.asks.filter((a) => a !== dept);
    if (give) { m.salaryX *= 1.12; m.mood = Math.min(100, m.mood + 25); } else m.mood = Math.max(0, m.mood - 15);
    return true;
  },
  salaries() {
    if (!S.people) return 0;
    let s = 0;
    for (const id of Object.keys(S.people.managers)) s += MANAGER_SALARY * S.people.managers[id].salaryX;
    return s;
  },

  // ---------- the unions ----------
  // how a wage round's answer goes: { raise, strike, morale, union }; `offer` a raise for a counter
  roundOutcome(dept, how, offer) {
    const d = this.dept(dept), demand = WAGE_DEMAND;
    // a round between missions: the usual small deal of a year without inflation
    if (how === 'auto') return { raise: WAGE_DRIFT, strike: false, morale: 3, union: 0 };
    if (how === 'accept') return { raise: demand, strike: false, morale: 8, union: 10 };
    if (how === 'mediator') return { raise: demand * 0.75, strike: false, morale: 3, union: 0 };
    if (how === 'refuse') return { raise: 0, strike: true, morale: -10, union: -20 };
    // a counter-offer: taken when the offer, the union's mood and the manager are enough
    const score = 0.15 + 0.6 * (offer / demand) + (d.union.mood - 50) / 100 + this.perk(dept, 'strike');
    return score >= 0.6 ? { raise: offer, strike: false, morale: 2, union: 0, score } : { raise: 0, strike: true, morale: -6, union: -10, score };
  },
  wageRound(dept, how, offer) {
    const r = this.roundOutcome(dept, how, offer), d = this.dept(dept);
    d.wageX *= 1 + r.raise;
    d.union.mood = clamp(d.union.mood + r.union, 0, 100);
    d.union.next = S.day + Math.round(WAGE_ROUND_MONTHS * 30.4);
    // a fair deal lifts the team's morale for a year (it fades month by month), a refusal lowers it
    d.bonus = (d.bonus || 0) + r.morale;
    this.morale(dept, r.morale);
    if (r.strike) {
      const from = S.day + STRIKE_NOTICE_DAYS;
      S.people.strike = { dept, from, to: from + STRIKE_DAYS, settle: WAGE_DEMAND };
      logEvent('strikeNotice', { dept, from });
    } else {
      // a deal calls off a strike already announced
      if (S.people.strike && S.people.strike.dept === dept) S.people.strike = null;
      logEvent('settled', { dept, raise: r.raise });
    }
    this.updateMeter();
    return r;
  },
  // a strike that has run its days ends with the demand met
  strikeEnds() {
    const s = S.people && S.people.strike;
    if (!s || S.day < s.to) return;
    const d = this.dept(s.dept);
    d.wageX *= 1 + s.settle;
    d.union.mood = clamp(d.union.mood + 15, 0, 100);
    this.morale(s.dept, -4);
    S.people.strike = null;
    logEvent('strikeOver', { dept: s.dept });
  },

  // ---------- each day and each month ----------
  day() {
    if (!S.people) return;
    for (const h of S.people.hiring.slice()) if (S.day >= h.at) { S.people.hiring = S.people.hiring.filter((x) => x !== h); this.hired(h.dom); }
    this.strikeEnds();
  },
  // a month: morale drifts toward what the wages and the bosses give, fatigue fades, skill grows, the managers'
  // moods, raises, poaching and retiring; a wage round that falls due between missions is settled by the mediator
  month() {
    if (!S.people) return;
    const p = S.people;
    for (const id of Object.keys(p.depts)) {
      const d = p.depts[id];
      if (!this.jobs(id) && id !== 'it') continue;
      d.bonus = (d.bonus || 0) * MORALE_BONUS_KEEP;
      let target = MORALE_BASE + d.bonus + this.perk(id, 'morale') - d.fatigue * 0.3;
      const age = S.sys && S.sys[id] && S.domains[id] >= 2 ? (S.day - S.sys[id].since) / 365 : 0;
      if (this.perk(id, 'oldSystems') && age > this.perk(id, 'oldSystems')) target -= 8;
      d.morale = clamp(d.morale + (target - d.morale) * MORALE_DRIFT, 0, 100);
      d.fatigue *= FATIGUE_DECAY;
      d.skill = Math.min(SKILL_MAX, d.skill + SKILL_MONTH);
      if (S.day >= d.union.next && !S.mission) this.wageRound(id, 'auto');
    }
    for (const id of Object.keys(p.managers)) {
      const m = p.managers[id], def = MANAGERS[m.id];
      let mood = 70;
      if (def.perks.newest && !Systems.newSince(365)) mood -= 30;
      m.mood = clamp(m.mood + (mood - m.mood) * 0.2, 0, 100);
      if (S.day - m.asked >= MANAGER_RAISE_MONTHS * 30.4 && p.asks.indexOf(id) < 0) { p.asks.push(id); m.asked = S.day; logEvent('raiseAsk', { id: m.id }); }
      if (m.mood < 40 && rand() < MANAGER_POACH) { delete p.managers[id]; p.asks = p.asks.filter((a) => a !== id); logEvent('poached', { id: m.id, by: randPick(['Copenhagen', 'Oslo', 'Helsinki']) }); continue; }
      if (S.day - m.since >= MANAGER_YEARS * 365) { delete p.managers[id]; logEvent('retired', { id: m.id }); }
    }
    this.updateMeter();
  },
  // between missions a raise request not answered counts as "not now"
  settleAsks() {
    if (!S.people) return;
    for (const id of S.people.asks.slice()) this.raise(id, false);
  },
  // the monthly wages of the departments (jobs × STAFF_MONTH × their wage level), IT and the managers
  wages() {
    let w = 0;
    if (S.people) {
      for (const id of Object.keys(S.people.depts)) w += this.jobs(id) * (id === 'it' ? IT_JOB : STAFF_MONTH) * S.people.depts[id].wageX;
      w += this.salaries();
      for (const id of Object.keys(S.people.depts)) if (S.people.depts[id].temps > S.day) w += TEMPS_JOB * this.tempJobs(id);
    } else {
      for (const d of Object.keys(S.domains)) { const lv = DOMAINS[d] && DOMAINS[d].levels[S.domains[d]]; if (lv && S.domains[d] > 0) w += (lv.staff || 0) * STAFF_MONTH; }
    }
    return w;
  }
};
