'use strict';

// Lift Logic — the scripts canvas, tap first: tap a block to select it (a toolbar: Move, Copy, Wrap, Delete),
// tap a slot to edit it (ui/slots.js), tap a block in the palette to put it at the insert point (the blinking
// notch: under the selected block, inside an empty C block, or a new script). Dragging works too (a block
// moves with everything below it; a long press moves just this one; a reporter moves alone), dropping
// outside the canvas deletes. One finger on the empty canvas pans, two pinch-zoom. Undo / redo for every
// change. During a run the running blocks glow and a block that went wrong gets a red outline with the
// reason. Used by game.js, ui/palette.js and ui/slots.js.

const Editor = (() => {
  const area = document.getElementById('scripts');
  const world = document.getElementById('world');
  const bar = document.getElementById('blockBar');
  const notch = document.createElement('div');
  notch.className = 'notch';
  const st = {
    prog: Prog.empty(), mission: null, zoom: 1, panX: 0, panY: 0, sel: null, ins: null, moving: null,
    undo: [], redo: [], pendingSlot: null, glow: {}, listeners: [], marks: {}
  };

  // ---------- loading and changing ----------
  function load(prog, mission) {
    st.prog = Prog.clone(prog || Prog.empty());
    st.prog.vars = st.prog.vars || [];
    st.prog.lists = st.prog.lists || [];
    st.prog.msgs = st.prog.msgs || [];
    st.mission = mission;
    st.sel = null; st.ins = null; st.moving = null; st.undo = []; st.redo = []; st.pendingSlot = null;
    st.panX = 12; st.panY = 12;
    st.zoom = isCoarsePointer && window.innerWidth < 600 ? 0.85 : 1;
    // the next block goes to the end of the last script
    const s = st.prog.scripts[st.prog.scripts.length - 1];
    if (s && s.blocks.length && !isCap(s.blocks[s.blocks.length - 1])) st.ins = { list: s.blocks, index: s.blocks.length };
    render();
  }
  function snapshot() { return JSON.stringify(st.prog); }
  function change(fn, quiet) {
    const before = snapshot();
    fn();
    if (snapshot() === before) { render(); return; }
    st.undo.push(before);
    if (st.undo.length > EDITOR_UNDO_MAX) st.undo.shift();
    st.redo = [];
    st.marks = {};
    render();
    if (!quiet) Sfx.place();
    for (const f of st.listeners) f();
  }
  function undo() {
    if (!st.undo.length) return;
    st.redo.push(snapshot());
    st.prog = JSON.parse(st.undo.pop());
    st.sel = null; st.ins = null; st.moving = null;
    render();
    for (const f of st.listeners) f();
  }
  function redo() {
    if (!st.redo.length) return;
    st.undo.push(snapshot());
    st.prog = JSON.parse(st.redo.pop());
    st.sel = null; st.ins = null; st.moving = null;
    render();
    for (const f of st.listeners) f();
  }
  function onChange(f) { st.listeners.push(f); }

  // where a block lives: { list, index, script } for a stack block, { slot } for a reporter in a slot
  function locate(id) {
    let hit = null;
    const visit = (list, script) => list.forEach((b, i) => {
      if (hit) return;
      if (b.id === id) { hit = { block: b, list, index: i, script }; return; }
      (b.args || []).forEach((v, k) => { if (!hit) visitValue(v, b, k, script); });
      if (b.body) visit(b.body, script);
      if (b.body2) visit(b.body2, script);
    });
    const visitValue = (v, owner, k, script) => {
      if (!v || typeof v !== 'object' || !v.op) return;
      if (v.id === id) { hit = { block: v, slot: { block: owner, k }, script }; return; }
      (v.args || []).forEach((w, j) => { if (!hit) visitValue(w, v, j, script); });
    };
    for (const s of st.prog.scripts) { if (!hit) visit(s.blocks, s); }
    return hit;
  }

  function isCap(b) { const d = BLOCK[b.op]; return !!(d.cap || (d.capIf && b.args[0] === d.capIf)); }
  function isHat(b) { return BLOCK[b.op].shape === 'hat'; }
  function isStackish(b) { const s = BLOCK[b.op].shape; return s !== 'reporter' && s !== 'boolean'; }

  // can `blocks` go into `list` at `index`
  function canInsert(list, index, blocks) {
    if (!blocks.length || isHat(blocks[0])) return false;
    if (index > 0 && isCap(list[index - 1])) return false;
    if (index === 0 && list[0] && isHat(list[0]) && st.prog.scripts.some((s) => s.blocks === list)) return false;
    if (isCap(blocks[blocks.length - 1]) && index < list.length) return false;
    return true;
  }

  function newScript(blocks, x, y) {
    if (x === undefined) {
      let bottom = 10;
      for (const el of world.querySelectorAll(':scope > .script')) bottom = Math.max(bottom, el._script.y + el.offsetHeight + SCRIPT_GAP);
      x = 10; y = bottom;
    }
    const s = { x: Math.round(x), y: Math.round(y), blocks };
    st.prog.scripts.push(s);
    return s;
  }
  function cleanScripts() { st.prog.scripts = st.prog.scripts.filter((s) => s.blocks.length); }

  // ---------- inserting from the palette ----------
  function insert(b) {
    const d = BLOCK[b.op];
    if (d.shape === 'reporter' || d.shape === 'boolean') {
      const target = st.pendingSlot || firstEmptySlot(d.shape);
      if (!target) { Hud.toast(tr('Tap an empty slot of a block first, then pick this.')); Sfx.error(); return false; }
      change(() => { target.block.args[target.k] = b; });
      st.pendingSlot = null;
      return true;
    }
    if (count() + countOf(b) > PROGRAM_MAX_BLOCKS) { Hud.toast(tr('This program is too big.')); return false; }
    let ok = true;
    change(() => {
      if (isHat(b) || !st.ins) { newScript([b]); }
      else if (!canInsert(st.ins.list, st.ins.index, [b])) { ok = false; return; }
      else st.ins.list.splice(st.ins.index, 0, b);
      st.sel = b.id;
      st.ins = d.shape === 'c' || d.shape === 'c2' ? { list: b.body, index: 0 } : afterOf(b);
    });
    if (!ok) { Hud.toast(tr('Nothing can go under this block.')); Sfx.error(); }
    return ok;
  }
  function afterOf(b) {
    const at = locate(b.id);
    if (!at || !at.list) return null;
    if (isCap(b)) return null;
    return { list: at.list, index: at.index + 1 };
  }
  // the first empty slot of the selected block that takes this shape
  function firstEmptySlot(shape) {
    if (!st.sel) return null;
    const at = locate(st.sel);
    if (!at) return null;
    const d = BLOCK[at.block.op];
    const k = (d.slots || []).findIndex((kind, i) => {
      const v = at.block.args[i];
      return BlockView.fits(kind, shape) && (v === null || v === '' || (kind === 'bool' && !v));
    });
    return k >= 0 ? { block: at.block, k } : null;
  }

  // ---------- the toolbar's actions ----------
  function remove(id) {
    const at = locate(id);
    if (!at || at.block.locked) return;
    change(() => {
      if (at.slot) at.slot.block.args[at.slot.k] = BLOCK[at.slot.block.op].slots[at.slot.k] === 'bool' ? null : '';
      else at.list.splice(at.index, 1);
      cleanScripts();
      st.sel = null; st.ins = null;
    }, true);
    Sfx.remove();
  }
  function copy(id) {
    const at = locate(id);
    if (!at || at.slot) return;
    const c = Prog.renew(JSON.parse(JSON.stringify(at.block)));
    delete c.locked;
    if (isHat(c)) { change(() => { newScript([c]); st.sel = c.id; st.ins = afterOf(c); }); return; }
    change(() => {
      if (canInsert(at.list, at.index + 1, [c])) at.list.splice(at.index + 1, 0, c);
      else newScript([c], at.script.x + 30, at.script.y + 30);
      st.sel = c.id;
      st.ins = afterOf(c);
    });
  }
  function wrap(id, op) {
    const at = locate(id);
    if (!at || at.slot || isHat(at.block)) return;
    change(() => {
      const w = BlockView.make(op);
      at.list.splice(at.index, 1, w);
      w.body.push(at.block);
      st.sel = w.id;
      st.ins = afterOf(w);
    });
  }
  // move mode: the possible places light up, a tap there moves the block (with what is below it, or alone)
  function startMove(id, single) {
    const at = locate(id);
    if (!at || at.block.locked) return;
    st.moving = { id, single };
    render();
    Hud.toast(tr('Tap where the block should go.'));
  }
  function doMove(target) {
    const m = st.moving;
    st.moving = null;
    const at = locate(m.id);
    if (!at) { render(); return; }
    change(() => {
      const run_ = m.single || isHat(at.block) ? 1 : at.list.length - at.index;
      const blocks = at.list.splice(at.index, run_);
      if (target.newScript) newScript(blocks, target.x, target.y);
      else {
        let idx = target.index;
        if (target.list === at.list && idx > at.index) idx -= run_;
        if (canInsert(target.list, idx, blocks)) target.list.splice(idx, 0, ...blocks);
        else at.list.splice(at.index, 0, ...blocks);
      }
      cleanScripts();
      st.sel = blocks[0].id;
      st.ins = afterOf(blocks[blocks.length - 1]);
    });
  }

  // ---------- drawing ----------
  function render() {
    world.innerHTML = '';
    for (const s of st.prog.scripts) {
      const el = document.createElement('div');
      el.className = 'script';
      el.style.left = s.x + 'px';
      el.style.top = s.y + 'px';
      el._script = s;
      const stack = BlockView.stack(s.blocks);
      stack._script = s;
      el.appendChild(stack);
      world.appendChild(el);
    }
    world.style.transform = 'translate(' + st.panX + 'px,' + st.panY + 'px) scale(' + st.zoom + ')';
    if (st.sel) {
      const el = byId(st.sel);
      if (el) el.classList.add('sel'); else st.sel = null;
    }
    placeNotch();
    if (st.moving) showDropMarks();
    applyGlow(st.glow, true);
    applyMarks();
    placeBar();
    Hud.blockCount();
  }
  function byId(id) { return world.querySelector('.blk[data-id="' + id + '"]'); }

  // the white notch where the next block from the palette goes
  function placeNotch() {
    notch.remove();
    if (!st.ins || st.moving) return;
    const stack = [...world.querySelectorAll('.stack')].find((s) => s._list === st.ins.list);
    if (!stack) { st.ins = null; return; }
    const kids = stack.children;
    if (st.ins.index < kids.length) stack.insertBefore(notch, kids[st.ins.index]);
    else stack.appendChild(notch);
  }

  // every place a moved block could go, as a tappable bar
  function showDropMarks() {
    const m = st.moving, at = locate(m.id);
    if (!at) return;
    const moving = m.single || isHat(at.block) ? [at.block] : at.list.slice(at.index);
    const movingIds = {};
    for (const b of moving) Prog.walk({ scripts: [{ blocks: [b] }] }, (x) => { movingIds[x.id] = true; });
    for (const stack of world.querySelectorAll('.stack')) {
      if (stack.closest('.blk') && movingIds[stack.closest('.blk').dataset.id]) continue;
      const list = stack._list;
      const kids = [...stack.children].filter((c) => c.classList.contains('blk'));
      for (let i = 0; i <= kids.length; i++) {
        if (kids[i] && movingIds[kids[i].dataset.id] && i === at.index) continue;
        if (!canInsert(list, i, moving)) continue;
        const mark = document.createElement('div');
        mark.className = 'dropmark';
        mark._target = { list, index: i };
        if (i < kids.length) stack.insertBefore(mark, kids[i]); else stack.appendChild(mark);
      }
    }
    byId(m.id) && byId(m.id).classList.add('movingSrc');
  }

  // the toolbar over the selected block
  function placeBar() {
    if (!st.sel || st.moving) { bar.hidden = true; return; }
    const el = byId(st.sel);
    const at = locate(st.sel);
    if (!el || !at) { bar.hidden = true; return; }
    const d = BLOCK[at.block.op];
    const locked = at.block.locked;
    const btn = (act, label) => '<button type="button" data-act="' + act + '">' + label + '</button>';
    let html = '';
    if (locked) html = '<span class="barNote">🔒 ' + tr('This block is locked') + '</span>';
    else if (at.slot) html = btn('delete', tr('Delete'));
    else {
      html = btn('move', tr('Move')) + btn('copy', tr('Copy'));
      if (!isHat(at.block) && d.shape !== 'reporter' && d.shape !== 'boolean') html += btn('wrap', tr('Wrap'));
      html += btn('delete', tr('Delete'));
    }
    bar.innerHTML = html;
    bar.hidden = false;
    const r = el.getBoundingClientRect(), a = area.getBoundingClientRect();
    const top = r.top - a.top - bar.offsetHeight - 6;
    bar.style.top = Math.max(2, top < 2 ? r.bottom - a.top + 6 : top) + 'px';
    bar.style.left = clamp(r.left - a.left, 2, a.width - bar.offsetWidth - 2) + 'px';
  }
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b || !st.sel) return;
    const id = st.sel;
    Sfx.tap();
    if (b.dataset.act === 'delete') remove(id);
    else if (b.dataset.act === 'copy') copy(id);
    else if (b.dataset.act === 'move') startMove(id, false);
    else if (b.dataset.act === 'wrap') {
      const ch = st.mission ? st.mission.chapter : 1;
      const ops = ['if', 'repeat', 'forever', 'repeatUntil'].filter((op) => BLOCK[op].ch <= ch || Palette.allOpen());
      Slots.choose(tr('Wrap it in…'), ops.map((op) => ({ label: tr(BLOCK[op].text).replace(/%\d/g, '…'), value: op })), (op) => wrap(id, op));
    }
  });

  // ---------- the running program ----------
  function applyGlow(active, force) {
    const old = st.glow;
    st.glow = active || {};
    if (!force) {
      for (const id of Object.keys(old)) if (!st.glow[id]) { const el = byId(id); if (el) el.classList.remove('run'); }
    }
    for (const id of Object.keys(st.glow)) { const el = byId(id); if (el && !el.classList.contains('run')) el.classList.add('run'); }
  }
  // a red outline and a bubble on blocks that went wrong
  function setMarks(errors) { st.marks = errors || {}; applyMarks(); }
  function applyMarks() {
    for (const old of world.querySelectorAll('.errBubble')) old.remove();
    for (const el of world.querySelectorAll('.blk.err')) el.classList.remove('err');
    for (const id of Object.keys(st.marks)) {
      const el = byId(id);
      if (!el) continue;
      el.classList.add('err');
      const e = st.marks[id];
      const bub = document.createElement('div');
      bub.className = 'errBubble';
      bub.textContent = tr(e.msg, e.params);
      el.appendChild(bub);
    }
  }
  function clearMarks() { st.marks = {}; applyGlow({}); applyMarks(); }

  // ---------- pointer input ----------
  const pointers = new Map();
  let press = null, pinch = null, dragging = null, longTimer = 0;
  area.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#blockBar')) return;
    ensureAudio();
    area.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      clearTimeout(longTimer);
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: st.zoom, px: st.panX, py: st.panY, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      press = null;
      return;
    }
    if (e.button === 2) return;
    press = { x: e.clientX, y: e.clientY, target: e.target, panX: st.panX, panY: st.panY, moved: false, long: false, id: e.pointerId };
    const blk = blockAt(e.target);
    if (blk && !blk.closest('.palette')) {
      longTimer = setTimeout(() => { if (press && !press.moved) { press.long = true; if (navigator.vibrate) try { navigator.vibrate(15); } catch (x) { /* none */ } } }, LONG_PRESS_MS);
    }
  });
  area.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const z = clamp(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(10, pinch.d), EDITOR_ZOOM_MIN, EDITOR_ZOOM_MAX);
      setZoom(z, pinch.cx, pinch.cy, pinch);
      return;
    }
    if (dragging) { Drag.move(e.clientX, e.clientY); return; }
    if (!press) return;
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    if (!press.moved && Math.hypot(dx, dy) > DRAG_START_PX) {
      press.moved = true;
      clearTimeout(longTimer);
      const blk = blockAt(press.target);
      if (blk && blk._b && !blk._b.locked && !blk.classList.contains('param') && !st.moving) {
        dragging = startDragFromCanvas(blk, press.long, e.clientX, e.clientY);
        if (dragging) return;
      }
    }
    if (press.moved) { st.panX = press.panX + dx; st.panY = press.panY + dy; world.style.transform = 'translate(' + st.panX + 'px,' + st.panY + 'px) scale(' + st.zoom + ')'; placeBar(); }
  });
  const end = (e) => {
    clearTimeout(longTimer);
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (dragging) { Drag.drop(e.clientX, e.clientY); dragging = null; press = null; return; }
    if (press && !press.moved && e.type === 'pointerup') tap(press.target, e.clientX, e.clientY, press.long);
    if (pointers.size === 0) press = null;
  };
  area.addEventListener('pointerup', end);
  area.addEventListener('pointercancel', end);
  area.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const blk = blockAt(e.target);
    if (blk && blk._b) { st.sel = blk._b.id; st.ins = afterOf(blk._b); render(); }
  });
  area.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey) setZoom(clamp(st.zoom * (e.deltaY < 0 ? 1.1 : 0.9), EDITOR_ZOOM_MIN, EDITOR_ZOOM_MAX), e.clientX, e.clientY);
    else { st.panX -= e.shiftKey ? e.deltaY : e.deltaX; st.panY -= e.shiftKey ? 0 : e.deltaY; world.style.transform = 'translate(' + st.panX + 'px,' + st.panY + 'px) scale(' + st.zoom + ')'; placeBar(); }
  }, { passive: false });

  function setZoom(z, cx, cy, from) {
    const a = area.getBoundingClientRect();
    const base = from || { z: st.zoom, px: st.panX, py: st.panY };
    const wx = (cx - a.left - base.px) / base.z, wy = (cy - a.top - base.py) / base.z;
    st.zoom = z;
    st.panX = cx - a.left - wx * z;
    st.panY = cy - a.top - wy * z;
    world.style.transform = 'translate(' + st.panX + 'px,' + st.panY + 'px) scale(' + st.zoom + ')';
    placeBar();
  }
  function zoomBy(k) { const a = area.getBoundingClientRect(); setZoom(clamp(st.zoom * k, EDITOR_ZOOM_MIN, EDITOR_ZOOM_MAX), a.left + a.width / 2, a.top + a.height / 2); }

  function blockAt(t) {
    if (!t || !t.closest) return null;
    return t.closest('.blk');
  }

  // a tap on the canvas
  function tap(target, cx, cy, long) {
    Hud.closeCard();
    if (st.moving) {
      const mark = target.closest && target.closest('.dropmark');
      if (mark) { doMove(mark._target); return; }
      if (!blockAt(target)) { const p = toWorld(cx, cy); doMove({ newScript: true, x: p.x, y: p.y }); return; }
      st.moving = null; render(); return;
    }
    const param = target.closest && target.closest('.param');
    if (param) { Hud.toast(tr('This is the {name} of the event. Tap a slot in this script and pick it there.', { name: tr(PARAM_NAMES[param._param] || param._param) })); return; }
    const slot = target.closest && target.closest('.slot');
    if (slot && slot._slot) {
      const blk = slot.closest('.blk');
      st.sel = blk && blk._b ? blk._b.id : null;
      render();
      Slots.open(slot._slot, scriptOf(slot));
      return;
    }
    const blk = blockAt(target);
    if (blk && blk._b) {
      Sfx.tap();
      if (long && !blk._b.locked && isStackish(blk._b) && !blk.classList.contains('inslot')) { st.sel = blk._b.id; startMove(blk._b.id, true); return; }
      st.sel = blk._b.id;
      const d = BLOCK[blk._b.op];
      // a C block with an empty mouth: the next block goes inside it
      if ((d.shape === 'c' || d.shape === 'c2') && !blk._b.body.length && target.closest('.mouth')) st.ins = { list: blk._b.body, index: 0 };
      else if ((d.shape === 'c' || d.shape === 'c2') && target.closest('.mouth') && target.closest('.mouth').parentNode === blk) {
        const m = target.closest('.mouth');
        const list = m.firstChild._list;
        st.ins = { list, index: list.length };
      } else st.ins = d.shape === 'reporter' || d.shape === 'boolean' ? st.ins : afterOf(blk._b);
      render();
      return;
    }
    const mouth = target.closest && target.closest('.mouth');
    if (mouth) { st.ins = { list: mouth.firstChild._list, index: mouth.firstChild._list.length }; st.sel = null; render(); return; }
    st.sel = null; st.ins = null; st.pendingSlot = null;
    render();
  }
  function scriptOf(el) { const s = el.closest('.script'); return s ? s._script : null; }
  function toWorld(cx, cy) { const a = area.getBoundingClientRect(); return { x: (cx - a.left - st.panX) / st.zoom, y: (cy - a.top - st.panY) / st.zoom }; }

  // ---------- dragging ----------
  function startDragFromCanvas(blk, single, cx, cy) {
    const at = locate(blk._b.id);
    if (!at) return null;
    const before = snapshot();
    let blocks;
    if (at.slot) {
      blocks = [at.block];
      at.slot.block.args[at.slot.k] = BLOCK[at.slot.block.op].slots[at.slot.k] === 'bool' ? null : '';
    } else {
      const n = single || isHat(at.block) && single ? 1 : at.list.length - at.index;
      blocks = at.list.splice(at.index, single && !isHat(at.block) ? 1 : n);
    }
    cleanScripts();
    const r = blk.getBoundingClientRect();
    st.sel = null; st.ins = null;
    render();
    Drag.start(blocks, before, cx - r.left, cy - r.top, cx, cy);
    return true;
  }
  // a block dragged from the palette
  function dragNew(b, offX, offY, cx, cy) {
    Drag.start([b], snapshot(), offX, offY, cx, cy, true);
    dragging = true;
  }

  const Drag = (() => {
    const layer = document.getElementById('dragLayer');
    let d = null;
    function start(blocks, before, offX, offY, cx, cy, fromPalette) {
      const ghost = BlockView.stack(blocks);
      ghost.classList.add('ghost');
      ghost.style.transform = 'scale(' + st.zoom + ')';
      layer.innerHTML = '';
      layer.appendChild(ghost);
      d = { blocks, before, offX, offY, ghost, target: null, fromPalette };
      move(cx, cy);
    }
    function move(cx, cy) {
      if (!d) return;
      d.ghost.style.left = (cx - d.offX) + 'px';
      d.ghost.style.top = (cy - d.offY) + 'px';
      for (const m of world.querySelectorAll('.dropmark.live,.slot.hot,.blk.hot')) m.classList.remove('live', 'hot');
      d.target = findTarget(cx, cy);
      if (d.target && d.target.mark) d.target.mark.classList.add('live');
      if (d.target && d.target.slotEl) d.target.slotEl.classList.add('hot');
    }
    function findTarget(cx, cy) {
      const a = area.getBoundingClientRect();
      const inside = cx >= a.left && cx <= a.right && cy >= a.top && cy <= a.bottom && !overPalette(cx, cy);
      if (!inside) return null;
      const shape = BLOCK[d.blocks[0].op].shape;
      if (shape === 'reporter' || shape === 'boolean') {
        d.ghost.style.display = 'none';
        const under = document.elementFromPoint(cx, cy);
        d.ghost.style.display = '';
        const s = under && (under.closest('.slot') || under.closest('.inslot'));
        if (s && s._slot && BlockView.fits(s._slot.kind, shape) && !s.closest('.ghost')) return { slot: s._slot, slotEl: s };
        return { none: true };
      }
      // the nearest insertion point to the ghost's top-left corner
      const gx = cx - d.offX, gy = cy - d.offY;
      let best = null;
      for (const stack of world.querySelectorAll('.stack')) {
        const list = stack._list;
        const kids = [...stack.children].filter((c) => c.classList.contains('blk'));
        const sr = stack.getBoundingClientRect();
        for (let i = 0; i <= kids.length; i++) {
          if (!canInsert(list, i, d.blocks)) continue;
          const y = i < kids.length ? kids[i].getBoundingClientRect().top : (kids.length ? kids[kids.length - 1].getBoundingClientRect().bottom : sr.top);
          const dist = Math.hypot(gx - sr.left, gy - y);
          if (dist < DROP_SNAP_PX && (!best || dist < best.dist)) best = { list, index: i, dist, stack, kid: kids[i] };
        }
      }
      if (best) {
        world.querySelectorAll('.dropmark').forEach((m) => m.remove());
        const mark = document.createElement('div');
        mark.className = 'dropmark live';
        if (best.kid) best.stack.insertBefore(mark, best.kid); else best.stack.appendChild(mark);
        best.mark = mark;
        return best;
      }
      world.querySelectorAll('.dropmark').forEach((m) => m.remove());
      const p = toWorld(gx, gy);
      return isStackish(d.blocks[0]) ? { newScript: true, x: p.x, y: p.y } : null;
    }
    function drop() {
      if (!d) return;
      const t = d.target, blocks = d.blocks;
      layer.innerHTML = '';
      world.querySelectorAll('.dropmark').forEach((m) => m.remove());
      const before = d.before;
      d = null;
      if (t && t.slot) t.slot.block.args[t.slot.k] = blocks[0];
      else if (t && t.list) t.list.splice(t.index, 0, ...blocks);
      else if (t && t.newScript) newScript(blocks, t.x, t.y);
      // anything else: dropped outside — gone
      cleanScripts();
      if (snapshot() !== before) {
        st.undo.push(before);
        if (st.undo.length > EDITOR_UNDO_MAX) st.undo.shift();
        st.redo = [];
        if (t && !t.none) { st.sel = blocks[0].id; st.ins = isStackish(blocks[0]) ? afterOf(blocks[blocks.length - 1]) : st.ins; Sfx.place(); } else Sfx.remove();
        for (const f of st.listeners) f();
      }
      render();
    }
    return { start, move, drop };
  })();
  function overPalette(cx, cy) {
    const p = document.getElementById('sheet');
    if (!p || p.hidden || p.classList.contains('dragging')) return false;
    const r = p.getBoundingClientRect();
    return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
  }
  // the palette's own pointer handlers hand their drags over here
  function paletteDrag(e) {
    if (dragging) {
      if (e.type === 'pointermove') Drag.move(e.clientX, e.clientY);
      else { Drag.drop(e.clientX, e.clientY); dragging = null; }
      return true;
    }
    return false;
  }

  // ---------- keys ----------
  function key(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.code === 'KeyZ') { e.shiftKey ? redo() : undo(); return true; }
      if (e.code === 'KeyY') { redo(); return true; }
      if (e.code === 'KeyC' && st.sel) { const at = locate(st.sel); if (at && !at.slot) clip = JSON.stringify(at.block); return true; }
      if (e.code === 'KeyV' && clip) { const b = Prog.renew(JSON.parse(clip)); delete b.locked; insert(b); return true; }
      return false;
    }
    if ((e.code === 'Delete' || e.code === 'Backspace') && st.sel) { remove(st.sel); return true; }
    if (e.code === 'Escape' && (st.moving || st.sel)) { st.moving = null; st.sel = null; st.ins = null; render(); return true; }
    return false;
  }
  let clip = null;

  function count() { return Prog.count(st.prog); }
  function countOf(b) { return Prog.count({ scripts: [{ blocks: [b] }] }); }
  function setPendingSlot(s) { st.pendingSlot = s; }
  function setValue(slot, v) { change(() => { slot.block.args[slot.k] = v; }); }
  function makeVar(name, all) {
    if (!name || st.prog.vars.some((v) => v.name === name)) return false;
    change(() => st.prog.vars.push({ name, all: !!all }), true);
    return true;
  }
  function makeList(name, all) {
    if (!name || st.prog.lists.some((l) => l.name === name)) return false;
    change(() => st.prog.lists.push({ name, all: !!all }), true);
    return true;
  }
  function addMsg(name) { if (name && st.prog.msgs.indexOf(name) < 0) st.prog.msgs.push(name); }

  return { load, render, insert, undo, redo, onChange, applyGlow, setMarks, clearMarks, key, zoomBy, dragNew, paletteDrag,
    count, setPendingSlot, setValue, makeVar, makeList, addMsg, locate, change,
    get prog() { return st.prog; }, get mission() { return st.mission; }, get sel() { return st.sel; },
    get canUndo() { return st.undo.length > 0; }, get canRedo() { return st.redo.length > 0; }, get dragging() { return !!dragging; } };
})();
