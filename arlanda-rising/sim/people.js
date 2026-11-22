'use strict';

// Arlanda Rising — the people (SPEC.md "People"): a department for every domain handed to a team (and IT), with its
// morale, fatigue, skill, wage level and union; the absence of a day (the flu season, July's holidays, morale and
// fatigue, the temps), the share of a team's tasks that fall to the player's tray when it is short or on strike,
// overtime, training, hiring (two weeks, or the clearance's weeks), the wage rounds (accept, counter, the mediator,
// refuse — and the strike a week after the notice) and the managers (their perks and flaws, mood, raises, poaching,
// retiring). Session 7: a head leads a team (one hired for a department without a team brings the team), a head who
// leaves marks the department vacant and in plan time offers two successors (the department's own heads, then ones made
// of HEAD_NAMES and HEAD_STYLES: `mdef`, `candidates`); a team hired back beside a system as its fallback (`hireBack`);
// no team is hired in ops time. S.people is created by the first mission that needs it; a world without it (chapter 1) is untouched.
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
    const m = S.people && S.people.managers[id], def = m && this.mdef(m.id);
    const v = def && def.perks[key];
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
    // session 6: the jobs laid off (or left in the long pause) and not yet filled again
    const cut = this.cut(id);
    return cut ? Math.round(n * (1 - cut)) : n;
  },
  // ---------- session 6: the storm years — furlough, lay-offs, the people who left, rehiring ----------
  // the share of a department's jobs gone (laid off, or left for other work) and not yet filled again
  cut(id) { const d = S.people && S.people.depts[id]; return d && d.cut ? d.cut : 0; },
  // the share of a department at home on furlough today
  furloughed(id) { const d = S.people && S.people.depts[id]; return d && d.furlough && S.day < d.furlough.until ? d.furlough.share : 0; },
  // every department of people the airport pays (not the police, not IT)
  staffDepts() { return S.people ? Object.keys(S.people.depts).filter((id) => id !== 'it' && !(DEPTS[id] || {}).police && this.jobs(id) > 0) : []; },
  // the crisis answer for the staff: furlough (the state pays most of the wages, the people stay), lay off (wages saved
  // after the notice, morale down, the jobs must be filled again later) or keep everybody
  crisis(how, share, months) {
    if (!S.people) return false;
    if (how === 'furlough') {
      for (const id of this.staffDepts()) { const d = S.people.depts[id]; d.furlough = { share, until: S.day + Math.round((months || 6) * 30.4) }; d.wasFurloughed = true; this.morale(id, -2); }
      logEvent('furlough', { share });
    } else if (how === 'layoff') {
      let pay = 0;
      for (const id of this.staffDepts()) {
        const d = S.people.depts[id], n = this.jobs(id);
        pay += Math.round(n * share) * STAFF_MONTH * d.wageX * LAYOFF_PAY_MONTHS;
        d.cut = 1 - (1 - (d.cut || 0)) * (1 - share);
      }
      Finance.book('layoffs', -pay);
      this.moraleAll(-LAYOFF_MORALE);
      for (const id of Object.keys(S.people.depts)) S.people.depts[id].union.mood = clamp(S.people.depts[id].union.mood - 15, 0, 100);
      S.meters.neighbours = clamp(S.meters.neighbours - 2, 0, 100);
      logEvent('layoffs', { share });
    }
    this.updateMeter();
    return true;
  },
  // the long pause made people leave for other work: the furloughed more, those kept on half as many; a team cut deeper
  // by lay-offs keeps its own cut
  leavers(share) {
    if (!S.people || S.people.left) return;
    S.people.left = true;
    for (const id of this.staffDepts()) { const d = S.people.depts[id]; d.cut = Math.max(d.cut || 0, d.wasFurloughed ? share : share / 2); }
    this.updateMeter();
  },
  // fill the jobs gone again: recruiting costs, and the new people start after the hiring days — or the security
  // clearance's weeks, where the job needs one (the lesson of the summer of 2022)
  rehire(id) {
    const d = S.people && S.people.depts[id];
    if (!d || !d.cut || S.people.hiring.some((h) => h.dom === id)) return false;
    const L = DOMAINS[id] && DOMAINS[id].levels;
    let full = (L && L[S.domains[id] || 0] && L[S.domains[id] || 0].staff) || 0;
    if ((S.domains[id] || 0) >= 2 && S.sys && S.sys[id] && S.sys[id].kept) full += L[1].staff || 0;
    Finance.book('hiring', -HIRE_COST * Math.max(1, Math.round(full * d.cut)));
    if (S.plan) S.people.hiring.push({ dom: id, at: S.day + this.hireDays(id), rehire: true });
    else this.rehired(id);
    logEvent('rehire', { dom: id });
    return true;
  },
  rehired(id) {
    const d = this.dept(id);
    d.skill = Math.max(SKILL_START, d.skill - 25 * (d.cut || 0));
    d.cut = 0;
    this.updateMeter();
    logEvent('teamReady', { dom: id });
  },
  furloughShare() {
    const list = this.staffDepts();
    return list.length ? list.reduce((s, id) => s + this.furloughed(id), 0) / list.length : 0;
  },
  rehireAll() { let n = 0; for (const id of Object.keys((S.people || {}).depts || {})) if (this.rehire(id)) n++; return n > 0; },
  // the share of the airport's jobs gone, on average over the departments
  cutShare() {
    const list = this.staffDepts().concat(S.people ? Object.keys(S.people.depts).filter((id) => this.cut(id) >= 0.99) : []);
    return list.length ? list.reduce((s, id) => s + this.cut(id), 0) / list.length : 0;
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
    // session 6: jobs gone and people on furlough leave work to the tray (overtime cannot fill a job nobody holds)
    const gone = clamp(this.cut(id) * CUT_K + this.furloughed(id), 0, 1);
    if (S.ops && S.ops.overtime && S.ops.overtime[id]) return 1 - gone;
    const a = S.ops && S.ops.absence ? (S.ops.absence[id] || 0) : this.absence(id);
    return clamp(1 - Math.max(0, a - ABSENCE_SLACK) * SHORT_K - gone, 0, 1);
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
  // hire a team for a domain (level 0 → 1): at once between missions, after HIRE_DAYS (or the clearance) in plan time;
  // never in ops time (it would start the same minute), nor while a system is being put in (then it is hired as the
  // system's fallback: hireBack)
  hire(dom) {
    const L = DOMAINS[dom] && DOMAINS[dom].levels[1];
    if (!L || S.ops || (S.domains[dom] || 0) > 0 || Calendar.year() < L.from) return false;
    if (this.coming(dom) || (S.sys && S.sys[dom] && S.sys[dom].installAt)) return false;
    Finance.book('hiring', -HIRE_COST * L.staff);
    if (S.plan) this.ensure().hiring.push({ dom, at: S.day + this.hireDays(dom) });
    else this.hired(dom);
    logEvent('hire', { dom });
    return true;
  },
  // days from hiring to the first shift: two weeks, or the security clearance's six where the job needs one
  hireDays(dom) { return (DEPTS[dom] && DEPTS[dom].clearance && Calendar.year() >= DEPTS[dom].clearance) ? CLEARANCE_DAYS : HIRE_DAYS; },
  // new people on their way to a department (a team, the jobs filled again, a team hired back)
  coming(dom) { return !!(S.people && S.people.hiring.some((h) => h.dom === dom)); },
  // a team hired again beside a system whose team was let go (or bought straight from the hands): the fallback when the
  // system fails — HIRE_COST a job, ready after the hiring days (or the clearance) in plan time, at once between missions
  canHireBack(dom) {
    const L = DOMAINS[dom] && DOMAINS[dom].levels[1], r = S.sys && S.sys[dom], lv = S.domains[dom] || 0;
    if (!L || !L.staff || !r || r.kept || S.ops || Calendar.year() < L.from || this.coming(dom)) return false;
    return lv >= 2 || (lv === 0 && !!r.installAt);
  },
  hireBack(dom) {
    if (!this.canHireBack(dom)) return false;
    Finance.book('hiring', -HIRE_COST * DOMAINS[dom].levels[1].staff);
    if (S.plan) this.ensure().hiring.push({ dom, at: S.day + this.hireDays(dom), back: true });
    else this.backReady(dom);
    logEvent('hireBack', { dom });
    return true;
  },
  // the team is there: the fallback of the system (it knows the manual way); while the system is still being put in, it
  // does the work as a team of its own
  backReady(dom) {
    const r = Systems.rec(dom);
    r.kept = true; r.readiness = 1;
    S.domains[dom] = Math.max(1, S.domains[dom] || 0);
    const d = this.dept(dom);
    d.skill = Math.min(d.skill, SKILL_START + 10);
    this.updateMeter();
    logEvent('teamReady', { dom });
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
  // a head's definition: one of MANAGERS, or a successor made of HEAD_NAMES and HEAD_STYLES ('next:<dept>:<n>')
  _mdefs: {},
  mdef(id) {
    if (MANAGERS[id]) return MANAGERS[id];
    if (this._mdefs[id]) return this._mdefs[id];
    const m = /^next:(\w+):(\d+)$/.exec(id || '');
    if (!m || !DEPTS[m[1]]) return null;
    const dept = m[1], n = +m[2], di = Object.keys(DEPTS).indexOf(dept);
    const who = HEAD_NAMES[(di * 5 + n) % HEAD_NAMES.length], st = HEAD_STYLES[(di + n) % HEAD_STYLES.length];
    return (this._mdefs[id] = { name: who.name, face: who.face, dept, from: 0, salary: st.salary, perks: st.perks, good: st.good, bad: st.bad });
  },
  // the two candidates for a department's head: its own heads of MANAGERS first (from their year), then successors;
  // nobody who has left the airport or leads a department now. `w` the world (S by default)
  candidates(dept, year, w) {
    w = w || S;
    const p = w.people, y = year || Calendar.year(), gone = (p && p.gone) || [], busy = p ? Object.keys(p.managers).map((d) => p.managers[d].id) : [];
    if (!DEPTS[dept] || DEPTS[dept].police) return [];
    const free = (id) => gone.indexOf(id) < 0 && busy.indexOf(id) < 0;
    const out = Object.keys(MANAGERS).filter((id) => MANAGERS[id].dept === dept && MANAGERS[id].from <= y && free(id)).slice(0, 2);
    for (let n = 0; out.length < 2 && n < 60; n++) if (free('next:' + dept + ':' + n)) out.push('next:' + dept + ':' + n);
    return out;
  },
  // a department that can have a head: one with a team or a system (or new people on their way), IT with its people
  staffed(dept) { return dept === 'it' ? !!(S.people && S.people.it > 0) : (S.domains[dept] || 0) > 0 || this.coming(dept); },
  // a head leads a team: for a department without one the team is hired with the head (its usual days and price);
  // never in ops time, where the team would start the same minute
  needsTeam(mid) { const m = this.mdef(mid); return !!m && m.dept !== 'it' && !this.staffed(m.dept); },
  hireManager(mid) {
    const m = this.mdef(mid);
    if (!m || Calendar.year() < m.from) return false;
    if (this.needsTeam(mid) && !this.hire(m.dept)) return false;
    this.ensure();
    this.dept(m.dept);
    S.people.managers[m.dept] = { id: mid, mood: 70, since: S.day, salaryX: m.salary, asked: S.day };
    if (S.people.vacant) delete S.people.vacant[m.dept];
    this.morale(m.dept, this.perk(m.dept, 'morale'));
    this.updateMeter();
    logEvent('manager', { id: mid, dept: m.dept });
    return true;
  },
  // a head has left (retired, or poached by a rival airport): the team keeps working, only the head's perks go. The
  // department is marked vacant (the Office and People say so) and in plan time its two successors are offered at once
  leave(dept, why, by) {
    const p = S.people, m = p.managers[dept];
    if (!m) return;
    delete p.managers[dept];
    p.asks = p.asks.filter((a) => a !== dept);
    (p.gone = p.gone || []).push(m.id);
    (p.vacant = p.vacant || {})[dept] = { id: m.id, why, day: S.day, offered: false };
    logEvent(why, Object.assign({ id: m.id, dept }, by ? { by } : {}));
    this.offerHeads();
  },
  // in plan time: the successors of every vacant department not offered yet, as a decision (sim/offers.js `head`)
  offerHeads() {
    if (!S.plan || !S.mission || !S.people || !S.people.vacant) return;
    for (const dept of Object.keys(S.people.vacant)) {
      const v = S.people.vacant[dept];
      if (v.offered || !this.staffed(dept) || this.candidates(dept).length < 2) continue;
      v.offered = true;
      Plan.offer(Offers.head(dept, v), HEAD_OFFER_DAYS);
    }
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
    for (const h of S.people.hiring.slice()) if (S.day >= h.at) { S.people.hiring = S.people.hiring.filter((x) => x !== h); if (h.rehire) this.rehired(h.dom); else if (h.back) this.backReady(h.dom); else this.hired(h.dom); }
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
      const m = p.managers[id], def = this.mdef(m.id);
      let mood = 70;
      if (def.perks.newest && !Systems.newSince(365)) mood -= 30;
      m.mood = clamp(m.mood + (mood - m.mood) * 0.2, 0, 100);
      if (S.day - m.asked >= MANAGER_RAISE_MONTHS * 30.4 && p.asks.indexOf(id) < 0) { p.asks.push(id); m.asked = S.day; logEvent('raiseAsk', { id: m.id }); }
      if (m.mood < 40 && rand() < MANAGER_POACH) { this.leave(id, 'poached', randPick(['Copenhagen', 'Oslo', 'Helsinki'])); continue; }
      if (S.day - m.since >= MANAGER_YEARS * 365) this.leave(id, 'retired');
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
      // session 6: a furloughed job costs FURLOUGH_PAY of its wage (the state pays the rest)
      for (const id of Object.keys(S.people.depts)) w += this.jobs(id) * (id === 'it' ? IT_JOB : STAFF_MONTH) * S.people.depts[id].wageX * (1 - this.furloughed(id) * (1 - FURLOUGH_PAY));
      w += this.salaries();
      for (const id of Object.keys(S.people.depts)) if (S.people.depts[id].temps > S.day) w += TEMPS_JOB * this.tempJobs(id);
    } else {
      for (const d of Object.keys(S.domains)) { const lv = DOMAINS[d] && DOMAINS[d].levels[S.domains[d]]; if (lv && S.domains[d] > 0) w += (lv.staff || 0) * STAFF_MONTH; }
    }
    return w;
  }
};
