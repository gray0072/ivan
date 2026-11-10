'use strict';

// Wiggle Wars — what the browser remembers: the versus setup, the campaign's stars per mission and
// difficulty, the difficulty last picked. Every key starts with "wiggleWars." (the origin is shared
// with the other games). Used by game.js and ui/.

const SETTINGS_KEY = 'wiggleWars.settings.v1';
const CAMPAIGN_KEY = 'wiggleWars.campaign.v1';
const DIFFICULTY_KEY = 'wiggleWars.difficulty';

const Storage = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, v) { try { localStorage.setItem(key, v); return true; } catch (e) { return false; } },
  json(key) { try { return JSON.parse(this.get(key)) || null; } catch (e) { return null; } },

  // the versus setup, filled up with the defaults for anything missing
  settings() {
    const s = defaultSettings(), saved = this.json(SETTINGS_KEY);
    if (!saved) return s;
    for (const k of Object.keys(s)) if (saved[k] !== undefined && k !== 'teams' && k !== 'weapons') s[k] = saved[k];
    if (Array.isArray(saved.teams)) saved.teams.slice(0, 2).forEach((t, i) => Object.assign(s.teams[i], t));
    if (saved.weapons) Object.assign(s.weapons, saved.weapons);
    s.seed = null;
    return s;
  },
  saveSettings(s) { this.set(SETTINGS_KEY, JSON.stringify(Object.assign({}, s, { seed: null }))); },

  difficulty() { const d = this.get(DIFFICULTY_KEY); return DIFFICULTY[d] ? d : 'easy'; },
  setDifficulty(d) { this.set(DIFFICULTY_KEY, d); },

  // { easy: { 0: 3, … }, medium: {…}, hard: {…}, open: true when every mission is opened by a cheat }
  campaign() {
    const c = this.json(CAMPAIGN_KEY) || {};
    for (const d of DIFFICULTY_ORDER) c[d] = c[d] || {};
    return c;
  },
  stars(i, d) { return this.campaign()[d][i] || 0; },
  // the best stars of mission i on difficulty d; true when better than before
  saveStars(i, d, stars) {
    const c = this.campaign();
    const was = c[d][i] || 0;
    if (stars <= was) return false;
    c[d][i] = stars;
    this.set(CAMPAIGN_KEY, JSON.stringify(c));
    return true;
  },
  openAll() { const c = this.campaign(); c.open = true; this.set(CAMPAIGN_KEY, JSON.stringify(c)); },
  // a mission opens when the one before was won on any difficulty
  unlocked(i) {
    if (i === 0) return true;
    const c = this.campaign();
    return !!c.open || DIFFICULTY_ORDER.some((d) => (c[d][i - 1] || 0) > 0);
  },
  totalStars(d) { const c = this.campaign()[d]; return Object.values(c).reduce((s, v) => s + v, 0); }
};
