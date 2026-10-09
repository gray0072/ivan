#!/usr/bin/env node
'use strict';

// ============================================================
// World Aviation — the autopilot's approach at every airport, flown headless.
//
//   node world-aviation/tools/approach-check.js [ID ...] [--type B738] [--verbose]
//
// For each airport (all of them, or the ones named) it builds the flight's world (terrain,
// coast, mountains, the airport flattened, the approach corridor) and flies the real Flight
// and autopilot code from 50 nm out on four sides (from the north, east, south and west), the
// descent profile's height there, autopilot on NAV, the flaps and the gear as the prompts ask.
// It reports per approach: where the glideslope was captured, how high above the glide path
// the aeroplane was 8 nm out, the least height over the ground before 3 nm, every "terrain
// ahead" hold, and where and why the autopilot let go (it should be at 200 ft AGL on the
// glide path). A run that ends anywhere else, or comes in far too high, is flagged.
//
// The logic files run in a vm context with a few stubs, the way the game loads them (no
// rendering, no sound, no DOM).
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const os = require('os');

try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) { /* not allowed: fine */ }

const ROOT = path.join(__dirname, '..');
const FILES = ['constants.js', 'data/airports.js', 'data/airport-names.js', 'data/countries.js', 'data/geodata.js', 'core/i18n.js', 'core/utils.js',
  'sim/terrain.js', 'sim/world.js', 'core/audio.js', 'sim/flight.js', 'sim/systems.js'];

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const typeArg = args.indexOf('--type') >= 0 ? args[args.indexOf('--type') + 1] : 'B738';
const ids = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--type' && args[i - 1] !== '--from');

const noop = () => {};
const ctx = vm.createContext({
  console, Math, Date, JSON, Object, Array, Number, String, Map, Set, Float32Array, Uint8Array, Int32Array, isFinite, parseFloat,
  setTimeout: noop, clearTimeout: noop,
  window: {}, navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem: noop },
  document: { createElement: () => ({ getContext: () => null }), querySelectorAll: () => [], documentElement: {} },
  performance: { now: () => 0 }, HUD: { push: noop },
  fmtAltFt: (ft) => Math.round(ft).toLocaleString('en-US')        // (game.js)
});
if (args.indexOf('--from') >= 0) ctx.ONLY_BRG = +args[args.indexOf('--from') + 1];
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });

// --map ID: the ground round the airport as text, north up, 2 km a character, 120 x 50 km:
// '~' sea, '.' up to 300 ft over the field, then digits by the thousand feet, '=' the runway,
// '>' the approach corridor's centreline (15 nm)
const map = vm.runInContext(`(function (xId) {
  if (!World.list.length) World.init();
  const X = World.byId[xId];
  let Y = null, best = Infinity;
  for (const o of World.list) { if (o === X) continue; const d = Math.abs(geoDistanceNm(o.lat, o.lon, X.lat, X.lon) - 300); if (d < best) { best = d; Y = o; } }
  World.key = ''; World.prepare(Y.id, X.id);
  const a = World.here[X.id], rows = [];
  for (let j = -12; j <= 12; j++) {
    let row = '';
    for (let i = -30; i <= 30; i++) {
      const x = a.x + i * 2000, z = a.z + j * 2000;
      const loc = World.local(a, x, z);
      if (Math.abs(loc.across) < 1000 && Math.abs(loc.t) < a.half) { row += '='; continue; }
      if (Math.abs(loc.across) < 1000 && loc.t < -a.half && loc.t > -a.half - 15 * NM) { row += '>'; continue; }
      const h = Terrain.heightAt(x, z);
      row += h <= WORLD.SEA_LEVEL + 0.5 ? '~' : h - a.elev < 300 * FT ? '.' : String(Math.min(9, Math.floor((h - a.elev) / FT / 1000)));
    }
    rows.push(row);
  }
  return X.id + ' ' + X.name + ', ' + X.elev + ' m, runway ' + a.rwyName + ' (heading ' + a.hdgDeg + '°), ' + (X.mountainous ? 'mountainous' : '') + String.fromCharCode(10) + rows.join(String.fromCharCode(10));
})`, ctx);
if (args.includes('--map')) { for (const id of ids) console.log(map(id) + '\n'); process.exit(0); }

const run = vm.runInContext(`(function (xId, typeId, verbose) {
  if (!World.list.length) World.init();
  const X = World.byId[xId];
  if (!X) return { id: xId, error: 'no such airport' };
  // a departure some 300 nm away, so the world is built as for a real flight to X
  let Y = null, best = Infinity;
  for (const o of World.list) {
    if (o === X) continue;
    const d = Math.abs(geoDistanceNm(o.lat, o.lon, X.lat, X.lon) - 300);
    if (d < best) { best = d; Y = o; }
  }
  World.key = '';
  World.prepare(Y.id, X.id);
  const a = World.here[X.id], from = World.here[Y.id];
  const ac = AIRCRAFT.find((t) => t.id === typeId);
  const out = { id: X.id, name: X.name, elev: X.elev, runs: [] };
  // the ground as the map data makes it, before the airport and its corridors are cut into it:
  // a field in a pit (the hills all round far above it) or an approach carved through
  // mountains means the coast or a range in data/geodata.js is in the wrong place
  const grid = TERRAIN.aptGrid;
  const natural = (x, z) => { TERRAIN.aptGrid = null; const h = Terrain.heightAt(x, z); TERRAIN.aptGrid = grid; return h; };
  const ring = [];
  for (const rad of [3000, 6000, 12000]) for (let k = 0; k < 16; k++) {
    const q = k / 16 * Math.PI * 2;
    ring.push(natural(a.x + Math.sin(q) * rad, a.z - Math.cos(q) * rad) - a.elev);
  }
  ring.sort((p, q) => p - q);
  out.pitFt = Math.round(ring[ring.length >> 1] / FT);
  let cut = 0;
  for (let nm = 1; nm <= 15; nm += 0.5) for (const sgn of [-1, 1]) {
    const p = World.at(a, sgn * (a.half + nm * NM), 0);
    cut = Math.max(cut, natural(p.x, p.z) - Terrain.heightAt(p.x, p.z));
  }
  out.cutFt = Math.round(cut / FT);
  out.terrainOk = out.pitFt < 1500 && out.cutFt < 2000;
  for (const brg of (globalThis.ONLY_BRG !== undefined ? [globalThis.ONLY_BRG] : [0, 90, 180, 270])) {
    const fl = Flight.init({ aircraft: ac, from, to: a, contract: { payloadKg: ac.payloadKg * 0.6 }, blockFuel: ac.fuelCapKg * 0.4 });
    Systems.init(fl, { rng: makeRng(7), difficulty: DIFFICULTY.medium, noEmergencies: true });
    const st = fl.st, env = fl.env;
    env.surfaceWind = { dir: a.hdgDeg, speed: 6 }; env.altWind = { dir: a.hdgDeg, speed: 20 };
    env.turb = 0; env.temp = 15; env.tempElev = a.elev; env.vis = 20000; env.cloudBase = 9000; env.cloudTop = 9500;
    env.precip = 'none'; env.icing = false;
    // 50 nm out on the descent profile, heading for the airport at 250 kt
    const startNm = 50, d0 = startNm * NM, b = brg * DEG;
    st.pos.x = a.x + Math.sin(b) * d0; st.pos.z = a.z - Math.cos(b) * d0;
    const profileFt = a.elev / FT + 2500 + Math.max(0, startNm - SIM.DESCENT_END_NM) / SIM.DESCENT_NM_PER_KFT * 1000;
    st.pos.y = Math.max(profileFt * FT, Terrain.surfaceAt(st.pos.x, st.pos.z) + 900);
    st.hdg = wrapRad(b + Math.PI);
    const spd = 250 * KTS / Math.sqrt(fl.density(st.pos.y) / SIM.RHO_SL);     // 250 kt indicated
    st.vel.x = hdgX(st.hdg) * spd; st.vel.z = hdgZ(st.hdg) * spd; st.vel.y = 0;
    st.onGround = false; st.wasAirborne = true; st.parkingBrake = false; st.gear = st.gearTarget = 0; st.flaps = st.flapsTarget = 0;
    st.throttle = 0.5;
    for (const e of Systems.engines) { e.running = true; e.startPhase = 'idle'; e.n1 = 0.6; e.n2 = 0.8; }
    fl.ap.on = true; fl.ap.nav = true; fl.ap.alt = Math.round((a.elev + 2500 * FT) / FT / 100) * 100; fl.ap.altSet = false; fl.ap.vsI = 0;
    fl.setPhase('DESCENT');
    const r = { from: brg, gsNm: null, above8: null, minAglFt: Infinity, minAglNm: null, overCapFt: -Infinity, holds: 0, end: '', endAglFt: null, endNm: null };
    let lastAp = '';
    for (let t = 0; t < 2400; t += 0.1) {
      Systems.update(fl.update(0.1));          // (as Game.frame: the engines spool with the levers)
      if (verbose && Math.round(t * 10) % 600 === 0) console.log('   t=' + Math.round(t) + ' nm=' + fl.distToRunwayNm().toFixed(1) + ' alt=' + Math.round(st.pos.y / FT) + ' ias=' + Math.round(st.ias / KTS) + ' hdg=' + Math.round(fl.headingDeg()) + ' aphdg=' + fl.ap.hdg + ' apalt=' + fl.ap.alt + ' thr=' + st.throttle.toFixed(2) + ' n1=' + Systems.engines.map(e => e.n1.toFixed(2)).join('/') + ' ph=' + fl.phase);
      if (fl.phase === 'DESCENT') {
        fl.navTarget();
        if (fl.locCaptured && fl.distToRunwayNm() < SIM.APPROACH_NM) fl.setPhase('APPROACH');
      }
      const nm = fl.distToRunwayNm(), ias = st.ias / KTS;
      // the bot: flaps a notch at a time as the speed allows inside 15 nm, the gear at 8 nm
      if (fl.phase === 'APPROACH') {
        const next = fl.ac.flaps[st.flapsTarget];
        if (nm < SIM.FLAPS_PROMPT_NM && next && ias < next.vfe - 5) fl.setFlaps(st.flapsTarget + 1);
        if (nm < SIM.GEAR_PROMPT_NM && st.gearTarget < 1) fl.setGear(true);
      }
      if (fl.ap.gs && r.gsNm === null) r.gsNm = +nm.toFixed(1);
      if (r.above8 === null && nm < 8 && fl.phase === 'APPROACH') {
        r.above8 = Math.round((st.pos.y - st.gearH - (a.elev + 15 + nm * NM * Math.tan(SIM.GLIDESLOPE_DEG * DEG))) / FT);
      }
      const agl = fl.altAgl() / FT;
      // the clearance over the ground: on the glide path the ground under the approach corridor's
      // 2.4° slope (it keeps the 3° path clear), before it at least most of the 1 000 ft the
      // autopilot keeps over the terrain
      if (nm > 2) {
        if (fl.ap.gs) {
          // on the glide path: the ground may rise to the corridor's slope, not over it
          const cap = a.elev + Math.max(0, nm * NM - 1500) * Math.tan(LAYOUT.APPROACH_SLOPE_DEG * DEG);
          r.overCapFt = Math.max(r.overCapFt, Math.round((Terrain.surfaceAt(st.pos.x, st.pos.z) - cap) / FT));
        } else if (agl < r.minAglFt) { r.minAglFt = Math.round(agl); r.minAglNm = +nm.toFixed(1); }
      }
      for (const e of fl.events) {
        if (/Terrain ahead/.test(e.text)) r.holds++;
        if (e.id === 'AP') lastAp = e.text;
        if (verbose && e.id !== 'clear') console.log('   ' + xId + ' ' + brg + '° ' + nm.toFixed(1) + ' nm ' + Math.round(agl) + ' ft: ' + e.text);
      }
      fl.events.length = 0;
      if (fl.failure) { r.end = 'failed: ' + fl.failure.text; break; }
      if (st.onGround) { r.end = 'on the ground'; break; }
      if (!fl.ap.on) { r.end = lastAp || 'autopilot off'; break; }
      if (nm > startNm + 30) { r.end = 'flew away'; break; }
    }
    if (!r.end) r.end = 'still flying after 40 min';
    r.endAglFt = Math.round(fl.altAgl() / FT);
    r.endAboveFieldFt = Math.round((st.pos.y - st.gearH - a.elev) / FT);
    r.endNm = +fl.distToRunwayNm().toFixed(1);
    // fine: let go at decision height on the glide path, close in
    r.ok = /decision height/.test(r.end) && r.endNm < 2 && r.endAboveFieldFt < 400 && (r.above8 === null || r.above8 < 1500) &&
      r.overCapFt < 150 && r.minAglFt > 700;
    out.runs.push(r);
  }
  return out;
})`, ctx);

const list = ids.length ? ids : vm.runInContext('AIRPORTS.map((a) => a.id)', ctx);
const bad = [];
const t0 = Date.now();
for (const id of list) {
  const res = run(id, typeArg, verbose);
  if (res.error) { console.log(id + ': ' + res.error); continue; }
  const flags = res.runs.filter((r) => !r.ok);
  const line = res.id.padEnd(4) + ' ' + res.name.slice(0, 26).padEnd(26) + ' ' +
    res.runs.map((r) => String(r.from).padStart(3) + '°:' + (r.ok ? 'ok' : 'NO')).join(' ') +
    '  ground round it ' + String(res.pitFt).padStart(5) + ' ft, corridors cut ' + String(res.cutFt).padStart(5) + ' ft' + (res.terrainOk ? '' : '  <- TERRAIN');
  console.log(line);
  if (!res.terrainOk && !flags.length) bad.push(res.id);
  if (flags.length || verbose) {
    for (const r of res.runs) {
      if (r.ok && !verbose) continue;
      console.log('     from ' + String(r.from).padStart(3) + '°  G/S at ' + r.gsNm + ' nm, ' + r.above8 + ' ft above it at 8 nm, lowest ' + r.minAglFt +
        ' ft AGL at ' + r.minAglNm + ' nm before it, ground over the corridor ' + r.overCapFt + ' ft, terrain holds ' + r.holds + ' | end ' + r.endNm + ' nm, ' + r.endAboveFieldFt + ' ft over the field (' + r.endAglFt + ' AGL): ' + r.end);
    }
    if (flags.length) bad.push(res.id);
  }
}
console.log('\n' + list.length + ' airports, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s' + (bad.length ? ' — problems at: ' + bad.join(' ') : ' — all approaches fine'));
process.exitCode = bad.length ? 1 : 0;
