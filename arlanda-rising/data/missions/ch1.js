'use strict';

// Arlanda Rising — chapter 1, The Forest Field (1958–1963): from clearing the forest at Halmsjön to the first
// winter after the official opening. Map, runway, stands, tower, the first terminal; stands, check-in,
// fuel and snow by hand; money basics; noise over Märsta. See data/missions/missions.js for the fields.
// The history the briefings tell is checked (`facts` with the source); what is the game's own story
// (the training sorties' times, the flights of a day) is told as such.

const SRC_SV = 'sv.wikipedia Arlanda (Historia)';
const SRC_EN = 'en.wikipedia Stockholm Arlanda Airport (History)';
const BUILT_1959 = ['site', 'runway1', 'apron1'];

// a series of SAS flights for an ops stage
const SK = (type, n, from, to, turn, extra) => Object.assign({ al: 'SK', type, n, from, to, turn, load: 0.7 }, extra || {});

addMissions(1, [
  {
    name: 'Clear the Forest', kind: 'build', date: '1958-05-05',
    setup: { budget: 95e6, loanLimit: 30e6, projects: ['site'], items: { siteOffice: 1 } },
    brief: [
      'In December 1957 the Riksdag decided: Stockholm gets a big new airport in the forest at Halmsjön, north of the city. A year later a magazine contest gave it its name — Arlanda.',
      'First the forest has to go. Clear the strip for the runway, drain the bog, then the apron and the road in.',
      'Two crews can work at a time, and in winter they go at half speed. Plan the order well!'
    ],
    goal: 'Clear the site: the runway strip and the bog by autumn, the apron and the road by spring.',
    facts: [
      { text: 'The Riksdag decided on the airport at Halmsjön in December 1957: 153 million kronor, two runways.', src: SRC_SV },
      { text: 'The name Arlanda came from a contest in the magazine Året Runt in 1958, after Ärlinghundra hundred.', src: SRC_SV }
    ],
    stages: [
      { name: 'Summer: the strip', mode: 'plan', days: 180, crews: 2, endEarly: true,
        goal: [{ k: 'project', id: 'site', stages: ['strip', 'drain'] }],
        choices: [{ id: 'timber', at: 12, default: 'burn', options: [
          { id: 'sell', money: 6e6, extraDays: ['site', 'strip', 10] },
          { id: 'burn', meters: { neighbours: -8 } }
        ] }] },
      { name: 'Winter: the apron and the road', mode: 'plan', days: 150, crews: 2, endEarly: true,
        goal: [{ k: 'project', id: 'site' }],
        choices: [{ id: 'treeBelt', at: 5, default: 'clear', options: [
          { id: 'keep', money: -3e6, neighboursBase: 8, meters: { neighbours: 8 } },
          { id: 'clear' }
        ] }] }
    ],
    goal: [],
    stars: [{ k: 'money', min: 10e6 }, { k: 'neighbours', min: 75 }]
  },
  {
    name: 'First Wheels', kind: 'operate', date: '1959-12-14', requires: BUILT_1959,
    hands: ['stand'],
    brief: [
      '14 December 1959. The runway is paved! The first aircraft to land here is an SAS Caravelle from Bromma — for now the field is for school flying only.',
      'All day the crews practise landings. After each one the aircraft stops on a stand for a new crew. You pick the stand — tap the task, or drag the aircraft.',
      'The days are short in December. After about half past three it is dark, and the runway has no lights yet.'
    ],
    goal: 'Give every training flight a stand in time, so they all fly on time.',
    facts: [{ text: 'Arlanda was first used on 14 December 1959, for school flying only; the first landing was an SAS Caravelle from Bromma, on runway 1.', src: SRC_SV }],
    stages: [
      { name: 'Morning lessons', mode: 'ops', from: '09:00', to: '12:00', weather: { temp: -3, wind: [10, 8] },
        flights: [SK('CRVL', 6, '09:10', '11:20', 30, { training: true })],
        goal: [{ k: 'airportDelay', max: 3 }] },
      { name: 'Afternoon lessons', mode: 'ops', from: '12:00', to: '15:00', weather: { temp: -4, wind: [10, 6] },
        flights: [SK('CRVL', 8, '12:05', '14:15', 30, { training: true })],
        goal: [{ k: 'airportDelay', max: 3 }, { k: 'lost', max: 0 }] }
    ],
    goal: [],
    stars: [{ k: 'dutyTasks', max: 0 }, { k: 'airportDelay', max: 1 }]
  },
  {
    name: 'The Tower', kind: 'build', date: '1960-01-11', requires: BUILT_1959,
    setup: { budget: 45e6, projects: ['tower1'] },
    hands: ['stand'],
    brief: [
      'Without a control tower the controllers keep the aircraft far apart — one movement every six minutes. Arlanda needs its tower before the regular flights come.',
      'It is January: work goes at half speed in the cold. Heated tents keep the crews going, or a fast pace makes up for the time — which is cheaper?',
      'When the tower is ready, show what it can do: a morning of training flights twice as close.'
    ],
    goal: 'Build the control tower, then run a busy morning of training flights.',
    stages: [
      { name: 'Foundations and shaft', mode: 'plan', days: 75, crews: 1, endEarly: true,
        goal: [{ k: 'project', id: 'tower1', stages: ['found', 'shaft'] }] },
      { name: 'The cab and the radio', mode: 'plan', days: 60, crews: 1, endEarly: true,
        goal: [{ k: 'project', id: 'tower1' }] },
      { name: 'Cleared to land', mode: 'ops', date: '1960-05-16', from: '09:00', to: '12:00', weather: { temp: 12, wind: [190, 10] },
        flights: [SK('CRVL', 11, '09:05', '11:35', 30, { training: true })],
        goal: [{ k: 'airportDelay', max: 3 }] }
    ],
    goal: [],
    stars: [{ k: 'spent', max: 44e6 }, { k: 'safety', min: 84 }]
  },
  {
    name: 'The First Terminal', kind: 'build', date: '1960-04-04', requires: BUILT_1959.concat(['tower1']),
    setup: { budget: 40e6, projects: ['terminal1'] },
    hands: ['stand', 'checkin'],
    brief: [
      'Arlanda began with very simple buildings. Ours has a hall, four check-in desks and a waiting room — and it must be ready by 26 June.',
      'One building firm, one crew. Work out the order, and how to fit in a kiosk for the waiting passengers.',
      'On 26 June 1960 the first regular flight leaves Arlanda: an SAS DC-8 to New York. Your desks check in its passengers!'
    ],
    goal: 'Open the terminal by 26 June, then check in the first passengers.',
    facts: [
      { text: 'At first Arlanda used very primitive buildings.', src: SRC_SV },
      { text: 'The first regular flight was an SAS DC-8 to New York on 26 June 1960.', src: SRC_SV }
    ],
    stages: [
      { name: 'The hall', mode: 'plan', days: 42, crews: 1, endEarly: true,
        goal: [{ k: 'project', id: 'terminal1', stages: ['hall'] }],
        choices: [{ id: 'secondCrew', at: 3, default: 'one', options: [{ id: 'hire', money: -3e6, crews: 1 }, { id: 'one' }] }] },
      { name: 'Desks and the waiting room', mode: 'plan', days: 40, crews: 1, endEarly: false,
        goal: [{ k: 'project', id: 'terminal1' }] },
      { name: '26 June 1960', mode: 'ops', date: '1960-06-26', from: '08:00', to: '11:00', weather: { temp: 18, wind: [200, 8] }, desks: 1,
        flights: [
          SK('DC8', 1, '10:15', '10:15', 0, { parked: true, route: ['New York'], base: 911, load: 0.75 }),
          SK('CRVL', 4, '08:05', '10:10', 40, { load: 0.65 })
        ],
        goal: [{ k: 'onTime', p: 0.8 }] }
    ],
    goal: [],
    stars: [{ k: 'built', kind: 'kiosk' }, { k: 'checkinWait', max: 10 }]
  },
  {
    name: 'The First Jets', kind: 'operate', date: '1960-08-15', requires: BUILT_1959.concat(['tower1', 'terminal1']),
    setup: { open: true, desks: 4, airlines: { SK: [{ type: 'CRVL', perDay: 10, load: 0.65 }, { type: 'DC8', perDay: 2, load: 0.7 }] } },
    hands: ['stand', 'checkin'],
    brief: [
      'Summer 1960. SAS jets come and go every day now — the quick Caravelles and the big DC-8s.',
      'A DC-8 only fits stands 1 and 2. Put a Caravelle there, and the DC-8 has to wait on the taxiway.',
      'Keep an eye on the check-in queue too: open a desk before it gets long.'
    ],
    goal: 'A busy summer day of jets: keep them on time and the queues short.',
    stages: [
      { name: 'Morning wave', mode: 'ops', from: '07:00', to: '10:00', weather: { temp: 16, wind: [220, 9] }, desks: 1,
        flights: [SK('CRVL', 5, '07:10', '09:10', 40), SK('DC8', 2, '07:35', '08:40', 65, { base: 900 })],
        goal: [{ k: 'onTime', p: 0.75 }, { k: 'checkinWait', max: 15 }] },
      { name: 'Afternoon wave', mode: 'ops', from: '15:00', to: '18:00', weather: { temp: 21, wind: [200, 7] }, desks: 1,
        flights: [SK('CRVL', 6, '15:05', '17:05', 40), SK('DC8', 2, '15:20', '16:10', 65, { base: 900 })],
        goal: [{ k: 'onTime', p: 0.75 }, { k: 'checkinWait', max: 15 }] }
    ],
    goal: [],
    stars: [{ k: 'onTime', p: 0.92 }, { k: 'checkinWait', max: 9 }]
  },
  {
    name: 'The Fuel Truck', kind: 'operate', date: '1960-10-10', requires: BUILT_1959.concat(['tower1', 'terminal1']),
    setup: { open: true, items: { fuelTruck: 1 } },
    hands: ['stand', 'checkin', 'fuel'],
    brief: [
      'From today the airport fuels the aircraft itself, with one fuel truck. When the passengers are off, send the truck.',
      'A DC-8 takes a long time to fill. While the truck is there, the next aircraft waits.',
      'A second truck costs money — but so do delays. You decide.'
    ],
    goal: 'Fuel every aircraft in time: no departures late because of the fuel.',
    stages: [
      { name: 'Morning', mode: 'ops', from: '07:00', to: '10:00', weather: { temp: 8, wind: [240, 12] }, desks: 2,
        flights: [SK('CRVL', 6, '07:05', '09:20', 40), SK('DC8', 3, '07:30', '09:00', 65, { base: 900 })],
        goal: [{ k: 'onTime', p: 0.7 }] },
      { name: 'Evening', mode: 'ops', from: '14:00', to: '17:00', weather: { temp: 7, wind: [250, 14] }, desks: 2,
        flights: [SK('CRVL', 6, '14:05', '16:15', 40), SK('DC8', 3, '14:20', '15:50', 65, { base: 900 })],
        goal: [{ k: 'onTime', p: 0.7 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 1.5 }, { k: 'airlines', min: 85 }]
  },
  {
    name: 'First Snow', kind: 'crisis', date: '1960-12-05', requires: BUILT_1959.concat(['tower1', 'terminal1']),
    setup: { open: true, items: { fuelTruck: 2, plough: 2 } },
    hands: ['stand', 'checkin', 'plough'],
    brief: [
      'The first real snow on your runway! Above 3 mm the braking gets poor; at 6 mm the runway has to close.',
      'Send the ploughs in time — while they sweep, nothing can land. Two ploughs are slow; a full convoy has four.',
      'And it gets dark early: the runway has no lights yet.'
    ],
    goal: 'Keep the runway clear and open through two snowfalls.',
    stages: [
      { name: 'Snow at dawn', mode: 'ops', from: '07:00', to: '10:00', weather: { temp: -4, wind: [20, 8], snow: [['07:20', '09:20', 2.6]] }, desks: 2,
        flights: [SK('CRVL', 5, '07:20', '09:20', 40), SK('DC8', 1, '08:00', '08:00', 65, { base: 900 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 6 }] },
      { name: 'Snow at noon', mode: 'ops', from: '11:30', to: '14:30', weather: { temp: -6, wind: [30, 10], snow: [['11:40', '13:40', 3.2]], showers: 1 }, desks: 2,
        flights: [SK('CRVL', 6, '11:35', '13:35', 40), SK('DC8', 1, '12:00', '12:00', 65, { base: 900 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 6 }] }
    ],
    goal: [],
    stars: [{ k: 'closeCalls', max: 0 }, { k: 'onTime', p: 0.85 }]
  },
  {
    name: 'Make It Pay', kind: 'business', date: '1961-03-06', requires: BUILT_1959.concat(['tower1', 'terminal1']),
    setup: { open: true, items: { fuelTruck: 2, plough: 2 }, airlines: { SK: [{ type: 'CRVL', perDay: 11, load: 0.65 }, { type: 'DC8', perDay: 2, load: 0.7 }] } },
    brief: [
      'Arlanda is open, but it loses money: the runway, the tower and the people cost more every month than the fees bring in.',
      'Fees, a café, a car park, a new airline — every choice has a price. Raise the fees and SAS grumbles; build a car park and it pays back only slowly.',
      'Make the airport pay for itself by the end of the year.'
    ],
    goal: 'End the nine months with a profit.',
    stages: [
      { name: 'Spring', mode: 'plan', days: 80, goal: [],
        choices: [{ id: 'cafe', at: 6, default: 'no', options: [{ id: 'cafe', build: 'cafe' }, { id: 'kiosk', build: 'kiosk' }, { id: 'no' }] }] },
      { name: 'Summer', mode: 'plan', days: 80, goal: [],
        choices: [{ id: 'charter', at: 4, default: 'no', options: [
          { id: 'yes', airline: { code: 'TRANSAIR', routes: [{ type: 'DC6B', perDay: 3, load: 0.85, months: [6, 7, 8, 9] }], mood: 70 } },
          { id: 'no' }
        ] }] },
      { name: 'Autumn', mode: 'plan', days: 80, goal: [],
        choices: [{ id: 'parking', at: 4, default: 'no', options: [{ id: 'big', build: 'parkingBig' }, { id: 'small', build: 'parkingSmall' }, { id: 'no' }] }] }
    ],
    goal: [{ k: 'profit', min: 0 }],
    stars: [{ k: 'profit', min: 6e6 }, { k: 'airlines', min: 65 }]
  },
  {
    name: 'Night Lights', kind: 'operate', date: '1961-11-13', requires: BUILT_1959.concat(['tower1', 'terminal1']),
    setup: { open: true, projects: ['lights1'], budget: 10e6, items: { fuelTruck: 2, plough: 2 } },
    hands: ['stand', 'checkin', 'fuel'],
    brief: [
      'Winter evenings are dark, and a runway without lights is closed in the dark. Lay the cables and the edge lights first.',
      'Approach lights help the pilots in fog — the evenings are often misty now.',
      'Night flights are loud over Märsta. When the wind is calm, you choose the runway direction: which way spares the town?'
    ],
    goal: 'Light the runway, then run a dark evening and a late night without sending anyone away.',
    stages: [
      { name: 'Lights', mode: 'plan', days: 45, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'lights1' }] },
      { name: 'Dark evening', mode: 'ops', date: '1962-01-08', from: '15:00', to: '18:00',
        weather: { temp: 3, wind: [180, 5], fog: [['16:45', '17:45', 300]] }, desks: 2,
        flights: [SK('CRVL', 5, '15:10', '17:20', 40), SK('DC8', 1, '16:10', '16:10', 65, { base: 900 })],
        goal: [{ k: 'lost', max: 1 }] },
      { name: 'Late night', mode: 'ops', from: '20:30', to: '23:30', weather: { temp: 1, wind: [180, 3] }, desks: 2,
        flights: [SK('CRVL', 4, '20:35', '22:20', 40), SK('DC8', 1, '21:10', '21:10', 65, { base: 900 })],
        goal: [{ k: 'onTime', p: 0.7 }] }
    ],
    goal: [],
    stars: [{ k: 'lost', max: 0 }, { k: 'neighbours', min: 62 }]
  },
  {
    name: 'Opening Day', kind: 'operate', date: '1962-04-01', requires: BUILT_1959.concat(['tower1', 'terminal1', 'lights1']),
    setup: { open: true, items: { fuelTruck: 2, plough: 2 }, desks: 4 },
    hands: ['stand', 'checkin', 'fuel'],
    brief: [
      '1 April 1962: King Gustaf VI Adolf opens Arlanda, and from today all the international flights leave from here, not Bromma.',
      'The ceremony is by the terminal: stand 1 is closed while it lasts. Four stands left, and the busiest day yet.',
      'A remote stand can be built in a hurry — at a price.'
    ],
    goal: 'Run the opening day on time, with the ceremony on stand 1.',
    facts: [
      { text: 'King Gustaf VI Adolf officially opened Arlanda on 1 April 1962.', src: SRC_EN },
      { text: 'On that day all international traffic moved from Bromma to Arlanda.', src: SRC_SV }
    ],
    stages: [
      { name: 'The first morning', mode: 'ops', from: '07:00', to: '10:00', weather: { temp: 4, wind: [200, 11] }, desks: 2,
        flights: [SK('CRVL', 7, '07:05', '09:35', 40), SK('DC8', 2, '07:40', '08:50', 65, { base: 900 })],
        goal: [{ k: 'onTime', p: 0.75 }] },
      { name: 'The ceremony', mode: 'ops', from: '11:00', to: '14:00', weather: { temp: 7, wind: [210, 9] }, desks: 2,
        events: [{ at: '11:00', do: 'closeStand', stand: '1' }, { at: '13:00', do: 'openStand', stand: '1' }],
        flights: [SK('CRVL', 9, '11:05', '13:35', 40), SK('DC8', 2, '11:30', '12:40', 65, { base: 900 })],
        goal: [{ k: 'onTime', p: 0.75 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 2 }, { k: 'passengers', min: 72 }]
  },
  {
    name: 'Exam: The First Winter', kind: 'exam', date: '1963-01-21', requires: BUILT_1959.concat(['tower1', 'terminal1', 'lights1']),
    setup: { open: true, items: { fuelTruck: 2, plough: 2 }, desks: 4 },
    hands: ['stand', 'checkin', 'fuel', 'plough'],
    brief: [
      'Your first winter as an open airport. Everything you learnt this chapter, in one long day.',
      'Snow in the morning, a busy middle of the day, a dark snowy afternoon. Stands, desks, fuel and ploughs — all by hand.',
      'If it gets too much, think about what you could buy before it starts.'
    ],
    goal: 'Get through a whole winter day: no flight sent away, most of them on time.',
    stages: [
      { name: 'Snowy morning', mode: 'ops', from: '07:00', to: '10:00', weather: { temp: -8, wind: [10, 7], snow: [['07:30', '09:15', 2.8]], showers: 1 }, desks: 2,
        flights: [SK('CRVL', 6, '07:10', '09:30', 40), SK('DC8', 2, '07:45', '08:45', 65, { base: 900 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 6 }] },
      { name: 'Midday rush', mode: 'ops', from: '11:00', to: '14:00', weather: { temp: -5, wind: [20, 9] }, desks: 2, snowStart: 1,
        flights: [SK('CRVL', 8, '11:05', '13:35', 40), SK('DC8', 2, '11:30', '12:40', 65, { base: 900 })],
        goal: [{ k: 'onTime', p: 0.75 }] },
      { name: 'Dark afternoon', mode: 'ops', from: '14:30', to: '17:30', weather: { temp: -9, wind: [10, 6], snow: [['15:00', '16:45', 3]] }, desks: 2,
        flights: [SK('CRVL', 6, '14:35', '16:50', 40), SK('DC8', 1, '15:30', '15:30', 65, { base: 900 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 6 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 2 }, { k: 'closeCalls', max: 0 }]
  }
]);
