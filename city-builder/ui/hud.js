'use strict';

// City Builder — the bar at the top (money, population, date, the milestone and its progress, the
// speed buttons) and the alerts under it (a fire with "Show me", the flood, the damaged buildings
// with "Repair all", the debt). game.js calls Hud.update every frame and fills Hud.onShowMe.

const Hud = (() => {
  const el = (id) => document.getElementById(id);
  const root = el('hud'), alerts = el('alerts');
  const last = {};
  let alertKey = '';
  const set = (id, text) => { if (last[id] !== text) { last[id] = text; el(id).textContent = text; } };

  function update() {
    const st = city.stats;
    set('money', money(city.money));
    el('moneyBtn').classList.toggle('debt', city.money < 0);
    set('pop', number(st.population));
    set('date', dateText(city.month));
    const m = MILESTONES[city.milestone], next = MILESTONES[city.milestone + 1];
    set('msIcon', m.icon);
    set('msName', tr(m.name));
    const p = next ? clamp((st.population - m.pop) / (next.pop - m.pop), 0, 1) : 1;
    el('msFill').style.width = (p * 100).toFixed(1) + '%';
    el('msFill').parentNode.title = next ? tr('{pop} residents to become a {title}', { pop: number(next.pop), title: tr(next.name) }) : '';
    document.querySelectorAll('.speeds button').forEach((b) => b.classList.toggle('on', +b.dataset.speed === run.speed));
    updateAlerts();
  }

  function updateAlerts() {
    const fires = city.buildings.filter((b) => b.fire);
    const damaged = damagedBuildings();
    const debt = city.money < 0 ? DIFFICULTY[city.difficulty].debtMonths - city.debtMonths : 0;
    const items = [];
    if (fires.length) items.push({ cls: 'fire', text: tr('🔥 Fire! {n} burning', { n: fires.length }), btn: tr('Show me'), act: 'fire' });
    if (city.flood) items.push({ cls: 'flood', text: tr('🌊 The river is flooding!') });
    if (damaged.length) items.push({ cls: '', text: tr('🔧 {n} damaged', { n: damaged.length }), btn: tr('Repair all · {cost}', { cost: money(repairAllCost()) }), act: 'repair' });
    if (debt > 0) items.push({ cls: 'debt', text: debt === 1 ? tr('💸 In debt! Bankrupt next month!') : tr('💸 In debt! Bankrupt in {n} months', { n: debt }) });
    const key = JSON.stringify(items);
    if (key === alertKey) return;
    alertKey = key;
    alerts.innerHTML = items.map((a) => '<div class="alert ' + a.cls + '"><span>' + a.text + '</span>' +
      (a.btn ? '<button data-act="' + a.act + '">' + a.btn + '</button>' : '') + '</div>').join('');
  }
  alerts.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    if (b.dataset.act === 'fire') Hud.onShowMe();
    else if (b.dataset.act === 'repair') repairAll();
    alertKey = '';
  });

  function showBanner(text) {
    const b = el('banner');
    b.textContent = text;
    b.style.opacity = '1';
    clearTimeout(showBanner.t);
    showBanner.t = setTimeout(() => { b.style.opacity = '0'; }, 2600);
  }

  function setVisible(on) {
    root.hidden = !on;
    alerts.hidden = !on;
    if (on) { alertKey = ''; for (const k in last) delete last[k]; }
  }

  return { update, showBanner, setVisible, onShowMe: () => {}, refresh() { alertKey = ''; for (const k in last) delete last[k]; } };
})();
