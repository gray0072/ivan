'use strict';

// ============================================================
// World Aviation — the ground crew's ways round a parked aeroplane,
// kept clear of it (plain geometry, no drawing), in the airport's
// stand frame: t along the apron, across towards the terminal. A
// pose puts the aeroplane in it: its centre (t, a) and its nose's
// direction (ft, fa); its own axes are x (+ the left wing) and z
// (+ the nose), as modelLayout's.
//   - parts(ac): the aeroplane seen from above — the fuselage, the
//     engines (a turboprop's nacelles with their propellers), each
//     wing in SERVICE.WING_PANELS panels from the root to the tip and
//     the tailplane — as convex outlines, each with the height of its
//     underside above the ground: a vehicle passes under a part only
//     with SERVICE.HEAD_M of headroom (a big jet's outer wing: a
//     baggage train, not the catering truck), never through it
//   - lane(...): the nearest lane down the side for a vehicle that
//     comes in square to the fuselage (the belt loader, the catering
//     truck, the stairs, the cargo loader): first one that never
//     passes under the aeroplane — outside the wingtip for a place
//     behind the wing — then, where the stand next door leaves no room
//     for that, one that fits under the outer wing
//   - place(...): a place in square to the fuselage clear of the
//     engines and the wing (a freighter's main-deck loader under the
//     door painted over the wing root stood in the engine): it moves
//     along the fuselage to the nearest clear one
//   - fuel(...): the fuel truck's lane and stop: down the side
//     straight from the road between the engines, under the wing to
//     the middle of its chord if it fits, else up to its leading
//     edge — the one vehicle that goes under the wing
//   - trainWay(...): the baggage trains' way past the belt loader:
//     down an inner lane, round behind the tail and up beside the
//     loader; back out behind the wing and up an outer lane (keeping
//     right both ways; one lane where two do not fit), clear of the
//     fuel truck
// Used by Turnaround3D, Baggage (baggage3d.js) and Apron3D (where
// the parked aeroplanes' fuel trucks stand).
// ============================================================

const Servicing = {
  cache: new Map(),           // aircraft id -> its parts
  sizes: new Map(),           // vehicle model name -> its size

  // a stand's own pose: on its centre line where an aeroplane len metres long parks
  // (World.standAcross; a parked one, no len: at LAYOUT.STAND), nose to the terminal
  standPose(gate, len) { return { t: gate.t, a: World.standAcross(len), ft: 0, fa: 1 }; },
  // a point of the aeroplane's axes in the frame ([t, across]), and a frame point in its axes
  at(p, x, z) { return [p.t + x * p.fa + z * p.ft, p.a - x * p.ft + z * p.fa]; },
  local(p, t, a) {
    const dt = t - p.t, da = a - p.a;
    return { x: dt * p.fa - da * p.ft, z: dt * p.ft + da * p.fa };
  },
  // z where the line x of the aeroplane's axes crosses the frame's line across = a0
  zAt(p, x, a0) { return (a0 - p.a + x * p.ft) / p.fa; },

  // half the room a stand has along the apron: to halfway to the next stand
  room(a, gate) {
    let r = 60;
    for (const g of a.gates) if (g !== gate) r = Math.min(r, Math.abs(g.t - gate.t) / 2);
    return r;
  },

  // a vehicle model's size from its origin: half its width, its height, its front and its back
  size(name, model) {
    let s = this.sizes.get(name);
    if (!s) {
      const k = kit();
      model(k);
      const m = k.mesh(new THREE.MeshBasicMaterial());
      const b = new THREE.Box3().setFromObject(m);
      m.geometry.dispose();
      s = { w: Math.max(-b.min.x, b.max.x), h: b.max.y, front: b.max.z, rear: -b.min.z };
      this.sizes.set(name, s);
    }
    return s;
  },

  parts(ac) {
    let c = this.cache.get(ac.id);
    if (c) return c;
    const lay = modelLayout(ac), look = ac.look || {}, g = lay.gearH, list = [];
    const put = (kind, pts, under) => {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      list.push({ kind, pts, under, x0, x1, z0, z1 });
    };
    const box = (kind, x0, x1, z0, z1, under) => put(kind, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], under);
    // the fuselage and the engines down to the ground (nothing passes under them)
    box('body', -lay.halfW, lay.halfW, -lay.L / 2, lay.L / 2, 0);
    for (const e of lay.engines) box('engine', e.x - e.dia / 2, e.x + e.dia / 2, e.z - e.len * 0.6, e.z + e.len * 0.5, 0);
    if (look.engines === 'rear2') {
      const dia = lay.R * 2 * 0.48, x = lay.R + dia * 0.75, z = -lay.L * 0.24;
      for (const s of [1, -1]) box('engine', s * x - dia / 2, s * x + dia / 2, z - dia * 1.1, z + dia * 1.1, 0);
    } else if (!lay.engines.length) {
      // a turboprop's nacelles (render/models.js) and the discs of its propellers
      const f = 0.3, x = lay.spanAt(f), dia = lay.R * 2 * 0.42;
      const propR = Math.max(dia / 2, Math.min(lay.R * 2 * 0.65, (x - lay.R) * 0.9));
      const nz = lay.leAt(f) - lay.rootC * 0.25;
      for (const s of [1, -1]) box('engine', s * x - propR, s * x + propR, nz - lay.rootC * 1.1, nz + lay.rootC * 0.75 + dia * 0.7, 0);
    }
    // the wings, panel by panel: each as low as its lower end
    const n = SERVICE.WING_PANELS;
    const tRoot = lay.rootC * (lay.jet ? 0.12 : 0.15), tTip = lay.tipC * (lay.jet ? 0.09 : 0.12);
    const chord = (f) => lay.rootC + (lay.tipC - lay.rootC) * f;
    const under = (f) => g + lay.yAt(f) - (tRoot + (tTip - tRoot) * f) * 0.5;
    for (const s of [1, -1]) {
      for (let i = 0; i < n; i++) {
        const f0 = i / n, f1 = (i + 1) / n, x0 = s * (i ? lay.spanAt(f0) : 0), x1 = s * lay.spanAt(f1);
        put('wing', [[x0, lay.leAt(f0)], [x1, lay.leAt(f1)], [x1, lay.leAt(f1) - chord(f1)], [x0, lay.leAt(f0) - chord(f0)]],
          Math.min(under(f0), under(f1)));
      }
    }
    // the tailplane (a T-tail's on top of the fin)
    const ty = lay.tTop ? lay.finY + lay.finH : lay.tailY, tLe = lay.tailZ - lay.tSemi * Math.tan(lay.tSweep);
    for (const s of [1, -1]) {
      put('tail', [[0, lay.tailZ], [s * lay.tSemi, tLe], [s * lay.tSemi, tLe - lay.tTip], [0, lay.tailZ - lay.tRoot]], g + ty - 0.6);
    }
    c = { list, lay };
    this.cache.set(ac.id, c);
    return c;
  },

  // the distance from a point to a convex outline (0 inside)
  polyDist(pts, x, z) {
    let inside = true, sign = 0, best = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % pts.length];
      const ex = x1 - x0, ez = z1 - z0, l2 = ex * ex + ez * ez;
      if (l2 < 1e-9) continue;
      const c = ex * (z - z0) - ez * (x - x0);
      if (Math.abs(c) > 1e-9) { if (!sign) sign = Math.sign(c); else if (Math.sign(c) !== sign) inside = false; }
      const k = clamp(((x - x0) * ex + (z - z0) * ez) / l2, 0, 1);
      best = Math.min(best, Math.hypot(x - x0 - ex * k, z - z0 - ez * k));
    }
    return inside ? 0 : best;
  },

  // How far frame points [t, across] of a vehicle (size: its half width w and height h) keep off
  // the aeroplane in pose p and off the vehicles standing there, less the pads: >= 0 is clear.
  // o: strict (off every part, passing under none), bodies (the vehicles), floor (stops looking
  // below it), kinds (only the parts of these kinds: body, engine, wing, tail).
  margin(ac, p, pts, size, o) {
    const parts = this.parts(ac).list, w = size.w, reach = w + SERVICE.PAD_M, floor = o.floor === undefined ? -Infinity : o.floor;
    let m = Infinity;
    for (const [t, a] of pts) {
      const q = this.local(p, t, a);
      for (const part of parts) {
        if (o.kinds && o.kinds.indexOf(part.kind) < 0) continue;
        if (!o.strict && part.under >= size.h + SERVICE.HEAD_M) continue;
        if (q.x < part.x0 - reach - 4 || q.x > part.x1 + reach + 4 || q.z < part.z0 - reach - 4 || q.z > part.z1 + reach + 4) continue;
        m = Math.min(m, this.polyDist(part.pts, q.x, q.z) - reach);
      }
      for (const b of o.bodies || []) {
        for (const bp of this.bodyPts(b)) m = Math.min(m, Math.hypot(bp[0] - t, bp[1] - a) - w - b.w - SERVICE.BODY_PAD_M);
      }
      if (m < floor) return m;
    }
    return m;
  },
  // the samples of a track (makeTrack, baggage3d.js) a metre apart, as frame points
  trackPts(track) {
    const out = [];
    for (let i = 0; i < track.T.length; i += 2) out.push([track.T[i], track.A[i]]);
    return out;
  },
  // a vehicle standing still: its centre, the way it faces, its front, its back and half its
  // width (a body), and the points along it a metre apart
  body(t, a, ut, ua, size) { return { t, a, ut, ua, front: size.front, rear: size.rear, w: size.w }; },
  bodyPts(b) {
    const out = [];
    for (let k = -b.rear; k <= b.front + 1e-6; k += Math.max(1, (b.front + b.rear) / 8)) out.push([b.t + b.ut * k, b.a + b.ua * k]);
    return out;
  },

  // The lane (its distance from the aeroplane's axis, oMin to oMax, every SERVICE.STEP_M) for a
  // vehicle coming down the side to a place it comes in square to: way(o) gives the corners of
  // its way in the frame. The nearest one that keeps off every part, else the nearest one that
  // passes under the aeroplane with the headroom, else the one that keeps furthest off.
  lane(ac, p, oMin, oMax, size, way) {
    let best = oMin, bestM = -Infinity;
    for (const strict of [true, false]) {
      for (let o = oMin; o <= oMax + 1e-6; o += SERVICE.STEP_M) {
        const pts = this.trackPts(makeTrack(way(o)));
        const m = this.margin(ac, p, pts, size, { strict, floor: strict ? 0 : bestM });
        if (m >= 0) return o;
        if (!strict && m > bestM) { bestM = m; best = o; }
      }
    }
    return best;
  },

  // A place in square to the fuselage on side s, x out from the axis, near z0 along it (the
  // vehicle facing the fuselage): the nearest within SERVICE.PLACE_SHIFT_M where it stands
  // clear of the engines, the wing and the tailplane (it reaches the fuselage itself: its door)
  place(ac, p, s, x, z0, size) {
    for (let k = 0; k <= 2 * SERVICE.PLACE_SHIFT_M; k++) {
      const z = z0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2), pts = [];
      for (let d = -size.front; d <= size.rear + 1e-6; d += 1) pts.push(this.at(p, s * (x + d), z));
      if (this.margin(ac, p, pts, size, { kinds: ['engine', 'wing', 'tail'], floor: 0 }) >= 0) return z;
    }
    return z0;
  },

  // The fuel truck's lane (o out from the axis on side s, near o0) and where it stops (z, its
  // centre, facing the tail) coming down from across = road: in front of the wing, between the
  // engines, as far as it fits — under the wing to the middle of its chord, or up to its leading
  // edge. null: no lane near o0 brings it to the wing.
  fuel(ac, p, s, o0, size, road) {
    const lay = this.parts(ac).lay;
    for (let k = 0; k <= 2 * SERVICE.FUEL_SHIFT_M; k++) {
      const o = o0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2);
      if (o < lay.R + size.w + SERVICE.PAD_M + 1 || o > lay.S / 2 - 1) continue;
      const f = (o - lay.R * 0.8) / lay.semi, mid = lay.leAt(f) - (lay.rootC + (lay.tipC - lay.rootC) * f) / 2;
      for (let z = this.zAt(p, s * o, road) - 12; z > -lay.L / 2; z -= 0.5) {
        if (z <= mid) return { o, z: mid };
        const pts = [];
        for (let d = -size.front; d <= size.rear + 1e-6; d += 1) pts.push(this.at(p, s * o, z + d));
        if (this.margin(ac, p, pts, size, { floor: 0 }) >= 0) continue;
        // (stopped by the wing, not by an engine or the tailplane: there)
        if (this.margin(ac, p, pts, size, { kinds: ['body', 'engine', 'tail'], floor: 0 }) >= 0) return { o, z: z + 0.5 };
        break;
      }
    }
    return null;
  },

  // The baggage trains' way to the belt loader at zHold (the aeroplane's axes, its right side):
  // { xStop, zStop, zBot, oDown, oUp, zTurn } — down the lane oDown out from the axis to zBot
  // behind the tail, in to xStop and up to zStop beside the loader; back on to zTurn, out to the
  // lane oUp (outside the down lane: keeping right) and up it to the road. Clear of the fuel
  // truck standing there (bodies); null: none fits the room (room: the stand's half width).
  trainWay(ac, p, zHold, room, size, road, bodies) {
    const lay = this.parts(ac).lay;
    const xStop = lay.R + SERVICE.TRAIN_STOP_OUT_M, zStop = zHold - 6, zBot = zStop - 17;
    const at = (x, z) => this.at(p, -x, z);
    // (two lanes; where they do not fit the room — the An-225 is wider than the stand — one, both ways)
    for (const [strict, apart] of [[true, 2 * BAG_LANE], [false, 2 * BAG_LANE], [false, 0]]) {
      for (let oDown = lay.R + SERVICE.TRAIN_DOWN_M; oDown + apart + size.w + 1 <= room; oDown += SERVICE.STEP_M) {
        const down = makeTrack([at(oDown, this.zAt(p, -oDown, road)), at(oDown, zBot), at(xStop, zBot), at(xStop, zStop)]);
        if (this.margin(ac, p, this.trackPts(down), size, { strict, bodies, floor: 0 }) < 0) continue;
        const oUp = oDown + apart;
        for (let dz = SERVICE.TRAIN_TURN_M[0]; dz >= SERVICE.TRAIN_TURN_M[1]; dz--) {
          const zTurn = zStop + dz;
          const up = makeTrack([at(xStop, zStop), at(xStop, zTurn), at(oUp, zTurn), at(oUp, this.zAt(p, -oUp, road))]);
          if (this.margin(ac, p, this.trackPts(up), size, { strict, bodies, floor: 0 }) >= 0) return { xStop, zStop, zBot, oDown, oUp, zTurn };
        }
      }
    }
    return null;
  }
};
