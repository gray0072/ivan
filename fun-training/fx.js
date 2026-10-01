// Shared drawing helpers for the scenes, and confetti above the victory dialog.

// ctx.roundRect is missing in older browsers (e.g. LG webOS TVs, Chromium < 99): without it every scene
// throws on its first frame. Radii: a number or an array of 1–4 numbers, as in the standard.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii = 0) {
    const r = Array.isArray(radii) ? radii.map(Number) : [Number(radii)];
    let [tl, tr, br, bl] = r.length === 1 ? [r[0], r[0], r[0], r[0]]
      : r.length === 2 ? [r[0], r[1], r[0], r[1]]
      : r.length === 3 ? [r[0], r[1], r[2], r[1]]
      : r;
    if (w < 0) { x += w; w = -w; [tl, tr, br, bl] = [tr, tl, bl, br]; }
    if (h < 0) { y += h; h = -h; [tl, tr, br, bl] = [bl, br, tr, tl]; }
    const k = Math.min(1, w / (tl + tr || 1), w / (bl + br || 1), h / (tl + bl || 1), h / (tr + br || 1));
    tl *= k; tr *= k; br *= k; bl *= k;
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.arcTo(x + w, y, x + w, y + tr, tr);
    this.lineTo(x + w, y + h - br);
    this.arcTo(x + w, y + h, x + w - br, y + h, br);
    this.lineTo(x + bl, y + h);
    this.arcTo(x, y + h, x, y + h - bl, bl);
    this.lineTo(x, y + tl);
    this.arcTo(x, y, x + tl, y, tl);
    this.closePath();
  };
}

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
  let sparks = [], fireLeft = 0, nextBurst = 0; // fireworks: bursts of sparks for fireLeft s

  function init(el) {
    canvas = el;
    ctx = canvas.getContext('2d');
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    dpr = Quality.canvasScale(w, h);
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

  // A firework: a ring of sparks at a random spot in the upper part of the screen.
  function burst() {
    const x = w * (0.15 + Math.random() * 0.7), y = h * (0.12 + Math.random() * 0.35);
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    const n = Math.round(48 * Quality.confetti()), v = Math.min(w, h) * (0.22 + Math.random() * 0.12);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, k = v * (0.75 + Math.random() * 0.25);
      sparks.push({ x, y, vx: Math.cos(a) * k, vy: Math.sin(a) * k, t: 0, life: 1.1 + Math.random() * 0.4, c });
    }
    Sfx.firework();
  }

  // fireworks: s of fireworks bursts over the confetti (a completed level).
  function start(fireworks = 0) {
    resize();
    parts = [];
    sparks = [];
    fireLeft = fireworks;
    nextBurst = 0.2;
    spawn(Math.round(160 * Quality.confetti()));
    spawnLeft = 3;
    running = true;
    canvas.hidden = false;
  }

  function stop() {
    running = false;
    parts = [];
    sparks = [];
    fireLeft = 0;
    if (canvas) { canvas.hidden = true; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  function update(dt) {
    if (!running) return;
    if (spawnLeft > 0) { spawnLeft -= dt; spawn(Math.floor(dt * 40 * Quality.confetti() + Math.random())); }
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
    if (fireLeft > 0) {
      fireLeft -= dt;
      nextBurst -= dt;
      if (nextBurst <= 0) { burst(); nextBurst = 0.35 + Math.random() * 0.4; }
    }
    for (const s of sparks) {
      s.t += dt;
      s.vx *= 1 - 1.6 * dt;
      s.vy = s.vy * (1 - 1.6 * dt) + 160 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      ctx.globalAlpha = Math.max(0, 1 - s.t / s.life);
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.6 * Math.max(1, h / 900), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    sparks = sparks.filter(s => s.t < s.life);
    if (!parts.length && !sparks.length && spawnLeft <= 0 && fireLeft <= 0) stop();
  }

  return { init, start, stop, update, resize };
})();
