'use strict';

// Wiggle Wars — what is behind and in front of the land: the sky of the theme (a gradient, the
// sun or the Earth and stars on the Moon), two parallax layers of hills / dunes / mountains made
// from the map's seed, clouds drifting with the wind, and the water — a darker layer behind the
// land and the animated waves in front of it. Drawn by render/render.js.

const Backdrop = (() => {
  let layers = null, layersFor = null, clouds = [], stars = [];

  function build() {
    const rnd = seededRandom((match.seed ^ 0x2c1b3c6d) >>> 0);
    const kind = match.theme.back;
    const mk = (amp, base, scale, sharp) => {
      const t1 = Array.from({ length: 64 }, rnd), t2 = Array.from({ length: 64 }, rnd);
      const pts = [];
      for (let x = -400; x <= WORLD_W + 400; x += 16) {
        let n = noise1(t1, x + 4000, scale) * 0.75 + noise1(t2, x + 4000, scale / 3) * 0.25;
        if (sharp) n = 1 - Math.abs(n - 0.5) * 2;
        pts.push(x, base - n * amp);
      }
      return pts;
    };
    if (kind === 'mountains') layers = [mk(420, 760, 260, true), mk(260, 860, 180, true)];
    else if (kind === 'dunes') layers = [mk(200, 760, 340, false), mk(150, 860, 220, false)];
    else if (kind === 'stars') layers = [mk(160, 820, 300, false), mk(110, 900, 160, false)];
    else layers = [mk(260, 760, 300, false), mk(170, 860, 200, false)];
    clouds = [];
    if (match.theme.cloud) for (let i = 0; i < 9; i++) clouds.push({ x: rnd() * (WORLD_W + 800) - 400, y: 60 + rnd() * 380, s: 0.6 + rnd() * 0.9 });
    stars = [];
    if (kind === 'stars') for (let i = 0; i < 160; i++) stars.push({ x: rnd(), y: rnd() * 0.8, r: 0.4 + rnd() * 1.2, t: rnd() * 6 });
    layersFor = match;
  }

  function sky(ctx, w, h, time) {
    if (layersFor !== match) build();
    const th = match.theme;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, th.sky[0]); g.addColorStop(0.55, th.sky[1]); g.addColorStop(1, th.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (th.back === 'stars') {
      for (const s of stars) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 1.5 + s.t);
        ctx.fillStyle = '#fff';
        ctx.fillRect(s.x * w, s.y * h, s.r, s.r);
      }
      ctx.globalAlpha = 1;
      // the Earth
      const ex = w * 0.8, ey = h * 0.2, er = Math.min(w, h) * 0.07;
      ctx.fillStyle = '#2f6fd6'; ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4caf50';
      ctx.beginPath(); ctx.ellipse(ex - er * 0.3, ey - er * 0.2, er * 0.35, er * 0.25, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ex + er * 0.35, ey + er * 0.3, er * 0.25, er * 0.35, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,10,0.45)';
      ctx.beginPath(); ctx.arc(ex + er * 0.55, ey + er * 0.3, er, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else {
      const sx = w * 0.15, sy = h * 0.16, r = Math.min(w, h) * 0.05;
      const sg = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 3);
      sg.addColorStop(0, 'rgba(255,250,220,0.9)'); sg.addColorStop(0.3, 'rgba(255,240,200,0.25)'); sg.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, r * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(sx, sy, r * 0.6, 0, Math.PI * 2); ctx.fill();
    }
  }

  // the parallax layers and the clouds, in screen space from the camera
  function back(ctx, cam, dt) {
    const th = match.theme;
    for (const c of clouds) {
      c.x += match.wind * 30 * dt * c.s;
      if (c.x > WORLD_W + 500) c.x = -500; else if (c.x < -500) c.x = WORLD_W + 500;
    }
    // a layer scrolls and zooms `par` as much as the world does
    const view = (par) => {
      const z = cam.zoom * (0.55 + par * 0.45);
      const cx = WORLD_W / 2 + (cam.x - WORLD_W / 2) * par, cy = WORLD_H / 2 + (cam.y - WORLD_H / 2) * par;
      return { z, cx, cy };
    };
    const layer = (pts, par, color) => {
      const v = view(par);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, cam.h);
      for (let i = 0; i < pts.length; i += 2) ctx.lineTo((pts[i] - v.cx) * v.z + cam.w / 2, (pts[i + 1] - v.cy) * v.z + cam.h / 2);
      ctx.lineTo(cam.w, cam.h);
      ctx.closePath();
      ctx.fill();
    };
    if (clouds.length) {
      ctx.fillStyle = th.cloud;
      const v = view(0.4);
      for (const c of clouds) {
        const x = (c.x - v.cx) * v.z + cam.w / 2, y = (c.y - v.cy) * v.z + cam.h / 2;
        const s = 34 * c.s * v.z;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2); ctx.arc(x + s * 1.1, y + s * 0.2, s * 0.8, 0, Math.PI * 2);
        ctx.arc(x - s * 1.1, y + s * 0.25, s * 0.7, 0, Math.PI * 2); ctx.arc(x + s * 0.4, y - s * 0.5, s * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    layer(layers[0], 0.25, th.far);
    layer(layers[1], 0.5, th.near);
  }

  // the water: behind (before the land) and in front (after everything in the world)
  function water(ctx, cam, time, front) {
    const th = match.theme;
    const wy = (match.water - cam.y) * cam.zoom + cam.h / 2;
    if (wy > cam.h + 20) return;
    const amp = 5 * cam.zoom;
    const off = front ? 0 : -9 * cam.zoom;
    const phase = time * (front ? 1.6 : 1.1) + (front ? 0 : 2);
    ctx.beginPath();
    ctx.moveTo(0, cam.h);
    for (let x = 0; x <= cam.w + 10; x += 8) {
      const wx = (x - cam.w / 2) / cam.zoom + cam.x;
      ctx.lineTo(x, wy + off + Math.sin(wx / 40 + phase) * amp + Math.sin(wx / 17 + phase * 1.7) * amp * 0.35);
    }
    ctx.lineTo(cam.w, cam.h);
    ctx.closePath();
    if (front) {
      const g = ctx.createLinearGradient(0, wy, 0, cam.h);
      g.addColorStop(0, th.water[0]); g.addColorStop(1, th.water[1]);
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = g;
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, 2 * cam.zoom);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = th.water[1];
      ctx.fill();
    }
  }

  return { sky, back, water };
})();
