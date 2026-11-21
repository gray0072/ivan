'use strict';

// Arlanda Rising — a frame of the map: the scene read from S (the season, the light, what is built and how far the
// projects are, the weather), then the land, the airport's flat parts, the standing things back to front (trees and
// houses, buildings, aircraft, vehicles), the sky and the lamps, and on top the flights' labels and turnaround bars.
// Also what a tap on the map hit (a flight or a stand). Used by game.js every frame, for the game view, the Office
// and the start screen's slow flyover.

const MapView = (() => {
  const cv = document.getElementById('map');
  const c = cv.getContext('2d', { alpha: false });
  let anim = 0;
  const view = { standMark: null, selected: null };

  function resize() {
    Cam.W = window.innerWidth;
    Cam.H = window.innerHeight;
    Cam.dpr = Math.min(window.devicePixelRatio || 1, Settings.quality() === 'low' ? 1 : 2);
    cv.width = Math.round(Cam.W * Cam.dpr);
    cv.height = Math.round(Cam.H * Cam.dpr);
    cv.style.width = Cam.W + 'px';
    cv.style.height = Cam.H + 'px';
  }

  function season(month, temp) {
    if (month === 12 || month <= 2) return 'winter';
    if (month === 3) return temp !== null && temp > 4 ? 'spring' : 'winter';
    if (month === 11) return temp !== null && temp <= 0 ? 'winter' : 'autumn';
    if (month === 4) return temp !== null && temp <= 0 ? 'winter' : 'spring';
    if (month === 10) return 'autumn';
    return 'summer';
  }

  // what the map shows, read from S
  function scene() {
    const a = S.airport, d = Calendar.date(S.day);
    const w = S.ops ? Weather.now() : null;
    const items = {};
    for (const it of a.items) items[it.kind] = (items[it.kind] || 0) + 1;
    const p = (pid, sid) => { const pr = a.projects[pid]; return pr && pr.stages[sid] ? pr.stages[sid].p : 0; };
    const ready = !!a.siteReady;
    const roadP = ready ? 1 : p('site', 'road');
    const t = S.ops ? S.clock : 12 * 60;
    const sun = Calendar.sunElevation(S.day, t);
    return {
      season: season(d.m, w ? w.temp : null), year: d.y, t, anim, sun,
      dark: Sky.darkness(S.day, t), vis: w ? w.vis : 10000, snowfall: w ? w.snow : 0,
      siteDone: ready, strip: ready ? 1 : p('site', 'strip'), drain: ready ? 1 : p('site', 'drain'),
      apronClear: ready ? 1 : p('site', 'apron'), road: roadP, roadPts: polyPart(LAYOUT.road, roadP),
      siteWork: !!a.projects.site && !items.terminal,
      runway: a.runways[0] || null, runway2: a.runways.find((r) => r.id === 'r2') || null, runway3: a.runways.find((r) => r.id === 'r3') || null,
      apron: a.stands.length > 0, items, p,
      planning: !!S.plan, lights: [], standMark: view.standMark,
      ...clearings(a, items, ready || p('site', 'apron') >= 1)
    };
  }

  // the ground cleared of trees round what is built outside the site's first clearing: a remote stand's pad and its
  // way to the apron, the plots of the buildings in data/layout.js (car parks, cafés…), the link from the taxiway
  const PAD = 14;   // m of open ground round a plot
  function clearings(a, items, apronDone) {
    const pads = [], ways = [];
    if (apronDone) { const T = LAYOUT.taxi; ways.push({ pts: [Ground.rwPoint(T.apronLink.s, T.offset), T.apronLink.to], d: 34 }); }
    const A = LAYOUT.apron1;
    a.stands.forEach((st, i) => {
      if (st.at && !st.pad) return;
      const q = AirportArt.standPos(i);
      if (q.x >= A.x0 && q.x <= A.x1 && q.y >= A.y0 && q.y <= A.y1) return;
      pads.push([q.x - 80 - PAD, q.y - 34 - PAD, q.x + 8 + PAD, q.y + 34 + PAD]);
      if (!st.pad) ways.push({ pts: AirportArt.remoteWay(i), d: 10 + PAD });
    });
    for (const k in items) {
      const L = LAYOUT[k];
      if (L && L.box) pads.push([L.box[0] - PAD, L.box[1] - PAD, L.box[2] + PAD, L.box[3] + PAD]);
    }
    return { pads, ways };
  }

  function draw(realDt) {
    anim += realDt || 0;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = PAL.sky;
    c.fillRect(0, 0, cv.width, cv.height);
    if (!S) return;
    const sc = scene();
    Ground.draw(c, sc);
    AirportArt.flat(c, sc);
    Ground.drawStanding(c, sc);
    const list = [];
    AirportArt.objects(sc, list);
    Traffic.objects(sc, list);
    list.sort((x, y) => x.d - y.d);
    Iso.units(c);
    for (const o of list) o.draw(c);
    if (view.selected) ring(view.selected);
    Sky.draw(c, sc);
    Traffic.overlay(c, sc);
    Ground.labels(c);
  }

  // a ring round the selected flight
  function ring(f) {
    const p = Traffic.pos(f, S.clock);
    if (!p) return;
    const u = P(p.x, p.y, p.z);
    c.strokeStyle = '#ffd54f'; c.lineWidth = 2 / Cam.zoom;
    c.beginPath(); c.ellipse(u[0], u[1], AIRCRAFT[f.type].span * 0.6 * ISO_K, AIRCRAFT[f.type].span * 0.3 * ISO_K, 0, 0, Math.PI * 2); c.stroke();
  }

  // what is under a screen point: { flight } or { stand } or null
  function hit(sx, sy) {
    if (!S || !S.airport) return null;
    const f = S.ops ? Traffic.hit(sx, sy, 26) : null;
    if (f) return { flight: f };
    const [x, y] = Cam.toWorld(sx, sy);
    const pad = Math.max(0, 14 / Cam.zoom);
    for (let i = 0; i < S.airport.stands.length; i++) {
      const p = AirportArt.standPos(i);
      if (x > p.x - 74 - pad && x < p.x + 4 + pad && y > p.y - 28 - pad && y < p.y + 28 + pad) return { stand: S.airport.stands[i] };
    }
    return null;
  }

  // the camera to the apron (ops), the project being built (plan) or the whole field
  function frame(kind) {
    const z = Math.min(ZOOM_OPS, Math.max(0.35, Math.min(Cam.W, Cam.H * 2) / 900));
    if (kind === 'ops') Cam.centerOn(640, 1180, z);
    else if (kind === 'site') Cam.centerOn(500, 1400, Math.max(ZOOM_MIN, Math.min(Cam.W / 3600, Cam.H / 1900)));
    else if (kind === 'whole') Cam.centerOn(700, 900, Math.max(ZOOM_MIN, Math.min(Cam.W / 5200, Cam.H / 2600)));
    else Cam.centerOn(840, 1250, z * 1.3);
    // the plan panel covers the right side of a wide screen: the place being built moves left
    if (kind !== 'ops' && kind !== 'whole' && Cam.W > 600) { Cam.x += 170 / Cam.zoom; Cam.clamp(); }
  }

  window.addEventListener('resize', resize);
  resize();
  return { draw, hit, frame, resize, view, canvas: cv };
})();
