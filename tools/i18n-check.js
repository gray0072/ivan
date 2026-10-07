#!/usr/bin/env node
'use strict';

// Checks a translated game's texts: every literal tr('English text') in its JS must have an entry
// in each of its language tables (data/lang-<xx>.js, a `const TEXT_<XX> = { ... }`), and the tables
// must have the same keys. Texts passed to tr() through a variable (data tables) are not seen.
// Usage: node tools/i18n-check.js <folder>   — prints the missing keys, exits 1 if there are any.

const fs = require('fs'), path = require('path'), vm = require('vm');

const root = process.argv[2];
if (!root) { console.error('usage: node tools/i18n-check.js <folder>'); process.exit(2); }
const dataDir = path.join(root, 'data');
const langFiles = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).filter((f) => /^lang-\w+\.js$/.test(f)) : [];
if (!langFiles.length) { console.log('no data/lang-*.js in ' + root); process.exit(0); }

// the tables
const tables = {};
for (const f of langFiles) {
  const lang = f.slice(5, -3), name = 'TEXT_' + lang.toUpperCase();
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dataDir, f), 'utf8') + `;this.__t = typeof ${name} !== 'undefined' ? ${name} : null;`, ctx);
  if (!ctx.__t) { console.error(f + ': no ' + name); process.exit(2); }
  tables[lang] = ctx.__t;
}

// the literal tr('...') texts in the code (not in lib/, not in the tables themselves)
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { if (f !== 'lib' && f !== 'node_modules') walk(p); }
    else if (p.endsWith('.js') && !/^lang-\w+\.js$/.test(f)) files.push(p);
  }
})(root);
const keys = new Map();
const re = /\btr\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(src))) {
    if (m[1] === '`' && m[2].includes('${')) continue;
    const key = vm.runInNewContext(m[1] + m[2] + m[1]);
    if (!keys.has(key)) keys.set(key, path.relative(root, f) + ':' + src.slice(0, m.index).split('\n').length);
  }
}

let missing = 0;
for (const [key, where] of keys) {
  const langs = Object.keys(tables).filter((l) => !Object.prototype.hasOwnProperty.call(tables[l], key));
  if (langs.length) { missing++; console.log(`missing in ${langs.join(', ')}: ${JSON.stringify(key)}  (${where})`); }
}
const langs = Object.keys(tables);
for (const a of langs) for (const b of langs) {
  if (a === b) continue;
  for (const key in tables[a]) if (!Object.prototype.hasOwnProperty.call(tables[b], key)) { missing++; console.log(`in ${a}, not in ${b}: ${JSON.stringify(key)}`); }
}
console.log(`${keys.size} texts in the code, ${langs.join(' + ')}: ${missing ? missing + ' missing' : 'all translated'}`);
process.exit(missing ? 1 : 0);
