'use strict';

// ============================================================
// World Aviation — an airport in 3D (three.js)
//
// Everything is built in the airport's own frame: a group at the
// runway centre turned with the runway, local x = across (towards
// the terminal), local z = -t (t runs down the runway), y = up.
//
//   - the ground: one canvas texture with the grass (mown strips),
//     taxiways (shoulders, edge and centre lines), the apron (concrete
//     slabs, stands, a service road), the landside roads, the car
//     park and the perimeter road
//   - the runway: its own fine texture (concrete ends with joints,
//     asphalt, tyre marks, shoulders, blast pads with chevrons and
//     all the markings), edge, centreline, threshold and end lights,
//     an approach light system with a sequenced flasher and a working
//     PAPI that shows the glide path from where the camera is
//   - the buildings, and what makes each airport recognisable: its
//     name in big letters on the terminal roof (both sides), a welcome
//     banner with the city symbol and the flag, the national and the
//     city flags on the roof and on the tower (streaming downwind), the
//     home airlines' logos on the hangars, and their aeroplanes at the
//     gates (data/airports.js, data/airlines.js, art/)
//   - a windsock, the localiser array, the glideslope mast, signs
//   - the stands' bridges and vehicles, floodlights and traffic: apron3d.js
//   - the terminal's signs, the offices, hotel and car park behind it: landside3d.js
//   - at night (update's dark): lit windows, letters and banners
// ============================================================

const RWY_SHOULDER = 7.5;          // paved shoulder outside the runway edge line, metres
const RWY_BLAST = 60;              // blast pad before and after the runway, metres

const Airport3D = {
  // opts: { aniso, maxTex, hi } — anisotropy, the largest texture side, a high-detail ground
  build(a, opts) {
    const L = LAYOUT;
    const look = AIRPORT_LOOK[a.id] || ['star', '#2a5d8f'];
    const id = { symbol: look[0], color: look[1], airlines: airlinesAt(a) };
    // night: materials that light up after dark ({ mat, color, k }: emissive = color x dark x k)
    const rec = { a, id, textures: [], flags: [], parked: [], night: [], frame: null, group: null };

    const group = new THREE.Group();
    const frame = new THREE.Group();
    frame.position.set(a.x, a.elev, a.z);
    frame.rotation.y = -a.hdg;
    group.add(frame);
    rec.group = group; rec.frame = frame;
    const tex = (cv, aniso) => {
      const t = new THREE.CanvasTexture(cv);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = aniso || opts.aniso || 4;
      rec.textures.push(t);
      return t;
    };
    const at = (obj, t, across, y) => { obj.position.set(across, y || 0, -t); frame.add(obj); return obj; };
    const lambert = (color) => new THREE.MeshLambertMaterial({ color });

    // ---- the ground and the runway
    const gnd = makeGroundCanvas(a, id, opts.hi ? Math.min(4096, opts.maxTex) : 2048);
    // (both planes are cut into cells: the logarithmic depth buffer needs small triangles
    // close to the eye, or the terrain shows through)
    const ggeo = new THREE.PlaneGeometry(gnd.B, gnd.A, Math.ceil(gnd.B / 100), Math.ceil(gnd.A / 100));
    ggeo.rotateX(-Math.PI / 2);
    at(new THREE.Mesh(ggeo, new THREE.MeshLambertMaterial({ map: tex(gnd.cv), transparent: true })), gnd.tC, gnd.aC, 0.05);

    const rw = makeRunwayCanvas(a, Math.min(opts.hi ? 8192 : 4096, opts.maxTex));
    const rgeo = new THREE.PlaneGeometry(rw.W, rw.L, 1, Math.ceil(rw.L / 60));
    rgeo.rotateX(-Math.PI / 2);
    at(new THREE.Mesh(rgeo, new THREE.MeshLambertMaterial({ map: tex(rw.cv) })), 0, 0, 0.12);

    this.buildLights(a, rec, at);
    this.buildMarkings(a, at, tex);
    this.buildBuildings(a, rec, at, tex, lambert, id);
    Landside3D.build(a, rec, at, tex);
    this.buildEquipment(a, rec, at, tex, lambert);

    // ---- parked aeroplanes at the gates (hidden where the player parks): the home airlines'
    const kinds = a.terminal === 'big' ? ['A320NEO', 'B738', 'A359', 'A320', 'B789', 'B77W', 'BCS3', 'A333', 'E295', 'CRJ200'] :
      a.terminal === 'medium' ? ['B738', 'A320NEO', 'E295', 'CRJ200', 'BCS3', 'AT76', 'B1900D'] :
        a.terminal === 'small' ? ['CRJ200', 'AT76', 'B1900D', 'F27F'] : ['B1900D', 'DHC6'];
    const pick = hashStr(a.id);
    const types = a.gates.map((gate) => AIRCRAFT.find((x) => x.id === kinds[(pick + gate.index) % kinds.length]));
    // the life round the stands: bridges, vehicles, floodlights, traffic (apron3d.js)
    Apron3D.build(a, rec, at, tex, types);
    for (const gate of a.gates) {
      const type = types[gate.index];
      const al = id.airlines.length ? id.airlines[gate.index % id.airlines.length] : null;
      const plane = AircraftModels.build(type, { airline: al ? al.code : null });
      plane.position.set(gate.standX, a.elev + aircraftDims(type).gearH, gate.standZ);
      plane.rotation.y = Math.PI - gate.parkHdg * DEG;
      group.add(plane);
      rec.parked.push(plane);
    }
    return rec;
  },

  // ---------- ground markings ----------
  // The fine markings are real thin strips on the ground, not painted into the ground
  // texture (about 1-2 m a texel there, which turned a half-metre line into a wide smear):
  //   yellow - taxi centrelines, the taxiway edge lines, the stand lead-in lines and stop
  //            bars, the runway holding position
  //   white  - the runway edge lines and centreline, the lines of the landside roads and the
  //            apron service road, the zebra crossings
  buildMarkings(a, at, tex) {
    const L = LAYOUT;
    const Y = markBatch(0.16), W = markBatch(0.15);   // above the ground plane (0.05) and the runway (0.12)

    const CL = 0.45;                      // centreline width (wider than the real 0.15 m, to read from the cockpit)
    for (const s of a.twySegs) {
      const p = World.local(a, s.x1, s.z1), q = World.local(a, s.x2, s.z2);
      Y.strip(p.t, p.across, q.t, q.across, CL);
      Y.dot(p.t, p.across, CL / 2); Y.dot(q.t, q.across, CL / 2);
    }
    // the curves where the lines meet: round turns instead of right angles
    for (const f of a.fillets || []) Y.poly(f.pts, CL);
    this.buildTaxiEdges(a, Y);
    // the stands: the lead-in line on to the stop bar, and the red safety box round the
    // parked aeroplane (the stand number is a plate: standPlates)
    const Rd = markBatch(0.155);
    for (const gate of a.gates) {
      Y.strip(gate.t, L.APRON_LANE, gate.t, L.STAND + 12, 0.4);
      Y.strip(gate.t - 8, L.STAND + 4, gate.t + 8, L.STAND + 4, 1.0);
      Y.dot(gate.t, L.STAND + 12, 0.2);
      const box = [[gate.t - 34, L.STAND - 36], [gate.t - 34, L.STAND + 16], [gate.t + 34, L.STAND + 16], [gate.t + 34, L.STAND - 36]];
      Rd.poly(box, 0.3);
      // the equipment restraint line: dashed red along the service road side
      Rd.poly([[gate.t - 30, L.STAND + 14.5], [gate.t + 30, L.STAND + 14.5]], 0.25, 1.5, 1.5);
    }
    // the runway holding position: two solid and two dashed lines across the connector
    const hold = a.nodes.hold;
    for (let k = 0; k < 4; k++) {
      const ac = hold.across - 6 + k * 2.2;
      if (k < 2) Y.strip(hold.t - 15, ac, hold.t + 15, ac, 0.4);
      else for (let t = hold.t - 15; t < hold.t + 15; t += 2.7) Y.strip(t, ac, Math.min(t + 1.5, hold.t + 15), ac, 0.4);
    }

    // the runway: edge lines and the centreline
    const h = a.half, e = RWY_HALF_WIDTH;
    for (const side of [-1, 1]) W.strip(-h, side * (e - 0.65), h, side * (e - 0.65), 0.9);
    for (let t = -h + 140; t < h - 140; t += 50) W.strip(t, 0, t + 30, 0, 0.9);
    // the landside roads: edge lines, dashed lane lines and a solid line in the middle; they
    // stop where the ground texture fades into the terrain
    const box = groundBox(a), FADE = 150;
    const r = a.apronRect, roadA = L.TERMINAL + 52;
    for (const road of landsideRoads(a)) {
      const pts = truncateInBox(road, box.tMin + FADE, box.tMax - FADE, box.aMin + FADE, box.aMax - FADE);
      W.poly(pts, 0.3);
      for (const d of [-9.3, 9.3]) W.poly(offsetPolyline(pts, d), 0.3);
      for (const d of [-4.65, 4.65]) W.poly(offsetPolyline(pts, d), 0.22, 4, 6);
    }
    // the zebra crossings from the terminal to the car park: in front of each terminal of a big
    // airport (its number is painted on the lane beside it: roadNumbers), else two along the one
    const terms = a.buildings.filter((b) => b.kind === 'terminal');
    const crossings = terms.length > 1 ? terms.map((b) => b.t) : [r.t0 + (r.t1 - r.t0) * 0.3, r.t0 + (r.t1 - r.t0) * 0.7];
    for (const tc of crossings) {
      for (let k = -8; k <= 8; k += 1.6) W.strip(tc + k + 0.4, roadA - 9.6, tc + k + 0.4, roadA + 9.6, 0.8);
    }
    if (terms.length > 1) this.roadNumbers(a, terms, at, tex, roadA);
    // the tail-of-stand road between the apron's airside edge and the apron lane
    const ta = roadAcross(a);
    for (const d of [-6, 6]) W.strip(r.t0, ta + d, r.t1, ta + d, 0.3);
    for (let t = r.t0; t + 4 <= r.t1; t += 8) W.strip(t, ta, t + 4, ta, 0.25);
    // the apron service road between the stands and the building
    W.strip(r.t0, L.STAND + 18.2, r.t1, L.STAND + 18.2, 0.4);
    W.strip(r.t0, L.STAND + 31.8, r.t1, L.STAND + 31.8, 0.4);
    for (let t = r.t0; t + 4.5 <= r.t1; t += 9) W.strip(t, L.STAND + 25, t + 4.5, L.STAND + 25, 0.4);

    for (const [b, color] of [[Y, '#f2c832'], [W, '#e9e8e2'], [Rd, '#c8282a']]) {
      if (!b.pos.length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
      const nor = new Float32Array(b.pos.length);
      for (let i = 1; i < nor.length; i += 3) nor[i] = 1;
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).convertSRGBToLinear(), side: THREE.DoubleSide });
      at(new THREE.Mesh(geo, mat), 0, 0, 0);
    }
  },

  // "T1", "T2", "T3" painted on the road's lane by the terminal, either side of its crossing,
  // reading for the cars coming to it
  roadNumbers(a, terms, at, tex, roadA) {
    for (const b of terms) {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 128;
      const g = cv.getContext('2d');
      g.fillStyle = '#e9e8e2'; g.font = '900 120px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('T' + b.term, 128, 70);
      const map = tex(cv, 8);
      const mat = new THREE.MeshLambertMaterial({ map, transparent: true, alphaTest: 0.3, polygonOffset: true, polygonOffsetFactor: -2 });
      for (const [dt, lane, turn] of [[-22, -4.65, 1], [22, 4.65, -1]]) {
        // letters 7 m long down the lane, 3.5 m across it
        const geo = new THREE.PlaneGeometry(7, 3.5);
        geo.rotateX(-Math.PI / 2); geo.rotateY(turn * Math.PI / 2);
        at(new THREE.Mesh(geo, mat), b.t + dt, roadA + lane, 0.17);
      }
    }
  },

  // The yellow taxiway edge line runs just inside the pavement edge round the outside of the
  // whole network: both sides of every taxiway and the round ends of every segment, with
  // whatever falls on other pavement (another taxiway, the runway, the apron, a hangar pad)
  // cut away, so the lines stop exactly where the taxiways meet.
  buildTaxiEdges(a, Y) {
    const L = LAYOUT;
    const EW = 0.45, IN = 0.55;           // line width, and how far inside the pavement edge its middle is
    const segs = a.twySegs.filter((s) => s.kind === 'taxi' || s.kind === 'connector').map((s) => {
      const p = World.local(a, s.x1, s.z1), q = World.local(a, s.x2, s.z2);
      return { t1: p.t, a1: p.across, t2: q.t, a2: q.across, r: s.w / 2 };
    });
    // the fillets are pavement too: their outer edge is the curved edge line of the inner corner
    for (const f of a.fillets || []) {
      if (f.apron) continue;
      for (let i = 0; i + 1 < f.pts.length; i++) {
        segs.push({ t1: f.pts[i][0], a1: f.pts[i][1], t2: f.pts[i + 1][0], a2: f.pts[i + 1][1], r: f.w / 2 });
      }
    }
    const r = a.apronRect;
    const rects = [
      [-a.half - RWY_BLAST, a.half + RWY_BLAST, -RWY_HALF_WIDTH - RWY_SHOULDER, RWY_HALF_WIDTH + RWY_SHOULDER],
      [r.t0, r.t1, r.a0, r.a1]
    ];
    for (const b of a.buildings) {
      if (b.kind !== 'hangar' && b.kind !== 'warehouse' && b.kind !== 'fuel') continue;
      rects.push([b.t - b.along / 2 - 6, b.t + b.along / 2 + 6, L.TWY_OFFSET + 40, b.across - b.acrossSize / 2]);
      rects.push([b.t - 12, b.t + 12, L.TWY_OFFSET, L.TWY_OFFSET + 40]);
    }
    const covered = (t, ac) => {
      for (const q of rects) if (t > q[0] && t < q[1] && ac > q[2] && ac < q[3]) return true;
      for (const s of segs) {
        const dt = s.t2 - s.t1, da = s.a2 - s.a1, l2 = dt * dt + da * da;
        const k = l2 ? clamp(((t - s.t1) * dt + (ac - s.a1) * da) / l2, 0, 1) : 0;
        if (Math.hypot(t - s.t1 - dt * k, ac - s.a1 - da * k) < s.r - IN - 0.04) return true;
      }
      return false;
    };
    const mix = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
    // the point between a kept point p and a cut one q where the other pavement starts
    const edgeAt = (p, q) => {
      let lo = 0, hi = 1;
      for (let i = 0; i < 10; i++) { const m = (lo + hi) / 2; const x = mix(p, q, m); if (covered(x[0], x[1])) hi = m; else lo = m; }
      return mix(p, q, lo);
    };
    for (const s of segs) {
      const dt = s.t2 - s.t1, da = s.a2 - s.a1, len = Math.hypot(dt, da);
      if (len < 0.5) continue;
      const off = s.r - IN, n = Math.ceil(len / 2);
      for (const side of [-1, 1]) {
        const nt = -da / len * off * side, na = dt / len * off * side;
        const pts = [];
        for (let i = 0; i <= n; i++) pts.push([s.t1 + dt * i / n + nt, s.a1 + da * i / n + na]);
        const keep = pts.map((p) => !covered(p[0], p[1]));
        for (let i = 0; i <= n; i++) {
          if (!keep[i]) continue;
          let j = i;
          while (j < n && keep[j + 1]) j++;
          const u = i > 0 ? edgeAt(pts[i], pts[i - 1]) : pts[i];
          const v = j < n ? edgeAt(pts[j], pts[j + 1]) : pts[j];
          Y.strip(u[0], u[1], v[0], v[1], EW);
          i = j;
        }
      }
      // the round ends: the outside of the corners where the taxiway turns
      const N = 48;
      for (const [ct, ca] of [[s.t1, s.a1], [s.t2, s.a2]]) {
        for (let i = 0; i < N; i++) {
          const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, am = (a0 + a1) / 2;
          if (covered(ct + Math.cos(am) * off, ca + Math.sin(am) * off)) continue;
          Y.strip(ct + Math.cos(a0) * off, ca + Math.sin(a0) * off, ct + Math.cos(a1) * off, ca + Math.sin(a1) * off, EW);
        }
      }
    }
  },

  // ---------- lights ----------
  buildLights(a, rec, at) {
    const pos = [], col = [];
    const add = (t, across, y, c) => { pos.push(across, y, -t); col.push(c[0], c[1], c[2]); };
    const W = [1, 0.97, 0.86], Y = [1, 0.8, 0.25], R = [1, 0.12, 0.08], G = [0.2, 1, 0.35], B = [0.25, 0.45, 1];
    const h = a.half, e = RWY_HALF_WIDTH + 1.2;
    // runway edge lights every 60 m, yellow over the last 600 m; centreline every 30 m
    for (let t = -h; t <= h + 0.1; t += 60) for (const s of [-1, 1]) add(t, s * e, 0.5, t > h - 600 ? Y : W);
    for (let t = -h + 30; t < h; t += 30) add(t, 0, 0.2, t > h - 300 ? R : t > h - 900 ? ((t / 30 | 0) % 2 ? R : W) : W);
    // threshold (green) and runway end (red) bars
    for (let x = -e; x <= e + 0.1; x += 3) { add(-h - 1, x, 0.4, G); add(h + 1, x, 0.4, R); }
    // the approach lights: a bar every 30 m out to 900 m, a crossbar at 300 m
    for (let d = 60; d <= 900; d += 30) for (const x of [-3, 0, 3]) add(-h - d, x, 0.8 + d * 0.004, W);
    for (let x = -22; x <= 22; x += 2.75) add(-h - 300, x, 2, W);
    // blue taxiway edge lights
    for (const s of a.twySegs) {
      if (s.kind !== 'taxi') continue;
      const p = World.local(a, s.x1, s.z1), q = World.local(a, s.x2, s.z2);
      const len = Math.hypot(q.t - p.t, q.across - p.across);
      const nt = (q.t - p.t) / len, na = (q.across - p.across) / len;
      for (let d = 15; d < len - 15; d += 40) for (const sd of [-1, 1]) {
        const across = p.across + na * d + nt * sd * (s.w / 2 + 1);
        if (Math.abs(across) > RWY_HALF_WIDTH + 6) add(p.t + nt * d - na * sd * (s.w / 2 + 1), across, 0.35, B);
      }
    }
    // green taxiway centreline lights, every 30 m, round the curves too
    const Gc = [0.25, 1, 0.45];
    const greenLine = (pts) => {
      let carry = 0;
      for (let i = 0; i + 1 < pts.length; i++) {
        const p = pts[i], q = pts[i + 1], len = Math.hypot(q[0] - p[0], q[1] - p[1]);
        let d = carry;
        for (; d < len; d += 30) {
          const t = p[0] + (q[0] - p[0]) * d / len, ac = p[1] + (q[1] - p[1]) * d / len;
          if (Math.abs(ac) > RWY_HALF_WIDTH + 4) add(t, ac, 0.25, Gc);
        }
        carry = d - len;
      }
    };
    for (const s of a.twySegs) {
      if (s.kind !== 'taxi' && s.kind !== 'connector') continue;
      const p = World.local(a, s.x1, s.z1), q = World.local(a, s.x2, s.z2);
      greenLine([[p.t, p.across], [q.t, q.across]]);
    }
    for (const f of a.fillets || []) if (!f.apron) greenLine(f.pts);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 2.6, sizeAttenuation: false, vertexColors: true, fog: false });
    rec.lights = at(new THREE.Points(geo, mat), 0, 0);

    // the sequenced flasher ("the rabbit") running towards the threshold
    const fgeo = new THREE.BufferGeometry();
    fgeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0], 3));
    rec.flasher = at(new THREE.Points(fgeo, new THREE.PointsMaterial({ size: 6, sizeAttenuation: false, color: 0xffffff, fog: false })), -h - 900, 0);

    // PAPI: four lights left of the runway 300 m in; their colour depends on the eye (update)
    const pgeo = new THREE.BufferGeometry();
    const ppos = [], pcol = [];
    rec.papi = [];
    for (let i = 0; i < 4; i++) {
      const across = -(RWY_HALF_WIDTH + 15 + i * 9);
      ppos.push(across, 1, h - 300); pcol.push(1, 1, 1);
      rec.papi.push({ t: -h + 300, across, y: 1, angle: [3.5, 3.17, 2.83, 2.5][i] });
    }
    pgeo.setAttribute('position', new THREE.Float32BufferAttribute(ppos, 3));
    pgeo.setAttribute('color', new THREE.Float32BufferAttribute(pcol, 3));
    rec.papiPoints = at(new THREE.Points(pgeo, new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, vertexColors: true, fog: false })), 0, 0);
    const housing = new THREE.MeshLambertMaterial({ color: 0x2a2d30 });
    for (const p of rec.papi) at(new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 1.2), housing), p.t, p.across, 0.45);
  },

  // ---------- buildings and the airport's identity ----------
  buildBuildings(a, rec, at, tex, lambert, id) {
    const L = LAYOUT;
    const colour = new THREE.Color(id.color).convertSRGBToLinear();
    for (const b of a.buildings) {
      if (b.kind === 'terminal') this.terminal(a, b, rec, at, tex, lambert, id);
      else if (b.kind === 'tower') {
        at(new THREE.Mesh(new THREE.CylinderGeometry(5, 6.5, b.h, 12), lambert(0xd8d8d2)), b.t, b.across, b.h / 2);
        at(new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 2.2, 12), new THREE.MeshLambertMaterial({ color: colour })), b.t, b.across, b.h + 0.6);
        const cab = lambert(0x2c3a46);
        rec.night.push({ mat: cab, color: new THREE.Color(0x9fd0e8), k: 0.5 });
        at(new THREE.Mesh(new THREE.CylinderGeometry(10, 8, 6, 12), cab), b.t, b.across, b.h + 4.7);
        at(new THREE.Mesh(new THREE.CylinderGeometry(10.6, 10.6, 1, 12), lambert(0xe6e6e0)), b.t, b.across, b.h + 8.2);
        this.flag(rec, at, tex, a.country, null, b.t, b.across, b.h + 8.7, 14, 9);
      } else if (b.kind === 'hangar') {
        const n = a.buildings.filter((x) => x.kind === 'hangar').indexOf(b);
        this.hangar(a, b, rec, at, tex, lambert, id.airlines[n % Math.max(1, id.airlines.length)]);
      } else if (b.kind === 'fuel') {
        for (let i = 0; i < 3; i++) {
          at(new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 11, 18), lambert(0xd9dcd8)), b.t - 18 + i * 18, b.across - 8 + (i % 2) * 16, 5.5);
        }
      } else {
        const m = at(new THREE.Mesh(cellBox(b.acrossSize, b.h, b.along), lambert(0xa8a49a)), b.t, b.across, b.h / 2);
        m.userData.kind = b.kind;
        // the office windows along the top of the front, lit at night
        const win = lambert(0x3a4550);
        rec.night.push({ mat: win, color: new THREE.Color(0xfff0c8), k: 0.5 });
        at(new THREE.Mesh(cellBox(0.3, 1.4, b.along * 0.85), win), b.t, b.across - b.acrossSize / 2 - 0.15, b.h - 2);
        const cargo = AIRLINES.filter((x) => x.kinds.indexOf('cargo') >= 0 && (x.hubs.indexOf(a.id) >= 0 || x.regions.indexOf(a.region) >= 0));
        if (cargo.length) this.logoBoard(rec, at, tex, cargo[hashStr(a.id) % cargo.length], b.t, b.across - b.acrossSize / 2 - 0.2, b.h * 0.55, Math.min(b.along * 0.8, 60), b.h * 0.6);
      }
    }
  },

  terminal(a, b, rec, at, tex, lambert, id) {
    const h = b.h, front = b.across - b.acrossSize / 2, back = b.across + b.acrossSize / 2;
    at(new THREE.Mesh(cellBox(b.acrossSize, h, b.along), lambert(0xc3c8cc)), b.t, b.across, h / 2);
    // the roof: an overhanging slab in the airport's colour, the glass front underneath
    at(new THREE.Mesh(cellBox(b.acrossSize + 8, 1.6, b.along + 8),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(id.color).convertSRGBToLinear() })), b.t, b.across - 2, h + 0.8);
    // the glass front, lit from inside at night
    const glass = lambert(0x2e4558);
    rec.night.push({ mat: glass, color: new THREE.Color(0xffd9a0), k: 0.55 });
    at(new THREE.Mesh(cellBox(0.6, h * 0.62, b.along * 0.98), glass), b.t, front - 0.3, h * 0.36);
    // and a row of windows on the road side
    const back2 = lambert(0x34495c);
    rec.night.push({ mat: back2, color: new THREE.Color(0xffe2b0), k: 0.45 });
    at(new THREE.Mesh(cellBox(0.4, h * 0.3, b.along * 0.9), back2), b.t, back + 0.2, h * 0.55);
    for (let t = b.t - b.along / 2 + 12; t < b.t + b.along / 2; t += 12) {
      at(new THREE.Mesh(new THREE.BoxGeometry(0.8, h * 0.62, 0.6), lambert(0xd9dde0)), t, front - 0.6, h * 0.36);
    }
    // the name of the airport in big letters on the roof, facing the apron and the road (at a
    // big airport on the middle terminal, the others carry their number)
    const several = b.terms > 1, main = !several || b.term === Math.ceil(b.terms / 2);
    const name = main ? a.name.toUpperCase() : 'TERMINAL ' + b.term;
    const lh = clamp(b.along * 0.9 / (name.length * 0.78), 7, h > 18 ? 24 : 16);
    const lw = Math.min(b.along * 0.92, name.length * lh * 0.8);
    const lt = tex(makeLettersCanvas(name, id.color), 8);
    // (lit at night)
    const letters = new THREE.MeshLambertMaterial({ map: lt, emissiveMap: lt, emissive: 0x000000, transparent: true, alphaTest: 0.35, side: THREE.FrontSide });
    rec.night.push({ mat: letters, color: new THREE.Color(0xffffff), k: 0.9 });
    for (const side of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(lw, lh);
      geo.rotateY(side * Math.PI / 2);
      at(new THREE.Mesh(geo, letters),
        b.t, (side < 0 ? front + 4 : back - 4) + side * 0.6, h + 1.6 + lh / 2);
      // the frame the letters stand on
      at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, lw * 0.96), lambert(0x6c7378)), b.t, side < 0 ? front + 4 : back - 4, h + 2.2);
    }
    // the welcome banner on the apron side, above the glass, at the departure end of the
    // building (the first terminal), and the flags at the other end (the last)
    if (several && b.term !== 1) { this.terminalFlags(a, b, rec, at, tex, id); return; }
    const bh = Math.max(8, h * 0.62), bw = Math.min(b.along * 0.45, bh * 3.2);
    const bt = b.t - b.along / 2 + bw / 2 + 6;
    const banner = tex(makeBannerCanvas(a, id), 8);
    const bannerMat = new THREE.MeshLambertMaterial({ map: banner, emissiveMap: banner, emissive: 0x000000 });
    rec.night.push({ mat: bannerMat, color: new THREE.Color(0xffffff), k: 0.7 });
    const bgeo = new THREE.PlaneGeometry(bw, bh);
    bgeo.rotateY(-Math.PI / 2);
    at(new THREE.Mesh(bgeo, bannerMat), bt, front - 1.5, h - bh / 2 - 0.4);
    // and the same on the road side
    const bgeo2 = new THREE.PlaneGeometry(bw, bh);
    bgeo2.rotateY(Math.PI / 2);
    at(new THREE.Mesh(bgeo2, bannerMat), b.t, back + 0.6, h - bh / 2 - 0.4);
    if (!several) this.terminalFlags(a, b, rec, at, tex, id);
  },
  // three flagpoles on the roof at the far end of the (last) terminal: the country, the city, the country
  terminalFlags(a, b, rec, at, tex, id) {
    if (b.terms > 1 && b.term !== b.terms) return;
    const ft = b.t + b.along / 2 - 22, front = b.across - b.acrossSize / 2;
    for (let i = 0; i < 3; i++) {
      this.flag(rec, at, tex, a.country, i === 1 ? id : null, ft - i * 11, front + 10, b.h + 1.6, 13, 8);
    }
  },

  hangar(a, b, rec, at, tex, lambert, al) {
    const w = b.acrossSize, len = b.along, h = b.h;
    at(new THREE.Mesh(cellBox(w, h, len), lambert(0x9aa2a8)), b.t, b.across, h / 2);
    // the arched roof: a half cylinder lying across (its axis from the doors to the back), the
    // arch up; its end caps stand on top of the front and back walls, never in them (a cap in
    // a wall's plane flickered against it), and it is cut into rings for the log depth buffer
    const roof = new THREE.CylinderGeometry(len / 2, len / 2, w, 24, Math.max(1, Math.ceil(w / 12)), false, 0, Math.PI);
    roof.rotateZ(Math.PI / 2);
    const rm = at(new THREE.Mesh(roof, lambert(0x7d868c)), b.t, b.across, h);
    rm.scale.set(1, 0.32, 1);
    // the doors and the operator's logo above them
    const front = b.across - w / 2;
    at(new THREE.Mesh(cellBox(0.4, h * 0.82, len * 0.9), lambert(0x5d666c)), b.t, front - 0.2, h * 0.41);
    // the lamps over the doors, lit at night
    const lamp = lambert(0x50565b);
    rec.night.push({ mat: lamp, color: new THREE.Color(0xfff2d0), k: 0.9 });
    at(new THREE.Mesh(cellBox(0.3, 0.5, len * 0.85), lamp), b.t, front - 0.6, h * 0.86);
    // (on the arch's front end, low enough for its corners to stay on it)
    if (al) this.logoBoard(rec, at, tex, al, b.t, front - 0.5, h + len * 0.055, len * 0.45, len * 0.09);
  },

  // a board with an airline's emblem and name, facing the runway
  logoBoard(rec, at, tex, al, t, across, y, w, h) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 192;
    const g = cv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1024, 192);
    g.save();
    g.beginPath(); g.rect(12, 12, 168, 168); g.clip();
    Emblems.draw(g, al, { w: 168, h: 168, cx: 96, cy: 96, r: 70 });
    g.restore();
    g.translate(12, 12);
    g.fillStyle = al.livery.title === '#ffffff' ? al.livery.tail : al.livery.title;
    g.font = '900 110px Arial, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
    const text = al.title || al.name;
    const tw = g.measureText(text).width;
    g.save(); g.translate(196, 84); g.scale(Math.min(1, 790 / tw), 1); g.fillText(text, 0, 0); g.restore();
    const ratio = 1024 / 192;
    const bw = Math.min(w, h * ratio), bh = bw / ratio;
    const geo = new THREE.PlaneGeometry(bw, bh);
    geo.rotateY(-Math.PI / 2);
    at(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex(cv, 8) })), t, across, y);
  },

  // a flagpole with a flag that streams downwind (update); city: the airport identity for a city flag
  flag(rec, at, tex, country, city, t, across, y, pole, fw) {
    const fh = fw * 2 / 3;
    at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, pole, 6), new THREE.MeshLambertMaterial({ color: 0xe8e8e8 })), t, across, y + pole / 2);
    const src = document.createElement('canvas');
    src.width = 192; src.height = 128;
    const g = src.getContext('2d');
    if (city) {
      g.fillStyle = city.color; g.fillRect(0, 0, 192, 128);
      Landmarks.draw(g, city.symbol, 50, 18, 92, '#ffffff', city.color);
    } else Flags.draw(g, country, 0, 0, 192, 128);
    // (a power-of-two texture, so it is mipmapped everywhere: a flag far off or edge-on
    // stays steady instead of shimmering while the view turns)
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    cv.getContext('2d').drawImage(src, 0, 0, 256, 128);
    // the cloth: its hoist edge on the pole (just outside it), the top at the pole's top; it
    // is bent vertex by vertex in update(), so the hoist edge never leaves the pole. Its
    // bounding sphere holds every shape the wind can give it (centred on the hoist's top),
    // or a drooping flag would be culled as a streaming one and blink at the edges of the view
    const geo = new THREE.PlaneGeometry(fw, fh, 12, 4);
    geo.translate(fw / 2 + 0.22, -fh / 2, 0);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0.22, 0, 0), Math.hypot(fw, fh) * 1.05 + 0.5);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex(cv, 4), side: THREE.DoubleSide }));
    const holder = new THREE.Group();
    holder.add(mesh);
    at(holder, t, across, y + pole - 0.2);
    rec.flags.push({ holder, geo, base: geo.attributes.position.array.slice(), fw, phase: (t + across) * 0.07 });
  },

  // ---------- windsock, ILS aerials, signs ----------
  buildEquipment(a, rec, at, tex, lambert) {
    const h = a.half;
    // the windsock, left of the touchdown zone
    const ws = new THREE.Group();
    at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7, 6), lambert(0xe0e0e0)), -h + 220, -(RWY_HALF_WIDTH + 70), 3.5);
    const cv = document.createElement('canvas');
    cv.width = 4; cv.height = 64;
    const g = cv.getContext('2d');
    for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#ff5a14'; g.fillRect(0, i * 64 / 5, 4, 64 / 5 + 1); }
    const sock = new THREE.CylinderGeometry(0.3, 0.75, 6, 12, 1, true);
    sock.rotateZ(-Math.PI / 2);
    sock.translate(3, 0, 0);
    const droop = new THREE.Group();
    droop.add(new THREE.Mesh(sock, new THREE.MeshLambertMaterial({ map: tex(cv, 1), side: THREE.DoubleSide })));
    ws.add(droop);
    at(ws, -h + 220, -(RWY_HALF_WIDTH + 70), 6.8);
    rec.windsock = { holder: ws, droop };
    // the localiser array beyond the far end, the glideslope mast beside the touchdown zone
    const red = lambert(0xc8442e), white = lambert(0xeeeeee);
    at(new THREE.Mesh(new THREE.BoxGeometry(44, 0.5, 1), white), h + RWY_BLAST + 240, 0, 2.6);
    for (let x = -21; x <= 21; x += 3.5) at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 0.4), (x / 3.5 | 0) % 2 ? red : white), h + RWY_BLAST + 240, x, 1.3);
    for (let i = 0; i < 4; i++) at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), i % 2 ? red : white), -h + 300, RWY_HALF_WIDTH + 120, 2 + i * 4);
    at(new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 3), white), -h + 300, RWY_HALF_WIDTH + 126, 1.3);
    // signs: the runway holding position (red) and the exits (yellow)
    const hold = a.nodes.hold;
    this.sign(rec, at, tex, a.rwyName + '-' + a.rwyOpposite, '#c8102e', '#ffffff', hold.t - 20, hold.across);
    a.exits.forEach((n, i) => {
      if (n === a.nodes.rwyEnd) return;
      this.sign(rec, at, tex, 'A' + (i + 1), '#111111', '#f6c700', n.t + 22, RWY_HALF_WIDTH + 30);
    });
  },

  sign(rec, at, tex, text, bg, fg, t, across) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const g = cv.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 64);
    g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(6, 6, 244, 52);
    g.fillStyle = fg; g.font = 'bold 42px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 34);
    const face = new THREE.MeshLambertMaterial({ map: tex(cv, 4) });
    const box = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.1, 0.4), [face, face, face, face, face, face]);
    box.rotation.y = Math.PI / 2;
    at(box, t, across, 0.9);
  },

  // ---------- per frame: flags and the windsock in the wind, the PAPI, the flasher ----------
  // own: the player's aeroplane { pos (world), r } for the apron traffic to give way to
  update(rec, time, eye, wind, dark, vis, own) {
    const a = rec.a;
    // the lights shine through haze much further than the ground shows (they draw without
    // fog), but not without end: out to 2.5 times the visibility; a little bigger at night
    const far = Math.hypot(eye.x - a.x, eye.z - a.z) - a.half;
    const seen = far < Math.max(5000, (vis || 20000) * 2.5);
    for (const p of [rec.lights, rec.flasher, rec.papiPoints]) if (p) p.visible = seen;
    if (rec.lights) rec.lights.material.size = 2.6 + 1.4 * (dark || 0);
    // the wind in the airport's frame: x across, z = -t
    const wx = wind.x * a.perX + wind.z * a.perZ;
    const wz = -(wind.x * a.dirX + wind.z * a.dirZ);
    // the flags follow the wind slowly (about 3 s), so the gusts do not make them twitch; the
    // wave on the cloth runs on its own clock, so a change of the wind speeds it up gently
    // instead of jumping it
    const dt = clamp(time - (rec.flagTime === undefined ? time : rec.flagTime), 0, 0.1);
    rec.flagTime = time;
    const w = rec.flagWind || (rec.flagWind = { x: wx, z: wz, ph: 0 });
    const kw = 1 - Math.exp(-dt / 3);
    w.x += (wx - w.x) * kw; w.z += (wz - w.z) * kw;
    const spd = Math.hypot(w.x, w.z);
    const yaw = Math.atan2(-w.z, w.x);
    const strength = clamp(spd / 8, 0, 1);
    w.ph += dt * (1.6 + spd * 0.25);
    // A flag: in a light wind the cloth hangs down along the pole, in a strong one it streams
    // out; each point bends down by the droop angle about the hoist edge (so that edge stays on
    // the pole and the cloth stays on the downwind side of it), and a slow, shallow wave runs
    // along it that grows towards the fly end
    const droop = (1 - strength) * 1.25, cd = Math.cos(droop), sd = Math.sin(droop);
    for (const f of rec.flags) {
      if (spd > 0.3) f.holder.rotation.y = yaw;
      const p = f.geo.attributes.position.array, b = f.base;
      for (let i = 0; i < p.length; i += 3) {
        const x = b[i] - 0.22, k = x / f.fw;
        p[i] = 0.22 + x * cd;
        p[i + 1] = b[i + 1] - x * sd;
        p[i + 2] = Math.sin(x * 0.6 - w.ph + f.phase) * k * f.fw * (0.03 + 0.03 * strength);
      }
      f.geo.attributes.position.needsUpdate = true;
      f.geo.computeVertexNormals();
    }
    if (rec.windsock) {
      if (spd > 0.3) rec.windsock.holder.rotation.y = yaw;
      rec.windsock.droop.rotation.z = -(1 - clamp(spd / 7.7, 0, 1)) * 1.3 + Math.sin(time * 4) * 0.03;
    }
    // the PAPI: white above its angle, red below
    rec.frame.updateWorldMatrix(true, false);
    const loc = rec.frame.worldToLocal(eye.clone());
    const c = rec.papiPoints.geometry.attributes.color;
    rec.papi.forEach((p, i) => {
      const ang = Math.atan2(loc.y - p.y, Math.hypot(loc.x - p.across, loc.z + p.t)) / DEG;
      if (ang > p.angle) c.setXYZ(i, 1, 1, 0.92); else c.setXYZ(i, 1, 0.08, 0.06);
    });
    c.needsUpdate = true;
    // the apron: traffic, floodlights, lit windows (apron3d.js)
    let mine = null;
    if (own) {
      const l = rec.frame.worldToLocal(new THREE.Vector3(own.pos.x, own.pos.y, own.pos.z));
      mine = { t: -l.z, across: l.x, r: own.r };
    }
    Apron3D.update(rec, time, dark || 0, mine);
    // the flasher: 28 steps out at 30 m, twice a second, towards the threshold
    const k = Math.floor((time * 2 % 1) * 30);
    rec.flasher.visible = seen && k < 28;
    rec.flasher.position.z = -(-a.half - 900 + k * 30);
  },

  dispose(rec) {
    rec.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) for (const m of [].concat(o.material)) m.dispose();
    });
    for (const t of rec.textures) t.dispose();
  }
};

// ---------- the ground texture ----------
// A box cut into cells of about 12 m: big buildings are passed close by on the apron, and
// one huge quad per wall lets the ground and the terrain flicker through it with the
// logarithmic depth buffer
function cellBox(w, h, d) {
  const n = (v) => Math.max(1, Math.ceil(v / 12));
  return new THREE.BoxGeometry(w, h, d, n(w), n(h), n(d));
}

// ---------- marking strips ----------
// A batch of flat strips at height y in the airport frame, filled in [t, across] metres
// (local x = across, z = -t): Airport3D.buildMarkings turns each batch into one mesh
function markBatch(y) {
  const pos = [];
  // a strip from (t1, a1) to (t2, a2), w metres wide
  const strip = (t1, a1, t2, a2, w) => {
    const dt = t2 - t1, da = a2 - a1, len = Math.hypot(dt, da);
    if (len < 0.01) return;
    const nt = -da / len * w / 2, na = dt / len * w / 2;
    const p = [[t1 + nt, a1 + na], [t2 + nt, a2 + na], [t2 - nt, a2 - na], [t1 - nt, a1 - na]];
    for (const k of [0, 1, 2, 0, 2, 3]) pos.push(p[k][1], y, -p[k][0]);
  };
  // a small octagon where two strips meet, so the turns have no gaps
  const dot = (t, ac, r) => {
    for (let i = 0; i < 8; i++) {
      const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU;
      pos.push(ac, y, -t, ac + Math.sin(a1) * r, y, -(t + Math.cos(a1) * r), ac + Math.sin(a0) * r, y, -(t + Math.cos(a0) * r));
    }
  };
  // a line along [t, across] points, solid, or dashed with dash / gap metres
  const poly = (pts, w, dash, gap) => {
    if (!dash) {
      for (let i = 0; i + 1 < pts.length; i++) strip(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w);
      for (let i = 1; i + 1 < pts.length; i++) dot(pts[i][0], pts[i][1], w / 2);
      return;
    }
    let base = 0;                         // distance along the line at the start of segment i
    let d0 = 0;                           // where the current dash starts
    for (let i = 0; i + 1 < pts.length; i++) {
      const p = pts[i], q = pts[i + 1], len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const at = (d) => { const k = clamp((d - base) / (len || 1), 0, 1); return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]; };
      while (d0 < base + len) {
        const u = at(Math.max(d0, base)), v = at(d0 + dash);
        strip(u[0], u[1], v[0], v[1], w);
        if (d0 + dash > base + len) break;    // the dash goes on round the corner
        d0 += dash + gap;
      }
      base += len;
    }
  };
  return { pos, strip, dot, poly };
}

// a polyline of [t, across] points moved d metres to its side (the strip normal), mitred
function offsetPolyline(pts, d) {
  const nrm = (p, q) => { const dt = q[0] - p[0], da = q[1] - p[1], l = Math.hypot(dt, da) || 1; return [-da / l, dt / l]; };
  return pts.map((p, i) => {
    const n0 = i > 0 ? nrm(pts[i - 1], p) : nrm(p, pts[i + 1]);
    const n1 = i + 1 < pts.length ? nrm(p, pts[i + 1]) : n0;
    let mt = n0[0] + n1[0], ma = n0[1] + n1[1];
    const ml = Math.hypot(mt, ma) || 1;
    mt /= ml; ma /= ml;
    const k = d / Math.max(0.3, mt * n0[0] + ma * n0[1]);
    return [p[0] + mt * k, p[1] + ma * k];
  });
}

// a polyline that starts inside the box, cut where it first leaves it
function truncateInBox(pts, t0, t1, a0, a1) {
  const inBox = (p) => p[0] >= t0 && p[0] <= t1 && p[1] >= a0 && p[1] <= a1;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (inBox(pts[i])) { out.push(pts[i]); continue; }
    const p = pts[i - 1], q = pts[i];
    let lo = 0, hi = 1;
    for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; if (inBox([p[0] + (q[0] - p[0]) * m, p[1] + (q[1] - p[1]) * m])) lo = m; else hi = m; }
    out.push([p[0] + (q[0] - p[0]) * lo, p[1] + (q[1] - p[1]) * lo]);
    break;
  }
  return out;
}

// the area the ground texture covers, metres along (t) and across the runway
function groundBox(a) {
  return { tMin: -a.half - 700, tMax: a.half + 700, aMin: -500, aMax: LAYOUT.TERMINAL + 400 };
}

// the landside roads as [t, across] polylines: in front of the terminal and out to the
// motorway, and the branch along the runway
// (the corners are arcs, so the asphalt, its lines and the cars all go round the same curve)
function landsideRoads(a) {
  const r = a.apronRect, roadA = LAYOUT.TERMINAL + 52, box = groundBox(a);
  return [
    [[r.t0 - 220, roadA], [r.t1 + 120, roadA], [r.t1 + 260, roadA + 140], [r.t1 + 260, box.aMax + 20]],
    [[r.t0 - 220, roadA], [box.tMin - 20, roadA + 60]]
  ].map((pts) => roundPolyline(pts, 45, 10));
}

// a polyline with every inner corner replaced by an arc of radius `rad` metres (smaller where
// the legs are short), drawn as `steps` short pieces
function roundPolyline(pts, rad, steps) {
  const out = [pts[0]];
  for (let i = 1; i + 1 < pts.length; i++) {
    const p = pts[i - 1], c = pts[i], q = pts[i + 1];
    const l0 = Math.hypot(c[0] - p[0], c[1] - p[1]), l1 = Math.hypot(q[0] - c[0], q[1] - c[1]);
    const u = [(p[0] - c[0]) / l0, (p[1] - c[1]) / l0], v = [(q[0] - c[0]) / l1, (q[1] - c[1]) / l1];
    const turn = Math.acos(clamp(-(u[0] * v[0] + u[1] * v[1]), -1, 1));   // how far the road turns
    if (turn < 0.02) { out.push(c); continue; }
    // the arc starts and ends this far from the corner, along each leg
    const cut = Math.min(rad * Math.tan(turn / 2), l0 * 0.45, l1 * 0.45);
    const a0 = [c[0] + u[0] * cut, c[1] + u[1] * cut], a1 = [c[0] + v[0] * cut, c[1] + v[1] * cut];
    // a quadratic curve through the corner is close enough to an arc at these angles
    for (let k = 0; k <= steps; k++) {
      const s = k / steps, m = 1 - s;
      out.push([m * m * a0[0] + 2 * m * s * c[0] + s * s * a1[0], m * m * a0[1] + 2 * m * s * c[1] + s * s * a1[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function makeGroundCanvas(a, id, ch) {
  const L = LAYOUT;
  const { tMin, tMax, aMin, aMax } = groundBox(a);
  const A = tMax - tMin, B = aMax - aMin;
  const cw = Math.round(ch * B / A / 4) * 4;
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  const sx = cw / B, sy = ch / A;
  const P = (t, across) => [(across - aMin) * sx, (tMax - t) * sy];
  const rect = (t0, t1, a0, a1) => { const p = P(t1, a0), q = P(t0, a1); g.fillRect(p[0], p[1], q[0] - p[0], q[1] - p[1]); };
  const px = (m, min) => Math.max(min || 1, m * sx);
  const rng = makeRng(hashStr(a.id));
  const arctic = a.arctic;

  // grass, mowing stripes along the runway and a lighter runway strip
  g.fillStyle = arctic ? '#7d876f' : '#5f6e47';
  g.fillRect(0, 0, cw, ch);
  for (let across = aMin; across < aMax; across += 24) {
    g.fillStyle = ((across / 24) | 0) % 2 ? 'rgba(255,255,230,0.03)' : 'rgba(0,20,0,0.03)';
    rect(tMin, tMax, across, across + 24);
  }
  for (let i = 0; i < 3200; i++) {
    const v = rng.range(-18, 18);
    g.fillStyle = 'rgba(' + (95 + v | 0) + ',' + (112 + v | 0) + ',' + (72 + v * 0.5 | 0) + ',0.3)';
    g.fillRect(rng.range(0, cw), rng.range(0, ch), rng.range(2, 12), rng.range(2, 12));
  }
  g.fillStyle = 'rgba(160,180,115,0.18)';
  rect(-a.half - 160, a.half + 160, -110, 110);

  const asphalt = (path, wM, color) => { g.strokeStyle = color; g.lineWidth = px(wM, 1.2); g.stroke(path); };
  const line = (pts) => { const p = new Path2D(); pts.forEach(([t, ac], i) => { const q = P(t, ac); if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); return p; };
  g.lineCap = 'round'; g.lineJoin = 'round';

  // the perimeter road and the fence on the far side of the runway
  const per = line([[tMin + 10, aMin + 60], [tMax - 10, aMin + 60]]);
  asphalt(per, 7, '#55585a');
  g.setLineDash([px(6), px(6)]); asphalt(per, 0.25, 'rgba(240,240,230,0.7)'); g.setLineDash([]);
  g.setLineDash([px(2), px(2)]); asphalt(line([[tMin + 10, aMin + 45], [tMax - 10, aMin + 45]]), 0.5, 'rgba(70,75,78,0.8)'); g.setLineDash([]);

  // the landside: a road in front of the terminal, the access road, the car park
  const r = a.apronRect;
  const roadA = L.TERMINAL + 52;
  // (their lines and the zebra crossings are strips of geometry: Airport3D.buildMarkings)
  for (const road of landsideRoads(a)) asphalt(line(road), 20, '#4a4d50');
  // the kerb in front of the doors
  g.fillStyle = '#b9b6ad'; rect(r.t0, r.t1, L.TERMINAL + 30, L.TERMINAL + 40);
  // the car park
  const c0 = roadA + 16, c1 = Math.min(aMax - 30, roadA + 130);
  g.fillStyle = '#56595c'; rect(r.t0 - 60, r.t1 - 10, c0, c1);
  const carCols = ['#c8ccd0', '#2b2f33', '#8a1d1d', '#1d3f78', '#e6e6e6', '#6b6f73', '#2e5a3a', '#b5a27a'];
  for (let row = c0 + 3; row + 11 < c1; row += 26) {
    for (let t = r.t0 - 56; t < r.t1 - 14; t += 2.7) {
      g.fillStyle = 'rgba(240,240,235,0.75)';
      rect(t, t + 0.25, row, row + 5); rect(t, t + 0.25, row + 6, row + 11);
      for (const off of [0.4, 6.4]) if (rng.chance(0.62)) { g.fillStyle = rng.pick(carCols); rect(t + 0.5, t + 2.3, row + off, row + off + 4.4); }
    }
  }
  // the forecourt of the buildings behind the car park (landside3d.js)
  if (a.landside && a.landside.length) {
    const t0 = Math.min(...a.landside.map((b) => b.t - b.along / 2)), t1 = Math.max(...a.landside.map((b) => b.t + b.along / 2));
    const a0 = Math.min(...a.landside.map((b) => b.across - b.acrossSize / 2)), a1 = Math.max(...a.landside.map((b) => b.across + b.acrossSize / 2));
    g.fillStyle = '#6a6d6f'; rect(t0 - 10, t1 + 10, a0 - 10, a1 + 8);
  }
  // trees along the landside road
  for (let t = r.t0 - 200; t < r.t1 + 100; t += 14) {
    g.fillStyle = 'rgba(38,62,34,0.9)';
    const q = P(t, c1 + 8);
    g.beginPath(); g.arc(q[0], q[1], px(3.2, 1.5), 0, TAU); g.fill();
  }

  // pads in front of the hangars, joined to the parallel taxiway
  for (const b of a.buildings) {
    if (b.kind !== 'hangar' && b.kind !== 'warehouse' && b.kind !== 'fuel') continue;
    g.fillStyle = '#8c8f90';
    rect(b.t - b.along / 2 - 6, b.t + b.along / 2 + 6, L.TWY_OFFSET + 40, b.across - b.acrossSize / 2);
    rect(b.t - 12, b.t + 12, L.TWY_OFFSET, L.TWY_OFFSET + 40);
  }

  // taxiways: shoulders and the pavement (the edge lines and the centrelines are geometry)
  const segPaths = a.twySegs.filter((s) => s.kind === 'taxi' || s.kind === 'connector').map((s) => {
    const p = World.local(a, s.x1, s.z1), q = World.local(a, s.x2, s.z2);
    return { path: line([[p.t, p.across], [q.t, q.across]]), w: s.w };
  });
  // and the fillets in the corners (World.buildFillets)
  for (const f of a.fillets || []) if (!f.apron) segPaths.push({ path: line(f.pts), w: f.w });
  for (const s of segPaths) asphalt(s.path, s.w + 15, '#8a8574');
  for (const s of segPaths) asphalt(s.path, s.w, '#65696d');
  for (let i = 0; i < 1600; i++) {          // a little texture on the pavement
    g.fillStyle = rng.chance(0.5) ? 'rgba(40,42,45,0.12)' : 'rgba(150,150,150,0.08)';
    const q = P(rng.range(-a.half, a.half), rng.range(L.TWY_OFFSET - 12, L.TWY_OFFSET + 12));
    g.fillRect(q[0], q[1], px(2), px(5));
  }

  // the apron: concrete slabs with joints, a service road along the terminal, the stands
  g.fillStyle = '#9b9e9e'; rect(r.t0, r.t1, r.a0, r.a1);
  for (let t = r.t0; t < r.t1; t += 7.5) for (let ac = r.a0; ac < r.a1; ac += 7.5) {
    g.fillStyle = 'rgba(' + (rng.chance(0.5) ? '255,255,250' : '60,60,60') + ',' + rng.range(0.02, 0.09).toFixed(3) + ')';
    rect(t, t + 7.5, ac, ac + 7.5);
  }
  g.fillStyle = 'rgba(70,72,74,0.35)';
  for (let t = r.t0; t < r.t1; t += 7.5) rect(t, t + 0.25, r.a0, r.a1);
  for (let ac = r.a0; ac < r.a1; ac += 7.5) rect(r.t0, r.t1, ac, ac + 0.25);
  // the service road between the stands and the building
  g.fillStyle = 'rgba(60,62,64,0.5)'; rect(r.t0, r.t1, L.STAND + 18, L.STAND + 32);
  // (the service road lines, the yellow centrelines, the stand lead-in lines, stop bars and
  // the holding position lines are thin strips of geometry: Airport3D.buildMarkings)
  // the stands: an oil stain (the red safety box and the stand number are geometry, sharp)
  for (const gate of a.gates) {
    g.fillStyle = 'rgba(30,30,28,0.2)';
    const st = P(gate.t, L.STAND - 12);
    g.beginPath(); g.ellipse(st[0], st[1], px(3), px(5), 0, 0, TAU); g.fill();
  }
  // fade the edges out, so the airport's grass blends into the terrain around it
  g.globalCompositeOperation = 'destination-out';
  const fade = (x0, y0, x1, y1, w, hgt, rx, ry) => {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(rx, ry, w, hgt);
  };
  const fw = px(160), fh = 160 * sy;
  fade(0, 0, fw, 0, fw, ch, 0, 0);
  fade(cw, 0, cw - fw, 0, fw, ch, cw - fw, 0);
  fade(0, 0, 0, fh, cw, fh, 0, 0);
  fade(0, ch, 0, ch - fh, cw, fh, 0, ch - fh);
  g.globalCompositeOperation = 'source-over';
  return { cv, A, B, tC: (tMin + tMax) / 2, aC: (aMin + aMax) / 2 };
}

// ---------- the runway texture ----------
// The runway, its shoulders and the blast pads at both ends; canvas top = the far end.
function makeRunwayCanvas(a, ch) {
  const W = (RWY_HALF_WIDTH + RWY_SHOULDER) * 2, Lm = a.rwyLen + RWY_BLAST * 2;
  const cw = 256;
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  const sx = cw / W, sy = ch / Lm;
  const X = (across) => (across + W / 2) * sx;
  const Y = (t) => (Lm / 2 - t) * sy;                 // t from the runway middle
  const rect = (t0, t1, a0, a1) => g.fillRect(X(a0), Y(t1), (a1 - a0) * sx, Math.max(1, (t1 - t0) * sy));
  const h = a.half, e = RWY_HALF_WIDTH;
  const rng = makeRng(hashStr(a.id + 'rwy'));

  // shoulders and blast pads
  g.fillStyle = '#5a5850'; g.fillRect(0, 0, cw, ch);
  // the asphalt, and the concrete at both ends with its joints
  g.fillStyle = '#45484c'; rect(-h, h, -e, e);
  const conc = Math.min(400, a.rwyLen * 0.14);
  for (const [t0, t1] of [[-h, -h + conc], [h - conc, h]]) {
    g.fillStyle = '#7f8182'; rect(t0, t1, -e, e);
    for (let t = t0; t < t1; t += 5) for (let ac = -e; ac < e; ac += 7.5) {
      g.fillStyle = 'rgba(' + (rng.chance(0.5) ? '255,255,250' : '40,40,40') + ',' + rng.range(0.02, 0.08).toFixed(3) + ')';
      rect(t, t + 5, ac, ac + 7.5);
    }
    g.fillStyle = 'rgba(40,40,40,0.35)';
    for (let t = t0; t < t1; t += 5) rect(t, t + 0.12, -e, e);
    for (let ac = -e; ac <= e; ac += 7.5) rect(t0, t1, ac, ac + 0.12);
  }
  // asphalt grain, repair patches and crack sealing
  for (let i = 0; i < 9000; i++) {
    const v = rng.range(-14, 14) | 0;
    g.fillStyle = 'rgba(' + (70 + v) + ',' + (73 + v) + ',' + (77 + v) + ',0.45)';
    g.fillRect(rng.range(X(-e), X(e)), rng.range(Y(h - conc), Y(-h + conc)), rng.range(1, 3), rng.range(1, 8));
  }
  for (let i = 0; i < a.rwyLen / 120; i++) {
    g.fillStyle = 'rgba(' + (rng.chance(0.5) ? '30,31,33' : '90,92,95') + ',0.35)';
    const t = rng.range(-h + conc, h - conc), ac = rng.range(-e + 2, e - 10);
    rect(t, t + rng.range(4, 30), ac, ac + rng.range(3, 10));
  }
  g.strokeStyle = 'rgba(20,20,22,0.45)'; g.lineWidth = 1;
  for (let i = 0; i < a.rwyLen / 60; i++) {
    let t = rng.range(-h + conc, h - conc), ac = rng.range(-e, e);
    g.beginPath(); g.moveTo(X(ac), Y(t));
    for (let k = 0; k < 6; k++) { t += rng.range(-3, 3); ac += rng.range(-2.5, 2.5); g.lineTo(X(clamp(ac, -e, e)), Y(t)); }
    g.stroke();
  }
  // rubber: a dark band and tyre streaks in the touchdown zone
  g.fillStyle = 'rgba(22,22,24,0.28)'; rect(-h + 180, -h + 900, -7, 7);
  for (let i = 0; i < 140; i++) {
    const t = rng.range(-h + 200, -h + 1000), ac = rng.range(-6, 6) + (rng.chance(0.5) ? -3.2 : 3.2);
    g.strokeStyle = 'rgba(15,15,16,' + rng.range(0.15, 0.4).toFixed(2) + ')';
    g.lineWidth = rng.range(1, 2.5);
    g.beginPath(); g.moveTo(X(ac), Y(t)); g.lineTo(X(ac + rng.range(-0.6, 0.6)), Y(t + rng.range(30, 120))); g.stroke();
  }

  // markings: white (the edge lines and the centreline are geometry: Airport3D.buildMarkings)
  g.fillStyle = '#ecebe6';
  for (const end of [-1, 1]) {
    const tTh = end * h;
    // threshold bar and piano keys
    if (end < 0) rect(-h, -h + 1.8, -e + 1, e - 1); else rect(h - 1.8, h, -e + 1, e - 1);
    const keys = Math.max(4, Math.floor((e - 3) / 2.9));
    for (let i = 0; i < keys; i++) {
      const acr = 3 + i * 2.9;
      for (const side of [-1, 1]) {
        if (end < 0) rect(-h + 6, -h + 36, side * acr - 0.9, side * acr + 0.9);
        else rect(h - 36, h - 6, side * acr - 0.9, side * acr + 0.9);
      }
    }
    // touchdown zone bars and the aiming point (400 m in on long runways)
    const aim = a.rwyLen >= 2400 ? 400 : 300;
    for (const d of [150, 300, 450, 600, 750, 900]) {
      if (d > a.rwyLen * 0.3 && d !== aim) continue;
      const t = end < 0 ? -h + d : h - d - 22;
      for (const side of [-1, 1]) {
        if (d === aim) continue;
        const pairs = d <= 300 ? 3 : d <= 600 ? 2 : 1;
        for (let k = 0; k < pairs; k++) rect(t, t + 22, side * (3 + k * 1.9), side * (3 + k * 1.9) + side * 1.4);
      }
    }
    const ta = end < 0 ? -h + aim : h - aim - 50;
    for (const side of [-1, 1]) rect(ta, ta + 50, side * 6, side * 6 + side * 7.5);
    // the designator
    const label = end < 0 ? a.rwyName : a.rwyOpposite;
    const tt = end < 0 ? -h + 60 : h - 60;
    g.save();
    g.translate(X(0), Y(tt));
    if (end > 0) g.rotate(Math.PI);
    g.scale(1, sy / sx * 2.5);
    g.font = 'bold ' + Math.round(11 * sx) + 'px Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, 0, 0);
    g.restore();
    // the blast pad: yellow chevrons pointing at the runway
    g.strokeStyle = '#e8c33a'; g.lineWidth = Math.max(2, 1.2 * sx);
    for (let k = 0; k < 3; k++) {
      const t0 = tTh + end * (14 + k * 15);
      g.beginPath();
      g.moveTo(X(-e + 2), Y(t0 + end * 12)); g.lineTo(X(0), Y(t0)); g.lineTo(X(e - 2), Y(t0 + end * 12));
      g.stroke();
    }
  }
  return { cv, W, L: Lm };
}

// ---------- the identity: the letters on the roof and the welcome banner ----------
function makeLettersCanvas(text, color) {
  const cv = document.createElement('canvas');
  cv.width = 2048; cv.height = 192;
  const g = cv.getContext('2d');
  g.font = '900 150px Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(text).width;
  g.save();
  g.translate(1024, 100);
  g.scale(Math.min(1, 1980 / w), 1);
  g.lineJoin = 'round';
  g.strokeStyle = '#ffffff'; g.lineWidth = 16; g.strokeText(text, 0, 0);
  g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
  return cv;
}

function makeBannerCanvas(a, id) {
  const W = 1024, H = 320;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = id.color; g.fillRect(0, 0, W, H);
  // the flag along the bottom
  Flags.draw(g, a.country, 0, H - 36, W, 36);
  // the city symbol on a white panel
  g.fillStyle = '#ffffff'; g.fillRect(16, 16, H - 68, H - 68);
  Landmarks.draw(g, id.symbol, 30, 30, H - 96, id.color, '#ffffff');
  const x0 = H - 30, avail = W - x0 - 24;
  const fit = (text, font, y, color) => {
    g.font = font; g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'middle';
    const w = g.measureText(text).width;
    g.save(); g.translate(x0, y); g.scale(Math.min(1, avail / w), 1); g.fillText(text, 0, 0); g.restore();
  };
  fit('WELCOME TO', '700 44px Arial, sans-serif', 52, 'rgba(255,255,255,0.85)');
  fit(a.city.toUpperCase(), '900 108px Arial, sans-serif', 134, '#ffffff');
  const c = COUNTRIES[a.country];
  fit((c ? c.hello + ' · ' : '') + a.country, 'italic 600 40px Georgia, serif', 222, 'rgba(255,255,255,0.92)');
  return cv;
}
