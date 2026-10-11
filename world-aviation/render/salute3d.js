'use strict';

// ============================================================
// World Aviation — the water salute at the end of a flight round the
// world (three.js): as the aeroplane comes home off the runway, two
// airport fire engines stand either side of its way to the stand and
// throw an arch of water over it, as airports greet a special
// arrival.
//
//   - where: on the longest straight run of the arrival's taxi route
//     that is neither the runway, the apron lane nor the stand (most
//     often the rapid exit between the runway and the taxiway, with
//     grass on both sides), at its middle; the engines face the line,
//     each half the span and SALUTE_CLEAR further out
//   - the water: two jets of spray points from the roof monitors, each
//     a parabola over the line to the far side, rising higher than the
//     fin, streaming and widening as it falls
//
// Built into the arrival airport's frame (Airport3D's rec.frame,
// x = across, z = -t) while Scene3D.salute is set (game.js: the last
// leg of an expedition, from the runway exit on). Used by
// Scene3D.update.
// ============================================================

const SALUTE_CLEAR = 16;        // a fire engine's front this far out past the wing tip, metres
const SALUTE_DROPS = 520;       // spray points in each jet
const SALUTE_SPEED = 0.42;      // a drop crosses the arch in 1 / this seconds

const Salute3D = {
  // per frame, for every airport built: s = Scene3D.salute ({ route }) when rec is the arrival
  update(rec, fl, s, time, dark) {
    const want = s && s.route && rec.a.id === fl.arrival.id ? s : null;
    if (rec.salute && rec.salute.src !== want) {
      rec.frame.remove(rec.salute.group);
      rec.salute.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      rec.salute = null;
    }
    if (!want) return;
    if (!rec.salute) rec.salute = this.build(rec, fl, want) || { src: want, group: new THREE.Group(), jets: [] };
    this.spray(rec.salute, time, dark);
  },

  // the spot: the middle of the route's longest run off the runway, the apron and the stand, in
  // the airport's frame (t along the runway, across towards the terminal), and its direction
  spot(route) {
    let best = null;
    for (let i = 0; i + 1 < route.length; i++) {
      const n1 = route[i], n2 = route[i + 1];
      const e = n1.edges.find((x) => x.to === n2);
      if (!e || e.kind === 'runway' || e.kind === 'apron' || e.kind === 'stand') continue;
      const len = Math.hypot(n2.t - n1.t, n2.across - n1.across);
      if (len > 60 && (!best || len > best.len)) best = { len, t: (n1.t + n2.t) / 2, across: (n1.across + n2.across) / 2, dt: (n2.t - n1.t) / len, da: (n2.across - n1.across) / len };
    }
    return best;
  },

  build(rec, fl, src) {
    const sp = this.spot(src.route);
    if (!sp) return null;
    const half = fl.dims.span / 2 + SALUTE_CLEAR;
    const apex = Math.max(18, 12 + fl.dims.len * 0.22);
    // the salute's own frame: x across the line (to its left), z along it; placed and turned in
    // the airport's frame (x = across, z = -t)
    const group = new THREE.Group();
    group.position.set(sp.across, 0, -sp.t);
    group.rotation.y = Math.atan2(sp.da, -sp.dt);
    const body = new THREE.MeshLambertMaterial({ vertexColors: true });
    const jets = [];
    for (const side of [-1, 1]) {
      const k = kit();
      Vehicles.fireEngine(k);
      const truck = k.mesh(body);
      // facing the line (its front, forward +z, towards x = 0), its back half the span out
      truck.position.set(side * (half + 5.3), 0, side * 3);
      truck.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      group.add(truck);
      // the jet: from the roof monitor over the line to the far side
      const x0 = side * (half + 5.3 - 3.75), y0 = 3.8, x2 = -side * (half - 6), z = side * 3;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(SALUTE_DROPS * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color: 0xdaf0ff, size: 1.1, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false, fog: true });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      group.add(pts);
      const rnd = makeRng(hashStr(rec.a.id + side));
      const seeds = [];
      for (let i = 0; i < SALUTE_DROPS; i++) seeds.push([rnd.next(), rnd.range(-1, 1), rnd.range(-1, 1), rnd.range(-1, 1)]);
      jets.push({ x0, y0, x2, z, apex, pos, geo, mat, seeds });
    }
    rec.frame.add(group);
    return { src, group, jets };
  },

  // the drops along each jet: a parabola through the monitor, the apex over the line and the
  // ground on the far side, spreading as they fall
  spray(s, time, dark) {
    for (const j of s.jets) {
      const { x0, y0, x2, apex, pos, seeds } = j;
      // (the parabola y(x) through (x0, y0), (0, apex), (x2, 0): Lagrange's form)
      const y = (x) => y0 * (x * (x - x2)) / (x0 * (x0 - x2)) + apex * ((x - x0) * (x - x2)) / ((0 - x0) * (0 - x2));
      for (let i = 0; i < seeds.length; i++) {
        const sd = seeds[i];
        const u = (sd[0] + time * SALUTE_SPEED) % 1;
        const x = x0 + (x2 - x0) * u, spread = 0.3 + u * u * 3.2;
        pos[i * 3] = x + sd[1] * spread;
        pos[i * 3 + 1] = Math.max(0.2, y(x) + sd[2] * spread * 0.6);
        pos[i * 3 + 2] = j.z + sd[3] * spread;
      }
      j.geo.attributes.position.needsUpdate = true;
      j.mat.opacity = 0.42 + 0.2 * dark;
    }
  }
};
