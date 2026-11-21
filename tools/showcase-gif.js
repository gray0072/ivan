#!/usr/bin/env node
'use strict';

// Joins screenshots into an animated GIF for a README (a game's docs/showcase.gif, the gallery's
// assets/showcase.gif): every slide is fitted to the size (cropped to its aspect, centred), held,
// then cross-faded into the next one, and the last back into the first. Plain Node, no packages:
// its own PNG reader, median-cut palette per frame, Floyd–Steinberg dithering and LZW writer.
//
// Usage: node tools/showcase-gif.js <out.gif> <slide.png>... [options]
//   --size WxH   the GIF's size (default 800x450, as World Aviation's)
//   --hold MS    how long each slide stays (default 2400)
//   --fade N     frames of the cross-fade between two slides, 90 ms each (default 3; 0 = a cut)
//   --top        crop from the top instead of the centre (keeps a HUD that runs along the top)
//   --no-dither  flat colours: a smaller file, banding on gradients
// Screenshots come from tools/cdp.js (docs/testing.md); keep them in English, about 6–10 slides.

const fs = require('fs'), path = require('path'), zlib = require('zlib');

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return false; args.splice(i, 1); return true; };
const opt = (name, def) => { const i = args.indexOf(name); if (i < 0) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const [W, H] = opt('--size', '800x450').split('x').map(Number);
const HOLD = Math.round(+opt('--hold', 2400) / 10);
const FADE = +opt('--fade', 3);
const TOP = flag('--top');
const DITHER = !flag('--no-dither');
if (args.length < 2) { console.error('usage: node tools/showcase-gif.js <out.gif> <slide.png>... [--size WxH] [--hold MS] [--fade N] [--top] [--no-dither]'); process.exit(2); }
const [outFile, ...inputs] = args;

// ---- PNG reader: 8-bit grey / RGB / palette / grey+alpha / RGBA, not interlaced ----
function readPng(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(file + ': not a PNG');
  let p = 8, w, h, depth, type, inter, plte = null, trns = null; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), kind = b.toString('latin1', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (kind === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; inter = d[12]; }
    else if (kind === 'PLTE') plte = d;
    else if (kind === 'tRNS') trns = d;
    else if (kind === 'IDAT') idat.push(d);
    else if (kind === 'IEND') break;
    p += 12 + len;
  }
  if (depth !== 8 || inter) throw new Error(file + ': only 8-bit, non-interlaced PNGs');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch;
  const px = Buffer.alloc(stride * h), rgb = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[row + x - ch] : 0, up = y ? px[row - stride + x] : 0, c = y && x >= ch ? px[row - stride + x - ch] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const q = a + up - c, pa = Math.abs(q - a), pb = Math.abs(q - up), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      px[row + x] = v;
    }
  }
  for (let i = 0; i < w * h; i++) {     // alpha is laid on black, like the page behind it
    let r, g, bl, al = 255;
    if (type === 3) { const k = px[i]; r = plte[k * 3]; g = plte[k * 3 + 1]; bl = plte[k * 3 + 2]; if (trns && k < trns.length) al = trns[k]; }
    else if (ch <= 2) { r = g = bl = px[i * ch]; if (ch === 2) al = px[i * 2 + 1]; }
    else { r = px[i * ch]; g = px[i * ch + 1]; bl = px[i * ch + 2]; if (ch === 4) al = px[i * 4 + 3]; }
    rgb[i * 3] = r * al / 255; rgb[i * 3 + 1] = g * al / 255; rgb[i * 3 + 2] = bl * al / 255;
  }
  return { w, h, rgb };
}

// ---- fit: crop to the GIF's aspect, then average the source pixels under each output pixel ----
function fit({ w, h, rgb }) {
  let cw = w, ch = Math.round(w * H / W);
  if (ch > h) { ch = h; cw = Math.round(h * W / H); }
  const ox = (w - cw) >> 1, oy = TOP ? 0 : (h - ch) >> 1, out = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) {
    const y0 = oy + Math.floor(y * ch / H), y1 = Math.max(y0 + 1, oy + Math.floor((y + 1) * ch / H));
    for (let x = 0; x < W; x++) {
      const x0 = ox + Math.floor(x * cw / W), x1 = Math.max(x0 + 1, ox + Math.floor((x + 1) * cw / W));
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const i = (yy * w + xx) * 3; r += rgb[i]; g += rgb[i + 1]; b += rgb[i + 2]; n++; }
      const o = (y * W + x) * 3; out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n;
    }
  }
  return out;
}

// ---- median-cut palette of 256 colours over a 5-bit-per-channel histogram ----
function palette(img) {
  const hist = new Uint32Array(32768);
  for (let i = 0; i < img.length; i += 3) hist[((img[i] >> 3) << 10) | ((img[i + 1] >> 3) << 5) | (img[i + 2] >> 3)]++;
  const cols = []; for (let k = 0; k < 32768; k++) if (hist[k]) cols.push(k);
  const comp = (k, c) => c === 0 ? k >> 10 : c === 1 ? (k >> 5) & 31 : k & 31;
  const box = (list) => {
    let lo = [31, 31, 31], hi = [0, 0, 0], n = 0;
    for (const k of list) { n += hist[k]; for (let c = 0; c < 3; c++) { const v = comp(k, c); if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v; } }
    const span = [0, 1, 2].map((c) => (hi[c] - lo[c]) * (c === 1 ? 1.2 : 1));
    return { list, n, axis: span.indexOf(Math.max(...span)), score: Math.max(...span) * Math.sqrt(n) };
  };
  const boxes = [box(cols)];
  while (boxes.length < 256) {
    let bi = -1, best = 0;
    boxes.forEach((bx, i) => { if (bx.list.length > 1 && bx.score > best) { best = bx.score; bi = i; } });
    if (bi < 0) break;
    const { list, n, axis } = boxes[bi];
    list.sort((a, b) => comp(a, axis) - comp(b, axis));
    let acc = 0, cut = 1;
    for (let i = 0; i < list.length - 1; i++) { acc += hist[list[i]]; if (acc >= n / 2) { cut = i + 1; break; } }
    boxes.splice(bi, 1, box(list.slice(0, cut)), box(list.slice(cut)));
  }
  const pal = new Uint8Array(768);
  boxes.forEach((bx, i) => {
    let r = 0, g = 0, b = 0;
    for (const k of bx.list) { const m = hist[k]; r += comp(k, 0) * m; g += comp(k, 1) * m; b += comp(k, 2) * m; }
    pal[i * 3] = Math.round(r / bx.n * 8.226); pal[i * 3 + 1] = Math.round(g / bx.n * 8.226); pal[i * 3 + 2] = Math.round(b / bx.n * 8.226);
  });
  return pal;
}

// ---- map to the palette (nearest colour, cached per 5-bit cell), optionally dithered ----
function indexed(img, pal) {
  const cache = new Int16Array(32768).fill(-1), out = new Uint8Array(W * H), work = DITHER ? Float32Array.from(img) : img;
  const near = (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    if (cache[k] >= 0) return cache[k];
    let bi = 0, bd = Infinity;
    for (let i = 0; i < 256; i++) { const dr = pal[i * 3] - r, dg = pal[i * 3 + 1] - g, db = pal[i * 3 + 2] - b, d = 2 * dr * dr + 4 * dg * dg + 3 * db * db; if (d < bd) { bd = d; bi = i; } }
    return (cache[k] = bi);
  };
  const clamp = (v) => v < 0 ? 0 : v > 255 ? 255 : v;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, o = i * 3, r = clamp(work[o]), g = clamp(work[o + 1]), b = clamp(work[o + 2]), k = near(r | 0, g | 0, b | 0);
    out[i] = k;
    if (!DITHER) continue;
    const er = r - pal[k * 3], eg = g - pal[k * 3 + 1], eb = b - pal[k * 3 + 2];
    const add = (dx, dy, f) => { const xx = x + dx, yy = y + dy; if (xx < 0 || xx >= W || yy >= H) return; const q = (yy * W + xx) * 3; work[q] += er * f; work[q + 1] += eg * f; work[q + 2] += eb * f; };
    add(1, 0, 7 / 16); add(-1, 1, 3 / 16); add(0, 1, 5 / 16); add(1, 1, 1 / 16);
  }
  return out;
}

// ---- GIF LZW (8-bit codes) ----
function lzw(data) {
  const bytes = []; let cur = 0, bits = 0, size = 9, next = 258, dict = new Map();
  const put = (code) => { cur |= code << bits; bits += size; while (bits >= 8) { bytes.push(cur & 255); cur >>>= 8; bits -= 8; } };
  put(256);
  let w = data[0];
  for (let i = 1; i < data.length; i++) {
    const c = data[i], key = w * 256 + c, hit = dict.get(key);
    if (hit !== undefined) { w = hit; continue; }
    put(w);
    if (next < 4096) { dict.set(key, next++); if (next > (1 << size) && size < 12) size++; }
    else { put(256); dict = new Map(); next = 258; size = 9; }
    w = c;
  }
  put(w); put(257);
  if (bits) bytes.push(cur & 255);
  const out = [];
  for (let i = 0; i < bytes.length; i += 255) { const part = bytes.slice(i, i + 255); out.push(part.length, ...part); }
  out.push(0);
  return Buffer.from(out);
}

function frame(img, delay) {
  const pal = palette(img), idx = indexed(img, pal), hdr = Buffer.alloc(8 + 10);
  hdr.set([0x21, 0xf9, 4, 0, delay & 255, delay >> 8, 0, 0], 0);
  hdr[8] = 0x2c; hdr.writeUInt16LE(0, 9); hdr.writeUInt16LE(0, 11); hdr.writeUInt16LE(W, 13); hdr.writeUInt16LE(H, 15); hdr[17] = 0x87;
  return Buffer.concat([hdr, Buffer.from(pal), Buffer.from([8]), lzw(idx)]);
}

const slides = inputs.map((f) => fit(readPng(f)));
const head = Buffer.alloc(13); head.write('GIF89a', 0, 'latin1'); head.writeUInt16LE(W, 6); head.writeUInt16LE(H, 8);
const parts = [head, Buffer.from([0x21, 0xff, 11, ...Buffer.from('NETSCAPE2.0', 'latin1'), 3, 1, 0, 0, 0])];
slides.forEach((s, i) => {
  parts.push(frame(s, HOLD));
  const t = slides[(i + 1) % slides.length];
  for (let k = 1; k <= FADE; k++) {
    const a = k / (FADE + 1), mix = new Float32Array(s.length);
    for (let j = 0; j < s.length; j++) mix[j] = s[j] * (1 - a) + t[j] * a;
    parts.push(frame(mix, 9));
  }
  process.stdout.write('.');
});
parts.push(Buffer.from([0x3b]));
fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, Buffer.concat(parts));
console.log(`\n${outFile}: ${slides.length} slides, ${W}×${H}, ${(fs.statSync(outFile).size / 1048576).toFixed(1)} MB`);
