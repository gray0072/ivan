'use strict';

// Arlanda Rising — every kind of thing the airport owns, as plain data:
//   name     as shown
//   price    SEK to build or buy (its upkeep is UPKEEP_YEAR of it a year)
//   staff    full-time jobs it needs (STAFF_MONTH each a month)
//   small    can be bought during a mission (from the build toolbar), takes `days` in plan time and is there at
//            once in ops time
//   from     the first year it can be bought
//   shop     share of the full shop spend per passenger it brings (SHOP_SPEND; the shops add up to SHOP_MAX)
//   parking  share of the departing passengers' parking it can take (PARKING_PER_PAX; up to 1 in all)
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
  stand: { name: 'Remote stand', price: 4e6, staff: 0, small: true, days: 12, from: 1959 },
  fuelTruck: { name: 'Fuel truck', price: 1.2e6, staff: 2, small: true, days: 0, from: 1959 },
  plough: { name: 'Snowplough', price: 1.6e6, staff: 2, small: true, days: 0, from: 1959 },
  desk: { name: 'Check-in desk', price: 0.15e6, staff: 1, small: true, days: 2, from: 1960 },
  kiosk: { name: 'Kiosk', price: 0.6e6, staff: 0, small: true, days: 10, from: 1960, shop: 0.5 },
  cafe: { name: 'Café', price: 2.5e6, staff: 0, small: true, days: 25, from: 1960, shop: 1 },
  parkingSmall: { name: 'Car park (300 places)', price: 6e6, staff: 1, small: true, days: 20, from: 1960, parking: 0.4 },
  parkingBig: { name: 'Car park (1 200 places)', price: 18e6, staff: 3, small: true, days: 40, from: 1960, parking: 1 },
  // session 3: chapters 2 and 3
  crashTender: { name: 'Crash tender', price: 3.5e6, staff: 3, small: true, days: 30, from: 1963 },
  generator: { name: 'Backup generator', price: 6e6, staff: 1, small: true, days: 20, from: 1970 },
  dutyFree: { name: 'Duty-free shop', price: 30e6, staff: 0, small: true, days: 60, from: 1976, shop: 1.2 },
  restaurant: { name: 'Restaurant', price: 8e6, staff: 0, small: true, days: 40, from: 1965, shop: 0.6 },
  busStop: { name: 'Airport coach stops', price: 8e6, staff: 0, small: true, days: 30, from: 1989, bus: true },
  apron2: { name: 'The jet apron', price: 0, staff: 4 },
  runway2: { name: 'Runway 2', price: 0, staff: 4 },
  ils: { name: 'Instrument landing system', price: 0, staff: 2 },
  intlTerminal: { name: 'The international terminal', price: 0, staff: 40 },
  domTerminal: { name: 'The domestic terminal', price: 0, staff: 26 },
  bagHall: { name: 'The baggage hall', price: 0, staff: 2 },
  computerRoom: { name: 'The computer room', price: 0, staff: 0 },
  // session 4: chapter 4
  lane: { name: 'Security lane', price: 2.5e6, staff: 0, small: true, days: 10, from: 1970, lane: true },
  terminal2: { name: 'Terminal 2', price: 0, staff: 30 },
  railStation: { name: 'The Arlanda Express stations', price: 0, staff: 4 },
  sorterHall: { name: 'The sorting hall', price: 0, staff: 2 },
  // session 5: chapters 5 and 6 — `rent`: SEK a month the airport earns from it (real estate), `booth`: a passport booth
  deicer: { name: 'De-icing truck', price: 2.5e6, staff: 2, small: true, days: 0, from: 1960 },
  booth: { name: 'Passport booth', price: 1.5e6, staff: 0, small: true, days: 10, from: 2001, booth: true },
  offices: { name: 'Office building', price: 90e6, staff: 0, small: true, days: 60, from: 2000, rent: 0.75e6 },
  hotelExt: { name: 'Hotel extension', price: 120e6, staff: 0, small: true, days: 60, from: 2000, rent: 1.0e6 },
  solar: { name: 'Solar park', price: 40e6, staff: 0, small: true, days: 50, from: 2008 },
  evehicles: { name: 'Electric apron vehicles', price: 35e6, staff: 0, small: true, days: 30, from: 2012 },
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
  cyberCentre: { name: 'Security operations centre', price: 30e6, staff: 6, small: true, days: 30, from: 2016 },
  cargoStand: { name: 'Cargo stand', price: 6e6, staff: 0, small: true, days: 14, from: 2000, spots: [[1185, 520], [1245, 520], [1305, 520], [1365, 520]] },
  charger: { name: 'Charging stand', price: 8e6, staff: 0, small: true, days: 14, from: 2028 },
  mcharger: { name: 'Mobile charger', price: 2e6, staff: 1, small: true, days: 0, from: 2028 },
  h2depot: { name: 'Hydrogen depot', price: 90e6, staff: 3, small: true, days: 40, from: 2033 },
  nightTrain: { name: 'Night train platform', price: 60e6, staff: 2, small: true, days: 45, from: 2030, rent: 0.9e6 },
  t4t5: { name: 'The link between Terminals 4 and 5', price: 0, staff: 2 },
  pier2040: { name: 'Your pier', price: 0, staff: 16 },
  greenPier: { name: 'The green pier\'s solar roof', price: 0, staff: 0 },
  pierArm: { name: 'The pier\'s second arm', price: 0, staff: 6 }
};
