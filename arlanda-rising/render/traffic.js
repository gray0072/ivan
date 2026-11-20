'use strict';

// Arlanda Rising — everything that moves on the map, worked out from the sim's times (the sim only knows "landed at
// 09:12, at the stand at 09:17"; this file puts the aircraft on the approach, the flare, the rollout, the taxiway,
// the stand, the pushback, the take-off roll and the climb in between). Also the turnaround's vehicles and people
// at each stand (stairs, the passengers walking, catering and bags, the fuel truck from its depot, the tug), the
// plough convoy in echelon on the runway, the vehicles waiting at their depots, and over it all the little Gantt
// bar of each turnaround. Remembers where each aircraft was drawn, for a tap (render/map.js `hit`).

const Traffic = (() => {
  const rp = (s, t) => Ground.rwPoint(s, t);
  const L = Ground.LEN;
  const EXIT = LAYOUT.taxi.apronLink.s;
  const APRON_IN = LAYOUT.taxi.apronLink.to;
  let drawn = [];   // { f, x, y, z } this frame

  const ease = (u) => u * u * (3 - 2 * u);
  const runwayHdg = (dir) => (dir === '01' ? 10.4 : 190.4);
  function along(pts, u) { return alongPoly(pts, polyLength(pts) * clamp(u, 0, 1)); }

  // the stand's centre for an aircraft of length len, and the way in from the runway exit
  function standCentre(i, len) { const p = AirportArt.standPos(i); return [p.x - 4 - len / 2, p.y]; }
  function wayIn(i, len) {
    const e = AirportArt.standEntry(i), c = standCentre(i, len);
    return [rp(EXIT, 0), rp(EXIT, LAYOUT.taxi.offset), APRON_IN, [e[0], APRON_IN[1]], [e[0], c[1]], c];
  }
  function wayOut(i, len, dir) {
    const e = AirportArt.standEntry(i), c = standCentre(i, len);
    const end = dir === '01' ? 0 : 1;
    return [[c[0] - 30, c[1]], [e[0], c[1]], [e[0], APRON_IN[1]], APRON_IN, rp(EXIT, LAYOUT.taxi.offset), rp(end, LAYOUT.taxi.offset), rp(end, 70)];
  }
  function dirNow() { const rw = Runways.main(); return rw && S.ops ? Runways.direction(rw) : '19'; }
  // the runway point at a distance (m) from the threshold of a direction, before it (−) or after it (+)
  function rwFrom(dir, d) { return dir === '01' ? rp(d / L, 0) : rp(1 - d / L, 0); }

  // where a flight is now: { x, y, z, hdg, moving, landing } or null when it is not on the map
  function pos(f, t) {
    const A = AIRCRAFT[f.type], len = A.length;
    const si = f.stand ? AirportArt.standIndex(f.stand) : -1;
    if (f.st === 'sched' || f.st === 'inbound' || f.st === 'approach') {
      if (f.eta === null || t < f.eta - 1.6) return null;
      const dir = dirNow();
      if (t <= f.eta) {
        const d = -(1200 + (f.eta - t) * 4000);
        const p = rwFrom(dir, d);
        return { x: p[0], y: p[1], z: -d * 0.052, hdg: runwayHdg(dir), moving: true, landing: true };
      }
      // holding: a circle beside the final approach
      const c0 = rwFrom(dir, -4200), side = dir === '01' ? 1 : -1, a = (t - f.eta) * 1.4 + f.sta;
      const x = c0[0] + side * 1500 + Math.cos(a) * 1300, y = c0[1] + Math.sin(a) * 1300;
      return { x, y, z: 420, hdg: (Math.atan2(-Math.sin(a), Math.cos(a)) * 180 / Math.PI + 360) % 360, moving: true };
    }
    if ((f.st === 'taxiIn' || f.st === 'waitStand') && f.landed !== null) {
      const dir = f.rdir || dirNow(), tt = t - f.landed, h = runwayHdg(dir);
      if (tt < 0.3) {
        const u = tt / 0.3, p0 = rwFrom(dir, -1200), p1 = rwFrom(dir, 300);
        return { x: lerp(p0[0], p1[0], u), y: lerp(p0[1], p1[1], u), z: 62 * (1 - u) * (1 - u), hdg: h, moving: true, landing: true };
      }
      const td = rwFrom(dir, 300), ex = rp(EXIT, 0);
      if (tt < 1.2) {
        const u = 1 - Math.pow(1 - (tt - 0.3) / 0.9, 2);
        return { x: lerp(td[0], ex[0], u), y: lerp(td[1], ex[1], u), z: 0, hdg: h, moving: true };
      }
      if (si < 0 || f.st === 'waitStand') {
        const p = along([ex, rp(EXIT, LAYOUT.taxi.offset), [APRON_IN[0] - 40, APRON_IN[1]]], f.st === 'waitStand' ? 1 : clamp((tt - 1.2) / 2, 0, 1));
        return { x: p.x, y: p.y, z: 0, hdg: p.hdg, moving: true };
      }
      const dur = Math.max(0.5, f.at - f.landed - 1.2);
      const p = along(wayIn(si, len), (tt - 1.2) / dur);
      return { x: p.x, y: p.y, z: 0, hdg: p.hdg, moving: true };
    }
    if ((f.st === 'turn' || f.st === 'parked') && si >= 0) {
      const c = standCentre(si, len);
      return { x: c[0], y: c[1], z: 0, hdg: 90, moving: false, atStand: true };
    }
    if (f.st === 'taxiOut') {
      const i = si >= 0 ? si : f.lastStand || 0, dir = dirNow(), c = standCentre(i, len), tt = t - f.offBlock;
      if (tt < 0.8) return { x: c[0] - 30 * ease(tt / 0.8), y: c[1], z: 0, hdg: 90, moving: true, push: true };
      const way = wayOut(i, len, dir), dur = Math.max(0.5, f.at - f.offBlock - 0.8);
      const p = along(way, (tt - 0.8) / dur);
      return { x: p.x, y: p.y, z: 0, hdg: p.hdg, moving: true };
    }
    if (f.st === 'gone' && f.airborne !== undefined) {
      const dir = f.rdir || dirNow(), tt = t - f.airborne, h = runwayHdg(dir);
      if (tt > 2.2) return null;
      const roll = tt < 0.7 ? 1600 * Math.pow(tt / 0.7, 2) : 1600 + (tt - 0.7) * 5200;
      const p = rwFrom(dir, roll + 60);
      const z = tt < 0.7 ? 0 : Math.min(900, (tt - 0.7) * 380);
      return { x: p[0], y: p[1], z, hdg: h, moving: true, landing: z < 300, alpha: tt > 1.8 ? (2.2 - tt) / 0.4 : 1 };
    }
    if (f.st === 'diverted' && f.divertedAt !== undefined) {
      const tt = t - f.divertedAt;
      if (tt > 1.5) return null;
      const dir = dirNow(), c0 = rwFrom(dir, -4200);
      return { x: c0[0] - tt * 3000, y: c0[1] - tt * 1500, z: 420 + tt * 300, hdg: 240, moving: true, alpha: 1 - tt / 1.5 };
    }
    return null;
  }

  // ---------- people and vehicles round a turnaround ----------
  function person(c, x, y, col) {
    const a = P(x, y, 0), b = P(x, y, 1.7);
    c.strokeStyle = col; c.lineWidth = 0.55; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    c.fillStyle = '#e8c9a8'; c.beginPath(); c.arc(b[0], b[1] - 0.25, 0.32, 0, Math.PI * 2); c.fill();
  }
  function walkers(c, from, to, u, n, seed) {
    for (let i = 0; i < n; i++) {
      const k = clamp(u * 1.4 - i / n * 0.4, 0, 1);
      if (k <= 0 || k >= 1) continue;
      const off = ((hashOf(seed, i) % 100) / 100 - 0.5) * 4;
      person(c, lerp(from[0], to[0], k), lerp(from[1], to[1], k) + off, ['#2c3e66', '#7a2e2e', '#3e5a3e', '#6a5a3a', '#444'][i % 5]);
    }
  }
  function beacon(sc, x, y, z) { sc.lights.push({ x, y, z, col: '255,176,0', r: 3.5, blink: 2 }); }

  function turnaroundKit(c, sc, f, p, t) {
    const A = AIRCRAFT[f.type], len = A.length, fw = Math.max(1.2, len * (AIRCRAFT_SHAPE[f.type] || {}).fus || 2);
    const tr = f.tr;
    if (!tr) return;
    const door = [p.x + len * 0.3, p.y + fw + 2.5];
    const term = [LAYOUT.terminal1.box[0] - 2, clamp(p.y, LAYOUT.terminal1.box[1] + 5, LAYOUT.terminal1.box[3] - 5)];
    const people = Cam.zoom > 1.3;
    // the stairs while anyone gets off or on
    if (f.inBlock !== null || f.st === 'parked' || tr.board !== null) Iso.obox(c, door[0], door[1], 5, 2, 0, 2.6, 0, '#d7d2c4');
    if (people && f.inBlock !== null && t < tr.off && f.paxArr) walkers(c, door, term, (t - f.inBlock) / Math.max(0.5, tr.off - f.inBlock), 7, f.id + 'off');
    if (people && tr.board !== null && tr.ready === null) walkers(c, term, door, (t - tr.board) / Math.max(1, f.booked * BOARD_PER_PAX), 7, f.id + 'on');
    // catering and bags while the services run
    if (t >= tr.off && t < tr.svc) {
      Iso.obox(c, p.x - len * 0.28, p.y - fw - 3.5, 6.5, 2.4, 0, 3.4, 90, '#e9e6de');
      for (let i = 0; i < 3; i++) Iso.obox(c, p.x - len * 0.05 - i * 3.6, p.y - fw - 7, 3, 1.6, 0, 1.2, 90, i ? '#8a8f94' : PAL.hiVisOrange);
      if (people) { person(c, p.x - len * 0.1, p.y - fw - 4.5, PAL.hiVisOrange); person(c, p.x - len * 0.32, p.y - fw - 6, PAL.hiVis); }
    }
    // the fuel truck: from its depot, at the wing, and back
    if (tr.fuelFrom !== undefined && tr.fuelEnd !== null) {
      const depot = [LAYOUT.fuelDepot.x, LAYOUT.fuelDepot.y], wingPt = [p.x - 2, p.y - A.span * 0.32];
      const half = FUEL_DRIVE / 2, back = tr.fuelEnd + half;
      let q = null;
      if (t < tr.fuelFrom + half) q = { u: (t - tr.fuelFrom) / half, a: depot, b: wingPt };
      else if (t < tr.fuelEnd) q = { u: 1, a: depot, b: wingPt };
      else if (t < back) q = { u: (t - tr.fuelEnd) / half, a: wingPt, b: depot };
      if (q) {
        const way = [q.a, [q.a[0], (q.a[1] + q.b[1]) / 2], [q.b[0], (q.a[1] + q.b[1]) / 2], q.b];
        const v = along(way, q.u);
        fuelTruck(c, sc, v.x, v.y, q.u >= 1 ? 90 : v.hdg, true);
        if (people && q.u >= 1) person(c, wingPt[0] + 4, wingPt[1] + 2, PAL.hiVis);
      }
    }
    // a hand by the nose, and the tug at pushback
    if (people && f.st !== 'taxiOut') person(c, p.x + len / 2 + 3, p.y - 3, PAL.hiVis);
    if (tr.ready !== null && f.st !== 'taxiOut') Iso.obox(c, p.x + len / 2 + 3.5, p.y, 4.5, 2.2, 0, 1.4, 90, '#e0b020');
  }
  function fuelTruck(c, sc, x, y, hdg, lamp) {
    const h = hdg * Math.PI / 180;
    Iso.obox(c, x + Math.sin(h) * 2.8, y + Math.cos(h) * 2.8, 2.6, 2.4, 0, 2.6, hdg, '#d8dde0');
    Iso.obox(c, x - Math.sin(h) * 1.2, y - Math.cos(h) * 1.2, 5.4, 2.4, 0.6, 2.8, hdg, '#c83a2e', '#e8e8e8');
    if (lamp) beacon(sc, x, y, 3);
  }
  function plough(c, sc, x, y, hdg) {
    const h = hdg * Math.PI / 180;
    Iso.obox(c, x, y, 7, 2.6, 0, 3, hdg, PAL.hiVisOrange);
    Iso.obox(c, x + Math.sin(h) * 4.6 - Math.cos(h) * 0.6, y + Math.cos(h) * 4.6 + Math.sin(h) * 0.6, 1, 4.4, 0, 1.2, hdg - 30, '#ccc');
    beacon(sc, x, y, 3.4);
  }

  // ---------- everything that moves, as objects to sort ----------
  function objects(sc, list) {
    drawn = [];
    const t = sc.t, year = sc.year;
    if (S.ops) {
      for (const f of S.ops.flights) {
        if (f.stand) { const i = AirportArt.standIndex(f.stand); if (i >= 0) f.lastStand = i; }
        const p = pos(f, t);
        if (!p) continue;
        drawn.push({ f, x: p.x, y: p.y, z: p.z });
        const a = { type: f.type, al: f.al, x: p.x, y: p.y, hdg: p.hdg, z: p.z, moving: p.moving, landing: p.landing && sc.dark > 0.2, lights: sc.dark > 0.15, year, alpha: p.alpha };
        list.push({ d: depthOf(p.x, p.y) + (p.z > 5 ? 100000 : 0), draw: (c) => {
          if (p.atStand) turnaroundKit(c, sc, f, p, t);
          AircraftArt.draw(c, sc, a);
        } });
      }
      // trucks waiting at the depot
      const free = S.ops.trucks.filter((b) => b <= t).length;
      for (let i = 0; i < free; i++) {
        const x = LAYOUT.fuelDepot.x + i * 5, y = LAYOUT.fuelDepot.y;
        list.push({ d: depthOf(x, y), draw: (c) => fuelTruck(c, sc, x, y, 180, false) });
      }
      // the plough convoy on the runway, the apron's own plough
      const rw = Runways.main(), n = Airport.ploughs();
      if (rw && rw.plough && rw.ploughFrom !== undefined) {
        const q = clamp((t - rw.ploughFrom) / (rw.plough - rw.ploughFrom), 0, 1);
        for (let i = 0; i < Math.min(n, 6); i++) {
          const pp = rp(clamp(q - i * 28 / L, 0, 1), -14 + i * 9);
          list.push({ d: depthOf(pp[0], pp[1]), draw: (c) => plough(c, sc, pp[0], pp[1], 10.4) });
        }
      } else if (n) {
        for (let i = 0; i < Math.min(n, 6); i++) {
          const x = LAYOUT.snowDepot.x + i * 9, y = LAYOUT.snowDepot.y;
          list.push({ d: depthOf(x, y), draw: (c) => plough(c, sc, x, y, 180) });
        }
      }
      const ap = S.airport.apron;
      if (ap.plough && ap.ploughFrom !== undefined) {
        const q = clamp((t - ap.ploughFrom) / (ap.plough - ap.ploughFrom), 0, 1), A = LAYOUT.apron1;
        const lane = Math.floor(q * 6), u = q * 6 - lane;
        const x = A.x0 + (A.x1 - A.x0) * (lane + 0.5) / 6, y = lane % 2 ? A.y1 - (A.y1 - A.y0) * u : A.y0 + (A.y1 - A.y0) * u;
        list.push({ d: depthOf(x, y), draw: (c) => plough(c, sc, x, y, lane % 2 ? 180 : 0) });
      }
    } else if (sc.apron) {
      // planning: the vehicles at rest
      for (let i = 0; i < (sc.items.fuelTruck || 0); i++) { const x = LAYOUT.fuelDepot.x + i * 5, y = LAYOUT.fuelDepot.y; list.push({ d: depthOf(x, y), draw: (c) => fuelTruck(c, sc, x, y, 180, false) }); }
      for (let i = 0; i < Math.min(6, sc.items.plough || 0); i++) { const x = LAYOUT.snowDepot.x + i * 9, y = LAYOUT.snowDepot.y; list.push({ d: depthOf(x, y), draw: (c) => plough(c, sc, x, y, 180) }); }
    }
  }

  // ---------- on top: the turnaround bars, the flights' numbers ----------
  function overlay(c, sc) {
    if (!S.ops) return;
    Iso.screen(c);
    const t = sc.t;
    c.font = '600 11px "Segoe UI", Arial, sans-serif';
    c.textAlign = 'center';
    for (const d of drawn) {
      const f = d.f, s = Cam.toScreen(d.x, d.y, d.z + 14);
      if (s[0] < -60 || s[0] > Cam.W + 60 || s[1] < -40 || s[1] > Cam.H + 40) continue;
      const task = S.ops.tasks.find((k) => k.target === f.id);
      if (task || Cam.zoom > 0.6 || d.z > 5) {
        const label = f.no;
        const w = c.measureText(label).width + 10;
        c.fillStyle = task ? 'rgba(242,138,30,0.95)' : 'rgba(13,27,42,0.78)';
        roundRect(c, s[0] - w / 2, s[1] - 22, w, 16, 8); c.fill();
        c.fillStyle = '#fff'; c.fillText(label, s[0], s[1] - 10);
      }
      if (f.tr && (f.st === 'turn' || f.st === 'parked') && Cam.zoom > 0.75) gantt(c, f, s[0], s[1] - 4, t);
    }
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  // the turnaround's steps as a bar: off · services · fuel · boarding, filled as they are done
  function gantt(c, f, x, y, t) {
    const tr = f.tr, w = 64, h = 6;
    const parts = [
      ['#7fb2e5', f.inBlock === null ? 1 : clamp((t - f.inBlock) / Math.max(0.1, tr.off - f.inBlock), 0, 1)],
      ['#b0c46a', clamp((t - tr.off) / Math.max(0.1, tr.svc - tr.off), 0, 1)],
      [tr.fuel === 'asked' || tr.fuel === 'queued' ? '#f28a1e' : '#e3c34a', tr.fuel === 'done' && t >= (tr.fuelEnd || 0) ? 1 : tr.fuel === 'going' ? clamp((t - (tr.fuelFrom || t)) / Math.max(0.1, tr.fuelEnd - (tr.fuelFrom || t)), 0, 1) : 0],
      ['#c99ae6', tr.board === null ? 0 : tr.ready !== null ? 1 : clamp((t - tr.board) / Math.max(0.5, f.booked * BOARD_PER_PAX), 0, 1)]
    ];
    c.fillStyle = 'rgba(13,27,42,0.8)';
    roundRect(c, x - w / 2 - 2, y - 1, w + 4, h + 2, 3); c.fill();
    const seg = w / parts.length;
    parts.forEach((p, i) => {
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x - w / 2 + i * seg + 0.5, y, seg - 1, h);
      c.fillStyle = p[0]; c.fillRect(x - w / 2 + i * seg + 0.5, y, (seg - 1) * p[1], h);
    });
  }

  // the flight drawn nearest a screen point (within r px)
  function hit(sx, sy, r) {
    let best = null, bd = r;
    for (const d of drawn) {
      const s = Cam.toScreen(d.x, d.y, d.z + 3), dd = Math.hypot(s[0] - sx, s[1] - sy);
      const rr = Math.max(bd, AIRCRAFT[d.f.type].span * 0.4 * Cam.zoom);
      if (dd < rr && (!best || dd < bd)) { best = d.f; bd = dd; }
    }
    return best;
  }

  return { objects, overlay, hit, pos, standCentre };
})();
