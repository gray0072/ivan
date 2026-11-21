'use strict';

// Arlanda Rising — the ground vehicles, each built of a few simple solids so that it reads at a glance: wheels, a
// chassis, a cab with its windscreen, and the one part that says what the vehicle does — the fuel truck's round
// tank (the mobile charger's green battery box, the apron robot's low driverless cart), the plough's wide blade, the stair truck's stairs and rails, the catering box on its lift, the de-icer's
// boom and basket, the fire tender's water cannon, the coach's band of windows. Every solid is a convex prism in
// the vehicle's own frame (a along the heading, b to the right, z up), its walls lit like the buildings
// (render/iso.js) and those facing away from the viewer left out. Used by render/traffic.js (the turnaround, the
// depots, the plough convoy) and render/airport.js (the crash tenders, the coaches, the site's trucks).

const Vehicles = (() => {
  const VZ = ISO_K / ISO_Z;   // the direction towards the viewer is (1, −1, VZ): what the projection flattens
  const GLASS = '#2f3d4a', TYRE = '#1d1f21', HUB = '#9aa0a6', CHASSIS = '#2e3134';

  // the vehicle's frame at a point and a heading (° from north), and a point of it in the world
  function frame(x, y, hdg) {
    const h = hdg * Math.PI / 180;
    return { x, y, fx: Math.sin(h), fy: Math.cos(h), rx: Math.cos(h), ry: -Math.sin(h) };
  }
  const at = (o, a, b, z) => [o.x + o.fx * a + o.rx * b, o.y + o.fy * a + o.ry * b, z];
  const depthAt = (o, a) => depthOf(o.x + o.fx * a, o.y + o.fy * a);

  // a convex solid: its vertices in the frame, its faces as rings of indices; only the faces towards the viewer,
  // each lit by where it faces (the top lightest, the south a little lit, the east in shade)
  function solid(c, o, verts, faces, col) {
    const w = verts.map((v) => at(o, v[0], v[1], v[2]));
    const m = [0, 0, 0];
    for (const p of w) { m[0] += p[0] / w.length; m[1] += p[1] / w.length; m[2] += p[2] / w.length; }
    for (const f of faces) {
      let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0;
      for (let i = 0; i < f.length; i++) {
        const p = w[f[i]], q = w[f[(i + 1) % f.length]];
        nx += (p[1] - q[1]) * (p[2] + q[2]); ny += (p[2] - q[2]) * (p[0] + q[0]); nz += (p[0] - q[0]) * (p[1] + q[1]);
        cx += p[0] / f.length; cy += p[1] / f.length; cz += p[2] / f.length;
      }
      const out = (cx - m[0]) * nx + (cy - m[1]) * ny + (cz - m[2]) * nz, k = (out < 0 ? -1 : 1) / (Math.hypot(nx, ny, nz) || 1);
      nx *= k; ny *= k; nz *= k;
      if (nx - ny + VZ * nz <= 1e-6) continue;
      Iso.poly(c, f.map((i) => w[i]), shade(col, 0.22 * nz - 0.18 * nx - 0.05 * ny));
    }
  }
  // a convex section [u, v] swept from s0 to s1: along the heading ('a': u across, v up) or across it ('b': u along)
  function prism(c, o, axis, s0, s1, sec, col) {
    const n = sec.length, verts = [], faces = [[], []];
    for (const s of [s0, s1]) for (const [u, v] of sec) verts.push(axis === 'a' ? [s, u, v] : [u, s, v]);
    for (let i = 0; i < n; i++) { faces[0].push(i); faces[1].push(n + i); const j = (i + 1) % n; faces.push([i, j, n + j, n + i]); }
    solid(c, o, verts, faces, col);
  }
  const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const circle = (u, v, r, n) => Array.from({ length: n }, (_, i) => [u + Math.cos(i / n * Math.PI * 2) * r, v + Math.sin(i / n * Math.PI * 2) * r]);
  function box(c, o, a0, a1, b0, b1, z0, z1, col) { prism(c, o, 'a', a0, a1, rect(b0, b1, z0, z1), col); }
  // a round tank lying along the heading, its axis at height z
  function tank(c, o, a0, a1, z, r, col) { prism(c, o, 'a', a0, a1, circle(0, z, r, 16), col); }

  // flat panels just outside the walls of a box a0..a1, ±hw (windows, stripes): 'f' the front, 'r' the rear,
  // 's' both sides; the front and rear ones inset from the edges by `inset`, the side ones run the whole length
  function panels(c, o, a0, a1, hw, z0, z1, col, which, inset) {
    const e = 0.04, i = inset === undefined ? 0.15 : inset, walls = [];
    if (which.indexOf('f') >= 0) walls.push([a1 + e, -hw + i, a1 + e, hw - i, o.fx, o.fy]);
    if (which.indexOf('r') >= 0) walls.push([a0 - e, -hw + i, a0 - e, hw - i, -o.fx, -o.fy]);
    if (which.indexOf('s') >= 0) walls.push([a0, hw + e, a1, hw + e, o.rx, o.ry], [a0, -hw - e, a1, -hw - e, -o.rx, -o.ry]);
    for (const [pa, pb, qa, qb, nx, ny] of walls) {
      if (nx - ny <= 0) continue;
      Iso.poly(c, [at(o, pa, pb, z0), at(o, qa, qb, z0), at(o, qa, qb, z1), at(o, pa, pb, z1)], shade(col, -0.18 * nx - 0.05 * ny));
    }
  }
  // a cab: a box with its windscreen and the side windows by it
  function cab(c, o, a0, a1, hw, z0, z1, col) {
    box(c, o, a0, a1, -hw, hw, z0, z1, col);
    const g0 = z0 + (z1 - z0) * 0.5, g1 = z1 - 0.18;
    panels(c, o, a0, a1, hw, g0, g1, GLASS, 'f');
    panels(c, o, Math.max(a0 + 0.15, a1 - 1.1), a1 - 0.1, hw, g0, g1, GLASS, 's');
  }
  // the wheels of one side (the side towards the viewer when `near`), r their radius, on axles at a
  function wheels(c, o, axles, hw, r, near) {
    const s = (o.rx - o.ry > 0) === near ? 1 : -1;
    for (const a of axles) {
      prism(c, o, 'b', s * (hw - 0.4), s * (hw + 0.02), circle(a, r, r, 12), TYRE);
      if (near) prism(c, o, 'b', s * (hw + 0.02), s * (hw + 0.05), circle(a, r, r * 0.42, 8), HUB);
    }
  }
  // a vehicle: the far wheels, its base, the near wheels, then its parts [a, draw] from the farthest to the nearest
  function vehicle(c, o, hw, axles, r, base, parts) {
    wheels(c, o, axles, hw, r, false);
    base();
    wheels(c, o, axles, hw, r, true);
    parts.map((p) => [depthAt(o, p[0]), p[1]]).sort((x, y) => x[0] - y[0]).forEach((p) => p[1]());
  }
  // a truck's chassis from a0 to a1, under a body at height z
  const chassis = (c, o, a0, a1, hw, z) => () => box(c, o, a0, a1, -hw + 0.25, hw - 0.25, z - 0.45, z, CHASSIS);
  // an amber beacon on the roof
  function beacon(sc, o, a, z) { if (sc) { const p = at(o, a, 0, z); sc.lights.push({ x: p[0], y: p[1], z, col: '255,176,0', r: 3.5, blink: 2 }); } }
  function lamp(c, o, a, z) { box(c, o, a - 0.25, a + 0.25, -0.25, 0.25, z, z + 0.35, PAL.beacon); }

  // the fuel truck: a red cab and a silver tank (the oil company's and the hydrogen bowser in their own colours)
  function fuelTruck(c, sc, x, y, hdg, lit, cabCol, tankCol) {
    const o = frame(x, y, hdg), z = 0.9;
    vehicle(c, o, 1.25, [2.9, -1.5, -2.8], 0.5, chassis(c, o, -4.1, 4.2, 1.25, z), [
      [3.2, () => { cab(c, o, 2.2, 4.3, 1.25, z, 2.9, cabCol || '#c83a2e'); if (lit) lamp(c, o, 3.2, 2.9); }],
      [-0.9, () => { tank(c, o, -4.1, 1.9, z + 1.0, 1.0, tankCol || '#d6dadd'); box(c, o, -4.3, -4.1, -0.5, 0.5, z, z + 0.7, '#555b60'); }]
    ]);
    if (lit) beacon(sc, o, 3.2, 3.3);
  }
  // the mobile charger: a white van with a green battery box and a green lamp
  function charger(c, sc, x, y, hdg) {
    const o = frame(x, y, hdg), z = 0.85;
    vehicle(c, o, 1.15, [2.3, -2.0], 0.45, chassis(c, o, -3.4, 3.6, 1.15, z), [
      [2.8, () => { cab(c, o, 1.9, 3.7, 1.15, z, 2.6, '#eceae4'); lamp(c, o, 2.8, 2.6); }],
      [-0.8, () => { box(c, o, -3.4, 1.6, -1.15, 1.15, z, 2.3, '#2f9e5b'); panels(c, o, -3.4, 1.6, 1.15, 1.5, 1.75, '#eceae4', 'frs', 0); }]
    ]);
    if (sc) { const p = at(o, 2.8, 0, 3); sc.lights.push({ x: p[0], y: p[1], z: 3, col: '90,220,130', r: 3, blink: 2 }); }
  }
  // an apron robot's fuel cart: low, driverless, white with a silver tank and a blue lamp
  function robot(c, sc, x, y, hdg) {
    const o = frame(x, y, hdg);
    vehicle(c, o, 1.0, [1.4, -1.4], 0.35, () => box(c, o, -2.2, 2.2, -1.0, 1.0, 0.25, 0.8, '#e8eaec'), [
      [-0.2, () => { tank(c, o, -1.9, 1.4, 1.35, 0.55, '#c9ced2'); box(c, o, 1.6, 2.1, -0.2, 0.2, 0.8, 1.2, '#3a8fe0'); }]
    ]);
    if (sc) { const p = at(o, 1.9, 0, 1.3); sc.lights.push({ x: p[0], y: p[1], z: 1.3, col: '90,160,255', r: 2.5, blink: 2 }); }
  }
  // the snow plough: an orange truck pushing a wide yellow blade set at an angle
  function plough(c, sc, x, y, hdg) {
    const o = frame(x, y, hdg), z = 1.05, bp = at(o, 5.2, 0, 0), ob = frame(bp[0], bp[1], hdg - 30);
    vehicle(c, o, 1.3, [2.4, -2.5], 0.6, chassis(c, o, -4.0, 4.0, 1.3, z), [
      [5.2, () => { box(c, o, 3.8, 5.1, -0.6, 0.6, 0.5, 1.0, CHASSIS); prism(c, ob, 'b', -3, 3, rect(-0.15, 0.15, 0.1, 1.6), '#f2c230'); }],
      [2.6, () => { cab(c, o, 1.6, 3.8, 1.3, z, 3.2, PAL.hiVisOrange); lamp(c, o, 2.6, 3.2); }],
      [-1.4, () => box(c, o, -4.0, 1.4, -1.3, 1.3, z, 2.5, '#d9731b')]
    ]);
    beacon(sc, o, 2.6, 3.6);
  }
  // the pushback tug: low, wide and yellow, a small cab at the back and the tow bar to the nose
  function tug(c, x, y, hdg) {
    const o = frame(x, y, hdg);
    vehicle(c, o, 1.3, [1.5, -1.5], 0.45, () => box(c, o, -2.4, 2.4, -1.3, 1.3, 0.3, 1.15, '#e0b020'), [
      [-1.6, () => cab(c, o, -2.3, -0.9, 1.1, 1.15, 2.2, '#e0b020')],
      [3.2, () => box(c, o, 2.4, 4.2, -0.15, 0.15, 0.45, 0.65, CHASSIS)]
    ]);
  }
  // the stair truck: its stairs rising from the back to a platform over the cab, with steps and rails
  function stairs(c, x, y, hdg) {
    const o = frame(x, y, hdg), z = 0.8, top = 3.1, S = '#d7d2c4', lo = [-2.8, z + 0.25], hi = [1.2, top];
    vehicle(c, o, 1.1, [1.9, -1.9], 0.4, chassis(c, o, -3.0, 3.0, 1.1, z), [
      [2.3, () => { cab(c, o, 1.5, 3.0, 1.1, z, 1.9, '#ececec'); box(c, o, 1.2, 3.1, -0.85, 0.85, top - 0.2, top, S); }],
      [-0.8, () => prism(c, o, 'b', -0.8, 0.8, [[-3.0, z], [1.2, z], hi, lo], S)]
    ]);
    // the steps, where the slope faces the viewer: its normal is −f·sin + up·cos
    const da = hi[0] - lo[0], dz = hi[1] - lo[1], l = Math.hypot(da, dz), sn = dz / l, cs = da / l;
    if (-o.fx * sn + o.fy * sn + VZ * cs > 0) {
      c.strokeStyle = shade(S, -0.35); c.lineWidth = 0.1;
      for (let i = 1; i < 9; i++) {
        const a = lo[0] + da * i / 9, h = lo[1] + dz * i / 9 + 0.02, p = P(...at(o, a, -0.75, h)), q = P(...at(o, a, 0.75, h));
        c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
      }
    }
    c.strokeStyle = '#4a4f55'; c.lineWidth = 0.14;
    for (const b of [-0.8, 0.8]) {
      const p = [[-2.8, z + 1.15], [1.2, top + 0.9], [3.1, top + 0.9]].map(([a, h]) => P(...at(o, a, b, h)));
      c.beginPath(); c.moveTo(p[0][0], p[0][1]); c.lineTo(p[1][0], p[1][1]); c.lineTo(p[2][0], p[2][1]); c.stroke();
    }
  }
  // the catering truck: a white box with a blue stripe, raised on its lift behind the cab
  function catering(c, x, y, hdg) {
    const o = frame(x, y, hdg), z = 0.8;
    vehicle(c, o, 1.2, [2.3, -2.2], 0.45, chassis(c, o, -3.5, 3.5, 1.2, z), [
      [2.8, () => cab(c, o, 2.1, 3.6, 1.2, z, 2.5, '#ececec')],
      [-0.9, () => {
        box(c, o, -3.2, 1.6, -0.7, 0.7, z, 1.6, '#555b60');
        box(c, o, -3.6, 1.9, -1.25, 1.25, 1.6, 4.0, '#eceae4');
        panels(c, o, -3.6, 1.9, 1.25, 3.2, 3.55, '#2c5aa0', 'frs', 0);
      }]
    ]);
  }
  // the baggage train: an orange tractor and its carts behind, each with a few bags
  const BAGS = ['#2c3e66', '#7a2e2e', '#3e5a3e', '#6a5a3a', '#444a50'];
  function bagTrain(c, x, y, hdg, carts) {
    const o = frame(x, y, hdg), units = [];
    units.push([depthAt(o, 0), () => vehicle(c, o, 0.75, [0.75, -0.75], 0.35, () => box(c, o, -1.3, 1.3, -0.75, 0.75, 0.3, 1.0, PAL.hiVisOrange), [
      [-0.6, () => cab(c, o, -1.2, -0.2, 0.65, 1.0, 1.9, PAL.hiVisOrange)]
    ])]);
    for (let i = 1; i <= carts; i++) {
      const p = at(o, -i * 3.4, 0, 0), q = frame(p[0], p[1], hdg);
      units.push([depthAt(o, -i * 3.4), () => vehicle(c, q, 0.75, [0.9, -0.9], 0.22, () => box(c, q, -1.4, 1.4, -0.75, 0.75, 0.3, 0.5, '#5a6066'), [
        [0.6, () => box(c, q, 0.1, 1.3, -0.6, 0.6, 0.5, 1.15, BAGS[i % 5])],
        [-0.6, () => box(c, q, -1.3, -0.1, -0.6, 0.1, 0.5, 0.95, BAGS[(i + 2) % 5])],
        [-0.7, () => box(c, q, -1.2, -0.3, 0.15, 0.6, 0.5, 1.05, BAGS[(i + 3) % 5])]
      ])]);
    }
    units.sort((p, q) => p[0] - q[0]).forEach((u) => u[1]());
  }
  // the de-icing truck: an orange cab, a white glycol tank and a boom with the basket at height h
  function deicer(c, sc, x, y, hdg, h) {
    const o = frame(x, y, hdg), z = 0.9;
    vehicle(c, o, 1.25, [2.8, -1.5, -2.8], 0.5, chassis(c, o, -4.0, 4.2, 1.25, z), [
      [3.2, () => { cab(c, o, 2.2, 4.2, 1.25, z, 2.9, PAL.hiVisOrange); lamp(c, o, 3.2, 2.9); }],
      [-1.2, () => {
        box(c, o, -4.0, 1.7, -1.25, 1.25, z, 2.6, '#e9e6de');
        box(c, o, -2.9, -2.3, -0.3, 0.3, 2.6, h, '#c9ccce');
        box(c, o, -3.4, -1.8, -0.8, 0.8, h, h + 1.1, PAL.hiVisOrange);
      }]
    ]);
    beacon(sc, o, 3.2, 3.4);
  }
  // the fire service's crash tender: big and red, three axles, a white stripe and a water cannon on the roof
  function crashTender(c, x, y, hdg) {
    const o = frame(x, y, hdg), z = 1.05, R = '#c8322a';
    vehicle(c, o, 1.5, [3.2, -1.5, -3.3], 0.65, chassis(c, o, -5.0, 5.0, 1.5, z), [
      [4.0, () => { cab(c, o, 3.0, 5.1, 1.5, z, 3.1, R); box(c, o, 3.6, 4.6, -1.0, 1.0, 3.1, 3.35, '#3a6fd8'); }],
      [-1.0, () => {
        box(c, o, -5.0, 2.9, -1.5, 1.5, z, 3.3, R);
        panels(c, o, -5.0, 2.9, 1.5, 1.8, 2.1, '#f2f2f2', 's');
        box(c, o, 1.3, 2.3, -0.4, 0.4, 3.3, 3.75, '#d0d0d0');
        tank(c, o, 2.3, 3.8, 3.6, 0.14, '#d0d0d0');
      }]
    ]);
  }
  // the airport coach: white, a band of windows all round and a blue stripe
  function bus(c, x, y, hdg) {
    const o = frame(x, y, hdg), hw = 1.27;
    vehicle(c, o, hw, [3.8, -3.1], 0.5, () => box(c, o, -6, 6, -hw, hw, 0.35, 3.2, '#ececec'), [
      [0, () => { panels(c, o, -6, 6, hw, 1.7, 2.75, GLASS, 'frs', 0.12); panels(c, o, -6, 6, hw, 0.9, 1.2, '#2c5aa0', 'frs', 0); }]
    ]);
  }
  // a lorry: a cab and a box body (the site's trucks)
  function lorry(c, x, y, hdg, cabCol, bodyCol) {
    const o = frame(x, y, hdg), z = 0.9;
    vehicle(c, o, 1.25, [2.7, -1.6, -2.9], 0.5, chassis(c, o, -4.0, 4.1, 1.25, z), [
      [3.1, () => cab(c, o, 2.1, 4.1, 1.25, z, 2.8, cabCol)],
      [-1.1, () => box(c, o, -4.0, 1.8, -1.25, 1.25, z + 0.1, 2.4, bodyCol)]
    ]);
  }

  return { fuelTruck, charger, robot, plough, tug, stairs, catering, bagTrain, deicer, crashTender, bus, lorry };
})();
