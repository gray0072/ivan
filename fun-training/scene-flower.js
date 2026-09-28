// "Grow a Flower" process: a pot on a sunny windowsill, a water gauge and a flower that wilts when dry.

// Petal looks per step (purely visual).
const FLOWER_KINDS = [
  { petal: '#ff6fa8', edge: '#e0407f', count: 6, round: 0.6 },
  { petal: '#ffcc33', edge: '#e89a10', count: 8, round: 0.45 },
  { petal: '#b36bff', edge: '#8440d8', count: 5, round: 0.75 },
  { petal: '#ff5a4a', edge: '#d0302a', count: 7, round: 0.55 },
  { petal: '#6fb8ff', edge: '#3a86e0', count: 6, round: 0.7 },
  { petal: '#ff9f43', edge: '#e0701a', count: 10, round: 0.4 },
  { petal: '#ffffff', edge: '#d9d2e6', count: 12, round: 0.35 },
];

function createFlowerScene(opts) {
  const DW = 1000, DH = 760;
  const kind = FLOWER_KINDS[opts.step % FLOWER_KINDS.length];
  const POT_X = 390, SOIL_Y = 482, SILL_Y = 620;
  const G = { x: 815, y: 250, w: 58, h: 340 }; // water gauge
  const CAN = { x: 225, y: 330 };             // watering can body centre

  let t = 0;
  let water = 1;          // level shown in the gauge (eases up after watering)
  let wilt = 0;           // 0 fresh … 1 fully wilted
  let growth = 0.05, growTarget = 0.05;
  let can = 0;            // s left of the watering can animation
  let state = 'play', endT = 0;
  let drops = [], falling = [], sparkles = [];
  const clouds = [0, 1, 2].map(i => ({ x: 120 + i * 230, y: 110 + (i % 2) * 60, s: 0.7 + i * 0.15, v: 6 + i * 3 }));
  let head = { x: POT_X, y: 300, a: -Math.PI / 2, r: 20 };
  let stemPts = [];
  let boss = null;        // caterpillar climbing the stem: { hp, u (0 base … 1 head), hitT }
  let butterfly = null;   // the beaten caterpillar flies away

  function bossStart() { boss = { hp: BOSS_HITS, u: 0, hitT: 0 }; }

  function bossHit(hp) {
    boss.hp = hp;
    boss.hitT = 0.6;
    can = FLOWER_CAN_TIME;
    Sfx.pour();
  }

  function correct(done, total) {
    growTarget = 0.05 + 0.95 * (done / total);
    can = FLOWER_CAN_TIME;
    Sfx.pour();
  }

  function wrong() {}

  function win() {
    state = 'win';
    endT = 0;
    growTarget = 1;
    if (boss) {
      const c = caterpillarPos(boss.u);
      butterfly = { x: c.x, y: c.y, t: 0 };
      boss = null;
      Sfx.star();
    }
    can = FLOWER_CAN_TIME;
    Sfx.pour();
  }

  function lose() {
    state = 'lose';
    endT = 0;
    const n = kind.count;
    for (let i = 0; i < n; i++) {
      falling.push({ x: head.x + (Math.random() - 0.5) * 40, y: head.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 60, vy: 20 + Math.random() * 40, a: Math.random() * 6, va: (Math.random() - 0.5) * 4, ph: Math.random() * 6 });
    }
  }

  function update(dt, f) {
    t += dt;
    if (state !== 'play') endT += dt;
    if (boss && state === 'play') boss.u = 1 - f;
    if (boss) { boss.hitT = Math.max(0, boss.hitT - dt); f = 1; } // the gauge stays full during the boss
    if (state === 'win') f = 1;
    if (water < f) water = Math.min(f, water + dt / FLOWER_REFILL_TIME);
    else water = f;
    if (butterfly) butterfly.t += dt;
    const target = state === 'lose' ? 1 : state === 'win' ? 0 : clamp((DANGER_LEVEL - water) / DANGER_LEVEL, 0, 1);
    wilt = target > wilt ? Math.min(target, wilt + FLOWER_WILT_RATE * dt * (state === 'lose' ? 0.5 : 1)) : Math.max(target, wilt - FLOWER_HEAL_RATE * dt);
    growth += (growTarget - growth) * (1 - Math.exp(-dt * FLOWER_GROW_RATE * 3));

    if (can > 0) {
      can -= dt;
      const p = 1 - can / FLOWER_CAN_TIME;
      if (p > 0.25 && p < 0.85) {
        const tip = canTip(canTilt(p));
        for (let i = 0; i < 2; i++) drops.push({ x: tip.x, y: tip.y, vx: 100 + Math.random() * 40, vy: 40 + Math.random() * 60 });
      }
    }
    for (const d of drops) { d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt; }
    drops = drops.filter(d => d.y < SOIL_Y);
    for (const p of falling) {
      p.ph += dt * 3; p.vy = Math.min(p.vy + 60 * dt, 90); p.x += (p.vx + Math.sin(p.ph) * 30) * dt; p.y += p.vy * dt; p.a += p.va * dt;
      if (p.y > SILL_Y - 4) { p.y = SILL_Y - 4; p.vx = 0; p.va = 0; p.vy = 0; }
    }
    if (state === 'win' && Math.random() < dt * 25) {
      const a = Math.random() * 6.28, d = 60 + Math.random() * 120;
      sparkles.push({ x: head.x + Math.cos(a) * d, y: head.y + Math.sin(a) * d * 0.8, life: 0, max: 0.7 + Math.random() * 0.6, r: 8 + Math.random() * 12 });
    }
    for (const s of sparkles) s.life += dt;
    sparkles = sparkles.filter(s => s.life < s.max);
  }

  const canTilt = p => (p < 0.2 ? p / 0.2 : p > 0.85 ? (1 - p) / 0.15 : 1) * 0.65;
  function canTip(tilt) {
    const lx = 100, ly = -42;
    return { x: CAN.x + lx * Math.cos(tilt) - ly * Math.sin(tilt), y: CAN.y + lx * Math.sin(tilt) + ly * Math.cos(tilt) };
  }

  // ---- drawing ----

  function drawRoom(ctx, v) {
    const wall = ctx.createLinearGradient(0, v.y0, 0, SILL_Y);
    wall.addColorStop(0, '#ffe6c2');
    wall.addColorStop(1, '#f7cf9f');
    ctx.fillStyle = wall;
    ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, SILL_Y - v.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let x = Math.floor(v.x0 / 60) * 60; x < v.x1; x += 60) ctx.fillRect(x, v.y0, 22, SILL_Y - v.y0);

    // Window with sky, sun and clouds.
    const wx = 90, wy = 70, ww = 600, wh = 470;
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, '#5cc2ff');
    sky.addColorStop(1, '#d4f1ff');
    ctx.fillStyle = sky;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx, wy, ww, wh);
    ctx.clip();
    const sx = 575, sy = 165;
    const glow = ctx.createRadialGradient(sx, sy, 20, sx, sy, 160);
    glow.addColorStop(0, 'rgba(255,245,170,0.9)');
    glow.addColorStop(1, 'rgba(255,245,170,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 160, sy - 160, 320, 320);
    ctx.strokeStyle = 'rgba(255,220,90,0.6)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = t * 0.2 + (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * 62, sy + Math.sin(a) * 62);
      ctx.lineTo(sx + Math.cos(a) * 84, sy + Math.sin(a) * 84);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd84a';
    ctx.beginPath();
    ctx.arc(sx, sy, 50, 0, Math.PI * 2);
    ctx.fill();
    for (const c of clouds) {
      const x = wx - 120 + ((c.x + t * c.v) % (ww + 240));
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.ellipse(x, c.y, 60 * c.s, 24 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 34 * c.s, c.y + 6, 34 * c.s, 20 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 30 * c.s, c.y - 12 * c.s, 36 * c.s, 26 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Far hills.
    ctx.fillStyle = '#8fd88a';
    ctx.beginPath();
    ctx.moveTo(wx, wy + wh);
    for (let x = 0; x <= ww; x += 20) ctx.lineTo(wx + x, wy + wh - 70 - Math.sin(x / 90) * 24 - Math.sin(x / 37) * 8);
    ctx.lineTo(wx + ww, wy + wh);
    ctx.fill();
    ctx.restore();
    // Frame and mullions.
    ctx.strokeStyle = '#fffaf2';
    ctx.lineWidth = 22;
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh * 0.45);
    ctx.lineTo(wx + ww, wy + wh * 0.45);
    ctx.stroke();
    // Curtains.
    for (const side of [-1, 1]) {
      const cx = side < 0 ? wx - 20 : wx + ww + 20;
      ctx.fillStyle = '#ff8fa3';
      ctx.beginPath();
      ctx.moveTo(cx - 55, wy - 30);
      ctx.lineTo(cx + 55, wy - 30);
      for (let y = wy - 30; y <= wy + wh + 40; y += 20) ctx.lineTo(cx + 45 + Math.sin(y / 30) * 8, y);
      ctx.lineTo(cx - 55, wy + wh + 40);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,60,90,0.35)';
      ctx.lineWidth = 5;
      for (const dx of [-25, 5, 30]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx, wy - 20);
        ctx.lineTo(cx + dx + Math.sin(dx) * 6, wy + wh + 30);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#c96b7e';
    ctx.fillRect(wx - 100, wy - 44, ww + 200, 16);

    // Sill and lower wall.
    ctx.fillStyle = '#e8b27e';
    ctx.fillRect(v.x0, SILL_Y + 60, v.x1 - v.x0, v.y1 - SILL_Y);
    const wood = ctx.createLinearGradient(0, SILL_Y, 0, SILL_Y + 60);
    wood.addColorStop(0, '#c98a52');
    wood.addColorStop(0.45, '#b0703c');
    wood.addColorStop(1, '#7d4a24');
    ctx.fillStyle = wood;
    ctx.fillRect(v.x0, SILL_Y, v.x1 - v.x0, 60);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(v.x0, SILL_Y + 60, v.x1 - v.x0, 16);
  }

  function drawPot(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(POT_X, SILL_Y + 4, 110, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(POT_X - 110, 0, POT_X + 110, 0);
    g.addColorStop(0, '#b04e2a');
    g.addColorStop(0.4, '#e07a45');
    g.addColorStop(1, '#a3431f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(POT_X - 108, 500);
    ctx.lineTo(POT_X + 108, 500);
    ctx.lineTo(POT_X + 80, SILL_Y);
    ctx.lineTo(POT_X - 80, SILL_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c95f33';
    ctx.beginPath();
    ctx.roundRect(POT_X - 126, 466, 252, 38, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(POT_X - 118, 472, 236, 8);
    ctx.fillStyle = '#5a3a22';
    ctx.beginPath();
    ctx.ellipse(POT_X, SOIL_Y - 8, 110, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wet soil darkens right after watering.
    ctx.fillStyle = `rgba(40,20,10,${0.5 * clamp(water - 0.6, 0, 0.4) / 0.4})`;
    ctx.beginPath();
    ctx.ellipse(POT_X, SOIL_Y - 8, 100, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Heart on the pot.
    ctx.fillStyle = '#ffd1a8';
    ctx.beginPath();
    const hx = POT_X, hy = 548;
    ctx.moveTo(hx, hy + 18);
    ctx.bezierCurveTo(hx - 34, hy - 6, hx - 16, hy - 26, hx, hy - 10);
    ctx.bezierCurveTo(hx + 16, hy - 26, hx + 34, hy - 6, hx, hy + 18);
    ctx.fill();
  }

  function leafColor() {
    return wilt < 0.55 ? mixColor('#46b04a', '#d8c43a', wilt / 0.55) : mixColor('#d8c43a', '#9a6d3a', (wilt - 0.55) / 0.45);
  }

  function drawLeaf(ctx, x, y, a, len, wid) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = leafColor();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -wid, len, 0);
    ctx.quadraticCurveTo(len * 0.45, wid, 0, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,60,0,0.3)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(len * 0.85, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlant(ctx) {
    const loseP = state === 'lose' ? smooth(0, 1, endT / END_ANIM_TIME) : 0;
    const Hs = 70 + growth * 290;
    const N = 16;
    const sway = Math.sin(t * 1.3) * 0.05 * (1 - wilt);
    const bend = wilt * 1.6 + loseP * 1.1;
    const pts = [{ x: POT_X, y: SOIL_Y - 10, a: -Math.PI / 2 }];
    let x = POT_X, y = SOIL_Y - 10;
    for (let i = 1; i <= N; i++) {
      const u = i / N;
      const a = -Math.PI / 2 + sway * u + bend * u * u;
      x += Math.cos(a) * (Hs / N);
      y += Math.sin(a) * (Hs / N);
      pts.push({ x, y, a });
    }
    const stemCol = mixColor('#3f9a3c', '#a89a3a', wilt * 0.8);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [w, c] of [[14, 'rgba(0,50,0,0.35)'], [10, stemCol]]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    }
    const leaves = [[0.16, -1, 0], [0.26, 1, 0], [0.45, -1, 0.25], [0.58, 1, 0.45], [0.72, -1, 0.65]];
    for (const [u, side, minG] of leaves) {
      const k = smooth(minG, minG + 0.2, growth);
      if (k <= 0) continue;
      const p = pts[Math.round(u * N)];
      const a = p.a + side * (1.05 - wilt * 0.2) + side * wilt * 1.1 + Math.sin(t * 2 + u * 9) * 0.04;
      const len = (30 + 42 * growth) * k * (1 - wilt * 0.15);
      drawLeaf(ctx, p.x, p.y, a, len, len * 0.42);
    }
    stemPts = pts;
    const tip = pts[N];
    head = { x: tip.x, y: tip.y, a: tip.a };
    drawHead(ctx, tip.x, tip.y, tip.a + Math.PI / 2, loseP);
  }

  function drawHead(ctx, x, y, rot, loseP) {
    const open = smooth(0.28, 0.8, growth);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (open < 0.04) {
      const s = 10 + growth * 40;
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.5, s * 0.45, s * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = kind.petal;
      ctx.globalAlpha = growth * 3;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.8, s * 0.2, s * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    const petalsLeft = 1 - loseP;
    const L = (16 + 50 * open) * (1 - wilt * 0.28);
    const W = L * kind.round;
    const col = mixColor(kind.petal, '#a7865a', wilt * 0.85);
    const edge = mixColor(kind.edge, '#7a5a38', wilt * 0.85);
    const R = 12 + 13 * open;
    ctx.save();
    ctx.scale(1, 1 - wilt * 0.25);
    if (petalsLeft > 0.02) {
      ctx.globalAlpha = petalsLeft;
      for (let i = 0; i < kind.count; i++) {
        const a = (i / kind.count) * Math.PI * 2 + t * 0.05 * (state === 'win' ? 6 : 0);
        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -R * 0.6);
        ctx.fillStyle = col;
        ctx.strokeStyle = edge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, -L / 2, W / 2, L / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // Centre with a face.
    ctx.fillStyle = mixColor('#ffcf33', '#8a6a2a', wilt);
    ctx.strokeStyle = mixColor('#e89a10', '#5a4018', wilt);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (open > 0.4) {
      ctx.rotate(-rot * 0.6); // face stays roughly upright
      ctx.fillStyle = '#3a2410';
      const blink = (t % 4) < 0.12 ? 0.2 : 1;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(s * R * 0.36, -R * 0.12 + wilt * R * 0.08, R * 0.12, R * 0.14 * blink, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const k = 1 - 2 * clamp(wilt * 1.4, 0, 1);
      ctx.strokeStyle = '#3a2410';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-R * 0.36, R * 0.3);
      ctx.quadraticCurveTo(0, R * 0.3 + k * R * 0.38, R * 0.36, R * 0.3);
      ctx.stroke();
      if (wilt < 0.4) {
        ctx.fillStyle = `rgba(255,110,130,${0.5 * (1 - wilt / 0.4)})`;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * R * 0.62, R * 0.2, R * 0.16, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    ctx.restore();
  }

  function drawGauge(ctx) {
    const { x, y, w, h } = G;
    const low = water < DANGER_LEVEL;
    const warn = water < WARN_LEVEL && Math.sin(t * 12) > 0;
    // Drop icon.
    ctx.fillStyle = '#3fa9f5';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 70);
    ctx.bezierCurveTo(x + w / 2 + 26, y - 36, x + w / 2 + 22, y - 14, x + w / 2, y - 14);
    ctx.bezierCurveTo(x + w / 2 - 22, y - 14, x + w / 2 - 26, y - 36, x + w / 2, y - 70);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, w / 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 6, w - 12, h - 12, (w - 12) / 2);
    ctx.clip();
    const top = y + 6 + (h - 12) * (1 - water);
    const wg = ctx.createLinearGradient(x, 0, x + w, 0);
    wg.addColorStop(0, '#2b8fe0');
    wg.addColorStop(0.5, '#6cc6ff');
    wg.addColorStop(1, '#2b8fe0');
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    for (let i = 0; i <= 10; i++) ctx.lineTo(x + (w * i) / 10, top + Math.sin(t * 5 + i) * 2.5);
    ctx.lineTo(x + w, y + h);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 4; i++) {
      const by = y + h - 10 - ((t * 40 + i * 83) % Math.max(1, y + h - top - 10));
      if (by > top + 4) { ctx.beginPath(); ctx.arc(x + 16 + ((i * 13) % (w - 30)), by, 3, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
    ctx.strokeStyle = warn ? '#ff3b3b' : low ? '#ff9f1a' : 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, w / 2);
    ctx.stroke();
    // Half mark.
    const hy = y + h / 2;
    ctx.strokeStyle = '#7a4a24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 14, hy);
    ctx.lineTo(x + 10, hy);
    ctx.stroke();
    ctx.fillStyle = '#7a4a24';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('½', x - 18, hy);
  }

  function drawCan(ctx) {
    if (can <= 0) return;
    const p = 1 - can / FLOWER_CAN_TIME;
    const tilt = canTilt(p);
    const alpha = clamp(Math.min(p / 0.1, (1 - p) / 0.1), 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(CAN.x - (1 - alpha) * 60, CAN.y);
    ctx.rotate(tilt);
    ctx.fillStyle = '#3fa0f0';
    ctx.strokeStyle = '#1f6fb8';
    ctx.lineWidth = 5;
    // Spout.
    ctx.beginPath();
    ctx.moveTo(35, 10);
    ctx.lineTo(95, -38);
    ctx.lineTo(104, -30);
    ctx.lineTo(45, 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(100, -42, 10, 16, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Handle.
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(-20, -30, 30, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    // Body.
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(-55, -30, 100, 70, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-44, -20, 14, 48);
    ctx.restore();
    ctx.strokeStyle = 'rgba(80,170,255,0.85)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const d of drops) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.vx * 0.02, d.y - d.vy * 0.02);
      ctx.stroke();
    }
  }

  function drawParticles(ctx) {
    for (const p of falling) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = mixColor(kind.petal, '#a7865a', 0.8);
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const s of sparkles) {
      const k = Math.sin((s.life / s.max) * Math.PI);
      ctx.fillStyle = `rgba(255,230,80,${k})`;
      starPath(ctx, s.x, s.y, s.r * k, 0.35);
      ctx.fill();
    }
  }

  // Point on the stem at u (0 base … 1 head), with the stem angle there.
  function caterpillarPos(u) {
    if (!stemPts.length) return { x: POT_X, y: SOIL_Y, a: -Math.PI / 2 };
    const k = clamp(u, 0, 1) * (stemPts.length - 1);
    const i = Math.min(stemPts.length - 2, Math.floor(k));
    const a = stemPts[i], b = stemPts[i + 1], s = k - i;
    return { x: lerp(a.x, b.x, s), y: lerp(a.y, b.y, s), a: b.a };
  }

  function drawCaterpillar(ctx) {
    if (!boss) return;
    const shake = boss.hitT > 0 ? Math.sin(t * 60) * 5 * boss.hitT : 0;
    const munch = state === 'lose';
    const seg = 7;
    for (let i = seg - 1; i >= 0; i--) {
      const c = caterpillarPos(boss.u - i * 0.045 * (0.9 + 0.1 * Math.sin(t * 6)));
      const nx = Math.cos(c.a + Math.PI / 2), ny = Math.sin(c.a + Math.PI / 2);
      const off = 12 + Math.sin(t * 8 - i * 0.9) * 3;
      const x = c.x + nx * off + shake, y = c.y + ny * off;
      const r = i === 0 ? 17 : 13 - i * 0.6;
      ctx.fillStyle = i % 2 ? '#7cc83c' : '#96dc4a';
      ctx.strokeStyle = '#4a8a1e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (i > 0) {
        ctx.fillStyle = '#ffd23f';
        ctx.beginPath(); ctx.arc(x - nx * 3, y - ny * 3, 3, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      // Head: eyes, antennae, and hearts for its hits left.
      ctx.strokeStyle = '#3a5a1a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 14); ctx.lineTo(x - 12, y - 28);
      ctx.moveTo(x + 6, y - 14); ctx.lineTo(x + 12, y - 28);
      ctx.stroke();
      ctx.fillStyle = '#ff5c8a';
      ctx.beginPath(); ctx.arc(x - 12, y - 29, 4, 0, Math.PI * 2); ctx.arc(x + 12, y - 29, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - 6, y - 3, 6, 0, Math.PI * 2); ctx.arc(x + 6, y - 3, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222';
      if (boss.hitT > 0) {
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x', x - 6, y - 3);
        ctx.fillText('x', x + 6, y - 3);
      } else {
        ctx.beginPath(); ctx.arc(x - 5, y - 2, 3, 0, Math.PI * 2); ctx.arc(x + 7, y - 2, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (munch) ctx.ellipse(x, y + 8, 5, 3 + Math.abs(Math.sin(t * 14)) * 4, 0, 0, Math.PI * 2);
      else ctx.arc(x, y + 5, 6, 0.2, Math.PI - 0.2);
      ctx.stroke();
      drawHearts(ctx, x + 36, y - 34, boss.hp);
    }
    if (boss.hitT > 0) {
      const c = caterpillarPos(boss.u);
      ctx.fillStyle = `rgba(100,190,255,${boss.hitT})`;
      for (let i = 0; i < 8; i++) {
        const a = i * 0.8 + t * 3;
        ctx.beginPath();
        ctx.arc(c.x + Math.cos(a) * 30, c.y + Math.sin(a) * 26, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawButterfly(ctx) {
    if (!butterfly) return;
    const b = butterfly;
    const x = b.x + b.t * 160 + Math.sin(b.t * 3) * 30, y = b.y - b.t * 140 + Math.sin(b.t * 5) * 12;
    const flap = Math.abs(Math.sin(b.t * 14));
    ctx.save();
    ctx.translate(x, y);
    for (const s of [-1, 1]) {
      ctx.fillStyle = s < 0 ? '#ff7eb6' : '#b36bff';
      ctx.beginPath();
      ctx.ellipse(s * 16 * flap, -8, 18 * flap + 2, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.ellipse(s * 12 * flap, 10, 11 * flap + 1, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#3a2a4a';
    ctx.fillRect(-3, -18, 6, 36);
    ctx.restore();
  }

  function draw(ctx, W, H) {
    const v = fitScene(W, H, DW, DH);
    ctx.save();
    ctx.translate(v.ox, v.oy);
    ctx.scale(v.s, v.s);
    drawRoom(ctx, v);
    drawGauge(ctx);
    drawPot(ctx);
    drawPlant(ctx);
    drawCan(ctx);
    drawCaterpillar(ctx);
    drawButterfly(ctx);
    drawParticles(ctx);
    ctx.restore();
  }

  return { correct, wrong, win, lose, update, draw, bossStart, bossHit };
}
