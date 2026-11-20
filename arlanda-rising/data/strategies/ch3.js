'use strict';

// Arlanda Rising — the reference strategies of chapter 3 (sim/strategy.js describes the fields), into STRATEGIES.
// tools/missions-check.js plays them at every difficulty and balances the missions with them.

// Linjeflyg Moves In: the terminal on a loan, the discount, the desks open
STRATEGIES['3-1'] = {
  tray: REACT_QUICK,
  choices: { lfDeal: 'yes' },
  moves: [
    { stage: 0, at: 0, do: 'borrow', sum: 100e6 },
    { stage: 0, at: 0, do: 'start', project: 'domTerminal', part: 'hall' },
    { stage: 0, at: 0, do: 'start', project: 'domTerminal', part: 'apron' },
    { stage: 0, after: ['domTerminal', 'hall'], do: 'start', project: 'domTerminal', part: 'desks' },
    { stage: 1, at: '06:30', do: 'desks', n: 20 }
  ]
};

// Morning Peak: Maja Ström, the desks opened before the peak
STRATEGIES['3-2'] = {
  tray: REACT_QUICK,
  choices: { terminalHead: 'maja' },
  moves: [{ stage: 1, at: '06:00', do: 'desks', n: 20 }, { stage: 2, at: '09:00', do: 'desks', n: 16 }]
};

// The Computer Room: Mira Haddad's IT, the room with backup power, the computer with the planners kept
STRATEGIES['3-3'] = {
  tray: REACT_QUICK,
  choices: { itHead: 'mira' },
  moves: [
    { stage: 0, at: 0, do: 'start', project: 'computerRoom', part: 'room' },
    { stage: 0, after: ['computerRoom', 'room'], do: 'act', fn: 'upgrade', args: ['stands', 'keep'] },
    { stage: 0, after: ['computerRoom', 'room'], do: 'start', project: 'computerRoom', part: 'ups' },
    { stage: 1, at: '07:00', do: 'desks', n: 18 }
  ]
};

// Screens: the delays told quickly; a PA operator, then the screens with the operator kept
STRATEGIES['3-4'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: '15:00', do: 'desks', n: 16 },
    { stage: 1, at: 0, do: 'act', fn: 'hire', args: ['info'] },
    { stage: 1, at: 15, do: 'act', fn: 'upgrade', args: ['info', 'keep'] },
    { stage: 2, at: '15:00', do: 'desks', n: 16 }
  ]
};

// Flu Season: temps for the ramp team, overtime for the ramp and the desks on the day
STRATEGIES['3-5'] = {
  tray: REACT_QUICK,
  choices: { temps: 'ramp' },
  moves: [
    { stage: 1, at: '06:30', do: 'act', fn: 'overtime', args: ['turnaround'] },
    { stage: 1, at: '06:30', do: 'act', fn: 'overtime', args: ['checkin'] },
    { stage: 1, at: '06:30', do: 'desks', n: 18 }
  ]
};

// Strike Notice: the mediator
STRATEGIES['3-6'] = {
  tray: REACT_QUICK,
  choices: { notice: 'mediator' },
  moves: [{ stage: 1, at: '07:00', do: 'desks', n: 18 }]
};

// The Big Freeze: the clearing plan with the snow team kept
STRATEGIES['3-7'] = {
  tray: REACT_QUICK,
  choices: { snowPlan: 'keep' },
  moves: [{ stage: 1, at: '06:00', do: 'desks', n: 16 }, { stage: 2, at: '12:00', do: 'desks', n: 16 }]
};

// Planner or Computer?: the computers
STRATEGIES['3-8'] = {
  tray: REACT_QUICK,
  choices: { checkinWay: 'computer' },
  moves: [{ stage: 1, at: '06:00', do: 'desks', n: 26 }, { stage: 2, at: '16:00', do: 'desks', n: 26 }]
};

// Payback: duty free and the car park; the second restaurant
STRATEGIES['3-9'] = {
  choices: { shop: 'dutyFree', parking: 'big', restaurant2: 'yes' }
};

// Flygbussarna: the coach stops
STRATEGIES['3-10'] = {
  tray: REACT_QUICK,
  choices: { coaches: 'stops' },
  moves: [{ stage: 1, at: '16:00', do: 'desks', n: 18 }]
};

// Exam: a backup generator, a drill for the stands' fallback, the desks open, overtime for the sick teams
STRATEGIES['3-11'] = {
  tray: REACT_QUICK,
  moves: [
    { stage: 0, at: '06:00', do: 'buy', kind: 'generator' },
    { stage: 0, at: '06:00', do: 'act', fn: 'drill', args: ['stands'] },
    { stage: 0, at: '06:00', do: 'desks', n: 26 },
    { stage: 0, at: '06:00', do: 'act', fn: 'overtime', args: ['turnaround'] },
    { stage: 0, at: '06:00', do: 'act', fn: 'overtime', args: ['checkin'] },
    { stage: 1, at: '11:00', do: 'desks', n: 26 },
    { stage: 2, at: '15:00', do: 'desks', n: 26 }
  ]
};
