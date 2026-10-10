'use strict';

// ============================================================
// World Aviation — the general aviation and rescue area of an airport
// (three.js), built in the airport's frame like airport3d.js (local
// x = across, towards the terminal; z = -t, along the runway; y = up):
//
//   - past the cargo area, behind its stands (World.buildBuildings):
//     the GA terminal, its office at the near end and the bush
//     operators' hangar bays between the GA stands, their logo over the
//     doors; the air ambulance's hangar, white with a red band, the
//     Star of Life and AIR AMBULANCE (and its operator's name) on it;
//     the rescue station, a hangar with a door for each helicopter pad
//     and RESCUE (with the country's own word) on its roof; the fire
//     station at the end of the row: red roller doors on its bays, a
//     hose tower, FIRE STATION (and the local word) over the doors
//   - the helicopter pads in front of the rescue station (a white H in
//     a circle), the search-and-rescue helicopter on the first (a Mi-8
//     in the Russian rescue service's colours in Russia, else a big
//     twin in red and white), the air ambulance's on the second (a
//     small one in its operator's colours, on skids); two fire engines
//     out on the station's forecourt, a fuel bowser by the GA terminal
//   - a remote strip (an airfield of the bush operators alone,
//     a.remote): its terminal is a small timber house with a pitched
//     roof and the airport's name over the door, its fuel a few tanks
//     and drums (the gravel of its runway and apron: airport3d.js)
//   - the vehicle waiting at the player's own stand in the GA area for
//     the load (updateLoad): a mail van in the post's colours, a reefer
//     van for the fish, a pickup with crates for the freight, an
//     ambulance for a patient (at the arrival the ambulance drives up
//     from its hangar: responders3d.js)
//
// Static parts are merged like the apron's (kit in apron3d.js) and
// baked with the buildings (Airport3D.build).
// Used by Airport3D.build / buildBuildings, Apron3D.build (Vehicles.pickup),
// Responders3D (the depots) and Scene3D.update (updateLoad).
// ============================================================

// the country's own word under the English one on the rescue station and the fire station
const GA_LOCAL_WORDS = {
  rescue: { Sweden: 'SJÖRÄDDNING', Norway: 'REDNINGSTJENESTE', Denmark: 'REDNINGSTJENESTE', Finland: 'MERIPELASTUS', Iceland: 'LANDHELGISGÆSLAN', Russia: 'МЧС РОССИИ', Germany: 'SEENOTRETTUNG', France: 'SECOURS', Italy: 'SOCCORSO', Spain: 'SALVAMENTO' },
  fire: { Sweden: 'BRANDSTATION', Norway: 'BRANNSTASJON', Denmark: 'BRANDSTATION', Finland: 'PALOASEMA', Iceland: 'SLÖKKVISTÖÐ', Russia: 'ПОЖАРНАЯ ЧАСТЬ', Germany: 'FEUERWACHE', France: 'POMPIERS', Italy: 'VIGILI DEL FUOCO', Spain: 'BOMBEROS' }
};
// the post's van colours by country: [body, stripe]
const POST_VANS = {
  Sweden: ['#00a0d6', '#ffffff'], Denmark: ['#00a0d6', '#ffffff'], Norway: ['#e32119', '#ffffff'], Finland: ['#f26722', '#ffffff'],
  Iceland: ['#e32119', '#ffffff'], Russia: ['#f4f4f0', '#0055a5'], 'United States': ['#f4f4f0', '#004b87'],
  'United Kingdom': ['#da202a', '#f2c418'], Germany: ['#ffcc00', '#1c1c1c'], France: ['#ffcc00', '#003da5'], Canada: ['#da202a', '#ffffff']
};
const GA_FIRE_BAYS = 4;          // the fire station's bays (the hose tower past the last)

// ---------- the vehicles (forward = +z, on y = 0; see Vehicles in apron3d.js) ----------
Object.assign(Vehicles, {
  // a pickup: the cab ahead, an open bed behind (crates in it when `load`)
  pickup(k, color, load, rng) {
    k.box(1.9, 0.6, 5.3, 0, 0.75, 0, '#2b2e31').box(1.95, 0.9, 2.3, 0, 1.35, 1.2, color).box(1.8, 0.7, 1.6, 0, 2.1, 0.8, color)
      .box(1.7, 0.55, 0.06, 0, 2.1, 1.62, '#202a33').box(1.82, 0.5, 1.5, 0, 2.1, 0.8, '#202a33')
      .box(1.95, 0.55, 2.4, 0, 1.3, -1.35, color).box(1.6, 0.1, 2.3, 0, 1.08, -1.35, '#3a3d40');
    for (const x of [-0.85, 0.85]) for (const z of [-1.6, 1.6]) k.wheel(x, z, 0.4);
    if (load) {
      for (let i = 0; i < 3; i++) k.box(0.7, 0.55, 0.7, (i % 2 ? 0.4 : -0.4), 1.45, -0.7 - (i >> 1) * 0.9, ['#b89a6a', '#8a7a5a', '#c9b48a'][(rng.next() * 3) | 0]);
    }
    return k;
  },
  // a panel van in the post's colours (a stripe along the side), or white with a reefer unit over
  // the cab for the fish
  panelVan(k, body, stripe, reefer) {
    k.box(2.0, 0.5, 5.6, 0, 0.6, 0, '#2b2e31').box(2.0, 1.1, 1.3, 0, 1.15, 2.1, body).box(2.0, 2.2, 3.9, 0, 1.75, -0.45, body)
      .box(1.9, 0.6, 0.06, 0, 1.65, 2.76, '#202a33').box(2.02, 0.55, 1.0, 0, 1.65, 2.0, '#202a33')
      .box(2.04, 0.35, 3.9, 0, 1.35, -0.45, stripe);
    if (reefer) k.box(1.6, 0.5, 0.9, 0, 3.05, 1.0, '#c9cdd0').box(1.4, 0.3, 0.06, 0, 3.05, 1.46, '#55595d');
    for (const x of [-0.9, 0.9]) for (const z of [-1.7, 1.9]) k.wheel(x, z, 0.38);
    return k;
  },
  // a fuel bowser for the light aeroplanes: a small tanker truck
  bowser(k) {
    k.box(2.3, 2.0, 2.0, 0, 1.6, 2.7, '#f1f1ec').box(2.1, 0.8, 1.9, 0, 1.9, 3.3, '#27313b')
      .box(2.2, 0.5, 7.2, 0, 0.85, 0, '#3a3d40')
      .cyl(1.05, 1.05, 4.4, 14, 0, 2.15, -1.2, '#f4f4ef', Math.PI / 2)
      .cyl(1.08, 1.08, 0.45, 14, 0, 2.15, -1.2, '#c8282a', Math.PI / 2);
    for (const x of [-1.0, 1.0]) for (const z of [-2.4, 2.6]) k.wheel(x, z, 0.48);
    return k;
  },
  // A helicopter, its nose forward, on its wheels or skids: the cabin, the engine housing on top,
  // the tail boom, the fin and the tail rotor, the main rotor's blades drooping a little.
  // H: HELICOPTERS' size, c: { body, lower, stripe } its colours, look: 'mi8' (a long body, side
  // tanks, a thick boom), 'twin' (a big twin on wheels, sponsons) or 'light' (skids, a fenestron fin)
  helicopter(k, H, c, look) {
    const L = H.len, W = look === 'light' ? 1.5 : look === 'mi8' ? 2.5 : 2.2, Hc = look === 'light' ? 1.5 : look === 'mi8' ? 2.4 : 2.0;
    const y0 = look === 'light' ? 0.6 : 0.55, Lc = L * (look === 'mi8' ? 0.55 : 0.5), zc = L * 0.18;
    const front = zc + Lc / 2, back = zc - Lc / 2, boomY = y0 + Hc * 0.68;
    // the cabin, its lower part in the second colour, a stripe; the nose and the cockpit glass
    k.box(W, Hc, Lc, 0, y0 + Hc / 2, zc, c.body).box(W + 0.03, Hc * 0.34, Lc, 0, y0 + Hc * 0.17, zc, c.lower)
      .box(W + 0.05, Hc * 0.08, Lc * 0.92, 0, y0 + Hc * 0.42, zc, c.stripe)
      .box(W * 0.9, Hc * 0.55, L * 0.07, 0, y0 + Hc * 0.3, front + L * 0.035, c.lower)
      .box(W * 0.84, Hc * 0.42, L * 0.06, 0, y0 + Hc * 0.68, front + L * 0.02, '#1d2833', -0.35)
      .box(W + 0.04, Hc * 0.36, Lc * 0.3, 0, y0 + Hc * 0.66, zc + Lc * 0.22, '#2a3540');           // the cabin windows
    // the engine housing on the roof, the mast and the hub
    k.box(W * 0.72, Hc * 0.36, Lc * 0.5, 0, y0 + Hc * 1.18, zc - Lc * 0.05, c.body)
      .cyl(0.18, 0.22, H.h - (y0 + Hc * 1.36), 8, 0, (H.h + y0 + Hc * 1.36) / 2 - 0.2, zc + Lc * 0.04, '#55595d')
      .cyl(0.45, 0.45, 0.35, 10, 0, H.h - 0.25, zc + Lc * 0.04, '#3a3d40');
    // the blades: five on the big ones, four on the light one, drooping to the tips
    const nb = look === 'light' ? 4 : 5, bw = look === 'light' ? 0.32 : 0.55;
    for (let i = 0; i < nb; i++) {
      const q = (i + 0.3) / nb * TAU, len = H.rotorR - 0.3, droop = look === 'light' ? 0.03 : 0.045;
      k.box(bw, 0.08, len, Math.sin(q) * len / 2, H.h - 0.25 - len * droop / 2, zc + Lc * 0.04 + Math.cos(q) * len / 2, '#2b2f33', droop, q, 0);
    }
    // the tail boom, from the cabin's back to the fin, tapering
    const boom = back - (-L / 2) - 0.6;
    k.cyl(Hc * (look === 'mi8' ? 0.26 : 0.2), Hc * 0.1, boom, 10, 0, boomY, back - boom / 2, c.body, Math.PI / 2);
    // the fin (a light one's is a big fenestron), the tailplane, the tail rotor
    if (look === 'light') {
      k.box(0.35, Hc * 1.0, L * 0.12, 0, boomY + Hc * 0.25, -L / 2 + L * 0.06, c.body)
        .cyl(Hc * 0.28, Hc * 0.28, 0.38, 12, 0, boomY + Hc * 0.15, -L / 2 + L * 0.06, '#2b2f33', 0, 0, Math.PI / 2)
        .box(W * 1.3, 0.08, L * 0.05, 0, boomY, -L / 2 + L * 0.18, c.body);
    } else {
      k.box(0.25, Hc * 1.05, L * 0.07, 0, boomY + Hc * 0.42, -L / 2 + L * 0.04, c.body)
        .box(W * 1.35, 0.1, L * 0.05, 0, boomY + 0.1, -L / 2 + L * 0.14, c.body)
        .cyl(H.rotorR * 0.17, H.rotorR * 0.17, 0.06, 12, (look === 'mi8' ? -1 : 1) * 0.3, boomY + Hc * 0.6, -L / 2 + L * 0.04, '#3a3d40', 0, 0, Math.PI / 2);
    }
    // the gear: skids on struts, or wheels (and the sponsons they fold into, the Mi-8's side tanks)
    if (look === 'light') {
      for (const x of [-W * 0.6, W * 0.6]) {
        k.box(0.12, 0.1, Lc * 1.05, x, 0.05, zc, '#3a3d40');
        for (const dz of [-Lc * 0.3, Lc * 0.25]) k.box(0.1, y0, 0.1, x * 0.85, y0 / 2, zc + dz, '#3a3d40');
      }
    } else {
      k.wheel(0, front - 0.6, 0.3);
      for (const x of [-W * 0.62, W * 0.62]) k.wheel(x, back + Lc * 0.22, 0.38);
      if (look === 'mi8') for (const x of [-W * 0.62, W * 0.62]) k.box(0.7, 0.8, Lc * 0.32, x, y0 + 0.55, zc - Lc * 0.02, c.lower);
      else for (const x of [-W * 0.56, W * 0.56]) k.box(0.55, 0.6, Lc * 0.4, x, y0 + 0.35, back + Lc * 0.22, c.body);
    }
    return k;
  }
});

const Ga3D = {
  // the bush operators working at the airport (none of the air ambulances), the k-th of them:
  // their paint on the light aeroplanes at the GA stands and their logo on the GA hangar
  operator(a, k) {
    const all = AIRLINES.filter((x) => x.kinds.indexOf('bush') >= 0 && !x.own && airlineWorksAt(x, a));
    const list = all.filter((x) => !this.isAmbulance(x));
    const pool = list.length ? list : all;
    return pool.length ? pool[(hashStr(a.id) + k) % pool.length] : null;
  },
  // the air ambulance working at the airport, if one does
  ambulanceOperator(a) {
    const list = AIRLINES.filter((x) => this.isAmbulance(x) && airlineWorksAt(x, a));
    return list.length ? list[hashStr(a.id) % list.length] : null;
  },
  isAmbulance(al) { return al.kinds.indexOf('bush') >= 0 && al.emblem && (al.emblem[0] === 'starOfLife' || al.emblem[0] === 'wingsCross'); },

  // ---------- the buildings (World.buildBuildings: kinds ga, medevac, rescue, fire) ----------
  building(a, b, rec, at, tex, lambert, id) {
    const k = kit();
    const P = id.paint, hex = (c) => '#' + new THREE.Color(c).getHexString();
    const h = b.h, w = b.acrossSize, len = b.along;
    const front = b.across - w / 2, back = b.across + w / 2, t0 = b.t - len / 2, t1 = b.t + len / 2;
    const win = lambert(0x3a4550);
    rec.night.push({ mat: win, color: new THREE.Color(0xfff0c8), k: 0.5 });
    // a sign on the apron front (and one on the roof edge for the rescue station), lit at night
    const sign = (cv, t, across, y, hgt, side) => {
      const map = tex(cv, 8);
      const mat = new THREE.MeshLambertMaterial({ map, emissiveMap: map, emissive: 0x000000 });
      rec.night.push({ mat, color: new THREE.Color(0xffffff), k: 0.8 });
      const geo = new THREE.PlaneGeometry(hgt * cv.width / cv.height, hgt);
      geo.rotateY((side || -1) * Math.PI / 2);
      at(new THREE.Mesh(geo, mat), t, across, y);
    };
    // a roller door on the apron front, from ta to tb, dh tall, its slats showing
    const door = (ta, tb, dh, frame, leaf) => {
      const dw = tb - ta, tm = (ta + tb) / 2;
      k.box(0.5, dh + 0.6, dw + 0.8, front - 0.25, (dh + 0.6) / 2, -tm, frame).box(0.6, dh, dw, front - 0.3, dh / 2, -tm, leaf);
      for (let y = 0.7; y < dh; y += 0.7) k.box(0.62, 0.06, dw, front - 0.32, y, -tm, '#3a3f44');
    };
    // the windows along the back (lit at night)
    at(new THREE.Mesh(cellBox(0.3, 1.3, len * 0.8), win), b.t, back + 0.3, h * 0.55);

    if (b.kind === 'ga') {
      // the shell in the airport's hangar paint, the roof slab; the office at the near end (glass
      // to the apron, an entrance), hangar doors between the stands
      k.box(w, h, len, b.across, h / 2, -b.t, hex(P.hangar)).box(w + 1.2, 0.8, len + 1.2, b.across, h + 0.4, -b.t, hex(P.roof));
      const gs = a.gates.filter((g) => g.zone === 'ga');
      const officeEnd = gs[0].t - 6;
      at(new THREE.Mesh(cellBox(0.4, h * 0.45, officeEnd - t0 - 4), win), (t0 + officeEnd) / 2, front - 0.25, h * 0.45);
      k.box(4, 0.3, Math.min(10, officeEnd - t0 - 6), front - 2, 3.2, -(t0 + officeEnd) / 2, hex(P.trim));
      sign(signCanvas(['GENERAL AVIATION'], '#1b232c', '#ffffff', id.color), (t0 + officeEnd) / 2, front - 0.5, h * 0.8, Math.min(2.6, h * 0.24, (officeEnd - t0 - 2) * 220 / 1024));
      for (let i = 0; i + 1 < gs.length; i++) door(gs[i].t + 6, gs[i + 1].t - 6, h * 0.72, '#e3b51c', hex(P.door));
      if (gs.length === 1) door(gs[0].t + 6, t1 - 4, h * 0.72, '#e3b51c', hex(P.door));
      // the bush operator's logo over the first hangar door
      const al = this.operator(a, 0);
      if (al && gs.length > 1) Airport3D.logoBoard(rec, at, tex, al, (gs[0].t + gs[1].t) / 2, front - 0.6, h * 0.86, gs[1].t - gs[0].t - 14, h * 0.22);
    } else if (b.kind === 'medevac') {
      // white, a red band under the roof; the door past the stand's board, AIR AMBULANCE and the
      // Star of Life beside it
      k.box(w, h, len, b.across, h / 2, -b.t, '#f2f2ee').box(w + 0.1, 1.2, len + 0.1, b.across, h - 1.4, -b.t, '#c8282a')
        .box(w + 1.2, 0.7, len + 1.2, b.across, h + 0.35, -b.t, '#d9dcd8');
      door(b.t + 5, t1 - 3, h * 0.66, '#c8282a', '#e9e9e4');
      const al = this.ambulanceOperator(a), sz = Math.min(4, h * 0.45);
      sign(signCanvas(al ? ['AIR AMBULANCE', al.title] : ['AIR AMBULANCE'], '#ffffff', '#c8282a', '#1d4fb8'), b.t - len * 0.2, front - 0.5, h * 0.55, Math.min(3.2, h * 0.3));
      sign(starCanvas(), t0 + sz / 2 + 1.5, front - 0.5, h * 0.55, sz);
    } else if (b.kind === 'rescue') {
      // a hangar with a door for each helicopter, a red and white band, RESCUE on the roof
      k.box(w, h, len, b.across, h / 2, -b.t, hex(P.hangar)).box(w + 1.2, 0.8, len + 1.2, b.across, h + 0.4, -b.t, hex(P.roof));
      for (let i = 0; i < 10; i++) k.box(w + 0.1, 1.0, len / 10, b.across, h - 1.2, -(t0 + len * (i + 0.5) / 10), i % 2 ? '#f4f4f0' : '#d22630');
      for (const p of a.helipads) door(p.t - 13, p.t + 13, h * 0.7, '#d22630', hex(P.door));
      const local = GA_LOCAL_WORDS.rescue[a.country];
      const cv = signCanvas(local ? ['RESCUE', local] : ['RESCUE'], '#d22630', '#ffffff', '#f4f4f0');
      const sh = Math.min(3.4, h * 0.3, len * 0.6 * cv.height / cv.width);
      for (const s of [-1, 1]) sign(cv, b.t, b.across + s * 0.3, h + 1.2 + sh / 2, sh, s);
      k.box(0.5, sh + 0.4, sh * cv.width / cv.height + 0.4, b.across, h + 1.2 + sh / 2, -b.t, '#1b232c');
    } else if (b.kind === 'fire') {
      // red bays with roller doors, the hose tower at the far end, FIRE STATION over the doors
      k.box(w, h, len, b.across, h / 2, -b.t, '#e6e2d8').box(w + 1.2, 0.8, len + 1.2, b.across, h + 0.4, -b.t, '#8a1d1d')
        .box(w + 0.1, 0.9, len + 0.1, b.across, h - 0.9, -b.t, '#c41e24');
      for (const tb of this.fireBays(b)) door(tb - 4, tb + 4, h - 4.6, '#c41e24', '#d8d4cc');
      const tt = t1 - 4;
      k.box(5, h + 8, 5, back - 6, (h + 8) / 2, -tt, '#e6e2d8').box(5.4, 1.0, 5.4, back - 6, h + 8.5, -tt, '#8a1d1d')
        .box(0.3, 1.6, 2.2, back - 8.6, h + 5, -tt, '#3a4550');
      const local = GA_LOCAL_WORDS.fire[a.country];
      sign(signCanvas(local ? ['FIRE STATION', local] : ['FIRE STATION'], '#c41e24', '#ffffff', '#f2c418'), b.t - 5, front - 0.5, h - 2.3, 2.0);
    }
    at(k.mesh(), 0, 0, 0);
  },
  // the fire station's bays along it, t (the hose tower past the last)
  fireBays(b) {
    const out = [];
    for (let i = 0; i < GA_FIRE_BAYS; i++) out.push(b.t - b.along / 2 + 7 + i * 10);
    return out;
  },

  // ---------- a remote strip's terminal: a timber house with a pitched roof ----------
  remoteTerminal(a, b, rec, at, tex, lambert, id) {
    const k = kit();
    const nordic = ['Norway', 'Sweden', 'Finland', 'Iceland', 'Faroe Islands', 'Greenland', 'Denmark'].indexOf(a.country) >= 0;
    const wall = nordic ? '#8f2a1f' : '#c9b38a', trim = '#f2f0ea', roof = '#3a3d40';
    const w = b.acrossSize, len = b.along, wh = b.h - 3.2, front = b.across - w / 2, back = b.across + w / 2;
    // (the signs, the flags and the cameras: the top of the box)
    b.roofTop = () => b.h; b.roofAt = () => b.h;
    b.frontTaken = [[-Infinity, Infinity]];          // (no advert boards on its boards)
    k.box(w, wh, len, b.across, wh / 2, -b.t, wall).box(w + 0.3, 0.6, len + 0.3, b.across, 0.3, -b.t, '#55595d');
    // the boards: a white corner post every 8 m
    for (let t = b.t - len / 2; t <= b.t + len / 2 + 0.1; t += Math.max(6, len / Math.round(len / 8))) {
      for (const ac of [front - 0.1, back + 0.1]) k.box(0.3, wh, 0.3, ac, wh / 2, -t, trim);
    }
    // the roof: two slopes meeting over the middle, along the building
    const rise = b.h - wh, half = w / 2 + 0.8, slope = Math.hypot(half, rise), ang = Math.atan2(rise, half);
    for (const s of [-1, 1]) k.box(slope, 0.3, len + 1.6, b.across + s * half / 2, wh + rise / 2, -b.t, roof, 0, 0, -s * ang);
    // the gable ends
    for (const e of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const f = (i + 0.5) / 6, hw = w / 2 * (1 - f);
        k.box(hw * 2, rise / 6, 0.2, b.across, wh + rise * f, -(b.t + e * len / 2), wall);
      }
    }
    // windows with white frames and a door, on both long sides
    for (const [ac, s] of [[front, -1], [back, 1]]) {
      for (let t = b.t - len / 2 + 5; t < b.t + len / 2 - 3; t += 6) {
        if (Math.abs(t - b.t) < 3.5) continue;
        k.box(0.2, 1.7, 1.6, ac + s * 0.1, wh * 0.55, -t, trim);
      }
      k.box(0.2, 2.4, 1.8, ac + s * 0.12, 1.3, -b.t, '#3a2a20').box(0.25, 0.25, 2.4, ac + s * 0.12, 2.65, -b.t, trim);
    }
    at(k.mesh(), 0, 0, 0);
    const glass = lambert(0x2e4558);
    rec.night.push({ mat: glass, color: new THREE.Color(0xffd9a0), k: 0.55 });
    for (const [ac, s] of [[front, -1], [back, 1]]) {
      for (let t = b.t - len / 2 + 5; t < b.t + len / 2 - 3; t += 6) {
        if (Math.abs(t - b.t) < 3.5) continue;
        at(new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.3, 1.2), glass), t, ac + s * 0.16, wh * 0.55);
      }
    }
    // the airport's name over the door on both sides, the flag on a pole beside the house
    const cv = signCanvas([roofLabel(a)], '#f2f0ea', '#1b232c', id.color);
    const map = tex(cv, 8);
    const mat = new THREE.MeshLambertMaterial({ map, emissiveMap: map, emissive: 0x000000 });
    rec.night.push({ mat, color: new THREE.Color(0xffffff), k: 0.6 });
    const sh = 1.2, sw = Math.min(len * 0.6, sh * cv.width / cv.height);
    for (const [ac, s] of [[front - 0.2, -1], [back + 0.2, 1]]) {
      const geo = new THREE.PlaneGeometry(sw, sw * cv.height / cv.width);
      geo.rotateY(s * Math.PI / 2);
      at(new THREE.Mesh(geo, mat), b.t, ac, 3.6);
    }
    Airport3D.flag(rec, at, tex, a.country, null, b.t - len / 2 - 6, front + 4, 0, 9, 3);
  },

  // a remote strip's fuel: two small tanks on a frame and rows of drums (b: the fuel kind)
  fuelDepot(a, b, rec, at, lambert) {
    const k = kit();
    for (const dt of [-6, 6]) {
      k.cyl(1.5, 1.5, 6, 14, b.across + 6, 2.2, -(b.t + dt), '#d9dcd8', Math.PI / 2)
        .box(2.6, 0.7, 5, b.across + 6, 0.35, -(b.t + dt), '#55595d');
    }
    const rng = makeRng(hashStr(a.id + '/drums'));
    for (let i = 0; i < 24; i++) {
      if (rng.next() < 0.2) continue;
      k.cyl(0.3, 0.3, 0.9, 10, b.across - 6 + (i % 6) * 0.7, 0.45, -(b.t - 6 + ((i / 6) | 0) * 0.7), rng.next() < 0.5 ? '#2e5a8a' : '#c8282a');
    }
    at(k.mesh(), 0, 0, 0);
  },

  // ---------- the static dressing: the pads and the helicopters, the fire engines, a bowser ----------
  build(a, rec, at, tex) {
    const L = LAYOUT, rng = makeRng(hashStr(a.id + '/ga'));
    const k = kit();
    const front = L.TERMINAL - 30;
    // the pads: a white H in a white circle, as big as the helicopter's rotor
    const padMat = new THREE.MeshLambertMaterial({ map: tex(padCanvas(), 8), transparent: true, alphaTest: 0.3, polygonOffset: true, polygonOffsetFactor: -2 });
    for (const p of a.helipads || []) {
      const s = p.heli.rotorR * 2 + 2;
      const geo = new THREE.PlaneGeometry(s, s);
      geo.rotateX(-Math.PI / 2); geo.rotateY(-Math.PI / 2);
      at(new THREE.Mesh(geo, padMat), p.t, p.across, 0.17);
      k.push(p.across, 0, -p.t, -Math.PI / 2);
      Vehicles.helicopter(k, p.heli, this.heliColors(a, p.kind), p.kind === 'sarRu' ? 'mi8' : p.kind === 'hems' ? 'light' : 'twin');
      k.pop();
    }
    // two fire engines out on the forecourt in front of the station's bays, facing the apron (the
    // second bay's leaves for an emergency: responders3d.js)
    const fire = a.buildings.find((b) => b.kind === 'fire');
    if (fire) {
      const bays = this.fireBays(fire);
      for (const i of [0, 2]) { k.push(front - 6.5, 0, -bays[i], -Math.PI / 2); Vehicles.fireEngine(k); k.pop(); }
    }
    // a fuel bowser by the GA terminal's office
    const ga = a.buildings.find((b) => b.kind === 'ga');
    if (ga) { k.push(front - 6, 0, -(ga.t - ga.along / 2 + 9), Math.PI / 2 * (rng.next() < 0.5 ? 1 : -1)); Vehicles.bowser(k); k.pop(); }
    at(k.mesh(), 0, 0, 0);
  },
  // the helicopters' colours: the Russian rescue service's white, orange and blue; the rescue twin
  // red and white; the air ambulance's in its operator's colours (else yellow)
  heliColors(a, kind) {
    if (kind === 'sarRu') return { body: '#f4f4f0', lower: '#f26722', stripe: '#1c4f9c' };
    if (kind === 'sar') return { body: '#f4f4f0', lower: '#d22630', stripe: '#f2c418' };
    const al = this.ambulanceOperator(a);
    if (!al) return { body: '#f2c418', lower: '#f2c418', stripe: '#3a3d40' };
    const L = al.livery;
    return { body: L.body, lower: L.body === '#ffffff' ? (L.cheat ? L.cheat[0] : L.tail) : (L.belly || L.tail), stripe: L.cheat ? L.cheat[L.cheat.length - 1] : L.title };
  },

  // the depots the emergency services drive out of (responders3d.js): [t, across] in front of the
  // building, for 'fire' and 'police' the fire station's second and fourth bays, for 'ambulance'
  // the air ambulance's hangar
  depot(a, kind) {
    const front = LAYOUT.TERMINAL - 30;
    if (kind === 'ambulance') {
      const b = a.buildings.find((x) => x.kind === 'medevac');
      if (b) return [b.t + b.along / 4, front - 3];
    }
    const f = a.buildings.find((x) => x.kind === 'fire');
    if (!f) return null;
    return [this.fireBays(f)[kind === 'police' ? 3 : 1], front - 3];
  },

  // ---------- the vehicle for the load at the player's own stand in the GA area ----------
  // Per frame, for every airport built: dep / arr the flight's departure and arrival stands at
  // this airport (null when they are not here). A mail van, a reefer van for the fish, a pickup
  // with crates, at the departure an ambulance for a patient (at the arrival it drives up from its
  // hangar with its blue lights on: Flight.meet, responders3d.js) — beside the stand on the door's
  // side, as the emergency services stand (Responders3D.place)
  updateLoad(rec, fl, dep, arr) {
    const c = fl.contract;
    const gate = dep && dep.ga ? dep : arr && arr.ga ? arr : null;
    const type = c && gate && !(gate === arr && c.type === 'medevac') ? c.type : null;
    const key = type ? gate.index + ':' + type + ':' + fl.ac.id : '';
    const v = rec.loadVehicle;
    if (v && (v.fl !== fl || v.key !== key)) {
      rec.frame.remove(v.group);
      v.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      rec.loadVehicle = null;
    }
    if (!key || rec.loadVehicle) return;
    const k = kit(), rng = makeRng(hashStr(c.id || 'load'));
    const post = POST_VANS[rec.a.country] || ['#f2c418', '#1d3f78'];
    let w = 2.1, len = 5.6;
    if (type === 'medevac') { Vehicles.ambulance(k); w = 2.4; len = 6.2; } else if (type === 'mail') Vehicles.panelVan(k, post[0], post[1], false);
    else if (type === 'fish' || type === 'reefer') Vehicles.panelVan(k, '#f4f4f0', '#2e6fb0', true);
    else { Vehicles.pickup(k, '#e9e9e4', true, rng); w = 1.95; len = 5.3; }
    const lay = modelLayout(fl.ac);
    const p = Responders3D.place(lay, lay.R + 3.5, w, len);
    const group = new THREE.Group();
    const mesh = k.mesh();
    mesh.position.set(LAYOUT.STAND + p.z, 0, -(gate.t + p.y));
    mesh.rotation.y = -Math.PI / 2;
    group.add(mesh);
    rec.frame.add(group);
    rec.loadVehicle = { fl, key, group };
  }
};

// a sign: lines of text (the first big, the others smaller under it) on a board, a strip in the
// accent colour along its foot
function signCanvas(lines, bg, fg, accent) {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = lines.length > 1 ? 320 : 220;
  const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = accent; g.fillRect(0, cv.height - 26, cv.width, 26);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((text, i) => {
    g.font = (i ? '700 74px' : '900 140px') + ' Arial, sans-serif';
    const tw = g.measureText(text).width;
    g.save(); g.translate(512, i ? 230 : 104); g.scale(Math.min(1, 960 / tw), 1); g.fillText(text, 0, 0); g.restore();
  });
  return cv;
}
// the Star of Life: a blue six-armed cross with the staff of Asclepius, on white
function starCanvas() {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#1d4fb8';
  g.save(); g.translate(128, 128);
  for (let i = 0; i < 3; i++) { g.rotate(Math.PI / 3); g.fillRect(-26, -112, 52, 224); }
  g.restore();
  g.strokeStyle = '#ffffff'; g.lineWidth = 9;
  g.beginPath(); g.moveTo(128, 50); g.lineTo(128, 206); g.stroke();
  g.lineWidth = 6; g.beginPath();
  for (let y = 70; y <= 186; y += 4) g.lineTo(128 + Math.sin((y - 70) / 116 * Math.PI * 3) * 16, y);
  g.stroke();
  return cv;
}
// a helicopter pad: a white circle and a white H, on a see-through ground
function padCanvas() {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const g = cv.getContext('2d');
  g.strokeStyle = '#f2f2ec'; g.lineWidth = 12;
  g.beginPath(); g.arc(128, 128, 112, 0, TAU); g.stroke();
  g.fillStyle = '#f2f2ec';
  g.fillRect(84, 66, 20, 124); g.fillRect(152, 66, 20, 124); g.fillRect(84, 118, 88, 20);
  return cv;
}
