'use strict';

// Lift Logic — a tiny event bus between the logic and what sits on top of it. sim/ emits what happened
// (a lift arrived, a person got on, someone gave up, a block failed…); ui/sounds.js, the view's floating
// words and game.js listen. With no listeners an event does nothing, so the logic runs silent and
// headless (tools/missions-check.js in Node).
const GameEvents = (() => {
  let listeners = {};
  let muted = 0;
  function on(type, fn) { (listeners[type] = listeners[type] || []).push(fn); }
  function emit(type, data) {
    if (muted) return;
    const list = listeners[type];
    if (list) for (const fn of list) fn(data || {});
  }
  // while a run is fast-forwarded (Skip to the end, Show me) nothing is heard or shown
  function mute(on) { muted += on ? 1 : -1; if (muted < 0) muted = 0; }
  return { on, emit, mute };
})();
