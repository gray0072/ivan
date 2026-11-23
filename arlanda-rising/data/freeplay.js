'use strict';

// Arlanda Rising — the data of Free Play (spec/freeplay.md). The era presets (FREE_ERAS): the airport each start point
// had — the projects the owner built (`requires`), the budget, the loan room, the vehicles, the desks, the airlines'
// routes, the domains' levels and what the Office may buy — used by today's rounds (sim/freeplay.js) and by the non-stop
// driver (sim/free.js) as its starts. The minutes each type stays on the ground (FREE_TURN). The shape of a played day
// (FREE_WAVES): how the arrivals of each kind of airline spread over the hours. The month's climate at Arlanda
// (FREE_CLIMATE) for the played day's weather. The airline kinds whose late arrivals stay the night (FREE_NIGHTSTOP_KINDS).

const FREE_OPENS_FIRST = null;
const FREE_ERAS = [
  { id: '1963', name: 'The open airport, 1963', date: '1963-04-01', opens: FREE_OPENS_FIRST,
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'fireStation', 'lights1'],
    setup: { open: true, budget: 40e6, loanLimit: 80e6, items: { fuelTruck: 2, plough: 4 }, desks: 4,
      airlines: { SK: [{ type: 'CRVL', perDay: 11, load: 0.68 }, { type: 'DC8', perDay: 2, load: 0.72 }] },
      unlock: { stands: 1, turnaround: 1, checkin: 1, snow: 1 } } },
  { id: '1976', name: 'The jet age, 1976', date: '1976-09-06', opens: '2-11',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'fireStation', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal'],
    setup: { open: true, budget: 60e6, loanLimit: 150e6, items: { fuelTruck: 4, plough: 4, crashTender: 2 }, desks: 18,
      airlines: { SK: [{ type: 'DC9', perDay: 14, load: 0.7 }, { type: 'DC8', perDay: 3, load: 0.72 }, { type: 'B747', perDay: 2, load: 0.68 }],
        LH: [{ type: 'B727', perDay: 2, load: 0.7 }], AY: [{ type: 'DC9', perDay: 2, load: 0.7 }] },
      domains: { stands: 1, turnaround: 1, checkin: 1, snow: 1, baggage: 2 }, unlock: { stands: 1, turnaround: 1, checkin: 1, snow: 1, baggage: 2 } } },
  { id: '1989', name: 'Everyone flies, 1990', date: '1990-03-05', opens: '3-11',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'fireStation', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal', 'domTerminal', 'computerRoom', 'terminal3'],
    setup: { open: true, budget: 80e6, loanLimit: 200e6, items: { fuelTruck: 5, plough: 5, crashTender: 2 }, desks: 26, it: 3,
      airlines: { SK: [{ type: 'DC9', perDay: 18, load: 0.72 }, { type: 'MD81', perDay: 6, load: 0.72 }, { type: 'B747', perDay: 2, load: 0.7 }],
        LF: [{ type: 'F28', perDay: 30, load: 0.74 }], LH: [{ type: 'B727', perDay: 4, load: 0.7 }], AY: [{ type: 'DC9', perDay: 4, load: 0.7 }] },
      domains: { stands: 2, turnaround: 1, checkin: 1, snow: 1, baggage: 2, info: 2 },
      unlock: { stands: 2, turnaround: 1, checkin: 2, snow: 2, baggage: 2, info: 2 } } },
  // session 4: the open skies of 2000, with the shops' units, the security lanes, the train and the rivals
  { id: '1999', name: 'Open skies, 2000', date: '2000-02-07', opens: '4-11',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'fireStation', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal', 'domTerminal', 'computerRoom', 'terminal3', 'terminal2', 'arlandaExpress', 'sorterHall'],
    setup: { open: true, openSkies: true, units: true, lanes: 8, budget: 100e6, loanLimit: 400e6, items: { fuelTruck: 6, plough: 6, crashTender: 2, generator: 1 }, desks: 36, it: 6,
      airlines: { SK: [{ type: 'MD87', perDay: 16, load: 0.74 }, { type: 'B737', perDay: 14, load: 0.74 }, { type: 'DC9', perDay: 8, load: 0.72 }],
        BRAATHENS: [{ type: 'B737', perDay: 6, load: 0.72 }], LH: [{ type: 'B737', perDay: 5, load: 0.72 }], AY: [{ type: 'MD87', perDay: 5, load: 0.72 }] },
      domains: { stands: 2, turnaround: 1, checkin: 2, snow: 2, baggage: 3, info: 2 }, terms: { SK: 't2' }, rivals: { pull: 1, months: 1 },
      unlock: { stands: 2, turnaround: 1, checkin: 2, snow: 2, baggage: 3, info: 2 } } },
  // session 5: the airport of 2009 — Schengen and the border, two parallel runways, the de-icing pads, Sky City and
  // Cargo City, the security rules of 2006
  { id: '2009', name: 'A new millennium, 2009', date: '2009-04-06', opens: '5-11',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'fireStation', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal', 'domTerminal', 'computerRoom', 'terminal3', 'terminal2', 'arlandaExpress', 'sorterHall',
      'skyCity', 'skyCity.hotel', 'schengen', 'schengen.t2', 'tower2', 'pierF', 'pierF.bridges', 'runway3', 'bridges', 'deicePads', 'cargoCity'],
    setup: { open: true, openSkies: true, units: true, lanes: 14, budget: 150e6, loanLimit: 800e6, items: { fuelTruck: 6, plough: 7, crashTender: 3, generator: 1, deicer: 3 }, desks: 40, it: 8,
      airlines: { SK: [{ type: 'B736', perDay: 16, load: 0.74 }, { type: 'A321', perDay: 6, load: 0.76 }, { type: 'CRJ9', perDay: 6, load: 0.72 }, { type: 'A343', perDay: 2, load: 0.8 }],
        DY: [{ type: 'B738', perDay: 8, load: 0.8 }], LH: [{ type: 'A320', perDay: 5, load: 0.74 }], AY: [{ type: 'A320', perDay: 5, load: 0.74 }], BA: [{ type: 'A320', perDay: 4, load: 0.76 }],
        QR: [{ type: 'A319', perDay: 1, load: 0.78 }] },
      domains: { stands: 2, turnaround: 1, checkin: 2, snow: 2, baggage: 3, info: 2, border: 1, security: 2, deice: 2 }, terms: { SK: 'intl', BA: 't2', AY: 't2', DY: 't2' },
      booths: 6, secRule: 2, events: true, rivals: { pull: 1, months: 1 },
      unlock: { stands: 2, turnaround: 1, checkin: 2, snow: 2, baggage: 3, info: 2, border: 1, security: 2, deice: 3 } } },
  // session 6: the airport after the storm years — Terminals 4 and 5 as one, the A380 gate, the freighters, cyber attacks
  { id: '2024', name: 'After the storm, 2024', date: '2024-09-02', opens: '7-11',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'fireStation', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal', 'domTerminal', 'computerRoom', 'terminal3', 'terminal2', 'arlandaExpress', 'sorterHall',
      'skyCity', 'skyCity.hotel', 'schengen', 'schengen.t2', 'tower2', 'pierF', 'pierF.bridges', 'runway3', 'bridges', 'deicePads', 'cargoCity', 'aquifer', 'gateF', 'oldHall', 't4t5'],
    setup: { open: true, openSkies: true, units: true, lanes: 20, budget: 300e6, loanLimit: 1500e6, items: { fuelTruck: 6, plough: 7, crashTender: 3, generator: 1, deicer: 4 }, desks: 40, it: 11,
      airlines: { SK: [{ type: 'A20N', perDay: 14, load: 0.8 }, { type: 'A321', perDay: 8, load: 0.8 }, { type: 'CRJ9', perDay: 8, load: 0.76 }, { type: 'A359', perDay: 1, load: 0.85 }],
        DY: [{ type: 'B738', perDay: 12, load: 0.84 }, { type: 'B38M', perDay: 4, load: 0.84 }], LH: [{ type: 'A320', perDay: 5, load: 0.74 }], AY: [{ type: 'A321', perDay: 5, load: 0.76 }],
        BA: [{ type: 'A320', perDay: 4, load: 0.76 }], EK: [{ type: 'B77W', perDay: 1, load: 0.86 }], QR: [{ type: 'A359', perDay: 1, load: 0.85 }],
        DHL: [{ type: 'B76F', perDay: 1, load: 0.8 }], UPS: [{ type: 'B76F', perDay: 1, load: 0.8 }] },
      domains: { stands: 3, turnaround: 1, checkin: 3, snow: 2, baggage: 3, info: 2, border: 2, security: 2, deice: 3 }, terms: { SK: 'intl', BA: 't2', AY: 't2', DY: 't2' },
      booths: 8, secRule: 2, events: true, cyber: true, mothball: ['t3'], owner: 'Swedavia', green: true, permit: { perDay: 135 }, rivals: { pull: 1, months: 1 },
      unlock: { stands: 3, turnaround: 1, checkin: 3, snow: 2, baggage: 3, info: 2, border: 2, security: 3, deice: 3 } } }
];

// game minutes on the ground by type, for the flights made from the routes
const FREE_TURN = { DC3: 30, CV44: 35, DC6B: 55, CRVL: 40, DC8: 65, DC9: 40, B727: 50, B747: 125, DC10: 75, F28: 35, MD81: 40,
  B737: 40, B767: 90, MD87: 40, F100: 35, F50: 25, BA46: 35, A320: 55, B757: 60,
  B736: 45, B738: 50, A321: 55, A319: 50, CRJ9: 40, AT72: 35, A333: 110, A343: 110, B77W: 120, B789: 110, A388: 140, G550: 60,
  B76F: 90, B77F: 120, A20N: 50, B38M: 50, A359: 110, EL30: 35, H2P: 50 };

// the arrivals of a played day by the hour (index = hour 0–23, relative weights), by the airline's kind (data/airlines.js):
// the home carrier's morning and evening waves round its bank of departures, the network carriers from their hubs in the
// morning and the afternoon, the charters late (and early) in the day, the long-haul ones at midday, the freighters at
// night. Nothing lands before 05:00 or after 23:00 (the played day is FREE_DAY_FROM–FREE_DAY_TO).
const FREE_WAVES = {
  //          0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
  home:     [0, 0, 0, 0, 0, 1, 5, 8, 8, 6, 3, 3, 3, 3, 3, 4, 7, 8, 7, 5, 4, 3, 2, 0],
  domestic: [0, 0, 0, 0, 0, 1, 6, 8, 7, 5, 3, 3, 3, 3, 3, 4, 7, 8, 7, 5, 4, 3, 2, 0],
  network:  [0, 0, 0, 0, 0, 0, 1, 3, 6, 7, 5, 3, 3, 3, 4, 6, 7, 6, 4, 3, 2, 1, 0, 0],
  lowcost:  [0, 0, 0, 0, 0, 0, 2, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 4, 3, 2, 1, 0],
  charter:  [0, 0, 0, 0, 0, 1, 3, 3, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 4, 5, 5, 4, 0],
  longhaul: [0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 3, 5, 7, 8, 7, 5, 3, 2, 1, 1, 1, 1, 0, 0],
  cargo:    [0, 0, 0, 0, 0, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 4, 5, 0],
  business: [0, 0, 0, 0, 0, 0, 1, 2, 4, 5, 5, 4, 4, 4, 4, 5, 5, 4, 3, 2, 1, 0, 0, 0],
  future:   [0, 0, 0, 0, 0, 1, 5, 8, 8, 6, 3, 3, 3, 3, 3, 4, 7, 8, 7, 5, 4, 3, 2, 0]
};
// the kinds of airline based at Arlanda: their arrivals from FREE_NIGHTSTOP_FROM stay the night on their stands and leave in
// the next played day's morning wave
const FREE_NIGHTSTOP_KINDS = ['home', 'domestic', 'future'];

// the climate of each month at Arlanda (index 0 = January): the mean temperature (°C), the chance that the played day has
// a snowfall, and the chance of a morning fog
const FREE_CLIMATE = [
  { temp: -4, snow: 0.45, fog: 0.1 }, { temp: -4, snow: 0.4, fog: 0.1 }, { temp: -1, snow: 0.25, fog: 0.1 },
  { temp: 4, snow: 0.05, fog: 0.1 }, { temp: 10, snow: 0, fog: 0.05 }, { temp: 15, snow: 0, fog: 0.05 },
  { temp: 17, snow: 0, fog: 0.05 }, { temp: 16, snow: 0, fog: 0.1 }, { temp: 11, snow: 0, fog: 0.15 },
  { temp: 6, snow: 0.02, fog: 0.2 }, { temp: 1, snow: 0.25, fog: 0.2 }, { temp: -2, snow: 0.4, fog: 0.1 }
];
