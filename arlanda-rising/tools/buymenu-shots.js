// Arlanda Rising — screenshots of the bar's buy menu (ui/buymenu.js; a steps file for tools/cdp.js, see docs/testing.md):
// on a narrow phone held upright (360 × 780), a phone held upright (390 × 844), a phone on its side (844 × 390) and a
// computer (1280 × 720) it plays 1-8 (Make It Pay, spring 1961) by its reference strategy into its first plan stage and
// opens each category — Services with the passengers a day, the shop cells, the car parks and the cards' profit and
// payback, Vehicles with the crash tender locked ("Opens in mission 2-6"), Build —, buys a café (one tap) and shows
// the sheet scrolled to its end, then buys check-in desks with +5 (the limit line "n of max: room for k more in the
// check-in halls" before and after); then 2-6 (Fire Category, 1971) in its plan stage — the crash tender new and open — and
// 2-5 (Jumbo!) in its ops stage, the bar's live part beside the three buttons. Each shot is followed by what overflows its
// box or the screen (OVERFLOW <size> <shot>: …, none expected) and the cards' state (name, the reason it cannot be
// bought). The language is English, or ARLANDA_LANG's (ru, sv).
//
// Usage: [ARLANDA_LANG=ru] [ARLANDA_SIZE=phone|phone360|phoneSide|desktop] node --experimental-websocket tools/cdp.js
//        arlanda-rising/tools/buymenu-shots.js [out-dir] --limit 600   (about a minute a size)

const LANG = process.env.ARLANDA_LANG || 'en';
const SIZES = [['phone360', 360, 780], ['phone', 390, 844], ['phoneSide', 844, 390], ['desktop', 1280, 720]].filter((s) => !process.env.ARLANDA_SIZE || s[0] === process.env.ARLANDA_SIZE);

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

// elements wider than their box, or reaching past the screen (the bar's live part scrolls sideways on purpose)
const OVERFLOW = `(() => {
  const vw = innerWidth, vh = innerHeight, out = [];
  const scrolls = (e) => { for (let p = e.parentElement; p; p = p.parentElement) if (/auto|scroll/.test(getComputedStyle(p).overflowX)) return true; return false; };
  for (const e of document.querySelectorAll('#toolbar *, #buySheet *')) {
    // .ci: a category's sign with its new dot sticking out on purpose
    if (e.closest('svg, [hidden], g-ico') || e.matches('.ci') || scrolls(e)) continue;
    const r = e.getBoundingClientRect();
    if (!r.width) continue;
    const name = e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : '');
    const text = (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    if (r.right > vw + 1 || r.left < -1) out.push(name + ' outside the screen ' + Math.round(r.left) + '–' + Math.round(r.right) + ' "' + text + '"');
    else if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth && getComputedStyle(e).overflowX === 'visible' && getComputedStyle(e).textOverflow !== 'ellipsis') out.push(name + ' ' + e.scrollWidth + ' in ' + e.clientWidth + ' "' + text + '"');
  }
  const s = document.getElementById('buySheet').getBoundingClientRect();
  if (!document.getElementById('buySheet').hidden && (s.top < 0 || s.bottom > vh)) out.push('the sheet runs off the screen ' + Math.round(s.top) + '–' + Math.round(s.bottom));
  return [...new Set(out)].slice(0, 20);
})()`;
const cards = `[...document.querySelectorAll('#buySheet .bcard')].map((c) => c.querySelector('.bName b').textContent + (c.querySelector('.bWhy') ? ' [' + c.querySelector('.bWhy').textContent + ']' : '')).join(' | ') +
  ' || later: ' + [...document.querySelectorAll('#buySheet ul.later li')].map((l) => l.textContent.replace(/\\s+/g, ' ').trim()).join(' | ')`;

module.exports = async (h) => {
  for (const [name, w, ht] of SIZES) {
    if (name === 'desktop') await h.desktop(w, ht); else await h.phone(w, ht);
    await h.page('arlanda-rising', 2500);
    await h.ev(`I18N.set('${LANG}'); 1`);
    const look = async (shot) => {
      await h.sleep(500);
      await h.shot(name + '-' + shot);
      for (const o of await h.ev(OVERFLOW)) h.log('OVERFLOW ' + name + ' ' + shot + ': ' + o);
    };
    // a button pressed for real: a tap on a phone, a click on a computer
    const press = async (sel) => {
      const p = await h.ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
      if (!p) { h.log('no button', sel); return; }
      if (name === 'desktop') await h.click(p[0], p[1]); else await h.tap(p[0], p[1]);
      await h.sleep(300);
    };
    h.log(name, await h.ev(run('1-8', 'S.plan && S.day >= S.plan.day0 + 7')));
    await look('1-bar');
    for (const c of ['services', 'vehicles', 'build']) {
      await press(`#tcats [data-cat="${c}"]`);
      h.log(c, await h.ev(cards));
      await look('2-' + c);
    }
    await press('#buySheet [data-tab="services"]');
    await press('#buySheet [data-buy="cafe"]:not([data-n])');
    h.log('café bought', await h.ev(`S.plan.buys.filter((b) => b.kind === 'cafe').length`));
    await look('3-cafe-bought');
    await h.ev(`(() => { const b = document.querySelector('#buySheet .shBody'); b.scrollTop = b.scrollHeight; return 1; })()`);
    await look('4-services-end');
    await press('#buySheet [data-tab="build"]');
    const desks = `Airport.owned('desk') + '/' + Airport.cap('desk').max + ' · ' + [...document.querySelectorAll('#buySheet .bcard')].filter((c) => c.querySelector('[data-buy="desk"]')).map((c) => c.querySelector('.bNote').textContent + ' · ' + [...c.querySelectorAll('.bActs button')].map((b) => b.textContent + (b.disabled ? ' (off)' : '')).join(' | '))`;
    // enough money for +5 (the café took most of 1-8's): a test of the buttons, not of the mission
    await h.ev(`S.money = Math.max(S.money, 2e6); 1`);
    await h.sleep(400);
    h.log('desks', await h.ev(desks));
    await press('#buySheet [data-buy="desk"][data-n="5"]');
    h.log('desks +5', await h.ev(desks));
    await look('4b-desks-bulk');
    await press('#buySheet .x');
    h.log('closed', await h.ev(`document.getElementById('buySheet').hidden`));
    h.log(name, await h.ev(run('2-6', 'S.plan && S.day >= S.plan.day0 + 1')));
    await h.ev(`BuyMenu.show('vehicles'); 1`);
    h.log('vehicles', await h.ev(cards));
    await look('5-2-6-vehicles');
    h.log(name, await h.ev(run('2-5', 'S.ops && S.clock >= S.ops.from + 60')));
    await look('6-2-5-ops-bar');
    await h.ev(`BuyMenu.show('build'); 1`);
    h.log('build', await h.ev(cards));
    await look('7-2-5-ops-build');
  }
};
