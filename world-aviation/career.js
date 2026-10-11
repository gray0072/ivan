'use strict';

// ============================================================
// World Aviation — the career: money, reputation, the training
// tree, contracts and the payout after every landing.
//
// Each career is one object in localStorage, with its own settings;
// a device keeps several side by side. Everything here is pure
// logic: ui.js draws it, game.js flies it.
// ============================================================

const CAREER_KEY = 'worldaviation.career.v1';        // the one career of older versions: moved into the list on load
const CAREERS_KEY = 'worldaviation.careers.v1';      // the careers on this device: { ids, current }
const CAREER_SLOT = 'worldaviation.career.';         // + a career's id: that career
const SETTINGS_KEY = 'worldaviation.settings.v1';    // the device's language, and the settings with no career open
// a new career's settings (the language is the device's, above the careers)
const SETTINGS_DEFAULT = { difficulty: 'medium', quality: 'auto', sound: true, units: 'aviation', landingAid: true, noseUp: 'down' };

const Career = {
  data: null,
  settings: Object.assign({ lang: '' }, SETTINGS_DEFAULT),
  onSave: null,        // a career was saved (its id): core/cloud.js sends it up; headless, nobody listens
  onSettings: null,    // the settings in force changed: game.js applies the sound and the graphics

  // ---------- persistence ----------
  // Several careers live side by side on a device, each under its own key with its own settings
  // (all but the language, which is the device's and stays above the careers); the list says
  // which there are and which one is open.
  readJson(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (err) { return null; }
  },
  writeJson(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (err) { /* storage full or blocked */ }
  },
  index() {
    const x = this.readJson(CAREERS_KEY);
    return x && Array.isArray(x.ids) ? x : { ids: [], current: null };
  },

  // at boot: the device's settings (the language, and what is in force with no career open)
  loadSettings() {
    const s = this.readJson(SETTINGS_KEY) || {};
    // the game's language: picked on the title screen; the first time the old exam language or the browser's
    let lang = s.lang;
    if (!LANGS[lang]) lang = s.quizLang && s.quizLang !== 'en' && LANGS[s.quizLang] ? s.quizLang : I18N.guess();
    this.useSettings(s, lang);
    return this.settings;
  },
  // the settings in force: a career's own (missing ones at their defaults) and the device's language
  useSettings(s, lang) {
    const out = Object.assign({}, SETTINGS_DEFAULT, s || {});
    delete out.unit; delete out.quizLang;
    out.lang = lang || this.settings.lang || I18N.guess();
    this.settings = out;
    I18N.set(out.lang);
    Units.metric = out.units === 'metric';
    Input.invertPitch = out.noseUp === 'up';
    if (this.onSettings) this.onSettings();
  },
  saveSettings() {
    this.writeJson(SETTINGS_KEY, this.settings);
    if (!this.data) return;
    this.data.settings = careerSettings(this.settings);
    this.save();
  },

  load() {
    // the one career of older versions joins the list (and stays the one open)
    const old = this.readJson(CAREER_KEY);
    if (old) {
      if (!old.id) old.id = careerId();
      this.writeJson(CAREER_SLOT + old.id, old);
      const x = this.index();
      if (x.ids.indexOf(old.id) < 0) x.ids.push(old.id);
      if (!x.current) x.current = old.id;
      this.writeJson(CAREERS_KEY, x);
      try { localStorage.removeItem(CAREER_KEY); } catch (err) { /* ignore */ }
    }
    return this.open(this.index().current);
  },
  // open a career of this device (null: none), with its settings
  open(id) {
    const d = id ? this.readJson(CAREER_SLOT + id) : null;
    this.data = d;
    const x = this.index();
    x.current = d ? d.id : null;
    this.writeJson(CAREERS_KEY, x);
    if (d) this.migrate();
    if (d) this.useSettings(d.settings);
    return d;
  },
  // the careers on this device, for the list: who, how far, and the Google account each one syncs with
  list() {
    const cur = this.data && this.data.id;
    return this.index().ids.map((id) => {
      const d = id === cur ? this.data : this.readJson(CAREER_SLOT + id);
      if (!d) return null;
      return {
        id, current: id === cur, name: (d.pilot && d.pilot.name) || '', money: d.money || 0,
        flights: (d.stats && d.stats.flights) || 0, rank: d.rank || 0, updatedAt: d.updatedAt || '', cloud: d.cloud || null
      };
    }).filter(Boolean);
  },
  read(id) { return this.data && this.data.id === id ? this.data : this.readJson(CAREER_SLOT + id); },
  // work on a career that is not the open one (its migrate and save go to its own key)
  withCareer(d, fn) {
    const cur = this.data;
    this.data = d;
    try { return fn(); } finally { this.data = cur; }
  },
  // every save is stamped with its time (the cloud's merge takes the later one as its base)
  save() {
    if (!this.data) return;
    this.data.updatedAt = new Date().toISOString();
    this.writeJson(CAREER_SLOT + this.data.id, this.data);
    const x = this.index();
    if (x.ids.indexOf(this.data.id) < 0) { x.ids.push(this.data.id); this.writeJson(CAREERS_KEY, x); }
    if (this.onSave) this.onSave(this.data.id);
  },
  migrate() {
    const d = this.data;
    // the career's own id: the cloud and the list tell this career from another by it
    if (!d.id) { d.id = careerId(); this.save(); }
    // its own settings (a career from before they were its own takes the ones in force)
    if (!d.settings) d.settings = careerSettings(this.settings);
    d.rep = d.rep || { pax: 0, cargo: 0, bush: 0 };
    d.courses = d.courses || ['gen1'];
    // the fictional types of older versions became the real ones closest to them
    const renamed = { VIKNA19: 'B1900D', RJ84: 'CRJ200', SKARV27: 'F27F', FROST12: 'DHC6', NJ320: 'A320', BL600F: 'B763F' };
    d.aircraft = (d.aircraft || ['B1900D']).map((id) => renamed[id] || id);
    d.selected = renamed[d.selected] || d.selected || 'B1900D';
    d.contracts = d.contracts || [];
    for (const c of d.contracts) if (renamed[c.aircraftId]) c.aircraftId = renamed[c.aircraftId];
    // the stands of a contract from before they were drawn with it (or before freight went to the cargo stands and the bush work to the GA stands)
    for (const c of d.contracts) {
      const from = World.byId[c.fromId], to = World.byId[c.toId];
      if (from && to && !World.gatesValid(c, from, to)) Object.assign(c, World.pickGates(from, to, makeRng(hashStr(c.id)), World.zoneFor(c)));
    }
    d.stats = d.stats || { flights: 0, blockTime: 0, landings: 0, perfect: 0, crashes: 0, cheats: 0, bestGrade: '', bestPay: 0 };
    d.pilot = { name: (d.pilot && d.pilot.name) || this.randomPilotName() };   // older saves also had an operator name
    for (const l of d.log || []) {
      // (flights had a deadline once: their lines lose the "on time" / "late" at the end)
      if (l.tpl === '{from} → {to} · {type} · grade {g} · on time' || l.tpl === '{from} → {to} · {type} · grade {g} · late') {
        l.tpl = '{from} → {to} · {type} · grade {g}'; l.text = logLine(l.tpl, l.args).text;
      }
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
    d.mriya = d.mriya || { bought: [], placed: [] };   // the An-225's parts: bought, and fitted on the blueprint
    // ... and its finishes: the ones bought (its own is always there) and the one it wears
    d.mriya.finishes = d.mriya.finishes || [MRIYA_FINISHES[0].id];
    d.rtw = Rtw.fix(d.rtw);                    // round the world (sim/rtw.js): the expedition, the marks, the records
    if (d.mriya.finishes.indexOf(d.mriya.finish) < 0) d.mriya.finish = MRIYA_FINISHES[0].id;
    // (the level was a setting of the browser once: an older save takes the one picked last)
    if (!DIFFICULTY[d.difficulty]) d.difficulty = DIFFICULTY[this.settings.difficulty] ? this.settings.difficulty : 'medium';
    // the flights to each airport, by its code (an older save: counted from the log it kept)
    if (!d.visits) {
      d.visits = {};
      for (const l of d.log || []) if (l.args && l.args.to && l.args.g) d.visits[l.args.to] = (d.visits[l.args.to] || 0) + 1;
    }
    // the licence and rank the pilot has earned (an older save: taken as it is, without a promotion)
    if (d.rank === undefined) d.rank = this.rankIndex();
    // (a board from before it grew to six offers is dealt again)
    if (d.contracts.length < 5 || d.contracts.some((c) => !c.blockFuel || !c.airline)) this.generateContracts();
  },

  // a Swedish name for a new pilot (data/pilots.js), never the one just offered
  randomPilotName(not) {
    const pool = PILOT_NAMES.filter((n) => n !== not);
    return pool[Math.floor(Math.random() * pool.length)];
  },

  // a new career, opened at once, with every setting at its default; the careers before it stay in the list
  new(opts) {
    const level = DIFFICULTY[opts.difficulty] ? opts.difficulty : 'medium';
    this.useSettings({ difficulty: level });
    this.data = {
      id: careerId(),
      settings: careerSettings(this.settings),
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
      mriya: { bought: [], placed: [], finish: MRIYA_FINISHES[0].id, finishes: [MRIYA_FINISHES[0].id] },
      rtw: Rtw.blank(),
      visits: {},
      rank: 0,
      difficulty: level,
      stats: { flights: 0, blockTime: 0, landings: 0, perfect: 0, crashes: 0, cheats: 0, bestGrade: '', bestPay: 0 },
      log: []
    };
    this.data.log.push(logLine('{name} starts flying. Base: Stockholm Arlanda.', { name: this.data.pilot.name }, 0));
    this.save();
    const x = this.index();
    x.current = this.data.id;
    this.writeJson(CAREERS_KEY, x);
    this.generateContracts();
    return this.data;
  },

  // a new name for the pilot (the first line of the log, where they started flying, takes it too)
  rename(name) {
    const n = String(name || '').trim().slice(0, 24);
    if (!n || n === this.data.pilot.name) return false;
    this.data.pilot.name = n;
    for (const l of this.data.log) {
      if (l.tpl === '{name} starts flying. Base: Stockholm Arlanda.') { l.args = { name: n }; l.text = logLine(l.tpl, l.args).text; }
    }
    this.save();
    return true;
  },

  // ---------- the licence and the rank (PILOT_RANKS) ----------
  // what a rank asks for of its own, each with whether it is met: { course } passed, { flights }
  // flown, { passed } courses passed, { all } courses passed (have / need for the counts)
  rankNeeds(r) {
    const d = this.data, out = [];
    for (const id of r.courses || []) out.push({ course: id, ok: this.has(id) });
    if (r.flights) out.push({ flights: r.flights, have: d.stats.flights, ok: d.stats.flights >= r.flights });
    if (r.passed) out.push({ passed: r.passed, have: d.courses.length, ok: d.courses.length >= r.passed });
    if (r.all) out.push({ all: true, passed: COURSES.length, have: d.courses.length, ok: COURSES.every((c) => this.has(c.id)) });
    return out;
  },
  // the highest rank whose needs, and those of every rank below it, are met
  rankIndex() {
    let i = 0;
    while (i + 1 < PILOT_RANKS.length && this.rankNeeds(PILOT_RANKS[i + 1]).every((n) => n.ok)) i++;
    return i;
  },
  rank() { return PILOT_RANKS[Math.min(this.data.rank || 0, PILOT_RANKS.length - 1)]; },
  // after a flight or a course: a new rank earned is written in the log and returned (to be
  // celebrated on the screen that follows), else null; a rank once earned is kept
  checkRank() {
    const d = this.data, i = this.rankIndex();
    if (i <= (d.rank || 0)) return null;
    d.rank = i;
    const r = PILOT_RANKS[i];
    d.log.unshift(logLine('Promoted: {rank} · {licence}', { rank: r.title, licence: r.licence }, d.log.length));
    d.log = d.log.slice(0, 24);
    this.save();
    return r;
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

  // the open career deleted from this device (the others stay)
  reset() {
    if (this.data) {
      try { localStorage.removeItem(CAREER_SLOT + this.data.id); } catch (err) { /* ignore */ }
      const x = this.index();
      x.ids = x.ids.filter((id) => id !== this.data.id);
      x.current = null;
      this.writeJson(CAREERS_KEY, x);
    }
    this.data = null;
  },

  // ---------- the cloud copy (core/cloud.js) ----------
  // a career of the account not yet on this device joins the list (not opened), linked to the account;
  // the graphics level is this device's
  importCareer(data, cloud) {
    this.withCareer(data, () => {
      this.migrate();
      this.data.cloud = cloud;
      this.data.settings.quality = this.settings.quality;
      this.save();
    });
  },
  // the cloud's copy of a career on this device merged in (the open one: its settings applied again)
  mergeCareer(id, remote) {
    if (this.data && this.data.id === id) {
      this.mergeCloud(remote);
      this.useSettings(this.data.settings);
      return;
    }
    const d = this.readJson(CAREER_SLOT + id);
    if (d) this.withCareer(d, () => { this.migrate(); this.mergeCloud(remote); });
  },
  // The same career saved on another device, merged in so the progress of both survives: the one
  // saved last is the base, taken as it is (money, reputation, contracts, the aeroplane and where it
  // is, the log), and what only ever grows is kept from both — the courses, the aircraft, the regions,
  // the Mriya's parts and finishes, the flights in each type and to each airport, the records, the
  // rank and the round-the-world marks, records and history. Counts take the larger, never the sum, so merging again changes nothing.
  mergeCloud(remote) {
    const local = this.data;
    this.data = remote;
    this.migrate();
    const other = this.data;
    const d = (local.updatedAt || '') >= (other.updatedAt || '') ? local : other;
    const o = d === local ? other : local;
    const union = (a, b) => a.concat(b.filter((x) => a.indexOf(x) < 0));
    const maxEach = (a, b) => { for (const k in b) a[k] = Math.max(a[k] || 0, b[k]); };
    d.courses = union(d.courses, o.courses);
    d.aircraft = union(d.aircraft, o.aircraft);
    d.regions = union(d.regions, o.regions);
    d.mriya.finishes = union(d.mriya.finishes, o.mriya.finishes);
    d.mriya.placed = union(d.mriya.placed, o.mriya.placed);
    d.mriya.bought = union(d.mriya.bought, o.mriya.bought).filter((id) => d.mriya.placed.indexOf(id) < 0);
    d.mriya.done = !!(d.mriya.done || o.mriya.done);
    if (o.mriya.cheated) d.mriya.cheated = true;
    Rtw.merge(d.rtw, o.rtw);
    maxEach(d.typeFlights, o.typeFlights);
    maxEach(d.visits, o.visits);
    const order = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];
    for (const k of ['flights', 'blockTime', 'landings', 'perfect', 'crashes', 'cheats', 'bestPay']) d.stats[k] = Math.max(d.stats[k] || 0, o.stats[k] || 0);
    if (order.indexOf(o.stats.bestGrade) > order.indexOf(d.stats.bestGrade)) d.stats.bestGrade = o.stats.bestGrade;
    d.rank = Math.max(d.rank || 0, o.rank || 0);
    // the link to the Google account and the graphics level belong to this device
    d.cloud = local.cloud;
    d.settings.quality = local.settings.quality;
    this.data = d;
    this.save();
    return d;
  },

  // the career's own level, kept in its save like the other habits (set on the title screen and in
  // every restart dialog; a new career picks its own on the new career screen)
  get difficulty() {
    const v = this.data && this.data.difficulty;
    return DIFFICULTY[v] || DIFFICULTY[this.settings.difficulty] || DIFFICULTY.medium;
  },
  setDifficulty(v) {
    if (!DIFFICULTY[v]) return;
    this.settings.difficulty = v;
    this.saveSettings();
    if (!this.data) return;
    this.data.difficulty = v;
    this.save();
  },
  aircraft() { return AIRCRAFT.find((a) => a.id === this.data.selected) || AIRCRAFT.find((a) => !a.unlock); },
  // the type a contract is flown in: the one it was dealt for (a round-the-world leg: the
  // expedition's), else the selected one
  acOf(c) { return (c && AIRCRAFT.find((a) => a.id === c.aircraftId)) || this.aircraft(); },
  owns(id) { return this.data.aircraft.indexOf(id) >= 0; },
  // (the Mriya: built, and flown only by a pilot with every course passed)
  unlocked(ac) { return !ac.unlock || (ac.legend ? this.mriyaDone() && this.mriyaOpen() : this.has(ac.unlock)); },
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
    const reqFlights = !c.flights || this.data.stats.flights >= c.flights;
    const bought = this.has(c.id);
    return {
      available: reqCourse && reqRep && reqFlights && !bought,
      lockedByCourse: !reqCourse, lockedByRep: !reqRep && reqCourse, lockedByFlights: !reqFlights && reqCourse,
      reqCourse, reqRep, reqFlights,
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
    // the last course: a Mriya already built may now be flown
    const legend = AIRCRAFT.find((a) => a.legend);
    if (legend && this.mriyaDone() && this.mriyaOpen() && this.data.newAircraft.indexOf(legend.id) < 0) this.data.newAircraft.push(legend.id);
    this.promotion = this.checkRank();     // shown on the exam's result
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

  // ---------- the Mriya's assembly hall (data/mriya.js, ui/mriya.js) ----------
  // The An-225 is built from fifty parts, bought at any time. A part costs money and the
  // reputation of one client group, its share of MRIYA.PRICE_KR and MRIYA.PRICE_REP; bought, it
  // waits on the stand until the pilot fits it on the blueprint. The fiftieth fitted, the
  // aeroplane is theirs — to fly once every course is passed (mriyaOpen).
  mriyaOpen() { return COURSES.every((c) => this.has(c.id)); },
  mriyaDone() { return !!(this.data && this.data.mriya && this.data.mriya.done); },
  mriyaPrice(part) {
    if (!this._mriyaSums) {
      const sums = { kr: 0 };
      for (const p of MRIYA_PARTS) { sums.kr += p.kr; sums[p.kind] = (sums[p.kind] || 0) + p.rep; }
      this._mriyaSums = sums;
    }
    const sum = this._mriyaSums;
    return {
      kr: Math.max(MRIYA.ROUND_KR, Math.round(MRIYA.PRICE_KR * part.kr / sum.kr / MRIYA.ROUND_KR) * MRIYA.ROUND_KR),
      rep: Math.max(MRIYA.ROUND_REP, Math.round(MRIYA.PRICE_REP * part.rep / sum[part.kind] / MRIYA.ROUND_REP) * MRIYA.ROUND_REP),
      kind: part.kind
    };
  },
  // where a part is: 'placed' on the aeroplane, 'bought' (on the stand) or still in the 'shop'
  mriyaState(id) {
    const m = this.data.mriya;
    return m.placed.indexOf(id) >= 0 ? 'placed' : m.bought.indexOf(id) >= 0 ? 'bought' : 'shop';
  },
  // what stops the pilot buying a part, or null: 'money' or 'rep'
  mriyaWhyNot(part) {
    const pr = this.mriyaPrice(part);
    if (this.data.money < pr.kr) return 'money';
    if ((this.data.rep[pr.kind] || 0) < pr.rep) return 'rep';
    return null;
  },
  buyMriyaPart(id) {
    const part = MRIYA_PARTS.find((p) => p.id === id);
    if (!part || this.mriyaState(id) !== 'shop' || this.mriyaWhyNot(part)) return false;
    const pr = this.mriyaPrice(part);
    this.data.money -= pr.kr;
    this.data.rep[pr.kind] = Math.max(0, Math.round(((this.data.rep[pr.kind] || 0) - pr.rep) * 10) / 10);
    this.data.mriya.bought.push(id);
    this.save();
    return true;
  },
  // a bought part fitted in its place; the last one finishes the aeroplane (true)
  placeMriyaPart(id) {
    const m = this.data.mriya;
    const i = m.bought.indexOf(id);
    if (i < 0) return false;
    m.bought.splice(i, 1);
    m.placed.push(id);
    let done = false;
    if (m.placed.length >= MRIYA_PARTS.length && !m.done) {
      m.done = true; done = true;
      const ac = AIRCRAFT.find((a) => a.legend);
      if (!this.owns(ac.id)) this.data.aircraft.push(ac.id);
      if (this.data.newAircraft.indexOf(ac.id) < 0) this.data.newAircraft.push(ac.id);
      this.data.log.unshift(logLine(m.cheated ? 'The An-225 Mriya is built again (with cheats).' : 'The An-225 Mriya is built again — {name} flies the Dream.',
        { name: this.data.pilot.name }, this.data.log.length));
    }
    this.save();
    return done ? 'done' : true;
  },

  // The Mriya's finish (data/mriya.js): the one it wears, which ones the pilot has; each of the
  // others costs its price once (finishPrice), at any time; switching is free
  mriyaFinish() { return mriyaFinish(this.data && this.data.mriya && this.data.mriya.finish); },
  hasMriyaFinish(id) { return !!(this.data && this.data.mriya.finishes.indexOf(id) >= 0); },
  buyMriyaFinish(id) {
    const f = MRIYA_FINISHES.find((x) => x.id === id);
    if (!f || f.rtw || this.hasMriyaFinish(id) || this.data.money < finishPrice(f)) return false;
    this.data.money -= finishPrice(f);
    this.data.mriya.finishes.push(id);
    this.data.mriya.finish = id;
    this.save();
    return true;
  },
  setMriyaFinish(id) {
    if (!this.hasMriyaFinish(id)) return false;
    this.data.mriya.finish = id;
    this.save();
    return true;
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

  // the client groups a type is built for, whatever the pilot's ratings: passengers in one with
  // more than a dozen seats, freight in one that lifts a tonne, bush work in one cleared for grass
  // or ice (the hangar's purpose filter and its badges)
  suits(ac) {
    const out = [];
    if (ac.seats > CONTRACTS.PAX_SEATS) out.push('pax');
    if (ac.payloadKg >= CONTRACTS.CARGO_KG) out.push('cargo');
    if (ac.surfaces.indexOf('grass') >= 0 || ac.surfaces.indexOf('ice') >= 0) out.push('bush');
    return out;
  },
  // may the pilot take bush work: the Short Field Ops course or some reputation already
  bushRated(fx) { return !!(fx || this.effects()).bush || this.bestRep() >= CONTRACTS.BUSH_REP; },
  // the client groups this aeroplane and this pilot can work for
  factionsFor(ac, fx) {
    const out = this.suits(ac).filter((k) => k !== 'bush' || this.bushRated(fx));
    if (!out.length) out.push(ac.seats > CONTRACTS.PAX_SEATS ? 'pax' : 'cargo');
    return out;
  },
  // Why the board has no offer of a client group for the selected type here (the board's hint
  // under an empty filter): 'seats', 'payload' or 'surface' (the type is not built for it),
  // 'rating' (bush work without the course or the reputation), 'clients' (no client of the group
  // flies from here to anywhere the type reaches in the open regions) or 'luck' (the board was
  // dealt without one this time)
  boardGap(faction) {
    const ac = this.aircraft(), from = this.here();
    if (this.suits(ac).indexOf(faction) < 0) return faction === 'pax' ? 'seats' : faction === 'cargo' ? 'payload' : 'surface';
    if (faction === 'bush' && !this.bushRated()) return 'rating';
    const any = World.list.some((a) => this.legOk(from, a, ac) && this.clientGroups([faction], from, a, ac).length);
    return any ? 'luck' : 'clients';
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
    const served = legs.filter((a) => this.clientGroups(kinds, from, a, ac).length);
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
      for (const k of [f].concat(this.clientGroups(kinds, from, dest, ac).filter((g) => g !== f))) {
        const c = this.makeContract(rng, from, dest, dist, ac, fx, null, k);
        if (c) return c;
      }
      return null;
    }).filter(Boolean);
    // never leave a pilot with nothing to fly: fall back to a light mail run
    if (!this.data.contracts.length && all.length) {
      const dest = away && all.indexOf(home) >= 0 ? home : all[0];
      const groups = this.clientGroups(kinds, from, dest, ac);
      const c = this.makeContract(rng, from, dest, geoDistanceNm(from.lat, from.lon, dest.lat, dest.lon), ac, fx, 'mail',
        groups[0] || kinds[0], !groups.length);
      if (c) this.data.contracts.push(c);
    }
    this.save();
  },

  // the client groups of `kinds` with an airline that may fly this route in this type
  // (pickAirline, clientAirlines), passengers only to an airport with passenger traffic
  clientGroups(kinds, from, to, ac) {
    return kinds.filter((k) => (k !== 'pax' || to.aptClass.indexOf('pax') >= 0) &&
      clientAirlines(ac).some((al) => al.kinds.indexOf(k) >= 0 && airlineMayFly(al, k, from, to)));
  },

  // the airlines of any group that may fly this route in this type, or null
  mayFly(from, to, faction, ac) {
    const list = clientAirlines(ac).filter((al) => airlineMayFly(al, faction, from, to));
    return list.length ? list : null;
  },

  // faction: the client group the board dealt this offer to (dealFaction); without one, any the
  // aeroplane and the destination allow. null when no airline of that group may fly the route,
  // unless `anyClient` (the last-resort mail run: then an airline of another group that may fly
  // it, else any of the group). client: the client given (a round-the-world leg's sponsor)
  makeContract(rng, from, to, distNm, ac, fx, forceType, faction, anyClient, client) {
    if (!faction) faction = this.dealFaction(this.factionsFor(ac, fx), {}, to, rng);
    // urgent medevac only with the SAR course
    let urgent = false;
    if (fx.medevac && faction === 'bush' && rng.chance(0.22)) urgent = true;

    let type;
    if (urgent) type = 'medevac';
    else if (ac.loads) type = rng.pick(ac.loads);                // a type with loads of its own (the Beluga's)
    else type = rng.pick(faction === 'cargo' ? CONTRACTS.CARGO_TYPES : faction === 'bush' ? CONTRACTS.BUSH_TYPES : CONTRACTS.PAX_TYPES);
    if (type === 'hazmat' && !fx.hazmat) type = 'cargo';
    if ((type === 'reefer' || type === 'fish') && !this.has('cargo3')) type = 'cargo';
    if ((type === 'pax') && ac.seats < 6) type = 'mail';
    if (forceType) type = ac.loads ? ac.loads[0] : forceType;

    client = client || pickAirline(faction, from, to, rng, ac) || (anyClient ? rng.pick(this.mayFly(from, to, faction, ac) ||
      clientAirlines(ac).filter((al) => al.kinds.indexOf(faction) >= 0)) : null);
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
      ...World.pickGates(from, to, rng, World.zoneFor({ type, faction, aircraftId: ac.id })),
      faction, type, urgent,
      fromId: from.id, toId: to.id,
      pax, payloadKg, payloadLabel: pt.label,
      distanceNm: Math.round(distNm),
      blockMin: Math.round(airSec / 60),
      pay, fuelKg, blockFuel, repGain: Math.round(repGain * 10) / 10,
      difficulty: contractDifficulty(distNm, type, to),
      aircraftId: ac.id
    };
  },

  // a contract on the board, or the next leg of the expedition round the world
  contractById(id) { return (this.data.contracts || []).find((c) => c.id === id) || Rtw.legById(id); },

  // ---------- the practice landing ----------
  // a simulator session in the selected aircraft: a share of its hourly lease
  practiceFee(ac) {
    ac = ac || this.aircraft();
    return Math.max(PRACTICE.FEE_MIN, Math.round(ac.rent * PRACTICE.FEE_LEASE_SHARE / 10) * 10);
  },
  payPractice(ac) {
    const fee = this.practiceFee(ac);
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
    const ac = this.acOf(contract);
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

  // ---------- collisions (sim/collide.js, ui/incident.js) ----------
  // the compensation for a touch (contact: Flight.incident): COLLIDE.COMP_SHARE of the contract's
  // pay for what was hit, half of it at a crawl up to all of it at CRASH_KT, by the difficulty
  compensation(contract, contact) {
    const share = COLLIDE.COMP_SHARE[contact.kind] || COLLIDE.COMP_SHARE.building;
    const k = 0.5 + 0.5 * clamp(contact.speed / COLLIDE.CRASH_KT, 0, 1);
    const v = (contract ? contract.pay : 0) * share * k * this.difficulty.damageFactor;
    return Math.max(COLLIDE.COMP_MIN, Math.round(v / 10) * 10);
  },
  // stopped by the police
  policeFine(contract) { return Math.round((contract ? contract.pay : 0) * COLLIDE.POLICE_FINE / 10) * 10; },

  // ---------- the debrief ----------
  payout(result) {
    const d = this.data;
    const c = result.contract;
    const ac = AIRCRAFT.find((a) => a.id === c.aircraftId) || this.aircraft();
    if (result.cheated) {
      d.stats.cheats += result.cheatsUsed || 1;
      // not paid, but the aeroplane is there: the board is dealt again from the arrival (a
      // round-the-world leg does not count)
      d.lastTo = c.toId;
      const rtw = Rtw.legCheated(c);
      this.generateContracts();
      this.save();
      return { lines: [{ label: 'Cheated run — not paid', value: 0 }], total: 0, rep: 0, grade: result.grade, records: false, rtw };
    }
    const gm = CONTRACTS.GRADE_MULT[result.grade] || 1;
    const lines = [];
    const base = c.pay;
    const gradeBonus = Math.round(c.pay * (gm - 1));
    lines.push({ label: 'Contract', value: base });
    if (gradeBonus) lines.push({ label: 'Landing grade {g}', args: { g: result.grade }, value: gradeBonus });
    const fullGround = !result.pushbackSkipped && !result.noClearance;
    if (fullGround) lines.push({ label: 'Full ground procedure', value: Math.round(base * CONTRACTS.FULL_GROUND_BONUS) });
    const tod = TIME_OF_DAY[result.timeOfDay];
    if (tod && tod.bonus) lines.push({ label: tod.name + ' flight', value: Math.round(base * tod.bonus) });
    // the lease runs per block hour (at least one), and the fuel burnt is paid for
    const hours = Math.max(1, result.blockSec / 3600);
    // (the Mriya is the pilot's own: its upkeep instead of a lease)
    lines.push({ label: ac.legend ? 'Upkeep of your own aircraft ({ac}, {h} h)' : 'Aircraft lease ({ac}, {h} h)', args: { ac: ac.name, h: hours.toFixed(1) }, value: -Math.round(ac.rent * hours) });
    lines.push({ label: 'Fuel burnt ({kg} kg)', args: { kg: Math.round(result.fuelUsed) }, value: -Math.round(result.fuelUsed * CONTRACTS.FUEL_RATE) });
    if (result.damage > 0.02) {
      const dmg = -Math.round(c.pay * result.damage * 0.7);
      lines.push({ label: 'Repairs and downtime', value: dmg });
    }
    for (const comp of result.compensations || []) lines.push({ label: 'Compensation for {what}', args: { what: comp.what }, value: -comp.cost });
    if (result.mishandled > 0) lines.push({ label: 'Checklists mishandled', value: -Math.round(c.pay * 0.1 * result.mishandled) });
    if (result.handled > 0) lines.push({ label: 'Emergencies handled', value: Math.round(c.pay * 0.06 * result.handled) });
    if (result.moneyFactor && result.moneyFactor < 1) {
      lines.push({ label: 'Medical diversion costs', value: -Math.round(c.pay * (1 - result.moneyFactor)) });
    }
    if (result.noClearance) lines.push({ label: 'Took off without a clearance (fine)', value: -Math.round(base * SIM.NO_CLEARANCE_FINE) });
    if (result.taxiOverspeed) lines.push({ label: 'Taxi overspeed, {v} kt (fine)', args: { v: result.taxiOverspeed }, value: -Math.round(base * SIM.TAXI_OVERSPEED_FINE) });
    // a round-the-world leg: stamped in the passport; the last one pays the expedition's reward
    const rtw = Rtw.legLanded(c, result);
    if (rtw && rtw.finish) lines.push({ label: rtw.finish.iron ? 'Iron round the world: the reward' : 'Round the world: the reward', value: rtw.finish.kr });
    const total = lines.reduce((s, l) => s + l.value, 0);
    d.money += total;
    let rep = c.repGain * (0.6 + 0.4 * gm);
    if (result.mishandled > 0) rep -= result.mishandled * 0.8;
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
    // (the expedition's finish, logged as it ended, stays on top of the flight's line)
    const done = rtw && rtw.finish ? d.log.splice(0, rtw.finish.legend ? 2 : 1) : [];
    d.log.unshift(dayLabel(c, result, d.log.length));
    d.log = done.concat(d.log).slice(0, 24);
    const bankrupt = d.money < CONTRACTS.START_DEBT_LIMIT;
    const promoted = this.checkRank();
    this.generateContracts();
    this.save();
    return { lines, total, rep, grade: result.grade, records: true, bankrupt, promoted, rtw };
  },

  // result.kind: the failure's reason ('police': stopped by the police after a collision, a small
  // fine instead of a crash's costs); result.compensations: the touches paid for on the way
  failFlight(result) {
    const d = this.data;
    if (result.contract && !result.cheated) {
      d.stats.crashes++;
      const police = result.kind === 'police';
      const lines = [police ? { label: 'Stopped by the police (fine)', value: -this.policeFine(result.contract) }
        : { label: 'Recovery, investigation and the client', value: -Math.round(result.contract.pay * 0.12) }];
      for (const c of result.compensations || []) lines.push({ label: 'Compensation for {what}', args: { what: c.what }, value: -c.cost });
      const total = lines.reduce((sum, l) => sum + l.value, 0);
      const rep = police ? COLLIDE.POLICE_REP : CONTRACTS.CRASH_REP;
      d.money += total;
      d.rep[result.contract.faction] = clamp((d.rep[result.contract.faction] || 0) - rep, 0, 100);
      d.log.unshift(logLine('Flight {from} → {to} lost: {reason}', { from: result.contract.fromId, to: result.contract.toId, reason: result.reason }, d.log.length));
      d.log = d.log.slice(0, 24);
      // a round-the-world leg: flown again, or (Iron) the expedition is over
      const rtw = Rtw.legLost(result.contract, result.reason);
      this.save();
      return { lines, total, rep: -rep, bankrupt: d.money < CONTRACTS.START_DEBT_LIMIT, rtw };
    }
    d.stats.cheats += result.cheated ? 1 : 0;
    const rtw = result.contract ? Rtw.legCheated(result.contract) : null;
    this.save();
    return { lines: [{ label: 'Cheated run', value: 0 }], total: 0, rep: 0, rtw };
  },

  resetStats() {
    const d = this.data;
    d.stats = { flights: 0, blockTime: 0, landings: 0, perfect: 0, crashes: 0, cheats: 0, bestGrade: '', bestPay: 0 };
    this.save();
  }
};

const CONTRACTS_PAX_FILL = [0.5, 1.0];

// the settings a career keeps: all but the language, which is the device's
function careerSettings(s) {
  const out = Object.assign({}, s);
  delete out.lang;
  return out;
}

// a new career's id: random, long enough never to meet another one
function careerId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

// the Mriya's finish by its id (data/mriya.js), its own one (the first) when there is no such;
// what one costs (its price in units of MRIYA.FINISH_KR)
function mriyaFinish(id) {
  return MRIYA_FINISHES.find((f) => f.id === (id && id.id ? id.id : id)) || MRIYA_FINISHES[0];
}
function finishPrice(f) { return Math.round((f.price || 0) * MRIYA.FINISH_KR); }

function contractDifficulty(distNm, type, to) {
  let d = 1;
  d += distNm / 400;
  if (to.mountainous) d += 0.4;
  if (to.arctic) d += 0.5;
  if (type === 'hazmat' || type === 'medevac') d += 0.4;
  return Math.round(d * 10) / 10;
}

function dayLabel(c, result, day) {
  return logLine('{from} → {to} · {type} · grade {g}',
    { from: c.fromId, to: c.toId, type: PAYLOAD[c.type] ? PAYLOAD[c.type].name : c.type, g: result.grade }, day);
}

// A log entry: the English template and its values, so the Career tab shows it in the language
// of the day (the values are translated too, where they are names from the tables); `text` is
// the English line, for old saves and anything else that reads the log.
function logLine(tpl, args, day) {
  return { text: tpl.replace(/\{(\w+)\}/g, (all, k) => args[k]), tpl, args, day };
}
