'use strict';

// ============================================================
// World Aviation — hides the mouse cursor in fullscreen once it has been
// still for CURSOR_HIDE_MS (constants.js) and shows it again as soon
// as the mouse moves, clicks or scrolls. Starts by itself when
// index.html loads it; the html.cursor-hidden class is in styles.css.
// ============================================================

(function () {
  let timer = 0;
  let lastX = -1, lastY = -1;

  function isFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) return true;
    if (window.matchMedia && matchMedia('(display-mode: fullscreen)').matches) return true;
    // F11 browser fullscreen does not always report itself: the window fills the screen
    return screen.width - window.innerWidth < 2 && screen.height - window.innerHeight < 2;
  }

  function wake() {
    document.documentElement.classList.remove('cursor-hidden');
    clearTimeout(timer);
    if (!isFullscreen()) return;
    timer = setTimeout(function () {
      if (isFullscreen()) document.documentElement.classList.add('cursor-hidden');
    }, CURSOR_HIDE_MS);
  }

  // browsers send a mousemove without a real move when the page under a still
  // cursor changes, so only a change of position counts as moving
  window.addEventListener('mousemove', function (e) {
    if (e.screenX === lastX && e.screenY === lastY) return;
    lastX = e.screenX; lastY = e.screenY;
    wake();
  }, { passive: true });
  window.addEventListener('mousedown', wake, { passive: true });
  window.addEventListener('wheel', wake, { passive: true });
  document.addEventListener('fullscreenchange', wake);
  document.addEventListener('webkitfullscreenchange', wake);
  window.addEventListener('resize', wake);
})();
