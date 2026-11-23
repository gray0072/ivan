'use strict';

// Arlanda Rising — the game's logic for the Node tools: the files of constants.js, data/ and sim/ (no DOM) in the order
// index.html loads them, one list for every checker (tools/missions-check.js, freeplay-bot.js, debug-mission.js,
// turnaround-check.js, terminals-check.js), and a vm context with them loaded.
// Usage: const { files, context } = require('./sim-files'); const ctx = context(); vm.runInContext('…', ctx)

const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');

const chapterFiles = (dir) => fs.readdirSync(path.join(root, dir)).filter((f) => /^ch\d+\.js$/.test(f))
  .sort((a, b) => parseInt(a.slice(2), 10) - parseInt(b.slice(2), 10)).map((f) => dir + '/' + f);

function files() {
  return ['constants.js', 'data/aircraft.js', 'data/airlines.js', 'data/buildings.js', 'data/masterplan.js', 'data/domains.js', 'data/people.js',
    'data/terminals.js', 'data/brands.js', 'data/events.js',
    'data/missions/missions.js', ...chapterFiles('data/missions'), 'data/strategies/strategies.js', ...chapterFiles('data/strategies'),
    'data/freeplay.js',
    'core/utils.js', 'core/events.js', 'core/storage.js',
    'sim/state.js', 'sim/calendar.js', 'sim/weather.js', 'sim/finance.js', 'sim/meters.js', 'sim/terminal.js', 'sim/airlines.js', 'sim/people.js', 'sim/systems.js', 'sim/airport.js', 'sim/stands.js',
    'sim/fleet.js', 'sim/schedule.js', 'sim/runways.js', 'sim/passengers.js', 'sim/turnaround.js', 'sim/flights.js', 'sim/tasks.js',
    'sim/construction.js', 'sim/summary.js', 'sim/plan.js', 'sim/ops.js', 'sim/goals.js', 'sim/missions.js', 'sim/actions.js',
    'sim/sim.js', 'sim/strategy.js', 'sim/cheats.js', 'sim/freepace.js', 'sim/free.js', 'sim/offers.js', 'sim/invest.js',
    'sim/events.js', 'sim/green.js', 'sim/stats.js', 'data/challenges.js', 'sim/challenges.js'];
}

function context() {
  const ctx = { console, Math, JSON, Object, Array, Number, String, Set, Map, Error, Date, isNaN, isFinite, parseInt, parseFloat };
  vm.createContext(ctx);
  for (const f of files()) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  return ctx;
}

module.exports = { root, files, context };
