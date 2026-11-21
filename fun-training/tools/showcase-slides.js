// The slides of docs/showcase.gif: the scenes, the bosses, a level-up and the room (node --experimental-websocket
// tools/showcase.js fun-training [slide ...], see the header of tools/showcase.js and docs/testing.md). Each run
// writes one long-played player into funTraining.v1 and reloads; the answers are clicked, not cheated (`]` would
// mark the lesson and hide the level-up): Tasks.make is wrapped to keep the current task and __ans clicks the
// choice with its answer.

const GEMS = { 5: 3, 10: 6 };   // the diamonds of a boss and a big boss step

// a track of n steps done, all perfect but the 1-based steps in `imperfect` (rate 2 or 1)
function track(n, imperfect = {}) {
  const rates = [], best = [], bestGems = [];
  for (let i = 1; i <= n; i++) {
    const r = imperfect[i] !== undefined ? imperfect[i] : 3;
    rates.push(r);
    best.push(Math.round(r / 3 * 45));
    bestGems.push(i % 5 ? 0 : Math.round(GEMS[(i - 1) % 10 + 1] * r / 3));
  }
  return { n, rates, best, bestGems };
}

// Mia the Kitty after a long play: 🪙 3860 · 💎 47, six tracks at different levels, dressed and furnished
function save() {
  const t = {
    flower: track(59),
    zombies: track(33, { 32: 2 }),
    railway: track(27, { 22: 2, 26: 1 }),
    balloon: track(14, { 12: 2 }),
    campfire: track(21),
    panda: track(9, { 3: 2, 7: 1 }),
  };
  const progress = {}, rates = {}, best = {}, bestGems = {};
  for (const k in t) { progress[k] = t[k].n; rates[k] = t[k].rates; best[k] = t[k].best; bestGems[k] = t[k].bestGems; }
  const equip = {
    head: 'crown', neck: 'starchain', body: 'wizardrobe', back: 'butterflywings', feet: 'lightsneakers', hand: 'rainbowwand',
    wall: 'aurorawall', floor: 'starfloor', bed: 'rocketbed', table: 'gamingdesk', lamp: 'discoball', window: 'spacewindow',
    rug: 'racetrackrug', picture: 'familyportrait', plant: 'cherryplant', toy: 'robot', pet: 'babydragon',
  };
  const owned = [...new Set([...Object.values(equip), 'wizard', 'witchhat', 'luciacrown', 'gown', 'tuxedo', 'spacesuit',
    'dragonwings', 'jetpack', 'moonboots', 'guitar', 'wand', 'carbed', 'piratebed', 'lavalamp', 'aquawall', 'spacewall',
    'castlewall', 'seafloor', 'goldfloor', 'oceanrug', 'persianrug', 'christmastreeplant', 'rockettoy', 'jellyfishtank', 'parrot'])];
  const player = {
    id: 'mia', name: 'Mia', character: 'kitty', fullness: 92, fedAt: Date.now(),
    owned, equip, coins: 3860, gems: 47, progress, rates, best, bestGems,
    settings: {
      answerMode: 'choice', lessonLength: 10, types: ['math', 'scale', 'read'],
      math: { ops: ['add', 'sub', 'mul'], operands: 2, mix: false, limits: { add: 100, sub: 100, mul: 100, div: 100 }, speed: 'medium' },
      scale: { parts: [4, 5, 10], limit: 100, labels: 'all', speed: 'medium' },
      read: { lang: 'en', size: 5, words: 1, speed: 'medium' },
    },
  };
  return { players: [player], lastPlayerId: 'mia' };
}

// in the page after the load: keep each task, and __ans(n, gap, wrong) answers n tasks (wrongly when `wrong`)
const helpersJS = `(() => {
  const mk = Tasks.make;
  Tasks.make = (...a) => (window.__t = mk(...a));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  window.__ans = async (n, gap = 500, wrong = false) => {
    const log = [];
    for (let i = 0; i < n; i++) {
      const card = document.getElementById('taskCard');
      const t1 = performance.now();
      while ((card.classList.contains('ok') || card.classList.contains('bad')) && performance.now() - t1 < 3000) await wait(40);
      const t = window.__t, lab = String(Tasks.label(t.answer));
      const btns = [...document.querySelectorAll('#choices button')];
      for (let k = 0; k < 4; k++) {
        const b = btns.find(x => (x.querySelector('.val').textContent === lab) !== wrong);
        if (!b) { log.push('no button for ' + lab); break; }
        b.click();
        const t0 = performance.now();
        const hit = () => window.__t !== t || card.classList.contains('ok') || card.classList.contains('bad');
        while (!hit() && performance.now() - t0 < 1500) await wait(40);
        if (hit()) break;
      }
      log.push(t.type + ' ' + lab);
      await wait(gap);
    }
    return log.join(', ');
  };
  return 'ok';
})()`;

// the save written, the page reloaded, Mia's home open; `settings`: JS changing her settings `p` first
async function home(h, settings = '') {
  await h.page('fun-training', 1500);
  await h.ev(`localStorage.setItem('funTraining.v1', ${JSON.stringify(JSON.stringify(save()))});
    localStorage.setItem('funTraining.quality', 'high'); 1`);
  await h.ev('location.reload(); 1');
  await h.sleep(2500);
  await h.ev(helpersJS);
  if (settings) await h.ev(`(() => { const p = Store.players()[0]; ${settings}; Store.save(); return 1; })()`);
  await h.ev(`document.querySelector('.playerCard.default').click(); 1`);
  await h.sleep(800);
}

// a lesson of a process at a step, started from its track cell
async function lesson(h, proc, step, settings) {
  await home(h, settings);
  await h.ev(`document.querySelector('#processList .cell[data-proc="${proc}"][data-step="${step}"]').click(); 1`);
  await h.sleep(600);
}

const ans = async (h, n, gap = 300, wrong = false) => h.log(await h.ev(`__ans(${n}, ${gap}, ${wrong})`));

// a boss step: nine tasks, then one hit on the boss
async function bossHit(h, proc, step, settings, after) {
  await lesson(h, proc, step, settings);
  await ans(h, 9, 250);
  await h.sleep(2200);
  await ans(h, 1, 0);
  await h.sleep(after);
}

module.exports = {
  viewport: [1280, 720],
  gif: [],                           // dithered: about 4 MB
  slides: [
    { name: '1-home', take: (h) => home(h) },                                    // six tracks, their levels and stars
    { name: '2-zombies', take: async (h) => {                                    // a scale task after a mistake: the solution
      await lesson(h, 'zombies', 34, `p.settings.types = ['scale']`);
      await ans(h, 4);
      await h.sleep(2500);
      await ans(h, 1, 0, true);
      await h.sleep(900);
    } },
    { name: '3-railway', take: async (h) => {                                    // a reading task, words up to 6 letters
      await lesson(h, 'railway', 28, `p.settings.types = ['read']; p.settings.read.size = 6`);
      await ans(h, 5);
      await h.sleep(2600);
    } },
    { name: '4-campfire', take: async (h) => {                                   // a mixed task of 3 numbers, the wolves near
      await lesson(h, 'campfire', 22, `p.settings.types = ['math']; p.settings.math.operands = 3; p.settings.math.mix = true`);
      for (let i = 0; i < 8; i++) {
        await ans(h, 1);
        const t = await h.ev(`__t.text`);
        if (i >= 3 && /×/.test(t) && /[+−]/.test(t)) break;
      }
      await h.sleep(9000);                                                        // the fire burns down
    } },
    { name: '5-balloon-boss', take: (h) => bossHit(h, 'balloon', 15, `p.settings.types = ['math']`, 2500) },        // the thundercloud
    { name: '6-panda-big-boss', take: (h) => bossHit(h, 'panda', 10, `p.settings.types = ['read']; p.settings.read.size = 0`, 3500) },  // the crowned monkey, letters
    { name: '7-flower-big-boss', take: (h) => bossHit(h, 'flower', 60, `p.settings.types = ['math']`, 2000) },      // the caterpillar
    { name: '8-victory', take: async (h) => {                                    // the Gold star, the ladder, fireworks
      await lesson(h, 'flower', 60, `p.settings.types = ['math']`);
      await ans(h, 12, 450);
      await h.ev(`new Promise(r => { const t0 = performance.now(); (function w() { if (!document.getElementById('resultPanel').hidden || performance.now() - t0 > 8000) r(1); else requestAnimationFrame(w); })(); })`);
      await h.sleep(1400);
    } },
    { name: '9-room', take: async (h) => {                                       // dressed and furnished, the shop's Room tab
      await home(h);
      await h.ev(`document.getElementById('roomBtn').click(); 1`);
      await h.sleep(1500);
      await h.ev(`const tab = document.querySelector('#shopTabs .shopTab[data-tab="room"]'); if (tab) tab.click(); 1`);
      await h.sleep(1500);
    } },
  ],
};
