'use strict';

// Arlanda Rising — what each investment brings, from the airport's own traffic (SPEC.md "Investments: fast and slow
// paybacks"): the departing passengers of the last TRAFFIC_DAYS days in summary (S.traffic), the shops' and car parks'
// shares, the brands' rent and spend, the systems' running costs against the work they save. For each thing the
// airport owns — and, as a what-if, for a thing before it is bought — `card` gives its price, what it earns and costs
// a month, the payback in months (null when it never pays back at today's traffic) and its net present value over
// NPV_YEARS at NPV_RATE. Estimates, not the books: the Finance screen shows both. Used by ui/finance.js, the toolbar's
// and the decisions' "pays back in …".

const Invest = {
  // departing passengers a day (the last days in summary; a guess from the routes when none were flown yet)
  paxDay() {
    const t = S.traffic || [];
    if (t.length) return t.reduce((s, d) => s + d.pax, 0) / t.length;
    let p = 0;
    for (const code of Object.keys(S.airlines)) for (const r of S.airlines[code].routes || []) p += r.perDay * AIRCRAFT[r.type].seats * (r.load || 0.7);
    return S.airport.open ? p : 0;
  },
  share(key) { const t = S.traffic || []; const p = t.reduce((s, d) => s + d.pax, 0); return p ? t.reduce((s, d) => s + (d[key] || 0), 0) / p : 0.5; },
  // the passengers of one terminal a day: its share of the flights' passengers
  termPax(term) {
    const intl = this.share('intl'), pax = this.paxDay();
    if (term === 'kerb') return pax;
    if (term === 'sky') return pax * SKY_SPEND;
    if (term === 'intl') return pax * intl;
    if (term === 'dom') return pax * (1 - intl) * (Airport.has('terminal2') ? 0.6 : 1);
    if (term === 't2') return pax * 0.3;
    if (term === 't3') return pax * (1 - intl) * T3_SHARE;
    return Airport.has('intlTerminal') || Airport.has('domTerminal') ? 0 : pax;
  },
  // money a month: { in, out } of a building kind, at today's traffic
  building(kind) {
    const b = BUILDINGS[kind] || {}, pax = this.paxDay() * 30;
    let inn = 0;
    if (b.shop) inn += pax * SHOP_SPEND * b.shop * 0.7;
    if (b.rent) inn += b.rent;
    // session 5: a solar park saves a share of the energy bill (chapter 6)
    if (kind === 'solar' && Green.on()) inn += ENERGY_MONTH * 1.25 * ENERGY_SAVE.solar;
    if (b.parking) inn += pax * PARKING_PER_PAX * Math.min(1, b.parking) * (Airport.has('busStop') ? 1 - BUS_PARKING : 1) * (Terminal.trainRuns() ? 1 - TRAIN_PARKING : 1);
    const out = (b.staff || 0) * STAFF_MONTH + (b.price || 0) * UPKEEP_YEAR / 12 + (kind === 'lane' ? LANE_MONTH : 0);
    return { in: inn, out };
  },
  // a brand in a unit
  brand(id, term) {
    const b = BRANDS[id], pax = this.termPax(term) * 30;
    const intl = term === 'intl' || (term !== 'dom' && term !== 't3' && this.share('intl') > 0.5);
    let k = b.spend;
    if (b.fit === 'intl' && !intl) k = 0;
    if (b.fit === 'business') k *= 1 + 0.4 * (1 - this.share('leisure'));
    if (b.fit === 'leisure') k *= 1 + 0.5 * this.share('leisure');
    if (b.fit === 'family') k *= 1 + 0.6 * FAMILY_MONTHS.length / 12;
    return { in: b.rent + pax * SHOP_SPEND * k * 0.7, out: 0 };
  },
  // a system: what it saves of the duty manager's or the team's loss, against its licence and IT people
  system(dom, lv) {
    const L = DOMAINS[dom].levels[lv], prev = DOMAINS[dom].levels[lv - 1] || {};
    const inc = (S.traffic || []).reduce((s, d) => s + d.income, 0) / Math.max(1, (S.traffic || []).length) * 30;
    const loss = (SUMMARY_LOSS[dom] || 0.02) * inc;
    const saved = loss * (lv === 2 ? 0.5 : 0.3) + ((prev.staff || 0) - (L.staff || 0)) * STAFF_MONTH;
    return { in: Math.max(0, saved), out: (L.month || 0) + (L.it || 0) * IT_JOB };
  },
  // payback in months and the net present value of a price and a month's net
  money(price, m) {
    const net = m.in - m.out;
    const payback = net > 0 ? price / net : null;
    let npv = -price;
    for (let i = 1; i <= NPV_YEARS * 12; i++) npv += net / Math.pow(1 + NPV_RATE, i / 12);
    return { price, in: m.in, out: m.out, net, payback, npv };
  },
  // the cards of everything the airport owns that earns: buildings that sell, the brands, the systems, the train
  list() {
    const out = [];
    const seen = {};
    for (const it of S.airport.items) {
      const b = BUILDINGS[it.kind] || {};
      if (!(b.shop || b.parking || b.bus || b.lane || b.rent)) continue;
      seen[it.kind] = (seen[it.kind] || 0) + 1;
      out.push(Object.assign({ key: it.kind, name: b.name, n: seen[it.kind] }, this.money(it.price || b.price || 0, this.building(it.kind))));
    }
    for (const u of S.airport.units || []) if (u.brand) out.push(Object.assign({ key: 'brand', brand: u.brand, term: u.term, name: BRANDS[u.brand].name }, this.money(u.price || UNIT_FIT[u.size], this.brand(u.brand, u.term))));
    for (const d of Object.keys(S.domains)) {
      for (let lv = 2; lv <= (S.domains[d] || 0); lv++) {
        out.push(Object.assign({ key: 'system', dom: d, lv, name: DOMAINS[d].levels[lv].name }, this.money(DOMAINS[d].levels[lv].price, this.system(d, lv))));
      }
    }
    if (S.airport.train) {
      const p = Construction.state('arlandaExpress');
      const m = { in: this.paxDay() * 30 * Terminal.trainIncome() || this.paxDay() * 30 * TRAIN_SHARE * (S.airport.train === 'own' ? TRAIN_TICKET : TRAIN_STATION_FEE), out: 0 };
      out.push(Object.assign({ key: 'train', name: 'Arlanda Express' }, this.money(p ? p.spent : 0, m)));
    }
    return out;
  },
  // the same before buying: a small build, a brand in a terminal, the next level of a domain
  whatIf(kind) { const b = BUILDINGS[kind]; return b ? this.money(b.price, this.building(kind)) : null; },
  whatIfBrand(id, term, size) { return this.money(UNIT_FIT[size], this.brand(id, term)); },
  whatIfSystem(dom) { const lv = (S.domains[dom] || 0) + 1; return lv >= 2 && DOMAINS[dom].levels[lv] ? this.money(DOMAINS[dom].levels[lv].price, this.system(dom, lv)) : null; }
};
