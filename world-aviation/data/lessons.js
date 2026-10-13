'use strict';

// ============================================================
// World Aviation — the flight school's lessons (sim/lesson.js runs
// them, ui/coach.js shows their steps in the flight, ui/school.js
// lists them). Three stages, an aircraft each: a light turboprop,
// a medium jet, a heavy jet. Each lesson is one small job with a
// quick success — a taxi, a take-off, a landing — and the last one
// is a whole flight. Plain declarations: the steps' `done` names a
// test in Lesson.DONE, `hi` the controls and the instruments the
// coach lights up while the step is the current one:
//   instruments (ui/instruments.js): asi adi ra alt vsi tc hsi engines
//     cfg:throttle cfg:flaps cfg:gear cfg:brakes cfg:spoiler cfg:ap cfg:antiice cfg:ice cautions
//   the view: arrow (the taxi arrow) taxiSpd (the speed under it) ils (the ILS scales) checklist map
//   the touch controls: btn:<the button's data-act> (btn:brake, btn:stick, btn:throttle)
// A step with `look` only shows something: it moves on after
// SCHOOL.LOOK_S, or as soon as the next step is already done.
// Texts are English, shown through tr(); `textUp` is the text when
// the nose goes up with ↑ (settings.noseUp).
// ============================================================

const SCHOOL_STAGES = [
  { id: 'light', name: 'Light aircraft', aircraft: 'B1900D',
    blurb: 'A small, forgiving turboprop: learn the three basics one at a time — taxi, take off, land.' },
  { id: 'medium', name: 'Medium aircraft', aircraft: 'A320',
    blurb: 'An airliner: the engines, the push back, the autopilot and the ILS.' },
  { id: 'heavy', name: 'Heavy aircraft', aircraft: 'B77W',
    blurb: 'A Boeing 777 from the runway to the stand, with a first officer beside you.' }
];

const LESSONS = [
  // ---------- the light aircraft ----------
  {
    id: 'taxi', stage: 'light', title: 'Taxi', minutes: 2,
    goal: 'Drive the aeroplane on the ground to the runway and stop at the holding point.',
    from: 'KLR', to: 'VBY', start: 'lane',
    learn: ['Parking brake', 'Throttle', 'Steering', 'Wheel brakes', 'Taxi arrow', 'Ground speed'],
    steps: [
      { id: 'brakeOff', text: 'Release the parking brake — <kbd>Space</kbd>',
        why: 'The parking brake holds the aeroplane still. On the panel BRAKES shows PARK while it is set.',
        done: 'parkOff', hi: ['btn:parkBrake', 'cfg:brakes'] },
      { id: 'power', text: 'A little throttle to start rolling — <kbd>1</kbd>–<kbd>3</kbd>',
        why: 'Taxiing needs only a little power. THROTTLE on the panel shows how much; 0 is idle.',
        done: 'rolling', hi: ['btn:throttle', 'cfg:throttle', 'engines'] },
      { id: 'steer', text: 'Follow the yellow arrow — steer with <kbd>←</kbd><kbd>→</kbd>',
        why: 'The arrow lies on the ground and points the way to the runway; the number on it is the distance to go.',
        look: true, hi: ['arrow', 'btn:stick'] },
      { id: 'speed', text: 'Keep the speed under the arrow green',
        why: 'That is your speed over the ground and the limit here. Amber: slow down. Red: far too fast. The airspeed dial shows GND SPEED while you taxi.',
        look: true, hi: ['taxiSpd', 'asi'] },
      { id: 'slow', text: 'Too fast? Throttle to idle <kbd>0</kbd> and hold the brakes <kbd>B</kbd>',
        why: 'The wheel brakes work only while you hold them. Slow down before the turns — the limit drops there.',
        look: true, hi: ['btn:brake', 'cfg:brakes'] },
      { id: 'toHold', text: 'Taxi to the holding point — the arrow ends there',
        why: 'The holding point is the yellow line just before the runway. Never cross it without the tower\'s clearance.',
        done: 'atHold', hi: ['arrow'] },
      { id: 'stop', text: 'Stop: idle <kbd>0</kbd> and hold the brakes <kbd>B</kbd>',
        why: 'A stop is complete when the ground speed reads 0.',
        done: 'stopped', hi: ['btn:brake', 'asi'] },
      { id: 'park', text: 'Set the parking brake — <kbd>Space</kbd>',
        why: 'Now the aeroplane stays where it is while you get ready for the take-off.',
        done: 'parkOn', hi: ['btn:parkBrake', 'cfg:brakes'] }
    ]
  },
  {
    id: 'takeoff', stage: 'light', title: 'Take-off', minutes: 2,
    goal: 'Take off from the runway and climb to 1500 ft over the ground.',
    from: 'KLR', to: 'VBY', start: 'hold', assist: { ground: true, lateral: true },
    learn: ['Flaps', 'Full power', 'Airspeed and Vr', 'Attitude', 'Gear', 'Vertical speed', 'Altimeter'],
    steps: [
      { id: 'flaps', text: 'Take-off flaps — <kbd>F</kbd> to flaps {to}',
        why: 'Flaps make the wing bigger and more curved, so it lifts at a lower speed. FLAPS on the panel shows the notch.',
        done: 'takeoffFlaps', hi: ['btn:flapsDown', 'cfg:flaps'] },
      { id: 'lineup', text: 'Onto the runway: a little throttle, follow the arrow onto the centreline',
        why: 'Lined up, the nose points straight down the white centreline.',
        done: 'linedUp', hi: ['arrow', 'btn:throttle'] },
      { id: 'power', text: 'Full power — <kbd>9</kbd>',
        why: 'Watch the engine gauges: N1 is how fast the engine turns. The instructor keeps you on the centreline.',
        done: 'fullPower', hi: ['btn:throttle', 'engines', 'cfg:throttle'] },
      { id: 'asi', text: 'Watch the airspeed: rotate at Vr {vr} kt',
        why: 'The airspeed dial: the needle and the number in its window. Vr is the speed at which the wing can lift you.',
        done: 'nearVr', hi: ['asi'] },
      { id: 'rotate', text: 'Rotate: pull back gently — <kbd>↓</kbd>', textUp: 'Rotate: nose up gently — <kbd>↑</kbd>',
        why: 'The attitude indicator: the little aeroplane against the horizon. Lift the nose to about 10° and hold it there.',
        done: 'airborne', hi: ['adi', 'btn:stick'] },
      { id: 'gear', text: 'Climbing — gear up <kbd>G</kbd>',
        why: 'The vertical speed (V/S) needle points up: you are climbing. Up, the gear makes less drag.',
        done: 'gearUp', hi: ['vsi', 'btn:gear', 'cfg:gear'] },
      { id: 'flapsUp', text: 'Flaps up — <kbd>V</kbd>',
        why: 'Fast enough, the clean wing lifts you. Flaps left out at a high speed are damaged: a warning sounds.',
        done: 'flapsUp', hi: ['btn:flapsUp', 'cfg:flaps', 'asi'] },
      { id: 'climb', text: 'Climb to 1500 ft over the ground — keep the nose about 10° up',
        why: 'ALT is your height above the sea; RA, in the box under the little aeroplane, the height above the ground.',
        done: 'climbed', hi: ['alt', 'ra', 'adi'] }
    ]
  },
  {
    id: 'landing', stage: 'light', title: 'Landing', minutes: 2,
    goal: 'Land on the runway and slow down below 35 kt.',
    from: 'VBY', to: 'ARN', start: 'final', startNm: 3.2, config: 'landing', noGoAround: true,
    assist: { lateral: true, ground: true },
    learn: ['ILS scales', 'Approach rings', 'PAPI lights', 'Radio altitude', 'The flare', 'Wheel brakes'],
    steps: [
      { id: 'ils', text: 'The autopilot flies the glide path — look at the ILS scales',
        why: 'The little runway shows where the runway is, the triangle where the glide path is; the yellow marks are you. Both in the middle: right on the way down.',
        look: true, hi: ['ils'] },
      { id: 'rings', text: 'The magenta rings hang on the glide path, one every mile',
        why: 'Flying through the rings is flying the ILS. The white marker at their end is the runway\'s start.',
        look: true, hi: [] },
      { id: 'papi', text: 'Left of the runway: four PAPI lights',
        why: 'Two white and two red: on the glide path. More white: too high. More red: too low.',
        look: true, hi: [] },
      { id: 'minimums', text: 'At {floor} ft the autopilot lets go — then the nose is yours',
        why: 'RA counts down the height of the wheels. The instructor keeps the wings level on the centreline; you hold the nose.',
        done: 'apOff', hi: ['ra', 'adi'] },
      { id: 'flare', text: 'At 30 ft: idle <kbd>0</kbd> and raise the nose a little — <kbd>↓</kbd>', textUp: 'At 30 ft: idle <kbd>0</kbd> and raise the nose a little — <kbd>↑</kbd>',
        why: 'That is the flare: it softens the touchdown. Only a little — pull hard and you float, then drop.',
        done: 'touchdown', hi: ['ra', 'btn:throttle', 'btn:stick'] },
      { id: 'brake', text: 'On the ground: hold the brakes <kbd>B</kbd> until below 35 kt',
        why: 'The airspeed dial shows the speed coming down. The instructor keeps you on the centreline.',
        done: 'slowed', hi: ['btn:brake', 'cfg:brakes', 'asi'] }
    ]
  },

  // ---------- the medium aircraft ----------
  {
    id: 'departure', stage: 'medium', title: 'From the gate to the autopilot', minutes: 5,
    goal: 'Push back, start the engines, taxi, take off and engage the autopilot.',
    from: 'ARN', to: 'GOT', start: 'gate',
    learn: ['Push back', 'Engine start', 'N1 and EGT', 'Take-off clearance', 'Autopilot', 'Flaps up', 'Time'],
    steps: [
      { id: 'tug', text: 'Call the tug for the push back — <kbd>Enter</kbd>',
        why: 'An airliner cannot drive backwards: a tug pushes you out of the stand onto the apron.',
        done: 'pushedBack', hi: ['btn:starter'] },
      { id: 'start', text: 'Start the engines — <kbd>Enter</kbd>',
        why: 'You can start them while the tug pushes. A jet\'s engines start one after the other.',
        done: 'starting', hi: ['btn:starter', 'engines'] },
      { id: 'gauges', text: 'Watch the engine gauges: START, then N1 and EGT',
        why: 'N1 is the fan\'s speed, EGT the heat of the exhaust. Both climb and settle at idle: the engine runs.',
        done: 'running', hi: ['engines'] },
      { id: 'brakeOff', text: 'Release the parking brake — <kbd>Space</kbd>',
        why: 'The tug has let go. A jet rolls on idle thrust alone — use the brakes <kbd>B</kbd> to keep the speed down.',
        done: 'taxiing', hi: ['btn:parkBrake', 'cfg:brakes'] },
      { id: 'taxi', text: 'Taxi to the holding point — follow the arrow, keep the speed green',
        why: 'The limit is 40 kt on a straight taxiway, 20 on the apron, less in the turns.',
        done: 'atHold', hi: ['arrow', 'taxiSpd'] },
      { id: 'flaps', text: 'Stop, then take-off flaps — <kbd>F</kbd> to flaps {to}',
        why: 'FLAPS on the panel shows the notch.',
        done: 'takeoffFlaps', hi: ['btn:flapsDown', 'cfg:flaps'] },
      { id: 'clearance', text: 'Ask the tower for the take-off clearance — <kbd>Enter</kbd>',
        why: 'The tower answers with the wind and clears you onto the runway.',
        done: 'cleared', hi: ['btn:starter'] },
      { id: 'lineup', text: 'Line up on the centreline — follow the arrow',
        why: 'Use a little throttle, and steer with the stick.',
        done: 'linedUp', hi: ['arrow'] },
      { id: 'power', text: 'Full power <kbd>9</kbd>, rotate at Vr {vr} kt — pull back <kbd>↓</kbd>', textUp: 'Full power <kbd>9</kbd>, rotate at Vr {vr} kt — nose up <kbd>↑</kbd>',
        why: 'A jet takes longer to speed up than the turboprop. Lift the nose gently to about 10°.',
        done: 'airborne', hi: ['btn:throttle', 'asi', 'adi'] },
      { id: 'gear', text: 'Climbing — gear up <kbd>G</kbd>',
        why: 'GEAR shows UP once the wheels are in.',
        done: 'gearUp', hi: ['btn:gear', 'cfg:gear', 'vsi'] },
      { id: 'ap', text: 'Engage the autopilot — <kbd>Y</kbd>',
        why: 'Above 200 ft it flies the route (NAV) and climbs to the cruise level, the thrust too. AP / TIME on the panel shows it.',
        done: 'apOn', hi: ['btn:ap', 'cfg:ap'] },
      { id: 'flapsUp', text: 'Flaps up step by step as the speed grows — <kbd>V</kbd>',
        why: 'Fast enough, the clean wing lifts you. Flaps out at a high speed are damaged: a warning sounds.',
        done: 'flapsUp', hi: ['btn:flapsUp', 'cfg:flaps', 'asi'] },
      { id: 'heading', text: 'The heading: the strip over the panel, or the map — <kbd>M</kbd>',
        why: 'The strip shows where the nose points and the way to the next waypoint. The map shows your route and the track you flew.',
        look: true, hi: ['hsi', 'btn:map', 'tc'] },
      { id: 'time', text: 'Speed up the time — <kbd>T</kbd> (<kbd>R</kbd> slows it down)',
        why: 'On the autopilot the time runs up to x512: a long flight takes minutes. It slows down by itself near the runway.',
        done: 'timeFast', hi: ['btn:timeFaster', 'cfg:ap'] }
    ]
  },
  {
    id: 'arrival', stage: 'medium', title: 'ILS approach and landing', minutes: 4,
    goal: 'Configure the aeroplane on the autopilot\'s ILS approach, land it by hand and stop.',
    from: 'ARN', to: 'GOT', start: 'final', startNm: 9, config: 'approach', noGoAround: true,
    learn: ['Autopilot on the ILS', 'Flaps step by step', 'Gear down', 'Speed bug', 'Spoiler', 'Brakes'],
    steps: [
      { id: 'apgs', text: 'The autopilot flies the ILS: AP shows G/S',
        why: 'G/S is the glideslope: the autopilot follows the radio beam down to the runway, and the autothrottle slows you down.',
        look: true, hi: ['cfg:ap', 'ils'] },
      { id: 'flaps', text: 'Flaps a notch at a time — <kbd>F</kbd> when the prompt asks',
        why: 'Each notch has a speed limit. The prompt asks for the next one as soon as the speed allows it.',
        done: 'flaps3', hi: ['btn:flapsDown', 'cfg:flaps', 'asi'] },
      { id: 'gear', text: 'Gear down — <kbd>G</kbd>',
        why: 'GEAR turns green and shows DOWN when all the wheels are down and locked.',
        done: 'gearDown', hi: ['btn:gear', 'cfg:gear'] },
      { id: 'flapsFull', text: 'Landing flaps — <kbd>F</kbd> to flaps {full}',
        why: 'Full flaps let you fly slowly, so the landing roll is short.',
        done: 'flapsFull', hi: ['btn:flapsDown', 'cfg:flaps'] },
      { id: 'bug', text: 'The speed to land: Vref {vref} kt, the bug on the airspeed dial',
        why: 'The autothrottle holds it. Time <kbd>T</kbd> runs faster here, and slows down by itself near the runway.',
        look: true, hi: ['asi', 'btn:timeFaster'] },
      { id: 'minimums', text: 'At {floor} ft the autopilot lets go — keep the ILS marks in the middle',
        why: 'Fly small corrections: the little runway left or right, the triangle up or down.',
        done: 'apOff', hi: ['ils', 'ra', 'btn:stick'] },
      { id: 'flare', text: 'At 30 ft: idle <kbd>0</kbd> and raise the nose a little — <kbd>↓</kbd>', textUp: 'At 30 ft: idle <kbd>0</kbd> and raise the nose a little — <kbd>↑</kbd>',
        why: 'The voice counts the height down: 50, 40, 30, 20, 10.',
        done: 'touchdown', hi: ['ra', 'btn:throttle', 'btn:stick'] },
      { id: 'spoiler', text: 'Spoiler out — <kbd>/</kbd>',
        why: 'On the ground the spoiler dumps the lift and puts the weight on the wheels: the brakes bite harder.',
        done: 'spoilerOut', hi: ['btn:spoiler', 'cfg:spoiler'] },
      { id: 'brake', text: 'Hold the brakes <kbd>B</kbd> until below 35 kt',
        why: 'Keep straight on the centreline with the stick.',
        done: 'slowed', hi: ['btn:brake', 'cfg:brakes', 'asi'] }
    ]
  },

  // ---------- the heavy aircraft ----------
  {
    id: 'flight', stage: 'heavy', title: 'A whole flight', minutes: 8,
    goal: 'Fly a Boeing 777 from the runway at Arlanda to the stand at Landvetter.',
    from: 'ARN', to: 'GOT', start: 'hold', copilot: true, icing: true,
    learn: ['A heavy take-off', 'The map', 'Time on the autopilot', 'A checklist', 'Anti-ice', 'A heavy landing', 'The first officer', 'Parking'],
    steps: [
      { id: 'flaps', text: 'Take-off flaps — <kbd>F</kbd> to flaps {to}',
        why: 'The tower has cleared you already: the short start at the runway.',
        done: 'takeoffFlaps', hi: ['btn:flapsDown', 'cfg:flaps'] },
      { id: 'lineup', text: 'Line up on the centreline — follow the arrow',
        why: 'A heavy turns slowly: start the turn early, a little throttle.',
        done: 'linedUp', hi: ['arrow', 'btn:throttle'] },
      { id: 'power', text: 'Full power — <kbd>9</kbd>',
        why: 'The big engines spool up slowly: watch N1 climb. A heavy needs a long run.',
        done: 'fullPower', hi: ['btn:throttle', 'engines'] },
      { id: 'rotate', text: 'At Vr {vr} kt rotate gently — <kbd>↓</kbd>', textUp: 'At Vr {vr} kt rotate gently — <kbd>↑</kbd>',
        why: 'A long body: lift the nose slowly, or the tail touches the runway.',
        done: 'airborne', hi: ['asi', 'adi', 'btn:stick'] },
      { id: 'gear', text: 'Climbing — gear up <kbd>G</kbd>', why: '',
        done: 'gearUp', hi: ['btn:gear', 'cfg:gear'] },
      { id: 'ap', text: 'Autopilot — <kbd>Y</kbd>', why: 'It flies the route to Gothenburg.',
        done: 'apOn', hi: ['btn:ap', 'cfg:ap'] },
      { id: 'flapsUp', text: 'Flaps up step by step — <kbd>V</kbd>', why: 'Watch the speed grow on the airspeed dial.',
        done: 'flapsUp', hi: ['btn:flapsUp', 'cfg:flaps', 'asi'] },
      { id: 'map', text: 'The moving map — <kbd>M</kbd>',
        why: 'Your route (dashed), the track you flew and the runway at the end with its approach.',
        look: true, hi: ['btn:map', 'map'] },
      { id: 'time', text: 'Speed up the time — <kbd>T</kbd>, a few times',
        why: 'On the autopilot up to x512. Something to deal with brings it back to x1 by itself.',
        done: 'timeFaster', hi: ['btn:timeFaster', 'cfg:ap'] },
      { id: 'ice', text: 'A checklist! Work the lit step: anti-ice <kbd>K</kbd>, then <kbd>Enter</kbd> for each switch',
        why: 'Ice on the wings: the ICE line climbs. The checklist lists what to do in order, the control for each step on its right; the clock is running.',
        done: 'iceDealt', hi: ['checklist', 'btn:antiIce', 'cfg:antiice', 'cfg:ice'] },
      { id: 'descent', text: 'The autopilot descends by itself and slows down — time <kbd>T</kbd> again',
        why: 'At the top of descent it comes down; near the runway the time slows down to x1 by itself.',
        done: 'approach', hi: ['vsi', 'alt', 'btn:timeFaster'] },
      { id: 'config', text: 'Flaps as the prompt asks <kbd>F</kbd>, gear down <kbd>G</kbd>',
        why: 'Each flap notch once the speed allows it; the gear about 8 miles out.',
        done: 'landingConfig', hi: ['btn:flapsDown', 'btn:gear', 'cfg:flaps', 'cfg:gear'] },
      { id: 'minimums', text: 'At {floor} ft the autopilot lets go — keep the ILS marks in the middle',
        why: 'A heavy reacts slowly: small, early corrections.',
        done: 'apOff', hi: ['ils', 'ra'] },
      { id: 'flare', text: 'At 40 ft: idle <kbd>0</kbd>, raise the nose a little — <kbd>↓</kbd>', textUp: 'At 40 ft: idle <kbd>0</kbd>, raise the nose a little — <kbd>↑</kbd>',
        why: 'A heavy sinks fast: start the flare a little higher than in the small one.',
        done: 'touchdown', hi: ['ra', 'btn:throttle', 'btn:stick'] },
      { id: 'rollout', text: 'Spoiler <kbd>/</kbd> and brakes <kbd>B</kbd> — slow below 35 kt',
        why: 'Then leave the runway.',
        done: 'slowed', hi: ['btn:spoiler', 'btn:brake', 'cfg:spoiler'] },
      { id: 'copilot', text: 'Let the first officer taxi — <kbd>Enter</kbd>',
        why: 'The first officer drives to the stand with the time at x4 and hands back just before it. <kbd>Enter</kbd> takes the controls back.',
        done: 'copilotOn', hi: ['btn:starter'] },
      { id: 'park', text: 'Your controls: straight on, stop on the stop bar, parking brake <kbd>Space</kbd>',
        why: 'Stop in the parking box at your stand: the prompt counts the metres down.',
        done: 'parked', hi: ['btn:parkBrake', 'btn:brake', 'cfg:brakes'] }
    ]
  }
];
