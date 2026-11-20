'use strict';

// Lift Logic — chapter 3, Grand Sunrise Hotel: eight floors, one lift with a plan. Events (the buttons start
// scripts), the plan, variables, `when I'm about to pass floor` + `stop here`, `when I'm idle` — the lift
// starts to serve itself (collective control). See data/missions/missions.js for the fields.

// guests checking in (from the lobby up) and going out (down to the lobby), and between the floors
const HOTEL_DAY = (up, down, between, t1) => [
  { from: 1, to: 'upper', perMin: up, t0: 0, t1, who: [['hotelGuest', 4], ['bellboy', 1]] },
  { from: 'upper', to: 1, perMin: down, t0: 0, t1, who: 'hotelGuest' },
  { from: 'upper', to: 'upper', perMin: between, t0: 0, t1, who: 'hotelGuest' }
];

addMissions('hotel', [
  {
    kind: 'fill', name: 'Ring the Bell',
    brief: ['Welcome to the Grand Sunrise, darling! Our lift has a plan: a list of floors to stop at.', 'Whenever a guest rings, put that floor in the plan.'],
    goal: 'When a call button is pressed, add that floor to the plan.',
    flows: HOTEL_DAY(2.5, 1.5, 0.5, 150),
    stars: [{ k: 'all' }, { k: 'avgWait', s: 17 }, { k: 'maxWait', s: 60 }],
    start: `when button pressed inside (floor) #lock
add floor (floor) to plan #lock

when call button pressed (floor) (direction) #lock`,
    newBlocks: ['onCall', 'onButton', 'planAdd'], concept: 'events', fact: 'hotelLifts',
    hints: ['Under "when call button pressed" put "add floor … to plan". Tap its slot and pick "floor": the floor whose button was pressed.']
  },
  {
    kind: 'build', name: 'Room Service',
    brief: ['Room service runs all day: waiters, guests, bellboys.', 'Build the whole lift yourself: calls and buttons inside.'],
    goal: 'A complete lift in two scripts: calls and buttons go into the plan.',
    flows: HOTEL_DAY(2, 2, 1.2, 160),
    stars: [{ k: 'all' }, { k: 'avgWait', s: 27 }, { k: 'blocks', n: 4 }],
    newBlocks: ['planFirst', 'planRemove', 'planClear', 'planLength', 'planItem', 'planHas'], concept: 'plan', fact: 'collectiveControl',
    hints: ['Two scripts: one starts with "when call button pressed", one with "when button pressed inside". Both add their floor to the plan.']
  },
  {
    kind: 'build', name: 'Counting Guests',
    brief: ['The concierge wants to know how many stops the lift makes today.', 'Make a variable called "stops" and count every arrival.'],
    goal: 'Serve the guests and count the stops in the variable "stops".',
    flows: HOTEL_DAY(2, 1.5, 0.6, 140),
    stars: [[{ k: 'all' }, { k: 'story', id: 'countStops', text: 'The variable "stops" counts every stop' }], { k: 'avgWait', s: 24 }, { k: 'blocks', n: 6 }],
    newBlocks: ['onArrive', 'setVar', 'changeVar', 'showVar', 'hideVar'], concept: 'variable', fact: 'counterStops',
    hints: ['Variables: "Make a variable" and call it stops. Then "when I arrive at floor" → "change stops by 1". "show variable" puts it on the screen.']
  },
  {
    kind: 'build', name: 'Suitcases',
    brief: ['A tour group arrived with mountains of luggage. Bellboys with suitcases take two places each.', 'A full lift should not stop for people it can\'t take.'],
    goal: 'Deliver everyone; a full lift doesn\'t stop for calls — it comes back for them later.',
    schedule: (() => {
      const s = [];
      // a tour bus: a wave of bellboys with luggage, twice
      for (const t0 of [2, 70]) for (let k = 0; k < 6; k++) s.push({ t: t0 + k * 1.5, who: k % 3 ? 'bellboy' : 'hotelGuest', from: 1, to: 3 + (k * 3 + t0) % 6 });
      return s;
    })(),
    flows: [{ from: 'upper', to: 'any', perMin: 3, t0: 0, t1: 150, who: 'hotelGuest' }],
    stars: [{ k: 'all' }, { k: 'story', id: 'fullStopsMax', n: 0, text: 'The full lift never stops for nothing' }, { k: 'avgWait', s: 19 }],
    newBlocks: ['full', 'loadPct', 'onIdle', 'onDoorsClose'], concept: 'full', fact: 'overload',
    hints: ['When a call comes and the lift is full, don\'t add the floor. When the lift is idle again, look for calls that are still lit.']
  },
  {
    kind: 'fix', name: 'Lost Calls',
    brief: ['Guests complain: sometimes they ring and ring and the lift never comes!', 'It seems to happen when the lift stands somewhere with its doors open…'],
    goal: 'Find why calls get lost, and fix it.',
    flows: HOTEL_DAY(2.5, 2, 0.8, 150),
    stars: [{ k: 'all' }, { k: 'avgWait', s: 24 }, { k: 'blocks', n: 4 }],
    start: `when call button pressed (floor) (direction)
if <not <doors open?>> then
  add floor (floor) to plan

when button pressed inside (floor)
add floor (floor) to plan`,
    concept: 'bug2', fact: 'doorTimes',
    hints: ['A call button lights up only once. If the program ignores it at that moment, nobody will ever ask again.']
  },
  {
    kind: 'build', name: 'On the Way',
    brief: ['Our lift drives right past guests waiting on the way!', 'Grandpa Gears says there is a block for that.'],
    goal: 'Pick up people on the way: stop where you pass a call going your way, or a pressed button.',
    flows: HOTEL_DAY(3, 2.5, 1, 160),
    stars: [{ k: 'all' }, { k: 'avgWait', s: 18 }, { k: 'maxWait', s: 65 }],
    newBlocks: ['onPass', 'stopHere'], concept: 'onTheWay', fact: 'scan',
    hints: ['"when I\'m about to pass floor" runs just before the lift passes a floor. If someone there waits to go your way, or someone inside pressed it: "stop here".']
  },
  {
    kind: 'beat', name: 'No Zig-Zag',
    brief: ['The lift went 1 → 8 → 2 → 7 this morning. The guests got seasick.', 'Put the floors in a better order!'],
    goal: 'Serve everyone with a short average wait.',
    flows: HOTEL_DAY(3, 3, 1.5, 160),
    stars: [{ k: 'all' }, { k: 'story', id: 'wrongWayMax', n: 2, text: 'At most {n} people ride the wrong way first', params: { n: 2 } }, { k: 'avgWait', s: 21 }],
    newBlocks: [], concept: 'order', fact: 'oneTwoChimes',
    hints: ['A floor on the way, between the lift and the first floor of the plan, can go first in the plan.']
  },
  {
    kind: 'beat', name: 'Night Porter',
    brief: ['At night the guests come back from the city, all through the lobby.', 'Where should a lift wait when nobody needs it?'],
    goal: 'Make the guests\' wait in the lobby short.',
    flows: [
      { from: 1, to: 'upper', perMin: 3.5, t0: 0, t1: 180, who: 'hotelGuest' },
      { from: 'upper', to: 1, perMin: 0.8, t0: 0, t1: 180, who: 'hotelGuest' }
    ],
    clock: 22 * 60,
    stars: [{ k: 'all' }, { k: 'avgWait', s: 8 }, { k: 'maxWait', s: 30 }],
    concept: 'idle', fact: 'parking',
    hints: ['"when I\'m idle" runs when the lift has nothing to do. Send it to the lobby — unless it is already there.']
  },
  {
    kind: 'exam', name: 'The Wedding',
    brief: ['A wedding in our ballroom on floor 8! Guests, suitcases, and a cake as tall as a child.', 'Everything must go perfectly, darling.'],
    goal: 'Run the wedding day: guests up to the ballroom, the cake safe, everyone home.',
    schedule: [{ t: 20, who: 'chef', from: 1, to: 8 }],
    flows: [
      { from: 1, to: 8, perMin: 5, t0: 0, t1: 120, who: [['guest', 5], ['bellboy', 1]] },
      { from: 'upper', to: 'any', perMin: 2, t0: 0, t1: 200, who: 'hotelGuest' },
      { from: 8, to: [1, 2, 3, 4, 5, 6, 7], perMin: 3, t0: 130, t1: 220, who: 'guest' }
    ],
    stars: [[{ k: 'share', p: 0.9 }, { k: 'story', id: 'delivered', who: 'chef', text: 'The cake arrives in one piece' }], { k: 'noGaveUp' }, { k: 'avgWait', s: 20 }],
    concept: 'exam', fact: 'weddingLift',
    hints: ['Use everything: calls and buttons into the plan, stop on the way, wait in the lobby while the guests arrive.']
  }
]);
