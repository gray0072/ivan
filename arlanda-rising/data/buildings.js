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
  parkingBig: { name: 'Car park (1 200 places)', price: 18e6, staff: 3, small: true, days: 40, from: 1960, parking: 1 }
};
