'use strict';

// Yacht — the player card (whose turn, their place, sums, how far from the leader, rows left) and the
// message line under the dice (the turn, the advice, what a second tap would write). Used by game.js.

const Card = {
  render() {
    const box = document.getElementById('card');
    const list = standings(Run);
    const s = list[Run.turn];
    const others = list.filter((o) => o.id !== s.id);
    let lead = '';
    if (others.length) {
      const top = Math.max.apply(null, others.map((o) => o.total));
      lead = s.total > top ? tr('{n} ahead', { n: s.total - top }) : s.total === top ? tr('level with the leader') : tr('{n} behind the leader', { n: top - s.total });
    }
    const leftCombos = COMBO_ROWS.filter((r) => !s.cells[r.id]).length;
    const leftSchool = SCHOOL_ROWS.filter((r) => !s.cells[r.id]).length;
    box.innerHTML =
      '<div class="who"><b class="name">' + esc(s.name) + '</b>' +
      (others.length ? '<span class="placeNow">' + esc(romanPlace(s.place)) + '</span>' : '') + '</div>' +
      '<div class="nums">' +
      '<span>' + esc(tr('Game')) + ' <b>' + esc(numText(s.game)) + '</b></span>' +
      '<span>' + esc(tr('School')) + ' <b>' + esc(signed(s.school)) + '</b></span>' +
      '<span>' + esc(tr('Total')) + ' <b>' + esc(numText(s.total)) + '</b></span>' +
      '</div>' +
      '<div class="more">' + [lead, tr('Rows left: {c} + {s} of the school', { c: leftCombos, s: leftSchool })].filter(Boolean).map(esc).join(' · ') + '</div>';
  },

  // the line under the dice; `note` is a text that stays until the next action
  message(state) {
    const box = document.getElementById('msg');
    box.textContent = this.messageText(state);
  },

  messageText({ note, armed, advice, busy }) {
    if (armed) {
      const row = ROW_BY_ID[armed];
      if (Run.difficulty === 'hard') return tr('Tap {row} again to write it.', { row: rowLabel(row) });
      const score = rowScore(armed, Run.dice, Run.rollNo);
      return tr('Tap {row} again to write {value} there.', { row: rowLabel(row), value: cellText(row, score) });
    }
    if (note) return note;
    if (busy) return '';
    if (Run.over) return tr('The game is over.');
    if (Run.rollNo === 0) {
      const turn = tr('{name}, your turn: roll the dice!', { name: Turn.player().name });
      // on Easy, a reminder of what the school asks while it is not done
      const open = SCHOOL_ROWS.some((r) => !Turn.player().cells[r.id]);
      return Run.difficulty === 'easy' && open ? turn + ' ' + tr('A school row closes with three dice of its face; if not, it costs −{n}.', { n: SCHOOL_MISS }) : turn;
    }
    if (Turn.allHeld()) return tr('All five dice are held: write into a row, or release a die to roll.');
    if (advice) return this.adviceText(advice);
    if (Run.rollNo >= ROLLS_PER_TURN) return tr('No rolls left: write into a row.');
    return tr('Tap dice to hold them, roll again or write into a row.');
  },

  adviceText(a) {
    if (a.write) {
      const row = ROW_BY_ID[a.write];
      return tr('Best move: write {value} in {row}.', { value: cellText(row, rowScore(a.write, Run.dice, Run.rollNo)), row: rowLabel(row) });
    }
    const aim = a.aim ? tr('Aiming at {row}: about {pct}%.', { row: rowLabel(ROW_BY_ID[a.aim]), pct: Math.round(a.chance * 100) }) : '';
    if (!a.hold.length) return (tr('Best move: roll all five.') + ' ' + aim).trim();
    return (tr('Best move: keep {dice} and roll.', { dice: a.hold.join(' ') }) + ' ' + aim).trim();
  }
};
