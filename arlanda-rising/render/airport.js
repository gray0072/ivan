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
  function standPos(i) { return i < LAYOUT.stands.length ? LAYOUT.stands[i] : LAYOUT.remote[(i - LAYOUT.stands.length) % LAYOUT.remote.length]; }
  function standIndex(id) { return S.airport.stands.findIndex((s) => s.id === id); }
  // the point the stand's lead-in line starts at (the aircraft taxis there, then in)
  function standEntry(i) { const p = standPos(i); return [p.x - 75, p.y]; }

  function quad(c, a, b, cc, d, fill) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fillStyle = fill; c.fill(); }
  function band(c, s0, s1, t0, t1, fill) { quad(c, rp(s0, t0), rp(s1, t0), rp(s1, t1), rp(s0, t1), fill); }
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
      const onApron = p.x >= A.x0 && p.x <= A.x1 && p.y >= A.y0 && p.y <= A.y1;
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
    plots(c, sc);
  }

  // the master plan's projects open in this mission and not finished: their plot outlined
  function plots(c, sc) {
    if (!sc.planning) return;
    for (const id of Object.keys(S.airport.projects)) {
      const p = S.airport.projects[id], def = PROJECTS[id];
      if (p.done || id === 'site' || id === 'lights1') continue;
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

  function cafe(c, sc) {
    const [x0, y0, x1, y1] = LAYOUT.cafe.box;
    Iso.box(c, x0, y0, x1, y1, 0, 5, '#efe6d2', sc.season === 'winter' ? '#f4f7fa' : '#8a5a3a');
    Iso.winSouth(c, x0, x1, y0, 1.2, 3.8, 3, sc.dark > 0.3 ? '#ffd27a' : PAL.glass);
  }

  // every standing building, as objects for render/map.js to sort
  function objects(sc, list) {
    const add = (x, y, fn) => list.push({ d: depthOf(x, y), draw: fn });
    const T = LAYOUT.terminal1;
    if (sc.p('terminal1', 'hall') > 0 || sc.items.terminal) add(T.box[2], T.box[1], (c) => terminal(c, sc));
    if (sc.p('tower1', 'found') > 0 || sc.items.tower) add(LAYOUT.tower1.x + 5, LAYOUT.tower1.y - 5, (c) => tower(c, sc));
    if (sc.items.fireStation) add(LAYOUT.fireStation.box[2], LAYOUT.fireStation.box[1], (c) => fireStation(c, sc));
    if (sc.items.cafe) add(LAYOUT.cafe.box[2], LAYOUT.cafe.box[1], (c) => cafe(c, sc));
    if (sc.siteWork) add(LAYOUT.siteOffice.x + 40, LAYOUT.siteOffice.y, (c) => siteOffice(c, sc));
    // cranes at the stages being built
    for (const id of Object.keys(S.airport.projects)) {
      const p = S.airport.projects[id];
      if (!Object.values(p.stages).some((s) => s.on && !s.done)) continue;
      const pos = id === 'tower1' ? [LAYOUT.tower1.x + 18, LAYOUT.tower1.y + 6, 42] : id === 'terminal1' ? [T.box[2] + 12, T.box[3] - 20, 28] : null;
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
