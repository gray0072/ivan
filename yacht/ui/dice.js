'use strict';

// Yacht — the leather cup and the five 3D dice on the table (CSS 3D, no canvas): where each die lies,
// and the roll's animation: the dice not held fly into the cup, it shakes, tips over, they tumble
// out to random places, it stands up again. Reads Run, tells the flow when it is done. Used by game.js.

const DiceView = (() => {
  // the rotation of the cube that brings each face to the front (the faces are placed in styles.css)
  const ROT = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
  // the pips of each face, on a 3 × 3 grid counted from the top left
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

  let tray, cup, rollEls;
  const dice = [];
  let timers = [];
  let busy = false;

  function faceHtml(f) {
    let cells = '';
    for (let i = 0; i < 9; i++) cells += PIPS[f].includes(i) ? '<i class="pip"></i>' : '<i></i>';
    return '<span class="face f' + f + '">' + cells + '</span>';
  }

  function build() {
    tray = document.getElementById('tray');
    tray.style.setProperty('--tumble', ROLL_TUMBLE_MS + 'ms');
    cup = document.getElementById('cup');
    for (let i = 0; i < DICE_COUNT; i++) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'die inCup';
      el.dataset.die = i;
      el.innerHTML = '<span class="cube">' + [1, 2, 3, 4, 5, 6].map(faceHtml).join('') + '</span>';
      tray.appendChild(el);
      dice.push({ el, cube: el.firstChild, rx: 0, ry: 0, tilt: 0, spot: { x: 0.5, y: 0.5 } });
    }
    if (window.ResizeObserver) new ResizeObserver(() => { if (!busy) place(); }).observe(tray);
    else window.addEventListener('resize', () => { if (!busy) place(); });
  }

  function metrics() {
    const W = tray.clientWidth, H = tray.clientHeight;
    const d = dice[0].el.offsetWidth || 48;
    const cupW = cup.offsetWidth;
    return { W, H, d, cupW, railH: d + 24 };
  }

  // Five places out of a grid of six cells left of the cup, each with a random shift inside its cell
  function newSpots() {
    const cells = [0, 1, 2, 3, 4, 5];
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    dice.forEach((die, i) => {
      die.spot = { col: cells[i] % 3, row: cells[i] < 3 ? 0 : 1, sx: Math.random(), sy: Math.random() };
      die.tilt = rand(-24, 24);
    });
  }

  function positionOf(i) {
    const m = metrics();
    const die = dice[i];
    if (Run && Run.held[i]) {
      const gap = 12, rail = DICE_COUNT * m.d + (DICE_COUNT - 1) * gap;
      return { x: Math.max(4, (m.W - m.cupW - rail) / 2) + i * (m.d + gap), y: 11, tilt: 0 };
    }
    const areaW = Math.max(m.d, m.W - m.cupW - 16);
    // with room to spare, a margin at the bottom: a turned die looks bigger than its box
    const free = m.H - m.railH - 8;
    const areaH = Math.max(m.d, free - clamp(free - 2.2 * m.d, 0, m.d * 0.5));
    const cw = areaW / 3, ch = areaH / 2;
    const s = die.spot;
    return {
      x: 8 + (s.col || 0) * cw + (s.sx || 0) * Math.max(0, cw - m.d - 2),
      y: m.railH + (s.row || 0) * ch + (s.sy || 0) * Math.max(0, ch - m.d - 2),
      tilt: die.tilt
    };
  }

  function mouth() {
    const m = metrics();
    return { x: m.W - m.cupW / 2 - m.d / 2, y: Math.max(0, m.H - cup.offsetHeight * 0.95) };
  }

  function setCube(die, face, spin) {
    const [bx, by] = ROT[face];
    if (spin) {
      // always on in the same direction, a few whole turns more than where it is now
      const up = (from, base) => {
        let v = base;
        while (v < from + 360 * DIE_SPIN_TURNS) v += 360;
        return v;
      };
      die.rx = up(die.rx, bx);
      die.ry = up(die.ry, by);
    } else {
      die.rx = bx;
      die.ry = by;
    }
    die.cube.style.transform = 'rotateX(-15deg) rotateY(13deg) rotateX(' + die.rx + 'deg) rotateY(' + die.ry + 'deg)';
  }

  function setSlot(i) {
    const die = dice[i];
    const p = positionOf(i);
    die.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.tilt + 'deg)';
    die.el.classList.remove('inCup');
  }
  function setInCup(i) {
    const p = mouth();
    dice[i].el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) scale(.5)';
    dice[i].el.classList.add('inCup');
  }

  // every die where the state says it is, without flying
  function place() {
    if (!Run) return;
    dice.forEach((die, i) => {
      die.el.classList.add('still');
      if (Run.dice[i]) { setCube(die, Run.dice[i], false); setSlot(i); } else setInCup(i);
    });
    void tray.offsetWidth;
    dice.forEach((die) => die.el.classList.remove('still'));
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function after(ms, fn) { timers.push(setTimeout(fn, ms)); }

  // the state changed without a roll (a new turn, a new game, undo, a cheat)
  function sync() {
    clearTimers();
    busy = false;
    cup.classList.remove('shake', 'tip');
    if (Run && Run.rollNo > 0 && dice.every((d) => d.spot.col === undefined)) newSpots();
    place();
  }

  // the dice sweep off the table and into the cup at the end of a turn
  function sweep() {
    clearTimers();
    busy = false;
    cup.classList.remove('shake', 'tip');
    dice.forEach((die, i) => setInCup(i));
  }

  // a die was held or released: it moves to the edge or back
  function moved(i) {
    if (dice[i].spot.col === undefined) newSpots();
    setSlot(i);
  }

  function roll(done) {
    clearTimers();
    const rolling = [];
    for (let i = 0; i < DICE_COUNT; i++) if (!Run.held[i]) rolling.push(i);

    busy = true;
    // the dice go in, the ones on the table visibly
    rolling.forEach(setInCup);
    after(ROLL_GATHER_MS, () => {
      cup.classList.add('shake');
      GameEvents.emit('cupShake', { ms: ROLL_SHAKE_MS });
    });
    after(ROLL_GATHER_MS + ROLL_SHAKE_MS, () => {
      cup.classList.remove('shake');
      cup.classList.add('tip');
    });
    after(ROLL_GATHER_MS + ROLL_SHAKE_MS + ROLL_TIP_MS, () => {
      const heldSpots = dice.map((d) => d.spot);
      newSpots();
      dice.forEach((d, i) => { if (Run.held[i]) d.spot = heldSpots[i]; });
      GameEvents.emit('diceSpill', { dice: rolling.length, ms: ROLL_TUMBLE_MS });
      rolling.forEach((i) => {
        dice[i].el.classList.add('tumble');
        setCube(dice[i], Run.dice[i], true);
        setSlot(i);
      });
    });
    after(ROLL_GATHER_MS + ROLL_SHAKE_MS + ROLL_TIP_MS + ROLL_TUMBLE_MS * 0.55, () => cup.classList.remove('tip'));
    after(ROLL_GATHER_MS + ROLL_SHAKE_MS + ROLL_TIP_MS + ROLL_TUMBLE_MS, () => {
      rolling.forEach((i) => dice[i].el.classList.remove('tumble'));
      busy = false;
      done();
    });
  }

  // what the dice can do now, and which ones the advice keeps
  function refresh(keep) {
    if (!Run) return;
    const canHold = Turn.canHold() && !busy;
    const left = keep ? keep.slice() : [];
    dice.forEach((die, i) => {
      die.el.disabled = !canHold;
      die.el.classList.toggle('held', !!Run.held[i]);
      const j = left.indexOf(Run.dice[i]);
      die.el.classList.toggle('hintKeep', j >= 0 && Run.dice[i] > 0);
      if (j >= 0) left.splice(j, 1);
      const label = tr(Run.held[i] ? 'Die {n}: {face}, held' : 'Die {n}: {face}', { n: i + 1, face: Run.dice[i] });
      die.el.setAttribute('aria-label', label);
    });
    cup.disabled = busy || !Turn.canRoll();
    cup.classList.toggle('ready', !busy && Turn.canRoll() && Run.rollNo === 0);
  }

  return { build, sync, sweep, moved, roll, refresh, isBusy: () => busy };
})();
