'use strict';

// ============================================================
// World Aviation — round the world: the rules of a flight round the
// globe and the career's expedition (Career.data.rtw).
//
//   - the rules (check): from the home base back to it, every leg the
//     same way round, 360° of longitude in all, at least RTW.MIN_KM,
//     every leg one the type may fly (range, runway) and no more than
//     CONTRACTS.MAX_NM, no leg between Russia and CLOSED_TO_RUSSIA
//   - the expedition under way (active): its mode (std / iron), its
//     type, its plan of stops, where it waits (at), the legs flown,
//     and the contract of its next leg (for the sponsor, RTW_SPONSOR)
//   - a leg landed, lost or cheated (from Career.payout and
//     Career.failFlight), the finish (the reward, the marks, the
//     records, the history, the log), an Iron expedition lost
//   - the marks (done: per class, std / iron), the records per class
//     and the history of every expedition finished or lost
//
// Pure logic on the career's data: ui/rtw.js draws it, game.js flies
// the legs. Loaded after career.js.
// ============================================================

// the landing grades as numbers, for the average grade of an expedition
const RTW_GRADES = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];

const Rtw = {
  // ---------- the career's record ----------
  blank() { return { active: null, done: {}, records: {}, history: [], seen: false }; },
  data() {
    const d = Career.data;
    if (!d.rtw) d.rtw = this.blank();
    return d.rtw;
  },
  // an older save (or a part of the record missing) put right
  fix(r) {
    r = r || this.blank();
    r.done = r.done || {};
    r.records = r.records || {};
    r.history = r.history || [];
    if (r.active && !(r.active.plan && r.active.plan.length > 1)) r.active = null;
    return r;
  },
  // The same career saved on another device: the marks, the records and the history only grow,
  // so both copies' are kept; the expedition under way is the one in the copy saved last (d)
  merge(d, o) {
    if (!o) return;
    for (const k in o.done) {
      const a = d.done[k] || (d.done[k] = {}), b = o.done[k];
      a.std = !!(a.std || b.std); a.iron = !!(a.iron || b.iron);
    }
    for (const k in o.records) d.records[k] = this.better(d.records[k], o.records[k]);
    const ids = d.history.map((h) => h.id);
    for (const h of o.history) if (ids.indexOf(h.id) < 0) d.history.push(h);
    d.history.sort((p, q) => (q.date > p.date ? 1 : q.date < p.date ? -1 : 0));
    d.history = d.history.slice(0, RTW.HISTORY_MAX);
    d.seen = !!(d.seen || o.seen);
  },
  // at boot: an Iron leg left in the air (the page closed or reloaded during the flight) is lost;
  // a plain one simply waits to be flown again
  atBoot() {
    if (!Career.data) return;
    const a = this.data().active;
    if (!a || !a.inAir) return;
    if (a.mode === 'iron') this.lose('The flight was left unfinished');
    else { a.inAir = false; Career.save(); }
  },

  // ---------- when it opens, and with what ----------
  // the traffic rights of every region and the ETOPS course
  needs() {
    return { regions: REGIONS.filter((rg) => Career.hasRegion(rg.id)).length, of: REGIONS.length, course: Career.has(RTW.COURSE) };
  },
  open() {
    const n = this.needs();
    return n.regions >= n.of && n.course;
  },
  // the class of a type (RTW_CLASSES), or null: a jet, never one flown for its operator alone
  classOf(ac) {
    if (!ac || ac.engineType !== 'jet' || ac.operator) return null;
    return RTW_CLASSES.find((c) => (c.legend ? !!ac.legend : !ac.legend && c.klass.indexOf(ac.klass) >= 0)) || null;
  },
  // the types the pilot may take round
  types() { return AIRCRAFT.filter((a) => this.classOf(a) && Career.unlocked(a)); },
  acOf(id) { return AIRCRAFT.find((a) => a.id === id) || null; },
  home() { return World.byId[Career.data.base]; },
  // the longest leg a type may fly on the way round (as the board: a margin on its range)
  legMax(ac) { return Math.min(ac.maxRangeNm * 0.96, CONTRACTS.MAX_NM); },

  // ---------- the rules ----------
  // A plan (the stops' codes, the home base first) checked for a type: every leg with its
  // distance (nm, km), its change of longitude the short way round (dl), the longitude flown so
  // far (deg) and what is wrong with it, or null: 'same' (the same airport again), 'way' (not the
  // way round the first leg set), 'over' (past the home base's meridian before the end),
  // 'closed' (between Russia and a country closed to it), 'range' (too far for the type, or
  // further than one leg goes), 'runway' or 'grass' (the type cannot use the arrival). The whole
  // route: its km, the longitude (deg), the way round (dir: 1 east, -1 west), closed (back home
  // after 360°), short (under RTW.MIN_KM) and ok (it counts).
  check(plan, ac) {
    const home = Career.data.base;
    const legs = [];
    let km = 0, deg = 0, dir = 0;
    for (let i = 1; i < plan.length; i++) {
      const a = World.byId[plan[i - 1]], b = World.byId[plan[i]];
      if (!a || !b) { legs.push({ from: a, to: b, nm: 0, km: 0, dl: 0, deg, err: 'same' }); continue; }
      const nm = geoDistanceNm(a.lat, a.lon, b.lat, b.lon);
      const dl = wrapDeg(b.lon - a.lon);
      if (!dir && dl) dir = sign(dl);
      let err = null;
      if (a.id === b.id) err = 'same';
      else if (!dl || sign(dl) !== dir) err = 'way';
      else if (b.id !== home && deg + Math.abs(dl) >= 360 - 1e-6) err = 'over';
      else if (rtwClosed(a, b)) err = 'closed';
      else if (ac && nm > this.legMax(ac)) err = 'range';
      else if (ac) { const m = Career.misfit(ac, b); if (m === 'runway' || m === 'grass') err = m; }
      if (!err) deg += Math.abs(dl);
      km += nm * NM_KM;
      legs.push({ from: a, to: b, nm, km: nm * NM_KM, dl, deg, err });
    }
    const closed = plan.length > 2 && plan[0] === home && plan[plan.length - 1] === home && Math.abs(deg - 360) < 0.01;
    const short = km < RTW.MIN_KM;
    return { legs, km, deg, dir, closed, short, ok: plan[0] === home && closed && !short && !legs.some((l) => l.err) };
  },
  // a ready route (RTW_ROUTES), forwards or the other way round
  routePlan(id, reverse) {
    const r = RTW_ROUTES.find((x) => x.id === id);
    if (!r) return null;
    return reverse ? r.stops.slice().reverse() : r.stops.slice();
  },
  // the stops that may come next on a plan being drawn: every airport the next leg may go to
  nextStops(plan, ac) {
    if (!plan.length) return [];
    const chk = this.check(plan, ac);
    if (chk.closed || chk.legs.some((l) => l.err)) return [];
    return World.list.filter((b) => {
      if (!Career.hasRegion(b.region)) return false;
      const c = this.check(plan.concat(b.id), ac);
      return !c.legs[c.legs.length - 1].err;
    });
  },

  // ---------- the expedition under way ----------
  active() { return Career.data ? this.data().active : null; },
  // where it waits now (the airport its next leg leaves from), and the stop after
  stop() { const a = this.active(); return a ? World.byId[a.plan[a.at]] : null; },
  // the longitude and the kilometres flown so far
  progress() {
    const a = this.active();
    if (!a) return { deg: 0, km: 0, legs: 0, of: 0 };
    const chk = this.check(a.plan.slice(0, a.at + 1), null);
    return { deg: chk.deg, km: chk.km, legs: a.at, of: a.plan.length - 1 };
  },
  // the next leg's contract (from the sponsor), made when it is missing
  leg() {
    const a = this.active();
    if (!a) return null;
    if (!a.leg || a.leg.fromId !== a.plan[a.at] || a.leg.toId !== a.plan[a.at + 1]) { a.leg = this.makeLeg(); Career.save(); }
    return a.leg;
  },
  legById(id) {
    const a = this.active();
    return a && a.leg && a.leg.id === id ? a.leg : null;
  },
  // is this contract the expedition's next leg
  isLeg(c) {
    const a = this.active();
    return !!(a && c && c.rtw && a.leg && c.id === a.leg.id);
  },
  makeLeg() {
    const a = this.active(), ac = this.acOf(a.type);
    const from = World.byId[a.plan[a.at]], to = World.byId[a.plan[a.at + 1]];
    const rng = makeRng(hashStr(a.id + '/' + a.at));
    // passengers in a type with seats (where the arrival has passenger traffic), else freight —
    // the Mriya's outsize freight
    const pax = ac.seats > CONTRACTS.PAX_SEATS && to.aptClass.indexOf('pax') >= 0;
    const type = ac.legend ? 'outsize' : pax ? 'pax' : 'cargo';
    const c = Career.makeContract(rng, from, to, geoDistanceNm(from.lat, from.lon, to.lat, to.lon), ac, Career.effects(), type,
      pax ? 'pax' : 'cargo', false, RTW_SPONSOR);
    if (!c) return null;
    c.id = 'RTW-' + a.id + '-' + a.at;
    c.rtw = { run: a.id, leg: a.at, of: a.plan.length - 1, mode: a.mode };
    return c;
  },
  // set off: the mode ('std' or 'iron'), the type and the plan (it must count); route: the ready
  // route's id, or 'own'
  start(mode, typeId, plan, route) {
    const r = this.data(), ac = this.acOf(typeId);
    if (r.active || !this.open() || !ac || !this.classOf(ac) || !Career.unlocked(ac) || !this.check(plan, ac).ok) return false;
    r.active = { id: careerId(), mode: mode === 'iron' ? 'iron' : 'std', type: ac.id, plan: plan.slice(), route: route || 'own',
      at: 0, legs: [], started: new Date().toISOString(), inAir: false };
    r.active.leg = this.makeLeg();
    this.log(r.active.mode === 'iron' ? 'Off round the world in the {type}, Iron · {n} legs' : 'Off round the world in the {type} · {n} legs',
      { type: ac.name, n: plan.length - 1 });
    Career.save();
    return true;
  },
  // the legs not flown yet drawn again (the flown ones stay): only between two legs, and the
  // whole route must still count
  setRest(rest) {
    const a = this.active();
    if (!a || a.inAir) return false;
    const plan = a.plan.slice(0, a.at + 1).concat(rest);
    if (!this.check(plan, this.acOf(a.type)).ok) return false;
    a.plan = plan;
    a.leg = this.makeLeg();
    Career.save();
    return true;
  },
  // the leg has taken off (an Iron one then ends only at its arrival)
  airborne(c) {
    const a = this.active();
    if (!this.isLeg(c) || a.inAir) return;
    a.inAir = true;
    Career.save();
  },

  // ---------- a leg's end (Career.payout, Career.failFlight) ----------
  // Landed at its arrival: stamped in the passport; the last one is the finish. Returns what the
  // debrief shows: { stamp, at, of, deg, km, finish } (finish: the reward and the history's entry)
  // or null when the contract is not the expedition's leg.
  legLanded(c, result) {
    if (!this.isLeg(c)) return null;
    const a = this.active();
    const from = World.byId[c.fromId], to = World.byId[c.toId];
    const tod = TIME_OF_DAY[result.timeOfDay] || TIME_OF_DAY.day;
    const clock = (((tod.hour * 3600 + result.blockSec + (utcOffset(to) - utcOffset(from)) * 3600) % 86400) + 86400) % 86400;
    const stamp = {
      from: c.fromId, to: c.toId, km: Math.round(c.distanceNm * NM_KM), sec: Math.round(result.blockSec), grade: result.grade,
      date: new Date().toISOString(), clock: Math.round(clock),
      equator: (from.lat < 0) !== (to.lat < 0), dateLine: Math.abs(to.lon - from.lon) > 180
    };
    a.legs.push(stamp);
    a.at++;
    a.inAir = false;
    const p = this.progress();
    const out = { stamp, at: a.at, of: a.plan.length - 1, deg: p.deg, km: p.km, mode: a.mode, finish: null };
    if (a.at >= a.plan.length - 1) out.finish = this.finish();
    else a.leg = this.makeLeg();
    return out;
  },
  // Lost (a crash, a flight ended away from its arrival): a plain expedition waits for the leg
  // to be flown again; an Iron one is over. { retry } or { lost, entry }, or null.
  legLost(c, reason) {
    if (!this.isLeg(c)) return null;
    const a = this.active();
    if (a.mode === 'iron') return { lost: true, entry: this.lose(reason) };
    a.inAir = false;
    return { retry: true };
  },
  // flown with a cheat: the leg does not count (an Iron expedition is lost)
  legCheated(c) {
    if (!this.isLeg(c)) return null;
    const a = this.active();
    if (a.mode === 'iron') return { lost: true, entry: this.lose('A cheat was used') };
    a.inAir = false;
    return { retry: true, cheated: true };
  },
  // would ending this flight now lose an Iron expedition (the leg has taken off)
  ironAtStake(c) {
    const a = this.active();
    return !!(this.isLeg(c) && a.mode === 'iron' && a.inAir);
  },

  // The last leg landed: the reward, the marks, the records, the history and the log; the
  // Mriya's finish earns it the Meridian finish
  finish() {
    const d = Career.data, r = this.data(), a = r.active, ac = this.acOf(a.type), cls = this.classOf(ac).id;
    const iron = a.mode === 'iron', mult = iron ? RTW.IRON_MULT : 1;
    const kr = RTW.REWARD_KR * mult, rep = RTW.REWARD_REP * mult;
    for (const k in FACTIONS) d.rep[k] = clamp(Math.round(((d.rep[k] || 0) + rep) * 10) / 10, 0, 100);
    const mark = r.done[cls] || (r.done[cls] = {});
    mark.std = true;
    if (iron) mark.iron = true;
    const entry = this.entry(a, 'done');
    r.records[cls] = this.better(r.records[cls], { sec: entry.sec, legs: entry.legs, grade: entry.grade });
    r.history.unshift(entry);
    r.history = r.history.slice(0, RTW.HISTORY_MAX);
    r.active = null;
    let meridian = false;
    if (ac.legend && !Career.hasMriyaFinish(RTW_FINISH)) { d.mriya.finishes.push(RTW_FINISH); meridian = true; }
    this.log(iron ? 'Iron round the world in the {type}: {n} legs, {km} km, {h} h' : 'Round the world in the {type}: {n} legs, {km} km, {h} h',
      { type: ac.name, n: entry.legs, km: fmtNum(Math.round(entry.km)), h: Math.round(entry.sec / 3600) });
    if (ac.legend) this.log('The Dream has flown round the world', {});
    return { entry, kr, rep, meridian, iron, legend: !!ac.legend };
  },
  // an Iron expedition lost (reason: English, translated where it is shown)
  lose(reason) {
    const r = this.data(), a = r.active;
    if (!a) return null;
    const entry = this.entry(a, 'lost', reason);
    r.history.unshift(entry);
    r.history = r.history.slice(0, RTW.HISTORY_MAX);
    r.active = null;
    const at = World.byId[a.plan[a.at]];
    this.log('Iron round the world lost at leg {n}, {city}', { n: a.at + 1, city: at ? at.city : a.plan[a.at] });
    Career.save();
    return entry;
  },
  abandon() {
    const r = this.data(), a = r.active;
    if (!a || a.inAir) return false;
    r.history.unshift(this.entry(a, 'abandoned'));
    r.history = r.history.slice(0, RTW.HISTORY_MAX);
    r.active = null;
    const at = World.byId[a.plan[a.at]];
    this.log('Round the world abandoned at leg {n}, {city}', { n: a.at + 1, city: at ? at.city : a.plan[a.at] });
    Career.save();
    return true;
  },
  // an expedition for the history: the route, the type, the mode, the legs flown and their
  // grades, the km and the block time, how it ended
  entry(a, result, reason) {
    const ac = this.acOf(a.type), cls = this.classOf(ac);
    const km = a.legs.reduce((s, l) => s + l.km, 0), sec = a.legs.reduce((s, l) => s + l.sec, 0);
    const grades = a.legs.map((l) => l.grade);
    return {
      id: a.id, mode: a.mode, type: a.type, cls: cls ? cls.id : '', route: a.route, plan: a.plan.slice(), legs: a.legs.length,
      stops: a.legs.slice(), km, sec, grades, grade: this.avgGrade(grades), result, reason: reason || '', at: a.at,
      started: a.started, date: new Date().toISOString(), pilot: Career.data.pilot.name
    };
  },
  // the average of the landing grades, as a number (RTW_GRADES' index) to one decimal
  avgGrade(grades) {
    if (!grades.length) return 0;
    return Math.round(grades.reduce((s, g) => s + Math.max(0, RTW_GRADES.indexOf(g)), 0) / grades.length * 10) / 10;
  },
  gradeLetter(v) { return RTW_GRADES[clamp(Math.round(v), 0, RTW_GRADES.length - 1)]; },
  // a class's records, the better of two: the shortest block time, the fewest legs, the best grade
  better(p, q) {
    if (!p) return q ? Object.assign({}, q) : p;
    if (!q) return p;
    return { sec: Math.min(p.sec, q.sec), legs: Math.min(p.legs, q.legs), grade: Math.max(p.grade || 0, q.grade || 0) };
  },
  // the medal on the pilot's card: 'gold' (the Mriya's), 'iron', 'silver', or null
  medal() {
    if (!Career.data) return null;
    const r = this.data();
    if (r.done.mriya && r.done.mriya.std) return 'gold';
    if (Object.keys(r.done).some((k) => r.done[k].iron)) return 'iron';
    if (Object.keys(r.done).some((k) => r.done[k].std)) return 'silver';
    return null;
  },
  // the Network tab's gold dot: once, when it opens
  fresh() { return this.open() && !this.data().seen; },
  seen() {
    const r = this.data();
    if (r.seen || !this.open()) return;
    r.seen = true;
    Career.save();
  },

  log(tpl, args) {
    const d = Career.data;
    d.log.unshift(logLine(tpl, args, d.log.length));
    d.log = d.log.slice(0, 24);
  }
};

// the Mriya's finish earned by flying it round the world (data/mriya.js, `rtw: true`)
const RTW_FINISH = 'meridian';

// no flights between Russia and the countries closed to it (data/airlines.js)
function rtwClosed(a, b) {
  const x = stateOf(a.country), y = stateOf(b.country);
  return (x === 'Russia' && CLOSED_TO_RUSSIA.indexOf(y) >= 0) || (y === 'Russia' && CLOSED_TO_RUSSIA.indexOf(x) >= 0);
}
