'use strict';

// ============================================================
// World Aviation — the cloud copy of the career (optional): Google
// sign-in through Supabase Auth and one row per Google account in
// the worldaviation_careers table (supabase/schema.sql), so the same
// career flies on a phone and a computer. Used by game.js (Cloud.init
// after the career is loaded) and ui/ui.js (the buttons, the status,
// the choice when the account keeps another career).
//
// The sign-in belongs to the career: a new career starts signed out
// (unless the account has no career in the cloud yet), and deleting the
// career deletes its cloud copy and signs out. Without lib/supabase.min.js
// or from file:// (Google cannot send the player back there) the game
// simply has no cloud and works as before.
// ============================================================

// The project's URL and its publishable key are not secrets: they ship to every visitor in
// the page either way; what guards the rows is the table's row-level security (schema.sql).
const CLOUD_URL = 'https://achcmqqooszwfwyfndbd.supabase.co';
const CLOUD_KEY = 'sb_publishable_X7gyM9_VkV1Zhw6af8zN2w_flfVmLUN';
const CLOUD_TABLE = 'worldaviation_careers';
const CLOUD_AUTH_KEY = 'worldaviation.auth';   // the session in localStorage, under the game's own prefix
const CLOUD_PUSH_MS = 10000;                   // changes are sent this long after the last one (a flight's saves in one go)

const Cloud = {
  client: null,
  user: null,          // { id, email } while signed in
  // 'unavailable' | 'signedOut' | 'syncing' | 'synced' | 'error' | 'conflict'
  status: 'unavailable',
  hasRow: false,       // the account keeps a career in the cloud (as of the last pull or push)
  linkedTo: null,      // the user this career has been pulled for: only then is it pushed
  remote: null,        // 'conflict': the other career the account keeps ({ career_id, data, updated_at })
  timer: null,
  queue: Promise.resolve(),
  idle: () => false,   // may the career change under the player now (game.js)
  onChange: null,      // the status changed (and whether the career itself did): ui/ui.js redraws

  get available() { return !!this.client; },

  init(idle) {
    if (idle) this.idle = idle;
    if (typeof supabase === 'undefined' || !/^https?:$/.test(location.protocol)) return;
    try {
      // PKCE: Google's answer comes back as ?code=… and the library swaps it for the session on load
      this.client = supabase.createClient(CLOUD_URL, CLOUD_KEY, { auth: { flowType: 'pkce', storageKey: CLOUD_AUTH_KEY } });
    } catch (err) { this.client = null; return; }
    this.status = 'signedOut';
    Career.onSave = () => this.schedule();
    // fired at once with the session kept from the last visit, then on every sign-in and sign-out;
    // the library must not be called back from inside its own callback, hence the timeout
    this.client.auth.onAuthStateChange((event, session) => {
      const u = session ? { id: session.user.id, email: session.user.email || '' } : null;
      setTimeout(() => this.authChanged(u), 0);
    });
    // back in the foreground: the other device's progress is pulled in; going away: what waits is sent
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (this.timer) this.push(); }
      else if (this.user && this.status !== 'conflict') this.pull();
    });
  },

  signIn() {
    if (!this.client) return;
    this.client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } })
      .then((r) => { if (r && r.error) this.setStatus('error'); }, () => this.setStatus('error'));
  },
  signOut() {
    if (!this.client) return Promise.resolve();
    clearTimeout(this.timer); this.timer = null;
    this.forget();
    this.setStatus('signedOut');
    return this.client.auth.signOut({ scope: 'local' }).catch(() => {});
  },
  forget() { this.user = null; this.linkedTo = null; this.hasRow = false; this.remote = null; },

  authChanged(u) {
    if (!u) { if (this.user) { this.forget(); this.setStatus('signedOut'); } return; }
    const same = this.user && this.user.id === u.id;
    this.user = u;
    if (!same || this.linkedTo !== u.id) this.pull();
  },

  setStatus(s, careerChanged) {
    this.status = s;
    if (this.onChange) this.onChange(!!careerChanged);
  },

  // Pull the account's career and bring the two together: none in the cloud — this one goes up;
  // the same career — merged (Career.mergeCloud) and sent back; none here — the cloud's is taken;
  // another career — the player chooses (status 'conflict'). A failure never sends anything up.
  pull() {
    const u = this.user;
    if (!u || !this.client || this.pulling || !this.idle()) return;
    this.pulling = true;
    this.setStatus('syncing');
    this.client.from(CLOUD_TABLE).select('career_id, data, updated_at').eq('user_id', u.id).maybeSingle().then((r) => {
      this.pulling = false;
      if (this.user !== u) return;
      if (r.error) throw r.error;
      const row = r.data;
      this.hasRow = !!row;
      if (row && !Career.data) {
        Career.adopt(row.data);
        this.linkedTo = u.id;
        this.setStatus('synced', true);
      } else if (row && row.career_id !== Career.data.id) {
        this.remote = row;
        this.linkedTo = null;
        this.setStatus('conflict');
      } else {
        this.linkedTo = u.id;
        if (row) Career.mergeCloud(row.data);
        if (Career.data) this.push(!!row); else this.setStatus('synced');
      }
    }).catch(() => {
      this.pulling = false;
      if (this.user === u) this.setStatus('error');
    });
  },

  schedule() {
    if (!this.user || this.linkedTo !== this.user.id) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push(), CLOUD_PUSH_MS);
  },
  // the career up to the cloud, one send after another so they arrive in order
  push(careerChanged) {
    clearTimeout(this.timer); this.timer = null;
    const u = this.user;
    if (!u || this.linkedTo !== u.id || !Career.data) return this.queue;
    const row = { user_id: u.id, career_id: Career.data.id, data: JSON.parse(JSON.stringify(Career.data)), updated_at: new Date().toISOString() };
    this.setStatus('syncing', careerChanged);
    this.queue = this.queue.then(() => this.client.from(CLOUD_TABLE).upsert(row)).then((r) => {
      if (this.user !== u) return;
      if (r.error) { this.setStatus('error'); return; }
      this.hasRow = true;
      this.setStatus('synced');
    }, () => { if (this.user === u) this.setStatus('error'); });
    return this.queue;
  },

  // ---------- the career's own moments (ui/ui.js) ----------
  // a new career: it takes the account only if the account keeps no career yet, else it starts signed out
  careerStarted() {
    if (!this.user) return;
    if (this.linkedTo === this.user.id && !this.hasRow) this.push();
    else this.signOut();
  },
  // the career deleted (or over): its cloud copy goes with it — never another career the account keeps
  careerDeleted(careerId) {
    const u = this.user;
    if (!u) return;
    const linked = this.linkedTo === u.id;
    clearTimeout(this.timer); this.timer = null;
    const del = linked && careerId
      ? this.queue.then(() => this.client.from(CLOUD_TABLE).delete().eq('user_id', u.id).eq('career_id', careerId)).catch(() => {})
      : Promise.resolve();
    del.then(() => this.signOut());
  },
  // the choice when the account keeps another career: take the cloud's here, or send this one up over it
  takeRemote() {
    if (!this.remote || !this.user) return;
    Career.adopt(this.remote.data);
    this.remote = null;
    this.linkedTo = this.user.id;
    this.setStatus('synced', true);
  },
  keepLocal() {
    if (!this.remote || !this.user) return;
    this.remote = null;
    this.linkedTo = this.user.id;
    this.push();
  }
};
