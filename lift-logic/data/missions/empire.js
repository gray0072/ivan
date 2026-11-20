'use strict';

// Lift Logic — chapter 8, the Empire State Building in New York: up to 102 floors, banks of fast lifts that each
// serve the lobby and their own zone, express trips, the observatory on 86 and the top deck on 102. Zones,
// `go express`, keeping an own list sorted, the SCAN algorithm. See data/missions/missions.js for the fields.

const RANGE = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const ZONE = (lo, hi, at = 1) => ({ type: 'sky', zone: [lo, hi], lobby: true, at });
// an office day on the floors of some zones ([[lo, hi], …]): in from the lobby, out to it, and between the floors
// of one zone (from one zone to another people would change lifts in the lobby — they take two trips)
const ESB_DAY = (zones, up, down, between, t1, t0 = 0) => {
  const all = [].concat(...zones.map((z) => RANGE(z[0], z[1])));
  return [
    { from: 1, to: all, perMin: up, t0, t1, who: [['office', 6], ['boss', 1]] },
    { from: all, to: 1, perMin: down, t0, t1, who: 'office' }
  ].concat(zones.map((z) => ({ from: RANGE(z[0], z[1]), to: RANGE(z[0], z[1]), perMin: between * (z[1] - z[0] + 1) / all.length, t0, t1, who: 'office' })))
    .filter((f) => f.perMin > 0);
};
const Z3 = [[2, 20], [21, 40], [41, 60]];
// visitors to the observatory (86) and the top deck (102, changing lifts on 86)
const VIA_86 = (from, to) => (from === 102 || to === 102 ? 86 : null);
const VISITORS = (up, down, t1, t0 = 0) => [
  { from: 1, to: [86, 86, 102], perMin: up, t0, t1, via: VIA_86, who: 'tourist' },
  { from: [86, 86, 102], to: 1, perMin: down, t0, t1, via: VIA_86, who: 'tourist' }
];

addMissions('empire', [
  {
    kind: 'build', name: 'Too Many Floors',
    brief: ['Welcome to New York! We start small: thirty floors of offices and one fast lift.', 'Morning: everybody comes in through the lobby. Can one lift keep up?'],
    goal: 'Get as many people to their offices as one lift can.',
    floors: 30, clock: 8 * 60 + 30, lifts: [{ type: 'sky', at: 1 }],
    flows: ESB_DAY([[2, 30]], 4, 1, 1, 240),
    stars: [{ k: 'share', p: 0.8 }, { k: 'avgWait', s: 65 }, { k: 'maxWait', s: 195 }],
    newBlocks: [], concept: 'roundTrip', fact: 'empireBuilt',
    hints: ['A round trip from the lobby to floor 30 and back takes a long time. Stop on the way for everyone going your way, and when there is nothing to do, wait in the lobby — that is where the people come in.']
  },
  {
    kind: 'build', name: 'Zones',
    brief: ['Sixty floors and three lifts. Each lift serves the lobby and only its own zone: 2–20, 21–40 or 41–60.', 'A lift that tries to go to a floor outside its zone gets nowhere.'],
    goal: 'Each lift takes only the calls of its zone.',
    floors: 60, clock: 8 * 60 + 30, lifts: [ZONE(2, 20), ZONE(21, 40), ZONE(41, 60)],
    flows: ESB_DAY(Z3, 12, 2, 1.5, 240),
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'noErrors', text: 'No block goes wrong' }, { k: 'avgWait', s: 39 }],
    newBlocks: ['canStop', 'zoneLow', 'zoneHigh'], concept: 'zones', fact: 'empireLifts',
    hints: ['"can I stop at (floor)?" is true only for the lobby and the floors of this lift\'s zone. Add a call to the plan only when it is.']
  },
  {
    kind: 'build', name: 'Express to the Top',
    brief: ['Eighty floors now. The lifts of the upper zones pass dozens of floors where they never stop.', 'On such a trip a lift can run at its express speed — but only if it promises not to stop on the way.'],
    goal: 'Use express trips through the floors where nobody gets on.',
    floors: 80, clock: 8 * 60 + 30, lifts: [ZONE(2, 30), ZONE(31, 55), ZONE(56, 80)],
    flows: ESB_DAY([[2, 30], [31, 55], [56, 80]], 7, 2, 1, 240),
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'uses', ops: ['goExpress'], text: 'Make express trips' }, { k: 'avgWait', s: 25 }],
    newBlocks: ['goExpress'], concept: 'express', fact: 'empireSpeed',
    hints: ['"go express to floor" drives at the express speed and stops nowhere on the way. Use it from the lobby up to the lowest floor of the zone ("my zone lowest"), and when the lift has nothing to do high up, express back to the lobby.']
  },
  {
    kind: 'build', name: 'Sort the Plan',
    brief: ['The old freight lift brings the morning mail carts up from the lobby. Like the mall\'s service lift, its plan holds one floor.', 'In your own list the floors come in the order they were pressed: 37, 4, 22, 9… That is a lot of riding up and down!'],
    goal: 'Keep your own list sorted, and go through it from the bottom up.',
    floors: 40, clock: 7 * 60, lifts: [{ type: 'sky', at: 1 }], planMax: 1,
    schedule: (() => {
      // every fifty seconds a wave of five comes in with mail for floors all over the building
      const s = [];
      for (let k = 0; k < 6; k++) for (let j = 0; j < 5; j++) s.push({ t: 5 + k * 50 + j * 0.7, who: 'office', from: 1, to: 2 + ((k * 13 + j * 23 + j * j * 7) % 39) });
      return s;
    })(),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 40 }, { k: 'maxWait', s: 80 }],
    newBlocks: [], concept: 'sorting', fact: 'mailChute',
    hints: ['To put a floor at its place: start at item 1 and go on while the item is smaller than the floor; insert the floor there. Then the list is always sorted.', 'When the plan is empty: if the list has floors, go to item 1 and delete it; else, if someone waits in the lobby, go there.']
  },
  {
    kind: 'beat', name: 'SCAN',
    brief: ['The freight lift again, in the twenty-floor annex — now people call it from every floor, going up and going down.', 'Real lifts use a famous rule: go one way as far as there is anything to do, then turn around. Engineers call it SCAN.'],
    goal: 'Go up serving everything on the way, then down: beat the average wait.',
    floors: 20, clock: 11 * 60, lifts: [{ type: 'sky', at: 1 }], planMax: 1,
    flows: [
      { from: 1, to: RANGE(2, 20), perMin: 1, t0: 0, t1: 300, who: 'office', fixed: true },
      { from: RANGE(2, 20), to: 1, perMin: 1, t0: 0, t1: 300, who: 'office', fixed: true },
      { from: RANGE(2, 20), to: RANGE(2, 20), perMin: 1.5, t0: 0, t1: 300, who: 'office', fixed: true }
    ],
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 18 }, { k: 'maxWait', s: 40 }],
    newBlocks: [], concept: 'scan', fact: 'elevatorParadox',
    hints: ['Keep a variable "dir": 1 going up, −1 going down. Going up, the next floor is the first one in your sorted list that is not below the lift; going down, the last one not above it. Nothing that way? Turn around.']
  },
  {
    kind: 'build', name: 'Observatory',
    brief: ['Tourists! Two express lifts go from the lobby to the observatory on 86. From there a small lift climbs to the top deck on 102.', 'The ticket scanners in the lobby tell you who is going all the way up.'],
    goal: 'Take the tourists up and down, with a change of lifts on 86 for the top deck.',
    clock: 10 * 60, lifts: [ZONE(86, 86), ZONE(86, 86), { type: 'standard', zone: [86, 102], at: 86 }],
    flows: VISITORS(9, 6, 240),
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'noErrors', text: 'No block goes wrong' }, { k: 'avgWait', s: 25 }],
    newBlocks: [], concept: 'transfer', fact: 'empireObservatory',
    hints: ['The express lifts can stop only in the lobby and on 86 — go there express. The top lift serves 86 and 102: when tickets to 102 are waiting in the lobby, have it wait on 86.']
  },
  {
    kind: 'fix', name: 'Overlapping Zones',
    brief: ['Lift A serves floors 2–40, lift B floors 20–60. Where they overlap, the program sends only the nearer lift.', 'But some calls between 20 and 40 get no lift at all — mostly when both lifts are waiting in the lobby. Why?'],
    goal: 'Every call where the zones overlap gets exactly one lift.',
    floors: 60, clock: 9 * 60, lifts: [ZONE(2, 40), ZONE(20, 60)],
    flows: ESB_DAY([[2, 60]], 3, 3, 0, 240).map((f) => Object.assign({ fixed: true }, f)),
    start: `when call button pressed (floor) (direction)
if <can I stop at (floor)?> then
  if <<(floor) > (19)> and <(floor) < (41)>> then
    set [other] to ((3) − (my number))
    if <(distance from (current floor) to (floor)) < (distance from (floor of lift (other)) to (floor))> then
      add floor (floor) to plan
  else
    add floor (floor) to plan

when button pressed inside (floor)
add floor (floor) to plan

when I'm about to pass floor (floor)
if <<button (floor) pressed inside?> or <plan contains (floor)?>> then
  stop here

when I'm idle
if <not <(current floor) = (1)>> then
  add floor (1) to plan`,
    stars: [{ k: 'share', p: 0.9 }, { k: 'maxWait', s: 140 }, { k: 'avgWait', s: 32 }],
    newBlocks: [], concept: 'overlap', fact: 'empireWindows',
    hints: ['When both lifts stand in the lobby, they are exactly as far from the call: neither is nearer, so neither goes. Decide who wins a tie — for example lift 1 — or let a lift go when the other one is not nearer.']
  },
  {
    kind: 'beat', name: 'Engineer\'s Challenge',
    brief: ['Sixty floors, three zones, a whole working day in a few minutes: in, between, out.', 'The engineer\'s program is quick. Is yours quicker?'],
    goal: 'Beat the engineer\'s average wait.',
    floors: 60, clock: 8 * 60, clockRate: 1, lifts: [ZONE(2, 20), ZONE(21, 40), ZONE(41, 60)],
    flows: ESB_DAY(Z3, 14, 0, 2, 120).concat(ESB_DAY(Z3, 0, 14, 2, 300, 180)).concat(ESB_DAY(Z3, 3, 3, 3, 180, 120)).map((f) => Object.assign({ fixed: true }, f)),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 34 }, [{ k: 'avgWait', s: 32 }, { k: 'story', id: 'noErrors', text: 'No block goes wrong' }]],
    newBlocks: [], concept: 'engineer', fact: 'empireRace',
    hints: ['Everything of the chapter helps: calls only in your zone, express trips through the empty floors, stops on the way, and the lobby as home in the morning.']
  },
  {
    kind: 'exam', name: 'New Year\'s Eve',
    brief: ['December 31st. The offices go home, the tourists come for the view — and at the end the observatory closes for the night.', 'Two office zones, an express to 86 and the little lift to the top deck. Make it a happy new year!'],
    goal: 'Get the offices home and the tourists up — and down again when the observatory closes.',
    clock: 17 * 60, lifts: [ZONE(2, 40), ZONE(41, 80), ZONE(86, 86), { type: 'standard', zone: [86, 102], at: 86 }],
    events: [{ t: 200, msg: 'closing soon', text: 'The observatory closes in a few minutes — everyone please come down!' }],
    flows: ESB_DAY([[2, 40], [41, 80]], 1.5, 5, 0.5, 200).concat(VISITORS(6, 3, 200)).concat([
      { from: [86, 86, 102], to: 1, perMin: 16, t0: 215, t1: 255, via: VIA_86, who: 'tourist' }
    ]),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 54 }, { k: 'maxWait', s: 215 }],
    newBlocks: [], concept: 'exam', fact: 'empireLights',
    hints: ['Each lift only its zone, express through the empty floors, the top lift waits on 86 when tickets to 102 are in the lobby — and when the observatory closes, send the express lift up to fetch everyone.']
  }
]);
