'use strict';

// Arlanda Rising — the card of an aircraft tapped (or held) on the map: its airline's logo, the flight and type, where
// it is in its day, the planned and real times, its stand; at a stand the turnaround: the bar drawn over the aircraft
// (render/traffic.js, the same colours) and each of its steps in words with its swatch — what it does, what it waits
// for and who will do it (Turnaround.steps) —; when it still needs a stand, a reminder to tap one. Used by game.js;
// refreshed while it is open.

const FlightCard = (() => {
  const box = document.getElementById('flightCard');
  let fid = null;

  function open(f) { fid = f.id; render(); box.hidden = false; }
  function close() { fid = null; box.hidden = true; }

  function render() {
    if (!fid || !S || !S.ops) { if (!box.hidden) close(); return; }
    const f = Flights.get(fid);
    if (!f) { close(); return; }
    const a = AIRCRAFT[f.type], st = f.stand && Airport.stand(f.stand), tr0 = f.tr;
    const row = (k, v) => '<tr><td>' + Text.esc(k) + '</td><td>' + Text.esc(v) + '</td></tr>';
    let html = '<button class="x" aria-label="Close">✕</button><div class="fcHead"><img class="logo" alt="" src="' + Emblems.url(f.al, Calendar.year()) + '"><div><b>' + Text.esc(f.no) +
      '</b><small>' + Text.esc((AIRLINES[f.al] || {}).name || f.al) + ' · ' + Text.esc(a.name) + '</small></div></div>' +
      '<p class="state">' + Text.esc(Text.flightState(f)) + '</p><table>';
    if (f.sta !== null) html += row(tr('Arrival'), fmtClock(f.sta) + (f.eta !== null && Math.abs(f.eta - f.sta) >= 1 ? ' → ' + fmtClock(f.eta) : ''));
    html += row(tr('Departure'), fmtClock(f.std) + (f.offBlock !== null ? ' → ' + fmtClock(f.offBlock) : ''));
    html += row(tr('Stand'), st ? st.name + ' (' + st.code + (st.contact ? ', ' + tr('by the terminal') : ', ' + tr('remote')) + ')' : '—');
    html += row(tr('Size code'), Stands.codeOf(f.type));
    html += row(tr('Passengers'), f.training ? tr('training flight') : String(f.booked));
    if (f.mayday) html += row('🆘', tr('An emergency: it lands first'));
    if (AIRCRAFT[f.type].cat > Airport.fireCat() && !f.waiver) html += row('🚒', tr('Needs fire category {n}', { n: AIRCRAFT[f.type].cat }));
    html += '</table>';
    if (tr0 && (f.st === 'turn' || f.st === 'parked')) html += steps(f);
    if (S.ops.tasks.some((k) => k.kind === 'stand' && k.target === f.id)) html += '<p class="hintLine">' + Text.esc(tr('Tap a stand on the map for this aircraft.')) + '</p>';
    if (box.dataset.html !== html) { box.innerHTML = html; box.dataset.html = html; }
  }
  // ---------- the turnaround: the bar over the aircraft again, and each of its steps in words ----------
  const KEYS = ['off', 'svc', 'fuel', 'board'];
  const pct = (u) => Math.round(clamp(u, 0, 1) * 100);
  const mins = (t, end) => Math.max(1, Math.ceil(end - t));
  // who does a task asked for: the tray, a team, the system, the duty manager
  function who(w) {
    if (!w) return '';
    if (w.by === 'you') return tr('a task in your tray');
    const p = { time: fmtClock(w.at) };
    return w.by === 'people' ? tr('the team does it at {time}', p) : w.by === 'system' ? tr('done by the system at {time}', p) : tr('the duty manager does it at {time}', p);
  }
  // the fuel's (or the power's) source, in words
  function source(f, by) {
    return { truck: f.tr.truck !== undefined ? tr('Fuel truck') + ' ' + (f.tr.truck + 1) : '', robot: tr('by an apron robot'), oil: tr('by the oil company'),
      stand: tr("at the stand's charger"), mobile: tr('from the mobile charger'), h2: tr('from the hydrogen depot') }[by] || '';
  }
  // a step in words: [what it does now, a detail line (why it waits, who does it) or '']
  function words(key, s, f, t) {
    const going = () => tr('{p}% · {n} min left', { p: pct(s.u), n: mins(t, s.end) });
    if (s.st === 'done') return [key === 'off' && s.night ? tr('none: here overnight') : tr('done'), ''];
    if (key === 'off') return [going(), ''];
    if (key === 'svc') {
      const parts = s.bags ? tr('cleaning and catering {p}% · bags {q}%', { p: pct(s.timeU), q: pct(s.bagsU) }) : '';
      if (s.st === 'wait') return [tr('waiting for the baggage carts'), who(s.who)];
      if (s.st === 'later') return [tr('after the passengers are off'), ''];
      return [going(), parts];
    }
    if (key === 'fuel') {
      const src = source(f, s.by);
      if (s.st === 'later') return [tr('after the passengers are off'), src];
      if (s.st === 'coming') {
        const p = { n: mins(t, s.end) };
        return [s.by === 'robot' ? tr('the robot is coming · {n} min', p) : s.by === 'mobile' ? tr('the charger is coming · {n} min', p) : tr('the truck is coming · {n} min', p), src];
      }
      if (s.st === 'going') return [going(), src];
      if (s.why === 'truck') return [tr('waiting for a truck'), who(s.who)];
      if (s.why === 'charger') return [tr('waiting for the mobile charger'), who(s.who)];
      if (s.why === 'freeTruck') return [tr('all the trucks are busy: one is free at {time}', { time: fmtClock(s.at) }), ''];
      if (s.why === 'noTruck') return [tr('the airport has no fuel truck'), ''];
      return [s.at !== null ? tr('the charger is busy until {time}', { time: fmtClock(s.at) }) : tr('waiting for the mobile charger'), ''];
    }
    if (key === 'board') {
      if (s.st === 'going') return [going(), ''];
      if (s.why === 'pax') return [tr('waiting for {n} passengers still in the terminal', { n: s.n }), tr('the gate closes at {time}', { time: fmtClock(s.at) })];
      const fuelWord = { stand: tr('charge'), mobile: tr('charge'), electric: tr('charge'), h2: tr('hydrogen') }[Turnaround.fuelBy(f)] || tr('fuel');
      const what = s.need.map((n) => ({ svc: tr('services'), bags: tr('bags'), fuel: fuelWord }[n])).join(', ');
      if (s.st === 'wait') return [tr('held up: waits for {what}', { what }), tr('the departure at {time} will be late', { time: fmtClock(f.std) })];
      const from = s.at > t ? tr('not before {time}', { time: fmtClock(s.at) }) : '';
      return what ? [tr('after: {what}', { what }), from] : [from || tr('now'), ''];
    }
    // de-icing
    if (s.st === 'pad') return [tr('at the de-icing pad on the way out'), ''];
    if (s.st === 'later') return [tr('when boarding begins'), ''];
    if (s.st === 'going') return [going(), ''];
    if (s.why === 'deicer') return [tr('waiting for a de-icing truck'), who(s.who)];
    return [tr('all the de-icers are busy: one is free at {time}', { time: fmtClock(s.at) }), ''];
  }
  function steps(f) {
    const t = Sim.clockNow(), S5 = Turnaround.steps(f, t), C = Traffic.STEP_COL;
    const by = S5.fuel.by, fuelName = by === 'h2' ? tr('Hydrogen') : by === 'stand' || by === 'mobile' || by === 'electric' ? tr('Charge') : tr('Fuel');
    const names = { off: tr('Passengers off'), svc: tr('Services'), fuel: fuelName, board: tr('Boarding'), deice: tr('De-icing') };
    // the bar, as over the aircraft (render/traffic.js gantt)
    const cell = (s, col, cls) => '<span' + (cls ? ' class="' + cls + '"' : '') + (s.st === 'wait' ? ' style="background:' + C.wait + '"' : '') + '>' +
      (s.st === 'coming' ? '<i class="pale" style="width:' + pct(s.drive) + '%;background:' + col + '"></i>' : '') +
      '<i style="' + (cls ? 'height:' + pct(s.u) + '%' : 'width:' + pct(s.u) + '%') + ';background:' + col + '"></i></span>';
    const de = S5.deice;
    let h = '<div class="tbar">' + KEYS.map((k) => cell(S5[k], C[k])).join('') + (de && de.st !== 'pad' ? cell(de, C.deice, 'dx') : '') + '</div><table class="steps">';
    for (const k of KEYS.concat(de ? ['deice'] : [])) {
      const s = S5[k], [now, why] = words(k, s, f, t);
      h += '<tr><td><i class="sw" style="background:' + C[k] + (s.st === 'wait' ? ';box-shadow:0 0 0 2px ' + C.wait : '') + '"></i>' + Text.esc(names[k]) + '</td><td' +
        (s.st === 'wait' ? ' class="held"' : '') + '>' + Text.esc(now) + (why ? '<small>' + Text.esc(why) + '</small>' : '') + '</td></tr>';
    }
    return h + '</table><p class="legend">' + Text.esc(tr('Orange: held up. Pale: a vehicle on its way.')) + '</p>';
  }

  box.addEventListener('click', (e) => { if (e.target.closest('.x')) { close(); Game.pick = null; } });

  return { open, close, render, get id() { return fid; } };
})();
