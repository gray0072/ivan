'use strict';

// Background art. Everything here is stateless: decorations are derived from a hash of their
// world-space cell, so the infinite seabed looks the same every time you swim past a spot.
// cam: { x, y, z, floorY, df (0 = shallow .. 1 = sea floor), t (seconds), W, H }

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

function drawWater(ctx, cam) {
  const { W, H, df, t } = cam;

  // bright/shallow near the surface, dark near the sea floor
  const br = Math.round(lerp(96, 3, df));
  const bg = Math.round(lerp(186, 10, df));
  const bb = Math.round(lerp(212, 24, df));
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, `rgb(${clamp(br + 25, 0, 255)},${clamp(bg + 45, 0, 255)},${clamp(bb + 55, 0, 255)})`);
  grad.addColorStop(1, `rgb(${br},${bg},${bb})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // light rays from the surface, fading out with depth
  const rayAlpha = 0.1 * (1 - df);
  if (rayAlpha > 0.004) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const span = W * 1.8;
    for (let i = 0; i < 6; i++) {
      let x = (i * W * 0.31 - cam.x * 0.05) % span;
      if (x < 0) x += span;
      x = x - W * 0.4 + Math.sin(t * 0.25 + i * 1.7) * 30;
      const topW = 30 + hash1(i) * 50;
      const skew = H * 0.35;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(255,255,255,${rayAlpha})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + topW, 0);
      ctx.lineTo(x + topW * 3 + skew, H);
      ctx.lineTo(x + skew, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

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
      ctx.fillStyle = df > 0.6
        ? `rgba(160,235,255,${0.15 + h * 0.4})`
        : `rgba(255,255,255,${0.12 + h * 0.3})`;
      ctx.beginPath();
      ctx.arc(px, py, 0.8 + h * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
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
