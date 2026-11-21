'use strict';

// Arlanda Rising — the words the screens share: the five meters, a goal and its value, a tray task, a flight's
// state, the minutes a mission takes, the effects of a decision's option, small HTML helpers. Every text goes
// through tr(); texts from data/ (names, briefings) are passed through tr() where they are shown.

const METERS = [
  { k: 'airlines', icon: '✈️', name: 'Airlines' },
  { k: 'passengers', icon: '🧳', name: 'Passengers' },
  { k: 'neighbours', icon: '🏡', name: 'Neighbours' },
  { k: 'staff', icon: '👷', name: 'Staff' },
  { k: 'safety', icon: '🛡️', name: 'Safety' }
];

// the decisions a flag goal waits for, as shown (data/missions: `{ k: 'flag', id }`)
const FLAG_NAMES = {
  trainChosen: 'Decide who builds the train', lowFareAnswered: 'Answer the low-fare question',
  targetSet: 'Answer the owner\'s target', strandedHelped: 'Look after the stranded passengers',
  guestsPlanned: 'Plan the guests\' stands', jetsReady: 'Make room for the business jets',
  // session 6
  shopsAnswered: 'Answer the shops about the rent', staffAnswered: 'Decide what happens to the staff', slotsGiven: 'Give the empty slots to an airline',
  cyberAnswered: 'Protect the network', nightsChosen: 'Decide what the nights are for', peakReady: 'Get ready for the peak'
};

const Text = {
  esc(s) { return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); },
  meterName(k) { const m = METERS.find((x) => x.k === k); return m ? tr(m.name) : k; },
  // the Passengers meter as 1–5 stars
  paxStars(v) { return (1 + v / 25).toFixed(1); },
  num(v, d) { const r = Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0); return I18N.lang === 'en' ? String(r) : String(r).replace('.', ','); },

  goal(c) {
    const n = c.max !== undefined ? c.max : c.min;
    switch (c.k) {
      case 'onTime': return tr('On time: at least {p} %', { p: Math.round(c.p * 100) });
      case 'avgDelay': return tr('Average delay: at most {n} min', { n: this.num(n, 1) });
      case 'airportDelay': return tr('Delay caused by the airport: at most {n} min', { n: this.num(n, 1) });
      case 'lost': return n ? tr('At most {n} flights sent away or cancelled', { n }) : tr('No flight sent away or cancelled');
      case 'checkinWait': return tr('Check-in wait: at most {n} min', { n: this.num(n, 1) });
      case 'maxWait': return tr('Longest wait: at most {n} min', { n: this.num(n, 1) });
      case 'profit': return n ? tr('Profit: at least {m}', { m: sek(n) }) : tr('End with a profit');
      case 'money': return tr('Money of your own: at least {m}', { m: sek(n) });
      case 'closeCalls': return n ? tr('At most {n} close calls', { n }) : tr('No close call on the runway');
      case 'noise': return tr('Noise: at most {n}', { n });
      case 'dutyTasks': return n ? tr('At most {n} tasks left to the duty manager', { n }) : tr('No task left to the duty manager');
      case 'playerTasks': return tr('Do at least {n} tasks yourself', { n });
      case 'spent': return tr('Spend at most {m} on building', { m: sek(n) });
      case 'airlines': case 'passengers': case 'neighbours': case 'staff': case 'safety':
        return tr('{meter}: at least {n}', { meter: this.meterName(c.k), n });
      case 'project': {
        const def = PROJECTS[c.id];
        const what = (c.stages || []).length ? c.stages.map((s) => tr(def.stages[s].name)).join(', ') : tr(def.name);
        return tr('Build: {what}', { what });
      }
      case 'flag': return tr(FLAG_NAMES[c.id] || c.id);
      case 'built': return tr('Build: {what}', { what: tr(BUILDINGS[c.kind].name) });
      case 'level': return tr('{dom}: {level}', { dom: tr(DOMAINS[c.dom].name), level: tr(DOMAINS[c.dom].levels[c.min].name) });
      case 'manager': return tr('A head of {dept}', { dept: tr(DEPTS[c.dept].name) });
      case 'noStrike': return tr('No strike');
      case 'lostBags': return n ? tr('At most {n} bags lost', { n }) : tr('No bag lost');
      case 'unannounced': return n ? tr('At most {n} delays not announced', { n }) : tr('Every delay announced');
      case 'fireCat': return tr('Fire category at least {n}', { n });
      case 'systems': return tr('At most {n} systems', { n });
      case 'handsOff': return tr('Teams and systems do at least {n} tasks', { n });
      case 'handTasks': return tr('At most {n} tasks by hand', { n });
      case 'lastMonth': return tr('The last month earns at least {m}', { m: sek(n) });
      // session 4
      case 'securityWait': return tr('Security wait: at most {n} min', { n: this.num(n, 1) });
      case 'brands': return tr('At least {n} units with a brand', { n });
      case 'brandsIn': return tr('The brands earn at least {m}', { m: sek(n) });
      case 'mood': return tr('{al}: mood at least {n}', { al: (AIRLINES[c.code] || {}).name || c.code, n });
      case 'perDay': return tr('{al}: at least {n} flights a day', { al: (AIRLINES[c.code] || {}).name || c.code, n });
      case 'carriers': return tr('At least {n} airlines flying here', { n });
      case 'train': return tr('The train to Arlanda is built');
      case 'score': return tr('At least {n} points', { n });
      // session 5
      case 'borderWait': return tr('Border wait: at most {n} min', { n: this.num(n, 1) });
      case 'estate': return tr('Real estate rents at least {m} a month', { m: sek(n) });
      case 'green': return tr('Green rating: at least {n}', { n });
      case 'permitOk': return tr('Keep within the environmental permit');
      case 'runways': return tr('{n} runways in use', { n });
      case 'owner': return tr('Arlanda run by {owner}', { owner: c.id });
      // session 6
      case 'loss': return tr('Lose at most {m}', { m: sek(n) });
      case 'cargo': return tr('Freight earns at least {m}', { m: sek(n) });
      case 'mothballed': return tr('At least {n} terminals mothballed', { n });
      case 'laidOff': return n ? tr('At most {p} of the jobs empty', { p: this.pct(n) }) : tr('No job empty');
      case 'readiness': return tr('Fallback readiness: at least {n} %', { n });
      case 'chargers': return tr('At least {n} charging stands', { n });
      case 'joined': return tr('Terminals 4 and 5 joined');
    }
    return c.k;
  },
  // a goal's value now, as shown next to it
  value(r) {
    const c = r.goal, v = r.value;
    if (typeof v === 'boolean') return v ? '✓' : '—';
    switch (c.k) {
      case 'onTime': return Math.round(v * 100) + ' %';
      case 'avgDelay': case 'airportDelay': case 'checkinWait': case 'maxWait': case 'securityWait': case 'borderWait': return this.num(v, 1) + ' ' + tr('min');
      case 'profit': case 'money': case 'spent': case 'lastMonth': case 'brandsIn': case 'estate': case 'loss': case 'cargo': return sek(v);
      case 'laidOff': return this.pct(v);
      case 'readiness': return Math.round(v) + ' %';
      case 'perDay': return this.num(v, 1);
      default: return this.num(v, 0);
    }
  },
  // minutes as "45 min" or "1 h 20 min"
  duration(min) {
    const h = Math.floor(min / 60), m = Math.round(min % 60);
    return h ? (m ? tr('{h} h {m} min', { h, m }) : tr('{h} h', { h })) : tr('{n} min', { n: m });
  },
  // the whole mission's goals, live (a goal over the mission, like "End with a profit"): nothing when it has none
  missionGoals() {
    const m = Missions.def();
    if (!m || !m.goal || !m.goal.length) return '';
    return '<div class="gMission"><b>' + this.esc(tr('The mission')) + '</b>' + this.goalsHtml(Goals.all(m.goal, Missions.liveTotal())) + '</div>';
  },
  goalsHtml(results) {
    return '<ul class="goals">' + results.map((r) => '<li class="' + (r.ok ? 'ok' : 'no') + '"><span class="mark">' + (r.ok ? '✓' : '✗') + '</span><span class="g">' +
      this.esc(this.goal(r.goal)) + '</span><b>' + this.esc(this.value(r)) + '</b></li>').join('') + '</ul>';
  },

  surface(id) { return id === 'apron' ? tr('The apron') : tr('Runway {name}', { name: (Airport.runway(id) || {}).name || '' }); },
  task(k) {
    const f = Flights.get(k.target);
    switch (k.kind) {
      case 'stand': {
        if (!f) return '';
        const n = Math.max(0, Math.ceil(f.eta - S.clock));
        return f.landed !== null ? tr('{no} has landed — pick a stand', { no: f.no }) : n > 0 ? tr('{no} lands in {n} min — pick a stand', { no: f.no, n }) : tr('{no} is landing — pick a stand', { no: f.no });
      }
      case 'fuel': {
        const st = f && Airport.stand(f.stand);
        return tr('{no} on stand {stand} needs fuel — send a truck', { no: f ? f.no : '', stand: st ? st.name : '' });
      }
      case 'checkin': return tr('Check-in queue {n} min — open a desk', { n: Math.round(Passengers.wait()) });
      case 'plough': { const s = Runways.surface(k.target); return tr('{surface}: {mm} mm of snow — send the ploughs', { surface: this.surface(k.target), mm: this.num(s ? s.snow : 0, 1) }); }
      case 'bags': { const st = f && Airport.stand(f.stand); return tr('Bags of {no} on stand {stand} — send the carts', { no: f ? f.no : '', stand: st ? st.name : '' }); }
      case 'announce': return tr('{no} is late — announce the delay', { no: f ? f.no : '' });
      // session 5
      case 'lane': return tr('Security queue {n} min — open a lane', { n: Math.round(Passengers.secWait()) });
      case 'booth': return tr('Passport queue {n} min — open a booth', { n: Math.round(Math.min(99, Passengers.borderWait())) });
      case 'deice': { const st = f && Airport.stand(f.stand); return tr('{no} on stand {stand} needs de-icing — send a truck', { no: f ? f.no : '', stand: st ? st.name : '' }); }
      // session 6
      case 'charge': { const st = f && Airport.stand(f.stand); return tr('{no} on stand {stand} needs charging — send the mobile charger', { no: f ? f.no : '', stand: st ? st.name : '' }); }
    }
    return k.kind;
  },
  taskIcon(kind) { return { stand: '🛬', fuel: '⛽', checkin: '🧳', plough: '❄️', bags: '🛄', announce: '📢', lane: '🛂', booth: '🛃', deice: '🧊', charge: '🔋' }[kind] || '❗'; },
  // a department's and a domain's names, a domain's level as shown
  dept(id) { return tr((DEPTS[id] || {}).name || id); },
  dom(id) { return tr((DOMAINS[id] || {}).name || id); },
  level(d, lv) { const L = DOMAINS[d] && DOMAINS[d].levels[lv]; return L ? tr(L.name) : ''; },
  manager(id) { const m = MANAGERS[id]; return m ? m.face + ' ' + m.name : id; },
  // a manager's two strengths and the flaw, as lines
  managerLines(id) { const m = MANAGERS[id]; return m ? m.good.map((g) => '＋ ' + tr(g)).concat(['− ' + tr(m.bad)]) : []; },
  // "1 job", "6 jobs"
  jobs(n) { return n === 1 ? tr('1 job') : tr('{n} jobs', { n }); },
  // the cells of a terminal an own shop takes (data/buildings.js `cells`)
  cells(n) { return n === 1 ? tr('1 cell') : tr('{n} cells', { n }); },
  pct(v) { return Math.round(v * 100) + '\u00a0%'; },

  flightState(f) {
    switch (f.st) {
      case 'sched': case 'inbound': return tr('On its way');
      case 'approach': return f.eta !== null && S.clock > f.eta + 0.5 ? tr('Holding — the runway is not free') : tr('On final approach');
      case 'taxiIn': return tr('Taxiing to its stand');
      case 'waitStand': return tr('Waiting for a free stand');
      case 'turn':
        if (f.tr && (f.tr.deice === 'asked' || f.tr.deice === 'queued')) return tr('Waiting for de-icing');
        if (f.tr && f.tr.deice === 'going') return tr('Being de-iced');
        // session 6: an electric aircraft charging, a hydrogen one taking on fuel
        if (f.tr && f.tr.charge && (f.tr.fuel === 'asked' || f.tr.fuel === 'cqueued')) return tr('Waiting for the charger');
        if (f.tr && f.tr.charge === 'h2' && f.tr.fuel === 'going') return tr('Taking on hydrogen');
        if (f.tr && f.tr.charge && f.tr.fuel === 'going') return tr('Charging');
        return f.tr && f.tr.ready !== null ? tr('Ready to go') : f.tr && f.tr.board !== null ? tr('Boarding') : f.tr && (f.tr.fuel === 'asked' || f.tr.fuel === 'queued') ? tr('Waiting for fuel') : tr('Turnaround');
      case 'parked': return tr('Parked, getting ready');
      case 'taxiOut': return tr('Taxiing out');
      case 'gone': return tr('Departed');
      case 'diverted': return tr('Sent to another airport');
      case 'cancelled': return tr('Cancelled');
    }
    return f.st;
  },

  // about how many real minutes at ▶ a mission takes
  minutes(m) {
    let s = 0;
    for (const st of m.stages) {
      if (st.mode === 'ops') s += (clockMin(st.to) - clockMin(st.from)) / 60 * OPS_HOUR_SECONDS;
      else s += st.days * PLAN_DAY_SECONDS + (st.choices || []).length * DECISION_SECONDS;
    }
    return Math.max(1, Math.round(s / 60));
  },
  stageWhen(st) {
    return st.mode === 'ops' ? st.from + '–' + st.to : tr('{n} days', { n: st.days });
  },
  // what an option of a decision does, in a line
  effects(o) {
    const out = [];
    if (o.money) out.push((o.money > 0 ? '+' : '−') + sek(Math.abs(o.money)));
    const builds = [].concat(o.build || []);
    if (builds.length) {
      const b = BUILDINGS[builds[0]], sum = builds.reduce((s, k) => s + BUILDINGS[k].price, 0);
      out.push('−' + sek(sum));
      if (b.days) out.push(tr('ready in {n} days', { n: b.days }));
      // session 4: the payback from the airport's own traffic
      const m = Invest.whatIf(builds[0]);
      if (m && (m.in > 0) && builds.length === 1) out.push(m.payback !== null ? tr('pays back in {n} months', { n: Math.max(1, Math.round(m.payback)) }) : tr('never pays back at today\'s traffic'));
    }
    if (o.brand) {
      const b = BRANDS[o.brand.id], free = Terminal.units(o.brand.term).find((u) => !u.brand && Terminal.fits(u, o.brand.id));
      out.push(tr('{brand} in {term}', { brand: b.name, term: tr(Terminal.name(o.brand.term)) }));
      if (free) out.push('−' + sek(UNIT_FIT[free.size]) + ' · ' + tr('rent {r} a month', { r: sek(b.rent) }));
      else out.push(tr('no free unit there'));
    }
    if (o.court) {
      const r = Airlines.courtRoute(o.court.code), al = (AIRLINES[o.court.code] || {}).name;
      if (r && Airlines.answer(o.court.code, o.court.share) === 'yes') out.push(tr('{al}: {n} flights a day', { al, n: r.perDay }) + ' · ' + tr('{p} off its fees for two years', { p: this.pct(o.court.share) }));
      else out.push(tr('{al} will say no: it wants more', { al }));
    }
    if (o.incentive) out.push(tr('{p} off the fees of {al} for two years', { p: this.pct(o.incentive.share), al: (AIRLINES[o.incentive.code] || {}).name }));
    if (o.term) out.push(tr('{al} moves to {term}', { al: (AIRLINES[o.term.code] || {}).name, term: tr(Terminal.name(o.term.term)) }));
    if (o.train === 'own') out.push(tr('you build it, half paid by the owner · {m} a train passenger', { m: sek(TRAIN_TICKET) }));
    if (o.train === 'concession') out.push(tr('free for you · {m} a train passenger', { m: sek(TRAIN_STATION_FEE) }));
    if (o.extraDays) out.push(tr('+{n} days of work', { n: o.extraDays[2] }));
    if (o.crews) out.push(tr('+{n} crew', { n: o.crews }));
    for (const k of Object.keys(o.meters || {})) out.push(this.meterName(k) + ' ' + (o.meters[k] > 0 ? '+' : '−') + Math.abs(o.meters[k]));
    if (o.neighboursBase) out.push(tr('quieter for years'));
    for (const a of [o.airline, o.airline2]) {
      if (!a) continue;
      const n = a.routes.reduce((s, r) => s + r.perDay, 0);
      out.push(a.routes.some((r) => r.months) ? tr('{n} flights a day in summer', { n }) : tr('{n} flights a day', { n }));
    }
    if (o.hire) out.push(tr('a team for {dom}', { dom: this.dom(o.hire) }) + ' · −' + sek(HIRE_COST * DOMAINS[o.hire].levels[1].staff) + ' · ' + tr('wages every month'));
    if (o.manager) out.push(tr('salary {m} a month', { m: sek(MANAGER_SALARY * MANAGERS[o.manager].salary) }));
    if (o.it) out.push(tr('+{n} IT people', { n: o.it }));
    if (o.system) {
      const lv = (S.domains[o.system.dom] || 0) + 1, L = DOMAINS[o.system.dom].levels[lv];
      if (L) out.push('−' + sek(Systems.price(o.system.dom, o.system.how)) + ' · ' + tr('{m} a month', { m: sek(L.month) }) + (L.days ? ' · ' + tr('ready in {n} days', { n: L.days }) : ''));
      if (o.system.how === 'layoff') out.push(tr('morale down, no fallback'));
      else out.push(tr('the team stays as the fallback'));
    }
    if (o.union) {
      const r = People.roundOutcome(o.union.dept, o.union.how, o.union.offer);
      if (r.raise) out.push(tr('wages +{p}', { p: this.num(r.raise * 100, 1) + ' %' }));
      out.push(r.strike ? tr('strike notice: a strike in a week') : tr('no strike'));
    }
    if (o.temps) out.push(tr('temps for {dept} for three months', { dept: this.dept(o.temps) }));
    if (o.train && o.train !== 'own' && o.train !== 'concession') out.push(tr('a course for {dept}', { dept: this.dept(o.train) }) + ' · −' + sek(TRAIN_COST * Math.max(1, People.jobs(o.train))));
    // session 5
    if (o.booths) out.push(tr('+{n} passport booths', { n: o.booths }) + ' · −' + sek(BUILDINGS.booth.price * o.booths));
    if (o.lanes) out.push(tr('+{n} security lanes', { n: o.lanes }) + ' · −' + sek(BUILDINGS.lane.price * o.lanes));
    if (o.biofuel !== undefined) out.push(tr('{p} of the fuel bio', { p: this.pct(o.biofuel) }) + ' · ' + tr('{m} a month', { m: sek(BIOFUEL_MONTH * o.biofuel) }) + ' · ' + tr('green rating +{n}', { n: Math.round(o.biofuel * 100 * GREEN_PTS.biofuel) }));
    if (o.stranded) out.push('−' + sek(o.stranded));
    // session 6
    for (const t of [].concat(o.mothball || [])) out.push(tr('{term} closed', { term: tr(Terminal.name(t)) }));
    for (const t of [].concat(o.reopen || [])) out.push(S.airport.mothballed && S.airport.mothballed[t] === true ? tr('{term} open again in {n} days', { term: tr(Terminal.name(t)), n: REOPEN_DAYS }) + ' · −' + sek(REOPEN_COST) : tr('{term} is open already', { term: tr(Terminal.name(t)) }));
    if (o.relief === true) out.push(tr('{p} of the rent off for a year', { p: this.pct(RENT_RELIEF) }) + ' · −' + sek(Terminal.rent() * RENT_RELIEF * 12));
    if (o.relief === false) out.push(tr('half of the shops close'));
    if (o.staff && o.staff.how === 'furlough') out.push(tr('{p} at home, the state pays most of their wages', { p: this.pct(o.staff.share) }));
    if (o.staff && o.staff.how === 'layoff') out.push(tr('{p} of the jobs gone · three months of wages now', { p: this.pct(o.staff.share) }) + ' · ' + tr('morale down'));
    if (o.rehire) out.push(tr('new people in two weeks, six with a clearance'));
    if (o.cutFill) out.push(tr('{p} of the empty jobs filled at once', { p: this.pct(o.cutFill.share) }));
    if (o.drills) out.push(tr('every system\'s readiness back to 100 %') + ' · −' + sek(DRILL_COST * Object.keys(S.domains).filter((d) => S.domains[d] >= 2).length));
    if (o.pier) { const d = PROJECTS.pier2040.designs[o.pier]; out.push(tr('{n} gates', { n: d.stands.length }) + ' · × ' + this.num(d.k, 2) + (d.charge ? ' · ' + tr('a charger at every gate') : '')); }
    if (o.flag && !out.length) out.push(tr('a decision taken'));
    if (!out.length) out.push(tr('nothing changes'));
    return out.join(' · ');
  },
  // a vehicle's limit (Airport.cap): why it stops there, short (the build button at its limit) and in full (its tooltip)
  capWhy(cap) {
    return cap.why === 'stand' ? tr('Max: one per stand') : cap.why === 'runway' ? tr('Max: a convoy per runway') : tr('Max: fire category {n}', { n: cap.n });
  },
  capTip(kind, cap) {
    if (kind === 'fuelTruck') return tr('An aircraft takes one fuel truck at a time: one per stand is the most worth having ({n} stands).', { n: cap.n });
    if (kind === 'deicer') return tr('An aircraft takes one de-icing truck at a time: one per stand is the most worth having ({n} stands).', { n: cap.n });
    if (kind === 'plough') return tr('A convoy of {c} ploughs sweeps a runway; with a convoy for each runway they all sweep at once ({n} runways).', { c: PLOUGH_CONVOY, n: cap.n });
    return tr('Each crash tender raises the fire category by one, from {base} up to {top}: {max} tenders are the most worth having.', { base: FIRE_CAT_BASE, top: FIRE_CAT_MAX, max: cap.max });
  },
  // stars as HTML: the ones earned lit, the rest dim
  stars(n, of) { let s = ''; for (let i = 0; i < (of || 3); i++) s += '<span class="star' + (i < n ? ' on' : '') + '">★</span>'; return s; }
};
