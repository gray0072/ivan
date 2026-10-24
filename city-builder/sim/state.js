'use strict';

// City Builder — the shared state of the logic, declared once. `city` is everything that is saved
// (core/storage.js); `run` is what is rebuilt from it on load (the tile → building index, the
// connected roads) plus what lives only while the page is open (game speed, trucks, cars, planes).
// Every sim/ file reads and changes these; render/ and ui/ only read them.

const T_GRASS = 0, T_WATER = 1, T_FOREST = 2;

// city = {
//   name, seed, difficulty, money, tax, month (whole months since the start), tick (s into the month),
//   terrain: Uint8Array (T_*), road: Uint8Array (1 = road / bridge), highwayY,
//   buildings: [{ id, type, x, y, level, residents, workers, happy, happyMonths, sadMonths,
//                 damaged, fire (s burning, 0 = none), ruin, connected, variant }],
//   nextId, milestone, cheated, debtMonths, debtWarned,
//   stats: { population, jobs, workforce, employed, unemployment, income, expense, taxRes, taxBiz,
//            upkeepRoads, upkeepBuildings },
//   flood: null | { reach, level, phase: 'rise' | 'hold' | 'fall', t, dist: Int8Array }
// }
let city = null;

const run = {
  speed: 1,                                       // index into SPEEDS
  occ: new Int32Array(MAP_SIZE * MAP_SIZE),       // building id on each tile, 0 = none
  byId: new Map(),
  linked: new Uint8Array(MAP_SIZE * MAP_SIZE),    // road tiles connected to the highway
  linksDirty: true,                               // roads or buildings changed: recompute `linked`
  happyDirty: true,                               // something that changes happiness was built or removed
  trucks: [],                                     // fire trucks on the way: { station, target, path, i, t, state }
  cars: [],                                       // decorative traffic
  planes: [],                                     // decorative planes at the airports
  time: 0                                         // game seconds since the page opened (animations)
};

function idx(x, y) { return y * MAP_SIZE + x; }
function inMap(x, y) { return x >= 0 && y >= 0 && x < MAP_SIZE && y < MAP_SIZE; }
function buildingAt(x, y) { return inMap(x, y) ? run.byId.get(run.occ[idx(x, y)]) || null : null; }
function isRoad(x, y) { return inMap(x, y) && city.road[idx(x, y)] === 1; }
function def(b) { return BUILDINGS[b.type]; }

// rebuilds the tile index from the building list (after a load or a new map)
function reindex() {
  run.occ.fill(0);
  run.byId.clear();
  for (const b of city.buildings) {
    run.byId.set(b.id, b);
    const d = def(b);
    for (let y = b.y; y < b.y + d.h; y++) for (let x = b.x; x < b.x + d.w; x++) run.occ[idx(x, y)] = b.id;
  }
  run.linksDirty = true;
  run.happyDirty = true;
  run.trucks = [];
  run.cars = [];
  run.planes = [];
}

function unlocked(type) {
  const d = BUILDINGS[type] || TOOL_INFO[type];
  return !!d && (city.cheatUnlockAll || d.unlock <= city.milestone);
}
