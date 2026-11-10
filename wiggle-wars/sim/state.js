'use strict';

// Wiggle Wars — the state the logic files share, declared once: the match (teams, worms, objects,
// shots in the air, timers, the turn), plus small helpers to read it. sim/ changes it; render/ and
// ui/ only read it. A match is built by sim/match.js.
//
// match = {
//   mode: 'versus' | 'campaign' | 'demo', mission (index or null), difficulty, cheated,
//   themeId, theme, kind, seed, gravity (the map's ×), windMul, settings (the versus settings),
//   teams: [{ name, color, cpu, worms, ammo: { id: n }, next, turns, startHp, stats: { dmg, kills }, trace }],
//   worms: [{ id, name, team, x, y (feet), vx, vy, grounded, thrown, facing, aim, hp, alive,
//             drowned, state: 'idle' | 'jet' | 'drill', walkAcc, air (s in the air) }],
//   objects: [{ type: 'crate' | 'gold' | 'mine' | 'barrel' | 'target' | 'grave', x, y, vx, vy, grounded, r, … }],
//   shots: [{ w, x, y, vx, vy, age, fuse, owner, team, rest, bomblet, target, trace }],
//   timers: [{ t, x, y, r, dmg, src }]   delayed explosions (chains),
//   wind (−1 … 1), water (y of the surface), round, turnCount, suddenDeath,
//   turn: see sim/turn.js, focus (what the camera should look at), over, result
// }

let match = null;

function activeWorm() { return match && match.turn ? match.turn.worm : null; }
function activeTeam() { return match && match.turn ? match.teams[match.turn.team] : null; }
function livingWorms(team) { return team.worms.filter((w) => w.alive && w.hp > 0); }
function teamHealth(team) { return team.worms.reduce((s, w) => s + (w.alive ? w.hp : 0), 0); }
function wormCenterY(w) { return w.y - WORM_R; }
function gravityNow() {
  return GRAVITY * match.gravity * (match.turn && match.turn.lowgrav ? LOW_GRAVITY : 1);
}
// can this team use the weapon now (ammo, the match's round, cheats)
function weaponReady(team, id) {
  const w = WEAPONS[id];
  if (w.always) return true;
  const n = team.ammo[id] || 0;
  if (n === 0) return false;
  return team.allWeapons || match.round > w.delay;
}
function weaponWaits(team, id) {
  const w = WEAPONS[id];
  return team.allWeapons ? 0 : Math.max(0, w.delay - match.round + 1);
}
