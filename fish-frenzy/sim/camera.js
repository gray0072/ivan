'use strict';

// The camera follows the player and zooms out with its size. Used by spawning and culling (what is on or off
// screen), splash volumes, the renderer (worldToScreen) and the radar.

// The view zooms out stage by stage: every stage divides the zoom by the same step,
// MAX_ZOOM_DIVISOR^(1 / (STAGES.length - 1)), spread geometrically over the stage's radius range, so the fish
// grows on screen only a little per stage. From the Sea King on the zoom stays at START_ZOOM / MAX_ZOOM_DIVISOR.
const ZOOM_STEP = Math.pow(MAX_ZOOM_DIVISOR, 1 / (STAGES.length - 1));
function zoomForR(r) {
  const si = stageIndexForR(r);
  if (si >= STAGES.length - 1) return START_ZOOM / MAX_ZOOM_DIVISOR;
  const lo = si > 0 ? STAGES[si - 1].maxR : BASE_R, hi = STAGES[si].maxR;
  const t = clamp(Math.log(r / lo) / Math.log(hi / lo), 0, 1);
  return START_ZOOM / Math.pow(ZOOM_STEP, si + t);
}
function currentZoom() { return zoomForR(player.r); }
function worldToScreen(wx, wy) {
  const z = currentZoom();
  return { x: (wx - player.x) * z + screenW / 2, y: (wy - player.y) * z + screenH / 2, z };
}
// Distance from the player at which an object reaching `extent` world units from its center is fully off-screen
function offscreenDist(extent) {
  return Math.hypot(screenW, screenH) / (2 * currentZoom()) + extent + 40;
}
function onScreenX(x, extent) { return Math.abs(x - player.x) < offscreenDist(extent); }
