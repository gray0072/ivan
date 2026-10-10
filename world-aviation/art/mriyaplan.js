'use strict';

// ============================================================
// World Aviation — the Mriya's blueprint: the An-225 seen from
// above, worked out from the same layout as its 3D model
// (modelLayout in render/models.js), so a part's place on the
// blueprint is where it is on the hologram.
//
// Plan coordinates are metres: px across (right = the right wing),
// py back from the nose. A part's slot (data/mriya.js) becomes:
//   MriyaPlan.shapes(part)  convex polygons on the blueprint
//   MriyaPlan.part3d(part)  what of the 3D model it gilds: the model's
//                           tagged parts, cut to its polygons or its
//                           stretch of the body (render/mriya3d.js),
//                           and the glowing modules inside
//   MriyaPlan.outline()     the aeroplane's lines under the parts
// Used by ui/mriya.js and render/mriya3d.js.
// ============================================================

const MriyaPlan = {
  lay: null, ac: null,

  init() {
    if (this.lay) return this.lay;
    this.ac = AIRCRAFT.find((a) => a.legend);
    this.lay = modelLayout(this.ac);
    return this.lay;
  },

  // model axes (x left, z forward) <-> the blueprint (px right, py back from the nose)
  toPlan(x, z) { return [-x, this.lay.L / 2 - z]; },
  toModel(px, py) { return [-px, this.lay.L / 2 - py]; },

  // the half width of the body at py (fuselageRing in models.js)
  bodyHalf(py) { const l = this.lay; return fuselageRing(l.L, l.R, l.L / 2 - py).r; },
  // the body between two fractions of its length, as one outline
  bodyPoly(u0, u1) {
    const l = this.lay, left = [], right = [];
    const n = Math.max(2, Math.ceil((u1 - u0) * 40));
    for (let i = 0; i <= n; i++) {
      const py = (u0 + (u1 - u0) * i / n) * l.L;
      const r = Math.max(0.05, this.bodyHalf(py));
      left.push([-r, py]); right.unshift([r, py]);
    }
    return left.concat(right);
  },

  // a strip of a lifting surface (wing or tailplane) on one side: f along the half span, c along the chord
  wingQuad(f0, f1, c0, c1, side) {
    const l = this.lay;
    const chord = (f) => l.rootC + (l.tipC - l.rootC) * f;
    const pt = (f, c) => this.toPlan(side * l.spanAt(f), l.leAt(f) - c * chord(f));
    return [pt(f0, c0), pt(f1, c0), pt(f1, c1), pt(f0, c1)];
  },
  tailQuad(f0, f1, c0, c1, side) {
    const l = this.lay, x0 = l.R * 0.05;
    const chord = (f) => l.tRoot + (l.tTip - l.tRoot) * f;
    const pt = (f, c) => this.toPlan(side * (x0 + l.tSemi * f), l.tailZ - l.tSemi * f * Math.tan(l.tSweep) - c * chord(f));
    return [pt(f0, c0), pt(f1, c0), pt(f1, c1), pt(f0, c1)];
  },
  rect(cx, cy, w, h) { return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]]; },
  // the fin at one end of the tailplane (side: 1 = left, model +x), seen from above: from its
  // root's leading edge back to its tip's trailing edge, c0..c1 of that
  finRect(side, c0, c1) {
    const l = this.lay;
    const tipZ = l.tailZ - l.tSemi * Math.tan(l.tSweep);
    const le = tipZ + l.finRoot * 0.25 + l.finH * 0.3 * Math.tan(l.finSweep);
    const back = le - l.finH * Math.tan(l.finSweep) - l.finTip;
    const z0 = le + (back - le) * c0, z1 = le + (back - le) * c1;
    const [px] = this.toPlan(side * (l.R * 0.05 + l.tSemi + 0.05), 0);
    return this.rect(px, l.L / 2 - (z0 + z1) / 2, 1.1, Math.abs(z1 - z0));
  },
  // engine n (1 = the left outer … 6 = the right outer) as modelLayout lists them
  engineAt(n) {
    const order = [[0.6, 1], [0.4, 1], [0.2, 1], [0.2, -1], [0.4, -1], [0.6, -1]][n - 1];
    return this.lay.engines.find((e) => e.f === order[0] && e.side === order[1]);
  },
  // the front of an engine (its cowling and core) or the back of its nacelle (the reverser), along z
  engineSpan(e, back) {
    const front = e.z + e.len / 2, cut = front - e.len * 0.62, end = e.z - e.len / 2 - e.dia * 0.5;
    return back ? [end, cut] : [cut, front];
  },
  // the main gear's wheels: rows along z on one side
  mainRows(side) {
    const l = this.lay, rows = [];
    for (let r = 0; r < l.mainRows; r++) rows.push(l.mainZ - l.wheelR * 2.3 * (r - (l.mainRows - 1) / 2));
    return rows.map((z) => [side * l.mainX, z]);
  },
  sponson(side) {
    const l = this.lay, r = l.R * 0.38 * 0.72, len = l.wheelR * 2.3 * (l.mainRows - 1) + l.wheelR * 5;
    const [cx, cy] = this.toPlan(side * l.R * 0.98, l.mainZ);
    const half = len / 2 + l.R * 0.38, pts = [];
    for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; pts.push([cx + Math.cos(a) * r, cy - half + r - Math.sin(a) * r]); }
    for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; pts.push([cx - Math.cos(a) * r, cy + half - r + Math.sin(a) * r]); }
    return pts;
  },

  // ---------- a part's place ----------
  shapes(part) {
    this.init();
    if (part._shapes) return part._shapes;
    const l = this.lay, s = part.slot, out = [];
    const sides = (k) => (k === 'L' ? [1] : k === 'R' ? [-1] : [1, -1]);
    if (s.body) out.push(this.bodyPoly(s.body[0], s.body[1]));
    if (s.body2) out.push(this.bodyPoly(s.body2[0], s.body2[1]));
    if (s.boxes) for (const b of s.boxes) out.push(this.rect(b[1], b[0] * l.L, b[2], b[3]));
    if (s.wing) for (const sd of sides(s.sides)) out.push(this.wingQuad(s.wing[0], s.wing[1], s.chord[0], s.chord[1], sd));
    if (s.centre) {
      const [, le] = this.toPlan(0, l.wingZ), root = l.R * 0.8;
      out.push([[-root, le], [root, le], [root, le + l.rootC], [-root, le + l.rootC]]);
      for (const sd of [1, -1]) out.push(this.wingQuad(0, s.centre, 0, 1, sd));
    }
    if (s.surf === 'flap') for (const sd of [1, -1]) out.push(this.wingQuad(0, 0.6, 0.76, 1, sd));
    if (s.surf === 'aileron') for (const sd of [1, -1]) out.push(this.wingQuad(0.64, 0.94, 0.76, 1, sd));
    if (s.surf === 'spoiler') for (const sd of [1, -1]) for (const [f0, f1] of [[0.2, 0.36], [0.38, 0.55]]) out.push(this.wingQuad(f0, f1, 0.56, 0.75, sd));
    if (s.surf === 'elevator') for (const sd of [1, -1]) out.push(this.tailQuad(0, 0.96, 0.68, 1, sd));
    if (s.surf === 'rudder') for (const sd of [1, -1]) out.push(this.finRect(sd, 0.55, 1));
    if (s.tail) for (const sd of [1, -1]) out.push(this.tailQuad(0, 1.03, 0, 1, sd));
    if (s.fin) out.push(this.finRect(s.fin === 'L' ? 1 : -1, 0, 1));
    if (s.engine) {
      const e = this.engineAt(s.engine), [z0, z1] = this.engineSpan(e, false), [px] = this.toPlan(e.x, 0);
      out.push(this.rect(px, l.L / 2 - (z0 + z1) / 2, e.dia, z1 - z0));
    }
    if (s.reverser) for (let n = 1; n <= 6; n++) {
      const e = this.engineAt(n), [z0, z1] = this.engineSpan(e, true), [px] = this.toPlan(e.x, 0);
      out.push(this.rect(px, l.L / 2 - (z0 + z1) / 2, e.dia * 0.84, z1 - z0));
    }
    if (s.pylon) for (let n = 1; n <= 6; n++) {
      const e = this.engineAt(n), [px] = this.toPlan(e.x, 0);
      out.push(this.rect(px, l.L / 2 - (e.z - e.dia * 0.575), 0.7, e.dia * 1.35));
    }
    if (s.gear === 'nose') out.push(this.rect(0, l.L / 2 - l.noseZ, 2.0, l.wheelR * 2.4));
    if (s.gear === 'L' || s.gear === 'R') {
      const rows = this.mainRows(s.gear === 'L' ? 1 : -1);
      const [px] = this.toPlan(rows[0][0], 0), y0 = l.L / 2 - rows[0][1], y1 = l.L / 2 - rows[rows.length - 1][1];
      out.push(this.rect(px, (y0 + y1) / 2, 1.7, Math.abs(y1 - y0) + l.wheelR * 2.2));
    }
    if (s.gear === 'wheels') {
      out.push(this.rect(-0.38, l.L / 2 - l.noseZ, 0.7, l.wheelR * 2), this.rect(0.38, l.L / 2 - l.noseZ, 0.7, l.wheelR * 2));
      for (const sd of [1, -1]) for (const [x, z] of this.mainRows(sd)) out.push(this.rect(-x, l.L / 2 - z, 1.6, l.wheelR * 1.8));
    }
    if (s.gear === 'sponsons') for (const sd of [1, -1]) out.push(this.sponson(sd));
    part._shapes = out;
    return out;
  },

  // the middle of a part's place: where it snaps to (the shapes' area-weighted centre)
  centre(part) {
    if (part._centre) return part._centre;
    let ax = 0, ay = 0, aw = 0;
    for (const poly of this.shapes(part)) {
      let a = 0, cx = 0, cy = 0;
      for (let i = 0; i < poly.length; i++) {
        const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length], k = x0 * y1 - x1 * y0;
        a += k; cx += (x0 + x1) * k; cy += (y0 + y1) * k;
      }
      a /= 2;
      if (Math.abs(a) < 1e-6) continue;
      ax += cx / (6 * a) * Math.abs(a); ay += cy / (6 * a) * Math.abs(a); aw += Math.abs(a);
    }
    part._centre = aw ? [ax / aw, ay / aw] : [0, this.lay.L / 2];
    return part._centre;
  },

  // what of the 3D model a part gilds: { tags, cut, yMin, yMax, zRanges, cores }
  //   tags: the model's tagged parts (or surf:<name>, its moving surfaces), cut: convex polygons in
  //   model x/z to cut them to (none: the whole of them), zRanges: stretches of the body instead,
  //   side: only the left (+1) or right (-1) half, yMin / yMax: above / below a height,
  //   cores: glowing modules inside { x, y, z, w, h, d }
  part3d(part) {
    this.init();
    const l = this.lay, s = part.slot, poly = (p) => p.map(([px, py]) => this.toModel(px, py));
    const shapes = this.shapes(part);
    const wheelTop = -l.gearH + l.wheelR * 2.15;
    if (s.body || s.body2) {
      return { tags: ['fuselage'], zRanges: [s.body, s.body2].filter(Boolean).map(([u0, u1]) => [l.L / 2 - u1 * l.L, l.L / 2 - u0 * l.L]) };
    }
    if (s.boxes) {
      return { cores: s.boxes.map(([u, x, w, h, y]) => ({ x: -x, z: l.L / 2 - u * l.L, y: (y === undefined ? -0.35 : y) * l.R, w, h, d: Math.min(1.6, Math.max(0.4, w * 0.6)) })) };
    }
    if (s.wing) return { tags: ['wing'], cut: shapes.map(poly) };
    if (s.centre) return { tags: ['wing', 'fairing'], cut: shapes.map(poly) };
    if (s.surf) return { tags: ['surf:' + s.surf] };
    if (s.tail) return { tags: ['tailplane'] };
    if (s.fin) return { tags: ['fin'], side: s.fin === 'L' ? 1 : -1 };
    if (s.engine || s.reverser) return { tags: ['nacelle'], cut: shapes.map((p) => poly(p).map(([x, z], i) => [x + (i === 0 || i === 3 ? 1 : -1) * 0.4, z])) };
    if (s.pylon) return { tags: ['pylon'] };
    if (s.gear === 'nose') return { tags: ['gearNose'], yMin: wheelTop };
    if (s.gear === 'L' || s.gear === 'R') return { tags: ['gearMain'], side: s.gear === 'L' ? 1 : -1, yMin: wheelTop };
    if (s.gear === 'wheels') return { tags: ['gearNose', 'gearMain'], yMax: wheelTop };
    if (s.gear === 'sponsons') return { tags: ['sponson'] };
    return {};
  },

  // the aeroplane's lines for the blueprint: the body, the wings, the tailplane, the fins, the nacelles
  outline() {
    this.init();
    if (this._outline) return this._outline;
    const l = this.lay, out = [];
    out.push(this.bodyPoly(0, 1));
    for (const sd of [1, -1]) {
      out.push(this.wingQuad(0, 1, 0, 1, sd), this.tailQuad(0, 1, 0, 1, sd), this.finRect(sd, 0, 1), this.sponson(sd));
    }
    const [, le] = this.toPlan(0, l.wingZ);
    out.push([[-l.R * 0.8, le], [l.R * 0.8, le], [l.R * 0.8, le + l.rootC], [-l.R * 0.8, le + l.rootC]]);
    for (let n = 1; n <= 6; n++) {
      const e = this.engineAt(n), [px] = this.toPlan(e.x, 0);
      out.push(this.rect(px, l.L / 2 - e.z, e.dia, e.len));
    }
    this._outline = out;
    return out;
  }
};
