'use strict';

// Lift Logic — chapter 4, St. Hope Hospital: ten floors, one big bed lift. Boolean logic, priorities and
// fairness: emergency calls go first, a lift with a bed goes straight there, slow patients get time at the
// doors, the longest wait is served first, the arrow decides who gets on. See data/missions/missions.js for
// the fields.

// visitors to the wards and back, nurses and doctors between the floors
const HOSP_DAY = (vis, staff, t1, t0 = 0) => [
  { from: 1, to: [5, 6, 7, 8, 9, 10], perMin: vis, t0, t1, who: [['visitor', 3], ['nurse', 1]] },
  { from: [5, 6, 7, 8, 9, 10], to: 1, perMin: vis * 0.7, t0, t1, who: 'visitor' },
  { from: 'any', to: 'any', perMin: staff, t0, t1, who: [['nurse', 2], ['doctor', 1]] }
];
// a doctor called to an emergency on floor `from`, on the way to `to`
const CODE = (t, from, to) => ({ t, who: 'doctor', from, to, emergency: true });

addMissions('hospital', [
  {
    kind: 'build', name: 'Code Blue',
    brief: ['Welcome to St. Hope. When a doctor turns the red emergency key, the lift must come at once.', 'Not after the visitors. At once.'],
    goal: 'Serve everyone, and reach every emergency call quickly.',
    schedule: [CODE(25, 9, 4), CODE(70, 2, 4), CODE(115, 10, 4), CODE(160, 6, 4), CODE(200, 8, 4)],
    flows: HOSP_DAY(1.36, 1.02, 220),
    stars: [[{ k: 'share', p: 0.9 }, { k: 'story', id: 'emergencies', s: 30, text: 'Every emergency is reached within {s} s', params: { s: 30 } }], { k: 'avgWait', s: 18 }, { k: 'maxWait', s: 55 }],
    newBlocks: ['onEmergency', 'emergencyOn'], concept: 'priority', fact: 'firemanService',
    hints: ['"when emergency call" runs when the red key is turned. Don\'t add that floor at the end of the plan — put it first.']
  },
  {
    kind: 'build', name: 'Bed on Board',
    brief: ['Patients on beds ride from the ambulance entrance up to the wards, and back down to go home.', 'With a bed on board, the lift must not stop on every floor for visitors.'],
    goal: 'With a bed inside, go straight there. Without one, pick people up on the way.',
    schedule: [
      { t: 10, who: 'bed', from: 1, to: 9 }, { t: 50, who: 'bed', from: 10, to: 1 }, { t: 90, who: 'bed', from: 1, to: 10 },
      { t: 130, who: 'bed', from: 9, to: 1 }, { t: 170, who: 'bed', from: 1, to: 9 }, { t: 205, who: 'bed', from: 10, to: 1 }
    ],
    flows: HOSP_DAY(1.53, 1.19, 230),
    stars: [[{ k: 'share', p: 0.9 }, { k: 'story', id: 'rideMax', who: 'bed', s: 18, text: 'Every bed rides at most {s} s', params: { s: 18 } }], { k: 'avgWait', s: 29 }, { k: 'maxWait', s: 75 }],
    newBlocks: [], concept: 'andNot', fact: 'bedLift',
    hints: ['A bed takes half of the lift: then "load %" is 50 or more. With a bed on board, put the floor pressed inside first in the plan; and in "when I\'m about to pass floor" stop only when the load is below 50.']
  },
  {
    kind: 'build', name: 'Slow Steps',
    brief: ['After physiotherapy on floor 2 the patients walk to the lift very slowly.', 'The doors close before they get there! Give them time.'],
    goal: 'Nobody from physiotherapy is left behind by closing doors.',
    flows: HOSP_DAY(0.8, 0.7, 220).concat([
      { from: 2, to: [1, 5, 6, 7, 8, 9, 10], perMin: 1.1, t0: 0, t1: 220, who: 'patient' },
      { from: [1, 9, 10], to: 2, perMin: 0.68, t0: 0, t1: 200, who: 'nurse' }
    ]),
    stars: [[{ k: 'share', p: 0.9 }, { k: 'story', id: 'leftBehindMax', n: 1, text: 'At most {n} patient is left behind at the doors', params: { n: 1 } }], { k: 'avgWait', s: 34 }, { k: 'maxWait', s: 65 }],
    newBlocks: ['holdDoors', 'closeDoors', 'doorway'], concept: 'doors', fact: 'doorDelay',
    hints: ['"hold doors" keeps the doors open longer. When the lift arrives at floor 2, hold the doors for a few seconds.']
  },
  {
    kind: 'beat', name: 'Who Waited Longest?',
    brief: ['In the old wing the lift\'s bell is broken: "when call button pressed" does not ring today.', 'The lift looks at the buttons itself — but it always picks the lowest floor first, and the top floors wait and wait.'],
    goal: 'Make the longest wait short: serve the call that has waited longest.',
    bellBroken: true,
    flows: [
      { from: [1, 2, 3, 4], to: [1, 2, 3, 4, 5], perMin: 4.5, fixed: true, t0: 0, t1: 220, who: [['nurse', 2], ['visitor', 2], ['doctor', 1]] },
      { from: [8, 9, 10], to: [1, 4], perMin: 1.02, fixed: true, t0: 0, t1: 220, who: [['visitor', 2], ['patient', 1]] }
    ],
    start: `when ▶ clicked
forever
  wait until <(plan length) = (0)>
  set [f] to 1
  repeat until <<(f) > (10)> or <call on floor (f) [any]?>>
    change [f] by 1
  if <(f) < (11)> then
    add floor (f) to plan
  else
    wait 1 seconds

when button pressed inside (floor)
add floor (floor) to plan`,
    stars: [{ k: 'share', p: 0.9 }, { k: 'maxWait', s: 75 }, { k: 'avgWait', s: 25 }],
    newBlocks: ['waitTime', 'distance', 'min', 'max'], concept: 'fairness', fact: 'sabbath',
    hints: ['"waiting time on floor" says how long a call has been lit. Look at every floor and remember the one with the longest time — go there.']
  },
  {
    kind: 'build', name: 'Arrows Matter',
    brief: ['Visitors on the same floor want to go up to the wards and down to the exit.', 'When the lift shows no arrow, everyone squeezes in — and half of them ride the wrong way.'],
    goal: 'Use the arrow so people only get on going their way.',
    schedule: (() => {
      // two people meet at the café or a ward door: one goes up to the wards, one down to the exit
      const s = [];
      for (let k = 0; k < 8; k++) {
        const f = 3 + (k * 3) % 5, t = 6 + k * 36;
        const up = { who: 'visitor', from: f, to: 9 + k % 2 }, down = { who: k % 3 ? 'visitor' : 'nurse', from: f, to: 1 };
        s.push(Object.assign({ t }, k % 2 ? down : up), Object.assign({ t: t + 0.5 }, k % 2 ? up : down));
      }
      return s;
    })(),
    stars: [[{ k: 'share', p: 0.9 }, { k: 'story', id: 'wrongWayMax', n: 1, text: 'At most {n} people ride the wrong way first', params: { n: 1 } }], { k: 'avgWait', s: 20 }, { k: 'maxWait', s: 40 }],
    newBlocks: ['setArrow'], concept: 'arrow', fact: 'hallLanterns',
    hints: ['When the lift arrives with an empty plan, the arrow is off and everybody gets on. "set arrow to up" lets only those going up on.']
  },
  {
    kind: 'fix', name: 'Emergency Bug',
    brief: ['Since we added the emergency script, patients sometimes ride up and down and never get off!', 'Dr. Patel suspects the new script.'],
    goal: 'Find why riders get lost when an emergency comes, and fix it.',
    schedule: [CODE(30, 9, 4), CODE(65, 3, 4), CODE(100, 10, 4), CODE(135, 7, 4), CODE(170, 2, 4), CODE(200, 8, 4)],
    flows: HOSP_DAY(1.7, 1.3, 210),
    start: `when call button pressed (floor) (direction)
add floor (floor) to plan

when button pressed inside (floor)
add floor (floor) to plan

when emergency call (floor)
clear plan
add floor (floor) to plan`,
    stars: [[{ k: 'share', p: 0.9 }, { k: 'story', id: 'emergencies', s: 15, text: 'Every emergency is reached within {s} s', params: { s: 15 } }], { k: 'avgWait', s: 16 }, { k: 'maxWait', s: 55 }],
    newBlocks: [], concept: 'bug3', fact: 'alarmPhone',
    hints: ['"clear plan" throws away the floors the riders pressed. The emergency only needs to go first.']
  },
  {
    kind: 'build', name: 'Visiting Hours',
    brief: ['At visiting hours a bus stops outside every minute, and a whole group of visitors walks in.', 'The lift leaves with one or two and the rest wait a whole trip.'],
    goal: 'Take the visitors up in groups, and bring them back down.',
    schedule: (() => {
      const s = [];
      // a bus every 40 s: six visitors come in over ten seconds
      for (let b = 0; b < 4; b++) for (let k = 0; k < 6; k++) s.push({ t: 5 + b * 40 + k * 1.7, who: k === 5 ? 'nurse' : 'visitor', from: 1, to: 5 + (k * 2 + b) % 6 });
      return s;
    })(),
    flows: [
      { from: [5, 6, 7, 8, 9, 10], to: 1, perMin: 1.53, t0: 60, t1: 240, who: 'visitor' },
      { from: 'any', to: 'any', perMin: 0.68, t0: 0, t1: 240, who: 'nurse' }
    ],
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 17 }, { k: 'maxWait', s: 60 }],
    newBlocks: [], concept: 'groups', fact: 'buffers',
    hints: ['When the lift stands in the lobby, hold the doors a few seconds more: the rest of the group is coming.']
  },
  {
    kind: 'tiny', name: 'Tiny Hospital',
    brief: ['The hospital\'s new lift computer is tiny. Its memory fits only a few blocks.', 'Calls, buttons, emergencies — all in a handful of blocks.'],
    goal: 'A whole hospital lift in at most 6 blocks.',
    schedule: [CODE(40, 8, 4), CODE(110, 2, 4), CODE(170, 10, 4)],
    flows: HOSP_DAY(1.27, 1.02, 200),
    stars: [[{ k: 'share', p: 0.9 }, { k: 'story', id: 'emergencies', s: 40, text: 'Every emergency is reached within {s} s', params: { s: 40 } }], { k: 'blocks', n: 6 }, { k: 'avgWait', s: 24 }],
    newBlocks: [], concept: 'tiny', fact: 'stairlift',
    hints: ['Three scripts of two blocks: calls into the plan, buttons into the plan, emergencies first in the plan.']
  },
  {
    kind: 'exam', name: 'Night Shift',
    brief: ['The night shift: quiet corridors, a few nurses, and then — suddenly — an emergency, a bed from surgery, a patient from physio.', 'At night the hospital saves electricity, so every trip counts.'],
    goal: 'Run the night: everyone served, emergencies fast, little energy.',
    clock: 22 * 60,
    schedule: [
      CODE(35, 10, 4), CODE(120, 6, 4), CODE(205, 9, 4), CODE(265, 3, 4),
      { t: 75, who: 'bed', from: 4, to: 9 }, { t: 160, who: 'bed', from: 1, to: 4 }, { t: 235, who: 'bed', from: 4, to: 10 },
      { t: 50, who: 'patient', from: 2, to: 9 }, { t: 145, who: 'patient', from: 2, to: 10 }, { t: 225, who: 'patient', from: 2, to: 8 }
    ],
    flows: [
      { from: 'any', to: 'any', perMin: 0.9, t0: 0, t1: 280, who: [['nurse', 3], ['doctor', 1]] },
      { from: [5, 6, 7, 8, 9, 10], to: 1, perMin: 0.3, t0: 0, t1: 280, who: 'visitor' }
    ],
    stars: [[{ k: 'share', p: 0.9 }, { k: 'story', id: 'emergencies', s: 30, text: 'Every emergency is reached within {s} s', params: { s: 30 } }], { k: 'energy', e: 152 }, { k: 'avgWait', s: 32 }],
    newBlocks: [], concept: 'exam', fact: 'governor',
    hints: ['Use everything: emergencies first, beds straight there, time for slow patients at floor 2 — and no trips for nothing.']
  }
]);
