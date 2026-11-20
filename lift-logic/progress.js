'use strict';

// Lift Logic — the player's progress: stars per mission per difficulty, hint 3 used, the Engineer's medals,
// the Museum cards and concept cards won, the last mission played, and which buildings and missions are
// open; plus each mission's last program and the settings (speed, the split of the screen). Saved in the
// browser under liftLogic.progress.v1 / programs.v1 / settings.v1. Used by game.js and the screens.

const Progress = (() => {
  let p = null;
  function load() {
    p = Store.json(KEYS.progress, {});
    p.stars = p.stars || {};
    p.hint3 = p.hint3 || {};
    p.medals = p.medals || {};
    p.museum = p.museum || {};
    p.concepts = p.concepts || {};
    p.papers = p.papers || {};
    return p;
  }
  function save() { Store.setJson(KEYS.progress, p); }
  load();

  function stars(id, d) { return ((p.stars[id] || {})[d]) || 0; }
  function best(id) { const s = p.stars[id] || {}; return Math.max(0, ...DIFFICULTY_ORDER.map((d) => s[d] || 0)); }
  function passed(id) { return best(id) > 0 || !!(p.cheatPassed || {})[id]; }
  // the cheat Shift+1: the mission counts as passed (it opens the next one), no stars
  function cheatPass(id) { (p.cheatPassed = p.cheatPassed || {})[id] = true; save(); }

  // a building opens with the exam of the one before; a mission with the one before it
  function buildingOpen(b) {
    if (!b.ready) return false;
    if (b.chapter === 1 || p.open) return true;
    const prev = BUILDINGS.find((x) => x.chapter === b.chapter - 1);
    const ms = prev ? buildingMissions(prev.id) : [];
    return ms.length > 0 && passed(ms[ms.length - 1].id);
  }
  function missionOpen(m) {
    if (!buildingOpen(BUILDING[m.building])) return false;
    if (m.n === 1 || p.open) return true;
    return passed(m.chapter + '-' + (m.n - 1));
  }
  // the next mission to play: the first open one not passed yet, else the last one played
  function next() {
    for (const m of MISSIONS) if (missionOpen(m) && !passed(m.id)) return m;
    return MISSION[p.last] || MISSIONS[0];
  }
  function total() { return MISSIONS.reduce((s, m) => s + best(m.id), 0); }
  function buildingStars(id) { return buildingMissions(id).reduce((s, m) => s + best(m.id), 0); }

  // a finished run; returns what is new: { better, firstPass, medal, card }
  function record(m, d, n, opts) {
    const out = { better: false, firstPass: false, medal: false, card: null };
    if (opts.cheated) return out;
    const was = stars(m.id, d);
    if (n > 0 && !passed(m.id)) out.firstPass = true;
    if (n > was) { (p.stars[m.id] = p.stars[m.id] || {})[d] = n; out.better = true; }
    if (opts.hint3) (p.hint3[m.id] = p.hint3[m.id] || {})[d] = true;
    if (opts.medal && !p.medals[m.id]) { p.medals[m.id] = true; out.medal = true; }
    if (n > 0 && m.fact && !p.museum[m.fact]) { p.museum[m.fact] = true; out.card = m.fact; }
    if (n > 0 && m.concept) p.concepts[m.concept] = true;
    save();
    return out;
  }
  function usedHint3(id, d) { return !!((p.hint3[id] || {})[d]); }
  function markHint3(id, d) { (p.hint3[id] = p.hint3[id] || {})[d] = true; save(); }
  function setLast(id) { p.last = id; save(); }
  function openAll() { p.open = true; save(); }
  function hasPaper(id) { return !!p.papers[id]; }
  function addPaper(id, data) { p.papers[id] = data; save(); }

  // ---------- programs ----------
  function program(id) { return (Store.json(KEYS.programs, {}))[id] || null; }
  function saveProgram(id, prog) {
    const all = Store.json(KEYS.programs, {});
    all[id] = prog;
    Store.setJson(KEYS.programs, all);
  }

  // ---------- settings ----------
  function settings() { return Object.assign({ speed: 1, split: 0.45 }, Store.json(KEYS.settings, {})); }
  function saveSettings(s) { Store.setJson(KEYS.settings, s); }

  return { load, stars, best, passed, buildingOpen, missionOpen, next, total, buildingStars, record, usedHint3, markHint3,
    setLast, openAll, cheatPass, program, saveProgram, settings, saveSettings, hasPaper, addPaper, get data() { return p; } };
})();
