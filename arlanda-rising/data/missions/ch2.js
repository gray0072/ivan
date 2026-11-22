'use strict';

// Arlanda Rising — chapter 2, The Jet Age (1965–1976): the airport grows with the jets. A new apron, the summer
// charters, the first teams that take whole kinds of work off the player's hands, managers in pairs, the jumbo and
// the fire category it needs, the first wage round, the baggage belts, fog and the instrument landing system,
// runway 2 for the crosswinds and, as the exam, the international terminal of 1976. See data/missions/missions.js
// for the fields. The history the briefings tell is checked (`facts` with the source); the flights of a day, the
// people and the deals are the game's own story.

const SRC_SV2 = 'sv.wikipedia Arlanda (Historia)';
// everything chapter 1 built, for a mission started without the campaign (a cheat's jump)
const BUILT_1962 = ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'fireStation', 'lights1'];
// the vehicles chapter 1 asked the player to have (1-6's fuel truck, 1-7's two ploughs): what a mission started without
// the campaign (a cheat's jump) is topped up to — never more, so nothing the player buys appears by itself
const ITEMS_1962 = { fuelTruck: 1, plough: 2 };
// the jumbo's era: a 747 keeps a fuel truck busy for over an hour — more trucks are the player's to buy
const ITEMS_1971 = ITEMS_1962;

// a series of flights for an ops stage
const FL = (al, type, n, from, to, turn, extra) => Object.assign({ al, type, n, from, to, turn, load: 0.72 }, extra || {});

// the airlines' planned routes (flights a day; the traffic in summary between and during the missions)
const ROUTES_1965 = { SK: [{ type: 'CRVL', perDay: 12, load: 0.68 }, { type: 'DC8', perDay: 3, load: 0.72 }] };
const ROUTES_1968 = { SK: [{ type: 'CRVL', perDay: 10, load: 0.7 }, { type: 'DC9', perDay: 6, load: 0.7 }, { type: 'DC8', perDay: 4, load: 0.72 }] };
const ROUTES_1971 = { SK: [{ type: 'DC9', perDay: 10, load: 0.7 }, { type: 'CRVL', perDay: 4, load: 0.68 }, { type: 'DC8', perDay: 4, load: 0.72 }, { type: 'B747', perDay: 1, load: 0.65 }] };
const ROUTES_1976 = {
  SK: [{ type: 'DC9', perDay: 14, load: 0.7 }, { type: 'DC8', perDay: 3, load: 0.72 }, { type: 'B747', perDay: 2, load: 0.68 }, { type: 'CRVL', perDay: 2, load: 0.65 }],
  LH: [{ type: 'B727', perDay: 2, load: 0.7 }], AY: [{ type: 'DC9', perDay: 2, load: 0.7 }]
};
const TEAMS_1968 = { stands: 1, turnaround: 1, checkin: 1 };

addMissions(2, [
  {
    name: 'Room for the Jets', kind: 'build', date: '1965-05-03', requires: BUILT_1962,
    setup: { open: true, budget: 55e6, loanLimit: 90e6, projects: ['apron2'], items: ITEMS_1962, desks: 4, airlines: ROUTES_1965 },
    hands: ['stand', 'checkin', 'fuel'],
    brief: [
      'The jets have won: more and more of them come every year, and four stands by the terminal are no longer enough.',
      'North of the first apron there is room for a new one. Pave it this spring, and three more stands are ready for the summer.',
      'Then a busy summer morning shows whether the airport has room to breathe.'
    ],
    aim: 'Pave the new apron, then run a summer morning on time.',
    news: [
      { icon: '🅿️', text: 'The jet apron: three more stands north of the first one.' },
      { icon: '💰', text: 'Every month the airport pays its staff and the upkeep of what it owns.' }
    ],
    stages: [
      { name: 'The new apron', mode: 'plan', days: 75, crews: 2, endEarly: true,
        goal: [{ k: 'project', id: 'apron2', stages: ['pave'] }],
        choices: [{ id: 'spoil', at: 8, default: 'haul', icon: '⛰️', title: 'The earth from the apron',
          text: 'The diggers move a mountain of earth. Hauling it away costs money; piled up as a bank toward Märsta and planted with trees, it softens the noise — but it takes longer.',
          options: [
            { id: 'haul', money: -2e6, label: 'Haul it away' },
            { id: 'bank', money: -3e6, neighboursBase: 4, meters: { neighbours: 4 }, extraDays: ['apron2', 'pave', 8], label: 'A noise bank' }
          ] }] },
      { name: 'Summer morning', mode: 'ops', date: '1965-07-05', from: '07:00', to: '10:00', weather: { temp: 17, wind: [200, 8] }, desks: 3,
        flights: [FL('SK', 'CRVL', 8, '07:05', '09:35', 40), FL('SK', 'DC8', 4, '07:20', '09:20', 65, { base: 900 }),
          FL('TRANSAIR', 'DC6B', 2, '07:40', '08:40', 50, { load: 0.9, base: 300 })],
        goal: [{ k: 'onTime', p: 0.8 }, { k: 'lost', max: 0 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 2 }, { k: 'spent', max: 75e6 }]
  },
  {
    name: 'Charter Summer', kind: 'choice', date: '1967-04-24', requires: BUILT_1962.concat(['apron2']),
    setup: { open: true, budget: 10e6, items: ITEMS_1962, desks: 4, airlines: ROUTES_1965 },
    hands: ['stand', 'checkin', 'fuel'],
    brief: [
      'Swedes have discovered the sun! Charter airlines fly families to the Mediterranean every summer, and they all want the Saturday mornings.',
      'Two of them ask for slots: Transair Sweden and the Danish Sterling Airways. One, both — or none?',
      'Charters bring money, and crowds: hundreds of holidaymakers with big suitcases at the desks at once.'
    ],
    aim: 'Earn 3.5 MSEK with the summer charters, and get a full Saturday morning away.',
    news: [
      { icon: '🏖️', text: 'Offers: airlines ask for slots, and you choose.' },
      { icon: '🧳', text: 'Charter passengers come all at once, with a lot of luggage.' }
    ],
    facts: [
      { text: 'Transair Sweden was a charter airline from 1950 to 1981; Sterling Airways a Danish one from 1962 to 1993.', src: 'en.wikipedia Transair Sweden; en.wikipedia Sterling Airways' }
    ],
    stages: [
      { name: 'Spring deals', mode: 'plan', days: 80, goal: [],
        choices: [
          { id: 'charter', at: 5, default: 'none', icon: '🏖️', title: 'Summer charters',
            text: 'Transair Sweden wants three flights every summer morning with its DC-6s; Sterling Airways three with its Caravelles. Both pay fees on every holidaymaker.',
            options: [
              { id: 'transair', airline: { code: 'TRANSAIR', routes: [{ type: 'DC6B', perDay: 3, load: 0.9, months: [6, 7, 8, 9] }], mood: 72 }, label: 'Transair' },
              { id: 'sterling', airline: { code: 'STERLING', routes: [{ type: 'CRVL', perDay: 3, load: 0.9, months: [6, 7, 8, 9] }], mood: 72 }, label: 'Sterling' },
              { id: 'both', airline: { code: 'TRANSAIR', routes: [{ type: 'DC6B', perDay: 3, load: 0.9, months: [6, 7, 8, 9] }], mood: 72 },
                airline2: { code: 'STERLING', routes: [{ type: 'CRVL', perDay: 3, load: 0.9, months: [6, 7, 8, 9] }], mood: 72 }, label: 'Both' },
              { id: 'none', label: 'Neither' }
            ] },
          { id: 'desks', at: 25, default: 'no', icon: '🧳', title: 'More check-in desks?',
            text: 'The charter crowds will all want to check in at the same time. Two more desks could be ready by the summer.',
            options: [{ id: 'two', build: ['desk', 'desk'], label: 'Two more desks' }, { id: 'no', label: 'We can manage' }] }
        ] },
      { name: 'Saturday morning', mode: 'ops', date: '1967-07-15', from: '06:00', to: '09:00', weather: { temp: 19, wind: [190, 7] }, desks: 4,
        flights: [FL('SK', 'CRVL', 6, '06:10', '08:40', 40), FL('SK', 'DC8', 2, '06:40', '08:10', 65, { base: 900 }),
          FL('TRANSAIR', 'DC6B', 3, '06:25', '08:25', 55, { load: 0.95, base: 300, when: ['charter', 'transair', 'both'] }),
          FL('STERLING', 'CRVL', 3, '06:35', '08:35', 45, { load: 0.95, base: 500, when: ['charter', 'sterling', 'both'] })],
        goal: [{ k: 'lost', max: 0 }, { k: 'checkinWait', max: 14 }] }
    ],
    goal: [{ k: 'profit', min: 3.5e6 }],
    stars: [{ k: 'profit', min: 4.5e6 }, { k: 'checkinWait', max: 6 }]
  },
  {
    name: 'Hire a Hand', kind: 'operate', date: '1968-10-07', requires: BUILT_1962.concat(['apron2']),
    setup: { open: true, items: ITEMS_1962, desks: 6, airlines: ROUTES_1968, unlock: { stands: 1, turnaround: 1, checkin: 1 } },
    hands: ['stand', 'checkin', 'fuel'],
    brief: [
      'Twenty jets a morning, and you are still picking every stand and sending every fuel truck yourself. Nobody can keep up with that.',
      'Hire a team: a stand planner, a ramp supervisor or a desk scheduler takes a whole kind of task off your hands — for wages every month.',
      'A new team needs two weeks before its first shift. Hire it in time!'
    ],
    aim: 'Hire the teams you need, then run a busy autumn morning.',
    news: [
      { icon: '👷', text: 'Teams: a team does one kind of task for you. It costs wages every month.' },
      { icon: '📋', text: 'Hire them in the panel: a team is ready two weeks later.' }
    ],
    stages: [
      { name: 'Hiring', mode: 'plan', days: 25, goal: [],
        choices: [{ id: 'firstTeam', at: 2, default: 'none', icon: '👷', title: 'The first team',
          text: 'The personnel office can start on one team at once. Which work should leave your hands first? More teams can be hired in the panel.',
          options: [
            { id: 'stands', hire: 'stands', label: 'Stand planners' },
            { id: 'turnaround', hire: 'turnaround', label: 'A ramp supervisor' },
            { id: 'checkin', hire: 'checkin', label: 'A desk scheduler' },
            { id: 'none', label: 'Not yet' }
          ] }] },
      { name: 'The busy morning', mode: 'ops', date: '1968-11-04', from: '07:00', to: '10:00', weather: { temp: 3, wind: [220, 9] }, desks: 3,
        flights: [FL('SK', 'CRVL', 7, '07:05', '09:35', 40), FL('SK', 'DC9', 6, '07:15', '09:25', 40, { base: 400 }),
          FL('SK', 'DC8', 3, '07:30', '09:10', 65, { base: 900 }), FL('SK', 'DC9', 2, '07:35', '08:35', 0, { parked: true, base: 450 })],
        goal: [{ k: 'airportDelay', max: 5 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 2 }, { k: 'handsOff', min: 30 }]
  },
  {
    name: 'Two Managers', kind: 'choice', date: '1969-12-01', requires: BUILT_1962.concat(['apron2']),
    setup: { open: true, items: ITEMS_1962, desks: 6, airlines: ROUTES_1968, domains: TEAMS_1968, unlock: { snow: 1 } },
    hands: ['stand', 'checkin', 'fuel', 'plough'],
    brief: [
      'Your teams work — but a team needs a head. Two candidates came for each job, and each is brilliant at one thing and weak at another.',
      'Choose the head of Operations, and a snow chief with a team of his or her own before the winter sets in.',
      'Read the cards well: there is no perfect manager.'
    ],
    aim: 'Hire a snow team with its chief, then keep the runway open through a snowy morning.',
    news: [
      { icon: '👔', text: 'Managers come in pairs: two strengths and a flaw each.' },
      { icon: '❄️', text: 'A snow team sends the ploughs for you.' }
    ],
    stages: [
      { name: 'Interviews', mode: 'plan', days: 20, goal: [],
        choices: [
          { id: 'opsHead', at: 2, default: 'nobody', icon: '👔', title: 'Head of Operations',
            text: 'Karin Ek plans the stands better and knows every airline\'s temper, but refuses to work with old systems. Lars Holm is quick and cheap, but hasty.',
            options: [
              { id: 'karin', manager: 'karinEk', label: 'Karin Ek' },
              { id: 'lars', manager: 'larsHolm', label: 'Lars Holm' },
              { id: 'nobody', label: 'Nobody yet' }
            ] },
          { id: 'snowChief', at: 6, default: 'nobody', icon: '❄️', title: 'A snow chief and a team',
            text: 'Bo Lindqvist "smells snow" and his convoys are fast, but he bills overtime in every storm. Anna Berg is calm and her team is rarely sick, but she is careful and slower.',
            options: [
              { id: 'bo', hire: 'snow', manager: 'boLindqvist', label: 'Bo Lindqvist' },
              { id: 'anna', hire: 'snow', manager: 'annaBerg', label: 'Anna Berg' },
              { id: 'nobody', label: 'We plough by hand' }
            ] }
        ] },
      { name: 'Snowy morning', mode: 'ops', date: '1969-12-29', from: '07:00', to: '10:00', weather: { temp: -7, wind: [20, 9], snow: [['07:20', '09:30', 2.8]], showers: 1 }, desks: 3,
        flights: [FL('SK', 'CRVL', 6, '07:05', '09:30', 40), FL('SK', 'DC9', 6, '07:15', '09:35', 40, { base: 400 }),
          FL('SK', 'DC8', 2, '07:45', '08:50', 65, { base: 900 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 5 }] }
    ],
    goal: [{ k: 'level', dom: 'snow', min: 1 }],
    stars: [{ k: 'manager', dept: 'stands' }, { k: 'onTime', p: 0.9 }]
  },
  {
    name: 'Jumbo!', kind: 'build', date: '1971-04-05', requires: BUILT_1962.concat(['apron2']),
    setup: { open: true, budget: 25e6, items: ITEMS_1971, desks: 6, airlines: ROUTES_1971, domains: TEAMS_1968, projects: ['apron2'] },
    hands: ['stand', 'checkin', 'fuel'],
    brief: [
      '1971: SAS has its first Boeing 747. It is twice as big as anything that ever landed here, with four hundred seats.',
      'No stand of yours is big enough. Build one for it at the jet apron — and think of the queue when four hundred people check in at once.',
      'Its first visit comes with a one-off permission from the fire authority. After that, we must see.'
    ],
    aim: 'Build the jumbo stand, then handle the first 747 day.',
    news: [
      { icon: '✈️', text: 'The Boeing 747: size code E, 400 seats, a long turnaround.' },
      { icon: '🅿️', text: 'Stand 5: the first stand for the biggest jets.' },
      { icon: '⛽', text: 'A 747 keeps a fuel truck busy for over an hour: more trucks under Vehicles, in the bar below.' }
    ],
    facts: [
      { text: 'SAS put its first Boeing 747-283B into service in 1971.', src: 'airhistory.net SE-DDL; worldairlinenews.com' }
    ],
    stages: [
      { name: 'The jumbo stand', mode: 'plan', days: 50, crews: 2, endEarly: true,
        goal: [{ k: 'project', id: 'apron2', stages: ['bigStand'] }],
        choices: [{ id: 'jumboFee', at: 10, default: 'no', icon: '🤝', title: 'A discount for the jumbo?',
          text: 'SAS asks for a lower landing fee for its 747 for the first year: the giant pays by its weight, and the route is new.',
          options: [
            { id: 'yes', money: -3e6, meters: { airlines: 6 }, label: 'Give the discount' },
            { id: 'no', meters: { airlines: -5 }, label: 'Full fees' }
          ] }] },
      { name: 'Jumbo day', mode: 'ops', date: '1971-06-07', from: '10:00', to: '13:00', weather: { temp: 18, wind: [210, 8] }, desks: 4,
        flights: [FL('SK', 'B747', 1, '10:25', '10:25', 125, { base: 900, waiver: true, load: 0.68 }), FL('SK', 'DC8', 3, '10:10', '12:10', 65, { base: 950 }),
          FL('SK', 'DC9', 7, '10:05', '12:35', 40, { base: 400 }), FL('SK', 'CRVL', 2, '10:40', '12:00', 40)],
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.8 }] }
    ],
    goal: [],
    stars: [{ k: 'checkinWait', max: 9 }, { k: 'airlines', min: 72 }]
  },
  {
    name: 'Fire Category', kind: 'operate', date: '1971-10-04', requires: BUILT_1962.concat(['apron2', 'apron2.bigStand']),
    unlocks: ['crashTender'],
    setup: { open: true, items: ITEMS_1971, desks: 6, airlines: ROUTES_1971, domains: TEAMS_1968 },
    hands: ['stand', 'checkin', 'fuel'],
    brief: [
      'The 747 is to come every day now. But a fire service must be big enough for the biggest aircraft it may have to save: the jumbo needs category 9.',
      'Your fire station has category 7. Each crash tender you buy adds one.',
      'And a fire service is not only for show: a morning with an emergency landing will test it.'
    ],
    aim: 'Raise the fire category to 9, then run a morning with an emergency.',
    news: [
      { icon: '🚒', text: 'Fire category: an aircraft too big for your fire service is sent elsewhere.' },
      { icon: '🆘', text: 'Emergencies: the aircraft lands first, and the runway is closed while the fire service checks it.' }
    ],
    stages: [
      { name: 'New tenders', mode: 'plan', days: 40, crews: 1, endEarly: true, goal: [{ k: 'fireCat', min: 9 }],
        choices: [{ id: 'drill', at: 6, default: 'no', icon: '🧯', title: 'A big fire drill',
          text: 'The fire chief wants a full-scale drill with the airlines: a day of smoke, sirens and "injured" volunteers. It costs a little, and everybody learns.',
          options: [
            { id: 'yes', money: -1e6, meters: { safety: 4 }, label: 'Hold the drill' },
            { id: 'no', label: 'Not this year' }
          ] }] },
      { name: 'The emergency', mode: 'ops', date: '1971-11-15', from: '08:00', to: '11:00', weather: { temp: 2, wind: [230, 10] }, desks: 4,
        events: [{ at: '09:05', do: 'emergency' }],
        flights: [FL('SK', 'B747', 1, '08:20', '08:20', 125, { base: 900, load: 0.65 }), FL('SK', 'DC8', 3, '08:10', '10:10', 65, { base: 950 }),
          FL('SK', 'DC9', 7, '08:05', '10:35', 40, { base: 400 }), FL('SK', 'CRVL', 2, '08:40', '10:00', 40)],
        goal: [{ k: 'lost', max: 0 }, { k: 'closeCalls', max: 0 }] }
    ],
    goal: [],
    stars: [{ k: 'safety', min: 82 }, { k: 'onTime', p: 0.85 }]
  },
  {
    name: 'The Wage Round', kind: 'choice', date: '1972-03-06', requires: BUILT_1962.concat(['apron2', 'apron2.bigStand']),
    setup: { open: true, items: Object.assign({ crashTender: 2 }, ITEMS_1971), desks: 6, airlines: ROUTES_1971, domains: TEAMS_1968 },
    hands: ['stand', 'checkin', 'fuel'],
    brief: [
      'Every year or two the unions ask for higher wages. This spring it is the ramp workers\' turn — the people who fuel your aircraft.',
      'Accept, offer less, ask the national mediator — or say no. Say no, and the union gives notice: a strike a week later, as Swedish law says.',
      'A strike on a busy day means your fuel trucks wait for you.'
    ],
    aim: 'Settle the wage round, then run a busy April morning.',
    news: [
      { icon: '✊', text: 'Wage rounds: the union\'s mood decides whether it takes a lower offer.' },
      { icon: '🚫', text: 'A strike: the team does only a sixth of its work, the rest comes to you.' }
    ],
    stages: [
      { name: 'The wage round', mode: 'plan', days: 30, goal: [],
        choices: [{ id: 'wage', at: 26, default: 'refuse', icon: '✊', kind: 'union', dept: 'turnaround', title: 'The ramp workers\' wage round',
          text: 'The ramp workers\' union asks for a raise of 6 %. Their mood is fair. A smaller offer may be taken — or refused.',
          options: [
            { id: 'accept', union: { dept: 'turnaround', how: 'accept' }, label: 'Accept 6 %' },
            { id: 'counter45', union: { dept: 'turnaround', how: 'counter', offer: 0.045 }, label: 'Offer 4.5 %' },
            { id: 'counter3', union: { dept: 'turnaround', how: 'counter', offer: 0.03 }, label: 'Offer 3 %' },
            { id: 'mediator', union: { dept: 'turnaround', how: 'mediator' }, label: 'Ask the mediator' },
            { id: 'refuse', union: { dept: 'turnaround', how: 'refuse' }, label: 'Refuse' }
          ] }] },
      { name: 'April morning', mode: 'ops', date: '1972-04-10', from: '07:00', to: '10:00', weather: { temp: 6, wind: [200, 9] }, desks: 4,
        flights: [FL('SK', 'DC9', 8, '07:05', '09:35', 40, { base: 400 }), FL('SK', 'CRVL', 4, '07:15', '09:15', 40),
          FL('SK', 'DC8', 3, '07:30', '09:10', 65, { base: 950 }), FL('SK', 'B747', 1, '08:00', '08:00', 125, { base: 900, load: 0.65 })],
        goal: [{ k: 'onTime', p: 0.75 }, { k: 'airportDelay', max: 4 }] }
    ],
    goal: [],
    stars: [{ k: 'noStrike' }, { k: 'staff', min: 62 }]
  },
  {
    name: 'The Bag Belt', kind: 'build', date: '1973-05-07', requires: BUILT_1962.concat(['apron2', 'apron2.bigStand']),
    setup: { open: true, minMoney: 50e6, items: Object.assign({ crashTender: 2 }, ITEMS_1971), desks: 6, airlines: ROUTES_1971, domains: TEAMS_1968,
      opens: ['baggage'], unlock: { baggage: 2 }, projects: ['bagHall'] },
    hands: ['stand', 'checkin', 'fuel', 'bags'],
    brief: [
      'Bags! Every aircraft brings a hundred suitcases, and so far you send every cart yourself. A cart sent wrong, and the bags fly to the wrong city.',
      'A baggage hall under the terminal, with conveyor belts, would do it for you: build the hall first, then put in the belts. They come with their own operators.',
      'Belts jam, though. A team of handlers beside them takes over when they stop — for wages every month. Without one, the bags come back to you.'
    ],
    aim: 'Do the bags by hand for a morning, build the hall and the belts, and decide who helps when they jam.',
    news: [
      { icon: '🛄', text: 'Bags: send the carts to every arrival; boarding waits for them.' },
      { icon: '⚙️', text: 'The conveyor belts: a machine that does the bags — and sometimes jams.' },
      { icon: '👷', text: 'Handlers as the fallback: hire them in the panel, before or after the belts.' }
    ],
    stages: [
      { name: 'Bags by hand', mode: 'ops', from: '07:00', to: '10:00', weather: { temp: 12, wind: [200, 8] }, desks: 4,
        flights: [FL('SK', 'DC9', 7, '07:05', '09:35', 40, { base: 400 }), FL('SK', 'CRVL', 3, '07:15', '09:05', 40),
          FL('SK', 'DC8', 2, '07:40', '08:50', 65, { base: 950 })],
        goal: [{ k: 'lostBags', max: 12 }] },
      { name: 'The baggage hall', mode: 'plan', days: 70, crews: 2, endEarly: true, goal: [{ k: 'level', dom: 'baggage', min: 2 }] },
      { name: 'Summer afternoon', mode: 'ops', date: '1973-07-16', from: '15:00', to: '18:00', weather: { temp: 22, wind: [220, 9] }, desks: 4,
        events: [{ at: '16:10', do: 'fail', dom: 'baggage', min: 40 }],
        flights: [FL('SK', 'DC9', 8, '15:05', '17:35', 40, { base: 400 }), FL('SK', 'CRVL', 3, '15:20', '17:10', 40),
          FL('SK', 'DC8', 2, '15:30', '16:50', 65, { base: 950 }), FL('SK', 'B747', 1, '16:00', '16:00', 125, { base: 900, load: 0.65 })],
        goal: [{ k: 'lostBags', max: 6 }, { k: 'onTime', p: 0.8 }] }
    ],
    goal: [],
    stars: [{ k: 'lostBags', max: 6 }, { k: 'passengers', min: 70 }]
  },
  {
    name: 'Fog Morning', kind: 'build', date: '1974-10-07', requires: BUILT_1962.concat(['apron2', 'apron2.bigStand', 'bagHall']),
    setup: { open: true, items: Object.assign({ crashTender: 2 }, ITEMS_1971), desks: 6, airlines: ROUTES_1971, domains: Object.assign({ baggage: 2 }, TEAMS_1968),
      projects: ['ils1'] },
    hands: ['stand', 'checkin', 'fuel', 'bags'],
    brief: [
      'Autumn mornings bring fog from the lakes, thick as milk. With the approach lights the pilots can land down to 250 metres of sight — not less.',
      'An instrument landing system guides them down by radio, in fog much thicker than that. But in low visibility the aircraft must keep further apart.',
      'Build it before the fog season really starts.'
    ],
    aim: 'Build the instrument landing system, then land a foggy morning.',
    news: [
      { icon: '📡', text: 'The instrument landing system: landings in thick fog, with more space between them.' }
    ],
    stages: [
      { name: 'The antennas', mode: 'plan', days: 40, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'ils1' }],
        choices: [{ id: 'lvp', at: 4, default: 'no', icon: '🎧', title: 'Fog training',
          text: 'The controllers ask for a course in low-visibility procedures before the first foggy morning.',
          options: [
            { id: 'yes', money: -1.5e6, meters: { safety: 4 }, label: 'Pay for the course' },
            { id: 'no', label: 'They will learn on the job' }
          ] }] },
      { name: 'Fog', mode: 'ops', date: '1974-11-25', from: '06:00', to: '09:00', weather: { temp: 3, wind: [180, 3], fog: [['06:00', '08:30', 180]] }, desks: 4,
        flights: [FL('SK', 'DC9', 6, '06:10', '08:40', 40, { base: 400 }), FL('SK', 'CRVL', 3, '06:30', '08:30', 40),
          FL('SK', 'DC8', 2, '06:50', '08:20', 65, { base: 950 }), FL('SK', 'B747', 1, '07:30', '07:30', 125, { base: 900, load: 0.6 })],
        goal: [{ k: 'lost', max: 1 }] }
    ],
    goal: [],
    stars: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.7 }]
  },
  {
    name: 'Crosswind', kind: 'build', date: '1975-03-03', requires: BUILT_1962.concat(['apron2', 'apron2.bigStand', 'bagHall', 'ils1']),
    setup: { open: true, budget: 60e6, loanLimit: 300e6, items: Object.assign({ crashTender: 2 }, ITEMS_1971), desks: 6, airlines: ROUTES_1971,
      domains: Object.assign({ baggage: 2 }, TEAMS_1968), projects: ['runway2'] },
    grants: ['runway2'],
    hands: ['stand', 'checkin', 'fuel', 'bags'],
    brief: [
      'Runway 1 runs north and south. When an autumn gale blows from the west, the wind comes straight across it, and no pilot can land.',
      'The plan of 1957 had a second runway, 2.5 kilometres long, toward the east and west. Build it now — the owner pays half if you ask.',
      'Then wait for the first westerly gale.'
    ],
    aim: 'Build runway 2, then keep the traffic going in a westerly gale.',
    news: [
      { icon: '🌬️', text: 'Crosswind: above 20 knots across a runway, nobody lands on it.' },
      { icon: '🛬', text: 'Runway 2 (08/26): for the westerly and easterly winds.' }
    ],
    facts: [
      { text: 'The Riksdag\'s decision of 1957 had two runways: runway 1 of 3.3 km and runway 2 of 2.5 km.', src: SRC_SV2 }
    ],
    stages: [
      { name: 'Runway 2', mode: 'plan', days: 160, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'runway2' }],
        choices: [{ id: 'forest', at: 20, default: 'clear', icon: '🌲', title: 'The forest by the new runway',
          text: 'Ornithologists ask you to leave a wet forest east of the new runway alone: cranes nest there. Clearing it is cheaper; going round it adds work.',
          options: [
            { id: 'spare', money: -6e6, meters: { neighbours: 6 }, neighboursBase: 3, label: 'Spare the cranes' },
            { id: 'clear', meters: { neighbours: -4 }, label: 'Clear it' }
          ] }] },
      { name: 'Westerly gale', mode: 'ops', date: '1975-10-20', from: '07:00', to: '10:00', weather: { temp: 8, wind: [270, 30] }, desks: 4,
        flights: [FL('SK', 'DC9', 8, '07:05', '09:35', 40, { base: 400 }), FL('SK', 'CRVL', 3, '07:20', '09:10', 40),
          FL('SK', 'DC8', 3, '07:30', '09:20', 65, { base: 950 }), FL('SK', 'B747', 1, '08:10', '08:10', 125, { base: 900, load: 0.65 })],
        goal: [{ k: 'lost', max: 0 }] }
    ],
    goal: [],
    stars: [{ k: 'onTime', p: 0.85 }, { k: 'neighbours', min: 66 }]
  },
  {
    name: 'Exam: The International Terminal', kind: 'exam', date: '1976-03-01',
    unlocks: ['restaurant'],
    requires: BUILT_1962.concat(['apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2']),
    setup: { open: true, budget: 60e6, loanLimit: 300e6, items: Object.assign({ crashTender: 2 }, ITEMS_1971), desks: 6, airlines: ROUTES_1976,
      domains: Object.assign({ baggage: 2 }, TEAMS_1968, { snow: 1 }), projects: ['intlTerminal'] },
    hands: ['stand', 'checkin', 'fuel', 'bags'],
    brief: [
      '1976: Arlanda gets a new terminal for all its international flights, scheduled and charter. Build it by the summer.',
      'Then the busiest day of the decade: SAS jumbos, Lufthansa, Finnair, the charters — with everything you learnt in this chapter.',
      'Teams, managers, belts, the fire service and runway 2: it all has to work together.'
    ],
    aim: 'Finish the international terminal, then run its first summer day.',
    news: [
      { icon: '🎓', text: 'The exam: everything of the chapter.' },
      { icon: '🏛️', text: 'The international terminal: more desks, and room for a restaurant.' }
    ],
    facts: [
      { text: 'Arlanda\'s international terminal (today Terminal 5) opened in 1976 and took all the international traffic, scheduled and charter.', src: SRC_SV2 + '; swedavia.com' }
    ],
    stages: [
      { name: 'The terminal', mode: 'plan', days: 100, crews: 2, endEarly: true, goal: [{ k: 'project', id: 'intlTerminal' }] },
      { name: 'Morning wave', mode: 'ops', date: '1976-06-14', from: '07:00', to: '10:00', weather: { temp: 16, wind: [200, 9] }, desks: 6,
        events: [{ at: '08:40', do: 'emergency' }, { at: '09:10', do: 'fail', dom: 'baggage', min: 35 }],
        flights: [FL('SK', 'B747', 1, '07:40', '07:40', 125, { base: 900, load: 0.7 }), FL('SK', 'DC8', 2, '07:20', '09:00', 65, { base: 950 }),
          FL('SK', 'DC9', 8, '07:05', '09:35', 40, { base: 400 }), FL('LH', 'B727', 2, '07:30', '09:10', 50, { base: 3020 }),
          FL('AY', 'DC9', 2, '07:50', '09:20', 45, { base: 800 })],
        goal: [{ k: 'onTime', p: 0.8 }, { k: 'lost', max: 0 }] },
      { name: 'Evening gale', mode: 'ops', from: '16:00', to: '19:00', weather: { temp: 14, wind: [260, 27] }, desks: 6,
        flights: [FL('SK', 'B747', 1, '16:30', '16:30', 125, { base: 910, load: 0.7 }), FL('SK', 'DC8', 2, '16:20', '18:00', 65, { base: 960 }),
          FL('SK', 'DC9', 8, '16:05', '18:35', 40, { base: 420 }), FL('LH', 'B727', 1, '16:50', '16:50', 50, { base: 3030 }),
          FL('STERLING', 'B727', 2, '17:00', '18:00', 55, { load: 0.92, base: 500 })],
        goal: [{ k: 'onTime', p: 0.8 }, { k: 'lost', max: 0 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 2 }, { k: 'passengers', min: 72 }],
    paper: { head: 'THE WORLD LANDS AT ARLANDA',
      text: 'Jumbos, Lufthansa, Finnair and the charters to the sun — the new international terminal took them all on its first summer day. "The teams did the work; I just had to choose them well," says the director.' }
  }
]);
