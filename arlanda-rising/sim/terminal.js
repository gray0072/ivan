'use strict';

// Arlanda Rising — the terminals' insides (session 4): which terminal a departure goes through, the shop units and the
// real brands in them (data/brands.js: their rent every month, and their share of what each passenger spends — more
// with more free time airside, more for the passengers a brand draws), the security lanes after check-in (from
// chapter 4: a second queue, so fast security leaves more time for the shops), and the ground transport: the
// coaches, the car parks and the train (Arlanda Express: own line or a concession). The units are S.airport.units
// [{ id, term, size, brand, since }], made once a mission turns them on (setup `units`); the lanes S.airport.lanes;
// the train S.airport.train ('own' | 'concession', running from S.airport.trainFrom). Used by sim/passengers.js,
// sim/summary.js, sim/finance.js, sim/meters.js, the Terminal view and the Finance screen.

const Terminal = {
  // the terminal a departure goes through
  of(code, intl) {
    const al = S.airlines[code];
    if (al && al.term === 't2' && Airport.has('terminal2')) return 't2';
    if (intl) return Airport.has('intlTerminal') ? 'intl' : 't1';
    return Airport.has('domTerminal') ? 'dom' : 't1';
  },
  built(term) { return term === 'kerb' ? Airport.has('terminal') : Airport.has(TERMINALS[term].item); },
  // the units of every terminal that stands (once the units are on); a terminal finished later gets its own
  ensure() {
    const a = S.airport;
    if (!a.units) return;
    for (const term of TERMINAL_ORDER) {
      if (!this.built(term) || a.units.some((u) => u.term === term)) continue;
      // the first terminal has no flights of its own once the international and domestic terminals stand
      if (term === 't1' && Airport.has('intlTerminal') && Airport.has('domTerminal')) continue;
      TERMINALS[term].units.forEach((size, i) => a.units.push({ id: term + i, term, size, brand: null, since: null }));
    }
  },
  units(term) { return (S.airport.units || []).filter((u) => !term || u.term === term); },
  unit(id) { return (S.airport.units || []).find((u) => u.id === id) || null; },
  fits(u, brandId) {
    const b = BRANDS[brandId];
    if (!u || !b) return false;
    if (u.size === 'desk' || b.size === 'desk') return u.size === b.size;
    return UNIT_SIZES.indexOf(b.size) <= UNIT_SIZES.indexOf(u.size);
  },
  // why a brand cannot open in a unit now, or null: 'year', 'size', 'there' (already in this terminal), 'money'
  cannot(unitId, brandId) {
    const u = this.unit(unitId), b = BRANDS[brandId];
    if (!u || !b) return 'size';
    if (Calendar.year() < b.from) return 'year';
    if (!this.fits(u, brandId)) return 'size';
    if (this.units(u.term).some((x) => x.brand === brandId && x !== u)) return 'there';
    return null;
  },
  // a brand opens in a unit: the fit-out is paid now (a brand already there leaves)
  place(unitId, brandId) {
    if (this.cannot(unitId, brandId)) return false;
    const u = this.unit(unitId);
    Finance.book('build', -UNIT_FIT[u.size]);
    u.brand = brandId; u.since = S.day; u.price = UNIT_FIT[u.size];
    logEvent('brandOpened', { brand: brandId, term: u.term });
    return true;
  },
  // … in the first free unit of a terminal that fits it (an offer's "yes")
  placeAny(term, brandId) {
    const free = this.units(term).filter((u) => !u.brand && this.fits(u, brandId))
      .sort((a, b) => UNIT_SIZES.indexOf(a.size) - UNIT_SIZES.indexOf(b.size));
    return free.length ? this.place(free[0].id, brandId) : false;
  },
  close(unitId) {
    const u = this.unit(unitId);
    if (!u || !u.brand) return false;
    logEvent('brandClosed', { brand: u.brand, term: u.term });
    u.brand = null; u.since = null; u.price = 0;
    return true;
  },
  brands() { return this.units().filter((u) => u.brand).length; },

  // the airport's takings per departing passenger of a terminal at full free time: each brand's spend × whom it draws,
  // a second brand of a kind sharing the passengers with the first
  spend(term, intl, leisure, month) {
    const a = S.airport;
    if (!a.units) return 0;
    let sum = 0;
    const seen = {};
    for (const u of a.units) {
      if (u.term !== term || !u.brand) continue;
      const b = BRANDS[u.brand];
      if (b.fit === 'intl' && !intl) continue;
      let k = b.spend;
      if (b.fit === 'business' && !leisure) k *= 1.4;
      if (b.fit === 'leisure' && leisure) k *= 1.5;
      if (b.fit === 'family' && FAMILY_MONTHS.indexOf(month) >= 0) k *= 1.6;
      seen[b.kind] = (seen[b.kind] || 0) + 1;
      sum += k * Math.pow(BRAND_SAME_KIND, seen[b.kind] - 1);
    }
    return sum * SHOP_SPEND;
  },
  // the same for a flight of an ops stage
  spendOf(f) {
    if (!S.airport.units) return 0;
    return this.spend(this.of(f.al, f.intl), f.intl, this.leisure(f.al), Calendar.month());
  },
  leisure(code) { const k = (AIRLINES[code] || {}).kind; return k === 'charter' || k === 'lowcost'; },
  // Passengers points the brands of a terminal give (kids' favourites double when families fly)
  paxBonus(term) {
    if (!S.airport.units) return 0;
    const fam = FAMILY_MONTHS.indexOf(Calendar.month()) >= 0;
    let p = 0;
    for (const u of S.airport.units) if (u.brand && (u.term === term || u.term === 'kerb')) p += BRANDS[u.brand].pax * (fam && BRANDS[u.brand].fit === 'family' ? 2 : 1);
    return Math.min(BRAND_PAX_MAX, p);
  },
  // the rent of every brand, SEK a month
  rent() { let r = 0; for (const u of S.airport.units || []) if (u.brand) r += BRANDS[u.brand].rent; return r; },

  // ---------- security ----------
  // the lanes working now (a scripted event may close some for the stage: `lanesShut`)
  lanes() { const n = S.airport.lanes || 0; return n ? Math.max(1, n - ((S.ops && S.ops.lanesShut) || 0)) : 0; },
  addLane() { S.airport.lanes = this.lanes() + 1; },

  // ---------- ground transport ----------
  trainRuns() { return !!(S.airport.train && S.day >= (S.airport.trainFrom || 0)); },
  // SEK per departing passenger the train brings the airport
  trainIncome() {
    if (!this.trainRuns()) return 0;
    return TRAIN_SHARE * (S.airport.train === 'own' ? TRAIN_TICKET : TRAIN_STATION_FEE);
  },
  // what the passengers' way to the airport adds to their mood
  groundPax() { return (Airport.has('busStop') ? 4 : 0) + (this.trainRuns() ? TRAIN_PAX : 0); }
};
