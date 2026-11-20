'use strict';

// Arlanda Rising — what the browser remembers, through one small helper that never throws (a private window or
// blocked storage just forgets), and the autosave of a running mission. Every key starts with
// "arlandaRising." — the origin is shared with every other app of gray0072.github.io, so the game never
// clears anything else. Used by sim/missions.js (the autosave), the screens and, later, core/cloud.js.

const KEYS = {
  campaign: 'arlandaRising.campaign.v1',
  mission: 'arlandaRising.mission.v1',
  snapshots: 'arlandaRising.snapshots.v1',
  progress: 'arlandaRising.progress.v1',
  freeplay: 'arlandaRising.freeplay.v1',
  challenges: 'arlandaRising.challenges.v1',
  settings: 'arlandaRising.settings.v1',
  difficulty: 'arlandaRising.difficulty',
  sound: 'arlandaRising.sound',
  lang: 'arlandaRising.lang',
  cloud: 'arlandaRising.cloud',
  auth: 'arlandaRising.auth'
};

const Store = {
  backend() { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } },
  get(key) { try { const b = Store.backend(); return b ? b.getItem(key) : null; } catch (e) { return null; } },
  set(key, v) { try { const b = Store.backend(); if (!b) return false; b.setItem(key, v); return true; } catch (e) { return false; } },
  remove(key) { try { const b = Store.backend(); if (b) b.removeItem(key); } catch (e) { /* blocked */ } },
  json(key, fallback) {
    try { const v = JSON.parse(Store.get(key)); return v === null || v === undefined ? fallback : v; } catch (e) { return fallback; }
  },
  setJson(key, v) { return Store.set(key, JSON.stringify(v)); },
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
  read() { return Store.json(KEYS.mission, null); },
  clear() { Store.remove(KEYS.mission); this.since = 0; },
  // true when it is time for the next write; called with the real seconds of each frame that played
  due(realDt) { this.since += realDt; return this.since >= AUTOSAVE_SECONDS; }
};
