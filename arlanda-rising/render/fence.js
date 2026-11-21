'use strict';

// Arlanda Rising — the airside fence: worked out from what is built and drawn round it (thin posts and a mesh). The
// airside parts that stand (runways with their strips, taxiways, aprons, remote stands, de-icing pads, the fire station,
// the fuel yard)
// are laid on a grid with a margin each, the gaps between them up to 2 × CLOSE m wide are fenced in with them (a closing
// on the grid), then everything landside is cut away again — the belt east of the terminal line in data/layout.js
// (`fence.belt`), the roads, the railway, the car parks, Cargo City's yard, the ground in front of each terminal's
// landside face — except over the two taxiway bridges, where the fence follows the bridge. The outline is traced and
// straightened; where it runs along the wall of a building on the terminal line the wall is the fence and no fence is
// drawn. Worked out again only when the set of parts changes (`get` keeps the last one). Pure geometry in `parts` and
// `build` (also run in Node by tools/layout-check.js); `draw` and `near` (no trees on the fence) are used by
// render/map.js and render/ground.js.

const Fence = (() => {
  const CELL = 10;        // m: the grid the airside is worked out on
  const CLOSE = 250;      // m: gaps narrower than twice this between airside parts are fenced in with them
  const M = { rwy: 140, rwyEnd: 200, taxi: 40, apron: 20, pad: 15, svc: 15 };   // m: the margin round each kind of part
  const ROAD = 25, RAIL = 21, BOX = 10;   // m: kept clear of the fence round a road's line, the railway's, a landside plot
  const BRIDGE = 28;      // m: the fence over a taxiway bridge, each side of the taxiway's line
  const SHADOW = 120;     // m: the ground in front of a terminal's landside face (east) that stays outside
  const HIDE = 15;        // m: a fence this close to a building on the line is its wall
  const H = 3;            // m: the fence's height (a little over the real 2.4 m, to be seen)
  const POST = 14;        // m between posts

  const L = LAYOUT, RW = L.runway1;
  const RL = Math.hypot(RW.to[0] - RW.from[0], RW.to[1] - RW.from[1]);
  const DIR = [(RW.to[0] - RW.from[0]) / RL, (RW.to[1] - RW.from[1]) / RL], NRM = [DIR[1], -DIR[0]];
  const rp = (s, t) => [RW.from[0] + DIR[0] * RL * s + NRM[0] * t, RW.from[1] + DIR[1] * RL * s + NRM[1] * t];
  const rect = (a) => [a.x0, a.y0, a.x1, a.y1];
  function segDist(x, y, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2)) : 0;
    const ex = x - a[0] - dx * t, ey = y - a[1] - dy * t;
    return Math.sqrt(ex * ex + ey * ey);
  }
  function inPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const boxDist = (x, y, b) => { const ex = Math.max(b[0] - x, 0, x - b[2]), ey = Math.max(b[1] - y, 0, y - b[3]); return Math.sqrt(ex * ex + ey * ey); };

  // ---------- what is airside: { parts: [{ r: box } | { l: points, h: half width }], walls: [box] } ----------
  // on(name): whether that part stands (or is being built): runway1, apron1, apron2…apron7, cargoApron, satApron,
  // runway2, taxi2, runway3, taxi3, deice0, deice1, fireStation, h2depot, fuelYard, pierF, pier2040, pierArm and the keys of
  // LAYOUT.fence.line; pads: the remote stands' pads [box], ways: their paved ways to the apron [points];
  // design: the player's pier's ('satellite' puts it out on the apron)
  function parts(on, pads, ways, design) {
    const out = [], walls = [];
    const R = (b, m) => out.push({ r: [b[0] - m, b[1] - m, b[2] + m, b[3] + m] });
    const Ln = (pts, h) => out.push({ l: pts, h });
    const band = (from, to, half) => {
      const l = Math.hypot(to[0] - from[0], to[1] - from[1]), u = [(to[0] - from[0]) / l, (to[1] - from[1]) / l], e = M.rwyEnd;
      Ln([[from[0] - u[0] * e, from[1] - u[1] * e], [to[0] + u[0] * e, to[1] + u[1] * e]], half);
    };
    const tw = L.taxi.w / 2 + M.taxi;
    if (on('runway1')) {
      band(RW.from, RW.to, M.rwy);
      Ln([rp(0, L.taxi.offset), rp(1, L.taxi.offset)], tw);
      for (const s of L.taxi.links) Ln([rp(s, 0), rp(s, L.taxi.offset)], tw);
    }
    if (on('apron1')) {
      R(rect(L.apron1), M.apron);
      for (const k of [L.taxi.apronLink, L.taxi.apronOut]) Ln([rp(k.s, L.taxi.offset), k.to], tw);
    }
    for (const k of ['apron2', 'apron3', 'apron4', 'apron5', 'apron6', 'apron7', 'cargoApron']) if (on(k)) R(rect(L[k]), M.apron);
    if (on('satApron')) R(L.pier2040.satApron, M.apron);
    if (on('runway2')) band(L.runway2.from, L.runway2.to, M.rwy);
    if (on('taxi2')) Ln(L.taxi2.slice(0, on('runway2') ? L.taxi2.length : 2), tw);
    if (on('runway3')) band(L.runway3.from, L.runway3.to, M.rwy);
    if (on('taxi3')) Ln(L.taxi3, tw);
    L.deicePads.forEach((b, i) => { if (on('deice' + i)) R(b, M.pad); });
    for (const b of pads) R(b, M.pad);
    for (const w of ways) Ln(w, 10 + M.pad);
    for (const k of ['fireStation', 'h2depot', 'fuelYard']) if (on(k)) R(L[k].box, M.svc);
    // the buildings on the terminal line, and the piers out on the apron: inside, their walls the fence where they stand
    const wall = (b) => { R(b, 0); walls.push(b); };
    for (const k of L.fence.line) if (on(k)) wall(L[k].box);
    if (on('terminal1')) wall(L.terminal1.waiting);
    if (on('pierF')) wall(L.pierF.box);
    if (on('pier2040')) wall(design === 'satellite' ? L.pier2040.sat : L.pier2040.box);
    if (on('pierArm')) wall(L.pier2040.arm);
    return { parts: out, walls, shadows: L.fence.line.filter((k) => on(k)).map((k) => L[k].box) };
  }

  // the landside, always the same: { parts, poly }
  const LAND = (() => {
    const out = [], R = (b, m) => out.push({ r: [b[0] - m, b[1] - m, b[2] + m, b[3] + m] });
    out.push({ l: L.road, h: ROAD }, { l: L.landside, h: ROAD }, { l: L.rail.line, h: RAIL }, { l: L.rail.out, h: RAIL });
    for (const k of ['parkingSmall', 'parkingBig', 'skyCity', 'hotel', 'hotelExt', 'offices', 'cyberCentre', 'aquifer', 'nightTrain']) R(L[k].box, BOX);
    // Cargo City's yard: its west edge touches the cargo apron's corner, so the cell on that edge stays airside
    const Y = L.cargoCity.yard;
    out.push({ r: [Y[0] + 6, Y[1] - BOX, Y[2] + BOX, Y[3] + BOX] });
    for (const b of L.solar) R(b, BOX);
    return out;
  })();

  // ---------- the grid ----------
  // squared distance (in cells) from every cell to the nearest set cell (Felzenszwalb & Huttenlocher)
  function edt(src, W, Hh) {
    const n = Math.max(W, Hh), f = new Float64Array(n), d = new Float64Array(W * Hh), v = new Int32Array(n), z = new Float64Array(n + 1), o = new Float64Array(n);
    const pass = (len) => {
      let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
      const cut = (q) => ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      for (let q = 1; q < len; q++) {
        let s = cut(q);
        while (s <= z[k]) { k--; s = cut(q); }
        k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
      }
      k = 0;
      for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; o[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    };
    for (let x = 0; x < W; x++) { for (let y = 0; y < Hh; y++) f[y] = src[y * W + x] ? 0 : 1e20; pass(Hh); for (let y = 0; y < Hh; y++) d[y * W + x] = o[y]; }
    for (let y = 0; y < Hh; y++) { for (let x = 0; x < W; x++) f[x] = d[y * W + x]; pass(W); for (let x = 0; x < W; x++) d[y * W + x] = o[x]; }
    return d;
  }

  // the fence of a set of parts: { runs: [[x, y]…] (drawn), posts: [[x, y]…], loops (the whole outline), grid for `near` }
  function build(spec) {
    const ps = spec.parts;
    if (!ps.length) return { runs: [], posts: [], loops: [], g: null };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of ps) {
      const pts = p.r ? [[p.r[0], p.r[1]], [p.r[2], p.r[3]]] : p.l, h = p.h || 0;
      for (const q of pts) { x0 = Math.min(x0, q[0] - h); y0 = Math.min(y0, q[1] - h); x1 = Math.max(x1, q[0] + h); y1 = Math.max(y1, q[1] + h); }
    }
    const pad = CLOSE + 3 * CELL;
    x0 = Math.floor((x0 - pad) / CELL) * CELL; y0 = Math.floor((y0 - pad) / CELL) * CELL;
    const W = Math.ceil((x1 + pad - x0) / CELL), Hh = Math.ceil((y1 + pad - y0) / CELL), N = W * Hh;
    const cx = (i) => x0 + (i + 0.5) * CELL, cy = (j) => y0 + (j + 0.5) * CELL;
    // set every cell whose centre lies in a part
    function paint(g, p) {
      if (p.r) {
        const i0 = Math.max(0, Math.ceil((p.r[0] - x0) / CELL - 0.5)), i1 = Math.min(W - 1, Math.floor((p.r[2] - x0) / CELL - 0.5));
        const j0 = Math.max(0, Math.ceil((p.r[1] - y0) / CELL - 0.5)), j1 = Math.min(Hh - 1, Math.floor((p.r[3] - y0) / CELL - 0.5));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g[j * W + i] = 1;
        return;
      }
      for (let k = 1; k < p.l.length; k++) {
        const a = p.l[k - 1], b = p.l[k];
        const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - p.h - x0) / CELL)), i1 = Math.min(W - 1, Math.ceil((Math.max(a[0], b[0]) + p.h - x0) / CELL));
        const j0 = Math.max(0, Math.floor((Math.min(a[1], b[1]) - p.h - y0) / CELL)), j1 = Math.min(Hh - 1, Math.ceil((Math.max(a[1], b[1]) + p.h - y0) / CELL));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (segDist(cx(i), cy(j), a, b) <= p.h) g[j * W + i] = 1;
      }
    }
    const A = new Uint8Array(N);
    for (const p of ps) paint(A, p);
    // the closing: grown by CLOSE, then shrunk by it
    const rc = (CLOSE / CELL) * (CLOSE / CELL);
    const d1 = edt(A, W, Hh), grown = new Uint8Array(N);
    for (let k = 0; k < N; k++) grown[k] = d1[k] <= rc ? 0 : 1;   // the cells left outside
    const d2 = edt(grown, W, Hh), F = new Uint8Array(N);
    for (let k = 0; k < N; k++) F[k] = A[k] || d2[k] > rc ? 1 : 0;
    // the landside cut away (not over the bridges), the walls of the buildings on the line put back
    const land = new Uint8Array(N);
    for (const p of LAND) paint(land, p);
    for (const b of spec.shadows) paint(land, { r: [b[2], b[1], b[2] + SHADOW, b[3]] });
    const belt = L.fence.belt;
    const bx0 = Math.min(...belt.map((p) => p[0])), bx1 = Math.max(...belt.map((p) => p[0])), by0 = Math.min(...belt.map((p) => p[1])), by1 = Math.max(...belt.map((p) => p[1]));
    for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
      const x = cx(i), y = cy(j);
      if (x > bx0 && x < bx1 && y > by0 && y < by1 && inPoly(x, y, belt)) land[j * W + i] = 1;
    }
    // over a bridge: the taxiway and BRIDGE m to each side of its line, near the bridge
    const bridge = new Uint8Array(N), deck = new Uint8Array(N);
    paint(deck, { l: L.taxi3, h: BRIDGE });
    for (const [bx, by] of L.bridges) paint(bridge, { r: [bx - 50, by - 50, bx + 50, by + 50] });
    for (let k = 0; k < N; k++) bridge[k] &= deck[k];
    for (let k = 0; k < N; k++) if (land[k] && !bridge[k]) F[k] = 0;
    const wallG = new Uint8Array(N);
    for (const b of spec.walls) paint(wallG, { r: b });
    for (let k = 0; k < N; k++) if (wallG[k]) F[k] = 1;
    // the holes left inside (not landside) filled; scraps of airside cut off by the landside dropped
    const seen = new Uint8Array(N), stack = new Int32Array(N);
    // the cells of F === want joined to `start` (4-neighbours), marked seen; returns them in stack[0…n)
    const flood = (start, want) => {
      let n = 0, top = 0; stack[top++] = start; seen[start] = 1;
      while (n < top) {
        const k = stack[n++], i = k % W;
        if (i > 0 && !seen[k - 1] && F[k - 1] === want) { seen[k - 1] = 1; stack[top++] = k - 1; }
        if (i < W - 1 && !seen[k + 1] && F[k + 1] === want) { seen[k + 1] = 1; stack[top++] = k + 1; }
        if (k >= W && !seen[k - W] && F[k - W] === want) { seen[k - W] = 1; stack[top++] = k - W; }
        if (k < N - W && !seen[k + W] && F[k + W] === want) { seen[k + W] = 1; stack[top++] = k + W; }
      }
      return n;
    };
    for (let i = 0; i < W; i++) for (const k of [i, (Hh - 1) * W + i]) if (!F[k] && !seen[k]) flood(k, 0);
    for (let j = 0; j < Hh; j++) for (const k of [j * W, j * W + W - 1]) if (!F[k] && !seen[k]) flood(k, 0);
    for (let k = 0; k < N; k++) if (!F[k] && !seen[k] && !land[k]) F[k] = 1;
    seen.fill(0);
    for (let k = 0; k < N; k++) if (F[k] && !seen[k]) {
      const n = flood(k, 1);
      if (n < 60) for (let q = 0; q < n; q++) F[stack[q]] = 0;
    }
    // the outline: the cells' edges with airside on the left, joined into loops, straightened
    const VW = W + 1, out = new Map();
    const at = (i, j) => i >= 0 && j >= 0 && i < W && j < Hh && F[j * W + i] === 1;
    const edge = (a, b) => { const l = out.get(a); if (l) l.push(b); else out.set(a, [b]); };
    for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
      if (!at(i, j)) continue;
      const v00 = j * VW + i, v10 = v00 + 1, v01 = v00 + VW, v11 = v01 + 1;
      if (!at(i, j - 1)) edge(v00, v10);
      if (!at(i + 1, j)) edge(v10, v11);
      if (!at(i, j + 1)) edge(v11, v01);
      if (!at(i - 1, j)) edge(v01, v00);
    }
    const loops = [];
    for (const [s] of out) {
      while (out.get(s) && out.get(s).length) {
        const loop = [];
        let v = s;
        do {
          const l = out.get(v);
          if (!l || !l.length) break;
          const nx = l.pop();
          loop.push(v); v = nx;
        } while (v !== s);
        const pts = loop.map((k) => [x0 + (k % VW) * CELL, y0 + Math.floor(k / VW) * CELL]);
        if (pts.length >= 4) loops.push(simplify(pts, CELL * 1.3));
      }
    }
    // the parts drawn: away from the walls; a run that stops at a wall is carried on to it
    const runs = [];
    const hidden = (x, y) => spec.walls.some((b) => boxDist(x, y, b) < HIDE);
    for (const lp of loops) {
      const ring = lp.concat([lp[0]]), pieces = [];
      for (let k = 1; k < ring.length; k++) {
        const a = ring[k - 1], b = ring[k], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (CELL / 2)));
        for (let q = 0; q < n; q++) {
          const p0 = [a[0] + (b[0] - a[0]) * q / n, a[1] + (b[1] - a[1]) * q / n], p1 = [a[0] + (b[0] - a[0]) * (q + 1) / n, a[1] + (b[1] - a[1]) * (q + 1) / n];
          pieces.push({ p0, p1, hide: hidden((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2) });
        }
      }
      // a loop clear of every wall is drawn whole; else the walk starts at a hidden piece, so no run is cut in two
      const first = pieces.findIndex((p) => p.hide);
      if (first < 0) { runs.push(ring); continue; }
      let cur = null;
      const close = () => { if (cur && cur.length > 1) runs.push(toWall(simplifyOpen(cur))); cur = null; };
      for (const p of pieces.slice(first).concat(pieces.slice(0, first))) {
        if (p.hide) { close(); continue; }
        if (!cur) cur = [p.p0];
        cur.push(p.p1);
      }
      close();
    }
    // (the far end first: a point put before the near end would move the far end's index)
    function toWall(run) {
      for (const end of [run.length - 1, 0]) {
        const p = run[end];
        let best = null, bd = HIDE + CELL;
        for (const b of spec.walls) { const d = boxDist(p[0], p[1], b); if (d < bd) { bd = d; best = b; } }
        if (!best) continue;
        // up to the wall, stopping a hand short of it
        const w = [Math.max(best[0], Math.min(best[2], p[0])), Math.max(best[1], Math.min(best[3], p[1]))];
        const l = Math.hypot(p[0] - w[0], p[1] - w[1]);
        if (l < 1) continue;
        const q = [w[0] + (p[0] - w[0]) * 0.8 / l, w[1] + (p[1] - w[1]) * 0.8 / l];
        if (end === 0) run.unshift(q); else run.push(q);
      }
      return run;
    }
    const posts = [];
    for (const r of runs) {
      let left = 0;
      for (let k = 1; k < r.length; k++) {
        const a = r[k - 1], b = r[k], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let d = left; d <= l; d += POST) posts.push([a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]);
        left = (left - l) % POST; if (left < 0) left += POST;
      }
    }
    // the cells by the outline, for `near`
    const edgeG = new Uint8Array(N);
    for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
      const v = at(i, j);
      if (at(i - 1, j) !== v || at(i + 1, j) !== v || at(i, j - 1) !== v || at(i, j + 1) !== v) edgeG[j * W + i] = 1;
    }
    return { runs, posts, loops, g: { x0, y0, W, H: Hh, edge: edgeG, F } };
  }

  // Douglas–Peucker on a closed loop (split at its two farthest points) and on an open line
  function simplifyOpen(pts, tol) {
    tol = tol || CELL * 1.3;
    if (pts.length < 3) return pts.slice();
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    while (st.length) {
      const [a, b] = st.pop();
      let best = -1, bd = tol;
      for (let k = a + 1; k < b; k++) { const d = segDist(pts[k][0], pts[k][1], pts[a], pts[b]); if (d > bd) { bd = d; best = k; } }
      if (best >= 0) { keep[best] = 1; st.push([a, best], [best, b]); }
    }
    return pts.filter((p, k) => keep[k]);
  }
  function simplify(pts, tol) {
    let far = 0, fd = -1;
    for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[0][0], pts[k][1] - pts[0][1]); if (d > fd) { fd = d; far = k; } }
    const a = simplifyOpen(pts.slice(0, far + 1), tol), b = simplifyOpen(pts.slice(far).concat([pts[0]]), tol);
    return a.concat(b.slice(1, -1));
  }

  // the fence of these parts, worked out once for each set of them
  let last = { sig: null, fence: null };
  function get(spec) {
    const sig = JSON.stringify(spec);
    if (sig !== last.sig) last = { sig, fence: build(spec) };
    return last.fence;
  }

  // whether a point lies on the fence's line (within a cell or so): no tree there
  function near(f, x, y) {
    const g = f && f.g;
    if (!g) return false;
    const i = Math.floor((x - g.x0) / CELL), j = Math.floor((y - g.y0) / CELL);
    return i >= 0 && j >= 0 && i < g.W && j < g.H && g.edge[j * g.W + i] === 1;
  }

  // ---------- drawing: the mesh between the posts, the top wire, the posts close up ----------
  function draw(c, sc) {
    const f = sc.fence;
    if (!f || !f.runs.length) return;
    Iso.units(c);
    const v = Cam.view(40), inView = (p) => p[0] > v.x0 && p[0] < v.x1 && p[1] > v.y0 && p[1] < v.y1;
    const segIn = (a, b) => !(Math.max(a[0], b[0]) < v.x0 || Math.min(a[0], b[0]) > v.x1 || Math.max(a[1], b[1]) < v.y0 || Math.min(a[1], b[1]) > v.y1);
    const px = 1 / Cam.zoom, snow = sc.season === 'winter';
    c.lineJoin = 'round'; c.lineCap = 'round';
    // the mesh: a see-through band from the ground to the top wire
    c.beginPath();
    for (const r of f.runs) for (let k = 1; k < r.length; k++) {
      const a = r[k - 1], b = r[k];
      if (!segIn(a, b)) continue;
      const p0 = P(a[0], a[1], 0), p1 = P(b[0], b[1], 0), p2 = P(b[0], b[1], H), p3 = P(a[0], a[1], H);
      c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.closePath();
    }
    c.fillStyle = snow ? 'rgba(90,100,110,0.3)' : 'rgba(205,212,218,0.42)';
    c.fill();
    // the foot and the top wire
    const wire = (z, w, col) => {
      c.beginPath();
      for (const r of f.runs) for (let k = 1; k < r.length; k++) {
        const a = r[k - 1], b = r[k];
        if (!segIn(a, b)) continue;
        const p0 = P(a[0], a[1], z), p1 = P(b[0], b[1], z);
        c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]);
      }
      c.lineWidth = w; c.strokeStyle = col; c.stroke();
    };
    wire(0, Math.max(0.35, 0.8 * px), 'rgba(40,45,50,0.35)');
    wire(H, Math.max(0.2, 1.1 * px), snow ? '#6f7880' : '#e2e6e9');
    // the posts, close up
    if (Cam.zoom >= 0.45) {
      c.beginPath();
      for (const p of f.posts) {
        if (!inView(p)) continue;
        const a = P(p[0], p[1], 0), b = P(p[0], p[1], H + 0.2);
        c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
      }
      c.lineWidth = Math.max(0.25, 1.2 * px); c.strokeStyle = snow ? '#55606a' : '#6f777e'; c.stroke();
    }
  }

  return { parts, build, get, near, draw, CELL };
})();
