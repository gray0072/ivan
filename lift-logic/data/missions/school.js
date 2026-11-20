'use strict';

// Lift Logic — chapter 2, Maple School: five floors, one standard lift for eight. Conditions, sensing the
// call buttons and the cabin buttons, comparisons, wait until, repeat until. See data/missions/missions.js.

// after school the teachers are in no hurry: a fixed little day, two versions
const TEACHERS_AFTER_SCHOOL = (v) => [[3, 1, 5], [10, 4, 1], [28, 2, 5], [45, 5, 2], [60, 1, 3], [82, 3, 1], [100, 5, 1], [118, 1, 4], [140, 2, 1], [155, 4, 2]]
  .map(([t, from, to], k) => ({ t: t + v * 7, who: k % 4 === 3 ? 'janitor' : 'teacher', from: v ? 6 - from : from, to: v ? 6 - to : to, patience: 80 }));

addMissions('school', [
  {
    kind: 'fill', name: 'Who\'s Calling?',
    brief: ['School is over! The kids on every floor want to go down to the yard on floor 1.', 'But the lift shouldn\'t stop where nobody called.'],
    goal: 'Bring everyone down to floor 1, stopping only where someone called.',
    flows: [{ from: [2, 3, 4, 5], to: 1, perMin: 4, t0: 0, t1: 150, who: 'kid' }],
    stars: [{ k: 'all' }, { k: 'avgWait', s: 16 }, { k: 'energy', e: 92 }],
    start: `when ▶ clicked #lock
forever #lock
  go to floor 1 #lock
  if <call on floor (2) [any]?> then #lock
    go to floor 2 #lock
  if <call on floor (3) [any]?> then #lock
    go to floor _
  if _ then #lock
    go to floor 4 #lock
  if _ then
    go to floor 5`,
    newBlocks: ['if', 'callOn'], concept: 'condition', fact: 'callButtons',
    hints: ['Each "if" checks one floor. Fill in the floor numbers, and pick "call on floor … ?" for the empty conditions.']
  },
  {
    kind: 'build', name: 'The Patrol',
    brief: ['P.E. class! Everyone goes up to the gym on floor 5.', 'The lift should check every floor and go only where someone is calling.'],
    goal: 'Bring the kids up to the gym on floor 5.',
    flows: [{ from: [1, 2, 3, 4], to: 5, perMin: 4, t0: 0, t1: 150, who: [['kid', 6], ['teacher', 1]] }],
    stars: [{ k: 'all' }, { k: 'avgWait', s: 9 }, { k: 'energy', e: 60 }],
    newBlocks: ['ifElse'], concept: 'patrol', fact: 'floorNames',
    hints: ['In a "forever" loop: if there is a call on floor 1, go there; the same for 2, 3 and 4; then go up to 5.']
  },
  {
    kind: 'build', name: 'Inside Buttons',
    brief: ['Lessons change: kids go from any floor to any floor.', 'The lift has to take them where they pressed the button inside.'],
    goal: 'Take everyone where they want to go.',
    flows: [{ from: 'any', to: 'any', perMin: 4, t0: 0, t1: 160, who: [['kid', 5], ['teacher', 1]] }],
    stars: [{ k: 'all' }, { k: 'avgWait', s: 12 }, { k: 'energy', e: 80 }],
    newBlocks: ['buttonIn', 'or', 'and', 'not'], concept: 'sensing', fact: 'speedNormal',
    hints: ['Stop at a floor when someone calls there OR someone inside pressed its button. The "or" block joins two conditions.']
  },
  {
    kind: 'beat', name: 'Don\'t Move for Nothing',
    brief: ['Night at school: only Mr. Mops the janitor and a few teachers.', 'This lift rides up and down all night and the electricity bill is huge!'],
    goal: 'Deliver everyone with as little energy as possible.',
    flows: [{ from: 'any', to: 'any', perMin: 1.4, t0: 0, t1: 200, who: [['teacher', 2], ['janitor', 1]] }],
    stars: [{ k: 'all' }, { k: 'energy', e: 42 }, { k: 'emptyMax', n: 0 }],
    start: `when ▶ clicked
forever
  go to floor 1
  go to floor 2
  go to floor 3
  go to floor 4
  go to floor 5
  go to floor 4
  go to floor 3
  go to floor 2`,
    newBlocks: ['waitUntil'], concept: 'waitUntil', fact: 'counterweight',
    hints: ['Move only when a button is lit: on a landing, or inside the lift.']
  },
  {
    kind: 'fix', name: 'Wrong Way',
    brief: ['Our new sweep program goes up nicely…', 'but then it never comes down again! The teachers on the lower floors are waiting.'],
    goal: 'Fix the program so the lift goes up and down.',
    schedule: TEACHERS_AFTER_SCHOOL(0),
    stars: [{ k: 'all' }, { k: 'avgWait', s: 31 }, { k: 'blocks', n: 16 }],
    start: `when ▶ clicked
forever
  repeat until <(current floor) = (top floor)>
    go to floor ((current floor) + (1))
  repeat until <(current floor) = (bottom floor)>
    go to floor ((current floor) + (1))`,
    newBlocks: ['repeatUntil', 'add', 'sub', 'eq', 'topFloor', 'bottomFloor'], concept: 'operators', fact: 'thirteen',
    hints: ['Look for the red outline during the run. Going down, is the next floor the current floor plus one?']
  },
  {
    kind: 'build', name: 'The Bell Rings',
    brief: ['RIIING! Break time: kids on every floor want to go out to the yard at once.', 'And after the break they all come back up.'],
    goal: 'Get everyone out to the yard and back to class.',
    schedule: (() => {
      const s = [];
      for (const f of [2, 3, 4, 5]) for (let k = 0; k < 2; k++) s.push({ t: 4 + k * 3 + f * 0.7, who: 'kid', from: f, to: 1 });
      for (const f of [2, 3, 4, 5]) for (let k = 0; k < 3; k++) s.push({ t: 80 + k * 22 + f * 0.6, who: 'kid', from: 1, to: f });
      s.push({ t: 40, who: 'principal', from: 1, to: 3 });
      return s;
    })(),
    stars: [{ k: 'all' }, { k: 'avgWait', s: 18 }, { k: 'maxWait', s: 42 }],
    newBlocks: ['lt', 'gt', 'random'], concept: 'rush', fact: 'weightSensor',
    hints: ['Eight kids fit in the lift. Go where the calls are, and drop everyone off where they pressed.']
  },
  {
    kind: 'build', name: 'Up First, Then Down',
    brief: ['A real lift goes all the way up, then all the way down.', 'On the way up it stops for ▲ calls, on the way down for ▼ calls.'],
    goal: 'Serve the ▲ calls going up and the ▼ calls going down.',
    flows: [{ from: 'any', to: 'any', perMin: 5, t0: 0, t1: 170, who: [['kid', 5], ['teacher', 2]] }],
    stars: [{ k: 'all' }, { k: 'avgWait', s: 13 }, { k: 'story', id: 'wrongWayMax', n: 3, text: 'At most {n} people ride the wrong way first', params: { n: 3 } }],
    newBlocks: ['myDir', 'doorsOpen'], concept: 'sweep', fact: 'collective',
    hints: ['Check floors 1 to 5 for ▲ calls and inside buttons, then 4 down to 2 for ▼ calls and inside buttons.']
  },
  {
    kind: 'tiny', name: 'Tiny Sweep',
    brief: ['Grandpa Gears wrote the sweep in 47 blocks.', 'He bets you can\'t do it in 16. A lift that stops at every floor is fine today.'],
    goal: 'Go up and down stopping at every floor, in at most 16 blocks.',
    schedule: TEACHERS_AFTER_SCHOOL(1),
    stars: [[{ k: 'all' }, { k: 'blocks', n: 16 }], { k: 'avgWait', s: 16 }, { k: 'maxWait', s: 38 }],
    concept: 'repeatUntil', fact: 'escalator',
    hints: ['"go to floor ((current floor) + (1))" goes one floor up. Repeat it until the current floor is the top floor.']
  },
  {
    kind: 'exam', name: 'Last Day of School',
    brief: ['The last day before the summer! Three bells, three rushes.', 'And Principal Oak checks every minute of it.'],
    goal: 'Get the whole school through the last day.',
    schedule: (() => {
      const s = [];
      for (const [t, down] of [[8, true], [75, false], [150, true]]) {
        for (const f of [2, 3, 4, 5]) for (let k = 0; k < 2; k++) s.push(down ? { t: t + k * 4 + f * 0.5, who: 'kid', from: f, to: 1 } : { t: t + k * 14 + f * 0.5, who: 'kid', from: 1, to: f });
      }
      s.push({ t: 30, who: 'principal', from: 1, to: 5 }, { t: 110, who: 'principal', from: 5, to: 2 });
      return s;
    })(),
    flows: [{ from: 'any', to: 'any', perMin: 2, t0: 0, t1: 200, who: [['teacher', 2], ['kid', 2], ['janitor', 1]] }],
    stars: [{ k: 'share', p: 0.9 }, { k: 'noGaveUp' }, { k: 'avgWait', s: 19 }],
    concept: 'exam', fact: 'lightCurtain',
    hints: ['Use everything you know: check the calls and the buttons, go up first, then down.']
  }
]);
