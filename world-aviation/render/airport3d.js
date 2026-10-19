'use strict';

// ============================================================
// World Aviation — an airport in 3D (three.js)
//
// Everything is built in the airport's own frame: a group at the
// runway centre turned with the runway, local x = across (towards
// the terminal), local z = -t (t runs down the runway), y = up.
//
//   - the ground: one canvas texture with the ground of the airport's
//     climate (mown grass, dry grass, sand, tundra, the winter's snow:
//     groundLook, the same look as the land round it), taxiways (shoulders, edge and centre lines), the apron (concrete
//     slabs, stands, a service road), the landside roads, the car
//     park and the perimeter road
//   - the runway: its own fine texture (concrete ends with joints,
//     asphalt, tyre marks, shoulders, blast pads with chevrons and
//     all the markings), edge, centreline, threshold and end lights,
//     an approach light system with a sequenced flasher and a working
//     PAPI that shows the glide path from where the camera is
//   - the buildings, and what makes each airport recognisable: its
//     name in big letters on the terminal roof (both sides; in Russian
//     or Swedish at that country's airports when the game is), a welcome
//     banner with the city symbol and the flag, the national, the city
//     and the region's flags on the roof and the national one on the
//     tower (streaming downwind), the home airlines' logos on the
//     hangars, and their aeroplanes at the gates (data/airports.js,
//     data/airlines.js, data/regions.js, art/)
//   - the local products' boards: adverts3d.js
//   - a windsock, the localiser array, the glideslope mast, signs
//   - the perimeter fence and the trees outside it: perimeter3d.js
//   - the stands' bridges and vehicles, floodlights and traffic: apron3d.js
//   - the cargo terminal or shed, the freight, the trucks: cargo3d.js
//   - the general aviation and rescue area (the GA terminal, the air
//     ambulance's hangar, the rescue station and its helicopters, the
//     fire station) and a remote strip's house: ga3d.js
//   - the terminal's signs, the offices, hotel and car park behind it: landside3d.js
//   - at night (update's dark): lit windows, letters and banners
// ============================================================

const RWY_SHOULDER = 7.5;          // paved shoulder outside the runway edge line, metres
const RWY_BLAST = 60;              // blast pad before and after the runway, metres
const PARKED_SET = 5;              // the parked aeroplanes of this many neighbouring stands are drawn as one (Airport3D.setParked)

const Airport3D = {
  // opts: { aniso, maxTex, hi, quality } — anisotropy, the largest texture side, a high-detail ground, the QUALITY preset
  build(a, opts) {
    const L = LAYOUT;
    const look = AIRPORT_LOOK[a.id] || ['star', '#2a5d8f'];
    const id = { symbol: look[0], color: look[1], airlines: airlinesAt(a), paint: buildingPaint(a) };
    // night: materials that light up after dark ({ mat, color, k }: emissive = color x dark x k)
    const rec = { a, id, label: roofLabel(a), textures: [], flags: [], parked: [], night: [], frame: null, group: null };
    // the vehicles solid for the own aeroplane, added as they are built (sim/collide.js)
    a.vehicles = [];

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
    const gnd = makeGroundCanvas(a, id, Math.min(opts.quality && opts.quality.aptTex || (opts.hi ? 4096 : 2048), opts.maxTex));
    // (both planes are cut into cells: the logarithmic depth buffer needs small triangles
    // close to the eye, or the terrain shows through)
    const ggeo = new THREE.PlaneGeometry(gnd.B, gnd.A, Math.ceil(gnd.B / 100), Math.ceil(gnd.A / 100));
    ggeo.rotateX(-Math.PI / 2);
    at(new THREE.Mesh(ggeo, new THREE.MeshLambertMaterial({ map: tex(gnd.cv), transparent: true })), gnd.tC, gnd.aC, 0.05);

    const rw = makeRunwayCanvas(a, Math.min(opts.quality && opts.quality.aptTex ? opts.quality.aptTex * 2 : opts.hi ? 8192 : 4096, opts.maxTex));
    const rgeo = new THREE.PlaneGeometry(rw.W, rw.L, 1, Math.ceil(rw.L / 60));
    rgeo.rotateX(-Math.PI / 2);
    at(new THREE.Mesh(rgeo, new THREE.MeshLambertMaterial({ map: tex(rw.cv) })), 0, 0, 0.12);

    this.buildLights(a, rec, at);
    this.buildMarkings(a, at, tex);
    const built = frame.children.length;
    this.buildBuildings(a, rec, at, tex, lambert, id);
    Landside3D.build(a, rec, at, tex);
    // the boards of the region's and the country's products (adverts3d.js)
    Adverts3D.build(a, rec, at, tex);
    // the freight, the trucks and the crane round the cargo building (cargo3d.js)
    Cargo3D.build(a, rec, at, tex);
    // the helicopters on their pads, the fire engines, the GA area's vehicles (ga3d.js)
    Ga3D.build(a, rec, at, tex);
    // the buildings, the landside and the boards never move: baked into a mesh per material
    // (merge3d.js), all but the flags' cloth, which streams in the wind
    Merge3D.bake(frame, frame.children.slice(built), { keep: new Set(rec.flags.map((f) => f.holder)), night: rec.night, tag: 'buildings' });
    // the perimeter fence and the trees outside it, of the airport's climate (perimeter3d.js)
    Perimeter3D.build(a, rec, at, tex, opts.quality);
    this.buildEquipment(a, rec, at, tex, lambert);

    // ---- parked aeroplanes at the gates (hidden where the player parks): the home airlines',
    // at the cargo stands the freighters of the cargo carriers working there, at the GA stands
    // the bush operators' and at the air ambulance's stand its operator's (the type at each
    // stand: gate.parked, World.parkedType)
    const types = a.gates.map((gate) => gate.parked);
    // the life round the stands: bridges, vehicles, floodlights, traffic (apron3d.js)
    Apron3D.build(a, rec, at, tex, types);
    for (const gate of a.gates) {
      const type = types[gate.index];
      const al = gate.cargo ? Cargo3D.carrier(a, gate.number - 1) || id.airlines[0] || null
        : gate.medevac ? Ga3D.ambulanceOperator(a)
        : gate.ga ? Ga3D.operator(a, gate.number - 1)
        : id.airlines.length ? id.airlines[gate.index % id.airlines.length] : null;
      const plane = AircraftModels.build(type, { airline: al ? al.code : null });
      // (it stands still: its 60-80 parts baked into a mesh per material, its lights left out)
      Merge3D.bake(plane, null, { dropHidden: true, tag: 'parked' });
      plane.position.set(gate.standX, a.elev + aircraftDims(type).gearH, gate.standZ);
      plane.rotation.y = Math.PI - gate.parkHdg * DEG;
      rec.parked.push(plane);
    }
    // ... and not drawn one by one: the aeroplanes of PARKED_SET neighbouring stands are baked
    // together, a mesh per material for the lot (a big airport's 20-odd stands were over 200 draw
    // calls); rec.parked keeps each one, out of the scene, for its place and its flags, its own
    // geometry let go (the set hides one by its place in the bake: setParked)
    const order = a.gates.map((g) => g.index).sort((i, j) => a.gates[i].t - a.gates[j].t);
    rec.parkedSets = [];
    for (let i = 0; i < order.length; i += PARKED_SET) {
      const members = order.slice(i, i + PARKED_SET), sg = new THREE.Group();
      const meshes = Merge3D.combine(sg, members.map((k) => rec.parked[k]), 'parked');
      for (const m of meshes) m.userData.gfx = 'apt.parked';
      group.add(sg);
      rec.parkedSets.push({ members, meshes, group: sg, key: members.join(',') });
    }
    for (const p of rec.parked) {
      p.traverse((o) => { if (o.geometry && o.userData.baked) o.geometry.dispose(); });
      for (const c of p.children.slice()) if (c.userData.baked) p.remove(c);
    }
    return rec;
  },

  // the parked aeroplanes at the stands kept empty (userData.inUse, set by Scene3D.applyGates)
  // hidden in their set's bake, the others shown
  setParked(rec) {
    for (const s of rec.parkedSets || []) {
      const key = s.members.filter((i) => !rec.parked[i].userData.inUse).join(',');
      if (key === s.key) continue;
      s.key = key;
      s.members.forEach((i, k) => Merge3D.show(s.meshes, k, !rec.parked[i].userData.inUse));
    }
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

    // the taxi lines and the edge lines, worked out by render/taxiways.js: continuous ribbons,
    // the curves finely sampled, meeting the straight lines at their tangent points
    const plan = Taxiways.plan(a);
    for (const ln of plan.lines) Y.poly(ln.pts, TWY_CL_W);
    for (const ed of plan.edges) Y.poly(ed.pts, TWY_EDGE_W);
    // the stands: the stop bar, and the red safety box round the parked aeroplane (the lead-in
    // line is one of the plan's lines; the stand number is a plate: standPlates)
    const Rd = markBatch(0.155);
    for (const gate of a.gates) {
      Y.strip(gate.t - 8, L.STAND + 4, gate.t + 8, L.STAND + 4, 1.0);
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
    const crossings = terms.length > 1 ? terms.map((b) => b.t) : [r.t0 + (a.paxT1 - r.t0) * 0.3, r.t0 + (a.paxT1 - r.t0) * 0.7];
    for (const tc of crossings) {
      for (let k = -8; k <= 8; k += 1.6) W.strip(tc + k + 0.4, roadA - 9.6, tc + k + 0.4, roadA + 9.6, 0.8);
    }
    if (terms.length > 1) this.roadNumbers(a, terms, at, tex, roadA);
    // the apron service road between the stands and the building (the baggage trains' road,
    // render/baggage3d.js)
    W.strip(r.t0, L.SERVICE_ROAD - 6.8, r.t1, L.SERVICE_ROAD - 6.8, 0.4);
    W.strip(r.t0, L.SERVICE_ROAD + 6.8, r.t1, L.SERVICE_ROAD + 6.8, 0.4);
    for (let t = r.t0; t + 4.5 <= r.t1; t += 9) W.strip(t, L.SERVICE_ROAD, t + 4.5, L.SERVICE_ROAD, 0.4);

    for (const [b, color] of [[Y, '#f2c832'], [W, '#e9e8e2'], [Rd, '#c8282a']]) if (b.pos.length) at(markMesh(b, color), 0, 0, 0);
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

  // ---------- lights ----------
  buildLights(a, rec, at) {
    const pos = [], col = [];
    const add = (t, across, y, c) => { pos.push(across, y, -t); col.push(c[0], c[1], c[2]); };
    // the taxiway lights in a set of their own: on from dusk and in poor visibility only (update)
    const twyPos = [], twyCol = [];
    const addTwy = (t, across, y, c) => { twyPos.push(across, y, -t); twyCol.push(c[0], c[1], c[2]); };
    const W = [1, 0.97, 0.86], Y = [1, 0.8, 0.25], R = [1, 0.12, 0.08], G = [0.2, 1, 0.35], B = [0.2, 0.36, 0.85];
    const h = a.half, e = RWY_HALF_WIDTH + 1.2;
    // runway edge lights every 60 m, yellow over the last 600 m; centreline every 30 m
    for (let t = -h; t <= h + 0.1; t += 60) for (const s of [-1, 1]) add(t, s * e, 0.5, t > h - 600 ? Y : W);
    for (let t = -h + 30; t < h; t += 30) add(t, 0, 0.2, t > h - 300 ? R : t > h - 900 ? ((t / 30 | 0) % 2 ? R : W) : W);
    // threshold (green) and runway end (red) bars
    for (let x = -e; x <= e + 0.1; x += 3) { add(-h - 1, x, 0.4, G); add(h + 1, x, 0.4, R); }
    // the approach lights: a bar every 30 m out to 900 m, a crossbar at 300 m
    for (let d = 60; d <= 900; d += 30) for (const x of [-3, 0, 3]) add(-h - d, x, 0.8 + d * 0.004, W);
    for (let x = -22; x <= 22; x += 2.75) add(-h - 300, x, 2, W);
    // the taxiway lights: green centreline lights (green and yellow by turns off the runway),
    // blue edge lights, placed by render/taxiways.js for the airport's size
    const TC = { green: [0.2, 0.85, 0.4], yellow: Y, blue: B };
    for (const l of Taxiways.plan(a).lights) addTwy(l.t, l.across, l.c === 'blue' ? 0.35 : 0.25, TC[l.c]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const mat = steadyLamps(new THREE.PointsMaterial({ size: 2.6, sizeAttenuation: false, vertexColors: true, fog: false }));
    rec.lights = at(new THREE.Points(geo, mat), 0, 0);
    if (twyPos.length) {
      const tgeo = new THREE.BufferGeometry();
      tgeo.setAttribute('position', new THREE.Float32BufferAttribute(twyPos, 3));
      tgeo.setAttribute('color', new THREE.Float32BufferAttribute(twyCol, 3));
      // round dots, not squares: the taxiway lights are small flush lamps, dimmer than the runway's
      if (!this.twyDot) this.twyDot = new THREE.CanvasTexture(lampDotCanvas());
      rec.twyLights = at(new THREE.Points(tgeo, steadyLamps(new THREE.PointsMaterial({
        size: 2.4, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, opacity: 0, depthWrite: false,
        map: this.twyDot
      }))), 0, 0);
      rec.twyLights.visible = false;
      // (after the ground and the near land: they are see-through too, and sorted by distance
      // one painted over the lights, which write no depth — most of them were lost)
      rec.twyLights.renderOrder = 5;
    }

    // the sequenced flasher ("the rabbit") running towards the threshold
    const fgeo = new THREE.BufferGeometry();
    fgeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0], 3));
    rec.flasher = at(new THREE.Points(fgeo, steadyLamps(new THREE.PointsMaterial({ size: 6, sizeAttenuation: false, color: 0xffffff, fog: false }))), -h - 900, 0);

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
    rec.papiPoints = at(new THREE.Points(pgeo, steadyLamps(new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, vertexColors: true, fog: false }))), 0, 0);
    const housing = new THREE.MeshLambertMaterial({ color: 0x2a2d30 });
    for (const p of rec.papi) at(new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 1.2), housing), p.t, p.across, 0.45);
  },

  // ---------- buildings and the airport's identity ----------
  buildBuildings(a, rec, at, tex, lambert, id) {
    const L = LAYOUT;
    for (const b of a.buildings) {
      if (b.kind === 'terminal') {
        if (a.remote) Ga3D.remoteTerminal(a, b, rec, at, tex, lambert, id);
        else this.terminal(a, b, rec, at, tex, lambert, id);
      } else if (b.kind === 'tower') this.tower(a, b, rec, at, tex, lambert, id);
      else if (b.kind === 'hangar') {
        const n = a.buildings.filter((x) => x.kind === 'hangar').indexOf(b);
        this.hangar(a, b, rec, at, tex, lambert, id, id.airlines[n % Math.max(1, id.airlines.length)]);
      } else if (b.kind === 'fuel' && a.remote) Ga3D.fuelDepot(a, b, rec, at, lambert);
      else if (b.kind === 'fuel') {
        for (let i = 0; i < 3; i++) {
          at(new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 11, 18), lambert(0xd9dcd8)), b.t - 18 + i * 18, b.across - 8 + (i % 2) * 16, 5.5);
        }
      } else if (b.kind === 'cargo') Cargo3D.building(a, b, rec, at, tex, lambert, id);
      else if (GA_BUILDINGS[b.kind]) Ga3D.building(a, b, rec, at, tex, lambert, id);
    }
  },

  terminal(a, b, rec, at, tex, lambert, id) {
    const h = b.h, front = b.across - b.acrossSize / 2, back = b.across + b.acrossSize / 2;
    // a big airport's terminal wears a roof of its own (terminalRoof): b.roofTop(across) is how
    // high the signs and the flags stand at that line across the building
    const style = terminalStyle(a);
    b.roofTop = () => h + 1.6;
    b.roofAt = () => h + 1.6;
    // and b.roofSpan, how far across the roof reaches: [over the apron, over the road]
    b.roofSpan = [front - 6, back + 2];
    // the stretches of the apron front taken by a banner or a sign, [t0, t1] (kept clear by adverts3d.js)
    b.frontTaken = [];
    at(new THREE.Mesh(cellBox(b.acrossSize, h, b.along), lambert(id.paint.terminal)), b.t, b.across, h / 2);
    // the roof: an overhanging slab in the airport's colour, the glass front underneath
    at(new THREE.Mesh(cellBox(b.acrossSize + 8, 1.6, b.along + 8),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(id.paint.termRoof || id.color).convertSRGBToLinear() })), b.t, b.across - 2, h + 0.8);
    // the glass front, lit from inside at night
    const glass = lambert(0x2e4558);
    rec.night.push({ mat: glass, color: new THREE.Color(0xffd9a0), k: 0.55 });
    // (under a big roof the glass runs nearly the whole height)
    const gh = style ? 0.8 : 0.62;
    const gy = h * (0.05 + gh / 2), gl = b.along * 0.98;
    at(new THREE.Mesh(cellBox(0.6, h * gh, gl), glass), b.t, front - 0.3, gy);
    // its mullions every 12 m, painted on a panel over the glass: far off the texture's mipmaps
    // blend them into the glass, where boxes thinner than a pixel would flicker as you move
    const pane = new THREE.PlaneGeometry(gl, h * gh, Math.ceil(gl / 12), Math.ceil(h * gh / 12));
    const uv = pane.attributes.uv;
    // (u in mullion spacings from the end of the building, a mullion at every whole one)
    for (let i = 0; i < uv.count; i++) uv.setX(i, (gl * (0.5 - uv.getX(i)) + b.along / 2) / 12 + 0.5);
    pane.rotateY(-Math.PI / 2);
    const mullions = (glassCol, barCol) => {
      const t = tex(mullionCanvas(glassCol, barCol));
      t.wrapS = THREE.RepeatWrapping;
      return t;
    };
    const paneMat = new THREE.MeshLambertMaterial({ map: mullions(0x2e4558, 0xd9dde0), emissiveMap: mullions(0xffffff, 0x000000), emissive: 0x000000 });
    rec.night.push({ mat: paneMat, color: new THREE.Color(0xffd9a0), k: 0.55 });
    at(new THREE.Mesh(pane, paneMat), b.t, front - 0.65, gy);
    // and a row of windows on the road side
    const back2 = lambert(0x34495c);
    rec.night.push({ mat: back2, color: new THREE.Color(0xffe2b0), k: 0.45 });
    at(new THREE.Mesh(cellBox(0.4, h * 0.3, b.along * 0.9), back2), b.t, back + 0.2, h * 0.55);
    if (style) this.terminalRoof(a, b, rec, at, lambert, id, style);
    // the name of the airport in big letters on the roof, facing the apron and the road (at a
    // big airport on the middle terminal, the others carry their number), along the roof but
    // its far end on the terminal that flies the flags (signSpan): they stand beside the letters
    const several = b.terms > 1, sign = roofName(a);
    if (sign !== b) this.terminalPanel(a, b, rec, at, tex, lambert, id);
    else {
      const name = rec.label, n = name.length, [s0, s1] = signSpan(b), st = (s0 + s1) / 2;
      const lh = clamp((s1 - s0) * 0.9 / (n * 0.78), 7, h > 18 ? 24 : 16), lw = Math.min(s1 - s0, n * lh * 0.8);
      const lt = tex(makeLettersCanvas(name, id.color), 8);
      // (lit at night)
      const letters = new THREE.MeshLambertMaterial({ map: lt, emissiveMap: lt, emissive: 0x000000, transparent: true, alphaTest: 0.35, side: THREE.FrontSide });
      rec.night.push({ mat: letters, color: new THREE.Color(0xffffff), k: 0.9 });
      const frameMat = lambert(0x6c7378);
      for (const side of [-1, 1]) {
        const across = signAcross(b, side), y0 = signBase(b, across, side);
        const geo = new THREE.PlaneGeometry(lw, lh);
        geo.rotateY(side * Math.PI / 2);
        at(new THREE.Mesh(geo, letters), st, across + side * 0.6, y0 + lh / 2);
        // the frame the letters stand on, and its legs down to the roof under it
        at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, lw * 0.96), frameMat), st, across, y0 + 0.6);
        for (let k = -2; k <= 2; k++) signLeg(b, at, frameMat, st + k * lw * 0.22, across, y0, 0.4);
      }
    }
    // the welcome banner on the apron side, above the glass, at the departure end of the
    // building (the first terminal), and the flags at the other end (the last)
    if (several && b.term !== 1) { this.terminalFlags(a, b, rec, at, tex, id); return; }
    const bh = Math.max(8, h * 0.62), bw = Math.min(b.along * 0.45, bh * 3.2);
    const bt = b.t - b.along / 2 + bw / 2 + 6;
    b.frontTaken.push([bt - bw / 2, bt + bw / 2]);
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
  // The roof of a big airport's terminal, over the box of the building, in one of four designs
  // (terminalStyle): its shell in the roof's colour (the real one's, termRoof, else a light
  // metal), a fascia in the airport's colour along its edge, lit from below at night. Sets
  // b.roofAt(t, across), the height of its top there, and b.roofTop(across), the highest along
  // the building, for the signs and the flags on it.
  //   wing   - one sweeping roof over the whole building: a low lip over the apron rising to a
  //            crest near the road side, waving gently along, on raked struts between the stands
  //   vaults - a row of barrel vaults across the building, glass in their ends
  //   tents  - two staggered rows of white membrane peaks on masts (Denver)
  //   folded - a sawtooth of folded plates, gilded at Pulkovo, rising to glazed gables over the apron
  terminalRoof(a, b, rec, at, lambert, id, style) {
    const h = b.h, front = b.across - b.acrossSize / 2, back = b.across + b.acrossSize / 2;
    const t0 = b.t - b.along / 2, t1 = b.t + b.along / 2;
    const shellColor = new THREE.Color(id.paint.termRoof || 0xc9ced2).convertSRGBToLinear();
    const shell = new THREE.MeshLambertMaterial({ color: shellColor, side: THREE.DoubleSide });
    const accent = new THREE.MeshLambertMaterial({ color: new THREE.Color(id.color).convertSRGBToLinear(), side: THREE.DoubleSide });
    const glow = new THREE.MeshLambertMaterial({ color: 0x2e4558, side: THREE.DoubleSide });
    rec.night.push({ mat: glow, color: new THREE.Color(0xffd9a0), k: 0.6 });
    rec.night.push({ mat: shell, color: shellColor.clone().multiplyScalar(0.35), k: 0.5 });
    const put = (geo, mat) => at(new THREE.Mesh(geo, mat), 0, 0, 0);
    const top = (fn, span) => {
      b.roofAt = fn;
      b.roofSpan = [Math.min(b.roofSpan[0], span[0]), Math.max(b.roofSpan[1], span[1])];
      b.roofTop = (ac) => { let m = -Infinity; for (let t = t0; t <= t1; t += 3) m = Math.max(m, fn(t, ac)); return m + 0.2; };
    };
    if (style === 'wing') {
      // the profile across, from the lip over the apron to the edge over the road: [metres from
      // the front, height over the box]
      const prof = [[-15, 3.2], [-7, 4.4], [0, 5.6], [14, 8.6], [30, 12.6], [44, 15.4], [54, 15.2], [62, 12.4], [69, 8.4]];
      const P = (x) => {
        let i = 0;
        while (i < prof.length - 2 && x > prof[i + 1][0]) i++;
        const p = prof[i], q = prof[i + 1], f = clamp((x - p[0]) / (q[0] - p[0]), 0, 1);
        return p[1] + (q[1] - p[1]) * f * f * (3 - 2 * f);
      };
      const wave = (t, x) => 2.4 * Math.sin((t - t0) / 92 * TAU) * smoothstep(-15, 20, x);
      const yAt = (t, ac) => h + P(ac - front) + wave(t, ac - front);
      const e0 = t0 - 10, e1 = t1 + 10, x0 = front - 15, x1 = front + 69;
      put(gridSurface(Math.ceil((e1 - e0) / 8), 30, (u, v) => {
        const t = e0 + (e1 - e0) * u, ac = x0 + (x1 - x0) * v;
        return [ac, yAt(t, ac), -t];
      }), shell);
      // the fascia along the lip and the back edge: the roof's thickness, in the airport's colour
      for (const ac of [x0, x1]) {
        put(gridSurface(Math.ceil((e1 - e0) / 8), 1, (u, v) => {
          const t = e0 + (e1 - e0) * u;
          return [ac, yAt(t, ac) - 1.6 * (1 - v), -t];
        }), accent);
      }
      // the raked struts between the stands, from the apron up under the lip, and the glazing
      // from the glass front up to the roof
      const gates = a.gates.filter((g) => g.t > t0 - 5 && g.t < t1 + 5).map((g) => g.t);
      const marks = [t0 + 6, t1 - 6];
      for (let i = 0; i + 1 < gates.length; i++) marks.push((gates[i] + gates[i + 1]) / 2);
      for (const t of marks) {
        for (const dt of [-2.5, 2.5]) {
          strut(at, accent, [front - 1.2, 0, -(t + dt)], [front - 11, yAt(t, front - 11) - 1.2, -(t + dt * 3)], 0.45);
        }
      }
      put(gridSurface(Math.ceil(b.along / 10), 1, (u, v) => {
        const t = t0 + b.along * u;
        return [front - 0.25, h + (yAt(t, front) - 1.4 - h) * v, -t];
      }), glow);
      top(yAt, [x0, x1]);
    } else if (style === 'vaults') {
      const W = 34, rise = 9, R = (W * W / 4 + rise * rise) / (2 * rise), half = Math.asin(W / 2 / R);
      const n = Math.max(1, Math.round((b.along + 10) / W)), span = n * W;
      const x0 = front - 7, x1 = back + 4, len = x1 - x0;
      const cx = (x0 + x1) / 2, base = h + 0.8;
      for (let i = 0; i < n; i++) {
        const tc = b.t - span / 2 + (i + 0.5) * W;
        const geo = new THREE.CylinderGeometry(R, R, len, 18, Math.ceil(len / 10), true, Math.PI / 2 - half, half * 2);
        geo.rotateZ(Math.PI / 2);
        geo.translate(cx, base - (R - rise), -tc);
        put(geo, shell);
        // the glass in both ends, framed by a rib in the airport's colour
        for (const x of [x0 + 0.3, x1 - 0.3]) {
          const sh = new THREE.Shape();
          for (let k = 0; k <= 16; k++) {
            const ang = -half + 2 * half * k / 16;
            const y = R * Math.cos(ang) - (R - rise), z = R * Math.sin(ang);
            if (k) sh.lineTo(z, y); else sh.moveTo(z, y);
          }
          sh.closePath();
          const g = new THREE.ShapeGeometry(sh);
          g.rotateY(Math.PI / 2);
          g.translate(x, base, -tc);
          put(g, glow);
          const rib = new THREE.TorusGeometry(R, 0.6, 5, 24, half * 2);
          rib.rotateZ(Math.PI / 2 - half);
          rib.rotateY(Math.PI / 2);
          rib.translate(x, base - (R - rise), -tc);
          put(rib, accent);
        }
      }
      // the gutters between the vaults
      put(cellBox(len, 0.8, span + 2), accent).position.set(cx, base - 0.3, -b.t);
      top((t, ac) => {
        const k = ((t - (b.t - span / 2)) % W + W) % W - W / 2;
        return base + Math.sqrt(Math.max(0, R * R - k * k)) - (R - rise);
      }, [x0, x1]);
    } else if (style === 'tents') {
      const R = 12, H = 15, step = 26;
      const pts = [];
      for (let k = 0; k <= 10; k++) { const f = k / 10; pts.push(new THREE.Vector2(Math.max(0.35, R * Math.pow(1 - f, 1.7)), f * H)); }
      const rows = [front + 20, back - 20];
      const peaks = [];
      rows.forEach((ac, r) => {
        for (let t = t0 + step / 2 + r * step / 2; t < t1 - 4; t += step) {
          const g = new THREE.LatheGeometry(pts, 14);
          g.translate(ac, h + 0.6, -t);
          put(g, shell);
          const mast = new THREE.CylinderGeometry(0.25, 0.3, 5, 6);
          mast.translate(ac, h + 0.6 + H + 2, -t);
          put(mast, accent);
          peaks.push([t, ac]);
        }
      });
      top((t, ac) => {
        let y = h + 1.6;
        for (const [pt, pa] of peaks) {
          const d = Math.hypot(t - pt, ac - pa);
          if (d < R) y = Math.max(y, h + 0.6 + H * (1 - Math.pow(d / R, 1 / 1.7)));
        }
        return y;
      }, b.roofSpan);
    } else {
      // folded: a sawtooth of folded plates across the building, the ridges rising out over the
      // apron to tall glazed gables, the valleys low over the road side
      const W = 24, n = Math.max(1, Math.round((b.along + 8) / W)), span = n * W;
      const x0 = front - 10, x1 = back + 3;
      const ridge = (ac) => h + lerp(16, 6, clamp((ac - x0) / (x1 - x0), 0, 1));
      const valley = (ac) => h + lerp(5, 1.5, clamp((ac - x0) / (x1 - x0), 0, 1));
      for (let i = 0; i < n; i++) {
        const ta = b.t - span / 2 + i * W, tb = ta + W, tc = (ta + tb) / 2;
        for (const [tv, tr] of [[ta, tc], [tb, tc]]) {
          put(gridSurface(8, 3, (u, v) => {
            const ac = x0 + (x1 - x0) * u, t = lerp(tv, tr, v);
            return [ac, lerp(valley(ac), ridge(ac), v), -t];
          }), shell);
        }
        // the gable over the apron and the clerestory from the box up to the folds on both
        // fronts, glazed, the gable's edges in the airport's colour
        const tri = [x0, valley(x0), -ta, x0, ridge(x0), -tc, x0, valley(x0), -tb];
        for (const x of [front - 0.3, back + 0.3]) {
          const vy = valley(x), ry = ridge(x);
          tri.push(x, h, -ta, x, vy, -ta, x, ry, -tc, x, h, -ta, x, ry, -tc, x, h, -tc,
            x, h, -tc, x, ry, -tc, x, vy, -tb, x, h, -tc, x, vy, -tb, x, h, -tb);
        }
        const gable = new THREE.BufferGeometry();
        gable.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
        gable.computeVertexNormals();
        put(gable, glow);
        for (const tv of [ta, tb]) strut(at, accent, [x0, valley(x0) - 0.4, -tv], [x0, ridge(x0) + 0.4, -tc], 0.5);
      }
      top((t, ac) => {
        const k = Math.abs(((t - (b.t - span / 2)) % W + W) % W - W / 2) / (W / 2);    // 0 on a ridge, 1 in a valley
        return lerp(ridge(ac), valley(ac), clamp(k, 0, 1));
      }, [x0, x1]);
    }
  },

  // the roof sign of a terminal other than the one with the airport's name: a panel in the
  // airport's sign style (signStyle) — its number in a square, then TERMINAL — facing the apron
  // and the road, lit at night
  terminalPanel(a, b, rec, at, tex, lambert, id) {
    const st = signStyle(a, id);
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = st.bg; g.fillRect(0, 0, 1024, 256);
    g.fillStyle = st.dark; g.fillRect(0, 0, 256, 256);
    g.fillStyle = st.fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = st.weight + ' 190px ' + st.font; g.fillText(String(b.term), 128, 138);
    g.font = st.weight + ' 120px ' + st.font;
    const w = g.measureText('TERMINAL').width;
    g.save(); g.translate(640, 136); g.scale(Math.min(1, 700 / w), 1); g.fillText('TERMINAL', 0, 0); g.restore();
    const map = tex(cv, 8);
    const mat = new THREE.MeshLambertMaterial({ map, emissiveMap: map, emissive: 0x000000 });
    rec.night.push({ mat, color: new THREE.Color(0xffffff), k: 0.75 });
    const [s0, s1] = signSpan(b), pt = (s0 + s1) / 2;
    const ph = Math.min(clamp(b.h * 0.55, 7, 12), (s1 - s0) / 4), pw = ph * 4;
    const frameMat = lambert(0x4a5157);
    for (const side of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(pw, ph);
      geo.rotateY(side * Math.PI / 2);
      const across = signAcross(b, side), y0 = signBase(b, across, side);
      at(new THREE.Mesh(geo, mat), pt, across + side * 0.35, y0 + ph / 2);
      at(new THREE.Mesh(cellBox(0.6, ph + 0.6, pw + 0.6), frameMat), pt, across, y0 + ph / 2);
      for (let k = -1; k <= 1; k++) signLeg(b, at, frameMat, pt + k * pw * 0.3, across, y0, 0.5);
    }
  },

  // three flagpoles on the roof at the far end of the (last) terminal: the country, the city, and
  // the region's (data/regions.js) where it has one, else the country's again; in their own
  // stretch of the roof (FLAG_STRIP), beside the name or the number, never behind it
  terminalFlags(a, b, rec, at, tex, id) {
    if (!fliesFlags(b)) return;
    const ft = b.t + b.along / 2 - 6, front = b.across - b.acrossSize / 2;
    const reg = AIRPORT_REGIONS[a.id], region = reg && RegionFlags.has(reg[0]) ? reg[0] : null;
    for (let i = 0; i < 3; i++) {
      this.flag(rec, at, tex, a.country, i === 1 ? id : null, ft - i * 9, front + 8, b.roofAt(ft - i * 9, front + 8) - 0.3, 13, 8, i === 2 ? region : null);
    }
  },

  // The control tower, by the airport's size (b.size): b.h is the height of the cab's floor,
  // the national flag flies on the roof (a tower on a terminal's end, b.onTerminal, rises out of
  // its roof: no building of its own)
  //   tiny   - a square concrete post beside a low operations building, a small flared cab
  //   small  - a slender round shaft, a balcony in the airport's colour, an eight-sided cab
  //   medium - a round shaft, a collar in the airport's colour, a wide cab
  //   big    - a tall tapering shaft on a base building, an equipment floor, a big cab with a
  //            radar dome and an aerial on the roof
  tower(a, b, rec, at, tex, lambert, id) {
    const P = id.paint, h = b.h, T = b.t, A = b.across;
    const accent = new THREE.MeshLambertMaterial({ color: new THREE.Color(id.color).convertSRGBToLinear() });
    const cab = lambert(0x2c3a46);
    rec.night.push({ mat: cab, color: new THREE.Color(0x9fd0e8), k: 0.5 });
    const cyl = (r0, r1, hh, n, mat, y, turn) => {
      const m = at(new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, hh, n), mat), T, A, y);
      if (turn) m.rotation.y = turn;
      return m;
    };
    if (b.size === 'tiny') {
      if (!b.onTerminal) at(new THREE.Mesh(cellBox(12, 6, 16), lambert(P.terminal)), T, A + 8.5, 3);
      at(new THREE.Mesh(cellBox(5, h, 5), lambert(P.tower)), T, A, h / 2);
      at(new THREE.Mesh(cellBox(5.4, 1, 5.4), accent), T, A, h - 0.5);
      // (four-sided cylinders turned square to the runway: the cab leans out at the top)
      cyl(5.6, 4.6, 3.6, 4, cab, h + 1.8, Math.PI / 4);
      cyl(6.2, 6.2, 0.6, 4, lambert(P.trim), h + 3.9, Math.PI / 4);
      this.flag(rec, at, tex, a.country, null, T, A, h + 4.2, 8, 6);
    } else if (b.size === 'small') {
      cyl(3.2, 4, h, 10, lambert(P.tower), h / 2);
      cyl(6, 6, 0.8, 10, accent, h + 0.4);
      cyl(6.5, 5.2, 4.6, 8, cab, h + 3.1);
      cyl(7, 7, 0.8, 8, lambert(P.trim), h + 5.8);
      this.flag(rec, at, tex, a.country, null, T, A, h + 6.2, 10, 7);
    } else if (b.size === 'big') {
      const base = 9;
      at(new THREE.Mesh(cellBox(26, base, 26), lambert(P.terminal)), T, A, base / 2);
      const win = lambert(0x3a4550);
      rec.night.push({ mat: win, color: new THREE.Color(0xfff0c8), k: 0.5 });
      at(new THREE.Mesh(cellBox(26.3, 1.6, 26.3), win), T, A, base - 2.6);
      cyl(5, 7.5, h - base, 16, lambert(P.tower), base + (h - base) / 2);
      // two rings in the airport's colour on the shaft (just outside its taper)
      for (const k of [0.45, 0.8]) {
        const r = 7.5 - 2.5 * k + 0.3;
        cyl(r, r, 1.4, 16, accent, base + (h - base) * k);
      }
      cyl(9, 5.5, 6, 16, lambert(P.tower), h - 3);
      cyl(11, 11, 1.6, 16, accent, h + 0.8);
      cyl(12.5, 10, 7, 16, cab, h + 5.1);
      cyl(13.2, 13.2, 1.2, 16, lambert(P.trim), h + 9.2);
      // the radar dome and an aerial at the edge of the roof
      at(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.6, 10), lambert(P.trim)), T + 6, A + 6, h + 10.6);
      at(new THREE.Mesh(new THREE.SphereGeometry(2.6, 14, 10), lambert(0xf2f2ee)), T + 6, A + 6, h + 13.2);
      at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 12, 6), lambert(0xc8c8c4)), T - 7, A + 6, h + 15.8);
      this.flag(rec, at, tex, a.country, null, T, A, h + 9.8, 16, 10);
    } else {
      cyl(5, 6.5, h, 12, lambert(P.tower), h / 2);
      cyl(7.5, 7.5, 2.2, 12, accent, h + 0.6);
      cyl(10, 8, 6, 12, cab, h + 4.7);
      cyl(10.6, 10.6, 1, 12, lambert(P.trim), h + 8.2);
      this.flag(rec, at, tex, a.country, null, T, A, h + 8.7, 14, 9);
    }
  },

  // A hangar in the airport's paint (id.paint), its doors facing the runway, the operator's
  // logo over them; b.shape (HANGARS in constants.js):
  //   arch  - an arched roof;  gable - a pitched one;  wide - a flat roof with a raised
  //   middle for a tall tail, the deep door frame in the airport's colour
  hangar(a, b, rec, at, tex, lambert, id, al) {
    const P = id.paint, w = b.acrossSize, len = b.along, h = b.h;
    const front = b.across - w / 2;
    at(new THREE.Mesh(cellBox(w, h, len), lambert(P.hangar)), b.t, b.across, h / 2);
    // the lamps over the doors, lit at night
    const lamp = lambert(0x50565b);
    rec.night.push({ mat: lamp, color: new THREE.Color(0xfff2d0), k: 0.9 });
    if (b.shape === 'wide') {
      const accent = new THREE.MeshLambertMaterial({ color: new THREE.Color(id.color).convertSRGBToLinear() });
      at(new THREE.Mesh(cellBox(w + 1, 1.2, len + 1), lambert(P.roof)), b.t, b.across, h + 0.6);
      // the raised middle over the tail dock, at the front, with its own door
      const th = h * 0.28, tw = len * 0.3, td = w * 0.45;
      at(new THREE.Mesh(cellBox(td, th, tw), lambert(P.hangar)), b.t, front + td / 2, h + 1.2 + th / 2);
      at(new THREE.Mesh(cellBox(td + 1, 0.8, tw + 1), lambert(P.roof)), b.t, front + td / 2, h + 1.6 + th);
      at(new THREE.Mesh(cellBox(0.4, th * 0.85, tw * 0.9), lambert(P.door)), b.t, front - 0.2, h + 1.2 + th * 0.45);
      // the deep door frame, and the door leaves under it (the seams between them show)
      const fh = h * 0.2;
      at(new THREE.Mesh(cellBox(3, fh, len), accent), b.t, front - 1.5, h - fh / 2);
      const n = 6, lw = len * 0.96 / n;
      for (let i = 0; i < n; i++) {
        at(new THREE.Mesh(cellBox(0.4, h - fh, lw - 0.5), lambert(i % 2 ? P.door : P.hangar)), b.t - len * 0.48 + lw * (i + 0.5), front - 0.2, (h - fh) / 2);
      }
      at(new THREE.Mesh(cellBox(0.3, 0.5, len * 0.9), lamp), b.t, front - 0.6, h - fh - 0.6);
      if (al) this.logoBoard(rec, at, tex, al, b.t + len * 0.28, front - 3.1, h - fh / 2, len * 0.36, fh * 0.8);
      return;
    }
    // the roof: a half cylinder lying across (its axis from the doors to the back), the arch
    // up, or a pitched one (the same with two sides); its end caps stand on top of the front and
    // back walls, never in them (a cap in a wall's plane flickered against it), and it is cut
    // into rings for the log depth buffer
    const gable = b.shape === 'gable';
    const roof = new THREE.CylinderGeometry(len / 2, len / 2, w, gable ? 2 : 24, Math.max(1, Math.ceil(w / 12)), false, 0, Math.PI);
    roof.rotateZ(Math.PI / 2);
    const rm = at(new THREE.Mesh(roof, lambert(P.roof)), b.t, b.across, h);
    rm.scale.set(1, gable ? 0.42 : 0.32, 1);
    // the doors and the operator's logo above them
    at(new THREE.Mesh(cellBox(0.4, h * 0.82, len * 0.9), lambert(P.door)), b.t, front - 0.2, h * 0.41);
    at(new THREE.Mesh(cellBox(0.3, 0.5, len * 0.85), lamp), b.t, front - 0.6, h * 0.86);
    // (on the roof's front end, low enough for its corners to stay on it)
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

  // a flagpole with a flag that streams downwind (update); city: the airport identity for a city
  // flag, region: the key of a region's flag (art/regions.js)
  flag(rec, at, tex, country, city, t, across, y, pole, fw, region) {
    const fh = fw * 2 / 3;
    at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, pole, 6), new THREE.MeshLambertMaterial({ color: 0xe8e8e8 })), t, across, y + pole / 2);
    const src = document.createElement('canvas');
    src.width = 192; src.height = 128;
    const g = src.getContext('2d');
    if (city) {
      g.fillStyle = city.color; g.fillRect(0, 0, 192, 128);
      Landmarks.draw(g, city.symbol, 50, 18, 92, '#ffffff', city.color);
    } else if (region) RegionFlags.draw(g, region, 0, 0, 192, 128);
    else Flags.draw(g, country, 0, 0, 192, 128);
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
    const h = a.half, first = rec.frame.children.length;
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
    // the localiser array beyond the far end, the glideslope mast beside the touchdown zone, on
    // the side away from the taxiway (17 m off its centreline it stood in the way of every wing)
    const red = lambert(0xc8442e), white = lambert(0xeeeeee);
    at(new THREE.Mesh(new THREE.BoxGeometry(44, 0.5, 1), white), h + RWY_BLAST + 240, 0, 2.6);
    for (let x = -21; x <= 21; x += 3.5) at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 0.4), (x / 3.5 | 0) % 2 ? red : white), h + RWY_BLAST + 240, x, 1.3);
    for (let i = 0; i < 4; i++) at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), i % 2 ? red : white), -h + 300, -(RWY_HALF_WIDTH + 120), 2 + i * 4);
    at(new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 3), white), -h + 300, -(RWY_HALF_WIDTH + 126), 1.3);
    // signs: the runway holding position (red) and the exits (yellow)
    const hold = a.nodes.hold;
    this.sign(rec, at, tex, a.rwyName + '-' + a.rwyOpposite, '#c8102e', '#ffffff', hold.t - 20, hold.across);
    // (a rapid exit's beside the runway where its curve leaves the centreline, before it)
    a.exits.forEach((n, i) => {
      if (n === a.nodes.rwyEnd) return;
      this.sign(rec, at, tex, 'A' + (i + 1), '#111111', '#f6c700', n.rapid ? n.t - 25 : n.t + 22, RWY_HALF_WIDTH + 30);
    });
    this.gateSigns(a, rec, at, tex);
    // all of it, but the windsock (it swings in the wind), baked into a mesh per material: the
    // masts, the boxes and the signs were a draw call each, a sign's six faces six
    Merge3D.bake(rec.frame, rec.frame.children.slice(first), { keep: new Set([ws]), tag: 'equipment' });
  },

  // The direction signs to the stands at the forks of the parallel taxiway: before each lane
  // into the apron, for the traffic coming from either way, a yellow board with the stands that
  // lane leads to (the ones nearer to it than to any other lane) and an arrow the way to turn —
  // "→ 4–6", "← C1–C2". Beside the taxiway, on whichever side is clear of the pavement (a rapid
  // exit's, the lanes', the apron).
  gateSigns(a, rec, at, tex) {
    const lanes = a.nodeList.filter((n) => Math.abs(n.across - LAYOUT.TWY_OFFSET) < 1 &&
      n.edges.some((e) => e.kind === 'taxi' && e.to.across > LAYOUT.TWY_OFFSET + 20 && Math.abs(e.to.t - n.t) < 1));
    if (!lanes.length) return;
    const near = lanes.map(() => []);
    for (const g of a.gates) {
      let k = 0;
      lanes.forEach((n, i) => { if (Math.abs(n.t - g.t) < Math.abs(lanes[k].t - g.t)) k = i; });
      near[k].push(g);
    }
    const half = (LAYOUT.TWY_WIDTHS[a.terminal] || LAYOUT.TWY_WIDTH) / 2;
    const clear = (t, across) => {
      if (across > LAYOUT.APRON_LANE - 70 || across < RWY_HALF_WIDTH + 40) return false;
      const r = a.apronRect;
      if (r && t > r.t0 - 10 && t < r.t1 + 10 && across > LAYOUT.TWY_OFFSET + half) return false;
      const p = World.at(a, t, across);
      return a.twySegs.every((s) => {
        const dx = s.x2 - s.x1, dz = s.z2 - s.z1, l2 = dx * dx + dz * dz || 1;
        const u = clamp(((p.x - s.x1) * dx + (p.z - s.z1) * dz) / l2, 0, 1);
        return Math.hypot(s.x1 + dx * u - p.x, s.z1 + dz * u - p.z) > s.w / 2 + 7;
      });
    };
    lanes.forEach((n, i) => {
      const gs = near[i];
      if (!gs.length) return;
      const span = gs[0].plate === gs[gs.length - 1].plate ? gs[0].plate : gs[0].plate + '–' + gs[gs.length - 1].plate;
      const label = (a.terminals > 1 && !gs[0].cargo && !gs[0].ga ? 'T' + gs[0].terminal + ' ' : '') + span;
      for (const dir of [1, -1]) {
        // (coming along +t the apron is on the right: the turn into the lane is a right turn)
        let spot = null;
        for (const off of [45, 60, 75, 32]) {
          for (const across of [LAYOUT.TWY_OFFSET - half - 14, LAYOUT.TWY_OFFSET + half + 14]) {
            if (!spot && clear(n.t - dir * off, across)) spot = [n.t - dir * off, across];
          }
        }
        if (spot) this.dirSign(rec, at, tex, (dir > 0 ? '→ ' : '← ') + label, spot[0], spot[1], dir);
      }
    });
  },
  // a yellow direction sign facing the traffic coming along +t (dir 1) or -t (-1); its back dark
  dirSign(rec, at, tex, text, t, across, dir) {
    const cv = document.createElement('canvas');
    const g = cv.getContext('2d');
    g.font = 'bold 42px Arial, sans-serif';
    const w = Math.min(1024, Math.max(160, Math.ceil(g.measureText(text).width) + 48));
    cv.width = Math.pow(2, Math.ceil(Math.log2(w))); cv.height = 64;
    g.fillStyle = '#f6c700'; g.fillRect(0, 0, cv.width, 64);
    g.fillStyle = '#111111'; g.font = 'bold 42px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, cv.width / 2, 34);
    const back = new THREE.MeshLambertMaterial({ color: 0x2a2d31 });
    const W = 1.1 * cv.width / 64;
    const geo = new THREE.BoxGeometry(W, 1.1, 0.4), face = this.signFace(rec, tex, cv, geo);
    const mats = dir > 0 ? [back, back, back, back, face, back] : [back, back, back, back, back, face];
    at(new THREE.Mesh(geo, mats), t, across, 0.9);
  },

  sign(rec, at, tex, text, bg, fg, t, across) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const g = cv.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 64);
    g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(6, 6, 244, 52);
    g.fillStyle = fg; g.font = 'bold 42px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 34);
    const geo = new THREE.BoxGeometry(4.4, 1.1, 0.4), face = this.signFace(rec, tex, cv, geo);
    const box = new THREE.Mesh(geo, [face, face, face, face, face, face]);
    box.rotation.y = Math.PI / 2;
    at(box, t, across, 0.9);
  },

  // a sign's face: its canvas drawn into the airport's sign atlas and the geometry's uv moved
  // there, so all the signs share one material and bake into one draw call (a texture of its
  // own once the atlas is full)
  signFace(rec, tex, cv, geo) {
    if (!rec.signAtlas) rec.signAtlas = new TexAtlas(tex, 1024, 1024, 4);
    const at = rec.signAtlas, cell = at.put(cv);
    if (!cell) return new THREE.MeshLambertMaterial({ map: tex(cv, 4) });
    at.fit(geo, cell);
    return at.mat || (at.mat = new THREE.MeshLambertMaterial({ map: at.texture }));
  },

  // ---------- per frame: flags and the windsock in the wind, the PAPI, the flasher ----------
  // own: the player's aeroplane { pos, vel (world), r } for the apron traffic to give way to
  update(rec, time, eye, wind, dark, vis, own) {
    const a = rec.a;
    // the lights shine through haze much further than the ground shows (they draw without
    // fog), but not without end: out to 2.5 times the visibility; a little bigger at night
    const far = Math.hypot(eye.x - a.x, eye.z - a.z) - a.half;
    const seen = far < Math.max(5000, (vis || 20000) * 2.5);
    for (const p of [rec.lights, rec.flasher, rec.papiPoints]) if (p) p.visible = seen;
    if (rec.lights) rec.lights.material.size = 2.6 + 1.4 * (dark || 0);
    // the taxiway lights (blue edges, green centrelines) are switched on from dusk and in poor
    // visibility, as at a real airfield; on a clear day they are off (bright dots on the grass
    // in the sunshine looked out of place)
    if (rec.twyLights) {
      const m = rec.twyLights.material;
      // (dimmer and smaller than the runway's: big blue and green squares looked out of place
      // from the air at night)
      m.opacity = TWY_LIGHTS_OPACITY * Math.max(smoothstep(0.08, 0.4, dark || 0), 1 - smoothstep(1500, 5000, vis || 20000));
      m.size = 2.4 + 0.8 * (dark || 0);
      rec.twyLights.visible = seen && m.opacity > 0.02;
    }
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
      const v = own.vel || { x: 0, z: 0 };
      mine = {
        t: -l.z, across: l.x, r: own.r, vt: v.x * a.dirX + v.z * a.dirZ, va: v.x * a.perX + v.z * a.perZ,
        len: own.len, rad: own.rad, ac: own.ac, landed: own.landed, crewIn: own.crewIn
      };
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

// ---------- a texture atlas ----------
// Canvases drawn side by side, in rows, into one canvas of W x H, so the meshes that show them
// share a texture (and a material, and once baked one draw call): the signs, the stand numbers.
// tex: the airport's texture maker (Airport3D.build); aniso: its anisotropy
class TexAtlas {
  constructor(tex, W, H, aniso) {
    this.W = W; this.H = H;
    this.cv = document.createElement('canvas');
    this.cv.width = W; this.cv.height = H;
    this.g = this.cv.getContext('2d');
    this.texture = tex(this.cv, aniso);
    this.x = 0; this.y = 0; this.rowH = 0;
    this.mat = null;
  }
  // a canvas drawn into the next free place: its cell { x, y, w, h } (pixels), or null when full
  put(src, gap = 4) {
    const w = src.width, h = src.height;
    if (this.x + w > this.W) { this.x = 0; this.y += this.rowH + gap; this.rowH = 0; }
    if (w > this.W || this.y + h > this.H) return null;
    this.g.drawImage(src, this.x, this.y);
    const cell = { x: this.x, y: this.y, w, h };
    this.x += w + gap; this.rowH = Math.max(this.rowH, h);
    this.texture.needsUpdate = true;
    return cell;
  }
  // a geometry's uv (0..1 over its own canvas) moved into its cell (the canvas's top at v = 1)
  fit(geo, c) {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (c.x + uv.getX(i) * c.w) / this.W, 1 - (c.y + (1 - uv.getY(i)) * c.h) / this.H);
    return geo;
  }
}

// ---------- the ground texture ----------
// The colours of an airport's buildings: one scheme per airport, picked by its code, for the
// terminal's walls, the tower, the hangars (and the cargo shed), their roofs and doors, and the
// trim (the tower's roof); the accents stay in the airport's own colour (AIRPORT_LOOK)
const BUILDING_PAINTS = [
  { terminal: 0xc3c8cc, tower: 0xd8d8d2, hangar: 0x9aa2a8, roof: 0x7d868c, door: 0x5d666c, trim: 0xe6e6e0 },   // concrete grey
  { terminal: 0xe2d8c4, tower: 0xece4d4, hangar: 0xc6bba2, roof: 0x8a6e52, door: 0x6e6252, trim: 0xf2ece0 },   // sand
  { terminal: 0xeceff2, tower: 0xf4f4f2, hangar: 0xd6dce2, roof: 0x3f6f9e, door: 0x4e6680, trim: 0x3f6f9e },   // white and blue
  { terminal: 0xa45a46, tower: 0xc9bcae, hangar: 0x96483a, roof: 0x4a4e52, door: 0x5a3a32, trim: 0xe0d6ca },   // brick
  { terminal: 0x6e7880, tower: 0x8e979e, hangar: 0x5f6a72, roof: 0x3a4248, door: 0x2e3438, trim: 0xb8c0c6 },   // dark steel
  { terminal: 0xe6dfc2, tower: 0xf0ead2, hangar: 0x8fa48a, roof: 0x4f7050, door: 0x5c6b58, trim: 0x4f7050 },   // cream and green
  { terminal: 0xd8cfc0, tower: 0xf2f0ea, hangar: 0x8e2f25, roof: 0x2f3133, door: 0xe8e2d6, trim: 0x2f3133 },   // falu red sheds
  { terminal: 0xb8c2c8, tower: 0xe8ecee, hangar: 0xc8ccc8, roof: 0xa8432e, door: 0x6c7276, trim: 0xa8432e }    // silver, red roofs
];
// The big, well-known airports in something like their real colours, over the concrete grey
// scheme: the terminal's walls and its roof slab (termRoof, else the airport's colour), the
// tower, and the hangars in the home carrier's colours where it has its base there
const REAL_PAINTS = {
  ARN: { terminal: 0xcfd3d6, tower: 0xe9ebec, hangar: 0xd9dcde, roof: 0x6d757b, door: 0x3f4a54, trim: 0x30363c },   // glass and grey, the white tower
  OSL: { terminal: 0xc49a6c, termRoof: 0xa9aeb2, tower: 0xe6e4de, hangar: 0xcfd2d4, roof: 0x8d9399, trim: 0x9aa0a6 },   // oak, glass and a steel roof
  HEL: { terminal: 0xdfe2e4, tower: 0xf2f2f0, hangar: 0xe6e8ea, roof: 0x1b3f7a, door: 0x1b3f7a, trim: 0xdfe2e4 },   // white, Finnair blue hangars
  CPH: { terminal: 0xb9bfc4, termRoof: 0x8e9499, tower: 0xd5d3cc, hangar: 0xd8dadb, roof: 0x6a7076 },
  LHR: { terminal: 0xd3d8dc, termRoof: 0xcdd2d6, tower: 0xf0f1f1, hangar: 0xdfe2e4, roof: 0x4b5560, door: 0x1b2a4a },   // T5's steel and glass, the BA base
  AMS: { terminal: 0xc9ced3, termRoof: 0x1f3c88, tower: 0xe8eaeb, hangar: 0xe6e9eb, roof: 0x00a1de, door: 0x0b5ca8, trim: 0x1f3c88 },   // KLM blue hangars
  CDG: { terminal: 0xb4afa5, termRoof: 0x9e9a92, tower: 0xbdb8ae, hangar: 0xd0d2d2, roof: 0x7d8288, door: 0x1c2f5e, trim: 0x8e8a82 },   // raw concrete
  FRA: { terminal: 0xbcc1c5, tower: 0xc9ccce, hangar: 0xe4e6e8, roof: 0x8a9096, door: 0x0a1d3d, trim: 0xd8dadc },   // Lufthansa's navy doors
  MUC: { terminal: 0xe2e5e8, tower: 0xd7dade, hangar: 0xe4e6e8, roof: 0x9aa2aa, door: 0x0a1d3d, trim: 0xb8bec4 },
  BER: { terminal: 0xd7cdb5, termRoof: 0x3d4146, tower: 0xb6babd, hangar: 0xcfd1d2, roof: 0x4a4e52, door: 0x3a3e42, trim: 0x2f3336 },   // limestone, a dark roof
  VIE: { terminal: 0xdcdfe1, tower: 0xf4f4f2, hangar: 0xe2e4e6, roof: 0x8a9096, door: 0xc8102e },
  MAD: { terminal: 0xc5c9cc, termRoof: 0xb4bac0, tower: 0xe9e9e6, trim: 0xf2b705 },   // T4's wavy steel roof, its yellow
  BCN: { terminal: 0xefefed, termRoof: 0xdcdfe1, tower: 0xf3f3f1 },   // white T1
  IST: { terminal: 0xb7bcc0, termRoof: 0xc9cdd0, tower: 0xa9aeb3, hangar: 0xdfe2e4, door: 0xc8102e },   // the grey tulip tower
  SVO: { terminal: 0xd9dce0, tower: 0xe8e8e6, hangar: 0xe6e8ea, roof: 0x1f3f8f, door: 0x1f3f8f, trim: 0xf26b21 },   // Aeroflot blue
  LED: { terminal: 0xc9ced2, termRoof: 0xb8925a, tower: 0xe2e4e5, trim: 0xb8925a },   // Pulkovo's gilded folded roof
  CAI: { terminal: 0xd8c6a1, termRoof: 0xcbbf9f, tower: 0xe1d4b6, hangar: 0xd6cbb2, roof: 0x9c8a6a },   // sand
  DXB: { terminal: 0xdadfe2, termRoof: 0xc6ccd0, tower: 0xf0f0ee, hangar: 0xf0f0ee, roof: 0xc7c9ca, door: 0xb0262c, trim: 0xc5a35a },   // Emirates red and gold
  DOH: { terminal: 0xe6e9eb, termRoof: 0xf1f2f2, tower: 0xf4f4f2, hangar: 0xe6e8ea, roof: 0x5c0632, door: 0x5c0632, trim: 0xd9dcde },   // the white wave, Qatar burgundy
  ATL: { terminal: 0xc7b59a, tower: 0xe8e6e0, hangar: 0xdfe1e2, roof: 0x2d3e63, door: 0xc8102e },   // the Delta base
  DEN: { terminal: 0xdcdad4, termRoof: 0xf6f6f2, tower: 0xe6e4de },   // the white tent roof
  LAX: { terminal: 0xddd6c6, tower: 0xd5d0c2 },
  SFO: { terminal: 0xd5d9db, tower: 0xeceeee },
  JFK: { terminal: 0xbfc3c6, tower: 0xd6d8d8 },
  SIN: { terminal: 0xe5e8e8, tower: 0xf2f2f0, hangar: 0xeceeee, roof: 0x1d2c5e, door: 0xd2a94c, trim: 0xd2a94c },   // SIA navy and gold
  HKG: { terminal: 0xcbd1d5, termRoof: 0xdfe3e6, tower: 0xe4e6e7, hangar: 0xdfe2e4, roof: 0x006564, door: 0x006564 },   // Cathay green
  CGK: { terminal: 0xece5d6, termRoof: 0x9a4b2e, tower: 0xe8e2d4, hangar: 0xe2ddd2, roof: 0x9a4b2e, trim: 0x9a4b2e },   // Javanese terracotta roofs
  KUL: { terminal: 0xece7dc, termRoof: 0xd9d6cf, tower: 0xf0ece2 },
  BKK: { terminal: 0xb8c0c6, termRoof: 0xc8ced2, tower: 0xa0a8ae },   // steel and glass, the grey tower
  PEK: { terminal: 0xc8ccd0, termRoof: 0xb7bdc2, trim: 0xb02a2a },   // T3's silver roof and red
  PVG: { terminal: 0xdfe3e5, termRoof: 0xeceeef },
  ICN: { terminal: 0xdfe2e5, termRoof: 0xcfd4d8 },
  HND: { terminal: 0xc9cdcf, tower: 0xdfe1e2 }
};
// The roof of a big airport's terminal (Airport3D.terminalRoof): the real one's look where it is
// known, else one of the four by the airport's code
const TERMINAL_STYLES = {
  wing: ['MAD', 'DOH', 'BKK', 'PEK', 'ICN', 'HKG', 'LHR', 'IST', 'MUC', 'SIN', 'GYD', 'PVG', 'AYT', 'BCN'],
  vaults: ['KUL', 'CDG', 'FRA', 'BER', 'JFK', 'ORD', 'SYD', 'MEL', 'DEL', 'BOM', 'HND', 'TAS', 'SVO', 'DXB'],
  tents: ['DEN', 'JNB', 'MIA', 'MNL'],
  folded: ['LED', 'CGK', 'OSL', 'HEL', 'ARN', 'CPH', 'VIE', 'AMS']
};
function terminalStyle(a) {
  if (a.terminal !== 'big') return null;
  for (const k in TERMINAL_STYLES) if (TERMINAL_STYLES[k].indexOf(a.id) >= 0) return k;
  return ['wing', 'vaults', 'tents', 'folded'][hashStr(a.id + '/roof') % 4];
}

// a surface of nu x nv quads from fn(u, v) -> [x, y, z] in the airport's frame (small cells: the
// logarithmic depth buffer wants small triangles close to the eye)
function gridSurface(nu, nv, fn) {
  const pos = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...fn(i / nu, j / nv));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const p = j * (nu + 1) + i;
    idx.push(p, p + 1, p + nu + 2, p, p + nu + 2, p + nu + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// a triangle cut into n x n small ones
function gridTriangle(p0, p1, p2, n) {
  const pos = [];
  const P = (i, j) => { const u = i / n, v = j / n; return [0, 1, 2].map((k) => p0[k] + (p1[k] - p0[k]) * u + (p2[k] - p0[k]) * v); };
  for (let j = 0; j < n; j++) for (let i = 0; i + j < n; i++) {
    pos.push(...P(i, j), ...P(i + 1, j), ...P(i, j + 1));
    if (i + j + 1 < n) pos.push(...P(i + 1, j), ...P(i + 1, j + 1), ...P(i, j + 1));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
// a round strut from p to q (frame coordinates: x = across, y, z = -t), radius r
function strut(at, mat, p, q, r) {
  const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, len, 8), mat);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  at(m, -(p[2] + q[2]) / 2, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
}

// the airport's name in big letters on a terminal's roof: which terminal carries it (the only
// one, or the middle one), the letters' height and the sign's length along the building, metres
// (the floodlight masts keep out of its way: apron3d.js)
// the terminal with the airport's name on its roof: the middle one
function roofName(a) {
  const terms = a.buildings.filter((b) => b.kind === 'terminal');
  return terms[Math.ceil(terms.length / 2) - 1] || null;
}

// The signs on a terminal's roof (the name, a terminal's number) and the flags beside them.
// FLAG_STRIP: the far end of the roof kept for the three flags (9 m apart, 6 m from the end, and
// the cloth streaming 8 m from the last pole)
const FLAG_STRIP = 34;
function fliesFlags(b) { return b.terms === 1 || b.term === b.terms; }
// [t0, t1]: the stretch along the roof a sign may take
function signSpan(b) {
  const t0 = b.t - b.along / 2, t1 = b.t + b.along / 2;
  return [t0 + 4, t1 - (fliesFlags(b) ? FLAG_STRIP : 4)];
}
// a sign stands just inside the roof's edge on its side (side -1: the apron, 1: the road)...
function signAcross(b, side) { return side < 0 ? b.roofSpan[0] + 2.5 : b.roofSpan[1] - 2.5; }
// ... and high enough that no part of the roof between it and that edge hides its foot from the
// ground there (from below, a line rising 0.3 m per metre towards the building): the plain slab's
// edge, a wing's lip, the folded plates' ridges
function signBase(b, across, side) {
  const edge = b.roofSpan[side < 0 ? 0 : 1];
  let y = b.roofTop(across);
  for (let d = 1; d <= Math.abs(edge - across); d++) y = Math.max(y, b.roofTop(across + side * d) + 0.3 * d);
  return y;
}
// a leg from the roof under it up to a sign standing at y0 over it
function signLeg(b, at, mat, t, across, y0, w) {
  const r = b.roofAt(t, across) - 0.3;
  if (y0 - r > 0.5) at(new THREE.Mesh(new THREE.BoxGeometry(w, y0 - r, w), mat), t, across, r + (y0 - r) / 2);
}

// The airport's name on its roof, upper case: in the game's language at the airports of the
// country that speaks it (Russian at a Russian airport when the game is in Russian, Swedish at a
// Swedish one, data/airport-names.js), else in English. Its welcome banner follows it (makeBannerCanvas).
const ROOF_LANG = { Russia: 'ru', Sweden: 'sv' };
function roofLang(a) { return ROOF_LANG[a.country] === I18N.lang ? I18N.lang : null; }
function roofLabel(a) { const l = roofLang(a); return (l ? aptName(a, l) : a.name).toUpperCase(); }

function buildingPaint(a) {
  if (REAL_PAINTS[a.id]) return Object.assign({}, BUILDING_PAINTS[0], REAL_PAINTS[a.id]);
  return BUILDING_PAINTS[hashStr(a.id + '/paint') % BUILDING_PAINTS.length];
}

// A box cut into cells of about 12 m: big buildings are passed close by on the apron, and
// one huge quad per wall lets the ground and the terrain flicker through it with the
// logarithmic depth buffer
function cellBox(w, h, d) {
  const n = (v) => Math.max(1, Math.ceil(v / 12));
  return new THREE.BoxGeometry(w, h, d, n(w), n(h), n(d));
}

// one 12 m span of a glass front: the glass, a 0.8 m mullion in the middle (colours as the
// materials' hex, linear: painted in sRGB, as the texture is read back)
function mullionCanvas(glassHex, barHex) {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 4;
  const g = cv.getContext('2d');
  g.fillStyle = '#' + new THREE.Color(glassHex).convertLinearToSRGB().getHexString(); g.fillRect(0, 0, 128, 4);
  const w = 128 * 0.8 / 12;
  g.fillStyle = '#' + new THREE.Color(barHex).convertLinearToSRGB().getHexString(); g.fillRect(64 - w / 2, 0, w, 4);
  return cv;
}

// The wear of the taxiways, over the whole pavement (the straights, the curves, the exits and
// the connectors alike), clipped to it: patches of newer and older asphalt, dark and pale specks,
// and the rubber and the oil the wheels leave along the centrelines, heaviest round the curves
// where the aeroplanes turn (a remote strip's gravel only gets the patches and the specks)
function paveWear(g, pave, plan, P, px, rng, remote) {
  const clip = new Path2D();
  let t0 = Infinity, t1 = -Infinity, a0 = Infinity, a1 = -Infinity, area = 0;
  for (const pts of pave) {
    pts.forEach(([t, ac], i) => {
      const q = P(t, ac);
      if (i) clip.lineTo(q[0], q[1]); else clip.moveTo(q[0], q[1]);
      t0 = Math.min(t0, t); t1 = Math.max(t1, t); a0 = Math.min(a0, ac); a1 = Math.max(a1, ac);
    });
    clip.closePath();
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]) / 2;
  }
  area = Math.abs(area);
  if (!isFinite(t0)) return;
  g.save();
  g.clip(clip);
  // the patches: a slab relaid lighter, a darker stretch sealed over, 6-28 m across
  const patches = Math.min(900, Math.round(area / 260));
  for (let i = 0; i < patches; i++) {
    const t = rng.range(t0, t1), ac = rng.range(a0, a1), q = P(t, ac);
    g.fillStyle = rng.chance(0.55) ? 'rgba(28,30,33,' + rng.range(0.06, 0.16).toFixed(3) + ')' : 'rgba(175,172,165,' + rng.range(0.05, 0.12).toFixed(3) + ')';
    g.beginPath();
    g.ellipse(q[0], q[1], px(rng.range(3, 14)), px(rng.range(2, 7)), rng.range(0, Math.PI), 0, TAU);
    g.fill();
  }
  // the specks
  const specks = Math.min(9000, Math.round(area / 25));
  for (let i = 0; i < specks; i++) {
    const q = P(rng.range(t0, t1), rng.range(a0, a1));
    g.fillStyle = rng.chance(0.5) ? 'rgba(40,42,45,0.14)' : 'rgba(160,158,150,0.1)';
    g.fillRect(q[0], q[1], px(rng.range(1, 3)), px(rng.range(1, 4)));
  }
  if (!remote) {
    // the wheels' track: a broad faint band and a darker one along every centreline (the
    // curves, sampled finely, get it twice as dark: the tyres scrub there)
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const ln of plan.lines) {
      if (ln.pts.length < 2) continue;
      const path = new Path2D();
      ln.pts.forEach(([t, ac], i) => { const q = P(t, ac); if (i) path.lineTo(q[0], q[1]); else path.moveTo(q[0], q[1]); });
      const curve = ln.curve;
      g.strokeStyle = 'rgba(30,31,34,' + (curve ? 0.12 : 0.07) + ')'; g.lineWidth = px(9); g.stroke(path);
      g.strokeStyle = 'rgba(24,25,27,' + (curve ? 0.2 : 0.1) + ')'; g.lineWidth = px(3.5); g.stroke(path);
    }
  }
  g.restore();
}

// ---------- marking strips ----------
// A batch of flat strips at height y in the airport frame, filled in [t, across] metres
// (local x = across, z = -t): Airport3D.buildMarkings turns each batch into one mesh
// (markMesh). Every vertex keeps the point of the line it belongs to (position), its offset
// from there to the line's edge (markOff) and the half width it measures the line by
// (markMeasure), so the vertex shader can widen a line too thin for the screen (markMaterial).
function markBatch(y) {
  const pos = [], off = [], mea = [];
  // a vertex: the line's point (t, ac), the offset (ot, oa) from it, the half width (mt, ma)
  const vtx = (t, ac, ot, oa, mt, ma) => { pos.push(ac, y, -t); off.push(oa, -ot); mea.push(ma, -mt); };
  // a strip from (t1, a1) to (t2, a2), w metres wide (in pieces of at most MARK_SEG_M)
  const strip = (t1, a1, t2, a2, w) => {
    const dt = t2 - t1, da = a2 - a1, len = Math.hypot(dt, da);
    if (len < 0.01) return;
    const nt = -da / len * w / 2, na = dt / len * w / 2, n = Math.ceil(len / MARK_SEG_M);
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      const p = [[t1 + dt * u0, a1 + da * u0, 1], [t1 + dt * u1, a1 + da * u1, 1], [t1 + dt * u1, a1 + da * u1, -1], [t1 + dt * u0, a1 + da * u0, -1]];
      for (const k of [0, 1, 2, 0, 2, 3]) vtx(p[k][0], p[k][1], nt * p[k][2], na * p[k][2], nt, na);
    }
  };
  // a small octagon where two strips meet, so the turns have no gaps
  const dot = (t, ac, r) => {
    for (let i = 0; i < 8; i++) {
      const c0 = Math.cos(i / 8 * TAU) * r, s0 = Math.sin(i / 8 * TAU) * r;
      const c1 = Math.cos((i + 1) / 8 * TAU) * r, s1 = Math.sin((i + 1) / 8 * TAU) * r;
      vtx(t, ac, 0, 0, r, 0);
      vtx(t, ac, c1, s1, c1, s1);
      vtx(t, ac, c0, s0, c0, s0);
    }
  };
  // a line along [t, across] points, solid, or dashed with dash / gap metres. A solid one is
  // one ribbon, mitred at the corners (a sharp one gets a dot instead: its mitre would spike)
  const poly = (pts, w, dash, gap) => {
    if (!dash) {
      // (a long straight run in pieces of at most MARK_SEG_M, as a strip)
      const dense = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i], n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / MARK_SEG_M);
        for (let j = 1; j < n; j++) dense.push([p[0] + (q[0] - p[0]) * j / n, p[1] + (q[1] - p[1]) * j / n]);
        dense.push(q);
      }
      pts = dense;
      const nrm = (p, q) => { const dt = q[0] - p[0], da = q[1] - p[1], l = Math.hypot(dt, da) || 1; return [-da / l, dt / l]; };
      const side = [];
      for (let i = 0; i < pts.length; i++) {
        const n0 = i > 0 ? nrm(pts[i - 1], pts[i]) : nrm(pts[i], pts[i + 1]);
        const n1 = i + 1 < pts.length ? nrm(pts[i], pts[i + 1]) : n0;
        const mt = n0[0] + n1[0], ma = n0[1] + n1[1];
        const ml = Math.hypot(mt, ma), cos = ml / 2;
        if (cos < 0.5) { side.push(null); continue; }
        const k = w / 2 / cos;
        side.push([mt / ml * k, ma / ml * k]);
      }
      for (let i = 0; i + 1 < pts.length; i++) {
        if (!side[i] || !side[i + 1]) { strip(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w); continue; }
        const p = [[i, 1], [i + 1, 1], [i + 1, -1], [i, -1]];
        for (const k of [0, 1, 2, 0, 2, 3]) {
          const j = p[k][0], sg = p[k][1], m = side[j];
          vtx(pts[j][0], pts[j][1], m[0] * sg, m[1] * sg, m[0], m[1]);
        }
      }
      for (let i = 0; i < pts.length; i++) if (!side[i]) dot(pts[i][0], pts[i][1], w / 2);
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
  return { pos, off, mea, strip, dot, poly };
}

// a batch's mesh, in its colour (sRGB hex)
function markMesh(b, color) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
  geo.setAttribute('markOff', new THREE.Float32BufferAttribute(b.off, 2));
  geo.setAttribute('markMeasure', new THREE.Float32BufferAttribute(b.mea, 2));
  const nor = new Float32Array(b.pos.length);
  for (let i = 1; i < nor.length; i += 3) nor[i] = 1;
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  const mesh = new THREE.Mesh(geo, markMaterial(color));
  // see-through, so after the airport's ground (see-through too, at its fading edges): drawn
  // before it, they would be painted over
  mesh.renderOrder = 3;
  return mesh;
}

// The markings' material. A line seen far off, or nearly edge-on, is narrower on the screen
// than a pixel; without antialiasing (a phone's canvas has none) it then breaks up into a
// crawling, flickering dotted line. The vertex shader measures each line's thickness in
// pixels (its width projected across its own direction on the screen) and widens one thinner
// than MARK_MIN_PX to that, at most MARK_MAX_K times, fading it by as
// much (alpha 1 / k, but no fainter than MARK_MIN_A, so the far lines still read): about the
// same paint on the screen, as a texture's mipmaps would give it, but steady. Near, a line is
// drawn as it is. The canvas's size in pixels: MARK_RES (Scene3D.resize). The widening is worked
// out at each vertex, so a line is made of pieces of at most MARK_SEG_M (markBatch): one strip
// down a whole runway, with its far end widened 30 times and its near end not, was a wedge
// painted wide across the runway near the eye, changing shape as the aeroplane moved — the
// runway's edge lines flickered on the landing.
const MARK_SEG_M = 25;
const MARK_MIN_PX = 1.4;
const MARK_MAX_K = 30;
const MARK_MIN_A = 0.3;
const MARK_RES = { value: new THREE.Vector2(1280, 720) };
const markMats = {};
function markMaterial(color) {
  if (markMats[color]) return markMats[color];
  const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).convertSRGBToLinear(), side: THREE.DoubleSide, transparent: true, depthWrite: false });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.markRes = MARK_RES;
    sh.vertexShader = 'attribute vec2 markOff;\nattribute vec2 markMeasure;\nuniform vec2 markRes;\nvarying float vMarkA;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', [
        'vec3 transformed = vec3( position );',
        '{',
        '  vec3 mm = vec3( markMeasure.x, 0.0, markMeasure.y );',
        '  vec4 cA = projectionMatrix * modelViewMatrix * vec4( position + mm, 1.0 );',
        '  vec4 cB = projectionMatrix * modelViewMatrix * vec4( position - mm, 1.0 );',
        '  float k = 1.0;',
        '  if ( cA.w > 0.0 && cB.w > 0.0 ) {',
        // the line's thickness on the screen: the projected width across the projected line
        '    vec4 cL = projectionMatrix * modelViewMatrix * vec4( position + vec3( -mm.z, 0.0, mm.x ), 1.0 );',
        '    vec4 cC = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '    vec2 w = ( cA.xy / cA.w - cB.xy / cB.w ) * 0.5 * markRes;',
        '    vec2 l = ( cL.w > 0.0 && cC.w > 0.0 ) ? ( cL.xy / cL.w - cC.xy / cC.w ) * 0.5 * markRes : vec2( 0.0 );',
        '    float ll = length( l );',
        '    float px = ll > 1e-5 ? abs( w.x * l.y - w.y * l.x ) / ll : length( w );',
        '    k = clamp( ' + MARK_MIN_PX.toFixed(2) + ' / max( px, 1e-4 ), 1.0, ' + MARK_MAX_K.toFixed(1) + ' );',
        '  }',
        '  vMarkA = max( 1.0 / k, ' + MARK_MIN_A.toFixed(2) + ' );',
        '  transformed += vec3( markOff.x, 0.0, markOff.y ) * k;',
        '}'
      ].join('\n'));
    sh.fragmentShader = 'varying float vMarkA;\n' +
      sh.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * vMarkA );');
  };
  mat.customProgramCacheKey = () => 'markLines';
  return (markMats[color] = mat);
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
  return { tMin: Math.min(-a.half, a.tMin || 0) - 700, tMax: Math.max(a.half, a.tMax || 0) + 700, aMin: -500, aMax: LAYOUT.TERMINAL + 400 };
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

// The ground of an airport by its climate, from the same look as the land round it
// (Terrain.lookAt at the field, its own climate there: Terrain.climateOf), so the ground
// texture fades into terrain of the same kind: the green grass of the temperate and the
// northern fields (a lusher green in the tropics), dry yellow-olive grass in the steppe and by
// the Mediterranean (golden on the savanna), sand in the desert, the tundra's olive-brown moss,
// and the winter's snow. grass: the colour (sRGB 0..255); mown: how much the mowing shows;
// snow: 0..1 (whole above 0.97); snowC: its colour
const GROUND_TONE = 0.62;      // the terrain's vertex colours as the land cover shows them, on the whole (flat-ground shading, its mottle and the regions' tone)
const GROUND_TONE_SNOW = 0.74; // the same for the snow (mottled less)
function groundLook(a) {
  const L = Terrain.lookAt(a.x, a.z, a.elev), climate = Terrain.climateOf(a);
  // the terrain's colours are linear (vertex colours), the canvas's sRGB
  const srgb = (v, tone) => { v = clamp(v / 255 * (tone || GROUND_TONE), 0, 1); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); };
  const land = Terrain.groundRGB(L, Math.abs(a.lat), 0.5, [0, 0, 0]).map((v) => srgb(v));
  const lush = climate === 'tropical' || climate === 'subtropical' ? 1 : L.trop;
  const green = [lerp(95, 62, lush), lerp(110, 106, lush), lerp(71, 48, lush)];
  const k = clamp(L.dry + L.tundra + L.arid, 0, 1);
  return {
    L, climate, grass: green.map((v, i) => lerp(v, land[i], k)), mown: 1 - k,
    snow: smoothstep(0.2, 0.8, L.snow), snowC: [234, 238, 247].map((v) => srgb(v, GROUND_TONE_SNOW))
  };
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
  const look = groundLook(a), G = look.grass, C = look.L;
  const rgba = (c, al, k) => 'rgba(' + clamp(c[0] * (k || 1), 0, 255).toFixed(0) + ',' + clamp(c[1] * (k || 1), 0, 255).toFixed(0) + ',' + clamp(c[2] * (k || 1), 0, 255).toFixed(0) + ',' + al + ')';
  const blots = (n, color, s0, s1, round) => {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const x = rng.range(0, cw), y = rng.range(0, ch), s = rng.range(s0, s1);
      if (round) { g.beginPath(); g.ellipse(x, y, s, s * rng.range(0.5, 1), rng.range(0, Math.PI), 0, TAU); g.fill(); } else g.fillRect(x, y, s, s * rng.range(0.6, 1.4));
    }
  };

  // the ground of the airport's climate (groundLook): grass with mowing stripes along the
  // runway, dry grass, sand with dry scrub, moss and lichen; a lighter runway strip
  g.fillStyle = rgba(G, 1);
  g.fillRect(0, 0, cw, ch);
  for (let across = aMin; across < aMax; across += 24) {
    g.fillStyle = ((across / 24) | 0) % 2 ? 'rgba(255,255,230,' + (0.03 * look.mown).toFixed(3) + ')' : 'rgba(0,20,0,' + (0.03 * look.mown).toFixed(3) + ')';
    rect(tMin, tMax, across, across + 24);
  }
  for (let i = 0; i < 3200; i++) {
    const v = rng.range(-18, 18);
    g.fillStyle = rgba([G[0] + v, G[1] + 2 + v, G[2] + 1 + v * 0.5], 0.3);
    g.fillRect(rng.range(0, cw), rng.range(0, ch), rng.range(2, 12), rng.range(2, 12));
  }
  const px1 = Math.max(1, sx);                        // a metre on the canvas
  if (C.arid > 0.3) blots(Math.round(2400 * C.arid), rgba(G, 0.35, 0.72), px1 * 1.5, px1 * 4);             // tussocks of dry grass
  if (C.dry > 0.3) {
    blots(Math.round(260 * C.dry), rgba(G, 0.14, 1.14), px1 * 14, px1 * 50, true);                         // drifts of paler sand
    blots(Math.round(4000 * C.dry), rgba([104, 96, 62], 0.45), px1 * 0.7, px1 * 2, true);                  // the dry scrub
  }
  if (C.tundra > 0.3) {
    blots(Math.round(6000 * C.tundra), rgba(G, 0.2, 0.72), px1 * 1.5, px1 * 7, true);                      // darker moss and the wet hollows
    blots(Math.round(5000 * C.tundra), rgba([196, 192, 160], 0.22), px1 * 0.8, px1 * 2.5, true);           // pale lichen
  }
  g.fillStyle = rgba([G[0] + 65, G[1] + 70, G[2] + 44].map((v, i) => lerp(G[i] * 1.25, v, look.mown)), 0.18);
  rect(-a.half - 160, a.half + 160, -110, 110);
  // the winter's snow over it all (the pavement drawn over it stays ploughed, banked up along its
  // edges: the shoulders below), in patches where it comes and goes
  if (look.snow > 0) {
    const S = look.snowC;
    if (look.snow > 0.97) { g.fillStyle = rgba(S, 1); g.fillRect(0, 0, cw, ch); }
    else blots(Math.round(7000 * look.snow), rgba(S, 0.9), px1 * 8, px1 * 40, true);
    // the drifts: long and thin, all one way (the wind's)
    for (const [n, color] of [[2400, rgba(S, 0.16, 0.92)], [2400, 'rgba(255,255,255,0.14)']]) {
      g.fillStyle = color;
      for (let i = 0, m = Math.round(n * look.snow); i < m; i++) {
        const s = rng.range(px1 * 3, px1 * 14);
        g.beginPath(); g.ellipse(rng.range(0, cw), rng.range(0, ch), s, s * rng.range(0.15, 0.3), 0.6 + rng.range(-0.15, 0.15), 0, TAU); g.fill();
      }
    }
  }

  const asphalt = (path, wM, color) => { g.strokeStyle = color; g.lineWidth = px(wM, 1.2); g.stroke(path); };
  const line = (pts) => { const p = new Path2D(); pts.forEach(([t, ac], i) => { const q = P(t, ac); if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); return p; };
  g.lineCap = 'round'; g.lineJoin = 'round';

  // the perimeter road on the far side of the runway, inside the fence (the fence itself is
  // geometry: perimeter3d.js)
  const fT = a.half + L.FENCE_BEYOND - 20;
  const per = line([[-fT, aMin + 60], [fT, aMin + 60]]);
  asphalt(per, 7, '#55585a');
  g.setLineDash([px(6), px(6)]); asphalt(per, 0.25, 'rgba(240,240,230,0.7)'); g.setLineDash([]);

  // the landside: a road in front of the terminal, the access road, the car park
  const r = a.apronRect;
  const roadA = L.TERMINAL + 52;
  // (their lines and the zebra crossings are strips of geometry: Airport3D.buildMarkings)
  for (const road of landsideRoads(a)) asphalt(line(road), 20, '#4a4d50');
  // the kerb in front of the doors
  g.fillStyle = '#b9b6ad'; rect(r.t0, r.t1, L.TERMINAL + 30, L.TERMINAL + 40);
  // the car park (along the terminals; behind the cargo building the truck park, its trailers
  // are geometry: cargo3d.js)
  const c0 = roadA + 16, c1 = Math.min(aMax - 30, roadA + 130);
  g.fillStyle = '#56595c'; rect(r.t0 - 60, a.paxT1 - 10, c0, c1);
  const carCols = ['#c8ccd0', '#2b2f33', '#8a1d1d', '#1d3f78', '#e6e6e6', '#6b6f73', '#2e5a3a', '#b5a27a'];
  g.fillStyle = '#5c5f61'; rect(a.cargoT0, a.cargoT1 - 10, c0, c0 + 50);
  g.fillStyle = 'rgba(240,240,235,0.75)';
  for (let t = a.cargoT0 + 5.8; t < a.cargoT1 - 12; t += 4.4) { rect(t, t + 0.25, c0 + 1, c0 + 17); rect(t, t + 0.25, c0 + 29, c0 + 45); }
  // the truck yard by the cargo building's dock doors, open to the road
  const y = a.cargoYard;
  g.fillStyle = '#7e8183'; rect(y.t0, y.t1, y.a0, roadA - 8);
  for (let row = c0 + 3; row + 11 < c1; row += 26) {
    for (let t = r.t0 - 56; t < a.paxT1 - 14; t += 2.7) {
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
  // trees along the landside road (none in the tundra: Perimeter3D), dark on green grass, else
  // their shadows
  for (let t = r.t0 - 200; t < r.t1 + 100 && look.climate !== 'tundra'; t += 14) {
    g.fillStyle = look.mown > 0.6 && look.snow < 0.5 ? 'rgba(38,62,34,0.9)' : look.snow >= 0.5 ? 'rgba(96,108,128,0.55)' : rgba(G, 0.6, 0.45);
    const q = P(t, c1 + 8);
    g.beginPath(); g.arc(q[0], q[1], px(3.2, 1.5), 0, TAU); g.fill();
  }

  // pads in front of the hangars, joined to the parallel taxiway
  for (const b of a.buildings) {
    if (b.kind !== 'hangar' && b.kind !== 'fuel') continue;
    g.fillStyle = '#8c8f90';
    rect(b.t - b.along / 2 - 6, b.t + b.along / 2 + 6, L.TWY_OFFSET + 40, b.across - b.acrossSize / 2);
    rect(b.t - 12, b.t + 12, L.TWY_OFFSET, L.TWY_OFFSET + 40);
  }

  // taxiways: shoulders and the pavement, the shapes of render/taxiways.js — straight pieces
  // and the rings of the curves (the edge lines and the centrelines are geometry)
  // (a remote strip's are gravel)
  const plan = Taxiways.plan(a);
  const fill = (polys, color) => {
    const p = new Path2D();
    for (const pts of polys) { pts.forEach(([t, ac], i) => { const q = P(t, ac); if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); p.closePath(); }
    g.fillStyle = color; g.fill(p);
  };
  // (the shoulders: in the winter the banks of the snow ploughed off the pavement)
  fill(Taxiways.pavement(plan, TWY_SHOULDER), look.snow > 0.5 ? rgba(look.snowC, 1, 0.94) : '#8a8574');
  const pave = Taxiways.pavement(plan, 0);
  fill(pave, a.remote ? '#857c6c' : '#65696d');
  paveWear(g, pave, plan, P, px, rng, a.remote);

  // the apron: concrete slabs with joints, a service road along the terminal, the stands
  g.fillStyle = a.remote ? '#928a7a' : '#9b9e9e'; rect(r.t0, r.t1, r.a0, r.a1);
  for (let t = r.t0; t < r.t1; t += 7.5) for (let ac = r.a0; ac < r.a1; ac += 7.5) {
    g.fillStyle = 'rgba(' + (rng.chance(0.5) ? '255,255,250' : '60,60,60') + ',' + rng.range(0.02, 0.09).toFixed(3) + ')';
    rect(t, t + 7.5, ac, ac + 7.5);
  }
  g.fillStyle = 'rgba(70,72,74,0.35)';
  for (let t = r.t0; t < r.t1; t += 7.5) rect(t, t + 0.25, r.a0, r.a1);
  for (let ac = r.a0; ac < r.a1; ac += 7.5) rect(r.t0, r.t1, ac, ac + 0.25);
  // the service road between the stands and the building
  g.fillStyle = 'rgba(60,62,64,0.5)'; rect(r.t0, r.t1, L.SERVICE_ROAD - 7, L.SERVICE_ROAD + 7);
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
  // a remote strip is gravel: packed grey-brown stones, two worn wheel tracks down the middle
  if (a.remote) {
    g.fillStyle = '#7b7264'; rect(-h - RWY_BLAST, h + RWY_BLAST, -e - RWY_SHOULDER, e + RWY_SHOULDER);
    for (let i = 0; i < 14000; i++) {
      const v = rng.range(-22, 22) | 0;
      g.fillStyle = 'rgba(' + (128 + v) + ',' + (118 + v) + ',' + (102 + v) + ',0.5)';
      g.fillRect(rng.range(0, cw), rng.range(0, ch), rng.range(1, 3), rng.range(1, 3));
    }
    g.fillStyle = 'rgba(70,64,56,0.3)';
    for (const ac of [-4, 4]) rect(-h, h, ac - 1.5, ac + 1.5);
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
// An airport's own sign style for its terminals (there is no international standard for the
// look of terminal signs, each airport has its own family): a typeface and a weight, and an
// accent colour from the city's, shifted a little in hue and lightness — fixed by the airport's
// code. Used by the terminal panels (Airport3D.terminalPanel) and the terminal signs (landside3d.js).
const SIGN_FONTS = ['Arial, sans-serif', '"Trebuchet MS", sans-serif', 'Verdana, sans-serif', 'Georgia, serif',
  'Tahoma, sans-serif', '"Segoe UI", sans-serif', '"Gill Sans", "Gill Sans MT", Calibri, sans-serif', '"Century Gothic", Futura, sans-serif'];
function signStyle(a, id) {
  // (unsigned shifts: `>>` turned a hash over 2^31 negative, the index too, so there was no
  // typeface and the canvas fell back to 10 px text — blank signs at those airports)
  const h = hashStr(a.id + 'signs');
  const hsl = {};
  new THREE.Color(id.color).getHSL(hsl);
  const hue = (hsl.h + ((h % 7) - 3) * 0.012 + 1) % 1, sat = clamp(hsl.s * (0.8 + (h >>> 3) % 5 * 0.08), 0.25, 0.9);
  const light = clamp(0.24 + ((h >>> 6) % 6) * 0.03, 0.2, 0.42);
  const css = (l) => '#' + new THREE.Color().setHSL(hue, sat, l).getHexString();
  return {
    font: SIGN_FONTS[(h >>> 9) % SIGN_FONTS.length], weight: ['700', '800', '900'][(h >>> 12) % 3],
    bg: css(light), dark: css(light * 0.6), fg: (h >>> 14) % 3 ? '#ffffff' : '#ffe9a8'
  };
}

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
  // (in the local language when the roof is: the greeting on top, the city in it, the English under)
  const c = COUNTRIES[a.country], l = roofLang(a);
  fit(l && c ? c.hello.toUpperCase() : 'WELCOME TO', '700 44px Arial, sans-serif', 52, 'rgba(255,255,255,0.85)');
  fit((l ? aptCity(a, l) : a.city).toUpperCase(), '900 108px Arial, sans-serif', 134, '#ffffff');
  fit(l ? 'Welcome to ' + a.city + ' · ' + a.country : (c ? c.hello + ' · ' : '') + a.country, 'italic 600 40px Georgia, serif', 222, 'rgba(255,255,255,0.92)');
  return cv;
}

// the taxiway lights' share of full brightness (visual only)
const TWY_LIGHTS_OPACITY = 0.75;
// A lamp's sprite drawn a little nearer the eye than the lamp is, along the line of sight (so it
// stays where it is on the screen): LAMP_PULL_M plus LAMP_PULL_K of the distance. A lamp a few
// tenths of a metre above the ground, or just under its housing, seen far off is a hair's breadth
// from them in depth; moving, it went out and came on again as the ground or the housing won
// the depth test by turns. Pulled in, it always shines. (A lamp behind a building stays hidden:
// the pull is a few metres near, a few tens far off.)
const LAMP_PULL_M = 1.5;
const LAMP_PULL_K = 0.012;
function steadyLamps(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', [
      '#include <project_vertex>',
      '{',
      '  float lampD = length( mvPosition.xyz );',
      '  mvPosition.xyz *= max( 0.05, 1.0 - ( ' + LAMP_PULL_M.toFixed(2) + ' + ' + LAMP_PULL_K.toFixed(4) + ' * lampD ) / max( lampD, 1e-3 ) );',
      '  gl_Position = projectionMatrix * mvPosition;',
      '}'
    ].join('\n'));
  };
  mat.customProgramCacheKey = () => 'steadyLamps';
  return mat;
}

// a round lamp for a point sprite: solid in the middle, a soft rim
function lampDotCanvas() {
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 32;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.55, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return cv;
}
