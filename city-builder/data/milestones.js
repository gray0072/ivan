'use strict';

// City Builder — the city's titles as it grows. Read by sim/city.js (when a title is reached),
// sim/build.js (what is unlocked: a building's `unlock` is an index here), the HUD, the milestone
// dialog and the records (core/storage.js keeps the best time to each one, keyed by `id`).

const MILESTONES = [
  { id: 'hamlet',     name: 'Hamlet',     pop: 0,    icon: '🏡' },
  { id: 'village',    name: 'Village',    pop: 50,   icon: '🏘️' },
  { id: 'town',       name: 'Town',       pop: 250,  icon: '🏙️' },
  { id: 'city',       name: 'City',       pop: 1000, icon: '🌆' },
  { id: 'metropolis', name: 'Metropolis', pop: 3000, icon: '🌃' }
];

// a new city is called one of these (a place name: the same in every language)
const CITY_NAMES = ['Riverside', 'Greenfield', 'Oakwood', 'Brookhaven', 'Pinehill', 'Lakeview', 'Stonebridge',
  'Willowby', 'Fairmont', 'Elmstead', 'Sunnyvale', 'Maple Bay', 'Cedar Falls', 'Silverton', 'Ashford', 'Birchwood'];
