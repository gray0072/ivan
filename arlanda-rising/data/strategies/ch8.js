'use strict';

// Arlanda Rising — the reference strategies of chapter 8 (sim/strategy.js describes the fields), into STRATEGIES.
// tools/missions-check.js plays them at every difficulty and balances the missions with them.

const OPEN8 = (stage, at, desks, lanes, booths) => [
  { stage, at, do: 'desks', n: desks }, { stage, at, do: 'act', fn: 'lanes', args: [lanes] }, { stage, at, do: 'act', fn: 'booths', args: [booths] }];
const OVERTIME8 = (stage, at) => ['stands', 'turnaround', 'checkin', 'baggage', 'info', 'security'].map((d) => ({ stage, at, do: 'act', fn: 'overtime', args: [d] }));

// Electric Wings: a second mobile charger at once, then two charging stands
STRATEGIES['8-1'] = {
  tray: REACT_QUICK,
  choices: { chargers: 'stands' },
  moves: OPEN8(0, '07:00', 34, 20, 8).concat([{ stage: 0, at: '07:00', do: 'buy', kind: 'mcharger' }], OPEN8(2, '07:00', 34, 20, 8))
};

// Charging Stands: four chargers on the first day, twice the electric flights
STRATEGIES['8-2'] = {
  tray: REACT_QUICK,
  choices: { more: 'yes' },
  moves: [{ stage: 0, at: 0, do: 'buy', kind: 'charger', n: 4 }].concat(OPEN8(1, '07:00', 34, 20, 8))
};

// Robots on the Apron: the robots, with the ramp team kept as the fallback
STRATEGIES['8-3'] = {
  tray: REACT_QUICK,
  choices: { robots: 'keep' },
  moves: OPEN8(1, '07:00', 34, 20, 8)
};

// Self-driving Ploughs: bought; the drivers kept
STRATEGIES['8-4'] = {
  tray: REACT_QUICK,
  choices: { ploughs: 'yes' },
  moves: OPEN8(1, '06:00', 34, 20, 8)
};

// Hydrogen Morning: the depot
STRATEGIES['8-5'] = {
  tray: REACT_QUICK,
  choices: { h2: 'yes' },
  moves: OPEN8(1, '07:00', 34, 20, 8)
};

// Your Pier: the green pier, every stage at a fast pace
STRATEGIES['8-6'] = {
  choices: { design: 'green' },
  moves: [{ stage: 0, at: 1, do: 'start', project: 'pier2040', part: 'ground', pace: 'fast' },
    { stage: 0, after: ['pier2040', 'ground'], do: 'start', project: 'pier2040', part: 'hall', pace: 'fast' },
    { stage: 0, after: ['pier2040', 'hall'], do: 'start', project: 'pier2040', part: 'gates', pace: 'fast' },
    { stage: 1, after: ['pier2040', 'hall'], do: 'start', project: 'pier2040', part: 'gates', pace: 'fast' }]
};

// Faces as Boarding Passes: put in
STRATEGIES['8-7'] = {
  tray: REACT_QUICK,
  choices: { faces: 'yes' },
  moves: OPEN8(1, '13:00', 34, 20, 10)
};

// Heatwave 2040: the terminals cooled
STRATEGIES['8-8'] = {
  tray: REACT_QUICK,
  choices: { heat: 'cool' },
  moves: OPEN8(1, '13:00', 34, 20, 10)
};

// Night Train or Night Flight: the night train
STRATEGIES['8-9'] = {
  choices: { nights: 'train' }
};

// Peak Day 2040: four more lanes; everything open in both waves
STRATEGIES['8-10'] = {
  tray: REACT_QUICK,
  choices: { peak: 'lanes' },
  moves: OPEN8(1, '06:00', 38, 28, 10).concat(OPEN8(2, '15:00', 38, 28, 10))
};

// Final Exam: drills everywhere; everything open; in the blackout overtime for every team
STRATEGIES['8-11'] = {
  tray: REACT_QUICK,
  choices: { prepare: 'drills' },
  moves: OPEN8(1, '06:00', 38, 24, 10).concat(OPEN8(2, '11:00', 38, 24, 10), OVERTIME8(2, '11:05'))
};
