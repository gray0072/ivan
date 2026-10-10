'use strict';

// ============================================================
// World Aviation — the lights on the ground at night, for the
// whole area of a flight (Scene3D builds them with the far
// terrain and fades them in after dusk):
//   - the real towns and cities of data/cities.js: a bright core,
//     streets running out of it, sodium orange with white in the
//     middle, the size from the population;
//   - roads: strings of lights between neighbouring cities and
//     from each airport to its city;
//   - villages scattered over the land within 160 km of the route
//     (fewer in the Arctic, the deserts and the mountains), made up
//     but the same on every flight over the same place.
// The points are shared out: half for the cities, a fifth for the
// roads, the rest for the villages.
// One THREE.Points object of a fixed pixel size: a few thousand
// to some tens of thousands of points (QUALITY.groundLights).
// ============================================================

// the colours of the lights (visual only)
const LIGHT_COLS = {
  sodium: [1.0, 0.68, 0.32],     // street lights
  white: [1.0, 0.93, 0.78],      // the centre, shops, flood-lit squares
  cold: [0.78, 0.86, 1.0],       // a few LED and mercury lamps
  road: [1.0, 0.6, 0.25]         // the roads between the towns
};

const GroundLights = {
  points: null,

  build(scene, quality) {
    if (this.points) { scene.remove(this.points); this.points.geometry.dispose(); this.points = null; }
    const tg = Terrain.g, budget = quality.groundLights || 0;
    if (!tg || !budget) return;
    const S = WORLD.SCALE * 1000;                       // world metres per real km
    const x0 = tg.x0, z0 = tg.z0, x1 = tg.x0 + (tg.w - 1) * tg.cell, z1 = tg.z0 + (tg.h - 1) * tg.cell;
    const inBox = (x, z, m) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m;
    const rng = makeRng(Math.round(Theatre.lat0 * 1000) * 7919 + Math.round(Theatre.lon0 * 1000));
    const pos = [], col = [];
    let cap = 0;                                        // the points this pass may still add
    const add = (x, z, c, b) => {
      if (cap <= 0 || !inBox(x, z, 0)) return;
      const h = Terrain.heightAt(x, z);
      if (h <= 0.6) return;                             // no lights on the water
      cap--;
      pos.push(x, h + 3, z);
      col.push(c[0] * b, c[1] * b, c[2] * b);
    };
    // the route of this flight: the villages are kept to a corridor along it, where they are seen
    const ends = (World.key || '').split('>').map((id) => World.here && World.here[id]).filter(Boolean);
    const routeDist = ends.length === 2
      ? (x, z) => pointSegDist(x, z, ends[0].x, ends[0].z, ends[1].x, ends[1].z) : () => 0;

    // ---- the cities (half the points), the biggest first
    const cities = [];
    for (const [, lat, lon, pop] of CITIES) {
      const p = Theatre.toWorld(lat, lon);
      if (inBox(p.x, p.z, 50 * S)) cities.push({ x: p.x, z: p.z, pop, n: clamp(140 + 620 * Math.sqrt(pop), 90, 3200) });
    }
    cities.sort((a, b) => b.pop - a.pop);
    const cityShare = budget * 0.5, cityWant = cities.reduce((t, c) => t + c.n, 0) || 1;
    const ck = Math.min(1.6, cityShare / cityWant);
    for (const c of cities) {
      cap = Math.round(c.n * ck);
      const R = (1.6 + 6.5 * Math.sqrt(c.pop)) * S;     // the built-up area
      const arms = 4 + Math.round(Math.sqrt(c.pop) * 3);
      const armA = []; for (let i = 0; i < arms; i++) armA.push(rng.range(0, TAU));
      for (let i = 0, n = cap * 1.4; i < n && cap > 0; i++) {
        let r, a;
        if (rng.chance(0.3)) {
          // along a street out of the centre
          a = rng.pick(armA) + rng.range(-0.03, 0.03);
          r = R * 1.25 * Math.pow(rng.next(), 0.8);
        } else {
          // the town itself: dense in the middle, thinning out
          a = rng.range(0, TAU);
          r = R * Math.min(1.3, Math.sqrt(-2 * Math.log(Math.max(1e-6, rng.next()))) / 2.2);
        }
        const kind = r < R * 0.3 && rng.chance(0.55) ? LIGHT_COLS.white : rng.chance(0.06) ? LIGHT_COLS.cold : LIGHT_COLS.sodium;
        add(c.x + Math.cos(a) * r, c.z + Math.sin(a) * r, kind, rng.range(0.7, 1));
      }
    }

    // ---- the roads (a fifth): each city to its two nearest neighbours, each airport to its city
    const roads = [];
    const seen = new Set();
    cities.forEach((c, i) => {
      cities.map((o, j) => ({ j, d: Math.hypot(o.x - c.x, o.z - c.z) }))
        .filter((o) => o.j !== i && o.d < 320 * S).sort((p, q) => p.d - q.d).slice(0, 2)
        .forEach((o) => {
          const key = Math.min(i, o.j) + '-' + Math.max(i, o.j);
          if (!seen.has(key)) { seen.add(key); roads.push([c.x, c.z, cities[o.j].x, cities[o.j].z, o.d]); }
        });
    });
    for (const a of World.airports) {
      if (!inBox(a.x, a.z, 0)) continue;
      let best = null, bd = 80 * S;
      for (const c of cities) { const d = Math.hypot(c.x - a.x, c.z - a.z); if (d < bd) { bd = d; best = c; } }
      if (best) roads.push([a.x, a.z, best.x, best.z, bd]);
    }
    const roadLen = roads.reduce((t, r) => t + r[4], 0);
    cap = Math.round(budget * 0.2);
    const step = Math.max(0.5 * S, roadLen / Math.max(1, cap));
    for (const [ax, az, bx, bz, len] of roads) {
      const nx = -(bz - az) / (len || 1), nz = (bx - ax) / (len || 1);
      const wig = rng.range(0.02, 0.06) * len, f = rng.range(1, 3);
      for (let d = 0; d <= len; d += step * rng.range(0.6, 1.4)) {
        const t = d / len, off = Math.sin(t * Math.PI * f) * wig * Math.sin(t * Math.PI);
        add(ax + (bx - ax) * t + nx * off, az + (bz - az) * t + nz * off, LIGHT_COLS.road, rng.range(0.45, 0.8));
      }
    }

    // ---- the villages (the rest), within 160 km of the route, each from the dice of its own
    // cell so they stay put
    const cell = 11 * S, reach = 160 * S;
    const villages = [];
    for (let cz = Math.floor(z0 / cell); cz * cell < z1; cz++) {
      for (let cx = Math.floor(x0 / cell); cx * cell < x1; cx++) {
        const cr = makeRng((cx * 73856093) ^ (cz * 19349663) ^ 0x5f3759df);
        const x = (cx + cr.next()) * cell, z = (cz + cr.next()) * cell;
        if (routeDist(x, z) > reach) continue;
        const h = Terrain.rawAt(x, z);
        if (h <= 1 || h > 1600) continue;
        const g = Theatre.toGeo(x, z), alat = Math.abs(g.lat);
        const lat = alat > 72 ? 0.03 : alat > 66 ? 0.25 : alat > 62 ? 0.6 : 1;
        const chance = 0.35 * lat * (1 - 0.85 * desertAt(g.lat, g.lon)) * (1 - smoothstep(600, 1600, h));
        if (cr.next() > chance) continue;
        villages.push({ x, z, cr, n: 6 + cr.next() * 24, r: (0.4 + cr.next() * 1.2) * S });
      }
    }
    cap = budget - pos.length / 3;
    const vk = Math.min(1.5, cap / Math.max(1, villages.reduce((t, v) => t + v.n, 0)));
    for (const v of villages) {
      for (let i = 0, n = Math.round(v.n * vk); i < n; i++) {
        const a = v.cr.next() * TAU, d = v.r * Math.sqrt(v.cr.next());
        add(v.x + Math.cos(a) * d, v.z + Math.sin(a) * d, v.cr.next() < 0.8 ? LIGHT_COLS.sodium : LIGHT_COLS.white, 0.55 + v.cr.next() * 0.4);
      }
    }

    if (!pos.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: true
    }));
    this.points.frustumCulled = false;
    this.points.visible = false;
    scene.add(this.points);
  },

  // dark: 0 by day, 1 at night
  // half: the Auto quality has shed half of them (AUTO_QUALITY): the cities' half is drawn, the
  // roads and the villages (the points' second half) are left out
  update(dark, half) {
    if (!this.points) return;
    const m = this.points.material;
    m.opacity = smoothstep(0.05, 0.6, dark);
    m.size = 1.8 + 1.0 * dark;
    this.points.visible = m.opacity > 0.01;
    this.points.geometry.setDrawRange(0, half ? Math.ceil(this.count() / 2) : Infinity);
  },

  count() { return this.points ? this.points.geometry.attributes.position.count : 0; }
};
