'use strict';

// The milestone dialog (Sea King / maximum size, with the time record and fireworks for the epic one) and the
// game over screen. Called by game.js.

function showMilestoneDialog(kind) {
  const m = MILESTONES[kind];
  saveBiggest();
  if (demo) { showBanner(m.icon + ' ' + m.title); return; }
  gameState = 'paused';
  resetTouches();
  const { isRecord, best } = recordMilestone(kind);
  document.getElementById('kingIcon').textContent = m.icon;
  document.getElementById('kingTitle').textContent = m.title;
  document.getElementById('kingSub').textContent = m.sub;
  document.getElementById('kingTime').textContent = formatTime(elapsed);
  document.getElementById('kingBest').textContent = best === null ? '—' : formatTime(best);
  document.getElementById('kingDiff').textContent = difficulty.label;
  document.getElementById('kingRecord').hidden = !isRecord;
  document.getElementById('kingCheat').hidden = !cheated;
  panels.king.classList.toggle('epic', m.epic);
  showPanel('king');
  if (m.epic) fireworks.start();
  GameEvents.emit('milestone', { kind, epic: m.epic });
}

function showGameOver(reason) {
  document.getElementById('gameOverTitle').textContent = '💀 ' + reason;
  document.getElementById('gameOverText').textContent =
    'Your result: ' + sizeText(player.r) + ', stage: ' + STAGES[stageIndexForR(player.r)].name + ' (' + difficulty.label + ')';
  showPanel('gameOver');
}
