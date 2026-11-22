'use strict';

// Arlanda Rising — the reference strategies of chapter 5 (sim/strategy.js describes the fields), into STRATEGIES.
// tools/missions-check.js plays them at every difficulty and balances the missions with them.

// Schengen: the new floor, then the booths; the police's planner opens them; every booth open for the evening
STRATEGIES['5-1'] = {
  tray: REACT_QUICK,
  choices: { borderTeam: 'police' },
  moves: [
    { stage: 0, at: 0, do: 'mod', project: 'schengen', mod: 'tents' },
    { stage: 0, at: 0, do: 'start', project: 'schengen', part: 'level' },
    { stage: 0, after: ['schengen', 'level'], do: 'start', project: 'schengen', part: 'booths' },
    { stage: 1, at: '16:00', do: 'desks', n: 30 },
    { stage: 1, at: '16:00', do: 'act', fn: 'booths', args: [6] }
  ]
};

// The New Tower: the systems and the desks at a fast pace, lower fees for the hard autumn
STRATEGIES['5-2'] = {
  tray: REACT_QUICK,
  choices: { after911: 'low' },
  moves: [
    { stage: 0, at: 0, do: 'start', project: 'tower2', part: 'systems', pace: 'fast' },
    { stage: 0, after: ['tower2', 'systems'], do: 'start', project: 'tower2', part: 'desks', pace: 'fast' },
    { stage: 0, after: ['tower2', 'desks'], do: 'start', project: 'tower2', part: 'training' },
    { stage: 0, after: ['tower2', 'training'], do: 'start', project: 'tower2', part: 'move' },
    { stage: 1, at: '07:00', do: 'desks', n: 30 }
  ]
};

// Pier F: heated tents, the gates and the apron at once, then the jet bridges
STRATEGIES['5-3'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: 0, do: 'mod', project: 'pierF', mod: 'tents' },
    { stage: 0, at: 0, do: 'start', project: 'pierF', part: 'gates' },
    { stage: 0, at: 0, do: 'start', project: 'pierF', part: 'apron' },
    { stage: 0, after: ['pierF', 'gates'], do: 'start', project: 'pierF', part: 'bridges' },
    { stage: 1, at: '10:00', do: 'desks', n: 30 },
    { stage: 1, at: '10:00', do: 'act', fn: 'booths', args: [6] }
  ]
};

// Runway Three: the owner's grant, the paving at a fast pace before the winter, quieter windows in Upplands Väsby
STRATEGIES['5-4'] = {
  choices: { vasby: 'insulate' },
  moves: [
    { stage: 0, at: 0, do: 'finance', project: 'runway3', how: 'grant' },
    { stage: 0, at: 0, do: 'start', project: 'runway3', part: 'strip', pace: 'fast' },
    { stage: 0, after: ['runway3', 'strip'], do: 'start', project: 'runway3', part: 'pave' },
    { stage: 0, after: ['runway3', 'pave'], do: 'start', project: 'runway3', part: 'lights' }
  ]
};

// Security After 2001: lanes opened at once, a team hired on the second day (its clearance takes six weeks), Leila Nordin
STRATEGIES['5-5'] = {
  tray: REACT_QUICK,
  choices: { secTeam: 'yes', secHead: 'leila' },
  moves: [
    { stage: 0, at: '06:30', do: 'desks', n: 30 },
    { stage: 0, at: '06:30', do: 'act', fn: 'lanes', args: [12] },
    { stage: 2, at: '06:30', do: 'desks', n: 30 },
    { stage: 2, at: '06:30', do: 'act', fn: 'lanes', args: [12] }
  ]
};

// Taxiway Bridges: heated tents, both bridges at once, then the taxiways; the lanes open on the morning
STRATEGIES['5-6'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: 0, do: 'mod', project: 'bridges', mod: 'tents' },
    { stage: 0, at: 0, do: 'start', project: 'bridges', part: 'road' },
    { stage: 0, at: 0, do: 'start', project: 'bridges', part: 'rail' },
    { stage: 0, after: ['bridges', 'road'], do: 'start', project: 'bridges', part: 'taxi' },
    { stage: 1, at: '07:00', do: 'desks', n: 30 },
    { stage: 1, at: '07:00', do: 'act', fn: 'lanes', args: [10] }
  ]
};

// Norwegian Arrives: 30 % off for Norwegian; a drill for the stand planning before the morning (on Hard its failure
// would make the quick turns late)
STRATEGIES['5-7'] = {
  tray: REACT_QUICK,
  choices: { norwegian: 'yes' },
  moves: [{ stage: 0, at: 5, do: 'act', fn: 'drill', args: ['stands'] },
    { stage: 1, at: '06:30', do: 'desks', n: 30 }, { stage: 1, at: '06:30', do: 'act', fn: 'lanes', args: [10] }]
};

// Remote De-icing: the trucks by hand (and one more), then the crew hired at once (its clearance) and the pads with tents,
// then the pads' system once both are ready
STRATEGIES['5-8'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: '06:30', do: 'desks', n: 30 },
    { stage: 0, at: '06:30', do: 'act', fn: 'lanes', args: [10] },
    { stage: 0, at: '06:30', do: 'buy', kind: 'deicer', n: 2 },
    { stage: 1, at: 0, do: 'act', fn: 'hire', args: ['deice'] },
    { stage: 1, at: 0, do: 'mod', project: 'deicePads', mod: 'tents' },
    { stage: 1, at: 0, do: 'start', project: 'deicePads', part: 'south' },
    { stage: 1, at: 0, do: 'start', project: 'deicePads', part: 'r3' },
    { stage: 1, after: ['deicePads', 'south'], do: 'start', project: 'deicePads', part: 'drains' },
    { stage: 1, at: 1, do: 'act', fn: 'upgrade', args: ['deice', 'keep'] },
    { stage: 2, at: '06:30', do: 'desks', n: 30 },
    { stage: 2, at: '06:30', do: 'act', fn: 'lanes', args: [10] }
  ]
};

// Rent Is Steady: Cargo City with its offices, the hotel's new wing, O'Learys in Sky City
STRATEGIES['5-9'] = {
  choices: { hotelExt: 'yes', skyShop: 'olearys' },
  moves: [
    { stage: 0, at: 0, do: 'start', project: 'cargoCity', part: 'halls' },
    { stage: 0, after: ['cargoCity', 'halls'], do: 'start', project: 'cargoCity', part: 'offices' }
  ]
};

// Liquids in Bags: every lane open on the first morning, then queue sensors (the team kept) and two more lanes
STRATEGIES['5-10'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: '06:30', do: 'desks', n: 30 },
    { stage: 0, at: '06:30', do: 'act', fn: 'lanes', args: [12] },
    { stage: 1, at: 1, do: 'act', fn: 'upgrade', args: ['security', 'keep'] },
    { stage: 1, at: 1, do: 'buy', kind: 'lane', n: 4 },
    { stage: 2, at: '06:30', do: 'desks', n: 30 },
    { stage: 2, at: '06:30', do: 'act', fn: 'lanes', args: [16] }
  ]
};

// Exam: the desks, every lane and booth open before each wave
STRATEGIES['5-11'] = {
  tray: REACT_QUICK,
  moves: [0, 1, 2].map((stage) => ({ stage, at: 0, do: 'desks', n: 30 }))
    .concat([0, 1, 2].map((stage) => ({ stage, at: 0, do: 'act', fn: 'lanes', args: [14] })))
    .concat([0, 1, 2].map((stage) => ({ stage, at: 0, do: 'act', fn: 'booths', args: [8] })))
};
