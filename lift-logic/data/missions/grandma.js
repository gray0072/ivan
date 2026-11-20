'use strict';

// Lift Logic — chapter 1, Grandma's House: an old slow lift for four places, three (later four) floors.
// Sequences, wait, say, repeat, forever. See data/missions/missions.js for the fields.

addMissions('grandma', [
  {
    kind: 'fill', name: 'Hello, Lift!', guided: true,
    brief: ['Hello, Lifty! I\'m on floor 3 and I want to go down to the street.', 'Come and get me, dear!'],
    goal: 'Bring Grandma Rosa from floor 3 down to floor 1.',
    lifts: [{ type: 'old', at: 1 }],
    schedule: [{ t: 0, who: 'rosa', from: 3, to: 1 }],
    stars: [{ k: 'all' }, { k: 'maxWait', s: 8 }, { k: 'energy', e: 8 }],
    start: 'when ▶ clicked #lock\ngo to floor _ #lock\ngo to floor _ #lock',
    newBlocks: ['start', 'goto'], concept: 'program', fact: 'firstLifts',
    hints: ['First the lift must go up to Grandma, then down with her. Tap each empty slot and type a floor.']
  },
  {
    kind: 'build', name: 'Morning Bread',
    brief: ['I\'m off to the bakery on floor 1.', 'I\'ll be there for about 20 seconds, then I\'ll want to go home to floor 3.'],
    goal: 'Take Grandma down to the bakery and back home again.',
    lifts: [{ type: 'old', at: 1 }],
    schedule: [{ t: 0, who: 'rosa', from: 3, to: 1, id: 'r1' }, { after: 'r1', delay: 20, who: 'rosa', from: 1, to: 3 }],
    stars: [{ k: 'all' }, { k: 'avgWait', s: 6 }, { k: 'blocks', n: 5 }],
    newBlocks: ['wait'], concept: 'wait', fact: 'otis',
    hints: ['The lift is faster than Grandma: if it goes back up at once, she isn\'t there yet. Make it wait.']
  },
  {
    kind: 'build', name: 'The Postman',
    brief: ['Pete the Postman starts at floor 1.', 'He brings letters to floor 2, then floor 3, then goes back down to 1.'],
    goal: 'Take the postman 1 → 2 → 3 → 1.',
    lifts: [{ type: 'old', at: 1 }],
    schedule: [
      { t: 0, who: 'postman', from: 1, to: 2, id: 'p1' },
      { after: 'p1', delay: 1, who: 'postman', from: 2, to: 3, id: 'p2' },
      { after: 'p2', delay: 1, who: 'postman', from: 3, to: 1 }
    ],
    stars: [{ k: 'all' }, { k: 'blocks', n: 4 }, { k: 'energy', e: 10 }],
    concept: 'sequence', fact: 'safety',
    hints: ['A program runs from top to bottom, one block after another. Put the floors in the order he visits them.']
  },
  {
    kind: 'fix', name: 'Oops!',
    brief: ['My cat Biscuit has an appointment at the vet on floor 1!', 'Mr. Brown on floor 2 also wants to go down. But this program is all wrong…'],
    goal: 'Fix the program: bring Grandma from 3 and Mr. Brown from 2 down to floor 1.',
    lifts: [{ type: 'old', at: 1 }],
    schedule: [{ t: 0, who: 'rosa', from: 3, to: 1 }, { t: 0, who: 'neighbour', name: 'Mr. Brown', from: 2, to: 1 }],
    stars: [{ k: 'all' }, { k: 'story', id: 'noWrongWay', text: 'Nobody rides the wrong way first' }, { k: 'energy', e: 10 }],
    start: 'when ▶ clicked\ngo to floor 1\ngo to floor 2\ngo to floor 3',
    concept: 'bug', fact: 'chime',
    hints: ['Watch the run: where does the lift end up? Change the order of the floors so it picks up both and finishes at floor 1.']
  },
  {
    kind: 'build', name: 'Talking Lift',
    brief: ['Grandma\'s neighbours can\'t see the little display.', 'Can the lift say the floor number at every stop?'],
    goal: 'Deliver everyone and say the floor number at every stop.',
    lifts: [{ type: 'old', at: 1 }],
    schedule: [
      { t: 0, who: 'kid', name: 'Tom', from: 1, to: 3 },
      { t: 0, who: 'neighbour', name: 'Mrs. Lee', from: 3, to: 2 },
      { t: 12, who: 'neighbour', name: 'Mr. Novak', from: 2, to: 1 }
    ],
    stars: [[{ k: 'all' }, { k: 'story', id: 'sayStops', text: 'Say the floor at every stop' }], { k: 'maxWait', s: 14 }, { k: 'energy', e: 10 }],
    newBlocks: ['say', 'sayFor', 'curFloor'], concept: 'reporter', fact: 'talking',
    hints: ['After each "go to floor", add a "say" block. The "current floor" block can go inside its slot.']
  },
  {
    kind: 'build', name: 'Moving Day',
    brief: ['My grandson Leo is moving in with me!', 'He carries five big boxes from the street up to floor 3, one box at a time.'],
    goal: 'Help Leo carry all five boxes up to floor 3.',
    lifts: [{ type: 'old', at: 1 }],
    schedule: (() => {
      const s = [{ t: 0, who: 'grandson', from: 1, to: 3, id: 'm1' }];
      for (let k = 2; k <= 9; k++) s.push({ after: 'm' + (k - 1), delay: 1, who: 'grandson', from: k % 2 ? 1 : 3, to: k % 2 ? 3 : 1, id: 'm' + k });
      return s;
    })(),
    day: 60,
    stars: [{ k: 'all' }, { k: 'blocks', n: 5 }, { k: 'energy', e: 36 }],
    newBlocks: ['repeat'], concept: 'repeat', fact: 'boxes',
    hints: ['Up and down, up and down… the same two blocks again and again. A "repeat" block does that for you.',
      'After the fifth box Leo stays upstairs: does the lift need to go down one last time?']
  },
  {
    kind: 'build', name: 'The Forever Lift',
    brief: ['All my neighbours use the lift now, at any time of the day.', 'Floor 4, the new attic flat, too!'],
    goal: 'Serve every floor, up and down, all day long.',
    floors: 4, lifts: [{ type: 'old', at: 1 }],
    flows: [{ from: 'any', to: 'any', perMin: 3.2, t0: 0, t1: 180, who: [['neighbour', 4], ['kid', 1], ['rosa', 0]] }],
    stars: [{ k: 'all' }, { k: 'avgWait', s: 20 }, { k: 'maxWait', s: 40 }],
    newBlocks: ['forever'], concept: 'forever', fact: 'paternoster',
    hints: ['Nobody knows when the neighbours come. A lift that goes 1, 2, 3, 4, 3, 2 and again forever passes everyone.']
  },
  {
    kind: 'tiny', name: 'Tiny Lift',
    brief: ['Grandpa Gears says the best programs are short.', 'Can you run my house with very few blocks?'],
    goal: 'Serve every floor with at most 6 blocks.',
    floors: 4, lifts: [{ type: 'old', at: 1 }],
    flows: [{ from: 'any', to: 'any', perMin: 2.6, t0: 0, t1: 180, who: [['neighbour', 3], ['kid', 1]] }],
    seed: 77,
    stars: [[{ k: 'all' }, { k: 'blocks', n: 6 }], { k: 'avgWait', s: 24 }, { k: 'maxWait', s: 48 }],
    concept: 'tiny', fact: 'smallest',
    hints: ['Does the lift really need to stop on the way down? People going down can also get on when it passes going up.']
  },
  {
    kind: 'exam', name: 'Grandma\'s Birthday',
    brief: ['It\'s my birthday! Twelve guests are coming up to my flat on floor 4.', 'Some of them leave early. And the neighbours still need the lift too.'],
    goal: 'Get the party going: deliver the guests and the neighbours.',
    floors: 4, lifts: [{ type: 'old', at: 1 }],
    schedule: [
      { t: 25, who: 'neighbour', name: 'Mr. Novak', from: 2, to: 1 },
      { t: 4, who: 'chef', from: 1, to: 4 },
      { t: 120, who: 'neighbour', name: 'Mrs. Lee', from: 3, to: 1 }
    ],
    flows: [
      { from: 1, to: 4, perMin: 4, t0: 0, t1: 160, who: 'guest' },
      { from: 4, to: 1, perMin: 1.5, t0: 100, t1: 220, who: 'guest' }
    ],
    stars: [{ k: 'share', p: 0.9 }, { k: 'noGaveUp' }, { k: 'avgWait', s: 20 }],
    concept: 'exam', fact: 'oldest',
    hints: ['Most guests go from 1 to 4. People going up can wait at 1; on the way down stop at 3 and 2 for the neighbours.']
  }
]);
