'use strict';

// Arlanda Rising — the machines and systems of the automation ladder (SPEC.md "Manual, people, systems"): putting a
// domain on its next level (a team hired is sim/people.js; a system is bought here, installed in its days in plan
// time or at once between missions, with the old team kept as the fallback — retrained — or laid off), the IT
// people the systems need, failures in ops time (a mean time between failures, more often with too few IT people;
// mended after the system's fix time), a power cut (every system without backup power), the fallback readiness (how
// well the staff still know the manual way: it fades every month without a drill, and a failure with low readiness
// is far worse), and the systems' share of the summary loss. Each system's record is S.sys[domain]:
// { since, readiness, kept, fails, upMin, downMin, installAt }. Used by sim/tasks.js, sim/ops.js, sim/summary.js,
// sim/finance.js and the Ops Center.

const Systems = {
  rec(dom) {
    if (!S.sys) S.sys = {};
    if (!S.sys[dom]) S.sys[dom] = { since: S.day, readiness: 1, kept: false, fails: 0, upMin: 0, downMin: 0, installAt: null };
    return S.sys[dom];
  },
  level(dom) { return S.domains[dom] || 0; },
  def(dom, lv) { return DOMAINS[dom] && DOMAINS[dom].levels[lv === undefined ? this.level(dom) : lv]; },
  isSystem(dom) { return this.level(dom) >= 2; },
  down(dom) { return !!(S.ops && S.ops.down && S.ops.down[dom]); },
  // the level that does the work now: a system that is down falls to the team kept beside it, or to the player
  working(dom) {
    const lv = this.level(dom);
    if (lv >= 2 && this.down(dom)) return S.sys && S.sys[dom] && S.sys[dom].kept ? 1 : 0;
    return lv;
  },
  readiness(dom) { return S.sys && S.sys[dom] ? S.sys[dom].readiness : 1; },

  // what stands in the way of the next level now, or null: 'top', 'year', 'room' (no computer room),
  // 'hall' (no baggage hall), 'installing', 'money'
  cannot(dom) {
    const lv = this.level(dom), L = this.def(dom, lv + 1);
    if (!L) return 'top';
    if (Calendar.year() < L.from) return 'year';
    if (lv + 1 >= 2) {
      if (S.sys && S.sys[dom] && S.sys[dom].installAt) return 'installing';
      if ((L.it || 0) > 0 && !Airport.has('computerRoom')) return 'room';
      if (dom === 'baggage' && !Airport.has('bagHall')) return 'hall';
    }
    if (S.people && S.people.hiring.some((h) => h.dom === dom)) return 'installing';
    return null;
  },
  // the price of the next level: a system's own, plus the retraining of the team it keeps
  price(dom, how) {
    const lv = this.level(dom), L = this.def(dom, lv + 1);
    if (!L) return 0;
    if (lv + 1 === 1) return HIRE_COST * L.staff;
    return L.price + (how === 'keep' && lv === 1 ? RETRAIN_COST * (this.def(dom, 1).staff || 0) : 0);
  },
  // the next level: a team (sim/people.js) or a system; how = 'keep' (retrain the team as the fallback) or 'layoff'
  upgrade(dom, how) {
    if (this.cannot(dom)) return false;
    const lv = this.level(dom);
    if (lv === 0) return People.hire(dom);
    const L = this.def(dom, lv + 1);
    Finance.book('build', -this.price(dom, how));
    const r = this.rec(dom);
    if (lv === 1) {
      r.kept = how !== 'layoff';
      if (how === 'layoff') {
        People.moraleAll(-LAYOFF_MORALE);
        S.meters.neighbours = clamp(S.meters.neighbours - 3, 0, 100);
        if (S.people) for (const id of Object.keys(S.people.depts)) S.people.depts[id].union.mood = clamp(S.people.depts[id].union.mood - 15, 0, 100);
      } else People.morale(dom, 6);
    }
    if (S.plan && L.days) r.installAt = S.day + L.days;
    else this.installed(dom);
    logEvent('systemBought', { dom });
    return true;
  },
  installed(dom) {
    const r = this.rec(dom);
    r.installAt = null;
    r.since = S.day;
    r.readiness = r.kept ? 1 : READINESS_MIN;
    S.domains[dom] = Math.min(DOMAINS[dom].levels.length - 1, this.level(dom) + 1);
    People.dept(dom);
    People.updateMeter();
    logEvent('systemLive', { dom });
  },
  // any system put in within the last `days`
  newSince(days) {
    if (!S.sys) return false;
    return Object.keys(S.sys).some((d) => this.level(d) >= 2 && S.day - S.sys[d].since <= days);
  },

  // ---------- IT ----------
  itNeed() {
    let n = 0;
    for (const d of Object.keys(S.domains)) if (this.level(d) >= 2) n += this.def(d).it || 0;
    const k = People.perk('it', 'itNeed');
    return Math.ceil(n * (k || 1));
  },
  // 1 with enough IT people, less with too few (failures come more often and take longer)
  itFactor() {
    const need = this.itNeed();
    if (!need) return 1;
    return clamp((S.people ? S.people.it : 0) / need, 0.25, 1);
  },
  // the systems' running costs a month: licences and spare parts
  monthly() {
    let m = 0;
    for (const d of Object.keys(S.domains)) if (this.level(d) >= 2) m += this.def(d).month || 0;
    return m;
  },

  // ---------- in ops time ----------
  // every ops step: failures mended, new failures (more with too few IT people), the minutes up and down
  step(dt) {
    if (!S.sys) return;
    for (const d of Object.keys(S.domains)) {
      if (this.level(d) < 2) continue;
      const r = this.rec(d), L = this.def(d);
      S.ops.down = S.ops.down || {};
      const dn = S.ops.down[d];
      if (dn) {
        r.downMin += dt;
        if (S.clock >= dn.until) { delete S.ops.down[d]; logEvent('repaired', { dom: d }); }
        continue;
      }
      r.upMin += dt;
      const mtbf = L.mtbf * 60 * (People.perk('it', 'mtbf') || 1) * this.itFactor();
      if (rand() < dt / mtbf * diff().failures) this.fail(d);
    }
  },
  fail(dom, minutes) {
    if (!S.ops || this.level(dom) < 2 || this.down(dom)) return false;
    const L = this.def(dom), r = this.rec(dom);
    const fix = minutes || L.fix * (People.perk('it', 'fix') || 1) / this.itFactor();
    S.ops.down = S.ops.down || {};
    S.ops.down[dom] = { from: S.clock, until: S.clock + fix };
    r.fails++;
    if (S.mission && S.mission.st) S.mission.st.failures++;
    logEvent('failure', { dom });
    return true;
  },
  // a power cut: every system without backup power goes down
  powerCut(minutes) {
    if (Airport.has('generator')) { logEvent('powerCut', { saved: true }); return; }
    for (const d of Object.keys(S.domains)) if (this.level(d) >= 2) this.fail(d, minutes || POWER_CUT_MIN);
    logEvent('powerCut', { saved: false });
  },

  // ---------- each day and month ----------
  day() {
    if (!S.sys) return;
    for (const d of Object.keys(S.sys)) if (S.sys[d].installAt && S.day >= S.sys[d].installAt) this.installed(d);
  },
  month() {
    if (!S.sys) return;
    for (const d of Object.keys(S.sys)) if (this.level(d) >= 2) S.sys[d].readiness = Math.max(READINESS_MIN, S.sys[d].readiness - READINESS_DECAY);
  },
  // a drill day: the staff practise the manual way again
  drill(dom) {
    if (this.level(dom) < 2) return false;
    const r = this.rec(dom);
    if (r.readiness >= 1) return false;
    Finance.book('drills', -DRILL_COST);
    r.readiness = 1;
    logEvent('drill', { dom });
    return true;
  },
  // the share of a domain's summary loss left at its level: a team loses what its absence and strikes cost, a
  // system what its failures cost (worse with a weak fallback)
  summaryLoss(dom) {
    const lv = this.level(dom);
    if (lv <= 0) return 1;
    if (lv === 1) {
      const cap = People.capacity(dom);
      return People.striking(dom) ? Math.min(1, (1 - STRIKE_CAPACITY) * STRIKE_LOSS * 0.5) : (1 - cap) * 0.5;
    }
    const L = this.def(dom), downShare = L.fix / (L.mtbf * 60) / this.itFactor();
    const fallback = S.sys[dom] && S.sys[dom].kept ? 1 - this.readiness(dom) * 0.7 : 1;
    return clamp(downShare * fallback * SUMMARY_DOWN * 10, 0, 1);
  }
};
