'use strict';

// Arlanda Rising — the machines and systems of the automation ladder (SPEC.md "Manual, people, systems"): putting a
// domain on its next level (a team hired is sim/people.js; a system is bought here — the next level of a system, or
// the first system straight from the hands or from a team: it comes with its own operators —, installed in its days in
// plan time or at once between missions, with the old team kept as the fallback — retrained — or laid off; a team can
// be hired back beside it later, sim/people.js `hireBack`), the IT
// people the systems need, failures in ops time (a mean time between failures, more often with too few IT people;
// mended after the system's fix time), a power cut (every system without backup power), the fallback readiness (how
// well the staff still know the manual way: it fades every month without a drill, and a failure with low readiness
// is far worse), and the systems' share of the summary loss. Each system's record is S.sys[domain]:
// { since, readiness, kept, fails, upMin, downMin, installAt, to, laidOff, drilled (the day of the last drill) }. Used by sim/tasks.js, sim/ops.js, sim/summary.js,
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
    // session 6: a deep failure (an outage, a blackout, an attack) takes the level below down with it
    if (lv >= 3 && this.down(dom) && !S.ops.down[dom].deep) return 2;
    if (lv >= 2 && this.down(dom)) return S.sys && S.sys[dom] && S.sys[dom].kept ? 1 : 0;
    return lv;
  },
  readiness(dom) { return S.sys && S.sys[dom] ? S.sys[dom].readiness : 1; },

  // the system a domain can go to next: the level above a system, the first system (level 2) from the hands or a team
  nextSystem(dom) { const lv = this.level(dom); return lv >= 2 ? lv + 1 : 2; },
  // what stands in the way of level `to` (the next one by default; level 2 straight from the hands too) now, or null:
  // 'top', 'year', 'ops' (nothing is hired or bought in ops time), 'room' (no computer room), 'hall' (no baggage hall),
  // 'sorter', 'pads', 'installing' (a system being put in, new people on their way)
  cannot(dom, to) {
    const lv = this.level(dom);
    if (to === undefined) to = lv + 1;
    const L = this.def(dom, to);
    if (!L || to <= lv || (to > lv + 1 && !(lv === 0 && to === 2))) return 'top';
    if (Calendar.year() < L.from) return 'year';
    if (S.ops) return 'ops';
    if (S.sys && S.sys[dom] && S.sys[dom].installAt) return 'installing';
    if (to >= 2) {
      if ((L.it || 0) > 0 && !Airport.has('computerRoom')) return 'room';
      if (dom === 'baggage' && !Airport.has('bagHall')) return 'hall';
      if (to >= 3 && dom === 'baggage' && !Airport.has('sorterHall')) return 'sorter';
      // session 5: the remote de-icing pads must be paved first
      if (dom === 'deice' && !Airport.has('deicePad')) return 'pads';
    }
    if (People.coming(dom)) return 'installing';
    return null;
  },
  // the price of level `to`: a team's recruiting, or a system's own price plus the retraining of the team it keeps
  price(dom, how, to) {
    const lv = this.level(dom);
    if (to === undefined) to = lv + 1;
    const L = this.def(dom, to);
    if (!L) return 0;
    if (to === 1) return HIRE_COST * L.staff;
    return L.price + (how === 'keep' && lv === 1 ? this.retrain(dom) : 0);
  },
  // retraining the team a system replaces, to keep it as the fallback
  retrain(dom) { return RETRAIN_COST * ((this.def(dom, 1) || {}).staff || 0); },
  // the wages a month of the team below a system: what letting it go saves
  teamWages(dom) { return ((this.def(dom, 1) || {}).staff || 0) * STAFF_MONTH * (People.has(dom) ? S.people.depts[dom].wageX : 1); },
  // level `to` (the next by default): a team (sim/people.js) or a system — from a team how = 'keep' (retrain the team
  // as the fallback) or 'layoff'; from the hands the system comes alone (a team can be hired as the fallback later)
  upgrade(dom, how, to) {
    const lv = this.level(dom);
    if (to === undefined) to = lv + 1;
    if (this.cannot(dom, to)) return false;
    if (to === 1) return People.hire(dom);
    const L = this.def(dom, to);
    Finance.book('build', -this.price(dom, how, to));
    const r = this.rec(dom);
    r.to = to;
    if (lv === 0) r.kept = false;
    if (lv === 1) {
      r.kept = how !== 'layoff';
      r.laidOff = how === 'layoff';
      if (how === 'layoff') People.layoffHit();
      else People.morale(dom, 6);
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
    S.domains[dom] = Math.min(DOMAINS[dom].levels.length - 1, Math.max(this.level(dom) + 1, r.to || 0));
    r.to = null;
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
  fail(dom, minutes, deep) {
    if (!S.ops || this.level(dom) < 2 || this.down(dom)) return false;
    const L = this.def(dom), r = this.rec(dom);
    const fix = minutes || L.fix * (People.perk('it', 'fix') || 1) / this.itFactor();
    S.ops.down = S.ops.down || {};
    S.ops.down[dom] = { from: S.clock, until: S.clock + fix };
    if (deep) S.ops.down[dom].deep = true;
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

  // ---------- session 6: outages that take several domains down at once ----------
  // the systems there are now, the integrated ones (level 3) first: they share their data, so they fall first
  linked() { return Object.keys(S.domains).filter((d) => this.level(d) >= 2 && !this.down(d)).sort((a, b) => this.level(b) - this.level(a) || (a < b ? -1 : 1)); },
  // a global IT outage (the faulty update of July 2024): every system's computers down for `minutes`
  outage(minutes) {
    for (const d of this.linked()) this.fail(d, minutes, true);
    logEvent('outage', {});
  },
  // a total blackout: the grid and the backup power fail together, every system goes dark
  blackout(minutes) {
    for (const d of this.linked()) this.fail(d, minutes, true);
    if (S.ops) S.ops.blackout = S.clock + minutes;
    logEvent('blackout', {});
  },
  // a cyber attack on the airport's network: the linked systems fall together (CYBER_SPREAD of them, the integrated
  // first); a security operations centre cuts off the first one at once and keeps the rest running
  cyber(minutes) {
    const list = this.linked();
    if (Airport.has('cyberCentre')) { if (list[0]) this.fail(list[0], Math.round(minutes / 3)); logEvent('cyber', { stopped: true }); return; }
    for (const d of list.slice(0, CYBER_SPREAD)) this.fail(d, minutes, true);
    logEvent('cyber', { stopped: false });
  },
  // the fallback readiness of every system, on average (1 when there is none)
  readinessAll() {
    const list = Object.keys(S.domains).filter((d) => this.level(d) >= 2);
    return list.length ? list.reduce((s, d) => s + this.readiness(d), 0) / list.length : 1;
  },
  // a drill in every system that needs one
  drillAll() { let n = 0; for (const d of Object.keys(S.domains)) if (this.drill(d)) n++; return n > 0; },

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
    r.drilled = S.day;
    logEvent('drill', { dom });
    return true;
  },
  // what the team beside a system does when the system fails now (sim/tasks.js): each task takes × (2 − readiness) of
  // its time — `speed` 1 / (2 − readiness) — and its share of right choices is × (0.5 + 0.5 × readiness); `drilled` the
  // share right at full readiness. Null for a domain without a team level
  fallback(dom) {
    const L1 = this.def(dom, 1);
    if (!L1 || L1.right === undefined) return null;
    const r = this.readiness(dom), w = People.work(dom, L1);
    return { readiness: r, speed: 1 / (2 - r), right: w.right * (0.5 + 0.5 * r), drilled: w.right };
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
