'use strict';

// ============================================================
// World Aviation — the filter and sort bars over the contract
// board (Dispatch) and the hangar: which offers or types to show
// and in what order. The choice is kept in the settings
// (Career.settings.board / .hangar), so it is still there on the
// next visit. Used by UI.dispatchBody / UI.hangarBody and the
// 'boardFilter' / 'hangarFilter' actions in ui/ui.js.
// ============================================================

const Filters = {
  // ---------- the contract board ----------
  // type: a client group (pax / cargo / bush) or all; sort: a figure, dir: 1 up, -1 down (each
  // sort starts the way that is usually wanted: the newest destinations, the best pay, the
  // easiest and the nearest first; a tie keeps the board's order). Novelty: how many times the
  // pilot has flown to the destination (Career.visitsTo). The board offers only what the
  // selected type may fly (Career.generateContracts), so there is nothing to hide by that
  BOARD_SORTS: {
    novelty: { name: 'Novelty', dir: 1, key: (c) => Career.visitsTo(c.toId) },
    rep: { name: 'Reputation', dir: -1, key: (c) => c.repGain },
    pay: { name: 'Pay', dir: -1, key: (c) => c.pay },
    difficulty: { name: 'Difficulty', dir: 1, key: (c) => c.difficulty },
    distance: { name: 'Distance', dir: 1, key: (c) => c.distanceNm }
  },
  board() {
    const s = Career.settings;
    const b = s.board || (s.board = {});
    if (b.type !== 'all' && !FACTIONS[b.type]) b.type = 'all';
    if (!this.BOARD_SORTS[b.sort]) { b.sort = 'novelty'; b.dir = 0; }   // (also the old 'as offered')
    if (b.dir !== 1 && b.dir !== -1) b.dir = this.BOARD_SORTS[b.sort].dir || 1;
    delete b.flyable;                                   // an older 'only what I can fly' toggle
    return b;
  },
  // the offers to show, in order
  boardList(contracts) {
    const b = this.board();
    let list = contracts.filter((c) => b.type === 'all' || c.faction === b.type);
    const sort = this.BOARD_SORTS[b.sort];
    list = list.map((c, i) => [c, i]).sort((p, q) => (sort.key(p[0]) - sort.key(q[0])) * b.dir || p[1] - q[1]).map((p) => p[0]);
    return list;
  },
  boardBar() {
    const b = this.board();
    const type = ['all'].concat(Object.keys(FACTIONS)).map((k) =>
      this.chip('boardFilter', 'type:' + k, b.type === k, k === 'all' ? tr('All') : tr(FACTIONS[k].short), k === 'all' ? '' : FACTIONS[k].color)).join('');
    return '<div class="filterBar">' +
      '<div class="setGroup"><span>' + tr('Show') + '</span>' + type + '</div>' +
      '<div class="setGroup"><span>' + tr('Sort') + '</span>' + this.sortChips('boardFilter', this.BOARD_SORTS, b) + '</div>' +
      '</div>';
  },
  // a press on the board's bar: type:<id>, sort:<id> (the active sort again turns it round)
  boardAction(v) {
    const b = this.board();
    this.apply(b, v, this.BOARD_SORTS);
    Career.saveSettings();
  },

  // ---------- the hangar ----------
  // type: what kind of aeroplane; weight: by the maximum take-off weight; available: only the
  // types you may lease; sort by weight (lightest first, as the ladder goes), range, payload or lease
  HANGAR_TYPES: {
    all: { name: 'All' },
    prop: { name: 'Turboprops', test: (a) => a.engineType === 'prop' },
    regional: { name: 'Regional jets', test: (a) => a.engineType !== 'prop' && /regional/i.test(a.klass) },
    narrow: { name: 'Narrowbodies', test: (a) => /narrowbody/i.test(a.klass) },
    wide: { name: 'Widebodies', test: (a) => a.engineType !== 'prop' && !/freighter/i.test(a.klass) && a.mtow > HANGAR_FILTER.HEAVY_T * 1000 },
    freight: { name: 'Freighters', test: (a) => /freighter/i.test(a.klass) }
  },
  HANGAR_WEIGHTS: {
    all: { name: 'Any weight' },
    light: { name: 'up to {t} t', test: (a) => a.mtow <= HANGAR_FILTER.LIGHT_T * 1000 },
    medium: { name: '{a}–{b} t', test: (a) => a.mtow > HANGAR_FILTER.LIGHT_T * 1000 && a.mtow <= HANGAR_FILTER.HEAVY_T * 1000 },
    heavy: { name: 'over {t} t', test: (a) => a.mtow > HANGAR_FILTER.HEAVY_T * 1000 }
  },
  HANGAR_SORTS: {
    weight: { name: 'Weight', dir: 1, key: (a) => a.mtow },
    range: { name: 'Range', dir: -1, key: (a) => a.maxRangeNm },
    payload: { name: 'Payload', dir: -1, key: (a) => a.payloadKg },
    lease: { name: 'Lease', dir: 1, key: (a) => a.rent }
  },
  hangar() {
    const s = Career.settings;
    const h = s.hangar || (s.hangar = {});
    if (!this.HANGAR_TYPES[h.type]) h.type = 'all';
    if (!this.HANGAR_WEIGHTS[h.weight]) h.weight = 'all';
    if (!this.HANGAR_SORTS[h.sort]) h.sort = 'weight';
    if (h.dir !== 1 && h.dir !== -1) h.dir = this.HANGAR_SORTS[h.sort].dir;
    h.available = !!h.available;
    return h;
  },
  hangarList(types) {
    const h = this.hangar();
    const ty = this.HANGAR_TYPES[h.type], wt = this.HANGAR_WEIGHTS[h.weight], sort = this.HANGAR_SORTS[h.sort];
    return types.filter((a) => (!ty.test || ty.test(a)) && (!wt.test || wt.test(a)) && (!h.available || Career.unlocked(a)))
      .sort((p, q) => (sort.key(p) - sort.key(q)) * h.dir || p.mtow - q.mtow);
  },
  hangarBar() {
    const h = this.hangar();
    const L = HANGAR_FILTER.LIGHT_T, H = HANGAR_FILTER.HEAVY_T;
    const type = Object.keys(this.HANGAR_TYPES).map((k) => this.chip('hangarFilter', 'type:' + k, h.type === k, tr(this.HANGAR_TYPES[k].name))).join('');
    const weight = Object.keys(this.HANGAR_WEIGHTS).map((k) =>
      this.chip('hangarFilter', 'weight:' + k, h.weight === k, tr(this.HANGAR_WEIGHTS[k].name, { t: k === 'light' ? L : H, a: L, b: H }))).join('');
    return '<div class="filterBar">' +
      '<div class="setGroup"><span>' + tr('Type') + '</span>' + type + '</div>' +
      '<div class="setGroup"><span>' + tr('Weight') + '</span>' + weight +
      this.chip('hangarFilter', 'available', h.available, '✓ ' + tr('Only what I may lease')) + '</div>' +
      '<div class="setGroup"><span>' + tr('Sort') + '</span>' + this.sortChips('hangarFilter', this.HANGAR_SORTS, h) + '</div>' +
      '</div>';
  },
  hangarAction(v) {
    const h = this.hangar();
    this.apply(h, v, this.HANGAR_SORTS, 'available');
    Career.saveSettings();
  },

  // ---------- shared ----------
  apply(st, v, sorts, toggle) {
    const [k, id] = String(v).split(':');
    if (k === toggle) st[toggle] = !st[toggle];
    else if (k === 'sort') {
      if (st.sort === id) st.dir = -st.dir;
      else { st.sort = id; st.dir = sorts[id].dir || 1; }
    } else if (k === 'reset') {
      for (const f of Object.keys(st)) if (f !== 'sort' && f !== 'dir') st[f] = typeof st[f] === 'boolean' ? false : 'all';
    } else if (id !== undefined) st[k] = id;
  },
  chip(act, v, on, label, dot) {
    return '<button class="chip' + (on ? ' on' : '') + '" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + on + '">' +
      (dot ? '<i class="chipDot" style="background:' + dot + '"></i>' : '') + label + '</button>';
  },
  // the sort chips; the active one carries its direction and turns round when pressed again
  sortChips(act, sorts, st) {
    return Object.keys(sorts).map((k) => {
      const on = st.sort === k, arrow = on && sorts[k].key ? (st.dir < 0 ? ' ↓' : ' ↑') : '';
      return this.chip(act, 'sort:' + k, on, tr(sorts[k].name) + arrow);
    }).join('');
  },
  // what the list says when the filters leave nothing
  empty(act, text) {
    return '<div class="filterEmpty"><p class="lead">' + text + '</p>' +
      '<button class="btn" data-act="' + act + '" data-v="reset">' + tr('Show all') + '</button></div>';
  }
};
