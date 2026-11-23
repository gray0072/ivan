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
  targetSet: 'Answer the owner\'s target',
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
  // Free Play: why the clock runs at its pace now (FreePace.mode)
  paceWhy(md) {
    return { tray: tr('Slow: your tray has {n} tasks', { n: md.n }), soon: tr('Slow: a task for your hands is coming'), snow: tr('Slow: snow while the ploughs are yours'),
      incident: tr('Slow: something is wrong'), watch: tr('Slow: you are watching'), off: tr('Auto pace is off'), cruise: tr('Fast: nothing needs you'), idle: tr('Fast: no traffic today') }[md.why] || '';
  },
  // Free Play: the next milestone of the history — its year and name, and what it needs built (the plan panel's top)
  history() {
    const m = Free.pending();
    if (!m) return { year: Calendar.year(), text: tr('The history has reached 2040: the airport is yours.') };
    const miss = Free.missing(m).filter((r) => !Free.owners(r.split('.')[0])).map((r) => {
      const [p, s] = r.split('.');
      return s ? tr(PROJECTS[p].name) + ': ' + tr(PROJECTS[p].stages[s].name) : tr(PROJECTS[p].name);
    });
    return { year: Calendar.year(), name: tr(m.name), when: Calendar.date(Calendar.parse(m.date)).y,
      text: miss.length ? tr('Needs: {list}', { list: miss.join(', ') }) : tr('Comes in {y}', { y: Calendar.date(Calendar.parse(m.date)).y }) };
  },
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
      case 'built': return (c.n || 1) > 1 ? tr('At least {n}: {what}', { n: c.n, what: tr(BUILDINGS[c.kind].name) }) : tr('Build: {what}', { what: tr(BUILDINGS[c.kind].name) });
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
      // any unit of any terminal, the kerb's desks and Sky City's too (Terminal.brands): let in the Terminal view, in a
      // plan stage or the Office
      case 'brands': return tr('Let at least {n} units to real shops or cafés (🏪 Terminal view)', { n });
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
      // the units let of those the goal asks for: 2/4
      case 'brands': return this.num(v, 0) + '/' + c.min;
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
  manager(id) { const m = People.mdef(id); return m ? m.face + ' ' + m.name : id; },
  // a manager's two strengths and the flaw, as lines
  managerLines(id) { const m = People.mdef(id); return m ? m.good.map((g) => '＋ ' + tr(g)).concat(['− ' + tr(m.bad)]) : []; },
  // session 7: what a head needs: a department without a team gets one with the head (its price and days), as a line
  headTeam(id) {
    const m = People.mdef(id);
    if (!m || !People.needsTeam(id)) return '';
    const L = DOMAINS[m.dept] && DOMAINS[m.dept].levels[1];
    return L ? tr('A head makes a team better. {dept} has no team yet: it is hired with the head — {m}, ready in {n} days.', { dept: this.dept(m.dept), m: sek(HIRE_COST * L.staff), n: People.hireDays(m.dept) }) : '';
  },
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
    // only what can still be bought is built and paid (Airport.buy): at a limit, the reason instead
    const cap = builds.length && Airport.cap(builds[0]), room = cap ? Math.max(0, cap.max - Airport.owned(builds[0])) : builds.length && Airport.full(builds[0]) ? 0 : builds.length;
    if (room < builds.length) out.push(room ? tr('room for {n} more', { n: room }) : this.buyWhy(builds[0]));
    if (room) {
      const b = BUILDINGS[builds[0]], sum = builds.slice(0, room).reduce((s, k) => s + BUILDINGS[k].price, 0);
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
    if (o.manager) {
      out.push(tr('salary {m} a month', { m: sek(MANAGER_SALARY * People.mdef(o.manager).salary) }));
      // a head for a department with no team brings the team (unless the option hires it already)
      if (!o.hire && People.needsTeam(o.manager)) { const d = People.mdef(o.manager).dept; out.push(tr('a team for {dom}', { dom: this.dom(d) }) + ' · −' + sek(HIRE_COST * DOMAINS[d].levels[1].staff) + ' · ' + tr('wages every month')); }
    }
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
  // a limit (Airport.cap): why it stops there, short (the buy menu's card: its limit, and the reason at it) and in full
  // (the card's tooltip, and a line on the card once it is reached)
  capWhy(cap) {
    switch (cap.why) {
      case 'max': return cap.max === 1 ? tr('Max: one is enough') : tr('Max: {n}', { n: cap.max });
      case 'charger': return tr('Max: every stand that fits has one');
      case 'stand': return tr('Max: one per stand');
      case 'runway': return tr('Max: a convoy per runway');
      case 'hall': return tr('Max: the halls are full');
      case 'checkpoint': return tr('Max: the security checkpoints are full');
      case 'border': return tr('Max: the passport hall is full');
      case 'remote': return tr('Max: {n} remote stands', { n: cap.max });
    }
    return tr('Max: fire category {n}', { n: cap.n });
  },
  // the limit while there is room, as the buy menu's card says it: how many of how many, and why it stops there
  // ("3 of 6: one per stand"); a thing with no limit says so; a shop the cells it takes and those free, a car park the
  // places against those needed
  capLine(kind) {
    const b = BUILDINGS[kind] || {}, cap = Airport.cap(kind), n = Airport.owned(kind);
    if (!cap) {
      if (b.cells) return tr('Takes {cells} in a terminal', { cells: this.cells(b.cells) }) + ' · ' + tr('{free} of {max} free', { free: Airport.cellsMax() - Airport.cellsTaken(), max: Airport.cellsMax() });
      if (b.places) return tr('Car parks') + ': ' + this.parkingLine();
      return tr('No limit');
    }
    const of = tr('{n} of {max}', { n, max: cap.max }), more = cap.max - n;
    let why;
    switch (cap.why) {
      case 'stand': why = tr('one per stand ({n} stands)', { n: cap.n }); break;
      case 'runway': why = tr('a convoy of {c} per runway ({n} runways)', { c: PLOUGH_CONVOY, n: cap.n }); break;
      case 'fire': why = tr('each raises the fire category by one, up to {top}', { top: FIRE_CAT_MAX }); break;
      case 'hall': why = tr('room for {n} more in the check-in halls', { n: more }); break;
      case 'checkpoint': why = tr('room for {n} more at the security checkpoints', { n: more }); break;
      case 'border': why = tr('room for {n} more in the passport hall', { n: more }); break;
      case 'remote': why = tr('their row has room for {n}', { n: cap.max }); break;
      case 'charger': why = tr('one on each stand that fits'); break;
      default:
        if (cap.max === 1) return tr('One is enough');
        why = kind === 'solar' ? tr('the green rating counts two') : kind === 'cargoStand' ? tr('the cargo apron has room for {n}', { n: cap.max }) : '';
    }
    return why ? of + ': ' + why : of;
  },
  capTip(kind, cap) {
    if (kind === 'fuelTruck') return tr('An aircraft takes one fuel truck at a time: one per stand is the most worth having ({n} stands).', { n: cap.n });
    if (kind === 'deicer') return tr('An aircraft takes one de-icing truck at a time: one per stand is the most worth having ({n} stands).', { n: cap.n });
    if (kind === 'plough') return tr('A convoy of {c} ploughs sweeps a runway; with a convoy for each runway they all sweep at once ({n} runways).', { c: PLOUGH_CONVOY, n: cap.n });
    if (kind === 'mcharger') return tr('A mobile charger charges one aircraft at a time: one per stand is the most worth having ({n} stands).', { n: cap.n });
    if (kind === 'desk') return tr('The check-in halls of the terminals standing have room for {max} desks. A new terminal brings more room.', { max: cap.max });
    if (kind === 'lane') return tr('The security checkpoints of the terminals standing have room for {max} lanes. A new terminal brings more room.', { max: cap.max });
    if (kind === 'booth') return tr('The passport hall has room for {max} booths.', { max: cap.max });
    if (kind === 'solar') return tr('The green rating counts two solar parks at most.');
    if (kind === 'cargoStand') return tr('The cargo apron has room for {max} stands.', { max: cap.max });
    if (kind === 'charger') return tr('A charger goes on a stand near the terminal, up to size code D: {n} of them have none yet.', { n: Airport.chargeable().length });
    if (cap.why === 'max') return tr('One is all the airport needs.');
    if (kind === 'stand') return tr('Their row beside the first apron has room for {max} aircraft up to a Boeing 737 or an A321, clear of the aprons of later years. The passengers walk out to them. The new aprons and piers bring stands of their own.', { max: cap.max });
    return tr('Each crash tender raises the fire category by one, from {base} up to {top}: {max} tenders are the most worth having.', { base: FIRE_CAT_BASE, top: FIRE_CAT_MAX, max: cap.max });
  },
  // the car parks at today's traffic (Airport.parkingNeed): "300 places, 700 needed", and what that means
  parkingLine() {
    const have = Airport.places(), more = Airport.places(true) - have, need = groupThousands(Airport.parkingNeed());
    return more ? tr('{have} places + {more} being built, {need} needed', { have: groupThousands(have), more: groupThousands(more), need }) : tr('{have} places, {need} needed', { have: groupThousands(have), need });
  },
  parkingTip() {
    return tr('The drivers among today\'s passengers need about {need} places (the coaches and the train take some of them away); your car parks have {have}. Each place a driver takes earns parking fees, {m} a month now; a place more than the drivers need earns nothing.',
      { need: groupThousands(Airport.parkingNeed()), have: groupThousands(Airport.places(true)), m: sek(Airport.parkingMonth()) });
  },
  // what the buy menu's card says about a thing that can be bought (data/buildings.js): the explanation of its limit in
  // full, why it cannot be bought now (short), what it needs first (Airport.needs)
  buyTip(kind) {
    const b = BUILDINGS[kind] || {}, cap = Airport.cap(kind);
    if (cap) return this.capTip(kind, cap);
    if (b.cells) return tr('Takes {cells} in a terminal. To make room, sell a shop from its terminal\'s card: tap the terminal.', { cells: this.cells(b.cells) });
    if (b.places) return this.parkingTip();
    return '';
  },
  buyWhy(kind) {
    const b = BUILDINGS[kind] || {}, cap = Airport.cap(kind);
    return cap ? this.capWhy(cap) : b.cells ? tr('No room: needs {cells}', { cells: this.cells(b.cells) }) : tr('Enough: one more would earn nothing');
  },
  needWhy(need) {
    switch (need) {
      case 'kerb': return tr('Needs a terminal with a check-in hall');
      case 'intl': return tr('Needs the international terminal');
      case 'security': return tr('Needs a security checkpoint');
      case 'deice': return tr('Needs de-icing at the airport');
      case 'border': return tr('Needs passport control');
      case 'green': return tr('Needs the green rating');
    }
    return tr('Needs Cargo City');
  },
  // the runway direction when it is calm: what each one flies over the towns (sim/runways.js use)
  dirOver(d) { return d === '01' ? tr('Landings over Märsta') : Airport.runway('r3') ? tr('Take-offs over Upplands Väsby') : tr('Take-offs over Märsta'); },
  // session 7: the next steps on a domain's ladder, for the plan panel and the Ops Center — a team to hire (from the
  // hands), a system to buy (its price, running cost, jobs and days on the line; from a team the buttons say what happens to
  // the team: kept as the fallback with its retraining, or let go with the wages it saves — never the system's price as the
  // price of letting people go), a team to hire back beside a system with none, and what is on its way. Each step:
  // { icon, title, sub, wait, acts: [{ data, label, sum, main }], notes: [] }; `data` the button's data attributes.
  ladder(d) {
    const out = [], lv = S.domains[d] || 0, unlock = (S.unlock || {})[d] || 0, r = S.sys && S.sys[d];
    const L1 = DOMAINS[d].levels[1], hiring = S.people && S.people.hiring.find((h) => h.dom === d);
    const why = { room: 'Needs the computer room', hall: 'Needs the baggage hall', pads: 'Needs the remote de-icing pads', sorter: 'Needs the sorting hall' };
    const ready = (at) => tr('ready in {n} days', { n: Math.max(0, at - S.day) });
    // a team from the hands
    if (lv === 0 && unlock >= 1 && L1 && !(r && r.installAt)) {
      const w = Systems.cannot(d, 1);
      if (hiring) out.push({ icon: '👷', title: tr('Hire: {what}', { what: tr(L1.name) }), sub: this.jobs(L1.staff), wait: ready(hiring.at) });
      else if (!w) out.push({ icon: '👷', title: tr('Hire: {what}', { what: tr(L1.name) }), sub: this.jobs(L1.staff) + ' · ' + tr('ready in {n} days', { n: S.plan ? People.hireDays(d) : 0 }) + ' · ' + tr('wages every month'),
        acts: [{ data: 'data-up="' + d + '" data-to="1"', label: tr('Hire'), sum: sekBare(Systems.price(d, 'keep', 1)), main: true }] });
    }
    // a system: the next one (straight from the hands or a team to level 2)
    const to = Systems.nextSystem(d), L = DOMAINS[d].levels[to];
    if (L && unlock >= to && Calendar.year() >= L.from) {
      const sub = sek(L.price) + ' · ' + tr('{m} a month', { m: sekBare(L.month || 0) }) + ' · ' + this.jobs(L.staff || 0) + (L.it ? ' · ' + tr('{n} IT people', { n: L.it }) : '') + (L.days ? ' · ' + tr('{n} days', { n: L.days }) : '');
      const w = Systems.cannot(d, to), step = { icon: '⚙️', title: tr(L.name), sub, acts: [], notes: [] };
      if (r && r.installAt) { step.sub = ''; step.wait = ready(r.installAt); out.push(step); }
      else if (w && why[w]) { step.wait = tr(why[w]); out.push(step); }
      else if (!w && lv === 1) {
        const n = L1.staff;
        step.notes.push(tr('Your team of {n} — what happens to it?', { n }));
        step.acts.push({ data: 'data-sys="' + d + '" data-how="keep"', label: tr('Buy, keep the team as the fallback'), sum: '+' + sekBare(Systems.retrain(d)) + ' ' + tr('retraining'), main: true });
        step.acts.push({ data: 'data-sys="' + d + '" data-how="layoff"', label: tr('Buy, let the team go'), sum: tr('saves {m} a month', { m: sekBare(Systems.teamWages(d)) }) });
        step.notes.push(tr('Letting people go: every team\'s morale −{n}, the unions angrier (a strike likelier), the neighbours unhappy. A team can be hired back later.', { n: LAYOFF_MORALE }));
        out.push(step);
      } else if (!w) {
        step.acts.push({ data: 'data-sys="' + d + '" data-how="keep"', label: tr('Buy'), sum: sekBare(L.price), main: true });
        if (lv === 0 && L1 && L1.staff) step.notes.push(tr('It comes with its own operators. No team beside it: when it fails, the work comes to you — hire a team as the fallback, now or later.'));
        out.push(step);
      }
    }
    // a team beside a system with none (let go, or the system bought straight from the hands)
    if (hiring && hiring.back) out.push({ icon: '👷', title: tr('A team as the fallback'), sub: this.jobs(L1.staff), wait: ready(hiring.at) });
    else if (People.canHireBack(d)) out.push({ icon: '👷', title: tr('No team as the fallback'), sub: tr('When the system fails, the work comes to you.'),
      acts: [{ data: 'data-back="' + d + '"', label: r && r.laidOff ? tr('Hire a team back') : tr('Hire a team as the fallback'), sum: sekBare(HIRE_COST * L1.staff) + ' · ' + tr('{n} days', { n: S.plan ? People.hireDays(d) : 0 }), main: true }] });
    return out;
  },
  // a span of days as "3 years 2 months", "5 months" or "12 days" (a head's retirement, a search)
  span(days) {
    days = Math.max(0, Math.round(days));
    if (days < 31) return days === 1 ? tr('1 day') : tr('{n} days', { n: days });
    const months = Math.floor(days / 30.4), y = Math.floor(months / 12), mo = months % 12;
    const ys = y === 1 ? tr('1 year') : tr('{n} years', { n: y }), ms = mo === 1 ? tr('1 month') : tr('{n} months', { n: mo });
    return y ? (mo ? ys + ' ' + ms : ys) : ms;
  },
  // when a department's head retires (MANAGER_YEARS after starting)
  retire(dept) {
    const d = People.retireDay(dept);
    if (d === null) return '';
    return d <= S.day ? tr('Retires this month') : tr('Retires in {t} ({d})', { t: this.span(d - S.day), d: fmtDate(d) });
  },
  // the fallback readiness shown as "practice" (RU «Выучка», SV «Rutin») with its word
  practiceWord(v) { return v >= PRACTICE_SHARP ? tr('sharp') : v >= PRACTICE_RUSTY ? tr('getting rusty') : tr('out of practice'); },
  // a system's practice for the Ops Center and Departments: a bar with its percent and word, how fast it falls, the last
  // drill and what it means if the system failed now (Systems.fallback: the rule of sim/tasks.js); `drill` adds the
  // Drill button (data-drill) while it is below 100 %. '' for a domain without a system
  practice(dom, drill) {
    const r = S.sys && S.sys[dom], lv = S.domains[dom] || 0;
    if (lv < 2 || !r || r.installAt) return '';
    const v = r.readiness, f = Systems.fallback(dom);
    const cls = v >= PRACTICE_SHARP ? '' : v >= PRACTICE_RUSTY ? 'mid' : 'low';
    let h = '<div class="practice"><p class="kv"><b>🎯 ' + this.esc(tr('Practice')) + '</b> <span class="mbar small"><i class="' + cls + '" style="width:' + Math.round(v * 100) + '%"></i></span> <b>' + this.pct(v) + '</b> <span>' + this.esc(this.practiceWord(v)) + '</span></p>' +
      '<small>' + this.esc(tr('How well the team still knows the manual way (the fallback readiness). Without a drill it falls {p} a month, to {min} at the least.', { p: this.pct(READINESS_DECAY), min: this.pct(READINESS_MIN) })) + ' ' +
      this.esc(r.drilled != null ? tr('Last drill: {d}.', { d: fmtDate(r.drilled) }) : tr('No drill since the system went live ({d}).', { d: fmtDate(r.since) })) + '</small>';
    if (!r.kept) h += '<small>' + this.esc(tr('No team beside the system: if it fails, the work comes to you — practice does not help.')) + '</small>';
    else if (f) h += '<small>' + this.esc((lv >= 3 ? tr('If both systems fail (an outage):') : tr('If the system fails now:')) + ' ' +
      tr('the team takes over at {s} of its speed and gets {q} of its choices right (after a drill: 100 % and {d}).', { s: this.pct(f.speed), q: this.pct(f.right), d: this.pct(f.drilled) })) + '</small>';
    if (drill && v < 1) h += '<div class="ladActs"><button class="btn toggle" data-drill="' + dom + '">' + this.esc(tr('Drill')) + ' <small>' + sekBare(DRILL_COST) + '</small></button></div>';
    return h + '</div>';
  },
  // the head of a domain's department: its name, or "No head — find one" (the departments of people that can have one)
  headLine(d) {
    if (!DEPTS[d] || DEPTS[d].police || !People.staffed(d)) return '';
    const m = People.manager(d);
    return m ? '👔 ' + this.manager(m.id) : '👔 ' + tr('No head — find one');
  },
  // stars as HTML: the ones earned lit, the rest dim
  stars(n, of) { let s = ''; for (let i = 0; i < (of || 3); i++) s += '<span class="star' + (i < n ? ' on' : '') + '">★</span>'; return s; }
};
