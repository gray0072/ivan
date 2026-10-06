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
  settings: { difficulty: 'medium', quality: 'auto', sound: true, units: 'aviation', lang: '', landingAid: true },

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
    d.aircraft = d.aircraft || ['VIKNA19'];
    d.selected = d.selected || 'VIKNA19';
    d.contracts = d.contracts || [];
    d.stats = d.stats || { flights: 0, blockTime: 0, landings: 0, perfect: 0, crashes: 0, cheats: 0, bestGrade: '', bestPay: 0 };
    d.pilot = { name: (d.pilot && d.pilot.name) || CAREER.PILOT_NAME_DEFAULT };   // older saves also had an operator name
    for (const l of d.log || []) {
      if (l.tpl === 'Operator certificate granted to {airline}. Base: Stockholm Arlanda.') {
        l.tpl = '{name} starts flying. Base: Stockholm Arlanda.'; l.args = { name: d.pilot.name }; l.text = logLine(l.tpl, l.args).text;
      }
    }
    d.base = d.base || CAREER.HOME_BASE;
    d.lastTo = d.lastTo || d.base;
    d.season = d.season === undefined ? Math.floor(rand.next() * 12) : d.season;
    d.regions = d.regions || ['sweden'];
    // (a board from before it grew to six offers is dealt again)
    if (d.contracts.length < 5 || d.contracts.some((c) => !c.blockFuel || !c.airline)) this.generateContracts();
  },

  new(opts) {
    this.data = {
      pilot: { name: (opts.pilot || '').trim() || CAREER.PILOT_NAME_DEFAULT },
      money: CONTRACTS.START_MONEY,
      rep: { pax: 0, cargo: 0, bush: 0 },
      courses: ['gen1'],
      aircraft: ['VIKNA19'],
      selected: 'VIKNA19',
      contracts: [],
      base: CAREER.HOME_BASE,
      lastTo: CAREER.HOME_BASE,
      season: Math.floor(rand.next() * 12),
      regions: ['sweden'],
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
  aircraft() { return AIRCRAFT.find((a) => a.id === this.data.selected) || AIRCRAFT[0]; },
  owns(id) { return this.data.aircraft.indexOf(id) >= 0; },
  unlocked(ac) { return !ac.unlock || this.has(ac.unlock); },
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
      remote: d.courses.indexOf('bush4') >= 0
    };
  },

  // ---------- contracts ----------
  // can this aeroplane fly this leg? (range, runway, surface, open region, not too far for one leg)
  legOk(from, a, ac) {
    if (a.id === from.id || !this.hasRegion(a.region)) return false;
    const dist = geoDistanceNm(from.lat, from.lon, a.lat, a.lon);
    if (dist > Math.min(ac.maxRangeNm * 0.96, CONTRACTS.MAX_NM) || dist < 35) return false;
    if (a.rwyLen < ac.takeoffDist * 0.9) return false;              // the runway has to be long enough for the type
    const needsAsphalt = ac.surfaces.length === 1;
    if (needsAsphalt && a.aptClass.indexOf('bush') < 0 && a.aptClass.length === 1) return false;
    return true;
  },

  // the size of the contract board: it grows with the network and the experience
  offerCount() {
    const d = this.data;
    return Math.min(CONTRACTS.OFFERS_MAX, CONTRACTS.OFFERS + Math.max(0, d.regions.length - 1) +
      Math.floor(d.stats.flights / CONTRACTS.OFFERS_PER_FLIGHTS));
  },

  generateContracts() {
    if (!this.data) return;
    const rng = rand;
    const ac = this.aircraft();
    const fx = this.effects();
    const from = World.byId[this.data.lastTo] || World.byId[this.data.base];
    const home = World.byId[this.data.base];
    const away = from !== home;
    const all = World.list.filter((a) => this.legOk(from, a, ac));
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
      let guard = 0;
      while (picks.length < offers && pool.length && guard++ < 50) {
        const dest = rng.pick(pool);
        if (picks.indexOf(dest) < 0) picks.push(dest);
      }
    }
    this.data.contracts = picks.map((dest) => this.makeContract(rng, from, dest, geoDistanceNm(from.lat, from.lon, dest.lat, dest.lon), ac, fx)).filter(Boolean);
    // never leave a pilot with nothing to fly: fall back to a light mail run
    if (!this.data.contracts.length && all.length) {
      const dest = away && all.indexOf(home) >= 0 ? home : all[0];
      const c = this.makeContract(rng, from, dest, geoDistanceNm(from.lat, from.lon, dest.lat, dest.lon), ac, fx, 'mail');
      if (c) this.data.contracts.push(c);
    }
    this.save();
  },

  makeContract(rng, from, to, distNm, ac, fx, forceType) {
    // which kinds of work can this aircraft and this pilot take?
    const kinds = [];
    const repTotal = Math.max(this.data.rep.pax, this.data.rep.cargo, this.data.rep.bush);
    if (ac.seats > 12 && to.aptClass.indexOf('pax') >= 0 && this.data.rep.pax >= 0) kinds.push('pax');
    if (ac.payloadKg >= 1000 && (this.data.rep.cargo >= 0)) kinds.push('cargo');
    if (ac.surfaces.indexOf('grass') >= 0 || ac.surfaces.indexOf('ice') >= 0) {
      if (this.data.rep.bush >= 0 || fx.bush) kinds.push('bush');
    }
    if (!kinds.length) kinds.push('pax');
    let faction = rng.pick(kinds);
    if (faction === 'bush' && repTotal < 3 && !fx.bush) faction = 'pax';
    // urgent medevac only with the SAR course
    let urgent = false;
    if (fx.medevac && faction === 'bush' && rng.chance(0.22)) urgent = true;

    let type = 'pax';
    if (urgent) type = 'medevac';
    else if (faction === 'cargo') type = rng.pick(['cargo', 'cargo', 'reefer', 'fish', 'hazmat', 'mail']);
    else if (faction === 'bush') type = rng.pick(['mail', 'cargo', 'fish']);
    else type = rng.pick(['pax', 'pax', 'mail']);
    if (type === 'hazmat' && !fx.hazmat) type = 'cargo';
    if ((type === 'reefer' || type === 'fish') && !this.has('cargo3')) type = 'cargo';
    if ((type === 'pax') && ac.seats < 6) type = 'mail';
    if (forceType) type = forceType;

    const client = pickAirline(faction, from, to, rng);

    let pax = 0, payloadKg = 0;
    const usable = Math.max(0, Math.min(ac.payloadKg, ac.mtow - ac.emptyKg - ac.fuelCapKg * 0.55));
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
    // the world is compressed: what you actually fly is WORLD.SCALE of the real distance
    const gameNm = distNm * WORLD.SCALE;
    const airSec = gameNm / (ac.cruiseTas * 0.85) * 3600 + 240;                 // simulated seconds airborne
    const accel = clamp(gameNm * CONTRACTS.CRUISE_ACCEL_PER_NM, CONTRACTS.CRUISE_ACCEL_EXPECTED, CONTRACTS.CRUISE_ACCEL_MAX);
    const realSec = CONTRACTS.GROUND_ALLOWANCE_S + CONTRACTS.APPROACH_ALLOWANCE_S + airSec / accel;
    const deadline = realSec * CONTRACTS.TIME_ALLOWANCE_FACTOR * this.difficulty.deadlineFactor;
    let pay = distNm * CONTRACTS.BASE_PAY_PER_NM * CONTRACTS.FACTION_MULT[faction] +
      payloadKg * pt.ratePerKg * distNm / CONTRACTS.PAYLOAD_FEE_NM;
    if (urgent) pay *= CONTRACTS.URGENT_MULT;
    if (type === 'pax' && this.has('gen2')) pay *= 1.08;        // weather planning paid
    if (fx.mountain && (to.mountainous || from.mountainous)) pay *= 1.15;
    pay = Math.round(pay / 10) * 10;
    const taxiKg = CONTRACTS.FUEL_TAXI_KG_PER_ENGINE * ac.engines;
    const fuelKg = Math.round(ac.fuelFlowCruise * ac.engines * airSec / 3600 * 0.85 + taxiKg);
    const blockFuel = Math.min(ac.fuelCapKg, Math.round(fuelKg * CONTRACTS.FUEL_RESERVE_FACTOR + taxiKg));
    const repGain = urgent ? 3.2 : (distNm > 400 ? 2.2 : 1.2) + (payloadKg / 6000);

    return {
      id: from.id + '-' + to.id + '-' + type + '-' + Math.round(pay),
      client: client.name, airline: client.code,
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
    const gateIndex = rng.int(0, from.gateCount - 1);
    const blockFuel = Math.min(ac.fuelCapKg, contract.blockFuel || contract.fuelKg * 1.45);
    return {
      aircraft: ac, from, to, contract, gateIndex, blockFuel, skipPushback: !!opts.skipPushback,
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
