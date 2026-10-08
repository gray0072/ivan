'use strict';

// ============================================================
// World Aviation — the region pictures on the Network tab: a small
// map of the region's part of the world (the coastlines of
// data/geodata.js), its airports lit up in gold over a soft glow
// and the home base ringed when it is well inside the picture.
// Drawn once per region into a canvas and kept as an image URL
// for UI.networkBody (ui/ui.js).
// ============================================================

const RegionMaps = {
  W: 640, H: 320,                                       // the picture, px (2 : 1, as the hangar's)
  cache: {},

  url(regionId) {
    if (this.cache[regionId]) return this.cache[regionId];
    const cv = document.createElement('canvas');
    cv.width = this.W; cv.height = this.H;
    this.draw(cv.getContext('2d'), regionId, this.W, this.H);
    this.cache[regionId] = cv.toDataURL();
    return this.cache[regionId];
  },

  draw(g, regionId, w, h) {
    const mine = World.list.filter((a) => a.region === regionId);
    // the region's box, a little padding round it, a sensible least size for small regions
    let lo0 = Infinity, lo1 = -Infinity, la0 = Infinity, la1 = -Infinity;
    for (const a of mine) { lo0 = Math.min(lo0, a.lon); lo1 = Math.max(lo1, a.lon); la0 = Math.min(la0, a.lat); la1 = Math.max(la1, a.lat); }
    const midLat = (la0 + la1) / 2;
    const kx = Math.max(0.35, Math.cos(midLat * DEG));  // equirectangular, squeezed to the middle latitude
    const cx = (lo0 + lo1) / 2 * kx, cy = -midLat;
    const spanX = Math.max((lo1 - lo0) * kx, 6) * 1.3, spanY = Math.max(la1 - la0, 6) * 1.3;
    const scale = Math.min(w / spanX, h / spanY);
    const px = (lon) => w / 2 + (lon * kx - cx) * scale;
    const py = (lat) => h / 2 + (-lat - cy) * scale;

    // the sea and a faint graticule every 10°
    const sea = g.createLinearGradient(0, 0, 0, h);
    sea.addColorStop(0, '#16304a'); sea.addColorStop(1, '#0c1a2a');
    g.fillStyle = sea; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(150, 190, 230, 0.07)'; g.lineWidth = 1;
    for (let lon = -180; lon <= 190; lon += 10) { const x = px(lon); if (x > -2 && x < w + 2) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } }
    for (let lat = -80; lat <= 80; lat += 10) { const y = py(lat); if (y > -2 && y < h + 2) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }

    // the land, then the inland seas and lakes cut out of it
    const ring = (pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(px(p[0]), py(p[1])) : g.moveTo(px(p[0]), py(p[1])))); g.closePath(); };
    g.lineJoin = 'round';
    for (const poly of LAND_POLYGONS) {
      ring(poly);
      g.fillStyle = '#2b3f36'; g.fill();
      g.strokeStyle = 'rgba(190, 225, 205, 0.28)'; g.lineWidth = 1.2; g.stroke();
    }
    g.fillStyle = '#132a40';
    for (const poly of WATER_POLYGONS) { ring(poly); g.fill(); }

    // the region's glow, so it reads as one area
    g.save();
    g.globalCompositeOperation = 'lighter';
    const glowR = Math.max(26, Math.min(w, h) * 0.13);
    for (const a of mine) {
      const x = px(a.lon), y = py(a.lat);
      const gl = g.createRadialGradient(x, y, 0, x, y, glowR);
      gl.addColorStop(0, 'rgba(255, 200, 90, 0.22)'); gl.addColorStop(1, 'rgba(255, 200, 90, 0)');
      g.fillStyle = gl; g.fillRect(x - glowR, y - glowR, glowR * 2, glowR * 2);
    }
    g.restore();

    // the region's airports in gold (only them: other regions' airports at the edge of a big
    // region's picture read as clutter)
    for (const a of mine) {
      const x = px(a.lon), y = py(a.lat);
      g.beginPath(); g.arc(x, y, 4.6, 0, TAU);
      g.fillStyle = '#ffd97a'; g.fill();
      g.strokeStyle = 'rgba(40, 26, 6, 0.85)'; g.lineWidth = 1.4; g.stroke();
    }

    // the home base, when it is well inside the picture (clear of the badges along the top
    // edge and of the edges, where its name would be cut off)
    const base = World.byId[(Career.data && Career.data.base) || 'ARN'];
    if (base) {
      const x = px(base.lon), y = py(base.lat);
      if (x > 20 && x < w - 20 && y > h * 0.24 && y < h - 16) {
        g.beginPath(); g.arc(x, y, 9, 0, TAU);
        g.strokeStyle = '#ffffff'; g.lineWidth = 2.4; g.stroke();
        g.font = '700 17px "Segoe UI", Arial, sans-serif';
        g.textBaseline = 'middle';
        g.lineWidth = 4; g.strokeStyle = 'rgba(8, 14, 22, 0.85)';
        const right = x < w - 70;
        g.textAlign = right ? 'left' : 'right';
        const tx = right ? x + 14 : x - 14;
        g.strokeText(base.id, tx, y); g.fillStyle = '#ffffff'; g.fillText(base.id, tx, y);
      }
    }
  }
};
