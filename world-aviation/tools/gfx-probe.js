'use strict';

// ============================================================
// World Aviation — a probe of what the 3D picture costs, run inside the page.
//
// Not loaded by the game: tools/gfx-bench.js injects it into headless Chrome, and on a real
// phone it can be pasted into the console of chrome://inspect (Android, USB debugging). It must
// be in the page before the airports are built (before a flight or a tour starts), so it can
// tag what each of Airport3D's builders adds; GfxProbe.retag() tags airports built before it.
//
//   GfxProbe.layers()           the names of the layers that can be switched off
//   GfxProbe.measure(n)         render the scene as it stands n times (no update in between):
//                               { ms (median render + GPU wait), calls, tris, points }
//   GfxProbe.without(name, n)   the same with one layer (or a list of them) hidden, then back
//   GfxProbe.atRatio(dpr, n)    the same at another pixel ratio, then back
//   GfxProbe.cpu(fn, n)         the median time of a JS function (Scene3D.update, Game.draw2d)
//   GfxProbe.overdraw()         the fragments shaded per pixel (the fill rate a frame needs);
//   GfxProbe.overdrawWithout(name)  the same with a layer hidden
//   GfxProbe.census()           draw calls and triangles per layer, from what is visible now
//
// The airport's layers are tagged by the builder that made them: apt.ground (the ground and
// runway planes), apt.lights, apt.markings, apt.buildings (with the landside and the boards,
// once Merge3D has baked them together), apt.landside, apt.adverts (what is left of them),
// apt.perimeter (fence and the trees outside it), apt.equipment, apt.apron (bridges, vehicles,
// masts), apt.baggage, apt.pools (the floodlights' additive discs), apt.lamps (their points),
// apt.cars (landside traffic), apt.parked (the other aeroplanes), apt.responders.
// ============================================================

const GfxProbe = {
  installed: false,

  install() {
    if (this.installed) return;
    this.installed = true;
    let cur = null;
    // tag every child a builder adds to the airport's frame (the first tag wins, so a builder
    // called from inside another one keeps its own)
    const wrap = (obj, fn, tag, recArg) => {
      const orig = obj[fn];
      obj[fn] = function (...args) {
        if (recArg !== undefined && args[recArg] && args[recArg].frame) cur = args[recArg];
        const frame = cur && cur.frame, n0 = frame ? frame.children.length : 0;
        const r = orig.apply(this, args);
        if (frame) for (let i = n0; i < frame.children.length; i++) {
          const o = frame.children[i];
          if (!o.userData.gfx) o.userData.gfx = tag;
        }
        return r;
      };
    };
    wrap(Airport3D, 'buildLights', 'apt.lights', 1);
    wrap(Airport3D, 'buildMarkings', 'apt.markings');
    wrap(Airport3D, 'buildBuildings', 'apt.buildings', 1);
    wrap(Landside3D, 'build', 'apt.landside', 1);
    wrap(Adverts3D, 'build', 'apt.adverts', 1);
    wrap(Perimeter3D, 'build', 'apt.perimeter', 1);
    wrap(Airport3D, 'buildEquipment', 'apt.equipment', 1);
    wrap(Baggage, 'build', 'apt.baggage', 1);
    wrap(Apron3D, 'build', 'apt.apron', 1);
    const build = Airport3D.build;
    Airport3D.build = function (...args) { const rec = build.apply(this, args); GfxProbe.retag(rec); cur = null; return rec; };
  },

  // the tags that do not come from a builder: the ground planes, the pools, the lamps, the cars
  retag(rec) {
    if (!rec) { for (const r of Scene3D.airports3D.values()) this.retag(r); return; }
    for (const o of rec.frame.children) if (!o.userData.gfx) o.userData.gfx = o.userData.baked === 'buildings' ? 'apt.buildings' : 'apt.ground';
    rec.frame.traverse((o) => { if (o.isMesh && o.material === rec.poolMat) o.userData.gfx = 'apt.pools'; });
    if (rec.pools) rec.pools.userData.gfx = 'apt.pools';
    if (rec.lamps) rec.lamps.userData.gfx = 'apt.lamps';
    for (const v of rec.traffic || []) if (v.kind === 'road') v.mesh.userData.gfx = 'apt.cars';
    for (const p of rec.parked) p.userData.gfx = 'apt.parked';
    if (rec.responders) rec.responders.group.userData.gfx = 'apt.responders';
  },

  // the objects of a layer (the scene's own ones by name, the airports' by tag)
  objects(name) {
    const S = Scene3D;
    const own = {
      sky: [S.sky], stars: [S.stars], clouds: [S.cloudGroup], trees: [S.trees], water: [S.water],
      farTerrain: [S.farMesh], nearTerrain: [S.nearMesh], groundLights: [GroundLights.points],
      landingPool: [S.landingPool], ownAircraft: [S.ownAircraft], followMe: [FollowMe3D.group], tug: [S.tug]
    };
    if (own[name]) return own[name].filter(Boolean);
    if (name === 'airports') return Array.from(S.airports3D.values()).map((r) => r.group);
    this.retag();
    const out = [];
    for (const rec of S.airports3D.values()) rec.group.traverse((o) => { if (o.userData.gfx === name) out.push(o); });
    return out;
  },

  layers() {
    const tags = new Set();
    this.retag();
    for (const rec of Scene3D.airports3D.values()) rec.group.traverse((o) => { if (o.userData.gfx) tags.add(o.userData.gfx); });
    return ['sky', 'stars', 'clouds', 'trees', 'water', 'farTerrain', 'nearTerrain', 'groundLights', 'landNight',
      'landingPool', 'ownAircraft', 'followMe', 'airports'].concat(Array.from(tags).sort());
  },

  // hide a layer (or a list): returns a function that puts everything back
  hide(names) {
    const undo = [];
    for (const name of [].concat(names)) {
      if (name === 'landNight') {
        // the land cover's lights at night (a branch of its shader)
        const u = LandCover.uniforms && LandCover.uniforms.uLandNight;
        if (u) { const v = u.value; u.value = 0; undo.push(() => { u.value = v; }); }
        continue;
      }
      for (const o of this.objects(name)) { const v = o.visible; o.visible = false; undo.push(() => { o.visible = v; }); }
    }
    return () => { for (const f of undo.reverse()) f(); };
  },

  // wait for the GPU: a one-pixel read blocks until the frame is drawn
  sync() {
    const gl = Scene3D.renderer.getContext();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.px || (this.px = new Uint8Array(4)));
  },

  measure(n = 5) {
    const r = Scene3D.renderer;
    Scene3D.render(); this.sync();                   // compiles what is new, uploads textures
    const ms = [];
    for (let i = 0; i < n; i++) {
      const t0 = performance.now();
      Scene3D.render(); this.sync();
      ms.push(performance.now() - t0);
    }
    const info = r.info.render;
    return { ms: +median(ms).toFixed(1), calls: info.calls, tris: info.triangles, points: info.points };
  },

  without(names, n) { const undo = this.hide(names); try { return this.measure(n); } finally { undo(); } },

  atRatio(dpr, n) {
    const r = Scene3D.renderer, was = r.getPixelRatio();
    r.setPixelRatio(dpr); r.setSize(Scene3D.w, Scene3D.h, true);
    try { return Object.assign(this.measure(n), { px: r.domElement.width + 'x' + r.domElement.height }); }
    finally { r.setPixelRatio(was); r.setSize(Scene3D.w, Scene3D.h, true); }
  },

  cpu(fn, n = 5) {
    const ms = [];
    for (let i = 0; i < n; i++) { const t0 = performance.now(); fn(); ms.push(performance.now() - t0); }
    return +median(ms).toFixed(2);
  },

  // The fill: how many fragments the GPU shades per pixel of the picture, on average. The scene
  // is drawn once into a float target with every material swapped for a plain white one that
  // adds 1 per fragment, with no depth test: the logarithmic depth buffer writes gl_FragDepth,
  // which turns off the early depth test on phone GPUs, so every fragment rasterised is shaded,
  // hidden or not (an alpha-tested leaf too). Null where float targets cannot be drawn into.
  overdraw() {
    const r = Scene3D.renderer, gl = r.getContext();
    if (!r.capabilities.isWebGL2 || !gl.getExtension('EXT_color_buffer_float')) return null;
    const w = r.domElement.width, h = r.domElement.height;
    if (!this.odRT || this.odRT.width !== w || this.odRT.height !== h) {
      if (this.odRT) this.odRT.dispose();
      this.odRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.FloatType, depthBuffer: false });
      this.odBuf = new Float32Array(w * h * 4);
    }
    const add = { color: 0xffffff, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation };
    const cache = this.odMats || (this.odMats = new Map());
    const counter = (o, m) => {
      let key, make;
      if (o.isPoints) {
        const size = m.size !== undefined ? m.size : (m.uniforms && m.uniforms.size ? m.uniforms.size.value : 1);
        const att = m.sizeAttenuation !== undefined ? m.sizeAttenuation : false;
        key = 'p' + size + att; make = () => new THREE.PointsMaterial(Object.assign({ size, sizeAttenuation: att }, add));
      } else if (o.isSprite) { key = 's'; make = () => new THREE.SpriteMaterial(add); }
      else if (o.isLine) { key = 'l'; make = () => new THREE.LineBasicMaterial(add); }
      else { key = 'm' + m.side; make = () => new THREE.MeshBasicMaterial(Object.assign({ side: m.side }, add)); }
      if (!cache.has(key)) cache.set(key, make());
      return cache.get(key);
    };
    const swapped = [];
    Scene3D.scene.traverse((o) => {
      if (!o.material) return;
      swapped.push([o, o.material]);
      o.material = Array.isArray(o.material) ? o.material.map((m) => counter(o, m)) : counter(o, o.material);
    });
    const fog = Scene3D.scene.fog, cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
    try {
      Scene3D.scene.fog = null;
      r.setRenderTarget(this.odRT);
      r.setClearColor(0x000000, 0); r.clear();
      r.render(Scene3D.scene, Scene3D.camera);
      r.readRenderTargetPixels(this.odRT, 0, 0, w, h, this.odBuf);
    } finally {
      r.setRenderTarget(null); r.setClearColor(cc, ca);
      Scene3D.scene.fog = fog;
      for (const [o, m] of swapped) o.material = m;
    }
    let sum = 0;
    for (let i = 0; i < this.odBuf.length; i += 4) sum += this.odBuf[i];
    return +(sum / (w * h)).toFixed(3);
  },
  overdrawWithout(names) { const undo = this.hide(names); try { return this.overdraw(); } finally { undo(); } },

  // what each layer draws now: hide it and see how many draw calls and triangles go
  census() {
    const base = this.measure(1), out = {};
    for (const name of this.layers()) {
      const m = this.without(name, 1);
      out[name] = { calls: base.calls - m.calls, tris: base.tris - m.tris, points: base.points - m.points };
    }
    return { base, layers: out };
  }
};

function median(a) { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }

GfxProbe.install();
window.GfxProbe = GfxProbe;
