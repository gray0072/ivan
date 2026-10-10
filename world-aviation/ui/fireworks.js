'use strict';

// ============================================================
// World Aviation — fireworks over the whole screen: rockets climb
// from the bottom, burst into sparks of gold, white, red and blue
// that fall and fade, with a flash at every burst. A canvas laid over
// everything that lets every touch and click through; it removes
// itself when the last spark is gone. Used by the Mriya's assembly
// hall when its fiftieth part is fitted (ui/mriya.js).
// ============================================================

const Fireworks = {
  cv: null, g: null, raf: 0, sparks: [], rockets: [], flash: 0, until: 0, last: 0,
  COLOURS: [['#ffd97a', '#fff1c2'], ['#ffffff', '#cfe8ff'], ['#ff5a4a', '#ffb0a0'], ['#5ab0ff', '#c4e2ff'], ['#ffb43a', '#ffe0a0']],

  // seconds of launches; the sky clears a few seconds after
  start(seconds) {
    this.stop();
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cv = document.createElement('canvas');
    this.cv.className = 'fireworks';
    document.body.appendChild(this.cv);
    this.g = this.cv.getContext('2d');
    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    this.sparks = []; this.rockets = [];
    this.rate = reduced ? 0.7 : 2.6;              // rockets a second
    this.until = performance.now() + seconds * 1000;
    this.last = performance.now();
    this.next = 0;
    const loop = () => { this.raf = requestAnimationFrame(loop); this.frame(); };
    loop();
  },
  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.onResize) window.removeEventListener('resize', this.onResize);
    if (this.cv && this.cv.parentNode) this.cv.parentNode.removeChild(this.cv);
    this.cv = null;
  },
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.cv.width = Math.round(innerWidth * dpr);
    this.cv.height = Math.round(innerHeight * dpr);
  },

  launch() {
    const W = innerWidth, H = innerHeight;
    this.rockets.push({ x: W * (0.12 + Math.random() * 0.76), y: H + 10, vx: (Math.random() - 0.5) * 60,
      vy: -(H * (0.9 + Math.random() * 0.45)), fuse: 0.75 + Math.random() * 0.45, c: this.COLOURS[Math.floor(Math.random() * this.COLOURS.length)] });
  },
  burst(r) {
    const n = 70 + Math.floor(Math.random() * 60), speed = 140 + Math.random() * 160, ring = Math.random() < 0.3;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (ring ? 1 : 0.35 + Math.random() * 0.65);
      this.sparks.push({ x: r.x, y: r.y, px: r.x, py: r.y, vx: Math.cos(a) * v + r.vx * 0.3, vy: Math.sin(a) * v + r.vy * 0.1,
        life: 1.2 + Math.random() * 0.9, age: 0, c: Math.random() < 0.75 ? r.c[0] : r.c[1], tw: Math.random() < 0.35 });
    }
    this.flash = Math.min(0.35, this.flash + 0.18);
  },

  frame() {
    const now = performance.now(), dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (now < this.until) {
      this.next -= dt;
      if (this.next <= 0) { this.launch(); this.next = (0.4 + Math.random()) / this.rate; }
    } else if (!this.rockets.length && !this.sparks.length) { this.stop(); return; }
    const g = this.g, d = this.dpr;
    g.setTransform(d, 0, 0, d, 0, 0);
    // the trails fade instead of being wiped
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.fillRect(0, 0, innerWidth, innerHeight);
    g.globalCompositeOperation = 'lighter';
    if (this.flash > 0.01) {
      g.fillStyle = 'rgba(255,230,170,' + (this.flash * 0.25).toFixed(3) + ')';
      g.fillRect(0, 0, innerWidth, innerHeight);
      this.flash *= 0.86;
    }
    for (const r of this.rockets) {
      r.fuse -= dt;
      r.vy += 260 * dt;
      r.x += r.vx * dt; r.y += r.vy * dt;
      g.fillStyle = '#ffe9b0';
      g.beginPath(); g.arc(r.x, r.y, 2, 0, Math.PI * 2); g.fill();
      if (r.fuse <= 0 || r.vy > -40) { this.burst(r); r.dead = true; }
    }
    this.rockets = this.rockets.filter((r) => !r.dead);
    for (const s of this.sparks) {
      s.age += dt;
      s.vx *= 0.985; s.vy = s.vy * 0.985 + 120 * dt;
      s.px = s.x; s.py = s.y;
      s.x += s.vx * dt; s.y += s.vy * dt;
      const k = 1 - s.age / s.life;
      if (k <= 0) continue;
      g.globalAlpha = s.tw ? k * (0.5 + 0.5 * Math.sin(s.age * 40)) : k;
      g.strokeStyle = s.c;
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(s.px, s.py); g.lineTo(s.x, s.y); g.stroke();
    }
    g.globalAlpha = 1;
    this.sparks = this.sparks.filter((s) => s.age < s.life);
  }
};
