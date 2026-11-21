#!/usr/bin/env node
'use strict';

// Writes the games table of the three root READMEs (README.md, README_RU.md, README_SV.md) from
// the gallery: the cards of index.html (order, folder, name, data-tags) and their texts in
// assets/gallery-lang.js (description, tags, alt text), the release date of <time datetime>. A game
// with a docs/showcase.gif shows it, the others their screenshot.png. Also checks the gallery's own
// rules: a description of at most 50 words in every language, at most four tags per game, every tag
// labelled in every language, a release date on every card and the cards from newest to oldest.
// Run it after changing a card, a description or a tag, before committing.
//
// Usage: node tools/readme-games.js [--check]
//   --check  changes nothing; fails if a README's table is out of date or a rule is broken

const fs = require('fs'), path = require('path'), vm = require('vm');

const repo = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');
const MAX_WORDS = 50, MAX_TAGS = 4;
const SITE = 'https://gray0072.github.io/ivan/';
const READMES = {
  en: { file: 'README.md', play: 'Play', source: 'Source' },
  ru: { file: 'README_RU.md', play: 'Играть', source: 'Исходники' },
  sv: { file: 'README_SV.md', play: 'Spela', source: 'Källkod' },
};

const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(repo, 'assets/gallery-lang.js'), 'utf8') + '\nthis.L = GALLERY_LANG;', ctx);
const LANG = ctx.L;
const page = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');

const games = [...page.matchAll(/<a class="card" href="([a-z0-9-]+)\/" data-tags="([^"]*)">([\s\S]*?)<\/a>/g)].map(([, folder, tags, body]) => ({
  folder,
  tags: tags.split(/\s+/).filter(Boolean),
  name: body.match(/<h2>[\s\S]*?alt="">([^<]+)<\/h2>/)[1].trim(),
  key: body.match(/data-i18n="(\w+)Desc"/)[1],
  released: (body.match(/<time class="released" datetime="(\d{4}-\d\d-\d\d)">/) || [])[1],
  gif: fs.existsSync(path.join(repo, folder, 'docs/showcase.gif')),
}));

const problems = [];
const words = (s) => s.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
games.forEach((g, i) => {
  const above = games[i - 1];
  if (!g.released) problems.push(`${g.folder}: no release date (<time class="released" datetime="YYYY-MM-DD">)`);
  else if (above && above.released && above.released < g.released)
    problems.push(`${g.folder}: released ${g.released}, after ${above.folder} above it (the cards go from newest to oldest)`);
});
for (const g of games) {
  if (g.tags.length < 1 || g.tags.length > MAX_TAGS) problems.push(`${g.folder}: ${g.tags.length} tags (1–${MAX_TAGS})`);
  for (const [lang, t] of Object.entries(LANG)) {
    const desc = t[g.key + 'Desc'];
    if (!desc) { problems.push(`${g.folder}: no ${g.key}Desc in ${lang}`); continue; }
    if (words(desc) > MAX_WORDS) problems.push(`${g.folder}: the ${lang} description has ${words(desc)} words (at most ${MAX_WORDS})`);
    for (const tag of g.tags) if (!t.tags[tag]) problems.push(`${g.folder}: the tag "${tag}" has no ${lang} label`);
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function cell(g, lang) {
  const t = LANG[lang], r = READMES[lang], url = SITE + g.folder + '/';
  const img = g.gif ? `${g.folder}/docs/showcase.gif` : `${g.folder}/screenshot.png`;
  return `    <td width="50%" valign="top">
      <a href="${url}"><img src="${img}" alt="${esc(t[g.key + 'Alt'])}"></a>
      <h3><img src="${g.folder}/icon.svg" alt="" width="28" height="28" align="center"> ${g.name}</h3>
      <p>${esc(t[g.key + 'Desc'])}</p>
      <p>${g.tags.map(tag => `<code>${esc(t.tags[tag])}</code>`).join(' ')}</p>
      <p><a href="${url}"><b>▶ ${r.play}</b></a> · <a href="${g.folder}/">${r.source}</a>${g.released ? ` · <sub>${g.released}</sub>` : ''}</p>
    </td>`;
}
function table(lang) {
  const rows = [];
  for (let i = 0; i < games.length; i += 2) {
    const right = games[i + 1] ? cell(games[i + 1], lang) : '    <td width="50%" valign="top"></td>';
    rows.push(`  <tr>\n${cell(games[i], lang)}\n${right}\n  </tr>`);
  }
  return `<table>\n${rows.join('\n')}\n</table>`;
}

let stale = 0;
for (const [lang, r] of Object.entries(READMES)) {
  const file = path.join(repo, r.file);
  const old = fs.readFileSync(file, 'utf8');
  const next = old.replace(/<table>[\s\S]*?<\/table>/, table(lang));
  if (next === old) continue;
  stale++;
  if (check) console.log(`${r.file}: the games table is out of date`);
  else { fs.writeFileSync(file, next); console.log(`${r.file}: games table written`); }
}
for (const p of problems) console.log('rule: ' + p);
if (problems.length || (check && stale)) process.exit(1);
