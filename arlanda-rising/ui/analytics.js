'use strict';

// Arlanda Rising — the analytics tabs of the Finance screen (SPEC.md "Screens"): beside the money, one tab for each of the
// five meters and, from chapter 6, the green rating. Each shows the value now, what makes it up — the things pulling it
// up or down now, worked out with the sim's own rules (sim/meters.js, sim/people.js, sim/green.js) from the mission so
// far — a breakdown where it has one (the airlines' moods, the departments, the green rating's points) and a chart of its
// history from S.stats (sim/stats.js): the recent quarter hours of the ops stages and days of the plan stages, or month
// by month, with a second measure as bars under the line (passengers a day, on-time departures, noise, staff away, close
// calls). Drawn in the style of the money chart. Used by ui/finance.js.
// Also the tab bar the Ops Center (ui/opscenter.js), Finance and Departments (ui/people.js) share, and InfoTabs, which
// switches between them, so that to the player they are one screen with tabs. Used by game.js and ui/office.js too.

// the tabs in their order: the Ops Center, the money, the meters in the HUD's order (ui/text.js METERS) with
// Departments beside Staff, and the green rating; `screen`: a screen of its own, not an analytics page of Finance
const STATS_TABS = [
  { k: 'ops', icon: '🛠️', name: 'Ops Center', screen: true },
  { k: 'finance', icon: '📊', name: 'Finance' },
  { k: 'airlines', icon: '✈️', name: 'Airlines' },
  { k: 'passengers', icon: '🧳', name: 'Passengers' },
  { k: 'neighbours', icon: '🏡', name: 'Neighbours' },
  { k: 'staff', icon: '👷', name: 'Staff' },
  { k: 'people', icon: '👥', name: 'Departments', screen: true },
  { k: 'safety', icon: '🛡️', name: 'Safety' },
  { k: 'green', icon: '🌿', name: 'Green rating' }
];

// the tab bar's screens as one: a tab opens its screen with the same Back and the same editing as the tab it was opened
// on — `edit.ops` the Ops Center's (true / false), `edit.people` Departments' (true / 'heads' / false); Finance has none
const InfoTabs = (() => {
  let ctx = { back: () => {}, edit: {} };
  // open(tab, { back, edit }) from outside (game.js, ui/office.js); open(tab) from a tab of the bar
  function open(tab, opts) {
    if (opts) ctx = { back: opts.back, edit: opts.edit || {} };
    if (tab === 'ops') OpsCenter.show({ back: ctx.back, edit: !!ctx.edit.ops });
    else if (tab === 'people') PeopleUI.show({ back: ctx.back, edit: ctx.edit.people });
    else FinanceUI.show({ back: ctx.back, tab });
  }
  return { open };
})();

// the green rating's points as shown (sim/green.js parts)
const GREEN_PART_NAMES = { base: 'The airport itself', train: 'Arlanda Express', bus: 'Airport coach stops', aquifer: 'The aquifer energy store', solar: 'Solar park',
  glycol: 'Glycol recovery', biofuel: 'Biofuel', electric: 'Electric apron vehicles', carPark: 'Car park (1 200 places)', charger: 'Charging stand',
  nightTrain: 'Night train platform', h2: 'Hydrogen depot', greenPier: 'The green pier\'s solar roof' };

const Analytics = (() => {
  const esc = (s) => Text.esc(s);
  const signed = (v, d) => (v > 0 ? '+' : v < 0 ? '−' : '') + Text.num(Math.abs(v), d || 0);
  const bar = (v) => '<span class="mbar small"><i class="' + (v < 40 ? 'low' : v < 60 ? 'mid' : '') + '" style="width:' + Math.round(clamp(v, 0, 100)) + '%"></i></span>';

  // the tabs there are now: the green rating once the owner counts it
  function tabs() { return STATS_TABS.filter((t) => t.k !== 'green' || Green.on()); }
  // the bar; on a phone the tabs show their icon only (styles.css), the name stays as the tooltip and the label
  function tabsHtml(cur) {
    return '<div class="tabs stats" role="group">' + tabs().map((t) => '<button class="btn toggle' + (t.k === cur ? ' on' : '') + '" data-tab="' + t.k + '" title="' + esc(tr(t.name)) +
      '" aria-label="' + esc(tr(t.name)) + '"' + (t.k === cur ? ' aria-pressed="true"' : '') + '>' + t.icon + '<span class="tn"> ' + esc(tr(t.name)) + '</span></button>').join('') + '</div>';
  }

  // the mission's counters so far (null outside a mission)
  function sofar() { return S.mission ? Missions.liveTotal() : null; }
  // a table of what pulls a value: [what, its value now, points (+ up, − down; null: none to show)]
  function factors(rows) {
    rows = rows.filter(Boolean);
    if (!rows.length) return '';
    return '<table class="books fac">' + rows.map((r) => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td class="' + (r[2] === null ? '' : r[2] < 0 ? 'neg' : r[2] > 0 ? 'pos' : '') + '">' +
      (r[2] === null ? '' : signed(r[2], Math.abs(r[2]) < 10 && r[2] % 1 ? 1 : 0)) + '</td></tr>').join('') + '</table>';
  }
  function card(title, body) { return '<div class="ocard"><h3>' + title + '</h3>' + body + '</div>'; }
  function nowCard(t, value, shown, line) {
    return card(t.icon + ' ' + esc(tr('Now')), '<p class="big">' + shown + '</p><p class="kv">' + bar(value) + ' <b>' + Math.round(value) + '</b> <small>/ 100</small></p>' + (line ? '<p class="fine">' + esc(line) + '</p>' : ''));
  }
  const avg = (sum, n) => (n ? sum / n : 0);
  const minutes = (v) => Text.num(v, 1) + ' ' + tr('min');

  // ---------- the tabs ----------
  function passengers(t) {
    const v = S.meters.passengers, tot = sofar(), rows = [];
    let target = 92;
    if (tot && tot.dep) {
      const waits = [['Check-in wait', tot.paxWaitSum, tot.paxServed], ['Security wait', tot.secWaitSum, tot.secServed], ['Border wait', tot.borderWaitSum, tot.borderServed]];
      for (const w of waits) if (w[2]) { const m = w[1] / w[2]; rows.push([tr(w[0]), minutes(m), -m * 1.2]); target -= m * 1.2; }
      const d = avg(tot.delaySum, tot.dep), dp = -Math.max(0, d - 5) * 0.8;
      rows.push([tr('Average delay'), minutes(d), dp]); target += dp;
      if (tot.lostBags) { const p = -LOST_BAG_MOOD * Math.min(1, tot.lostBags / tot.dep); rows.push([tr('Bags lost'), String(tot.lostBags), p]); target += p; }
      if (tot.unannounced) { const p = -ANNOUNCE_MOOD * tot.unannounced / tot.dep; rows.push([tr('Delays not announced'), String(tot.unannounced), p]); target += p; }
      if (tot.missed) rows.push([tr('Passengers who missed their flight'), groupThousands(tot.missed), null]);
      if (tot.diverted + tot.cancelled) rows.push([tr('Flights sent away or cancelled'), String(tot.diverted + tot.cancelled), null]);
    }
    const ground = Terminal.groundPax();
    if (ground) { rows.push([tr('The way to the airport: coaches, the train, the hotel'), '', ground]); target += ground; }
    const brands = Object.keys(TERMINALS).reduce((m, k) => Math.max(m, Terminal.paxBonus(k)), 0);
    if (brands) { rows.push([tr('The brands in the terminals'), '', brands]); target += brands; }
    if (Turnaround.hot() && !S.flags.cooled) { rows.push([tr('A hot terminal not cooled'), '', -HEAT_PAX]); target -= HEAT_PAX; }
    let html = '<div class="cards">' + nowCard(t, v, Text.paxStars(v) + '★', tr('From 1 to 5 stars: how the passengers find the airport.'));
    html += card('⚖️ ' + esc(tr('What moves it')), (tot && tot.dep ? '<p class="fine">' + esc(tr('This mission so far: {n} departures.', { n: tot.dep })) + '</p>' : '') + factors(rows) +
      '<p class="fine">' + esc(tot && tot.dep ? tr('Each departure pulls the meter toward how its passengers found it: about {n} now.', { n: Math.round(clamp(target, 0, 100)) })
        : tr('Flights move it: in an operations stage each departure pulls it toward how its passengers found it — 92, less the waits, the delay, a walk from a remote stand, missed flights and lost bags.')) + '</p>') + '</div>';
    return html;
  }

  function airlines(t) {
    const v = S.meters.airlines, tot = sofar(), rows = [];
    if (tot && tot.dep) {
      rows.push([tr('On time'), Text.pct(tot.onTime / tot.dep), null]);
      rows.push([tr('Average delay'), minutes(avg(tot.delaySum, tot.dep)), null]);
      const ad = avg(tot.adelaySum, tot.dep);
      rows.push([tr('Delay caused by the airport'), minutes(ad), -Math.max(0, ad - 5) * 1.5]);
      if (tot.diverted + tot.cancelled) rows.push([tr('Flights sent away or cancelled'), String(tot.diverted + tot.cancelled), null]);
    }
    const fee = FEE_MOOD[S.airport.fees] || 0;
    rows.push([tr('Fees'), tr({ low: 'Low', normal: 'Normal', high: 'High' }[S.airport.fees] || 'Normal'), fee]);
    const calm = S.domains.stands >= 1 ? People.perk('stands', 'mood') : 0;
    if (calm) rows.push([tr('A head of operations who knows every airline: moods fall more slowly'), Text.pct(calm), null]);
    let html = '<div class="cards">' + nowCard(t, v, String(Math.round(v)), tr('The airlines\' moods, weighted by their flights a day.'));
    html += card('⚖️ ' + esc(tr('What moves it')), (tot && tot.dep ? '<p class="fine">' + esc(tr('This mission so far: {n} departures.', { n: tot.dep })) + '</p>' : '') + factors(rows) +
      '<p class="fine">' + esc(tr('Each departure pulls its airline\'s mood toward 92, less the delay the airport caused and a remote stand for an airline that wants a jet bridge; the fees move every mood once a month.')) + '</p>') + '</div>';
    // each airline: its flights a day and its mood
    const list = Object.keys(S.airlines).map((code) => ({ code, n: Airlines.perDay(code), mood: S.airlines[code].mood })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
    if (list.length) {
      const y = Calendar.year();
      html += '<p class="label">' + esc(tr('Airlines')) + '</p><table class="ops brk"><tr><th></th><th>' + esc(tr('Flights a day')) + '</th><th>' + esc(tr('Mood')) + '</th></tr>' +
        list.map((x) => '<tr><td><img class="emb" src="' + Emblems.url(x.code, y) + '" alt=""> ' + esc((AIRLINES[x.code] || {}).name || x.code) + '</td><td>' + Text.num(x.n, 1) + '</td><td class="nw">' +
          bar(x.mood) + ' <b>' + Math.round(x.mood) + '</b></td></tr>').join('') + '</table>';
    }
    return html;
  }

  function neighbours(t) {
    const v = S.meters.neighbours, tot = sofar(), base = S.airport.neighboursBase || 72, rows = [];
    rows.push([tr('With no noise it settles at'), String(Math.round(base)), null]);
    if (tot && (tot.arr + tot.dep)) {
      const moves = tot.arr + tot.dep, u = tot.noise / moves;
      rows.push([tr('Noise this mission'), Text.num(tot.noise, 0) + ' · ' + tr('{n} movements', { n: moves }), -u * NEIGHBOURS_NOISE_K]);
      if (tot.nightMoves) rows.push([tr('Movements at night'), String(tot.nightMoves), null]);
    }
    const pm = Green.permit(), p = S.airport.permit;
    if (pm) {
      rows.push([tr('The environmental permit'), tr('Flights a day {n} of {cap} allowed', { n: Math.round(Green.perDay()), cap: p.perDay || '—' }), pm.broken ? -PERMIT_NEIGHBOURS : null]);
      if (pm.broken) rows.push([tr('Broken: a fine every month'), sek(PERMIT_FINE), null]);
    }
    let html = '<div class="cards">' + nowCard(t, v, String(Math.round(v)), tr('Märsta, Sigtuna, Upplands Väsby and Knivsta: the noise over the towns.'));
    html += card('⚖️ ' + esc(tr('What moves it')), factors(rows) +
      '<p class="fine">' + esc(tr('Every movement pulls it toward that level less its noise: {a} for a landing and {d} for a take-off over a town, {f} over the forest; a jet × 1.5, at night × {x}. The train and quieter deals raise the level.', {
        a: Text.num(NOISE_ARR_TOWN, 1), d: Text.num(NOISE_DEP_TOWN, 1), f: Text.num(NOISE_FOREST, 1), x: NOISE_NIGHT_X })) + '</p>') + '</div>';
    return html;
  }

  function staff(t) {
    const v = S.meters.staff, pp = S.people;
    const ids = pp ? Object.keys(pp.depts).filter((id) => People.jobs(id) > 0) : [];
    let html = '<div class="cards">' + nowCard(t, v, String(Math.round(v)), tr('The departments\' morale, weighted by their jobs.'));
    if (!ids.length) return html + '</div><p class="fine">' + esc(tr('No teams yet: every task is done by hand. Teams come with chapter 2.')) + '</p>';
    let jobs = 0, bonus = 0, perk = 0, fat = 0, away = 0, n = 0;
    const toward = (id) => { const d = pp.depts[id]; return clamp(MORALE_BASE + (d.bonus || 0) * MORALE_BONUS_KEEP + People.perk(id, 'morale') - d.fatigue * 0.3, 0, 100); };
    const awayOf = (id) => ((DEPTS[id] || {}).police ? 0 : S.ops && S.ops.absence && S.ops.absence[id] !== undefined ? S.ops.absence[id] : People.absence(id));
    for (const id of ids) {
      const d = pp.depts[id], j = People.jobs(id);
      jobs += j; n += j; bonus += (d.bonus || 0) * j; perk += People.perk(id, 'morale') * j; fat += d.fatigue * j; away += awayOf(id) * j;
    }
    const rows = [[tr('Fair wages and no trouble'), '', MORALE_BASE],
      Math.abs(bonus / n) >= 0.5 ? [tr('Wage deals (fading month by month)'), '', bonus / n] : null,
      perk ? [tr('Heads of department'), '', perk / n] : null,
      fat / n >= 1 ? [tr('Tiredness from overtime'), Math.round(fat / n) + '', -fat / n * 0.3] : null];
    html += card('⚖️ ' + esc(tr('What moves it')), factors(rows) + '<p class="fine">' + esc(tr('Each month morale goes {p} of the way to where these add up; low morale means more people away.', { p: Text.pct(MORALE_DRIFT) })) + '</p>');
    const s = pp.strike;
    html += card('👥 ' + esc(tr('Jobs: {n}', { n: jobs })), '<p>' + esc(tr('Away today: {p}', { p: Text.pct(away / n) })) + '</p><p>' + esc(tr('Wages: {m} a month', { m: sek(People.wages()) })) + '</p>' +
      (s && s.to > S.day ? '<p class="warn">' + esc(S.day >= s.from ? tr('{dept} is on strike today.', { dept: Text.dept(s.dept) }) : tr('Strike notice: {dept} from {d}', { dept: Text.dept(s.dept), d: fmtDate(s.from) })) + '</p>' : '') +
      (S.ops && S.ops.overtime && Object.keys(S.ops.overtime).length ? '<p>' + esc(tr('Overtime today: {list}', { list: Object.keys(S.ops.overtime).map((id) => Text.dept(id)).join(', ') })) + '</p>' : '')) + '</div>';
    // the departments
    html += '<p class="label">' + esc(tr('The departments')) + '</p><table class="ops brk depts"><tr><th></th><th>' + esc(tr('Jobs')) + '</th><th>' + esc(tr('Morale')) + '</th><th>' + esc(tr('Away')) + '</th><th>' + esc(tr('Union')) + '</th></tr>' +
      ids.map((id) => {
        const d = pp.depts[id], m = pp.managers[id], tw = toward(id), notes = [];
        if (m) notes.push(Text.manager(m.id));
        if (People.cut(id) > 0) notes.push(tr('{p} of the jobs are empty', { p: Text.pct(People.cut(id)) }));
        if (People.furloughed(id)) notes.push(tr('{p} on furlough', { p: Text.pct(People.furloughed(id)) }));
        if (d.temps > S.day) notes.push(tr('temps until {d}', { d: fmtDate(d.temps) }));
        return '<tr><td><b>' + esc(Text.dept(id)) + '</b>' + (notes.length ? '<small>' + esc(notes.join(' · ')) + '</small>' : '') + '</td><td>' + People.jobs(id) + '</td><td class="nw">' + Math.round(d.morale) +
          ' <small class="dir ' + (tw > d.morale + 0.5 ? 'pos' : tw < d.morale - 0.5 ? 'neg' : '') + '">→ ' + Math.round(tw) + '</small></td><td>' + Text.pct(awayOf(id)) + '</td><td>' + Math.round(d.union.mood) + '</td></tr>';
      }).join('') + '</table><p class="fine">' + esc(tr('Morale → where it is heading this month. Union: its mood; a low one makes a strike likelier at the next wage round.')) + '</p>';
    return html;
  }

  function safety(t) {
    const v = S.meters.safety, tot = sofar(), base = S.airport.safetyBase, rows = [];
    rows.push([tr('It recovers up to'), String(Math.round(base)), null]);
    rows.push([tr('Back every hour'), '', SAFETY_RECOVER_HOUR]);
    if (tot) {
      rows.push([tr('Close calls this mission'), String(tot.closeCalls), tot.closeCalls ? -SAFETY_CLOSE_CALL * tot.closeCalls : null]);
      if (tot.emergencies) rows.push([tr('Emergency landings'), String(tot.emergencies), null]);
    }
    if (Airport.has('fireStation')) rows.push([tr('Fire category {n}', { n: Airport.fireCat() }), '', null]);
    else if (Airport.siteFireWatch()) rows.push([tr('Fire category {n}: the building site\'s fire watch, until the fire station stands', { n: Airport.fireCat() }), '', null]);
    if (S.ops) {
      const poor = S.airport.runways.filter((r) => Runways.braking(r) === 'poor').length;
      if (poor) rows.push([tr('Runways with poor braking action'), String(poor), null]);
    }
    let html = '<div class="cards">' + nowCard(t, v, String(Math.round(v)), v < SAFETY_MIN ? tr('Below {n}: the runway is closed until it is back.', { n: SAFETY_MIN }) : tr('Below {n} the runway closes until it is back.', { n: SAFETY_MIN }));
    html += card('⚖️ ' + esc(tr('What moves it')), factors(rows) + '<p class="fine">' + esc(tr('A close call knocks it down by {n}: a landing on a runway with poor braking action (snow), or an emergency landing of an aircraft bigger than the fire category. A new tower and safer runways raise the level it recovers to.', { n: SAFETY_CLOSE_CALL })) + '</p>') + '</div>';
    return html;
  }

  function green(t) {
    const v = Green.rating(), pm = Green.permit(), p = S.airport.permit;
    const rows = Green.parts().filter((x) => x[0] === 'base' || x[1]).map((x) => [tr(GREEN_PART_NAMES[x[0]] || x[0]), '', Math.round(x[1] * 10) / 10]);
    let html = '<div class="cards">' + nowCard(t, v, String(v), tr('The CO2 of the airport\'s own work, its energy and how people get here.'));
    html += card('⚖️ ' + esc(tr('What makes it up')), factors(rows));
    let pl = '<p>🔥 ' + esc(tr('Energy: {m} a month', { m: sek(Green.energyMonth()) })) + '</p>';
    if (S.airport.biofuel) pl += '<p>🌱 ' + esc(tr('{p} of the fuel bio: {m} a month', { p: Text.pct(S.airport.biofuel), m: sek(Green.biofuelMonth()) })) + '</p>';
    if (p) pl += '<p' + (pm && pm.broken ? ' class="neg"' : '') + '>📜 ' + esc(tr('Permit: {n} of {cap} flights a day', { n: Math.round(Green.perDay()), cap: p.perDay || '—' }) +
      (p.green ? ' · ' + tr('green rating at least {g}', { g: p.green }) : '')) + '</p>' + (pm && pm.broken ? '<p class="neg">' + esc(tr('Broken: a fine every month')) + ' ' + esc(sek(PERMIT_FINE)) + '</p>' : '');
    html += card('📜 ' + esc(tr('The environmental permit')), pl) + '</div>';
    return html;
  }

  // ---------- the chart ----------
  // per tab: the line's column and the bars' (a value per row or null), their colour and what they are
  const CHART = {
    passengers: { col: STAT.passengers, bars: (r) => (r[STAT.pax] > 0 ? r[STAT.pax] : null), color: '#6fb1e8', what: 'Bars: passengers a day' },
    airlines: { col: STAT.airlines, bars: (r) => (r[STAT.onTime] >= 0 && r[STAT.dep] > 0 ? r[STAT.onTime] / r[STAT.dep] : null), max: 1, color: '#5ec27a', what: 'Bars: the share of departures on time' },
    neighbours: { col: STAT.neighbours, bars: (r) => (r[STAT.min] >= 0 && r[STAT.noise] > 0 ? r[STAT.noise] / 10 : null), color: '#f0a04a', what: 'Bars: noise' },
    staff: { col: STAT.staff, bars: (r) => (r[STAT.jobs] > 0 ? r[STAT.away] / 10 : null), floor: 25, color: '#e35b4f', what: 'Bars: the share of the staff away' },
    safety: { col: STAT.safety, bars: (r) => (r[STAT.min] >= 0 && r[STAT.cc] > 0 ? r[STAT.cc] : null), color: '#e35b4f', what: 'Bars: close calls' },
    green: { col: STAT.green, bars: () => null }
  };
  function range() { return Settings.get('statsRange') === 'months' ? 'months' : 'recent'; }
  function rows(tab) {
    const st = S.stats || { recent: [], months: [] }, list = (range() === 'months' ? st.months : st.recent) || [];
    return tab === 'green' ? list.filter((r) => r[STAT.green] >= 0) : list;
  }
  function chartHtml(tab) {
    const c = CHART[tab], r = range();
    const any = rows(tab).some((x) => c.bars(x) !== null);
    return '<p class="label">' + esc(tr('History')) + '</p><div class="tabs">' + [['recent', 'Hours and days'], ['months', 'Month by month']].map((x) =>
      '<button class="btn toggle' + (x[0] === r ? ' on' : '') + '" data-range="' + x[0] + '">' + esc(tr(x[1])) + '</button>').join('') + '</div>' +
      '<div class="cvWrap"><canvas id="statsChart"></canvas></div><p class="fine">' + esc(tr('Line: the value from 0 to 100.')) + (any && c.what ? ' ' + esc(tr(c.what)) + '.' : '') +
      (r === 'recent' ? ' ' + esc(tr('The quarter hours of the operations stages and the days of the build stages; a dashed line marks time skipped.')) : '') + '</p>';
  }
  function label(row) {
    const d = Calendar.date(row[STAT.day]);
    if (range() === 'months') return d.m + '/' + Calendar.yearOf(row[STAT.day]);
    return d.d + '/' + d.m + '/' + String(Calendar.yearOf(row[STAT.day])).slice(2) + (row[STAT.min] >= 0 ? ' ' + fmtClock(row[STAT.min]) : '');
  }
  function draw(cv, tab) {
    const c = CHART[tab], hist = rows(tab);
    const w = Math.max(280, cv.parentNode.clientWidth), h = 170, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, 0, w, h);
    if (hist.length < 2) { g.fillStyle = '#aab'; g.font = '12px Arial'; g.textAlign = 'center'; g.fillText(tr('The chart grows as you play.'), w / 2, h / 2); return; }
    const L = 40, X = (i) => L + (w - L - 10) * i / (hist.length - 1), Y = (v) => 10 + (h * 0.58) * (1 - v / 100);
    // the guides at 40 and 60 (where the HUD's bar turns amber and red), the permit's green rating
    g.lineWidth = 1;
    for (const v of [0, 40, 60, 100]) { g.strokeStyle = v % 100 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(w - 10, Y(v)); g.stroke(); }
    const pg = tab === 'green' && S.airport.permit && S.airport.permit.green;
    if (pg) { g.strokeStyle = '#5ec27a'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(L, Y(pg)); g.lineTo(w - 10, Y(pg)); g.stroke(); g.setLineDash([]); }
    // time skipped between two points (another stage, another mission)
    if (range() === 'recent') {
      g.strokeStyle = 'rgba(255,255,255,0.3)'; g.setLineDash([3, 3]);
      for (let i = 1; i < hist.length; i++) if (hist[i][STAT.day] - hist[i - 1][STAT.day] > 1 || (hist[i][STAT.min] >= 0) !== (hist[i - 1][STAT.min] >= 0)) {
        const x = (X(i) + X(i - 1)) / 2; g.beginPath(); g.moveTo(x, 6); g.lineTo(x, h - 18); g.stroke();
      }
      g.setLineDash([]);
    }
    // the bars under the line
    // (the staff away against a quarter at least, so a usual few per cent stays a low bar)
    const bv = hist.map(c.bars), bmax = c.max || Math.max(c.floor || 1e-9, ...bv.filter((x) => x !== null));
    const by = h - 22, bw = Math.max(2, Math.min(6, (w - L - 10) / hist.length - 1));
    g.fillStyle = c.color || '#888';
    bv.forEach((b, i) => { if (b === null) return; const bh = (h * 0.2) * b / bmax; g.fillRect(X(i) - bw / 2, by - bh, bw, Math.max(1, bh)); });
    // the line
    g.strokeStyle = '#ffd65a'; g.lineWidth = 2; g.beginPath();
    hist.forEach((r, i) => (i ? g.lineTo(X(i), Y(r[c.col])) : g.moveTo(X(i), Y(r[c.col]))));
    g.stroke();
    g.fillStyle = '#c9d1d9'; g.font = '10px Arial'; g.textAlign = 'right';
    // the Passengers meter's ends as stars, drawn (docs/icons.md); drawn again once the star's image has loaded
    if (tab === 'passengers') { const im = Icons.image('★', '#c9d1d9'); if (!(im.complete && im.naturalWidth)) Icons.image('★', '#c9d1d9', () => { if (cv.isConnected) draw(cv, tab); }); }
    const axis =(t, y) => Icons.drawText(g, t, L - 4, y, '#c9d1d9', (s, x) => g.fillText(s, x, y));
    axis(tab === 'passengers' ? '5★' : '100', Y(100) + 4); axis(tab === 'passengers' ? '1★' : '0', Y(0) + 3);
    g.textAlign = 'left'; g.fillText(label(hist[0]), L, h - 4);
    g.textAlign = 'right'; g.fillText(label(hist[hist.length - 1]), w - 10, h - 4);
  }

  // the tab's page (below the tabs): its title, the cards, the breakdown and the chart
  function html(tab) {
    const t = STATS_TABS.find((x) => x.k === tab);
    const body = { passengers, airlines, neighbours, staff, safety, green }[tab](t);
    return '<h1>' + t.icon + ' ' + esc(tr(t.name)) + '</h1><p class="when">' + esc(fmtNow()) + (S.ops && !S.free ? ' · ' + fmtClock(S.clock) : '') + '</p>' + body + chartHtml(tab);
  }
  // an analytics page of Finance there is now (not the Ops Center or Departments)
  function has(tab) { return tabs().some((t) => t.k === tab && !t.screen); }

  return { tabsHtml, html, draw, has };
})();
