'use strict';

// Lift Logic — the run's events turned into sounds: the arrival chime (once going up, twice going down), the
// doors, the motor's hum, a button's click, the "+1" of an arrival, a grumble when someone gives up, the
// overload buzzer, an error. At ×4 and faster only the chimes play; while a run is fast-forwarded the
// events are muted at the source (core/events.js). The music's tempo follows the rush.

(function () {
  const quiet = () => Runner.speed >= 4;
  const on = (type, fn) => GameEvents.on(type, (e) => { if (run && !run.preview) fn(e); });
  on('arrive', (e) => { if (Runner.speed <= 16) Sfx.chime(Lift.arrow(e.lift) === 'down'); });
  on('doorsClosing', () => { if (!quiet()) Sfx.doors(); });
  on('buttonInside', () => { if (!quiet()) Sfx.click(); });
  on('callPressed', () => { if (!quiet()) Sfx.click(); });
  on('delivered', () => { if (!quiet()) Sfx.plusOne(); });
  on('gaveUp', () => { if (!quiet()) Sfx.grumble(); });
  on('tooHeavy', () => { if (!quiet()) Sfx.buzzer(); });
  on('blockError', (e) => { if (!quiet() && !e.flash) Sfx.error(); });
  on('runStart', () => Sfx.start());
  on('runStop', () => { Sfx.stop(); Hum.set(0); });
  on('runEnd', () => Hum.set(0));
})();

// every frame: the hum of the followed lift and the music's tempo (faster in a rush or when someone is
// about to give up)
function soundFrame() {
  if (!audioCtx) return;
  if (!run || run.preview || Runner.state !== 'running' || Runner.speed >= 4) { Hum.set(0); Music.setTempo(1); return; }
  const L = run.lifts[View.st.follow - 1] || run.lifts[0];
  Hum.set(Math.abs(L.v));
  let waiting = 0, angry = false;
  for (const q of run.queues) { waiting += q.length; for (const p of q) if (p.mood >= 3) angry = true; }
  Music.setTempo(angry ? 1.18 : waiting >= 8 ? 1.1 : 1);
}
