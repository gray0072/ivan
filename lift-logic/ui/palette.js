'use strict';

// Lift Logic — the block palette: the category chips (only categories with opened blocks) and the sheet with
// that category's blocks drawn in their real shapes. A tap puts the block at the editor's insert point; a
// drag takes it to any place. Variables have "Make a variable" and a block per variable. On a phone the
// sheet slides up over the scripts and closes after a block is placed; on a wide screen it stays open as
// the middle column. Hint 2 lights up the blocks the engineer used. Used by game.js and ui/editor.js.

const Palette = (() => {
  const chips = document.getElementById('chips');
  const sheet = document.getElementById('sheet');
  const list = document.getElementById('sheetList');
  const title = document.getElementById('sheetTitle');
  let cat = null, chapter = 1, all = false, hint = {};

  function wide() { return document.body.classList.contains('wide'); }
  function opened(d) { return !d.hidden && (all || d.ch <= chapter); }
  function cats() {
    return CATEGORIES.filter((c) => BLOCKS.some((d) => d.cat === c.id && opened(d)) || (c.id === 'variables' && chapter >= 3));
  }

  function setup(mission) {
    chapter = mission ? mission.chapter : 1;
    hint = {};
    renderChips();
    if (wide()) open(cat && cats().some((c) => c.id === cat) ? cat : cats()[0].id);
    else close();
  }
  function renderChips() {
    chips.innerHTML = cats().map((c) => '<button type="button" class="chip k-' + c.id + (c.id === cat && !sheet.hidden ? ' on' : '') +
      (hintCat(c.id) ? ' hint' : '') + '" data-cat="' + c.id + '"><i></i>' + tr(c.name) + '</button>').join('');
  }
  function hintCat(id) { return Object.keys(hint).some((op) => BLOCK[op] && BLOCK[op].cat === id); }

  chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    ensureAudio();
    Sfx.tap();
    if (!wide() && cat === b.dataset.cat && !sheet.hidden) close();
    else open(b.dataset.cat);
  });
  document.getElementById('sheetClose').addEventListener('click', () => close());

  function open(id) {
    cat = id;
    sheet.hidden = false;
    title.textContent = tr(CATEGORY[id].name);
    list.innerHTML = '';
    if (id === 'variables') {
      const mk = document.createElement('button');
      mk.type = 'button';
      mk.className = 'btn small makeVar';
      mk.textContent = tr('Make a variable');
      mk.addEventListener('click', makeVariable);
      list.appendChild(mk);
      for (const v of Editor.prog.vars) add({ id: 'p', op: 'var', args: [v.name] }, v.all && chapter >= 5 ? tr('for all lifts') : '');
    }
    for (const d of BLOCKS) {
      if (d.cat !== id || !opened(d)) continue;
      const b = BlockView.make(d.op);
      // a variable block starts with the first variable
      (d.slots || []).forEach((s, k) => { if (s === 'var' && Editor.prog.vars[0]) b.args[k] = Editor.prog.vars[0].name; });
      add(b);
    }
    renderChips();
  }
  function add(b, note) {
    const wrap = document.createElement('div');
    wrap.className = 'pal' + (hint[b.op] ? ' hint' : '');
    const el = BlockView.el(b, { palette: true });
    wrap.appendChild(el);
    if (note) { const n = document.createElement('span'); n.className = 'palNote'; n.textContent = note; wrap.appendChild(n); }
    wrap._b = b;
    list.appendChild(wrap);
  }
  function close() {
    if (wide()) return;
    sheet.hidden = true;
    renderChips();
  }

  function makeVariable() {
    Slots.ask(tr('Name of the new variable'), '', (name) => {
      name = String(name || '').trim().slice(0, 20);
      if (!name) return;
      const make = (allLifts) => { if (!Editor.makeVar(name, allLifts)) Hud.toast(tr('There is already a variable "{v}".', { v: name })); open('variables'); };
      if (chapter >= 5 || all) Slots.choose(tr('Who uses "{v}"?', { v: name }), [{ label: tr('For this lift only'), value: false }, { label: tr('For all lifts'), value: true }], make);
      else make(false);
    });
  }

  // ---------- tap and drag from the sheet ----------
  let press = null;
  list.addEventListener('pointerdown', (e) => {
    const w = e.target.closest('.pal');
    if (!w) return;
    list.setPointerCapture(e.pointerId);
    const r = w.firstChild.getBoundingClientRect();
    press = { x: e.clientX, y: e.clientY, w, offX: e.clientX - r.left, offY: e.clientY - r.top, drag: false };
  });
  list.addEventListener('pointermove', (e) => {
    if (!press) return;
    if (press.drag) { Editor.paletteDrag(e); return; }
    // a mostly sideways or a mouse drag takes the block; a vertical finger scrolls the sheet
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    if (Math.hypot(dx, dy) > DRAG_START_PX && (e.pointerType === 'mouse' || Math.abs(dx) > Math.abs(dy))) {
      press.drag = true;
      sheet.classList.add('dragging');
      Editor.dragNew(fresh(press.w._b), press.offX, press.offY, e.clientX, e.clientY);
    } else if (Math.hypot(dx, dy) > DRAG_START_PX) { press = null; }
  });
  const up = (e) => {
    if (!press) return;
    if (press.drag) { Editor.paletteDrag(e); sheet.classList.remove('dragging'); press = null; close(); return; }
    if (e.type === 'pointerup') {
      ensureAudio();
      const b = fresh(press.w._b);
      const shape = BLOCK[b.op].shape;
      if (Editor.insert(b) && !wide() && shape !== 'reporter' && shape !== 'boolean') close();
      else if (!wide() && (shape === 'reporter' || shape === 'boolean')) close();
    }
    press = null;
  };
  list.addEventListener('pointerup', up);
  list.addEventListener('pointercancel', () => { press = null; sheet.classList.remove('dragging'); });

  function fresh(b) { return Prog.renew(JSON.parse(JSON.stringify(b))); }

  // hint 2: the blocks the engineer used light up
  function highlight(ops) { hint = {}; for (const op of ops) hint[op] = true; renderChips(); if (!sheet.hidden) open(cat); }
  function openAll() { all = true; renderChips(); if (!sheet.hidden) open(cat); }
  function reset() { all = false; }
  function refresh() { renderChips(); if (!sheet.hidden && cat) open(cat); }

  return { setup, open, close, highlight, openAll, reset, refresh, allOpen: () => all, get chapter() { return chapter; } };
})();
