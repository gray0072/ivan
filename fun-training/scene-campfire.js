// "Campfire Night" process: a campfire burns down in a dark forest and wolf eyes creep closer; correct answers add logs.

function createCampfireScene(opts) {
  const DW = 1200, DH = 900;
  const GROUND = 640;
  const FX = 600, FY = 700;               // fire base
  const KID = { x: 470, y: 700 };         // kid sitting on a log
  const hoodie = ['#e0453a', '#3a86e0', '#2f9e5a', '#8a4ad0', '#e07a1a'][opts.step % 5];

  let t = 0, state = 'play', endT = 0;
  let fire = 1;              // shown fire size (eases up after a log lands)
  let lastF = 1;
  let flare = 0;
  let fizzle = 0;
  let logs = [];             // flying logs / burning sticks { t, target, hit, torch }
  let sparks = [];
  let throwT = 0;
  let dawn = 0;
  let boss = null;           // pack leader: { hp, x, stagger, flee }
  const wolves = [-1, -1, 1, 1].map((side, i) => ({ side, off: i % 2 ? 0.75 : 1, y: GROUND - 20 + (i % 2) * 22, blink: Math.random() * 5 }));
  const stars = Array.from({ length: 60 }, (_, i) => ({ x: (i * 211) % 1500 - 150, y: 20 + ((i * 97) % 420), p: i * 1.3 }));

  function throwLog(torch, target) {
    logs.push({ t: 0, torch, target, x0: KID.x - 10, y0: KID.y - 70 });
    throwT = 0.4;
    Sfx.whoosh();
  }

  function correct() { throwLog(false, null); }

  function wrong() { fizzle = 0.9; }

  function bossStart() {
    boss = { hp: BOSS_HITS, x: 1150, stagger: 0, flee: 0 };
    Sfx.howl();
  }

  function bossHit(hp) {
    boss.hpNext = hp;
    throwLog(true, 'boss');
  }

  function win() {
    state = 'win';
    endT = 0;
    if (boss) { boss.hpNext = 0; throwLog(true, 'boss'); }
    else throwLog(false, null);
    setTimeout(() => Sfx.chirp(), 900);
  }

  function lose() {
    state = 'lose';
    endT = 0;
    Sfx.howl();
  }

  function update(dt, f) {
    t += dt;
    lastF = f;
    if (state !== 'play') endT += dt;
    let target = boss && state !== 'lose' ? 1 : f;
    if (state === 'lose' && !boss) target = 0;
    if (state === 'win') target = 1;
    if (fire < target) fire = Math.min(target, fire + dt / FIRE_REFILL_TIME * (logs.length ? 0 : 1));
    else fire = target;
    flare = Math.max(0, flare - dt * 1.5);
    fizzle = Math.max(0, fizzle - dt);
    throwT = Math.max(0, throwT - dt);
    if (state === 'win') dawn = Math.min(1, dawn + dt * 0.7);

    for (const l of logs) {
      l.t += dt / LOG_FLIGHT_TIME;
      if (l.t >= 1 && !l.done) {
        l.done = true;
        if (l.target === 'boss' && boss) {
          Sfx.bonk();
          Sfx.yelp();
          boss.hp = boss.hpNext;
          boss.stagger = 0.6;
          if (boss.hp <= 0) boss.flee = 0.001;
          burst(boss.x - 90, GROUND - 90, 16);
        } else {
          Sfx.crackle();
          flare = 1;
          burst(FX, FY - 40, 24);
        }
      }
    }
    logs = logs.filter(l => !l.done);

    if (boss) {
      boss.stagger = Math.max(0, boss.stagger - dt);
      if (boss.flee > 0) { boss.flee += dt; boss.x += dt * 600; }
      else if (state === 'play') boss.x = lerp(720, 1150, f);
    }

    if (fire > 0.05 && Math.random() < dt * (4 + fire * 10)) {
      sparks.push({ x: FX + (Math.random() - 0.5) * 40, y: FY - 30, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 80, t: 0, max: 0.8 + Math.random() * 0.8 });
    }
    for (const s of sparks) { s.t += dt; s.x += (s.vx + Math.sin(s.t * 6 + s.max * 9) * 20) * dt; s.y += s.vy * dt; }
    sparks = sparks.filter(s => s.t < s.max);
    for (const w of wolves) { w.blink -= dt; if (w.blink < -0.15) w.blink = 2 + Math.random() * 4; }
  }

  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 80 + Math.random() * 160;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, max: 0.5 + Math.random() * 0.6 });
    }
  }

  // ---- drawing ----

  function drawWorld(ctx, v) {
    const sky = ctx.createLinearGradient(0, v.y0, 0, GROUND);
    sky.addColorStop(0, mixColor('#0a0d2a', '#6a8ad8', dawn));
    sky.addColorStop(1, mixColor('#27244a', '#ffc38a', dawn));
    ctx.fillStyle = sky;
    ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, GROUND + 10 - v.y0);
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,230,${(0.4 + 0.4 * Math.sin(t * 2 + s.p)) * (1 - dawn)})`;
      ctx.fillRect(s.x, s.y, 3, 3);
    }
    // Crescent moon (a disc minus an offset disc), and the sun rising at dawn.
    ctx.save();
    ctx.beginPath();
    ctx.rect(900, 80, 120, 120);
    ctx.arc(982, 126, 42, 0, Math.PI * 2);
    ctx.clip('evenodd');
    ctx.fillStyle = `rgba(255,248,210,${1 - dawn})`;
    ctx.beginPath();
    ctx.arc(960, 140, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (dawn > 0) {
      const sy = GROUND - 90 - 110 * dawn;
      const glow = ctx.createRadialGradient(1000, sy, 30, 1000, sy, 220);
      glow.addColorStop(0, `rgba(255,220,120,${0.7 * dawn})`);
      glow.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(780, sy - 220, 440, 440);
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath();
      ctx.arc(1000, sy, 64, 0, Math.PI * 2);
      ctx.fill();
    }
    // Forest silhouettes.
    for (const [base, h, colr, step] of [[GROUND - 40, 150, '#1a2446', 70], [GROUND, 190, '#141a34', 95]]) {
      ctx.fillStyle = mixColor(colr, '#3a5a4a', dawn * 0.6);
      for (let x = Math.floor(v.x0 / step) * step; x < v.x1 + step; x += step) {
        const hh = h * (0.7 + 0.3 * Math.abs(Math.sin(x * 0.37)));
        ctx.beginPath();
        ctx.moveTo(x - step * 0.6, base);
        ctx.lineTo(x, base - hh);
        ctx.lineTo(x + step * 0.6, base);
        ctx.fill();
      }
    }
    // Ground.
    ctx.fillStyle = mixColor('#1f3a22', '#4f7a3a', dawn);
    ctx.fillRect(v.x0, GROUND, v.x1 - v.x0, v.y1 - GROUND);
    // Tent.
    ctx.fillStyle = '#e07a3a';
    ctx.beginPath();
    ctx.moveTo(120, GROUND + 60);
    ctx.lineTo(240, GROUND - 110);
    ctx.lineTo(360, GROUND + 60);
    ctx.fill();
    ctx.fillStyle = '#5a2a14';
    ctx.beginPath();
    ctx.moveTo(210, GROUND + 60);
    ctx.lineTo(240, GROUND - 30);
    ctx.lineTo(270, GROUND + 60);
    ctx.fill();
  }

  function wolfPos(w) {
    const d = lerp(190, 620, fire) * w.off;
    return { x: FX + w.side * d, y: w.y };
  }

  function drawWolfBodies(ctx) {
    // Silhouettes show once the wolves are close enough to be lit.
    for (const w of wolves) {
      const p = wolfPos(w);
      const near = 1 - smooth(260, 420, Math.abs(p.x - FX));
      if (near <= 0 || dawn > 0.5) continue;
      ctx.fillStyle = `rgba(40,40,52,${near})`;
      ctx.beginPath();
      ctx.ellipse(p.x + w.side * 40, p.y + 30, 60, 30, 0, 0, Math.PI * 2);
      ctx.ellipse(p.x, p.y + 4, 26, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(p.x - 20, p.y - 8); ctx.lineTo(p.x - 14, p.y - 34); ctx.lineTo(p.x - 4, p.y - 12);
      ctx.moveTo(p.x + 20, p.y - 8); ctx.lineTo(p.x + 14, p.y - 34); ctx.lineTo(p.x + 4, p.y - 12);
      ctx.fill();
    }
  }

  function drawEyes(ctx) {
    if (dawn > 0.8) return;
    ctx.save();
    if (Quality.glow()) {
      ctx.shadowColor = '#ffe066';
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = `rgba(255,230,90,${1 - dawn})`;
    for (const w of wolves) {
      if (w.blink < 0) continue;
      const p = wolfPos(w);
      for (const dx of [-9, 9]) {
        ctx.beginPath();
        ctx.ellipse(p.x + dx, p.y, 5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (boss && boss.x < 1300) {
      const dir = boss.flee > 0 ? -1 : 1;
      ctx.beginPath();
      ctx.ellipse(boss.x - 100 * dir, GROUND - 97 - bossBob(), 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (boss && boss.flee === 0) drawHearts(ctx, boss.x - 60, GROUND - 200, boss.hp);
  }

  function bossBob() { return Math.abs(Math.sin(boss.x * 0.05)) * 4; }

  function drawBoss(ctx) {
    if (!boss || boss.x > 1400) return;
    const x = boss.x, y = GROUND + 40;
    const phase = boss.x * 0.05;
    const dir = boss.flee > 0 ? -1 : 1; // faces left, turns right when fleeing
    ctx.save();
    ctx.translate(x, y - bossBob());
    ctx.scale(dir, 1);
    ctx.rotate(boss.stagger > 0 ? Math.sin(boss.stagger * 18) * 0.08 : 0);
    ctx.fillStyle = '#4a4a5c';
    ctx.strokeStyle = '#4a4a5c';
    ctx.lineCap = 'round';
    ctx.lineWidth = 16;
    for (const [lx, ph] of [[-50, 0], [-20, Math.PI], [50, Math.PI], [80, 0]]) {
      const a = Math.sin(phase + ph) * 0.4;
      ctx.beginPath();
      ctx.moveTo(lx, -70);
      ctx.lineTo(lx + Math.sin(a) * 40, -4);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(20, -90, 100, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail.
    ctx.beginPath();
    ctx.moveTo(110, -100);
    ctx.quadraticCurveTo(170, -110 + Math.sin(t * 4) * 8, 190, -60);
    ctx.quadraticCurveTo(150, -80, 110, -80);
    ctx.fill();
    // Head.
    ctx.beginPath();
    ctx.ellipse(-90, -128, 42, 34, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-110, -140); ctx.lineTo(-165, -118); ctx.lineTo(-110, -104);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-100, -156); ctx.lineTo(-92, -192); ctx.lineTo(-74, -154);
    ctx.moveTo(-72, -152); ctx.lineTo(-58, -186); ctx.lineTo(-50, -146);
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-158 + i * 11, -116); ctx.lineTo(-153 + i * 11, -106); ctx.lineTo(-148 + i * 11, -116);
      ctx.fill();
    }
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-164, -120, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawFire(ctx) {
    // Stones and logs.
    ctx.fillStyle = '#6a6a78';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI;
      ctx.beginPath();
      ctx.ellipse(FX + Math.cos(a) * 70, FY + 8 - Math.sin(a) * 6, 18, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#6a3a1a';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(FX - 55, FY + 4); ctx.lineTo(FX + 40, FY - 20);
    ctx.moveTo(FX + 55, FY + 4); ctx.lineTo(FX - 40, FY - 20);
    ctx.stroke();
    const k = Math.max(0, fire) * (1 + flare * 0.5);
    if (k > 0.02) {
      const layers = [['#ff4a1a', 1], ['#ff9f1a', 0.72], ['#ffe066', 0.45]];
      for (const [c, s] of layers) {
        for (let i = -1; i <= 1; i++) {
          const fl = 0.85 + 0.15 * Math.sin(t * 13 + i * 2 + s * 5) + 0.1 * Math.sin(t * 29 + i);
          const h = (40 + 150 * k) * s * fl * (i === 0 ? 1 : 0.7);
          const w = (22 + 28 * k) * s * (i === 0 ? 1 : 0.75);
          const x = FX + i * 26 * s;
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(x - w, FY - 10);
          ctx.quadraticCurveTo(x - w, FY - h * 0.5, x + Math.sin(t * 7 + i) * 8, FY - 10 - h);
          ctx.quadraticCurveTo(x + w, FY - h * 0.5, x + w, FY - 10);
          ctx.fill();
        }
      }
    }
    if (fire < 0.3 || fizzle > 0) {
      const a = Math.max(fizzle * 0.6, (0.3 - fire) * 1.5);
      for (let i = 0; i < 4; i++) {
        const sy = FY - 40 - ((t * 40 + i * 50) % 200);
        ctx.fillStyle = `rgba(120,120,130,${a * (1 - (FY - 40 - sy) / 200)})`;
        ctx.beginPath();
        ctx.arc(FX + Math.sin(t + i) * 14, sy, 16 + (FY - sy) * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawKid(ctx) {
    const scared = state === 'lose' || (state === 'play' && (boss ? lastF < 0.35 : lastF < 0.3));
    // Log to sit on.
    ctx.fillStyle = '#7a4a24';
    ctx.beginPath();
    ctx.roundRect(KID.x - 70, KID.y - 6, 120, 30, 14);
    ctx.fill();
    ctx.fillStyle = '#b07a4a';
    ctx.beginPath(); ctx.ellipse(KID.x + 50, KID.y + 9, 8, 15, 0, 0, Math.PI * 2); ctx.fill();
    // Body, legs, head.
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(KID.x - 10, KID.y - 22, 42, 16);
    ctx.fillRect(KID.x + 22, KID.y - 22, 14, 44);
    ctx.fillStyle = hoodie;
    ctx.beginPath();
    ctx.roundRect(KID.x - 28, KID.y - 84, 46, 66, 14);
    ctx.fill();
    const hy = KID.y - 106 + (scared ? Math.sin(t * 30) * 1.5 : 0);
    ctx.fillStyle = '#f2c79a';
    ctx.beginPath(); ctx.arc(KID.x - 4, hy, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hoodie;
    ctx.beginPath(); ctx.arc(KID.x - 4, hy - 4, 24, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    ctx.fillStyle = '#222';
    const eo = scared ? 4 : 2.8;
    ctx.beginPath(); ctx.arc(KID.x + 2, hy + 2, eo, 0, Math.PI * 2); ctx.arc(KID.x + 12, hy + 2, eo, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (scared) ctx.ellipse(KID.x + 8, hy + 12, 3.5, 5, 0, 0, Math.PI * 2);
    else ctx.arc(KID.x + 8, hy + 9, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Arm: holds a marshmallow stick, or throws.
    const up = throwT > 0 ? Math.sin((throwT / 0.4) * Math.PI) : 0;
    ctx.strokeStyle = hoodie;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(KID.x + 6, KID.y - 68);
    ctx.lineTo(KID.x + 34 - up * 20, KID.y - 52 - up * 50);
    ctx.stroke();
    if (up === 0) {
      ctx.strokeStyle = '#8a5a2a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(KID.x + 36, KID.y - 52);
      ctx.lineTo(FX - 40, FY - 92);
      ctx.stroke();
      ctx.fillStyle = mixColor('#ffffff', '#c89a5a', clamp(t / 40, 0, 1));
      ctx.beginPath(); ctx.roundRect(FX - 48, FY - 102, 18, 16, 5); ctx.fill();
    }
  }

  function drawLogs(ctx) {
    for (const l of logs) {
      const u = clamp(l.t, 0, 1);
      const tx = l.target === 'boss' && boss ? boss.x - 90 : FX, ty = l.target === 'boss' ? GROUND - 90 : FY - 20;
      const x = lerp(l.x0, tx, u), y = lerp(l.y0, ty, u) - 140 * 4 * u * (1 - u);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(u * 9);
      ctx.fillStyle = '#7a4a24';
      ctx.fillRect(l.torch ? -22 : -30, -7, l.torch ? 44 : 60, 14);
      if (l.torch) {
        ctx.fillStyle = '#ff9f1a';
        ctx.beginPath(); ctx.arc(22, 0, 12 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe066';
        ctx.beginPath(); ctx.arc(22, 0, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#c89a5a';
        ctx.beginPath(); ctx.ellipse(30, 0, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawDarkness(ctx, v) {
    const k = 1 - dawn;
    if (k <= 0) return;
    const R = lerp(200, 820, clamp(fire, 0, 1)) * (1 + flare * 0.15);
    const g = ctx.createRadialGradient(FX, FY - 60, 20, FX, FY - 60, R);
    g.addColorStop(0, 'rgba(4,6,22,0)');
    g.addColorStop(0.45, `rgba(4,6,22,${0.12 * k})`);
    g.addColorStop(1, `rgba(4,6,22,${0.82 * k})`);
    ctx.fillStyle = g;
    ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    const warm = ctx.createRadialGradient(FX, FY - 60, 10, FX, FY - 60, R * 0.8);
    warm.addColorStop(0, `rgba(255,150,60,${0.28 * clamp(fire, 0, 1) * k})`);
    warm.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(FX - R, FY - 60 - R, R * 2, R * 2);
  }

  function drawSparks(ctx) {
    for (const s of sparks) {
      ctx.fillStyle = `rgba(255,${180 + Math.round(60 * (1 - s.t / s.max))},80,${1 - s.t / s.max})`;
      ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
    }
  }

  function draw(ctx, W, H) {
    const v = fitScene(W, H, DW, DH);
    ctx.save();
    ctx.translate(v.ox, v.oy);
    ctx.scale(v.s, v.s);
    drawWorld(ctx, v);
    drawWolfBodies(ctx);
    drawBoss(ctx);
    drawKid(ctx);
    drawFire(ctx);
    drawLogs(ctx);
    drawDarkness(ctx, v);
    drawEyes(ctx);
    drawSparks(ctx);
    ctx.restore();
  }

  return { correct, wrong, win, lose, update, draw, bossStart, bossHit };
}
