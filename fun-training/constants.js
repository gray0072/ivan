// Fun Training — tuning constants.

const STORAGE_KEY = 'funTraining.v1';

// Math operations: id, sign shown in tasks, name.
const OPERATIONS = [
  { id: 'add', sign: '+', name: 'Addition' },
  { id: 'sub', sign: '−', name: 'Subtraction' },
  { id: 'mul', sign: '×', name: 'Multiplication' },
  { id: 'div', sign: '÷', name: 'Division' },
];

// Number limits of an operation: addition = sum, subtraction = minuend, multiplication = product, division = dividend.
const LIMITS = [10, 20, 50, 100, 500, 1000, 5000, 10000];

// Expected seconds a child needs for one operator of this kind, per limit (index matches LIMITS).
const OP_TIME = {
  add: [2.5, 3.5, 4.5, 6, 9, 11, 14, 17],
  sub: [3, 4, 5, 7, 10, 12, 15, 18],
  mul: [3, 3.5, 4.5, 6, 10, 13, 17, 21],
  div: [3.5, 4, 5, 6.5, 11, 14, 18, 22],
};
const READ_TIME = 1.5;        // s to read a task and press one of the 4 answers
const TYPE_TIME = 2;          // s to read a task in typing mode
const TYPE_DIGIT_TIME = 0.4;  // s per typed digit of the answer
const MIN_TASK_TIME = 3;      // s, the process never fails faster than this

const OPERAND_COUNTS = [2, 3, 4];

// Speeds: seconds until the process fails = expected task time × mul; price = the task's price multiplier.
const SPEEDS = [
  { id: 'vslow', name: 'Very slow', icon: '🐌', mul: 3.0, price: 0.5 },
  { id: 'slow', name: 'Slow', icon: '🐢', mul: 2.2, price: 0.75 },
  { id: 'medium', name: 'Medium', icon: '🐇', mul: 1.6, price: 1 },
  { id: 'fast', name: 'Fast', icon: '🐆', mul: 1.2, price: 1.5 },
  { id: 'vfast', name: 'Very fast', icon: '🚀', mul: 0.9, price: 2 },
];

const ANSWER_MODES = [
  { id: 'choice', name: 'Pick 1–4', icon: '🔢' },
  { id: 'type', name: 'Type it', icon: '⌨️' },
];
const CHOICE_COUNT = 4;          // answer buttons in choice mode
const TYPE_MAX_DIGITS = 6;       // longest typed answer
const LESSON_LENGTHS = [10, 15, 20]; // correct answers needed to win a lesson

// Task types; a lesson picks each task's type at random from the player's enabled ones.
const TASK_TYPES = [
  { id: 'math', name: 'Math', icon: '🔢' },
  { id: 'scale', name: 'Scales', icon: '📏' },
  { id: 'read', name: 'Reading', icon: '📖' },
];

// Scales: read the number a pointer shows on a ruler-like scale.
const SCALE_PARTS = [2, 4, 5, 10];             // choosable parts (minor divisions) between two big ticks
const SCALE_LIMITS = [20, 100, 1000, 10000];   // the biggest number on the scale
const SCALE_LABELS = [
  { id: 'all', name: 'Every big tick' },
  { id: 'some', name: 'Every other one' },     // harder: the big ticks between two numbers are blank
];
// Big-tick steps the generator may use (each must split evenly into the chosen parts).
const SCALE_MAJORS = [2, 4, 5, 10, 20, 25, 40, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
const SCALE_MIN_MAJOR = 1 / 200;  // smallest big-tick step as a share of the limit (no 1-steps up to 10 000)
const SCALE_BIG_TICKS = { all: 3, some: 4 }; // big-tick intervals shown (2 if they don't fit the limit)
// Expected seconds to work out one part and count to the pointer, by parts (before the answer time).
const SCALE_TIME = { 2: 3, 4: 4.5, 5: 4.5, 10: 5 };
const SCALE_LIMIT_TIME = [0, 1, 2.5, 4];  // extra s for bigger numbers, index matches SCALE_LIMITS
const SCALE_SOME_TIME = 2.5;              // extra s when only every other big tick has a number

// Reading: a voice (the device's speech synthesis) says a letter, a word or a short phrase; pick it among four
// written options. Words and phrases per language live in tasks/words.js.
const READ_LANGS = [
  { id: 'sv', name: 'Swedish' },
  { id: 'en', name: 'English' },
  { id: 'ru', name: 'Russian' },
];
const READ_SIZES = [0, 3, 4, 5, 6, 7, 8, 9, 10]; // 0 = single letters, N = words up to N letters
const READ_WORD_COUNTS = [1, 2, 3];              // words in a task (with letters: always one letter)
const READ_SPAN = 2;          // a word of "up to N letters" is N − READ_SPAN … N letters long (at least 2)
const READ_MIN_PICK = 6;      // fewer phrases than this with the longest word in that span → any that fit
const READ_LISTEN_TIME = 1.2; // s the voice takes to say it
const READ_LETTER_TIME = 1.2; // s to find a letter among four
const READ_CHAR_TIME = 0.35;  // s per letter of the answer to read the four options
const READ_WORD_TIME = 1;     // extra s per word beyond the first
const READ_VOICE_RATE = 0.85; // speech rate, 1 = normal: a bit slower for kids
const READ_RECENT = 40;       // an answer isn't repeated within this many reading tasks
const READ_NEAR_WORDS = 8;    // wrong options of a word come from this many real words spelled most like it

const DEFAULT_SETTINGS = {
  answerMode: 'choice',
  lessonLength: 10,
  types: ['math'],
  math: {
    ops: ['add'],
    operands: 2,
    mix: false,
    limits: { add: 20, sub: 20, mul: 100, div: 100 },
    speed: 'medium',
  },
  scale: {
    parts: [4, 5, 10],
    limit: 100,
    labels: 'all',
    speed: 'medium',
  },
  read: {
    lang: 'en',   // a new player gets the browser's language when it is one of READ_LANGS
    size: 4,
    words: 1,
    speed: 'medium',
  },
};

// Task price: coins for each correct answer, computed from the task type's settings.
// Points are added up (the hardest choice + one for each extra complication), then multiplied, rounded, at least 1.
// Math points of an operation by its limit (index matches LIMITS): every step up adds at least one coin.
const OP_PRICE = {
  add: [2, 3, 4, 5, 6, 7, 8, 9],
  sub: [2, 3, 4, 5, 7, 8, 9, 10],
  mul: [2, 3, 4, 5, 7, 8, 10, 12],
  div: [2, 3, 4, 6, 7, 9, 11, 13],
};
const PRICE_EXTRA_OP = 1;                  // + for each enabled operation beyond the hardest one
const PRICE_MIX = 2;                       // + when one task mixes operations
const PRICE_OPERANDS = { 2: 1, 3: 1.75, 4: 2.5 }; // × by numbers in a task (2 and 3 operators instead of 1)
const SCALE_LIMIT_PRICE = [1, 2, 3, 4];    // Scales points by "numbers up to" (index matches SCALE_LIMITS)
const SCALE_PARTS_PRICE = { 2: 1, 4: 2, 5: 2, 10: 3 }; // + for the hardest parts choice
const SCALE_SOME_PRICE = 2;                // + when only every other big tick has a number
const READ_SIZE_PRICE = { 0: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 4, 9: 4, 10: 4 }; // Reading points: letters / words up to N
const READ_WORDS_PRICE = { 1: 1, 2: 1.5, 3: 2 }; // × by words in a task
const PRICE_TYPED = 1.25;                  // × when answers are typed (no guessing among four; Reading is always picked)

// Share of the earned coins a won lesson pays, by its mistakes: the first rule with mistakes <= maxMistakes.
// rate (0–3) also colours the step on the track; share = rate / MAX_RATE.
const COIN_RULES = [
  { maxMistakes: 1, rate: 3 },
  { maxMistakes: 3, rate: 2 },
  { maxMistakes: 5, rate: 1 },
  { maxMistakes: Infinity, rate: 0 },
];

const MAX_RATE = 3;     // the best rate (COIN_RULES[0]); steps done below it can be replayed for more coins
const TRACK_LEN = 10;   // steps per level; all of them perfect (rate 3) = the level's star and the next level opens
const BOSS_EVERY = 5;   // every Nth step is a boss step
const BOSS_HITS = 3;    // correct answers the boss needs (its last task)
// Boss kinds by the step's place in its level (5th / 10th). timeMul: the boss round's safety level drains over
// this × a task's fail time, with no refill; gems: diamonds 💎 for beating it with 0–1 mistakes
// (the share by mistakes follows COIN_RULES; a replay pays only what beats the step's best).
const BOSS_KINDS = {
  5: { name: 'Boss', icon: '🐲', note: '🐲 BOSS!', hint: '', timeMul: 2, gems: 3 },
  10: { name: 'Big boss', icon: '👑', note: '👑 BIG BOSS!', hint: ' — twice as fast!', timeMul: 1, gems: 6 }, // twice as fast as the 5th step's boss
};
const BOSS_NOTE_TIME = 1.8; // s the "BOSS!" note stays on the scene
// Star levels in order, from wood to diamond; after the last one every further level is that one again.
// light / color / dark: the star's gradient and outline; kind: its look (wood grain, stone speckles, metal shine, gem facets).
const STAR_TIERS = [
  { name: 'Wooden', light: '#f2d49c', color: '#c99a5b', dark: '#7d5630', kind: 'wood' },
  { name: 'Stone', light: '#dcd6c8', color: '#a39c8c', dark: '#5f594d', kind: 'stone' },
  { name: 'Bronze', light: '#ffbf94', color: '#d46f32', dark: '#86350f', kind: 'metal' },
  { name: 'Iron', light: '#c4cfd9', color: '#6b7a87', dark: '#343e47', kind: 'metal' },
  { name: 'Silver', light: '#ffffff', color: '#c9d3dd', dark: '#7d8a96', kind: 'metal' },
  { name: 'Gold', light: '#fff3a0', color: '#ffc928', dark: '#b07d00', kind: 'metal' },
  { name: 'Platinum', light: '#f4fffd', color: '#a6e8df', dark: '#4fa79c', kind: 'metal' },
  { name: 'Emerald', light: '#a8f7cf', color: '#2fc48a', dark: '#0f6b46', kind: 'gem' },
  { name: 'Ruby', light: '#ffa3b8', color: '#f2385f', dark: '#99102f', kind: 'gem' },
  { name: 'Diamond', light: '#ffffff', color: '#bfeaff', dark: '#4f9fd0', kind: 'diamond' },
];
const FIREWORKS_TIME = 4;  // s of fireworks when a level is completed

// Processes shown on the home screen; ready = playable.
const PROCESSES = [
  { id: 'flower', name: 'Grow a Flower', icon: '🌷', ready: true,
    winTitle: 'The flower is in full bloom!', winIcon: '🌸',
    loseTitle: 'The flower wilted…', loseIcon: '🥀' },
  { id: 'zombies', name: 'Zombie Defense', icon: '🧟', ready: true,
    winTitle: 'The family is safe!', winIcon: '🏠',
    loseTitle: 'The zombies got in!', loseIcon: '🧟' },
  { id: 'railway', name: 'Railway Rush', icon: '🚂', ready: true,
    winTitle: 'All aboard — the train made it!', winIcon: '🚉',
    loseTitle: 'The rails ran out!', loseIcon: '🚧' },
  { id: 'balloon', name: 'Balloon Flight', icon: '🎈', ready: true,
    winTitle: 'Land ho! You reached the island!', winIcon: '🏝️',
    loseTitle: 'Splash! The balloon fell into the sea', loseIcon: '🌊' },
  { id: 'campfire', name: 'Campfire Night', icon: '🔥', ready: true,
    winTitle: 'Good morning! You kept the fire going!', winIcon: '🌅',
    loseTitle: 'The fire went out…', loseIcon: '🐺' },
  { id: 'panda', name: 'Panda Snack', icon: '🐼', ready: true,
    winTitle: 'The panda is full and happy!', winIcon: '🐼',
    loseTitle: 'The panda is sad and hungry…', loseIcon: '😢' },
];

// Characters a player picks (drawn in characters/): all share one body, so every piece of clothing fits all of them.
// loves: favourite foods (a happy dance, FOOD_LOVE_FILL × fullness); dislikes: foods it makes a face at (still eats).
const CHARACTERS = [
  { id: 'kitty', name: 'Kitty', emoji: '🐱', loves: ['fish', 'milk'], dislikes: ['carrot'] },
  { id: 'puppy', name: 'Puppy', emoji: '🐶', loves: ['sausage', 'pizza'], dislikes: ['broccoli'] },
  { id: 'bunny', name: 'Bunny', emoji: '🐰', loves: ['carrot', 'strawberry'], dislikes: ['sausage'] },
  { id: 'panda', name: 'Panda', emoji: '🐼', loves: ['bamboo', 'dumpling'], dislikes: ['fish'] },
  { id: 'fox', name: 'Fox', emoji: '🦊', loves: ['drumstick', 'strawberry'], dislikes: ['bamboo'] },
  { id: 'bear', name: 'Bear', emoji: '🐻', loves: ['honey', 'fish'], dislikes: ['broccoli'] },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', loves: ['cupcake', 'apple'], dislikes: ['drumstick'] },
  { id: 'dragon', name: 'Dragon', emoji: '🐲', loves: ['chili', 'drumstick'], dislikes: ['icecream'] },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', loves: ['fish', 'icecream'], dislikes: ['chili'] },
  { id: 'lion', name: 'Lion', emoji: '🦁', loves: ['steak', 'sausage'], dislikes: ['broccoli'] },
];
// Avatars of older saves -> the nearest character.
const OLD_AVATARS = { '🦊': 'fox', '🐼': 'panda', '🐯': 'lion', '🐸': 'dragon', '🐵': 'bear', '🦁': 'lion', '🐰': 'bunny',
  '🐻': 'bear', '🐨': 'panda', '🐙': 'kitty', '🦄': 'unicorn', '🐲': 'dragon', '🐧': 'penguin', '🦉': 'penguin', '🐝': 'bear', '🐢': 'dragon' };

// Food: eaten at once. price in coins (gems: in diamonds instead), fill = fullness points (of FULL_MAX).
// taste: a special reaction for everyone who doesn't love it — sour (lemon), spicy (chili: steam from the ears),
// cold (ice cream: shivers, only for those who dislike it); treat: everyone loves it.
const FOODS = [
  { id: 'lemon', name: 'Lemon', price: 3, fill: 8, taste: 'sour' },
  { id: 'broccoli', name: 'Broccoli', price: 4, fill: 15 },
  { id: 'apple', name: 'Apple', price: 5, fill: 15 },
  { id: 'carrot', name: 'Carrot', price: 5, fill: 15 },
  { id: 'bamboo', name: 'Bamboo', price: 5, fill: 15 },
  { id: 'banana', name: 'Banana', price: 6, fill: 18 },
  { id: 'chili', name: 'Chili pepper', price: 6, fill: 12, taste: 'spicy' },
  { id: 'milk', name: 'Milk', price: 8, fill: 20 },
  { id: 'fish', name: 'Fish', price: 10, fill: 25 },
  { id: 'sausage', name: 'Sausage', price: 10, fill: 25 },
  { id: 'strawberry', name: 'Strawberries', price: 12, fill: 25 },
  { id: 'drumstick', name: 'Drumstick', price: 14, fill: 30 },
  { id: 'honey', name: 'Honey', price: 15, fill: 30 },
  { id: 'dumpling', name: 'Dumplings', price: 18, fill: 35 },
  { id: 'steak', name: 'Steak', price: 20, fill: 40 },
  { id: 'icecream', name: 'Ice cream', price: 20, fill: 30, taste: 'cold' },
  { id: 'pizza', name: 'Pizza', price: 25, fill: 50 },
  { id: 'cupcake', name: 'Rainbow cupcake', price: 30, fill: 40 },
  { id: 'cake', name: 'Birthday cake', price: 60, fill: 80, treat: true },
  { id: 'goldapple', name: 'Golden apple', gems: 2, fill: 100, treat: true },
];
const FULL_MAX = 100;          // fullness points of a full tummy
const FULL_START = 50;         // a new character is a bit hungry
const HUNGER_HOURS = 48;       // real hours from full to empty (it keeps dropping while the game is closed)
const FULL_HAPPY = 70;         // at or above: happy face
const FULL_HUNGRY = 35;        // below: hungry (sad face, tummy rumbles)
const FULL_STARVING = 12;      // below: very hungry (a tear)
const FULL_REFUSE = 95;        // at or above: "I'm full!", no more food
const FOOD_LOVE_FILL = 1.5;    // × fullness from a favourite food

// Things to wear and to put in the room, by slot. kind: 'wear' (on the character) or 'room'.
// def: what the slot holds before anything is bought (owned from the start, the "poor" look); none = empty.
const ITEM_SLOTS = [
  { id: 'head', kind: 'wear', name: 'Hats', icon: '🎩' },
  { id: 'face', kind: 'wear', name: 'Glasses', icon: '👓' },
  { id: 'neck', kind: 'wear', name: 'Neck', icon: '🧣' },
  { id: 'body', kind: 'wear', name: 'Outfits', icon: '👕' },
  { id: 'back', kind: 'wear', name: 'Back', icon: '🎒' },
  { id: 'feet', kind: 'wear', name: 'Shoes', icon: '👟' },
  { id: 'hand', kind: 'wear', name: 'In hand', icon: '🎈' },
  { id: 'wall', kind: 'room', name: 'Walls', icon: '🧱', def: 'plaster' },
  { id: 'floor', kind: 'room', name: 'Floors', icon: '🟫', def: 'boards' },
  { id: 'bed', kind: 'room', name: 'Beds', icon: '🛏️', def: 'box' },
  { id: 'table', kind: 'room', name: 'Tables', icon: '🪑', def: 'crate' },
  { id: 'lamp', kind: 'room', name: 'Lamps', icon: '💡', def: 'bulb' },
  { id: 'window', kind: 'room', name: 'Windows', icon: '🪟', def: 'smallwindow' },
  { id: 'rug', kind: 'room', name: 'Rugs', icon: '🟣' },
  { id: 'picture', kind: 'room', name: 'Pictures', icon: '🖼️' },
  { id: 'plant', kind: 'room', name: 'Plants', icon: '🪴' },
  { id: 'toy', kind: 'room', name: 'Toys', icon: '🧸' },
  { id: 'pet', kind: 'room', name: 'Pets', icon: '🐠' },
];

// The catalog, cheap to elite within each slot: price in coins, or gems = diamonds only (the elite pieces). One file per
// slot (items/wear/<slot>.js, items/room/<slot>.js) adds its items with addItems: the catalog entry here, the drawing to
// WEAR_ART / ROOM_ART. With 🪙 30–60 a lesson: the cheapest pieces after the first lesson, 🪙 100–300 every few days,
// 🪙 1000+ in weeks; diamond pieces (💎 10–60) after one or a few levels of bosses.
const ITEMS = [];

// Add a slot's items, in shop order: { id, name, price | gems, ...art } — art (draw, box, sleeve, legs…) goes to art[id].
function addItems(slot, art, list) {
  for (const { id, name, price, gems, ...look } of list) {
    ITEMS.push(gems ? { id, slot, name, gems } : { id, slot, name, price: price || 0 });
    art[id] = look;
  }
}

// Room screen timing, s.
const REACT_TIME = 2.2;        // a food reaction (hearts, "Bleh!", steam…) lasts this long
const FOOD_FLY_TIME = 0.5;     // food flies to the mouth
const FOOD_BITES = 3;          // bites to eat it (one munch each)
const BITE_TIME = 0.35;        // s per bite
const HUNGRY_RUMBLE = 6;       // s between tummy rumbles while hungry on the room screen

const NAME_MAX = 14;           // chars in a player name
const DELETE_CONFIRM_TIME = 3; // s to press delete a second time

// Lesson timing, s.
const INTRO_TIME = 1.0;        // "Get ready" before the process starts
const FEEDBACK_TIME = 0.35;    // pause after an answer before the next task
const WRONG_SHOW_TIME = 2.4;   // the solved example stays visible after a mistake
const END_ANIM_TIME = 1.9;     // win / lose animation before the dialog
const WARN_LEVEL = 0.25;       // safety level below which the warning tick plays
const WARN_TICK = 0.6;         // s between ticks (half of it below WARN_LEVEL / 2)
const DANGER_LEVEL = 0.5;      // flower wilts below this water level
// Pause: extra time to think the task over (it stays on screen), paid for: the Coin Muncher eats the current task's
// coins while the game is paused (otherwise Very fast + a pause on every task would pay double for free).
const PAUSE_FEE = 1;           // coins of the current task eaten at once when pausing
const PAUSE_EAT_TIME = 30;     // s to eat the rest of the current task's coins
const PAUSE_CHOMP_GAP = 0.22;  // s between chomp sounds / flying coins when it eats fast

// Flower process.
const FLOWER_REFILL_TIME = 0.6; // s the gauge takes to fill up
const FLOWER_HEAL_RATE = 1.2;   // wilt recovered per s
const FLOWER_WILT_RATE = 2.5;   // wilt gained per s (it follows the water level)
const FLOWER_GROW_RATE = 0.8;   // growth eased per s toward the target
const FLOWER_CAN_TIME = 1.0;    // s the watering can pours

// Zombie process.
const ZOMBIE_DOOR_X = 300;      // design x where a zombie reaches the door (f = 0)
const ZOMBIE_START_X = 1150;    // design x of a new zombie (f = 1)
const ZOMBIE_RISE_TIME = 0.5;   // s a new zombie climbs out of the ground
const STONE_FLIGHT_TIME = 0.5;  // s a stone flies
const ZOMBIE_FALL_TIME = 0.9;   // s a hit zombie falls and fades
const ZOMBIE_NEXT_DELAY = 0.35; // s after the stone lands before the next zombie starts rising

// Railway process.
const RAIL_AHEAD = 680;         // design px of rails in front of the train at f = 1
const RAIL_PIECE = 60;          // design px per laid rail piece
const RAIL_LAY_STAGGER = 0.04;  // s between pieces dropping in
const RAIL_DROP_TIME = 0.25;    // s a piece falls into place
const RAIL_WIN_SPEED = 700;     // design px / s the train rolls into the station (slows to 0)
const BRIDGE_GAP = 240;         // design px, the boss ravine, bridged in BOSS_HITS sections

// Balloon process.
const BALLOON_LIFT_TIME = 0.8;  // s the balloon climbs back to the top
const BALLOON_BURN_TIME = 0.8;  // s the burner flame shows

// Campfire process.
const FIRE_REFILL_TIME = 0.7;   // s the fire grows back after a log lands
const LOG_FLIGHT_TIME = 0.5;    // s a thrown log / burning stick flies

// Panda process.
const PANDA_TOSS_TIME = 0.55;   // s a treat flies from the basket
const PANDA_CHEW_TIME = 1.1;    // s the panda munches a caught treat
const PANDA_HAPPY_RATE = 1.6;   // mood regained per s while eating
const PANDA_SAD_LEVEL = 0.4;    // below this level the panda gets sad (droopy ears, brows, tears)
const PANDA_SUCK_LEVEL = 0.18;  // below this it sucks its paw and sniffles

// Graphics quality, picked automatically and lowered / raised by the measured frame rate.
// maxDpr = canvas pixels per CSS px; maxPixels = cap on the scene canvas backing store; glow = soft shadows.
const QUALITY_LEVELS = [
  { id: 'low', maxDpr: 1, maxPixels: 1280 * 720, glow: false, confetti: 0.5 },
  { id: 'medium', maxDpr: 1.5, maxPixels: 1920 * 1080, glow: true, confetti: 0.75 },
  { id: 'high', maxDpr: 2, maxPixels: 2560 * 1440, glow: true, confetti: 1 },
];
const QUALITY_KEY = 'funTraining.quality'; // localStorage: the level learned on this device
const QUALITY_WINDOW = 2;        // s of lesson frames averaged per check
const QUALITY_LOW_FPS = 45;      // average below this → one level down
const QUALITY_HIGH_FPS = 57;     // average above this for QUALITY_UP_WINDOWS checks → one level up
const QUALITY_UP_WINDOWS = 4;

const CURSOR_HIDE_MS = 3000;    // ms the mouse must stay still in fullscreen before the cursor hides (core/cursor.js)
