'use strict';

// Yacht — the player card (whose turn, their place, sums, how far from the leader, rows left), the
// message line under the dice (the turn, the advice, what a second tap would write), the other moves
// with what each brings, the dialog with all of them and the one explaining them. Used by game.js.

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

  // a move in words, to go inside a sentence: write 30 in 3:0, give up G, keep 5 5 5 and roll, roll all five
  moveText(o) {
    if (o.write) {
      const row = ROW_BY_ID[o.write];
      if (!row.face && o.loss) return tr('give up {row}', { row: rowLabel(row) });
      return tr('write {value} in {row}', { value: cellText(row, { p: o.points }), row: rowLabel(row) });
    }
    return o.hold.length ? tr('keep {dice} and roll', { dice: o.hold.join(' ') }) : tr('roll all five');
  },
  // what it brings: gain +8, or 33 on average, gain +12
  payoffText(o) {
    const gain = signed(Math.round(o.gain));
    return o.write ? tr('gain {gain}', { gain }) : tr('{points} on average, gain {gain}', { points: numText(Math.round(o.points)), gain });
  },
  aimText(o) {
    return o.aim ? tr('Most often {row}: about {pct}%', { row: rowLabel(ROW_BY_ID[o.aim]), pct: Math.round(o.chance * 100) }) : '';
  },

  // the other moves under the message on Easy
  alternatives(list) {
    const box = document.getElementById('alts');
    box.hidden = Run.difficulty !== 'easy' || Run.over;
    box.innerHTML = (list || []).slice(1, 1 + HINT_ALTERNATIVES).map((o) =>
      '<div>' + esc(tr('Or: {move}, {payoff}', { move: this.moveText(o), payoff: this.payoffText(o) })) + '</div>').join('');
  },

  // the dialog with every move
  renderMoves(list) {
    document.getElementById('movesList').innerHTML = list.map((o, i) =>
      '<tr class="' + (i === 0 ? 'bestMove' : '') + '"><td class="mv">' + esc(this.moveText(o)) +
      (o.aim ? '<span class="aim">' + esc(this.aimText(o)) + '</span>' : '') + '</td>' +
      '<td>' + esc((o.hold ? '≈' : '') + numText(Math.round(o.points))) + (o.doubled ? '<sup>×2</sup>' : '') + '</td>' +
      '<td class="' + (o.gain < 0 ? 'minus' : 'plus') + '"><b>' + esc(signed(Math.round(o.gain))) + '</b></td></tr>').join('');
  },

  // the Why this move dialog: where the player stands and the best moves taken apart
  renderWhy(list) {
    const cells = Turn.player().cells;
    const now = totalOf(cells);
    const ahead = Math.round(Advisor.expected(cells));
    document.getElementById('whyNow').textContent = tr('Before this turn your free rows could bring about {n} more points, a final total of about {total}.', { n: numText(ahead), total: numText(now + ahead) });
    document.getElementById('whyList').innerHTML = list.slice(0, WHY_MOVES).map((o, i) => {
      const points = Math.round(o.points);
      const all = ahead + Math.round(o.gain);
      const params = { points: numText(points), rest: numText(all - points), total: numText(now + all), gain: signed(Math.round(o.gain)) };
      const text = o.write ? tr('{points} now + about {rest} from the other rows: a final total of about {total}. Gain {gain}.', params) : tr('About {points} this turn + about {rest} from the other rows: a final total of about {total}. Gain {gain}.', params);
      return '<li class="' + (i === 0 ? 'bestMove' : '') + '"><b>' + esc(this.moveText(o)) + '</b><span>' + esc(text) + '</span></li>';
    }).join('');
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
    const best = tr('Best move: {move}, {payoff}.', { move: this.moveText(a), payoff: this.payoffText(a) });
    return a.aim ? best + ' ' + this.aimText(a) + '.' : best;
  }
};
