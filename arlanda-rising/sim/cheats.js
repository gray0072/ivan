'use strict';

// Arlanda Rising — the debug cheats' effects on the game (the keys, Shift + a key, and their banners are wired
// by game.js in session 2). Each marks the run as cheated: no stars, no medal, no records. Shift+M money,
// Shift+S a snowstorm now, Shift+A every domain one level up, Shift+W win the current stage, Shift+D skip to
// the stage's end; Shift+1…8 (a chapter's first mission with the real Arlanda of that year) is
// Missions.start with the mission's `requires`; Shift+K (a strike) and Shift+F (a system failure) come with
// the people and the systems in session 3.

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
    for (const d of Object.keys(S.domains)) S.domains[d] = Math.min(DOMAINS[d].levels.length - 1, S.domains[d] + 1);
    return true;
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
