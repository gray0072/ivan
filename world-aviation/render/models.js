'use strict';

// ============================================================
// World Aviation — 3D aircraft models (three.js), built from each
// type's real dimensions (`dims`) and exterior (`look`):
//
//   - the fuselage is a lathe-like tube of cross-sections: a rounded,
//     slightly drooping nose, a constant cabin, and a tail cone whose
//     top line stays level while the belly sweeps up to the tail
//   - a canvas livery wrapped around it: windows, cheatline, belly,
//     cockpit glass; in an airline's colours (data/airlines.js) also
//     its titles, and its emblem on both sides of the fin
//   - tapered, swept wings with dihedral and an airfoil section that
//     thins towards a rounded tip, a swept fin and tailplane (or a
//     T-tail), winglets
//   - moving control surfaces: flaps, ailerons, spoilers, elevators
//     and the rudder, hinged on their real hinge lines
//   - engines under the wings (2 or 4, under a low or a high wing), on
//     the rear fuselage, or turboprops with spinning propellers (four or
//     six blades)
//   - landing gear that folds away (jets inwards, turboprops and high
//     wings forwards), with bogies of two to five rows on the big jets
//   - a tall body (look.tall: its height over its width) that grows
//     upwards from the same belly; with look.decks = 2 two rows of
//     windows and the cockpit between them
//   - the Beluga's hold (look.bubble): a body of its own over the
//     A300's lower fuselage, its front over the cockpit, its end under
//     the fin, in its own canvas; end plates on the tailplane
//     (look.tailFins); always in its operator's paint (ac.operator)
//   - the An-225's own shapes: six engines (look.engines 'wing6'), a
//     twin tail with a fin at each end of the tailplane (look.tail
//     'twin'), the main gear in side sponsons (look.sponsons), and its
//     finish (look.finish: one of MRIYA_FINISHES in data/mriya.js, the
//     pilot's choice, shining; never in an airline's paint)
//
// The main parts are tagged (g.userData.tags: fuselage, wing, fairing,
// fin, tailplane, nacelle, pylon, gearNose, gearMain, sponson, …) for
// the Mriya's assembly hall (render/mriya3d.js), which gilds them one
// part at a time; build() places the parts by modelLayout()
// (sim/airframe.js), which gives the same layout without the meshes
// (the Mriya's blueprint, ui/mriya.js; the collisions, sim/collide.js).
//
// Model axes: +z = nose, +y = up, +x = left wing. The origin is the
// centre of gravity, and the wheels touch y = -gearH.
// ============================================================

// (mriyaFinish: the Mriya's finish by its id, in career.js)

const AircraftModels = {
  liveries: new Map(),       // aircraft id | airline code -> canvas texture
  finArt: new Map(),         // the same -> the two fin decal textures

  // opts.airline: an airline code, to paint the aeroplane in its colours (never the Mriya; a type
  // with an operator, the Beluga, always in the operator's); opts.finish: the Mriya's finish (an
  // id of MRIYA_FINISHES; its own one without)
  build(ac, opts) {
    opts = opts || {};
    const d = aircraftDims(ac);
    const fin = ac.look && ac.look.finish ? mriyaFinish(opts.finish) : null;
    const alCode = ac.operator || opts.airline;
    const al = alCode && !fin ? AIRLINE_BY_CODE[alCode] : null;
    const look = fin ? Object.assign({}, ac.look, { base: fin.base, color: fin.accent })
      : al ? Object.assign({}, ac.look, { base: al.livery.body, color: al.livery.tail }) : (ac.look || {});
    const lay = modelLayout(ac, look);
    const L = d.len, R = d.radius, S = d.span;
    const hk = lay.hk, top = lay.top;
    const jet = ac.engineType === 'jet';
    const g = new THREE.Group();
    g.userData = { gear: [], props: [], fans: [], surf: { flap: [], aileron: [], spoiler: [], elevator: [], rudder: [] }, tags: {} };
    const surf = g.userData.surf;
    // the main parts by name, for the Mriya's assembly hall (render/mriya3d.js)
    const tag = (name, obj) => { (g.userData.tags[name] = g.userData.tags[name] || []).push(obj); return obj; };

    // colours given like the livery canvas (sRGB), so the painted parts match the painted skin
    const col = (hex) => new THREE.Color(hex).convertSRGBToLinear();
    // the Mriya's finish shines (Phong); every other aeroplane is matt (Lambert)
    const mat = (o) => (fin ? new THREE.MeshPhongMaterial(Object.assign({ specular: fin.specular, shininess: fin.shininess }, o))
      : new THREE.MeshLambertMaterial(o));
    const metal = mat({ color: fin ? col(fin.base) : 0xd9dee3 });
    const base = mat({ color: col(look.base || '#f3f5f7') });
    const paint = mat({ color: col(look.color || '#1f5fa0') });
    const eng = al ? new THREE.MeshLambertMaterial({ color: col(al.livery.engine) }) : base;
    const dark = new THREE.MeshLambertMaterial({ color: 0x23282e });
    const grey = new THREE.MeshLambertMaterial({ color: 0x9aa3ab });

    // ---- fuselage
    const body = fuselageGeometry(L, R, hk);
    const skin = mat({ map: this.livery(ac, d, al, fin) });
    g.add(tag('fuselage', new THREE.Mesh(body.geo, skin)));
    if (look.hump) {
      // the 747 upper deck: blended into the nose, its roof sloping down into the fuselage further back
      const hump = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16), base);
      hump.scale.set(R * 0.74, R * 0.9, L * 0.22);                 // its roof 1.4 R above the axis
      hump.position.set(0, R * 0.5, L * 0.26);
      g.add(tag('fuselage', hump));
    }
    if (look.bubble) {
      // the Beluga's hold over the lower fuselage, from over the cockpit to under the fin
      g.add(tag('fuselage', new THREE.Mesh(bubbleGeometry(L, R, look.bubble), mat({ map: this.bubbleLivery(ac, d, al) }))));
    }

    // ---- wings
    const high = lay.high, sweep = lay.sweep, semi = lay.semi, rootC = lay.rootC, tipC = lay.tipC;
    const thick = lay.thick, wingY = lay.wingY, wingZ = lay.wingZ, dihedral = lay.dihedral;
    const wingDef = {
      semi, rootC, tipC, sweep, tRoot: rootC * (jet ? 0.12 : 0.15), tTip: tipC * (jet ? 0.09 : 0.12), cut: jet ? 0.76 : 0.72,
      pieces: [{ kind: 'flap', f0: 0, f1: 0.6 }, { f0: 0.6, f1: 0.64 }, { kind: 'aileron', f0: 0.64, f1: 0.94 }, { f0: 0.94, f1: 1 }],
      spoilers: jet ? [[0.2, 0.36], [0.38, 0.55]] : [[0.25, 0.55]]
    };
    for (const side of [1, -1]) {
      const m = liftingSurface(wingDef, metal, surf, side);
      m.position.set(side * R * 0.8, wingY, wingZ);
      m.scale.x = side;
      m.rotation.z = side * dihedral;
      g.add(tag('wing', m));
      if (look.winglets) {
        const wl = new THREE.Mesh(finGeometry(tipC * 0.75, tipC * 0.3, S * 0.035, 35 * DEG, thick * 0.4), paint);
        const tipX = side * (R * 0.8 + semi * Math.cos(dihedral));
        wl.position.set(tipX, wingY + semi * Math.sin(dihedral), wingZ - semi * Math.tan(sweep));
        g.add(tag('wing', wl));
      }
    }
    // the wing's centre section through the body, the root's section from one root to the other:
    // where the body is narrower than the roots at the wing's height (a double deck's belly, the
    // lower surface of a thick root) it closes what was a gap between the wing and the body
    if (!high) {
      const centre = liftingSurface({
        semi: R * 1.6, rootC, tipC: rootC, sweep: 0, tRoot: wingDef.tRoot, tTip: wingDef.tRoot, cut: 1, pieces: [], noCap: true
      }, metal, surf, 1);
      centre.position.set(-R * 0.8, wingY, wingZ);
      centre.name = 'wingCentre';
      g.add(tag('wing', centre));
    }
    // wing-to-body fairing for the low wing: in the belly's colour, as wide as the fuselage at its
    // height and a little more (a double deck is narrower down there), just below the belly — a
    // white ball wider than the body, stuck on the grey belly, looked like a bump
    if (!high) {
      const fy = -R * 0.66, c = (fy / R + 1 - hk) / hk;
      const fw = R * Math.sqrt(Math.max(0, 1 - c * c)) + R * 0.06;
      const fair = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshLambertMaterial({ color: col(bellyColour(look, al)) }));
      fair.scale.set(fw, R * 0.4, rootC * 0.85);
      fair.position.set(0, fy, wingZ - rootC * 0.5);
      g.add(tag('fairing', fair));
    } else {
      const fair = new THREE.Mesh(new THREE.BoxGeometry(R * 1.7, R * 0.3, rootC * 0.9), base);
      fair.position.set(0, R * 0.85, wingZ - rootC * 0.5);
      g.add(tag('fairing', fair));
    }

    // ---- tail: fin and tailplane (T-tail on top of the fin; a twin tail: a fin at each end of the tailplane)
    const finRoot = lay.finRoot, finTip = lay.finTip, finH = lay.finH, finSweep = lay.finSweep, finZ = lay.finZ, finY = lay.finY;
    const tTop = lay.tTop, twin = lay.twin;
    // the fin is a lifting surface stood on end (its span up), with the rudder behind it
    const finT = finRoot * 0.08;
    const finDef = {
      semi: finH, rootC: finRoot, tipC: finTip, sweep: finSweep, tRoot: finT, tTip: finTip * 0.08, cut: 0.7, sym: true,
      pieces: [{ f0: 0, f1: 0.06 }, { kind: 'rudder', f0: 0.06, f1: 0.97 }, { f0: 0.97, f1: 1 }]
    };
    if (!twin) {
      const fin = liftingSurface(finDef, paint, surf, 1);
      fin.rotation.z = Math.PI / 2;
      fin.position.set(0, finY, finZ);
      g.add(tag('fin', fin));
      if (al) this.finDecals(g, ac, al, finRoot, finTip, finH, finSweep, finT * 1.02, finY, finZ);
    }
    const tSemi = lay.tSemi, tRoot = lay.tRoot, tTip = lay.tTip;
    const tailDef = {
      semi: tSemi, rootC: tRoot, tipC: tTip, sweep: lay.tSweep, tRoot: tRoot * 0.1, tTip: tTip * 0.09, cut: 0.68, sym: true,
      pieces: [{ kind: 'elevator', f0: 0, f1: 0.96 }, { f0: 0.96, f1: 1 }]
    };
    for (const side of [1, -1]) {
      const m = liftingSurface(tailDef, tTop ? paint : metal, surf, side);
      if (tTop) m.position.set(0, finY + finH - 0.1, finZ - finH * Math.tan(finSweep) - finTip * 0.05);
      else m.position.set(side * R * (twin ? 0.05 : 0.15), lay.tailY, lay.tailZ);
      m.scale.x = side;
      m.rotation.z = side * (tTop || twin ? 0 : 5 * DEG);
      g.add(tag('tailplane', m));
      if (twin) {
        // the fin at this end of the tailplane: a third of it below, the rest above
        const f = liftingSurface(finDef, paint, surf, side);
        f.rotation.z = Math.PI / 2;
        const tipZ = lay.tailZ - tSemi * Math.tan(lay.tSweep);
        f.position.set(side * (R * 0.05 + tSemi + 0.05), lay.tailY - finH * 0.3, tipZ + finRoot * 0.25 + finH * 0.3 * Math.tan(finSweep));
        g.add(tag('fin', f));
      }
      if (look.tailFins) {
        // the Beluga's end plates near the tips of the tailplane: the big body ahead of the fin
        // took away some of its grip, and they give it back; a third of each below the tailplane
        const f = 0.86, h = R * 1.05, c = tRoot + (tTip - tRoot) * f;
        const ep = liftingSurface({
          semi: h, rootC: c * 1.05, tipC: c * 0.6, sweep: 38 * DEG, tRoot: c * 0.08, tTip: c * 0.05, cut: 1, pieces: [], sym: true
        }, paint, surf, side);
        ep.rotation.z = Math.PI / 2;
        const x = side * (R * 0.15 + tSemi * f), le = lay.tailZ - tSemi * f * Math.tan(lay.tSweep);
        ep.position.set(x, lay.tailY + tSemi * f * Math.sin(5 * DEG) - h * 0.33, le + h * 0.33 * Math.tan(38 * DEG) + c * 0.1);
        g.add(tag('fin', ep));
      }
    }

    // ---- engines
    let propGear = null;                                             // low-wing turboprops: main gear under the nacelles
    const spanAt = lay.spanAt, leAt = lay.leAt, yAt = lay.yAt;
    for (const e of lay.engines) {
      const n = jetNacelle(e.dia, e.len, eng, dark, paint, look.flatNacelles);
      n.position.set(e.x, e.y, e.z);
      g.add(tag('nacelle', n));
      g.userData.fans.push(n.userData.fan);
      // the pylon sits on top of the cowling (its foot just inside the cowl, which narrows to
      // 0.42 of the fan at the back), from near the intake to a little past the exhaust: lower,
      // it hung into the exhaust and showed as a box through the back of the engine
      // (its top at the wing's middle: a big fan pulled up to the wing put it through the top
      // of the wing)
      const foot = e.y + e.dia * ((look.flatNacelles ? 0.86 : 1) * 0.42 - 0.03);
      const head = Math.max(foot + e.dia * 0.12, Math.min(e.y + e.dia * 0.72, yAt(e.f)));
      const py = new THREE.Mesh(new THREE.BoxGeometry(e.dia * 0.14, head - foot, e.dia * 1.35), metal);
      py.position.set(e.x, (head + foot) / 2, e.z - e.dia * 0.575);
      g.add(tag('pylon', py));
    }
    if (look.engines === 'rear2') {
      const dia = d.fus * 0.48;
      for (const side of [1, -1]) {
        const n = jetNacelle(dia, dia * 2.1, eng, dark, paint);
        n.position.set(side * (R + dia * 0.75), R * 0.35, -L * 0.24);
        g.add(n);
        g.userData.fans.push(n.userData.fan);
        const py = new THREE.Mesh(new THREE.BoxGeometry(dia * 0.9, dia * 0.16, dia * 1.1), metal);
        py.position.set(side * (R + dia * 0.1), R * 0.35, -L * 0.25);
        g.add(py);
      }
    } else if (!lay.engines.length) {
      // turboprops: a nacelle on the wing, a spinner and four blades
      const dia = d.fus * 0.42;
      for (const side of [1, -1]) {
        const f = 0.3;
        if (!high) propGear = { x: spanAt(f), top: -(yAt(f) - thick * 0.5) };
        const ny = high ? yAt(f) - thick * 0.4 - dia * 0.25 : yAt(f) + thick * 0.2;
        // real props are about 0.65 of the fuselage diameter in radius; keep them clear of the body and the ground
        const propR = Math.min(d.fus * 0.65, (spanAt(f) - R) * 0.9, ny + d.gearH - 0.35);
        const nz = leAt(f) - rootC * 0.25;
        const nac = new THREE.Mesh(new THREE.CylinderGeometry(dia * 0.42, dia * 0.5, rootC * 1.5, 14), base);
        nac.rotation.x = Math.PI / 2;
        nac.position.set(side * spanAt(f), ny, nz);
        g.add(nac);
        const tailCone = new THREE.Mesh(new THREE.ConeGeometry(dia * 0.5, rootC * 0.7, 14), base);
        tailCone.rotation.x = -Math.PI / 2;
        tailCone.position.set(side * spanAt(f), ny, nz - rootC * 0.75 - rootC * 0.35);
        g.add(tailCone);
        const front = nz + rootC * 0.75;
        const spin = new THREE.Mesh(new THREE.ConeGeometry(dia * 0.32, dia * 0.7, 14), dark);
        spin.rotation.x = Math.PI / 2;
        spin.position.set(side * spanAt(f), ny, front + dia * 0.35);
        g.add(spin);
        const prop = new THREE.Group();
        const nb = look.blades || 4;
        for (let b = 0; b < nb; b++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(propR * 0.11, propR, propR * 0.02), dark);
          blade.position.y = propR / 2;
          const arm = new THREE.Group();
          arm.rotation.z = b * TAU / nb;
          blade.rotation.y = 0.35;
          arm.add(blade);
          prop.add(arm);
        }
        const disc = new THREE.Mesh(new THREE.CircleGeometry(propR, 28),
          new THREE.MeshBasicMaterial({ color: 0x2a2f35, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide }));
        prop.add(disc);
        prop.position.set(side * spanAt(f), ny, front + dia * 0.15);
        prop.userData = { disc, blades: prop.children.slice(0, nb), side };
        g.add(prop);
        g.userData.props.push(prop);
      }
    }

    // ---- landing gear: nose gear and two main legs (they reach y = -gearH). Each leg hangs
    // from a pivot at its top and folds up about it: the nose gear forwards, a jet's main
    // gear inwards into the belly, a turboprop's forwards into the nacelle.
    const wheelR = Math.max(0.28, d.fus * 0.13);
    const legR = Math.max(0.07, d.fus * 0.025);
    const mainX = propGear ? propGear.x : high ? R * 1.05 : R * (S > 50 ? 1.15 : 0.95);
    const mainZ = propGear ? wingZ - rootC * 0.55 : -L * 0.03;
    const noseZ = L * 0.38;
    const gear = [];
    const wheel = () => {
      const w = new THREE.Group();
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(wheelR, wheelR, wheelR * 0.7, 16), dark);
      tyre.rotation.z = Math.PI / 2;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(wheelR * 0.45, wheelR * 0.45, wheelR * 0.74, 10), grey);
      hub.rotation.z = Math.PI / 2;
      w.add(tyre, hub);
      return w;
    };
    // wheels: [x offset, z offset] from the foot of the leg
    const addLeg = (x, z, top, wheels, fold, name) => {
      const len = Math.max(0.2, d.gearH - wheelR - top);
      const pivot = new THREE.Group();
      pivot.position.set(x, -top, z);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(legR, legR * 1.2, len, 8), grey);
      leg.position.y = -len / 2;
      pivot.add(leg);
      // a torque link and the axle beam from the first row of wheels to the last, so the leg reads as a leg
      const z0 = wheels[0][1], z1 = wheels[wheels.length - 1][1];
      const axle = new THREE.Mesh(new THREE.BoxGeometry(legR * 2, legR * 2, Math.max(legR * 3, Math.abs(z1 - z0) + legR * 2)), grey);
      axle.position.set(0, -len, (z0 + z1) / 2);
      pivot.add(axle);
      for (const [ox, oz] of wheels) {
        const w = wheel();
        w.position.set(ox, -len, oz);
        pivot.add(w);
      }
      g.add(tag(name, pivot));
      gear.push({ pivot, axis: fold[0], angle: fold[1] });
    };
    const big = S > 50 || !!look.mainRows;                           // (the Beluga's A300 bogies, though its span is under 50 m)
    const FWD = ['x', -Math.PI / 2];                                   // the foot swings forwards and up
    // a bogie: pairs of wheels in rows, two with the leg at the front row, more (the 777's
    // main gear and the A380's body gear have three, the An-124's five) with the leg in the middle
    const bogie = (rows) => {
      const w = [];
      for (let r = 0; r < rows; r++) for (const off of [-wheelR * 0.45, wheelR * 0.45]) w.push([off, -wheelR * 2.3 * (r - (rows > 2 ? (rows - 1) / 2 : 0))]);
      return w;
    };
    addLeg(0, noseZ, R * 0.75, big ? [[-wheelR * 0.4, 0], [wheelR * 0.4, 0]] : [[0, 0]], FWD, 'gearNose');
    for (const side of [1, -1]) {
      const wheels = big ? bogie(look.mainRows || 2) : [[0, 0]];
      const legTop = propGear ? propGear.top : high ? R * 0.5 : R * 0.7;
      addLeg(side * mainX, mainZ, legTop, wheels, propGear || high ? FWD : ['z', -side * Math.PI / 2], 'gearMain');
    }
    if ((look.engines === 'wing4' && !high) || look.hump) {
      // the 747's and the A380's body gear between the wing gear
      for (const side of [1, -1]) addLeg(side * R * 0.35, mainZ - L * 0.04, R * 0.9, bogie(look.bodyRows || 2), FWD, 'gearMain');
    }
    if (look.sponsons) {
      // the An-124's and the An-225's main gear sits in long fairings along the sides of the belly
      const rows = look.mainRows || 2, len = wheelR * 2.3 * (rows - 1) + wheelR * 5;
      for (const side of [1, -1]) {
        const sp = new THREE.Mesh(new THREE.CapsuleGeometry(R * 0.38, len, 6, 16), base);
        sp.rotation.x = Math.PI / 2;
        sp.scale.set(0.72, 1, 1);
        sp.position.set(side * R * 0.98, -R * 0.62, mainZ);
        g.add(tag('sponson', sp));
      }
    }
    if (!look.fixedGear) g.userData.gear = gear;

    // ---- the lights (points of a fixed pixel size, off until animate() switches them on):
    // navigation red on the left wingtip, green on the right, white on the tail; the red
    // beacon on top and under the belly; white strobes on the wingtips; the landing lights
    // in the wing roots and the taxi light on the nose gear
    const tips = [1, -1].map((side) => [side * (R * 0.8 + semi * Math.cos(dihedral)), wingY + semi * Math.sin(dihedral), wingZ - semi * Math.tan(sweep) - tipC * 0.3]);
    const lightSet = (pts, colours) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colours.flat(), 3));
      const p = new THREE.Points(geo, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true, fog: true }));
      p.visible = false;
      g.add(p);
      return p;
    };
    const RED = [1, 0.12, 0.08], GREEN = [0.2, 1, 0.35], WHITE = [1, 1, 0.95];
    g.userData.lights = {
      nav: lightSet([tips[0], tips[1], [0, R * 0.75, -L / 2 - 0.2]], [RED, GREEN, WHITE]),
      beacon: lightSet([[0, top + 0.15, -L * 0.05], [0, -R - 0.15, L * 0.05]], [RED, RED]),
      strobe: lightSet([[tips[0][0], tips[0][1], tips[0][2] - tipC * 0.3], [tips[1][0], tips[1][1], tips[1][2] - tipC * 0.3]], [WHITE, WHITE]),
      landing: lightSet([[R * 0.8 + semi * 0.15, wingY, leAt(0.15) + 0.2], [-(R * 0.8 + semi * 0.15), wingY, leAt(0.15) + 0.2],
        [0, -R * 0.9, noseZ + 0.4]], [WHITE, WHITE, WHITE])
    };
    return g;
  },

  // spin the propellers and the fans, fold the gear; called every frame for the player's aircraft
  animate(model, st) {
    for (const p of model.userData.props) {
      const speed = st.propSpeed || 0;
      p.rotation.z += speed * p.userData.side;
      const blur = clamp((speed - 0.25) / 0.4, 0, 1);
      p.userData.disc.material.opacity = blur * 0.35;
      for (const b of p.userData.blades) b.visible = blur < 0.9;
    }
    // the fans turn with the power (slowly enough that the blades never strobe backwards)
    for (const f of model.userData.fans || []) f.rotation.z -= (st.propSpeed || 0) * 0.11;
    const down = st.gear === undefined ? 1 : clamp(st.gear, 0, 1);
    for (const leg of model.userData.gear) {
      leg.pivot.rotation[leg.axis] = leg.angle * (1 - down);
      leg.pivot.visible = down > 0.02;
    }
    // the control surfaces: angles in radians, + = trailing edge up (rudder: to the right)
    const s = model.userData.surf;
    if (!s) return;
    const flap = clamp(st.flaps || 0, 0, 1) * -0.62;
    for (const p of s.flap) p.rotation.x = flap;
    for (const p of s.aileron) p.rotation.x = -p.userData.side * clamp(st.aileron || 0, -1, 1) * 0.35;
    for (const p of s.elevator) p.rotation.x = clamp(st.elevator || 0, -1, 1) * 0.4;
    for (const p of s.rudder) p.rotation.x = clamp(st.rudder || 0, -1, 1) * 0.4;
    const sp = clamp(st.spoiler || 0, 0, 1);
    for (const p of s.spoiler) { p.visible = sp > 0.02; p.rotation.x = sp * 0.85; }
    // the lights (st.lights from Scene3D.lightsFor): the beacon flashes once a second, the
    // strobes twice in quick succession every 1.2 s; bigger in the dark
    const Lt = model.userData.lights, on = st.lights;
    if (Lt) {
      const tm = st.time || 0, dk = st.dark || 0;
      Lt.nav.visible = !!(on && on.nav);
      Lt.beacon.visible = !!(on && on.beacon) && tm % 1 < 0.14;
      const sp2 = tm % 1.2;
      Lt.strobe.visible = !!(on && on.strobe) && (sp2 < 0.05 || (sp2 > 0.12 && sp2 < 0.17));
      Lt.landing.visible = !!(on && (on.landing || on.taxi));
      Lt.nav.material.size = 2.5 + 3 * dk;
      Lt.beacon.material.size = 3 + 4 * dk;
      Lt.strobe.material.size = 4 + 6 * dk;
      Lt.landing.material.size = 3 + 8 * dk;
    }
  },

  // the paint scheme: a canvas wrapped around the fuselage (x = along, nose at the right; y = around, top at 0)
  livery(ac, d, al, fin) {
    const key = ac.id + '|' + (al ? al.code : '') + '|' + (fin ? fin.id : '');
    if (this.liveries.has(key)) return this.liveries.get(key);
    const look = al ? Object.assign({}, ac.look, { base: al.livery.body, color: al.livery.tail }) : (ac.look || {});
    const lv = al ? al.livery : null;
    const W = 1024, H = 256;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const L = d.len;
    const px = W / L;                                   // canvas pixels per metre along the body
    const yAt = (deg) => deg / 360 * H;                 // angle from the top of the fuselage
    g.fillStyle = look.base || '#f3f5f7';
    g.fillRect(0, 0, W, H);
    const color = look.color || '#1f5fa0';
    // a double deck: the main deck windows lower down, the upper deck's above them, the cockpit
    // between the two, and the cheatline and the belly pushed down (by `lo` degrees) below them
    const dd = look.decks === 2;
    const rows = dd ? [65, 104] : [78], lo = dd ? 16 : 0, ck = dd ? 22 : 0;
    if (fin) {
      // the Mriya in its finish: lighter on the roof, deeper under the belly, its lines along each
      // side (one under the other, or one stripe flowing through their colours) and its name over them
      const sh = g.createLinearGradient(0, 0, 0, H);
      sh.addColorStop(0, fin.light); sh.addColorStop(0.3, fin.base); sh.addColorStop(0.5, fin.shade);
      sh.addColorStop(0.7, fin.base); sh.addColorStop(1, fin.light);
      g.fillStyle = sh;
      g.fillRect(0, 0, W, H);
      const n = fin.lines.length;
      for (const c of [100, 260]) {
        if (fin.flow) {
          const fl = g.createLinearGradient(W * 0.03, 0, W * 0.96, 0);
          fin.lines.forEach((cl, i) => fl.addColorStop(i / Math.max(1, n - 1), cl));
          g.fillStyle = fl;
          g.fillRect(W * 0.03, yAt(c - 4), W * 0.93, yAt(8));
        } else {
          fin.lines.forEach((cl, i) => {
            g.fillStyle = cl;
            const a = c + (c < 180 ? 1 : -1) * (i - (n - 1) / 2) * 6;
            g.fillRect(W * 0.03, yAt(a - (n > 1 ? 3 : 2.5)), W * 0.93, yAt(n > 1 ? 6 : 5));
          });
        }
      }
      this.titles(g, { livery: { title: fin.title }, title: 'AN-225 MRIYA' }, W, H, L, d.radius, true, false);
    } else if (!lv) {
      // belly
      g.fillStyle = 'rgba(150,160,170,0.55)';
      g.fillRect(0, yAt(118 + lo), W, yAt(124 - 2 * lo));
      // cheatline below the windows on both sides, and a bold tail sweep at the back, over the
      // top of the tail cone into the fin (all round, the cone looked like a coloured bulb from below)
      g.fillStyle = color;
      for (const c of [100 + lo, 260 - lo]) g.fillRect(W * 0.04, yAt(c - 3), W * 0.9, yAt(5));
      g.globalAlpha = 0.9;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.2, 0); g.lineTo(W * 0.11, yAt(55)); g.lineTo(0, yAt(75)); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(0, H); g.lineTo(W * 0.2, H); g.lineTo(W * 0.11, yAt(305)); g.lineTo(0, yAt(285)); g.closePath(); g.fill();
      g.globalAlpha = 1;
    } else {
      // an airline's paint: the belly below the cheatline, a coloured nose, the cheatline,
      // the fin colour running into the top of the tail cone, and the titles
      g.fillStyle = lv.belly || 'rgba(150,160,170,0.45)';
      g.fillRect(0, yAt((lv.belly ? 104 : 118) + lo), W, yAt((lv.belly ? 152 : 124) - 2 * lo));
      if (lv.nose) {
        g.fillStyle = lv.nose;
        g.beginPath(); g.moveTo(W, 0); g.lineTo(W * 0.9, 0); g.bezierCurveTo(W * 0.95, H * 0.3, W * 0.95, H * 0.7, W * 0.9, H); g.lineTo(W, H); g.fill();
      }
      if (lv.cheat) lv.cheat.forEach((c, i) => {
        g.fillStyle = c;
        for (const a of [98 + i * 4 + lo, 258 - i * 4 - lo]) g.fillRect(W * 0.03, yAt(a), W * 0.92, yAt(3.2));
      });
      if (lv.tail !== lv.body) {
        g.fillStyle = lv.tail;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.17, 0); g.lineTo(W * 0.1, yAt(40)); g.lineTo(0, yAt(60)); g.fill();
        g.beginPath(); g.moveTo(0, H); g.lineTo(W * 0.17, H); g.lineTo(W * 0.1, yAt(320)); g.lineTo(0, yAt(300)); g.fill();
      }
      this.titles(g, al, W, H, L, d.radius, !!look.freighter, dd);
    }
    // passenger windows
    if (!look.freighter) {
      g.fillStyle = '#1d2733';
      const pitch = Math.max(3, 0.53 * px), ww = Math.max(1.6, 0.24 * px);
      rows.forEach((row, i) => {
        // the upper deck ends further forward and further back than the main deck
        const x0 = W * (i < rows.length - 1 ? 0.33 : 0.27), x1 = W * (i < rows.length - 1 ? 0.84 : FRONT_DOOR_U);
        for (const c of [row, 360 - row]) {
          for (let x = x0; x < x1; x += pitch) g.fillRect(x, yAt(c - 4), ww, yAt(6));
        }
        // doors
        g.strokeStyle = 'rgba(60,70,80,0.6)'; g.lineWidth = 1;
        for (const fx of [x0 / W - 0.02, x1 / W]) for (const c of [row + 8, 352 - row]) g.strokeRect(W * fx, yAt(c - 14), Math.max(4, 0.85 * px), yAt(26));
      });
    } else {
      g.strokeStyle = 'rgba(60,70,80,0.6)'; g.lineWidth = 1.5;
      g.strokeRect(W * 0.62, yAt(60), Math.max(10, 3.4 * px), yAt(40));          // main deck cargo door
    }
    // cockpit glass at the nose
    g.fillStyle = '#1a2430';
    const cx = W * (1 - Math.min(0.09, 2.6 / L));
    for (const c of [62 + ck, 298 - ck]) g.fillRect(cx, yAt(c - 12), Math.max(6, 1.5 * px), yAt(16));
    g.beginPath();
    g.moveTo(cx + 1.4 * px, yAt(330 - ck)); g.lineTo(cx + 2.4 * px, yAt(345 - ck)); g.lineTo(cx + 2.4 * px, yAt(360 - ck));
    g.lineTo(cx + 1.4 * px, yAt(360 - ck)); g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(cx + 1.4 * px, yAt(30 + ck)); g.lineTo(cx + 2.4 * px, yAt(15 + ck)); g.lineTo(cx + 2.4 * px, yAt(ck));
    g.lineTo(cx + 1.4 * px, yAt(ck)); g.closePath(); g.fill();
    const tex = paintedTexture(cv);
    this.liveries.set(key, tex);
    return tex;
  },

  // The Beluga's hold: a canvas of its own like the fuselage's (x = along, the nose at the right;
  // y = around, the top at 0) in its operator's paint — the body colour, the tail colour running
  // up from the fin over its end, the seam of the door round its front behind the cockpit, and
  // the titles big on its sides
  bubbleLivery(ac, d, al) {
    const key = ac.id + '|' + (al ? al.code : '') + '|hold';
    if (this.liveries.has(key)) return this.liveries.get(key);
    const look = ac.look || {};
    const lv = al ? al.livery : { body: look.base || '#ffffff', title: look.color || '#1f5fa0', tail: look.color || '#1f5fa0' };
    const W = 1024, H = 256, L = d.len;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const yAt = (deg) => deg / 360 * H;
    g.fillStyle = lv.body;
    g.fillRect(0, 0, W, H);
    if (lv.tail !== lv.body) {
      g.fillStyle = lv.tail;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.2, 0); g.lineTo(W * 0.1, yAt(50)); g.lineTo(0, yAt(70)); g.fill();
      g.beginPath(); g.moveTo(0, H); g.lineTo(W * 0.2, H); g.lineTo(W * 0.1, yAt(310)); g.lineTo(0, yAt(290)); g.fill();
    }
    g.fillStyle = 'rgba(60,70,80,0.55)';
    g.fillRect(W * (1 - BUBBLE_DOOR), 0, 2, H);
    const R = d.radius * look.bubble;
    this.titles(g, al || { livery: lv, title: 'BELUGA' }, W, H, L, R, true, false, R * 0.6);
    const tex = paintedTexture(cv);
    this.liveries.set(key, tex);
    return tex;
  },

  // the airline's titles on both sides, above the windows (on the right side, -x, the canvas
  // runs upside down and backwards); dd: a double-deck body; hBig: the letters' height, metres
  // (the Beluga's hold), else by the body's size
  titles(g, al, W, H, L, R, freighter, dd, hBig) {
    const lv = al.livery;
    const pxAlong = W / L, pxAround = H / (TAU * R);
    const hM = hBig || Math.min(1.4, Math.max(0.45, R * (freighter ? 0.62 : 0.42)));     // letter height, metres
    const size = hM * pxAround;
    const text = al.title || al.name;
    const font = lv.titleFont === 'serif' ? 'bold ' + size + 'px Georgia, serif'
      : lv.titleFont ? 'bold ' + size + 'px Arial, sans-serif'
        : '900 ' + size + 'px Arial, sans-serif';
    const cx = W * 0.6, maxW = W * (freighter ? 0.6 : 0.5);
    for (const side of [1, -1]) {
      const a = dd ? 40 : freighter ? 62 : 58;                // above the windows (a double deck: above the upper deck's)
      const cy = (side > 0 ? a : 360 - a) / 360 * H;
      g.save();
      g.translate(cx, cy);
      if (side < 0) g.scale(-1, -1);
      g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
      const sx = pxAlong / pxAround;                           // letters as wide in metres as they are tall
      const tw = g.measureText(text).width * sx;
      g.scale(sx * Math.min(1, maxW / tw), 1);
      if (lv.titleFont === 'fedex') {
        const w1 = g.measureText('Fed').width, w2 = g.measureText('Ex').width;
        g.textAlign = 'left';
        g.fillStyle = '#4d148c'; g.fillText('Fed', -(w1 + w2) / 2, 0);
        g.fillStyle = '#ff6200'; g.fillText('Ex', -(w1 + w2) / 2 + w1, 0);
      } else {
        g.fillStyle = lv.title;
        g.fillText(text, 0, 0);
      }
      g.restore();
    }
  },

  // The emblem on the fin: one transparent decal on each side, each drawn so that it reads
  // the right way round, clipped to the fin's outline.
  finDecals(group, ac, al, rootC, tipC, h, sweep, thick, finY, finZ) {
    const key = ac.id + '|' + al.code;
    const tipLe = -h * Math.tan(sweep);
    const zMax = 0, zMin = Math.min(-rootC, tipLe - tipC), span = zMax - zMin;
    let tex = this.finArt.get(key);
    if (!tex) {
      tex = [1, -1].map((side) => {
        const H = 256, W = Math.min(512, Math.max(64, Math.round(H * span / h / 4) * 4));
        const cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        const g = cv.getContext('2d');
        // side +1 (+x): the canvas runs from the leading edge towards the tail; side -1 the other way
        const U = (z) => (side > 0 ? (zMax - z) : (z - zMin)) / span * W;
        const V = (y) => (1 - y / h) * H;
        const poly = [[0, 0], [tipLe, h], [tipLe - tipC, h], [-rootC, 0]];
        g.beginPath();
        poly.forEach(([z, y], i) => (i ? g.lineTo(U(z), V(y)) : g.moveTo(U(z), V(y))));
        g.closePath(); g.clip();
        const yc = h * 0.5, f = yc / h;
        const le = tipLe * f, te = -rootC + (tipLe - tipC + rootC) * f;
        const chord = Math.abs(le - te);
        const rM = Math.min(chord * 0.4, h * 0.36);
        Emblems.draw(g, al, { w: W, h: H, cx: U((le + te) / 2), cy: V(yc), r: rM / h * H });
        return paintedTexture(cv);
      });
      this.finArt.set(key, tex);
    }
    [1, -1].forEach((side, i) => {
      const geo = new THREE.PlaneGeometry(span, h);
      geo.rotateY(side * Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex[i], transparent: true, alphaTest: 0.4 }));
      m.position.set(side * (thick / 2 + 0.03), finY + h / 2, finZ + (zMin + zMax) / 2);
      group.add(m);
    });
  }
};

// The colour of the belly as the livery paints it (an airline's belly colour, or the grey wash
// over the body colour), for the parts under it: the wing-to-body fairing
function bellyColour(look, al) {
  if (al && al.livery.belly) return al.livery.belly;
  const a = al ? 0.45 : 0.55, b = new THREE.Color(look.base || '#f3f5f7');
  return '#' + b.lerp(new THREE.Color(150 / 255, 160 / 255, 170 / 255), a).getHexString();
}

// The front passenger door (painted on the livery, its forward edge at FRONT_DOOR_U of the body
// from the tail, 0.85 m wide): its middle, metres back from the nose tip. The jet bridges and the
// airstairs of the parked aeroplanes (apron3d.js) dock there.
const FRONT_DOOR_U = 0.86;
function frontDoorFromNose(L) { return L * (1 - FRONT_DOOR_U) - 0.425; }

// The fuselage's cross-section at z (model axes, the nose at L / 2): its radius r and how far its
// centre sits above the axis, y
function fuselageRing(L, R, z) {
  const noseLen = Math.min(L * 0.14, R * 2.8), tailLen = L * 0.3;
  const zNose = L / 2, zTail = -L / 2;
  if (z > zNose - noseLen) {
    const u = Math.min(1, (z - (zNose - noseLen)) / noseLen);   // 0 → 1 to the tip
    return { r: R * Math.sqrt(Math.max(0, 1 - u * u)) * (1 - 0.06 * u), y: -R * 0.16 * u * u };
  }
  if (z < zTail + tailLen) {
    const u = Math.min(1, ((zTail + tailLen) - z) / tailLen);   // 0 → 1 to the tail end
    // smooth off the cabin, still narrowing at the end: a cone to the tip (a curve that went
    // flat there left a long thin tube, a rod under the tail seen from below)
    const e = u * u * (2 - u);
    const r = R * (1 - 0.86 * e);
    return { r, y: (R - r) * 0.93 };                             // the top line stays level, the belly sweeps up
  }
  return { r: R, y: 0 };
}

// The fuselage: rings of vertices along z. u = along the body (tail 0 → nose 1), v = around (top 0).
// hk > 1 makes a double-deck body: each ring hk times as tall as it is wide, grown upwards from its belly.
function fuselageGeometry(L, R, hk) {
  hk = hk || 1;
  const N = 56, SEG = 24;
  const zTail = -L / 2;
  const ring = (z) => fuselageRing(L, R, z);
  const pos = [], uv = [], idx = [];
  const zs = [];
  for (let i = 0; i <= N; i++) zs.push(zTail + L * (0.5 - 0.5 * Math.cos(Math.PI * i / N)));
  for (let i = 0; i <= N; i++) {
    const z = zs[i];
    const c = ring(z);
    const r = i === 0 ? 0 : c.r;                                 // close the tail end
    for (let j = 0; j <= SEG; j++) {
      const th = j / SEG * TAU;
      // round from the top towards -x (the right side), so the triangles face outwards
      pos.push(-Math.sin(th) * r, c.y + (Math.cos(th) * hk + hk - 1) * r, z);
      uv.push((z - zTail) / L, 1 - j / SEG);
    }
  }
  const w = SEG + 1;
  for (let i = 0; i < N; i++) for (let j = 0; j < SEG; j++) {
    const a = i * w + j, b = a + 1, c = a + w, e = c + 1;
    idx.push(a, b, c, b, e, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return { geo };
}

// The Beluga's hold (look.bubble = k, its radius over R; bubbleSection in sim/airframe.js): an
// elliptic section at z — its roof T, its floor B, its half width a — or null outside it. In the
// middle the full section, a circle meeting the lower fuselage in the crease; at the front a
// blunt forehead whose floor rides on the roof of the cockpit (the door that swings up over it)
// before it comes down the sides to the crease; at the back the roof sinks and the sides close
// in under the fin, rounded off at its end. u: along the body as the fuselage's (tail 0, nose 1)
// (where along the body: shares of the length behind the nose)
const BUBBLE_FRONT = 0.03;    // its front tip, over the cockpit
const BUBBLE_FULL = 0.17;     // full section from here back
const BUBBLE_DROP = 0.065;    // the floor leaves the cockpit roof here, coming down to the crease
const BUBBLE_REAR = 0.54;     // the roof starts down here (over the wing's trailing edge)
const BUBBLE_END = 0.99;      // and it ends here, under the fin
const BUBBLE_DOOR = 0.155;    // the seam of the door round the front (on the livery)
function bubbleRing(L, R, k, z) {
  const sec = bubbleSection(R, k);
  const zF = L / 2 - L * BUBBLE_FRONT, zFull = L / 2 - L * BUBBLE_FULL, zD = L / 2 - L * BUBBLE_DROP;
  const zR = L / 2 - L * BUBBLE_REAR, zE = L / 2 - L * BUBBLE_END;
  const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  if (z > zF || z < zE) return null;
  if (z > zFull) {
    const roof = (zz) => { const c = fuselageRing(L, R, zz); return c.y + c.r - R * 0.03; };
    const v = (zF - z) / (zF - zFull), e = Math.sqrt(1 - (1 - v) * (1 - v));
    const T = roof(zF) + (sec.top - roof(zF)) * e;
    const B = z > zD ? roof(z) : roof(zD) + (sec.bottom - roof(zD)) * smooth((zD - z) / (zD - zFull));
    return { T: Math.max(T, B), B, a: sec.rb * e };
  }
  if (z > zR) return { T: sec.top, B: sec.bottom, a: sec.rb };
  // the tail: down to a section under the fin's root, closing over its last metres
  const w = smooth((zR - z) / (zR - zE));
  const T = sec.top + (R * 1.32 - sec.top) * w, B = sec.bottom + (R * 0.72 - sec.bottom) * w;
  let a = sec.rb + (R * 0.3 - sec.rb) * w;
  const cap = R * 0.35, q = z - zE < cap ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - (z - zE) / cap, 2))) : 1;
  const c = (T + B) / 2, b = (T - B) / 2 * q;
  a *= q;
  return { T: c + b, B: c - b, a };
}
function bubbleGeometry(L, R, k) {
  const N = 72, SEG = 32;
  const zA = L / 2 - L * BUBBLE_END, zB = L / 2 - L * BUBBLE_FRONT;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const z = zA + (zB - zA) * (0.5 - 0.5 * Math.cos(Math.PI * i / N));
    const s = bubbleRing(L, R, k, Math.min(zB, Math.max(zA, z))) || { T: 0, B: 0, a: 0 };
    const c = (s.T + s.B) / 2, b = (s.T - s.B) / 2;
    for (let j = 0; j <= SEG; j++) {
      const th = j / SEG * TAU;
      // round from the top towards -x, as the fuselage, so the triangles face outwards
      pos.push(-Math.sin(th) * s.a, c + Math.cos(th) * b, z);
      uv.push((z + L / 2) / L, 1 - j / SEG);
    }
  }
  const w = SEG + 1;
  for (let i = 0; i < N; i++) for (let j = 0; j < SEG; j++) {
    const a = i * w + j, b = a + 1, c = a + w, e = c + 1;
    idx.push(a, b, c, b, e, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// A half wing (or tailplane, or a fin on its side) towards +x: tapered and swept, the leading
// edge root at the origin, the chord towards -z, an airfoil section (NACA-like thickness, a
// little flatter underneath) that thins towards the tip, which is rounded off. The part behind
// the hinge line (`cut`, a fraction of the chord) is made of separate pieces; the ones with a
// `kind` hang from pivots on the hinge line and go into `surf` to be moved by animate().
// def: { semi, rootC, tipC, sweep, tRoot, tTip, cut, pieces: [{ kind?, f0, f1 }], spoilers?, sym?, noCap? }
function liftingSurface(def, mat, surf, side) {
  const grp = new THREE.Group();
  const tanS = Math.tan(def.sweep);
  const up = def.sym ? 1 : 1.15, lo = def.sym ? 1 : 0.85;
  const yt = (x) => (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1036 * x * x * x * x) / 0.1003 * 0.5;
  // a point of the surface: span fraction f, chord fraction x, upper (+1) or lower (-1)
  const P = (f, x, s) => {
    const c = def.rootC + (def.tipC - def.rootC) * f, t = def.tRoot + (def.tTip - def.tRoot) * f;
    return [def.semi * f, s * t * yt(x) * (s > 0 ? up : lo), -def.semi * f * tanS - x * c];
  };
  // the ring of a section between chord fractions x0 and x1: upper surface back to front, lower front to back
  const N = 9;
  const xs = (x0, x1) => { const r = []; for (let i = 0; i <= N; i++) r.push(x0 + (x1 - x0) * (0.5 - 0.5 * Math.cos(Math.PI * i / N))); return r; };
  const ring = (f, x0, x1, pt) => {
    const X = xs(x0, x1), r = [];
    for (let i = N; i >= 0; i--) r.push(pt(f, X[i], 1));
    for (let i = x0 === 0 ? 1 : 0; i <= N; i++) r.push(pt(f, X[i], -1));
    return r;
  };
  // a loft through rings, optionally closed at both ends
  const loft = (rings, caps) => {
    const pos = [], idx = [], K = rings[0].length;
    for (const r of rings) for (const p of r) pos.push(p[0], p[1], p[2]);
    for (let i = 0; i + 1 < rings.length; i++) for (let j = 0; j < K; j++) {
      const a = i * K + j, b = i * K + (j + 1) % K, c = a + K, e = b + K;
      idx.push(a, c, b, b, c, e);
    }
    if (caps) for (const [ri, flip] of [[0, true], [rings.length - 1, false]]) {
      const base = ri * K;
      for (let j = 1; j + 1 < K; j++) idx.push(...(flip ? [base, base + j + 1, base + j] : [base, base + j, base + j + 1]));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    // make sure the triangles face outwards: the highest point's normal must point up
    let top = 0;
    for (let i = 1; i < pos.length / 3; i++) if (pos[i * 3 + 1] > pos[top * 3 + 1]) top = i;
    if (geo.attributes.normal.getY(top) < 0) {
      for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
      geo.setIndex(idx);
      geo.computeVertexNormals();
    }
    return geo;
  };
  const cut = def.cut;
  grp.add(new THREE.Mesh(loft([ring(0, 0, cut, P), ring(1, 0, cut, P)], true), mat));        // closed at the root too: a high wing's root shows above the body
  // the rounded tip: sections past the tip whose chord and thickness shrink on a quarter circle
  if (!def.noCap) {
    const cap = [ring(1, 0, 1, P)];
    const capLen = def.tipC * 0.32;
    const tipLe = -def.semi * tanS;
    for (const e of [0.4, 0.7, 0.9, 1]) {
      const s = Math.max(0.06, Math.sqrt(1 - e * e));
      const c = def.tipC * s, le = tipLe - def.tipC * (1 - s) * 0.35, t = def.tTip * s;
      cap.push(ring(0, 0, 1, (f, x, sg) => [def.semi + capLen * e, sg * t * yt(x) * (sg > 0 ? up : lo), le - x * c]));
    }
    grp.add(new THREE.Mesh(loft(cap, true), mat));
  }
  // the pieces behind the hinge line
  for (const pc of def.pieces) {
    const geo = loft([ring(pc.f0, cut, 1, P), ring(pc.f1, cut, 1, P)], true);
    if (!pc.kind) { grp.add(new THREE.Mesh(geo, mat)); continue; }
    grp.add(hinged(geo, mat, P(pc.f0, cut, 1), P(pc.f1, cut, 1), def.tRoot * 0.25, surf[pc.kind], side));
  }
  // spoiler panels lying on the upper surface ahead of the flaps, hinged at their front
  for (const [f0, f1] of def.spoilers || []) {
    const x0 = cut - 0.2, x1 = cut - 0.01;
    const panel = (f, x) => { const p = P(f, x, 1); p[1] += 0.015; return p; };
    const a = panel(f0, x0), b = panel(f1, x0), c = panel(f1, x1), e = panel(f0, x1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...e, ...c, ...a, ...c, ...b], 3));
    geo.computeVertexNormals();
    const piv = hinged(geo, new THREE.MeshLambertMaterial({ color: 0xc4cad0, side: THREE.DoubleSide }), a, b, 0, surf.spoiler, side);
    piv.children[0].visible = false;
    grp.add(piv);
  }
  return grp;
}

// A moving part: a pivot on the hinge line from h0 to h1 (lifted by `lift` to the middle of the
// section); the mesh inside it turns about its local x axis, which lies along the hinge.
function hinged(geo, mat, h0, h1, lift, list, side) {
  const a = new THREE.Vector3(h0[0], h0[1] - lift, h0[2]), b = new THREE.Vector3(h1[0], h1[1] - lift, h1[2]);
  const pivot = new THREE.Group();
  pivot.position.copy(a);
  pivot.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), b.clone().sub(a).normalize());
  pivot.updateMatrix();
  geo.applyMatrix4(pivot.matrix.clone().invert());
  const m = new THREE.Mesh(geo, mat);
  m.userData.side = side;
  pivot.add(m);
  list.push(m);
  return pivot;
}

// A fin: chord along z (leading edge root at the origin), height up +y, thickness centred on x = 0
function finGeometry(rootC, tipC, h, sweep, thick) {
  const sh = new THREE.Shape();
  const tipLe = -h * Math.tan(sweep);
  sh.moveTo(0, 0);
  sh.lineTo(tipLe, h);
  sh.lineTo(tipLe - tipC, h);
  sh.lineTo(-rootC, 0);
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false });
  geo.rotateY(-Math.PI / 2);                // shape x (chord) → z, the extrusion → x
  geo.translate(thick / 2, 0, 0);
  return geo;
}

// the inlet's lining, and the fan's materials (lit a little from inside so the blades read even in
// the cowling's shadow)
const inletMetal = new THREE.MeshLambertMaterial({ color: 0xaab3bc });
const fanMats = new Map();
function fanMat(map) {
  if (!fanMats.has(map)) fanMats.set(map, new THREE.MeshLambertMaterial({ map, emissiveMap: map, emissive: 0x2a2a2a, side: THREE.DoubleSide }));
  return fanMats.get(map);
}

// the dark inside of a cowling (the tube's back faces), seen through both ends
const insideMats = new Map();
function nacelleInside(dark, side) {
  const key = dark.uuid + side;
  if (!insideMats.has(key)) { const m = dark.clone(); m.side = side; insideMats.set(key, m); }
  return insideMats.get(key);
}

// A canvas drawing (a livery, a fin's emblem, a fan) as a texture the GPU gets as plain bytes:
// the pixels read back, turned into linear light (as an sRGB texture would be read) and turned
// bottom-up for GL. Some phones (seen on a Poco X6 Pro) drew canvas-made textures black in the
// small off-screen renderer of the title screen and the hangar (render/preview3d.js): the
// fuselage black, only the plain-painted wings and engines lit. Plain RGBA bytes go up to the GPU
// the same simple way everywhere. (8 bits of linear light band in deep gradients, which the flat
// colours of a paint scheme do not have.)
const SRGB_TO_LINEAR_8 = (() => {
  const t = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    t[i] = Math.round((c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)) * 255);
  }
  return t;
})();
function paintedTexture(cv) {
  const w = cv.width, h = cv.height, row = w * 4;
  const src = cv.getContext('2d').getImageData(0, 0, w, h).data;
  const out = new Uint8Array(row * h), lin = SRGB_TO_LINEAR_8;
  for (let y = 0; y < h; y++) {
    const s = (h - 1 - y) * row, d = y * row;
    for (let i = 0; i < row; i += 4) {
      out[d + i] = lin[src[s + i]]; out[d + i + 1] = lin[src[s + i + 1]]; out[d + i + 2] = lin[src[s + i + 2]];
      out[d + i + 3] = src[s + i + 3];
    }
  }
  const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

// The textures of a turbofan's front, drawn once: the fan (swept blades catching the light round
// a dark hub, in the dark casing) and the spinner (with a white spiral, as most have)
let fanTextures = null;
function fanFaceTextures() {
  if (fanTextures) return fanTextures;
  const make = (size, draw) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    draw(cv.getContext('2d'), size);
    return paintedTexture(cv);
  };
  const fan = make(256, (g, n) => {
    const c = n / 2, R = n / 2;
    const bg = g.createRadialGradient(c, c, R * 0.2, c, c, R);
    bg.addColorStop(0, '#0b0d10'); bg.addColorStop(1, '#1c2026');
    g.fillStyle = bg; g.fillRect(0, 0, n, n);
    // the blades: wide chords swept round with the radius, lit on one side as a real fan is
    const N = 22, r0 = R * 0.3, r1 = R * 0.95, pitch = TAU / N;
    for (let b = 0; b < N; b++) {
      const a0 = b * pitch, sweep = (r) => 0.42 * (r - r0) / (r1 - r0);
      const pts = [];
      for (let k = 0; k <= 8; k++) { const r = r0 + (r1 - r0) * k / 8; pts.push([r, a0 + sweep(r)]); }
      for (let k = 8; k >= 0; k--) { const r = r0 + (r1 - r0) * k / 8; pts.push([r, a0 + sweep(r) + pitch * (0.62 + 0.18 * k / 8)]); }
      g.beginPath();
      pts.forEach(([r, a], k) => { const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r; if (k) g.lineTo(x, y); else g.moveTo(x, y); });
      g.closePath();
      const lit = 0.5 + 0.5 * Math.cos(a0 - 0.8);
      const gr = g.createRadialGradient(c, c, r0, c, c, r1);
      const sh = (v) => Math.round(70 + 90 * v);
      gr.addColorStop(0, 'rgb(' + sh(lit * 0.6) + ',' + sh(lit * 0.6 + 0.03) + ',' + sh(lit * 0.6 + 0.07) + ')');
      gr.addColorStop(1, 'rgb(' + sh(lit) + ',' + sh(lit + 0.03) + ',' + sh(lit + 0.07) + ')');
      g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(8, 10, 12, 0.85)'; g.lineWidth = 1.2; g.stroke();
    }
    // the hub and the casing ring round the blade tips
    g.fillStyle = '#2b3036'; g.beginPath(); g.arc(c, c, r0, 0, TAU); g.fill();
    g.strokeStyle = '#0e1013'; g.lineWidth = R * 0.07; g.beginPath(); g.arc(c, c, R * 0.985, 0, TAU); g.stroke();
  });
  const spinner = make(64, (g, n) => {
    g.fillStyle = '#69727c'; g.fillRect(0, 0, n, n);
    g.strokeStyle = '#f2f4f6'; g.lineWidth = 7;
    for (const dx of [-n, 0, n]) { g.beginPath(); g.moveTo(dx, n); g.lineTo(dx + n, 0); g.stroke(); }
  });
  fanTextures = { fan, spinner };
  return fanTextures;
}

// A turbofan: the cowling with its lip, a bright inlet lining, the fan behind it (blades and a
// spinner, `n.userData.fan`, turned by animate()) and the exhaust cone
function jetNacelle(dia, len, skin, dark, paint, flat) {
  const n = new THREE.Group();
  const cowl = new THREE.Mesh(new THREE.CylinderGeometry(dia * 0.5, dia * 0.42, len, 24, 1, true), skin);
  cowl.rotation.x = Math.PI / 2;
  n.add(cowl);
  // the open tube has an inside too: dark, seen through the intake and the exhaust (one-sided
  // faces would leave the far wall of the cowling missing, and the engine half see-through)
  const liner = new THREE.Mesh(cowl.geometry, nacelleInside(dark, THREE.BackSide));
  liner.rotation.x = Math.PI / 2;
  n.add(liner);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(dia * 0.47, dia * 0.05, 10, 32), paint);
  lip.position.z = len / 2;
  n.add(lip);
  // the inlet's polished lining from the lip to the fan, seen from inside
  const inlet = new THREE.Mesh(new THREE.CylinderGeometry(dia * 0.462, dia * 0.455, dia * 0.24, 32, 1, true),
    nacelleInside(inletMetal, THREE.BackSide));
  inlet.rotation.x = Math.PI / 2;
  inlet.position.z = len / 2 - dia * 0.12;
  n.add(inlet);
  const tx = fanFaceTextures();
  const fan = new THREE.Group();
  fan.position.z = len / 2 - dia * 0.24;
  const face = new THREE.Mesh(new THREE.CircleGeometry(dia * 0.456, 32), fanMat(tx.fan));
  fan.add(face);
  const spin = new THREE.Mesh(new THREE.ConeGeometry(dia * 0.14, dia * 0.3, 20), fanMat(tx.spinner));
  spin.rotation.x = Math.PI / 2;
  spin.position.z = dia * 0.15;
  fan.add(spin);
  n.add(fan);
  n.userData.fan = fan;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(dia * 0.24, dia * 0.6, 14), dark);
  cone.rotation.x = -Math.PI / 2;
  cone.position.z = -len / 2 - dia * 0.25;
  n.add(cone);
  if (flat) n.scale.y = 0.86;               // the 737's flattened bottom
  return n;
}
