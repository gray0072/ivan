'use strict';

// City Builder — the card about the building picked on the map: what it is, its level, residents or
// workers, the happiness of a house and what it is made of, the "no road" / damaged / on fire state,
// and the Repair / Demolish buttons. game.js opens it on a tap and refreshes it while it is open.

const Info = (() => {
  const card = document.getElementById('info');
  let b = null;
  let lastHtml = '';

  function happyColor(h) { return h >= 70 ? '#66bb6a' : h >= 50 ? '#c0ca33' : h >= 30 ? '#fdd835' : '#ef5350'; }

  function render() {
    if (!b) return;
    const d = def(b);
    const name = b.ruin ? tr('Ruins') : b.type === 'house' ? tr(HOUSE_LEVEL_NAMES[b.level]) : tr(d.name);
    let html = '<h2>' + name + '<button class="x" data-act="close" aria-label="Close">✖</button></h2>';
    html += '<p class="sub">' + (b.ruin ? tr('Burnt down. Clear it with the bulldozer.') : tr(d.desc)) + '</p>';
    if (!b.ruin) {
      if (b.type === 'house') {
        html += '<div class="row"><span>' + tr('Residents') + '</span><b>' + b.residents + ' / ' + HOUSE_CAPACITY[b.level] + '</b></div>';
        html += '<div class="row"><span>' + tr('Level') + '</span><b>' + b.level + ' / 3</b></div>';
        const hp = houseHappiness(b);
        html += '<div class="row"><span>' + tr('Happiness') + '</span><b>' + Math.round(hp.value) + '</b></div>';
        html += '<div class="happyBar"><div style="width:' + hp.value + '%;background:' + happyColor(hp.value) + '"></div></div>';
        html += '<ul class="parts">' + hp.parts.map((p) => '<li><span>' + tr(p.text) + '</span><b class="' + (p.delta >= 0 ? 'plus' : 'minus') + '">' +
          (p.delta >= 0 ? '+' : '−') + Math.abs(p.delta) + '</b></li>').join('') + '</ul>';
        if (b.level < 3 && b.residents >= HOUSE_CAPACITY[b.level] && hp.value >= GROW_HAPPINESS) html += '<p class="warn">' + tr('Happy and full — it will grow soon!') + '</p>';
        if (b.level === 2 && hp.value >= GROW_HAPPINESS && !hp.parts.some((p) => p.text === 'School nearby')) html += '<p class="warn">' + tr('Needs a school nearby to become an apartment block.') + '</p>';
      }
      if (d.jobs) html += '<div class="row"><span>' + tr('Workers') + '</span><b>' + b.workers + ' / ' + jobsOf(b) + '</b></div>';
      if (d.upkeep) html += '<div class="row"><span>' + tr('Upkeep') + '</span><b>' + money(Math.round(d.upkeep * DIFFICULTY[city.difficulty].upkeepMul)) + ' ' + tr('a month') + '</b></div>';
    }
    if (!b.connected && !b.ruin && b.type !== 'embankment' && b.type !== 'park') html += '<p class="warn">🚧 ' + tr('No road to the highway: nobody can get here.') + '</p>';
    if (b.fire) html += '<p class="warn">🔥 ' + tr('On fire!') + '</p>';
    else if (b.damaged) html += '<p class="warn">🔧 ' + tr('Damaged: it does not work until it is repaired.') + '</p>';
    html += '<div class="btnRow">';
    if (b.damaged && !b.fire) html += '<button class="btn default" data-act="repair">' + tr('Repair') + ' · ' + money(repairCost(b)) + '</button>';
    html += '<button class="btn secondary" data-act="demolish">' + (b.ruin ? tr('Clear') : tr('Demolish')) + ' · ' + money(BULLDOZE_PRICE) + '</button>';
    html += '</div>';
    if (html !== lastHtml) { card.innerHTML = html; lastHtml = html; }
  }

  card.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn || !b) return;
    if (btn.dataset.act === 'close') close();
    else if (btn.dataset.act === 'repair') { repair(b); render(); }
    else if (btn.dataset.act === 'demolish') { if (demolish(b)) close(); }
  });

  function open(building) { b = building; lastHtml = ''; card.hidden = false; render(); }
  function close() { b = null; card.hidden = true; Info.onClose(); }
  function refresh() {
    if (!b) return;
    if (!run.byId.has(b.id)) { close(); return; }
    render();
  }

  return { open, close, refresh, onClose: () => {}, get building() { return b; } };
})();
