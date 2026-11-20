'use strict';

// ============================================================
// World Aviation — the loading screen of a flight, a look round an
// airport or an aircraft (Game.load): over the boot screen, a bar
// with the per cent done and what is being built now (each step's
// { what, w, part, a } from Scene3D's generators, LOAD_COST its
// weight). While the parked aeroplanes or the trees are built a
// button leaves them out of this flight (skipped); after
// LOAD.OFFER_S seconds the screen offers to leave out, for good,
// what is only for the look: the parked aeroplanes, the trees and
// the other traffic (settings.parked, .trees, .traffic, also in
// Settings → Graphics: UI.showSettings).
// ============================================================

const Loading = {
  active: false,
  t0: 0,                // when it began (performance.now())
  total: 0,             // the weight of every step expected (expect)
  done: 0,              // ... of the steps done
  cur: null,            // the step under way
  shown: 0,             // the per cent on the bar (never goes back)
  skipped: new Set(),   // the parts left out of this flight only (the Skip button)
  offered: false,
  timer: 0,

  // the parts a player may leave out: their setting is settings[part] (true, the default: built)
  PARTS: ['parked', 'trees', 'traffic'],

  init() {
    el('bootSkip').addEventListener('click', () => {
      const p = this.cur && this.cur.part;
      if (p) { this.skipped.add(p); this.render(); }
    });
    el('bootOffer').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-part]');
      if (!b) return;
      const p = b.dataset.part;
      Career.settings[p] = Career.settings[p] === false;
      Career.saveSettings();
      this.renderOffer();
      this.render();
    });
  },

  // a part left out: by its setting, or for this flight by the Skip button
  off(part) {
    return Career.settings[part] === false || this.skipped.has(part);
  },

  begin(title) {
    this.active = true;
    this.t0 = performance.now();
    this.total = 0; this.done = 0; this.shown = 0;
    this.cur = null;
    this.skipped = new Set();
    this.offered = false;
    el('bootStatus').textContent = title;
    el('bootProgress').hidden = false;
    el('bootOffer').hidden = true;
    el('bootScreen').hidden = false;
    this.render();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 500);
  },
  // more steps to come, of this weight
  expect(w) { this.total += w; },
  // the next step (null: the last one is done)
  step(s) {
    if (this.cur) this.done += this.cur.w || 0;
    this.cur = s;
    this.render();
  },
  end() {
    this.active = false;
    this.cur = null;
    clearInterval(this.timer);
    el('bootScreen').hidden = true;
    el('bootProgress').hidden = true;
    el('bootOffer').hidden = true;
  },

  render() {
    const pct = this.total > 0 ? Math.min(99, Math.floor(100 * this.done / this.total)) : 0;
    this.shown = Math.max(this.shown, pct);
    el('bootBar').style.width = this.shown + '%';
    el('bootPct').textContent = this.shown + ' %';
    el('bootStep').textContent = this.cur ? this.label(this.cur) : '';
    const p = this.cur && this.cur.part, skip = el('bootSkip');
    skip.hidden = !p || this.off(p);
    if (!skip.hidden) skip.textContent = tr(p === 'parked' ? 'Skip: no parked aircraft this flight' : 'Skip: no trees this flight');
  },

  // what a step builds, in words
  label(s) {
    const apt = s.a ? aptName(s.a) : '';
    switch (s.what) {
      case 'world': return tr('The land along the route');
      case 'far': return tr('The land seen from above');
      case 'lights': return tr('The lights of the towns');
      case 'ground': return tr('{apt}: the airfield and its taxiways', { apt });
      case 'runway': return tr('{apt}: the runway', { apt });
      case 'markings': return tr('{apt}: the lights and the markings', { apt });
      case 'buildings': return tr('{apt}: the terminal and the buildings', { apt });
      case 'landside': return tr('{apt}: the roads, the car park and the boards', { apt });
      case 'cargo': return tr('{apt}: the cargo and general aviation areas', { apt });
      case 'bake': return tr('{apt}: putting the buildings together', { apt });
      case 'trees': return tr('{apt}: the trees', { apt });
      case 'apron': return tr('{apt}: the stands and the vehicles', { apt });
      case 'parked': return tr('{apt}: parked aircraft {n} of {of}', { apt, n: s.n, of: s.of });
      case 'parkedSets': return tr('{apt}: putting the parked aircraft together', { apt });
      case 'textures': return tr('{apt}: the textures', { apt });
      case 'gpu': return tr('Preparing the graphics card');
      case 'frame': return tr('The first picture');
      default: return '';
    }
  },

  // after LOAD.OFFER_S seconds: what can be left out
  tick() {
    if (!this.active || this.offered || performance.now() - this.t0 < LOAD.OFFER_S * 1000) return;
    this.offered = true;
    this.renderOffer();
    el('bootOffer').hidden = false;
  },
  renderOffer() {
    const name = { parked: 'Parked aircraft', trees: 'Trees', traffic: 'Other traffic' };
    el('bootOffer').innerHTML =
      '<p>' + tr('Loading is slow on this device. What is there only for the look can be left out: the flight loads faster and runs smoother.') + '</p>' +
      '<div class="settingsRow">' + this.PARTS.map((p) => {
        const on = Career.settings[p] !== false;
        return '<div class="setGroup"><span>' + tr(name[p]) + '</span><button type="button" class="chip' + (on ? ' on' : '') + '" data-part="' + p + '">' +
          tr(on ? 'On' : 'Off') + '</button></div>';
      }).join('') + '</div>' +
      '<p class="fineprint">' + tr('Kept for the next flights; Settings → Graphics switches them back on.') + '</p>';
  }
};
