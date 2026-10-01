// "Balloon Flight" process: a hot-air balloon slowly sinks toward the sea; correct answers fire the burner.

const BALLOON_PALETTES = [
  ['#ff4f6d', '#ffd23f'],
  ['#3a86e0', '#ffffff'],
  ['#3ddc97', '#ff9f43'],
  ['#b36bff', '#4fd8ff'],
  ['#ff7eb6', '#fff1a8'],
];

function createBalloonScene(opts) {
  const DW = 1200, DH = 900;
  const SEA_Y = 760;
  const BX = 420;                          // balloon x
  const TOP = 470, BOTTOM = SEA_Y + 8;     // basket bottom y at f = 1 / f = 0
  const pal = BALLOON_PALETTES[opts.step % BALLOON_PALETTES.length];

  let t = 0, state = 'play', endT = 0;
  let alt = 1;                // shown altitude (eases up after a burn)
  let burn = 0;               // s left of the burner flame
  let fizzle = 0;             // wrong answer: a sad puff of smoke
  let progress = 0, progressShown = 0;
  let scroll = 0;
  let storm = null;           // boss: { hp, x, hitT, gone }
  let gusts = [];
  let splash = [];
  let rainbow = 0;
  let flash = 0;
  let thunderT = 2;
  let lastF = 1;

  function correct(done, total) {
    progress = done / total;
    burn = BALLOON_BURN_TIME;
    Sfx.burner();
  }

  function wrong() { fizzle = 0.8; }

  function bossStart() {
    storm = { hp: BOSS_HITS, hitT: 0 };
    Sfx.thunder();
    flash = 0.4;
  }

  function blowGust() {
    for (let i = 0; i < 10; i++) gusts.push({ x: BX + 60, y: TOP - 150 + (Math.random() - 0.5) * 120, t: -i * 0.03 });
    Sfx.whoosh();
  }

  function bossHit(hp) {
    storm.hp = hp;
    storm.hitT = 0.6;
    blowGust();
  }

  function win(done, total) {
    state = 'win';
    endT = 0;
    progress = 1;
    burn = BALLOON_BURN_TIME;
    Sfx.burner();
    if (storm) { blowGust(); storm.gone = true; rainbow = 0.01; }
  }

  function lose() {
    state = 'lose';
    endT = 0;
    if (storm) { flash = 0.5; Sfx.thunder(); }
    setTimeout(() => {
      Sfx.splash();
      for (let i = 0; i < 26; i++) splash.push({ x: BX + (Math.random() - 0.5) * 80, y: SEA_Y, vx: (Math.random() - 0.5) * 260, vy: -150 - Math.random() * 260, t: 0 });
    }, storm ? 350 : 0);
  }

  function update(dt, f) {
    t += dt;
    lastF = f;
    if (state !== 'play') endT += dt;
    let target = storm && !storm.gone ? 1 : f;
    if (state === 'lose') target = 0;
    if (alt < target) alt = Math.min(target, alt + dt / BALLOON_LIFT_TIME);
    else alt = state === 'lose' ? Math.max(0, alt - dt * 1.4) : target;
    if (state === 'win') alt = Math.min(1, alt + dt * 0.3);
    burn = Math.max(0, burn - dt);
    fizzle = Math.max(0, fizzle - dt);
    flash = Math.max(0, flash - dt);
    progressShown += (progress - progressShown) * Math.min(1, dt * 1.5);
    if (state !== 'lose') scroll += dt * 25;

    if (storm) {
      storm.hitT = Math.max(0, storm.hitT - dt);
      if (!storm.gone) {
        storm.x = lerp(BX + 150, 1150, f);
        thunderT -= dt;
        if (thunderT <= 0 && state === 'play') { thunderT = 2.5 + Math.random() * 2; flash = 0.25; Sfx.thunder(); }
      } else storm.x += dt * 500;
    }
    if (rainbow > 0) rainbow = Math.min(1, rainbow + dt * 0.8);
    for (const g of gusts) g.t += dt;
    gusts = gusts.filter(g => g.t < 0.6);
    for (const s of splash) { s.t += dt; s.vy += 700 * dt; s.x += s.vx * dt; s.y += s.vy * dt; }
    splash = splash.filter(s => s.t < 1.2);
  }

  // ---- drawing ----

  function basketY() { return lerp(BOTTOM, TOP, alt) + Math.sin(t * 1.6) * 5; }

  function drawSky(ctx, v) {
    const dark = storm && !storm.gone ? 0.5 : 0;
    const g = ctx.createLinearGradient(0, v.y0, 0, SEA_Y);
    g.addColorStop(0, mixColor('#4fb4ff', '#3a4a6a', dark));
    g.addColorStop(1, mixColor('#ffe9c8', '#8a90a8', dark));
    ctx.fillStyle = g;
    ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, SEA_Y - v.y0);
    ctx.fillStyle = `rgba(255,230,120,${1 - dark})`;
    ctx.beginPath();
    ctx.arc(1000, 150, 60, 0, Math.PI * 2);
    ctx.fill();
    if (rainbow > 0) {
      const cols = ['#ff4f4f', '#ff9f43', '#ffd23f', '#3ddc97', '#4fa8ff', '#8a5aff'];
      ctx.lineWidth = 16;
      cols.forEach((c, i) => {
        ctx.strokeStyle = c;
        ctx.globalAlpha = 0.7 * rainbow;
        ctx.beginPath();
        ctx.arc(820, SEA_Y, 420 - i * 16, Math.PI, Math.PI + Math.PI * rainbow);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    const span = v.x1 - v.x0 + 400;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 6; i++) {
      const x = v.x0 - 200 + ((((i * 330 - scroll * (0.6 + (i % 3) * 0.3)) % span) + span) % span);
      const y = 110 + (i % 3) * 110;
      const s = 0.7 + (i % 3) * 0.25;
      ctx.beginPath();
      ctx.ellipse(x, y, 70 * s, 24 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 40 * s, y + 6, 40 * s, 20 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 34 * s, y - 12 * s, 42 * s, 26 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Gulls.
    ctx.strokeStyle = 'rgba(40,40,60,0.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const x = ((((700 + i * 180 - scroll * 1.6) % span) + span) % span) + v.x0 - 200, y = 220 + i * 40 + Math.sin(t + i) * 10;
      const w = Math.sin(t * 6 + i) * 6;
      ctx.beginPath();
      ctx.moveTo(x - 14, y - w);
      ctx.quadraticCurveTo(x - 6, y - 8, x, y);
      ctx.quadraticCurveTo(x + 6, y - 8, x + 14, y - w);
      ctx.stroke();
    }
  }

  function drawIsland(ctx) {
    const x = lerp(1500, 900, progressShown);
    ctx.fillStyle = '#f2d79a';
    ctx.beginPath();
    ctx.ellipse(x, SEA_Y + 10, 230, 70, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6cbf4a';
    ctx.beginPath();
    ctx.ellipse(x + 20, SEA_Y - 30, 150, 30, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Palm tree.
    ctx.strokeStyle = '#8a5a2a';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 60, SEA_Y - 40);
    ctx.quadraticCurveTo(x - 80, SEA_Y - 130, x - 40, SEA_Y - 200);
    ctx.stroke();
    ctx.strokeStyle = '#2f9e44';
    ctx.lineWidth = 12;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.7 + Math.sin(t * 1.5 + i) * 0.05;
      ctx.beginPath();
      ctx.moveTo(x - 40, SEA_Y - 200);
      ctx.quadraticCurveTo(x - 40 + Math.cos(a) * 60, SEA_Y - 200 + Math.sin(a) * 50 - 20, x - 40 + Math.cos(a) * 100, SEA_Y - 200 + Math.sin(a) * 60 + 30);
      ctx.stroke();
    }
    // Flag.
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 90, SEA_Y - 50);
    ctx.lineTo(x + 90, SEA_Y - 170);
    ctx.stroke();
    ctx.fillStyle = pal[0];
    ctx.beginPath();
    ctx.moveTo(x + 90, SEA_Y - 170);
    ctx.quadraticCurveTo(x + 120, SEA_Y - 160 + Math.sin(t * 5) * 6, x + 150, SEA_Y - 155);
    ctx.lineTo(x + 90, SEA_Y - 135);
    ctx.fill();
  }

  function drawSea(ctx, v) {
    const g = ctx.createLinearGradient(0, SEA_Y, 0, v.y1);
    g.addColorStop(0, '#2f9ee8');
    g.addColorStop(1, '#155a9a');
    ctx.fillStyle = g;
    ctx.fillRect(v.x0, SEA_Y, v.x1 - v.x0, v.y1 - SEA_Y);
    for (let row = 0; row < 4; row++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.5 - row * 0.1})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      const y = SEA_Y + 12 + row * 34;
      for (let x = v.x0; x <= v.x1; x += 16) {
        const yy = y + Math.sin((x + scroll * (2 + row)) / 40 + t * 2 + row) * 5;
        if (x === v.x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // A shark fin circles when the balloon is low.
    const danger = state === 'play' && !storm && lastF < 0.35 || state === 'lose';
    if (danger) {
      const fx = BX + Math.sin(t * 1.2) * 180, fy = SEA_Y + 16;
      const dir = Math.cos(t * 1.2) > 0 ? 1 : -1;
      ctx.fillStyle = '#5a6a7a';
      ctx.beginPath();
      ctx.moveTo(fx - 24 * dir, fy);
      ctx.quadraticCurveTo(fx - 4 * dir, fy - 30, fx + 16 * dir, fy - 50);
      ctx.quadraticCurveTo(fx + 10 * dir, fy - 20, fx + 26 * dir, fy);
      ctx.fill();
    }
  }

  function drawBalloon(ctx) {
    const by = basketY();
    const deflate = state === 'lose' ? smooth(0.5, END_ANIM_TIME, endT) : 0;
    const tilt = state === 'lose' ? smooth(0.2, 1.2, endT) * 0.35 : Math.sin(t * 1.3) * 0.03;
    const ey = by - 200; // envelope centre
    ctx.save();
    ctx.translate(BX, by);
    ctx.rotate(tilt);
    ctx.translate(-BX, -by);
    // Envelope with stripes.
    ctx.save();
    ctx.translate(BX, ey + 110);
    ctx.scale(1 + deflate * 0.2, 1 - deflate * 0.55);
    ctx.translate(-BX, -(ey + 110));
    ctx.beginPath();
    ctx.moveTo(BX - 36, ey + 110);
    ctx.bezierCurveTo(BX - 150, ey + 40, BX - 150, ey - 150, BX, ey - 150);
    ctx.bezierCurveTo(BX + 150, ey - 150, BX + 150, ey + 40, BX + 36, ey + 110);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    for (let i = 4; i >= 0; i--) {
      ctx.fillStyle = pal[i % 2];
      ctx.beginPath();
      ctx.ellipse(BX, ey - 20, i * 34 + 17, 170, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const shade = ctx.createLinearGradient(BX - 150, 0, BX + 150, 0);
    shade.addColorStop(0, 'rgba(255,255,255,0.25)');
    shade.addColorStop(0.6, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = shade;
    ctx.fillRect(BX - 160, ey - 160, 320, 290);
    ctx.restore();
    ctx.restore();
    // Burner flame.
    if (burn > 0) {
      const k = Math.min(1, burn / 0.2) * (0.8 + Math.random() * 0.3);
      const fg = ctx.createLinearGradient(0, by - 80, 0, by - 80 - 60 * k);
      fg.addColorStop(0, '#ffd23f');
      fg.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(BX - 12, by - 78);
      ctx.quadraticCurveTo(BX, by - 80 - 80 * k, BX + 12, by - 78);
      ctx.fill();
    }
    if (fizzle > 0) {
      ctx.fillStyle = `rgba(90,90,100,${fizzle * 0.6})`;
      ctx.beginPath();
      ctx.arc(BX + 10, by - 90 - (0.8 - fizzle) * 50, 14 + (0.8 - fizzle) * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ropes and basket.
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(BX - 36, ey + 110); ctx.lineTo(BX - 34, by - 50);
    ctx.moveTo(BX + 36, ey + 110); ctx.lineTo(BX + 34, by - 50);
    ctx.stroke();
    ctx.fillStyle = '#4a4a55';
    ctx.fillRect(BX - 14, by - 82, 28, 10);
    // Pilot.
    const scared = state === 'lose' || (state === 'play' && !storm && lastF < 0.3);
    ctx.fillStyle = '#f2c79a';
    ctx.beginPath(); ctx.arc(BX + 4, by - 66, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a3a1a';
    ctx.beginPath(); ctx.arc(BX + 4, by - 72, 16, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6fb8ff';
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;
    for (const dx of [-3, 11]) { ctx.beginPath(); ctx.arc(BX + dx, by - 70, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = '#222';
    ctx.beginPath();
    if (scared) ctx.ellipse(BX + 4, by - 57, 4, 5, 0, 0, Math.PI * 2);
    else ctx.arc(BX + 4, by - 60, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    const wave = state === 'win' ? Math.sin(t * 10) * 0.5 : 0;
    ctx.strokeStyle = '#f2c79a';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(BX + 18, by - 50);
    ctx.lineTo(BX + 32 + wave * 10, by - 74 - Math.abs(wave) * 10);
    ctx.stroke();
    const bg = ctx.createLinearGradient(0, by - 50, 0, by);
    bg.addColorStop(0, '#c8904a');
    bg.addColorStop(1, '#8a5a2a');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(BX - 40, by - 52, 80, 52, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,20,0.5)';
    ctx.lineWidth = 2;
    for (let y = by - 42; y < by; y += 10) { ctx.beginPath(); ctx.moveTo(BX - 38, y); ctx.lineTo(BX + 38, y); ctx.stroke(); }
    ctx.restore();
  }

  function drawStorm(ctx) {
    if (!storm) return;
    const s = 0.55 + 0.45 * (storm.hp / BOSS_HITS);
    const x = storm.x, y = TOP - 210;
    ctx.save();
    ctx.globalAlpha = storm.gone ? Math.max(0, 1 - endT * 1.5) : 1;
    ctx.translate(x + (storm.hitT > 0 ? Math.sin(t * 50) * 8 * storm.hitT : 0), y);
    ctx.scale(s, s);
    // Rain.
    ctx.strokeStyle = 'rgba(160,190,230,0.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const rx = -120 + i * 18, ry = 60 + ((t * 400 + i * 53) % 260);
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 8, ry + 22); ctx.stroke();
    }
    ctx.fillStyle = storm.hitT > 0 ? '#9aa4c0' : '#5a6078';
    ctx.beginPath();
    ctx.ellipse(0, 20, 150, 60, 0, 0, Math.PI * 2);
    ctx.ellipse(-80, -10, 80, 60, 0, 0, Math.PI * 2);
    ctx.ellipse(40, -40, 90, 75, 0, 0, Math.PI * 2);
    ctx.fill();
    // Angry face.
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-30, 0, 14, 0, Math.PI * 2); ctx.arc(30, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-34, 2, 6, 0, Math.PI * 2); ctx.arc(26, 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-50, -22); ctx.lineTo(-16, -12);
    ctx.moveTo(50, -22); ctx.lineTo(16, -12);
    ctx.moveTo(-22, 36); ctx.quadraticCurveTo(0, 24, 22, 36);
    ctx.stroke();
    ctx.restore();
    if (!storm.gone) drawHearts(ctx, x, y - 120 * s, storm.hp);
    // Lightning when it strikes.
    if (flash > 0.15) {
      ctx.strokeStyle = '#fff6a0';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x - 40, y + 60);
      ctx.lineTo(x - 70, y + 140);
      ctx.lineTo(x - 50, y + 140);
      ctx.lineTo(x - 90, y + 240);
      ctx.stroke();
    }
  }

  function drawEffects(ctx, v) {
    for (const g of gusts) {
      if (g.t < 0) continue;
      const k = g.t / 0.6;
      const x = lerp(BX + 60, (storm ? storm.x : BX + 400) - 60, k);
      ctx.strokeStyle = `rgba(255,255,255,${1 - k})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - 40, g.y);
      ctx.quadraticCurveTo(x, g.y - 10, x + 30, g.y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(220,240,255,0.9)';
    for (const s of splash) { ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx.fill(); }
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash * 1.2})`;
      ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    }
  }

  function draw(ctx, W, H) {
    const v = fitScene(W, H, DW, DH);
    ctx.save();
    ctx.translate(v.ox, v.oy);
    ctx.scale(v.s, v.s);
    drawSky(ctx, v);
    drawIsland(ctx);
    drawSea(ctx, v);
    drawBalloon(ctx);
    drawStorm(ctx);
    drawEffects(ctx, v);
    ctx.restore();
  }

  return { correct, wrong, win, lose, update, draw, bossStart, bossHit };
}
