'use strict';

// Arlanda Rising — chapter 5, A New Millennium (2001–2009): Schengen and the border's passport booths, the new control
// tower, Pier F, runway 3 and its taxiway bridges (two runways working side by side), the security rules after
// 2001 and the liquids of 2006 (security a domain of its own), Norwegian, the remote de-icing pads, real estate (Sky City,
// Cargo City, offices and hotels: rent that does not care about the traffic) and, as the exam, a snowy peak with all of it.
// See data/missions/missions.js for the fields. The history the briefings tell is checked (`facts` with the source); the
// flights of a day, the people, the deals and the bridges' story are the game's own.

const SRC_SV5 = 'swedavia.com About the airport; sv.wikipedia Stockholm-Arlanda flygplats';
const BUILT_2000 = BUILT_1999.concat(['skyCity', 'skyCity.hotel']);
const BUILT_2001 = BUILT_2000.concat(['schengen', 'schengen.t2']);
const BUILT_2002 = BUILT_2001.concat(['tower2', 'pierF', 'pierF.bridges']);
const BUILT_2003 = BUILT_2002.concat(['runway3', 'bridges']);
const BUILT_2005 = BUILT_2003.concat(['deicePads']);
const BUILT_2006 = BUILT_2005.concat(['cargoCity']);
const ITEMS_2000 = { fuelTruck: 6, plough: 7, crashTender: 3, generator: 1 };
const TEAMS_2000 = Object.assign({}, TEAMS_1990, { baggage: 3 });
const TEAMS_2003 = Object.assign({}, TEAMS_2000, { border: 1, security: 1 });
const TEAMS_2005 = Object.assign({}, TEAMS_2003, { deice: 2 });
const TERMS_2001 = { SK: 'intl', BA: 't2', AY: 't2', BRAATHENS: 't2' };

const F5 = (al, type, n, from, to, turn, extra) => Object.assign({ al, type, n, from, to, turn, load: 0.78 }, extra || {});

const ROUTES_2001 = {
  SK: [{ type: 'B736', perDay: 18, load: 0.72 }, { type: 'MD87', perDay: 12, load: 0.72 }, { type: 'A321', perDay: 4, load: 0.74 },
    { type: 'B767', perDay: 2, load: 0.78 }, { type: 'F50', perDay: 6, load: 0.7 }],
  BRAATHENS: [{ type: 'B737', perDay: 6, load: 0.72 }], LH: [{ type: 'A320', perDay: 5, load: 0.72 }], AY: [{ type: 'A320', perDay: 5, load: 0.72 }],
  BA: [{ type: 'A320', perDay: 4, load: 0.74 }], NOVAIR: [{ type: 'A320', perDay: 2, load: 0.92, months: [6, 7, 8, 12] }], PREMIAIR: []
};
// after 11 September 2001 the airlines fly less
const ROUTES_2002 = {
  SK: [{ type: 'B736', perDay: 15, load: 0.68 }, { type: 'MD87', perDay: 10, load: 0.68 }, { type: 'A321', perDay: 4, load: 0.7 },
    { type: 'A343', perDay: 2, load: 0.74 }, { type: 'F50', perDay: 5, load: 0.66 }],
  BRAATHENS: [{ type: 'B737', perDay: 5, load: 0.7 }], LH: [{ type: 'A320', perDay: 4, load: 0.7 }], AY: [{ type: 'A320', perDay: 4, load: 0.7 }],
  BA: [{ type: 'A320', perDay: 3, load: 0.72 }], NOVAIR: [{ type: 'A320', perDay: 2, load: 0.92, months: [6, 7, 8, 12] }], PREMIAIR: []
};
const ROUTES_2004 = {
  SK: [{ type: 'B736', perDay: 16, load: 0.72 }, { type: 'MD87', perDay: 10, load: 0.72 }, { type: 'A321', perDay: 5, load: 0.74 },
    { type: 'A343', perDay: 2, load: 0.78 }, { type: 'CRJ9', perDay: 4, load: 0.7 }],
  BRAATHENS: [{ type: 'B737', perDay: 4, load: 0.72 }], LH: [{ type: 'A320', perDay: 5, load: 0.72 }], AY: [{ type: 'A320', perDay: 5, load: 0.72 }],
  BA: [{ type: 'A320', perDay: 4, load: 0.74 }], NOVAIR: [{ type: 'A321', perDay: 2, load: 0.92, months: [6, 7, 8, 12] }], PREMIAIR: []
};
const ROUTES_2008 = Object.assign({}, ROUTES_2004, {
  SK: [{ type: 'B736', perDay: 16, load: 0.74 }, { type: 'MD87', perDay: 8, load: 0.72 }, { type: 'A321', perDay: 6, load: 0.76 },
    { type: 'A343', perDay: 2, load: 0.8 }, { type: 'CRJ9', perDay: 6, load: 0.72 }],
  QR: [{ type: 'A319', perDay: 1, load: 0.78 }]
});

addMissions(5, [
  {
    name: 'Schengen', kind: 'build', date: '2001-01-15', requires: BUILT_2000,
    unlocks: ['booth'],
    setup: { open: true, openSkies: true, units: true, lanes: 12, budget: 60e6, minMoney: 400e6, loanLimit: 400e6, items: ITEMS_2000, desks: 40,
      airlines: ROUTES_2001, domains: TEAMS_2000, it: 6, terms: TERMS_2001, projects: ['schengen'], opens: ['border'], unlock: { border: 1 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth'],
    brief: [
      'On the 25th of March Sweden joins the Schengen area. A flight to Oslo, Paris or Rome becomes like a flight to Luleå: no passports.',
      'But London, New York and Bangkok stay outside. Their passengers must meet the police at a passport booth, and they must never mix with the others.',
      'Build a new floor in Terminal 5 with a passport hall, and decide who opens the booths. Then run the first evening.'
    ],
    aim: 'Split the terminal for Schengen, build the passport booths, and run the first Schengen evening.',
    news: [
      { icon: '🛃', text: 'The border: passengers to countries outside Schengen queue at passport booths after security.' },
      { icon: '🏢', text: 'Sky City between the terminals: shops and a hotel that pay rent every month.' }
    ],
    facts: [
      { text: 'Sweden and the other Nordic countries began to apply the Schengen rules in full on 25 March 2001.', src: 'Council Decision 2000/777/EC' },
      { text: 'In 2001 Terminal 2 became a terminal for international flights only, and Terminal 5 got a fourth level to keep Schengen and non-Schengen passengers apart.', src: SRC_SV5 },
      { text: 'Sky City, the hall between Terminals 4 and 5 with Arlanda\'s railway station below it, opened in 1993.', src: 'sv.wikipedia Stockholm-Arlanda flygplats' }
    ],
    stages: [
      { name: 'The new floor', mode: 'plan', days: 70, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'schengen' }],
        choices: [{ id: 'borderTeam', at: 5, default: 'self', icon: '🛃', title: 'Who opens the booths?',
          text: 'The police will check the passports. Someone must open the booths when a queue grows: the police\'s own shift planner, or the airport\'s duty staff — that is you. Or you could build two more booths.',
          options: [
            { id: 'police', hire: 'border', meters: { staff: 2 }, label: 'The police\'s shift planner' },
            { id: 'booths', booths: 2, label: 'Two more booths, opened by us' },
            { id: 'self', label: 'We open them ourselves' }
          ] }] },
      { name: 'The first Schengen evening', mode: 'ops', date: '2001-03-26', from: '16:00', to: '19:00', weather: { temp: 3, wind: [210, 9] }, desks: 16, booths: 1,
        flights: [F5('SK', 'B736', 10, '16:05', '18:35', 40, { base: 100, intl: false }), F5('SK', 'MD87', 8, '16:10', '18:30', 45, { base: 300 }),
          F5('SK', 'B767', 2, '16:20', '17:20', 100, { base: 900, ns: true }), F5('BA', 'A320', 3, '16:15', '18:15', 50, { base: 770 }),
          F5('LH', 'A320', 3, '16:30', '18:20', 45, { base: 3020 }), F5('AY', 'A320', 3, '16:25', '18:25', 45, { base: 800 }),
          F5('BRAATHENS', 'B737', 4, '16:10', '18:40', 40, { base: 500 })],
        goal: [{ k: 'borderWait', max: 8 }, { k: 'onTime', p: 0.8 }] }
    ],
    goal: [],
    stars: [{ k: 'borderWait', max: 3 }, { k: 'passengers', min: 85 }]
  },
  {
    name: 'The New Tower', kind: 'build', date: '2001-09-24', requires: BUILT_2001,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 12, items: ITEMS_2000, desks: 40, airlines: ROUTES_2002, domains: TEAMS_2000, it: 6,
      terms: TERMS_2001, projects: ['tower2'], booths: 6 },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'plough'],
    brief: [
      'Since the summer a slender concrete tower stands between the terminals: the new control tower. From its glass cab the controllers will see every runway, the old ones and the one being built.',
      'Inside it is still empty. The radar, the radios and the desks must go in, and the controllers must learn the new room, before they move in on the 23rd of December.',
      'And since the 11th of September fewer people fly. Every krona counts this autumn.'
    ],
    aim: 'Fit out the new tower and move the controllers in before Christmas, then run a winter morning from it.',
    news: [
      { icon: '🗼', text: 'The new tower: with its radar the aircraft may follow each other more closely.' }
    ],
    facts: [
      { text: 'The new control tower, drawn by Wingårdh Arkitektkontor, was built from July 1999 to May 2001 and taken into service on 23 December 2001. It is 83 metres tall, 90 with its mast.', src: SRC_SV5 },
      { text: 'After the attacks of 11 September 2001 fewer people flew: Arlanda had 18.1 million passengers in 2001 and 16.4 million in 2002.', src: 'en.wikipedia Stockholm Arlanda Airport (traffic by year, from Swedavia)' }
    ],
    stages: [
      { name: 'Fitting out the tower', mode: 'plan', days: 90, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'tower2' }],
        choices: [{ id: 'after911', at: 4, default: 'hold', icon: '📉', title: 'Fewer passengers',
          text: 'The airlines are flying emptier aircraft. SAS asks for lower fees for a year; the others would like the same.',
          options: [
            { id: 'low', fees: 'low', meters: { airlines: 4 }, label: 'Lower fees for everyone' },
            { id: 'hold', meters: { airlines: -2 }, label: 'Keep the fees' }
          ] }] },
      { name: 'A morning from the new tower', mode: 'ops', date: '2001-12-27', from: '07:00', to: '10:00',
        weather: { temp: -5, wind: [20, 8], snow: [['07:40', '08:30', 1.5]] }, desks: 24,
        flights: [F5('SK', 'B736', 12, '07:05', '09:20', 40, { base: 100, intl: false }), F5('SK', 'MD87', 9, '07:10', '09:30', 45, { base: 300 }),
          F5('SK', 'A321', 3, '07:20', '09:00', 50, { base: 450 }), F5('BRAATHENS', 'B737', 4, '07:15', '09:15', 40, { base: 500 }),
          F5('LH', 'A320', 3, '07:30', '09:20', 45, { base: 3020 }), F5('AY', 'A320', 3, '07:25', '09:25', 45, { base: 800 }),
          F5('BA', 'A320', 2, '07:40', '08:40', 50, { base: 770 }), F5('SK', 'F50', 4, '07:10', '09:10', 30, { base: 600, intl: false })],
        goal: [{ k: 'onTime', p: 0.75 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 2.5 }, { k: 'airlines', min: 75 }]
  },
  {
    name: 'Pier F', kind: 'build', date: '2002-01-07', requires: BUILT_2001.concat(['tower2']),
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 12, items: ITEMS_2000, desks: 40, airlines: ROUTES_2002, domains: TEAMS_2000, it: 6,
      terms: TERMS_2001, projects: ['pierF'], booths: 6 },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'plough'],
    brief: [
      'A new pier reaches out from Terminal 5: Pier F, with gates for the long-haul jets.',
      'Its gates must be fitted out and its apron marked in the middle of the winter. And should its gates have jet bridges? They cost more, but the passengers walk dry from the door to the aircraft, and the big airlines insist on them.',
      'Then a midday wave of long-haul flights.'
    ],
    aim: 'Open Pier F, decide on its jet bridges, and run a midday wave of long-haul flights.',
    news: [
      { icon: '🛫', text: 'Pier F: four stands for big jets. With jet bridges they count as next to the terminal.' }
    ],
    facts: [
      { text: 'Swedavia\'s history says a new pier at Terminal 5 entered service in January 2002; other sources date Pier F to the expansion of 2003.', src: SRC_SV5 }
    ],
    stages: [
      { name: 'The pier', mode: 'plan', days: 50, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'pierF' }] },
      { name: 'The long-haul wave', mode: 'ops', date: '2002-02-18', from: '10:00', to: '13:00', weather: { temp: -6, wind: [30, 9] }, desks: 24,
        flights: [F5('SK', 'A343', 2, '10:10', '10:40', 110, { base: 900, ns: true }), F5('SK', 'B767', 2, '10:20', '10:50', 100, { base: 920, ns: true }),
          F5('BA', 'A320', 3, '10:15', '12:15', 50, { base: 770 }), F5('LH', 'A320', 3, '10:30', '12:20', 45, { base: 3020 }),
          F5('AY', 'A320', 3, '10:25', '12:25', 45, { base: 800 }), F5('SK', 'MD87', 8, '10:05', '12:35', 45, { base: 300 }),
          F5('SK', 'B736', 9, '10:05', '12:35', 40, { base: 100, intl: false })],
        goal: [{ k: 'onTime', p: 0.8 }] }
    ],
    goal: [],
    stars: [{ k: 'airlines', min: 80 }, { k: 'passengers', min: 86 }]
  },
  {
    name: 'Runway Three', kind: 'build', date: '2002-09-02', requires: BUILT_2002,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 12, budget: 100e6, loanLimit: 1500e6, items: ITEMS_2000, desks: 40, airlines: ROUTES_2002,
      domains: TEAMS_2000, it: 6, terms: TERMS_2001, projects: ['runway3'], booths: 6 },
    grants: ['runway3'],
    hands: [],
    brief: [
      'East of the terminals, in the forest, a second long runway has been taking shape since 1998: runway 3, parallel to runway 1.',
      'With two parallel runways, one can take the landings while the other takes the departures. But the traffic is falling, and every month of building costs money.',
      'Finish it before the winter slows the work — and think of Upplands Väsby, under its southern end.'
    ],
    aim: 'Finish runway 3 before the winter, without spending more than you must.',
    news: [
      { icon: '🛬', text: 'Runway 3: a parallel runway. Arrivals and departures can then use a runway each.' },
      { icon: '🏛️', text: 'The owner\'s grant can pay half of it (choose it in the plan).' }
    ],
    facts: [
      { text: 'Building runway 3 began on 10 November 1998. It is 2 500 metres long, parallel to runway 1, about two kilometres east of it.', src: SRC_SV5 + '; SkyVector ESSA' }
    ],
    stages: [
      { name: 'Runway 3', mode: 'plan', days: 115, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'runway3' }],
        choices: [{ id: 'vasby', at: 20, default: 'none', icon: '🏡', title: 'Upplands Väsby',
          text: 'The aircraft on runway 3 will fly low over Upplands Väsby. The town asks for help with the noise.',
          options: [
            { id: 'insulate', money: -60e6, neighboursBase: 4, label: 'Pay for quieter windows' },
            { id: 'routes', meters: { neighbours: 2, airlines: -2 }, label: 'Turn the departures early (longer for the airlines)' },
            { id: 'none', meters: { neighbours: -5 }, label: 'Nothing for now' }
          ] }] }
    ],
    goal: [],
    stars: [{ k: 'spent', max: 1350e6 }, { k: 'neighbours', min: 75 }]
  },
  {
    name: 'Security After 2001', kind: 'operate', date: '2002-12-16', requires: BUILT_2002,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 12, items: ITEMS_2000, desks: 40, airlines: ROUTES_2002, domains: TEAMS_2000, it: 6,
      terms: TERMS_2001, booths: 6, secRule: 1, opens: ['security'], unlock: { security: 1 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'Since the autumn of 2001 every airport in Europe checks more carefully. New European rules come into force in January: every bag in the hold must be screened too.',
      'Each passenger now takes longer at security. From today the lanes are yours to open and close — every open lane costs its screeners\' wages.',
      'New screeners need a security clearance, and that takes six weeks. Plan ahead.'
    ],
    aim: 'Keep the security queue short under the new rules: open lanes by hand, then hire a team in time.',
    news: [
      { icon: '🛂', text: 'Security is a domain of its own: open a lane when the queue grows, close it when it is empty.' },
      { icon: '🪪', text: 'A security clearance: new security staff start only after six weeks.' }
    ],
    facts: [
      { text: 'Regulation (EC) No 2320/2002 set common rules for aviation security in Europe. It came into force in January 2003, and its rule that every hold bag is screened applied from 31 December 2002.', src: 'Regulation (EC) No 2320/2002, article 13 and annex 5.2 (legislation.gov.uk)' }
    ],
    stages: [
      { name: 'A December morning', mode: 'ops', date: '2002-12-16', from: '06:30', to: '09:30', weather: { temp: -3, wind: [200, 8] }, desks: 24, lanes: 4,
        flights: [F5('SK', 'B736', 11, '06:35', '09:00', 40, { base: 100, intl: false }), F5('SK', 'MD87', 8, '06:40', '09:00', 45, { base: 300 }),
          F5('SK', 'A321', 3, '06:50', '08:40', 50, { base: 450 }), F5('BRAATHENS', 'B737', 4, '06:45', '08:50', 40, { base: 500 }),
          F5('LH', 'A320', 2, '07:10', '08:30', 45, { base: 3020 }), F5('AY', 'A320', 2, '07:15', '08:45', 45, { base: 800 }),
          F5('BA', 'A320', 2, '07:30', '08:30', 50, { base: 770 })],
        goal: [{ k: 'onTime', p: 0.7 }] },
      { name: 'The holidays', mode: 'plan', days: 45, goal: [],
        choices: [
          { id: 'secTeam', at: 2, default: 'no', icon: '👮', title: 'A security shift planner',
            text: 'A planner with a team would open and close the lanes for you. The new people need their clearance first: six weeks.',
            options: [
              { id: 'yes', hire: 'security', label: 'Hire the team now' },
              { id: 'no', label: 'We manage by hand' }
            ] },
          { id: 'secHead', at: 9, default: 'none', icon: '👔', kind: 'manager', title: 'A head of security',
            text: 'Two candidates for the new job.',
            options: [
              { id: 'leila', manager: 'leilaNordin', label: 'Leila Nordin' },
              { id: 'goran', manager: 'goranFalk', label: 'Göran Falk' },
              { id: 'none', label: 'Nobody' }
            ] }] },
      { name: 'Under the new rules', mode: 'ops', date: '2003-01-27', from: '06:30', to: '09:30', weather: { temp: -7, wind: [20, 7] }, desks: 24, lanes: 4,
        flights: [F5('SK', 'B736', 11, '06:35', '09:00', 40, { base: 200, intl: false }), F5('SK', 'MD87', 8, '06:40', '09:00', 45, { base: 400 }),
          F5('SK', 'A321', 3, '06:50', '08:40', 50, { base: 460 }), F5('BRAATHENS', 'B737', 4, '06:45', '08:50', 40, { base: 600 }),
          F5('LH', 'A320', 2, '07:10', '08:30', 45, { base: 3030 }), F5('AY', 'A320', 2, '07:15', '08:45', 45, { base: 810 }),
          F5('BA', 'A320', 2, '07:30', '08:30', 50, { base: 780 })],
        goal: [{ k: 'securityWait', max: 6 }] }
    ],
    goal: [],
    stars: [{ k: 'securityWait', max: 4 }, { k: 'passengers', min: 85 }]
  },
  {
    name: 'Taxiway Bridges', kind: 'build', date: '2003-02-03', requires: BUILT_2002.concat(['runway3']),
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 12, items: ITEMS_2000, desks: 40, airlines: ROUTES_2002, domains: TEAMS_2003, it: 6,
      terms: TERMS_2001, projects: ['bridges'], booths: 6, secRule: 1 },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane', 'plough'],
    brief: [
      'Runway 3 is ready, but the aircraft cannot reach it yet: between it and the terminals run a road and the railway.',
      'So the taxiways go over them on bridges strong enough for a fully loaded jumbo. Two bridges and the taxiways beyond them must be ready for the opening on the 17th of April — in the cold of February.',
      'Then the first morning with two parallel runways.'
    ],
    aim: 'Build the taxiway bridges in time, then run the first morning on two parallel runways.',
    news: [
      { icon: '🌉', text: 'Taxiway bridges: the way to runway 3, a few minutes longer to taxi.' },
      { icon: '🛫', text: 'Two parallel runways: landings on runway 1, departures on runway 3.' }
    ],
    facts: [
      { text: 'Runway 3 is reached from the terminals over taxiway bridges built for the heaviest aircraft.', src: 'en.wikipedia Stockholm Arlanda Airport; en.wikipedia Taxiway bridge' },
      { text: 'Runway 3 was used for the first time on 17 April 2003 — later than planned, because of the downturn of 2002.', src: SRC_SV5 }
    ],
    stages: [
      { name: 'The bridges', mode: 'plan', days: 72, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'bridges' }] },
      { name: 'Two runways', mode: 'ops', date: '2003-04-17', from: '07:00', to: '10:00', weather: { temp: 6, wind: [190, 9] }, desks: 26,
        flights: [F5('SK', 'B736', 13, '07:05', '09:20', 40, { base: 100, intl: false }), F5('SK', 'MD87', 10, '07:10', '09:30', 45, { base: 300 }),
          F5('SK', 'A321', 4, '07:15', '09:00', 50, { base: 450 }), F5('BRAATHENS', 'B737', 5, '07:15', '09:15', 40, { base: 500 }),
          F5('LH', 'A320', 3, '07:30', '09:20', 45, { base: 3020 }), F5('AY', 'A320', 3, '07:25', '09:25', 45, { base: 800 }),
          F5('BA', 'A320', 3, '07:40', '09:00', 50, { base: 770 }), F5('SK', 'F50', 5, '07:10', '09:10', 30, { base: 600, intl: false })],
        goal: [{ k: 'runways', min: 3 }, { k: 'onTime', p: 0.8 }] }
    ],
    goal: [],
    stars: [{ k: 'onTime', p: 0.9 }, { k: 'airportDelay', max: 4 }]
  },
  {
    name: 'Norwegian Arrives', kind: 'choice', date: '2003-07-07', requires: BUILT_2003,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 12, items: ITEMS_2000, desks: 40, airlines: ROUTES_2002, domains: TEAMS_2003, it: 6,
      terms: TERMS_2001, booths: 6, secRule: 1, events: true },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'A young Norwegian airline with red-nosed Boeings and famous faces on their tails wants to fly from Arlanda to Oslo — if the fees are low.',
      'Low-fare passengers come in crowds and spend in the shops. SAS will not like a cheap rival at its home.',
      'And from now on the unexpected happens: a thunderstorm, a moose on the runway, a lost child at security.'
    ],
    aim: 'Decide how to welcome Norwegian, then run its first morning.',
    news: [
      { icon: '✈️', text: 'Norwegian: a low-fare airline that haggles over every krona.' },
      { icon: '⚡', text: 'Random events: a storm, an animal on the runway, a lost child — once a stage at most.' }
    ],
    facts: [
      { text: 'Norwegian\'s first flight from Arlanda, to Oslo Gardermoen, left on 1 September 2003.', src: 'Swedavia press release, 2023 (Mynewsdesk)' }
    ],
    stages: [
      { name: 'The offer', mode: 'plan', days: 30, goal: [],
        choices: [{ id: 'norwegian', at: 3, default: 'no', icon: '✈️', title: 'Norwegian asks for a discount',
          text: 'Norwegian would fly four times a day from Oslo and back. It asks for 30 % off its fees for two years. SAS says a home carrier deserves better.',
          options: [
            { id: 'yes', court: { code: 'DY', share: 0.3 }, meters: { airlines: -2 }, label: '30 % off: welcome' },
            { id: 'half', court: { code: 'DY', share: 0.5 }, meters: { airlines: -3 }, label: 'Half off, to be sure' },
            { id: 'no', meters: { airlines: 2 }, label: 'Normal fees only' }
          ] }] },
      { name: 'The first Norwegian morning', mode: 'ops', date: '2003-09-01', from: '06:30', to: '09:30', weather: { temp: 12, wind: [220, 8] }, desks: 26, lanes: 8,
        flights: [F5('SK', 'B736', 12, '06:35', '09:00', 40, { base: 100, intl: false }), F5('SK', 'MD87', 9, '06:40', '09:00', 45, { base: 300 }),
          F5('DY', 'B738', 4, '06:45', '08:45', 30, { base: 400, load: 0.9, when: ['norwegian', 'yes', 'half'] }),
          F5('SK', 'A321', 3, '06:50', '08:40', 50, { base: 450 }), F5('BRAATHENS', 'B737', 4, '06:45', '08:50', 40, { base: 500 }),
          F5('LH', 'A320', 3, '07:10', '08:50', 45, { base: 3020 }), F5('AY', 'A320', 3, '07:15', '08:45', 45, { base: 800 }),
          F5('BA', 'A320', 2, '07:30', '08:30', 50, { base: 770 })],
        goal: [{ k: 'onTime', p: 0.8 }] }
    ],
    goal: [{ k: 'perDay', code: 'DY', min: 4 }],
    stars: [{ k: 'brandsIn', min: 12.5e6 }, { k: 'airlines', min: 92 }]
  },
  {
    name: 'Remote De-icing', kind: 'build', date: '2004-11-29', requires: BUILT_2003,
    unlocks: ['deicer'],
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 12, items: Object.assign({}, ITEMS_2000, { deicer: 3 }), desks: 40, airlines: ROUTES_2004,
      domains: TEAMS_2003, it: 6, terms: TERMS_2001, booths: 6, secRule: 1, events: true, projects: ['deicePads'], opens: ['deice'], unlock: { deice: 2 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane', 'deice'],
    brief: [
      'Below zero, every aircraft must be washed free of frost and snow with warm glycol before it may take off. Today three trucks drive from stand to stand, and the departures wait for them.',
      'Remote de-icing pads by the runways would do it on the way out, in a line, and catch the glycol before it reaches the ground.',
      'First a frosty morning with the trucks. Then hire a de-icing crew and build the pads — the crew needs its clearance — and run a cold February morning.'
    ],
    aim: 'De-ice by hand, then build the remote pads with a crew, and get a cold morning away on time.',
    news: [
      { icon: '🧊', text: 'De-icing: below 0 °C every departure needs a de-icing truck before it may leave.' },
      { icon: '🛣️', text: 'Remote pads: de-icing on the way to the runway, no truck at the stand.' }
    ],
    facts: [
      { text: 'Arlanda de-ices aircraft on areas near runway 3 and in the southern apron by runway 1, on surfaces that drain into the glycol collection.', src: 'en.wikipedia Stockholm Arlanda Airport; futureairport.com, The war on cold' }
    ],
    stages: [
      { name: 'Frost and three trucks', mode: 'ops', date: '2004-11-29', from: '06:30', to: '09:30', weather: { temp: -4, wind: [30, 6] }, desks: 26, lanes: 8, calm: true,
        flights: [F5('SK', 'B736', 9, '06:35', '09:00', 40, { base: 100, intl: false }), F5('SK', 'MD87', 7, '06:40', '09:00', 45, { base: 300 }),
          F5('SK', 'A321', 3, '06:50', '08:40', 50, { base: 450 }), F5('BRAATHENS', 'B737', 3, '06:45', '08:50', 40, { base: 500 }),
          F5('LH', 'A320', 2, '07:10', '08:50', 45, { base: 3020 }), F5('AY', 'A320', 2, '07:15', '08:45', 45, { base: 800 }),
          F5('SK', 'B736', 6, '06:45', '08:20', 0, { base: 700, parked: true, intl: false })],
        goal: [{ k: 'onTime', p: 0.55 }] },
      { name: 'Crew and pads', mode: 'plan', days: 72, crews: 2, endEarly: true, goal: [{ k: 'level', dom: 'deice', min: 2 }] },
      { name: 'A cold February morning', mode: 'ops', date: '2005-02-14', from: '06:30', to: '09:30', weather: { temp: -9, wind: [20, 7], snow: [['07:00', '08:00', 1.5]] },
        desks: 26, lanes: 8,
        flights: [F5('SK', 'B736', 10, '06:35', '09:00', 40, { base: 200, intl: false }), F5('SK', 'MD87', 8, '06:40', '09:00', 45, { base: 400 }),
          F5('SK', 'A321', 3, '06:50', '08:40', 50, { base: 460 }), F5('BRAATHENS', 'B737', 3, '06:45', '08:50', 40, { base: 600 }),
          F5('LH', 'A320', 2, '07:10', '08:50', 45, { base: 3030 }), F5('AY', 'A320', 2, '07:15', '08:45', 45, { base: 810 }),
          F5('SK', 'B736', 6, '06:45', '08:20', 0, { base: 750, parked: true, intl: false })],
        goal: [{ k: 'onTime', p: 0.85 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 4 }, { k: 'passengers', min: 85 }]
  },
  {
    name: 'Rent Is Steady', kind: 'business', date: '2006-02-06', requires: BUILT_2005,
    unlocks: ['offices', 'hotelExt'],
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 12, items: Object.assign({}, ITEMS_2000, { deicer: 3 }), desks: 40, airlines: ROUTES_2004,
      domains: TEAMS_2005, it: 7, terms: TERMS_2001, booths: 6, secRule: 1, events: true, projects: ['cargoCity'] },
    hands: [],
    brief: [
      'An airport earns from more than aircraft. Sky City\'s hotel and shops pay rent every month, busy day or quiet.',
      'A new freight area, Cargo City, is planned south of the terminals, with halls for the forwarders. Offices and a bigger hotel could rise on the free plots too.',
      'Traffic goes up and down; rent stays. Build up the airport\'s real estate and see what each month earns.'
    ],
    aim: 'Build Cargo City and grow the rents from the airport\'s real estate.',
    news: [
      { icon: '🏬', text: 'Real estate: halls, offices and hotels pay rent every month (Finance: "Real estate").' }
    ],
    facts: [
      { text: 'Cargo City, Arlanda\'s freight area, opened in 2006.', src: 'en.wikipedia Stockholm Arlanda Airport' }
    ],
    stages: [
      { name: 'Cargo City', mode: 'plan', days: 90, crews: 2, goal: [{ k: 'project', id: 'cargoCity' }],
        choices: [{ id: 'hotelExt', at: 10, default: 'no', icon: '🏨', title: 'A bigger hotel',
          text: 'The hotel in Sky City is full most nights. A hotel company would rent a new wing if the airport builds it.',
          options: [
            { id: 'yes', build: 'hotelExt', label: 'Build the wing' },
            { id: 'no', label: 'Not now' }
          ] }] },
      { name: 'The rent comes in', mode: 'plan', days: 90, goal: [{ k: 'estate', min: 5e6 }],
        choices: [{ id: 'skyShop', at: 5, default: 'none', icon: '🏪', title: 'A shop in Sky City',
          text: 'Two chains would like the big unit in Sky City, where everybody passes on the way to the trains.',
          options: [
            { id: 'olearys', brand: { term: 'sky', id: 'olearys' }, label: 'O\'Learys sports bar' },
            { id: 'clas', brand: { term: 'sky', id: 'clas' }, label: 'Clas Ohlson' },
            { id: 'none', label: 'Neither' }
          ] }] }
    ],
    goal: [],
    stars: [{ k: 'estate', min: 6e6 }, { k: 'lastMonth', min: 44e6 }]
  },
  {
    name: 'Liquids in Bags', kind: 'operate', date: '2006-11-06', requires: BUILT_2006,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 12, items: Object.assign({}, ITEMS_2000, { deicer: 3 }), desks: 40, airlines: ROUTES_2004,
      domains: TEAMS_2005, it: 7, terms: TERMS_2001, booths: 6, secRule: 2, events: true, unlock: { security: 2 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'From today a bottle of water is a problem. Liquids in hand luggage may only be in small bottles of 100 millilitres, in one clear plastic bag.',
      'Every passenger has to unpack, and every lane gets slower. The queue on the first morning will be long.',
      'Then plan for the Christmas rush: more lanes, or queue sensors that open a lane before the queue builds.'
    ],
    aim: 'Get through the first morning of the liquids rule, then make security fast enough for Christmas.',
    news: [
      { icon: '🧴', text: 'Liquids in bags: every security lane is slower.' },
      { icon: '📡', text: 'Queue sensors: a system that opens a lane before the queue builds.' }
    ],
    facts: [
      { text: 'From 6 November 2006 liquids in hand luggage had to be in containers of at most 100 ml, in one clear resealable bag of up to a litre (Commission Regulation (EC) No 1546/2006).', src: 'European Commission MEMO/06/363; regjeringen.no EØS-notat' }
    ],
    stages: [
      { name: 'The first morning', mode: 'ops', date: '2006-11-06', from: '06:30', to: '09:30', weather: { temp: 2, wind: [200, 9] }, desks: 26, lanes: 8, calm: true,
        flights: [F5('SK', 'B736', 11, '06:35', '09:00', 40, { base: 100, intl: false }), F5('SK', 'MD87', 8, '06:40', '09:00', 45, { base: 300 }),
          F5('SK', 'A321', 4, '06:50', '08:40', 50, { base: 450 }), F5('DY', 'B738', 4, '06:45', '08:45', 30, { base: 520, load: 0.9 }),
          F5('LH', 'A320', 3, '07:10', '08:50', 45, { base: 3020 }), F5('AY', 'A320', 2, '07:15', '08:45', 45, { base: 800 }),
          F5('BA', 'A320', 2, '07:30', '08:30', 50, { base: 770 })],
        goal: [{ k: 'onTime', p: 0.6 }] },
      { name: 'Before Christmas', mode: 'plan', days: 40, goal: [] },
      { name: 'The Christmas rush', mode: 'ops', date: '2006-12-21', from: '06:30', to: '09:30', weather: { temp: -3, wind: [20, 7] }, desks: 26, lanes: 8,
        flights: [F5('SK', 'B736', 11, '06:35', '09:00', 40, { base: 200, intl: false, load: 0.85 }), F5('SK', 'MD87', 8, '06:40', '09:00', 45, { base: 400, load: 0.85 }),
          F5('SK', 'A321', 4, '06:50', '08:40', 50, { base: 460, load: 0.85 }), F5('DY', 'B738', 4, '06:45', '08:45', 30, { base: 540, load: 0.95 }),
          F5('NOVAIR', 'A321', 2, '06:40', '07:20', 60, { base: 700, load: 0.97, ns: true }),
          F5('LH', 'A320', 3, '07:10', '08:50', 45, { base: 3030 }), F5('AY', 'A320', 2, '07:15', '08:45', 45, { base: 810 }),
          F5('BA', 'A320', 2, '07:30', '08:30', 50, { base: 780 })],
        goal: [{ k: 'securityWait', max: 5 }] }
    ],
    goal: [],
    stars: [{ k: 'securityWait', max: 5 }, { k: 'brandsIn', min: 150000 }]
  },
  {
    name: 'Exam: The Snowy Peak', kind: 'exam', date: '2009-02-09', requires: BUILT_2006,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 12, items: Object.assign({}, ITEMS_2000, { deicer: 3 }), desks: 40, airlines: ROUTES_2008,
      domains: TEAMS_2005, it: 7, terms: TERMS_2001, booths: 6, secRule: 2, events: true },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane', 'deice', 'plough'],
    brief: [
      'A snowy Monday in February. The world is in a financial crisis and fewer people fly — but this morning every seat is taken.',
      'Two runways to keep clear, every departure to de-ice, the passport booths, the liquids at security — and at midday the screeners walk out.',
      'Arlanda is proud that snow never closes it. Show them why.'
    ],
    aim: 'Run a whole snowy day with everything of the chapter.',
    news: [
      { icon: '🎓', text: 'The exam: everything of the chapter.' }
    ],
    facts: [
      { text: 'Arlanda says it has not closed for snow since 1962; about 130 people fight the ice and snow.', src: 'PRI The World, 30 December 2010' },
      { text: 'In the financial crisis Arlanda\'s traffic fell from 18.1 million passengers in 2008 to 16.1 million in 2009.', src: 'en.wikipedia Stockholm Arlanda Airport (traffic by year, from Swedavia)' }
    ],
    stages: [
      { name: 'The snowy morning', mode: 'ops', date: '2009-02-09', from: '06:00', to: '08:15', weather: { temp: -6, wind: [30, 9], snow: [['06:10', '07:40', 2.5]] },
        desks: 26, lanes: 8, booths: 3, calm: true,
        flights: [F5('SK', 'B736', 10, '06:05', '08:20', 40, { base: 100, intl: false, load: 0.85 }), F5('SK', 'MD87', 6, '06:10', '08:20', 45, { base: 300, load: 0.85 }),
          F5('SK', 'A321', 4, '06:20', '08:10', 50, { base: 450, load: 0.85 }), F5('DY', 'B738', 4, '06:15', '08:15', 30, { base: 520, load: 0.92 }),
          F5('SK', 'CRJ9', 4, '06:10', '08:10', 35, { base: 600, intl: false }), F5('LH', 'A320', 2, '06:40', '08:00', 45, { base: 3020 }),
          F5('BA', 'A320', 2, '06:50', '07:50', 50, { base: 770 }), F5('SK', 'B736', 5, '06:30', '08:00', 0, { base: 700, parked: true, intl: false })],
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.7 }] },
      { name: 'Midday', mode: 'ops', from: '11:00', to: '13:15', weather: { temp: -4, wind: [20, 8] }, desks: 26, lanes: 3, booths: 1,
        events: [{ at: '11:00', do: 'strike', dept: 'security', text: 'The security staff have walked out for the afternoon: only a few screeners are at work.' },
          { at: '11:00', do: 'fail', dom: 'security', min: 150 }],
        flights: [F5('SK', 'A343', 1, '11:10', '11:10', 110, { base: 900, ns: true }), F5('QR', 'A319', 1, '11:30', '11:30', 90, { base: 167 }),
          F5('SK', 'B736', 8, '11:05', '13:20', 40, { base: 200, intl: false }), F5('SK', 'MD87', 6, '11:10', '13:20', 45, { base: 400 }),
          F5('DY', 'B738', 3, '11:15', '13:00', 30, { base: 540 }), F5('BA', 'A320', 2, '11:40', '12:40', 50, { base: 780 }),
          F5('AY', 'A320', 3, '11:20', '13:20', 45, { base: 810 }), F5('LH', 'A320', 2, '11:40', '13:00', 45, { base: 3030 })],
        goal: [{ k: 'borderWait', max: 6 }, { k: 'securityWait', max: 8 }] },
      { name: 'The evening wave', mode: 'ops', from: '16:00', to: '18:15', weather: { temp: -9, wind: [10, 6], snow: [['17:00', '17:50', 1.5]] }, desks: 26, lanes: 8, booths: 3,
        events: [{ at: '16:40', do: 'power', min: 30 }],
        flights: [F5('SK', 'B736', 10, '16:05', '18:20', 40, { base: 300, intl: false, load: 0.85 }), F5('SK', 'MD87', 6, '16:10', '18:20', 45, { base: 500, load: 0.85 }),
          F5('SK', 'A321', 4, '16:20', '18:10', 50, { base: 460, load: 0.85 }), F5('DY', 'B738', 4, '16:15', '18:15', 30, { base: 560, load: 0.92 }),
          F5('SK', 'CRJ9', 4, '16:10', '18:10', 35, { base: 650, intl: false }), F5('LH', 'A320', 2, '16:40', '18:00', 45, { base: 3040 }),
          F5('BA', 'A320', 2, '16:50', '17:50', 50, { base: 790 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 5 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 3 }, { k: 'passengers', min: 82 }],
    paper: { head: 'SNOW ALL DAY — AND ARLANDA FLEW ON',
      text: 'While other airports in Europe gave up, the ploughs, the de-icing pads and two runways kept every flight going. "The snow is our home ground," says the director.' }
  }
]);
