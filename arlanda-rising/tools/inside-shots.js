// Arlanda Rising — screenshots of the roofs off and of the cards of the map (a steps file for tools/cdp.js, see
// docs/testing.md): on a phone held upright, a phone on its side, a tablet and a computer it plays 6-8 (May 2016) by its
// reference strategy into stage 2, takes the roofs off by pressing the 🏠 button (or keeps them off), shoots the
// terminals cut away, presses the international terminal's hall and shoots its card, then presses a fuel truck at its
// depot and shoots the truck's card; on the computer also Sky City's card and the new tower's, and it prints how long a
// frame of the map takes with the roofs on and off. Then 1-7 (December 1960, snow at dawn) for the first terminal cut
// away and a snowplough's card. Each line printed says what the card's title was: none expected to be "hidden".
//
// Usage: node --experimental-websocket tools/cdp.js arlanda-rising/tools/inside-shots.js [out-dir] --limit 600
//        (about eight minutes in headless Chrome)

const SIZES = [['phone', 390, 844], ['phoneSide', 844, 390], ['tablet', 820, 1180], ['desktop', 1280, 720]];

// a mission at Medium played by its reference strategy until `cond` (JS over S) holds, then shown paused
const run = (id, cond) => `(() => {
  Game.startMission('${id}', 'medium');
  GameEvents.mute(true);
  const r = Strategy.runner(STRATEGIES['${id}']);
  let n = 0;
  while (!(${cond}) && n++ < 200000) {
    const st = S.mission.status;
    if (st === 'stageDone') Missions.next();
    else if (st === 'running') { Strategy.act(r); Sim.step(); }
    else break;
  }
  GameEvents.mute(false);
  Game.intro(); Game.play(); Game.speed = 0;
  return '${id}: ' + S.mission.status + ', stage ' + S.mission.stage + ', clock ' + S.clock;
})()`;
const title = `document.getElementById('siteCard').hidden ? 'hidden' : document.querySelector('#siteCard b').textContent`;
const perf = `(() => { const t0 = performance.now(); for (let i = 0; i < 10; i++) MapView.draw(0.016); return ((performance.now() - t0) / 10).toFixed(1) + ' ms'; })()`;

module.exports = async (h) => {
  for (const [name, w, ht] of SIZES) {
    if (name === 'desktop') await h.desktop(w, ht); else await h.phone(w, ht);
    await h.page('arlanda-rising', 2500);
    await h.ev(`I18N.set('en'); 1`);
    h.log(name, await h.ev(run('6-8', 'S.ops && S.clock >= S.ops.from + 45')));
    const press = (x, y) => (name === 'desktop' ? h.click(x, y) : h.tap(x, y));
    await h.ev(`Cam.centerOn(950, 1300, 0.9); 1`);
    await h.sleep(300);
    if (name === 'desktop') h.log('a frame with the roofs on', await h.ev(perf));
    // the 🏠 button, pressed for real (the setting is kept between the runs: pressed only while the roofs are on)
    if (!(await h.ev(`Game.cut`))) {
      const b = await h.ev(`(() => { const r = document.getElementById('roofBtn').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
      await press(b[0], b[1]);
      await h.sleep(300);
    }
    h.log('roofs off', await h.ev(`Game.cut`));
    if (name === 'desktop') h.log('a frame with the roofs off', await h.ev(perf));
    await h.ev(`Cam.centerOn(950, 1470, ${name === 'phone' ? 2.2 : 3}); 1`);
    await h.sleep(1500);
    await h.shot(name + '-1-cut');
    const p = await h.ev(`Cam.toScreen(940, 1440, 1)`);
    await press(p[0], p[1]);
    await h.sleep(700);
    h.log('card', await h.ev(title));
    await h.shot(name + '-2-terminal');
    await h.ev(`SiteCard.close(); Cam.centerOn(LAYOUT.fuelDepot.x + 10, LAYOUT.fuelDepot.y, 3.5); 1`);
    await h.sleep(800);
    const v = await h.ev(`(() => { const t = S.ops.trucks.findIndex((b) => b <= S.clock); return Cam.toScreen(LAYOUT.fuelDepot.x + Math.max(0, t) * 5, LAYOUT.fuelDepot.y, 1.5); })()`);
    await press(v[0], v[1]);
    await h.sleep(700);
    h.log('card', await h.ev(title), await h.ev(`JSON.stringify(S.ops.fleet && { aircraft: S.ops.fleet.fuelN, litres: S.ops.fleet.fuelL })`));
    await h.shot(name + '-3-truck');
    if (name === 'desktop') {
      await h.ev(`SiteCard.close(); Cam.centerOn(1060, 1340, 3.2); 1`);
      await h.sleep(800);
      const s = await h.ev(`Cam.toScreen(1050, 1420, 1)`);
      await h.click(s[0], s[1]); await h.sleep(600);
      h.log('card', await h.ev(title));
      await h.shot(name + '-4-skycity');
      const t = await h.ev(`Cam.toScreen(LAYOUT.tower2.x, LAYOUT.tower2.y, 30)`);
      await h.click(t[0], t[1]); await h.sleep(600);
      h.log('card', await h.ev(title));
      await h.shot(name + '-5-tower');
    }
    await h.ev(`SiteCard.close(); 1`);
  }
  // 1960 in the snow: the first terminal cut away, a plough's card
  h.log(await h.ev(run('1-7', 'S.ops && S.clock >= S.ops.from + 100')));
  await h.ev(`Game.roofs(true); Cam.centerOn(905, 1240, 4); 1`);
  await h.sleep(1000);
  await h.shot('1960-1-terminal');
  await h.ev(`Cam.centerOn(LAYOUT.snowDepot.x + 20, LAYOUT.snowDepot.y, 3.5); 1`);
  await h.sleep(800);
  const q = await h.ev(`Cam.toScreen(LAYOUT.snowDepot.x, LAYOUT.snowDepot.y, 1.5)`);
  await h.click(q[0], q[1]); await h.sleep(600);
  h.log('card', await h.ev(title), await h.ev(`JSON.stringify(S.ops.fleet && { runs: S.ops.fleet.runs, m2: S.ops.fleet.m2, m3: Math.round(S.ops.fleet.m3) })`));
  await h.shot('1960-2-plough');
};
