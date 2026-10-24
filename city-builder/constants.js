'use strict';

// City Builder — every gameplay tuning value. Loaded first; read by sim/, ui/ and game.js.
// Building prices, sizes and effects are in data/buildings.js, milestones in data/milestones.js.

// ---------- the map and the camera ----------
const MAP_SIZE = 48;            // tiles per side
const TILE_HW = 32;             // half the width of a tile's diamond at zoom 1, CSS px
const TILE_HH = 16;             // half its height (2:1 isometric)
const ZOOM_MIN = 0.22;
const ZOOM_MAX = 2.6;
const ZOOM_START = 1.1;
const ZOOM_START_PHONE = 0.8;   // a coarse pointer starts zoomed out a little: a phone shows less
const PAN_KEY_SPEED = 900;      // arrow keys / WASD, CSS px per second
const HIGHWAY_LEN = 7;          // the road the residents arrive by, tiles in from the map's edge

// ---------- time ----------
const MONTH_SECONDS = 10;       // one in-game month at ▶
const SPEEDS = [0, 1, 2, 4];    // ⏸ ▶ ▶▶ ▶▶▶
const MONTHS_PER_YEAR = 12;
const SPRING_MONTHS = [2, 3, 4];   // March, April, May: when the river may flood

// ---------- money ----------
const TAX_DEFAULT = 9;          // %
const TAX_MAX = 20;             // %
const TAX_PER_RESIDENT = 40;    // $ a resident pays a month at a 100 % rate (9 % → $3.60)
const TAX_PER_WORKER = 40;      // $ a business pays a month per worker at a 100 % rate
const ROAD_PRICE = 10;
const BRIDGE_PRICE = 50;        // a road over water
const ROAD_UPKEEP = 1;          // $ a month per road tile
const BRIDGE_UPKEEP = 3;
const BULLDOZE_PRICE = 5;
const FOREST_CLEAR_PRICE = 20;  // added for every forest tile a building, a road or the bulldozer clears
const REPAIR_SHARE = 0.5;       // repairing costs this share of the price
const DEMOLISH_REFUND = 0;      // share of the price given back on demolishing

// ---------- residents and jobs ----------
const HOUSE_CAPACITY = [0, 4, 12, 40];   // residents per house level 1..3
const WORKER_SHARE = 0.35;      // share of the residents who work (the rest are kids and pensioners)
const ARRIVE_RATE = 0.5;        // at most this share of a house's free room fills in a month
const MOVE_IN_HAPPINESS = 30;   // nobody moves into a house less happy than this
const LEAVE_HAPPINESS = 20;     // below this, a fifth of the residents leave every month
const GROW_HAPPINESS = 70;      // a full house this happy grows after GROW_MONTHS
const GROW_MONTHS = 3;
const SHRINK_HAPPINESS = 25;    // a house this unhappy for SHRINK_MONTHS goes down a level
const SHRINK_MONTHS = 3;
const GROW_MAX_UNEMPLOYMENT = 0.1;   // houses grow only while the city has jobs for (almost) everyone
const DEMAND_MIN = 0.15;        // how much the free jobs draw new residents, × ARRIVE_RATE
const DEMAND_MAX = 1.5;

// ---------- happiness (0..100 per house) ----------
const HAPPY_BASE = 50;
const HAPPY_UNEMPLOYMENT = 30;  // points lost at 100 % unemployment
const HAPPY_TAX = 3;            // points per tax % above (lost) or below (won) TAX_DEFAULT
const HAPPY_FIRE_COVER = 5;     // inside a fire station's cover
const HAPPY_EXTRA_FACTORY = 5;  // every factory nearby after the first, up to HAPPY_FACTORY_MAX
const HAPPY_FACTORY_MAX = 40;

// ---------- disasters ----------
const DISASTER_MILESTONE = 1;   // disasters start once the city is a Village
const FIRE_BURN_TIME = 16;      // s (game time) until a building nobody puts out burns down
const FIRE_SPREAD_EVERY = 5;    // s between the fire's tries to jump to a neighbour
const FIRE_SPREAD_CHANCE = 0.15; // per try: a fire spreads to fewer than one neighbour on average
const FIRE_SPREAD_GAP = 1;      // tiles between footprints a fire can jump
const FIRE_FACTORY_WEIGHT = 3;  // a factory catches fire this many times as often
const TRUCK_SPEED = 5;          // tiles per second (game time)
const EXTINGUISH_TIME = 2;      // s the truck spends on the fire
const FLOOD_REACH_MIN = 2;      // tiles the water spreads from the river
const FLOOD_REACH_MAX = 3;
const FLOOD_RISE_TIME = 6;      // s for the water to come up (and to go down)
const FLOOD_HOLD = 10;          // s it stays (one month)

// ---------- decoration ----------
const CAR_PER_RESIDENTS = 25;   // one car on the roads per this many residents
const CARS_MAX = 60;
const CAR_SPEED = 1.6;          // tiles per second (game time)
const PLANE_EVERY = 14;         // s between take-offs at an airport

// ---------- difficulty ----------
const DIFFICULTY = {
  easy:   { startMoney: 20000, taxMul: 1.2,  upkeepMul: 0.8, fireMonths: 24, floodYears: 4, debtMonths: 6 },
  medium: { startMoney: 12000, taxMul: 1.0,  upkeepMul: 1.0, fireMonths: 12, floodYears: 2, debtMonths: 4 },
  hard:   { startMoney: 8000,  taxMul: 0.85, upkeepMul: 1.2, fireMonths: 6,  floodYears: 1, debtMonths: 3 }
};
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

// ---------- the screen ----------
const CURSOR_HIDE_MS = 2000;    // the mouse cursor hides in fullscreen after this long still
const MAX_FPS = 60;
const TAP_SLOP = 10;            // CSS px a finger may move and still tap
