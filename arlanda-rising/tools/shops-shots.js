// Arlanda Rising — screenshots of the airport's own shops in the terminals' cells (a steps file for tools/cdp.js, see
// docs/testing.md): on a phone held upright and a computer it plays 1-8 (Make It Pay, spring 1961) into its plan stage,
// gives the airport two cafés and two kiosks (the first terminal's six cells full), and shoots the terminal with the roofs
// on (an awning per shop, the Services sheet's cells), with the roofs off (the shops in their cells), its card (Shops: 6 / 6
// cells, a Sell button each); then sells both kiosks by tapping Sell twice each, buys a café in their place from the
// bar's Services (its Buy tapped once) and shoots the card with the café being fitted, and the cells once it is open. Then 4-4 (Duty
// Free, 1995) into its last stage: the international terminal cut away with its duty-free shop in its cells beside the
// brands' units, and its card. Each line printed says what it checked; a card's title "hidden" is a failure.
//
// Usage: [ARLANDA_LANG=ru] [ARLANDA_SIZE=phone|desktop] node --experimental-websocket tools/cdp.js arlanda-rising/tools/shops-shots.js
//        [out-dir] --limit 700   (about five minutes a size in headless Chrome)

const LANG = process.env.ARLANDA_LANG || 'en';
const SIZES = [['phone', 390, 844], ['desktop', 1280, 720]].filter((s) => !process.env.ARLANDA_SIZE || s[0] === process.env.ARLANDA_SIZE);

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
  return '${id}: ' + S.mission.status + ', stage ' + S.mission.stage + ', day ' + S.day;
})()`;
// plan days go by until every shop bought is open
const fitted = `(() => { GameEvents.mute(true); let n = 0; while (S.plan && S.plan.buys.length && n++ < 400) { if (S.plan.pending) Plan.choose(Plan.pendingDef().default); Sim.step(); } GameEvents.mute(false); return 'fitted, day ' + S.day; })()`;
const title = `document.getElementById('siteCard').hidden ? 'hidden' : document.querySelector('#siteCard b').textContent`;
const cells = `[...document.querySelectorAll('#siteCard table.cells tr')].map((r) => r.textContent.replace(/\\s+/g, ' ').trim()).join(' | ')`;
// the bar's Services sheet (ui/buymenu.js): its shop cells and its shops' cards, [off] when one cannot be bought
const bar = `(() => {
  BuyMenu.show('services');
  const t = [...document.querySelectorAll('#buySheet ul.shInfo li, #buySheet .bcard')].map((b) => b.textContent.replace(/\\s+/g, ' ').trim().slice(0, 70) + (b.querySelector('.bWhy') ? ' [off]' : ''))
    .filter((x) => /🏪|☕|🍽|🛍/.test(x)).join(' | ');
  BuyMenu.close();
  return t;
})()`;

module.exports = async (h) => {
  for (const [name, w, ht] of SIZES) {
    if (name === 'desktop') await h.desktop(w, ht); else await h.phone(w, ht);
    await h.page('arlanda-rising', 2500);
    await h.ev(`I18N.set('${LANG}'); 1`);
    const press = (x, y) => (name === 'desktop' ? h.click(x, y) : h.tap(x, y));
    // the button in the card or the buy menu matching a selector, pressed for real
    const pressEl = async (sel) => {
      const p = await h.ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; b.scrollIntoView({ block: 'nearest', inline: 'center' }); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
      if (!p) { h.log('no button', sel); return; }
      await press(p[0], p[1]);
      await h.sleep(250);
    };
    h.log(name, await h.ev(run('1-8', 'S.plan && S.day >= S.plan.day0 + 7')));
    await h.ev(`Game.roofs(false); S.money += 40e6; while (Airport.owned('cafe') < 2) Actions.buy('cafe'); while (Airport.owned('kiosk') < 2) Actions.buy('kiosk'); 1`);
    h.log(await h.ev(fitted), 'cells', await h.ev(`Airport.cellsTaken('t1') + '/' + Airport.cellsMax('t1')`));
    await h.ev(`Cam.centerOn(912, 1215, ${name === 'phone' ? 3.2 : 4}); 1`);
    await h.sleep(900);
    h.log('services', await h.ev(bar));
    await h.shot(name + '-1-roofs-on');
    await h.ev(`Game.roofs(true); Cam.centerOn(898, 1205, ${name === 'phone' ? 4 : 5}); 1`);
    await h.sleep(900);
    await h.shot(name + '-2-cells');
    const t = await h.ev(`Cam.toScreen(910, 1240, 1)`);
    await press(t[0], t[1]);
    await h.sleep(600);
    h.log('card', await h.ev(title), '·', await h.ev(cells));
    await h.shot(name + '-3-card');
    // sell the first kiosk: one tap arms it, the second sells it
    const kioskBtn = async () => `#siteCard button[data-sell="${await h.ev(`S.airport.items.filter((i) => i.kind === 'kiosk')[0].id`)}"]`;
    await pressEl(await kioskBtn());
    await h.sleep(300);
    await h.shot(name + '-4-sell-armed');
    await pressEl(await kioskBtn());
    await h.sleep(400);
    h.log('sold one', await h.ev(cells), '· services', await h.ev(bar));
    await h.shot(name + '-5-sold-one');
    await pressEl(await kioskBtn()); await pressEl(await kioskBtn());
    await h.sleep(300);
    await h.ev(`BuyMenu.show('services'); 1`);
    await h.sleep(200);
    await pressEl('#buySheet [data-buy="cafe"]:not([data-n])');
    await h.ev(`BuyMenu.close(); 1`);
    await h.sleep(500);
    h.log('café bought', await h.ev(cells), '· money', await h.ev(`Math.round(S.money / 1e5) / 10`));
    await h.shot(name + '-6-cafe-bought');
    h.log(await h.ev(fitted));
    await h.sleep(800);
    h.log('café open', await h.ev(cells));
    await h.shot(name + '-7-cafe-open');
    await h.ev(`SiteCard.close(); 1`);
    // the international terminal in 1995: its duty-free in its cells beside the brands' units
    h.log(await h.ev(run('4-4', 'S.ops && S.mission.stage === 2 && S.clock >= S.ops.from + 30')));
    h.log('intl', await h.ev(`Airport.shopsIn('intl').map((s) => s.kind).join(',') + ' ' + Airport.cellsTaken('intl') + '/' + Airport.cellsMax('intl')`));
    await h.ev(`Game.roofs(true); Cam.centerOn(932, 1425, ${name === 'phone' ? 3.6 : 4.5}); 1`);
    await h.sleep(1000);
    await h.shot(name + '-8-intl-cells');
    const q = await h.ev(`Cam.toScreen(950, 1440, 1)`);
    await press(q[0], q[1]);
    await h.sleep(600);
    h.log('card', await h.ev(title), '·', await h.ev(cells));
    await h.shot(name + '-9-intl-card');
    await h.ev(`SiteCard.close(); Game.roofs(false); Cam.centerOn(972, 1430, 3); 1`);
    await h.sleep(800);
    await h.shot(name + '-10-intl-roofs-on');
  }
};
