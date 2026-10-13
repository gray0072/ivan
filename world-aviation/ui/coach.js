'use strict';

// ============================================================
// World Aviation — the flight school's coach in the flight: a card
// at the top of the left column (in place of the contract strip)
// with the lesson's steps (sim/lesson.js) — the ones done ticked,
// the lit one with why it is done, the next ones dimmed (on a phone
// only the lit one) — and the controls and the instruments that step
// is about lit up: the touch buttons, the taxi arrow and the
// checklist get a pulsing gold ring (the coachHi class), the gauges
// of the panel and the ILS a ring drawn over the panel (Coach.draw,
// from the rectangles Instruments.rects and Game.ilsRect keep).
// Used by game.js each frame (Coach.update, Coach.draw).
// ============================================================

// the targets of a step's `hi` drawn over the canvas (the rest are elements of the page)
const COACH_RING_HI = ['asi', 'adi', 'ra', 'alt', 'vsi', 'tc', 'hsi', 'engines', 'cautions', 'ils'];
// how many steps the card shows round the lit one on a computer (done before it, to come after it)
const COACH_BEFORE = 2, COACH_AFTER = 2;

const Coach = {
  key: '',
  lit: [],          // the elements lit up now

  box() { return el('coach'); },
  phone() { return Input.isCoarse && Math.min(window.innerWidth, window.innerHeight) < 600; },

  // each frame: the card, built anew when something on it changes, and the elements lit up
  update(game) {
    const box = this.box();
    if (!box) return;
    const L = game.lesson && Lesson.cur;
    const on = !!(L && game.mode === 'flying');
    document.body.classList.toggle('inLesson', on);
    if (!on) {
      if (!box.hidden) { box.hidden = true; box.innerHTML = ''; this.key = ''; }
      this.light([]);
      return;
    }
    const s = L.def.steps[L.i];
    const p = Lesson.params(game);
    const key = [L.def.id, L.i, L.state.join(','), L.attempt, I18N.lang, Units.metric, Input.invertPitch, this.phone(), p.floor].join('|');
    if (key !== this.key) {
      this.key = key;
      box.hidden = false;
      box.innerHTML = this.html(L, p);
    }
    this.light(s ? s.hi.filter((h) => COACH_RING_HI.indexOf(h) < 0) : []);
  },

  // the text of a step, in the game's language, with its numbers and keys (on a touch screen
  // the buttons' names instead of the keys, or its own text for one: textTouch, whyTouch)
  text(s, p, why) {
    const touch = Input.isCoarse;
    const t = why ? (touch && s.whyTouch) || s.why : (touch && s.textTouch) || (Input.invertPitch && s.textUp) || s.text;
    if (!t) return '';
    const html = Units.text(tr(t, p));
    return Input.isCoarse ? touchPrompt(html) : html;
  },

  html(L, p) {
    const def = L.def, steps = def.steps, n = steps.length;
    const i = Math.min(L.i, n - 1);
    const head = '<div class="coachHead"><span class="coachTag">🎓 ' + tr('FLIGHT SCHOOL') + ' · ' + Lesson.number(def) + '/' + LESSONS.length + '</span>' +
      '<b>' + esc(tr(def.title)) + '</b><span class="coachN">' + tr('step {i} of {n}', { i: i + 1, n }) + '</span></div>';
    const row = (k) => {
      const s = steps[k], state = L.state[k];
      if (k === i) {
        const why = this.text(s, p, true);
        return '<li class="now"><b>' + this.text(s, p) + '</b>' + (why ? '<span class="why">' + why + '</span>' : '') + '</li>';
      }
      return '<li class="' + (state === 'done' ? 'done' : state === 'passed' ? 'passed' : 'next') + '">' + this.text(s, p) + '</li>';
    };
    let list = '';
    if (this.phone()) list = row(i);
    else for (let k = Math.max(0, i - COACH_BEFORE); k <= Math.min(n - 1, i + COACH_AFTER); k++) list += row(k);
    const help = L.attempt >= 3 ? tr('Try {n} — the instructor also flares for you', { n: L.attempt })
      : L.attempt === 2 ? tr('Try 2 — the instructor holds the wings level, the autopilot flies lower') : '';
    return head + '<ol class="coachSteps">' + list + '</ol>' + (help ? '<div class="coachHelp">' + esc(help) + '</div>' : '');
  },

  // the page's elements a step is about: the touch buttons (btn:<data-act>), the arrow and the
  // speed under it, the checklist, the mini map
  els(hi) {
    const out = [];
    for (const h of hi) {
      let sel = null;
      if (h === 'btn:stick') sel = '#stickBase';
      else if (h === 'btn:throttle') sel = '#throttleZone';
      else if (h === 'btn:brake') sel = '#brakeBtn';
      else if (h.indexOf('btn:') === 0) sel = '#touchButtons [data-act="' + h.slice(4) + '"]';
      else if (h === 'arrow') sel = '#taxiArrow svg';
      else if (h === 'taxiSpd') sel = '#taxiArrow .taxiSpd';
      else if (h === 'checklist') sel = '#checklist';
      else if (h === 'map') sel = '#miniMap';
      if (sel && (h.indexOf('btn:') < 0 || Input.isCoarse)) out.push(...document.querySelectorAll(sel));
    }
    return out;
  },
  light(hi) {
    const now = this.els(hi);
    for (const e of this.lit) if (now.indexOf(e) < 0) e.classList.remove('coachHi');
    for (const e of now) if (this.lit.indexOf(e) < 0) e.classList.add('coachHi');
    this.lit = now;
  },

  // over the panel (CSS px, after the instruments and the ILS): a pulsing gold ring round each
  // gauge the lit step is about, where it is drawn this frame
  draw(ctx, game) {
    const L = Lesson.cur, s = L && L.def.steps[L.i];
    if (!s || L.passed || game.mode !== 'flying' || game.cineShot()) return;
    const k = 0.55 + 0.45 * Math.sin(performance.now() / 260);
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(255, 217, 122, 0.9)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(255, 217, 122, ' + k.toFixed(3) + ')';
    for (const h of s.hi) {
      if (COACH_RING_HI.indexOf(h) < 0 && h.indexOf('cfg:') !== 0) continue;
      const r = h === 'ils' ? game.ilsRect : Instruments.rects[h];
      if (!r) continue;
      const pad = h.indexOf('cfg:') === 0 || h === 'ra' ? 1.5 : 4;
      roundRect(ctx, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2, h.indexOf('cfg:') === 0 || h === 'ra' ? 4 : Math.min(16, r.w / 2 + pad));
      ctx.stroke();
    }
    ctx.restore();
  }
};
