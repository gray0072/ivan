'use strict';

// Wiggle Wars — the campaign's twelve missions, as plain data. Each has a fixed map seed (the same
// map every time), a goal (defeat / targets / crate), both teams, the match settings and the
// weapons it adds to those of the missions before it. Texts go through tr(). Used by sim/match.js
// and ui/screens.js (the campaign list and the briefing).
//   goal.turns: the player's turns allowed (targets, crate); goal.par: turns for ★★★

const MISSIONS = [
  { name: 'Boot Camp', story: 'Welcome, recruit! Learn to aim: hold Fire longer to shoot further. Mind the wind.',
    goal: { type: 'targets', count: 5, turns: 10, par: 5 },
    map: { kind: 'hills', theme: 'meadow', seed: 1101 }, wind: 'off',
    you: { n: 1 }, enemy: null, adds: ['bazooka'] },
  { name: 'First Contact', story: 'The Rotters have landed on our meadow. Show them the way home!',
    goal: { type: 'defeat' },
    map: { kind: 'hills', theme: 'meadow', seed: 2207 }, wind: 'normal',
    you: { n: 2, hp: 100 }, enemy: { n: 2, hp: 60 }, adds: ['grenade'] },
  { name: 'Bouncing Practice', story: 'Some targets hide behind the rocks. A grenade bounces round corners — set its fuse with care.',
    goal: { type: 'targets', count: 5, turns: 10, par: 6 },
    map: { kind: 'canyon', theme: 'meadow', seed: 3313 }, wind: 'normal',
    you: { n: 1 }, enemy: null, adds: [] },
  { name: 'Sand Trap', story: 'A desert canyon full of oil barrels. One good shot can do a lot of damage.',
    goal: { type: 'defeat' },
    map: { kind: 'canyon', theme: 'desert', seed: 4421 }, wind: 'normal', barrels: 4,
    you: { n: 3, hp: 100 }, enemy: { n: 3, hp: 80 }, adds: ['shotgun', 'bat', 'dynamite'] },
  { name: 'Island Hopping', story: 'The enemy sits on the far islands. Fly, teleport or call in an air strike.',
    goal: { type: 'defeat' },
    map: { kind: 'islands', theme: 'meadow', seed: 5531 }, wind: 'normal', crates: 'some',
    you: { n: 3, hp: 100 }, enemy: { n: 3, hp: 100 }, adds: ['teleport', 'jetpack', 'airstrike'] },
  { name: 'Minefield', story: 'The dunes are full of mines. Step carefully — or push the Rotters onto them.',
    goal: { type: 'defeat' },
    map: { kind: 'hills', theme: 'desert', seed: 6619 }, wind: 'normal', mines: 8,
    you: { n: 3, hp: 100 }, enemy: { n: 4, hp: 80 }, adds: ['mine', 'cluster'] },
  { name: 'Underground', story: 'Deep in the frozen caves. Drill through the rock and build bridges with planks.',
    goal: { type: 'defeat' },
    map: { kind: 'cavern', theme: 'snow', seed: 7727 }, wind: 'off', sd: 15,
    you: { n: 3, hp: 100 }, enemy: { n: 3, hp: 100 }, adds: ['drill', 'plank'] },
  { name: 'Supply Run', story: 'A golden crate fell on the far side of the canyon. Get it before the Rotters stop you!',
    goal: { type: 'crate', turns: 8, par: 3 },
    map: { kind: 'canyon', theme: 'snow', seed: 8839 }, wind: 'normal',
    you: { n: 3, hp: 100 }, enemy: { n: 3, hp: 100 }, adds: [] },
  { name: 'Frozen Peaks', story: 'A storm on the mountain tops: the wind is strong today.',
    goal: { type: 'defeat' },
    map: { kind: 'canyon', theme: 'snow', seed: 9941 }, wind: 'strong',
    you: { n: 4, hp: 100 }, enemy: { n: 4, hp: 100 }, adds: [] },
  { name: 'Moonwalk', story: 'On the Moon everything flies far. A homing missile finds its way.',
    goal: { type: 'defeat' },
    map: { kind: 'hills', theme: 'moon', seed: 10061 }, wind: 'normal', crates: 'some',
    you: { n: 4, hp: 100 }, enemy: { n: 4, hp: 100 }, adds: ['homing'] },
  { name: 'Rising Tide', story: 'The sea is rising from the third round. Finish them before the islands go under!',
    goal: { type: 'defeat' },
    map: { kind: 'islands', theme: 'desert', seed: 11173 }, wind: 'normal', sd: 2,
    you: { n: 4, hp: 100 }, enemy: { n: 5, hp: 100 }, adds: [] },
  { name: 'Final Battle', story: 'Their whole army in their own caves. Everything you have learned — now!',
    goal: { type: 'defeat' },
    map: { kind: 'cavern', theme: 'meadow', seed: 12289 }, wind: 'normal', crates: 'many', mines: 4, barrels: 4,
    you: { n: 4, hp: 100 }, enemy: { n: 6, hp: 120 }, adds: [] }
];

const CAMPAIGN_TEAM = 'Heroes';
const CAMPAIGN_ENEMY = 'The Rotters';

// the weapons of mission i: everything its missions so far have added
function missionWeapons(i) {
  const list = [];
  for (let k = 0; k <= i; k++) for (const w of MISSIONS[k].adds) if (!list.includes(w)) list.push(w);
  return list;
}
