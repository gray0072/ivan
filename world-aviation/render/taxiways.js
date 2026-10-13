'use strict';

// ============================================================
// World Aviation — the taxiways as plain geometry
//
// What lies on the ground of an airport's taxi network, worked out from the taxi graph
// (World.buildNetwork) and its curves (World.buildFillets) as plain [t, across] points in
// runway-local metres — no three.js, no canvas. Used by render/airport3d.js (the paved
// shapes in the ground texture, the yellow lines as strips, the taxiway lights) and by
// tools/taxiways.html, which draws just this to check it.
//
// The pavement is a union of simple pieces:
//   rect  each straight taxiway or connector from node to node, its full width;
//   band  each curve where two lines meet (a fillet): the ring between the radii R - w/2 and
//         R + w/2 round the curve's centre, over the curve's angle — so both its edges are
//         arcs, concentric with the centreline's;
//   web   at a junction (where the straight pieces run on to the node) the corner between the
//         two lines' inner edges and the curve's inner edge, paved too.
// At a plain corner (two lines meet off the runway, nothing else) the straight pieces stop
// where the curve takes over, so the outside of the turn is the band's outer arc; elsewhere
// they run to the node, so the mouth of a junction is paved straight across.
//
// The yellow edge lines run TWY_EDGE_IN inside the pavement's outer edge: the sides of every
// rect, the inner arc of every band and the outer arc of a corner's, a dead end across its end
// — each cut where it falls on other pavement (another piece, the runway and its shoulders, the
// apron, a hangar pad), so the lines stop exactly where the pavement goes on. The centrelines: the straight lines from node
// to node, each stopping where the curves leave it when the curves are its only ways on there,
// and the curves' arcs — finely sampled, meeting the straight lines exactly at their tangent
// points, so they join without a step.
//
// The lights (a plan by the airport's size, TAXI_LIGHTS): green centreline lights at the big
// and medium airports, closer round the curves and near them, green and yellow by turns where a
// line leads off the runway; blue edge lights at every airport just outside the edge lines,
// closer round the curves, and along the apron's edge towards the taxiways.
// ============================================================

const TWY_EDGE_IN = 0.55;               // the edge line's middle, inside the pavement's edge, metres
const TWY_EDGE_W = 0.45;                // the edge line's width
const TWY_CL_W = 0.45;                  // the centreline's (wider than the real 0.15 m, to read from the cockpit)
const TWY_LEADIN_PAST_M = 12;           // a stand's lead-in line goes on this far past the stand point
const TWY_SHOULDER = 7.5;               // the gravel shoulder beyond the pavement's edge
const TWY_ARC_STEP_M = 1.5;             // the curves are sampled every this many metres ...
const TWY_ARC_STEP_DEG = 3;             // ... or degrees, whichever is finer
// The taxiway lights by the airport's size (a remote strip: as tiny): metres between the
// centreline lights on a straight line (0: none, edge lights only, as at a regional airport) and
// between the edge lights on a straight edge. The apron lane gets centreline lights where the
// taxiways have them.
const TAXI_LIGHTS = {
  big: { centre: 15, edge: 50 },
  medium: { centre: 30, edge: 60 },
  small: { centre: 0, edge: 60 },
  tiny: { centre: 0, edge: 60 }
};
const TAXI_LIGHT_CURVE_M = 7.5;         // centreline lights round a curve ...
const TAXI_LIGHT_NEAR_CURVE = [60, 15]; // ... and within 60 m of one, at most 15 m apart
const TAXI_LIGHT_EDGE_CURVE = [0.2, 5, 15]; // edge lights round a curve: this share of its radius apart, kept within [5, 15] m
const TAXI_LIGHT_OUT = 1.0;             // edge lights this far outside the edge line (0.45 m off the pavement)

const Taxiways = {
  // the plan of airport a, worked out once
  plan(a) {
    if (!a.taxiPlan) a.taxiPlan = this.build(a);
    return a.taxiPlan;
  },

  // How far from node n the straight pavement towards node m stops: at a plain corner (off the
  // runway, only these two lines meet, with a curve between them) where the curve takes over,
  // else 0 (it runs to the node).
  cornerTrim(a, n, m) {
    if (n.kind === 'exit' || n.kind === 'lineup' || n.edges.length !== 2) return 0;
    const other = n.edges.find((e) => e.to !== m);
    const f = other ? World.filletAt(a, n, m, other.to) : null;
    return f && !f.apron ? f.d : 0;
  },

  // How far from node n the centreline towards node m stops: where the curves leave it, when
  // they are its only ways on there (World.trimCurve), else 0 (it runs to the node).
  lineTrim(a, n, m) {
    const f = World.trimCurve(a, n, m);
    return f ? f.d : 0;
  },

  build(a) {
    const L = LAYOUT, IN = TWY_EDGE_IN, M = IN + 0.04;
    const pieces = [];
    const unit = (p, q) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
    const pairs = (kinds) => {
      const out = [], seen = {};
      for (const n of a.nodeList) for (const e of n.edges) {
        if (kinds.indexOf(e.kind) < 0) continue;
        const key = n.id < e.to.id ? n.id + '|' + e.to.id : e.to.id + '|' + n.id;
        if (seen[key]) continue;
        seen[key] = 1;
        out.push({ n, m: e.to, e });
      }
      return out;
    };

    // ---- the pieces of pavement
    for (const { n, m, e } of pairs(['taxi', 'connector'])) {
      const o = [n.t, n.across], len = Math.hypot(m.t - n.t, m.across - n.across);
      if (len < 1) continue;
      const u = unit(o, [m.t, m.across]), r = e.width / 2;
      const dead0 = n.edges.length === 1, dead1 = m.edges.length === 1;
      const s0 = this.cornerTrim(a, n, m) - (dead0 ? r : 0), s1 = len - this.cornerTrim(a, m, n) + (dead1 ? r : 0);
      if (s1 - s0 < 0.1) continue;
      pieces.push({ type: 'rect', o, u, p: [-u[1], u[0]], r, s0, s1, dead0, dead1 });
    }
    for (const f of a.fillets || []) {
      if (f.apron) continue;
      const r = f.w / 2, n = f.node;
      // (at a plain corner its outer arc is the outside of the turn; at a junction it lies on the
      // straight pieces and the web, only touching the far edge of the line it leaves: no edge)
      const corner = this.cornerTrim(a, n, f.ends[0]) > 0;
      pieces.push({ type: 'band', c: f.c, R: f.R, r, a1: f.a1, da: f.da, corner });
      if (corner) continue;
      // the web: the corner between the inner edges, out to the curve's inner arc
      const o = [n.t, n.across];
      const u = unit(o, [f.ends[0].t, f.ends[0].across]), v = unit(o, [f.ends[1].t, f.ends[1].across]);
      const ang = Math.acos(clamp(u[0] * v[0] + u[1] * v[1], -1, 1));
      const bl = Math.hypot(u[0] + v[0], u[1] + v[1]) || 1, bis = [(u[0] + v[0]) / bl, (u[1] + v[1]) / bl];
      const side = (w, x) => { const p = [-w[1], w[0]]; return p[0] * x[0] + p[1] * x[1] > 0 ? p : [-p[0], -p[1]]; };
      const n1 = side(u, bis), n2 = side(v, bis);
      // its outline with the edges moved out by e (e < 0: in), the inner arc's radius less e
      const poly = (e) => {
        const k = (r + e) / Math.sin(ang / 2);
        const out = [[o[0] + bis[0] * k, o[1] + bis[1] * k]];
        for (const q of arcPts(f.c, Math.max(0, f.R - r - e), f.a1, f.da)) out.push(q);
        return out;
      };
      // (for the edge lines' test, reaching IN + 0.1 into the straight pieces, so their edge lines
      // inside the corner are cut too)
      const s = IN + 0.1, k = (r - s) / Math.sin(ang / 2);
      const t1 = [o[0] + u[0] * f.d + n1[0] * (r - s), o[1] + u[1] * f.d + n1[1] * (r - s)];
      const t2 = [o[0] + v[0] * f.d + n2[0] * (r - s), o[1] + v[1] * f.d + n2[1] * (r - s)];
      const test = [[o[0] + bis[0] * k, o[1] + bis[1] * k], t1].concat(arcPts(f.c, f.R - r, f.a1, f.da), [t2]);
      pieces.push({ type: 'web', poly, test, c: f.c, rin: f.R - r });
    }

    // each piece's bounding box, 1 m round (the quick test first; a web's test outline reaches
    // into the straight pieces), and the pieces by the CELL-metre cells their boxes touch
    const CELL = 50, cells = new Map(), key = (i, j) => i * 100003 + j;
    for (const pc of pieces) {
      const pts = Taxiways.pavement({ pieces: [pc] }, 0)[0];
      pc.box = [Infinity, -Infinity, Infinity, -Infinity];
      for (const q of pts) { pc.box[0] = Math.min(pc.box[0], q[0] - 1); pc.box[1] = Math.max(pc.box[1], q[0] + 1); pc.box[2] = Math.min(pc.box[2], q[1] - 1); pc.box[3] = Math.max(pc.box[3], q[1] + 1); }
      for (let i = Math.floor(pc.box[0] / CELL); i <= Math.floor(pc.box[1] / CELL); i++) {
        for (let j = Math.floor(pc.box[2] / CELL); j <= Math.floor(pc.box[3] / CELL); j++) {
          const k = key(i, j);
          if (!cells.has(k)) cells.set(k, []);
          cells.get(k).push(pc);
        }
      }
    }
    const near = (q) => cells.get(key(Math.floor(q[0] / CELL), Math.floor(q[1] / CELL))) || [];

    // the fixed paved areas the edge lines stop at: the runway with its shoulders and blast pads
    // (RWY_SHOULDER, RWY_BLAST in airport3d.js, not loaded by the headless check), the apron,
    // the hangars' pads
    const ap = a.apronRect;
    const rects = [
      [-a.half - 60, a.half + 60, -RWY_HALF_WIDTH - 7.5, RWY_HALF_WIDTH + 7.5],
      [ap.t0, ap.t1, ap.a0, ap.a1]
    ];
    for (const b of a.buildings || []) {
      if (b.kind !== 'hangar' && b.kind !== 'fuel') continue;
      rects.push([b.t - b.along / 2 - 6, b.t + b.along / 2 + 6, L.TWY_OFFSET + 40, b.across - b.acrossSize / 2]);
      rects.push([b.t - 12, b.t + 12, L.TWY_OFFSET, L.TWY_OFFSET + 40]);
    }
    // is the point on pavement, at least M inside its outer edges (other than piece `self`)?
    const covered = (q, self) => {
      for (const b of rects) if (q[0] > b[0] && q[0] < b[1] && q[1] > b[2] && q[1] < b[3]) return true;
      for (const pc of near(q)) if (pc !== self && inside(pc, q, M)) return true;
      return false;
    };

    // ---- the edge lines: each candidate as dense points with its outward normal, cut where covered
    const edges = [];
    const cut = (pts, nrm, self, R) => {
      const keep = pts.map((q) => !covered(q, self));
      const at = (i, j) => {                // between kept i and cut j: where the other pavement starts
        let lo = 0, hi = 1;
        for (let k = 0; k < 12; k++) { const h = (lo + hi) / 2; if (covered(mix(pts[i], pts[j], h), self)) hi = h; else lo = h; }
        return [mix(pts[i], pts[j], lo), mixN(nrm[i], nrm[j], lo)];
      };
      for (let i = 0; i < pts.length; i++) {
        if (!keep[i]) continue;
        let j = i;
        while (j + 1 < pts.length && keep[j + 1]) j++;
        const run = pts.slice(i, j + 1), rn = nrm.slice(i, j + 1);
        if (i > 0) { const [q, nq] = at(i, i - 1); run.unshift(q); rn.unshift(nq); }
        if (j + 1 < pts.length) { const [q, nq] = at(j, j + 1); run.push(q); rn.push(nq); }
        if (polyLen(run) > 0.3) edges.push({ pts: run, nrm: rn, R });
        i = j;
      }
    };
    for (const pc of pieces) {
      if (pc.type === 'rect') {
        const len = pc.s1 - pc.s0, n = Math.max(1, Math.ceil(len / 2));
        for (const sd of [-1, 1]) {
          const off = (pc.r - IN) * sd, pts = [], nrm = [];
          for (let i = 0; i <= n; i++) {
            const s = pc.s0 + len * i / n;
            pts.push([pc.o[0] + pc.u[0] * s + pc.p[0] * off, pc.o[1] + pc.u[1] * s + pc.p[1] * off]);
            nrm.push([pc.p[0] * sd, pc.p[1] * sd]);
          }
          cut(pts, nrm, pc, Infinity);
        }
        // a dead end: across its end
        for (const [dead, s, dir] of [[pc.dead0, pc.s0 + IN, -1], [pc.dead1, pc.s1 - IN, 1]]) {
          if (!dead) continue;
          const pts = [], nrm = [];
          for (let i = 0; i <= 8; i++) {
            const off = (pc.r - IN) * (i / 4 - 1);
            pts.push([pc.o[0] + pc.u[0] * s + pc.p[0] * off, pc.o[1] + pc.u[1] * s + pc.p[1] * off]);
            nrm.push([pc.u[0] * dir, pc.u[1] * dir]);
          }
          cut(pts, nrm, pc, Infinity);
        }
      } else if (pc.type === 'band') {
        for (const [rad, out] of [[pc.R - pc.r + IN, -1], [pc.R + pc.r - IN, 1]]) {
          if (rad < 1 || (out > 0 && !pc.corner)) continue;
          const pts = arcPts(pc.c, rad, pc.a1, pc.da);
          cut(pts, pts.map((q) => { const v = unit(pc.c, q); return [v[0] * out, v[1] * out]; }), pc, rad);
        }
      }
    }

    // ---- the centrelines: straight lines between the trims, and the curves
    const lines = [];
    const runway = (x) => x.kind === 'exit' || x.kind === 'lineup';
    for (const pr of pairs(['taxi', 'connector', 'apron', 'stand'])) {
      // (a stand's lead-in from the apron lane, on past the stand to where the nose stops)
      const stand = pr.e.kind === 'stand';
      const [n, m] = stand && pr.n.kind === 'gate' ? [pr.m, pr.n] : [pr.n, pr.m];
      const len = Math.hypot(m.t - n.t, m.across - n.across);
      if (len < 1) continue;
      const u = unit([n.t, n.across], [m.t, m.across]);
      const d0 = this.lineTrim(a, n, m), d1 = stand ? -TWY_LEADIN_PAST_M : this.lineTrim(a, m, n);
      if (d0 + d1 >= len - 0.05) continue;
      const pts = [[n.t + u[0] * d0, n.across + u[1] * d0], [m.t - u[0] * d1, m.across - u[1] * d1]];
      lines.push({ pts, kind: pr.e.kind, curve: false, trims: [d0 > 0, d1 > 0], fromRunway: runway(n) ? 0 : runway(m) ? 1 : -1 });
    }
    for (const f of a.fillets || []) {
      const fromRunway = f.node.kind === 'exit' || f.node.kind === 'lineup';
      lines.push({ pts: arcPts(f.c, f.R, f.a1, f.da), kind: f.apron ? 'apron' : 'taxi', curve: true, R: f.R, fromRunway: fromRunway ? 0 : -1, f });
    }

    const plan = { pieces, edges, lines, rects };
    plan.lights = this.lights(a, plan);
    return plan;
  },

  // The paved shapes as polygons (grown by e metres: the shoulders), for the ground texture; all
  // turning the same way, so filled as one path (non-zero) they make one union, without seams
  pavement(plan, e) {
    const out = [];
    for (const pc of plan.pieces) {
      if (pc.type === 'rect') {
        const s0 = pc.s0 - (pc.dead0 ? e : 0), s1 = pc.s1 + (pc.dead1 ? e : 0), w = pc.r + e;
        const at = (s, off) => [pc.o[0] + pc.u[0] * s + pc.p[0] * off, pc.o[1] + pc.u[1] * s + pc.p[1] * off];
        out.push([at(s0, -w), at(s1, -w), at(s1, w), at(s0, w)]);
      } else if (pc.type === 'band') {
        const outer = arcPts(pc.c, pc.R + pc.r + e, pc.a1, pc.da);
        const inner = arcPts(pc.c, Math.max(0, pc.R - pc.r - e), pc.a1, pc.da).reverse();
        out.push(outer.concat(inner));
      } else out.push(pc.poly(e));
    }
    for (const pts of out) {
      let s = 0;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += (pts[j][0] - pts[i][0]) * (pts[j][1] + pts[i][1]);
      if (s < 0) pts.reverse();
    }
    return out;
  },

  // ---- the lights: [{ t, across, c: 'green' | 'yellow' | 'blue' }]
  lights(a, plan) {
    const L = LAYOUT;
    const cfg = TAXI_LIGHTS[a.remote ? 'tiny' : a.terminal] || TAXI_LIGHTS.small;
    const out = [];
    // (no two lights of a kind closer than `gap`: where the pieces meet both put one)
    const grid = new Map();
    const put = (q, c, gap) => {
      const gx = Math.floor(q[0] / 4), gy = Math.floor(q[1] / 4);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        for (const o of grid.get((gx + i) * 100003 + gy + j) || []) {
          if ((o.c === 'blue') === (c === 'blue') && Math.hypot(o.t - q[0], o.across - q[1]) < gap) return;
        }
      }
      const l = { t: q[0], across: q[1], c };
      const k = gx * 100003 + gy;
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(l);
      out.push(l);
    };

    // the centreline lights
    if (cfg.centre) {
      const [near, nearGap] = TAXI_LIGHT_NEAR_CURVE;
      for (const ln of plan.lines) {
        // (not the stands' lead-ins, nor the curves into them)
        if (ln.kind === 'stand' || (ln.f && ln.f.ends.some((x) => x.kind === 'gate'))) continue;
        let spots;
        if (ln.curve) spots = spread(ln.pts, TAXI_LIGHT_CURVE_M);
        else {
          // a straight line: closer within `near` of a curve at either end
          const len = polyLen(ln.pts), gap = Math.min(cfg.centre, nearGap);
          const z0 = ln.trims[0] ? Math.min(near, len / 2) : 0, z1 = ln.trims[1] ? Math.min(near, len / 2) : 0;
          const at = (s) => mix(ln.pts[0], ln.pts[1], s / (len || 1));
          spots = [];
          if (z0 > 0) spots.push(...spread([at(0), at(z0)], gap));
          if (len - z0 - z1 > 0.5) spots.push(...spread([at(z0), at(len - z1)], cfg.centre));
          if (z1 > 0) spots.push(...spread([at(len - z1), at(len)], gap));
        }
        // off the runway: green and yellow by turns out to the holding position's distance; on
        // the runway itself only the lead-off line of a curve
        let k = 0;
        for (const q of ln.fromRunway === 1 ? spots.slice().reverse() : spots) {
          const ac = Math.abs(q[1]);
          if (ac < RWY_HALF_WIDTH + 3 && !(ln.curve && ln.fromRunway === 0)) continue;
          const lead = ln.fromRunway >= 0 && ac < L.HOLD_OFFSET;
          put(q, lead && k++ % 2 ? 'yellow' : 'green', 2.5);
        }
      }
    }

    // the edge lights, just outside the edge lines
    const [share, lo, hi] = TAXI_LIGHT_EDGE_CURVE;
    for (const ed of plan.edges) {
      const gap = ed.R === Infinity ? cfg.edge : clamp(ed.R * share, lo, hi);
      for (const q of spread(ed.pts, gap, ed.nrm)) put([q[0] + q[2][0] * TAXI_LIGHT_OUT, q[1] + q[2][1] * TAXI_LIGHT_OUT], 'blue', Math.min(gap * 0.5, 4));
    }
    // and along the apron's edge towards the taxiways, but where a lane comes in
    const r = a.apronRect, ac = r.a0 - TAXI_LIGHT_OUT, n = Math.ceil((r.t1 - r.t0) / (cfg.edge / 2));
    for (let i = 0; i <= n; i++) {
      const q = [r.t0 + (r.t1 - r.t0) * i / n, ac];
      if (!plan.pieces.some((pc) => inside(pc, q, -2))) put(q, 'blue', 4);
    }
    return out;
  }
};

// ---- helpers (plain geometry)

// points along an arc round c of radius rad, from angle a1 through da
function arcPts(c, rad, a1, da) {
  const step = Math.min(TWY_ARC_STEP_DEG * DEG, TWY_ARC_STEP_M / Math.max(rad, 1));
  const n = Math.max(2, Math.ceil(Math.abs(da) / step));
  const out = [];
  for (let k = 0; k <= n; k++) { const q = a1 + da * k / n; out.push([c[0] + Math.cos(q) * rad, c[1] + Math.sin(q) * rad]); }
  return out;
}

const mix = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
const mixN = (p, q, k) => { const v = mix(p, q, k), l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

function polyLen(pts) {
  let s = 0;
  for (let i = 0; i + 1 < pts.length; i++) s += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  return s;
}

// points spread evenly along a polyline, both ends included, at most `gap` apart: [t, across]
// (with the normal interpolated from nrm, when given, as a third element)
function spread(pts, gap, nrm) {
  const len = polyLen(pts), n = Math.max(1, Math.ceil(len / gap - 1e-6)), out = [];
  let i = 0, base = 0;
  for (let k = 0; k <= n; k++) {
    const s = len * k / n;
    while (i + 2 < pts.length && base + Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) < s) {
      base += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); i++;
    }
    const sl = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) || 1;
    const h = clamp((s - base) / sl, 0, 1), q = mix(pts[i], pts[i + 1], h);
    if (nrm) q.push(mixN(nrm[i], nrm[i + 1], h));
    out.push(q);
  }
  return out;
}

// is point q inside the piece, at least m inside its outer edges (m < 0: up to -m outside)?
// The ends where a piece meets the next (a rect's ends, a band's) are not edges: inside, no
// margin there (outside, the margin all round).
function inside(pc, q, m) {
  const b = pc.box, g = Math.min(m, 0);
  if (b && (q[0] < b[0] + g || q[0] > b[1] - g || q[1] < b[2] + g || q[1] > b[3] - g)) return false;
  if (pc.type === 'rect') {
    const dx = q[0] - pc.o[0], dy = q[1] - pc.o[1];
    const s = dx * pc.u[0] + dy * pc.u[1], off = dx * pc.p[0] + dy * pc.p[1];
    return s > pc.s0 + (pc.dead0 || m < 0 ? m : 0) && s < pc.s1 - (pc.dead1 || m < 0 ? m : 0) && Math.abs(off) < pc.r - m;
  }
    const d = Math.hypot(q[0] - pc.c[0], q[1] - pc.c[1]);
  if (pc.type === 'band') {
    if (d <= pc.R - pc.r + m || d >= pc.R + pc.r - m) return false;
    let x = (Math.atan2(q[1] - pc.c[1], q[0] - pc.c[0]) - pc.a1) * Math.sign(pc.da);
    x = ((x % TAU) + TAU) % TAU;
    const grow = m < 0 ? -m / Math.max(d, 1) : 0;
    return x <= Math.abs(pc.da) + grow || x >= TAU - grow;
  }
  // the web: inside its test outline, clear of the inner arc
  return d > pc.rin + m && inPoly(pc.test, q);
}

function inPoly(poly, q) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
