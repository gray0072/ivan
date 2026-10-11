'use strict';

// ============================================================
// World Aviation — the cloud copy of the careers (optional): Google
// sign-in through Supabase Auth and the worldaviation_careers table
// (supabase/schema.sql: a row per career, under the Google account it
// syncs with). Used by game.js (Cloud.init once the careers are
// loaded) and ui/ui.js (the buttons, the status, the careers list).
//
// Every career has its own sign-in: it is linked to one Google account
// (Career.data.cloud = { user, email }) or to none. Each account's
// session is kept under its own key, so careers of different accounts
// live side by side; the open career's account is the one in use. On
// sign-in, and whenever a linked career is opened or the game comes back
// to the foreground, the account's careers are synced: the ones on this
// device are merged with their cloud copies and sent back, the ones not
// here yet join the list. Without lib/supabase.min.js or from file://
// (Google cannot send the player back there) the game has no cloud.
// ============================================================

// The project's URL and its publishable key are not secrets: they ship to every visitor in
// the page either way; what guards the rows is the table's row-level security (schema.sql).
const CLOUD_URL = 'https://achcmqqooszwfwyfndbd.supabase.co';
const CLOUD_KEY = 'sb_publishable_X7gyM9_VkV1Zhw6af8zN2w_flfVmLUN';
const CLOUD_TABLE = 'worldaviation_careers';
const CLOUD_AUTH_KEY = 'worldaviation.auth.';             // + the account's user id: that account's session
const CLOUD_AUTH_NEW = 'worldaviation.auth.new';          // a sign-in on its way back from Google
const CLOUD_PENDING_KEY = 'worldaviation.cloud.pending';  // what that sign-in is for: { career: id | null }
const CLOUD_PUSH_MS = 10000;                              // changes are sent this long after the last one

const Cloud = {
  available: false,
  clients: {},         // one Supabase client per account (by user id), never two on one session
  has: {},             // which of them hold a session now
  seen: {},            // which of them have said so yet (the stored session is read when a client starts)
  emails: {},
  userId: null,        // the account in use: the open career's
  sync: 'idle',        // how the last sync of that account went: 'syncing' | 'synced' | 'error' | 'idle'
  imported: 0,         // careers that came from the cloud in the last sync (the title then shows the list)
  timer: null,
  queue: Promise.resolve(),
  idle: () => false,   // may the careers change under the player now (game.js)
  onChange: null,      // something to show changed (and whether the careers did): ui/ui.js redraws

  init(idle) {
    if (idle) this.idle = idle;
    if (typeof supabase === 'undefined' || !/^https?:$/.test(location.protocol)) return;
    this.available = true;
    Career.onSave = (id) => this.schedule(id);
    // (the session of the first version, one for the whole game, is not used any more)
    try { localStorage.removeItem('worldaviation.auth'); localStorage.removeItem('worldaviation.auth-code-verifier'); } catch (err) { /* ignore */ }
    const pending = Career.readJson(CLOUD_PENDING_KEY);
    const code = new URLSearchParams(location.search).has('code');
    try { localStorage.removeItem(CLOUD_PENDING_KEY); } catch (err) { /* ignore */ }
    if (pending && code) this.finishSignIn(pending);
    else this.careerOpened();
    // back in the foreground: the other devices' progress comes in; going away: what waits is sent
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (this.timer) this.push(); }
      else if (this.ready()) this.syncAccount();
    });
  },

  // ---------- the accounts and their clients ----------
  client(uid) {
    if (!this.clients[uid]) {
      const c = supabase.createClient(CLOUD_URL, CLOUD_KEY, {
        auth: { flowType: 'pkce', storageKey: CLOUD_AUTH_KEY + uid, detectSessionInUrl: false }
      });
      this.clients[uid] = c;
      // fired at once with the stored session, then on every change; the library must not be called
      // back from inside its own callback, hence the timeout
      c.auth.onAuthStateChange((event, session) => setTimeout(() => this.authChanged(uid, session), 0));
    }
    return this.clients[uid];
  },
  authChanged(uid, session) {
    const had = !!this.has[uid];
    this.seen[uid] = true;
    this.has[uid] = !!(session && session.user && session.user.id === uid);
    if (session && session.user && session.user.email) this.emails[uid] = session.user.email;
    if (uid !== this.userId) return;
    if (this.has[uid] && !had) this.syncAccount();
    else if (!this.has[uid] && had) { this.sync = 'idle'; this.changed(); }
  },
  // the account in use: the open career's (or the one just signed in with, to bring its careers here)
  use(uid) {
    if (this.userId !== uid) { clearTimeout(this.timer); this.timer = null; }
    this.userId = uid;
    if (!uid) return;
    this.client(uid);
    if (this.has[uid]) this.syncAccount();
  },
  ready() { return !!(this.userId && this.has[this.userId]); },
  // the open career is linked to the account in use and that account is signed in
  linked() {
    const c = Career.data && Career.data.cloud;
    return !!(c && c.user === this.userId && this.ready());
  },
  // the accounts this device knows (some career of it links to one, and its session is kept)
  accounts() {
    const out = [];
    for (const c of Career.list()) {
      if (!c.cloud || out.some((a) => a.user === c.cloud.user)) continue;
      let kept = false;
      try { kept = !!localStorage.getItem(CLOUD_AUTH_KEY + c.cloud.user); } catch (err) { /* ignore */ }
      if (kept) out.push(c.cloud);
    }
    return out;
  },
  // what to show for the open career: 'unavailable', 'off' (not linked), 'signedOut' (linked, but its
  // account's session is gone: sign in again), else how the sync goes
  get status() {
    if (!this.available) return 'unavailable';
    const c = Career.data && Career.data.cloud;
    if (!c) return 'off';
    if (c.user === this.userId && !this.seen[c.user]) return 'syncing';
    if (c.user !== this.userId || !this.has[c.user]) return 'signedOut';
    return this.sync === 'idle' ? 'syncing' : this.sync;
  },
  changed(careers) { if (this.onChange) this.onChange(!!careers); },

  // ---------- signing in ----------
  // Google, then back to this page; `forCareer`: the open career joins the account (else the account's
  // careers only come to this device)
  signIn(forCareer) {
    if (!this.available) return;
    Career.writeJson(CLOUD_PENDING_KEY, { career: forCareer && Career.data ? Career.data.id : null });
    const c = supabase.createClient(CLOUD_URL, CLOUD_KEY, { auth: { flowType: 'pkce', storageKey: CLOUD_AUTH_NEW } });
    c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } })
      .then((r) => { if (r && r.error) { this.sync = 'error'; this.changed(); } }, () => { this.sync = 'error'; this.changed(); });
  },
  // back from Google: the code is swapped for the session (by a client on the sign-in's own key), the
  // session moves under its account's key, the career it was for joins the account, and the account syncs
  finishSignIn(pending) {
    this.sync = 'syncing';
    const c = supabase.createClient(CLOUD_URL, CLOUD_KEY, { auth: { flowType: 'pkce', storageKey: CLOUD_AUTH_NEW } });
    c.auth.getSession().then((r) => r.data && r.data.session, () => null).then((session) => {
      c.auth.stopAutoRefresh();
      let raw = null;
      try {
        raw = localStorage.getItem(CLOUD_AUTH_NEW);
        for (const k of Object.keys(localStorage)) if (k.indexOf(CLOUD_AUTH_NEW) === 0) localStorage.removeItem(k);
      } catch (err) { /* ignore */ }
      if (!session || !raw) { this.sync = 'error'; this.careerOpened(); return; }
      const uid = session.user.id;
      this.emails[uid] = session.user.email || '';
      try { localStorage.setItem(CLOUD_AUTH_KEY + uid, raw); } catch (err) { /* ignore */ }
      if (pending.career && Career.data && Career.data.id === pending.career) {
        Career.data.cloud = { user: uid, email: this.emails[uid] };
        Career.save();
      }
      // signed in only to bring the account's careers here: the list shows them
      if (!pending.career) this.showList = true;
      this.use(uid);
      this.changed();
    });
  },

  // ---------- syncing ----------
  // All the account's careers: each one here merged with its cloud copy (Career.mergeCareer), each one
  // not here yet added to the list (and opened when no career is), then every career of the account on
  // this device sent up in one go. Only while the careers may change under the player; a failure sends
  // nothing up and is tried again on the next return to the foreground or the next career opened.
  syncAccount() {
    const uid = this.userId;
    if (!this.ready() || !this.idle()) return;
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    this.sync = 'syncing';
    this.changed();
    const client = this.client(uid);
    let careersChanged = false;
    client.from(CLOUD_TABLE).select('career_id, data, updated_at').eq('user_id', uid).then((r) => {
      if (r.error) throw r.error;
      if (uid !== this.userId) return null;
      const here = Career.list();
      const cloud = { user: uid, email: this.emails[uid] || '' };
      let newest = null;
      for (const row of r.data || []) {
        const c = here.find((x) => x.id === row.career_id);
        if (!c) {
          Career.importCareer(row.data, cloud);
          this.imported++;
          if (!newest || row.updated_at > newest.updated_at) newest = row;
        } else if (c.cloud && c.cloud.user === uid) {
          Career.mergeCareer(row.career_id, row.data);
          if (c.current) careersChanged = true;
        }
        // (a career here signed out of this account keeps to itself)
      }
      if (newest) careersChanged = true;
      if (newest && !Career.data) Career.open(newest.career_id);
      const rows = Career.list().filter((c) => c.cloud && c.cloud.user === uid).map((c) => this.row(uid, Career.read(c.id)));
      return rows.length ? this.send(client, rows) : null;
    }).then(() => {
      if (uid === this.userId) this.sync = 'synced';
    }, () => {
      if (uid === this.userId) this.sync = 'error';
    }).then(() => {
      this.busy = false;
      this.changed(careersChanged);
      if (this.again) { this.again = false; this.syncAccount(); }
    });
  },
  row(uid, d) {
    return { user_id: uid, career_id: d.id, data: JSON.parse(JSON.stringify(d)), updated_at: new Date().toISOString() };
  },
  // an upsert after the ones before it, so they arrive in order; rejects on a failed request
  send(client, rows) {
    this.queue = this.queue.catch(() => {}).then(() => client.from(CLOUD_TABLE).upsert(rows)).then((r) => { if (r.error) throw r.error; });
    return this.queue;
  },

  schedule(id) {
    if (!Career.data || id !== Career.data.id || !this.linked()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push(), CLOUD_PUSH_MS);
  },
  // the open career up to its account now
  push() {
    clearTimeout(this.timer); this.timer = null;
    if (!this.linked()) return this.queue;
    const uid = this.userId;
    this.sync = 'syncing';
    this.changed();
    return this.send(this.client(uid), this.row(uid, Career.data)).then(() => {
      if (uid === this.userId) { this.sync = 'synced'; this.changed(); }
    }, () => {
      if (uid === this.userId) { this.sync = 'error'; this.changed(); }
    });
  },

  // ---------- the careers' own moments (ui/ui.js) ----------
  // before another career is opened or a new one started: what waits for the cloud is sent
  flush() { if (this.timer) this.push(); },
  // a career opened (at boot, picked from the list, started): its account comes into use
  careerOpened() {
    if (!this.available) return;
    const c = Career.data && Career.data.cloud;
    if (c) this.use(c.user);
    else { clearTimeout(this.timer); this.timer = null; this.userId = null; }
    this.changed();
  },
  // the open career joins an account this device already knows, without going to Google
  linkTo(account) {
    if (!Career.data || !account) return;
    Career.data.cloud = { user: account.user, email: account.email };
    Career.save();
    this.careerOpened();
  },
  // the open career leaves its account (its last changes sent first); the account's session goes
  // too when no other career here uses it
  signOut() {
    const c = Career.data && Career.data.cloud;
    if (!c) return;
    this.push();
    Career.data.cloud = null;
    Career.save();
    this.dropIfUnused(c.user);
    this.careerOpened();
  },
  // the open career deleted: its cloud copy goes with it
  careerDeleted() {
    const d = Career.data, c = d && d.cloud;
    clearTimeout(this.timer); this.timer = null;
    if (!c || !this.available) return;
    const client = this.client(c.user);
    if (this.has[c.user]) {
      this.queue = this.queue.catch(() => {}).then(() => client.from(CLOUD_TABLE).delete().eq('user_id', c.user).eq('career_id', d.id)).catch(() => {});
    }
    this.dropIfUnused(c.user, d.id);
  },
  dropIfUnused(uid, except) {
    if (Career.list().some((x) => x.id !== except && x.cloud && x.cloud.user === uid)) return;
    const client = this.clients[uid];
    this.queue = this.queue.catch(() => {}).then(() => client ? client.auth.signOut({ scope: 'local' }) : null).catch(() => {}).then(() => {
      try { localStorage.removeItem(CLOUD_AUTH_KEY + uid); } catch (err) { /* ignore */ }
    });
    this.has[uid] = false;
  }
};
