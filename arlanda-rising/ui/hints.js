'use strict';

// Arlanda Rising — help while playing: Kaj the jackdaw's live hints (a short line when a situation calls for it, at
// most one every HINT_GAP seconds, each at most HINT_REPEAT times — once with Settings: Short, none with Off), and
// the guiding finger of the first missions, pointing at what to tap until the player has done it. Used by game.js
// every frame.

const Hints = (() => {
  const box = document.getElementById('hint'), finger = document.getElementById('finger');
  let since = HINT_GAP - 6, shown = {}, hideAt = 0;

  // the situations: a test of S, and the line (with its params)
  const RULES = [
    { id: 'trayFull', when: () => S.ops && S.ops.tasks.length >= 4, text: () => tr('The tray is filling up! Tap the task with the smallest ring first.') },
    { id: 'duty', when: () => S.mission.st.tasksDuty > 0, text: () => tr('The duty manager did a task — late. Tap tasks before their ring runs out.') },
    { id: 'queue', when: () => S.ops && Passengers.wait() > 12 && S.ops.desksOpen < S.airport.desks, text: () => tr('The check-in queue is {n} minutes. Open another desk in the bar below!', { n: Math.round(Passengers.wait()) }) },
    { id: 'snow', when: () => S.ops && Runways.main() && Runways.main().snow > 2.5 && !Runways.main().plough, text: () => tr('Snow on the runway! Send the ploughs before it reaches 6 mm.') },
    { id: 'dark', when: () => S.ops && Runways.main() && !Runways.main().lit && Calendar.sunElevation(S.day, S.clock + 30) < -6 && !Weather.now().dark, text: () => tr('It will be dark in half an hour. Without lights the runway closes.') },
    { id: 'bigJet', when: () => S.ops && S.ops.tasks.some((k) => k.kind === 'stand' && Flights.get(k.target) && Stands.codeOf(Flights.get(k.target).type) === 'D'), text: () => tr('A DC-8 is coming. Only the big stands, 1 and 2, fit it.') },
    { id: 'crew', when: () => S.plan && !S.plan.pending && Construction.active() < S.plan.crews && S.day - S.plan.day0 > 3 && hasStartable(), text: () => tr('A crew is free. Start the next job in the panel!') },
    { id: 'debt', when: () => S.money < 0, text: () => tr('Money is below zero. A loan helps, but months in debt make the owner angry.') }
  ];
  function hasStartable() {
    for (const id of Object.keys(S.airport.projects)) for (const sid of Object.keys(S.airport.projects[id].stages)) if (!Construction.cannot(id, sid)) return true;
    return false;
  }

  function say(text) {
    box.innerHTML = '<span class="kaj">🐦</span><span>' + Text.esc(text) + '</span>';
    box.hidden = false;
    hideAt = performance.now() + 7000;
  }

  function step(dt) {
    if (performance.now() > hideAt && !box.hidden) box.hidden = true;
    guide();
    const mode = Settings.hints();
    if (mode === 'off' || !S || !S.mission || S.mission.status !== 'running') return;
    since += dt;
    if (since < HINT_GAP) return;
    const max = mode === 'short' ? 1 : HINT_REPEAT;
    for (const r of RULES) {
      if ((shown[r.id] || 0) >= max) continue;
      let ok = false;
      try { ok = r.when(); } catch (e) { ok = false; }
      if (!ok) continue;
      shown[r.id] = (shown[r.id] || 0) + 1;
      since = 0;
      say(r.text());
      return;
    }
  }

  // the finger: on the first task card, or the first Start button of the plan panel, until the player acts twice
  function guide() {
    let target = null;
    if (S && S.mission && S.mission.status === 'running' && GUIDED_MISSIONS.indexOf(S.mission.id) >= 0 && Game.actions < 2 && Screens.current === null && Settings.hints() !== 'off') {
      target = document.querySelector('#decision:not([hidden]) .opt') || document.querySelector('#tray .task') || document.querySelector('#planPanel .startBtn');
    }
    if (!target) { finger.hidden = true; return; }
    const r = target.getBoundingClientRect();
    finger.style.left = (r.left + Math.min(r.width * 0.5, 60)) + 'px';
    finger.style.top = (r.top + r.height * 0.6) + 'px';
    finger.hidden = false;
  }

  return { step, say, reset() { since = HINT_GAP - 6; box.hidden = true; } };
})();
