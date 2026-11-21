'use strict';

// Arlanda Rising — the random events of an ops stage (SPEC.md "Events"), as plain data. From chapter 5 a mission may
// turn them on (setup `events`): each ops stage then gets one at most, by EVENT_CHANCE (× the difficulty's weather), at
// a random moment, picked by weight from those of the month. Each one has:
//   do       what happens (sim/events.js): storm (every runway closed while lightning is near), wildlife (the arrivals'
//            runway closed until the animals are gone), secPause (the security lanes stop), vipStand (a contact stand kept
//            for a state flight), emergency (an aircraft asks to land first), update (a system restarts after a bad update)
//   min      [from, to] game minutes it lasts
//   months   the months it may come in (none: any)
//   weight   how often, against the others
//   pax      Passengers points when it is over (a happy end)
//   needs    (session 6) a flag of S.airport it needs (`cyber`: from chapter 7)
//   text     the line on screen
// Random events never blame a real company: a breakdown is "a system", a delay the weather or the animals.

const RANDOM_EVENTS = [
  { id: 'thunder', do: 'storm', min: [12, 25], months: [5, 6, 7, 8, 9], weight: 3,
    text: 'A thunderstorm over the airport: nothing lands or takes off while the lightning is near.' },
  { id: 'moose', do: 'wildlife', min: [8, 15], weight: 2,
    text: 'A moose has found a gap in the fence and walks onto the runway. The runway is closed until it is chased off.' },
  { id: 'geese', do: 'wildlife', min: [5, 10], months: [3, 4, 5, 9, 10], weight: 2,
    text: 'A flock of geese circles over the runway. The bird controllers scare them away with a bang.' },
  { id: 'lostChild', do: 'secPause', min: [5, 8], weight: 2, pax: 3,
    text: 'A little boy is lost at security! The lanes stop while everybody looks — he is found in the toy shop, eating a bun.' },
  { id: 'medical', do: 'emergency', weight: 2,
    text: 'A passenger is ill on board: an aircraft asks to land first, and the ambulance waits at the stand.' },
  { id: 'vip', do: 'vipStand', min: [70, 80], weight: 1,
    text: 'A state visit: a stand by the terminal is kept free for the visitors\' aircraft.' },
  { id: 'update', do: 'update', weight: 1,
    text: 'A software update went wrong overnight: a system restarts in the middle of the morning.' },
  // session 6: from chapter 7 (setup `cyber`) — an attack on the airport's network takes the linked systems down together
  { id: 'cyber', do: 'cyber', min: [30, 50], weight: 1.5, needs: 'cyber',
    text: 'A cyber attack on the airport\'s network: the linked systems go down together. The IT people cut them off and clean them.' }
];
