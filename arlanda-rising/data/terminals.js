'use strict';

// Arlanda Rising — the terminals as the Terminal view and the shops see them (session 4), as plain data. Each one has:
//   name     as shown when it opens
//   names    the names it had later, each from a year on: [[year, name]…] — as at the real Arlanda, where the
//            domestic terminal became Inrikes 1 when Inrikes 2 opened (1990), the terminals were numbered 2–5 in 1993
//            (no 1: the number was kept for a terminal south of Terminal 2 never built) and Terminal 4 became Pier C
//            of Terminal 5 in 2025 (sim/terminal.js name)
//   item     the kind in S.airport.items that stands for the finished building (data/buildings.js)
//   who      whose departures go through it: 'all' (the first terminal before the others), 'intl', 'dom', 'airlines'
//            (the airlines the game sends there: S.airlines[code].term) or 'prop' (the domestic flights by propeller)
//   units    its shop units by size, landside to airside: kiosk < unit < big; a brand fits a unit of its size or
//            bigger (data/brands.js); 'desk' units stand landside at the kerb (car rental, taxis, tickets)
//   sign     the bilingual sign over its door
//   cells    the cells for the airport's own shops (a kiosk takes 1, a café 2, a restaurant 3, a duty-free shop 4:
//            data/buildings.js `cells`), apart from the brands' units: they add up over the terminals standing
//   desks    the check-in desks its hall has room for (the desks its project brings and those bought later): they add up
//            over the terminals standing (sim/airport.js deskRoom); the first terminal's hall stays with the kerb after 2017
//   lanes    the security lanes its checkpoint has room for (the lanes a mission brings and those bought later): they add up
//            over the terminals standing (sim/airport.js laneRoom) — 41 from 1990, 37 once the first terminal is gone (2018);
//            the reference campaign has 10–33
// The kerb is shared by every terminal: its desks are for the ground transport and the car rental companies.

const TERMINALS = {
  t1: { name: 'The first terminal', item: 'terminal', who: 'all', units: ['kiosk', 'unit'], cells: 6, desks: 12, lanes: 4, sign: 'Avgångar · Departures' },
  intl: { name: 'The international terminal', names: [[1993, 'Terminal 5']], item: 'intlTerminal', who: 'intl', units: ['big', 'unit', 'unit', 'unit', 'unit', 'kiosk', 'kiosk', 'kiosk'], cells: 8, desks: 16, lanes: 16, sign: 'Utrikes · International' },
  dom: { name: 'The domestic terminal', names: [[1990, 'Domestic 1'], [1993, 'Terminal 4'], [2025, 'Terminal 5 · Pier C']], item: 'domTerminal', who: 'dom', units: ['unit', 'unit', 'kiosk', 'kiosk'], cells: 4, desks: 10, lanes: 8, sign: 'Inrikes · Domestic' },
  // Terminal 3 (1989): the regional terminal; closed in the pandemic (2020) and opened again in October 2024; closed as a
  // terminal in September 2026, its gates 51–59 joined to Terminal 2 at the end of 2026; its name before 1993 not found
  t3: { name: 'The regional terminal', names: [[1993, 'Terminal 3'], [2027, 'Terminal 2 · gates 51–59']], item: 'terminal3', who: 'prop', units: ['unit', 'kiosk'], cells: 2, desks: 4, lanes: 3, sign: 'Terminal 3' },
  t2: { name: 'Domestic 2', names: [[1993, 'Terminal 2']], item: 'terminal2', who: 'airlines', units: ['big', 'unit', 'unit', 'kiosk', 'kiosk'], cells: 4, desks: 14, lanes: 10, sign: 'Terminal 2' },
  // session 5: Sky City between the terminals — shops and restaurants landside, for everybody who passes
  sky: { name: 'Sky City', item: 'skyCity', who: 'none', units: ['big', 'unit', 'unit', 'unit', 'kiosk', 'kiosk'], sign: 'Sky City' },
  kerb: { name: 'The kerb', item: 'terminal', who: 'none', units: ['desk', 'desk', 'desk', 'desk', 'desk', 'desk'], sign: 'Taxi · Buss · Hyrbil' }
};
const TERMINAL_ORDER = ['t1', 'intl', 'dom', 't2', 't3', 'sky', 'kerb'];
const UNIT_SIZES = ['kiosk', 'unit', 'big'];
