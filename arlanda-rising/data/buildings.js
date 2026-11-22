'use strict';

// Arlanda Rising — every kind of thing the airport owns, as plain data:
//   name     as shown
//   price    SEK to build or buy (its upkeep is UPKEEP_YEAR of it a year)
//   staff    full-time jobs it needs (STAFF_MONTH each a month)
//   small    can be bought during a mission (from the bar's buy menu, BUY_MENU below), takes `days` in plan time
//            (those still being fitted when the stage ends are finished then) and is there at once in ops time
//   from     the first year it can be bought; a mission may also open it (data/missions `unlocks`): before that
//            mission the campaign shows it locked (Missions.unlockAt)
//   icon     the sign before its name (the buy menu, the plan panel, the cards)
//   about    what it does, in a line (the buy menu's card)
//   max      the most worth having (Airport.cap): one more is refused
//   bulk     bought one by one in numbers (desks, lanes, booths, trucks…): the buy menu's card has +5 and +10 too (BUY_BULK)
//   needs    what must be there before it can be bought (Airport.needs): kerb (a terminal's check-in hall), intl (the
//            international terminal), security (the security checkpoint), deice (de-icing as a domain), border
//            (passport control), green (the green rating), cargo (Cargo City)
//   shop     share of the full shop spend per passenger it brings (SHOP_SPEND), airport-wide
//   cells    the cells of a terminal it takes (the airport's own shops: data/terminals.js `cells`; it can be bought
//            only while a terminal has that many free, and sold back for SHOP_SELL_BACK of its price)
//   term     the terminal it goes into first when there is room (else the first in TERMINAL_ORDER with room)
//   places   a car park's places: the car parks earn PARKING_PER_PAX of each departing passenger as far as their places
//            cover those the drivers need at today's traffic (sim/airport.js parkingNeed); past that one more earns nothing
// The big historical structures (runways, the tower, the terminals) come from data/masterplan.js and are
// added here as their kinds when a project is finished.

const BUILDINGS = {
  siteOffice: { name: 'Site office', price: 0, staff: 6 },
  runway: { name: 'Runway', price: 420e6, staff: 4 },
  apron: { name: 'Apron', price: 60e6, staff: 2 },
  fireStation: { name: 'Fire station', price: 15e6, staff: 12 },
  tower: { name: 'Control tower', price: 0, staff: 14 },
  terminal: { name: 'Terminal', price: 0, staff: 18 },
  lights: { name: 'Runway lights', price: 0, staff: 2 },
  stand: { name: 'Remote stand', price: 4e6, staff: 0, small: true, days: 12, from: 1959, icon: '🅿️',
    about: 'A stand away from the terminal for an aircraft up to a Boeing 737: the passengers walk out to it.' },
  fuelTruck: { name: 'Fuel truck', price: 1.2e6, staff: 2, small: true, days: 0, from: 1959, icon: '⛽', bulk: true,
    about: 'Fuels one aircraft at a time at its stand.' },
  plough: { name: 'Snowplough', price: 1.6e6, staff: 2, small: true, days: 0, from: 1959, icon: '🚜', bulk: true,
    about: 'Sweeps the snow off a runway, in a convoy with the others.' },
  desk: { name: 'Check-in desk', price: 0.15e6, staff: 1, small: true, days: 2, from: 1960, icon: '🧳', needs: 'kerb', bulk: true,
    about: 'Checks in the passengers. An open desk costs wages by the hour.' },
  kiosk: { name: 'Kiosk', price: 0.6e6, staff: 0, small: true, days: 10, from: 1960, shop: 0.5, cells: 1, icon: '🏪',
    about: 'A small shop: earns from every departing passenger with time to spare.' },
  cafe: { name: 'Café', price: 2.5e6, staff: 0, small: true, days: 25, from: 1960, shop: 1, cells: 2, icon: '☕',
    about: 'Earns from every departing passenger with time before boarding.' },
  parkingSmall: { name: 'Car park (300 places)', price: 6e6, staff: 1, small: true, days: 20, from: 1960, places: 300, icon: '🚗',
    about: 'Parking fees from the drivers, as far as the places cover them.' },
  parkingBig: { name: 'Car park (1 200 places)', price: 18e6, staff: 3, small: true, days: 40, from: 1960, places: 1200, icon: '🚙',
    about: 'Parking fees from the drivers, as far as the places cover them.' },
  // session 3: chapters 2 and 3
  crashTender: { name: 'Crash tender', price: 3.5e6, staff: 3, small: true, days: 30, from: 1963, icon: '🚒',
    about: 'Raises the fire category by one: bigger aircraft may come.' },
  generator: { name: 'Backup generator', price: 6e6, staff: 1, small: true, days: 20, from: 1970, icon: '⚡', max: 1,
    about: 'Keeps the systems running through a power cut.' },
  dutyFree: { name: 'Duty-free shop', price: 30e6, staff: 0, small: true, days: 60, from: 1976, shop: 1.2, cells: 4, term: 'intl', icon: '🛍️', needs: 'intl',
    about: 'A big shop for the passengers flying abroad.' },
  restaurant: { name: 'Restaurant', price: 8e6, staff: 0, small: true, days: 40, from: 1965, shop: 0.6, cells: 3, icon: '🍽️',
    about: 'Earns from the departing passengers with time to sit down.' },
  busStop: { name: 'Airport coach stops', price: 8e6, staff: 0, small: true, days: 30, from: 1989, bus: true, icon: '🚌', max: 1,
    about: 'Coaches from the city: the passengers like the way here, and fewer of them drive.' },
  apron2: { name: 'The jet apron', price: 0, staff: 4 },
  runway2: { name: 'Runway 2', price: 0, staff: 4 },
  ils: { name: 'Instrument landing system', price: 0, staff: 2 },
  intlTerminal: { name: 'The international terminal', price: 0, staff: 40 },
  domTerminal: { name: 'The domestic terminal', price: 0, staff: 26 },
  bagHall: { name: 'The baggage hall', price: 0, staff: 2 },
  computerRoom: { name: 'The computer room', price: 0, staff: 0 },
  // session 4: chapter 4
  lane: { name: 'Security lane', price: 2.5e6, staff: 0, small: true, days: 10, from: 1970, lane: true, icon: '🛂', needs: 'security', bulk: true,
    about: 'More passengers through security at once. Each lane costs every month.' },
  terminal2: { name: 'Terminal 2', price: 0, staff: 30 },
  terminal3: { name: 'The regional terminal', price: 0, staff: 8 },
  railStation: { name: 'The Arlanda Express stations', price: 0, staff: 4 },
  sorterHall: { name: 'The sorting hall', price: 0, staff: 2 },
  // session 5: chapters 5 and 6 — `rent`: SEK a month the airport earns from it (real estate), `booth`: a passport booth
  deicer: { name: 'De-icing truck', price: 2.5e6, staff: 2, small: true, days: 0, from: 1960, icon: '🧊', needs: 'deice', bulk: true,
    about: 'De-ices one departure at a time when it freezes.' },
  booth: { name: 'Passport booth', price: 1.5e6, staff: 0, small: true, days: 10, from: 2001, booth: true, icon: '🛃', needs: 'border', bulk: true,
    about: 'Shorter queues at passport control.' },
  offices: { name: 'Office building', price: 90e6, staff: 0, small: true, days: 60, from: 2000, rent: 0.75e6, icon: '🏢',
    about: 'Companies rent its floors: the same rent every month.' },
  hotelExt: { name: 'Hotel extension', price: 120e6, staff: 0, small: true, days: 60, from: 2000, rent: 1.0e6, icon: '🏨',
    about: 'More hotel rooms: the same rent every month.' },
  solar: { name: 'Solar park', price: 40e6, staff: 0, small: true, days: 50, from: 2008, icon: '☀️', max: 2, needs: 'green',
    about: 'Saves on the energy bill and raises the green rating.' },
  evehicles: { name: 'Electric apron vehicles', price: 35e6, staff: 0, small: true, days: 30, from: 2012, icon: '🔌', max: 1, needs: 'green',
    about: 'Electric tugs and buses on the apron: a better green rating.' },
  passportHall: { name: 'The passport hall', price: 0, staff: 2 },
  t2intl: { name: 'Terminal 2 for international flights', price: 0, staff: 4 },
  tower2: { name: 'The new control tower', price: 0, staff: 4 },
  pierF: { name: 'Pier F', price: 0, staff: 20 },
  jetBridges: { name: 'Jet bridges', price: 0, staff: 4 },
  runway3: { name: 'Runway 3', price: 0, staff: 4 },
  bridges: { name: 'The taxiway bridges', price: 0, staff: 2 },
  deicePad: { name: 'Remote de-icing pads', price: 0, staff: 2 },
  skyCity: { name: 'Sky City', price: 0, staff: 10, rent: 0.8e6 },
  hotel: { name: 'The Sky City hotel', price: 0, staff: 0, rent: 1.4e6 },
  cargoCity: { name: 'Cargo City', price: 0, staff: 6, rent: 2.2e6 },
  aquifer: { name: 'The aquifer energy store', price: 0, staff: 1 },
  codeF: { name: 'The A380 gate', price: 0, staff: 2 },
  overWing: { name: 'Over-the-wing boarding', price: 0, staff: 1 },
  // session 6: chapters 7 and 8 — a security operations centre against cyber attacks, the cargo apron's stands, the
  // future's chargers (a stand's charger, the mobile one), the hydrogen depot, the night train's platform
  cyberCentre: { name: 'Security operations centre', price: 30e6, staff: 6, small: true, days: 30, from: 2016, icon: '🛡️', max: 1,
    about: 'Stops most cyber attacks before they reach the systems.' },
  cargoStand: { name: 'Cargo stand', price: 6e6, staff: 0, small: true, days: 14, from: 2000, icon: '📦', max: 5, needs: 'cargo',
    // its places, nose east to Cargo City's halls (data/layout.js cargoApron); `max` is as many
    spots: [[905, 440], [905, 510], [905, 580], [905, 650], [905, 720]],
    about: 'A big stand by Cargo City, kept for the freighters.' },
  charger: { name: 'Charging stand', price: 8e6, staff: 0, small: true, days: 14, from: 2028, icon: '🔋', bulk: true,
    about: 'A stand near the terminal that charges electric aircraft by itself; a better green rating.' },
  mcharger: { name: 'Mobile charger', price: 2e6, staff: 1, small: true, days: 0, from: 2028, icon: '🚐', bulk: true,
    about: 'Charges one electric aircraft at a time at its stand.' },
  h2depot: { name: 'Hydrogen depot', price: 90e6, staff: 3, small: true, days: 40, from: 2033, icon: '🧪', max: 1,
    about: 'Hydrogen for the aircraft that fly on it: without it they cannot come.' },
  nightTrain: { name: 'Night train platform', price: 60e6, staff: 2, small: true, days: 45, from: 2030, rent: 0.9e6, icon: '🚄', max: 1,
    about: 'Sleeper trains to Europe: rent every month and a much better green rating.' },
  t4t5: { name: 'The link between Terminals 4 and 5', price: 0, staff: 2 },
  pier2040: { name: 'Your pier', price: 0, staff: 16 },
  greenPier: { name: 'The green pier\'s solar roof', price: 0, staff: 0 },
  pierArm: { name: 'The pier\'s second arm', price: 0, staff: 6 }
};

// the bar's buy menu (ui/buymenu.js): three categories, each a sheet of cards, and every small build in exactly one —
// Services earn from the passengers and the tenants, Vehicles work on the apron and the runways, Build adds room and
// equipment to the airport (stands, counters, power, safety). `key`: the key that opens it (5, 6, 7)
const BUY_MENU = [
  { id: 'services', icon: '🛍️', name: 'Services', key: 'Digit5',
    items: ['kiosk', 'cafe', 'restaurant', 'dutyFree', 'parkingSmall', 'parkingBig', 'busStop', 'offices', 'hotelExt', 'nightTrain'] },
  { id: 'vehicles', icon: '🚜', name: 'Vehicles', key: 'Digit6',
    items: ['fuelTruck', 'plough', 'deicer', 'crashTender', 'mcharger', 'evehicles'] },
  { id: 'build', icon: '🏗️', name: 'Build', key: 'Digit7',
    items: ['stand', 'desk', 'lane', 'booth', 'cargoStand', 'charger', 'generator', 'solar', 'cyberCentre', 'h2depot'] }
];
