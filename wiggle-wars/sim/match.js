'use strict';

// Wiggle Wars — a new match: from the versus settings (newVersus), a campaign mission
// (newMission) or the menu's silent CPU-vs-CPU demo (newDemo). Builds the land, the teams with
// their ammo, the worms on free spots and the map's objects, then starts the first turn.
// Used by game.js and headless tests.

// the versus setup's defaults (ui/setup.js shows and changes them, core/storage.js keeps them)
function defaultSettings() {
  return {
    teams: DEFAULT_TEAMS.map((t) => Object.assign({}, t)),
    worms: 4, hp: 100, turnTime: 45, map: 'random', theme: 'random', seed: null,
    wind: 'normal', crates: 'some', mines: 3, barrels: 3, sd: 12,
    weapons: Object.fromEntries(SETUP_WEAPONS.map((id) => [id, true]))
  };
}

// cfg = { mode, mission, difficulty, teams: [{ name, color, cpu, n, hp }], kind, theme, seed, wind,
//   crates, mines, barrels, sd, turnTime, enabled: [weapon ids], goal, targets }
function buildMatch(cfg) {
  const theme = THEMES[cfg.theme];
  match = {
    mode: cfg.mode, mission: cfg.mission === undefined ? null : cfg.mission, difficulty: cfg.difficulty, cheated: false,
    themeId: cfg.theme, theme, kind: cfg.kind, seed: cfg.seed, gravity: theme.gravity, windMul: theme.wind,
    settings: { sd: cfg.sd || 0 }, windSetting: cfg.wind, crates: cfg.crates, turnTime: cfg.turnTime,
    enabled: cfg.enabled, goal: cfg.goal || null,
    teams: [], worms: [], objects: [], shots: [], timers: [],
    wind: 0, water: WATER_Y, round: 0, turnCount: 0, suddenDeath: false, turn: null, focus: null,
    over: false, result: null, decided: false, slowmo: 0, targetsLeft: 0, goldTaken: false, goldLost: false,
    firstTeam: 0
  };
  MapGen.generate(cfg.kind, cfg.seed);
  const rnd = seededRandom((cfg.seed ^ 0x5bd1e995) >>> 0);
  const names = shuffle(WORM_NAMES.slice(), rnd);
  let id = 0;
  cfg.teams.forEach((tc, ti) => {
    const ammo = {};
    for (const wid of WEAPON_ORDER) {
      const def = WEAPONS[wid];
      ammo[wid] = def.always ? -1 : def.crateOnly ? 0 : cfg.enabled.includes(wid) ? def.ammo : 0;
    }
    const team = { name: tc.name, color: tc.color, cpu: !!tc.cpu, worms: [], ammo, next: 0, turns: 0, startHp: 0,
      stats: { dmg: 0, kills: 0 }, trace: null, lastWeapon: null, lastPower: 0.6, fuse: 3, allWeapons: false };
    for (let k = 0; k < tc.n; k++) {
      const w = { id: id++, name: names[(ti * 7 + k) % names.length], team: ti, x: 0, y: 0, vx: 0, vy: 0, grounded: false,
        thrown: false, facing: 1, aim: 20, hp: tc.hp, alive: true, drowned: false, state: 'idle', walkAcc: 0, air: 0, r: WORM_R };
      team.worms.push(w);
      match.worms.push(w);
    }
    team.startHp = tc.hp * tc.n;
    match.teams.push(team);
  });
  // worm names never repeat across teams
  match.worms.forEach((w, i) => { w.name = names[i % names.length]; });

  // places: worms first (teams in turn), then targets, the golden crate, mines, barrels
  const spots = Terrain.standSpots(5).filter((s) => s.y < WATER_Y - 40);
  // worms start under the open sky (in a cavern: under a high enough ceiling), else with room above
  const roomy = (room) => spots.filter((s) => { for (let k = 24; k < room && s.y - k > 0; k += 3) if (Terrain.solid(s.x, s.y - k)) return false; return true; });
  const enough = (list) => list.length >= 4 * match.worms.length;
  const sky = cfg.kind === 'cavern' ? roomy(70) : roomy(WORLD_H);
  const wormSpots = enough(sky) ? sky : enough(roomy(160)) ? roomy(160) : spots;
  const placed = [];
  const order = [];
  const most = Math.max(...match.teams.map((t) => t.worms.length));
  for (let k = 0; k < most; k++) for (const t of match.teams) if (t.worms[k]) order.push(t.worms[k]);
  for (const w of order) {
    const s = MapGen.pickSpot(wormSpots, rnd, placed, Math.max(SPAWN_GAP, 900 / Math.sqrt(order.length + 1)));
    w.x = s.x; w.y = s.y; w.grounded = true;
    w.facing = s.x < WORLD_W / 2 ? 1 : -1;
    placed.push(s);
  }
  const mine = match.teams[0].worms;
  const fromMe = (s) => Math.min(...mine.map((w) => Math.hypot(w.x - s.x, w.y - s.y)));
  const objectSpots = (gap) => spots.filter((s) => placed.every((p) => Math.hypot(p.x - s.x, p.y - s.y) >= gap));
  if (cfg.targets) {
    const ok = wormSpots.filter((s) => fromMe(s) > 260);
    for (let k = 0; k < cfg.targets; k++) {
      const s = MapGen.pickSpot(ok.length ? ok : spots, rnd, placed, 170);
      Objects.add('target', s.x, s.y, { grounded: true });
      placed.push(s);
    }
    match.targetsLeft = cfg.targets;
  }
  if (cfg.goal && cfg.goal.type === 'crate') {
    let best = spots[0], bestD = -1;
    for (const s of spots) {
      const d = fromMe(s) - s.y * 0.3;
      if (d > bestD && placed.every((p) => Math.hypot(p.x - s.x, p.y - s.y) > 40)) { bestD = d; best = s; }
    }
    Objects.add('gold', best.x, best.y, { grounded: true });
    placed.push(best);
  }
  for (let k = 0; k < (cfg.mines || 0); k++) {
    const ok = objectSpots(MINE_KEEP_AWAY);
    if (!ok.length) break;
    const s = MapGen.pickSpot(ok, rnd, placed, 40);
    Objects.add('mine', s.x, s.y, { grounded: true });
    placed.push(s);
  }
  for (let k = 0; k < (cfg.barrels || 0); k++) {
    const ok = objectSpots(40);
    if (!ok.length) break;
    const s = MapGen.pickSpot(ok, rnd, placed, 40);
    Objects.add('barrel', s.x, s.y, { grounded: true, hp: BARREL_HP });
    placed.push(s);
  }
  match.firstTeam = cfg.mode === 'versus' ? Math.floor(Math.random() * match.teams.length) : 0;
  Turn.start();
  return match;
}

function randomSeed() { return Math.floor(Math.random() * 1e9); }

// a versus match from the setup's settings
function newVersus(s, difficulty) {
  const kind = s.map === 'random' ? pick(MAP_ORDER) : s.map;
  const theme = s.theme === 'random' ? pick(THEME_ORDER) : s.theme;
  return buildMatch({
    mode: 'versus', difficulty, kind, theme, seed: s.seed || randomSeed(),
    teams: s.teams.map((t) => ({ name: t.name, color: t.color, cpu: t.cpu, n: s.worms, hp: s.hp })),
    wind: s.wind, crates: s.crates, mines: s.mines, barrels: s.barrels, sd: s.sd, turnTime: s.turnTime,
    enabled: SETUP_WEAPONS.filter((id) => s.weapons[id] !== false)
  });
}

// campaign mission i
function newMission(i, difficulty, color = 'red') {
  const m = MISSIONS[i];
  const teams = [{ name: tr(CAMPAIGN_TEAM), color, cpu: false, n: m.you.n, hp: m.you.hp || 100 }];
  if (m.enemy) teams.push({ name: tr(CAMPAIGN_ENEMY), color: 'rot', cpu: true, n: m.enemy.n, hp: Math.round(m.enemy.hp * DIFFICULTY[difficulty].enemyHp) });
  return buildMatch({
    mode: 'campaign', mission: i, difficulty, kind: m.map.kind, theme: m.map.theme, seed: m.map.seed, teams,
    wind: m.wind || 'normal', crates: m.crates || 'off', mines: m.mines || 0, barrels: m.barrels || 0, sd: m.sd || 0,
    turnTime: 45, enabled: missionWeapons(i), goal: m.goal, targets: m.goal.type === 'targets' ? m.goal.count : 0
  });
}

// the silent CPU-vs-CPU match behind the menu
function newDemo() {
  const colors = shuffle(TEAM_COLORS.slice());
  return buildMatch({
    mode: 'demo', difficulty: 'medium', kind: pick(MAP_ORDER), theme: pick(THEME_ORDER), seed: randomSeed(),
    teams: [0, 1].map((k) => ({ name: 'CPU ' + (k + 1), color: colors[k].id, cpu: true, n: 3, hp: 100 })),
    wind: 'normal', crates: 'some', mines: 3, barrels: 3, sd: 6, turnTime: 30, enabled: SETUP_WEAPONS.slice()
  });
}
