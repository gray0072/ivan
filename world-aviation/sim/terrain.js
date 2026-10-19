'use strict';

// ============================================================
// World Aviation — terrain: the heightmap of one flight's part
// of the world.
//
// Every flight projects the world around its route (Theatre in
// utils.js) and builds a heightmap of that area from the coastline
// polygons, inland water and mountain ranges in geodata.js, plus
// fBm noise keyed on latitude and longitude (so a place looks the
// same on every flight). Detail noise is added when the height is
// sampled, airports are flattened to their elevation, and corridors
// keep the approaches and departures clear.
// The land's colours follow its climate (Terrain.lookAt): the
// deserts' sand, the steppe's and the Mediterranean's dry grass,
// the tropics' deep green, the tundra past the tree line, and the
// winter's snow by the month; round each airport its own climate
// (Terrain.climateOf, the one its trees grow in) takes over.
// ============================================================

const TERRAIN = {
  maxSdfKm: 90,       // distances to the coast beyond this saturate
  aptGrid: null, aptGridCell: 20000,
  cityGrid: null, cityGridCell: 40000, cityKey: '',   // the real cities in a grid (urbanAt)
  // the ground round each airport brought to its real elevation (fitAirports): what is more than
  // fitSlackM off it, fully within fitInnerM and fading out by fitOuterM
  fitSlackM: 150, fitInnerM: 15000, fitOuterM: 60000
};

const Terrain = {
  built: false,
  g: null,            // the grid: {x0, z0, cell (world m), cellKm, w, h, height}
  month: 6,           // the month of the flight's world (0 = January; Career.data.season): the snow

  // Build the heightmap for a box of world metres {x0, x1, z0, z1}
  build(box) {
    const S = WORLD.SCALE * 1000;                       // world metres per real km
    const spanKm = Math.max(box.x1 - box.x0, box.z1 - box.z0) / S;
    const cellKm = clamp(spanKm / WORLD.CELLS_ACROSS, WORLD.CELL_MIN_KM, WORLD.CELL_MAX_KM);
    const cell = cellKm * S;
    const w = Math.ceil((box.x1 - box.x0) / cell) + 1;
    const h = Math.ceil((box.z1 - box.z0) / cell) + 1;
    const g = { x0: box.x0, z0: box.z0, cell, cellKm, w, h };
    const xAt = (i) => g.x0 + i * cell, zAt = (j) => g.z0 + j * cell;

    // --- project the polygons and keep the ones that reach the box
    const reach = TERRAIN.maxSdfKm * S * 1.2;
    const project = (poly) => {
      const pts = poly.map((p) => { const q = Theatre.toWorld(p[1], p[0]); return [q.x, q.z]; });
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      if (x1 < box.x0 - reach || x0 > box.x1 + reach || z1 < box.z0 - reach || z0 > box.z1 + reach) return null;
      return pts;
    };
    const land = LAND_POLYGONS.map(project).filter(Boolean);
    const water = WATER_POLYGONS.map(project).filter(Boolean);

    // --- land or water: a scanline fill, one row at a time
    const isLand = new Uint8Array(w * h);
    const xs = [];
    const fillRow = (pts, z, row, value) => {
      xs.length = 0;
      for (let i = 0, k = pts.length - 1; i < pts.length; k = i++) {
        const zi = pts[i][1], zk = pts[k][1];
        if ((zi > z) === (zk > z)) continue;
        xs.push(pts[i][0] + (z - zi) * (pts[k][0] - pts[i][0]) / (zk - zi));
      }
      if (xs.length < 2) return;
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const i0 = Math.max(0, Math.ceil((xs[k] - g.x0) / cell)), i1 = Math.min(w - 1, Math.floor((xs[k + 1] - g.x0) / cell));
        for (let i = i0; i <= i1; i++) isLand[row + i] = value;
      }
    };
    for (let j = 0; j < h; j++) {
      const z = zAt(j);
      for (const p of land) fillRow(p, z, j * w, 1);
      for (const p of water) fillRow(p, z, j * w, 0);
    }

    // --- the coast: every edge of land and water, bucketed by rows for the distance search
    const segs = [];
    for (const pts of land.concat(water)) {
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        segs.push({ ax: a[0], az: a[1], bx: b[0], bz: b[1], z0: Math.min(a[1], b[1]), z1: Math.max(a[1], b[1]) });
      }
    }
    const coastReach = TERRAIN.maxSdfKm * S;

    // --- the mountains: ridge segments with their height and reach
    const ridges = [];
    for (const range of RANGES) {
      const pts = range.map((p) => { const q = Theatre.toWorld(p[1], p[0]); return { x: q.x, z: q.z, hgt: p[2], wid: p[3] * S }; });
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1];
        const r = Math.max(a.wid, b.wid) * 1.8;
        if (Math.max(a.x, b.x) < box.x0 - r || Math.min(a.x, b.x) > box.x1 + r ||
          Math.max(a.z, b.z) < box.z0 - r || Math.min(a.z, b.z) > box.z1 + r) continue;
        ridges.push({ a, b, z0: Math.min(a.z, b.z) - r, z1: Math.max(a.z, b.z) + r });
      }
    }

    const height = new Float32Array(w * h);
    for (let j = 0; j < h; j++) {
      const z = zAt(j);
      const rowSegs = segs.filter((s) => s.z1 > z - coastReach && s.z0 < z + coastReach);
      const rowRidges = ridges.filter((r) => r.z1 > z && r.z0 < z);
      for (let i = 0; i < w; i++) {
        const x = xAt(i);
        // distance to the coast, real km
        let d = coastReach;
        for (let k = 0; k < rowSegs.length; k++) {
          const s = rowSegs[k];
          const dd = segDist(x, z, s.ax, s.az, s.bx, s.bz);
          if (dd < d) d = dd;
        }
        const sdf = (isLand[j * w + i] ? 1 : -1) * Math.min(d / S, TERRAIN.maxSdfKm);
        // the mountains here: the strongest ridge, 0..~1 of 1800 m
        let mtn = 0;
        for (let k = 0; k < rowRidges.length; k++) {
          const r = rowRidges[k], a = r.a, b = r.b;
          const dx = b.x - a.x, dz = b.z - a.z;
          const len2 = dx * dx + dz * dz || 1;
          const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / len2, 0, 1);
          const dd = Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz));
          const wid = lerp(a.wid, b.wid, t);
          if (dd > wid * 1.8) continue;
          const v = (1 - smoothstep(wid * 0.5, wid * 1.8, dd)) * lerp(a.hgt, b.hgt, t) / 1800;
          if (v > mtn) mtn = v;
        }
        const geo = Theatre.toGeo(x, z);
        height[j * w + i] = elevation(sdf, mtn, geo.lon, geo.lat);
      }
    }
    g.height = height;
    this.g = g;
    this.built = true;
  },

  // bilinear height of the grid, world metres
  rawAt(x, z) {
    const g = this.g;
    if (!g) return 0;
    const fx = clamp((x - g.x0) / g.cell, 0, g.w - 1.001);
    const fz = clamp((z - g.z0) / g.cell, 0, g.h - 1.001);
    const ix = Math.floor(fx), iz = Math.floor(fz), tx = fx - ix, tz = fz - iz;
    const s = g.height, w = g.w;
    return lerp(lerp(s[iz * w + ix], s[iz * w + ix + 1], tx),
      lerp(s[(iz + 1) * w + ix], s[(iz + 1) * w + ix + 1], tx), tz);
  },

  // Terrain height in world metres. `taper` (optional, for the rendered near mesh only) fades
  // the detail out towards the edge of the near mesh so it meets the far mesh seamlessly.
  heightAt(x, z, taper) {
    const raw = this.rawAt(x, z);
    let h = raw;
    if (raw > 1) {
      const amp = clamp(raw / 220, 0.1, 1);
      let d = (fbm(x / 2600, z / 2600, 2) - 0.5) * 66 * amp;
      d += (fbm(x / 700 + 11, z / 700 - 7, 2) - 0.5) * 15 * amp;
      h = Math.max(1.2, raw + d);
    }
    h = this.flattenAirports(x, z, h);
    if (taper) {
      const k = 1 - smoothstep(taper.half * 0.55, taper.half * 0.98, Math.hypot(x - taper.cx, z - taper.cz));
      if (k < 1) h = lerp(this.farHeight(x, z), h, k);
    }
    return h;
  },

  // What an aeroplane can hit: the ground, or the water over the sea and lake beds (the beds
  // are below sea level, under the water plane the renderer draws at the surface)
  surfaceAt(x, z) { return Math.max(this.heightAt(x, z), WORLD.SEA_LEVEL); },

  // The far mesh sits a little under the real ground so the near mesh always wins
  farHeight(x, z) {
    const h = this.flattenAirports(x, z, this.rawAt(x, z));
    return h > 1 ? Math.max(1, h - 30) : h;
  },

  // A vertex of the far mesh (cells of `cell` metres). It is under the ground at its own spot,
  // but a big triangle between a low coastal field and the hills around it can still pass over
  // the airport (Kalmar: 2 m over the apron, hiding it). So every vertex of a triangle that
  // can reach an airport's ground goes under that field's elevation (never into the sea).
  farVertexHeight(x, z, cell) {
    let h = this.farHeight(x, z);
    if (h <= 0.5 || !TERRAIN.aptList) return h;
    for (const a of TERRAIN.aptList) {
      const r = a.rwyLen / 2 + 2000 + cell * 1.5;
      const dx = x - a.x, dz = z - a.z;
      if (dx * dx + dz * dz < r * r) h = Math.min(h, Math.max(0.5, a.elev - 30));
    }
    return h;
  },

  normalAt(x, z, out) {
    const d = 45;
    const hx = this.heightAt(x + d, z) - this.heightAt(x - d, z);
    const hz = this.heightAt(x, z + d) - this.heightAt(x, z - d);
    const nx = -hx, ny = 2 * d, nz = -hz;
    const len = Math.hypot(nx, ny, nz) || 1;
    if (out) { out.x = nx / len; out.y = ny / len; out.z = nz / len; return out; }
    return { x: nx / len, y: ny / len, z: nz / len };
  },

  // The map data is coarse (a coast point every degree or two, mountain ranges as straight
  // ridges hundreds of km wide), so the ground it makes round an airport can be far off the
  // airport's real elevation — Delhi on a Himalayan foothill, Mexico City in a pit 2 km deep,
  // Bogotá on a table. Each airport's elevation is real: where the ground 2-6 km round it
  // (the median) is more than fitSlackM off it, the land round it is moved by the excess, fully
  // within fitInnerM and fading out by fitOuterM, so the ground near a field keeps its relief
  // relative to the field and the mountains further off stay where the data puts them. The sea
  // stays sea; overlapping airports share the correction by weight.
  fitAirports(airports) {
    const g = this.g;
    if (!g) return;
    const fits = [];
    for (const a of airports) {
      const hs = [];
      for (const rad of [2000, 4000, 6000]) for (let k = 0; k < 12; k++) {
        const q = k / 12 * Math.PI * 2;
        hs.push(this.rawAt(a.x + Math.sin(q) * rad, a.z - Math.cos(q) * rad));
      }
      hs.sort((p, q) => p - q);
      const h0 = hs[hs.length >> 1];
      if (h0 <= 0.5) continue;                          // a field by the sea: nothing to fit to
      const off = a.elev - h0;
      if (Math.abs(off) <= TERRAIN.fitSlackM) continue;
      fits.push({ x: a.x, z: a.z, off: off - Math.sign(off) * TERRAIN.fitSlackM });
    }
    if (!fits.length) return;
    const R0 = TERRAIN.fitInnerM, R1 = TERRAIN.fitOuterM;
    for (let j = 0; j < g.h; j++) {
      const z = g.z0 + j * g.cell;
      for (let i = 0; i < g.w; i++) {
        const k = j * g.w + i, h = g.height[k];
        if (h <= 0.5) continue;
        const x = g.x0 + i * g.cell;
        let wSum = 0, sum = 0;
        for (const f of fits) {
          const dx = x - f.x, dz = z - f.z;
          if (Math.abs(dx) > R1 || Math.abs(dz) > R1) continue;
          const w = 1 - smoothstep(R0, R1, Math.hypot(dx, dz));
          if (w > 0) { wSum += w; sum += w * f.off; }
        }
        if (wSum > 0) g.height[k] = Math.max(1.2, h + sum / Math.max(1, wSum));
      }
    }
  },

  // Airports bucketed into a coarse grid so heightAt stays cheap
  buildAirportGrid(airports) {
    const cell = TERRAIN.aptGridCell;
    const grid = new Map();
    airports.forEach((a, i) => {
      const r = Math.sqrt(a.flattenR2) + 2000;
      const x0 = Math.floor((a.x - r) / cell), x1 = Math.floor((a.x + r) / cell);
      const z0 = Math.floor((a.z - r) / cell), z1 = Math.floor((a.z + r) / cell);
      for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
        const key = (cx + 40000) * 200000 + (cz + 40000);
        let list = grid.get(key);
        if (!list) grid.set(key, list = []);
        list.push(i);
      }
    });
    TERRAIN.aptGrid = grid;
    TERRAIN.aptList = airports;
    // round each airport the land looks as its own climate (lookAt)
    TERRAIN.climPatches = airports.map((a) => ({ x: a.x, z: a.z, look: CLIMATE_LOOK[this.climateOf(a)] })).filter((p) => p.look);
  },

  // ---------- the climate ----------
  // The climate of an airport: the trees outside its fence (render/perimeter3d.js), its grass
  // (render/airport3d.js) and the land round it (lookAt). AIRPORT_CLIMATE (data/airports.js)
  // where the latitude alone would get it wrong, else the latitude: tropical under 20°,
  // subtropical to 30°, warm to 42°, temperate to 58°, boreal north of it and at every Arctic field
  climateOf(a) {
    for (const k in AIRPORT_CLIMATE) if (AIRPORT_CLIMATE[k].indexOf(a.id) >= 0) return k;
    const lat = Math.abs(a.lat);
    return a.arctic || lat >= 58 ? 'boreal' : lat < 20 ? 'tropical' : lat < 30 ? 'subtropical' : lat < 42 ? 'warm' : 'temperate';
  },

  // How the land looks at (x, z), h metres up, in the flight's month, each 0..1 (into out):
  //   trop    the lush tropics
  //   dry     the desert's sand and scrub
  //   arid    dry grass: the steppe, the Mediterranean, the savanna
  //   tundra  moss and lichen past the tree line
  //   wild    how much of the farmland gives way to the land's own ground (render/landcover.js)
  //   snow    the winter's snow on the ground (its mean: colorAt breaks it into patches at the edge)
  // From the latitude and the regions below (DESERTS, ARID_LANDS, TREE_LINE); within
  // LANDSCAPE.CLIMATE_NEAR_M of an airport its own climate (climateOf) takes over, so the
  // ground round the field matches its grass and its trees. The snow comes from the month's
  // mean temperature there (seasonTemp in sim/world.js), colder up high, past the tree line and
  // in the heart of the continents in winter.
  lookAt(x, z, h, out) {
    const geo = Theatre.toGeo(x, z);
    return this.lookGeo(geo.lat, geo.lon, x, z, h, out || {});
  },
  lookGeo(lat, lon, x, z, h, out) {
    const alat = Math.abs(lat);
    let dry = boxesAt(DESERTS, lat, lon), arid = boxesAt(ARID_LANDS, lat, lon);
    let tundra = lat > 0 ? smoothstep(-1.5, 1.5, lat - treeLine(lon)) : 0;
    const P = TERRAIN.climPatches;
    if (P) {
      const R0 = LANDSCAPE.CLIMATE_NEAR_M[0], R1 = LANDSCAPE.CLIMATE_NEAR_M[1];
      for (let i = 0; i < P.length; i++) {
        const p = P[i], dx = x - p.x, dz = z - p.z, d2 = dx * dx + dz * dz;
        if (d2 >= R1 * R1) continue;
        const w = 1 - smoothstep(R0, R1, Math.sqrt(d2)), L = p.look;
        dry = lerp(dry, L.dry, w); arid = lerp(arid, L.arid, w); tundra = lerp(tundra, L.tundra, w);
      }
    }
    arid *= 1 - dry;
    tundra *= 1 - dry;
    const season = Math.cos((this.month - 6.5) / 12 * TAU) * (lat < 0 ? -1 : 1);   // +1 midsummer, -1 midwinter
    const winter = winterAt(lat, lon);
    const temp = seasonTemp(lat, season) - Math.max(0, h) * 0.0065 + winter * (0.5 - 0.5 * season) -
      LANDSCAPE.TUNDRA_COLD * tundra * (1 - smoothstep(0, 4, winter));
    out.trop = smoothstep(18, 8, alat);
    out.dry = dry; out.arid = arid; out.tundra = tundra;
    out.wild = clamp(dry + tundra + 0.65 * arid, 0, 1);
    out.snow = smoothstep(LANDSCAPE.SNOW_T[0], LANDSCAPE.SNOW_T[1], temp) * (1 - 0.7 * dry) * (1 - 0.3 * arid);
    return out;
  },

  // The land's own colour where nothing is grown on it (0..255, the vertex colours' linear
  // scale, into out): the woods and meadows of the latitude, the tropics' deep green, dry grass
  // (golden nearer the equator), sand, the tundra's olive-brown moss. L: lookAt's; n: noise 0..1
  groundRGB(L, alat, n, out) {
    const birch = smoothstep(63, 56, alat) * 0.65 + 0.12;
    let r = lerp(30, 104, birch) + n * 20, g = lerp(62, 122, birch) + n * 24, b = lerp(36, 66, birch) + n * 14;
    r = lerp(r, 26, L.trop); g = lerp(g, 72, L.trop); b = lerp(b, 30, L.trop);
    const sav = smoothstep(26, 14, alat), k = L.arid * 0.85;
    r = lerp(r, lerp(150, 174, sav) + n * 22, k); g = lerp(g, lerp(138, 146, sav) + n * 18, k); b = lerp(b, lerp(84, 78, sav) + n * 12, k);
    r = lerp(r, 196 + n * 20, L.dry); g = lerp(g, 168 + n * 18, L.dry); b = lerp(b, 118 + n * 14, L.dry);
    r = lerp(r, 88 + n * 26, L.tundra); g = lerp(g, 94 + n * 22, L.tundra); b = lerp(b, 52 + n * 12, L.tundra);
    out[0] = r; out[1] = g; out[2] = b;
    return out;
  },

  // Flatten the ground around every airport so runways are level
  flattenAirports(x, z, h) {
    if (!TERRAIN.aptGrid) return h;
    const cx = Math.floor(x / TERRAIN.aptGridCell), cz = Math.floor(z / TERRAIN.aptGridCell);
    const list = TERRAIN.aptGrid.get((cx + 40000) * 200000 + (cz + 40000));
    if (!list) return h;
    for (let k = 0; k < list.length; k++) {
      const a = TERRAIN.aptList[list[k]];
      const dx = x - a.x, dz = z - a.z;
      if (dx * dx + dz * dz > a.flattenR2) continue;
      const along = dx * a.dirX + dz * a.dirZ;
      const across = dx * a.perX + dz * a.perZ;
      // the airport itself: level at the field elevation
      // (and whatever stands past the runway's ends: a short strip's apron runs on beyond it)
      const halfLen = Math.max(a.rwyLen / 2 + 500, (a.tMax || 0) + 300, -(a.tMin || 0) + 300);
      const blend = 5000;
      const tAlong = smoothstep(halfLen, halfLen + blend, Math.abs(along));
      const tAcross = smoothstep(1400, 1400 + blend, Math.abs(across - LAYOUT.TERMINAL / 2));
      const t = Math.max(tAlong, tAcross);
      if (t < 1) h = lerp(a.elev, h, smoothstep(0, 1, t));
      // the approach and departure corridors: the ground stays under a gentle slope rising
      // away from each runway end, so the glideslope and the climb-out are always clear
      const before = -along - a.half, beyond = along - a.half;
      const dist = Math.max(before, beyond);
      if (dist > 0 && dist < LAYOUT.CORRIDOR_LEN && h > a.elev) {
        const halfW = LAYOUT.CORRIDOR_HALF_WIDTH + dist * 0.12;
        const k = (1 - smoothstep(halfW, halfW + 2500, Math.abs(across))) *
          (1 - smoothstep(LAYOUT.CORRIDOR_LEN * 0.8, LAYOUT.CORRIDOR_LEN, dist));
        if (k > 0) {
          const slope = Math.tan((before > 0 ? LAYOUT.APPROACH_SLOPE_DEG : LAYOUT.DEPARTURE_SLOPE_DEG) * DEG);
          // (before the threshold also 1 000 ft under the level flight to the glide path, where the
          // autopilot no longer looks out for the terrain: under the slope alone a hill came within
          // 200 ft of it 10 nm out)
          let cap = a.elev + Math.max(0, dist - 1500) * slope;
          if (before > 0) cap = Math.min(cap, a.elev + LAYOUT.APPROACH_FLOOR_FT * FT);
          if (h > cap) h = lerp(h, cap, k);
        }
      }
    }
    return h;
  },

  // How much of a real city (data/cities.js, when loaded) covers (x, z), 0..1: its built-up
  // area, ragged at the edge (n: noise 0..1). The cities of the flight's world are put in a grid
  // the first time it is asked.
  urbanAt(x, z, n) {
    if (typeof CITIES === 'undefined') return 0;
    const T = TERRAIN, cell = T.cityGridCell, key = Theatre.lat0 + ',' + Theatre.lon0 + ',' + Theatre.sin0;
    if (T.cityKey !== key) {
      T.cityKey = key;
      T.cityGrid = new Map();
      const S = WORLD.SCALE * 1000;
      for (const [, lat, lon, pop] of CITIES) {
        const p = Theatre.toWorld(lat, lon), R = (1 + 4 * Math.sqrt(pop)) * S;
        if (Math.abs(p.x) > 6e6 || Math.abs(p.z) > 6e6) continue;
        const c = { x: p.x, z: p.z, R };
        for (let cx = Math.floor((p.x - R) / cell); cx <= Math.floor((p.x + R) / cell); cx++) {
          for (let cz = Math.floor((p.z - R) / cell); cz <= Math.floor((p.z + R) / cell); cz++) {
            const k = cx * 100003 + cz;
            if (!T.cityGrid.has(k)) T.cityGrid.set(k, []);
            T.cityGrid.get(k).push(c);
          }
        }
      }
    }
    const list = T.cityGrid.get(Math.floor(x / cell) * 100003 + Math.floor(z / cell));
    if (!list) return 0;
    let u = 0;
    for (const c of list) {
      const d = Math.hypot(x - c.x, z - c.z) * (0.8 + 0.4 * n);
      if (d < c.R) u = Math.max(u, 1 - smoothstep(c.R * 0.5, c.R, d));
    }
    return u * 0.9;
  },

  // Vertex colour for terrain, written into out[0..2] as 0..255. land (optional, for the
  // renderer's land cover, render/landcover.js) gets [patch, woods, urban, wild, bare], each
  // 0..1: how much of the land cover shows (none on the water, the beaches, rock or the
  // mountains' snow), how wooded the country is, how much of a real city is here, how much of
  // the farmland gives way to the land's own ground (the desert, the tundra, the winter's snow:
  // lookAt's wild), and how bare of trees the land is (the desert, the tundra).
  colorAt(x, z, h, slope, out, land) {
    const geo = Theatre.toGeo(x, z);
    const alat = Math.abs(geo.lat);
    const n1 = fbm(x / 5200 + 21, z / 5200 - 13, 3);
    const n2 = fbm(x / 1100 - 5, z / 1100 + 7, 2);
    // (wild and bare on the water and the beaches too: the far mesh's triangles reach from them
    // to the land, and a wild of 0 there showed half the fields over the desert or the tundra)
    const L = this.lookGeo(geo.lat, geo.lon, x, z, h, TERRAIN_LOOK);
    let r, g, b, patch = 0, woods = 0, wild = L.wild, bare = clamp(L.dry + L.tundra, 0, 1);
    if (h < 0.5) {
      r = 44 + n1 * 20; g = 54 + n1 * 24; b = 58 + n1 * 18;
    } else {
      // beaches along the coast (the raw ground's low there: not a low airfield levelled inland,
      // which stood in the sand at Singapore)
      if (h < 14 && alat < 68 && this.rawAt(x, z) < 14) {
        r = 170 + n2 * 24; g = 158 + n2 * 20; b = 128 + n2 * 22;
      } else {
        const snowLine = alat < 63 ? lerp(4800, 1250, smoothstep(20, 60, alat)) : lerp(1250, 560, smoothstep(63, 72, alat));
        const rock = clamp(smoothstep(0.26, 0.62, slope) + smoothstep(snowLine * 0.55, snowLine * 0.95, h) * 0.85, 0, 1);
        // the land's own colour: the woods and meadows, the tropics, dry grass, sand, the tundra
        const f = this.groundRGB(L, alat, n2, TERRAIN_RGB);
        const rr = 112 + n2 * 38, rg = 104 + n2 * 32, rb = 96 + n2 * 28;
        r = lerp(f[0], rr, rock); g = lerp(f[1], rg, rock); b = lerp(f[2], rb, rock);
        const snowAmt = clamp(smoothstep(snowLine, snowLine + 320, h + n1 * 340), 0, 1);
        r = lerp(r, 234 + n2 * 16, snowAmt); g = lerp(g, 238 + n2 * 14, snowAmt); b = lerp(b, 247, snowAmt);
        // faint patchwork of clearings and fields in the green lowlands
        const field = smoothstep(320, 80, h) * (1 - rock) * (1 - L.wild) * smoothstep(0.55, 0.75, fbm(x / 2600 + 31, z / 2600 + 17, 2));
        r = lerp(r, 108 + n2 * 30, field * 0.5); g = lerp(g, 126 + n2 * 26, field * 0.5); b = lerp(b, 78, field * 0.5);
        if (land) {
          // the land cover everywhere but on rock and the mountains' snow (the farmland where
          // it is not wild); the woods thicken in the taiga, the tropics and the hills, and from
          // one region to the next, and thin out in the dry lands and past the tree line
          patch = (1 - rock) * (1 - snowAmt) * (1 - 0.6 * smoothstep(700, 2000, h));
          const taiga = smoothstep(56, 61, alat) * (1 - smoothstep(66, 70, alat));
          woods = 0.2 + 0.5 * taiga + 0.55 * L.trop + 0.3 * smoothstep(200, 800, h) + (fbm(x / 41000 - 3, z / 41000 + 5, 2) - 0.5) * 0.6;
          woods = clamp(woods * (1 - L.dry) * (1 - L.tundra) * (1 - 0.45 * L.arid), 0, 0.95);
        }
      }
      // the winter's snow, in patches where it comes and goes; less of it on the steep slopes
      const snow = clamp((L.snow - 0.5) * 2.2 + 0.5 + (n1 - 0.5) * 1.6, 0, 1) * (1 - 0.6 * smoothstep(0.35, 0.7, slope));
      if (snow > 0) {
        r = lerp(r, 234 + n2 * 16, snow); g = lerp(g, 238 + n2 * 14, snow); b = lerp(b, 247, snow);
        wild = Math.max(wild, snow);
      }
    }
    if (land) { land[0] = patch; land[1] = woods; land[2] = h < 0.5 ? 0 : this.urbanAt(x, z, n2); land[3] = wild; land[4] = bare; }
    const shade = clamp(0.8 + slope * 0.5, 0.72, 1.16);
    out[0] = clamp(r * shade, 0, 255);
    out[1] = clamp(g * shade, 0, 255);
    out[2] = clamp(b * shade, 0, 255);
    return out;
  }
};

// Height of a place from its distance to the coast (real km, negative at sea), the
// mountain field and noise keyed on longitude and latitude: metres
function elevation(sdf, mtn, lon, lat) {
  if (sdf <= 0) {
    const off = smoothstep(0, 24, -sdf);
    return -(5 + off * off * 250 + fbm(lon * 0.18, lat * 0.18, 2) * 16);
  }
  const inland = smoothstep(0, 5, sdf);
  const plains = 25 + 270 * fbm(lon * 0.055 + 3.1, lat * 0.055 - 1.9, 4);
  const patch = 0.65 + 0.35 * fbm(lon * 0.09 + 11.3, lat * 0.09 - 7.7, 3);
  const rg = 0.7 + 0.35 * ridgeNoise(lon * 0.17 + 3.7, lat * 0.17 - 2.1, 3);
  const m = mtn * 1900 * patch * rg * smoothstep(2, 20, sdf);
  let h = plains * inland + m;
  h += (fbm(lon * 0.85, lat * 0.85, 2) - 0.5) * 30 * smoothstep(26, 2, sdf);    // coastal relief
  return Math.min(h, 8800);
}

// ---------- the climates' regions (Terrain.lookGeo) ----------
// Each a list of boxes [lon0, lat0, lon1, lat1], 0..1 with soft edges (boxesAt).
// The great deserts: the Sahara, Arabia, Iran and the Thar, the Karakum, the Gobi and the
// Taklamakan, Australia's interior, the Mojave and Sonora, the Kalahari and the Namib, the
// Atacama and the Peruvian coast, Patagonia, the Negev and Sinai
const DESERTS = [
  [-17, 15, 35, 31], [35, 15, 60, 32], [55, 25, 72, 36], [50, 27, 61, 34], [69, 24, 73, 29], [53, 37, 66, 44],
  [90, 38, 115, 46], [76, 36, 92, 42], [115, -32, 145, -20], [-118, 26, -103, 37], [12, -29, 26, -18],
  [-71, -27, -68, -18], [-80, -24, -75.5, -5], [-71, -50, -64, -38], [33, 28, 35.5, 31]
];
// Dry grass, the farmland drier: the Mediterranean's summer (Iberia, the Maghreb, the Aegean,
// Anatolia, the Levant, California, central Chile, the Cape), the steppe (Iran and Iraq, central
// Asia and Mongolia, the Great Plains, Mexico, Argentina's west, north-west India), the savanna
// (the Sahel, East Africa, southern Africa, Brazil's north-east) and Australia's dry ring
const ARID_LANDS = [
  [-8, 36, 0, 41.5], [-9, 30, 11, 36], [21, 35, 30, 39], [30, 37, 44, 40.5], [33.5, 30, 37, 35.5],
  [-123, 32, -117, 39], [-72, -37, -69.5, -29], [17, -35, 21, -31], [38, 30, 62, 39], [46, 42, 88, 52],
  [88, 40, 120, 49], [-118, 31, -98, 49], [-110, 18, -97, 30], [-68, -38, -62, -24], [66, 22, 80, 31],
  [-17, 10, 40, 16], [33, -10, 45, 12], [14, -32, 32, -17], [-44, -12, -37, -4], [113, -35, 150, -15]
];
// Winters colder or milder than the latitude's (seasonTemp), [lon0, lat0, lon1, lat1, °C at
// midwinter]: the hearts of the continents colder — Russia and Siberia, Manchuria, the Canadian
// prairies, the Midwest and Quebec; the shores of the Atlantic milder (the Gulf Stream) —
// western Europe, Denmark and Skåne, Norway's west coast, Iceland and the Faroes. The
// tundra's own cold (LANDSCAPE.TUNDRA_COLD) is left off where the sea keeps it mild
const WINTERS = [
  [30, 45, 140, 65, -6], [100, 40, 140, 50, -8], [-110, 38, -76, 62, -10], [-80, 44, -60, 62, -10],
  [-12, 43, 10, 58, 4], [8, 54, 13, 58, 3], [4, 58, 8, 64, 5], [-25, 61, -5, 67, 7]
];
function winterAt(lat, lon) {
  let v = 0;
  for (const d of WINTERS) v += boxesAt([d], lat, lon) * d[4];
  return v;
}
function boxesAt(boxes, lat, lon) {
  let v = 0;
  for (const d of boxes) {
    const k = Math.min(smoothstep(d[0] - 3, d[0] + 2, lon), smoothstep(d[2] + 3, d[2] - 2, lon),
      smoothstep(d[1] - 3, d[1] + 2, lat), smoothstep(d[3] + 3, d[3] - 2, lat));
    if (k > v) v = k;
  }
  return v;
}
function desertAt(lat, lon) { return boxesAt(DESERTS, lat, lon); }

// The northern tree line, [longitude, latitude] (between them by the longitude): the tundra
// north of it — low in Labrador, Greenland, Iceland and Chukotka, high in Fennoscandia
const TREE_LINE = [
  [-180, 64], [-168, 64], [-160, 68], [-100, 68], [-95, 60], [-60, 57], [-55, 59], [-25, 61], [-12, 62],
  [0, 69], [5, 70.5], [30, 70], [40, 68], [60, 67.5], [160, 67], [170, 63], [180, 64]
];
function treeLine(lon) {
  for (let i = 1; i < TREE_LINE.length; i++) {
    const p = TREE_LINE[i - 1], q = TREE_LINE[i];
    if (lon <= q[0]) return lerp(p[1], q[1], clamp((lon - p[0]) / (q[0] - p[0]), 0, 1));
  }
  return TREE_LINE[TREE_LINE.length - 1][1];
}

// The land round an airport by its climate (Terrain.climateOf): how dry, arid and tundra it is
// (lookGeo); the green climates clear the desert's and the tundra's look off the field's
// surroundings, so the ground matches the trees
const CLIMATE_LOOK = {
  tundra: { dry: 0, arid: 0, tundra: 1 },
  boreal: { dry: 0, arid: 0, tundra: 0 }, larch: { dry: 0, arid: 0, tundra: 0 },
  temperate: { dry: 0, arid: 0, tundra: 0 }, warm: { dry: 0, arid: 0, tundra: 0 },
  subtropical: { dry: 0, arid: 0, tundra: 0 }, tropical: { dry: 0, arid: 0, tundra: 0 },
  mediterranean: { dry: 0, arid: 0.8, tundra: 0 }, steppe: { dry: 0, arid: 1, tundra: 0 },
  savanna: { dry: 0, arid: 1, tundra: 0 }, eucalypt: { dry: 0, arid: 0.25, tundra: 0 },
  desert: { dry: 1, arid: 0, tundra: 0 }
};
const TERRAIN_LOOK = {}, TERRAIN_RGB = [0, 0, 0];     // colorAt's scratch

// Distance from (px, pz) to the segment a-b
function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 > 0 ? clamp(((px - ax) * dx + (pz - az) * dz) / len2, 0, 1) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
