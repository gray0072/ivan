'use strict';

// Arlanda Rising — the airport itself: what is built (S.airport.items), the runways and the stands, what
// finishing a master-plan project does (`complete`), the small builds bought during a mission (`buy`), and
// the numbers the rest of the sim asks for — runway separation, fuel trucks, ploughs, the most of a vehicle worth
// having (`cap`: no more can be bought past it), the airport's own shops in the terminals' cells (bought into a terminal
// with room, sold back: `sell`) and their share, the car parks' share, the monthly running cost of everything the airport
// owns.

const Airport = {
  count(kind) { return S.airport.items.filter((i) => i.kind === kind).length; },
  has(kind) { return this.count(kind) > 0; },
  addItem(kind, extra) {
    // a shop given by the master plan or a mission goes into the first terminal with room (none standing yet: placed
    // when one stands, shopPlaces)
    if (this.cellsOf(kind) && !(extra && extra.term)) { const t = this.roomFor(kind); if (t) extra = Object.assign({ term: t }, extra || {}); }
    const it = Object.assign({ id: nextId(), kind, price: (BUILDINGS[kind] || {}).price || 0 }, extra || {});
    S.airport.items.push(it);
    return it;
  },
  runway(id) { return S.airport.runways.find((r) => r.id === id) || null; },
  stand(id) { return S.airport.stands.find((s) => s.id === id) || null; },
  // minutes between two movements on a runway
  sep() { return this.has('tower2') ? RWY_SEP_NEW : this.has('tower') ? RWY_SEP : RWY_SEP_NO_TOWER; },
  fuelTrucks() { return this.count('fuelTruck'); },
  // session 6: the stands with a charger for electric aircraft
  chargers() { return S.airport.stands.filter((s) => s.charge).length; },
  ploughs() { return this.count('plough'); },
  // the airport's own shops' share of the full shop spend per passenger (SHOP_SPEND): their room is the terminals' cells
  shopShare() {
    let s = 0;
    for (const it of S.airport.items) s += (BUILDINGS[it.kind] || {}).shop || 0;
    return s;
  },
  // the car parks' share taken, with those being built: a car park more than the drivers earns nothing, so it cannot be
  // bought once they are all taken
  placesTaken(what) {
    let s = 0;
    for (const it of S.airport.items) s += (BUILDINGS[it.kind] || {})[what] || 0;
    for (const b of (S.plan && S.plan.buys) || []) s += (BUILDINGS[b.kind] || {})[what] || 0;
    return s;
  },
  placesMax() { return 1; },

  // ---------- the airport's own shops in the terminals' cells ----------
  // Each terminal standing has its cells (data/terminals.js `cells`: 6 in the first), a shop takes some (data/buildings.js
  // `cells`: a kiosk 1, a café 2…) in the terminal it was bought for (it.term; the plan's buys keep theirs while they are
  // fitted). A shop of an older save without one is placed at once in the first terminal with room. Sold back for
  // SHOP_SELL_BACK of its price. The brands' units (sim/terminal.js) are apart from the cells.
  cellsOf(kind) { return (BUILDINGS[kind] || {}).cells || 0; },
  // the terminals with cells standing now, in TERMINAL_ORDER
  shopTerms() { return TERMINAL_ORDER.filter((t) => TERMINALS[t].cells && Terminal.built(t)); },
  cellsMax(term) { return term ? (this.shopTerms().indexOf(term) >= 0 ? TERMINALS[term].cells : 0) : this.shopTerms().reduce((s, t) => s + TERMINALS[t].cells, 0); },
  // where every shop is: { of: { itemId: term }, used: { term: cells taken, the buys being fitted too }, pending: [buys] }
  shopPlaces() {
    const of = {}, used = {}, shops = S.airport.items.filter((it) => this.cellsOf(it.kind));
    const take = (t, k) => { if (t) used[t] = (used[t] || 0) + this.cellsOf(k); };
    for (const it of shops) if (it.term) { of[it.id] = it.term; take(it.term, it.kind); }
    const pending = ((S.plan && S.plan.buys) || []).filter((b) => this.cellsOf(b.kind));
    for (const b of pending) take(b.term, b.kind);
    for (const it of shops) if (!it.term) { const t = this.roomFor(it.kind, used) || this.shopTerms()[0] || null; of[it.id] = t; take(t, it.kind); }
    return { of, used, pending };
  },
  // the terminal a shop of this kind would go into now (its own `term` first), or null when no terminal has room
  roomFor(kind, used) {
    const n = this.cellsOf(kind), terms = this.shopTerms(), pref = (BUILDINGS[kind] || {}).term;
    if (pref && terms.indexOf(pref) > 0) { terms.splice(terms.indexOf(pref), 1); terms.unshift(pref); }
    return terms.find((t) => TERMINALS[t].cells - ((used || this.shopPlaces().used)[t] || 0) >= n) || null;
  },
  cellsTaken(term) { const u = this.shopPlaces().used; return term ? u[term] || 0 : this.shopTerms().reduce((s, t) => s + (u[t] || 0), 0); },
  // the shops of a terminal in the order they were bought: [{ it, kind, cells }], then those being fitted [{ buy, kind, cells }]
  shopsIn(term) {
    const pl = this.shopPlaces();
    return S.airport.items.filter((it) => this.cellsOf(it.kind) && pl.of[it.id] === term).map((it) => ({ it, kind: it.kind, cells: this.cellsOf(it.kind) }))
      .concat(pl.pending.filter((b) => b.term === term).map((b) => ({ buy: b, kind: b.kind, cells: this.cellsOf(b.kind) })));
  },
  // SEK a shop is sold back for
  sellPrice(it) { return Math.round((it.price || 0) * SHOP_SELL_BACK); },
  // whether shops can be sold now: where they can be bought, in plan time with the airport open
  canSell() { return !!(S.plan && S.airport.open); },
  // sell an own shop (by its item id, or the last bought of a kind) to free its cells: SHOP_SELL_BACK of its price back
  sell(what) {
    if (!this.canSell()) return false;
    const shops = S.airport.items.filter((it) => this.cellsOf(it.kind));
    const it = typeof what === 'number' ? shops.find((x) => x.id === what) : shops.filter((x) => x.kind === what).pop();
    if (!it) return false;
    Finance.book('sold', this.sellPrice(it));
    S.airport.items.splice(S.airport.items.indexOf(it), 1);
    logEvent('sold', { kind: it.kind });
    return true;
  },
  // the vehicles past which one more does nothing: { max, why, n } (n what the limit counts: stands, runways, the top
  // fire category), or null for no limit — a fuel or a de-icing truck for each stand (an aircraft takes one at a time),
  // a full plough convoy for each runway (the convoys sweep at the same time), crash tenders up to the top fire category
  cap(kind) {
    const stands = S.airport.stands.length, runways = Math.max(1, S.airport.runways.length);
    if (kind === 'fuelTruck') return { max: Math.max(1, stands * FUEL_TRUCKS_PER_STAND), why: 'stand', n: stands };
    if (kind === 'deicer') return { max: Math.max(1, stands * DEICERS_PER_STAND), why: 'stand', n: stands };
    if (kind === 'plough') return { max: runways * PLOUGH_CONVOY, why: 'runway', n: runways };
    if (kind === 'crashTender') return { max: FIRE_CAT_MAX - FIRE_CAT_BASE, why: 'fire', n: FIRE_CAT_MAX };
    return null;
  },
  // how many of a kind the airport has, with those bought in plan time and not delivered yet
  owned(kind) { return this.count(kind) + ((S.plan && S.plan.buys) || []).filter((b) => b.kind === kind).length; },
  // nothing more of it can be bought: no terminal has the cells for a shop, the car parks take every driver, or a
  // vehicle is at its limit
  full(kind) {
    const b = BUILDINGS[kind] || {}, cap = this.cap(kind);
    if (cap) return this.owned(kind) >= cap.max;
    if (b.cells) return !this.roomFor(kind);
    return !!b.parking && this.placesTaken('parking') >= this.placesMax('parking') - 1e-9;
  },
  parkingShare() {
    let s = 0;
    for (const it of S.airport.items) s += (BUILDINGS[it.kind] || {}).parking || 0;
    // the airport coaches take some of the drivers
    return Math.min(1, s) * (this.has('busStop') ? 1 - BUS_PARKING : 1);
  },
  // the fire service's category: the first fire station's, and one more for each crash tender bought
  fireCat() { return this.has('fireStation') ? Math.min(FIRE_CAT_MAX, FIRE_CAT_BASE + this.count('crashTender')) : 0; },
  addStand(def) {
    const st = { id: 's' + nextId(), name: def.name, code: def.code, contact: !!def.contact, dist: def.dist, occ: null, res: null };
    if (def.at) st.at = def.at.slice();
    // a stand facing west (nose to a building on its west side) and the lane it is reached by (render/traffic.js)
    if (def.hdg === 270) { st.hdg = 270; st.lane = def.lane.slice(); }
    S.airport.stands.push(st);
    return st;
  },

  // what finishing a project, or an optional stage with its own effect, does to the airport
  complete(effect, project, price) {
    const a = S.airport, p = PROJECTS[project] || {};
    switch (effect) {
      case 'site': a.siteReady = true; break;
      case 'runway1':
        a.runways.push({ id: 'r1', name: '01/19', dirs: ['01', '19'], hdg: [10, 190], len: p.len || 3300,
          lit: false, approach: false, snow: 0, plough: null, busyUntil: 0 });
        this.addItem('runway', { price });
        this.addItem('fireStation');
        break;
      case 'apron1':
        for (const s of p.stands) this.addStand(s);
        this.addItem('apron', { price });
        break;
      case 'tower1': this.addItem('tower', { price }); break;
      case 'terminal1': this.addItem('terminal', { price }); a.desks += p.desks || 4; break;
      case 'kiosk': this.addItem('kiosk'); break;
      case 'lights1': for (const r of a.runways) r.lit = true; this.addItem('lights', { price }); break;
      case 'approachLights': for (const r of a.runways) r.approach = true; break;
      case 'apron2': for (const s of p.stands) this.addStand(s); this.addItem('apron2', { price }); break;
      case 'bigStand': this.addStand(p.bigStand); break;
      case 'ils': if (a.runways[0]) a.runways[0].ils = true; this.addItem('ils', { price }); break;
      case 'runway2':
        a.runways.push({ id: 'r2', name: '08/26', dirs: ['08', '26'], hdg: [76, 256], len: p.len || 2500,
          lit: Construction.stageDone('runway2', 'lights'), approach: false, snow: 0, plough: null, busyUntil: 0 });
        this.addItem('runway2', { price });
        break;
      case 'bagHall': this.addItem('bagHall', { price }); break;
      case 'intlTerminal': this.addItem('intlTerminal', { price }); a.desks += p.desks || 12; break;
      case 'restaurant': this.addItem('restaurant'); break;
      case 'domTerminal': for (const s of p.stands) this.addStand(s); this.addItem('domTerminal', { price }); a.desks += p.desks || 8; break;
      case 'computerRoom': this.addItem('computerRoom', { price }); break;
      case 'backupPower': this.addItem('generator'); break;
      // session 4
      case 'terminal2': for (const s of p.stands) this.addStand(s); this.addItem('terminal2', { price }); a.desks += p.desks || 10; Terminal.ensure(); break;
      case 'units': if (!a.units) a.units = []; Terminal.ensure(); break;
      case 'arlandaExpress':
        a.train = a.trainDeal || 'concession';
        a.trainFrom = Calendar.parse(TRAIN_FIRST_DAY);
        a.neighboursBase = (a.neighboursBase || 72) + TRAIN_NEIGHBOURS;
        this.addItem('railStation', { price });
        break;
      case 'sorterHall': this.addItem('sorterHall', { price }); break;
      // session 5: chapter 5
      case 'schengen': a.schengen = true; a.booths = Math.max(a.booths || 0, p.booths || 6); this.addItem('passportHall', { price }); break;
      case 't2intl': this.addItem('t2intl'); break;
      case 'tower2': this.addItem('tower2', { price }); a.safetyBase += 3; break;
      case 'pierF': for (const s of p.stands) this.addStand(s); this.addItem('pierF', { price }); a.desks += p.desks || 0; break;
      // the pier's stands get their bridges: they count as next to the terminal from now on
      case 'jetBridges': for (const st of a.stands) if ((p.stands || []).some((s) => s.name === st.name)) st.contact = true; this.addItem('jetBridges'); break;
      case 'runway3': this.addItem('runway3', { price }); break;
      case 'bridges':
        a.runways.push({ id: 'r3', name: '01R/19L', dirs: ['01R', '19L'], hdg: [10, 190], len: 2500, lit: true, approach: true, ils: true,
          snow: 0, plough: null, busyUntil: 0 });
        this.addItem('bridges', { price });
        break;
      case 'deicePads': this.addItem('deicePad', { price }); break;
      case 'skyCity': this.addItem('skyCity', { price }); Terminal.ensure(); break;
      case 'hotel': this.addItem('hotel'); break;
      case 'cargoCity': this.addItem('cargoCity', { price }); break;
      case 'offices': this.addItem('offices'); break;
      // chapter 6
      case 'aquifer': this.addItem('aquifer', { price }); break;
      case 'codeF': this.addStand(p.stand); this.addItem('codeF', { price }); break;
      case 'overWing': this.addItem('overWing'); break;
      // session 6: Terminals 4 and 5 joined airside; the player's pier of the 2030s (its stands by the design chosen)
      case 't4t5': a.joined = true; this.addItem('t4t5', { price }); break;
      case 'pier2040': {
        const des = p.designs[a.pierDesign || 'finger'], sp = p.spots;
        des.stands.forEach((s, i) => {
          const sat = a.pierDesign === 'satellite', spot = (sat ? sp.satellite : sp.finger)[i];
          const st = this.addStand({ name: s[0], code: s[1], contact: true, dist: sat ? 4 : 3, at: [spot[0], spot[1]], hdg: spot[2], lane: p.satLane });
          if (des.charge) st.charge = true;
        });
        this.addItem('pier2040', { price });
        if (des.charge) this.addItem('greenPier');
        break;
      }
      case 'pierArm': this.addItem('pierArm'); p.arm.forEach((s, i) => { const st = this.addStand({ name: s[0], code: s[1], contact: true, dist: 4, at: p.spots.arm[i].slice(0, 2) }); if (p.designs[a.pierDesign || 'finger'].charge) st.charge = true; }); break;
      default: throw new Error('unknown effect ' + effect);
    }
    logEvent('built', { what: effect, project });
  },

  // a small build from the toolbar: paid now; in ops time there at once, in plan time after its days
  buy(kind) {
    const b = BUILDINGS[kind];
    if (!b || !b.small) return false;
    if (b.from && Calendar.year() < b.from) return false;
    if (this.full(kind)) return false;
    Finance.book('build', -b.price);
    // a shop keeps its cells in its terminal while it is fitted
    const term = b.cells ? this.roomFor(kind) : undefined;
    if (S.plan && b.days > 0) S.plan.buys.push(term ? { kind, done: S.day + b.days, term } : { kind, done: S.day + b.days });
    else this.finishBuy(kind, term);
    return true;
  },
  // session 6: the owner's gift of a small build (a charger), free; true when it changed something
  buyFree(kind) { const n = this.chargers(), m = S.airport.items.length; this.finishBuy(kind); return kind === 'charger' ? this.chargers() > n : S.airport.items.length > m; },
  finishBuy(kind, term) {
    if (kind === 'stand') this.addStand({ name: String(S.airport.stands.length + 1), code: 'C', contact: false, dist: 4 });
    else if (kind === 'desk') S.airport.desks++;
    else if (kind === 'lane') Terminal.addLane();
    else if (kind === 'booth') { S.airport.booths = (S.airport.booths || 0) + 1; if (S.ops && S.ops.boothsOpen !== undefined) S.ops.boothsOpen++; }
    // session 6: a stand of the cargo apron by Cargo City (the five spots in a column; a sixth and later squeezed in
    // between them, which no mission needs); a charger on the best stand without one; the mobile charger
    else if (kind === 'cargoStand') {
      const spots = BUILDINGS.cargoStand.spots, n = S.airport.stands.filter((s) => s.cargo).length, at = spots[n % spots.length];
      const st = this.addStand({ name: 'K' + (n + 1), code: 'E', contact: false, dist: 5, at: [at[0] - Math.floor(n / spots.length) * 4, at[1] + Math.floor(n / spots.length) * 35] });
      st.cargo = true; st.pad = true;
    } else if (kind === 'charger') {
      const st = S.airport.stands.filter((s) => !s.charge && !s.cargo && SIZE_CODES.indexOf(s.code) <= 3)
        .sort((x, y) => (y.contact - x.contact) || (x.dist - y.dist) || (x.id < y.id ? -1 : 1))[0];
      if (st) st.charge = true;
    } else if (kind === 'mcharger' && S.ops && S.ops.chargers) S.ops.chargers.push(0);
    this.addItem(kind, term ? { term } : null);
    logEvent('bought', { kind });
  },

  // SEK a month for everything the airport owns: wages of the jobs, upkeep of the buildings, the domains' staff
  monthlyCost() {
    let jobs = 0, upkeep = 0;
    for (const it of S.airport.items) {
      // session 6: a mothballed terminal keeps only a few of its people and needs little upkeep
      const k = Terminal.mothballedItem(it.kind) ? 1 - MOTHBALL_SAVE : 1;
      jobs += ((BUILDINGS[it.kind] || {}).staff || 0) * k;
      upkeep += (it.price || 0) * UPKEEP_YEAR / 12 * k;
    }
    // session 6: the buildings' own staff are laid off and furloughed like the teams
    if (S.people) jobs *= (1 - People.cutShare()) * (1 - People.furloughShare() * (1 - FURLOUGH_PAY));
    // the teams (sim/people.js: their wage levels, IT, the managers, the temps) and the systems' licences
    return { wages: jobs * STAFF_MONTH + People.wages(), upkeep, systems: Systems.monthly(), interest: S.loans * LOAN_RATE / 12,
      security: Terminal.lanes() * LANE_MONTH, border: (S.airport.schengen ? S.airport.booths || 0 : 0) * BOOTH_MONTH };
  },
  // session 5: SEK a month the airport's real estate brings in rent (Sky City, the hotels, offices, Cargo City)
  rent() {
    let r = 0;
    for (const it of S.airport.items) r += (BUILDINGS[it.kind] || {}).rent || 0;
    return r;
  }
};
