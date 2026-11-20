'use strict';

// Arlanda Rising — the master plan: the historical projects that make the real Arlanda, as plain data. History
// decides what each one is, where it stands and what it looks like; the player decides the order of its
// stages, the pace, the money and the optional extras (see SPEC.md "The master plan"). Each project has:
//   name, year   as shown; the year it was built in reality (or the best known one)
//   plot         where it stands: x east, y north, w × h, in metres from the south end of runway 1 —
//                to be taken from the aerodrome chart (Swedish AIP, ESSA AD 2) in session 2 (`check`)
//   stages       { id: { name, days, price, after: [stage ids first], optional } } — a project is finished when
//                every stage that is not optional is; an optional stage may be built later and has its own effect
//   mods         switches bought with the project: { id: { name, price, ... } } — noWinter (works on at full
//                speed in December–February), safety (+ the airport's base Safety)
//   effect       what finishing it does to the airport (sim/airport.js `complete`)
//   stands       the stands an apron brings: name, max size code, next to the terminal or not, taxi distance (min)
//   src / check  the sources, and what still has to be checked before the facts are shown

const PROJECTS = {
  site: {
    name: 'The airport site', year: 1958, plot: { x: -400, y: -200, w: 1600, h: 3800 },
    stages: {
      strip: { name: 'Clear the runway strip', days: 150, price: 30e6 },
      drain: { name: 'Drain the bog', days: 90, price: 12e6 },
      apron: { name: 'Clear the apron and the terminal plot', days: 100, price: 18e6, after: ['drain'] },
      road: { name: 'Build the road in', days: 120, price: 22e6, after: ['drain'] }
    },
    effect: 'site',
    src: 'sv.wikipedia Arlanda: the Riksdag decided on the airport at Halmsjön in December 1957 (153 million SEK, two runways)',
    check: 'which clearing works were done in which year'
  },
  runway1: {
    name: 'Runway 1 (01/19)', year: 1959, plot: { x: 0, y: 0, w: 45, h: 3300 },
    stages: { pave: { name: 'Pave the runway', days: 240, price: 420e6 } },
    effect: 'runway1', len: 3300,
    src: 'sv.wikipedia Arlanda: the 1957 plan had runway 1 at 3.3 km; the first landing was on runway 1 on 14 December 1959',
    check: 'the length as built in 1959'
  },
  apron1: {
    name: 'The first apron', year: 1959, plot: { x: 350, y: 1200, w: 300, h: 250 },
    stages: { pave: { name: 'Pave the apron', days: 90, price: 60e6 } },
    effect: 'apron1',
    stands: [
      { name: '1', code: 'D', contact: true, dist: 1 },
      { name: '2', code: 'D', contact: true, dist: 1 },
      { name: '3', code: 'C', contact: true, dist: 2 },
      { name: '4', code: 'C', contact: false, dist: 3 }
    ],
    check: 'the first apron\'s place and stands'
  },
  tower1: {
    name: 'The control tower', year: 1960, plot: { x: 700, y: 1250, w: 30, h: 30 },
    stages: {
      found: { name: 'Foundations', days: 25, price: 8e6 },
      shaft: { name: 'The shaft', days: 35, price: 14e6, after: ['found'] },
      cab: { name: 'The glass cab', days: 20, price: 10e6, after: ['shaft'] },
      radio: { name: 'Radio and the desks', days: 15, price: 6e6, after: ['cab'] }
    },
    mods: {
      tents: { name: 'Heated winter tents', price: 3e6, noWinter: true },
      backupRadio: { name: 'A backup radio', price: 2e6, safety: 5 }
    },
    effect: 'tower1',
    check: 'the year, place and look of the first control tower'
  },
  terminal1: {
    name: 'The first terminal', year: 1960, plot: { x: 650, y: 1300, w: 120, h: 50 },
    stages: {
      hall: { name: 'The hall', days: 30, price: 18e6 },
      desks: { name: 'Four check-in desks', days: 12, price: 3e6, after: ['hall'] },
      waiting: { name: 'The waiting room', days: 20, price: 8e6, after: ['hall'] },
      kiosk: { name: 'A kiosk', days: 10, price: 0.6e6, after: ['hall'], optional: true, effect: 'kiosk' }
    },
    mods: {
      tents: { name: 'Heated winter tents', price: 3e6, noWinter: true }
    },
    effect: 'terminal1', desks: 4,
    src: 'sv.wikipedia Arlanda: "at first very primitive buildings were used"',
    check: 'what the first buildings were and where they stood'
  },
  lights1: {
    name: 'Runway lights', year: 1961, plot: { x: 0, y: 0, w: 45, h: 3300 },
    stages: {
      cables: { name: 'Lay the cables', days: 14, price: 4e6 },
      lamps: { name: 'Edge lights', days: 10, price: 5e6, after: ['cables'] },
      approach: { name: 'Approach lights', days: 12, price: 6e6, after: ['cables'], optional: true, effect: 'approachLights' }
    },
    effect: 'lights1',
    check: 'when runway 1 got its lights and approach lights'
  }
};
