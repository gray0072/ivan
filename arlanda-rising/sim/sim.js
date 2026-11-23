'use strict';

// Arlanda Rising — the clock of a running mission: real seconds at a speed (▶ ×1, ▶▶ ×2, ▶▶▶ ×4) become fixed
// steps — OPS_STEP_MIN game minutes in ops time, one day in plan time — so the same decisions give the
// same mission whatever the frame rate, and a resumed mission goes on exactly. Time stops at a stage's
// end and at a decision waiting in plan time. "Skip to next event" runs ahead until a task appears.
// Free Play from the forest (S.free) steps by its own driver (sim/free.js: the played day, then the night) at the pace
// sim/freepace.js gives for each step; the missions keep their constant pace.
// Used by game.js (each frame) and tools/missions-check.js (step by step, with a strategy before each).

const Sim = {
  playing() { return !!(S && S.mission && S.mission.status === 'running' && !(S.plan && S.plan.pending)); },
  advance(realSec, speed) {
    if (!this.playing() || !speed) return;
    if (S.free) { Free.advance(realSec, speed); return; }
    const ops = !!S.ops;
    S.mission.acc += ops ? realSec * speed * 60 / OPS_HOUR_SECONDS : realSec * speed / PLAN_DAY_SECONDS;
    const unit = ops ? OPS_STEP_MIN : 1;
    while (this.playing() && S.mission.acc >= unit - 1e-9) {
      S.mission.acc -= unit;
      this.step();
    }
  },
  step() {
    if (S.free) { Free.step(); return; }
    if (S.ops) Ops.step(); else Plan.day();
    if (Missions.ended()) Missions.endStage();
  },
  // the clock the map draws at: the sim's clock and the part of the next step already run (its positions are worked
  // out from times, so the aircraft and the vehicles move every frame, not once a step); in Free Play `acc` is the share
  // of the next step
  clockNow() {
    if (!S.ops || !S.mission || !this.playing()) return S.clock;
    return S.clock + (S.free ? clamp(S.mission.acc || 0, 0, 1) * OPS_STEP_MIN : clamp(S.mission.acc || 0, 0, OPS_STEP_MIN));
  },
  // ops time with an empty tray: run until a task appears or the stage ends
  skip() {
    if (!S.ops || S.ops.tasks.length) return false;
    for (let n = 0; n < 4000 && this.playing() && S.ops && !S.ops.tasks.length; n++) this.step();
    return true;
  }
};
