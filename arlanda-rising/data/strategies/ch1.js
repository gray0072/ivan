'use strict';

// Arlanda Rising — the reference strategies of chapter 1: one good way to play each mission, run by
// sim/strategy.js (see there for the fields), into STRATEGIES (data/strategies/strategies.js). tools/missions-check.js plays them at every difficulty and
// balances the missions with them; hint 3 shows their main moves.


// Clear the Forest: strip and bog at once; the road as soon as the bog is drained (before the winter);
// the apron in the second stage; sell the timber, keep the trees toward Märsta, everything at a normal pace
STRATEGIES['1-1'] = {
  choices: { timber: 'sell', treeBelt: 'keep' },
  moves: [
    { stage: 0, at: 0, do: 'borrow', sum: 20e6 },
    { stage: 0, at: 0, do: 'start', project: 'site', part: 'strip' },
    { stage: 0, at: 0, do: 'start', project: 'site', part: 'drain' },
    { stage: 0, after: ['site', 'drain'], do: 'start', project: 'site', part: 'road' },
    { stage: 1, at: 0, do: 'start', project: 'site', part: 'apron' },
    { stage: 1, at: 0, do: 'start', project: 'site', part: 'road' }
  ]
};

// First Wheels: every stand picked quickly
STRATEGIES['1-2'] = { tray: REACT_QUICK };

// The Tower: heated tents (cheaper than a fast pace in January) and the backup radio; then the stages in turn
STRATEGIES['1-3'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: 0, do: 'borrow', sum: 10e6 },
    { stage: 0, at: 0, do: 'mod', project: 'tower1', mod: 'tents' },
    { stage: 0, at: 0, do: 'start', project: 'tower1', part: 'found' },
    { stage: 0, after: ['tower1', 'found'], do: 'start', project: 'tower1', part: 'shaft' },
    { stage: 1, at: 0, do: 'mod', project: 'tower1', mod: 'backupRadio' },
    { stage: 1, at: 0, do: 'start', project: 'tower1', part: 'cab' },
    { stage: 1, after: ['tower1', 'cab'], do: 'start', project: 'tower1', part: 'radio' }
  ]
};

// The First Terminal: one crew; the hall, then the fire station, then the waiting room at a fast pace, the desks and
// the kiosk
STRATEGIES['1-4'] = {
  tray: REACT_QUICK,
  choices: { secondCrew: 'one' },
  moves: [
    { stage: 0, at: 0, do: 'start', project: 'terminal1', part: 'hall' },
    { stage: 0, after: ['terminal1', 'hall'], do: 'start', project: 'fireStation', part: 'station' },
    { stage: 1, at: 0, do: 'start', project: 'terminal1', part: 'waiting', pace: 'fast' },
    { stage: 1, after: ['terminal1', 'waiting'], do: 'start', project: 'terminal1', part: 'desks' },
    { stage: 1, after: ['terminal1', 'desks'], do: 'start', project: 'terminal1', part: 'kiosk' },
    { stage: 2, at: '08:00', do: 'desks', n: 2 }
  ]
};

// The First Jets: two desks from the start, the tray done quickly
STRATEGIES['1-5'] = {
  tray: REACT_QUICK,
  moves: [{ stage: 0, at: '07:00', do: 'desks', n: 2 }, { stage: 1, at: '15:00', do: 'desks', n: 2 }]
};

// The Fuel Truck: a second truck at once
STRATEGIES['1-6'] = { tray: REACT_QUICK, moves: [{ stage: 0, at: '07:00', do: 'buy', kind: 'fuelTruck' }] };

// First Snow: a full convoy of four ploughs before the snow
STRATEGIES['1-7'] = { tray: REACT_QUICK, moves: [{ stage: 0, at: 0, do: 'buy', kind: 'plough', n: 4 }] };

// Make It Pay: higher fees for a while, a café, the charters; no car park (it pays back only in years)
STRATEGIES['1-8'] = {
  choices: { cafe: 'cafe', charter: 'yes', parking: 'no' },
  moves: [{ stage: 0, at: 0, do: 'borrow', sum: 5e6 }, { stage: 0, at: 0, do: 'fees', level: 'high' }, { stage: 2, at: 0, do: 'fees', level: 'normal' }]
};

// Night Lights: edge and approach lights at once; at night the calm wind lets runway 01 be used
STRATEGIES['1-9'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: 0, do: 'start', project: 'lights1', part: 'cables' },
    { stage: 0, after: ['lights1', 'cables'], do: 'start', project: 'lights1', part: 'lamps' },
    { stage: 0, after: ['lights1', 'cables'], do: 'start', project: 'lights1', part: 'approach' },
    { stage: 2, at: '20:30', do: 'dir', dir: '01' }
  ]
};

// Opening Day: a remote stand for the ceremony, two desks
STRATEGIES['1-10'] = {
  tray: REACT_QUICK,
  moves: [{ stage: 0, at: '07:00', do: 'buy', kind: 'stand' }, { stage: 0, at: '07:00', do: 'desks', n: 3 }, { stage: 1, at: '11:00', do: 'desks', n: 3 }]
};

// Exam: a full convoy of ploughs, a remote stand, three desks
STRATEGIES['1-11'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: '07:00', do: 'buy', kind: 'plough', n: 2 },
    { stage: 0, at: '07:00', do: 'buy', kind: 'stand' },
    { stage: 0, at: '07:00', do: 'desks', n: 3 },
    { stage: 1, at: '11:00', do: 'desks', n: 3 },
    { stage: 2, at: '14:30', do: 'desks', n: 3 }
  ]
};
