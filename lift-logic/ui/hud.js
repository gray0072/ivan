'use strict';

// Lift Logic — what sits over the building and the code: the HUD chips (the clock, delivered / total,
// waiting now, gave up, energy), the three star targets in the top bar that light up while the run meets
// them, the block count ("Blocks 9 / 12"), short toasts and banners, and the cards that open when a person
// or a cabin is tapped. Used by game.js, the view and the editor.

const Hud = (() => {
  const $ = (id) => document.getElementById(id);
  let toastTimer = 0, bannerTimer = 0;

  function update() {
    if (!run) return;
    $('hClock').textContent = '🕒 ' + fmtClock(Sensors.clock());
    $('hDone').textContent = '✓ ' + run.delivered + ' / ' + run.total;
    let waiting = 0;
    for (const q of run.queues) waiting += q.length;
    $('hWait').textContent = '🙂 ' + waiting;
    $('hGone').hidden = !run.gaveUp;
    $('hGone').textContent = '🚶 ' + run.gaveUp;
    $('hEnergy').textContent = '⚡ ' + Math.round(run.energy);
  }

  // the three star targets: ✓ while the run meets them (as far as can be told before the end)
  function targets(m, live) {
    const el = $('targets');
    if (!m) { el.innerHTML = ''; return; }
    const html = m.stars.map((cond, i) => {
      const list = Array.isArray(cond) ? cond : [cond];
      const tip = list.map((c) => { const l = Stars.label(Stars.scaled(c, Screens.difficulty)); return tr(l.key, l.params); }).join(' + ');
      let state = '';
      if (live && run) {
        const st = Stats.compute(run);
        const ok = list.every((c) => liveOk(Stars.scaled(c, Screens.difficulty), st));
        state = ok ? ' on' : ' off';
      }
      return '<span class="tgt' + state + '" title="' + escapeHtml(tip) + '">★</span>';
    }).join('');
    if (el.innerHTML !== html) el.innerHTML = html;
  }
  // can the run still meet this test
  function liveOk(c, st) {
    switch (c.k) {
      case 'all': case 'noGaveUp': return st.gaveUp + st.furious === 0;
      case 'gaveUpMax': return st.gaveUp + st.furious <= c.n;
      case 'avgWait': return st.avgWait <= c.s;
      case 'maxWait': return st.maxWait <= c.s;
      case 'energy': return st.energy <= c.e;
      case 'blocks': return st.blocks <= c.n;
      case 'emptyMax': return st.emptyTrips <= (c.n || 0);
      default: return true;
    }
  }

  function blockCount() {
    const el = $('blockCount');
    const m = Editor.mission;
    const n = Editor.count();
    let limit = null;
    if (m) for (const cond of m.stars) for (const c of (Array.isArray(cond) ? cond : [cond])) if (c.k === 'blocks') limit = c.n;
    el.textContent = limit ? tr('Blocks {n} / {max}', { n, max: limit }) : tr('Blocks {n}', { n });
    el.classList.toggle('over', limit !== null && n > limit);
    $('undoBtn').disabled = !Editor.canUndo;
    $('redoBtn').disabled = !Editor.canRedo;
  }

  function toast(text, ms = 2600) {
    const t = $('toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }
  function banner(text, ms = 1800) {
    const b = $('banner');
    b.textContent = text;
    b.hidden = false;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => { b.hidden = true; }, ms);
  }

  // ---------- the cards ----------
  function placeCard(x, y) {
    const c = $('card'), s = $('stage').getBoundingClientRect();
    c.hidden = false;
    c.style.left = clamp(x + 10, 6, s.width - c.offsetWidth - 6) + 'px';
    c.style.top = clamp(y - c.offsetHeight - 10, 6, s.height - c.offsetHeight - 6) + 'px';
  }
  function personCard(p, x, y) {
    const c = PEOPLE[p.who] || PEOPLE.neighbour;
    const waited = Math.round(run.t - p.t0);
    const moods = ['🙂', '😐', '😟', '😠'];
    $('card').innerHTML = '<b>' + escapeHtml(p.name) + ' ' + moods[p.mood] + '</b>' +
      '<div>' + tr('Floor {a} → floor {b}', { a: p.from, b: p.to }) + '</div>' +
      '<div>' + tr('Waiting {s} s', { s: waited }) + (p.furious ? ' · ' + tr('furious!') : '') + '</div>' +
      '<div class="quote">“' + escapeHtml(tr(p.mood >= 2 ? c.angry : c.line)) + '”</div>' +
      (View.st.eyes ? '<div class="fine">' + tr('The lift can\'t see this person — only the button they pressed.') + '</div>' : '');
    placeCard(x, y);
  }
  function cabinCard(L, x, y) {
    const vars = Object.keys(L.vars).map((k) => escapeHtml(k) + ' = ' + escapeHtml(VM.toStr(L.vars[k]))).join(', ');
    $('card').innerHTML = '<b>' + tr('Lift {l}', { l: L.letter }) + '</b>' +
      '<div>' + tr('Floor {f}, {d}', { f: Lift.floor(L), d: tr(Lift.direction(L)) }) + '</div>' +
      '<div>' + tr('Plan: {p}', { p: L.plan.length ? L.plan.join(', ') : tr('empty') }) + '</div>' +
      '<div>' + tr('Load {p}% ({n} people)', { p: Lift.loadPct(L), n: L.riders.length }) + '</div>' +
      '<div>' + tr('Buttons inside: {b}', { b: L.cabin.size ? [...L.cabin].join(', ') : '—' }) + '</div>' +
      (vars ? '<div>' + vars + '</div>' : '');
    placeCard(x, y);
  }
  function closeCard() { $('card').hidden = true; }
  $('card').addEventListener('click', closeCard);

  return { update, targets, blockCount, toast, banner, personCard, cabinCard, closeCard };
})();
