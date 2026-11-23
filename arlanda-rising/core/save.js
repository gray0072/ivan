'use strict';

// Arlanda Rising — what travels to the cloud and how another device's copy is merged in (SPEC.md "Cloud save",
// docs/cloud-save.md). `snapshot()` is this device's save: the progress, the campaign, the running mission, Free Play
// and the Challenge Days (the settings, the difficulty, the sound and the language stay this device's); the mission
// snapshots for replays travel apart (`snaps()`), only at idle moments, as they are big. `merge(remote)` folds a
// copy into the save here and never replaces it: what only grows is kept from both (the stars per mission and
// difficulty, the larger; the medals, hint 3, what is open), what is a current state comes from the copy saved last
// (a new campaign — a new campaignId — always wins over an older one, so a campaign started again is never merged
// back; the running mission, ended missions included as a `cleared` mark; Free Play), and whatever this version
// does not know (a newer version's field or part of the copy) is kept as it came and sent back. Merging the same
// copy again changes nothing. Used by core/cloud.js.

const Save = {
  unknown: {},       // parts of the cloud's copy this version does not know: sent back as they came
  KNOWN: ['v', 'progress', 'campaign', 'mission', 'freeplay', 'challenges'],

  snapshot() {
    return Object.assign({}, this.unknown, {
      v: 1,
      progress: Store.json(KEYS.progress, null),
      campaign: Store.json(KEYS.campaign, null),
      mission: Store.json(KEYS.mission, null),
      freeplay: Store.json(KEYS.freeplay, null),
      challenges: Store.json(KEYS.challenges, null)
    });
  },
  snaps() { return Store.json(KEYS.snapshots, null); },

  // the copy saved last of a current state (by savedAt; a later start of the same kind of thing wins first)
  later(a, b, startKey) {
    if (!a) return b;
    if (!b) return a;
    if (startKey && (a[startKey] || 0) !== (b[startKey] || 0)) return (b[startKey] || 0) > (a[startKey] || 0) ? b : a;
    return (b.savedAt || 0) > (a.savedAt || 0) ? b : a;
  },

  // another device's copy merged into this one; returns whether anything here changed
  merge(remote, remoteSnaps) {
    if (!remote || typeof remote !== 'object') return false;
    const before = JSON.stringify(this.snapshot()) + JSON.stringify(this.snaps());
    this.unknown = {};
    for (const k of Object.keys(remote)) if (this.KNOWN.indexOf(k) < 0) this.unknown[k] = remote[k];
    // the progress: what only grows
    const p = Store.json(KEYS.progress, null) || {}, r = remote.progress || {};
    for (const k of Object.keys(r)) if (p[k] === undefined) p[k] = r[k];
    p.stars = p.stars || {}; p.medals = p.medals || {}; p.hint3 = p.hint3 || {};
    for (const id of Object.keys(r.stars || {})) {
      const mine = p.stars[id] = p.stars[id] || {};
      for (const d of Object.keys(r.stars[id])) mine[d] = Math.max(mine[d] || 0, r.stars[id][d] || 0);
    }
    for (const k of ['medals', 'hint3']) for (const id of Object.keys(r[k] || {})) if (r[k][id]) p[k][id] = r[k][id];
    // the campaign: a newer campaign wins, then the copy saved last
    const lc = Store.json(KEYS.campaign, null), rc = remote.campaign || null;
    const camp = this.later(lc, rc, 'startedAt');
    const switched = !!(camp && lc && camp !== lc && camp.campaignId !== lc.campaignId);
    // the running mission (or the mark of one that ended), saved last; one of a campaign that lost is dropped
    const lm = Store.json(KEYS.mission, null), rm = remote.mission || null;
    const fits = (x) => !!x && !(camp && x.run && x.run.cid && x.run.cid !== camp.campaignId);
    let mis = this.later(lm, rm);
    if (!fits(mis)) mis = [lm, rm].filter(fits).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0] || null;
    if (mis && mis === rm && rm !== lm && !mis.cleared) mis = Object.assign({}, mis, { from: 'cloud' });
    // Free Play: a newer one wins, then the copy saved last; an old round-based one (not v2) is dropped
    const v2 = (x) => (x && x.v === 2 && x.state ? x : null);
    const fp = this.later(v2(Store.json(KEYS.freeplay, null)), v2(remote.freeplay), 'startedAt');
    // the Challenge Days' bests: the larger of each
    const lch = Store.json(KEYS.challenges, null), rch = remote.challenges || null;
    const ch = lch && rch ? ChallengeSave.merge(lch, rch) : lch || rch;
    // the replays' snapshots: those of the campaign that won; otherwise both, this device's first
    let snaps = this.snaps();
    if (remoteSnaps && typeof remoteSnaps === 'object') {
      if (switched) snaps = remoteSnaps;
      else { snaps = snaps || {}; for (const id of Object.keys(remoteSnaps)) if (!Object.prototype.hasOwnProperty.call(snaps, id)) snaps[id] = remoteSnaps[id]; }
    } else if (switched) snaps = null;
    const after = JSON.stringify(Object.assign({}, this.unknown, { v: 1, progress: p, campaign: camp, mission: mis, freeplay: fp, challenges: ch })) + JSON.stringify(snaps);
    if (after === before) return false;
    // written quietly: a merge never schedules another upload by itself
    Store.quietly(() => {
      Store.setJson(KEYS.progress, p);
      if (camp) Store.setJson(KEYS.campaign, camp); else Store.remove(KEYS.campaign);
      if (mis) Store.setJson(KEYS.mission, mis); else Store.remove(KEYS.mission);
      if (fp) Store.setJson(KEYS.freeplay, fp);
      if (ch) Store.setJson(KEYS.challenges, ch);
      if (snaps) Store.setJson(KEYS.snapshots, snaps); else Store.remove(KEYS.snapshots);
    });
    return true;
  }
};
