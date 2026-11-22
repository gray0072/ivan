'use strict';

// Arlanda Rising — the airport on the map: runway 1 with its markings, snow and lights; the parallel taxiway and its
// links; the first apron with its stands and the remote stands bought later; the ploughs' standing and the fuel
// trucks' yard by the fire station (and where each vehicle waits: fuelSpot, ploughSpot); the fire station with its six
// bays, its crash tenders parked nose out on its apron and its firefighters (fireBays); and the buildings as they stand —
// or as far as they are built (the master plan's projects show their stages: a slab, walls going up, a crane;
// a project open but not started shows its plot outlined; the airport's own shops as awnings on their terminal's landside
// wall, never as buildings of their own). Flat things are drawn by `flat`, standing ones are
// handed to render/map.js as objects to sort; lamps go to the scene's light list (drawn after the dark). With the roofs
// off (sc.cut) a finished building is drawn cut away with its insides by render/interiors.js; every building drawn is
// kept with its box for a tap (`hitSite`) and the yellow ring round the one whose card is open (`ring`).

const AirportArt = (() => {
  const RW = LAYOUT.runway1, TX = LAYOUT.taxi;
  // the aprons after the first: their plot in LAYOUT, the project and its stage that pave them (and the item that stands
  // for it once built, where there is one)
  const APRONS = [['apron2', 'apron2', 'pave'], ['apron3', 'domTerminal', 'apron'], ['apron4', 'terminal2', 'gates'], ['apron5', 'pierF', 'apron'], ['apron6', 'pier2040', 'gates'],
    ['apron7', 'pier2040', 'arm', 'pierArm']];
  const rp = (s, t) => Ground.rwPoint(s, t);

  // a stand's place on the map: the apron's in order, then the remote slots
  // (a stand a project placed keeps its own place, `at`; session 3); x, y the stop bar's point by the nose, hdg 90 (nose
  // east, the aircraft west of the point) or 270 (nose west, the aircraft east of it); `s` +1 or −1 along x from the nose
  // to the tail's side is −s
  function standPos(i) {
    const st = S.airport.stands[i];
    if (st && st.at) return st.hdg === 270 ? { x: st.at[0], y: st.at[1], hdg: 270, s: -1 } : { x: st.at[0], y: st.at[1], hdg: 90, s: 1 };
    let k = 0;
    for (let j = 0; j < i; j++) if (!S.airport.stands[j].at) k++;
    const q = k < LAYOUT.stands.length ? LAYOUT.stands[k] : LAYOUT.remote[(k - LAYOUT.stands.length) % LAYOUT.remote.length];
    return { x: q.x, y: q.y, hdg: 90, s: 1 };
  }
  // the ground a stand takes: from its stop bar back over the aircraft, `back` m, and `half` m to each side
  function standBox(p, back, front, half) { return p.s > 0 ? [p.x - back, p.y - half, p.x + front, p.y + half] : [p.x - front, p.y - half, p.x + back, p.y + half]; }
  function standIndex(id) { return S.airport.stands.findIndex((s) => s.id === id); }
  // the point the stand's lead-in line starts at (the aircraft taxis there, then in)
  function standEntry(i) { const p = standPos(i); return [p.x - 75 * p.s, p.y]; }
  // a remote stand: one of LAYOUT.remote (no place of its own, `at`) lying off the first apron
  function isRemote(i) {
    const st = S.airport.stands[i], p = standPos(i), A = LAYOUT.apron1;
    return !!st && !st.at && !(p.x >= A.x0 && p.x <= A.x1 && p.y >= A.y0 && p.y <= A.y1);
  }
  // a remote stand's paved way to the first apron: the line the aircraft taxi along both ways (render/traffic.js), from
  // the stand's entry straight north or south to the apron, and east onto it when the entry lies west of the apron
  function remoteWay(i) {
    const e = standEntry(i), A = LAYOUT.apron1;
    const y = Math.min(Math.max(e[1], A.y0 + 12), A.y1 - 12), x = Math.max(e[0], A.x0 + 12);
    return [[e[0] + 6, e[1]], [e[0], e[1]], [e[0], y]].concat(x !== e[0] ? [[x, y]] : []);
  }
  // the fuel trucks wait by the first apron's north edge (LAYOUT.fuelDepot) until the jet apron is begun, which paves
  // that place over; from then on in their own yard by the fire station (LAYOUT.fuelYard)
  function fuelYardOn() { const pr = S.airport.projects.apron2, st = pr && pr.stages.pave; return !!(st && st.p > 0); }
  // where fuel truck i waits: [x, y], or null when the yard's rows are full (it is not drawn at rest then)
  function fuelSpot(i) {
    if (!fuelYardOn()) return [LAYOUT.fuelDepot.x + i * 5, LAYOUT.fuelDepot.y];
    const Y = LAYOUT.fuelYard, r = Math.floor(i / Y.cols);
    return r < Y.rows.length ? [Y.x + (i % Y.cols) * Y.dx, Y.rows[r]] : null;
  }
  // a fuel truck's way from where it waits to the edge of the aprons: out of its bay to the yard's aisle and east along
  // its lane onto the jet apron (before the yard: just its place by the first apron)
  function fuelWayOut(i) {
    const Y = LAYOUT.fuelYard;
    if (!fuelYardOn()) return [fuelSpot(i)];
    const p = fuelSpot(i) || [Y.box[2] - 4, Y.aisle + 6];
    return [p, [p[0], Y.aisle], Y.gate];
  }
  // where plough i stands at the shed: [x, y], or null past its two rows
  function ploughSpot(i) {
    const D = LAYOUT.snowDepot, r = Math.floor(i / D.cols);
    return r < D.rows.length ? [D.x + (i % D.cols) * D.dx, D.rows[r]] : null;
  }

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
      if (sc.apron) for (const k of [TX.apronLink, TX.apronOut]) line(c, [rp(k.s, TX.offset), k.to], tw, asph);
      const yl = PAL.taxiLine;
      line(c, [rp(0, TX.offset), rp(1, TX.offset)], 0.8, yl);
      for (const s of TX.links) line(c, [rp(s, 6), rp(s, TX.offset)], 0.8, yl);
      if (sc.apron) for (const k of [TX.apronLink, TX.apronOut]) line(c, [rp(k.s, TX.offset), k.to], 0.8, yl);
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
    // runway 2's taxiway, under the aprons it runs into (a stub from the jet apron until the runway is built); its
    // straight entry square to the runway ends flush with the runway's edge (the aircraft go on to its last point on
    // the centreline), the holding line across it (solid on the taxiway's side, dashed on the runway's)
    if (sc.p('apron2', 'pave') >= 1) {
      const T2 = LAYOUT.taxi2, R2 = LAYOUT.runway2, asph = sc.season === 'winter' ? '#5a5f64' : '#4b4f54';
      if (!sc.runway2) line(c, T2.slice(0, 2), TX.w, asph);
      else {
        const e = T2[T2.length - 1], q = T2[T2.length - 2], l = Math.hypot(q[0] - e[0], q[1] - e[1]), v = [(q[0] - e[0]) / l, (q[1] - e[1]) / l];
        const at = (d, t) => [e[0] + v[0] * d - v[1] * t, e[1] + v[1] * d + v[0] * t], hw = TX.w / 2 - 1.5;
        line(c, T2.slice(0, -1).concat([at(R2.w / 2, 0)]), TX.w, asph);
        line(c, [at(R2.hold + 1.2, -hw), at(R2.hold + 1.2, hw)], 0.6, PAL.taxiLine);
        line(c, [at(R2.hold, -hw), at(R2.hold, hw)], 0.6, PAL.taxiLine, [2, 1.5]);
      }
    }
    // the ploughs' standing (asphalt) and the fuel trucks' yard with its bays and its lane onto the jet apron
    const winter = sc.season === 'winter';
    if (sc.items.plough) { const b = LAYOUT.snowDepot.box; c.fillStyle = winter ? '#9aa1a7' : '#5d6166'; c.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); }
    // the fire station's apron in front of its doors: a yellow box in front of each bay, where its tender stands
    if (sc.items.fireStation || sc.p('fireStation', 'station') >= 1) {
      const F = LAYOUT.fireStation, a = F.apron;
      c.fillStyle = winter ? '#cfd5da' : PAL.concrete; c.fillRect(a[0], a[1], a[2] - a[0], a[3] - a[1]);
      c.strokeStyle = PAL.taxiLine; c.lineWidth = 0.3; c.beginPath();
      for (const bay of fireBays(sc)) c.rect(bay.x - 2.6, F.box[1] - 12, 5.2, 11.5);
      c.stroke();
    }
    if (fuelYardOn()) {
      const Y = LAYOUT.fuelYard, b = Y.box, pave = winter ? '#cfd5da' : PAL.concrete;
      line(c, [[b[2] - 1, Y.aisle], Y.gate], 9, pave);
      c.fillStyle = pave; c.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]);
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.35; c.beginPath();
      for (const y of Y.rows) for (let k = 0; k <= Y.cols; k++) { const x = Y.x + (k - 0.5) * Y.dx; c.moveTo(x, y - 4.6); c.lineTo(x, y + 4.6); }
      c.stroke();
      line(c, [[b[0] + 3, Y.aisle], [Y.gate[0] - 6, Y.aisle]], 0.5, PAL.taxiLine, [3, 3]);
    }
    // the jet apron and the domestic apron, as far as they are paved
    for (const [key, pid, sid, item] of APRONS) {
      const q = item && sc.items[item] ? 1 : sc.p(pid, sid);
      if (q <= 0) continue;
      const B = LAYOUT[key];
      c.fillStyle = q < 1 ? '#a39a88' : sc.season === 'winter' ? '#cfd5da' : PAL.concrete;
      c.fillRect(B.x0, B.y0, (B.x1 - B.x0) * Math.min(1, q * 1.2), B.y1 - B.y0);
    }
    // the satellite's apron reaches over the finger's place for its east side's lane; the cargo apron by Cargo City
    const conc = sc.season === 'winter' ? '#cfd5da' : PAL.concrete;
    if (S.airport.pierDesign === 'satellite' && sc.p('pier2040', 'gates') > 0) { const b = LAYOUT.pier2040.satApron; c.fillStyle = conc; c.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); }
    if (sc.items.cargoStand) { const b = LAYOUT.cargoApron; c.fillStyle = conc; c.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }
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
      const onApron = (!!st.at && !st.pad) || (p.x >= A.x0 && p.x <= A.x1 && p.y >= A.y0 && p.y <= A.y1);
      // session 6: a stand with its own pad (the cargo stands, the second arm's)
      if (st.pad) { const b = standBox(p, 74, 8, 28); c.fillStyle = sc.season === 'winter' ? '#cfd5da' : PAL.concrete; c.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); }
      else if (!onApron) {
        c.fillStyle = sc.season === 'winter' ? '#cfd5da' : PAL.concrete;
        c.fillRect(p.x - 70, p.y - 26, 78, 52);
        line(c, remoteWay(i), 20, sc.season === 'winter' ? '#cfd5da' : PAL.concrete);
      }
      const hl = sc.standMark && sc.standMark[st.id];
      const k = p.s, bx = standBox(p, 72, 2, 27);
      line(c, [[p.x - 70 * k, p.y], [p.x - 2 * k, p.y]], hl ? 3 : 0.8, hl ? hl : PAL.taxiLine);
      line(c, [[p.x - 2 * k, p.y - 6], [p.x - 2 * k, p.y + 6]], 1.2, PAL.taxiLine);
      groundText(c, st.name, p.x - 60 * k, p.y + 12, [1, 0], 9, st.closed ? '#e35b4f' : PAL.taxiLine);
      if (hl) {
        c.strokeStyle = hl; c.lineWidth = 2.5; c.setLineDash([5, 4]);
        c.strokeRect(bx[0], bx[1], bx[2] - bx[0], bx[3] - bx[1]); c.setLineDash([]);
      }
      if (st.closed) { c.fillStyle = 'rgba(227,91,79,0.25)'; c.fillRect(bx[0], bx[1], bx[2] - bx[0], bx[3] - bx[1]); }
      // session 6: a charging stand's green post and cable
      if (st.charge) { c.fillStyle = '#2f9e5b'; c.fillRect(p.x - 9 * k - 3, p.y - 22, 6, 6); line(c, [[p.x - 9 * k, p.y - 16], [p.x - 20 * k, p.y - 6]], 0.8, '#2f9e5b'); }
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
    if (sc.items.cargoCity || sc.p('cargoCity', 'halls') > 0) { const b = LAYOUT.cargoCity.yard; c.fillStyle = sn ? '#d9dee3' : '#8a8e93'; c.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); }
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
    const sn = sc.season === 'winter', w = R2.w / 2, e = 60 / L2;
    // the strip, 60 m past each end (render/map.js clears the forest to its square ends)
    bandR(-e, strip * (1 + e), -120, 120, sn ? '#e8edf1' : '#8a8f6a');
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
    c.fillStyle = '#333'; c.fillRect(hook[0] - 0.5, hook[1], 1, 0.9);
    // the counterweight at the back of the jib, the driver's cab under it at the top of the mast
    Iso.box(c, x - jx * 0.3 - 1.2, y - jy * 0.3 - 1.2, x - jx * 0.3 + 1.2, y - jy * 0.3 + 1.2, h - 1.6, h, '#7d8186');
    Iso.box(c, x - 1, y - 1, x + 1, y + 1, h - 2.2, h - 0.2, '#e0a020', '#c78a12');
  }

  // the airport's own shops of a terminal, seen from outside with the roofs on: a striped awning on its landside (east)
  // wall for each, as long as the cells it takes, in its colour (PAL.shop) — never a building of its own; inside, with the
  // roofs off, each sits in its cells (render/interiors.js)
  const AWNING_CELL = 9;   // m of wall per cell
  function awnings(c, term, box) {
    const x = box[2] + 0.05;
    let y = box[1] + 6;
    for (const s of Airport.shopsIn(term)) {
      if (s.buy) continue;
      const len = s.cells * AWNING_CELL - 1, col = PAL.shop[s.kind] || '#888';
      if (y + len > box[3] - 4) break;
      for (let k = 0, a = y; a < y + len - 0.01; k++, a += 1.5) {
        const b = Math.min(y + len, a + 1.5);
        Iso.poly(c, [[x, a, 3.4], [x, b, 3.4], [x + 2.6, b, 2.3], [x + 2.6, a, 2.3]], k % 2 ? '#f4f1ea' : col);
      }
      Iso.poly(c, [[x + 2.6, y, 2.3], [x + 2.6, y + len, 2.3], [x + 2.6, y + len, 1.8], [x + 2.6, y, 1.8]], shade(col, -0.2));
      // its sign board on the wall over the awning
      const m = y + len / 2, w = Math.min(3, len / 2 - 0.5);
      Iso.poly(c, [[x, m - w, 4.3], [x, m + w, 4.3], [x, m + w, 6], [x, m - w, 6]], col);
      Iso.poly(c, [[x + 0.02, m - w + 0.5, 4.95], [x + 0.02, m + w - 0.5, 4.95], [x + 0.02, m + w - 0.5, 5.35], [x + 0.02, m - w + 0.5, 5.35]], '#ffffff');
      y += len + 3;
    }
  }

  function terminal(c, sc) {
    const T = LAYOUT.terminal1, [x0, y0, x1, y1] = T.box;
    const hall = sc.p('terminal1', 'hall'), wait = sc.p('terminal1', 'waiting');
    const warm = sc.dark > 0.3 ? mix(PAL.glass, '#ffd27a', clamp(sc.dark, 0, 1)) : PAL.glass;
    // the waiting room stands north of the hall, behind it as the map is seen: drawn first, so the hall hides its south
    // wall and only its roof and east wall show (drawn after the hall it was painted over the hall's roof, as if hanging)
    if (wait > 0) {
      const [a0, b0, a1, b1] = T.waiting;
      Iso.box(c, a0, b0, a1, b1, 0, 6 * wait, wait < 1 ? '#c8c4bc' : '#e3dfd6', sc.season === 'winter' ? '#f4f7fa' : '#8f969c');
      if (wait >= 1) Iso.winEast(c, b0, b1, a1, 1.6, 4.6, 4, warm);
    }
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
        // two small lamps, one at each end of the sign, so that the light never covers the letters
        for (const s of [-1, 1]) {
          const y = m + s * 22;
          Iso.box(c, x1 - 0.4, y - 0.2, x1, y + 0.2, T.h, T.h + 2.3, '#3a3f45');
          Iso.box(c, x1 - 0.4, y - 0.5, x1 + 1.1, y + 0.5, T.h + 2.3, T.h + 2.8, '#3a3f45', sc.dark > 0.3 ? '#fff6d8' : '#5a6068');
        }
        if (sc.dark > 0.3) for (const s of [-1, 1]) sc.lights.push({ x: x1 + 0.8, y: m + s * 22, z: T.h + 2.3, col: '255,255,255', r: 2.2 });
      }
    }
    if (hall >= 1) awnings(c, 't1', T.box);
  }

  function tower(c, sc) {
    const T = LAYOUT.tower1, b = T.base / 2;
    const f = sc.p('tower1', 'found'), sh = sc.p('tower1', 'shaft'), cab = sc.p('tower1', 'cab'), radio = sc.p('tower1', 'radio');
    if (f <= 0) return;
    Iso.box(c, T.x - b - 2, T.y - b - 2, T.x + b + 2, T.y + b + 2, 0, 0.8 * f, '#9a9893');
    const shaftH = T.h - 6;
    if (sh > 0) Iso.box(c, T.x - b * 0.55, T.y - b * 0.55, T.x + b * 0.55, T.y + b * 0.55, 0.8, 0.8 + shaftH * sh, '#d9d5cc');
    // with the roofs off the finished cab is cut away (render/interiors.js): the controllers at their consoles, and the
    // radio mast stands at its back corner instead of on the roof
    const cut = sc.cut && cab >= 1;
    const mast = () => {
      if (radio <= 0) return;
      const mx = cut ? T.x - b * 0.95 : T.x, my = cut ? T.y + b * 0.95 : T.y;
      const z = 0.8 + shaftH + 5, top = P(mx, my, z + 8 * radio), bot = P(mx, my, cut ? z - 4.2 : z);
      c.strokeStyle = '#555'; c.lineWidth = 0.3; c.beginPath(); c.moveTo(bot[0], bot[1]); c.lineTo(top[0], top[1]); c.stroke();
      if (radio >= 1) sc.lights.push({ x: mx, y: my, z: z + 8, col: '255,40,40', r: 4, blink: 1 });
    };
    if (cut) mast();
    if (cab > 0) {
      const z0 = 0.8 + shaftH, glass = sc.dark > 0.3 ? '#9fe0c0' : '#7fa6bd';
      Iso.box(c, T.x - b, T.y - b, T.x + b, T.y + b, z0, z0 + 0.8, '#cfcbc2');
      if (cut) Interiors.cab(c, sc, 'tower1', T.x, T.y, b * 0.95, z0 + 0.8, true);
      else Iso.box(c, T.x - b * 0.95, T.y - b * 0.95, T.x + b * 0.95, T.y + b * 0.95, z0 + 0.8, z0 + 0.8 + 3.6 * cab, glass, '#5e646a');
      if (cab >= 1) {
        if (!cut) Iso.box(c, T.x - b * 1.05, T.y - b * 1.05, T.x + b * 1.05, T.y + b * 1.05, z0 + 4.4, z0 + 5, '#ddd9d0');
        if (sc.dark > 0.3) sc.lights.push({ x: T.x, y: T.y, z: z0 + 2.5, col: '170,255,210', r: 7 });
      }
    }
    if (!cut) mast();
  }

  function siteOffice(c, sc) {
    const o = LAYOUT.siteOffice;
    for (let i = 0; i < 3; i++) {
      Iso.box(c, o.x + i * 14, o.y, o.x + i * 14 + 10, o.y + 5, 0, 3, i === 1 ? '#c9b47a' : '#7d8d5a');
      Iso.gable(c, o.x + i * 14 - 0.4, o.y - 0.4, o.x + i * 14 + 10.4, o.y + 5.4, 3, 1.4, sc.season === 'winter' ? '#eef2f5' : '#4a4a48', true);
    }
    Vehicles.lorry(c, o.x + 10, o.y - 14, 80, '#c7802a', '#8a8f94');
    Vehicles.lorry(c, o.x + 24, o.y - 12, 100, '#5a7a3a', '#c9b47a');
  }

  // the fire station's bays, west to east: { x (the bay's middle), tender (a crash tender stands in it) } — the station's
  // own tenders first, then those bought (data/layout.js fireStation)
  function fireBays(sc) {
    const F = LAYOUT.fireStation, n = Math.min(F.bays, F.own + ((sc && sc.items.crashTender) || 0)), out = [];
    for (let i = 0; i < F.bays; i++) out.push({ x: F.box[0] + F.bay0 + i * F.pitch, tender: i < n });
    return out;
  }
  // the station with a door to each bay: open (dark, lit at night) with its tender parked nose out on the apron, or shut
  // (a red roller door); a few firefighters by the tenders. Drawn with the building, so the tenders in front of its long
  // front are never sorted behind it
  function fireStation(c, sc) {
    const F = LAYOUT.fireStation, [x0, y0, x1, y1] = F.box, h = F.h, y = y0 - 0.05;
    Iso.box(c, x0, y0, x1, y1, 0, h, '#e8e3d8', sc.season === 'winter' ? '#f4f7fa' : '#7c8288');
    const bays = fireBays(sc), inside = sc.dark > 0.3 ? '#6b5a3c' : '#34383d';
    for (const b of bays) {
      Iso.poly(c, [[b.x - 2.6, y, 0], [b.x + 2.6, y, 0], [b.x + 2.6, y, 5], [b.x - 2.6, y, 5]], b.tender ? inside : '#b8322a');
      if (!b.tender) for (let z = 1; z < 5; z += 1) Iso.poly(c, [[b.x - 2.6, y - 0.01, z], [b.x + 2.6, y - 0.01, z], [b.x + 2.6, y - 0.01, z + 0.08], [b.x - 2.6, y - 0.01, z + 0.08]], '#8e2620');
    }
    // the station's name band over the doors
    Iso.poly(c, [[x0 + 1, y, 5.8], [x1 - 1, y, 5.8], [x1 - 1, y, 7], [x0 + 1, y, 7]], '#c8322a');
    for (const b of bays) if (b.tender) Vehicles.crashTender(c, b.x, y0 - 5.6, 180);
    if (Cam.zoom >= 1) {
      const crew = [[bays[0].x + 4, y0 - 3], [bays[1].x + 4, y0 - 9], [bays[3].x + 4, y0 - 2], [bays[4].x + 4, y0 - 11.5], [bays[5].x + 4, y0 - 12.5]];
      crew.forEach(([px, py], i) => firefighter(c, px + (i % 2) * 0.8, py));
    }
  }
  // a firefighter standing: a dark uniform with a reflective band, a yellow helmet
  function firefighter(c, x, y) {
    const a = P(x, y, 0), m = P(x, y, 1.0), b = P(x, y, 1.7);
    c.lineCap = 'round'; c.lineWidth = 0.6;
    c.strokeStyle = '#26324a'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    c.strokeStyle = '#e8e36a'; c.lineWidth = 0.62; c.beginPath(); c.moveTo(m[0], m[1] + 0.12); c.lineTo(m[0], m[1] - 0.12); c.stroke();
    c.fillStyle = '#f2c230'; c.beginPath(); c.arc(b[0], b[1] - 0.25, 0.34, 0, Math.PI * 2); c.fill();
  }

  // the buildings of chapters 2 and 3, as far as they are built: a slab, walls going up, then the finished house
  // `off`: a mothballed building, its windows dark (session 6)
  function block(c, sc, box, h, q, wall, glassRows, off) {
    const [x0, y0, x1, y1] = box, warm = off ? '#4a5561' : sc.dark > 0.3 ? mix(PAL.glass, '#ffd27a', clamp(sc.dark, 0, 1)) : PAL.glass;
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
    // the pier along the gates, then the departure hall on the landside: the pier stands west of the hall, behind it as
    // the map is seen, so it is drawn first and the taller hall hides its east wall (drawn after the hall, the pier's
    // wall and roof were painted over the hall's roof, as if one part hung over the other)
    block(c, sc, [x0, y0 + 10, x0 + 25, y1 - 10], 7, done || Math.min(f, 0.5) + pier * 0.5, '#d9d5cc', true);
    block(c, sc, [x0 + 25, y0, x1, y1], T.h, done || Math.min(f, 0.5) + hall * 0.5, '#e6e2d8', true);
    if (done) awnings(c, 'intl', T.box);
    if ((done || hall >= 1) && sc.dark > 0.3) sc.lights.push({ x: x1 + 2, y: (y0 + y1) / 2, z: T.h + 2, col: '255,255,255', r: 8 });
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
    // with the roofs off the finished tower's cab is cut away (render/interiors.js), its mast at the back corner
    if (sc.cut && sc.items.tower2) {
      const m = b * 0.85;
      Iso.box(c, T.x - b * 0.9, T.y - b * 0.9, T.x + b * 0.9, T.y + b * 0.9, h - 0.6, h, '#e6e2da');
      Iso.box(c, T.x - m - 0.4, T.y + m - 0.4, T.x - m + 0.4, T.y + m + 0.4, h, T.h * 1.08, '#9a9a9a');
      Interiors.cab(c, sc, 'tower2', T.x, T.y, m, h, false);
      if (sc.dark > 0.3) sc.lights.push({ x: T.x, y: T.y, z: h + 2, col: '255,231,168', r: 7 });
      if (sc.dark > 0.2) sc.lights.push({ x: T.x - m, y: T.y + m, z: T.h * 1.08, col: '255,60,50', r: 4, blink: 1.5 });
      return;
    }
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

  // the buildings drawn this frame, for a tap (render/map.js hit): { key, box, h } with the key of data/layout.js
  let sites = [];
  const CUT_H = 4;   // m: what still stands of a building with its roof off (render/interiors.js)

  // every standing building, as objects for render/map.js to sort
  function objects(sc, list) {
    const add = (x, y, fn) => list.push({ d: depthOf(x, y), draw: fn });
    sites = [];
    // a building: as it stands (fn), or with its roof off once it is finished and the roofs are off (render/interiors.js)
    const site = (key, box, h, q, fn, wall) => {
      const cut = sc.cut && q >= 1 && Interiors.has(key);
      sites.push({ key, box, h: cut ? CUT_H : h });
      if (fn || cut) add(box[2], box[1], cut ? (c) => Interiors.draw(c, sc, key, box, h, wall) : fn);
    };
    const T = LAYOUT.terminal1, t1 = sc.p('terminal1', 'hall');
    // torn down in 2017 (sim/airport.js razeFirstTerminal): nothing drawn, its plot grassed over with the fence across it
    if (S.airport.t1Gone) {
      // (no building, no card)
    } else if (t1 > 0 || sc.items.terminal) {
      if (sc.cut && t1 >= 1) {
        site('terminal1', T.box, T.h, 1, null, '#eceae4');
        if (sc.p('terminal1', 'waiting') >= 1) site('waiting', T.waiting, 6, 1, null, '#e3dfd6');
      } else {
        site('terminal1', T.box, T.h, 0, (c) => terminal(c, sc));
        if (sc.p('terminal1', 'waiting') > 0) sites.push({ key: 'waiting', box: T.waiting, h: 6 });
      }
    }
    const T1 = LAYOUT.tower1;
    if (sc.p('tower1', 'found') > 0 || sc.items.tower) {
      sites.push({ key: 'tower1', box: [T1.x - T1.base / 2, T1.y - T1.base / 2, T1.x + T1.base / 2, T1.y + T1.base / 2], h: T1.h });
      add(T1.x + 5, T1.y - 5, (c) => tower(c, sc));
    }
    // the fire station (built in 1-4 with the first terminal): its walls going up, then the station with its red doors
    const FS = LAYOUT.fireStation, qFS = sc.items.fireStation ? 1 : sc.p('fireStation', 'station');
    if (qFS >= 1) site('fireStation', FS.box, FS.h, 1, (c) => fireStation(c, sc), '#e8e3d8');
    else if (qFS > 0) site('fireStation', FS.box, FS.h, qFS, (c) => block(c, sc, FS.box, FS.h, qFS, '#e8e3d8'));
    // session 3: the international terminal — its hall on the landside and its pier along the gates
    const I = LAYOUT.intlTerminal.box, fI = sc.p('intlTerminal', 'frame');
    const qI = sc.items.intlTerminal ? 1 : fI > 0 ? Math.min(fI, 0.5) + sc.p('intlTerminal', 'hall') * 0.5 : 0;
    if (qI > 0) {
      const hallBox = [I[0] + 25, I[1], I[2], I[3]], pierBox = [I[0], I[1] + 10, I[0] + 25, I[3] - 10];
      if (sc.cut && qI >= 1) {
        site('intlTerminal', hallBox, LAYOUT.intlTerminal.h, 1, null, '#e6e2d8');
        site('intlPier', pierBox, 7, 1, null, '#d9d5cc');
      } else {
        sites.push({ key: 'intlTerminal', box: hallBox, h: LAYOUT.intlTerminal.h }, { key: 'intlPier', box: pierBox, h: 7 });
        add(I[2], I[1], (c) => intlTerminal(c, sc));
      }
    }
    // the buildings drawn as blocks: their key, the project and stage that build them (or none), their wall, windows
    const blocks = [['domTerminal', 'domTerminal', 'hall', '#ece6da', true], ['bagHall', 'bagHall', 'hall', '#c9c4b8', false],
      ['terminal2', 'terminal2', 'hall', '#e8ecef', true], ['terminal3', 'terminal3', 'hall', '#e6e9ea', true], ['sorterHall', 'sorterHall', 'hall', '#c9c4b8', false],
      ['skyCity', 'skyCity', 'hall', '#e9e4d6', true], ['hotel', 'skyCity', 'hotel', '#d9dde2', true], ['hotelExt', null, null, '#d2d7dd', true],
      ['offices', null, null, '#dfe3e6', true], ['cargoCity', 'cargoCity', 'halls', '#c9c4b8', false], ['aquifer', 'aquifer', 'plant', '#a9b39a', false],
      ['cyberCentre', null, null, '#3d4a57', true], ['computerRoom', 'computerRoom', 'room', '#d5d8dc', true],
      ['generator', null, null, '#7d8a6a', false]];
    for (const [k, pid, sid, wall, glass] of blocks) {
      const g = LAYOUT[k], q = sc.items[k] ? 1 : pid ? sc.p(pid, sid) : 0;
      if (q <= 0) continue;
      // a mothballed terminal keeps its roof: nobody inside
      const off = k === 'domTerminal' ? Terminal.mothballed('dom') : k === 'terminal2' ? Terminal.mothballed('t2') : k === 'terminal3' ? Terminal.mothballed('t3') : false;
      // a terminal's own shops: their awnings on its landside wall
      const term = k === 'domTerminal' ? 'dom' : k === 'terminal2' ? 't2' : k === 'terminal3' ? 't3' : null;
      site(k, g.box, g.h, off ? 0 : q, (c) => { block(c, sc, g.box, g.h, q, wall, glass, off); if (term && q >= 1) awnings(c, term, g.box); }, wall);
    }
    if (sc.items.offices > 1) { const g = LAYOUT.offices.box, b2 = [g[0], g[3] + 10, g[2], g[3] + 60]; site('offices2', b2, 16, 1, (c) => block(c, sc, b2, 16, 1, '#dfe3e6', true), '#dfe3e6'); }
    // session 5: the new tower, Pier F (its A380 gate at the north end, the jet bridges)
    const T2w = LAYOUT.tower2;
    if (sc.items.tower2 || sc.p('tower2', 'systems') > 0) {
      sites.push({ key: 'tower2', box: [T2w.x - T2w.base / 2, T2w.y - T2w.base / 2, T2w.x + T2w.base / 2, T2w.y + T2w.base / 2], h: T2w.h });
      add(T2w.x + 6, T2w.y - 6, (c) => tower2(c, sc));
    }
    const PF = LAYOUT.pierF.box, qF = sc.items.pierF ? 1 : sc.p('pierF', 'gates');
    if (qF > 0) {
      const main = [PF[0], PF[1], PF[2], PF[3] - 90], end = [PF[0], PF[3] - 90, PF[2], PF[3]], qA = sc.items.codeF ? 1 : sc.p('gateF', 'stand');
      if (sc.cut && qF >= 1) {
        site('pierF', main, LAYOUT.pierF.h, 1, null, '#e3e6e8');
        if (qA > 0) site('pierF', end, LAYOUT.pierF.h + 2, qA, (c) => block(c, sc, end, LAYOUT.pierF.h + 2, qA, '#e3e6e8', true), '#e3e6e8');
        if (sc.items.jetBridges) add(PF[0], PF[1], (c) => { for (const y of [1690, 1755, 1820, 1885].concat(sc.items.codeF ? [1950, 1935] : [])) Iso.box(c, PF[0] - 22, y - 2, PF[0], y + 2, 4, 6.5, '#cfd2d4'); });
      } else {
        sites.push({ key: 'pierF', box: main, h: LAYOUT.pierF.h });
        if (qA > 0) sites.push({ key: 'pierF', box: end, h: LAYOUT.pierF.h + 2 });
        add(PF[2], PF[1], (c) => pierF(c, sc));
      }
    }
    // session 6: the hydrogen depot's tanks, the night train's platform, the player's pier
    if (sc.items.h2depot) {
      const g = LAYOUT.h2depot.box, n = LAYOUT.h2depot.tanks, w = (g[2] - g[0]) / n;
      sites.push({ key: 'h2depot', box: g, h: 9.6 });
      for (let i = 0; i < n; i++) { const x0 = g[0] + i * w + 2, x1 = x0 + w - 4; add(x1, g[1], (c) => { Iso.box(c, x0, g[1], x1, g[3], 0, 9, '#eef2f5', '#d4dde4'); Iso.box(c, x0 + 3, g[1] + 3, x1 - 3, g[3] - 3, 9, 9.6, '#4aa3df'); }); }
    }
    if (sc.items.nightTrain) { const g = LAYOUT.nightTrain.box; site('nightTrain', g, LAYOUT.nightTrain.h, 1, (c) => Iso.box(c, g[0], g[1], g[2], g[3], 0, LAYOUT.nightTrain.h, '#c9c4b8', '#5b3a6e')); }
    const PG = LAYOUT.pier2040, qG = sc.items.pier2040 ? 1 : sc.p('pier2040', 'hall');
    if (qG > 0) {
      const des = S.airport.pierDesign || 'finger', box = des === 'satellite' ? PG.sat : PG.box;
      site('pier2040', box, PG.h, qG, (c) => {
        block(c, sc, box, PG.h, qG, '#e6e9ec', true);
        // the green pier's solar roof
        if (des === 'green' && qG >= 1) Iso.box(c, box[0] + 2, box[1] + 4, box[2] - 2, box[3] - 4, PG.h, PG.h + 0.4, '#24456b', '#2f5a8a');
      }, '#e6e9ec');
      if (sc.items.pierArm || sc.p('pier2040', 'arm') > 0) {
        const a = PG.arm, qa = sc.items.pierArm ? 1 : sc.p('pier2040', 'arm');
        site('pierArm', a, PG.h - 2, qa, (c) => block(c, sc, a, PG.h - 2, qa, '#e6e9ec', true), '#e6e9ec');
      }
    }
    // the car parks lie flat (drawn by `flat`): only their place, for a tap
    for (const k of ['parkingSmall', 'parkingBig']) if (sc.items[k]) sites.push({ key: k, box: LAYOUT[k].box, h: 0.5 });
    // (the crash tenders stand at the fire station's bays: drawn with it, fireStation, or inside it with the roofs off)
    // the fuel yard's shelter over its back row: a flat roof on posts, open to the south
    if (fuelYardOn()) {
      const Y = LAYOUT.fuelYard, b = Y.box, y0 = Math.max(...Y.rows) - 7, x0 = b[0] + 1, x1 = b[2] - 1;
      add(x1, y0, (c) => {
        for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / 5) Iso.box(c, x - 0.25, y0, x + 0.25, y0 + 0.5, 0, 5, '#6b7177');
        Iso.box(c, x0 - 0.5, y0 - 0.5, x1 + 0.5, b[3], 5, 5.5, '#c8322a', sc.season === 'winter' ? '#f4f7fa' : '#8a9096');
      });
    }
    // the airport coaches at the kerb
    if (sc.items.busStop) for (let i = 0; i < 2; i++) { const x = LAYOUT.busStop.x, y = LAYOUT.busStop.y + i * 18; add(x, y, (c) => Vehicles.bus(c, x, y, 0)); }
    // the instrument landing system's localizer beyond the 19 end
    if (sc.items.ils || sc.p('ils1', 'antennas') >= 1) {
      const p0 = Ground.rwPoint(1 + 300 / Ground.LEN, 0);
      add(p0[0], p0[1], (c) => { for (let i = -3; i <= 3; i++) { const q = Ground.rwPoint(1 + 300 / Ground.LEN, i * 6); Iso.obox(c, q[0], q[1], 1, 1, 0, 3, 0, '#c9c9c9'); } });
    }
    if (sc.siteWork) add(LAYOUT.siteOffice.x + 40, LAYOUT.siteOffice.y, (c) => siteOffice(c, sc));
    // cranes at the stages being built: x, y, the height, and the y they sort at — a crane beside a building stands in
    // front of its east wall and its jib swings high over its roof, so it is drawn after the building (sorted at the
    // building's south edge; sorted at its own foot it was drawn first and the walls hid all but the foot of its mast)
    for (const id of Object.keys(S.airport.projects)) {
      const p = S.airport.projects[id];
      if (!Object.values(p.stages).some((s) => s.on && !s.done)) continue;
      const pl = PROJECTS[id] && PROJECTS[id].plot;
      const pos = id === 'tower1' ? [LAYOUT.tower1.x + 18, LAYOUT.tower1.y + 6, 42] : id === 'terminal1' ? [T.box[2] + 12, T.box[3] - 20, 28, T.box[1]] :
        pl && ['fireStation', 'intlTerminal', 'domTerminal', 'bagHall', 'computerRoom', 'terminal2', 'terminal3', 'sorterHall', 'schengen', 'pierF', 'skyCity', 'cargoCity', 'gateF', 'tower2', 't4t5', 'pier2040'].indexOf(id) >= 0 ? [pl.x + pl.w + 10, pl.y + pl.h / 2, 34, pl.y] :
        id === 'runway3' ? [LAYOUT.runway3.from[0] + 120, LAYOUT.runway3.from[1] + 1200, 30] : id === 'bridges' ? [LAYOUT.bridges[0][0], LAYOUT.bridges[0][1] + 40, 30] :
        id === 'arlandaExpress' ? [LAYOUT.rail.south[0] + 30, LAYOUT.rail.south[1], 30] : null;
      if (pos) add(pos[0], pos[3] !== undefined ? Math.min(pos[1], pos[3]) : pos[1], (c) => crane(c, pos[0], pos[1], pos[2], sc.anim));
    }
    // floodlight masts round the apron
    if (sc.apron && sc.dark > 0.25) {
      const A = LAYOUT.apron1;
      for (const [x, y] of [[A.x0 + 20, A.y1 - 10], [A.x0 + 20, A.y0 + 10], [A.x1 - 120, A.y0 + 5], [A.x1 - 120, A.y1 - 5]]) sc.lights.push({ x, y, z: 18, col: '255,170,80', r: 70, flood: true });
    }
  }

  // a building's outline on the screen as drawn: its box's six outer corners (the near walls and the roof)
  function outline(s) {
    const [x0, y0, x1, y1] = s.box, h = s.h;
    return [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h], [x0, y0, h]].map((p) => Cam.toScreen(p[0], p[1], p[2]));
  }
  // the building under a screen point, the nearest of those whose outline holds it: { key, box, h } or null
  function hitSite(sx, sy) {
    let best = null, bd = -Infinity;
    for (const s of sites) {
      if (!pointInPoly(sx, sy, outline(s))) continue;
      const d = depthOf(s.box[2], s.box[1]);
      if (d > bd) { bd = d; best = s; }
    }
    return best;
  }
  // a yellow line round every part of the building `key` (the one whose card is open), on the screen
  function ring(c, key, partOf) {
    Iso.screen(c);
    c.strokeStyle = '#ffd54f'; c.lineWidth = 2; c.lineJoin = 'round';
    for (const s of sites) {
      if (partOf(s.key) !== key) continue;
      const o = outline(s);
      c.beginPath(); o.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke();
    }
  }

  return { flat, objects, fireBays, standPos, standBox, standIndex, standEntry, isRemote, remoteWay, fuelYardOn, fuelSpot, fuelWayOut, ploughSpot, APRONS, hitSite, ring };
})();
