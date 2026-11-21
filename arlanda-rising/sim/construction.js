'use strict';

// Arlanda Rising — building the master plan's projects in plan time. The player starts each stage when its
// stages before are done (at most S.plan.crews at once), at a normal or a fast pace (faster and dearer),
// buys a project's mods (heated winter tents, a backup radio) and picks how it is paid (cash, a loan, or
// the owner's grant where the mission offers one). Work is slower in December–February. Every day of work
// is paid as it is done; a finished stage or project changes the airport (sim/airport.js `complete`).
// The state of each project is S.airport.projects[id].

const Construction = {
  // a project the mission makes available
  open(id) {
    if (S.airport.projects[id]) return S.airport.projects[id];
    const p = PROJECTS[id], stages = {};
    for (const sid of Object.keys(p.stages)) stages[sid] = { p: 0, on: false, pace: 'normal', done: false, extra: 0 };
    return (S.airport.projects[id] = { stages, mods: {}, finance: 'cash', spent: 0, done: false });
  },
  state(id) { return S.airport.projects[id] || null; },
  stageDone(id, sid) { const p = this.state(id); return !!(p && p.stages[sid] && p.stages[sid].done); },
  done(id) { const p = this.state(id); return !!(p && p.done); },
  active() {
    let n = 0;
    for (const id of Object.keys(S.airport.projects)) for (const s of Object.values(S.airport.projects[id].stages)) if (s.on && !s.done) n++;
    return n;
  },
  // why a stage cannot start now, or null
  cannot(id, sid) {
    const p = this.state(id), def = PROJECTS[id] && PROJECTS[id].stages[sid];
    if (!p || !def) return 'closed';
    const s = p.stages[sid];
    if (s.done || s.on) return 'started';
    for (const a of def.after || []) if (!p.stages[a].done) return 'after';
    if (this.active() >= (S.plan ? S.plan.crews : 1)) return 'crews';
    return null;
  },
  start(id, sid, pace) {
    if (this.cannot(id, sid)) return false;
    const s = this.state(id).stages[sid];
    s.on = true;
    s.pace = PACE[pace] ? pace : 'normal';
    logEvent('stageStarted', { project: id, stage: sid, pace: s.pace });
    return true;
  },
  // switch a stage being built to the other pace
  pace(id, sid, pace) {
    const p = this.state(id);
    if (!p || !PACE[pace] || p.stages[sid].done) return false;
    p.stages[sid].pace = pace;
    return true;
  },
  mod(id, mid) {
    const p = this.state(id), m = PROJECTS[id].mods && PROJECTS[id].mods[mid];
    if (!p || !m || p.mods[mid]) return false;
    p.mods[mid] = true;
    this.pay(p, m.price);
    if (m.safety) { S.airport.safetyBase += m.safety; S.meters.safety = Math.min(100, S.meters.safety + m.safety); }
    return true;
  },
  finance(id, how) {
    const p = this.state(id);
    if (!p || ['cash', 'loan', 'grant', 'partner'].indexOf(how) < 0) return false;
    if (how === 'grant' && !(S.mission && S.mission.grants && S.mission.grants.indexOf(id) >= 0)) return false;
    // a partner builds it with its own money (a concession: the train's ticket income is the partner's)
    if (how === 'partner' && !(S.mission && (S.mission.partners || []).indexOf(id) >= 0)) return false;
    if (p.finance === 'partner' && how !== 'partner') return false;
    p.finance = how;
    return true;
  },
  pay(p, sum) {
    if (p.finance === 'partner') return;
    p.spent += sum;
    if (S.mission && S.mission.st) S.mission.st.built += sum;
    if (p.finance === 'loan') { S.loans += sum; return; }
    Finance.book('construction', -(p.finance === 'grant' ? sum * (1 - GRANT_SHARE) : sum));
  },
  // one day of work on every stage that is on
  day() {
    const winter = Calendar.winter(S.day);
    for (const id of Object.keys(S.airport.projects)) {
      const p = S.airport.projects[id], def = PROJECTS[id];
      const noWinter = Object.keys(p.mods).some((m) => def.mods[m].noWinter);
      for (const sid of Object.keys(p.stages)) {
        const s = p.stages[sid];
        if (!s.on || s.done) continue;
        const sd = def.stages[sid], pace = PACE[s.pace];
        const step = Math.min(1 - s.p, 1 / ((sd.days + s.extra) * pace.time) * (winter && !noWinter ? WINTER_WORK : 1));
        s.p += step;
        // session 6: a design's own price (× p.k, the player's pier)
        this.pay(p, sd.price * pace.cost * step * (p.k || 1));
        if (s.p >= 1 - 1e-9) {
          s.p = 1; s.done = true; s.on = false;
          logEvent('stageBuilt', { project: id, stage: sid });
          if (sd.effect) Airport.complete(sd.effect, id);
        }
      }
      if (!p.done && Object.keys(def.stages).every((sid) => def.stages[sid].optional || p.stages[sid].done)) {
        p.done = true;
        Airport.complete(def.effect, id, p.spent);
      }
    }
  },
  // the owner builds a historical project between missions (or for a mission that needs it): free, at once
  ownerBuilds(id) {
    const p = this.open(id), def = PROJECTS[id];
    if (p.done) return false;
    let price = 0;
    for (const sid of Object.keys(def.stages)) if (!def.stages[sid].optional) { p.stages[sid].p = 1; p.stages[sid].done = true; p.stages[sid].on = false; price += def.stages[sid].price; }
    p.done = true;
    p.owner = true;
    Airport.complete(def.effect, id, price);
    return true;
  },
  // … or one optional stage of it ("apron2.bigStand" in a mission's `requires`)
  ownerStage(id, sid) {
    this.ownerBuilds(id);
    const s = this.state(id).stages[sid], sd = PROJECTS[id].stages[sid];
    if (!s || s.done) return false;
    s.p = 1; s.done = true; s.on = false;
    if (sd.effect) Airport.complete(sd.effect, id);
    return true;
  }
};
