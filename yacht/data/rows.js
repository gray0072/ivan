'use strict';

// Yacht — the rows of the score sheet, in the order of the paper sheet: the id, the label as it is
// written on the sheet (`label`; tr() gives Chance its Ш in Russian), the row's name and what it asks
// for. `face` is set for the school's rows. Plain data, read by sim/scoring.js and the screens.

const COMBO_ROWS = [
  { id: 'g', label: 'G', name: 'General', needs: 'Five of a kind. Scores the five dice.' },
  { id: 'c', label: 'C', name: 'Carré', needs: 'Four of a kind (or five). Scores the four dice.' },
  { id: 'bs', label: 'BS', name: 'Big straight', needs: '2-3-4-5-6. Scores 20.' },
  { id: 'ls', label: 'LS', name: 'Little straight', needs: '1-2-3-4-5. Scores 15.' },
  { id: 'fh32', label: '3:2', name: 'Full house, three higher', needs: 'Three of one face and two of a lower one. Scores the five dice.' },
  { id: 'fh23', label: '2:3', name: 'Full house, pair higher', needs: 'Three of one face and two of a higher one. Scores the five dice.' },
  { id: 'pp', label: '2:2', name: 'Two pairs', needs: 'Two pairs of different faces. Scores the four dice.' },
  { id: 't3', label: '3:0', name: 'Three of a kind', needs: 'Three of a kind (or more). Scores the three dice.' },
  { id: 'ch', label: 'Ch', name: 'Chance', needs: 'Anything. Scores the five dice.' }
];

const SCHOOL_ROWS = [6, 5, 4, 3, 2, 1].map((face) => ({ id: 's' + face, label: String(face), face, name: 'School' }));

const ALL_ROWS = COMBO_ROWS.concat(SCHOOL_ROWS);
const ROW_BY_ID = {};
for (const r of ALL_ROWS) ROW_BY_ID[r.id] = r;
