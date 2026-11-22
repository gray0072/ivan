'use strict';

// Arlanda Rising — the reference strategies of chapter 2 (sim/strategy.js describes the fields), into STRATEGIES.
// tools/missions-check.js plays them at every difficulty and balances the missions with them.

// Room for the Jets: a loan, the apron at a normal pace, the earth hauled away
STRATEGIES['2-1'] = {
  tray: REACT_QUICK,
  choices: { spoil: 'haul' },
  moves: [
    { stage: 0, at: 0, do: 'borrow', sum: 30e6 },
    { stage: 0, at: 0, do: 'start', project: 'apron2', part: 'pave' },
    { stage: 0, at: 0, do: 'buy', kind: 'desk', n: 2 },
    { stage: 1, at: '07:00', do: 'desks', n: 6 }
  ]
};

// Charter Summer: both charters and two more desks
STRATEGIES['2-2'] = {
  tray: REACT_QUICK,
  choices: { charter: 'both', desks: 'two' },
  moves: [{ stage: 1, at: '06:00', do: 'desks', n: 6 }]
};

// Hire a Hand: all three teams at once
STRATEGIES['2-3'] = {
  tray: REACT_QUICK,
  choices: { firstTeam: 'stands' },
  moves: [
    { stage: 0, at: 3, do: 'act', fn: 'hire', args: ['turnaround'] },
    { stage: 0, at: 3, do: 'act', fn: 'hire', args: ['checkin'] },
    { stage: 1, at: '07:00', do: 'desks', n: 6 }
  ]
};

// Two Managers: Karin Ek, and Bo Lindqvist with a snow team
STRATEGIES['2-4'] = {
  tray: REACT_QUICK,
  choices: { opsHead: 'karin', snowChief: 'bo' },
  moves: [{ stage: 1, at: '07:00', do: 'desks', n: 4 }]
};

// Jumbo!: the big stand, the discount, two more desks and two more fuel trucks
STRATEGIES['2-5'] = {
  tray: REACT_QUICK,
  choices: { jumboFee: 'yes' },
  moves: [
    { stage: 0, at: 0, do: 'start', project: 'apron2', part: 'bigStand' },
    { stage: 0, at: 0, do: 'buy', kind: 'desk', n: 2 },
    { stage: 0, at: 0, do: 'buy', kind: 'fuelTruck', n: 2 },
    { stage: 1, at: '10:00', do: 'desks', n: 8 }
  ]
};

// Fire Category: two crash tenders, the drill
STRATEGIES['2-6'] = {
  tray: REACT_QUICK,
  choices: { drill: 'yes' },
  moves: [
    { stage: 0, at: 0, do: 'buy', kind: 'crashTender', n: 2 },
    { stage: 1, at: '08:00', do: 'desks', n: 6 }
  ]
};

// The Wage Round: a counter-offer the union takes
STRATEGIES['2-7'] = {
  tray: REACT_QUICK,
  choices: { wage: 'counter45' },
  moves: [{ stage: 1, at: '07:00', do: 'desks', n: 6 }]
};

// The Bag Belt: the bags by hand, then the hall, the belts bought straight away and the handlers hired beside them as
// the fallback for the jam
STRATEGIES['2-8'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: '07:00', do: 'desks', n: 5 },
    { stage: 1, at: 0, do: 'start', project: 'bagHall', part: 'hall' },
    { stage: 1, after: ['bagHall', 'hall'], do: 'act', fn: 'system', args: ['baggage'] },
    { stage: 1, after: ['bagHall', 'hall'], do: 'act', fn: 'hireBack', args: ['baggage'] },
    { stage: 2, at: '15:00', do: 'desks', n: 6 }
  ]
};

// Fog Morning: the ILS, the course
STRATEGIES['2-9'] = {
  tray: REACT_QUICK,
  choices: { lvp: 'yes' },
  moves: [
    { stage: 0, at: 0, do: 'start', project: 'ils1', part: 'antennas' },
    { stage: 0, after: ['ils1', 'antennas'], do: 'start', project: 'ils1', part: 'calibrate' },
    { stage: 1, at: '06:00', do: 'desks', n: 5 }
  ]
};

// Crosswind: the owner's grant, runway 2 at a normal pace, the cranes spared
STRATEGIES['2-10'] = {
  tray: REACT_QUICK,
  choices: { forest: 'spare' },
  moves: [
    { stage: 0, at: 0, do: 'finance', project: 'runway2', how: 'grant' },
    { stage: 0, at: 0, do: 'borrow', sum: 100e6 },
    { stage: 0, at: 0, do: 'start', project: 'runway2', part: 'strip' },
    { stage: 0, after: ['runway2', 'strip'], do: 'start', project: 'runway2', part: 'pave' },
    { stage: 0, after: ['runway2', 'pave'], do: 'start', project: 'runway2', part: 'lights' },
    { stage: 1, at: '07:00', do: 'desks', n: 5 }
  ]
};

// Exam: the terminal on a loan, more desks, the restaurant
STRATEGIES['2-11'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: 0, do: 'borrow', sum: 200e6 },
    { stage: 0, at: 0, do: 'start', project: 'intlTerminal', part: 'frame' },
    { stage: 0, after: ['intlTerminal', 'frame'], do: 'start', project: 'intlTerminal', part: 'hall' },
    { stage: 0, after: ['intlTerminal', 'frame'], do: 'start', project: 'intlTerminal', part: 'pier' },
    { stage: 1, at: '07:00', do: 'buy', kind: 'fuelTruck', n: 2 },
    { stage: 1, at: '07:00', do: 'desks', n: 12 },
    { stage: 2, at: '16:00', do: 'desks', n: 12 }
  ]
};
