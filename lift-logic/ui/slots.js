'use strict';

// Lift Logic — editing a slot: a big number pad (with − / + steppers), a word typed on the keyboard, a short
// list for a dropdown, the boolean blocks for a hexagonal slot — and, for every slot that takes one, the
// reporter blocks that fit ("use a sensor"), the variables and the inputs of the script's event. Also the
// small dialogs the editor needs (choose one of a few, type a name). Used by ui/editor.js and ui/palette.js.

const Slots = (() => {
  const box = document.getElementById('slotSheet');
  const body = document.getElementById('slotBody');
  const head = document.getElementById('slotTitle');
  let onClose = null;

  function show(title) {
    head.textContent = title;
    body.innerHTML = '';
    box.hidden = false;
  }
  function hide() { box.hidden = true; body.innerHTML = ''; if (onClose) { const f = onClose; onClose = null; f(); } }
  document.getElementById('slotClose').addEventListener('click', hide);
  box.addEventListener('click', (e) => { if (e.target === box) hide(); });

  function button(label, cls, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + (cls || '');
    b.innerHTML = label;
    b.addEventListener('click', () => { Sfx.tap(); fn(); });
    return b;
  }

  // the reporter blocks that fit this slot, as small tappable blocks
  function offers(slot, script) {
    const kind = slot.kind;
    const ch = Palette.chapter;
    const out = [];
    const shapeOk = (d) => (kind === 'bool' ? d.shape === 'boolean' : d.shape === 'reporter' || (kind === 'any' && d.shape === 'boolean'));
    const hat = script && script.blocks[0] && BLOCK[script.blocks[0].op].shape === 'hat' ? script.blocks[0] : null;
    if (hat && kind !== 'bool') for (const s of BLOCK[hat.op].slots || []) if (s.startsWith('param:')) out.push({ op: 'param', args: [s.slice(6)] });
    if (kind !== 'bool') for (const v of Editor.prog.vars) out.push({ op: 'var', args: [v.name] });
    for (const d of BLOCKS) {
      if (d.hidden || !shapeOk(d) || !(d.ch <= ch || Palette.allOpen())) continue;
      if ((kind === 'dir3' || kind === 'arrow') && d.op !== 'myDir' && d.op !== 'dirOf') continue;
      out.push(BlockView.make(d.op));
    }
    return out.map((b) => (b.id ? b : Object.assign(b, { id: Prog.newId() })));
  }
  function offerList(slot, script, title) {
    const items = offers(slot, script);
    if (!items.length) return null;
    const wrap = document.createElement('div');
    wrap.className = 'offers';
    if (title) { const t = document.createElement('p'); t.className = 'label'; t.textContent = title; wrap.appendChild(t); }
    for (const b of items) {
      const el = BlockView.el(b);
      el.classList.add('offer');
      el.addEventListener('click', () => { Sfx.tap(); hide(); Editor.setValue(slot, b); });
      wrap.appendChild(el);
    }
    return wrap;
  }

  // open the editor of a slot
  function open(slot, script) {
    const kind = slot.kind;
    const cur = slot.block.args[slot.k];
    const isBlock = cur && typeof cur === 'object';
    if (kind === 'bool') {
      show(tr('Pick a condition'));
      if (isBlock) body.appendChild(button(tr('Empty the slot'), 'secondary', () => { hide(); Editor.setValue(slot, null); }));
      const o = offerList(slot, script);
      if (o) body.appendChild(o);
      return;
    }
    if (kind === 'dir3' || kind === 'arrow' || kind === 'stop') {
      show(tr('Pick one'));
      const row = document.createElement('div');
      row.className = 'choices';
      for (const v of DROPDOWNS[kind]) row.appendChild(button(tr(v), cur === v ? 'on' : 'toggle', () => { hide(); Editor.setValue(slot, v); }));
      body.appendChild(row);
      const o = kind === 'stop' ? null : offerList(slot, script, tr('or a block:'));
      if (o) body.appendChild(o);
      return;
    }
    if (kind === 'var' || kind === 'list') {
      show(tr('Pick a variable'));
      const row = document.createElement('div');
      row.className = 'choices';
      for (const v of Editor.prog.vars) row.appendChild(button(escapeHtml(v.name), cur === v.name ? 'on' : 'toggle', () => { hide(); Editor.setValue(slot, v.name); }));
      row.appendChild(button(tr('Make a variable'), 'secondary', () => {
        hide();
        ask(tr('Name of the new variable'), '', (name) => {
          name = String(name || '').trim().slice(0, 20);
          if (!name) return;
          Editor.makeVar(name, false);
          Editor.setValue(slot, name);
          Palette.refresh();
        });
      }));
      body.appendChild(row);
      return;
    }
    if (kind === 'msg') {
      show(tr('Pick a message'));
      const row = document.createElement('div');
      row.className = 'choices';
      const names = new Set(Editor.prog.msgs || []);
      Prog.walk(Editor.prog, (b) => { (BLOCK[b.op].slots || []).forEach((s, k) => { if (s === 'msg' && b.args[k]) names.add(String(b.args[k])); }); });
      if (!names.size) names.add('message1');
      for (const n of names) row.appendChild(button(escapeHtml(n), cur === n ? 'on' : 'toggle', () => { hide(); Editor.setValue(slot, n); }));
      row.appendChild(button(tr('New message'), 'secondary', () => { hide(); ask(tr('Name of the new message'), '', (n) => { n = String(n || '').trim().slice(0, 20); if (n) { Editor.addMsg(n); Editor.setValue(slot, n); } }); }));
      body.appendChild(row);
      return;
    }
    if (kind === 'text' || kind === 'clock') {
      show(kind === 'clock' ? tr('Type a time like 17:00') : tr('Type the words'));
      textInput(isBlock ? '' : cur, (v) => Editor.setValue(slot, v));
      if (kind === 'text') { const o = offerList(slot, script, tr('or a block:')); if (o) body.appendChild(o); }
      return;
    }
    // num / any: the number pad
    show(kind === 'any' ? tr('A number or a word') : tr('A number'));
    pad(isBlock ? '' : (cur === null ? '' : String(cur)), kind, (v) => Editor.setValue(slot, v));
    if (isBlock) body.insertBefore(button(tr('Remove the block'), 'secondary', () => { hide(); Editor.setValue(slot, ''); }), body.firstChild);
    const o = offerList(slot, script, tr('or use a block:'));
    if (o) body.appendChild(o);
  }

  function textInput(value, done) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'textIn';
    inp.maxLength = 60;
    inp.value = value === null || value === undefined ? '' : String(value);
    body.appendChild(inp);
    const ok = button(tr('OK'), 'default', () => { hide(); done(inp.value); });
    body.appendChild(ok);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ok.click(); } e.stopPropagation(); });
    setTimeout(() => inp.focus(), 50);
  }

  function pad(value, kind, done) {
    let v = value;
    const showEl = document.createElement('div');
    showEl.className = 'padShow';
    const shown = () => { showEl.textContent = v === '' ? ' ' : v; };
    shown();
    const top = document.createElement('div');
    top.className = 'padTop';
    top.appendChild(button('−1', 'step', () => { v = String((Number(v) || 0) - 1); shown(); }));
    top.appendChild(showEl);
    top.appendChild(button('+1', 'step', () => { v = String((Number(v) || 0) + 1); shown(); }));
    body.appendChild(top);
    const grid = document.createElement('div');
    grid.className = 'pad';
    const keys = ['7', '8', '9', '⌫', '4', '5', '6', '−', '1', '2', '3', '.', 'C', '0', 'OK'];
    for (const k of keys) {
      grid.appendChild(button(k === 'OK' ? tr('OK') : k, k === 'OK' ? 'default' : 'key', () => {
        if (k === 'OK') { hide(); done(toValue(v)); return; }
        if (k === '⌫') v = v.slice(0, -1);
        else if (k === 'C') v = '';
        else if (k === '−') v = v.startsWith('-') ? v.slice(1) : '-' + v;
        else if (k === '.') { if (!v.includes('.')) v = (v || '0') + '.'; }
        else v = (v === '0' ? '' : v) + k;
        shown();
      }));
    }
    body.appendChild(grid);
    if (kind === 'any') {
      const row = document.createElement('div');
      row.className = 'choices';
      for (const w of ['up', 'down', 'stopped']) row.appendChild(button(tr(w), 'toggle', () => { hide(); done(w); }));
      row.appendChild(button(tr('Type a word…'), 'secondary', () => { body.innerHTML = ''; textInput(isNaN(Number(v)) ? v : '', done); }));
      body.appendChild(row);
    }
    const keyFn = (e) => {
      if (box.hidden) { window.removeEventListener('keydown', keyFn, true); return; }
      if (/^[0-9]$/.test(e.key)) v = (v === '0' ? '' : v) + e.key;
      else if (e.key === 'Backspace') v = v.slice(0, -1);
      else if (e.key === '-') v = v.startsWith('-') ? v.slice(1) : '-' + v;
      else if (e.key === '.' || e.key === ',') { if (!v.includes('.')) v = (v || '0') + '.'; }
      else if (e.key === 'Enter') { window.removeEventListener('keydown', keyFn, true); hide(); done(toValue(v)); }
      else if (e.key === 'Escape') { window.removeEventListener('keydown', keyFn, true); hide(); }
      else return;
      e.preventDefault(); e.stopPropagation();
      shown();
    };
    window.addEventListener('keydown', keyFn, true);
  }
  function toValue(v) { return v === '' || v === '-' ? '' : (isNaN(Number(v)) ? v : Number(v)); }

  // one of a few choices
  function choose(title, options, cb) {
    show(title);
    const row = document.createElement('div');
    row.className = 'choices col';
    for (const o of options) row.appendChild(button(escapeHtml(o.label), 'toggle', () => { hide(); cb(o.value); }));
    body.appendChild(row);
  }
  // a line of text
  function ask(title, value, cb) { show(title); textInput(value, cb); }
  // a message with OK (and an optional second button)
  function info(title, html, buttons) {
    show(title);
    const p = document.createElement('div');
    p.className = 'infoText';
    p.innerHTML = html;
    body.appendChild(p);
    const row = document.createElement('div');
    row.className = 'choices';
    for (const b of buttons || [{ label: tr('OK'), cls: 'default' }]) row.appendChild(button(b.label, b.cls || 'toggle', () => { hide(); if (b.fn) b.fn(); }));
    body.appendChild(row);
  }

  return { open, choose, ask, info, hide, isOpen: () => !box.hidden };
})();
