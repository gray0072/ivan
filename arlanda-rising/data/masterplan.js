'use strict';

// Arlanda Rising — the master plan: the historical projects that make the real Arlanda, as plain data. History
// decides what each one is, where it stands and what it looks like; the player decides the order of its
// stages, the pace, the money and the optional extras (see SPEC.md "The master plan"). Each project has:
//   name, year   as shown; the year it was built in reality (or the best known one)
//   plot         where it stands: x east, y north, w × h, in metres from the south end of runway 1 (the drawing's
//                own shapes and the real runway ends are in data/layout.js)
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
    name: 'Runway 1 (01/19)', year: 1959, plot: { x: 0, y: 0, w: 596, h: 3236 },
    stages: { pave: { name: 'Pave the runway', days: 240, price: 420e6 } },
    effect: 'runway1', len: 3300,
    src: 'sv.wikipedia Arlanda: the 1957 plan had runway 1 at 3.3 km; the first landing was on runway 1 on 14 December 1959',
    check: 'the length as built in 1959'
  },
  apron1: {
    name: 'The first apron', year: 1959, plot: { x: 640, y: 1120, w: 240, h: 260 },
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
    name: 'The control tower', year: 1960, plot: { x: 903, y: 1356, w: 18, h: 18 },
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
    name: 'The first terminal', year: 1960, plot: { x: 880, y: 1180, w: 45, h: 120 },
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
    name: 'Runway lights', year: 1961, plot: { x: 0, y: 0, w: 596, h: 3236 },
    stages: {
      cables: { name: 'Lay the cables', days: 14, price: 4e6 },
      lamps: { name: 'Edge lights', days: 10, price: 5e6, after: ['cables'] },
      approach: { name: 'Approach lights', days: 12, price: 6e6, after: ['cables'], optional: true, effect: 'approachLights' }
    },
    effect: 'lights1',
    check: 'when runway 1 got its lights and approach lights'
  },

  // ---------- chapter 2: the jet age ----------
  apron2: {
    name: 'The jet apron', year: 1965, plot: { x: 640, y: 1380, w: 250, h: 260 },
    stages: {
      pave: { name: 'Pave the new apron', days: 60, price: 70e6 },
      bigStand: { name: 'A stand for the biggest jets', days: 25, price: 20e6, after: ['pave'], optional: true, effect: 'bigStand' }
    },
    effect: 'apron2',
    // `at`: the stand's place on the map (data/layout.js draws the apron); the big stand comes with its own stage
    bigStand: { name: '5', code: 'E', contact: true, dist: 2, at: [878, 1425] },
    stands: [
      { name: '6', code: 'D', contact: true, dist: 2, at: [878, 1490] },
      { name: '7', code: 'D', contact: true, dist: 3, at: [878, 1555] },
      { name: '8', code: 'C', contact: false, dist: 3, at: [770, 1610] }
    ],
    check: 'the game\'s drawing of the 1960s apron growth north of the first apron'
  },
  ils1: {
    name: 'Instrument landing system', year: 1974, plot: { x: 0, y: 0, w: 596, h: 3236 },
    stages: {
      antennas: { name: 'Localizer and glide path antennas', days: 20, price: 12e6 },
      calibrate: { name: 'Flight calibration', days: 10, price: 4e6, after: ['antennas'] }
    },
    effect: 'ils',
    check: 'the year runway 1 got its instrument landing system'
  },
  runway2: {
    name: 'Runway 2 (08/26)', year: 1975, plot: { x: 1290, y: 2349, w: 2420, h: 610 },
    stages: {
      strip: { name: 'Clear the strip', days: 40, price: 40e6 },
      pave: { name: 'Pave the runway', days: 80, price: 260e6, after: ['strip'] },
      lights: { name: 'Edge lights', days: 15, price: 12e6, after: ['pave'] }
    },
    effect: 'runway2', len: 2500,
    src: 'sv.wikipedia Arlanda: the Riksdag\'s decision of 1957 had two runways, runway 1 of 3.3 km and runway 2 of 2.5 km; the ends of 08/26 from the AIP (59.658419 N 17.936133 E, 59.663897 N 17.979153 E)',
    check: 'the year runway 2 was built'
  },
  bagHall: {
    name: 'The baggage hall', year: 1973, plot: { x: 925, y: 1180, w: 30, h: 85 },
    stages: { hall: { name: 'The hall under the terminal', days: 25, price: 15e6 } },
    effect: 'bagHall',
    check: 'when the first baggage conveyors came to Arlanda'
  },
  intlTerminal: {
    name: 'The international terminal', year: 1976, plot: { x: 890, y: 1390, w: 70, h: 250 },
    stages: {
      frame: { name: 'The frame', days: 50, price: 120e6 },
      hall: { name: 'The departure hall', days: 35, price: 80e6, after: ['frame'] },
      pier: { name: 'The pier and its gates', days: 35, price: 60e6, after: ['frame'] },
      shops: { name: 'Shops and a restaurant', days: 20, price: 12e6, after: ['hall'], optional: true, effect: 'restaurant' }
    },
    mods: { tents: { name: 'Heated winter tents', price: 6e6, noWinter: true } },
    effect: 'intlTerminal', desks: 12,
    src: 'sv.wikipedia Arlanda: the international terminal, Arlanda International (today Terminal 5), opened in 1976 and took all the international traffic, scheduled and charter; swedavia.com gives the same year',
    check: 'its opening day; its look'
  },

  // ---------- chapter 3: everyone comes to Arlanda ----------
  domTerminal: {
    name: 'The domestic terminal', year: 1983, plot: { x: 890, y: 950, w: 80, h: 165 },
    stages: {
      hall: { name: 'The terminal hall', days: 45, price: 90e6 },
      apron: { name: 'Its apron', days: 30, price: 45e6 },
      desks: { name: 'Check-in desks', days: 12, price: 8e6, after: ['hall'] }
    },
    mods: { tents: { name: 'Heated winter tents', price: 5e6, noWinter: true } },
    effect: 'domTerminal', desks: 8,
    stands: [
      { name: '9', code: 'C', contact: true, dist: 1, at: [880, 1080] },
      { name: '10', code: 'C', contact: true, dist: 1, at: [880, 1025] },
      { name: '11', code: 'C', contact: true, dist: 2, at: [880, 970] }
    ],
    src: 'sv.wikipedia Arlanda: the domestic terminal (today Terminal 4) opened on 1 October 1983; en.wikipedia Linjeflyg: Linjeflyg moved there from Bromma in October 1983; the Riksdag decided on 17 December 1980 that the jets at Bromma should move to Arlanda (Riksdagen TU 1981/82:28)',
    check: 'its look; where its apron lay'
  },
  computerRoom: {
    name: 'The computer room', year: 1984, plot: { x: 925, y: 1300, w: 22, h: 26 },
    stages: {
      room: { name: 'The room and its cooling', days: 20, price: 8e6 },
      ups: { name: 'Backup power', days: 10, price: 5e6, after: ['room'], optional: true, effect: 'backupPower' }
    },
    effect: 'computerRoom',
    check: 'the game\'s own story: where the first computers of Arlanda stood is not known'
  }
};
