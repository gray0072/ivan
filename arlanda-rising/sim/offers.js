'use strict';

// Arlanda Rising — the Offers board (SPEC.md "Airlines and contracts": offers come as choices). `make` lists what may be
// offered to an airport now, by group — an airline that wants more slots, a shop or a car park, a manager pair, a team
// or a system, a wage round, a crash tender, and from chapter 4 a real brand that wants a unit and an airline that
// would start a route here for a route incentive — each as a decision ({ group, icon, title, text, params, default,
// options }: sim/plan.js applies an option). Free Play's rounds draw two of different groups (sim/freeplay.js); from
// chapter 4 the Office shows a board of two between missions (`board`, kept in S.board until the calendar moves),
// whose options are taken at once. A param whose name starts with 'sek' is a sum, written by the screen in its language. Deterministic: made from the world's seed and its day.

const Offers = {
  make(w, rnd, year) {
    const out = [], has = (k) => w.airport.items.some((i) => i.kind === k);
    // an airline wants more flights
    const al = Object.keys(AIRLINES).filter((c) => { const y = AIRLINES[c].years; return y[0] <= year && (!y[1] || y[1] >= year); });
    for (const code of al) {
      const types = { SK: year >= 1990 ? 'MD87' : year >= 1968 ? 'DC9' : 'CRVL', LF: year >= 1990 ? 'B737' : 'F28', STERLING: year >= 1972 ? 'B727' : 'CRVL', TRANSAIR: year >= 1968 ? 'B727' : 'DC6B',
        AY: year >= 1990 ? 'MD87' : 'DC9', LH: year >= 1990 ? 'B737' : 'B727', TRANSWEDE: 'MD87', BRAATHENS: 'B737', PREMIAIR: 'A320', NOVAIR: 'A320', RYANAIR: 'B737' };
      const type = types[code];
      if (!type || !AIRCRAFT[type]) continue;
      const n = 1 + Math.floor(rnd() * 3), kind = AIRLINES[code].kind;
      const months = kind === 'charter' ? [6, 7, 8, 9] : null;
      out.push({ group: 'airline', icon: '✈️', title: 'An airline asks for slots', text: '{al} would like {n} more flights a day with its {type}.',
        params: { al: AIRLINES[code].name, n, type: AIRCRAFT[type].name }, default: 'no',
        options: [
          { id: 'yes', airline: { code, routes: [Object.assign({ type, perDay: n, load: 0.72 }, months ? { months } : {})] }, label: 'Welcome them' },
          { id: 'incentive', airline: { code, routes: [Object.assign({ type, perDay: n + 1, load: 0.72 }, months ? { months } : {})] }, money: -3e6, label: 'More, with a discount' },
          { id: 'no', meters: { airlines: -2 }, label: 'No, thank you' }
        ] });
    }
    // shops and car parks
    const shop = year >= 1976 && !has('dutyFree') ? 'dutyFree' : !has('cafe') ? 'cafe' : 'restaurant';
    out.push({ group: 'shop', icon: '🛍️', title: 'A shop wants a unit', text: 'A company offers to open a {what} in the terminal, if you pay for the fit-out.',
      params: { what: BUILDINGS[shop].name }, default: 'no', options: [{ id: 'yes', build: shop, label: 'Build it' }, { id: 'no', label: 'Not now' }] });
    if (!has('parkingBig')) out.push({ group: 'shop', icon: '🚗', title: 'A car park', text: 'More passengers drive every year. A car park earns every day — and the neighbours do not love it.',
      params: {}, default: 'no', options: [{ id: 'yes', build: 'parkingBig', meters: { neighbours: -3 }, label: 'Build it' }, { id: 'no', label: 'Not now' }] });
    // managers, by pairs, for a team without a head
    const depts = Object.keys(DEPTS).filter((d) => (d === 'it' ? w.people && w.people.it > 0 : (w.domains[d] || 0) > 0) && !(w.people && w.people.managers[d]));
    for (const d of depts) {
      const cands = Object.keys(MANAGERS).filter((id) => MANAGERS[id].dept === d && MANAGERS[id].from <= year);
      if (cands.length < 2) continue;
      out.push({ group: 'people', icon: '👔', title: 'A head for {dept}', text: 'Two candidates want the job. Each is good at two things and weak at one.',
        params: { dept: DEPTS[d].name }, default: 'none',
        options: cands.slice(0, 2).map((id) => ({ id, manager: id, label: MANAGERS[id].name })).concat([{ id: 'none', label: 'Nobody' }]) });
    }
    // a team or a system for a domain
    for (const d of Object.keys(w.domains)) {
      const lv = w.domains[d] || 0, L = DOMAINS[d] && DOMAINS[d].levels[lv + 1];
      if (!L || year < L.from || ((w.unlock || {})[d] || 0) < lv + 1) continue;
      if (lv === 0) out.push({ group: 'people', icon: '👷', title: 'A team for {dom}', text: 'The personnel office can hire a team that takes this work off your hands.',
        params: { dom: DOMAINS[d].name }, default: 'no', options: [{ id: 'yes', hire: d, label: 'Hire the team' }, { id: 'no', label: 'Not now' }] });
      else if ((L.it || 0) === 0 || has('computerRoom')) out.push({ group: 'system', icon: '💻', title: 'A system for {dom}', text: 'A supplier offers {sys}. Keep the team as the fallback, or let it go?',
        params: { dom: DOMAINS[d].name, sys: L.name }, default: 'no',
        options: [{ id: 'keep', system: { dom: d, how: 'keep' }, label: 'Buy it, keep the team' }, { id: 'layoff', system: { dom: d, how: 'layoff' }, label: 'Buy it, let the team go' }, { id: 'no', label: 'Not now' }] });
    }
    // a wage round of a team
    const teams = Object.keys((w.people || {}).depts || {}).filter((d) => d !== 'it' && (w.domains[d] || 0) > 0);
    if (teams.length && rnd() < 0.5) {
      const d = teams[Math.floor(rnd() * teams.length)];
      out.push({ group: 'union', icon: '✊', kind: 'union', dept: d, title: 'A wage round', text: '{union} asks for a raise of 6 %.', params: { union: DEPTS[d].union }, default: 'mediator',
        options: [
          { id: 'accept', union: { dept: d, how: 'accept' }, label: 'Accept 6 %' },
          { id: 'counter', union: { dept: d, how: 'counter', offer: 0.045 }, label: 'Offer 4.5 %' },
          { id: 'mediator', union: { dept: d, how: 'mediator' }, label: 'Ask the mediator' },
          { id: 'refuse', union: { dept: d, how: 'refuse' }, label: 'Refuse' }
        ] });
    }
    // the fire service for the biggest aircraft flying
    let need = 0;
    for (const code of Object.keys(w.airlines)) for (const r of w.airlines[code].routes || []) need = Math.max(need, AIRCRAFT[r.type].cat);
    const cat = has('fireStation') ? Math.min(FIRE_CAT_MAX, FIRE_CAT_BASE + w.airport.items.filter((i) => i.kind === 'crashTender').length) : 0;
    if (cat < FIRE_CAT_MAX) out.push({ group: 'safety', icon: '🚒', title: 'A crash tender', text: 'The fire chief wants another crash tender: the fire category goes up by one.',
      params: {}, default: need > cat ? 'yes' : 'no', options: [{ id: 'yes', build: 'crashTender', label: 'Buy it' }, { id: 'no', label: 'Not now' }] });
    // ---------- session 4: brands and route incentives ----------
    if (w.airport.units) {
      const placed = {};
      for (const u of w.airport.units) if (u.brand) placed[u.term + ':' + u.brand] = true;
      const free = w.airport.units.filter((u) => !u.brand && u.term !== 't1');
      const cands = [];
      for (const u of free) for (const id of brandsFor(year, u.size)) if (!placed[u.term + ':' + id]) cands.push([u.term, id]);
      if (cands.length) {
        const [term, id] = cands[Math.floor(rnd() * cands.length)];
        const b = BRANDS[id];
        out.push({ group: 'shop', icon: '🏪', title: '{brand} wants a unit', text: '{brand} would like to open in {term}. It pays {sekRent} a month in rent, and a share of what the passengers spend.',
          params: { brand: b.name, term: TERMINALS[term].name, sekRent: b.rent }, default: 'no',
          options: [{ id: 'yes', brand: { term, id }, label: 'Give it a unit' }, { id: 'no', label: 'Not now' }] });
      }
    }
    if (w.airport.openSkies) {
      for (const code of Object.keys(AIRLINES)) {
        const d = AIRLINES[code], y = d.years;
        if (!d.court || y[0] > year || (y[1] && y[1] < year)) continue;
        const r = d.court.filter((x) => x.from <= year).pop();
        const flying = w.airlines[code] && (w.airlines[code].routes || []).some((x) => x.perDay > 0);
        if (!r || flying) continue;
        out.push({ group: 'airline', icon: '🤝', title: '{al} could start a route', text: '{al} would fly {n} times a day with its {type} — for {p} off its fees for two years.',
          params: { al: d.name, n: r.perDay, type: AIRCRAFT[r.type].name, p: Math.round(r.need * 100) + ' %' }, default: 'no',
          options: [{ id: 'yes', court: { code, share: r.need }, label: 'Give the incentive' }, { id: 'no', label: 'Not now' }] });
      }
    }
    return out;
  },

  // ---------- the Office's board (chapter 4 on) ----------
  // two offers of different groups, made once for the day the calendar stands at
  board() {
    if (!S.airport.openSkies) return null;
    if (S.board && S.board.day === S.day) return S.board;
    let rs = hashOf('board', S.seed, S.day);
    const rnd = () => { const r = rngNext(rs); rs = r[1]; return r[0]; };
    const list = this.make(S, rnd, Calendar.year()), cards = [];
    while (list.length && cards.length < 2) {
      const o = list.splice(Math.floor(rnd() * list.length), 1)[0];
      if (cards.some((c) => c.group === o.group)) continue;
      o.id = 'b' + S.day + '_' + cards.length;
      cards.push(o);
    }
    S.board = { day: S.day, cards, taken: {} };
    return S.board;
  },
  take(i, optionId) {
    const b = this.board(), def = b && b.cards[i];
    if (!def || b.taken[i]) return false;
    const o = def.options.find((x) => x.id === optionId);
    if (!o) return false;
    Plan.apply(o);
    b.taken[i] = optionId;
    logEvent('offerTaken', { id: def.id, option: optionId });
    return true;
  }
};
