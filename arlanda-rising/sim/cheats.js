'use strict';

// Arlanda Rising — the debug cheats' effects on the game (the keys, Shift + a key, and their banners are wired
// by game.js in session 2). Each marks the run as cheated: no stars, no medal, no records. Shift+M money,
// Shift+S a snowstorm now, Shift+A every domain one level up, Shift+W win the current stage, Shift+D skip to
// the stage's end; Shift+1…8 (a chapter's first mission with the real Arlanda of that year) is
// Missions.start with the mission's `requires`; Shift+K a strike of the first team, Shift+F a failure of the
// first system. Session 5: Shift+E the next random event (data/events.js) now.

const Cheats = {
  mark() { S.cheated = true; },
  money() { this.mark(); Finance.book('cheat', 100e6); return true; },
  snowstorm() {
    if (!S.ops) return false;
    this.mark();
    S.ops.weather.temp = Math.min(S.ops.weather.temp, -4);
    S.ops.weather.snow.push([S.clock, S.clock + 120, 6]);
    return true;
  },
  domainsUp() {
    this.mark();
    for (const d of Object.keys(S.domains)) {
      const lv = S.domains[d];
      if (lv >= DOMAINS[d].levels.length - 1) continue;
      if (lv === 0) { S.domains[d] = 1; People.dept(d); } else { Systems.rec(d).kept = true; Systems.installed(d); }
    }
    People.updateMeter();
    return true;
  },
  // a strike: the first team there is walks out (now in ops time, for STRIKE_DAYS from today in plan time)
  strike() {
    const d = S.people && Object.keys(S.people.depts).find((x) => People.jobs(x) > 0);
    if (!d) return false;
    this.mark();
    if (S.ops) { S.ops.strike = d; S.mission.st.struck = 1; } else S.people.strike = { dept: d, from: S.day, to: S.day + STRIKE_DAYS, settle: WAGE_DEMAND };
    return d;
  },
  // a system failure: the first system there is goes down
  failure() {
    if (!S.ops) return false;
    const d = Object.keys(S.domains).find((x) => S.domains[x] >= 2 && !Systems.down(x));
    if (!d) return false;
    this.mark();
    Systems.fail(d);
    return d;
  },
  // session 5: the next random event of data/events.js, now (in ops time)
  event() {
    if (!S.ops) return false;
    this.mark();
    const e = RANDOM_EVENTS[(S.ops.cheatEvents = (S.ops.cheatEvents || 0) + 1) % RANDOM_EVENTS.length];
    Events.run(e.do, e.min ? e.min[1] : 0);
    logEvent('randomEvent', { id: e.id, text: e.text });
    return e.id;
  },
  winStage() {
    if (!S.mission || S.mission.status !== 'running') return false;
    this.mark();
    S.mission.forceWin = true;
    S.mission.forceEnd = true;
    Missions.endStage();
    return true;
  },
  // run the stage to its end, quietly; decisions take their default
  endStage() {
    if (!S.mission || S.mission.status !== 'running') return false;
    this.mark();
    GameEvents.mute(true);
    const r = Strategy.runner({});
    for (let n = 0; n < 100000 && S.mission.status === 'running'; n++) { Strategy.act(r); Sim.step(); }
    GameEvents.mute(false);
    return true;
  }
};
