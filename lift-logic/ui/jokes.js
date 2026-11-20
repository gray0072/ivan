'use strict';

// Lift Logic — the comic lines of a run's results and the building's newspaper. The first line is about the
// run's most notable trait (someone gave up, a long wait, empty trips, the full lift, the prankster, rides
// the wrong way first, a chatty lift, an energy record), measured against JOKE in constants.js; with nothing
// rough, a good-run or a ★★★ line. The second is about a moment of the day (the cake, an emergency, a lift
// out of order, a bed, lunch, Tommy's buttons cancelled…) or the building. The pick is a
// hash of the mission and the run's numbers, so the same run always shows the same lines (also after a
// language switch). Texts in data/jokes.js. Used by ui/results.js.

const Jokes = (() => {
  function pick(list, h) { return list[h % list.length]; }
  function who(w, m) {
    if (w === 'gears') return { icon: '👴', name: 'Grandpa Gears' };
    if (w === 'client') return { icon: '💬', name: BUILDING[m.building].client.name };
    const c = PEOPLE[w] || PEOPLE.neighbour;
    return { icon: '💬', name: c.name || '' };
  }
  function line(entry, params, m) {
    const w = who(entry[0], m);
    return { icon: w.icon, name: w.name, text: tr(entry[1], params) };
  }

  // [{ icon, name, text }] for a finished run
  function forRun(r, stars) {
    const m = r.mission, st = Stats.compute(r);
    const h = hashOf(m.id, st.delivered, st.gaveUp, Math.round(st.avgWait * 10), st.energy, st.blocks);
    const out = [];
    const longest = st.waits.reduce((a, b) => (!a || b.wait > a.wait ? b : a), null);
    const gave = r.people.find((p) => p.state === 'gaveup' || p.furious);
    let first = null;
    if (gave) first = line(pick(JOKES.gaveUp, h), { name: gave.name }, m);
    else if (longest && longest.wait >= JOKE.longWait) first = line(pick(JOKES.longWait, h), { name: longest.name, s: Math.round(longest.wait), f: longest.from }, m);
    else if (st.emptyTrips >= JOKE.emptyTrips) first = line(pick(JOKES.emptyTrips, h), { n: st.emptyTrips }, m);
    else if (st.fullStops >= JOKE.fullPass) first = line(pick(JOKES.fullPass, h), {}, m);
    else if (st.pranks > 0) first = line(pick(JOKES.prank, h), {}, m);
    else if (st.wrongWay >= JOKE.wrongWay) first = line(pick(JOKES.wrongWay, h), { n: st.wrongWay }, m);
    else if (st.says >= JOKE.says) first = line(pick(JOKES.says, h), { n: st.says }, m);
    else if (stars >= 3) first = line(pick(JOKES.perfect, h), {}, m);
    else first = line(pick(JOKES.good, h), {}, m);
    out.push(first);
    // a moment of the day, else the building's own line
    const has = (who) => r.people.some((p) => p.who === who && p.state === 'done');
    const served = r.log.filter((e) => e.type === 'emergencyServed');
    const broken = r.lifts.find((L) => !L.working);
    let moment = null, params = {};
    if (has('chef')) moment = JOKES_MOMENT('cake', h);
    else if (has('courier')) moment = JOKES_MOMENT('pizza', h);
    else if (has('postman')) moment = JOKES_MOMENT('postman', h);
    else if (has('grandson')) moment = JOKES_MOMENT('moving', h);
    else if (served.length) { moment = JOKES_MOMENT('emergency', h); params = { s: Math.round(served.reduce((a, e) => Math.max(a, e.waited), 0)) }; }
    else if (broken) { moment = JOKES_MOMENT('broken', h); params = { l: broken.letter }; }
    else if (has('bed')) moment = JOKES_MOMENT('bed', h);
    else if (has('cook')) moment = JOKES_MOMENT('lunch', h);
    else if (r.counters.cancels > 0) moment = JOKES_MOMENT('prankster', h);
    if (moment) out.push(line(moment, params, m));
    else if (BUILDING_LINES[m.building]) out.push(line(pick(BUILDING_LINES[m.building], h >>> 3), {}, m));
    return out;
  }
  function JOKES_MOMENT(k, h) { return pick(MOMENTS[k], h >>> 5); }

  // the newspaper's front page after an exam
  function paper(r) {
    const m = r.mission, b = BUILDING[m.building], st = Stats.compute(r);
    const h = hashOf(m.id, st.delivered, st.energy);
    const head = tr(pick(HEADLINES, h), { n: st.delivered, b: tr(b.name).toUpperCase() });
    const lines = forRun(r, 3);
    const next = BUILDINGS.find((x) => x.chapter === b.chapter + 1);
    return '<div class="paperName">' + escapeHtml(tr(b.paper || b.name)) + '</div>' +
      '<div class="paperDate">' + tr('Special edition') + ' · ' + escapeHtml(tr(m.name)) + '</div>' +
      '<h2 class="headline">' + escapeHtml(head) + '</h2>' +
      '<div class="paperCols"><div>' + lines.map((l) => '<p><i>“' + escapeHtml(l.text) + '”</i> — ' + escapeHtml(l.name) + '</p>').join('') + '</div>' +
      '<div><p><b>' + escapeHtml(tr(b.client.name)) + ':</b> ' + escapeHtml(tr('"Lifty is the best thing that happened to this building."')) + '</p>' +
      (next ? '<p class="fine">' + tr('Tomorrow\'s forecast: big things at {b}.', { b: tr(next.name) }) + '</p>' : '') + '</div></div>';
  }

  return { forRun, paper };
})();
