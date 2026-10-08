'use strict';

// The HUD over the game: size, stage, growth, boost and depth bars, and the frame rate counter left of the
// pause button. Updated by game.js every frame.

const hud = {
  size: document.getElementById('sizeText'),
  stage: document.getElementById('stageName'),
  growBar: document.getElementById('growBar'),
  growLabel: document.getElementById('growLabel'),
  boostBar: document.getElementById('boostBar'),
  depthBar: document.getElementById('depthBar'),
  fps: document.getElementById('fps')
};

function updateHud() {
  hud.size.textContent = sizeText(player.r);
  const si = stageIndexForR(player.r);
  const stage = STAGES[si];
  hud.stage.textContent = stage.name;
  const prevMax = si > 0 ? STAGES[si - 1].maxR : 0;
  // In the last stage the bar tracks progress toward the size cap instead
  const stageTop = stage.maxR === Infinity ? MAX_R : stage.maxR;
  const growFrac = clamp((player.r - prevMax) / (stageTop - prevMax), 0, 1);
  hud.growBar.style.width = (growFrac * 100) + '%';
  hud.growLabel.textContent =
    player.r >= MAX_R ? 'Maximum size' : stage.maxR === Infinity ? 'Growth to max size' : 'Growth to next stage';
  hud.boostBar.style.width = (player.boost / difficulty.boostMax * 100) + '%';
  hud.depthBar.style.width = (depthFrac(player.y) * 100) + '%';
}

// Frames drawn per second, counted over half-second windows; `label()` names the graphics preset
let fpsFrames = 0, fpsFrom = performance.now();
function countFps(now, label) {
  fpsFrames++;
  if (now - fpsFrom < 500) return;
  hud.fps.textContent = Math.round(fpsFrames * 1000 / (now - fpsFrom)) + ' FPS · ' + label();
  fpsFrames = 0;
  fpsFrom = now;
}
