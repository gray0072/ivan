'use strict';

// Yacht — the score sheet: the rows of the paper sheet, a column per player. The current player's
// free rows are buttons, with what the dice would score on Easy and Medium. Reads Run; a tap goes to
// Flow.tapRow (a free row) or Flow.explainRow (a row's label). Used by game.js.

function rowLabel(row) {
  return row.id === 'ch' ? tr('Ch') : row.label;
}

// how the sheet writes a filled row: — for a row given up, + for a school row of exactly three
function cellText(row, cell) {
  if (row.face) return cell.p === 0 ? '+' : signed(cell.p);
  return cell.p === 0 ? '—' : String(cell.p);
}

const Sheet = {
  // one row of the sheet that holds the players' points
  rowHtml(row, marks, list) {
    const name = row.face ? tr('School: {face}', { face: row.face }) : tr(row.name);
    let html = '<tr class="' + (row.id === 's6' ? 'firstSchool' : '') + '"><th scope="row"><button type="button" class="rowLabel" data-explain="' + row.id + '" title="' + esc(name) + '">' +
      '<b>' + esc(rowLabel(row)) + '</b>' + (row.face ? '' : '<span class="rowName">' + esc(name) + '</span>') + '</button></th>';
    list.forEach((s, i) => {
      const cell = s.cells[row.id];
      const cur = i === Run.turn && !Run.over;
      const cls = cur ? ' class="cur"' : '';
      if (cell) {
        html += '<td' + cls + '><span class="ink' + (cell.p < 0 ? ' neg' : '') + (!row.face && cell.p === 0 ? ' gave' : '') + '">' + esc(cellText(row, cell)) +
          (cell.d ? '<sup>×2</sup>' : '') + '</span></td>';
      } else if (cur && marks.canWrite) {
        const score = rowScore(row.id, Run.dice, Run.rollNo);
        const show = Run.difficulty !== 'hard';
        const text = show ? esc(cellText(row, score)) + (score.d ? '<sup>×2</sup>' : '') : '';
        const c = 'free' + (marks.best === row.id ? ' best' : '') + (marks.armed === row.id ? ' armed' : '') + (show && isLoss(row.id, score) ? ' weak' : '');
        html += '<td' + cls + '><button type="button" class="' + c + '" data-row="' + row.id + '" aria-label="' + esc(name) + '">' + text + '</button></td>';
      } else {
        html += '<td' + cls + '></td>';
      }
    });
    return html + '</tr>';
  },

  sumHtml(label, cls, values) {
    return '<tr class="sum ' + cls + '"><th scope="row"><span class="sumLabel">' + esc(label) + '</span></th>' +
      values.map((v, i) => '<td' + (i === Run.turn && !Run.over ? ' class="cur"' : '') + '>' + v + '</td>').join('') + '</tr>';
  },

  render(marks) {
    const box = document.getElementById('sheet');
    const list = standings(Run);
    const anyFilled = (s) => rowsLeft(s.cells) < ALL_ROWS.length;
    let html = '<thead><tr><th scope="col" class="corner">' + esc(tr('Player')) + '</th>' +
      list.map((s, i) => '<th scope="col" class="' + (i === Run.turn && !Run.over ? 'cur' : '') + '" title="' + esc(s.name) + '"><span class="pname">' + esc(s.name) + '</span></th>').join('') + '</tr></thead><tbody>';
    for (const r of COMBO_ROWS) html += this.rowHtml(r, marks, list);
    html += this.sumHtml(tr('Game sum'), 'gameSum', list.map((s) => esc(numText(s.game))));
    for (const r of SCHOOL_ROWS) html += this.rowHtml(r, marks, list);
    html += this.sumHtml(tr('School sum'), 'schoolSum', list.map((s) => {
      if (!schoolFilled(s.cells)) return '';
      return '<span class="' + (s.school < 0 ? 'neg' : '') + '">' + esc(signed(s.school)) + '</span>';
    }));
    html += this.sumHtml(tr('Total'), 'total', list.map((s) => '<b>' + esc(numText(s.total)) + '</b>'));
    html += this.sumHtml(tr('Place'), 'place', list.map((s) => (anyFilled(s) ? esc(romanPlace(s.place)) : '')));
    box.innerHTML = html + '</tbody>';
    box.classList.toggle('few', Run.players.length <= 3);
  },

  // the current player's column comes into view on their turn
  showCurrent() {
    const th = document.querySelector('#sheet thead th.cur');
    const wrap = document.getElementById('sheetWrap');
    if (!th || !wrap) return;
    const corner = document.querySelector('#sheet thead th.corner').offsetWidth;
    if (th.offsetLeft < wrap.scrollLeft + corner) wrap.scrollLeft = th.offsetLeft - corner;
    else if (th.offsetLeft + th.offsetWidth > wrap.scrollLeft + wrap.clientWidth) wrap.scrollLeft = th.offsetLeft + th.offsetWidth - wrap.clientWidth;
  }
};
