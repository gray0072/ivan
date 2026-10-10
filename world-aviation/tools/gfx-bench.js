'use strict';

// ============================================================
// World Aviation — what the 3D picture costs, by layer, at both ends of a flight by day and
// by night. A steps file for the repo's headless Chrome driver:
//
//   node --experimental-websocket tools/cdp.js world-aviation/tools/gfx-bench.js [out-dir] --limit 600
//
// Options through the environment (all optional):
//   GFX_SCENES   which scenes, comma-separated (default: all of SCENES below)
//   GFX_CONTRACT the index of the contract on a fresh career's board (default 0)
//   GFX_FROM, GFX_TO  fly that contract from / to another airport instead (e.g. GFX_TO=CPH)
//   GFX_QUALITY  the preset (default medium, as a phone starts)
//   GFX_N        renders per time measurement (default 4)
//   GFX_MS       1: also time each layer (useful only where WebGL is slow: a software renderer)
//
// A phone held sideways (844 x 390 CSS px, 2x pixels, touch) on the given preset. Each scene
// puts the aeroplane somewhere (Game.startTour builds the flight's world there, at the hour
// asked, then the game loop is stopped), points the camera, and measures with
// tools/gfx-probe.js: the frame's draw calls, triangles and points, the fill (fragments shaded
// per pixel), and for each layer hidden in turn what that saves; plus the frame's time at
// other pixel ratios and the CPU of one Scene3D.update and one Game.draw2d. A screenshot of
// each scene goes to out-dir.
//
// The draw calls, the triangles, the points and the fill are what the phone has to do too;
// the milliseconds are this machine's GPU's (on a desktop graphics card far below a phone's),
// so compare them only with each other.
// ============================================================

const fs = require('fs');
const path = require('path');

// end: the departure's or the arrival's airport; hour: local solar time; at: where the aeroplane
// is (gate: at its stand; apron: on the apron lane before the first stand, along the row of
// stands, the taxi light on; final: nm out on the glide path, gear down, landing lights on;
// rollout: 300 m down the runway); view: the camera (cockpit unless said).
// The scene "route" (only when asked for in GFX_SCENES) is no picture but a leak check: the
// aeroplane is carried along the whole route at cruise height in 2 km steps, rendered at every
// step (the airports on the way built and dropped as in a flight), to the arrival's gate and back
// to the departure's, and the GPU's geometries, textures and shader programs, the scene's
// objects and the JS heap are printed on the way.
const SCENES = {
  'dep-day-gate': { end: 'dep', hour: 13, at: 'gate' },
  'dep-night-gate': { end: 'dep', hour: 1, at: 'gate' },
  'dep-night-apron': { end: 'dep', hour: 1, at: 'apron' },
  'arr-day-apron': { end: 'arr', hour: 13, at: 'apron' },
  'arr-night-apron': { end: 'arr', hour: 1, at: 'apron' },
  'arr-night-apron-chase': { end: 'arr', hour: 1, at: 'apron', view: 'chase' },
  'arr-day-gate': { end: 'arr', hour: 13, at: 'gate' },
  'arr-night-gate': { end: 'arr', hour: 1, at: 'gate' },
  'arr-day-final2': { end: 'arr', hour: 13, at: 'final', nm: 2 },
  'arr-night-final2': { end: 'arr', hour: 1, at: 'final', nm: 2 },
  'arr-night-final05': { end: 'arr', hour: 1, at: 'final', nm: 0.5 },
  'arr-night-rollout': { end: 'arr', hour: 1, at: 'rollout' }
};

module.exports = async ({ page, phone, ev, shot, log }) => {
  const names = (process.env.GFX_SCENES || Object.keys(SCENES).join(',')).split(',').map((s) => s.trim()).filter(Boolean);
  const idx = +(process.env.GFX_CONTRACT || 0), quality = process.env.GFX_QUALITY || 'medium', N = +(process.env.GFX_N || 4);
  const timeLayers = process.env.GFX_MS === '1';

  await phone(844, 390);
  await page('world-aviation', 4000);
  log(await ev(fs.readFileSync(path.join(__dirname, 'gfx-probe.js'), 'utf8') + '\n;"probe in"'));
  const c = await ev(`(() => {
    I18N.set('en');
    Career.new({ pilot: 'Test' });
    Career.settings.quality = '${quality}';
    Game.quality = '${quality}';
    Scene3D.setQuality('${quality}');
    const c = Career.data.contracts[${idx}];
    const from = '${process.env.GFX_FROM || ''}', to = '${process.env.GFX_TO || ''}';
    if (from) c.fromId = from;
    if (to) c.toId = to;
    if (from || to) Object.assign(c, World.pickGates(World.byId[c.fromId], World.byId[c.toId], makeRng(hashStr(c.id)), World.zoneFor(c)));
    const gl = Scene3D.renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return { gpu: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?', contract: c.id, from: c.fromId, to: c.toId, aircraft: Career.aircraft().id };
  })()`);
  log(JSON.stringify(c) + ' · quality ' + quality);

  for (const name of names) {
    if (name === 'route') { await route(ev, log); continue; }
    const s = SCENES[name];
    if (!s) { log('no scene ' + name); continue; }
    const t0 = Date.now();
    const setup = await ev(`(() => {
      const c = Career.data.contracts[${idx}];
      Game.startTour(c, '${s.end}');
      Game.stopCine();
      Game.mode = 'bench';                          // the loop leaves the scene alone
      document.body.classList.remove('touring');
      el('cine').hidden = true;
      const fl = Game.flight, st = fl.st, sys = Game.systems, env = fl.env;
      const a = World.here['${s.end === 'dep' ? c.from : c.to}'];
      env.hour0 = ${s.hour}; fl.elapsed = 0;
      if (fl.world) fl.world.lon = Theatre.toGeo(st.pos.x, st.pos.z).lon;
      const at = '${s.at}';
      const go = (p, y, onGround, spd, phase) => {
        st.pos.x = p.x; st.pos.z = p.z; st.pos.y = y;
        st.hdg = a.hdg; st.pitch = onGround ? 0 : 0.03; st.roll = 0;
        st.vel.x = hdgX(a.hdg) * spd; st.vel.z = hdgZ(a.hdg) * spd; st.vel.y = 0;
        st.onGround = onGround; st.wasAirborne = phase !== 'TAXI_OUT'; st.parkingBrake = false;
        st.gear = st.gearTarget = 1;
        for (const e of sys.engines) { e.running = true; e.startPhase = 'idle'; e.n1 = 0.6; e.n2 = 0.8; }
        fl.phase = phase;
        st.axes = null;
      };
      if (at === 'final') {
        const dist = ${s.nm || 2} * NM;
        go(World.at(a, -a.half - dist, 0), a.elev + 15 + dist * Math.tan(SIM.GLIDESLOPE_DEG * DEG) + st.gearH, false, fl.vRef() * KTS, 'APPROACH');
      } else if (at === 'rollout') {
        go(World.at(a, -a.half + 300, 0), a.elev + st.gearH, true, fl.vRef() * KTS * 0.8, 'ROLLOUT');
      } else if (at === 'apron') {
        const ls = a.gates.map((g) => World.local(a, g.standX, g.standZ));
        const side = Math.sign(ls[0].across) || 1;
        go(World.at(a, Math.min(...ls.map((q) => q.t)) - 120, side * LAYOUT.APRON_LANE), a.elev + st.gearH, true, 8, 'EXIT');
      }
      const view = '${s.view || 'cockpit'}';
      Game.camMode = view;
      Scene3D.camMode = view; Scene3D.cine = null; Scene3D.panelHidden = false; Scene3D.pipRect = null;
      Scene3D.warmup(fl);
      for (let i = 0; i < 3; i++) Scene3D.update(1 / 30, fl, sys);
      GfxProbe.retag();
      return { airport: a.id, terminal: a.terminal, gates: a.gates.length,
        built: Array.from(Scene3D.airports3D.values()).map((r) => r.a.id).join(' '),
        dark: +Scene3D.dark.toFixed(2), pool: Scene3D.landingPool.visible,
        canvas: Scene3D.renderer.domElement.width + 'x' + Scene3D.renderer.domElement.height + ' @' + Scene3D.renderer.getPixelRatio() };
    })()`);
    if (typeof setup === 'string') { log(name + ': ' + setup); continue; }
    await ev(`Scene3D.render(); Game.draw2d(1 / 30); 0`);
    await shot(name);
    const m = await ev(`(() => {
      const fl = Game.flight, sys = Game.systems, N = ${N};
      for (let i = 0; i < 3; i++) GfxProbe.measure(N);          // warm up: shaders, textures, the driver
      const base = Object.assign(GfxProbe.measure(N * 2), { fill: GfxProbe.overdraw() });
      const ratios = [1, 1.25, 2].map((d) => Object.assign({ dpr: d }, GfxProbe.atRatio(d, N)));
      const layers = [];
      for (const name of GfxProbe.layers()) {
        const w = GfxProbe.without(name, 1), f = GfxProbe.overdrawWithout(name);
        const l = { name, fill: f === null ? null : +(base.fill - f).toFixed(3), calls: base.calls - w.calls, tris: base.tris - w.tris, points: base.points - w.points };
        // (each layer against a base measured just before it: the timing drifts)
        if (${timeLayers}) { const b = GfxProbe.measure(N); l.ms = +(b.ms - GfxProbe.without(name, N).ms).toFixed(1); }
        layers.push(l);
      }
      layers.sort((x, y) => (y.fill || 0) - (x.fill || 0) || y.calls - x.calls);
      const update = GfxProbe.cpu(() => Scene3D.update(1 / 30, fl, sys), 5);
      const draw2d = GfxProbe.cpu(() => Game.draw2d(1 / 30), 5);
      return { base, ratios, layers, update, draw2d };
    })()`);
    if (typeof m === 'string') { log(name + ': ' + m); continue; }
    log('');
    log('== ' + name + ' · ' + setup.airport + ' (' + setup.terminal + ', ' + setup.gates + ' gates) · dark ' + setup.dark +
      (setup.pool ? ' · landing light pool' : '') + ' · canvas ' + setup.canvas + ' · built: ' + setup.built + ' · ' + Math.round((Date.now() - t0) / 1000) + ' s');
    log('   ' + m.base.calls + ' calls · ' + m.base.tris + ' tris · ' + m.base.points + ' points · fill ' + m.base.fill + ' fragments/px · ' +
      m.base.ms + ' ms · update ' + m.update + ' ms · draw2d ' + m.draw2d + ' ms');
    log('   pixel ratio: ' + m.ratios.map((x) => x.dpr + ' → ' + x.ms + ' ms (' + x.px + ')').join(' · '));
    log('   ' + 'hidden'.padEnd(16) + '   fill/px  calls      tris  points' + (timeLayers ? '      ms' : ''));
    for (const l of m.layers) {
      if (!l.calls && !l.tris && !l.points && !(Math.abs(l.fill) >= 0.005)) continue;
      log('   ' + l.name.padEnd(16) + String(l.fill).padStart(10) + String(l.calls).padStart(7) + String(l.tris).padStart(10) +
        String(l.points).padStart(8) + (timeLayers ? String(l.ms).padStart(8) : ''));
    }
  }
};

// the leak check: departure gate -> along the route -> arrival gate -> back to the departure gate
async function route(ev, log) {
  log('');
  log('== route (leak check)');
  const start = await ev(`(() => {
    const c = Career.data.contracts[${+(process.env.GFX_CONTRACT || 0)}];
    Game.startTour(c, 'dep');
    Game.stopCine();
    Game.mode = 'bench';
    document.body.classList.remove('touring');
    el('cine').hidden = true;
    Scene3D.camMode = Game.camMode = 'cockpit'; Scene3D.cine = null; Scene3D.pipRect = null;
    const fl = Game.flight, A = World.here[c.fromId], B = World.here[c.toId];
    window.__route = { fl, sys: Game.systems, A, B, gA: { x: fl.st.pos.x, z: fl.st.pos.z, y: fl.st.pos.y, hdg: fl.st.hdg } };
    return Math.round(Math.hypot(B.x - A.x, B.z - A.z) / 1000) + ' km (world)';
  })()`);
  log('   ' + start);
  const snap = (label) => ev(`(() => {
    const r = Scene3D.renderer, mem = r.info.memory;
    let objs = 0; Scene3D.scene.traverse(() => objs++);
    const heap = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB heap' : '';
    return '${label}'.padEnd(18) + mem.geometries + ' geometries · ' + mem.textures + ' textures · ' + r.info.programs.length + ' programs · ' +
      objs + ' objects · airports ' + Array.from(Scene3D.airports3D.keys()).join(' ') + ' · ' + heap;
  })()`);
  // carry the aeroplane from one point to another at cruise height, rendering on the way
  const leg = (from, to) => ev(`(() => {
    const R = window.__route, st = R.fl.st, P = ${from}, Q = ${to};
    const n = Math.max(1, Math.ceil(Math.hypot(Q.x - P.x, Q.z - P.z) / 2000));
    st.onGround = false;
    st.hdg = Math.atan2(Q.x - P.x, -(Q.z - P.z));
    for (let i = 0; i <= n; i++) {
      const k = i / n, x = P.x + (Q.x - P.x) * k, z = P.z + (Q.z - P.z) * k;
      st.pos.x = x; st.pos.z = z;
      st.pos.y = Math.max(Terrain.heightAt(x, z), 0) + Math.min(9000, 300 + Math.min(k, 1 - k) * n * 2000 * 0.08);
      st.axes = null;
      Scene3D.update(1 / 30, R.fl, R.sys);
      Scene3D.render();
    }
    return n;
  })()`);
  const atGate = (g) => ev(`(() => {
    const R = window.__route, st = R.fl.st, g = ${g};
    st.pos.x = g.x; st.pos.z = g.z; st.pos.y = g.y; st.hdg = g.hdg; st.onGround = true; st.axes = null;
    Scene3D.warmup(R.fl);
    for (let i = 0; i < 5; i++) { Scene3D.update(1 / 30, R.fl, R.sys); Scene3D.render(); }
    return 1;
  })()`);
  const gateB = `(() => { const R = window.__route, gt = R.fl.contract && R.B.gates[R.fl.contract.arrGate] || R.B.gates[0];
    return { x: gt.standX, z: gt.standZ, y: R.B.elev + R.fl.st.gearH, hdg: gt.parkHdg * DEG }; })()`;
  await atGate('window.__route.gA');
  log('   ' + await snap('departure gate'));
  await leg('window.__route.gA', gateB);
  log('   ' + await snap('arrived over B'));
  await atGate(gateB);
  log('   ' + await snap('arrival gate'));
  await leg(gateB, 'window.__route.gA');
  await atGate('window.__route.gA');
  log('   ' + await snap('departure again'));
  await leg('window.__route.gA', gateB);
  await atGate(gateB);
  log('   ' + await snap('arrival again'));
}
