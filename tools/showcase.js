#!/usr/bin/env node
'use strict';

// Remakes a game's showcase GIF (docs/showcase.gif) from its slides: <folder>/tools/showcase-slides.js lists
// them, each a function that puts the game into one moment. Every slide is taken in its own short headless
// Chrome run (tools/cdp.js, a clean profile each time), then tools/showcase-gif.js joins them in order.
//
// Usage: node --experimental-websocket tools/showcase.js <folder> [slide ...] [--out DIR] [--no-gif] [--list]
//   slide     take only these slides (by name) and keep the others' last shots from DIR; default: all
//   --out     where the PNGs go (default: showcase/<folder> in the system temp folder) — look at each one
//   --no-gif  take the shots only
//   --list    print the slides' names
//
// A slides file:
//   module.exports = {
//     viewport: [1280, 720],          // desktop(w, h); 1280 × 720 fits the GIF's 800 × 450 uncropped
//     gif: ['--no-dither'],           // extra options for tools/showcase-gif.js
//     limit: 150,                     // seconds for one slide's browser run (tools/cdp.js --limit)
//     slides: [
//       { name: '01-home', take: async (h) => { await h.page('my-game'); await h.ev(`…`); await h.sleep(1000); } },
//     ],
//   };
// take(h) gets the tools/cdp.js helpers (page, ev, sleep, click, key, log, shot …) with the viewport already
// set; when it returns, the slide is shot as <name>.png. Keep a slide in English and free of cheat banners.

const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const slidesOf = (folder) => require(path.join(repo, folder, 'tools', 'showcase-slides.js'));

// ---- inside tools/cdp.js: take one slide ----
if (require.main !== module) {
  module.exports = async (h) => {
    const def = slidesOf(process.env.SHOWCASE_FOLDER);
    const slide = def.slides.find((s) => s.name === process.env.SHOWCASE_SLIDE);
    await h.desktop(...(def.viewport || [1280, 720]));
    await slide.take(h);
    h.log('shot', await h.shot(slide.name));
  };
  return;
}

// ---- the command ----
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return false; args.splice(i, 1); return true; };
const opt = (name, def) => { const i = args.indexOf(name); if (i < 0) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const noGif = flag('--no-gif'), list = flag('--list');
const outOpt = opt('--out', null);
const [folder, ...only] = args;
if (!folder) { console.error('usage: node --experimental-websocket tools/showcase.js <folder> [slide ...] [--out DIR] [--no-gif] [--list]'); process.exit(2); }
const def = slidesOf(folder);
if (list) { console.log(def.slides.map((s) => s.name).join('\n')); process.exit(0); }
const unknown = only.filter((n) => !def.slides.some((s) => s.name === n));
if (unknown.length) { console.error('no such slide: ' + unknown.join(', ')); process.exit(2); }
const out = path.resolve(outOpt || path.join(os.tmpdir(), 'showcase', folder));
fs.mkdirSync(out, { recursive: true });

let failed = 0;
for (const s of def.slides) {
  if (only.length && !only.includes(s.name)) continue;
  console.log(`--- ${s.name}`);
  const r = spawnSync(process.execPath, ['--experimental-websocket', path.join(__dirname, 'cdp.js'), __filename, out, '--limit', String(def.limit || 150)],
    { stdio: 'inherit', env: { ...process.env, SHOWCASE_FOLDER: folder, SHOWCASE_SLIDE: s.name } });
  if (r.status) { failed++; console.log(`${s.name}: FAILED`); }
}

const pngs = def.slides.map((s) => path.join(out, s.name + '.png'));
const missing = pngs.filter((f) => !fs.existsSync(f));
if (noGif || failed || missing.length) {
  if (missing.length) console.log('missing: ' + missing.map((f) => path.basename(f)).join(', '));
  console.log(`shots in ${out}${noGif ? '' : ' — no GIF made'}`);
  process.exit(failed || missing.length ? 1 : 0);
}
const gif = path.join(repo, folder, 'docs', 'showcase.gif');
const r = spawnSync(process.execPath, [path.join(__dirname, 'showcase-gif.js'), gif, ...pngs, ...(def.gif || [])], { stdio: 'inherit' });
console.log(`shots in ${out}`);
process.exit(r.status || 0);
