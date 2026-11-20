'use strict';

// Lift Logic — draws a block as DOM from its definition (data/blocks.js): the shape by CSS class (hat, stack,
// C, cap, reporter pill, boolean hexagon), the category colour, the translated template with its slots —
// a number or a word in a white pill, a dropdown, an empty hexagon, the hat's inputs as small fixed blocks,
// or the reporter placed in it — and the C block's mouths. Every element keeps a link to its data
// (el._b = the block, el._list = the list a stack shows, el._slot = { block, k }). Used by ui/editor.js,
// ui/palette.js, ui/slots.js and the mission card.

const BlockView = (() => {
  // the words of a dropdown value as the player sees them
  function dropText(kind, v) {
    if (v === null || v === undefined || v === '') return kind === 'var' || kind === 'list' ? tr('(pick)') : '…';
    if (kind === 'dir3' || kind === 'arrow' || kind === 'stop') return tr(String(v));
    return String(v);
  }
  function valText(v) {
    if (v === null || v === undefined) return '';
    return typeof v === 'number' ? String(v) : String(v);
  }

  // el(block, { palette, ghost }) — a block element and everything inside it
  function el(b, opts = {}) {
    const d = BLOCK[b.op];
    const e = document.createElement('div');
    const shape = d.shape === 'c2' ? 'c c2' : d.shape;
    e.className = 'blk s-' + shape.replace(' ', ' s-') + ' k-' + d.cat + (d.cap || (d.capIf && b.args[0] === d.capIf) ? ' cap' : '') + (b.locked ? ' locked' : '');
    e.dataset.id = b.id || '';
    e._b = b;
    const row = document.createElement('div');
    row.className = 'row';
    e.appendChild(row);
    fillRow(row, b, d.text, d, opts);
    if (d.shape === 'c' || d.shape === 'c2') {
      e.appendChild(mouth(b, 'body', opts));
      if (d.shape === 'c2') {
        const r2 = document.createElement('div');
        r2.className = 'row else';
        r2.textContent = tr(d.text2);
        e.appendChild(r2);
        e.appendChild(mouth(b, 'body2', opts));
      }
      const foot = document.createElement('div');
      foot.className = 'foot';
      e.appendChild(foot);
    }
    if (b.locked) {
      const lock = document.createElement('span');
      lock.className = 'lock';
      lock.textContent = '🔒';
      row.appendChild(lock);
    }
    return e;
  }

  function mouth(b, key, opts) {
    const m = document.createElement('div');
    m.className = 'mouth';
    const s = stack(b[key] || (b[key] = []), opts);
    s._owner = b;
    m.appendChild(s);
    return m;
  }

  function stack(list, opts = {}) {
    const s = document.createElement('div');
    s.className = 'stack';
    s._list = list;
    for (const c of list) s.appendChild(el(c, opts));
    return s;
  }

  // the template's words and slots
  function fillRow(row, b, text, d, opts) {
    const parts = tr(text).split(/(%\d)/);
    for (const part of parts) {
      const m = part.match(/^%(\d)$/);
      if (!m) {
        if (part.trim()) {
          const t = document.createElement('span');
          t.className = 'w';
          t.textContent = part.trim();
          row.appendChild(t);
        }
        continue;
      }
      const k = +m[1] - 1;
      const kind = (d.slots || [])[k];
      row.appendChild(slot(b, k, kind, opts));
    }
  }

  function slot(b, k, kind, opts) {
    const v = b.args[k];
    // a hat's input: a small fixed block
    if (kind.startsWith('param:')) {
      const p = document.createElement('span');
      p.className = 'blk s-reporter k-events param';
      p.textContent = tr(PARAM_NAMES[kind.slice(6)] || kind.slice(6));
      p._param = kind.slice(6);
      p._slot = { block: b, k, kind };
      return p;
    }
    // the name of a variable / list reporter
    if (kind === 'name') {
      const t = document.createElement('span');
      t.className = 'w name';
      t.textContent = b.op === 'param' ? tr(PARAM_NAMES[v] || v) : String(v);
      return t;
    }
    if (v && typeof v === 'object' && v.op) {
      const inner = el(v, opts);
      inner._slot = { block: b, k, kind };
      inner.classList.add('inslot');
      return inner;
    }
    const s = document.createElement('span');
    s._slot = { block: b, k, kind };
    if (kind === 'bool') {
      s.className = 'slot bool';
    } else if (kind === 'num' || kind === 'text' || kind === 'any' || kind === 'clock') {
      s.className = 'slot val' + (kind === 'num' ? ' num' : '') + (v === null || v === '' ? ' empty' : '');
      s.textContent = valText(v);
    } else {
      s.className = 'slot drop';
      s.textContent = dropText(kind, v);
      const caret = document.createElement('i');
      caret.textContent = '▾';
      s.appendChild(caret);
    }
    return s;
  }

  // a new block of an op with its default values (a fresh id)
  function make(op, extra) {
    const d = BLOCK[op];
    const b = { id: Prog.newId(), op, args: (d.slots || []).map((s, k) => {
      if (s.startsWith('param:')) return { id: Prog.newId(), op: 'param', args: [s.slice(6)] };
      const def = (d.def || [])[k];
      return def === undefined ? null : def;
    }) };
    if (d.shape === 'c' || d.shape === 'c2') b.body = [];
    if (d.shape === 'c2') b.body2 = [];
    if (extra) Object.assign(b, extra);
    return b;
  }

  // which values fit a slot kind
  function fits(kind, shape) {
    if (kind === 'bool') return shape === 'boolean';
    if (kind === 'num' || kind === 'text' || kind === 'any' || kind === 'dir3' || kind === 'arrow') return shape === 'reporter' || shape === 'boolean';
    return false;
  }

  return { el, stack, make, fits, dropText };
})();
