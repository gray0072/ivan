'use strict';

// ============================================================
// World Aviation — round the world: the ready routes, the classes
// of aircraft the marks and the records are kept by, and the
// expedition's sponsor (its paint and its emblem). The rules and the
// state are in sim/rtw.js, the screen in ui/rtw.js, the numbers
// (RTW) in constants.js.
// ============================================================

// The ready routes, each a ring from the home base and back to it (flown either way round).
// Checked against the rules by tools/rtw-check.js.
const RTW_ROUTES = [
  { id: 'north', name: 'Northern Pacific',
    blurb: 'Fourteen legs no longer than Tokyo–Anchorage: down to Jakarta, over the equator, for the distance, then across the North Pacific. The one route for the A220 and the 747-8F; Haneda is too short for the Mriya.',
    stops: ['ARN', 'IST', 'DXB', 'DEL', 'SIN', 'CGK', 'HKG', 'HND', 'ANC', 'SEA', 'LAX', 'MIA', 'JFK', 'KEF', 'ARN'] },
  { id: 'classic', name: 'Classic',
    blurb: 'Seven long legs by the great hubs: the Gulf, Singapore, Sydney, Honolulu, San Francisco and New York. Sydney–Honolulu is 4 412 nm.',
    stops: ['ARN', 'DXB', 'SIN', 'SYD', 'HNL', 'SFO', 'JFK', 'ARN'] },
  { id: 'south', name: 'Southern Cross',
    blurb: 'Five continents and the equator four times: Africa, Australia, New Zealand, the Pacific, the Americas and back over West Africa. Johannesburg–Perth is 4 487 nm.',
    stops: ['ARN', 'ATH', 'JNB', 'PER', 'SYD', 'AKL', 'HNL', 'LAX', 'MEX', 'BOG', 'GRU', 'LOS', 'ARN'] }
];

// The classes of aircraft, for the marks and the records: by the type's class name (AIRCRAFT's
// `klass`); the legend is its own. Only jets go round (no turboprop crosses an ocean in one leg),
// and never a type flown for its operator alone (the Belugas).
const RTW_CLASSES = [
  { id: 'narrow', name: 'Narrowbody', klass: ['Narrowbody jet', 'Regional jet'] },
  { id: 'wide', name: 'Widebody', klass: ['Widebody jet', 'Double-deck jet'] },
  { id: 'freight', name: 'Freighter', klass: ['Widebody freighter', 'Outsize freighter'] },
  { id: 'mriya', name: 'Mriya', legend: true }
];

// The expedition's sponsor, a club of the game's own: the client of every leg and the paint the
// aeroplane wears on them (the Mriya keeps its finish). Not one of AIRLINES — it never flies
// anything else — but in AIRLINE_BY_CODE, so the board, the briefing and the model find it.
const RTW_SPONSOR = {
  code: 'MRD', name: 'Meridian Club', title: 'MERIDIAN CLUB', kinds: ['pax', 'cargo'], country: 'Sweden', own: true,
  hubs: [], regions: [], bases: ['Sweden'],
  livery: { body: '#ffffff', belly: '#d8dde4', cheat: ['#c9a24a'], title: '#0b1f3f', tail: '#0b1f3f', engine: '#ffffff' },
  emblem: ['globe', '#e0bb5a', '#173561']
};
AIRLINE_BY_CODE[RTW_SPONSOR.code] = RTW_SPONSOR;
