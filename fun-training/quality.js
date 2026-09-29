// Automatic graphics quality: a starting level guessed from the device, then lowered (or raised back)
// by the frame rate measured during lessons. The learned level is remembered per device.

const Quality = (() => {
  const TV_UA = /Web0S|webOS|NetCast|SmartTV|SMART-TV|Tizen|HbbTV|BRAVIA|AFT[A-Z]|CrKey|Android TV|GoogleTV/i;

  function detectCeiling() {
    const nav = navigator;
    if (TV_UA.test(nav.userAgent || '')) return 0;
    if ((nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2)) return 0;
    if (matchMedia('(pointer: coarse)').matches) return 1;
    return QUALITY_LEVELS.length - 1;
  }

  const ceiling = detectCeiling();
  let level = ceiling;
  try {
    const saved = QUALITY_LEVELS.findIndex(q => q.id === localStorage.getItem(QUALITY_KEY));
    if (saved >= 0 && saved < level) level = saved;
  } catch (e) { /* no storage */ }

  let failedAt = QUALITY_LEVELS.length; // lowest level that turned out too slow in this session
  let time = 0, frames = 0, upChecks = 0, warmup = 0;
  let onChange = null;

  function set(i) {
    level = i;
    upChecks = 0;
    try { localStorage.setItem(QUALITY_KEY, QUALITY_LEVELS[level].id); } catch (e) { /* ignore */ }
    if (onChange) onChange();
  }

  // Start measuring afresh (a lesson starts or resumes); the first frames are skipped.
  function reset() {
    time = 0;
    frames = 0;
    warmup = 0.6;
  }

  // One drawn lesson frame; dt = real seconds since the previous one.
  function frame(dt) {
    if (dt > 0.25) return; // a hitch or a hidden tab, not the steady frame rate
    if (warmup > 0) { warmup -= dt; return; }
    time += dt;
    frames++;
    if (time < QUALITY_WINDOW) return;
    const fps = frames / time;
    time = 0;
    frames = 0;
    if (fps < QUALITY_LOW_FPS && level > 0) {
      failedAt = Math.min(failedAt, level);
      set(level - 1);
      warmup = 0.6;
    } else if (fps > QUALITY_HIGH_FPS && level < ceiling && level + 1 < failedAt) {
      if (++upChecks >= QUALITY_UP_WINDOWS) { set(level + 1); warmup = 0.6; }
    } else upChecks = 0;
  }

  // Canvas pixels per CSS px for a cw × ch CSS px canvas.
  function canvasScale(cw, ch) {
    const q = QUALITY_LEVELS[level];
    const byPixels = Math.sqrt(q.maxPixels / Math.max(1, cw * ch));
    return Math.max(0.5, Math.min(window.devicePixelRatio || 1, q.maxDpr, byPixels));
  }

  return {
    reset, frame, canvasScale,
    glow: () => QUALITY_LEVELS[level].glow,
    confetti: () => QUALITY_LEVELS[level].confetti,
    id: () => QUALITY_LEVELS[level].id,
    onChange: cb => { onChange = cb; },
  };
})();
