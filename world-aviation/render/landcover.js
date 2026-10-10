'use strict';

// ============================================================
// World Aviation — the land cover: fields, woods, villages and
// towns painted over the terrain's own colours (Scene3D's near
// and far meshes), so the ground below has the patchwork of a
// real landscape and its passing shows the speed from any height:
//   - a tile of farmland: strips of fields in blocks between lanes,
//     tracks and hedges, in the colours of the crops and of the
//     ploughed soil, with farmsteads, woods and villages; made once
//     as plain bytes and repeated over the world, each copy turned,
//     mirrored and shifted at random (by whole blocks, so the seams
//     are lanes between fields), so no two copies in a row are alike;
//   - the tile's smooth noise read three times more, at unrelated
//     bigger scales, for the woods (unbroken by the copies' seams)
//     and the regions: wooded or open country, the tone of the land;
//   - a second tile with the lights after dusk: the villages'
//     streets, lone farms, and a grid of street lights for the real
//     cities.
// How much of each shows comes from the terrain (Terrain.colorAt's
// `land`): fields in the lowlands, none on rock, snow, sand or the
// water; more woods in the north, the tropics and the hills; the
// real cities of data/cities.js grey with their streets lit.
// Used by Scene3D (the terrain material, the trees).
// ============================================================

// how the tiles lie on the world (visual only)
const LAND_TILE_M = 5200;          // the farmland tile, metres
const LAND_WOOD_M = 13700;         // the woods' noise, metres a tile
const LAND_REGION_M = [33000, 47000];   // the regions' noise, metres a tile
const LAND_ROT_A = [0.97, 0.24];   // the farmland tile's turn (cos, sin)
const LAND_ROT_C = [0.6, 0.8];     // the woods' turn
const LAND_ROT_B = [[0.82, -0.57], [0.34, 0.94]];  // the regions' turns
const LAND_LINES = 16;             // room for the tile's block lines in the shader

const LandCover = {
  N: 0,
  a: null, l: null,               // the bytes of the two tiles (RGBA, N x N)
  xs: null, ys: null,             // the tile's block lines across and down, 0..1
  bomb: false,                    // each copy of the tile turned and shifted (WebGL 2: textureGrad)
  uniforms: null,
  mat: null,

  // the tiles at N x N texels (QUALITY.landTex), mipmapped and sharp at a slant (aniso);
  // webgl2: the copies of the tile can be shuffled
  build(N, aniso, webgl2) {
    N = N || 1024;
    if (this.N === N) return;
    const t = landTiles(N);
    this.N = N; this.a = t.a; this.l = t.l;
    this.bomb = !!webgl2;
    this.xs = t.xs.slice(0, Math.min(LAND_LINES, t.xs.length - 1)).map((x) => x / N);
    this.ys = t.ys.slice(0, Math.min(LAND_LINES, t.ys.length - 1)).map((y) => y / N);
    const lines = (v) => { const o = new Float32Array(LAND_LINES); for (let i = 0; i < LAND_LINES; i++) o[i] = v[Math.min(i, v.length - 1)]; return o; };
    const tex = (data) => {
      const x = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
      x.wrapS = x.wrapT = THREE.RepeatWrapping;
      x.magFilter = THREE.LinearFilter;
      x.minFilter = THREE.LinearMipmapLinearFilter;
      x.generateMipmaps = true;
      x.anisotropy = aniso || 1;
      x.needsUpdate = true;
      return x;
    };
    const old = this.uniforms;
    if (old) { old.uLandA.value.dispose(); old.uLandL.value.dispose(); }
    const u = this.uniforms || (this.uniforms = {
      uLandA: { value: null }, uLandL: { value: null }, uLandNight: { value: 0 }, uLandMean: { value: 0.5 },
      uLandXs: { value: null }, uLandYs: { value: null }, uLandN: { value: new THREE.Vector2() }
    });
    u.uLandA.value = tex(t.a);
    u.uLandL.value = tex(t.l);
    u.uLandMean.value = t.mean;
    u.uLandXs.value = lines(this.xs);
    u.uLandYs.value = lines(this.ys);
    u.uLandN.value.set(this.xs.length, this.ys.length);
  },

  // the terrain's material: vertex colours with the land cover over them (one for both meshes)
  material() {
    if (this.mat) return this.mat;
    const m = new THREE.MeshLambertMaterial({ vertexColors: true });
    const u = this.uniforms;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', 'attribute vec3 land;\nvarying vec3 vLand;\nvarying vec2 vLandW;\n#include <common>')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLand = land;\nvLandW = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', (this.bomb ? '#define LAND_BOMB\n' : '') + LAND_FRAG_PARS + '#include <common>')
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + LAND_FRAG);
    };
    m.customProgramCacheKey = () => 'landcover1' + this.bomb;
    return (this.mat = m);
  },

  // dark: 0 by day, 1 at night — the lights come on
  update(dark) {
    if (this.uniforms) this.uniforms.uLandNight.value = smoothstep(0.1, 0.7, dark);
  },

  // the woods at (x, z) as the shader sees them close by, for the trees (land: Terrain.colorAt's
  // land of the place): the forest share 0..1
  forestAt(x, z, land) {
    if (!this.a) return 0;
    const N = this.N;
    const at = (d, u, v) => d[(((Math.floor((u - Math.floor(u)) * N) % N) + (Math.floor((v - Math.floor(v)) * N) % N) * N) * 4) + 3] / 255;
    const noise = (r, S) => at(this.a, (r[0] * x + r[1] * z) / S, (-r[1] * x + r[0] * z) / S);
    const covB = (noise(LAND_ROT_B[0], LAND_REGION_M[0]) + noise(LAND_ROT_B[1], LAND_REGION_M[1])) / 2;
    const t = this.tileAt((LAND_ROT_A[0] * x + LAND_ROT_A[1] * z) / LAND_TILE_M, (-LAND_ROT_A[1] * x + LAND_ROT_A[0] * z) / LAND_TILE_M);
    const v = at(this.l, t[0], t[1]);
    if (v > 0.9) return 0;                              // a village
    const cov = noise(LAND_ROT_C, LAND_WOOD_M) + (Math.min(v, 0.7) - 0.5) * 0.4;
    const woods = land[1], tS = woods * 0.6 + 0.06, tB = woods * 0.8 - 0.15;
    const f = Math.max(1 - smoothstep(tS - 0.012, tS + 0.012, cov), 1 - smoothstep(tB - 0.02, tB + 0.02, covB));
    return f * land[0];
  },

  // where the farmland tile coordinate (u, v) reads the tile: its copy turned, mirrored and
  // shifted by its own dice (the shader's LAND_BOMB, the same sums)
  tileAt(u, v) {
    if (!this.bomb) return [u, v];
    const cu = Math.floor(u), cv = Math.floor(v);
    let gu = u - cu, gv = v - cv;
    const h = landHash(cu, cv);
    if (h & 1) { const q = gu; gu = gv; gv = q; }
    if (h & 2) gu = 1 - gu;
    if (h & 4) gv = 1 - gv;
    return [gu + this.xs[(h >>> 3) % this.xs.length], gv + this.ys[(h >>> 11) % this.ys.length]];
  }
};

// The shader: the same sums as forestAt. vLand = (patch: how much land cover shows, woods: how
// wooded the country is, urban: a real city here); vLandW the world position.
const LAND_FRAG_PARS = `
uniform sampler2D uLandA, uLandL;
uniform float uLandNight, uLandMean;
uniform float uLandXs[${LAND_LINES}], uLandYs[${LAND_LINES}];
uniform vec2 uLandN;
varying vec3 vLand;
varying vec2 vLandW;
`;
const LAND_FRAG = `
{
  vec2 w = vLandW;
  // the regions and the woods: the tile's noise read at unrelated scales
  vec2 ub1 = vec2(${LAND_ROT_B[0][0]} * w.x + ${LAND_ROT_B[0][1]} * w.y, ${-LAND_ROT_B[0][1]} * w.x + ${LAND_ROT_B[0][0]} * w.y) / ${LAND_REGION_M[0].toFixed(1)};
  vec2 ub2 = vec2(${LAND_ROT_B[1][0]} * w.x + ${LAND_ROT_B[1][1]} * w.y, ${-LAND_ROT_B[1][1]} * w.x + ${LAND_ROT_B[1][0]} * w.y) / ${LAND_REGION_M[1].toFixed(1)};
  vec4 B1 = texture2D(uLandA, ub1), B2 = texture2D(uLandA, ub2);
  vec2 uc = vec2(${LAND_ROT_C[0]} * w.x + ${LAND_ROT_C[1]} * w.y, ${-LAND_ROT_C[1]} * w.x + ${LAND_ROT_C[0]} * w.y) / ${LAND_WOOD_M.toFixed(1)};
  float woodN = texture2D(uLandA, uc).a;
  vec2 us = vec2(${LAND_ROT_A[0]} * w.x + ${LAND_ROT_A[1]} * w.y, ${-LAND_ROT_A[1]} * w.x + ${LAND_ROT_A[0]} * w.y) / ${LAND_TILE_M.toFixed(1)};
#ifdef LAND_BOMB
  // each copy of the tile turned, mirrored and shifted by whole blocks (LandCover.tileAt);
  // the mip level from the unbroken coordinate, so the seams do not flicker
  vec2 ci = floor(us), g = us - ci, gx = dFdx(us), gy = dFdy(us);
  uvec2 cu = uvec2(ivec2(ci) + 1048576);
  uint h = cu.x * 374761393u + cu.y * 668265263u;
  h = (h ^ (h >> 13u)) * 1274126177u;
  h = h ^ (h >> 16u);
  if ((h & 1u) != 0u) { g = g.yx; gx = gx.yx; gy = gy.yx; }
  if ((h & 2u) != 0u) { g.x = 1.0 - g.x; gx.x = -gx.x; gy.x = -gy.x; }
  if ((h & 4u) != 0u) { g.y = 1.0 - g.y; gx.y = -gx.y; gy.y = -gy.y; }
  vec2 t = g + vec2(uLandXs[int((h >> 3u) % uint(uLandN.x))], uLandYs[int((h >> 11u) % uint(uLandN.y))]);
  vec4 A = textureGrad(uLandA, t, gx, gy);
  vec4 AL = textureGrad(uLandL, t, gx, gy);
#else
  vec4 A = texture2D(uLandA, us);
  vec4 AL = texture2D(uLandL, us);
#endif
  float woods = vLand.y;
  float village = smoothstep(0.82, 0.95, AL.a);
  float cov = woodN + (min(AL.a, 0.7) - 0.5) * 0.4;           // the woods' edges follow the fields a little
  float covB = (B1.a + B2.a) * 0.5;
  float tS = woods * 0.6 + 0.06, tB = woods * 0.8 - 0.15;
  float bigWood = 1.0 - smoothstep(tB - 0.02, tB + 0.02, covB);
  float forest = max(1.0 - smoothstep(tS - 0.012, tS + 0.012, cov), bigWood);
  // a village shows in open country (the regions' cover high), fewer in wooded land
  float town = village * smoothstep(0.3, 0.55, covB) * (1.0 - 0.7 * woods) * (1.0 - bigWood);
  vec3 base = diffuseColor.rgb;
  vec3 c = mix(base, A.rgb, 0.72 * (1.0 - village));          // the fields, keeping a little of the land's colour
  c = mix(c, base * vec3(0.56, 0.7, 0.56) * (0.6 + 0.8 * AL.b), forest);   // the woods: darker than the open land, the crowns
  c = mix(c, A.rgb, town * (1.0 - forest));                    // the villages
  c *= 0.88 + 0.9 * (dot(B1.rgb + B2.rgb, vec3(0.1667)) - uLandMean);   // the regions' tone
  c = mix(base, c, vLand.x);
  // the real cities: roofs in blocks between the streets of the grid, its parks the woods
  float city = vLand.z * (1.0 - 0.6 * forest);
  float street = smoothstep(0.08, 0.18, AL.g);
  vec3 roofs = vec3(0.42, 0.4, 0.38) * (0.65 + 0.7 * AL.b) * (0.8 + 0.4 * dot(A.rgb, vec3(0.3, 0.5, 0.2)));
  c = mix(c, mix(roofs, vec3(0.25, 0.25, 0.26), street * 0.85), city);
  diffuseColor.rgb = c;
  // the lights after dusk, read from a sharper level than the rest so they stay points far off
  if (uLandNight > 0.0) {
#ifdef LAND_BOMB
    vec4 LN = textureGrad(uLandL, t, gx * 0.35, gy * 0.35);
#else
    vec4 LN = texture2D(uLandL, us, -1.5);
#endif
    totalEmissiveRadiance += uLandNight * vec3(1.0, 0.62, 0.28)
      * (LN.r * (1.0 - forest) * mix(0.8, town, village) * vLand.x * 1.6 + max(LN.g - 0.2, 0.0) * city * 1.75);
  }
}
`;

// the dice of a copy of the tile: the shader's hash, in 32-bit unsigned sums
function landHash(cu, cv) {
  let h = (Math.imul(cu + 1048576, 374761393) + Math.imul(cv + 1048576, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

// ---------- the tiles ----------
// Two N x N RGBA tiles, seamless when repeated:
//   a: rgb = the colour of the ground (a field, a lane, a hedge, a roof, a garden, a street),
//      a = smooth noise spread evenly over 0..1 (read at other scales for the woods and the
//      regions: woods where it is below how wooded the country is)
//   l: r = lights of the villages and the farms, g = a city's grid of streets (0.2) and their
//      lights (up to 1),
//      b = the crowns of the trees in the woods (noise about 0.5),
//      a = 1 in a village, else 0.3..0.7 by the field (the woods' edges follow it a little)
function landTiles(N) {
  const S = N / 1024, rng = makeRng(90210);
  const a = new Uint8Array(N * N * 4), l = new Uint8Array(N * N * 4);
  const hash = (x, y, k) => {
    let h = (x * 374761393 + y * 668265263 + k * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  // ---- smooth noise on a wrapping lattice, at M x M, read bilinearly; ranked so its values
  // spread evenly over 0..1
  const M = 256;
  const noiseTile = (seed, octaves) => {
    const r = makeRng(seed), out = new Float32Array(M * M);
    for (const [P, wt] of octaves) {
      const lat = new Float32Array(P * P);
      for (let i = 0; i < P * P; i++) lat[i] = r.next();
      for (let y = 0; y < M; y++) {
        const fy = y / M * P, iy = fy | 0, ty = smoothstep(0, 1, fy - iy), y0 = iy * P, y1 = ((iy + 1) % P) * P;
        for (let x = 0; x < M; x++) {
          const fx = x / M * P, ix = fx | 0, tx = smoothstep(0, 1, fx - ix), x1 = (ix + 1) % P;
          out[y * M + x] += wt * lerp(lerp(lat[y0 + ix], lat[y0 + x1], tx), lerp(lat[y1 + ix], lat[y1 + x1], tx), ty);
        }
      }
    }
    let lo = Infinity, hi = -Infinity;
    for (const v of out) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const BINS = 2048, hist = new Float32Array(BINS + 1);
    const bin = (v) => Math.min(BINS, Math.floor((v - lo) / (hi - lo || 1) * BINS));
    for (const v of out) hist[bin(v)]++;
    for (let i = 1; i <= BINS; i++) hist[i] += hist[i - 1];
    for (let i = 0; i < out.length; i++) out[i] = hist[bin(out[i])] / out.length;
    return out;
  };
  const read = (f, x, y) => {
    const fx = x * M / N, fy = y * M / N, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy;
    const x1 = (ix + 1) % M, y1 = (iy + 1) % M;
    return lerp(lerp(f[iy * M + ix], f[iy * M + x1], tx), lerp(f[y1 * M + ix], f[y1 * M + x1], tx), ty);
  };
  const woodsN = noiseTile(4711, [[3, 1], [6, 0.55], [12, 0.32], [24, 0.18], [48, 0.1]]);
  const clumps = noiseTile(2718, [[64, 1], [128, 0.6]]);       // stands of trees in the woods

  // ---- the crops: colours in the terrain's own scale (0..255 as in Terrain.colorAt) and how common
  const CROPS = [
    [[190, 170, 104], 9], [[170, 164, 98], 8], [[104, 140, 62], 12], [[88, 128, 56], 12], [[98, 122, 68], 10],
    [[130, 106, 80], 9], [[100, 84, 66], 7], [[210, 196, 72], 2], [[142, 136, 104], 5], [[120, 150, 72], 6]
  ];
  const cropSum = CROPS.reduce((t, c) => t + c[1], 0);
  const crop = () => {
    let k = rng.next() * cropSum;
    for (const [c, wt] of CROPS) { if ((k -= wt) < 0) { const j = rng.range(0.9, 1.1); return [c[0] * j, c[1] * j, c[2] * j]; } }
    return CROPS[0][0];
  };
  const ROAD = [128, 124, 116], TRACK = [150, 130, 100], HEDGE = [46, 66, 36];

  // ---- the blocks between the lanes, each cut into strips of fields along one side
  const cuts = () => {
    const c = [0];
    for (;;) { const g = rng.range(70, 150) * S; if (c[c.length - 1] + g > N - 60 * S) break; c.push(Math.round(c[c.length - 1] + g)); }
    c.push(N);
    return c;
  };
  const xs = cuts(), ys = cuts(), nbx = xs.length - 1, nby = ys.length - 1;
  const colOf = new Int32Array(N), rowOf = new Int32Array(N);
  for (let i = 0; i < nbx; i++) for (let x = xs[i]; x < xs[i + 1]; x++) colOf[x] = i;
  for (let j = 0; j < nby; j++) for (let y = ys[j]; y < ys[j + 1]; y++) rowOf[y] = j;
  const edge = () => { const k = rng.next(); return k < 0.35 ? ROAD : k < 0.6 ? TRACK : k < 0.9 ? HEDGE : null; };
  const blocks = [], farms = [];
  for (let j = 0; j < nby; j++) for (let i = 0; i < nbx; i++) {
    const w = xs[i + 1] - xs[i], h = ys[j + 1] - ys[j], along = rng.chance(0.5), span = along ? w : h;
    const strips = [];
    for (let s = 0; s < span;) {
      let sw = Math.round(rng.range(14, 46) * S);
      if (span - (s + sw) < 10 * S) sw = span - s;
      strips.push({ s0: s, s1: s + sw, split: rng.chance(0.4) ? rng.range(0.3, 0.7) : 2, c1: crop(), c2: crop(), k: rng.next() });
      if (rng.chance(0.1)) farms.push([xs[i] + (along ? s + sw / 2 : rng.range(0.15, 0.85) * w), ys[j] + (along ? rng.range(0.15, 0.85) * h : s + sw / 2)]);
      s += sw;
    }
    blocks.push({ w, h, along, strips, left: edge(), top: edge() });
  }

  // ---- the fields, lanes and hedges, and the cover
  const put = (d, x, y, c) => { const i = (((y + N) % N) * N + ((x + N) % N)) * 4; d[i] = clamp(c[0], 0, 255); d[i + 1] = clamp(c[1], 0, 255); d[i + 2] = clamp(c[2], 0, 255); };
  for (let y = 0; y < N; y++) {
    const j = rowOf[y], v = y - ys[j];
    for (let x = 0; x < N; x++) {
      const i = colOf[x], u = x - xs[i], b = blocks[j * nbx + i];
      const s = b.along ? u : v, o = b.along ? v / b.h : u / b.w;
      let st = b.strips[0];
      for (const q of b.strips) if (s >= q.s0) st = q;
      let c = o < st.split ? st.c1 : st.c2, k = 0.96 + 0.08 * hash(x, y, 1) + (((s >> 1) & 1) ? 0.02 : -0.02);
      if (s - st.s0 < 1) k *= 0.88;                     // the edge between two fields
      if (u < 2 * S && b.left) { c = b.left; k = 0.95 + 0.1 * hash(x, y, 2); }
      else if (v < 2 * S && b.top) { c = b.top; k = 0.95 + 0.1 * hash(x, y, 2); }
      const p = (y * N + x) * 4;
      a[p] = clamp(c[0] * k, 0, 255); a[p + 1] = clamp(c[1] * k, 0, 255); a[p + 2] = clamp(c[2] * k, 0, 255);
      a[p + 3] = Math.round(read(woodsN, x, y) * 255);
      l[p + 2] = Math.round((0.15 + 0.35 * hash(x, y, 5) + 0.35 * read(clumps, x, y)) * 255);
      l[p + 3] = Math.round((0.3 + 0.4 * st.k) * 255);
      // a city's streets (0.2 and up) and their lights: a grid, the avenues brighter
      const gx = x % Math.max(2, Math.round(8 * S)), gy = y % Math.max(2, Math.round(8 * S));
      const avenue = x % Math.round(48 * S) < 1 || y % Math.round(48 * S) < 1;
      const hl = hash(x, y, 3);
      l[p + 1] = avenue ? (hl < 0.85 ? 255 : 60) : (gx < 1 || gy < 1) ? (hl < 0.35 ? 120 + hl * 380 : 52) : 0;
    }
  }

  // ---- the farmsteads: a house and a barn, a light in the yard
  const ROOFS = [[150, 82, 62], [120, 70, 60], [120, 118, 115], [165, 162, 155], [85, 85, 88], [140, 96, 70]];
  for (const [fx, fy] of farms) {
    const x0 = Math.round(fx), y0 = Math.round(fy), r1 = ROOFS[(rng.next() * ROOFS.length) | 0], r2 = ROOFS[(rng.next() * ROOFS.length) | 0];
    const hw = Math.max(1, Math.round(2 * S)), bw = Math.max(1, Math.round(3 * S));
    for (let dy = -hw; dy <= hw; dy++) for (let dx = -hw; dx <= hw; dx++) put(a, x0 + dx, y0 + dy, r1);
    for (let dy = -bw; dy <= bw; dy++) for (let dx = 0; dx <= bw; dx++) put(a, x0 + hw + 2 + dx, y0 + dy, r2);
    const p = (((y0 + N) % N) * N + ((x0 - hw - 1 + N) % N)) * 4;
    l[p] = 255;
  }

  // ---- the villages: roofs and gardens along a grid of streets, inside a ragged ring; one
  // bigger town
  const towns = [];
  for (let guard = 0; towns.length < 9 && guard < 400; guard++) {
    const x = rng.range(0, N), y = rng.range(0, N);
    const r = (towns.length === 0 ? 85 : rng.range(20, 50)) * S;
    if (towns.some((t) => Math.hypot(wrapD(t.x - x, N), wrapD(t.y - y, N)) < t.r + r + 30 * S)) continue;
    towns.push({ x, y, r, p1: rng.range(0, TAU), p2: rng.range(0, TAU), sp: Math.round(rng.range(9, 12) * S) });
  }
  const cell = Math.max(1, Math.round(3 * S));
  for (const t of towns) {
    const R = Math.ceil(t.r * 1.4);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const d = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
      const rr = t.r * (0.8 + 0.2 * Math.sin(3 * th + t.p1) + 0.12 * Math.sin(5 * th + t.p2));
      if (d > rr) continue;
      const x = ((Math.round(t.x) + dx) % N + N) % N, y = ((Math.round(t.y) + dy) % N + N) % N;
      const p = (y * N + x) * 4;
      const street = x % t.sp < Math.max(1, 1.5 * S) || y % t.sp < Math.max(1, 1.5 * S);
      const hc = hash((x / cell) | 0, (y / cell) | 0, 7), hl = hash(x, y, 8);
      let c;
      if (street) c = [100, 98, 95];
      else if (hc < 0.2 + 0.45 * d / rr) c = [78, 104, 58];          // gardens, more of them at the edge
      else c = ROOFS[(hash((x / cell) | 0, (y / cell) | 0, 9) * ROOFS.length) | 0];
      const k = 0.94 + 0.12 * hl;
      a[p] = clamp(c[0] * k, 0, 255); a[p + 1] = clamp(c[1] * k, 0, 255); a[p + 2] = clamp(c[2] * k, 0, 255);
      l[p + 3] = 255;
      l[p] = street ? (hl < 0.2 ? 170 + hl * 420 : 0) : hl < 0.025 ? 110 : 0;
    }
  }

  // the mean brightness of the ground (the regions' tone is taken about it)
  let sum = 0;
  for (let i = 0; i < N * N * 4; i += 4) sum += a[i] + a[i + 1] + a[i + 2];
  return { a, l, xs, ys, mean: sum / (N * N * 3 * 255) };
}

// the shortest way between two places on a wrapping tile of n
function wrapD(d, n) { return ((d % n) + n * 1.5) % n - n / 2; }
