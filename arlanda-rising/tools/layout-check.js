#!/usr/bin/env node
'use strict';

// Arlanda Rising — the map's checker and its plan. Loads data/layout.js, data/masterplan.js, data/buildings.js and
// data/aircraft.js in Node (no browser) and checks that what is built on the map does not stand on something else:
//   - a building on another building, on an apron, on a stand, on a road, a railway or a taxiway;
//   - a road or the railway across an apron, a stand, a runway or a taxiway (except at the taxiway bridges; the rail
//     tunnel is under the ground and not checked);
//   - a taxiway across a building or a stand (taxiways run into the aprons: that is allowed);
//   - the ground the biggest aircraft a stand takes covers (its length behind the stop bar, its span across) on a
//     building, a road, the railway, a runway, a taxiway or another stand's aircraft — stands of the player's pier are
//     checked once for each of its designs (finger, satellite, green), never one design against another;
//   - a building on the 40 m in front of a terminal's landside face (its kerb and door), the road in ending away from
//     the first terminal's door, and taxiway 2 joining runway 2 badly (a turn sharper than a right angle, an entry not
//     square to the runway, off its centreline or away from its 08 end, shorter than its holding line's distance);
//   - the airside fence (render/fence.js, loaded too) with everything built and in five eras from 1960 to 2040 across a
//     road or the railway away from the taxiway bridges, or across a runway, a taxiway, an apron, a stand, an aircraft
//     at its stand, a car park or a building (a run ends a hand short of the wall it joins).
// Prints every clash with where it is and exits 1 when there is one. With --svg <file> it also writes the plan of the
// airport from above (north up, everything of every era at once with the fence round it, labelled, a 100 m grid) —
// docs/layout.svg is made this way; regenerate it after changing data/layout.js, render/fence.js or a stand's place.
//
// Usage: node arlanda-rising/tools/layout-check.js [--svg arlanda-rising/docs/layout.svg] [--all]
//   --all   list the allowed overlaps too (stands on their aprons, the bridges…)

const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const svgOut = args.includes('--svg') ? args[args.indexOf('--svg') + 1] : null;
const showAll = args.includes('--all');

const ctx = {};
vm.createContext(ctx);
for (const f of ['data/layout.js', 'data/aircraft.js', 'data/buildings.js', 'data/masterplan.js', 'render/fence.js'])
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8').replace(/^const (\w+) =/m, 'this.$1 ='), ctx, { filename: f });
const { LAYOUT: Lo, AIRCRAFT, BUILDINGS, PROJECTS, Fence } = ctx;

// ---------- the biggest aircraft of each stand size code (sim/stands.js codeOf) ----------
const codeOf = (span) => (span < 15 ? 'A' : span < 24 ? 'B' : span < 36 ? 'C' : span < 52 ? 'D' : span < 65 ? 'E' : 'F');
const CODES = 'ABCDEF', BIG = {};
for (const c of CODES) BIG[c] = { span: 0, length: 0 };
for (const k in AIRCRAFT) {
  const a = AIRCRAFT[k];
  for (const c of CODES.slice(CODES.indexOf(codeOf(a.span)))) { BIG[c].span = Math.max(BIG[c].span, a.span); BIG[c].length = Math.max(BIG[c].length, a.length); }
}

// ---------- runway 1 and its taxiway (render/ground.js rwPoint) ----------
const RW = Lo.runway1, L = Math.hypot(RW.to[0] - RW.from[0], RW.to[1] - RW.from[1]);
const DIR = [(RW.to[0] - RW.from[0]) / L, (RW.to[1] - RW.from[1]) / L], NRM = [DIR[1], -DIR[0]];
const rp = (s, t) => [RW.from[0] + DIR[0] * L * s + NRM[0] * t, RW.from[1] + DIR[1] * L * s + NRM[1] * t];

// ---------- the shapes: rects [x0, y0, x1, y1] or lines with a width; `kind` decides what may overlap what ----------
// kinds: bld (building), apron, stand (a stand's pad), plane (the biggest aircraft at a stand), road, rail, taxi, rwy,
// park (car park), field (solar park, yard). `design`: the player's pier's design it belongs to (only one is built).
const S = [];
const rect = (name, kind, b, o) => S.push(Object.assign({ name, kind, rect: b }, o));
const line = (name, kind, pts, w, o) => S.push(Object.assign({ name, kind, line: pts, w }, o));
const box = (k) => Lo[k].box;

for (const k of ['terminal1', 'intlTerminal', 'domTerminal', 'bagHall', 'computerRoom', 'generator',
  'terminal2', 'sorterHall', 'pierF', 'skyCity', 'hotel', 'hotelExt', 'offices', 'cargoCity', 'aquifer', 'cyberCentre', 'h2depot', 'nightTrain', 'fireStation'])
  rect(k, 'bld', box(k));
rect('terminal1 waiting room', 'bld', Lo.terminal1.waiting);
const o = box('offices'); rect('offices (2nd block)', 'bld', [o[0], o[3] + 10, o[2], o[3] + 60]);
rect('tower1', 'bld', [Lo.tower1.x - 6.5, Lo.tower1.y - 6.5, Lo.tower1.x + 6.5, Lo.tower1.y + 6.5]);
rect('tower2', 'bld', [Lo.tower2.x - 5.5, Lo.tower2.y - 5.5, Lo.tower2.x + 5.5, Lo.tower2.y + 5.5]);
const PG = Lo.pier2040;
for (const d of ['finger', 'green']) rect('pier2040 finger', 'bld', PG.box, { design: d });
rect('pier2040 satellite', 'bld', PG.sat, { design: 'satellite', onApron: true });   // an island in its apron
rect('pier2040 satellite apron', 'apron', PG.satApron, { design: 'satellite' });
rect('pier2040 arm', 'bld', PG.arm);
rect('cargo yard', 'field', Lo.cargoCity.yard);
// the vehicles' places west of the aprons: the fuel trucks' yard with its shelter (from the jet apron's year) and its
// lane onto the jet apron, the ploughs' rows
rect('fuel yard', 'bld', Lo.fuelYard.box);
line('fuel yard lane', 'way', [[Lo.fuelYard.box[2] + 1, Lo.fuelYard.aisle], Lo.fuelYard.gate], 9);
rect('ploughs', 'bld', Lo.snowDepot.box);
rect('parkingSmall', 'park', box('parkingSmall')); rect('parkingBig', 'park', box('parkingBig'));
Lo.solar.forEach((b, i) => rect('solar ' + (i + 1), 'field', b));
Lo.deicePads.forEach((b, i) => rect('de-icing pad ' + (i + 1), 'apron', b));
for (const k of ['apron1', 'apron2', 'apron3', 'apron4', 'apron5', 'apron6', 'apron7', 'cargoApron']) { const a = Lo[k]; rect(k, 'apron', [a.x0, a.y0, a.x1, a.y1]); }

// stands: [x, y] the stop bar by the nose, hdg 90 (aircraft west of it) or 270 (east of it); render/airport.js standBox
const stands = [];
const stand = (name, x, y, hdg, code, o) => stands.push(Object.assign({ name, x, y, s: hdg === 270 ? -1 : 1, code }, o));
const apron1Codes = PROJECTS.apron1.stands.map((s) => s.code);
Lo.stands.forEach((p, i) => stand('stand ' + (i + 1), p.x, p.y, 90, apron1Codes[i]));
Lo.remote.forEach((p, i) => stand('remote ' + (i + 1), p.x, p.y, 90, 'C', { remote: true }));
for (const id in PROJECTS) {
  const P = PROJECTS[id];
  for (const st of [].concat(P.stands || [], P.bigStand || [], P.stand || [])) if (st.at) stand('stand ' + st.name, st.at[0], st.at[1], 90, st.code);
}
BUILDINGS.cargoStand.spots.forEach((p, i) => stand('cargo K' + (i + 1), p[0], p[1], 90, 'E', { pad: true }));
const PP = PROJECTS.pier2040;
for (const d of ['finger', 'satellite', 'green']) {
  const spots = d === 'satellite' ? PP.spots.satellite : PP.spots.finger;
  PP.designs[d].stands.forEach((s, i) => stand(d + ' ' + s[0], spots[i][0], spots[i][1], spots[i][2], s[1], { design: d }));
}
PP.arm.forEach((s, i) => stand('arm ' + s[0], PP.spots.arm[i][0], PP.spots.arm[i][1], PP.spots.arm[i][2], s[1]));
const sBox = (p, back, front, half) => (p.s > 0 ? [p.x - back, p.y - half, p.x + front, p.y + half] : [p.x - front, p.y - half, p.x + back, p.y + half]);
for (const p of stands) {
  if (p.remote || p.pad) rect(p.name + ' pad', 'stand', sBox(p, 74, 8, 28), { design: p.design });
  const A = BIG[p.code];
  rect(p.name + ' (' + p.code + ' ' + A.length.toFixed(0) + '×' + A.span.toFixed(0) + ' m)', 'plane', sBox(p, 4 + A.length, -2, A.span / 2), { design: p.design, stand: p });
}

// lines
line('road in', 'road', Lo.road, 26);
line('landside road', 'road', Lo.landside, 26);
line('E4', 'road', Lo.e4, 30);
line('road west to Märsta', 'road', Lo.e4Exit.west, 26);
Lo.e4Exit.ramps.forEach((r, i) => line('E4 slip road ' + (i + 1), 'road', r, 16));
line('rail line', 'rail', Lo.rail.line, 12); line('rail out', 'rail', Lo.rail.out, 12);
line('taxiway 1', 'taxi', [rp(0, Lo.taxi.offset), rp(1, Lo.taxi.offset)], Lo.taxi.w);
Lo.taxi.links.forEach((s, i) => line('runway 1 link ' + (i + 1), 'taxi', [rp(s, 0), rp(s, Lo.taxi.offset)], Lo.taxi.w));
line('apron link (arrivals)', 'taxi', [rp(Lo.taxi.apronLink.s, Lo.taxi.offset), Lo.taxi.apronLink.to], Lo.taxi.w);
line('apron link (departures)', 'taxi', [rp(Lo.taxi.apronOut.s, Lo.taxi.offset), Lo.taxi.apronOut.to], Lo.taxi.w);
line('taxiway 2', 'taxi', Lo.taxi2, Lo.taxi.w); line('taxiway 3', 'taxi', Lo.taxi3, Lo.taxi.w);
line('runway 1', 'rwy', [RW.from, RW.to], RW.w); line('runway 2', 'rwy', [Lo.runway2.from, Lo.runway2.to], Lo.runway2.w);
line('runway 3', 'rwy', [Lo.runway3.from, Lo.runway3.to], Lo.runway3.w);
// a remote stand's paved way, as render/airport.js remoteWay draws it (and east onto the apron from an entry west of it)
Lo.remote.forEach((p, i) => {
  const A = Lo.apron1, x = p.x - 75, y = Math.min(Math.max(p.y, A.y0 + 12), A.y1 - 12), xa = Math.max(x, A.x0 + 12);
  line('remote ' + (i + 1) + ' way', 'way', [[x, p.y], [x, y]].concat(xa !== x ? [[xa, y]] : []), 20);
});
// the airside fence with everything built (the finger design of the player's pier), as render/fence.js works it out in
// the game: every drawn run of it is a shape that may cross nothing but a road or the railway at the taxiway bridges
const fencePads = stands.filter((p) => p.remote || p.pad).map((p) => sBox(p, 74, 8, 28));
const fenceWays = S.filter((sh) => sh.kind === 'way').map((sh) => sh.line);
const fence = Fence.build(Fence.parts((k) => k !== 'satApron', fencePads, fenceWays, 'finger'));
fence.runs.forEach((r, i) => line('fence ' + (i + 1), 'fence', r, 3));

// ---------- geometry ----------
const segs = (pts) => pts.slice(1).map((b, i) => [pts[i], b]);
function distSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
const distLine = (p, sh) => Math.min(...segs(sh.line).map(([a, b]) => distSeg(p, a, b)));
const distRect = (p, r) => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[2]), Math.max(r[1] - p[1], 0, p[1] - r[3]));
function samples(sh) {
  const out = [];
  for (const [a, b] of segs(sh.line)) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2); for (let k = 0; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
  return out;
}
// where two shapes overlap: { x0, y0, x1, y1, text } or null (1 m of slack: touching is fine)
function overlap(a, b) {
  if (a.rect && b.rect) {
    const x0 = Math.max(a.rect[0], b.rect[0]), x1 = Math.min(a.rect[2], b.rect[2]), y0 = Math.max(a.rect[1], b.rect[1]), y1 = Math.min(a.rect[3], b.rect[3]);
    return x1 - x0 > 1 && y1 - y0 > 1 ? { x0, y0, x1, y1, text: (x1 - x0).toFixed(0) + ' × ' + (y1 - y0).toFixed(0) + ' m' } : null;
  }
  if (a.rect) [a, b] = [b, a];
  // a line's round end reaching a building's face is a road ending at its door, not a clash: points within half the
  // width of an end count only when they are themselves inside the other shape
  const ends = [a.line[0], a.line[a.line.length - 1]];
  const hits = samples(a).filter((p) => {
    const d = b.rect ? distRect(p, b.rect) : distLine(p, b) - b.w / 2;
    if (d >= a.w / 2 - 1) return false;
    return d <= 0 || !ends.some((e) => Math.hypot(p[0] - e[0], p[1] - e[1]) < a.w / 2);
  });
  if (!hits.length) return null;
  const xs = hits.map((p) => p[0]), ys = hits.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), text: 'along ' + (hits.length * 2) + ' m' };
}
const nearBridge = (r) => Lo.bridges.some(([x, y]) => x > r.x0 - 40 && x < r.x1 + 40 && y > r.y0 - 40 && y < r.y1 + 40);

// what may overlap what (a sorted pair of kinds → true, or a function of the two shapes and the overlap)
const ALLOWED = {
  'apron/apron': true, 'apron/taxi': true, 'apron/way': true, 'stand/way': true, 'taxi/taxi': true, 'rwy/taxi': true, 'way/way': true,
  'taxi/way': true, 'apron/stand': true, 'stand/stand': true, 'road/road': true, 'field/field': true, 'park/park': true,
  'apron/plane': (a, b) => true, 'plane/stand': (a, b) => true, 'plane/way': true, 'plane/taxi': true,   // aircraft taxi to and past stands
  'road/taxi': (a, b, r) => nearBridge(r), 'rail/taxi': (a, b, r) => nearBridge(r),
  'fence/road': (a, b, r) => nearBridge(r), 'fence/rail': (a, b, r) => nearBridge(r), 'fence/fence': true,
  // the fence is worked out on a grid of Fence.CELL m: along a plot's edge it may stray half a cell into it
  'fence/field': (a, b, r) => Math.min(r.x1 - r.x0, r.y1 - r.y0) <= Fence.CELL / 2,
  'rwy/stand': false
};
const problems = [], allowed = [];
for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
  const a = S[i], b = S[j];
  if (a.design && b.design && a.design !== b.design) continue;
  if (a.stand && b.stand && a.stand === b.stand) continue;
  const kinds = [a.kind, b.kind].sort().join('/');
  const r = overlap(a, b);
  if (!r) continue;
  // a stand's pad and its own aircraft
  if (kinds === 'plane/stand' && (a.stand || b.stand) && (a.name.startsWith((a.stand || b.stand).name) && b.name.startsWith((a.stand || b.stand).name))) continue;
  let ok = ALLOWED[kinds];
  if (kinds === 'apron/bld' && (a.onApron || b.onApron)) ok = true;
  if (typeof ok === 'function') ok = ok(a, b, r);
  // two aircraft: never; a remote stand of 1960 under a later apron is that apron's stand by then
  if (kinds === 'plane/plane') ok = false;
  const line = (kinds + '            ').slice(0, 13) + a.name + '  ×  ' + b.name + '   ' + r.text + ' at x ' + r.x0.toFixed(0) + '..' + r.x1.toFixed(0) + ', y ' + r.y0.toFixed(0) + '..' + r.y1.toFixed(0);
  (ok ? allowed : problems).push({ line, a, b, r });
}
// a terminal's landside face (east) is its kerb and its door: no building on the ground KERB m in front of it
const KERB = 40;
const flag = (text, r) => problems.push({ line: text + ' at x ' + r.x0.toFixed(0) + '..' + r.x1.toFixed(0) + ', y ' + r.y0.toFixed(0) + '..' + r.y1.toFixed(0), r });
for (const k of ['terminal1', 'intlTerminal', 'domTerminal', 'terminal2']) {
  const b = box(k), kerb = { name: k + ' kerb', kind: 'kerb', rect: [b[2], b[1], b[2] + KERB, b[3]] };
  for (const sh of S) if (sh.kind === 'bld' && sh.name !== k) { const r = overlap(kerb, sh); if (r) flag('kerb         ' + sh.name + ' in front of ' + k + '\'s landside face   ' + r.text, r); }
}
// the road in ends at the first terminal's door: its last point at the middle of the terminal's east face, a few m out
{
  const b = box('terminal1'), e = Lo.road[Lo.road.length - 1];
  if (!(e[0] >= b[2] && e[0] <= b[2] + 8 && e[1] > b[1] + 20 && e[1] < b[3] - 20)) flag('road in      ends away from terminal1\'s door', { x0: e[0], y0: e[1], x1: e[0], y1: e[1] });
}
// taxiway 2 joins runway 2 cleanly: no turn sharper than a right angle (no kink or doubling back), its last leg square to
// the runway (within 3°), longer than the holding line's distance, and ending on the centreline near the 08 end
{
  const T = Lo.taxi2, R2 = Lo.runway2, L2 = Math.hypot(R2.to[0] - R2.from[0], R2.to[1] - R2.from[1]);
  const u = [(R2.to[0] - R2.from[0]) / L2, (R2.to[1] - R2.from[1]) / L2], dir = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  const at = (p) => ({ x0: p[0], y0: p[1], x1: p[0], y1: p[1] });
  for (let i = 1; i < T.length - 1; i++) {
    const turn = Math.abs(((dir(T[i], T[i + 1]) - dir(T[i - 1], T[i]) + 540) % 360) - 180);
    if (turn > 91) flag('taxiway 2    turns ' + turn.toFixed(0) + '° at point ' + i, at(T[i]));
  }
  const e = T[T.length - 1], q = T[T.length - 2], s = (e[0] - R2.from[0]) * u[0] + (e[1] - R2.from[1]) * u[1];
  const off = Math.abs((e[0] - R2.from[0]) * u[1] - (e[1] - R2.from[1]) * u[0]), leg = Math.hypot(e[0] - q[0], e[1] - q[1]);
  const square = Math.abs(((dir(q, e) - Math.atan2(u[1], u[0]) * 180 / Math.PI + 540) % 360) - 180);
  if (off > 2 || s < 0 || s > 60) flag('taxiway 2    ends ' + off.toFixed(0) + ' m off runway 2\'s centreline, ' + s.toFixed(0) + ' m from its 08 end', at(e));
  if (Math.abs(square - 90) > 3) flag('taxiway 2    its last leg meets runway 2 at ' + square.toFixed(0) + '°, not square', at(e));
  if (leg < R2.hold + 10) flag('taxiway 2    its last leg (' + leg.toFixed(0) + ' m) is shorter than the holding line\'s distance', at(e));
}
// the fence in the eras between (what each adds, roughly as the master plan builds it; every remote stand bought): it
// must cross no road or railway away from the bridges, no runway, taxiway or apron of its own era
const ERAS = [['1960', 'runway1 apron1 terminal1'], ['1976', 'apron2 taxi2 runway2 intlTerminal bagHall computerRoom sorterHall fireStation fuelYard'],
  ['1990', 'apron3 apron4 domTerminal terminal2'], ['2003', 'apron5 pierF runway3 taxi3 deice0 deice1 cargoCity cargoApron'],
  ['2040 satellite', 'apron6 apron7 pier2040 pierArm satApron h2depot']];
const eraKeys = [];
for (const [era, keys] of ERAS) {
  eraKeys.push(...keys.split(' '));
  const sat = era.includes('satellite'), on = (k) => eraKeys.includes(k);
  const f = Fence.build(Fence.parts(on, fencePads, fenceWays, sat ? 'satellite' : 'finger'));
  const own = S.filter((sh) => ['road', 'rail'].includes(sh.kind) || (sh.kind === 'rwy' && (sh.name === 'runway 1' || on(sh.name.replace(' ', '')))) ||
    (sh.kind === 'apron' && on(sh.name)) || (sh.kind === 'taxi' && (/^(taxiway 1|runway 1 link|apron link)/.test(sh.name) || on(sh.name.replace('taxiway ', 'taxi')))));
  f.runs.forEach((r, i) => {
    const fs = { name: era + ' fence ' + (i + 1), kind: 'fence', line: r, w: 3 };
    for (const sh of own) {
      const o = overlap(fs, sh);
      if (o && !(['road', 'rail'].includes(sh.kind) && nearBridge(o)))
        problems.push({ line: 'era fence    ' + fs.name + '  ×  ' + sh.name + '   ' + o.text + ' at x ' + o.x0.toFixed(0) + '..' + o.x1.toFixed(0) + ', y ' + o.y0.toFixed(0) + '..' + o.y1.toFixed(0), a: fs, b: sh, r: o });
    }
  });
}
if (showAll) { console.log('allowed:'); for (const p of allowed) console.log('  ' + p.line); }
for (const p of problems) console.log(p.line);
console.log(problems.length ? problems.length + ' clash(es)' : 'layout ok: ' + S.length + ' shapes, ' + stands.length + ' stands, no clash');

// ---------- the plan as SVG ----------
if (svgOut) {
  const X0 = -300, X1 = 2700, Y0 = -1300, Y1 = 3100, K = 0.5;   // the part of the map round the airport, px per m
  const W = (X1 - X0) * K, H = (Y1 - Y0) * K;
  const px = (x) => ((x - X0) * K).toFixed(1), py = (y) => ((Y1 - y) * K).toFixed(1);
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Arial, sans-serif">`);
  out.push(`<rect width="${W}" height="${H}" fill="#eef2e8"/>`);
  for (let x = Math.ceil(X0 / 100) * 100; x <= X1; x += 100) out.push(`<line x1="${px(x)}" y1="0" x2="${px(x)}" y2="${H}" stroke="${x % 500 ? '#dde3d6' : '#c3cbbb'}" stroke-width="${x % 500 ? 0.5 : 1}"/>` + (x % 500 ? '' : `<text x="${+px(x) + 2}" y="${H - 4}" font-size="10" fill="#7a8570">x ${x}</text>`));
  for (let y = Math.ceil(Y0 / 100) * 100; y <= Y1; y += 100) out.push(`<line x1="0" y1="${py(y)}" x2="${W}" y2="${py(y)}" stroke="${y % 500 ? '#dde3d6' : '#c3cbbb'}" stroke-width="${y % 500 ? 0.5 : 1}"/>` + (y % 500 ? '' : `<text x="2" y="${+py(y) - 2}" font-size="10" fill="#7a8570">y ${y}</text>`));
  const poly = (pts, w, col, extra = '') => `<polyline points="${pts.map((p) => px(p[0]) + ',' + py(p[1])).join(' ')}" fill="none" stroke="${col}" stroke-width="${(w * K).toFixed(1)}" stroke-linejoin="round" ${extra}/>`;
  const rct = (b, fill, stroke, extra = '') => `<rect x="${px(b[0])}" y="${py(b[3])}" width="${((b[2] - b[0]) * K).toFixed(1)}" height="${((b[3] - b[1]) * K).toFixed(1)}" fill="${fill}" stroke="${stroke || 'none'}" ${extra}/>`;
  const label = (x, y, t, size = 9, col = '#222') => `<text x="${px(x)}" y="${py(y)}" font-size="${size}" fill="${col}" text-anchor="middle" dominant-baseline="middle">${esc(t)}</text>`;
  for (const l of Lo.lakes) out.push(`<polygon points="${l.pts.map((p) => px(p[0]) + ',' + py(p[1])).join(' ')}" fill="#b9d3e3"/>`);
  const order = ['field', 'park', 'apron', 'stand', 'rwy', 'taxi', 'way', 'road', 'rail', 'bld', 'plane', 'fence'];
  const style = { field: ['#c9cfb0', '#9aa080'], park: ['#9aa0a6', null], apron: ['#d6d3cb', '#a8a49a'], stand: ['#d6d3cb', '#a8a49a'], bld: ['#e9a86b', '#7a4a20'], plane: ['none', '#2f6fb3'] };
  const lineCol = { rwy: '#3a3d41', taxi: '#6b6f73', way: '#c8c5bd', road: '#8a6e4c', rail: '#7a2e8e', fence: '#1f8a3a' };
  for (const kind of order) for (const sh of S) {
    if (sh.kind !== kind) continue;
    if (sh.rect) {
      const [fill, stroke] = style[kind];
      const dash = kind === 'plane' ? 'stroke-dasharray="3 2" stroke-width="0.8"' : sh.design === 'satellite' ? 'stroke-dasharray="4 3" fill-opacity="0.55"' : 'stroke-width="0.6"';
      out.push(rct(sh.rect, kind === 'bld' && sh.design === 'satellite' ? '#f2d0a8' : fill, kind === 'plane' && sh.design === 'satellite' ? '#b0559a' : stroke, dash));
    } else out.push(poly(sh.line, sh.w, lineCol[kind], kind === 'rail' ? 'stroke-opacity="0.7"' : kind === 'fence' ? 'stroke-dasharray="6 3"' : ''));
  }
  out.push(poly(Lo.rail.tunnel, 6, '#7a2e8e', 'stroke-dasharray="8 6" stroke-opacity="0.6"'));
  for (const b of Lo.bridges) out.push(rct([b[0] - 30, b[1] - 22, b[0] + 30, b[1] + 22], 'none', '#222', 'stroke-width="1"'));
  for (const p of stands) out.push(`<circle cx="${px(p.x)}" cy="${py(p.y)}" r="1.6" fill="${p.design === 'satellite' ? '#b0559a' : '#2f6fb3'}"/>`);
  // labels: buildings and aprons by name, stands by number
  const named = { terminal1: 'T1 (1960)', intlTerminal: 'intl terminal / T5', domTerminal: 'domestic / T4', terminal2: 'T2', bagHall: 'bags', pierF: 'Pier F',
    skyCity: 'Sky City', hotel: 'hotel', cargoCity: 'Cargo City', sorterHall: 'sorter', offices: 'offices', cyberCentre: 'SOC', h2depot: 'H2', nightTrain: 'night train',
    fireStation: 'fire', 'fuel yard': 'fuel', ploughs: 'ploughs', 'pier2040 finger': 'pier 2040', 'pier2040 satellite': 'sat', 'pier2040 arm': 'arm', parkingBig: 'P', parkingSmall: 'P' };
  for (const sh of S) if (sh.rect && named[sh.name] && !(sh.name === 'pier2040 finger' && sh.design === 'green')) {
    const b = sh.rect, vert = (b[3] - b[1]) > (b[2] - b[0]) * 1.6;
    out.push(vert ? `<text x="${px((b[0] + b[2]) / 2)}" y="${py((b[1] + b[3]) / 2)}" font-size="8" fill="#3a2410" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 ${px((b[0] + b[2]) / 2)} ${py((b[1] + b[3]) / 2)})">${esc(named[sh.name])}</text>` : label((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, named[sh.name], 8, '#3a2410'));
  }
  for (const k of ['apron1', 'apron2', 'apron3', 'apron4', 'apron5', 'apron6', 'apron7', 'cargoApron']) { const a = Lo[k]; out.push(label(a.x0 + 22, (a.y0 + a.y1) / 2, k, 8, '#6b665c')); }
  out.push(label(RW.to[0] - 40, RW.to[1] - 120, 'runway 1 (01L/19R)', 11)); out.push(label(Lo.runway3.to[0] + 90, Lo.runway3.to[1] - 300, 'runway 3', 11));
  out.push(label(Lo.runway2.from[0] + 300, Lo.runway2.from[1] + 120, 'runway 2 (08/26)', 11));
  for (const [x, y, t] of [[Lo.road[3][0] - 60, Lo.road[3][1], 'road in'], [Lo.taxi2[2][0] - 40, Lo.taxi2[2][1] - 300, 'taxiway 2'], [1500, 230, 'taxiway 3 (bridges)'], [1500, -500, 'Arlanda Express'], [1900, 2050, 'Arlanda Express']])
    out.push(label(x, y, t, 9, '#444'));
  for (const p of problems) out.push(rct([p.r.x0 - 4, p.r.y0 - 4, p.r.x1 + 4, p.r.y1 + 4], 'none', '#e0201c', 'stroke-width="2"'));
  out.push(`<g font-size="10" fill="#222"><rect x="6" y="6" width="330" height="106" fill="#ffffff" fill-opacity="0.85" stroke="#bbb"/>`
    + `<text x="12" y="20" font-weight="700">Arlanda Rising: the map (data/layout.js), north up</text>`
    + `<text x="12" y="34">metres from the 01L threshold; grid 100 m; every era at once</text>`
    + `<text x="12" y="48">orange: buildings · grey: aprons · brown: roads · purple: railway (dashed: tunnel)</text>`
    + `<text x="12" y="62">blue dashes: the biggest aircraft each stand takes (dot: the stop bar)</text>`
    + `<text x="12" y="76">pink: the satellite design of the player's pier (instead of the finger)</text>`
    + `<text x="12" y="90">green dashes: the airside fence with everything built (render/fence.js)</text>`
    + `<text x="12" y="104">${problems.length ? 'red: clashes found by tools/layout-check.js' : 'tools/layout-check.js: no clash'}</text></g>`);
  out.push('</svg>');
  fs.writeFileSync(path.resolve(svgOut), out.join('\n') + '\n');
  console.log('plan written to ' + svgOut);
}
process.exit(problems.length ? 1 : 0);
