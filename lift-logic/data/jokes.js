'use strict';

// Lift Logic — the comic lines under a run's numbers and the newspaper's headlines. A line is [who, text]:
// who is a character key of data/people.js, 'client' (the building's client) or 'gears' (Grandpa Gears).
// TRAIT lines are about the run's most notable trait (ui/jokes.js measures them against JOKE in constants.js);
// MOMENT lines about a moment of the day; BUILDING_LINES per building. {name}, {n}, {s}, {f} are filled in.
// Read by ui/jokes.js.

const JOKES = {
  gaveUp: [
    ['neighbour', '{name} took the stairs. Says thanks for the workout.'],
    ['gears', '{name} walked. The stairs are getting more customers than the lift.'],
    ['neighbour', '{name}: "I\'ve seen snails with a better timetable."'],
    ['client', 'Someone left a note: "Dear lift, I walked. Love, {name}."'],
    ['gears', 'We lost {name} to the stairs. A sad day for lifts everywhere.'],
    ['neighbour', '{name} is now fitter than ever, thanks to your lift.']
  ],
  longWait: [
    ['neighbour', '{name} waited {s} seconds. Finished a book. Started the sequel.'],
    ['neighbour', '{name} waited so long, they learned to knit.'],
    ['gears', '{name} waited {s} seconds on floor {f}. That\'s a lot of elevator music.'],
    ['client', '{name} grew a beard waiting on floor {f}. Even though it\'s a kid.'],
    ['neighbour', '{name}: "I pressed the button. I pressed it again. I\'m still pressing it."']
  ],
  emptyTrips: [
    ['gears', 'The lift went sightseeing. Alone. {n} times.'],
    ['client', '{n} empty trips. The lift says it was "just stretching its cables".'],
    ['gears', 'The lift travelled with nobody inside {n} times. It enjoys the quiet, I suppose.'],
    ['neighbour', 'Saw the lift go past empty again. Is it going to a party without us?']
  ],
  fullPass: [
    ['neighbour', 'The lift opened, looked at us, and said: "Too heavy!" Rude.'],
    ['gears', 'A full lift stopping for more people is like a full bus stopping to wave.'],
    ['bellboy', 'Stopped for me, but no room. I waved my suitcase at it.']
  ],
  prank: [
    ['prankster', 'Tommy pressed every button. The lift said: no.'],
    ['prankster', 'Tommy: "Best. Lift. Ever. It stopped EVERYWHERE!"'],
    ['gears', 'A boy pressed all the buttons. Some lifts just learn to ignore him.']
  ],
  wrongWay: [
    ['neighbour', '{n} people went up to go down. Like taking the long way to the fridge.'],
    ['gears', 'Some passengers saw the roof before the street today. {n} of them.'],
    ['kid', 'I wanted to go down but the lift took me up first. Free ride!']
  ],
  says: [
    ['client', 'The lift talks more than Grandma.'],
    ['gears', 'The lift said {n} things today. A chatty fellow.'],
    ['neighbour', 'The lift told me the floor number. Then again. And again. I know, I know!']
  ],
  energy: [
    ['gears', 'Only {n} ⚡ used. The electricity company is getting worried.'],
    ['client', 'The lift is so thrifty it turns off the light when nobody looks.']
  ],
  good: [
    ['gears', 'Smooth as butter. Not a single grumble.'],
    ['client', 'Nobody complained. I\'m almost disappointed.'],
    ['neighbour', 'I didn\'t even have time to check my phone.'],
    ['gears', 'That lift ran like a Swiss watch.'],
    ['kid', 'The doors opened before I even pressed. Is it magic?']
  ],
  perfect: [
    ['rosa', 'Faster than my cat! And Biscuit is quick.'],
    ['gears', 'Three stars. When I was young, lifts couldn\'t even count to three.'],
    ['client', 'Perfect! I\'m framing the run report.'],
    ['gears', 'If lifts had medals, this one would wear three.']
  ]
};

// moments of the day: a second line when the run had one
const MOMENTS = {
  rush: [
    ['gears', 'At {t} everybody wanted the lift at once. The lift wanted a holiday.'],
    ['neighbour', 'Rush hour! Elbows, suitcases, and one very brave lift.']
  ],
  cake: [
    ['chef', 'The cake arrived in one piece! Well, one and a half.'],
    ['chef', 'Not a single cream rose was harmed in this ride.']
  ],
  pizza: [['courier', 'Pizza delivered still hot. Marco is crying with joy.']],
  postman: [['postman', 'Every letter delivered. Even the one for the cat.']],
  moving: [['grandson', 'Five boxes upstairs. My arms are noodles now.']],
  ride: [['kid', 'Someone rode up and down just for fun. We all know who.']],
  emergency: [['doctor', 'The emergency was reached in {s} seconds. Good lift.'], ['nurse', 'Code blue, and the lift was there in {s} seconds. I didn\'t even finish my sentence.']],
  bed: [['bed', 'Straight up to the ward, not a single stop. Best ride of my life.'], ['nurse', 'The bed went up so smoothly, the patient slept through it.']],
  lunch: [['cook', 'Three hundred lunches up to the canteen. The soup is still warm!'], ['office', 'I got to lunch before the queue. A miracle.']],
  broken: [['gears', 'Lift {l} broke down, and the others covered for it. That\'s teamwork.'], ['manager', 'One lift out of order and nobody noticed. Perfect.']],
  prankster: [['prankster', 'I pressed ALL the buttons and the lift just… ignored me. Not fair!'], ['gears', 'Tommy has met his match: a lift that can count.']]
};

// lines that belong to a building (its people and places)
const BUILDING_LINES = {
  grandma: [['rosa', 'Biscuit the cat rode the lift twice today. He thinks he owns it.'], ['rosa', 'The bakery says the lift brings more customers now.'], ['rosa', 'This old lift hasn\'t worked this well since 1962.']],
  school: [['principal', 'Not a single kid late for class. That\'s a first.'], ['kid', 'Can the lift do my homework too?'], ['janitor', 'The floors are clean and the lift is fast. A good day.']],
  hotel: [['hotelGuest', 'Five stars for the lift. The breakfast gets three.'], ['bellboy', 'Fastest luggage service in town!'], ['client', 'Darling, our guests are delighted.']],
  hospital: [['doctor', 'The lift made it to surgery before the coffee went cold.'], ['nurse', 'Even the patients are smiling.'], ['patient', 'The doors waited for me. Like a gentleman.'], ['visitor', 'I brought flowers and they arrived fresh.']],
  office: [['boss', 'Time is money, and the lift just saved both.'], ['office', 'I made it to the meeting. Sadly.'], ['office', 'Two lifts and no race. Even the lifts are better at teamwork than my team.'], ['boss', 'I\'m giving the lifts a raise.']],
  mall: [['manager', 'Shoppers are smiling. Shoppers who smile buy more.'], ['shopper', 'I found my car on the first try. Minus two!'], ['teen', 'Made the movie with time for popcorn.'], ['manager', 'Not one cart stuck in a door today.']]
};

// the newspaper's headlines: {n} delivered, {b} the building
const HEADLINES = [
  'LIFT DELIVERS {n} PEOPLE, NOBODY TAKES THE STAIRS',
  'NEW LIFT BRAIN AMAZES {b}',
  'RECORD DAY: {n} RIDES AND NOT ONE GRUMBLE',
  'LOCAL LIFT "SMARTER THAN MOST OF US", SAYS NEIGHBOUR',
  'STAIRS REPORT RECORD LOW VISITORS',
  'LIFTS WORK AS A TEAM AT {b}',
  'NO STOPS FOR NOBODY: {n} HAPPY RIDERS'
];
