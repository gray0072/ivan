'use strict';

// Arlanda Rising — chapter 7, Storm Years (2020–2024): the pandemic empties the sky (terminals mothballed, rent relief for
// the brands, furlough or lay-offs), the freighters fly on, the traffic comes back faster than the people (the ones who
// left, the security clearance's weeks, the summer of queues of 2022), Terminals 4 and 5 become one, the airspace closes
// to Russian airlines, a cyber attack and a drill — and as the exam the day in July 2024 when a faulty update stopped
// computers all over the world. See data/missions/missions.js for the fields. The history the briefings tell is checked
// (`facts` with the source); the flights of a day, the deals, the attack of 2023 and the people are the game's own.

const SRC_SV7 = 'swedavia.com, Terminal 4 is open (June 2022); en.wikipedia Stockholm Arlanda Airport';
const BUILT_2022 = BUILT_2018.concat(['t4t5']);
const ITEMS_2019 = Object.assign({}, ITEMS_2010, { crashTender: 3, deicer: 4 });
const TEAMS_2019 = Object.assign({}, TEAMS_2010, { checkin: 3, stands: 3, border: 2, deice: 3 });
const TERMS_2019 = Object.assign({}, TERMS_2010);

const F7 = (al, type, n, from, to, turn, extra) => Object.assign({ al, type, n, from, to, turn, load: 0.8 }, extra || {});

// the airlines' plan before the pandemic; the crisis takes a share of it (`demand`), the freighters fly on
const ROUTES_2019 = Object.assign({}, ROUTES_2016, {
  SK: [{ type: 'A20N', perDay: 10, load: 0.78 }, { type: 'B736', perDay: 6, load: 0.76 }, { type: 'A321', perDay: 10, load: 0.8 },
    { type: 'B738', perDay: 6, load: 0.78 }, { type: 'CRJ9', perDay: 8, load: 0.76 }, { type: 'A333', perDay: 3, load: 0.85 }],
  EK: [{ type: 'B77W', perDay: 1, load: 0.86 }], AFL: [{ type: 'A320', perDay: 2, load: 0.75 }],
  DHL: [{ type: 'B76F', perDay: 1, load: 0.8 }], UPS: [{ type: 'B76F', perDay: 1, load: 0.8 }]
});
const ROUTES_2022 = Object.assign({}, ROUTES_2019, {
  SK: [{ type: 'A20N', perDay: 14, load: 0.8 }, { type: 'A321', perDay: 8, load: 0.8 }, { type: 'B738', perDay: 6, load: 0.78 },
    { type: 'CRJ9', perDay: 8, load: 0.76 }, { type: 'A359', perDay: 1, load: 0.85 }, { type: 'A333', perDay: 2, load: 0.85 }],
  DY: [{ type: 'B738', perDay: 12, load: 0.84 }, { type: 'B38M', perDay: 4, load: 0.84 }], AFL: []
});
const SETUP_7 = { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 20, items: ITEMS_2019, desks: 40, domains: TEAMS_2019, it: 11,
  terms: TERMS_2019, booths: 8, secRule: 2, owner: 'Swedavia', green: true, permit: { perDay: 135 }, events: true };
const S7 = (extra) => Object.assign({}, SETUP_7, extra);
const HANDS_7 = ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'];

addMissions(7, [
  {
    name: 'Empty Skies', kind: 'crisis', date: '2020-03-13', requires: BUILT_2018,
    setup: S7({ airlines: ROUTES_2019, demand: 1 }),
    hands: HANDS_7,
    brief: [
      'A new illness is spreading round the world. Countries close their borders, and the airlines cancel flight after flight.',
      'Tonight the last full flights take people home. After that the sky goes quiet — for how long, nobody knows.',
      'An empty terminal still costs money: heat, light, cleaning, people. What do you keep open, and how do you treat the shops that pay rent?'
    ],
    aim: 'Get the last busy evening away, then keep the money alive while the sky is empty.',
    news: [
      { icon: '🦠', text: 'A pandemic: the passengers are a small share of the normal traffic (the freighters fly on).' },
      { icon: '🔒', text: 'Mothballing: a closed terminal saves most of its people, its upkeep and its energy.' },
      { icon: '🏪', text: 'Rent relief: the shops pay less rent for a year, and stay.' }
    ],
    facts: [
      { text: 'At the start of the pandemic all of Arlanda\'s operations were moved to Terminal 5, to meet the sharp fall in travel; at times the airport had virtually no commercial traffic.', src: 'swedavia.com, Terminal 4 is open (June 2022)' },
      { text: 'Travel at Swedavia\'s airports fell by 74 per cent in 2020, to 10.3 million passengers from 40.2 million in 2019.', src: 'Swedavia year-end report 2020' }
    ],
    stages: [
      { name: 'The last busy evening', mode: 'ops', date: '2020-03-13', from: '16:00', to: '19:00', weather: { temp: 4, wind: [220, 9] }, desks: 20, lanes: 8, booths: 3,
        flights: [F7('SK', 'A20N', 7, '16:05', '18:20', 45, { base: 100, intl: false, load: 0.6 }), F7('SK', 'A321', 6, '16:10', '18:30', 52, { base: 300, load: 0.7 }),
          F7('DY', 'B738', 8, '16:05', '18:25', 46, { base: 400, load: 0.75 }), F7('LH', 'A320', 3, '16:30', '18:20', 50, { base: 3020, load: 0.6 }),
          F7('AY', 'A321', 3, '16:25', '18:25', 52, { base: 800, load: 0.6 }), F7('BA', 'A320', 2, '16:40', '17:40', 50, { base: 770, load: 0.85 }),
          F7('SK', 'A333', 1, '16:20', '16:20', 120, { base: 900, ns: true, load: 0.95 })],
        goal: [{ k: 'onTime', p: 0.8 }] },
      { name: 'The sky empties', mode: 'plan', days: 45, demand: 0.08, goal: [],
        choices: [
          { id: 'terminals', at: 2, default: 'keep', icon: '🔒', title: 'Which terminals stay open?',
            text: 'Hardly anybody flies. Terminal 5 alone could take every flight there is. Closing the others saves heat, light, cleaning and people.',
            options: [
              { id: 'both', mothball: ['t2', 't3', 'dom'], label: 'Close Terminals 2, 3 and 4' },
              { id: 't2', mothball: ['t2'], label: 'Close Terminal 2 only' },
              { id: 'keep', label: 'Keep them all open' }
            ] },
          { id: 'shops', at: 6, default: 'wait', icon: '🏪', title: 'The shops ask for rent relief',
            text: 'The cafés and shops have almost no customers, but the rent goes on. Without help half of them will close for good.',
            options: [
              { id: 'relief', relief: true, flag: 'shopsAnswered', label: 'Let them off most of the rent for a year' },
              { id: 'no', relief: false, flag: 'shopsAnswered', label: 'A contract is a contract' },
              { id: 'wait', label: 'Answer them later' }
            ] }] }
    ],
    goal: [{ k: 'flag', id: 'shopsAnswered' }],
    stars: [{ k: 'mothballed', min: 2 }, { k: 'brands', min: 10 }]
  },
  {
    name: 'Furlough or Lay Off', kind: 'choice', date: '2020-04-14', requires: BUILT_2018,
    setup: S7({ airlines: ROUTES_2019, demand: 0.06 }),
    hands: HANDS_7,
    brief: [
      'The sky is still empty, and nobody knows for how long. The wages are now the biggest cost by far.',
      'The state offers to pay most of the wages of people sent home on furlough — they keep their jobs and come back when the flights do. Or the airport could lay people off: cheaper in the end, but they will be gone.',
      'Whatever you choose, the people will remember it.'
    ],
    aim: 'Decide what happens to the staff, and lose as little as you can in two empty months.',
    news: [
      { icon: '🏠', text: 'Furlough: the people stay at home, the state pays most of their wages; they come back at once.' },
      { icon: '📉', text: 'Lay-offs: three months of wages now, then the jobs are gone — and must be filled again later, with new people and their clearance.' }
    ],
    facts: [
      { text: 'Travel at Swedavia\'s airports fell by 74 per cent in 2020; Swedavia called it a historic loss.', src: 'Swedavia year-end report 2020' }
    ],
    stages: [
      { name: 'Two empty months', mode: 'plan', days: 60, goal: [],
        choices: [
          { id: 'staff', at: 2, default: 'wait', icon: '👷', title: 'Furlough or lay off?',
            text: 'Seven in ten of the staff have nothing to do. Send them home on furlough until the autumn, lay off four in ten, or keep everybody at work?',
            options: [
              { id: 'furlough', staff: { how: 'furlough', share: 0.7, months: 8 }, flag: 'staffAnswered', label: 'Furlough seven in ten' },
              { id: 'layoff', staff: { how: 'layoff', share: 0.4 }, flag: 'staffAnswered', label: 'Lay off four in ten' },
              { id: 'keep', flag: 'staffAnswered', meters: { staff: 6 }, label: 'Keep everybody at work' },
              { id: 'wait', label: 'Wait another month' }
            ] }] }
    ],
    goal: [{ k: 'flag', id: 'staffAnswered' }],
    stars: [{ k: 'loss', max: 20e6 }, { k: 'staff', min: 60 }]
  },
  {
    name: 'Cargo Saves the Day', kind: 'business', date: '2020-05-04', requires: BUILT_2018,
    setup: S7({ airlines: ROUTES_2019, demand: 0.07 }),
    hands: HANDS_7,
    brief: [
      'The passenger jets stand still — and with them the freight that used to fly in their bellies. Hospitals all over the world are waiting for masks and gloves.',
      'The freighters still fly, and more of them than ever. A cargo apron by Cargo City would bring more of them here.',
      'Then a night of freighters, among them an SAS airliner flying from China with no passengers, only boxes.'
    ],
    aim: 'Win more freight flights, then handle a busy night of freighters.',
    news: [
      { icon: '📦', text: 'Freighters: no passengers, but they pay for every tonne loaded and unloaded.' },
      { icon: '🅿️', text: 'Cargo stands: big remote stands by Cargo City, kept for the freighters.' }
    ],
    facts: [
      { text: 'In the spring of 2020 almost all the freight space in passenger aircraft was lost; the airlines that fly only freight went on as before, and demand was high.', src: 'Swedavia (2020), Seven quick questions about air cargo' },
      { text: 'From 8 May 2020 SAS flew freight from China with no passengers, and Qatar Airways Cargo came to Arlanda twice a week.', src: 'newstodate.aero, May 2020' }
    ],
    stages: [
      { name: 'Room for freight', mode: 'plan', days: 30, goal: [],
        choices: [{ id: 'cargo', at: 2, default: 'none', icon: '📦', title: 'A cargo apron?',
          text: 'Two freight airlines would each fly one more freighter a day, at night, if they had stands of their own by Cargo City.',
          options: [
            { id: 'apron', build: ['cargoStand', 'cargoStand'], airline: { code: 'DHL', routes: [{ type: 'B76F', perDay: 1, load: 0.85 }] }, airline2: { code: 'UPS', routes: [{ type: 'B76F', perDay: 1, load: 0.85 }] }, label: 'Two cargo stands' },
            { id: 'none', label: 'The stands we have will do' }
          ] }] },
      { name: 'A night of freighters', mode: 'ops', date: '2020-06-08', from: '20:00', to: '23:00', weather: { temp: 14, wind: [200, 7] }, desks: 6, lanes: 2, booths: 1, calm: true,
        flights: [F7('QR', 'B77F', 1, '20:10', '20:10', 120, { base: 8170 }), F7('SK', 'A359', 1, '20:30', '20:30', 110, { base: 9990, cargo: 30 }),
          F7('DHL', 'B76F', 2, '20:20', '21:40', 90, { base: 1 }), F7('UPS', 'B76F', 2, '20:40', '22:00', 90, { base: 21 }),
          F7('DHL', 'B76F', 1, '21:00', '21:00', 90, { base: 31, when: ['cargo', 'apron'] }), F7('UPS', 'B76F', 1, '21:20', '21:20', 90, { base: 41, when: ['cargo', 'apron'] }),
          F7('SK', 'A20N', 3, '20:05', '21:30', 45, { base: 100, intl: false, load: 0.2 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.8 }] }
    ],
    goal: [{ k: 'cargo', min: 5.5e6 }],
    stars: [{ k: 'cargo', min: 7e6 }, { k: 'airportDelay', max: 3 }]
  },
  {
    name: 'Coming Back', kind: 'operate', date: '2021-10-04', requires: BUILT_2018,
    setup: S7({ airlines: ROUTES_2019, demand: 0.45, leavers: LEAVERS_2022 }),
    hands: HANDS_7,
    brief: [
      'Vaccines! People want to travel again, and every week more flights come back. But many of the staff who were sent home have found other jobs in the long pause.',
      'Terminal 2 could open again for the winter — if it was closed. And the empty jobs: filling them takes weeks, longer where a security clearance is needed.',
      'Then the first busy morning in a year and a half.'
    ],
    aim: 'Get the airport ready for the travellers coming back, then run the first busy morning.',
    news: [
      { icon: '🚶', text: 'People who left: in the long pause many found other work. A team with empty jobs sends its work to your tray.' },
      { icon: '🔓', text: 'Reopening a terminal: cleaning, testing and staff, three weeks before it opens.' }
    ],
    facts: [
      { text: 'Terminal 2, closed since the start of the pandemic, opened again on 26 October 2021 as travel came back.', src: 'Swedavia, Swedavia to open another terminal at Stockholm Arlanda (October 2021)' }
    ],
    stages: [
      { name: 'Getting ready', mode: 'plan', days: 30, demand: 0.55, goal: [],
        choices: [
          { id: 'reopen', at: 1, default: 'wait', icon: '🔓', title: 'Open Terminal 2 again?',
            text: 'If Terminal 2 is closed, opening it takes three weeks of cleaning and testing. Terminal 5 alone is getting crowded.',
            options: [
              { id: 'now', reopen: 't2', label: 'Open it for the winter' },
              { id: 'wait', label: 'Not yet' }
            ] },
          { id: 'hire', at: 3, default: 'later', icon: '📝', title: 'Fill the empty jobs?',
            text: 'Recruiting costs money, and the new people need weeks before they can start — security staff need a clearance first.',
            options: [
              { id: 'now', rehire: true, label: 'Recruit for every team now' },
              { id: 'later', label: 'Wait until the flights are really back' }
            ] }] },
      { name: 'The first busy morning', mode: 'ops', date: '2021-11-22', from: '06:00', to: '09:00', weather: { temp: 3, wind: [210, 8] }, desks: 16, lanes: 6, booths: 2,
        flights: [F7('SK', 'A20N', 8, '06:05', '08:20', 45, { base: 100, intl: false, load: 0.8 }), F7('SK', 'A321', 5, '06:10', '08:30', 52, { base: 300, load: 0.8 }),
          F7('DY', 'B738', 7, '06:05', '08:25', 46, { base: 400, load: 0.82 }), F7('LH', 'A320', 2, '06:30', '08:20', 50, { base: 3020 }),
          F7('AY', 'A321', 2, '06:25', '08:25', 52, { base: 800 }), F7('BA', 'A320', 2, '06:40', '07:40', 50, { base: 770 }),
          F7('SK', 'CRJ9', 4, '06:10', '08:10', 35, { base: 600, intl: false })],
        goal: [{ k: 'onTime', p: 0.8 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 3 }, { k: 'laidOff', max: 0.05 }]
  },
  {
    name: 'Closed Skies', kind: 'crisis', date: '2022-02-27', requires: BUILT_2018,
    setup: S7({ airlines: ROUTES_2019, demand: 0.65, leavers: LEAVERS_2022 }),
    hands: HANDS_7,
    brief: [
      'A war has begun in Ukraine. This Sunday the countries of Europe close their skies to Russian airlines, one after another — Sweden too.',
      'An Aeroflot aircraft is due this morning. Its flight back will not be allowed to leave, and its passengers need help and the truth.',
      'Then the stand and the morning slots it leaves: who should have them?'
    ],
    aim: 'Run the morning the skies closed to Russian airlines, then give its slots to another airline.',
    news: [
      { icon: '⛔', text: 'An airspace closed to an airline: its flights are cancelled, not by the airport\'s fault.' }
    ],
    facts: [
      { text: 'After the government\'s decision the Swedish Transport Agency closed Swedish airspace to Russian aviation; Aeroflot flew to Arlanda and its departures were stopped. On 27 February 2022 Aeroflot cancelled all its flights to Europe.', src: 'Transportstyrelsen, Stängt luftrum för Ryssland; Reuters, 27 February 2022' }
    ],
    stages: [
      { name: 'Sunday morning', mode: 'ops', date: '2022-02-27', from: '07:00', to: '10:00', weather: { temp: -2, wind: [200, 8] }, desks: 16, lanes: 6, booths: 2,
        events: [{ at: '08:10', do: 'ban', al: 'AFL', text: 'Swedish airspace is closed to Russian airlines from now on: the Aeroflot flight cannot leave.' }],
        flights: [F7('AFL', 'A320', 1, '07:40', '07:40', 70, { base: 2210, ns: true }), F7('SK', 'A20N', 7, '07:05', '09:20', 45, { base: 100, intl: false }),
          F7('SK', 'A321', 5, '07:10', '09:30', 52, { base: 300 }), F7('DY', 'B738', 6, '07:05', '09:25', 46, { base: 400 }),
          F7('AY', 'A321', 2, '07:25', '09:25', 52, { base: 800 }), F7('LH', 'A320', 2, '07:30', '09:20', 50, { base: 3020 }),
          F7('BA', 'A320', 2, '07:40', '08:40', 50, { base: 770 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.8 }] },
      { name: 'The empty slots', mode: 'plan', days: 30, demand: 0.7, goal: [],
        choices: [{ id: 'slots', at: 3, default: 'none', icon: '🛫', title: 'Who gets the morning slots?',
          text: 'The Aeroflot flights will not come back. Finnair would fly twice more a day to Helsinki for a tenth off its fees; Norwegian would start two new routes for a quarter off.',
          options: [
            { id: 'finnair', airline: { code: 'AY', routes: [{ type: 'A321', perDay: 2, load: 0.8 }] }, incentive: { code: 'AY', share: 0.1 }, flag: 'slotsGiven', label: 'Finnair' },
            { id: 'norwegian', airline: { code: 'DY', routes: [{ type: 'B738', perDay: 2, load: 0.84 }] }, incentive: { code: 'DY', share: 0.25 }, flag: 'slotsGiven', label: 'Norwegian' },
            { id: 'none', label: 'Leave them empty' }
          ] }] }
    ],
    goal: [{ k: 'flag', id: 'slotsGiven' }],
    stars: [{ k: 'unannounced', max: 0 }, { k: 'airlines', min: 80 }]
  },
  {
    name: 'Clearance Takes Weeks', kind: 'operate', date: '2022-04-04', requires: BUILT_2018,
    setup: S7({ airlines: ROUTES_2022, demand: 0.8, leavers: LEAVERS_2022, cut: { turnaround: 0.5, security: 0.45 } }),
    hands: HANDS_7,
    brief: [
      'Everybody wants to fly this spring, all at once. But the people who load the bags, de-ice the aircraft and screen the passengers must have a security clearance before their first day.',
      'A clearance takes six weeks. Recruit today, and they start in the middle of May. Recruit next month, and they start in the summer.',
      'A busy Friday in May will show who planned in time.'
    ],
    aim: 'Fill the empty jobs early enough for the clearance, then run the busy Friday in May.',
    news: [
      { icon: '🪪', text: 'The security clearance: six weeks before a new screener, handler or de-icer can start.' }
    ],
    facts: [
      { text: 'In May 2022 the security queues at Arlanda grew to over an hour; Swedavia put it down to the surge in travel and a lack of staff at the company that runs the security checks.', src: 'Swedavia press releases, May–June 2022; The Local, 1 June 2022' }
    ],
    stages: [
      { name: 'Six weeks', mode: 'plan', days: 46, goal: [],
        choices: [{ id: 'recruit', at: 1, default: 'later', icon: '🪪', title: 'Recruit now?',
          text: 'Recruit for every team with empty jobs now: the clearance takes six weeks. Or wait and see how many flights the summer really brings.',
          options: [
            { id: 'now', rehire: true, label: 'Recruit now' },
            { id: 'later', label: 'Wait and see' }
          ] }] },
      { name: 'The Friday in May', mode: 'ops', date: '2022-05-20', from: '06:00', to: '09:00', weather: { temp: 12, wind: [200, 8] }, desks: 20, lanes: 14, booths: 3,
        flights: [F7('SK', 'A20N', 10, '06:05', '08:20', 45, { base: 100, intl: false, load: 0.9 }), F7('SK', 'A321', 7, '06:10', '08:30', 52, { base: 300, load: 0.9 }),
          F7('DY', 'B738', 8, '06:05', '08:25', 46, { base: 400, load: 0.92 }), F7('LH', 'A320', 3, '06:30', '08:20', 50, { base: 3020, load: 0.88 }),
          F7('AY', 'A321', 3, '06:25', '08:25', 52, { base: 800, load: 0.88 }), F7('BA', 'A320', 2, '06:40', '07:40', 50, { base: 770, load: 0.9 }),
          F7('SK', 'CRJ9', 4, '06:10', '08:10', 35, { base: 600, intl: false, load: 0.9 }), F7('SK', 'B738', 4, '06:15', '08:15', 46, { base: 450, load: 0.92 })],
        goal: [{ k: 'securityWait', max: 12 }] }
    ],
    goal: [],
    stars: [{ k: 'securityWait', max: 5 }, { k: 'laidOff', max: 0.02 }]
  },
  {
    name: 'One Terminal', kind: 'build', date: '2022-04-25', requires: BUILT_2018,
    setup: S7({ airlines: ROUTES_2022, demand: 0.85, leavers: LEAVERS_2022, projects: ['t4t5'] }),
    hands: HANDS_7,
    brief: [
      'Terminal 5 is too full and Terminal 4 stands closed next door. But between them is a security check, and the queue there is already long.',
      'A walking tunnel airside would join them: passengers checked in at Terminal 4 could walk to the gates of Terminal 5, and the other way, without a second check.',
      'Build it by the middle of June, open Terminal 4 again, and run the first morning as one terminal.'
    ],
    aim: 'Join Terminals 4 and 5 with a tunnel airside by mid-June, and open Terminal 4 again.',
    news: [
      { icon: '🚇', text: 'One terminal: with Terminals 4 and 5 joined, their passengers walk past the shops of both.' }
    ],
    facts: [
      { text: 'On 15 June 2022 Terminal 4 opened again to ease the crowds in Terminal 5. A new walking tunnel joins the two airside, so passengers need no second security check, and Terminal 4 is now part of Terminal 5.', src: SRC_SV7 }
    ],
    stages: [
      { name: 'The tunnel', mode: 'plan', days: 50, endEarly: true, goal: [{ k: 'joined' }],
        choices: [{ id: 'reopen4', at: 4, default: 'wait', icon: '🔓', title: 'Open Terminal 4 for the summer?',
          text: 'If Terminal 4 is closed, opening it takes three weeks. With the tunnel it becomes part of Terminal 5.',
          options: [
            { id: 'now', reopen: 'dom', label: 'Open it' },
            { id: 'wait', label: 'Not this summer' }
          ] }] },
      { name: 'One terminal', mode: 'ops', date: '2022-06-15', from: '06:00', to: '09:00', weather: { temp: 16, wind: [210, 8] }, desks: 22, lanes: 14, booths: 3,
        flights: [F7('SK', 'A20N', 10, '06:05', '08:20', 45, { base: 200, intl: false, load: 0.9 }), F7('SK', 'A321', 7, '06:10', '08:30', 52, { base: 400, load: 0.9 }),
          F7('DY', 'B738', 9, '06:05', '08:25', 46, { base: 500, load: 0.92 }), F7('LH', 'A320', 3, '06:30', '08:20', 50, { base: 3030, load: 0.88 }),
          F7('AY', 'A321', 3, '06:25', '08:25', 52, { base: 810, load: 0.88 }), F7('BA', 'A320', 2, '06:40', '07:40', 50, { base: 780, load: 0.9 })],
        goal: [{ k: 'onTime', p: 0.55 }] }
    ],
    goal: [{ k: 'joined' }],
    stars: [{ k: 'brandsIn', min: 6e6 }, { k: 'checkinWait', max: 3 }]
  },
  {
    name: 'The Summer of Queues', kind: 'operate', date: '2022-06-17', requires: BUILT_2022,
    setup: S7({ airlines: ROUTES_2022, demand: 0.9, leavers: LEAVERS_2022, cut: { security: 0.4 } }),
    hands: HANDS_7,
    brief: [
      'Midsummer week, and every flight is full. The security company has lost many of its screeners this spring, and families come hours early to be sure.',
      'A second security company could send screeners who are cleared already. Seasonal temps could fill in for the ones on holiday. Overtime in the toolbar helps for a day.',
      'Then the morning before Midsummer Eve, and the afternoon.'
    ],
    aim: 'Keep the security queues short on the busiest days of the summer of 2022.',
    news: [
      { icon: '🧍', text: 'The summer of queues: the lanes need screeners, and a lane without its people stays closed.' }
    ],
    facts: [
      { text: 'In June 2022 Swedavia added a second company for the security checks, and told passengers to come no more than three hours before their flight; by July the queues were much shorter, as the first company had taken on about 100 new screeners.', src: 'Swedavia, traffic statistics for June and July 2022' }
    ],
    stages: [
      { name: 'Before Midsummer', mode: 'plan', days: 5, goal: [],
        choices: [{ id: 'second', at: 1, default: 'no', icon: '🛂', title: 'A second security company?',
          text: 'Another company can send screeners who are cleared already, from next week. They cost more than your own people.',
          options: [
            { id: 'yes', money: -18e6, cutFill: { dept: 'security', share: 0.25 }, label: 'Bring them in' },
            { id: 'no', label: 'Our own people will manage' }
          ] }] },
      { name: 'The morning before Midsummer', mode: 'ops', date: '2022-06-23', from: '05:30', to: '08:30', weather: { temp: 18, wind: [210, 7] }, desks: 24, lanes: 16, booths: 3,
        flights: [F7('SK', 'A20N', 10, '05:35', '07:50', 45, { base: 100, intl: false, load: 0.95 }), F7('SK', 'A321', 8, '05:40', '08:00', 52, { base: 300, load: 0.95 }),
          F7('DY', 'B738', 9, '05:35', '07:55', 46, { base: 400, load: 0.96 }), F7('NOVAIR', 'A321', 2, '05:50', '06:30', 60, { base: 700, load: 0.98, ns: true }),
          F7('LH', 'A320', 3, '06:00', '07:50', 50, { base: 3020, load: 0.92 }), F7('AY', 'A321', 3, '05:55', '07:55', 52, { base: 800, load: 0.92 }),
          F7('BA', 'A320', 2, '06:10', '07:10', 50, { base: 770, load: 0.95 })],
        goal: [{ k: 'securityWait', max: 10 }, { k: 'lost', max: 0 }] },
      { name: 'The afternoon', mode: 'ops', from: '13:00', to: '16:00', weather: { temp: 23, wind: [220, 8] }, desks: 24, lanes: 16, booths: 3,
        flights: [F7('SK', 'A20N', 9, '13:05', '15:20', 45, { base: 200, intl: false, load: 0.95 }), F7('SK', 'A321', 7, '13:10', '15:30', 52, { base: 400, load: 0.95 }),
          F7('DY', 'B738', 9, '13:05', '15:25', 46, { base: 500, load: 0.96 }), F7('EK', 'B77W', 1, '13:30', '13:30', 120, { base: 156, load: 0.9 }),
          F7('LH', 'A320', 3, '13:30', '15:20', 50, { base: 3030, load: 0.92 }), F7('BA', 'A320', 2, '13:40', '14:40', 50, { base: 780, load: 0.95 })],
        goal: [{ k: 'securityWait', max: 10 }] }
    ],
    goal: [],
    stars: [{ k: 'securityWait', max: 3 }, { k: 'passengers', min: 85 }]
  },
  {
    name: 'Cyber Morning', kind: 'crisis', date: '2023-10-09', requires: BUILT_2022,
    setup: S7({ airlines: ROUTES_2022, demand: 0.95, leavers: LEAVERS_2022, cyber: true }),
    hands: HANDS_7,
    brief: [
      'Airports all over the world are attacked through their networks: somebody tries to break in, or to drown the systems in rubbish.',
      'The more the systems share their data, the more of them one attack can take down at once. A security operations centre watches the network day and night and cuts an attack off.',
      'Decide what to do this autumn — then a Monday morning when the alarm goes.'
    ],
    aim: 'Protect the airport\'s network, and keep the flights going on the morning of an attack.',
    news: [
      { icon: '🛡️', text: 'The security operations centre: an attack takes down one system briefly instead of several for long.' },
      { icon: '💻', text: 'Cyber attacks: from now on they can come on any day.' }
    ],
    facts: [
      { text: 'This attack is the game\'s own story; no real attack on Arlanda is told.', src: 'the game' }
    ],
    stages: [
      { name: 'This autumn', mode: 'plan', days: 35, goal: [],
        choices: [{ id: 'soc', at: 2, default: 'no', icon: '🛡️', title: 'A security operations centre?',
          text: 'Six specialists watching the network day and night, with their own room and tools. Or more IT people, who could also mend things faster.',
          options: [
            { id: 'centre', build: 'cyberCentre', flag: 'cyberAnswered', label: 'Build the centre' },
            { id: 'it', it: 4, flag: 'cyberAnswered', label: 'Four more IT people' },
            { id: 'no', label: 'Neither' }
          ] }] },
      { name: 'The attack', mode: 'ops', date: '2023-11-13', from: '06:30', to: '09:30', weather: { temp: 2, wind: [200, 8] }, desks: 24, lanes: 14, booths: 3, calm: true,
        events: [{ at: '07:15', do: 'cyber', min: 110, text: 'An attack on the airport\'s network! The linked systems go down while the IT people cut them off.' }],
        flights: [F7('SK', 'A20N', 10, '06:35', '08:50', 45, { base: 100, intl: false, load: 0.85 }), F7('SK', 'A321', 7, '06:40', '09:00', 52, { base: 300, load: 0.85 }),
          F7('DY', 'B738', 9, '06:35', '08:55', 46, { base: 400, load: 0.88 }), F7('LH', 'A320', 3, '07:00', '08:50', 50, { base: 3020 }),
          F7('AY', 'A321', 3, '06:55', '08:55', 52, { base: 800 }), F7('BA', 'A320', 2, '07:10', '08:10', 50, { base: 770 }),
          F7('SK', 'CRJ9', 5, '06:40', '08:40', 35, { base: 600, intl: false })],
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.75 }] }
    ],
    goal: [{ k: 'flag', id: 'cyberAnswered' }],
    stars: [{ k: 'airportDelay', max: 3 }, { k: 'passengers', min: 80 }]
  },
  {
    name: 'Fallback Drill', kind: 'operate', date: '2024-04-08', requires: BUILT_2022,
    setup: S7({ airlines: ROUTES_2022, demand: 1, leavers: LEAVERS_2022, cyber: true }),
    hands: HANDS_7,
    brief: [
      'The systems have run for years without a hitch. That is the danger: the staff have forgotten how the work is done by hand.',
      'A drill day costs a little, and the readiness of every system comes back. Look at the readiness in the Ops Center.',
      'Then a test: on a spring morning the stand planning and the check-in computers are switched off on purpose.'
    ],
    aim: 'Bring the fallback readiness back with drills, then pass a morning of planned failures.',
    news: [
      { icon: '🧯', text: 'Readiness: how well the staff still know the manual way. It fades every month without a drill.' }
    ],
    facts: [
      { text: 'This drill is the game\'s own story.', src: 'the game' }
    ],
    stages: [
      { name: 'Before the test', mode: 'plan', days: 20, goal: [],
        choices: [{ id: 'drill', at: 2, default: 'no', icon: '🧯', title: 'Drill days for every system?',
          text: 'One day for each system: the staff work by hand again while the system watches. It costs a little and slows the airport for a day.',
          options: [
            { id: 'yes', drills: true, label: 'Drill everything' },
            { id: 'no', label: 'The systems never fail' }
          ] }] },
      { name: 'The test morning', mode: 'ops', date: '2024-05-06', from: '06:30', to: '09:30', weather: { temp: 9, wind: [200, 8] }, desks: 24, lanes: 14, booths: 3, calm: true,
        events: [{ at: '06:45', do: 'fail', dom: 'stands', min: 120, deep: true }, { at: '06:45', do: 'fail', dom: 'checkin', min: 120, deep: true }],
        flights: [F7('SK', 'A20N', 10, '06:35', '08:50', 45, { base: 100, intl: false, load: 0.88 }), F7('SK', 'A321', 7, '06:40', '09:00', 52, { base: 300, load: 0.88 }),
          F7('DY', 'B738', 9, '06:35', '08:55', 46, { base: 400, load: 0.9 }), F7('LH', 'A320', 3, '07:00', '08:50', 50, { base: 3020 }),
          F7('AY', 'A321', 3, '06:55', '08:55', 52, { base: 800 }), F7('BA', 'A320', 2, '07:10', '08:10', 50, { base: 770 }),
          F7('SK', 'CRJ9', 5, '06:40', '08:40', 35, { base: 600, intl: false })],
        goal: [{ k: 'onTime', p: 0.75 }] }
    ],
    goal: [{ k: 'readiness', min: 90 }],
    stars: [{ k: 'airportDelay', max: 3 }, { k: 'checkinWait', max: 4 }]
  },
  {
    name: 'Exam: The Day the Screens Went Blue', kind: 'exam', date: '2024-06-24', requires: BUILT_2022,
    setup: S7({ airlines: ROUTES_2022, demand: 1, leavers: LEAVERS_2022, cyber: true }),
    hands: HANDS_7,
    brief: [
      'A Friday in the middle of the summer. Early in the morning a faulty update of one security program makes computers all over the world crash and start again, over and over.',
      'Check-in, the screens, the stand planning, the baggage sorter: whatever runs on those computers stops. Airlines check people in by hand and write the boarding passes with a pen.',
      'Prepare in the weeks before, then hold the morning — and bring the airport back in the afternoon.'
    ],
    aim: 'Get through the day of the global IT outage on the people and their hand skills.',
    news: [
      { icon: '🎓', text: 'The exam: everything of the chapter.' },
      { icon: '🟦', text: 'A global outage: every system down at once. Only the teams kept beside them, and your hands, are left.' }
    ],
    facts: [
      { text: 'On 19 July 2024 a faulty update of a security program crashed computers running Windows all over the world; flights were delayed and cancelled at airports across Europe, Arlanda among them.', src: 'Reuters, 19 July 2024; The Local Sweden, 19 July 2024' },
      { text: 'Arlanda had close to 22 million passengers in 2023, and 22.7 million in 2024.', src: 'Swedavia traffic statistics 2023 and 2024' }
    ],
    stages: [
      { name: 'The weeks before', mode: 'plan', days: 25, crews: 2, goal: [],
        choices: [{ id: 'prep', at: 2, default: 'none', icon: '🧯', title: 'Before the summer',
          text: 'A drill day in every system, or a security operations centre against attacks — the summer budget has room for one of them.',
          options: [
            { id: 'drills', drills: true, label: 'Drills everywhere' },
            { id: 'soc', build: 'cyberCentre', label: 'The security operations centre' },
            { id: 'none', label: 'Neither' }
          ] }] },
      { name: 'The morning', mode: 'ops', date: '2024-07-19', from: '06:00', to: '08:45', weather: { temp: 19, wind: [210, 8] }, desks: 26, lanes: 16, booths: 4,
        events: [{ at: '06:05', do: 'outage', min: 170, text: 'Computers are crashing all over the world: every system at the airport has stopped. Work by hand!' }],
        flights: [F7('SK', 'A20N', 10, '06:05', '08:20', 45, { base: 100, intl: false, load: 0.92 }), F7('SK', 'A321', 7, '06:10', '08:30', 52, { base: 300, load: 0.92 }),
          F7('DY', 'B738', 9, '06:05', '08:25', 46, { base: 400, load: 0.95 }), F7('NOVAIR', 'A321', 2, '06:20', '07:00', 60, { base: 700, load: 0.97, ns: true }),
          F7('LH', 'A320', 3, '06:30', '08:20', 50, { base: 3020, load: 0.92 }), F7('AY', 'A321', 3, '06:25', '08:25', 52, { base: 800, load: 0.92 }),
          F7('BA', 'A320', 2, '06:40', '07:40', 50, { base: 770, load: 0.92 })],
        goal: [{ k: 'lost', max: 2 }, { k: 'onTime', p: 0.5 }] },
      { name: 'The afternoon', mode: 'ops', from: '14:00', to: '16:45', weather: { temp: 24, wind: [220, 8] }, desks: 26, lanes: 16, booths: 4,
        flights: [F7('EK', 'B77W', 1, '14:10', '14:10', 120, { base: 156, load: 0.92 }), F7('QR', 'A359', 1, '14:30', '14:30', 100, { base: 167 }),
          F7('SK', 'A20N', 9, '14:05', '16:20', 45, { base: 200, intl: false, load: 0.92 }), F7('SK', 'A321', 7, '14:10', '16:30', 52, { base: 400, load: 0.92 }),
          F7('DY', 'B738', 9, '14:05', '16:25', 46, { base: 500, load: 0.95 }), F7('LH', 'A320', 3, '14:30', '16:20', 50, { base: 3030, load: 0.92 }),
          F7('BA', 'A320', 2, '14:40', '15:40', 50, { base: 780, load: 0.92 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.7 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 5 }, { k: 'passengers', min: 85 }],
    paper: { head: 'THE SCREENS WENT BLUE — ARLANDA WROTE BY HAND',
      text: 'Computers crashed all over the world, but at Arlanda the staff knew what to do: desks opened by hand, boarding passes written with a pen, aircraft parked by radio. "The people are our backup," says the director.' }
  }
]);
