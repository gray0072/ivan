'use strict';

// Arlanda Rising — the buildings on the map and the airport's own vehicles as their cards show them (ui/sitecard.js),
// as plain data. A building by its key in data/layout.js (what a tap on the map finds, render/airport.js `hitSite`):
//   item     the kind in S.airport.items it stands for (data/buildings.js: its name, price, staff and rent)
//   project  the master plan's project that builds it (data/masterplan.js) and `stage`, the stage that raises it
//   does     what its card shows live: terminal, pier, mall, tower, fire, bags, servers, power, shop, rent, cargo, parking,
//            pumps, soc, h2
//   term     the terminal whose passengers it serves (data/terminals.js)
//   icon     the sign before its name
//   about    what it is and what it does, in a sentence or two
//   same     a part of another building, whose card it opens (the first terminal's waiting room, the international
//            terminal's pier, the second office block)
// A vehicle (`fuelTruck`, `plough`) has its item, icon and about.

const SITES = {
  terminal1: { item: 'terminal', project: 'terminal1', stage: 'hall', does: 'terminal', term: 't1', icon: '🛫',
    about: 'The first terminal: one hall for every flight, with the check-in desks, a waiting room and a kiosk. The passengers walk over the apron to their aircraft.' },
  waiting: { same: 'terminal1' },
  tower1: { item: 'tower', project: 'tower1', stage: 'cab', does: 'tower', icon: '🗼',
    about: 'The control tower. From the glass cab on top the controllers see the runway and the apron and clear every aircraft to land, to taxi and to take off.' },
  fireStation: { item: 'fireStation', does: 'fire', icon: '🚒',
    about: 'The airport\'s fire and rescue service. Its crash tenders wait in their bays, ready to reach any point of a runway within minutes; the biggest aircraft it can protect sets the fire category.' },
  cafe: { item: 'cafe', does: 'shop', icon: '☕',
    about: 'A café for the passengers waiting for their flight: coffee, buns and sandwiches. The airport gets a share of what they spend.' },
  restaurant: { item: 'restaurant', does: 'shop', icon: '🍽️',
    about: 'The restaurant: a proper meal before a long flight, with a view of the aircraft. The airport gets a share of what is spent.' },
  dutyFree: { item: 'dutyFree', does: 'shop', icon: '🛍️',
    about: 'The duty-free shop: perfume, sweets and drinks without the tax for the passengers flying abroad.' },
  intlTerminal: { item: 'intlTerminal', project: 'intlTerminal', stage: 'hall', does: 'terminal', term: 'intl', icon: '🛫',
    about: 'The international terminal: check-in and security in the departure hall on the landside, the gates along its pier, the shops in between.' },
  intlPier: { same: 'intlTerminal' },
  domTerminal: { item: 'domTerminal', project: 'domTerminal', stage: 'hall', does: 'terminal', term: 'dom', icon: '🛫',
    about: 'The domestic terminal: quick check-in and a short walk to the gates for the flights within Sweden.' },
  terminal2: { item: 'terminal2', project: 'terminal2', stage: 'hall', does: 'terminal', term: 't2', icon: '🛫',
    about: 'Terminal 2: a terminal of its own for the airlines the airport sends there, with its own check-in, security, shops and gates.' },
  bagHall: { item: 'bagHall', project: 'bagHall', stage: 'hall', does: 'bags', icon: '🛄',
    about: 'The baggage hall: the bags from check-in ride the belts, are sorted by flight and loaded onto the carts that take them to the aircraft.' },
  sorterHall: { item: 'sorterHall', project: 'sorterHall', stage: 'hall', does: 'bags', icon: '🛄',
    about: 'The sorting hall: conveyors and a tilt-tray sorter read the tag on every bag and send it to its flight.' },
  computerRoom: { item: 'computerRoom', project: 'computerRoom', stage: 'room', does: 'servers', icon: '🖥️',
    about: 'The computer room: the racks that run the airport\'s systems. When a system is down, its work falls back to people or to your hands.' },
  generator: { item: 'generator', does: 'power', icon: '⚡',
    about: 'The backup generator: when the power fails, it starts at once and keeps the systems and the lights running.' },
  tower2: { item: 'tower2', project: 'tower2', stage: 'systems', does: 'tower', icon: '🗼',
    about: 'The new control tower: a slender concrete shaft with the glass cab high on top, seeing every runway at once, so the aircraft can follow each other closer.' },
  pierF: { item: 'pierF', project: 'pierF', stage: 'gates', does: 'pier', term: 'intl', icon: '🛫',
    about: 'Pier F: a long pier of gates for the international flights, with shops along its corridor and, later, jet bridges to the aircraft.' },
  skyCity: { item: 'skyCity', project: 'skyCity', stage: 'hall', does: 'mall', term: 'sky', icon: '🏪',
    about: 'Sky City: shops, cafés and restaurants between the terminals, open to everybody — the travellers, the people seeing them off and the staff.' },
  hotel: { item: 'hotel', project: 'skyCity', stage: 'hotel', does: 'rent', icon: '🏨',
    about: 'The hotel at Sky City: rooms a few steps from check-in for an early flight. It pays the airport rent every month.' },
  hotelExt: { item: 'hotelExt', does: 'rent', icon: '🏨',
    about: 'The hotel\'s new wing: more rooms, more rent.' },
  offices: { item: 'offices', does: 'rent', icon: '🏢',
    about: 'An office building by the airport: companies that want to be near the flights rent its floors.' },
  offices2: { same: 'offices' },
  cargoCity: { item: 'cargoCity', project: 'cargoCity', stage: 'halls', does: 'cargo', icon: '📦',
    about: 'Cargo City: halls where the freight from the lorries is sorted, packed into containers and loaded onto the aircraft — and the other way round.' },
  aquifer: { item: 'aquifer', project: 'aquifer', stage: 'plant', does: 'pumps', icon: '💧',
    about: 'The aquifer energy store: its pumps keep the winter\'s cold and the summer\'s warmth in the water of the esker under the airport, to cool and heat the terminals.' },
  cyberCentre: { item: 'cyberCentre', does: 'soc', icon: '🛡️',
    about: 'The security operations centre: people watch the airport\'s networks day and night and stop the attacks before they reach the systems.' },
  h2depot: { item: 'h2depot', does: 'h2', icon: '🧪',
    about: 'The hydrogen depot: tanks of hydrogen for the new aircraft that fly on it.' },
  nightTrain: { item: 'nightTrain', does: 'rent', icon: '🚄',
    about: 'The night train platform: sleeper trains from the airport through the night to the cities of Europe.' },
  pier2040: { item: 'pier2040', project: 'pier2040', stage: 'hall', does: 'pier', term: 'intl', icon: '🛫',
    about: 'Your pier: the gates you designed for the Arlanda of 2040.' },
  pierArm: { item: 'pierArm', project: 'pier2040', stage: 'arm', does: 'pier', term: 'intl', icon: '🛫',
    about: 'The second arm of your pier, with more gates to the north.' },
  parkingSmall: { item: 'parkingSmall', does: 'parking', icon: '🅿️',
    about: 'A car park for the passengers who drive to the airport: they pay for every day their car stands here.' },
  parkingBig: { item: 'parkingBig', does: 'parking', icon: '🅿️',
    about: 'A car park for the passengers who drive to the airport: they pay for every day their car stands here.' },

  // the vehicles
  fuelTruck: { item: 'fuelTruck', icon: '⛽',
    about: 'A fuel truck: it drives from the depot to an aircraft at its stand, fills the tanks in the wing and drives back.' },
  plough: { item: 'plough', icon: '❄️',
    about: 'A snowplough with a wide blade and a brush. The ploughs sweep a runway together, in a staggered convoy; one of them takes the apron.' }
};
