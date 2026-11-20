'use strict';

// Arlanda Rising — the reference strategies of chapter 4 (sim/strategy.js describes the fields), into STRATEGIES.
// tools/missions-check.js plays them at every difficulty and balances the missions with them.

// Terminal 2: SAS domestic moves in; brands in the international and domestic terminals at once, then in Terminal 2
STRATEGIES['4-1'] = {
  tray: REACT_QUICK,
  choices: { whoT2: 'sas' },
  moves: [
    { stage: 0, at: 0, do: 'start', project: 'terminal2', part: 'hall' },
    { stage: 0, at: 0, do: 'start', project: 'terminal2', part: 'gates' },
    { stage: 0, after: ['terminal2', 'hall'], do: 'start', project: 'terminal2', part: 'desks' },
    { stage: 0, at: 0, do: 'act', fn: 'brand', args: ['intl0', 'olearys'] },
    { stage: 0, at: 0, do: 'act', fn: 'brand', args: ['intl1', 'mcdonalds'] },
    { stage: 0, at: 0, do: 'act', fn: 'brand', args: ['intl4', 'pressbyran'] },
    { stage: 0, at: 0, do: 'act', fn: 'brand', args: ['dom0', 'max'] },
    { stage: 0, at: 0, do: 'act', fn: 'brand', args: ['dom2', 'pressbyran'] },
    { stage: 0, after: ['terminal2', 'desks'], do: 'act', fn: 'brand', args: ['t20', 'olearys'] },
    { stage: 0, after: ['terminal2', 'desks'], do: 'act', fn: 'brand', args: ['t21', 'max'] },
    { stage: 0, after: ['terminal2', 'desks'], do: 'act', fn: 'brand', args: ['t23', 'pressbyran'] },
    { stage: 1, at: '06:30', do: 'desks', n: 30 }
  ]
};

// Deregulation: Transwede with a quarter off, the fees as they are
STRATEGIES['4-2'] = {
  tray: REACT_QUICK,
  choices: { transwede: 'yes', fees: 'normal' },
  moves: [{ stage: 1, at: '06:30', do: 'desks', n: 30 }]
};

// The Train Question: a concession, and no car park before the train
STRATEGIES['4-3'] = {
  choices: { trainDeal: 'concession', carPark: 'no' },
  moves: [
    { stage: 0, at: 1, do: 'act', fn: 'brand', args: ['dom1', 'gateau'] },
    { stage: 0, at: 1, do: 'act', fn: 'brand', args: ['intl2', 'clas'] }
  ]
};

// Duty Free: three lanes bought at once when two are closed (and not every desk open: the queue would only move to
// security), more lanes in spring, duty free, the international shops
STRATEGIES['4-4'] = {
  tray: REACT_QUICK,
  choices: { dutyFree: 'yes' },
  moves: [
    { stage: 0, at: '15:00', do: 'desks', n: 20 },
    { stage: 0, at: '15:00', do: 'buy', kind: 'lane', n: 3 },
    { stage: 1, at: 1, do: 'buy', kind: 'lane', n: 2 },
    { stage: 1, at: 1, do: 'act', fn: 'brand', args: ['intl5', 'designhouse'] },
    { stage: 1, at: 1, do: 'act', fn: 'brand', args: ['intl3', 'svensktenn'] },
    { stage: 2, at: '15:00', do: 'desks', n: 36 }
  ]
};

// Building the Tunnel: the tunnel and the line at once, then both stations; a temporary car park
STRATEGIES['4-5'] = {
  choices: { works: 'temporary' },
  moves: [
    { stage: 0, at: 0, do: 'start', project: 'arlandaExpress', part: 'tunnel' },
    { stage: 0, at: 0, do: 'start', project: 'arlandaExpress', part: 'line' },
    { stage: 1, at: 0, do: 'start', project: 'arlandaExpress', part: 'south' },
    { stage: 1, at: 0, do: 'start', project: 'arlandaExpress', part: 'north' }
  ]
};

// Route Incentive: a quarter off for Braathens
STRATEGIES['4-6'] = {
  tray: REACT_QUICK,
  choices: { braathens: 'quarter' },
  moves: [{ stage: 1, at: '07:00', do: 'desks', n: 30 }]
};

// Bags by Machine: the sorting hall, then the bar-code system with the belts kept
STRATEGIES['4-7'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: '07:00', do: 'desks', n: 30 },
    { stage: 1, at: 0, do: 'start', project: 'sorterHall', part: 'hall' },
    { stage: 1, at: 0, do: 'act', fn: 'hireIT', args: [3] },
    { stage: 1, after: ['sorterHall', 'hall'], do: 'act', fn: 'upgrade', args: ['baggage', 'keep'] },
    { stage: 2, at: '07:00', do: 'desks', n: 30 }
  ]
};

// The Low-Fare Question: invite the low-fare airline
STRATEGIES['4-8'] = {
  tray: REACT_QUICK,
  choices: { lowFare: 'invite' },
  moves: [{ stage: 1, at: '16:00', do: 'desks', n: 30 }]
};

// Hub Wars: a tenth off for SAS
STRATEGIES['4-9'] = {
  tray: REACT_QUICK,
  choices: { hubDeal: 'incentive' },
  moves: [{ stage: 0, at: '06:30', do: 'desks', n: 30 }]
};

// Christmas Rush: BRIO by the gates, the desks open
STRATEGIES['4-10'] = {
  tray: REACT_QUICK,
  choices: { kids: 'brio' },
  moves: [{ stage: 1, at: '06:00', do: 'desks', n: 30 }, { stage: 2, at: '15:00', do: 'desks', n: 30 }]
};

// Exam: every system tested, the desks open
STRATEGIES['4-11'] = {
  tray: REACT_QUICK,
  choices: { y2k: 'test' },
  moves: [{ stage: 1, at: '13:00', do: 'desks', n: 30 }, { stage: 2, at: '22:00', do: 'desks', n: 16 }]
};

// ---------- the Challenge Days ----------
// Christmas Week: the desks open before every peak, overtime on the flu day
STRATEGIES.c1 = {
  tray: REACT_QUICK,
  moves: [0, 1, 2, 3, 4, 5].map((stage) => ({ stage, at: 0, do: 'desks', n: 26 }))
    .concat([{ stage: 2, at: 0, do: 'act', fn: 'overtime', args: ['turnaround'] }, { stage: 2, at: 0, do: 'act', fn: 'overtime', args: ['checkin'] }])
};
// The Great Snow: the desks open, a drill for the clearing plan's fallback
STRATEGIES.c2 = {
  tray: REACT_QUICK,
  moves: [0, 1, 2, 3, 4, 5].map((stage) => ({ stage, at: 0, do: 'desks', n: 26 })).concat([{ stage: 0, at: 0, do: 'act', fn: 'drill', args: ['snow'] }])
};
// Record Day: the desks open, two more security lanes
STRATEGIES.c3 = {
  tray: REACT_QUICK,
  moves: [0, 1, 2, 3, 4, 5].map((stage) => ({ stage, at: 0, do: 'desks', n: 36 })).concat([{ stage: 0, at: 0, do: 'buy', kind: 'lane', n: 2 }])
};
