// The slides of docs/showcase.gif, from Grandma's House to the Empire State Building (node --experimental-websocket
// tools/showcase.js lift-logic [slide ...], see the header of tools/showcase.js and docs/testing.md). English,
// Medium, everything open (Progress.openAll), no cheats: each building runs the Engineer's solution
// (data/solutions) from its busiest moment.

async function boot(h) {
  await h.page('lift-logic', 3000);
  await h.ev(`I18N.set('en'); Progress.openAll(); 1`);    // tools/cdp.js starts each run with a clean profile
  await h.ev(`document.querySelector('[data-diff="medium"]').click(); 1`);
  await h.sleep(300);
}

// A mission with the Engineer's solution in the editor, its day run headless to the moment with the most people
// waiting and riding (between `from` and `frac` of the day, or at `t` seconds), then played from `lead` s before it
// at ×1. `cat`: the palette's category to open, `zoom`: ctrl+wheel steps zooming the scripts out, `after`: JS then.
async function mission(h, id, opts = {}) {
  await boot(h);
  h.log(id, await h.ev(`(() => {
    const m = MISSION['${id}'];
    Screens.openBrief(m);
    document.getElementById('briefStart').click();
    Editor.load(Prog.parse(SOLUTIONS['${id}']), m);
    Editor.render();
    // Prog.parse places scripts 46 px a line apart and deep ones overlap: stack them by their real heights
    { let y = 20; const els = [...document.querySelectorAll('#scripts .script')].sort((a, b) => a._script.y - b._script.y); for (const el of els) { el._script.y = y; y += el.offsetHeight + 36; } Editor.render(); }
    const crowd = () => run.queues.reduce((s, q) => s + q.length, 0) + run.lifts.reduce((s, L) => s + L.riders.length, 0);
    Run.start(m, Editor.prog, Screens.difficulty);
    let best = 0, bestT = 0; const lim = ${opts.t !== undefined ? opts.t : 'null'};
    if (lim === null) {
      const from = run.day * ${opts.from || 0}, stop = run.day * ${opts.frac || 0.7};
      while (!run.over && run.t < stop) { Run.finish(run.t + 1); const c = crowd(); if (run.t >= from && c > best) { best = c; bestT = run.t; } }
    } else bestT = lim;
    Runner.go();
    Run.finish(Math.max(0, bestT - ${opts.lead !== undefined ? opts.lead : 3}));
    Runner.cycleSpeed(1);
    ${opts.cat ? `Palette.open('${opts.cat}');` : ''}
    const a = document.getElementById('scripts').getBoundingClientRect();
    for (let i = 0; i < ${opts.zoom || 0}; i++) document.getElementById('scripts').dispatchEvent(new WheelEvent('wheel', { ctrlKey: true, deltaY: 100, clientX: a.left + 10, clientY: a.top + 10, cancelable: true }));
    return 't ' + bestT + ', crowd ' + best + ', lifts ' + run.lifts.length + ', floors ' + run.floors.length;
  })()`));
  if (opts.after) h.log(await h.ev(opts.after));
  await h.sleep(opts.wait || 2500);
}

module.exports = {
  viewport: [1280, 720],
  gif: ['--no-dither'],              // dithered it is just over 5 MB
  slides: [
    { name: '00-map', take: async (h) => { await boot(h); await h.ev(`Screens.show('map'); 1`); await h.sleep(500); } },
    { name: '1-9-grandma', take: (h) => mission(h, '1-9') },                                      // guests queuing in the lobby
    { name: '2-6-school', take: (h) => mission(h, '2-6', { zoom: 2, cat: 'sensing' }) },         // every floor calls
    { name: '3-9-hotel', take: (h) => mission(h, '3-9') },                                         // the wedding
    { name: '4-9-hospital', take: (h) => mission(h, '4-9') },                                      // night shift
    { name: '5-9-glass-tower', take: (h) => mission(h, '5-9', { zoom: 3, cat: 'events' }) },     // three lifts
    { name: '6-9-mall', take: (h) => mission(h, '6-9', { zoom: 3, cat: 'variables' }) },         // Black Friday, the car park
    { name: '7-9-eiffel', take: (h) => mission(h, '7-9', { zoom: 3, cat: 'myblocks' }) },        // Bastille Day
    { name: '8-9-empire-state', take: (h) => mission(h, '8-9', { zoom: 3, cat: 'sensing', from: 0.3,  // the top of 102 floors
      after: `View.st.zoom = 0.6; (() => { let k = 1; run.lifts.forEach((L) => { if (L.pos > run.lifts[k - 1].pos) k = L.n; }); View.st.follow = k; return 'following lift ' + k; })()` }) },
    { name: '9-newspaper', take: async (h) => {                                                    // the Empire Express after 8-9
      await mission(h, '8-9', { t: 20, lead: 0, wait: 300 });
      await h.ev(`Runner.skip(); 1`);
      await h.sleep(3800);
    } },
  ],
};
