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
// ============================================================

const TERRAIN = {
  maxSdfKm: 90,       // distances to the coast beyond this saturate
  aptGrid: null, aptGridCell: 20000
};

const Terrain = {
  built: false,
  g: null,            // the grid: {x0, z0, cell (world m), cellKm, w, h, height}

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

  // The far mesh sits a little under the real ground so the near mesh always wins
  farHeight(x, z) {
    const h = this.flattenAirports(x, z, this.rawAt(x, z));
    return h > 1 ? Math.max(1, h - 30) : h;
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
      const halfLen = a.rwyLen / 2 + 500;
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
          const cap = a.elev + Math.max(0, dist - 1500) * slope;
          if (h > cap) h = lerp(h, cap, k);
        }
      }
    }
    return h;
  },

  // Vertex colour for terrain, written into out[0..2] as 0..255
  colorAt(x, z, h, slope, out) {
    const geo = Theatre.toGeo(x, z);
    const alat = Math.abs(geo.lat);
    const n1 = fbm(x / 5200 + 21, z / 5200 - 13, 3);
    const n2 = fbm(x / 1100 - 5, z / 1100 + 7, 2);
    let r, g, b;
    if (h < 0.5) {
      r = 44 + n1 * 20; g = 54 + n1 * 24; b = 58 + n1 * 18;
    } else if (h < 14 && alat < 68) {
      r = 170 + n2 * 24; g = 158 + n2 * 20; b = 128 + n2 * 22;                       // beaches
    } else {
      const snowLine = alat < 63 ? lerp(4800, 1250, smoothstep(20, 60, alat)) : lerp(1250, 560, smoothstep(63, 72, alat));
      const rock = clamp(smoothstep(0.26, 0.62, slope) + smoothstep(snowLine * 0.55, snowLine * 0.95, h) * 0.85, 0, 1);
      const birch = smoothstep(63, 56, alat) * 0.65 + 0.12;
      let fr = lerp(30, 104, birch) + n2 * 20;
      let fg = lerp(62, 122, birch) + n2 * 24;
      let fb = lerp(36, 66, birch) + n2 * 14;
      // deep green in the tropics
      const trop = smoothstep(18, 8, alat);
      fr = lerp(fr, 34, trop); fg = lerp(fg, 84, trop); fb = lerp(fb, 34, trop);
      // sand and dry scrub in the deserts
      const dry = desertAt(geo.lat, geo.lon);
      fr = lerp(fr, 196 + n2 * 20, dry); fg = lerp(fg, 168 + n2 * 18, dry); fb = lerp(fb, 118 + n2 * 14, dry);
      const rr = 112 + n2 * 38, rg = 104 + n2 * 32, rb = 96 + n2 * 28;
      r = lerp(fr, rr, rock); g = lerp(fg, rg, rock); b = lerp(fb, rb, rock);
      const snowAmt = clamp(smoothstep(snowLine, snowLine + 320, h + n1 * 340), 0, 1);
      r = lerp(r, 234 + n2 * 16, snowAmt); g = lerp(g, 238 + n2 * 14, snowAmt); b = lerp(b, 247, snowAmt);
      const tundra = smoothstep(69.5, 72.5, alat) * (1 - snowAmt) * (1 - rock);
      r = lerp(r, 126 + n2 * 24, tundra); g = lerp(g, 122 + n2 * 20, tundra); b = lerp(b, 92, tundra);
      // faint patchwork of clearings and fields in the lowlands
      const field = smoothstep(320, 80, h) * (1 - rock) * (1 - dry) * smoothstep(0.55, 0.75, fbm(x / 2600 + 31, z / 2600 + 17, 2));
      r = lerp(r, 108 + n2 * 30, field * 0.5); g = lerp(g, 126 + n2 * 26, field * 0.5); b = lerp(b, 78, field * 0.5);
    }
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

// The great deserts, 0..1 with soft edges: [lon0, lat0, lon1, lat1]
const DESERTS = [
  [-17, 15, 35, 31], [35, 15, 60, 32], [55, 25, 72, 36], [90, 38, 115, 46], [76, 36, 92, 42],
  [115, -32, 145, -20], [-118, 26, -103, 37], [12, -29, 26, -18], [-71, -27, -68, -18], [-71, -50, -64, -38]
];
function desertAt(lat, lon) {
  let v = 0;
  for (const d of DESERTS) {
    const k = Math.min(smoothstep(d[0] - 3, d[0] + 2, lon), smoothstep(d[2] + 3, d[2] - 2, lon),
      smoothstep(d[1] - 3, d[1] + 2, lat), smoothstep(d[3] + 3, d[3] - 2, lat));
    if (k > v) v = k;
  }
  return v;
}

// Distance from (px, pz) to the segment a-b
function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 > 0 ? clamp(((px - ax) * dx + (pz - az) * dz) / len2, 0, 1) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
