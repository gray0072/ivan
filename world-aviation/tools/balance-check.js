#!/usr/bin/env node
'use strict';

// ============================================================
// World Aviation — is the career balanced, and is it fun to play through?
//
//   node world-aviation/tools/balance-check.js [--seeds 3] [--quick] [--type A359] [--log]
//
// Run it after adding an aircraft, an airport, a region or a course, or after changing a price,
// a pay rate or the reputation. It loads the game's own logic (the contracts, the invoice, the
// reputation, the board, the courses, the regions, the Mriya's parts) in a vm, the way the game
// does, and prints four parts, each with its checks (✓ / ✗; any ✗ exits with 1):
//
//   1. Economy — every type on a few hundred contracts of the real board from the real airports
//      (all regions open, every course passed, grade B): the median net pay of a flight, of a
//      short leg, the reputation, the real minutes the player spends on it and the net per minute.
//      Checks: every type earns on its work and on short legs, the classes pay more step by step
//      but not too many times more, a freighter earns about what an airliner of its class does,
//      no type earns many times the reputation of another, the bush work stays worth flying, the
//      Mriya earns the most.
//   2. Aircraft by course — the order the courses open in (by their flights) and the types each
//      one unlocks. Checks: never too many types at once, never too long without a new one.
//   3. Airports — every airport can be reached by some type and has a client.
//   4. The career — a bot plays a whole career with the real Career (Career.new, the board,
//      Career.payout, buyCourse, buyRegion, buyMriyaPart) a few times with different seeds: it
//      works for the client group that holds up its next goal (a course, a region, a Mriya part)
//      and otherwise for the best pay, buys what it can, picks the best type it has for the job.
//      Prints the flight at which each milestone comes (the median of the runs) and checks the
//      length of the game, the longest stretch without anything new, that every client group gets
//      its share of the flights and that many types get flown.
//
// The targets of the checks are in TARGET below: change them there, with a reason.
// --quick: one run of the career and fewer contracts per type; --type: the economy of one type,
// contract by contract; --log: the bot's flights one by one.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TARGET = {
  SAMPLES: 400,                 // contracts per type for the economy
  GRADE: 'B',                   // the landing grade the economy and the bot assume
  GROUND_REAL_MIN: 14,          // the player's real minutes of a flight off the autopilot (gate, taxi, take-off, approach, landing, taxi in)
  ACCEL: 128,                   // the time acceleration the player cruises at
  SHORT_NM: 400,                // a short leg
  // 1. economy
  CLASS_NAMES: ['turboprops', 'regional jets', 'narrowbodies', 'widebodies', 'the heaviest'],
  SPREAD_MAX: 16,               // the best class's median net per flight at most this many times the first class's
  STEP_MIN: 1.15,               // each class pays at least this much more than the one below
  PARITY: 1.5,                  // a class's freighters and airliners: their median nets within this ratio
  REP_SPREAD_MAX: 2.5,          // the median reputation of a flight: the most rewarding type at most this many times the least
  JACKPOT_MAX: 3,               // a type's best tenth of contracts (p90) at most this many times its median: no jackpots to hunt
  BUSH_SHARE: 0.35,             // the bush work in a bush type at least this share of the widebodies' median net
  // 2. aircraft by course
  TYPES_PER_COURSE_MAX: 2,      // types one course (or one step of a line) may unlock at once
  TYPE_GAP_MAX: 8,              // flights between two new types, at most
  // 4. the career
  MAX_FLIGHTS: 260,             // the bot gives up here
  ALL_COURSES: [45, 80],        // every course passed by this flight (range)
  ALL_REGIONS: [40, 85],        // every region's traffic rights
  MRIYA_BUILT: [60, 100],       // the Mriya's fiftieth part
  FULL: [60, 110],              // everything above (the bot plays well: a player takes longer)
  RTW_LEGS: 7 + 7,              // the expeditions round the world after it (a widebody's Classic and the Mriya's), not simulated
  DRY_MAX: 10,                  // until the last course: flights in a row without a new course, type, region, rank or ten more Mriya parts
  ENDGAME_MAX: 15,              // from the last course to the Mriya built (its dearest parts; a player also flies round the world then)
  GROUP_SHARE_MIN: 0.15,        // each client group gets at least this share of the bot's flights
  TYPES_FLOWN_MIN: 10           // types the bot flies at least once
};

const args = process.argv.slice(2);
const arg = (k, d) => (args.indexOf(k) >= 0 ? args[args.indexOf(k) + 1] : d);
const QUICK = args.indexOf('--quick') >= 0;
const SEEDS = +arg('--seeds', QUICK ? 1 : 3);
const ONE_TYPE = arg('--type', null);
const LOG = args.indexOf('--log') >= 0;
const SAMPLES = QUICK ? 150 : TARGET.SAMPLES;

// ---------- the game's logic in a vm ----------
const ROOT = path.join(__dirname, '..');
const FILES = ['constants.js', 'data/airports.js', 'data/airport-names.js', 'data/countries.js', 'data/airlines.js', 'data/mriya.js', 'data/rtw.js',
  'data/pilots.js', 'core/i18n.js', 'core/utils.js', 'data/geodata.js', 'sim/terrain.js', 'sim/world.js', 'career.js', 'sim/rtw.js'];
const noop = () => {};
const ctx = vm.createContext({
  console, Math, Date, JSON, Object, Array, Number, String, Map, Set, Float32Array, Uint8Array, Int32Array, isFinite, parseFloat,
  setTimeout: noop, clearTimeout: noop,
  window: {}, navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  document: { createElement: () => ({ getContext: () => null }), querySelectorAll: () => [], documentElement: {} },
  performance: { now: () => 0 },
  Input: {}                               // (the settings set its nose-up direction)
});
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const G = vm.runInContext(`({ Career, World, Rtw, AIRCRAFT, COURSES, REGIONS, MRIYA_PARTS, CONTRACTS, PILOT_RANKS,
  makeRng, reseed, geoDistanceNm })`, ctx);
const { Career, World, Rtw, AIRCRAFT, COURSES, REGIONS, MRIYA_PARTS, CONTRACTS, PILOT_RANKS } = G;
World.init();
Career.save = noop;                       // nothing to keep: the runs live in memory

// ---------- helpers ----------
const fails = [];
const check = (ok, text) => { console.log((ok ? '  ✓ ' : '  ✗ ') + text); if (!ok) fails.push(text); };
const quantile = (a, q) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const median = (a) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const k = (v) => (isNaN(v) ? '—' : Math.round(v / 1000) + 'k');
const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);
const realMin = (c) => TARGET.GROUND_REAL_MIN + c.blockMin / TARGET.ACCEL;
const legend = AIRCRAFT.find((a) => a.legend);
const result = (c, rng) => ({
  contract: c, grade: rng ? pickGrade(rng) : TARGET.GRADE, blockSec: c.blockMin * 60 + 1800, fuelUsed: c.fuelKg,
  damage: 0, compensations: [], mishandled: 0, handled: rng && rng.chance(0.4) ? 1 : 0, timeOfDay: 'day', pushbackSkipped: false
});
function pickGrade(rng) {
  const x = rng.next();
  return x < 0.06 ? 'A+' : x < 0.26 ? 'A' : x < 0.7 ? 'B' : x < 0.93 ? 'C' : 'D';
}
const net = (c, ac, res) => Career.invoice(c, ac, res).reduce((s, l) => s + l.value, 0);
// a type with an operator of its own flies only for it (the Belugas); the legend only once built
const typeOk = (ac) => Career.unlocked(ac);

// a career with everything open (the economy and the airports): no novelty, reputation 50
function openCareer() {
  G.reseed(7);
  Career.new({ pilot: 'Bot', difficulty: 'medium' });
  const d = Career.data;
  d.school.skipped = true;
  d.regions = REGIONS.map((r) => r.id);
  d.courses = COURSES.map((c) => c.id);
  d.rep = { pax: 50, cargo: 50, bush: 50 };
  for (const a of World.list) d.visits[a.id] = 1;
  d.mriya.done = true;
}

// ============================================================
// 1. Economy
// ============================================================
function economy() {
  console.log('\n1. ECONOMY — median per flight, grade ' + TARGET.GRADE + ', every region and course open (' + SAMPLES + ' contracts a type)\n');
  openCareer();
  const fx = Career.effects();
  const rng = G.makeRng(99);
  const rows = [];
  for (const ac of AIRCRAFT) {
    if (ONE_TYPE && ac.id !== ONE_TYPE) continue;
    const groups = Career.factionsFor(ac, fx);
    const legsFrom = new Map();
    const per = {};
    for (const g of groups) per[g] = { net: [], short: [], rep: [], nm: [], min: [], perMin: [] };
    let guard = 0, got = 0;
    while (got < SAMPLES * groups.length && guard++ < SAMPLES * 30) {
      const from = rng.pick(World.list);
      if (!legsFrom.has(from.id)) legsFrom.set(from.id, World.list.filter((a) => Career.legOk(from, a, ac)));
      const legs = legsFrom.get(from.id);
      if (!legs.length) continue;
      const to = rng.pick(legs);
      const g = groups[got % groups.length];
      const nm = G.geoDistanceNm(from.lat, from.lon, to.lat, to.lon);
      const c = Career.makeContract(rng, from, to, nm, ac, fx, null, g);
      if (!c) { got++; continue; }
      got++;
      const res = result(c);
      const v = net(c, ac, res), m = realMin(c);
      const p = per[c.faction];
      p.net.push(v); p.rep.push(Career.flightRep(c, res)); p.nm.push(c.distanceNm); p.min.push(m); p.perMin.push(v / m);
      if (c.distanceNm <= TARGET.SHORT_NM) p.short.push(v);
      if (ONE_TYPE) console.log('  ' + c.fromId + '-' + c.toId + ' ' + lpad(c.distanceNm, 5) + ' nm ' + pad(c.faction, 5) + pad(c.type, 8) + lpad(c.payloadKg, 7) + ' kg ' +
        ' ★' + c.difficulty + '  pay ' + lpad(k(c.pay), 6) + '  net ' + lpad(k(v), 6) + '  rep ' + Career.flightRep(c, res).toFixed(1));
    }
    for (const g of groups) {
      const p = per[g];
      if (!p.net.length) continue;
      rows.push({ ac, g, cls: ac.legend ? 'L' : Career.typeClass(ac), freighter: ac.seats <= CONTRACTS.PAX_SEATS, n: p.net.length,
        nm: median(p.nm), net: median(p.net), p90: quantile(p.net, 0.9), short: median(p.short), shortN: p.short.length, rep: median(p.rep), min: median(p.min), perMin: median(p.perMin) });
    }
  }
  console.log('  ' + pad('type', 9) + pad('cl', 3) + pad('group', 6) + lpad('nm', 6) + lpad('net', 8) + lpad('p90', 8) + lpad('short', 8) + lpad('rep', 6) + lpad('min', 6) + lpad('net/min', 9));
  for (const r of rows) {
    console.log('  ' + pad(r.ac.id, 9) + pad(r.cls, 3) + pad(r.g, 6) + lpad(Math.round(r.nm), 6) + lpad(k(r.net), 8) + lpad(k(r.p90), 8) + lpad(r.shortN >= 5 ? k(r.short) : '—', 8) +
      lpad(r.rep.toFixed(1), 6) + lpad(r.min.toFixed(1), 6) + lpad(k(r.perMin), 9));
  }
  if (ONE_TYPE) return;
  console.log('');
  // every type earns on its work, and on the short legs
  const losers = rows.filter((r) => !(r.net > 0));
  check(!losers.length, 'every type earns on every kind of work it takes' + (losers.length ? ': not ' + losers.map((r) => r.ac.id + ' ' + r.g + ' ' + k(r.net)).join(', ') : ''));
  const shortLosers = rows.filter((r) => r.shortN >= 5 && r.short < 0);
  check(!shortLosers.length, 'short legs (≤ ' + TARGET.SHORT_NM + ' nm) do not lose money' + (shortLosers.length ? ': ' + shortLosers.map((r) => r.ac.id + ' ' + r.g + ' ' + k(r.short)).join(', ') : ''));
  // the classes: each the best median of its types' main work (passengers or freight)
  const main = rows.filter((r) => r.g !== 'bush' || !r.ac.seats || r.ac.payloadKg < CONTRACTS.CARGO_KG);
  const best = [];
  for (let cl = 0; cl < TARGET.CLASS_NAMES.length; cl++) {
    const rs = main.filter((r) => r.cls === cl && r.g !== 'bush');
    best[cl] = rs.length ? Math.max(...rs.map((r) => r.net)) : NaN;
  }
  console.log('  classes, best median net: ' + best.map((v, i) => TARGET.CLASS_NAMES[i] + ' ' + k(v)).join(' · '));
  let stepOk = true;
  for (let i = 1; i < best.length; i++) if (!(best[i] >= best[i - 1] * TARGET.STEP_MIN)) stepOk = false;
  check(stepOk, 'each class pays at least ×' + TARGET.STEP_MIN + ' the one below');
  const spread = best[best.length - 1] / best[0];
  check(spread <= TARGET.SPREAD_MAX, 'the heaviest class pays ×' + spread.toFixed(1) + ' the turboprops (at most ×' + TARGET.SPREAD_MAX + ')');
  // freighters against airliners of the same class
  for (const cl of [3, 4]) {
    const fr = rows.filter((r) => r.cls === cl && r.freighter && !r.ac.operator && r.g === 'cargo').map((r) => r.net);   // (not the Belugas: Airbus's own work)
    const px = rows.filter((r) => r.cls === cl && !r.freighter && r.g === 'pax').map((r) => r.net);
    if (!fr.length || !px.length) continue;
    const ratio = median(fr) / median(px);
    check(ratio <= TARGET.PARITY && ratio >= 1 / TARGET.PARITY, TARGET.CLASS_NAMES[cl] + ': freighters earn ×' + ratio.toFixed(2) + ' of the airliners (within ×' + TARGET.PARITY + ')');
  }
  // no jackpots: the best contracts of a type not many times its usual ones
  const jack = rows.filter((r) => r.p90 > r.net * TARGET.JACKPOT_MAX);
  check(!jack.length, 'no jackpots: the best tenth of contracts at most ×' + TARGET.JACKPOT_MAX + ' the median' + (jack.length ? ': ' + jack.map((r) => r.ac.id + ' ' + r.g + ' ' + k(r.p90) + ' / ' + k(r.net)).join(', ') : ''));
  // reputation: no type far more rewarding than another
  const reps = rows.filter((r) => !r.ac.legend).map((r) => r.rep);
  const rs = Math.max(...reps) / Math.min(...reps);
  const top = rows.filter((r) => !r.ac.legend).sort((a, b) => b.rep - a.rep)[0];
  check(rs <= TARGET.REP_SPREAD_MAX, 'reputation per flight: the most rewarding (' + top.ac.id + ' ' + top.g + ' ' + top.rep.toFixed(1) + ') ×' + rs.toFixed(2) + ' the least (at most ×' + TARGET.REP_SPREAD_MAX + ')');
  // the bush work in a bush type, against the widebodies
  const bush = rows.filter((r) => r.g === 'bush' && r.cls === 0).map((r) => r.net);
  if (bush.length) {
    const share = Math.max(...bush) / best[3];
    check(share >= TARGET.BUSH_SHARE, 'bush work in a bush type: ' + k(Math.max(...bush)) + ', ' + Math.round(share * 100) + ' % of the widebodies (at least ' + Math.round(TARGET.BUSH_SHARE * 100) + ' %)');
  }
  // the legend earns the most
  const lg = rows.filter((r) => r.ac.legend).map((r) => r.net);
  if (lg.length) {
    const others = Math.max(...rows.filter((r) => !r.ac.legend).map((r) => r.net));
    check(Math.max(...lg) >= others, 'the Mriya earns the most: ' + k(Math.max(...lg)) + ' against ' + k(others));
  }
}

// ============================================================
// 2. Aircraft by course
// ============================================================
function unlocks() {
  console.log('\n2. AIRCRAFT BY COURSE — the courses in the order they open (flights), the types each unlocks\n');
  const order = COURSES.slice().sort((a, b) => (a.flights || 0) - (b.flights || 0));
  const events = [{ at: 0, types: AIRCRAFT.filter((a) => !a.unlock).map((a) => a.id) }];
  for (const c of order) {
    const types = AIRCRAFT.filter((a) => a.unlock === c.id).map((a) => a.id);
    console.log('  ' + lpad(c.flights || 0, 3) + '  ' + pad(c.name, 30) + (types.length ? types.join(', ') : '—'));
    if (types.length) events.push({ at: c.flights || 0, types, name: c.name });
  }
  const many = events.filter((e) => e.types.length > TARGET.TYPES_PER_COURSE_MAX);
  check(!many.length, 'at most ' + TARGET.TYPES_PER_COURSE_MAX + ' types at once' + (many.length ? ': ' + many.map((e) => e.name + ' ' + e.types.length).join(', ') : ''));
  let gap = 0, where = '';
  for (let i = 1; i < events.length; i++) if (events[i].at - events[i - 1].at > gap) { gap = events[i].at - events[i - 1].at; where = events[i - 1].at + '→' + events[i].at; }
  check(gap <= TARGET.TYPE_GAP_MAX, 'the longest wait for a new type: ' + gap + ' flights (' + where + ', at most ' + TARGET.TYPE_GAP_MAX + ')');
}

// ============================================================
// 3. Airports
// ============================================================
function airports() {
  console.log('\n3. AIRPORTS — reachable, and with clients\n');
  openCareer();
  const probe = ['B1900D', 'DHC6', 'A320', 'B77W', 'B748F', 'A124'].map((id) => AIRCRAFT.find((a) => a.id === id)).filter(Boolean);
  const bad = [], thin = [];
  for (const a of World.list) {
    const lands = AIRCRAFT.filter((ac) => !ac.legend && Career.misfit(ac, a) !== 'runway' && Career.misfit(ac, a) !== 'grass');
    const groups = new Set();
    for (const ac of probe) {
      if (lands.indexOf(ac) < 0) continue;
      const kinds = Career.factionsFor(ac, Career.effects());
      for (const o of World.list) {
        if (!Career.legOk(o, a, ac)) continue;
        for (const g of Career.clientGroups(kinds, o, a, ac)) groups.add(g);
        if (groups.size === kinds.length) break;
      }
    }
    if (!lands.length || !groups.size) bad.push(a.id);
    else if (groups.size === 1) thin.push(a.id + ' (' + [...groups][0] + ')');
  }
  console.log('  ' + World.list.length + ' airports' + (thin.length ? '; one client group only: ' + thin.join(', ') : ''));
  check(!bad.length, 'every airport takes some type and has a client' + (bad.length ? ': not ' + bad.join(', ') : ''));
  const regionsBad = REGIONS.filter((rg) => !World.list.some((a) => a.region === rg.id));
  check(!regionsBad.length, 'every region has airports' + (regionsBad.length ? ': not ' + regionsBad.map((r) => r.id).join(', ') : ''));
}

// ============================================================
// 4. The career, played by a bot
// ============================================================
function careerRun(seed) {
  G.reseed(seed);
  const rng = G.makeRng(seed * 7 + 1);
  Career.new({ pilot: 'Bot', difficulty: 'medium' });
  const d = Career.data;
  d.school.skipped = true;
  const marks = {};
  const mark = (k2, n) => { if (marks[k2] === undefined) marks[k2] = n; };
  const flights = [];
  let lastNew = 0, dry = 0, dryAt = 0, minutes = 0, bankrupt = false;
  const seenTypes = new Set(AIRCRAFT.filter(typeOk).map((a) => a.id));
  // (counted until every course is passed; after that the Mriya's last parts are the endgame)
  const fresh = (n) => { if (marks['all courses'] !== undefined && n > marks['all courses']) return; if (n - lastNew > dry) { dry = n - lastNew; dryAt = lastNew; } lastNew = n; };
  const nextCost = () => {
    const c = COURSES.filter((x) => !Career.has(x.id) && (x.requires || []).every((r) => Career.has(r))).sort((a, b) => a.cost - b.cost)[0];
    const r = REGIONS.filter((x) => !Career.hasRegion(x.id)).sort((a, b) => a.cost - b.cost)[0];
    return (c ? c.cost : 0) + (r ? r.cost : 0);
  };
  // buy what it can: courses, then regions, then the Mriya's parts (keeping a reserve for the next
  // course and region, unless the part is cheap)
  function shop(n) {
    let any = true;
    while (any) {
      any = false;
      for (const c of COURSES.slice().sort((a, b) => a.cost - b.cost)) {
        if (Career.courseState(c).available && Career.canAfford(c) && Career.buyCourse(c)) { any = true; mark('course ' + c.id, n); fresh(n); }
      }
      for (const r of REGIONS) {
        const st = Career.regionState(r);
        if (st.available && st.afford && Career.buyRegion(r.id)) { any = true; mark('region ' + r.id, n); fresh(n); }
      }
      for (const p of MRIYA_PARTS.slice().sort((a, b) => a.kr - b.kr)) {
        if (Career.mriyaState(p.id) !== 'shop' || Career.mriyaWhyNot(p)) continue;
        const pr = Career.mriyaPrice(p);
        if (d.money - pr.kr < nextCost() && pr.kr > 0.08 * d.money) continue;
        Career.buyMriyaPart(p.id);
        Career.placeMriyaPart(p.id);
        any = true;
        const placed = d.mriya.placed.length;
        if (placed === 1) { mark('Mriya: first part', n); fresh(n); }
        if (placed % 10 === 0 && placed < MRIYA_PARTS.length) { mark('Mriya: ' + placed + ' parts', n); fresh(n); }
        if (placed === MRIYA_PARTS.length) { mark('Mriya: built', n); fresh(n); }
      }
    }
    for (const ac of AIRCRAFT) if (typeOk(ac) && !seenTypes.has(ac.id)) { seenTypes.add(ac.id); mark('type ' + ac.id, n); fresh(n); }
    const rank = PILOT_RANKS[d.rank];
    if (rank && d.rank > 0) { if (marks['rank ' + rank.id] === undefined) fresh(n); mark('rank ' + rank.id, n); }
    if (COURSES.every((c) => Career.has(c.id))) mark('all courses', n);
    if (REGIONS.every((r) => Career.hasRegion(r.id))) mark('all regions', n);
    if (Rtw.open && Rtw.open()) mark('round the world open', n);
  }
  // the client group that holds up the nearest goal (a course, a region, a Mriya part), or null
  function goal(n) {
    const rep = d.rep, gaps = [];
    for (const c of COURSES) {
      if (Career.has(c.id) || c.branch === 'general' || !(c.requires || []).every((r) => Career.has(r))) continue;
      if ((c.flights || 0) > n + 4) continue;
      if (rep[c.branch] < (c.rep || 0)) gaps.push({ g: c.branch, gap: c.rep - rep[c.branch], w: 0 });
    }
    for (const r of REGIONS) {
      if (Career.hasRegion(r.id) || Career.regionRepOk(r) || r.flights > n + 4) continue;
      const gs = r.groups && r.groups.length ? r.groups : ['pax', 'cargo', 'bush'];
      if (r.rep !== undefined) { const g = gs.slice().sort((a, b) => rep[b] - rep[a])[0]; gaps.push({ g, gap: r.rep - rep[g], w: 0 }); }
      else { const g = ['pax', 'cargo', 'bush'].sort((a, b) => rep[a] - rep[b])[0]; gaps.push({ g, gap: r.total - Career.totalRep(), w: 0 }); }
    }
    for (const p of MRIYA_PARTS) {
      if (Career.mriyaState(p.id) !== 'shop') continue;
      const pr = Career.mriyaPrice(p);
      if (rep[pr.kind] < pr.rep) gaps.push({ g: pr.kind, gap: pr.rep - rep[pr.kind], w: 1 });
    }
    if (!gaps.length) return null;
    gaps.sort((a, b) => a.w - b.w || a.gap - b.gap);
    return gaps[0].g;
  }
  for (let n = 0; n < TARGET.MAX_FLIGHTS; n++) {
    shop(n);
    if (marks['all courses'] !== undefined && marks['all regions'] !== undefined && marks['Mriya: built'] !== undefined) break;
    const want = goal(n);
    // the types worth trying: for each group, its three biggest it may fly, and the one selected
    const fx = Career.effects();
    const cand = new Set([d.selected]);
    for (const g of ['pax', 'cargo', 'bush']) {
      AIRCRAFT.filter((ac) => typeOk(ac) && Career.factionsFor(ac, fx).indexOf(g) >= 0)
        .sort((a, b) => b.mtow - a.mtow).slice(0, 3).forEach((ac) => cand.add(ac.id));
    }
    let best = null;
    const home = World.byId[d.base];
    const offersWant = () => d.contracts.some((c) => c.faction === want);
    let anyWant = false;
    for (const id of cand) { d.selected = id; Career.generateContracts(); if (want && offersWant()) { anyWant = true; break; } }
    for (const id of cand) {
      const ac = AIRCRAFT.find((a) => a.id === id);
      d.selected = id;
      Career.generateContracts();
      for (const c of d.contracts) {
        const res = result(c);
        const v = net(c, ac, res), r = Career.flightRep(c, res);
        const to = World.byId[c.toId];
        const homeward = -G.geoDistanceNm(to.lat, to.lon, home.lat, home.lon) * 1000;
        const score = want ? (c.faction === want ? 1e9 + r * 1e6 + v : anyWant ? v : homeward + v * 0.01) : v;
        if (!best || score > best.score) best = { c, ac, score };
      }
    }
    if (!best) break;
    d.selected = best.ac.id;
    d.contracts = [best.c];
    const before = d.money;
    const out = Career.payout(result(best.c, rng));
    minutes += realMin(best.c);
    flights.push({ n: n + 1, type: best.ac.id, group: best.c.faction, net: d.money - before, rep: out.rep, want });
    if (LOG) console.log('    ' + lpad(n + 1, 3) + ' ' + pad(best.ac.id, 8) + pad(best.c.faction, 6) + best.c.fromId + '-' + best.c.toId + lpad(best.c.distanceNm, 6) + ' nm  ' +
      lpad(k(d.money - before), 6) + '  +' + out.rep.toFixed(1) + ' rep  (' + (want || 'money') + ')  money ' + k(d.money) +
      '  rep ' + Math.round(d.rep.pax) + '/' + Math.round(d.rep.cargo) + '/' + Math.round(d.rep.bush));
    if (out.bankrupt) { bankrupt = true; break; }
  }
  const n = flights.length;
  const share = {};
  for (const f of flights) share[f.group] = (share[f.group] || 0) + 1;
  for (const g of Object.keys(share)) share[g] /= n;
  return { marks, flights: n, minutes, dry, dryAt, share, types: new Set(flights.map((f) => f.type)).size, bankrupt, money: d.money, rep: d.rep };
}

function careerPart() {
  console.log('\n4. THE CAREER — a bot plays it ' + SEEDS + ' time(s); the flight at which each milestone comes (median)\n');
  const runs = [];
  for (let s = 1; s <= SEEDS; s++) runs.push(careerRun(s * 1013));
  const keys = [];
  for (const r of runs) for (const k2 of Object.keys(r.marks)) if (keys.indexOf(k2) < 0) keys.push(k2);
  const at = (k2) => median(runs.map((r) => (r.marks[k2] === undefined ? Infinity : r.marks[k2])));
  keys.sort((a, b) => at(a) - at(b));
  const name = (k2) => {
    const [kind, id] = k2.split(' ');
    if (kind === 'course') { const c = COURSES.find((x) => x.id === id); return 'course: ' + (c ? c.name : id); }
    if (kind === 'region') { const r = REGIONS.find((x) => x.id === id); return 'region: ' + (r ? r.name : id); }
    if (kind === 'type') { const a = AIRCRAFT.find((x) => x.id === id); return 'aircraft: ' + (a ? a.name : id); }
    if (kind === 'rank') { const r = PILOT_RANKS.find((x) => x.id === id); return 'rank: ' + (r ? r.title : id); }
    return k2;
  };
  for (const k2 of keys) {
    const v = at(k2);
    console.log('  ' + lpad(isFinite(v) ? Math.round(v) : 'never', 5) + '  ' + name(k2) + (SEEDS > 1 ? '   (' + runs.map((r) => r.marks[k2] === undefined ? '—' : r.marks[k2]).join(', ') + ')' : ''));
  }
  const full = median(runs.map((r) => r.flights));
  const hours = median(runs.map((r) => r.minutes)) / 60;
  console.log('\n  the whole career: ' + Math.round(full) + ' flights, about ' + hours.toFixed(0) + ' h of play; with round the world (+' + TARGET.RTW_LEGS + ' legs) about ' +
    Math.round(full + TARGET.RTW_LEGS) + ' flights');
  const shareTxt = ['pax', 'cargo', 'bush'].map((g) => g + ' ' + Math.round(median(runs.map((r) => r.share[g] || 0)) * 100) + ' %').join(', ');
  console.log('  flights by client group: ' + shareTxt + '; types flown: ' + median(runs.map((r) => r.types)) +
    '; left at the end: ' + k(median(runs.map((r) => r.money))) + ' kr\n');
  const inRange = (k2, range) => { const v = at(k2); return v >= range[0] && v <= range[1]; };
  check(inRange('all courses', TARGET.ALL_COURSES), 'every course passed by flight ' + at('all courses') + ' (target ' + TARGET.ALL_COURSES.join('–') + ')');
  check(inRange('all regions', TARGET.ALL_REGIONS), 'every region open by flight ' + at('all regions') + ' (target ' + TARGET.ALL_REGIONS.join('–') + ')');
  check(inRange('Mriya: built', TARGET.MRIYA_BUILT), 'the Mriya built by flight ' + at('Mriya: built') + ' (target ' + TARGET.MRIYA_BUILT.join('–') + ')');
  check(full >= TARGET.FULL[0] && full <= TARGET.FULL[1], 'all of it in ' + Math.round(full) + ' flights (target ' + TARGET.FULL.join('–') + ')');
  const dry = Math.max(...runs.map((r) => r.dry));
  const dryRun = runs.find((r) => r.dry === dry);
  check(dry <= TARGET.DRY_MAX, 'until the last course, the longest stretch without anything new: ' + dry + ' flights (from flight ' + dryRun.dryAt + ', at most ' + TARGET.DRY_MAX + ')');
  const end = Math.max(...runs.map((r) => (r.marks['Mriya: built'] === undefined ? Infinity : r.marks['Mriya: built'] - (r.marks['all courses'] || 0))));
  check(end <= TARGET.ENDGAME_MAX, 'from the last course to the Mriya built: ' + end + ' flights at most (at most ' + TARGET.ENDGAME_MAX + ')');
  const minShare = Math.min(...['pax', 'cargo', 'bush'].map((g) => median(runs.map((r) => r.share[g] || 0))));
  check(minShare >= TARGET.GROUP_SHARE_MIN, 'every client group gets at least ' + Math.round(TARGET.GROUP_SHARE_MIN * 100) + ' % of the flights (' + shareTxt + ')');
  const types = median(runs.map((r) => r.types));
  check(types >= TARGET.TYPES_FLOWN_MIN, types + ' types flown (at least ' + TARGET.TYPES_FLOWN_MIN + ')');
  check(!runs.some((r) => r.bankrupt), 'never bankrupt');
}

// ============================================================
economy();
if (!ONE_TYPE) {
  unlocks();
  airports();
  careerPart();
  console.log(fails.length ? '\n' + fails.length + ' check(s) failed' : '\nall checks passed');
  process.exit(fails.length ? 1 : 0);
}
