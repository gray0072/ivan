'use strict';

// Arlanda Rising — the airport on the map: runway 1 with its markings, snow and lights; the parallel taxiway and its
// links; the first apron with its stands and the remote stands bought later; and the buildings as they stand —
// or as far as they are built (the master plan's projects show their stages: a slab, walls going up, a crane;
// a project open but not started shows its plot outlined). Flat things are drawn by `flat`, standing ones are
// handed to render/map.js as objects to sort; lamps go to the scene's light list (drawn after the dark).

const AirportArt = (() => {
  const RW = LAYOUT.runway1, TX = LAYOUT.taxi;
  const rp = (s, t) => Ground.rwPoint(s, t);

  // a stand's place on the map: the apron's in order, then the remote slots
  // (a stand a project placed keeps its own place, `at`; session 3)
  function standPos(i) {
    const st = S.airport.stands[i];
    if (st && st.at) return { x: st.at[0], y: st.at[1], hdg: 90 };
    let k = 0;
    for (let j = 0; j < i; j++) if (!S.airport.stands[j].at) k++;
    return k < LAYOUT.stands.length ? LAYOUT.stands[k] : LAYOUT.remote[(k - LAYOUT.stands.length) % LAYOUT.remote.length];
  }
  function standIndex(id) { return S.airport.stands.findIndex((s) => s.id === id); }
  // the point the stand's lead-in line starts at (the aircraft taxis there, then in)
  function standEntry(i) { const p = standPos(i); return [p.x - 75, p.y]; }

  function quad(c, a, b, cc, d, fill) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fillStyle = fill; c.fill(); }
  function band(c, s0, s1, t0, t1, fill) { quad(c, rp(s0, t0), rp(s1, t0), rp(s1, t1), rp(s0, t1), fill); }
  function line(c, pts, w, color, dash) { line(c, pts, w, color, dash); }
  function line(c, pts, w, color, dash) {
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.lineWidth = w; c.strokeStyle = color; c.lineCap = 'butt'; c.lineJoin = 'round'; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]);
  }
  // text lying on the ground, its top toward `up` (a unit world vector)
  function groundText(c, text, x, y, up, size, color) {
    c.save();
    c.transform(up[1], -up[0], -up[0], -up[1], x, y);
    c.font = '700 ' + size + 'px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = color; c.fillText(text, 0, 0);
    c.restore();
  }

  // ---------- flat: runway, taxiways, apron ----------
  function flat(c, sc) {
    Iso.ground(c);
    const land = SEASON_LAND[sc.season];
    if (sc.runway) {
      const L = Ground.LEN, w = RW.w / 2, sn = sc.season === 'winter';
      // the taxiway system
      const tw = TX.w;
      const asph = sn ? '#5a5f64' : '#4b4f54';
      line(c, [rp(0, TX.offset), rp(1, TX.offset)], tw, asph);
      for (const s of TX.links) line(c, [rp(s, 0), rp(s, TX.offset)], tw, asph);
      if (sc.apron) line(c, [rp(TX.apronLink.s, TX.offset), TX.apronLink.to], tw, asph);
      const yl = PAL.taxiLine;
      line(c, [rp(0, TX.offset), rp(1, TX.offset)], 0.8, yl);
      for (const s of TX.links) line(c, [rp(s, 6), rp(s, TX.offset)], 0.8, yl);
      if (sc.apron) line(c, [rp(TX.apronLink.s, TX.offset), TX.apronLink.to], 0.8, yl);
      // the runway
      band(c, -0.004, 1.004, -w - 2, w + 2, sn ? '#c4cbd1' : '#6b6f63');
      band(c, 0, 1, -w, w, PAL.asphalt);
      // markings: threshold bars, the designators, the centreline, the edges
      for (const [s, dir] of [[0.004, 1], [0.996, -1]]) {
        for (let i = 0; i < 8; i++) {
          const t0 = -w + 2 + i * 5.2 + (i >= 4 ? 3 : 0);
          band(c, s, s + dir * 45 / L, t0, t0 + 3.2, '#e9ecef');
        }
      }
      groundText(c, '01', ...rp(70 / L, 0), Ground.DIR, 15, '#e9ecef');
      groundText(c, '19', ...rp(1 - 70 / L, 0), [-Ground.DIR[0], -Ground.DIR[1]], 15, '#e9ecef');
      line(c, [rp(100 / L, 0), rp(1 - 100 / L, 0)], 0.9, '#e9ecef', [30, 20]);
      line(c, [rp(0, -w + 0.8), rp(1, -w + 0.8)], 0.9, '#e9ecef');
      line(c, [rp(0, w - 0.8), rp(1, w - 0.8)], 0.9, '#e9ecef');
      // snow on it, swept behind a convoy
      const r = sc.runway;
      if (r.snow > 0.2 || r.plough) {
        const a = clamp(r.snow / SNOW_CLOSE_MM, 0, 1) * 0.9 + 0.08;
        if (r.plough && r.ploughFrom !== undefined) {
          const q = clamp((sc.t - r.ploughFrom) / (r.plough - r.ploughFrom), 0, 1);
          band(c, 0, q, -w, w, 'rgba(244,247,250,0.12)');
          band(c, q, 1, -w, w, 'rgba(244,247,250,' + a + ')');
        } else band(c, 0, 1, -w, w, 'rgba(244,247,250,' + a + ')');
      }
      // cables being laid for the lights: a trench along both edges
      const cab = sc.p('lights1', 'cables');
      if (cab > 0 && cab < 1) for (const t of [-w - 4, w + 4]) line(c, [rp(0, t), rp(cab, t)], 1.5, '#7a5a3a');
      // approach lights: a bar of lamps south of 01
      if (sc.p('lights1', 'approach') >= 1) {
        for (let d = 60; d <= 900; d += 60) {
          const p = rp(-d / L, 0);
          line(c, [rp(-d / L, -4), rp(-d / L, 4)], 0.8, '#777');
          sc.lights.push({ x: p[0], y: p[1], z: 1, col: '255,240,200', r: 5 });
        }
        for (let d = 300; d <= 600; d += 300) for (const t of [-15, 15]) { const p = rp(-d / L, t); sc.lights.push({ x: p[0], y: p[1], z: 1, col: '255,240,200', r: 4 }); }
      }
      // edge lights and threshold lights
      if (r.lit) {
        for (let d = 0; d <= L; d += 60) for (const t of [-w - 1.5, w + 1.5]) { const p = rp(d / L, t); sc.lights.push({ x: p[0], y: p[1], z: 0.5, col: '255,236,180', r: 3 }); }
        for (let t = -w; t <= w; t += 4.5) {
          const a = rp(-2 / L, t), b = rp(1 + 2 / L, t);
          sc.lights.push({ x: a[0], y: a[1], z: 0.5, col: '90,255,120', r: 3 });
          sc.lights.push({ x: b[0], y: b[1], z: 0.5, col: '255,80,70', r: 3 });
        }
      }
    }
    runway2(c, sc);
    runway3(c, sc);
    // the jet apron and the domestic apron, as far as they are paved
    for (const [key, pid, sid] of [['apron2', 'apron2', 'pave'], ['apron3', 'domTerminal', 'apron'], ['apron4', 'terminal2', 'gates'], ['apron5', 'pierF', 'apron']]) {
      const q = sc.p(pid, sid);
      if (q <= 0) continue;
      const B = LAYOUT[key];
      c.fillStyle = q < 1 ? '#a39a88' : sc.season === 'winter' ? '#cfd5da' : PAL.concrete;
      c.fillRect(B.x0, B.y0, (B.x1 - B.x0) * Math.min(1, q * 1.2), B.y1 - B.y0);
    }
    if (sc.p('apron2', 'pave') >= 1) line(c, LAYOUT.taxi2.slice(0, sc.runway2 ? 4 : 2), TX.w, sc.season === 'winter' ? '#5a5f64' : '#4b4f54');
    if (sc.apron) {
      const A = LAYOUT.apron1;
      c.fillStyle = sc.season === 'winter' ? '#cfd5da' : PAL.concrete;
      c.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0);
      c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 0.5;
      c.beginPath();
      for (let x = A.x0; x <= A.x1; x += 10) { c.moveTo(x, A.y0); c.lineTo(x, A.y1); }
      for (let y = A.y0; y <= A.y1; y += 10) { c.moveTo(A.x0, y); c.lineTo(A.x1, y); }
      c.stroke();
      if (S.airport.apron.snow > 0.3) {
        const sw = S.airport.apron.plough && S.airport.apron.ploughFrom !== undefined ? clamp((sc.t - S.airport.apron.ploughFrom) / (S.airport.apron.plough - S.airport.apron.ploughFrom), 0, 1) : 0;
        c.fillStyle = 'rgba(244,247,250,' + (clamp(S.airport.apron.snow / 6, 0, 1) * 0.85) + ')';
        c.fillRect(A.x0 + (A.x1 - A.x0) * sw, A.y0, (A.x1 - A.x0) * (1 - sw), A.y1 - A.y0);
      }
    }
    // the stands' markings (and the remote stands' own paving)
    S.airport.stands.forEach((st, i) => {
      const p = standPos(i), A = LAYOUT.apron1;
      const onApron = !!st.at || (p.x >= A.x0 && p.x <= A.x1 && p.y >= A.y0 && p.y <= A.y1);
      if (!onApron) {
        c.fillStyle = sc.season === 'winter' ? '#cfd5da' : PAL.concrete;
        c.fillRect(p.x - 70, p.y - 26, 78, 52);
        line(c, [[p.x - 70, p.y], [A.x0, Math.min(Math.max(p.y, A.y0 + 10), A.y1 - 10)]], 20, sc.season === 'winter' ? '#cfd5da' : PAL.concrete);
      }
      const hl = sc.standMark && sc.standMark[st.id];
      line(c, [[p.x - 70, p.y], [p.x - 2, p.y]], hl ? 3 : 0.8, hl ? hl : PAL.taxiLine);
      line(c, [[p.x - 2, p.y - 6], [p.x - 2, p.y + 6]], 1.2, PAL.taxiLine);
      groundText(c, st.name, p.x - 60, p.y + 12, [1, 0], 9, st.closed ? '#e35b4f' : PAL.taxiLine);
      if (hl) {
        c.strokeStyle = hl; c.lineWidth = 2.5; c.setLineDash([5, 4]);
        c.strokeRect(p.x - 72, p.y - 27, 74, 54); c.setLineDash([]);
      }
      if (st.closed) { c.fillStyle = 'rgba(227,91,79,0.25)'; c.fillRect(p.x - 72, p.y - 27, 74, 54); }
    });
    // car parks
    for (const [kind, box] of [['parkingSmall', LAYOUT.parkingSmall.box], ['parkingBig', LAYOUT.parkingBig.box]]) {
      if (!sc.items[kind]) continue;
      c.fillStyle = sc.season === 'winter' ? '#d9dee3' : '#5c6066';
      c.fillRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 0.4; c.beginPath();
      for (let x = box[0] + 6; x < box[2]; x += 5) { c.moveTo(x, box[1] + 4); c.lineTo(x, box[3] - 4); }
      c.stroke();
    }
    void land;
    rail(c, sc);
    plots(c, sc);
  }

  // session 4: Arlanda Express — the line and its tunnel as far as they are built, the stations' entrances, the yellow
  // train once it runs (from 24 November 1999)
  function rail(c, sc) {
    const R = LAYOUT.rail, lp = sc.p('arlandaExpress', 'line'), tun = sc.p('arlandaExpress', 'tunnel');
    if (lp <= 0 && tun <= 0 && !sc.items.railStation) return;
    const done = !!sc.items.railStation;
    const part = (pts, q) => { const out = [pts[0]]; const n = pts.length - 1; const k = q * n; for (let i = 1; i <= n; i++) { if (i <= k) out.push(pts[i]); else { const f = k - (i - 1); if (f > 0) out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]); break; } } return out; };
    const bed = sc.season === 'winter' ? '#cfd3d6' : '#8a8273';
    const lq = done ? 1 : lp;
    if (lq > 0) {
      for (const pts of [R.line, R.out]) {
        const pp = part(pts, lq);
        line(c, pp, 12, bed);
        line(c, pp, 2, '#5b5148');
      }
    }
    // the tunnel: a works trench while it is dug, a dashed line once it is under the ground
    const tq = done ? 1 : tun;
    if (tq > 0) line(c, part(R.tunnel, tq), done || tq >= 1 ? 5 : 14, done || tq >= 1 ? 'rgba(70,60,50,0.6)' : '#7a5a3a', done || tq >= 1 ? [24, 16] : null);
    for (const key of ['south', 'north']) {
      if (!done && sc.p('arlandaExpress', key) <= 0) continue;
      const [x, y] = R[key];
      c.fillStyle = '#3a3d41'; c.fillRect(x - 18, y - 10, 36, 20);
      c.fillStyle = '#f7d117'; c.fillRect(x - 15, y - 7, 30, 14);
    }
    // the train: out of the north portal and back, every few minutes
    if (done && S.airport.trainFrom !== undefined && S.day >= S.airport.trainFrom) {
      const path = R.line.slice().reverse().concat(R.tunnel.slice(1)).concat(R.out.slice(1));
      const q = (sc.anim * 0.02) % 1, total = path.length - 1, k = q * total, i = Math.min(total - 1, Math.floor(k)), f = k - i;
      const x = path[i][0] + (path[i + 1][0] - path[i][0]) * f, y = path[i][1] + (path[i + 1][1] - path[i][1]) * f;
      const under = i >= R.line.length - 1 && i < R.line.length - 1 + R.tunnel.length - 1;
      if (!under) { c.fillStyle = '#f7d117'; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill(); }
    }
  }

  // session 5: runway 3 (01R/19L) as far as it is built, and the taxiway over the bridges to it; the de-icing pads, Cargo
  // City's yard and the solar parks on the ground
  function runway3(c, sc) {
    const R3 = LAYOUT.runway3, sn = sc.season === 'winter';
    const strip = sc.items.runway3 ? 1 : sc.p('runway3', 'strip'), pave = sc.items.runway3 ? 1 : sc.p('runway3', 'pave');
    const asph = sn ? '#5a5f64' : '#4b4f54';
    if (strip > 0) {
      const L3 = Math.hypot(R3.to[0] - R3.from[0], R3.to[1] - R3.from[1]);
      const u = [(R3.to[0] - R3.from[0]) / L3, (R3.to[1] - R3.from[1]) / L3], n = [u[1], -u[0]];
      const pt = (s, t) => [R3.from[0] + u[0] * L3 * s + n[0] * t, R3.from[1] + u[1] * L3 * s + n[1] * t];
      const bandR = (s0, s1, t0, t1, fill) => quad(c, pt(s0, t0), pt(s1, t0), pt(s1, t1), pt(s0, t1), fill);
      const w = R3.w / 2;
      bandR(0, 1, -120 * strip, 120 * strip, sn ? '#e8edf1' : '#8a8f6a');
      if (pave > 0) {
        bandR(-0.004, pave + 0.004, -w - 2, w + 2, sn ? '#c4cbd1' : '#6b6f63');
        bandR(0, pave, -w, w, PAL.asphalt);
      }
      if (pave >= 1) {
        for (const [s, dir] of [[0.004, 1], [0.996, -1]]) for (let i = 0; i < 8; i++) { const t0 = -w + 2 + i * 5.2 + (i >= 4 ? 3 : 0); bandR(s, s + dir * 45 / L3, t0, t0 + 3.2, '#e9ecef'); }
        groundText(c, '01R', ...pt(75 / L3, 0), u, 13, '#e9ecef');
        groundText(c, '19L', ...pt(1 - 75 / L3, 0), [-u[0], -u[1]], 13, '#e9ecef');
        line(c, [pt(100 / L3, 0), pt(1 - 100 / L3, 0)], 0.9, '#e9ecef', [30, 20]);
        const r = sc.runway3;
        if (r && (r.snow > 0.2 || r.plough)) bandR(0, 1, -w, w, 'rgba(244,247,250,' + (clamp(r.snow / SNOW_CLOSE_MM, 0, 1) * 0.9 + 0.08) + ')');
        if (sc.p('runway3', 'lights') >= 1 || sc.items.runway3) for (let d = 0; d <= L3; d += 60) for (const t of [-w - 1.5, w + 1.5]) { const p = pt(d / L3, t); sc.lights.push({ x: p[0], y: p[1], z: 0.5, col: '255,236,180', r: 3 }); }
      }
    }
    // the taxiway west over the railway and the road
    const tq = sc.items.bridges ? 1 : sc.p('bridges', 'taxi');
    if (tq > 0) { line(c, polyPart(LAYOUT.taxi3, tq), TX.w, asph); line(c, polyPart(LAYOUT.taxi3, tq), 0.8, PAL.taxiLine); }
    for (const [i, sid] of [[0, 'rail'], [1, 'road']]) {
      const q = sc.items.bridges ? 1 : sc.p('bridges', sid);
      if (q <= 0) continue;
      const [x, y] = LAYOUT.bridges[i];
      c.fillStyle = q < 1 ? '#a39a88' : '#c9c6bd'; c.fillRect(x - 30, y - 22 * q, 60, 44 * q);
      c.strokeStyle = '#6b6f73'; c.lineWidth = 1; c.strokeRect(x - 30, y - 22, 60, 44);
    }
    // the remote de-icing pads, and their glycol drains
    LAYOUT.deicePads.forEach((b, i) => {
      const q = sc.items.deicePad ? 1 : sc.p('deicePads', i === 0 ? 'south' : 'r3');
      if (q <= 0) return;
      c.fillStyle = sn ? '#cfd5da' : '#a7a49c'; c.fillRect(b[0], b[1], (b[2] - b[0]) * q, b[3] - b[1]);
      c.strokeStyle = '#e0a020'; c.lineWidth = 1.2; c.setLineDash([5, 4]); c.strokeRect(b[0] + 6, b[1] + 6, b[2] - b[0] - 12, b[3] - b[1] - 12); c.setLineDash([]);
    });
    if (sc.items.cargoCity || sc.p('cargoCity', 'halls') > 0) { const b = LAYOUT.cargoCity.box; c.fillStyle = sn ? '#d9dee3' : '#8a8e93'; c.fillRect(b[0] - 20, b[1] - 30, b[2] - b[0] + 40, 30); }
    for (let i = 0; i < Math.min(2, sc.items.solar || 0); i++) {
      const b = LAYOUT.solar[i];
      c.fillStyle = '#2b3d5c'; c.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]);
      c.strokeStyle = 'rgba(160,190,230,0.6)'; c.lineWidth = 0.6; c.beginPath();
      for (let y = b[1] + 8; y < b[3]; y += 12) { c.moveTo(b[0] + 4, y); c.lineTo(b[2] - 4, y); }
      c.stroke();
    }
  }

  // runway 2 (08/26): the strip cleared, the runway paved as far as it is, its markings, snow and lights
  function runway2(c, sc) {
    const R2 = LAYOUT.runway2, strip = sc.p('runway2', 'strip'), pave = sc.p('runway2', 'pave');
    if (strip <= 0) return;
    const L2 = Math.hypot(R2.to[0] - R2.from[0], R2.to[1] - R2.from[1]);
    const u = [(R2.to[0] - R2.from[0]) / L2, (R2.to[1] - R2.from[1]) / L2], n = [u[1], -u[0]];
    const pt = (s, t) => [R2.from[0] + u[0] * L2 * s + n[0] * t, R2.from[1] + u[1] * L2 * s + n[1] * t];
    const bandR = (s0, s1, t0, t1, fill) => quad(c, pt(s0, t0), pt(s1, t0), pt(s1, t1), pt(s0, t1), fill);
    const sn = sc.season === 'winter', w = R2.w / 2;
    bandR(0, strip, -120, 120, sn ? '#e8edf1' : '#8a8f6a');
    if (pave <= 0) return;
    bandR(-0.004, pave + 0.004, -w - 2, w + 2, sn ? '#c4cbd1' : '#6b6f63');
    bandR(0, pave, -w, w, PAL.asphalt);
    if (pave < 1) return;
    for (const [s, dir] of [[0.004, 1], [0.996, -1]]) for (let i = 0; i < 8; i++) { const t0 = -w + 2 + i * 5.2 + (i >= 4 ? 3 : 0); bandR(s, s + dir * 45 / L2, t0, t0 + 3.2, '#e9ecef'); }
    groundText(c, '08', ...pt(70 / L2, 0), u, 15, '#e9ecef');
    groundText(c, '26', ...pt(1 - 70 / L2, 0), [-u[0], -u[1]], 15, '#e9ecef');
    line(c, [pt(100 / L2, 0), pt(1 - 100 / L2, 0)], 0.9, '#e9ecef', [30, 20]);
    const r = sc.runway2;
    if (r && (r.snow > 0.2 || r.plough)) bandR(0, 1, -w, w, 'rgba(244,247,250,' + (clamp(r.snow / SNOW_CLOSE_MM, 0, 1) * 0.9 + 0.08) + ')');
    if (r && r.lit) for (let d = 0; d <= L2; d += 60) for (const t of [-w - 1.5, w + 1.5]) { const p = pt(d / L2, t); sc.lights.push({ x: p[0], y: p[1], z: 0.5, col: '255,236,180', r: 3 }); }
  }

  // the master plan's projects open in this mission and not finished: their plot outlined
  function plots(c, sc) {
    if (!sc.planning) return;
    for (const id of Object.keys(S.airport.projects)) {
      const p = S.airport.projects[id], def = PROJECTS[id];
      if (p.done || id === 'site' || id === 'lights1' || id === 'ils1' || id === 'arlandaExpress') continue;
      const b = def.plot;
      c.strokeStyle = 'rgba(255,214,90,0.95)'; c.lineWidth = 2 / (Cam.zoom * ISO_K); c.setLineDash([6, 4]);
      c.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12); c.setLineDash([]);
    }
  }

  // ---------- standing: the buildings ----------
  function crane(c, x, y, h, t) {
    Iso.units(c);
    const base = P(x, y, 0), top = P(x, y, h);
    c.strokeStyle = '#e0a020'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(base[0] - 1, base[1]); c.lineTo(top[0] - 1, top[1]); c.moveTo(base[0] + 1, base[1]); c.lineTo(top[0] + 1, top[1]); c.stroke();
    const a = t * 0.15, jx = Math.sin(a) * 28, jy = Math.cos(a) * 28;
    const j1 = P(x + jx, y + jy, h), j0 = P(x - jx * 0.3, y - jy * 0.3, h);
    c.lineWidth = 1.1; c.beginPath(); c.moveTo(j0[0], j0[1]); c.lineTo(j1[0], j1[1]); c.stroke();
    const hook = P(x + jx * 0.7, y + jy * 0.7, h * 0.45);
    c.strokeStyle = '#333'; c.lineWidth = 0.3; c.beginPath(); c.moveTo(...P(x + jx * 0.7, y + jy * 0.7, h)); c.lineTo(hook[0], hook[1]); c.stroke();
  }

  function terminal(c, sc) {
    const T = LAYOUT.terminal1, [x0, y0, x1, y1] = T.box;
    const hall = sc.p('terminal1', 'hall'), wait = sc.p('terminal1', 'waiting'), kiosk = sc.p('terminal1', 'kiosk');
    const warm = sc.dark > 0.3 ? mix(PAL.glass, '#ffd27a', clamp(sc.dark, 0, 1)) : PAL.glass;
    if (hall > 0) {
      if (hall < 1) {
        Iso.box(c, x0, y0, x1, y1, 0, 0.6, '#9a9a96');
        Iso.box(c, x0, y0, x1, y1, 0.6, 0.6 + (T.h - 0.6) * hall, '#b8b4ac', 'rgba(0,0,0,0)');
        c.strokeStyle = 'rgba(120,90,50,0.8)'; c.lineWidth = 0.25;
        for (let z = 2; z < T.h * hall; z += 2) { c.beginPath(); c.moveTo(...P(x0, y0 - 1, z)); c.lineTo(...P(x1 + 1, y0 - 1, z)); c.lineTo(...P(x1 + 1, y1, z)); c.stroke(); }
      } else {
        Iso.box(c, x0, y0, x1, y1, 0, T.h, '#eceae4', sc.season === 'winter' ? '#f4f7fa' : '#9da3a8');
        Iso.winSouth(c, x0, x1, y0, 2.2, 6.8, 5, warm);
        Iso.winEast(c, y0, y1, x1, 2.2, 6.8, 12, warm);
        // the sign over the landside door
        const a = P(x1 + 0.1, (y0 + y1) / 2 - 18, T.h + 3.2), b = P(x1 + 0.1, (y0 + y1) / 2 + 18, T.h + 0.6);
        Iso.poly(c, [[x1 + 0.1, (y0 + y1) / 2 - 18, T.h + 0.4], [x1 + 0.1, (y0 + y1) / 2 + 18, T.h + 0.4], [x1 + 0.1, (y0 + y1) / 2 + 18, T.h + 3.4], [x1 + 0.1, (y0 + y1) / 2 - 18, T.h + 3.4]], '#1f3f8f');
        c.save();
        const m = (y0 + y1) / 2, l = P(x1 + 0.1, m - 18, T.h + 1.9), r = P(x1 + 0.1, m + 18, T.h + 1.9);
        const dx = (r[0] - l[0]) / 36, dy = (r[1] - l[1]) / 36;
        c.transform(dx, dy, 0, 1, l[0], l[1]);
        c.font = '700 2.6px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
        c.fillText('ARLANDA', 18, 0.2);
        c.restore();
        void a; void b;
        if (sc.dark > 0.3) sc.lights.push({ x: x1 + 2, y: m, z: T.h + 2, col: '255,255,255', r: 6 });
      }
    }
    if (wait > 0) {
      const [a0, b0, a1, b1] = T.waiting;
      Iso.box(c, a0, b0, a1, b1, 0, 6 * wait, wait < 1 ? '#c8c4bc' : '#e3dfd6', sc.season === 'winter' ? '#f4f7fa' : '#8f969c');
      if (wait >= 1) Iso.winSouth(c, a0, a1, b0, 1.6, 4.6, 4, warm);
    }
    if (kiosk > 0 || sc.items.kiosk) {
      const [a0, b0, a1, b1] = T.kiosk;
      Iso.box(c, a0, b0, a1, b1, 0, 3, '#f0ede4');
      for (let i = 0; i < 4; i++) Iso.poly(c, [[a0 + i * 3, b0 - 1.5, 3.4], [a0 + i * 3 + 3, b0 - 1.5, 3.4], [a0 + i * 3 + 3, b0, 2.6], [a0 + i * 3, b0, 2.6]], i % 2 ? '#ffffff' : '#2f6fb3');
    }
  }

  function tower(c, sc) {
    const T = LAYOUT.tower1, b = T.base / 2;
    const f = sc.p('tower1', 'found'), sh = sc.p('tower1', 'shaft'), cab = sc.p('tower1', 'cab'), radio = sc.p('tower1', 'radio');
    if (f <= 0) return;
    Iso.box(c, T.x - b - 2, T.y - b - 2, T.x + b + 2, T.y + b + 2, 0, 0.8 * f, '#9a9893');
    const shaftH = T.h - 6;
    if (sh > 0) Iso.box(c, T.x - b * 0.55, T.y - b * 0.55, T.x + b * 0.55, T.y + b * 0.55, 0.8, 0.8 + shaftH * sh, '#d9d5cc');
    if (cab > 0) {
      const z0 = 0.8 + shaftH, glass = sc.dark > 0.3 ? '#9fe0c0' : '#7fa6bd';
      Iso.box(c, T.x - b, T.y - b, T.x + b, T.y + b, z0, z0 + 0.8, '#cfcbc2');
      Iso.box(c, T.x - b * 0.95, T.y - b * 0.95, T.x + b * 0.95, T.y + b * 0.95, z0 + 0.8, z0 + 0.8 + 3.6 * cab, glass, '#5e646a');
      if (cab >= 1) {
        Iso.box(c, T.x - b * 1.05, T.y - b * 1.05, T.x + b * 1.05, T.y + b * 1.05, z0 + 4.4, z0 + 5, '#ddd9d0');
        if (sc.dark > 0.3) sc.lights.push({ x: T.x, y: T.y, z: z0 + 2.5, col: '170,255,210', r: 7 });
      }
    }
    if (radio > 0) {
      const z = 0.8 + shaftH + 5, top = P(T.x, T.y, z + 8 * radio), bot = P(T.x, T.y, z);
      c.strokeStyle = '#555'; c.lineWidth = 0.3; c.beginPath(); c.moveTo(bot[0], bot[1]); c.lineTo(top[0], top[1]); c.stroke();
      if (radio >= 1) sc.lights.push({ x: T.x, y: T.y, z: z + 8, col: '255,40,40', r: 4, blink: 1 });
    }
  }

  function siteOffice(c, sc) {
    const o = LAYOUT.siteOffice;
    for (let i = 0; i < 3; i++) {
      Iso.box(c, o.x + i * 14, o.y, o.x + i * 14 + 10, o.y + 5, 0, 3, i === 1 ? '#c9b47a' : '#7d8d5a');
      Iso.gable(c, o.x + i * 14 - 0.4, o.y - 0.4, o.x + i * 14 + 10.4, o.y + 5.4, 3, 1.4, sc.season === 'winter' ? '#eef2f5' : '#4a4a48', true);
    }
    Iso.obox(c, o.x + 10, o.y - 14, 8, 2.6, 0, 2.6, 80, '#c7802a');
    Iso.obox(c, o.x + 24, o.y - 12, 9, 2.6, 0, 2.8, 100, '#5a7a3a');
  }

  function fireStation(c, sc) {
    const [x0, y0, x1, y1] = LAYOUT.fireStation.box, h = LAYOUT.fireStation.h;
    Iso.box(c, x0, y0, x1, y1, 0, h, '#e8e3d8', sc.season === 'winter' ? '#f4f7fa' : '#7c8288');
    for (let i = 0; i < 3; i++) Iso.poly(c, [[x0 + 4 + i * 15, y0 - 0.05, 0], [x0 + 15 + i * 15, y0 - 0.05, 0], [x0 + 15 + i * 15, y0 - 0.05, 5], [x0 + 4 + i * 15, y0 - 0.05, 5]], '#b8322a');
  }

  // the buildings of chapters 2 and 3, as far as they are built: a slab, walls going up, then the finished house
  function block(c, sc, box, h, q, wall, glassRows) {
    const [x0, y0, x1, y1] = box, warm = sc.dark > 0.3 ? mix(PAL.glass, '#ffd27a', clamp(sc.dark, 0, 1)) : PAL.glass;
    const roof = sc.season === 'winter' ? '#f4f7fa' : '#8f969c';
    if (q < 1) {
      Iso.box(c, x0, y0, x1, y1, 0, 0.6, '#9a9a96');
      if (q > 0.2) Iso.box(c, x0, y0, x1, y1, 0.6, 0.6 + (h - 0.6) * (q - 0.2) / 0.8, '#b8b4ac', 'rgba(0,0,0,0)');
      return;
    }
    Iso.box(c, x0, y0, x1, y1, 0, h, wall, roof);
    if (glassRows) { Iso.winSouth(c, x0, x1, y0, 1.6, h - 1.4, Math.max(2, Math.round((x1 - x0) / 8)), warm); Iso.winEast(c, y0, y1, x1, 1.6, h - 1.4, Math.max(3, Math.round((y1 - y0) / 9)), warm); }
  }
  function intlTerminal(c, sc) {
    const T = LAYOUT.intlTerminal, f = sc.p('intlTerminal', 'frame'), hall = sc.p('intlTerminal', 'hall'), pier = sc.p('intlTerminal', 'pier');
    const done = sc.items.intlTerminal ? 1 : null;
    const [x0, y0, x1, y1] = T.box;
    // the departure hall on the landside, the pier along the gates
    block(c, sc, [x0 + 25, y0, x1, y1], T.h, done || Math.min(f, 0.5) + hall * 0.5, '#e6e2d8', true);
    block(c, sc, [x0, y0 + 10, x0 + 25, y1 - 10], 7, done || Math.min(f, 0.5) + pier * 0.5, '#d9d5cc', true);
    if ((done || hall >= 1) && sc.dark > 0.3) sc.lights.push({ x: x1 + 2, y: (y0 + y1) / 2, z: T.h + 2, col: '255,255,255', r: 8 });
  }
  function cafe(c, sc) {
    const [x0, y0, x1, y1] = LAYOUT.cafe.box;
    Iso.box(c, x0, y0, x1, y1, 0, 5, '#efe6d2', sc.season === 'winter' ? '#f4f7fa' : '#8a5a3a');
    Iso.winSouth(c, x0, x1, y0, 1.2, 3.8, 3, sc.dark > 0.3 ? '#ffd27a' : PAL.glass);
  }

  // session 5: the new control tower of 2001 — a slender concrete shaft that narrows, the glass cab and its mast
  function tower2(c, sc) {
    const T = LAYOUT.tower2, q = sc.items.tower2 ? 1 : 1, fit = sc.items.tower2 ? 1 : sc.p('tower2', 'move');
    void q;
    const b = T.base / 2, h = T.h * 0.82;
    Iso.box(c, T.x - b, T.y - b, T.x + b, T.y + b, 0, 3, '#b9b5ac');
    for (let i = 0; i < 6; i++) {
      const k = 1 - i * 0.07, z0 = 3 + (h - 3) * i / 6, z1 = 3 + (h - 3) * (i + 1) / 6;
      Iso.box(c, T.x - b * 0.6 * k, T.y - b * 0.6 * k, T.x + b * 0.6 * k, T.y + b * 0.6 * k, z0, z1, '#d7d3ca');
    }
    const lit = fit >= 1 && sc.dark > 0.3;
    Iso.box(c, T.x - b * 0.85, T.y - b * 0.85, T.x + b * 0.85, T.y + b * 0.85, h, h + 6, lit ? '#ffe7a8' : '#5f8aa6', '#3e4448');
    Iso.box(c, T.x - b * 0.9, T.y - b * 0.9, T.x + b * 0.9, T.y + b * 0.9, h + 6, h + 7, '#e6e2da');
    Iso.box(c, T.x - 0.4, T.y - 0.4, T.x + 0.4, T.y + 0.4, h + 7, T.h * 1.08, '#9a9a9a');
    if (sc.dark > 0.2) sc.lights.push({ x: T.x, y: T.y, z: T.h * 1.08, col: '255,60,50', r: 4, blink: 1.5 });
  }
  function pierF(c, sc) {
    const P = LAYOUT.pierF.box, q = sc.items.pierF ? 1 : sc.p('pierF', 'gates');
    block(c, sc, [P[0], P[1], P[2], P[3] - 90], LAYOUT.pierF.h, q, '#e3e6e8', true);
    if (sc.items.codeF || sc.p('gateF', 'stand') > 0) block(c, sc, [P[0], P[3] - 90, P[2], P[3]], LAYOUT.pierF.h + 2, sc.items.codeF ? 1 : sc.p('gateF', 'stand'), '#e3e6e8', true);
    // jet bridges reaching out to the stands
    if (sc.items.jetBridges) for (const y of [1690, 1755, 1820, 1885].concat(sc.items.codeF ? [1950, 1935] : [])) Iso.box(c, P[0] - 22, y - 2, P[0], y + 2, 4, 6.5, '#cfd2d4');
  }

  // every standing building, as objects for render/map.js to sort
  function objects(sc, list) {
    const add = (x, y, fn) => list.push({ d: depthOf(x, y), draw: fn });
    const T = LAYOUT.terminal1;
    if (sc.p('terminal1', 'hall') > 0 || sc.items.terminal) add(T.box[2], T.box[1], (c) => terminal(c, sc));
    if (sc.p('tower1', 'found') > 0 || sc.items.tower) add(LAYOUT.tower1.x + 5, LAYOUT.tower1.y - 5, (c) => tower(c, sc));
    if (sc.items.fireStation) add(LAYOUT.fireStation.box[2], LAYOUT.fireStation.box[1], (c) => fireStation(c, sc));
    if (sc.items.cafe) add(LAYOUT.cafe.box[2], LAYOUT.cafe.box[1], (c) => cafe(c, sc));
    // session 3
    const I = LAYOUT.intlTerminal.box;
    if (sc.p('intlTerminal', 'frame') > 0 || sc.items.intlTerminal) add(I[2], I[1], (c) => intlTerminal(c, sc));
    const D = LAYOUT.domTerminal.box;
    if (sc.p('domTerminal', 'hall') > 0 || sc.items.domTerminal) add(D[2], D[1], (c) => block(c, sc, D, LAYOUT.domTerminal.h, sc.items.domTerminal ? 1 : sc.p('domTerminal', 'hall'), '#ece6da', true));
    const B = LAYOUT.bagHall.box;
    if (sc.p('bagHall', 'hall') > 0 || sc.items.bagHall) add(B[2], B[1], (c) => block(c, sc, B, LAYOUT.bagHall.h, sc.items.bagHall ? 1 : sc.p('bagHall', 'hall'), '#c9c4b8', false));
    // session 4: Terminal 2, the sorting hall
    const T2 = LAYOUT.terminal2.box;
    if (sc.p('terminal2', 'hall') > 0 || sc.items.terminal2) add(T2[2], T2[1], (c) => block(c, sc, T2, LAYOUT.terminal2.h, sc.items.terminal2 ? 1 : sc.p('terminal2', 'hall'), '#e8ecef', true));
    const SH = LAYOUT.sorterHall.box;
    if (sc.p('sorterHall', 'hall') > 0 || sc.items.sorterHall) add(SH[2], SH[1], (c) => block(c, sc, SH, LAYOUT.sorterHall.h, sc.items.sorterHall ? 1 : sc.p('sorterHall', 'hall'), '#c9c4b8', false));
    // session 5: the new tower, Pier F, Sky City and its hotel, Cargo City, offices, the aquifer's pump house
    if (sc.items.tower2 || sc.p('tower2', 'systems') > 0) add(LAYOUT.tower2.x + 6, LAYOUT.tower2.y - 6, (c) => tower2(c, sc));
    if (sc.items.pierF || sc.p('pierF', 'gates') > 0) add(LAYOUT.pierF.box[2], LAYOUT.pierF.box[1], (c) => pierF(c, sc));
    for (const [k, pid, sid, wall] of [['skyCity', 'skyCity', 'hall', '#e9e4d6'], ['hotel', 'skyCity', 'hotel', '#d9dde2'], ['hotelExt', null, null, '#d2d7dd'],
      ['offices', null, null, '#dfe3e6'], ['cargoCity', 'cargoCity', 'halls', '#c9c4b8'], ['aquifer', 'aquifer', 'plant', '#a9b39a']]) {
      const g = LAYOUT[k], q = sc.items[k] ? 1 : pid ? sc.p(pid, sid) : 0;
      if (q > 0) add(g.box[2], g.box[1], (c) => block(c, sc, g.box, g.h, q, wall, k !== 'aquifer' && k !== 'cargoCity'));
    }
    if (sc.items.offices > 1) { const g = LAYOUT.offices.box, b2 = [g[0], g[3] + 10, g[2], g[3] + 60]; add(b2[2], b2[1], (c) => block(c, sc, b2, 16, 1, '#dfe3e6', true)); }
    const K = LAYOUT.computerRoom.box;
    if (sc.p('computerRoom', 'room') > 0 || sc.items.computerRoom) add(K[2], K[1], (c) => block(c, sc, K, LAYOUT.computerRoom.h, sc.items.computerRoom ? 1 : sc.p('computerRoom', 'room'), '#d5d8dc', true));
    for (const k of ['generator', 'restaurant', 'dutyFree']) {
      const g = LAYOUT[k];
      if (sc.items[k]) add(g.box[2], g.box[1], (c) => block(c, sc, g.box, g.h, 1, k === 'generator' ? '#7d8a6a' : '#efe6d2', k !== 'generator'));
    }
    // the crash tenders by the fire station, the airport coaches at the kerb
    for (let i = 0; i < Math.min(4, sc.items.crashTender || 0); i++) {
      const x = LAYOUT.fireStation.box[0] + 6 + i * 12, y = LAYOUT.fireStation.box[1] - 8;
      add(x, y, (c) => Iso.obox(c, x, y, 9, 3, 0, 3.2, 90, '#c8322a'));
    }
    if (sc.items.busStop) for (let i = 0; i < 2; i++) { const x = LAYOUT.busStop.x, y = LAYOUT.busStop.y + i * 18; add(x, y, (c) => Iso.obox(c, x, y, 12, 2.5, 0, 3.2, 0, '#e8e8e8')); }
    // the instrument landing system's localizer beyond the 19 end
    if (sc.items.ils || sc.p('ils1', 'antennas') >= 1) {
      const p0 = Ground.rwPoint(1 + 300 / Ground.LEN, 0);
      add(p0[0], p0[1], (c) => { for (let i = -3; i <= 3; i++) { const q = Ground.rwPoint(1 + 300 / Ground.LEN, i * 6); Iso.obox(c, q[0], q[1], 1, 1, 0, 3, 0, '#c9c9c9'); } });
    }
    if (sc.siteWork) add(LAYOUT.siteOffice.x + 40, LAYOUT.siteOffice.y, (c) => siteOffice(c, sc));
    // cranes at the stages being built
    for (const id of Object.keys(S.airport.projects)) {
      const p = S.airport.projects[id];
      if (!Object.values(p.stages).some((s) => s.on && !s.done)) continue;
      const pl = PROJECTS[id] && PROJECTS[id].plot;
      const pos = id === 'tower1' ? [LAYOUT.tower1.x + 18, LAYOUT.tower1.y + 6, 42] : id === 'terminal1' ? [T.box[2] + 12, T.box[3] - 20, 28] :
        pl && ['intlTerminal', 'domTerminal', 'bagHall', 'computerRoom', 'terminal2', 'sorterHall', 'schengen', 'pierF', 'skyCity', 'cargoCity', 'gateF', 'tower2'].indexOf(id) >= 0 ? [pl.x + pl.w + 10, pl.y + pl.h / 2, 34] :
        id === 'runway3' ? [LAYOUT.runway3.from[0] + 120, LAYOUT.runway3.from[1] + 1200, 30] : id === 'bridges' ? [LAYOUT.bridges[0][0], LAYOUT.bridges[0][1] + 40, 30] :
        id === 'arlandaExpress' ? [LAYOUT.rail.south[0] + 30, LAYOUT.rail.south[1], 30] : null;
      if (pos) add(pos[0], pos[1], (c) => crane(c, pos[0], pos[1], pos[2], sc.anim));
    }
    // floodlight masts round the apron
    if (sc.apron && sc.dark > 0.25) {
      const A = LAYOUT.apron1;
      for (const [x, y] of [[A.x0 + 20, A.y1 - 10], [A.x0 + 20, A.y0 + 10], [A.x1 - 120, A.y0 + 5], [A.x1 - 120, A.y1 - 5]]) sc.lights.push({ x, y, z: 18, col: '255,170,80', r: 70, flood: true });
    }
  }

  return { flat, objects, standPos, standIndex, standEntry };
})();
