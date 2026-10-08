'use strict';

// Start screen: a records table instead of the description once anything is saved, the toggle between the two
// and the "Clear records" button. The difficulty, graphics and demo buttons are wired in game.js.

const aboutEl = document.getElementById('about');
const recordsEl = document.getElementById('records');
const recordsRow = document.getElementById('recordsRow');
const aboutToggle = document.getElementById('aboutToggle');
const clearBtn = document.getElementById('clearRecords');
let showAbout = false;
function renderRecords() {
  const rows = loadRecords();
  const any = rows.some((row) => row.r !== null || row.king !== null || row.max !== null);
  recordsEl.querySelector('tbody').replaceChildren(...rows.map((row) => {
    const tr = document.createElement('tr');
    for (const text of [row.label, row.r === null ? '—' : sizeText(row.r),
      row.king === null ? '—' : formatTime(row.king), row.max === null ? '—' : formatTime(row.max)]) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    }
    return tr;
  }));
  recordsRow.hidden = !any;
  recordsEl.hidden = !any || showAbout;
  aboutEl.hidden = any && !showAbout;
  aboutToggle.textContent = showAbout ? 'Show records' : 'Show description';
}
aboutToggle.addEventListener('click', () => {
  showAbout = !showAbout;
  renderRecords();
});
// Clearing takes a second press within a few seconds, so a stray tap can't wipe the records
let clearArmedT = 0;
function disarmClear() {
  clearTimeout(clearArmedT);
  clearArmedT = 0;
  clearBtn.textContent = 'Clear records';
}
clearBtn.addEventListener('click', () => {
  if (!clearArmedT) {
    clearBtn.textContent = 'Press again to clear';
    clearArmedT = setTimeout(disarmClear, 3000);
    return;
  }
  disarmClear();
  clearRecords();
  showAbout = false;
  renderRecords();
  showBanner('Records cleared');
});
renderRecords();
