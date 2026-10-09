'use strict';

// ============================================================
// World Aviation — the local products' boards (three.js), built in
// the airport's frame like airport3d.js (local x = across, towards
// the terminal and on beyond it; z = -t; y = up), at the airports
// with products in data/regions.js (Russia and Sweden):
//
//   - on the terminal's apron front, high under the roof beside each
//     stand (on the side of its bridge's rotunda, above it): a lit
//     board, the region's products first, then the country's — seen
//     from the cockpit at the gate
//   - two double-sided billboards on legs beside the access road,
//     seen from the road and on the approach
//   - a brand's name in big letters on the office roof behind the car
//     park (the region's own: VOLVO at Göteborg, LKAB at Kiruna, СБЕР
//     at most Russian fields), facing the apron and the road
//
// Lit at night through rec.night. Used by Airport3D.build.
// ============================================================

const ADVERT_BOARD_H = 6;          // the apron front's boards: at most this tall, metres (3:1)
const ADVERT_FROM_STAND = 22;      // a board's middle from its stand along the front, metres
const BILLBOARD = { w: 15, h: 5, legs: 6 };    // a roadside billboard: its board and its legs, metres

const Adverts3D = {
  build(a, rec, at, tex) {
    const list = airportBrands(a);
    if (!list.length) return;
    // one material per brand, shared by its boards
    const mats = {};
    const mat = (key) => {
      if (mats[key]) return mats[key];
      const map = tex(Brands.board(BRANDS[key], 768, 256), 8);
      const m = new THREE.MeshLambertMaterial({ map, emissiveMap: map, emissive: 0x000000 });
      rec.night.push({ mat: m, color: new THREE.Color(0xffffff), k: 0.7 });
      return (mats[key] = m);
    };
    let next = 0;
    const pick = () => list[next++ % list.length];
    this.front(a, at, pick, mat);
    // (the billboards show the country's products too, starting where the front left off)
    this.billboards(a, at, pick, mat);
    const reg = AIRPORT_REGIONS[a.id];
    this.roofLetters(a, rec, at, tex, reg && reg[2] ? [reg[2]].concat(list.filter((k) => k !== reg[2])) : list);
  },

  // ---------- on the terminal's apron front ----------
  front(a, at, pick, mat) {
    const frame = new THREE.MeshLambertMaterial({ color: 0x2a3036 });
    for (const b of a.buildings.filter((x) => x.kind === 'terminal')) {
      const front = b.across - b.acrossSize / 2, t0 = b.t - b.along / 2 + 3, t1 = b.t + b.along / 2 - 3;
      const bh = Math.min(b.h * 0.5, ADVERT_BOARD_H), bw = bh * 3;
      const y = b.h - 0.7 - bh / 2;
      const taken = b.frontTaken || [];
      for (const gate of a.gates) {
        const t = gate.t + ADVERT_FROM_STAND;
        if (gate.t < t0 || gate.t > t1 || t - bw / 2 < t0 || t + bw / 2 > t1) continue;
        if (taken.some(([p, q]) => t + bw / 2 + 2 > p && t - bw / 2 - 2 < q)) continue;
        taken.push([t - bw / 2, t + bw / 2]);
        const geo = new THREE.PlaneGeometry(bw, bh);
        geo.rotateY(-Math.PI / 2);
        at(new THREE.Mesh(geo, mat(pick())), t, front - 1.6, y);
        at(new THREE.Mesh(cellBox(0.5, bh + 0.5, bw + 0.5), frame), t, front - 1.3, y);
      }
    }
  },

  // ---------- beside the access road ----------
  // The road leaves the terminal's road along the runway, turns away and runs straight out across
  // (landsideRoads in airport3d.js): the billboards stand on its far side from the tower, each with
  // a board towards the traffic coming in and one towards the traffic going out
  billboards(a, at, pick, mat) {
    const r = a.apronRect, roadA = LAYOUT.TERMINAL + 52, box = groundBox(a);
    const t = r.t1 + 260 + 15;
    const legs = new THREE.MeshLambertMaterial({ color: 0x8a9095 });
    const back = new THREE.MeshLambertMaterial({ color: 0x3a4046 });
    for (const across of [roadA + 230, roadA + 380]) {
      if (across > box.aMax - 30) continue;
      const B = BILLBOARD, y = B.legs + B.h / 2;
      for (const dt of [-B.w * 0.3, B.w * 0.3]) at(new THREE.Mesh(new THREE.BoxGeometry(0.4, B.legs, 0.4), legs), t + dt, across, B.legs / 2);
      at(new THREE.Mesh(new THREE.BoxGeometry(0.5, B.h + 0.4, B.w + 0.4), back), t, across, y);
      for (const side of [1, -1]) {
        const geo = new THREE.PlaneGeometry(B.w, B.h);
        geo.rotateY(side * Math.PI / 2);
        at(new THREE.Mesh(geo, mat(pick())), t, across + side * 0.27, y);
      }
    }
  },

  // ---------- letters on the office roofs ----------
  // keys: the brands for the office blocks in turn (the first office the airport's own)
  roofLetters(a, rec, at, tex, keys) {
    const offices = (a.landside || []).filter((b) => b.kind === 'office');
    offices.forEach((b, i) => {
      const brand = BRANDS[keys[i % keys.length]];
      if (!brand) return;
      const cv = Brands.letters(brand), ratio = cv.width / cv.height;
      const lh = Math.min(6, b.along * 0.85 / ratio), W = b.acrossSize;
      const map = tex(cv, 8);
      const m = new THREE.MeshLambertMaterial({ map, emissiveMap: map, emissive: 0x000000, transparent: true, alphaTest: 0.35 });
      rec.night.push({ mat: m, color: new THREE.Color(0xffffff), k: 0.85 });
      for (const side of [-1, 1]) {
        const geo = new THREE.PlaneGeometry(lh * ratio, lh);
        geo.rotateY(side * Math.PI / 2);
        at(new THREE.Mesh(geo, m), b.t, b.across + side * (W / 2 - 1.2), b.h + 0.7 + lh / 2);
      }
    });
  }
};
