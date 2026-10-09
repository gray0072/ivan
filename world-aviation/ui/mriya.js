'use strict';

// ============================================================
// World Aviation — the Mriya's assembly hall: the An-225 built again
// part by part (opened from its card in the hangar, ui/ui.js).
//
//   - the hologram turning over the floor (render/mriya3d.js), the
//     fitted parts gold in it, the progress in a ring beside it
//   - the legend and the real figures
//   - its finish: eleven to choose from (data/mriya.js), its own free,
//     the others MRIYA.FINISH_KR each; one not yet bought can be tried
//     on the hologram before it is paid for
//   - the blueprint (art/mriyaplan.js): every part's place, the fitted
//     ones gold; a bought part is carried onto it and snaps into its
//     place when let go close enough (MRIYA.SNAP_M)
//   - the stand: the parts bought and not yet fitted
//   - the catalogue: all fifty, cheapest first, by group and state,
//     each with a real figure and what it is for, and its price in
//     money and in one client group's reputation (Career.mriyaPrice)
//
// Carrying a part: drag it from the stand onto the blueprint (mouse or
// finger); or press it (a click, a tap, Enter) to pick it up, then move
// it with the arrow keys (Shift: finer) or drag it, and let go with
// Enter / a tap where it goes; Esc puts it back. Its place glows while
// it is carried. The fiftieth part fitted: fireworks, a fanfare
// (core/fanfare.js, ui/fireworks.js), the hologram turns to gold.
// ============================================================

const MriyaScreen = {
  root: null, carry: null, press: null, ghostDrag: null, justDragged: false, finaleOn: false,

  isOpen() { return !!(this.root && document.body.contains(this.root)); },
  settings() {
    const s = Career.settings;
    const m = s.mriya || (s.mriya = {});
    if (m.group !== 'all' && !MRIYA_GROUPS.some((g) => g.id === m.group)) m.group = 'all';
    if (['all', 'shop', 'bought', 'placed'].indexOf(m.status) < 0) m.status = 'all';
    if (m.sort !== 'price' && m.sort !== 'rep') m.sort = 'price';
    if (m.dir !== 1 && m.dir !== -1) m.dir = 1;
    return m;
  },
  part(id) { return MRIYA_PARTS.find((p) => p.id === id); },
  groupName(id) { const g = MRIYA_GROUPS.find((x) => x.id === id); return g ? tr(g.name) : ''; },

  // ---------- the screen ----------
  // try: a finish to try on at once (the hangar card's swatch of one not bought yet)
  show(tryOn) {
    MriyaPlan.init();
    const L = MRIYA_LEGEND, lay = MriyaPlan.lay;
    const vb = [-lay.S / 2 - 3.5, -7, lay.S + 9, lay.L + 11];
    UI.panel(
      '<div class="mHead">' +
      '<button class="btn back" data-act="tab" data-v="hangar" data-esc>' + tr('Hangar') + '</button>' +
      '<div class="mPurse" id="mPurse"></div></div>' +
      '<div class="mHero">' +
      '<canvas id="mCanvas" aria-label="' + esc(tr('The An-225 Mriya, turning')) + '"></canvas>' +
      '<div class="mTitle"><h2>' + esc(L.title) + ' <i lang="uk">' + L.native + '</i></h2>' +
      '<p>' + esc(tr(L.motto)) + '</p></div>' +
      '<div class="mProgress" id="mProgress"></div>' +
      '<span class="mTurn">' + tr('drag to turn it') + '</span>' +
      '</div>' +
      '<div class="mLegend"><div class="mStory">' + L.text.map((p) => '<p>' + esc(tr(p)) + '</p>').join('') + '</div>' +
      '<div class="mFacts">' + L.facts.map(([k, v]) => '<div><span>' + esc(tr(k)) + '</span><b>' + esc(tr(v)) + '</b></div>').join('') + '</div></div>' +
      '<div class="mFinishes"><h3>' + tr('Colour') + '</h3><div id="mFin"></div></div>' +
      '<div id="mLock"></div>' +
      '<div class="mWork">' +
      '<div class="mBoard">' +
      '<h3>' + tr('Blueprint') + '</h3>' +
      '<div class="mPlanWrap">' +
      '<svg id="mPlan" class="mPlan" viewBox="' + vb.join(' ') + '" role="img" aria-label="' + esc(tr('The blueprint of the An-225')) + '">' +
      this.planBase(lay) + '<g id="mSlots"></g><g id="mGhost"></g></svg>' +
      '<div class="mMsg" id="mMsg" aria-live="polite"></div></div>' +
      '<h3>' + tr('On the stand') + '</h3><div class="mTray" id="mTray"></div>' +
      '</div>' +
      '<div class="mShop"><h3>' + tr('Parts') + '</h3>' +
      '<p class="fineprint">' + tr('Each part costs money and the reputation of one client group: they vouch for you at the Antonov works. Cheapest first — start small and build up.') + '</p>' +
      '<div class="filterBar" id="mBar"></div><div class="mList" id="mList"></div></div>' +
      '</div>' +
      '<div class="mToast" id="mToast" hidden></div>', 'mriya');
    this.root = UI.screen.querySelector('.panel.mriya');
    this.carry = null; this.finaleOn = false;
    this.trying = tryOn && !Career.hasMriyaFinish(tryOn) && MRIYA_FINISHES.some((f) => f.id === tryOn) ? tryOn : null;
    UI.onLeave = () => this.close();
    UI.keyHook = (e) => this.key(e);
    this.wire();
    this.refresh();
    const done = Career.mriyaDone();
    if (!Mriya3D.open(el('mCanvas'), Career.data.mriya.placed, done, this.trying || Career.mriyaFinish().id)) this.root.querySelector('.mHero').classList.add('noGl');
    this.say(done ? tr('The Mriya is built. It waits for you in the hangar.') : this.carryHelp(false));
  },

  close() {
    this.cancelCarry(true);
    Mriya3D.close();
    Fireworks.stop();
    if (UI.keyHook) UI.keyHook = null;
    this.root = null;
  },

  // the blueprint's paper: the grid, the dimensions and the aeroplane's lines
  planBase(lay) {
    const S = lay.S, L = lay.L;
    const lines = MriyaPlan.outline().map((p) => '<path d="' + pathD(p) + '"/>').join('');
    return '<defs>' +
      '<pattern id="mGrid" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M2 0H0V2" class="g1"/></pattern>' +
      '<pattern id="mGrid10" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="url(#mGrid)"/><path d="M10 0H0V10" class="g2"/></pattern>' +
      '<linearGradient id="mGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe7a0"/><stop offset="0.45" stop-color="#d8ad48"/><stop offset="1" stop-color="#9a7020"/></linearGradient>' +
      '<filter id="mGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' +
      '<rect x="' + (-S / 2 - 3.5) + '" y="-7" width="' + (S + 9) + '" height="' + (L + 11) + '" fill="url(#mGrid10)" class="mPaper"/>' +
      '<g class="mDim"><path d="M' + (-S / 2) + ' -4H' + (S / 2) + 'M' + (-S / 2) + ' -5V-3M' + (S / 2) + ' -5V-3"/>' +
      '<text x="0" y="-4.7">' + S + ' m</text>' +
      '<path d="M' + (S / 2 + 2) + ' 0V' + L + 'M' + (S / 2 + 1) + ' 0H' + (S / 2 + 3) + 'M' + (S / 2 + 1) + ' ' + L + 'H' + (S / 2 + 3) + '"/>' +
      '<text x="' + (S / 2 + 3.6) + '" y="' + (L / 2) + '" transform="rotate(90 ' + (S / 2 + 3.6) + ' ' + (L / 2) + ')">' + L + ' m</text>' +
      '<text x="' + (-S / 2) + '" y="' + (L + 2.6) + '" class="mStamp">AN-225 «МРІЯ» · ' + tr('top view') + '</text></g>' +
      '<g class="mLines">' + lines + '</g>';
  },

  // ---------- drawing the changing parts ----------
  refresh() {
    if (!this.isOpen()) return;
    const keep = this.focusKey();
    const d = Career.data, m = d.mriya;
    el('mPurse').innerHTML = '<span class="mMoney">' + fmtMoney(d.money) + '</span>' + Object.keys(FACTIONS).map((k) =>
      '<span class="rep" title="' + esc(tr(FACTIONS[k].name)) + '"><i style="background:' + FACTIONS[k].color + '"></i>' + fmtRep(d.rep[k]) + '</span>').join('');
    this.drawProgress();
    this.drawFinishes();
    // locked until every course is passed
    const open = Career.mriyaOpen(), passed = COURSES.filter((c) => Career.has(c.id)).length;
    el('mLock').innerHTML = open || Career.mriyaDone() ? ''
      : '<div class="hint mLockNote">🔒 ' + tr('The Antonov works sell their parts only to a pilot who has passed every course: {n} of {m} so far. Look round, plan the build — and come back with every rating.', { n: passed, m: COURSES.length }) + '</div>';
    this.drawSlots();
    // the stand
    const stand = m.bought.map((id) => this.part(id)).filter(Boolean);
    el('mTray').innerHTML = stand.length ? stand.map((p) =>
      '<button class="mChip' + (this.carry && this.carry.id === p.id ? ' carried' : '') + '" data-m="pick" data-id="' + p.id + '" title="' + esc(tr('Carry it onto the blueprint')) + '">' +
      thumbSvg(p) + '<span>' + esc(tr(p.name)) + '</span></button>').join('')
      : '<p class="fineprint">' + (Career.mriyaDone() ? tr('Every part is on the aeroplane.') : tr('Empty. A part you buy waits here until you fit it on the blueprint.')) + '</p>';
    // the catalogue
    const st = this.settings();
    const chip = (v, on, label, dot) => '<button class="chip' + (on ? ' on' : '') + '" data-m="filter" data-v="' + v + '" aria-pressed="' + on + '">' +
      (dot ? '<i class="chipDot" style="background:' + dot + '"></i>' : '') + label + '</button>';
    const count = (s) => MRIYA_PARTS.filter((p) => Career.mriyaState(p.id) === s).length;
    el('mBar').innerHTML =
      '<div class="setGroup"><span>' + tr('Show') + '</span>' + chip('group:all', st.group === 'all', tr('All')) +
      MRIYA_GROUPS.map((g) => chip('group:' + g.id, st.group === g.id, tr(g.name))).join('') + '</div>' +
      '<div class="setGroup"><span>' + tr('State') + '</span>' + chip('status:all', st.status === 'all', tr('All')) +
      chip('status:shop', st.status === 'shop', tr('To buy') + ' · ' + count('shop')) +
      chip('status:bought', st.status === 'bought', tr('On the stand') + ' · ' + count('bought')) +
      chip('status:placed', st.status === 'placed', tr('Fitted') + ' · ' + count('placed')) + '</div>' +
      '<div class="setGroup"><span>' + tr('Sort') + '</span>' +
      chip('sort:price', st.sort === 'price', tr('Price') + (st.sort === 'price' ? (st.dir > 0 ? ' ↑' : ' ↓') : '')) +
      chip('sort:rep', st.sort === 'rep', tr('Reputation') + (st.sort === 'rep' ? (st.dir > 0 ? ' ↑' : ' ↓') : '')) + '</div>';
    const list = MRIYA_PARTS.map((p, i) => [p, i])
      .filter(([p]) => (st.group === 'all' || p.group === st.group) && (st.status === 'all' || Career.mriyaState(p.id) === st.status))
      .sort((a, b) => {
        const pa = Career.mriyaPrice(a[0]), pb = Career.mriyaPrice(b[0]);
        return ((st.sort === 'rep' ? pa.rep - pb.rep : pa.kr - pb.kr) || pa.kr - pb.kr) * st.dir || a[1] - b[1];
      }).map(([p]) => p);
    el('mList').innerHTML = list.length ? list.map((p) => this.row(p)).join('')
      : '<div class="filterEmpty"><p class="lead">' + tr('No parts match the filters.') + '</p><button class="btn" data-m="filter" data-v="reset">' + tr('Show all') + '</button></div>';
    this.restoreFocus(keep);
  },

  // the finishes: a swatch each, the one it wears lit; one not bought yet is tried on first, with
  // its price and Buy under the swatches
  drawFinishes() {
    const cur = Career.mriyaFinish().id, shown = this.trying || cur;
    const f = mriyaFinish(shown);
    let line;
    if (this.trying) {
      const why = !Career.mriyaOpen() ? tr('Pass every course') : Career.data.money < MRIYA.FINISH_KR ? tr('Needs {kr}', { kr: fmtMoney(MRIYA.FINISH_KR) }) : null;
      line = '<b>' + esc(tr(f.name)) + '</b> — ' + esc(tr(f.blurb)) + ' <span class="mFinPrice">' + fmtMoney(MRIYA.FINISH_KR) + '</span>' +
        '<span class="mFinBtns"><button class="btn small' + (why ? ' disabled' : ' default') + '" data-m="finishBuy"' + (why ? ' disabled' : '') + '>' +
        (why || tr('Buy this colour')) + '</button><button class="btn small" data-m="finishCancel">' + tr('Back to {name}', { name: esc(tr(mriyaFinish(cur).name)) }) + '</button></span>';
    } else line = '<b>' + esc(tr(f.name)) + '</b> — ' + esc(tr(f.blurb));
    el('mFin').innerHTML = '<div class="mSwatches">' + MRIYA_FINISHES.map((x) => {
      const own = Career.hasMriyaFinish(x.id);
      return '<button class="mSwatch' + (x.id === shown ? ' on' : '') + (own ? ' own' : '') + '" data-m="finish" data-id="' + x.id + '" aria-pressed="' + (x.id === shown) + '" title="' + esc(tr(x.name)) + '">' +
        finishDot(x) + '<span>' + esc(tr(x.name)) + '</span><small>' + (x.id === cur ? '✓ ' + tr('On it') : own ? tr('Yours') : fmtMoney(MRIYA.FINISH_KR)) + '</small></button>';
    }).join('') + '</div><p class="mFinLine">' + line + '</p>';
  },
  // a swatch pressed: one the pilot has goes on at once; another is tried on
  pickFinish(id) {
    if (Career.hasMriyaFinish(id)) { Career.setMriyaFinish(id); this.trying = null; }
    else this.trying = id;
    Mriya3D.setFinish(this.trying || Career.mriyaFinish().id);
    Audio2.cue('page');
    this.refresh();
  },
  buyFinish(id) {
    if (!id || !Career.buyMriyaFinish(id)) { Audio2.cue('bad'); return; }
    this.trying = null;
    Fanfare.buy();
    Mriya3D.setFinish(id);
    this.refresh();
    this.say(tr('<b>{name}</b> is yours — the Mriya wears it now.', { name: esc(tr(mriyaFinish(id).name)) }));
  },

  drawProgress() {
    const n = Career.data.mriya.placed.length, N = MRIYA_PARTS.length, k = n / N;
    const C = 2 * Math.PI * 42;
    el('mProgress').innerHTML =
      '<svg viewBox="0 0 100 100" class="mRing"><circle cx="50" cy="50" r="42" class="bg"/>' +
      '<circle cx="50" cy="50" r="42" class="fg" stroke-dasharray="' + (C * k).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 50 50)"/></svg>' +
      '<div class="mPct"><b>' + Math.floor(k * 100) + '<small>%</small></b><span>' + tr('{n} of {m} parts fitted', { n, m: N }) + '</span>' +
      (Career.data.mriya.bought.length ? '<span class="mOnStand">' + tr('{n} on the stand', { n: Career.data.mriya.bought.length }) + '</span>' : '') + '</div>';
    this.root.classList.toggle('done', Career.mriyaDone());
  },

  // every part's place, in layers: the body, then the wing and the tail, the strips and the surfaces,
  // the engines, the gear and the modules inside on top
  drawSlots() {
    const layer = (p) => { const s = p.slot; return s.body ? 0 : s.centre || s.wing && s.chord[1] - s.chord[0] > 0.9 || s.tail || s.fin ? 1 : s.gear === 'sponsons' ? 1.5 : s.surf || s.wing ? 2 : s.engine || s.reverser || s.pylon ? 3 : s.gear ? 4 : 5; };
    const target = this.carry ? this.carry.id : null;
    el('mSlots').innerHTML = MRIYA_PARTS.slice().sort((a, b) => layer(a) - layer(b)).map((p) => {
      const st = Career.mriyaState(p.id);
      const cls = 'slot ' + st + (p.id === target ? ' target' : '') + (p.slot.boxes ? ' box' : '');
      return '<g class="' + cls + '" data-id="' + p.id + '">' + MriyaPlan.shapes(p).map((poly) => '<path d="' + pathD(poly) + '"/>').join('') + '</g>';
    }).join('');
  },

  // a part in the catalogue
  row(p) {
    const st = Career.mriyaState(p.id), pr = Career.mriyaPrice(p), why = st === 'shop' ? Career.mriyaWhyNot(p) : null;
    const f = FACTIONS[pr.kind];
    let act;
    if (st === 'placed') act = '<span class="mFitted">✓ ' + tr('Fitted') + '</span>';
    else if (st === 'bought') act = '<button class="btn small default" data-m="pick" data-id="' + p.id + '">' + tr('Fit it') + '</button>';
    else {
      const label = why === 'courses' ? tr('Pass every course') : why === 'money' ? tr('Needs {kr}', { kr: fmtMoney(pr.kr) })
        : why === 'rep' ? tr('Needs {r} reputation', { r: fmtRep(pr.rep) }) : tr('Buy');
      act = '<button class="btn small' + (why ? ' disabled' : ' default') + '" data-m="buy" data-id="' + p.id + '"' + (why ? ' disabled' : '') + '>' + label + '</button>';
    }
    return '<div class="mPart ' + st + '" data-id="' + p.id + '">' + thumbSvg(p) +
      '<div class="mPInfo"><div class="mPHead"><b>' + esc(tr(p.name)) + '</b><span class="tag">' + esc(this.groupName(p.group)) + '</span></div>' +
      '<div class="mSpec">' + esc(tr(p.spec)) + '</div><p>' + esc(tr(p.blurb)) + '</p></div>' +
      '<div class="mPBuy"><b class="mPrice">' + fmtMoney(pr.kr) + '</b>' +
      '<span class="mRep" title="' + esc(tr('Reputation with {who}', { who: tr(f.name) })) + '"><i style="background:' + f.color + '"></i>' + fmtRep(pr.rep) + ' ' + esc(tr(f.short)) + '</span>' +
      act + '</div></div>';
  },

  // the focus survives a redraw: the same button, or, for a part just bought, its chip on the stand
  focusKey() {
    const a = document.activeElement;
    if (!a || !this.root || !this.root.contains(a)) return null;
    return { m: a.getAttribute('data-m'), id: a.getAttribute('data-id'), v: a.getAttribute('data-v'), tray: !!a.closest('#mTray') };
  },
  restoreFocus(k) {
    if (!k || isCoarsePointer()) return;
    const q = (sel) => this.root.querySelector(sel);
    const b = (k.tray ? q('#mTray [data-m="pick"][data-id="' + k.id + '"]') : null) ||
      (k.m === 'filter' ? q('[data-m="filter"][data-v="' + k.v + '"]') : null) ||
      (k.m === 'finish' ? q('[data-m="finish"][data-id="' + k.id + '"]') : null) ||
      (k.m === 'finishBuy' || k.m === 'finishCancel' ? q('.mSwatch.on') : null) ||
      (k.id ? q('#mList [data-id="' + k.id + '"] button:not([disabled])') || q('#mTray [data-id="' + k.id + '"]') : null) ||
      (k.tray ? q('#mTray button') : null);
    if (b) b.focus({ preventScroll: true });
  },

  // ---------- events ----------
  wire() {
    const r = this.root;
    r.addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (!b || b.disabled || !r.contains(b)) return;
      if (this.justDragged) return;
      Audio2.resume();
      const id = b.getAttribute('data-id'), v = b.getAttribute('data-v');
      switch (b.getAttribute('data-m')) {
        case 'buy': this.buy(id); break;
        case 'pick':
          if (this.carry && this.carry.id === id) { this.cancelCarry(); this.say(tr('Put back on the stand.')); }
          else this.pick(id, 'held');
          break;
        case 'filter': this.filter(v); break;
        case 'hangar': this.close(); UI.tab = 'hangar'; UI.showOps(); break;
        case 'stay': this.endFinale(); break;
        case 'finish': this.pickFinish(id); break;
        case 'finishBuy': this.buyFinish(this.trying); break;
        case 'finishCancel': this.pickFinish(Career.mriyaFinish().id); break;
        default: break;
      }
    });
    // a part in the catalogue lights up its place on the blueprint
    const list = el('mList');
    const hi = (id) => this.root.querySelectorAll('#mSlots .slot').forEach((g) => g.classList.toggle('hover', g.getAttribute('data-id') === id));
    list.addEventListener('mouseover', (e) => { const row = e.target.closest('.mPart'); hi(row ? row.getAttribute('data-id') : null); });
    list.addEventListener('mouseleave', () => hi(null));
    list.addEventListener('focusin', (e) => { const row = e.target.closest('.mPart'); hi(row ? row.getAttribute('data-id') : null); });
    // dragging a part off the stand
    const tray = el('mTray');
    tray.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-m="pick"]');
      if (!b || e.button > 0) return;
      this.press = { id: b.getAttribute('data-id'), x: e.clientX, y: e.clientY, pid: e.pointerId, el: b };
      try { b.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    tray.addEventListener('pointermove', (e) => {
      const p = this.press;
      if (!p || p.pid !== e.pointerId) return;
      if (!p.drag && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) {
        p.drag = true;
        Audio2.resume();
        this.pick(p.id, 'drag');
      }
      if (p.drag) { e.preventDefault(); this.dragTo(e.clientX, e.clientY); }
    });
    const up = (e) => {
      const p = this.press;
      if (!p || p.pid !== e.pointerId) return;
      this.press = null;
      if (!p.drag) return;                               // a plain press: the click picks it up
      this.justDragged = true;
      setTimeout(() => { this.justDragged = false; }, 0);
      const at = this.planAt(e.clientX, e.clientY);
      if (at && this.carry) this.drop(at[0], at[1]);
      else { this.cancelCarry(); this.say(tr('Back on the stand — let it go over the blueprint.')); }
    };
    tray.addEventListener('pointerup', up);
    tray.addEventListener('pointercancel', (e) => { if (this.press && this.press.drag) this.cancelCarry(); this.press = null; });
    // on the blueprint: move a part picked up, let go where it goes; a tap on a fitted place names it
    const svg = el('mPlan');
    svg.addEventListener('pointerdown', (e) => {
      const at = this.planAt(e.clientX, e.clientY);
      if (!at) return;
      if (this.carry && this.carry.mode === 'held') {
        e.preventDefault();
        this.ghostDrag = e.pointerId;
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        this.moveGhost(at[0], at[1]);
        return;
      }
      const g = e.target.closest('.slot');
      if (g) {
        const p = this.part(g.getAttribute('data-id')), st = Career.mriyaState(p.id);
        this.say('<b>' + esc(tr(p.name)) + '</b> · ' + esc(tr(p.spec)) + ' — ' +
          (st === 'placed' ? tr('fitted') : st === 'bought' ? tr('on the stand, ready to fit') : tr('not bought yet')));
      }
    });
    svg.addEventListener('pointermove', (e) => {
      if (this.ghostDrag !== e.pointerId) return;
      const at = this.planAt(e.clientX, e.clientY, true);
      if (at) this.moveGhost(at[0], at[1]);
    });
    svg.addEventListener('pointerup', (e) => {
      if (this.ghostDrag !== e.pointerId) return;
      this.ghostDrag = null;
      const c = this.carry;
      if (c) this.drop(c.px, c.py);
    });
  },

  filter(v) {
    const st = this.settings();
    const [k, id] = String(v).split(':');
    if (k === 'reset') { st.group = 'all'; st.status = 'all'; }
    else if (k === 'sort') { if (st.sort === id) st.dir = -st.dir; else { st.sort = id; st.dir = 1; } }
    else st[k] = id;
    Career.saveSettings();
    Audio2.cue('page');
    this.refresh();
  },

  buy(id) {
    const p = this.part(id);
    if (!Career.buyMriyaPart(id)) { Audio2.cue('bad'); return; }
    Fanfare.buy();
    this.refresh();
    const chip = this.root.querySelector('#mTray [data-id="' + id + '"]');
    if (chip && !isCoarsePointer()) chip.focus({ preventScroll: true });
    this.say(tr('<b>{name}</b> is on the stand — carry it onto the blueprint.', { name: esc(tr(p.name)) }));
  },

  // ---------- carrying a part ----------
  carryHelp(held) {
    if (held) return isCoarsePointer() ? tr('Drag it to its glowing place, or tap the place.') : tr('Move it with the arrow keys (Shift: finer) or the mouse, Enter fits it, Esc puts it back.');
    return Career.data.mriya.bought.length ? (isCoarsePointer() ? tr('Drag a part from the stand onto the blueprint, or tap it and then tap its place.')
      : tr('Drag a part from the stand onto the blueprint — or press it and move it with the arrow keys.'))
      : tr('Buy a part, then fit it in its place on the blueprint.');
  },
  pick(id, mode) {
    if (Career.mriyaState(id) !== 'bought') return;
    this.cancelCarry(true);
    const lay = MriyaPlan.lay;
    // picked up by a press it starts in the middle of the blueprint, ready for the arrows
    this.carry = { id, mode, px: 0, py: lay.L * 0.5 };
    this.root.classList.add('carrying');
    this.root.querySelectorAll('#mTray .mChip').forEach((c) => c.classList.toggle('carried', c.getAttribute('data-id') === id));
    this.drawSlots();
    if (mode === 'held') { this.drawGhost(); this.checkReady(); }
    this.say(tr('Carrying <b>{name}</b> — its place glows.', { name: esc(tr(this.part(id).name)) }) + ' ' + this.carryHelp(mode === 'held'));
  },
  cancelCarry(quiet) {
    if (this.float && this.float.parentNode) this.float.parentNode.removeChild(this.float);
    this.float = null;
    if (!this.carry) return;
    this.carry = null;
    if (!this.isOpen()) return;
    this.root.classList.remove('carrying');
    el('mGhost').innerHTML = '';
    this.root.querySelectorAll('#mTray .mChip.carried').forEach((c) => c.classList.remove('carried'));
    this.drawSlots();
    if (!quiet) Audio2.cue('page');
  },
  // the part follows the pointer: over the blueprint at its true size, elsewhere as a chip
  dragTo(cx, cy) {
    const c = this.carry;
    if (!c) return;
    const at = this.planAt(cx, cy);
    if (!this.float) {
      this.float = document.createElement('div');
      this.float.className = 'mFloat';
      this.float.innerHTML = thumbSvg(this.part(c.id)) + '<span>' + esc(tr(this.part(c.id).name)) + '</span>';
      document.body.appendChild(this.float);
    }
    this.float.style.transform = 'translate(' + (cx + 12) + 'px,' + (cy + 12) + 'px)';
    this.float.hidden = !!at;
    if (at) this.moveGhost(at[0], at[1]);
    else el('mGhost').innerHTML = '';
  },
  moveGhost(px, py) {
    const c = this.carry;
    if (!c) return;
    const lay = MriyaPlan.lay;
    c.px = clamp(px, -lay.S / 2 - 2, lay.S / 2 + 2);
    c.py = clamp(py, -4, lay.L + 3);
    this.drawGhost();
    this.checkReady();
  },
  // the carried part on the blueprint (moved, not drawn again, so the snap can glide)
  drawGhost(snap) {
    const c = this.carry;
    if (!c) return;
    const p = this.part(c.id), [ox, oy] = MriyaPlan.centre(p);
    let g = el('mGhost').querySelector('.ghost');
    if (!g || g.getAttribute('data-id') !== c.id) {
      el('mGhost').innerHTML = '<g class="ghost" data-id="' + c.id + '">' + MriyaPlan.shapes(p).map((poly) => '<path d="' + pathD(poly) + '"/>').join('') + '</g>';
      g = el('mGhost').querySelector('.ghost');
    }
    g.classList.remove('nope');
    g.classList.toggle('snap', !!snap);
    g.style.transform = 'translate(' + (c.px - ox).toFixed(2) + 'px,' + (c.py - oy).toFixed(2) + 'px)';
  },
  // close enough to its place: the place lights up, Enter (or letting go) fits it
  checkReady() {
    const c = this.carry;
    if (!c) return false;
    const [ox, oy] = MriyaPlan.centre(this.part(c.id));
    const ready = Math.hypot(c.px - ox, c.py - oy) <= MRIYA.SNAP_M;
    const g = this.root.querySelector('#mSlots .slot[data-id="' + c.id + '"]');
    if (g) g.classList.toggle('ready', ready);
    return ready;
  },
  drop(px, py) {
    const c = this.carry;
    if (!c) return;
    c.px = px; c.py = py;
    const p = this.part(c.id), [ox, oy] = MriyaPlan.centre(p);
    if (Math.hypot(px - ox, py - oy) > MRIYA.SNAP_M) {
      Audio2.cue('bad');
      if (c.mode === 'drag') { this.cancelCarry(true); this.say(tr('Not there — {name} goes where its place glows. Back on the stand.', { name: esc(tr(p.name)) })); }
      else {
        this.drawGhost();
        const gh = this.root.querySelector('#mGhost .ghost');
        if (gh) { void gh.getBoundingClientRect(); gh.classList.add('nope'); }
        this.say(tr('Not there — {name} goes where its place glows.', { name: esc(tr(p.name)) }));
      }
      return;
    }
    // it snaps into its place, then it is fitted
    c.px = ox; c.py = oy;
    if (this.float) this.float.hidden = true;
    this.drawGhost(true);
    const id = c.id;
    setTimeout(() => this.fit(id), 170);
  },
  fit(id) {
    if (!this.isOpen()) return;
    const res = Career.placeMriyaPart(id);
    this.cancelCarry(true);
    if (!res) return;
    Fanfare.snap();
    Mriya3D.sync(Career.data.mriya.placed);
    this.refresh();
    const g = this.root.querySelector('#mSlots .slot[data-id="' + id + '"]');
    if (g) g.classList.add('just');
    const left = MRIYA_PARTS.length - Career.data.mriya.placed.length;
    this.say(tr('<b>{name}</b> fitted.', { name: esc(tr(this.part(id).name)) }) + ' ' +
      (left ? tr('{n} to go.', { n: left }) : ''));
    if (!isCoarsePointer()) { const nx = this.root.querySelector('#mTray button'); if (nx) nx.focus({ preventScroll: true }); }
    if (res === 'done') this.finale();
  },

  // the keys while a part is carried: the arrows move it, Enter fits it, Esc puts it back;
  // the finale's screen takes Esc as "stay"
  key(e) {
    if (!this.isOpen()) return false;
    if (this.finaleOn) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.endFinale(); return true; }
      return false;
    }
    const c = this.carry;
    if (!c || c.mode !== 'held') return false;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.cancelCarry(); this.say(tr('Put back on the stand.')); return true; }
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key]) {
      e.preventDefault(); e.stopPropagation();
      const step = MRIYA.KEY_STEP_M * (e.shiftKey ? 0.25 : 1);
      this.moveGhost(c.px + dirs[e.key][0] * step, c.py + dirs[e.key][1] * step);
      return true;
    }
    if (e.key === 'Enter' || e.code === 'Space') {
      e.preventDefault(); e.stopPropagation();
      if (!e.repeat) this.drop(c.px, c.py);
      return true;
    }
    return false;
  },

  // a point on the screen in blueprint metres, or null off the blueprint (loose: anywhere)
  planAt(cx, cy, loose) {
    const svg = el('mPlan');
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    if (!loose && (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom)) return null;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    const p = pt.matrixTransform(m.inverse());
    return [p.x, p.y];
  },

  say(html) { const m = el('mMsg'); if (m) m.innerHTML = html; },
  toast(text) {
    const t = el('mToast');
    if (!t) return;
    t.textContent = text; t.hidden = false;
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => { t.hidden = true; }, 3200);
  },

  // ---------- the fiftieth part ----------
  finale() {
    this.finaleOn = true;
    Mriya3D.finish(false);
    Fanfare.play();
    Fireworks.start(9);
    const box = document.createElement('div');
    box.className = 'mFinale';
    box.innerHTML = '<div class="mFinaleCard">' +
      '<div class="mFinaleNative" lang="uk">МРІЯ</div>' +
      '<h2>' + tr('The Dream flies again') + '</h2>' +
      '<p>' + tr('Fifty parts, every one in its place. The An-225 Mriya is yours — it waits in your hangar.') + '</p>' +
      '<div class="btnRow"><button class="btn default fwd" data-m="hangar">' + tr('To the hangar') + '</button>' +
      '<button class="btn" data-m="stay">' + tr('Stay and look') + '</button></div></div>';
    this.root.appendChild(box);
    this.say(tr('The Mriya is built. It waits for you in the hangar.'));
    if (!isCoarsePointer()) setTimeout(() => { const b = box.querySelector('.btn.default'); if (b) b.focus({ preventScroll: true }); }, 50);
  },
  endFinale() {
    this.finaleOn = false;
    const f = this.root && this.root.querySelector('.mFinale');
    if (f) f.remove();
  },

  // ---------- cheats (Alt + digit, in the hall; Game.cheat sends them here) ----------
  cheat(digit) {
    const d = Career.data, m = d.mriya;
    let text = '';
    switch (digit) {
      case 0: this.toast('Hall cheats: Alt+7 every course passed and every part bought · Alt+8 every part but one fitted · Alt+9 start the build again'); return;
      case 7:
        for (const c of COURSES) if (!Career.has(c.id)) d.courses.push(c.id);
        for (const p of MRIYA_PARTS) if (Career.mriyaState(p.id) === 'shop') m.bought.push(p.id);
        text = 'every course passed, every part bought'; break;
      case 8: {
        for (const p of MRIYA_PARTS) if (Career.mriyaState(p.id) === 'shop') m.bought.push(p.id);
        const left = m.bought.slice(0, Math.max(0, MRIYA_PARTS.length - m.placed.length - 1));
        for (const id of left) { m.bought.splice(m.bought.indexOf(id), 1); m.placed.push(id); }
        text = 'every part but one fitted'; break;
      }
      case 9:
        d.mriya = { bought: [], placed: [], finish: d.mriya.finish, finishes: d.mriya.finishes };
        d.aircraft = d.aircraft.filter((id) => id !== 'A225');
        if (d.selected === 'A225') d.selected = 'B1900D';
        text = 'the build starts again'; break;
      default: return;
    }
    if (digit !== 9) { d.mriya.cheated = true; d.stats.cheats++; }
    Career.save();
    this.cancelCarry(true);
    Mriya3D.close();
    this.show();
    this.toast('Cheat: ' + text);
  }
};

// a polygon as an SVG path
function pathD(poly) { return 'M' + poly.map(([x, y]) => x.toFixed(2) + ' ' + y.toFixed(2)).join('L') + 'Z'; }
// a part's shapes, small, fitted into a square
function thumbSvg(p) {
  const shapes = MriyaPlan.shapes(p);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const poly of shapes) for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const w = x1 - x0, h = y1 - y0, s = Math.max(w, h) * 1.15 + 0.5;
  return '<svg class="mThumb" viewBox="' + [(x0 + x1 - s) / 2, (y0 + y1 - s) / 2, s, s].map((v) => v.toFixed(2)).join(' ') + '" aria-hidden="true">' +
    shapes.map((poly) => '<path d="' + pathD(poly) + '"/>').join('') + '</svg>';
}
// a finish's swatch: its body from the roof down to the belly, its lines across it
function finishDot(f) {
  const lines = f.flow ? 'linear-gradient(90deg,' + f.lines.join(',') + ')' : 'linear-gradient(180deg,' + f.lines.map((c, i) => c + ' ' + (i * 100 / f.lines.length) + '% ' + ((i + 1) * 100 / f.lines.length) + '%').join(',') + ')';
  return '<i class="mDot" style="background:linear-gradient(180deg,' + f.light + ',' + f.base + ' 45%,' + f.shade + ')"><em style="background:' + lines + '"></em></i>';
}
// reputation to one decimal where it has one
function fmtRep(v) { const r = Math.round(v * 10) / 10; return r % 1 ? r.toFixed(1) : String(r); }
