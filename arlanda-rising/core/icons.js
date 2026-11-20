'use strict';

// Arrows, symbols and emoji drawn the same on every device: a character typed in the code or a translation
// stays the token, and on its way to the screen it becomes a drawing from ICONS (generated, see
// tools/icons-build.js), never a font's glyph. Page text needs nothing: a watcher swaps the characters in
// every text node, and the text stays inside, so textContent reads as before. A canvas calls Icons.draw or
// Icons.drawText. Copied into each project by tools/icons-build.js; edit tools/icons/engine.js, not the copies.

const Icons = (() => {
  const MONO = ICONS.mono, COLOR = ICONS.color;
  const all = Object.keys(MONO).concat(Object.keys(COLOR)).join('');
  const GLYPH = new RegExp('[' + all + ']\\uFE0F?', 'u');
  const GLYPHS = new RegExp('[' + all + ']\\uFE0F?', 'gu');
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, TITLE: 1, 'G-RUN': 1 };

  const url = (svg) => 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  const base = (g) => String.fromCodePoint(g.codePointAt(0));
  const hex = (g) => g.codePointAt(0).toString(16);

  // the rules of a drawing are added when it is first seen. Unknown elements, so no game's `span` or `i` rule
  // reaches them; the character is pushed out of the box instead of hidden, so a mono drawing keeps its colour.
  const sheet = (() => {
    const style = document.createElement('style');
    style.textContent =
      'g-tok{white-space:nowrap}' +
      'g-ico{display:inline-block;overflow:hidden;white-space:nowrap;text-indent:4em;background-position:center;background-repeat:no-repeat;background-size:contain;' +
      'width:1.2em;height:1.2em;margin:-.1em 0;vertical-align:-.24em}' +
      'g-ico.mono{width:1em;height:1em;margin:0;vertical-align:-.14em;background-color:currentColor;' +
      '-webkit-mask-position:center;mask-position:center;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-size:contain;mask-size:contain}';
    document.head.appendChild(style);
    return style.sheet;
  })();
  const ruled = {};
  function rule(g) {
    if (ruled[g]) return;
    ruled[g] = true;
    const cls = 'g-ico.g' + hex(g);
    const text = MONO[g]
      ? cls + '{-webkit-mask-image:' + url(MONO[g]) + ';mask-image:' + url(MONO[g]) + '}'
      : cls + '{background-image:' + url(COLOR[g]) + '}';
    sheet.insertRule(text, sheet.cssRules.length);
  }

  function ico(g) {
    const b = base(g);
    rule(b);
    const el = document.createElement('g-ico');
    el.className = 'g' + hex(b) + (MONO[b] ? ' mono' : '');
    el.textContent = g;
    return el;
  }
  // text and drawings in turn, added to `into`
  function fill(into, text) {
    let at = 0;
    for (const m of text.matchAll(GLYPHS)) {
      if (m.index > at) into.appendChild(document.createTextNode(text.slice(at, m.index)));
      into.appendChild(ico(m[0]));
      at = m.index + m[0].length;
    }
    if (at < text.length) into.appendChild(document.createTextNode(text.slice(at)));
  }
  // One element for the whole text, so a flex parent still has one item. The line may break next to a drawing
  // even at a no-break space, so a word with a drawing in it stays on one line.
  function swap(node) {
    const text = node.nodeValue;
    const parent = node.parentNode;
    if (!parent || !GLYPH.test(text) || parent.namespaceURI !== 'http://www.w3.org/1999/xhtml' || SKIP[parent.nodeName]) return;
    if (parent.closest('g-run')) return;
    const run = document.createElement('g-run');
    for (const part of text.split(/([ \t\r\n]+)/)) {
      if (!GLYPH.test(part)) { if (part) run.appendChild(document.createTextNode(part)); continue; }
      const tok = document.createElement('g-tok');
      fill(tok, part);
      run.appendChild(tok);
    }
    parent.replaceChild(run, node);
  }
  function scan(root) {
    if (root.nodeType === 3) { swap(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const found = [];
    while (walk.nextNode()) if (GLYPH.test(walk.currentNode.nodeValue)) found.push(walk.currentNode);
    found.forEach(swap);
  }
  // after every script has run, so the translations read their keys from the page's own text first
  function watch() {
    scan(document.body);
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'characterData') swap(r.target);
        else r.addedNodes.forEach(scan);
      }
    }).observe(document.body, { childList: true, characterData: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();

  // ---------- on a canvas ----------
  const images = {};
  // the drawing as an image, loaded in a moment; `color` is for a mono one, `then` runs once it can be drawn
  function image(g, color, then) {
    const b = base(g);
    const key = b + (color || '');
    let im = images[key];
    if (!im) {
      const svg = MONO[b] ? MONO[b].replace(/#000/g, color || '#000') : COLOR[b];
      im = images[key] = new Image();
      im.src = 'data:image/svg+xml,' + encodeURIComponent(svg.replace('<svg ', '<svg width="128" height="128" '));
    }
    if (then) {
      if (im.complete && im.naturalWidth) then(im);
      else im.addEventListener('load', () => then(im), { once: true });
    }
    return im;
  }
  // a drawing centred on x, y; it appears from the next frame on when it has only just been asked for
  function draw(ctx, g, x, y, size, color) {
    const im = image(g, color);
    if (im.complete && im.naturalWidth) ctx.drawImage(im, x - size / 2, y - size / 2, size, size);
  }
  // A text with drawings in it, by the ctx's font and alignment; put(part, x) draws each piece of plain
  // text, always aligned left, and `color` tints the mono drawings.
  function drawText(ctx, text, x, y, color, put) {
    const size = parseFloat((ctx.font.match(/([\d.]+)px/) || [0, 12])[1]);
    const parts = [];
    let at = 0, width = 0;
    const add = (s) => { if (s) { const w = ctx.measureText(s).width; parts.push({ s, w }); width += w; } };
    for (const m of text.matchAll(GLYPHS)) {
      add(text.slice(at, m.index));
      parts.push({ g: m[0], w: size });
      width += size;
      at = m.index + m[0].length;
    }
    add(text.slice(at));
    const align = ctx.textAlign;
    let cx = align === 'center' ? x - width / 2 : align === 'right' || align === 'end' ? x - width : x;
    ctx.textAlign = 'left';
    for (const p of parts) {
      if (p.g) draw(ctx, p.g, cx + p.w / 2, y - size * 0.34, size, color);
      else put(p.s, cx);
      cx += p.w;
    }
    ctx.textAlign = align;
  }

  return { image, draw, drawText };
})();
