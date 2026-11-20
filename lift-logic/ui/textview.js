'use strict';

// Lift Logic — the Text view: the program as JavaScript-like text (English keywords in every language, it is
// code), read-only, with the lines of the running blocks highlighted. A bridge to "real" code for adults.
// Used by game.js (the Text button).

const TextView = (() => {
  const panel = document.getElementById('textPanel');
  const pre = document.getElementById('textCode');
  let lines = [];
  function open() {
    lines = Prog.toText(Editor.prog);
    pre.innerHTML = lines.map((l, k) => '<span class="ln" data-k="' + k + '">' + (escapeHtml(l.text) || ' ') + '</span>').join('\n');
    panel.hidden = false;
    glow();
  }
  function close() { panel.hidden = true; }
  function isOpen() { return !panel.hidden; }
  // the running lines light up
  function glow() {
    if (panel.hidden) return;
    const active = run ? VM.active() : {};
    pre.querySelectorAll('.ln').forEach((el) => {
      const l = lines[+el.dataset.k];
      el.classList.toggle('run', !!(l && l.id && active[l.id]));
    });
  }
  document.getElementById('textClose').addEventListener('click', close);
  panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
  return { open, close, isOpen, glow };
})();
