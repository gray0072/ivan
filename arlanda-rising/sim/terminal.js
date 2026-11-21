'use strict';

// Arlanda Rising — the terminals' insides (session 4): which terminal a departure goes through, the shop units and the
// real brands in them (data/brands.js: their rent every month, and their share of what each passenger spends — more
// with more free time airside, more for the passengers a brand draws), the security lanes after check-in (from
// chapter 4: a second queue, so fast security leaves more time for the shops), and the ground transport: the
// coaches, the car parks and the train (Arlanda Express: own line or a concession). The units are S.airport.units
// [{ id, term, size, brand, since }], made once a mission turns them on (setup `units`); the lanes S.airport.lanes;
// the train S.airport.train ('own' | 'concession', running from S.airport.trainFrom). Session 5: the lanes as a domain
// (opened by the player, a planner or the queue sensors: S.ops.lanesOpen), the rules of the day (S.airport.secRule:
// 1 after 2001, 2 with the liquids of 2006; CT scanners undo the liquids), the border's passport booths for the flights
// outside Schengen (S.airport.schengen, S.airport.booths, S.ops.boothsOpen) and Sky City's brands. Used by sim/passengers.js,
// sim/summary.js, sim/finance.js, sim/meters.js, the Terminal view and the Finance screen.

const Terminal = {
  // the terminal a departure goes through (`type`: its aircraft — a domestic flight by propeller goes through Terminal 3
  // while it stands and is open)
  of(code, intl, type) {
    const al = S.airlines[code];
    if (!intl && type && (AIRCRAFT[type] || {}).engines === 'prop' && Airport.has('terminal3') && !this.mothballed('t3')) return 't3';
    // session 6: a mothballed terminal's flights move to Terminal 5 (the international terminal)
    if (al && al.term === 't2' && Airport.has('terminal2') && !this.mothballed('t2')) return 't2';
    if (intl) return Airport.has('intlTerminal') ? 'intl' : 't1';
    return Airport.has('domTerminal') && !this.mothballed('dom') ? 'dom' : Airport.has('intlTerminal') ? 'intl' : 't1';
  },
  // ---------- session 6: terminals closed in a crisis, rent relief, Terminals 4 and 5 as one ----------
  // a terminal mothballed now (S.airport.mothballed[term]: true, or the day it opens again)
  mothballed(term) { const m = S.airport.mothballed && S.airport.mothballed[term]; return !!m && (m === true || S.day < m); },
  mothballedItem(kind) { const m = S.airport.mothballed; if (!m) return false; for (const t of Object.keys(m)) if (TERMINALS[t] && TERMINALS[t].item === kind && this.mothballed(t)) return true; return false; },
  mothballCount() { return Object.keys(S.airport.mothballed || {}).filter((t) => this.mothballed(t)).length; },
  // close a terminal until better times (only one that stands, never Terminal 5)
  mothball(term) {
    if (term === 'intl' || !this.built(term) || this.mothballed(term)) return false;
    S.airport.mothballed = S.airport.mothballed || {};
    S.airport.mothballed[term] = true;
    logEvent('mothballed', { term });
    return true;
  },
  // open it again: cleaned, tested and staffed, REOPEN_DAYS later in plan time
  reopen(term) {
    const m = S.airport.mothballed;
    if (!m || m[term] !== true) return false;
    Finance.book('build', -REOPEN_COST);
    m[term] = S.plan ? S.day + REOPEN_DAYS : S.day;
    logEvent('reopened', { term });
    return true;
  },
  // the brands asked for rent relief in the crisis: `yes` lets RENT_RELIEF of the rent off for a year, `no` makes half of
  // them close (each second unit with a brand, in order)
  relief(yes) {
    if (yes) { S.airport.relief = S.day + 365; return true; }
    let i = 0;
    for (const u of this.units()) if (u.brand && i++ % 2 === 1) this.close(u.id);
    return true;
  },
  // a terminal's name in a year (this one by default): data/terminals.js `names`
  name(term, year) {
    const d = TERMINALS[term], y = year || Calendar.year();
    let n = d.name;
    for (const [from, m] of d.names || []) if (y >= from) n = m;
    return n;
  },
  // the name of a kind of building in S.airport.items: a terminal's of this year, else data/buildings.js's
  itemName(kind) {
    const t = Object.keys(TERMINALS).find((k) => TERMINALS[k].names && TERMINALS[k].item === kind);
    return t ? this.name(t) : BUILDINGS[kind] ? BUILDINGS[kind].name : kind;
  },
  // the kerb stands from the first terminal on, also after it is torn down (2017)
  built(term) { return term === 'kerb' ? Airport.has('terminal') || !!S.airport.t1Gone : !!TERMINALS[term] && Airport.has(TERMINALS[term].item); },
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
    // session 6: with Terminals 4 and 5 joined airside their passengers walk past the brands of both
    const terms = a.joined && (term === 'dom' || term === 'intl') ? ['dom', 'intl'] : [term];
    for (const u of a.units) {
      if (terms.indexOf(u.term) < 0 || !u.brand || this.mothballed(u.term)) continue;
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
    for (const u of S.airport.units) if (u.brand && (u.term === term || u.term === 'kerb' || u.term === 'sky')) p += BRANDS[u.brand].pax * (fam && BRANDS[u.brand].fit === 'family' ? 2 : 1);
    return Math.min(BRAND_PAX_MAX, p);
  },
  // the rent of every brand, SEK a month
  rent() {
    let r = 0;
    for (const u of S.airport.units || []) if (u.brand && !this.mothballed(u.term)) r += BRANDS[u.brand].rent;
    // session 6: rent relief in a crisis
    return S.airport.relief && S.day < S.airport.relief ? r * (1 - RENT_RELIEF) : r;
  },

  // ---------- security ----------
  // the lanes there are now (a scripted event may close some for the stage: `lanesShut`)
  lanesUp() {
    const n = S.airport.lanes || 0;
    if (!n) return 0;
    // session 6: a lane needs its screeners — with the security team's jobs gone or furloughed, fewer lanes can open
    const staff = this.secDomain() && People.has('security') ? clamp(1 - People.cut('security') - People.furloughed('security'), 0, 1) : 1;
    return Math.max(1, Math.floor((n - ((S.ops && S.ops.lanesShut) || 0)) * staff + 1e-9));
  },
  // the lanes working now: all of them, or (session 5: security is a domain of its own) the ones opened
  lanes() {
    const up = this.lanesUp();
    if (!up || !this.secDomain() || !S.ops || S.ops.lanesOpen === undefined) return up;
    return clamp(S.ops.lanesOpen, 1, up);
  },
  addLane() { S.airport.lanes = (S.airport.lanes || 0) + 1; if (S.ops && this.secDomain() && S.ops.lanesOpen !== undefined) S.ops.lanesOpen++; },
  // session 5: the lanes are opened and closed by the player, a planner or the queue sensors
  secDomain() { return S.domains.security !== undefined; },
  openLane(n) {
    if (!S.ops || !this.secDomain()) return false;
    const was = this.lanes();
    S.ops.lanesOpen = clamp(Math.round(n), 1, this.lanesUp());
    return this.lanes() !== was;
  },
  // passengers through one lane a game minute: the rules of the day (2001, the liquids of 2006), the CT scanners that
  // let the liquids stay in the bag, a thorough head of security
  laneRate() {
    const rule = S.airport.secRule || 0;
    let r = LANE_RATE * SEC_RULE_X[rule];
    if (Systems.working('security') >= 3) r = LANE_RATE * SEC_RULE_X[Math.min(rule, 1)] * CT_X;
    // session 6: in a blackout the X-ray machines are dark: the bags are searched by hand
    if (S.ops && S.ops.blackout > S.clock) r *= BLACKOUT_LANE_X;
    return r * (1 - People.perk('security', 'slow'));
  },

  // ---------- the border (session 5: from Schengen, passport control for the flights outside it) ----------
  borderOn() { return !!S.airport.schengen && (S.airport.booths || 0) > 0; },
  booths() { return S.ops && S.ops.boothsOpen !== undefined ? clamp(S.ops.boothsOpen, 0, S.airport.booths || 0) : S.airport.booths || 0; },
  openBooth(n) {
    if (!S.ops || !this.borderOn()) return false;
    const was = this.booths();
    S.ops.boothsOpen = clamp(Math.round(n), 0, S.airport.booths);
    return this.booths() !== was;
  },
  boothRate() { const w = Systems.working('border'); return BOOTH_RATE * (w >= 3 ? BIO_X : w >= 2 ? EGATE_X : 1); },
  // a departure that goes through passport control: an international flight outside the Schengen area
  nonSchengen(f) { return !!(this.borderOn() && f.intl && f.ns); },

  // ---------- Sky City (session 5): its brands earn from every departing passenger, landside ----------
  skySpend(intl, leisure, month) { return this.built('sky') ? this.spend('sky', intl, leisure, month) * SKY_SPEND : 0; },

  // ---------- ground transport ----------
  trainRuns() { return !!(S.airport.train && S.day >= (S.airport.trainFrom || 0)); },
  // SEK per departing passenger the train brings the airport
  trainIncome() {
    if (!this.trainRuns()) return 0;
    return TRAIN_SHARE * (S.airport.train === 'own' ? TRAIN_TICKET : TRAIN_STATION_FEE);
  },
  // what the passengers' way to the airport adds to their mood
  groundPax() { return (Airport.has('busStop') ? 4 : 0) + (this.trainRuns() ? TRAIN_PAX : 0) + (Airport.has('hotel') ? 2 : 0); }
};
