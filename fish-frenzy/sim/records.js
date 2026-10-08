'use strict';

// Records kept in localStorage per difficulty: the best time to each milestone (data/milestones.js) and the
// biggest size reached. Runs with cheats (and demo runs) never count. Used by game.js and ui/.

function loadBest(storageKey) {
  try {
    const v = parseFloat(localStorage.getItem(storageKey));
    return isFinite(v) ? v : null;
  } catch (err) { return null; }
}
function saveBest(storageKey, v) {
  try { localStorage.setItem(storageKey, String(v)); } catch (err) { /* storage blocked */ }
}

// ---------- Biggest size reached, saved on death, milestones, pause and before a cheat ----------
const BIGGEST_KEY = 'fishFrenzy.biggestR.';
let runMaxR = BASE_R;  // the biggest radius of the current run (jellyfish can shrink you back)
function saveBiggest() {
  if (cheated || runMaxR <= BASE_R) return;
  const key = BIGGEST_KEY + difficultyKey;
  const prev = loadBest(key);
  if (prev === null || runMaxR > prev) saveBest(key, runMaxR);
}

// ---------- Milestone times ----------
// Saves the current run's time if it beats the record; returns { isRecord, best } (best = null if there is none)
function recordMilestone(kind) {
  const storageKey = MILESTONES[kind].storage + difficultyKey;
  const prevBest = loadBest(storageKey);
  const isRecord = !cheated && (prevBest === null || elapsed < prevBest);
  if (isRecord) saveBest(storageKey, elapsed);
  return { isRecord, best: isRecord ? elapsed : prevBest };
}

// One row per difficulty: { label, r, king, max }, null where nothing is saved
function loadRecords() {
  return Object.keys(DIFFICULTIES).map((key) => {
    const king = loadBest(MILESTONES.king.storage + key);
    const max = loadBest(MILESTONES.max.storage + key);
    // Saves from before the size record existed: a milestone time still tells the least size reached
    const r = Math.max(loadBest(BIGGEST_KEY + key) || 0, max !== null ? MAX_R : king !== null ? STAGES[STAGES.length - 2].maxR : 0);
    return { label: DIFFICULTIES[key].label, r: r || null, king, max };
  });
}

function clearRecords() {
  try {
    for (const key in DIFFICULTIES) {
      for (const prefix of [BIGGEST_KEY, MILESTONES.king.storage, MILESTONES.max.storage]) localStorage.removeItem(prefix + key);
    }
  } catch (err) { /* storage blocked */ }
}
