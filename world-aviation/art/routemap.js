'use strict';

// ============================================================
// World Aviation — the route map in the briefing: the two airports
// and the great circle between them over the coastlines of
// data/geodata.js, in the projection the flight's own world uses
// (Theatre: azimuthal equidistant round the middle of the route),
// so the route is the straight line it will be in the flight, north
// up. Each end has its flag, its code and its city in the game's
// language; the distance sits over the middle of the line. Drawn
// once per route and language into a canvas and kept as an image
// URL for UI.showBriefing (ui/ui.js).
// ============================================================

const RouteMap = {
  W: 720, H: 340,                                       // the picture, px
  cache: {},

  url(from, to) {
    const key = from.id + '>' + to.id + '|' + I18N.lang + '|' + Units.metric;
    if (this.cache[key]) return this.cache[key];
    const cv = document.createElement('canvas');
    cv.width = this.W; cv.height = this.H;
    // the flight's projection, borrowed for the drawing (nothing else runs meanwhile)
    const keep = { lat: Theatre.lat0, lon: Theatre.lon0 };
    Theatre.setRoute(from.lat, from.lon, to.lat, to.lon);
    try { this.draw(cv.getContext('2d'), from, to, this.W, this.H); } finally { Theatre.set(keep.lat, keep.lon); }
    this.cache[key] = cv.toDataURL();
    return this.cache[key];
  },

  draw(g, from, to, w, h) {
    const A = Theatre.km(from.lat, from.lon), B = Theatre.km(to.lat, to.lon);
    // the frame: both ends and a margin for their labels, at least 700 km across
    const spanX = Math.max(Math.abs(B.x - A.x) * 1.45, 700), spanY = Math.max(Math.abs(B.y - A.y) * 1.6, 350);
    const scale = Math.min(w / spanX, h / spanY);
    const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2;
    const X = (q) => w / 2 + (q.x - cx) * scale, Y = (q) => h / 2 - (q.y - cy) * scale;
    const reachKm = Math.hypot(w, h) / scale * 0.8 + 2500;

    // the sea, a faint graticule every 10°
    const sea = g.createLinearGradient(0, 0, 0, h);
    sea.addColorStop(0, '#16304a'); sea.addColorStop(1, '#0c1a2a');
    g.fillStyle = sea; g.fillRect(0, 0, w, h);
    const far = (lat, lon) => geoDistanceNm(lat, lon, Theatre.lat0, Theatre.lon0) * NM_KM > reachKm;
    g.strokeStyle = 'rgba(150, 190, 230, 0.08)'; g.lineWidth = 1;
    const graticule = (pts) => {
      g.beginPath();
      let pen = false;
      for (const [lat, lon] of pts) {
        if (far(lat, lon)) { pen = false; continue; }
        const q = Theatre.km(lat, lon);
        if (pen) g.lineTo(X(q), Y(q)); else g.moveTo(X(q), Y(q));
        pen = true;
      }
      g.stroke();
    };
    for (let lon = -180; lon < 180; lon += 10) { const pts = []; for (let lat = -80; lat <= 80; lat += 2) pts.push([lat, lon]); graticule(pts); }
    for (let lat = -80; lat <= 80; lat += 10) { const pts = []; for (let lon = -180; lon <= 180; lon += 2) pts.push([lat, lon]); graticule(pts); }

    // the land, then the inland seas and lakes cut out of it (only the shapes near the route:
    // far round the globe the projection runs wild)
    const near = (poly) => poly.some((p) => !far(p[1], p[0]));
    const ring = (poly) => {
      g.beginPath();
      poly.forEach((p, i) => { const q = Theatre.km(p[1], p[0]); if (i) g.lineTo(X(q), Y(q)); else g.moveTo(X(q), Y(q)); });
      g.closePath();
    };
    g.lineJoin = 'round';
    for (const poly of LAND_POLYGONS) {
      if (!near(poly)) continue;
      ring(poly);
      g.fillStyle = '#2b3f36'; g.fill();
      g.strokeStyle = 'rgba(190, 225, 205, 0.28)'; g.lineWidth = 1.2; g.stroke();
    }
    g.fillStyle = '#132a40';
    for (const poly of WATER_POLYGONS) { if (near(poly)) { ring(poly); g.fill(); } }

    // the route: a glow, the line, the aeroplane halfway along it
    const ax = X(A), ay = Y(A), bx = X(B), by = Y(B);
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(255, 210, 110, 0.18)'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    g.strokeStyle = '#ffd97a'; g.lineWidth = 2.6; g.setLineDash([10, 7]);
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    g.setLineDash([]);
    const ang = Math.atan2(by - ay, bx - ax), mx = (ax + bx) / 2, my = (ay + by) / 2;
    g.save();
    g.translate(mx, my); g.rotate(ang);
    g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(8, 14, 22, 0.9)'; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(13, 0); g.lineTo(4, -2.2); g.lineTo(-2, -12); g.lineTo(-5, -12); g.lineTo(-2, -2.2); g.lineTo(-9, -2);
    g.lineTo(-12, -6); g.lineTo(-14, -6); g.lineTo(-12, 0); g.lineTo(-14, 6); g.lineTo(-12, 6); g.lineTo(-9, 2);
    g.lineTo(-2, 2.2); g.lineTo(-5, 12); g.lineTo(-2, 12); g.lineTo(4, 2.2); g.closePath();
    g.stroke(); g.fill();
    g.restore();
    // the distance over the middle of the line, on the side away from the aeroplane's wing
    const text = Units.dist(geoDistanceNm(from.lat, from.lon, to.lat, to.lon));
    g.font = '700 17px "Segoe UI", Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    // (off the line by as much as the text needs at that angle: more beside a steep line)
    const nx = -Math.sin(ang), ny = Math.cos(ang), side = ny > 0 ? -1 : 1;
    const off = 16 + Math.abs(nx) * g.measureText(text).width / 2 + Math.abs(ny) * 8;
    const tx = mx + nx * off * side, ty = my + ny * off * side;
    g.lineWidth = 4; g.strokeStyle = 'rgba(8, 14, 22, 0.85)'; g.strokeText(text, tx, ty);
    g.fillStyle = '#ffe6a8'; g.fillText(text, tx, ty);

    // the two ends: a ring, the flag, the code and the city, on the outer side of each
    const end = (a, x, y, ox) => {
      g.beginPath(); g.arc(x, y, 7, 0, TAU);
      g.fillStyle = '#ffd97a'; g.fill();
      g.lineWidth = 2.4; g.strokeStyle = '#ffffff'; g.stroke();
      const fw = 30, fh = 20, city = aptCity(a);
      g.font = '600 16px "Segoe UI", Arial, sans-serif';
      const cityW = g.measureText(city).width;
      g.font = '800 22px "Segoe UI", Arial, sans-serif';
      const codeW = g.measureText(a.id).width, need = Math.max(cityW, codeW + fw + 8) + 22;
      // (turned round where the picture's edge would cut the label off)
      let right = ox >= 0;
      if (right && x + need > w) right = false;
      else if (!right && x - need < 0) right = true;
      const lx = x + (right ? 16 : -16);
      g.textAlign = right ? 'left' : 'right';
      const fx = right ? lx : lx - codeW - fw - 8;
      Flags.draw(g, a.country, fx, y - 22 - fh / 2, fw, fh);
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.strokeRect(fx, y - 22 - fh / 2, fw, fh);
      const cxText = right ? fx + fw + 8 : lx;
      g.lineWidth = 4; g.strokeStyle = 'rgba(8, 14, 22, 0.85)';
      g.strokeText(a.id, cxText, y - 22); g.fillStyle = '#ffffff'; g.fillText(a.id, cxText, y - 22);
      g.font = '600 16px "Segoe UI", Arial, sans-serif';
      g.strokeText(city, lx, y + 2); g.fillStyle = '#d7e3ee'; g.fillText(city, lx, y + 2);
    };
    // (the labels point away from the other end; one straight above the other: both to the right)
    const dx = bx - ax;
    end(from, ax, ay, Math.abs(dx) < 40 ? 1 : -dx);
    end(to, bx, by, Math.abs(dx) < 40 ? 1 : dx);
  }
};
