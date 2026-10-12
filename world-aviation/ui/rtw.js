'use strict';

// ============================================================
// World Aviation — round the world on the screen (the rules and the
// state: sim/rtw.js):
//
//   - the expedition's screen (#rtw, from its card on top of the
//     Network tab): the globe (art/globe.js, turned by a drag) with
//     the ring of meridians and the kilometres beside it; before the
//     start the mode, the type, the three routes or one's own (a tap
//     on an airport of the globe, or the list of the stops that may
//     come next), every leg checked as it is added; under way the legs,
//     the passport, the rest of the route drawn again, Abandon; always
//     the marks, the records and the history
//   - the cards: on top of the Network tab, the next leg pinned over
//     the board, the Career tab's
//   - the briefing's and the debrief's lines for a leg, the finish
//     (fireworks, the fanfare, the medal) and the certificate (a PNG)
//   - in the flight (RtwFlight, every frame from Game.frame): the take
//     off of a leg, the equator, the date line and halfway round
// ============================================================

const RtwScreen = {
  sel: null, view: null, cv: null, raf: 0, places: [], drag: null, edit: null, confirm: null,

  // the choices before the start (kept while the game runs)
  choice() {
    if (!this.sel) this.sel = { mode: 'std', type: null, route: 'north', reverse: false, own: false, plan: null };
    const s = this.sel, types = Rtw.types();
    if (!types.some((a) => a.id === s.type)) s.type = types.length ? types[types.length - 1].id : null;
    if (!s.plan) s.plan = [Career.data.base];
    return s;
  },
  // the plan the screen shows: the expedition's (or its rest being drawn again), the pilot's own,
  // or a ready route
  plan() {
    const a = Rtw.active();
    if (a) return this.edit || a.plan;
    const s = this.choice();
    return s.own ? s.plan : Rtw.routePlan(s.route, s.reverse);
  },
  ac() {
    const a = Rtw.active();
    return Rtw.acOf(a ? a.type : this.choice().type);
  },
  // drawing a plan by hand: the pilot's own before the start, or the rest of the route under way
  drawing() { return Rtw.active() ? !!this.edit : this.choice().own; },

  // ---------- the screen ----------
  show() {
    Game.mode = 'ops';
    UI.tab = 'network';
    Rtw.seen();
    const open = Rtw.open(), a = Rtw.active(), ac = this.ac();
    const plan = this.plan(), chk = ac ? Rtw.check(plan, ac) : null;
    let body;
    if (!open && !a) body = this.lockedHtml();
    else if (a) body = this.activeHtml(a, plan, chk);
    else body = this.planHtml(plan, chk);
    UI.panel(
      '<div class="screenBar"><button class="btn back" data-act="tab" data-v="network" data-esc>' + tr('Network') + '</button></div>' +
      '<h2 class="rtwTitle">🌐 ' + tr('Round the world') + '</h2>' +
      '<p class="lead">' + tr('From Arlanda round the globe and back in one aeroplane, by the rules of the real records: every leg the same way round, all 360° of longitude, at least {km} km — the length of the Tropic of Cancer.', { km: fmtNum(RTW.MIN_KM) }) + '</p>' +
      this.heroHtml(plan, chk, a) +
      body +
      this.marksHtml() + this.recordsHtml() + this.historyHtml(), 'rtw');
    UI.route('rtw');
    UI.onLeave = () => this.close();
    this.wire();
  },
  close() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.cv = null;
    if (UI.keyHook === this.keyFn) UI.keyHook = null;
  },

  // the globe and its two gauges: the meridians (degrees of 360) and the kilometres
  heroHtml(plan, chk, a) {
    const p = a ? Rtw.progress() : null;
    const deg = a ? p.deg : chk ? chk.deg : 0, km = a ? p.km : chk ? chk.km : 0;
    const kmMax = Math.max(RTW.MIN_KM * 1.6, km * 1.08);
    const verdict = a ? tr('Leg {n} of {m} · waiting at {id}', { n: a.at + 1, m: a.plan.length - 1, id: a.plan[a.at] }) : this.verdict(chk);
    return '<div class="rtwHero">' +
      '<div class="rtwGlobeBox"><canvas id="rtwGlobe" aria-label="' + esc(tr('The globe with the route')) + '"></canvas>' +
      '<span class="rtwTurn">' + tr(this.drawing() ? 'drag to turn it · tap an airport to add it' : 'drag to turn it') + '</span></div>' +
      '<div class="rtwGauges">' +
      '<div class="rtwRing" style="--p:' + (clamp(deg / 360, 0, 1) * 100).toFixed(1) + '%"><div><b>' + Math.round(deg) + '°</b><span>' + tr('of 360° of longitude') + '</span></div></div>' +
      '<div class="rtwKm"><div class="rtwKmBar"><i style="width:' + (clamp(km / kmMax, 0, 1) * 100).toFixed(1) + '%"></i>' +
      '<em style="left:' + (RTW.MIN_KM / kmMax * 100).toFixed(1) + '%" title="' + esc(fmtNum(RTW.MIN_KM) + ' km') + '"></em></div>' +
      '<b>' + fmtNum(Math.round(km)) + ' km</b><span>' + tr('{km} km needed', { km: fmtNum(RTW.MIN_KM) }) + '</span></div>' +
      '<p class="rtwVerdict' + (!a && chk && chk.ok ? ' ok' : '') + '">' + verdict + '</p>' +
      '</div></div>';
  },
  // what the plan being drawn still lacks, or that it counts
  verdict(chk) {
    if (!chk) return tr('No type to fly it in yet.');
    if (chk.legs.some((l) => l.err)) return '⚠ ' + tr('A leg breaks the rules — see the legs below.');
    if (chk.ok) return '✓ ' + tr('It counts: {km} km, {n} legs.', { km: fmtNum(Math.round(chk.km)), n: chk.legs.length });
    if (!chk.closed) return tr('{deg}° to go round, then back to {id}.', { deg: Math.round(360 - chk.deg), id: Career.data.base });
    return '⚠ ' + tr('Round, but {km} km short: come further south.', { km: fmtNum(Math.round(RTW.MIN_KM - chk.km)) });
  },

  lockedHtml() {
    const n = Rtw.needs();
    const row = (ok, text) => '<li class="' + (ok ? 'ok' : 'need') + '"><i>' + (ok ? '✓' : '·') + '</i><span>' + text + '</span></li>';
    const course = COURSES.find((c) => c.id === RTW.COURSE);
    return '<section class="cvCard"><h3>🔒 ' + tr('Not open yet') + '</h3><ul class="coNeeds">' +
      row(n.regions >= n.of, tr('Traffic rights in every region: {a} of {b}', { a: n.regions, b: n.of })) +
      row(n.course, tr('Course: {name}', { name: esc(UI.courseText(course).name) })) +
      '</ul><p class="fineprint">' + tr('The route crosses every region and two oceans: the rights and the ETOPS rating come first.') + '</p></section>';
  },

  // before the start: the mode, the type, the route, its legs, Start
  planHtml(plan, chk) {
    const s = this.choice(), types = Rtw.types(), ac = this.ac();
    const mode = (id, name, text) => '<button class="chip' + (s.mode === id ? ' on' : '') + '" data-act="rtw" data-v="mode:' + id + '" aria-pressed="' + (s.mode === id) + '"><b>' + name + '</b><small>' + text + '</small></button>';
    const mult = RTW.IRON_MULT;
    const typeChips = types.length ? types.map((t) => {
      const cls = Rtw.classOf(t);
      return '<button class="chip' + (t.id === s.type ? ' on' : '') + '" data-act="rtw" data-v="type:' + t.id + '" title="' + esc(tr(cls.name) + ' · ' + t.maxRangeNm + ' nm') + '">' +
        esc(t.name) + ' <small>' + t.maxRangeNm + ' nm</small></button>';
    }).join('') : '<p class="need">' + tr('No jet you may fly can go round — the hangar has them.') + '</p>';
    const routes = RTW_ROUTES.map((r) => {
      const p = Rtw.routePlan(r.id, s.reverse), c = ac ? Rtw.check(p, ac) : null, longest = Math.max.apply(null, (c ? c.legs : []).map((l) => l.nm).concat([0]));
      const on = !s.own && s.route === r.id;
      return '<button class="rtwRoute' + (on ? ' on' : '') + (c && !c.ok ? ' no' : '') + '" data-act="rtw" data-v="route:' + r.id + '" aria-pressed="' + on + '">' +
        '<img src="' + Globe.url(p, 0, 160) + '" alt="">' +
        '<b>' + esc(tr(r.name)) + '</b>' +
        '<span>' + tr('{n} legs · {km} km · longest {nm} nm', { n: p.length - 1, km: fmtNum(Math.round(c ? c.km : 0)), nm: fmtNum(Math.round(longest)) }) + '</span>' +
        '<small>' + esc(tr(r.blurb)) + '</small>' +
        (c && !c.ok ? '<em>' + esc(tr('Not in the {ac}', { ac: ac.name })) + '</em>' : '') + '</button>';
    }).join('') +
      '<button class="rtwRoute own' + (s.own ? ' on' : '') + '" data-act="rtw" data-v="own" aria-pressed="' + s.own + '">' +
      '<b>✎ ' + tr('Plan my own') + '</b><small>' + tr('Tap the airports on the globe, or pick each stop from the list: only the ones the next leg may go to are offered.') + '</small></button>';
    const reward = tr('The reward: {kr} and +{rep} reputation with every client group — Iron pays {k} times as much. Each leg is paid by the Meridian Club like a contract.',
      { kr: fmtMoney(RTW.REWARD_KR), rep: RTW.REWARD_REP, k: mult });
    return '<section class="rtwSec"><h3>' + tr('How you go') + '</h3><div class="startPick">' +
      mode('std', tr('Round the world'), tr('a leg lost is flown again from the same stop')) +
      mode('iron', tr('Iron round the world'), tr('one life: once off the ground a leg ends only at its arrival — a crash, a cheat, quitting or a restart loses the whole expedition · pays double')) +
      '</div></section>' +
      '<section class="rtwSec"><h3>' + tr('The aircraft') + '</h3><div class="chips rtwTypes">' + typeChips + '</div>' +
      '<p class="fineprint">' + tr('One type for the whole way round. The Pacific decides: Tokyo–Anchorage is 3 005 nm, so of the narrowbodies only the A220 goes round.') + '</p></section>' +
      '<section class="rtwSec"><h3>' + tr('The route') + '</h3>' +
      '<div class="rtwRoutes">' + routes + '</div>' +
      (s.own ? '' : '<div class="btnRow"><button class="chip' + (s.reverse ? ' on' : '') + '" data-act="rtw" data-v="reverse" aria-pressed="' + s.reverse + '">↺ ' +
        tr(s.reverse ? 'Westbound' : 'Eastbound') + '</button></div>') +
      this.legsHtml(plan, chk, 0) +
      (s.own ? this.addHtml(plan, ac, 1) : '') +
      '</section>' +
      '<div class="btnRow"><button class="btn default fwd big" data-act="rtw" data-v="start"' + (chk && chk.ok ? '' : ' disabled') + '>' +
      tr(s.mode === 'iron' ? 'Set off — Iron' : 'Set off') + '</button></div>' +
      '<p class="fineprint">' + reward + '</p>';
  },

  // under way: the next leg, the legs, the passport, the rest of the route, Abandon
  activeHtml(a, plan, chk) {
    const ac = Rtw.acOf(a.type), c = Rtw.leg(), cls = Rtw.classOf(ac);
    const from = World.byId[a.plan[a.at]], to = World.byId[a.plan[a.at + 1]];
    const here = Career.here();
    const next = '<section class="rtwNext">' +
      '<div class="rtwNextHead"><span class="rtwMode ' + a.mode + '">' + tr(a.mode === 'iron' ? 'Iron round the world' : 'Round the world') + '</span>' +
      '<b>' + esc(ac.name) + '</b><span class="tag">' + esc(tr(cls.name)) + '</span></div>' +
      '<div class="cRoute"><b>' + routeHtml(from.id, to.id) + '</b><span>' + routeHtml(placeHtml(from), placeHtml(to), 'soft') + '</span></div>' +
      (c ? '<p class="fineprint">' + tr('Leg {n} of {m} · {nm} nm · {pay} from the Meridian Club', { n: a.at + 1, m: a.plan.length - 1, nm: c.distanceNm, pay: fmtMoney(c.pay) }) + '</p>' : '') +
      (here && here.id !== from.id ? '<p class="fineprint">✈ ' + tr('You fly to {city} as a passenger first — free.', { city: esc(aptCity(from)) }) + '</p>' : '') +
      (this.edit ? '' : '<div class="btnRow">' + (c ? '<button class="btn default fwd" data-act="briefing" data-v="' + esc(c.id) + '">' + tr('Briefing') + '</button>' : '') +
        '<button class="btn" data-act="rtw" data-v="edit">' + tr('Change the rest of the route') + '</button></div>') +
      '</section>';
    const editing = this.edit ? '<section class="rtwSec"><h3>' + tr('The rest of the route') + '</h3>' +
      this.legsHtml(plan, chk, a.at) + this.addHtml(plan, ac, a.at + 1) +
      '<div class="btnRow"><button class="btn default" data-act="rtw" data-v="editSave"' + (chk && chk.ok ? '' : ' disabled') + '>' + tr('Use this route') + '</button>' +
      '<button class="btn" data-act="rtw" data-v="editCancel">' + tr('Cancel') + '</button></div></section>' : '';
    const confirm = this.confirm === 'abandon'
      ? '<div class="rtwConfirm"><p>' + tr('Abandon the expedition? The legs flown stay in the history, the reward is gone.') + '</p>' +
        '<div class="btnRow"><button class="btn danger" data-act="rtw" data-v="abandonYes">' + tr('Abandon it') + '</button>' +
        '<button class="btn default" data-act="rtw" data-v="abandonNo">' + tr('Keep going') + '</button></div></div>'
      : '<div class="btnRow"><button class="btn" data-act="rtw" data-v="abandon">' + tr('Abandon the expedition') + '</button></div>';
    return next + editing +
      (this.edit ? '' : '<section class="rtwSec"><h3>' + tr('The legs') + '</h3>' + this.legsHtml(a.plan, Rtw.check(a.plan, ac), 0, a) + '</section>') +
      this.passportHtml(a.legs) + confirm;
  },

  // the legs of a plan from leg `from` on: each with its distance and what is wrong with it (or,
  // under way, flown with its grade, the next one, the rest)
  legsHtml(plan, chk, from, a) {
    if (!chk || plan.length < 2) return '<p class="fineprint">' + tr('No legs yet: pick the first stop.') + '</p>';
    const rows = chk.legs.slice(from).map((l, j) => {
      const i = from + j;
      const state = a ? (i < a.at ? 'done' : i === a.at ? 'next' : 'later') : (l.err ? 'bad' : 'ok');
      const flown = a && a.legs[i];
      const mark = state === 'done' ? '✓ ' + flown.grade : state === 'next' ? '→' : state === 'bad' ? '⚠' : '·';
      return '<li class="' + state + '"><i>' + mark + '</i><b>' + routeHtml(l.from ? l.from.id : '?', l.to ? l.to.id : '?') + '</b>' +
        '<span>' + fmtNum(Math.round(l.nm)) + ' nm</span>' +
        (l.err && !a ? '<em>' + esc(this.errText(l.err, l)) + '</em>' : '') + '</li>';
    }).join('');
    return '<ol class="rtwLegs">' + rows + '</ol>';
  },
  errText(err, l) {
    const ac = this.ac();
    switch (err) {
      case 'same': return tr('the same airport again');
      case 'way': return tr('the wrong way round');
      case 'over': return tr('past the meridian of {id} before the end', { id: Career.data.base });
      case 'closed': return tr('no flights between Russia and {country}', { country: tr(l.from.country === 'Russia' ? l.to.country : l.from.country) });
      case 'range': return l.nm > CONTRACTS.MAX_NM ? tr('longer than one leg may be ({nm} nm)', { nm: fmtNum(CONTRACTS.MAX_NM) }) : tr('beyond the range of the {ac}', { ac: ac ? ac.name : '' });
      case 'runway': return tr('runway too short for the {ac}', { ac: ac ? ac.name : '' });
      case 'grass': return tr('a grass strip');
      default: return '';
    }
  },
  // the list of the stops that may come next, and Undo / Clear
  addHtml(plan, ac, keep) {
    const next = ac ? Rtw.nextStops(plan, ac) : [];
    const last = World.byId[plan[plan.length - 1]];
    const dir = Rtw.check(plan, ac).dir || 1;
    next.sort((p, q) => dir * (wrapDeg(p.lon - last.lon) - wrapDeg(q.lon - last.lon)));
    const opts = next.map((b) => '<option value="' + b.id + '">' + b.id + ' · ' + esc(aptPlace(b)) + ' · ' +
      fmtNum(Math.round(geoDistanceNm(last.lat, last.lon, b.lat, b.lon))) + ' nm</option>').join('');
    return '<div class="rtwAdd">' +
      (opts ? '<label>' + tr('Next stop') + ' <select id="rtwAdd"><option value="">' + esc(tr('— pick —')) + '</option>' + opts + '</select></label>' : '') +
      '<button class="btn small" data-act="rtw" data-v="undo"' + (plan.length > keep ? '' : ' disabled') + '>' + tr('Undo') + '</button>' +
      '<button class="btn small" data-act="rtw" data-v="clear"' + (plan.length > keep ? '' : ' disabled') + '>' + tr('Clear') + '</button></div>';
  },

  // the passport: a stamp for every leg landed
  passportHtml(legs) {
    if (!legs.length) return '';
    return '<section class="rtwSec"><h3>' + tr('Passport') + '</h3><div class="rtwPassport">' + legs.map((l, i) => this.stampHtml(l, i)).join('') + '</div></section>';
  },
  stampHtml(l, i) {
    const a = World.byId[l.to];
    if (!a) return '';
    const lk = AIRPORT_LOOK[a.id] || [], look = { symbol: lk[0], color: lk[1] };
    const date = new Date(l.date);
    const day = isNaN(date) ? '' : date.toLocaleDateString(I18N.lang === 'sv' ? 'sv-SE' : I18N.lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' });
    const tilt = ((hashStr(l.to + i) % 13) - 6);
    return '<div class="rtwStamp" style="--tilt:' + tilt + 'deg;--c:' + (look.color || '#7fb0e0') + '">' +
      '<img class="rtwSym" src="' + landmarkUrl(look.symbol, look.color || '#7fb0e0') + '" alt="">' +
      '<b>' + a.id + '</b><span>' + placeHtml(a) + '</span>' +
      '<small>' + fmtClock(l.clock || 0) + (day ? ' · ' + day : '') + '</small>' +
      '<em class="g' + (l.grade === 'A+' || l.grade === 'A' ? ' top' : l.grade === 'E' || l.grade === 'F' ? ' bad' : '') + '">' + l.grade + '</em>' +
      (l.equator ? '<i class="rtwNeptune" title="' + esc(tr('Over the equator')) + '">🔱</i>' : '') + '</div>';
  },

  // the marks: the classes by the two modes
  marksHtml() {
    const r = Rtw.data();
    const cell = (on, iron) => '<td class="' + (on ? 'on' + (iron ? ' iron' : '') : '') + '">' + (on ? '✓' : '·') + '</td>';
    return '<section class="cvCard rtwMarks"><h3>' + tr('Marks') + '</h3><table class="rtwTable"><thead><tr><th></th><th>' + tr('Round the world') + '</th><th>' + tr('Iron') + '</th></tr></thead><tbody>' +
      RTW_CLASSES.map((c) => { const d = r.done[c.id] || {}; return '<tr><th>' + esc(tr(c.name)) + '</th>' + cell(d.std) + cell(d.iron, true) + '</tr>'; }).join('') +
      '</tbody></table>' + this.medalHtml() + '</section>';
  },
  medalHtml() {
    const m = Rtw.medal();
    if (!m) return '<p class="fineprint">' + tr('Fly round the world for a medal on your pilot\'s card: silver, iron for an Iron expedition, gold for the Mriya\'s.') + '</p>';
    return '<p class="rtwMedalLine">' + rtwMedal(m) + ' ' + tr(m === 'gold' ? 'The gold globe: the Dream has flown round the world.' : m === 'iron' ? 'The iron globe: round the world on one life.' : 'The silver globe: round the world.') + '</p>';
  },
  recordsHtml() {
    const r = Rtw.data();
    const rows = RTW_CLASSES.filter((c) => r.records[c.id]).map((c) => {
      const x = r.records[c.id];
      return '<tr><th>' + esc(tr(c.name)) + '</th><td>' + fmtDuration(x.sec / 60) + '</td><td>' + x.legs + '</td><td>' + Rtw.gradeLetter(x.grade) + '</td></tr>';
    }).join('');
    if (!rows) return '';
    return '<section class="cvCard"><h3>' + tr('Records') + '</h3><table class="rtwTable"><thead><tr><th></th><th>' + tr('Block time') + '</th><th>' + tr('Legs') + '</th><th>' + tr('Grade') + '</th></tr></thead><tbody>' + rows + '</tbody></table></section>';
  },
  historyHtml() {
    const r = Rtw.data();
    if (!r.history.length) return '';
    return '<section class="cvCard"><h3>' + tr('History') + '</h3><ul class="rtwHistory">' + r.history.map((h) => {
      const ac = Rtw.acOf(h.type);
      const what = h.result === 'done' ? '✓ ' + tr(h.mode === 'iron' ? 'Iron round the world' : 'Round the world')
        : h.result === 'lost' ? '✕ ' + tr('Lost at leg {n}', { n: h.at + 1 }) : '– ' + tr('Abandoned at leg {n}', { n: h.at + 1 });
      return '<li class="' + h.result + '"><b>' + esc(what) + '</b><span>' + esc(ac ? ac.name : h.type) + ' · ' + tr('{n} legs', { n: h.legs }) + ' · ' + fmtNum(Math.round(h.km)) + ' km' +
        (h.sec ? ' · ' + fmtDuration(h.sec / 60) : '') + '</span>' +
        (h.result === 'done' ? '<button class="btn small" data-act="rtw" data-v="cert:' + esc(h.id) + '">' + tr('Certificate') + '</button>' : '') + '</li>';
    }).join('') + '</ul></section>';
  },

  // ---------- the globe on the screen ----------
  wire() {
    const cv = el('rtwGlobe');
    this.cv = cv;
    const plan = this.plan(), a = Rtw.active();
    if (!this.view || this.viewKey !== plan.join('-')) { this.view = Globe.viewFor(plan, a ? a.at : 0); this.viewKey = plan.join('-'); }
    if (cv) {
      cv.addEventListener('pointerdown', (e) => this.down(e));
      cv.addEventListener('pointermove', (e) => this.move(e));
      cv.addEventListener('pointerup', (e) => this.up(e));
      cv.addEventListener('pointercancel', () => { this.drag = null; });
    }
    const add = el('rtwAdd');
    if (add) add.addEventListener('change', () => { if (add.value) { this.act('add:' + add.value); } });
    // the next leg's aeroplane flies along it while an expedition is under way (still with
    // reduced motion); otherwise a frame is drawn when something changes (redraw)
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    this.animate = !reduced && !!a && !this.edit;
    this.loopFn = () => {
      this.raf = 0;
      if (!this.cv || !document.body.contains(this.cv)) return;
      this.paint(this.animate ? ((performance.now() - t0) / 2600) % 1 : 0.5);
      if (this.animate) this.raf = requestAnimationFrame(this.loopFn);
    };
    if (this.raf) cancelAnimationFrame(this.raf);
    this.loopFn();
  },
  paint(pulse) {
    const cv = this.cv;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
    if (!w || !h) return;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const a = Rtw.active(), plan = this.plan(), ac = this.ac();
    const chk = ac ? Rtw.check(plan, ac) : null;
    const drawing = this.drawing();
    this.places = Globe.draw(cv.getContext('2d'), w, h, this.view, {
      plan, flown: a ? a.at : 0, pulse: a && !this.edit ? pulse : undefined, labels: true,
      bad: chk ? chk.legs.map((l, i) => (l.err ? i : -1)).filter((i) => i >= 0) : [],
      apts: drawing ? World.list.filter((x) => Career.hasRegion(x.region)) : [], next: drawing && ac ? Rtw.nextStops(plan, ac) : []
    }).map((p) => ({ a: p.a, x: p.x / dpr, y: p.y / dpr }));
  },
  down(e) {
    this.drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false };
    try { this.cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  },
  move(e) {
    const d = this.drag;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 5) d.moved = true;
    if (!d.moved) return;
    const k = 180 / Math.max(120, this.cv.clientWidth);
    this.view.lon0 = wrapDeg(this.view.lon0 - dx * k);
    this.view.lat0 = clamp(this.view.lat0 + dy * k, -80, 80);
    d.x = e.clientX; d.y = e.clientY;
    this.redraw();
    e.preventDefault();
  },
  up(e) {
    const d = this.drag;
    this.drag = null;
    if (!d || d.moved || !this.drawing()) return;
    // a tap: the nearest airport within reach of the finger, if the next leg may go there
    const r = this.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bd = isCoarsePointer() ? 26 : 16;
    for (const p of this.places) { const dd = Math.hypot(p.x - x, p.y - y); if (dd < bd) { bd = dd; best = p.a; } }
    if (!best) return;
    const plan = this.plan(), ac = this.ac();
    if (Rtw.nextStops(plan, ac).indexOf(best) >= 0) { Audio2.cue('page'); this.act('add:' + best.id); }
    else { Audio2.cue('bad'); this.toast(this.whyNot(plan, ac, best)); }
  },
  // why a tapped airport cannot come next
  whyNot(plan, ac, b) {
    const c = Rtw.check(plan.concat(b.id), ac), l = c.legs[c.legs.length - 1];
    return b.id + ': ' + (l && l.err ? this.errText(l.err, l) : tr('the route is already round'));
  },
  toast(text) {
    const box = el('rtwGlobe') && el('rtwGlobe').parentNode;
    if (!box) return;
    let t = box.querySelector('.rtwToast');
    if (!t) { t = document.createElement('span'); t.className = 'rtwToast'; box.appendChild(t); }
    t.textContent = text;
    t.classList.add('on');
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => t.classList.remove('on'), 2600);
  },
  // a frame drawn soon (when the globe is not turning already)
  redraw() {
    if (!this.raf && this.loopFn && this.cv) this.raf = requestAnimationFrame(this.loopFn);
  },

  // ---------- the buttons (data-act="rtw", data-v: what) ----------
  act(v) {
    const [k, arg] = String(v).split(':');
    const s = this.choice(), a = Rtw.active();
    switch (k) {
      case 'open': this.show(); return;
      case 'mode': s.mode = arg === 'iron' ? 'iron' : 'std'; break;
      case 'type': s.type = arg; break;
      case 'route': s.route = arg; s.own = false; this.view = null; break;
      case 'reverse': s.reverse = !s.reverse; break;
      case 'own': s.own = true; this.view = null; break;
      case 'add': {
        const plan = this.drawing() ? (a ? this.edit : s.plan) : null;
        if (plan && Rtw.nextStops(plan, this.ac()).some((b) => b.id === arg)) plan.push(arg);
        break;
      }
      case 'undo': {
        const plan = a ? this.edit : s.plan, keep = a ? a.at + 1 : 1;
        if (plan && plan.length > keep) plan.pop();
        break;
      }
      case 'clear': {
        if (a && this.edit) this.edit = this.edit.slice(0, a.at + 1);
        else s.plan = [Career.data.base];
        break;
      }
      case 'start': {
        const plan = this.plan();
        if (Rtw.start(s.mode, s.type, plan, s.own ? 'own' : s.route)) {
          Audio2.cue('good');
          s.plan = null;
          this.view = null;
        } else Audio2.cue('bad');
        break;
      }
      case 'edit': if (a) { this.edit = a.plan.slice(0, a.at + 1); this.confirm = null; } break;
      case 'editCancel': this.edit = null; break;
      case 'editSave': if (a && this.edit && Rtw.setRest(this.edit.slice(a.at + 1))) { this.edit = null; Audio2.cue('good'); } break;
      case 'abandon': this.confirm = 'abandon'; break;
      case 'abandonNo': this.confirm = null; break;
      case 'abandonYes': this.confirm = null; this.edit = null; Rtw.abandon(); break;
      case 'cert': { const h = Rtw.data().history.find((x) => x.id === arg); if (h) this.certificate(h); return; }
      default: break;
    }
    if (UI.tab === 'network' && Game.mode === 'ops') this.show();
  },

  // ---------- the cards ----------
  // on top of the Network tab: the globe, the expedition's state, the marks
  card() {
    const open = Rtw.open(), a = Rtw.active(), n = Rtw.needs(), medal = Rtw.medal();
    const plan = a ? a.plan : Rtw.routePlan('north', false);
    const p = a ? Rtw.progress() : null;
    const r = Rtw.data();
    const marks = RTW_CLASSES.map((c) => { const d = r.done[c.id] || {}; return '<span class="rtwChip' + (d.iron ? ' iron' : d.std ? ' on' : '') + '" title="' + esc(tr(c.name)) + '">' + esc(tr(c.name)) + '</span>'; }).join('');
    const line = a ? tr('Under way in the {ac}: leg {n} of {m}, {deg}° of 360°, {km} km.', { ac: esc(Rtw.acOf(a.type).name), n: a.at + 1, m: a.plan.length - 1, deg: Math.round(p.deg), km: fmtNum(Math.round(p.km)) })
      : open ? tr('Open to you. Pick the mode, the aircraft and the route — or draw your own.')
        : tr('Opens with the traffic rights in every region ({a} of {b}) and the ETOPS course.', { a: n.regions, b: n.of });
    return '<div class="rtwCard' + (open || a ? ' open' : '') + (Rtw.fresh() ? ' fresh' : '') + '">' +
      '<div class="rtwCardPic"><img src="' + Globe.url(plan, a ? a.at : 0, 220) + '" alt="">' +
      (medal ? '<span class="rtwCardMedal">' + rtwMedal(medal) + '</span>' : '') + '</div>' +
      '<div class="rtwCardMain"><div class="lgKicker">' + tr('The legend of the flights') + '</div>' +
      '<h3 class="lgName">🌐 ' + tr('Round the world') + '</h3>' +
      '<p class="acBlurb">' + line + '</p>' +
      '<div class="rtwChips">' + marks + '</div>' +
      '<div class="cFoot">' + (open || a ? '' : '<span class="need">🔒 ' + tr('Locked') + '</span>') +
      '<button class="btn' + (open || a ? ' default fwd' : '') + '" data-act="rtw" data-v="open">' + tr(a ? 'The expedition' : open ? 'Plan it' : 'What it takes') + '</button></div>' +
      '</div></div>';
  },
  // pinned over the board while an expedition is under way: its next leg
  pinned() {
    const a = Rtw.active();
    if (!a) return '';
    const c = Rtw.leg();
    if (!c) return '';
    const from = World.byId[c.fromId], to = World.byId[c.toId], ac = Rtw.acOf(a.type), p = Rtw.progress();
    const here = Career.here();
    const need = UI.requirement(c);
    return '<div class="contract rtwPin">' +
      '<div class="cHead">' + clientLogo(c) + '<b>' + tr('Round the world · leg {n} of {m}', { n: a.at + 1, m: a.plan.length - 1 }) + '</b>' +
      '<span class="rtwMode ' + a.mode + '">' + tr(a.mode === 'iron' ? 'Iron' : 'Round the world') + '</span></div>' +
      '<div class="cRoute"><b>' + routeHtml(c.fromId, c.toId) + '</b><span>' + routeHtml(placeHtml(from), placeHtml(to), 'soft') + '</span></div>' +
      '<div class="cGrid">' + row2(tr('Aircraft'), esc(ac.name)) + row2(tr('Load'), loadText(c)) + row2(tr('Distance'), c.distanceNm + ' nm') + row2(tr('Payout'), fmtMoney(c.pay)) +
      row2(tr('Progress'), Math.round(p.deg) + '° / 360° · ' + fmtNum(Math.round(p.km)) + ' / ' + fmtNum(RTW.MIN_KM) + ' km') + '</div>' +
      (here && here.id !== from.id ? '<p class="fineprint">✈ ' + tr('You fly to {city} as a passenger first — free.', { city: esc(aptCity(from)) }) + '</p>' : '') +
      '<div class="cFoot">' + (need ? '<span class="need">' + esc(need) + '</span>' : '') +
      '<button class="btn" data-act="rtw" data-v="open">' + tr('The expedition') + '</button>' +
      '<button class="btn' + (need ? ' disabled' : ' default fwd') + '" data-act="briefing" data-v="' + esc(c.id) + '"' + (need ? ' disabled' : '') + '>' + tr('Briefing') + '</button></div></div>';
  },
  // the Career tab's card: the medal, the marks, the records
  careerCard() {
    const r = Rtw.data();
    if (!Rtw.open() && !r.history.length) return '';
    return this.marksHtml() + this.recordsHtml();
  },

  // ---------- the briefing and the debrief ----------
  // in a leg's briefing: the globe with the whole route, the leg's place in it, an Iron warning
  briefHtml(c) {
    const a = Rtw.active();
    if (!c.rtw || !a) return '';
    return '<div class="rtwBrief"><img src="' + Globe.url(a.plan, a.at, 200) + '" alt="">' +
      '<div><b>' + tr('Round the world · leg {n} of {m}', { n: c.rtw.leg + 1, m: c.rtw.of }) + '</b>' +
      '<p>' + tr('The Meridian Club pays the leg like a contract; the reward comes at the finish in {id}.', { id: Career.data.base }) + '</p>' +
      (a.mode === 'iron' ? '<p class="need">⚔ ' + tr('Iron: once off the ground, this leg ends only at {id}. A crash, a cheat, quitting or a restart loses the whole expedition.', { id: c.toId }) + '</p>' : '') +
      '</div></div>';
  },
  // in the debrief: the stamp and the progress, a leg to fly again, an Iron expedition lost
  debriefHtml(r) {
    if (!r) return '';
    if (r.lost) return '<div class="rtwDebrief lost"><b>' + tr('Iron round the world is over') + '</b><p>' + tr('Lost at leg {n}. The expedition is in the history; a new one can start from {id}.', { n: r.entry ? r.entry.at + 1 : 1, id: Career.data.base }) + '</p></div>';
    if (r.retry) {
      const s = Rtw.stop();
      return '<div class="rtwDebrief"><b>' + tr('Round the world') + '</b><p>' + tr(r.cheated ? 'A leg flown with cheats does not count: it waits to be flown again from {city}.' : 'This leg waits to be flown again from {city}.', { city: esc(s ? aptCity(s) : '') }) + '</p></div>';
    }
    const a = World.byId[r.stamp.to];
    const notes = [r.stamp.equator ? '🔱 ' + tr('over the equator') : '', r.stamp.dateLine ? '📅 ' + tr('over the date line') : ''].filter(Boolean).join(' · ');
    return '<div class="rtwDebrief"><div class="rtwDebriefStamp">' + this.stampHtml(r.stamp, r.at) + '</div><div>' +
      '<b>' + (r.finish ? tr('Round the world — done!') : tr('Round the world · leg {n} of {m} — stamped {id}', { n: r.at, m: r.of, id: a ? a.id : r.stamp.to })) + '</b>' +
      '<div class="rtwKmBar small"><i style="width:' + (clamp(r.deg / 360, 0, 1) * 100).toFixed(1) + '%"></i></div>' +
      '<p>' + tr('{deg}° of 360° · {km} km', { deg: Math.round(r.deg), km: fmtNum(Math.round(r.km)) }) + (notes ? ' · ' + notes : '') + '</p>' +
      (r.finish ? '<p class="repGain">' + tr('Reputation with every client group: <b>+{r}</b>', { r: r.finish.rep }) + '</p>' : '') +
      '</div></div>';
  },

  // ---------- the finish ----------
  finale(fin) {
    const e = fin.entry, ac = Rtw.acOf(e.type);
    Fanfare.play();
    Fireworks.start(9);
    const box = document.createElement('div');
    box.className = 'rtwFinale';
    const title = fin.legend ? tr('The Dream round the world') : fin.iron ? tr('Iron round the world!') : tr('Round the world!');
    box.innerHTML = '<div class="rtwFinaleCard">' +
      '<canvas class="rtwFinaleGlobe" width="320" height="320"></canvas>' +
      '<div class="rtwFinaleMedal">' + rtwMedal(fin.legend ? 'gold' : fin.iron ? 'iron' : 'silver') + '</div>' +
      '<h2>' + title + '</h2>' +
      '<p>' + tr('{ac} · {n} legs · {km} km · {time} block time · average grade {g}', { ac: esc(ac.name), n: e.legs, km: fmtNum(Math.round(e.km)), time: fmtDuration(e.sec / 60), g: Rtw.gradeLetter(e.grade) }) + '</p>' +
      '<p class="rtwFinaleReward">' + tr('{kr} and +{rep} reputation with every client group', { kr: fmtMoney(fin.kr), rep: fin.rep }) + '</p>' +
      (fin.meridian ? '<p class="rtwFinaleReward">🌐 ' + tr('The Mriya has earned the Meridian finish — in the hangar\'s colours now.') + '</p>' : '') +
      '<div class="btnRow"><button class="btn default" data-r="cert">' + tr('Certificate') + '</button><button class="btn" data-r="close">' + tr('Close') + '</button></div></div>';
    UI.screen.appendChild(box);
    box.querySelector('[data-r="cert"]').addEventListener('click', () => this.certificate(e));
    box.querySelector('[data-r="close"]').addEventListener('click', () => this.closeOverlay(box));
    this.overlayKeys(box);
    // the globe turning with the whole route in gold
    const cv = box.querySelector('canvas'), g = cv.getContext('2d'), t0 = performance.now();
    const spin = () => {
      if (!document.body.contains(cv)) return;
      Globe.draw(g, cv.width, cv.height, { lat0: 12, lon0: wrapDeg(18 + (performance.now() - t0) / 1000 * 24) }, { plan: e.plan, flown: e.plan.length });
      requestAnimationFrame(spin);
    };
    spin();
  },
  // an overlay's keys: Esc closes it, Enter / Space press its focused (or first) button
  overlayKeys(box) {
    const prev = UI.keyHook;
    this.keyFn = (e) => {
      if (!document.body.contains(box)) { UI.keyHook = prev; return false; }
      if (e.key === 'Escape') { e.preventDefault(); this.closeOverlay(box); return true; }
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        const b = box.contains(document.activeElement) && document.activeElement.tagName === 'BUTTON' ? document.activeElement : box.querySelector('button');
        if (b) b.click();
        return true;
      }
      return false;
    };
    box.prevHook = prev;
    UI.keyHook = this.keyFn;
    if (!isCoarsePointer()) setTimeout(() => { const b = box.querySelector('button'); if (b) b.focus({ preventScroll: true }); }, 50);
  },
  closeOverlay(box) {
    if (box.parentNode) box.parentNode.removeChild(box);
    UI.keyHook = box.prevHook || null;
    const left = UI.screen.querySelector('.rtwFinale, .rtwCert');
    if (left) this.overlayKeys(left);
  },

  // ---------- the certificate ----------
  certificate(e) {
    const cv = document.createElement('canvas');
    cv.width = 1400; cv.height = 990;
    this.drawCertificate(cv.getContext('2d'), cv.width, cv.height, e);
    const box = document.createElement('div');
    box.className = 'rtwCert';
    const url = cv.toDataURL('image/png');
    box.innerHTML = '<div class="rtwCertCard"><img src="' + url + '" alt="' + esc(tr('Certificate of a flight round the world')) + '">' +
      '<div class="btnRow"><a class="btn default" download="round-the-world-' + e.date.slice(0, 10) + '.png" href="' + url + '">' + tr('Save as a picture') + '</a>' +
      '<button class="btn" data-r="close">' + tr('Close') + '</button></div></div>';
    UI.screen.appendChild(box);
    box.querySelector('[data-r="close"]').addEventListener('click', () => this.closeOverlay(box));
    this.overlayKeys(box);
  },
  drawCertificate(g, W, H, e) {
    const ac = Rtw.acOf(e.type), iron = e.mode === 'iron', gold = '#d9b25a';
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#13264a'); bg.addColorStop(1, '#0a1630');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = gold; g.lineWidth = 6; g.strokeRect(28, 28, W - 56, H - 56);
    g.lineWidth = 1.5; g.strokeRect(44, 44, W - 88, H - 88);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillStyle = gold;
    g.font = '600 26px Georgia, serif';
    g.fillText(tr('MERIDIAN CLUB · WORLD AVIATION'), W / 2, 110);
    g.font = '700 58px Georgia, serif';
    g.fillStyle = '#f4e3b0';
    g.fillText(tr(e.type === 'A225' ? 'The Dream round the world' : iron ? 'Iron round the world' : 'Round the world'), W / 2, 185);
    g.font = 'italic 28px Georgia, serif';
    g.fillStyle = '#dfe7f2';
    g.fillText(tr('This is to certify that'), W / 2, 240);
    g.font = '700 46px Georgia, serif';
    g.fillStyle = '#ffffff';
    g.fillText(e.pilot || Career.data.pilot.name, W / 2, 298);
    g.font = '26px Georgia, serif';
    g.fillStyle = '#dfe7f2';
    g.fillText(tr('flew round the world in the {ac}, from {id} to {id} across every meridian', { ac: ac ? ac.name : e.type, id: e.plan[0] }), W / 2, 344);
    // the route on a map of the whole world
    this.drawFlatMap(g, 120, 380, W - 240, 330, e.plan);
    g.font = '700 24px system-ui, sans-serif';
    g.fillStyle = '#f4e3b0';
    g.fillText(e.plan.join(' · '), W / 2, 752);
    const facts = [
      [tr('Distance'), fmtNum(Math.round(e.km)) + ' km'], [tr('Legs'), String(e.legs)],
      [tr('Block time'), fmtDuration(e.sec / 60)], [tr('Average grade'), Rtw.gradeLetter(e.grade)]
    ];
    facts.forEach(([k, v], i) => {
      const x = W / 2 - 90 + (i - 1.5) * 240;
      g.font = '18px system-ui, sans-serif'; g.fillStyle = '#9fb3cc'; g.fillText(k, x, 800);
      g.font = '700 32px system-ui, sans-serif'; g.fillStyle = '#ffffff'; g.fillText(v, x, 840);
    });
    const date = new Date(e.date);
    g.font = '20px Georgia, serif'; g.fillStyle = '#c9d4e2';
    g.fillText(isNaN(date) ? '' : date.toLocaleDateString(I18N.lang === 'sv' ? 'sv-SE' : I18N.lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, 905);
    // the seal
    g.save();
    g.translate(W - 165, H - 175);
    g.rotate(-0.18);
    g.strokeStyle = iron ? '#9aa3ad' : gold; g.lineWidth = 5;
    g.beginPath(); g.arc(0, 0, 78, 0, TAU); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 64, 0, TAU); g.stroke();
    g.fillStyle = iron ? '#c3cad2' : gold;
    g.font = '800 40px system-ui, sans-serif'; g.textBaseline = 'middle';
    g.fillText('360°', 0, -4);
    g.font = '700 14px system-ui, sans-serif';
    g.fillText(fmtNum(RTW.MIN_KM) + '+ km', 0, 30);
    g.restore();
  },
  // the whole world flat (longitude across, latitude up), the home base in the middle, the route
  // in gold over it
  drawFlatMap(g, x0, y0, w, h, plan) {
    const lon0 = World.byId[plan[0]] ? World.byId[plan[0]].lon : 18;
    const X = (lon) => x0 + ((wrapDeg(lon - lon0) + 180) / 360) * w, Y = (lat) => y0 + ((75 - lat) / 135) * h;
    g.save();
    g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    g.fillStyle = '#0d2747'; g.fillRect(x0, y0, w, h);
    g.strokeStyle = 'rgba(170, 210, 245, 0.12)'; g.lineWidth = 1;
    for (let lon = -180; lon < 180; lon += 30) { g.beginPath(); g.moveTo(X(lon), y0); g.lineTo(X(lon), y0 + h); g.stroke(); }
    for (let lat = -60; lat <= 60; lat += 30) { g.beginPath(); g.moveTo(x0, Y(lat)); g.lineTo(x0 + w, Y(lat)); g.stroke(); }
    g.strokeStyle = 'rgba(241, 199, 91, 0.35)'; g.setLineDash([6, 6]);
    g.beginPath(); g.moveTo(x0, Y(0)); g.lineTo(x0 + w, Y(0)); g.stroke();
    g.setLineDash([]);
    // the land (a ring cut where it crosses the map's edge is drawn twice, once on each side)
    for (const poly of LAND_POLYGONS) {
      for (const shift of [-360, 0, 360]) {
        g.beginPath();
        let prev = null;
        poly.forEach((p, i) => {
          let lon = p[0] - lon0;
          if (prev !== null) { while (lon - prev > 180) lon -= 360; while (lon - prev < -180) lon += 360; } else lon = wrapDeg(lon);
          prev = lon;
          const px = x0 + ((lon + shift + 180) / 360) * w, py = Y(p[1]);
          if (i) g.lineTo(px, py); else g.moveTo(px, py);
        });
        g.closePath();
        g.fillStyle = '#35553f'; g.fill();
      }
    }
    // the route
    g.strokeStyle = '#f1c75b'; g.lineWidth = 3.5; g.lineCap = 'round'; g.shadowColor = 'rgba(241, 199, 91, 0.7)'; g.shadowBlur = 8;
    for (let i = 1; i < plan.length; i++) {
      const pts = Globe.arc(World.byId[plan[i - 1]], World.byId[plan[i]], 1.5);
      g.beginPath();
      let px0 = null;
      for (const [lat, lon] of pts) {
        const px = X(lon), py = Y(lat);
        if (px0 === null || Math.abs(px - px0) > w / 2) g.moveTo(px, py); else g.lineTo(px, py);
        px0 = px;
      }
      g.stroke();
    }
    g.shadowBlur = 0;
    for (const id of plan) {
      const a = World.byId[id];
      g.fillStyle = id === plan[0] ? '#ffffff' : '#f1c75b';
      g.beginPath(); g.arc(X(a.lon), Y(a.lat), id === plan[0] ? 7 : 5, 0, TAU); g.fill();
    }
    g.restore();
    g.strokeStyle = 'rgba(217, 178, 90, 0.6)'; g.lineWidth = 2; g.strokeRect(x0, y0, w, h);
  },

  // ---------- leaving an Iron leg in the air ----------
  // Restart or Abandon from the pause of an Iron leg that has taken off: asked first, as it ends
  // the whole expedition (act: 'restart' or 'ops')
  confirmQuit(act) {
    UI.panel('<h2>' + tr('End the Iron expedition?') + '</h2>' +
      '<p class="lead">' + tr('This leg has taken off: on Iron it ends only at its arrival. Leaving it now loses the whole expedition round the world.') + '</p>' +
      '<div class="btnRow"><button class="btn danger" data-act="rtwQuit" data-v="' + act + '">' + tr('Lose the expedition') + '</button>' +
      '<button class="btn default" data-act="pauseBack" data-esc>' + tr('Back to the flight') + '</button></div>', 'narrow');
  },
  quit(act) {
    Rtw.lose('The flight was abandoned');
    Game.abortToOps();
  }
};

// (a new size of the window: the globe drawn again)
window.addEventListener('resize', () => { if (RtwScreen.cv) RtwScreen.redraw(); });

// ---------- in the flight ----------
// Every frame of a leg (Game.frame): the take-off (an Iron leg then ends only at its arrival),
// and three moments with a banner — the equator (and on a passenger leg the cabin is told), the
// date line, halfway round
const RtwFlight = {
  fl: null, deg: 0,

  update(fl, game) {
    if (!fl || game.practice || !fl.contract || !fl.contract.rtw || !Rtw.isLeg(fl.contract)) { this.fl = null; return; }
    const c = fl.contract;
    if (this.fl !== fl) {
      this.fl = fl;
      const from = World.byId[c.fromId];
      this.from = from;
      this.base = Rtw.progress().deg;
      this.dir = sign(wrapDeg(World.byId[c.toId].lon - from.lon)) || 1;
      this.legDeg = Math.abs(wrapDeg(World.byId[c.toId].lon - from.lon));
      this.prev = null;
      this.deg = this.base;
    }
    if (!fl.st.onGround) Rtw.airborne(c);
    const geo = Theatre.toGeo(fl.st.pos.x, fl.st.pos.z);
    this.deg = this.base + clamp(this.dir * wrapDeg(geo.lon - this.from.lon), 0, this.legDeg);
    const p = this.prev;
    this.prev = { lat: geo.lat, lon: geo.lon, deg: this.deg };
    if (!p || fl.st.onGround) return;
    if ((p.lat < 0) !== (geo.lat < 0)) {
      const south = geo.lat < 0;
      HUD.showBanner('🔱 ' + tr(south ? 'The equator — into the southern hemisphere' : 'The equator — into the northern hemisphere'), 'rtw', RTW.BANNER_MS);
      if (c.type === 'pax' && Cabin.on() && !(game.systems && game.systems.checklist)) {
        Audio2.announce(Audio2.tr(south ? 'Ladies and gentlemen, we have just crossed the equator. Welcome to the southern hemisphere.'
          : 'Ladies and gentlemen, we have just crossed the equator. Welcome to the northern hemisphere.'));
      }
    }
    if (Math.abs(geo.lon - p.lon) > 180) {
      // going east over it the calendar goes back a day, going west it jumps one
      const east = geo.lon < p.lon;
      const day = new Date(Date.now() + (east ? 0 : 86400000));
      const name = day.toLocaleDateString(I18N.lang === 'sv' ? 'sv-SE' : I18N.lang === 'ru' ? 'ru-RU' : 'en-GB', { weekday: 'long' });
      HUD.showBanner('📅 ' + tr(east ? 'The date line — it is {day} again: you live this day twice' : 'The date line — {day} is gone: you skipped it', { day: name }), 'rtw', RTW.BANNER_MS);
    }
    if (p.deg < 180 && this.deg >= 180) HUD.showBanner('🌐 ' + tr('Halfway round the world — 180° of 360°'), 'rtw', RTW.BANNER_MS);
  }
};

// the medal of a flight round the world: a globe in silver, iron or gold
function rtwMedal(kind) {
  const t = esc(tr(kind === 'gold' ? 'Gold globe' : kind === 'iron' ? 'Iron globe' : 'Silver globe'));
  return '<span class="rtwMedal ' + kind + '" title="' + t + '" aria-label="' + t + '"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/>' +
    '<path d="M12 2c-3.2 2.8-3.2 17.2 0 20M12 2c3.2 2.8 3.2 17.2 0 20M2 12h20M4 7h16M4 17h16"/></svg></span>';
}

// a city's symbol (art/landmarks.js) in its colour, its cut-outs in the stamp's paper, as an image URL
const LANDMARK_URLS = {};
const RTW_STAMP_BG = '#152131';
function landmarkUrl(id, color) {
  const key = (id || 'star') + color;
  if (LANDMARK_URLS[key]) return LANDMARK_URLS[key];
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  Landmarks.draw(cv.getContext('2d'), id, 0, 0, 64, color, RTW_STAMP_BG);
  LANDMARK_URLS[key] = cv.toDataURL();
  return LANDMARK_URLS[key];
}
