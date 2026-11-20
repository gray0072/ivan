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
      case 'flag': return tr(c.id);
      case 'built': return tr('Build: {what}', { what: tr(BUILDINGS[c.kind].name) });
    }
    return c.k;
  },
  // a goal's value now, as shown next to it
  value(r) {
    const c = r.goal, v = r.value;
    if (typeof v === 'boolean') return v ? '✓' : '—';
    switch (c.k) {
      case 'onTime': return Math.round(v * 100) + ' %';
      case 'avgDelay': case 'airportDelay': case 'checkinWait': case 'maxWait': return this.num(v, 1) + ' ' + tr('min');
      case 'profit': case 'money': case 'spent': return sek(v);
      default: return this.num(v, 0);
    }
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
    }
    return k.kind;
  },
  taskIcon(kind) { return { stand: '🛬', fuel: '⛽', checkin: '🧳', plough: '❄️' }[kind] || '❗'; },

  flightState(f) {
    switch (f.st) {
      case 'sched': case 'inbound': return tr('On its way');
      case 'approach': return f.eta !== null && S.clock > f.eta + 0.5 ? tr('Holding — the runway is not free') : tr('On final approach');
      case 'taxiIn': return tr('Taxiing to its stand');
      case 'waitStand': return tr('Waiting for a free stand');
      case 'turn': return f.tr && f.tr.ready !== null ? tr('Ready to go') : f.tr && f.tr.board !== null ? tr('Boarding') : f.tr && (f.tr.fuel === 'asked' || f.tr.fuel === 'queued') ? tr('Waiting for fuel') : tr('Turnaround');
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
    if (o.build) { const b = BUILDINGS[o.build]; out.push('−' + sek(b.price)); if (b.days) out.push(tr('ready in {n} days', { n: b.days })); }
    if (o.extraDays) out.push(tr('+{n} days of work', { n: o.extraDays[2] }));
    if (o.crews) out.push(tr('+{n} crew', { n: o.crews }));
    for (const k of Object.keys(o.meters || {})) out.push(this.meterName(k) + ' ' + (o.meters[k] > 0 ? '+' : '−') + Math.abs(o.meters[k]));
    if (o.neighboursBase) out.push(tr('quieter for years'));
    if (o.airline) out.push(tr('{n} flights a day in summer', { n: o.airline.routes.reduce((s, r) => s + r.perDay, 0) }));
    if (!out.length) out.push(tr('nothing changes'));
    return out.join(' · ');
  },
  // stars as HTML: the ones earned lit, the rest dim
  stars(n, of) { let s = ''; for (let i = 0; i < (of || 3); i++) s += '<span class="star' + (i < n ? ' on' : '') + '">★</span>'; return s; }
};
