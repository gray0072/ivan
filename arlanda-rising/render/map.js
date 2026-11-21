'use strict';

// Arlanda Rising — a frame of the map: the scene read from S (the season, the light, what is built and how far the
// projects are, the weather), then the land, the airport's flat parts, the standing things back to front (trees and
// houses, buildings, aircraft, vehicles), the sky and the lamps, and on top the flights' labels and turnaround bars.
// The airside fence round what is built (render/fence.js) lies over the flat parts, under the trees. Also what a tap
// on the map hit (a flight, a stand, a fuel truck or a plough, a building). With the roofs off (view.cut, the 🏠 button) the finished buildings are drawn cut away with their insides (render/interiors.js); the
// building or vehicle whose card is open is ringed in yellow. Used by game.js every frame, for the game view, the
// Office and the start screen's slow flyover.

const MapView = (() => {
  const cv = document.getElementById('map');
  const c = cv.getContext('2d', { alpha: false });
  let anim = 0;
  // standMark: the stands' colours while one is being chosen; selected: the flight whose card is open; site: the key
  // of the building whose card is open (and partOf, its parts to the card's key), vehicle: { kind, i } of the vehicle's;
  // cut: the roofs off
  const view = { standMark: null, selected: null, site: null, partOf: (k) => k, vehicle: null, cut: false };

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
    // the road in stops at the baggage hall's door once it stands in front of the first terminal (data/layout.js roadEnd);
    // the landside road along the terminals from the international terminal's year
    const roadPts = polyPart(LAYOUT.road, roadP);
    if (roadP >= 1 && (items.bagHall || p('bagHall', 'hall') > 0)) roadPts[roadPts.length - 1] = [LAYOUT.roadEnd, roadPts[roadPts.length - 1][1]];
    const landside = items.intlTerminal || p('intlTerminal', 'frame') > 0;
    const t = S.ops ? Sim.clockNow() : 12 * 60;   // between the sim's steps, so that what moves moves smoothly
    const sun = Calendar.sunElevation(S.day, t);
    return {
      season: season(d.m, w ? w.temp : null), year: d.y, t, anim, sun,
      dark: Sky.darkness(S.day, t), vis: w ? w.vis : 10000, snowfall: w ? w.snow : 0,
      siteDone: ready, strip: ready ? 1 : p('site', 'strip'), drain: ready ? 1 : p('site', 'drain'),
      apronClear: ready ? 1 : p('site', 'apron'), road: roadP, roadPts, landsidePts: landside ? LAYOUT.landside : null,
      siteWork: !!a.projects.site && !items.terminal,
      runway: a.runways[0] || null, runway2: a.runways.find((r) => r.id === 'r2') || null, runway3: a.runways.find((r) => r.id === 'r3') || null,
      apron: a.stands.length > 0, items, p,
      planning: !!S.plan, lights: [], standMark: view.standMark, cut: view.cut,
      fence: ready ? Fence.get(fenceSpec(a, items, p)) : null,
      ...clearings(a, items, ready || p('site', 'apron') >= 1, p)
    };
  }

  // what the airside fence goes round (render/fence.js): what stands or is being built — the runways, the taxiways, the
  // aprons, the remote stands, the de-icing pads, the buildings on the terminal line and the piers
  // the buildings on the terminal line built by a project of their own name: the stage that raises them
  const HALLS = { domTerminal: 'hall', bagHall: 'hall', terminal2: 'hall', sorterHall: 'hall', cargoCity: 'halls', computerRoom: 'room' };
  function fenceSpec(a, items, p) {
    const aprons = {};
    for (const [key, pid, sid, item] of AirportArt.APRONS) aprons[key] = !!(item && items[item]) || p(pid, sid) > 0;
    const sat = a.pierDesign === 'satellite';
    const on = (k) => {
      switch (k) {
        case 'runway1': return true;
        case 'apron1': return a.stands.length > 0;
        case 'cargoApron': return !!items.cargoStand;
        case 'satApron': return sat && p('pier2040', 'gates') > 0;
        case 'runway2': return p('runway2', 'strip') > 0 || a.runways.some((r) => r.id === 'r2');
        case 'taxi2': return p('apron2', 'pave') >= 1;
        case 'runway3': return !!items.runway3 || p('runway3', 'strip') > 0;
        case 'taxi3': return !!items.bridges || p('bridges', 'taxi') > 0;
        case 'deice0': return !!items.deicePad || p('deicePads', 'south') > 0;
        case 'deice1': return !!items.deicePad || p('deicePads', 'r3') > 0;
        case 'terminal1': return !!items.terminal || p('terminal1', 'hall') > 0;
        case 'intlTerminal': return !!items.intlTerminal || p('intlTerminal', 'frame') > 0;
        case 'pierF': return !!items.pierF || p('pierF', 'gates') > 0;
        case 'pier2040': return !!items.pier2040 || p('pier2040', 'hall') > 0;
        case 'pierArm': return !!items.pierArm || p('pier2040', 'arm') > 0;
        case 'fuelYard': return p('apron2', 'pave') > 0;
        default: return k in aprons ? aprons[k] : !!items[k] || (k in HALLS && p(k, HALLS[k]) > 0);
      }
    };
    const pads = [], ways = [], A = LAYOUT.apron1;
    a.stands.forEach((st, i) => {
      if (st.at && !st.pad) return;
      const q = AirportArt.standPos(i);
      if (q.x >= A.x0 && q.x <= A.x1 && q.y >= A.y0 && q.y <= A.y1) return;
      pads.push(AirportArt.standBox(q, 74, 8, 28));
      if (!st.pad) ways.push(AirportArt.remoteWay(i));
    });
    return Fence.parts(on, pads, ways, a.pierDesign);
  }

  // the ground cleared of trees round what is built outside the site's first clearing: a remote stand's pad and its
  // way to the apron, the plots of the buildings in data/layout.js (car parks, cafés…), the link from the taxiway, the
  // service ground of the ploughs, the fire station and the fuel yard;
  // from the jet age on the later aprons, runways 2 and 3 with their strips, taxiways 2 and 3, the de-icing pads,
  // Cargo City's yard and the solar parks, each from the moment its work starts
  const PAD = 14;   // m of open ground round a plot
  const STRIP_HALF = 120;   // m: half the cleared strip of runways 2 and 3, as render/airport.js draws it
  function clearings(a, items, apronDone, p) {
    const pads = [], ways = [];
    if (apronDone) {
      const T = LAYOUT.taxi, a = Ground.rwPoint(T.apronLink.s, T.offset), b = Ground.rwPoint(T.apronOut.s, T.offset);
      for (const [k, p] of [[T.apronLink, a], [T.apronOut, b]]) ways.push({ pts: [p, k.to], d: 34 });
      // and the patch of forest the two links would leave between them
      pads.push([Math.min(a[0], b[0]), T.apronLink.to[1], T.apronOut.to[0], T.apronOut.to[1]]);
    }
    const A = LAYOUT.apron1;
    a.stands.forEach((st, i) => {
      if (st.at && !st.pad) return;
      const q = AirportArt.standPos(i);
      if (q.x >= A.x0 && q.x <= A.x1 && q.y >= A.y0 && q.y <= A.y1) return;
      pads.push(AirportArt.standBox(q, 80 + PAD, 8 + PAD, 34 + PAD));
      if (!st.pad) ways.push({ pts: AirportArt.remoteWay(i), d: 10 + PAD });
    });
    const plot = (b) => pads.push([b[0] - PAD, b[1] - PAD, b[2] + PAD, b[3] + PAD]);
    // the service ground west of the aprons, from the strip's clearing to the apron: round the ploughs' rows and the
    // crash tenders' bays, and round the fire station and the fuel trucks' yard once the jet apron is begun
    if (items.plough || items.fireStation) pads.push(LAYOUT.clear.ploughs);
    if (p('apron2', 'pave') > 0) pads.push(LAYOUT.clear.yard);
    const started = (pid) => { const pr = a.projects[pid]; return !!pr && Object.keys(pr.stages).some((s) => pr.stages[s].p > 0); };
    for (const k in items) {
      const L = LAYOUT[k];
      if (L && L.box) plot(L.box);
    }
    for (const pid in a.projects) {
      const L = LAYOUT[pid];
      if (L && L.box && !items[pid] && started(pid)) plot(L.box);
    }
    for (const [key, pid, sid, item] of AirportArt.APRONS) {
      const B = LAYOUT[key];
      if ((item && items[item]) || p(pid, sid) > 0) plot([B.x0, B.y0, B.x1, B.y1]);
    }
    const R2 = LAYOUT.runway2, s2 = p('runway2', 'strip');
    if (s2 > 0) ways.push({ pts: [R2.from, [R2.from[0] + (R2.to[0] - R2.from[0]) * s2, R2.from[1] + (R2.to[1] - R2.from[1]) * s2]], d: STRIP_HALF + PAD });
    const R3 = LAYOUT.runway3, s3 = items.runway3 ? 1 : p('runway3', 'strip');
    if (s3 > 0) ways.push({ pts: [R3.from, R3.to], d: STRIP_HALF * s3 + PAD });
    if (p('apron2', 'pave') >= 1) ways.push({ pts: LAYOUT.taxi2.slice(0, a.runways.some((r) => r.id === 'r2') ? LAYOUT.taxi2.length : 2), d: LAYOUT.taxi.w / 2 + PAD });
    const t3 = items.bridges ? 1 : p('bridges', 'taxi');
    if (t3 > 0) ways.push({ pts: polyPart(LAYOUT.taxi3, t3), d: LAYOUT.taxi.w / 2 + PAD });
    LAYOUT.deicePads.forEach((b, i) => { if (items.deicePad || p('deicePads', i === 0 ? 'south' : 'r3') > 0) plot(b); });
    if (items.cargoCity || p('cargoCity', 'halls') > 0) plot(LAYOUT.cargoCity.yard);
    if (items.cargoStand) { const b = LAYOUT.cargoApron; plot([b.x0, b.y0, b.x1, b.y1]); }
    for (let i = 0; i < Math.min(2, items.solar || 0); i++) plot(LAYOUT.solar[i]);
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
    Fence.draw(c, sc);
    Ground.drawStanding(c, sc);
    const list = [];
    AirportArt.objects(sc, list);
    Traffic.objects(sc, list);
    list.sort((x, y) => x.d - y.d);
    Iso.units(c);
    for (const o of list) o.draw(c);
    if (view.selected) ring(view.selected);
    Sky.draw(c, sc);
    if (view.site) AirportArt.ring(c, view.site, view.partOf);
    if (view.vehicle) Traffic.ring(c, view.vehicle);
    Traffic.overlay(c, sc);
    Ground.labels(c);
  }

  // a ring round the selected flight
  function ring(f) {
    const p = Traffic.pos(f, Sim.clockNow());
    if (!p) return;
    const u = P(p.x, p.y, p.z);
    c.strokeStyle = '#ffd54f'; c.lineWidth = 2 / Cam.zoom;
    c.beginPath(); c.ellipse(u[0], u[1], AIRCRAFT[f.type].span * 0.6 * ISO_K, AIRCRAFT[f.type].span * 0.3 * ISO_K, 0, 0, Math.PI * 2); c.stroke();
  }

  // what is under a screen point: { flight }, { stand }, { vehicle: { kind, i } }, { site: { key, box, h } } or null;
  // `stands` first: a stand is being chosen for an aircraft, so a stand wins over a building or a vehicle
  function hit(sx, sy, stands) {
    if (!S || !S.airport) return null;
    const f = S.ops ? Traffic.hit(sx, sy, 26) : null;
    if (f) return { flight: f };
    const st = standAt(sx, sy);
    if (st && stands) return { stand: st };
    const v = Traffic.hitVehicle(sx, sy, 16);
    if (v) return { vehicle: v };
    const s = AirportArt.hitSite(sx, sy);
    if (s) return { site: s };
    return st ? { stand: st } : null;
  }
  function standAt(sx, sy) {
    const [x, y] = Cam.toWorld(sx, sy);
    const pad = Math.max(0, 14 / Cam.zoom);
    for (let i = 0; i < S.airport.stands.length; i++) {
      const p = AirportArt.standPos(i);
      const b = AirportArt.standBox(p, 74 + pad, 4 + pad, 28 + pad);
      if (x > b[0] && x < b[2] && y > b[1] && y < b[3]) return S.airport.stands[i];
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
