'use strict';

// ============================================================
// World Aviation — 3D aircraft models (three.js), built from each
// type's real dimensions (`dims`) and exterior (`look`):
//
//   - the fuselage is a lathe-like tube of cross-sections: a rounded,
//     slightly drooping nose, a constant cabin, and a tail cone whose
//     top line stays level while the belly sweeps up to the tail
//   - a canvas livery wrapped around it: windows, cheatline, belly,
//     cockpit glass
//   - tapered, swept wings with dihedral, a swept fin and tailplane
//     (or a T-tail), winglets
//   - engines under the wings (2 or 4), on the rear fuselage, or
//     turboprops with spinning propellers
//   - landing gear that retracts
//
// Model axes: +z = nose, +y = up, +x = left wing. The origin is the
// centre of gravity, and the wheels touch y = -gearH.
// ============================================================

const AircraftModels = {
  liveries: new Map(),       // aircraft id -> canvas texture

  build(ac, opts) {
    opts = opts || {};
    const d = aircraftDims(ac);
    const look = ac.look || {};
    const L = d.len, R = d.radius, S = d.span;
    const jet = ac.engineType === 'jet';
    const g = new THREE.Group();
    g.userData = { gear: [], props: [] };

    const metal = new THREE.MeshLambertMaterial({ color: 0xd9dee3 });
    // colours given like the livery canvas (sRGB), so the painted parts match the painted skin
    const col = (hex) => new THREE.Color(hex).convertSRGBToLinear();
    const base = new THREE.MeshLambertMaterial({ color: col(look.base || '#f3f5f7') });
    const paint = new THREE.MeshLambertMaterial({ color: col(look.color || '#1f5fa0') });
    const dark = new THREE.MeshLambertMaterial({ color: 0x23282e });
    const grey = new THREE.MeshLambertMaterial({ color: 0x9aa3ab });

    // ---- fuselage
    const body = fuselageGeometry(L, R);
    const skin = new THREE.MeshLambertMaterial({ map: this.livery(ac, d) });
    g.add(new THREE.Mesh(body.geo, skin));
    if (look.hump) {
      // the 747 upper deck: blended into the nose, its roof sloping down into the fuselage further back
      const hump = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16), base);
      hump.scale.set(R * 0.74, R * 0.62, L * 0.24);
      hump.position.set(0, R * 0.36, L * 0.25);
      g.add(hump);
    }

    // ---- wings
    const high = look.wing === 'high';
    const sweep = (look.sweep !== undefined ? look.sweep : jet ? 25 : 3) * DEG;
    const semi = S / 2 - R * 0.8;
    const rootC = jet ? S * (look.engines === 'wing4' ? 0.2 : 0.17) : S * 0.115;
    const tipC = rootC * (jet ? 0.28 : 0.55);
    const thick = rootC * (jet ? 0.1 : 0.13);
    const wingY = high ? R * 0.82 : -R * 0.55;
    const wingZ = L * (jet ? 0.08 : 0.1) + rootC * 0.45;           // leading edge at the root
    const dihedral = (high ? 1 : jet ? 5 : 4) * DEG;
    const wing = wingGeometry(semi, rootC, tipC, sweep, thick);
    for (const side of [1, -1]) {
      const m = new THREE.Mesh(wing, metal);
      m.position.set(side * R * 0.8, wingY, wingZ);
      m.scale.x = side;
      m.rotation.z = side * dihedral;
      g.add(m);
      if (look.winglets) {
        const wl = new THREE.Mesh(finGeometry(tipC * 0.75, tipC * 0.3, S * 0.035, 35 * DEG, thick * 0.4), paint);
        const tipX = side * (R * 0.8 + semi * Math.cos(dihedral));
        wl.position.set(tipX, wingY + semi * Math.sin(dihedral), wingZ - semi * Math.tan(sweep));
        g.add(wl);
      }
    }
    // wing-to-body fairing for the low wing
    if (!high) {
      const fair = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), base);
      fair.scale.set(R * 0.95, R * 0.42, rootC * 0.75);
      fair.position.set(0, -R * 0.62, wingZ - rootC * 0.5);
      g.add(fair);
    } else {
      const fair = new THREE.Mesh(new THREE.BoxGeometry(R * 1.7, R * 0.3, rootC * 0.9), base);
      fair.position.set(0, R * 0.85, wingZ - rootC * 0.5);
      g.add(fair);
    }

    // ---- tail: fin and tailplane (T-tail on top of the fin)
    const finRoot = L * (jet ? 0.17 : 0.2), finTip = finRoot * (jet ? 0.36 : 0.5);
    const finH = jet ? R * 2.1 + L * 0.06 : R * 1.6 + L * 0.06;
    const finSweep = (jet ? 38 : 30) * DEG;
    const finZ = -L * 0.5 + finRoot + L * 0.015;                   // fin leading edge at the root
    const finY = R * 0.62;
    const fin = new THREE.Mesh(finGeometry(finRoot, finTip, finH, finSweep, Math.max(0.12, finRoot * 0.09)), paint);
    fin.position.set(0, finY, finZ);
    g.add(fin);
    const tSemi = S * (jet ? 0.19 : 0.21), tRoot = finRoot * 0.75, tTip = tRoot * 0.42;
    const tail = wingGeometry(tSemi, tRoot, tTip, (jet ? 32 : 6) * DEG, tRoot * 0.08);
    const tTop = look.tail === 't';
    for (const side of [1, -1]) {
      const m = new THREE.Mesh(tail, tTop ? paint : metal);
      if (tTop) m.position.set(0, finY + finH - 0.1, finZ - finH * Math.tan(finSweep) - finTip * 0.05);
      else m.position.set(side * R * 0.15, R * 0.42, -L * 0.5 + tRoot + L * 0.02);
      m.scale.x = side;
      m.rotation.z = side * (tTop ? 0 : 5 * DEG);
      g.add(m);
    }

    // ---- engines
    const spanAt = (f) => R * 0.8 + semi * f;                      // x of a point at a fraction of the semispan
    const leAt = (f) => wingZ - semi * f * Math.tan(sweep);         // leading edge z there
    const yAt = (f) => wingY + semi * f * Math.sin(dihedral);
    if (look.engines === 'wing2' || look.engines === 'wing4') {
      const dia = d.fus * (look.engines === 'wing4' ? 0.42 : look.bigFans ? 0.56 : 0.5);
      const stations = look.engines === 'wing4' ? [0.3, 0.6] : [0.33];
      for (const f of stations) for (const side of [1, -1]) {
        const n = jetNacelle(dia, dia * (look.engines === 'wing4' ? 2.0 : 1.75), base, dark, paint, look.flatNacelles);
        n.position.set(side * spanAt(f), yAt(f) - thick * 0.5 - dia * 0.62, leAt(f) + dia * 0.75);
        g.add(n);
        const py = new THREE.Mesh(new THREE.BoxGeometry(dia * 0.14, dia * 0.5, dia * 1.6), metal);
        py.position.set(side * spanAt(f), yAt(f) - thick * 0.5 - dia * 0.18, leAt(f) + dia * 0.1);
        g.add(py);
      }
    } else if (look.engines === 'rear2') {
      const dia = d.fus * 0.48;
      for (const side of [1, -1]) {
        const n = jetNacelle(dia, dia * 2.1, base, dark, paint);
        n.position.set(side * (R + dia * 0.75), R * 0.35, -L * 0.24);
        g.add(n);
        const py = new THREE.Mesh(new THREE.BoxGeometry(dia * 0.9, dia * 0.16, dia * 1.1), metal);
        py.position.set(side * (R + dia * 0.1), R * 0.35, -L * 0.25);
        g.add(py);
      }
    } else {
      // turboprops: a nacelle on the wing, a spinner and four blades
      const dia = d.fus * 0.42;
      for (const side of [1, -1]) {
        const f = 0.3;
        const ny = high ? yAt(f) - thick * 0.4 - dia * 0.25 : yAt(f) + thick * 0.2;
        // real props are about 0.65 of the fuselage diameter in radius; keep them clear of the body and the ground
        const propR = Math.min(d.fus * 0.65, (spanAt(f) - R) * 0.9, ny + d.gearH - 0.35);
        const nz = leAt(f) - rootC * 0.25;
        const nac = new THREE.Mesh(new THREE.CylinderGeometry(dia * 0.42, dia * 0.5, rootC * 1.5, 14), base);
        nac.rotation.x = Math.PI / 2;
        nac.position.set(side * spanAt(f), ny, nz);
        g.add(nac);
        const front = nz + rootC * 0.75;
        const spin = new THREE.Mesh(new THREE.ConeGeometry(dia * 0.32, dia * 0.7, 14), dark);
        spin.rotation.x = Math.PI / 2;
        spin.position.set(side * spanAt(f), ny, front + dia * 0.35);
        g.add(spin);
        const prop = new THREE.Group();
        for (let b = 0; b < 4; b++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(propR * 0.11, propR, propR * 0.02), dark);
          blade.position.y = propR / 2;
          const arm = new THREE.Group();
          arm.rotation.z = b * Math.PI / 2;
          blade.rotation.y = 0.35;
          arm.add(blade);
          prop.add(arm);
        }
        const disc = new THREE.Mesh(new THREE.CircleGeometry(propR, 28),
          new THREE.MeshBasicMaterial({ color: 0x2a2f35, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide }));
        prop.add(disc);
        prop.position.set(side * spanAt(f), ny, front + dia * 0.15);
        prop.userData = { disc, blades: prop.children.slice(0, 4), side };
        g.add(prop);
        g.userData.props.push(prop);
      }
    }

    // ---- landing gear: nose gear and two main legs (they reach y = -gearH)
    const wheelR = Math.max(0.28, d.fus * 0.13);
    const legR = Math.max(0.07, d.fus * 0.025);
    const mainX = high ? R * 1.05 : R * (S > 50 ? 1.15 : 0.95);
    const mainZ = -L * 0.03;
    const noseZ = L * 0.38;
    const gear = [];
    const addLeg = (x, z, top, wheels) => {
      const len = Math.max(0.2, d.gearH - wheelR - top);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(legR, legR, len, 6), grey);
      leg.position.set(x, -top - len / 2, z);
      g.add(leg); gear.push(leg);
      for (const off of wheels) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(wheelR, wheelR, wheelR * 0.7, 14), dark);
        w.rotation.z = Math.PI / 2;
        w.position.set(x + off, -d.gearH + wheelR, z);
        g.add(w); gear.push(w);
      }
    };
    const big = S > 50;
    addLeg(0, noseZ, R * 0.75, big ? [-wheelR * 0.4, wheelR * 0.4] : [0]);
    for (const side of [1, -1]) {
      const pair = big ? [-wheelR * 0.45, wheelR * 0.45] : [0];
      addLeg(side * mainX, mainZ, high ? R * 0.5 : R * 0.7, pair);
      if (big) {
        // bogies: a second row behind the first
        for (const off of pair) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(wheelR, wheelR, wheelR * 0.7, 14), dark);
          w.rotation.z = Math.PI / 2;
          w.position.set(side * mainX + off, -d.gearH + wheelR, mainZ - wheelR * 2.3);
          g.add(w); gear.push(w);
        }
      }
    }
    if (look.engines === 'wing4' || look.hump) {
      // the 747's body gear between the wing gear
      for (const side of [1, -1]) addLeg(side * R * 0.35, mainZ - L * 0.04, R * 0.9, [-wheelR * 0.45, wheelR * 0.45]);
    }
    if (!look.fixedGear) g.userData.gear = gear;
    return g;
  },

  // spin the propellers and fold the gear; called every frame for the player's aircraft
  animate(model, st) {
    for (const p of model.userData.props) {
      const speed = st.propSpeed || 0;
      p.rotation.z += speed * p.userData.side;
      const blur = clamp((speed - 0.25) / 0.4, 0, 1);
      p.userData.disc.material.opacity = blur * 0.35;
      for (const b of p.userData.blades) b.visible = blur < 0.9;
    }
    for (const part of model.userData.gear) part.visible = st.gear > 0.5;
  },

  // the paint scheme: a canvas wrapped around the fuselage (x = along, nose at the right; y = around, top at 0)
  livery(ac, d) {
    if (this.liveries.has(ac.id)) return this.liveries.get(ac.id);
    const look = ac.look || {};
    const W = 1024, H = 256;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const L = d.len;
    const px = W / L;                                   // canvas pixels per metre along the body
    const yAt = (deg) => deg / 360 * H;                 // angle from the top of the fuselage
    g.fillStyle = look.base || '#f3f5f7';
    g.fillRect(0, 0, W, H);
    // belly
    g.fillStyle = 'rgba(150,160,170,0.55)';
    g.fillRect(0, yAt(118), W, yAt(124));
    const color = look.color || '#1f5fa0';
    // cheatline below the windows on both sides, and a bold tail sweep at the back
    g.fillStyle = color;
    for (const c of [100, 260]) g.fillRect(W * 0.04, yAt(c - 3), W * 0.9, yAt(5));
    g.globalAlpha = 0.9;
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(W * 0.2, 0); g.lineTo(W * 0.12, H); g.lineTo(0, H);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    // passenger windows
    if (!look.freighter) {
      g.fillStyle = '#1d2733';
      const x0 = W * 0.27, x1 = W * 0.86;
      const pitch = Math.max(3, 0.53 * px), ww = Math.max(1.6, 0.24 * px);
      for (const c of [78, 282]) {
        for (let x = x0; x < x1; x += pitch) g.fillRect(x, yAt(c - 4), ww, yAt(6));
      }
      // doors
      g.strokeStyle = 'rgba(60,70,80,0.6)'; g.lineWidth = 1;
      for (const fx of [0.25, 0.86]) for (const c of [86, 274]) g.strokeRect(W * fx, yAt(c - 14), Math.max(4, 0.85 * px), yAt(26));
    } else {
      g.strokeStyle = 'rgba(60,70,80,0.6)'; g.lineWidth = 1.5;
      g.strokeRect(W * 0.62, yAt(60), Math.max(10, 3.4 * px), yAt(40));          // main deck cargo door
    }
    // cockpit glass at the nose
    g.fillStyle = '#1a2430';
    const cx = W * (1 - Math.min(0.09, 2.6 / L));
    for (const c of [62, 298]) g.fillRect(cx, yAt(c - 12), Math.max(6, 1.5 * px), yAt(16));
    g.beginPath();
    g.moveTo(cx + 1.4 * px, yAt(330)); g.lineTo(cx + 2.4 * px, yAt(345)); g.lineTo(cx + 2.4 * px, H);
    g.lineTo(cx + 1.4 * px, H); g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(cx + 1.4 * px, yAt(30)); g.lineTo(cx + 2.4 * px, yAt(15)); g.lineTo(cx + 2.4 * px, 0);
    g.lineTo(cx + 1.4 * px, 0); g.closePath(); g.fill();
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    this.liveries.set(ac.id, tex);
    return tex;
  }
};

// The fuselage: rings of vertices along z. u = along the body (tail 0 → nose 1), v = around (top 0).
function fuselageGeometry(L, R) {
  const N = 56, SEG = 24;
  const noseLen = Math.min(L * 0.14, R * 2.8), tailLen = L * 0.3;
  const zNose = L / 2, zTail = -L / 2;
  const ring = (z) => {
    if (z > zNose - noseLen) {
      const u = (z - (zNose - noseLen)) / noseLen;              // 0 → 1 to the tip
      return { r: R * Math.sqrt(Math.max(0, 1 - u * u)) * (1 - 0.06 * u), y: -R * 0.16 * u * u };
    }
    if (z < zTail + tailLen) {
      const u = ((zTail + tailLen) - z) / tailLen;              // 0 → 1 to the tail end
      const e = u * u * (3 - 2 * u);
      const r = R * (1 - 0.86 * e);
      return { r, y: (R - r) * 0.93 };                           // the top line stays level, the belly sweeps up
    }
    return { r: R, y: 0 };
  };
  const pos = [], uv = [], idx = [];
  const zs = [];
  for (let i = 0; i <= N; i++) zs.push(zTail + L * (0.5 - 0.5 * Math.cos(Math.PI * i / N)));
  for (let i = 0; i <= N; i++) {
    const z = zs[i];
    const c = ring(z);
    const r = i === 0 ? 0 : c.r;                                 // close the tail end
    for (let j = 0; j <= SEG; j++) {
      const th = j / SEG * TAU;
      pos.push(Math.sin(th) * r, c.y + Math.cos(th) * r, z);
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

// A half wing (or tailplane) towards +x: tapered and swept, leading edge root at the origin, chord towards -z
function wingGeometry(semi, rootC, tipC, sweep, thick) {
  const sh = new THREE.Shape();
  const tipLe = -semi * Math.tan(sweep);
  sh.moveTo(0, 0);
  sh.lineTo(semi, tipLe);
  sh.lineTo(semi, tipLe - tipC);
  sh.lineTo(0, -rootC);
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false });
  geo.rotateX(Math.PI / 2);                 // shape y (chord) → z, the extrusion → down
  geo.translate(0, thick / 2, 0);
  return geo;
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

// A turbofan: the cowling, a dark intake, the fan face and the exhaust cone
function jetNacelle(dia, len, skin, dark, paint, flat) {
  const n = new THREE.Group();
  const cowl = new THREE.Mesh(new THREE.CylinderGeometry(dia * 0.5, dia * 0.42, len, 20, 1, true), skin);
  cowl.rotation.x = Math.PI / 2;
  n.add(cowl);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(dia * 0.47, dia * 0.05, 8, 20), paint);
  lip.position.z = len / 2;
  n.add(lip);
  const fan = new THREE.Mesh(new THREE.CircleGeometry(dia * 0.46, 20), dark);
  fan.position.z = len / 2 - dia * 0.12;
  n.add(fan);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(dia * 0.24, dia * 0.6, 14), dark);
  cone.rotation.x = -Math.PI / 2;
  cone.position.z = -len / 2 - dia * 0.25;
  n.add(cone);
  if (flat) n.scale.y = 0.86;               // the 737's flattened bottom
  return n;
}
