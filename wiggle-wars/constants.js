'use strict';

// Wiggle Wars — every gameplay tuning value. World units are pixels of the land bitmap, time is in
// seconds, speeds in px/s. The weapons' own numbers live in data/weapons.js. Loaded before data/,
// core/ and sim/.

// ---------- the world ----------
const WORLD_W = 2400;             // width of the land bitmap
const WORLD_H = 1200;             // height of the land bitmap
const WATER_Y = WORLD_H - 60;     // the water's surface at the start
const SIM_DT = 1 / 60;            // the fixed physics step
const MAX_STEPS_PER_FRAME = 6;    // a slow frame catches up at most this many steps
const GRAVITY = 520;              // px/s²
const MOON_GRAVITY = 0.45;        // gravity × on the Moon
const LOW_GRAVITY = 0.5;          // gravity × with the Low Gravity power-up
const WIND_MAX = 150;             // px/s² of push on a shot at full wind
const WIND_SETTING = { off: 0, normal: 1, strong: 1.8 };
const MOON_WIND = 0.33;           // wind × on the Moon

// ---------- worms ----------
const WORM_R = 8;                 // body radius; the body's centre is WORM_R above the feet
const WALK_SPEED = 45;
const STEP_UP = 4;                // the highest step a worm walks up (or down) per pixel forward
const JUMP_VX = 110, JUMP_VY = 230;
const FLIP_VX = 55, FLIP_VY = 330;
const FALL_SAFE = 380;            // landing faster than this hurts…
const FALL_DMG = 0.12;            // …by this much per px/s over it
const BOUNCE = 0.3;               // a thrown worm's restitution off walls
const LAND_SPEED = 90;            // a thrown worm slower than this on a floor lands
const DEATH_BLAST = { r: 25, dmg: 10 }; // a worm at 0 health blowing up at the turn's end
const DEATH_DELAY = 0.7;          // s between the camera reaching a dying worm and the bang
const KNOCK = 9;                  // px/s of push per point of damage
const KNOCK_LIFT = 0.45;          // the push's extra upward part
const HEALTH_OPTIONS = [50, 100, 150, 200];
const WORMS_MIN = 1, WORMS_MAX = 6;

// ---------- aiming and turns ----------
const AIM_MIN = -85, AIM_MAX = 85; // degrees from the facing, up is positive
const AIM_SPEED = 70;             // °/s with the keys (the joystick scales it)
const CROSSHAIR_DIST = 44;
const CHARGE_TIME = 1.6;          // s from no power to full
const TURN_OPTIONS = [30, 45, 60, 90];
const RETREAT_TIME = 3;           // s to move after a shot
const RETREAT_DROP = 5;           // s to run after dropping dynamite or a mine
const SETTLE_MAX = 12;            // the longest the game waits for things to stop
const SETTLE_QUIET = 0.35;        // s everything must have been still
const TICK_FROM = 5;              // the last seconds of a turn tick
const TURN_INTRO = 0.6;           // s at a turn's start before the timer runs
const SD_RISE = 28;               // px the water rises after each turn in sudden death
const SD_OPTIONS = [0, 8, 12, 20]; // rounds before sudden death (0 = never)

// ---------- objects ----------
const CRATE_CHANCE = { off: 0, some: 0.35, many: 0.7 };
const CRATE_FALL = 70;            // px/s under the parachute
const CRATE_R = 9;
const CRATE_PICK = 18;            // a worm's centre this close picks it up
const HEALTH_CRATE = 30;
const CRATE_KINDS = { health: 0.35, weapon: 0.45, tool: 0.2 };
const TOOL_CRATE = ['jetpack', 'teleport', 'plank', 'drill', 'double', 'lowgrav'];
const MINE_COUNT = [0, 3, 6];
const BARREL_COUNT = [0, 3, 6];
const MINE_ARM = 2;               // s before a dropped mine is live
const MINE_TRIGGER = 28;          // a worm this close starts its countdown
const MINE_FUSE = 1.5;
const MINE_KEEP_AWAY = 60;        // map mines are at least this far from the worms
const BARREL_HP = 30;
const BARREL_BLAST = { r: 48, dmg: 40 };
const TARGET_R = 11;
const SPAWN_GAP = 70;             // worms start at least this far apart
const CHAIN_DELAY = 0.15;         // s before a hit barrel or mine goes off

// ---------- the computer ----------
const AI_THINK = 0.9;             // s before a CPU worm acts
const AI_ANGLE_STEP = 10;         // degrees between the angles tried first…
const AI_POWER_STEPS = 10;        // …and the powers; then the best AI_REFINE are tried 4× finer round them
const AI_REFINE = 6;
const AI_KILL_BONUS = 30;
const AI_WATER_BONUS = 25;        // a hit worm within 60 px of the water
const AI_OWN_WEIGHT = 1.5;
const AI_MIN_SCORE = 8;           // below this it walks first
const AI_WALK_TIME = 2.5;
const AI_AIM_SPEED = 90;          // °/s the CPU turns its aim
const AI_SIM_TIME = 5;            // s of flight simulated at most

// ---------- touch ----------
const JOY_R = 50;                 // px from the joystick's centre to full deflection
const JOY_DEAD = 0.3;             // the share of it that does nothing
const TAP_MOVE = 12;              // px a finger may move and still tap
const TAP_TIME = 0.4;             // s a tap may last

// ---------- the camera ----------
const VIEW_W = 1100;              // world px across the screen at the start
const ZOOM_MAX = 2;
const CAMERA_LERP = 4;            // 1/s
const PAN_HOLD = 4;               // s a manual pan keeps the camera before it follows again

// ---------- difficulty ----------
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];
const DIFFICULTY = {
  easy:   { aimErr: 7,   powErr: 0.10, pickTop: 5, guide: 0.9, enemyHp: 0.8 },
  medium: { aimErr: 2.5, powErr: 0.04, pickTop: 1, guide: 0.3, enemyHp: 1 },
  hard:   { aimErr: 0.6, powErr: 0.01, pickTop: 1, guide: 0,   enemyHp: 1.25 }
};

// ---------- misc ----------
const STAR_HEALTH = [0.3, 0.6];   // the share of starting health kept for ★★ and ★★★
const SLOWMO = 0.3;               // time × during the winning kill
const SLOWMO_TIME = 1.4;          // s of it
const VIBRATE_BLAST = 40;         // explosions this big vibrate the phone
const CURSOR_HIDE_MS = 2000;      // the mouse cursor hides in fullscreen after this long still
const MAX_FPS = 60;
