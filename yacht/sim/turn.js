'use strict';

// Yacht — the rules of a turn: rolling, holding, writing a row, undo, the next player and the end.
// Changes only Run (sim/state.js) and reports what happened as game events; draws nothing, so it
// runs in Node as well. Used by game.js.

function randomFace() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const b = new Uint8Array(1);
    do { crypto.getRandomValues(b); } while (b[0] >= 252); // 252 = 42 × 6: no face comes up more often
    return b[0] % 6 + 1;
  }
  return Math.floor(Math.random() * 6) + 1;
}

const Turn = {
  // a new game: `first` is the index of the player who starts
  start(group, difficulty, first) {
    setRun({
      id: 'r' + Date.now().toString(36),
      groupId: group.id,
      startedAt: new Date().toISOString(),
      difficulty,
      cheated: false,
      players: group.players.map((p) => ({ id: p.id, name: p.name, cells: {} })),
      turn: first % group.players.length,
      dice: [0, 0, 0, 0, 0],
      held: [false, false, false, false, false],
      rollNo: 0,
      undo: null,
      over: false
    });
  },

  player() { return Run.players[Run.turn]; },
  round() { return Math.min(ALL_ROWS.length, ALL_ROWS.length - rowsLeft(this.player().cells) + 1); },
  allHeld() { return Run.rollNo > 0 && Run.held.every(Boolean); },
  canRoll() { return !Run.over && Run.rollNo < ROLLS_PER_TURN && !this.allHeld(); },
  canHold() { return !Run.over && Run.rollNo > 0 && Run.rollNo < ROLLS_PER_TURN; },
  canWrite(rowId) { return !Run.over && Run.rollNo > 0 && !this.player().cells[rowId]; },

  roll() {
    if (!this.canRoll()) return false;
    Run.undo = null;
    for (let i = 0; i < DICE_COUNT; i++) if (!Run.held[i]) Run.dice[i] = randomFace();
    Run.rollNo++;
    GameEvents.emit('rolled', { rollNo: Run.rollNo });
    return true;
  },

  toggleHold(i) {
    if (!this.canHold()) return false;
    Run.held[i] = !Run.held[i];
    GameEvents.emit('held', { i, held: Run.held[i] });
    return true;
  },

  write(rowId) {
    if (!this.canWrite(rowId)) return false;
    const player = this.player();
    const score = rowScore(rowId, Run.dice, Run.rollNo);
    Run.undo = { turn: Run.turn, rowId, dice: Run.dice.slice(), held: Run.held.slice(), rollNo: Run.rollNo };
    player.cells[rowId] = score;
    GameEvents.emit('written', { rowId, p: score.p, d: score.d, name: player.name, general: rowId === 'g' && score.p > 0, loss: isLoss(rowId, score) });
    this.next();
    return true;
  },

  next() {
    Run.dice = [0, 0, 0, 0, 0];
    Run.held = [false, false, false, false, false];
    Run.rollNo = 0;
    Run.turn = (Run.turn + 1) % Run.players.length;
    if (Run.players.every((p) => rowsLeft(p.cells) === 0)) {
      Run.over = true;
      Run.undo = null; // the last row had no choice, and the result is about to be saved
      GameEvents.emit('gameOver', {});
    } else {
      GameEvents.emit('nextPlayer', { name: this.player().name });
    }
  },

  undo() {
    const u = Run.undo;
    if (!u) return false;
    delete Run.players[u.turn].cells[u.rowId];
    Run.turn = u.turn;
    Run.dice = u.dice;
    Run.held = u.held;
    Run.rollNo = u.rollNo;
    Run.undo = null;
    GameEvents.emit('undone', {});
    return true;
  },

  // A cheat: sets all the dice not by rolling. It counts as a roll only if there was none yet.
  cheatDice(dice) {
    Run.cheated = true;
    Run.undo = null;
    Run.dice = dice.slice();
    Run.held = [false, false, false, false, false];
    if (Run.rollNo === 0) Run.rollNo = 1;
  },

  // A cheat: plays every row left of every player with random rolls, to reach the end
  cheatFinish() {
    Run.cheated = true;
    while (!Run.over) {
      Run.rollNo = 0;
      Run.held = [false, false, false, false, false];
      this.roll();
      this.roll();
      this.write(ALL_ROWS.find((r) => !this.player().cells[r.id]).id);
    }
  }
};

// The players' sums and places as the sheet and the card show them
function standings(run) {
  const totals = run.players.map((p) => totalOf(p.cells));
  const places = placesOf(totals);
  return run.players.map((p, i) => ({
    id: p.id,
    name: p.name,
    cells: p.cells,
    game: gameSum(p.cells),
    school: schoolSum(p.cells),
    total: totals[i],
    place: places[i]
  }));
}
