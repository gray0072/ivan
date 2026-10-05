// Spatial keyboard / TV-remote focus navigation between the controls of the visible screen.

const Nav = (() => {
  let root = document.body;

  function visible(el) {
    return !el.disabled && el.offsetParent !== null && !el.closest('[hidden]');
  }

  function focusables() {
    return [...root.querySelectorAll('button, input')].filter(visible);
  }

  function defaultEl() {
    return [...root.querySelectorAll('.default')].find(visible) || null;
  }

  function autofocusEl() {
    return [...root.querySelectorAll('[data-autofocus]')].find(visible) || null;
  }

  function focus(el) {
    if (el) el.focus({ preventScroll: false });
  }

  function setRoot(el) {
    root = el;
    const target = autofocusEl() || defaultEl();
    if (target) focus(target);
    else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  // dir: 'left' | 'right' | 'up' | 'down'
  function move(dir) {
    const list = focusables();
    if (!list.length) return;
    let cur = document.activeElement;
    if (!list.includes(cur)) cur = defaultEl();
    if (!cur) { focus(autofocusEl() || list[0]); return; }
    const r = cur.getBoundingClientRect();
    let best = null;
    let bestScore = Infinity;
    for (const el of list) {
      if (el === cur) continue;
      const b = el.getBoundingClientRect();
      let main, cross;
      if (dir === 'left' || dir === 'right') {
        main = dir === 'right' ? b.left - r.right : r.left - b.right;
        const overlap = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
        cross = overlap > 0 ? 0 : Math.abs((b.top + b.bottom) / 2 - (r.top + r.bottom) / 2);
      } else {
        main = dir === 'down' ? b.top - r.bottom : r.top - b.bottom;
        const overlap = Math.min(r.right, b.right) - Math.max(r.left, b.left);
        cross = overlap > 0 ? 0 : Math.abs((b.left + b.right) / 2 - (r.left + r.right) / 2);
      }
      if (main < -4) continue;
      const score = Math.max(0, main) + cross * 3;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) focus(best);
  }

  // Enter / Space with nothing focused presses the default button. Returns true if handled.
  function pressDefault() {
    const a = document.activeElement;
    if (a && (a.tagName === 'BUTTON' || a.tagName === 'INPUT') && root.contains(a) && visible(a)) return false;
    const d = defaultEl();
    if (d) { d.click(); return true; }
    return false;
  }

  return { setRoot, move, pressDefault, focusDefault: () => focus(defaultEl()) };
})();
