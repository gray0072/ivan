'use strict';

// Arlanda Rising — the HUD over the map in a running stage: money (opens the money card), the date and clock, the
// weather now (temperature, wind, snow, fog, the dark), the five meters, the speed buttons ⏸ ▶ ▶▶ ▶▶▶, Skip to the
// next event, pause; and the stage's goals with their values right now. Refreshed a few times a second by
// game.js.

const Hud = (() => {
  const $ = (id) => document.getElementById(id);
  let built = false, last = 0, hudH = 0;

  function build() {
    $('meters').innerHTML = METERS.map((m) =>
      '<div class="meter" data-m="' + m.k + '" title=""><span class="mi">' + m.icon + '</span><div class="mbar"><i></i></div><b></b></div>').join('');
    built = true;
  }

  function wind(w) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return tr(dirs[Math.round(w.windDir / 45) % 8]) + ' ' + w.wind + ' ' + tr('kt');
  }

  function update(force) {
    const now = performance.now();
    if (!force && now - last < 200) return;
    last = now;
    if (!built) build();
    if (!S || !S.mission) return;
    // the panels under the HUD start below it, however many rows it takes
    const h = $('hud').offsetHeight;
    if (h && h !== hudH) { hudH = h; document.documentElement.style.setProperty('--hudH', h + 'px'); }
    $('money').textContent = sek(S.money);
    $('moneyChip').classList.toggle('debt', S.money < 0);
    if (S.ops) {
      $('date').textContent = fmtDate(S.day) + ' · ' + fmtClock(S.clock);
      const w = Weather.now(), parts = [Math.round(w.temp) + '°', wind(w)];
      if (w.snow > 0) parts.push('❄️ ' + Text.num(w.snow, 1) + ' ' + tr('mm/h'));
      if (w.vis < 3000) parts.push('🌫️ ' + w.vis + ' ' + tr('m'));
      if (w.dark) parts.push('🌙');
      $('wx').textContent = parts.join(' · ');
      $('wxChip').hidden = false;
    } else if (S.plan) {
      $('date').textContent = fmtDate(S.day);
      $('wx').textContent = tr('Day {d} of {n}', { d: S.day - S.plan.day0 + 1, n: S.plan.end - S.plan.day0 });
      $('wxChip').hidden = false;
    }
    for (const m of METERS) {
      const el = document.querySelector('.meter[data-m="' + m.k + '"]'), v = S.meters[m.k];
      el.querySelector('i').style.width = Math.round(v) + '%';
      el.querySelector('i').className = v < 40 ? 'low' : v < 60 ? 'mid' : '';
      el.querySelector('b').textContent = m.k === 'passengers' ? Text.paxStars(v) + '★' : Math.round(v);
      el.title = Text.meterName(m.k);
    }
    document.querySelectorAll('.speeds button').forEach((b) => b.classList.toggle('on', +b.dataset.speed === Game.speed));
    $('skipBtn').disabled = !(S.ops && !S.ops.tasks.length && Game.speed > 0);
    goals();
  }

  // the stage's goals, live
  function goals() {
    const box = $('goalsBox');
    const stage = Missions.stage();
    if (!stage || S.plan) { box.hidden = true; return; }
    const res = Goals.all(stage.goal, S.mission.st);
    const head = '<div class="gHead"><b>' + Text.esc(tr(stage.name)) + '</b><span>' + (S.mission.stage + 1) + '/' + Missions.def().stages.length + '</span></div>';
    const html = head + (res.length ? Text.goalsHtml(res) : '<p class="fine">' + Text.esc(tr('No goal in this stage: get ready for the next one.')) + '</p>');
    if (box.dataset.html !== html) { box.innerHTML = html; box.dataset.html = html; }
    box.hidden = false;
  }

  return { update };
})();
