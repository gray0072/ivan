'use strict';

// ============================================================
// World Aviation — the emergency services waiting at the arrival
// stand (three.js): an ambulance, an airport fire engine and a
// police car, called by a worked checklist (Flight.meet, filled by
// Systems.finishChecklist from the emergency's `meet` in
// data/emergencies.js).
//
//   - they stand beside the stand the player taxies to, along the
//     fuselage and facing out to the apron: the ambulance on the left
//     (the front door's side), the police car further out beyond it,
//     the fire engine on the right; each ahead of the wing and the
//     engines of the type flown (modelLayout), and clear of the
//     service road in front of the terminal — a big aeroplane's wing
//     sends them further out to the side
//   - their blue lights flash in double flashes, each vehicle on its
//     own beat, with a glow round every lamp that grows at night
//
// Built into the arrival airport's frame (Airport3D's rec.frame,
// x = across, z = -t), so they go when the airport goes.
// Used by Scene3D.update.
// ============================================================

const RESP_GAP = 1.5;           // from the wing or an engine's intake to a vehicle's back, metres
const RESP_FRONT = 19;          // a vehicle's front at most this far past the stand towards the terminal (the service road's lane: 21)
const RESP_FLASH_S = 0.9;       // one cycle of the lights: a double flash on one side, then on the other
const RESP_BLUE = '#3f7dff';

// the vehicles: the side of the aeroplane (+1 left, -1 right), how far out from the fuselage they
// stand (police: beyond the ambulance when both are there), their width and length, and the blue
// lamps in their own frame (forward +z), in two sets that flash in turn
const RESP_KINDS = {
  ambulance: {
    side: 1, out: 3.5, w: 2.4, len: 6.2, model: (k) => Vehicles.ambulance(k),
    lamps: [[[-0.6, 2.4, 1.6], [-1.0, 2.86, 0.75], [1.0, 2.86, -2.95]], [[0.6, 2.4, 1.6], [1.0, 2.86, 0.75], [-1.0, 2.86, -2.95]]]
  },
  police: {
    side: 1, out: 3.5, outAfter: { ambulance: 9 }, w: 1.8, len: 4.6, model: (k) => Vehicles.policeCar(k),
    lamps: [[[-0.42, 1.72, -0.2]], [[0.42, 1.72, -0.2]]]
  },
  fire: {
    side: -1, out: 4, w: 3.0, len: 11, model: (k) => Vehicles.fireEngine(k),
    lamps: [[[-1.0, 3.22, 4.6], [-1.3, 3.42, 2.05], [1.3, 3.42, -5.05]], [[1.0, 3.22, 4.6], [1.3, 3.42, 2.05], [-1.3, 3.42, -5.05]]]
  }
};

const Responders3D = {
  glowTex: null,

  // per frame, for every airport built: rec the airport's record, fl the flight, gate the
  // arrival gate when rec is the arrival airport (else null: nobody waits there, and whoever
  // waited there on an earlier flight is gone), time in seconds, dark 0..1
  update(rec, fl, gate, time, dark) {
    const key = gate && fl.meet && fl.meet.length ? gate.index + ':' + fl.meet.join(',') : '';
    const r = rec.responders;
    if (r && (r.fl !== fl || r.key !== key)) {
      rec.frame.remove(r.group);
      r.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      rec.responders = null;
    }
    if (!key) return;
    if (!rec.responders) rec.responders = this.build(rec, fl, gate, key);
    // the lights: a double flash of set A, then of set B
    const size = 2.2 + 2.8 * dark, op = 0.5 + 0.5 * dark;
    for (const v of rec.responders.vehicles) {
      const c = ((time + v.phase) % RESP_FLASH_S) / RESP_FLASH_S;
      const on = [c < 0.08 || (c > 0.16 && c < 0.24), (c > 0.5 && c < 0.58) || (c > 0.66 && c < 0.74)];
      v.sets.forEach((s, i) => {
        s.mat.color.setScalar(on[i] ? 1 : 0.16);
        s.glow.visible = on[i];
        s.glow.material.size = size;
        s.glow.material.opacity = op;
      });
    }
  },

  build(rec, fl, gate, key) {
    const group = new THREE.Group();
    const lay = modelLayout(fl.ac);
    const kinds = fl.meet.filter((k) => RESP_KINDS[k]);
    const body = new THREE.MeshLambertMaterial({ vertexColors: true });
    const vehicles = [];
    kinds.forEach((kind, n) => {
      const spec = RESP_KINDS[kind];
      let out = spec.out;
      for (const other in spec.outAfter || {}) if (kinds.indexOf(other) >= 0) out = spec.outAfter[other];
      const p = this.place(lay, lay.R + out, spec.w, spec.len);
      const k = kit();
      spec.model(k);
      const mesh = k.mesh(body);
      // (facing out to the apron: forward = -across)
      const holder = new THREE.Group();
      holder.position.set(LAYOUT.STAND + p.z, 0, -(gate.t + spec.side * p.y));
      holder.rotation.y = -Math.PI / 2;
      holder.add(mesh);
      const sets = spec.lamps.map((lamps) => {
        const lk = kit();
        for (const [x, y, z] of lamps) lk.box(0.42, 0.2, 0.3, x, y, z, RESP_BLUE);
        const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
        holder.add(lk.mesh(mat));
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(lamps.flat(), 3));
        const glow = new THREE.Points(g, new THREE.PointsMaterial({
          map: this.glow(), color: RESP_BLUE, size: 2.2, sizeAttenuation: true, transparent: true,
          depthWrite: false, blending: THREE.AdditiveBlending, fog: true
        }));
        holder.add(glow);
        return { mat, glow };
      });
      group.add(holder);
      vehicles.push({ kind, sets, phase: n * 0.37 });
    });
    rec.frame.add(group);
    return { fl, key, group, vehicles };
  },

  // Where a vehicle w wide and len long stands, its inner side y0 out from the aeroplane's axis:
  // { z: its middle along the aeroplane (model axes, the nose forward, the stand at 0), y: its
  // middle out to the side }. As near the front door as the wing and the engines in its lane
  // allow (its back RESP_GAP ahead of them), its front no further than RESP_FRONT; where that does
  // not fit, 2 m further out, where the swept wing's edge is further back.
  place(lay, y0, w, len) {
    const doorZ = lay.L / 2 - frontDoorFromNose(lay.L);
    let z = 0;
    for (let i = 0; i < 20; i++, y0 += 2) {
      z = Math.max(Math.min(doorZ - 3, RESP_FRONT - len / 2), this.frontOf(lay, y0, y0 + w) + RESP_GAP + len / 2);
      if (z + len / 2 <= RESP_FRONT) return { z, y: y0 + w / 2 };
    }
    return { z, y: y0 + w / 2 };
  },
  // the furthest forward the wing or an engine reaches between y0 and y1 out from the axis
  // (model z), -Infinity beyond the wing tip
  frontOf(lay, y0, y1) {
    const root = lay.R * 0.8;
    let z = y0 < root + lay.semi ? lay.leAt(clamp((y0 - root) / lay.semi, 0, 1)) : -Infinity;
    for (const e of lay.engines) {
      if (Math.abs(e.x) + e.dia / 2 > y0 - 1 && Math.abs(e.x) - e.dia / 2 < y1 + 1) z = Math.max(z, e.z + e.len / 2);
    }
    if (!lay.jet) {
      // a turboprop's nacelle and propeller, on the wing at 0.3 of the half span
      const x = lay.spanAt(0.3), pr = lay.R * 1.4;
      if (x + pr > y0 - 1 && x - pr < y1 + 1) z = Math.max(z, lay.leAt(0.3) + lay.rootC * 0.5 + lay.R + 0.5);
    }
    return z;
  },

  glow() {
    if (!this.glowTex) this.glowTex = new THREE.CanvasTexture(glowCanvas());
    return this.glowTex;
  }
};
