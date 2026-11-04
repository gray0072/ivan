'use strict';

// Yacht — the player card (whose turn, their place, sums, how far from the leader, rows left), the
// message line under the dice (the turn, the advice, what a second tap would write), the other moves
// with what each brings, the dialog with all of them and the one explaining them. Used by game.js.

// the → of a text as the drawn arrow (.arrow in styles.css): a font's own sits low on a phone. The line
// may break next to a drawing even at a no-break space, so what is joined to it is kept on one line.
function arrowsHtml(html) {
  return html.replace(/[^ \n]*→[^ \n]*/g, (run) => '<span class="nowrap">' + run.split('→').join('<i class="arrow"></i>') + '</span>');
}

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
    box.innerHTML = arrowsHtml(esc(this.messageText(state)));
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
  // what it brings: gain +8, or 1.3 points this turn on average, gain +12; short for the lines under
  // the best move, which must leave the sheet its room
  payoffText(o, short) {
    const gain = signed(Math.round(o.gain));
    if (o.write) return tr('gain {gain}', { gain });
    const points = this.averageText(o.points);
    return short ? tr('{points} on average, gain {gain}', { points, gain }) : tr('{points} points this turn on average, gain {gain}', { points, gain });
  },
  // an average: small ones keep a decimal, or 1.3 would read as 1
  averageText(v) {
    const r = Math.round(v * 10) / 10;
    if (Math.abs(r) >= 10 || Number.isInteger(r)) return numText(Math.round(r));
    return (r < 0 ? '−' : '') + dec1(Math.abs(r));
  },
  // a chance in percent, never rounded down to nothing
  pctText(chance) {
    return chance < 0.005 ? '<1' : String(Math.round(chance * 100));
  },
  // the row a roll aims at, in words: the School's rows say what they ask for when there is room
  aimName(row, long) {
    if (!row.face) return tr(row.name);
    return long ? tr('School {face} (three dice of {face}, or −{n})', { face: row.face, n: SCHOOL_MISS }) : tr('School {face}', { face: row.face });
  },
  // an outcome the way the sheet writes it; in the School also with the dice it takes: 4×5 → +5,
  // on one line
  outcomeText(row, points) {
    const text = cellText(row, { p: points });
    return row.face && points >= 0 ? (SCHOOL_TARGET + points / row.face) + '×' + row.face + '\u00a0→\u00a0' + text : text;
  },
  // what a row can end with: one number, each outcome with its chance, or a range if there are too many
  outcomesText(b, withAverage) {
    const row = ROW_BY_ID[b.row];
    if (b.values.length === 1) return tr('gives {value}', { value: this.outcomeText(row, b.values[0].points) });
    const average = this.averageText(b.points);
    if (b.values.length > AIM_VALUES) {
      const min = cellText(row, { p: b.values[0].points });
      const max = cellText(row, { p: b.values[b.values.length - 1].points });
      return tr('from {min} to {max}, {average} on average', { min, max, average });
    }
    const list = b.values.map((v) => tr('{outcome} ({pct}%)', { outcome: this.outcomeText(row, v.points), pct: this.pctText(v.chance) }).replace(/ /g, '\u00a0')).join(', ');
    return withAverage ? tr('{list}, {average} on average', { list, average }) : list;
  },
  // the turn ends in this row for sure and what the dice already give there can only get better, so
  // the roll is to improve the row, not to get it
  improves(b) {
    return Math.round(b.chance * 100) >= 100 && b.now !== null && b.values[0].points >= b.now && b.values[b.values.length - 1].points > b.now;
  },
  // how a roll can end, a line each: the rows it aims at, the other rows, and what happens if nothing fits
  endingsHtml(o) {
    if (!o.hold) return '';
    const pct = (b) => Math.round(b.chance * 100);
    const shown = o.aims.filter((b) => b.chance >= AIM_MIN_CHANCE).slice(0, AIM_ROWS);
    const lines = shown.map((b) => {
      const params = { row: this.aimName(ROW_BY_ID[b.row], true), pct: pct(b), details: this.outcomesText(b, true), gain: signed(Math.round(b.gain)) };
      return pct(b) >= 100 ? tr('{row}: {details}, gain {gain}', params) : tr('{row}: chance {pct}%, {details}, gain {gain}', params);
    });
    const rest = o.aims.filter((b) => !shown.includes(b)).reduce((sum, b) => sum + b.chance, 0);
    if (Math.round(rest * 100) > 0) lines.push(tr('Other rows: chance {pct}%', { pct: Math.round(rest * 100) }));
    if (o.miss && pct(o.miss) > 0) {
      const move = this.moveText({ write: o.miss.row, loss: true, points: -SCHOOL_MISS });
      lines.push(tr('Otherwise {move}: chance {pct}%, gain {gain}', { move, pct: pct(o.miss), gain: signed(Math.round(o.miss.gain)) }));
    }
    return lines.map((l) => '<span class="aim">' + arrowsHtml(esc(l)) + '</span>').join('');
  },
  // where a roll's average comes from: every outcome's points times its chance, added up. When
  // there are too many outcomes, by row; nothing when the roll can end in one way only.
  averageSumText(o) {
    const ends = o.aims.concat(o.miss || []);
    const all = {};
    for (const b of ends) for (const v of b.values) all[v.points] = (all[v.points] || 0) + v.chance;
    let terms = Object.keys(all).map(Number).sort((x, y) => x - y).map((p) => ({ points: p, chance: all[p] }));
    if (terms.length > AVERAGE_TERMS) {
      const shown = o.aims.filter((b) => b.chance >= AIM_MIN_CHANCE).slice(0, AIM_ROWS);
      const rest = ends.filter((b) => !shown.includes(b));
      terms = shown.slice();
      if (rest.length) {
        const chance = rest.reduce((sum, b) => sum + b.chance, 0);
        terms.push({ points: rest.reduce((sum, b) => sum + b.chance * b.points, 0) / chance, chance });
      }
    }
    if (terms.length < 2) return '';
    const sum = terms.map((t) => this.averageText(t.points) + '\u00a0×\u00a0' + this.pctText(t.chance) + '%').join(' + ');
    return tr('Average this turn: {sum} ≈ {average}.', { sum, average: this.averageText(o.points) });
  },

  // the other moves under the message on Easy
  alternatives(list) {
    const box = document.getElementById('alts');
    box.hidden = Run.difficulty !== 'easy' || Run.over;
    box.innerHTML = (list || []).slice(1, 1 + HINT_ALTERNATIVES).map((o) =>
      '<div>' + esc(tr('Or: {move}, {payoff}', { move: this.moveText(o), payoff: this.payoffText(o, true) })) + '</div>').join('');
  },

  // the dialog with every move
  renderMoves(list) {
    document.getElementById('movesList').innerHTML = list.map((o, i) =>
      '<tr class="' + (i === 0 ? 'bestMove' : '') + '"><td class="mv">' + esc(this.moveText(o)) +
      this.endingsHtml(o) + '</td>' +
      '<td>' + esc(o.hold ? '≈' + this.averageText(o.points) : numText(o.points)) + (o.doubled ? '<sup>×2</sup>' : '') + '</td>' +
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
      const params = { points: o.hold ? this.averageText(o.points) : numText(points), rest: numText(all - points), total: numText(now + all), gain: signed(Math.round(o.gain)) };
      const text = o.write ? tr('{points} now + about {rest} from the other rows: a final total of about {total}. Gain {gain}.', params) : tr('About {points} this turn + about {rest} from the other rows: a final total of about {total}. Gain {gain}.', params);
      const sum = o.hold ? this.averageSumText(o) : '';
      return '<li class="' + (i === 0 ? 'bestMove' : '') + '"><b>' + esc(this.moveText(o)) + '</b>' + this.endingsHtml(o) +
        (sum ? '<span class="aim">' + esc(sum) + '</span>' : '') + '<span>' + esc(text) + '</span></li>';
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
      const turn = tr('{name}, your turn: hold Roll to shake the cup, let go to throw!', { name: Turn.player().name });
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
    const aim = a.hold && a.aims[0];
    if (!aim) return best;
    const row = ROW_BY_ID[aim.row];
    const name = this.aimName(row, false);
    const pct = Math.round(aim.chance * 100);
    const details = this.outcomesText(aim, false);
    let text = best + ' ';
    if (this.improves(aim)) text += tr('Aim: improve {row}, now {now}. Outcomes: {details}.', { row: name, now: this.outcomeText(row, aim.now), details });
    else if (pct >= 100) text += tr('Aim: {row}: {details}.', { row: name, details });
    else text += tr('Aim: {row}, chance {pct}%: {details}.', { row: name, pct, details });
    if (a.miss && Math.round(a.miss.chance * 100) > 0) {
      const move = this.moveText({ write: a.miss.row, loss: true, points: -SCHOOL_MISS });
      text += ' ' + tr('Otherwise {move}: chance {pct}%.', { move, pct: Math.round(a.miss.chance * 100) });
    }
    return text;
  }
};
