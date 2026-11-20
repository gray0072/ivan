'use strict';

// Lift Logic — what the browser remembers, through one small helper that never throws (a private window or
// blocked storage just forgets). Every key starts with "liftLogic." (the origin is shared with the other
// games): progress.v1, programs.v1, records.v1, settings.v1, sound, music, lang, difficulty. Used by
// progress.js, core/audio.js and the screens.

const KEYS = {
  progress: 'liftLogic.progress.v1',
  programs: 'liftLogic.programs.v1',
  records: 'liftLogic.records.v1',
  settings: 'liftLogic.settings.v1',
  sound: 'liftLogic.sound',
  music: 'liftLogic.music',
  difficulty: 'liftLogic.difficulty'
};

const Store = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, v) { try { localStorage.setItem(key, v); return true; } catch (e) { return false; } },
  json(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; } catch (e) { return fallback; }
  },
  setJson(key, v) { return Store.set(key, JSON.stringify(v)); },
  // forget only this game's keys
  clearOwn() { try { for (const k of Object.values(KEYS)) localStorage.removeItem(k); } catch (e) { /* blocked */ } }
};
