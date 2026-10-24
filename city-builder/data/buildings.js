'use strict';

// City Builder — the buildings and the tools of the toolbar, as plain data. Read by sim/build.js
// (prices, sizes, where they may stand), sim/city.js (jobs, upkeep, effects on the houses),
// sim/disasters.js (what burns, the fire stations' cover) and ui/toolbar.js (order, keys, names).
//   w, h      footprint in tiles (h runs along the map's y)
//   price     $ to build; upkeep $ a month
//   jobs      workers it employs
//   effect    { radius (tiles), happy (points for the houses in it) } — one per kind counts
//   cover     a fire station's reach, tiles
//   unlock    the milestone (data/milestones.js) that makes it available
//   burns     can catch fire; shore: only on a land tile next to water
//   key       the keyboard shortcut; desc: the toolbar tooltip and the info panel

const BUILDINGS = {
  house: {
    name: 'House', w: 1, h: 1, price: 100, upkeep: 0, unlock: 0, burns: true, key: 'h',
    desc: 'Home for residents. Grows into a bigger house and an apartment block when its people are happy.'
  },
  shop: {
    name: 'Shop', w: 1, h: 1, price: 250, upkeep: 0, jobs: 8, unlock: 0, burns: true, key: 's',
    effect: { radius: 6, happy: 10 },
    desc: 'Gives jobs. Houses nearby are happier.'
  },
  factory: {
    name: 'Factory', w: 2, h: 2, price: 400, upkeep: 0, jobs: 30, unlock: 0, burns: true, key: 'f',
    effect: { radius: 4, happy: -25 },
    desc: 'Gives many jobs, but its smoke makes houses nearby unhappy.'
  },
  park: {
    name: 'Park', w: 1, h: 1, price: 150, upkeep: 5, unlock: 0, key: 'p',
    effect: { radius: 4, happy: 15 },
    desc: 'Houses nearby are happier.'
  },
  fireStation: {
    name: 'Fire Station', w: 2, h: 2, price: 1000, upkeep: 50, jobs: 10, unlock: 1, burns: true, key: 'e',
    cover: 8,
    desc: 'Its fire truck puts out fires nearby. Houses in its cover feel safer.'
  },
  embankment: {
    name: 'Embankment', w: 1, h: 1, price: 50, upkeep: 1, unlock: 1, shore: true, key: 'k',
    desc: 'A wall on the shore: a flood does not get past it.'
  },
  school: {
    name: 'School', w: 2, h: 2, price: 1500, upkeep: 80, jobs: 20, unlock: 2, burns: true, key: 'c',
    effect: { radius: 8, happy: 10 },
    desc: 'Houses nearby can grow into apartment blocks.'
  },
  stadium: {
    name: 'Stadium', w: 3, h: 3, price: 5000, upkeep: 150, jobs: 30, unlock: 3, burns: true, key: 'm',
    effect: { radius: 10, happy: 15 },
    desc: 'Football matches! A big happiness bonus for a large area.'
  },
  airport: {
    name: 'Airport', w: 4, h: 8, price: 20000, upkeep: 300, jobs: 150, unlock: 4, burns: true, key: 'a',
    effect: { radius: 6, happy: -15 },
    arrivals: 2,
    desc: 'Planes bring more new residents every month — but they are loud.'
  }
};

// the toolbar, left to right; 'road' and 'bulldoze' are tools, not buildings
const TOOLS = ['road', 'house', 'shop', 'factory', 'park', 'fireStation', 'embankment', 'school', 'stadium', 'airport', 'bulldoze'];
const TOOL_INFO = {
  road: { name: 'Road', key: 'r', unlock: 0, desc: 'Drag to draw a road. Every building needs one. Over water it is a bridge.' },
  bulldoze: { name: 'Bulldozer', key: 'b', unlock: 0, desc: 'Removes buildings, roads, ruins and trees.' }
};
// tools drawn as a line from where the drag starts to where it ends
const LINE_TOOLS = ['road', 'embankment', 'bulldoze'];

// how a house of each level is called in the info panel
const HOUSE_LEVEL_NAMES = ['', 'Cottage', 'House', 'Apartment block'];
