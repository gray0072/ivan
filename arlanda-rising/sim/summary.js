'use strict';

// Arlanda Rising — the airport's traffic in summary: the days of a plan stage and the time skipped between
// missions are not flown flight by flight, they are counted from the airlines' planned routes (flights a
// day by type, the season), the fees, the shops and the car parks. A domain still worked by hand is run by
// the duty manager at MANUAL_SUMMARY_EFF, which costs a share of the income (SUMMARY_LOSS), so a manual
// airport loses money on every day the player does not play. `skip` runs the days up to a mission's date
// and reports them ("Meanwhile…").

const Summary = {
  // the traffic of one day; returns its numbers
  day() {
    const out = { flights: 0, pax: 0, income: 0, intl: 0, leisure: 0 };
    if (!S.airport.open || !S.airport.runways.length || (S.airport.skyClosed && S.day < S.airport.skyClosed)) { this.record(out); return out; }
    const m = Calendar.date(S.day).m;
    const season = m >= 6 && m <= 8 ? 1.2 : (m === 12 || m <= 2) ? 0.9 : 1;
    // the share lost to the duty manager's work on the domains still done by hand
    let loss = 0;
    for (const d of Object.keys(SUMMARY_LOSS)) {
      // a domain the game has not opened yet costs nothing; a team or a system loses only what its absence,
      // strikes or failures cost (sim/systems.js)
      if (S.domains[d] === undefined) continue;
      if ((d === 'snow' || d === 'deice') && !Calendar.winter(S.day)) continue;
      // Free Play: a hand domain worked well in the played day loses less over its month (sim/free.js `manualShare`)
      const share = S.domains[d] > 0 ? Systems.summaryLoss(d) : S.free ? Free.manualShare(d) : 1;
      if (share > 0) loss += SUMMARY_LOSS[d] * (1 - MANUAL_SUMMARY_EFF) / 0.4 * share;
    }
    const keep = 1 - loss;
    for (const code of Object.keys(S.airlines)) {
      const al = S.airlines[code], intl = (AIRLINES[code] || {}).intl;
      for (const r of al.routes || []) {
        if (r.months && r.months.indexOf(m) < 0) continue;
        // session 6: a crisis leaves a share of the passengers (S.airport.demand); the freighters fly on and pay per tonne
        const freight = AIRCRAFT[r.type].cargo || 0;
        const n = r.perDay * season * (freight ? 1 : this.demand()), pax = AIRCRAFT[r.type].seats * (r.load || 0.7);
        if (freight) {
          const c = n * freight * (r.load || 0.8) * CARGO_TONNES_FEE * keep;
          Finance.book('cargo', c);
          if (S.mission && S.mission.st) S.mission.st.cargoIn = (S.mission.st.cargoIn || 0) + c;
          out.income += c;
        }
        const fees = Finance.departureFees(r.type, pax, intl, code);
        const aero = n * (fees.landing + fees.pax) * keep;
        const shops = n * pax * (SHOP_SPEND * Airport.shopShare() * 0.7 + PARKING_PER_PAX * Airport.parkingShare()) * keep;
        Finance.book('fees', aero);
        Finance.book('shops', shops);
        // session 4: the brands of its terminal, the train
        let more = 0;
        if (S.airport.units) {
          const brands = n * pax * Terminal.spend(Terminal.of(code, intl, r.type), intl, Terminal.leisure(code), m) * 0.7 * keep;
          Finance.book('shops', brands);
          if (S.mission && S.mission.st) S.mission.st.brandsIn += brands;
          more += brands;
        }
        const rail = n * pax * Terminal.trainIncome() * keep;
        if (rail) { Finance.book('rail', rail); more += rail; }
        // session 5: Sky City's brands; the de-icing fluid of a winter's departures
        const sky = S.airport.units ? n * pax * Terminal.skySpend(intl, Terminal.leisure(code), m) * keep : 0;
        if (sky) { Finance.book('shops', sky); if (S.mission && S.mission.st) S.mission.st.brandsIn += sky; more += sky; }
        if (S.domains.deice !== undefined && (m === 12 || m <= 3)) Finance.book('deicing', -n * DEICE_WINTER_SHARE * GLYCOL_COST * ((S.domains.deice || 0) >= 3 ? 1 - GLYCOL_RECOVER : 1));
        out.flights += n; out.pax += n * pax; out.income += aero + shops + more;
        if (intl) out.intl += n * pax;
        if (Terminal.leisure(code)) out.leisure += n * pax;
      }
    }
    this.record(out);
    return out;
  },
  // session 6: the share of the normal passenger traffic there is now (a pandemic, the way back)
  demand() { const d = S.airport.demand; return d === undefined ? 1 : Math.max(DEMAND_MIN, d); },
  // the last TRAFFIC_DAYS days of traffic, for the payback estimates (sim/invest.js)
  record(out) {
    const t = S.traffic = S.traffic || [];
    t.push({ pax: Math.round(out.pax), intl: Math.round(out.intl), leisure: Math.round(out.leisure), flights: Math.round(out.flights * 10) / 10, income: Math.round(out.income) });
    if (t.length > TRAFFIC_DAYS) t.splice(0, t.length - TRAFFIC_DAYS);
  },
  // the calendar jumps to `toDay`: every day in summary, the running costs, the months closed
  skip(toDay) {
    const r = { from: S.day, to: toDay, money0: S.money, flights: 0, pax: 0 };
    while (S.day < toDay) {
      const d = this.day();
      r.flights += d.flights; r.pax += d.pax;
      Finance.running(1440);
      S.day++;
      People.day();
      Systems.day();
      Finance.checkMonth();
    }
    r.money1 = S.money;
    return r;
  }
};
