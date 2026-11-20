#!/usr/bin/env node
'use strict';

// Lift Logic — every text the player sees, also those tools/i18n-check.js can't find: the texts that reach
// tr() through a variable (blocks, missions, people, buildings, the Museum, the jokes, the star and Inspector
// texts, the VM's messages) and the static ones of index.html (data-i18n, data-i18n-title). Checks that
// data/lang-ru.js and data/lang-sv.js have each one, that a translation keeps the {params} and the %1 slots,
// and lists the keys no longer used.
//
// Usage: node lift-logic/tools/texts-check.js          report, exit 1 when something is missing
//        node lift-logic/tools/texts-check.js --json   print every text as a JSON list

const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const ctx = {};
vm.createContext(ctx);
const load = (f) => vm.runInContext(read(f), ctx, { filename: f });
['constants.js', 'data/blocks.js', 'data/lifts.js', 'data/people.js', 'data/buildings.js', 'data/missions/missions.js'].forEach(load);
for (const id of vm.runInContext('BUILDINGS.map((b) => b.id)', ctx)) if (fs.existsSync(path.join(root, 'data/missions', id + '.js'))) load('data/missions/' + id + '.js');
['data/facts.js', 'data/jokes.js'].forEach(load);

const keys = new Map();
const add = (k, where) => { if (typeof k === 'string' && k.trim() && !keys.has(k)) keys.set(k, where); };

// the data tables
const data = vm.runInContext(`({ CATEGORIES, DROPDOWNS, PARAM_NAMES, BLOCKS, PEOPLE, BUILDINGS, MISSIONS, FACTS, CONCEPTS, JOKES, MOMENTS, BUILDING_LINES, HEADLINES })`, ctx);
for (const c of data.CATEGORIES) add(c.name, 'blocks: category');
for (const k in data.DROPDOWNS) for (const v of data.DROPDOWNS[k]) add(v, 'blocks: dropdown');
for (const k in data.PARAM_NAMES) add(data.PARAM_NAMES[k], 'blocks: input');
add('stopped', 'sensing: my direction');
for (const b of data.BLOCKS) { if (!b.hidden) add(b.text, 'block ' + b.op); if (b.text2) add(b.text2, 'block ' + b.op); }
for (const k in data.PEOPLE) for (const f of ['line', 'happy', 'angry']) add(data.PEOPLE[k][f], 'people: ' + k);
for (const b of data.BUILDINGS) {
  add(b.name, 'building ' + b.id); add(b.idea, 'building ' + b.id); add(b.paper, 'building ' + b.id);
  if (b.client) add(b.client.line, 'building ' + b.id);
  for (const r of Object.values(b.rooms || {})) add(r, 'building ' + b.id + ': room');
}
for (const m of data.MISSIONS) {
  const w = 'mission ' + m.id;
  add(m.name, w); add(m.goal, w);
  (m.brief || []).forEach((l) => add(l, w)); (m.hints || []).forEach((l) => add(l, w));
  for (const c of m.stars) for (const t of (Array.isArray(c) ? c : [c])) if (t.text) add(t.text, w + ': star');
}
for (const k in data.FACTS) { add(data.FACTS[k].title, 'fact ' + k); add(data.FACTS[k].text, 'fact ' + k); }
for (const k in data.CONCEPTS) for (const f of ['title', 'text', 'like']) add(data.CONCEPTS[k][f], 'concept ' + k);
for (const group of [data.JOKES, data.MOMENTS, data.BUILDING_LINES]) for (const k in group) for (const l of group[k]) add(l[1], 'jokes: ' + k);
for (const h of data.HEADLINES) add(h, 'jokes: headline');

// texts in the code that go through a variable: the star labels, the Inspector, the VM's messages, the screens' tables
for (const [file, re] of [
  ['sim/stats.js', /(?:key|text): (?:c\.n \? )?'((?:\\'|[^'])*)'(?: : '((?:\\'|[^'])*)')?/g],
  ['sim/inspector.js', /(?:key|tip): (?:n \? )?'((?:\\'|[^'])*)'(?: : '((?:\\'|[^'])*)')?/g],
  ['sim/vm.js', /fail\((?:th|null), \w+, '((?:\\'|[^'])*)'/g],
  ['ui/screens.js', /\b(?:easy|medium|hard|build|fill|fix|tiny|beat|exam): '((?:\\'|[^'])*)'/g]]) {
  const src = read(file); let m;
  while ((m = re.exec(src))) { add(m[1].replace(/\\'/g, "'"), file); if (m[2]) add(m[2].replace(/\\'/g, "'"), file); }
}
// the literal texts given to tr in every JS file
(function walk(dir) {
  for (const f of fs.readdirSync(path.join(root, dir))) {
    const p = path.join(dir, f);
    if (fs.statSync(path.join(root, p)).isDirectory()) { if (f !== 'tools' && f !== 'lib') walk(p); continue; }
    if (!f.endsWith('.js') || /^lang-/.test(f) || f === 'icons.js') continue;
    const src = read(p);
    const re = /\btr\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
    let m;
    while ((m = re.exec(src))) { if (m[1] === '`' && m[2].includes('${')) continue; add(vm.runInNewContext(m[1] + m[2] + m[1]), p); }
  }
})('.');
// index.html
{
  const html = read('index.html');
  let m;
  const re = /<(\w+)[^>]*\sdata-i18n(?:=""|)(?=[\s>])[^>]*>([\s\S]*?)<\/\1>/g;
  while ((m = re.exec(html))) add(m[2].trim(), 'index.html');
  const re2 = /data-i18n-title="([^"]*)"/g;
  while ((m = re2.exec(html))) add(m[1], 'index.html: title');
}

if (process.argv.includes('--json')) { console.log(JSON.stringify([...keys.keys()], null, 1)); process.exit(0); }

// the tables
const tables = {};
for (const l of ['ru', 'sv']) {
  const c = {};
  vm.createContext(c);
  vm.runInContext(read('data/lang-' + l + '.js') + `;this.__t = TEXT_${l.toUpperCase()};`, c);
  tables[l] = c.__t;
}
let bad = 0;
const marks = (s) => (s.match(/\{\w+\}|%\d/g) || []).sort().join(' ');
for (const [k, where] of keys) for (const l of Object.keys(tables)) {
  const t = tables[l];
  if (!Object.prototype.hasOwnProperty.call(t, k)) { bad++; console.log(`missing in ${l}: ${JSON.stringify(k)}  (${where})`); continue; }
  if (marks(t[k]) !== marks(k)) { bad++; console.log(`${l}: the {params} / %slots differ: ${JSON.stringify(k)} → ${JSON.stringify(t[k])}`); }
}
for (const l of Object.keys(tables)) for (const k in tables[l]) if (!keys.has(k)) console.log(`${l}: not used any more: ${JSON.stringify(k)}`);
console.log(`${keys.size} texts; ${bad ? bad + ' problems' : 'all translated'}`);
process.exit(bad ? 1 : 0);
