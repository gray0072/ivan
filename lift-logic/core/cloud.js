'use strict';

// Lift Logic — the cloud copy of the progress (optional): a Google sign-in through Supabase Auth and the
// liftlogic_progress table (supabase/schema.sql: a row per Google account). Used by game.js (Cloud.init,
// onChange) and ui/screens.js (the start menu's account row: the sign-in, the status, signing out, the
// choice when the cloud cannot be reached).
//
// One account per device: once signed in, the progress and the programs here are merged with the
// account's copy and sent back (Progress.merge / snapshot), so the same player goes on with the same
// stars and programs on a phone and a computer. Every sync reads the account's copy and merges it in
// before it writes anything, so nothing is ever sent over progress this device has not seen. That happens
// on the sign-in, at start, on every return to the foreground or to the network, 10 s after the last
// change and when the page goes to the background. Without signing in nothing changes and no network call
// is made; without lib/supabase.min.js or from file:// (Google cannot send the player back there) the game
// has no cloud and shows none of it.
//
// The cloud is never waited for: the progress lives in localStorage and the game plays on it whatever the
// network does. Every request ends by a timeout; signed in but the account's copy not read yet (no
// network, an error, a timeout), the account row says so and offers Try again or playing on with the
// progress here, which is merged by itself once the cloud answers again.

// The project's URL and its publishable key are not secrets: they ship to every visitor in the page
// either way; what guards the rows is the table's row-level security (supabase/schema.sql). The project
// is the one world-aviation (and the swedish app) use.
const CLOUD_URL = 'https://achcmqqooszwfwyfndbd.supabase.co';
const CLOUD_KEY = 'sb_publishable_X7gyM9_VkV1Zhw6af8zN2w_flfVmLUN';
const CLOUD_TABLE = 'liftlogic_progress';
const CLOUD_PUSH_MS = 10000;        // changes are sent this long after the last one
const CLOUD_REQUEST_MS = 10000;     // a request that has not answered by then is given up
const CLOUD_SYNC_MS = 25000;        // ... and a whole sync (the session, the read, the write)
const CLOUD_RETRY_MS = 30000;       // a failed sync is tried again this often while the page is in view
const CLOUD_TICK_MS = 5000;         // how often that is looked at

// every request of the library: given up after CLOUD_REQUEST_MS, and kept alive past the page going to the
// background (the last changes leave as it hides; keepalive takes a body up to 64 KB)
function cloudFetch(url, opts) {
  const o = Object.assign({}, opts);
  let timer = null;
  if (typeof AbortController !== 'undefined') {
    const ctl = new AbortController(), outer = o.signal;
    if (outer) { if (outer.aborted) ctl.abort(); else outer.addEventListener('abort', () => ctl.abort()); }
    o.signal = ctl.signal;
    timer = setTimeout(() => ctl.abort(), CLOUD_REQUEST_MS);
  }
  if (document.hidden && (!o.body || (typeof o.body === 'string' && o.body.length < 60000))) o.keepalive = true;
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
  seen: false,         // the client has told whether it holds a session (it reads the stored one at start)
  userId: null,        // the signed-in account (also while its session cannot be refreshed offline), or null
  email: '',
  sync: 'idle',        // how the last sync went: 'syncing' | 'synced' | 'error' | 'idle'
  loaded: false,       // the account's copy has been read and merged in this session
  playOn: false,       // the player chose to play with this device's progress after a failed load (this session)
  notice: '',          // a sign-in that could not go or did not finish: 'offline' | 'signInFailed'
  back: false,         // this page is Google's answer to a sign-in
  busy: false,
  again: false,
  timer: null,
  lastTry: 0,
  onChange: null,      // something to show changed (and whether the progress did): game.js redraws

  init() {
    if (typeof supabase === 'undefined' || !/^https?:$/.test(location.protocol)) return;
    this.available = true;
    const acct = Store.json(KEYS.cloud, null);
    if (acct) this.email = acct.email || '';
    // signed in on this device: the session is kept (it may be out of date and the network away: the
    // account stays signed in and syncs once it can)
    if (acct && acct.user && Store.get(KEYS.auth)) this.userId = acct.user;
    // a client only when there is a session to use, or a sign-in on its way back from Google
    this.back = new URLSearchParams(location.search).has('code') && !!Store.get(KEYS.auth + '-code-verifier');
    if (acct || this.back || Store.get(KEYS.auth)) this.start();
    Progress.onSave = () => this.schedule();
    // back in the foreground: the other devices' progress comes in; going away: what waits is sent
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
    // the session under the game's own key, never the library's default sb-<project>-auth-token, which the
    // swedish app on the same origin uses; Google's answer (?code=…) is swapped for the session and
    // stripped from the address by the library itself
    this.client = supabase.createClient(CLOUD_URL, CLOUD_KEY, {
      auth: { flowType: 'pkce', storageKey: KEYS.auth, detectSessionInUrl: true },
      global: { fetch: cloudFetch }
    });
    // fired at once with the stored session, then on every change; the library must not be called back
    // from inside its own callback, hence the timeout
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
      this.notice = '';
      Store.setJson(KEYS.cloud, { user: uid, email: this.email });
      this.syncNow();
    } else if (uid) {
      if (session.user.email) this.email = session.user.email;
      // the session is back (refreshed once the network returned): the sync that could not run now runs
      if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && !this.loaded && !this.busy) this.syncNow();
    } else if (this.userId && !Store.get(KEYS.auth)) {
      // the session is gone for good (signed out, or refused by the server): sign in again
      this.userId = null;
      this.sync = 'idle';
      this.loaded = false;
    }
    // Google's answer could not be swapped for a session (the network went away on the way back)
    if (first && this.back && !uid && !this.userId) this.notice = 'signInFailed';
    this.changed();
  },
  ready() { return !!(this.client && this.userId); },
  // what to show: 'unavailable', 'off' (never signed in here), 'signedOut' (the session is gone: sign in
  // again), 'loadFailed' (the account's copy could not be read yet: Try again or play on), 'local' (playing
  // on with this device's progress, it is merged once the cloud answers), else how the sync goes
  get status() {
    if (!this.available) return 'unavailable';
    if (!this.userId) {
      if (this.client && !this.seen) return 'syncing';
      return Store.json(KEYS.cloud, null) ? 'signedOut' : 'off';
    }
    if (this.sync === 'error' && !this.loaded) return this.playOn ? 'local' : 'loadFailed';
    return this.sync === 'idle' ? 'syncing' : this.sync;
  },
  changed(progress) { if (this.onChange) this.onChange(!!progress); },

  // ---------- signing in and out ----------
  signIn() {
    if (!this.available) return;
    // Google's page cannot open without a network: say so instead of a browser error page
    if (navigator.onLine === false) { this.notice = 'offline'; this.changed(); return; }
    this.notice = '';
    this.start().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } })
      .then((r) => { if (r && r.error) { this.notice = 'signInFailed'; this.changed(); } }, () => { this.notice = 'signInFailed'; this.changed(); });
  },
  // the progress stays on this device; the last changes are merged with the account's copy and sent first
  signOut() {
    if (!this.client) return;
    const c = this.client, uid = this.userId;
    const last = uid ? cloudLimit(this.round(uid, true), CLOUD_SYNC_MS) : Promise.resolve();
    clearTimeout(this.timer); this.timer = null;
    last.catch(() => {}).then(() => c.auth.signOut({ scope: 'local' })).catch(() => {}).then(() => {
      // (offline the library may keep the session: it is this device's no more)
      if (!this.userId) { try { localStorage.removeItem(KEYS.auth); } catch (err) { /* ignore */ } }
    });
    try { localStorage.removeItem(KEYS.cloud); } catch (err) { /* ignore */ }
    this.userId = null;
    this.email = '';
    this.sync = 'idle';
    this.loaded = false;
    this.playOn = false;
    this.changed();
  },
  // the choice on the account row when the account's copy could not be read
  retry() { this.playOn = false; this.syncNow(); },
  playLocal() { this.playOn = true; this.changed(); },

  // ---------- syncing ----------
  schedule() {
    if (!this.ready()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.syncNow(), CLOUD_PUSH_MS);
  },
  // the account's copy merged into the progress here, then the result sent back; a failed request sends
  // nothing over the cloud's copy, and the next change, return or retry tries again
  syncNow() {
    if (!this.ready()) return;
    clearTimeout(this.timer); this.timer = null;
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    this.lastTry = Date.now();
    this.sync = 'syncing';
    this.changed();
    const uid = this.userId;
    const out = { changed: false };
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
  // one sync of the account: its session, its copy read and merged in, the result written back
  // (out.changed: whether the progress here changed). `leaving`: the last one before signing out
  round(uid, leaving, out) {
    const c = this.client;
    out = out || {};
    return c.auth.getSession().then((r) => {
      const s = r && r.data && r.data.session;
      if (!s || !s.user || s.user.id !== uid) throw new Error('no session');
      // (the library's own retries of a read off: a failure shows at once, and the sync is tried again by itself)
      return c.from(CLOUD_TABLE).select('data').eq('user_id', uid).maybeSingle().retry(false);
    }).then((r) => {
      if (r.error) throw r.error;
      if (!leaving && uid !== this.userId) throw new Error('signed out meanwhile');
      if (r.data && r.data.data && Progress.merge(r.data.data)) out.changed = true;
      if (!leaving) this.loaded = true;
      const row = { user_id: uid, data: Progress.snapshot(), updated_at: new Date().toISOString() };
      return c.from(CLOUD_TABLE).upsert(row);
    }).then((r) => {
      if (r.error) throw r.error;
    });
  }
};
