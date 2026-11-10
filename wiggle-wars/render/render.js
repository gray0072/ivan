'use strict';

// Wiggle Wars — draws a frame: the sky and backdrop, the water behind, the land, the objects,
// the shots, the worms (with the weapon in hand, the jetpack, the drill), the effects (blasts,
// smoke, dirt, splashes, sparks), the aim (crosshair, power wedge, aim guide, the last shot's
// trace, a weapon's target or ghost), the water in front, then on the screen: the worms' names
// and health, the active worm's arrow, floating numbers and the touch joystick. The effects are
// made from the game events. Used by game.js every frame.

const Render = (() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  let dpr = 1, time = 0;
  const parts = [];    // world-space effects
  const floats = [];   // floating numbers and words (world position, drawn on the screen)
  let plane = null;
  let lastSmoke = 0;
  const view = { hover: null, guide: true }; // set by game.js: the world point under the mouse

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    dpr = canvasScale(w, h);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    Camera.resize(w, h);
  }

  // ---------- effects from the events ----------
  function add(p) { if (parts.length < 700) parts.push(p); }
  function soilColor() { const s = match.theme.soil; return s[Math.floor(Math.random() * s.length)]; }
  GameEvents.on('explosion', (e) => {
    add({ type: 'flash', x: e.x, y: e.y, r: e.r * 1.3, life: 0.16, max: 0.16 });
    add({ type: 'ring', x: e.x, y: e.y, r: e.r, life: 0.35, max: 0.35 });
    for (let i = 0; i < 5 + e.r / 6; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * e.r * 0.6;
      add({ type: 'fire', x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30 - 20, r: e.r * (0.25 + Math.random() * 0.25), life: 0.4, max: 0.4 });
    }
    for (let i = 0; i < 4 + e.r / 8; i++) {
      add({ type: 'smoke', x: e.x + rand(-e.r, e.r) * 0.5, y: e.y + rand(-e.r, e.r) * 0.4, vx: rand(-15, 15), vy: rand(-45, -20), r: e.r * rand(0.3, 0.55), life: rand(1.1, 2), max: 2 });
    }
    for (let i = 0; i < 6 + e.r / 2.5; i++) {
      const a = -Math.PI / 2 + rand(-1.4, 1.4), sp = rand(120, 380) * (0.6 + e.r / 80);
      add({ type: 'dirt', x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(1.2, 3), color: soilColor(), life: rand(0.6, 1.3), max: 1.3 });
    }
    Camera.shake(e.r / 7);
  });
  GameEvents.on('damage', (e) => floats.push({ x: e.worm.x, y: e.worm.y - 40, text: '−' + e.amount, color: teamColor(match.teams[e.worm.team].color).light, life: 1.6, max: 1.6 }));
  GameEvents.on('splash', (e) => {
    for (let i = 0; i < (e.small ? 8 : 18); i++) add({ type: 'drop', x: e.x + rand(-6, 6), y: e.y, vx: rand(-80, 80), vy: rand(-260, -90), r: rand(1.2, 2.6), life: 1, max: 1 });
  });
  GameEvents.on('drown', (e) => {
    add({ type: 'sinker', worm: Object.assign({}, e.worm), x: e.worm.x, y: e.worm.y, life: 2.2, max: 2.2 });
    floats.push({ x: e.worm.x, y: match.water - 30, text: tr('Drowned!'), color: '#bfe3ff', life: 1.8, max: 1.8 });
    for (let i = 0; i < 18; i++) add({ type: 'drop', x: e.worm.x + rand(-8, 8), y: match.water, vx: rand(-90, 90), vy: rand(-280, -100), r: rand(1.2, 2.8), life: 1, max: 1 });
  });
  GameEvents.on('shotgun', (e) => add({ type: 'tracer', x: e.x0, y: e.y0, x1: e.x1, y1: e.y1, life: 0.18, max: 0.18 }));
  GameEvents.on('bat', (e) => add({ type: 'whack', x: e.x, y: e.y, life: 0.3, max: 0.3, hit: e.hit }));
  GameEvents.on('teleport', (e) => {
    for (const p of [e.from, e.to]) for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      add({ type: 'spark', x: p.x, y: p.y, vx: Math.cos(a) * rand(30, 90), vy: Math.sin(a) * rand(30, 90), r: 2, color: '#c9a2ff', life: 0.8, max: 0.8 });
    }
  });
  GameEvents.on('pickup', (e) => {
    const text = e.kind === 'health' ? '+' + HEALTH_CRATE : e.kind === 'gold' ? tr('Golden crate!') : tr(WEAPONS[e.weapon].name);
    floats.push({ x: e.worm.x, y: e.worm.y - 44, text, color: e.kind === 'health' ? '#9cff9c' : '#ffe08a', life: 2, max: 2 });
  });
  GameEvents.on('crateGone', (e) => {
    for (let i = 0; i < 10; i++) add({ type: 'dirt', x: e.x, y: e.y, vx: rand(-150, 150), vy: rand(-250, -60), r: 2, color: '#b07a3c', life: 1, max: 1 });
  });
  GameEvents.on('targetBroken', (e) => {
    for (let i = 0; i < 14; i++) add({ type: 'dirt', x: e.x, y: e.y, vx: rand(-160, 160), vy: rand(-260, -60), r: 2, color: i % 2 ? '#ffffff' : '#e5534b', life: 1.1, max: 1.1 });
  });
  GameEvents.on('airstrike', (e) => { plane = { x: e.x - e.dir * 1400, y: -110, dir: e.dir, life: 4 }; });
  GameEvents.on('death', (e) => floats.push({ x: e.worm.x, y: e.worm.y - 30, text: tr('Bye, {name}!', { name: e.worm.name }), color: '#ffffff', life: 1.6, max: 1.6 }));

  function updateParts(dt) {
    const g = GRAVITY * (match ? match.gravity : 1);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.type === 'dirt' || p.type === 'drop' || p.type === 'spark') {
        p.vy += g * dt * (p.type === 'spark' ? 0.1 : 1);
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.type === 'dirt' && Terrain.solid(p.x, p.y)) { p.vx *= -0.3; p.vy *= -0.3; }
      } else if (p.type === 'smoke' || p.type === 'fire') {
        p.x += (p.vx + (match ? match.wind * 25 : 0)) * dt; p.y += p.vy * dt;
      } else if (p.type === 'sinker') {
        p.y += 30 * dt;
      }
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life -= dt; f.y -= 22 * dt;
      if (f.life <= 0) floats.splice(i, 1);
    }
    if (plane) { plane.x += plane.dir * 700 * dt; plane.life -= dt; if (plane.life <= 0) plane = null; }
    // smoke behind flying missiles
    lastSmoke -= dt;
    if (lastSmoke <= 0 && match) {
      lastSmoke = 0.03;
      for (const s of match.shots) {
        if (s.kind === 'missile' || s.kind === 'bomb') add({ type: 'smoke', x: s.x, y: s.y, vx: 0, vy: -8, r: 3.5, life: 0.7, max: 0.7, light: true });
        if (s.kind === 'dynamite' || (s.kind === 'grenade' && s.fuse !== null)) add({ type: 'spark', x: s.x, y: s.y - 5, vx: rand(-30, 30), vy: rand(-60, -20), r: 1.2, color: '#ffd54f', life: 0.3, max: 0.3 });
      }
      for (const w of match.worms) {
        if (w.alive && w.state === 'jet' && w.jet && (w.jet.up || w.jet.side) && w.jet.fuel > 0) {
          add({ type: 'fire', x: w.x - w.facing * 5, y: w.y - 2, vx: rand(-10, 10), vy: 90, r: 3, life: 0.2, max: 0.2 });
        }
        if (w.alive && w.state === 'drill') add({ type: 'dirt', x: w.x + w.drill.x * 12, y: w.y - WORM_R + w.drill.y * 12, vx: rand(-80, 80), vy: rand(-140, -40), r: 1.6, color: soilColor(), life: 0.6, max: 0.6 });
      }
    }
  }

  function drawParts(c) {
    for (const p of parts) {
      const k = p.life / p.max;
      switch (p.type) {
        case 'flash': {
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, `rgba(255,255,240,${k})`); g.addColorStop(0.5, `rgba(255,220,120,${k * 0.8})`); g.addColorStop(1, 'rgba(255,160,60,0)');
          c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill();
          break;
        }
        case 'ring':
          c.strokeStyle = `rgba(255,255,255,${k * 0.6})`; c.lineWidth = 3 * k + 0.5;
          c.beginPath(); c.arc(p.x, p.y, p.r * (1.4 - k * 0.5), 0, Math.PI * 2); c.stroke();
          break;
        case 'fire':
          c.fillStyle = `rgba(255,${Math.round(120 + 120 * k)},40,${k})`;
          c.beginPath(); c.arc(p.x, p.y, p.r * (1.2 - k * 0.4), 0, Math.PI * 2); c.fill();
          break;
        case 'smoke':
          c.fillStyle = p.light ? `rgba(230,230,230,${k * 0.5})` : `rgba(70,70,75,${k * 0.45})`;
          c.beginPath(); c.arc(p.x, p.y, p.r * (1.6 - k * 0.6), 0, Math.PI * 2); c.fill();
          break;
        case 'dirt':
        case 'spark':
          c.fillStyle = p.color; c.globalAlpha = Math.min(1, k * 2);
          c.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
          c.globalAlpha = 1;
          break;
        case 'drop':
          c.fillStyle = `rgba(200,230,255,${k})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill();
          break;
        case 'tracer':
          c.strokeStyle = `rgba(255,240,180,${k * 5})`; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x1, p.y1); c.stroke();
          break;
        case 'whack': {
          c.fillStyle = p.hit ? '#ffe08a' : 'rgba(255,255,255,0.6)';
          c.beginPath();
          for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r = (i % 2 ? 4 : 10) * (1.3 - k * 0.5); c.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); }
          c.closePath(); c.globalAlpha = k * 2; c.fill(); c.globalAlpha = 1;
          break;
        }
        case 'sinker':
          c.globalAlpha = k;
          drawWorm(c, p.worm, false);
          c.globalAlpha = 1;
          p.worm.y = p.y;
          break;
      }
    }
  }

  // ---------- worms ----------
  function drawWorm(c, w, active, color) {
    const col = color || teamColor(match.teams[w.team].color), f = w.facing;
    const bob = w.grounded ? Math.sin(time * 3 + w.id) * 0.6 : 0;
    c.save();
    c.translate(w.x, w.y);
    if (!w.grounded && w.flip) { c.translate(0, -WORM_R); c.rotate(-f * w.air * 10); c.translate(0, WORM_R); }
    if (w.state === 'jet') {
      c.fillStyle = '#9aa5b1'; c.strokeStyle = '#1b2430'; c.lineWidth = 1;
      c.fillRect(-f * 9 - 3, -16, 6, 11); c.strokeRect(-f * 9 - 3, -16, 6, 11);
    }
    const shapes = (fn) => {
      fn((p) => { p.ellipse(-f * 4.5, -3.2, 5.5, 3.3, 0, 0, Math.PI * 2); });
      fn((p) => { p.ellipse(0, -7, 6.2, 7, 0, 0, Math.PI * 2); });
      fn((p) => { p.arc(f * 1.5, -14.5 + bob, 6.2, 0, Math.PI * 2); });
    };
    c.lineWidth = 2.4; c.strokeStyle = col.dark;
    shapes((sh) => { c.beginPath(); sh(c); c.stroke(); });
    c.fillStyle = col.light;
    shapes((sh) => { c.beginPath(); sh(c); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.ellipse(f * 2.4, -6, 2.6, 4.6, 0, 0, Math.PI * 2); c.fill();
    // the headband
    c.fillStyle = col.main;
    c.beginPath(); c.ellipse(f * 1.5, -18.2 + bob, 6, 2, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-f * 3.5, -18 + bob); c.lineTo(-f * 9, -20 + bob); c.lineTo(-f * 8, -16 + bob); c.closePath(); c.fill();
    // eyes, looking along the aim
    const dying = w.hp <= 0;
    const dir = Weapons.aimDir(w);
    const look = active ? dir : { x: f, y: 0 };
    for (const ex of [f * 3.6, f * 0.2]) {
      const ey = -15 + bob;
      c.fillStyle = '#fff';
      c.beginPath(); c.ellipse(ex, ey, 2.2, 2.7, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = col.dark; c.lineWidth = 0.6; c.stroke();
      if (dying) {
        c.strokeStyle = '#1b2430'; c.lineWidth = 0.9;
        c.beginPath(); c.moveTo(ex - 1.3, ey - 1.3); c.lineTo(ex + 1.3, ey + 1.3); c.moveTo(ex + 1.3, ey - 1.3); c.lineTo(ex - 1.3, ey + 1.3); c.stroke();
      } else {
        c.fillStyle = '#1b2430';
        c.beginPath(); c.arc(ex + look.x * 0.9, ey + look.y * 1.1, 1.15, 0, Math.PI * 2); c.fill();
      }
    }
    c.restore();
  }

  function drawHeld(c, w, id) {
    const dir = Weapons.aimDir(w);
    const kind = WEAPONS[id].kind;
    if (['power', 'skip', 'teleport', 'airstrike', 'plank', 'jetpack'].includes(kind)) return;
    c.save();
    c.translate(w.x + w.facing * 2, w.y - WORM_R - 1);
    c.rotate(Math.atan2(dir.y, dir.x));
    if (w.facing < 0) c.scale(1, -1);
    WeaponArt.draw(c, id, 7, 1, kind === 'grenade' || kind === 'drop' ? 8 : 15);
    c.restore();
  }

  // ---------- objects and shots ----------
  function drawObject(c, o) {
    const x = o.x, y = o.y;
    switch (o.type) {
      case 'crate':
      case 'gold': {
        if (o.parachute) {
          c.strokeStyle = 'rgba(40,40,40,0.7)'; c.lineWidth = 0.8;
          c.beginPath(); c.moveTo(x - 8, y - 16); c.lineTo(x - 15, y - 34); c.moveTo(x + 8, y - 16); c.lineTo(x + 15, y - 34); c.stroke();
          c.fillStyle = '#f4f4f4';
          c.beginPath(); c.moveTo(x - 17, y - 33); c.quadraticCurveTo(x, y - 56, x + 17, y - 33); c.closePath(); c.fill();
          c.fillStyle = '#e5534b';
          c.beginPath(); c.moveTo(x - 6, y - 35); c.quadraticCurveTo(x, y - 54, x + 6, y - 35); c.closePath(); c.fill();
        }
        const kind = o.type === 'gold' ? 'gold' : o.kind;
        const fill = { health: '#f5f5f5', weapon: '#b07a3c', tool: '#3d8fe0', gold: '#f2c230' }[kind];
        c.fillStyle = fill; c.strokeStyle = '#1b2430'; c.lineWidth = 1.2;
        c.fillRect(x - 8, y - 16, 16, 16); c.strokeRect(x - 8, y - 16, 16, 16);
        if (kind === 'health') { c.fillStyle = '#e5534b'; c.fillRect(x - 2, y - 13, 4, 10); c.fillRect(x - 5, y - 10, 10, 4); }
        else if (kind === 'weapon') { c.strokeStyle = '#6e4a22'; c.beginPath(); c.moveTo(x - 8, y - 11); c.lineTo(x + 8, y - 11); c.moveTo(x - 8, y - 5); c.lineTo(x + 8, y - 5); c.stroke(); WeaponArt.draw(c, 'grenade', x, y - 8, 8); }
        else if (kind === 'tool') { c.fillStyle = '#fff'; c.font = 'bold 12px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', x, y - 7.5); }
        else {
          c.fillStyle = '#fff7c2'; c.beginPath();
          for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 2.4 : 5.5; c.lineTo(x + Math.cos(a) * r, y - 8 + Math.sin(a) * r); }
          c.fill();
          const s = (Math.sin(time * 4) + 1) / 2;
          c.fillStyle = `rgba(255,255,255,${s})`; c.fillRect(x + 6, y - 20 - s * 3, 2, 2);
        }
        break;
      }
      case 'mine': {
        c.fillStyle = '#3d434c'; c.strokeStyle = '#1b2430'; c.lineWidth = 1;
        c.beginPath(); c.ellipse(x, y - 2, 6, 4, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#2a2f36'; c.fillRect(x - 7, y - 2, 14, 2.5);
        const live = !(o.armed > 0);
        const blink = o.fuse !== undefined && o.fuse !== null ? (Math.sin(time * 30) > 0) : (Math.sin(time * 4) > 0.6);
        c.fillStyle = live ? (blink ? '#ff4d3d' : '#7a1d16') : '#6b7785';
        c.beginPath(); c.arc(x, y - 5, 1.6, 0, Math.PI * 2); c.fill();
        break;
      }
      case 'barrel':
        c.fillStyle = '#c8452f'; c.strokeStyle = '#1b2430'; c.lineWidth = 1.2;
        c.fillRect(x - 7, y - 18, 14, 18); c.strokeRect(x - 7, y - 18, 14, 18);
        c.fillStyle = '#8f2a1c'; c.fillRect(x - 7, y - 14, 14, 2); c.fillRect(x - 7, y - 5, 14, 2);
        c.fillStyle = '#ffd54f'; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x + 3, y - 7); c.lineTo(x - 3, y - 7); c.closePath(); c.fill();
        break;
      case 'target': {
        c.strokeStyle = '#6e4a22'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 12); c.stroke();
        const cy = y - 12 - 6;
        for (const [r, color] of [[9, '#e5534b'], [6.5, '#ffffff'], [4, '#e5534b'], [1.8, '#ffffff']]) { c.fillStyle = color; c.beginPath(); c.arc(x, cy, r, 0, Math.PI * 2); c.fill(); }
        c.strokeStyle = '#1b2430'; c.lineWidth = 1; c.beginPath(); c.arc(x, cy, 9, 0, Math.PI * 2); c.stroke();
        break;
      }
      case 'grave': {
        c.fillStyle = '#a7adb5'; c.strokeStyle = '#4b525c'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x - 5, y - 9); c.arc(x, y - 9, 5, Math.PI, 0); c.lineTo(x + 5, y); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = teamColor(o.color).main; c.fillRect(x - 0.8, y - 12, 1.6, 7); c.fillRect(x - 2.6, y - 10, 5.2, 1.6);
        break;
      }
    }
  }

  function drawShot(c, s) {
    c.save();
    c.translate(s.x, s.y);
    if (s.kind === 'missile' || s.kind === 'bomb') {
      c.rotate(Math.atan2(s.vy, s.vx));
      if (s.kind === 'bomb') { c.fillStyle = '#2b2f36'; c.beginPath(); c.ellipse(0, 0, 6, 3.2, 0, 0, Math.PI * 2); c.fill(); c.fillRect(-9, -3, 3, 6); }
      else if (s.w === 'homing') WeaponArt.draw(c, 'homing', 0, 0, 13);
      else {
        c.fillStyle = '#5f7f3a'; c.strokeStyle = '#1b2430'; c.lineWidth = 0.8;
        c.beginPath(); c.ellipse(0, 0, 6.5, 2.6, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = '#e5534b'; c.beginPath(); c.moveTo(6.5, -1.6); c.lineTo(9, 0); c.lineTo(6.5, 1.6); c.fill();
        c.fillStyle = '#3f5a24'; c.fillRect(-7.5, -3.5, 2.5, 7);
      }
    } else if (s.kind === 'grenade') {
      c.rotate(s.age * (s.rest ? 0 : 8));
      WeaponArt.draw(c, s.w === 'cluster' ? 'cluster' : 'grenade', 0, 0, 9);
    } else if (s.kind === 'bomblet') {
      c.fillStyle = '#c8452f'; c.beginPath(); c.arc(0, 0, 2.4, 0, Math.PI * 2); c.fill();
    } else if (s.kind === 'dynamite') {
      WeaponArt.draw(c, 'dynamite', 0, -4, 10);
    }
    c.restore();
  }

  // ---------- the aim ----------
  function drawAim(c) {
    const t = match.turn;
    if (!t || match.over) return;
    const w = t.worm, team = match.teams[t.team], col = teamColor(team.color);
    const human = !team.cpu;
    // the last shot's trace
    if (team.trace && team.trace.length > 4 && (t.phase === 'play' || t.phase === 'intro') && match.mode !== 'demo') {
      c.strokeStyle = col.light; c.globalAlpha = 0.45; c.lineWidth = 1.4; c.setLineDash([4, 6]);
      c.beginPath(); c.moveTo(team.trace[0], team.trace[1]);
      for (let i = 2; i < team.trace.length; i += 2) c.lineTo(team.trace[i], team.trace[i + 1]);
      c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    }
    if (t.phase !== 'play' || !w.alive || w.state !== 'idle' || t.used) return;
    const def = WEAPONS[t.weapon], cx = w.x, cy = w.y - WORM_R;
    const dir = Weapons.aimDir(w);
    if (['missile', 'grenade', 'hitscan', 'melee', 'drill'].includes(def.kind)) {
      const ax = cx + dir.x * CROSSHAIR_DIST, ay = cy + dir.y * CROSSHAIR_DIST;
      c.strokeStyle = col.main; c.lineWidth = 2;
      c.beginPath(); c.arc(ax, ay, 5.5, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(ax - 9, ay); c.lineTo(ax - 3, ay); c.moveTo(ax + 3, ay); c.lineTo(ax + 9, ay);
      c.moveTo(ax, ay - 9); c.lineTo(ax, ay - 3); c.moveTo(ax, ay + 3); c.lineTo(ax, ay + 9); c.stroke();
      if (t.charging) {
        const n = Math.ceil(t.power * 14);
        for (let i = 0; i < n; i++) {
          const k = i / 14, d = 12 + k * 52, r = 1.5 + k * 5.5;
          c.fillStyle = `rgb(255,${Math.round(230 - k * 200)},${Math.round(60 - k * 50)})`;
          c.beginPath(); c.arc(cx + dir.x * d, cy + dir.y * d, r, 0, Math.PI * 2); c.fill();
        }
      }
      // the aim guide (Easy / Medium)
      const guide = DIFFICULTY[match.difficulty] ? DIFFICULTY[match.difficulty].guide : 0;
      if (human && guide > 0 && (def.kind === 'missile' || def.kind === 'grenade') && match.mode !== 'demo') {
        const p = Weapons.predict(w, t.weapon, t.charging ? t.power : team.lastPower, t.fuse, { maxT: guide, points: true, target: t.target });
        c.fillStyle = '#ffffff';
        for (let i = 0; i < p.points.length; i += 2) {
          c.globalAlpha = 0.8 * (1 - i / p.points.length);
          c.beginPath(); c.arc(p.points[i], p.points[i + 1], 1.8, 0, Math.PI * 2); c.fill();
        }
        c.globalAlpha = 1;
      }
    }
    // a weapon's target and ghosts
    const at = t.target || (human && view.hover);
    if (def.target && at) {
      const fixed = !!t.target;
      c.globalAlpha = fixed ? 1 : 0.55;
      if (def.kind === 'plank') {
        const ok = Math.hypot(at.x - cx, at.y - cy) <= def.range;
        c.save(); c.translate(at.x, at.y); c.rotate(t.plankAngle * DEG);
        c.fillStyle = ok ? 'rgba(120,255,140,0.45)' : 'rgba(255,90,80,0.45)';
        c.fillRect(-def.len / 2, -def.thick / 2, def.len, def.thick);
        c.restore();
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.setLineDash([5, 6]); c.lineWidth = 1;
        c.beginPath(); c.arc(cx, cy, def.range, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      } else if (def.kind === 'teleport') {
        c.strokeStyle = '#c9a2ff'; c.lineWidth = 1.5; c.setLineDash([3, 3]);
        c.beginPath(); c.ellipse(at.x, at.y, 7, 10, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      } else {
        c.strokeStyle = '#ff5a4d'; c.lineWidth = 2.2;
        c.beginPath(); c.arc(at.x, at.y, 10, 0, Math.PI * 2); c.moveTo(at.x - 15, at.y); c.lineTo(at.x + 15, at.y); c.moveTo(at.x, at.y - 15); c.lineTo(at.x, at.y + 15); c.stroke();
        if (def.kind === 'airstrike') {
          c.fillStyle = '#ff5a4d';
          const ay = at.y - 30, f = w.facing;
          c.beginPath(); c.moveTo(at.x + f * 16, ay); c.lineTo(at.x + f * 4, ay - 6); c.lineTo(at.x + f * 4, ay + 6); c.closePath(); c.fill();
          c.fillRect(Math.min(at.x - f * 14, at.x + f * 4), ay - 1.5, 18, 3);
        }
      }
      c.globalAlpha = 1;
    }
  }

  function drawPlane(c) {
    if (!plane) return;
    c.save(); c.translate(plane.x, plane.y); c.scale(plane.dir * 1.6, 1.6);
    c.fillStyle = '#5f6b78';
    c.beginPath(); c.moveTo(-30, -3); c.lineTo(22, -3); c.quadraticCurveTo(32, 0, 22, 4); c.lineTo(-28, 4); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-2, 0); c.lineTo(-14, 14); c.lineTo(-6, 14); c.lineTo(8, 0); c.fill();
    c.beginPath(); c.moveTo(-26, 0); c.lineTo(-34, -11); c.lineTo(-28, -11); c.lineTo(-20, 0); c.fill();
    c.fillStyle = '#9fd3ff'; c.fillRect(12, -2, 6, 3);
    c.restore();
  }

  // ---------- on the screen ----------
  function rrect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function drawLabels(c) {
    const t = match.turn;
    c.font = '600 11px "Segoe UI", Arial, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const w of match.worms) {
      if (!w.alive) continue;
      const col = teamColor(match.teams[w.team].color);
      const p = Camera.toScreen(w.x, w.y - 24);
      if (p.x < -60 || p.x > Camera.cam.w + 60 || p.y < -40 || p.y > Camera.cam.h + 40) continue;
      const y = p.y - Camera.cam.zoom * 4;
      const name = w.name, hp = String(w.hp);
      const nw = c.measureText(name).width + 8, hw = c.measureText(hp).width + 8;
      c.fillStyle = 'rgba(13,20,30,0.72)';
      rrect(c, p.x - nw / 2, y - 25, nw, 13, 4); c.fill();
      rrect(c, p.x - hw / 2, y - 11, hw, 13, 4); c.fill();
      c.fillStyle = col.light;
      c.fillText(name, p.x, y - 18.3);
      c.fillText(hp, p.x, y - 4.3);
      if (t && w === t.worm && !t.moved && (t.phase === 'intro' || t.phase === 'play') && !match.over) {
        const ay = y - 40 - Math.abs(Math.sin(time * 5)) * 8;
        c.fillStyle = col.main; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(p.x, ay + 9); c.lineTo(p.x - 8, ay - 3); c.lineTo(p.x - 3, ay - 3); c.lineTo(p.x - 3, ay - 11);
        c.lineTo(p.x + 3, ay - 11); c.lineTo(p.x + 3, ay - 3); c.lineTo(p.x + 8, ay - 3); c.closePath(); c.fill(); c.stroke();
      }
    }
    // shots' fuses
    for (const s of match.shots) {
      if (s.fuse === null || s.fuse === undefined || s.kind === 'missile') continue;
      const p = Camera.toScreen(s.x, s.y - 14);
      c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 3; c.font = '700 12px "Segoe UI", Arial, sans-serif';
      const txt = String(Math.max(1, Math.ceil(s.fuse)));
      c.strokeText(txt, p.x, p.y); c.fillText(txt, p.x, p.y);
    }
    c.font = '700 14px "Segoe UI", Arial, sans-serif';
    for (const f of floats) {
      const p = Camera.toScreen(f.x, f.y);
      c.globalAlpha = Math.min(1, f.life / f.max * 2);
      c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.65)'; c.strokeText(f.text, p.x, p.y);
      c.fillStyle = f.color; c.fillText(f.text, p.x, p.y);
    }
    c.globalAlpha = 1;
  }
  function drawJoystick(c) {
    const j = Input.joystick;
    if (!j || !j.active) return;
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
    c.beginPath(); c.arc(j.x0, j.y0, JOY_R, 0, Math.PI * 2); c.fill(); c.stroke();
    const dx = j.x - j.x0, dy = j.y - j.y0, d = Math.hypot(dx, dy), k = d > JOY_R ? JOY_R / d : 1;
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.beginPath(); c.arc(j.x0 + dx * k, j.y0 + dy * k, 22, 0, Math.PI * 2); c.fill();
  }

  // ---------- the frame ----------
  function draw(dt) {
    time += dt;
    if (!match) return;
    updateParts(dt);
    Camera.update(dt);
    const cam = Camera.cam;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Backdrop.sky(ctx, cam.w, cam.h, time);
    Backdrop.back(ctx, cam, dt);
    Backdrop.water(ctx, cam, time, false);
    Camera.apply(ctx, dpr);
    const tc = TerrainView.canvas;
    if (tc) {
      ctx.imageSmoothingEnabled = cam.zoom < 1;
      const tl = Camera.toWorld(0, 0), br = Camera.toWorld(cam.w, cam.h);
      const x0 = clamp(Math.floor(tl.x) - 2, 0, WORLD_W), y0 = clamp(Math.floor(tl.y) - 2, 0, WORLD_H);
      const x1 = clamp(Math.ceil(br.x) + 2, 0, WORLD_W), y1 = clamp(Math.ceil(br.y) + 2, 0, WORLD_H);
      if (x1 > x0 && y1 > y0) ctx.drawImage(tc, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    }
    drawPlane(ctx);
    for (const o of match.objects) drawObject(ctx, o);
    const t = match.turn;
    for (const w of match.worms) {
      if (!w.alive) continue;
      const active = t && w === t.worm && !match.over;
      drawWorm(ctx, w, active);
      if (active && (t.phase === 'play' || t.phase === 'intro') && w.state === 'idle' && !t.used && w.grounded) drawHeld(ctx, w, t.weapon);
      if (w.state === 'drill') {
        ctx.save(); ctx.translate(w.x, w.y - WORM_R); ctx.rotate(Math.atan2(w.drill.y, w.drill.x) + Math.sin(time * 60) * 0.05);
        WeaponArt.draw(ctx, 'drill', 9, 0, 16); ctx.restore();
      }
    }
    for (const s of match.shots) drawShot(ctx, s);
    drawParts(ctx);
    drawAim(ctx);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Backdrop.water(ctx, cam, time, true);
    drawLabels(ctx);
    drawJoystick(ctx);
  }

  // the menu's picture: a red worm with a bazooka
  function logo(canvas) {
    const c = canvas.getContext('2d');
    const k = Math.min(window.devicePixelRatio || 1, 3);
    if (canvas.width !== 120 * k) { canvas.width = 120 * k; canvas.height = 90 * k; canvas.style.width = '120px'; canvas.style.height = '90px'; }
    c.setTransform(k, 0, 0, k, 0, 0);
    c.clearRect(0, 0, 120, 90);
    c.save();
    c.translate(56, 84); c.scale(3.4, 3.4);
    const w = { x: 0, y: 0, facing: 1, aim: 28, grounded: true, id: 1, hp: 100, state: 'idle', air: 0 };
    drawWorm(c, w, true, TEAM_COLORS[0]);
    c.translate(w.x + 2, w.y - WORM_R - 1);
    c.rotate(-28 * DEG);
    WeaponArt.draw(c, 'bazooka', 7, 1, 15);
    c.restore();
  }

  window.addEventListener('resize', resize);
  resize();
  return { draw, resize, view, logo };
})();
