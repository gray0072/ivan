// Shared drawing helpers for the scenes, and confetti above the victory dialog.

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

const hexCache = {};
function hexRgb(h) {
  if (!hexCache[h]) hexCache[h] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  return hexCache[h];
}
// Blend two #rrggbb colours.
function mixColor(a, b, t) {
  const x = hexRgb(a), y = hexRgb(b);
  return `rgb(${Math.round(lerp(x[0], y[0], t))},${Math.round(lerp(x[1], y[1], t))},${Math.round(lerp(x[2], y[2], t))})`;
}

// Fit a DW×DH design space into a W×H canvas, centred horizontally and anchored to the bottom.
// x0..x1 / y0..y1 = the whole canvas in design units, for full-bleed backgrounds.
function fitScene(W, H, DW, DH) {
  const s = Math.min(W / DW, H / DH);
  const ox = (W - DW * s) / 2;
  const oy = H - DH * s;
  return { s, ox, oy, x0: -ox / s, x1: (W - ox) / s, y0: -oy / s, y1: DH };
}

function starPath(ctx, x, y, r, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

// A boss's hits left as a row of hearts centred at x.
function drawHearts(ctx, x, y, hp, size = 14) {
  for (let i = 0; i < BOSS_HITS; i++) {
    const hx = x + (i - (BOSS_HITS - 1) / 2) * size * 2.2;
    ctx.beginPath();
    ctx.moveTo(hx, y + size * 0.9);
    ctx.bezierCurveTo(hx - size * 1.6, y - size * 0.2, hx - size * 0.6, y - size * 1.3, hx, y - size * 0.4);
    ctx.bezierCurveTo(hx + size * 0.6, y - size * 1.3, hx + size * 1.6, y - size * 0.2, hx, y + size * 0.9);
    ctx.fillStyle = i < hp ? '#ff3b5c' : 'rgba(255,255,255,0.35)';
    ctx.fill();
    ctx.strokeStyle = '#6a1a2a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

const Confetti = (() => {
  const COLORS = ['#ff4f7b', '#ffd23f', '#3ddc97', '#5b7cff', '#ff9f43', '#b36bff', '#4fd8ff'];
  let canvas, ctx, parts = [], running = false, spawnLeft = 0, w = 0, h = 0, dpr = 1;

  function init(el) {
    canvas = el;
    ctx = canvas.getContext('2d');
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function spawn(n) {
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * w, y: -20 - Math.random() * h * 0.3,
        vx: (Math.random() - 0.5) * 120, vy: 80 + Math.random() * 160,
        s: (6 + Math.random() * 8) * Math.max(1, h / 900),
        a: Math.random() * 6.28, va: (Math.random() - 0.5) * 10,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        ph: Math.random() * 6.28,
      });
    }
  }

  function start() {
    resize();
    parts = [];
    spawn(160);
    spawnLeft = 3;
    running = true;
    canvas.hidden = false;
  }

  function stop() {
    running = false;
    parts = [];
    if (canvas) { canvas.hidden = true; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  function update(dt) {
    if (!running) return;
    if (spawnLeft > 0) { spawnLeft -= dt; spawn(Math.round(dt * 40)); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.ph += dt * 3;
      p.x += (p.vx + Math.sin(p.ph) * 40) * dt;
      p.y += p.vy * dt;
      p.a += p.va * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.scale(1, Math.abs(Math.cos(p.ph)) + 0.2);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    parts = parts.filter(p => p.y < h + 30);
    if (!parts.length && spawnLeft <= 0) stop();
  }

  return { init, start, stop, update, resize };
})();
