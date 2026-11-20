'use strict';

// Lift Logic — chapter 7, the Eiffel Tower in Paris: the ground (1), the brasserie (2), the viewing deck (3) and
// the summit (4). Slow pillar lifts climb from the ground to the viewing deck, summit lifts from the viewing
// deck to the top, so a visitor to the summit changes lifts on floor 3. Own blocks with inputs, changing lifts,
// tickets scanned at the entrance, the weather and the building's announcements. See
// data/missions/missions.js for the fields.

const PILLAR = (at = 1) => ({ type: 'pillar', zone: [1, 3], at });
const SUMMIT = (at = 3) => ({ type: 'summit', zone: [3, 4], at });
// a visitor to or from the summit changes lifts on the viewing deck
const VIA_DECK = (from, to) => (from === 4 || to === 4 ? 3 : null);
// a day of visitors: up from the ground, down to it, a few between the brasserie and the deck
const TOWER_DAY = (up, down, t1, t0 = 0, top = 2) => [
  { from: 1, to: [2, 3, 3].concat(Array(top).fill(4)), perMin: up, t0, t1, via: VIA_DECK, who: 'tourist' },
  { from: [2, 3, 3].concat(Array(top).fill(4)), to: 1, perMin: down, t0, t1, via: VIA_DECK, who: 'tourist' },
  { from: [2, 3], to: [2, 3], perMin: up * 0.1, t0, t1, who: 'tourist' }
];

addMissions('eiffel', [
  {
    kind: 'build', name: 'Bonjour, Paris!',
    brief: ['Bienvenue! The pillar lifts of the Eiffel Tower are slow and the trips are long: the ground, the brasserie (2), the viewing deck (3).', 'A lift that leaves the ground half empty wastes a long trip. But nobody likes to wait either.'],
    goal: 'Take the visitors up and down. Fill the long trips well.',
    floors: 3, clock: 9 * 60 + 30,
    lifts: [{ type: 'pillar', at: 1 }],
    flows: [
      { from: 1, to: [2, 3, 3], perMin: 7, t0: 0, t1: 240, who: 'tourist' },
      { from: [2, 3, 3], to: 1, perMin: 4, t0: 30, t1: 240, who: 'tourist' }
    ],
    stars: [{ k: 'share', p: 0.9 }, { k: 'energy', e: 59 }, { k: 'avgWait', s: 24 }],
    newBlocks: [], concept: 'longTrips', fact: 'eiffelBuilt',
    hints: ['Each trip up takes a long time. When the lift stops on the ground, "hold doors" a few seconds more, so more visitors get on before it leaves.']
  },
  {
    kind: 'build', name: 'Change at the Second',
    brief: ['Now the whole tower: the pillar lift goes from the ground to the viewing deck (3), the summit lift from the deck to the top (4).', 'Visitors to the summit change lifts on floor 3. Both lifts run the same program — and each can only reach its own floors.'],
    goal: 'Serve the whole tower with two lifts that never ask for a floor they can\'t reach.',
    clock: 10 * 60, lifts: [PILLAR(), SUMMIT()],
    flows: TOWER_DAY(5, 3, 240),
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'noErrors', text: 'No block goes wrong' }, { k: 'avgWait', s: 27 }],
    newBlocks: [], concept: 'banks', fact: 'eiffelLifts',
    hints: ['"bottom floor" and "top floor" tell each lift its own range: 1 to 3 for the pillar lift, 3 to 4 for the summit lift. Add a call only when its floor is in the range.', 'On floor 3 the ▲ call is for the summit lift and the ▼ call for the pillar lift: at your top floor ignore ▲, at your bottom floor ignore ▼.']
  },
  {
    kind: 'build', name: 'My First Block',
    brief: ['The call bells of the old pillars ring in the ticket office, not in the lifts — "when call button pressed" stays silent.', 'Each of the four lifts must look at the buttons itself, again and again. Write that check once, as a block of your own.'],
    goal: 'Make a block that looks for calls, and use it in more than one place.',
    clock: 11 * 60, lifts: [PILLAR(), PILLAR(2), SUMMIT(), SUMMIT(4)],
    bellBroken: true,
    flows: TOWER_DAY(7, 5, 240),
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'uses', ops: ['call'], text: 'Use a block of your own' }, { k: 'avgWait', s: 17 }],
    newBlocks: [], ownBlocks: true, concept: 'ownBlock', fact: 'gustave',
    hints: ['In My Blocks, "Make a block" and call it "look for calls". Under its define hat: for each floor from "bottom floor" to "top floor", add the floor to the plan if a call is lit there that this lift can take.', 'Then use your block in a "forever" loop (with a short wait) and in "when doors close".']
  },
  {
    kind: 'build', name: 'Tickets, Please',
    brief: ['At the entrance every visitor scans a ticket: to the brasserie, to the viewing deck or all the way to the summit.', 'The summit lift can read the scanners. Why wait at the top when summit visitors are on their way up?'],
    goal: 'Have the summit lift ready on the deck when summit visitors are coming.',
    clock: 11 * 60, lifts: [PILLAR(), SUMMIT(4)],
    // the morning brings summit visitors up, the afternoon takes them down again
    flows: [
      { from: 1, to: [2, 3, 4, 4, 4], perMin: 5, t0: 0, t1: 150, via: VIA_DECK, who: 'tourist' },
      { from: [2, 3, 4], to: 1, perMin: 1, t0: 0, t1: 150, via: VIA_DECK, who: 'tourist' },
      { from: 1, to: [2, 3], perMin: 1.5, t0: 150, t1: 280, who: 'tourist' },
      { from: [2, 3, 4, 4, 4], to: 1, perMin: 5, t0: 130, t1: 280, via: VIA_DECK, who: 'tourist' }
    ],
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'uses', ops: ['tickets'], text: 'Read the tickets' }, { k: 'avgWait', s: 25 }],
    newBlocks: ['tickets'], concept: 'tickets', fact: 'eiffelTickets',
    hints: ['"tickets to (4)" counts the visitors at the entrance with a summit ticket. When the summit lift has nothing to do and "tickets to (4)" is more than 0, send it down to floor 3 to wait for them.']
  },
  {
    kind: 'build', name: 'Wind at the Top',
    brief: ['A storm is coming. When the wind gets too strong, the summit closes and everybody up there has to come down.', 'The tower tells your lifts when the weather changes. React before the crowd is at the doors!'],
    goal: 'When the wind comes, bring the summit visitors down fast.',
    clock: 14 * 60, lifts: [PILLAR(), PILLAR(2), SUMMIT(), SUMMIT(4)],
    events: [
      { t: 100, weather: 'windy', text: 'Wind warning! The summit closes — everyone up there must come down.' },
      { t: 210, weather: 'calm', text: 'The wind has dropped. The summit is open again.' }
    ],
    // clouds in the afternoon: visitors leave the summit; then the storm's crowd walks to the summit lifts
    flows: [
      { from: 1, to: [2, 3], perMin: 5, t0: 0, t1: 240, who: 'tourist' },
      { from: 4, to: 1, perMin: 3, t0: 0, t1: 100, via: 3, who: 'tourist' },
      { from: [2, 3], to: 1, perMin: 2.5, t0: 0, t1: 240, who: 'tourist' },
      { from: 4, to: 1, perMin: 30, t0: 120, t1: 160, via: 3, who: 'tourist' },
      { from: 1, to: 4, perMin: 3, t0: 210, t1: 260, via: 3, who: 'tourist' }
    ],
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'uses', ops: ['onWeather'], text: 'React to the weather' }, { k: 'maxWait', s: 55 }],
    newBlocks: ['onWeather'], concept: 'outside', fact: 'eiffelWind',
    hints: ['"when weather changes" runs when the wind comes; its input "weather" is "windy" or "calm". Then send the summit lifts up to floor 4 at once, and the pillar lifts to floor 3, where the crowd will change lifts.']
  },
  {
    kind: 'tiny', name: 'Blocks With Inputs',
    brief: ['The ticket-office bells again — but this time Grandpa Gears wants it short and neat.', 'A block can have an input, like "check floor (3)": the same block, any floor.'],
    goal: 'Check the floors with a block that has a floor input, in at most 28 blocks.',
    clock: 15 * 60, lifts: [PILLAR(), SUMMIT()],
    bellBroken: true,
    flows: TOWER_DAY(4, 3, 240),
    stars: [{ k: 'share', p: 0.9 }, [{ k: 'blocks', n: 28 }, { k: 'story', id: 'ownInput', text: 'Use a block of your own with an input' }], { k: 'avgWait', s: 31 }],
    newBlocks: [], concept: 'inputs', fact: 'eiffelPaint',
    hints: ['"Make a block" called "check floor" and add a number input "f". Inside: if a call is lit on floor f that this lift can take, add f to the plan.', 'A pillar lift has three floors, a summit lift two: "check floor (bottom floor)", "check floor ((bottom floor) + (1))" and "check floor (top floor)" cover both.']
  },
  {
    kind: 'fix', name: 'The Sightseer Loop',
    brief: ['A quiet evening. The pillar lift waits on the ground for a full cabin — and waits — and waits.', 'Its block "wait for a full cabin" calls itself again and again. When does it ever stop?'],
    goal: 'Give the block a way out, so the lift leaves even when the cabin isn\'t full.',
    clock: 21 * 60, lifts: [PILLAR(), SUMMIT()],
    flows: TOWER_DAY(3, 2.5, 240),
    start: `define wait for a full cabin
if <(load %) < (50)> then
  hold doors (1) seconds
  wait (1) seconds
  wait for a full cabin

when call button pressed (floor) (direction)
if <<not <(floor) < (bottom floor)>> and <not <(floor) > (top floor)>>> then
  if <not <<(floor) = (top floor)> and <(direction) = [up]>>> then
    if <not <<(floor) = (bottom floor)> and <(direction) = [down]>>> then
      add floor (floor) to plan

when button pressed inside (floor)
add floor (floor) to plan

when I arrive at floor (floor)
if <(floor) = (1)> then
  wait for a full cabin`,
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'noErrors', text: 'No block goes wrong' }, { k: 'avgWait', s: 27.5 }],
    newBlocks: [], concept: 'recursion', fact: 'eiffelStairs',
    hints: ['A block that calls itself needs a way to stop. Give it a number input — "wait up to (s) seconds" — that gets one smaller on every call, and stop when it reaches 0. Or use a plain "hold doors" with a fixed time.']
  },
  {
    kind: 'beat', name: 'Engineer\'s Challenge',
    brief: ['A full summer day at the tower, two pillar lifts and two summit lifts.', 'The engineer has a very good program. Can yours wait less?'],
    goal: 'Beat the engineer\'s average wait.',
    clock: 10 * 60, lifts: [PILLAR(), PILLAR(2), SUMMIT(), SUMMIT(4)],
    flows: TOWER_DAY(8, 6, 300).map((f) => Object.assign({ fixed: true }, f)),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 18 }, [{ k: 'avgWait', s: 17.2 }, { k: 'energy', e: 240 }]],
    newBlocks: [], concept: 'engineer', fact: 'eiffelVisitors',
    hints: ['Put together what you know: each lift takes only its own calls, stops on the way, holds the doors on the ground, and the summit lifts read the tickets.']
  },
  {
    kind: 'exam', name: 'Bastille Day',
    brief: ['The 14th of July! Paris celebrates, the tower is full, and tonight the fireworks are launched from it.', 'Before the show the tower closes: when the announcement comes, everybody must come down.'],
    goal: 'Run the busiest evening of the year, and empty the tower before the fireworks.',
    clock: 21 * 60, lifts: [PILLAR(), PILLAR(2), SUMMIT(), SUMMIT(4)],
    events: [{ t: 180, msg: 'closing soon', text: 'Announcement: the tower closes for the fireworks — everyone please come down!' }],
    flows: TOWER_DAY(8, 4, 180).concat([
      { from: 4, to: 1, perMin: 24, t0: 200, t1: 240, via: 3, who: 'tourist' },
      { from: [2, 3, 3], to: 1, perMin: 16, t0: 196, t1: 236, who: 'tourist' }
    ]),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 19 }, { k: 'maxWait', s: 55 }],
    newBlocks: ['onBuildingMsg'], concept: 'exam', fact: 'eiffelFireworks',
    hints: ['"when message from building [closing soon]" runs when the announcement comes: send the summit lifts up and the pillar lifts to the deck, and keep them there — the crowd is coming down.']
  }
]);
