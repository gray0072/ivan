'use strict';

// City Builder — the road network: which road tiles are connected to the highway, which buildings
// touch such a road, and paths along the roads for the fire trucks and the cars.
// Used by sim/build.js, sim/city.js, sim/disasters.js and sim/traffic.js.

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// recomputes run.linked (a flood fill from the highway's first tile) and every building's `connected`
function updateLinks() {
  if (!run.linksDirty) return;
  run.linksDirty = false;
  run.linked.fill(0);
  const start = idx(0, city.highwayY);
  if (city.road[start]) {
    const queue = [start];
    run.linked[start] = 1;
    while (queue.length) {
      const i = queue.pop();
      const x = i % MAP_SIZE, y = (i / MAP_SIZE) | 0;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (!inMap(nx, ny)) continue;
        const j = idx(nx, ny);
        if (city.road[j] && !run.linked[j]) { run.linked[j] = 1; queue.push(j); }
      }
    }
  }
  for (const b of city.buildings) b.connected = roadsAround(b).some((i) => run.linked[i]);
  run.happyDirty = true;
}

// the road tiles touching a building's footprint (its four sides)
function roadsAround(b) {
  const d = def(b), out = [];
  for (let x = b.x; x < b.x + d.w; x++) {
    if (isRoad(x, b.y - 1)) out.push(idx(x, b.y - 1));
    if (isRoad(x, b.y + d.h)) out.push(idx(x, b.y + d.h));
  }
  for (let y = b.y; y < b.y + d.h; y++) {
    if (isRoad(b.x - 1, y)) out.push(idx(b.x - 1, y));
    if (isRoad(b.x + d.w, y)) out.push(idx(b.x + d.w, y));
  }
  return out;
}

// the shortest way along the roads from any of `from` to any of `to` (tile indexes), as a list of
// tile indexes, or null
function roadPath(from, to) {
  if (!from.length || !to.length) return null;
  const goal = new Set(to);
  const prev = new Int32Array(MAP_SIZE * MAP_SIZE).fill(-2);
  const queue = [];
  for (const i of from) { prev[i] = -1; queue.push(i); }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    if (goal.has(i)) {
      const path = [];
      for (let k = i; k !== -1; k = prev[k]) path.push(k);
      return path.reverse();
    }
    const x = i % MAP_SIZE, y = (i / MAP_SIZE) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (!inMap(nx, ny)) continue;
      const j = idx(nx, ny);
      if (city.road[j] && prev[j] === -2) { prev[j] = i; queue.push(j); }
    }
  }
  return null;
}

// the road neighbours of a road tile (for the cars' random walk)
function roadNeighbours(i) {
  const x = i % MAP_SIZE, y = (i / MAP_SIZE) | 0, out = [];
  for (const [dx, dy] of DIRS) if (isRoad(x + dx, y + dy)) out.push(idx(x + dx, y + dy));
  return out;
}
