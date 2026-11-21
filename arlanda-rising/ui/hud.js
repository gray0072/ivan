'use strict';

// Arlanda Rising — the HUD over the map in a running stage: money (opens the money card), the date and clock, the
// weather now (temperature, wind, snow, fog, the dark), the five meters, the speed buttons ⏸ ▶ ▶▶ ▶▶▶, Skip to the
// next event, pause; and the stage's goals with their values right now. Refreshed a few times a second by
// game.js.

// a phone held upright: the money in the HUD without its currency, so the first row keeps its width
const PHONE_UPRIGHT = window.matchMedia('(max-width: 600px) and (orientation: portrait)');

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
    $('money').textContent = PHONE_UPRIGHT.matches ? moneyBare(S.money) : sek(S.money);
    $('moneyChip').classList.toggle('debt', S.money < 0);
    // earning or spending: the mission's income less its costs so far
    const res = Missions.result(), tr$ = $('trend');
    tr$.textContent = (res > 0 ? '+' : '') + (Math.abs(res) < 1 ? '0' : moneyBare(res));
    tr$.className = res >= 1 ? 'up' : res <= -1 ? 'down' : '';
    $('moneyChip').title = tr('Money') + ' · ' + tr('This mission so far: income less costs {m}', { m: sek(res) });
    // how far the stage is: the clock between its start and end, or its days
    const prog = S.ops ? (S.clock - S.ops.from) / (S.ops.to - S.ops.from) : S.plan ? (S.day - S.plan.day0) / (S.plan.end - S.plan.day0) : 0;
    $('dateChip').querySelector('.prog i').style.width = Math.round(clamp(prog, 0, 1) * 100) + '%';
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
    // session 5: the green rating, once the owner counts it (chapter 6)
    const g = $('greenChip');
    if (g) {
      g.hidden = !Green.on();
      if (Green.on()) {
        const p = Green.permit();
        g.querySelector('b').textContent = Green.rating();
        g.classList.toggle('debt', !!(p && p.broken));
        g.title = tr('Green rating') + (S.airport.permit ? ' · ' + tr('Flights a day {n} of {cap} allowed', { n: Math.round(Green.perDay()), cap: S.airport.permit.perDay || '—' }) : '');
      }
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
    const head = '<div class="gHead"><b>' + Text.esc(tr(stage.name)) + '</b><span>' + Text.esc(tr('Stage {a} of {n}', { a: S.mission.stage + 1, n: Missions.def().stages.length })) + '</span></div>';
    // the time left in the stage, to its end on the clock
    const left = S.ops ? Math.ceil(S.ops.to - S.clock) : 0;
    const when = !S.ops ? '' : '<div class="gLeft">⏱ ' + Text.esc(left > 0 ? tr('Until {t}: {d} left', { t: fmtClock(S.ops.to), d: Text.duration(left) }) : tr('Time is up: the last flights are finishing')) + '</div>';
    const html = head + when + (res.length ? Text.goalsHtml(res) : '<p class="fine">' + Text.esc(tr('No goal in this stage: get ready for the next one.')) + '</p>') + Text.missionGoals();
    if (box.dataset.html !== html) { box.innerHTML = html; box.dataset.html = html; }
    box.hidden = false;
  }

  return { update };
})();
