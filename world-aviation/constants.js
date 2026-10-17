'use strict';

// ============================================================
// World Aviation — game tuning constants
// All gameplay numbers live here: world geometry, aircraft
// performance, weather, difficulty tables, emergency
// quick-reference checklists, training courses, contract rates.
// Units: metres, m/s, knots (kt), kilograms, seconds, SEK.
// ============================================================

// ---------- The pilot and the home base ----------
// You are a young Swedish pilot with a fresh commercial licence (EASA CPL), based at Stockholm
// Arlanda. Every contract is flown out of, or back to, your home base.
const CAREER = {
  HOME_BASE: 'ARN',
  PILOT_COUNTRY: 'Sweden',
  PILOT_CITY: 'Stockholm',
  INTRO: 'You are a young Swedish pilot with a fresh commercial licence, based at Stockholm Arlanda with one leased turboprop. Start with Sweden, win Scandinavia, then buy the traffic rights to the rest of the world, one region at a time — and earn the instrument rating, the ATPL and a captain\'s four stripes on the way.'
};

// The pilot's licence and rank, one after the other (Career.rankIndex): each asks for everything
// the one before it did, and for its `courses` passed (by id), `flights` flown in all and
// `passed` courses passed in all (`all`: every course). `stripes`: the gold stripes on the
// sleeve, `star`: the senior captain's star above them.
const PILOT_RANKS = [
  { id: 'cpl', licence: 'EASA CPL', title: 'Commercial pilot', stripes: 1 },
  { id: 'cplir', licence: 'EASA CPL/IR', title: 'Instrument-rated pilot', stripes: 2, courses: ['pax2'] },
  { id: 'atpl', licence: 'EASA ATPL', title: 'Airline transport pilot', stripes: 3, courses: ['gen4'], flights: 30 },
  { id: 'captain', licence: 'EASA ATPL', title: 'Captain', stripes: 4, flights: 50, passed: 12 },
  { id: 'senior', licence: 'EASA ATPL', title: 'Senior captain', stripes: 4, star: true, all: true }
];

// Money is in Swedish kronor.
const CURRENCY = { code: 'SEK', symbol: 'kr', name: 'Swedish krona', locale: 'sv-SE' };

// ---------- World geometry ----------
const WORLD = {
  SCALE: 1,                    // game metres per real metre: the world at its real size
  SEA_LEVEL: 0,
  // every flight builds the terrain of its own part of the world (see Theatre in utils.js)
  MARGIN_KM: 500,              // real km of world around the route
  MIN_SPAN_KM: 1400,           // the smallest terrain area, real km
  CELL_MIN_KM: 5, CELL_MAX_KM: 18,   // real km between elevation samples (finer on short routes)
  CELLS_ACROSS: 300            // aim for about this many samples across the longer side

};

// ---------- Simulation ----------
const SIM = {
  FIXED_DT: 1 / 60,            // physics step, seconds
  MAX_FRAME_DT: 0.25,          // never simulate more than this per frame
  GRAVITY: 9.80665,
  RHO_SL: 1.225,               // sea level air density, kg/m^3
  TIME_ACCEL_STEPS: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512],   // T one step faster, R one step slower
  TIME_ACCEL_CHEAT: 1024,      // the Alt+6 cheat (on the autopilot, where x512 is allowed)
  TIME_ACCEL_MIN_ALT_M: 150,   // time acceleration only above this height AGL
  WARN_REPEAT_S: 3,            // the same warning is given again at most this often (real seconds)
  TIME_ACCEL_AP_MAX: 512,      // with the autopilot engaged: up to x512 at any height and in any phase
  TIME_ACCEL_X1_NM: 2.7,       // closing on the arrival the time is back at x1 this far out (5 km) ...
  TIME_ACCEL_SLOWDOWN_S: 3,    // ... slowing one step every this many real seconds (the same before the top of descent)
  // From x256 a steady cruise is extrapolated (Flight.coast): the physics flies only
  // COAST_PHYS_ACCEL times the real time each frame (the autopilot and the attitude stay alive),
  // the rest is dead reckoning in COAST_STEP_S steps: the height and the airspeed held, the heading
  // turned to the NAV heading at most COAST_TURN_DEG_S, the wind of each point, the fuel at the
  // present flow. Steady means: CRUISE on the autopilot's NAV, no checklist, no speed brake, the
  // terrain not holding the autopilot up, and within these of the level, the wings level, the
  // heading and the speed the autopilot wants
  TIME_ACCEL_COAST_FROM: 256,
  COAST_PHYS_ACCEL: 32,
  COAST_STEP_S: 1,
  COAST_TURN_DEG_S: 1,
  COAST_MAX_VS_MS: 2.5, COAST_MAX_ALT_ERR_M: 60, COAST_MAX_BANK_DEG: 4, COAST_MAX_HDG_ERR_DEG: 3, COAST_MAX_SPD_ERR_KT: 10,
  // the turbulence fades out above this time acceleration (as 1 / the acceleration): many seconds
  // of gusts a frame only made the picture and the autopilot shake
  TURB_FULL_ACCEL: 8,
  TIME_ACCEL_MIN_COS: 0.2,     // the distance for that is divided by the cosine of the angle off the runway, at most x5
  TIME_ACCEL_RESUME_S: 0.5,    // after an emergency the time climbs back one step every this many real seconds
  TIME_ACCEL_STEPDOWN_S: 0.25, // an emergency or stricter limits bring the time down one step every this many real seconds
  CABIN_ON_TIME_MIN: 3,        // the arrival announcement: within this many minutes of the plan is on schedule
  // flying by hand: the fastest step allowed above each height AGL (feet)
  TIME_ACCEL_MANUAL: [{ aglFt: 1000, max: 2 }, { aglFt: 3000, max: 4 }, { aglFt: 6000, max: 8 },
    { aglFt: 8000, max: 16 }, { aglFt: 9000, max: 32 }, { aglFt: 10000, max: 64 }],
  TAXI_OVERSPEED_FINE: 0.03,   // a taxi overspeed (in the red for TAXI.FINE_HOLD_S) costs this share of the contract's pay
  NO_CLEARANCE_FINE: 0.05,     // lifting off before the take-off clearance costs this share of the contract pay
  MAX_STEPS_PER_FRAME: 300,    // physics steps per rendered frame at most (x128 at 25 fps)
  CRUISE_ALT_MIN: 2500,
  CRUISE_ALT_MAX: 11300,
  FUEL_BURN_TAXI_PER_ENGINE: 22,  // kg/h per engine while taxiing
  GEAR_TRANSIT_S: 6,
  FLAP_TRANSIT_S: 2.5,         // seconds per flap notch
  BRAKE_RAMP_S: 0.35,          // seconds for the wheel brakes to reach full pressure
  NOSEWHEEL_MAX_STEER_DEG: 60,  // the nosewheel's lock at walking pace, less and less with the speed (Flight.steerMax) ...
  NOSEWHEEL_FADE_MS: 26,       // ... none left at this speed: the lock times (1 - v / this)², at least NOSEWHEEL_MIN_SHARE
  NOSEWHEEL_MIN_SHARE: 0.04,
  NOSEWHEEL_STEER_RATE_DEG: 22, // degrees per second the hydraulic nosewheel steering turns at
  GROUND_YAW_ACCEL: 0.9,       // rad/s² at most: how fast the turn rate on the ground builds up (the aeroplane's inertia)
  ENGINE_IDLE_N1: 0.22,        // N1 at idle, thrust scales from here to 100 %
  PUSHBACK_S: 20,              // how long the tug takes: straight back out of the stand, then round onto the apron lane
  PUSHBACK_R_SHARE: 0.6,       // the radius of the push back's turn onto the lane, times the aeroplane's length ...
  PUSHBACK_R_MIN_M: 10,        // ... at least this
  PUSHBACK_R_MAX_M: 40,        // ... and at most this (metres)
  CRASH_BANK_DEG: 25,          // a wing on the ground at more bank than this is a crash
  SPOILER_BRAKE_GAIN: 0.35,    // the spoiler out on the ground: the wheel brakes this much stronger
  FLARE_TRIM_HOLD_M: 150,      // by hand on the approach below this height (AGL) the pitch trim stays put
  RADIO_ALT_MAX_FT: 2500,      // the radio altitude (height above the ground) shows in the attitude indicator below this
  // ... and turns amber below this on the way down to land; the autopilot lets go of the glide
  // path here and engages only above it (by keys and on the touch buttons alike)
  DECISION_HEIGHT_FT: 200,
  CRASH_PITCH_DEG: -6,         // nose-first ground contact below this pitch is a crash
  AIRPORT_RADIUS_M: 2200,      // ground contact further than this from a runway is off-airport
  PARK_RADIUS_M: 18,           // the parking box at the gate
  PARK_ALIGN_DEG: 20,
  STALL_AOA_DEG: 16.5,         // critical angle of attack
  STALL_WARN_AOA_DEG: 14.0,
  TOUCHDOWN_HARD_FPM: 600,     // firm landing
  TOUCHDOWN_BREAK_FPM: 1000,   // gear collapse
  ROLL_RATE_MAX: 55 * Math.PI / 180,
  PITCH_RATE_MAX: 11 * Math.PI / 180,
  YAW_RATE_MAX: 8 * Math.PI / 180,
  GLIDESLOPE_DEG: 3,
  DESCENT_START_NM: 45,        // top of descent, nm from the arrival (at least: 3 nm per 1 000 ft to lose)
  DESCENT_NM_PER_KFT: 3.2,     // the descent profile: nm flown per 1 000 ft lost ...
  DESCENT_END_NM: 12,          // ... down to 2 500 ft over the arrival this far out
  APPROACH_NM: 19,             // the approach phase starts on the localiser inside this distance
  EMERGENCY_ALT_HOLD_S: 120,   // an altitude a checklist chose is held this long (flight time) after the emergency is over
  GLIDE_AID_NM: 20,            // the dotted glide path shows inside this distance (to the threshold over the cosine of
                               // the angle between the track and the way to it, Flight.accelDistNm: flown past or away
                               // from the airport it is further), fading in over the last GLIDE_AID_FADE_NM of it ...
  GLIDE_AID_FADE_NM: 5,
  ILS_AID_NM: 23,              // ... and the ILS scales on the descent inside this one (on the approach, always)
  FLAPS_PROMPT_NM: 15,         // on the approach the prompt asks for the flaps from here (whenever the next step fits the speed) ...
  GEAR_PROMPT_NM: 8,           // ... and for the gear from here
  GEAR_UP_WARN_FT: 1500,       // the gear still down in the climb or the cruise this high over the ground: a warning until it is up
  LOC_TIME_S: 22,              // the localiser closes a cross-track error with this time constant
  LOC_TURN_MARGIN: 1.25,       // the localiser intercept plans its turn on this many times the autopilot's turn radius
  AP_ROLL_IN_S: 3,             // ... after this long rolling into the bank (for a roll rate of AP_ROLL_IN_REF; slower types take longer)
  AP_ROLL_IN_REF: 0.85,
  LOC_MIN_EST_NM: 5,           // the localiser is captured only where the turn onto it ends at least this far out
  AP_BANK_DEG: 25,             // the autopilot's bank in a turn
  // The autopilot's climb: the type's climbRate low down, less and less higher up, as a real
  // aeroplane's engines have less to spare: the rate falls in a straight line to nothing at
  // AP_CEILING_RATIO × the type's cruise level (an ATR 72: 1 280 fpm at the ground, 500 fpm at
  // 20 000 ft, 24 min to get there), never below AP_CLIMB_MIN_SHARE of it
  AP_CEILING_RATIO: 1.5,
  AP_CLIMB_MIN_SHARE: 0.25,
  AP_DESCENT_SPEED_GAIN: 0.6,  // m/s less descent per kt over the speed target (an idle descent pitches for speed)
  AP_SLOW_BELOW_FT: 10000,     // below this height over the arrival the descent speed is at most AP_SLOW_KT
  AP_SLOW_KT: 250,
  AP_IDLE_DESCENT_M: 100,      // more than this above the selected altitude the autopilot descends at idle thrust
  AP_SPEEDBRAKE_HIGH_FT: 500,  // the autopilot puts the speed brake out this far above the descent profile while still fast
  GS_CAPTURE_ABOVE_DEG: 0.35,  // the glideslope is captured from below, or from at most this far above it
  FINAL_FIX_NM: 10,            // the autopilot NAV mode joins the extended centreline here
  MSA_LOOKAHEAD_M: 20000,      // the autopilot keeps clear of the terrain this far ahead
  MSA_MARGIN_M: 300,           // by this much (1 000 ft: the obstacle clearance of a real minimum safe altitude)
  GPWS_LOOKAHEAD_S: 25,        // TERRAIN — PULL UP when the ground this many seconds ahead is too close
  ROLLOUT_EXIT_KT: 35,         // below this the landing roll becomes the taxi-in
  // the guidance arrow on the ground (sim/guidance.js)
  LINEUP_ACROSS_M: 6,          // lined up: this close to the runway centreline ...
  LINEUP_HDG_DEG: 10,          // ... and within this of the runway heading
  REROUTE_DEVIATION_M: 25,     // this far off the taxi route with it behind you: a missed turn, a new route from here
  EXIT_DECEL_MS2: 1.5,         // braking assumed to slow down to an exit's turn-off speed before its curve ...
  EXIT_CUT: 0.5,               // ... of which this share may be cut (begun that much later)
  EXIT_MIN_LEAD_M: 30,         // an exit whose curve (so cut) begins nearer than this ahead is never the one to take
  EXIT_COMMIT_DEG: 20,         // turned this far off the runway heading: you are taking this exit, it stays
  EXIT_ON_M: 20,               // off the runway this near another exit's line, ...
  EXIT_ON_DEG: 45              // ... headed within this of it: you took that one, the route starts from it
};

// The cabin's reaction to the landing (Flight.cabinMood, core/crowd.js), with passengers on board:
// by the sink rate at the graded touchdown, fpm — an ovation, applause, a few claps, the bins
// rattling (firm), an "ooh" and the galley (rough, up to SIM.TOUCHDOWN_HARD_FPM), a gasp and a
// crying baby (hard); a bank past BANK_DEG makes it one worse, a touchdown off the paved
// surface hard; a bounce within BOUNCE_S seconds of the graded touchdown gets a "whoa"
const CABIN_REACTION = { OVATION_FPM: 100, APPLAUSE_FPM: 200, POLITE_FPM: 320, FIRM_FPM: 450, BANK_DEG: 5, BOUNCE_S: 6 };

// The comic lines in the debrief after a successful flight (ui/landingjoke.js, the lines in
// data/landingjokes.js). The touchdown's line: each trait of the graded touchdown is measured
// against its threshold — the sink rate against HARD_FPM, the bank against BANK_DEG, the distance
// off the centreline against OFFSET_M (the runway's half width is 23 m), the distance from the
// threshold against LONG_SHARE of the runway's length but at least LONG_MIN_M; a bounce
// (Flight.landed.bounced) counts as BOUNCE_K times its threshold. The trait furthest past its
// threshold picks the line; none past it — a butter landing at BUTTER_FPM or softer, else a good
// one. The flight's line: the first of its moments that happened — a go-around, GRASS_M or more
// rolled on the grass, a taxi overspeed, an emergency handled, less than LOW_FUEL_SHARE of the
// tanks left, a crosswind of XWIND_KT or more at the arrival, snow, the night, EARLY_MIN ahead of
// or LATE_MIN behind the planned flight time (off the ground to on it); none — no second line.
// Never after a lost flight or a practice landing.
const LANDING_JOKE = {
  BUTTER_FPM: CABIN_REACTION.OVATION_FPM,  // fpm: a touchdown the cabin gives an ovation
  GRASS_M: 25,                         // metres on the grass
  LOW_FUEL_SHARE: 0.08,                // of the tanks' capacity left at the stand
  XWIND_KT: 15,                        // kt of crosswind at the arrival's runway
  EARLY_MIN: 10,                       // minutes ahead of the planned flight time
  LATE_MIN: 15,                        // minutes behind it
  HARD_FPM: CABIN_REACTION.FIRM_FPM,   // fpm: past "firm", where the bins rattle
  BOUNCE_K: 1.5,
  BANK_DEG: CABIN_REACTION.BANK_DEG,   // degrees of bank, where the cabin takes it one worse
  OFFSET_M: 9,                         // metres off the centreline
  LONG_SHARE: 0.35,                    // of the runway's length ...
  LONG_MIN_M: 600                      // ... but at least this many metres from the threshold
};

// ---------- Taxiing ----------
// The taxi speed limits (sim/taxilimit.js), by the ground speed: on a straight taxiway, on the
// apron lane, on a stand's lead-in, and in a turn of the taxi route by the radius of its curve
// (the turn off the runway too: 35 kt off a rapid exit, 20 kt off the last one; 15 kt into a
// lane). Before a slower stretch the limit comes down along a gentle braking (DECEL_MS2), so it
// never drops by a step under the wheels. Over the limit the speed shows amber, over RED_OVER
// times it red; in the red for FINE_HOLD_S, off the runway, is a taxi overspeed — reported, and
// fined on the debrief (SIM.TAXI_OVERSPEED_FINE).
// The taxi routes (World.findRoute) are the quickest at these limits, every turn costing time.
const TAXI = {
  STRAIGHT_KT: 40,
  APRON_KT: 20,                // the apron lane in front of the stands
  STAND_KT: 10,                // a stand's lead-in, on to the stop bar
  TURN_LAT_MS2: 1.4,           // a turn's limit: the speed at this sideways acceleration on its curve's radius ...
  TURN_MIN_KT: 10,             // ... in 5 kt steps, at least this
  TURN_MIN_DEG: 30,            // a corner of the route turning more than this is a turn ...
  TURN_PAD_M: 10,              // ... from this far before its curve to this far after it
  REVERSE_GAP_M: 30,           // a turn the other way round this close after another (their curves and pads): a reverse (sim/copilot.js)
  DECEL_MS2: 0.8,
  RED_OVER: 1.25,
  FINE_HOLD_S: 2,              // seconds in the red that make a taxi overspeed
  ROUTE_TURN_S: 20,            // a taxi route's turn costs this many seconds for a right angle (by the square
                               // of the angle: a gentle one little) ...
  ROUTE_SHARP_K: 3,            // ... one sharper than a right angle (turning back) this many times more ...
  ROUTE_MAX_TURN_DEG: 160      // ... and a sharper one than this is never taken
};

// The ILS on a computer (Game.drawIls): the sizes it may take in the bottom right corner of the
// view, the first that fits under the checklist and the map — [the symbols' scale, with the
// labels and the words]; where none fits, it is not shown
const ILS_DESKTOP_SIZES = [[1, true], [0.9, true], [0.8, true], [1, false], [0.85, false], [0.7, false], [0.55, false], [0.45, false]];

// The first officer taxis in after the landing (sim/copilot.js), once the pilot has flown
// FLIGHTS flights in the type: Enter hands over, the time may run up to TIME_ACCEL, and the first
// officer stops on the stand's lead-in once the turn into it is behind and gives the controls back.
const COPILOT = {
  FLIGHTS: 2,
  TIME_ACCEL: 4,
  AFTER_TURN_M: 8,             // stops this far past the end of the turn into the stand ...
  AFTER_TURN_LEN: 0.25,        // ... and this share of the aeroplane's length more ...
  PARK_LEFT_M: 25,             // ... but at least this far short of the stand
  MIN_RUN_M: 40,               // Enter hands over only with at least this far to taxi before that
  SPEED_SHARE: 0.85,           // taxis at this share of the limit ...
  DECEL_MS2: 0.55,             // ... slowing down for a slower stretch earlier than TAXI.DECEL_MS2 asks
  MAX_THROTTLE: 0.6,
  STEER_SHARE: 0.8,            // takes a turn no faster than this share of the nosewheel's lock holds its curve ...
  REVERSE_STEER_SHARE: 0.5,    // ... this share in a turn the other way round just after another (TAXI.REVERSE_GAP_M) ...
  MIN_TURN_MS: 2,              // ... but at least this fast (m/s)
  LOOK_WB: 0.7,                // steers for the taxi line this many wheelbases ahead ...
  LOOK_S: 1.5,                 // ... plus this many seconds of the speed ...
  LOOK_MIN_M: 15,              // ... at least this far (and no further than the arrow's point)
  THROTTLE_P: 0.08,            // the throttle per m/s short of the speed wanted ...
  THROTTLE_I: 0.04,            // ... and its integral (per m/s·s): a heavy aeroplane needs more to get rolling
  BRAKE_FROM_MS: 0.3,          // the brakes from this much too fast (idle thrust alone rolls a light type on) ...
  BRAKE_P: 0.3,                // ... and more by this per m/s
  TAKEOVER_INPUT: 0.5          // the stick or the brakes past this: the pilot takes the controls back
};

// The FOLLOW ME car on a first visit to an airport (render/followme3d.js): it waits on the
// taxiway past the runway exit and drives ahead of the aeroplane along the taxi route, its back
// GAP_M plus LEAD_S seconds of the aeroplane's speed ahead of its nose, setting off early enough
// to get up to that speed at ACCEL_MS2; caught up (closer than that) it may go up to RUN_KT, and
// closer than GAP_M it speeds up at RUN_ACCEL_MS2. By the stand it turns off the apron lane and
// drives up beside the stand to where the police car waits (beyond the responders called), its
// corners on curves of up to TURN_M, and waits there; as the engines wind down it drives on up to
// the service road and LEAVE_M along it, out of sight.
const FOLLOW_ME = {
  GAP_M: 30, LEAD_S: 2, MAX_KT: 45, RUN_KT: 70, ACCEL_MS2: 2.5, RUN_ACCEL_MS2: 4, BRAKE_MS2: 3,
  TURN_M: 10, LEAVE_M: 160, WAIT_M: 25, FLASH_S: 0.8
};

// ---------- Airport layout (metres) ----------
// Every airport is drawn from the same template around its runway:
// t = along the runway from its middle (positive towards the departure end),
// across = to the right of the runway centreline.
const LAYOUT = {
  RWY_HALF_WIDTH: 23,
  TWY_OFFSET: 160,             // parallel taxiway centreline
  TWY_WIDTH: 23,               // (the ICAO code E taxiway; by the airport's size: TWY_WIDTHS)
  // taxiway width by the terminal's size, ICAO Annex 14's minimum for the biggest aeroplane it
  // takes: code F (A380, 747-8) 25 m, E (777, 787, A350) 23 m, D 18 m, C (737, A320) 15 m
  TWY_WIDTHS: { big: 25, medium: 23, small: 18, tiny: 15 },
  HOLD_OFFSET: 80,             // holding point, from the runway centreline
  HOLD_T: 90,                  // holding point, from the runway start
  // the rapid exits, where they leave the runway as a fraction of its length: EXIT_ANGLE_DEG off
  // it, ahead, onto the parallel taxiway (the last exit, at the runway's end, is a right angle);
  // each moves up to EXIT_SHIFT_M to meet the taxiway where a lane goes on into the apron (one
  // that would meet it past the apron's end back up to EXIT_SHIFT_BACK_M, to its last lane), one
  // that would meet it within EXIT_END_CLEAR_M of its end (a short strip) or less than
  // EXIT_MIN_GAP_M past the exit before it is left out
  EXITS: [0.45, 0.65, 0.85],
  EXIT_ANGLE_DEG: 45,
  EXIT_SHIFT_M: 100,
  EXIT_SHIFT_BACK_M: 250,
  EXIT_MIN_GAP_M: 200,
  EXIT_END_CLEAR_M: 120,
  APRON_LANE: 285,             // taxi lane on the apron (95 m lead-in to the stands: room for a 747 to straighten up)
  STAND: 380,                  // the parking position: an aeroplane's middle (nose-in towards the terminal) ...
  STAND_NOSE: 411,             // ... its nose at most here, 2 m short of the service road (SERVICE_ROAD - 7): one longer
                               // than 2 x (STAND_NOSE - STAND) = 62 m (the 777-300ER, the 747-8, the A380, the An-225)
                               // stops further out, towards the apron lane (World.standAcross)
  SERVICE_ROAD: 420,           // the middle of the apron service road, 14 m wide, between the stands and the
                               // terminal's glass (the baggage trains' road)
  TERMINAL: 470,               // terminal building centre
  HANGAR_DOORS: 425,           // the line of the hangar doors (HANGARS)
  FENCE_FAR: -455,             // the perimeter fence on the far side of the runway (across) ...
  FENCE_BEYOND: 480,           // ... across both ends this far past the runway (still on the level ground) ...
                               // ... and on the terminal side along the terminal's middle line, from building to building
  FENCE_H: 2.4,                // its height, metres, a post every FENCE_POST_M
  FENCE_POST_M: 3,
  APRON_START: 0.3,            // where the apron starts, fraction of the runway length
  GATE_SPACING: 80,
  TERMINAL_GAP: 70,            // between two terminals of a big airport, along the apron
  // the terminals and their stands by the airport's size and its runway, from one terminal with
  // one stand to three with five each, and the freight stands past them (C1 ...: a big airport's
  // cargo terminal with two to five, the cargo apron of a smaller one with one or two):
  // [the runway at least (m), terminals, stands in each, cargo stands]
  // (the last row whose runway length the airport's runway reaches)
  TERMINAL_PLANS: {
    tiny: [[0, 1, 1, 1]],
    small: [[0, 1, 2, 1]],
    medium: [[0, 1, 3, 1], [3000, 1, 4, 2]],
    big: [[0, 2, 3, 2], [3300, 3, 3, 3], [3600, 3, 4, 4], [3900, 3, 5, 5]]
  },
  // the cargo stands lie past the passenger ones, this much further on than the usual stand
  // spacing (GATE_SPACING), so the cargo terminal or shed stands apart from the terminal: at a big
  // or a medium airport the control tower stands in that open stretch of apron, halfway between
  // the two buildings; at a small or a tiny one it rises from the terminal's far end (TOWER_ON_TERMINAL)
  CARGO_GAP: { big: 160, medium: 180, small: 140, tiny: 140 },
  // ... and stand further apart (the freighters are wide, and an A380 turning in to one must
  // clear a 747-8F parked at the next)
  CARGO_SPACING: 95,
  // past the cargo area, the general aviation and rescue area (the bush, air ambulance and
  // search-and-rescue base): GA_STANDS stands for the light aeroplanes (G1 ...) GA_SPACING apart,
  // the first GA_GAP past the cargo part of the apron, then the air ambulance's own stand, the
  // helicopter pads (GA_PADS of them, PAD_SPACING apart) in front of the rescue station, and the
  // airport's fire station with its forecourt (FIRE_ALONG) at the end of the row
  GA_STANDS: { big: 4, medium: 3, small: 2, tiny: 2 },
  GA_GAP: 60,
  GA_SPACING: 45,
  GA_MAX_SPAN: 36,             // the widest aeroplane the GA stands take (ICAO code C); a wider one works from the cargo stands
  MEDEVAC_GAP: 52,             // from the last GA stand to the air ambulance's stand
  GA_PADS: { big: 2, medium: 2, small: 1, tiny: 1 },
  PAD_GAP: 56,                 // from the air ambulance's stand to the first helicopter pad
  PAD_SPACING: 45,
  FIRE_GAP: 62,                // from the last pad to the fire station's middle
  FIRE_ALONG: 54,              // the fire station's length along the apron
  LANE_MAX_STANDS: 2,          // a lane off the taxiway into the apron at least every this many stands
  LANE_MAX_GA: 4,              // ... and among the GA stands, every this many
  LANE_SNAP_M: 50,             // a lane this near a runway exit along the taxiway meets it at the exit (or
                               // moves this far from it)
  LANE_STAND_CLEAR_M: 25,      // ... if it stays this far from every stand's lead-in
  // the wingspan an airport's stands and taxiways take (ICAO Annex 14 codes: C under 36 m, D under
  // 52 m, E under 65 m, F under 80 m); a bigger aeroplane may still be flown there, with a warning
  MAX_SPAN: { tiny: 36, small: 52, medium: 65, big: 80 },
  FILLET_R: 55,                // the centreline radius where taxiways meet at an angle
  FILLET_STAND_R: 45,          // ... and where a stand's lead-in leaves the apron lane
  FILLET_EXIT_R: 70,           // ... and where the last exit (or the line-up) leaves the runway, on both sides
  FILLET_RAPID_R: 240,         // ... and a rapid exit's gentle curves: off the runway, onto the taxiway, into the lane
  FILLET_BACK_R: 45,           // ... and the turn back off a rapid exit onto the taxiway behind it (135°)
  CORRIDOR_LEN: 32000,         // approach / departure corridors cut into the terrain, metres from the runway ends
  CORRIDOR_HALF_WIDTH: 1200,   // plus 12 % of the distance, then 2.5 km to blend into the terrain
  APPROACH_SLOPE_DEG: 2.4,     // the ground stays under this slope before the threshold (the glideslope is 3°)
  APPROACH_FLOOR_FT: 1500,     // ... and at most this far over the field: 1 000 ft under the 2 500 ft the
                               // autopilot levels at before it meets the glide path
  DEPARTURE_SLOPE_DEG: 3.5     // and under this one past the far end of the runway
};
// the buildings behind the terminal, beyond the car park, by the terminal's size:
// [t from the apron's middle, across (from the runway centreline), along, across size, height] in metres, kind
const LANDSIDE = {
  tiny: [],
  small: [[40, 700, 50, 26, 13, 'office']],
  medium: [[-80, 705, 110, 50, 13, 'carpark'], [40, 698, 44, 22, 34, 'hotel'], [110, 700, 54, 28, 17, 'office']],
  big: [[-150, 705, 140, 50, 16, 'carpark'], [-30, 698, 50, 24, 46, 'hotel'], [60, 700, 64, 30, 28, 'office'], [150, 700, 56, 30, 38, 'office']]
};

// the hangars by the terminal's size, from the apron's start down the runway, their doors on one
// line facing the parallel taxiway: [along, across size, height] in metres, shape
//   gable - a small shed with a pitched roof, for the light aeroplanes
//   arch  - the classic arched hangar for one narrow-body
//   wide  - a big maintenance hangar for the wide-bodies, a flat roof and a tall door frame
const HANGARS = {
  tiny: [[36, 30, 8, 'gable']],
  small: [[64, 54, 12, 'arch'], [40, 34, 9, 'gable']],
  medium: [[86, 72, 15, 'arch'], [70, 60, 13, 'arch'], [44, 36, 10, 'gable']],
  big: [[140, 95, 30, 'wide'], [90, 74, 16, 'arch'], [76, 64, 14, 'arch'], [46, 38, 10, 'gable']]
};
// the trees outside an airport's fence (render/perimeter3d.js), by its size, at the High quality
// (QUALITY's aptTrees scales it); which trees: the airport's climate (AIRPORT_CLIMATE)
const AIRPORT_TREES = { tiny: 450, small: 650, medium: 900, big: 1200 };
// the control tower by the terminal's size: the height of the cab's floor, metres
const TOWER_H = { tiny: 22, small: 28, medium: 32, big: 56 };
// at these airports the tower rises from the terminal's far end (the cargo side), high over its roof
// and the flags on it, instead of standing on its own between the terminal and the cargo building
const TOWER_ON_TERMINAL = { tiny: true, small: true };
// the buildings of the general aviation and rescue area by the airport's size: [height, depth across]
// in metres — the GA terminal and hangar behind the GA stands, the air ambulance's hangar, the
// rescue station (its hangar for the helicopters) and the fire station; their apron fronts on the
// terminals' line
const GA_BUILDINGS = {
  ga: { big: [10, 40], medium: [9, 38], small: [8, 36], tiny: [7, 34] },
  medevac: { big: [11, 38], medium: [10, 36], small: [9, 34], tiny: [8, 34] },
  rescue: { big: [13, 42], medium: [12, 40], small: [11, 38], tiny: [10, 36] },
  fire: { big: [9, 36], medium: [9, 36], small: [8, 34], tiny: [8, 34] }
};
// the aeroplanes parked at the stands by the terminal's size (the home airlines' paint): stand i
// of an airport gets the type (hash of its code + i) along its list (World.buildNetwork)
const PARKED_TYPES = {
  big: ['A320NEO', 'B738', 'A359', 'A320', 'B789', 'B77W', 'BCS3', 'A333', 'E295', 'CRJ200'],
  medium: ['B738', 'A320NEO', 'E295', 'CRJ200', 'BCS3', 'AT76', 'B1900D'],
  small: ['CRJ200', 'AT76', 'B1900D', 'F27F'],
  tiny: ['B1900D', 'DHC6']
};
// ... and the freighters at the cargo stands (a cargo carrier's paint)
const PARKED_CARGO_TYPES = {
  big: ['B748F', 'B763F', 'B763F', 'B748F', 'B763F'],
  medium: ['B763F', 'F27F'],
  small: ['F27F', 'AT76'],
  tiny: ['F27F', 'B1900D']
};
// the building behind the cargo stands by the airport's size: [height, depth across] in metres —
// a big airport's cargo terminal, a smaller one's cargo shed; its apron front on the terminals'
const CARGO_BUILDING = { big: [18, 60], medium: [13, 44], small: [11, 40], tiny: [10, 36] };
// ... the light aeroplanes at the GA stands (a bush operator's paint), and the air ambulance's
// aeroplane at its stand
const PARKED_GA_TYPES = ['DHC6', 'B1900D', 'DHC6', 'F27F', 'B1900D'];
const PARKED_MEDEVAC_TYPE = 'B1900D';
// the helicopters on the pads in front of the rescue station (render/ga3d.js draws them, sim/collide.js
// runs into them): the search-and-rescue one on the first pad, the air ambulance's on the second;
// in metres — the main rotor's radius, the length of the fuselage with the tail boom, the height to
// the top of the rotor head
const HELICOPTERS = {
  sar: { rotorR: 10.4, len: 17.4, h: 5.1, name: 'rescue helicopter' },          // an AW139 / Super Puma size; a Mi-8 in Russia
  sarRu: { rotorR: 10.6, len: 18.2, h: 5.6, name: 'rescue helicopter' },
  hems: { rotorR: 5.1, len: 10.2, h: 3.6, name: 'air ambulance helicopter' }   // an EC135 size
};

// ---------- Collisions (sim/collide.js) ----------
// the own aeroplane against the buildings and the parked aeroplanes of the nearest airport
const COLLIDE = {
  CRASH_KT: 6,                 // on the ground below this ground speed a collision is a touch: stopped dead,
                               // damaged, pay the compensation and go on (or end the flight); at it or more
                               // a building or an aeroplane loses the flight (in the air always)
  POLICE_KT: 15,               // a vehicle hit from CRASH_KT up to this: the police stop the flight (a small fine);
                               // at it or more the flight is lost as in a crash
  BUMP_DAMAGE: 0.3,            // the damage of a touch at CRASH_KT (0..1; a quarter of it at a crawl)
  // the compensation for a touch: this share of the contract's pay for what was hit, from half of
  // it at a crawl to all of it at CRASH_KT, times the difficulty's damageFactor, at least COMP_MIN
  COMP_SHARE: { vehicle: 0.04, building: 0.08, parked: 0.12, heli: 0.12 },
  COMP_MIN: 300,
  COMP_REP: 3,                 // each touch paid for: the reputation the flight loses, tenths of a point
  POLICE_FINE: 0.05,           // stopped by the police: this share of the contract's pay ...
  POLICE_REP: 0.5,             // ... and this much reputation (a crash: 12 % and CONTRACTS.CRASH_REP)
  TRAIL_STEP_M: 2,             // the way the aeroplane came, a pose this far apart ...
  TRAIL_M: 80,                 // ... kept this far back, for the tug to pull it back along
  TOW_M: 20,                   // after a touch a tug pulls the aeroplane back this far along its way ...
  TOW_MS: 2.2,                 // ... at this speed (m/s)
  SAMPLE_M: 1.2,               // the spheres along a wing, the tail and the fin: this far apart ...
  WING_R: 0.6,                 // ... and this thick (metres)
  TOWER_CAB_M: 6,              // the tower's cab above its floor (TOWER_H)
  ROOF_LIP_M: 16,              // a terminal's roof overhangs the apron (and its ends) by up to this (the cameras' test)
  // the vehicles on the apron as boxes in their own frame (x across, z forward): [width, back z,
  // front z, height], metres, as render/apron3d.js, baggage3d.js, ga3d.js and responders3d.js draw them
  VEHICLES: {
    tug: [2.8, -2.9, 3.2, 2.6], tractor: [1.6, -1.3, 1.3, 2.2], cart: [1.5, -2.2, 1.4, 1.9],
    beltLoader: [2.0, -3.1, 4.4, 3.2], fuelTruck: [2.5, -5.3, 5.8, 3.7], catering: [2.5, -4.2, 4.7, 5.1],
    gpu: [1.4, -1.1, 1.1, 1.4], stairs: [2.3, -4.5, 4.1, 4.0], highLoader: [3.3, -5.9, 5.0, 4.5],
    forklift: [1.2, -1.3, 2.5, 2.6], ambulance: [2.4, -3.1, 3.0, 2.9], pickup: [1.95, -2.65, 2.65, 2.4],
    van: [2.0, -2.8, 2.8, 2.9], car: [1.8, -2.2, 2.2, 1.6], followMe: [1.8, -2.2, 2.2, 2.1],
    police: [1.8, -2.3, 2.3, 1.7], fire: [3.0, -5.3, 5.6, 3.6]
  }
};

// After a collision the camera goes outside to show it (ui/incident.js, Cinematic.crash): it
// comes in on the spot, shaken at first, and circles it slowly; a touch then asks to pay or to
// end the flight, a tug pulls the aeroplane back (Cinematic.tow), the police drive up when the
// flight is stopped; then the view the pilot had is back, or the debrief follows
const INCIDENT = {
  CRASH_S: 3.2,                // the first shot of the collision, seconds (Enter, Space or a tap skip it)
  CRASH_HOLD_S: 1.6,           // a lost flight: the shot holds this long more before the debrief
  ORBIT_S: 40,                 // the camera circles the spot this slowly while the choice is asked ...
  ORBIT_DEG: 35,               // ... this far round
  SHAKE_M: 0.9,                // the camera shaken at the impact, metres (a touch a third of it) ...
  SHAKE_S: 0.7,                // ... for about this long
  FADE_S: 0.5,                 // a fade to black and back between the shots
  POLICE_S: 5.5,               // the police car drives up: the shot lasts this long
  POLICE_FROM_M: 70,           // ... from this far away
  TUG_WAIT_S: 1.0,             // the tug stands at the nose this long before pulling, and after
  SMOKE_S: 9                   // a lost flight: smoke rises from the spot for this long
};

// ---------- Difficulty ----------
const DIFFICULTY = {
  easy: {
    id: 'easy', name: 'Easy',
    reward: 0.8,              // the pay and the reputation of every flight, times this
    windFactor: 0.5, turbulence: 0.45, icingChance: 0.5,
    qrhTimeFactor: 1.5, emergencyOverlap: 0,
    qrhHint: true,
    touchdownTolerance: 0.35, gradeBonus: 0.15,
    fuelPenaltyFactor: 0.5, damageFactor: 0.6,
    description: 'Calm weather, one problem at a time with a long grace period, checklists come with hints and generous landing grading; pays 20 % less.'
  },
  medium: {
    id: 'medium', name: 'Medium',
    reward: 1,              // the pay and the reputation of every flight, times this
    windFactor: 1.0, turbulence: 1.0, icingChance: 1.0,
    qrhTimeFactor: 1.0, emergencyOverlap: 1,
    qrhHint: false,
    touchdownTolerance: 0.25, gradeBonus: 0,
    fuelPenaltyFactor: 1.0, damageFactor: 1.0,
    description: 'Real wind and turbulence, problems may overlap, standard grading.'
  },
  hard: {
    id: 'hard', name: 'Hard',
    reward: 1.25,              // the pay and the reputation of every flight, times this
    windFactor: 1.5, turbulence: 1.8, icingChance: 1.7,
    qrhTimeFactor: 0.75, emergencyOverlap: 2,
    qrhHint: false,
    touchdownTolerance: 0.2, gradeBonus: -0.1,
    fuelPenaltyFactor: 1.6, damageFactor: 1.5,
    description: 'Storm season: strong wind and severe turbulence, failures with no warning, two problems at once and strict grading; pays 25 % more.'
  }
};

// ---------- Aircraft ----------
// Thrust is the total of all engines in newtons at sea level static, full throttle.
// dims: real length, wingspan and fuselage diameter (m; the width of a tall or double-deck body);
// look: how models.js draws it.
// FLAPS: cl/cd deltas and the maximum speed each setting may be extended at.
// rent: the lease per block hour (kr); loads: the loads it carries, whatever the client.
// Listed by maximum take-off weight, lightest first (the hangar shows them in this order).
const AIRCRAFT = [
  {
    id: 'DHC6', name: 'DHC-6 Twin Otter', klass: 'Bush turboprop', branch: 'bush',
    blurb: 'The legendary bush twin: fixed gear on wheels, skis or floats and a 400-metre strip. Hauls fish, mail and medevacs to places with no roads.',
    seats: 19, payloadKg: 1900, mtow: 5670, emptyKg: 3363,
    engines: 2, engineType: 'prop', thrust: 31000,
    wingArea: 39, clMaxClean: 1.5, clMaxFlap: 2.4, cd0: 0.040, kInd: 0.055,
    cruiseAlt: 3000, cruiseTas: 170, climbRate: 5.0,
    fuelCapKg: 1150, fuelFlowCruise: 130, fuelFlowIdle: 24,
    vne: 210, vr: 65, vsRatio: 1.20, vrefAdd: 8, vlo: 95,
    flaps: [
      { notch: 1, cl: 0.14, cd: 0.008, vfe: 100 },
      { notch: 2, cl: 0.30, cd: 0.020, vfe: 88 },
      { notch: 3, cl: 0.48, cd: 0.040, vfe: 96 },
      { notch: 4, cl: 0.66, cd: 0.072, vfe: 92 },
      { notch: 5, cl: 0.84, cd: 0.120, vfe: 88 }
    ],
    gearCd: 0.014, rollRate: 1.15, pitchRate: 1.15, yawRate: 1.2,
    takeoffDist: 370, crosswindLimit: 16, maxRangeNm: 650, surfaces: ['asphalt', 'grass', 'ice'],
    rent: 1000, price: 0, bonus: 1.35, unlock: 'bush1',
    dims: { len: 15.77, span: 19.81, fus: 1.75 },
    look: { wing: 'high', engines: 'prop2', tail: 'low', base: '#f4f1e8', color: '#d64534', fixedGear: true },
    propRpmIdle: 0.6, propRpmCruise: 0.9
  },
  {
    id: 'B1900D', name: 'Beechcraft 1900D', klass: 'Turboprop', branch: 'start',
    blurb: 'The 19-seat commuter workhorse: a stand-up cabin, two PT6 turboprops and a T-tail. Noisy, forgiving, and happy on gravel and grass.',
    seats: 19, payloadKg: 2100, mtow: 7766, emptyKg: 4730,
    engines: 2, engineType: 'prop', thrust: 41000,
    wingArea: 28.8, clMaxClean: 1.45, clMaxFlap: 2.15, cd0: 0.040, kInd: 0.048,
    cruiseAlt: 7600, cruiseTas: 280, climbRate: 7.0,
    fuelCapKg: 1290, fuelFlowCruise: 185, fuelFlowIdle: 30,
    vne: 330, vr: 105, vsRatio: 1.26, vrefAdd: 12, vlo: 180,
    flaps: [
      { notch: 1, cl: 0.18, cd: 0.010, vfe: 188 },
      { notch: 2, cl: 0.36, cd: 0.024, vfe: 175 },
      { notch: 3, cl: 0.55, cd: 0.048, vfe: 165 },
      { notch: 4, cl: 0.72, cd: 0.082, vfe: 154 },
      { notch: 5, cl: 0.88, cd: 0.130, vfe: 154 }
    ],
    gearCd: 0.016, rollRate: 1.0, pitchRate: 1.0, yawRate: 1.0,
    takeoffDist: 1150, crosswindLimit: 25, maxRangeNm: 650, surfaces: ['asphalt', 'grass'],
    rent: 1100, price: 0, bonus: 1.0, unlock: null,
    dims: { len: 17.63, span: 17.67, fus: 1.95 },
    look: { wing: 'low', engines: 'prop2', tail: 't', base: '#f3f5f7', color: '#1f5fa0' },
    propRpmIdle: 0.62, propRpmCruise: 0.88
  },
  {
    id: 'F27F', name: 'Fokker F27-600F', klass: 'Freighter turboprop', branch: 'cargo',
    blurb: 'The Friendship as a freighter: a high wing, two Dart turboprops and a big cargo door up front. Lifts six tonnes onto a gravel strip and keeps on flying.',
    seats: 3, payloadKg: 6000, mtow: 20410, emptyKg: 11500,
    engines: 2, engineType: 'prop', thrust: 90000,
    wingArea: 70, clMaxClean: 1.5, clMaxFlap: 2.3, cd0: 0.042, kInd: 0.05,
    cruiseAlt: 6100, cruiseTas: 250, climbRate: 5.0,
    fuelCapKg: 4110, fuelFlowCruise: 360, fuelFlowIdle: 45,
    vne: 285, vr: 100, vsRatio: 1.22, vrefAdd: 14, vlo: 150,
    flaps: [
      { notch: 1, cl: 0.16, cd: 0.009, vfe: 180 },
      { notch: 2, cl: 0.34, cd: 0.022, vfe: 165 },
      { notch: 3, cl: 0.52, cd: 0.044, vfe: 150 },
      { notch: 4, cl: 0.70, cd: 0.078, vfe: 140 },
      { notch: 5, cl: 0.90, cd: 0.135, vfe: 140 }
    ],
    gearCd: 0.018, rollRate: 0.9, pitchRate: 0.9, yawRate: 0.95,
    takeoffDist: 1550, crosswindLimit: 20, maxRangeNm: 1000, surfaces: ['asphalt', 'grass'],
    rent: 3000, price: 0, bonus: 1.2, unlock: 'cargo2',
    dims: { len: 23.56, span: 29.0, fus: 2.7 },
    look: { wing: 'high', engines: 'prop2', tail: 'low', base: '#e6e9ec', color: '#d9921f', freighter: true },
    propRpmIdle: 0.58, propRpmCruise: 0.85
  },
  {
    id: 'AT76', name: 'ATR 72-600', klass: 'Regional turboprop', branch: 'pax',
    blurb: 'Europe\'s island-hopper: 70 seats under a high wing, two PW127 turboprops with six-blade propellers and a T-tail. Sips fuel on the short legs where a jet never reaches its cruise.',
    seats: 70, payloadKg: 7500, mtow: 23000, emptyKg: 13500,
    engines: 2, engineType: 'prop', thrust: 100000,
    wingArea: 61, clMaxClean: 1.6, clMaxFlap: 2.7, cd0: 0.038, kInd: 0.045,
    cruiseAlt: 6700, cruiseTas: 275, climbRate: 6.5,
    fuelCapKg: 5000, fuelFlowCruise: 350, fuelFlowIdle: 45,
    vne: 300, vr: 105, vsRatio: 1.22, vrefAdd: 5, vlo: 180,
    flaps: [
      { notch: 1, cl: 0.18, cd: 0.009, vfe: 185 },
      { notch: 2, cl: 0.38, cd: 0.022, vfe: 180 },
      { notch: 3, cl: 0.60, cd: 0.044, vfe: 170 },
      { notch: 4, cl: 0.85, cd: 0.080, vfe: 160 },
      { notch: 5, cl: 1.10, cd: 0.135, vfe: 150 }
    ],
    gearCd: 0.017, rollRate: 0.95, pitchRate: 0.95, yawRate: 1.0,
    takeoffDist: 1370, crosswindLimit: 30, maxRangeNm: 825, surfaces: ['asphalt'],
    rent: 3600, price: 0, bonus: 1.15, unlock: 'paxtp',
    dims: { len: 27.17, span: 27.05, fus: 2.57 },
    look: { wing: 'high', engines: 'prop2', tail: 't', base: '#f3f5f7', color: '#2f8f4e', blades: 6 },
    propRpmIdle: 0.6, propRpmCruise: 0.82
  },
  {
    id: 'CRJ200', name: 'Bombardier CRJ200', klass: 'Regional jet', branch: 'pax',
    blurb: 'The 50-seat regional jet: two engines on the tail, a T-tail and a narrow tube. Climbs well, flies fast, hates ice and crosswinds.',
    seats: 50, payloadKg: 5500, mtow: 23133, emptyKg: 13835,
    engines: 2, engineType: 'jet', thrust: 78000,
    wingArea: 48.35, clMaxClean: 1.42, clMaxFlap: 2.1, cd0: 0.026, kInd: 0.042,
    cruiseAlt: 10500, cruiseTas: 430, climbRate: 13,
    fuelCapKg: 6490, fuelFlowCruise: 650, fuelFlowIdle: 70,
    vne: 440, vr: 140, vsRatio: 1.24, vrefAdd: 8, vlo: 220,
    flaps: [
      { notch: 1, cl: 0.12, cd: 0.006, vfe: 230 },
      { notch: 2, cl: 0.30, cd: 0.018, vfe: 230 },
      { notch: 3, cl: 0.50, cd: 0.038, vfe: 185 },
      { notch: 4, cl: 0.68, cd: 0.070, vfe: 185 },
      { notch: 5, cl: 0.85, cd: 0.120, vfe: 165 }
    ],
    gearCd: 0.020, rollRate: 1.05, pitchRate: 0.85, yawRate: 1.1,
    takeoffDist: 1900, crosswindLimit: 27, maxRangeNm: 1700, surfaces: ['asphalt'],
    rent: 3200, price: 0, bonus: 1.15, unlock: 'pax1',
    dims: { len: 26.77, span: 21.21, fus: 2.69 },
    look: { wing: 'low', engines: 'rear2', tail: 't', base: '#f3f5f7', color: '#0f7a6a', sweep: 25 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'E295', name: 'Embraer E195-E2', klass: 'Regional jet', branch: 'pax',
    blurb: 'The biggest E-Jet: 132 seats, a new long wing, geared turbofans with huge quiet fans and closed-loop fly-by-wire. Brazil\'s answer to the small narrowbodies.',
    seats: 132, payloadKg: 16100, mtow: 61500, emptyKg: 35700,
    engines: 2, engineType: 'jet', thrust: 204000,
    wingArea: 103, clMaxClean: 1.42, clMaxFlap: 2.1, cd0: 0.023, kInd: 0.039,
    cruiseAlt: 11000, cruiseTas: 447, climbRate: 12,
    fuelCapKg: 13700, fuelFlowCruise: 1000, fuelFlowIdle: 85,
    vne: 470, vr: 140, vsRatio: 1.22, vrefAdd: 6, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.12, cd: 0.006, vfe: 230 },
      { notch: 2, cl: 0.30, cd: 0.018, vfe: 215 },
      { notch: 3, cl: 0.50, cd: 0.038, vfe: 200 },
      { notch: 4, cl: 0.68, cd: 0.070, vfe: 180 },
      { notch: 5, cl: 0.84, cd: 0.120, vfe: 165 }
    ],
    gearCd: 0.021, rollRate: 0.95, pitchRate: 0.75, yawRate: 0.95,
    takeoffDist: 1970, crosswindLimit: 30, maxRangeNm: 2600, surfaces: ['asphalt'],
    rent: 7400, price: 0, bonus: 1.2, unlock: 'paxfbw',
    dims: { len: 41.5, span: 35.12, fus: 3.01 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#b5265f', sweep: 26, fan: 0.62 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'BCS3', name: 'Airbus A220-300', klass: 'Narrowbody jet', branch: 'pax',
    blurb: 'Born as the Bombardier CSeries: 140 seats five abreast, big windows, side-sticks and geared turbofans. Quiet, frugal, and it flies further than its size suggests.',
    seats: 140, payloadKg: 18700, mtow: 70900, emptyKg: 37100,
    engines: 2, engineType: 'jet', thrust: 210000,
    wingArea: 112.3, clMaxClean: 1.42, clMaxFlap: 2.1, cd0: 0.022, kInd: 0.039,
    cruiseAlt: 11300, cruiseTas: 447, climbRate: 12,
    fuelCapKg: 17500, fuelFlowCruise: 1000, fuelFlowIdle: 85,
    vne: 470, vr: 140, vsRatio: 1.22, vrefAdd: 6, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.12, cd: 0.006, vfe: 230 },
      { notch: 2, cl: 0.30, cd: 0.018, vfe: 210 },
      { notch: 3, cl: 0.50, cd: 0.038, vfe: 200 },
      { notch: 4, cl: 0.68, cd: 0.070, vfe: 185 },
      { notch: 5, cl: 0.84, cd: 0.120, vfe: 170 }
    ],
    gearCd: 0.021, rollRate: 0.9, pitchRate: 0.7, yawRate: 0.9,
    takeoffDist: 1890, crosswindLimit: 30, maxRangeNm: 3400, surfaces: ['asphalt'],
    rent: 8200, price: 0, bonus: 1.22, unlock: 'paxfbw',
    dims: { len: 38.7, span: 35.1, fus: 3.7 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#0f8fa8', sweep: 25, fan: 0.56 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'A320', name: 'Airbus A320-200', klass: 'Narrowbody jet', branch: 'pax',
    blurb: 'The classic A320 that put fly-by-wire on every short-haul route: 168 seats, a side-stick, and wingtip fences instead of sharklets.',
    seats: 168, payloadKg: 16000, mtow: 78000, emptyKg: 42600,
    engines: 2, engineType: 'jet', thrust: 240000,
    wingArea: 122.6, clMaxClean: 1.4, clMaxFlap: 2.05, cd0: 0.024, kInd: 0.04,
    cruiseAlt: 11300, cruiseTas: 447, climbRate: 12,
    fuelCapKg: 19000, fuelFlowCruise: 1250, fuelFlowIdle: 105,
    vne: 480, vr: 150, vsRatio: 1.22, vrefAdd: 6, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.12, cd: 0.006, vfe: 230 },
      { notch: 2, cl: 0.30, cd: 0.018, vfe: 215 },
      { notch: 3, cl: 0.50, cd: 0.038, vfe: 200 },
      { notch: 4, cl: 0.68, cd: 0.070, vfe: 185 },
      { notch: 5, cl: 0.84, cd: 0.120, vfe: 177 }
    ],
    gearCd: 0.022, rollRate: 0.85, pitchRate: 0.65, yawRate: 0.85,
    takeoffDist: 2100, crosswindLimit: 33, maxRangeNm: 2400, surfaces: ['asphalt'],
    rent: 9400, price: 0, bonus: 1.25, unlock: 'pax3',
    dims: { len: 37.57, span: 34.1, fus: 3.95 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#3b4fa8', sweep: 25 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'B738', name: 'Boeing 737-800', klass: 'Narrowbody jet', branch: 'pax',
    blurb: 'The workhorse of every low-cost airline in Europe: 189 seats, short legs, quick turns, and a wing that likes to be flown.',
    seats: 189, payloadKg: 18000, mtow: 79000, emptyKg: 41400,
    engines: 2, engineType: 'jet', thrust: 242000,
    wingArea: 124.6, clMaxClean: 1.38, clMaxFlap: 2.05, cd0: 0.023, kInd: 0.041,
    cruiseAlt: 11300, cruiseTas: 453, climbRate: 12,
    fuelCapKg: 20800, fuelFlowCruise: 1250, fuelFlowIdle: 105,
    vne: 480, vr: 150, vsRatio: 1.22, vrefAdd: 6, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.12, cd: 0.006, vfe: 230 },
      { notch: 2, cl: 0.30, cd: 0.018, vfe: 215 },
      { notch: 3, cl: 0.50, cd: 0.038, vfe: 200 },
      { notch: 4, cl: 0.66, cd: 0.070, vfe: 185 },
      { notch: 5, cl: 0.80, cd: 0.120, vfe: 175 }
    ],
    gearCd: 0.022, rollRate: 0.85, pitchRate: 0.65, yawRate: 0.85,
    takeoffDist: 2000, crosswindLimit: 33, maxRangeNm: 2450, surfaces: ['asphalt'],
    rent: 9900, price: 0, bonus: 1.25, unlock: 'pax2',
    dims: { len: 39.5, span: 35.8, fus: 3.76 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#b3282d', sweep: 25, winglets: true, flatNacelles: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'A320NEO', name: 'Airbus A320neo', klass: 'Narrowbody jet', branch: 'pax',
    blurb: 'The new-engine A320: 180 seats, big quiet fans, fly-by-wire manners and the lowest fuel burn per seat in its class.',
    seats: 180, payloadKg: 17000, mtow: 79000, emptyKg: 44500,
    engines: 2, engineType: 'jet', thrust: 240000,
    wingArea: 122.6, clMaxClean: 1.4, clMaxFlap: 2.1, cd0: 0.022, kInd: 0.04,
    cruiseAlt: 11300, cruiseTas: 450, climbRate: 12,
    fuelCapKg: 19000, fuelFlowCruise: 1100, fuelFlowIdle: 95,
    vne: 480, vr: 145, vsRatio: 1.22, vrefAdd: 6, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.12, cd: 0.006, vfe: 230 },
      { notch: 2, cl: 0.30, cd: 0.018, vfe: 215 },
      { notch: 3, cl: 0.50, cd: 0.038, vfe: 200 },
      { notch: 4, cl: 0.68, cd: 0.070, vfe: 185 },
      { notch: 5, cl: 0.84, cd: 0.120, vfe: 177 }
    ],
    gearCd: 0.022, rollRate: 0.85, pitchRate: 0.65, yawRate: 0.85,
    takeoffDist: 1950, crosswindLimit: 33, maxRangeNm: 2550, surfaces: ['asphalt'],
    rent: 10400, price: 0, bonus: 1.25, unlock: 'pax3',
    dims: { len: 37.6, span: 35.8, fus: 3.95 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#14325c', sweep: 25, winglets: true, bigFans: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    // Airbus's own outsize freighter: an A300-600's wing, engines, lower fuselage and cockpit (set
    // lower), under a hold 7.1 m across, with a door over the cockpit that swings the whole front
    // up. Real figures: 56.15 m long, 44.84 m span, 260 m² of wing, 155 t at take-off, 86.5 t empty,
    // 47 t of payload, two CF6-80C2A8 of 262 kN, Mach 0.69 (420 kt), 2 700 km with 26 t — its loads
    // (wings, fuselage sections, helicopters) fill the hold long before they reach its weight. The
    // big body is drag in the cruise and a sail in a crosswind. It flies only for its operator,
    // Airbus Beluga Transport, and only in its paint (`operator`, data/airlines.js), carrying
    // aircraft sections between the Airbus plants and outsize freight for hire (`loads`); the
    // BelugaXL (below) took over most of the sections.
    // dims.fus is the A300's lower lobe; look.bubble the hold's width over it (7.7 m outside).
    id: 'A3ST', name: 'Airbus A300-600ST Beluga', klass: 'Outsize freighter', branch: 'cargo', operator: 'BGA',
    blurb: 'Airbus\'s flying whale: an A300\'s wing and cockpit under a hold 7 metres across, the whole front of it swinging up over the cockpit. It carries wings and fuselage sections between the Airbus plants — light, but too big for anything else.',
    seats: 2, payloadKg: 47000, mtow: 155000, emptyKg: 86500,
    engines: 2, engineType: 'jet', thrust: 524000,
    wingArea: 260, clMaxClean: 1.35, clMaxFlap: 2.0, cd0: 0.029, kInd: 0.04,
    cruiseAlt: 9400, cruiseTas: 420, climbRate: 8,
    fuelCapKg: 49000, fuelFlowCruise: 2700, fuelFlowIdle: 200,
    vne: 450, vr: 145, vsRatio: 1.2, vrefAdd: 5, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.006, vfe: 230 },
      { notch: 2, cl: 0.26, cd: 0.018, vfe: 215 },
      { notch: 3, cl: 0.46, cd: 0.038, vfe: 200 },
      { notch: 4, cl: 0.64, cd: 0.068, vfe: 185 },
      { notch: 5, cl: 0.80, cd: 0.118, vfe: 175 }
    ],
    gearCd: 0.024, rollRate: 0.7, pitchRate: 0.52, yawRate: 0.62,
    takeoffDist: 2400, crosswindLimit: 25, maxRangeNm: 1500, surfaces: ['asphalt'],
    rent: 15000, price: 0, bonus: 1.35, unlock: 'cargo5', loads: ['parts', 'parts', 'outsize'],
    dims: { len: 56.15, span: 44.84, fus: 5.64 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#ffffff', color: '#00205b', sweep: 28, bubble: 1.37, tailFins: true, mainRows: 2, freighter: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'B763F', name: 'Boeing 767-300F', klass: 'Widebody freighter', branch: 'cargo',
    blurb: 'Fifty-two tonnes of freight on the main deck and in the holds, two big fans and a cruise that eats the horizon.',
    seats: 2, payloadKg: 52000, mtow: 186880, emptyKg: 86180,
    engines: 2, engineType: 'jet', thrust: 536000,
    wingArea: 283.3, clMaxClean: 1.35, clMaxFlap: 2.0, cd0: 0.022, kInd: 0.038,
    cruiseAlt: 11300, cruiseTas: 459, climbRate: 9,
    fuelCapKg: 72600, fuelFlowCruise: 2600, fuelFlowIdle: 190,
    vne: 490, vr: 160, vsRatio: 1.2, vrefAdd: 5, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.005, vfe: 250 },
      { notch: 2, cl: 0.26, cd: 0.016, vfe: 240 },
      { notch: 3, cl: 0.46, cd: 0.036, vfe: 220 },
      { notch: 4, cl: 0.64, cd: 0.066, vfe: 210 },
      { notch: 5, cl: 0.80, cd: 0.115, vfe: 180 }
    ],
    gearCd: 0.024, rollRate: 0.75, pitchRate: 0.55, yawRate: 0.7,
    takeoffDist: 2800, crosswindLimit: 30, maxRangeNm: 3250, surfaces: ['asphalt'],
    rent: 17100, price: 0, bonus: 1.3, unlock: 'cargo4',
    dims: { len: 54.94, span: 47.57, fus: 5.03 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#eceff2', color: '#e0a030', sweep: 31, freighter: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    // The Beluga's successor, flying since 2019: an A330-200's wing, Trent 700s, lower fuselage and
    // cockpit under a hold 8 m across and 6 m longer than the ST's, with the smile of a whale
    // painted on (look.face). Real figures: 63.1 m long, 60.3 m span, 18.9 m tall, 361.6 m² of
    // wing, 227 t at take-off, 127.5 t empty, 51 t of payload, two Trent 772B of 316 kN, Mach
    // 0.69, 4 000 km with 40 t. Flown for Airbus alone: the sections of its own aircraft between
    // its plants (the STs fly outsize freight for hire too).
    id: 'A3XL', name: 'Airbus BelugaXL', klass: 'Outsize freighter', branch: 'cargo', operator: 'BGA',
    blurb: 'The bigger whale, with a smile painted on: an A330\'s wing and cockpit under a hold 8 metres wide, built to carry both wings of an A350 at once between the Airbus plants.',
    seats: 2, payloadKg: 51000, mtow: 227000, emptyKg: 127500,
    engines: 2, engineType: 'jet', thrust: 632000,
    wingArea: 361.6, clMaxClean: 1.35, clMaxFlap: 2.0, cd0: 0.029, kInd: 0.039,
    cruiseAlt: 9800, cruiseTas: 420, climbRate: 8,
    fuelCapKg: 100000, fuelFlowCruise: 3000, fuelFlowIdle: 240,
    vne: 450, vr: 145, vsRatio: 1.2, vrefAdd: 5, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.006, vfe: 240 },
      { notch: 2, cl: 0.26, cd: 0.018, vfe: 215 },
      { notch: 3, cl: 0.46, cd: 0.038, vfe: 196 },
      { notch: 4, cl: 0.64, cd: 0.068, vfe: 186 },
      { notch: 5, cl: 0.80, cd: 0.118, vfe: 180 }
    ],
    gearCd: 0.024, rollRate: 0.66, pitchRate: 0.5, yawRate: 0.6,
    takeoffDist: 2400, crosswindLimit: 25, maxRangeNm: 2200, surfaces: ['asphalt'],
    rent: 19000, price: 0, bonus: 1.38, unlock: 'cargo5', loads: ['parts'],
    dims: { len: 63.1, span: 60.3, fus: 5.64 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#ffffff', color: '#00205b', sweep: 30, fan: 0.52, winglets: true, bubble: 1.56, tailFins: true, mainRows: 2, face: true, freighter: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'A333', name: 'Airbus A330-300', klass: 'Widebody jet', branch: 'pax',
    blurb: 'The widebody that taught twins to cross oceans: 300 seats, two Trent 700s, winglets and the A320\'s cockpit scaled up. Steady, roomy and everywhere.',
    seats: 300, payloadKg: 45600, mtow: 242000, emptyKg: 129400,
    engines: 2, engineType: 'jet', thrust: 632000,
    wingArea: 361.6, clMaxClean: 1.35, clMaxFlap: 2.0, cd0: 0.022, kInd: 0.038,
    cruiseAlt: 11300, cruiseTas: 470, climbRate: 9,
    fuelCapKg: 109000, fuelFlowCruise: 2900, fuelFlowIdle: 250,
    vne: 490, vr: 150, vsRatio: 1.2, vrefAdd: 5, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.005, vfe: 240 },
      { notch: 2, cl: 0.26, cd: 0.016, vfe: 215 },
      { notch: 3, cl: 0.46, cd: 0.036, vfe: 196 },
      { notch: 4, cl: 0.64, cd: 0.066, vfe: 186 },
      { notch: 5, cl: 0.80, cd: 0.115, vfe: 180 }
    ],
    gearCd: 0.024, rollRate: 0.72, pitchRate: 0.52, yawRate: 0.68,
    takeoffDist: 2500, crosswindLimit: 35, maxRangeNm: 6350, surfaces: ['asphalt'],
    rent: 20500, price: 0, bonus: 1.32, unlock: 'paxetops',
    dims: { len: 63.66, span: 60.3, fus: 5.64 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#8a1f3d', sweep: 30, winglets: true, fan: 0.52 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'B789', name: 'Boeing 787-9 Dreamliner', klass: 'Widebody jet', branch: 'pax',
    blurb: 'Half of it is carbon fibre: 296 seats, raked wingtips that bend up in flight, bigger windows, more humid air, and the range to link almost any two cities.',
    seats: 296, payloadKg: 52600, mtow: 254000, emptyKg: 128900,
    engines: 2, engineType: 'jet', thrust: 660000,
    wingArea: 377, clMaxClean: 1.35, clMaxFlap: 2.0, cd0: 0.020, kInd: 0.036,
    cruiseAlt: 11900, cruiseTas: 488, climbRate: 10,
    fuelCapKg: 101000, fuelFlowCruise: 2700, fuelFlowIdle: 230,
    vne: 495, vr: 155, vsRatio: 1.2, vrefAdd: 5, vlo: 270,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.005, vfe: 250 },
      { notch: 2, cl: 0.26, cd: 0.016, vfe: 230 },
      { notch: 3, cl: 0.46, cd: 0.036, vfe: 200 },
      { notch: 4, cl: 0.64, cd: 0.066, vfe: 185 },
      { notch: 5, cl: 0.80, cd: 0.115, vfe: 170 }
    ],
    gearCd: 0.024, rollRate: 0.72, pitchRate: 0.52, yawRate: 0.68,
    takeoffDist: 2800, crosswindLimit: 38, maxRangeNm: 7565, surfaces: ['asphalt'],
    rent: 21800, price: 0, bonus: 1.35, unlock: 'paxetops',
    dims: { len: 62.81, span: 60.12, fus: 5.77 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#1e5aa8', sweep: 32, fan: 0.58, dihedral: 7 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'A359', name: 'Airbus A350-900', klass: 'Widebody jet', branch: 'pax',
    blurb: 'Carbon-fibre widebody with 315 seats. Heavy, long-legged and smooth — it needs a long runway and a careful flare.',
    seats: 315, payloadKg: 53000, mtow: 280000, emptyKg: 142000,
    engines: 2, engineType: 'jet', thrust: 750000,
    wingArea: 442, clMaxClean: 1.35, clMaxFlap: 2.0, cd0: 0.020, kInd: 0.037,
    cruiseAlt: 11900, cruiseTas: 488, climbRate: 10,
    fuelCapKg: 110000, fuelFlowCruise: 2900, fuelFlowIdle: 250,
    vne: 495, vr: 155, vsRatio: 1.2, vrefAdd: 5, vlo: 260,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.005, vfe: 255 },
      { notch: 2, cl: 0.26, cd: 0.016, vfe: 230 },
      { notch: 3, cl: 0.46, cd: 0.036, vfe: 215 },
      { notch: 4, cl: 0.64, cd: 0.066, vfe: 200 },
      { notch: 5, cl: 0.80, cd: 0.115, vfe: 190 }
    ],
    gearCd: 0.024, rollRate: 0.7, pitchRate: 0.5, yawRate: 0.65,
    takeoffDist: 2600, crosswindLimit: 35, maxRangeNm: 8000, surfaces: ['asphalt'],
    rent: 23400, price: 0, bonus: 1.35, unlock: 'pax4',
    dims: { len: 66.8, span: 64.8, fus: 5.96 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#1d6b5a', sweep: 31, winglets: true, bigFans: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'B77W', name: 'Boeing 777-300ER', klass: 'Widebody jet', branch: 'pax',
    blurb: 'The long-range Triple Seven: 396 seats, two GE90-115B engines — the most powerful in airline service — on six-wheel main gear, and the legs to fly half way round the world nonstop.',
    seats: 396, payloadKg: 69000, mtow: 351500, emptyKg: 167800,
    engines: 2, engineType: 'jet', thrust: 1026000,
    wingArea: 436.8, clMaxClean: 1.35, clMaxFlap: 2.05, cd0: 0.021, kInd: 0.037,
    cruiseAlt: 10700, cruiseTas: 490, climbRate: 10,
    fuelCapKg: 145500, fuelFlowCruise: 3700, fuelFlowIdle: 280,
    vne: 495, vr: 165, vsRatio: 1.2, vrefAdd: 5, vlo: 270,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.005, vfe: 255 },
      { notch: 2, cl: 0.26, cd: 0.016, vfe: 235 },
      { notch: 3, cl: 0.46, cd: 0.036, vfe: 215 },
      { notch: 4, cl: 0.64, cd: 0.066, vfe: 195 },
      { notch: 5, cl: 0.80, cd: 0.115, vfe: 170 }
    ],
    gearCd: 0.026, rollRate: 0.65, pitchRate: 0.48, yawRate: 0.62,
    takeoffDist: 2950, crosswindLimit: 38, maxRangeNm: 7370, surfaces: ['asphalt'],
    rent: 27600, price: 0, bonus: 1.38, unlock: 'pax4',
    dims: { len: 73.86, span: 64.8, fus: 6.19 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#24477a', sweep: 31.6, fan: 0.6, mainRows: 3 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'A124', name: 'Antonov An-124 Ruslan', klass: 'Outsize freighter', branch: 'cargo',
    blurb: 'The biggest freighter you can hire: a nose that lifts, a ramp at the tail and 120 tonnes of turbines, locomotives or helicopters inside — on 24 wheels that take it onto gravel and ice.',
    seats: 6, payloadKg: 120000, mtow: 392000, emptyKg: 178000,
    engines: 4, engineType: 'jet', thrust: 918000,
    wingArea: 628, clMaxClean: 1.4, clMaxFlap: 2.2, cd0: 0.025, kInd: 0.04,
    cruiseAlt: 10000, cruiseTas: 450, climbRate: 7,
    fuelCapKg: 212000, fuelFlowCruise: 3000, fuelFlowIdle: 230,
    vne: 470, vr: 155, vsRatio: 1.2, vrefAdd: 5, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.006, vfe: 250 },
      { notch: 2, cl: 0.28, cd: 0.018, vfe: 220 },
      { notch: 3, cl: 0.48, cd: 0.040, vfe: 200 },
      { notch: 4, cl: 0.66, cd: 0.072, vfe: 185 },
      { notch: 5, cl: 0.82, cd: 0.125, vfe: 170 }
    ],
    gearCd: 0.034, rollRate: 0.55, pitchRate: 0.42, yawRate: 0.55,
    takeoffDist: 2800, crosswindLimit: 30, maxRangeNm: 3800, surfaces: ['asphalt', 'grass', 'ice'],
    rent: 36000, price: 0, bonus: 1.5, unlock: 'cargo5', loads: ['outsize', 'outsize', 'cargo', 'hazmat'],
    dims: { len: 68.96, span: 73.3, fus: 7.3 },
    look: { wing: 'high', engines: 'wing4', tail: 'low', base: '#e9ecef', color: '#1f4fa0', sweep: 32, dihedral: -3, tall: 1.1, mainRows: 5, sponsons: true, freighter: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'B748F', name: 'Boeing 747-8F', klass: 'Widebody freighter', branch: 'cargo',
    blurb: 'The Queen of the Skies as a freighter: four engines, a nose that swings up, and 134 tonnes in the hold.',
    seats: 3, payloadKg: 134000, mtow: 447700, emptyKg: 197000,
    engines: 4, engineType: 'jet', thrust: 1180000,
    wingArea: 554, clMaxClean: 1.35, clMaxFlap: 2.0, cd0: 0.022, kInd: 0.038,
    cruiseAlt: 11300, cruiseTas: 490, climbRate: 8,
    fuelCapKg: 182000, fuelFlowCruise: 2600, fuelFlowIdle: 220,
    vne: 495, vr: 165, vsRatio: 1.2, vrefAdd: 5, vlo: 270,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.005, vfe: 260 },
      { notch: 2, cl: 0.26, cd: 0.016, vfe: 240 },
      { notch: 3, cl: 0.46, cd: 0.036, vfe: 225 },
      { notch: 4, cl: 0.64, cd: 0.066, vfe: 210 },
      { notch: 5, cl: 0.80, cd: 0.115, vfe: 200 }
    ],
    gearCd: 0.026, rollRate: 0.6, pitchRate: 0.45, yawRate: 0.6,
    takeoffDist: 3100, crosswindLimit: 30, maxRangeNm: 4400, surfaces: ['asphalt'],
    rent: 40000, price: 0, bonus: 1.4, unlock: 'cargo4',
    dims: { len: 76.3, span: 68.4, fus: 6.5 },
    look: { wing: 'low', engines: 'wing4', tail: 'low', base: '#eceff2', color: '#e0a030', sweep: 37, hump: true, freighter: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'A388', name: 'Airbus A380-800', klass: 'Double-deck jet', branch: 'pax',
    blurb: 'The superjumbo: two full decks from nose to tail, 525 seats, four engines and a wing you could park seventy cars on. Gentle in the air, but it wants the longest runways in the world.',
    seats: 525, payloadKg: 84000, mtow: 575000, emptyKg: 277000,
    engines: 4, engineType: 'jet', thrust: 1240000,
    wingArea: 845, clMaxClean: 1.4, clMaxFlap: 2.1, cd0: 0.021, kInd: 0.036,
    cruiseAlt: 11300, cruiseTas: 488, climbRate: 8,
    fuelCapKg: 254000, fuelFlowCruise: 2950, fuelFlowIdle: 230,
    vne: 495, vr: 155, vsRatio: 1.2, vrefAdd: 5, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.005, vfe: 263 },
      { notch: 2, cl: 0.26, cd: 0.016, vfe: 222 },
      { notch: 3, cl: 0.46, cd: 0.036, vfe: 220 },
      { notch: 4, cl: 0.64, cd: 0.066, vfe: 196 },
      { notch: 5, cl: 0.80, cd: 0.115, vfe: 182 }
    ],
    gearCd: 0.030, rollRate: 0.55, pitchRate: 0.42, yawRate: 0.55,
    takeoffDist: 2900, crosswindLimit: 35, maxRangeNm: 8000, surfaces: ['asphalt'],
    rent: 30000, price: 0, bonus: 1.45, unlock: 'pax4',
    dims: { len: 72.72, span: 79.75, fus: 7.14 },
    look: { wing: 'low', engines: 'wing4', tail: 'low', base: '#f3f5f7', color: '#6a2c82', sweep: 33.5, fan: 0.47, tall: 1.18, decks: 2, bodyRows: 3 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    // The legend: the heaviest aeroplane ever flown, destroyed in 2022. It is not leased: the pilot
    // builds it part by part in the Mriya's assembly hall (data/mriya.js, ui/mriya.js) once every
    // course is passed, and it is theirs. Real figures: 84 m long, 88.4 m
    // span, 905 m² of wing, 640 t at take-off, 285 t empty, 250 t of payload, six Progress D-18T
    // of 229.5 kN, 800 km/h in the cruise, 15 400 km on full tanks (300 t of fuel), 3 500 m of
    // runway at full weight, 32 wheels, a crew of six. No lease: it is the pilot's own, but it has
    // its upkeep (`rent`, per block hour: its crew of six, its maintenance, insurance and hangar —
    // more than the An-124's lease).
    // Painted in the finish the pilot chose (look.finish, MRIYA_FINISHES in data/mriya.js).
    id: 'A225', name: 'Antonov An-225 Mriya', klass: 'Outsize freighter', branch: 'cargo', legend: true,
    blurb: 'The Dream: built to carry the Buran space shuttle on its back, six engines, 32 wheels and 250 tonnes in the hold. One was ever flown — and you built it again with your own hands.',
    seats: 6, payloadKg: 250000, mtow: 640000, emptyKg: 285000,
    engines: 6, engineType: 'jet', thrust: 1377000,
    wingArea: 905, clMaxClean: 1.4, clMaxFlap: 2.2, cd0: 0.026, kInd: 0.04,
    cruiseAlt: 10000, cruiseTas: 432, climbRate: 6,
    fuelCapKg: 300000, fuelFlowCruise: 2650, fuelFlowIdle: 230,
    vne: 460, vr: 160, vsRatio: 1.2, vrefAdd: 5, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.006, vfe: 250 },
      { notch: 2, cl: 0.28, cd: 0.018, vfe: 220 },
      { notch: 3, cl: 0.48, cd: 0.040, vfe: 200 },
      { notch: 4, cl: 0.66, cd: 0.072, vfe: 185 },
      { notch: 5, cl: 0.82, cd: 0.125, vfe: 170 }
    ],
    gearCd: 0.038, rollRate: 0.45, pitchRate: 0.38, yawRate: 0.5,
    takeoffDist: 3500, crosswindLimit: 30, maxRangeNm: 8300, surfaces: ['asphalt'],
    rent: 42000, price: 0, bonus: 1.6, unlock: 'mriya', loads: ['outsize', 'outsize', 'cargo'],
    dims: { len: 84, span: 88.4, fus: 7.3 },
    look: { wing: 'high', engines: 'wing6', tail: 'twin', base: '#eae7df', color: '#b0915f', finish: true, sweep: 32, dihedral: -3, tall: 1.1, fan: 0.38, mainRows: 7, sponsons: true, freighter: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  }
];

// ---------- The hangar's weight filter (ui/filters.js) ----------
const HANGAR_FILTER = {
  LIGHT_T: 30,                 // "light": up to this maximum take-off weight, tonnes
  HEAVY_T: 100                 // "heavy": over this one (and the widebodies are the jets over it)
};

// ---------- Payload types ----------
// maxKg: the biggest consignment of a load paid at its own rate (dangerous goods, mail, the cold
// chain): a freighter bigger than that takes general freight or outsize loads instead
const PAYLOAD = {
  pax: { name: 'Passengers', ratePerKg: 3.4, label: 'passengers' },
  bag: { name: 'Hold baggage', ratePerKg: 0.5, label: 'kg of baggage' },
  cargo: { name: 'General freight', ratePerKg: 1.8, label: 'kg of freight' },
  reefer: { name: 'Reefer freight', ratePerKg: 2.6, label: 'kg of reefer freight', coldChain: true, maxKg: 40000 },
  hazmat: { name: 'Dangerous goods', ratePerKg: 3.6, label: 'kg of dangerous goods', hazard: true, maxKg: 15000 },
  mail: { name: 'Mail and light freight', ratePerKg: 2.6, label: 'kg of mail', maxKg: 12000 },
  medevac: { name: 'Medevac', ratePerKg: 6.5, label: 'kg of medevac load', urgent: true },
  fish: { name: 'Fresh fish', ratePerKg: 2.3, label: 'kg of fish', coldChain: true, maxKg: 30000 },
  // the loads of a type with loads of its own (the Beluga's): bulky rather than heavy, paid for the hold they fill
  parts: { name: 'Aircraft sections', ratePerKg: 3, label: 'kg of aircraft sections' },
  outsize: { name: 'Outsize freight', ratePerKg: 3.4, label: 'kg of outsize freight' }
};

// ---------- Client factions ----------
const FACTIONS = {
  pax: { id: 'pax', name: 'Passenger airlines', short: 'Passenger', color: '#4fa3ff' },
  cargo: { id: 'cargo', name: 'Cargo carriers', short: 'Cargo', color: '#e8a13a' },
  bush: { id: 'bush', name: 'Bush & air ambulance operators', short: 'Bush & SAR', color: '#63d6a8' }
};

// ---------- Emergency checklists (QRH) ----------
// The emergencies and their checklists are in data/emergencies.js.
const QRH = {
  STEP_HOLD: 0.45,          // seconds a step done with a control stays ticked before the next one lights up
  BOTTLE2_CHANCE: 0.3,      // the first fire bottle is not enough
  RELIGHT_CHANCE: 0.4,      // a failed engine starts again
  CLIMB_FPM: 500,           // the 'climb' step: at least this climb rate
  IDLE_MAX: 0.05,           // the 'idle' step: the thrust levers at or below this
  LOW_FUEL_SHARE: 0.1,      // FUEL STATE: the share of the fuel on board the headwinds and the routing took beyond the plan
  OUTCOME_SEC: 9            // how long the result of a checklist stays on the screen
};

// ---------- Training courses ----------
// The technology tree: one general branch plus three career branches, four tiers each.
// A course opens once the courses it `requires` are passed, the pilot has flown `flights` flights in
// all and has `rep` reputation with its branch's clients (general courses: with any). Every course
// asks for a different number of flights, so they open one by one, not in bunches.
const COURSES = [
  // General
  { id: 'gen1', branch: 'general', tier: 0, name: 'Ground School', cost: 0, requires: [], flights: 0,
    blurb: 'Basic theory, aircraft handling, the standard operating procedures of a small operator. Everyone starts here.',
    effect: 'The foundation of your career.', course: 'pax' },
  { id: 'gen2', branch: 'general', tier: 1, name: 'Aviation Weather', cost: 15000, requires: ['gen1'], flights: 3,
    blurb: 'METAR, TAF, windshear and icing analysis. Better forecasts mean better fuel plans.',
    effect: 'Shows the full forecast at both ends, +10% fuel margin planning, 20% less icing.', course: 'pax' },
  { id: 'gen3', branch: 'general', tier: 2, name: 'Advanced Systems', cost: 50000, requires: ['gen2'], flights: 9,
    blurb: 'Hydraulics, generators, pressurisation and the QRH — and how to work it under pressure.',
    effect: 'Checklist hints explain every step, +40% response time on every emergency.', course: 'pax' },
  { id: 'gen4', branch: 'general', tier: 3, name: 'CRM & Cabin Safety', cost: 180000, requires: ['gen3'], flights: 21,
    blurb: 'Crew resource management, cabin crew briefing, medical response and awkward passengers.',
    effect: '+60% emergency response time, medical emergencies pay, +5 reputation per flight.', course: 'pax' },
  // Passenger
  { id: 'pax1', branch: 'pax', tier: 1, name: 'Regional Jet Ops', cost: 25000, requires: ['gen1'], flights: 5, rep: 3,
    blurb: 'Jet handling for the CRJ200: high rotation thrust, higher stall speeds, pressurised climb profiles.',
    effect: 'Unlocks the Bombardier CRJ200 and regional jet contracts.', course: 'pax' },
  { id: 'paxtp', branch: 'pax', tier: 1, name: 'Regional Turboprops', cost: 10000, requires: ['gen1'], flights: 1, rep: 0,
    blurb: 'The ATR 72 on short hops: propeller handling, feathering, de-icing boots and six sectors a day.',
    effect: 'Unlocks the ATR 72-600; +10% pay on legs under 300 nm in a turboprop.', course: 'pax' },
  { id: 'pax2', branch: 'pax', tier: 2, name: 'Instrument Rating (IFR)', cost: 70000, requires: ['pax1'], flights: 13, rep: 15,
    blurb: 'Flying the approach when you cannot see the runway: ILS, NDB, circling and a missed approach flown well.',
    effect: 'Unlocks the Boeing 737-800, low-visibility and IMC contracts.', course: 'pax' },
  { id: 'paxfbw', branch: 'pax', tier: 2, name: 'Fly-by-Wire Jets', cost: 100000, requires: ['pax1'], flights: 15, rep: 20,
    blurb: 'Side-sticks, flight computers and envelope protection: how a modern jet flies, and what is left when its computers degrade.',
    effect: 'Unlocks the Embraer E195-E2 and the Airbus A220-300.', course: 'pax' },
  { id: 'pax3', branch: 'pax', tier: 3, name: 'Mountain & Adverse Weather', cost: 150000, requires: ['pax2'], flights: 27, rep: 35,
    blurb: 'Bergen in the rain, Tromsø in January: terrain, windshear, downdrafts and steep approaches.',
    effect: 'Unlocks the Airbus A320-200 and A320neo, mountain and arctic passenger routes, +15% payout on adverse-weather contracts.', course: 'pax' },
  { id: 'pax4', branch: 'pax', tier: 4, name: 'Widebody Procedures', cost: 500000, requires: ['pax3'], flights: 43, rep: 60,
    blurb: 'Two hundred tonnes of aeroplane: longer checklists, heavier landings, higher Vref and hot-and-high limits.',
    effect: 'Unlocks the Airbus A350-900, the Boeing 777-300ER, the Airbus A380 and the long-haul contracts.', course: 'pax' },
  { id: 'paxetops', branch: 'pax', tier: 4, name: 'ETOPS & Ocean Crossings', cost: 350000, requires: ['pax3'], flights: 39, rep: 55,
    blurb: 'Two engines over the ocean: diversion times, alternates, the drift-down and the fuel for the worst case.',
    effect: 'Unlocks the Airbus A330-300 and the Boeing 787-9; +10% pay on legs over 1 500 nm in a twin-engine jet.', course: 'pax' },
  // Cargo
  { id: 'cargo1', branch: 'cargo', tier: 1, name: 'Dangerous Goods', cost: 10000, requires: ['gen1'], flights: 2, rep: 0,
    blurb: 'Class 3 flammable liquids, lithium batteries and the paperwork that comes with them.',
    effect: 'Unlocks hazardous-goods contracts (+80% rate).', course: 'cargo' },
  { id: 'cargo2', branch: 'cargo', tier: 2, name: 'Weight & Balance', cost: 40000, requires: ['cargo1'], flights: 7, rep: 10,
    blurb: 'Loading, trim, aft CG limits and what a badly loaded freighter does on rotation.',
    effect: 'Unlocks the Fokker F27-600F, +15% payload tolerance, load-shift emergencies handled better.', course: 'cargo' },
  { id: 'cargo3', branch: 'cargo', tier: 3, name: 'Arctic Ground Handling', cost: 120000, requires: ['cargo2'], flights: 18, rep: 30,
    blurb: 'De-icing procedures, cargo holds in the cold, snow banks and gravel aprons.',
    effect: 'Unlocks ice-field and reefer contracts, icing builds 35% slower.', course: 'cargo' },
  { id: 'cargo4', branch: 'cargo', tier: 4, name: 'Heavy Freighter Ops', cost: 250000, requires: ['cargo3'], flights: 31, rep: 50,
    blurb: 'Main-deck loading, fifty tonnes of freight and the most demanding schedules in the north.',
    effect: 'Unlocks the Boeing 767-300F, the Boeing 747-8F and ultra-long contracts.', course: 'cargo' },
  { id: 'cargo5', branch: 'cargo', tier: 5, name: 'Outsize Cargo', cost: 700000, requires: ['cargo4'], flights: 48, rep: 70,
    blurb: 'Turbines, helicopters, locomotives and aircraft wings: the An-124\'s lifting nose, kneeling gear and roof cranes, the Beluga\'s door over the cockpit, and tie-downs for loads that fit nothing else.',
    effect: 'Unlocks the Antonov An-124 Ruslan (120 tonnes onto long gravel and ice runways), the Airbus Beluga and the BelugaXL (aircraft sections for Airbus).', course: 'cargo' },
  // Bush & SAR
  { id: 'bush1', branch: 'bush', tier: 1, name: 'Short Field Ops', cost: 15000, requires: ['gen1'], flights: 4, rep: 0,
    blurb: 'Take-off and landing in half the distance, on grass, gravel and sand.',
    effect: 'Unlocks the DHC-6 Twin Otter, grass strips and STOL contracts.', course: 'bush' },
  { id: 'bush2', branch: 'bush', tier: 2, name: 'De-icing & Winter Survival', cost: 70000, requires: ['bush1'], flights: 11, rep: 15,
    blurb: 'Carburettor and airframe icing, engine anti-ice, and survival in a winter cabin.',
    effect: 'Icing builds 45% slower, icing emergencies give 30% more time, winter contracts pay +20%.', course: 'bush' },
  { id: 'bush3', branch: 'bush', tier: 3, name: 'Medevac & SAR Contracts', cost: 250000, requires: ['bush2'], flights: 24, rep: 35,
    blurb: 'Search and rescue, medevac flights and getting there before the weather closes the strip.',
    effect: 'Unlocks urgent SAR and medevac contracts (up to 3x the rate).', course: 'bush' },
  { id: 'bush4', branch: 'bush', tier: 4, name: 'Seaplane & Remote Bases', cost: 400000, requires: ['bush3'], flights: 35, rep: 50,
    blurb: 'Floats, skis and strips with no fuel, no lights and no second attempt.',
    effect: 'Unlocks ice fields and remote strips for every aircraft type.', course: 'bush' }
];

// The exam questions (in English, Russian and Swedish) are in data/quizzes.js.

// ---------- The Mriya's assembly hall (ui/mriya.js) ----------
// The An-225 is built from 50 parts (data/mriya.js), bought at any time. Each part costs money —
// its share of PRICE_KR (`kr` / the sum of every part's `kr`), so changing the total re-prices
// every part — and asks for a level of the reputation of one client group, never spent: within
// each group the cheapest part asks for REP_MIN, the dearest REP_MAX, the rest evenly between by
// their price (Career.mriyaPrice).
const MRIYA = {
  PRICE_KR: 6000000,           // all 50 parts together, kronor
  REP_MIN: 5,                  // the reputation the cheapest part of a group asks for ...
  REP_MAX: 70,                 // ... and the dearest
  ROUND_KR: 1000,              // a part's price is rounded to this many kronor ...
  ROUND_REP: 1,                // ... and its reputation to this
  SNAP_M: 7,                   // a part let go this close to its place (metres on the blueprint) snaps into it
  KEY_STEP_M: 1.6,             // the arrow keys move a part this far (Shift: a quarter of it)
  SPIN_S: 48,                  // the hologram turns once round in this many seconds
  FINISH_KR: 1000000           // a finish (data/mriya.js) costs its `price` times this, kronor, once (1 to 5 million)
};

// ---------- Round the world (sim/rtw.js, ui/rtw.js; the routes and the sponsor: data/rtw.js) ----------
// A chain of legs in one aeroplane from the home base round the globe and back, by the rules of
// the real round-the-world records: every leg the same way round, 360° of longitude in all, at
// least the length of the Tropic of Cancer.
const RTW = {
  MIN_KM: 36788,               // the shortest route that counts: the Tropic of Cancer, km
  COURSE: 'paxetops',          // opens with this course (ETOPS & Ocean Crossings) and every region's rights
  REWARD_KR: 1500000,          // a finish pays this ...
  REWARD_REP: 5,               // ... and this much reputation with every client group
  IRON_MULT: 2,                // an Iron finish: the reward times this
  HISTORY_MAX: 30,             // expeditions kept in the history
  BANNER_MS: 6000              // the equator, the date line and halfway round: their banner in the flight, ms
};

// ---------- Contract generation ----------
// All money is Swedish kronor (SEK).
const CONTRACTS = {
  // how many contracts the board offers: this many at the start (a short board, not to get lost
  // in), OFFERS_PER_REGION more for every region opened after the first and one more for every
  // OFFERS_PER_FLIGHTS flights flown, up to OFFERS_MAX
  OFFERS: 6,
  OFFERS_PER_REGION: 2,
  OFFERS_PER_FLIGHTS: 5,
  OFFERS_MAX: 20,
  // the client groups are dealt evenly over the board (each offer goes to the group with the
  // fewest offers so far that its destination and the aeroplane allow); what each group carries:
  PAX_TYPES: ['pax'],
  CARGO_TYPES: ['cargo', 'cargo', 'reefer', 'fish', 'hazmat', 'mail'],
  BUSH_TYPES: ['mail', 'cargo', 'fish'],
  // what a type needs to work for each group (Career.suits): passengers more than PAX_SEATS
  // seats, freight a payload of CARGO_KG; bush work a type cleared for grass or ice, and the
  // Short Field Ops course or BUSH_REP reputation in any group
  PAX_SEATS: 12,
  CARGO_KG: 1000,
  BUSH_REP: 3,
  BASE_PAY_PER_NM: 58,           // SEK per real nautical mile, before the payload fee
  PAYLOAD_FEE_NM: 650,           // load fee = kg x PAYLOAD rate x nm / this
  // The pilot's work is the departure and the arrival, not the cruise: a leg pays its whole
  // distance up to TAPER_NM and TAPER_SHARE of every mile beyond it, and every leg also pays
  // SECTOR_FEE_H hours of the type's lease (the landing and the turnaround), so a short leg in a
  // big type pays its way and a long one pays more, but not many times more
  TAPER_NM: 800,
  TAPER_SHARE: 0.5,
  SECTOR_FEE_H: 1,
  FACTION_MULT: { pax: 1.0, cargo: 1.05, bush: 1.2 },
  URGENT_MULT: 2.1,
  CLASS_MULT: [1, 1, 1, 1, 1.2],  // the pay by the type's class (Career.typeClass): the heaviest get the premium work
  NEW_DEST_MULT: 1.1,            // the first flight to an airport pays this much more (and REP.NEW_DEST)
  // the stars of a contract's difficulty (Career.contractStars, 1-5): one, and one more each for
  // mountains at either end, an Arctic field, a runway under STAR_RWY_MARGIN x the type's
  // take-off distance, a remote strip, dangerous goods or a medevac; every star above the first
  // pays STAR_MULT more and earns STAR_MULT more reputation
  STAR_RWY_MARGIN: 1.3,
  STAR_MULT: 0.08,
  // a bush or rescue flight pays a mission fee per star, more with every Bush & SAR course passed
  // (none, Short Field Ops ... Seaplane & Remote Bases), so the hard flights in a small type stay
  // worth flying when the airliners pay far more for the miles
  BUSH_FEE: [2000, 4000, 8000, 13000, 20000],
  TURBOPROP_SHORT_NM: 300,       // Regional Turboprops: legs shorter than this (real nm) in a turboprop
  TURBOPROP_SHORT_MULT: 1.1,     // ... pay this much more
  ETOPS_NM: 1500,                // ETOPS & Ocean Crossings: legs longer than this in a twin-engine jet
  ETOPS_MULT: 1.1,               // ... pay this much more
  // starting at the gate and flying the whole ground procedure yourself (push back, start, taxi
  // out) pays this share of the contract and this much reputation; starting after pushback
  // saves those minutes on the ground (and their lease) but earns neither
  FULL_GROUND_BONUS: 0.06,
  FULL_GROUND_REP: 0.3,
  CRASH_REP: 1,                // a lost flight: the reputation it costs with the client group (stopped by the police: COLLIDE.POLICE_REP)
  MAX_NM: 4500,                  // the longest contract, real nm (further: fly there in legs)
  FUEL_RESERVE_FACTOR: 1.45,     // block fuel = trip fuel x this + taxi fuel
  FUEL_MIN_FACTOR: 1.15,         // the load is cut so that the trip fuel x this still fits under the maximum take-off weight
  FUEL_TAXI_KG_PER_ENGINE: 25,
  FUEL_RATE: 4.3,               // SEK per kg of fuel burnt
  START_MONEY: 48000,
  START_DEBT_LIMIT: -50000,
  GRADE_MULT: { 'A+': 1.35, A: 1.22, B: 1.08, C: 0.95, D: 0.75, E: 0.55, F: 0.4 }
};

// ---------- Reputation (Career.makeContract, Career.payout) ----------
// What a flight earns with its client group: the work, not the kilograms — BASE, PER_CLASS for
// each class of the type (Career.typeClass: 0 turboprops, 1 regional jets, 2 narrowbodies,
// 3 widebodies, 4 the heaviest), LONG on a leg over LONG_NM, NEW_DEST at an airport never flown
// to; times the stars (CONTRACTS.STAR_MULT), URGENT on a medevac, the landing grade and the
// catch-up: CATCH_UP[0] − rep / CATCH_UP[1], at least CATCH_UP[2], so a group the pilot has
// worked for little grows fast and the last points to 100 come slowly. Reputation is a level the
// pilot earns, never spent: it opens courses, regions and the Mriya's parts.
const REP = {
  BASE: 1.2,
  PER_CLASS: 0.3,
  CLASS_T: [60000, 100000, 380000],  // a jet's class by its maximum take-off weight (kg): under these 1, 2, 3, else 4
  LONG_NM: 1500,
  LONG: 0.4,
  NEW_DEST: 0.4,
  URGENT: 1.5,
  CATCH_UP: [1.25, 130, 0.5]
};

// ---------- Weather ----------
const WEATHER = {
  WIND_SURFACE_MIN: 2,          // kt, at the surface
  WIND_ALT_MIN: 20,             // kt at cruise altitude
  WIND_ALT_MAX: 85,
  GUST_MIN: 0, GUST_MAX: 18,
  TURB_INTENSITY: 1.0,
  CLOUD_BASE_MIN: 200, CLOUD_BASE_MAX: 4200,  // metres
  VIS_GOOD: 25000, VIS_POOR: 1200,
  QNH_RANGE: [975, 1035],
  WIND_OFF_RUNWAY_MAX: 70,      // degrees the surface wind may be off the runway heading
  SNOW_TEMP_THRESHOLD: 1,
  LAPSE_RATE: 0.0065,           // deg C the air cools per metre of height (standard atmosphere)
  ICING_TEMP_MIN: -20, ICING_TEMP_MAX: 1,   // airframe icing in cloud or precipitation, deg C
  ICING_RATE: 0.012,            // ice fraction per second
  STORM_CHANCE_HARD: 0.3
};

// ---------- Camera / rendering presets ----------
// (landTex: the size of the land cover's tiles, texels: render/landcover.js; treeDetail: how round the
// crowns of the trees round an airport are, render/perimeter3d.js: 0 = 20 faces a crown, 1 = 80)
//   aptTex     the airport's ground texture along (px; the runway's twice that), at most the GPU's
//   otherAptM  the airports on the way (not the departure, not the arrival) are built this close
//   parkedM    the aeroplanes parked at the stands are drawn only this close to the eye (0: always;
//              they are still solid, sim/collide.js — at a big airport they are half the triangles)
//              (the arrival is built behind the boot screen with the flight: Scene3D.warmup)
// Very low and Minimal are for a big screen on a modest GPU (a tablet): the 3D picture is drawn
// at under one pixel per CSS pixel (pixelRatio < 1, stretched to the screen), nearer, with fewer
// clouds, lights and trees and smaller airport textures.
const QUALITY = {
  minimal: { name: 'Minimal', nearCells: 32, nearCell: 360, farCell: 8000, drawFar: 45000, maxPolys: 1500, clouds: 6, trees: 0, pixelRatio: 0.6, rain: false, maxCanvas: 1024, groundLights: 4000, landTex: 256, aptTrees: 0, treeDetail: 0, aptTex: 1024, otherAptM: 12000, parkedM: 2500 },
  verylow: { name: 'Very low', nearCells: 40, nearCell: 300, farCell: 7000, drawFar: 60000, maxPolys: 2000, clouds: 12, trees: 0, pixelRatio: 0.75, rain: false, maxCanvas: 1152, groundLights: 8000, landTex: 512, aptTrees: 0.2, treeDetail: 0, aptTex: 1536, otherAptM: 20000, parkedM: 4000 },
  low:    { name: 'Low',    nearCells: 48, nearCell: 240, farCell: 6000, drawFar: 80000, maxPolys: 2600, clouds: 22, trees: 0,   pixelRatio: 1,   rain: false, maxCanvas: 1280, groundLights: 14000, landTex: 512, aptTrees: 0.4, treeDetail: 0, aptTex: 2048, otherAptM: 30000, parkedM: 6000 },
  medium: { name: 'Medium', nearCells: 64, nearCell: 150, farCell: 5000, drawFar: 130000, maxPolys: 4200, clouds: 44, trees: 260, pixelRatio: 1.25, rain: true, maxCanvas: 1600, groundLights: 32000, landTex: 1024, aptTrees: 0.75, treeDetail: 0, aptTex: 4096, otherAptM: 46000, parkedM: 0 },
  high:   { name: 'High',   nearCells: 80, nearCell: 110, farCell: 4200, drawFar: 200000, maxPolys: 6500, clouds: 70, trees: 620, pixelRatio: 2,   rain: true, maxCanvas: 2560, groundLights: 60000, landTex: 1024, aptTrees: 1, treeDetail: 1, aptTex: 4096, otherAptM: 46000, parkedM: 0 }
};
// the presets from the lightest (the Auto quality steps down this way, the Graphics chips list them)
const QUALITY_ORDER = ['minimal', 'verylow', 'low', 'medium', 'high'];

// The Auto quality (Game.autoQuality): a flight running below LOW_FPS for LOW_S seconds sheds
// the next of STEPS, the least missed first, each only hidden or thinned (nothing is built again,
// so a step costs no stutter); above HIGH_FPS for HIGH_S it takes the last one back, but one that
// brings the low frame rate back within RELAPSE_S stays shed for the session. With every step
// shed and still slow the preset goes down (High, Medium, Low: built again). The first GRACE_S
// after something big was built (an airport, the terrain) do not count: that stutter passes.
//   trees   - the trees (round the airports too) in the dark, where they are black on black
//   clouds  - every other cloud
//   lights  - half the ground lights of the towns and villages at night (the villages first)
//   res1, res2 - the pixel ratio down to RES[0], then RES[1] of the preset's (never below 1)
const AUTO_QUALITY = {
  LOW_FPS: 30, LOW_S: 3, HIGH_FPS: 50, HIGH_S: 20, RELAPSE_S: 10, GRACE_S: 2,
  STEPS: ['trees', 'clouds', 'lights', 'res1', 'res2'],
  RES: [0.88, 0.8]
};

// a flight's (or a look round's) new scene is drawn this many times behind the boot screen
// before it shows (Game.holdBoot): the first draws are slow and the canvas holds the old picture
const BOOT_HOLD_FRAMES = 3;

// The landing (or taxi) lights' pool on the ground at night (Scene3D.updateLandingPool): full
// brightness within FULL_M of the lamps, then falling with the square of the distance (at 500 m a
// fifth), gone at REACH_M — a landing light does not light the ground up from 500 m high
const LANDING_POOL = { FULL_M: 220, REACH_M: 900, TAXI_FULL_M: 45, TAXI_REACH_M: 120 };

const VIEW = {
  FOV_DEG: 68,
  BUILDING_CLEAR_M: 3,          // the chase, front and wing views keep this far out of the buildings (Scene3D.clearOfBuildings)
  // the pilot's eye in the aircraft's own axes: x = right, y = up, z = forward (metres, an 18 m aeroplane)
  COCKPIT_EYE: { x: 0, y: 1.6, z: 5.5 },
  // the captain's seat: this far left of the centreline, as a fraction of the fuselage diameter
  // (about 0.5 m in an airliner), so the centre window post is off to the right, not ahead
  COCKPIT_SEAT_X: -0.14,
  // the centre post seen from that seat: how far ahead of the eye it is (as a fraction of the
  // fuselage diameter), so it sits about 30 degrees to the right
  CENTRE_POST_AHEAD: 0.24,
  // the views C cycles through (X, or Shift+C, goes back; Z jumps to the cockpit), and their names
  MODES: ['cockpit', 'chase', 'front', 'wing', 'tail', 'gear', 'top', 'down', 'tower'],
  NAMES: {
    cockpit: 'cockpit', chase: 'chase', front: 'front, looking back', wing: 'wing', tail: 'tail fin',
    gear: 'landing gear', top: 'top down', down: 'straight down, under the belly', tower: 'tower / fly-by'
  },
  // the tower / fly-by view (Scene3D.towerShot): a shot is held SHOT_S seconds of real time (a
  // random length in the range), from the nearest tower within TOWER_M, en route the fly-by shots
  // in this ORDER; a pass only while the aeroplane flies at most PASS_MAX_M in half a shot
  FLYBY: { SHOT_S: [3, 5], TOWER_M: 14000, PASS_MAX_M: 3000, ORDER: ['pass', 'lead', 'side', 'trail'] },
  // the tower view zooms in on the aeroplane (its span about 3/4 of the picture's height) down to
  // this field of view, degrees: a telephoto, so a jet on a 5 nm final still fills a good part of it
  TOWER_MIN_FOV_DEG: 1.8,
  // the taxi arrow lies on the ground as the camera sees it (HUD.groundArrow): tilted back by
  // the camera's look at the ground, at most this far (degrees: 90 would be edge-on), in a
  // perspective this deep (px; less is a stronger 3D look)
  TAXI_ARROW_MAX_TILT_DEG: 58,
  TAXI_ARROW_PERSPECTIVE_PX: 140,
  NEAR_CLIP: 0.7,
  // the haze is about HAZE_M deep: above it the fog thins as the height grows, to HAZE_MIN of
  // its density, so from the cruise the ground below still shows (Scene3D)
  HAZE_M: 2000, HAZE_MIN: 0.15,
  FOG_DENSITY: 1 / 62000,      // 1/e per metre
  COCKPIT_DRAW_DIST: 12000
};

// The camera's flights at both ends of a flight (render/cinematic.js): before the start it
// flies from a wide shot of the aeroplane and the terminal (or the runway) into the captain's
// seat; parked at the arrival gate it flies out of the cockpit to a wide shot of the aeroplane
// at its gate, then the debrief. Enter, Space, Esc or a tap skips it.
const CINEMATIC = {
  INTRO_S: 6.5,                // the fly-in, seconds (the last tenth inside the cockpit)
  OUTRO_S: 5.5,                // the fly-out, out to a shot of the whole aeroplane from behind and above, three quarters on ...
  OUTRO_HOLD_S: 30,            // ... held while the ground crew comes (Turnaround3D) until they are done, a tap or this long
  OUTRO_ELEV_DEG: 30,          // that shot: the camera this high above the aeroplane's middle ...
  OUTRO_AZ_DEG: 40,            // ... this far round from straight behind (on the right, where the ground crew works)
  OUTRO_FIT: 0.62,             // ... and far enough for this share of the aeroplane's biggest size to fill half the narrower view,
  OUTRO_PAD_M: 24,             // ... and this much further (a small aeroplane's ground crew in the picture too)
  FROM_CLEAR: 0.6,             // watched from outside, the outro goes by way of a point this share of the aeroplane's size out
  CAPTION_S: 4.2               // the route under the intro's picture: shown this long
};

// The ground crew at the arrival stand once the engines are off (render/turnaround3d.js): they
// drive at SPEED_K times a baggage train's speed, from FROM_M along the service road, down beside
// the aeroplane OUT_M out from the fuselage, one every STAGGER_S; done LINGER_S after the last is there
const TURNAROUND = { SPEED_K: 2.2, FROM_M: 170, OUT_M: 22, STAGGER_S: 2.5, LINGER_S: 4,
  LOOK_M: 7, GAP_M: 2.8,       // a vehicle waits for anything within GAP_M of its way over LOOK_M past its front ...
  WAIT_MAX_S: 8 };             // ... at most this long

// The ground crew's ways round a parked aeroplane (render/servicing.js: the turnaround's vehicles,
// the baggage trains, the parked aeroplanes' fuel trucks)
const SERVICE = {
  PAD_M: 1.2,                  // a vehicle's side keeps this far off the aeroplane seen from above ...
  HEAD_M: 0.4,                 // ... unless it passes under the part with this much headroom
  BODY_PAD_M: 0.5,             // ... and this far off a vehicle standing there (the fuel truck, for the trains)
  WING_PANELS: 6,              // each wing taken in this many panels from root to tip, each as low as its lower end
  STEP_M: 1,                   // the lanes down the side are tried this far apart
  FUEL_SHIFT_M: 6,             // the fuel truck's lane moves at most this far in or out to pass between the engines
  PLACE_SHIFT_M: 10,           // a place by the fuselage moves at most this far along it to stand clear of the engines and the wing
  TRAIN_STOP_OUT_M: 10,        // a baggage train stops beside the belt loader this far out from the fuselage's side ...
  TRAIN_DOWN_M: 22,            // ... comes down the side at least this far out ...
  TRAIN_TURN_M: [12, 6]        // ... and on the way back turns out behind the wing this far (at most, at least) ahead of its stop
};

// A look round an airport from the briefing (free): the camera flies in on the approach, low
// down the runway, round over the terminal and down to the own aeroplane at its stand (or the
// holding point), circles it and holds, then the briefing is back. Enter, Space, Esc or a tap
// end it sooner. The weather and the hour are the ones the flight meets there, only a clear
// spell: at least MIN_VIS_M of visibility and the cloud base above the camera.
const TOUR = {
  SPEED_MS: 210,               // the camera's speed between the keys, m/s (the runway pass is as long as the runway)
  CLOSE_S: [5, 7],             // ... but down to the aeroplane and round it at least this long, seconds
  HOLD_S: 2,                   // the last shot holds this long
  APPROACH_M: 2600,            // starts this far out on the approach, before the threshold ...
  START_AGL_M: 240,            // ... this high
  MIN_VIS_M: 9000,             // visibility at least
  MIN_CLOUD_M: 600             // the cloud base at least this high above the field
};

// A look at an aircraft type from the hangar (free, ui/showcase.js): it flies straight and
// level over the airport the pilot is at, gear up, on a clear afternoon, while the camera
// circles it (Cinematic.around) from ahead on its left, up over it, down under its belly and
// back up to ahead on its right, then the hangar is back. Enter, Space, Esc or a tap end it
// sooner, P (or its button) pauses it.
const SHOWCASE = {
  DUR_S: 44,                   // the camera's flight round it, seconds
  HOLD_S: 2,                   // the last shot holds this long
  KEY_S: 1.1,                  // a key of the camera's path about this often, seconds
  START_DEG: -35,              // where the camera starts: degrees round from the nose (negative: its left)
  SWEEP_DEG: 645,              // ... and how far it goes round (to ahead on the right)
  MID_DEG: 6,                  // the camera's height over it, degrees: a sine round this ...
  SWING_DEG: 66,               // ... this far up (over it, a quarter in) and down (under it, three quarters in)
  DIST: 1.15,                  // the camera's distance: this times the type's length or span (the larger) ...
  DIST_M: 14,                  // ... plus this, metres
  IN: 0.35,                    // it starts this much further off and comes in
  FOV_DEG: 46,                 // the field of view
  SPEED_VREF: 1.3,             // the speed: this times its landing speed (Vref)
  AGL_M: 320,                  // the height over the ground at least, metres
  HOUR: 15.5,                  // the local solar hour (an afternoon light)
  VIS_M: 30000,                // visibility
  CLOUD_M: 1800                // the cloud base above the field
};

// ---------- Controls and screen layout ----------
// The time of day, chosen on the briefing: the departure's local solar time (the clock runs
// on with the flight). The sun follows a generic path (equinox, latitude SKY_LATITUDE_DEG):
// up at 6, highest (40°) at noon, down at 18. Flying in the dark is harder and pays more:
// `bonus` is a share of the contract.
const TIME_OF_DAY = {
  day: { name: 'Day', hour: 13, bonus: 0 },
  dusk: { name: 'Dusk', hour: 17.7, bonus: 0.05 },
  night: { name: 'Night', hour: 23, bonus: 0.15 },
  dawn: { name: 'Dawn', hour: 6.3, bonus: 0.05 }
};
const SKY_LATITUDE_DEG = 50;
// The night sky: the moon's phase is drawn per flight from the contract (a retry has the same
// moon) and ages with the flight; the stars turn round the pole with the clock.
const MOON_MONTH_DAYS = 29.53;     // new moon to new moon: the moon rises about 50 min later each day
const SIDEREAL_RATE = 1.00274;     // the stars turn this much faster than the sun (a sidereal day)

// The practice landing (the briefing's "Practice the landing"): it starts on the final at the
// destination, the autopilot holds the glide path for a moment, then you land and brake below
// SIM.ROLLOUT_EXIT_KT. A paid simulator session with no penalties.
const PRACTICE = {
  HANDOVER_NM: 3,              // how far out on the final the autopilot hands over to the pilot ...
  AP_SECONDS: 10,              // ... after flying the glide path this long (seconds of flight): the start is that much further out
  MAX_AGL_FT: 3000,            // climbing above this (or flying 2 nm further out) ends it: no landing
  FEE_LEASE_SHARE: 0.05,       // the fee: this share of the aircraft's hourly lease ...
  FEE_MIN: 100,                // ... and at least this much (SEK)
  REP: { 'A+': 0.5, A: 0.4, B: 0.2, C: 0.1 }   // reputation by grade; per contract only the best grade counts
};

// The flight school (data/lessons.js, sim/lesson.js, ui/coach.js, ui/school.js): free lessons in
// the simulator, a step at a time, the instructor's hands on the controls where a beginner needs them
const SCHOOL = {
  LOOK_S: 6,                   // a step that only shows something moves on after this long (real seconds) ...
  STEP_HOLD_S: 0.9,            // ... and one that is done stays ticked this long before the next lights up
  PITCH_UP_MAX_DEG: 15,        // the instructor's hand on the yoke: never more nose up than this ...
  PITCH_DOWN_MAX_DEG: 7,       // ... nor more nose down (in the air) ...
  BANK_MAX_DEG: 25,            // ... nor more bank, and never down to the stall warning
  HOLD_INPUT: 0.15,            // a stick under this (either way) leaves the wings or the centreline to the instructor
  FLARE_ZONE_FT: 60,           // below this on the final the instructor watches the flare: ...
  FLARE_PITCH_MAX_DEG: 7,      // ... no more nose up than this, no climbing away (a balloon) ...
  CATCH_FPM: 800,              // ... and a sink faster than this in the last 30 ft is caught (the hard limit is 1000)
  LAT_GAIN: 0.03,              // the instructor's lateral hold: degrees of track per metre off the centreline ...
  LAT_MAX_DEG: 12,             // ... at most this far off the runway's heading, closing it ...
  LAT_BANK_PER_DEG: 1.4,       // ... with this much bank per degree of track error (up to BANK_MAX_DEG / 2)
  GROUND_GAIN: 0.04,           // on the runway: degrees of heading per metre off the centreline (the take-off roll, the rollout)
  LINEUP_THRUST: 0.45,         // until lined up for the take-off the instructor holds the thrust at most here
  AP_FLOOR_FT: 60,             // the second try at a landing: the autopilot flies the glide path down to this height
  FLARE_FT: 40,                // the third try: the instructor flares from this height ...
  FLARE_SINK_FPM: 160,         // ... down to this sink rate at the touchdown, the throttle to idle
  QRH_TIME_FACTOR: 2,          // a lesson's checklist has this many times the time, and its hints
  ICING_AFTER_S: 20            // the whole flight's icing starts this long after its step lights up (simulated seconds)
};

const CONTROLS = {
  THROTTLE_CURVE: 1.8,         // thrust = lever position ^ this: the low end of the lever is finer (taxi power)
  THROTTLE_KEY_RATE: 0.45,     // lever travel per second with Z / X
  THR_LABEL_MAX_PCT: 80,       // the touch slider's THR label hides above this thrust (the knob reaches it)
  REPEAT_DELAY_MS: 450,        // a held touch button for the flaps or the time steps on after this ...
  REPEAT_EVERY_MS: 260,        // ... then once every this
  // the instrument lights, dimmest first (how much of the panel's light is left); I steps up
  // through them, from the brightest one more press hides the panel and the heading strip for
  // the whole view, and the next brings it back dim. A flight starts bright.
  INSTRUMENT_LIGHTS: [0.3, 0.6, 1],
  INSTRUMENT_DIM_DARK: 0.75,   // the panel is darkened by (1 - light) times this
  // the hydraulic actuators: how fast each control surface follows the stick, in full
  // deflections per second (a key press does not throw a surface to its stop at once)
  SURFACE_RATE: { aileron: 2.0, elevator: 1.6, rudder: 1.2 },
  MINIMAP_MIN_W: 1100,         // the mini map in the corner: desktop windows at least this wide ...
  MINIMAP_MIN_H: 640,          // ... and this tall
  MINIMAP_FPS: 6,              // the mini map is redrawn this often
  MAP_GLIDE: 0.15,             // a following map moves this share of the way to its new framing each mini map frame
  // a phone shows the fuel only when it is short (HUD.fuelShort): leaking, the low-fuel light, or
  // less on board than this many times what the rest of the route takes as the contract planned
  // it (a flight starts with at least 1.15 times its trip fuel, CONTRACTS.FUEL_MIN_FACTOR)
  FUEL_SHOW_MARGIN: 1.05
};

const PALETTE = {
  skyTop: '#2b6fb5',
  skyHorizon: '#bcd8ef',
  skyGround: '#9fb0a6',
  night: '#0a1226',
  sun: '#fff6d8',
  fogDay: '#c3d6e6'
};

const UI_KEY_LOCK_MS = 700;     // ms a screen that has just come up over the flight (debrief, failure, pause) ignores the arrows, Space and Enter (ui/ui.js)
const UI_FOLD_MS = 260;        // ms a training branch takes to fold or unfold (ui/ui.js; the same in styles.css)
const CURSOR_HIDE_MS = 3000;    // ms the mouse must stay still in fullscreen before the cursor hides (core/cursor.js)
