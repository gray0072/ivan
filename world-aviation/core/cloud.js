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
//
// Nothing is ever sent over a cloud copy this device has not merged:
// every upload reads the career's copy first, and one another device
// changed since is merged in before (or, in the middle of a flight or an
// exam, left for the next sync at the title or the operations screen).
// The cloud is never waited for: the careers live in localStorage and the
// game plays on them whatever the network does; every request ends by a
// timeout. Signed in, but the account's careers not read yet (no network,
// an error, a timeout): the account row says so and offers Try again or
// playing on with the progress on this device, merged by itself once the
// cloud answers again.
// ============================================================

// The project's URL and its publishable key are not secrets: they ship to every visitor in the
// page either way; what guards the rows is the table's row-level security (schema.sql).
const CLOUD_URL = 'https://achcmqqooszwfwyfndbd.supabase.co';
const CLOUD_KEY = 'sb_publishable_X7gyM9_VkV1Zhw6af8zN2w_flfVmLUN';
const CLOUD_TABLE = 'worldaviation_careers';
const CLOUD_AUTH_KEY = 'worldaviation.auth.';             // + the account's user id: that account's session
const CLOUD_AUTH_NEW = 'worldaviation.auth.new';          // a sign-in on its way back from Google
const CLOUD_PENDING_KEY = 'worldaviation.cloud.pending';  // what that sign-in is for: { career: id | null }
const CLOUD_SENT_KEY = 'worldaviation.cloud.sent';        // { user id: [career ids] }: careers this device has seen in that account
const CLOUD_PUSH_MS = 10000;                              // changes are sent this long after the last one
const CLOUD_REQUEST_MS = 10000;                           // a request that has not answered by then is given up
const CLOUD_SYNC_MS = 25000;                              // ... and a whole sync (the session, the read, the write)
const CLOUD_RETRY_MS = 30000;                             // a failed sync is tried again this often while the page is in view
const CLOUD_TICK_MS = 5000;                               // how often that (and a career waiting to go up) is looked at

// every request of the library: given up after CLOUD_REQUEST_MS, and kept alive past the page going to
// the background (the last changes leave as it hides; keepalive takes a body up to 64 KB)
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
  clients: {},         // one Supabase client per account (by user id), never two on one session
  has: {},             // which of them are signed in (a session held, or kept while it cannot be refreshed offline)
  seen: {},            // which of them have said so yet (the stored session is read when a client starts)
  emails: {},
  userId: null,        // the account in use: the open career's
  sync: 'idle',        // how the last sync of that account went: 'syncing' | 'synced' | 'error' | 'idle'
  loaded: {},          // which accounts' careers have been read and merged in this session
  playOn: false,       // the player chose to play with this device's progress after a failed load (this session)
  notice: '',          // a sign-in that could not go or did not finish: 'offline' | 'signInFailed'
  stamps: {},          // '<user>/<career>': the cloud copy this device last read or wrote (its updated_at, ms)
  waiting: false,      // the open career has changes that wait for the next sync (another device's to merge first)
  merging: false,      // a cloud copy is being merged in: its saves are not sent up on their own
  busy: false,
  again: false,
  lastTry: 0,
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
    window.addEventListener('online', () => {
      if (this.notice === 'offline') { this.notice = ''; this.changed(); }
      if (this.ready()) this.syncAccount();
    });
    // a sync that failed, or a career that waits for one, at the next moment the careers may change
    setInterval(() => {
      if (!this.ready() || document.hidden || this.busy) return;
      if (this.waiting || (this.sync === 'error' && Date.now() - this.lastTry >= CLOUD_RETRY_MS)) this.syncAccount();
    }, CLOUD_TICK_MS);
  },

  // ---------- the accounts and their clients ----------
  client(uid) {
    if (!this.clients[uid]) {
      const c = supabase.createClient(CLOUD_URL, CLOUD_KEY, {
        auth: { flowType: 'pkce', storageKey: CLOUD_AUTH_KEY + uid, detectSessionInUrl: false },
        global: { fetch: cloudFetch }
      });
      this.clients[uid] = c;
      // fired at once with the stored session, then on every change; the library must not be called
      // back from inside its own callback, hence the timeout
      c.auth.onAuthStateChange((event, session) => setTimeout(() => this.authChanged(uid, session, event), 0));
    }
    return this.clients[uid];
  },
  // a session that cannot be refreshed (offline) is still kept by the library: the account stays signed
  // in and syncs once it can; a session gone for good (signed out, refused by the server) is not kept
  authChanged(uid, session, event) {
    const had = !!this.has[uid];
    this.seen[uid] = true;
    const live = !!(session && session.user && session.user.id === uid);
    let kept = false;
    try { kept = !!localStorage.getItem(CLOUD_AUTH_KEY + uid); } catch (err) { /* ignore */ }
    this.has[uid] = live || kept;
    if (live && session.user.email) this.emails[uid] = session.user.email;
    if (uid !== this.userId) return;
    if (this.has[uid] && !had) this.syncAccount();
    // the session is back (refreshed once the network returned): the sync that could not run now runs
    else if (live && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && !this.loaded[uid] && !this.busy) this.syncAccount();
    else if (!this.has[uid] && had) { this.sync = 'idle'; this.changed(); }
  },
  // the account's session, or a rejection (none: signed out, or out of date with no network to refresh it)
  session(uid) {
    return this.client(uid).auth.getSession().then((r) => {
      const s = r && r.data && r.data.session;
      if (!s || !s.user || s.user.id !== uid) throw new Error('no session');
    });
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
  // account's session is gone: sign in again), 'loadFailed' (the account's careers could not be read
  // yet: Try again or play on), 'local' (playing on with this device's progress, merged once the cloud
  // answers), else how the sync goes
  get status() {
    if (!this.available) return 'unavailable';
    const c = Career.data && Career.data.cloud;
    if (!c) return 'off';
    if (c.user === this.userId && !this.seen[c.user]) return 'syncing';
    if (c.user !== this.userId || !this.has[c.user]) return 'signedOut';
    if (this.sync === 'error' && !this.loaded[c.user]) return this.playOn ? 'local' : 'loadFailed';
    return this.sync === 'idle' ? 'syncing' : this.sync;
  },
  changed(careers) { if (this.onChange) this.onChange(!!careers); },
  // the choice on the account row when the account's careers could not be read
  retry() { this.playOn = false; this.syncAccount(); },
  playLocal() { this.playOn = true; this.changed(); },

  // ---------- signing in ----------
  // Google, then back to this page; `forCareer`: the open career joins the account (else the account's
  // careers only come to this device); opts.name: the career takes the account's name (a new career
  // started with Google whose suggested name was kept)
  signIn(forCareer, opts) {
    if (!this.available) return;
    // Google's page cannot open without a network: say so instead of a browser error page
    if (navigator.onLine === false) { this.notice = 'offline'; this.changed(); return; }
    this.notice = '';
    Career.writeJson(CLOUD_PENDING_KEY, { career: forCareer && Career.data ? Career.data.id : null, name: !!(opts && opts.name) });
    const c = supabase.createClient(CLOUD_URL, CLOUD_KEY, { auth: { flowType: 'pkce', storageKey: CLOUD_AUTH_NEW }, global: { fetch: cloudFetch } });
    c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } })
      .then((r) => { if (r && r.error) { this.notice = 'signInFailed'; this.changed(); } }, () => { this.notice = 'signInFailed'; this.changed(); });
  },
  // back from Google: the code is swapped for the session (by a client on the sign-in's own key), the
  // session moves under its account's key, the career it was for joins the account, and the account syncs
  finishSignIn(pending) {
    this.sync = 'syncing';
    const c = supabase.createClient(CLOUD_URL, CLOUD_KEY, { auth: { flowType: 'pkce', storageKey: CLOUD_AUTH_NEW }, global: { fetch: cloudFetch } });
    cloudLimit(c.auth.getSession(), CLOUD_SYNC_MS).then((r) => r.data && r.data.session, () => null).then((session) => {
      c.auth.stopAutoRefresh();
      let raw = null;
      try {
        raw = localStorage.getItem(CLOUD_AUTH_NEW);
        for (const k of Object.keys(localStorage)) if (k.indexOf(CLOUD_AUTH_NEW) === 0) localStorage.removeItem(k);
      } catch (err) { /* ignore */ }
      // Google's answer could not be swapped for a session (the network went away on the way back)
      if (!session || !raw) { this.sync = 'idle'; this.notice = 'signInFailed'; this.careerOpened(); return; }
      this.notice = '';
      const uid = session.user.id;
      this.emails[uid] = session.user.email || '';
      try { localStorage.setItem(CLOUD_AUTH_KEY + uid, raw); } catch (err) { /* ignore */ }
      if (pending.career && Career.data && Career.data.id === pending.career) {
        Career.data.cloud = { user: uid, email: this.emails[uid] };
        const meta = session.user.user_metadata || {};
        if (pending.name && (meta.full_name || meta.name)) Career.rename(meta.full_name || meta.name);
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
  // not here yet added to the list (and opened when no career is), each one here that was in the account
  // and is not any more (deleted on another device) left on this device only, then every career of the
  // account on this device sent up in one go. Only while the careers may change under the player; a
  // failure sends nothing up and is tried again on the next return to the foreground or to the network,
  // the next career opened, or by itself every CLOUD_RETRY_MS.
  syncAccount() {
    const uid = this.userId;
    if (!this.ready() || !this.idle()) return;
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    this.lastTry = Date.now();
    this.sync = 'syncing';
    this.changed();
    const client = this.client(uid);
    let careersChanged = false;
    // (the library's own retries of a read off: a failure shows at once, and the sync is tried again by itself)
    const op = this.session(uid).then(() => client.from(CLOUD_TABLE).select('career_id, data, updated_at').eq('user_id', uid).retry(false)).then((r) => {
      if (r.error) throw r.error;
      if (uid !== this.userId) return null;
      this.loaded[uid] = true;
      const rows = r.data || [];
      const here = Career.list();
      const cloud = { user: uid, email: this.emails[uid] || '' };
      let newest = null;
      for (const row of rows) {
        const c = here.find((x) => x.id === row.career_id);
        if (!c) {
          this.quietly(() => Career.importCareer(row.data, cloud));
          this.imported++;
          if (!newest || row.updated_at > newest.updated_at) newest = row;
        } else if (c.cloud && c.cloud.user === uid) {
          this.quietly(() => Career.mergeCareer(row.career_id, row.data));
          if (c.current) careersChanged = true;
        }
        // (a career here signed out of this account keeps to itself)
      }
      for (const c of here) {
        if (c.cloud && c.cloud.user === uid && !rows.some((row) => row.career_id === c.id) && this.wasSent(uid, c.id)) {
          this.unlink(uid, c.id);
          careersChanged = true;
        }
      }
      if (newest) careersChanged = true;
      if (newest && !Career.data) Career.open(newest.career_id);
      const out = Career.list().filter((c) => c.cloud && c.cloud.user === uid).map((c) => this.row(uid, Career.read(c.id)));
      return out.length ? this.send(client, out).then(() => { for (const x of out) this.sent(uid, x.career_id, x.updated_at); }) : null;
    });
    cloudLimit(op, CLOUD_SYNC_MS).then(() => {
      if (uid === this.userId) { this.sync = 'synced'; this.waiting = false; }
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
  // a cloud copy merged in (or a career changed by the cloud) without its saves scheduling an upload
  quietly(fn) {
    this.merging = true;
    try { return fn(); } finally { this.merging = false; }
  },
  // what this device knows of each career's cloud copy: the version it last read or wrote, and the
  // careers it has seen in the account (one of them gone from it was deleted on another device)
  knows(uid, id, at) { return this.stamps[uid + '/' + id] === Date.parse(at); },
  wasSent(uid, id) { const x = Career.readJson(CLOUD_SENT_KEY) || {}; return (x[uid] || []).indexOf(id) >= 0; },
  sent(uid, id, at) {
    this.stamps[uid + '/' + id] = Date.parse(at);
    const x = Career.readJson(CLOUD_SENT_KEY) || {};
    x[uid] = x[uid] || [];
    if (x[uid].indexOf(id) < 0) { x[uid].push(id); Career.writeJson(CLOUD_SENT_KEY, x); }
  },
  forget(uid, id) {
    delete this.stamps[uid + '/' + id];
    const x = Career.readJson(CLOUD_SENT_KEY) || {};
    if (!x[uid] || x[uid].indexOf(id) < 0) return;
    x[uid] = x[uid].filter((c) => c !== id);
    Career.writeJson(CLOUD_SENT_KEY, x);
  },
  // a career deleted from the account on another device: it stays here, on this device only (never
  // sent back into the account, which would undo the deletion)
  unlink(uid, id) {
    this.forget(uid, id);
    const d = Career.read(id);
    if (!d || !d.cloud || d.cloud.user !== uid) return;
    if (Career.data && Career.data.id === id) {
      Career.data.cloud = null;
      this.quietly(() => Career.save());
      this.careerOpened();
    } else {
      d.cloud = null;
      this.quietly(() => Career.withCareer(d, () => Career.save()));
    }
  },

  // One career up to its account: its cloud copy is read first, and a copy this device has not seen
  // (another device's progress) is merged in before when `merge` (the careers may change now), else
  // the career waits for the next sync — it is never sent over a copy it has not merged. Resolves
  // 'sent', 'merged' (merged in, then sent), 'wait' or 'gone' (deleted from the account elsewhere).
  pushCareer(uid, id, merge) {
    const client = this.client(uid);
    const op = () => this.session(uid)
      .then(() => client.from(CLOUD_TABLE).select('data, updated_at').eq('user_id', uid).eq('career_id', id).maybeSingle().retry(false))
      .then((r) => {
        if (r.error) throw r.error;
        const row = r.data;
        if (!row && this.wasSent(uid, id)) { this.unlink(uid, id); return 'gone'; }
        let res = 'sent';
        if (row && !this.knows(uid, id, row.updated_at)) {
          if (!merge) return 'wait';
          this.quietly(() => Career.mergeCareer(id, row.data));
          res = 'merged';
        }
        const d = Career.read(id);
        if (!d) return 'gone';
        const out = this.row(uid, d);
        return client.from(CLOUD_TABLE).upsert(out).then((r2) => {
          if (r2.error) throw r2.error;
          this.sent(uid, id, out.updated_at);
          return res;
        });
      });
    this.queue = this.queue.catch(() => {}).then(() => cloudLimit(op(), CLOUD_SYNC_MS));
    return this.queue;
  },

  schedule(id) {
    if (this.merging || !Career.data || id !== Career.data.id || !this.linked()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push(), CLOUD_PUSH_MS);
  },
  // the open career up to its account now (merged with another device's copy first when the careers may
  // change now or `merge` says so, else waiting for the next sync)
  push(merge) {
    clearTimeout(this.timer); this.timer = null;
    if (!this.linked()) return;
    const uid = this.userId;
    this.sync = 'syncing';
    this.changed();
    this.pushCareer(uid, Career.data.id, !!merge || this.idle()).then((res) => {
      if (res === 'wait') this.waiting = true;
      if (uid === this.userId) this.sync = res === 'wait' ? 'syncing' : 'synced';
      this.changed(res === 'merged' || res === 'gone');
    }, () => {
      this.lastTry = Date.now();
      if (uid === this.userId) this.sync = 'error';
      this.changed();
    });
  },

  // ---------- the careers' own moments (ui/ui.js) ----------
  // before another career is opened or a new one started: what waits for the cloud is sent
  flush() { if (this.timer || this.waiting) { this.waiting = false; this.push(true); } },
  // a career opened (at boot, picked from the list, started): its account comes into use
  careerOpened() {
    if (!this.available) return;
    const c = Career.data && Career.data.cloud;
    if (c) this.use(c.user);
    else { clearTimeout(this.timer); this.timer = null; this.userId = null; }
    this.waiting = false;
    this.changed();
  },
  // the open career joins an account this device already knows, without going to Google
  linkTo(account) {
    if (!Career.data || !account) return;
    Career.data.cloud = { user: account.user, email: account.email };
    Career.save();
    this.careerOpened();
  },
  // the open career leaves its account (its last changes merged with the account's copy and sent
  // first); the account's session goes too when no other career here uses it
  signOut() {
    const c = Career.data && Career.data.cloud;
    if (!c) return;
    clearTimeout(this.timer); this.timer = null;
    if (this.has[c.user]) this.pushCareer(c.user, Career.data.id, true).catch(() => {});
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
    this.forget(c.user, d.id);
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
