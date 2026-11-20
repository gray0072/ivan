'use strict';

// Lift Logic — chapter 5, Glass Tower: sixteen floors of offices, two and then three fast lifts running copies
// of one program. Several agents: `my number`, the other lifts' floors, the nearest one goes, messages
// between the lifts, variables for all lifts, the clock and the rush hours. See data/missions/missions.js for
// the fields.

const TWO_LIFTS = [{ type: 'fast', at: 1 }, { type: 'fast', at: 9 }];
const THREE_LIFTS = [{ type: 'fast', at: 1 }, { type: 'fast', at: 6 }, { type: 'fast', at: 12 }];
// an ordinary office day: in from the lobby, out to the lobby, between the floors
const OFFICE_DAY = (up, down, between, t1, t0 = 0) => [
  { from: 1, to: 'upper', perMin: up, t0, t1, who: [['office', 6], ['boss', 1]] },
  { from: 'upper', to: 1, perMin: down, t0, t1, who: 'office' },
  { from: 'upper', to: 'upper', perMin: between, t0, t1, who: 'office' }
];

addMissions('office', [
  {
    kind: 'build', name: 'Two Is Better?',
    brief: ['The Glass Tower has two lifts, and both run your program — a copy each.', 'Give them the same simple program and watch: both race to every call!'],
    goal: 'Share the work: each call should get only one lift.',
    lifts: TWO_LIFTS,
    flows: OFFICE_DAY(3, 3, 2, 200),
    stars: [{ k: 'share', p: 0.9 }, { k: 'emptyMax', n: 3 }, { k: 'avgWait', s: 20 }],
    newBlocks: ['myNumber', 'liftsInGroup'], concept: 'agents', fact: 'groupControl',
    hints: ['"my number" is 1 in lift A and 2 in lift B. Let lift 1 take the ▲ calls and lift 2 the ▼ calls.']
  },
  {
    kind: 'build', name: 'The Nearest One Goes',
    brief: ['Splitting by direction works, but sometimes the far lift goes while the near one sleeps.', 'Each lift can see where the other one is.'],
    goal: 'The lift that is nearer to the call takes it.',
    lifts: TWO_LIFTS,
    flows: OFFICE_DAY(2.5, 2.5, 2, 200),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 17 }, { k: 'story', id: 'nobodyStopsMax', n: 10, text: 'At most {n} stops where nobody gets on or off', params: { n: 10 } }],
    newBlocks: ['floorOf', 'dirOf', 'planLenOf', 'loadOf'], concept: 'nearest', fact: 'destinationDispatch',
    hints: ['"distance from (current floor) to (floor)" is how far I am. "floor of lift (…)" tells where the other one is — the other lift is 3 − my number.']
  },
  {
    kind: 'build', name: 'Talk to Each Other',
    brief: ['Mr. Bigwig wants both lifts to answer every call — "whoever is first wins".', 'But the slower one then arrives at an empty landing. The lifts must tell each other.'],
    goal: 'When a lift has served a floor, the other one drops it from its plan.',
    lifts: TWO_LIFTS,
    flows: OFFICE_DAY(3, 3, 2.5, 200),
    stars: [{ k: 'share', p: 0.9 }, { k: 'emptyMax', n: 4 }, { k: 'avgWait', s: 16 }],
    newBlocks: ['broadcast', 'broadcastWait', 'onReceive'], concept: 'messages', fact: 'placebo',
    hints: ['Both lifts add every call. When one arrives at a floor, it puts the floor into a variable for all lifts and broadcasts a message; the other removes that floor from its plan.']
  },
  {
    kind: 'beat', name: 'Morning Rush',
    brief: ['Nine o\'clock: everybody arrives at once, all through the lobby.', 'The lifts should be waiting downstairs, and take full loads up.'],
    goal: 'Make the morning wait in the lobby short.',
    lifts: TWO_LIFTS,
    clock: 8 * 60 + 50,
    flows: [
      { from: 1, to: 'upper', perMin: 10, fixed: true, t0: 0, t1: 200, who: [['office', 8], ['boss', 1]] },
      { from: 'upper', to: 'upper', perMin: 1, fixed: true, t0: 0, t1: 200, who: 'office' }
    ],
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 8.5 }, { k: 'story', id: 'nobodyStopsMax', n: 3, text: 'At most {n} stops where nobody gets on or off', params: { n: 3 } }],
    newBlocks: [], concept: 'upPeak', fact: 'express',
    hints: ['"when I\'m idle" → go back to the lobby. In the lobby hold the doors a few seconds, so more people get on.']
  },
  {
    kind: 'build', name: 'Lunch Time',
    brief: ['Twelve o\'clock: everybody goes to the canteen on floor 8, and an hour later back to their desks.', 'Where should the lifts wait at lunch?'],
    goal: 'Take everyone to lunch and back.',
    lifts: TWO_LIFTS,
    clock: 11 * 60 + 58,
    flows: [
      { from: [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16], to: 8, perMin: 7, t0: 0, t1: 110, who: 'office' },
      { from: 8, to: [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16], perMin: 7, t0: 100, t1: 220, who: 'office' },
      { from: 1, to: 8, perMin: 1, t0: 0, t1: 200, who: 'cook' }
    ],
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 20 }, { k: 'maxWait', s: 60 }],
    newBlocks: [], concept: 'lunch', fact: 'escalatorCapacity',
    hints: ['At lunch most trips start or end at floor 8. Let the lifts wait there when they have nothing to do.']
  },
  {
    kind: 'beat', name: 'Evening Rush',
    brief: ['At five o\'clock sharp the whole tower goes home — down to the lobby.', 'Before five the lifts should wait in the lobby, after five up among the offices.'],
    goal: 'Make the wait short, before and after five.',
    lifts: TWO_LIFTS,
    clock: 16 * 60 + 58,
    flows: [
      { from: 1, to: 'upper', perMin: 4, t0: 0, t1: 120, who: 'office' },
      { from: 'upper', to: 1, perMin: 1, t0: 0, t1: 120, who: 'office' },
      { from: [8, 9, 10, 11, 12, 13, 14, 15, 16], to: 1, perMin: 6, t0: 120, t1: 260, who: [['office', 8], ['boss', 1]] },
      { from: [2, 3, 4, 5, 6, 7], to: 1, perMin: 2, t0: 120, t1: 260, who: 'office' }
    ],
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 12.5 }, { k: 'maxWait', s: 50 }],
    newBlocks: ['onClock', 'clock', 'clockHour', 'onEvery'], concept: 'clock', fact: 'fireStairs',
    hints: ['"when clock is 17:00" runs once at five. Let it set a variable for all lifts, and in "when I\'m idle" look at it: before five go to the lobby, after five go up.']
  },
  {
    kind: 'fix', name: 'The Twins',
    brief: ['Somebody programmed "the nearest one goes" — but the two lifts move together like twins!', 'And some calls are never answered at all.'],
    goal: 'Find the bug: exactly one lift should take each call.',
    lifts: TWO_LIFTS,
    flows: OFFICE_DAY(2, 2, 1.5, 200),
    start: `when call button pressed (floor) (direction)
if <(distance from (floor of lift (1)) to (floor)) < (distance from (floor of lift (2)) to (floor))> then
  add floor (floor) to plan

when button pressed inside (floor)
add floor (floor) to plan`,
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 20 }, { k: 'emptyMax', n: 3 }],
    newBlocks: [], concept: 'bug4', fact: 'twinLifts',
    hints: ['Both lifts compare lift 1 with lift 2 — so both get the same answer. Each lift should compare itself with the other one.']
  },
  {
    kind: 'build', name: 'Three Lifts',
    brief: ['A third lift! The same program now runs three times.', 'Make the nearest of the three take each call.'],
    goal: 'The nearest of the three lifts takes each call.',
    lifts: THREE_LIFTS,
    flows: OFFICE_DAY(4, 4, 3, 220),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 12 }, { k: 'maxWait', s: 45 }],
    newBlocks: [], concept: 'loopLifts', fact: 'fastest',
    hints: ['Go through the lifts with a variable k from 1 to "lifts in group" and remember the nearest one. If it is "my number", take the call.']
  },
  {
    kind: 'exam', name: 'A Day at the Office',
    brief: ['A whole day in the Glass Tower, from seven in the morning to seven in the evening, squeezed into eight minutes.', 'The morning rush, lunch, meetings, and everybody home at five.'],
    goal: 'Run the whole office day with three lifts.',
    lifts: THREE_LIFTS,
    clock: 7 * 60, clockRate: 1.5,
    flows: [
      // the clock runs 1.5 minutes per second: 08:00 is t = 40, 12:00 is t = 200, 17:00 is t = 400
      { from: 1, to: 'upper', perMin: 11, t0: 30, t1: 110, who: [['office', 8], ['boss', 1]] },
      { from: 'upper', to: 'upper', perMin: 2.5, t0: 0, t1: 470, who: 'office' },
      { from: 'upper', to: 8, perMin: 8, t0: 200, t1: 240, who: 'office' },
      { from: 8, to: 'upper', perMin: 8, t0: 235, t1: 275, who: 'office' },
      { from: 1, to: 8, perMin: 1.5, t0: 190, t1: 230, who: 'cook' },
      { from: 'upper', to: 1, perMin: 11, t0: 400, t1: 470, who: [['office', 8], ['boss', 1]] }
    ],
    stars: [{ k: 'share', p: 0.9 }, { k: 'noGaveUp' }, { k: 'avgWait', s: 20 }],
    newBlocks: [], concept: 'exam', fact: 'muzak',
    hints: ['The nearest lift takes the call, the lifts tell each other, and the clock decides where they wait: the lobby in the morning, floor 8 at lunch, up high after five.']
  }
]);
