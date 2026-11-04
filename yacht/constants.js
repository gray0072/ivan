'use strict';

// Yacht — the tuning values: the rules' numbers, limits, timings and the table's choices. Loaded before everything else.

const DICE_COUNT = 5;               // dice in a turn
const ROLLS_PER_TURN = 3;           // rolls a player has in a turn
const FIRST_ROLL_MULTIPLIER = 2;    // a combination written after the first roll counts this many times
const SCHOOL_TARGET = 3;            // dice of its face that close a school row
const SCHOOL_MISS = 40;             // points a school row costs when it is not closed

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 10;
const NAME_MAX = 16;                // characters in a player's name
const GROUP_NAME_MAX = 24;          // characters in a group's name
const GAMES_MAX = 300;              // finished games kept per group, the oldest go first

const CURSOR_HIDE_MS = 2000;        // a still mouse hides its cursor in fullscreen after this long
const BANNER_MS = 3000;             // how long a banner stays
const MAX_FPS = 60;                 // the fireworks' frame limit

// The roll's animation, in ms: the dice fly into the cup, it shakes while it is held down, tips, they
// tumble out, it stands up
const ROLL_GATHER_MS = 220;
const ROLL_SHAKE_MS = 520;          // the shake lasts at least this long, also after a quick tap
const ROLL_RATTLE_MS = 260;         // one burst of the rattle, repeated for as long as the cup shakes
const ROLL_TIP_MS = 180;
const ROLL_TUMBLE_MS = 620;
const DIE_SPIN_TURNS = 2;           // whole turns a die makes on each axis on its way out, at least

const HINT_ALTERNATIVES = 2;         // other moves shown under the best one on Easy; the rest are behind All moves
const AIM_ROWS = 3;                  // rows named under a roll in the All moves and Why this move dialogs
const AIM_MIN_CHANCE = 0.05;         // a row less likely than this is not named there, it goes under the other rows
const AIM_VALUES = 4;                // a row's outcomes listed one by one up to this many; more are shown as a range
const AVERAGE_TERMS = 6;             // outcomes spelt out in the sum of the Why this move dialog; more are summed by row
const WHY_MOVES = 10;                // moves taken apart in the Why this move dialog

// The table top: the colours to pick from (key, colour) and the textures (styles.css, body[data-tex])
const TABLE_COLORS = [
  { id: 'green', hex: '#1f5b3f', name: 'Green' },
  { id: 'blue', hex: '#1d4a6e', name: 'Blue' },
  { id: 'burgundy', hex: '#6d1f2b', name: 'Burgundy' },
  { id: 'charcoal', hex: '#2e3238', name: 'Charcoal' },
  { id: 'walnut', hex: '#5a3a22', name: 'Walnut' },
  { id: 'sand', hex: '#a3875c', name: 'Sand' }
];
const TABLE_TEXTURES = [
  { id: 'felt', name: 'Felt' },
  { id: 'wood', name: 'Wood' },
  { id: 'leather', name: 'Leather' },
  { id: 'linen', name: 'Linen' },
  { id: 'marble', name: 'Marble' }
];
const TABLE_DEFAULT = { color: 'green', texture: 'felt' };
