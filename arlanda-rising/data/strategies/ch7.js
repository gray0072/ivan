'use strict';

// Arlanda Rising — the reference strategies of chapter 7 (sim/strategy.js describes the fields), into STRATEGIES.
// tools/missions-check.js plays them at every difficulty and balances the missions with them.

const OPEN7 = (stage, at, desks, lanes, booths) => [
  { stage, at, do: 'desks', n: desks }, { stage, at, do: 'act', fn: 'lanes', args: [lanes] }, { stage, at, do: 'act', fn: 'booths', args: [booths] }];

// Empty Skies: everything open for the last evening; then Terminals 2 and 4 closed and rent relief for the shops
STRATEGIES['7-1'] = {
  tray: REACT_QUICK,
  choices: { terminals: 'both', shops: 'relief' },
  moves: OPEN7(0, '16:00', 34, 16, 8)
};

// Furlough or Lay Off: seven in ten on furlough
STRATEGIES['7-2'] = {
  choices: { staff: 'furlough' }
};

// Cargo Saves the Day: two cargo stands, then the night of freighters
STRATEGIES['7-3'] = {
  tray: REACT_QUICK,
  choices: { cargo: 'apron' },
  moves: OPEN7(1, '20:00', 10, 4, 2)
};

// Coming Back: Terminal 2 open again for the winter, every team recruited at once
STRATEGIES['7-4'] = {
  tray: REACT_QUICK,
  choices: { reopen: 'now', hire: 'now' },
  moves: OPEN7(1, '06:00', 30, 16, 8)
};

// Closed Skies: everything open; the slots to Finnair
STRATEGIES['7-5'] = {
  tray: REACT_QUICK,
  choices: { slots: 'finnair' },
  moves: OPEN7(0, '07:00', 30, 16, 8)
};

// Clearance Takes Weeks: recruit on the first day
STRATEGIES['7-6'] = {
  tray: REACT_QUICK,
  choices: { recruit: 'now' },
  moves: OPEN7(1, '06:00', 34, 20, 8)
};

// One Terminal: the tunnel at a fast pace, then its gates; Terminal 4 open again
STRATEGIES['7-7'] = {
  tray: REACT_QUICK,
  choices: { reopen4: 'now' },
  moves: [{ stage: 0, at: 0, do: 'start', project: 't4t5', part: 'tunnel', pace: 'fast' }, { stage: 0, after: ['t4t5', 'tunnel'], do: 'start', project: 't4t5', part: 'gates', pace: 'fast' }]
    .concat(OPEN7(1, '06:00', 34, 20, 8))
};

// The Summer of Queues: the second security company, temps for security, overtime on both days
STRATEGIES['7-8'] = {
  tray: REACT_QUICK,
  choices: { second: 'yes' },
  moves: [{ stage: 0, at: 0, do: 'act', fn: 'temps', args: ['security'] }]
    .concat(OPEN7(1, '05:30', 38, 20, 8), [{ stage: 1, at: '05:30', do: 'act', fn: 'overtime', args: ['security'] }])
    .concat(OPEN7(2, '13:00', 38, 20, 8), [{ stage: 2, at: '13:00', do: 'act', fn: 'overtime', args: ['security'] }])
};

// Cyber Morning: the security operations centre
STRATEGIES['7-9'] = {
  tray: REACT_QUICK,
  choices: { soc: 'centre' },
  moves: OPEN7(1, '06:30', 34, 20, 8)
};

// Fallback Drill: drills everywhere, then the test with everything open
STRATEGIES['7-10'] = {
  tray: REACT_QUICK,
  choices: { drill: 'yes' },
  moves: OPEN7(1, '06:30', 38, 20, 8)
};

// Exam: drills before the summer; everything open, overtime for the teams that stand in for the systems
const OVERTIME7 = (stage, at) => ['stands', 'checkin', 'baggage', 'info', 'security'].map((d) => ({ stage, at, do: 'act', fn: 'overtime', args: [d] }));
STRATEGIES['7-11'] = {
  tray: REACT_QUICK,
  choices: { prep: 'drills' },
  moves: OPEN7(1, '06:00', 38, 20, 8).concat(OVERTIME7(1, '06:00'), OPEN7(2, '14:00', 38, 20, 8))
};
