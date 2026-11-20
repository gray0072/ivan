#!/usr/bin/env node
'use strict';

// Writes the offline service worker (sw.js) of every app — each game's folder and the root
// gallery — from tools/sw-template.js: the list of files the app needs at run time and a VERSION
// hashed from their contents, so any change to the app makes the browser install the new worker.
// Run it after every change to an app's files (before committing, like icons-build.js).
//
// Usage: node tools/sw-build.js [folder ...] [--check]
//   folder   a game's folder, or . for the root gallery (default: every app)
//   --check  changes nothing; lists the sw.js files that are out of date and fails if any is
//
// What goes into the list:
//   - a game: every file of its folder except the docs and the developer files (EXCLUDE below);
//   - the gallery: index.html, manifest.webmanifest, assets/ (except the README-only images) and
//     the games' icons and screenshots its cards show;
//   - a file the page or the manifest links with ?v=N is listed with that ?v=N, so the offline
//     copy is exactly the version the page asks for.

const fs = require('fs'), path = require('path'), crypto = require('crypto');

const repo = path.resolve(__dirname, '..');
const TEMPLATE = path.join(__dirname, 'sw-template.js');
// Never needed by a running app (paths relative to the app's folder)
const EXCLUDE = [/\.md$/i, /^tools\//, /^docs\//, /^supabase\//, /\.(sql|sh)$/, /^screenshot\.png$/,
  /^icon-maskable\.svg$/, /^sw\.js$/, /(^|\/)\./, /(^|\/)(Thumbs\.db|node_modules)(\/|$)/];
// The gallery's own: only for the READMEs and link previews
const GALLERY_EXCLUDE = [/^assets\/(showcase\.gif|social-preview\.png|icon-maskable\.svg)$/];

const args = process.argv.slice(2);
const check = args.includes('--check');
let folders = args.filter(a => a !== '--check').map(a => a.replace(/[\\/]+$/, '') || '.');
if (!folders.length) {
  folders = fs.readdirSync(repo, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(repo, d.name, 'manifest.webmanifest')))
    .map(d => d.name).concat('.');
}

function walk(dir, rel = '') {
  const out = [];
  for (const d of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const p = rel ? rel + '/' + d.name : d.name;
    if (d.isDirectory()) out.push(...walk(dir, p));
    else out.push(p);
  }
  return out;
}

// Local files the page and its manifest link, with their query strings
function links(dir) {
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const found = [...html.matchAll(/\s(?:src|href)="([^"#]+)"/g)].map(m => m[1]);
  const manifest = path.join(dir, 'manifest.webmanifest');
  if (fs.existsSync(manifest)) {
    for (const icon of JSON.parse(fs.readFileSync(manifest, 'utf8')).icons || []) found.push(icon.src);
  }
  return found.filter(u => !/^[a-z]+:|^\/\//i.test(u) && !u.endsWith('/'));
}

function build(folder) {
  const dir = path.join(repo, folder);
  const gallery = folder === '.';
  const bare = p => p.replace(/\?.*$/, '');
  let files = gallery
    ? ['index.html', 'manifest.webmanifest', ...walk(dir, 'assets')]
    : walk(dir);
  files = files.filter(f => !EXCLUDE.some(r => r.test(f)) && !(gallery && GALLERY_EXCLUDE.some(r => r.test(f))));
  const linked = links(dir);
  for (const l of linked) {
    if (!fs.existsSync(path.join(dir, bare(l)))) throw new Error(`${folder}/index.html links a missing file: ${l}`);
  }
  // the page links them with ?v=N: list that address instead of the bare one
  const byBare = new Map(files.map(f => [f, [f]]));
  for (const l of linked) {
    const b = bare(l);
    if (!byBare.has(b) || byBare.get(b)[0] === b) byBare.set(b, []);
    if (!byBare.get(b).includes(l)) byBare.get(b).push(l);
  }
  for (const [b, list] of byBare) if (!list.length) list.push(b);
  const entries = ['./', ...[...byBare.entries()].filter(([b]) => b !== 'index.html')
    .sort(([a], [b]) => a.localeCompare(b)).flatMap(([, list]) => list)];

  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const hash = crypto.createHash('sha1').update(template);
  for (const b of ['index.html', ...[...byBare.keys()].filter(b => b !== 'index.html').sort()]) {
    hash.update('\0' + b + '\0').update(fs.readFileSync(path.join(dir, b)));
  }
  const version = hash.digest('hex').slice(0, 12);
  const list = '[\n' + entries.map(e => '  ' + JSON.stringify(e) + ',').join('\n') + '\n]';
  const bytes = [...byBare.keys()].reduce((s, b) => s + fs.statSync(path.join(dir, b)).size, 0);
  return {
    text: template.replace("'__VERSION__'", JSON.stringify(version)).replace('__FILES__', list)
      .replace('__OWN_ALL__', String(!gallery)),
    count: entries.length, bytes,
  };
}

let stale = 0;
for (const folder of folders) {
  const { text, count, bytes } = build(folder);
  const file = path.join(repo, folder, 'sw.js');
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const name = path.relative(repo, file).replace(/\\/g, '/');
  const size = `${count} files, ${(bytes / 1048576).toFixed(1)} MB`;
  if (old === text) { console.log(`${name}: up to date (${size})`); continue; }
  stale++;
  if (check) console.log(`${name}: OUT OF DATE — run node tools/sw-build.js ${folder}`);
  else { fs.writeFileSync(file, text); console.log(`${name}: written (${size})`); }
}
if (check && stale) process.exit(1);
