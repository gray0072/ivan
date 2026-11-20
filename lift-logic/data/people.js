'use strict';

// Lift Logic — the characters: their names (the same in every language), patience in seconds at Medium,
// places taken in the cabin, how slowly they get on and off, their look and their lines. Read by
// sim/people.js (patience, size, habits), art/people.js (the look) and the person card (the lines).
//
// names: one fixed name, or a pool picked from by the day's random
// board: × BOARD_TIME per getting on or off; size: places taken; prank: presses every button inside
// look: body colour, hair colour, 'kid' for a small figure, an item carried (box, suitcase, bed, cart,
// pizza, bag, cat, cake, flowers, case, clipboard)

const KID_NAMES = ['Mia', 'Noah', 'Emma', 'Liam', 'Ava', 'Leo', 'Ella', 'Oscar', 'Nora', 'Hugo', 'Alva', 'Sasha', 'Ivan', 'Zoe', 'Max', 'Lily'];
const ADULT_NAMES = ['Mr. Brown', 'Mrs. Lee', 'Ms. Garcia', 'Mr. Novak', 'Mrs. Svensson', 'Mr. Petrov', 'Ms. Kim', 'Mr. Okafor',
  'Mrs. Rossi', 'Mr. Dubois', 'Ms. Lindqvist', 'Mr. Tanaka', 'Mrs. Kowalski', 'Mr. Haddad', 'Ms. Moreau', 'Mr. Jensen',
  'Mrs. Ortega', 'Mr. Becker', 'Ms. Nyberg', 'Mr. Silva'];

const PEOPLE = {
  rosa: { name: 'Grandma Rosa', patience: 90, board: 2.5, size: 1, look: { body: '#9b6bc4', hair: '#e9e4f0', item: 'cat' },
    line: 'My cat Biscuit and I are in no hurry. Well, a little.', happy: 'Finally! Thank you, dear.', angry: 'In my day we had stairs. Oh wait.' },
  postman: { name: 'Pete the Postman', patience: 60, board: 1, size: 1, look: { body: '#2f5fa8', hair: '#5a3a22', item: 'bag' },
    line: 'Letters for every floor!', happy: 'Mail delivered!', angry: 'I\'ll walk. Postmen always walk.' },
  grandson: { name: 'Leo', patience: 50, board: 1.2, size: 2, look: { body: '#d0573b', hair: '#3a2a1a', item: 'box' },
    line: 'These boxes are heavier than they look.', happy: 'One more box up!', angry: 'Fine, I\'ll carry it up the stairs!' },
  neighbour: { names: ADULT_NAMES, patience: 60, board: 1, size: 1, look: { body: '#5f8f6a', hair: '#4a3420' },
    line: 'Just popping home.', happy: 'Lovely, thanks!', angry: 'I\'m taking the stairs!' },
  guest: { names: ADULT_NAMES, patience: 75, board: 1, size: 1, look: { body: '#c9497a', hair: '#2c1d14', item: 'flowers' },
    line: 'I\'m here for the party!', happy: 'Happy birthday, Rosa!', angry: 'I\'ll leave the present at the door.' },
  courier: { name: 'Marco the Pizza Courier', patience: 25, board: 0.8, size: 1, look: { body: '#e53935', hair: '#1d1d1d', item: 'pizza' },
    line: 'Hot pizza! Hurry, it\'s getting cold!', happy: 'Still hot!', angry: 'The pizza is cold. I\'m running!' },
  kid: { names: KID_NAMES, patience: 40, board: 0.8, size: 1, look: { body: '#f0a830', hair: '#6b3e1e', kid: true },
    line: 'Is it break time yet?', happy: 'Yay!', angry: 'I\'ll run up the stairs, it\'s faster!' },
  prankster: { name: 'Tommy', patience: 40, board: 0.8, size: 1, prank: true, look: { body: '#7cc242', hair: '#e8b23a', kid: true },
    line: 'What does this button do? And this one? And this one?', happy: 'Hehe.', angry: 'Boring lift!' },
  teacher: { names: ADULT_NAMES, patience: 50, board: 1, size: 1, look: { body: '#6a5acd', hair: '#5b4636', item: 'case' },
    line: 'I have a class in two minutes.', happy: 'Just in time for class.', angry: 'The stairs are good exercise, class.' },
  janitor: { name: 'Mr. Mops', patience: 70, board: 1.5, size: 2, look: { body: '#607d8b', hair: '#9e9e9e', item: 'cart' },
    line: 'Every floor gets a shine.', happy: 'Off to mop!', angry: 'I\'ll carry the bucket myself.' },
  principal: { name: 'Principal Oak', patience: 45, board: 1, size: 1, look: { body: '#3e5c3a', hair: '#cfcfcf', item: 'clipboard' },
    line: 'I check every lift myself.', happy: 'Excellent work, Lifty.', angry: 'This goes in my report.' },
  hotelGuest: { names: ADULT_NAMES, patience: 80, board: 1, size: 1, look: { body: '#2a9d8f', hair: '#4a2f1c' },
    line: 'Room with a view, please.', happy: 'Splendid service!', angry: 'One star. Stairs.' },
  bellboy: { names: ['Bobby the Bellboy', 'Benny the Bellboy', 'Bea the Bellgirl'], patience: 80, board: 1.5, size: 2, look: { body: '#b71c1c', hair: '#2a1a10', item: 'suitcase' },
    line: 'Luggage for room 7-0-4!', happy: 'Tip, please!', angry: 'I\'ll drag the suitcase up myself.' },
  chef: { name: 'Chef Amélie', patience: 40, board: 1.2, size: 2, look: { body: '#f5f5f5', hair: '#3b2a1a', item: 'cake' },
    line: 'The cake must arrive in one piece!', happy: 'The cake is safe!', angry: 'My cake! I carry it myself!' },
  doctor: { names: ['Dr. Patel', 'Dr. Lund', 'Dr. Ahmed', 'Dr. Smirnova', 'Dr. Weber'], patience: 30, board: 0.8, size: 1, look: { body: '#e8f1f5', hair: '#2b2b2b', item: 'clipboard' },
    line: 'The patients are waiting.', happy: 'Thank you!', angry: 'I\'ll run!' },
  bed: { name: 'A patient on a bed', patience: 45, board: 3, size: 6, look: { body: '#9ccfe0', hair: '#6d4c41', item: 'bed' },
    line: 'Careful with the bumps, please.', happy: 'Smooth ride!', angry: 'Ouch.' },
  nurse: { names: ['Nurse Joy', 'Nurse Ola', 'Nurse Sam', 'Nurse Kira'], patience: 45, board: 0.8, size: 1, look: { body: '#4fb3a9', hair: '#3a2a1a' },
    line: 'Ward rounds!', happy: 'Thanks!', angry: 'Stairs again…' },
  visitor: { names: ADULT_NAMES, patience: 50, board: 1, size: 1, look: { body: '#c27c4e', hair: '#3b2416', item: 'flowers' },
    line: 'Visiting my aunt.', happy: 'Here we are.', angry: 'I\'ll find the stairs.' },
  patient: { names: ADULT_NAMES, patience: 70, board: 2.5, size: 1, look: { body: '#a0b6c8', hair: '#8d8d8d' },
    line: 'Slowly does it.', happy: 'Thank you for waiting for me.', angry: 'I can\'t take the stairs!' },
  office: { names: ADULT_NAMES, patience: 45, board: 0.8, size: 1, look: { body: '#37474f', hair: '#3e2723', item: 'case' },
    line: 'Meeting in five.', happy: 'Made it.', angry: 'Stairs. Again.' },
  boss: { name: 'Mr. Bigwig', patience: 30, board: 1, size: 1, look: { body: '#1a1a2e', hair: '#bdbdbd', item: 'case' },
    line: 'Time is money!', happy: 'Acceptable.', angry: 'Who programmed this lift?!' }
};
