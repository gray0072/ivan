'use strict';

// City Builder — a new city on a random map: a river running across the map from one edge to the
// other, a lake, forest patches, and the highway that comes in from the map's left edge. The same
// seed always gives the same map. Used by game.js (New City).

// smooth noise 0..1: random values on a coarse grid, blended between the grid points
function valueNoise(rng, size, cell) {
  const n = Math.ceil(size / cell) + 2;
  const grid = [];
  for (let i = 0; i < n * n; i++) grid.push(rng());
  const at = (gx, gy) => grid[gy * n + gx];
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = x / cell, fy = y / cell;
    const gx = Math.floor(fx), gy = Math.floor(fy);
    const tx = smooth(fx - gx), ty = smooth(fy - gy);
    const a = lerp(at(gx, gy), at(gx + 1, gy), tx);
    const b = lerp(at(gx, gy + 1), at(gx + 1, gy + 1), tx);
    return lerp(a, b, ty);
  };
}

function generateMap(seed) {
  const rng = seededRandom(seed);
  const N = MAP_SIZE;
  const terrain = new Uint8Array(N * N);
  const road = new Uint8Array(N * N);
  const highwayY = 18 + Math.floor(rng() * 12);

  // the river: from the top edge (y = 0) to the bottom one, meandering on the right part of the map
  let rx = 30 + rng() * 8, drift = 0;
  for (let y = 0; y < N; y++) {
    const w = 2 + (rng() < 0.35 ? 1 : 0);
    const x0 = Math.round(rx - w / 2);
    for (let x = x0; x < x0 + w; x++) if (inMap(x, y)) terrain[y * N + x] = T_WATER;
    drift = clamp(drift + (rng() - 0.5) * 0.5, -0.8, 0.8);
    rx = clamp(rx + drift, 26, 42);
    if (rx === 26 || rx === 42) drift = -drift * 0.5;
  }

  // the lake, away from the highway
  const lx = 7 + rng() * 10, ly = highwayY < 24 ? 35 + rng() * 6 : 7 + rng() * 6;
  const lrx = 3 + rng() * 2.5, lry = 3 + rng() * 2.5;
  const shore = valueNoise(rng, N, 3);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = Math.hypot((x - lx) / lrx, (y - ly) / lry);
    if (d < 0.8 + shore(x, y) * 0.45) terrain[y * N + x] = T_WATER;
  }

  // forests: where a smooth noise is high, plus a few small groves
  const woods = valueNoise(rng, N, 7);
  const groves = valueNoise(rng, N, 2.5);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (terrain[i] === T_WATER) continue;
    if (woods(x, y) > 0.62 || groves(x, y) > 0.86) terrain[i] = T_FOREST;
  }

  // the highway and an open field where it ends, for the first houses
  const hx = HIGHWAY_LEN;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (terrain[i] === T_FOREST && (Math.hypot(x - hx - 2, y - highwayY) < 6 || (Math.abs(y - highwayY) <= 1 && x < hx))) terrain[i] = T_GRASS;
  }
  for (let x = 0; x < HIGHWAY_LEN; x++) {
    terrain[highwayY * N + x] = T_GRASS;
    road[highwayY * N + x] = 1;
  }
  return { terrain, road, highwayY };
}

function newCity(difficulty, seed) {
  seed = seed === undefined ? Math.floor(Math.random() * 2147483647) : seed;
  const map = generateMap(seed);
  city = {
    name: CITY_NAMES[seed % CITY_NAMES.length],
    seed, difficulty,
    money: DIFFICULTY[difficulty].startMoney,
    tax: TAX_DEFAULT,
    month: 0, tick: 0,
    terrain: map.terrain, road: map.road, highwayY: map.highwayY,
    buildings: [], nextId: 1,
    milestone: 0, cheated: false, cheatUnlockAll: false,
    debtMonths: 0,
    stats: { population: 0, jobs: 0, workforce: 0, employed: 0, unemployment: 0, income: 0, expense: 0,
      taxRes: 0, taxBiz: 0, upkeepRoads: 0, upkeepBuildings: 0 },
    flood: null
  };
  reindex();
  return city;
}
