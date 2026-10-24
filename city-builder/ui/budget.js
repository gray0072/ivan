'use strict';

// City Builder — the budget card (a tap on the money): last month's taxes and upkeep, what is left
// over, and the tax-rate slider. Opened from the HUD and the pause dialog by game.js.

const Budget = (() => {
  const card = document.getElementById('budget');
  let lastHtml = '';

  function row(label, v, cls) {
    return '<div class="row' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><b class="' + (v >= 0 ? 'plus' : 'minus') + '">' + (v > 0 ? '+' : '') + money(v) + '</b></div>';
  }
  function render() {
    const st = city.stats;
    let html = '<h2>💰 ' + tr('Budget') + '<button class="x" data-act="close" aria-label="Close">✖</button></h2>';
    html += '<p class="sub">' + tr('Last month') + '</p>';
    html += row(tr('Taxes from residents'), st.taxRes);
    html += row(tr('Taxes from businesses'), st.taxBiz);
    html += row(tr('Roads and bridges'), -st.upkeepRoads);
    html += row(tr('Parks and services'), -st.upkeepBuildings);
    html += row(tr('Every month'), st.income - st.expense, 'total');
    html += '<div class="row"><span>' + tr('Jobs') + '</span><b>' + number(st.employed) + ' / ' + number(st.jobs) + '</b></div>';
    html += '<div class="row"><span>' + tr('Without a job') + '</span><b>' + Math.round(st.unemployment * 100) + ' %</b></div>';
    html += '<div class="taxRow"><span>' + tr('Tax') + '</span><input type="range" id="taxSlider" min="0" max="' + TAX_MAX + '" step="1" value="' + city.tax + '"><b>' + city.tax + ' %</b></div>';
    html += '<p class="fine">' + tr('Higher taxes bring more money, but the residents get less happy. Normal is {n} %.', { n: TAX_DEFAULT }) + '</p>';
    if (html !== lastHtml) {
      // keep the slider under a finger dragging it
      const active = document.activeElement && document.activeElement.id === 'taxSlider';
      if (active && lastHtml) { card.querySelector('.taxRow b').textContent = city.tax + ' %'; return; }
      card.innerHTML = html; lastHtml = html;
    }
  }
  card.addEventListener('input', (e) => {
    if (e.target.id !== 'taxSlider') return;
    city.tax = +e.target.value;
    run.happyDirty = true;
    render();
  });
  card.addEventListener('click', (e) => { if (e.target.closest('[data-act="close"]')) close(); });

  function open() { lastHtml = ''; card.hidden = false; render(); }
  function close() { card.hidden = true; }
  function toggle() { if (card.hidden) open(); else close(); }
  function refresh() { if (!card.hidden) render(); }

  return { open, close, toggle, refresh, get isOpen() { return !card.hidden; } };
})();
