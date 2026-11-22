'use strict';

// Arlanda Rising — the reference strategies of chapter 6 (sim/strategy.js describes the fields), into STRATEGIES.
// tools/missions-check.js plays them at every difficulty and balances the missions with them.

const OPEN6 = (stage, at, desks, lanes, booths) => [
  { stage, at, do: 'desks', n: desks }, { stage, at, do: 'act', fn: 'lanes', args: [lanes] }, { stage, at, do: 'act', fn: 'booths', args: [booths] }];

// Swedavia: the colours at once, the fees as they are; everything open for the morning
STRATEGIES['6-1'] = {
  tray: REACT_QUICK,
  choices: { colours: 'now', returnTarget: 'normal' },
  moves: OPEN6(1, '07:00', 34, 14, 8)
};

// The Ash Cloud: everything open before the closure, hotels and buses, the cafés open at night
STRATEGIES['6-2'] = {
  tray: REACT_QUICK,
  choices: { stranded: 'hotels', shops: 'open' },
  moves: OPEN6(0, '18:30', 34, 14, 8).concat(OPEN6(2, '07:00', 38, 16, 8))
};

// A Royal Wedding: the guests by the terminal (the remote row has room for one more stand only)
STRATEGIES['6-3'] = {
  tray: REACT_QUICK,
  choices: { guestStands: 'pier' },
  moves: OPEN6(1, '12:00', 34, 14, 8)
};

// Self Bag Drop: the bag drop with the desk staff kept
STRATEGIES['6-4'] = {
  tray: REACT_QUICK,
  moves: OPEN6(0, '06:00', 38, 16, 8).concat([{ stage: 1, at: 1, do: 'act', fn: 'upgrade', args: ['checkin', 'keep'] }]).concat(OPEN6(2, '06:00', 38, 16, 8))
};

// Emirates: 40 % off, to be sure
STRATEGIES['6-5'] = {
  tray: REACT_QUICK,
  choices: { emirates: 'forty' },
  moves: OPEN6(1, '13:00', 34, 14, 8)
};

// The Permit: no car park, no extra flights; a solar park and electric vehicles at once
STRATEGIES['6-6'] = {
  choices: { carPark: 'no', newRoutes: 'no' },
  moves: [{ stage: 0, at: 1, do: 'buy', kind: 'solar' }, { stage: 0, at: 1, do: 'buy', kind: 'evehicles' }]
};

// Nobel Week: the lounge and two more booths; everything open
STRATEGIES['6-7'] = {
  tray: REACT_QUICK,
  choices: { jets: 'lounge' },
  moves: OPEN6(1, '13:00', 34, 14, 10)
};

// Eurovision Week: four more lanes
STRATEGIES['6-8'] = {
  tray: REACT_QUICK,
  choices: { fans: 'lanes' },
  moves: OPEN6(1, '14:00', 38, 20, 8)
};

// Fly Green: 5 % biofuel, glycol recovery, a second solar park
STRATEGIES['6-9'] = {
  choices: { bio: 'five' },
  moves: [{ stage: 0, at: 1, do: 'act', fn: 'upgrade', args: ['deice', 'keep'] }, { stage: 0, at: 1, do: 'buy', kind: 'solar' }]
};

// A-CDM: put it in at once (with more IT people)
STRATEGIES['6-10'] = {
  tray: REACT_QUICK,
  moves: OPEN6(0, '06:30', 38, 16, 8).concat([{ stage: 1, at: 0, do: 'act', fn: 'hireIT', args: [4] }, { stage: 1, at: 0, do: 'act', fn: 'upgrade', args: ['stands', 'keep'] }])
    .concat(OPEN6(2, '06:30', 38, 16, 8))
};

// Exam: the A380 gate, the e-gates and six more lanes; everything open before each wave
STRATEGIES['6-11'] = {
  tray: REACT_QUICK,
  choices: { egates: 'yes' },
  moves: [{ stage: 0, at: 0, do: 'start', project: 'gateF', part: 'stand' }, { stage: 0, after: ['gateF', 'stand'], do: 'start', project: 'gateF', part: 'wing' },
    { stage: 0, at: 1, do: 'buy', kind: 'lane', n: 6 }]
    .concat(OPEN6(1, '06:00', 38, 24, 8)).concat(OPEN6(2, '15:00', 38, 24, 8))
};
