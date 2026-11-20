'use strict';

// Test helpers for a game's cloud save (docs/cloud-save.md), used from a tools/cdp.js steps file: a static
// server for the repo over http (the cloud is off from file://), a fake Supabase session, and MOCK, a script
// to install with Page.addScriptToEvaluateOnNewDocument that answers the page's Supabase requests as
// localStorage.__mock says: offline | error | hang | ok (a tiny PostgREST over localStorage.__cloud).
// Every Supabase request is listed in window.__reqs ({ url, method, body, keepalive, t }).
//
//   const { serve, session, MOCK } = require('<repo>/tools/cloud-mock.js');
//   const srv = await serve(8765);                       // http://localhost:8765/ivan/<folder>/
//   const s = session(uid);                              // s.json: the value for the game's auth storage key
//   await send('Page.addScriptToEvaluateOnNewDocument', { source: MOCK });
//   ... srv.close();

const http = require('http'), fs = require('fs'), path = require('path');
const repo = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };

// the repo at http://localhost:<port>/ivan/ (as on GitHub Pages, so the games' absolute ids match)
function serve(port) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/ivan\//, '/');
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(repo, p);
    if (!f.startsWith(repo)) { res.writeHead(403); res.end(); return; }
    fs.readFile(f, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((r) => srv.listen(port, () => r(srv)));
}

// a session supabase-js accepts from storage without a network call (valid for a day); `json` is the stored value
function session(user, email) {
  email = email || 'test@example.com';
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 86400;
  const token = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: user, exp, role: 'authenticated', email, aud: 'authenticated' }) + '.c2ln';
  const s = { access_token: token, token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'refresh',
    user: { id: user, aud: 'authenticated', role: 'authenticated', email, user_metadata: {}, app_metadata: {} } };
  return { user, email, json: JSON.stringify(s) };
}

const MOCK = `(() => {
  window.__reqs = [];
  const real = window.fetch;
  const json = (b, status) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } });
  window.fetch = function (u, o) {
    const url = String((u && u.url) || u);
    const m = localStorage.getItem('__mock');
    if (!m || !url.includes('supabase.co')) return real.apply(this, arguments);
    o = o || {};
    const method = (o.method || 'GET').toUpperCase();
    window.__reqs.push({ url, method, body: typeof o.body === 'string' ? o.body : null, keepalive: !!o.keepalive, t: Date.now() });
    if (m === 'offline') return Promise.reject(new TypeError('Failed to fetch'));
    if (m === 'error') return Promise.resolve(json({ message: 'mock error', code: 'XX000' }, 500));
    if (m === 'hang') return new Promise((res, rej) => { if (o.signal) o.signal.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))); });
    // 'ok': rows in localStorage.__cloud; eq filters on any column; upsert by career_id, else user_id
    let store = JSON.parse(localStorage.getItem('__cloud') || '[]');
    const filters = [...new URL(url).searchParams].filter(([k, v]) => /^eq\\./.test(v)).map(([k, v]) => [k, v.slice(3)]);
    const match = (r) => filters.every(([k, v]) => String(r[k]) === v);
    const key = (r) => r.career_id !== undefined ? r.career_id : r.user_id;
    if (method === 'GET') {
      const rows = store.filter(match);
      const one = /vnd\\.pgrst\\.object/.test(new Headers(o.headers || {}).get('accept') || '');
      if (one) return Promise.resolve(rows.length ? json(rows[0], 200) : json({ code: 'PGRST116', message: 'no rows' }, 406));
      return Promise.resolve(json(rows, 200));
    }
    if (method === 'POST') {
      for (const r of [].concat(JSON.parse(o.body))) {
        const i = store.findIndex((x) => key(x) === key(r));
        if (i >= 0) store[i] = r; else store.push(r);
      }
      localStorage.setItem('__cloud', JSON.stringify(store));
      return Promise.resolve(new Response(null, { status: 201 }));
    }
    if (method === 'DELETE') {
      store = store.filter((r) => !match(r));
      localStorage.setItem('__cloud', JSON.stringify(store));
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return Promise.resolve(json({}, 200));
  };
})();`;

module.exports = { serve, session, MOCK };
