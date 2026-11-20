'use strict';

// Lift Logic — help in a mission. 💡 Hint 1 (any time): the idea in words. Hint 2 (after runs that did not pass
// — how many depends on the difficulty — or three minutes): the blocks the engineer used light up in the
// palette and the solution's shape is shown as empty outlines. Hint 3 (after more runs, asks first): the
// engineer's solution, which can be loaded — the mission then gets at most ★★ until it is changed into an
// own program. Also the guided start of the first missions: a finger points at what to tap next.
// Used by game.js and ui/results.js.

const Hints = (() => {
  let m = null, fails = 0, since = 0, loaded = null;

  function begin(mission) { m = mission; fails = 0; since = Date.now(); loaded = null; Guide.begin(mission); }
  function failed() { fails++; }
  function diff() { return DIFFICULTY[Screens.difficulty]; }
  function can2() { return fails >= diff().hint2 || (Date.now() - since) / 60000 >= HINT2_MINUTES; }
  function can3() { return fails >= diff().hint3; }
  function solution() { return SOLUTIONS[m.id] ? Prog.parse(SOLUTIONS[m.id]) : null; }

  function open() {
    if (!m) return;
    const parts = [];
    parts.push('<p class="label">' + tr('Hint 1') + '</p>');
    for (const h of m.hints || []) parts.push('<p>' + escapeHtml(tr(h)) + '</p>');
    const c = CONCEPTS[m.concept];
    if (c) parts.push('<div class="concept small"><b>' + tr('Grandpa Gears:') + ' ' + escapeHtml(tr(c.title)) + '</b><p>' + escapeHtml(tr(c.text)) + '</p></div>');
    const buttons = [];
    if (can2()) buttons.push({ label: tr('💡 Hint 2'), fn: hint2 });
    else parts.push('<p class="fine">' + tr('Hint 2 opens after {n} runs that did not pass, or in a few minutes.', { n: diff().hint2 }) + '</p>');
    if (can3()) buttons.push({ label: tr('💡 Hint 3'), fn: ask3 });
    else if (can2()) parts.push('<p class="fine">' + tr('Hint 3 opens after {n} runs that did not pass.', { n: diff().hint3 }) + '</p>');
    buttons.push({ label: tr('OK'), cls: 'default' });
    Slots.info(tr('Hints'), parts.join(''), buttons);
  }

  // the blocks of the solution light up, and its shape shows as outlines
  function hint2() {
    const sol = solution();
    if (!sol) return;
    Palette.highlight(Prog.ops(sol).filter((op) => op !== 'var' && op !== 'param'));
    const wrap = document.createElement('div');
    wrap.className = 'shapeView';
    for (const s of sol.scripts) { const st = BlockView.stack(s.blocks); st.classList.add('outline'); wrap.appendChild(st); }
    Slots.info(tr('Hint 2'), '<p>' + tr('The blocks you need are lit in the palette. This is the shape of the engineer\'s program:') + '</p>', [{ label: tr('OK'), cls: 'default' }]);
    document.querySelector('#slotBody .infoText').appendChild(wrap);
  }

  function ask3() {
    Slots.info(tr('Hint 3'), '<p>' + tr('Show the engineer\'s solution? With it the mission gets at most ★★, until you change it into your own program.') + '</p>',
      [{ label: tr('Show it'), cls: 'default', fn: hint3 }, { label: tr('Not yet') }]);
  }
  function hint3() {
    const sol = solution();
    if (!sol) return;
    const wrap = document.createElement('div');
    wrap.className = 'shapeView';
    for (const s of sol.scripts) wrap.appendChild(BlockView.stack(s.blocks));
    Slots.info(tr('The engineer\'s solution'), '', [{ label: tr('Load it'), cls: 'default', fn: () => load(sol) }, { label: tr('Close') }]);
    document.querySelector('#slotBody .infoText').appendChild(wrap);
  }
  function load(sol) {
    loaded = sol;
    Progress.markHint3(m.id, Screens.difficulty);
    Editor.change(() => {
      const p = Editor.prog;
      p.scripts = Prog.renew(sol.scripts);
      p.vars = sol.vars.slice();
      p.lists = sol.lists.slice();
    });
  }
  // a mission with hint 3 used gets ★★★ only with an own program
  function capped(prog) {
    if (!m || !Progress.usedHint3(m.id, Screens.difficulty)) return false;
    const sol = solution();
    return !sol || Prog.diff(prog, sol) < OWN_PROGRAM_MIN_DIFF;
  }

  return { begin, failed, open, capped, solution, get fails() { return fails; } };
})();

// the guided start: a finger pointing at what to tap, gone as soon as it is done
const Guide = (() => {
  const finger = document.getElementById('finger');
  let steps = [], on = false;
  const PLANS = {
    '1-1': ['slot', 'slot', 'run'],
    '1-2': ['chip:lift', 'run'],
    '1-3': ['chip:lift', 'run']
  };
  function begin(m) {
    steps = (PLANS[m.id] || []).slice();
    on = !!m.guided || steps.length > 0;
    if (Progress.passed(m.id)) steps = [];
  }
  function target() {
    const s = steps[0];
    if (!s) return null;
    if (s === 'slot') return document.querySelector('#world .slot.empty');
    if (s === 'run') return document.getElementById('runBtn');
    if (s.startsWith('chip:')) return document.querySelector('#chips [data-cat="' + s.slice(5) + '"]');
    return null;
  }
  // every frame: the finger follows its target; the step is done when the target is gone or used
  function frame(state) {
    if (!steps.length || state !== 'edit' || Screens.current || Slots.isOpen()) { finger.hidden = true; return; }
    let t = target();
    while (steps.length && steps[0] === 'slot' && !t) { steps.shift(); t = target(); }
    if (!t) { finger.hidden = true; return; }
    const r = t.getBoundingClientRect();
    finger.hidden = false;
    finger.style.left = (r.left + r.width / 2) + 'px';
    finger.style.top = (r.top + r.height / 2) + 'px';
  }
  function done(what) {
    if (steps[0] === what || (steps[0] && steps[0].startsWith('chip:') && what === 'chip')) steps.shift();
  }
  return { begin, frame, done };
})();
