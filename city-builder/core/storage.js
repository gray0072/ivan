'use strict';

// City Builder — what the browser remembers: the saved city, the records and the difficulty last
// picked. Every key starts with "cityBuilder." (the origin is shared with the other games).
// Used by game.js (save, continue), sim/city.js (records on a milestone) and ui/screens.js.

const SAVE_KEY = 'cityBuilder.save.v1';
const RECORDS_KEY = 'cityBuilder.records.v1';
const DIFFICULTY_KEY = 'cityBuilder.difficulty';

const Storage = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, v) { try { localStorage.setItem(key, v); return true; } catch (e) { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch (e) { /* storage blocked */ } },

  // ---------- the city ----------
  saveCity(c) {
    if (!c) return;
    const data = Object.assign({}, c, {
      terrain: Array.from(c.terrain).join(''),
      road: Array.from(c.road).join(''),
      flood: c.flood ? Object.assign({}, c.flood, { dist: Array.from(c.flood.dist).join(',') }) : null
    });
    this.set(SAVE_KEY, JSON.stringify(data));
  },
  loadCity() {
    const raw = this.get(SAVE_KEY);
    if (!raw) return null;
    try {
      const d = JSON.parse(raw);
      const n = MAP_SIZE * MAP_SIZE;
      if (!d.terrain || d.terrain.length !== n) return null;
      d.terrain = Uint8Array.from(d.terrain, (ch) => +ch);
      d.road = Uint8Array.from(d.road, (ch) => +ch);
      if (d.flood) d.flood.dist = Int8Array.from(d.flood.dist.split(','), (v) => +v);
      return d;
    } catch (e) {
      return null;
    }
  },
  hasCity() { return !!this.get(SAVE_KEY); },
  clearCity() { this.remove(SAVE_KEY); },

  // ---------- difficulty ----------
  difficulty() {
    const d = this.get(DIFFICULTY_KEY);
    return DIFFICULTY[d] ? d : 'medium';
  },
  setDifficulty(d) { this.set(DIFFICULTY_KEY, d); },

  // ---------- records: per difficulty, the fewest months to each milestone and the biggest population ----------
  records() {
    try { return JSON.parse(this.get(RECORDS_KEY)) || {}; } catch (e) { return {}; }
  },
  // returns { best, isNew } for the milestone just reached
  recordMilestone(difficulty, id, months) {
    const all = this.records();
    const r = all[difficulty] = all[difficulty] || {};
    const best = r[id];
    const isNew = best === undefined || months < best;
    if (isNew) { r[id] = months; this.set(RECORDS_KEY, JSON.stringify(all)); }
    return { best: isNew ? months : best, isNew };
  },
  recordPopulation(difficulty, pop) {
    const all = this.records();
    const r = all[difficulty] = all[difficulty] || {};
    if (!(r.maxPop >= pop)) { r.maxPop = pop; this.set(RECORDS_KEY, JSON.stringify(all)); }
  },
  clearRecords() { this.remove(RECORDS_KEY); }
};
