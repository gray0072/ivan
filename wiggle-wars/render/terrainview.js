'use strict';

// Wiggle Wars — the land as a picture: a canvas the size of the world, painted from the Terrain
// bitmap in the theme's colours when a map is made (grass or snow on top, layered soil with
// stones below, darker deeper down), then changed the same way as the bitmap: a crater cut out
// with a scorched rim, a steel plank drawn in. Listens to the terrain events of sim/terrain.js;
// drawn by render/render.js. Also the small preview of a map for the setup screen.

const TerrainView = (() => {
  let canvas = null, ctx = null;

  function ensure() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.width = WORLD_W; canvas.height = WORLD_H;
    ctx = canvas.getContext('2d');
  }

  // the colour of a solid pixel `depth` px under the air above it
  function paint() {
    ensure();
    const th = match.theme, bits = Terrain.data();
    const img = ctx.createImageData(WORLD_W, WORLD_H), d = img.data;
    const top = hexRgb(th.top), top2 = hexRgb(th.top2), soils = th.soil.map(hexRgb), deep = hexRgb(th.deep), stone = hexRgb(th.stone);
    const grass = th.deco === 'flowers' || th.deco === 'pines';
    for (let x = 0; x < WORLD_W; x++) {
      let depth = 1000;
      const tuft = 4 + Math.floor(hash2(x, 7, 3) * 4);
      for (let y = 0; y < WORLD_H; y++) {
        const i = y * WORLD_W + x;
        if (!bits[i]) { depth = 0; continue; }
        depth++;
        let c;
        const n = hash2(x >> 1, y >> 1, 11);
        if (depth <= tuft) c = depth <= 2 && grass ? top : (n > 0.5 ? top : top2);
        else if (depth <= tuft + 3) c = top2;
        else {
          const band = soils[Math.floor((noise2(5, x, y + Math.sin(x / 60) * 14, 26) * 2.99))];
          const s = hash2(x >> 2, y >> 2, 21);
          c = s > 0.965 ? stone : band;
          const dk = Math.min(0.55, depth / 900 + y / WORLD_H * 0.25) + (n - 0.5) * 0.08;
          c = [lerp(c[0], deep[0], dk), lerp(c[1], deep[1], dk), lerp(c[2], deep[2], dk)];
        }
        const k = i * 4;
        d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function carve(e) {
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = match.theme.rim;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = Math.max(2, e.r * 0.12);
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + ctx.lineWidth / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(3, e.r * 0.3);
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + ctx.lineWidth / 2 + 1, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function plank(e) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);
    const hx = e.len / 2, hy = e.thick / 2;
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-hx, -hy, e.len, e.thick);
    ctx.fillStyle = '#e05a48';
    ctx.fillRect(-hx, -hy, e.len, 2);
    ctx.fillStyle = '#7d2118';
    ctx.fillRect(-hx, hy - 2, e.len, 2);
    ctx.strokeStyle = '#7d2118'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = -hx; x < hx - 6; x += 12) { ctx.moveTo(x, -hy + 2); ctx.lineTo(x + 6, hy - 2); ctx.lineTo(x + 12, -hy + 2); }
    ctx.stroke();
    ctx.restore();
  }

  if (typeof GameEvents !== 'undefined') {
    GameEvents.on('terrainNew', () => { if (match) paint(); });
    GameEvents.on('carve', carve);
    GameEvents.on('plank', plank);
  }

  // a small picture of a land bitmap, for the setup screen
  function preview(cv, themeId, bits) {
    const th = THEMES[themeId] || THEMES.meadow;
    const w = cv.width, h = cv.height, c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, th.sky[0]); g.addColorStop(0.6, th.sky[1]); g.addColorStop(1, th.sky[2]);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const img = c.getImageData(0, 0, w, h), d = img.data;
    const sx = WORLD_W / w, sy = WORLD_H / h;
    const top = hexRgb(th.top), soil = hexRgb(th.soil[0]), deep = hexRgb(th.deep);
    for (let x = 0; x < w; x++) {
      let depth = 9;
      for (let y = 0; y < h; y++) {
        const solid = bits[Math.floor(y * sy) * WORLD_W + Math.floor(x * sx)];
        if (!solid) { depth = 0; continue; }
        depth++;
        const col = depth <= 1 ? top : depth <= 6 ? soil : deep;
        const k = (y * w + x) * 4;
        d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);
    c.fillStyle = th.water[0];
    c.globalAlpha = 0.85;
    c.fillRect(0, WATER_Y / sy, w, h);
    c.globalAlpha = 1;
  }

  return { paint, preview, get canvas() { return canvas; } };
})();
