'use strict';

// Lift Logic — the player's progress: stars per mission per difficulty, hint 3 used, the Engineer's medals,
// the Museum cards and concept cards won, the last mission played, and which buildings and missions are
// open; plus each mission's last program (and when it was saved) and the settings (speed, the split of
// the screen). Saved in the browser under liftLogic.progress.v1 / programs.v1 / programTimes.v1 /
// settings.v1. Used by game.js, the screens and core/cloud.js (snapshot, merge, onSave).

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
  let onSave = null;   // core/cloud.js: something changed, send it to the cloud a little later
  function save() { Store.setJson(KEYS.progress, p); if (onSave) onSave(); }
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
  function setLast(id) { p.last = id; p.lastAt = Date.now(); save(); }
  function openAll() { p.open = true; save(); }
  function hasPaper(id) { return !!p.papers[id]; }
  function addPaper(id, data) { p.papers[id] = data; save(); }

  // ---------- programs ----------
  function program(id) { return (Store.json(KEYS.programs, {}))[id] || null; }
  function saveProgram(id, prog) {
    const all = Store.json(KEYS.programs, {});
    all[id] = prog;
    Store.setJson(KEYS.programs, all);
    const times = Store.json(KEYS.programTimes, {});
    times[id] = Date.now();
    Store.setJson(KEYS.programTimes, times);
    if (onSave) onSave();
  }

  // ---------- the cloud copy (core/cloud.js) ----------
  // everything that travels between devices: the progress and the programs; the settings, the difficulty,
  // the sound and the language stay this device's
  function snapshot() {
    return { v: 1, progress: p, programs: Store.json(KEYS.programs, {}), programTimes: Store.json(KEYS.programTimes, {}) };
  }
  // another device's copy merged into this one: what only ever grows is kept from both (the stars per
  // difficulty, the larger of each; the medals, the cards, the papers, hint 3 used, the missions passed
  // by the cheat, everything open), the last mission played is the later one, and each mission's program
  // is the one saved last. Merging the same copy again changes nothing. Returns whether anything changed.
  function merge(remote) {
    if (!remote || typeof remote !== 'object') return false;
    const before = JSON.stringify(snapshot());
    const r = remote.progress || {};
    for (const id in r.stars || {}) {
      const mine = p.stars[id] = p.stars[id] || {};
      for (const d in r.stars[id]) mine[d] = Math.max(mine[d] || 0, r.stars[id][d] || 0);
    }
    for (const id in r.hint3 || {}) Object.assign(p.hint3[id] = p.hint3[id] || {}, r.hint3[id]);
    for (const k of ['medals', 'museum', 'concepts', 'cheatPassed']) {
      for (const id in r[k] || {}) if (r[k][id]) (p[k] = p[k] || {})[id] = true;
    }
    for (const id in r.papers || {}) if (!p.papers[id]) p.papers[id] = r.papers[id];
    if (r.open) p.open = true;
    if (r.last && (!p.last || (r.lastAt || 0) > (p.lastAt || 0))) { p.last = r.last; p.lastAt = r.lastAt || 0; }
    const progs = Store.json(KEYS.programs, {}), times = Store.json(KEYS.programTimes, {});
    const rp = remote.programs || {}, rt = remote.programTimes || {};
    for (const id in rp) {
      if (rp[id] && (!progs[id] || (rt[id] || 0) > (times[id] || 0))) { progs[id] = rp[id]; times[id] = rt[id] || 0; }
    }
    if (JSON.stringify({ v: 1, progress: p, programs: progs, programTimes: times }) === before) return false;
    Store.setJson(KEYS.progress, p);
    Store.setJson(KEYS.programs, progs);
    Store.setJson(KEYS.programTimes, times);
    return true;
  }

  // ---------- settings ----------
  function settings() { return Object.assign({ speed: 1, split: 0.45 }, Store.json(KEYS.settings, {})); }
  function saveSettings(s) { Store.setJson(KEYS.settings, s); }

  return { load, stars, best, passed, buildingOpen, missionOpen, next, total, buildingStars, record, usedHint3, markHint3,
    setLast, openAll, cheatPass, program, saveProgram, settings, saveSettings, hasPaper, addPaper, snapshot, merge,
    set onSave(fn) { onSave = fn; }, get data() { return p; } };
})();
