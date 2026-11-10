'use strict';

// Wiggle Wars — the weapons and tools, as plain data. kind says how sim/weapons.js uses it:
//   missile (flies, explodes on touch), grenade (bounces, fuse), hitscan, melee, drop, airstrike,
//   drill, jetpack, teleport, plank, power (a power-up for the turn), skip.
// ammo: -1 = endless; delay: rounds from the match's start before it can be used; r / dmg: the blast;
// crate: how often a weapon crate holds it (0 = never); ends: using it ends the turn (then retreat s).
// Texts go through tr(). Used by sim/, ui/arsenal.js, ui/setup.js and art/weapons.js.

const WEAPONS = {
  bazooka:   { kind: 'missile', name: 'Bazooka', desc: 'Hold to charge, let go to fire. The wind carries it.',
               ammo: -1, delay: 0, r: 38, dmg: 48, speed: 820, wind: true, charge: true, crate: 0, retreat: RETREAT_TIME },
  homing:    { kind: 'missile', name: 'Homing Missile', desc: 'Pick a target, then fire: it turns towards the target.',
               ammo: 1, delay: 2, r: 38, dmg: 48, speed: 820, homing: { after: 0.5, speed: 520, turn: 5, time: 3.5 },
               charge: true, target: true, crate: 3, retreat: RETREAT_TIME },
  grenade:   { kind: 'grenade', name: 'Grenade', desc: 'Bounces and explodes when its fuse runs out (1–5 s).',
               ammo: -1, delay: 0, r: 40, dmg: 48, speed: 700, bounce: 0.45, charge: true, fuse: true, crate: 0, retreat: RETREAT_TIME },
  cluster:   { kind: 'grenade', name: 'Cluster Bomb', desc: 'A grenade that throws five bomblets when it explodes.',
               ammo: 3, delay: 1, r: 30, dmg: 30, speed: 700, bounce: 0.45, charge: true, fuse: true,
               bomblets: { n: 5, r: 20, dmg: 18, speed: 260 }, crate: 4, retreat: RETREAT_TIME },
  shotgun:   { kind: 'hitscan', name: 'Shotgun', desc: 'Two instant shots a turn, along the aim.',
               ammo: -1, delay: 0, r: 12, dmg: 25, range: 650, shots: 2, crate: 0, retreat: RETREAT_TIME },
  bat:       { kind: 'melee', name: 'Bat', desc: 'Swing it at a worm next to you to send it flying.',
               ammo: 2, delay: 0, dmg: 30, reach: 22, push: 620, crate: 3, retreat: RETREAT_TIME },
  dynamite:  { kind: 'drop', name: 'Dynamite', desc: 'Drop it, run: a big blast after 5 seconds.',
               ammo: 1, delay: 1, r: 72, dmg: 75, fuseTime: 5, crate: 3, retreat: RETREAT_DROP },
  mine:      { kind: 'drop', name: 'Mine', desc: 'Drop it: it goes off when a worm comes close.',
               ammo: 2, delay: 0, r: 42, dmg: 45, mine: true, crate: 3, retreat: RETREAT_DROP },
  airstrike: { kind: 'airstrike', name: 'Air Strike', desc: 'Pick a target: five bombs fall on it from the side you face.',
               ammo: 1, delay: 3, r: 30, dmg: 28, bombs: 5, gap: 26, target: true, wind: true, crate: 2, retreat: RETREAT_TIME },
  drill:     { kind: 'drill', name: 'Drill', desc: 'Dig a tunnel along the aim for a few seconds.',
               ammo: 2, delay: 0, r: 11, speed: 55, time: 2.8, crate: 2, retreat: 2 },
  jetpack:   { kind: 'jetpack', name: 'Jetpack', desc: 'Fly for 4 seconds, then land and use another weapon.',
               ammo: 2, delay: 0, fuel: 4, thrust: 900, side: 320, max: 230, crate: 2, keepsTurn: true },
  teleport:  { kind: 'teleport', name: 'Teleport', desc: 'Pick any free place and appear there.',
               ammo: 2, delay: 0, target: true, crate: 2, retreat: 2 },
  plank:     { kind: 'plank', name: 'Plank', desc: 'Build a steel beam near you: pick the place, turn it with up / down.',
               ammo: 3, delay: 0, len: 110, thick: 10, range: 220, target: true, crate: 2, retreat: RETREAT_TIME },
  double:    { kind: 'power', name: 'Double Damage', desc: 'Every hit does double damage for the rest of this turn.',
               ammo: 0, delay: 0, crate: 0, keepsTurn: true, crateOnly: true },
  lowgrav:   { kind: 'power', name: 'Low Gravity', desc: 'Half the gravity for the rest of this turn.',
               ammo: 0, delay: 0, crate: 0, keepsTurn: true, crateOnly: true },
  skip:      { kind: 'skip', name: 'Skip Turn', desc: 'End the turn now.', ammo: -1, delay: 0, crate: 0, always: true }
};
const WEAPON_ORDER = ['bazooka', 'homing', 'grenade', 'cluster', 'shotgun', 'bat', 'dynamite', 'mine',
  'airstrike', 'drill', 'jetpack', 'teleport', 'plank', 'double', 'lowgrav', 'skip'];
// the weapons a match can switch on or off in the setup (the rest are always there or crate-only)
const SETUP_WEAPONS = WEAPON_ORDER.filter((id) => !WEAPONS[id].crateOnly && !WEAPONS[id].always);
