'use strict';

// Fireworks show on its own transparent canvas above the overlay. start() runs it until stop();
// after stop() the sparks already in the air finish falling, then the loop shuts itself down.
const fireworks = (() => {
  const cv = document.getElementById('fx');
  const c = cv.getContext('2d');
  const GRAVITY = 260;
  let W = 0, H = 0;
  let running = false, looping = false;
  let last = 0, nextLaunch = 0;
  const rockets = [], sparks = [];

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    const dpr = canvasScale(W, H);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function launch() {
    // mostly left and right of the centered dialog so its text stays readable
    const roll = Math.random();
    const x = W * (roll < 0.4 ? rand(0.05, 0.3) : roll < 0.8 ? rand(0.7, 0.95) : rand(0.3, 0.7));
    const targetY = H * rand(0.12, 0.45);
    rockets.push({
      x, y: H + 10,
      vx: rand(-40, 40),
      vy: -Math.sqrt(2 * GRAVITY * (H + 10 - targetY)),
      hue: rand(0, 360),
      kind: ['burst', 'ring', 'willow', 'double'][Math.floor(Math.random() * 4)]
    });
    tone(rand(500, 700), rand(1300, 1700), 0.45, 'sine', 0.025);
  }

  function explode(r) {
    const n = r.kind === 'willow' ? 70 : 110;
    const hue2 = (r.hue + 120 + rand(-30, 30)) % 360;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.05, 0.05);
      let sp = r.kind === 'ring' ? 230 : rand(60, 280);
      const second = r.kind === 'double' && i % 2 === 1;
      if (second) sp *= 0.55;
      sparks.push({
        x: r.x, y: r.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: r.kind === 'willow' ? rand(1.8, 2.6) : rand(1.0, 1.7),
        maxLife: 2.6,
        hue: r.kind === 'willow' ? 45 : second ? hue2 : r.hue,
        drag: r.kind === 'willow' ? 1.6 : 1.1,
        twinkle: Math.random() < 0.3
      });
    }
    tone(rand(80, 110), 30, 0.7, 'triangle', 0.28);
    tone(rand(1800, 2400), 900, 0.25, 'square', 0.03);
  }

  const frameDue = frameLimiter();
  function frame(now) {
    if (!frameDue(now)) { requestAnimationFrame(frame); return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (running && now >= nextLaunch) {
      launch();
      if (Math.random() < 0.35) launch();
      nextLaunch = now + rand(250, 650);
    }

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.vy += GRAVITY * dt;
      if (r.vy >= 0) { explode(r); rockets.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const k = Math.exp(-s.drag * dt);
      s.vx *= k; s.vy = s.vy * k + GRAVITY * 0.35 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }

    c.clearRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    for (const r of rockets) {
      c.strokeStyle = `hsla(${r.hue},100%,75%,0.9)`;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(r.x, r.y);
      c.lineTo(r.x - r.vx * 0.05, r.y - r.vy * 0.05);
      c.stroke();
    }
    for (const s of sparks) {
      let a = clamp(s.life / 1.2, 0, 1);
      if (s.twinkle && Math.random() < 0.4) a *= 0.2;
      c.strokeStyle = `hsla(${s.hue},100%,${60 + 25 * a}%,${a})`;
      c.lineWidth = 2.2;
      c.beginPath();
      // stretch the streak along the velocity so fast sparks read as trails
      c.moveTo(s.x, s.y);
      c.lineTo(s.x - s.vx * 0.06, s.y - s.vy * 0.06);
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';

    if (running || rockets.length || sparks.length) {
      requestAnimationFrame(frame);
    } else {
      looping = false;
      c.clearRect(0, 0, W, H);
    }
  }

  function start() {
    running = true;
    const now = performance.now();
    // opening volley
    for (let i = 0; i < 5; i++) launch();
    nextLaunch = now + 500;
    if (!looping) {
      looping = true;
      last = now;
      requestAnimationFrame(frame);
    }
  }
  function stop() { running = false; }

  return { start, stop };
})();
