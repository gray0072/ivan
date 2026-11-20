'use strict';

// Arlanda Rising — the card of an aircraft tapped (or held) on the map: its airline's logo, the flight and type, where
// it is in its day, the planned and real times, its stand and the turnaround's steps; when it still needs a stand,
// a reminder to tap one. Used by game.js; refreshed while it is open.

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
    if (tr0) {
      const fuel = { wait: tr('later'), asked: tr('waiting for a truck'), queued: tr('the truck is coming'), going: tr('fuelling'), done: tr('done') }[tr0.fuel];
      html += row(tr('Fuel'), fuel || '');
      if (tr0.bags) html += row(tr('Bags'), { asked: tr('waiting for the carts'), going: tr('the carts are there'), done: tr('done') }[tr0.bags] || '');
      html += row(tr('Boarding'), tr0.ready !== null ? tr('done') : tr0.board !== null ? tr('now') : tr('later'));
    }
    if (f.mayday) html += row('🆘', tr('An emergency: it lands first'));
    if (AIRCRAFT[f.type].cat > Airport.fireCat() && !f.waiver) html += row('🚒', tr('Needs fire category {n}', { n: AIRCRAFT[f.type].cat }));
    html += '</table>';
    if (S.ops.tasks.some((k) => k.kind === 'stand' && k.target === f.id)) html += '<p class="hintLine">' + Text.esc(tr('Tap a stand on the map for this aircraft.')) + '</p>';
    if (box.dataset.html !== html) { box.innerHTML = html; box.dataset.html = html; }
  }
  box.addEventListener('click', (e) => { if (e.target.closest('.x')) { close(); Game.pick = null; } });

  return { open, close, render, get id() { return fid; } };
})();
