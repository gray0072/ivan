'use strict';

// Arlanda Rising — the game's shared state, declared once. `S` is the whole world as plain JSON: the calendar,
// the money, the airport (runways, stands, what is built, the projects), the airlines, the domains' levels,
// the five meters, the running mission with its stage (`S.ops` in ops time, `S.plan` in plan time) and its
// counters. Saving the game is JSON.stringify(S); a resumed mission parses it back and goes on exactly the
// same, since the random generator's state (`S.rng`) is in it too. Every other sim/ file reads and changes
// S here; render/ and ui/ only read it.

let S = null;

// the next random number in 0..1, from the state's own generator
function rand() {
  const r = rngNext(S.rng);
  S.rng = r[1];
  return r[0];
}
function randRange(a, b) { return a + (b - a) * rand(); }
function randInt(a, b) { return a + Math.floor(rand() * (b - a + 1)); }
function randPick(list) { return list[Math.floor(rand() * list.length)]; }

// a fresh world: the forest north of Stockholm before the first tree is cut. `cheated` marks the mission
// being played (set by sim/cheats.js, cleared at every mission's start)
function newWorld(seed, difficulty) {
  return {
    v: 1, seed: seed >>> 0, rng: seed >>> 0, difficulty, cheated: false,
    day: Calendar.dayOf(1958, 5, 1), clock: 12 * 60,
    money: 0, loans: 0, debtMonths: 0, owner: 'LFV',
    airport: {
      open: false, runways: [], stands: [], items: [], projects: {},
      apron: { snow: 0, plough: null }, desks: 0, fees: 'normal', prefDir: '19', safetyBase: METER_START.safety
    },
    airlines: {},
    domains: { stands: 0, turnaround: 0, checkin: 0, snow: 0 },
    meters: Object.assign({}, METER_START),
    flags: {},
    finance: { month: null, cur: { in: {}, out: {} }, history: [] },
    mission: null, ops: null, plan: null,
    log: [], nextId: 1
  };
}

function nextId() { return S.nextId++; }

// the difficulty's table (constants.js DIFFICULTY)
function diff() { return DIFFICULTY[S.difficulty] || DIFFICULTY.medium; }

// what happened, for the debrief and Show me: { day, t, type, ... }; the last LOG_MAX entries are kept
const LOG_MAX = 400;
function logEvent(type, data) {
  const e = Object.assign({ day: S.day, t: Math.round(S.clock * 100) / 100, type }, data || {});
  S.log.push(e);
  if (S.log.length > LOG_MAX) S.log.splice(0, S.log.length - LOG_MAX);
  GameEvents.emit(type, e);
}
