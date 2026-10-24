'use strict';

// City Builder — the build toolbar at the bottom: a button per tool with its picture, name, price
// and keyboard key; locked tools are greyed out with the milestone that opens them. game.js reads
// Toolbar.tool and is told about a pick through Toolbar.onPick.

const Toolbar = (() => {
  const bar = document.getElementById('toolbar');
  const buttons = {};
  let tool = null;
  let built = false;

  function info(t) { return BUILDINGS[t] || TOOL_INFO[t]; }
  function price(t) {
    if (t === 'road') return money(ROAD_PRICE);
    if (t === 'bulldoze') return money(BULLDOZE_PRICE);
    return money(BUILDINGS[t].price);
  }

  function build() {
    bar.innerHTML = '';
    for (const t of TOOLS) {
      const b = document.createElement('button');
      b.className = 'tool';
      b.dataset.tool = t;
      b.appendChild(Renderer.toolIcon(t, 44));
      b.insertAdjacentHTML('beforeend', '<span class="name"></span><span class="price"></span><span class="key">' + info(t).key + '</span>');
      b.addEventListener('click', () => pick(tool === t ? null : t, true));
      bar.appendChild(b);
      buttons[t] = b;
    }
    built = true;
    refresh();
  }

  function pick(t, fromClick) {
    if (t && city && !unlocked(t)) {
      Hud.showBanner(tr('{tool} opens when the city becomes a {title}', { tool: tr(info(t).name), title: tr(MILESTONES[info(t).unlock].name) }));
      Sfx.error();
      return;
    }
    tool = t;
    refresh();
    Toolbar.onPick(t, fromClick);
  }

  // the names (language), the locks and which prices are out of reach
  function refresh() {
    if (!built || !city) return;
    for (const t of TOOLS) {
      const b = buttons[t], d = info(t);
      const locked = !unlocked(t);
      b.classList.toggle('on', tool === t);
      b.classList.toggle('locked', locked);
      b.classList.toggle('poor', !locked && (BUILDINGS[t] ? BUILDINGS[t].price : 0) > city.money);
      b.querySelector('.name').textContent = tr(d.name);
      b.querySelector('.price').textContent = locked ? '🔒 ' + MILESTONES[d.unlock].icon : price(t);
      b.title = tr(d.name) + ' — ' + tr(d.desc) + (locked ? ' (' + tr('opens at {title}', { title: tr(MILESTONES[d.unlock].name) }) + ')' : '');
    }
  }

  // the keyboard shortcut of a tool, or null
  function toolForKey(k) {
    k = k.toLowerCase();
    return TOOLS.find((t) => info(t).key === k) || null;
  }

  return { build, pick, refresh, toolForKey, onPick: () => {}, get tool() { return tool; }, set visible(on) { bar.hidden = !on; } };
})();
