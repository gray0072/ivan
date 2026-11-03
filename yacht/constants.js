'use strict';

// Yacht — the tuning values: the rules' numbers, limits, timings, the worth of the rows for the
// advice and the table's choices. Loaded before everything else.

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

// The roll's animation, in ms: the dice fly into the cup, it shakes, tips, they tumble out, it stands up
const ROLL_GATHER_MS = 220;
const ROLL_SHAKE_MS = 520;
const ROLL_TIP_MS = 180;
const ROLL_TUMBLE_MS = 620;
const DIE_SPIN_TURNS = 2;           // whole turns a die makes on each axis on its way out, at least

const HINT_ALTERNATIVES = 2;         // other moves shown under the best one on Easy; the rest are behind All moves

// What a row is worth on average in a game, in points (found with a bot playing the advice): what
// giving it up costs when the advice compares rows. Not a rule, only used by sim/advisor.js.
const ROW_WORTH = { g: 1, c: 12, bs: 9, ls: 4, fh32: 15, fh23: 13, pp: 30, t3: 22, ch: 42, s6: -4, s5: -3, s4: -3, s3: -4, s2: -4, s1: -4 };

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
