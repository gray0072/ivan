'use strict';

// ============================================================
// World Aviation — the An-225 Mriya's 50 parts, for its assembly
// hall (ui/mriya.js, career.js): plain declarations, no logic.
//
// Each part: its group, the client group whose reputation it costs
// (`kind`: pax / cargo / bush), its share of the price (`kr`, of all
// the parts' `kr`; MRIYA.PRICE_KR in constants.js) and of the
// reputation (`rep`, of its group's parts' `rep`; MRIYA.PRICE_REP),
// its name, a real figure (`spec`), what it is for (`blurb`), and its
// place on the aeroplane (`slot`, drawn by art/mriyaplan.js):
//   body: [u0, u1]          a section of the fuselage, u from the nose (0) to the tail (1)
//   boxes: [[u, x, w, h, y]] modules inside: their middle at u, x metres to the right, y radii above
//                           the axis (default -0.35, the hold's floor); w across, h along (metres)
//   wing: [f0, f1], chord: [c0, c1], sides   a strip of the wing: f along the half span from the
//                           root, c along the chord from the leading edge; sides L, R or both
//   centre: f               the centre wing section, over the body out to f of the half span
//   surf: name              the moving surfaces of that name (flap, aileron, spoiler, elevator, rudder)
//   engine: n               engine n (1 = the left outer, 6 = the right outer), its front ...
//   reverser: true          ... or the back of every nacelle; pylon: true — every pylon
//   tail: true              the tailplane; fin: 'L' / 'R'
//   gear: nose / L / R / wheels / sponsons
// Every text is English and goes through tr() (data/lang-ru.js, data/lang-sv.js).
// ============================================================

// the groups of parts, in the order of the filter bar
const MRIYA_GROUPS = [
  { id: 'body', name: 'Fuselage', icon: '▭' },
  { id: 'wing', name: 'Wing', icon: '◢' },
  { id: 'power', name: 'Engines', icon: '◎' },
  { id: 'tail', name: 'Tail', icon: '⊥' },
  { id: 'gear', name: 'Landing gear', icon: '◉' },
  { id: 'systems', name: 'Cockpit & systems', icon: '⌁' }
];

// The Mriya's finishes (render/models.js paints it in the one chosen, Career.mriyaFinish): the
// first is its own and free, each of the others costs `price` × MRIYA.FINISH_KR (1 to 5 million kr)
// once and is then the pilot's// to switch to at any time. light / base / shade: the body's colour on the roof, the sides and
// under the belly; accent: the fins and the engine lips; lines: the stripes along each side (one
// under the other; flow: one stripe running through all of them); title: the AN-225 MRIYA titles;
// specular and shininess: how it shines (a low shininess is satin, almost matt). Listed by price,
// cheapest first, as the hall and the hangar card show them.
const MRIYA_FINISHES = [
  { id: 'pearl', price: 0, name: 'Pearl and champagne', blurb: 'Pearl white with a champagne line and champagne fins: quiet, and it catches the light.',
    light: '#fbfaf6', base: '#eae7df', shade: '#c4c0b5', accent: '#b0915f', lines: ['#b0915f'], title: '#7a6440', specular: 0xffffff, shininess: 80 },
  { id: 'classic', price: 1, name: 'Mriya classic', blurb: 'The real Mriya\'s colours: white, with the blue and the yellow of Ukraine along its sides.',
    light: '#ffffff', base: '#f2f4f6', shade: '#c9ced4', accent: '#f2f4f6', lines: ['#0057b7', '#ffd700'], title: '#0057b7', specular: 0x777777, shininess: 30 },
  { id: 'midnight', price: 1.5, name: 'Midnight blue', blurb: 'Deep night blue with a silver line and silver titles.',
    light: '#33507e', base: '#1c2b4a', shade: '#0e182c', accent: '#1c2b4a', lines: ['#c9ced6'], title: '#d4d9e0', specular: 0x9fb2d6, shininess: 70 },
  { id: 'burgundy', price: 1.5, name: 'Burgundy', blurb: 'The red of an old wine, a thin gold line.',
    light: '#933447', base: '#6a1e2b', shade: '#3a0e17', accent: '#6a1e2b', lines: ['#c9a44a'], title: '#dcbb63', specular: 0xffc8c8, shininess: 60 },
  { id: 'emerald', price: 2, name: 'Emerald', blurb: 'Dark emerald green with a line and titles of old gold.',
    light: '#33876a', base: '#1d5c47', shade: '#0e3528', accent: '#1d5c47', lines: ['#c9a44a'], title: '#dcbb63', specular: 0xbfe8d4, shininess: 70 },
  { id: 'graphite', price: 2, name: 'Graphite and copper', blurb: 'Dark graphite, copper fins and a copper line.',
    light: '#5d636c', base: '#3b4047', shade: '#202428', accent: '#b87333', lines: ['#b87333'], title: '#d08a4a', specular: 0xcccccc, shininess: 60 },
  { id: 'obsidian', price: 2.5, name: 'Obsidian', blurb: 'Satin black all over, a grey line: six hundred tonnes of shadow.',
    light: '#2c2f34', base: '#17191c', shade: '#0a0b0d', accent: '#17191c', lines: ['#5a5f66'], title: '#8a9099', specular: 0x3a3a3a, shininess: 14 },
  { id: 'platinum', price: 3, name: 'Platinum', blurb: 'Bright polished metal, a graphite line: the look of a bare-metal airliner of the sixties.',
    light: '#f0f3f6', base: '#c4c9ce', shade: '#7c838a', accent: '#9aa1a8', lines: ['#3d434a'], title: '#3d434a', specular: 0xffffff, shininess: 110 },
  { id: 'rose', price: 3.5, name: 'Rose gold', blurb: 'The warm pink of rose gold, a line of deep copper.',
    light: '#efc8b8', base: '#c6907e', shade: '#8a5a4b', accent: '#c6907e', lines: ['#6e3f33'], title: '#6e3f33', specular: 0xffe0d4, shininess: 90 },
  { id: 'aurora', price: 4, name: 'Aurora', blurb: 'Arctic white with the northern lights flowing along its sides, green into blue into violet.',
    light: '#ffffff', base: '#edf3f6', shade: '#c4d3dc', accent: '#2f9e8f', lines: ['#36d1a6', '#3a8fd9', '#8a5ad9'], flow: true, title: '#2a6f8f', specular: 0xffffff, shininess: 60 },
  { id: 'gold', price: 5, name: 'Gold', blurb: 'Polished gold from nose to tail, a dark gold line along it. Nobody will miss it.',
    light: '#f3d27a', base: '#c99a3e', shade: '#8a6420', accent: '#c99a3e', lines: ['#6e4c10'], title: '#6e4c10', specular: 0xfff0c8, shininess: 90 }
];

// the legend, on the assembly hall's first screen
const MRIYA_LEGEND = {
  title: 'An-225 Mriya',
  native: 'Мрія',
  motto: 'The heaviest aeroplane ever flown. It is gone. Build it again.',
  text: [
    'Mriya means "dream" in Ukrainian. Built in Kyiv in 1988 to carry the Buran space shuttle on its back, it was the heaviest aeroplane that ever flew: 640 tonnes at take-off, six engines, 32 wheels and a wing 88 metres across.',
    'Only one was ever finished. It set more than 240 world records, lifted the heaviest single piece of cargo ever flown — a 190-tonne generator — and carried rescue cargo all over the world. In February 2022 it burned in its hangar at Hostomel during the war.',
    'It will never fly again — unless someone builds it, part by part.'
  ],
  // the real figures, on the legend card
  facts: [
    ['Length', '84 m'], ['Wingspan', '88.4 m'], ['Height', '18.1 m'], ['Wing area', '905 m²'],
    ['Max take-off weight', '640 t'], ['Payload', '250 t'], ['Engines', '6 × Progress D-18T, 229.5 kN'],
    ['Cruise', '800 km/h'], ['Range', '15 400 km'], ['Wheels', '32'], ['Crew', '6'], ['First flight', '21 December 1988']
  ]
};

const MRIYA_PARTS = [
  // ---------- the fuselage ----------
  { id: 'radome', group: 'body', kind: 'pax', kr: 40, rep: 3, name: 'Nose radome',
    spec: 'Radio-transparent glass-fibre cone', blurb: 'The very tip of the nose: a cap the radar waves pass through, over the weather radar.',
    slot: { body: [0, 0.035] } },
  { id: 'visor', group: 'body', kind: 'cargo', kr: 260, rep: 9, name: 'Visor nose door',
    spec: 'Opening 6.4 × 4.4 m', blurb: 'The whole nose swings up, and a ramp folds out: tanks, turbines and locomotives drive straight into the hold.',
    slot: { body: [0.035, 0.1] } },
  { id: 'flightdeck', group: 'body', kind: 'pax', kr: 300, rep: 8, name: 'Flight deck section',
    spec: 'Six crew stations', blurb: 'The cockpit on the upper deck: two pilots, two flight engineers, a navigator and a radio operator.',
    slot: { body: [0.1, 0.17] } },
  { id: 'fwdfus', group: 'body', kind: 'cargo', kr: 420, rep: 5, name: 'Forward fuselage',
    spec: '7.3 m wide, pressurised', blurb: 'The front of the cargo hold and the upper deck above it: the An-124\'s body, made longer.',
    slot: { body: [0.17, 0.3] } },
  { id: 'plugs', group: 'body', kind: 'cargo', kr: 380, rep: 6, name: 'Fuselage plugs',
    spec: '+15 m over the An-124', blurb: 'Two extra barrel sections, in front of the wing and behind it: they made the hold 43 metres long.',
    slot: { body: [0.3, 0.36], body2: [0.55, 0.61] } },
  { id: 'cenfus', group: 'body', kind: 'cargo', kr: 600, rep: 7, name: 'Centre fuselage',
    spec: 'Carries 640 t into the wing', blurb: 'The strongest part of the body: the wing sits on it and the main gear hangs under it.',
    slot: { body: [0.36, 0.55] } },
  { id: 'aftfus', group: 'body', kind: 'pax', kr: 400, rep: 4, name: 'Rear fuselage',
    spec: 'No rear cargo door', blurb: 'Unlike the An-124 the Mriya has no ramp at the back: a solid tail saved weight and carried the twin tail.',
    slot: { body: [0.61, 0.72] } },
  { id: 'tailcone', group: 'body', kind: 'bush', kr: 120, rep: 2, name: 'Tail cone',
    spec: 'Swept up under the tail', blurb: 'The tapering end of the body, shaped so the tail clears the runway when the nose is high on take-off.',
    slot: { body: [0.72, 1] } },
  { id: 'floor', group: 'body', kind: 'cargo', kr: 180, rep: 8, name: 'Cargo floor and rails',
    spec: 'Hold 43.35 × 6.4 × 4.4 m', blurb: 'A titanium floor with roller tracks and tie-down rings: 1 300 cubic metres for anything up to 250 tonnes.',
    slot: { boxes: [[0.38, -3.05, 0.5, 47, -0.72], [0.38, 3.05, 0.5, 47, -0.72]] } },
  { id: 'relief', group: 'body', kind: 'pax', kr: 90, rep: 5, name: 'Relief crew cabin',
    spec: 'Bunks and seats on the upper deck', blurb: 'Behind the cockpit: where the second crew sleeps on a long flight, and the loadmasters ride.',
    slot: { boxes: [[0.215, 0, 2.6, 3.2, 0.75]] } },
  { id: 'buran', group: 'body', kind: 'cargo', kr: 150, rep: 10, name: 'Buran mounts',
    spec: 'Up to 200 t on the roof', blurb: 'The fittings on top of the body that held the Buran space shuttle — the reason the Mriya was built.',
    slot: { boxes: [[0.33, -2.2, 1, 1.4, 1.25], [0.33, 2.2, 1, 1.4, 1.25], [0.585, -2.2, 1, 1.4, 1.25], [0.585, 2.2, 1, 1.4, 1.25]] } },

  // ---------- the wing ----------
  { id: 'cenwing', group: 'wing', kind: 'cargo', kr: 650, rep: 4, name: 'Centre wing section',
    spec: 'A new, wider centre section', blurb: 'The heart of the wing, built new for the Mriya: it joins both wings over the body and carries the extra pair of engines.',
    slot: { centre: 0.12 } },
  { id: 'wingLi', group: 'wing', kind: 'pax', kr: 520, rep: 3, name: 'Left inner wing',
    spec: 'Caisson with integral tanks', blurb: 'The strong inner half of the left wing: the left engines hang under it and the fuel sits inside it.',
    slot: { wing: [0.12, 0.5], chord: [0, 1], sides: 'L' } },
  { id: 'wingRi', group: 'wing', kind: 'bush', kr: 520, rep: 3, name: 'Right inner wing',
    spec: 'Caisson with integral tanks', blurb: 'The strong inner half of the right wing: the right engines hang under it and the fuel sits inside it.',
    slot: { wing: [0.12, 0.5], chord: [0, 1], sides: 'R' } },
  { id: 'wingLo', group: 'wing', kind: 'pax', kr: 380, rep: 3, name: 'Left outer wing',
    spec: 'An-124 outer wing, 3° anhedral', blurb: 'The outer left wing, taken over from the An-124: it droops a little, which keeps a big high wing steady.',
    slot: { wing: [0.5, 0.94], chord: [0, 1], sides: 'L' } },
  { id: 'wingRo', group: 'wing', kind: 'bush', kr: 380, rep: 3, name: 'Right outer wing',
    spec: 'An-124 outer wing, 3° anhedral', blurb: 'The outer right wing, taken over from the An-124: it droops a little, which keeps a big high wing steady.',
    slot: { wing: [0.5, 0.94], chord: [0, 1], sides: 'R' } },
  { id: 'slats', group: 'wing', kind: 'bush', kr: 200, rep: 5, name: 'Leading-edge slats',
    spec: 'Along the whole span', blurb: 'Slide forward and down for take-off and landing, so the wing keeps lifting at low speed.',
    slot: { wing: [0.03, 0.94], chord: [0, 0.1], sides: 'both' } },
  { id: 'flaps', group: 'wing', kind: 'pax', kr: 320, rep: 6, name: 'Slotted flaps',
    spec: 'Slotted Fowler flaps', blurb: 'Roll back and down out of the wing: more wing, more lift, and an approach at a speed a runway can take.',
    slot: { surf: 'flap' } },
  { id: 'ailerons', group: 'wing', kind: 'bush', kr: 110, rep: 4, name: 'Ailerons',
    spec: 'Out at the wingtips', blurb: 'One goes up while the other goes down: they roll the aeroplane into a turn.',
    slot: { surf: 'aileron' } },
  { id: 'spoilers', group: 'wing', kind: 'pax', kr: 140, rep: 4, name: 'Spoilers',
    spec: 'Panels on top of the wing', blurb: 'Raised in the air they slow the aeroplane down; after touchdown they kill the lift and put the weight on the brakes.',
    slot: { surf: 'spoiler' } },
  { id: 'tanks', group: 'wing', kind: 'bush', kr: 160, rep: 7, name: 'Wing fuel tanks',
    spec: '300 t of fuel', blurb: 'Sealed boxes inside the wing that hold 300 tonnes of kerosene: enough for 15 400 km with an empty hold.',
    slot: { wing: [0.05, 0.82], chord: [0.18, 0.6], sides: 'both' } },
  { id: 'tips', group: 'wing', kind: 'bush', kr: 25, rep: 2, name: 'Wingtips and navigation lights',
    spec: 'Red on the left, green on the right', blurb: 'The rounded tips with the navigation lights and the strobes, so others see which way you are flying.',
    slot: { wing: [0.94, 1.05], chord: [0, 1], sides: 'both' } },

  // ---------- the engines ----------
  { id: 'eng1', group: 'power', kind: 'cargo', kr: 330, rep: 6, name: 'Engine 1 (left outer)',
    spec: 'Progress D-18T, 229.5 kN', blurb: 'A Ukrainian turbofan from Zaporizhzhia: 23.4 tonnes of thrust and a fan 2.3 metres across.',
    slot: { engine: 1 } },
  { id: 'eng2', group: 'power', kind: 'pax', kr: 330, rep: 6, name: 'Engine 2 (left middle)',
    spec: 'Progress D-18T, 229.5 kN', blurb: 'The same D-18T as the An-124\'s; the Mriya needs six of them where the Ruslan has four.',
    slot: { engine: 2 } },
  { id: 'eng3', group: 'power', kind: 'bush', kr: 330, rep: 7, name: 'Engine 3 (left inner)',
    spec: 'Progress D-18T, 229.5 kN', blurb: 'One of the extra pair under the new centre wing: together the six give 1 377 kN of thrust.',
    slot: { engine: 3 } },
  { id: 'eng4', group: 'power', kind: 'bush', kr: 330, rep: 7, name: 'Engine 4 (right inner)',
    spec: 'Progress D-18T, 229.5 kN', blurb: 'One of the extra pair under the new centre wing: together the six give 1 377 kN of thrust.',
    slot: { engine: 4 } },
  { id: 'eng5', group: 'power', kind: 'pax', kr: 330, rep: 6, name: 'Engine 5 (right middle)',
    spec: 'Progress D-18T, 229.5 kN', blurb: 'The same D-18T as the An-124\'s; the Mriya needs six of them where the Ruslan has four.',
    slot: { engine: 5 } },
  { id: 'eng6', group: 'power', kind: 'cargo', kr: 330, rep: 6, name: 'Engine 6 (right outer)',
    spec: 'Progress D-18T, 229.5 kN', blurb: 'A Ukrainian turbofan from Zaporizhzhia: 23.4 tonnes of thrust and a fan 2.3 metres across.',
    slot: { engine: 6 } },
  { id: 'pylons', group: 'power', kind: 'cargo', kr: 150, rep: 3, name: 'Engine pylons',
    spec: 'Six struts under the wing', blurb: 'They hang each engine below and ahead of the wing and carry its thrust into the wing box.',
    slot: { pylon: true } },
  { id: 'reversers', group: 'power', kind: 'bush', kr: 230, rep: 5, name: 'Nacelles and thrust reversers',
    spec: 'Reverse thrust on all six', blurb: 'The back of each engine cowling opens and turns the airflow forwards: a strong brake on the landing roll.',
    slot: { reverser: true } },
  { id: 'apu', group: 'power', kind: 'bush', kr: 70, rep: 6, name: 'Auxiliary power units',
    spec: 'Two TA-12 in the gear fairings', blurb: 'Small turbines that start the engines and power the aeroplane on a field with no ground equipment.',
    slot: { boxes: [[0.42, -3.6, 1.4, 2.4, -0.62], [0.42, 3.6, 1.4, 2.4, -0.62]] } },
  { id: 'fuelsys', group: 'power', kind: 'cargo', kr: 100, rep: 3, name: 'Fuel system',
    spec: 'Pumps and lines to six engines', blurb: 'Boost pumps, valves and pipes that feed every engine from any tank and keep the aeroplane balanced.',
    slot: { boxes: [[0.455, 0, 2.6, 3.2]] } },

  // ---------- the tail ----------
  { id: 'stab', group: 'tail', kind: 'cargo', kr: 300, rep: 3, name: 'Horizontal stabiliser',
    spec: 'Span 32.65 m', blurb: 'The tailplane on top of the body: it keeps the nose where the pilot wants it, and carries a fin at each end.',
    slot: { tail: true } },
  { id: 'elevators', group: 'tail', kind: 'pax', kr: 120, rep: 4, name: 'Elevators',
    spec: 'Behind the stabiliser', blurb: 'They tilt up and down to raise or lower the nose: rotation on take-off, the flare on landing.',
    slot: { surf: 'elevator' } },
  { id: 'finL', group: 'tail', kind: 'bush', kr: 160, rep: 3, name: 'Left fin',
    spec: 'Twin tail', blurb: 'The Mriya has two fins at the ends of the tailplane, out of the turbulent air behind a shuttle on its back.',
    slot: { fin: 'L' } },
  { id: 'finR', group: 'tail', kind: 'pax', kr: 160, rep: 3, name: 'Right fin',
    spec: 'Twin tail', blurb: 'The Mriya has two fins at the ends of the tailplane, out of the turbulent air behind a shuttle on its back.',
    slot: { fin: 'R' } },
  { id: 'rudders', group: 'tail', kind: 'cargo', kr: 100, rep: 3, name: 'Rudders',
    spec: 'Two, one on each fin', blurb: 'They swing the tail left and right: crosswind landings, and the yaw of an engine failure on take-off.',
    slot: { surf: 'rudder' } },

  // ---------- the landing gear ----------
  { id: 'nosegear', group: 'gear', kind: 'cargo', kr: 160, rep: 6, name: 'Nose gear',
    spec: 'Two legs, four wheels, kneeling', blurb: 'Two steerable legs that can kneel: they fold to lower the nose to the ground for loading.',
    slot: { gear: 'nose' } },
  { id: 'gearL', group: 'gear', kind: 'bush', kr: 260, rep: 7, name: 'Left main gear',
    spec: 'Seven legs, 14 wheels', blurb: 'Seven pairs of wheels in a row, each on its own leg, so the weight is spread and a soft field can take it.',
    slot: { gear: 'L' } },
  { id: 'gearR', group: 'gear', kind: 'bush', kr: 260, rep: 7, name: 'Right main gear',
    spec: 'Seven legs, 14 wheels', blurb: 'Seven pairs of wheels in a row, each on its own leg, so the weight is spread and a soft field can take it.',
    slot: { gear: 'R' } },
  { id: 'sponsons', group: 'gear', kind: 'cargo', kr: 140, rep: 2, name: 'Gear fairings',
    spec: 'Two long sponsons', blurb: 'The bulges along the belly the main gear folds into, with the auxiliary power units in their front.',
    slot: { gear: 'sponsons' } },
  { id: 'wheels', group: 'gear', kind: 'bush', kr: 200, rep: 9, name: 'Wheels and brakes',
    spec: '32 wheels, the aft pairs steer', blurb: 'Thirty-two tyres and their brakes; the rear pairs of the main gear steer, so the giant turns on a taxiway.',
    slot: { gear: 'wheels' } },

  // ---------- the cockpit and the systems ----------
  { id: 'avionics', group: 'systems', kind: 'pax', kr: 140, rep: 10, name: 'Flight instruments and navigation',
    spec: 'Weather radar, inertial navigation', blurb: 'The panels, the radios and the navigation suite that find the way across a continent at night.',
    slot: { boxes: [[0.155, 0, 2.6, 3.2, 0.6]] } },
  { id: 'fbw', group: 'systems', kind: 'pax', kr: 170, rep: 9, name: 'Fly-by-wire controls',
    spec: 'Four channels', blurb: 'Computers move the control surfaces: the pilot\'s hands could never move these surfaces alone.',
    slot: { boxes: [[0.275, 0, 2.6, 3.2]] } },
  { id: 'electric', group: 'systems', kind: 'pax', kr: 90, rep: 4, name: 'Electrical system',
    spec: 'A generator on each engine', blurb: 'Generators, batteries and the wiring that power everything on board, from the radar to the cranes.',
    slot: { boxes: [[0.335, 0, 2.6, 3.2]] } },
  { id: 'aircon', group: 'systems', kind: 'pax', kr: 80, rep: 5, name: 'Pressurisation and air conditioning',
    spec: 'The whole hold pressurised', blurb: 'Keeps the cabin and the hold breathable and warm at 11 000 m, where the air outside is at −50 °C.',
    slot: { boxes: [[0.395, 0, 2.6, 3.2]] } },
  { id: 'hydraulics', group: 'systems', kind: 'pax', kr: 110, rep: 5, name: 'Hydraulic system',
    spec: 'Four independent systems', blurb: 'Oil under high pressure that moves the flaps, the gear, the brakes and the control surfaces.',
    slot: { boxes: [[0.515, 0, 2.6, 3.2]] } },
  { id: 'cranes', group: 'systems', kind: 'cargo', kr: 75, rep: 8, name: 'Cargo cranes and winches',
    spec: 'Overhead cranes in the hold', blurb: 'Cranes running along the ceiling of the hold and winches in the floor: the Mriya loads itself.',
    slot: { boxes: [[0.575, 0, 2.6, 3.2]] } },
  { id: 'antiice', group: 'systems', kind: 'bush', kr: 60, rep: 8, name: 'Anti-ice system',
    spec: 'Hot air from the engines', blurb: 'Bleed air heats the wing\'s leading edges and the engine inlets, so no ice builds up in cloud.',
    slot: { boxes: [[0.635, 0, 2.6, 3.2]] } },
  { id: 'emergency', group: 'systems', kind: 'bush', kr: 30, rep: 9, name: 'Oxygen and emergency equipment',
    spec: 'Oxygen, rafts, fire bottles', blurb: 'Oxygen masks, life rafts and fire bottles: rarely used, always on board.',
    slot: { boxes: [[0.695, 0, 2.6, 3.2]] } }
];
