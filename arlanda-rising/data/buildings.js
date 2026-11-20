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
  sorterHall: { name: 'The sorting hall', price: 0, staff: 2 }
};
