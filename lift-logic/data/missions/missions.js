'use strict';

// Lift Logic — the list every building's mission file adds to (data/missions/<building>.js), and the
// reference solutions (data/solutions/<building>.js) in the text notation of sim/program.js. A mission:
//   id '1-3', building, n, kind (build | fill | fix | tiny | beat | exam), name,
//   brief (the client's 2–3 lines), goal (one line), stars (three conditions, see sim/stats.js),
//   floors / lifts / lobby / clock (the building of this day, when not the building's own),
//   schedule (fixed people: t, who, from, to, id; `after` + `delay` for someone who comes back after an
//   earlier ride), flows (from, to, perMin, t0, t1, who), day (s of arrivals),
//   start (the starting program, text notation), newBlocks, concept (Grandpa Gears' card), fact (Museum),
//   hints (1–2 lines of the idea), guided (the pointing finger), seed.
// Read by the screens, sim/run.js and tools/missions-check.js.

const MISSIONS = [];
const MISSION = {};
const SOLUTIONS = {};

function addMissions(building, list) {
  list.forEach((m, k) => {
    m.building = building;
    m.n = k + 1;
    m.chapter = BUILDING[building].chapter;
    m.id = m.chapter + '-' + m.n;
    MISSIONS.push(m);
    MISSION[m.id] = m;
  });
}
function addSolutions(map) { Object.assign(SOLUTIONS, map); }

// the missions of a building, in order
function buildingMissions(id) { return MISSIONS.filter((m) => m.building === id); }
