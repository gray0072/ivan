'use strict';

// A tiny event bus between the logic and what sits on top of it. sim/ and the flow emit what happened
// (a splash, a meal, a sting, a stage-up…); ui/sounds.js and game.js listen and play sounds or show messages.
// With no listeners an event does nothing, so the logic runs silent and headless (e.g. in Node).
const GameEvents = (() => {
  const listeners = {};
  function on(type, fn) { (listeners[type] = listeners[type] || []).push(fn); }
  function emit(type, data) {
    const list = listeners[type];
    if (list) for (const fn of list) fn(data || {});
  }
  return { on, emit };
})();
