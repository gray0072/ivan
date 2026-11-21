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
    name: 'The baggage hall', year: 1973, plot: { x: 880, y: 1124, w: 45, h: 56 },
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
  },

  // ---------- chapter 4: open skies ----------
  terminal2: {
    name: 'Terminal 2', year: 1990, plot: { x: 890, y: 760, w: 90, h: 170 },
    stages: {
      hall: { name: 'The terminal hall', days: 50, price: 140e6 },
      gates: { name: 'The gates and their apron', days: 35, price: 70e6 },
      desks: { name: 'Check-in desks', days: 12, price: 10e6, after: ['hall'] },
      units: { name: 'Shop units', days: 15, price: 12e6, after: ['hall'], optional: true, effect: 'units' }
    },
    mods: { tents: { name: 'Heated winter tents', price: 6e6, noWinter: true } },
    effect: 'terminal2', desks: 10,
    stands: [
      { name: '12', code: 'C', contact: true, dist: 1, at: [880, 905] },
      { name: '13', code: 'C', contact: true, dist: 1, at: [880, 850] },
      { name: '14', code: 'D', contact: true, dist: 2, at: [880, 795] }
    ],
    src: 'swedavia.com About the airport; sv.wikipedia Stockholm-Arlanda flygplats: Inrikes 2, today Terminal 2, opened in 1990 for SAS\'s domestic flights; in 1992 it was rebuilt for domestic and international flights and the terminals were numbered 2–5',
    check: 'its opening day (en.wikipedia alone gives 12 December 1990); its look and its apron'
  },
  arlandaExpress: {
    name: 'Arlanda Express', year: 1999, plot: { x: 1020, y: 700, w: 140, h: 1000 },
    stages: {
      tunnel: { name: 'The tunnel under the airport', days: 110, price: 1500e6 },
      line: { name: 'The line to the East Coast railway', days: 110, price: 1700e6 },
      south: { name: 'Arlanda South station', days: 50, price: 350e6, after: ['tunnel'] },
      north: { name: 'Arlanda North station', days: 50, price: 350e6, after: ['tunnel'] }
    },
    effect: 'arlandaExpress',
    src: 'sv.wikipedia Arlandabanan; arlandabananinfrastructure.se: the consortium picked in August 1994 (NCC, SIAB, Vattenfall, GEC Alsthom and John Mowlem, as A-Train AB), building from 1995, the first train on 24 November 1999 (en.wikipedia says the 25th), a concession to 2040, about 6 billion SEK; stations Arlanda South (Terminals 2–4) and Arlanda North (Terminal 5)',
    check: 'the tunnel\'s course on the map (the game\'s drawing)'
  },
  sorterHall: {
    name: 'The sorting hall', year: 1997, plot: { x: 960, y: 1330, w: 40, h: 50 },
    stages: { hall: { name: 'The hall and its belts', days: 30, price: 40e6 } },
    effect: 'sorterHall',
    check: 'the game\'s own story: the first documented tilt-tray sorter at Arlanda came in 2002 (Crisplant)'
  },

  // ---------- chapter 5: a new millennium (session 5) ----------
  schengen: {
    name: 'The Schengen split', year: 2001, plot: { x: 890, y: 1390, w: 75, h: 255 },
    stages: {
      level: { name: 'A new floor in the international terminal', days: 40, price: 140e6 },
      booths: { name: 'The passport hall and its booths', days: 15, price: 25e6, after: ['level'] },
      t2: { name: 'Terminal 2 for international flights', days: 20, price: 30e6, optional: true, effect: 't2intl' }
    },
    mods: { tents: { name: 'Heated winter tents', price: 10e6, noWinter: true } },
    effect: 'schengen', booths: 6,
    src: 'Council Decision 2000/777/EC: the Nordic states applied Schengen in full from 25 March 2001; swedavia.com About the airport and sv.wikipedia Stockholm-Arlanda flygplats: in 2001 Terminal 2 became international only and Terminal 5 got a fourth level to keep Schengen and non-Schengen passengers apart',
    check: 'where the passport hall stood in the terminal (the game\'s drawing)'
  },
  tower2: {
    name: 'The new control tower', year: 2001, plot: { x: 1050, y: 1100, w: 26, h: 26 },
    // the tower itself stood by May 2001: what is left is its fitting out and the move
    stages: {
      systems: { name: 'Radar and radio systems', days: 35, price: 70e6 },
      desks: { name: 'The controllers\' desks', days: 25, price: 40e6, after: ['systems'] },
      training: { name: 'Training in the new tower', days: 25, price: 20e6, after: ['desks'] },
      move: { name: 'The controllers move in', days: 8, price: 5e6, after: ['training'] }
    },
    effect: 'tower2',
    src: 'swedavia.com About the airport; sv.wikipedia Stockholm-Arlanda flygplats: by Wingårdh Arkitektkontor, built from July 1999 to May 2001, in service on 23 December 2001; 83 m, 90 m with its mast',
    check: 'its exact place by the terminals (the game\'s drawing); the concrete award rests on one source'
  },
  pierF: {
    name: 'Pier F', year: 2002, plot: { x: 700, y: 1655, w: 270, h: 250 },
    // the pier stood by the end of 2001: its gates and apron are fitted out for the opening
    stages: {
      gates: { name: 'Fit out the gates', days: 20, price: 120e6 },
      apron: { name: 'Mark out its apron', days: 15, price: 40e6 },
      bridges: { name: 'Jet bridges', days: 15, price: 75e6, after: ['gates'], optional: true, effect: 'jetBridges' }
    },
    mods: { tents: { name: 'Heated winter tents', price: 8e6, noWinter: true } },
    effect: 'pierF',
    stands: [
      { name: '15', code: 'E', contact: false, dist: 2, at: [880, 1690] },
      { name: '16', code: 'E', contact: false, dist: 2, at: [880, 1755] },
      { name: '17', code: 'D', contact: false, dist: 3, at: [880, 1820] },
      { name: '18', code: 'D', contact: false, dist: 3, at: [880, 1885] }
    ],
    src: 'swedavia.com About the airport: "January 2002: a new pier at Terminal 5 enters service"; sv.wikipedia gives Pier F with 2003, en.wikipedia its F gates with the 2003 expansion',
    check: 'the year (2002 or 2003: Swedavia\'s 2002 is told); its stands and apron (the game\'s drawing)'
  },
  runway3: {
    name: 'Runway 3 (01R/19L)', year: 2003, plot: { x: 2085, y: -1220, w: 500, h: 2470 },
    stages: {
      strip: { name: 'Finish the strip', days: 30, price: 200e6 },
      pave: { name: 'Pave the runway', days: 60, price: 900e6, after: ['strip'] },
      lights: { name: 'Lights and the landing system', days: 20, price: 160e6, after: ['pave'] }
    },
    effect: 'runway3', len: 2500,
    src: 'swedavia.com About the airport; sv.wikipedia Stockholm-Arlanda flygplats: building began on 10 November 1998 and the first flight used it on 17 April 2003, later than planned because of the downturn of 2002 (newstodate.aero gives 14 April); 2 500 m; its ends from SkyVector (59°37.58′ N 17°57.04′ E, 59°38.91′ N 17°57.52′ E)',
    check: 'its cost (not found: the game\'s figure)'
  },
  bridges: {
    name: 'The taxiway bridges', year: 2003, plot: { x: 760, y: 120, w: 1620, h: 200 },
    stages: {
      road: { name: 'The bridge over the road', days: 35, price: 220e6 },
      rail: { name: 'The bridge over the railway', days: 35, price: 240e6 },
      taxi: { name: 'The taxiways to runway 3', days: 20, price: 110e6, after: ['road', 'rail'] }
    },
    mods: { tents: { name: 'Heated winter tents', price: 15e6, noWinter: true } },
    effect: 'bridges',
    src: 'en.wikipedia Stockholm Arlanda Airport and Taxiway bridge: runway 3 is reached from the terminals over taxiway bridges built for the heaviest aircraft (the AIP marks bridges on taxiways U and W); a photo shows one over county road 273',
    check: 'the year each bridge was built; what each crosses (the game draws one over the road and one over the railway)'
  },
  deicePads: {
    name: 'Remote de-icing pads', year: 2004, plot: { x: 150, y: 60, w: 260, h: 200 },
    stages: {
      south: { name: 'The pad by the south end of runway 1', days: 20, price: 55e6 },
      r3: { name: 'The pad by runway 3', days: 20, price: 55e6 },
      drains: { name: 'Glycol drains and tanks', days: 10, price: 30e6, after: ['south'] }
    },
    mods: { tents: { name: 'Heated winter tents', price: 12e6, noWinter: true } },
    effect: 'deicePads',
    src: 'en.wikipedia Stockholm Arlanda Airport; futureairport.com "The war on cold": de-icing areas near runway 3 and in the southern ramp near runway 01L; de-icing only on surfaces that drain to the glycol collection',
    check: 'the year the pads came (not found: the game\'s 2004)'
  },
  skyCity: {
    name: 'Sky City', year: 1993, plot: { x: 1024, y: 1395, w: 130, h: 55 },
    stages: {
      hall: { name: 'The hall between the terminals', days: 60, price: 300e6 },
      hotel: { name: 'The hotel', days: 60, price: 260e6, optional: true, effect: 'hotel' }
    },
    effect: 'skyCity',
    src: 'sv.wikipedia and en.wikipedia Stockholm-Arlanda flygplats: Sky City, the landside concourse between Terminals 4 and 5 with Arlanda Central station below, was inaugurated in 1993 (van Mierop & Belaieff); the Radisson SAS SkyCity Hotel from 1993',
    check: 'the hotel\'s year rests on hotel listings only; in the game the owner builds Sky City before chapter 5'
  },
  cargoCity: {
    name: 'Cargo City', year: 2006, plot: { x: 905, y: 395, w: 75, h: 345 },
    stages: {
      halls: { name: 'The cargo halls', days: 45, price: 260e6 },
      offices: { name: 'Offices for the forwarders', days: 30, price: 80e6, after: ['halls'], optional: true, effect: 'offices' }
    },
    effect: 'cargoCity',
    src: 'en.wikipedia Stockholm Arlanda Airport: Cargo City opened in 2006',
    check: 'its place and look (the game\'s drawing)'
  },

  // ---------- chapter 6: bigger and greener ----------
  aquifer: {
    name: 'The aquifer energy store', year: 2009, plot: { x: 1180, y: 1450, w: 120, h: 80 },
    stages: {
      wells: { name: 'Wells into the esker', days: 40, price: 30e6 },
      plant: { name: 'Pumps and heat exchangers', days: 20, price: 20e6, after: ['wells'] }
    },
    effect: 'aquifer',
    src: 'swedavia.com The aquifer: in use since the summer of 2009, about 600 000 m³ of water in the esker, about 19 GWh saved a year (as much as 2 000 houses use)',
    check: 'the esker\'s name (Brunkebergsåsen, Långåsen or Stockholmsåsen by the source)'
  },
  gateF: {
    name: 'The A380 gate', year: 2018, plot: { x: 760, y: 1905, w: 210, h: 90 },
    stages: {
      stand: { name: 'A stand for the biggest aircraft', days: 35, price: 140e6 },
      wing: { name: 'Over-the-wing boarding', days: 20, price: 40e6, after: ['stand'], optional: true, effect: 'overWing' }
    },
    effect: 'codeF',
    stand: { name: '19', code: 'F', contact: true, dist: 3, at: [880, 1950] },
    src: 'newstodate.aero, January 2018: a new A380 gate at Pier F with two exits, one over the wing, boards more than 500 passengers in 35 minutes; the first A380 at Arlanda was Lufthansa\'s demonstration visit on 15 September 2010',
    check: 'its stand number (not found)'
  },

  // ---------- chapter 7: the storm years ----------
  t4t5: {
    name: 'One terminal: Terminals 4 and 5 joined', year: 2022, plot: { x: 900, y: 1112, w: 40, h: 278 },
    stages: {
      tunnel: { name: 'A walking tunnel airside', days: 40, price: 160e6 },
      gates: { name: 'Signs, gates and the shops\' corridor', days: 12, price: 30e6, after: ['tunnel'] }
    },
    mods: { fast: { name: 'Work at night too', price: 15e6, noWinter: true } },
    effect: 't4t5',
    src: 'swedavia.com, Terminal 4 is open (15 June 2022) and Terminal 4 is now part of Terminal 5: a pedestrian tunnel lets passengers walk between them airside without a second security check; Terminals 2, 3 and 4 were closed in the pandemic and Terminal 2 reopened on 26 October 2021',
    check: 'the tunnel\'s length and place (the game\'s drawing)'
  },

  // ---------- chapter 8: Arlanda 2040 — the player's own pier (the real Pier G was dropped in November 2026) ----------
  pier2040: {
    name: 'Your pier', year: 2036, plot: { x: 700, y: 1995, w: 240, h: 265 },
    stages: {
      ground: { name: 'The site and the foundations', days: 35, price: 500e6 },
      hall: { name: 'The pier itself', days: 45, price: 1300e6, after: ['ground'] },
      gates: { name: 'Gates, bridges and the apron', days: 20, price: 400e6, after: ['hall'] },
      arm: { name: 'A second arm', days: 30, price: 650e6, after: ['hall'], optional: true, effect: 'pierArm' }
    },
    mods: { tents: { name: 'Heated winter tents', price: 30e6, noWinter: true } },
    effect: 'pier2040',
    // where its stands stand ([x, y, heading]; data/layout.js pier2040): the finger's along x 880 (nose east, wider apart
    // for the two code D stands); the satellite's code E and D stands on its west side nose east, its code C ones on its east
    // side nose west, reached by the lane `satLane` (x, then y: in along the satellite's south end); the second arm's along
    // its west side, on its own apron
    spots: {
      finger: [[880, 2022, 90], [880, 2074, 90], [880, 2120, 90], [880, 2160, 90], [880, 2200, 90], [880, 2240, 90]],
      satellite: [[798, 2045, 90], [798, 2115, 90], [798, 2177, 90], [798, 2232, 90], [842, 2040, 270], [842, 2095, 270], [842, 2150, 270], [842, 2205, 270]],
      arm: [[880, 2285, 90], [880, 2325, 90], [880, 2365, 90], [880, 2405, 90]]
    },
    satLane: [805, 1999],
    // its design is the player's (a decision: `pier`): the stands it brings and × its price
    designs: {
      finger: { k: 1, stands: [['G1', 'D'], ['G2', 'D'], ['G3', 'C'], ['G4', 'C'], ['G5', 'C'], ['G6', 'C']] },
      satellite: { k: 1.3, stands: [['G1', 'E'], ['G2', 'E'], ['G3', 'D'], ['G4', 'D'], ['G5', 'C'], ['G6', 'C'], ['G7', 'C'], ['G8', 'C']] },
      green: { k: 1.15, charge: true, stands: [['G1', 'D'], ['G2', 'D'], ['G3', 'C'], ['G4', 'C'], ['G5', 'C'], ['G6', 'C']] }
    },
    arm: [['G9', 'C'], ['G10', 'C'], ['G11', 'C'], ['G12', 'C']],
    src: 'swedavia.com: Pier G, 14 gates with jet bridges, was approved for detailed design in 2025 and discontinued by Swedavia\'s board in November 2026',
    check: 'the game\'s own: the player\'s design for the future'
  }
};
