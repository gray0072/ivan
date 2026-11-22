'use strict';

// Arlanda Rising — chapter 3, Everyone Comes to Arlanda (1983–1989): the domestic flights move in from Bromma, the
// morning peaks, the first computers and their failures, the screens, the flu and the strikes, the payback of an
// investment, the airport coaches and, as the exam, the Christmas rush of 1989. See data/missions/missions.js for
// the fields. The history the briefings tell is checked (`facts` with the source); the flights of a day, the people
// and the deals are the game's own story.

const SRC_SV3 = 'sv.wikipedia Arlanda (Historia)';
// everything the first two chapters built, for a mission started without the campaign (a cheat's jump)
const BUILT_1976 = ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal'];
const BUILT_1983 = BUILT_1976.concat(['domTerminal']);
const ITEMS_1983 = { fuelTruck: 5, plough: 5, crashTender: 2 };
const TEAMS_1976 = { stands: 1, turnaround: 1, checkin: 1, snow: 1, baggage: 2 };

const F3 = (al, type, n, from, to, turn, extra) => Object.assign({ al, type, n, from, to, turn, load: 0.72 }, extra || {});

const ROUTES_1983 = {
  SK: [{ type: 'DC9', perDay: 18, load: 0.68 }, { type: 'DC8', perDay: 2, load: 0.72 }, { type: 'B747', perDay: 2, load: 0.68 }, { type: 'DC10', perDay: 1, load: 0.7 }],
  LF: [{ type: 'F28', perDay: 22, load: 0.7, months: [10, 11, 12] }],
  LH: [{ type: 'B727', perDay: 3, load: 0.7 }], AY: [{ type: 'DC9', perDay: 3, load: 0.7 }]
};
const ROUTES_1985 = {
  SK: [{ type: 'DC9', perDay: 20, load: 0.7 }, { type: 'B747', perDay: 2, load: 0.68 }, { type: 'DC10', perDay: 2, load: 0.7 }],
  LF: [{ type: 'F28', perDay: 26, load: 0.72 }],
  LH: [{ type: 'B727', perDay: 3, load: 0.7 }], AY: [{ type: 'DC9', perDay: 3, load: 0.7 }]
};
const ROUTES_1988 = {
  SK: [{ type: 'DC9', perDay: 18, load: 0.72 }, { type: 'MD81', perDay: 6, load: 0.72 }, { type: 'B747', perDay: 2, load: 0.7 }, { type: 'DC10', perDay: 2, load: 0.7 }],
  LF: [{ type: 'F28', perDay: 30, load: 0.74 }],
  LH: [{ type: 'B727', perDay: 4, load: 0.7 }], AY: [{ type: 'DC9', perDay: 4, load: 0.7 }]
};

addMissions(3, [
  {
    name: 'Linjeflyg Moves In', kind: 'build', date: '1983-05-02', requires: BUILT_1976,
    setup: { open: true, budget: 40e6, loanLimit: 150e6, items: ITEMS_1983, desks: 18, airlines: ROUTES_1983, domains: TEAMS_1976, projects: ['domTerminal'] },
    hands: ['stand', 'checkin', 'fuel', 'bags'],
    brief: [
      'The Riksdag has decided: the jets must leave Bromma, in the middle of the city. Linjeflyg and the domestic flights of SAS are moving here.',
      'They need a terminal of their own by October: a hall, desks and an apron with stands next to it.',
      'Then comes the first domestic morning — a wave of short flights, all at the same time.'
    ],
    aim: 'Build the domestic terminal by October, then run the first domestic morning.',
    news: [
      { icon: '🏢', text: 'The domestic terminal: three stands next to its hall, more desks.' },
      { icon: '✈️', text: 'Linjeflyg: short domestic flights with quick turnarounds.' }
    ],
    facts: [
      { text: 'On 17 December 1980 the Riksdag decided that the jets at Bromma should move to Arlanda.', src: 'Riksdagen TU 1981/82:28' },
      { text: 'The domestic terminal (today Terminal 4) opened on 1 October 1983, and Linjeflyg moved there from Bromma that month.', src: SRC_SV3 + '; en.wikipedia Linjeflyg' }
    ],
    stages: [
      { name: 'The domestic terminal', mode: 'plan', days: 110, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'domTerminal' }],
        choices: [{ id: 'lfDeal', at: 10, default: 'no', icon: '🤝', title: 'Linjeflyg\'s terms',
          text: 'Linjeflyg moves its whole network here and asks for a discount on its fees for the first year. Its people say Bromma was cheaper.',
          options: [
            { id: 'yes', money: -8e6, meters: { airlines: 6 }, label: 'Give the discount' },
            { id: 'no', meters: { airlines: -5 }, label: 'The fees are the fees' }
          ] }] },
      { name: 'The first domestic morning', mode: 'ops', date: '1983-10-03', from: '06:30', to: '09:30', weather: { temp: 7, wind: [210, 9] }, desks: 10,
        flights: [F3('LF', 'F28', 10, '06:35', '09:05', 35, { base: 100 }), F3('SK', 'DC9', 8, '06:45', '09:15', 40, { base: 600 }),
          F3('SK', 'DC8', 1, '07:30', '07:30', 65, { base: 970 }), F3('LH', 'B727', 1, '08:10', '08:10', 50, { base: 3020 })],
        goal: [{ k: 'onTime', p: 0.8 }, { k: 'lost', max: 0 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 2 }, { k: 'airlines', min: 75 }]
  },
  {
    name: 'Morning Peak', kind: 'operate', date: '1984-04-09', requires: BUILT_1983,
    setup: { open: true, items: ITEMS_1983, desks: 26, airlines: ROUTES_1985, domains: TEAMS_1976 },
    hands: ['stand', 'checkin', 'fuel', 'bags'],
    brief: [
      'Between six and nine every weekday morning, half of Sweden flies to meetings. Every desk, stand and fuel truck is needed at once.',
      'The desk scheduler opens one desk at a time as the queue grows — too late for a peak. A head who sees the departures coming could help, or you can open desks yourself.',
      'Two peaks: the business morning, then the late morning.'
    ],
    aim: 'Get the business travellers through a morning peak with short queues.',
    news: [
      { icon: '⏰', text: 'Peaks: everything is needed at the same time.' },
      { icon: '👔', text: 'A head of terminal service: two candidates.' }
    ],
    stages: [
      { name: 'Spring planning', mode: 'plan', days: 20, goal: [],
        choices: [{ id: 'terminalHead', at: 2, default: 'nobody', icon: '👔', title: 'Head of terminal service',
          text: 'Maja Ström sees a queue coming and opens desks in time, but she is expensive. Erik Sund is cheap and calm and the union trusts him, but his desks are slower.',
          options: [
            { id: 'maja', manager: 'majaStrom', label: 'Maja Ström' },
            { id: 'erik', manager: 'erikSund', label: 'Erik Sund' },
            { id: 'nobody', label: 'Nobody' }
          ] }] },
      { name: 'Business peak', mode: 'ops', date: '1984-04-30', from: '06:00', to: '09:00', weather: { temp: 5, wind: [200, 8] }, desks: 4,
        flights: [F3('LF', 'F28', 11, '06:05', '08:45', 35, { base: 100, load: 0.85 }), F3('SK', 'DC9', 9, '06:15', '08:55', 40, { base: 600, load: 0.85 }),
          F3('SK', 'DC9', 3, '06:30', '07:30', 0, { parked: true, base: 650, load: 0.85 }), F3('LF', 'F28', 3, '06:20', '07:20', 0, { parked: true, base: 150, load: 0.85 })],
        goal: [{ k: 'maxWait', max: 7 }, { k: 'onTime', p: 0.8 }] },
      { name: 'Late morning', mode: 'ops', from: '09:00', to: '12:00', weather: { temp: 8, wind: [210, 9] }, desks: 4,
        flights: [F3('LF', 'F28', 8, '09:05', '11:35', 35, { base: 200 }), F3('SK', 'DC9', 6, '09:15', '11:25', 40, { base: 700 }),
          F3('SK', 'B747', 1, '09:40', '09:40', 125, { base: 900, load: 0.7 }), F3('AY', 'DC9', 1, '10:10', '10:10', 45, { base: 800 })],
        goal: [{ k: 'checkinWait', max: 6 }] }
    ],
    goal: [],
    stars: [{ k: 'checkinWait', max: 3 }, { k: 'onTime', p: 0.9 }]
  },
  {
    name: 'The Computer Room', kind: 'build', date: '1984-09-03', requires: BUILT_1983,
    setup: { open: true, budget: 20e6, items: ITEMS_1983, desks: 26, airlines: ROUTES_1985, domains: TEAMS_1976, projects: ['computerRoom'], unlock: { stands: 2 } },
    hands: ['stand', 'checkin', 'fuel', 'bags'],
    brief: [
      'The stand planners work with paper, a big board and a telephone. A computer could plan every stand in a second, and never forget one.',
      'It needs a cooled computer room, IT people to run it — and a licence every month. And the old planners: keep them as a fallback, or let them go?',
      'Computers break. On the day yours does, you will see what your choice was worth.'
    ],
    aim: 'Build the computer room and put in the stand allocation computer, then run a morning in which it fails.',
    news: [
      { icon: '💻', text: 'Systems: fast and right, but they cost every month and need IT people.' },
      { icon: '🔧', text: 'Failures: a system that is down hands its work to the team kept beside it — or to you.' }
    ],
    stages: [
      { name: 'The computer room', mode: 'plan', days: 50, crews: 2, endEarly: true, goal: [{ k: 'level', dom: 'stands', min: 2 }],
        choices: [{ id: 'itHead', at: 3, default: 'nobody', icon: '👩‍💻', title: 'An IT department',
          text: 'Systems need people. Mira Haddad mends failures twice as fast, but wants the newest system every year. Jonas Wik needs fewer people and is cheap, but slow to mend.',
          options: [
            { id: 'mira', manager: 'miraHaddad', it: 3, label: 'Mira Haddad and 3 engineers' },
            { id: 'jonas', manager: 'jonasWik', it: 2, label: 'Jonas Wik and 2 engineers' },
            { id: 'nobody', label: 'No IT department' }
          ] }] },
      { name: 'The computer\'s morning', mode: 'ops', date: '1984-11-05', from: '07:00', to: '10:00', weather: { temp: 1, wind: [220, 10] }, desks: 12,
        events: [{ at: '08:20', do: 'fail', dom: 'stands', min: 50 }],
        flights: [F3('LF', 'F28', 10, '07:05', '09:35', 35, { base: 100 }), F3('SK', 'DC9', 9, '07:10', '09:40', 40, { base: 600 }),
          F3('SK', 'DC10', 1, '07:40', '07:40', 70, { base: 950 }), F3('LH', 'B727', 2, '07:50', '09:10', 50, { base: 3020 }), F3('AY', 'DC9', 1, '08:30', '08:30', 45, { base: 800 })],
        goal: [{ k: 'airportDelay', max: 4 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 2 }, { k: 'passengers', min: 78 }]
  },
  {
    name: 'Screens', kind: 'build', date: '1985-03-04', requires: BUILT_1983.concat(['computerRoom']),
    setup: { open: true, items: ITEMS_1983, desks: 26, airlines: ROUTES_1985, domains: Object.assign({}, TEAMS_1976, { stands: 2 }), it: 3,
      opens: ['info'], unlock: { info: 2 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'A flight is late, and two hundred people wait at the gate without knowing why or for how long. They are not happy.',
      'Every delay must be announced. By hand, that is you at the microphone. A PA operator could do it — or screens that show every flight, all the time.',
      'Snow showers today: there will be delays to announce.'
    ],
    aim: 'Announce the delays by hand, then put up flight information screens.',
    news: [
      { icon: '📢', text: 'Announcements: a late flight must be told to its passengers.' },
      { icon: '📺', text: 'Flight information screens: a system that tells everybody at once.' }
    ],
    stages: [
      { name: 'At the microphone', mode: 'ops', from: '15:00', to: '18:00', weather: { temp: -3, wind: [30, 8], snow: [['15:20', '16:40', 4]] }, desks: 12,
        flights: [F3('LF', 'F28', 9, '15:05', '17:35', 30, { base: 100 }), F3('SK', 'DC9', 8, '15:10', '17:40', 35, { base: 600 }),
          F3('SK', 'B747', 1, '15:40', '15:40', 120, { base: 900, load: 0.7 })],
        goal: [{ k: 'unannounced', max: 3 }] },
      { name: 'Screens', mode: 'plan', days: 40, crews: 2, endEarly: true, goal: [{ k: 'level', dom: 'info', min: 2 }] },
      { name: 'A foggy evening', mode: 'ops', date: '1985-04-22', from: '15:00', to: '18:00', weather: { temp: 4, wind: [180, 3], fog: [['15:40', '16:05', 100]] }, desks: 12,
        flights: [F3('LF', 'F28', 9, '15:05', '17:35', 30, { base: 200 }), F3('SK', 'DC9', 8, '15:10', '17:40', 35, { base: 700 }),
          F3('LH', 'B727', 1, '16:20', '16:20', 50, { base: 3030 })],
        goal: [{ k: 'unannounced', max: 1 }, { k: 'lost', max: 0 }] }
    ],
    goal: [],
    stars: [{ k: 'unannounced', max: 1 }, { k: 'passengers', min: 74 }]
  },
  {
    name: 'Flu Season', kind: 'crisis', date: '1986-02-03', requires: BUILT_1983.concat(['computerRoom']),
    setup: { open: true, items: ITEMS_1983, desks: 26, airlines: ROUTES_1985, domains: Object.assign({}, TEAMS_1976, { stands: 2, info: 2 }), it: 3 },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'February: the flu is going round, and a third more of your people are at home in bed. A team that is short does less — and the rest comes to your tray.',
      'Seasonal temps can fill some gaps, if you hire them in time. On the day itself, overtime brings everybody in — at a price, and they will be tired.',
      'This morning the ramp team has it worst.'
    ],
    aim: 'Get through a morning in the flu season with half-empty teams.',
    news: [
      { icon: '🤒', text: 'Absence: a team that is short sends some of its tasks to your tray.' },
      { icon: '⏱️', text: 'Overtime (in the bar below): the team is complete for the stage — at a price.' }
    ],
    stages: [
      { name: 'Temps?', mode: 'plan', days: 14, goal: [],
        choices: [{ id: 'temps', at: 2, default: 'none', icon: '🧑‍🔧', title: 'Seasonal temps',
          text: 'The staffing agency has people for one team for the next three months. They cover some of the sick days.',
          options: [
            { id: 'ramp', temps: 'turnaround', label: 'For the ramp team' },
            { id: 'desks', temps: 'checkin', label: 'For the desks' },
            { id: 'bags', temps: 'baggage', label: 'For the baggage hall' },
            { id: 'none', label: 'No temps' }
          ] }] },
      { name: 'Flu morning', mode: 'ops', date: '1986-02-17', from: '06:30', to: '09:30', weather: { temp: -6, wind: [20, 7] }, desks: 10, sick: { turnaround: 0.12 },
        flights: [F3('LF', 'F28', 11, '06:35', '09:05', 35, { base: 100 }), F3('SK', 'DC9', 9, '06:40', '09:10', 40, { base: 600 }),
          F3('SK', 'DC10', 1, '07:20', '07:20', 70, { base: 950 }), F3('LH', 'B727', 1, '08:00', '08:00', 50, { base: 3020 })],
        goal: [{ k: 'airportDelay', max: 4 }] }
    ],
    goal: [],
    stars: [{ k: 'handTasks', max: 3 }, { k: 'onTime', p: 0.85 }]
  },
  {
    name: 'Strike Notice', kind: 'choice', date: '1986-11-03', requires: BUILT_1983.concat(['computerRoom']),
    setup: { open: true, items: ITEMS_1983, desks: 26, airlines: ROUTES_1985, domains: Object.assign({}, TEAMS_1976, { stands: 2, info: 2 }), it: 3,
      strike: { dept: 'turnaround', from: '1986-11-12' } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'The ramp workers\' union has given notice: a strike on 12 November, a busy Wednesday. They want 6 %.',
      'Pay what they ask, or ask the mediator to settle in the middle — or let it come and fuel the aircraft yourself.',
      'Every way costs something. Which one is worth it?'
    ],
    aim: 'Deal with the strike notice, then run 12 November.',
    news: [
      { icon: '📜', text: 'A strike notice: the strike begins on its date unless a deal calls it off.' }
    ],
    stages: [
      { name: 'Nine days', mode: 'plan', days: 7, goal: [],
        choices: [{ id: 'notice', at: 1, default: 'ride', icon: '✊', kind: 'union', dept: 'turnaround', title: 'The strike notice',
          text: 'The union\'s negotiators are waiting in the meeting room. Their mood is bad after the notice.',
          options: [
            { id: 'settle', union: { dept: 'turnaround', how: 'accept' }, label: 'Pay the 6 %' },
            { id: 'mediator', union: { dept: 'turnaround', how: 'mediator' }, label: 'Call the mediator' },
            { id: 'ride', label: 'Let it come' }
          ] }] },
      { name: 'Wednesday', mode: 'ops', date: '1986-11-12', from: '07:00', to: '10:00', weather: { temp: 2, wind: [220, 9] }, desks: 12,
        flights: [F3('LF', 'F28', 9, '07:05', '09:35', 35, { base: 100 }), F3('SK', 'DC9', 8, '07:10', '09:40', 40, { base: 600 }),
          F3('SK', 'B747', 1, '07:50', '07:50', 125, { base: 900, load: 0.7 }), F3('AY', 'DC9', 1, '08:20', '08:20', 45, { base: 800 })],
        goal: [{ k: 'onTime', p: 0.8 }, { k: 'airportDelay', max: 4 }] }
    ],
    goal: [],
    stars: [{ k: 'noStrike' }, { k: 'airportDelay', max: 3 }]
  },
  {
    name: 'The Big Freeze', kind: 'crisis', date: '1987-01-05', requires: BUILT_1983.concat(['computerRoom']),
    setup: { open: true, items: ITEMS_1983, desks: 26, airlines: ROUTES_1985, domains: Object.assign({}, TEAMS_1976, { stands: 2, info: 2 }), it: 3, unlock: { snow: 2 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'plough'],
    brief: [
      'Minus twenty-five, and the forecast says snow — lots of it. The snow chief and his convoys are good, but they react to the snow once it lies on the runway.',
      'A weather-based clearing plan sends the ploughs before the snow settles. It is a system: it costs, and it can fail in the cold.',
      'Keep the snow team as the fallback, and you will be glad on the day it does.'
    ],
    aim: 'Put in the clearing plan, then keep the runways open through two snowfalls.',
    news: [
      { icon: '🌨️', text: 'The weather-based clearing plan: a system for the snow.' }
    ],
    stages: [
      { name: 'The clearing plan', mode: 'plan', days: 20, endEarly: true, goal: [{ k: 'level', dom: 'snow', min: 2 }],
        choices: [{ id: 'snowPlan', at: 2, default: 'none', icon: '🌨️', title: 'The clearing plan',
          text: 'The system is ready to install. The snow team that does the work now can stay as the fallback — retrained — or be let go to save their wages.',
          options: [
            { id: 'keep', system: { dom: 'snow', how: 'keep' }, label: 'Install it, keep the team' },
            { id: 'layoff', system: { dom: 'snow', how: 'layoff' }, label: 'Install it, let the team go' },
            { id: 'none', label: 'Not this winter' }
          ] }] },
      { name: 'Snow at dawn', mode: 'ops', date: '1987-01-19', from: '06:00', to: '09:00', weather: { temp: -24, wind: [30, 9], snow: [['06:20', '08:40', 3.5]] }, desks: 12,
        flights: [F3('LF', 'F28', 9, '06:05', '08:45', 35, { base: 100 }), F3('SK', 'DC9', 8, '06:15', '08:55', 40, { base: 600 }),
          F3('SK', 'DC10', 1, '07:10', '07:10', 70, { base: 950 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 5 }] },
      { name: 'Snow at noon', mode: 'ops', from: '12:00', to: '15:00', weather: { temp: -21, wind: [40, 11], snow: [['12:15', '14:20', 3.2]] }, desks: 12,
        events: [{ at: '12:50', do: 'fail', dom: 'snow', min: 60 }],
        flights: [F3('LF', 'F28', 8, '12:05', '14:35', 35, { base: 200 }), F3('SK', 'DC9', 7, '12:15', '14:45', 40, { base: 700 }),
          F3('SK', 'B747', 1, '13:00', '13:00', 125, { base: 900, load: 0.7 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 5 }] }
    ],
    goal: [],
    stars: [{ k: 'closeCalls', max: 0 }, { k: 'onTime', p: 0.85 }]
  },
  {
    name: 'Planner or Computer?', kind: 'choice', date: '1987-09-07', requires: BUILT_1983.concat(['computerRoom']),
    setup: { open: true, items: ITEMS_1983, desks: 26, airlines: ROUTES_1988, domains: Object.assign({}, TEAMS_1976, { stands: 2, info: 2 }), it: 3, unlock: { checkin: 2 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'Check-in computers are here: they print boarding passes and open desks before the queue builds. Fast — and dear, with a licence every month.',
      'Or train your desk team well and give it a few more desks: cheaper, and nothing to break.',
      'Both can work. Which costs less for the queues you get?'
    ],
    aim: 'Choose the way for check-in, then run two peaks.',
    news: [
      { icon: '🖥️', text: 'Check-in computers: a system for the desks.' },
      { icon: '🎓', text: 'Training: a team that knows its work does it faster and better.' }
    ],
    stages: [
      { name: 'The choice', mode: 'plan', days: 30, goal: [],
        choices: [{ id: 'checkinWay', at: 3, default: 'none', icon: '🖥️', title: 'Planner or computer?',
          text: 'The supplier\'s check-in computers, or a course for the desk team and four more desks. The decision is yours.',
          options: [
            { id: 'computer', system: { dom: 'checkin', how: 'keep' }, label: 'Check-in computers' },
            { id: 'train', train: 'checkin', build: ['desk', 'desk', 'desk', 'desk'], label: 'Train the team, more desks' },
            { id: 'none', label: 'Neither' }
          ] }] },
      { name: 'Morning peak', mode: 'ops', date: '1987-10-05', from: '06:00', to: '09:00', weather: { temp: 6, wind: [210, 9] }, desks: 6,
        flights: [F3('LF', 'F28', 13, '06:05', '08:45', 35, { base: 100, load: 0.95 }), F3('SK', 'MD81', 11, '06:10', '08:55', 40, { base: 600, load: 0.95 }),
          F3('SK', 'MD81', 4, '06:30', '07:45', 0, { parked: true, base: 650, load: 0.95 }), F3('SK', 'DC10', 1, '07:30', '07:30', 75, { base: 950, load: 0.9 })],
        goal: [{ k: 'checkinWait', max: 5 }, { k: 'maxWait', max: 5 }] },
      { name: 'Evening peak', mode: 'ops', from: '16:00', to: '19:00', weather: { temp: 9, wind: [220, 8] }, desks: 6,
        events: [{ at: '17:00', do: 'fail', dom: 'checkin', min: 40 }],
        flights: [F3('LF', 'F28', 13, '16:05', '18:45', 35, { base: 200, load: 0.95 }), F3('SK', 'MD81', 10, '16:10', '18:55', 40, { base: 700, load: 0.95 }),
          F3('SK', 'B747', 1, '16:40', '16:40', 125, { base: 900, load: 0.85 }), F3('STERLING', 'B727', 2, '17:00', '17:50', 55, { base: 500, load: 0.95 })],
        goal: [{ k: 'checkinWait', max: 5 }, { k: 'maxWait', max: 5 }] }
    ],
    goal: [],
    stars: [{ k: 'checkinWait', max: 2 }, { k: 'onTime', p: 0.9 }]
  },
  {
    name: 'Payback', kind: 'business', date: '1988-03-07', requires: BUILT_1983.concat(['computerRoom']),
    setup: { open: true, items: ITEMS_1983, desks: 26, airlines: ROUTES_1988, domains: Object.assign({}, TEAMS_1976, { stands: 2, info: 2 }), it: 3 },
    brief: [
      'The owner wants to know what each krona brings back. Some investments pay back in months, some in decades.',
      'A walk-through duty-free shop, a restaurant, a big car park: each costs money now and earns a little every day.',
      'What counts is how much the airport earns in a month by the end of the summer.'
    ],
    aim: 'Invest so that the airport earns at least 17 MSEK in the last month.',
    news: [
      { icon: '📈', text: 'Payback: what an investment costs, divided by what it earns a month.' }
    ],
    stages: [
      { name: 'Spring', mode: 'plan', days: 70, goal: [],
        choices: [{ id: 'shop', at: 3, default: 'none', icon: '🛍️', title: 'Shops in the terminal',
          text: 'A walk-through duty-free shop earns on every international passenger and pays back in about a year. A restaurant is cheaper and earns less.',
          options: [
            { id: 'dutyFree', build: 'dutyFree', label: 'Duty free' },
            { id: 'restaurant', build: 'restaurant', label: 'A restaurant' },
            { id: 'none', label: 'Nothing' }
          ] }] },
      { name: 'Summer', mode: 'plan', days: 70, goal: [],
        choices: [{ id: 'parking', at: 3, default: 'none', icon: '🚗', title: 'A big car park',
          text: 'More people drive to Arlanda every year. A car park for 1 200 cars earns every day.',
          options: [
            { id: 'big', build: 'parkingBig', label: 'Build it' },
            { id: 'none', label: 'No' }
          ] }] },
      { name: 'Late summer', mode: 'plan', days: 70, goal: [],
        choices: [{ id: 'restaurant2', at: 3, default: 'none', icon: '🍽️', title: 'A second restaurant',
          text: 'A restaurant company offers to run one by the domestic gates.',
          options: [
            { id: 'yes', build: 'restaurant', label: 'Yes' },
            { id: 'none', label: 'No' }
          ] }] }
    ],
    goal: [{ k: 'lastMonth', min: 17e6 }],
    stars: [{ k: 'lastMonth', min: 20e6 }, { k: 'airlines', min: 70 }]
  },
  {
    name: 'Flygbussarna', kind: 'choice', date: '1989-04-03', requires: BUILT_1983.concat(['computerRoom']),
    setup: { open: true, items: ITEMS_1983, desks: 26, airlines: ROUTES_1988, domains: Object.assign({}, TEAMS_1976, { stands: 2, info: 2 }), it: 3 },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'Stockholm\'s public transport company is starting airport coaches this year, called Flygbussarna, from the city straight to the terminals.',
      'They need stops at the kerb. Coaches mean fewer cars — less parking income, but quieter roads, and happier passengers who do not have to drive.',
      'Or put the money in another car park instead.'
    ],
    aim: 'Win the neighbours over with the airport coaches, and run a summer evening.',
    news: [
      { icon: '🚌', text: 'Flygbussarna: coaches from the city to the terminals.' }
    ],
    facts: [
      { text: 'Stockholm\'s public transport company SL started its airport coaches under the name Flygbussarna in 1989.', src: 'en.wikipedia Flygbussarna' }
    ],
    stages: [
      { name: 'The coaches', mode: 'plan', days: 40, goal: [],
        choices: [{ id: 'coaches', at: 4, default: 'none', icon: '🚌', title: 'Stops for the coaches',
          text: 'SL asks for coach stops at the kerb of every terminal. The car park company offers to build another car park instead.',
          options: [
            { id: 'stops', build: 'busStop', neighboursBase: 4, meters: { neighbours: 5, passengers: 4 }, label: 'Stops for Flygbussarna' },
            { id: 'parking', build: 'parkingSmall', meters: { neighbours: -3 }, label: 'Another car park' },
            { id: 'none', label: 'Neither' }
          ] }] },
      { name: 'Summer evening', mode: 'ops', date: '1989-06-19', from: '16:00', to: '19:00', weather: { temp: 21, wind: [230, 8] }, desks: 12,
        flights: [F3('LF', 'F28', 10, '16:05', '18:35', 35, { base: 200 }), F3('SK', 'MD81', 8, '16:10', '18:40', 40, { base: 700 }),
          F3('SK', 'B747', 1, '16:40', '16:40', 125, { base: 900, load: 0.75 }), F3('STERLING', 'B727', 2, '17:00', '18:00', 55, { base: 500, load: 0.95 })],
        goal: [{ k: 'onTime', p: 0.8 }] }
    ],
    goal: [{ k: 'neighbours', min: 74 }],
    stars: [{ k: 'passengers', min: 92 }, { k: 'onTime', p: 0.9 }]
  },
  {
    name: 'Exam: Domestic Rush', kind: 'exam', date: '1989-12-18', requires: BUILT_1983.concat(['computerRoom', 'terminal3']),
    setup: { open: true, items: ITEMS_1983, desks: 26, airlines: ROUTES_1988, domains: Object.assign({}, TEAMS_1976, { stands: 2, info: 2 }), it: 3 },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'plough'],
    brief: [
      'The Monday before Christmas: everybody flies home, to Luleå, Umeå, Göteborg and Malmö. The busiest day of the decade.',
      'Snow in the morning, the flu in the teams, and the electricians have warned that the power may go at noon.',
      'Everything you learnt in this chapter, in three stages. Prepare well.'
    ],
    aim: 'Get through the Christmas rush: snow, a power cut and a failing computer.',
    news: [
      { icon: '🎓', text: 'The exam: everything of the chapter.' },
      { icon: '🔌', text: 'A power cut stops every system without backup power.' },
      { icon: '🛫', text: 'The regional terminal: the owner has built a small hall for the domestic propeller flights between the terminals.' }
    ],
    facts: [
      { text: 'Terminal 3 opened in August 1989 for the smaller airlines\' propeller routes that moved from Bromma.', src: 'sv.wikipedia Stockholm-Arlanda flygplats' }
    ],
    stages: [
      { name: 'Snowy morning', mode: 'ops', from: '06:00', to: '08:30', weather: { temp: -9, wind: [20, 8], snow: [['06:15', '08:00', 3]] }, desks: 6,
        sick: { turnaround: 0.15, checkin: 0.1 },
        flights: [F3('LF', 'F28', 11, '06:05', '08:15', 35, { base: 100, load: 0.95 }), F3('SK', 'MD81', 9, '06:10', '08:20', 40, { base: 600, load: 0.95 }),
          F3('SK', 'DC9', 3, '06:20', '07:20', 0, { parked: true, base: 650, load: 0.95 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 4 }] },
      { name: 'The power cut', mode: 'ops', from: '11:00', to: '13:30', weather: { temp: -6, wind: [30, 9] }, desks: 6,
        events: [{ at: '11:30', do: 'power', min: 60 }],
        flights: [F3('LF', 'F28', 11, '11:05', '13:15', 35, { base: 200, load: 0.95 }), F3('SK', 'MD81', 8, '11:10', '13:20', 40, { base: 700, load: 0.95 }),
          F3('SK', 'B747', 1, '11:40', '11:40', 125, { base: 900, load: 0.85 }), F3('LH', 'B727', 1, '12:20', '12:20', 50, { base: 3030 })],
        goal: [{ k: 'airportDelay', max: 4 }] },
      { name: 'Dark afternoon', mode: 'ops', from: '15:00', to: '17:30', weather: { temp: -8, wind: [10, 7] }, desks: 6,
        events: [{ at: '15:40', do: 'fail', dom: 'stands', min: 50 }, { at: '16:20', do: 'emergency' }],
        flights: [F3('LF', 'F28', 11, '15:05', '17:15', 35, { base: 300, load: 0.95 }), F3('SK', 'MD81', 9, '15:10', '17:20', 40, { base: 800, load: 0.95 }),
          F3('AY', 'DC9', 1, '16:10', '16:10', 45, { base: 810 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 4 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 2 }, { k: 'passengers', min: 74 }],
    paper: { head: 'CHRISTMAS RUSH: EVERYONE GOT HOME',
      text: 'Snow, the flu and a power cut at noon — and still the domestic flights left for the north and the south. "The computers helped, but it was the people who knew the old ways that saved the day," says the director.' }
  }
]);
