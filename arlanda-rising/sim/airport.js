'use strict';

// Arlanda Rising — the airport itself: what is built (S.airport.items), the runways and the stands, what
// finishing a master-plan project does (`complete`), the small builds bought during a mission (`buy`), and
// the numbers the rest of the sim asks for — runway separation, fuel trucks, ploughs, the most of a thing worth
// having (`cap`: no more can be bought past it — a vehicle, the check-in desks the halls have room for, the remote
// stands, a kind's own `max`), why a small build cannot be bought now (`why`: its year, a later mission, what it needs, its
// limit), the airport's own shops in the terminals' cells (bought into a terminal with room, sold back: `sell`) and their
// share, the car parks' places against those the drivers need and what they take, the monthly running cost of
// everything the airport owns.

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
  // ---------- the car parks ----------
  // The drivers among a day's departing passengers need PARK_PLACES_PER_PAX places each (Invest.paxDay: the last days in
  // summary), less those the airport coaches (BUS_PARKING) and the train (TRAIN_PARKING) take away. The car parks' places
  // (data/buildings.js `places`) cover that need or a part of it; they earn PARKING_PER_PAX of every departing passenger ×
  // the share of the drivers they take (parkingShare). A place more than the need earns nothing, so a car park cannot be
  // bought while the places (those being built too) cover it — until the traffic grows.
  places(buys) {
    let s = 0;
    for (const it of S.airport.items) s += (BUILDINGS[it.kind] || {}).places || 0;
    if (buys) for (const b of (S.plan && S.plan.buys) || []) s += (BUILDINGS[b.kind] || {}).places || 0;
    return s;
  },
  // the share of the drivers left to the car parks once the coaches and the train have taken theirs
  driversLeft() { return (this.has('busStop') ? 1 - BUS_PARKING : 1) * (Terminal.trainRuns() ? 1 - TRAIN_PARKING : 1); },
  // the places the drivers need at today's traffic
  parkingNeed() { return Math.round(Invest.paxDay() * PARK_PLACES_PER_PAX * this.driversLeft()); },
  // the share of the drivers who find a place (`extra` places more: a what-if)
  parkingCover(extra) {
    const p = this.places() + (extra || 0), need = this.parkingNeed();
    return need > 0 ? Math.min(1, p / need) : p > 0 ? 1 : 0;
  },
  // the share of the departing passengers' parking the car parks take
  parkingShare(extra) { return this.parkingCover(extra) * this.driversLeft(); },
  // SEK a month the car parks take at today's traffic (`extra` places more: a what-if)
  parkingMonth(extra) { return Invest.paxDay() * 30 * PARKING_PER_PAX * this.parkingShare(extra); },
  // SEK a month one more car park of a kind would add at today's traffic (0 once the places cover the need)
  parkingGain(kind) { const p = (BUILDINGS[kind] || {}).places || 0; return p ? this.parkingMonth(p + this.places(true) - this.places()) - this.parkingMonth(this.places(true) - this.places()) : 0; },

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
  // the first terminal torn down: its item goes, its brands' units close, its own shops move into the other terminals'
  // free cells, each in turn (one with no room anywhere is sold back for SHOP_SELL_BACK of its price)
  razeFirstTerminal() {
    const a = S.airport, t1 = a.items.find((it) => it.kind === 'terminal');
    if (t1) a.items.splice(a.items.indexOf(t1), 1);
    a.t1Gone = true;
    if (a.units) a.units = a.units.filter((u) => u.term !== 't1');
    const of = this.shopPlaces().of, moving = a.items.filter((it) => this.cellsOf(it.kind) && (it.term || of[it.id]) === 't1');
    for (const it of moving) it.term = 'gone';
    for (const it of moving) {
      const t = this.roomFor(it.kind);
      if (t) { it.term = t; continue; }
      Finance.book('sold', this.sellPrice(it));
      a.items.splice(a.items.indexOf(it), 1);
      logEvent('sold', { kind: it.kind });
    }
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
  // the things past which one more cannot be bought: { max, why, n } (n what the limit counts: stands, runways, the top
  // fire category, the terminals' halls), or null for no limit — a fuel or a de-icing truck for each stand (an aircraft
  // takes one at a time), a full plough convoy for each runway (the convoys sweep at the same time), crash tenders up to
  // the top fire category, the check-in desks the halls of the terminals standing have room for (deskRoom), the remote
  // stands their row has room for (REMOTE_STANDS_MAX), a charger for each stand near the terminal that fits one, and a
  // kind's own `max` (data/buildings.js: one generator, two solar parks, five cargo stands…). ui/text.js capWhy and
  // capTip say why.
  cap(kind) {
    const stands = S.airport.stands.length, runways = Math.max(1, S.airport.runways.length);
    if ((BUILDINGS[kind] || {}).max) return { max: BUILDINGS[kind].max, why: 'max', n: BUILDINGS[kind].max };
    if (kind === 'charger') return { max: this.count('charger') + this.chargeable().length, why: 'charger', n: 0 };
    if (kind === 'fuelTruck') return { max: Math.max(1, stands * FUEL_TRUCKS_PER_STAND), why: 'stand', n: stands };
    if (kind === 'deicer') return { max: Math.max(1, stands * DEICERS_PER_STAND), why: 'stand', n: stands };
    if (kind === 'plough') return { max: runways * PLOUGH_CONVOY, why: 'runway', n: runways };
    if (kind === 'crashTender') return { max: FIRE_CAT_MAX - FIRE_CAT_BASE, why: 'fire', n: FIRE_CAT_MAX };
    if (kind === 'desk') { const h = this.deskHalls(); return { max: this.deskRoom(), why: 'hall', n: h.length }; }
    if (kind === 'stand') return { max: REMOTE_STANDS_MAX, why: 'remote', n: REMOTE_STANDS_MAX };
    return null;
  },
  // the terminals whose check-in halls stand (data/terminals.js `desks`): the first terminal's stays with the kerb after
  // it is torn down (2017), and the desks they have room for together
  deskHalls() { return TERMINAL_ORDER.filter((t) => TERMINALS[t].desks && Terminal.built(t === 't1' ? 'kerb' : t)); },
  deskRoom() { return this.deskHalls().reduce((s, t) => s + TERMINALS[t].desks, 0); },
  // how many of a kind the airport has, with those bought in plan time and not delivered yet (the desks: every desk, the
  // terminals' own too)
  owned(kind) {
    const n = kind === 'desk' ? S.airport.desks : this.count(kind);
    return n + ((S.plan && S.plan.buys) || []).filter((b) => b.kind === kind).length;
  },
  // nothing more of it can be bought: at its limit (cap), no terminal has the cells for a shop, or the car parks' places
  // cover what the drivers need
  full(kind) {
    const b = BUILDINGS[kind] || {}, cap = this.cap(kind);
    if (cap) return this.owned(kind) >= cap.max;
    if (b.cells) return !this.roomFor(kind);
    return !!b.places && this.places(true) >= this.parkingNeed();
  },
  // a save of an older version may have more remote stands than their row has room for: the last ones bought go, their
  // price paid back (at a mission's start, before anything stands on them)
  fitRemote() {
    const a = S.airport;
    while (this.count('stand') > REMOTE_STANDS_MAX) {
      const it = a.items.filter((x) => x.kind === 'stand').pop(), rem = a.stands.filter((s) => !s.at);
      a.items.splice(a.items.indexOf(it), 1);
      if (rem.length > PROJECTS.apron1.stands.length) a.stands.splice(a.stands.indexOf(rem[rem.length - 1]), 1);
      Finance.book('sold', it.price || BUILDINGS.stand.price);
    }
  },
  // the fire service's category: the first fire station's, and one more for each crash tender bought; before the station
  // stands, the building site's fire watch by the runway (FIRE_CAT_SITE: the training flights of 1959–60)
  fireCat() { return this.has('fireStation') ? Math.min(FIRE_CAT_MAX, FIRE_CAT_BASE + this.count('crashTender')) : this.siteFireWatch() ? FIRE_CAT_SITE : 0; },
  // the building site's fire watch: a runway and no fire station yet
  siteFireWatch() { return !this.has('fireStation') && S.airport.runways.length > 0; },
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
        break;
      // the first fire station with its crash tenders (built in 1-4; a world of an older version has it from the runway)
      case 'fireStation': if (!this.has('fireStation')) this.addItem('fireStation', { price }); break;
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
      case 'terminal3': this.addItem('terminal3', { price }); a.desks += p.desks || 2; Terminal.ensure(); break;
      // the first terminal torn down (2017): its building goes, the kerb and the check-in stay (Terminal.built('kerb'))
      case 'oldHall': this.razeFirstTerminal(); break;
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

  // the stands a charger can go on, the best first: near the terminal, up to size code D, not the cargo apron's
  chargeable() {
    return S.airport.stands.filter((s) => !s.charge && !s.cargo && SIZE_CODES.indexOf(s.code) <= 3)
      .sort((x, y) => (y.contact - x.contact) || (x.dist - y.dist) || (x.id < y.id ? -1 : 1));
  },
  // what a small build needs standing before it can be bought (data/buildings.js `needs`): null, or the need not met
  needs(kind) {
    const n = (BUILDINGS[kind] || {}).needs;
    const met = !n || (n === 'kerb' ? Terminal.built('kerb') : n === 'intl' ? this.has('intlTerminal') : n === 'security' ? (S.airport.lanes || 0) > 0 :
      n === 'deice' ? S.domains.deice !== undefined : n === 'border' ? !!S.airport.schengen : n === 'green' ? Green.on() : n === 'cargo' ? this.has('cargoCity') : true);
    return met ? null : n;
  },
  // why the player cannot buy a small build now (the buy menu shows it, Actions.buy refuses it): null when it can be
  // bought, else { why: 'year' (not before `from`), 'locked' (a later mission opens it: `mission`), 'needs' (`need`), 'full'
  // (Airport.full: a limit, no cells, enough places) }. Money is not a reason: a buy may take the money below zero.
  why(kind) {
    const b = BUILDINGS[kind];
    if (!b || !b.small) return { why: 'none' };
    if (b.from && Calendar.year() < b.from) return { why: 'year', year: b.from };
    const at = Missions.lockedBy(kind);
    if (at) return { why: 'locked', mission: at };
    const need = this.needs(kind);
    if (need) return { why: 'needs', need };
    if (this.full(kind)) return { why: 'full' };
    return null;
  },
  // a small build (the buy menu, a decision's option): paid now; in ops time there at once, in plan time after its days
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
    // a remote stand: the next place of their row (render/airport.js standPos), named R1…R4 apart from the aprons' numbers
    if (kind === 'stand') this.addStand({ name: 'R' + (this.count('stand') + 1), code: 'C', contact: false, dist: 4 });
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
      const st = this.chargeable()[0];
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
