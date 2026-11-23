'use strict';

// Arlanda Rising — what the browser remembers, through one small helper that never throws (a private window or
// blocked storage just forgets), and the autosave of a running mission. Every key starts with
// "arlandaRising." — the origin is shared with every other app of gray0072.github.io, so the game never
// clears anything else. Used by sim/missions.js (the autosave), the screens and core/save.js / core/cloud.js.

const KEYS = {
  campaign: 'arlandaRising.campaign.v1',
  mission: 'arlandaRising.mission.v1',
  snapshots: 'arlandaRising.snapshots.v1',
  progress: 'arlandaRising.progress.v1',
  freeplay: 'arlandaRising.freeplay.v2',
  challenges: 'arlandaRising.challenges.v1',
  settings: 'arlandaRising.settings.v1',
  difficulty: 'arlandaRising.difficulty',
  sound: 'arlandaRising.sound',
  lang: 'arlandaRising.lang',
  cloud: 'arlandaRising.cloud',
  auth: 'arlandaRising.auth'
};

// the keys that travel to the cloud (core/save.js)
const SYNCED = [KEYS.progress, KEYS.campaign, KEYS.mission, KEYS.freeplay, KEYS.challenges, KEYS.snapshots];

const Store = {
  backend() { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } },
  get(key) { try { const b = Store.backend(); return b ? b.getItem(key) : null; } catch (e) { return null; } },
  set(key, v) { try { const b = Store.backend(); if (!b) return false; b.setItem(key, v); return true; } catch (e) { return false; } },
  remove(key) { try { const b = Store.backend(); if (b) b.removeItem(key); } catch (e) { /* blocked */ } },
  json(key, fallback) {
    try { const v = JSON.parse(Store.get(key)); return v === null || v === undefined ? fallback : v; } catch (e) { return fallback; }
  },
  setJson(key, v) {
    const ok = Store.set(key, JSON.stringify(v));
    if (!Store.quiet && Store.onWrite && SYNCED.indexOf(key) >= 0) Store.onWrite(key);
    return ok;
  },
  // what the cloud save writes while merging: it must not schedule another upload (core/save.js)
  quiet: false,
  quietly(fn) { Store.quiet = true; try { fn(); } finally { Store.quiet = false; } },
  onWrite: null,     // core/cloud.js: a key that travels changed
  // forget only this game's keys
  clearOwn() { for (const k of Object.values(KEYS)) Store.remove(k); }
};

// The running mission's autosave: its whole state and the checkpoint of the stage it is in, written every
// AUTOSAVE_SECONDS of play, at every stage's end and at once when the page is hidden (game.js wires
// visibilitychange / pagehide). Reading it back resumes the mission at that very moment, paused.
const Autosave = {
  since: 0,                     // real s since the last write
  write(data) {
    this.since = 0;
    return Store.setJson(KEYS.mission, Object.assign({ savedAt: Date.now() }, data));
  },
  read() { const v = Store.json(KEYS.mission, null); return v && !v.cleared ? v : null; },
  // a mission that ended leaves a mark with its time, so another device's older copy of it is not merged back
  clear() { Store.setJson(KEYS.mission, { cleared: true, savedAt: Date.now() }); this.since = 0; },
  // true when it is time for the next write; called with the real seconds of each frame that played
  due(realDt) { this.since += realDt; return this.since >= AUTOSAVE_SECONDS; }
};
