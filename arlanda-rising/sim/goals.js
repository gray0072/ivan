'use strict';

// Arlanda Rising — the counters of a stage and the goals read from them. A goal is { k, min | max | p, ... }:
//   onTime (p: share of departures on time), avgDelay (max minutes), airportDelay (max minutes the airport
//   caused, on average), lost (max diverted + cancelled),
//   checkinWait (max average minutes), maxWait, profit (min SEK in the stage), money (min SEK of its own now: less the loans),
//   closeCalls (max), noise (max units), dutyTasks (max tasks the duty manager did), playerTasks (min),
//   airlines / passengers / neighbours / staff / safety (min meter), project (id, stages: finished),
//   flag (id: a decision taken), built (kind, n: at least n of it), spent (max SEK on construction);
//   session 3: level (dom, min: the domain at least at that level), manager (dept: one hired), noStrike (no strike
//   called or running), lostBags (max), unannounced (max late flights not told), fireCat (min), systems (max
//   domains run by a system), handsOff (min tasks done by teams and systems), handTasks (max tasks the player did),
//   lastMonth (min result of the last month closed, without one-off sums);
//   session 4: securityWait (max average minutes at security), brands (min units with a brand), brandsIn (min SEK the
//   brands earned the airport in the stage), mood (code, min: an airline's mood), perDay (code, min: its flights a day),
//   carriers (min airlines flying), train (the line built, by any deal), score (min points of a Challenge Day);
//   session 5: borderWait (max average minutes at passport control), estate (min SEK of rent a month from real estate),
//   green (min green rating), permitOk (the environmental permit not broken in the stage, nor now), runways (min runways);
//   session 6: loss (max SEK the stage lost: costs above income), cargo (min SEK from freight in the stage), mothballed (min
//   terminals closed), laidOff (max share of the jobs gone), readiness (min fallback readiness of the systems, %),
//   chargers (min charging stands), joined (Terminals 4 and 5 joined airside).
// A mission's ★ is every stage passed and its own `goal`; ★★ and ★★★ one each of its two `stars`.
// Used by sim/missions.js, the stage card and the results.

const Goals = {
  newStats() {
    return { arr: 0, dep: 0, onTime: 0, delaySum: 0, adelaySum: 0, diverted: 0, cancelled: 0, paxServed: 0, paxWaitSum: 0,
      maxWait: 0, missed: 0, tasksPlayer: 0, tasksDuty: 0, tasksAuto: 0, tasksPeople: 0, overflow: 0, closeCalls: 0,
      noise: 0, nightMoves: 0, income: 0, cost: 0, built: 0, ploughRuns: 0, closedMin: 0, minutes: 0, days: 0, decisions: 0,
      tasksSys: 0, short: 0, struck: 0, failures: 0, lostBags: 0, unannounced: 0, emergencies: 0, secServed: 0, secWaitSum: 0, brandsIn: 0,
      borderServed: 0, borderWaitSum: 0, permitFines: 0, cargoIn: 0, banned: 0 };
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
      // session 3
      case 'level': return (S.domains[c.dom] || 0) >= c.min;
      case 'manager': return !!(S.people && S.people.managers[c.dept]);
      case 'noStrike': return !(S.people && S.people.strike) && !st.struck;
      case 'lostBags': return st.lostBags;
      case 'unannounced': return st.unannounced;
      case 'fireCat': return Airport.fireCat() >= c.min;
      case 'systems': { let n = 0; for (const d of Object.keys(S.domains)) if (S.domains[d] >= 2) n++; return n; }
      case 'handsOff': return st.tasksPeople + st.tasksSys;
      case 'handTasks': return st.tasksPlayer;
      // session 4
      case 'securityWait': return st.secServed ? st.secWaitSum / st.secServed : 0;
      case 'brands': return Terminal.brands();
      case 'brandsIn': return st.brandsIn || 0;
      case 'mood': return S.airlines[c.code] ? S.airlines[c.code].mood : 0;
      case 'perDay': return Airlines.perDay(c.code);
      case 'carriers': return Object.keys(S.airlines).filter((x) => Airlines.perDay(x) > 0).length;
      case 'train': return !!S.airport.train;
      case 'score': return Challenges.score(st);
      // session 5
      case 'borderWait': return st.borderServed ? st.borderWaitSum / st.borderServed : 0;
      case 'estate': return Airport.rent();
      case 'green': return Green.rating();
      case 'permitOk': return !st.permitFines && !(Green.permit() || {}).broken;
      case 'runways': return S.airport.runways.length;
      case 'owner': return S.owner === c.id;
      // session 6
      case 'loss': return Math.max(0, st.cost - st.income);
      case 'cargo': return st.cargoIn || 0;
      case 'mothballed': return Terminal.mothballCount();
      case 'laidOff': return People.cutShare();
      case 'readiness': return Systems.readinessAll() * 100;
      case 'chargers': return Airport.chargers();
      case 'joined': return !!S.airport.joined;
      // the result of the last month closed: what the airport earns now, investments' payback included
      // (the one-off sums left out: loans taken or repaid, the owner's money, building and buying)
      case 'lastMonth': {
        const h = S.finance.history[S.finance.history.length - 1];
        if (!h) return 0;
        const oneOff = ['loans', 'owner', 'owner loan', 'construction', 'build', 'deals', 'hiring', 'training', 'drills', 'stranded', 'layoffs'];
        let r = 0;
        for (const k of Object.keys(h.in)) if (oneOff.indexOf(k) < 0) r += h.in[k];
        for (const k of Object.keys(h.out)) if (oneOff.indexOf(k) < 0) r -= h.out[k];
        return r;
      }
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
