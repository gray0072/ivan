'use strict';

// Arlanda Rising — a player made of a strategy: runs a mission's reference strategy (data/strategies/) — the
// tools/missions-check.js player, and later the moves hint 3 shows. A strategy is
//   { tray: { react } — does every tray task (the obvious choice) once it has waited `react` game minutes;
//                       no tray: the tray is left to the duty manager,
//     choices: { decision id: option id } — the rest take their `default`,
//     moves: [{ stage, at, after, do, ... }] — `stage` the mission's stage (0 first), `at` a clock time in ops
//            time or days into a plan stage, `after` [project, part] finished first; `do`: start (project, part, pace), pace, mod (project,
//            mod), buy (kind, n), desks (n), dir, fees (level), borrow / repay (sum),
//            act (fn: any of sim/actions.js, args) }
// A move is done once, as soon as it is due and works. The runner's own state is { done } (saved with the
// mission in the resume test).

const Strategy = {
  runner(strat) { return { strat: strat || {}, done: {} }; },
  act(r) {
    const m = S.mission;
    if (!m || m.status !== 'running') return;
    const s = r.strat, i = m.stage;
    if (S.plan && S.plan.pending) {
      const def = Plan.pendingDef();
      Plan.choose((s.choices || {})[def.id] || def.default);
    }
    (s.moves || []).forEach((mv, k) => {
      const key = i + ':' + k;
      if ((mv.stage || 0) !== i || r.done[key] || !this.due(mv)) return;
      if (this.apply(mv)) r.done[key] = true;
    });
    if (s.tray && S.ops) {
      for (const t of S.ops.tasks.slice()) if (S.clock - t.t0 >= s.tray.react) Tasks.doTask(t.id);
    }
  },
  due(mv) {
    if (mv.at !== undefined) {
      if (S.ops && S.clock < clockMin(mv.at)) return false;
      if (S.plan && S.day - S.plan.day0 < mv.at) return false;
    }
    if (mv.after && !Construction.stageDone(mv.after[0], mv.after[1])) return false;
    return true;
  },
  apply(mv) {
    switch (mv.do) {
      case 'start': return Actions.start(mv.project, mv.part, mv.pace);
      case 'pace': return Actions.pace(mv.project, mv.part, mv.pace);
      case 'mod': return Actions.mod(mv.project, mv.mod);
      case 'buy': { let ok = true; for (let n = 0; n < (mv.n || 1); n++) ok = Actions.buy(mv.kind) && ok; return ok; }
      case 'desks': Actions.desks(mv.n); return true;
      case 'dir': return Actions.dir(mv.dir);
      case 'fees': return Actions.fees(mv.level);
      case 'borrow': Actions.borrow(mv.sum); return true;
      case 'repay': Actions.repay(mv.sum); return true;
      // any other action by its name: { do: 'act', fn: 'overtime', args: ['stands'] }
      case 'act': return !!Actions[mv.fn](...(mv.args || []));
    }
    throw new Error('unknown move ' + mv.do);
  }
};
