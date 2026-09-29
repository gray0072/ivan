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

// Speeds: seconds until the process fails = expected task time × mul.
const SPEEDS = [
  { id: 'vslow', name: 'Very slow', icon: '🐌', mul: 3.0 },
  { id: 'slow', name: 'Slow', icon: '🐢', mul: 2.2 },
  { id: 'medium', name: 'Medium', icon: '🐇', mul: 1.6 },
  { id: 'fast', name: 'Fast', icon: '🐆', mul: 1.2 },
  { id: 'vfast', name: 'Very fast', icon: '🚀', mul: 0.9 },
];

const ANSWER_MODES = [
  { id: 'choice', name: 'Pick 1–4', icon: '🔢' },
  { id: 'type', name: 'Type it', icon: '⌨️' },
];
const CHOICE_COUNT = 4;          // answer buttons in choice mode
const TYPE_MAX_DIGITS = 6;       // longest typed answer
const LESSON_LENGTHS = [10, 15, 20]; // correct answers needed to win a lesson

const DEFAULT_SETTINGS = {
  answerMode: 'choice',
  lessonLength: 10,
  math: {
    ops: ['add'],
    operands: 2,
    mix: false,
    limits: { add: 20, sub: 20, mul: 100, div: 100 },
    speed: 'medium',
  },
};

// Coins per task of a won lesson, by the lesson's mistakes: the first rule with mistakes <= maxMistakes.
const COIN_RULES = [
  { maxMistakes: 1, perTask: 3 },
  { maxMistakes: 3, perTask: 2 },
  { maxMistakes: 5, perTask: 1 },
  { maxMistakes: Infinity, perTask: 0 },
];

const MAX_RATE = 3;     // best coins per task (COIN_RULES[0]); steps done below it can be replayed for the rest
const TRACK_LEN = 10;   // steps per star
const BOSS_EVERY = 5;   // every Nth step is a boss step
const BOSS_HITS = 3;    // correct answers the boss needs (its last task)
const BOSS_TIME_MUL = 2; // the boss round's safety level drains over this × a task's fail time, with no refill
const BOSS_NOTE_TIME = 1.8; // s the "BOSS!" note stays on the scene
// Star tiers in the order they are earned; the last one repeats.
const STAR_TIERS = [
  { name: 'Bronze', color: '#d08a4c' },
  { name: 'Silver', color: '#c9d3dd' },
  { name: 'Gold', color: '#ffd23f' },
  { name: 'Platinum', color: '#9ff0e6' },
  { name: 'Diamond', color: '#8fd3ff' },
  { name: 'Ruby', color: '#ff4f7b' },
  { name: 'Emerald', color: '#3ddc97' },
  { name: 'Sapphire', color: '#5b7cff' },
  { name: 'Rainbow', color: 'rainbow' },
];

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
];

const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦁', '🐰', '🐻', '🐨', '🐙', '🦄', '🐲', '🐧', '🦉', '🐝', '🐢'];
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
