// Levels of a process: steps, bosses, stars and which step is open next.
// A level is TRACK_LEN steps; it's complete when all of them are done perfectly (rate MAX_RATE) —
// that earns its star and opens the next level.

const Progress = (() => {
  const levelOf = step => Math.floor((step - 1) / TRACK_LEN); // 0-based level of a 1-based step

  // The boss kind of a step (BOSS_KINDS), or null for a normal step.
  const bossKind = step => (step % BOSS_EVERY ? null : BOSS_KINDS[(step - 1) % TRACK_LEN + 1]);

  // All steps of level `lv` done with 0–1 mistakes.
  function levelDone(p, proc, lv) {
    if (p.progress[proc.id] < (lv + 1) * TRACK_LEN) return false;
    return p.rates[proc.id].slice(lv * TRACK_LEN, (lv + 1) * TRACK_LEN).every(r => r >= MAX_RATE);
  }

  // The last level is finished but not perfect yet: the next one stays shut until its ↻ steps are replayed.
  function locked(p, proc) {
    const steps = p.progress[proc.id];
    return steps > 0 && steps % TRACK_LEN === 0 && !levelDone(p, proc, steps / TRACK_LEN - 1);
  }

  // The level shown on the home screen: the one being played, or the finished one that still needs replays.
  const currentLevel = (p, proc) => Math.floor(p.progress[proc.id] / TRACK_LEN) - (locked(p, proc) ? 1 : 0);

  // The step to play next: the next new one, or the first ↻ step of a shut level.
  function nextStep(p, proc) {
    const steps = p.progress[proc.id];
    if (!locked(p, proc)) return steps + 1;
    const from = steps - TRACK_LEN;
    return from + p.rates[proc.id].slice(from).findIndex(r => r < MAX_RATE) + 1;
  }

  // A step can be played once done, or when it's the next new step and its level is open.
  const playable = (p, proc, n) => n <= p.progress[proc.id] || (n === p.progress[proc.id] + 1 && !locked(p, proc));

  // ↻ steps left in a level.
  const toPerfect = (p, proc, lv) => p.rates[proc.id].slice(lv * TRACK_LEN, (lv + 1) * TRACK_LEN).filter(r => r < MAX_RATE).length;

  // Levels whose star is earned (level indexes).
  function stars(p, proc) {
    const out = [];
    for (let lv = 0; lv < Math.floor(p.progress[proc.id] / TRACK_LEN); lv++) if (levelDone(p, proc, lv)) out.push(lv);
    return out;
  }

  const totalStars = p => PROCESSES.reduce((s, pr) => s + stars(p, pr).length, 0);
  // The highest earned star level over all processes, -1 if none.
  const bestLevel = p => PROCESSES.reduce((m, pr) => stars(p, pr).reduce((a, b) => Math.max(a, b), m), -1);

  // Diamonds for beating a boss step with this rate (0–3).
  function gems(step, rate) {
    const kind = bossKind(step);
    return kind ? Math.round(kind.gems * rate / MAX_RATE) : 0;
  }

  return { levelOf, bossKind, levelDone, locked, currentLevel, nextStep, playable, toPerfect, stars, totalStars, bestLevel, gems };
})();
