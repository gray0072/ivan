'use strict';

// ============================================================
// World Aviation — the comic lines in the debrief after a
// successful flight, as plain data, in two tables.
// LANDING_JOKES: the lines about the touchdown, by the client group
// of the flight (pax: a flight with passengers; cargo: freight and
// mail; bush: the bush and air ambulance operators), each with the
// trait of the touchdown it plays on (hard: the impact; bounce;
// bank; offset: off the centreline; long: far down the runway;
// butter: a feather-soft touchdown the cabin gives an ovation;
// good: a nice, uneventful one) and an icon.
// FLIGHT_JOKES: the lines about a moment of the flight, by that
// moment in `trait` (goAround: went round or touched and went;
// grass: rolled on the grass; taxiFast: a taxi overspeed;
// emergency: a checklist handled in flight; lowFuel: the tanks
// nearly dry; crosswind; snow at the arrival; night; early or late
// against the planned flight time), with the client groups it fits
// in `groups` (none: every flight) and an icon.
// In both, a line about one load only (the patient, the fish, the
// mail) names the contract types it fits in `loads`.
// The English text is the key of its translation in
// data/lang-ru.js and data/lang-sv.js. Picked and shown in the
// debrief by ui/landingjoke.js (LANDING_JOKE in constants.js).
// ============================================================

const LANDING_JOKES = {
  pax: [
    // ---------- hard: the impact ----------
    { trait: 'hard', icon: '☕', text: 'The coffee in row 12 shot up like a little fountain. "First café I’ve been to with a show," said its owner.' },
    { trait: 'hard', icon: '🧶', text: 'A granny in row 7 dropped a stitch on touchdown. Her scarf now has a new pattern, called "The Captain’s Landing".' },
    { trait: 'hard', icon: '🧳', text: 'Every overhead bin popped open at once, like a choir taking a bow. A teddy bear climbed down to see what happened.' },
    { trait: 'hard', icon: '😴', text: 'The man asleep in 23C woke up, asked "Are we there yet?" and fell asleep again. Yes, sir. Very much there.' },
    { trait: 'hard', icon: '🎢', text: 'A boy in row 4 shouted "AGAIN! AGAIN!" His mum shouted "NO!" The captain is still deciding.' },
    { trait: 'hard', icon: '📢', text: 'The captain on the PA: "Ladies and gentlemen, we have landed. The ground noticed too."' },
    { trait: 'hard', icon: '🍪', text: 'The cabin crew’s trolley handed out the biscuits all by itself. Free snacks for rows 10 to 14!' },
    // ---------- bounce ----------
    { trait: 'bounce', icon: '🏀', text: 'Touchdown, lift-off, touchdown: two landings for the price of one. The passengers want double air miles.' },
    { trait: 'bounce', icon: '🦘', text: 'A tourist from Australia nodded with respect: "Now that’s a proper kangaroo landing!"' },
    { trait: 'bounce', icon: '🐶', text: 'The dachshund in the carrier under seat 15A barked twice — once for each touchdown. Good dog, good counting.' },
    { trait: 'bounce', icon: '🎾', text: 'The tennis fans in row 20 shouted "OUT!" after the first bounce and "IN!" after the second.' },
    { trait: 'bounce', icon: '🍿', text: 'The popcorn in row 9 bounced in step with the aeroplane: up, down, up, down. Synchronised bouncing — a perfect ten!' },
    { trait: 'bounce', icon: '📢', text: 'The cabin crew on the PA: "Please stay seated until the aircraft has finished landing. All of its landings."' },
    // ---------- bank ----------
    { trait: 'bank', icon: '🧃', text: 'All the juice in the cabin slid to the left. Then the magazines, the bags and the flight attendant’s smile.' },
    { trait: 'bank', icon: '🏍️', text: 'A biker in row 18 nodded: "Lovely lean into the corner." There was no corner.' },
    { trait: 'bank', icon: '📸', text: 'The tourist at the window got a perfect photo of the runway — from about thirty centimetres.' },
    { trait: 'bank', icon: '🤝', text: 'Half the cabin leaned left, so the other half leaned right to help. Teamwork!' },
    { trait: 'bank', icon: '✈️', text: 'A girl in row 3 asked if the aeroplane was waving at someone with its wing. The captain says yes — at the runway.' },
    { trait: 'bank', icon: '🧘', text: 'A yoga teacher in row 11 recognised the pose at once: "Side plank — beautiful!"' },
    // ---------- offset: off the centreline ----------
    { trait: 'offset', icon: '🚗', text: 'A driving instructor in row 14 stamped on a brake that wasn’t there: "Keep to your lane, please!"' },
    { trait: 'offset', icon: '📏', text: 'The centreline was waiting for us right in the middle. We waved to it from a few metres to the side.' },
    { trait: 'offset', icon: '🌼', text: 'The passengers on one side got a close-up of the runway edge lights and one very surprised dandelion.' },
    { trait: 'offset', icon: '🎳', text: 'A boy in row 6 compared it to bowling: "Not a strike, but at least the ball stayed in the lane!"' },
    { trait: 'offset', icon: '🗺️', text: 'The captain on the PA: "We have arrived at our destination. Slightly to one side of our destination."' },
    // ---------- long: far down the runway ----------
    { trait: 'long', icon: '🛬', text: 'We touched down so far along that the welcome sign at the start of the runway had time to wave goodbye.' },
    { trait: 'long', icon: '⏱️', text: 'Half the runway flew by underneath before the wheels said hello. The other half got used up very quickly.' },
    { trait: 'long', icon: '🦆', text: 'The ducks at the far end of the runway are moving house. They say it has got too exciting there.' },
    { trait: 'long', icon: '📢', text: 'The captain on the PA: "We saved the airport a lot of runway today — we hardly touched the first half."' },
    { trait: 'long', icon: '👓', text: 'The brakes worked so hard that the glasses of the man in 2A slid to the tip of his nose — and stayed there in surprise.' },
    { trait: 'long', icon: '🏘️', text: 'A kid at the window: "Daddy, are we landing, or are we driving to the next town?"' },
    // ---------- butter: a feather-soft touchdown ----------
    { trait: 'butter', icon: '⭐', text: 'The landing was so soft that the granny in row 7 didn’t drop a single stitch. She is knitting the captain a medal.' },
    { trait: 'butter', icon: '👏', text: 'The whole cabin clapped. The man asleep in 23C clapped too — in his sleep. He still doesn’t know we’ve landed.' },
    { trait: 'butter', icon: '📢', text: 'The captain on the PA: "Ladies and gentlemen, we have landed." Row 9: "Already? We thought we were still flying!"' },
    { trait: 'butter', icon: '🐶', text: 'The dachshund under seat 15A didn’t even wake up. It just wagged its tail once, politely, as if to say: "Smooth."' },
    { trait: 'butter', icon: '🪙', text: 'A girl in row 5 stood a coin on its edge on her armrest before landing. At the gate it was still standing. She wants to be a pilot now.' },
    // ---------- good: a nice, uneventful landing ----------
    { trait: 'good', icon: '🧩', text: 'A nice, ordinary landing. The passengers hardly looked up from their crosswords — the best review a pilot can get.' },
    { trait: 'good', icon: '📢', text: 'The captain on the PA: "Welcome to your destination, right on the centreline." The centreline says it was a pleasure.' },
    { trait: 'good', icon: '🧸', text: 'A teddy bear in row 8 gave the landing seven out of ten. He gives the dentist a two, so that’s very high praise.' },
    { trait: 'good', icon: '☕', text: 'The coffee in row 12 stayed right in its cup. Its owner looked almost disappointed — he had heard about the show.' },
    { trait: 'good', icon: '👶', text: 'The baby in row 15 slept through the whole landing. Her parents want to book this captain for every bedtime.' }
  ],
  cargo: [
    { trait: 'hard', icon: '🥚', text: 'A crate of 10 000 eggs in the hold. Counted after landing: 9 998 eggs and two very early omelettes.' },
    { trait: 'hard', icon: '🎹', text: 'The grand piano for the concert hall played one loud chord all by itself on touchdown. The critics call it bold.' },
    { trait: 'hard', icon: '🛏️', text: 'The pallet of pillows took the landing like heroes. They are a little flatter now and would like a word with the captain.' },
    { trait: 'bounce', icon: '🐧', text: 'The penguins for the zoo took the bounce for a wave and lined up to surf it again.' },
    { trait: 'bounce', icon: '🏀', text: 'A load of basketballs in the hold. Now nobody can tell who bounced — the balls or the aeroplane.' },
    { trait: 'bank', icon: '📦', text: 'All the parcels slid over to one wall. The loader says they were just queuing for the door.' },
    { trait: 'bank', icon: '🍉', text: 'The watermelons rolled to the low side and back, like a bowling ball that couldn’t make up its mind. All present, all round.' },
    { trait: 'offset', icon: '💐', text: 'The flowers for the market got a close look at the runway edge lights — and decided they are prettier.' },
    { trait: 'long', icon: '🏁', text: 'We touched down so far along that the forwarder asked if the parcels get off here or at the next airport.' },
    { trait: 'long', icon: '🧀', text: 'The big cheeses in the hold rolled to the front under the hard braking. Well, they are wheels.' },
    // ---------- butter: a feather-soft touchdown ----------
    { trait: 'butter', icon: '🥚', text: 'The crate of eggs arrived with every single egg in one piece. The forwarder counted them twice and then shook the captain’s hand.' },
    { trait: 'butter', icon: '🎹', text: 'The grand piano for the concert hall didn’t make a single sound on touchdown. The critics call it a masterpiece of silence.' },
    { trait: 'butter', icon: '🐧', text: 'The penguins for the zoo didn’t even notice that we had landed. They are still waiting for the take-off.' },
    // ---------- good: a nice, uneventful landing ----------
    { trait: 'good', icon: '📦', text: 'Every parcel stayed exactly where the loader put it. He calls it the quietest flight of his week.' },
    { trait: 'good', icon: '🍉', text: 'The watermelons didn’t roll an inch. They are a little bored, but very much in one piece.' },
    { trait: 'good', icon: '📋', text: 'The ground crew opened the hold, looked at the neat rows of cargo and nodded: "Boring. We love boring."' }
  ],
  bush: [
    { trait: 'hard', loads: ['fish'], icon: '🐟', text: 'On touchdown the fish in their boxes leapt as if they were back in the river. Fresh — very fresh.' },
    { trait: 'hard', loads: ['medevac'], icon: '🩺', text: 'The patient woke up and asked the paramedic who had been shaking the stretcher. The paramedic pointed at the cockpit.' },
    { trait: 'hard', icon: '🍵', text: 'The doctor’s tea jumped out of the mug and landed neatly back in. Even the tea landed softer.' },
    { trait: 'bounce', icon: '🦌', text: 'The reindeer herders by the strip counted two landings and gave a thumbs-up for each.' },
    { trait: 'bounce', loads: ['mail'], icon: '✉️', text: 'The mail bounced along with the aeroplane. Every letter in the bags is now stamped twice.' },
    { trait: 'bank', icon: '🎣', text: 'The fishermen at the lake knew that lean at once: "That’s just how you lean when the big one bites!"' },
    { trait: 'bank', loads: ['medevac'], icon: '🤹', text: 'The paramedic held the stretcher level with one hand and the drip with the other. A tightrope walker would be proud.' },
    { trait: 'offset', icon: '🌲', text: 'We landed so far from the middle of the strip that a moose by the edge stepped aside to make room.' },
    { trait: 'long', icon: '📮', text: 'The village postmaster waited at the start of the strip. We stopped at the other end. He had a lovely walk.' },
    { trait: 'long', loads: ['medevac'], icon: '🚑', text: 'The ambulance waited at the threshold, then raced us down the strip. It says it won.' },
    // ---------- butter: a feather-soft touchdown ----------
    { trait: 'butter', icon: '🦌', text: 'The reindeer by the strip didn’t even lift their heads from the moss. Out in the tundra, that’s a standing ovation.' },
    { trait: 'butter', icon: '🏡', text: 'The village kids by the strip had a bet on the moment the wheels would touch. Nobody won — nobody saw it happen.' },
    { trait: 'butter', loads: ['medevac'], icon: '🩺', text: 'The patient slept through the whole landing. The paramedic wrote on the chart: "Pilot — soft as a feather pillow."' },
    // ---------- good: a nice, uneventful landing ----------
    { trait: 'good', icon: '🌲', text: 'A moose by the edge of the strip watched us land, nodded and went back to his lunch. Nothing to see here — just a good landing.' },
    { trait: 'good', loads: ['mail'], icon: '✉️', text: 'The postmaster checked the mail bags: every letter dry, every stamp straight. "Nine out of ten — ten if you bring the newspapers too."' },
    { trait: 'good', loads: ['fish'], icon: '🐟', text: 'The fish boxes didn’t move an inch on touchdown. At the market the fish will look as if they flew business class.' }
  ]
};

const FLIGHT_JOKES = [
  // ---------- goAround: went round and flew the approach again ----------
  { trait: 'goAround', groups: ['pax'], icon: '🎡', text: 'A boy in row 4 asked for "one more lap, please!" — and the captain actually gave him one. Best flight ever, he says.' },
  { trait: 'goAround', groups: ['pax'], icon: '📸', text: 'The tourists at the windows got to photograph the city twice. The second set came out much better.' },
  { trait: 'goAround', groups: ['cargo'], icon: '📦', text: 'The parcels got an extra lap around the airport free of charge. The express ones were the most impatient.' },
  { trait: 'goAround', groups: ['bush'], icon: '🦌', text: 'The reindeer herders watched us fly past the strip, turn round and come back. They think we were counting their reindeer.' },
  { trait: 'goAround', icon: '🗼', text: 'The tower watched us fly past and come round again. "Missed us already?" asked the controller.' },
  { trait: 'goAround', icon: '🍰', text: 'Every good pilot knows: a go-around is not a mistake, it’s a second helping. And the second helping is always tastier.' },
  // ---------- grass: rolled on the grass ----------
  { trait: 'grass', groups: ['pax'], icon: '🌼', text: 'A granny in row 7 was delighted: "At last, a pilot who takes us to see the flowers!"' },
  { trait: 'grass', groups: ['pax'], icon: '🐄', text: 'A girl at the window asked if we were landing at a farm now. The captain says it was just a short scenic detour.' },
  { trait: 'grass', groups: ['cargo'], icon: '💐', text: 'The flowers in the hold smelled the meadow and perked up at once. The florist sends the captain her thanks.' },
  { trait: 'grass', groups: ['bush'], icon: '🌲', text: 'A moose was grazing beside the taxiway, so we rolled over onto the grass to say hello. He was not impressed.' },
  { trait: 'grass', icon: '🚜', text: 'The aeroplane rolled across the grass like a giant lawnmower. The airport gardener asked if we could come back on Tuesdays.' },
  { trait: 'grass', icon: '🌱', text: 'The ground crew found a daisy stuck in the nose wheel. It now stands in a cup of water in their office.' },
  // ---------- taxiFast: a taxi overspeed ----------
  { trait: 'taxiFast', groups: ['pax'], icon: '🏎️', text: 'A racing fan in row 16 timed the taxi on his watch: "A new lap record!" The cabin crew asked him to stay in his seat.' },
  { trait: 'taxiFast', groups: ['pax'], icon: '👒', text: 'A granny in row 2 held on to her hat: "Young man, this is an aeroplane, not a racing car!"' },
  { trait: 'taxiFast', groups: ['cargo'], icon: '📦', text: 'The forwarder watched us race to the stand and nodded: "Now that’s what I call express delivery."' },
  { trait: 'taxiFast', groups: ['bush'], icon: '🦌', text: 'A reindeer by the strip tried to race us to the parking spot. The reindeer won — he knows a shortcut.' },
  { trait: 'taxiFast', icon: '🚦', text: 'The tower on the radio: "Slow down, please — the taxiway isn’t going anywhere."' },
  { trait: 'taxiFast', icon: '🚐', text: 'The follow-me car had to hurry so much that it ended up following us. The driver wants to rename it "follow-you".' },
  // ---------- emergency: a checklist handled in flight ----------
  { trait: 'emergency', groups: ['pax'], icon: '📢', text: 'The crew handled it so calmly that the passengers thought the captain’s announcement was just an interesting story.' },
  { trait: 'emergency', groups: ['pax'], icon: '🧸', text: 'A girl in row 3 told her teddy bear not to worry: "The pilots have a checklist for everything." She was right.' },
  { trait: 'emergency', groups: ['cargo'], icon: '📋', text: 'The forwarder asked how the flight went. The crew showed him the checklist — every line ticked, neat as a shopping list.' },
  { trait: 'emergency', groups: ['bush'], icon: '🏡', text: 'The whole village came out to meet the aeroplane. The pilot told the story so calmly that the kids want it as a bedtime tale.' },
  { trait: 'emergency', groups: ['bush'], loads: ['medevac'], icon: '🩺', text: 'The paramedic nodded at the cockpit: "Steady hands and a good checklist. I could use you two in the ambulance."' },
  { trait: 'emergency', icon: '✅', text: 'Checklist done, every item ticked, aeroplane safely on the ground. Your old flight instructor would hang that one on the wall.' },
  { trait: 'emergency', icon: '🧰', text: 'The engineers met the aeroplane with a toolbox and a thermos. The crew had already done the hard part — by the book.' },
  // ---------- lowFuel: the tanks nearly dry ----------
  { trait: 'lowFuel', groups: ['pax'], icon: '⛽', text: 'A boy in row 4 asked if the aeroplane was thirsty. The fuel truck was already waiting at the stand with a very big straw.' },
  { trait: 'lowFuel', groups: ['pax'], icon: '🍵', text: 'A granny in row 7 offered the crew her thermos of tea, just in case. The captain said thank you, but the engines prefer kerosene.' },
  { trait: 'lowFuel', groups: ['cargo'], icon: '📦', text: 'The forwarder looked at the fuel gauge, then at his parcels: "Good thing nobody had to get out and push."' },
  { trait: 'lowFuel', groups: ['bush'], icon: '🛢️', text: 'At the strip the pilot gave the old fuel drum a hug. It has never been so popular in its life.' },
  { trait: 'lowFuel', icon: '🔔', text: 'The ground crew opened the fuel cap and heard an echo. They are filling her up before she starts to complain.' },
  { trait: 'lowFuel', icon: '🍽️', text: 'The refueller checked the gauges and whistled: "Next time bring her round for a snack a little sooner."' },
  // ---------- crosswind: crabbing in ----------
  { trait: 'crosswind', groups: ['pax'], icon: '🚗', text: 'A girl at the window saw the runway coming at us sideways and asked if we were parking like Daddy does.' },
  { trait: 'crosswind', groups: ['pax'], icon: '💨', text: 'The wind tried to push us over to the next runway. The captain politely said no, and the cabin clapped for the captain, not the wind.' },
  { trait: 'crosswind', groups: ['cargo'], icon: '🦀', text: 'We came in crabbing like a real crab. The crate of lobsters in the hold approved of the technique.' },
  { trait: 'crosswind', groups: ['bush'], icon: '🌬️', text: 'The windsock at the strip stood straight out sideways like a pointing finger. The herders say it was pointing at the best landing of the year.' },
  { trait: 'crosswind', icon: '🗼', text: 'The tower: "Wind from the side, strong and gusty." The aeroplane came in sideways and still said hello to the centreline.' },
  { trait: 'crosswind', icon: '👔', text: 'The windsock stood out as stiff as if somebody had ironed it. The crew crabbed in, straightened up at the last moment and landed like it was a calm day.' },
  // ---------- snow at the arrival ----------
  { trait: 'snow', groups: ['pax'], icon: '⛄', text: 'A girl in row 3 pressed her nose to the window: "Snow! Can we build a snowman before the bus comes?"' },
  { trait: 'snow', groups: ['pax'], icon: '📱', text: 'A tourist from Australia saw snow for the first time and filmed every single snowflake. His phone is full now.' },
  { trait: 'snow', groups: ['cargo'], icon: '🍦', text: 'The ice cream in the hold was delighted with the weather outside. It says it feels right at home.' },
  { trait: 'snow', groups: ['bush'], icon: '☃️', text: 'The village kids built a snow aeroplane by the strip to welcome us. It looked a lot like ours, only with a carrot for a nose.' },
  { trait: 'snow', icon: '❄️', text: 'The snowplough cleared the runway just in time, and its driver waved as we landed. He says he likes us much better than the snow.' },
  { trait: 'snow', icon: '🧤', text: 'The ground crew wore so many layers that it took them a whole minute to wave. They waved anyway.' },
  // ---------- night: a night flight ----------
  { trait: 'night', groups: ['pax'], icon: '🌃', text: 'Half the cabin was asleep when we landed. The other half was counting the city lights — they got to a million and gave up.' },
  { trait: 'night', groups: ['pax'], icon: '🌙', text: 'A boy in row 6 asked the captain to land on the Moon next time. The captain promised to think about it.' },
  { trait: 'night', groups: ['cargo'], icon: '🎅', text: 'The parcels flew through the night so that people can open them in the morning. The crew calls it being Father Christmas all year round.' },
  { trait: 'night', groups: ['bush'], icon: '🌌', text: 'Under the northern lights the strip looked like a stage. Even a moose turned up to watch the show.' },
  { trait: 'night', icon: '✨', text: 'The runway lights shone in two long rows, like a path made of stars. The crew says that view never gets old.' },
  { trait: 'night', icon: '🥱', text: 'The controller yawned on the radio: "Good night, and thank you for keeping me company."' },
  // ---------- early: well ahead of the planned time ----------
  { trait: 'early', groups: ['pax'], icon: '🚗', text: 'We landed so early that the people meeting row 14 are still looking for a parking space.' },
  { trait: 'early', groups: ['pax'], icon: '💨', text: 'A girl in row 5 asked if the captain knows a secret shortcut in the sky. He does: it’s called a tailwind.' },
  { trait: 'early', groups: ['cargo'], icon: '📦', text: 'The parcels arrived before the delivery van did. They are waiting on the apron, very politely.' },
  { trait: 'early', groups: ['bush'], icon: '🥪', text: 'We landed so early that the village postmaster hadn’t finished his breakfast. He came to the strip with a sandwich in his hand.' },
  { trait: 'early', icon: '⌚', text: 'The ground crew looked at their watches, then at the aeroplane, then at their watches again: "Early? Nobody is ever early!"' },
  { trait: 'early', icon: '☕', text: 'The airport café hadn’t even put the kettle on when we parked. The crew made their own tea.' },
  // ---------- late: well behind it ----------
  { trait: 'late', groups: ['pax'], icon: '😴', text: 'The captain on the PA: "Thank you for your patience." The man in 23C: "What patience? I was asleep."' },
  { trait: 'late', groups: ['pax'], icon: '📖', text: 'We arrived so late that a girl in row 3 finished her whole book. Now she is reading it again, to her teddy bear.' },
  { trait: 'late', groups: ['cargo'], icon: '💐', text: 'The flowers for the market arrived a little late, so they are trying to look extra fresh to make up for it.' },
  { trait: 'late', groups: ['bush'], icon: '🦌', text: 'The reindeer herders waited so long by the strip that their reindeer fell asleep. The engines woke them up, and they forgave us at once.' },
  { trait: 'late', icon: '🤹', text: 'The ground crew waited so long that they learned to juggle traffic cones. They put on a show when we arrived.' },
  { trait: 'late', icon: '🐢', text: 'Late, but safe and smooth — and that is the order that matters. The tower says it would rather wait than worry.' }
];
