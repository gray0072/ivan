'use strict';

// ============================================================
// World Aviation — the other aeroplanes of a flight in 3D (three.js)
//
// Each of AirTraffic's movers (sim/traffic.js) as the type's model in
// its airline's paint (AircraftModels.build), built when the flight
// starts (behind the boot screen: prepare) for every one the flight
// may see, its still parts baked into a mesh per material
// (AircraftModels.bake: the flaps set first as it flies them, the
// take-off's or the landing's) — the gear (each leg baked on its own),
// the propellers, the fans and the lights kept apart, as they move:
// the gear folds after the take-off,
// the propellers spin, the lights come on as its crew has them
// (AirTraffic.lightsFor). The push back's tug at the nose of the
// departure ahead, solid like the apron's other vehicles (a vehicle
// of sim/collide.js). Out of sight (past VIEW_M) a model is hidden.
// The points along each one's body on the ground at an airport are
// handed to the apron's vehicles, which give way to them (around:
// Traffic in render/baggage3d.js).
// Used by Scene3D.update and game.js.
// ============================================================

const TRAFFIC_VIEW_M = 30000;      // a model further than this from the eye is hidden

const Traffic3D = {
  scene: null,
  models: new Map(),   // a plan entry (AirTraffic.plan's dep, ahead, behind) -> { model, tug, tugV }

  // a flight's models, hidden until their mover is about
  prepare(scene, traffic) {
    this.clear();
    this.scene = scene;
    const plan = traffic.plan;
    if (!plan) return;
    for (const p of [plan.dep, plan.ahead, plan.behind]) if (p) this.build(p);
  },
  build(p) {
    if (this.models.has(p)) return this.models.get(p);
    const model = AircraftModels.build(p.ac, { airline: p.airline });
    // the flaps as it flies them, then the parts that never move against the body baked
    AircraftModels.animate(model, { gear: 1, flaps: p.kind === 'dep' ? 0.35 : 1, propSpeed: 0 });
    AircraftModels.bake(model, { surfaces: false, tag: 'traffic' });
    model.visible = false;
    this.scene.add(model);
    const rec = { model, tug: null, tugV: null, a: p.a };
    if (p.start === 'stand') {
      rec.tug = Apron3D.makeTug();
      rec.tug.visible = false;
      this.scene.add(rec.tug);
    }
    this.models.set(p, rec);
    return rec;
  },
  clear() {
    for (const rec of this.models.values()) {
      for (const o of [rec.model, rec.tug]) {
        if (!o) continue;
        if (o.parent) o.parent.remove(o);
        // (the liveries are AircraftModels' own, kept for the next one in that paint)
        o.traverse((c) => { if (c.geometry) c.geometry.dispose(); });
      }
      if (rec.tugV) Collide.dropVehicle(rec.a, rec.tugV);
    }
    this.models.clear();
  },

  // each frame: the movers where they are, their gear, propellers and lights; the tug (fl: the
  // flight drawn — another one's, as the hangar's look round an aircraft, shows none)
  update(fl, time, dark, eye) {
    const seen = new Set();
    for (const m of fl === AirTraffic.fl && this.scene ? AirTraffic.movers : []) {
      const rec = this.build(m.p);
      seen.add(rec);
      const o = rec.model;
      o.visible = !m.gone && Math.hypot(m.x - eye.x, m.y - eye.y, m.z - eye.z) < TRAFFIC_VIEW_M;
      if (o.visible) {
        o.position.set(m.x, m.y, m.z);
        o.rotation.set(-m.pitch, Math.PI - m.hdg, 0, 'YXZ');
        const spin = m.engines ? 0.35 + 0.6 * m.power : 0;
        AircraftModels.animate(o, { gear: m.gear, propSpeed: spin, lights: m.lights, time, dark });
      }
      this.updateTug(rec, m);
    }
    // a mover gone (flown away): its model hidden
    for (const rec of this.models.values()) if (!seen.has(rec)) { rec.model.visible = false; if (rec.tug) rec.tug.visible = false; }
  },
  // the tug: at the nose through the push back, then back at the stand; solid where it is
  updateTug(rec, m) {
    if (!rec.tug) return;
    const q = m.tug;
    rec.tug.visible = !!q;
    if (!q) return;
    rec.tug.position.set(q.x, m.a.elev, q.z);
    rec.tug.rotation.y = q.ry;
    rec.tug.userData.bar.rotation.y = q.bar || 0;
    Apron3D.towBarTo(rec.tug, m.tugFrom ? null : m.p.ac);
    if (!rec.tugV) rec.tugV = Collide.vehicle(m.a, 'tug', null);
    Collide.placeVehicleWorld(rec.tugV, q.x, q.z, q.ry);
  },

  // the movers on the ground at the airport of rec, as the apron's vehicles see them:
  // [{ who, pieces }] (Traffic.around in render/baggage3d.js)
  around(rec) {
    const out = [];
    for (const m of AirTraffic.movers) if (!m.gone && m.onGround && m.a === rec.a) out.push({ who: m, pieces: AirTraffic.pieces(m) });
    return out;
  }
};
