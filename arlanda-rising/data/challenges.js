'use strict';

// Arlanda Rising — the Challenge Days (SPEC.md "Free Play and Challenge Days", session 4): longer fixed scenarios of about
// 20 minutes, six peaks of one week or one day, each a stage saved at any moment like a mission. Each has the fields of a
// mission (data/missions/missions.js) and:
//   opens    the mission whose pass opens it
//   stars    the score for ★, ★★ and ★★★ (sim/challenges.js counts it: on-time departures, the Passengers meter at the
//            end, minus what was lost, close calls, delays not announced and bags lost)
// The airport is the owner's arrangement of the year (`requires`, `setup`), the same for every player. The flights of the
// days are the game's own story.

const CH_PEAK = (al, type, n, from, to, turn, base, load) => ({ al, type, n, from, to, turn, base, load: load || 0.85 });
// a peak of the late 1980s (chapter 3's airport) from `from` to three hours later
const CH_PEAK89 = (from, to, base) => [
  CH_PEAK('LF', 'F28', 11, from, to, 35, base), CH_PEAK('SK', 'MD81', 9, from, to, 40, base + 40),
  CH_PEAK('SK', 'DC9', 4, from, to, 40, base + 70), CH_PEAK('LH', 'B727', 1, from, from, 50, base + 2900, 0.8), CH_PEAK('AY', 'DC9', 1, to, to, 45, base + 700, 0.8)
];
// a peak of 1999 (chapter 4's airport)
const CH_PEAK99 = (from, to, base) => [
  CH_PEAK('SK', 'MD87', 9, from, to, 40, base), CH_PEAK('SK', 'B737', 8, from, to, 40, base + 30), CH_PEAK('SK', 'DC9', 4, from, to, 40, base + 60),
  CH_PEAK('BRAATHENS', 'B737', 2, from, to, 40, base + 90), CH_PEAK('PREMIAIR', 'A320', 2, from, to, 60, base + 120, 0.95),
  CH_PEAK('LH', 'B737', 2, from, to, 45, base + 2900, 0.8), CH_PEAK('AY', 'MD87', 1, to, to, 45, base + 700, 0.8)
];
const CH_SETUP89 = { open: true, items: { fuelTruck: 5, plough: 5, crashTender: 2, generator: 1 }, desks: 26, it: 3,
  airlines: { SK: [{ type: 'DC9', perDay: 18, load: 0.72 }, { type: 'MD81', perDay: 6, load: 0.72 }], LF: [{ type: 'F28', perDay: 30, load: 0.74 }],
    LH: [{ type: 'B727', perDay: 4, load: 0.7 }], AY: [{ type: 'DC9', perDay: 4, load: 0.7 }] },
  domains: { stands: 2, turnaround: 1, checkin: 1, snow: 1, baggage: 2, info: 2 } };
const CH_HANDS = ['stand', 'checkin', 'fuel', 'bags', 'announce', 'plough'];

const CHALLENGES = [
  {
    id: 'c1', name: 'Christmas Week, 1989', opens: '3-11', date: '1989-12-18',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal', 'domTerminal', 'computerRoom'],
    setup: CH_SETUP89, hands: CH_HANDS,
    aim: 'Six busy days before Christmas, one peak each: snow, the flu and everybody flying home.',
    brief: ['Monday to Saturday before Christmas, the busiest peak of each day. Points for every flight on time and for happy passengers; lost flights cost a lot.'],
    stages: [
      { name: 'Monday morning', mode: 'ops', date: '1989-12-18', from: '06:00', to: '09:00', desks: 8, weather: { temp: -9, wind: [20, 8], snow: [['06:20', '07:40', 2.5]] },
        flights: CH_PEAK89('06:05', '08:40', 100), goal: [{ k: 'lost', max: 4 }] },
      { name: 'Tuesday evening', mode: 'ops', date: '1989-12-19', from: '16:00', to: '19:00', desks: 8, weather: { temp: -5, wind: [210, 10] },
        flights: CH_PEAK89('16:05', '18:40', 200), goal: [{ k: 'lost', max: 4 }] },
      { name: 'Wednesday: the flu', mode: 'ops', date: '1989-12-20', from: '06:00', to: '09:00', desks: 8, sick: { turnaround: 0.12, checkin: 0.1 }, weather: { temp: -12, wind: [10, 6] },
        flights: CH_PEAK89('06:05', '08:40', 300), goal: [{ k: 'lost', max: 4 }] },
      { name: 'Thursday: the computer', mode: 'ops', date: '1989-12-21', from: '11:00', to: '14:00', desks: 8, weather: { temp: -4, wind: [200, 9] },
        events: [{ at: '11:40', do: 'fail', dom: 'stands', min: 60 }],
        flights: CH_PEAK89('11:05', '13:40', 400), goal: [{ k: 'lost', max: 4 }] },
      { name: 'Friday: fog', mode: 'ops', date: '1989-12-22', from: '15:00', to: '18:00', desks: 8, weather: { temp: 1, wind: [180, 3], fog: [['15:20', '16:10', 200]] },
        flights: CH_PEAK89('15:05', '17:40', 500), goal: [{ k: 'lost', max: 4 }] },
      { name: 'Saturday: the last rush', mode: 'ops', date: '1989-12-23', from: '07:00', to: '10:00', desks: 8, weather: { temp: -14, wind: [30, 11], snow: [['07:10', '08:30', 3]] },
        events: [{ at: '08:50', do: 'emergency' }],
        flights: CH_PEAK89('07:05', '09:40', 600), goal: [{ k: 'lost', max: 4 }] }
    ],
    stars: [1200, 1450, 1600]
  },
  {
    id: 'c2', name: 'The Great Snow, 1987', opens: '3-11', date: '1987-01-12',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal', 'domTerminal', 'computerRoom'],
    setup: Object.assign({}, CH_SETUP89, { domains: { stands: 2, turnaround: 1, checkin: 1, snow: 2, baggage: 2, info: 2 } }), hands: CH_HANDS,
    aim: 'One whole day of snow, from dawn to late evening: keep the runways open.',
    brief: ['It starts snowing before six and does not stop until the evening. Six peaks, one long day. The ploughs will be busy.'],
    stages: [
      { name: 'Dawn', mode: 'ops', from: '06:00', to: '09:00', desks: 10, weather: { temp: -11, wind: [30, 10], snow: [['05:40', '09:00', 2.6]] },
        flights: CH_PEAK89('06:05', '08:40', 100), goal: [{ k: 'lost', max: 5 }] },
      { name: 'Morning', mode: 'ops', from: '09:00', to: '12:00', desks: 10, weather: { temp: -10, wind: [40, 12], snow: [['09:00', '12:00', 3]] },
        events: [{ at: '10:20', do: 'fail', dom: 'snow', min: 50 }],
        flights: CH_PEAK89('09:05', '11:40', 200), goal: [{ k: 'lost', max: 5 }] },
      { name: 'Noon', mode: 'ops', from: '12:00', to: '15:00', desks: 10, weather: { temp: -9, wind: [40, 14], snow: [['12:00', '15:00', 3.4]] },
        flights: CH_PEAK89('12:05', '14:40', 300), goal: [{ k: 'lost', max: 5 }] },
      { name: 'Afternoon', mode: 'ops', from: '15:00', to: '18:00', desks: 10, weather: { temp: -12, wind: [30, 12], snow: [['15:00', '18:00', 2.8]] },
        events: [{ at: '16:00', do: 'power', min: 40 }],
        flights: CH_PEAK89('15:05', '17:40', 400), goal: [{ k: 'lost', max: 5 }] },
      { name: 'Evening', mode: 'ops', from: '18:00', to: '21:00', desks: 10, weather: { temp: -14, wind: [20, 9], snow: [['18:00', '19:30', 2]] },
        flights: CH_PEAK89('18:05', '20:40', 500), goal: [{ k: 'lost', max: 5 }] },
      { name: 'Late evening', mode: 'ops', from: '21:00', to: '24:00', desks: 10, weather: { temp: -16, wind: [10, 6] },
        flights: CH_PEAK89('21:05', '23:10', 600), goal: [{ k: 'lost', max: 5 }] }
    ],
    stars: [1200, 1450, 1620]
  },
  {
    id: 'c3', name: 'Record Day, 1999', opens: '4-11', date: '1999-08-16',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal', 'domTerminal', 'computerRoom', 'terminal2', 'arlandaExpress', 'sorterHall'],
    setup: { open: true, openSkies: true, units: true, lanes: 12, items: { fuelTruck: 6, plough: 6, crashTender: 2, generator: 1, dutyFree: 1 }, desks: 36, it: 6,
      airlines: { SK: [{ type: 'MD87', perDay: 16, load: 0.74 }, { type: 'B737', perDay: 14, load: 0.74 }, { type: 'DC9', perDay: 8, load: 0.72 }],
        BRAATHENS: [{ type: 'B737', perDay: 6, load: 0.72 }], PREMIAIR: [{ type: 'A320', perDay: 3, load: 0.9, months: [6, 7, 8, 12] }],
        LH: [{ type: 'B737', perDay: 5, load: 0.72 }], AY: [{ type: 'MD87', perDay: 5, load: 0.72 }] },
      domains: { stands: 2, turnaround: 1, checkin: 2, snow: 2, baggage: 3, info: 2 }, terms: { SK: 't2' },
      brands: [['intl', 'olearys'], ['intl', 'mcdonalds'], ['intl', 'pressbyran'], ['dom', 'max'], ['dom', 'pressbyran'], ['t2', 'espresso'], ['t2', 'pressbyran']] },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    aim: 'The busiest summer day of the century: six peaks from dawn to midnight.',
    brief: ['A Monday in August: the holidays are ending and everybody flies home at once. Six peaks, from six in the morning to midnight.'],
    stages: [
      { name: 'First wave', mode: 'ops', from: '06:00', to: '09:00', desks: 12, weather: { temp: 15, wind: [200, 8] }, flights: CH_PEAK99('06:05', '08:40', 100), goal: [{ k: 'lost', max: 5 }] },
      { name: 'Late morning', mode: 'ops', from: '09:00', to: '12:00', desks: 12, weather: { temp: 19, wind: [210, 9] }, flights: CH_PEAK99('09:05', '11:40', 200), goal: [{ k: 'lost', max: 5 }] },
      { name: 'Midday', mode: 'ops', from: '12:00', to: '15:00', desks: 12, weather: { temp: 23, wind: [220, 10] },
        events: [{ at: '13:10', do: 'fail', dom: 'baggage', min: 50 }], flights: CH_PEAK99('12:05', '14:40', 300), goal: [{ k: 'lost', max: 5 }] },
      { name: 'Thunder', mode: 'ops', from: '15:00', to: '18:00', desks: 12, weather: { temp: 24, wind: [250, 22], fog: [['16:00', '16:30', 900]] },
        flights: CH_PEAK99('15:05', '17:40', 400), goal: [{ k: 'lost', max: 5 }] },
      { name: 'Evening wave', mode: 'ops', from: '18:00', to: '21:00', desks: 12, weather: { temp: 19, wind: [230, 9] },
        events: [{ at: '19:20', do: 'emergency' }], flights: CH_PEAK99('18:05', '20:40', 500), goal: [{ k: 'lost', max: 5 }] },
      { name: 'Last flights', mode: 'ops', from: '21:00', to: '24:00', desks: 12, weather: { temp: 15, wind: [210, 6] }, flights: CH_PEAK99('21:05', '23:00', 600), goal: [{ k: 'lost', max: 5 }] }
    ],
    stars: [1000, 1200, 1350]
  }
];
const CHALLENGE = {};
for (const c of CHALLENGES) {
  c.kind = 'challenge';
  c.challenge = true;
  c.starsAt = c.stars;
  c.goal = [{ k: 'score', min: c.starsAt[0] }];
  c.stars = [{ k: 'score', min: c.starsAt[1] }, { k: 'score', min: c.starsAt[2] }];
  CHALLENGE[c.id] = c;
}
