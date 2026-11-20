'use strict';

// Lift Logic — a run: one day of a mission's building lived by the player's program. Run.start builds the
// shared state (sim/state.js) from the mission, Run.step advances it by SIM_DT (people appear and get
// moods, the lifts move and open, then the program's threads run), Run.finish runs the rest of the day at
// once. Deterministic from the mission's seed: the same program on the same mission always gives the same
// day, which is what "Show me" and the reference checks rely on. Used by game.js and tools/missions-check.js.

const Run = {
  start(mission, program, difficulty, opts = {}) {
    const m = typeof mission === 'string' ? MISSION[mission] : mission;
    const b = BUILDING[m.building];
    const seed = opts.seed !== undefined ? opts.seed : (m.seed || hashOf(m.id));
    let day = m.day || 0;
    for (const e of m.schedule || []) if (!e.after) day = Math.max(day, e.t || 0);
    for (const f of m.flows || []) day = Math.max(day, f.t1);
    run = {
      mission: m, building: b, difficulty, diff: DIFFICULTY[difficulty] || DIFFICULTY.medium, seed,
      t: 0, steps: 0, over: false, endReason: null, tEnd: null, day, lastSpawn: 0,
      floors: floorLabels(m.floors || b.floors, m.basements || 0), lobby: m.lobby || 1,
      clock0: m.clock !== undefined ? m.clock : DAY_START_CLOCK, clockRate: m.clockRate !== undefined ? m.clockRate : 1 / 60,
      program: Prog.clone(program), blocks: Prog.count(program),
      rng: seededRandom(seed), progRng: seededRandom((seed ^ 0x9e3779b9) >>> 0),
      energy: 0, delivered: 0, gaveUp: 0, total: 0,
      counters: { says: 0, emptyTrips: 0, fullStops: 0, refused: 0, pranks: 0, wrongWay: 0 },
      log: [], stopsLog: [], cheated: !!opts.cheated, cheatPatience: false, quietSince: null
    };
    Building.init();
    run.lifts = (m.lifts || [{ type: b.lift }]).map((s, k) => Lift.create(k + 1, s));
    run.lifts.forEach((L, k) => {
      const z = (m.lifts || [])[k] && m.lifts[k].zone;
      if (z) L.zone = [floorIndex(z[0]), floorIndex(z[1])];
    });
    People.init();
    VM.init();
    return run;
  },

  step() {
    if (!run || run.over) return;
    const before = run.people.length;
    People.spawnDue();
    if (run.people.length !== before) run.lastSpawn = run.t;
    People.update();
    for (const L of run.lifts) Lift.update(L, SIM_DT);
    VM.step();
    run.t = Math.round((run.t + SIM_DT) * 1000) / 1000;
    run.steps++;
    // everyone is done: the run ends once the lifts stand still with the doors closed (a last `say`
    // still runs), or after END_GRACE s when a program keeps them going
    if (!run.pending.length && !run.chains.length && !People.active()) {
      if (run.quietSince === null) run.quietSince = run.t;
      const still = run.lifts.every((L) => !L.moving && L.doorPhase === 'closed');
      if (still || run.t - run.quietSince >= END_GRACE) Run.end('done');
    } else {
      run.quietSince = null;
      if (run.t >= Math.max(run.day, run.lastSpawn) + OVERTIME_MAX) Run.end('time');
    }
  },

  end(reason) {
    if (run.over) return;
    run.over = true;
    run.endReason = reason;
    run.tEnd = run.t;
    GameEvents.emit('runOver', { reason });
  },

  // the rest of the day at once (Skip to the end, the checker); stops at `untilT` when given
  finish(untilT) {
    GameEvents.mute(true);
    try {
      const limit = 200000;
      for (let k = 0; k < limit && !run.over; k++) {
        if (untilT !== undefined && run.t >= untilT) break;
        Run.step();
      }
    } finally { GameEvents.mute(false); }
  }
};

// a whole day of `program` on `mission`, headless: the run, its numbers and its stars
function simulate(mission, program, difficulty, opts) {
  const keep = run;
  try {
    Run.start(mission, program, difficulty, opts);
    Run.finish();
    const r = run;
    return { run: r, stats: Stats.compute(r), judged: Stars.judge(r) };
  } finally { run = keep; }
}
