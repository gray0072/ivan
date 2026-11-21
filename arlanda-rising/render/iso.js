'use strict';

// Arlanda Rising — the isometric view: world metres (x east, y north, z up) to the screen, 2:1 like city-builder,
// north to the upper right and the viewer in the south-east. The camera (pan, zoom at a point, screen ↔ world)
// and the drawing helpers every render/ file uses: polygons on the ground, boxes with lit and shaded walls,
// oriented boxes for vehicles, and "units" — the projected plane the canvas draws in before the zoom.
// Used by render/map.js and the files it calls, and by game.js (the camera, what a tap hit).

const ISO_K = 0.7071;      // units per metre along x + y
const ISO_Z = 0.82;        // units per metre of height

// a world point → units (before the camera)
function P(x, y, z) { return [(x + y) * ISO_K, (x - y) * ISO_K / 2 - (z || 0) * ISO_Z]; }
// units → the world point on the ground
function unP(ux, uy) { const s = ux / ISO_K, d = uy * 2 / ISO_K; return [(s + d) / 2, (s - d) / 2]; }
// depth: a larger value is nearer the viewer
function depthOf(x, y) { return x - y; }

const Cam = {
  x: 0, y: 0, zoom: 0.3, W: 1, H: 1, dpr: 1,
  toScreen(x, y, z) { const u = P(x, y, z); return [(u[0] - this.x) * this.zoom + this.W / 2, (u[1] - this.y) * this.zoom + this.H / 2]; },
  toWorld(sx, sy) { return unP((sx - this.W / 2) / this.zoom + this.x, (sy - this.H / 2) / this.zoom + this.y); },
  centerOn(x, y, zoom) { const u = P(x, y, 0); this.x = u[0]; this.y = u[1]; if (zoom) this.zoom = zoom; this.clamp(); },
  clamp() {
    const b = LAYOUT.bounds;
    this.zoom = clamp(this.zoom, ZOOM_MIN, ZOOM_MAX);
    this.x = clamp(this.x, (b.x0 + b.y0) * ISO_K, (b.x1 + b.y1) * ISO_K);
    this.y = clamp(this.y, (b.x0 - b.y1) * ISO_K / 2, (b.x1 - b.y0) * ISO_K / 2);
  },
  panBy(dx, dy) { this.x -= dx / this.zoom; this.y -= dy / this.zoom; this.clamp(); },
  zoomAt(f, sx, sy) {
    const ux = (sx - this.W / 2) / this.zoom + this.x, uy = (sy - this.H / 2) / this.zoom + this.y;
    this.zoom = clamp(this.zoom * f, ZOOM_MIN, ZOOM_MAX);
    this.x = ux - (sx - this.W / 2) / this.zoom;
    this.y = uy - (sy - this.H / 2) / this.zoom;
    this.clamp();
  },
  // the world rectangle (axis-aligned) that covers the screen, with a margin in metres
  view(margin) {
    const pts = [this.toWorld(0, 0), this.toWorld(this.W, 0), this.toWorld(0, this.H), this.toWorld(this.W, this.H)];
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), m = margin || 0;
    return { x0: Math.min(...xs) - m, x1: Math.max(...xs) + m, y0: Math.min(...ys) - m, y1: Math.max(...ys) + m };
  },
  // true when a world point (with a margin in screen px) is on the screen
  visible(x, y, z, m) { const s = this.toScreen(x, y, z); m = m || 0; return s[0] > -m && s[0] < this.W + m && s[1] > -m && s[1] < this.H + m; }
};

const Iso = {
  c: null,
  // the canvas draws in units (heights possible)
  units(c) { const k = Cam.dpr * Cam.zoom; c.setTransform(k, 0, 0, k, (Cam.W / 2 - Cam.x * Cam.zoom) * Cam.dpr, (Cam.H / 2 - Cam.y * Cam.zoom) * Cam.dpr); },
  // the canvas draws in world metres on the ground (z = 0): shapes, text and patterns lie flat
  ground(c) {
    const k = Cam.dpr * Cam.zoom;
    c.setTransform(k * ISO_K, k * ISO_K / 2, k * ISO_K, -k * ISO_K / 2, (Cam.W / 2 - Cam.x * Cam.zoom) * Cam.dpr, (Cam.H / 2 - Cam.y * Cam.zoom) * Cam.dpr);
  },
  // … at a height z
  groundAt(c, z) {
    const k = Cam.dpr * Cam.zoom;
    c.setTransform(k * ISO_K, k * ISO_K / 2, k * ISO_K, -k * ISO_K / 2, (Cam.W / 2 - Cam.x * Cam.zoom) * Cam.dpr, (Cam.H / 2 - Cam.y * Cam.zoom - z * ISO_Z * Cam.zoom) * Cam.dpr);
  },
  screen(c) { c.setTransform(Cam.dpr, 0, 0, Cam.dpr, 0, 0); },
  // a polygon of world points, in units (call units() first)
  poly(c, pts, fill, z) {
    c.beginPath();
    pts.forEach((p, i) => { const u = P(p[0], p[1], p[2] !== undefined ? p[2] : (z || 0)); if (i) c.lineTo(u[0], u[1]); else c.moveTo(u[0], u[1]); });
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
  },
  // an axis-aligned box: the top and the two walls the viewer sees (south lit, east in shade)
  box(c, x0, y0, x1, y1, z0, z1, color, top) {
    this.poly(c, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], shade(color, 0.08));
    this.poly(c, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], shade(color, -0.2));
    this.poly(c, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], top || shade(color, 0.22));
  },
  // windows in a row on the south wall (y = y0) and the east wall (x = x1)
  winSouth(c, x0, x1, y, z0, z1, n, fill) {
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) this.poly(c, [[x0 + w * (i + 0.18), y - 0.05, z0], [x0 + w * (i + 0.82), y - 0.05, z0], [x0 + w * (i + 0.82), y - 0.05, z1], [x0 + w * (i + 0.18), y - 0.05, z1]], fill);
  },
  winEast(c, y0, y1, x, z0, z1, n, fill) {
    const w = (y1 - y0) / n;
    for (let i = 0; i < n; i++) this.poly(c, [[x + 0.05, y0 + w * (i + 0.18), z0], [x + 0.05, y0 + w * (i + 0.82), z0], [x + 0.05, y0 + w * (i + 0.82), z1], [x + 0.05, y0 + w * (i + 0.18), z1]], fill);
  },
  // a gable roof over x0..x1, y0..y1 at z, its ridge along x (east–west) or y
  gable(c, x0, y0, x1, y1, z, rise, roof, alongX) {
    if (alongX) {
      const ym = (y0 + y1) / 2;
      this.poly(c, [[x0, y1, z], [x1, y1, z], [x1, ym, z + rise], [x0, ym, z + rise]], shade(roof, -0.15));
      this.poly(c, [[x0, y0, z], [x1, y0, z], [x1, ym, z + rise], [x0, ym, z + rise]], shade(roof, 0.1));
      this.poly(c, [[x1, y0, z], [x1, y1, z], [x1, ym, z + rise]], shade(roof, -0.3));
    } else {
      const xm = (x0 + x1) / 2;
      this.poly(c, [[x0, y0, z], [x0, y1, z], [xm, y1, z + rise], [xm, y0, z + rise]], shade(roof, 0.1));
      this.poly(c, [[x1, y0, z], [x1, y1, z], [xm, y1, z + rise], [xm, y0, z + rise]], shade(roof, -0.15));
      this.poly(c, [[x0, y0, z], [x1, y0, z], [xm, y0, z + rise]], shade(roof, -0.05));
    }
  },
  // a box turned to a heading (° from north): a vehicle, a stair truck. len along the heading, wid across
  obox(c, cx, cy, len, wid, z0, z1, hdg, color, top) {
    const h = hdg * Math.PI / 180, fx = Math.sin(h), fy = Math.cos(h), rx = Math.cos(h), ry = -Math.sin(h);
    const corner = (a, b) => [cx + fx * a * len / 2 + rx * b * wid / 2, cy + fy * a * len / 2 + ry * b * wid / 2];
    const q = [corner(1, -1), corner(1, 1), corner(-1, 1), corner(-1, -1)];
    for (let i = 0; i < 4; i++) {
      const a = q[i], b = q[(i + 1) % 4];
      const nx = a[1] - b[1], ny = b[0] - a[0];     // the outward normal of a clockwise ring
      if (nx - ny <= 0) continue;                   // a wall facing away from the viewer
      this.poly(c, [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]], shade(color, nx > -ny ? -0.18 : 0.05));
    }
    this.poly(c, q.map((p) => [p[0], p[1], z1]), top || shade(color, 0.2));
  },
  // a soft round shadow on the ground
  shadow(c, x, y, rx, ry, a) {
    const u = P(x, y, 0);
    c.fillStyle = 'rgba(0,0,0,' + (a || 0.22) + ')';
    c.beginPath(); c.ellipse(u[0], u[1], rx * ISO_K * 1.2, ry * ISO_K * 0.6, 0, 0, Math.PI * 2); c.fill();
  }
};

// geometry helpers on world points
function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function distToSeg(x, y, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? clamp(((x - a[0]) * dx + (y - a[1]) * dy) / l2, 0, 1) : 0;
  return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t);
}
function polyLength(pts) { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; }
// the point and heading at a distance along a polyline
function alongPoly(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= l || i === pts.length - 1) {
      const t = l ? clamp(d / l, 0, 1) : 0;
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, hdg: Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI };
    }
    d -= l;
  }
  const p = pts[pts.length - 1];
  return { x: p[0], y: p[1], hdg: 0 };
}
// the first part of a polyline, up to a share of its length
function polyPart(pts, share) {
  const total = polyLength(pts) * clamp(share, 0, 1), out = [pts[0]];
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d + l >= total) { const t = l ? (total - d) / l : 0; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); return out; }
    out.push(b); d += l;
  }
  return out;
}
