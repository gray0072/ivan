'use strict';

// Auto graphics: a starting preset guessed from the device (TVs and weak devices start low), then lowered — or
// raised back, never above the guess — by the frame rate measured while playing. A level that turned out too slow
// isn't retried in the same session. The learned level is remembered per device (AUTO_GFX_KEY).
function createAutoGraphics(onChange) {
  const TV_UA = /Web0S|webOS|NetCast|SmartTV|SMART-TV|Tizen|HbbTV|BRAVIA|AFT[A-Z]|CrKey|Android TV|GoogleTV/i;
  const last = GRAPHICS_ORDER.length - 1;

  // index into GRAPHICS_ORDER (0 = best) of the best preset this device is allowed to reach
  function detectCeiling() {
    const nav = navigator;
    if (TV_UA.test(nav.userAgent || '')) return GRAPHICS_ORDER.indexOf('low');
    if ((nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2)) return GRAPHICS_ORDER.indexOf('low');
    if (matchMedia('(pointer: coarse)').matches) return GRAPHICS_ORDER.indexOf('medium');
    return 0;
  }

  const ceiling = detectCeiling();
  let level = ceiling;
  try {
    const saved = GRAPHICS_ORDER.indexOf(localStorage.getItem(AUTO_GFX_KEY));
    if (saved > level) level = saved;
  } catch (err) { /* storage blocked */ }

  let tooSlow = last + 1;  // best level that was too slow in this session
  let time = 0, frames = 0, upChecks = 0, warmup = AUTO_GFX_WARMUP;

  function set(i) {
    level = i;
    upChecks = 0;
    warmup = AUTO_GFX_WARMUP;
    try { localStorage.setItem(AUTO_GFX_KEY, GRAPHICS_ORDER[level]); } catch (err) { /* storage blocked */ }
    onChange(GRAPHICS_ORDER[level]);
  }

  // Start measuring afresh (a run starts or resumes): the first frames are skipped
  function reset() {
    time = 0;
    frames = 0;
    warmup = AUTO_GFX_WARMUP;
  }

  // One drawn play frame; dt = real seconds since the previous drawn frame
  function frame(dt) {
    if (dt > 0.25) return;  // a hitch or a hidden tab, not the steady frame rate
    if (warmup > 0) { warmup -= dt; return; }
    time += dt;
    frames++;
    if (time < AUTO_GFX_WINDOW) return;
    const fps = frames / time;
    time = 0;
    frames = 0;
    if (fps < AUTO_GFX_LOW_FPS && level < last) {
      tooSlow = Math.min(tooSlow, level);
      set(level + 1);
    } else if (fps > AUTO_GFX_HIGH_FPS && level > ceiling && level - 1 > tooSlow) {
      if (++upChecks >= AUTO_GFX_UP_WINDOWS) set(level - 1);
    } else {
      upChecks = 0;
    }
  }

  return { reset, frame, get key() { return GRAPHICS_ORDER[level]; } };
}
