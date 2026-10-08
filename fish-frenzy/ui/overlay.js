'use strict';

// The overlay that holds the screens (menu, game over, milestone, pause) and the banner for short messages.
// Used by game.js and the other ui/ files.

const overlay = document.getElementById('overlay');
const panels = {
  menu: document.getElementById('menu'),
  gameOver: document.getElementById('gameOver'),
  king: document.getElementById('kingPanel'),
  pause: document.getElementById('pausePanel')
};
function showPanel(name) {
  overlay.style.display = 'flex';
  for (const key in panels) panels[key].hidden = key !== name;
  if (name === 'menu') renderRecords();
}
// Also drops the focus an arrow-key menu left on a button, so Space during play can't press it
function hideOverlay() {
  overlay.style.display = 'none';
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

function showBanner(text) {
  const el = document.getElementById('banner');
  el.textContent = text;
  el.style.opacity = '1';
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => { el.style.opacity = '0'; }, 2200);
}
