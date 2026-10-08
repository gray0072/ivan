'use strict';

// ============================================================
// World Aviation — the title screen's backdrop: a sky above a sea
// of clouds drawn on a canvas (#titleSky) behind the title panel,
// with the sky of the player's own time of day (dawn and dusk in a
// golden light, day, night with stars and the moon), clouds drifting
// past in layers as if flying, and a showcase of airliners in their
// airlines' colours (the real 3D models, drawn by AircraftPreview.hero)
// taking turns in the sky. Runs only while the title shows (UI.showTitle
// calls TitleSky.show(); it stops itself once another screen is up).
// ============================================================

// the showcase: [aircraft id, airline code]
const TITLE_HEROES = [['A359', 'SK'], ['A388', 'EK'], ['B789', 'QF'], ['B748F', 'CV'], ['B77W', 'LH'], ['A333', 'FI']];
const TITLE_HERO_S = 9;            // seconds each aeroplane stays
const TITLE_FADE_S = 1.6;          // the change-over

// the skies: gradient stops top to horizon, the sun (or moon), the cloud tops and their shade
const TITLE_SKIES = {
  dusk: {
    sky: [[0, '#0d1834'], [0.32, '#27386a'], [0.55, '#7b5a8c'], [0.72, '#e48a6a'], [0.8, '#ffc27a']],
    sun: '#ffe0a8', sunR: 0.05, glow: 'rgba(255, 176, 96, ', stars: 0.55,
    lit: [255, 196, 150], shade: [74, 70, 118], haze: 'rgba(255, 190, 140, '
  },
  day: {
    sky: [[0, '#1c4f8f'], [0.4, '#3d7fc4'], [0.68, '#8fc0ea'], [0.8, '#d6e9f6']],
    sun: '#fffbe8', sunR: 0.04, glow: 'rgba(255, 250, 225, ', stars: 0,
    lit: [255, 255, 255], shade: [150, 172, 200], haze: 'rgba(230, 242, 252, '
  },
  night: {
    sky: [[0, '#03060f'], [0.45, '#0a1530'], [0.7, '#1a2a52'], [0.8, '#2c3d68']],
    sun: '#f2f4ff', sunR: 0.028, glow: 'rgba(170, 190, 255, ', stars: 1,
    lit: [150, 166, 214], shade: [26, 32, 58], haze: 'rgba(120, 140, 200, '
  }
};

const TitleSky = {
  canvas: null, ctx: null, running: false, t: 0, last: 0,
  w: 0, h: 0, dpr: 1, kind: 'dusk',
  bg: null, layers: [], stars: [],
  heroes: [], hero: 0, heroT: 0,

  show() {
    if (!this.canvas) {
      this.canvas = el('titleSky');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      window.addEventListener('resize', () => { if (this.running) this.layout(); });
    }
    this.canvas.hidden = false;
    // the sky of the player's own hour
    const hr = new Date().getHours();
    const kind = hr >= 21 || hr < 5 ? 'night' : (hr >= 5 && hr < 9) || (hr >= 17 && hr < 21) ? 'dusk' : 'day';
    if (kind !== this.kind || !this.bg) { this.kind = kind; this.heroes = []; this.bg = null; }
    this.still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.layout();
    this.loadHeroes();
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(() => this.frame());
    }
  },
  stop() {
    this.running = false;
    if (this.canvas) this.canvas.hidden = true;
  },

  // the showcase pictures, drawn one per frame by the preview renderer
  loadHeroes() {
    if (this.heroes.length || typeof AircraftPreview === 'undefined') return;
    const start = Math.floor(Math.random() * TITLE_HEROES.length);
    this.heroes = TITLE_HEROES.map((_, i) => TITLE_HEROES[(start + i) % TITLE_HEROES.length]).map(([id, airline]) => {
      const h = { id, airline, img: null };
      if (!AIRCRAFT.some((a) => a.id === id) || !AIRLINE_BY_CODE[airline]) return h;
      AircraftPreview.hero(id, airline, this.kind, (url) => {
        const img = new Image();
        img.onload = () => { h.img = img; };
        img.src = url;
      });
      return h;
    }).filter((h) => AIRCRAFT.some((a) => a.id === h.id));
    this.hero = 0; this.heroT = 0;
  },

  // the size of the screen, and everything drawn once for it: the sky, the stars, the clouds
  layout() {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (this.bg && w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    const S = TITLE_SKIES[this.kind];
    this.horizon = h * (w < h ? 0.58 : 0.64);
    this.sunX = w * (w < h ? 0.78 : 0.8);
    this.sunY = this.horizon - h * (this.kind === 'day' ? 0.42 : this.kind === 'night' ? 0.36 : 0.05);

    // the sky, the sun's glow and the sun (or the moon)
    const bg = document.createElement('canvas');
    bg.width = this.canvas.width; bg.height = this.canvas.height;
    const g = bg.getContext('2d');
    g.scale(dpr, dpr);
    const grad = g.createLinearGradient(0, 0, 0, this.horizon);
    for (const [k, c] of S.sky) grad.addColorStop(k / 0.8, c);
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    const R = Math.max(w, h);
    const glow = g.createRadialGradient(this.sunX, this.sunY, 0, this.sunX, this.sunY, R * 0.6);
    glow.addColorStop(0, S.glow + '0.55)'); glow.addColorStop(0.25, S.glow + '0.18)'); glow.addColorStop(1, S.glow + '0)');
    g.fillStyle = glow; g.fillRect(0, 0, w, h);
    const sr = R * S.sunR;
    g.fillStyle = S.sun;
    g.shadowColor = S.sun; g.shadowBlur = sr * 1.5;
    g.beginPath(); g.arc(this.sunX, this.sunY, sr, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0;
    if (this.kind === 'night') {
      // the moon's seas
      for (const [dx, dy, rr] of [[-0.3, -0.25, 0.34], [0.25, -0.1, 0.26], [-0.05, 0.3, 0.24], [0.35, 0.35, 0.14]]) {
        const x = this.sunX + dx * sr, y = this.sunY + dy * sr;
        const mg = g.createRadialGradient(x, y, 0, x, y, rr * sr);
        mg.addColorStop(0, 'rgba(140, 150, 180, 0.32)'); mg.addColorStop(1, 'rgba(140, 150, 180, 0)');
        g.fillStyle = mg;
        g.beginPath(); g.arc(x, y, rr * sr, 0, Math.PI * 2); g.fill();
      }
    }
    // high thin cloud across the sky, lit from the sun's side
    for (let i = 0; i < 7; i++) {
      const y = this.horizon * (0.12 + i * 0.1), x = (i * 0.37 % 1) * w;
      const cg = g.createLinearGradient(x - w * 0.3, 0, x + w * 0.3, 0);
      cg.addColorStop(0, S.haze + '0)'); cg.addColorStop(0.5, S.haze + (0.05 + 0.02 * (i % 3)) + ')'); cg.addColorStop(1, S.haze + '0)');
      g.fillStyle = cg;
      g.beginPath(); g.ellipse(x, y, w * 0.32, h * 0.006 + i, -0.02, 0, Math.PI * 2); g.fill();
    }
    this.bg = bg;

    // the stars (twinkling, so drawn every frame)
    this.stars = [];
    if (S.stars) {
      const rnd = mulberry32(7);
      for (let i = 0; i < 160; i++) {
        const y = Math.pow(rnd(), 1.6) * this.horizon * 0.8;
        this.stars.push({ x: rnd() * w, y, r: 0.4 + rnd() * 1.1, a: (1 - y / (this.horizon * 0.8)) * S.stars, f: rnd() * 6 });
      }
    }

    // the sea of clouds: layers from the horizon to the bottom, nearer ones bigger and faster,
    // each a strip that wraps round (drawn twice side by side)
    const specs = [
      { y: 0, hh: 0.07, n: 46, r: [0.012, 0.03], speed: 6, haze: 0.55 },
      { y: 0.05, hh: 0.1, n: 34, r: [0.025, 0.05], speed: 16, haze: 0.35 },
      { y: 0.13, hh: 0.14, n: 24, r: [0.045, 0.085], speed: 38, haze: 0.15 },
      { y: 0.25, hh: 0.2, n: 16, r: [0.08, 0.14], speed: 80, haze: 0 }
    ];
    this.layers = specs.map((sp, li) => this.cloudLayer(sp, li, S));
  },

  // one layer of cloud: heaps of soft puffs, lit on top from the sun's side and shaded
  // underneath, on a body that thickens downwards (no hard top edge), sinking into the haze
  cloudLayer(sp, li, S) {
    const w = this.w, h = this.h, dpr = this.dpr;
    // (the strip starts a heap's height above the layer's line, so the domes are not cut)
    const R = Math.max(w, h), pad = Math.ceil(R * sp.r[1] * 1.6);
    const W = Math.ceil(w * 1.2), top = this.horizon + h * sp.y - pad, H = Math.ceil(h - top + h * 0.05);
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr);
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    g.translate(0, pad);
    const rnd = mulberry32(31 + li * 17);
    const base = h * sp.hh;
    const rgba = (c, a) => 'rgba(' + c.map(Math.round).join(',') + ',' + a + ')';
    const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
    const lit = mix(S.lit, S.shade, sp.haze * 0.35), mid = mix(S.lit, S.shade, 0.45), dark = mix(S.shade, [6, 10, 22], 0.25);
    const sunLeft = this.sunX < w / 2 ? -1 : 1;
    // the body: clear at the top, solid from the middle of the heaps down
    const body = g.createLinearGradient(0, base * 0.35, 0, base * 1.1);
    body.addColorStop(0, rgba(mid, 0)); body.addColorStop(0.6, rgba(mid, 0.85)); body.addColorStop(1, rgba(dark, 1));
    g.fillStyle = body;
    g.fillRect(0, base * 0.35, W, H);
    g.fillStyle = rgba(dark, 1);
    g.fillRect(0, base * 1.1 - 1, W, H);
    const puff = (x, y, r, inner, outer, a) => {
      for (const dx of [0, -W, W]) {
        if (x + dx + r < 0 || x + dx - r > W) continue;
        // flat in the middle, soft at the edge (the depth comes from the shaded puffs below)
        const cg = g.createRadialGradient(x + dx + sunLeft * r * 0.12, y - r * 0.15, 0, x + dx, y, r);
        cg.addColorStop(0, rgba(inner, a)); cg.addColorStop(0.5, rgba(inner, a * 0.92));
        cg.addColorStop(0.78, rgba(outer, a * 0.55)); cg.addColorStop(1, rgba(outer, 0));
        g.fillStyle = cg;
        g.beginPath(); g.arc(x + dx, y, r, 0, Math.PI * 2); g.fill();
      }
    };
    // heaps along the layer, each a dome of puffs: the shaded ones low, the lit ones on top
    const heaps = Math.round(sp.n * 0.5);
    for (let i = 0; i < heaps; i++) {
      const hr = R * (sp.r[0] + rnd() * (sp.r[1] - sp.r[0])) * 1.3;
      const hx = (i + rnd() * 0.8) / heaps * W, hy = base * (0.55 + rnd() * 0.35);
      const n = 6 + Math.floor(rnd() * 6);
      for (let j = 0; j < n; j++) {
        const u = rnd() * 2 - 1, r = hr * (0.4 + rnd() * 0.4) * (1 - Math.abs(u) * 0.35);
        puff(hx + u * hr * 1.15, hy - (1 - u * u) * hr * 0.4 + r * 0.35, r * 1.2, mid, dark, 0.95);
      }
      // the sunlit tops: a few big puffs along the dome, overlapping so they read as one cloud
      const m = 3 + Math.floor(n / 3);
      for (let j = 0; j < m; j++) {
        const u = (j + 0.5) / m * 2 - 1 + (rnd() - 0.5) * 0.3, r = hr * (0.45 + rnd() * 0.25) * (1 - Math.abs(u) * 0.35);
        puff(hx + u * hr * 0.95, hy - (1 - u * u) * hr * 0.5 - r * 0.1, r, lit, mid, 0.9);
      }
    }
    // the far layers sink into the haze along the horizon
    if (sp.haze) {
      const hz = g.createLinearGradient(0, -pad * 0.3, 0, H - pad);
      hz.addColorStop(0, S.haze + sp.haze + ')'); hz.addColorStop(1, S.haze + (sp.haze * 0.3) + ')');
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = hz; g.fillRect(0, -pad, W, H);
      g.globalCompositeOperation = 'source-over';
    }
    return { cv, W, top, speed: sp.speed, x: 0 };
  },

  frame() {
    if (!this.running) return;
    if (UI.screen.hidden || UI.screen.dataset.view !== 'title') { this.stop(); return; }
    requestAnimationFrame(() => this.frame());
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (document.hidden) return;
    this.t += this.still ? 0 : dt;
    this.draw(dt);
  },

  draw(dt) {
    const g = this.ctx, w = this.w, h = this.h, t = this.t;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(this.bg, 0, 0);
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // the stars twinkle
    for (const s of this.stars) {
      g.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(t * 1.3 + s.f * 7));
      g.fillStyle = '#ffffff';
      g.fillRect(s.x, s.y, s.r, s.r);
    }
    g.globalAlpha = 1;
    // the far clouds, then the aeroplane, then the near clouds sweeping under it
    const layer = (L) => {
      if (!this.still) L.x = (L.x + dt * L.speed * (w / 1200)) % L.W;
      for (const k of [0, 1]) g.drawImage(L.cv, -L.x + k * L.W, L.top, L.W, L.cv.height / this.dpr);
    };
    layer(this.layers[0]); layer(this.layers[1]);
    this.drawHero(g, dt);
    layer(this.layers[2]); layer(this.layers[3]);
    // a soft vignette, darker behind the panel on a wide screen so the text reads
    const wide = w > 900 && w > h;
    const v = g.createLinearGradient(0, 0, w, 0);
    v.addColorStop(0, 'rgba(4, 8, 16, ' + (wide ? 0.55 : 0.3) + ')');
    v.addColorStop(wide ? 0.5 : 0.3, 'rgba(4, 8, 16, 0)');
    v.addColorStop(1, 'rgba(4, 8, 16, 0.12)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    const b = g.createLinearGradient(0, h * 0.7, 0, h);
    b.addColorStop(0, 'rgba(4, 8, 16, 0)'); b.addColorStop(1, 'rgba(4, 8, 16, 0.5)');
    g.fillStyle = b; g.fillRect(0, h * 0.7, w, h * 0.3);
  },

  // the showcase: each aeroplane glides in, floats a while on the air and moves on ahead
  drawHero(g, dt) {
    const list = this.heroes;
    if (!list.length) return;
    const ready = list.filter((x) => x.img);
    if (!ready.length) return;
    if (!this.still) this.heroT += dt;
    if (this.heroT > TITLE_HERO_S) {
      this.heroT -= TITLE_HERO_S;
      // the next one that is drawn already
      for (let i = 1; i <= list.length; i++) if (list[(this.hero + i) % list.length].img) { this.hero = (this.hero + i) % list.length; break; }
    }
    if (!list[this.hero].img) this.hero = list.indexOf(ready[0]);
    // in the open sky beside the panel on a wide screen; above it when held upright
    const w = this.w, h = this.h, wide = w > h;
    const panel = UI.screen.querySelector('.panel.title');
    const pr = panel ? panel.getBoundingClientRect() : null;
    let iw, cx, cy;
    if (wide && pr && w - pr.right > w * 0.3) {
      const x0 = pr.right + w * 0.02, x1 = w - w * 0.02;
      iw = Math.min((x1 - x0) * 1.08, 1100); cx = (x0 + x1) / 2; cy = Math.min(this.horizon - iw * 0.14, h * 0.5);
    } else if (wide) {
      iw = Math.min(w * 0.7, 900); cx = w * 0.5; cy = h * 0.3;
    } else {
      iw = Math.min(w * 1.02, 900); cx = w * 0.5; cy = Math.max(iw * 0.27, (pr ? pr.top + UI.screen.scrollTop : h * 0.3) * 0.55);
    }
    const ih = iw / 2;
    const one = (hero, k, slide) => {
      // k: 0..1 how far in; slide: 1 coming in from behind (the right), -1 leaving ahead (the left)
      const tt = this.t;
      const bob = Math.sin(tt * 0.7) * h * 0.006, sway = Math.sin(tt * 0.45) * 0.012;
      g.save();
      g.globalAlpha = k;
      g.translate(cx + slide * iw * 0.1 * (1 - k) + Math.sin(tt * 0.3) * 6, cy + bob);
      g.rotate(sway);
      g.drawImage(hero.img, -iw / 2, -ih / 2, iw, ih);
      g.restore();
    };
    const T = this.heroT, F = TITLE_FADE_S;
    const cur = list[this.hero];
    if (T < F && ready.length > 1 && !this.still) {
      // the previous one leaves ahead while this one comes in
      let p = this.hero;
      for (let i = 1; i <= list.length; i++) { const j = (this.hero - i + list.length) % list.length; if (list[j].img) { p = j; break; } }
      if (p !== this.hero) one(list[p], 1 - T / F, -1);
      one(cur, T / F, 1);
    } else one(cur, 1, 0);
  }
};
