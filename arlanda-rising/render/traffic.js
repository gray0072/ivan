'use strict';

// Arlanda Rising — everything that moves on the map, worked out from the sim's times (the sim only knows "landed at
// 09:12, at the stand at 09:17"; this file puts the aircraft on the approach, the flare, the rollout, the taxiway,
// the stand, the pushback, the take-off roll and the climb in between). Also the turnaround's vehicles and people
// at each stand (stairs, the passengers walking — a figure for every PAX_PER_FIGURE of them —, catering and bags, the
// fuel truck or whatever brings the fuel or the power, the tug), the plough convoys in echelon on the runways, the
// vehicles waiting at their depots, and over it all the little Gantt bar of each turnaround, drawn from
// Turnaround.steps (STEP_COL: the same colours in the flight's card, ui/cards.js). Remembers where each aircraft, fuel
// truck and plough was drawn, for a tap (render/map.js `hit`): a truck or a plough keeps its number (S.ops.trucks'
// index, sim/fleet.js), for its card.

const Traffic = (() => {
  const rp = (s, t) => Ground.rwPoint(s, t);
  const L = Ground.LEN;
  const EXIT = LAYOUT.taxi.apronLink.s;
  const APRON_IN = LAYOUT.taxi.apronLink.to;
  let drawn = [];   // { f, x, y, z } this frame
  let vdrawn = [];  // { kind: 'fuel' | 'plough', i, x, y } this frame
  // the passengers walking to and from an aircraft: a figure for every PAX_PER_FIGURE of them, at least FIGURES_MIN and
  // at most FIGURES_MAX a door (the frame rate); an aircraft of WIDE_SEATS seats or more uses a second door, behind the wing
  const PAX_PER_FIGURE = 6, FIGURES_MIN = 2, FIGURES_MAX = 40, WIDE_SEATS = 220;
  // the bar's colours: passengers off, services, fuel (or charging), boarding, de-icing; a step held up shows WAIT
  const STEP_COL = { off: '#7fb2e5', svc: '#b0c46a', fuel: '#e3c34a', board: '#c99ae6', deice: '#8fe3f2', wait: '#ff7a1f' };

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
  // how many figures walk for so many passengers
  function figures(pax) { return pax > 0 ? clamp(Math.round(pax / PAX_PER_FIGURE), FIGURES_MIN, FIGURES_MAX) : 0; }
  // n figures in a stream from one point to another, u of the way through (0 the first sets off, 1 the last is there);
  // the stream is longer the more of them there are
  function walkers(c, from, to, u, n, seed) {
    const sp = clamp(n * 0.02, 0.3, 0.75);
    for (let i = 0; i < n; i++) {
      const k = clamp(u * (1 + sp) - i / n * sp, 0, 1);
      if (k <= 0 || k >= 1) continue;
      const off = ((hashOf(seed, i) % 100) / 100 - 0.5) * 4;
      person(c, lerp(from[0], to[0], k), lerp(from[1], to[1], k) + off, ['#2c3e66', '#7a2e2e', '#3e5a3e', '#6a5a3a', '#444'][i % 5]);
    }
  }

  // what brings the fuel or the power to the wing, by the sim's times (sim/turnaround.js): the player's fuel truck
  // (tr.truck, its card) or the apron robots' cart set off at fuelFrom and reach the wing at fuelStart (FUEL_DRIVE / 2),
  // the mobile charger in CHARGE_DRIVE / 2; the oil company's truck and the hydrogen bowser are at the wing when the
  // passengers are off, so they drive in while they get off; each stays while the fuel flows (to fuelEnd) and drives
  // back as long as it came. A stand's own charger: its cable to the nose while it charges.
  function fuelKit(c, sc, f, A, t, si, at, hd, k, people) {
    const tr = f.tr, by = Turnaround.fuelBy(f), wingPt = at(-2, -A.span * 0.32);
    if (by === 'stand') {
      if (tr.fuel === 'going' && t < tr.fuelEnd) {
        const sp = AirportArt.standPos(si), a = P(sp.x - 9 * sp.s, sp.y - 16, 0.6), b = P(...at(A.length / 2 - 3, -1), 1.2);
        c.strokeStyle = '#2f9e5b'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
      return;
    }
    let from, arrive, end;
    if (tr.fuelEnd !== null && (tr.fuel === 'going' || tr.fuel === 'done')) {
      arrive = Turnaround.fuelStart(tr); end = tr.fuelEnd;
      from = tr.fuelFrom !== undefined && by !== 'h2' ? tr.fuelFrom : arrive - FUEL_DRIVE / 2;
    } else if (tr.fuel === 'wait' && (by === 'oil' || by === 'h2') && f.inBlock !== null) {
      // on its way while the passengers get off: at the wing as they are off
      arrive = tr.off; end = Infinity; from = arrive - FUEL_DRIVE / 2;
    } else return;
    const drive = arrive - from, back = end + drive;
    if (t < from || t >= back) return;
    const out = AirportArt.fuelWayOut(tr.truck !== undefined ? tr.truck : 0), depot = out[out.length - 1];
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
    let q;
    if (t < arrive) q = { u: drive > 0 ? (t - from) / drive : 1, way };
    else if (t < end) q = { u: 1, way };
    else q = { u: drive > 0 ? (t - end) / drive : 1, way: way.slice().reverse() };
    const v = along(q.way, q.u), there = q.u >= 1 && q.way === way, h = there ? hd(90) : v.hdg;
    if (by === 'robot') Vehicles.robot(c, sc, v.x, v.y, h);
    else if (by === 'mobile') Vehicles.charger(c, sc, v.x, v.y, h);
    else if (by === 'oil') Vehicles.fuelTruck(c, sc, v.x, v.y, h, true, '#2b5f8a');
    else if (by === 'h2') Vehicles.fuelTruck(c, sc, v.x, v.y, h, true, '#f0f2f4', '#9fd3ee');
    else Vehicles.fuelTruck(c, sc, v.x, v.y, h, true);
    if (tr.truck !== undefined) vdrawn.push({ kind: 'fuel', i: tr.truck, x: v.x, y: v.y });
    if (people && there && by !== 'robot') person(c, wingPt[0] + 4 * k, wingPt[1] + 2 * k, PAL.hiVis);
  }

  // the building whose west face the passengers of an aircraft at p walk to and from: the first terminal, and once it is
  // torn down (2017) the nearest terminal or pier standing
  function walkTo(p) {
    if (!S.airport.t1Gone) return LAYOUT.terminal1.box;
    const L = LAYOUT, boxes = [];
    for (const [k, item] of [['intlTerminal', 'intlTerminal'], ['domTerminal', 'domTerminal'], ['terminal2', 'terminal2'], ['terminal3', 'terminal3'], ['pierF', 'pierF']])
      if (Airport.has(item)) boxes.push(L[k].box);
    if (Airport.has('pier2040')) boxes.push(S.airport.pierDesign === 'satellite' ? L.pier2040.sat : L.pier2040.box);
    let best = L.intlTerminal.box, bd = Infinity;
    for (const b of boxes) { const d = Math.max(b[1] - p.y, 0, p.y - b[3]) + Math.abs(b[0] - p.x) * 0.1; if (d < bd) { bd = d; best = b; } }
    return best;
  }

  function turnaroundKit(c, sc, f, p, t) {
    const A = AIRCRAFT[f.type], len = A.length, fw = Math.max(1.2, len * (AIRCRAFT_SHAPE[f.type] || {}).fus || 2);
    const tr = f.tr;
    if (!tr) return;
    // offsets from the aircraft's centre are given for one facing east and turned with it (k −1: nose west)
    const k = p.hdg === 270 ? -1 : 1, at = (dx, dy) => [p.x + k * dx, p.y + k * dy], hd = (h) => (k > 0 ? h : (h + 180) % 360);
    const steps = Turnaround.steps(f, t);
    // the doors: one in front, and a second behind the wing on a wide-body (its passengers split between them)
    const doors = [at(len * 0.3, fw + 3)].concat(A.seats >= WIDE_SEATS ? [at(-len * 0.32, fw + 3)] : []);
    const tb = walkTo(p), term = [tb[0] - 2, clamp(p.y, tb[1] + 5, tb[3] - 5)];
    const people = Cam.zoom > 1.3;
    // the stairs while anyone gets off or on
    if (f.inBlock !== null || f.st === 'parked' || tr.board !== null) doors.forEach((d) => Vehicles.stairs(c, d[0], d[1], hd(180)));
    // the passengers off (as many figures as get off) and on (as many as board, at boarding's own pace: Turnaround.steps)
    if (people && f.inBlock !== null && t < tr.off && f.paxArr) {
      const n = figures(f.paxArr / doors.length), u = (t - f.inBlock) / Math.max(0.5, tr.off - f.inBlock);
      doors.forEach((d, j) => walkers(c, d, term, u, n, f.id + 'off' + j));
    }
    if (people && tr.board !== null && tr.ready === null && steps.board.timeU < 1) {
      const n = figures(f.booked / doors.length);
      doors.forEach((d, j) => walkers(c, term, d, steps.board.timeU, n, f.id + 'on' + j));
    }
    // catering while the services run; the bags with them (the airline's handlers), or, sent by the player or a team,
    // only while the carts are at the hold (tr.bags 'going', from bagsFrom to bagsEnd)
    const svcOn = t >= tr.off && t < tr.svc, bagsOn = tr.bags ? tr.bags === 'going' && t >= tr.bagsFrom && t < tr.bagsEnd : svcOn;
    if (svcOn) Vehicles.catering(c, ...at(-len * 0.28, -fw - 3.5), hd(90));
    if (bagsOn) Vehicles.bagTrain(c, ...at(-len * 0.05, -fw - 7), hd(90), 2);
    if (people && svcOn) person(c, ...at(-len * 0.32, -fw - 6), PAL.hiVis);
    if (people && bagsOn) person(c, ...at(-len * 0.1, -fw - 4.5), PAL.hiVisOrange);
    // the fuel or the power (Turnaround.fuelBy): a vehicle from its depot to the wing, there while it flows, and back
    const si = AirportArt.standIndex(f.stand);
    if (si >= 0) fuelKit(c, sc, f, A, t, si, at, hd, k, people);
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
  // the turnaround's steps as a bar (Turnaround.steps): off · services · fuel · boarding, each filled as far as it is
  // done in its colour; a vehicle on its way fills it pale as it comes (the fuel truck, the charger), then it fills
  // solid as the fuel flows; a step held up (the carts, a truck, the passengers, a task not done) glows WAIT where it
  // is not done; a small square after the bar is the de-icing (WAIT until the de-icer comes, then filled from below)
  function gantt(c, f, x, y, t) {
    const S4 = Turnaround.steps(f, t), w = 64, h = 6, seg = w / 4;
    const de = S4.deice && S4.deice.st !== 'pad' ? S4.deice : null, dw = de ? h + 3 : 0;
    const pulse = 0.55 + 0.4 * Math.abs(Math.sin(performance.now() / 320));
    const x0 = x - (w + dw) / 2;
    c.fillStyle = 'rgba(13,27,42,0.8)';
    roundRect(c, x0 - 2, y - 1, w + dw + 4, h + 2, 3); c.fill();
    const cell = (s, col, cx, cw) => {
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(cx, y, cw, h);
      if (s.st === 'wait') { c.globalAlpha = pulse; c.fillStyle = STEP_COL.wait; c.fillRect(cx, y, cw, h); c.globalAlpha = 1; }
      if (s.st === 'coming') { c.globalAlpha = 0.4; c.fillStyle = col; c.fillRect(cx, y, cw * s.drive, h); c.globalAlpha = 1; }
      c.fillStyle = col; c.fillRect(cx, y, cw * s.u, h);
    };
    ['off', 'svc', 'fuel', 'board'].forEach((key, i) => cell(S4[key], STEP_COL[key], x0 + i * seg + 0.5, seg - 1));
    if (de) {
      const cx = x0 + w + 3;
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(cx, y, h, h);
      if (de.st === 'wait') { c.globalAlpha = pulse; c.fillStyle = STEP_COL.wait; c.fillRect(cx, y, h, h); c.globalAlpha = 1; }
      c.fillStyle = STEP_COL.deice; c.fillRect(cx, y + h * (1 - de.u), h, h * de.u);
    }
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

  return { objects, overlay, hit, hitVehicle, ring, pos, standCentre, STEP_COL };
})();
