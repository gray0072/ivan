'use strict';

// Game tuning constants: sizes, speeds, counts, timings, hit shapes. Loaded before game.js.

// ---------- Difficulty ----------
// npcAimError: max deviation (degrees) of a fleeing / chasing fish from the ideal direction
// npcReaction: seconds between an NPC's looks around for threats and prey (a human-like reaction delay)
// meal: share of an eaten fish's (or gull's) area r² the player grows by (bots always get NPC_MEAL)
// npcBoost: an NPC's dash stamina as a share of the player's boostMax; npcBoostRecharge: seconds after a dash
// until the whole tank comes back at once
const DIFFICULTIES = {
  easy:   { label: 'Easy',   food: 2,   npcSpeed: 0.9,  boostMax: 1.5,  boostRegen: 1.5,  npcAimError: 20, npcReaction: 0.4, meal: 0.6,
            npcBoost: 1 / 8,  npcBoostRecharge: 20 },
  medium: { label: 'Medium', food: 1.5, npcSpeed: 0.95, boostMax: 1.25, boostRegen: 1.25, npcAimError: 10, npcReaction: 0.3, meal: 0.5,
            npcBoost: 3 / 16, npcBoostRecharge: 15 },
  hard:   { label: 'Hard',   food: 1.0, npcSpeed: 1.0,  boostMax: 1.0,  boostRegen: 1.0,  npcAimError: 5,  npcReaction: 0.2, meal: 0.4,
            npcBoost: 1 / 4,  npcBoostRecharge: 10 }
};

// ---------- World (infinite in x; the sea floor below and the water surface above) ----------
// Water depth: a full-boost climb from floor to surface takes 4600 / (150 * 1.7) = 18 s for a fry and
// 4600 / (213 * 1.7) = 12.7 s for a max-size player (see speedForR). The biggest fish
// (r = 500) is ~1050 tall with fins and ~1400 long, so the column is still ~4.4 of them deep.
const FLOOR_Y = 5000;          // world y of the sea floor; nothing can go below it
const WATER_DEPTH = 4600;
const SURFACE_Y = FLOOR_Y - WATER_DEPTH;  // world y of the (calm) water surface; fish leap above it
// Spawn and cull distances follow the view: entities are kept populated within SPAWN_SCREENS × the visible
// screen size (its larger side, in world units at the current zoom) and recycled beyond CULL_MUL × that
const SPAWN_SCREENS = 1;
const CULL_MUL = 1.3;
// The populated area grows with the screen, so the fish, jellyfish and plankton-cap counts are tuned for a screen
// whose larger side is REF_SCREEN_SIDE CSS px (a phone in landscape) and scaled by the populated area of the actual
// screen (clipped to the water column), never below ×1 and at most ×SCREEN_MUL_MAX, so a big monitor is as crowded
const REF_SCREEN_SIDE = 900;
const SCREEN_MUL_MAX = 6;
const NPC_FLOOR_MARGIN = 60;   // bots start steering away from the floor this far above it

// ---------- Leaps out of the water ----------
const GRAVITY = 450;
const LEAP_HEIGHT = 1.3;       // a boosted, steep exit lifts the center at least this many radii
const MIN_LEAP = 0.3;          // exits that would rise less than this many radii just glide along the surface
const MAX_LEAP_ELEV = 1.2;     // launch angle cap (~69°), so the fish always arcs over instead of flipping

// ---------- Stages (size tiers, shared by player and NPCs for readability) ----------
// Upper bounds in world radius (see lengthCmForR / weightForR for the weight and length shown in the HUD),
// spaced geometrically (each ≈ 2.2× the previous) so every stage takes a similar share of the growth;
// the Sea King grows on to 200 t, 29 m
const STAGES = [
  { name: 'Fry',          maxR: 32,       color: '#ffd54f' },  // ≤ 63 g, ≤ 20 cm
  { name: 'Small Fish',   maxR: 70,       color: '#4fc3f7' },  // ≤ 4.5 kg, ≤ 82 cm
  { name: 'Big Fish',     maxR: 151,      color: '#66bb6a' },  // ≤ 295 kg, ≤ 3.3 m
  { name: 'Shark',        maxR: 327,      color: '#90a4ae' },  // ≤ 20 t, ≤ 13 m
  { name: 'Sea King',     maxR: Infinity, color: '#ba68c8' }
];
const EAT_MARGIN = 1.15; // must be this much bigger (in radius) to eat / be eaten

// ---------- Player ----------
const BASE_R = 15;
const MAX_R = 500;   // hard size cap for the player and every spawned fish
// Length shown in the HUD is a power of r through both ends: 5 cm for a fry at BASE_R … 29 m at MAX_R
const MIN_LENGTH_CM = 5;
const MAX_LENGTH_CM = 2900;
// Weight is strictly ∝ length³, pinned at the top: 200 t at 29 m (so the 5 cm fry weighs ≈ 1 g)
const MAX_WEIGHT_G = 200e6;
// The camera zooms out stage by stage, by the same step per stage (MAX_ZOOM_DIVISOR^(1/4) ≈ 1.5), from START_ZOOM
// for a new fry to START_ZOOM / MAX_ZOOM_DIVISOR at the start of the Sea King stage, then stays there.
// Each stage grows the radius ≈ 2.15×, so on screen the fish grows ≈ 1.44× per stage (17 px → 75 px radius
// at the Sea King, 115 px at the max size on a 1× screen)
const START_ZOOM = 1.15;
const MAX_ZOOM_DIVISOR = 5;
// Cruise speed (world units/s) grows slowly with size: SPEED_BASE × (r / BASE_R) ^ SPEED_EXP, so a fry swims
// ~3.6 body lengths/s and a 29 m giant ~0.15 (213 u/s, like a blue whale's ~5 m/s). That applies to the player
// and to every fish up to the player's size; bigger fish are slower than the player instead, by
// (player r / their r) ^ BIGGER_SLOW_EXP (×0.9 at 1.5×, ×0.76 at 3×), so a predator can't outswim you at cruise
const SPEED_BASE = 150;
const SPEED_EXP = 0.1;
const BIGGER_SLOW_EXP = 0.25;
const BOOST_MUL = 1.7;   // the player's dash speed multiplier
const BOOST_DRAIN = 0.6;
// Swim stroke (tail wag and fin ripple) rate, radians of wag phase per second at cruise, for a fry; faster swimming
// beats faster (×2 at the player's full dash), and bigger fish beat slower: × (r / BASE_R) ^ -WAG_SIZE_EXP, like real
// fish, whose tail-beat frequency falls with body length (a fry flicks several times a second, a whale takes ~4 s per
// stroke): 3.6 s per stroke at the max size, 1.8 s dashing. Big fish also hold their pectoral fins steadier
const WAG_RATE = 7;
const WAG_SIZE_EXP = 0.4;
const BOOST_REGEN = 0.25;
const FISH_MEAL_REGEN_MUL = 2;  // boost regenerates this many times faster while a fish the player ate is still being grown into
const SPAWN_GRACE = 2.5;
const CHOMP_TIME = 0.28;  // seconds of the "om" bite animation on every meal: the mouth snaps open, then shut
const NO_FOOD_CHOMP_STAGE = 3;  // from this stage (Shark) on, plankton is swallowed without the bite animation
const GROW_TIME = 3;   // seconds over which each meal's growth is applied
// Test cheat: digits set the player's size (1-5 = each stage, 6-9 = bigger Sea King, 0 = max size)
const CHEAT_RADII = [MAX_R, BASE_R, 45, 100, 220, 345, 380, 415, 450, 480];

// ---------- Food ----------
const FOOD_DENSITY = 130 / (2800 * 2600);  // plankton per world unit² of the spawn area (before the difficulty's food multiplier)
const FOOD_MAX = 400;           // cap on the plankton count (before the difficulty multiplier) when zoomed far out
const FOOD_R = 3.2;
// Food is eaten on touching its glow; the renderer draws the glow at this radius
const FOOD_AURA = 2.4;

// ---------- NPC fish ----------
const NPC_COUNT = 24;
const NPC_MEAL = 0.55;         // share of an eaten fish's / gull's area r² a bot grows by
const NPC_SPEED_SPREAD = 0.03; // per-fish speed varies by up to ±3%
// NPC dash: only while fleeing or chasing, starting on a full tank and burning it all; it adds half of the player's
// dash gain to the flee / chase speed. The tank refills all at once npcBoostRecharge seconds later, so dashes are rare bursts
const NPC_BOOST_ADD = (BOOST_MUL - 1) / 2;
const FISH_EXTENT = 1.9;  // tail tip reaches ~1.8r behind the center
// Share of NPC size samples drawn only from the tails (|z| > 1), see heavyTailNormal
const TAIL_SHARE = 0.2;
// Giants are rare: a spawned fish bigger than GIANT_R is kept with probability (GIANT_R / r) ^ GIANT_EXP
// (r = 250: 36%, r = 350: 19%, r = 500: 9%); otherwise it spawns as a small fish (×0.3–0.55 the player)
const GIANT_R = 151;           // the Big Fish / Shark boundary
const GIANT_EXP = 2;
const NPC_REACTION_SPREAD = 0.2; // each look-around interval varies by up to ±20% of npcReaction
const NPC_AIM_ERR_HOLD = [0.8, 1.6]; // seconds before an NPC picks a new aim error
const NPC_AIM_ERR_EASE = 1.5;  // per second: how fast the aim error drifts toward the new value (no jumps)
const NPC_TURN_GAIN = 4;       // turn speed per radian of heading error, capped by the size's turn rate
const NPC_LEAP_ZONE = 300;     // wandering bots within this distance (+ 1.5r) of the surface may decide to leap
const NPC_LEAP_CHANCE = 0.2;   // per second, while in that zone
const DEMO_RESTART_DELAY = 2;   // seconds after the demo fish dies before the demo starts over
const DEMO_VIEW_MUL = 1.6;      // the demo fish notices prey and jellyfish this many times further than bots
const DEMO_FLEE_BASE = 150;     // the demo fish flees a predator whose mouth is within this gap (px) ...
const DEMO_FLEE_R = 4;          // ... plus this many of its own radii
const DEMO_FLEE_DASH = 0.6;     // share of that flee gap within which it dashes away
const DEMO_MAX_LEAPS = 2;       // leaps within DEMO_LEAP_WINDOW seconds before the demo fish dives deep
const DEMO_LEAP_WINDOW = 8;
const DEMO_MAX_SKIM = 1.5;      // seconds of skimming along the surface before it dives
const DEMO_DIVE_TIME = 5;       // the dive lasts up to this long (seconds) ...
const DEMO_DIVE_DEPTH = 350;    // ... or until the fish is this far (+ 2 radii) below the surface
const DEMO_DIVE_ANGLE = 0.7;    // dive angle below horizontal (radians)
const DEMO_TAIL_THREAT = 0.35;  // weight of a predator showing its tail, vs 1 for one facing the demo fish
const DEMO_FOOD_MAX_STAGE = -1; // the demo fish seeks out plankton up to this stage (0 = Fry, -1 = never: it ignores plankton)
const DEMO_FOOD_RANGE = 450;    // how far the demo fry looks for plankton
const DEMO_TARGET_STICKY = 1.3; // score bonus for the prey the demo fish is already chasing
const DEMO_CHASE_SPEED = 1.1;   // its average speed in a chase, × cruise (cruising in, dashing for the kill), for catchTime
const DEMO_CATCH_OVERHEAD = 0.5; // seconds added to every catch estimate, so a fish right at the mouth doesn't score infinitely
const DEMO_LEAD_MAX = 1.5;      // seconds: how far ahead the demo fish aims at moving prey
const DEMO_DASH_RESERVE = 0.35; // share of max stamina kept for escapes: no hunting dashes below it

// ---------- Jellyfish (hazard, not lethal) ----------
const JELLY_COUNT = 7;
const JELLY_R_MIN = 16;        // bell radius of a normal-size jellyfish, before JELLY_SCALE
const JELLY_R_MAX = 26;
// Some jellyfish are bigger: scale = 1 + (JELLY_SCALE_MAX - 1) × u^JELLY_SCALE_EXP (u uniform), so most stay near
// normal size and about 1 in 5 is over 2× (up to r = 78, still half a young Shark, which eats them all)
const JELLY_SCALE_MAX = 3;
const JELLY_SCALE_EXP = 3;
// Bigger ones drift and pulse slower (÷ √scale), so they're easier to read and steer around
const JELLY_DRIFT = 14;        // world units/s at normal size
const JELLY_PULSE = 2;         // bell pulse rate, rad/s at normal size
const JELLY_SHRINK = 0.1;      // fraction of area lost per sting of a normal-size jellyfish…
const JELLY_SHRINK_BIG = 0.2;  // …growing linearly to this at JELLY_SCALE_MAX
const JELLY_STUN_TIME = 1.2;
const JELLY_STUN_SLOW = 0.4;
// Gap (edge to edge) at which fish start steering away, plus the fish's own turning radius (speed / turn rate):
// a big fish swims fast and turns slowly, so it has to start turning much earlier
const JELLY_AVOID_DIST = 45;
const JELLY_TENTACLE_REACH = 1.2;  // jellyfish count as a bell plus a hanging stalk this many radii long
const JELLY_TENTACLE_HALF_W = 1.8;  // at normal size; × √scale for bigger ones
const JELLY_HUES = [330, 285, 205, 25, 170, 55];
const JELLY_EATER_STAGE = 3;  // from this stage (Shark) on, jellyfish can't sting a fish and it eats them with its mouth
const JELLY_SURFACE_MARGIN = 35; // the top of a bell drifts no closer to the surface than this

// ---------- Hit shapes (match what drawFish / the jellyfish renderer actually draw) ----------
// Fish: circles along the body axis, [offset along heading, radius], both in units of r
const FISH_HIT = [[0.55, 0.4], [0.05, 0.56], [-0.45, 0.4], [-1.3, 0.28]];
// The only part that can eat: the head in front of the gill line, [offset along heading, radius]
const MOUTH_HIT = [0.72, 0.32];

// ---------- Danger radar ----------
// Fish big enough to eat the player, while still out of view, show up as a pulsing red glow at the screen edge
// in their direction: bigger and closer = larger, brighter and faster-beating; a fish heading for you gets a double chevron
// The radar only shows when the screen is too small to see a predator coming in time: when the time it takes to
// close in from the nearest screen edge (half the shorter side; the player swimming at it head-on at cruise, the
// predator chasing at full dash) is under RADAR_REACTION (a human's notice-and-react time) plus the time to turn a
// quarter turn away. With the numbers here a phone in landscape (~850×390) gets it at every stage, a 1920×1080
// monitor at none, a 1366×650 laptop window only as a small Fry and briefly as a young Shark
const RADAR_REACTION = 0.5;     // seconds
const RADAR_HYSTERESIS = 1.15;  // once shown, it hides only at this many times the threshold (no flicker while growing)
const RADAR_RANGE = 1.2;        // how far beyond the screen edge threats are shown, in screen half-diagonals
const RADAR_FULL_RATIO = 3;     // a threat this many times the player's radius (or more) gets the largest glow
const RADAR_BEAT_MIN = 0.7;     // heartbeats per second of a threat at the edge of the range …
const RADAR_BEAT_MAX = 2.6;     // … and of one just out of view
const RADAR_HUNT_COS = 0.8;     // a chasing fish counts as heading for you within ~37° of the line to you

// ---------- Splash sounds of other fish ----------
const SPLASH_SIZE_EXP = 0.5;          // volume ∝ (their r / player's r) ^ this
const SPLASH_SIZE_MUL = [0.3, 1.6];   // clamp for that size factor
const SPLASH_MIN_VOL = 0.03;          // quieter splashes aren't played at all

// ---------- Seagulls (fly over the water; a leaping fish can snatch one) ----------
// Lowest gulls are within a fry's reach: a fry's full-dash leap at the 69° launch cap has
// vy = 255 × sin(69°) = 238, so its center peaks 238² / (2 × 450) = 63 above the surface, and the mouth
// plus the gull's hit radius reach ~15 further. Bigger fish leap higher (≥ 1.13r) and reach the higher gulls.
const BIRD_COUNT = 6;
const BIRD_MIN_H = 50;         // lowest cruising height (center above the surface)
const BIRD_MAX_H = 450;
const BIRD_HIT = 1.2;          // hit radius in units of the gull's r (body plus a bit of wing)
const BIRD_DRAW_SCALE = 1.3;   // drawn a bit larger than r, so the gulls read at a glance
const BIRD_RANGE = 2200;       // gulls are kept within this horizontal distance of the player
// What happens when a leaping fish touches a gull, by the fish's stage index (see STAGES):
// up to GULL_PREY_STAGE the gull snatches the fish and flies off with it, up to GULL_SCARE_STAGE the fish
// knocks the gull and it flies off, anything bigger eats the gull
const GULL_PREY_STAGE = 0;     // Fry
const GULL_SCARE_STAGE = 1;    // Small Fish
const BIRD_LEAVE_CLIMB = 160;  // climb speed of a gull flying away
const BIRD_LEAVE_SPEED = 1.8;  // ×horizontal speed while flying away
const BIRD_LEAVE_H = 1400;     // a leaving gull is removed once this high above the surface

// Auto graphics (quality.js): the preset is picked from the device, then stepped down / back up by the frame rate
// measured while playing; the level it settles on is remembered per device
const AUTO_GFX_KEY = 'fishFrenzy.autoGraphics';  // localStorage: the level Auto learned on this device
const AUTO_GFX_WINDOW = 2;       // s of play frames averaged per check
const AUTO_GFX_WARMUP = 0.6;     // s of frames skipped after a start, a resume or a level change
const AUTO_GFX_LOW_FPS = 45;     // average below this → one level down
const AUTO_GFX_HIGH_FPS = 57;    // average above this for AUTO_GFX_UP_WINDOWS checks in a row → one level up
const AUTO_GFX_UP_WINDOWS = 4;
