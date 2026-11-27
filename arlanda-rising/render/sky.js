'use strict';

// Arlanda Rising — light and weather over the map: the dark by the real sun at 59.65° N (blue winter afternoons,
// white nights at midsummer), the warm light of dawn and dusk, fog, falling snow, and then the lamps that the
// other files collected (runway and approach lights, sodium floodlights on the apron, lit windows, the aircraft's
// navigation lights and beacons, the vehicles' amber beacons) glowing through the dark. Free Play has one
// late-spring sun every month (sim/calendar.js) and a softer veil. Drawn last by render/map.js, before the labels.

const Sky = (() => {
  // 0 in daylight, 1 in the deep night, from the sun's elevation
  function darkness(day, min) { return clamp((2 - Calendar.sunElevation(day, min)) / 10, 0, 1); }

  function draw(c, sc) {
    Iso.screen(c);
    const W = Cam.W, H = Cam.H;
    const el = sc.sun;
    // dawn and dusk
    if (el > -6 && el < 9) {
      c.fillStyle = 'rgba(255,150,70,' + (0.13 * (1 - Math.abs(el - 1.5) / 7.5)) + ')';
      c.fillRect(0, 0, W, H);
    }
    // the night's veil (Free Play's softer, sc.veil ≤ FREE_DARK_MAX: render/map.js)
    if (sc.veil > 0) {
      c.fillStyle = 'rgba(8,16,42,' + (sc.veil * 0.7) + ')';
      c.fillRect(0, 0, W, H);
    }
    // fog
    if (sc.vis < 3000) {
      c.fillStyle = 'rgba(222,228,234,' + ((1 - sc.vis / 3000) * 0.62) + ')';
      c.fillRect(0, 0, W, H);
    }
    lamps(c, sc);
    // falling snow, in screen space
    if (sc.snowfall > 0) {
      const n = Math.min(260, Math.round(sc.snowfall * 45));
      c.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < n; i++) {
        const h = hashOf('flake', i);
        const sp = 40 + (h % 60);
        const x = ((h >> 8) % 1000) / 1000 * W + Math.sin(sc.anim * 1.3 + i) * 12;
        const y = (((h >> 4) % 1000) / 1000 * H + sc.anim * sp) % H;
        const r = 0.8 + (h % 3) * 0.5;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      }
    }
  }

  function lamps(c, sc) {
    if (!sc.lights.length || sc.dark < 0.08) return;
    const k = sc.dark, zs = clamp(Cam.zoom, 0.25, 3);
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const L of sc.lights) {
      if (L.blink === 1 && (sc.anim * 1.1 + L.x * 0.01) % 1 > 0.18) continue;
      const s = Cam.toScreen(L.x, L.y, L.z);
      if (s[0] < -150 || s[0] > Cam.W + 150 || s[1] < -150 || s[1] > Cam.H + 150) continue;
      let a = k;
      if (L.blink === 2) a *= 0.4 + 0.6 * Math.max(0, Math.sin(sc.anim * 7 + L.x));
      if (L.flood) {
        const r = L.r * Cam.zoom * ISO_K;
        const g = c.createRadialGradient(s[0], s[1] + r * 0.2, 0, s[0], s[1] + r * 0.2, r);
        g.addColorStop(0, 'rgba(' + L.col + ',' + (0.35 * a) + ')'); g.addColorStop(1, 'rgba(' + L.col + ',0)');
        c.fillStyle = g;
        c.beginPath(); c.ellipse(s[0], s[1] + r * 0.2, r, r * 0.55, 0, 0, Math.PI * 2); c.fill();
        continue;
      }
      const r = Math.max(1.2, L.r * zs);
      const g = c.createRadialGradient(s[0], s[1], 0, s[0], s[1], r * 2.2);
      g.addColorStop(0, 'rgba(' + L.col + ',' + a + ')');
      g.addColorStop(0.3, 'rgba(' + L.col + ',' + (a * 0.45) + ')');
      g.addColorStop(1, 'rgba(' + L.col + ',0)');
      c.fillStyle = g;
      c.fillRect(s[0] - r * 2.2, s[1] - r * 2.2, r * 4.4, r * 4.4);
    }
    c.restore();
  }

  return { draw, darkness };
})();
