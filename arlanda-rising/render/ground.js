'use strict';

// Arlanda Rising — the land round the airport: the pine and spruce forest (a texture from afar, single trees close
// up), fields, lakes (ice in winter), granite outcrops, the bog the site has to drain, the clearings of the site
// project as they progress (the runway strip, the apron plot, the road in), the E4 (on past the map's edge) and the
// road, the junction where the E4 goes over the road on a bridge, and Märsta's red and white houses with its church. The season (snow on the ground, autumn birches) comes from the scene
// (render/map.js). Drawn by render/map.js before the airport.

const Ground = (() => {
  const RW = LAYOUT.runway1;
  const L = Math.hypot(RW.to[0] - RW.from[0], RW.to[1] - RW.from[1]);
  const DIR = [(RW.to[0] - RW.from[0]) / L, (RW.to[1] - RW.from[1]) / L];   // along runway 1, north
  const NRM = [DIR[1], -DIR[0]];                                           // across it, east
  const TREE_GRID = 18;           // m between trees
  const STRIP_T = [-175, 235];    // the strip's cleared width across the runway (m, east +), with the taxiway and room
                                  // for the trees in front of it not to stand over it

  // a point at s (0 the 01 threshold, 1 the 19 one) along runway 1 and t metres east of its centreline
  function rwPoint(s, t) { return [RW.from[0] + DIR[0] * L * s + NRM[0] * t, RW.from[1] + DIR[1] * L * s + NRM[1] * t]; }
  function rwCoords(x, y) { return [(x * DIR[0] + y * DIR[1]) / L, x * NRM[0] + y * NRM[1]]; }

  // ---------- the forest texture, one per season ----------
  const patterns = {};
  function forestPattern(c, season) {
    if (patterns[season]) return patterns[season];
    const n = 160, cv = document.createElement('canvas');
    cv.width = cv.height = n;
    const g = cv.getContext('2d'), land = SEASON_LAND[season];
    g.fillStyle = land.floor; g.fillRect(0, 0, n, n);
    let st = 12345;
    const r = () => { const q = rngNext(st); st = q[1]; return q[0]; };
    for (let i = 0; i < 520; i++) {
      const x = r() * n, y = r() * n, rad = 1.6 + r() * 2.6;
      const col = land.crown[r() < 0.08 ? 2 + Math.floor(r() * 2) : Math.floor(r() * 2)];
      for (const [dx, dy] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) {
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.beginPath(); g.arc(x + dx + 1, y + dy + 1, rad, 0, Math.PI * 2); g.fill();
        g.fillStyle = col;
        g.beginPath(); g.arc(x + dx, y + dy, rad, 0, Math.PI * 2); g.fill();
        if (season === 'winter') { g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(x + dx - rad * 0.3, y + dy - rad * 0.3, rad * 0.45, 0, Math.PI * 2); g.fill(); }
      }
    }
    const p = c.createPattern(cv, 'repeat');
    if (p.setTransform && typeof DOMMatrix !== 'undefined') p.setTransform(new DOMMatrix().scale(1.4));
    patterns[season] = p;
    return p;
  }

  // ---------- what is cleared, paved or built on (no trees there) ----------
  function cleared(sc, x, y) {
    const b = LAYOUT.bounds;
    if (x < b.x0 - 3000 || x > b.x1 + 3000 || y < b.y0 - 3000 || y > b.y1 + 3000) return false;
    if (sc.strip > 0) {
      const [s, t] = rwCoords(x, y);
      if (t > STRIP_T[0] && t < STRIP_T[1] && s > -0.05 && s < -0.05 + 1.1 * sc.strip) return true;
    }
    if (sc.apronClear > 0) {
      const a = LAYOUT.clear.apron;
      if (x > a[0][0] && x < a[0][0] + (a[1][0] - a[0][0]) * sc.apronClear && y > a[0][1] && y < a[2][1]) return true;
    }
    if (pointInPoly(x, y, LAYOUT.bog)) return true;
    for (const f of LAYOUT.fields) if (pointInPoly(x, y, f)) return true;
    for (const l of LAYOUT.lakes) if (pointInPoly(x, y, l.pts)) return true;
    const T = LAYOUT.town;
    if (Math.hypot(x - T.x, y - T.y) < T.r) return true;
    if (nearLine(x, y, LAYOUT.e4, 40)) return true;
    if (sc.road >= 1) {
      const X = LAYOUT.e4Exit;
      if (pointInPoly(x, y, X.verge) || nearLine(x, y, X.west, 32)) return true;
      for (const r of X.ramps) if (nearLine(x, y, r, 20)) return true;
    }
    if (sc.fence && Fence.near(sc.fence, x, y)) return true;
    if (sc.road > 0 && nearLine(x, y, sc.roadPts, 32)) return true;
    if (sc.landsidePts && nearLine(x, y, sc.landsidePts, 32)) return true;
    // what is built outside the first clearing: its plot and its way to the apron (render/map.js `scene`)
    for (const r of sc.pads || []) if (x > r[0] && x < r[2] && y > r[1] && y < r[3]) return true;
    for (const l of sc.ways || []) if (nearLine(x, y, l.pts, l.d)) return true;
    return false;
  }
  function nearLine(x, y, pts, d) {
    for (let i = 1; i < pts.length; i++) if (distToSeg(x, y, pts[i - 1], pts[i]) < d) return true;
    return false;
  }

  // ---------- flat layers ----------
  function fillPoly(c, pts, fill) {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.closePath();
    c.fillStyle = fill; c.fill();
  }
  function strokeLine(c, pts, w, color, dash) {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.lineWidth = w; c.strokeStyle = color; c.lineJoin = 'round'; c.lineCap = 'round';
    c.setLineDash(dash || []);
    c.stroke();
    c.setLineDash([]);
  }

  // ---------- the E4's bridge over the road in (data/layout.js e4Exit) ----------
  // d: metres along the E4 from the junction (north +), n: metres across it (east +), z: up
  const E4W = 15;   // m: half the E4's width
  const e4Frame = (() => {
    const X = LAYOUT.e4Exit, E = LAYOUT.e4, J = X.at;
    const i = E.findIndex((p) => p[0] === J[0] && p[1] === J[1]);
    const unit = (p) => { const l = Math.hypot(p[0] - J[0], p[1] - J[1]); return [(p[0] - J[0]) / l, (p[1] - J[1]) / l]; };
    const toS = unit(E[i - 1]), toN = unit(E[i + 1]);
    return (d, n, z) => {
      const t = d >= 0 ? toN : toS, f = d >= 0 ? toN : [-toS[0], -toS[1]], a = Math.abs(d);
      return [J[0] + t[0] * a + f[1] * n, J[1] + t[1] * a - f[0] * n, z || 0];
    };
  })();
  function overpass(c, sc, land, verge, paved) {
    const X = LAYOUT.e4Exit, G = X.deck, R = X.ramp, H = X.h, W = E4W, F = e4Frame, sn = sc.season === 'winter';
    const zAt = (d) => { const a = Math.abs(d); return a <= G ? H : a >= G + R ? 0 : H * (0.5 + 0.5 * Math.cos(Math.PI * (a - G) / R)); };
    const SLOPE = 1.6;   // m out per m up: the embankment's sides
    const asph = sn ? '#9aa0a6' : PAL.asphalt, grass = land.grass, conc = sn ? '#b9bcbd' : '#a39f96', rail = '#dcd9d2';
    // under the bridge: the ground between the abutments, the road through it, the deck's shadow
    const foot = [F(-G, -W - 4), F(G, -W - 4), F(G, W + 4), F(-G, W + 4)];
    c.save();
    fillPoly(c, foot, grass); c.clip();
    for (const pts of [sc.roadPts, X.west]) { strokeLine(c, pts, 26, verge); strokeLine(c, pts, 12, paved); }
    c.restore();
    fillPoly(c, [F(-G, -W - 1), F(G, -W - 1), F(G, W + 1), F(-G, W + 1)], 'rgba(0,0,0,0.3)');
    Iso.units(c);
    const q = (pts, col) => Iso.poly(c, pts, col);
    // one stretch of the raised carriageway from d0 (farther) to d1 (nearer), on its embankment or (deck) on the bridge
    let dash = 0;
    const stretch = (d0, d1, deck) => {
      const z0 = zAt(d0), z1 = zAt(d1), s0 = z0 * SLOPE, s1 = z1 * SLOPE;
      if (!deck) q([F(d0, -W, z0), F(d1, -W, z1), F(d1, -W - s1, 0), F(d0, -W - s0, 0)], shade(grass, -0.25));
      q([F(d0, -W, z0), F(d0, W, z0), F(d1, W, z1), F(d1, -W, z1)], asph);
      if (dash++ % 2 === 0) q([F(d0, -0.6, z0), F(d0, 0.6, z0), F(d1, 0.6, z1), F(d1, -0.6, z1)], 'rgba(255,255,255,0.6)');
      q([F(d0, -W, z0), F(d1, -W, z1), F(d1, -W, z1 + 1), F(d0, -W, z0 + 1)], shade(rail, -0.1));
      if (deck) q([F(d0, W, z0 - 1.6), F(d1, W, z1 - 1.6), F(d1, W, z1), F(d0, W, z0)], shade(conc, 0.15));
      else q([F(d0, W, z0), F(d1, W, z1), F(d1, W + s1, 0), F(d0, W + s0, 0)], shade(grass, -0.22));
      q([F(d0, W, z0), F(d1, W, z1), F(d1, W, z1 + 1), F(d0, W, z0 + 1)], rail);
    };
    const STEP = 7;
    for (let d = G + R; d > G; d -= STEP) stretch(d, Math.max(G, d - STEP), false);
    // the north abutment's face toward the road, then the deck
    const sG = H * SLOPE;
    q([F(G, -W - sG, 0), F(G, W + sG, 0), F(G, W, H), F(G, -W, H)], conc);
    q([F(G, -W - 1, H - 1.6), F(G, W + 1, H - 1.6), F(G, W + 1, H), F(G, -W - 1, H)], shade(conc, -0.25));
    stretch(G, -G, true);
    for (let d = -G; d > -G - R; d -= STEP) stretch(d, Math.max(-G - R, d - STEP), false);
    Iso.ground(c);
  }

  function draw(c, sc) {
    const land = SEASON_LAND[sc.season];
    Iso.ground(c);
    const v = Cam.view(200);
    c.fillStyle = forestPattern(c, sc.season);
    c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    if (Cam.zoom >= ZOOM_TREES) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); }
    LAYOUT.fields.forEach((f, i) => {
      fillPoly(c, f, i % 2 ? land.field2 : land.field);
      if (sc.season !== 'winter') {
        // furrows
        c.save(); c.clip();
        c.strokeStyle = 'rgba(0,0,0,0.07)'; c.lineWidth = 6;
        const xs = f.map((p) => p[0]), ys = f.map((p) => p[1]);
        c.beginPath();
        for (let y = Math.min(...ys); y < Math.max(...ys); y += 40) { c.moveTo(Math.min(...xs), y); c.lineTo(Math.max(...xs), y + 60); }
        c.stroke(); c.restore();
      }
    });
    for (const l of LAYOUT.lakes) {
      fillPoly(c, l.pts, shade(land.lake, -0.1));
      c.save(); c.translate(-6, 6); fillPoly(c, l.pts, land.lake); c.restore();
    }
    // the town's ground
    const T = LAYOUT.town;
    c.fillStyle = land.town;
    c.beginPath(); c.arc(T.x, T.y, T.r, 0, Math.PI * 2); c.fill();
    // the bog, drying as it is drained
    fillPoly(c, LAYOUT.bog, mix(land.bog, land.soil, sc.drain));
    if (sc.drain < 1) {
      c.fillStyle = 'rgba(40,70,90,' + (0.45 * (1 - sc.drain)) + ')';
      for (let i = 0; i < 14; i++) {
        const x = 560 + (hashOf('bog', i) % 420), y = 1080 + (hashOf('bogy', i) % 360);
        c.beginPath(); c.ellipse(x, y, 18 + i % 3 * 8, 10 + i % 4 * 4, 0, 0, Math.PI * 2); c.fill();
      }
    }
    // the clearings
    const raw = sc.siteDone ? land.grass : land.soil;
    if (sc.strip > 0) {
      const s1 = -0.05 + 1.1 * sc.strip;
      fillPoly(c, [rwPoint(-0.05, STRIP_T[0]), rwPoint(s1, STRIP_T[0]), rwPoint(s1, STRIP_T[1]), rwPoint(-0.05, STRIP_T[1])], raw);
    }
    if (sc.apronClear > 0) {
      const a = LAYOUT.clear.apron, x1 = a[0][0] + (a[1][0] - a[0][0]) * sc.apronClear;
      fillPoly(c, [[a[0][0], a[0][1]], [x1, a[0][1]], [x1, a[2][1]], [a[0][0], a[2][1]]], raw);
    }
    c.fillStyle = raw;
    for (const r of sc.pads || []) c.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
    for (const l of sc.ways || []) strokeLine(c, l.pts, l.d * 2, raw);
    // roads: the road in (gravel while it is built), the landside road along the terminals, the E4 over them; once the
    // road in is finished the junction: the road on west under the E4, the slip roads, the E4 on its bridge
    const X = LAYOUT.e4Exit, paved = sc.season === 'winter' ? '#8d949a' : '#4a4d51', verge = shade(land.road, -0.15);
    if (sc.road >= 1) {
      fillPoly(c, X.verge, land.grass);
      for (const r of X.ramps) { strokeLine(c, r, 16, verge); strokeLine(c, r, 8, paved); }
      strokeLine(c, X.west, 26, verge); strokeLine(c, X.west, 12, paved);
    }
    if (sc.road > 0) {
      strokeLine(c, sc.roadPts, 26, verge);
      strokeLine(c, sc.roadPts, 12, sc.road >= 1 ? paved : land.road);
    }
    if (sc.landsidePts) {
      strokeLine(c, sc.landsidePts, 26, verge);
      strokeLine(c, sc.landsidePts, 12, paved);
    }
    strokeLine(c, LAYOUT.e4, 30, sc.season === 'winter' ? '#9aa0a6' : PAL.asphalt);
    strokeLine(c, LAYOUT.e4, 1.2, 'rgba(255,255,255,0.6)', [14, 14]);
    if (sc.road >= 1) overpass(c, sc, land, verge, paved);
    // granite outcrops
    for (const r of LAYOUT.rocks) {
      if (cleared(sc, r[0], r[1]) && !pointInPoly(r[0], r[1], LAYOUT.fields[0])) continue;
      c.fillStyle = shade(PAL.granite, -0.2);
      c.beginPath(); c.ellipse(r[0] + 4, r[1] - 4, r[2], r[2] * 0.7, 0.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = sc.season === 'winter' ? '#dfe5ea' : PAL.granite;
      c.beginPath(); c.ellipse(r[0], r[1], r[2] * 0.9, r[2] * 0.6, 0.4, 0, Math.PI * 2); c.fill();
    }
  }

  // ---------- trees and houses, standing up ----------
  const sprites = {};
  function treeSprite(kind, season) {
    const bucket = Math.pow(2, Math.round(Math.log2(Cam.zoom * Cam.dpr) * 2) / 2);
    const key = kind + season + bucket;
    if (sprites[key]) return sprites[key];
    if (Object.keys(sprites).length > 200) for (const k in sprites) delete sprites[k];
    // hM sets the shape: a spruce's tip stands 1.28 × hM over its foot, a pine's 1.12 ×, a birch's crown 0.96 ×
    const hM = kind === 'birch' ? 11.5 : kind === 'spruce' ? 12.5 : 14.5, wM = kind === 'birch' ? 7 : kind === 'spruce' ? 6 : 7;
    const w = Math.ceil(wM * 1.4 * bucket) + 4, h = Math.ceil(hM * 1.32 * bucket) + 6;   // tall enough for the whole crown
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), s = bucket, cx = w / 2, by = h - 2;
    const snow = season === 'winter', land = SEASON_LAND[season];
    g.fillStyle = kind === 'birch' ? PAL.birch : '#5a4030';
    g.fillRect(cx - 0.5 * s, by - hM * 0.45 * s, Math.max(1, s), hM * 0.45 * s);
    if (kind === 'birch') {
      // bare in winter and in early spring (April)
      const leaf = season === 'autumn' ? '#c99a2e' : season === 'winter' || season === 'spring' ? null : '#6e9a48';
      if (leaf) {
        g.fillStyle = shade(leaf, -0.2); g.beginPath(); g.ellipse(cx + 0.8 * s, by - hM * 0.62 * s, wM * 0.5 * s, hM * 0.32 * s, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = leaf; g.beginPath(); g.ellipse(cx - 0.4 * s, by - hM * 0.68 * s, wM * 0.42 * s, hM * 0.28 * s, 0, 0, Math.PI * 2); g.fill();
      } else {
        g.strokeStyle = 'rgba(80,70,60,0.7)'; g.lineWidth = Math.max(0.6, 0.3 * s);
        for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(cx, by - hM * 0.4 * s); g.lineTo(cx + (i - 2) * wM * 0.18 * s, by - hM * (0.75 + i % 2 * 0.15) * s); g.stroke(); }
      }
    } else {
      const col = kind === 'spruce' ? PAL.spruce : PAL.pine;
      const layers = kind === 'spruce' ? 4 : 3;
      for (let i = 0; i < layers; i++) {
        const y0 = by - hM * (0.22 + i * 0.19) * s, y1 = by - hM * (0.55 + i * 0.16) * s, half = wM * (0.55 - i * 0.11) * s;
        g.fillStyle = shade(col, i * 0.06);
        g.beginPath(); g.moveTo(cx - half, y0); g.lineTo(cx, y1 - (i === layers - 1 ? hM * 0.25 * s : 0)); g.lineTo(cx + half, y0); g.closePath(); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.beginPath(); g.moveTo(cx, y0); g.lineTo(cx, y1); g.lineTo(cx + half, y0); g.closePath(); g.fill();
        if (snow) { g.fillStyle = 'rgba(244,247,250,0.85)'; g.beginPath(); g.moveTo(cx - half * 0.8, y0 - 1); g.lineTo(cx, y1); g.lineTo(cx - half * 0.1, y0 - 1); g.closePath(); g.fill(); }
      }
    }
    void land;
    return (sprites[key] = { cv, ox: cx, oy: by, s: bucket });
  }
  function drawTree(c, x, y, kind, season, scale) {
    const sp = treeSprite(kind, season), u = P(x, y, 0);
    const k = scale / sp.s;   // the canvas draws in units: a sprite pixel is 1 / bucket of a unit
    c.drawImage(sp.cv, u[0] - sp.ox * k, u[1] - sp.oy * k, sp.cv.width * k, sp.cv.height * k);
  }

  // Märsta's houses, made once
  let houses = null;
  function town() {
    if (houses) return houses;
    houses = [];
    const T = LAYOUT.town;
    for (let gx = -T.r; gx <= T.r; gx += 48) for (let gy = -T.r; gy <= T.r; gy += 48) {
      const h = hashOf('marsta', gx, gy);
      const x = T.x + gx + (h % 17) - 8, y = T.y + gy + ((h >> 5) % 17) - 8;
      if (Math.hypot(x - T.x, y - T.y) > T.r - 40 || h % 10 < 3) continue;
      const kind = h % 7;
      houses.push({ x, y, w: 10 + (h >> 9) % 8, d: 8 + (h >> 12) % 5, wall: kind < 4 ? PAL.falu : kind < 6 ? '#ece6d6' : '#d9b65a', along: (h >> 15) % 2 === 0 });
    }
    houses.push({ x: T.x + 60, y: T.y + 40, church: true });
    return houses;
  }
  function drawHouse(c, hs, season) {
    if (hs.church) {
      Iso.box(c, hs.x - 10, hs.y - 7, hs.x + 14, hs.y + 7, 0, 9, '#eeeae0');
      Iso.gable(c, hs.x - 11, hs.y - 8, hs.x + 15, hs.y + 8, 9, 7, '#3b3b3b', true);
      Iso.box(c, hs.x - 18, hs.y - 4, hs.x - 10, hs.y + 4, 0, 22, '#eeeae0');
      Iso.poly(c, [[hs.x - 18, hs.y - 4, 22], [hs.x - 10, hs.y - 4, 22], [hs.x - 14, hs.y, 34]], '#3b3b3b');
      Iso.poly(c, [[hs.x - 10, hs.y - 4, 22], [hs.x - 10, hs.y + 4, 22], [hs.x - 14, hs.y, 34]], '#2a2a2a');
      return;
    }
    const x0 = hs.x - hs.w / 2, x1 = hs.x + hs.w / 2, y0 = hs.y - hs.d / 2, y1 = hs.y + hs.d / 2;
    Iso.box(c, x0, y0, x1, y1, 0, 5, hs.wall);
    Iso.gable(c, x0 - 0.6, y0 - 0.6, x1 + 0.6, y1 + 0.6, 5, 3.5, season === 'winter' ? '#f0f3f6' : '#3d3a38', hs.along);
  }

  // the trees and the houses on the screen, back to front
  function drawStanding(c, sc) {
    Iso.units(c);
    const items = [];
    const T = LAYOUT.town;
    if (Cam.zoom > 0.12) {
      for (const hs of town()) if (Cam.visible(hs.x, hs.y, 0, 40)) items.push({ d: depthOf(hs.x, hs.y), house: hs });
    }
    if (Cam.zoom >= ZOOM_TREES) {
      const v = Cam.view(30), g = TREE_GRID;
      for (let gx = Math.floor(v.x0 / g); gx <= Math.ceil(v.x1 / g); gx++) for (let gy = Math.floor(v.y0 / g); gy <= Math.ceil(v.y1 / g); gy++) {
        const h = hashOf(gx, gy);
        const x = gx * g + (h % 1000) / 1000 * g * 0.8, y = gy * g + ((h >> 10) % 1000) / 1000 * g * 0.8;
        if (!Cam.visible(x, y, 0, 30) || cleared(sc, x, y)) continue;
        const r = (h >> 20) % 100;
        items.push({ d: depthOf(x, y), x, y, kind: r < 50 ? 'pine' : r < 84 ? 'spruce' : 'birch', scale: 0.8 + ((h >> 4) % 40) / 100 });
      }
    }
    items.sort((a, b) => a.d - b.d);
    for (const it of items) {
      if (it.house) drawHouse(c, it.house, sc.season);
      else drawTree(c, it.x, it.y, it.kind, sc.season, it.scale);
    }
    void T;
  }

  // names on the map when zoomed out (screen space)
  function labels(c) {
    if (Cam.zoom > 0.35) return;
    Iso.screen(c);
    c.font = '600 13px "Segoe UI", Arial, sans-serif';
    c.textAlign = 'center';
    const put = (text, x, y) => {
      const s = Cam.toScreen(x, y, 0);
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillText(text, s[0] + 1, s[1] + 1);
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillText(text, s[0], s[1]);
    };
    put(LAYOUT.town.name, LAYOUT.town.x, LAYOUT.town.y);
    const e4 = LAYOUT.e4.find((p) => p[1] > 0);
    put('E4', e4[0] - 80, e4[1]);
    for (const l of LAYOUT.lakes) if (l.name) put(l.name, l.pts[0][0] + 300, l.pts[0][1] + 120);
  }

  return { draw, drawStanding, labels, rwPoint, rwCoords, DIR, NRM, LEN: L, cleared };
})();
