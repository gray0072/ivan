'use strict';

// ============================================================
// World Aviation — the hangar's aircraft pictures: each type's own
// 3D model (models.js) in its house colours, gear down, seen from
// ahead and a little above with a soft shadow under it, rendered
// once into a transparent image by a small off-screen renderer.
// Used by the hangar cards (ui/ui.js): AircraftPreview.fill(root)
// puts the pictures into every img[data-ac] inside root, drawing the
// missing ones one per frame so the screen never stalls, and frees
// the renderer when the queue is empty.
// ============================================================

const AircraftPreview = {
  W: 720, H: 360,            // picture size, pixels (cards show it at about half that)
  urls: new Map(),           // aircraft id -> object URL of the finished picture
  queue: [],                 // aircraft ids still to draw
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
    if (!this.busy && this.queue.length) { this.busy = true; requestAnimationFrame(() => this.next()); }
  },
  show(img, url) {
    img.src = url;
    const pic = img.closest('.acPic');
    if (pic) pic.classList.remove('loading');
  },

  next() {
    const id = this.queue.shift();
    const ac = AIRCRAFT.find((a) => a.id === id);
    if (ac) {
      let canvas = null;
      try { canvas = this.draw(ac); } catch (err) { canvas = null; }
      if (canvas) {
        const done = (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          this.urls.set(id, url);
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

  // one picture: the model on a transparent background, framed to fill the width
  draw(ac) {
    if (!this.renderer) {
      const canvas = document.createElement('canvas');
      canvas.width = this.W; canvas.height = this.H;
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(this.W, this.H, false);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.setClearColor(0x000000, 0);
    }
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xeef6ff, 0x4a5560, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 0.75);
    key.position.set(40, 70, 60);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9cc8ff, 0.25);
    rim.position.set(-60, 20, -40);
    scene.add(rim);

    const model = AircraftModels.build(ac);
    AircraftModels.animate(model, { gear: 1, flaps: 0, propSpeed: 0 });
    scene.add(model);
    const d = aircraftDims(ac);
    // a soft shadow on the ground under it
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: this.shadow(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(d.span * 1.05, d.len * 1.05, 1);
    shadow.position.y = -d.gearH + 0.02;
    scene.add(shadow);

    // the camera ahead of the left wing and a little above, the whole aeroplane in view
    const box = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    const cam = new THREE.PerspectiveCamera(24, this.W / this.H, 0.5, 4000);
    const dir = new THREE.Vector3(0.78, 0.36, 0.62).normalize();
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.z) * 0.5;
    const dist = radius / Math.tan(cam.fov * DEG / 2) * 0.64;
    cam.position.copy(centre).addScaledVector(dir, dist);
    cam.lookAt(centre.x, centre.y - size.y * 0.08, centre.z);
    this.renderer.render(scene, cam);

    // the model's meshes are not needed again (its livery stays cached for the flights)
    model.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    shadow.geometry.dispose();
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
