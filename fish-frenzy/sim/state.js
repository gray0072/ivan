'use strict';

// Shared game state: the screen the world is seen on, the difficulty, the run's flags, the player and every
// entity list. The sim/ files change it, render/ and ui/ read it, game.js drives the flow.

// ---------- Screen ----------
let screenW = 0, screenH = 0;  // CSS pixels, set by game.js on resize
let crowdShare = 1;            // the graphics preset's share of a big screen's extra population (GRAPHICS.crowd)

// ---------- Difficulty ----------
let difficultyKey = 'medium';
let difficulty = DIFFICULTIES[difficultyKey];

// ---------- Game state ----------
let gameState = 'start'; // start | playing | paused | over
let elapsed = 0;         // in-game seconds for the current run (pauses don't count)
let cheated = false;
let reachedFinalStage = false;
let reachedMaxSize = false;
let lastStageIndex = 0;
// Demo mode: an Easy run steered by the bot brain with the dash held down; any key or tap returns to the menu
let demo = false;

// ---------- Player ----------
const player = {
  x: 0, y: FLOOR_Y - WATER_DEPTH / 2,
  air: null,      // { vx, vy, g } while flying above the surface
  heading: 0,
  r: BASE_R,
  turnInput: 0,
  boost: 1,       // stamina 0..difficulty.boostMax
  boosting: false,
  wagPhase: 0,
  stunTimer: 0,
  invulnTimer: 0,
  alive: true,
  growQueue: []   // pending growth from meals, applied gradually over GROW_TIME
};

// ---------- Entities ----------
const foods = [];
const npcs = [];
const jellies = [];   // hazard, not lethal
const birds = [];     // seagulls over the water
const feathers = [];  // from an eaten gull: tumble down, float on the water, fade
const particles = [];
const bubbles = [];   // rise and wobble instead of decelerating like burst particles
const drops = [];     // splash droplets { x, y, vx, vy, r, g }
const foams = [];     // surface foam { x, w, h (spray crown height), life, maxLife }
