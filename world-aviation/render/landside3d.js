'use strict';

// ============================================================
// World Aviation — the terminal's signs and the landside (three.js),
// built in the airport's frame like airport3d.js (local x = across,
// towards the terminal and on beyond it; z = -t; y = up):
//
//   - the terminal's signs, lit at night: at a big airport TERMINAL 1
//     and TERMINAL 2 over the two halves of the building (on the apron
//     side between the stands, on the road side over the doors), at the
//     others DEPARTURES and ARRIVALS over the doors on the road side
//   - behind the car park, more the bigger the airport (a.landside,
//     LANDSIDE in constants.js): office blocks and a hotel with floors of
//     windows lit at night and the hotel's name on its roof, a
//     multi-storey car park with cars on its decks and a P sign
//
// The walls and the windows are merged into one mesh each (kit(),
// apron3d.js). Used by Airport3D.build.
// ============================================================

const Landside3D = {
  build(a, rec, at, tex) {
    const term = a.buildings.find((b) => b.kind === 'terminal');
    if (term) this.terminalSigns(a, term, rec, at, tex);
    if (!a.landside || !a.landside.length) return;
    const rng = makeRng(hashStr(a.id + 'landside'));
    const walls = kit(), windows = kit();
    const P = (t, across) => [across, -t];          // frame x, z
    for (const b of a.landside) {
      if (b.kind === 'carpark') this.carPark(b, walls, rng, rec, at, tex, P);
      else this.block(b, walls, windows, rng, rec, at, tex, P);
    }
    at(walls.mesh(), 0, 0, 0);
    const lit = new THREE.MeshLambertMaterial({ vertexColors: true });
    rec.night.push({ mat: lit, color: new THREE.Color(0xffe2b0), k: 0.5 });
    at(windows.mesh(lit), 0, 0, 0);
  },

  // ---------- the signs on the terminal ----------
  terminalSigns(a, b, rec, at, tex) {
    const h = b.h, front = b.across - b.acrossSize / 2, back = b.across + b.acrossSize / 2;
    const big = a.terminal === 'big';
    const names = big ? ['TERMINAL 1', 'TERMINAL 2'] : ['DEPARTURES', 'ARRIVALS'];
    const sign = (text, t, across, y, hgt, side) => {
      const cv = signCanvas(text, '#1d2a38', '#ffffff');
      const map = tex(cv, 8);
      const mat = new THREE.MeshLambertMaterial({ map, emissiveMap: map, emissive: 0x000000 });
      rec.night.push({ mat, color: new THREE.Color(0xffffff), k: 0.8 });
      const geo = new THREE.PlaneGeometry(hgt * cv.width / cv.height, hgt);
      geo.rotateY(side * Math.PI / 2);
      at(new THREE.Mesh(geo, mat), t, across, y);
    };
    // the road side: over the doors at a quarter of the building from each end
    const door = new THREE.MeshLambertMaterial({ color: 0x24313c });
    rec.night.push({ mat: door, color: new THREE.Color(0xffd9a0), k: 0.5 });
    const ys = Math.max(3.6, h * 0.4 - 1.4);
    names.forEach((text, i) => {
      const t = b.t + (i ? 1 : -1) * b.along / 4;
      sign(text, t, back + 0.7, ys, 2.4, 1);
      at(new THREE.Mesh(cellBox(0.3, 2.6, 10), door), t, back + 0.15, 1.3);
    });
    // the apron side of a big terminal: halfway between the first two stands and the last two,
    // under the roof, above the stand numbers
    if (big && a.gates.length >= 4) {
      const n = a.gates.length;
      // (beside the floodlight mast that stands halfway)
      sign('T1 · TERMINAL 1', (a.gates[0].t + a.gates[1].t) / 2 + 15, front - 1.2, h - 3.4, 3.2, -1);
      sign('T2 · TERMINAL 2', (a.gates[n - 2].t + a.gates[n - 1].t) / 2 + 15, front - 1.2, h - 3.4, 3.2, -1);
    }
  },

  // ---------- an office block or a hotel ----------
  block(b, walls, windows, rng, rec, at, tex, P) {
    const [x, z] = P(b.t, b.across);
    const W = b.acrossSize, D = b.along, H = b.h;
    const wall = b.kind === 'hotel' ? '#e4dfd4' : rng.pick(['#c9c4b8', '#aeb6bc', '#cfd2d0', '#b8aa98']);
    walls.box(W, H, D, x, H / 2, z, wall).box(W + 0.6, 0.7, D + 0.6, x, H + 0.35, z, '#6c7276');
    // plant on the roof
    walls.box(W * 0.35, 2.2, D * 0.2, x + W * 0.1, H + 1.8, z - D * 0.2, '#8a8f93')
      .box(W * 0.25, 1.6, D * 0.15, x - W * 0.15, H + 1.5, z + D * 0.25, '#8a8f93');
    // a band of windows on every floor, all round; the ground floor glazed higher
    const glass = '#33414e';
    for (let y = 1.6; y < H - 1.5; y += 3.4) {
      const hw = y < 2 ? 2.4 : 1.5;
      windows.box(0.3, hw, D * 0.92, x - W / 2 - 0.1, y + hw / 2 - 0.4, z, glass)
        .box(0.3, hw, D * 0.92, x + W / 2 + 0.1, y + hw / 2 - 0.4, z, glass)
        .box(W * 0.85, hw, 0.3, x, y + hw / 2 - 0.4, z - D / 2 - 0.1, glass)
        .box(W * 0.85, hw, 0.3, x, y + hw / 2 - 0.4, z + D / 2 + 0.1, glass);
    }
    // the hotel's name on its roof, facing the apron and the road
    if (b.kind === 'hotel') {
      const lh = Math.min(6, D * 0.12);
      const cv = signCanvas('HOTEL', null, '#ffffff');
      const map = tex(cv, 8);
      const mat = new THREE.MeshLambertMaterial({ map, emissiveMap: map, emissive: 0x000000, transparent: true, alphaTest: 0.35 });
      rec.night.push({ mat, color: new THREE.Color(0xfff4dc), k: 0.9 });
      for (const side of [-1, 1]) {
        const geo = new THREE.PlaneGeometry(lh * cv.width / cv.height, lh);
        geo.rotateY(side * Math.PI / 2);
        at(new THREE.Mesh(geo, mat), b.t, b.across + side * (W / 2 - 1.2), H + 0.7 + lh / 2);
      }
    }
  },

  // ---------- a multi-storey car park ----------
  carPark(b, walls, rng, rec, at, tex, P) {
    const [x, z] = P(b.t, b.across);
    const W = b.acrossSize, D = b.along, H = b.h;
    const deck = 3.2, levels = Math.max(2, Math.round(H / deck));
    const cars = ['#c8ccd0', '#2b2f33', '#8a1d1d', '#1d3f78', '#e6e6e6', '#6b6f73', '#2e5a3a', '#b5a27a'];
    for (let i = 0; i <= levels; i++) {
      const y = i * deck;
      // the deck (the ground level is the ground) and its parapet all round
      if (i > 0) walls.box(W, 0.45, D, x, y - 0.22, z, '#9c9d98');
      walls.box(0.25, 1.0, D, x - W / 2 + 0.12, y + 0.5, z, '#b3b2ab').box(0.25, 1.0, D, x + W / 2 - 0.12, y + 0.5, z, '#b3b2ab')
        .box(W, 1.0, 0.25, x, y + 0.5, z - D / 2 + 0.12, '#b3b2ab').box(W, 1.0, 0.25, x, y + 0.5, z + D / 2 - 0.12, '#b3b2ab');
      // two rows of cars, along each side of the middle lane
      for (const row of [-1, 1]) {
        for (let s = -D / 2 + 3; s < D / 2 - 3; s += 2.7) {
          if (rng.next() > (i === levels ? 0.35 : 0.7)) continue;
          walls.box(1.8, 1.3, 4.3, x + row * (W / 2 - 4), y + 0.65, z + s, rng.pick(cars), 0, Math.PI / 2 + (rng.next() - 0.5) * 0.1);
        }
      }
    }
    // the columns along the edges, the stair towers at the corners
    for (let s = -D / 2; s <= D / 2 + 0.1; s += 10) {
      for (const side of [-1, 1]) walls.box(0.6, levels * deck, 0.6, x + side * (W / 2 - 0.4), levels * deck / 2, z + s, '#a9a8a1');
    }
    for (const side of [-1, 1]) walls.box(5, levels * deck + 3, 5, x - W / 2 + 2.5, (levels * deck + 3) / 2, z + side * (D / 2 - 2.5), '#8e8f8a');
    // the P signs on the stair towers, facing the apron
    const cv = signCanvas('P', '#1f5fae', '#ffffff');
    const map = tex(cv, 8);
    const mat = new THREE.MeshLambertMaterial({ map, emissiveMap: map, emissive: 0x000000 });
    rec.night.push({ mat, color: new THREE.Color(0xffffff), k: 0.8 });
    for (const side of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(4, 4);
      geo.rotateY(-Math.PI / 2);
      at(new THREE.Mesh(geo, mat), b.t + side * (D / 2 - 2.5), b.across - W / 2 - 0.05, levels * deck);
    }
  }
};

// a sign: the text in fg on bg (null: transparent, the letters outlined), its canvas sized to the
// text so the sign keeps its proportions
function signCanvas(text, bg, fg) {
  const H = 128, font = '700 84px Arial, sans-serif';
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const cv = document.createElement('canvas');
  cv.width = Math.max(H, Math.ceil(probe.measureText(text).width + 64));
  cv.height = H;
  const g = cv.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, cv.width, H); }
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (!bg) { g.lineJoin = 'round'; g.strokeStyle = '#3a3f44'; g.lineWidth = 10; g.strokeText(text, cv.width / 2, H / 2 + 4); }
  g.fillStyle = fg; g.fillText(text, cv.width / 2, H / 2 + 4);
  return cv;
}
