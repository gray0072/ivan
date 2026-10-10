'use strict';

// ============================================================
// World Aviation — life on the apron (three.js), built in the
// airport's frame like airport3d.js (local x = across, towards the
// terminal; z = -t, along the runway; y = up):
//
//   - the stand numbers: a sharp plate on the lead-in line and a
//     board on the terminal above each stand (C1, C2 … at the cargo
//     stands, on the cargo building; G1, G2 … at the GA stands, on the
//     GA terminal and the air ambulance's hangar)
//   - at every stand with a parked aeroplane: a jet bridge to its
//     front door (at a small terminal an airstair truck; at a cargo
//     stand a main-deck loader at the freighter's cargo door, or a
//     forklift with a pallet at a small one), a GPU, a belt loader at
//     the aft hold, a fuel truck under the wing of a jet, a catering
//     truck, cones at the nose, the wingtips and the tail; at a GA
//     stand only the GPU, the cones and a pickup (the light aeroplanes
//     have their own steps), at the air ambulance's an ambulance by the
//     door; at the stands the player uses this flight the bridge is
//     retracted and the stand is empty
//   - floodlight masts on both sides of the apron: their lamps and
//     the pools of light they throw on the apron at night
//   - traffic: the baggage trains between the baggage halls and the
//     stands (baggage3d.js), cars (with their lights at night) on the
//     landside roads
//   - the pushback tug for the player's own departure (Scene3D)
//
// Static parts are merged into one mesh with vertex colours per group
// (kit), so a busy apron costs a handful of draw calls.
// Used by Airport3D.build / update and Scene3D.
// ============================================================

const APRON_FLOOD = 0xffe3b8;      // the colour of the floodlights
const MAST_CLEAR = 52;             // a floodlight mast from a taxilane centreline, metres (ICAO code F: 50.5)
const MAST_NAME_GAP = 40;          // no airside mast this far either side of the airport's name on the roof, metres
// the apron traffic gives way to the player's aeroplane (Apron3D.update): the ground it covers is
// its circle (half its length or span) plus GIVE_WAY_PAD, now and where it will be over the next
// GIVE_WAY_AHEAD_S seconds; a vehicle stops GIVE_WAY_GAP metres short of that ground
const GIVE_WAY_PAD = 8, GIVE_WAY_AHEAD_S = 8, GIVE_WAY_GAP = 30;

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
  // a baggage cart, empty, and the bags on one (a few suitcases)
  cartBase(k, z) {
    k.box(1.5, 0.22, 2.6, 0, 0.62, z, '#6b6f73').box(1.5, 1.2, 0.08, 0, 1.25, z + 1.27, '#6b6f73')
      .box(0.08, 0.08, 0.9, 0, 0.5, z - 1.7, '#6b6f73');
    for (const x of [-0.65, 0.65]) for (const dz of [-0.9, 0.9]) k.wheel(x, z + dz, 0.25);
    return k;
  },
  bags(k, z, rng) {
    const cols = ['#2b4a7a', '#7a2b2b', '#2f2f33', '#5a5a3a', '#8a6a3a', '#3a6a5a'];
    for (let i = 0; i < 6; i++) {
      if (i > 1 && rng.next() < 0.3) continue;
      k.box(0.6, 0.35 + rng.next() * 0.3, 0.75, (i % 2 ? 0.35 : -0.35), 0.95, z - 0.8 + ((i / 2) | 0) * 0.8, cols[(rng.next() * cols.length) | 0]);
    }
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
  cone(k, x, z) { return k.cyl(0.03, 0.2, 0.75, 8, x, 0.375, z, '#ff6a1a').box(0.42, 0.04, 0.42, x, 0.02, z, '#ff6a1a'); },

  // ---- the emergency services (responders3d.js adds their flashing blue lights)
  // an ambulance: a box van, white, yellow and green checks along the sides, a red cross on
  // the sides and the back doors (6.2 m long, 2.4 wide)
  ambulance(k) {
    const W = '#f4f4ef', RED = '#c8282a', DK = '#202a33';
    k.box(2.1, 0.5, 6.0, 0, 0.6, 0, '#3a3d40')
      .box(2.1, 0.9, 1.0, 0, 1.0, 2.5, W).box(2.1, 1.15, 1.3, 0, 1.75, 1.55, W)
      .box(1.96, 0.62, 0.06, 0, 1.9, 2.21, DK).box(2.12, 0.55, 0.9, 0, 1.9, 1.6, DK)
      .box(2.36, 2.35, 3.9, 0, 1.62, -1.1, W)
      .box(2.38, 0.12, 3.9, 0, 1.52, -1.1, RED);
    for (let i = 0; i < 6; i++) k.box(2.38, 0.5, 0.65, 0, 1.1, -2.72 + i * 0.65, i % 2 ? '#2f9a46' : '#e8d21a');
    k.box(2.4, 0.8, 0.26, 0, 2.12, -1.6, RED).box(2.4, 0.26, 0.8, 0, 2.12, -1.6, RED)
      .box(0.26, 0.8, 0.04, 0, 2.05, -3.07, RED).box(0.8, 0.26, 0.04, 0, 2.05, -3.07, RED)
      .box(0.04, 2.0, 0.03, 0, 1.55, -3.06, '#9a9ea2');
    for (const x of [-1.0, 1.0]) for (const z of [-1.95, 1.95]) k.wheel(x, z, 0.42);
    return k;
  },
  // an airport fire engine (a crash tender): red, a white line, grey lockers, a cab with a big
  // windscreen, a water cannon on the roof and one on the bumper, three axles (11 m long, 3 wide)
  fireEngine(k) {
    const RED = '#c41e24', DK = '#1d252d', MET = '#cfd2d4';
    k.box(2.8, 0.7, 10.6, 0, 0.95, 0, '#2b2e31')
      .box(3.0, 2.3, 7.4, 0, 2.15, -1.5, RED).box(3.0, 2.1, 2.8, 0, 2.05, 3.7, RED)
      .box(2.9, 0.95, 0.08, 0, 2.55, 5.12, DK).box(3.02, 0.85, 1.9, 0, 2.6, 3.85, DK)
      .box(3.02, 0.2, 10.2, 0, 1.45, -0.1, '#f2f2ea')
      .box(3.02, 1.15, 2.5, 0, 2.3, -0.5, '#c9ccd0').box(3.02, 1.15, 2.5, 0, 2.3, -3.4, '#c9ccd0')
      .cyl(0.35, 0.42, 0.4, 10, 0, 3.3, 3.0, MET)
      .cyl(0.11, 0.15, 1.7, 8, 0, 3.6, 3.75, MET, Math.PI / 2 - 0.2)
      .cyl(0.08, 0.1, 0.9, 8, 0, 1.0, 5.6, MET, Math.PI / 2);
    for (const x of [-1.25, 1.25]) for (const z of [-3.5, -1.8, 3.7]) k.wheel(x, z, 0.6);
    return k;
  },
  // a police car: white, blue and yellow checks along the sides, the light bar on the roof
  policeCar(k) {
    Vehicles.car(k, '#f4f4f4');
    for (let i = 0; i < 7; i++) k.box(1.82, 0.32, 0.6, 0, 0.62, -1.8 + i * 0.6, i % 2 ? '#f2d21a' : '#1d4fb8');
    k.box(1.3, 0.1, 0.32, 0, 1.6, -0.2, '#222428');
    return k;
  }
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
    // the building behind a stand (or a mast): a terminal, the cargo terminal or shed, or one of
    // the GA and rescue area's (their apron fronts all on one line)
    const FRONTS = ['terminal', 'cargo', 'ga', 'medevac', 'rescue', 'fire'];
    const behind = (t) => a.buildings.find((b) => FRONTS.indexOf(b.kind) >= 0 && Math.abs(b.t - t) <= b.along / 2) || term;
    const bridges = a.terminal === 'big' || a.terminal === 'medium';
    rec.gateKits = []; rec.bridges = [];
    const bagStands = [];
    rec.night = rec.night || [];
    const P = (t, across) => [across, -t];          // frame x, z

    // ---- the stand numbers: a plate on the lead-in line, a board on the terminal
    for (const gate of a.gates) {
      const plate = tex(standNumberCanvas(gate.plate || gate.number), 8);
      const g1 = new THREE.PlaneGeometry(6, 6);
      g1.rotateX(-Math.PI / 2); g1.rotateY(-Math.PI / 2);   // upright for a pilot rolling in towards the terminal
      at(new THREE.Mesh(g1, new THREE.MeshLambertMaterial({ map: plate, polygonOffset: true, polygonOffsetFactor: -2 })), gate.t, L.APRON_LANE + 26, 0.17);
      // the board stands out from the glass on a dark box, clear of the window frames (their
      // faces are 1 m out: a board in that plane mixed with them)
      const g2 = new THREE.PlaneGeometry(4.5, 4.5);
      g2.rotateY(-Math.PI / 2);
      const bm = new THREE.MeshLambertMaterial({ map: plate, emissiveMap: plate, emissive: 0x000000 });
      rec.night.push({ mat: bm, color: new THREE.Color(0xffffff), k: 0.8 });
      const bb = behind(gate.t), by = bb ? Math.min(bb.h - 3, 12) : 9;
      at(new THREE.Mesh(cellBox(0.7, 5.1, 5.1), new THREE.MeshLambertMaterial({ color: 0x1b232c })), gate.t, front - 1.35, by);
      at(new THREE.Mesh(g2, bm), gate.t, front - 1.8, by);
    }

    // ---- the stands
    a.gates.forEach((gate, i) => {
      const ac = parkedTypes[i];
      const d = aircraftDims(ac);
      const R = d.radius, Lc = d.len, S = d.span, jet = ac.engineType === 'jet';
      const sill = Math.max(1.0, d.gearH - R * 0.3);
      const doorBack = frontDoorFromNose(Lc), doorAcross = L.STAND + Lc / 2 - doorBack;
      const k = kit();
      // the GPU by the nose, the cones
      k.push(L.STAND + Lc / 2 - 1, 0, -(gate.t + R + 3.5), 0); Vehicles.gpu(k); k.pop();
      Vehicles.cone(k, L.STAND + Lc / 2 + 1.6, -gate.t);
      for (const s of [-1, 1]) Vehicles.cone(k, L.STAND - Lc * 0.05, -(gate.t + s * (S / 2 + 1.2)));
      Vehicles.cone(k, L.STAND - Lc / 2 - 1.6, -gate.t);
      // the hold: a belt loader at the aft door on the right side (-t); the baggage trains
      // come and stop beside it (baggage3d.js)
      const holdA = L.STAND - Lc * 0.22;
      if (Lc > 15 && !gate.ga) { k.push(holdA, 0, -(gate.t - R - 4.6), Math.PI); Vehicles.beltLoader(k); k.pop(); }
      bagStands.push({ t: gate.t, hold: holdA, R, parked: Lc > 15 && !gate.ga, inUse: false });
      // fuel under the right wing of a jet (clear of the baggage trains' way up beside the
      // hold, 10 m out from the fuselage), catering at the rear right door of a big one
      if (jet && S > 25) {
        k.push(L.STAND + Lc * 0.02, 0, -(gate.t - R - Math.max(S * 0.2, 13.5)), Math.PI / 2); Vehicles.fuelTruck(k); k.pop();
      }
      if (jet && Lc > 35 && i % 2 === 0 && !gate.cargo) {
        k.push(L.STAND - Lc * 0.38, 0, -(gate.t - R - 3.8), Math.PI); Vehicles.catering(k); k.pop();
      }
      // no bridge: an airstair truck at the front door (left side, +t); a freighter's main deck
      // is loaded through its cargo door just behind it, by a main-deck loader (a small one's by a
      // forklift with a pallet)
      if (gate.cargo) {
        const cargoDoor = doorAcross - Math.min(8, Lc * 0.2);
        if (sill > 2.4) { k.push(cargoDoor, 0, -(gate.t + R + 5.2), 0); Vehicles.highLoader(k, sill, rng); k.pop(); }
        else { k.push(cargoDoor, 0, -(gate.t + R + 3.2), 0); Vehicles.forklift(k, true, rng); k.pop(); }
      } else if (gate.medevac) {
        // the air ambulance's stand: an ambulance beside the door, facing out to the apron
        k.push(doorAcross - 2.5, 0, -(gate.t + R + 2.4), -Math.PI / 2); Vehicles.ambulance(k); k.pop();
      } else if (gate.ga) {
        // a GA stand: the operator's pickup by the nose, now and then
        if (i % 2 === 0) { k.push(L.STAND + Lc / 2 + 4, 0, -(gate.t - R - 6), Math.PI); Vehicles.pickup(k, '#e9e9e4'); k.pop(); }
      } else if (!bridges) { k.push(doorAcross, 0, -(gate.t + R + 4.2), 0); Vehicles.stairs(k, sill); k.pop(); }
      const gm = k.mesh();
      at(gm, 0, 0, 0);
      rec.gateKits.push(gm);

      // the jet bridge: docked to the front door, or retracted: folded back along the
      // terminal, between the glass and the service road, clear of both. Docked, the cab is
      // turned square to the fuselage and the bellows meet its side where it is widest under
      // them (by the nose the body narrows: the bellows reach 1.55 m either side of the door)
      if (bridges && !gate.cargo && !gate.ga) {
        const rot = [front - 4, gate.t + 14];
        let side = 0;
        for (const dz of [-1.55, 0, 1.55]) side = Math.max(side, fuselageRing(Lc, R, Lc / 2 - doorBack + dz).r);
        const docked = jetBridge(rot, [doorAcross, gate.t + side + 0.05], sill, R);
        const parked = jetBridge(rot, [front - 5, gate.t + 36], 3.8);
        at(docked, 0, 0, 0); at(parked, 0, 0, 0);
        rec.bridges.push({ docked, parked });
      } else rec.bridges.push(null);
    });

    // ---- floodlight masts: along the airside edge of the apron, and on the terminal side
    // halfway between the stands (clear of the bridges and the wings), just outside the roof's
    // overhang with the lamp head turned along the building, so they never go through the roof
    // (the airside ones on the grass just off the apron, clear of the service road and of the
    // wings: ICAO's 50.5 m from a code F taxilane centreline to an object, from the apron lane
    // and from every lane off the taxiway into the apron, MAST_CLEAR — so only between two lanes
    // at least twice that apart, spread evenly, about 110 m from each other; none in front of the
    // airport's name on the roof, MAST_NAME_GAP either side of it, where they would cross the
    // letters seen from the apron and the taxiway)
    const masts = [];
    const airside = Math.min(r.a0 - 6, L.APRON_LANE - MAST_CLEAR);
    const lanes = a.apronLanes || [r.t0 + 40, r.t1 - 40];
    const sign = roofName(a);
    const n0 = sign.b ? sign.b.t - sign.lw / 2 - MAST_NAME_GAP : Infinity, n1 = sign.b ? sign.b.t + sign.lw / 2 + MAST_NAME_GAP : -Infinity;
    for (let k = 0; k + 1 < lanes.length; k++) {
      const s0 = lanes[k] + MAST_CLEAR, s1 = lanes[k + 1] - MAST_CLEAR;
      const pieces = s1 <= n0 || s0 >= n1 ? [[s0, s1]] : [[s0, Math.min(s1, n0)], [Math.max(s0, n1), s1]];
      for (const [t0, t1] of pieces) {
        if (t1 < t0) continue;
        const n = Math.floor((t1 - t0) / 110) + 1;
        for (let i = 0; i < n; i++) masts.push([n === 1 ? (t0 + t1) / 2 : t0 + (t1 - t0) * i / (n - 1), airside, false]);
      }
    }
    const termA = front - 7.5;
    for (let i = 0; i <= a.gates.length; i++) {
      // (the first one a little nearer its stand, clear of the welcome banner)
      const sp = (g) => (g.cargo ? L.CARGO_SPACING : g.ga ? L.GA_SPACING : L.GATE_SPACING) / 2;
      const t = i === 0 ? a.gates[0].t - 30 : i < a.gates.length ? a.gates[i].t - sp(a.gates[i]) : a.gates[i - 1].t + sp(a.gates[i - 1]);
      masts.push([t, termA, true]);
    }
    // (the airside ones 26 m tall; the terminal's below its roof edge, so seen from the apron
    // they never stand in front of the airport's name on the roof)
    // (by the cargo building, lower than the terminals, below its roof edge too)
    const termMast = (t) => { const bb = behind(t); return Math.min(26, (bb ? bb.h : 11) - 2.5); };
    const mk = kit();
    const lamps = [];
    for (const [t, ac, along] of masts) {
      const [x, z] = P(t, ac), mh = along ? termMast(t) : 26;
      mk.cyl(0.25, 0.4, mh, 8, x, mh / 2, z, '#9aa0a4');
      if (along) mk.box(1.2, 1.2, 4.2, x, mh + 0.2, z, '#3a3f44');
      else mk.box(4.2, 1.2, 1.6, x, mh + 0.2, z, '#3a3f44');
      for (let i = -1; i <= 1; i++) lamps.push(x + (along ? 0 : i * 1.3), mh - 0.5, z + (along ? i * 1.3 : 0));
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
    // (one mesh for them all, drawn only after dusk: by day they cost the whole apron's fill for nothing)
    rec.pools = at(new THREE.Group(), 0, 0, 0);
    for (const [t, ac] of masts) {
      const g = new THREE.PlaneGeometry(150, 150, 6, 6);
      g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, pool);
      m.position.set(ac + (ac < L.STAND ? 35 : -45), 0.3, -t);
      rec.pools.add(m);
    }
    Merge3D.bake(rec.pools);
    rec.pools.visible = false;

    // ---- traffic: the baggage trains on the service road between the stands and the
    // building (LAYOUT.SERVICE_ROAD: airport3d.js), the cars on the landside roads
    Baggage.build(a, rec, at, bagStands, front, L.SERVICE_ROAD, rng);
    rec.traffic = [];
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
    if (rec.bagStands && rec.bagStands[i]) rec.bagStands[i].inUse = inUse;
    const b = rec.bridges && rec.bridges[i];
    if (b) { b.docked.visible = !inUse; b.parked.visible = inUse; }
  },

  // per frame: the traffic moves, and at night (dark 0..1) the lights come on. own: the
  // player's aeroplane in the airport's frame ({ t, across, r, vt, va, len, rad, landed }: r
  // about half its size, its velocity along and across, its length and fuselage radius, landed
  // here) — the baggage trains give way to it while it moves: a train whose track ahead runs
  // into the ground the aeroplane covers now or in the next few seconds stops well short of it
  // and waits; one already on that ground drives on and clears it, so none is left standing
  // across the aeroplane's way. At rest at its stand the aeroplane is served like the others.
  update(rec, time, dark, own) {
    const dt = clamp(time - (rec.trafficTime === undefined ? time : rec.trafficTime), 0, 0.2);
    rec.trafficTime = time;
    Baggage.update(rec, dt, dark, own);
    // the cars on the landside roads
    for (const v of rec.traffic || []) {
      const rd = v.road;
      let s = ((time * v.speed / rd.len + v.phase) % 1) * rd.len;
      if (v.dir < 0) s = rd.len - s;
      const p = pointAlong(rd, s);
      // keep right: the lane is on the right of the direction of travel
      const ut = p.dt * v.dir, ua = p.da * v.dir;
      v.mesh.position.set(p.across + ut * 4.65, 0, -p.t + ua * 4.65);
      v.mesh.rotation.y = Math.atan2(ua, -ut);
      if (v.lights) v.lights.visible = dark > 0.25;
    }
    if (rec.poolMat) rec.poolMat.opacity = dark * 0.3;
    if (rec.pools) rec.pools.visible = dark > 0.01;
    if (rec.lamps) rec.lamps.visible = dark > 0.15;
    for (const n of rec.night || []) n.mat.emissive.copy(n.color).multiplyScalar(dark * n.k);
  },

  // Must a vehicle at s on its track (pos(s) → { t, across }) wait for the
  // aeroplane? Yes when its road from just ahead of it to GIVE_WAY_GAP further meets the ground
  // the aeroplane covers now or soon, and it is not on that ground already.
  blocked(own, s, pos) {
    const R = own.r + GIVE_WAY_PAD;
    const inside = (q) => {
      for (let k = 0; k <= GIVE_WAY_AHEAD_S; k += 2) {
        if (Math.hypot(q.t - (own.t + own.vt * k), q.across - (own.across + own.va * k)) < R) return true;
      }
      return false;
    };
    if (inside(pos(s))) return false;
    for (let d = 3; d <= GIVE_WAY_GAP + 3; d += 3) if (inside(pos(s + d))) return true;
    return false;
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

// a jet bridge in the airport frame: the rotunda at rot [across, t], the bellows' face at tip,
// the floor at `sill` (the door sill) where it meets the aeroplane. Docked (R: the fuselage
// radius) the cab is turned square to the aeroplane's left side (facing -t), the tunnel running
// into its back; retracted the cab is in line with the tunnel.
function jetBridge(rot, tip, sill, R) {
  const k = kit();
  const y0 = 3.8;                                           // the floor at the rotunda
  const CAB_W = 3.6, CAB_D = 2.4, BELLOWS = 0.6;
  const cabH = R ? clamp(R * 1.6 + 0.8, 2.6, 3.3) : 3.3;    // a small aeroplane's door is lower
  k.cyl(0.7, 0.7, y0, 10, rot[0], y0 / 2, -rot[1], '#8a8f93')
    .cyl(2.7, 2.7, 3.4, 16, rot[0], y0 + 1.7, -rot[1], '#bfc4c8')
    .cyl(2.9, 2.9, 0.3, 16, rot[0], y0 + 3.5, -rot[1], '#8a8f93');
  // the cab's middle [across, t] and its heading
  let cab, cabRy;
  if (R) {
    cab = [tip[0], tip[1] + BELLOWS + CAB_D / 2];
    cabRy = 0;
  } else {
    const dx = tip[0] - rot[0], dt = tip[1] - rot[1], l = Math.hypot(dx, dt) || 1, back = BELLOWS + CAB_D / 2;
    cab = [tip[0] - dx / l * back, tip[1] - dt / l * back];
    cabRy = Math.atan2(dx, -dt);
  }
  // the tunnel slopes from the rotunda's floor to the sill, into the middle of the cab
  const dx = cab[0] - rot[0], dz = -(cab[1] - rot[1]);
  const len = Math.max(4, Math.hypot(dx, dz) - 1.6);
  k.push(rot[0], 0, -rot[1], Math.atan2(dx, dz));
  const slope = Math.atan2(sill - y0, len);
  const mid = (y0 + sill) / 2 + 1.5;
  k.box(2.9, 3.0, len, 0, mid, len / 2 + 1.6, '#cfd3d6', -slope)
    .box(2.95, 0.7, len * 0.94, 0, mid + 0.35, len / 2 + 1.6, '#2a3540', -slope);
  // the drive leg and its wheels, three quarters of the way out
  const legZ = len * 0.75 + 1.6, legY = y0 + (sill - y0) * 0.75;
  k.box(0.5, legY, 0.5, -0.9, legY / 2, legZ, '#7d8286').box(0.5, legY, 0.5, 0.9, legY / 2, legZ, '#7d8286')
    .box(2.6, 0.8, 1.2, 0, 0.4, legZ, '#33373a');
  k.pop();
  // the cab and the bellows against the aeroplane
  k.push(cab[0], 0, -cab[1], cabRy);
  k.box(CAB_W, cabH, CAB_D, 0, sill + cabH / 2, 0, '#d5d8db')
    .box(3.1, cabH - 0.3, BELLOWS, 0, sill + 0.05 + (cabH - 0.3) / 2, CAB_D / 2 + BELLOWS / 2, '#2b2f33');
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

// a stand number ("3", "C2"): black on yellow, a black border
function standNumberCanvas(n) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = '#111111'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#f4ce3a'; g.fillRect(14, 14, 228, 228);
  g.fillStyle = '#111111';
  g.font = '900 170px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(String(n)).width;
  g.save(); g.translate(128, 140); g.scale(Math.min(1, 200 / w), 1); g.fillText(String(n), 0, 0); g.restore();
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
