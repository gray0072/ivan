// "Panda Snack" process: a panda in a bamboo forest gets hungry and sad; correct answers toss it treats from the basket.

// Per-step looks (purely visual): sky colours and the panda's accessory.
const PANDA_SKIES = [
  ['#bfe8ff', '#f2ffe6'], // morning
  ['#8fd3ff', '#e6ffd6'], // midday
  ['#ffc49a', '#fff0c4'], // sunset
];
const PANDA_BOWS = ['#ff4f7b', '#4f8cff', '#ffd23f', '#b36bff', '#3ddc97'];
const PANDA_TREATS = ['bamboo', 'apple', 'bamboo', 'carrot', 'bamboo', 'bao'];

function createPandaScene(opts) {
  const DW = 1200, DH = 900;
  const GY = 790;                 // ground line
  const PX = 430;                 // panda x
  const PS = 1.15;                // panda scale (drawn in its own units, ground at 0)
  const BASKET = { x: 960, y: GY };
  const MOUTH = { x: PX, y: GY - 262 * PS };
  const MONKEY_FAR = 1320;        // monkey x at f = 1; it reaches the basket at f = 0
  const sky = PANDA_SKIES[opts.step % PANDA_SKIES.length];
  const bow = PANDA_BOWS[opts.step % PANDA_BOWS.length];
  const flower = opts.step % 2 === 1;
  const bigBoss = (opts.step + 1) % TRACK_LEN === 0;

  let t = 0, state = 'play', endT = 0;
  let mood = 1;                   // shown happiness, follows the safety level (rises only while eating)
  let lastF = 1;
  let progress = 0, progressShown = 0;
  let treats = [];                // flying: { kind, t, hit, x1, y1 }
  let dropped = [];               // missed treats on the ground
  let chew = 0, chewKind = 'bamboo', chewT = 0;
  let fed = 0;                    // treats caught (picks the next kind)
  let crumbs = [], hearts = [], popups = [];
  let missT = 0, missX = 0;       // the panda looks at a missed treat
  let roarT = 0;
  let monkey = null;              // boss: { hp, x, stagger, flee, grab }
  let rumbleT = 3, sniffT = 2, blinkT = 2.5, blink = 0;
  let suck = 0;                   // 0..1, paw in the mouth

  function toss(hit) {
    const kind = hit ? PANDA_TREATS[fed++ % PANDA_TREATS.length] : PANDA_TREATS[Math.floor(Math.random() * PANDA_TREATS.length)];
    treats.push({
      kind, t: 0, hit,
      x1: hit ? MOUTH.x : lerp(PX + 170, BASKET.x - 140, Math.random()),
      y1: hit ? MOUTH.y + 10 : GY - 14,
    });
    Sfx.whoosh();
  }

  function correct(done, total) {
    progress = done / total;
    toss(true);
  }

  function wrong() { toss(false); }

  function bossStart() {
    monkey = { hp: BOSS_HITS, x: MONKEY_FAR, stagger: 0, flee: 0, grab: 0 };
    Sfx.monkey();
  }

  function bossHit(hp) {
    monkey.hp = hp;
    monkey.stagger = 0.8;
    roarT = 0.8;
    popups.push({ text: 'ROAR!', x: PX + 40, y: GY - 450 * PS, t: 0 });
    Sfx.roar();
    setTimeout(() => Sfx.monkey(), 250);
  }

  function win() {
    state = 'win';
    endT = 0;
    progress = 1;
    toss(true);
    if (monkey) {
      monkey.hp = 0;
      monkey.flee = 0.01;
      roarT = 0.8;
      Sfx.roar();
    }
    setTimeout(() => Sfx.squeak(), 700);
  }

  function lose() {
    state = 'lose';
    endT = 0;
    if (monkey) { monkey.grab = 0.01; Sfx.monkey(); }
    setTimeout(() => Sfx.cry(), monkey ? 500 : 0);
  }

  function burstHearts(x, y, n) {
    for (let i = 0; i < n; i++) {
      hearts.push({ x: x + (Math.random() - 0.5) * 80, y, vx: (Math.random() - 0.5) * 40, t: -i * 0.08, s: 10 + Math.random() * 8 });
    }
  }

  function update(dt, f) {
    t += dt;
    lastF = f;
    if (state !== 'play') endT += dt;

    for (const tr of treats) {
      tr.t += dt / PANDA_TOSS_TIME;
      if (tr.t >= 1 && !tr.done) {
        tr.done = true;
        if (tr.hit) {
          chew = PANDA_CHEW_TIME;
          chewKind = tr.kind;
          chewT = 0;
          burstHearts(MOUTH.x, MOUTH.y - 60, 3);
          popups.push({ text: 'Yum!', x: PX - 150, y: GY - 420 * PS, t: 0 });
        } else {
          dropped.push({ kind: tr.kind, x: tr.x1, t: 0, a: Math.random() * 6 });
          missT = 1.2;
          missX = tr.x1;
          Sfx.plop();
        }
      }
    }
    treats = treats.filter(tr => !tr.done);

    if (chew > 0) {
      chew -= dt;
      chewT -= dt;
      if (chewT <= 0) {
        chewT = 0.32;
        Sfx.munch();
        for (let i = 0; i < 4; i++) {
          crumbs.push({ x: MOUTH.x + (Math.random() - 0.5) * 40, y: MOUTH.y + 10, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 80, t: 0,
            c: chewKind === 'apple' ? '#ffe6a8' : chewKind === 'carrot' ? '#ff9a3c' : chewKind === 'bao' ? '#fff6e6' : '#7fcf5a' });
        }
      }
    }

    // Mood: drops with the level, comes back up only while eating; the boss round keeps it full.
    const boss = monkey && !monkey.flee && state === 'play';
    const target = state === 'lose' ? 0 : boss ? 1 : f;
    if (mood > target) mood = target;
    else if (chew > 0 || state === 'win') mood = Math.min(target === 0 ? 0 : 1, mood + dt * PANDA_HAPPY_RATE);
    if (state === 'win') mood = 1;
    progressShown += (progress - progressShown) * Math.min(1, dt * 1.5);

    const sucking = state === 'play' && !boss && mood < PANDA_SUCK_LEVEL && chew <= 0 && !treats.some(tr => tr.hit);
    suck = clamp(suck + (sucking ? dt * 3 : -dt * 5), 0, 1);

    if (state === 'play' && !boss) {
      rumbleT -= dt;
      if (rumbleT <= 0) {
        rumbleT = 3.5;
        if (mood < 0.6 && mood > PANDA_SUCK_LEVEL) { Sfx.rumble(); popups.push({ text: '~grr~', x: PX + 175, y: GY - 150, t: 0, small: true }); }
      }
      sniffT -= dt;
      if (sniffT <= 0) { sniffT = 2.6; if (suck > 0.5) Sfx.sniff(); }
    }
    blinkT -= dt;
    if (blinkT <= 0) { blinkT = 2 + Math.random() * 3; blink = 0.15; }
    blink = Math.max(0, blink - dt);
    missT = Math.max(0, missT - dt);
    roarT = Math.max(0, roarT - dt);

    if (monkey) {
      monkey.stagger = Math.max(0, monkey.stagger - dt);
      if (monkey.grab > 0) { monkey.grab += dt; monkey.x += dt * 260; }
      else if (monkey.flee > 0) { monkey.flee += dt; monkey.x += dt * 700; }
      else monkey.x = lerp(BASKET.x + 60, MONKEY_FAR, f);
    }

    if (state === 'win' && Math.random() < dt * 6) burstHearts(PX, GY - 400 * PS, 1);
    for (const d of dropped) d.t += dt;
    dropped = dropped.filter(d => d.t < 2.5);
    for (const c of crumbs) { c.t += dt; c.vy += 500 * dt; c.x += c.vx * dt; c.y += c.vy * dt; }
    crumbs = crumbs.filter(c => c.t < 0.8 && c.y < GY);
    for (const h of hearts) { h.t += dt; if (h.t > 0) { h.y -= 70 * dt; h.x += h.vx * dt; } }
    hearts = hearts.filter(h => h.t < 1.6);
    for (const p of popups) p.t += dt;
    popups = popups.filter(p => p.t < 1);
  }

  // ---- drawing ----

  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.3, x, y - s * 0.4);
    ctx.bezierCurveTo(x + s * 0.6, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
  }

  function drawBackground(ctx, v) {
    const g = ctx.createLinearGradient(0, v.y0, 0, GY);
    g.addColorStop(0, sky[0]);
    g.addColorStop(1, sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, GY - v.y0);
    // Misty hills.
    ctx.fillStyle = 'rgba(120,190,120,0.45)';
    ctx.beginPath();
    ctx.moveTo(v.x0, GY - 160);
    for (let x = v.x0; x <= v.x1 + 40; x += 40) ctx.lineTo(x, GY - 170 - Math.sin(x / 170) * 50 - Math.sin(x / 61) * 12);
    ctx.lineTo(v.x1, GY);
    ctx.lineTo(v.x0, GY);
    ctx.fill();
    // Bamboo: a pale far layer and a bright near one framing the scene.
    bamboo(ctx, [120, 250, 640, 760, 1080, 1180, -60, 1300], 16, 'rgba(110,170,90,0.55)', GY - 60, 0.6);
    // Grass.
    const gg = ctx.createLinearGradient(0, GY - 20, 0, v.y1);
    gg.addColorStop(0, '#8bd36a');
    gg.addColorStop(1, '#4f9a3a');
    ctx.fillStyle = gg;
    ctx.fillRect(v.x0, GY - 20, v.x1 - v.x0, v.y1 - GY + 20);
    ctx.strokeStyle = '#3f8a2e';
    ctx.lineWidth = 3;
    for (let x = Math.floor(v.x0 / 47) * 47; x < v.x1; x += 47) {
      ctx.beginPath();
      ctx.moveTo(x, GY + 40 + (x % 3) * 20);
      ctx.lineTo(x - 6, GY + 22 + (x % 3) * 20);
      ctx.moveTo(x + 8, GY + 40 + (x % 3) * 20);
      ctx.lineTo(x + 12, GY + 20 + (x % 3) * 20);
      ctx.stroke();
    }
    bamboo(ctx, [30, 1160], 30, '#4c9a3a', GY + 30, 1);
  }

  // Bamboo stalks: segments and a few leaves, swaying a little.
  function bamboo(ctx, xs, w, col, bottom, k) {
    for (const [i, x0] of xs.entries()) {
      const sway = Math.sin(t * 0.8 + i) * 6 * k;
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(x0, bottom);
      ctx.quadraticCurveTo(x0, 300, x0 + sway, -200);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(30,70,20,0.35)';
      ctx.lineWidth = 3;
      for (let y = bottom - 90; y > -150; y -= 95) {
        const xx = x0 + sway * (1 - (y + 200) / (bottom + 200));
        ctx.beginPath();
        ctx.moveTo(xx - w / 2, y);
        ctx.lineTo(xx + w / 2, y);
        ctx.stroke();
      }
      ctx.fillStyle = col;
      for (let j = 0; j < 3; j++) {
        const y = 140 + j * 150 + (i % 2) * 60;
        const xx = x0 + sway * (1 - (y + 200) / (bottom + 200));
        const dir = (i + j) % 2 ? 1 : -1;
        ctx.save();
        ctx.translate(xx, y);
        ctx.rotate(dir * (0.5 + Math.sin(t * 1.3 + i + j) * 0.08));
        ctx.beginPath();
        ctx.ellipse(dir * 34 * k, 0, 38 * k, 9 * k, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawTreat(ctx, kind, x, y, s = 1, a = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.scale(s, s);
    ctx.lineWidth = 3;
    if (kind === 'bamboo') {
      ctx.fillStyle = '#7fcf5a';
      ctx.strokeStyle = '#3f8a2e';
      ctx.beginPath(); ctx.roundRect(-9, -55, 18, 110, 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, -15); ctx.lineTo(9, -15); ctx.moveTo(-9, 25); ctx.lineTo(9, 25); ctx.stroke();
      ctx.fillStyle = '#4fb33a';
      ctx.beginPath(); ctx.ellipse(18, -50, 22, 7, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-16, -40, 18, 6, 0.7, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'apple') {
      ctx.fillStyle = '#ff4f5e';
      ctx.strokeStyle = '#a3122a';
      ctx.beginPath(); ctx.arc(-9, 2, 22, 0, Math.PI * 2); ctx.arc(9, 2, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.ellipse(-12, -8, 6, 9, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6a3a1a';
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(3, -30); ctx.stroke();
      ctx.fillStyle = '#4fb33a';
      ctx.beginPath(); ctx.ellipse(12, -27, 10, 5, -0.4, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'carrot') {
      ctx.fillStyle = '#ff8a2a';
      ctx.strokeStyle = '#b3510f';
      ctx.beginPath(); ctx.moveTo(-16, -30); ctx.quadraticCurveTo(0, -38, 16, -30); ctx.lineTo(2, 45); ctx.quadraticCurveTo(0, 49, -2, 45); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(0, -12); ctx.moveTo(-4, 10); ctx.lineTo(5, 8); ctx.stroke();
      ctx.fillStyle = '#4fb33a';
      for (const r of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(Math.sin(r) * 14, -44, 5, 15, r, 0, Math.PI * 2); ctx.fill(); }
    } else {
      // Bao bun.
      ctx.fillStyle = '#fff6e6';
      ctx.strokeStyle = '#c8a878';
      ctx.beginPath(); ctx.ellipse(0, 4, 32, 25, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 2;
      for (const r of [-0.6, -0.2, 0.2, 0.6]) { ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(Math.sin(r) * 18, -8, Math.sin(r) * 26, 0); ctx.stroke(); }
      ctx.fillStyle = '#ff8aa0';
      ctx.beginPath(); ctx.arc(0, -16, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawBasket(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    drawTreat(ctx, 'bamboo', -30, -78, 1, -0.25);
    drawTreat(ctx, 'bamboo', 6, -86, 1, 0.1);
    drawTreat(ctx, 'apple', 34, -62, 0.9);
    drawTreat(ctx, 'carrot', -54, -58, 0.8, -0.6);
    const g = ctx.createLinearGradient(0, -70, 0, 0);
    g.addColorStop(0, '#d9a25a');
    g.addColorStop(1, '#9a6a2a');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#6a4318';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-80, -64); ctx.lineTo(80, -64); ctx.lineTo(62, 0); ctx.lineTo(-62, 0); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,55,20,0.5)';
    ctx.lineWidth = 3;
    for (let yy = -48; yy < 0; yy += 14) { ctx.beginPath(); ctx.moveTo(-76 + (yy + 64) * 0.28, yy); ctx.lineTo(76 - (yy + 64) * 0.28, yy); ctx.stroke(); }
    ctx.restore();
  }

  function drawPanda(ctx) {
    const sad = state === 'lose' ? 1 : smooth(PANDA_SAD_LEVEL, PANDA_SUCK_LEVEL, mood);
    const happy = smooth(0.55, 0.9, mood);
    const eating = chew > 0;
    const crying = state === 'lose';
    const belly = 1 + 0.16 * progressShown;
    const hop = state === 'win' ? Math.abs(Math.sin(t * 7)) * 30 * smooth(0, 0.3, endT) : 0;
    const sway = state === 'win' ? Math.sin(t * 7) * 0.06 : Math.sin(t * 1.4) * 0.025 * (0.3 + happy);
    const flying = treats.find(tr => tr.hit);
    const catching = flying && flying.t > 0.4;
    // Where the eyes look: a flying treat, a missed one, the monkey, the basket when hungry.
    let look = 0;
    if (flying) look = 4;
    else if (missT > 0) look = missX > PX ? 5 : -5;
    else if (monkey && !monkey.flee) look = 5;
    else if (mood < 0.6 && !eating && state === 'play') look = 4;

    ctx.save();
    ctx.translate(PX, GY - hop);
    ctx.scale(PS, PS);
    ctx.rotate(sway);
    ctx.lineJoin = 'round';
    const INK = '#26262e', FUR = '#f8f8f2';

    // Ears (droop when sad).
    ctx.fillStyle = INK;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(s * (72 + sad * 12), -380 + sad * 18, 34, 0, Math.PI * 2);
      ctx.fill();
    }
    // Body, shoulders band, legs.
    ctx.fillStyle = FUR;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, -140, 128 * belly, 138, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.beginPath(); ctx.ellipse(18, -120, 90 * belly, 100, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.ellipse(0, -225, 122, 42, 0, 0, Math.PI * 2); ctx.fill();
    for (const s of [-1, 1]) {
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.ellipse(s * 88 * belly, -34, 56, 42, s * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a5a66';
      ctx.beginPath(); ctx.ellipse(s * 98 * belly, -34, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
      for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.arc(s * 98 * belly + k * 14, -58, 6, 0, Math.PI * 2); ctx.fill(); }
    }

    // Head.
    const hx = 0, hy = -300 + sad * 8;
    ctx.fillStyle = FUR;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(hx, hy, 102, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Accessory: a bow on the ear side, sometimes a flower.
    if (flower) {
      ctx.fillStyle = bow;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(hx + 62 + Math.cos(a) * 14, hy - 78 + Math.sin(a) * 14, 11, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(hx + 62, hy - 78, 9, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = bow;
      ctx.strokeStyle = mixColor(bow, '#000000', 0.35);
      ctx.lineWidth = 3;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(hx + 60, hy - 82);
        ctx.lineTo(hx + 60 + s * 30, hy - 100);
        ctx.lineTo(hx + 60 + s * 30, hy - 62);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(hx + 60, hy - 82, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    // Eye patches (tilted, sadder when sad).
    ctx.fillStyle = INK;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(hx + s * 40, hy - 2, 27, 37, s * (0.55 + sad * 0.25), 0, Math.PI * 2);
      ctx.fill();
    }
    // Eyes: closed happy arcs while eating or winning, blinking, otherwise looking around.
    const closed = eating || state === 'win' || blink > 0 || roarT > 0;
    for (const s of [-1, 1]) {
      const ex = hx + s * 38, ey = hy - 6;
      if (closed) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (roarT > 0) { ctx.moveTo(ex - 10, ey - 4 * s); ctx.lineTo(ex + 10, ey + 4 * s); } // fierce
        else ctx.arc(ex, ey + 4, 9, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex, ey, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(ex + look, ey + 1 + sad * 2, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex + look + 2, ey - 2, 2, 0, Math.PI * 2); ctx.fill();
      }
      // Sad brows.
      if (sad > 0.3) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(ex - s * 16, ey - 46);
        ctx.lineTo(ex + s * 12, ey - 46 - 10 * sad);
        ctx.stroke();
      }
    }
    // Blush when happy.
    if (happy > 0.3) {
      ctx.fillStyle = `rgba(255,130,160,${0.45 * happy})`;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + s * 66, hy + 30, 15, 10, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    // Nose and mouth.
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.ellipse(hx, hy + 28, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
    const my = hy + 46;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    if (crying || roarT > 0) {
      const o = roarT > 0 ? 14 : 10 + Math.sin(t * 12) * 3;
      ctx.fillStyle = '#7a1a2a';
      ctx.beginPath(); ctx.ellipse(hx, my + 8, o * 1.2, o, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (eating) {
      const o = 4 + Math.abs(Math.sin(t * 13)) * 9;
      ctx.fillStyle = '#7a1a2a';
      ctx.beginPath(); ctx.ellipse(hx, my + 6, 12, o, 0, 0, Math.PI * 2); ctx.fill();
    } else if (suck < 0.5) {
      const curve = lerp(10, -9, sad) * (1 - 0.4 * smooth(0.6, 0.4, mood) * (1 - sad));
      ctx.beginPath();
      ctx.moveTo(hx - 18, my + 4);
      ctx.quadraticCurveTo(hx - 9, my + 4 + curve, hx, my);
      ctx.quadraticCurveTo(hx + 9, my + 4 + curve, hx + 18, my + 4);
      ctx.stroke();
    }
    // Tears: drops when sad, streams when crying.
    if (crying) {
      ctx.strokeStyle = 'rgba(90,170,255,0.8)';
      ctx.lineWidth = 9;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(hx + s * 40, hy + 8);
        ctx.quadraticCurveTo(hx + s * (70 + Math.sin(t * 9) * 6), hy + 70, hx + s * 64, hy + 150);
        ctx.stroke();
      }
    } else if (sad > 0.5) {
      ctx.fillStyle = 'rgba(90,170,255,0.85)';
      for (const s of [-1, 1]) {
        const k = ((t * 0.7 + (s > 0 ? 0.5 : 0)) % 1);
        ctx.beginPath(); ctx.arc(hx + s * (44 + k * 8), hy + 12 + k * 70, 6, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Arms: resting on the belly, up to the mouth to eat / catch, one paw sucked, waving on a win, fierce on a roar.
    const rest = s => [s * 62 * belly, -120];
    const mouth = s => [s * 30, hy + 52];
    const paws = [-1, 1].map(s => {
      let p = rest(s);
      if (eating || catching) p = mouth(s);
      else if (state === 'win') p = [s * 150, -320 - Math.sin(t * 7 + s) * 30];
      else if (roarT > 0) p = [s * 150, -260];
      else if (s > 0 && suck > 0) p = [lerp(p[0], 8, suck), lerp(p[1], hy + 50 + Math.sin(t * 6) * 3, suck)];
      return p;
    });
    ctx.strokeStyle = INK;
    ctx.lineWidth = 48;
    ctx.lineCap = 'round';
    for (const [i, s] of [-1, 1].entries()) {
      ctx.beginPath();
      ctx.moveTo(s * 96, -212);
      ctx.lineTo(paws[i][0], paws[i][1]);
      ctx.stroke();
    }
    if (eating) {
      const left = chew / PANDA_CHEW_TIME;
      drawTreat(ctx, chewKind, 0, hy + 70, 0.5 + 0.5 * left, chewKind === 'bamboo' ? 1.45 : 0);
    }
    ctx.fillStyle = '#3a3a44';
    for (const p of paws) { ctx.beginPath(); ctx.arc(p[0], p[1], 25, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function drawMonkey(ctx) {
    if (!monkey || monkey.x > DW + 300) return;
    const s = bigBoss ? 1.35 : 1;
    const moving = !monkey.stagger;
    const hop = moving ? Math.abs(Math.sin(t * 9)) * 14 : 0;
    const scared = monkey.stagger > 0 || monkey.flee > 0;
    const dir = monkey.flee > 0 || monkey.grab > 0 ? -1 : 1; // 1 = facing left (toward the basket)
    ctx.save();
    ctx.translate(monkey.x + (monkey.stagger > 0 ? Math.sin(t * 40) * 6 : 0), GY - hop);
    ctx.scale(s * dir, s);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#4a2a14';
    // Tail.
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(30, -50);
    ctx.bezierCurveTo(90, -40, 90, -140, 55, -140 + Math.sin(t * 4) * 8);
    ctx.stroke();
    // Body, legs, arms.
    ctx.fillStyle = '#8a5a33';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, -62, 40, 46, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8c49a';
    ctx.beginPath(); ctx.ellipse(-6, -56, 24, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a5a33';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(-20, -24); ctx.lineTo(-30, 0);
    ctx.moveTo(20, -24); ctx.lineTo(26, 0);
    const reach = scared ? -120 : -70 + Math.sin(t * 6) * 10;
    ctx.moveTo(-28, -80); ctx.lineTo(-62, reach);
    ctx.moveTo(26, -80); ctx.lineTo(44, -40);
    ctx.stroke();
    // Head.
    ctx.fillStyle = '#8a5a33';
    ctx.strokeStyle = '#4a2a14';
    ctx.lineWidth = 3;
    for (const ex of [-52, 22]) { ctx.beginPath(); ctx.arc(ex, -130, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(-15, -128, 40, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f0c9a0';
    ctx.beginPath(); ctx.ellipse(-22, -118, 29, 26, 0, 0, Math.PI * 2); ctx.fill();
    for (const ex of [-52, 22]) { ctx.beginPath(); ctx.arc(ex, -130, 7, 0, Math.PI * 2); ctx.fill(); }
    // Eyes and grin (shocked O when hit).
    ctx.fillStyle = '#fff';
    for (const ex of [-34, -10]) { ctx.beginPath(); ctx.arc(ex, -132, scared ? 9 : 7, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#222';
    for (const ex of [-34, -10]) { ctx.beginPath(); ctx.arc(ex - 2, -132, scared ? 3 : 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#4a2a14';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (scared) { ctx.fillStyle = '#5a1a1a'; ctx.ellipse(-22, -106, 7, 9, 0, 0, Math.PI * 2); ctx.fill(); }
    else {
      ctx.fillStyle = '#fff';
      ctx.moveTo(-40, -112); ctx.quadraticCurveTo(-22, -92, -4, -112); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (bigBoss) {
      ctx.fillStyle = '#ffd23f';
      ctx.strokeStyle = '#b07d00';
      ctx.beginPath();
      ctx.moveTo(-42, -162); ctx.lineTo(-38, -192); ctx.lineTo(-26, -174); ctx.lineTo(-15, -198); ctx.lineTo(-4, -174); ctx.lineTo(8, -192); ctx.lineTo(12, -162); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    if (monkey.grab > 0) drawBasket(ctx, monkey.x + 10, GY - 150 * s - hop + 70);
    if (!monkey.flee && !monkey.grab) drawHearts(ctx, monkey.x - 15 * s, GY - 215 * s, monkey.hp);
  }

  // Happiness heart in the corner: fills with the level, pulses when low.
  function drawMeter(ctx) {
    const level = monkey && !monkey.flee && state === 'play' ? 1 : state === 'lose' ? 0 : lastF;
    const low = level < WARN_LEVEL && state === 'play';
    const s = 46 * (low ? 1 + Math.sin(t * 10) * 0.06 : 1);
    const x = 1090, y = 120;
    ctx.save();
    heartPath(ctx, x, y, s);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();
    ctx.clip();
    const top = y + s * 0.9 - level * s * 2.25;
    ctx.fillStyle = low ? '#ff3b5c' : '#ff6f91';
    ctx.fillRect(x - s * 1.7, top, s * 3.4, s * 3);
    ctx.restore();
    heartPath(ctx, x, y, s);
    ctx.strokeStyle = '#8a1a3a';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐼', x, y + 2);
  }

  function drawEffects(ctx) {
    for (const d of dropped) {
      ctx.globalAlpha = 1 - smooth(1.8, 2.5, d.t);
      drawTreat(ctx, d.kind, d.x + Math.min(d.t, 0.6) * 60, GY - 18, 0.8, d.a + Math.min(d.t, 0.6) * 3);
    }
    ctx.globalAlpha = 1;
    for (const tr of treats) {
      const u = clamp(tr.t, 0, 1);
      const x = lerp(BASKET.x, tr.x1, u);
      const y = lerp(BASKET.y - 90, tr.y1, u) - 260 * 4 * u * (1 - u);
      drawTreat(ctx, tr.kind, x, y, 0.9, u * 7);
    }
    for (const c of crumbs) {
      ctx.fillStyle = c.c;
      ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
    }
    for (const h of hearts) {
      if (h.t < 0) continue;
      ctx.globalAlpha = 1 - smooth(1, 1.6, h.t);
      heartPath(ctx, h.x, h.y, h.s);
      ctx.fillStyle = '#ff5c8a';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const p of popups) {
      const k = smooth(0, 0.15, p.t);
      ctx.save();
      ctx.globalAlpha = 1 - smooth(0.7, 1, p.t);
      ctx.translate(p.x, p.y - p.t * 40);
      ctx.scale(k, k);
      ctx.font = `bold ${p.small ? 30 : 56}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = p.small ? 6 : 10;
      ctx.strokeStyle = p.small ? '#5a3a1a' : '#6a1a3a';
      ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.small ? '#ffe9b0' : '#ffd23f';
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
  }

  function draw(ctx, W, H) {
    const v = fitScene(W, H, DW, DH);
    ctx.save();
    ctx.translate(v.ox, v.oy);
    ctx.scale(v.s, v.s);
    drawBackground(ctx, v);
    if (!monkey || !monkey.grab) drawBasket(ctx, BASKET.x, BASKET.y);
    drawPanda(ctx);
    drawMonkey(ctx);
    drawEffects(ctx);
    drawMeter(ctx);
    ctx.restore();
  }

  return { correct, wrong, win, lose, update, draw, bossStart, bossHit };
}
