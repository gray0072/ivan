'use strict';

// Arlanda Rising — the clock of a running mission: real seconds at a speed (▶ ×1, ▶▶ ×2, ▶▶▶ ×4) become fixed
// steps — OPS_STEP_MIN game minutes in ops time, one day in plan time — so the same decisions give the
// same mission whatever the frame rate, and a resumed mission goes on exactly. Time stops at a stage's
// end and at a decision waiting in plan time. "Skip to next event" runs ahead until a task appears.
// Used by game.js (each frame) and tools/missions-check.js (step by step, with a strategy before each).

const Sim = {
  playing() { return !!(S && S.mission && S.mission.status === 'running' && !(S.plan && S.plan.pending)); },
  advance(realSec, speed) {
    if (!this.playing() || !speed) return;
    const ops = !!S.ops;
    S.mission.acc += ops ? realSec * speed * 60 / OPS_HOUR_SECONDS : realSec * speed / PLAN_DAY_SECONDS;
    const unit = ops ? OPS_STEP_MIN : 1;
    while (this.playing() && S.mission.acc >= unit - 1e-9) {
      S.mission.acc -= unit;
      this.step();
    }
  },
  step() {
    if (S.ops) Ops.step(); else Plan.day();
    if (Missions.ended()) Missions.endStage();
  },
  // ops time with an empty tray: run until a task appears or the stage ends
  skip() {
    if (!S.ops || S.ops.tasks.length) return false;
    for (let n = 0; n < 4000 && this.playing() && S.ops && !S.ops.tasks.length; n++) this.step();
    return true;
  }
};
