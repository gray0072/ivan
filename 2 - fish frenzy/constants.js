'use strict';

// Game tuning constants: sizes, speeds, counts, timings, hit shapes. Loaded before game.js.

// ---------- Difficulty ----------
// npcAimError: max deviation (degrees) of a fleeing / chasing fish from the ideal direction
// npcReaction: seconds between an NPC's looks around for threats and prey (a human-like reaction delay)
const DIFFICULTIES = {
  easy:   { label: 'Easy',   food: 2,   npcSpeed: 0.9,  boostMax: 1.5,  boostRegen: 1.5,  npcAimError: 20, npcReaction: 0.4 },
  medium: { label: 'Medium', food: 1.5, npcSpeed: 0.95, boostMax: 1.25, boostRegen: 1.25, npcAimError: 10, npcReaction: 0.3 },
  hard:   { label: 'Hard',   food: 1.0, npcSpeed: 1.0,  boostMax: 1.0,  boostRegen: 1.0,  npcAimError: 5,  npcReaction: 0.2 }
};

// ---------- World (infinite in x; the sea floor below and the water surface above) ----------
// Water depth: a full-boost climb from floor to surface takes 2600 / (150 * 1.7) = 10.2 s for a fry and
// 2600 / (77 * 1.7) = 19.9 s for the slowest giants (speed floor 77, see speedForR). The biggest fish
// (r = 500) is ~1050 tall with fins and ~1400 long, so the column is still ~2.5 of them deep.
const FLOOR_Y = 3000;          // world y of the sea floor; nothing can go below it
const WATER_DEPTH = 2600;
const SURFACE_Y = FLOOR_Y - WATER_DEPTH;  // world y of the (calm) water surface; fish leap above it
const SPAWN_RADIUS = 1400;     // entities are kept populated within this radius of the player
const CULL_DIST = 2000;        // entities farther than this are recycled back near the player
const NPC_FLOOR_MARGIN = 60;   // bots start steering away from the floor this far above it

// ---------- Leaps out of the water ----------
const GRAVITY = 450;
const LEAP_HEIGHT = 1.3;       // a boosted, steep exit lifts the center at least this many radii
const MIN_LEAP = 0.3;          // exits that would rise less than this many radii just glide along the surface
const MAX_LEAP_ELEV = 1.2;     // launch angle cap (~69°), so the fish always arcs over instead of flipping

// ---------- Stages (size tiers, shared by player and NPCs for readability) ----------
// Upper bounds picked from plausible weights (see weightForR): fry up to ~100 g, small fish ~2 kg,
// big fish ~50 kg, shark ~1.5 t (a large great white); the Sea King grows on to 200 t
const STAGES = [
  { name: 'Fry',          maxR: 24,       color: '#ffd54f' },  // ≤ 95 g, ≤ 21 cm
  { name: 'Small Fish',   maxR: 45,       color: '#4fc3f7' },  // ≤ 1.9 kg, ≤ 58 cm
  { name: 'Big Fish',     maxR: 89,       color: '#66bb6a' },  // ≤ 51 kg, ≤ 1.7 m
  { name: 'Shark',        maxR: 180,      color: '#90a4ae' },  // ≤ 1.5 t, ≤ 5.3 m
  { name: 'Sea King',     maxR: Infinity, color: '#ba68c8' }
];
const EAT_MARGIN = 1.15; // must be this much bigger (in radius) to eat / be eaten

// ---------- Player ----------
const BASE_R = 15;
const MAX_R = 500;   // hard size cap for the player and every spawned fish
// Weight shown in the HUD is a power of r (like mass ∝ length³, but steeper, so the 50× size range spans
// 10 g → 200 t): a fry at BASE_R weighs 10 g, a fish at MAX_R as much as the biggest blue whale, 200 t
const BASE_WEIGHT_G = 10;
const MAX_WEIGHT_G = 200e6;
// Length follows weight like a real body (∝ weight^⅓): 10 cm for the 10 g fry … 27 m for the 200 t giant
const BASE_LENGTH_CM = 10;
const BOOST_DRAIN = 0.6;
const BOOST_REGEN = 0.25;
const SPAWN_GRACE = 2.5;
const CHOMP_TIME = 0.28;  // seconds of the "om" bite animation on every meal: the mouth snaps open, then shut
const NO_FOOD_CHOMP_STAGE = 3;  // from this stage (Shark) on, plankton is swallowed without the bite animation
const GROW_TIME = 3;   // seconds over which each meal's growth is applied
// Test cheat: digits set the player's size (1-5 = each stage, 6-9 = bigger Sea King, 0 = max size)
const CHEAT_RADII = [MAX_R, BASE_R, 35, 65, 130, 210, 270, 330, 400, 460];

// ---------- Food ----------
const FOOD_COUNT = 130;
const FOOD_R = 3.2;
// Food is eaten on touching its glow; the renderer draws the glow at this radius
const FOOD_AURA = 2.4;

// ---------- NPC fish ----------
const NPC_COUNT = 24;
const NPC_SPEED_SPREAD = 0.03; // per-fish speed varies by up to ±3%
const FISH_EXTENT = 1.9;  // tail tip reaches ~1.8r behind the center
// Share of NPC size samples drawn only from the tails (|z| > 1), see heavyTailNormal
const TAIL_SHARE = 0.2;
// Giants are rare: a spawned fish bigger than GIANT_R is kept with probability (GIANT_R / r) ^ GIANT_EXP
// (r = 250: 52%, r = 350: 26%, r = 500: 13%); otherwise it spawns as a small fish (×0.3–0.55 the player)
const GIANT_R = 180;           // the Shark / Sea King boundary
const GIANT_EXP = 2;
const NPC_REACTION_SPREAD = 0.2; // each look-around interval varies by up to ±20% of npcReaction
const NPC_AIM_ERR_HOLD = [0.8, 1.6]; // seconds before an NPC picks a new aim error
const NPC_AIM_ERR_EASE = 1.5;  // per second: how fast the aim error drifts toward the new value (no jumps)
const NPC_TURN_GAIN = 4;       // turn speed per radian of heading error, capped by the size's turn rate
const NPC_LEAP_ZONE = 300;     // wandering bots within this distance (+ 1.5r) of the surface may decide to leap
const NPC_LEAP_CHANCE = 0.2;   // per second, while in that zone

// ---------- Jellyfish (hazard, not lethal) ----------
const JELLY_COUNT = 7;
const JELLY_SHRINK = 0.1;      // fraction of area lost per sting
const JELLY_STUN_TIME = 1.2;
const JELLY_STUN_SLOW = 0.4;
const JELLY_AVOID_DIST = 45;   // gap (edge to edge) at which fish start steering away
const JELLY_TENTACLE_HALF_W = 1.8;
const JELLY_HUES = [330, 285, 205, 25, 170, 55];
const JELLY_SURFACE_MARGIN = 60; // jellyfish drift no closer to the surface than this

// ---------- Hit shapes (match what drawFish / the jellyfish renderer actually draw) ----------
// Fish: circles along the body axis, [offset along heading, radius], both in units of r
const FISH_HIT = [[0.55, 0.4], [0.05, 0.56], [-0.45, 0.4], [-1.3, 0.28]];
// The only part that can eat: the head in front of the gill line, [offset along heading, radius]
const MOUTH_HIT = [0.72, 0.32];

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
