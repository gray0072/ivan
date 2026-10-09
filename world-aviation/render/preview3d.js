'use strict';

// ============================================================
// World Aviation — the hangar's aircraft pictures: each type's own
// 3D model (models.js) in its house colours, gear down, seen from
// ahead and a little above with a soft shadow under it, rendered
// once into a transparent image by a small off-screen renderer.
// Used by the hangar cards (ui/ui.js): AircraftPreview.fill(root)
// puts the pictures into every img[data-ac] inside root, drawing the
// missing ones one per frame so the screen never stalls, and frees
// the renderer when the queue is empty. The title screen (ui/title.js)
// asks it for bigger pictures of airliners in flight in an airline's
// colours: AircraftPreview.hero(id, airline, light, cb).
// ============================================================

const AircraftPreview = {
  W: 720, H: 360,            // picture size, pixels (cards show it at about half that)
  urls: new Map(),           // aircraft id -> object URL of the finished picture
  HERO_W: 1280, HERO_H: 640, // the title screen's pictures
  queue: [],                 // aircraft ids (or hero keys 'hero|id|airline|light') still to draw
  waiting: new Map(),        // key -> callbacks waiting for that picture
  renderer: null,
  shadowTex: null,
  busy: false,

  // every img[data-ac] in root gets its picture: at once if it is drawn, else when it is
  fill(root) {
    root.querySelectorAll('img[data-ac]').forEach((img) => {
      const id = img.dataset.ac;
      if (this.urls.has(id)) { this.show(img, this.urls.get(id)); return; }
      if (this.queue.indexOf(id) < 0) this.queue.push(id);
    });
    this.kick();
  },
  // a picture of a type in flight in an airline's colours, lit for the title's sky (light: day,
  // dusk or night); cb(url) once it is drawn
  hero(id, airline, light, cb) {
    const key = 'hero|' + id + '|' + airline + '|' + light;
    if (this.urls.has(key)) { cb(this.urls.get(key)); return; }
    if (!this.waiting.has(key)) this.waiting.set(key, []);
    this.waiting.get(key).push(cb);
    if (this.queue.indexOf(key) < 0) this.queue.push(key);
    this.kick();
  },
  kick() {
    if (!this.busy && this.queue.length) { this.busy = true; requestAnimationFrame(() => this.next()); }
  },
  show(img, url) {
    img.src = url;
    const pic = img.closest('.acPic');
    if (pic) pic.classList.remove('loading');
  },

  next() {
    const id = this.queue.shift();
    const part = id.split('|'), hero = part[0] === 'hero';
    const ac = AIRCRAFT.find((a) => a.id === (hero ? part[1] : id));
    if (ac) {
      let canvas = null;
      try { canvas = this.draw(ac, hero ? { airline: part[2], light: part[3] } : null); } catch (err) { canvas = null; }
      if (canvas) {
        const done = (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          this.urls.set(id, url);
          if (hero) { for (const cb of this.waiting.get(id) || []) cb(url); this.waiting.delete(id); return; }
          document.querySelectorAll('img[data-ac="' + id + '"]').forEach((img) => this.show(img, url));
        };
        // WebP keeps the transparency at a fraction of the size; browsers that cannot write it give a PNG
        canvas.toBlob(done, 'image/webp', 0.9);
      }
    }
    if (this.queue.length) { requestAnimationFrame(() => this.next()); return; }
    // the last one is on its way: let the GPU go once it has been read back
    this.busy = false;
    setTimeout(() => { if (!this.busy) this.release(); }, 400);
  },

  release() {
    if (!this.renderer) return;
    this.renderer.dispose();
    if (this.renderer.forceContextLoss) this.renderer.forceContextLoss();
    this.renderer = null;
  },

  // one picture: the model on a transparent background, framed to fill the width; hero: in
  // flight for the title screen ({ airline, light })
  draw(ac, hero) {
    const W = hero ? this.HERO_W : this.W, H = hero ? this.HERO_H : this.H;
    if (!this.renderer) {
      const canvas = document.createElement('canvas');
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.renderer.setPixelRatio(1);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.setClearColor(0x000000, 0);
    }
    this.renderer.setSize(W, H, false);
    const scene = new THREE.Scene();
    const d = aircraftDims(ac);
    let model, shadow = null;
    if (!hero) {
      scene.add(new THREE.HemisphereLight(0xeef6ff, 0x4a5560, 0.75));
      const key = new THREE.DirectionalLight(0xffffff, 0.75);
      key.position.set(40, 70, 60);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9cc8ff, 0.25);
      rim.position.set(-60, 20, -40);
      scene.add(rim);
      model = AircraftModels.build(ac);
      AircraftModels.animate(model, { gear: 1, flaps: 0, propSpeed: 0 });
      // a soft shadow on the ground under it
      shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: this.shadow(), transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.scale.set(d.span * 1.05, d.len * 1.05, 1);
      shadow.position.y = -d.gearH + 0.02;
      scene.add(shadow);
    } else {
      // the light of the title's sky: a low warm sun behind the camera at dusk, a high white
      // one by day, a cold moon and the sky's glow at night (bright enough that a white body
      // reads as white against the dark sky, only bluer)
      const L = { dusk: [0xbcc8ff, 0x6a4a52, 0.62, 0xffc48a, 1.0], day: [0xeaf4ff, 0x6a7280, 0.8, 0xfff4e2, 0.8], night: [0x7a92d0, 0x2a3350, 0.62, 0xc4d2ff, 0.56] }[hero.light] || [0xeef6ff, 0x4a5560, 0.75, 0xffffff, 0.75];
      scene.add(new THREE.HemisphereLight(L[0], L[1], L[2]));
      const key = new THREE.DirectionalLight(L[3], L[4]);
      key.position.set(70, 30, 55);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9cc8ff, 0.3);
      rim.position.set(-60, 40, -50);
      scene.add(rim);
      model = AircraftModels.build(ac, { airline: hero.airline });
      AircraftModels.animate(model, { gear: 0, flaps: 0, propSpeed: 1 });
      // a gentle bank towards the camera, the nose a little up
      model.rotation.set(-0.05, 0, -0.12);
    }
    scene.add(model);

    // the camera ahead of the left wing, a little above (in flight: a little below), the whole
    // aeroplane in view
    const box = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    const cam = new THREE.PerspectiveCamera(hero ? 22 : 24, W / H, 0.5, 4000);
    const dir = (hero ? new THREE.Vector3(0.6, -0.14, 0.78) : new THREE.Vector3(0.78, 0.36, 0.62)).normalize();
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.z) * 0.5;
    let dist = radius / Math.tan(cam.fov * DEG / 2) * (hero ? 0.6 : 0.64);
    const look = new THREE.Vector3(centre.x, centre.y - (hero ? 0 : size.y * 0.08), centre.z);
    cam.position.copy(look).addScaledVector(dir, dist);
    cam.lookAt(look);
    if (hero) {
      // in flight it is seen more from ahead: frame what the camera really sees of the box,
      // centred, filling 94 % of the width or 86 % of the height
      for (let it = 0; it < 3; it++) {
        cam.updateMatrixWorld();
        let x0 = 1, x1 = -1, y0 = 1, y1 = -1;
        for (let i = 0; i < 8; i++) {
          const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(cam);
          x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
        }
        // move the aim to the middle of what shows, then step in or out
        const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
        const halfW = dist * Math.tan(cam.fov * DEG / 2) * cam.aspect, halfH = dist * Math.tan(cam.fov * DEG / 2);
        look.addScaledVector(right, (x0 + x1) / 2 * halfW).addScaledVector(up, (y0 + y1) / 2 * halfH);
        dist *= Math.max((x1 - x0) / 2 / 0.94, (y1 - y0) / 2 / 0.86);
        cam.position.copy(look).addScaledVector(dir, dist);
        cam.lookAt(look);
      }
    }
    this.renderer.render(scene, cam);

    // the model's meshes are not needed again (its livery stays cached for the flights)
    model.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    if (shadow) shadow.geometry.dispose();
    return this.renderer.domElement;
  },

  // a radial blur, dark in the middle and clear at the edge
  shadow() {
    if (this.shadowTex) return this.shadowTex;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.5)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.22)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    this.shadowTex = new THREE.CanvasTexture(c);
    return this.shadowTex;
  }
};
