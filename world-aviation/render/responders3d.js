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
//     sends them further out to the side; on a side side by side from
//     the fuselage out, each a gap beyond the one inside it as that one
//     really stands, the FOLLOW ME car (followme3d.js) outermost (layout)
//   - they drive there from where they are kept, when they are called:
//     the fire engine and the police car out of the airport's fire
//     station, the ambulance out of the air ambulance's hangar (both in
//     the general aviation and rescue area, ga3d.js), along the apron's
//     service road keeping right and round into their places; a flight
//     with a patient on board has its ambulance called from the start
//     (Flight.meet). On the way they wait for any vehicle just ahead of
//     them (Traffic in baggage3d.js), and the others for them
//   - their blue lights flash in double flashes, each vehicle on its
//     own beat, with a glow round every lamp that grows at night
//   - once the aeroplane is parked, one standing on the way of a ground
//     crew's vehicle (render/turnaround3d.js: the fuel truck down the
//     right side of a turboprop, the stairs at the front door) backs up
//     onto the service road and drives off along it, away from the
//     stand on its own side and keeping right; the crew's vehicle waits
//     until it is off its way (leave, clear)
//
// Built into the arrival airport's frame (Airport3D's rec.frame,
// x = across, z = -t), so they go when the airport goes.
// Used by Scene3D.update.
// ============================================================

const RESP_GAP = 1.5;           // from the wing or an engine's intake to a vehicle's back, metres
const RESP_FRONT = 19;          // a vehicle's front at most this far past the stand towards the terminal (the service road's lane: 21)
const RESP_FLASH_S = 0.9;       // one cycle of the lights: a double flash on one side, then on the other
const RESP_BLUE = '#3f7dff';
const RESP_SPEED_K = 2.2;       // they drive this many times as fast as a baggage train (makeTrack's speeds)
const RESP_BACK_K = 0.45;       // ... backing up, this share of that
const RESP_LEAVE_S = 1.5;       // one in the crew's way sets off this long after the aeroplane is parked ...
const RESP_CLEAR_M = 20;        // ... and is off the crew's way this far along the road

// the vehicles: the side of the aeroplane (+1 left, -1 right), how far out from the fuselage they
// stand at the nearest (the police car beyond the ambulance when both are there: layout), their
// width and length, and the blue lamps in their own frame (forward +z), in two sets that flash in
// turn (the order of the kinds is their order from the fuselage out on a side)
const RESP_KINDS = {
  ambulance: {
    side: 1, out: 3.5, w: 2.4, len: 6.2, model: (k) => Vehicles.ambulance(k),
    lamps: [[[-0.6, 2.4, 1.6], [-1.0, 2.86, 0.75], [1.0, 2.86, -2.95]], [[0.6, 2.4, 1.6], [1.0, 2.86, 0.75], [-1.0, 2.86, -2.95]]]
  },
  police: {
    side: 1, out: 3.5, w: 1.8, len: 4.6, model: (k) => Vehicles.policeCar(k),
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
      // (those already on their way, or there, stay where they are when another one is called)
      rec.respDrive = r.fl === fl && r.gate === gate ? { fl, gate, s: Object.fromEntries(r.vehicles.map((v) => [v.kind, v.s])) } : null;
      rec.frame.remove(r.group);
      for (const v of r.vehicles) Collide.dropVehicle(rec.a, v.solid);
      r.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      rec.responders = null;
    }
    if (!key) return;
    if (!rec.responders) rec.responders = this.build(rec, fl, gate, key);
    // on their way: along the track out of the depot, slowing for the turns
    const dt = clamp(time - (rec.responders.time === undefined ? time : rec.responders.time), 0, 0.2);
    rec.responders.time = time;
    for (const v of rec.responders.vehicles) {
      if (v.gone) continue;
      if (v.track && v.s < v.track.len) {
        // (a baggage train, the FOLLOW ME car or another one just ahead: wait for it)
        if (this.held(rec, v, v.track, v.s, dt)) continue;
        v.s = Math.min(v.track.len, v.s + dt * trackSpeed(v.track, v.s) * RESP_SPEED_K);
        this.pose(v);
      } else if (v.leave && time >= v.leave.at) this.leaveStep(rec, v, dt);
      else v.waitFor = null;
    }
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
    const places = this.layout(lay, kinds);
    const sa = World.standAcross(fl.dims.len);          // (where the aeroplane parks)
    const body = new THREE.MeshLambertMaterial({ vertexColors: true });
    const vehicles = [];
    kinds.forEach((kind, n) => {
      const spec = RESP_KINDS[kind];
      const p = places[kind];
      const k = kit();
      spec.model(k);
      const mesh = k.mesh(body);
      // (facing out to the apron: forward = -across)
      const holder = new THREE.Group();
      holder.position.set(sa + p.z, 0, -(gate.t + spec.side * p.y));
      holder.rotation.y = -Math.PI / 2;
      holder.add(mesh);
      // the way there from its depot: out onto the service road's lane that keeps right going
      // its way (from the GA area at the far end of the apron: the stands' side), along it and
      // round into its place, facing out to the apron
      const from = Ga3D.depot(rec.a, kind), tEnd = gate.t + spec.side * p.y, aEnd = sa + p.z;
      const lane = from ? LAYOUT.SERVICE_ROAD + (Math.sign(tEnd - from[0]) || -1) * BAG_LANE : 0;
      const track = from ? makeTrack([from, [from[0], lane], [tEnd, lane], [tEnd, aEnd]]) : null;
      const was = rec.respDrive && rec.respDrive.fl === fl && rec.respDrive.gate === gate ? rec.respDrive.s[kind] : undefined;
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
      // (solid for the own aeroplane: sim/collide.js)
      const v = { kind, sets, phase: n * 0.37, holder, track, s: track ? (was !== undefined ? was : 0) : 0, a: rec.a, solid: Collide.vehicle(rec.a, kind),
        side: spec.side, spot: { t: tEnd, across: aEnd, ht: spec.w / 2, ha: spec.len / 2 }, leave: null, gone: false, stuck: 0, waitFor: null };
      if (track) this.pose(v);
      else Collide.placeVehicle(v.solid, rec.a, holder.position.x, holder.position.z, holder.rotation.y);
      vehicles.push(v);
    });
    rec.frame.add(group);
    return { fl, gate, key, group, vehicles };
  },

  // a vehicle at s along a track (its own way there, or tr), turned the way it goes — back to front
  // when it backs up (in the airport's frame: x across, z -t)
  pose(v, tr, s, back) {
    tr = tr || v.track; s = s === undefined ? v.s : s;
    const q = trackAt(tr, s), b = trackAt(tr, Math.max(0, s - 1)), f = trackAt(tr, Math.min(tr.len, s + 1));
    v.holder.position.set(q.across, 0, -q.t);
    if (Math.hypot(f.t - b.t, f.across - b.across) > 1e-3) v.holder.rotation.y = Math.atan2(f.across - b.across, -(f.t - b.t)) + (back ? Math.PI : 0);
    if (v.solid) Collide.placeVehicle(v.solid, v.a, v.holder.position.x, v.holder.position.z, v.holder.rotation.y);
  },

  // the responders waiting at the arrival stand of the flight (none gone)
  waiting(rec, fl) {
    const r = rec && rec.responders;
    return r && r.fl === fl ? r.vehicles.filter((v) => !v.gone) : [];
  },
  // v off the stand: backing up from its place onto the service road's lane that keeps right going
  // away from the stand on its own side (the left one towards +t), its back swinging the other
  // way so it ends up facing along the road, then on along it TURNAROUND.FROM_M and gone
  leave(v, time) {
    if (v.leave) return;
    const u = v.side, road = LAYOUT.SERVICE_ROAD + u * BAG_LANE, p = v.spot;
    v.leave = {
      at: time + RESP_LEAVE_S, stage: 0, s: 0,
      back: makeTrack([[p.t, p.across], [p.t, road - 5], [p.t - u * 9, road]]),
      away: makeTrack([[p.t - u * 9, road], [p.t + u * TURNAROUND.FROM_M, road]])
    };
  },
  leaveStep(rec, v, dt) {
    const L = v.leave, tr = L.stage ? L.away : L.back;
    if (this.held(rec, v, tr, L.s, dt)) return;
    L.s = Math.min(tr.len, L.s + dt * trackSpeed(tr, L.s) * RESP_SPEED_K * (L.stage ? 1 : RESP_BACK_K));
    this.pose(v, tr, L.s, !L.stage);
    if (L.s < tr.len) return;
    if (!L.stage) { L.stage = 1; L.s = 0; return; }
    v.gone = true;
    v.holder.visible = false;
    Collide.dropVehicle(v.a, v.solid);
    v.solid = null;
  },
  // off the way of the crew: gone, or that far along the road
  clear(v) { return v.gone || (!!v.leave && v.leave.stage === 1 && v.leave.s > RESP_CLEAR_M); },
  // the points along its body the crew's vehicles keep clear of: where it stands, or drives
  pieces(v) {
    const h = v.holder, ry = h.rotation.y, fa = Math.sin(ry), ft = -Math.cos(ry), half = RESP_KINDS[v.kind].len / 2;
    return [-1, -0.5, 0, 0.5, 1].map((k) => ({ t: -h.position.z + ft * k * half, across: h.position.x + fa * k * half }));
  },
  // something just ahead of v on its way (track tr, v at s along it: Traffic.ahead), a baggage
  // train, a ground crew's vehicle, the FOLLOW ME car or another one of them: true while it waits
  // for it, at most TURNAROUND.WAIT_MAX_S
  held(rec, v, tr, s, dt) {
    const half = RESP_KINDS[v.kind].len / 2;
    const who = Traffic.ahead(v, Traffic.around(rec, v), (d) => trackAt(tr, s + d), half + 1,
      Math.min(half + TURNAROUND.LOOK_M, tr.len - s + half), TURNAROUND.GAP_M);
    v.stuck = who ? v.stuck + dt : 0;
    return v.stuck > 0 && v.stuck < TURNAROUND.WAIT_MAX_S;
  },

  // Where the vehicles waiting beside the stand stand: { kind: { z, y, side } } (as place) for the
  // kinds of meet that are responders and, with fmSide (+1 left, -1 right), the FOLLOW ME car
  // ('followMe', followme3d.js) on that side. On each side they stand side by side from the
  // fuselage out — the ambulance nearest, the police car beyond it, the FOLLOW ME car outermost —
  // each STAND_SIDE_GAP_M beyond the one inside it as that one really stands (place moves a long
  // one out past a swept wing), so none stands in another nor on another's way up to its place
  // from the apron lane or away from it to the service road.
  layout(lay, meet, fmSide) {
    const list = Object.keys(RESP_KINDS).filter((k) => (meet || []).indexOf(k) >= 0).map((k) => Object.assign({ kind: k }, RESP_KINDS[k]));
    if (fmSide) list.push({ kind: 'followMe', side: fmSide, out: RESP_KINDS.ambulance.out, w: FOLLOW_ME.CAR_W, len: FOLLOW_ME.CAR_LEN });
    const out = {}, edge = { 1: -Infinity, '-1': -Infinity };      // (the outer side of the last one placed on each side)
    for (const v of list) {
      const p = this.place(lay, Math.max(lay.R + v.out, edge[v.side] + STAND_SIDE_GAP_M), v.w, v.len);
      out[v.kind] = { z: p.z, y: p.y, side: v.side };
      edge[v.side] = p.y + v.w / 2;
    }
    return out;
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
