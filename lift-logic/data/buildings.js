'use strict';

// Lift Logic — the campaign's buildings in order: name, floors, the client who gives the missions, the
// interior style and colours, the special rooms of some floors, the newspaper's name. The chapters past
// `ready` are shown on the map as under construction. Read by the screens, sim/building.js and the view.

const BUILDINGS = [
  { id: 'grandma', chapter: 1, ready: true, name: 'Grandma\'s House', floors: 3, lift: 'old', style: 'house',
    client: { name: 'Grandma Rosa', look: 'rosa', line: 'This old lift needs a brain. Can you be its brain, Lifty?' },
    idea: 'Sequences, repeat, forever', wall: '#f3e2c7', trim: '#b5835a', sky: '#bfe3f5', paper: 'The Rosa Street Post',
    rooms: { 1: 'Bakery downstairs' } },
  { id: 'school', chapter: 2, ready: true, name: 'Maple School', floors: 5, lift: 'standard', style: 'school',
    client: { name: 'Principal Oak', look: 'principal', line: 'Five floors, three hundred kids, one lift. Good luck!' },
    idea: 'Conditions, sensing, comparisons', wall: '#e8efd8', trim: '#7a9a4a', sky: '#cdeaf7', paper: 'The Maple School Times',
    rooms: { 1: 'Hall', 3: 'Library', 5: 'Gym' } },
  { id: 'hotel', chapter: 3, ready: true, name: 'Grand Sunrise Hotel', floors: 8, lift: 'standard', style: 'hotel',
    client: { name: 'Ms. Bellamy', look: 'hotelGuest', line: 'Our guests expect five-star lifts, darling.' },
    idea: 'Events, the plan, variables', wall: '#f6e6d6', trim: '#b0413e', sky: '#ffd9b3', paper: 'The Hotel Gazette',
    rooms: { 1: 'Lobby', 8: 'Ballroom' } },
  { id: 'hospital', chapter: 4, ready: false, name: 'St. Hope Hospital', floors: 10, lift: 'bed', style: 'hospital',
    client: { name: 'Dr. Patel', look: 'doctor', line: 'In a hospital every second counts. Every single one.' },
    idea: 'Boolean logic, priorities, fairness', wall: '#e6f2f5', trim: '#3f8fa3', sky: '#d4ecf7', paper: 'The St. Hope Bulletin',
    rooms: { 1: 'Entrance', 2: 'Physiotherapy', 4: 'Surgery', 9: 'Wards', 10: 'Wards' } },
  { id: 'office', chapter: 5, ready: false, name: 'Glass Tower', floors: 16, lift: 'fast', style: 'office',
    client: { name: 'Mr. Bigwig', look: 'boss', line: 'Two lifts, sixteen floors, zero excuses.' },
    idea: 'Several lifts, messages, the clock', wall: '#dfe9f2', trim: '#41607f', sky: '#c6def2', paper: 'The Glass Tower Ledger',
    rooms: { 1: 'Lobby', 8: 'Canteen' } },
  { id: 'mall', chapter: 6, ready: false, name: 'Mega Mall', floors: 9, idea: 'Lists, for each, negative numbers', style: 'mall' },
  { id: 'eiffel', chapter: 7, ready: false, name: 'Eiffel Tower, Paris', floors: 4, idea: 'Own blocks with inputs', style: 'tower' },
  { id: 'empire', chapter: 8, ready: false, name: 'Empire State Building, New York', floors: 102, idea: 'Zoning, express, SCAN', style: 'tower' },
  { id: 'burj', chapter: 9, ready: false, name: 'Burj Khalifa, Dubai', floors: 160, idea: 'Double-deck, destination dispatch', style: 'tower' },
  { id: 'skyhook', chapter: 10, ready: false, name: 'Skyhook, the space elevator', floors: 5, idea: 'Everything together', style: 'space' }
];

const BUILDING = {};
for (const b of BUILDINGS) BUILDING[b.id] = b;
