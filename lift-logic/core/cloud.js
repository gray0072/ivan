'use strict';

// Lift Logic — the cloud copy of the progress (optional): a Google sign-in through Supabase Auth and the
// liftlogic_progress table (supabase/schema.sql: a row per Google account). Used by game.js (Cloud.init,
// onChange) and ui/screens.js (the start menu's account row: the sign-in, the status, signing out).
//
// One account per device: once signed in, the progress and the programs here are merged with the
// account's copy and sent back (Progress.merge / snapshot), so the same player goes on with the same
// stars and programs on a phone and a computer. That happens on the sign-in, at start, on every return
// to the foreground, 10 s after the last change and when the page goes to the background. Without
// signing in nothing changes and no network call is made; without lib/supabase.min.js or from file://
// (Google cannot send the player back there) the game has no cloud and shows none of it.

// The project's URL and its publishable key are not secrets: they ship to every visitor in the page
// either way; what guards the rows is the table's row-level security (supabase/schema.sql). The project
// is the one world-aviation (and the swedish app) use.
const CLOUD_URL = 'https://achcmqqooszwfwyfndbd.supabase.co';
const CLOUD_KEY = 'sb_publishable_X7gyM9_VkV1Zhw6af8zN2w_flfVmLUN';
const CLOUD_TABLE = 'liftlogic_progress';
const CLOUD_PUSH_MS = 10000;   // changes are sent this long after the last one

const Cloud = {
  available: false,
  client: null,
  seen: false,         // the client has told whether it holds a session (it reads the stored one at start)
  userId: null,        // the signed-in account, or null
  email: '',
  sync: 'idle',        // how the last sync went: 'syncing' | 'synced' | 'error' | 'idle'
  busy: false,
  again: false,
  timer: null,
  onChange: null,      // something to show changed (and whether the progress did): game.js redraws

  init() {
    if (typeof supabase === 'undefined' || !/^https?:$/.test(location.protocol)) return;
    this.available = true;
    const acct = Store.json(KEYS.cloud, null);
    if (acct) this.email = acct.email || '';
    // a client only when there is a session to use, or a sign-in on its way back from Google
    const back = new URLSearchParams(location.search).has('code') && !!Store.get(KEYS.auth + '-code-verifier');
    if (acct || back || Store.get(KEYS.auth)) this.start();
    Progress.onSave = () => this.schedule();
    // back in the foreground: the other devices' progress comes in; going away: what waits is sent
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (this.timer) this.syncNow(); }
      else this.syncNow();
    });
  },
  start() {
    if (this.client) return this.client;
    // the session under the game's own key, never the library's default sb-<project>-auth-token, which the
    // swedish app on the same origin uses; Google's answer (?code=…) is swapped for the session and
    // stripped from the address by the library itself
    this.client = supabase.createClient(CLOUD_URL, CLOUD_KEY, {
      auth: { flowType: 'pkce', storageKey: KEYS.auth, detectSessionInUrl: true }
    });
    // fired at once with the stored session, then on every change; the library must not be called back
    // from inside its own callback, hence the timeout
    this.client.auth.onAuthStateChange((event, session) => setTimeout(() => this.authChanged(session), 0));
    return this.client;
  },
  authChanged(session) {
    this.seen = true;
    const uid = session && session.user ? session.user.id : null;
    if (uid && uid !== this.userId) {
      this.userId = uid;
      this.email = session.user.email || '';
      Store.setJson(KEYS.cloud, { user: uid, email: this.email });
      this.syncNow();
    } else if (!uid && this.userId) {
      this.userId = null;
      this.sync = 'idle';
    }
    this.changed();
  },
  ready() { return !!(this.client && this.userId); },
  // what to show: 'unavailable', 'off' (never signed in here), 'signedOut' (the session is gone: sign in
  // again), else how the sync goes
  get status() {
    if (!this.available) return 'unavailable';
    if (this.client && !this.seen) return 'syncing';
    if (!this.userId) return Store.json(KEYS.cloud, null) ? 'signedOut' : 'off';
    return this.sync === 'idle' ? 'syncing' : this.sync;
  },
  changed(progress) { if (this.onChange) this.onChange(!!progress); },

  // ---------- signing in and out ----------
  signIn() {
    if (!this.available) return;
    this.start().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } })
      .then((r) => { if (r && r.error) { this.sync = 'error'; this.changed(); } }, () => { this.sync = 'error'; this.changed(); });
  },
  // the progress stays on this device; the last changes are sent first
  signOut() {
    if (!this.client) return;
    const c = this.client;
    const last = this.ready() ? this.upsert() : Promise.resolve();
    clearTimeout(this.timer); this.timer = null;
    last.catch(() => {}).then(() => c.auth.signOut({ scope: 'local' })).catch(() => {});
    try { localStorage.removeItem(KEYS.cloud); } catch (err) { /* ignore */ }
    this.userId = null;
    this.email = '';
    this.sync = 'idle';
    this.changed();
  },

  // ---------- syncing ----------
  schedule() {
    if (!this.ready()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.syncNow(), CLOUD_PUSH_MS);
  },
  // the account's copy merged into the progress here, then the result sent back; a failed request sends
  // nothing over the cloud's copy, and the next change or return to the foreground tries again
  syncNow() {
    if (!this.ready()) return;
    clearTimeout(this.timer); this.timer = null;
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    this.sync = 'syncing';
    this.changed();
    const uid = this.userId;
    let progressChanged = false;
    this.client.from(CLOUD_TABLE).select('data').eq('user_id', uid).maybeSingle().then((r) => {
      if (r.error) throw r.error;
      if (uid !== this.userId) throw new Error('signed out meanwhile');
      if (r.data && r.data.data) progressChanged = Progress.merge(r.data.data);
      return this.upsert();
    }).then(() => {
      if (uid === this.userId) this.sync = 'synced';
    }, () => {
      if (uid === this.userId) this.sync = 'error';
    }).then(() => {
      this.busy = false;
      this.changed(progressChanged);
      if (this.again) { this.again = false; this.syncNow(); }
    });
  },
  upsert() {
    const row = { user_id: this.userId, data: Progress.snapshot(), updated_at: new Date().toISOString() };
    return this.client.from(CLOUD_TABLE).upsert(row).then((r) => { if (r.error) throw r.error; });
  }
};
