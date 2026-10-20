'use strict';

// ============================================================
// World Aviation — the title screen's backdrop: a sky above a sea
// of clouds drawn on a canvas (#titleSky) behind the title panel.
// The time of day goes round — dawn, day, dusk, night — starting at
// the player's own hour: each stays a while, then the next one
// comes in slowly (the sun climbs or sinks into the clouds, the moon
// rises, the stars come out, the sky and the clouds change colour).
// Clouds drift past in layers as if flying, and a showcase of
// airliners in their airlines' colours (the real 3D models, drawn by
// AircraftPreview.hero and lit for each time of day) takes turns in
// the sky. Runs only while the title shows (UI.showTitle calls
// TitleSky.show(); it stops itself once another screen is up).
// ============================================================

// the showcase: [aircraft id, airline code], flown in a shuffled order
const TITLE_HEROES = [['A359', 'SK'], ['A388', 'EK'], ['B789', 'QF'], ['B748F', 'CV'], ['B77W', 'LH'], ['A333', 'FI'], ['A3XL', 'BGA'],
  ['A359', 'AY'], ['B77W', 'CX'], ['B789', 'NH'], ['BCS3', 'LX'], ['B738', 'DY'], ['A320NEO', 'VY'], ['A388', 'SQ'], ['A124', 'RU']];
const TITLE_HERO_S = 9;            // seconds each aeroplane stays
const TITLE_FADE_S = 3.2;          // the change-over between two aeroplanes
const TITLE_POSES = 3;             // the angles AircraftPreview.hero draws, one per aeroplane in turn
const TITLE_SKY_ORDER = ['dawn', 'day', 'dusk', 'night'];
const TITLE_SKY_HOLD_S = 26;       // seconds each time of day stays
const TITLE_SKY_FADE_S = 10;       // the change from one time of day to the next
const TITLE_STILL_CLOUDS = 0.3;    // the clouds' speed with prefers-reduced-motion

// the skies: gradient stops top to horizon, the stars, the cloud tops and their shade, the haze;
// the sun and the moon as [x of the width, height above the horizon of the screen's height, shown 0..1]
// (below the horizon they sink into the clouds); light: how AircraftPreview lights the aeroplanes
const TITLE_SKIES = {
  dawn: {
    sky: [[0, '#16204a'], [0.34, '#3f4f8a'], [0.56, '#a07fa6'], [0.72, '#f0a99a'], [0.8, '#ffd6b0']],
    sun: [255, 238, 212], sunR: 0.045, glow: [255, 196, 168], stars: 0.3,
    lit: [255, 212, 198], shade: [92, 90, 136], haze: 'rgba(255, 202, 188, ',
    sunAt: [0.86, 0.07, 1], moonAt: [0.84, 0.28, 0], light: 'dusk'
  },
  day: {
    sky: [[0, '#1c4f8f'], [0.4, '#3d7fc4'], [0.68, '#8fc0ea'], [0.8, '#d6e9f6']],
    sun: [255, 251, 232], sunR: 0.04, glow: [255, 250, 225], stars: 0,
    lit: [255, 255, 255], shade: [150, 172, 200], haze: 'rgba(230, 242, 252, ',
    sunAt: [0.76, 0.42, 1], moonAt: [0.84, 0.28, 0], light: 'day'
  },
  dusk: {
    sky: [[0, '#0d1834'], [0.32, '#27386a'], [0.55, '#7b5a8c'], [0.72, '#e48a6a'], [0.8, '#ffc27a']],
    sun: [255, 224, 168], sunR: 0.05, glow: [255, 176, 96], stars: 0.55,
    lit: [255, 196, 150], shade: [74, 70, 118], haze: 'rgba(255, 190, 140, ',
    sunAt: [0.7, 0.05, 1], moonAt: [0.8, 0.2, 0], light: 'dusk'
  },
  night: {
    sky: [[0, '#03060f'], [0.45, '#0a1530'], [0.7, '#1a2a52'], [0.8, '#2c3d68']],
    sun: [255, 196, 140], sunR: 0.05, glow: [255, 150, 90], stars: 1,
    lit: [150, 166, 214], shade: [26, 32, 58], haze: 'rgba(120, 140, 200, ',
    sunAt: [0.78, -0.12, 0], moonAt: [0.8, 0.36, 1], light: 'night'
  }
};
const TITLE_MOON_R = 0.028;                     // the moon's radius, of the screen's longer side
const TITLE_MOON_GLOW = [170, 190, 255];

// the sea of clouds: layers from the horizon to the bottom, nearer ones bigger and faster
const TITLE_CLOUDS = [
  { y: 0, hh: 0.07, n: 46, r: [0.012, 0.03], speed: 6, haze: 0.55 },
  { y: 0.05, hh: 0.1, n: 34, r: [0.025, 0.05], speed: 16, haze: 0.35 },
  { y: 0.13, hh: 0.14, n: 24, r: [0.045, 0.085], speed: 38, haze: 0.15 },
  { y: 0.25, hh: 0.2, n: 16, r: [0.08, 0.14], speed: 80, haze: 0 }
];

const smooth01 = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

const TitleSky = {
  canvas: null, ctx: null, running: false, t: 0, last: 0,
  w: 0, h: 0, dpr: 1,
  kind: null, to: null, skyT: 0, skyK: 0,       // the time of day, the next one coming in and how far
  sets: {},                                     // kind -> { bg, layers }: its sky and clouds, drawn for this screen
  cloudX: [0, 0, 0, 0], stars: [], moon: null,
  heroes: [], hero: 0, prev: -1, heroT: 0,

  show() {
    if (!this.canvas) {
      this.canvas = el('titleSky');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      window.addEventListener('resize', () => { if (this.running) this.layout(); });
    }
    this.canvas.hidden = false;
    if (!this.kind) {
      // it starts at the player's own hour, and goes round from there
      const hr = new Date().getHours();
      this.kind = hr >= 21 || hr < 5 ? 'night' : hr < 9 ? 'dawn' : hr >= 17 ? 'dusk' : 'day';
    }
    this.still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.layout();
    this.loadHeroes();
    if (typeof AircraftPreview !== 'undefined') AircraftPreview.keep = true;
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(() => this.frame());
    }
  },
  stop() {
    this.running = false;
    if (this.canvas) this.canvas.hidden = true;
    // the pictures not drawn yet are asked for again next time
    for (const h of this.heroes) for (const l in h.asked) if (!h.imgs[l]) delete h.asked[l];
    if (typeof AircraftPreview !== 'undefined') AircraftPreview.letGo();
  },

  next(kind) { return TITLE_SKY_ORDER[(TITLE_SKY_ORDER.indexOf(kind) + 1) % TITLE_SKY_ORDER.length]; },

  // the showcase, shuffled; the pictures are asked for a little ahead of when they show
  loadHeroes() {
    if (this.heroes.length || typeof AircraftPreview === 'undefined') return;
    const list = TITLE_HEROES.filter(([id, airline]) => AIRCRAFT.some((a) => a.id === id) && AIRLINE_BY_CODE[airline]);
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    this.heroes = list.map(([id, airline], i) => ({ id, airline, pose: i % TITLE_POSES, imgs: {}, asked: {} }));
    this.hero = 0; this.prev = -1; this.heroT = 0;
  },
  want(h, light) {
    if (!h || h.asked[light]) return;
    h.asked[light] = true;
    AircraftPreview.hero(h.id, h.airline, light, h.pose, (url) => {
      const img = new Image();
      img.src = url;
      // decoded before it is first drawn, so that frame does not stall
      (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => { h.imgs[light] = img; });
    });
  },
  // the lights in use now: this time of day's, and the next one's while it comes in
  lights() {
    const a = TITLE_SKIES[this.kind].light;
    return this.to && TITLE_SKIES[this.to].light !== a ? [a, TITLE_SKIES[this.to].light] : [a];
  },
  lit(h, lights) { return lights.every((l) => h.imgs[l]); },

  // the size of the screen, and everything drawn once for it: the skies, the stars, the clouds, the moon
  layout() {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (this.sets[this.kind] && w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.horizon = h * (w < h ? 0.58 : 0.64);
    this.sets = {};
    this.build(this.kind, true);
    if (this.to) this.build(this.to, true);

    // the stars (twinkling, so drawn every frame; how many show is the sky's)
    this.stars = [];
    const rnd = mulberry32(7);
    for (let i = 0; i < 160; i++) {
      const y = Math.pow(rnd(), 1.6) * this.horizon * 0.8;
      this.stars.push({ x: rnd() * w, y, r: 0.4 + rnd() * 1.1, a: 1 - y / (this.horizon * 0.8), f: rnd() * 6 });
    }

    // the full moon with its seas, drawn once
    const mr = Math.max(w, h) * TITLE_MOON_R, ms = Math.ceil(mr * 9);   // (room for the whole of its halo)
    const moon = document.createElement('canvas');
    moon.width = moon.height = Math.ceil(ms * dpr);
    const g = moon.getContext('2d');
    g.scale(dpr, dpr);
    g.fillStyle = '#f2f4ff';
    g.shadowColor = '#f2f4ff'; g.shadowBlur = mr * 1.5;
    g.beginPath(); g.arc(ms / 2, ms / 2, mr, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0;
    for (const [dx, dy, rr] of [[-0.3, -0.25, 0.34], [0.25, -0.1, 0.26], [-0.05, 0.3, 0.24], [0.35, 0.35, 0.14]]) {
      const x = ms / 2 + dx * mr, y = ms / 2 + dy * mr;
      const mg = g.createRadialGradient(x, y, 0, x, y, rr * mr);
      mg.addColorStop(0, 'rgba(140, 150, 180, 0.32)'); mg.addColorStop(1, 'rgba(140, 150, 180, 0)');
      g.fillStyle = mg;
      g.beginPath(); g.arc(x, y, rr * mr, 0, Math.PI * 2); g.fill();
    }
    this.moon = { cv: moon, size: ms };
  },

  // a time of day's sky and its four layers of cloud: all at once, or one piece per call (so
  // drawing the next one ahead never stalls a frame for long); true once it is complete
  build(kind, all) {
    const S = TITLE_SKIES[kind];
    const set = this.sets[kind] || (this.sets[kind] = { bg: null, layers: [] });
    do {
      if (!set.bg) set.bg = this.skyBg(S);
      else if (set.layers.length < TITLE_CLOUDS.length) set.layers.push(this.cloudLayer(TITLE_CLOUDS[set.layers.length], set.layers.length, S));
    } while (all && set.layers.length < TITLE_CLOUDS.length);
    return set.layers.length === TITLE_CLOUDS.length;
  },
  ready(kind) { const s = this.sets[kind]; return !!s && s.layers.length === TITLE_CLOUDS.length; },

  // the sky's gradient and high thin cloud across it (the sun and the moon are drawn every frame)
  skyBg(S) {
    const w = this.w, h = this.h;
    const bg = document.createElement('canvas');
    bg.width = this.canvas.width; bg.height = this.canvas.height;
    const g = bg.getContext('2d');
    g.scale(this.dpr, this.dpr);
    const grad = g.createLinearGradient(0, 0, 0, this.horizon);
    for (const [k, c] of S.sky) grad.addColorStop(k / 0.8, c);
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) {
      const y = this.horizon * (0.12 + i * 0.1), x = (i * 0.37 % 1) * w;
      const cg = g.createLinearGradient(x - w * 0.3, 0, x + w * 0.3, 0);
      cg.addColorStop(0, S.haze + '0)'); cg.addColorStop(0.5, S.haze + (0.05 + 0.02 * (i % 3)) + ')'); cg.addColorStop(1, S.haze + '0)');
      g.fillStyle = cg;
      g.beginPath(); g.ellipse(x, y, w * 0.32, h * 0.006 + i, -0.02, 0, Math.PI * 2); g.fill();
    }
    return bg;
  },

  // one layer of cloud: heaps of soft puffs, lit on top from the sun's side and shaded
  // underneath, on a body that thickens downwards (no hard top edge), sinking into the haze;
  // a strip that wraps round (drawn twice side by side). Every sky's layer has the same heaps
  // (the same seed), so one sky's clouds turn into the next one's without moving.
  cloudLayer(sp, li, S) {
    const w = this.w, h = this.h, dpr = this.dpr;
    // (the strip starts a heap's height above the layer's line, so the domes are not cut)
    const R = Math.max(w, h), pad = Math.ceil(R * sp.r[1] * 1.6);
    // (a whole number of device pixels wide, so the strip repeats without a seam)
    const cw = Math.ceil(w * 1.2 * dpr), W = cw / dpr, top = this.horizon + h * sp.y - pad, H = Math.ceil(h - top + h * 0.05);
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = Math.ceil(H * dpr);
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    g.translate(0, pad);
    const rnd = mulberry32(31 + li * 17);
    const base = h * sp.hh;
    const rgba = (c, a) => 'rgba(' + c.map(Math.round).join(',') + ',' + a + ')';
    const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
    const lit = mix(S.lit, S.shade, sp.haze * 0.35), mid = mix(S.lit, S.shade, 0.45), dark = mix(S.shade, [6, 10, 22], 0.25);
    const sunLeft = -1;   // (the sun is always on the right)
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
    return { cv, W, top, pat: null };
  },

  frame() {
    if (!this.running) return;
    if (UI.screen.hidden || UI.screen.dataset.view !== 'title') { this.stop(); return; }
    requestAnimationFrame(() => this.frame());
    const now = performance.now();
    // (a slow frame — a picture being drawn — slows the sky for a moment rather than jumping it)
    const dt = Math.min(1 / 30, (now - this.last) / 1000);
    this.last = now;
    if (document.hidden) return;
    this.t += dt;
    this.update(dt);
    this.draw(dt);
  },

  // the time of day: it stays, then the next one comes in once its sky is drawn and the
  // aeroplanes on show have their pictures in its light
  update(dt) {
    if (!this.ready(this.kind)) this.build(this.kind, true);
    const next = this.next(this.kind);
    if (!this.to) {
      this.skyT += dt;
      // the next sky is drawn ahead, a piece per frame, once the pictures in use are out of the way
      if (!this.ready(next) && (this.skyT > 2 || AircraftPreview.queue.length === 0)) this.build(next, false);
      const nl = TITLE_SKIES[next].light;
      const lit = [this.heroes[this.hero], this.heroes[(this.hero + 1) % this.heroes.length]].every((h) => !h || h.imgs[nl]);
      if (this.skyT >= TITLE_SKY_HOLD_S && this.ready(next) && (lit || this.skyT > TITLE_SKY_HOLD_S + 15)) {
        this.to = next; this.skyK = 0;
      }
    } else {
      this.skyK += dt / TITLE_SKY_FADE_S;
      if (this.skyK >= 1) {
        delete this.sets[this.kind];
        this.kind = this.to; this.to = null; this.skyT = 0; this.skyK = 0;
      }
    }
    // the pictures wanted soon: the aeroplane on show and the next two, in this light first, then the next sky's
    const list = this.heroes;
    if (list.length) {
      const near = [0, 1, 2].map((i) => list[(this.hero + i) % list.length]);
      for (const l of [TITLE_SKIES[this.kind].light, TITLE_SKIES[next].light]) for (const h of near) this.want(h, l);
    }
  },

  draw(dt) {
    const g = this.ctx, w = this.w, h = this.h, t = this.t;
    const A = TITLE_SKIES[this.kind], B = this.to ? TITLE_SKIES[this.to] : null;
    const sa = this.sets[this.kind], sb = B ? this.sets[this.to] : null;
    const k = B ? smooth01(this.skyK) : 0;
    const lerp = (a, b) => a + (b - a) * k;
    // the sky, the next one over it coming in
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.drawImage(sa.bg, 0, 0);
    if (sb && k > 0) { g.globalAlpha = k; g.drawImage(sb.bg, 0, 0); g.globalAlpha = 1; }
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // the stars twinkle, as many as the sky has
    const stars = lerp(A.stars, B ? B.stars : A.stars);
    if (stars > 0.01) {
      g.fillStyle = '#ffffff';
      for (const s of this.stars) {
        g.globalAlpha = s.a * stars * (0.65 + 0.35 * Math.sin(t * 1.3 + s.f * 7));
        g.fillRect(s.x, s.y, s.r, s.r);
      }
      g.globalAlpha = 1;
    }
    this.drawLights(g, A, B || A, k);
    // the far clouds, then the aeroplane, then the near clouds sweeping under it
    const layer = (i) => {
      if (dt) this.cloudX[i] = (this.cloudX[i] + dt * TITLE_CLOUDS[i].speed * (this.still ? TITLE_STILL_CLOUDS : 1) * (w / 1200)) % sa.layers[i].W;
      const x = this.cloudX[i], dpr = this.dpr;
      for (const [L, a] of sb && k > 0 ? [[sa.layers[i], 1], [sb.layers[i], k]] : [[sa.layers[i], 1]]) {
        g.globalAlpha = a;
        // a pattern repeating along x, moved by a fraction of a pixel too: no seam where it wraps
        if (L.pat === null) L.pat = (typeof DOMMatrix !== 'undefined' && g.createPattern(L.cv, 'repeat-x')) || false;
        if (L.pat && L.pat.setTransform) {
          const y = Math.round(L.top * dpr);
          L.pat.setTransform(new DOMMatrix([1, 0, 0, 1, -x * dpr, y]));
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.fillStyle = L.pat;
          g.fillRect(0, y, this.canvas.width, L.cv.height);
          g.setTransform(dpr, 0, 0, dpr, 0, 0);
        } else for (const j of [0, 1]) g.drawImage(L.cv, -x + j * L.W, L.top, L.W, L.cv.height / dpr);
      }
      g.globalAlpha = 1;
    };
    layer(0); layer(1);
    this.drawHero(g, dt, k);
    layer(2); layer(3);
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

  // the sun and the moon on their way from one sky's place to the next one's, each with its
  // glow (the glow lingers a little after the sun has gone into the clouds)
  drawLights(g, A, B, k) {
    const w = this.w, h = this.h, R = Math.max(w, h);
    const mix = (a, b) => a.map((v, i) => v + (b[i] - v) * k);
    const rgba = (c, a) => 'rgba(' + c.map(Math.round).join(',') + ',' + a.toFixed(3) + ')';
    const glow = (x, y, c, a) => {
      if (a <= 0.005) return;
      const gg = g.createRadialGradient(x, y, 0, x, y, R * 0.6);
      gg.addColorStop(0, rgba(c, 0.55 * a)); gg.addColorStop(0.25, rgba(c, 0.18 * a)); gg.addColorStop(1, rgba(c, 0));
      g.fillStyle = gg; g.fillRect(0, 0, w, h);
    };
    const over = (e, lo, span) => Math.max(0, Math.min(1, (e - lo) / span));
    // the sun
    const sun = mix(A.sunAt, B.sunAt), sx = w * sun[0], sy = this.horizon - h * sun[1];
    glow(sx, sy, mix(A.glow, B.glow), sun[2] * over(sun[1], -0.12, 0.14));
    const sa = sun[2] * over(sun[1], -0.03, 0.06);
    if (sa > 0.005) {
      const sr = R * (A.sunR + (B.sunR - A.sunR) * k), c = mix(A.sun, B.sun);
      const sg = g.createRadialGradient(sx, sy, 0, sx, sy, sr * 1.35);
      sg.addColorStop(0, rgba(c, sa)); sg.addColorStop(0.72, rgba(c, sa)); sg.addColorStop(0.8, rgba(c, sa * 0.4)); sg.addColorStop(1, rgba(c, 0));
      g.fillStyle = sg;
      g.beginPath(); g.arc(sx, sy, sr * 1.35, 0, Math.PI * 2); g.fill();
    }
    // the moon
    const moon = mix(A.moonAt, B.moonAt), mx = w * moon[0], my = this.horizon - h * moon[1];
    const ma = moon[2] * over(moon[1], -0.03, 0.06);
    if (ma > 0.005 && this.moon) {
      glow(mx, my, TITLE_MOON_GLOW, ma);
      g.globalAlpha = ma;
      g.drawImage(this.moon.cv, mx - this.moon.size / 2, my - this.moon.size / 2, this.moon.size, this.moon.size);
      g.globalAlpha = 1;
    }
  },

  // the showcase: each aeroplane glides in from behind, floats a while on the air and moves on
  // ahead; while the sky changes, its picture turns into the one in the new light
  drawHero(g, dt, skyK) {
    const list = this.heroes;
    if (!list.length) return;
    const lights = this.lights();
    if (this.prev < 0 && this.heroT === 0) {
      // nothing on show yet: it starts with the first aeroplane whose pictures are ready
      const j = list.findIndex((x) => this.lit(x, lights));
      if (j < 0) return;
      this.hero = j;
    } else if (!list[this.hero].imgs[lights[0]]) return;
    this.heroT += dt;
    if (this.heroT > TITLE_HERO_S) {
      // the next one whose pictures are ready (else this one stays a little longer)
      for (let i = 1; i < list.length; i++) {
        const j = (this.hero + i) % list.length;
        if (this.lit(list[j], lights)) { this.prev = this.hero; this.hero = j; this.heroT = 0; break; }
      }
    }
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
    const ih = iw / 2, move = this.still ? 0 : 1, tt = this.t;
    // one picture at alpha a, its picture in the next light over it (so the two add up to a)
    const pic = (hero, a) => {
      const ia = hero.imgs[lights[0]], ib = lights[1] ? hero.imgs[lights[1]] : null;
      const b = ib ? a * skyK : 0;
      const parts = !ib || b <= 0 ? [[ia, a]] : !ia || b >= 0.999 ? [[ib, a]] : [[ia, 1 - (1 - a) / (1 - b)], [ib, b]];
      for (const [img, al] of parts) {
        if (!img || al <= 0) continue;
        g.globalAlpha = al;
        g.drawImage(img, -iw / 2, -ih / 2, iw, ih);
      }
    };
    // one aeroplane at alpha a, dx (of the picture's width) off its place and s times its size,
    // floating on the air
    const one = (hero, a, dx, s) => {
      if (a <= 0.003) return;
      const bob = Math.sin(tt * 0.7) * h * 0.006 * move, sway = Math.sin(tt * 0.45) * 0.012 * move;
      s = 1 + (s - 1) * move;
      g.save();
      g.translate(cx + dx * iw * move + Math.sin(tt * 0.3) * 6 * move, cy + bob);
      g.rotate(sway);
      g.scale(s, s);
      pic(hero, a);
      g.restore();
      g.globalAlpha = 1;
    };
    // coming in from behind: from the right and further off, slowing down into its place
    const arrive = (hero, q) => { const d = 1 - (1 - q) * (1 - q); one(hero, smooth01(q), (1 - d) * 0.16, 1 - (1 - d) * 0.08); };
    const T = this.heroT, F = TITLE_FADE_S;
    if (T < F && this.prev >= 0 && this.prev !== this.hero) {
      // the previous one speeds up ahead (to the left and nearer) and is gone before this one
      // is fully in, so the two never show as one double picture
      const p = Math.min(1, T / (F * 0.5)), q = (T - F * 0.35) / (F * 0.65);
      one(list[this.prev], 1 - smooth01(p), -p * p * 0.22, 1 + p * p * 0.08);
      if (q > 0) arrive(list[this.hero], q);
    } else if (T < F && this.prev < 0) arrive(list[this.hero], T / F);
    else one(list[this.hero], 1, 0, 1);
  }
};
