'use strict';

// Arlanda Rising — the cloud copy of the save (optional, SPEC.md "Cloud save", docs/cloud-save.md): a Google sign-in
// through Supabase Auth and the arlandarising_saves table (supabase/schema.sql: a row per Google account). Started
// from lift-logic/core/cloud.js. Used by game.js (Cloud.init, onChange, the idle moments) and ui/screens.js (the start
// screen's account row: the sign-in, the status, signing out, the choice when the cloud cannot be reached).
//
// Signed in, the campaign, the progress, the running mission and Free Play are merged with the account's copy and
// sent back (core/save.js), so a child plays on the phone and goes on at the computer with the same airport. Every
// sync reads the account's copy first; a merge happens only at an idle moment (the start screen, the timeline, the
// Office, the Challenge Days) — never under a running stage or a running Free Play. While a stage runs, an upload is deferred: the copy's
// updated_at is read again, and the save goes up only if nobody changed it since this device last read or wrote it;
// otherwise it waits for the next idle moment to merge first. The mission snapshots for replays go in their own
// column, only at idle moments. A sync runs on the sign-in, at start, on every return to the foreground or the
// network, 10 s after the last change and when the page goes to the background (keepalive). Without signing in
// nothing changes and no network call is made; without lib/supabase.min.js or from file:// the game shows no cloud.

// The project's URL and its publishable key are not secrets (the table's row-level security guards the rows); the
// project is the one world-aviation, lift-logic and the swedish app use.
const CLOUD_URL = 'https://achcmqqooszwfwyfndbd.supabase.co';
const CLOUD_KEY = 'sb_publishable_X7gyM9_VkV1Zhw6af8zN2w_flfVmLUN';
const CLOUD_TABLE = 'arlandarising_saves';
const CLOUD_PUSH_MS = 10000;        // changes are sent this long after the last one
const CLOUD_REQUEST_MS = 10000;     // a request that has not answered by then is given up
const CLOUD_SYNC_MS = 25000;        // ... and a whole sync (the session, the read, the write)
const CLOUD_RETRY_MS = 30000;       // a failed sync is tried again this often while the page is in view
const CLOUD_TICK_MS = 5000;         // how often that is looked at
const CLOUD_KEEPALIVE_MAX = 60000;  // characters of a body that can still leave with the page (keepalive)

// every request of the library: given up after CLOUD_REQUEST_MS, and kept alive past the page going to the
// background when its body is small enough
function cloudFetch(url, opts) {
  const o = Object.assign({}, opts);
  let timer = null;
  if (typeof AbortController !== 'undefined') {
    const ctl = new AbortController(), outer = o.signal;
    if (outer) { if (outer.aborted) ctl.abort(); else outer.addEventListener('abort', () => ctl.abort()); }
    o.signal = ctl.signal;
    timer = setTimeout(() => ctl.abort(), CLOUD_REQUEST_MS);
  }
  if (document.hidden && (!o.body || (typeof o.body === 'string' && o.body.length < CLOUD_KEEPALIVE_MAX))) o.keepalive = true;
  return fetch(url, o).finally(() => clearTimeout(timer));
}
// a promise that gives up after `ms` (whatever hangs outside a request, e.g. the library's own lock)
function cloudLimit(p, ms) {
  let timer = null;
  return Promise.race([p, new Promise((_, no) => { timer = setTimeout(() => no(new Error('timeout')), ms); })])
    .finally(() => clearTimeout(timer));
}

const Cloud = {
  available: false,
  client: null,
  seen: false,         // the client has told whether it holds a session
  userId: null,        // the signed-in account (also while its session cannot be refreshed offline), or null
  email: '',
  sync: 'idle',        // how the last sync went: 'syncing' | 'synced' | 'error' | 'idle'
  loaded: false,       // the account's copy has been read and merged in this session
  playOn: false,       // the player chose to play with this device's save after a failed load (this session)
  notice: '',          // a sign-in that could not go or did not finish: 'offline' | 'signInFailed'
  back: false,         // this page is Google's answer to a sign-in
  busy: false,
  again: false,
  waiting: false,      // an upload waits for an idle moment to merge first
  stamp: null,         // updated_at of the copy this device last read or wrote
  timer: null,
  lastTry: 0,
  idle: () => true,    // game.js: whether a merge may run now (no stage running)
  onChange: null,      // something to show changed (and whether the save did): game.js redraws

  init() {
    if (typeof supabase === 'undefined' || !/^https?:$/.test(location.protocol)) return;
    this.available = true;
    const acct = Store.json(KEYS.cloud, null);
    if (acct) this.email = acct.email || '';
    if (acct && acct.user && Store.get(KEYS.auth)) this.userId = acct.user;
    this.back = new URLSearchParams(location.search).has('code') && !!Store.get(KEYS.auth + '-code-verifier');
    if (acct || this.back || Store.get(KEYS.auth)) this.start();
    Store.onWrite = () => this.schedule();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (this.timer) this.syncNow(); }
      else this.syncNow();
    });
    window.addEventListener('online', () => { if (this.notice === 'offline') { this.notice = ''; this.changed(); } this.syncNow(); });
    setInterval(() => {
      if (this.sync === 'error' && !document.hidden && Date.now() - this.lastTry >= CLOUD_RETRY_MS) this.syncNow();
    }, CLOUD_TICK_MS);
    if (this.userId) this.syncNow();
  },
  start() {
    if (this.client) return this.client;
    // the session under the game's own key, never the library's default (shared by the whole origin)
    this.client = supabase.createClient(CLOUD_URL, CLOUD_KEY, {
      auth: { flowType: 'pkce', storageKey: KEYS.auth, detectSessionInUrl: true },
      global: { fetch: cloudFetch }
    });
    this.client.auth.onAuthStateChange((event, session) => setTimeout(() => this.authChanged(session, event), 0));
    return this.client;
  },
  authChanged(session, event) {
    const first = !this.seen;
    this.seen = true;
    const uid = session && session.user ? session.user.id : null;
    if (uid && uid !== this.userId) {
      this.userId = uid;
      this.email = session.user.email || '';
      this.loaded = false;
      this.stamp = null;
      this.notice = '';
      Store.setJson(KEYS.cloud, { user: uid, email: this.email });
      this.syncNow();
    } else if (uid) {
      if (session.user.email) this.email = session.user.email;
      if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && !this.loaded && !this.busy) this.syncNow();
    } else if (this.userId && !Store.get(KEYS.auth)) {
      this.userId = null;
      this.sync = 'idle';
      this.loaded = false;
    }
    if (first && this.back && !uid && !this.userId) this.notice = 'signInFailed';
    this.changed();
  },
  ready() { return !!(this.client && this.userId); },
  get status() {
    if (!this.available) return 'unavailable';
    if (!this.userId) {
      if (this.client && !this.seen) return 'syncing';
      return Store.json(KEYS.cloud, null) ? 'signedOut' : 'off';
    }
    if (this.sync === 'error' && !this.loaded) return this.playOn ? 'local' : 'loadFailed';
    return this.sync === 'idle' ? 'syncing' : this.sync;
  },
  changed(saveChanged) { if (this.onChange) this.onChange(!!saveChanged); },

  // ---------- signing in and out ----------
  signIn() {
    if (!this.available) return;
    if (navigator.onLine === false) { this.notice = 'offline'; this.changed(); return; }
    this.notice = '';
    this.start().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } })
      .then((r) => { if (r && r.error) { this.notice = 'signInFailed'; this.changed(); } }, () => { this.notice = 'signInFailed'; this.changed(); });
  },
  // the save stays on this device; the last changes are merged with the account's copy and sent first
  signOut() {
    if (!this.client) return;
    const c = this.client, uid = this.userId;
    const last = uid ? cloudLimit(this.round(uid, true), CLOUD_SYNC_MS) : Promise.resolve();
    clearTimeout(this.timer); this.timer = null;
    last.catch(() => {}).then(() => c.auth.signOut({ scope: 'local' })).catch(() => {}).then(() => {
      if (!this.userId) Store.remove(KEYS.auth);
    });
    Store.remove(KEYS.cloud);
    this.userId = null;
    this.email = '';
    this.sync = 'idle';
    this.loaded = false;
    this.playOn = false;
    this.stamp = null;
    this.changed();
  },
  retry() { this.playOn = false; this.syncNow(); },
  playLocal() { this.playOn = true; this.changed(); },

  // ---------- syncing ----------
  schedule() {
    if (!this.ready()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.syncNow(), CLOUD_PUSH_MS);
  },
  // an idle moment came (a stage ended, a screen opened): an upload that waited for it goes now
  idleNow() { if (this.waiting) this.syncNow(); },
  syncNow() {
    if (!this.ready()) return;
    clearTimeout(this.timer); this.timer = null;
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    this.lastTry = Date.now();
    this.sync = 'syncing';
    this.changed();
    const uid = this.userId, out = { changed: false };
    cloudLimit(this.round(uid, false, out), CLOUD_SYNC_MS).then(() => {
      if (uid === this.userId) this.sync = 'synced';
    }, () => {
      if (uid === this.userId) this.sync = 'error';
    }).then(() => {
      this.busy = false;
      this.changed(out.changed);
      if (this.again) { this.again = false; this.syncNow(); }
    });
  },
  // one sync: the session, the copy read; at an idle moment merged in and the result written back; under a running
  // stage written only if nobody changed the copy since this device last saw it (else it waits). `leaving`: the last
  // one before signing out
  round(uid, leaving, out) {
    const c = this.client;
    out = out || {};
    const idle = leaving || this.idle();
    return c.auth.getSession().then((r) => {
      const s = r && r.data && r.data.session;
      if (!s || !s.user || s.user.id !== uid) throw new Error('no session');
      return c.from(CLOUD_TABLE).select(idle ? 'data, snaps, updated_at' : 'updated_at').eq('user_id', uid).maybeSingle().retry(false);
    }).then((r) => {
      if (r.error) throw r.error;
      if (!leaving && uid !== this.userId) throw new Error('signed out meanwhile');
      const row = r.data;
      if (!idle) {
        // a running stage: up only if the copy is still the one this device last read or wrote
        if (row && this.stamp !== row.updated_at) { this.waiting = true; return null; }
      } else {
        if (row && row.data && Save.merge(row.data, row.snaps)) out.changed = true;
        if (!leaving) this.loaded = true;
      }
      this.waiting = false;
      const now = new Date().toISOString();
      const up = { user_id: uid, data: Save.snapshot(), updated_at: now };
      // the replays' snapshots only at idle moments and while the page is in view (they are big)
      if (idle && !document.hidden) up.snaps = Save.snaps();
      return c.from(CLOUD_TABLE).upsert(up).then((w) => { if (w.error) throw w.error; this.stamp = now; });
    });
  }
};
