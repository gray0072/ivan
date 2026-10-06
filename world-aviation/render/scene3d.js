'use strict';

// ============================================================
// World Aviation — the 3D world (three.js, WebGL)
//
// One renderer, one scene, one camera:
//   - a sky dome with a vertical gradient, the sun, the moon and
//     the stars, following the time of day (the flight's clock)
//   - a far terrain mesh over the flight's part of the world
//   - a near terrain mesh that follows the aeroplane and is
//     rebuilt (heights, normals, colours) on the CPU when the
//     aeroplane has moved far enough
//   - a sea plane, airports (airport3d.js), trees and a cloud
//     layer around the player
//   - the light of the hour: sunlight or moonlight, the sky's glow,
//     dusk colours; at night the aircraft lights and the pool of the
//     landing lights on the ground ahead
//   - the pushback tug at the nose during the push back
// The cockpit itself is drawn in 2D on a canvas over the top.
// ============================================================

const Scene3D = {
  renderer: null, scene: null, camera: null,
  quality: QUALITY.medium,
  sun: null, hemi: null, sky: null,
  farMesh: null, nearMesh: null, water: null,
  clouds: [], cloudGroup: null, cloudTex: null,
  trees: null, treeTex: null,
  airports3D: new Map(),          // id -> the airport's 3D record (Airport3D.build)
  ownAircraft: null,
  w: 0, h: 0, dpr: 1,
  camMode: 'cockpit',
  texCanvas: null, texCtx: null,
  time: 0,
  inCloud: 0,
  lightning: 0,

  init(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      // multisampling on desktops keeps thin things (window mullions, ground markings) from
      // shimmering as you taxi past; phones keep the fill rate for the frame rate
      canvas, antialias: !isCoarsePointer(), powerPreference: 'high-performance', logarithmicDepthBuffer: true
    });
    this.maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.renderer.setPixelRatio(1);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(VIEW.FOV_DEG, 16 / 9, VIEW.NEAR_CLIP, 400000);
    this.scene.fog = new THREE.FogExp2(0xc3d6e6, 1 / 60000);

    this.hemi = new THREE.HemisphereLight(0xdceaf6, 0x4d5b46, 0.95);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff4dd, 1.15);
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.buildSky();
    this.buildStars();
    this.buildWater();
    // the landing lights' pool on the ground ahead, at night
    this.landingPool = new THREE.Mesh(
      (() => { const g = new THREE.PlaneGeometry(1, 1, 4, 4); g.rotateX(-Math.PI / 2); return g; })(),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(glowCanvas()), color: 0xfff1d6, transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6
      }));
    this.landingPool.visible = false;
    this.scene.add(this.landingPool);
    // the pushback tug, at the nose while the tug pushes
    this.tug = Apron3D.makeTug();
    this.tug.visible = false;
    this.scene.add(this.tug);
    this.treeTex = makeTreeTexture();
    this.cloudTex = makeCloudTexture();
  },

  // ---------- sky ----------
  buildSky() {
    const geo = new THREE.SphereGeometry(1, 24, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        top: { value: new THREE.Color(0x2b6fb5) },
        mid: { value: new THREE.Color(0x8fb9dd) },
        bot: { value: new THREE.Color(0xc3d6e6) },
        ground: { value: new THREE.Color(0x93a49a) },
        sunDir: { value: new THREE.Vector3(0.4, 0.35, -0.85).normalize() },
        moonDir: { value: new THREE.Vector3(0, 1, 0) },
        moonAmt: { value: 0 },
        glow: { value: new THREE.Color(0xf0a060) },
        warm: { value: 0 },
        flash: { value: 0 }
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: `
        uniform vec3 top, mid, bot, ground, sunDir, moonDir, glow;
        uniform float flash, moonAmt, warm;
        varying vec3 vDir;
        void main() {
          float y = normalize(vDir).y;
          vec3 c;
          if (y > 0.0) {
            c = mix(mix(bot, mid, clamp(y * 4.0, 0.0, 1.0)), top, clamp((y - 0.25) * 1.6, 0.0, 1.0));
          } else {
            c = mix(bot, ground, clamp(-y * 6.0, 0.0, 1.0));
          }
          vec3 d = normalize(vDir);
          float s = max(dot(d, normalize(sunDir)), 0.0);
          float up = smoothstep(-0.02, 0.01, y);                    // nothing of the sky shows below the horizon
          float sunUp = smoothstep(-0.06, 0.0, sunDir.y);
          c += vec3(1.0, 0.92, 0.75) * pow(s, 220.0) * 1.2 * up * sunUp;   // the sun disc
          c += vec3(1.0, 0.9, 0.7) * pow(s, 12.0) * 0.16 * sunUp;          // the glow around it
          // dusk and dawn: the horizon glows on the sun's side
          vec2 hs = normalize(sunDir.xz + vec2(1e-5));
          float side = max(dot(normalize(d.xz + vec2(1e-5)), hs), 0.0);
          c += glow * warm * pow(side, 3.0) * (1.0 - smoothstep(0.0, 0.35, abs(y))) * 0.75;
          // the moon: a disc and a soft halo
          float m = dot(d, normalize(moonDir));
          c += vec3(0.92, 0.94, 1.0) * smoothstep(0.99986, 0.99992, m) * moonAmt * up;
          c += vec3(0.5, 0.6, 0.8) * pow(max(m, 0.0), 300.0) * 0.2 * moonAmt;
          c += vec3(0.7, 0.75, 0.85) * flash;                        // lightning
          gl_FragColor = vec4(c, 1.0);
        }`
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -1000;
    this.scene.add(this.sky);
  },

  // the stars: points on the upper half of the dome, fading in as it gets dark
  buildStars() {
    const n = 1400, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const rng = makeRng(424242);
    for (let i = 0; i < n; i++) {
      const y = rng.range(0.02, 1), a = rng.range(0, TAU), r = Math.sqrt(1 - y * y);
      pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
      const b = 0.35 + Math.pow(rng.next(), 3) * 0.65, tint = rng.range(-0.08, 0.08);
      col.set([b * (1 + tint), b, b * (1 - tint)], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.stars = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 1.8, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false
    }));
    this.stars.frustumCulled = false;
    this.stars.renderOrder = -999;
    this.scene.add(this.stars);
  },

  buildWater() {
    const geo = new THREE.PlaneGeometry(1600000, 1600000, 4, 4);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x2c4f66, shininess: 90, specular: 0x9fc8de, transparent: true, opacity: 0.92
    });
    this.water = new THREE.Mesh(geo, mat);
    this.water.position.y = WORLD.SEA_LEVEL - 0.5;
    this.water.renderOrder = 1;
    this.scene.add(this.water);
  },

  // ---------- terrain meshes ----------
  buildFarTerrain() {
    const tg = Terrain.g;
    if (!tg) return;
    const cell = Math.max(this.quality.farCell, tg.cell * 0.75);
    const x0 = tg.x0, x1 = tg.x0 + (tg.w - 1) * tg.cell;
    const z0 = tg.z0, z1 = tg.z0 + (tg.h - 1) * tg.cell;
    const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell);
    const vw = nx + 1, vh = nz + 1;
    const pos = new Float32Array(vw * vh * 3);
    const col = new Float32Array(vw * vh * 3);
    const nor = new Float32Array(vw * vh * 3);
    const heights = new Float32Array(vw * vh);
    const c = [0, 0, 0];
    for (let j = 0; j < vh; j++) {
      for (let i = 0; i < vw; i++) {
        const k = j * vw + i;
        const x = x0 + i * cell, z = z0 + j * cell;
        const h = Terrain.farVertexHeight(x, z, cell);
        heights[k] = h;
        pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      }
    }
    // normals from the grid, colours from the biome rules
    for (let j = 0; j < vh; j++) {
      for (let i = 0; i < vw; i++) {
        const k = j * vw + i;
        const hl = heights[j * vw + Math.max(0, i - 1)], hr = heights[j * vw + Math.min(vw - 1, i + 1)];
        const hd = heights[Math.max(0, j - 1) * vw + i], hu = heights[Math.min(vh - 1, j + 1) * vw + i];
        const nx = (hl - hr), ny = 2 * cell, nz = (hd - hu);
        const l = Math.hypot(nx, ny, nz) || 1;
        nor[k * 3] = nx / l; nor[k * 3 + 1] = ny / l; nor[k * 3 + 2] = nz / l;
        const slope = 1 - ny / l;
        Terrain.colorAt(pos[k * 3], pos[k * 3 + 2], heights[k], slope, c);
        col[k * 3] = c[0] / 255; col[k * 3 + 1] = c[1] / 255; col[k * 3 + 2] = c[2] / 255;
      }
    }
    const idx = new Uint32Array(nx * nz * 6);
    let p = 0;
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const a = j * vw + i, b = a + 1, cI = a + vw, d = cI + 1;
        idx[p++] = a; idx[p++] = cI; idx[p++] = b;
        idx[p++] = b; idx[p++] = cI; idx[p++] = d;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    if (this.farMesh) { this.scene.remove(this.farMesh); this.farMesh.geometry.dispose(); }
    this.farMesh = new THREE.Mesh(geo, mat);
    this.farMesh.renderOrder = 0;
    this.scene.add(this.farMesh);
  },

  buildNearTerrain() {
    const n = this.quality.nearCells;
    const geo = new THREE.PlaneGeometry(1, 1, n, n);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    if (!this.nearMesh || this.nearN !== n) {
      if (this.nearMesh) { this.scene.remove(this.nearMesh); this.nearMesh.geometry.dispose(); }
      this.nearMesh = new THREE.Mesh(geo, mat);
      this.nearMesh.frustumCulled = false;
      this.nearMesh.renderOrder = 2;
      this.scene.add(this.nearMesh);
      this.nearPos = geo.attributes.position.array;
      this.nearNor = geo.attributes.normal.array;
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array((n + 1) * (n + 1) * 3), 3));
      this.nearCol = geo.attributes.color.array;
      this.nearN = n;
      this.nearHs = new Float32Array((n + 1) * (n + 1));
      this.nearBuild = null;
    }
  },

  // The near mesh follows the aeroplane. Cell size grows with height so the mesh
  // always covers roughly 4-30 km; rows are rebuilt a few per frame so there is
  // never a visible hitch.
  startNearBuild(cx, cz, cell) {
    const n = this.nearN, w = n + 1;
    const half = (n * cell) / 2;
    this.nearBuild = {
      cx: Math.round((cx - half) / cell) * cell + half,
      cz: Math.round((cz - half) / cell) * cell + half,
      cell, row: 0, rows: w, half
    };
  },

  updateNearTerrain(px, pz, altAgl, force) {
    this.buildNearTerrain();
    const b = this.nearBuild;
    const cellNow = clamp(this.quality.nearCell + (altAgl || 0) * 0.04, this.quality.nearCell, 420);
    if (force || !b) {
      this.startNearBuild(px, pz, cellNow);
    } else {
      const moved = Math.hypot(px - b.cx, pz - b.cz);
      if (moved > b.cell * 2.5 || Math.abs(cellNow - b.cell) > b.cell * 0.6) {
        this.startNearBuild(px, pz, cellNow);
      }
    }
    const bld = this.nearBuild;
    if (!bld) return;
    const w = bld.rows, cell = bld.cell;
    const x0 = bld.cx - bld.half, z0 = bld.cz - bld.half;
    const hs = this.nearHs, pos = this.nearPos, nor = this.nearNor, col = this.nearCol;
    const taper = { cx: bld.cx, cz: bld.cz, half: bld.half };   // fade into the far mesh at the edge
    const budget = Math.ceil(w / 4);
    const c = [0, 0, 0];
    let done = 0;
    while (bld.row < w && done < budget) {
      const j = bld.row;
      for (let i = 0; i < w; i++) hs[j * w + i] = Terrain.heightAt(x0 + i * cell, z0 + j * cell, taper);
      bld.row++;
      done++;
    }
    // write the rows that are ready, plus their neighbours for the normals
    const jStart = Math.max(0, bld.row - budget - 1), jEnd = Math.min(w - 1, bld.row);
    for (let j = jStart; j <= jEnd; j++) {
      for (let i = 0; i < w; i++) {
        const k = j * w + i;
        pos[k * 3] = x0 + i * cell; pos[k * 3 + 1] = hs[k]; pos[k * 3 + 2] = z0 + j * cell;
        const hl = hs[j * w + Math.max(0, i - 1)], hr = hs[j * w + Math.min(w - 1, i + 1)];
        const hd = hs[Math.max(0, j - 1) * w + i], hu = hs[Math.min(w - 1, j + 1) * w + i];
        const nx = hl - hr, ny = 2 * cell, nz = hd - hu;
        const l = Math.hypot(nx, ny, nz) || 1;
        nor[k * 3] = nx / l; nor[k * 3 + 1] = ny / l; nor[k * 3 + 2] = nz / l;
        const slope = 1 - ny / l;
        Terrain.colorAt(pos[k * 3], pos[k * 3 + 2], hs[k], slope, c);
        col[k * 3] = c[0] / 255; col[k * 3 + 1] = c[1] / 255; col[k * 3 + 2] = c[2] / 255;
      }
    }
    const g = this.nearMesh.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
    if (bld.row >= w) {
      g.computeBoundingSphere();
      bld.done = true;
    }
  },

  // a new flight's world: new far terrain, no old airports, a fresh near mesh
  setTheatre() {
    this.buildFarTerrain();
    GroundLights.build(this.scene, this.quality);
    for (const id of Array.from(this.airports3D.keys())) this.dropAirport(id);
    this.nearBuild = null;
    this.treeKey = null;
  },

  // build the whole near mesh at once (start of a flight, a teleport)
  warmup(fl) {
    const st = fl.st;
    this.updateNearTerrain(st.pos.x, st.pos.z, Math.max(0, fl.altAgl()), true);
    let guard = 0;
    while (this.nearBuild && !this.nearBuild.done && guard++ < 12) this.updateNearTerrain(st.pos.x, st.pos.z, Math.max(0, fl.altAgl()), false);
    this.treeKey = null;
  },

  // ---------- airports (airport3d.js) ----------
  buildAirport(a) {
    if (this.airports3D.has(a.id)) return this.airports3D.get(a.id);
    const rec = Airport3D.build(a, {
      aniso: this.maxAniso, maxTex: this.renderer.capabilities.maxTextureSize, hi: this.qualityName !== 'low'
    });
    this.scene.add(rec.group);
    this.airports3D.set(a.id, rec);
    this.applyGates(rec);
    return rec;
  },

  // hide the parked aeroplanes at the stands the player uses this flight
  setFlightGates(gates) {
    this.flightGates = gates || [];
    for (const rec of this.airports3D.values()) this.applyGates(rec);
  },
  applyGates(rec) {
    const used = this.flightGates || [];
    rec.a.gates.forEach((gate, i) => {
      const inUse = used.indexOf(gate) >= 0;
      rec.parked[i].visible = !inUse;
      Apron3D.setGate(rec, i, inUse);            // no vehicles there, the bridge retracted
    });
  },

  // ---------- clouds and trees ----------
  buildClouds() {
    if (this.cloudGroup) this.scene.remove(this.cloudGroup);
    this.cloudGroup = new THREE.Group();
    const n = this.quality.clouds;
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.cloudTex, transparent: true, depthWrite: false, opacity: 0.85, fog: true
      }));
      s.userData = { r: 900 + rand.range(0, 2600), base: rand.range(0, 1), h: rand.range(0.25, 1) };
      this.cloudGroup.add(s);
    }
    this.scene.add(this.cloudGroup);
    this.clouds = this.cloudGroup.children;
  },

  updateClouds(px, pz, cloudBase, cloudTop, windX, windZ) {
    if (!this.clouds || this.clouds.length !== this.quality.clouds) this.buildClouds();
    const span = 130000;
    this.inCloud = 0;
    for (let i = 0; i < this.clouds.length; i++) {
      const s = this.clouds[i];
      const d = s.userData;
      // a stable pseudo-random grid position that wraps around the player
      const gx = ((i * 7919) % 1000) / 1000, gz = ((i * 6151) % 997) / 997;
      let x = gx * span + windX * this.time * 0.00035;
      let z = gz * span + windZ * this.time * 0.00035;
      x = ((x - px + span / 2) % span + span) % span - span / 2 + px;
      z = ((z - pz + span / 2) % span + span) % span - span / 2 + pz;
      const y = lerp(cloudBase, Math.max(cloudBase + 200, cloudTop), d.base) + d.h * 400;
      s.position.set(x, y, z);
      const dd = Math.hypot(x - px, z - pz);
      s.scale.set(d.r * 2.1, d.r * 1.25, 1);
      if (dd < d.r * 0.62 && this.aircraftY !== undefined && this.aircraftY > y - 500 && this.aircraftY < y + 500) {
        this.inCloud = Math.max(this.inCloud, 1 - dd / (d.r * 0.62));
      }
    }
  },

  buildTrees() {
    const n = this.quality.trees;
    if (this.trees) { this.scene.remove(this.trees); this.trees.geometry.dispose(); this.trees = null; }
    if (!n) return;
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);
    const cross = new THREE.BufferGeometry();
    const pos = new Float32Array([-.5, 0, 0, .5, 0, 0, .5, 1, 0, -.5, 0, 0, .5, 1, 0, -.5, 1, 0]);
    cross.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    cross.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ map: this.treeTex, alphaTest: 0.4, side: THREE.DoubleSide });
    this.trees = new THREE.InstancedMesh(cross, mat, n);
    this.trees.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.trees.frustumCulled = false;
    this.trees.visible = false;
    this.scene.add(this.trees);
  },

  updateTrees(px, pz, key) {
    if (!this.trees) return;
    if (this.treeKey === key) return;
    this.treeKey = key;
    const n = this.quality.trees;
    const m = new THREE.Matrix4();
    const rng = makeRng(Math.round(px / 1000) * 7919 + Math.round(pz / 1000) * 104729);
    const radius = 4200;
    let placed = 0;
    for (let i = 0; i < n * 2 && placed < n; i++) {
      const a = rng.next() * TAU, r = Math.sqrt(rng.next()) * radius;
      const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
      const h = Terrain.heightAt(x, z);
      if (h < 6 || h > 900) continue;
      // trees follow the forest colour: lower, flatter land
      if (rng.next() > clamp(1 - (h - 250) / 700, 0.05, 1) * 0.9) continue;
      const s = 6 + rng.next() * 9;
      m.makeScale(s, s * (0.8 + rng.next() * 0.7), s);
      m.setPosition(x, h, z);
      this.trees.setMatrixAt(placed, m);
      placed++;
    }
    for (let i = placed; i < n; i++) { m.makeScale(0, 0, 0); this.trees.setMatrixAt(i, m); }
    this.trees.count = n;
    this.trees.instanceMatrix.needsUpdate = true;
    this.trees.visible = placed > 0;
  },

  // ---------- per frame ----------
  setQuality(name) {
    const q = QUALITY[name] || QUALITY.medium;
    if (this.qualityName === name) return;
    this.qualityName = name;
    this.quality = q;
    this.resize();
    this.buildFarTerrain();
    GroundLights.build(this.scene, this.quality);
    this.buildNearTerrain();
    this.buildTrees();
    this.buildClouds();
    for (const id of Array.from(this.airports3D.keys())) this.dropAirport(id);
  },

  resize() {
    const q = this.quality;
    const cw = window.innerWidth, ch = window.innerHeight;
    let w = cw, h = ch;
    const scale = Math.min(1, q.maxCanvas / Math.max(cw, ch));
    w = Math.round(cw * scale); h = Math.round(ch * scale);
    this.dpr = Math.min(window.devicePixelRatio || 1, q.pixelRatio);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, true);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.camera.aspect = cw / ch;
    this.camera.updateProjectionMatrix();
    this.w = w; this.h = h;
  },

  // ---------- the camera (VIEW.MODES) ----------
  // Most views ride with the aeroplane, in its own axes (x right, y up, z forward) scaled to
  // its size; the top-down view keeps the nose up, and the tower view stands on the
  // nearest tower (or, en route, beside the flight path for a fly-by) and zooms in on the aeroplane.
  placeCamera(fl, ax) {
    const st = fl.st, d = fl.dims;
    const L = d.len, S = d.span, R = d.fus / 2;
    const P = (x, y, z) => new THREE.Vector3(
      st.pos.x + ax.right.x * x + ax.up.x * y + ax.nose.x * z,
      st.pos.y + ax.right.y * x + ax.up.y * y + ax.nose.y * z,
      st.pos.z + ax.right.z * x + ax.up.z * y + ax.nose.z * z);
    const pos = new THREE.Vector3(st.pos.x, st.pos.y, st.pos.z);
    let eye, look, up = new THREE.Vector3(ax.up.x, ax.up.y, ax.up.z), fov = VIEW.FOV_DEG, minAgl = 1;
    switch (this.camMode) {
      case 'chase': eye = P(0, S * 0.5, -S * 1.62); look = P(0, 0, 4); break;
      case 'front': eye = P(0, L * 0.42, L * 0.9); look = P(0, 0, -L * 0.1); break;
      case 'wing': eye = P(-S * 0.69, S * 0.15, -S * 0.19); look = P(0, 0, 4); break;
      case 'tail': eye = P(0, R * 2.9 + L * 0.06 + 1.5, -L * 0.44); look = P(0, -R * 2, L * 1.4); fov = 75; break;
      case 'gear': eye = P(R * 0.4, -(R + (d.gearH - R) * 0.5), L * 0.3); look = P(0, -d.gearH * 0.85, -L * 0.2); fov = 80; minAgl = 0.3; break;
      case 'top': {
        eye = pos.clone(); eye.y += S * 3.4 + 15;
        look = pos;
        up = new THREE.Vector3(ax.nose.x, 0, ax.nose.z);
        if (up.lengthSq() < 1e-6) up.set(0, 0, -1);
        up.normalize();
        fov = 60;
        break;
      }
      case 'tower': {
        let best = null, bd = 14000;
        for (const a of World.airports) {
          const dd = Math.hypot(a.x - st.pos.x, a.z - st.pos.z);
          if (dd < bd) { bd = dd; best = a; }
        }
        const tw = best && best.buildings.find((b) => b.kind === 'tower');
        if (tw) {
          eye = new THREE.Vector3(tw.x, best.elev + tw.h + 40, tw.z);          // above the cab, the flag and the roof
          this.flyby = null;
        } else {
          // a fly-by: wait beside the flight path ahead, then move on once the aeroplane has passed
          const v = new THREE.Vector3(st.vel.x, 0, st.vel.z);
          const fb = this.flyby;
          const passed = fb && (fb.clone().sub(pos).dot(v) < 0) && fb.distanceTo(pos) > S * 12 + 300;
          if (!fb || passed || fb.distanceTo(pos) > 6000) {
            const ahead = v.lengthSq() > 25 ? v.clone().multiplyScalar(7) : new THREE.Vector3(ax.nose.x, 0, ax.nose.z).multiplyScalar(80);
            const side = new THREE.Vector3(ahead.z, 0, -ahead.x).normalize().multiplyScalar(S * 1.6 + 35);
            this.flyby = pos.clone().add(ahead).add(side);
            this.flyby.y += 10;
          }
          eye = this.flyby.clone();
          minAgl = 4;
        }
        look = pos;
        up = new THREE.Vector3(0, 1, 0);
        const dist = Math.max(1, eye.distanceTo(pos));
        fov = clamp(2 * Math.atan(S * 1.3 / dist) / DEG, 5, 60);
        break;
      }
      default: {          // the cockpit
        const k = L / 18, o = VIEW.COCKPIT_EYE;
        eye = P(o.x * k + VIEW.COCKPIT_SEAT_X * d.fus, o.y * k, o.z * k);
        look = new THREE.Vector3(eye.x + ax.nose.x - ax.up.x * 0.06, eye.y + ax.nose.y - ax.up.y * 0.06, eye.z + ax.nose.z - ax.up.z * 0.06);
      }
    }
    // never below the ground
    const gEye = Terrain.surfaceAt(eye.x, eye.z) + minAgl;
    if (eye.y < gEye) eye.y = gEye;
    const cam = this.camera;
    cam.position.copy(eye);
    cam.up.copy(up);
    cam.lookAt(look);
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    // outside, the instrument panel covers the bottom of the screen: aim above the middle
    const shift = this.camMode === 'cockpit' ? 0 : Math.round(this.h * 0.14);
    if (shift !== this.viewShift || this.w + 'x' + this.h !== this.viewW) {
      this.viewShift = shift; this.viewW = this.w + 'x' + this.h;
      if (shift) cam.setViewOffset(this.w, this.h, 0, shift, this.w, this.h); else cam.clearViewOffset();
    }
    return eye;
  },

  update(dt, fl, sys) {
    this.time += dt;
    const st = fl.st, env = fl.env;
    const ax = st.axes || fl.updateAxes();
    const eye = this.placeCamera(fl, ax);
    this.aircraftY = st.pos.y;
    this.lastGround = fl.groundHeight();

    // ---- the hour: the sun, the moon (full, opposite the sun), the stars
    const hour = ((env.hour0 !== undefined ? env.hour0 : 13) + fl.elapsed / 3600) % 24;
    const sun = sunAt(hour);
    const sd = new THREE.Vector3(sun.x, sun.y, sun.z);
    const md = sd.clone().negate();
    const day = smoothstep(-0.12, 0.2, sun.el);                         // how much sunlight
    const dark = 1 - smoothstep(-0.16, 0.03, sun.el);                   // 1 at night: lights on
    const warm = smoothstep(-0.14, 0.0, sun.el) * (1 - smoothstep(0.05, 0.4, sun.el));   // dusk colours
    this.dark = dark;
    GroundLights.update(dark);
    const lit = day > 0.05 ? sd : md;                                   // the light comes from the moon at night
    this.sun.position.copy(eye).addScaledVector(lit, 50000);
    this.sun.target.position.copy(eye);
    const u = this.sky.material.uniforms;
    u.sunDir.value.copy(sd);
    u.moonDir.value.copy(md);
    u.moonAmt.value = dark * smoothstep(-0.02, 0.1, md.y);
    u.warm.value = warm;
    this.sky.position.copy(this.camera.position);      // the dome travels with the eye
    this.sky.scale.setScalar(300000);
    this.stars.position.copy(this.camera.position);
    this.stars.scale.setScalar(290000);
    this.stars.material.opacity = dark * 0.95 * clamp((env.vis - 2000) / 8000, 0, 1);

    // ---- the sky's colours, the fog and the light: day, dusk and night mixed by the hour
    const vis = clamp(env.vis, 400, this.quality.drawFar);
    const mixSky = (dayHex, duskHex, nightHex, out) => {
      out.setHex(nightHex).lerp(SKY_TMP.setHex(dayHex), day);
      return out.lerp(SKY_TMP.setHex(duskHex), warm * 0.75);
    };
    const fogCol = mixSky(0xc3d6e6, 0xe8a777, 0x0e1626, this.scene.fog.color);
    this.scene.fog.density = 2.6 / vis;
    u.bot.value.copy(fogCol);
    mixSky(0x8fb9dd, 0xc98a6e, 0x0a1428, u.mid.value);
    mixSky(0x2b6fb5, 0x34477e, 0x02050d, u.top.value);
    u.ground.value.setHex(env.snowy ? 0xd8dee2 : 0x93a49a).multiplyScalar(0.12 + 0.88 * day);
    u.flash.value = this.lightning;
    if (this.lightning > 0) this.lightning = Math.max(0, this.lightning - dt * 3);
    const dim = clamp(1 - fl.st.pos.y / 20000, 0.55, 1);
    this.sun.color.setHex(0xfff4dd).lerp(SKY_TMP.setHex(0xffa060), warm);
    if (day <= 0.05) this.sun.color.setHex(0x9fb4d8);
    this.sun.intensity = (day > 0.05 ? 1.15 * day : 0.3 * dark) * dim;
    this.hemi.color.setHex(0x30406a).lerp(SKY_TMP.setHex(0xdceaf6), day);
    this.hemi.groundColor.setHex(0x161a1e).lerp(SKY_TMP.setHex(0x4d5b46), day);
    this.hemi.intensity = (0.3 + 0.65 * day) * dim;
    // the clouds take the light of the hour
    if (this.cloudGroup) {
      const cc = SKY_TMP2.setHex(0x3a4250).lerp(SKY_TMP.setHex(0xffffff), day).lerp(SKY_TMP.setHex(0xffc8a0), warm * 0.6);
      for (const c of this.clouds) c.material.color.copy(cc);
    }
    this.water.material.opacity = 0.9;
    this.water.material.color.setHex(env.snowy && st.pos.y < 400 ? 0x8fa4ad : 0x2c4f66);

    // ---- terrain follow
    this.updateNearTerrain(st.pos.x, st.pos.z, Math.max(0, st.pos.y - (this.lastGround || 0)), false);
    // ---- clouds
    const wind = fl.windAt(st.pos.y);
    this.updateClouds(st.pos.x, st.pos.z, env.cloudBase, env.cloudTop, wind.x * 30, wind.z * 30);
    // ---- trees
    if (this.quality.trees) {
      const key = Math.round(st.pos.x / 700) + ',' + Math.round(st.pos.z / 700);
      this.updateTrees(st.pos.x, st.pos.z, key);
    }

    // ---- airports in view
    for (const a of World.airports) {
      const d = Math.hypot(a.x - st.pos.x, a.z - st.pos.z);
      if (d < 46000) {
        if (!this.airports3D.has(a.id)) this.buildAirport(a);
      } else if (d > 90000 && this.airports3D.has(a.id)) this.dropAirport(a.id);
    }
    // flags and windsocks in the surface wind, the PAPI, the approach flasher
    for (const rec of this.airports3D.values()) {
      const d = Math.hypot(rec.a.x - eye.x, rec.a.z - eye.z);
      if (d < 30000) Airport3D.update(rec, this.time, eye, fl.windAt(rec.a.elev + 10), dark, env.vis);
    }
    // ---- own aircraft for the chase and wing views
    const airline = fl.contract && fl.contract.airline && AIRLINE_BY_CODE[fl.contract.airline] ? fl.contract.airline : null;
    const ownKey = fl.ac.id + '|' + airline;
    if (!this.ownAircraft || this.ownAircraftId !== ownKey) {
      if (this.ownAircraft) this.scene.remove(this.ownAircraft);
      this.ownAircraft = AircraftModels.build(fl.ac, { airline });
      this.ownAircraftId = ownKey;
      this.scene.add(this.ownAircraft);
    }
    this.ownAircraft.visible = this.camMode !== 'cockpit';
    if (this.ownAircraft.visible) {
      this.ownAircraft.position.set(st.pos.x, st.pos.y, st.pos.z);
      const m = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(-ax.right.x, -ax.right.y, -ax.right.z),
        new THREE.Vector3(ax.up.x, ax.up.y, ax.up.z),
        new THREE.Vector3(ax.nose.x, ax.nose.y, ax.nose.z));
      this.ownAircraft.quaternion.setFromRotationMatrix(m);
      let n1 = 0;
      if (sys) for (const e of sys.engines) n1 += e.n1 / sys.engines.length;
      AircraftModels.animate(this.ownAircraft, {
        gear: st.gear, propSpeed: n1 * 0.9, flaps: st.flaps / Math.max(1, fl.ac.flaps.length),
        aileron: st.aileron, elevator: st.elevator, rudder: st.rudder, spoiler: st.spoiler ? 1 : 0,
        lights: this.lightsFor(fl, sys), time: this.time, dark
      });
    }
    this.updateLandingPool(fl, sys, ax, dark);
    this.updateTug(fl, ax);
  },

  // the own aircraft's lights, as a crew would have them: the navigation lights and the beacon
  // once the engines run, the strobes on the runway and in the air, the landing lights with the
  // gear down (low down, and on the runway), a taxi light when taxiing
  lightsFor(fl, sys) {
    const st = fl.st, p = fl.phase;
    const running = sys && sys.runningCount() > 0;
    const onRunway = p === 'TAKEOFF' || p === 'ROLLOUT';
    return {
      nav: running || this.dark > 0.3,
      beacon: running,
      strobe: !st.onGround || onRunway,
      landing: st.gear > 0.9 && (onRunway || (!st.onGround && fl.altAgl() < 3000)),
      taxi: st.onGround && running && (p === 'TAXI_OUT' || p === 'HOLD_SHORT' || p === 'EXIT')
    };
  },

  // the landing (or taxi) lights on the ground ahead: a soft pool where their beam meets the
  // ground, seen from the cockpit too; only in the dark
  updateLandingPool(fl, sys, ax, dark) {
    const pool = this.landingPool, st = fl.st;
    const L = this.lightsFor(fl, sys);
    const on = (L.landing || L.taxi) && dark > 0.05;
    if (!on) { pool.visible = false; return; }
    const d = fl.dims;
    // the beam: from under the nose, 7 degrees below the aeroplane's nose
    const dip = (L.landing ? 7 : 12) * DEG;
    const dir = new THREE.Vector3(ax.nose.x * Math.cos(dip) - ax.up.x * Math.sin(dip), ax.nose.y * Math.cos(dip) - ax.up.y * Math.sin(dip),
      ax.nose.z * Math.cos(dip) - ax.up.z * Math.sin(dip));
    const p0 = new THREE.Vector3(st.pos.x + ax.nose.x * d.len * 0.4, st.pos.y - d.fus * 0.5, st.pos.z + ax.nose.z * d.len * 0.4);
    const gy = fl.groundHeight();
    if (dir.y > -0.01) { pool.visible = false; return; }
    const t = (p0.y - gy) / -dir.y;
    const reach = L.landing ? 1400 : 120;
    if (t > reach) { pool.visible = false; return; }
    pool.visible = true;
    const w = clamp(t * 0.32, 10, 260);
    pool.position.set(p0.x + dir.x * t, gy + 0.35, p0.z + dir.z * t);
    pool.rotation.y = Math.atan2(ax.nose.x, ax.nose.z);
    pool.scale.set(w, 1, clamp(w / Math.max(0.12, -dir.y), w, w * 6));
    pool.material.opacity = dark * (L.landing ? 0.65 : 0.5) * (1 - smoothstep(reach * 0.6, reach, t));
  },

  // the pushback tug: at the nose gear from the gate to the end of the push back
  updateTug(fl, ax) {
    const tug = this.tug, st = fl.st, p = fl.phase;
    tug.visible = p === 'GATE' || p === 'PUSHBACK';
    if (!tug.visible) return;
    const d = fl.dims;
    const nx = ax.nose.x, nz = ax.nose.z, l = Math.hypot(nx, nz) || 1;
    const fx = nx / l, fz = nz / l;
    const gx = st.pos.x + fx * d.len * 0.38, gz = st.pos.z + fz * d.len * 0.38;     // the nose gear
    tug.position.set(gx + fx * 6.0, fl.groundHeight(), gz + fz * 6.0);
    tug.rotation.y = Math.atan2(-fx, -fz);                                          // facing the aeroplane
  },

  dropAirport(id) {
    const rec = this.airports3D.get(id);
    if (!rec) return;
    this.scene.remove(rec.group);
    Airport3D.dispose(rec);
    this.airports3D.delete(id);
  },

  render() {
    this.renderer.render(this.scene, this.camera);
  },

  flash() { this.lightning = 1; }
};

const SKY_TMP = new THREE.Color(), SKY_TMP2 = new THREE.Color();

// ---------- procedural textures ----------
function makeTreeTexture() {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, 64, 64);
  g.fillStyle = '#3b3226';
  g.fillRect(30, 44, 4, 20);
  for (let i = 0; i < 5; i++) {
    const y = 8 + i * 9;
    const w = 30 - i * 4;
    g.fillStyle = 'rgb(' + (34 + i * 5) + ',' + (58 + i * 7) + ',' + (32 + i * 4) + ')';
    g.beginPath();
    g.moveTo(32 - w / 2, y + 12);
    g.lineTo(32 + w / 2, y + 12);
    g.lineTo(32, y);
    g.closePath();
    g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.encoding = THREE.sRGBEncoding;
  return t;
}
function makeCloudTexture() {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 128;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, 256, 128);
  for (let i = 0; i < 26; i++) {
    const x = 40 + Math.random() * 176;
    const y = 60 + (Math.random() - 0.5) * 46;
    const r = 22 + Math.random() * 34;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const bright = 244 + Math.random() * 11 | 0;
    grd.addColorStop(0, 'rgba(255,255,255,' + (0.5 + Math.random() * 0.35) + ')');
    grd.addColorStop(0.55, 'rgba(' + bright + ',' + (bright - 4) + ',255,0.30)');
    grd.addColorStop(1, 'rgba(230,240,255,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.encoding = THREE.sRGBEncoding;
  return t;
}
