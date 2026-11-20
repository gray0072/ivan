'use strict';

// Arlanda Rising — what the player has achieved and the campaign they are in, kept in the browser:
//   Progress (arlandaRising.progress.v1): the stars of every mission per difficulty (the best kept), the Real
//     Arlanda medals, the hint-3 marks — what only grows;
//   Campaign (arlandaRising.campaign.v1): the airport after the last mission played in the campaign (the world
//     without a mission), its difficulty, the next mission and the missions passed in it;
//   the snapshots (arlandaRising.snapshots.v1): the world each mission started from, so a mission can be
//     replayed for stars without touching the campaign;
//   FreeSave (arlandaRising.freeplay.v1): the Free Play airport.
// A cheated run saves nothing here. Used by game.js and the screens.

const Progress = {
  data: null,
  load() { this.data = Object.assign({ stars: {}, medals: {}, hint3: {} }, Store.json(KEYS.progress, {})); },
  save() { this.data.savedAt = Date.now(); Store.setJson(KEYS.progress, this.data); },
  stars(id, d) { return ((this.data.stars[id] || {})[d]) || 0; },
  best(id) { const s = this.data.stars[id] || {}; return Math.max(0, ...Object.values(s)); },
  record(id, d, stars, medal) {
    const s = this.data.stars[id] = this.data.stars[id] || {};
    const was = s[d] || 0;
    if (stars > was) s[d] = stars;
    if (medal) this.data.medals[id] = true;
    this.save();
    return stars > was;
  },
  // a mission is open when it is the first one or the one before it was passed on any difficulty
  open(id) {
    const i = MISSIONS.findIndex((m) => m.id === id);
    return i === 0 || (i > 0 && this.best(MISSIONS[i - 1].id) > 0);
  },
  totalStars() { let n = 0; for (const id of Object.keys(this.data.stars)) n += this.best(id); return n; }
};

const Campaign = {
  data: null,
  load() { this.data = Store.json(KEYS.campaign, null); },
  save() { if (this.data) { this.data.savedAt = Date.now(); Store.setJson(KEYS.campaign, this.data); } },
  exists() { return !!this.data; },
  // a new campaign: the forest of 1958, the first mission next; stars and medals stay
  start(difficulty) {
    this.data = { campaignId: Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36), startedAt: Date.now(), difficulty, world: null, next: MISSIONS[0].id, done: {} };
    Store.remove(KEYS.snapshots);
    this.save();
  },
  // the world a mission starts from: the campaign's (its next mission) or the snapshot kept at its first start
  worldFor(id) {
    if (this.data && this.data.next === id) return { world: this.data.world, campaign: true };
    const snaps = Store.json(KEYS.snapshots, {});
    if (Object.prototype.hasOwnProperty.call(snaps, id)) return { world: snaps[id], campaign: false };
    return null;
  },
  keepSnapshot(id, world) {
    const snaps = Store.json(KEYS.snapshots, {});
    snaps[id] = world;
    Store.setJson(KEYS.snapshots, snaps);
  },
  // the campaign's mission was passed: its airport carries over, the next mission comes up
  passed(id, stars, world) {
    if (!this.data || this.data.next !== id) return;
    this.data.done[id] = Math.max(this.data.done[id] || 0, stars);
    this.data.world = world;
    const i = MISSIONS.findIndex((m) => m.id === id);
    this.data.next = MISSIONS[i + 1] ? MISSIONS[i + 1].id : null;
    this.save();
  },
  nextMission() { return this.data && this.data.next ? MISSION[this.data.next] : null; }
};

// Free Play (arlandaRising.freeplay.v1): { era, difficulty, round, world, startedAt, savedAt } — the endless airport
// carried over from round to round (sim/freeplay.js). A round being played is in the mission autosave like any other.
const FreeSave = {
  data: null,
  load() { this.data = Store.json(KEYS.freeplay, null); },
  save() { if (this.data) { this.data.savedAt = Date.now(); Store.setJson(KEYS.freeplay, this.data); } },
  exists() { return !!(this.data && this.data.world); }
};
