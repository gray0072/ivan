'use strict';

// ============================================================
// World Aviation — what the camera shows after a collision
// (three.js), drawn from Scene3D.incident, which ui/incident.js sets:
//   - tug: a tug at the nose gear, its tow bar on it, facing the
//     aeroplane (as the pushback tug stands), while it pulls the
//     aeroplane back clear of what it touched;
//   - police: a police car driving up along a curve { x0, z0, cx, cz,
//     x1, z1 } (k 0..1 of the way, slowing to a stop at the end), its
//     blue lights flashing in double flashes, side to side;
//   - smoke: a lost flight — dark smoke rising and spreading from the
//     spot { x, y, z } since t0 (the scene's clock), a flickering glow
//     of fire under it, dying away after INCIDENT.SMOKE_S.
// In the world's frame, never part of an airport. Used by Scene3D.update.
// ============================================================

const SMOKE_PUFFS = 16;           // the smoke's puffs, rising one after another ...
const SMOKE_LIFE_S = 4.5;         // ... each this long

const Incident3D = {
  init(scene) {
    this.tug = Apron3D.makeTug();
    this.tug.visible = false;
    scene.add(this.tug);

    // the police car, its blue lamps in two sets that flash in turn, a glow round each
    const car = new THREE.Group();
    const k = kit();
    Vehicles.policeCar(k);
    car.add(k.mesh());
    const sets = RESP_KINDS.police.lamps.map((lamps) => {
      const lk = kit();
      for (const [x, y, z] of lamps) lk.box(0.42, 0.2, 0.3, x, y, z, RESP_BLUE);
      const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
      car.add(lk.mesh(mat));
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(lamps.flat(), 3));
      const glow = new THREE.Points(g, new THREE.PointsMaterial({
        map: Responders3D.glow(), color: RESP_BLUE, size: 2.2, sizeAttenuation: true, transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, fog: true
      }));
      car.add(glow);
      return { mat, glow };
    });
    car.visible = false;
    scene.add(car);
    this.police = { car, sets };

    // the smoke: soft grey puffs; the fire: an orange glow on the ground under them
    const tex = new THREE.CanvasTexture(smokeCanvas());
    this.puffs = [];
    const smoke = new THREE.Group();
    for (let i = 0; i < SMOKE_PUFFS; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x26272a, transparent: true, depthWrite: false, opacity: 0, fog: true }));
      smoke.add(m);
      this.puffs.push(m);
    }
    this.fire = new THREE.Sprite(new THREE.SpriteMaterial({
      map: Responders3D.glow(), color: 0xff7a22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0
    }));
    smoke.add(this.fire);
    smoke.visible = false;
    scene.add(smoke);
    this.smoke = smoke;
  },

  // per frame: fl the flight, view Scene3D.incident (or null), time the scene's clock, dark 0..1
  update(fl, view, time, dark) {
    if (!this.tug) return;
    this.updateTug(fl, view && view.tug);
    this.updatePolice(view && view.police, time, dark);
    this.updateSmoke(fl, view && view.smoke, time);
  },

  // on its tow bar at the nose gear, facing the aeroplane; turning with it as the aeroplane goes
  // back along its trail (World.tow, as the pushback tug)
  updateTug(fl, on) {
    const tug = this.tug;
    tug.visible = !!on;
    if (!on) { this.tow = null; return; }
    const st = fl.st;
    const w = this.tow = World.tow(this.tow || null, { x: st.pos.x, z: st.pos.z, hdg: st.hdg }, fl.dims.len);
    tug.position.set(w.x, Terrain.surfaceAt(w.x, w.z), w.z);
    tug.rotation.y = w.ry;
    tug.userData.bar.rotation.y = w.bar;
    Apron3D.towBarTo(tug, fl.ac);
  },

  updatePolice(p, time, dark) {
    const P = this.police;
    P.car.visible = !!p;
    if (!p) return;
    // along the curve, slowing to a stop
    const u = smoothstep(0, 1, clamp(p.k, 0, 1)) * 0.5 + clamp(p.k, 0, 1) * 0.5;
    const at = (t) => {
      const w0 = (1 - t) * (1 - t), w1 = 2 * t * (1 - t), w2 = t * t;
      return [w0 * p.x0 + w1 * p.cx + w2 * p.x1, w0 * p.z0 + w1 * p.cz + w2 * p.z1];
    };
    const q = at(u), a = at(Math.max(0, u - 0.02)), b = at(Math.min(1, u + 0.02));
    P.car.position.set(q[0], Terrain.surfaceAt(q[0], q[1]), q[1]);
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 1e-4) P.car.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
    // a double flash of one set, then of the other (as the responders' lights)
    const c = (time % RESP_FLASH_S) / RESP_FLASH_S;
    const on = [c < 0.08 || (c > 0.16 && c < 0.24), (c > 0.5 && c < 0.58) || (c > 0.66 && c < 0.74)];
    P.sets.forEach((s, i) => {
      s.mat.color.setScalar(on[i] ? 1 : 0.16);
      s.glow.visible = on[i];
      s.glow.material.size = 2.2 + 2.8 * dark;
      s.glow.material.opacity = 0.5 + 0.5 * dark;
    });
  },

  updateSmoke(fl, sm, time) {
    this.smoke.visible = !!sm;
    if (!sm) return;
    const age = time - sm.t0;
    const fade = 1 - smoothstep(INCIDENT.SMOKE_S - 2, INCIDENT.SMOKE_S, age);
    const Z = Math.max(fl.dims.len, fl.dims.span);
    const big = clamp(Z / 40, 0.6, 1.8);
    this.puffs.forEach((m, i) => {
      // each puff born in turn, rising and spreading, drifting a little on its own way
      const t = age - i * SMOKE_LIFE_S / SMOKE_PUFFS;
      if (t < 0) { m.material.opacity = 0; return; }
      const life = (t % SMOKE_LIFE_S) / SMOKE_LIFE_S;
      const ang = i * 2.4;
      m.position.set(sm.x + Math.sin(ang) * life * 5 * big, sm.y + life * 22 * big, sm.z + Math.cos(ang) * life * 5 * big);
      const s = (7 + life * 20) * big;
      m.scale.set(s, s, 1);
      m.material.opacity = 0.85 * Math.sin(Math.PI * Math.min(1, 0.12 + life * 1.05)) * fade;
    });
    const f = this.fire;
    f.position.set(sm.x, sm.y + 1.5, sm.z);
    const flick = 0.75 + 0.25 * Math.sin(time * 23) * Math.sin(time * 9.7);
    f.scale.set(9 * big * flick, 7 * big * flick, 1);
    f.material.opacity = (sm.fire ? 0.85 : 0) * fade * flick;
  }
};

// a soft round puff of smoke: white in the middle, thinning to nothing at the edge (the sprite tints it)
function smokeCanvas() {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 128;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)');
  gr.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return cv;
}
