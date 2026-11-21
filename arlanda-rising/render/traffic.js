'use strict';

// Arlanda Rising — everything that moves on the map, worked out from the sim's times (the sim only knows "landed at
// 09:12, at the stand at 09:17"; this file puts the aircraft on the approach, the flare, the rollout, the taxiway,
// the stand, the pushback, the take-off roll and the climb in between). Also the turnaround's vehicles and people
// at each stand (stairs, the passengers walking, catering and bags, the fuel truck from its depot, the tug), the
// plough convoys in echelon on the runways, the vehicles waiting at their depots, and over it all the little Gantt
// bar of each turnaround. Remembers where each aircraft, fuel truck and plough was drawn, for a tap (render/map.js
// `hit`): a truck or a plough keeps its number (S.ops.trucks' index, sim/fleet.js), for its card.

const Traffic = (() => {
  const rp = (s, t) => Ground.rwPoint(s, t);
  const L = Ground.LEN;
  const EXIT = LAYOUT.taxi.apronLink.s;
  const APRON_IN = LAYOUT.taxi.apronLink.to;
  let drawn = [];   // { f, x, y, z } this frame
  let vdrawn = [];  // { kind: 'fuel' | 'plough', i, x, y } this frame

  const ease = (u) => u * u * (3 - 2 * u);
  // runway 2 (08/26): its ends, length and the way from it to the aprons (session 3)
  const R2 = LAYOUT.runway2, L2 = Math.hypot(R2.to[0] - R2.from[0], R2.to[1] - R2.from[1]);
  const isR2 = (dir) => dir === '08' || dir === '26';
  const H2 = Math.atan2(R2.to[0] - R2.from[0], R2.to[1] - R2.from[1]) * 180 / Math.PI;
  // session 5: runway 3 (01R/19L), its exit and the taxiway over the bridges
  const R3 = LAYOUT.runway3, L3 = Math.hypot(R3.to[0] - R3.from[0], R3.to[1] - R3.from[1]);
  const isR3 = (dir) => dir === '01R' || dir === '19L';
  const H3 = Math.atan2(R3.to[0] - R3.from[0], R3.to[1] - R3.from[1]) * 180 / Math.PI;
  const runwayHdg = (dir) => (dir === '01' ? 10.4 : dir === '19' ? 190.4 : dir === '08' ? H2 : dir === '26' ? H2 + 180 : dir === '01R' ? H3 : H3 + 180);
  // from the runway's exit to the apron's entry
  function exitPath(dir) {
    if (isR2(dir)) return [rwFrom(dir, R2.exit)].concat(LAYOUT.taxi2.slice().reverse());
    if (isR3(dir)) return [rwFrom(dir, dir === '01R' ? R3.exit * L3 : (1 - R3.exit) * L3)].concat(LAYOUT.taxi3);
    return [rp(EXIT, 0), rp(EXIT, LAYOUT.taxi.offset), APRON_IN];
  }
  function along(pts, u) { return alongPoly(pts, polyLength(pts) * clamp(u, 0, 1)); }

  // the stand's centre for an aircraft of length len (west of the stop bar, or east of it at a stand facing west), and
  // the way in from the runway exit
  function standCentre(i, len) { const p = AirportArt.standPos(i); return [p.x - p.s * (4 + len / 2), p.y]; }
  // the lane a stand is reached by: its x (north–south along the aprons), the points from that lane into the stand and
  // from the pushed-back aircraft out to it. A stand facing east is entered from its entry point straight west of it; one
  // facing west (the satellite's east side) from the lane west of the satellite, along its south end (`st.lane`) and up
  // the lane east of it. A remote stand off the first apron is reached both ways along its paved way to the apron
  // (AirportArt.remoteWay) — unless the aircraft comes from or goes to `towardY` beyond the stand, away from the apron
  // (runway 3's taxiway from the south: by then the aprons south of the first are paved)
  function standLane(i, len, towardY) {
    const e = AirportArt.standEntry(i), c = standCentre(i, len), p = AirportArt.standPos(i), st = S.airport.stands[i];
    const push = [c[0] - p.s * 30, c[1]];
    if (p.s > 0 && AirportArt.isRemote(i)) {
      const way = AirportArt.remoteWay(i).slice(1), end = way[way.length - 1];
      if (towardY === undefined || (towardY - e[1]) * (end[1] - e[1]) >= 0) return { x: end[0], into: way.slice().reverse().concat([c]), out: [push].concat(way) };
    }
    if (p.s > 0) return { x: e[0], into: [[e[0], c[1]], c], out: [push, [e[0], c[1]]] };
    const [lx, ly] = st.lane;
    return { x: lx, into: [[lx, ly], [e[0], ly], [e[0], c[1]], c], out: [push, [e[0], c[1]], [e[0], ly], [lx, ly]] };
  }
  function wayIn(i, len, dir) {
    const ex = exitPath(dir), last = ex[ex.length - 1], l = standLane(i, len, last[1]);
    return ex.concat([[l.x, last[1]]]).concat(l.into);
  }
  function wayOut(i, len, dir) {
    const l = standLane(i, len, isR3(dir) ? LAYOUT.taxi3[LAYOUT.taxi3.length - 1][1] : undefined), y = l.out[l.out.length - 1][1];
    if (isR2(dir)) {
      // west to runway 2's taxiway along the aprons' west edge, then up it (data/layout.js taxi2)
      const tw = LAYOUT.taxi2;
      return l.out.concat([[l.x, y], [tw[1][0], y]]).concat(tw.slice(2)).concat(dir === '26' ? [R2.to] : []);
    }
    if (isR3(dir)) {
      const tw = LAYOUT.taxi3.slice().reverse();
      return l.out.concat([[l.x, tw[0][1]]]).concat(tw).concat([dir === '01R' ? R3.from : R3.to]);
    }
    // runway 1: along the departures' lane to the apron's north end and out by their own link, never meeting the
    // arrivals coming in by theirs
    // (kept on the first apron for a remote stand west of it)
    const end = dir === '01' ? 0 : 1, O = LAYOUT.taxi.apronOut, ox = Math.max(l.x - LAYOUT.taxi.outLane, LAYOUT.apron1.x0 + 6);
    return l.out.concat([[ox, y], [ox, O.to[1]], O.to, rp(O.s, LAYOUT.taxi.offset), rp(end, LAYOUT.taxi.offset), rp(end, 70)]);
  }
  // the arrivals' runway and its direction now (session 5: with runway 3 the landings keep to runway 1)
  function dirNow() { const rw = S.ops ? Runways.forArr() : null; return rw ? Runways.direction(rw) : '19'; }
  // the runway point at a distance (m) from the threshold of a direction, before it (−) or after it (+)
  function rwFrom(dir, d) {
    if (isR2(dir)) {
      const a = dir === '08' ? R2.from : R2.to, b = dir === '08' ? R2.to : R2.from;
      return [a[0] + (b[0] - a[0]) / L2 * d, a[1] + (b[1] - a[1]) / L2 * d];
    }
    if (isR3(dir)) {
      const a = dir === '01R' ? R3.from : R3.to, b = dir === '01R' ? R3.to : R3.from;
      return [a[0] + (b[0] - a[0]) / L3 * d, a[1] + (b[1] - a[1]) / L3 * d];
    }
    return dir === '01' ? rp(d / L, 0) : rp(1 - d / L, 0);
  }

  // where a flight is now: { x, y, z, hdg, moving, landing } or null when it is not on the map
  function pos(f, t) {
    const A = AIRCRAFT[f.type], len = A.length;
    const si = f.stand ? AirportArt.standIndex(f.stand) : -1;
    if (f.st === 'sched' || f.st === 'inbound' || f.st === 'approach') {
      if (f.eta === null || t < f.eta - 1.6) return null;
      const dir = dirNow();
      // on the final (and over the threshold for the rest of the step the sim lands it in)
      if (t <= f.eta + OPS_STEP_MIN) {
        const d = -(1200 + Math.max(0, f.eta - t) * 4000);
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
      const td = rwFrom(dir, 300), ex = exitPath(dir)[0];
      if (tt < 1.2) {
        const u = 1 - Math.pow(1 - (tt - 0.3) / 0.9, 2);
        return { x: lerp(td[0], ex[0], u), y: lerp(td[1], ex[1], u), z: 0, hdg: h, moving: true };
      }
      if (si < 0 || f.st === 'waitStand') {
        const p = along(exitPath(dir), f.st === 'waitStand' ? 1 : clamp((tt - 1.2) / 2, 0, 1));
        return { x: p.x, y: p.y, z: 0, hdg: p.hdg, moving: true };
      }
      const dur = Math.max(0.5, f.at - f.landed - 1.2);
      const p = along(wayIn(si, len, dir), (tt - 1.2) / dur);
      return { x: p.x, y: p.y, z: 0, hdg: p.hdg, moving: true };
    }
    if ((f.st === 'turn' || f.st === 'parked') && si >= 0) {
      const c = standCentre(si, len);
      return { x: c[0], y: c[1], z: 0, hdg: AirportArt.standPos(si).hdg, moving: false, atStand: true };
    }
    if (f.st === 'taxiOut') {
      const i = si >= 0 ? si : f.lastStand || 0, dir = f.tdir || dirNow(), c = standCentre(i, len), tt = t - f.offBlock;
      const sp = AirportArt.standPos(i);
      if (tt < 0.8) return { x: c[0] - sp.s * 30 * ease(tt / 0.8), y: c[1], z: 0, hdg: sp.hdg, moving: true, push: true };
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

  function turnaroundKit(c, sc, f, p, t) {
    const A = AIRCRAFT[f.type], len = A.length, fw = Math.max(1.2, len * (AIRCRAFT_SHAPE[f.type] || {}).fus || 2);
    const tr = f.tr;
    if (!tr) return;
    // offsets from the aircraft's centre are given for one facing east and turned with it (k −1: nose west)
    const k = p.hdg === 270 ? -1 : 1, at = (dx, dy) => [p.x + k * dx, p.y + k * dy], hd = (h) => (k > 0 ? h : (h + 180) % 360);
    const door = at(len * 0.3, fw + 3);
    const term = [LAYOUT.terminal1.box[0] - 2, clamp(p.y, LAYOUT.terminal1.box[1] + 5, LAYOUT.terminal1.box[3] - 5)];
    const people = Cam.zoom > 1.3;
    // the stairs while anyone gets off or on
    if (f.inBlock !== null || f.st === 'parked' || tr.board !== null) Vehicles.stairs(c, door[0], door[1], hd(180));
    if (people && f.inBlock !== null && t < tr.off && f.paxArr) walkers(c, door, term, (t - f.inBlock) / Math.max(0.5, tr.off - f.inBlock), 7, f.id + 'off');
    if (people && tr.board !== null && tr.ready === null) walkers(c, term, door, (t - tr.board) / Math.max(1, f.booked * BOARD_PER_PAX), 7, f.id + 'on');
    // catering and bags while the services run
    if (t >= tr.off && t < tr.svc) {
      Vehicles.catering(c, ...at(-len * 0.28, -fw - 3.5), hd(90));
      Vehicles.bagTrain(c, ...at(-len * 0.05, -fw - 7), hd(90), 2);
      if (people) { person(c, ...at(-len * 0.1, -fw - 4.5), PAL.hiVisOrange); person(c, ...at(-len * 0.32, -fw - 6), PAL.hiVis); }
    }
    // the fuel truck: from its depot, at the wing, and back
    const si = AirportArt.standIndex(f.stand);
    if (tr.fuelFrom !== undefined && tr.fuelEnd !== null && si >= 0) {
      const out = AirportArt.fuelWayOut(tr.truck !== undefined ? tr.truck : 0), depot = out[out.length - 1], wingPt = at(-2, -A.span * 0.32);
      const half = FUEL_DRIVE / 2, back = tr.fuelEnd + half;
      // out of its bay and along the yard's lane onto the jet apron (AirportArt.fuelWayOut; before the yard straight from
      // its place), then to the lane behind the stand (behind the tail of the longest aircraft), along it to the wing's
      // side and up to the wing parallel to the fuselage, never under it; a stand on the first apron or south of it is
      // reached along the first apron's north edge, a stand facing west by the satellite's lane; and back the same way
      const sp = AirportArt.standPos(si), tx = AirportArt.standEntry(si)[0] - 3 * sp.s, st = S.airport.stands[si];
      let way;
      if (sp.s < 0 && st.lane) way = out.concat([[st.lane[0], depot[1]], st.lane, [tx, st.lane[1]], [tx, wingPt[1]], wingPt]);
      else {
        const yl = wingPt[1] < Math.min(depot[1], LAYOUT.apron1.y1) ? Math.min(depot[1], LAYOUT.apron1.y1 - 8) : depot[1];
        way = out.concat([[depot[0], yl], [tx, yl], [tx, wingPt[1]], wingPt]);
      }
      let q = null;
      if (t < tr.fuelFrom + half) q = { u: (t - tr.fuelFrom) / half, way };
      else if (t < tr.fuelEnd) q = { u: 1, way };
      else if (t < back) q = { u: (t - tr.fuelEnd) / half, way: way.slice().reverse() };
      if (q) {
        const v = along(q.way, q.u);
        Vehicles.fuelTruck(c, sc, v.x, v.y, q.u >= 1 && q.way === way ? hd(90) : v.hdg, true);
        if (tr.truck !== undefined) vdrawn.push({ kind: 'fuel', i: tr.truck, x: v.x, y: v.y });
        if (people && q.u >= 1) person(c, wingPt[0] + 4 * k, wingPt[1] + 2 * k, PAL.hiVis);
      }
    }
    // session 5: a de-icing truck at the wing, its boom up and the warm glycol steaming
    if (tr.deice === 'going') {
      const [dx, dy] = at(-len * 0.1, A.span * 0.3);
      Vehicles.deicer(c, sc, dx, dy, hd(90), 3 + A.span * 0.12);
      if (sc.dark < 0.5) sc.lights.push({ x: dx, y: dy - 4, z: 5, col: '240,245,255', r: 6 });
    }
    // a hand by the nose, and the tug at pushback
    if (people && f.st !== 'taxiOut') person(c, ...at(len / 2 + 3, -3), PAL.hiVis);
    if (tr.ready !== null && f.st !== 'taxiOut') Vehicles.tug(c, ...at(len / 2 + 5, 0), hd(270));
  }

  // the i-th plough of a convoy in echelon on a runway, q of the way from its first end: [x, y, heading]
  function convoyAt(rw, q, i) {
    const s = q - i * 28 / (rw.id === 'r1' ? L : rw.id === 'r2' ? L2 : L3), off = -14 + i * 9;
    if (rw.id === 'r1') return rp(clamp(s, 0, 1), off).concat([10.4]);
    const R = rw.id === 'r2' ? R2 : R3, dx = R.to[0] - R.from[0], dy = R.to[1] - R.from[1], len = Math.hypot(dx, dy), u = clamp(s, 0, 1);
    return [R.from[0] + dx * u + dy / len * off, R.from[1] + dy * u - dx / len * off, rw.id === 'r2' ? H2 : H3];
  }

  // ---------- everything that moves, as objects to sort ----------
  function objects(sc, list) {
    drawn = []; vdrawn = [];
    const t = sc.t, year = sc.year;
    const truck = (i, x, y) => { vdrawn.push({ kind: 'fuel', i, x, y }); list.push({ d: depthOf(x, y), draw: (c) => Vehicles.fuelTruck(c, sc, x, y, 180, false) }); };
    const plough = (i, x, y, h) => { vdrawn.push({ kind: 'plough', i, x, y }); list.push({ d: depthOf(x, y), draw: (c) => Vehicles.plough(c, sc, x, y, h) }); };
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
      // trucks waiting at the depot, each in its own place
      S.ops.trucks.forEach((b, i) => { const p = AirportArt.fuelSpot(i); if (b <= t && p) truck(i, p[0], p[1]); });
      // the ploughs the airport owns, each drawn once where sim/fleet.js says it is: in a convoy on a runway being swept
      // (up to six of each convoy in echelon), on the apron (the apron's team: the last one) or at the shed, in its rows
      const inConvoy = {};
      let k = 0;
      Fleet.places().forEach((w, i) => {
        if (!w) { const p = AirportArt.ploughSpot(k++); if (p) plough(i, p[0], p[1], 180); return; }
        if (w.id === 'apron') {
          const A = LAYOUT.apron1, lane = Math.floor(w.q * 6), u = w.q * 6 - lane;
          const x = A.x0 + (A.x1 - A.x0) * (lane + 0.5) / 6, y = lane % 2 ? A.y1 - (A.y1 - A.y0) * u : A.y0 + (A.y1 - A.y0) * u;
          plough(i, x, y, lane % 2 ? 180 : 0);
          return;
        }
        const j = inConvoy[w.id] = (inConvoy[w.id] || 0) + 1;
        if (j <= 6) { const pp = convoyAt(Airport.runway(w.id), w.q, j - 1); plough(i, pp[0], pp[1], pp[2]); }
      });
    } else if (sc.apron) {
      // planning: the vehicles at rest
      for (let i = 0; i < (sc.items.fuelTruck || 0); i++) { const p = AirportArt.fuelSpot(i); if (p) truck(i, p[0], p[1]); }
      for (let i = 0; i < (sc.items.plough || 0); i++) { const p = AirportArt.ploughSpot(i); if (p) plough(i, p[0], p[1], 180); }
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

  // the fuel truck or plough drawn nearest a screen point (within r px, more when zoomed in): { kind, i } or null
  function hitVehicle(sx, sy, r) {
    let best = null, bd = Math.max(r, 5 * Cam.zoom);
    for (const v of vdrawn) {
      const s = Cam.toScreen(v.x, v.y, 1.5), d = Math.hypot(s[0] - sx, s[1] - sy);
      if (d < bd) { bd = d; best = { kind: v.kind, i: v.i }; }
    }
    return best;
  }
  // a ring round the vehicle whose card is open, where it is drawn now
  function ring(c, sel) {
    const v = vdrawn.find((w) => w.kind === sel.kind && w.i === sel.i);
    if (!v) return;
    const s = Cam.toScreen(v.x, v.y, 1), r = Math.max(10, 6 * Cam.zoom);
    Iso.screen(c);
    c.strokeStyle = '#ffd54f'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(s[0], s[1], r, r * 0.55, 0, 0, Math.PI * 2); c.stroke();
  }

  return { objects, overlay, hit, hitVehicle, ring, pos, standCentre };
})();
