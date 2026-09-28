// "Railway Rush" process: a train rides on rails laid in front of it — if the rails run out, it derails.

const TRAIN_COLORS = [
  { loco: '#e0453a', car: '#3a86e0' },
  { loco: '#2f9e5a', car: '#f4b400' },
  { loco: '#3a5bd0', car: '#ff7a8a' },
  { loco: '#8a4ad0', car: '#3ddc97' },
  { loco: '#e07a1a', car: '#5ab0e0' },
];

function createRailwayScene(opts) {
  const DW = 1200, DH = 780;
  const RAIL_Y = 640;     // top of the rails
  const FRONT = 430;      // design x of the locomotive's nose
  const col = TRAIN_COLORS[opts.step % TRAIN_COLORS.length];
  const hash = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  let t = 0, state = 'play', endT = 0;
  let cam = 0;                        // world x of the design-space left edge
  let lastF = 1;
  let speed = 0;                      // design px / s, for smoke
  let wheelA = 0;
  let railEnd = FRONT + RAIL_AHEAD;   // world x where the rails stop
  let pieces = [];                    // rail pieces { x, len, wait, fall }
  let junk = [];                      // a rail piece that bounced off (wrong answer)
  let smoke = [];
  let ravine = null;                  // boss: world x of the ravine's near edge
  let bridge = [];                    // placed bridge sections { i, t }
  let station = null;                 // world x of the station (win)
  let sparkles = [];
  let clanks = 0;
  for (let x = -700; x < railEnd; x += RAIL_PIECE) pieces.push({ x, len: Math.min(RAIL_PIECE, railEnd - x), wait: 0, fall: 0 });

  function lay(from, to) {
    let i = 0;
    for (let x = from; x < to - 1; x += RAIL_PIECE, i++) {
      pieces.push({ x, len: Math.min(RAIL_PIECE, to - x), wait: i * RAIL_LAY_STAGGER, fall: RAIL_DROP_TIME });
    }
    clanks = 3;
  }

  function correct() {
    const to = cam + FRONT + RAIL_AHEAD;
    lay(railEnd, to);
    railEnd = to;
  }

  function wrong() {
    junk.push({ x: railEnd + 40, y: RAIL_Y - 320, vx: 90, vy: 0, a: 0, va: 4, t: 0 });
  }

  function bossStart() { ravine = railEnd; }

  function bossHit(hp) {
    bridge.push({ i: BOSS_HITS - hp - 1, t: 0 });
    Sfx.clank();
  }

  function win() {
    state = 'win';
    endT = 0;
    if (ravine !== null) bridge.push({ i: BOSS_HITS - 1, t: 0 });
    station = cam + FRONT + RAIL_WIN_SPEED * END_ANIM_TIME / 2 - 60;
    setTimeout(() => Sfx.whistle(), 400);
  }

  function lose() {
    state = 'lose';
    endT = 0;
    Sfx.crash();
    for (let i = 0; i < 14; i++) smoke.push({ x: cam + FRONT + (Math.random() - 0.5) * 60, y: RAIL_Y - 20, r: 18, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 40, life: 0, dust: true });
  }

  function update(dt, f) {
    t += dt;
    if (state !== 'play') endT += dt;
    let move = 0;
    if (state === 'play') move = RAIL_AHEAD * Math.max(0, lastF - f);
    else if (state === 'win') move = RAIL_WIN_SPEED * Math.max(0, 1 - endT / END_ANIM_TIME) * dt;
    lastF = f;
    cam += move;
    wheelA += move / 26;
    speed += (move / Math.max(dt, 1e-3) - speed) * Math.min(1, dt * 4);

    for (const p of pieces) {
      if (p.wait > 0) p.wait -= dt;
      else if (p.fall > 0) {
        p.fall -= dt;
        if (p.fall <= 0 && clanks > 0) { clanks--; Sfx.clank(); }
      }
    }
    pieces = pieces.filter(p => p.x + p.len > cam - 800);
    for (const j of junk) {
      j.t += dt;
      j.vy += 1200 * dt;
      j.x += j.vx * dt;
      j.y += j.vy * dt;
      j.a += j.va * dt;
      if (j.y > RAIL_Y + 10 && j.vy > 0) { j.y = RAIL_Y + 10; j.vy *= -0.4; j.va *= 0.5; if (Math.abs(j.vy) > 60) Sfx.clank(); }
    }
    junk = junk.filter(j => j.t < 1.4);
    for (const b of bridge) b.t += dt;

    // Smoke from the chimney: more when moving.
    const chim = { x: cam + FRONT - 32, y: RAIL_Y - 158 };
    if (state !== 'lose' && Math.random() < dt * (3 + speed * 0.06)) {
      smoke.push({ x: chim.x, y: chim.y, r: 10, vx: -10, vy: -50 - Math.random() * 20, life: 0 });
    }
    for (const s of smoke) { s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += dt * 18; }
    smoke = smoke.filter(s => s.life < 2.2);

    if (state === 'win' && Math.random() < dt * 14) {
      sparkles.push({ x: station - cam + (Math.random() - 0.5) * 360, y: RAIL_Y - 120 - Math.random() * 260, life: 0, max: 0.8 + Math.random() * 0.5, r: 8 + Math.random() * 10 });
    }
    for (const s of sparkles) s.life += dt;
    sparkles = sparkles.filter(s => s.life < s.max);
  }

  // ---- drawing ----

  function drawBackground(ctx, v) {
    const sky = ctx.createLinearGradient(0, v.y0, 0, RAIL_Y);
    sky.addColorStop(0, '#5ab8ff');
    sky.addColorStop(1, '#d8f1ff');
    ctx.fillStyle = sky;
    ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, RAIL_Y + 10 - v.y0);
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(980, 130, 55, 0, Math.PI * 2);
    ctx.fill();
    // Clouds.
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const span = v.x1 - v.x0 + 400;
    for (let i = 0; i < 5; i++) {
      const x = v.x0 - 200 + ((((i * 390 - cam * 0.05 - t * 8) % span) + span) % span);
      const y = 90 + (i % 3) * 60;
      ctx.beginPath();
      ctx.ellipse(x, y, 70, 24, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 40, y + 6, 40, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 34, y - 12, 42, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Mountains and hills (parallax).
    const ridge = (par, base, amp, colr) => {
      ctx.fillStyle = colr;
      ctx.beginPath();
      ctx.moveTo(v.x0, RAIL_Y);
      for (let x = v.x0; x <= v.x1 + 20; x += 20) {
        const w = x + cam * par;
        ctx.lineTo(x, base - amp * (0.6 * Math.abs(Math.sin(w / 260)) + 0.4 * Math.sin(w / 97) * Math.sin(w / 41)));
      }
      ctx.lineTo(v.x1, RAIL_Y);
      ctx.fill();
    };
    ridge(0.12, 500, 150, '#a9c3dd');
    ridge(0.35, 580, 70, '#8fcf7a');
    // Trees behind the track.
    const k0 = Math.floor((cam + v.x0) / 150) - 1, k1 = Math.ceil((cam + v.x1) / 150) + 1;
    for (let k = k0; k <= k1; k++) {
      if (hash(k) < 0.35) continue;
      const x = k * 150 + hash(k + 7) * 70 - cam, s = 0.7 + hash(k + 3) * 0.6;
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(x - 6 * s, RAIL_Y - 40 * s, 12 * s, 40 * s);
      ctx.fillStyle = hash(k + 1) < 0.5 ? '#3f9a44' : '#4fae52';
      ctx.beginPath();
      ctx.arc(x, RAIL_Y - 70 * s, 38 * s, 0, Math.PI * 2);
      ctx.arc(x - 24 * s, RAIL_Y - 50 * s, 26 * s, 0, Math.PI * 2);
      ctx.arc(x + 24 * s, RAIL_Y - 50 * s, 26 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // Telegraph poles and wires.
    const p0 = Math.floor((cam + v.x0) / 320) - 1, p1 = Math.ceil((cam + v.x1) / 320) + 1;
    ctx.strokeStyle = '#6a4a2a';
    for (let k = p0; k <= p1; k++) {
      const x = k * 320 - cam;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x, RAIL_Y);
      ctx.lineTo(x, RAIL_Y - 190);
      ctx.moveTo(x - 22, RAIL_Y - 175);
      ctx.lineTo(x + 22, RAIL_Y - 175);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(60,40,30,0.6)';
      ctx.beginPath();
      ctx.moveTo(x, RAIL_Y - 178);
      ctx.quadraticCurveTo(x + 160, RAIL_Y - 150, x + 320, RAIL_Y - 178);
      ctx.stroke();
      ctx.strokeStyle = '#6a4a2a';
    }
    // Ground and the gravel bed.
    ctx.fillStyle = '#6cbf4a';
    ctx.fillRect(v.x0, RAIL_Y + 8, v.x1 - v.x0, v.y1 - RAIL_Y);
    ctx.fillStyle = '#5aa83e';
    ctx.fillRect(v.x0, RAIL_Y + 60, v.x1 - v.x0, v.y1 - RAIL_Y - 60);
    ctx.fillStyle = '#b8a58a';
    ctx.fillRect(v.x0, RAIL_Y + 8, v.x1 - v.x0, 18);
  }

  function drawRavine(ctx) {
    if (ravine === null) return;
    const x = ravine - cam, w = BRIDGE_GAP;
    const g = ctx.createLinearGradient(0, RAIL_Y, 0, DH);
    g.addColorStop(0, '#6a4a2a');
    g.addColorStop(1, '#3a2614');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, RAIL_Y + 8);
    ctx.lineTo(x + w, RAIL_Y + 8);
    ctx.lineTo(x + w - 30, DH);
    ctx.lineTo(x + 30, DH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3fa9f5';
    ctx.beginPath();
    ctx.moveTo(x + 36, DH);
    for (let i = 0; i <= 10; i++) ctx.lineTo(x + 36 + ((w - 72) * i) / 10, 830 + Math.sin(t * 4 + i) * 5);
    ctx.lineTo(x + w - 36, DH);
    ctx.fill();
    // Bridge sections drop in from above.
    const sw = w / BOSS_HITS;
    for (const b of bridge) {
      const drop = Math.max(0, 1 - b.t / 0.3);
      const bx = x + b.i * sw, by = RAIL_Y + 6 - drop * drop * 300;
      ctx.fillStyle = '#c0453a';
      ctx.fillRect(bx, by, sw, 14);
      ctx.strokeStyle = '#8a2a20';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bx + 4, by + 14);
      ctx.lineTo(bx + sw / 2, by + 90);
      ctx.lineTo(bx + sw - 4, by + 14);
      ctx.moveTo(bx + sw / 2, by + 90);
      ctx.lineTo(bx + sw / 2, by + 14);
      ctx.stroke();
      ctx.fillStyle = '#8a8f9a';
      ctx.fillRect(bx, by - 7, sw, 7);
    }
  }

  function drawRailPiece(ctx, x, len, dy) {
    ctx.fillStyle = '#7a5230';
    for (let s = 6; s < len; s += 30) ctx.fillRect(x + s, RAIL_Y + 5 + dy, 18, 11);
    ctx.fillStyle = '#8a8f9a';
    ctx.fillRect(x, RAIL_Y + dy, len, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x, RAIL_Y + dy, len, 2);
  }

  function drawRails(ctx, v) {
    let lastEnd = -Infinity;
    for (const p of pieces) {
      if (p.wait > 0) continue;
      const x = p.x - cam;
      if (x > v.x1 || x + p.len < v.x0) continue;
      const k = p.fall / RAIL_DROP_TIME;
      drawRailPiece(ctx, x, p.len, -k * k * 320);
      if (p.fall <= 0) lastEnd = Math.max(lastEnd, p.x + p.len);
    }
    if (state === 'win') {
      // Rails all the way to the station.
      let from = Math.max(railEnd, cam + v.x0);
      const skip = ravine !== null ? [ravine, ravine + BRIDGE_GAP] : null;
      for (let x = from; x < cam + v.x1; x += RAIL_PIECE) {
        if (skip && x + RAIL_PIECE > skip[0] && x < skip[1]) continue;
        drawRailPiece(ctx, x - cam, RAIL_PIECE, 0);
      }
    }
    return lastEnd;
  }

  function drawStation(ctx) {
    if (station === null) return;
    const x = station - cam;
    ctx.fillStyle = '#f2e2c0';
    ctx.fillRect(x - 130, RAIL_Y - 220, 260, 200);
    ctx.fillStyle = '#c0453a';
    ctx.beginPath();
    ctx.moveTo(x - 160, RAIL_Y - 215);
    ctx.lineTo(x, RAIL_Y - 300);
    ctx.lineTo(x + 160, RAIL_Y - 215);
    ctx.fill();
    ctx.fillStyle = '#3a86e0';
    ctx.fillRect(x - 100, RAIL_Y - 180, 60, 60);
    ctx.fillRect(x + 40, RAIL_Y - 180, 60, 60);
    ctx.fillStyle = '#7a4a2a';
    ctx.fillRect(x - 25, RAIL_Y - 120, 50, 100);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 70, RAIL_Y - 262, 140, 34);
    ctx.fillStyle = '#2a2350';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STATION', x, RAIL_Y - 245);
    const flags = ['#ff4f7b', '#ffd23f', '#3ddc97', '#4fd8ff', '#b36bff'];
    for (let i = 0; i < 10; i++) {
      const fx = x - 150 + i * 32;
      ctx.fillStyle = flags[i % flags.length];
      ctx.beginPath();
      ctx.moveTo(fx, RAIL_Y - 212);
      ctx.lineTo(fx + 26, RAIL_Y - 212);
      ctx.lineTo(fx + 13, RAIL_Y - 190 + Math.sin(t * 6 + i) * 3);
      ctx.fill();
    }
    ctx.fillStyle = '#9a9aa8';
    ctx.fillRect(x - 200, RAIL_Y - 20, 400, 20);
  }

  function wheel(ctx, x, y, r) {
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c0453a';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = wheelA * (26 / r) + (i * Math.PI) / 4;
      ctx.moveTo(x - Math.cos(a) * r * 0.75, y - Math.sin(a) * r * 0.75);
      ctx.lineTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75);
    }
    ctx.stroke();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  function face(ctx, x, y, r, hair) {
    ctx.fillStyle = '#f2c79a';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.arc(x, y - r * 0.3, r, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    const scared = state === 'lose' || (state === 'play' && lastF < 0.3);
    ctx.beginPath(); ctx.arc(x - r * 0.35, y, r * (scared ? 0.18 : 0.12), 0, Math.PI * 2); ctx.arc(x + r * 0.35, y, r * (scared ? 0.18 : 0.12), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (scared) ctx.ellipse(x, y + r * 0.5, r * 0.18, r * 0.24, 0, 0, Math.PI * 2);
    else ctx.arc(x, y + r * 0.25, r * 0.35, 0.3, Math.PI - 0.3);
    ctx.stroke();
  }

  function drawTrain(ctx) {
    const crash = state === 'lose' ? smooth(0, 0.8, endT) : 0;
    const fallIn = ravine !== null && bridge.length < BOSS_HITS;
    const bob = state === 'lose' ? 0 : Math.sin(t * 14) * Math.min(1.5, speed * 0.02);
    ctx.save();
    ctx.translate(FRONT, RAIL_Y + bob);
    // Passenger car and tender.
    ctx.fillStyle = col.car;
    ctx.beginPath(); ctx.roundRect(-560, -132, 200, 104, 12); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-568, -142, 216, 14);
    ctx.fillStyle = '#d8f1ff';
    ['#5a3a1a', '#2a2a2a', '#c08a3a'].forEach((hair, i) => {
      const wx = -545 + i * 62;
      ctx.fillStyle = '#d8f1ff';
      ctx.fillRect(wx, -118, 48, 40);
      face(ctx, wx + 24, -94, 12, hair);
    });
    wheel(ctx, -525, -16, 16);
    wheel(ctx, -395, -16, 16);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-362, -40, 34, 8);
    ctx.fillStyle = mixColor(col.loco, '#000000', 0.35);
    ctx.beginPath(); ctx.roundRect(-330, -100, 115, 72, 8); ctx.fill();
    ctx.fillStyle = '#222';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-315 + i * 22, -100, 14, Math.PI, Math.PI * 2); ctx.fill(); }
    wheel(ctx, -300, -16, 16);
    wheel(ctx, -245, -16, 16);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-218, -40, 16, 8);
    // Locomotive (tips over the rail end when it derails).
    ctx.rotate(crash * (fallIn ? 0.95 : 0.45));
    if (fallIn) ctx.translate(crash * 30, crash * 130);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-205, -44, 205, 16);
    ctx.fillStyle = col.loco;
    ctx.beginPath(); ctx.roundRect(-152, -104, 112, 62, 14); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (const bx of [-130, -95, -60]) ctx.fillRect(bx, -104, 6, 62);
    ctx.fillStyle = '#4a4a55';
    ctx.beginPath(); ctx.roundRect(-46, -106, 42, 66, 8); ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath(); ctx.arc(-10, -112, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.moveTo(-36, -104); ctx.lineTo(-40, -140); ctx.lineTo(-50, -154); ctx.lineTo(-14, -154); ctx.lineTo(-24, -140); ctx.lineTo(-28, -104);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(-96, -104, 16, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = mixColor(col.loco, '#000000', 0.2);
    ctx.fillRect(-208, -152, 60, 112);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-216, -160, 76, 12);
    ctx.fillStyle = '#d8f1ff';
    ctx.fillRect(-198, -140, 40, 38);
    face(ctx, -178, -116, 13, '#6a3a1a');
    ctx.fillStyle = '#3a5bd0';
    ctx.fillRect(-193, -134, 30, 6); // cap
    ctx.fillStyle = '#6a6a78';
    ctx.beginPath(); ctx.moveTo(-4, -30); ctx.lineTo(16, -2); ctx.lineTo(-4, -2); ctx.fill();
    wheel(ctx, -170, -26, 26);
    wheel(ctx, -108, -26, 26);
    wheel(ctx, -36, -16, 16);
    const rx = Math.cos(wheelA) * 13, ry = Math.sin(wheelA) * 13;
    ctx.strokeStyle = '#b8b8c8';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-170 + rx, -26 + ry);
    ctx.lineTo(-108 + rx, -26 + ry);
    ctx.stroke();
    ctx.restore();
  }

  function drawEffects(ctx) {
    for (const s of smoke) {
      const a = (1 - s.life / 2.2) * (s.dust ? 0.6 : 0.5);
      ctx.fillStyle = s.dust ? `rgba(150,120,90,${a})` : `rgba(240,240,245,${a})`;
      ctx.beginPath();
      ctx.arc(s.x - cam, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const j of junk) {
      ctx.save();
      ctx.globalAlpha = 1 - smooth(0.9, 1.4, j.t);
      ctx.translate(j.x - cam, j.y);
      ctx.rotate(j.a);
      ctx.fillStyle = '#8a8f9a';
      ctx.fillRect(-30, -4, 60, 8);
      ctx.restore();
    }
    for (const s of sparkles) {
      const k = Math.sin((s.life / s.max) * Math.PI);
      ctx.fillStyle = `rgba(255,220,60,${k})`;
      starPath(ctx, s.x, s.y, s.r * k, 0.4);
      ctx.fill();
    }
  }

  function draw(ctx, W, H) {
    const v = fitScene(W, H, DW, DH);
    ctx.save();
    ctx.translate(v.ox, v.oy);
    ctx.scale(v.s, v.s);
    drawBackground(ctx, v);
    drawStation(ctx);
    drawRavine(ctx);
    drawRails(ctx, v);
    drawTrain(ctx);
    drawEffects(ctx);
    // Warning sign at the rail end when the train gets close.
    if (state === 'play' && lastF < 0.35) {
      const x = railEnd - cam + 30;
      ctx.fillStyle = Math.sin(t * 10) > 0 ? '#ff3b3b' : '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(x, RAIL_Y - 90); ctx.lineTo(x + 26, RAIL_Y - 44); ctx.lineTo(x - 26, RAIL_Y - 44);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', x, RAIL_Y - 58);
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(x - 3, RAIL_Y - 44, 6, 44);
    }
    ctx.restore();
  }

  return { correct, wrong, win, lose, update, draw, bossStart, bossHit };
}
