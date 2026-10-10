'use strict';

// ============================================================
// World Aviation — the cargo area of an airport (three.js), built in
// the airport's frame like airport3d.js (local x = across, towards the
// terminal; z = -t, along the runway; y = up):
//
//   - the building past the terminals, behind the cargo stands
//     (World.buildBuildings, kind 'cargo'): at a big airport the cargo
//     terminal, a tall shed of profiled cladding with roller doors for
//     the containers on its apron front, a band of office windows and
//     CARGO on its roof; at a smaller one the cargo shed, the same
//     smaller and lower. Both have dock doors in their far end for the
//     trucks, and a cargo carrier's logo
//   - the freight round it: containers (ULDs) on dollies waiting by the
//     building in front of every stand, netted pallets and a forklift;
//     at a big airport a mobile crane for the outsize loads beyond the
//     last cargo stand (a truck crane at a medium one)
//   - the truck yard by the dock doors: semi-trailers backed onto them,
//     a box van; past the landside road a truck park of trailers
//   - the vehicles the stands use (Vehicles.highLoader, uldTrain …):
//     apron3d.js puts a main-deck loader at every parked freighter's
//     cargo door, baggage3d.js runs the container trains
//
// Static parts are merged like the apron's (kit in apron3d.js), and
// baked with the buildings (Airport3D.build).
// Used by Airport3D.build, Apron3D.build and Baggage.
// ============================================================

// the colours of the containers (aluminium mostly, a few in a carrier's colour)
const ULD_COLORS = ['#b9bec2', '#b9bec2', '#c6cacd', '#a9afb3', '#b9bec2', '#2f5f9e', '#c9562c'];
const TRUCK_COLORS = ['#f2f2ee', '#c8282a', '#1d3f78', '#2e5a3a', '#f2c418', '#6b6f73', '#e8e8e2'];
const TRAILER_COLORS = ['#e9e9e4', '#dcdcd6', '#e9e9e4', '#a9b3ba', '#c9cdd0', '#3f6f9e', '#8a1d1d'];

// ---------- the freight vehicles (forward = +z, on y = 0; see Vehicles in apron3d.js) ----------
Object.assign(Vehicles, {
  // a container dolly with an LD3 on it (the stepped side of its contour on the right), or empty
  uldDolly(k, z, rng, loaded) {
    k.box(1.7, 0.2, 2.9, 0, 0.55, z, '#55595d').box(0.08, 0.08, 0.9, 0, 0.45, z - 1.85, '#55595d');
    for (const x of [-0.7, 0.7]) for (const dz of [-1.0, 1.0]) k.wheel(x, z + dz, 0.22);
    if (loaded !== false) Vehicles.uld(k, 0, 0.65, z, rng);
    return k;
  },
  // an LD3 container: a narrow base and the wider top (its stepped contour), a darker door
  uld(k, x, y, z, rng) {
    const c = ULD_COLORS[(rng.next() * ULD_COLORS.length) | 0];
    k.box(1.55, 0.6, 1.5, x - 0.2, y + 0.3, z, c).box(1.95, 1.0, 1.5, x, y + 1.1, z, c)
      .box(1.6, 1.3, 0.04, x - 0.05, y + 0.8, z + 0.76, '#7d8387');
    return k;
  },
  // a netted pallet: a flat aluminium base, the freight stacked on it under a net
  pallet(k, x, z, rng, h) {
    h = h || 1.2 + rng.next() * 1.0;
    const wrap = ['#c9b48a', '#e6e2d6', '#b89a6a', '#d8d4c8', '#8a9aa6'][(rng.next() * 5) | 0];
    k.box(2.24, 0.12, 3.18, x, 0.06, z, '#a9afb3').box(2.1, h, 3.0, x, 0.12 + h / 2, z, wrap);
    for (const dz of [-1.0, 0, 1.0]) k.box(2.14, 0.06, 0.08, x, 0.15 + h, z + dz, '#2b2f33');
    for (const dx of [-0.7, 0.7]) k.box(0.08, 0.06, 3.04, x + dx, 0.15 + h, z, '#2b2f33');
    return k;
  },
  // a forklift, its forks to the front (a pallet on them when `load`)
  forklift(k, load, rng) {
    k.box(1.15, 0.9, 2.3, 0, 0.75, -0.1, '#f0a01a').box(1.15, 0.8, 0.6, 0, 1.35, -1.0, '#3a3d40')
      .box(0.5, 0.5, 0.5, 0, 1.45, 0.1, '#222528');
    for (const [x, z] of [[-0.5, -0.6], [0.5, -0.6], [-0.5, 0.75], [0.5, 0.75]]) k.box(0.07, 1.25, 0.07, x, 1.85, z, '#2b2f33');
    k.box(1.15, 0.08, 1.45, 0, 2.48, 0.08, '#2b2f33');
    for (const x of [-0.38, 0.38]) k.box(0.12, 2.7, 0.12, x, 1.35, 1.18, '#3a3d40').box(0.12, 0.06, 1.15, x, 0.18, 1.8, '#3a3d40');
    k.wheel(-0.55, 0.75, 0.34).wheel(0.55, 0.75, 0.34).wheel(-0.5, -0.85, 0.28).wheel(0.5, -0.85, 0.28);
    if (load) Vehicles.pallet(k, 0, 1.85, rng, 0.9);
    return k;
  },
  // a main-deck loader at an aeroplane's cargo door: a low chassis on six wheels, the lift
  // platform on scissors with a pallet on it, and the bridge platform at the door sill
  highLoader(k, sill, rng) {
    const top = Math.max(1.6, sill);
    k.box(3.3, 0.7, 10.5, 0, 0.75, -0.6, '#e9e9e4').box(1.3, 1.5, 1.6, -1.0, 1.85, -5.0, '#27313b')
      .box(1.4, 0.12, 1.7, -1.0, 2.66, -5.0, '#e9e9e4');
    for (const x of [-1.45, 1.45]) for (const z of [-4.4, -0.6, 3.4]) k.wheel(x, z, 0.38);
    // the scissors: two crossed bars each side under the lift platform
    const lift = top - 0.15, len = Math.hypot(lift - 1.1, 4.4), ang = Math.atan2(lift - 1.1, 4.4);
    for (const x of [-1.3, 1.3]) {
      k.box(0.14, 0.18, len, x, (lift + 1.1) / 2, -0.8, '#555a5e', -ang).box(0.14, 0.18, len, x, (lift + 1.1) / 2, -0.8, '#555a5e', ang);
    }
    k.box(3.3, 0.3, 6.2, 0, lift, -0.8, '#e3b51c').box(3.3, 0.3, 2.6, 0, top, 3.7, '#e3b51c')
      .box(0.1, 0.9, 2.6, -1.6, top + 0.6, 3.7, '#e3b51c').box(0.1, 0.9, 2.6, 1.6, top + 0.6, 3.7, '#e3b51c');
    for (const x of [-1.3, 1.3]) k.box(0.18, top - 0.9, 0.18, x, (top + 0.6) / 2, 3.7, '#555a5e');
    const h = 1.4 + rng.next() * 0.8;
    k.box(2.4, h, 3.1, 0, lift + 0.15 + h / 2, -1.2, ['#c9b48a', '#e6e2d6', '#d8d4c8'][(rng.next() * 3) | 0]);
    return k;
  },
  // a tractor with a row of container dollies behind it, parked
  uldTrain(k, n, rng) {
    Vehicles.tractor(k);
    for (let i = 0; i < n; i++) Vehicles.uldDolly(k, -3.6 - i * 3.4, rng, rng.next() < 0.8);
    return k;
  },
  // a semi-trailer truck: the tractor ahead, the 13.6 m box trailer behind (its rear at z = -7.8)
  semi(k, cab, body) {
    k.box(2.55, 2.85, 13.6, 0, 2.6, -1.0, body).box(2.4, 0.35, 13.4, 0, 1.05, -1.0, '#2b2e31');
    for (const z of [-5.0, -6.3]) k.wheel(-1.05, z, 0.5).wheel(1.05, z, 0.5);
    k.box(2.3, 0.6, 5.8, 0, 0.9, 7.0, '#2b2e31').box(2.5, 2.7, 2.3, 0, 2.5, 8.9, cab)
      .box(2.3, 0.9, 0.06, 0, 3.0, 10.06, '#202a33').box(2.52, 0.5, 1.6, 0, 2.6, 9.2, '#202a33');
    k.wheel(-1.05, 9.0, 0.52).wheel(1.05, 9.0, 0.52).wheel(-1.05, 5.9, 0.52).wheel(1.05, 5.9, 0.52);
    return k;
  },
  // a trailer parked on its own: the box on its rear axles and its landing legs
  trailer(k, body) {
    k.box(2.55, 2.85, 13.6, 0, 2.6, 0, body).box(2.4, 0.35, 13.4, 0, 1.05, 0, '#2b2e31')
      .box(2.3, 0.8, 2.2, 0, 0.45, -5.0, '#1c1e21');
    for (const x of [-0.9, 0.9]) k.box(0.15, 0.9, 0.15, x, 0.45, 4.2, '#55595d');
    return k;
  },
  // a box van
  van(k, body) {
    k.box(2.2, 0.5, 7.0, 0, 0.75, 0, '#2b2e31').box(2.3, 2.2, 1.9, 0, 1.75, 2.5, '#f2f2ee')
      .box(2.2, 0.8, 0.06, 0, 2.2, 3.47, '#202a33').box(2.4, 2.7, 4.8, 0, 2.35, -0.9, body);
    for (const x of [-1.0, 1.0]) for (const z of [-2.2, 2.5]) k.wheel(x, z, 0.45);
    return k;
  },
  // a mobile crane, its outriggers out and its boom raised forward over the cab: big, an
  // all-terrain crane on five axles with a long boom; else a truck crane on three
  mobileCrane(k, big) {
    const Y = '#e8b21a', L = big ? 15 : 11, W = 3, boom = big ? 40 : 24, ang = big ? 62 * DEG : 58 * DEG;
    k.box(W, 1.3, L, 0, 1.45, 0, Y).box(2.6, 1.9, 2.0, 0, 2.6, L / 2 - 1.1, Y)
      .box(2.4, 0.8, 0.06, 0, 3.0, L / 2 - 0.08, '#202a33');
    const axles = big ? 5 : 3;
    for (let i = 0; i < axles; i++) {
      const z = L / 2 - 2.2 - i * (L - 4) / (axles - 1);
      k.wheel(-1.35, z, 0.62).wheel(1.35, z, 0.62);
    }
    // the outriggers: beams out to both sides, pads on the ground
    for (const z of [L / 2 - 1.2, -L / 2 + 1.2]) {
      k.box(9, 0.45, 0.5, 0, 1.0, z, '#55595d');
      for (const x of [-4.4, 4.4]) k.box(0.4, 1.0, 0.4, x, 0.5, z, '#55595d').box(1.2, 0.12, 1.2, x, 0.06, z, '#2b2f33');
    }
    // the superstructure: the turntable, the counterweight behind, the operator's cab beside the boom
    const zp = -L * 0.18;
    k.cyl(1.4, 1.4, 0.6, 14, 0, 2.4, zp, '#3a3d40')
      .box(2.8, 1.4, 1.8, 0, 3.2, zp - 2.4, '#3a3d40').box(2.6, 1.2, 3.6, 0, 3.0, zp - 0.6, Y)
      .box(0.9, 1.5, 1.8, 1.45, 3.2, zp + 1.2, Y).box(0.92, 0.8, 1.2, 1.45, 3.4, zp + 1.5, '#202a33');
    // the telescopic boom in three sections, thinner each, and the hook on its rope
    const secs = [[1.3, 1.4], [1.0, 1.1], [0.7, 0.8]];
    secs.forEach(([w, h], i) => {
      const s0 = boom * i / 3 * 0.92, s1 = s0 + boom / 3 + 1;
      const mid = (s0 + s1) / 2;
      k.box(w, h, s1 - s0, 0, 3.8 + Math.sin(ang) * mid, zp + Math.cos(ang) * mid, Y, -ang);
    });
    k.box(0.5, 0.8, 0.5, 0, 2.8 + Math.sin(ang) * boom * 0.55, zp + Math.cos(ang) * boom * 0.55, '#3a3d40', -ang);
    const tipY = 3.8 + Math.sin(ang) * boom, tipZ = zp + Math.cos(ang) * boom, hookY = big ? 9 : 6;
    k.box(0.06, tipY - hookY, 0.06, 0, (tipY + hookY) / 2, tipZ, '#1c1e21')
      .box(0.6, 1.0, 0.5, 0, hookY - 0.4, tipZ, '#c8282a').box(0.1, 0.6, 0.1, 0, hookY - 1.2, tipZ, '#2b2f33');
    return k;
  }
});

const Cargo3D = {
  // the building (World.buildBuildings, kind 'cargo'): called by Airport3D.buildBuildings
  building(a, b, rec, at, tex, lambert, id) {
    const P = id.paint, h = b.h, len = b.along, w = b.acrossSize;
    const front = b.across - w / 2, back = b.across + w / 2, t0 = b.t - len / 2, t1 = b.t + len / 2;
    const k = kit();
    const hex = (c) => '#' + new THREE.Color(c).getHexString();
    const wall = hex(P.hangar), door = hex(P.door), trim = hex(P.trim), roof = hex(P.roof);
    // the shell: profiled cladding (a rib every 6 m on the long faces), a dark plinth, the roof slab
    k.box(w, h, len, b.across, h / 2, -b.t, wall).box(w + 0.3, 1.2, len + 0.3, b.across, 0.6, -b.t, '#4a4e52')
      .box(w + 1.6, 0.9, len + 1.6, b.across, h + 0.45, -b.t, roof);
    for (let t = t0 + 3; t < t1 - 1; t += 6) {
      for (const ac of [front - 0.15, back + 0.15]) k.box(0.3, h - 1.2, 0.35, ac, h / 2 + 0.6, -t, trim);
    }
    // the roof plant: a few air handlers
    for (let i = 0; i < Math.max(2, Math.round(len / 60)); i++) {
      k.box(5, 1.8, 7, b.across + (i % 2 ? 8 : -6), h + 1.8, -(t0 + len * (i + 0.5) / Math.max(2, Math.round(len / 60))), '#8e9498');
    }
    // the apron front: two roller doors for the containers either side of each stand's
    // middle (the stand's board above them, apron3d.js), a dark opening under each slatted leaf
    const dh = b.big ? 6 : 4.5;
    for (const g of a.gates.filter((x) => x.cargo)) {
      for (const dt of [-12, 12]) {
        k.box(0.5, dh + 0.6, 6.6, front - 0.25, (dh + 0.6) / 2, -(g.t + dt), '#e3b51c')
          .box(0.6, dh, 5.8, front - 0.3, dh / 2, -(g.t + dt), door);
        for (let y = 0.6; y < dh; y += 0.6) k.box(0.62, 0.06, 5.8, front - 0.3, y, -(g.t + dt), '#3a3f44');
      }
    }
    // the far end: the dock doors for the trucks (a.cargoYard), under a canopy
    const docks = this.docks(a, b);
    for (const ac of docks) {
      k.box(3.6, 3.8, 0.4, ac, 2.6, -(t1 + 0.2), '#e3b51c').box(3.0, 3.2, 0.5, ac, 2.8, -(t1 + 0.25), door)
        .box(3.4, 1.1, 0.6, ac, 0.55, -(t1 + 0.3), '#2b2f33');
    }
    if (docks.length) {
      const c0 = docks[0] - 2.5, c1 = docks[docks.length - 1] + 2.5;
      k.box(c1 - c0, 0.4, 5, (c0 + c1) / 2, 5.6, -(t1 + 2.5), roof);
    }
    // the landside: an entrance with a canopy in the middle of the back
    k.box(0.4, 3, 6, back + 0.2, 1.5, -b.t, '#2e4558').box(3, 0.3, 9, back + 1.5, 3.4, -b.t, trim);
    at(k.mesh(), 0, 0, 0);

    // the office windows: a band along the top of the apron front (a big terminal) and of the
    // back, lit at night
    const win = lambert(0x3a4550);
    rec.night.push({ mat: win, color: new THREE.Color(0xfff0c8), k: 0.5 });
    if (b.big) at(new THREE.Mesh(cellBox(0.3, 1.6, len * 0.9), win), b.t, front - 0.4, h - 1.8);
    at(new THREE.Mesh(cellBox(0.3, 1.4, len * 0.8), win), b.t, back + 0.4, h * 0.6);
    // CARGO on the roof, both ways, lit at night
    const bw = Math.min(len * 0.55, b.big ? 42 : 20), bh = bw / 4.2, y = h + 1.6 + bh / 2;
    const sign = tex(this.signCanvas(id), 8);
    const sm = new THREE.MeshLambertMaterial({ map: sign, emissiveMap: sign, emissive: 0x000000 });
    rec.night.push({ mat: sm, color: new THREE.Color(0xffffff), k: 0.75 });
    for (const s of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(bw, bh);
      geo.rotateY(s * Math.PI / 2);
      at(new THREE.Mesh(geo, sm), b.t, b.across + s * 0.3, y);
    }
    at(new THREE.Mesh(cellBox(0.5, bh + 0.4, bw + 0.4), lambert(0x1b232c)), b.t, b.across, y);
    for (const dt of [-bw * 0.35, 0, bw * 0.35]) at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.4), lambert(0x55595d)), b.t + dt, b.across, h + 0.8);
    // a cargo carrier's logo on the apron front, beside the first stand (clear of the doors)
    const al = this.carrier(a, 0);
    if (al) {
      const g0 = a.gates.find((g) => g.cargo);
      at(new THREE.Mesh(cellBox(0.4, 3.6, 17), lambert(0x1b232c)), g0.t - 22, front - 0.3, Math.min(h - 3, 12));
      Airport3D.logoBoard(rec, at, tex, al, g0.t - 22, front - 0.55, Math.min(h - 3, 12), 16, 3);
    }
  },

  // the dock doors in the building's far end, across: 4.5 m apart, as many as fit
  docks(a, b) {
    const front = b.across - b.acrossSize / 2, out = [];
    for (let ac = front + 5; ac <= b.across + b.acrossSize / 2 - 4; ac += 4.5) out.push(ac);
    return out.slice(0, b.big ? 9 : 3);
  },

  // the cargo carrier whose freighters and logo are at the airport (the k-th of those working there)
  carrier(a, k) {
    const list = AIRLINES.filter((x) => x.kinds.indexOf('cargo') >= 0 && !x.own && airlineWorksAt(x, a));
    return list.length ? list[(hashStr(a.id) + k) % list.length] : null;
  },

  // CARGO on a dark board, in white with the airport's colour under it
  signCanvas(id) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = '#1b232c'; g.fillRect(0, 0, 1024, 256);
    g.fillStyle = id.color; g.fillRect(0, 216, 1024, 40);
    g.fillStyle = '#ffffff'; g.font = '900 190px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText('CARGO').width;
    g.save(); g.translate(512, 112); g.scale(Math.min(1, 940 / tw), 1); g.fillText('CARGO', 0, 0); g.restore();
    return cv;
  },

  // ---------- the freight, the trucks and the crane round it (static) ----------
  build(a, rec, at, tex) {
    const L = LAYOUT, b = a.buildings.find((x) => x.kind === 'cargo');
    if (!b) return;
    const rng = makeRng(hashStr(a.id + '/cargo'));
    const front = b.across - b.acrossSize / 2, t1 = b.t + b.along / 2;
    const cs = a.gates.filter((g) => g.cargo);
    const k = kit();
    // by the building in front of every stand: a container train waiting, facing the hall
    // door, and on the other side netted pallets and a forklift
    cs.forEach((g, i) => {
      k.push(front - 5.5, 0, -(g.t + 30), 0); Vehicles.uldTrain(k, b.big ? 4 : 2, rng); k.pop();
      const n = b.big ? 3 : 2;
      for (let j = 0; j < n; j++) Vehicles.pallet(k, front - 3, -(g.t - 20 - j * 3.6), rng);
      k.push(front - 7.5, 0, -(g.t - 21 - n * 3.6), (i % 2 ? 1 : -1) * Math.PI / 2 + Math.PI); Vehicles.forklift(k, i % 2 === 0, rng); k.pop();
    });
    // the crane for the outsize loads in the apron's corner past the last stand, its boom
    // raised towards it (a big airport's all-terrain crane, a medium one's truck crane)
    if (a.terminal === 'big' || a.terminal === 'medium') {
      const last = cs[cs.length - 1];
      k.push(front - 30, 0, -(last.t + 82), 0); Vehicles.mobileCrane(k, a.terminal === 'big'); k.pop();
    }
    // the truck yard: semi-trailers backed onto the dock doors (some free), a van
    const docks = this.docks(a, b);
    docks.forEach((ac, i) => {
      if (rng.next() < 0.3 && i > 0) return;
      k.push(ac, 0, -(t1 + 0.6 + 7.8), Math.PI);
      Vehicles.semi(k, TRUCK_COLORS[(rng.next() * TRUCK_COLORS.length) | 0], TRAILER_COLORS[(rng.next() * TRAILER_COLORS.length) | 0]);
      k.pop();
    });
    const y = a.cargoYard;
    k.push(y.a1 - 8, 0, -(y.t1 - 10), Math.PI / 2 * (rng.next() < 0.5 ? 1 : -1)); Vehicles.van(k, TRUCK_COLORS[(rng.next() * TRUCK_COLORS.length) | 0]); k.pop();
    // the truck park past the landside road, behind the cargo building: trailers in two rows
    const roadA = L.TERMINAL + 52, c0 = roadA + 16;
    const cap = { big: 34, medium: 14, small: 6, tiny: 3 }[a.terminal] || 4;
    let n = 0;
    for (const row of [c0 + 9, c0 + 37]) {
      for (let t = a.cargoT0 + 8; t < a.cargoT1 - 30 && n < cap; t += 4.4) {
        if (rng.next() < 0.45) continue;
        k.push(row, 0, -t, row === c0 + 9 ? Math.PI / 2 : -Math.PI / 2);
        Vehicles.trailer(k, TRAILER_COLORS[(rng.next() * TRAILER_COLORS.length) | 0]);
        k.pop();
        n++;
      }
    }
    at(k.mesh(), 0, 0, 0);
  }
};
