'use strict';

// ============================================================
// World Aviation — the globe of the expedition round the world: an
// orthographic globe (the Earth seen from far off) of the coastlines
// of data/geodata.js, a faint graticule, the airports as points and
// a route as great-circle arcs — the legs flown solid gold, the next
// one pulsing with a small aeroplane on it, the rest dashed, a leg
// that breaks the rules red. Drawn into a 2D canvas by the screen
// (ui/rtw.js: turned by a drag, an airport picked by a tap) and, once
// per route, into an image for the cards (url).
// ============================================================

const GLOBE_COL = {
  sea0: '#1d4a72', sea1: '#0b1c30', land: '#3b5a48', landEdge: 'rgba(200, 235, 210, 0.35)', lake: '#163a5c',
  grid: 'rgba(170, 210, 245, 0.13)', rim: 'rgba(120, 190, 255, 0.55)', gold: '#f1c75b', goldDim: 'rgba(241, 199, 91, 0.55)',
  rest: 'rgba(225, 236, 248, 0.75)', bad: '#ff6a5a', apt: 'rgba(200, 220, 240, 0.55)', next: '#5fe0c8', home: '#ffffff'
};

const Globe = {
  cache: {},

  // a point (degrees) on the unit sphere turned to the view (lat0, lon0 in the middle): x right,
  // y up, z towards the eye (z > 0: on the side seen)
  turn(lat, lon, v) {
    const p = lat * DEG, l = (lon - v.lon0) * DEG, p0 = v.lat0 * DEG;
    const cp = Math.cos(p), sp = Math.sin(p), c0 = Math.cos(p0), s0 = Math.sin(p0), cl = Math.cos(l);
    return { x: cp * Math.sin(l), y: c0 * sp - s0 * cp * cl, z: s0 * sp + c0 * cp * cl };
  },
  // the points of the great circle between two airports (unit vectors in the Earth's frame)
  arc(a, b, step) {
    const va = geoVec(a.lat, a.lon), vb = geoVec(b.lat, b.lon);
    const om = Math.acos(clamp(va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2], -1, 1));
    const n = Math.max(2, Math.ceil(om / ((step || 2) * DEG)));
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, s = Math.sin(om) || 1;
      const ka = om ? Math.sin((1 - t) * om) / s : 1 - t, kb = om ? Math.sin(t * om) / s : t;
      const x = ka * va[0] + kb * vb[0], y = ka * va[1] + kb * vb[1], z = ka * va[2] + kb * vb[2];
      out.push([Math.asin(clamp(z, -1, 1)) * RAD, Math.atan2(y, x) * RAD]);
    }
    return out;
  },

  // Draw the globe filling a w x h canvas. v: { lat0, lon0 } (the middle of the view). o:
  //   plan    the stops' codes (a route), flown  how many of its legs are flown
  //   bad     the legs (by index) that break the rules, drawn red
  //   pulse   0..1: where the small aeroplane is on the next leg (none without it)
  //   apts    airports to show as faint points, next  airports to show as the stops that may come
  //   labels  the plan's codes beside its stops
  // Returns the visible airports' places on the canvas ({ a, x, y }), for picking one.
  draw(g, w, h, v, o) {
    o = o || {};
    // (room round it for the halo, and for the codes beside the stops near its rim)
    const R = Math.min(w, h) / 2 - Math.max(4, Math.min(w, h) * (o.labels ? 0.08 : 0.03)), cx = w / 2, cy = h / 2;
    const P = (lat, lon) => { const q = this.turn(lat, lon, v); return { x: cx + q.x * R, y: cy - q.y * R, z: q.z }; };
    g.clearRect(0, 0, w, h);
    // the halo and the sea, lit from the upper left
    const halo = g.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.09);
    halo.addColorStop(0, 'rgba(90, 170, 255, 0.35)'); halo.addColorStop(1, 'rgba(90, 170, 255, 0)');
    g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, R * 1.09, 0, TAU); g.fill();
    const sea = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    sea.addColorStop(0, GLOBE_COL.sea0); sea.addColorStop(1, GLOBE_COL.sea1);
    g.fillStyle = sea; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    // the graticule every 30°
    g.strokeStyle = GLOBE_COL.grid; g.lineWidth = 1;
    const line = (pts) => {
      g.beginPath();
      let pen = false;
      for (const [lat, lon] of pts) {
        const q = P(lat, lon);
        if (q.z < 0) { pen = false; continue; }
        if (pen) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y);
        pen = true;
      }
      g.stroke();
    };
    for (let lon = -180; lon < 180; lon += 30) { const pts = []; for (let lat = -84; lat <= 84; lat += 3) pts.push([lat, lon]); line(pts); }
    for (let lat = -60; lat <= 60; lat += 30) { const pts = []; for (let lon = -180; lon <= 180; lon += 3) pts.push([lat, lon]); line(pts); }
    // the land: a ring's points behind the globe pushed out to its rim, which closes the shapes
    // that run over it; the lakes cut out of it
    const ring = (poly) => {
      let front = false;
      const pts = poly.map((p) => {
        const q = this.turn(p[1], p[0], v);
        if (q.z >= 0) { front = true; return [cx + q.x * R, cy - q.y * R]; }
        const k = 1 / (Math.hypot(q.x, q.y) || 1);
        return [cx + q.x * k * R, cy - q.y * k * R];
      });
      if (!front) return false;
      g.beginPath();
      pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.closePath();
      return true;
    };
    g.lineJoin = 'round';
    for (const poly of LAND_POLYGONS) {
      if (!ring(poly)) continue;
      g.fillStyle = GLOBE_COL.land; g.fill();
      g.strokeStyle = GLOBE_COL.landEdge; g.lineWidth = Math.max(0.6, R / 260); g.stroke();
    }
    g.fillStyle = GLOBE_COL.lake;
    for (const poly of WATER_POLYGONS) if (ring(poly)) g.fill();
    // the night side's shade over the rim, the sheen of the sun
    const shade = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.2, cx, cy, R * 1.02);
    shade.addColorStop(0, 'rgba(255, 255, 255, 0.07)'); shade.addColorStop(0.7, 'rgba(0, 0, 0, 0)'); shade.addColorStop(1, 'rgba(0, 8, 20, 0.45)');
    g.fillStyle = shade; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.restore();
    g.strokeStyle = GLOBE_COL.rim; g.lineWidth = 1.2;
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();

    // the airports: faint points, the stops that may come next lit
    const places = [];
    const dot = (a, r, col) => {
      const q = P(a.lat, a.lon);
      if (q.z < 0.02) return null;
      g.fillStyle = col; g.beginPath(); g.arc(q.x, q.y, r, 0, TAU); g.fill();
      return q;
    };
    const ar = Math.max(1.6, R / 150);
    for (const a of o.apts || []) { const q = dot(a, ar, GLOBE_COL.apt); if (q) places.push({ a, x: q.x, y: q.y }); }
    for (const a of o.next || []) {
      const q = dot(a, ar * 1.8, GLOBE_COL.next);
      if (q) { g.strokeStyle = 'rgba(95, 224, 200, 0.45)'; g.lineWidth = 1; g.beginPath(); g.arc(q.x, q.y, ar * 3.2, 0, TAU); g.stroke(); }
    }

    // the route
    const plan = (o.plan || []).map((id) => World.byId[id]).filter(Boolean);
    const flown = o.flown || 0, bad = o.bad || [];
    const lw = Math.max(1.6, R / 90);
    for (let i = 1; i < plan.length; i++) {
      const pts = this.arc(plan[i - 1], plan[i]);
      const k = i - 1;
      const isBad = bad.indexOf(k) >= 0, done = k < flown, next = k === flown && o.pulse !== undefined;
      g.lineCap = 'round';
      g.setLineDash(done || next || isBad ? [] : [lw * 2.2, lw * 2.2]);
      g.lineWidth = done || next ? lw * 1.2 : lw;
      g.strokeStyle = isBad ? GLOBE_COL.bad : done ? GLOBE_COL.gold : next ? 'rgba(241, 199, 91, ' + (0.55 + 0.45 * Math.sin(o.pulse * TAU)) + ')' : GLOBE_COL.rest;
      if (done || next) { g.shadowColor = 'rgba(241, 199, 91, 0.7)'; g.shadowBlur = lw * 3; }
      line(pts);
      g.shadowBlur = 0;
      if (next) this.plane(g, pts, o.pulse, P, lw);
    }
    g.setLineDash([]);
    // its stops, the home base ringed, and their codes
    plan.forEach((a, i) => {
      const q = P(a.lat, a.lon);
      if (q.z < 0.02) return;
      const home = a.id === Career.data.base, reached = i <= flown;
      g.fillStyle = reached ? GLOBE_COL.gold : GLOBE_COL.rest;
      g.beginPath(); g.arc(q.x, q.y, lw * 1.25, 0, TAU); g.fill();
      if (home) { g.strokeStyle = GLOBE_COL.home; g.lineWidth = 1.5; g.beginPath(); g.arc(q.x, q.y, lw * 2.6, 0, TAU); g.stroke(); }
      if (o.labels && (i < plan.length - 1 || plan.length === 1)) {
        g.font = '700 ' + Math.max(10, Math.round(R / 17)) + 'px system-ui, sans-serif';
        g.textBaseline = 'middle';
        g.lineWidth = 3; g.strokeStyle = 'rgba(5, 12, 22, 0.8)';
        g.strokeText(a.id, q.x + lw * 2.4, q.y - lw * 1.6);
        g.fillStyle = reached ? '#ffe7a6' : '#e6eef7';
        g.fillText(a.id, q.x + lw * 2.4, q.y - lw * 1.6);
      }
    });
    return places;
  },

  // the small aeroplane at t (0..1) along a leg's points, turned along it
  plane(g, pts, t, P, lw) {
    const f = clamp(t, 0, 1) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i;
    const a = P(pts[i][0], pts[i][1]), b = P(pts[i + 1][0], pts[i + 1][1]);
    if (a.z < 0.02 || b.z < 0.02) return;
    const x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u, ang = Math.atan2(b.y - a.y, b.x - a.x);
    const s = lw * 3.4;
    g.save();
    g.translate(x, y); g.rotate(ang);
    g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(5, 12, 22, 0.8)'; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(s, 0); g.lineTo(-s * 0.5, s * 0.75); g.lineTo(-s * 0.2, 0); g.lineTo(-s * 0.5, -s * 0.75);
    g.closePath(); g.fill(); g.stroke();
    g.restore();
  },

  // the view to show a route from: over its stop `at` (where the expedition waits), a little
  // towards the equator so more of the route's arc shows
  viewFor(plan, at) {
    const a = World.byId[plan[Math.min(at || 0, plan.length - 1)]] || World.byId[Career.data.base];
    const b = World.byId[plan[Math.min((at || 0) + 1, plan.length - 1)]] || a;
    const m = this.arc(a, b, 30);
    const mid = m[Math.floor(m.length / 2)];
    return { lat0: clamp(mid[0] * 0.6, -45, 45), lon0: mid[1] };
  },

  // a picture of the route for a card (an image URL, kept per route and progress)
  url(plan, flown, size) {
    const key = plan.join('-') + '|' + flown + '|' + size;
    if (this.cache[key]) return this.cache[key];
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const v = plan.length > 1 ? this.viewFor(plan, flown) : { lat0: 25, lon0: 18 };
    this.draw(cv.getContext('2d'), size, size, v, { plan, flown });
    this.cache[key] = cv.toDataURL();
    return this.cache[key];
  }
};

// a place (degrees) as a unit vector: x towards 0°/0°, y towards 0°/90° E, z to the North Pole
function geoVec(lat, lon) {
  const p = lat * DEG, l = lon * DEG;
  return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
}
