'use strict';

// Lift Logic — the program's structure. A program is { scripts: [{ x, y, blocks: [block…] }], vars: [{ name,
// all }], lists: [{ name, all }] }; a block is { id, op, args: [value…], body?, body2?, locked? } and a
// value is null (an empty slot), a number, a text or a reporter block. Here: new ids, cloning, walking,
// counting, the block-by-block difference, the JS-like Text view and a small text notation the missions
// and the reference solutions are written in (Prog.parse). Used by sim/vm.js, the editor and the tools.
//
// The notation, one block per line, two spaces of indent per level inside a C block, `else` for the
// second mouth, an empty line between scripts:
//   when ▶ clicked
//   forever
//     if <call on floor (3) [any]?> then
//       go to floor ((current floor) + (1))
//   set [stops] to 0           [ ] a dropdown or a variable, ( ) a value or a reporter, < > a boolean,
//   say "Hello there"          "…" a text with spaces, _ an empty slot, a line ending in #lock is locked
//   #shared taken              (a line of its own) these variables and lists are for all lifts
//   define serve (f) <ok>      an own block: its words, ( ) a number input, < > a yes / no input, [ ] a text
//   serve (3) <full?>          input; a call is its words with values where the inputs go

const Prog = (() => {
  let seq = 0;
  const newId = () => 'b' + (++seq).toString(36) + Math.floor(Math.random() * 1296).toString(36);

  function empty() { return { scripts: [], vars: [], lists: [] }; }
  function clone(p) { return JSON.parse(JSON.stringify(p)); }

  // a fresh copy whose blocks all get new ids (a copied block, a loaded solution)
  function renew(x) {
    if (Array.isArray(x)) return x.map(renew);
    if (x && typeof x === 'object') {
      const o = {};
      for (const k of Object.keys(x)) o[k] = renew(x[k]);
      if (o.op) o.id = newId();
      return o;
    }
    return x;
  }

  // every block of the program (also the reporters inside slots), with its parent list where it has one
  function walk(p, fn) {
    const visitValue = (v) => { if (v && typeof v === 'object' && v.op) visitBlock(v, null); };
    const visitBlock = (b, list) => {
      fn(b, list);
      (b.args || []).forEach(visitValue);
      if (b.body) b.body.forEach((c) => visitBlock(c, b.body));
      if (b.body2) b.body2.forEach((c) => visitBlock(c, b.body2));
    };
    for (const s of p.scripts) s.blocks.forEach((b) => visitBlock(b, s.blocks));
  }
  function count(p) {
    let n = 0;
    walk(p, (b) => { if (b.op !== 'param' && b.op !== 'paramB') n++; });
    return n;
  }
  function find(p, id) {
    let hit = null;
    walk(p, (b, list) => { if (b.id === id) hit = { block: b, list }; });
    return hit;
  }
  function ops(p) {
    const set = {};
    walk(p, (b) => { set[b.op] = true; });
    return Object.keys(set);
  }

  // how many blocks differ between two programs (a multiset of block signatures)
  function signature(b) {
    const args = (b.args || []).map((v) => (v && typeof v === 'object' ? '#' : String(v))).join(',');
    return b.op + (b.name ? ':' + b.name : '') + '(' + args + ')';
  }
  function diff(a, b) {
    const bag = {};
    walk(a, (x) => { const s = signature(x); bag[s] = (bag[s] || 0) + 1; });
    let d = 0;
    walk(b, (x) => { const s = signature(x); if (bag[s]) bag[s]--; else d++; });
    for (const k in bag) d += bag[k];
    return d;
  }

  // ---------- the text notation ----------
  // split a line into words and groups: ( … ), < … >, [ … ], " … "
  function tokens(s) {
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === ' ') { i++; continue; }
      if (c === '"') {
        const j = s.indexOf('"', i + 1);
        out.push({ kind: 'text', v: s.slice(i + 1, j) });
        i = j + 1;
        continue;
      }
      const opens = c === '(' || c === '[' || (c === '<' && s[i + 1] && s[i + 1] !== ' ');
      if (opens) {
        const close = c === '(' ? ')' : c === '[' ? ']' : '>';
        let depth = 0, j = i;
        for (; j < s.length; j++) {
          const ch = s[j];
          if (ch === '"') { j = s.indexOf('"', j + 1); continue; }
          const isOpen = ch === c && (c !== '<' || (s[j + 1] && s[j + 1] !== ' '));
          const isClose = ch === close && (c !== '<' || (s[j - 1] && s[j - 1] !== ' '));
          if (isOpen) depth++;
          else if (isClose) { depth--; if (depth === 0) break; }
        }
        out.push({ kind: c, v: s.slice(i + 1, j).trim() });
        i = j + 1;
        continue;
      }
      let j = i;
      while (j < s.length && s[j] !== ' ') j++;
      const w = s.slice(i, j);
      // the keyboard's - * / for the blocks' − × ÷
      out.push({ kind: 'word', v: w === '-' ? '−' : w === '*' ? '×' : w === '/' ? '÷' : w });
      i = j;
    }
    return out;
  }

  // the templates as word / slot sequences, the most specific first
  let shapes = null;
  function templates() {
    if (shapes) return shapes;
    shapes = BLOCKS.filter((d) => !d.hidden).map((d) => {
      const parts = d.text.split(' ').filter(Boolean).map((w) => (/^%\d+$/.test(w) ? { slot: +w.slice(1) - 1 } : { word: w.toLowerCase() }));
      return { d, parts, words: parts.filter((x) => x.word).length };
    });
    shapes.sort((a, b) => b.words - a.words || b.parts.length - a.parts.length);
    return shapes;
  }

  // a call of an own block: the words of its name, values where its inputs go
  function parseCall(toks, ctx) {
    for (const o of ctx.own || []) {
      const parts = o.name.split(' ').filter(Boolean);
      if (parts.length !== toks.length) continue;
      let ok = true;
      for (let k = 0; k < parts.length && ok; k++) if (!/^%\d+$/.test(parts[k])) ok = toks[k].kind === 'word' && toks[k].v.toLowerCase() === parts[k].toLowerCase();
      if (!ok) continue;
      const b = { id: newId(), op: 'call', name: o.name, kinds: o.kinds.slice(), args: o.kinds.map(() => null) };
      parts.forEach((w, k) => { if (/^%\d+$/.test(w)) { const s = +w.slice(1) - 1; b.args[s] = slotValue(o.kinds[s], toks[k], ctx); } });
      return b;
    }
    return null;
  }
  // `define go to (f) now <ok>`: the words are the name, ( ) a number input, < > a yes / no one, [ ] a text one
  function parseDefine(line) {
    const toks = tokens(line).slice(1);
    const words = [], inputs = [];
    for (const t of toks) {
      if (t.kind === 'word') words.push(t.v);
      else { inputs.push({ name: t.v, kind: t.kind === '<' ? 'bool' : t.kind === '[' ? 'text' : 'num' }); words.push('%' + inputs.length); }
    }
    return {
      id: newId(), op: 'define', name: words.join(' '), kinds: inputs.map((x) => x.kind), params: inputs.map((x) => x.name),
      args: inputs.map((x) => ({ id: newId(), op: x.kind === 'bool' ? 'paramB' : 'param', args: [x.name] }))
    };
  }

  function parseLine(line, want, ctx) {
    const toks = tokens(line);
    if (want === 'stack') { const c = parseCall(toks, ctx); if (c) return c; }
    for (const t of templates()) {
      if (want === 'stack' && (t.d.shape === 'reporter' || t.d.shape === 'boolean')) continue;
      if (want === 'reporter' && t.d.shape !== 'reporter') continue;
      if (want === 'boolean' && t.d.shape !== 'boolean') continue;
      if (want === 'value' && t.d.shape !== 'reporter' && t.d.shape !== 'boolean') continue;
      // a word glued to a ? or a %: "floor %1 %2?" becomes words and slots
      const flat = [];
      for (const p of t.parts) {
        if (p.word && /^%\d+\?$/.test(p.word)) { flat.push({ slot: +p.word.slice(1, -1) - 1 }, { word: '?' }); continue; }
        flat.push(p);
      }
      const tk = [];
      for (const x of toks) {
        if (x.kind === 'word' && x.v.length > 1 && x.v.endsWith('?') && flat.some((p) => p.word === '?')) { tk.push({ kind: 'word', v: x.v.slice(0, -1) }, { kind: 'word', v: '?' }); continue; }
        tk.push(x);
      }
      const toksUse = flat.some((p) => p.word === '?') ? tk : toks;
      if (toksUse.length !== flat.length) continue;
      let ok = true;
      for (let k = 0; k < flat.length && ok; k++) {
        if (flat[k].word !== undefined) ok = toksUse[k].kind === 'word' && toksUse[k].v.toLowerCase() === flat[k].word;
      }
      if (!ok) continue;
      const d = t.d;
      const b = { id: newId(), op: d.op, args: (d.slots || []).map(() => null) };
      flat.forEach((p, k) => { if (p.slot !== undefined) b.args[p.slot] = slotValue(d.slots[p.slot], toksUse[k], ctx); });
      if (d.shape === 'hat') ctx.params = (d.slots || []).filter((s) => s.startsWith('param:')).map((s) => s.slice(6));
      return b;
    }
    throw new Error('Prog.parse: no block for "' + line + '"');
  }

  function slotValue(kind, tok, ctx) {
    if (kind.startsWith('param:')) return { id: newId(), op: 'param', args: [kind.slice(6)] };
    if (tok.kind === 'word' && tok.v === '_') return null;
    if (kind === 'var' || kind === 'list' || kind === 'msg') {
      const name = tok.v;
      if (kind === 'var') declare(ctx.prog.vars, name);
      if (kind === 'list') declare(ctx.prog.lists, name);
      return name;
    }
    if (tok.kind === '[') return tok.v;
    if (tok.kind === 'text') return tok.v;
    if (tok.kind === 'word') return isNum(tok.v) ? Number(tok.v) : tok.v;
    // ( … ) or < … >: a literal, a variable or a param, or a reporter block
    const v = tok.v;
    if (tok.kind === '(' && isNum(v)) return Number(v);
    if (tok.kind === '(' && /^"[^"]*"$/.test(v)) return v.slice(1, -1);
    if (tok.kind === '(' && v === '') return null;
    // a yes / no input of an own block
    if (tok.kind === '<' && ctx.boolParams && ctx.boolParams.indexOf(v) >= 0) return { id: newId(), op: 'paramB', args: [v] };
    try {
      return parseLine(v, tok.kind === '<' ? 'boolean' : 'value', ctx);
    } catch (e) {
      if (tok.kind !== '(') throw e;
      if (ctx.params && ctx.params.indexOf(v) >= 0) return { id: newId(), op: 'param', args: [v] };
      if (ctx.prog.lists.some((l) => l.name === v)) return { id: newId(), op: 'list', args: [v] };
      declare(ctx.prog.vars, v);
      return { id: newId(), op: 'var', args: [v] };
    }
  }
  function declare(list, name) {
    if (name && !list.some((x) => x.name === name)) list.push({ name, all: false });
  }
  function isNum(s) { return /^-?\d+(\.\d+)?$/.test(String(s).trim()); }

  // text → program; `shared` names the variables that are for all lifts
  function parse(src, shared) {
    const prog = empty();
    const ctx = { prog, params: [] };
    // a line `#shared a b` names the variables and lists that are for all lifts
    shared = (shared || []).slice();
    src = String(src).replace(/\r/g, '').replace(/^#shared (.+)$/gm, (all, names) => { shared.push(...names.trim().split(/[\s,]+/)); return ''; });
    const scripts = src.split(/\n\s*\n/);
    // the own blocks first, so a call can come before its definition
    ctx.own = [];
    for (const line of src.split('\n')) if (/^define /.test(line)) { const d = parseDefine(line.trim()); ctx.own.push({ name: d.name, kinds: d.kinds }); }
    let y = 20;
    for (const chunk of scripts) {
      const lines = chunk.split('\n').filter((l) => l.trim() && !l.trim().startsWith('//'));
      if (!lines.length) continue;
      ctx.params = [];
      ctx.boolParams = [];
      const root = [];
      const stack = [{ indent: -1, list: root, block: null }];
      for (const raw of lines) {
        const indent = raw.match(/^ */)[0].length;
        let text = raw.trim();
        let locked = false;
        if (text.endsWith('#lock')) { locked = true; text = text.slice(0, -5).trim(); }
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
        const top = stack[stack.length - 1];
        if (text === 'else') {
          const owner = top.block;
          const parent = stack[stack.length - 1];
          // `else` sits at the indent of its if: the if is the last block of the current list
          const ifb = parent.list[parent.list.length - 1];
          // "if <> then" and "if <> then / else" read the same: an else makes it the second one
          if (ifb && ifb.op === 'if') { ifb.op = 'ifElse'; ifb.body2 = []; }
          if (!ifb || ifb.op !== 'ifElse') throw new Error('Prog.parse: else without if/else');
          stack.push({ indent, list: ifb.body2, block: owner });
          continue;
        }
        let b;
        if (/^define /.test(text) && top === stack[0] && !root.length) {
          b = parseDefine(text);
          ctx.params = b.params.filter((n, k) => b.kinds[k] !== 'bool');
          ctx.boolParams = b.params.filter((n, k) => b.kinds[k] === 'bool');
        } else b = parseLine(text, 'stack', ctx);
        if (locked) b.locked = true;
        const d = blockDef(b);
        if (d.shape === 'c' || d.shape === 'c2') b.body = [];
        if (d.shape === 'c2') b.body2 = [];
        top.list.push(b);
        if (b.body) stack.push({ indent, list: b.body, block: b });
      }
      prog.scripts.push({ x: 20, y, blocks: root });
      y += 60 + lines.length * 46;
    }
    for (const v of prog.vars) if (shared && shared.indexOf(v.name) >= 0) v.all = true;
    for (const v of prog.lists) if (shared && shared.indexOf(v.name) >= 0) v.all = true;
    return prog;
  }

  // ---------- the Text view ----------
  function jsValue(v) {
    if (v === null || v === undefined || v === '') return '_';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return isNum(v) ? v : JSON.stringify(v);
    return jsExpr(v);
  }
  function jsExpr(b) {
    const d = blockDef(b);
    if (b.op === 'var' || b.op === 'param' || b.op === 'paramB' || b.op === 'list') return ident(b.args[0]);
    return fillJs(d.js, b);
  }
  function ident(name) {
    const s = String(name || '_').replace(/[^\w$]+/g, '_');
    return /^\d/.test(s) ? '_' + s : s;
  }
  function fillJs(tpl, b) {
    const d = blockDef(b);
    return tpl.replace(/%(\d)/g, (all, k) => {
      const kind = (d.slots || [])[k - 1] || '';
      const v = b.args[k - 1];
      if (kind === 'var' || kind === 'list') return ident(v);
      if (kind === 'msg' || kind === 'bmsg' || kind === 'dir3' || kind === 'arrow' || kind === 'stop' || kind === 'clock') return typeof v === 'object' && v ? jsExpr(v) : JSON.stringify(v || '');
      return jsValue(v);
    });
  }
  // lines of { text, id, depth } for every block of the program
  function toText(p) {
    const lines = [];
    const add = (text, id, depth) => lines.push({ text: '  '.repeat(depth) + text, id });
    const stack = (list, depth) => {
      for (const b of list) {
        const d = blockDef(b);
        add(fillJs(d.js, b), b.id, depth);
        if (d.shape === 'c' || d.shape === 'c2') {
          stack(b.body || [], depth + 1);
          if (d.shape === 'c2') { add(d.js2, b.id, depth); stack(b.body2 || [], depth + 1); }
          add('}', b.id, depth);
        }
      }
    };
    for (const v of p.vars) add('let ' + ident(v.name) + ' = 0;' + (v.all ? '  // for all lifts' : ''), null, 0);
    for (const l of p.lists) add('let ' + ident(l.name) + ' = [];' + (l.all ? '  // for all lifts' : ''), null, 0);
    if (p.vars.length || p.lists.length) add('', null, 0);
    for (const s of p.scripts) {
      const hat = s.blocks[0] && blockDef(s.blocks[0]).shape === 'hat';
      if (hat) {
        const own = s.blocks[0].op === 'define';
        add(own ? blockDef(s.blocks[0]).js : fillJs(BLOCK[s.blocks[0].op].js, s.blocks[0]), s.blocks[0].id, 0);
        stack(s.blocks.slice(1), 1);
        add(own ? '}' : '});', s.blocks[0].id, 0);
      } else {
        add('// not started by any event:', null, 0);
        stack(s.blocks, 0);
      }
      add('', null, 0);
    }
    return lines;
  }

  return { newId, empty, clone, renew, walk, count, find, ops, diff, parse, toText, tokens };
})();
