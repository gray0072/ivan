'use strict';

// ============================================================
// World Aviation — the comic lines after a hard but successful
// landing, as plain data: by the client group of the flight (pax:
// a flight with passengers; cargo: freight and mail; bush: the bush
// and air ambulance operators), each with the trait of the
// touchdown it plays on (hard: the impact; bounce; bank; offset:
// off the centreline; long: far down the runway) and an icon; a
// line about one load only (the patient, the fish, the mail) names
// the contract types it fits in `loads`.
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
    { trait: 'long', icon: '🏘️', text: 'A kid at the window: "Daddy, are we landing, or are we driving to the next town?"' }
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
    { trait: 'long', icon: '🧀', text: 'The big cheeses in the hold rolled to the front under the hard braking. Well, they are wheels.' }
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
    { trait: 'long', loads: ['medevac'], icon: '🚑', text: 'The ambulance waited at the threshold, then raced us down the strip. It says it won.' }
  ]
};
