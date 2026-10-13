#!/usr/bin/env node
'use strict';

// ============================================================
// World Aviation — the flight school's lessons flown headless by beginners.
//
//   node world-aviation/tools/school-check.js [LESSON ...] [--pilot novice,idle,rough] [--try 1,2,3] [--verbose]
//
// Loads the game's logic and game.js into a vm with stubs for everything that draws, sounds
// or shows a screen, and flies each lesson (data/lessons.js) through Game.frame at 30 frames a
// second with a bot at the controls instead of Input.axes, the way a beginner would: it does
// what the coach's lit step asks, with the keyboard's all-or-nothing keys, late and coarse.
//   novice  does the steps, flares with a tap of the key at 30 ft;
//   idle    does the steps but never flares (it only idles at the touchdown);
//   rough   does the steps, but pulls the nose hard at the rotation and in the flare.
// --try n flies the lesson as its n-th try (more of the instructor's help: sim/lesson.js).
// Each run prints how it ended: passed or failed (why), the touchdown, the game time and
// the steps the coach went through. Exits with 1 if a novice's first try failed anywhere.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const os = require('os');

try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) { /* not allowed: fine */ }

const ROOT = path.join(__dirname, '..');
const FILES = ['constants.js', 'data/airports.js', 'data/airport-names.js', 'data/countries.js', 'data/airlines.js', 'data/mriya.js', 'data/rtw.js',
  'data/emergencies.js', 'data/lessons.js', 'data/lang-ru.js', 'data/lang-sv.js', 'data/pilots.js', 'core/i18n.js', 'core/utils.js', 'data/geodata.js',
  'data/cities.js', 'sim/terrain.js', 'sim/world.js', 'core/audio.js', 'sim/flight.js', 'sim/airframe.js', 'sim/collide.js', 'sim/systems.js',
  'sim/guidance.js', 'sim/taxilimit.js', 'sim/copilot.js', 'sim/lesson.js', 'career.js', 'sim/rtw.js', 'core/input.js', 'ui/incident.js', 'game.js'];

const args = process.argv.slice(2);
const opt = (k, d) => (args.indexOf(k) >= 0 ? args[args.indexOf(k) + 1] : d);
const verbose = args.includes('--verbose');
const pilots = opt('--pilot', 'novice,idle').split(',');
const tries = opt('--try', '1').split(',').map(Number);
const only = args.filter((a, i) => !a.startsWith('--') && !['--pilot', '--try', '--trace'].includes(args[i - 1]));

// anything that draws, sounds or shows a screen: a function that does nothing, whatever is asked of it
const stub = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : stubs[k] !== undefined ? stubs[k] : stub()), apply: () => undefined });
const stubs = { mapOpen: false, hidden: false, camera: null, shed: { size: 0 }, isCoarse: false,
  // (the flight's messages, as HUD.push gets them)
  push: (m) => { if (verbose && m.id !== 'clear') console.log('     · ' + (m.id === 'info' ? '' : m.id + ': ') + m.text); } };
const noop = () => {};
const dom = () => ({ hidden: true, style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, querySelector: () => null,
  querySelectorAll: () => [], addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }),
  setAttribute: noop, getAttribute: () => null, getContext: () => null, innerHTML: '', textContent: '' });
const results = [];
const ctx = vm.createContext({
  console, Math, Date, JSON, Object, Array, Number, String, Map, Set, Float32Array, Uint8Array, Int32Array, isFinite, parseFloat, parseInt, Proxy, Symbol,
  setTimeout: noop, clearTimeout: noop, requestAnimationFrame: noop,
  window: { addEventListener: noop, matchMedia: () => ({ matches: false }), innerWidth: 1280, innerHeight: 800 },
  navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  document: { createElement: () => dom(), getElementById: () => dom(), querySelectorAll: () => [], querySelector: () => null,
    documentElement: { style: { setProperty: noop } }, addEventListener: noop, body: { classList: { add: noop, remove: noop, toggle: noop } } },
  performance: { now: () => 0 },
  HUD: stub(), Scene3D: stub(), Cockpit: stub(), Instruments: stub(), Cabin: stub(), UI: stub(), Cloud: stub(), AppUpdate: stub(),
  RtwScreen: stub(), Showcase: stub(), LandingJoke: stub(),
  School: { showResult: (r) => results.push(r) }
});
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
// --trace FT: every third of a second below that height, the aeroplane and the stick
ctx.TRACE = +opt('--trace', 0);

const fly = vm.runInContext(`(function (id, pilot, attempt, verbose) {
  if (!World.list.length) World.init();
  I18N.set && I18N.set('en');
  if (!Career.data) Career.new({ pilot: 'Test' });
  Game.draw2d = () => {};
  const def = Lesson.byId(id);
  Lesson.tries[id] = attempt - 1;
  Game.mode = 'ops';
  Game.startFlight(Lesson.contract(def), { lesson: def, skipPushback: def.start === 'hold' });
  const fl = Game.flight, st = fl.st;
  const bot = { t: 0, tap: 0, next: 0, flared: false, flareT: 0 };
  let ax = { pitch: 0, roll: 0, rudder: 0, throttle: 0, brake: 0 };
  Input.axes = () => ax;
  const press = (name, arg) => { if (bot.t >= bot.next) { Game.action(name, arg); bot.next = bot.t + 0.7; } };
  const seen = [];
  const log = (s) => { if (verbose) console.log('   ' + bot.t.toFixed(1) + 's ' + s); };
  // drive along the arrow at a speed under the limit
  const drive = (want) => {
    const g = fl.guidance, taxi = fl.taxi;
    const lim = taxi ? Math.min(taxi.now, taxi.shown) : 15;
    const v = fl.groundSpeedKt(), target = Math.min(want || 18, lim * 0.75);
    ax.roll = g && g.visible ? clamp(wrapDeg(g.bearing - fl.headingDeg()) / 20, -1, 1) : 0;
    if (v > target + 2) { fl.setThrottle(0); ax.brake = 1; } else { ax.brake = 0; fl.setThrottle(v < target - 2 ? Math.min(1, st.throttle + 0.01) : Math.max(0, st.throttle - 0.004)); }
  };
  for (let f = 0; f < 30 * 60 * 25 && (Game.mode === 'flying' || Game.mode === 'incident'); f++) {
    const dt = 1 / 30;
    bot.t += dt;
    if (Game.mode === 'incident') { Incident.frame(Game, dt); continue; }
    const s = Lesson.step();
    const k = s ? s.done || 'look:' + s.id : 'none';
    if (seen[seen.length - 1] !== k) { seen.push(k); log('step ' + k + ' · ' + fl.phase); }
    ax = { pitch: 0, roll: 0, rudder: 0, throttle: 0, brake: 0 };
    const agl = fl.altAgl() / FT, ias = st.ias / KTS, sys = Game.systems;
    // the checklist first, whatever the step
    if (sys.checklist) {
      const cs = sys.checklist.steps[sys.checklist.stepIndex];
      if (cs && cs.kind === 'antiIce' && !sys.antiIce) press('antiIce');
      else if (cs) press('starter');
    }
    if (st.onGround && !st.wasAirborne) {
      // on the ground before the take-off
      if (fl.phase === 'GATE') press('starter');
      else if (fl.phase === 'PUSHBACK') { if (!sys.started) press('starter'); }
      else if (fl.phase === 'ENGINE_START') { if (sys.runningCount() < fl.ac.engines) press('starter'); else if (st.parkingBrake) press('parkBrake'); }
      else if (fl.phase === 'TAXI_OUT') drive(18);
      else if (fl.phase === 'HOLD_SHORT') {
        if (fl.groundSpeedKt() > 0.5) { fl.setThrottle(0); ax.brake = 1; }
        else if (k === 'parkOn') press('parkBrake');
        else if (st.flapsTarget < Game.takeoffFlaps()) press('flapsDown');
        else if (def.id !== 'taxi') press('starter');
      } else if (fl.phase === 'TAKEOFF') {
        if (st.flapsTarget < Game.takeoffFlaps()) press('flapsDown');
        else if (!Lesson.lined(fl) && fl.groundSpeedKt() < 40 && !bot.rolling) {
          // (rough: full power at once, the instructor holds it back until lined up)
          drive(10);
          if (pilot === 'rough') Game.action('throttlePreset', 1);
        } else {
          bot.rolling = true;
          if (st.throttle < 0.9) Game.action('throttlePreset', 1);
          // rotation: the key held (rough: held long), let go at the attitude
          if (ias > fl.vr()) ax.pitch = pilot === 'rough' || st.pitch * RAD < 9 ? 1 : 0;
        }
      }
    } else if (!st.onGround) {
      // in the air
      if (fl.phase === 'TAKEOFF' || fl.phase === 'CLIMB' || fl.phase === 'CRUISE' || fl.phase === 'DESCENT') {
        if (!fl.ap.on) {
          const p = st.pitch * RAD;
          ax.pitch = pilot === 'rough' && agl < 300 ? 1 : p < 7 ? 1 : p > 12 ? -1 : 0;
        }
        if (st.gearTarget >= 1 && fl.st.vel.y > 1) press('gear');
        else if (!fl.ap.on && agl > 400 && def.id !== 'takeoff') press('ap');
        else if (st.flapsTarget > 0 && st.gearTarget < 1 && ias > fl.vr() + 25) press('flapsUp');
        else if (k === 'look:map' && bot.map === undefined) { bot.map = 1; press('map'); }
        else if (fl.ap.on && (k === 'timeFast' || k === 'timeFaster' || k === 'approach') && fl.env.timeAccel < 64) press('timeFaster');
      }
      if (fl.phase === 'APPROACH') {
        const nm = fl.distToRunwayNm(), next = fl.ac.flaps[st.flapsTarget];
        if (st.flapsTarget < fl.ac.flaps.length && next && ias < next.vfe + 5 && nm < SIM.FLAPS_PROMPT_NM) press('flapsDown');
        else if (st.gearTarget < 1 && nm < SIM.GEAR_PROMPT_NM) press('gear');
        if (!fl.ap.on) {
          // by hand from the decision height: nothing until the flare
          if (pilot !== 'idle' && agl < 30 && !bot.flared) { bot.flared = true; bot.flareT = bot.t; Game.action('throttlePreset', 0); }
          if (bot.flared && bot.t - bot.flareT < (pilot === 'rough' ? 2.5 : 0.8)) ax.pitch = 1;
        }
      }
    } else {
      // landed
      if (fl.phase === 'ROLLOUT' && st.throttle > 0) Game.action('throttlePreset', 0);
      if (!st.spoiler && fl.phase === 'ROLLOUT') press('spoiler');
      if (fl.phase === 'ROLLOUT') ax.brake = 1;
      if (fl.phase === 'EXIT') {
        if (def.copilot && !(fl.copilot && fl.copilot.on) && !bot.foTold) { bot.foTold = true; Game.action('starter'); }
        if (!(fl.copilot && fl.copilot.on)) {
          const gate = Game.arrivalGate, d = Math.hypot(st.pos.x - gate.standX, st.pos.z - gate.standZ);
          if (d < SIM.PARK_RADIUS_M * 0.6) { fl.setThrottle(0); ax.brake = 1; if (fl.groundSpeedKt() < 1 && !st.parkingBrake) press('parkBrake'); }
          else drive(d < 60 ? 4 : 14);
        }
      }
    }
    // the views (the graduation): C until the step is done; to the stand from above, X
    if (s && /^view/.test(s.done) && !Lesson.met(s, { game: Game, fl, sys, L: Lesson.cur })) press('camera', 1);
    else if (k === 'underArch' && Game.camMode === 'cockpit') press('camera', 1);
    else if (k === 'topAtStand' && Game.camMode !== 'top') press('camera', -1);
    Game.frame(dt);
    if (globalThis.TRACE && f % 10 === 0 && (fl.phase === 'TAKEOFF' || !st.onGround || st.wasAirborne) && agl < globalThis.TRACE) {
      log(fl.phase + ' agl ' + agl.toFixed(0) + ' ft, ias ' + ias.toFixed(0) + ' kt, vs ' + Math.round(st.vel.y / FPM) + ' fpm, pitch ' +
        (st.pitch * RAD).toFixed(1) + '°, bank ' + (st.roll * RAD).toFixed(1) + '°, stick ' + ax.pitch.toFixed(2) + ' / ' + ax.roll.toFixed(2) +
        ', thr ' + st.throttle.toFixed(2) + ', across ' + World.local(fl.nearestApt(), st.pos.x, st.pos.z).across.toFixed(1) + ' m, hdg off ' +
        wrapDeg(fl.headingDeg() - fl.nearestApt().hdgDeg).toFixed(1) + '°, gs ' + fl.groundSpeedKt().toFixed(0) + ' kt' + (fl.ap.on ? ' AP' : ''));
    }
  }
  const r = Game.result && Game.result.lesson === def ? Game.result : null;
  return { id, pilot, attempt, ok: !!(r && r.ok), reason: r ? r.reason : 'still flying in ' + fl.phase,
    fpm: fl.landed ? fl.landed.fpm : null, grade: r ? r.grade : '', gameMin: Math.round(fl.elapsed / 6) / 10, realMin: Math.round(bot.t / 6) / 10,
    steps: seen.length, damage: Math.round(st.damage * 100) };
})`, ctx);

let bad = 0;
const list = only.length ? only : vm.runInContext('LESSONS.map((l) => l.id)', ctx);
for (const id of list) {
  for (const pilot of pilots) {
    for (const t of tries) {
      const t0 = Date.now();
      const r = fly(id, pilot, t, verbose);
      if (!r.ok && pilot === 'novice' && t === 1) bad++;
      console.log((r.ok ? 'passed ' : 'FAILED ') + id.padEnd(10) + ' ' + pilot.padEnd(7) + ' try ' + t +
        (r.fpm !== null ? '  touchdown ' + String(r.fpm).padStart(4) + ' fpm ' + (r.grade || '').padEnd(2) : '                    ') +
        '  damage ' + String(r.damage).padStart(3) + ' %  game ' + String(r.gameMin).padStart(5) + ' min, real ' + String(r.realMin).padStart(5) + ' min (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)' +
        (r.ok ? '' : '  — ' + r.reason));
    }
  }
}
process.exitCode = bad ? 1 : 0;
