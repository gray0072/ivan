'use strict';

// Lift Logic — every tuning value of the game: the simulation step, the doors and boarding, energy,
// patience, the VM's limits, the editor's sizes and the difficulty table. Loaded before every other
// game file (also by tools/missions-check.js in Node).

// ---------- simulation ----------
const SIM_DT = 0.05;            // s of game time per simulation step
const DOOR_TIME = 1.2;          // s for the doors to open or to close
const DWELL_MIN = 2.5;          // s the doors stay open at least
const BOARD_TIME = 0.8;         // s per person getting on or off (× the character's own factor)
const STAIRS_MAX = 4;           // floors: a longer trip is not walked — the person stays and gets furious
const OVERTIME_MAX = 120;       // s a run may go on after the day's last arrival while people still wait or ride
const END_GRACE = 6;            // s a run goes on after everyone is delivered while a lift still moves
const ENERGY_PER_FLOOR = 1;     // ⚡ per floor travelled
const ENERGY_PER_START = 2;     // ⚡ per start from a standstill
const REGEN_SHARE = 0.3;        // share given back by a full lift going down (from chapter 9)
const PASS_MARGIN = 0.06;       // floors: "about to pass" fires this much before the braking point
const SAY_SHOW = 3;             // s a `say` bubble stays when it has no time of its own
const MOOD_STEPS = [0.25, 0.5, 0.75]; // share of patience where the face changes
const DAY_START_CLOCK = 8 * 60; // minutes since midnight at the start of a day, unless the mission says
const LOAD_FULL = 100;          // load % that counts as `full?`

// ---------- the VM ----------
const VM_STEPS_MAX = 2000;      // blocks one thread may run in one step before it is paused
const THREADS_MAX = 32;         // threads per lift; more are dropped with a warning
const SPIN_NOTE = 400;          // loop turns in a row without waiting that the Inspector calls a busy loop
const PROGRAM_MAX_BLOCKS = 400; // a bigger program is refused

// ---------- the editor ----------
const EDITOR_UNDO_MAX = 100;    // undo steps kept
const EDITOR_ZOOM_MIN = 0.6;
const EDITOR_ZOOM_MAX = 1.6;
const DRAG_START_PX = 8;        // px a pointer moves before a press becomes a drag
const LONG_PRESS_MS = 480;      // ms: a long press moves just one block
const DROP_SNAP_PX = 46;        // px from a drop point that still snaps there
const SCRIPT_GAP = 28;          // px between scripts placed one under another

// ---------- the view ----------
const FLOOR_PX = 44;            // px per floor at zoom 1
const FLOOR_PX_MIN = 26;        // px per floor at the smallest automatic fit
const FLOOR_PX_MAX = 74;        // px per floor at the largest automatic fit
const SPEEDS = [1, 2, 4, 16];   // the run bar's speeds
const CHEAT_SPEED = 100;
const SHOW_ME_BEFORE = 4;       // s before an Inspector moment that "Show me" starts at
const CURSOR_HIDE_MS = 2000;    // ms of a still mouse before the cursor hides in fullscreen
const MAX_FPS = 60;

// ---------- results ----------
const OWN_PROGRAM_MIN_DIFF = 3; // blocks that must differ from the engineer's for an own ★★★ after hint 3
const HINT2_MINUTES = 3;        // minutes in a mission after which hint 2 opens anyway
// the comic line's thresholds (ui/jokes.js)
const JOKE = {
  longWait: 60,     // s: the longest wait that gets a joke
  emptyTrips: 6,    // empty trips that get a joke
  fullPass: 2,      // times the full lift stopped for a call it could not take
  says: 12,         // `say` blocks run
  wrongWay: 3       // rides that went the wrong way first
};

// ---------- difficulty ----------
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];
const DIFFICULTY = {
  easy:   { patience: 1.5, limits: 1.25, flow: 0.8, hint2: 1, hint3: 2 },
  medium: { patience: 1.0, limits: 1.0,  flow: 1.0, hint2: 2, hint3: 3 },
  hard:   { patience: 0.7, limits: 0.9,  flow: 1.2, hint2: 3, hint3: 4 }
};
