'use strict';

// Arlanda Rising — a tiny event bus between the logic and what sits on top of it. sim/ emits what happened
// (an aircraft landed, a task appeared, a runway closed for snow, a stage ended…); the sounds, the HUD's
// banners and game.js listen. With no listeners an event does nothing, so the logic runs silent and
// headless (tools/missions-check.js in Node).
const GameEvents = (() => {
  const listeners = {};
  let muted = 0;
  function on(type, fn) { (listeners[type] = listeners[type] || []).push(fn); }
  function emit(type, data) {
    if (muted) return;
    const list = listeners[type];
    if (list) for (const fn of list) fn(data || {});
  }
  // while a stage is fast-forwarded (Skip, Show me, a resumed replay) nothing is heard or shown
  function mute(on) { muted += on ? 1 : -1; if (muted < 0) muted = 0; }
  return { on, emit, mute };
})();
