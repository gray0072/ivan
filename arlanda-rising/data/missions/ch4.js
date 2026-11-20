'use strict';

// Arlanda Rising — chapter 4, Open Skies (1990–1999): Terminal 2, the shops and the real brands in the terminals'
// units, deregulation and the new domestic airlines, the airlines' tempers and route incentives, the train question
// (Arlanda Express: the airport's own line or a concession) and its tunnel, security lanes and duty free, the bags by
// machine, the low-fare question, Copenhagen as a rival hub, the Christmas charters and, as the exam, the night the
// millennium turned. See data/missions/missions.js for the fields. The history the briefings tell is checked (`facts`
// with the source); the flights of a day, the people, the brands' units and the deals are the game's own story.

const SRC_SV4 = 'sv.wikipedia Stockholm-Arlanda flygplats; swedavia.com About the airport';
const BUILT_1989 = BUILT_1983.concat(['computerRoom']);
const BUILT_1990 = BUILT_1989.concat(['terminal2']);
const BUILT_1999 = BUILT_1990.concat(['arlandaExpress', 'sorterHall']);
const ITEMS_1990 = { fuelTruck: 6, plough: 6, crashTender: 2 };
const TEAMS_1990 = Object.assign({}, TEAMS_1976, { stands: 2, info: 2 });

const F4 = (al, type, n, from, to, turn, extra) => Object.assign({ al, type, n, from, to, turn, load: 0.74 }, extra || {});

const ROUTES_1990 = {
  SK: [{ type: 'DC9', perDay: 16, load: 0.72 }, { type: 'MD87', perDay: 8, load: 0.72 }, { type: 'B767', perDay: 3, load: 0.72 }],
  LF: [{ type: 'F28', perDay: 22, load: 0.74 }, { type: 'B737', perDay: 8, load: 0.74 }],
  LH: [{ type: 'B737', perDay: 4, load: 0.7 }], AY: [{ type: 'MD87', perDay: 4, load: 0.7 }]
};
const ROUTES_1993 = {
  SK: [{ type: 'DC9', perDay: 16, load: 0.72 }, { type: 'MD87', perDay: 10, load: 0.72 }, { type: 'B767', perDay: 3, load: 0.72 },
    { type: 'F28', perDay: 16, load: 0.72 }, { type: 'B737', perDay: 8, load: 0.74 }, { type: 'F50', perDay: 6, load: 0.7 }],
  LF: [],
  LH: [{ type: 'B737', perDay: 4, load: 0.7 }], AY: [{ type: 'MD87', perDay: 4, load: 0.7 }],
  PREMIAIR: [{ type: 'A320', perDay: 3, load: 0.9, months: [6, 7, 8, 12] }]
};
const ROUTES_1997 = {
  SK: [{ type: 'DC9', perDay: 14, load: 0.72 }, { type: 'MD87', perDay: 14, load: 0.74 }, { type: 'B767', perDay: 3, load: 0.74 },
    { type: 'B737', perDay: 12, load: 0.74 }, { type: 'F50', perDay: 6, load: 0.7 }],
  LH: [{ type: 'B737', perDay: 5, load: 0.72 }], AY: [{ type: 'MD87', perDay: 5, load: 0.72 }],
  PREMIAIR: [{ type: 'A320', perDay: 3, load: 0.9, months: [6, 7, 8, 12] }]
};

addMissions(4, [
  {
    name: 'Terminal 2', kind: 'build', date: '1990-03-05', requires: BUILT_1989,
    setup: { open: true, openSkies: true, units: true, lanes: 10, budget: 60e6, minMoney: 300e6, loanLimit: 250e6, items: ITEMS_1990, desks: 26, airlines: ROUTES_1990,
      domains: TEAMS_1990, it: 3, projects: ['terminal2'] },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'A new decade, and more people fly every year. The domestic terminal is full, so a second one is going up next to it: Inrikes 2.',
      'A terminal is more than desks and gates. It has shop units, and real shops and cafés want them: each pays rent, and earns more the longer the passengers have to spend.',
      'Build Terminal 2, fill its units in the Terminal view (T), then run the first morning there.'
    ],
    aim: 'Build Terminal 2, put real shops and cafés in the terminals, then run its first morning.',
    news: [
      { icon: '🏢', text: 'Terminal 2: a second domestic terminal with three gates.' },
      { icon: '🏪', text: 'Shop units: real brands pay rent and a share of what the passengers spend. Open the Terminal view with T.' },
      { icon: '🛂', text: 'Security lanes after check-in: a second queue on the way to the gates.' }
    ],
    facts: [
      { text: 'Inrikes 2, today Terminal 2, opened in 1990 for the domestic flights of SAS.', src: SRC_SV4 }
    ],
    stages: [
      { name: 'Terminal 2', mode: 'plan', days: 120, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'terminal2' }, { k: 'brands', min: 4 }],
        choices: [{ id: 'whoT2', at: 6, default: 'sas', icon: '✈️', title: 'Who moves into Terminal 2?',
          text: 'SAS would like the new terminal for its domestic flights, with gates next to the hall. Linjeflyg says it was here first.',
          options: [
            { id: 'sas', term: { code: 'SK', term: 't2' }, meters: { airlines: 3 }, label: 'SAS domestic' },
            { id: 'lf', term: { code: 'LF', term: 't2' }, meters: { airlines: 1 }, label: 'Linjeflyg' }
          ] }] },
      { name: 'The first morning in Terminal 2', mode: 'ops', date: '1990-12-17', from: '06:30', to: '09:30', weather: { temp: -4, wind: [20, 8] }, desks: 12,
        flights: [F4('SK', 'DC9', 12, '06:35', '09:00', 40, { base: 100, load: 0.85 }), F4('SK', 'MD87', 6, '06:50', '08:50', 40, { base: 300, load: 0.85 }),
          F4('LF', 'F28', 11, '06:40', '09:05', 35, { base: 400, load: 0.85 }), F4('LF', 'B737', 2, '07:00', '08:40', 40, { base: 450, load: 0.85 }),
          F4('SK', 'B767', 1, '07:40', '07:40', 90, { base: 900 }), F4('LH', 'B737', 2, '07:30', '08:30', 45, { base: 3020 }), F4('AY', 'MD87', 1, '08:20', '08:20', 45, { base: 800 })],
        goal: [{ k: 'onTime', p: 0.75 }] }
    ],
    goal: [],
    stars: [{ k: 'brandsIn', min: 60000 }, { k: 'checkinWait', max: 4 }]
  },
  {
    name: 'Deregulation', kind: 'business', date: '1992-06-29', requires: BUILT_1990,
    setup: { open: true, openSkies: true, units: true, lanes: 10, items: ITEMS_1990, desks: 36, airlines: ROUTES_1990, domains: TEAMS_1990, it: 3, terms: { SK: 't2' } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'From the first of July anyone may fly between Swedish cities. For thirty years SAS and Linjeflyg shared them all; now the doors are open.',
      'Transwede, an airline based right here, wants to fly to Visby, Malmö and Umeå — if its fees are low enough. Each airline has its own temper: look at them in the Airlines screen (A).',
      'More airlines bring more flights and passengers. But the old ones notice who gets a discount.'
    ],
    aim: 'Decide how to welcome the new domestic airlines, then run the first summer morning of open skies.',
    news: [
      { icon: '🔓', text: 'Deregulation: any airline may fly inside Sweden.' },
      { icon: '🤝', text: 'Route incentives: a share of an airline\'s fees off for two years, to win a new route.' },
      { icon: '📋', text: 'The Airlines screen (A): every airline\'s mood, fees, on-time share and temper.' }
    ],
    facts: [
      { text: 'Swedish domestic flying was deregulated on 1 July 1992.', src: 'Konkurrensverket, Avreglering av inrikesflyget (1996:1)' },
      { text: 'Transwede, based at Arlanda since 1986, flew its first domestic route, Stockholm–Visby, on 22 July 1992.', src: 'en.wikipedia Transwede' }
    ],
    stages: [
      { name: 'Open skies', mode: 'plan', days: 30, goal: [],
        choices: [
          { id: 'transwede', at: 3, default: 'no', icon: '✈️', title: 'Transwede wants to fly domestic',
            text: 'Transwede would start four domestic flights a day with its MD-87s, for a quarter off its fees for two years. SAS would rather it did not.',
            options: [
              { id: 'yes', court: { code: 'TRANSWEDE', share: 0.25 }, label: 'A quarter off: welcome' },
              { id: 'no', meters: { airlines: 2 }, label: 'Normal fees only' }
            ] },
          { id: 'fees', at: 15, default: 'normal', icon: '💰', title: 'The fee level',
            text: 'With more airlines, the fees matter more. Lower fees make every airline happier; higher fees bring more money now.',
            options: [
              { id: 'low', fees: 'low', label: 'Lower fees' },
              { id: 'normal', fees: 'normal', label: 'As they are' },
              { id: 'high', fees: 'high', label: 'Higher fees' }
            ] }] },
      { name: 'A summer morning', mode: 'ops', date: '1992-08-24', from: '06:30', to: '09:30', weather: { temp: 14, wind: [210, 9] }, desks: 14,
        flights: [F4('SK', 'DC9', 10, '06:35', '09:00', 40, { base: 100, load: 0.85 }), F4('SK', 'MD87', 6, '06:45', '08:55', 40, { base: 300, load: 0.85 }),
          F4('LF', 'F28', 10, '06:40', '09:05', 35, { base: 400, load: 0.85 }), F4('LF', 'B737', 4, '07:00', '08:40', 40, { base: 450, load: 0.85 }),
          F4('TRANSWEDE', 'MD87', 4, '06:50', '08:50', 35, { base: 200, load: 0.8, when: ['transwede', 'yes'] }),
          F4('SK', 'B767', 1, '07:50', '07:50', 90, { base: 900 }), F4('AY', 'MD87', 1, '08:20', '08:20', 45, { base: 800 })],
        goal: [{ k: 'onTime', p: 0.8 }] }
    ],
    goal: [{ k: 'perDay', code: 'TRANSWEDE', min: 4 }],
    stars: [{ k: 'onTime', p: 0.9 }, { k: 'airlines', min: 80 }]
  },
  {
    name: 'The Train Question', kind: 'choice', date: '1994-02-07', requires: BUILT_1990,
    setup: { open: true, openSkies: true, units: true, lanes: 10, items: ITEMS_1990, desks: 36, airlines: ROUTES_1993, domains: TEAMS_1990, it: 3, terms: { SK: 't2' } },
    hands: [],
    brief: [
      'A fast train from Stockholm, twenty minutes into a tunnel under the terminals: it would bring more passengers, fewer cars and happier neighbours.',
      'Build it with the airport\'s own money and keep the ticket income — billions now, paid back over decades. Or let a group of companies build it as a concession: free for you, but the tickets are theirs.',
      'And the car parks? The train will take a third of their drivers. Look at every choice\'s payback in Finance (F).'
    ],
    aim: 'Decide who builds the train to Arlanda, and whether a new car park still pays.',
    news: [
      { icon: '🚄', text: 'Arlanda Express: your own line, or a concession.' },
      { icon: '📈', text: 'Finance (F): every investment\'s payback, and under Details its net present value.' }
    ],
    facts: [
      { text: 'In August 1994 the state picked a group of companies — NCC, SIAB, Vattenfall, GEC Alsthom and John Mowlem — to build and run the line as A-Train AB, with a concession until 2040.', src: 'sv.wikipedia Arlandabanan; arlandabananinfrastructure.se' }
    ],
    stages: [
      { name: 'The tender', mode: 'plan', days: 60, goal: [],
        choices: [{ id: 'trainDeal', at: 4, default: 'wait', icon: '🚄', title: 'Who builds the train?',
          text: 'The line costs about 3 900 MSEK. Own it: the owner pays half, you pay the rest and keep 45 SEK of every train passenger\'s ticket. A concession: the companies pay it all, and you get a station fee of 6 SEK a passenger.',
          options: [
            { id: 'own', train: 'own', flag: 'trainChosen', meters: { neighbours: 3 }, label: 'Our own line' },
            { id: 'concession', train: 'concession', flag: 'trainChosen', meters: { neighbours: 3 }, label: 'A concession' },
            { id: 'wait', meters: { neighbours: -2 }, label: 'Ask for another year' }
          ] }] },
      { name: 'The car park', mode: 'plan', days: 60, goal: [],
        choices: [{ id: 'carPark', at: 3, default: 'no', icon: '🚗', title: 'One more car park?',
          text: 'The car park company offers a car park for 1 200 cars. It earns every day — until the train comes and takes a third of its drivers.',
          options: [
            { id: 'build', build: 'parkingBig', meters: { neighbours: -3 }, label: 'Build it' },
            { id: 'no', label: 'Wait for the train' }
          ] }] }
    ],
    goal: [{ k: 'flag', id: 'trainChosen' }],
    stars: [{ k: 'lastMonth', min: 20e6 }, { k: 'neighbours', min: 72 }]
  },
  {
    name: 'Duty Free', kind: 'business', date: '1995-02-06', requires: BUILT_1990,
    setup: { open: true, openSkies: true, units: true, lanes: 10, items: ITEMS_1990, desks: 36, airlines: ROUTES_1993, domains: TEAMS_1990, it: 3, terms: { SK: 't2' } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'Sweden joined the European Union on New Year\'s Day. Travellers to other EU countries may still buy tax-free for a few years — and they love it.',
      'But a passenger stuck in the security queue buys nothing. Every minute saved there is a minute in the shops.',
      'First see the queue, then add lanes and shops, and run the evening again.'
    ],
    aim: 'Shorten the security queue and fill the international terminal\'s shops.',
    news: [
      { icon: '🛂', text: 'Security: lanes cost every month, but a short queue means more time in the shops.' },
      { icon: '🛍️', text: 'Duty free: a big shop for the international passengers.' }
    ],
    facts: [
      { text: 'Sweden joined the European Union on 1 January 1995; tax-free sales between EU countries ended on 1 July 1999.', src: 'government.se; prop. 1998/99:86' }
    ],
    stages: [
      { name: 'A Friday evening', mode: 'ops', date: '1995-02-10', from: '15:00', to: '18:00', weather: { temp: -2, wind: [220, 9] }, desks: 14,
        events: [{ at: '15:00', do: 'lanesShut', n: 2, text: 'New X-ray machines are being fitted: two lanes are closed tonight.' }],
        flights: [F4('SK', 'MD87', 8, '15:05', '17:40', 45, { base: 100, intl: true, load: 0.85 }), F4('SK', 'B737', 7, '15:10', '17:30', 40, { base: 300, load: 0.85 }),
          F4('LH', 'B737', 3, '15:30', '17:10', 45, { base: 3020, load: 0.85 }), F4('AY', 'MD87', 2, '15:40', '17:20', 45, { base: 800, load: 0.85 }),
          F4('SK', 'B767', 1, '16:00', '16:00', 90, { base: 900 }), F4('SK', 'F28', 8, '15:15', '17:45', 35, { base: 500, load: 0.85 }),
          F4('SK', 'DC9', 8, '15:20', '17:40', 40, { base: 600, load: 0.85 }), F4('SK', 'MD87', 5, '15:25', '17:35', 45, { base: 150, intl: true, load: 0.85 })],
        goal: [{ k: 'onTime', p: 0.7 }] },
      { name: 'Spring', mode: 'plan', days: 60, goal: [],
        choices: [{ id: 'dutyFree', at: 3, default: 'no', icon: '🛍️', title: 'A walk-through duty-free shop',
          text: 'Every international passenger would walk through it on the way to the gates. It needs the biggest unit — and passengers with time to spare.',
          options: [
            { id: 'yes', build: 'dutyFree', label: 'Build it' },
            { id: 'no', label: 'Not now' }
          ] }] },
      { name: 'A Friday in May', mode: 'ops', date: '1995-05-12', from: '15:00', to: '18:00', weather: { temp: 15, wind: [200, 8] }, desks: 14,
        flights: [F4('SK', 'MD87', 8, '15:05', '17:40', 45, { base: 200, intl: true, load: 0.85 }), F4('SK', 'B737', 7, '15:10', '17:30', 40, { base: 400, load: 0.85 }),
          F4('LH', 'B737', 3, '15:30', '17:10', 45, { base: 3030, load: 0.85 }), F4('AY', 'MD87', 2, '15:40', '17:20', 45, { base: 810, load: 0.85 }),
          F4('SK', 'B767', 1, '16:00', '16:00', 90, { base: 910 }), F4('SK', 'F28', 8, '15:15', '17:45', 35, { base: 650, load: 0.85 }),
          F4('SK', 'DC9', 8, '15:20', '17:40', 40, { base: 700, load: 0.85 }), F4('SK', 'MD87', 5, '15:25', '17:35', 45, { base: 250, intl: true, load: 0.85 })],
        goal: [{ k: 'securityWait', max: 3 }, { k: 'checkinWait', max: 3 }] }
    ],
    goal: [],
    stars: [{ k: 'securityWait', max: 8 }, { k: 'brandsIn', min: 3e6 }]
  },
  {
    name: 'Building the Tunnel', kind: 'build', date: '1995-05-02', requires: BUILT_1990,
    setup: { open: true, openSkies: true, units: true, lanes: 12, budget: 40e6, loanLimit: 2500e6, items: ITEMS_1990, desks: 36, airlines: ROUTES_1993, domains: TEAMS_1990, it: 3,
      terms: { SK: 't2' }, projects: ['arlandaExpress'], trainDeal: 'concession' },
    grants: ['arlandaExpress'],
    hands: [],
    brief: [
      'The diggers are here. A tunnel goes under the terminals, with a station at each end: Arlanda South for Terminals 2–4 and Arlanda North for Terminal 5.',
      'If the line is your own, you pay for every metre — the owner\'s grant pays half. If it is a concession, the companies pay and you make room for them.',
      'The works close a car park and fill the roads with lorries. Keep the passengers and the neighbours on your side.'
    ],
    aim: 'Build the tunnel, the line and the two stations while the airport keeps running.',
    news: [
      { icon: '🚇', text: 'The tunnel: two stations under the terminals; the trains run from November 1999.' }
    ],
    facts: [
      { text: 'Building began in 1995; the first Arlanda Express train ran on 24 November 1999.', src: 'arlandabananinfrastructure.se History of Arlandabanan; sv.wikipedia Arlandabanan' },
      { text: 'Arlanda South serves Terminals 2–4, Arlanda North Terminal 5.', src: 'sv.wikipedia Arlandabanan' }
    ],
    stages: [
      { name: 'The tunnel and the line', mode: 'plan', days: 110, crews: 2, endEarly: true,
        goal: [{ k: 'project', id: 'arlandaExpress', stages: ['tunnel', 'line'] }],
        choices: [{ id: 'works', at: 5, default: 'buses', icon: '🚧', title: 'A car park closes for the works',
          text: 'For a year the tunnel needs the car park in front of the terminals. Where do the drivers go?',
          options: [
            { id: 'temporary', money: -10e6, meters: { neighbours: -2, passengers: 2 }, label: 'A temporary car park in the forest' },
            { id: 'buses', money: -4e6, meters: { passengers: -2 }, label: 'Shuttle buses from far away' }
          ] }] },
      { name: 'The stations', mode: 'plan', days: 55, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'arlandaExpress' }] }
    ],
    goal: [{ k: 'train' }],
    stars: [{ k: 'passengers', min: 76 }, { k: 'neighbours', min: 72 }]
  },
  {
    name: 'Route Incentive', kind: 'business', date: '1996-08-05', requires: BUILT_1990.concat(['arlandaExpress']),
    setup: { open: true, openSkies: true, units: true, lanes: 12, items: ITEMS_1990, desks: 36, airlines: ROUTES_1997, domains: TEAMS_1990, it: 3, terms: { SK: 't2' } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'Braathens of Norway has bought half of Transwede and wants its own flights between Oslo and Stockholm. It is choosing between Arlanda and Bromma.',
      'A route incentive takes a share off its fees for two years. Too little, and it says no; too much, and you give away money.',
      'Find the right offer in the Airlines screen — or in the decision — and then make its first morning a good one.'
    ],
    aim: 'Win the Oslo route with a route incentive, then run its first morning.',
    news: [
      { icon: '🤝', text: 'Court an airline: in the Airlines screen (A), offer a share off its fees.' }
    ],
    facts: [
      { text: 'Braathens bought half of Transwede on 25 June 1996 and started flying Oslo–Stockholm on 6 November 1996.', src: 'en.wikipedia History of Braathens 1994–2004' }
    ],
    stages: [
      { name: 'The offer', mode: 'plan', days: 40, goal: [],
        choices: [{ id: 'braathens', at: 4, default: 'none', icon: '🤝', title: 'Braathens\' Oslo route',
          text: 'Braathens\' people say a fair offer is a quarter off its fees for two years. Bromma has offered something too.',
          options: [
            { id: 'tenth', court: { code: 'BRAATHENS', share: 0.1 }, label: 'A tenth off' },
            { id: 'quarter', court: { code: 'BRAATHENS', share: 0.25 }, label: 'A quarter off' },
            { id: 'half', court: { code: 'BRAATHENS', share: 0.5 }, label: 'Half off' },
            { id: 'none', label: 'No offer' }
          ] }] },
      { name: 'Oslo morning', mode: 'ops', date: '1996-11-11', from: '07:00', to: '10:00', weather: { temp: 1, wind: [210, 10] }, desks: 14,
        flights: [F4('SK', 'MD87', 9, '07:05', '09:35', 40, { base: 100, load: 0.85 }), F4('SK', 'B737', 8, '07:10', '09:30', 40, { base: 300, load: 0.85 }),
          F4('BRAATHENS', 'B737', 3, '07:20', '09:20', 40, { base: 500, load: 0.8, when: ['braathens', 'quarter', 'half'] }),
          F4('SK', 'DC9', 7, '07:15', '09:40', 40, { base: 600, load: 0.85 }), F4('LH', 'B737', 2, '07:50', '08:50', 45, { base: 3020 }),
          F4('AY', 'MD87', 1, '08:40', '08:40', 45, { base: 800 })],
        goal: [{ k: 'onTime', p: 0.8 }] }
    ],
    goal: [{ k: 'perDay', code: 'BRAATHENS', min: 3 }],
    stars: [{ k: 'mood', code: 'BRAATHENS', min: 77 }, { k: 'onTime', p: 0.9 }]
  },
  {
    name: 'Bags by Machine', kind: 'build', date: '1997-02-03', requires: BUILT_1990.concat(['arlandaExpress']),
    setup: { open: true, openSkies: true, units: true, lanes: 12, budget: 20e6, items: ITEMS_1990, desks: 36, airlines: ROUTES_1997, domains: TEAMS_1990, it: 3,
      terms: { SK: 't2' }, projects: ['sorterHall'], unlock: { baggage: 3 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'The belts carry the bags, but people still read every tag and throw each bag onto the right cart. On a busy morning some end up on the wrong flight.',
      'A sorting system reads a bar code on every tag and sends the bag to its flight by itself. It needs a hall of its own and IT people — and when it stops, the old belts must take over.',
      'First a morning with the belts, then the machine.'
    ],
    aim: 'Build the sorting hall and the bar-code system, and lose fewer bags.',
    news: [
      { icon: '🏷️', text: 'Bar-code sorting: the third level of the bags. When it fails, the belts take over.' }
    ],
    stages: [
      { name: 'Belts and hands', mode: 'ops', date: '1997-02-10', from: '07:00', to: '10:00', weather: { temp: -5, wind: [30, 8] }, desks: 14,
        events: [{ at: '08:10', do: 'fail', dom: 'baggage', min: 35 }],
        flights: [F4('SK', 'MD87', 10, '07:05', '09:35', 40, { base: 100, load: 0.85 }), F4('SK', 'B737', 9, '07:10', '09:30', 40, { base: 300, load: 0.85 }),
          F4('SK', 'DC9', 7, '07:15', '09:40', 40, { base: 600, load: 0.85 }), F4('SK', 'B767', 1, '07:40', '07:40', 90, { base: 900 }),
          F4('LH', 'B737', 2, '07:50', '08:50', 45, { base: 3020 })],
        goal: [{ k: 'onTime', p: 0.75 }] },
      { name: 'The sorting hall', mode: 'plan', days: 70, crews: 2, endEarly: true, goal: [{ k: 'level', dom: 'baggage', min: 3 }] },
      { name: 'The machine\'s morning', mode: 'ops', date: '1997-05-12', from: '07:00', to: '10:00', weather: { temp: 11, wind: [200, 8] }, desks: 14,
        events: [{ at: '08:30', do: 'fail', dom: 'baggage', min: 40 }],
        flights: [F4('SK', 'MD87', 10, '07:05', '09:35', 40, { base: 200, load: 0.85 }), F4('SK', 'B737', 9, '07:10', '09:30', 40, { base: 400, load: 0.85 }),
          F4('SK', 'DC9', 7, '07:15', '09:40', 40, { base: 700, load: 0.85 }), F4('SK', 'B767', 1, '07:40', '07:40', 90, { base: 910 }),
          F4('LH', 'B737', 2, '07:50', '08:50', 45, { base: 3030 })],
        goal: [{ k: 'lostBags', max: 8 }] }
    ],
    goal: [],
    stars: [{ k: 'lostBags', max: 30 }, { k: 'passengers', min: 90 }]
  },
  {
    name: 'The Low-Fare Question', kind: 'choice', date: '1997-06-02', requires: BUILT_1990.concat(['arlandaExpress', 'sorterHall']),
    setup: { open: true, openSkies: true, units: true, lanes: 12, items: ITEMS_1990, desks: 36, airlines: ROUTES_1997, domains: Object.assign({}, TEAMS_1990, { baggage: 3 }), it: 6,
      terms: { SK: 't2' } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'This June Ryanair began flying from Skavsta, a hundred kilometres south, to London — for a fraction of the old fares, because Skavsta asks so little.',
      'Should Arlanda have a low-fare deal of its own? Half off the fees, remote stands, half an hour on the ground. Crowds of young travellers would come — and they shop.',
      'SAS will not like it. Both ways can work: which one is yours?'
    ],
    aim: 'Decide whether to invite a low-fare airline, then run a summer evening.',
    news: [
      { icon: '💸', text: 'Low-cost airlines: low fees, quick turnarounds, remote stands — and many passengers.' }
    ],
    facts: [
      { text: 'Ryanair\'s first Stockholm route, Skavsta–London Stansted, began in June 1997.', src: 'en.wikipedia Stockholm Skavsta Airport' }
    ],
    stages: [
      { name: 'The question', mode: 'plan', days: 30, goal: [],
        choices: [{ id: 'lowFare', at: 3, default: 'later', icon: '💸', title: 'A low-fare deal?',
          text: 'Ryanair would bring four flights a day from London if it paid half the fees. SAS says that is unfair to the airlines that pay in full.',
          options: [
            { id: 'invite', court: { code: 'RYANAIR', share: 0.5 }, build: 'stand', flag: 'lowFareAnswered', meters: { passengers: 3 }, label: 'Invite it, half the fees' },
            { id: 'no', flag: 'lowFareAnswered', meters: { airlines: 3 }, label: 'Keep the fees for everyone' },
            { id: 'later', label: 'Leave it for now' }
          ] }] },
      { name: 'A summer evening', mode: 'ops', date: '1997-08-15', from: '16:00', to: '19:00', weather: { temp: 20, wind: [230, 8] }, desks: 14,
        flights: [F4('SK', 'MD87', 9, '16:05', '18:35', 40, { base: 100, load: 0.85 }), F4('SK', 'B737', 8, '16:10', '18:30', 40, { base: 300, load: 0.85 }),
          F4('RYANAIR', 'B737', 4, '16:15', '18:15', 30, { base: 500, load: 0.92, when: ['lowFare', 'invite'] }),
          F4('PREMIAIR', 'A320', 3, '16:30', '17:30', 55, { base: 700, load: 0.95 }), F4('SK', 'DC9', 4, '16:20', '18:20', 40, { base: 600, load: 0.85 }),
          F4('LH', 'B737', 2, '16:50', '17:50', 45, { base: 3020 })],
        goal: [{ k: 'onTime', p: 0.65 }] }
    ],
    goal: [{ k: 'flag', id: 'lowFareAnswered' }],
    stars: [{ k: 'brandsIn', min: 50000 }, { k: 'airlines', min: 72 }]
  },
  {
    name: 'Hub Wars', kind: 'operate', date: '1998-10-05', requires: BUILT_1990.concat(['arlandaExpress', 'sorterHall']),
    setup: { open: true, openSkies: true, units: true, lanes: 12, items: ITEMS_1990, desks: 36, airlines: ROUTES_1997, domains: Object.assign({}, TEAMS_1990, { baggage: 3 }), it: 6,
      terms: { SK: 't2' }, rivals: { pull: 2, months: 6 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce'],
    brief: [
      'Copenhagen has opened a new terminal with its own railway station. Every airline with a network counts the minutes a transfer takes, and Copenhagen is close.',
      'From now on an unhappy airline may move flights to a rival airport. A transfer wave that runs late, a remote stand for a business airline, high fees: each one counts.',
      'Run the morning transfer wave on time, then keep SAS and the network airlines with you through the winter.'
    ],
    aim: 'Run a transfer wave on time, and keep SAS happy through a winter while Copenhagen pulls at it.',
    news: [
      { icon: '🏁', text: 'Rival airports pull at the network airlines every month; one with a deal stays loyal. Under mood 45 an airline moves flights away.' },
      { icon: '🔁', text: 'A transfer wave: many arrivals, then many departures an hour later.' }
    ],
    facts: [
      { text: 'Copenhagen Airport opened Terminal 3 and its railway station in 1998; the station opened on 27 September.', src: 'en.wikipedia Copenhagen Airport' }
    ],
    stages: [
      { name: 'The transfer wave', mode: 'ops', date: '1998-10-05', from: '06:30', to: '09:30', weather: { temp: 2, wind: [220, 11] }, desks: 14,
        flights: [F4('SK', 'MD87', 10, '06:40', '07:25', 55, { base: 100, load: 0.85 }), F4('SK', 'B737', 9, '06:45', '07:30', 55, { base: 300, load: 0.85 }),
          F4('SK', 'B767', 2, '07:00', '07:40', 95, { base: 900, load: 0.85 }), F4('LH', 'B737', 2, '07:10', '08:20', 45, { base: 3020 }),
          F4('AY', 'MD87', 2, '07:20', '08:30', 45, { base: 800 }), F4('SK', 'DC9', 6, '07:40', '08:40', 40, { base: 600, load: 0.85 })],
        goal: [{ k: 'onTime', p: 0.8 }] },
      { name: 'The winter', mode: 'plan', days: 150, goal: [],
        choices: [{ id: 'hubDeal', at: 3, default: 'none', icon: '🤝', title: 'SAS asks for a better deal',
          text: 'SAS reminds you that Copenhagen is cheaper for transfers. It asks for a tenth off its fees for two years.',
          options: [
            { id: 'incentive', incentive: { code: 'SK', share: 0.1 }, label: 'A tenth off for SAS' },
            { id: 'fees', fees: 'low', label: 'Lower fees for everyone' },
            { id: 'none', label: 'No discount' }
          ] }] }
    ],
    goal: [{ k: 'mood', code: 'SK', min: 70 }],
    stars: [{ k: 'airlines', min: 80 }, { k: 'airportDelay', max: 3.5 }]
  },
  {
    name: 'Christmas Rush', kind: 'operate', date: '1998-12-01', requires: BUILT_1990.concat(['arlandaExpress', 'sorterHall']),
    setup: { open: true, openSkies: true, units: true, lanes: 12, items: ITEMS_1990, desks: 36,
      airlines: Object.assign({}, ROUTES_1997, { NOVAIR: [{ type: 'A320', perDay: 2, load: 0.92, months: [6, 7, 8, 12] }] }),
      domains: Object.assign({}, TEAMS_1990, { baggage: 3 }), it: 6, terms: { SK: 't2' } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'plough'],
    brief: [
      'The week before Christmas, families fly to the sun: Premiair and Novair fill their Airbuses for the Canary Islands and Thailand.',
      'Children with suitcases and an hour to wait. A café, a toy shop or a burger by the gate makes that hour better — and earns more than on any other week.',
      'Snow is forecast for Saturday morning. Get ready.'
    ],
    aim: 'Get the Christmas charters away through the snow, with happy families.',
    news: [
      { icon: '🎄', text: 'Families: in summer and at Christmas the children\'s favourites earn twice as much.' }
    ],
    facts: [
      { text: 'Novair began flying in November 1997 for the tour operator Apollo; Premiair was formed in 1994 from Scanair and Conair.', src: 'en.wikipedia Novair; en.wikipedia Sunclass Airlines' }
    ],
    stages: [
      { name: 'Getting ready', mode: 'plan', days: 18, goal: [],
        choices: [{ id: 'kids', at: 3, default: 'none', icon: '🧸', title: 'Something for the children',
          text: 'Two companies want a unit by the gates for the holidays.',
          options: [
            { id: 'brio', brand: { term: 'intl', id: 'brio' }, label: 'BRIO toys' },
            { id: 'max', brand: { term: 'intl', id: 'max' }, label: 'Max burgers' },
            { id: 'none', label: 'Neither' }
          ] }] },
      { name: 'Snowy Saturday', mode: 'ops', date: '1998-12-19', from: '06:00', to: '09:00', weather: { temp: -6, wind: [30, 9], snow: [['06:20', '07:50', 3]] }, desks: 14,
        flights: [F4('PREMIAIR', 'A320', 4, '06:10', '07:40', 60, { base: 100, load: 0.97 }), F4('NOVAIR', 'A320', 3, '06:20', '07:30', 60, { base: 300, load: 0.97 }),
          F4('SK', 'MD87', 9, '06:15', '08:40', 40, { base: 500, load: 0.85 }), F4('SK', 'B737', 8, '06:20', '08:30', 40, { base: 600, load: 0.85 }),
          F4('SK', 'DC9', 4, '06:30', '08:20', 40, { base: 650, load: 0.85 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'checkinWait', max: 3 }] },
      { name: 'The evening wave', mode: 'ops', from: '15:00', to: '18:00', weather: { temp: -8, wind: [20, 7] }, desks: 14,
        flights: [F4('PREMIAIR', 'A320', 3, '15:10', '16:10', 60, { base: 200, load: 0.97 }), F4('NOVAIR', 'A320', 2, '15:20', '16:20', 60, { base: 400, load: 0.97 }),
          F4('SK', 'MD87', 9, '15:05', '17:35', 40, { base: 700, load: 0.85 }), F4('SK', 'B737', 8, '15:10', '17:30', 40, { base: 800, load: 0.85 }),
          F4('SK', 'B767', 1, '15:40', '15:40', 95, { base: 900 })],
        goal: [{ k: 'onTime', p: 0.8 }] }
    ],
    goal: [],
    stars: [{ k: 'passengers', min: 88 }, { k: 'brandsIn', min: 80000 }]
  },
  {
    name: 'Exam: Millennium Night', kind: 'exam', date: '1999-12-06', requires: BUILT_1999,
    setup: { open: true, openSkies: true, units: true, lanes: 12, items: ITEMS_1990, desks: 36,
      airlines: Object.assign({}, ROUTES_1997, { NOVAIR: [{ type: 'A320', perDay: 2, load: 0.92, months: [6, 7, 8, 12] }] }),
      domains: Object.assign({}, TEAMS_1990, { baggage: 3 }), it: 6, terms: { SK: 't2' } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'plough'],
    brief: [
      'The year 2000 is coming, and nobody is quite sure what old computers will do when their clocks jump from 99 to 00.',
      'The trains have run to the terminals since 24 November. Every system you own has a clock inside. Test them now — or trust the suppliers.',
      'Then the last afternoon of the century, and the night itself. Everything you learnt in this chapter.'
    ],
    aim: 'Prepare every system for the year 2000, then run New Year\'s Eve and the night.',
    news: [
      { icon: '🎓', text: 'The exam: everything of the chapter.' },
      { icon: '🕛', text: 'Millennium night: a system not tested may stop at midnight.' }
    ],
    facts: [
      { text: 'Nothing went wrong at midnight: no aircraft was in Swedish airspace, the head of the civil aviation administration and his team waited at Arlanda, and at about two o\'clock two aircraft checked the landing aids. They were fine.', src: 'SIKA / LFV, Luftfart 2000' },
      { text: 'Arlanda had 17.1 million passengers in 1999.', src: 'SIKA, Luftfart 1999' }
    ],
    stages: [
      { name: 'December', mode: 'plan', days: 20, goal: [],
        choices: [{ id: 'y2k', at: 3, default: 'trust', icon: '🕛', title: 'The year 2000 problem',
          text: 'The IT department can test every system, change the clocks forward and fix what breaks: weeks of work and overtime. Or you can trust the suppliers\' letters that all is well.',
          options: [
            { id: 'test', money: -25e6, flag: 'y2kTested', label: 'Test everything' },
            { id: 'trust', label: 'Trust the suppliers' }
          ] }] },
      { name: 'The last afternoon', mode: 'ops', date: '1999-12-31', from: '13:00', to: '16:00', weather: { temp: -7, wind: [20, 8], snow: [['13:30', '14:40', 2.5]] }, desks: 14,
        flights: [F4('PREMIAIR', 'A320', 3, '13:10', '14:10', 60, { base: 100, load: 0.97 }), F4('NOVAIR', 'A320', 2, '13:30', '14:00', 60, { base: 300, load: 0.97 }),
          F4('SK', 'MD87', 9, '13:05', '15:35', 40, { base: 500, load: 0.9 }), F4('SK', 'B737', 9, '13:10', '15:30', 40, { base: 600, load: 0.9 }),
          F4('SK', 'DC9', 4, '13:20', '15:20', 40, { base: 650, load: 0.9 }),
          F4('LH', 'B737', 2, '14:10', '15:00', 45, { base: 3020 }), F4('AY', 'MD87', 1, '14:40', '14:40', 45, { base: 800 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'checkinWait', max: 4 }] },
      { name: 'Midnight', mode: 'ops', from: '22:00', to: '25:00', weather: { temp: -10, wind: [10, 5] }, desks: 8,
        events: [{ at: '24:00', do: 'fail', dom: 'stands', min: 90, unless: 'y2kTested' }, { at: '24:00', do: 'fail', dom: 'checkin', min: 90, unless: 'y2kTested' },
          { at: '24:00', do: 'fail', dom: 'info', min: 90, unless: 'y2kTested' }, { at: '24:00', do: 'fail', dom: 'baggage', min: 90, unless: 'y2kTested' },
          { at: '24:10', do: 'emergency' }],
        flights: [F4('SK', 'MD87', 6, '22:05', '23:30', 40, { base: 100 }), F4('SK', 'B737', 5, '22:10', '23:25', 40, { base: 200 }),
          F4('NOVAIR', 'A320', 2, '23:40', '24:10', 70, { base: 300, load: 0.6 }), F4('PREMIAIR', 'A320', 3, '24:00', '24:40', 60, { base: 400, load: 0.5 }),
          F4('SK', 'B737', 3, '24:10', '24:50', 45, { base: 500, load: 0.4 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 4 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 3 }, { k: 'passengers', min: 85 }],
    paper: { head: 'THE YEAR 2000 CAME — AND THE PLANES FLEW ON',
      text: 'Not a single clock stopped the airport at midnight. "Nothing happened, and that was the hard part," says the director, who spent the night in the tower with the IT people.' }
  }
]);
