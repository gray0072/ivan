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
    { id: 'queue', when: () => S.ops && Passengers.wait() > 12 && S.ops.desksOpen < S.airport.desks && (!Passengers.runBy('desks') || People.capacity('checkin') < 1), text: () => tr('The check-in queue is {n} minutes. Open another desk in the bar below!', { n: Math.round(Passengers.wait()) }) },
    { id: 'snow', when: () => S.ops && Runways.main() && Runways.main().snow > 2.5 && !Runways.main().plough, text: () => tr('Snow on the runway! Send the ploughs before it reaches 6 mm.') },
    // the wind falls calm with the noisier direction in use: the choice in the bar below matters to Märsta
    { id: 'calm', when: () => S.ops && Runways.main() && Weather.now().wind < CALM_WIND && calmDir() && calmDir() !== Runways.direction(Runways.main()).slice(0, 2),
      text: () => tr('The wind is calm: you choose the runway direction in the bar below. {dir} is quieter for Märsta now — on 01 the landings come in over the town, on 19 the louder take-offs climb out over it.', { dir: calmDir() }) },
    { id: 'dark', when: () => S.ops && Runways.main() && !Runways.main().lit && Calendar.sunElevation(S.day, S.clock + 30) < -6 && !Weather.now().dark, text: () => tr('It will be dark in half an hour. Without lights the runway closes.') },
    { id: 'bigJet', when: () => S.ops && S.ops.tasks.some((k) => k.kind === 'stand' && Flights.get(k.target) && Stands.codeOf(Flights.get(k.target).type) === 'D'), text: () => tr('A DC-8 is coming. Only the big stands, 1 and 2, fit it.') },
    { id: 'crew', when: () => S.plan && !S.plan.pending && Construction.active() < S.plan.crews && S.day - S.plan.day0 > 3 && hasStartable(), text: () => tr('A crew is free. Start the next job in the panel!') },
    { id: 'debt', when: () => S.money < 0, text: () => tr('Money is below zero. A loan helps, but months in debt make the owner angry.') },
    { id: 'down', when: () => S.ops && Object.keys(S.domains).some((d) => Systems.down(d)), text: () => { const d = Object.keys(S.domains).find((x) => Systems.down(x)); return tr('{sys} is down! Its work goes to the team kept beside it — or to you.', { sys: Text.level(d, S.domains[d]) }); } },
    { id: 'short', when: () => S.ops && Object.keys(S.domains).some((d) => Systems.working(d) === 1 && People.capacity(d) < 0.8 && !People.striking(d)), text: () => tr('A team is short today. Overtime in the bar below brings everybody in — at a price.') },
    { id: 'strike', when: () => S.ops && S.ops.strike, text: () => tr('A strike: the team does only a sixth of its work. The rest is yours today.') },
    { id: 'hire', when: () => S.plan && S.unlock && Object.keys(S.unlock).some((d) => (S.domains[d] || 0) === 0 && S.unlock[d] >= 1) && !(S.people && S.people.hiring.length),
      text: () => (Object.keys(S.unlock).some((d) => (S.domains[d] || 0) === 0 && S.unlock[d] >= 2) ? tr('In the panel you can hire a team, or buy the system straight away: it comes with its own operators.') : tr('You can hire a team in the panel. It needs two weeks before its first shift.')) },
    // session 7: a team runs the desks — it opens them as the queue grows; a head who reads the departures opens them sooner
    { id: 'teamDesks', when: () => S.ops && Passengers.runBy('desks') === 'team' && !Passengers.held('desks') && Passengers.wait() > 4, text: () => tr('{dept} runs the desks: it opens one more as the queue grows. A head who reads the departures opens them sooner — or press + yourself.', { dept: Text.dept('checkin') }) },
    { id: 'fire', when: () => S.ops && S.ops.flights.some((f) => !Flights.over(f) && !f.waiver && AIRCRAFT[f.type].cat > Airport.fireCat()), text: () => tr('An aircraft is coming that your fire service is too small for. It will be sent elsewhere.') },
    { id: 'bags', when: () => S.ops && S.ops.tasks.filter((k) => k.kind === 'bags').length >= 2, text: () => tr('Bags are waiting! Boarding cannot start before the carts have been.') },
    { id: 'announce', when: () => S.ops && S.ops.tasks.some((k) => k.kind === 'announce'), text: () => tr('A flight is late. Tell its passengers — they wait at the gate without knowing why.') },
    // session 4
    { id: 'security', when: () => S.ops && Terminal.lanes() && Passengers.secWait() > 10, text: () => tr('The security queue is {n} minutes. Every minute there is a minute less in the shops — a lane in the bar below helps.', { n: Math.round(Passengers.secWait()) }) },
    { id: 'units', when: () => S.plan && S.airport.units && S.airport.units.some((u) => !u.brand && u.term !== 'kerb'), text: () => tr('Empty shop units earn nothing. Press T to choose real brands for them.') },
    { id: 'leaving', when: () => S.airport.rivals && Object.keys(S.airlines).some((c) => S.airlines[c].mood < LEAVE_MOOD + 5 && Airlines.perDay(c) > 0), text: () => tr('An airline is unhappy and could move flights to a rival airport. Look in Airlines (A).') },
    // session 5
    { id: 'border', when: () => S.ops && Terminal.borderOn() && Passengers.borderWait() > 8, text: () => tr('A long queue at the passport booths. Open another booth with + in the bar below.') },
    { id: 'lanes', when: () => S.ops && Terminal.secDomain() && Passengers.secWait() > 8 && Terminal.lanes() < Terminal.lanesUp() && !Passengers.runBy('lanes'), text: () => tr('Closed lanes save wages, but the queue is growing. Open one more lane.') },
    { id: 'deice', when: () => S.ops && S.ops.tasks.some((k) => k.kind === 'deice'), text: () => tr('Frost on the wings! No aircraft leaves without de-icing. A truck per aircraft — or pads by the runway one day?') },
    { id: 'parallel', when: () => S.ops && Airport.runway('r3') && S.ops.flights.some((f) => f.st === 'taxiOut'), text: () => tr('Two parallel runways: the landings use runway 1, the departures runway 3. The taxi over the bridges takes a few minutes more.') },
    { id: 'permit', when: () => S.plan && Green.on() && Green.permit() && Green.permit().broken, text: () => tr('The permit is broken: a fine every month. Raise the green rating or keep the flights under the cap.') },
    { id: 'green', when: () => S.plan && Green.on() && Green.rating() < 60, text: () => tr('The green rating is low. A solar park, electric vehicles or biofuel raise it — a new car park lowers it.') },
    // session 6
    { id: 'empty', when: () => S.airport.demand !== undefined && S.airport.demand < 0.3 && S.plan && !Terminal.mothballCount(), text: () => tr('The terminals are empty, but they still cost heat, light and people. A terminal can be mothballed.') },
    { id: 'jobsGone', when: () => S.ops && S.people && Object.keys(S.people.depts).some((d) => People.cut(d) > 0.1 && People.jobs(d) > 0), text: () => tr('A team has empty jobs: some of its work comes to your tray. New people need weeks — a clearance takes six.') },
    { id: 'charge', when: () => S.ops && S.ops.tasks.some((k) => k.kind === 'charge'), text: () => tr('An electric aircraft needs charging. The mobile charger takes one at a time — charging stands do it by themselves.') },
    { id: 'outage', when: () => S.ops && Object.keys(S.domains).filter((d) => Systems.down(d)).length >= 3, text: () => tr('Many systems are down at once. Now the teams kept beside them work by hand — the drills decide how well.') },
    { id: 'heat', when: () => S.ops && Turnaround.hot(), text: () => tr('It is hot: the heavy jets must take off from runway 1, the long one.') }
  ];
  function calmDir() { return Runways.noiseAhead().dir; }
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
