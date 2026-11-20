'use strict';

// Arlanda Rising — the counters of a stage and the goals read from them. A goal is { k, min | max | p, ... }:
//   onTime (p: share of departures on time), avgDelay (max minutes), airportDelay (max minutes the airport
//   caused, on average), lost (max diverted + cancelled),
//   checkinWait (max average minutes), maxWait, profit (min SEK in the stage), money (min SEK of its own now: less the loans),
//   closeCalls (max), noise (max units), dutyTasks (max tasks the duty manager did), playerTasks (min),
//   airlines / passengers / neighbours / staff / safety (min meter), project (id, stages: finished),
//   flag (id: a decision taken), built (kind, n: at least n of it), spent (max SEK on construction).
// A mission's ★ is every stage passed and its own `goal`; ★★ and ★★★ one each of its two `stars`.
// Used by sim/missions.js, the stage card and the results.

const Goals = {
  newStats() {
    return { arr: 0, dep: 0, onTime: 0, delaySum: 0, adelaySum: 0, diverted: 0, cancelled: 0, paxServed: 0, paxWaitSum: 0,
      maxWait: 0, missed: 0, tasksPlayer: 0, tasksDuty: 0, tasksAuto: 0, tasksPeople: 0, overflow: 0, closeCalls: 0,
      noise: 0, nightMoves: 0, income: 0, cost: 0, built: 0, ploughRuns: 0, closedMin: 0, minutes: 0, days: 0, decisions: 0 };
  },
  // the mission's counters: the stages' added up (the longest wait the longest)
  add(total, st) {
    for (const k of Object.keys(st)) total[k] = k === 'maxWait' ? Math.max(total[k] || 0, st[k]) : (total[k] || 0) + st[k];
    return total;
  },
  value(c, st) {
    switch (c.k) {
      case 'onTime': return st.dep ? st.onTime / st.dep : 1;
      case 'avgDelay': return st.dep ? st.delaySum / st.dep : 0;
      case 'airportDelay': return st.dep ? st.adelaySum / st.dep : 0;
      case 'lost': return st.diverted + st.cancelled;
      case 'checkinWait': return st.paxServed ? st.paxWaitSum / st.paxServed : 0;
      case 'maxWait': return st.maxWait;
      case 'profit': return st.income - st.cost;
      case 'money': return S.money - S.loans;
      case 'closeCalls': return st.closeCalls;
      case 'noise': return st.noise;
      case 'dutyTasks': return st.tasksDuty;
      case 'playerTasks': return st.tasksPlayer;
      case 'spent': return st.built;
      case 'airlines': case 'passengers': case 'neighbours': case 'staff': case 'safety': return S.meters[c.k];
      case 'project':
        return (c.stages || []).length ? c.stages.every((s) => Construction.stageDone(c.id, s)) : Construction.done(c.id);
      case 'flag': return !!S.flags[c.id];
      case 'built': return Airport.count(c.kind) >= (c.n || 1);
    }
    throw new Error('unknown goal ' + c.k);
  },
  check(c, st) {
    const v = this.value(c, st);
    let ok;
    if (typeof v === 'boolean') ok = v;
    else if (c.p !== undefined) ok = v >= c.p - 1e-9;
    else if (c.min !== undefined) ok = v >= c.min - 1e-9;
    else if (c.max !== undefined) ok = v <= c.max + 1e-9;
    else throw new Error('goal without a limit: ' + JSON.stringify(c));
    return { ok, value: typeof v === 'number' ? Math.round(v * 100) / 100 : v, goal: c };
  },
  all(list, st) { return (list || []).map((c) => this.check(c, st)); },
  passed(list, st) { return this.all(list, st).every((r) => r.ok); }
};
