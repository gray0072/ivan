'use strict';

// ============================================================
// World Aviation — an aeroplane's shape, worked out from its type's
// real dimensions (`dims`) and exterior (`look`), without any meshes:
//   - modelLayout(ac): where the main parts are (the wing, the
//     engines, the tail, the gear), in the model's own axes; the 3D
//     model is built by it (render/models.js), the Mriya's blueprint
//     drawn by it (art/mriyaplan.js), the emergency vehicles placed
//     clear of it (render/responders3d.js)
//   - Airframe.solids(ac): the aeroplane as a few upright prisms (the
//     fuselage, each wing, the tailplane, the fin, the engines), for
//     what the own aeroplane may run into (a parked one, sim/collide.js)
//   - Airframe.samples(ac): the own aeroplane as spheres along its
//     fuselage, its wings, its tail and its engines (sim/collide.js
//     tests them against every obstacle)
// Model axes: +z = nose, +y = up, +x = left wing. The origin is the
// centre of gravity, and the wheels touch y = -gearH.
// ============================================================

// Where the main parts of a type's model are, in its own axes (metres): the wing, the engines,
// the tail and the gear. build() places the parts by it; the Mriya's blueprint draws it.
function modelLayout(ac, look) {
  look = look || ac.look || {};
  const d = aircraftDims(ac);
  const L = d.len, R = d.radius, S = d.span;
  const hk = look.tall || 1;                                       // body height over width
  const top = R * (2 * hk - 1);                                    // the roof above the axis
  const jet = ac.engineType === 'jet';
  const high = look.wing === 'high';
  const four = look.engines === 'wing4' || look.engines === 'wing6';
  const sweep = (look.sweep !== undefined ? look.sweep : jet ? 25 : 3) * DEG;
  const semi = S / 2 - R * 0.8;
  const rootC = jet ? S * (four ? 0.2 : 0.17) : S * 0.115;
  const tipC = rootC * (jet ? 0.28 : 0.55);
  const thick = rootC * (jet ? 0.1 : 0.13);                        // for placing the engines and the gear
  const wingY = high ? R * 0.82 : -R * 0.55;
  const wingZ = L * (jet ? 0.08 : 0.1) + rootC * 0.45;             // leading edge at the root
  // the wing's dihedral (the 787's flexes up, the An-124's droops)
  const dihedral = (look.dihedral !== undefined ? look.dihedral : high ? 1 : jet ? 5 : 4) * DEG;
  const spanAt = (f) => R * 0.8 + semi * f;                        // x of a point at a fraction of the semispan
  const leAt = (f) => wingZ - semi * f * Math.tan(sweep);           // leading edge z there
  const yAt = (f) => wingY + semi * f * Math.sin(dihedral);
  // the tail: one fin on the body (a T-tail's tailplane on top of it), or a twin tail — the
  // tailplane on the roof of the tail and a fin at each end of it, clear of the wake of a load
  // carried on the back (the An-225's Buran)
  const twin = look.tail === 'twin', tTop = look.tail === 't';
  const finRoot = L * (jet ? 0.17 : 0.2) * (twin ? 0.6 : 1), finTip = finRoot * (jet ? 0.36 : 0.5) * (twin ? 1.5 : 1);
  const finH = twin ? R * 2.4 : jet ? R * 2.1 + L * 0.06 : R * 1.6 + L * 0.06;
  const finSweep = (twin ? 32 : jet ? 38 : 30) * DEG;
  const finZ = -L * 0.5 + finRoot + L * 0.015;                     // fin leading edge at the root
  // (its root inside the tail cone all along: lower, its edge hung out under the narrow end
  // of the cone, a thin rod seen from below; a double deck's roof runs higher into the tail)
  const finY = R * 0.72 + (top - R) * 0.8;
  // the tailplane's half span (real ones: 0.15 of the wing span on a T-tail, about 0.17-0.2 below;
  // the An-225's 32.65 m, 0.185 of its span)
  const tSemi = S * (twin ? 0.185 : tTop ? 0.15 : jet ? 0.19 : 0.17);
  const tRoot = twin ? L * 0.105 : finRoot * 0.75, tTip = tRoot * (twin ? 0.55 : 0.42);
  const tSweep = (twin ? 30 : jet ? 32 : 6) * DEG;
  const tailZ = twin ? -L * 0.5 + tRoot + L * 0.045 : -L * 0.5 + tRoot + L * 0.02;
  const tailY = twin ? top - R * 0.1 : R * 0.42;
  // the engines under the wing: their stations along the semispan, the fan and the nacelle
  const stations = look.engines === 'wing6' ? [0.2, 0.4, 0.6] : look.engines === 'wing4' ? [0.3, 0.6] : [0.33];
  const dia = d.fus * (look.fan || (four ? 0.42 : look.bigFans ? 0.56 : 0.5));
  const engines = [];
  if (look.engines === 'wing2' || four) {
    for (const f of stations) for (const side of [1, -1]) {
      // hung below the wing; a big fan that would come too close to the ground is pulled up
      // level with the wing and forwards out of it, as the real ones are
      let ny = yAt(f) - thick * 0.5 - dia * 0.62;
      const lift = Math.max(0, -d.gearH + dia * 0.65 - ny);
      ny += lift;
      engines.push({ f, side, x: side * spanAt(f), y: ny, z: leAt(f) + dia * 0.75 + lift * 1.2, dia, len: dia * (four ? 2.0 : 1.75) });
    }
  }
  // the gear: the wheels, the main legs and the nose leg
  const wheelR = Math.max(0.28, d.fus * 0.13);
  return {
    L, R, S, hk, top, jet, high, sweep, semi, rootC, tipC, thick, wingY, wingZ, dihedral, spanAt, leAt, yAt,
    twin, tTop, finRoot, finTip, finH, finSweep, finZ, finY, tSemi, tRoot, tTip, tSweep, tailZ, tailY,
    engines, wheelR, gearH: d.gearH, noseZ: L * 0.38, mainRows: look.mainRows || 2,
    mainX: high ? R * 1.05 : R * (S > 50 ? 1.15 : 0.95), mainZ: -L * 0.03
  };
}

const Airframe = {
  cache: new Map(),           // aircraft id -> { solids, samples }

  get(ac) {
    let c = this.cache.get(ac.id);
    if (!c) { c = { solids: this.buildSolids(ac), samples: this.buildSamples(ac) }; this.cache.set(ac.id, c); }
    return c;
  },
  solids(ac) { return this.get(ac).solids; },
  samples(ac) { return this.get(ac).samples; },

  // The prisms: a convex outline in the model's x-z plane ([x, z] points) standing from y0 to y1
  buildSolids(ac) {
    const lay = modelLayout(ac), out = [];
    const L = lay.L, R = lay.R, tan = Math.tan;
    const put = (pts, y0, y1) => out.push(convexPrism(pts, y0, y1));
    // the fuselage, from the belly to the roof
    put([[-R, -L / 2], [R, -L / 2], [R, L / 2], [-R, L / 2]], -R, lay.top);
    // the wings: root and tip, leading and trailing edges, over the dihedral
    const tipX = lay.spanAt(1), tipLe = lay.leAt(1);
    const wy0 = Math.min(lay.wingY, lay.yAt(1)) - lay.thick, wy1 = Math.max(lay.wingY, lay.yAt(1)) + lay.thick;
    for (const s of [1, -1]) {
      put([[s * R * 0.8, lay.wingZ], [s * tipX, tipLe], [s * tipX, tipLe - lay.tipC], [s * R * 0.8, lay.wingZ - lay.rootC]], wy0, wy1);
    }
    // the tailplane (a T-tail's on top of the fin)
    const ty = lay.tTop ? lay.finY + lay.finH : lay.tailY;
    const tLe = lay.tailZ - lay.tSemi * tan(lay.tSweep);
    for (const s of [1, -1]) {
      put([[0, lay.tailZ], [s * lay.tSemi, tLe], [s * lay.tSemi, tLe - lay.tTip], [0, lay.tailZ - lay.tRoot]], ty - 0.6, ty + 0.6);
    }
    // the fin (a twin tail's at both ends of the tailplane), in two storeys, each as deep as its
    // swept outline there
    const finXs = lay.twin ? [lay.tSemi, -lay.tSemi] : [0];
    const finBase = lay.twin ? ty : lay.finY;
    for (const fx of finXs) {
      for (let k = 0; k < 2; k++) {
        const h0 = lay.finH * k / 2, h1 = lay.finH * (k + 1) / 2;
        const le = lay.finZ - h0 * tan(lay.finSweep);
        const te = lay.finZ - lay.finRoot - h1 * tan(lay.finSweep) + (lay.finRoot - lay.finTip) * (h1 / lay.finH);
        put([[fx - 0.7, le], [fx + 0.7, le], [fx + 0.7, Math.min(te, le - 1)], [fx - 0.7, Math.min(te, le - 1)]], finBase + h0, finBase + h1);
      }
    }
    // the engines under the wings
    for (const e of lay.engines) {
      const r = e.dia / 2;
      put([[e.x - r, e.z + e.len * 0.5], [e.x + r, e.z + e.len * 0.5], [e.x + r, e.z - e.len * 0.6], [e.x - r, e.z - e.len * 0.6]], e.y - r, e.y + r);
    }
    return out;
  },

  // The spheres: { x, y, z, r } in the model's axes, never further apart than they are thick
  // (COLLIDE.SAMPLE_M along a wing), so nothing slips between them
  buildSamples(ac) {
    const lay = modelLayout(ac), out = [];
    const L = lay.L, R = lay.R, step = COLLIDE.SAMPLE_M, rw = COLLIDE.WING_R;
    // the fuselage: a row of spheres as wide as it is, the nose and the tail just touching its ends
    const fy = (lay.top - R) / 2;
    const nF = Math.max(2, Math.ceil((L - 2 * R) / R) + 1);
    for (let i = 0; i < nF; i++) out.push({ x: 0, y: fy, z: -L / 2 + R + (L - 2 * R) * i / (nF - 1), r: R });
    // a swept surface from its root to its tip: the leading edge, the middle and the trailing edge
    const surface = (x0, x1, le0, le1, c0, c1, y0, y1) => {
      const n = Math.max(2, Math.ceil(Math.abs(x1 - x0) / step) + 1);
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1), x = lerp(x0, x1, f), le = lerp(le0, le1, f), c = lerp(c0, c1, f), y = lerp(y0, y1, f);
        const nc = Math.max(2, Math.ceil(c / (step * 4)) + 1);
        for (let j = 0; j < nc; j++) out.push({ x, y, z: le - c * j / (nc - 1), r: rw });
      }
    };
    for (const s of [1, -1]) {
      surface(s * R * 0.8, s * lay.spanAt(1), lay.wingZ, lay.leAt(1), lay.rootC, lay.tipC, lay.wingY, lay.yAt(1));
      const ty = lay.tTop ? lay.finY + lay.finH : lay.tailY;
      surface(s * R * 0.5, s * lay.tSemi, lay.tailZ, lay.tailZ - lay.tSemi * Math.tan(lay.tSweep), lay.tRoot, lay.tTip, ty, ty);
    }
    // the fin: up its leading and trailing edges and across its tip
    const finXs = lay.twin ? [lay.tSemi, -lay.tSemi] : [0];
    const finBase = lay.twin ? (lay.tTop ? lay.finY + lay.finH : lay.tailY) : lay.finY;
    for (const fx of finXs) {
      const n = Math.max(2, Math.ceil(lay.finH / step) + 1);
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1), h = lay.finH * f;
        const le = lay.finZ - h * Math.tan(lay.finSweep), c = lerp(lay.finRoot, lay.finTip, f);
        out.push({ x: fx, y: finBase + h, z: le, r: rw }, { x: fx, y: finBase + h, z: le - c, r: rw });
      }
    }
    // the engines: their intake and their exhaust
    for (const e of lay.engines) {
      const r = e.dia / 2;
      out.push({ x: e.x, y: e.y, z: e.z + e.len * 0.5 - r, r }, { x: e.x, y: e.y, z: e.z - e.len * 0.6 + r, r });
    }
    return out;
  }
};

// a prism: a convex outline as edge lines (n · p <= d inside) and its height
function convexPrism(pts, y0, y1) {
  let cx = 0, cz = 0;
  for (const p of pts) { cx += p[0] / pts.length; cz += p[1] / pts.length; }
  const edges = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    let nx = q[1] - p[1], nz = p[0] - q[0];
    const l = Math.hypot(nx, nz);
    if (l < 1e-6) continue;
    nx /= l; nz /= l;
    let d = nx * p[0] + nz * p[1];
    if (nx * cx + nz * cz > d) { nx = -nx; nz = -nz; d = -d; }   // outwards, away from the middle
    edges.push({ nx, nz, d });
  }
  let rad = 0;
  for (const p of pts) rad = Math.max(rad, Math.hypot(p[0], p[1]));
  return { edges, y0, y1, rad };
}
