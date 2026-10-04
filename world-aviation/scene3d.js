'use strict';

// ============================================================
// World Aviation — the 3D world (three.js, WebGL)
//
// One renderer, one scene, one camera:
//   - a sky dome with a vertical gradient and a sun disc
//   - a far terrain mesh over the flight's part of the world
//   - a near terrain mesh that follows the aeroplane and is
//     rebuilt (heights, normals, colours) on the CPU when the
//     aeroplane has moved far enough
//   - a sea plane, airports (runway/taxiway texture + buildings),
//     trees and a cloud layer around the player
// The cockpit itself is drawn in 2D on a canvas over the top.
// ============================================================

const Scene3D = {
  renderer: null, scene: null, camera: null,
  quality: QUALITY.medium,
  sun: null, hemi: null, sky: null,
  farMesh: null, nearMesh: null, water: null,
  clouds: [], cloudGroup: null, cloudTex: null,
  trees: null, treeTex: null,
  airports3D: new Map(),          // id -> {group, tex, canvas}
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
      canvas, antialias: false, powerPreference: 'high-performance', logarithmicDepthBuffer: true
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
    this.buildWater();
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
        uniform vec3 top, mid, bot, ground, sunDir;
        uniform float flash;
        varying vec3 vDir;
        void main() {
          float y = normalize(vDir).y;
          vec3 c;
          if (y > 0.0) {
            c = mix(mix(bot, mid, clamp(y * 4.0, 0.0, 1.0)), top, clamp((y - 0.25) * 1.6, 0.0, 1.0));
          } else {
            c = mix(bot, ground, clamp(-y * 6.0, 0.0, 1.0));
          }
          float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
          c += vec3(1.0, 0.92, 0.75) * pow(s, 220.0) * 1.2;          // the sun disc
          c += vec3(1.0, 0.9, 0.7) * pow(s, 12.0) * 0.16;            // the glow around it
          c += vec3(0.7, 0.75, 0.85) * flash;                        // lightning
          gl_FragColor = vec4(c, 1.0);
        }`
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -1000;
    this.scene.add(this.sky);
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
        const h = Terrain.farHeight(x, z);
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

  // ---------- airports ----------
  // Ground texture (grass, taxiways, apron) on one plane, the runway on its own
  // finely textured plane, boxes for the buildings and parked aeroplanes.
  // Planes are rotated by -heading so canvas "up" points down the runway.
  buildAirport(a) {
    if (this.airports3D.has(a.id)) return this.airports3D.get(a.id);
    const L = LAYOUT;
    const group = new THREE.Group();
    const rotY = -a.hdg;

    // --- the ground plane: t from -half-700 to half+700, across from -500 to TERMINAL+400
    const tMin = -a.half - 700, tMax = a.half + 700;
    const aMin = -500, aMax = L.TERMINAL + 400;
    const A = tMax - tMin, B = aMax - aMin;
    const ch = 2048, cw = Math.round(ch * B / A / 4) * 4;
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d');
    const sx = cw / B, sy = ch / A;
    const P = (t, across) => [(across - aMin) * sx, (tMax - t) * sy];
    g.fillStyle = a.arctic ? '#7d876f' : '#5f6e47';
    g.fillRect(0, 0, cw, ch);
    const rng = makeRng(hashStr(a.id));
    for (let i = 0; i < 2600; i++) {
      const v = rng.range(-18, 18);
      g.fillStyle = 'rgba(' + (95 + v | 0) + ',' + (112 + v | 0) + ',' + (72 + v * 0.5 | 0) + ',0.35)';
      g.fillRect(rng.range(0, cw), rng.range(0, ch), rng.range(2, 9), rng.range(2, 9));
    }
    // a lighter mown strip around the runway
    g.fillStyle = 'rgba(150,170,110,0.22)';
    let p0 = P(a.half + 120, -120), p1 = P(-a.half - 120, 120);
    g.fillRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
    // apron
    const r = a.apronRect;
    p0 = P(r.t1, r.a0); p1 = P(r.t0, r.a1);
    g.fillStyle = '#7b7f83';
    g.fillRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
    // taxiways
    const line = (s, width, style) => {
      const q0 = P(World.local(a, s.x1, s.z1).t, World.local(a, s.x1, s.z1).across);
      const q1 = P(World.local(a, s.x2, s.z2).t, World.local(a, s.x2, s.z2).across);
      g.strokeStyle = style; g.lineWidth = width;
      g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.stroke();
    };
    g.lineCap = 'round';
    for (const s of a.twySegs) line(s, (s.w + 4) * sx, '#6a6e72');
    for (const s of a.twySegs) line(s, 1, 'rgba(236,206,74,0.8)');
    // the holding point: two solid and two dashed yellow lines across the connector
    const hold = a.nodes.hold;
    for (let k = 0; k < 4; k++) {
      const off = -6 + k * 3;
      const q0 = P(hold.t - 14, hold.across + off), q1 = P(hold.t + 14, hold.across + off);
      g.strokeStyle = 'rgba(244,214,70,1)'; g.lineWidth = Math.max(1.5, 0.6 * sx);
      g.setLineDash(k < 2 ? [] : [4, 3]);
      g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.stroke();
    }
    g.setLineDash([]);
    // gate stands: a lead-in line and a stop bar
    for (const gate of a.gates) {
      const q0 = P(gate.t, L.APRON_LANE), q1 = P(gate.t, L.STAND + 10);
      g.strokeStyle = 'rgba(244,214,70,0.8)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.stroke();
      const b0 = P(gate.t - 8, L.STAND + 4), b1 = P(gate.t + 8, L.STAND + 4);
      g.lineWidth = Math.max(2, 1.2 * sx);
      g.beginPath(); g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.font = 'bold ' + Math.round(9 * sx) + 'px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const n = P(gate.t, L.STAND - 18);
      g.fillText(String(gate.number), n[0], n[1]);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = this.maxAniso;
    const geo = new THREE.PlaneGeometry(B, A);
    geo.rotateX(-Math.PI / 2);
    geo.rotateY(rotY);
    const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex }));
    const c = World.at(a, (tMin + tMax) / 2, (aMin + aMax) / 2);
    ground.position.set(c.x, a.elev + 0.05, c.z);
    group.add(ground);

    // --- the runway
    const rtex = makeRunwayTexture(a, this.maxAniso);
    const rgeo = new THREE.PlaneGeometry(RWY_HALF_WIDTH * 2 + 8, a.rwyLen + 60);
    rgeo.rotateX(-Math.PI / 2);
    rgeo.rotateY(rotY);
    const runway = new THREE.Mesh(rgeo, new THREE.MeshLambertMaterial({ map: rtex }));
    runway.position.set(a.x, a.elev + 0.12, a.z);
    group.add(runway);

    // --- buildings
    for (const b of a.buildings) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.acrossSize, b.h, b.along),
        new THREE.MeshLambertMaterial({ color: buildingColor(b.kind) }));
      mesh.position.set(b.x, a.elev + b.h / 2, b.z);
      mesh.rotation.y = rotY;
      group.add(mesh);
      if (b.kind === 'tower') {
        const cab = new THREE.Mesh(new THREE.BoxGeometry(20, 7, 20), new THREE.MeshLambertMaterial({ color: 0x2c3a46 }));
        cab.position.set(b.x, a.elev + b.h + 3.5, b.z);
        cab.rotation.y = rotY;
        group.add(cab);
      }
      if (b.kind === 'terminal') {
        const glass = new THREE.Mesh(new THREE.BoxGeometry(1, b.h * 0.45, b.along * 0.96),
          new THREE.MeshLambertMaterial({ color: 0x31475a }));
        const gp = World.at(a, b.t, b.across - b.acrossSize / 2 - 0.3);
        glass.position.set(gp.x, a.elev + b.h * 0.55, gp.z);
        glass.rotation.y = rotY;
        group.add(glass);
      }
    }
    // parked aeroplanes at the gates (hidden where the player parks): the types this airport sees
    const parked = [];
    const kinds = a.terminal === 'big' ? ['A320NEO', 'B738', 'A359', 'NJ320', 'RJ84'] :
      a.terminal === 'medium' ? ['B738', 'A320NEO', 'RJ84', 'VIKNA19'] :
        a.terminal === 'small' ? ['RJ84', 'VIKNA19', 'SKARV27'] : ['VIKNA19', 'FROST12'];
    const pick = hashStr(a.id);
    for (const gate of a.gates) {
      const type = AIRCRAFT.find((x) => x.id === kinds[(pick + gate.index) % kinds.length]);
      const plane = AircraftModels.build(type);
      plane.position.set(gate.standX, a.elev + aircraftDims(type).gearH, gate.standZ);
      plane.rotation.y = Math.PI - gate.parkHdg * DEG;
      group.add(plane);
      parked.push(plane);
    }
    this.scene.add(group);
    const rec = { group, tex, rtex, a, parked };
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
    rec.a.gates.forEach((gate, i) => { rec.parked[i].visible = used.indexOf(gate) < 0; });
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

  update(dt, fl, sys) {
    this.time += dt;
    const st = fl.st, env = fl.env;
    const ax = st.axes || fl.updateAxes();
    const off = this.camMode === 'cockpit' ? VIEW.COCKPIT_EYE : this.camMode === 'chase' ? VIEW.CHASE_OFFSET : VIEW.WING_OFFSET;
    const k = this.camMode === 'cockpit' ? fl.dims.len / 18 : fl.dims.span / 16;
    const ex = off.x * k, ey = off.y * k, ez = off.z * k;
    const eye = new THREE.Vector3(
      st.pos.x + ax.right.x * ex + ax.up.x * ey + ax.nose.x * ez,
      st.pos.y + ax.right.y * ex + ax.up.y * ey + ax.nose.y * ez,
      st.pos.z + ax.right.z * ex + ax.up.z * ey + ax.nose.z * ez);
    // never below the ground
    const gEye = Terrain.heightAt(eye.x, eye.z) + 1;
    if (eye.y < gEye) eye.y = gEye;
    this.camera.position.copy(eye);
    this.camera.up.set(ax.up.x, ax.up.y, ax.up.z);
    const look = this.camMode === 'cockpit'
      ? new THREE.Vector3(eye.x + ax.nose.x - ax.up.x * 0.06, eye.y + ax.nose.y - ax.up.y * 0.06, eye.z + ax.nose.z - ax.up.z * 0.06)
      : new THREE.Vector3(st.pos.x + ax.nose.x * 4, st.pos.y + ax.nose.y * 4, st.pos.z + ax.nose.z * 4);
    this.camera.lookAt(look);
    this.aircraftY = st.pos.y;
    this.lastGround = fl.groundHeight();

    // ---- sun and sky
    const sunAz = env.sunAz !== undefined ? env.sunAz : 200 * DEG;
    const sunEl = (env.sunEl !== undefined ? env.sunEl : 0.38);
    const sd = new THREE.Vector3(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), Math.cos(sunAz) * Math.cos(sunEl));
    this.sun.position.copy(eye).addScaledVector(sd, 50000);
    this.sun.target.position.copy(eye);
    this.sky.material.uniforms.sunDir.value.copy(sd);
    this.sky.position.copy(this.camera.position);      // the dome travels with the eye
    this.sky.scale.setScalar(300000);

    // ---- fog and light from the weather
    const vis = clamp(env.vis, 400, this.quality.drawFar);
    const fogCol = new THREE.Color(env.night ? 0x1a2436 : 0xc3d6e6);
    if (env.sunset) fogCol.setHex(0xd9b48c);
    this.scene.fog.color.copy(fogCol);
    this.scene.fog.density = 2.6 / vis;
    this.sky.material.uniforms.bot.value.copy(fogCol);
    this.sky.material.uniforms.ground.value.setHex(env.snowy ? 0xd8dee2 : 0x93a49a);
    this.sky.material.uniforms.flash.value = this.lightning;
    if (this.lightning > 0) this.lightning = Math.max(0, this.lightning - dt * 3);
    const dim = clamp(1 - fl.st.pos.y / 20000, 0.55, 1);
    this.sun.intensity = (env.night ? 0.25 : 1.15) * dim;
    this.hemi.intensity = (env.night ? 0.5 : 0.95) * dim;
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
    // ---- own aircraft for the chase and wing views
    if (!this.ownAircraft || this.ownAircraftId !== fl.ac.id) {
      if (this.ownAircraft) this.scene.remove(this.ownAircraft);
      this.ownAircraft = AircraftModels.build(fl.ac);
      this.ownAircraftId = fl.ac.id;
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
      AircraftModels.animate(this.ownAircraft, { gear: st.gear, propSpeed: n1 * 0.9 });
    }
  },

  dropAirport(id) {
    const rec = this.airports3D.get(id);
    if (!rec) return;
    this.scene.remove(rec.group);
    rec.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    if (rec.tex) rec.tex.dispose();
    if (rec.rtex) rec.rtex.dispose();
    this.airports3D.delete(id);
  },

  render() {
    this.renderer.render(this.scene, this.camera);
  },

  flash() { this.lightning = 1; }
};

function buildingColor(kind) {
  switch (kind) {
    case 'terminal': return 0xb9bfc4;
    case 'tower': return 0xd8d8d2;
    case 'hangar': return 0x8f979c;
    case 'fuel': return 0xc8c9bd;
    default: return 0xa8a49a;
  }
}

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

// The runway surface: 128 px across, 4096 px along. Canvas top is the far end.
function makeRunwayTexture(a, aniso) {
  const W = RWY_HALF_WIDTH * 2 + 8, Lm = a.rwyLen + 60;
  const cw = 128, ch = 4096;
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  const sx = cw / W, sy = ch / Lm;
  const X = (across) => (across + W / 2) * sx;
  const Y = (t) => (Lm / 2 - t) * sy;                 // t from the runway middle
  const rect = (t0, t1, a0, a1) => g.fillRect(X(a0), Y(t1), (a1 - a0) * sx, (t1 - t0) * sy);
  g.fillStyle = '#4b4e52';
  g.fillRect(0, 0, cw, ch);
  const rng = makeRng(hashStr(a.id + 'rwy'));
  for (let i = 0; i < 5000; i++) {
    const v = rng.range(-14, 14) | 0;
    g.fillStyle = 'rgba(' + (75 + v) + ',' + (78 + v) + ',' + (82 + v) + ',0.5)';
    g.fillRect(rng.range(0, cw), rng.range(0, ch), rng.range(1, 3), rng.range(1, 6));
  }
  // rubber deposits in the touchdown zone
  g.fillStyle = 'rgba(28,28,30,0.35)';
  rect(-a.half + 200, -a.half + 700, -6, 6);
  const h = a.half;
  g.fillStyle = '#e9e9e6';
  // edge lines
  rect(-h, h, -RWY_HALF_WIDTH + 0.5, -RWY_HALF_WIDTH + 1.4);
  rect(-h, h, RWY_HALF_WIDTH - 1.4, RWY_HALF_WIDTH - 0.5);
  // centreline
  for (let t = -h + 120; t < h - 120; t += 50) rect(t, t + 30, -0.45, 0.45);
  // threshold piano keys and the designators at both ends
  for (const end of [-1, 1]) {
    const t0 = end * (h - 6);
    for (let i = 0; i < 8; i++) {
      const acr = 3 + i * 2.4;
      for (const side of [-1, 1]) {
        if (end < 0) rect(t0, t0 + 30, side * acr - 0.9, side * acr + 0.9);
        else rect(t0 - 30, t0, side * acr - 0.9, side * acr + 0.9);
      }
    }
    // touchdown zone bars and the aiming point
    for (const d of [150, 300, 450, 600]) {
      const t = end < 0 ? -h + d : h - d - 22;
      const big = d === 300;
      for (const side of [-1, 1]) {
        if (big) rect(t, t + 45, side * 6, side * 15);
        else rect(t, t + 22, side * 4, side * 5.8), rect(t, t + 22, side * 7.6, side * 9.4);
      }
    }
    const label = end < 0 ? a.rwyName : a.rwyOpposite;
    const tt = end < 0 ? -h + 48 : h - 48;
    g.save();
    g.translate(X(0), Y(tt));
    if (end > 0) g.rotate(Math.PI);
    g.scale(1, sy / sx * 2.6);                        // the digits are 2.6x longer than they are wide
    g.font = 'bold ' + Math.round(11 * sx) + 'px Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, 0, 0);
    g.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = aniso || 4;
  return tex;
}
