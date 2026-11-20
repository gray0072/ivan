'use strict';

// Arlanda Rising — the airlines as partners (session 4): what each one pays a month, its route incentive (a share of
// its fees off for INCENTIVE_MONTHS: the real tool airports use to win a route), courting an airline that is not
// flying here yet (it says yes when the incentive is at least what its temper needs, data/airlines.js `court`), its
// on-time share, and the rivals: once a mission turns them on (S.airport.rivals), an airline under LEAVE_MOOD may
// move flights to its rival airport each month — never because of anything the real company did, only because the
// game's airport served it badly. Each airline's state is S.airlines[code]: { mood, routes, incentive, term, dep, on }.
// Used by sim/finance.js (fees), sim/meters.js, sim/plan.js (offers), sim/offers.js and the Airlines screen.

const Airlines = {
  // × its fees: less while its incentive runs
  feeK(code) {
    const al = code && S.airlines[code];
    return al && al.incentive && S.day < al.incentive.until ? 1 - al.incentive.share : 1;
  },
  perDay(code) { const al = S.airlines[code]; return al ? (al.routes || []).reduce((s, r) => s + r.perDay, 0) : 0; },
  // the route it would start when courted this year
  courtRoute(code) {
    const c = (AIRLINES[code] || {}).court, y = Calendar.year();
    if (!c) return null;
    const list = c.filter((r) => r.from <= y);
    return list.length ? list[list.length - 1] : null;
  },
  // flying here in this year by history
  inEra(code) { const yy = AIRLINES[code].years, y = Calendar.year(); return yy[0] <= y && (!yy[1] || yy[1] >= y); },
  // SEK a month its routes pay in fees (a typical month, with its incentive)
  monthFees(code) {
    const al = S.airlines[code], intl = (AIRLINES[code] || {}).intl;
    let sum = 0;
    for (const r of (al && al.routes) || []) {
      const f = Finance.departureFees(r.type, AIRCRAFT[r.type].seats * (r.load || 0.7), intl, code);
      sum += (f.landing + f.pax) * r.perDay * 30 * (r.months ? r.months.length / 12 : 1);
    }
    return sum;
  },
  // what it says to an incentive of `share`: 'yes', or 'no' when it wants more
  answer(code, share) { const r = this.courtRoute(code); return r && share >= r.need - 1e-9 ? 'yes' : 'no'; },
  // a route incentive: a share of its fees off for INCENTIVE_MONTHS; a courted airline starts its route
  court(code, share) {
    const r = this.courtRoute(code);
    if (!r || !this.inEra(code)) return false;
    const al = Meters.airline(code);
    if (this.answer(code, share) !== 'yes') { al.mood = clamp(al.mood - 2, 0, 100); Meters.updateAirlines(); logEvent('courtNo', { al: code }); return false; }
    const route = { type: r.type, perDay: r.perDay, load: r.load, own: true };
    al.cut = 0;
    if (r.months) route.months = r.months.slice();
    al.routes = (al.routes || []).concat([route]);
    this.incentive(code, share);
    logEvent('courted', { al: code, share });
    return true;
  },
  incentive(code, share) {
    const al = Meters.airline(code);
    if (share > 0) {
      al.incentive = { share, until: S.day + INCENTIVE_MONTHS * 30 };
      al.mood = clamp(al.mood + INCENTIVE_MOOD * share, 0, 100);
    }
    Meters.updateAirlines();
    return true;
  },
  // one flight a day less: from its busiest route
  cutOne(al) {
    const r = (al.routes || []).slice().sort((a, b) => b.perDay - a.perDay)[0];
    if (!r) return;
    r.perDay -= 1;
    if (r.perDay <= 0) al.routes = al.routes.filter((x) => x !== r);
  },
  // the flights moved to rivals stay there when a mission sets the airline's routes again
  applyCut(code) { const al = S.airlines[code]; for (let i = 0; i < ((al && al.cut) || 0); i++) this.cutOne(al); },
  onTime(code) { const al = S.airlines[code]; return al && al.dep ? al.on / al.dep : null; },
  // a departure has left: its airline's on-time count
  departed(f) {
    const al = Meters.airline(f.al);
    al.dep = (al.dep || 0) + 1;
    al.on = (al.on || 0) + (f.delay <= ONTIME_MIN ? 1 : 0);
  },
  // the rival's pull this month: strong while its news is new (`months`), then RIVAL_LATER of it
  pull() {
    const rv = S.airport.rivals;
    if (!rv || !rv.pull) return 0;
    if (rv.until === undefined) rv.until = S.day + (rv.months || 6) * 30;
    return rv.pull * (S.day < rv.until ? 1 : RIVAL_LATER);
  },
  // once a month: incentives that end; with the rivals on, an unhappy airline moves a flight a day to its rival
  month() {
    for (const code of Object.keys(S.airlines)) {
      const al = S.airlines[code];
      if (al.incentive && S.day >= al.incentive.until) { al.incentive = null; logEvent('incentiveEnd', { al: code }); }
    }
    const rv = S.airport.rivals;
    if (!rv) return;
    for (const code of Object.keys(S.airlines).sort()) {
      const al = S.airlines[code], d = AIRLINES[code] || {};
      // an airline with a route incentive running stays loyal
      if (rv.pull && (d.kind === 'home' || d.kind === 'network') && !(al.incentive && S.day < al.incentive.until) && al.mood > RIVAL_FLOOR) {
        al.mood = Math.max(RIVAL_FLOOR, al.mood - RIVAL_PULL * this.pull());
      }
      if (al.mood >= LEAVE_MOOD || !(al.routes || []).length) continue;
      if (rand() >= LEAVE_CHANCE * ((d.temper || {}).patience || 1) / diff().patience) continue;
      this.cutOne(al);
      al.cut = (al.cut || 0) + 1;
      logEvent('routeCut', { al: code, rival: d.rival || 'Copenhagen' });
    }
    Meters.updateAirlines();
  }
};
