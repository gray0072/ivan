'use strict';

// Arlanda Rising — chapter 8, Arlanda 2040 (2030–2040): the player's own future. Electric regional aircraft and the stands
// that charge them, robots on the apron, self-driving ploughs, a hydrogen airliner, the player's own pier (the real
// Pier G was dropped in November 2026), faces as boarding passes, a heatwave, the night train or the night freighters, the
// busiest day ever — and as the final exam a total blackout, when only the people and their hand skills are left. See
// data/missions/missions.js for the fields. Everything in this chapter is the game's own story: no real company's future
// is told; the aircraft are the game's own types and the future airlines are named by what they fly.

const BUILT_2030 = BUILT_2022;
const ITEMS_2030 = Object.assign({}, ITEMS_2019, { mcharger: 1 });
const TEAMS_2030 = Object.assign({}, TEAMS_2019, { security: 3 });
const ITEMS_2036 = Object.assign({}, ITEMS_2030, { h2depot: 1 });
const BUILT_2036 = BUILT_2030.concat(['pier2040']);

const F8 = (al, type, n, from, to, turn, extra) => Object.assign({ al, type, n, from, to, turn, load: 0.85 }, extra || {});

const ROUTES_2030 = {
  SK: [{ type: 'A20N', perDay: 16, load: 0.8 }, { type: 'A321', perDay: 8, load: 0.8 }, { type: 'A359', perDay: 2, load: 0.86 }, { type: 'CRJ9', perDay: 6, load: 0.76 }],
  DY: [{ type: 'B38M', perDay: 14, load: 0.85 }], LH: [{ type: 'A20N', perDay: 5, load: 0.78 }], AY: [{ type: 'A321', perDay: 5, load: 0.78 }],
  BA: [{ type: 'A320', perDay: 4, load: 0.78 }], EK: [{ type: 'B77W', perDay: 1, load: 0.88 }], QR: [{ type: 'A359', perDay: 1, load: 0.85 }],
  NOVAIR: [{ type: 'A321', perDay: 2, load: 0.92, months: [6, 7, 8, 12] }],
  DHL: [{ type: 'B76F', perDay: 1, load: 0.8 }], UPS: [{ type: 'B76F', perDay: 1, load: 0.8 }],
  ELECTRIC: [{ type: 'EL30', perDay: 6, load: 0.8 }]
};
const ROUTES_2035 = Object.assign({}, ROUTES_2030, { ELECTRIC: [{ type: 'EL30', perDay: 12, load: 0.82 }], DY: [{ type: 'B38M', perDay: 16, load: 0.86 }] });
const ROUTES_2040 = Object.assign({}, ROUTES_2035, { ELECTRIC: [{ type: 'EL30', perDay: 18, load: 0.85 }], HYDRO: [{ type: 'H2P', perDay: 2, load: 0.8 }],
  SK: [{ type: 'A20N', perDay: 18, load: 0.82 }, { type: 'A321', perDay: 10, load: 0.82 }, { type: 'A359', perDay: 3, load: 0.86 }] });
const SETUP_8 = { open: true, openSkies: true, minMoney: 300e6, units: true, lanes: 24, items: ITEMS_2030, desks: 40, domains: TEAMS_2030, it: 14,
  terms: TERMS_2019, booths: 10, secRule: 2, owner: 'Swedavia', green: true, permit: { perDay: 170 }, events: true, cyber: true, demand: 1,
  unmothball: ['t3'] };   // Terminal 3 open again since October 2024, its gates part of Terminal 2 since the end of 2026
const S8 = (extra) => Object.assign({}, SETUP_8, extra);
const HANDS_8 = ['stand', 'checkin', 'fuel', 'charge', 'bags', 'announce', 'booth', 'lane'];
// the ordinary traffic of a morning in the 2030s
const DAY_8 = (from, base, k) => {
  const f0 = +from.slice(0, 2) * 60 + +from.slice(3), at = (h) => String(Math.floor((f0 + h) / 60)).padStart(2, '0') + ':' + String((f0 + h) % 60).padStart(2, '0');
  return [F8('SK', 'A20N', Math.round(9 * k), at(5), at(140), 45, { base: base + 100, intl: false }), F8('SK', 'A321', Math.round(6 * k), at(10), at(150), 52, { base: base + 300 }),
    F8('DY', 'B38M', Math.round(8 * k), at(5), at(145), 46, { base: base + 400 }), F8('LH', 'A20N', 3, at(30), at(140), 50, { base: base + 3020 }),
    F8('AY', 'A321', 3, at(25), at(145), 52, { base: base + 800 }), F8('BA', 'A320', 2, at(40), at(100), 50, { base: base + 770 })];
};

addMissions(8, [
  {
    name: 'Electric Wings', kind: 'operate', date: '2030-09-02', requires: BUILT_2030,
    setup: S8({ airlines: ROUTES_2030 }),
    hands: HANDS_8,
    brief: [
      'The future has landed: small electric airliners with thirty seats, quiet as a fan, fly to Visby, Örebro and Mariehamn.',
      'They do not need fuel — they need electricity. Until the stands have chargers, a mobile charger drives to each aircraft, and charging takes almost half an hour.',
      'This chapter is your own: nobody knows the Arlanda of 2040. Build it the way you think best.'
    ],
    aim: 'Charge the first electric aircraft on time, and decide how to charge the next ones.',
    news: [
      { icon: '🔋', text: 'Electric aircraft: charged at the stand instead of fuelled. The mobile charger takes one aircraft at a time.' },
      { icon: '🔌', text: 'A charging stand charges an electric aircraft by itself, in half the time.' }
    ],
    facts: [],
    stages: [
      { name: 'The first electric morning', mode: 'ops', date: '2030-09-02', from: '07:00', to: '10:00', weather: { temp: 14, wind: [200, 8] }, desks: 20, lanes: 8, booths: 3,
        flights: [F8('ELECTRIC', 'EL30', 6, '07:05', '09:10', 35, { base: 1 })].concat(DAY_8('07:00', 0, 1)),
        goal: [{ k: 'lost', max: 0 }] },
      { name: 'More chargers', mode: 'plan', days: 20, goal: [],
        choices: [{ id: 'chargers', at: 2, default: 'none', icon: '🔌', title: 'How to charge the electric aircraft?',
          text: 'Two more mobile chargers can go to any stand. A charging stand charges by itself, twice as fast, but only on that stand.',
          options: [
            { id: 'mobile', build: ['mcharger', 'mcharger'], label: 'Two more mobile chargers' },
            { id: 'stands', build: ['charger', 'charger'], label: 'Two charging stands' },
            { id: 'none', label: 'One charger will do' }
          ] }] },
      { name: 'Twice as many', mode: 'ops', date: '2030-10-07', from: '07:00', to: '10:00', weather: { temp: 8, wind: [210, 8] }, desks: 20, lanes: 8, booths: 3,
        flights: [F8('ELECTRIC', 'EL30', 10, '07:05', '09:20', 35, { base: 21 })].concat(DAY_8('07:00', 20, 1)),
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 6 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 4 }, { k: 'passengers', min: 85 }]
  },
  {
    name: 'Charging Stands', kind: 'build', date: '2031-04-07', requires: BUILT_2030,
    setup: S8({ airlines: ROUTES_2030 }),
    hands: HANDS_8,
    brief: [
      'The electric flights are full every day, and the airline wants to fly twice as often — if the airport can charge its aircraft fast.',
      'Charging stands are bought in the toolbar: each one turns a stand near the terminal into a charging stand. They also raise the green rating.',
      'Have at least four by the summer, then run a morning of electric flights.'
    ],
    aim: 'Build at least four charging stands, then run a morning with twice the electric flights.',
    news: [
      { icon: '🔌', text: 'Charging stands in the toolbar: each one also raises the green rating a little.' }
    ],
    facts: [],
    stages: [
      { name: 'The chargers', mode: 'plan', days: 45, endEarly: true, goal: [{ k: 'chargers', min: 4 }],
        choices: [{ id: 'more', at: 3, default: 'no', icon: '⚡', title: 'Twice as many electric flights?',
          text: 'The electric airline would double its flights for a fifth off its fees for two years.',
          options: [
            { id: 'yes', airline: { code: 'ELECTRIC', routes: [{ type: 'EL30', perDay: 6, load: 0.8 }] }, incentive: { code: 'ELECTRIC', share: 0.2 }, label: 'Welcome them' },
            { id: 'no', label: 'Not yet' }
          ] }] },
      { name: 'An electric morning', mode: 'ops', date: '2031-06-09', from: '07:00', to: '10:00', weather: { temp: 17, wind: [200, 8] }, desks: 20, lanes: 8, booths: 3, calm: true,
        flights: [F8('ELECTRIC', 'EL30', 14, '07:05', '09:30', 35, { base: 41 })].concat(DAY_8('07:00', 40, 1)),
        goal: [{ k: 'lost', max: 0 }, { k: 'airportDelay', max: 6 }] }
    ],
    goal: [{ k: 'chargers', min: 4 }],
    stars: [{ k: 'green', min: 96 }, { k: 'airportDelay', max: 3.5 }]
  },
  {
    name: 'Robots on the Apron', kind: 'choice', date: '2033-05-02', requires: BUILT_2030,
    setup: S8({ airlines: ROUTES_2035, chargers: 4, unlock: { turnaround: 2 } }),
    hands: HANDS_8,
    brief: [
      'Robots that drive themselves now tow aircraft, plug in the fuel and the chargers and bring the catering. They never get tired, and a turnaround goes faster.',
      'They need IT people, and they cost a lot every month. And the ramp team: kept beside them as the fallback, or let go?',
      'Then a morning with the robots — and a robot that stops.'
    ],
    aim: 'Put robots on the apron, decide about the ramp team, and keep a morning on time when the robots stop.',
    news: [
      { icon: '🤖', text: 'Apron robots: the turnaround\'s system. They fuel, charge and tow by themselves, and the services go faster.' }
    ],
    facts: [],
    stages: [
      { name: 'The robots come', mode: 'plan', days: 35, goal: [{ k: 'level', dom: 'turnaround', min: 2 }],
        choices: [{ id: 'robots', at: 1, default: 'no', icon: '🤖', title: 'Robots on the apron?',
          text: 'The robots take thirty days to put in. The ramp team could stay as the fallback, retrained, or be laid off.',
          options: [
            { id: 'keep', system: { dom: 'turnaround', how: 'keep' }, it: 3, label: 'Robots, and keep the team' },
            { id: 'layoff', system: { dom: 'turnaround', how: 'layoff' }, it: 3, label: 'Robots, and lay the team off' },
            { id: 'no', label: 'Not yet' }
          ] }] },
      { name: 'A robot morning', mode: 'ops', date: '2033-06-13', from: '07:00', to: '10:00', weather: { temp: 16, wind: [200, 8] }, desks: 20, lanes: 8, booths: 3,
        events: [{ at: '08:00', do: 'fail', dom: 'turnaround', min: 60, text: 'The robots\' control system has stopped: the robots stand still where they are.' }],
        flights: [F8('ELECTRIC', 'EL30', 10, '07:05', '09:20', 35, { base: 61 })].concat(DAY_8('07:00', 60, 1.1)),
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.75 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 4 }, { k: 'staff', min: 60 }]
  },
  {
    name: 'Self-driving Ploughs', kind: 'operate', date: '2034-01-09', requires: BUILT_2030,
    setup: S8({ airlines: ROUTES_2035, chargers: 4, unlock: { snow: 3 }, domains: Object.assign({}, TEAMS_2030, { turnaround: 2 }) }),
    hands: HANDS_8.concat(['plough', 'deice']),
    brief: [
      'A snowstorm is forecast for next week. Ploughs that drive themselves, side by side in a perfect line, would clear a runway in half the time.',
      'They read the runway with sensors — and sensors can ice over. Then the old clearing plan and its drivers must take over.',
      'Decide in the first days, then keep two runways open in the storm.'
    ],
    aim: 'Keep both runways open through a snowstorm, with or without the self-driving ploughs.',
    news: [
      { icon: '🚜', text: 'Self-driving ploughs: the snow\'s fourth level. A convoy clears a runway much faster.' }
    ],
    facts: [],
    stages: [
      { name: 'Before the storm', mode: 'plan', days: 28, goal: [],
        choices: [{ id: 'ploughs', at: 1, default: 'no', icon: '🚜', title: 'Self-driving ploughs?',
          text: 'They take twenty-five days to put in. The drivers stay as the fallback.',
          options: [
            { id: 'yes', system: { dom: 'snow', how: 'keep' }, label: 'Buy them' },
            { id: 'no', label: 'Our drivers are the best in the world' }
          ] }] },
      { name: 'The storm', mode: 'ops', date: '2034-02-06', from: '06:00', to: '09:00', weather: { temp: -7, wind: [30, 10], snow: [['06:10', '08:10', 3.5]] }, desks: 20, lanes: 8, booths: 3,
        events: [{ at: '07:40', do: 'fail', dom: 'snow', min: 40, text: 'Ice on the ploughs\' sensors: they stop, and the drivers take over.' }],
        flights: [F8('ELECTRIC', 'EL30', 8, '06:05', '08:20', 35, { base: 81 })].concat(DAY_8('06:00', 80, 1)),
        goal: [{ k: 'lost', max: 1 }, { k: 'onTime', p: 0.6 }] }
    ],
    goal: [{ k: 'level', dom: 'snow', min: 3 }],
    stars: [{ k: 'closeCalls', max: 0 }, { k: 'onTime', p: 0.85 }]
  },
  {
    name: 'Hydrogen Morning', kind: 'build', date: '2035-08-27', requires: BUILT_2030,
    setup: S8({ airlines: ROUTES_2035, chargers: 4, domains: Object.assign({}, TEAMS_2030, { turnaround: 2 }) }),
    hands: HANDS_8,
    brief: [
      'An airliner that flies on hydrogen and leaves only water behind wants to start test flights to Arlanda — seventy seats, and much further than a battery can fly.',
      'But it can only come where it can take on hydrogen for the way home. A hydrogen depot is big, dear and must be built far from the terminals.',
      'Build it in time, then welcome the first hydrogen flights in October.'
    ],
    aim: 'Build a hydrogen depot, then handle the first hydrogen flights.',
    news: [
      { icon: '💧', text: 'The hydrogen depot: without it, a hydrogen aircraft cannot come. It also raises the green rating.' }
    ],
    facts: [],
    stages: [
      { name: 'The depot', mode: 'plan', days: 45, goal: [{ k: 'built', kind: 'h2depot' }],
        choices: [{ id: 'h2', at: 1, default: 'no', icon: '💧', title: 'A hydrogen depot?',
          text: 'It takes forty days to build, far from the terminals, with its own fire plan.',
          options: [
            { id: 'yes', build: 'h2depot', label: 'Build it' },
            { id: 'no', label: 'Hydrogen is for later' }
          ] }] },
      { name: 'The first hydrogen flights', mode: 'ops', date: '2035-10-08', from: '07:00', to: '10:00', weather: { temp: 7, wind: [210, 8] }, desks: 20, lanes: 8, booths: 3,
        flights: [F8('HYDRO', 'H2P', 2, '07:30', '08:50', 50, { base: 1 }), F8('ELECTRIC', 'EL30', 10, '07:05', '09:20', 35, { base: 101 })].concat(DAY_8('07:00', 100, 1)),
        goal: [{ k: 'lost', max: 0 }] }
    ],
    goal: [],
    stars: [{ k: 'green', min: 98 }, { k: 'airportDelay', max: 3 }]
  },
  {
    name: 'Your Pier', kind: 'build', date: '2036-03-03', requires: BUILT_2030,
    setup: S8({ airlines: ROUTES_2035, items: ITEMS_2036, chargers: 4, budget: 1500e6, loanLimit: 3000e6, domains: Object.assign({}, TEAMS_2030, { turnaround: 2 }) }),
    hands: HANDS_8,
    brief: [
      'Ten years ago Swedavia planned a new pier with fourteen gates — and then dropped it. Now the airport needs room again, and the pier is yours to design.',
      'A finger pier along the old ones is the cheapest. A satellite out on the apron, reached by a tunnel, has the most gates and room for big aircraft. A green pier has a solar roof and a charger at every gate.',
      'Choose the design, then build it before the autumn.'
    ],
    aim: 'Design your own pier and build it.',
    news: [
      { icon: '🏗️', text: 'Your pier: the plot is fixed, the design and the size are yours.' }
    ],
    facts: [
      { text: 'Pier G, with 14 gates and jet bridges, was approved for detailed design in 2025; in November 2026 Swedavia\'s board decided to stop it.', src: 'swedavia.com, Pier G' }
    ],
    stages: [
      { name: 'The design', mode: 'plan', days: 50, goal: [],
        choices: [{ id: 'design', at: 0, default: 'none', icon: '📐', title: 'Which pier?',
          text: 'Finger: 6 gates, the cheapest. Satellite: 8 gates, two for big aircraft, a third dearer. Green: 6 gates with chargers and a solar roof, a sixth dearer.',
          options: [
            { id: 'finger', pier: 'finger', label: 'The finger pier' },
            { id: 'satellite', pier: 'satellite', label: 'The satellite' },
            { id: 'green', pier: 'green', label: 'The green pier' },
            { id: 'none', label: 'Think about it' }
          ] }] },
      { name: 'Building', mode: 'plan', days: 75, endEarly: true, goal: [{ k: 'project', id: 'pier2040' }] }
    ],
    goal: [{ k: 'project', id: 'pier2040' }],
    stars: [{ k: 'spent', max: 3300e6 }, { k: 'chargers', min: 10 }]
  },
  {
    name: 'Faces as Boarding Passes', kind: 'operate', date: '2038-05-03', requires: BUILT_2036,
    setup: S8({ items: ITEMS_2036, airlines: ROUTES_2035, chargers: 6, domains: Object.assign({}, TEAMS_2030, { turnaround: 2 }), unlock: { border: 3 } }),
    hands: HANDS_8,
    brief: [
      'Passengers who agree to it can now let a camera look at their face instead of showing a passport and a boarding pass — at the border and at the gate.',
      'It needs IT people and a careful system, and those who say no still go to an officer.',
      'Put it in for the summer, then run an afternoon of long-haul and London flights.'
    ],
    aim: 'Put in biometric boarding, then run an afternoon full of flights outside Schengen.',
    news: [
      { icon: '🙂', text: 'Biometric boarding: the border\'s third level. Faster through the border, and onto the aircraft.' }
    ],
    facts: [],
    stages: [
      { name: 'Before the summer', mode: 'plan', days: 30, goal: [],
        choices: [{ id: 'faces', at: 1, default: 'no', icon: '🙂', title: 'Faces as boarding passes?',
          text: 'Twenty-five days to put in. The officers stay for those who say no.',
          options: [
            { id: 'yes', system: { dom: 'border', how: 'keep' }, label: 'Put it in' },
            { id: 'no', label: 'Passports will do' }
          ] }] },
      { name: 'A long-haul afternoon', mode: 'ops', date: '2038-06-14', from: '13:00', to: '16:00', weather: { temp: 21, wind: [220, 8] }, desks: 22, lanes: 10, booths: 3,
        flights: [F8('EK', 'B77W', 1, '13:10', '13:10', 120, { base: 156, load: 0.92 }), F8('QR', 'A359', 1, '13:30', '13:30', 100, { base: 167, load: 0.9 }),
          F8('SK', 'A359', 2, '13:20', '14:20', 110, { base: 900, ns: true, load: 0.92 }), F8('BA', 'A320', 4, '13:15', '15:15', 50, { base: 770, load: 0.92 }),
          F8('SK', 'A20N', 6, '13:05', '15:20', 45, { base: 100, ns: true, load: 0.9 }), F8('NOVAIR', 'A321', 2, '13:40', '14:40', 60, { base: 700, ns: true, load: 0.95 }),
          F8('DY', 'B38M', 7, '13:05', '15:25', 46, { base: 400 }), F8('ELECTRIC', 'EL30', 8, '13:05', '15:20', 35, { base: 121 })],
        goal: [{ k: 'lost', max: 0 }, { k: 'borderWait', max: 8 }] }
    ],
    goal: [{ k: 'level', dom: 'border', min: 3 }],
    stars: [{ k: 'borderWait', max: 2 }, { k: 'onTime', p: 0.9 }]
  },
  {
    name: 'Heatwave 2040', kind: 'crisis', date: '2040-07-02', requires: BUILT_2036,
    setup: S8({ items: ITEMS_2036, airlines: ROUTES_2040, chargers: 6, domains: Object.assign({}, TEAMS_2030, { turnaround: 2, border: 3 }) }),
    hands: HANDS_8,
    brief: [
      'Sweden has never been this hot: 34 degrees at Arlanda. In the thin, hot air the big jets need the long runway to get off the ground.',
      'On the ramp the heat is hard on people; robots do not mind. In the terminal the passengers need cool air and water.',
      'Prepare in two weeks, then hold the hottest afternoon.'
    ],
    aim: 'Keep the hottest afternoon on time: the heavy jets on runway 1, the ramp and the passengers cool.',
    news: [
      { icon: '🥵', text: 'Heat: from 30 degrees the heavy jets must take off from runway 1, people on the ramp work slower, and hot passengers are unhappy.' }
    ],
    facts: [],
    stages: [
      { name: 'Two weeks', mode: 'plan', days: 14, goal: [],
        choices: [{ id: 'heat', at: 2, default: 'none', icon: '💧', title: 'Ready for the heat?',
          text: 'Cooling the terminals harder costs energy. Shade and water stations on the ramp keep the ground crews going.',
          options: [
            { id: 'cool', money: -8e6, meters: { passengers: 6 }, flag: 'cooled', label: 'Cool the terminals' },
            { id: 'shade', money: -3e6, meters: { staff: 5 }, flag: 'shaded', label: 'Shade and water on the ramp' },
            { id: 'none', label: 'It is only a few days' }
          ] }] },
      { name: 'The hottest afternoon', mode: 'ops', date: '2040-07-16', from: '13:00', to: '16:00', weather: { temp: 34, wind: [180, 5] }, desks: 22, lanes: 10, booths: 3,
        flights: [F8('EK', 'B77W', 1, '13:10', '13:10', 120, { base: 156, load: 0.92 }), F8('QR', 'A359', 1, '13:30', '13:30', 100, { base: 167, load: 0.9 }),
          F8('SK', 'A359', 3, '13:20', '15:00', 110, { base: 900, ns: true, load: 0.92 }), F8('DHL', 'B76F', 1, '13:40', '13:40', 80, { base: 1 }),
          F8('ELECTRIC', 'EL30', 10, '13:05', '15:20', 35, { base: 141 })].concat(DAY_8('13:00', 140, 1.1)),
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.75 }, { k: 'passengers', min: 90 }] }
    ],
    goal: [],
    stars: [{ k: 'airportDelay', max: 4 }, { k: 'passengers', min: 88 }]
  },
  {
    name: 'Night Train or Night Flight', kind: 'choice', date: '2040-08-20', requires: BUILT_2036,
    setup: S8({ items: ITEMS_2036, airlines: ROUTES_2040, chargers: 6, domains: Object.assign({}, TEAMS_2030, { turnaround: 2, border: 3 }) }),
    hands: [],
    brief: [
      'The night is the quiet part of the airport. Two offers want it.',
      'Freight companies would fly their freighters every night — good money, but the neighbours would hear them. The railway would rather run night trains to Berlin and Hamburg from a platform at the station: less money, and a quieter, greener night.',
      'Choose, then see what the autumn brings.'
    ],
    aim: 'Decide what the nights are for, and keep the airport healthy through the autumn.',
    news: [
      { icon: '🌙', text: 'The night: freighters bring money and noise; the night train brings rent, green points and quiet.' }
    ],
    facts: [],
    stages: [
      { name: 'Late summer', mode: 'plan', days: 60, goal: [],
        choices: [{ id: 'nights', at: 2, default: 'none', icon: '🌙', title: 'What are the nights for?',
          text: 'The freighters would fly four times a night. The night train needs a platform at the station, built in forty-five days.',
          options: [
            { id: 'freight', airline: { code: 'DHL', routes: [{ type: 'B77F', perDay: 2, load: 0.85 }] }, airline2: { code: 'UPS', routes: [{ type: 'B76F', perDay: 2, load: 0.85 }] }, neighboursBase: -10, flag: 'nightsChosen', label: 'Night freighters' },
            { id: 'train', build: 'nightTrain', neighboursBase: 4, meters: { neighbours: 4 }, flag: 'nightsChosen', label: 'The night train' },
            { id: 'none', label: 'Keep the nights empty' }
          ] }] },
      { name: 'Autumn', mode: 'plan', days: 60, goal: [] }
    ],
    goal: [{ k: 'flag', id: 'nightsChosen' }],
    stars: [{ k: 'lastMonth', min: 70e6 }, { k: 'neighbours', min: 80 }]
  },
  {
    name: 'Peak Day 2040', kind: 'operate', date: '2040-12-11', requires: BUILT_2036,
    setup: S8({ items: ITEMS_2036, airlines: ROUTES_2040, chargers: 6, domains: Object.assign({}, TEAMS_2030, { turnaround: 2, border: 3 }) }),
    hands: HANDS_8.concat(['plough', 'deice']),
    brief: [
      'A Tuesday in December, when the Christmas charters begin: the busiest day Arlanda has ever had. Charter jets to the sun, families to the north, electric flights to every corner of Sweden.',
      'Everything you have built works together today — the robots, the chargers, the bag drop, the faces at the border, two runways and your pier.',
      'A morning wave and an evening wave, with snow in the forecast.'
    ],
    aim: 'Run the busiest day ever: a morning and an evening wave before Christmas.',
    news: [
      { icon: '🎄', text: 'The busiest day ever: everything at once.' }
    ],
    facts: [],
    stages: [
      { name: 'Getting ready', mode: 'plan', days: 6, goal: [],
        choices: [{ id: 'peak', at: 1, default: 'none', icon: '🎄', title: 'Ready for the peak?',
          text: 'Seasonal temps for the teams that stand beside the systems, or four more security lanes for the Christmas crowds?',
          options: [
            { id: 'temps', temps: 'security', money: -4e6, flag: 'peakReady', label: 'Seasonal temps' },
            { id: 'lanes', lanes: 4, flag: 'peakReady', label: 'Four more lanes' },
            { id: 'none', label: 'Everything is automatic' }
          ] }] },
      { name: 'The morning wave', mode: 'ops', date: '2040-12-11', from: '06:00', to: '08:45', weather: { temp: -4, wind: [20, 8], snow: [['06:30', '07:20', 1.2]] }, desks: 26, lanes: 12, booths: 4,
        flights: [F8('ELECTRIC', 'EL30', 12, '06:05', '08:20', 35, { base: 161 }), F8('NOVAIR', 'A321', 3, '06:20', '07:20', 60, { base: 700, load: 0.97, ns: true }),
          F8('HYDRO', 'H2P', 1, '06:40', '06:40', 50, { base: 11 })].concat(DAY_8('06:00', 160, 1.2)),
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.75 }] },
      { name: 'The evening wave', mode: 'ops', from: '15:00', to: '17:45', weather: { temp: -6, wind: [10, 6] }, desks: 26, lanes: 12, booths: 4,
        flights: [F8('ELECTRIC', 'EL30', 12, '15:05', '17:20', 35, { base: 181 }), F8('EK', 'B77W', 1, '15:10', '15:10', 120, { base: 156, load: 0.95 }),
          F8('SK', 'A359', 2, '15:20', '16:20', 110, { base: 900, ns: true, load: 0.95 })].concat(DAY_8('15:00', 180, 1.2)),
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.75 }] }
    ],
    goal: [{ k: 'flag', id: 'peakReady' }],
    stars: [{ k: 'airportDelay', max: 3 }, { k: 'passengers', min: 88 }]
  },
  {
    name: 'Final Exam: Blackout', kind: 'exam', date: '2040-12-12', requires: BUILT_2036,
    setup: S8({ items: ITEMS_2036, airlines: ROUTES_2040, chargers: 6, domains: Object.assign({}, TEAMS_2030, { turnaround: 2, border: 3 }) }),
    hands: HANDS_8,
    brief: [
      'The most automated airport in the north. Robots on the apron, chargers at the gates, cameras at the border — and people who still remember how it all works by hand. Or do they?',
      'In the middle of a busy day the power grid fails, and the backup with it. Every system goes dark at once.',
      'This is what the whole game was about: the airport survives on its people.'
    ],
    aim: 'Prepare the people, run the busiest morning, then keep the airport going through a total blackout.',
    news: [
      { icon: '🎓', text: 'The final exam: everything of the game.' },
      { icon: '🌑', text: 'A blackout: every system down, the charging stands dark, the bags searched by hand. Only the teams kept beside the systems, and your hands, are left.' }
    ],
    facts: [],
    stages: [
      { name: 'A week', mode: 'plan', days: 7, goal: [],
        choices: [{ id: 'prepare', at: 1, default: 'none', icon: '🧯', title: 'Practise the manual way?',
          text: 'A drill day for every system: the staff work by hand again while the systems watch.',
          options: [
            { id: 'drills', drills: true, label: 'Drills everywhere' },
            { id: 'none', label: 'Our systems are the best in the world' }
          ] }] },
      { name: 'The busiest morning', mode: 'ops', date: '2040-12-21', from: '06:00', to: '08:45', weather: { temp: -3, wind: [20, 8] }, desks: 26, lanes: 12, booths: 4,
        flights: [F8('ELECTRIC', 'EL30', 12, '06:05', '08:20', 35, { base: 201 }), F8('NOVAIR', 'A321', 3, '06:20', '07:20', 60, { base: 700, load: 0.97, ns: true })].concat(DAY_8('06:00', 200, 1.2)),
        goal: [{ k: 'lost', max: 0 }, { k: 'onTime', p: 0.75 }] },
      { name: 'Blackout', mode: 'ops', from: '11:00', to: '13:45', weather: { temp: -5, wind: [20, 7] }, desks: 26, lanes: 12, booths: 4,
        events: [{ at: '11:05', do: 'blackout', min: 200, text: 'Blackout! The grid and the backup power have failed together: every system is dark. Work by hand!' }],
        flights: [F8('ELECTRIC', 'EL30', 10, '11:05', '13:20', 35, { base: 221 }), F8('EK', 'B77W', 1, '11:30', '11:30', 120, { base: 156, load: 0.92 })].concat(DAY_8('11:00', 220, 1.1)),
        goal: [{ k: 'lost', max: 2 }, { k: 'onTime', p: 0.5 }] }
    ],
    goal: [{ k: 'readiness', min: 90 }],
    stars: [{ k: 'airportDelay', max: 6 }, { k: 'passengers', min: 70 }],
    paper: { head: 'THE LIGHTS WENT OUT — ARLANDA KEPT FLYING',
      text: 'For three hours not a single computer at Arlanda worked. Aircraft were parked by radio, bags searched by hand, boarding passes written with a pen. "The machines are wonderful," says the director, "but it is the people who keep an airport alive."' }
  }
]);
