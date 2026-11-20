'use strict';

// Lift Logic — chapter 6, Mega Mall: three car park levels under five shop floors (−3 … 5, no floor 0), three
// glass lifts. Lists, `for each`, negative numbers and robustness: an own to-do list, carts that take two
// places, the prankster, a sale at ten, a lift out of order. See data/missions/missions.js for the fields.

const MALL_LIFTS = [{ type: 'glass', at: 1 }, { type: 'glass', at: -1 }, { type: 'glass', at: 3 }];
const PARK = [-3, -2, -1], SHOPS = [2, 3, 4, 5];
// a shopping day: from the car park and the street up to the shops, back down, and between the shops
const MALL_DAY = (park, street, between, t1, t0 = 0) => [
  { from: PARK, to: SHOPS, perMin: park, t0, t1, who: [['shopper', 2], ['teen', 1]] },
  { from: SHOPS, to: PARK, perMin: park * 0.8, t0, t1, who: [['shopper', 3], ['teen', 1]] },
  { from: 1, to: SHOPS, perMin: street, t0, t1, who: [['teen', 2], ['shopper', 1]] },
  { from: SHOPS, to: 1, perMin: street * 0.8, t0, t1, who: 'teen' },
  { from: SHOPS, to: SHOPS, perMin: between, t0, t1, who: [['teen', 1], ['shopper', 1]] }
];
const TOMMY = (t, from) => ({ t, who: 'prankster', from, to: 5 });

addMissions('mall', [
  {
    kind: 'build', name: 'Underground',
    brief: ['Welcome to the Mega Mall! Below the street are three car park levels: −1, −2 and −3. There is no floor 0.', 'Shoppers come from every level. Your lifts used to wait in the lobby — is that still a good idea here?'],
    goal: 'Serve the shoppers, from the car park and from the street.',
    lifts: MALL_LIFTS,
    flows: MALL_DAY(6, 2, 1.5, 220),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 9 }, { k: 'maxWait', s: 30 }],
    newBlocks: ['mod', 'round', 'join'], concept: 'negative', fact: 'basements',
    hints: ['Floors below the street have negative numbers: −1, −2, −3. People come from all three car park levels and the street, so a lift sent back to the lobby often drives for nothing — let an idle lift stay where it is.']
  },
  {
    kind: 'build', name: 'My Own Plan',
    brief: ['The mall\'s old service lift has a tiny memory: its plan holds only one floor!', 'Keep the rest in a list of your own and give it the floors one by one.'],
    goal: 'Keep the floors to visit in your own list.',
    lifts: [{ type: 'glass', at: 1 }],
    planMax: 1,
    flows: MALL_DAY(1.6, 1, 0.6, 220),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 30 }, { k: 'maxWait', s: 80 }],
    newBlocks: ['listAdd', 'listDelete', 'listItem', 'listLength', 'listHas', 'listClear', 'listInsert', 'listIndex'], concept: 'list', fact: 'relays',
    hints: ['Make a list called todo. Calls and buttons add their floor to it (if it isn\'t there yet). When the plan is empty, put item 1 of todo into the plan and delete it from the list.']
  },
  {
    kind: 'build', name: 'Shopping Carts',
    brief: ['Saturday: everybody pushes a cart, and a cart takes two places.', 'A lift that is nearly full still stops for a shopper with a cart — and has no room for it.'],
    goal: 'Deliver everyone; a nearly full lift doesn\'t stop for calls it can\'t take.',
    lifts: [{ type: 'glass', at: -1 }],
    schedule: (() => {
      // a family wave: four carts and a teenager fill 9 of the 10 places — and a few seconds later one more
      // shopper with a cart waits on the way, going the same way
      const s = [];
      for (let k = 0; k < 5; k++) {
        const t = 5 + k * 55, up = k % 2 === 0;
        const from = up ? PARK[k % 3] : SHOPS[3 - (k % 2)];
        for (let j = 0; j < 4; j++) s.push({ t: t + j * 0.6, who: 'shopper', from, to: up ? SHOPS[(k + j) % 4] : PARK[(k + j) % 3] });
        s.push({ t: t + 2.6, who: 'teen', from, to: up ? 5 : 1 });
        s.push({ t: t + 5, who: 'shopper', from: up ? 1 : 2, to: up ? 4 : -1 });
      }
      return s;
    })(),
    flows: [{ from: 1, to: SHOPS, perMin: 0.6, t0: 0, t1: 240, who: 'teen' }],
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'fullStopsMax', n: 3, text: 'A full lift stops for nothing at most {n} times', params: { n: 3 } }, { k: 'avgWait', s: 16 }],
    newBlocks: [], concept: 'room', fact: 'cartWalkways',
    hints: ['"load %" says how full the lift is. A cart needs 20 % of the room. In "when I\'m about to pass floor", stop for a call only when the load is 80 % or less.']
  },
  {
    kind: 'build', name: 'The Prankster',
    brief: ['Tommy is back — and the mall has even more buttons!', 'He presses every button inside, and the lift stops on every floor for nobody.'],
    goal: 'When few people are inside but many buttons are lit, cancel them.',
    lifts: MALL_LIFTS,
    schedule: [TOMMY(15, 1), TOMMY(60, -2), TOMMY(105, 1), TOMMY(150, -1), TOMMY(195, -3)],
    flows: MALL_DAY(4, 2, 1.5, 220),
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'prankStopsMax', n: 4, text: "At most {n} stops for Tommy's buttons", params: { n: 4 } }, { k: 'avgWait', s: 13 }],
    newBlocks: ['buttonsCount', 'cancelButtons'], concept: 'antiNuisance', fact: 'antiNuisance',
    hints: ['"buttons pressed inside" counts the lit buttons. When the doors close with more than 3 buttons lit and the lift almost empty, take those floors out of the plan and "cancel buttons inside" — the real riders press their floor again.']
  },
  {
    kind: 'tiny', name: 'For Each Floor',
    brief: ['The call bell of the car park lift is broken: "when call button pressed" doesn\'t ring.', 'The lift has to look at every floor itself — in as few blocks as you can.'],
    goal: 'Visit every floor with a lit button, in at most 15 blocks.',
    lifts: [{ type: 'glass', at: 1 }],
    bellBroken: true,
    flows: MALL_DAY(1.6, 1, 0.6, 220),
    stars: [{ k: 'share', p: 0.9 }, { k: 'blocks', n: 15 }, { k: 'avgWait', s: 30 }],
    newBlocks: ['forEach', 'stop'], concept: 'forEach', fact: 'groundButton',
    hints: ['"for each f from −3 to 5" goes through every floor. But there is no floor 0 — skip it with "not f = 0", and go to the floors where a button is lit.']
  },
  {
    kind: 'build', name: 'Sale at Ten!',
    brief: ['At ten o\'clock the big sale opens on floor 4. Crowds will pour in from the street and the car park.', 'Be ready before the doors open!'],
    goal: 'Have the lifts waiting at the entrances at ten, and take the crowd to the sale.',
    lifts: MALL_LIFTS,
    clock: 9 * 60 + 58,
    flows: MALL_DAY(2, 1, 1, 220).concat([
      { from: [1, -1, -2], to: 4, perMin: 24, t0: 120, t1: 160, who: [['shopper', 1], ['teen', 2]] }
    ]),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 15 }, { k: 'maxWait', s: 45 }],
    newBlocks: [], concept: 'clockList', fact: 'blackFriday',
    hints: ['Make a list of the entrances: 1, −1, −2. "when clock is 9:59" — each lift goes to "item (my number) of entrances".']
  },
  {
    kind: 'fix', name: 'Lost in the Car Park',
    brief: ['Shoppers down in the car park wait and wait — and then a lift comes all the way from the top!', 'Something is wrong with how the lifts decide who is nearest.'],
    goal: 'Find the bug with the negative numbers, and fix it.',
    lifts: MALL_LIFTS,
    flows: MALL_DAY(6, 1.5, 1, 220),
    start: `when call button pressed (floor) (direction)
set [best] to 1
for each [k] from (2) to (lifts in group)
  if <((floor) − (floor of lift (k))) < ((floor) − (floor of lift (best)))> then
    set [best] to (k)
if <(best) = (my number)> then
  add floor (floor) to plan

when button pressed inside (floor)
add floor (floor) to plan

when I'm idle
if <not <(current floor) = ((0) − (my number))>> then
  add floor ((0) − (my number)) to plan`,
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 14 }, { k: 'maxWait', s: 50 }],
    newBlocks: [], concept: 'bug5', fact: 'parkingSigns',
    hints: ['(floor) − (floor of lift) is negative when the lift is above the call — and a negative number is always "smaller". How far a lift is must never be negative: "distance from … to …".']
  },
  {
    kind: 'build', name: 'Out of Order',
    brief: ['Lift B is going out of order an hour after opening — the mechanic is on the way.', 'Calls that only lift B would take are never answered!'],
    goal: 'When a lift is out of order, the others take its calls.',
    lifts: MALL_LIFTS,
    breakdowns: [{ lift: 2, t: 60 }],
    flows: MALL_DAY(3, 1.2, 1, 230),
    stars: [{ k: 'share', p: 0.9 }, { k: 'avgWait', s: 15 }, { k: 'maxWait', s: 50 }],
    newBlocks: ['working'], concept: 'robust', fact: 'inspection',
    hints: ['"lift (k) working?" is false for a lift out of order. When you look for the nearest lift, skip the ones that are not working.']
  },
  {
    kind: 'exam', name: 'Black Friday',
    brief: ['Black Friday! The sale opens at ten, carts everywhere, Tommy on the loose — and at half past ten lift C breaks down.', 'This is the biggest day of the year. Ms. Sterling is counting on you.'],
    goal: 'Run Black Friday: everyone served, few empty stops, short waits.',
    lifts: MALL_LIFTS,
    clock: 9 * 60 + 58,
    breakdowns: [{ lift: 3, t: 150 }],
    schedule: [TOMMY(40, 1), TOMMY(170, -1), TOMMY(240, 1)],
    flows: MALL_DAY(3, 1.5, 1, 300).concat([
      { from: [1, -1, -2], to: 4, perMin: 18, t0: 120, t1: 160, who: [['shopper', 2], ['teen', 1]] },
      { from: 4, to: PARK, perMin: 6, t0: 170, t1: 300, who: 'shopper' }
    ]),
    stars: [{ k: 'share', p: 0.9 }, { k: 'story', id: 'prankStopsMax', n: 4, text: "At most {n} stops for Tommy's buttons", params: { n: 4 } }, { k: 'avgWait', s: 18 }],
    newBlocks: [], concept: 'exam', fact: 'firstEscalator',
    hints: ['Everything at once: the nearest working lift takes the call, a nearly full lift passes by, Tommy\'s buttons get cancelled, and at 9:59 the lifts wait at the entrances.']
  }
]);
