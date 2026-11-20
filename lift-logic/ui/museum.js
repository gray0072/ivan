'use strict';

// Lift Logic — the Lift Museum: a grid of the cards won (each mission's first pass adds one, the rest are grey
// frames with "?"), a card opens big with its text and where the fact comes from; below, Grandpa Gears'
// concept cards. Used by ui/screens.js.

const Museum = (() => {
  const $ = (id) => document.getElementById(id);
  function render() {
    const p = Progress.data;
    const ids = [];
    for (const m of MISSIONS) if (m.fact && FACTS[m.fact] && ids.indexOf(m.fact) < 0) ids.push(m.fact);
    const won = ids.filter((id) => p.museum[id]).length;
    $('museumCount').textContent = tr('{n} of {m} cards', { n: won, m: ids.length });
    $('museumGrid').innerHTML = ids.map((id) => p.museum[id]
      ? '<button class="mtile" data-fact="' + id + '"><span class="mIcon">' + FACTS[id].icon + '</span><span>' + escapeHtml(tr(FACTS[id].title)) + '</span></button>'
      : '<div class="mtile locked"><span class="mIcon">?</span></div>').join('');
    const cids = [];
    for (const m of MISSIONS) if (m.concept && CONCEPTS[m.concept] && cids.indexOf(m.concept) < 0) cids.push(m.concept);
    $('conceptGrid').innerHTML = cids.map((id) => p.concepts[id]
      ? '<button class="mtile concept" data-concept="' + id + '"><span class="mIcon">👴</span><span>' + escapeHtml(tr(CONCEPTS[id].title)) + '</span></button>'
      : '<div class="mtile locked"><span class="mIcon">?</span></div>').join('');
  }
  document.getElementById('museumPanel').addEventListener('click', (e) => {
    const f = e.target.closest('[data-fact]');
    if (f) { const x = FACTS[f.dataset.fact]; Slots.info(x.icon + ' ' + tr(x.title), '<p>' + escapeHtml(tr(x.text)) + '</p><p class="fine">' + tr('Source:') + ' ' + escapeHtml(x.source) + '</p>'); }
    const c = e.target.closest('[data-concept]');
    if (c) { const x = CONCEPTS[c.dataset.concept]; Slots.info('👴 ' + tr(x.title), '<p>' + escapeHtml(tr(x.text)) + '</p><p><i>' + escapeHtml(tr(x.like)) + '</i></p>'); }
  });
  return { render };
})();
