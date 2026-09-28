// "Zombie Defense" process: zombies walk to the house from the right, a kid in the attic throws stones.

const ZOMBIE_SHIRTS = ['#6a7fd0', '#b0507a', '#8a6a44', '#5a9a8a', '#c07a3a', '#7a5ab0'];
const ZOMBIE_SKINS = ['#8fc45a', '#9ccf6a', '#7fb87a', '#a6c46a'];

function createZombieScene() {
  const DW = 1200, DH = 900;
  const GROUND = 745;
  const HAND = { x: 205, y: 388 }; // where stones leave the kid's hand

  let t = 0;
  let state = 'play', endT = 0;
  let zombie = newZombie();
  let dying = [];      // hit zombies falling over
  let stones = [];
  let popups = [];     // "BONK!" texts
  let dust = [];
  let sparks = [];     // fireworks particles
  let throwT = 0;      // arm animation timer
  let lastF = 1;
  let lights = 1;
  const stars = Array.from({ length: 40 }, (_, i) => ({ x: (i * 197) % 1400 - 100, y: 30 + ((i * 89) % 330), p: i * 1.7 }));

  function newZombie(isBoss) {
    return {
      boss: !!isBoss, hp: isBoss ? BOSS_HITS : 1, stagger: 0,
      scale: isBoss ? 1.55 : 0.9 + Math.random() * 0.25,
      shirt: ZOMBIE_SHIRTS[Math.floor(Math.random() * ZOMBIE_SHIRTS.length)],
      skin: ZOMBIE_SKINS[Math.floor(Math.random() * ZOMBIE_SKINS.length)],
      hat: Math.random() < 0.35,
      born: t,
      x: ZOMBIE_START_X,
    };
  }

  const zx = f => lerp(ZOMBIE_DOOR_X, ZOMBIE_START_X, f);

  function throwAt(x, y, hit, target, kill = true) {
    stones.push({ x0: HAND.x, y0: HAND.y, x1: x, y1: y, t: 0, hit, target, kill });
    throwT = 0.4;
    Sfx.whoosh();
  }

  function hitCurrent() {
    const z = zombie;
    z.x = zx(lastF);
    z.stopped = true;
    throwAt(z.x - 6 * z.scale, GROUND - 172 * z.scale, true, z);
  }

  function correct() {
    hitCurrent();
    zombie = newZombie();
    Sfx.rise();
  }

  function bossStart() {
    zombie = newZombie(true);
    Sfx.rise();
    Sfx.groan();
  }

  function bossHit(hp) {
    const z = zombie;
    z.hpLeft = hp;
    throwAt(z.x - 6 * z.scale, GROUND - 172 * z.scale, true, z, false);
  }

  function wrong() {
    const x = lerp(HAND.x + 120, zx(lastF) - 60, 0.3 + Math.random() * 0.4);
    throwAt(x, GROUND + 10, false, null);
  }

  function win() {
    state = 'win';
    endT = 0;
    hitCurrent();
    zombie = null;
  }

  function lose() {
    state = 'lose';
    endT = 0;
    Sfx.scream();
  }

  function update(dt, f) {
    t += dt;
    lastF = f;
    if (state !== 'play') endT += dt;
    if (throwT > 0) throwT -= dt;
    if (zombie && zombie.stagger > 0) zombie.stagger = Math.max(0, zombie.stagger - dt);
    if (zombie && !zombie.stopped) {
      zombie.x = zx(f);
      if (!zombie.groaned && f < 0.6 && state === 'play') { zombie.groaned = true; Sfx.groan(); }
    }
    lights = state === 'lose' ? Math.max(0.15, 1 - endT) : 1;

    for (const s of stones) {
      s.t += dt / STONE_FLIGHT_TIME;
      if (s.t >= 1 && !s.done) {
        s.done = true;
        if (s.hit) {
          Sfx.bonk();
          popups.push({ x: s.x1, y: s.y1 - 30, t: 0 });
          if (s.kill) {
            s.target.fallT = 0;
            s.target.hp = 0;
            dying.push(s.target);
          } else {
            s.target.hp = s.target.hpLeft;
            s.target.stagger = 0.6;
            Sfx.groan();
          }
        } else {
          Sfx.plop();
          for (let i = 0; i < 10; i++) dust.push({ x: s.x1, y: GROUND + 8, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 120, t: 0 });
        }
      }
    }
    stones = stones.filter(s => !s.done);
    for (const z of dying) z.fallT += dt;
    dying = dying.filter(z => z.fallT < ZOMBIE_FALL_TIME + 0.6);
    for (const p of popups) p.t += dt;
    popups = popups.filter(p => p.t < 0.8);
    for (const d of dust) { d.t += dt; d.vy += 500 * dt; d.x += d.vx * dt; d.y += d.vy * dt; }
    dust = dust.filter(d => d.t < 0.6);

    if (state === 'win' && endT > 0.5 && Math.random() < dt * 3.5) {
      const cx = 500 + Math.random() * 600, cy = 120 + Math.random() * 220;
      const col = ['#ffd23f', '#ff4f7b', '#4fd8ff', '#3ddc97', '#b36bff'][Math.floor(Math.random() * 5)];
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2, v = 140 + Math.random() * 60;
        sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, col });
      }
    }
    for (const p of sparks) { p.t += dt; p.vy += 90 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; }
    sparks = sparks.filter(p => p.t < 1.4);
  }

  // ---- drawing ----

  function drawSky(ctx, v) {
    const g = ctx.createLinearGradient(0, v.y0, 0, 640);
    g.addColorStop(0, '#231a45');
    g.addColorStop(0.55, '#6b3f78');
    g.addColorStop(1, '#f0935f');
    ctx.fillStyle = g;
    ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, 660 - v.y0);
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,230,${0.4 + 0.4 * Math.sin(t * 2 + s.p)})`;
      ctx.fillRect(s.x, s.y, 3, 3);
    }
    const mx = 980, my = 150;
    const glow = ctx.createRadialGradient(mx, my, 30, mx, my, 150);
    glow.addColorStop(0, 'rgba(255,250,210,0.5)');
    glow.addColorStop(1, 'rgba(255,250,210,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(mx - 150, my - 150, 300, 300);
    ctx.fillStyle = '#fff6d6';
    ctx.beginPath();
    ctx.arc(mx, my, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,190,150,0.5)';
    for (const [dx, dy, r] of [[-18, -10, 12], [15, 14, 9], [10, -22, 6]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2); ctx.fill(); }
    // Hills and dead trees.
    ctx.fillStyle = '#3a2a52';
    ctx.beginPath();
    ctx.moveTo(v.x0, 660);
    for (let x = v.x0; x <= v.x1 + 20; x += 20) ctx.lineTo(x, 600 - Math.sin(x / 160) * 35 - Math.sin(x / 57) * 10);
    ctx.lineTo(v.x1, 660);
    ctx.fill();
    ctx.strokeStyle = '#2a1e3c';
    ctx.lineCap = 'round';
    for (const [x, h] of [[620, 90], [860, 70], [1120, 110]]) {
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(x, 640);
      ctx.lineTo(x, 640 - h);
      ctx.moveTo(x, 640 - h * 0.6);
      ctx.lineTo(x + 26, 640 - h * 0.9);
      ctx.moveTo(x, 640 - h * 0.45);
      ctx.lineTo(x - 22, 640 - h * 0.7);
      ctx.stroke();
    }
    // Ground and path.
    const gg = ctx.createLinearGradient(0, 640, 0, v.y1);
    gg.addColorStop(0, '#4f7a36');
    gg.addColorStop(1, '#2f4f22');
    ctx.fillStyle = gg;
    ctx.fillRect(v.x0, 640, v.x1 - v.x0, v.y1 - 640);
    ctx.fillStyle = '#8a6a48';
    ctx.beginPath();
    ctx.moveTo(250, GROUND - 25);
    ctx.lineTo(v.x1, GROUND - 35);
    ctx.lineTo(v.x1, GROUND + 30);
    ctx.lineTo(250, GROUND + 25);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = 300; x < v.x1; x += 90) { ctx.beginPath(); ctx.ellipse(x + (x % 7) * 5, GROUND + 5, 14, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    // Tombstone and grass tufts.
    ctx.fillStyle = '#7d7f95';
    ctx.beginPath();
    ctx.roundRect(1080, 650, 50, 70, [25, 25, 4, 4]);
    ctx.fill();
    ctx.fillStyle = '#5d5f75';
    ctx.fillRect(1098, 668, 14, 30);
    ctx.fillRect(1090, 676, 30, 10);
    ctx.strokeStyle = '#6aa044';
    ctx.lineWidth = 4;
    for (let x = v.x0 + 20; x < v.x1; x += 70) {
      const y = 820 + ((x * 13) % 60);
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x - 6, y - 16);
      ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 20);
      ctx.moveTo(x, y); ctx.lineTo(x + 9, y - 14);
      ctx.stroke();
    }
  }

  function drawHouse(ctx, f) {
    const scared = state === 'lose' || (state === 'play' && f < 0.3);
    // Walls.
    ctx.fillStyle = '#e8c07a';
    ctx.fillRect(60, 470, 240, GROUND - 470);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 490; y < GROUND; y += 28) ctx.fillRect(60, y, 240, 3);
    // Chimney and roof.
    ctx.fillStyle = '#8a4a3a';
    ctx.fillRect(235, 340, 32, 90);
    ctx.fillStyle = '#c0453a';
    ctx.beginPath();
    ctx.moveTo(30, 482);
    ctx.lineTo(180, 318);
    ctx.lineTo(330, 482);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9a3028';
    ctx.fillRect(26, 476, 308, 14);
    // Attic window with the thrower.
    ctx.fillStyle = mixColor('#1a1a2a', '#ffe08a', lights);
    ctx.beginPath();
    ctx.arc(180, 415, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(180, 415, 38, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#3a7bd5';
    ctx.fillRect(160, 428, 40, 30); // shirt
    ctx.restore();
    const armUp = throwT > 0 ? Math.sin((throwT / 0.4) * Math.PI) : 0;
    ctx.strokeStyle = '#f2c79a';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(193, 432);
    ctx.lineTo(193 + 18 + armUp * 6, 420 - 22 - armUp * 22);
    ctx.stroke();
    ctx.fillStyle = '#f2c79a';
    ctx.beginPath();
    ctx.arc(180, 408, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6a3a1a';
    ctx.beginPath();
    ctx.arc(180, 402, 17, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(186, 409, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(176, 409, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(180, 415, 38, 0, Math.PI * 2);
    ctx.stroke();
    // Family window.
    ctx.fillStyle = mixColor('#1a1a2a', '#ffe08a', lights);
    ctx.fillRect(85, 535, 95, 80);
    ctx.save();
    ctx.beginPath();
    ctx.rect(85, 535, 95, 80);
    ctx.clip();
    const bob = scared ? Math.sin(t * 20) * 2 : Math.sin(t * 2) * 2;
    for (const [x, y, r, hair] of [[110, 590, 16, '#5a3a1a'], [150, 585, 18, '#2a2a2a'], [131, 600, 11, '#c08a3a']]) {
      ctx.fillStyle = '#f2c79a';
      ctx.beginPath(); ctx.arc(x, y + bob, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hair;
      ctx.beginPath(); ctx.arc(x, y - r * 0.3 + bob, r, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222';
      const eo = scared ? r * 0.2 : r * 0.12;
      ctx.beginPath(); ctx.arc(x - r * 0.35, y + bob, eo, 0, Math.PI * 2); ctx.arc(x + r * 0.35, y + bob, eo, 0, Math.PI * 2); ctx.fill();
      if (scared) { ctx.beginPath(); ctx.ellipse(x, y + r * 0.5 + bob, r * 0.2, r * 0.25, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 7;
    ctx.strokeRect(85, 535, 95, 80);
    ctx.beginPath();
    ctx.moveTo(132, 535);
    ctx.lineTo(132, 615);
    ctx.stroke();
    if (scared && state === 'play' && Math.sin(t * 8) > -0.3) {
      ctx.fillStyle = '#ff3b3b';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 132, 525);
    }
    // Door.
    ctx.fillStyle = '#7a4a2a';
    ctx.beginPath();
    ctx.roundRect(212, 615, 64, GROUND - 615, [30, 30, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(264, 685, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(205, GROUND - 6, 80, 8);
  }

  function drawZombie(ctx, z, x, alpha) {
    const s = z.scale;
    const rise = clamp((t - z.born) / ZOMBIE_RISE_TIME, 0, 1);
    const fall = z.fallT !== undefined ? smooth(0, ZOMBIE_FALL_TIME * 0.6, z.fallT) : 0;
    const fade = z.fallT !== undefined ? 1 - smooth(ZOMBIE_FALL_TIME * 0.6, ZOMBIE_FALL_TIME + 0.5, z.fallT) : 1;
    const knock = state === 'lose' && z === zombie ? Math.sin(endT * 14) * 8 : 0;
    const phase = z.stopped || state === 'lose' ? z.x * 0.045 : x * 0.045;
    const swing = Math.sin(phase) * 0.4;
    const bob = Math.abs(Math.sin(phase)) * 5;
    ctx.save();
    ctx.globalAlpha = alpha * fade;
    if (rise < 1) {
      ctx.beginPath();
      ctx.rect(x - 200, 0, 400, GROUND + 6);
      ctx.clip();
    }
    ctx.translate(x, GROUND + (1 - rise) * 200 * s);
    ctx.rotate(fall * 1.45 + (z.stagger > 0 ? Math.sin(z.stagger * 16) * 0.12 : 0));
    ctx.scale(s, s);
    ctx.translate(0, -bob);
    ctx.lineCap = 'round';
    // Legs.
    for (const [a, col] of [[-swing, '#3a3a5a'], [swing, '#4a4a70']]) {
      ctx.save();
      ctx.translate(0, -78);
      ctx.rotate(a);
      ctx.strokeStyle = col;
      ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 70); ctx.stroke();
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.ellipse(-8, 76, 15, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // Back arm.
    const armY = -135 + Math.sin(phase * 0.5 + 1) * 5;
    ctx.strokeStyle = mixColor(z.shirt, '#000000', 0.3);
    ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(4, -138); ctx.lineTo(-62 + knock, armY - 6); ctx.stroke();
    ctx.fillStyle = mixColor(z.skin, '#000000', 0.2);
    ctx.beginPath(); ctx.arc(-68 + knock, armY - 6, 10, 0, Math.PI * 2); ctx.fill();
    // Body with a torn shirt.
    ctx.fillStyle = z.shirt;
    ctx.beginPath();
    ctx.moveTo(-27, -152);
    ctx.lineTo(27, -152);
    ctx.lineTo(27, -76);
    for (let i = 0; i <= 6; i++) ctx.lineTo(27 - i * 9, -76 + (i % 2 ? 9 : 0));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.arc(10, -110, 7, 0, Math.PI * 2); ctx.fill();
    // Front arm.
    ctx.strokeStyle = z.shirt;
    ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(-8, -140); ctx.lineTo(-72 - knock, armY + 4); ctx.stroke();
    ctx.fillStyle = z.skin;
    ctx.beginPath(); ctx.arc(-78 - knock, armY + 4, 10, 0, Math.PI * 2); ctx.fill();
    // Head.
    ctx.fillStyle = z.skin;
    ctx.beginPath(); ctx.arc(-6, -176, 27, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-17, -181, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -183, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d02020';
    ctx.beginPath(); ctx.arc(-19, -180, 3.5, 0, Math.PI * 2); ctx.arc(0, -182, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a3a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-26, -162);
    for (let i = 1; i <= 4; i++) ctx.lineTo(-26 + i * 6, -162 + (i % 2 ? 4 : 0));
    ctx.stroke();
    if (z.boss) {
      ctx.fillStyle = '#ffd23f';
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-32, -196);
      ctx.lineTo(-32, -222); ctx.lineTo(-20, -208); ctx.lineTo(-6, -228); ctx.lineTo(8, -208); ctx.lineTo(20, -222);
      ctx.lineTo(20, -196);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (z.hat) {
      ctx.fillStyle = '#3a2a2a';
      ctx.fillRect(-36, -206, 58, 8);
      ctx.fillRect(-26, -234, 38, 30);
    } else {
      ctx.strokeStyle = '#3a4a2a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-10, -202); ctx.lineTo(-14, -214);
      ctx.moveTo(-2, -203); ctx.lineTo(2, -216);
      ctx.stroke();
    }
    ctx.restore();
    if (z.boss && z.fallT === undefined && rise >= 1) drawHearts(ctx, x - 8, GROUND - 250 * s - bob, z.hp);
    // Dizzy stars over a hit zombie.
    if (z.fallT !== undefined && fade > 0.05) {
      ctx.fillStyle = `rgba(255,220,60,${fade})`;
      for (let i = 0; i < 3; i++) {
        const a = t * 5 + (i * Math.PI * 2) / 3;
        starPath(ctx, x + 40 + Math.cos(a) * 30, GROUND - 60 - 20 * fall + Math.sin(a) * 10, 9);
        ctx.fill();
      }
    }
  }

  function drawEffects(ctx) {
    for (const s of stones) {
      const u = clamp(s.t, 0, 1);
      const x = lerp(s.x0, s.x1, u);
      const y = lerp(s.y0, s.y1, u) - 160 * 4 * u * (1 - u);
      ctx.fillStyle = '#8a8a8a';
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y, 11, 9, u * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    for (const d of dust) {
      ctx.fillStyle = `rgba(160,130,90,${1 - d.t / 0.6})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, 6, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of popups) {
      const k = smooth(0, 0.15, p.t);
      ctx.save();
      ctx.globalAlpha = 1 - smooth(0.5, 0.8, p.t);
      ctx.translate(p.x, p.y - p.t * 40);
      ctx.scale(k, k);
      ctx.font = 'bold 56px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#6a1a1a';
      ctx.strokeText('BONK!', 0, 0);
      ctx.fillStyle = '#ffd23f';
      ctx.fillText('BONK!', 0, 0);
      ctx.restore();
    }
    for (const p of sparks) {
      ctx.globalAlpha = 1 - p.t / 1.4;
      ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw(ctx, W, H) {
    const v = fitScene(W, H, DW, DH);
    ctx.save();
    ctx.translate(v.ox, v.oy);
    ctx.scale(v.s, v.s);
    drawSky(ctx, v);
    drawHouse(ctx, lastF);
    for (const z of dying) drawZombie(ctx, z, z.x, 1);
    if (zombie) drawZombie(ctx, zombie, zombie.x, 1);
    drawEffects(ctx);
    if (state === 'lose') {
      ctx.fillStyle = `rgba(20,0,30,${0.35 * smooth(0, 1, endT)})`;
      ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    }
    ctx.restore();
  }

  return { correct, wrong, win, lose, update, draw, bossStart, bossHit };
}
