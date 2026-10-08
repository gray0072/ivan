'use strict';

// ============================================================
// World Aviation — life on the apron (three.js), built in the
// airport's frame like airport3d.js (local x = across, towards the
// terminal; z = -t, along the runway; y = up):
//
//   - the stand numbers: a sharp plate on the lead-in line and a
//     board on the terminal above each stand
//   - at every stand with a parked aeroplane: a jet bridge to its
//     front door (at a small terminal an airstair truck), a GPU, a
//     belt loader with a baggage train, a fuel truck under the wing
//     of a jet, a catering truck, cones at the nose, the wingtips and
//     the tail; at the stands the player uses this flight the bridge
//     is retracted and the stand is empty
//   - floodlight masts on both sides of the apron: their lamps and
//     the pools of light they throw on the apron at night
//   - traffic: baggage trains and a follow-me car on the tail-of-stand
//     road, cars (with their lights at night) on the landside roads
//   - the pushback tug for the player's own departure (Scene3D)
//
// Static parts are merged into one mesh with vertex colours per group
// (kit), so a busy apron costs a handful of draw calls.
// Used by Airport3D.build / update and Scene3D.
// ============================================================

const APRON_FLOOD = 0xffe3b8;      // the colour of the floodlights

// A kit of boxes and cylinders in vertex colours, merged into one mesh. Parts are placed
// in the current frame; push(x, y, z, ry) starts a frame (turned by ry about y) and pop()
// ends it. A vehicle's own frame: forward = +z, wheels on y = 0.
function kit() {
  const parts = [];
  let base = new THREE.Matrix4();
  const stack = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  const add = (geo, x, y, z, color, rx, ry, rz) => {
    e.set(rx || 0, ry || 0, rz || 0);
    q.setFromEuler(e);
    v.set(x, y, z);
    m.compose(v, q, one);
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(base, m));
    parts.push({ g, color });
  };
  const k = {
    box(w, h, d, x, y, z, color, rx, ry, rz) { add(new THREE.BoxGeometry(w, h, d), x, y, z, color, rx, ry, rz); return k; },
    cyl(r1, r2, h, seg, x, y, z, color, rx, ry, rz) { add(new THREE.CylinderGeometry(r1, r2, h, seg || 10), x, y, z, color, rx, ry, rz); return k; },
    // a wheel with its axle across the vehicle (along x)
    wheel(x, z, r) { return k.cyl(r, r, r * 0.7, 10, x, r, z, '#1c1e21', 0, 0, Math.PI / 2); },
    push(x, y, z, ry) {
      stack.push(base);
      base = base.clone().multiply(new THREE.Matrix4().makeRotationY(ry || 0).setPosition(x, y, z));
      return k;
    },
    pop() { base = stack.pop(); return k; },
    count() { return parts.length; },
    mesh(material) {
      let n = 0;
      for (const p of parts) n += p.g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
      const c = new THREE.Color();
      let o = 0;
      for (const p of parts) {
        c.set(p.color).convertSRGBToLinear();
        const pa = p.g.attributes.position.array, na = p.g.attributes.normal.array;
        pos.set(pa, o * 3); nor.set(na, o * 3);
        for (let i = 0; i < p.g.attributes.position.count; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
        o += p.g.attributes.position.count;
        p.g.dispose();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.computeBoundingSphere();
      return new THREE.Mesh(geo, material || new THREE.MeshLambertMaterial({ vertexColors: true }));
    }
  };
  return k;
}

// ---------- the vehicles (forward = +z, on y = 0) ----------
const Vehicles = {
  tug(k, color) {
    k.box(2.7, 1.1, 5.8, 0, 0.95, 0, color || '#e3b51c')
      .box(2.3, 1.0, 1.5, 0, 2.0, -1.7, '#27313b')
      .box(2.5, 0.15, 1.7, 0, 2.55, -1.7, color || '#e3b51c')
      .box(2.8, 0.35, 0.4, 0, 0.6, 2.95, '#33363a');
    for (const x of [-1.2, 1.2]) for (const z of [-1.9, 1.9]) k.wheel(x, z, 0.62);
    return k;
  },
  tractor(k) {
    k.box(1.6, 0.9, 2.6, 0, 0.75, 0, '#e9e9e4').box(1.5, 0.9, 1.1, 0, 1.65, -0.4, '#2e3c49').box(1.6, 0.1, 1.3, 0, 2.15, -0.4, '#e9e9e4');
    for (const x of [-0.75, 0.75]) for (const z of [-0.85, 0.85]) k.wheel(x, z, 0.36);
    return k;
  },
  cart(k, z, rng) {
    k.box(1.5, 0.22, 2.6, 0, 0.62, z, '#6b6f73').box(1.5, 1.2, 0.08, 0, 1.25, z + 1.27, '#6b6f73');
    const cols = ['#2b4a7a', '#7a2b2b', '#2f2f33', '#5a5a3a', '#8a6a3a', '#3a6a5a'];
    for (let i = 0; i < 4; i++) {
      if (rng.next() < 0.25) continue;
      k.box(0.6, 0.35 + rng.next() * 0.3, 0.9, (i % 2 ? 0.35 : -0.35), 0.95, z + (i < 2 ? -0.6 : 0.5), cols[(rng.next() * cols.length) | 0]);
    }
    for (const x of [-0.65, 0.65]) for (const dz of [-0.9, 0.9]) k.wheel(x, z + dz, 0.25);
    return k;
  },
  // a tractor and n carts behind it
  train(k, n, rng) {
    Vehicles.tractor(k);
    for (let i = 0; i < n; i++) Vehicles.cart(k, -3.4 - i * 3.3, rng);
    return k;
  },
  beltLoader(k) {
    k.box(2.0, 0.7, 6.2, 0, 0.75, 0, '#d8d8d2').box(1.4, 1.0, 1.3, 0.2, 1.6, -2.2, '#27313b')
      .box(1.1, 0.22, 7.6, -0.2, 2.3, 0.6, '#222528', -0.36).box(0.12, 0.5, 7.6, -0.8, 2.5, 0.6, '#d8d8d2', -0.36);
    for (const x of [-0.95, 0.95]) for (const z of [-2.2, 2.2]) k.wheel(x, z, 0.42);
    return k;
  },
  fuelTruck(k) {
    k.box(2.5, 2.3, 2.3, 0, 1.75, 4.6, '#f1f1ec').box(2.3, 0.9, 2.2, 0, 2.0, 5.6, '#27313b')
      .box(2.3, 0.6, 10.5, 0, 0.95, 0, '#3a3d40')
      .cyl(1.25, 1.25, 7.8, 14, 0, 2.45, -0.9, '#f4f4ef', Math.PI / 2)
      .cyl(1.28, 1.28, 0.6, 14, 0, 2.45, -0.9, '#c8282a', Math.PI / 2);
    for (const x of [-1.15, 1.15]) for (const z of [-3.6, -2.2, 4.4]) k.wheel(x, z, 0.55);
    return k;
  },
  catering(k) {
    k.box(2.5, 2.2, 2.2, 0, 1.6, 3.6, '#f1f1ec').box(2.3, 0.9, 2.1, 0, 1.9, 4.6, '#27313b')
      .box(2.4, 0.6, 8.4, 0, 0.9, 0, '#3a3d40').box(0.4, 1.6, 4.5, 0, 2.0, -1.2, '#55595d')
      .box(2.5, 2.6, 6.0, 0, 4.1, -1.0, '#efefea').box(2.52, 0.4, 6.02, 0, 4.9, -1.0, '#c8282a');
    for (const x of [-1.15, 1.15]) for (const z of [-2.8, 3.4]) k.wheel(x, z, 0.5);
    return k;
  },
  gpu(k) {
    k.box(1.4, 1.1, 2.2, 0, 0.8, 0, '#d9c13a').box(1.42, 0.3, 2.22, 0, 1.2, 0, '#2b2f33');
    for (const x of [-0.6, 0.6]) for (const z of [-0.8, 0.8]) k.wheel(x, z, 0.25);
    return k;
  },
  car(k, color) {
    k.box(1.8, 0.7, 4.4, 0, 0.62, 0, color).box(1.6, 0.6, 2.2, 0, 1.25, -0.2, '#202a33');
    for (const x of [-0.85, 0.85]) for (const z of [-1.4, 1.4]) k.wheel(x, z, 0.32);
    return k;
  },
  followMe(k) {
    Vehicles.car(k, '#f2c418');
    k.box(1.3, 0.45, 0.35, 0, 1.75, -0.3, '#111111').box(1.3, 0.12, 0.36, 0, 2.0, -0.3, '#ff7a1a');
    return k;
  },
  // an airstair truck; `top`: the height of the door sill
  stairs(k, top) {
    k.box(2.3, 2.0, 2.2, 0, 1.4, -3.4, '#f1f1ec').box(2.1, 0.8, 1.0, 0, 1.9, -2.6, '#27313b')
      .box(2.0, 0.5, 6.5, 0, 0.8, -1.0, '#3a3d40');
    const len = Math.hypot(top, 5.5), ang = Math.atan2(top - 0.9, 5.5);
    k.box(1.3, 0.25, len, 0, 0.9 + (top - 0.9) / 2, 0.6, '#c9cdd0', -ang)
      .box(0.08, 1.0, len, -0.7, 1.4 + (top - 0.9) / 2, 0.6, '#c9cdd0', -ang)
      .box(0.08, 1.0, len, 0.7, 1.4 + (top - 0.9) / 2, 0.6, '#c9cdd0', -ang)
      .box(1.6, 0.2, 1.4, 0, top, 3.4, '#c9cdd0');
    for (const x of [-0.95, 0.95]) for (const z of [-3.4, 1.6]) k.wheel(x, z, 0.45);
    return k;
  },
  cone(k, x, z) { return k.cyl(0.03, 0.2, 0.75, 8, x, 0.375, z, '#ff6a1a').box(0.42, 0.04, 0.42, x, 0.02, z, '#ff6a1a'); }
};

const Apron3D = {
  // a: the airport, rec: Airport3D's record, at(obj, t, across, y) places in the frame,
  // tex(canvas, aniso) makes a texture, parkedTypes[i]: the aeroplane at gate i
  build(a, rec, at, tex, parkedTypes) {
    const L = LAYOUT;
    const r = a.apronRect;
    const rng = makeRng(hashStr(a.id + 'apron'));
    const term = a.buildings.find((b) => b.kind === 'terminal');
    const front = term ? term.across - term.acrossSize / 2 : L.TERMINAL - 30;
    const bridges = a.terminal === 'big' || a.terminal === 'medium';
    rec.gateKits = []; rec.bridges = [];
    rec.night = rec.night || [];
    const P = (t, across) => [across, -t];          // frame x, z

    // ---- the stand numbers: a plate on the lead-in line, a board on the terminal
    for (const gate of a.gates) {
      const plate = tex(standNumberCanvas(gate.number), 8);
      const g1 = new THREE.PlaneGeometry(6, 6);
      g1.rotateX(-Math.PI / 2); g1.rotateY(-Math.PI / 2);   // upright for a pilot rolling in towards the terminal
      at(new THREE.Mesh(g1, new THREE.MeshLambertMaterial({ map: plate, polygonOffset: true, polygonOffsetFactor: -2 })), gate.t, L.APRON_LANE + 26, 0.17);
      const g2 = new THREE.PlaneGeometry(4.5, 4.5);
      g2.rotateY(-Math.PI / 2);
      const bm = new THREE.MeshLambertMaterial({ map: plate, emissiveMap: plate, emissive: 0x000000 });
      rec.night.push({ mat: bm, color: new THREE.Color(0xffffff), k: 0.8 });
      at(new THREE.Mesh(g2, bm), gate.t, front - 1.0, term ? Math.min(term.h - 3, 12) : 9);
    }

    // ---- the stands
    a.gates.forEach((gate, i) => {
      const ac = parkedTypes[i];
      const d = aircraftDims(ac);
      const R = d.radius, Lc = d.len, S = d.span, jet = ac.engineType === 'jet';
      const sill = Math.max(1.0, d.gearH - R * 0.3);
      const doorAcross = L.STAND + Lc / 2 - Math.max(2.5, Lc * 0.12);
      const k = kit();
      // the GPU by the nose, the cones
      k.push(L.STAND + Lc / 2 - 1, 0, -(gate.t + R + 3.5), 0); Vehicles.gpu(k); k.pop();
      Vehicles.cone(k, L.STAND + Lc / 2 + 1.6, -gate.t);
      for (const s of [-1, 1]) Vehicles.cone(k, L.STAND - Lc * 0.05, -(gate.t + s * (S / 2 + 1.2)));
      Vehicles.cone(k, L.STAND - Lc / 2 - 1.6, -gate.t);
      // the hold: a belt loader at the aft door on the right side (-t), the baggage train beside it
      const holdA = L.STAND - Lc * 0.22;
      if (Lc > 15) {
        k.push(holdA, 0, -(gate.t - R - 4.6), Math.PI); Vehicles.beltLoader(k); k.pop();
        k.push(holdA - 6, 0, -(gate.t - R - 10), Math.PI / 2); Vehicles.train(k, 3, rng); k.pop();
      }
      // fuel under the right wing of a jet, catering at the rear right door of a big one
      if (jet && S > 25) {
        k.push(L.STAND + Lc * 0.02, 0, -(gate.t - R - S * 0.2), Math.PI / 2); Vehicles.fuelTruck(k); k.pop();
      }
      if (jet && Lc > 35 && i % 2 === 0) {
        k.push(L.STAND - Lc * 0.38, 0, -(gate.t - R - 3.8), Math.PI); Vehicles.catering(k); k.pop();
      }
      // no bridge: an airstair truck at the front door (left side, +t)
      if (!bridges) { k.push(doorAcross, 0, -(gate.t + R + 4.2), 0); Vehicles.stairs(k, sill); k.pop(); }
      const gm = k.mesh();
      at(gm, 0, 0, 0);
      rec.gateKits.push(gm);

      // the jet bridge: docked to the front door, or retracted: folded back along the
      // terminal, between the glass and the service road, clear of both
      if (bridges) {
        const rot = [front - 4, gate.t + 14];
        const docked = jetBridge(rot, [doorAcross, gate.t + R + 0.25], sill);
        const parked = jetBridge(rot, [front - 5, gate.t + 36], 3.8);
        at(docked, 0, 0, 0); at(parked, 0, 0, 0);
        rec.bridges.push({ docked, parked });
      }
    });

    // ---- floodlight masts: along the airside edge of the apron, and on the terminal side
    // halfway between the stands (clear of the bridges and the wings), just outside the roof's
    // overhang with the lamp head turned along the building, so they never go through the roof
    const masts = [];
    for (let t = r.t0 + 85; t <= r.t1 - 30; t += 110) masts.push([t, r.a0 + 6, false]);
    const termA = front - 7.5;
    for (let i = 0; i <= a.gates.length; i++) {
      // (the first one a little nearer its stand, clear of the welcome banner)
      const t = i === 0 ? a.gates[0].t - 30 : i < a.gates.length ? a.gates[i].t - L.GATE_SPACING / 2 : a.gates[i - 1].t + L.GATE_SPACING / 2;
      masts.push([t, termA, true]);
    }
    const mk = kit();
    const lamps = [];
    for (const [t, ac, along] of masts) {
      const [x, z] = P(t, ac);
      mk.cyl(0.25, 0.4, 26, 8, x, 13, z, '#9aa0a4');
      if (along) mk.box(1.2, 1.2, 4.2, x, 26.2, z, '#3a3f44');
      else mk.box(4.2, 1.2, 1.6, x, 26.2, z, '#3a3f44');
      for (let i = -1; i <= 1; i++) lamps.push(x + (along ? 0 : i * 1.3), 25.5, z + (along ? i * 1.3 : 0));
    }
    at(mk.mesh(), 0, 0, 0);
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.Float32BufferAttribute(lamps, 3));
    rec.lamps = at(new THREE.Points(lgeo, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, color: APRON_FLOOD, fog: true })), 0, 0);
    // the pools of light: soft discs added on top of the apron at night
    const pool = new THREE.MeshBasicMaterial({
      map: tex(glowCanvas(), 2), color: APRON_FLOOD, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4
    });
    rec.poolMat = pool;
    for (const [t, ac] of masts) {
      const g = new THREE.PlaneGeometry(150, 150, 6, 6);
      g.rotateX(-Math.PI / 2);
      at(new THREE.Mesh(g, pool), t, ac + (ac < L.STAND ? 35 : -45), 0.3);
    }

    // ---- traffic: the tail-of-stand road and the landside roads
    rec.traffic = [];
    const roadA = roadAcross(a);
    const mover = (build, lane, speed, phase) => {
      const k = kit(); build(k);
      const mesh = k.mesh();
      at(mesh, 0, 0, 0);
      rec.traffic.push({ mesh, kind: 'apron', lane, speed, phase });
      return mesh;
    };
    mover((k) => Vehicles.train(k, 3, rng), roadA, 6, 0);
    mover((k) => Vehicles.followMe(k), roadA, 9, 0.45);
    if (a.terminal === 'big') mover((k) => Vehicles.train(k, 2, rng), roadA, 5, 0.7);
    const box = groundBox(a), FADE = 150;
    const roads = landsideRoads(a).map((rd) => polylineLength(truncateInBox(rd, box.tMin + FADE, box.tMax - FADE, box.aMin + FADE, box.aMax - FADE)));
    const carCols = ['#c8ccd0', '#2b2f33', '#8a1d1d', '#1d3f78', '#e6e6e6', '#6b6f73', '#2e5a3a', '#b5a27a'];
    const nCars = a.terminal === 'big' ? 10 : a.terminal === 'medium' ? 7 : 4;
    for (let i = 0; i < nCars; i++) {
      const k = kit(); Vehicles.car(k, carCols[i % carCols.length]);
      const mesh = k.mesh();
      // head and tail lights, lit at night
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute([-0.6, 0.7, 2.2, 0.6, 0.7, 2.2, -0.6, 0.75, -2.2, 0.6, 0.75, -2.2], 3));
      lg.setAttribute('color', new THREE.Float32BufferAttribute([1, 0.95, 0.8, 1, 0.95, 0.8, 1, 0.1, 0.05, 1, 0.1, 0.05], 3));
      const lights = new THREE.Points(lg, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, fog: true }));
      lights.visible = false;
      mesh.add(lights);
      at(mesh, 0, 0, 0);
      rec.traffic.push({ mesh, lights, kind: 'road', road: roads[i % roads.length], dir: i % 2 ? 1 : -1, speed: 11 + (i % 3) * 2, phase: i / nCars });
    }
  },

  // a stand in use by the player: no parked aeroplane, no vehicles, the bridge retracted
  setGate(rec, i, inUse) {
    if (rec.gateKits && rec.gateKits[i]) rec.gateKits[i].visible = !inUse;
    const b = rec.bridges && rec.bridges[i];
    if (b) { b.docked.visible = !inUse; b.parked.visible = inUse; }
  },

  // per frame: the traffic moves, and at night (dark 0..1) the lights come on. own: the
  // player's aeroplane in the airport's frame ({ t, across, r }: r about half its size) — the
  // apron traffic gives way to it: a vehicle that would drive into it, or under its wings,
  // stops and waits until it has passed
  update(rec, time, dark, own) {
    const a = rec.a;
    const r = a.apronRect;
    const dt = clamp(time - (rec.trafficTime === undefined ? time : rec.trafficTime), 0, 0.2);
    rec.trafficTime = time;
    for (const v of rec.traffic || []) {
      if (v.kind === 'apron') {
        // up the road on one side, back on the other
        const len = r.t1 - r.t0 - 40;
        if (v.s === undefined) v.s = v.phase * 2 * len;
        const pos = (s) => {
          const out = s < len;
          return { out, t: out ? r.t0 + 20 + s : r.t1 - 20 - (s - len), across: v.lane + (out ? 3 : -3) };   // keeping right
        };
        let p = pos(v.s);
        let go = true;
        if (own) {
          const ahead = (own.t - p.t) * (p.out ? 1 : -1);
          go = !(Math.abs(own.across - p.across) < own.r + 14 && ahead > -own.r * 0.4 && ahead < own.r + 30);
        }
        if (go) {
          v.s = (v.s + dt * v.speed) % (2 * len);
          p = pos(v.s);
        }
        v.mesh.position.set(p.across, 0, -p.t);
        v.mesh.rotation.y = p.out ? Math.PI : 0;
      } else {
        const rd = v.road;
        let s = ((time * v.speed / rd.len + v.phase) % 1) * rd.len;
        if (v.dir < 0) s = rd.len - s;
        const p = pointAlong(rd, s);
        // keep right: the lane is on the right of the direction of travel
        const dt = p.dt * v.dir, da = p.da * v.dir;
        v.mesh.position.set(p.across + dt * 4.65, 0, -p.t + da * 4.65);
        v.mesh.rotation.y = Math.atan2(da, -dt);
        if (v.lights) v.lights.visible = dark > 0.25;
      }
    }
    if (rec.poolMat) rec.poolMat.opacity = dark * 0.3;
    if (rec.lamps) rec.lamps.visible = dark > 0.15;
    for (const n of rec.night || []) n.mat.emissive.copy(n.color).multiplyScalar(dark * n.k);
  },

  // the pushback tug for the player's own departure, in world coordinates (Scene3D moves it)
  makeTug() {
    const k = kit();
    Vehicles.tug(k);
    // the tow bar to the nose gear
    k.box(0.25, 0.25, 3.2, 0, 0.6, 4.4, '#d0d0cc');
    return k.mesh();
  }
};

// the tail-of-stand road runs between the apron's airside edge and the apron lane
function roadAcross(a) {
  return (a.apronRect.a0 + LAYOUT.APRON_LANE - 20) / 2;
}

// a jet bridge in the airport frame: the rotunda at rot [across, t], the cab's face at tip,
// the floor at `sill` (the door sill) where it meets the aeroplane
function jetBridge(rot, tip, sill) {
  const k = kit();
  const dx = tip[0] - rot[0], dz = -(tip[1] - rot[1]);
  const len = Math.max(4, Math.hypot(dx, dz) - 3.6);           // the bellows end at the tip
  const ry = Math.atan2(dx, dz);
  const y0 = 3.8;                                           // the floor at the rotunda
  k.cyl(0.7, 0.7, y0, 10, rot[0], y0 / 2, -rot[1], '#8a8f93')
    .cyl(2.7, 2.7, 3.4, 16, rot[0], y0 + 1.7, -rot[1], '#bfc4c8')
    .cyl(2.9, 2.9, 0.3, 16, rot[0], y0 + 3.5, -rot[1], '#8a8f93');
  // the tunnel slopes from the rotunda's floor to the sill
  k.push(rot[0], 0, -rot[1], ry);
  const slope = Math.atan2(sill - y0, len);
  const mid = (y0 + sill) / 2 + 1.5;
  k.box(2.9, 3.0, len, 0, mid, len / 2 + 1.6, '#cfd3d6', -slope)
    .box(2.95, 0.7, len * 0.94, 0, mid + 0.35, len / 2 + 1.6, '#2a3540', -slope);
  // the drive leg and its wheels, three quarters of the way out
  const legZ = len * 0.75 + 1.6, legY = y0 + (sill - y0) * 0.75;
  k.box(0.5, legY, 0.5, -0.9, legY / 2, legZ, '#7d8286').box(0.5, legY, 0.5, 0.9, legY / 2, legZ, '#7d8286')
    .box(2.6, 0.8, 1.2, 0, 0.4, legZ, '#33373a');
  // the cab and the bellows against the aeroplane
  k.box(3.6, 3.3, 2.2, 0, sill + 1.65, len + 2.0, '#d5d8db').box(3.1, 3.0, 0.5, 0, sill + 1.55, len + 3.3, '#2b2f33');
  k.pop();
  return k.mesh();
}

// a polyline of [t, across] points with its length, for things that drive along it
function polylineLength(pts) {
  const segs = [];
  let len = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push({ p: pts[i], q: pts[i + 1], l, s: len });
    len += l;
  }
  return { segs, len: Math.max(1, len) };
}
function pointAlong(rd, s) {
  for (const g of rd.segs) {
    if (s <= g.s + g.l || g === rd.segs[rd.segs.length - 1]) {
      const k = clamp((s - g.s) / (g.l || 1), 0, 1);
      return {
        t: g.p[0] + (g.q[0] - g.p[0]) * k, across: g.p[1] + (g.q[1] - g.p[1]) * k,
        dt: (g.q[0] - g.p[0]) / (g.l || 1), da: (g.q[1] - g.p[1]) / (g.l || 1)
      };
    }
  }
  return { t: 0, across: 0, dt: 1, da: 0 };
}

// a stand number: black on yellow, a black border
function standNumberCanvas(n) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = '#111111'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#f4ce3a'; g.fillRect(14, 14, 228, 228);
  g.fillStyle = '#111111';
  g.font = '900 170px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(n), 128, 140);
  return cv;
}

// a soft round glow, white in the middle (the pools of light, the landing light)
function glowCanvas() {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 128;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return cv;
}
