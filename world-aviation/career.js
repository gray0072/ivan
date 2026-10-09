'use strict';

// ============================================================
// World Aviation — the career: money, reputation, the training
// tree, contracts and the payout after every landing.
//
// One object in localStorage holds the whole career. Everything
// here is pure logic: ui.js draws it, game.js flies it.
// ============================================================

const CAREER_KEY = 'worldaviation.career.v1';
const SETTINGS_KEY = 'worldaviation.settings.v1';

const Career = {
  data: null,
  settings: { difficulty: 'medium', quality: 'auto', sound: true, units: 'aviation', lang: '', landingAid: true, noseUp: 'down' },

  // ---------- persistence ----------
  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) Object.assign(this.settings, JSON.parse(raw));
      delete this.settings.unit;
    } catch (err) { /* first run */ }
    // the game's language: picked on the title screen; the first time the old exam language or the browser's
    if (!LANGS[this.settings.lang]) {
      const q = this.settings.quizLang;
      this.settings.lang = q && q !== 'en' && LANGS[q] ? q : I18N.guess();
    }
    delete this.settings.quizLang;
    I18N.set(this.settings.lang);
    Units.metric = this.settings.units === 'metric';
    Input.invertPitch = this.settings.noseUp === 'up';
    return this.settings;
  },
  saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch (err) { /* ignore */ }
  },
  exists() {
    try { return !!localStorage.getItem(CAREER_KEY); } catch (err) { return false; }
  },
  load() {
    try {
      const raw = localStorage.getItem(CAREER_KEY);
      this.data = raw ? JSON.parse(raw) : null;
    } catch (err) { this.data = null; }
    if (this.data) this.migrate();
    return this.data;
  },
  save() {
    try { localStorage.setItem(CAREER_KEY, JSON.stringify(this.data)); } catch (err) { /* ignore */ }
  },
  migrate() {
    const d = this.data;
    d.rep = d.rep || { pax: 0, cargo: 0, bush: 0 };
    d.courses = d.courses || ['gen1'];
    // the fictional types of older versions became the real ones closest to them
    const renamed = { VIKNA19: 'B1900D', RJ84: 'CRJ200', SKARV27: 'F27F', FROST12: 'DHC6', NJ320: 'A320', BL600F: 'B763F' };
    d.aircraft = (d.aircraft || ['B1900D']).map((id) => renamed[id] || id);
    d.selected = renamed[d.selected] || d.selected || 'B1900D';
    d.contracts = d.contracts || [];
    for (const c of d.contracts) if (renamed[c.aircraftId]) c.aircraftId = renamed[c.aircraftId];
    // the stands of a contract from before they were drawn with it
    for (const c of d.contracts) {
      const from = World.byId[c.fromId], to = World.byId[c.toId];
      if (from && to && !(c.depGate < from.gatesPerTerminal && c.arrGate < to.gateCount)) Object.assign(c, World.pickGates(from, to, makeRng(hashStr(c.id))));
    }
    d.stats = d.stats || { flights: 0, blockTime: 0, landings: 0, perfect: 0, crashes: 0, cheats: 0, bestGrade: '', bestPay: 0 };
    d.pilot = { name: (d.pilot && d.pilot.name) || this.randomPilotName() };   // older saves also had an operator name
    for (const l of d.log || []) {
      if (l.tpl === 'Operator certificate granted to {airline}. Base: Stockholm Arlanda.') {
        l.tpl = '{name} starts flying. Base: Stockholm Arlanda.'; l.args = { name: d.pilot.name }; l.text = logLine(l.tpl, l.args).text;
      }
    }
    d.base = d.base || CAREER.HOME_BASE;
    d.lastTo = d.lastTo || d.base;
    d.season = d.season === undefined ? Math.floor(rand.next() * 12) : d.season;
    d.regions = d.regions || ['sweden'];
    d.typeFlights = d.typeFlights || {};      // flights completed in each type, by its id
    d.newAircraft = d.newAircraft || [];      // types a course has just unlocked, not yet seen in the hangar
    // the flights to each airport, by its code (an older save: counted from the log it kept)
    if (!d.visits) {
      d.visits = {};
      for (const l of d.log || []) if (l.args && l.args.to && l.args.g) d.visits[l.args.to] = (d.visits[l.args.to] || 0) + 1;
    }
    // (a board from before it grew to six offers is dealt again)
    if (d.contracts.length < 5 || d.contracts.some((c) => !c.blockFuel || !c.airline)) this.generateContracts();
  },

  // a Swedish name for a new pilot (data/pilots.js), never the one just offered
  randomPilotName(not) {
    const pool = PILOT_NAMES.filter((n) => n !== not);
    return pool[Math.floor(Math.random() * pool.length)];
  },

  new(opts) {
    this.data = {
      pilot: { name: (opts.pilot || '').trim() || this.randomPilotName() },
      money: CONTRACTS.START_MONEY,
      rep: { pax: 0, cargo: 0, bush: 0 },
      courses: ['gen1'],
      aircraft: ['B1900D'],
      selected: 'B1900D',
      contracts: [],
      base: CAREER.HOME_BASE,
      lastTo: CAREER.HOME_BASE,
      season: Math.floor(rand.next() * 12),
      regions: ['sweden'],
      typeFlights: {},
      newAircraft: [],
      visits: {},
      stats: { flights: 0, blockTime: 0, landings: 0, perfect: 0, crashes: 0, cheats: 0, bestGrade: '', bestPay: 0 },
      log: []
    };
    this.data.log.push(logLine('{name} starts flying. Base: Stockholm Arlanda.', { name: this.data.pilot.name }, 0));
    this.save();
    this.generateContracts();
    return this.data;
  },

  // how this pilot starts a flight: at the gate (the full ground procedure) or after pushback;
  // remembered in the career, so it is the pilot's habit
  get skipPushback() { return !!(this.data && this.data.skipPushback); },
  setSkipPushback(v) {
    if (!this.data) return;
    this.data.skipPushback = !!v;
    this.save();
  },

  // the departure time this pilot flies at (TIME_OF_DAY): remembered in the career too
  get timeOfDay() { const v = this.data && this.data.timeOfDay; return TIME_OF_DAY[v] ? v : 'day'; },
  setTimeOfDay(v) {
    if (!this.data || !TIME_OF_DAY[v]) return;
    this.data.timeOfDay = v;
    this.save();
  },

  reset() {
    try { localStorage.removeItem(CAREER_KEY); } catch (err) { /* ignore */ }
    this.data = null;
  },

  // one remembered choice, set on the title screen and in every restart dialog
  get difficulty() { return DIFFICULTY[this.settings.difficulty] || DIFFICULTY.medium; },
  aircraft() { return AIRCRAFT.find((a) => a.id === this.data.selected) || AIRCRAFT.find((a) => !a.unlock); },
  owns(id) { return this.data.aircraft.indexOf(id) >= 0; },
  unlocked(ac) { return !ac.unlock || this.has(ac.unlock); },
  flightsIn(id) { return (this.data.typeFlights && this.data.typeFlights[id]) || 0; },
  // the types unlocked since the last visit to the hangar, and that visit
  newAircraft() { return AIRCRAFT.filter((a) => (this.data.newAircraft || []).indexOf(a.id) >= 0); },
  seenNewAircraft() {
    if (!this.data.newAircraft || !this.data.newAircraft.length) return;
    this.data.newAircraft = [];
    this.save();
  },
  // aircraft are leased per sector: any unlocked type can be selected
  select(id) {
    const ac = AIRCRAFT.find((a) => a.id === id);
    if (!ac || !this.unlocked(ac)) return;
    if (!this.owns(id)) this.data.aircraft.push(id);
    this.data.selected = id;
    this.save();
    this.generateContracts();
  },

  // ---------- the network: traffic rights, a region at a time ----------
  hasRegion(id) { return this.data.regions.indexOf(id) >= 0; },
  bestRep() { return Math.max(this.data.rep.pax, this.data.rep.cargo, this.data.rep.bush); },
  regionState(rg) {
    const owned = this.hasRegion(rg.id);
    const repOk = this.bestRep() >= rg.rep, flightsOk = this.data.stats.flights >= rg.flights;
    return { owned, repOk, flightsOk, available: !owned && repOk && flightsOk, afford: this.data.money >= rg.cost };
  },
  buyRegion(id) {
    const rg = REGIONS.find((x) => x.id === id);
    const st = rg && this.regionState(rg);
    if (!st || !st.available || !st.afford) return false;
    this.data.money -= rg.cost;
    this.data.regions.push(rg.id);
    this.data.log.unshift(logLine('Traffic rights: {region}', { region: rg.name }, this.data.log.length));
    this.save();
    this.generateContracts();
    return true;
  },

  // ---------- training tree ----------
  has(courseId) { return this.data.courses.indexOf(courseId) >= 0; },
  courseState(c) {
    const reqCourse = (c.requires || []).every((r) => this.has(r));
    const reqRep = c.rep === undefined ? true : this.repFor(c.branch) >= c.rep;
    const bought = this.has(c.id);
    return {
      available: reqCourse && reqRep && !bought,
      lockedByCourse: !reqCourse, lockedByRep: !reqRep && reqCourse,
      bought
    };
  },
  repFor(branch) {
    if (branch === 'general') return Math.max(this.data.rep.pax, this.data.rep.cargo, this.data.rep.bush);
    return this.data.rep[branch] || 0;
  },
  canAfford(c) { return this.data.money >= c.cost; },
  buyCourse(c) {
    if (!this.canAfford(c)) return false;
    const st = this.courseState(c);
    if (!st.available) return false;
    this.data.money -= c.cost;
    this.data.courses.push(c.id);
    // the types this course opens are new in the hangar until the pilot has been there
    for (const a of AIRCRAFT) if (a.unlock === c.id && this.data.newAircraft.indexOf(a.id) < 0) this.data.newAircraft.push(a.id);
    this.save();
    this.generateContracts();
    return true;
  },
  // Effects unlocked by the courses
  effects() {
    const d = this.data;
    return {
      responseFactor: d.courses.indexOf('gen3') >= 0 ? 1.4 : 1,
      hint: d.courses.indexOf('gen3') >= 0,
      responseFactor2: d.courses.indexOf('gen4') >= 0 ? 1.6 : 1,
      iceFactor: (d.courses.indexOf('gen2') >= 0 ? 0.8 : 1) * (d.courses.indexOf('cargo3') >= 0 ? 0.65 : 1) * (d.courses.indexOf('bush2') >= 0 ? 0.55 : 1),
      medevac: d.courses.indexOf('bush3') >= 0,
      ifr: d.courses.indexOf('pax2') >= 0,
      hazmat: d.courses.indexOf('cargo1') >= 0,
      forecast: d.courses.indexOf('gen2') >= 0,
      crm: d.courses.indexOf('gen4') >= 0,
      heavy: d.courses.indexOf('cargo4') >= 0,
      bush: d.courses.indexOf('bush1') >= 0,
      payloadTol: d.courses.indexOf('cargo2') >= 0 ? 1.15 : 1,
      mountain: d.courses.indexOf('pax3') >= 0,
      widebody: d.courses.indexOf('pax4') >= 0,
      remote: d.courses.indexOf('bush4') >= 0,
      turboprop: d.courses.indexOf('paxtp') >= 0,
      fbw: d.courses.indexOf('paxfbw') >= 0,
      etops: d.courses.indexOf('paxetops') >= 0,
      outsize: d.courses.indexOf('cargo5') >= 0
    };
  },

  // ---------- contracts ----------
  // can this aeroplane fly this leg? (range, runway, surface, open region, not too far for one leg)
  legOk(from, a, ac) {
    if (a.id === from.id || !this.hasRegion(a.region)) return false;
    const dist = geoDistanceNm(from.lat, from.lon, a.lat, a.lon);
    if (dist > Math.min(ac.maxRangeNm * 0.96, CONTRACTS.MAX_NM) || dist < 35) return false;
    // the runway has to be long enough for the type, a grass strip only for types cleared for grass
    // (a type too big for the stands may still go there: the hangar warns about it)
    const misfit = this.misfit(ac, a);
    return misfit !== 'runway' && misfit !== 'grass';
  },

  // the airport the pilot is at now: where the last flight ended, or the base
  here() { return World.byId[this.data.lastTo] || World.byId[this.data.base]; },
  // why a type does not suit an airport, or null: 'runway' (too short for it), 'grass' (a grass
  // strip, the type not cleared for grass) or 'span' (its wings too wide for the stands and the
  // taxiways, LAYOUT.MAX_SPAN by the airport's size)
  misfit(ac, a) {
    if (a.rwyLen < ac.takeoffDist * 0.9) return 'runway';
    if (a.aptClass.length === 1 && a.aptClass[0] === 'bush' && ac.surfaces.indexOf('grass') < 0) return 'grass';
    if (ac.dims.span > (LAYOUT.MAX_SPAN[a.terminal] || Infinity)) return 'span';
    return null;
  },

  // the size of the contract board: it grows with the network and the experience
  offerCount() {
    const d = this.data;
    return Math.min(CONTRACTS.OFFERS_MAX, CONTRACTS.OFFERS + Math.max(0, d.regions.length - 1) * CONTRACTS.OFFERS_PER_REGION +
      Math.floor(d.stats.flights / CONTRACTS.OFFERS_PER_FLIGHTS));
  },

  // the client groups this aeroplane and this pilot can work for: passengers in a type with more
  // than a dozen seats, freight in one that lifts a tonne, bush work in one cleared for grass or
  // ice (with the bush course or some reputation already)
  factionsFor(ac, fx) {
    const out = [];
    const repTotal = this.bestRep();
    if (ac.seats > 12) out.push('pax');
    if (ac.payloadKg >= 1000) out.push('cargo');
    if ((ac.surfaces.indexOf('grass') >= 0 || ac.surfaces.indexOf('ice') >= 0) && (repTotal >= 3 || fx.bush)) out.push('bush');
    if (!out.length) out.push(ac.seats > 12 ? 'pax' : 'cargo');
    return out;
  },
  // The client group of the next offer to `to`: the one furthest below its share of the board so
  // far (a random one of them on a tie). Passengers take half the board when the aeroplane can
  // carry them, the freight groups (cargo, bush) share the rest, so passengers and freight come
  // in about equal numbers; passengers only to an airport with passenger traffic.
  dealFaction(kinds, counts, to, rng) {
    const ok = kinds.filter((k) => k !== 'pax' || to.aptClass.indexOf('pax') >= 0);
    if (!ok.length) return kinds[0] === 'pax' ? 'cargo' : kinds[0];
    const pax = kinds.indexOf('pax') >= 0, freight = kinds.length - (pax ? 1 : 0);
    const share = (k) => (k === 'pax' ? (freight ? 0.5 : 1) : (pax ? 0.5 : 1) / freight);
    const load = (k) => ((counts[k] || 0) + 1) / share(k);
    const least = Math.min(...ok.map(load));
    const f = rng.pick(ok.filter((k) => load(k) - least < 1e-9));
    counts[f] = (counts[f] || 0) + 1;
    return f;
  },

  // how many times the pilot has flown to an airport (the novelty sort of the board)
  visitsTo(id) { return (this.data && this.data.visits && this.data.visits[id]) || 0; },

  generateContracts() {
    if (!this.data) return;
    const rng = rand;
    const ac = this.aircraft();
    const fx = this.effects();
    const from = this.here();
    const home = World.byId[this.data.base];
    const away = from !== home;
    const kinds = this.factionsFor(ac, fx), counts = {};
    // the legs this type may fly that some client may fly too (traffic rights, data/airlines.js);
    // if none of them has a client, the legs alone, for the light mail run below
    const legs = World.list.filter((a) => this.legOk(from, a, ac));
    const served = legs.filter((a) => this.clientGroups(kinds, from, a).length);
    const all = served.length ? served : legs;
    const picks = [];
    const offers = this.offerCount();
    if (!away) {
      // from the base: anywhere open, each destination at most twice
      const used = {};
      let guard = 0;
      while (picks.length < offers && all.length && guard++ < 200) {
        const dest = rng.pick(all);
        if ((used[dest.id] = (used[dest.id] || 0) + 1) > 2) continue;
        picks.push(dest);
      }
    } else {
      // away: the flight home if it is in reach, and onward legs (towards home first)
      const homeOk = all.indexOf(home) >= 0;
      if (homeOk) picks.push(home, home);
      const onward = all.filter((a) => a !== home).sort((p, q) =>
        geoDistanceNm(p.lat, p.lon, home.lat, home.lon) - geoDistanceNm(q.lat, q.lon, home.lat, home.lon));
      const pool = homeOk ? onward : onward.slice(0, Math.max(3, Math.ceil(onward.length / 2)));
      // (each destination once, unless the pool is too small to fill the board)
      let guard = 0;
      while (picks.length < offers && pool.length && guard++ < 400) {
        const dest = rng.pick(pool);
        if (picks.indexOf(dest) < 0 || guard > 200) picks.push(dest);
      }
    }
    this.data.contracts = picks.map((dest) => {
      const dist = geoDistanceNm(from.lat, from.lon, dest.lat, dest.lon);
      const f = this.dealFaction(kinds, counts, dest, rng);
      // no client of that group may fly it: another group's offer instead
      for (const k of [f].concat(this.clientGroups(kinds, from, dest).filter((g) => g !== f))) {
        const c = this.makeContract(rng, from, dest, dist, ac, fx, null, k);
        if (c) return c;
      }
      return null;
    }).filter(Boolean);
    // never leave a pilot with nothing to fly: fall back to a light mail run
    if (!this.data.contracts.length && all.length) {
      const dest = away && all.indexOf(home) >= 0 ? home : all[0];
      const groups = this.clientGroups(kinds, from, dest);
      const c = this.makeContract(rng, from, dest, geoDistanceNm(from.lat, from.lon, dest.lat, dest.lon), ac, fx, 'mail',
        groups[0] || kinds[0], !groups.length);
      if (c) this.data.contracts.push(c);
    }
    this.save();
  },

  // the client groups of `kinds` with an airline that may fly this route (pickAirline), passengers
  // only to an airport with passenger traffic
  clientGroups(kinds, from, to) {
    return kinds.filter((k) => (k !== 'pax' || to.aptClass.indexOf('pax') >= 0) &&
      AIRLINES.some((al) => al.kinds.indexOf(k) >= 0 && airlineMayFly(al, k, from, to)));
  },

  // the airlines of any group that may fly this route, or null
  mayFly(from, to, faction) {
    const list = AIRLINES.filter((al) => airlineMayFly(al, faction, from, to));
    return list.length ? list : null;
  },

  // faction: the client group the board dealt this offer to (dealFaction); without one, any the
  // aeroplane and the destination allow. null when no airline of that group may fly the route,
  // unless `anyClient` (the last-resort mail run: then an airline of another group that may fly
  // it, else any of the group)
  makeContract(rng, from, to, distNm, ac, fx, forceType, faction, anyClient) {
    if (!faction) faction = this.dealFaction(this.factionsFor(ac, fx), {}, to, rng);
    // urgent medevac only with the SAR course
    let urgent = false;
    if (fx.medevac && faction === 'bush' && rng.chance(0.22)) urgent = true;

    let type;
    if (urgent) type = 'medevac';
    else type = rng.pick(faction === 'cargo' ? CONTRACTS.CARGO_TYPES : faction === 'bush' ? CONTRACTS.BUSH_TYPES : CONTRACTS.PAX_TYPES);
    if (type === 'hazmat' && !fx.hazmat) type = 'cargo';
    if ((type === 'reefer' || type === 'fish') && !this.has('cargo3')) type = 'cargo';
    if ((type === 'pax') && ac.seats < 6) type = 'mail';
    if (forceType) type = forceType;

    const client = pickAirline(faction, from, to, rng) || (anyClient ? rng.pick(this.mayFly(from, to, faction) ||
      AIRLINES.filter((al) => al.kinds.indexOf(faction) >= 0)) : null);
    if (!client) return null;

    // what you actually fly (WORLD.SCALE of the real distance; 1 = the world at its real size)
    const gameNm = distNm * WORLD.SCALE;
    const airSec = gameNm / (ac.cruiseTas * 0.85) * 3600 + 240;                 // simulated seconds airborne
    const taxiKg = CONTRACTS.FUEL_TAXI_KG_PER_ENGINE * ac.engines;
    const fuelKg = Math.round(ac.fuelFlowCruise * ac.engines * airSec / 3600 * 0.85 + taxiKg);
    // the load leaves room under the maximum take-off weight for the trip fuel with a margin
    const minFuel = Math.min(ac.fuelCapKg, Math.round(fuelKg * CONTRACTS.FUEL_MIN_FACTOR));
    let pax = 0, payloadKg = 0;
    const usable = Math.max(0, Math.min(ac.payloadKg, ac.mtow - ac.emptyKg - ac.fuelCapKg * 0.55, ac.mtow - ac.emptyKg - minFuel));
    if (type === 'pax') {
      const maxPax = Math.floor(usable / 103);
      pax = Math.max(1, Math.round(Math.min(ac.seats, maxPax) * rng.range(CONTRACTS_PAX_FILL[0], CONTRACTS_PAX_FILL[1])));
      payloadKg = Math.round(pax * 95 + ac.seats * 8);       // passengers and their bags
    } else if (type === 'medevac') {
      pax = rng.int(1, 3);
      payloadKg = Math.round(pax * 95 + 340);                  // crew, stretcher and equipment
    } else {
      payloadKg = Math.round(usable * rng.range(0.45, 0.95) / 10) * 10;
      if (payloadKg < 60) return null;
    }
    if (payloadKg > usable) payloadKg = Math.round(usable);

    const pt = PAYLOAD[type];
    const accel = clamp(gameNm * CONTRACTS.CRUISE_ACCEL_PER_NM, CONTRACTS.CRUISE_ACCEL_EXPECTED, CONTRACTS.CRUISE_ACCEL_MAX);
    const realSec = CONTRACTS.GROUND_ALLOWANCE_S + CONTRACTS.APPROACH_ALLOWANCE_S + airSec / accel;
    const deadline = realSec * CONTRACTS.TIME_ALLOWANCE_FACTOR * this.difficulty.deadlineFactor;
    let pay = distNm * CONTRACTS.BASE_PAY_PER_NM * CONTRACTS.FACTION_MULT[faction] +
      payloadKg * pt.ratePerKg * distNm / CONTRACTS.PAYLOAD_FEE_NM;
    if (urgent) pay *= CONTRACTS.URGENT_MULT;
    if (type === 'pax' && this.has('gen2')) pay *= 1.08;        // weather planning paid
    if (fx.mountain && (to.mountainous || from.mountainous)) pay *= 1.15;
    if (fx.turboprop && ac.engineType === 'prop' && distNm < CONTRACTS.TURBOPROP_SHORT_NM) pay *= CONTRACTS.TURBOPROP_SHORT_MULT;
    if (fx.etops && ac.engineType === 'jet' && ac.engines === 2 && distNm > CONTRACTS.ETOPS_NM) pay *= CONTRACTS.ETOPS_MULT;
    pay = Math.round(pay / 10) * 10;
    // as much as the tanks and the maximum take-off weight allow
    const blockFuel = Math.min(ac.fuelCapKg, ac.mtow - ac.emptyKg - payloadKg, Math.round(fuelKg * CONTRACTS.FUEL_RESERVE_FACTOR + taxiKg));
    const repGain = urgent ? 3.2 : (distNm > 400 ? 2.2 : 1.2) + (payloadKg / 6000);

    return {
      id: from.id + '-' + to.id + '-' + type + '-' + Math.round(pay),
      client: client.name, airline: client.code,
      ...World.pickGates(from, to, rng),
      faction, type, urgent,
      fromId: from.id, toId: to.id,
      pax, payloadKg, payloadLabel: pt.label,
      distanceNm: Math.round(distNm),
      blockMin: Math.round(airSec / 60),
      deadline: Math.round(deadline),
      pay, fuelKg, blockFuel, repGain: Math.round(repGain * 10) / 10,
      difficulty: contractDifficulty(distNm, type, to),
      aircraftId: ac.id
    };
  },

  contractById(id) { return (this.data.contracts || []).find((c) => c.id === id); },

  // ---------- the practice landing ----------
  // a simulator session in the selected aircraft: a share of its hourly lease
  practiceFee(ac) {
    ac = ac || this.aircraft();
    return Math.max(PRACTICE.FEE_MIN, Math.round(ac.rent * PRACTICE.FEE_LEASE_SHARE / 10) * 10);
  },
  payPractice() {
    const fee = this.practiceFee();
    this.data.money -= fee;
    this.save();
    return fee;
  },
  // the reputation a practice landing earns with the contract's client group: only what beats
  // this contract's best practice so far, so repeating a landing does not farm it
  practiceReward(contract, grade, cheated) {
    const want = cheated ? 0 : (PRACTICE.REP[grade] || 0);
    const c = this.contractById(contract.id) || contract;
    const gain = Math.round(Math.max(0, want - (c.practiceRep || 0)) * 10) / 10;
    if (gain > 0) {
      c.practiceRep = want;
      const f = c.faction;
      this.data.rep[f] = clamp(Math.round(((this.data.rep[f] || 0) + gain) * 10) / 10, 0, 100);
    }
    this.save();
    return gain;
  },

  // ---------- flying it ----------
  flightSetup(contract, opts) {
    const ac = this.aircraft();
    const from = World.byId[contract.fromId], to = World.byId[contract.toId];
    const rng = makeRng(hashStr(contract.id) ^ (opts.seed || 0));
    const fx = this.effects();
    const dep = World.weatherFor(from, rng, this.difficulty, { month: this.data.season });
    const arr = World.weatherFor(to, rng, this.difficulty, { month: this.data.season });
    const cruise = World.cruiseWeather(rng, this.difficulty, (from.lat + to.lat) / 2);
    // low weather needs an IFR rating, otherwise the arrival is visual or you pay for a diversion
    if ((arr.vis < 1500 || arr.cloudBase < 300) && !fx.ifr) {
      arr.vis = Math.max(arr.vis, 6000);
      arr.lowCloud = false;
      arr.precip = 'none';
    }
    const blockFuel = Math.min(ac.fuelCapKg, contract.blockFuel || contract.fuelKg * 1.45);
    return {
      aircraft: ac, from, to, contract, blockFuel, skipPushback: !!opts.skipPushback,
      weather: { dep, arr, cruise }, seed: rng.int(1, 1e9), fx
    };
  },

  // ---------- the debrief ----------
  payout(result) {
    const d = this.data;
    const c = result.contract;
    const ac = AIRCRAFT.find((a) => a.id === c.aircraftId) || this.aircraft();
    if (result.cheated) {
      d.stats.cheats += result.cheatsUsed || 1;
      // not paid, but the aeroplane is there: the board is dealt again from the arrival
      d.lastTo = c.toId;
      this.generateContracts();
      this.save();
      return { lines: [{ label: 'Cheated run — not paid', value: 0 }], total: 0, rep: 0, grade: result.grade, records: false };
    }
    const gm = CONTRACTS.GRADE_MULT[result.grade] || 1;
    const lines = [];
    const base = c.pay;
    const gradeBonus = Math.round(c.pay * (gm - 1));
    lines.push({ label: 'Contract', value: base });
    if (gradeBonus) lines.push({ label: 'Landing grade {g}', args: { g: result.grade }, value: gradeBonus });
    if (result.onTime) lines.push({ label: 'On time', value: Math.round(base * 0.08) });
    const fullGround = !result.pushbackSkipped && !result.noClearance;
    if (fullGround) lines.push({ label: 'Full ground procedure', value: Math.round(base * CONTRACTS.FULL_GROUND_BONUS) });
    const tod = TIME_OF_DAY[result.timeOfDay];
    if (tod && tod.bonus) lines.push({ label: tod.name + ' flight', value: Math.round(base * tod.bonus) });
    // the lease runs per block hour (at least one), and the fuel burnt is paid for
    const hours = Math.max(1, result.blockSec / 3600);
    lines.push({ label: 'Aircraft lease ({ac}, {h} h)', args: { ac: ac.name, h: hours.toFixed(1) }, value: -Math.round(ac.rent * hours) });
    lines.push({ label: 'Fuel burnt ({kg} kg)', args: { kg: Math.round(result.fuelUsed) }, value: -Math.round(result.fuelUsed * CONTRACTS.FUEL_RATE) });
    if (result.damage > 0.02) {
      const dmg = -Math.round(c.pay * result.damage * 0.7);
      lines.push({ label: 'Repairs and downtime', value: dmg });
    }
    if (result.mishandled > 0) lines.push({ label: 'Checklists mishandled', value: -Math.round(c.pay * 0.1 * result.mishandled) });
    if (result.handled > 0) lines.push({ label: 'Emergencies handled', value: Math.round(c.pay * 0.06 * result.handled) });
    if (result.moneyFactor && result.moneyFactor < 1) {
      lines.push({ label: 'Medical diversion costs', value: -Math.round(c.pay * (1 - result.moneyFactor)) });
    }
    if (result.noClearance) lines.push({ label: 'Took off without a clearance (fine)', value: -Math.round(base * SIM.NO_CLEARANCE_FINE) });
    if (result.taxiOverspeed) lines.push({ label: 'Taxi overspeed, {v} kt (fine)', args: { v: result.taxiOverspeed }, value: -Math.round(base * SIM.TAXI_OVERSPEED_FINE) });
    if (!result.onTime) lines.push({ label: 'Late delivery', value: -Math.round(base * 0.12) });
    const total = lines.reduce((s, l) => s + l.value, 0);
    d.money += total;
    let rep = c.repGain * (0.6 + 0.4 * gm);
    if (result.mishandled > 0) rep -= result.mishandled * 0.8;
    if (result.onTime) rep += 0.4;
    if (fullGround) rep += CONTRACTS.FULL_GROUND_REP;
    if (this.has('gen4')) rep += 0.5;
    rep -= (result.repPenalty || 0) / 10;
    rep = Math.max(0, Math.round(rep * 10) / 10);
    const rp = d.rep[c.faction] || 0;
    d.rep[c.faction] = clamp(Math.round((rp + rep) * 10) / 10, 0, 100);

    d.stats.flights++;
    d.typeFlights[ac.id] = (d.typeFlights[ac.id] || 0) + 1;
    d.visits[c.toId] = (d.visits[c.toId] || 0) + 1;
    d.stats.blockTime += result.blockSec;
    d.stats.landings++;
    if (result.grade === 'A+' || result.grade === 'A') d.stats.perfect++;
    if (result.failed) d.stats.crashes++;
    const order = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];
    if (!d.stats.bestGrade || order.indexOf(result.grade) > order.indexOf(d.stats.bestGrade)) d.stats.bestGrade = result.grade;
    if (total > d.stats.bestPay) d.stats.bestPay = total;
    d.lastTo = c.toId;
    if (c.toId === d.base) d.lastTo = d.base;
    d.log.unshift(dayLabel(c, result, d.log.length));
    d.log = d.log.slice(0, 24);
    const bankrupt = d.money < CONTRACTS.START_DEBT_LIMIT;
    this.generateContracts();
    this.save();
    return { lines, total, rep, grade: result.grade, records: true, bankrupt };
  },

  failFlight(result) {
    const d = this.data;
    if (result.contract && !result.cheated) {
      d.stats.crashes++;
      const cost = Math.round(result.contract.pay * 0.12);
      d.money -= cost;
      d.rep[result.contract.faction] = clamp((d.rep[result.contract.faction] || 0) - 1.5, 0, 100);
      d.log.unshift(logLine('Flight {from} → {to} lost: {reason}', { from: result.contract.fromId, to: result.contract.toId, reason: result.reason }, d.log.length));
      d.log = d.log.slice(0, 24);
      this.save();
      return { lines: [{ label: 'Recovery, investigation and the client', value: -cost }], total: -cost, rep: -1.5, bankrupt: d.money < CONTRACTS.START_DEBT_LIMIT };
    }
    d.stats.cheats += result.cheated ? 1 : 0;
    this.save();
    return { lines: [{ label: 'Cheated run', value: 0 }], total: 0, rep: 0 };
  },

  resetStats() {
    const d = this.data;
    d.stats = { flights: 0, blockTime: 0, landings: 0, perfect: 0, crashes: 0, cheats: 0, bestGrade: '', bestPay: 0 };
    this.save();
  }
};

const CONTRACTS_PAX_FILL = [0.5, 1.0];

function contractDifficulty(distNm, type, to) {
  let d = 1;
  d += distNm / 400;
  if (to.mountainous) d += 0.4;
  if (to.arctic) d += 0.5;
  if (type === 'hazmat' || type === 'medevac') d += 0.4;
  return Math.round(d * 10) / 10;
}

function dayLabel(c, result, day) {
  return logLine(result.onTime ? '{from} → {to} · {type} · grade {g} · on time' : '{from} → {to} · {type} · grade {g} · late',
    { from: c.fromId, to: c.toId, type: PAYLOAD[c.type] ? PAYLOAD[c.type].name : c.type, g: result.grade }, day);
}

// A log entry: the English template and its values, so the Career tab shows it in the language
// of the day (the values are translated too, where they are names from the tables); `text` is
// the English line, for old saves and anything else that reads the log.
function logLine(tpl, args, day) {
  return { text: tpl.replace(/\{(\w+)\}/g, (all, k) => args[k]), tpl, args, day };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
