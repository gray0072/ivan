'use strict';

// ============================================================
// World Aviation — the Mriya's assembly hall in 3D: the An-225 as a
// pale hologram turning slowly over a glowing blueprint floor, seen
// from low down so it towers over you, and every part the pilot has
// fitted inside it in the finish they chose (data/mriya.js; the model's
// tagged parts, cut to the part's place by clipping planes:
// art/mriyaplan.js). Finished, it becomes the whole aeroplane in that
// finish; a new finish repaints it at once (setFinish). Its own small renderer, made
// when the hall opens and freed when it closes (ui/mriya.js); the
// hangar's ghost picture uses its hologram material too
// (render/preview3d.js).
// ============================================================

// the hologram: the faces seen edge-on glow (a Fresnel rim), the rest stays faint, with slow
// scan lines running up it; added on top of what is behind, never hiding it
function hologramMaterial(color, strength) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color || 0x8fd0ff) }, uTime: { value: 0 }, uStrength: { value: strength || 1 } },
    vertexShader: [
      'varying vec3 vN; varying vec3 vV; varying float vY;',
      'void main() {',
      '  vec4 wp = modelMatrix * vec4(position, 1.0);',
      '  vY = wp.y;',
      '  vec4 mv = viewMatrix * wp;',
      '  vV = -mv.xyz;',
      '  vN = normalize(normalMatrix * normal);',
      '  gl_Position = projectionMatrix * mv;',
      '}'].join('\n'),
    fragmentShader: [
      'uniform vec3 uColor; uniform float uTime; uniform float uStrength;',
      'varying vec3 vN; varying vec3 vV; varying float vY;',
      'void main() {',
      '  float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));',
      '  float rim = pow(f, 2.2);',
      '  float scan = 0.5 + 0.5 * sin(vY * 2.2 - uTime * 1.6);',
      '  float a = (0.05 + 0.55 * rim + 0.05 * scan * scan) * uStrength;',
      '  gl_FragColor = vec4(uColor * (0.6 + 0.8 * rim), a);',
      '}'].join('\n'),
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
}

const Mriya3D = {
  renderer: null, scene: null, camera: null, canvas: null, model: null, gold: null, done: false,
  gilded: new Map(),          // part id -> the meshes that gild it
  raf: 0, t0: 0, spin: 0.75, drag: null, flashes: [], holo: null,

  open(canvas, placed, done, finish) {
    this.close();
    this.canvas = canvas;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (err) { this.renderer = null; return false; }
    const r = this.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputEncoding = THREE.sRGBEncoding;
    r.localClippingEnabled = true;
    r.setClearColor(0x000000, 0);
    const scene = this.scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xbcd8ff, 0x2a2016, 0.55));
    const key = new THREE.DirectionalLight(0xfff0d0, 1.0);
    key.position.set(60, 90, 70);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fc8ff, 0.55);
    rim.position.set(-80, 30, -60);
    scene.add(rim);
    const under = new THREE.DirectionalLight(0xffc070, 0.35);
    under.position.set(0, -60, 20);
    scene.add(under);

    MriyaPlan.init();
    const ac = MriyaPlan.ac, l = MriyaPlan.lay;
    this.fin = mriyaFinish(finish);
    this.camera = new THREE.PerspectiveCamera(34, 2, 1, 2000);
    this.floor(l);
    // the hologram: the whole aeroplane, faint
    this.model = AircraftModels.build(ac);
    AircraftModels.animate(this.model, { gear: 1, flaps: 0, propSpeed: 0 });
    this.model.updateMatrixWorld(true);
    this.holo = hologramMaterial(0x8fd0ff, 1);
    this.model.traverse((o) => {
      if (o.isMesh) o.material = this.holo;
      if (o.isPoints) o.visible = false;
    });
    scene.add(this.model);
    this.gold = new THREE.Group();
    scene.add(this.gold);
    // the fitted parts in the finish (pulled a little towards the eye: the hologram on the same
    // surface fails the depth test there instead of shimmering over them)
    this.goldMat = (planes) => this.paint(new THREE.MeshPhongMaterial({
      clippingPlanes: planes, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4
    }), false);
    this.done = false;
    this.gilded.clear();
    this.flashes = [];
    if (done) this.finish(true); else this.sync(placed, true);

    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    // a drag turns it by hand; it turns on by itself a moment after
    this.onDown = (e) => { this.drag = { x: e.clientX, spin: this.spin, id: e.pointerId }; };
    this.onMove = (e) => {
      if (!this.drag || this.drag.id !== e.pointerId) return;
      this.spin = this.drag.spin - (e.clientX - this.drag.x) * 0.008;
      this.drag.moved = true;
    };
    this.onUp = () => { if (this.drag) this.held = performance.now(); this.drag = null; };
    canvas.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    this.t0 = performance.now();
    this.last = this.t0;
    const loop = () => { this.raf = requestAnimationFrame(loop); this.frame(); };
    loop();
    return true;
  },

  close() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.onResize) window.removeEventListener('resize', this.onResize);
    if (this.onMove) { window.removeEventListener('pointermove', this.onMove); window.removeEventListener('pointerup', this.onUp); }
    if (this.canvas && this.onDown) this.canvas.removeEventListener('pointerdown', this.onDown);
    if (this.scene) this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.forceContextLoss) this.renderer.forceContextLoss();
    }
    this.renderer = null; this.scene = null; this.model = null; this.real = null; this.canvas = null; this.onResize = null; this.onMove = null;
    this.gilded.clear();
  },

  // the floor of the hall: a round blueprint grid that glows faintly and fades out at its edge
  floor(l) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 512;
    const g = cv.getContext('2d');
    const grad = g.createRadialGradient(256, 256, 20, 256, 256, 256);
    grad.addColorStop(0, 'rgba(70,140,210,0.32)'); grad.addColorStop(0.7, 'rgba(40,90,150,0.12)'); grad.addColorStop(1, 'rgba(20,40,70,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
    g.globalCompositeOperation = 'source-atop';
    g.strokeStyle = 'rgba(150,210,255,0.35)';
    for (let i = 0; i <= 512; i += 16) {
      g.lineWidth = i % 128 === 0 ? 1.6 : 0.6;
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(255,215,130,0.45)'; g.lineWidth = 2;
    g.beginPath(); g.arc(256, 256, 200, 0, Math.PI * 2); g.stroke();
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    const size = Math.max(l.S, l.L) * 1.6;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = -l.gearH;
    this.scene.add(m);
  },

  // the gold parts: those placed get gilded, the others are taken away (a reset); quiet: no flash
  sync(placed, quiet) {
    if (!this.scene || this.done) return;
    const want = new Set(placed);
    for (const [id, meshes] of this.gilded) {
      if (want.has(id)) continue;
      for (const m of meshes) this.gold.remove(m);
      this.gilded.delete(id);
    }
    for (const id of want) {
      if (this.gilded.has(id)) continue;
      const part = MRIYA_PARTS.find((p) => p.id === id);
      if (!part) continue;
      const meshes = this.gild(part);
      this.gilded.set(id, meshes);
      if (!quiet) this.flashes.push({ meshes, t: 0 });
    }
  },

  // the gold copies of the model's meshes for one part
  gild(part) {
    const spec = MriyaPlan.part3d(part), out = [];
    const ud = this.model.userData;
    const plane = (nx, ny, nz, c) => new THREE.Plane(new THREE.Vector3(nx, ny, nz), c);
    const extra = [];
    if (spec.yMin !== undefined) extra.push(plane(0, 1, 0, -spec.yMin));
    if (spec.yMax !== undefined) extra.push(plane(0, -1, 0, spec.yMax));
    if (spec.side) extra.push(plane(spec.side, 0, 0, 0));
    // the clipping sets: one per polygon (vertical prisms), per stretch of the body, or none
    let sets = [extra];
    if (spec.cut) {
      sets = spec.cut.map((poly) => {
        let cx = 0, cz = 0;
        for (const [x, z] of poly) { cx += x / poly.length; cz += z / poly.length; }
        const ps = extra.slice();
        for (let i = 0; i < poly.length; i++) {
          const [ax, az] = poly[i], [bx, bz] = poly[(i + 1) % poly.length];
          let nx = -(bz - az), nz = bx - ax;
          const len = Math.hypot(nx, nz) || 1;
          nx /= len; nz /= len;
          if (nx * (cx - ax) + nz * (cz - az) < 0) { nx = -nx; nz = -nz; }   // facing in
          ps.push(plane(nx, 0, nz, -(nx * ax + nz * az)));
        }
        ps.box = poly;
        return ps;
      });
    } else if (spec.zRanges) {
      sets = spec.zRanges.map(([z0, z1]) => extra.concat([plane(0, 0, 1, -z0), plane(0, 0, -1, z1)]));
    }
    const objs = [];
    for (const t of spec.tags || []) {
      const list = t.indexOf('surf:') === 0 ? ud.surf[t.slice(5)] : ud.tags[t];
      for (const o of list || []) objs.push(o);
    }
    const bb = new THREE.Box3(), c = new THREE.Vector3();
    for (const o of objs) {
      o.traverse((m) => {
        if (!m.isMesh) return;
        bb.setFromObject(m);
        bb.getCenter(c);
        if (spec.side && Math.sign(c.x) !== spec.side) return;
        for (const ps of sets) {
          if (ps.box) {
            // skip a mesh nowhere near this polygon
            let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
            for (const [x, z] of ps.box) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
            if (bb.max.x < x0 || bb.min.x > x1 || bb.max.z < z0 || bb.min.z > z1) continue;
          }
          const g = new THREE.Mesh(m.geometry, this.goldMat(ps));
          g.matrixAutoUpdate = false;
          g.matrix.copy(m.matrixWorld);
          this.gold.add(g);
          out.push(g);
        }
      });
    }
    // the modules inside: glowing gold blocks
    for (const k of spec.cores || []) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(k.w, k.d, k.h), this.paint(new THREE.MeshPhongMaterial(), true));
      box.position.set(k.x, k.y, k.z);
      box.updateMatrix();
      this.gold.add(box);
      out.push(box);
    }
    return out;
  },

  // a material in the finish: the body's colour, or a module inside glowing in the accent colour
  paint(m, core) {
    const f = this.fin, c = (hex) => new THREE.Color(hex).convertSRGBToLinear();
    m.color.copy(c(core ? f.accent : f.base));
    m.specular.setHex(f.specular);
    m.shininess = core ? 40 : f.shininess;
    m.emissive.copy(c(core ? f.accent : f.base)).multiplyScalar(core ? 0.45 : 0.08);
    m.userData.em = m.emissive.clone();
    m.userData.core = core;
    return m;
  },
  // another finish (bought, chosen, or tried on before buying): everything repainted at once
  setFinish(id) {
    this.fin = mriyaFinish(id);
    if (!this.scene) return;
    for (const meshes of this.gilded.values()) for (const m of meshes) this.paint(m.material, m.material.userData.core);
    if (this.real) { this.scene.remove(this.real); this.real = null; this.buildReal(); }
  },
  buildReal() {
    const real = AircraftModels.build(MriyaPlan.ac, { finish: this.fin.id });
    AircraftModels.animate(real, { gear: 1, flaps: 0, propSpeed: 0 });
    real.traverse((o) => { if (o.isPoints) o.visible = false; });
    this.scene.add(real);
    this.real = real;
  },

  // all fifty: the hologram gives way to the whole aeroplane in its finish (instant: already built)
  finish(instant) {
    if (!this.scene) return;
    this.done = true;
    this.buildReal();
    if (instant) { this.scene.remove(this.model); this.scene.remove(this.gold); return; }
    // the hologram flares and fades over it
    this.finale = { t: 0 };
  },
  resize() {
    if (!this.renderer || !this.canvas) return;
    const w = this.canvas.clientWidth || 600, h = this.canvas.clientHeight || 320;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // a narrow screen backs off so the wings still fit
    this.camera.fov = w / h < 1.3 ? 44 : 34;
    this.camera.updateProjectionMatrix();
  },

  frame() {
    if (!this.renderer) return;
    const now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const t = (now - this.t0) / 1000;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this.drag && !(this.held && now - this.held < 2500) && !reduced) this.spin += dt * TAU / MRIYA.SPIN_S;
    const l = MriyaPlan.lay;
    // low down and close: it towers over the floor; the height breathes slowly. Close enough to fill
    // the picture, far enough that the wings never leave it on a narrow screen
    const M = Math.max(l.S, l.L), hHalf = Math.atan(Math.tan(this.camera.fov * DEG / 2) * this.camera.aspect);
    const radius = Math.max(M * 0.9, M * 0.58 / Math.tan(hHalf));
    const h = -l.gearH + 2.5 + (reduced ? 4 : 4 + 4 * Math.sin(t * 0.13));
    this.camera.position.set(Math.sin(this.spin) * radius, h, Math.cos(this.spin) * radius);
    this.camera.lookAt(0, 1.5, 0);
    if (this.holo) this.holo.uniforms.uTime.value = t;
    // a part just fitted flares up white and settles into its finish
    for (const f of this.flashes) {
      f.t += dt;
      const k = Math.max(0, 1 - f.t / 1.4);
      for (const m of f.meshes) {
        const em = m.material.userData.em;
        if (em) m.material.emissive.setRGB(em.r + 0.9 * k, em.g + 0.8 * k, em.b + 0.6 * k);
      }
    }
    this.flashes = this.flashes.filter((f) => f.t < 1.4);
    if (this.finale) {
      this.finale.t += dt;
      const k = this.finale.t;
      if (this.holo) this.holo.uniforms.uStrength.value = Math.max(0, 1 + 3 * Math.sin(Math.min(1, k / 0.6) * Math.PI) - k * 0.8);
      if (k > 2.2) { this.scene.remove(this.model); this.scene.remove(this.gold); this.finale = null; }
    }
    this.renderer.render(this.scene, this.camera);
  }
};
