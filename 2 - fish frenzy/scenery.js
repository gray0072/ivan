'use strict';

// Background art. Everything here is stateless: decorations are derived from a hash of their
// world-space cell, so the infinite seabed looks the same every time you swim past a spot.
// cam: { x, y, z, floorY, surfaceY, df (0 = surface .. 1 = sea floor), t (seconds), W, H }

function hash1(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function sceneToScreen(cam, wx, wy) {
  return { x: (wx - cam.x) * cam.z + cam.W / 2, y: (wy - cam.y) * cam.z + cam.H / 2 };
}

const SEAWEED_COLORS = ['#2e7d32', '#388e3c', '#558b2f', '#1b5e20', '#7c8c2a', '#8d6e63', '#ad1457'];
const STARFISH_COLORS = ['#ff7043', '#ffb74d', '#f06292', '#ba68c8'];
const DECOR_CELL = 64;

// ---------- Water surface ----------
// A gentle swell (world units) layered on the flat surface line the physics uses
function surfaceWave(wx, t) {
  return 4 * Math.sin(wx * 0.011 + t * 1.3) + 2.5 * Math.sin(wx * 0.027 - t * 1.9) + 1.2 * Math.sin(wx * 0.063 + t * 2.7);
}
const WAVE_AMP = 8;
const SPRAY_TIME = 0.7;  // seconds a splash's spray crown lasts
function surfaceScreenY(cam) { return sceneToScreen(cam, 0, cam.surfaceY).y; }
function waveAtWorld(cam, wx) { return (cam.surfaceY + surfaceWave(wx, cam.t) - cam.y) * cam.z + cam.H / 2; }
function waveAtScreen(cam, sx) { return waveAtWorld(cam, cam.x + (sx - cam.W / 2) / cam.z); }
function waveLine(cam) {
  const pts = [];
  for (let sx = 0; sx <= cam.W + 10; sx += 10) pts.push([sx, waveAtScreen(cam, sx)]);
  return pts;
}
function waterDepthFrac(cam, screenY) {
  const wy = cam.y + (screenY - cam.H / 2) / cam.z;
  return clamp((wy - cam.surfaceY) / (cam.floorY - cam.surfaceY), 0, 1);
}
function waterRGB(df) {
  return `rgb(${Math.round(lerp(112, 3, df))},${Math.round(lerp(208, 10, df))},${Math.round(lerp(236, 24, df))})`;
}

function drawWater(ctx, cam) {
  const { W, H, z, t } = cam;
  const sy = surfaceScreenY(cam);
  const amp = WAVE_AMP * z;
  if (sy - amp > H) return;  // high in the air: no water on screen
  const top = Math.max(0, sy - amp);

  ctx.save();
  ctx.beginPath();
  if (sy + amp < 0) {
    ctx.rect(0, 0, W, H);
  } else {
    ctx.moveTo(0, H);
    for (const [x, y] of waveLine(cam)) ctx.lineTo(x, y);
    ctx.lineTo(W, H);
    ctx.closePath();
  }
  // true depth colors: bright just under the surface, dark near the sea floor
  const grad = ctx.createLinearGradient(0, top, 0, H);
  for (let k = 0; k <= 4; k++) grad.addColorStop(k / 4, waterRGB(waterDepthFrac(cam, top + (H - top) * k / 4)));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.clip();

  // light glowing through the surface
  if (sy > -260 * z && sy < H) {
    const lg = ctx.createLinearGradient(0, sy - amp, 0, sy + 260 * z);
    lg.addColorStop(0, 'rgba(200,245,255,0.35)');
    lg.addColorStop(1, 'rgba(200,245,255,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, sy - amp, W, 260 * z + amp);
  }

  drawSunRays(ctx, cam, Math.max(0, sy));

  // drifting motes on a slower parallax layer
  const P = 0.5, cell = 90;
  const ox = cam.x * P, oy = cam.y * P;
  const ix0 = Math.floor((ox - W / 2) / cell) - 1, ix1 = Math.floor((ox + W / 2) / cell) + 1;
  const iy0 = Math.floor((oy - H / 2) / cell) - 1, iy1 = Math.floor((oy + H / 2) / cell) + 1;
  for (let ix = ix0; ix <= ix1; ix++) {
    for (let iy = iy0; iy <= iy1; iy++) {
      const h = hash1(ix * 73.1 + iy * 19.7);
      if (h > 0.55) continue;
      const px = (ix + hash1(ix * 11.3 + iy * 47.9)) * cell - ox + W / 2 + Math.sin(t * 0.4 + h * 20) * 8;
      const py = (iy + hash1(ix * 29.1 + iy * 5.3)) * cell - oy + H / 2 + Math.cos(t * 0.3 + h * 13) * 6;
      ctx.fillStyle = waterDepthFrac(cam, py) > 0.6
        ? `rgba(160,235,255,${0.15 + h * 0.4})`
        : `rgba(255,255,255,${0.12 + h * 0.3})`;
      ctx.beginPath();
      ctx.arc(px, py, 0.8 + h * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// The surface seen edge-on, drawn over the fish: a bright waterline and a thin translucent film
// just below it, plus foam patches left by splashes
function drawSurface(ctx, cam, foams) {
  const { W, H, z } = cam;
  const sy = surfaceScreenY(cam);
  const amp = WAVE_AMP * z;
  if (sy + amp + 40 < 0 || sy - amp - 40 > H) return;
  const pts = waveLine(cam);
  const band = 26 * z + 6;

  const g = ctx.createLinearGradient(0, sy - amp, 0, sy + amp + band);
  g.addColorStop(0, 'rgba(175,232,250,0.5)');
  g.addColorStop(1, 'rgba(175,232,250,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + band);
  ctx.closePath();
  ctx.fill();

  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = Math.max(1, 1.5 * z);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 5 * z) : ctx.moveTo(x, y + 5 * z)));
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1.2, 2.2 * z);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.lineJoin = 'miter';

  for (const f of foams) {
    // spray crown: a ring of thin water sheets that shoots up, leans outward and collapses
    const age = f.maxLife - f.life;
    if (age < SPRAY_TIME) {
      const env = Math.sin(Math.PI * age / SPRAY_TIME);
      const base = (f.x - cam.x) * z + W / 2;
      for (let k = 0; k < 9; k++) {
        const u = k / 8 * 2 - 1;
        const bx = base + u * f.w * z * (0.6 + age * 1.2);
        const hh = f.h * z * env * (1 - u * u * 0.55) * (0.6 + 0.4 * hash1(k * 7.1 + f.x));
        const tx = bx + u * hh * 0.45, ty = waveAtWorld(cam, f.x) - hh;
        const hw = Math.max(2, f.w * z * 0.11);
        const sg = ctx.createLinearGradient(0, ty, 0, ty + hh);
        sg.addColorStop(0, 'rgba(255,255,255,0.1)');
        sg.addColorStop(0.3, `rgba(240,251,255,${0.85 * env})`);
        sg.addColorStop(1, `rgba(215,242,255,${0.6 * env})`);
        ctx.fillStyle = sg;
        ctx.strokeStyle = `rgba(70,150,200,${0.4 * env})`;
        ctx.lineWidth = Math.max(1, 1.2 * z);
        ctx.beginPath();
        ctx.moveTo(bx - hw, ty + hh);
        ctx.quadraticCurveTo(bx - hw * 0.35, ty + hh * 0.4, tx, ty);
        ctx.quadraticCurveTo(bx + hw * 0.35, ty + hh * 0.4, bx + hw, ty + hh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // foam: white lumps that spread out and fade along the waterline
    const a = f.life / f.maxLife;
    const spread = 1 + (1 - a) * 1.3;
    for (let k = 0; k < 7; k++) {
      const u = k / 6 - 0.5;
      const wx = f.x + u * 2 * f.w * spread;
      const sx = (wx - cam.x) * z + W / 2;
      if (sx < -80 || sx > W + 80) continue;
      const rx = (f.w * 0.16 + 4) * z * (0.7 + hash1(k * 3.3 + f.x) * 0.6) * (1 - Math.abs(u) * 0.8);
      ctx.fillStyle = `rgba(255,255,255,${0.6 * a})`;
      ctx.beginPath();
      ctx.ellipse(sx, waveAtWorld(cam, wx), rx, rx * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------- Above the water: sky, sun, clouds, islands and gulls, all anchored to the horizon ----------
function drawSky(ctx, cam) {
  const { W, H, z, t } = cam;
  const sy = surfaceScreenY(cam);
  if (sy + WAVE_AMP * z < 0) return;
  const k = Math.sqrt(z);  // far things barely scale with the zoom

  const sky = ctx.createLinearGradient(0, sy - 900, 0, sy);
  sky.addColorStop(0, '#2f7fd0');
  sky.addColorStop(0.65, '#8fd0fb');
  sky.addColorStop(1, '#dff4ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, Math.min(H, sy + WAVE_AMP * z + 2));

  // sun
  const sunX = W * 0.74, sunY = sy - 280;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 220);
  glow.addColorStop(0, 'rgba(255,248,210,0.9)');
  glow.addColorStop(0.2, 'rgba(255,240,190,0.35)');
  glow.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 220, sunY - 220, 440, 440);
  ctx.fillStyle = '#fff8dc';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
  ctx.fill();

  // clouds, drifting slowly on a far layer
  const CLOUD_CELL = 420;
  const cShift = cam.x * 0.05 - t * 8;
  const c0 = Math.floor((cShift - W / 2 - 300) / CLOUD_CELL), c1 = Math.floor((cShift + W / 2 + 300) / CLOUD_CELL);
  for (let i = c0; i <= c1; i++) {
    if (hash1(i * 5.13 + 2) > 0.6) continue;
    const cx = (i + hash1(i * 2.71)) * CLOUD_CELL - cShift + W / 2;
    const cy = sy - 150 - hash1(i * 3.9) * 240;
    drawCloud(ctx, cx, cy, (0.6 + hash1(i * 7.7) * 0.7) * k, i);
  }

  // far hazy mountain islands, then nearer palm islands
  const FAR_CELL = 1600, NEAR_CELL = 1100;
  const fShift = cam.x * 0.03;
  const f0 = Math.floor((fShift - W / 2 - 600) / FAR_CELL), f1 = Math.floor((fShift + W / 2 + 600) / FAR_CELL);
  for (let i = f0; i <= f1; i++) {
    if (hash1(i * 9.31 + 4) > 0.55) continue;
    drawFarIsland(ctx, (i + hash1(i * 1.7)) * FAR_CELL - fShift + W / 2, sy, k, i);
  }
  const nShift = cam.x * 0.1;
  const n0 = Math.floor((nShift - W / 2 - 500) / NEAR_CELL), n1 = Math.floor((nShift + W / 2 + 500) / NEAR_CELL);
  for (let i = n0; i <= n1; i++) {
    if (i !== 0 && hash1(i * 6.17 + 1) > 0.45) continue;  // there's always an island near the start
    drawPalmIsland(ctx, (i + 0.2 + hash1(i * 4.3) * 0.6) * NEAR_CELL - nShift + W / 2, sy, k, i, t);
  }

  // gulls
  ctx.strokeStyle = '#34495e';
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const span = W + 400;
    const gx = ((i * 523 + t * (22 + i * 9) - cam.x * 0.2) % span + span) % span - 200;
    const gy = sy - 190 - i * 45 + Math.sin(t * 0.7 + i * 2) * 14;
    const flap = Math.sin(t * 7 + i * 2.1);
    const s = (7 + i * 1.5) * k;
    ctx.lineWidth = Math.max(1.2, 1.8 * k);
    ctx.beginPath();
    ctx.moveTo(gx - s * 1.6, gy - s * 0.5 * flap);
    ctx.quadraticCurveTo(gx - s * 0.7, gy - s * (0.3 + 0.8 * flap), gx, gy);
    ctx.quadraticCurveTo(gx + s * 0.7, gy - s * (0.3 + 0.8 * flap), gx + s * 1.6, gy - s * 0.5 * flap);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';

  // haze where sea meets sky
  const haze = ctx.createLinearGradient(0, sy - 40, 0, sy);
  haze.addColorStop(0, 'rgba(235,248,255,0)');
  haze.addColorStop(1, 'rgba(235,248,255,0.45)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, sy - 40, W, 40);
}

function drawCloud(ctx, cx, cy, s, seed) {
  const puffs = 4 + Math.floor(hash1(seed * 3.3) * 3);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  for (let p = 0; p < puffs; p++) {
    const u = p / (puffs - 1) - 0.5;
    const r = (26 + hash1(seed * 1.1 + p) * 22) * s * (1 - Math.abs(u) * 0.8);
    ctx.moveTo(cx + u * 150 * s + r, cy - r * 0.5);
    ctx.arc(cx + u * 150 * s, cy - r * 0.5, r, 0, Math.PI * 2);
  }
  ctx.fill();
  // flat, slightly shaded underside
  ctx.fillStyle = 'rgba(200,222,240,0.9)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 90 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFarIsland(ctx, cx, sy, k, seed) {
  const w = (520 + hash1(seed * 2.2) * 520) * k;
  const h = (60 + hash1(seed * 3.1) * 90) * k;
  ctx.fillStyle = 'rgba(92,138,170,0.7)';
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, sy + 2);
  for (let s = 0; s <= 24; s++) {
    const u = s / 24;
    const env = Math.sin(u * Math.PI);
    const bumps = 0.75 + 0.25 * Math.sin(u * 9 + seed) + 0.12 * Math.sin(u * 23 + seed * 2);
    ctx.lineTo(cx - w / 2 + u * w, sy - h * Math.pow(env, 0.8) * bumps);
  }
  ctx.lineTo(cx + w / 2, sy + 2);
  ctx.closePath();
  ctx.fill();
}

function drawPalmIsland(ctx, cx, sy, k, seed, t) {
  const w = (300 + hash1(seed * 2.9) * 260) * k;
  const h = (34 + hash1(seed * 3.7) * 26) * k;
  const moundY = (u) => sy - h * (1 - u * u * 4);  // u in -0.5..0.5 across the island

  // wet sand at the waterline, then the dry beach
  ctx.fillStyle = '#c9a56a';
  ctx.beginPath();
  ctx.ellipse(cx, sy + 1, w * 0.52, h * 0.25, 0, Math.PI, 0);
  ctx.fill();
  const sand = ctx.createLinearGradient(0, sy - h, 0, sy);
  sand.addColorStop(0, '#f6e3b0');
  sand.addColorStop(1, '#dcbc7e');
  ctx.fillStyle = sand;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, sy + 2);
  ctx.bezierCurveTo(cx - w * 0.3, sy - h * 1.35, cx + w * 0.3, sy - h * 1.35, cx + w / 2, sy + 2);
  ctx.closePath();
  ctx.fill();

  // bushes along the crest
  const bushes = 5 + Math.floor(hash1(seed * 5.5) * 4);
  for (let b = 0; b < bushes; b++) {
    const u = (b / (bushes - 1) - 0.5) * 0.6;
    const r = (9 + hash1(seed * 1.3 + b) * 10) * k;
    ctx.fillStyle = b % 2 ? '#3d8b3d' : '#2f7331';
    ctx.beginPath();
    ctx.arc(cx + u * w, moundY(u) + r * 0.4, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // palm trees
  const palms = 1 + Math.floor(hash1(seed * 8.1) * 3);
  ctx.lineCap = 'round';
  for (let p = 0; p < palms; p++) {
    const u = (palms === 1 ? 0 : (p / (palms - 1) - 0.5) * 0.45) + (hash1(seed * 3 + p) - 0.5) * 0.08;
    const bx = cx + u * w, by = moundY(u) + 4 * k;
    const len = (70 + hash1(seed * 4.1 + p) * 55) * k;
    const lean = (palms === 1 ? hash1(seed + p) - 0.5 : u) * 1.3 * len;
    const sway = Math.sin(t * 0.9 + seed + p) * 3 * k;
    const tx = bx + lean + sway, ty = by - len;
    ctx.strokeStyle = '#8b6b47';
    ctx.lineWidth = 5 * k;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + lean * 0.15, by - len * 0.6, tx, ty);
    ctx.stroke();
    // fronds droop out from the crown and sway in the breeze
    for (let f = 0; f < 7; f++) {
      const a = -Math.PI / 2 + (f / 6 - 0.5) * 3.3 + Math.sin(t * 1.4 + f + seed) * 0.06;
      const fl = (34 + hash1(seed * 2 + f + p) * 14) * k;
      const ex = tx + Math.cos(a) * fl, ey = ty + Math.sin(a) * fl * 0.6 + fl * 0.35;
      const mx = tx + Math.cos(a) * fl * 0.55, my = ty + Math.sin(a) * fl * 0.55 - 6 * k;
      ctx.fillStyle = f % 2 ? '#2e8b3e' : '#3aa24a';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx, my - 5 * k, ex, ey);
      ctx.quadraticCurveTo(mx, my + 5 * k, tx, ty);
      ctx.fill();
    }
    ctx.fillStyle = '#5d4128';
    ctx.beginPath();
    ctx.arc(tx - 3 * k, ty + 4 * k, 3.2 * k, 0, Math.PI * 2);
    ctx.arc(tx + 3 * k, ty + 5 * k, 3.2 * k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineCap = 'butt';
}

// Sun rays live on a slow parallax layer split into cells. A cell may hold one ray with its own width,
// slant, sway and slow fade cycle, so swimming sideways slides rays past and brings new ones in with
// irregular gaps, and even when standing still they drift and breathe in and out at different rhythms.
const RAY_CELL = 170;
const RAY_PARALLAX = 0.35;
function drawSunRays(ctx, cam, y0) {
  const { W, H, df, t } = cam;
  const strength = 1 - df;
  if (strength < 0.03) return;

  const shift = cam.x * RAY_PARALLAX;
  const sunSlant = 0.3 + Math.sin(t * 0.05) * 0.05;  // the whole sun direction drifts very slowly
  const i0 = Math.floor((shift - W / 2 - H * 0.7 - 250) / RAY_CELL);
  const i1 = Math.floor((shift + W / 2 + 100) / RAY_CELL);

  ctx.save();
  ctx.translate(0, y0);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = i0; i <= i1; i++) {
    if (hash1(i * 3.17 + 0.5) > 0.65) continue;  // empty cell: a gap between rays

    const speed = 0.08 + hash1(i * 6.6) * 0.15;   // fade cycle of ~4-12 s
    const pulse = 0.5 - 0.5 * Math.cos(t * speed * Math.PI * 2 + hash1(i * 4.4) * 6.28);
    const alpha = 0.24 * strength * Math.pow(pulse, 1.2) * (0.6 + 0.4 * hash1(i * 8.8));
    if (alpha < 0.003) continue;

    const x = (i + hash1(i * 7.3)) * RAY_CELL - shift + W / 2;
    const topW = 18 + hash1(i * 1.9) * 70;
    const spread = 2 + hash1(i * 5.1) * 2.5;
    const slant = sunSlant + (hash1(i * 2.3) - 0.5) * 0.12;
    const len = H * (0.75 + hash1(i * 9.7) * 0.5);
    const sway = Math.sin(t * (0.15 + hash1(i * 3.9) * 0.2) + i) * 18;

    // three nested layers give the ray a bright core and soft edges
    for (let layer = 0; layer < 3; layer++) {
      const k = 1 - layer * 0.33;
      const tw = topW * k, bw = topW * spread * k;
      const cx = x + topW / 2 + sway * 0.3;
      const bx = x + topW / 2 + sway + slant * len;
      const g = ctx.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, `rgba(255,255,240,${alpha / 3})`);
      g.addColorStop(0.6, `rgba(255,255,240,${alpha / 8})`);
      g.addColorStop(1, 'rgba(255,255,240,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - tw / 2, 0);
      ctx.lineTo(cx + tw / 2, 0);
      ctx.lineTo(bx + bw / 2, len);
      ctx.lineTo(bx - bw / 2, len);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

// Far rocky ridges rising from the floor line, on two parallax layers
function drawHills(ctx, cam) {
  const { W, H, z } = cam;
  const floorY = sceneToScreen(cam, 0, cam.floorY).y;
  if (floorY - 180 * z > H) return;
  const layers = [
    { p: 0.35, h: 170, f: 0.0026, c: 'rgba(8,30,44,0.45)' },
    { p: 0.6, h: 105, f: 0.0045, c: 'rgba(5,20,30,0.65)' }
  ];
  for (const L of layers) {
    ctx.fillStyle = L.c;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let sx = 0; sx <= W + 12; sx += 12) {
      const wx = cam.x * L.p + (sx - W / 2) / z;
      const hh = L.h * (0.55 + 0.3 * Math.sin(wx * L.f) + 0.15 * Math.sin(wx * L.f * 2.7 + 1.3)) * z;
      ctx.lineTo(sx, floorY - hh);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSeaweed(ctx, cam, bx, height, width, color, phase, lean) {
  const n = 10;
  const left = [], right = [];
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    const sway = Math.sin(cam.t * 1.3 + phase + f * 2.5) * (10 + height * 0.07) * f * f + lean * f;
    const halfW = width * 0.5 * (1 - f * 0.85) * (1 + Math.sin(f * Math.PI) * 0.3);
    const wx = bx + sway, wy = cam.floorY + 4 - height * f;
    left.push(sceneToScreen(cam, wx - halfW, wy));
    right.push(sceneToScreen(cam, wx + halfW, wy));
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let k = 1; k <= n; k++) ctx.lineTo(left[k].x, left[k].y);
  for (let k = n; k >= 0; k--) ctx.lineTo(right[k].x, right[k].y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = Math.max(0.6, width * 0.12 * cam.z);
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const mx = (left[k].x + right[k].x) / 2, my = (left[k].y + right[k].y) / 2;
    if (k === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
  }
  ctx.stroke();
}

function drawRock(ctx, cam, cx, s, seed) {
  const pts = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const rr = s * (0.78 + 0.3 * hash1(seed + k * 3.7));
    pts.push(sceneToScreen(cam, cx + Math.cos(a) * rr, cam.floorY + s * 0.3 + Math.sin(a) * rr * 0.72));
  }
  const top = sceneToScreen(cam, cx, cam.floorY - s * 0.5);
  const bottom = sceneToScreen(cam, cx, cam.floorY + s * 0.8);
  const hue = 20 + hash1(seed * 1.9) * 200;
  const light = 30 + hash1(seed * 2.3) * 10;
  const g = ctx.createLinearGradient(0, top.y, 0, bottom.y);
  g.addColorStop(0, `hsl(${hue},12%,${light + 12}%)`);
  g.addColorStop(1, `hsl(${hue},14%,${light - 14}%)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  const m0x = (pts[7].x + pts[0].x) / 2, m0y = (pts[7].y + pts[0].y) / 2;
  ctx.moveTo(m0x, m0y);
  for (let k = 0; k < 8; k++) {
    const p = pts[k], q = pts[(k + 1) % 8];
    ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
  }
  ctx.closePath();
  ctx.fill();

  const c = sceneToScreen(cam, cx - s * 0.25, cam.floorY - s * 0.05);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, s * 0.35 * cam.z, s * 0.16 * cam.z, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawStarfish(ctx, cam, x, y, r, rot, color) {
  const p = sceneToScreen(cam, x, y);
  const R = r * cam.z;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = rot + (k / 10) * Math.PI * 2;
    const rr = k % 2 === 0 ? R : R * 0.45;
    const px = p.x + Math.cos(a) * rr, py = p.y + Math.sin(a) * rr * 0.6;
    if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, R * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

function drawShell(ctx, cam, x, y, r, color) {
  const p = sceneToScreen(cam, x, y);
  const R = r * cam.z;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + R * 0.4);
  ctx.arc(p.x, p.y, R, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = Math.max(0.6, cam.z);
  for (let k = 1; k < 5; k++) {
    const a = Math.PI * (1.05 + 0.9 * k / 5);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + R * 0.4);
    ctx.lineTo(p.x + Math.cos(a) * R * 0.95, p.y + Math.sin(a) * R * 0.95);
    ctx.stroke();
  }
}

function drawSeabed(ctx, cam) {
  const { W, H, z } = cam;
  const floorY = sceneToScreen(cam, 0, cam.floorY).y;
  if (floorY - 280 * z > H) return;

  const wxMin = cam.x - W / 2 / z - 150, wxMax = cam.x + W / 2 / z + 150;
  const i0 = Math.floor(wxMin / DECOR_CELL), i1 = Math.floor(wxMax / DECOR_CELL);

  // seaweed grows behind everything else on the bed
  for (let i = i0; i <= i1; i++) {
    if (hash1(i * 1.37) >= 0.5) continue;
    const count = 1 + Math.floor(hash1(i * 7.7) * 3);
    for (let b = 0; b < count; b++) {
      const bx = (i + hash1(i * 3.1 + b)) * DECOR_CELL;
      const height = 70 + hash1(i * 5.3 + b * 2.1) * 190;
      const width = 11 + hash1(i * 9.1 + b) * 10;
      const color = shade(SEAWEED_COLORS[Math.floor(hash1(i * 2.9 + b) * SEAWEED_COLORS.length)], -0.15);
      drawSeaweed(ctx, cam, bx, height, width, color, hash1(i * 4.7 + b) * 6.28, (hash1(i * 6.1 + b) - 0.5) * 24);
    }
  }

  // sand, with a gently bumpy top edge that never rises above the real floor line
  if (floorY < H) {
    const g = ctx.createLinearGradient(0, floorY, 0, Math.min(H, floorY + 200 * z));
    g.addColorStop(0, '#6b5a3e');
    g.addColorStop(1, '#2a2015');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let sx = 0; sx <= W + 16; sx += 16) {
      const wx = cam.x + (sx - W / 2) / z;
      ctx.lineTo(sx, floorY + (4 + 2.5 * Math.sin(wx * 0.03) + 1.5 * Math.sin(wx * 0.071)) * z);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 2;
    for (let k = 1; k < 6; k++) {
      const yy = floorY + 18 * z * k;
      if (yy > H) break;
      ctx.beginPath();
      for (let sx = 0; sx <= W; sx += 24) {
        const wx = cam.x + (sx - W / 2) / z;
        const yOff = Math.sin(wx * 0.01 + k) * 4 * z;
        if (sx === 0) ctx.moveTo(sx, yy + yOff); else ctx.lineTo(sx, yy + yOff);
      }
      ctx.stroke();
    }
  }

  // rocks, starfish and shells sit on top of the sand
  for (let i = i0; i <= i1; i++) {
    const h = hash1(i * 1.37);
    const cx = (i + 0.5 + (hash1(i * 8.3) - 0.5) * 0.6) * DECOR_CELL;
    if (h >= 0.5 && h < 0.72) {
      let s = 16 + hash1(i * 4.4) * 40;
      if (hash1(i * 8.8) > 0.85) s *= 1.8;
      drawRock(ctx, cam, cx, s, i * 13.1);
    } else if (h >= 0.72 && h < 0.78) {
      drawStarfish(ctx, cam, cx, cam.floorY + 8 + hash1(i * 2.2) * 12, 7 + hash1(i * 3.3) * 5,
        hash1(i * 5.5) * 6.28, STARFISH_COLORS[Math.floor(hash1(i * 6.6) * STARFISH_COLORS.length)]);
    } else if (h >= 0.78 && h < 0.83) {
      drawShell(ctx, cam, cx, cam.floorY + 10 + hash1(i * 2.4) * 10, 5 + hash1(i * 3.9) * 4,
        `hsl(${20 + hash1(i * 7.1) * 30},60%,${70 + hash1(i * 7.9) * 15}%)`);
    }
  }
}

function drawVignette(ctx, cam) {
  const { W, H, df } = cam;
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,10,20,${0.3 + 0.2 * df})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
