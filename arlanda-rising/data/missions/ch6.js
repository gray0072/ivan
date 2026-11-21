'use strict';

// Arlanda Rising — chapter 6, Bigger and Greener (2010–2018): Swedavia as the new owner, the ash cloud that closed the
// sky, a royal wedding, self bag drop, Emirates and its Boeing 777, the environmental permit and the green rating (energy,
// the aquifer, the solar park, electric vehicles, biofuel, glycol recovery), Nobel week and Eurovision week as peaks,
// A-CDM, and as the exam the record summer of 2018. See data/missions/missions.js for the fields. The history the
// briefings tell is checked (`facts` with the source); the flights of a day, the guests, the deals and the people are the
// game's own.

const SRC_SV6 = 'swedavia.com About the airport; sv.wikipedia Stockholm-Arlanda flygplats';
const BUILT_2010 = BUILT_2006.concat(['aquifer']);
const BUILT_2018 = BUILT_2010.concat(['gateF', 'oldHall']);
const ITEMS_2010 = Object.assign({}, ITEMS_2000, { deicer: 3, crashTender: 3 });
const TEAMS_2010 = Object.assign({}, TEAMS_2005, { security: 2 });
const TERMS_2010 = Object.assign({}, TERMS_2001, { DY: 't2' });

const F6 = (al, type, n, from, to, turn, extra) => Object.assign({ al, type, n, from, to, turn, load: 0.8 }, extra || {});

const ROUTES_2010 = {
  SK: [{ type: 'B736', perDay: 14, load: 0.72 }, { type: 'A321', perDay: 6, load: 0.76 }, { type: 'B738', perDay: 6, load: 0.75 },
    { type: 'CRJ9', perDay: 6, load: 0.72 }, { type: 'A333', perDay: 2, load: 0.82 }],
  DY: [{ type: 'B738', perDay: 10, load: 0.8 }], LH: [{ type: 'A320', perDay: 5, load: 0.74 }], AY: [{ type: 'A320', perDay: 5, load: 0.74 }],
  BA: [{ type: 'A320', perDay: 4, load: 0.76 }], QR: [{ type: 'A319', perDay: 1, load: 0.8 }],
  NOVAIR: [{ type: 'A321', perDay: 2, load: 0.92, months: [6, 7, 8, 12] }], BRAATHENS: []
};
const ROUTES_2013 = Object.assign({}, ROUTES_2010, {
  SK: [{ type: 'B736', perDay: 12, load: 0.74 }, { type: 'A321', perDay: 8, load: 0.78 }, { type: 'B738', perDay: 8, load: 0.77 },
    { type: 'CRJ9', perDay: 6, load: 0.74 }, { type: 'A333', perDay: 2, load: 0.84 }],
  DY: [{ type: 'B738', perDay: 14, load: 0.82 }]
});
const ROUTES_2016 = Object.assign({}, ROUTES_2013, {
  SK: [{ type: 'B736', perDay: 10, load: 0.76 }, { type: 'A321', perDay: 10, load: 0.8 }, { type: 'B738', perDay: 10, load: 0.78 },
    { type: 'CRJ9', perDay: 8, load: 0.76 }, { type: 'A333', perDay: 3, load: 0.85 }],
  DY: [{ type: 'B738', perDay: 16, load: 0.84 }, { type: 'B789', perDay: 1, load: 0.86 }], AY: [{ type: 'A321', perDay: 5, load: 0.76 }]
});

addMissions(6, [
  {
    name: 'Swedavia', kind: 'business', date: '2010-04-01', requires: BUILT_2010,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: ROUTES_2010, domains: TEAMS_2010, it: 8,
      terms: TERMS_2010, booths: 8, secRule: 2, events: true, owner: 'Swedavia', green: true },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'From today Arlanda has a new owner. The state has split Luftfartsverket in two: the air traffic control stays, and a new company, Swedavia, runs the airports.',
      'Swedavia wants a profit every year — and an airport that does less harm to the climate. From now on you see the airport\'s green rating, and every month you pay for its energy.',
      'The aquifer under the esker has heated and cooled the terminals since last summer. Look at the green rating in the Office, then run a spring morning in the new colours.'
    ],
    aim: 'Start Swedavia\'s first month well: decide on the colours and the fees, then run a spring morning.',
    news: [
      { icon: '🏢', text: 'Swedavia: the new owner of Arlanda and the other state airports.' },
      { icon: '🌿', text: 'The green rating: the train, the coaches, the aquifer, solar power, biofuel and clean glycol raise it; big car parks lower it.' },
      { icon: '🔥', text: 'Energy: heating and power cost every month, most in winter. The aquifer saves a fifth.' }
    ],
    facts: [
      { text: 'Swedavia took over the state airports on 1 April 2010, when Luftfartsverket was split in two.', src: 'Swedavia annual report 2010; prop. 2009/10:16' },
      { text: 'The aquifer under the esker has been in use since the summer of 2009: about 600 000 cubic metres of water store heat and cold, and save about 19 GWh a year.', src: 'swedavia.com The aquifer' },
      { text: 'Arlanda joined Airport Carbon Accreditation when it started in 2009, at its highest level then.', src: SRC_SV6 }
    ],
    stages: [
      { name: 'The first days', mode: 'plan', days: 12, goal: [],
        choices: [
          { id: 'colours', at: 2, default: 'later', icon: '🎨', title: 'Swedavia\'s colours',
            text: 'New signs, new uniforms, new paint on the vehicles. It costs money, and the staff would be proud of it.',
            options: [
              { id: 'now', money: -20e6, meters: { staff: 4, passengers: 2 }, label: 'Everything at once' },
              { id: 'later', label: 'Bit by bit, as things wear out' }
            ] },
          { id: 'returnTarget', at: 6, default: 'wait', icon: '📈', title: 'The owner\'s target',
            text: 'Swedavia\'s board asks for a better return. Higher fees would bring it at once; the airlines would not be pleased.',
            options: [
              { id: 'high', fees: 'high', flag: 'targetSet', label: 'Higher fees' },
              { id: 'normal', fees: 'normal', flag: 'targetSet', meters: { airlines: 2 }, label: 'The fees as they are, more flights instead' },
              { id: 'wait', label: 'Ask the board for time' }
            ] }] },
      { name: 'A spring morning', mode: 'ops', date: '2010-04-12', from: '07:00', to: '10:00', weather: { temp: 4, wind: [200, 9] }, desks: 18, lanes: 6, booths: 2,
        flights: [F6('SK', 'B736', 9, '07:05', '09:20', 42, { base: 100, intl: false }), F6('SK', 'A321', 5, '07:10', '09:30', 52, { base: 300 }),
          F6('SK', 'CRJ9', 4, '07:10', '09:10', 35, { base: 600, intl: false }), F6('DY', 'B738', 7, '07:05', '09:25', 46, { base: 400 }),
          F6('LH', 'A320', 3, '07:30', '09:20', 50, { base: 3020 }), F6('AY', 'A320', 3, '07:25', '09:25', 50, { base: 800 }),
          F6('BA', 'A320', 2, '07:40', '08:40', 50, { base: 770 }), F6('SK', 'A333', 1, '07:50', '07:50', 110, { base: 900, ns: true })],
        goal: [{ k: 'onTime', p: 0.8 }, { k: 'checkinWait', max: 6 }] }
    ],
    goal: [{ k: 'owner', id: 'Swedavia' }, { k: 'flag', id: 'targetSet' }],
    stars: [{ k: 'staff', min: 67 }, { k: 'passengers', min: 92 }]
  },
  {
    name: 'The Ash Cloud', kind: 'crisis', date: '2010-04-15', requires: BUILT_2010,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: ROUTES_2010, domains: TEAMS_2010, it: 8,
      terms: TERMS_2010, booths: 8, secRule: 2, owner: 'Swedavia', green: true },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'A volcano under a glacier in Iceland is erupting, and its ash is drifting over Europe. Ash in a jet engine can stop it.',
      'Tonight the whole Swedish airspace closes. Get away whoever you can before nine — then look after the thousands who cannot fly home.',
      'Nobody knows how many days it will last.'
    ],
    aim: 'Get the last flights away before the sky closes, look after the stranded passengers, and restart the airport.',
    news: [
      { icon: '🌋', text: 'The ash cloud: the airspace closes. Flights that cannot leave are cancelled.' },
      { icon: '🛏️', text: 'Stranded passengers: cots, food and hotels cost money — and are remembered.' }
    ],
    facts: [
      { text: 'Because of the ash from Eyjafjallajökull, all Swedish airspace closed at 20:00 UTC on Thursday 15 April 2010. Arlanda opened for flights to the north and west on 19 April, closed again on the evening of the 20th, and the airports reopened step by step from 21 April.', src: 'Sveriges Radio, Arlanda Airport Closes Again (2010); Transportstyrelsen' }
    ],
    stages: [
      { name: 'Before the sky closes', mode: 'ops', date: '2010-04-15', from: '18:30', to: '21:30', weather: { temp: 5, wind: [250, 7] }, desks: 24, lanes: 10, booths: 4, calm: true,
        events: [{ at: '21:00', do: 'ash', text: 'The airspace over Sweden is closed. Nothing may take off or land.' }],
        flights: [F6('SK', 'B736', 8, '18:35', '20:40', 42, { base: 100, intl: false }), F6('SK', 'A321', 5, '18:40', '20:50', 52, { base: 300 }),
          F6('DY', 'B738', 6, '18:35', '20:55', 46, { base: 400 }), F6('LH', 'A320', 2, '19:00', '20:20', 50, { base: 3020 }),
          F6('AY', 'A320', 2, '19:10', '20:30', 50, { base: 800 }), F6('BA', 'A320', 2, '19:20', '20:10', 50, { base: 770 }),
          F6('SK', 'CRJ9', 4, '18:40', '20:40', 35, { base: 600, intl: false })],
        goal: [{ k: 'onTime', p: 0.7 }] },
      { name: 'Days without flights', mode: 'plan', days: 5, skyClosed: 5, goal: [],
        choices: [
          { id: 'stranded', at: 0, default: 'none', icon: '🛏️', title: 'Thousands are stranded',
            text: 'Travellers are sleeping on the floors. Camp beds and food in the terminal? Hotel rooms for everyone who cannot go home? Or let the airlines sort it out?',
            options: [
              { id: 'cots', stranded: 6e6, flag: 'strandedHelped', meters: { passengers: 8 }, label: 'Camp beds and food' },
              { id: 'hotels', stranded: 22e6, flag: 'strandedHelped', meters: { passengers: 14, airlines: 3 }, label: 'Hotel rooms and buses' },
              { id: 'none', meters: { passengers: -12 }, label: 'It is the airlines\' job' }
            ] },
          { id: 'shops', at: 2, default: 'closed', icon: '🏪', title: 'The shops at night',
            text: 'The cafés could stay open all night for the people waiting. The staff would be paid overtime.',
            options: [
              { id: 'open', money: -2e6, meters: { passengers: 4 }, label: 'Open all night' },
              { id: 'closed', label: 'The usual hours' }
            ] }] },
      { name: 'The sky opens', mode: 'ops', date: '2010-04-21', from: '07:00', to: '10:00', weather: { temp: 7, wind: [200, 6] }, desks: 16, lanes: 6, booths: 2,
        flights: [F6('SK', 'B736', 10, '07:05', '09:20', 42, { base: 200, intl: false, load: 0.98 }), F6('SK', 'A321', 6, '07:10', '09:30', 52, { base: 400, load: 0.98 }),
          F6('DY', 'B738', 8, '07:05', '09:25', 46, { base: 500, load: 0.98 }), F6('LH', 'A320', 3, '07:30', '09:20', 50, { base: 3030, load: 0.98 }),
          F6('AY', 'A320', 3, '07:25', '09:25', 50, { base: 810, load: 0.98 }), F6('BA', 'A320', 2, '07:40', '08:40', 50, { base: 780, load: 0.98 }),
          F6('SK', 'A333', 1, '07:50', '07:50', 110, { base: 910, ns: true, load: 0.98 })],
        goal: [{ k: 'checkinWait', max: 6 }] }
    ],
    goal: [{ k: 'passengers', min: 75 }],
    stars: [{ k: 'flag', id: 'strandedHelped' }, { k: 'checkinWait', max: 3 }]
  },
  {
    name: 'A Royal Wedding', kind: 'operate', date: '2010-05-17', requires: BUILT_2010,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: ROUTES_2010, domains: TEAMS_2010, it: 8,
      terms: TERMS_2010, booths: 8, secRule: 2, owner: 'Swedavia', green: true, events: true },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'Crown Princess Victoria marries on the 19th of June. Kings, queens and presidents fly in for it, many in their own aircraft.',
      'Each guest\'s aircraft needs a stand of its own for days, and a quiet way through the border. The ordinary summer traffic does not stop for them.',
      'Plan the stands in May, then meet the guests on the 17th.'
    ],
    aim: 'Make room for the wedding guests\' aircraft and welcome them without delaying anybody else.',
    news: [
      { icon: '👑', text: 'State visits: a VIP aircraft keeps its stand by the terminal for hours.' }
    ],
    facts: [
      { text: 'Crown Princess Victoria and Daniel Westling were married in Stockholm Cathedral on 19 June 2010; guests from abroad arrived from the 17th.', src: 'en.wikipedia Wedding of Victoria, Crown Princess of Sweden, and Daniel Westling' }
    ],
    stages: [
      { name: 'Planning the stands', mode: 'plan', days: 25, goal: [],
        choices: [{ id: 'guestStands', at: 2, default: 'later', icon: '🅿️', title: 'Where do the guests\' aircraft stand?',
          text: 'The guests\' aircraft will stay until after the wedding. Two new remote stands would keep them off the gates; or they can have stands by the terminal, as guests of honour.',
          options: [
            { id: 'remote', build: ['stand', 'stand'], flag: 'guestsPlanned', label: 'Two new remote stands' },
            { id: 'pier', flag: 'guestsPlanned', meters: { airlines: -2 }, label: 'Stands by the terminal' },
            { id: 'later', label: 'Decide on the day' }
          ] }] },
      { name: 'The guests arrive', mode: 'ops', date: '2010-06-17', from: '12:00', to: '15:00', weather: { temp: 19, wind: [230, 8] }, desks: 20, lanes: 8, booths: 3, calm: true,
        events: [{ at: '12:30', do: 'vipStand', min: 120, text: 'A head of state\'s aircraft is on its way: a stand by the terminal is kept for it.' },
          { at: '13:10', do: 'vipStand', min: 110, text: 'Another royal guest: one more stand is kept.' }],
        flights: [F6('VIP', 'G550', 9, '12:20', '14:20', 240, { base: 1, load: 0.6, stay: true }), F6('VIP', 'A319', 2, '12:40', '13:40', 240, { base: 11, load: 0.5, stay: true }),
          F6('SK', 'B736', 8, '12:05', '14:20', 42, { base: 100, intl: false }), F6('SK', 'A321', 5, '12:10', '14:30', 52, { base: 300 }),
          F6('DY', 'B738', 7, '12:05', '14:25', 46, { base: 400 }), F6('LH', 'A320', 3, '12:30', '14:20', 50, { base: 3020 }),
          F6('AY', 'A320', 3, '12:25', '14:25', 50, { base: 800 }), F6('BA', 'A320', 2, '12:40', '13:40', 50, { base: 770 }),
          F6('NOVAIR', 'A321', 2, '12:30', '13:30', 60, { base: 700, ns: true })],
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.8 }] }
    ],
    goal: [{ k: 'flag', id: 'guestsPlanned' }],
    stars: [{ k: 'airportDelay', max: 3 }, { k: 'passengers', min: 88 }]
  },
  {
    name: 'Self Bag Drop', kind: 'operate', date: '2012-10-01', requires: BUILT_2010,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: ROUTES_2013, domains: TEAMS_2010, it: 8,
      terms: TERMS_2010, booths: 8, secRule: 2, owner: 'Swedavia', green: true, events: true, unlock: { checkin: 3 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'More people fly every year, and the check-in hall is full every morning. Most passengers already have their boarding pass on the phone.',
      'With self bag drop they tag their own bags and drop them on a belt in a minute. It needs the IT department, and fewer people at the desks.',
      'A busy morning first; then decide what to do with the desk staff it frees.'
    ],
    aim: 'Shorten the check-in queue with self bag drop, and decide what happens to the desk staff.',
    news: [
      { icon: '🏷️', text: 'Self bag drop: the third level of check-in. Each desk checks in many more passengers.' }
    ],
    facts: [
      { text: 'Sweden\'s first self bag drop opened in Terminal 5 at Arlanda on 10 October 2012, shared by the airlines; SAS and Norwegian were the first to use it.', src: 'Future Travel Experience, October 2012' }
    ],
    stages: [
      { name: 'A full hall', mode: 'ops', date: '2012-10-01', from: '06:00', to: '09:00', weather: { temp: 8, wind: [210, 9] }, desks: 16, lanes: 8, booths: 3,
        flights: [F6('SK', 'B736', 9, '06:05', '08:20', 42, { base: 100, intl: false, load: 0.88 }), F6('SK', 'A321', 7, '06:10', '08:30', 52, { base: 300, load: 0.88 }),
          F6('SK', 'B738', 5, '06:10', '08:25', 46, { base: 450, load: 0.88 }), F6('DY', 'B738', 8, '06:05', '08:25', 46, { base: 400, load: 0.9 }),
          F6('LH', 'A320', 3, '06:30', '08:20', 50, { base: 3020 }), F6('AY', 'A320', 3, '06:25', '08:25', 50, { base: 800 }),
          F6('BA', 'A320', 2, '06:40', '07:40', 50, { base: 770 })],
        goal: [{ k: 'onTime', p: 0.75 }] },
      { name: 'The bag drop', mode: 'plan', days: 40, goal: [{ k: 'level', dom: 'checkin', min: 3 }] },
      { name: 'With the bag drop', mode: 'ops', date: '2012-11-19', from: '06:00', to: '09:00', weather: { temp: 1, wind: [200, 8] }, desks: 16, lanes: 8, booths: 3,
        flights: [F6('SK', 'B736', 9, '06:05', '08:20', 42, { base: 200, intl: false, load: 0.88 }), F6('SK', 'A321', 7, '06:10', '08:30', 52, { base: 400, load: 0.88 }),
          F6('SK', 'B738', 5, '06:10', '08:25', 46, { base: 460, load: 0.88 }), F6('DY', 'B738', 8, '06:05', '08:25', 46, { base: 500, load: 0.9 }),
          F6('LH', 'A320', 3, '06:30', '08:20', 50, { base: 3030 }), F6('AY', 'A320', 3, '06:25', '08:25', 50, { base: 810 }),
          F6('BA', 'A320', 2, '06:40', '07:40', 50, { base: 780 })],
        goal: [{ k: 'checkinWait', max: 3 }] }
    ],
    goal: [],
    stars: [{ k: 'checkinWait', max: 2.5 }, { k: 'staff', min: 60 }]
  },
  {
    name: 'Emirates', kind: 'choice', date: '2013-06-03', requires: BUILT_2010,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: ROUTES_2013, domains: Object.assign({}, TEAMS_2010, { checkin: 3 }), it: 9,
      terms: TERMS_2010, booths: 8, secRule: 2, owner: 'Swedavia', green: true, events: true },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'Emirates, the great airline of Dubai, would like to fly to Stockholm every day with a Boeing 777 — the first direct flights to the Gulf from here.',
      'It is demanding: a big stand with a jet bridge, a fast way through the border for its passengers, no delays. It also asks for a discount to start.',
      'The 777 needs fire category 9. Make an offer, then meet its first flight in September.'
    ],
    aim: 'Win Emirates\' daily flight with the right offer, and give its first afternoon no reason to complain.',
    news: [
      { icon: '🌍', text: 'Gulf airlines: they pay a lot, they need big contact stands and hate delays.' }
    ],
    facts: [
      { text: 'Emirates began flying Dubai–Stockholm on 5 September 2013 with a Boeing 777.', src: 'swedavia.com, Emirates starts services to Stockholm' },
      { text: 'Qatar Airways had come first, with flights from Doha from 27 November 2007.', src: 'Qatar Airways press release, 28 November 2007' }
    ],
    stages: [
      { name: 'The offer', mode: 'plan', days: 40, goal: [],
        choices: [{ id: 'emirates', at: 3, default: 'none', icon: '🤝', title: 'Emirates asks for a discount',
          text: 'Emirates\' people say a quarter off its fees for two years would decide it. Copenhagen has made an offer too.',
          options: [
            { id: 'tenth', court: { code: 'EK', share: 0.1 }, label: 'A tenth off' },
            { id: 'quarter', court: { code: 'EK', share: 0.25 }, label: 'A quarter off' },
            { id: 'forty', court: { code: 'EK', share: 0.4 }, label: '40 % off, to be sure' },
            { id: 'none', label: 'No offer' }
          ] }] },
      { name: 'The first Emirates afternoon', mode: 'ops', date: '2013-09-05', from: '13:00', to: '16:00', weather: { temp: 17, wind: [220, 8] }, desks: 20, lanes: 8, booths: 3,
        flights: [F6('EK', 'B77W', 1, '13:30', '13:30', 120, { base: 156, load: 0.88, when: ['emirates', 'quarter', 'forty'] }),
          F6('QR', 'A319', 1, '13:50', '13:50', 90, { base: 167 }), F6('SK', 'A333', 1, '13:10', '13:10', 120, { base: 900, ns: true }),
          F6('SK', 'B736', 8, '13:05', '15:20', 42, { base: 100, intl: false }), F6('SK', 'A321', 6, '13:10', '15:30', 52, { base: 300 }),
          F6('DY', 'B738', 8, '13:05', '15:25', 46, { base: 400 }), F6('LH', 'A320', 3, '13:30', '15:20', 50, { base: 3020 }),
          F6('AY', 'A320', 3, '13:25', '15:25', 50, { base: 800 }), F6('BA', 'A320', 2, '13:40', '14:40', 50, { base: 770 })],
        goal: [{ k: 'onTime', p: 0.85 }] }
    ],
    goal: [{ k: 'perDay', code: 'EK', min: 1 }],
    stars: [{ k: 'mood', code: 'EK', min: 78 }, { k: 'borderWait', max: 3 }]
  },
  {
    name: 'The Permit', kind: 'business', date: '2013-11-25', requires: BUILT_2010,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: ROUTES_2013, domains: Object.assign({}, TEAMS_2010, { checkin: 3 }), it: 9,
      terms: TERMS_2010, booths: 8, secRule: 2, owner: 'Swedavia', green: true, permit: { perDay: 110, green: 62, from: '2014-01-15' } },
    hands: [],
    brief: [
      'An airport needs a permit to exist. The court is giving Arlanda a new one: up to 350 000 take-offs and landings a year — and a cap on the carbon dioxide from the airport and from the traffic to and from it.',
      'In the game the permit has two numbers: the flights a day you may have, and the green rating you must keep from the middle of January. Each month above a cap costs a fine, and the neighbours notice.',
      'Find what raises the green rating: solar panels, electric vehicles, fewer car parks — and what pays back.'
    ],
    aim: 'Keep within the new environmental permit for half a year, and raise the green rating.',
    news: [
      { icon: '📜', text: 'The environmental permit: a cap on flights a day and a green rating to keep (Finance and the Office show both).' },
      { icon: '☀️', text: 'A solar park and electric apron vehicles: small builds that raise the green rating.' }
    ],
    facts: [
      { text: 'On 27 November 2013 the Land and Environment Court allowed Arlanda up to 350 000 take-offs and landings a year on three runways. Since 1991 its permit had capped the carbon dioxide from the flights and the traffic to and from the airport — the only airport in the world with such a cap.', src: 'Swedavia, Bilaga 2: gällande tillstånd och villkor; Swedavia 2013' }
    ],
    stages: [
      { name: 'Winter', mode: 'plan', days: 70, goal: [{ k: 'permitOk' }],
        choices: [{ id: 'carPark', at: 6, default: 'no', icon: '🚗', title: 'A new car park',
          text: 'The car parks are full at Christmas. A new car park house would pay back fast — and lower the green rating.',
          options: [
            { id: 'build', build: 'parkingBig', label: 'Build it' },
            { id: 'no', label: 'No: more trains and coaches instead' }
          ] }] },
      { name: 'Spring', mode: 'plan', days: 70, goal: [{ k: 'permitOk' }],
        choices: [{ id: 'newRoutes', at: 5, default: 'no', icon: '✈️', title: 'More flights?',
          text: 'Two airlines ask for six more flights a day between them. They would bring money — and the permit\'s cap is close.',
          options: [
            { id: 'yes', airline: { code: 'DY', routes: [{ type: 'B738', perDay: 4, load: 0.8 }] }, airline2: { code: 'LH', routes: [{ type: 'A320', perDay: 2, load: 0.76 }] }, label: 'Welcome them' },
            { id: 'no', meters: { airlines: -2 }, label: 'Not within this permit' }
          ] }] }
    ],
    goal: [],
    stars: [{ k: 'green', min: 68 }, { k: 'lastMonth', min: 35e6 }]
  },
  {
    name: 'Nobel Week', kind: 'operate', date: '2015-11-23', requires: BUILT_2010,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: ROUTES_2016, domains: Object.assign({}, TEAMS_2010, { checkin: 3 }), it: 9,
      terms: TERMS_2010, booths: 8, secRule: 2, owner: 'Swedavia', green: true, permit: { perDay: 125 }, events: true },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane', 'deice', 'plough'],
    brief: [
      'In December the Nobel laureates come to Stockholm for the prizes on the 10th — with their families, the press and many guests in business jets.',
      'Business jets pay well and want to be quick: a stand, the border, a car. In the December dark, with frost on every wing.',
      'Get ready in the last weeks of November, then the afternoon of the arrivals.'
    ],
    aim: 'Welcome the Nobel guests on a frosty December afternoon without a single flight lost.',
    news: [
      { icon: '🏅', text: 'Event peaks: a week of extra flights, most of them small and in a hurry.' }
    ],
    facts: [
      { text: 'The Nobel Prizes are handed out in Stockholm on 10 December, the day Alfred Nobel died in 1896.', src: 'nobelprize.org' }
    ],
    stages: [
      { name: 'Getting ready', mode: 'plan', days: 14, goal: [],
        choices: [{ id: 'jets', at: 3, default: 'none', icon: '🛩️', title: 'A place for the business jets',
          text: 'A handling company offers to open a small lounge and a fast lane for the business jets\' passengers, if the airport gives it a unit at the kerb.',
          options: [
            { id: 'lounge', money: -4e6, booths: 2, flag: 'jetsReady', meters: { airlines: 2 }, label: 'Two more booths and the lounge' },
            { id: 'apron', build: ['stand', 'stand'], flag: 'jetsReady', label: 'Two remote stands just for the jets' },
            { id: 'none', label: 'They go through like everybody else' }
          ] }] },
      { name: 'The guests\' afternoon', mode: 'ops', date: '2015-12-08', from: '13:00', to: '16:00', weather: { temp: -5, wind: [20, 7], snow: [['14:00', '14:50', 1.2]] },
        desks: 20, lanes: 8, booths: 2, calm: true,
        flights: [F6('VIP', 'G550', 8, '13:10', '15:10', 120, { base: 21, load: 0.6, stay: true }), F6('SK', 'B736', 8, '13:05', '15:20', 42, { base: 100, intl: false }),
          F6('SK', 'A321', 6, '13:10', '15:30', 52, { base: 300 }), F6('DY', 'B738', 8, '13:05', '15:25', 46, { base: 400 }),
          F6('LH', 'A320', 3, '13:30', '15:20', 50, { base: 3020 }), F6('BA', 'A320', 2, '13:40', '14:40', 50, { base: 770 }),
          F6('SK', 'A333', 1, '13:20', '13:20', 120, { base: 900, ns: true })],
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.8 }] }
    ],
    goal: [{ k: 'flag', id: 'jetsReady' }],
    stars: [{ k: 'airportDelay', max: 3 }, { k: 'borderWait', max: 3 }]
  },
  {
    name: 'Eurovision Week', kind: 'operate', date: '2016-04-25', requires: BUILT_2010,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: ROUTES_2016, domains: Object.assign({}, TEAMS_2010, { checkin: 3 }), it: 9,
      terms: TERMS_2010, booths: 8, secRule: 2, owner: 'Swedavia', green: true, permit: { perDay: 125 }, events: true },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'Stockholm hosts the Eurovision Song Contest in May. Fans from all over Europe fly in with flags and glitter — and they want to shop and eat on the way.',
      'Two weeks to get ready: more security lanes, pop-up shops in the free units, or both?',
      'Then the Friday before the final.'
    ],
    aim: 'Get ready for the Eurovision crowds, then run the Friday before the final with short queues.',
    news: [
      { icon: '🎤', text: 'Fans in crowds: more passengers at once, and they love the shops.' }
    ],
    facts: [
      { text: 'The Eurovision Song Contest 2016 was held at the Globe Arena in Stockholm: semi-finals on 10 and 12 May, the final on 14 May.', src: 'en.wikipedia Eurovision Song Contest 2016' }
    ],
    stages: [
      { name: 'Two weeks', mode: 'plan', days: 14, goal: [],
        choices: [{ id: 'fans', at: 3, default: 'none', icon: '🎤', title: 'Ready for the fans',
          text: 'Four more security lanes for the week, or a pop-up of a Swedish favourite in the free unit by the gates?',
          options: [
            { id: 'lanes', lanes: 4, label: 'Four more lanes' },
            { id: 'shop', brand: { term: 'intl', id: 'lego' }, label: 'A LEGO pop-up by the gates' },
            { id: 'none', label: 'Neither' }
          ] }] },
      { name: 'The Friday before the final', mode: 'ops', date: '2016-05-13', from: '14:00', to: '17:00', weather: { temp: 16, wind: [210, 8] }, desks: 20, lanes: 8, booths: 3,
        flights: [F6('SK', 'B736', 8, '14:05', '16:20', 42, { base: 100, intl: false, load: 0.95 }), F6('SK', 'A321', 7, '14:10', '16:30', 52, { base: 300, load: 0.95 }),
          F6('DY', 'B738', 10, '14:05', '16:25', 46, { base: 400, load: 0.97 }), F6('LH', 'A320', 3, '14:30', '16:20', 50, { base: 3020, load: 0.95 }),
          F6('AY', 'A321', 3, '14:25', '16:25', 52, { base: 800, load: 0.95 }), F6('BA', 'A320', 3, '14:40', '16:10', 50, { base: 770, load: 0.95 }),
          F6('SK', 'B738', 5, '14:10', '16:25', 46, { base: 450, load: 0.95 })],
        goal: [{ k: 'securityWait', max: 6 }] }
    ],
    goal: [],
    stars: [{ k: 'securityWait', max: 3.5 }, { k: 'brandsIn', min: 150000 }]
  },
  {
    name: 'Fly Green', kind: 'business', date: '2017-01-05', requires: BUILT_2010,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: ROUTES_2016, domains: Object.assign({}, TEAMS_2010, { checkin: 3 }), it: 9,
      terms: TERMS_2010, booths: 8, secRule: 2, owner: 'Swedavia', green: true, permit: { perDay: 125 }, unlock: { deice: 3 } },
    hands: [],
    brief: [
      'This morning an airliner at Arlanda was filled with fuel made from waste instead of oil. Swedavia has bought enough of it for all its own staff\'s flights of last year.',
      'Biofuel costs more than oil, and the airport pays the difference. And the glycol washed off the aircraft in winter could be caught, cleaned and used again.',
      'Raise the green rating — and see which of the green investments the books can carry.'
    ],
    aim: 'Raise the green rating with biofuel, glycol recovery and the airport\'s own changes, and keep the books healthy.',
    news: [
      { icon: '🌱', text: 'Biofuel: the airport pays for a share of the fuel to be made from waste. The green rating rises with the share.' },
      { icon: '♻️', text: 'Glycol recovery: the fourth level of de-icing. A third less fluid to buy.' }
    ],
    facts: [
      { text: 'Swedavia bought 450 tonnes of bio-jet fuel, as much as its staff\'s business flights of 2016 used; the first aircraft was fuelled with it at Arlanda on 5 January 2017. Swedavia had joined the Fly Green Fund at its start in 2014.', src: 'Swedavia newsroom, January 2017; ICAO, Fly Green Fund' }
    ],
    stages: [
      { name: 'Winter', mode: 'plan', days: 60, goal: [],
        choices: [{ id: 'bio', at: 2, default: 'none', icon: '🌱', title: 'A share of biofuel',
          text: 'How much of the airlines\' fuel should be bio, with the airport paying the extra? Each share costs every month.',
          options: [
            { id: 'five', biofuel: 0.05, label: '5 %' },
            { id: 'ten', biofuel: 0.1, label: '10 %' },
            { id: 'none', label: 'Not yet' }
          ] }] },
      { name: 'Spring', mode: 'plan', days: 60, goal: [{ k: 'green', min: 78 }] }
    ],
    goal: [],
    stars: [{ k: 'green', min: 86 }, { k: 'lastMonth', min: 55e6 }]
  },
  {
    name: 'A-CDM', kind: 'build', date: '2017-04-03', requires: BUILT_2010,
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: ROUTES_2016, domains: Object.assign({}, TEAMS_2010, { checkin: 3 }), it: 9,
      terms: TERMS_2010, booths: 8, secRule: 2, owner: 'Swedavia', green: true, permit: { perDay: 125 }, events: true, unlock: { stands: 3 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'Every morning the aircraft queue at the runway with their engines running, because each one pushed back when it was ready, all at once.',
      'With A-CDM the airport, the airlines, the handlers and the tower share their times: each aircraft is given its moment to start up, and taxis straight onto the runway.',
      'First a morning without it. Then put it in — it needs IT people — and run the June peak.'
    ],
    aim: 'Put in A-CDM and cut the delays of the morning peak.',
    news: [
      { icon: '🔗', text: 'A-CDM: the stands\' fourth level. Shared times, start-up in sequence, shorter taxiing out.' }
    ],
    facts: [
      { text: 'Arlanda became a full A-CDM airport, linked to Eurocontrol\'s network, on 8 June 2017.', src: 'swedavia.net Arlanda, CDM' }
    ],
    stages: [
      { name: 'A morning in April', mode: 'ops', date: '2017-04-03', from: '06:30', to: '09:30', weather: { temp: 3, wind: [190, 9] }, desks: 24, lanes: 10, booths: 4,
        flights: [F6('SK', 'B736', 9, '06:35', '08:50', 42, { base: 100, intl: false }), F6('SK', 'A321', 8, '06:40', '09:00', 52, { base: 300 }),
          F6('SK', 'B738', 7, '06:40', '08:55', 46, { base: 450 }), F6('DY', 'B738', 10, '06:35', '08:55', 46, { base: 400 }),
          F6('SK', 'CRJ9', 6, '06:40', '08:40', 35, { base: 600, intl: false }), F6('LH', 'A320', 3, '07:00', '08:50', 50, { base: 3020 }),
          F6('AY', 'A321', 3, '06:55', '08:55', 52, { base: 800 }), F6('BA', 'A320', 2, '07:10', '08:10', 50, { base: 770 })],
        goal: [{ k: 'onTime', p: 0.7 }] },
      { name: 'Putting it in', mode: 'plan', days: 60, endEarly: true, goal: [{ k: 'level', dom: 'stands', min: 3 }] },
      { name: 'The June peak', mode: 'ops', date: '2017-06-08', from: '06:30', to: '09:30', weather: { temp: 14, wind: [200, 8] }, desks: 24, lanes: 10, booths: 4,
        flights: [F6('SK', 'B736', 9, '06:35', '08:50', 42, { base: 200, intl: false }), F6('SK', 'A321', 8, '06:40', '09:00', 52, { base: 400 }),
          F6('SK', 'B738', 7, '06:40', '08:55', 46, { base: 460 }), F6('DY', 'B738', 10, '06:35', '08:55', 46, { base: 500 }),
          F6('SK', 'CRJ9', 6, '06:40', '08:40', 35, { base: 650, intl: false }), F6('LH', 'A320', 3, '07:00', '08:50', 50, { base: 3030 }),
          F6('AY', 'A321', 3, '06:55', '08:55', 52, { base: 810 }), F6('BA', 'A320', 2, '07:10', '08:10', 50, { base: 780 })],
        goal: [{ k: 'airportDelay', max: 4 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 3 }, { k: 'onTime', p: 0.9 }]
  },
  {
    name: 'Exam: Record Summer', kind: 'exam', date: '2018-01-15', requires: BUILT_2010.concat(['oldHall']),
    setup: { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 16, items: ITEMS_2010, desks: 40, airlines: Object.assign({}, ROUTES_2016, { EK: [{ type: 'B77W', perDay: 1, load: 0.86 }] }),
      domains: Object.assign({}, TEAMS_2010, { checkin: 3, stands: 3 }), it: 10, terms: TERMS_2010, booths: 8, secRule: 2, owner: 'Swedavia', green: true, permit: { perDay: 135 },
      events: true, projects: ['gateF'], unlock: { border: 2 } },
    hands: ['stand', 'checkin', 'fuel', 'bags', 'announce', 'booth', 'lane'],
    brief: [
      'This will be the busiest year Arlanda has ever had. Before the summer: a gate for the biggest aircraft in the world? Machines at the border that read passports by themselves?',
      'Then two days of the record summer: a morning and an evening wave, every gate full, every lane open, and whatever the summer brings.',
      'Everything you learnt in this chapter.'
    ],
    aim: 'Prepare the airport for the record summer, then run its busiest morning and evening.',
    news: [
      { icon: '🎓', text: 'The exam: everything of the chapter.' },
      { icon: '🛂', text: 'e-gates: the border\'s second level — the passports are read by machines.' }
    ],
    facts: [
      { text: 'In January 2018 a new gate at Pier F opened for the Airbus A380, with a second bridge over the wing so that more than 500 passengers can board in 35 minutes.', src: 'newstodate.aero, January 2018' },
      { text: 'Arlanda had 26.8 million passengers in 2018 — its record.', src: 'en.wikipedia Stockholm Arlanda Airport (traffic by year, from Swedavia)' },
      { text: 'Flygskam, flight shame, was one of the new Swedish words of 2018.', src: 'Språkrådet, Nyordslistan 2018 (SVT)' },
      { text: 'In 2017 Arlanda\'s first international hall of 1962 — later the domestic hall, then offices and storage — was torn down to make room as the airport grew.', src: 'Flygtorget, Nu försvinner Arlanda Utrikes (13 April 2017)' }
    ],
    stages: [
      { name: 'Before the summer', mode: 'plan', days: 50, crews: 2, goal: [],
        choices: [{ id: 'egates', at: 4, default: 'no', icon: '🛂', title: 'e-gates at the border',
          text: 'Machines that read a passport and look at the face would let most passengers through in seconds. The police like the idea.',
          options: [
            { id: 'yes', system: { dom: 'border', how: 'keep' }, label: 'Buy them' },
            { id: 'no', label: 'The booths will do' }
          ] }] },
      { name: 'The record morning', mode: 'ops', date: '2018-07-02', from: '06:00', to: '08:45', weather: { temp: 17, wind: [210, 8] }, desks: 24, lanes: 8, booths: 3,
        flights: [F6('SK', 'B736', 8, '06:05', '08:20', 42, { base: 100, intl: false, load: 0.92 }), F6('SK', 'A321', 8, '06:10', '08:30', 52, { base: 300, load: 0.92 }),
          F6('SK', 'B738', 6, '06:10', '08:25', 46, { base: 450, load: 0.92 }), F6('DY', 'B738', 10, '06:05', '08:25', 46, { base: 400, load: 0.95 }),
          F6('NOVAIR', 'A321', 2, '06:20', '07:00', 60, { base: 700, load: 0.97, ns: true }), F6('LH', 'A320', 3, '06:30', '08:20', 50, { base: 3020, load: 0.92 }),
          F6('AY', 'A321', 3, '06:25', '08:25', 52, { base: 800, load: 0.92 }), F6('BA', 'A320', 3, '06:40', '08:10', 50, { base: 770, load: 0.92 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'securityWait', max: 7 }, { k: 'checkinWait', max: 4 }] },
      { name: 'The record evening', mode: 'ops', date: '2018-07-06', from: '15:00', to: '17:45', weather: { temp: 24, wind: [230, 9] }, desks: 24, lanes: 8, booths: 3,
        flights: [F6('EK', 'B77W', 1, '15:10', '15:10', 120, { base: 156, load: 0.92 }), F6('QR', 'A319', 1, '15:30', '15:30', 90, { base: 167 }),
          F6('SK', 'A333', 1, '15:20', '15:20', 120, { base: 900, ns: true }), F6('SK', 'B736', 8, '15:05', '17:20', 42, { base: 200, intl: false, load: 0.92 }),
          F6('SK', 'A321', 7, '15:10', '17:30', 52, { base: 400, load: 0.92 }), F6('DY', 'B738', 10, '15:05', '17:25', 46, { base: 500, load: 0.95 }),
          F6('LH', 'A320', 3, '15:30', '17:20', 50, { base: 3030, load: 0.92 }), F6('BA', 'A320', 3, '15:40', '17:10', 50, { base: 780, load: 0.92 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'borderWait', max: 6 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 3 }, { k: 'passengers', min: 85 }],
    paper: { head: 'ARLANDA\'S RECORD YEAR — AND A NEW WORD',
      text: 'Never have so many flown from Arlanda. But this year the Swedes also learnt a new word: flygskam, flight shame. "The more green our airport is, the better it can answer," says the director.' }
  }
]);
