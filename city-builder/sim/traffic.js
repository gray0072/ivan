'use strict';

// City Builder — the cars driving around the connected roads, more of them the bigger the city.
// Pure decoration: they wander from tile to tile and never get stuck. Used by game.js (each frame)
// and drawn by render/render.js.

const CAR_COLORS = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#f5f5f5', '#8e24aa', '#fb8c00', '#00acc1', '#3949ab', '#6d4c41'];

function randomLinkedRoad() {
  for (let k = 0; k < 80; k++) {
    const i = Math.floor(Math.random() * run.linked.length);
    if (run.linked[i]) return i;
  }
  return -1;
}

function trafficUpdate(dt) {
  const want = Math.min(CARS_MAX, Math.floor(city.stats.population / CAR_PER_RESIDENTS) + (city.stats.population > 0 ? 1 : 0));
  if (run.cars.length < want && Math.random() < dt * 2) {
    const i = randomLinkedRoad();
    if (i >= 0) {
      const next = roadNeighbours(i);
      if (next.length) run.cars.push({ from: i, to: pick(next), t: 0, color: pick(CAR_COLORS), speed: CAR_SPEED * rand(0.8, 1.2) });
    }
  }
  if (run.cars.length > want) run.cars.length = want;
  for (let k = run.cars.length - 1; k >= 0; k--) {
    const c = run.cars[k];
    if (!city.road[c.from] || !city.road[c.to]) { run.cars.splice(k, 1); continue; }
    c.t += c.speed * dt;
    while (c.t >= 1) {
      c.t -= 1;
      const opts = roadNeighbours(c.to);
      const forward = opts.filter((j) => j !== c.from);
      const next = forward.length ? pick(forward) : opts.length ? opts[0] : -1;
      if (next < 0) { run.cars.splice(k, 1); break; }
      c.from = c.to;
      c.to = next;
    }
  }
}

// a car's (or a truck's) place in tile coordinates and its heading, between two tile centres
function vehiclePos(from, to, t, lane) {
  const fx = from % MAP_SIZE + 0.5, fy = Math.floor(from / MAP_SIZE) + 0.5;
  const tx = to % MAP_SIZE + 0.5, ty = Math.floor(to / MAP_SIZE) + 0.5;
  const dx = tx - fx, dy = ty - fy;
  return { u: fx + dx * t - dy * lane, v: fy + dy * t + dx * lane, dx, dy };
}
