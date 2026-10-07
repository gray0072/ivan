'use strict';

// ============================================================
// World Aviation — the cockpit: the frame drawn in 2D over the 3D
// world, plus everything you see through the glass (rain, snow,
// frost, cloud, lightning) and a vignette.
// ============================================================

const Cockpit = {
  t: 0,
  parts: null,        // the rain or snow particles around the eye (see precipitation())
  partsKind: null,

  init() { this.parts = null; },

  panelTop(h) {
    // a phone held upright: a taller panel for the gauges two by two and the thrust lever
    if (this.portrait(window.innerWidth, h)) return h - Math.min(h * 0.42, 360);
    return h - Math.min(h * (h < 560 ? 0.34 : 0.30), h < 560 ? 210 : 250);
  },

  // a touch screen held upright (the panel, the buttons and the HUD lay out differently)
  portrait(w, h) { return Input.isCoarse && h > w; },

  // where the centre window post is on the screen: the captain's eye is VIEW.COCKPIT_SEAT_X to
  // the left of it and VIEW.CENTRE_POST_AHEAD in front, seen through the camera's field of view
  postX(w, h) {
    const tanH = Math.tan(VIEW.FOV_DEG * DEG / 2) * w / Math.max(1, h);
    return w / 2 * (1 + (-VIEW.COCKPIT_SEAT_X / VIEW.CENTRE_POST_AHEAD) / tanH);
  },

  draw(ctx, w, h, dpr, fl, sys, dt, inside) {
    this.t += dt;
    const top = this.panelTop(h);
    ctx.save();
    ctx.scale(dpr, dpr);
    const wide = w > 900;
    const frame = 0.055 * h + (wide ? 26 : 12);   // how thick the window frame is

    // outside, only the rain or snow in the air around the camera (no glass, no frame)
    if (!inside) { this.precipitation(ctx, w, h, top, fl, dt); ctx.restore(); return; }
    // ---- weather on the glass
    this.weather(ctx, w, h, top, fl, dt);

    // ---- the cockpit structure
    ctx.fillStyle = '#191d23';
    // top header with a slight curve
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, frame * 0.95);
    ctx.quadraticCurveTo(w / 2, frame * 1.35, 0, frame * 0.95);
    ctx.closePath(); ctx.fill();
    // glareshield lip just above the panel
    ctx.fillStyle = '#20252c';
    ctx.beginPath();
    ctx.moveTo(0, top + 6);
    ctx.quadraticCurveTo(w / 2, top - frame * 0.5, w, top + 6);
    ctx.lineTo(w, top + 14); ctx.lineTo(0, top + 14);
    ctx.closePath(); ctx.fill();

    // A-pillars
    const pillarW = wide ? frame * 0.85 : frame * 0.55;
    ctx.fillStyle = '#1b2027';
    ctx.fillRect(0, 0, pillarW, top + 12);
    ctx.fillRect(w - pillarW, 0, pillarW, top + 12);
    // the centre post: you sit in the captain's (left) seat, so it is off to the right, leaning
    // in towards the top as the windscreen slopes back
    const postW = Math.max(3, w * 0.012), px = this.postX(w, h), lean = w * 0.012;
    ctx.fillStyle = '#1b2027';
    ctx.beginPath();
    ctx.moveTo(px - postW / 2 + lean, frame * 0.5); ctx.lineTo(px + postW / 2 + lean, frame * 0.5);
    ctx.lineTo(px + postW * 0.7, top + 12); ctx.lineTo(px - postW * 0.7, top + 12);
    ctx.closePath(); ctx.fill();

    // side rails with a highlight
    ctx.strokeStyle = '#39424c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pillarW, frame * 1.0); ctx.lineTo(pillarW, top);
    ctx.moveTo(w - pillarW, frame * 1.0); ctx.lineTo(w - pillarW, top);
    ctx.stroke();

    // sun visors
    if (wide) {
      ctx.fillStyle = '#242a31';
      for (const s of [-1, 1]) {
        const vx = px + lean + s * postW * 2;
        ctx.beginPath();
        ctx.moveTo(vx, frame * 0.9);
        ctx.lineTo(vx + s * w * 0.16, frame * 1.0);
        ctx.lineTo(vx + s * w * 0.16, frame * 1.5);
        ctx.lineTo(vx, frame * 1.45);
        ctx.closePath(); ctx.fill();
      }
    }

    // window glass reflection
    const g = ctx.createLinearGradient(w * 0.1, 0, w * 0.55, top * 0.7);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.015)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(pillarW, frame, w - pillarW * 2, top - frame);

    // ---- vignette
    const vg = ctx.createRadialGradient(w / 2, top / 2, Math.min(w, top) * 0.32, w / 2, top / 2, Math.max(w, top) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, top + 14);

    // ---- lightning
    if (Scene3D.lightning > 0.02) {
      ctx.fillStyle = 'rgba(226,236,255,' + (0.5 * Scene3D.lightning) + ')';
      ctx.fillRect(0, 0, w, top + 14);
    }
    ctx.restore();
  },

  weather(ctx, w, h, top, fl, dt) {
    const env = fl.env;
    const inCloud = Scene3D.inCloud || 0;
    // cloud whiteout
    if (inCloud > 0.02) {
      ctx.fillStyle = 'rgba(226,232,240,' + clamp(inCloud * 0.92, 0, 0.95) + ')';
      ctx.fillRect(0, 0, w, top + 14);
      if (inCloud > 0.5) {
        ctx.fillStyle = 'rgba(200,210,222,' + (inCloud - 0.5) * 0.5 + ')';
        ctx.fillRect(0, 0, w, top + 14);
      }
    }
    // ice on the inside of the glass
    const ice = env.iceAmount || 0;
    if (ice > 0.05) {
      ctx.save();
      ctx.globalAlpha = clamp((ice - 0.05) * 0.9, 0, 0.55);
      ctx.fillStyle = '#dfe9f2';
      for (let i = 0; i < 5; i++) {
        const r = (w * 0.5) * (0.5 + i * 0.11);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let k = 0; k <= 12; k++) {
          const a = (k / 12) * Math.PI / 2;
          const rr = r * (1 + Math.sin(k * 2.3 + i) * 0.06);
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.8);
        }
        ctx.lineTo(0, 0);
        ctx.closePath(); ctx.fill();
        ctx.save();
        ctx.translate(w, 0); ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let k = 0; k <= 12; k++) {
          const a = (k / 12) * Math.PI / 2;
          const rr = r * (1 + Math.cos(k * 1.9 + i) * 0.06);
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.8);
        }
        ctx.lineTo(0, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
    this.precipitation(ctx, w, h, top, fl, dt);
  },

  // Rain and snow are particles in the air ahead of the cockpit, kept in world metres relative
  // to the eye: they drift with the wind and fall, and the aeroplane flies through them. Parked,
  // snow drifts gently down past the glass; at 200 km/h it streams out of the point you are
  // flying at, the nearest flakes as long streaks. Each one is drawn as the streak it makes in
  // a short exposure, through the cockpit camera.
  precipitation(ctx, w, h, top, fl, dt) {
    const fx = PRECIP_FX[fl.env.precip];
    const cam = Scene3D.camera;
    if (!fx || !cam) { this.parts = null; return; }
    dt = Math.min(dt, 0.1);
    cam.updateMatrixWorld();
    const e = cam.matrixWorld.elements;
    const Rx = e[0], Ry = e[1], Rz = e[2], Ux = e[4], Uy = e[5], Uz = e[6], Fx = -e[8], Fy = -e[9], Fz = -e[10];
    const tanV = Math.tan(cam.fov * DEG / 2), tanH = tanV * w / h, f = h / 2 / tanV;
    const near = fx.near, D = fx.depth;
    // the air past the aeroplane: the wind less our own velocity, and the fall
    // the camera's own velocity from its movement (the aeroplane's in the cockpit and the chase
    // views, nothing from the tower); a jump to another view is not a movement
    const p = cam.position, last = this.camLast || (this.camLast = p.clone());
    const cv = this.camVel || (this.camVel = { x: 0, y: 0, z: 0 });
    if (dt > 0) {
      const vx = (p.x - last.x) / dt, vy = (p.y - last.y) / dt, vz = (p.z - last.z) / dt;
      if (Math.hypot(vx, vy, vz) < 600) { cv.x = vx; cv.y = vy; cv.z = vz; }
      last.copy(p);
    }
    const wind = fl.windAt(p.y);
    const ux = wind.x - cv.x, uy = wind.y - cv.y - fx.fall, uz = wind.z - cv.z;
    const vx = ux * Rx + uy * Ry + uz * Rz, vy = ux * Ux + uy * Uy + uz * Uz, vz = ux * Fx + uy * Fy + uz * Fz;
    // new particles come in where the air comes from: mostly the far end at speed, the top
    // when parked, a side in a crosswind (each face weighted by the flow through it)
    const wFar = Math.max(0, -vz) * 4 * tanH * tanV, wTop = Math.max(0, -vy) * tanH, wBot = Math.max(0, vy) * tanH;
    const wLeft = Math.max(0, vx) * tanV, wRight = Math.max(0, -vx) * tanV, wAny = 0.05;
    const wSum = wFar + wTop + wBot + wLeft + wRight + wAny;
    // (`fill`: anywhere in the view, to fill it when the weather starts)
    const place = (p, fill) => {
      let face = 'any';
      if (!fill) {
        let k = Math.random() * wSum;
        face = (k -= wFar) < 0 ? 'far' : (k -= wTop) < 0 ? 'top' : (k -= wBot) < 0 ? 'bottom'
          : (k -= wLeft) < 0 ? 'left' : (k -= wRight) < 0 ? 'right' : 'any';
      }
      const lz = face === 'far' ? D * (0.9 + 0.1 * Math.random())
        : near + (D - near) * (face === 'any' ? Math.cbrt(Math.random()) : Math.sqrt(Math.random()));
      let lx = (Math.random() * 2 - 1) * lz * tanH, ly = (Math.random() * 2 - 1) * lz * tanV;
      if (face === 'top') ly = lz * tanV;
      else if (face === 'bottom') ly = -lz * tanV;
      else if (face === 'left') lx = -lz * tanH;
      else if (face === 'right') lx = lz * tanH;
      p.x = Rx * lx + Ux * ly + Fx * lz; p.y = Ry * lx + Uy * ly + Fy * lz; p.z = Rz * lx + Uz * ly + Fz * lz;
    };
    if (!this.parts || this.partsKind !== fl.env.precip) {
      this.partsKind = fl.env.precip;
      this.parts = [];
      for (let i = 0; i < fx.count; i++) {
        const p = { x: 0, y: 0, z: 0, s: 0.6 + Math.random() * 0.8, w: Math.random() * TAU };
        place(p, true);
        this.parts.push(p);
      }
    }
    // a few sizes, one path each
    const paths = [[], [], [], []];
    const sh = fx.shutter, cx = w / 2, cy = h / 2;
    for (const p of this.parts) {
      p.x += ux * dt; p.y += uy * dt; p.z += uz * dt;
      if (fx.flutter) {
        p.x += Math.sin(this.t * 1.7 + p.w) * fx.flutter * dt;
        p.z += Math.cos(this.t * 1.3 + p.w) * fx.flutter * dt;
      }
      let lx = p.x * Rx + p.y * Ry + p.z * Rz, ly = p.x * Ux + p.y * Uy + p.z * Uz, lz = p.x * Fx + p.y * Fy + p.z * Fz;
      if (lz < near || lz > D * 1.05 || Math.abs(lx) > lz * tanH + 0.3 || Math.abs(ly) > lz * tanV + 0.3) {
        place(p, false);
        lx = p.x * Rx + p.y * Ry + p.z * Rz; ly = p.x * Ux + p.y * Uy + p.z * Uz; lz = p.x * Fx + p.y * Fy + p.z * Fz;
      }
      const px = fx.size * p.s * f / lz;
      if (px < 0.3) continue;
      const sx = cx + lx / lz * f, sy = cy - ly / lz * f;
      if (sy < -20 || sy > top + 20) continue;
      // where it was a moment ago: the streak
      const tz = Math.max(0.3, lz - vz * sh);
      const tx = cx + (lx - vx * sh) / tz * f, ty = cy - (ly - vy * sh) / tz * f;
      const b = px < 0.8 ? 0 : px < 1.5 ? 1 : px < 2.6 ? 2 : 3;
      paths[b].push(tx, ty, sx + 0.01, sy);
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, top + 14); ctx.clip();
    ctx.lineCap = 'round';
    for (let b = 0; b < 4; b++) {
      const seg = paths[b];
      if (!seg.length) continue;
      ctx.strokeStyle = fx.color + (fx.alpha * [0.45, 0.65, 0.85, 0.95][b]) + ')';
      ctx.lineWidth = fx.width[b];
      ctx.beginPath();
      for (let i = 0; i < seg.length; i += 4) { ctx.moveTo(seg[i], seg[i + 1]); ctx.lineTo(seg[i + 2], seg[i + 3]); }
      ctx.stroke();
    }
    ctx.restore();
  }
};

// how rain and snow look (visual only): how many particles, how deep the cloud of them goes in
// front of the eye and where the glass is (m), how fast they fall (m/s), how big they are (m),
// the exposure their streaks show (s), a little sideways flutter for snow (m/s), the colour,
// and the line width of each size class (px)
const PRECIP_FX = {
  snow: { count: 480, depth: 16, near: 0.9, fall: 1.1, size: 0.016, shutter: 0.016, flutter: 0.35,
    color: 'rgba(240,246,252,', alpha: 0.9, width: [0.8, 1.4, 2.2, 3.4] },
  rain: { count: 420, depth: 18, near: 0.9, fall: 8.5, size: 0.014, shutter: 0.035, flutter: 0,
    color: 'rgba(206,224,240,', alpha: 0.6, width: [0.6, 0.9, 1.2, 1.6] }
};
