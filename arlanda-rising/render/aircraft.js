'use strict';

// Arlanda Rising — an aircraft on the map, drawn to scale from data/aircraft.js (span, length) in the airline's
// livery of the year (data/airlines.js `liveries`, the fin's emblem by art/emblems.js): its shadow, the wings and
// the tailplane, the engines (jet pods under the wings or at the tail, propellers turning), a fuselage built up
// in layers so the cheatline shows on its side, and the fin standing up with the emblem on it. Its lamps go to
// the scene's light list. Used by render/traffic.js.

// the shape of each type beyond its size: wing sweep (°), where the engines are, propellers, tail height
const AIRCRAFT_SHAPE = {
  DC3: { sweep: 4, engines: [0.2], props: true, fin: 0.2, fus: 0.06 },
  CV44: { sweep: 2, engines: [0.2], props: true, fin: 0.2, fus: 0.055 },
  DC6B: { sweep: 2, engines: [0.17, 0.33], props: true, fin: 0.2, fus: 0.05 },
  CRVL: { sweep: 20, rear: true, fin: 0.2, fus: 0.045 },
  DC8: { sweep: 30, engines: [0.2, 0.37], fin: 0.17, fus: 0.04 },
  DC9: { sweep: 24, rear: true, fin: 0.2, fus: 0.04 },
  B727: { sweep: 32, rear: true, fin: 0.2, fus: 0.04 },
  B747: { sweep: 37, engines: [0.21, 0.4], fin: 0.17, fus: 0.045 },
  DC10: { sweep: 35, engines: [0.3], fin: 0.17, fus: 0.05 },
  F28: { sweep: 16, rear: true, fin: 0.2, fus: 0.05 },
  MD81: { sweep: 24, rear: true, fin: 0.18, fus: 0.035 },
  // session 4
  B737: { sweep: 25, engines: [0.17], fin: 0.2, fus: 0.045 },
  B767: { sweep: 31, engines: [0.24], fin: 0.18, fus: 0.05 },
  MD87: { sweep: 24, rear: true, fin: 0.2, fus: 0.037 },
  F100: { sweep: 17, rear: true, fin: 0.2, fus: 0.045 },
  F50: { sweep: 2, engines: [0.2], props: true, fin: 0.21, fus: 0.06 },
  BA46: { sweep: 15, engines: [0.13, 0.26], fin: 0.24, fus: 0.06 },
  A320: { sweep: 25, engines: [0.2], fin: 0.2, fus: 0.045 },
  B757: { sweep: 25, engines: [0.19], fin: 0.18, fus: 0.04 }
};

const AircraftArt = (() => {
  const METAL = '#c9ced3';

  // draw one aircraft. a: { type, al, x, y, hdg, z, moving, lights, year, alpha, gear }
  function draw(c, sc, a) {
    const t = AIRCRAFT[a.type], sh = AIRCRAFT_SHAPE[a.type] || AIRCRAFT_SHAPE.DC8;
    const L = t.length, B = t.span, fw = Math.max(1.2, L * sh.fus);
    const h = a.hdg * Math.PI / 180, fx = Math.sin(h), fy = Math.cos(h), rx = Math.cos(h), ry = -Math.sin(h);
    const liv = liveryOf(a.al, a.year || 1960);
    const zb = a.z || 0;
    const W = (lx, ly) => [a.x + ly * fx + lx * rx, a.y + ly * fy + lx * ry];
    const pt = (lx, ly, z) => { const w = W(lx, ly); return P(w[0], w[1], z); };
    const polyL = (pts, z, fill) => {
      c.beginPath();
      pts.forEach((q, i) => { const u = pt(q[0], q[1], z); if (i) c.lineTo(u[0], u[1]); else c.moveTo(u[0], u[1]); });
      c.closePath(); c.fillStyle = fill; c.fill();
    };
    // the shapes in local metres: x to the right wing, y to the nose
    const fus = [];
    for (let i = 0; i <= 8; i++) { const an = Math.PI / 2 * i / 8; fus.push([fw * Math.sin(an), L / 2 - fw * 1.6 * (1 - Math.cos(an))]); }
    fus.push([fw, -L * 0.22], [fw * 0.35, -L / 2]);
    const full = fus.concat(fus.slice().reverse().map((q) => [-q[0], q[1]]));
    const tanS = Math.tan(sh.sweep * Math.PI / 180);
    const rootLe = L * 0.1, rootC = L * 0.2, tipC = L * 0.07;
    const wing = (side) => [[side * fw * 0.8, rootLe], [side * B / 2, rootLe - tanS * B / 2], [side * B / 2, rootLe - tanS * B / 2 - tipC], [side * fw * 0.8, rootLe - rootC]];
    const sY = -L * 0.4, sB = B * 0.17, sC = L * 0.1;
    const stab = (side) => [[side * fw * 0.3, sY], [side * sB, sY - tanS * sB * 0.9], [side * sB, sY - tanS * sB * 0.9 - sC * 0.5], [side * fw * 0.3, sY - sC]];

    c.save();
    if (a.alpha !== undefined) c.globalAlpha = a.alpha;
    // the shadow on the ground, fading as it climbs
    const shA = clamp(0.28 - zb / 400, 0, 0.28);
    if (shA > 0.01) {
      const sx = a.x + zb * 0.25, sy = a.y - zb * 0.1;
      const S0 = (lx, ly) => { const w = W(lx, ly); return P(w[0] - a.x + sx, w[1] - a.y + sy, 0); };
      c.fillStyle = 'rgba(0,0,0,' + shA + ')';
      for (const shape of [full, wing(1), wing(-1), stab(1), stab(-1)]) {
        c.beginPath(); shape.forEach((q, i) => { const u = S0(q[0], q[1]); if (i) c.lineTo(u[0], u[1]); else c.moveTo(u[0], u[1]); }); c.closePath(); c.fill();
      }
    }
    // which wing is nearer the viewer
    const tipR = W(B / 2, 0), tipL = W(-B / 2, 0), nearSide = depthOf(tipR[0], tipR[1]) > depthOf(tipL[0], tipL[1]) ? 1 : -1;
    const wingZ = zb + 2.6;
    const drawEngines = (side) => {
      if (sh.rear) return;
      for (const e of sh.engines) {
        const lx = side * B * e, le = rootLe - tanS * Math.abs(lx);
        if (sh.props) {
          polyL([[lx - 0.9, le + 2.2], [lx + 0.9, le + 2.2], [lx + 0.9, le - 2.5], [lx - 0.9, le - 2.5]], wingZ + 0.2, '#8d939a');
          const c0 = pt(lx, le + 2.4, wingZ + 0.3);
          c.strokeStyle = a.moving ? 'rgba(60,60,60,0.35)' : '#333'; c.lineWidth = a.moving ? 0.25 : 0.35;
          c.beginPath();
          if (a.moving) c.ellipse(c0[0], c0[1], 2.2 * ISO_K, 1.6 * ISO_K, 0, 0, Math.PI * 2);
          else { const p1 = pt(lx - 2, le + 2.4, wingZ + 0.3), p2 = pt(lx + 2, le + 2.4, wingZ + 0.3); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); }
          c.stroke();
        } else {
          polyL([[lx - 0.9, le + 3], [lx + 0.9, le + 3], [lx + 0.9, le - 2], [lx - 0.9, le - 2]], wingZ - 1, '#9aa0a6');
          polyL([[lx - 0.9, le + 3], [lx + 0.9, le + 3], [lx + 0.9, le + 2.4], [lx - 0.9, le + 2.4]], wingZ - 0.9, '#2b2e31');
        }
      }
    };
    polyL(wing(-nearSide), wingZ, shade(METAL, -0.08));
    drawEngines(-nearSide);
    polyL(stab(-nearSide), zb + 4.6, shade(METAL, -0.05));
    // the fuselage in layers: belly, cheatline, top
    const zl = zb + 2.2, zh = zb + 2.2 + fw * 2;
    const layers = 7;
    for (let i = 0; i <= layers; i++) {
      const z = zl + (zh - zl) * i / layers, f = i / layers;
      const col = f < 0.3 ? (liv.belly || METAL) : f < 0.5 ? liv.line : f < 0.58 && liv.line2 ? liv.line2 : liv.top;
      polyL(full, z, i === layers ? shade(liv.top, 0.06) : shade(col, -0.1 + f * 0.1));
    }
    // cockpit windows
    polyL([[-fw * 0.6, L / 2 - fw * 0.9], [fw * 0.6, L / 2 - fw * 0.9], [fw * 0.7, L / 2 - fw * 1.6], [-fw * 0.7, L / 2 - fw * 1.6]], zh + 0.02, '#2a3540');
    polyL(wing(nearSide), wingZ, METAL);
    drawEngines(nearSide);
    polyL(stab(nearSide), zb + 4.6, METAL);
    if (sh.rear) for (const s of [-1, 1]) {
      polyL([[s * (fw + 0.4), -L * 0.24], [s * (fw + 2.2), -L * 0.24], [s * (fw + 2.2), -L * 0.36], [s * (fw + 0.4), -L * 0.36]], zh - 0.6, '#9aa0a6');
    }
    // the fin with the emblem
    fin(c, a, liv, L, sh, fw, pt, zh);
    c.restore();
    // lamps
    if (a.lights) {
      const lr = W(B / 2, rootLe - tanS * B / 2), ll = W(-B / 2, rootLe - tanS * B / 2), tail = W(0, -L / 2);
      sc.lights.push({ x: lr[0], y: lr[1], z: wingZ, col: '60,255,90', r: 3 });
      sc.lights.push({ x: ll[0], y: ll[1], z: wingZ, col: '255,60,60', r: 3 });
      sc.lights.push({ x: tail[0], y: tail[1], z: zh, col: '255,255,255', r: 2.5 });
      if (a.moving) { const top = W(0, 0); sc.lights.push({ x: top[0], y: top[1], z: zh + 0.3, col: '255,40,40', r: 4, blink: 1 }); }
      if (a.landing) { const n = W(0, L / 2 + 2); sc.lights.push({ x: n[0], y: n[1], z: zb + 2, col: '255,250,230', r: 10 }); }
    }
  }

  function fin(c, a, liv, L, sh, fw, pt, zh) {
    const H = L * sh.fin, root0 = -L * 0.27, root1 = -L / 2 + 0.5, sweep = H * (sh.props ? 0.5 : 0.85);
    // the fin's plane: l along the body (to the nose), y down from its root line
    const o = pt(0, 0, zh), el = pt(0, 1, zh);
    const ex = el[0] - o[0], ey = el[1] - o[1];
    c.save();
    c.transform(ex, ey, 0, ISO_Z, o[0], o[1]);
    c.beginPath();
    const topBack = root1 - sweep * 0.25, topFront = topBack + (root0 - root1) * 0.45;
    c.moveTo(root0, 0); c.lineTo(topFront, -H); c.lineTo(topBack, -H); c.lineTo(root1, 0);
    c.closePath();
    c.fillStyle = liv.tail; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.15; c.stroke();
    if (liv.emblem) {
      const cx = ((root0 + root1) / 2 + (topFront + topBack) / 2) / 2, cy = -H * 0.5;
      c.translate(cx, cy);
      if (ex < 0) c.scale(-1, 1);   // never mirrored on the side we see
      Emblems.drawOnFin(c, liv.emblem, H * 0.42);
    }
    c.restore();
  }

  return { draw };
})();
