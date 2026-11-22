// Arlanda Rising — the staff in Departments, the Ops Center and the plan panel (spec/people.md), a steps file for
// tools/cdp.js (see docs/testing.md). Starts a campaign at 3-1 and plays 3-1…3-8 at Medium by the reference strategies
// as a chain (teams, fallback teams, systems, heads, IT), then in 3-9's first plan stage (no goal about the teams: the
// plan panel shows only its line with 👥 Departments and 🛠️ Ops Center) shoots the plan panel, Departments (each team,
// fallback team and system's practice, the heads with their retirement, Dismiss and Find a replacement with their
// prices, the work still done by hand, IT), starts a search for the head of terminal service, dismisses the head of IT
// with two taps (the first arms the button) — "No head — find one" with its candidates —, lets the days run until the
// search ends, shoots its two candidates and takes one, then the Ops Center (practice: the word, how fast it falls, what a
// failure would mean, Drill); and 3-7's plan stage, whose goal asks for the snow system (its ladder and the IT people in
// the plan panel). On a 360 px phone held upright and a computer; prints every element out of its box or the screen
// (OVERFLOW, none expected) and the money paid for each step.
//
// Usage: [ARLANDA_LANG=ru] [ARLANDA_SIZE=phone360|desktop] node --experimental-websocket tools/cdp.js arlanda-rising/tools/people-shots.js [out-dir] --limit 400

const LANG = process.env.ARLANDA_LANG || 'en';
const SIZES = [['phone360', 360, 740], ['desktop', 1280, 720]].filter((s) => !process.env.ARLANDA_SIZE || s[0] === process.env.ARLANDA_SIZE);

const OVERFLOW = `(() => {
  const vw = innerWidth, out = [];
  const vis = (e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed';
  for (const e of document.querySelectorAll('.panel:not([hidden]) *, #planPanel *')) {
    if (!vis(e) || e.closest('svg, canvas, [hidden], g-ico')) continue;
    const r = e.getBoundingClientRect();
    if (!r.width) continue;
    const name = e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : '');
    const text = (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 50);
    if (r.right > vw + 1) out.push(name + ' right ' + Math.round(r.right) + ' > ' + vw + ' "' + text + '"');
    else if (e.scrollWidth > e.clientWidth + 1 && !/auto|scroll/.test(getComputedStyle(e).overflowX) && e.clientWidth) out.push(name + ' ' + e.scrollWidth + ' in ' + e.clientWidth + ' "' + text + '"');
  }
  return [...new Set(out)].slice(0, 20);
})()`;

// plays the reference strategy of the running mission until `until` (a JS condition) holds, the decisions by default
const run = (until) => `(() => {
  GameEvents.mute(true);
  const r = Strategy.runner(STRATEGIES[S.mission.id]);
  let n = 0;
  while (!(${until}) && n++ < 400000) { const st = S.mission.status; if (st === 'stageDone') Missions.next(); else if (st === 'running') { Strategy.act(r); if (Plan && S.plan && Plan.pendingDef()) Plan.choose(Plan.pendingDef().default || Plan.pendingDef().options[0].id); Sim.step(); } else break; }
  GameEvents.mute(false);
  return S.mission.stage + ' ' + fmtDate(S.day);
})()`;

module.exports = async (h) => {
  await h.desktop(1280, 720);
  await h.page('arlanda-rising', 3000);
  await h.ev(`I18N.set('${LANG}'); 1`);
  h.log('chain', await h.ev(`(() => {
    Campaign.start('medium'); Campaign.data.next = '3-1'; Campaign.save();
    const out = [];
    let id = '3-1';
    while (id && id !== '3-9') {
      Game.startMission(id, 'medium');
      GameEvents.mute(true);
      const r = Strategy.runner(STRATEGIES[id]);
      let n = 0;
      while (n++ < 400000) { const st = S.mission.status; if (st === 'stageDone') Missions.next(); else if (st === 'running') { Strategy.act(r); Sim.step(); } else break; }
      GameEvents.mute(false);
      out.push(id + ' ' + S.mission.status);
      if (S.mission.status !== 'done') break;
      Game.missionEnd();
      id = Campaign.data.next;
    }
    return out.join(', ');
  })()`));

  const look = async (name, sel) => {
    if (sel) await h.ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (e) e.scrollIntoView({ block: 'center' }); return !!e; })()`);
    await h.sleep(400);
    await h.shot(name);
    for (const o of await h.ev(OVERFLOW)) h.log('OVERFLOW ' + name + ': ' + o);
  };
  const click = (sel) => h.ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return 'none: ' + ${JSON.stringify(sel)}; const m = S.money; e.click(); return Math.round(m - S.money); })()`);

  for (const [size, w, hh] of SIZES) {
    if (size === 'desktop') await h.desktop(w, hh); else await h.phone(w, hh);
    await h.sleep(500);
    // 3-9 Payback, its first plan stage: no goal about the teams
    await h.ev(`(() => { Game.startMission('3-9', 'medium'); Game.intro(); Game.play(); Game.speed = 0; return 1; })()`);
    await look(size + '-plan39', '#planPanel .pHead:last-of-type');
    h.log(size, 'plan panel 3-9:', await h.ev(`[...document.querySelectorAll('#planPanel .lad, #planPanel .fin')].map((e) => e.textContent.trim().slice(0, 70)).join(' | ')`));
    await h.ev(`(() => { Game.openPanel('people'); return 1; })()`);
    await look(size + '-people');
    await look(size + '-people-head', '[data-search]');
    h.log(size, 'search paid', await click('[data-search="checkin"]'));
    h.log(size, 'IT head, first tap', await click('[data-arm="head:it"]'));
    await look(size + '-people-armed', '[data-arm="head:it"]');
    h.log(size, 'IT head, second tap paid', await click('[data-arm="head:it"]'));
    await look(size + '-people-nohead', '#people .warn');
    await look(size + '-people-search', '[data-keep="checkin"]');
    await look(size + '-people-practice', '#people .practice');
    // the days run until the search has its candidates
    await h.ev(`(() => { Game.resume(); return 1; })()`);
    h.log(size, 'ran to', await h.ev(run(`S.people.search && S.people.search.checkin && S.people.search.checkin.cands || !S.plan`)));
    await h.ev(`(() => { Game.speed = 0; Game.openPanel('people'); return 1; })()`);
    await look(size + '-people-found', '[data-pick]');
    h.log(size, 'picked, paid', await click('[data-pick]'), await h.ev(`People.mdef(S.people.managers.checkin.id).name`));
    await look(size + '-people-picked', '[data-search="checkin"]');
    await h.ev(`(() => { InfoTabs.open('ops'); return 1; })()`);
    await look(size + '-ops');
    await look(size + '-ops-practice', '#opsCenter .practice');
    // 3-7 The Big Freeze: its goal asks for the snow system, so the plan panel shows the snow ladder and the IT people
    await h.ev(`(() => { Game.startMission('3-7', 'medium'); Game.intro(); Game.play(); Game.speed = 0; return 1; })()`);
    await look(size + '-plan37', '#planPanel .lad');
    h.log(size, 'plan panel 3-7:', await h.ev(`[...document.querySelectorAll('#planPanel .lad, #planPanel .fin')].map((e) => e.textContent.trim().slice(0, 70)).join(' | ')`));
  }
};
