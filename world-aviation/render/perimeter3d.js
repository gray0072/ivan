'use strict';

// ============================================================
// World Aviation — the edge of an airport (three.js): the perimeter
// fence round the airside and the trees outside it, of the kinds the
// airport's climate grows.
//
//   - the fence: chain-link on posts (LAYOUT.FENCE_*), along the far
//     side of the runway, across both ends past the runway, and on the
//     terminal side along the terminal's middle line, from building to
//     building (the terminals, the tower and the hangars are part of the
//     boundary, as at a real airport). The mesh is one strip with a
//     see-through texture, the posts one instanced box.
//   - the trees: a row along the landside road (where the ground
//     texture has their shadows), and woods and copses round the field
//     outside the fence — never on the extended centreline, the roads,
//     the car park, the buildings or the water. The climate
//     (AIRPORT_CLIMATE in data/airports.js, else the latitude) picks the
//     mix: spruce, pine and birch in the north, larch in Siberia, oak
//     and poplar in the temperate belt, cypress, stone pine and olive by
//     the Mediterranean, poplars in the steppe oases, date palms in the
//     desert, coconut palms and broadleaves in the tropics, acacias on
//     the savanna, eucalyptus in Australia, only low scrub in the
//     tundra. The deciduous ones turn with the season (Career.data.season,
//     reversed in the south): green, autumn colours, bare in winter.
//     Each kind is one instanced, vertex-coloured mesh.
// Used by Airport3D.build (airport3d.js), in the airport's frame.
// ============================================================

const Perimeter3D = {
  build(a, rec, at, tex, quality) {
    this.fence(a, at, tex);
    this.trees(a, rec, at, quality);
  },

  // ---------- the fence ----------
  // the fence's corners and the stretches of it, as [t, across] pairs in the airport's frame
  fenceLines(a) {
    const L = LAYOUT, t0 = -a.half - L.FENCE_BEYOND, t1 = a.half + L.FENCE_BEYOND, far = L.FENCE_FAR, side = L.TERMINAL;
    const lines = [[[t0, far], [t1, far]], [[t0, far], [t0, side]], [[t1, far], [t1, side]]];
    // on the terminal side from one building to the next: the buildings standing on the line
    // close the gaps
    const cuts = a.buildings
      .filter((b) => b.kind !== 'fuel' && Math.abs(b.across - side) < b.acrossSize / 2 - 0.5)
      .map((b) => [b.t - b.along / 2 + 0.3, b.t + b.along / 2 - 0.3])
      .sort((p, q) => p[0] - q[0]);
    let t = t0;
    for (const [c0, c1] of cuts) {
      if (c0 > t + 1) lines.push([[t, side], [Math.min(c0, t1), side]]);
      t = Math.max(t, c1);
    }
    if (t < t1 - 1) lines.push([[t, side], [t1, side]]);
    return lines;
  },

  fence(a, at, tex) {
    const L = LAYOUT, H = L.FENCE_H;
    const pos = [], uv = [], posts = [];
    for (const [[ta, aa], [tb, ab]] of this.fenceLines(a)) {
      const len = Math.hypot(tb - ta, ab - aa);
      if (len < 1) continue;
      // cut into pieces of at most 12 m (the logarithmic depth buffer wants small triangles)
      const n = Math.max(1, Math.ceil(len / 12));
      for (let i = 0; i < n; i++) {
        const f0 = i / n, f1 = (i + 1) / n;
        const x0 = aa + (ab - aa) * f0, z0 = -(ta + (tb - ta) * f0), x1 = aa + (ab - aa) * f1, z1 = -(ta + (tb - ta) * f1);
        const u0 = len * f0 / H, u1 = len * f1 / H;
        pos.push(x0, 0, z0, x1, 0, z1, x1, H, z1, x0, 0, z0, x1, H, z1, x0, H, z0);
        uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1);
      }
      const np = Math.max(1, Math.round(len / L.FENCE_POST_M));
      for (let i = 0; i <= np; i++) posts.push([aa + (ab - aa) * i / np, -(ta + (tb - ta) * i / np)]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    const map = tex(makeChainLinkCanvas(), 8);
    map.wrapS = THREE.RepeatWrapping;
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    mesh.renderOrder = 1;
    at(mesh, 0, 0, 0);
    // the posts, a little taller than the mesh
    const pg = new THREE.BoxGeometry(0.08, H + 0.3, 0.08);
    pg.translate(0, (H + 0.3) / 2, 0);
    const pm = new THREE.InstancedMesh(pg, new THREE.MeshLambertMaterial({ color: 0x8e9498 }), posts.length);
    const m = new THREE.Matrix4();
    posts.forEach(([x, z], i) => { m.makeTranslation(x, 0, z); pm.setMatrixAt(i, m); });
    pm.frustumCulled = false;                          // (the box's own bounds are at the frame's origin)
    at(pm, 0, 0, 0);
  },

  // ---------- the trees ----------
  climate(a) {
    for (const k in AIRPORT_CLIMATE) if (AIRPORT_CLIMATE[k].indexOf(a.id) >= 0) return k;
    const lat = Math.abs(a.lat);
    return a.arctic || lat >= 58 ? 'boreal' : lat < 20 ? 'tropical' : lat < 30 ? 'subtropical' : lat < 42 ? 'warm' : lat < 58 ? 'temperate' : 'boreal';
  },
  // the leaves of the deciduous trees this month at the airport: green, autumn or bare
  leaves(a, climate) {
    if (['boreal', 'larch', 'temperate', 'warm', 'steppe'].indexOf(climate) < 0 || Math.abs(a.lat) < 35) return 'green';
    let m = (Career.data && Career.data.season !== undefined) ? Career.data.season : 6;
    if (a.lat < 0) m = (m + 6) % 12;
    const north = climate === 'boreal' || climate === 'larch';
    if (north ? m >= 10 || m <= 3 : m === 11 || m <= 2) return 'bare';
    if (north ? m === 8 || m === 9 : m === 9 || m === 10) return 'autumn';
    return 'green';
  },

  trees(a, rec, at, quality) {
    const climate = this.climate(a), mix = TREE_MIXES[climate];
    const leaves = this.leaves(a, climate);
    const k = (quality && quality.aptTrees !== undefined ? quality.aptTrees : 1) * (mix.density || 1);
    const budget = Math.round((AIRPORT_TREES[a.terminal] || AIRPORT_TREES.small) * k);
    if (budget < 1) return;
    const L = LAYOUT, rng = makeRng(hashStr(a.id + '/trees')), r = a.apronRect;
    const t0 = -a.half - L.FENCE_BEYOND, t1 = a.half + L.FENCE_BEYOND;
    const roadA = L.TERMINAL + 52, c1 = Math.min(groundBox(a).aMax - 30, roadA + 130);
    const roads = landsideRoads(a);
    // where no tree may stand: [t0, t1, across0, across1]
    const keepOut = [[t0, t1, L.FENCE_FAR - 6, L.TERMINAL + 6]];                 // the airside
    keepOut.push([r.t0 - 70, r.t1, L.TERMINAL - 40, c1 + 4]);                   // the terminal, the kerb, the car park
    for (const b of a.landside || []) keepOut.push([b.t - b.along / 2 - 18, b.t + b.along / 2 + 18, b.across - b.acrossSize / 2 - 18, b.across + b.acrossSize / 2 + 16]);
    keepOut.push([r.t1 + 230, r.t1 + 290, roadA, 3000]);                       // the access road, on to the motorway
    const clear = (t, ac) => {
      if (Math.abs(t) > a.half && Math.abs(ac) < 230) return false;              // the approach and the climb-out
      for (const o of keepOut) if (t > o[0] && t < o[1] && ac > o[2] && ac < o[3]) return false;
      for (const road of roads) {
        for (let i = 0; i + 1 < road.length; i++) {
          const p = road[i], q = road[i + 1];
          if (distToSeg(t, ac, p[0], p[1], q[0], q[1]) < 17) return false;
        }
      }
      return true;
    };
    const place = [];
    // on solid ground: not the sea, a lake or a beach (the raw terrain, before the field is levelled)
    const ground = (t, ac) => {
      const p = World.at(a, t, ac);
      if (Terrain.rawAt(p.x, p.z) < 1.6) return null;
      const h = Terrain.heightAt(p.x, p.z);
      return h < 1.2 ? null : h - a.elev;
    };
    // the row along the landside road, where the ground texture has their shadows
    if (climate !== 'tundra') {
      for (let t = r.t0 - 200; t < r.t1 + 100 && place.length < budget * 0.25; t += 14) {
        const y = ground(t, c1 + 8);
        if (y !== null && clear(t, c1 + 8)) place.push([t, c1 + 8, y, true]);
      }
    }
    // a belt of trees along the outside of the far fence, broken where the noise says so
    const seed = hashStr(a.id) % 997;
    if (climate !== 'tundra') {
      // (spaced so that about a fifth of the trees run its whole length, half of it in gaps)
      const step = Math.max(8, (t1 - t0) * 0.55 / (budget * 0.2));
      for (let t = t0 + 40; t < t1 - 40 && place.length < budget * 0.6; t += step * rng.range(0.7, 1.3)) {
        if (fbm(t / 180 + seed, 3.7, 2) < 0.45) continue;
        const ac = L.FENCE_FAR - rng.range(26, 40), y = ground(t, ac);
        if (y !== null && clear(t, ac)) place.push([t, ac, y, false]);
      }
    }
    // copses and woods round the field: clumps of trees where the noise makes a grove, open
    // fields between them
    const zones = [
      [t0 - 300, t1 + 300, L.FENCE_FAR - 420, L.FENCE_FAR - 50],                 // beyond the far fence
      [t0 - 300, t1 + 300, c1 + 30, c1 + 380],                                    // behind the landside
      [t0 - 560, t0 - 50, L.FENCE_FAR - 420, c1 + 380],                           // past both ends
      [t1 + 50, t1 + 560, L.FENCE_FAR - 420, c1 + 380]
    ];
    const area = zones.map((z) => (z[1] - z[0]) * (z[3] - z[2]));
    for (let tries = 0; place.length < budget && tries < budget * 3; tries++) {
      const zz = zones[rng.weighted(zones.map((_, i) => i), (i) => area[i])];
      const ct = rng.range(zz[0], zz[1]), ca = rng.range(zz[2], zz[3]);
      const grove = fbm(ct / 260 + seed, ca / 260 - seed, 3);
      if (rng.next() > smoothstep(0.38, 0.6, grove)) continue;
      const n = rng.int(4, 14), rad = rng.range(10, 32);
      for (let k = 0; k < n && place.length < budget; k++) {
        const ang = rng.range(0, TAU), r = rad * Math.sqrt(rng.next());
        const t = ct + Math.cos(ang) * r, ac = ca + Math.sin(ang) * r;
        if (!clear(t, ac)) continue;
        const y = ground(t, ac);
        if (y !== null) place.push([t, ac, y, false]);
      }
    }
    if (!place.length) return;
    // deal the places out to the kinds of tree of the climate
    const kinds = mix.trees.map(([kind, w, h0, h1]) => ({ kind, w, h0, h1, list: [] }));
    for (const p of place) {
      const kd = p[3] && mix.street ? kinds.find((x) => x.kind === mix.street) || kinds[0] : rng.weighted(kinds, (x) => x.w);
      kd.list.push(p);
    }
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const tint = new THREE.Color();
    for (const kd of kinds) {
      if (!kd.list.length) continue;
      const geo = treeGeometry(kd.kind, leaves, quality && quality.treeDetail !== undefined ? quality.treeDetail : 1);
      const im = new THREE.InstancedMesh(geo, mat, kd.list.length);
      kd.list.forEach(([t, ac, y], i) => {
        const hgt = rng.range(kd.h0, kd.h1), wide = kd.kind === 'broad' ? rng.range(1.1, 1.4) : rng.range(0.85, 1.15);
        q.setFromAxisAngle(up, rng.range(0, TAU));
        v.set(ac + rng.range(-2, 2), y - 0.4, -t + rng.range(-2, 2));
        s.set(hgt * wide, hgt, hgt * wide);
        m.compose(v, q, s);
        im.setMatrixAt(i, m);
        const b = rng.range(0.82, 1.12);
        im.setColorAt(i, tint.setRGB(b, b * rng.range(0.96, 1.04), b));
      });
      im.frustumCulled = false;                        // (the unit tree's bounds are at the frame's origin)
      at(im, 0, 0, 0);
      (rec.trees = rec.trees || []).push(im);          // (hidden in the dark when the Auto quality sheds them: Scene3D.applyShed)
    }
  }
};

// the kinds of tree in each climate: [kind, weight, height from, to (metres)]; street: the kind
// along the landside road; density: how many of the airport's trees it grows
const TREE_MIXES = {
  tundra: { density: 0.3, trees: [['shrub', 1, 0.8, 2.2]] },
  boreal: { street: 'birch', trees: [['spruce', 0.45, 12, 24], ['pine', 0.25, 12, 21], ['birch', 0.3, 9, 16]] },
  larch: { street: 'birch', trees: [['larch', 0.45, 10, 22], ['pine', 0.2, 12, 20], ['birch', 0.3, 8, 14], ['spruce', 0.05, 12, 20]] },
  temperate: { street: 'oak', trees: [['oak', 0.45, 10, 20], ['birch', 0.15, 10, 16], ['spruce', 0.15, 14, 24], ['pine', 0.1, 12, 20], ['poplar', 0.15, 16, 26]] },
  warm: { street: 'poplar', trees: [['oak', 0.45, 8, 16], ['pine', 0.2, 10, 18], ['poplar', 0.15, 14, 24], ['cypress', 0.2, 8, 16]] },
  subtropical: { street: 'palm', trees: [['palm', 0.35, 9, 16], ['broad', 0.45, 8, 14], ['cypress', 0.1, 8, 14], ['shrub', 0.1, 1.5, 3]] },
  tropical: { street: 'palm', trees: [['palm', 0.45, 10, 20], ['broad', 0.55, 10, 20]] },
  mediterranean: { street: 'cypress', trees: [['cypress', 0.3, 8, 16], ['stonepine', 0.3, 9, 14], ['olive', 0.25, 4, 7], ['date', 0.15, 8, 13]] },
  desert: { density: 0.55, street: 'date', trees: [['date', 0.6, 8, 14], ['shrub', 0.4, 1.4, 3]] },
  steppe: { street: 'poplar', trees: [['poplar', 0.4, 16, 26], ['oak', 0.25, 8, 14], ['shrub', 0.25, 1.5, 3], ['pine', 0.1, 10, 16]] },
  savanna: { density: 0.75, street: 'acacia', trees: [['acacia', 0.55, 5, 10], ['eucalyptus', 0.25, 14, 24], ['shrub', 0.2, 1.5, 3]] },
  eucalypt: { street: 'eucalyptus', trees: [['eucalyptus', 0.6, 14, 28], ['broad', 0.25, 8, 14], ['palm', 0.15, 9, 15]] }
};

// the shortest distance from (x, y) to the segment p-q
function distToSeg(x, y, px, py, qx, qy) {
  const dx = qx - px, dy = qy - py, l2 = dx * dx + dy * dy;
  const k = l2 ? clamp(((x - px) * dx + (y - py) * dy) / l2, 0, 1) : 0;
  return Math.hypot(x - px - dx * k, y - py - dy * k);
}

// A chain-link fence, one square tile (the strip is FENCE_H tall): the diamonds of the wire,
// a rail along the top and a wire along the bottom, the rest see-through
function makeChainLinkCanvas() {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(196, 202, 206, 0.85)'; g.lineWidth = 1.3;
  for (let k = -64; k <= 64; k += 8) {
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 64, 64); g.stroke();
    g.beginPath(); g.moveTo(k + 64, 0); g.lineTo(k, 64); g.stroke();
  }
  g.fillStyle = 'rgba(150, 156, 160, 1)';
  g.fillRect(0, 0, 64, 3);            // the top rail (the canvas's top is the strip's top: v = 1)
  g.fillRect(0, 62, 64, 2);
  return cv;
}

// ---------- the trees, one of each kind ----------
// A tree one unit tall, its foot at the origin, vertex-coloured: the trunk and the crown in the
// colours of the kind (and of the season, for the deciduous ones); detail: how round the round
// crowns are (QUALITY's treeDetail: 0 = an icosahedron's 20 faces, 1 = 80)
const LEAF_COLOURS = {
  oak: { green: ['#4b7432', '#527c36', '#466e2f', '#5a8439'], autumn: ['#b8742a', '#c98f2e', '#a5552a', '#c9a23a'], bare: ['#6f6253', '#76695a', '#6a5e50', '#7b6e5e'] },
  birch: { green: ['#6e9a44', '#77a24a'], autumn: ['#d9b23c', '#e0c04a'], bare: ['#7d7266', '#857a6d'] },
  poplar: { green: ['#557d34'], autumn: ['#cfae3a'], bare: ['#6f6556'] },
  larch: { green: ['#6f9548', '#7aa052', '#83a85a'], autumn: ['#c9a03a', '#d4ad44', '#bf9230'], bare: ['#6b5e4c', '#72644f', '#786a55'] },
  broad: { green: ['#2f6a2a', '#357530', '#2b6226', '#3c7d33'] }
};
function treeGeometry(kind, leaves, detail) {
  const parts = [];
  const add = (geo, color, x, y, z, sx, sy, sz, rx, rz) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, 0, rz || 0)), new THREE.Vector3(sx || 1, sy || 1, sz || 1));
    g.applyMatrix4(m);
    parts.push({ g, color });
  };
  const trunk = (r0, r1, h, color, rz) => add(new THREE.CylinderGeometry(r0, r1, h, 6, 1), color, rz ? Math.sin(rz) * h / 2 : 0, h / 2, 0, 1, 1, 1, 0, -(rz || 0));
  const blob = (color, x, y, z, sx, sy, sz, d) => add(new THREE.IcosahedronGeometry(1, d === undefined ? (detail === undefined ? 1 : detail) : d), color, x, y, z, sx, sy, sz);
  const cone = (color, r, h, y) => add(new THREE.ConeGeometry(r, h, 7, 1), color, 0, y + h / 2, 0);
  const lc = (k) => (LEAF_COLOURS[k][leaves] || LEAF_COLOURS[k].green);
  switch (kind) {
    case 'spruce':
      trunk(0.025, 0.035, 0.2, '#4a3828');
      cone('#2c4a2a', 0.26, 0.42, 0.08); cone('#30502c', 0.2, 0.38, 0.32); cone('#355a30', 0.13, 0.36, 0.6);
      break;
    case 'larch': {
      const c = lc('larch');
      trunk(0.02, 0.032, 0.3, '#5a4330');
      cone(c[0], 0.2, 0.4, 0.12); cone(c[1], 0.15, 0.38, 0.36); cone(c[2], 0.09, 0.34, 0.62);
      break;
    }
    case 'pine':
      trunk(0.02, 0.035, 0.76, '#7a5032');
      blob('#36552e', 0, 0.8, 0, 0.2, 0.12, 0.2, 0); blob('#3a5a30', 0.09, 0.68, 0.05, 0.14, 0.09, 0.14, 0);
      blob('#33522c', -0.05, 0.92, -0.02, 0.12, 0.08, 0.12, 0);
      break;
    case 'birch': {
      const c = lc('birch');
      trunk(0.015, 0.025, 0.82, '#e6e2d8');
      blob(c[0], 0, 0.66, 0, 0.17, 0.3, 0.17); blob(c[1], 0.06, 0.46, 0.03, 0.12, 0.17, 0.12);
      break;
    }
    case 'oak': case 'broad': {
      const c = lc(kind);
      trunk(0.035, 0.055, 0.46, '#5a4330');
      blob(c[0], 0, 0.62, 0, 0.3, 0.24, 0.3); blob(c[1], 0.18, 0.55, 0.08, 0.2, 0.18, 0.2);
      blob(c[2], -0.16, 0.58, -0.1, 0.2, 0.18, 0.2); blob(c[3], 0.02, 0.82, 0.02, 0.18, 0.15, 0.18);
      break;
    }
    case 'poplar':
      trunk(0.02, 0.03, 0.26, '#6a5a48');
      blob(lc('poplar')[0], 0, 0.57, 0, 0.09, 0.43, 0.09);
      break;
    case 'cypress':
      trunk(0.015, 0.02, 0.1, '#4a3a2c');
      blob('#27402a', 0, 0.48, 0, 0.085, 0.46, 0.085);
      add(new THREE.ConeGeometry(0.04, 0.14, 6, 1), '#27402a', 0, 0.94, 0);
      break;
    case 'stonepine':
      trunk(0.025, 0.04, 0.74, '#6b4a32', 0.08);
      blob('#3a5530', 0.03, 0.82, 0, 0.42, 0.11, 0.42); blob('#3f5c33', 0.04, 0.9, 0.02, 0.3, 0.08, 0.3);
      break;
    case 'olive':
      trunk(0.05, 0.075, 0.36, '#6e6150');
      blob('#7b8a5c', 0, 0.58, 0, 0.42, 0.3, 0.42); blob('#859466', 0.16, 0.66, 0.1, 0.24, 0.2, 0.24);
      break;
    case 'shrub':
      blob(leaves === 'bare' ? '#6f6556' : '#5f6e3e', 0, 0.3, 0, 0.5, 0.32, 0.5, 0);
      blob(leaves === 'bare' ? '#776c5c' : '#677645', 0.25, 0.22, 0.12, 0.32, 0.22, 0.32, 0);
      break;
    case 'acacia':
      trunk(0.025, 0.04, 0.56, '#5e4a36', 0.1);
      add(new THREE.CylinderGeometry(0.06, 0.02, 0.3, 5, 1), '#5e4a36', 0.1, 0.62, 0, 1, 1, 1, 0, -0.7);
      add(new THREE.CylinderGeometry(0.5, 0.42, 0.08, 10, 1), '#5e7a34', 0.06, 0.74, 0);
      blob('#66833a', 0.06, 0.8, 0, 0.36, 0.05, 0.36, 0);
      break;
    case 'eucalyptus':
      trunk(0.02, 0.035, 0.86, '#d8d0c0', 0.04);
      blob('#7c9068', 0.04, 0.82, 0, 0.18, 0.13, 0.18, 0); blob('#83966e', -0.1, 0.66, 0.06, 0.14, 0.1, 0.14, 0);
      blob('#76895f', 0.12, 0.6, -0.06, 0.12, 0.09, 0.12, 0);
      break;
    case 'palm': case 'date': {
      // the trunk: segments leaning further out the higher they are (a coconut palm), or straight
      const lean = kind === 'palm' ? 0.14 : 0.02, n = 6, top = 0.86;
      let px = 0, py = 0;
      for (let i = 1; i <= n; i++) {
        const f = i / n, x = lean * f * f, y = top * f;
        const len = Math.hypot(x - px, y - py), ang = Math.atan2(x - px, y - py);
        const r = (kind === 'palm' ? 0.024 : 0.04) * (1.15 - f * 0.25);
        add(new THREE.CylinderGeometry(r * 0.92, r, len, 6, 1), kind === 'palm' ? '#8a7556' : '#7d6a4e', (px + x) / 2, (py + y) / 2, 0, 1, 1, 1, 0, -ang);
        px = x; py = y;
      }
      parts.push({ g: palmFronds(px, py, kind === 'palm' ? 9 : 12, kind === 'palm' ? 0.4 : 0.34, kind === 'palm' ? -0.16 : 0.07), color: kind === 'palm' ? '#4f7d2f' : '#6d7f45' });
      blob(kind === 'palm' ? '#6b5a2a' : '#8a6a30', px, py - 0.02, 0, 0.04, 0.035, 0.04, 0);
      break;
    }
    default:
      blob('#4b7432', 0, 0.5, 0, 0.3, 0.4, 0.3);
  }
  return mergeColoured(parts);
}

// the fronds of a palm round its crown at (x, y): `n` strips arching out `len` and drooping by
// `droop` at the tips (stiff and rising a little on a date palm)
function palmFronds(x, y, n, len, droop) {
  const pos = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + (i % 2) * 0.2, ca = Math.cos(a), sa = Math.sin(a);
    const pts = [0, 0.33, 0.66, 1].map((f) => {
      const r = len * f, h = 0.08 * Math.sin(f * Math.PI) + droop * f * f + (i % 3 - 1) * 0.02 * f;
      return { x: x + ca * r, y: y + h, z: sa * r, w: 0.05 * (1 - f * 0.8) };
    });
    for (let k = 0; k + 1 < pts.length; k++) {
      const p = pts[k], q = pts[k + 1];
      const pl = [p.x - sa * p.w, p.y, p.z + ca * p.w], pr = [p.x + sa * p.w, p.y, p.z - ca * p.w];
      const ql = [q.x - sa * q.w, q.y, q.z + ca * q.w], qr = [q.x + sa * q.w, q.y, q.z - ca * q.w];
      pos.push(...pl, ...pr, ...qr, ...pl, ...qr, ...ql);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// one geometry of non-indexed parts, each in its own colour (linear, for the vertex colours)
function mergeColoured(parts) {
  let n = 0;
  for (const p of parts) n += p.g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const c = new THREE.Color();
  let o = 0;
  for (const p of parts) {
    c.set(p.color).convertSRGBToLinear();
    const cnt = p.g.attributes.position.count;
    pos.set(p.g.attributes.position.array, o * 3);
    if (!p.g.attributes.normal) p.g.computeVertexNormals();
    nor.set(p.g.attributes.normal.array, o * 3);
    for (let i = 0; i < cnt; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
    o += cnt;
    p.g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeBoundingSphere();
  return geo;
}
