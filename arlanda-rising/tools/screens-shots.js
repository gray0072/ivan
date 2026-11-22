// Arlanda Rising — screenshots of the text screens filled with a real play-through, on a phone held upright, a phone on
// its side, a tablet and a computer, for a look at the layout (a steps file for tools/cdp.js, see docs/testing.md).
// Starts a campaign at 5-1 and plays 5-1…5-8 at Medium by the reference strategies as a chain (months of books, shops,
// car parks, systems, brands as investments), then opens the Office, Finance (Details open) and its analytics tabs
// (Passengers, Airlines, Neighbours, Staff, Safety, with the chain's history), Departments, Ops Center,
// Airlines and the Terminal view, 5-10's first ops stage with its mission's info from the pause menu, and during 5-10's
// plan stage the HUD with the plan panel. Each screen is shot at its
// top and scrolled to its bottom, and every element sticking out of its box or out of the screen is printed as
// OVERFLOW <size> <screen>: <element> "<text>" — none expected. The language is English, or the ARLANDA_LANG
// environment variable's (ru, sv: the Russian texts are the longest).
//
// Usage: [ARLANDA_LANG=ru] node --experimental-websocket tools/cdp.js arlanda-rising/tools/screens-shots.js [out-dir] --limit 500
//        (about five minutes)

const LANG = process.env.ARLANDA_LANG || 'en';
const SIZES = [['phone', 390, 844], ['phoneSide', 844, 390], ['tablet', 820, 1180], ['desktop', 1280, 720]];
// stats-<tab>: Finance's analytics tabs (ui/analytics.js), the history being the chain's
const SCREENS = ['office', 'finance', 'stats-passengers', 'stats-airlines', 'stats-neighbours', 'stats-staff', 'stats-safety', 'people', 'opsCenter', 'airlines', 'terminal'];

// elements whose content is wider than their box (clipped or spilling) or that reach past the screen's right edge
const OVERFLOW = `(() => {
  const vw = innerWidth, out = [];
  const vis = (e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed';
  // inside a box that scrolls sideways (the toolbar): reaching past the screen is fine
  const scrolls = (e) => { for (let p = e.parentElement; p; p = p.parentElement) if (/auto|scroll/.test(getComputedStyle(p).overflowX)) return true; return false; };
  for (const e of document.querySelectorAll('body *')) {
    // g-ico: the drawn icons (docs/icons.md), an SVG sized by the font, wider inside than its box on purpose
    if (!vis(e) || e.closest('svg, canvas, [hidden], g-ico') || e.tagName === 'CANVAS' || scrolls(e)) continue;
    const r = e.getBoundingClientRect();
    if (!r.width) continue;
    const name = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : '');
    const text = (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 50);
    if (r.right > vw + 1 && !e.closest('#map')) out.push(name + ' right ' + Math.round(r.right) + ' > ' + vw + ' "' + text + '"');
    else if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'auto' && getComputedStyle(e).overflowX !== 'scroll' && e.clientWidth)
      out.push(name + ' ' + e.scrollWidth + ' in ' + e.clientWidth + ' "' + text + '"');
  }
  // a screen that scrolls sideways: something in it is too wide
  for (const p of document.querySelectorAll('.panel')) {
    if (p.hidden || p.scrollWidth <= p.clientWidth + 1) continue;
    const edge = p.getBoundingClientRect().left + p.clientWidth - parseFloat(getComputedStyle(p).paddingRight);
    const what = [...p.querySelectorAll('*')].filter((e) => !e.closest('g-ico') && e.getBoundingClientRect().right > edge + 1)
      .map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className : '') + ' "' + (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30) + '"');
    out.push('#' + p.id + ' scrolls sideways: ' + p.scrollWidth + ' in ' + p.clientWidth + ' — ' + what.slice(-4).join(', '));
  }
  return [...new Set(out)].slice(0, 25);
})()`;

module.exports = async (h) => {
  await h.desktop(1280, 720);
  await h.page('arlanda-rising', 3000);
  await h.ev(`I18N.set('${LANG}'); 1`);
  h.log('chain', await h.ev(`(() => {
    Campaign.start('medium'); Campaign.data.next = '5-1'; Campaign.save();
    const out = [];
    let id = '5-1';
    while (id && id !== '5-9') {
      Game.startMission(id, 'medium');
      GameEvents.mute(true);
      const r = Strategy.runner(STRATEGIES[id]);
      let n = 0;
      while (n++ < 400000) {
        const st = S.mission.status;
        if (st === 'stageDone') Missions.next();
        else if (st === 'running') { Strategy.act(r); Sim.step(); }
        else break;
      }
      GameEvents.mute(false);
      out.push(id + ' ' + S.mission.status);
      // started at 5-1 from the owner's airport, 5-9 misses a stage: a failed stage has no mission end
      if (S.mission.status !== 'done') break;
      Game.missionEnd();
      id = Campaign.data.next;
    }
    Settings.set('finDetails', 'open');
    return out.join(', ');
  })()`));

  const look = async (size, name) => {
    await h.sleep(500);
    await h.shot(size + '-' + name);
    for (const o of await h.ev(OVERFLOW)) h.log('OVERFLOW ' + size + ' ' + name + ': ' + o);
    const more = await h.ev(`(() => { const p = [...document.querySelectorAll('.panel')].find((e) => !e.hidden); if (!p || p.scrollHeight <= p.clientHeight + 4) return false; p.scrollTop = p.scrollHeight; return true; })()`);
    if (more) { await h.sleep(300); await h.shot(size + '-' + name + '-end'); }
  };

  for (const [size, w, hh] of SIZES) {
    if (size === 'desktop') await h.desktop(w, hh); else await h.phone(w, hh);
    await h.sleep(600);
    for (const s of SCREENS) {
      const open = s === 'office' ? '' : s.startsWith('stats-') ? `Office.open('finance', '${s.slice(6)}');` : `Office.open('${s === 'opsCenter' ? 'ops' : s}');`;
      await h.ev(`(() => { Game.toOffice(); ${open} return 1; })()`);
      await look(size, s);
    }
    // 5-10: its first ops stage (the HUD, the goals, the toolbar), then its plan stage (the plan panel)
    await h.ev(`(() => { Game.startMission('5-10', 'medium'); Game.intro(); Game.play(); Game.speed = 0; return 1; })()`);
    await look(size, 'play');
    // the pause menu's mission info (ui/missioncard.js), then back to play
    await h.ev(`(() => { Game.pauseMenu(); Game.missionInfo(); return 1; })()`);
    await look(size, 'missionInfo');
    await h.ev(`(() => { Game.backToPause(); Game.resume(); Game.speed = 0; return 1; })()`);
    await h.ev(`(() => {
      GameEvents.mute(true);
      const r = Strategy.runner(STRATEGIES['5-10']);
      let n = 0;
      while (S.mission.stage < 1 && n++ < 200000) { const st = S.mission.status; if (st === 'stageDone') Missions.next(); else if (st === 'running') { Strategy.act(r); Sim.step(); } else break; }
      GameEvents.mute(false);
      Game.intro(); Game.play(); Game.speed = 0;
      return 1;
    })()`);
    await look(size, 'plan');
  }
};
