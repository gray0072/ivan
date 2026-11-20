'use strict';

// Lift Logic — the results of a run: the stars with every condition ✓ / ✗ and its number, "New best!", the
// numbers next to the Engineer's record (the reference solution on the same day), a bar per passenger's wait
// (the gave-ups red; a tap shows that moment), up to three Inspector notes with "Show me", one or two comic
// lines, the Museum card won, the difficulty, and Next / Edit / Retry / Buildings. After an exam's pass the
// building's newspaper. Used by ui/runbar.js.

const Results = (() => {
  const $ = (id) => document.getElementById(id);
  const records = {};
  let last = null;

  // the engineer's numbers on this mission and difficulty (the reference solution's run)
  function engineer(m, d) {
    const key = m.id + '/' + d;
    if (records[key] === undefined) {
      records[key] = null;
      if (SOLUTIONS[m.id]) {
        try { const res = simulate(m, Prog.parse(SOLUTIONS[m.id]), d); records[key] = res.stats; } catch (e) { records[key] = null; }
      }
    }
    return records[key];
  }

  function show(r, opts) {
    const m = r.mission, d = r.difficulty;
    const judged = Stars.judge(r);
    let stars = judged.stars;
    const capped = stars === 3 && Hints.capped(r.program);
    if (capped) stars = 2;
    const st = judged.stats;
    const eng = engineer(m, d);
    const medal = !!eng && judged.pass && (st.avgWait < eng.avgWait - 0.05 || st.energy < eng.energy);
    const saved = opts.cheated ? { better: false } : Progress.record(m, d, stars, { cheated: opts.cheated, medal });
    if (!judged.pass) Hints.failed();
    last = { r, stars, pass: judged.pass };

    $('resultTitle').textContent = judged.pass ? (stars === 3 ? tr('Perfect!') : tr('Mission passed!')) : tr('Not yet…');
    $('resultStars').innerHTML = [0, 1, 2].map((i) => '<span class="star' + (i < stars ? ' on' : '') + '" style="animation-delay:' + (0.25 + i * 0.3) + 's">★</span>').join('');
    $('resultBest').hidden = !saved.better || stars === 0;
    $('resultLines').innerHTML = judged.lines.map((l, i) => '<div class="sline ' + (l.ok ? 'ok' : 'no') + '"><span class="mark">' + (l.ok ? '✓' : '✗') + '</span><span>' +
      l.parts.map((p) => escapeHtml(tr(p.key, p.params)) + ' <b>' + escapeHtml(p.value) + '</b>').join(' + ') + '</span><span class="snum">' + '★'.repeat(i + 1) + '</span></div>').join('');

    // the numbers and the engineer's
    const row = (label, mine, theirs) => '<tr><td>' + label + '</td><td><b>' + mine + '</b></td><td>' + (theirs === undefined ? '' : theirs) + '</td></tr>';
    $('resultTable').innerHTML = '<tr><th></th><th>' + tr('You') + '</th><th>' + (eng ? tr('Engineer') : '') + '</th></tr>' +
      row(tr('Delivered'), st.delivered + ' / ' + st.total, eng ? eng.delivered + ' / ' + eng.total : undefined) +
      row(tr('Average wait'), fmtNum(st.avgWait) + ' s', eng ? fmtNum(eng.avgWait) + ' s' : undefined) +
      row(tr('Longest wait'), fmtNum(st.maxWait) + ' s', eng ? fmtNum(eng.maxWait) + ' s' : undefined) +
      row(tr('Energy'), st.energy + ' ⚡', eng ? eng.energy + ' ⚡' : undefined) +
      row(tr('Blocks'), String(st.blocks), eng ? String(eng.blocks) : undefined) +
      (st.gaveUp ? row(tr('Gave up'), String(st.gaveUp)) : '') +
      (medal ? '<tr><td colspan="3" class="medal">' + tr('🏅 You beat the engineer!') + '</td></tr>' : '');

    chart(st);
    notes(r);
    const jokes = opts.cheated || r.stopped ? [] : Jokes.forRun(r, stars);
    $('resultJokes').innerHTML = jokes.map((j) => '<p><span class="jicon">' + j.icon + '</span><i>“' + escapeHtml(j.text) + '”</i>' + (j.name ? ' <span class="jwho">— ' + escapeHtml(j.name) + '</span>' : '') + '</p>').join('');
    $('resultCard').innerHTML = saved.card ? museumCard(saved.card, true) : '';
    $('resultCheat').hidden = !opts.cheated;
    $('resultHint').hidden = !capped;
    const next = nextMission(m);
    $('nextBtn').hidden = !judged.pass || !next;
    $('nextBtn').classList.toggle('default', judged.pass);
    $('editBtn').classList.toggle('default', !judged.pass);
    Screens.show('result');
    if (judged.pass) { Sfx.pass(); for (let i = 0; i < stars; i++) setTimeout(() => Sfx.star(i), 300 + i * 300); } else Sfx.fail();
    if (judged.pass && m.kind === 'exam' && !opts.cheated) { fireworks.start(); }
    // the newspaper after an exam's first pass
    if (judged.pass && m.kind === 'exam' && !opts.cheated && !Progress.hasPaper(m.id)) {
      Progress.addPaper(m.id, true);
      setTimeout(() => { if (Screens.current === 'result') { $('paper').innerHTML = Jokes.paper(r); Screens.show('paper'); } }, 2600);
    }
  }

  function nextMission(m) {
    const i = MISSIONS.indexOf(m);
    const n = MISSIONS[i + 1];
    return n && Progress.missionOpen(n) ? n : null;
  }

  // a bar per person: the wait; red for those who gave up; a tap shows that moment
  function chart(st) {
    const el = $('resultChart');
    const ws = st.waits;
    if (!ws.length) { el.innerHTML = ''; return; }
    const max = Math.max(10, ...ws.map((w) => w.wait));
    el.innerHTML = '<div class="bars">' + ws.map((w, k) => '<span class="bar' + (w.state === 'gaveup' || w.furious ? ' bad' : '') + '" data-k="' + k + '" style="height:' +
      Math.max(4, Math.round(100 * w.wait / max)) + '%" title="' + escapeHtml(w.name + ': ' + fmtNum(w.wait) + ' s') + '"></span>').join('') + '</div>' +
      '<p class="fine">' + tr('Each bar is one person\'s wait. Tap a bar to see that moment.') + '</p>';
    el.querySelectorAll('.bar').forEach((b) => b.addEventListener('click', () => {
      const w = ws[+b.dataset.k];
      Runner.showMe(w.t0 + Math.min(w.wait, 20));
    }));
  }

  function notes(r) {
    const d = r.difficulty;
    const list = r.stopped ? [] : Inspector.notes(r);
    $('resultNotes').innerHTML = list.length ? '<p class="label">' + tr('The Inspector') + '</p>' + list.map((n, k) => {
      const params = Object.assign({}, n.params);
      if (n.params.msg) params.msg = tr(n.params.msg, n.params.msgParams);
      let extra = '';
      if (d !== 'hard' && n.tip) extra += '<div class="tip">' + escapeHtml(tr(n.tip, params)) + '</div>';
      if (d === 'easy' && n.block && BLOCK[n.block]) extra += '<div class="tip">' + tr('Try the block:') + ' <span class="miniBlock k-' + BLOCK[n.block].cat + '">' + escapeHtml(tr(BLOCK[n.block].text).replace(/%\d/g, '…')) + '</span></div>';
      return '<div class="note"><span>🔍</span><div>' + escapeHtml(tr(n.key, params)) + extra + '</div>' +
        (n.t !== null && n.t !== undefined ? '<button class="btn small" data-show="' + k + '">' + tr('Show me') + '</button>' : '') + '</div>';
    }).join('') : '';
    $('resultNotes').querySelectorAll('[data-show]').forEach((b) => b.addEventListener('click', () => Runner.showMe(list[+b.dataset.show].t)));
  }

  function museumCard(id, won) {
    const f = FACTS[id];
    if (!f) return '';
    return '<div class="mcard' + (won ? ' won' : '') + '"><div class="mIcon">' + f.icon + '</div><div><p class="label">' + (won ? tr('New card in the Lift Museum!') : '') + '</p><b>' +
      escapeHtml(tr(f.title)) + '</b><p>' + escapeHtml(tr(f.text)) + '</p></div></div>';
  }

  return { show, engineer, museumCard, get last() { return last; } };
})();
