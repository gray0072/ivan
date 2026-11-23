'use strict';

// Arlanda Rising — the data of Free Play (spec/freeplay.md): the airport from the forest of 1958 on, with no missions and
// no stages, its history told by the campaign's missions as milestones (sim/free.js). How many played months each
// chapter's years take at least (FREE_CHAPTER_MONTHS) and which fields of a mission's setup are history — what the world
// around the airport does — rather than the owner's gifts to a mission (FREE_HISTORY_KEYS). The minutes each type stays on
// the ground (FREE_TURN). The shape of a played day (FREE_WAVES): how the arrivals of each kind of airline spread over the
// hours. The month's climate at Arlanda (FREE_CLIMATE) for the played day's weather. The airline kinds whose late
// arrivals stay the night (FREE_NIGHTSTOP_KINDS).

// played months the years of each chapter take at least (index 0 = chapter 1): the history's year runs from a chapter's
// first mission to the next chapter's first at this pace — and waits for what the next milestone needs built
const FREE_CHAPTER_MONTHS = [18, 10, 8, 9, 10, 8, 6, 8];

// the fields of a mission's setup (data/missions) that Free Play applies when the history reaches that mission: the
// owner's budget and loan room, the airport opened, the airlines' routes of the year, the levels the Office may buy and
// the domains opened, the rules of the time (open skies, the shops' units, Schengen, security, random events, the owner's
// name, the green rating, the permit, the demand of the storm years, cyber attacks), the terminals the airlines use, the
// rivals, the train's deal, and the security lanes and passport booths the state provides. Not history: the owner's
// vehicles, desks, teams, IT people and heads, the money topped up, the strikes, the leavers, the chargers — the player
// buys and hires those
const FREE_HISTORY_KEYS = ['budget', 'loanLimit', 'open', 'airlines', 'unlock', 'opens', 'openSkies', 'units', 'lanes', 'booths', 'terms', 'trainDeal',
  'rivals', 'secRule', 'events', 'owner', 'green', 'permit', 'demand', 'cyber'];

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
