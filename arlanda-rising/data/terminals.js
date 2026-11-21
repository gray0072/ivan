'use strict';

// Arlanda Rising — the terminals as the Terminal view and the shops see them (session 4), as plain data. Each one has:
//   name     as shown
//   item     the kind in S.airport.items that stands for the finished building (data/buildings.js)
//   who      whose departures go through it: 'all' (the first terminal before the others), 'intl', 'dom', or 'airlines'
//            (the airlines the game sends there: S.airlines[code].term)
//   units    its shop units by size, landside to airside: kiosk < unit < big; a brand fits a unit of its size or
//            bigger (data/brands.js); 'desk' units stand landside at the kerb (car rental, taxis, tickets)
//   sign     the bilingual sign over its door
//   cells    the cells for the airport's own shops (a kiosk takes 1, a café 2, a restaurant 3, a duty-free shop 4:
//            data/buildings.js `cells`), apart from the brands' units: they add up over the terminals standing
// The kerb is shared by every terminal: its desks are for the ground transport and the car rental companies.

const TERMINALS = {
  t1: { name: 'The first terminal', item: 'terminal', who: 'all', units: ['kiosk', 'unit'], cells: 6, sign: 'Avgångar · Departures' },
  intl: { name: 'The international terminal', item: 'intlTerminal', who: 'intl', units: ['big', 'unit', 'unit', 'unit', 'unit', 'kiosk', 'kiosk', 'kiosk'], cells: 8, sign: 'Utrikes · International' },
  dom: { name: 'The domestic terminal', item: 'domTerminal', who: 'dom', units: ['unit', 'unit', 'kiosk', 'kiosk'], cells: 4, sign: 'Inrikes · Domestic' },
  t2: { name: 'Terminal 2', item: 'terminal2', who: 'airlines', units: ['big', 'unit', 'unit', 'kiosk', 'kiosk'], cells: 4, sign: 'Terminal 2' },
  // session 5: Sky City between the terminals — shops and restaurants landside, for everybody who passes
  sky: { name: 'Sky City', item: 'skyCity', who: 'none', units: ['big', 'unit', 'unit', 'unit', 'kiosk', 'kiosk'], sign: 'Sky City' },
  kerb: { name: 'The kerb', item: 'terminal', who: 'none', units: ['desk', 'desk', 'desk', 'desk', 'desk', 'desk'], sign: 'Taxi · Buss · Hyrbil' }
};
const TERMINAL_ORDER = ['t1', 'intl', 'dom', 't2', 'sky', 'kerb'];
const UNIT_SIZES = ['kiosk', 'unit', 'big'];
