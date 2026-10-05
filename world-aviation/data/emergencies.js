'use strict';

// ============================================================
// World Aviation — the emergencies and their quick-reference
// checklists, as plain data: what happens, the steps (each worked
// with a real control), what the crew knows when it is done, and
// what happens when the clock runs out. Run by sim/systems.js,
// shown by ui/hud.js.
// ============================================================

// ---------- Emergencies and their quick-reference checklists (QRH) ----------
// what: what the crew sees when it happens; done: what the crew knows once the checklist is
// worked; esc: what happens if the clock runs out. {e} = the engine number.
// Each step is worked with a real control, and the checklist moves on by itself once it is:
//   'switch'    a switch or a call that is only in the QRH — Enter / the Go button / a tap on it
//   'setAlt'    the autopilot altitude to `value` ft, 'setAltBy' to `value` ft from here (Enter)
//   'idle'      the thrust levers at idle (0, or the throttle slider down)
//   'thrustMax' the thrust at `value` or less, 'thrustMin' at `value` or more (the digit keys)
//   'antiIce'   anti-ice on (K) · 'gearDown' the gear lever down (G) · 'spoiler' the speed brake out (/)
//   'apOff'     the autopilot off (Y) · 'parkBrake' the parking brake set (Space)
//   'climb'     climbing at 500 fpm or more · 'slowVne' slower than Vne + `value` kt
// effect (on a switch): 'bottle' — the fire may need the second bottle; 'relight' — the engine
// may start again; 'freefall' — the gear drops on its own weight.
// why: one line on the reason, shown under the current step with checklist hints.
const EMERGENCIES = [
  {
    id: 'eng_fire', title: 'ENGINE FIRE', weight: 1.0, phase: ['CLIMB', 'CRUISE', 'DESCENT', 'APPROACH'],
    alert: 'continuous', limit: 25, escTitle: 'Engine fire not contained',
    what: 'Fire warning on engine {e}: the bell is ringing and its EGT is climbing.',
    done: 'Fire out. Engine {e} is shut down — set the thrust again and fly on with the other one.',
    esc: 'The fire burns through the nacelle, the engine shuts down and you fly the rest on one engine with a fire warning you cannot clear.',
    penalty: { damage: 0.18, fuel: 0.1 },
    steps: [
      { kind: 'idle', text: 'Thrust levers — IDLE', why: 'Less fuel goes into the burning engine.' },
      { kind: 'switch', text: 'Engine {e} fire handle — PULL', why: 'Cuts the fuel, the hydraulics and the air off from that engine.' },
      { kind: 'switch', effect: 'bottle', text: 'Fire bottle 1 — DISCHARGE', why: 'Floods the engine with extinguishing agent.' }
    ]
  },
  {
    id: 'eng_fail', title: 'ENGINE FAILURE', weight: 1.2, phase: ['CLIMB', 'CRUISE', 'DESCENT'],
    alert: 'continuous', limit: 40, escTitle: 'Engine failure mishandled',
    what: 'Engine {e} has failed: its N1 and EGT are falling and the nose swings towards it.',
    done: 'No relight. Engine {e} is secured — fly on with the other one to the destination.',
    esc: 'You never secured the dead engine. Its windmilling drag cost you height you did not have.',
    penalty: { damage: 0.25 },
    steps: [
      { kind: 'switch', text: 'Engine {e} gauges — CONFIRM the failure', why: 'Make sure it is the failed engine you work on, not the good one.' },
      { kind: 'switch', text: 'Engine {e} fuel — CHECK pumps on, valve open', why: 'A lot of failures are just fuel that stopped flowing.' },
      { kind: 'switch', effect: 'relight', text: 'Engine {e} — RELIGHT (ignition on)', why: 'Turning in the airflow, a failed engine can often be started again.' }
    ]
  },
  {
    id: 'fuel_leak', title: 'FUEL LEAK', weight: 1.1, phase: ['CLIMB', 'CRUISE', 'DESCENT', 'APPROACH'],
    alert: 'continuous', limit: 45, escTitle: 'Fuel leak unchecked',
    what: 'The fuel quantity is dropping faster than the engines burn it — a leak.',
    done: 'Leak isolated. You have less fuel than planned — keep an eye on it.',
    esc: 'The leak drained the tanks while you flew on. You reached the coast with nothing left in reserve.',
    penalty: { fuel: 0.35, damage: 0.05 },
    steps: [
      { kind: 'switch', text: 'Fuel used vs fuel on board — COMPARE', why: 'If the tanks lose more than the engines use, it is a leak, not a thirsty engine.' },
      { kind: 'switch', text: 'Crossfeed — OPEN', why: 'Lets both engines drink from the good tank.' },
      { kind: 'switch', text: 'Fuel pumps, leaking side — OFF', why: 'Stops pumping fuel out through the hole.' }
    ]
  },
  {
    id: 'low_fuel', title: 'FUEL STATE', weight: 0.9, phase: ['CRUISE', 'DESCENT'],
    alert: 'single', limit: 60, escTitle: 'Ran the tanks dry',
    what: 'The fuel on board is below the plan for this point of the flight.',
    done: 'Minimum fuel declared — ATC gives you the shortest way in, with no holding.',
    esc: 'You flew on without telling anyone, were put in a holding, and the engines flamed out with the runway in sight.',
    penalty: { damage: 0.3 },
    steps: [
      { kind: 'switch', text: 'Fuel to destination — CHECK', why: 'Compare what is left with what the rest of the flight needs.' },
      { kind: 'switch', text: '"MINIMUM FUEL" — TELL ATC', why: 'ATC will then not send you round a holding pattern.' }
    ]
  },
  {
    id: 'icing', title: 'ICE ACCRETION', weight: 1.3, phase: ['CLIMB', 'CRUISE'],
    alert: 'single', limit: 50, escTitle: 'Iced beyond recovery',
    what: 'Ice is building on the wings and the engine intakes.',
    done: 'Anti-ice on and leaving the cloud: the ice will shed. Until it does the stall speed is higher.',
    esc: 'Ice kept building on the wings. Lift fell away and the aeroplane stalled in the cloud.',
    penalty: { damage: 0.45 },
    steps: [
      { kind: 'antiIce', text: 'Engine and wing anti-ice — ON', why: 'Hot air from the engines melts the ice off.' },
      { kind: 'setAltBy', value: -2000, text: 'Autopilot ALT — 2 000 ft lower, out of the cloud', why: 'Below the cloud there are no supercooled drops to freeze on the wing.' },
      { kind: 'switch', text: 'Flaps and gear — keep them UP', why: 'Ice changes the shape of the wing — flaps on an iced wing can make it stall.' }
    ]
  },
  {
    id: 'windshear', title: 'WINDSHEAR AHEAD', weight: 1.0, phase: ['APPROACH'],
    alert: 'continuous', limit: 15, escTitle: 'Windshear not escaped',
    what: 'WINDSHEAR — the headwind is about to turn into a tailwind and drain your speed.',
    done: 'Out of the shear. Settle down, then fly the approach again.',
    esc: 'The shear hit you below the glide path. You touched down hard, fast and short of the runway.',
    penalty: { damage: 0.4 },
    steps: [
      { kind: 'apOff', text: 'Autopilot — OFF', why: 'The autopilot would follow the glide path into the ground — fly it yourself.' },
      { kind: 'thrustMin', value: 0.9, text: 'Thrust — FULL', why: 'The speed is about to fall away: you need all the power.' },
      { kind: 'climb', text: 'Pitch up — CLIMB', why: 'Get away from the ground; trade speed for height, but stop at the stall warning.' }
    ]
  },
  {
    id: 'bird', title: 'BIRD STRIKE', weight: 0.8, phase: ['CLIMB', 'CRUISE', 'TAKEOFF', 'APPROACH'],
    alert: 'single', limit: 40, escTitle: 'Struck bird, engine lost',
    what: 'A bang and a shudder: a bird went into engine {e}, and its EGT jumped.',
    done: 'Engine {e} is running rough, but running. Land at the destination and have it inspected.',
    esc: 'You kept full power on the damaged engine. It came apart and had to be shut down.',
    penalty: { damage: 0.3 },
    steps: [
      { kind: 'switch', text: 'Engine {e} gauges — CHECK N1, EGT, vibration', why: 'A damaged engine runs hot and shakes.' },
      { kind: 'thrustMax', value: 0.4, text: 'Thrust — 40 % or less', why: 'Low power keeps a damaged engine alive.' },
      { kind: 'switch', text: 'Bird strike — REPORT to ATC', why: 'The runway gets checked for remains, and the next crew is warned.' }
    ]
  },
  {
    id: 'depress', title: 'CABIN ALTITUDE', weight: 0.7, phase: ['CLIMB', 'CRUISE', 'DESCENT'],
    alert: 'continuous', limit: 30, escTitle: 'Cabin depressurised',
    what: 'The cabin is losing pressure. Up here the air is too thin to stay awake for long.',
    done: 'Masks on, going down to 10 000 ft, where there is air enough to breathe.',
    esc: 'You stayed high with no pressure. By the time you descended, the passengers had been without oxygen for minutes.',
    penalty: { damage: 0.1, penaltyRep: 8 },
    steps: [
      { kind: 'switch', text: 'Oxygen masks — ON, 100 %', why: 'Your own mask first: without oxygen you have about half a minute.' },
      { kind: 'setAlt', value: 10000, text: 'Autopilot ALT 10 000 ft — EMERGENCY DESCENT', why: 'At 10 000 ft there is enough oxygen to breathe without masks.' },
      { kind: 'spoiler', text: 'Speed brake — OUT', why: 'Gets you down much faster.' }
    ]
  },
  {
    id: 'gear', title: 'GEAR WILL NOT EXTEND', weight: 0.9, phase: ['APPROACH'], retractGear: true,
    alert: 'single', limit: 55, escTitle: 'Gear not down',
    what: 'The gear did not come down: no green lights.',
    done: 'Three green: the gear is down and locked.',
    esc: 'The gear hung half extended. You landed with it not locked — and a leg collapsed on the runway.',
    penalty: { damage: 0.5 },
    steps: [
      { kind: 'gearDown', text: 'Gear lever — DOWN', why: 'First make sure it really is selected down.' },
      { kind: 'switch', effect: 'freefall', text: 'Alternate gear extension — PULL the handle', why: 'Unlocks the gear: its own weight and the wind pull it down.' },
      { kind: 'switch', text: 'Three green lights — CHECK', why: 'Each green light means one leg is down and locked.' }
    ]
  },
  {
    id: 'hydraulic', title: 'HYDRAULIC FAILURE', weight: 0.7, phase: ['CLIMB', 'CRUISE', 'DESCENT', 'APPROACH'],
    alert: 'single', limit: 60, escTitle: 'Systems low',
    what: 'Hydraulic pressure is gone: the brakes and the steering are on their backups.',
    done: 'Brakes on the accumulator. Land near the start of the runway — the stop will be long.',
    esc: 'You never armed the backup. On the runway the brakes were almost gone and you could not steer.',
    penalty: { damage: 0.35 },
    steps: [
      { kind: 'switch', text: 'Hydraulic page — FIND the failed system', why: 'Know what still works before you change anything.' },
      { kind: 'switch', text: 'Brake accumulator — ARM', why: 'Stored pressure gives you a few good brake applications on the runway.' },
      { kind: 'switch', text: 'Landing distance — ADD 50 %', why: 'Weak brakes mean a much longer roll.' }
    ]
  },
  {
    id: 'nav', title: 'NAV / COMM FAILURE', weight: 0.6, phase: ['CLIMB', 'CRUISE', 'DESCENT'],
    alert: 'single', limit: 70, escTitle: 'Lost the route',
    what: 'The navigation and the radios have failed: the autopilot has lost the route.',
    done: 'Navigation back: the autopilot is following the route again.',
    esc: 'With no navigation and no radio you drifted off the route and burned fuel finding it again.',
    penalty: { fuel: 0.2 },
    steps: [
      { kind: 'switch', text: 'Heading and time — NOTE them', why: 'With the compass and the clock you know where you are going.' },
      { kind: 'switch', text: 'Radio 2 — SELECT', why: 'Everything important is there twice.' },
      { kind: 'switch', text: 'Navigation computer — RESTART', why: 'Like a phone, most failures go away with a restart.' }
    ]
  },
  {
    id: 'medical', title: 'MEDICAL EMERGENCY', weight: 0.6, phase: ['CLIMB', 'CRUISE', 'DESCENT'],
    alert: 'single', limit: 120, escTitle: 'Passenger critical',
    what: 'The cabin crew call: a passenger has collapsed.',
    done: 'Help is on the way: an ambulance will meet the aeroplane at the gate.',
    esc: 'Nobody organised help in time. The passenger went critical and the diversion cost more than the contract paid.',
    penalty: { penaltyRep: 10, moneyFactor: -0.25 },
    steps: [
      { kind: 'switch', text: 'Cabin crew — first aid, oxygen, ask for a doctor', why: 'There is often a doctor or a nurse among the passengers.' },
      { kind: 'switch', text: 'PAN PAN, medical — TELL ATC', why: 'Gives you priority, and the ambulance is called to the gate.' }
    ]
  },
  {
    id: 'cargoshift', title: 'LOAD SHIFTED', weight: 0.7, phase: ['CLIMB', 'CRUISE', 'DESCENT'], cargoOnly: true,
    alert: 'single', limit: 60, escTitle: 'Load shift unchecked',
    what: 'A thump from the hold: the pallets have moved aft and the nose wants to rise.',
    done: 'Trimmed for the new balance. Fly gently — no steep turns.',
    esc: 'The pallets walked further aft in the turbulence and the damage was done before you trimmed.',
    penalty: { damage: 0.2 },
    steps: [
      { kind: 'switch', text: 'Seat belt signs — ON, slow to turbulence speed', why: 'Less bumping, so the load does not move again.' },
      { kind: 'switch', text: 'Pitch trim — RESET for the new balance', why: 'The centre of gravity moved back; the trim has to follow it.' }
    ]
  },
  {
    id: 'overweight', title: 'OVERWEIGHT / MISLOAD', weight: 0.6, phase: ['TAXI_OUT', 'HOLD_SHORT'], preflight: true,
    alert: 'single', limit: 75, escTitle: 'Rotated overweight',
    what: 'The final load sheet: you are heavier than the maximum take-off weight.',
    done: 'The extra load is off. You are inside the limits — ask for take-off when ready.',
    esc: 'You took off over the maximum weight. The aeroplane used every metre of the runway and only just cleared the fence.',
    penalty: { damage: 0.2 },
    steps: [
      { kind: 'parkBrake', text: 'Parking brake — SET', why: 'Stop and stay stopped while you sort it out.' },
      { kind: 'switch', text: 'Load sheet — CHECK the actual weight', why: 'Find how much too heavy you are.' },
      { kind: 'switch', text: 'Ground — OFFLOAD the extra cargo', why: 'Too heavy means a longer take-off run than the runway has.' }
    ]
  },
  {
    id: 'overspeed', title: 'OVERSPEED', weight: 0.5, phase: ['DESCENT', 'APPROACH'],
    alert: 'continuous', limit: 20, escTitle: 'Exceeded Vne',
    what: 'A gust pushed you past the speed the airframe is built for. It is shaking.',
    done: 'Back inside the limits. Speed brake in when you are slow enough, and write it in the tech log.',
    esc: 'You stayed too fast for too long. The airframe was overstressed and needs a big inspection.',
    penalty: { damage: 0.35 },
    steps: [
      { kind: 'idle', text: 'Thrust levers — IDLE', why: 'Stop adding energy.' },
      { kind: 'spoiler', text: 'Speed brake — OUT', why: 'Drag takes the speed off quickly.' },
      { kind: 'slowVne', value: -15, text: 'Speed — below Vne', why: 'Keep the speed brake out until the needle is back below the red line.' }
    ]
  }
];
