'use strict';

// Wiggle Wars — the four kinds of land from a seed (the same seed gives the same map): Hills,
// Islands, Cavern, Canyon. Each is a rule "is (x, y) solid" built from column heights and smooth
// noise, written into the Terrain bitmap; crumbs of land too small to matter are removed. Then
// the places for worms, mines, barrels, targets and the golden crate. Used by sim/match.js and
// the setup's preview.

const MapGen = (() => {
  const W = WORLD_W, H = WORLD_H;
  const CELL = 4; // the coarse grid of the 2D noise fields

  // a 2D noise field on a coarse grid, read back smoothly with field.at(x, y)
  function field(seed, scale) {
    const gw = Math.ceil(W / CELL) + 2, gh = Math.ceil(H / CELL) + 2;
    const g = new Float32Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) g[j * gw + i] = noise2(seed, i * CELL, j * CELL, scale) * 0.7 + noise2(seed + 7, i * CELL, j * CELL, scale / 2.3) * 0.3;
    return {
      at(x, y) {
        const fx = x / CELL, fy = y / CELL, i = fx | 0, j = fy | 0, tx = fx - i, ty = fy - j;
        const k = j * gw + i;
        return (g[k] * (1 - tx) + g[k + 1] * tx) * (1 - ty) + (g[k + gw] * (1 - tx) + g[k + gw + 1] * tx) * ty;
      }
    };
  }
  function table(rnd, n = 64) { return Array.from({ length: n }, () => rnd()); }
  // extra height near the world's sides, so the land falls into the water there
  function edgeDrop(x, width = 230, depth = 2.6) {
    const e = Math.min(x, W - x);
    return e < width ? (width - e) * (width - e) / width * depth : 0;
  }

  function hills(rnd, seed) {
    const t1 = table(rnd), t2 = table(rnd), t3 = table(rnd);
    const rough = field(seed + 1, 70), caves = field(seed + 2, 85);
    const base = H * (0.46 + rnd() * 0.08);
    const heights = new Float32Array(W);
    for (let x = 0; x < W; x++) {
      heights[x] = base + (noise1(t1, x, 300) - 0.5) * 420 + (noise1(t2, x, 110) - 0.5) * 120 + (noise1(t3, x, 37) - 0.5) * 22 + edgeDrop(x);
    }
    return (x, y) => {
      const h = heights[x] + (rough.at(x, y) - 0.5) * 80;
      if (y < h) return false;
      return !(y > heights[x] + 45 && caves.at(x, y) > 0.7);
    };
  }

  function islands(rnd, seed) {
    const n = 3 + (rnd() < 0.5 ? 1 : 0);
    const rough = field(seed + 1, 60), caves = field(seed + 2, 80);
    const t1 = table(rnd);
    const isl = [];
    const span = (W - 240) / n;
    for (let i = 0; i < n; i++) {
      isl.push({ c: 120 + span * (i + 0.5) + (rnd() - 0.5) * span * 0.2, w: span * (0.62 + rnd() * 0.2), top: H * (0.36 + rnd() * 0.24) });
    }
    const heights = new Float32Array(W);
    for (let x = 0; x < W; x++) {
      let h = H + 100;
      for (const s of isl) {
        const d = Math.abs(x - s.c) / (s.w / 2);
        if (d < 1.25) h = Math.min(h, s.top + Math.pow(d, 3.2) * 420 + (noise1(t1, x, 90) - 0.5) * 90);
      }
      heights[x] = h;
    }
    return (x, y) => {
      const h = heights[x] + (rough.at(x, y) - 0.5) * 70;
      if (y < h) return false;
      return !(y > heights[x] + 50 && caves.at(x, y) > 0.72);
    };
  }

  function cavern(rnd, seed) {
    const t1 = table(rnd), t2 = table(rnd), t3 = table(rnd);
    const rough = field(seed + 1, 60), rocks = field(seed + 3, 75);
    const ceil = new Float32Array(W), floor = new Float32Array(W);
    const holes = [];
    for (let i = 0, k = 2 + Math.floor(rnd() * 2); i < k; i++) holes.push({ c: 300 + rnd() * (W - 600), w: 70 + rnd() * 90 });
    const pool = { c: 500 + rnd() * (W - 1000), w: 160 + rnd() * 120 };
    for (let x = 0; x < W; x++) {
      let c = H * 0.2 + (noise1(t1, x, 220) - 0.5) * 170 + (noise1(t3, x, 60) - 0.5) * 40;
      for (const h of holes) { const d = Math.abs(x - h.c) / h.w; if (d < 1) c -= (1 - d * d) * 400; }
      let f = H * 0.74 + (noise1(t2, x, 240) - 0.5) * 230 + (noise1(t3, x + 999, 70) - 0.5) * 50 + edgeDrop(x, 200, 2.4);
      const pd = Math.abs(x - pool.c) / pool.w;
      if (pd < 1) f += (1 - pd * pd) * 260;
      ceil[x] = c; floor[x] = Math.max(f, c + 110);
    }
    return (x, y) => {
      const r = (rough.at(x, y) - 0.5) * 70;
      if (y < ceil[x] + r) return true;
      if (y > floor[x] + r) return true;
      return rocks.at(x, y) > 0.74;
    };
  }

  function canyon(rnd, seed) {
    const t1 = table(rnd), t2 = table(rnd);
    const rough = field(seed + 1, 55), caves = field(seed + 2, 80), rocks = field(seed + 4, 40);
    const leftTop = H * (0.28 + rnd() * 0.1), rightTop = H * (0.28 + rnd() * 0.1), bottom = H * (0.76 + rnd() * 0.06);
    const a = W * (0.28 + rnd() * 0.06), b = W * (0.66 + rnd() * 0.06);
    const heights = new Float32Array(W);
    const sig = (v) => 1 / (1 + Math.exp(-v));
    for (let x = 0; x < W; x++) {
      const toValley = sig((x - a) / 38) * (1 - sig((x - b) / 38));
      const top = x < W / 2 ? leftTop : rightTop;
      heights[x] = lerp(top, bottom, toValley) + (noise1(t1, x, 130) - 0.5) * 70 + (noise1(t2, x, 45) - 0.5) * 24 + edgeDrop(x, 200, 2.6);
    }
    const floaters = [];
    for (let i = 0, k = 2 + Math.floor(rnd() * 2); i < k; i++) {
      floaters.push({ x: a + 120 + (b - a - 240) * (i + 0.5) / k + (rnd() - 0.5) * 60, y: lerp(leftTop, bottom, 0.45 + rnd() * 0.25), rx: 55 + rnd() * 40, ry: 22 + rnd() * 14 });
    }
    return (x, y) => {
      for (const f of floaters) {
        const dx = (x - f.x) / f.rx, dy = (y - f.y) / f.ry;
        if (dx * dx + dy * dy < 0.6 + rocks.at(x, y) * 0.7) return true;
      }
      const h = heights[x] + (rough.at(x, y) - 0.5) * 75;
      if (y < h) return false;
      return !(y > heights[x] + 40 && caves.at(x, y) > 0.73);
    };
  }

  // remove bits of land smaller than `min` pixels (crumbs floating in the air)
  function removeCrumbs(bits, min = 500) {
    const seen = new Uint8Array(W * H);
    const stack = new Int32Array(W * H);
    for (let start = 0; start < W * H; start++) {
      if (!bits[start] || seen[start]) continue;
      let sp = 0, n = 0;
      const members = [];
      stack[sp++] = start; seen[start] = 1;
      while (sp) {
        const p = stack[--sp];
        n++;
        if (n <= min) members.push(p);
        const x = p % W;
        if (x > 0 && bits[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack[sp++] = p - 1; }
        if (x < W - 1 && bits[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack[sp++] = p + 1; }
        if (p >= W && bits[p - W] && !seen[p - W]) { seen[p - W] = 1; stack[sp++] = p - W; }
        if (p < W * (H - 1) && bits[p + W] && !seen[p + W]) { seen[p + W] = 1; stack[sp++] = p + W; }
      }
      if (n < min) for (const p of members) bits[p] = 0;
    }
  }

  const KINDS = { hills, islands, cavern, canyon };

  // fills the Terrain bitmap with a map of this kind (or `target`, a bitmap of its own, for a preview)
  function generate(kind, seed, target) {
    const rnd = seededRandom(seed);
    const rule = KINDS[kind](rnd, seed % 100000);
    const bits = target ? target.fill(0) : Terrain.reset();
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) if (rule(x, y)) bits[y * W + x] = 1;
    }
    removeCrumbs(bits);
    if (!target) GameEvents.emit('terrainNew', {});
    return bits;
  }

  // ---------- placing things ----------
  function far(p, list, gap) { return list.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= gap); }
  // a random spot at least `gap` from every point of `avoid`, relaxing the gap when none is left
  function pickSpot(spots, rnd, avoid, gap) {
    for (let g = gap; g >= 10; g *= 0.7) {
      const ok = spots.filter((s) => far(s, avoid, g));
      if (ok.length) return ok[Math.floor(rnd() * ok.length)];
    }
    return spots[Math.floor(rnd() * spots.length)];
  }

  return { generate, pickSpot, far };
})();
