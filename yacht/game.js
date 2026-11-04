'use strict';

// Yacht — the flow: which screen is on, the buttons and keys wired to the logic in sim/turn.js, saving
// after every action, the cheats. The rules live in sim/, the drawing in ui/.

const Flow = {
  armed: null,    // the row waiting for a second tap
  note: '',       // a text in the message line until the next action
  adviceCache: null,

  inGame() { return !!Run; },

  // ---------- saving ----------
  save() {
    if (!Run || Run.over) return;
    if (!Groups.saveCurrent(Run.groupId, Run)) this.saveFailed();
  },
  saveFailed() {
    Screens.banner(Groups.get(Run ? Run.groupId : null) ? tr('Could not save: the browser\'s storage is full or blocked.') : tr('This group was deleted in another tab, so the game is not saved.'));
  },

  // ---------- starting and leaving ----------
  newGame() {
    const group = Groups.active();
    if (!group) { this.toMenu(); return; }
    fireworks.stop();
    enterFullscreen();
    Turn.start(group, Screens.difficulty, Groups.takeFirst(group.id));
    this.save();
    this.enter();
  },
  continueGame() {
    const group = Groups.active();
    if (!group || !group.current) return;
    enterFullscreen();
    setRun(group.current);
    this.enter();
  },
  enter() {
    this.armed = null;
    this.note = '';
    this.adviceCache = null;
    Screens.closeAll();
    document.getElementById('game').hidden = false;
    DiceView.sync();
    this.render();
    Sheet.showCurrent();
  },
  toMenu() {
    this.save();
    fireworks.stop();
    setRun(null);
    DiceView.sync();
    document.getElementById('game').hidden = true;
    Screens.closeAll();
    Screens.renderMenu();
    Screens.open('menu');
  },

  // ---------- drawing ----------
  // every move with what it brings, the best first (Easy only)
  moves() {
    if (!Run || Run.over || Run.difficulty !== 'easy' || Run.rollNo === 0) return null;
    if (!this.adviceCache) this.adviceCache = Advisor.options(Turn.player().cells, Run.dice, Run.rollNo);
    return this.adviceCache;
  },
  render() {
    if (!Run) return;
    const busy = DiceView.isBusy();
    const moves = busy ? null : this.moves();
    const advice = moves && moves[0];
    document.getElementById('roundText').textContent = Run.over ? tr('The game is over') : tr('Round {n} / {all}', { n: Turn.round(), all: ALL_ROWS.length });
    if (!Run.over) Card.render();
    document.getElementById('card').hidden = Run.over;
    Sheet.render({
      canWrite: !busy && !Run.over && Run.rollNo > 0,
      best: advice && advice.write,
      armed: this.armed
    });
    DiceView.refresh(advice && advice.hold ? advice.hold : null);
    const rollBtn = document.getElementById('rollBtn');
    if (Run.over) {
      rollBtn.textContent = tr('Results');
      rollBtn.disabled = false;
    } else {
      rollBtn.textContent = tr('Roll ({n})', { n: ROLLS_PER_TURN - Run.rollNo });
      rollBtn.disabled = !DiceView.inHand() && (busy || !Turn.canRoll());
    }
    document.getElementById('undoBtn').hidden = !Run.undo || busy;
    document.getElementById('movesBtn').hidden = !moves;
    document.getElementById('whyBtn').hidden = !moves;
    Card.alternatives(moves);
    Card.message({ note: this.note, armed: this.armed, advice, busy });
  },
  changed() {
    this.adviceCache = null;
    this.note = '';
    this.armed = null;
  },

  // ---------- a turn ----------
  // the cup is taken: it shakes until it is let go
  press() {
    if (!Run || Run.over || DiceView.isBusy() || !Turn.canRoll()) return false;
    this.changed();
    DiceView.press();
    this.render();
    return true;
  },
  // let go: only now the dice are drawn, so what comes up really depends on the moment
  letGo() {
    DiceView.letGo(() => {
      if (!Turn.roll()) return;
      this.changed();
      this.save();
      this.render();
    }, () => this.render());
  },
  // a roll with no holding: a screen reader's click, Results at the end of the game
  roll() {
    if (!Run) return;
    if (Run.over) { Screens.open('overPanel'); return; }
    if (this.press()) this.letGo();
  },
  toggleDie(i) {
    if (!Run || DiceView.isBusy() || !Turn.toggleHold(i)) return;
    this.note = '';
    this.armed = null;
    this.save();
    DiceView.moved(i);
    this.render();
  },
  tapRow(rowId) {
    if (!Run || DiceView.isBusy() || !Turn.canWrite(rowId)) return;
    const asks = Run.difficulty === 'hard' || isLoss(rowId, rowScore(rowId, Run.dice, Run.rollNo));
    if (asks && this.armed !== rowId) {
      this.armed = rowId;
      this.note = '';
      this.render();
      return;
    }
    this.changed();
    Turn.write(rowId);
    if (Run.over) { this.finish(); return; }
    this.save();
    DiceView.sweep();
    this.render();
    Sheet.showCurrent();
  },
  undo() {
    if (!Run || DiceView.isBusy() || !Turn.undo()) return;
    this.changed();
    this.save();
    DiceView.sync();
    this.render();
    Sheet.showCurrent();
  },
  explainRow(rowId) {
    const row = ROW_BY_ID[rowId];
    this.armed = null;
    this.note = row.face ? tr('School row of {face}: three dice close it; each die more adds {face}. Not closed, it costs −{n}.', { face: row.face, n: SCHOOL_MISS })
      : rowLabel(row) + ': ' + tr(row.name) + '. ' + tr(row.needs) + ' ' + tr('Doubled after the first roll.');
    this.render();
  },

  // ---------- the end ----------
  finish() {
    DiceView.sweep();
    this.render();
    const list = standings(Run);
    if (!Run.cheated) {
      if (!Groups.addGame(Run.groupId, summarizeRun(Run))) this.saveFailed();
    } else {
      // a cheated game goes nowhere; the group has no unfinished game any more
      Groups.saveCurrent(Run.groupId, null);
    }
    Screens.renderOver(list, Run.cheated);
    Screens.renderDifficulty();
    Screens.open('overPanel');
    if (list.length > 1) fireworks.start();
    setTimeout(() => fireworks.stop(), 5000);
  },
  abandon() {
    const id = Run.groupId;
    Groups.saveCurrent(id, null);
    setRun(null);
    if (!Groups.get(id)) { this.toMenu(); return; }
    Groups.setActive(id);
    this.newGame();
  },

  // ---------- cheats ----------
  cheat(digit) {
    if (!Run || Run.over || DiceView.isBusy()) return;
    const sets = { 7: [1, 2, 3, 4, 5], 8: [2, 3, 4, 5, 6], 9: [6, 6, 6, 5, 5] };
    if (digit === 0) {
      Screens.banner(tr('Cheat: the game is played to its end'));
      Turn.cheatFinish();
      this.changed();
      this.finish();
      return;
    }
    const dice = digit <= 6 ? [digit, digit, digit, digit, digit] : sets[digit];
    Turn.cheatDice(dice);
    this.changed();
    this.save();
    DiceView.sync();
    this.render();
    Screens.banner(tr('Cheat: dice set to {dice}; this game will not count', { dice: dice.join(' ') }));
  },

  // ---------- another tab changed the groups ----------
  storageChanged() {
    if (Screens.top() === 'menu') Screens.renderMenu();
    if (Screens.top() === 'statsPanel') StatsView.render();
    if (!Run || Run.over) return;
    const group = Groups.get(Run.groupId);
    if (!group || !group.current || group.current.id !== Run.id) {
      setRun(null);
      document.getElementById('game').hidden = true;
      Screens.closeAll();
      Screens.renderMenu();
      Screens.open('menu');
      Screens.banner(tr('This game was ended in another tab.'));
      return;
    }
    if (JSON.stringify(group.current) !== JSON.stringify(Run)) {
      setRun(group.current);
      this.changed();
      DiceView.sync();
      this.render();
    }
  }
};

// ---------- wiring ----------
(() => {
  const $ = (id) => document.getElementById(id);
  const on = (id, fn) => $(id).addEventListener('click', fn);

  I18N.load();
  I18N.buildPickers();
  Tabletop.load();
  Tabletop.bind();
  DiceView.build();
  const saved = Groups.getSetting('difficulty', 'easy');
  Screens.difficulty = ['easy', 'medium', 'hard'].includes(saved) ? saved : 'easy';

  function renderAll() {
    I18N.applyDom();
    Screens.renderDifficulty();
    Screens.renderSound();
    Screens.renderHelp();
    Screens.renderMenu();
    Tabletop.render();
    if (Screens.top() === 'editor') { GroupEditor.readInputs(); GroupEditor.render(); }
    if (Screens.top() === 'statsPanel') StatsView.render();
    if (Screens.top() === 'movesPanel' && Flow.moves()) Card.renderMoves(Flow.moves());
    if (Screens.top() === 'whyPanel' && Flow.moves()) Card.renderWhy(Flow.moves());
    if (Run) {
      Flow.render();
      if (Run.over) Screens.renderOver(standings(Run), Run.cheated);
    }
  }
  I18N.onChange(renderAll);
  renderAll();
  Screens.open('menu');

  // the start screen
  on('groupList', (e) => {
    const b = e.target.closest('button[data-group]');
    if (!b) return;
    Groups.setActive(b.dataset.group);
    Screens.renderMenu();
  });
  on('newGroupBtn', () => GroupEditor.openNew());
  on('editGroupBtn', () => { const g = Groups.active(); if (g) GroupEditor.openFor(g); });
  on('newGameBtn', () => {
    const g = Groups.active();
    if (!g) return;
    if (!g.current) { Flow.newGame(); return; }
    Screens.confirm(tr('Start a new game?'), tr('The unfinished game of this group is dropped and not counted.'), tr('Yes, a new game'), () => {
      Groups.saveCurrent(g.id, null);
      Flow.newGame();
    });
  });
  on('continueBtn', () => Flow.continueGame());
  on('statsBtn', () => { const g = Groups.active(); StatsView.open(g ? g.id : null); });
  on('helpBtn', () => { $('help').hidden = !$('help').hidden; });

  // the group editor
  on('addPlayerBtn', () => GroupEditor.add());
  on('editPlayers', (e) => GroupEditor.clickList(e));
  on('saveGroupBtn', () => {
    if (!GroupEditor.save()) return;
    Screens.back();
    Screens.renderMenu();
  });
  on('cancelGroupBtn', () => Screens.back());
  on('deleteGroupBtn', () => {
    const g = Groups.get(GroupEditor.groupId);
    if (!g) { Screens.back(); return; }
    Screens.confirm(tr('Delete the group?'), tr('{name} and its {n} finished games are deleted for good.', { name: g.name, n: g.games.length }), tr('Yes, delete'), () => {
      Groups.remove(g.id);
      Screens.back();
      Screens.renderMenu();
    });
  });

  // statistics
  on('statsTabs', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    StatsView.tab = b.dataset.tab;
    StatsView.render();
  });
  on('statsCloseBtn', () => Screens.back());
  on('statsClearBtn', () => {
    const g = Groups.get(StatsView.groupId);
    if (!g) return;
    Screens.confirm(tr('Clear the statistics?'), tr('The {n} finished games of {name} are deleted for good.', { n: g.games.length, name: g.name }), tr('Yes, clear'), () => {
      Groups.clearGames(g.id);
      StatsView.render();
    });
  });

  // a question
  on('confirmYes', () => {
    const fn = Screens.onYes;
    Screens.back();
    if (fn) fn();
  });
  on('confirmNo', () => Screens.back());

  // the game
  on('rollBtn', () => Flow.roll());
  on('cup', () => Flow.roll());
  // held down they shake the cup and letting go throws, wherever the finger is by then; the click that
  // follows finds the dice busy. Going away from the page throws too, its release would never come.
  let pressedBy = null;
  for (const id of ['rollBtn', 'cup']) {
    $(id).addEventListener('pointerdown', (e) => {
      if (e.button === 0 && !DiceView.isHeld() && Flow.press()) pressedBy = e.pointerId;
    });
    $(id).addEventListener('contextmenu', (e) => e.preventDefault());
  }
  const dropCup = (e) => {
    if (e.pointerId !== pressedBy) return;
    pressedBy = null;
    Flow.letGo();
  };
  window.addEventListener('pointerup', dropCup);
  window.addEventListener('pointercancel', dropCup);
  window.addEventListener('blur', () => Flow.letGo());
  document.addEventListener('visibilitychange', () => { if (document.hidden) Flow.letGo(); });
  on('undoBtn', () => Flow.undo());
  on('movesBtn', () => {
    const list = Flow.moves();
    if (!list) return;
    Card.renderMoves(list);
    Screens.open('movesPanel');
  });
  on('movesCloseBtn', () => Screens.back());
  on('whyBtn', () => {
    const list = Flow.moves();
    if (!list) return;
    Card.renderWhy(list);
    Screens.open('whyPanel');
  });
  on('whyCloseBtn', () => Screens.back());
  on('tray', (e) => {
    const b = e.target.closest('button[data-die]');
    if (b) Flow.toggleDie(+b.dataset.die);
  });
  on('sheet', (e) => {
    const row = e.target.closest('button[data-row]');
    if (row) { Flow.tapRow(row.dataset.row); return; }
    const label = e.target.closest('button[data-explain]');
    if (label) Flow.explainRow(label.dataset.explain);
  });
  on('hudStatsBtn', () => StatsView.open(Run ? Run.groupId : null));
  on('soundBtn', () => { setSound(!soundOn); Screens.renderSound(); });
  on('pauseBtn', () => Screens.open('pausePanel'));

  // pause
  on('resumeBtn', () => Screens.back());
  on('pauseStatsBtn', () => StatsView.open(Run ? Run.groupId : null));
  on('pauseNewBtn', () => {
    Screens.confirm(tr('Start a new game?'), tr('This game is dropped and not counted.'), tr('Yes, a new game'), () => Flow.abandon());
  });
  on('pauseMenuBtn', () => Flow.toMenu());

  // game over
  on('againBtn', () => { const id = Run.groupId; setRun(null); Groups.setActive(id); if (Groups.get(id)) Flow.newGame(); else Flow.toMenu(); });
  on('overStatsBtn', () => StatsView.open(Run ? Run.groupId : null));
  on('overSheetBtn', () => Screens.back());
  on('overMenuBtn', () => Flow.toMenu());

  // toggles found on several panels
  document.addEventListener('click', (e) => {
    ensureAudio();
    const d = e.target.closest('button[data-diff]');
    if (d) Screens.setDifficulty(d.dataset.diff);
    const s = e.target.closest('button[data-sound]');
    if (s) { setSound(s.dataset.sound === 'on'); Screens.renderSound(); }
    // a button pressed with the mouse or a finger does not keep the keyboard's focus: Space would press it again
    const btn = e.target.closest('button');
    if (btn && e.detail > 0) btn.blur();
  });

  // keys
  document.addEventListener('keydown', (e) => {
    ensureAudio();
    const typing = e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (e.altKey && /^Digit\d$/.test(e.code)) {
      if (Run && !Screens.top()) { e.preventDefault(); Flow.cheat(+e.code.slice(5)); }
      return;
    }
    if (typing) {
      if (e.key !== 'Enter') { if (e.key === 'Escape') Screens.back(); return; }
      e.preventDefault();
      const fields = [...document.querySelectorAll('#editor input')];
      const next = fields[fields.indexOf(e.target) + 1];
      if (next) next.focus(); else $('saveGroupBtn').click();
      return;
    }
    if (e.key === 'Escape') {
      const top = Screens.top();
      if (!top && Run) Screens.open('pausePanel');
      else if (top && top !== 'menu' && top !== 'overPanel') Screens.back();
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      if (e.target && e.target.tagName === 'BUTTON') return; // the keyboard's own focus presses it
      if (e.repeat) return;
      e.preventDefault();
      const top = Screens.top();
      if (top) {
        const b = [...document.querySelectorAll('#' + top + ' .btn.default')].find((x) => !x.closest('[hidden]') && !x.hidden);
        if (b) b.click();
      }
      else if (Run && Run.over) Flow.roll();
      else Flow.press();
      return;
    }
    if (!Screens.top() && Run && /^[1-5]$/.test(e.key)) Flow.toggleDie(+e.key - 1);
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Enter') Flow.letGo();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === Groups.KEY) Flow.storageChanged();
  });

  // a new deploy reloads only on the start screen, with nothing being typed
  AppUpdate.watch(() => !Run && Screens.top() === 'menu');
})();
