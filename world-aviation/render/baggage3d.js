'use strict';

// ============================================================
// World Aviation — the baggage trains on the apron (three.js), in
// the airport's frame like apron3d.js (x = across, towards the
// terminal; z = -t):
//
//   - every terminal has a baggage hall with a door in its front, at
//     the end of the building (the cargo terminal or shed one for the
//     freight: its trains pull container dollies, a container on each
//     instead of a cart of bags); its trains (a tractor and three carts)
//     come out of it and drive along the service road between the
//     stands and the building, keeping right, then turn off between
//     two stands to the aft hold of a parked aeroplane: down past the
//     belt loader, round in a U-turn and up beside it, stopping there
//     facing out, ready to leave
//   - a train takes the bags out to a departure and comes back empty,
//     or goes out empty to an aeroplane that has come in and brings
//     its bags back; while it waits at the stand the bags go on or off
//     the carts one by one. The player's own aeroplane, parked at its
//     stand, is served too (bags out before the departure, in after
//     the arrival)
//   - every corner is rounded and the carts follow the tractor's
//     track, so a train bends through a turn; it slows down for the
//     turns, pulls away and stops smoothly
//   - a train gives way to the player's aeroplane while it moves
//     (Apron3D.blocked) and waits for another train in its way
//
// The trains never go near the taxiway or the apron lane.
// Used by Apron3D.build / update.
// ============================================================

const BAG_SPEED = 6.5;            // a train on a straight, m/s
const BAG_TURN_SPEED = 2.6;       // ... in a turn
const BAG_ACCEL = 1.0, BAG_BRAKE = 1.4;   // m/s²
const BAG_TURN_R = 7;             // the radius of a train's turns, metres
const BAG_LANE = 3.5;             // a lane of the service road from its middle (keep right)
const BAG_CART_Z = [-3.4, -6.7, -10.0];  // the carts' centres behind the tractor's, metres along its track
const BAG_LOAD_S = [22, 40];      // the time a train waits at the stand, s
const BAG_HALL_S = [6, 22];       // ... and in the hall between two trips
const BAG_STEP = 0.5;             // the track is sampled every this many metres

const Baggage = {
  // the trains of an airport. stands[i]: { t, hold, R, parked } for gate i (hold: across of
  // the aft hold, R: the fuselage's radius, parked: an aeroplane stands there), front: the
  // terminal's glass, road: the middle of the service road
  build(a, rec, at, stands, front, road, rng) {
    rec.bagStands = stands;
    rec.trains = [];
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const terms = [...new Set(a.gates.map((g) => g.terminal))];
    const doors = kit();
    for (const term of terms) {
      const gs = a.gates.filter((g) => g.terminal === term);
      const hall = { t: gs[0].t - 42, term, cargo: term === 'C' };
      // the door: a dark opening in a yellow frame, out from the window frames
      doors.box(0.3, 5.2, 9.0, front - 1.15, 2.6, -hall.t, '#e3b51c').box(0.8, 4.6, 8.0, front - 1.0, 2.3, -hall.t, '#15191d');
      const served = gs.filter((g) => stands[g.index].parked).length;
      const n = Math.max(1, Math.min(3, Math.round(served * 0.7)));
      for (let i = 0; i < n; i++) rec.trains.push(this.makeTrain(at, mat, rng, hall, i));
    }
    // the follow-me car waits beside the first hall's door
    const h0 = rec.trains.length ? rec.trains[0].hall : null;
    if (h0) { doors.push(front - 4.2, 0, -(h0.t - 14), Math.PI); Vehicles.followMe(doors); doors.pop(); }
    at(doors.mesh(mat), 0, 0, 0);
    rec.bagFront = front; rec.bagRoad = road;
  },

  makeTrain(at, mat, rng, hall, i) {
    const tk = kit(); Vehicles.tractor(tk);
    // the beacon on the cab
    tk.box(0.3, 0.25, 0.3, 0, 2.3, -0.4, '#ff9a1a');
    const tractor = tk.mesh(mat);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute([-0.55, 0.8, 1.35, 0.55, 0.8, 1.35, 0, 2.45, -0.4], 3));
    lg.setAttribute('color', new THREE.Float32BufferAttribute([1, 0.95, 0.8, 1, 0.95, 0.8, 1, 0.55, 0.1], 3));
    const lights = new THREE.Points(lg, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, fog: true }));
    lights.visible = false;
    tractor.add(lights);
    at(tractor, 0, 0, 0);
    const carts = [], bags = [];
    for (const _ of BAG_CART_Z) {
      // (a container dolly and its container from the cargo hall, a cart and its bags from a terminal's)
      const ck = kit();
      if (hall.cargo) Vehicles.uldDolly(ck, 0, rng, false); else Vehicles.cartBase(ck, 0);
      const cart = ck.mesh(mat);
      const bk = kit();
      if (hall.cargo) Vehicles.uld(bk, 0, 0.65, 0, rng); else Vehicles.bags(bk, 0, rng);
      const b = bk.mesh(mat);
      cart.add(b);
      at(cart, 0, 0, 0);
      carts.push(cart); bags.push(b);
    }
    const tr = {
      hall, tractor, lights, carts, bags, state: 'hall', wait: 4 + i * 9 + rng.next() * 6,
      path: null, s: 0, v: 0, stuck: 0, stand: -1, load: 0, from: 0, to: 0, rng, pieces: []
    };
    this.show(tr, false);
    return tr;
  },

  show(tr, on) {
    tr.tractor.visible = on;
    for (const c of tr.carts) c.visible = on;
  },
  // the bags on the first n carts
  setLoad(tr, n) {
    tr.load = n;
    tr.bags.forEach((b, i) => { b.visible = i < Math.round(n); });
  },

  // which stands a train may go to now: an aeroplane parked there (one of the airport's, or
  // the player's own at a stand it uses this flight, at rest), no other train on its way there
  standFree(rec, i, own) {
    const s = rec.bagStands[i];
    if (rec.trains.some((tr) => tr.stand === i)) return null;
    const gate = rec.a.gates[i];
    if (s.inUse) {
      if (!own || Math.hypot(own.vt, own.va) > 0.3) return null;
      if (Math.hypot(own.t - gate.t, own.across - LAYOUT.STAND) > 15 || !(own.len > 15)) return null;
      return { t: gate.t, hold: LAYOUT.STAND - own.len * 0.22, R: own.rad, mission: own.landed ? 'in' : 'out' };
    }
    if (!s.parked) return null;
    return { t: s.t, hold: s.hold, R: s.R, mission: null };
  },

  // the track out of the hall to stand st and back: corners [t, across], rounded
  pathOut(rec, tr, st) {
    const front = rec.bagFront, road = rec.bagRoad, hall = tr.hall;
    const tStop = st.t - st.R - 10, tDown = tStop - 12;
    const aStop = st.hold - 6, aBot = aStop - 17;
    const dir = Math.sign(tDown - hall.t) || 1;
    const lane = road + dir * BAG_LANE, door = hall.t + dir * 2;    // (out through one half of the door)
    return makeTrack([[door, front + 10], [door, lane], [tDown, lane], [tDown, aBot], [tStop, aBot], [tStop, aStop]]);
  },
  pathBack(rec, tr, st) {
    const front = rec.bagFront, road = rec.bagRoad, hall = tr.hall;
    const tStop = st.t - st.R - 10, aStop = st.hold - 6;
    const dir = Math.sign(hall.t - tStop) || -1;
    const lane = road + dir * BAG_LANE, door = hall.t + dir * 2;    // (in through the other)
    return makeTrack([[tStop, aStop], [tStop, lane], [door, lane], [door, front + 10]]);
  },

  update(rec, dt, dark, own) {
    if (!rec.trains) return;
    const moving = own && Math.hypot(own.vt, own.va) > 0.3;
    for (const tr of rec.trains) {
      if (tr.state === 'hall') {
        tr.wait -= dt;
        if (tr.wait > 0) continue;
        // a stand to go to: one of this terminal's, at random
        const opts = [];
        rec.a.gates.forEach((g, i) => {
          if (g.terminal !== tr.hall.term) return;
          const st = this.standFree(rec, i, own);
          if (st) opts.push([i, st]);
        });
        if (!opts.length) { tr.wait = 5; continue; }
        const [i, st] = opts[(tr.rng.next() * opts.length) | 0];
        tr.stand = i; tr.st = st;
        tr.mission = st.mission || (tr.rng.next() < 0.5 ? 'in' : 'out');
        tr.path = this.pathOut(rec, tr, st);
        tr.s = 0; tr.v = 0; tr.stuck = 0; tr.state = 'out';
        this.setLoad(tr, tr.mission === 'out' ? 3 : 0);
        this.show(tr, true);
      } else if (tr.state === 'stand') {
        // the bags go on or off, cart by cart
        tr.wait -= dt;
        const k = clamp(1 - tr.wait / tr.waitAll, 0, 1);
        this.setLoad(tr, tr.from + (tr.to - tr.from) * clamp(k * 1.25 - 0.1, 0, 1));
        if (tr.wait <= 0) {
          tr.path = this.pathBack(rec, tr, tr.st);
          tr.s = 0; tr.v = 0; tr.stuck = 0; tr.state = 'back';
        }
      } else {
        const p = tr.path;
        // the speed: the limit of the track ahead, braking for the turns and the end
        let vl = trackSpeed(p, tr.s);
        const pos = (s) => trackAt(p, s);
        let hold = moving && Apron3D.blocked(own, tr.s, pos);
        if (!hold && this.inWay(rec, tr)) {
          tr.stuck += dt;
          hold = tr.stuck < 8;                      // (never locked for good)
        } else tr.stuck = 0;
        if (hold) vl = 0;
        tr.v = tr.v < vl ? Math.min(vl, tr.v + BAG_ACCEL * dt) : Math.max(vl, tr.v - BAG_BRAKE * 2.5 * dt);
        tr.s = Math.min(p.len, tr.s + tr.v * dt);
        if (tr.s >= p.len - 0.05) {
          if (tr.state === 'out') {
            tr.state = 'stand';
            tr.waitAll = tr.wait = BAG_LOAD_S[0] + tr.rng.next() * (BAG_LOAD_S[1] - BAG_LOAD_S[0]);
            tr.from = tr.load; tr.to = tr.mission === 'out' ? 0 : 3;
          } else {
            tr.state = 'hall'; tr.stand = -1;
            tr.wait = BAG_HALL_S[0] + tr.rng.next() * (BAG_HALL_S[1] - BAG_HALL_S[0]);
            this.show(tr, false);
            continue;
          }
        }
      }
      this.place(tr);
      tr.lights.visible = dark > 0.25;
    }
  },

  // the tractor on the track at s, each cart on it further back, turned along it
  place(tr) {
    const p = tr.path;
    tr.pieces.length = 0;
    const put = (mesh, s) => {
      const q = trackAt(p, s), b = trackAt(p, s - 1), f = trackAt(p, s + 1);
      mesh.position.set(q.across, 0, -q.t);
      mesh.rotation.y = Math.atan2(f.across - b.across, -(f.t - b.t));
      tr.pieces.push(q);
    };
    put(tr.tractor, tr.s);
    tr.carts.forEach((c, i) => put(c, tr.s + BAG_CART_Z[i]));
  },

  // another train just ahead on this one's track
  inWay(rec, tr) {
    for (let d = 2.5; d <= 8; d += 1.5) {
      const q = trackAt(tr.path, tr.s + d);
      for (const o of rec.trains) {
        if (o === tr || o.state === 'hall') continue;
        for (const pc of o.pieces) if (Math.hypot(pc.t - q.t, pc.across - q.across) < 2.6) return true;
      }
    }
    return false;
  }
};

// A track through the corners [t, across]: each corner rounded (a quadratic curve, tangent
// to both legs, BAG_TURN_R or less where the legs are short), sampled every BAG_STEP metres
// with the speed limit at each sample (slow in the turns, braking for them and to a stop at
// the end).
function makeTrack(corners) {
  const pts = [[corners[0][0], corners[0][1], 0]];       // t, across, in a turn
  for (let i = 1; i < corners.length; i++) {
    const c = corners[i];
    if (i === corners.length - 1) { pts.push([c[0], c[1], 0]); break; }
    const p = corners[i - 1], n = corners[i + 1];
    const l1 = Math.hypot(c[0] - p[0], c[1] - p[1]), l2 = Math.hypot(n[0] - c[0], n[1] - c[1]);
    const d = Math.min(BAG_TURN_R, l1 * 0.5, l2 * 0.5);
    if (d < 0.5) { pts.push([c[0], c[1], 0]); continue; }
    const a1 = [c[0] + (p[0] - c[0]) * d / l1, c[1] + (p[1] - c[1]) * d / l1];
    const a2 = [c[0] + (n[0] - c[0]) * d / l2, c[1] + (n[1] - c[1]) * d / l2];
    const m = Math.max(4, Math.ceil(d * 1.6));
    pts.push([a1[0], a1[1], 0]);                       // (the straight up to the turn is no turn)
    for (let k = 0; k <= m; k++) {
      const u = k / m, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
      pts.push([w0 * a1[0] + w1 * c[0] + w2 * a2[0], w0 * a1[1] + w1 * c[1] + w2 * a2[1], 1]);
    }
    pts.push([a2[0], a2[1], 0]);
  }
  // resample evenly
  const T = [], A = [], V = [];
  let acc = 0, len = 0;
  T.push(pts[0][0]); A.push(pts[0][1]); V.push(BAG_SPEED);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (l < 1e-6) continue;
    let s = BAG_STEP - acc;
    while (s <= l) {
      const k = s / l;
      T.push(p[0] + (q[0] - p[0]) * k); A.push(p[1] + (q[1] - p[1]) * k);
      V.push(p[2] && q[2] ? BAG_TURN_SPEED : BAG_SPEED);
      s += BAG_STEP;
    }
    acc = (acc + l) % BAG_STEP;
    len += l;
  }
  // brake for the turns and the end (creeping the last bit)
  V[V.length - 1] = 0.3;
  for (let i = V.length - 2; i >= 0; i--) V[i] = Math.min(V[i], Math.sqrt(V[i + 1] * V[i + 1] + 2 * BAG_BRAKE * BAG_STEP));
  return { T, A, V, len: (T.length - 1) * BAG_STEP };
}

// the point at s along a track (before its start and past its end: straight on along the
// first or the last leg, where the carts still are in the hall)
function trackAt(p, s) {
  const n = p.T.length - 1;
  let i = Math.floor(s / BAG_STEP);
  if (i < 0) i = 0; else if (i > n - 1) i = n - 1;
  const k = s / BAG_STEP - i;
  return { t: p.T[i] + (p.T[i + 1] - p.T[i]) * k, across: p.A[i] + (p.A[i + 1] - p.A[i]) * k };
}
function trackSpeed(p, s) {
  return p.V[clamp(Math.floor(s / BAG_STEP) + 1, 0, p.V.length - 1)];
}
