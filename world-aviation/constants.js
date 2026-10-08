'use strict';

// ============================================================
// World Aviation — game tuning constants
// All gameplay numbers live here: world geometry, aircraft
// performance, weather, difficulty tables, emergency
// quick-reference checklists, training courses, contract rates.
// Units: metres, m/s, knots (kt), kilograms, seconds, SEK.
// ============================================================

// ---------- The pilot and the home base ----------
// You are a Swedish pilot with an EASA ATPL, based at Stockholm Arlanda.
// Every contract is flown out of, or back to, your home base.
const CAREER = {
  HOME_BASE: 'ARN',
  PILOT_NAME_DEFAULT: 'Sven Ekman',
  PILOT_LICENSE: 'EASA ATPL',
  PILOT_COUNTRY: 'Sweden',
  PILOT_CITY: 'Stockholm',
  INTRO: 'You are a Swedish commercial pilot with an EASA ATPL, based at Stockholm Arlanda with one leased turboprop. Start with Sweden, win Scandinavia, then buy the traffic rights to the rest of the world, one region at a time.'
};

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
  TIME_ACCEL_CHEAT: 1024,      // the Alt+6 cheat (where x512 is allowed)
  TIME_ACCEL_MIN_ALT_M: 150,   // time acceleration only above this height AGL
  TIME_ACCEL_AP_MAX: 128,      // with the autopilot engaged: up to x128 in any phase ...
  TIME_ACCEL_CRUISE_MAX: 512,  // ... and up to x512 in the cruise on NAV, back at x128 by the top of descent
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
  TIME_ACCEL_RESUME_S: 1,      // after an emergency the time climbs back one step every this many real seconds
  CABIN_ON_TIME_MIN: 3,        // the arrival announcement: within this many minutes of the plan is on schedule
  // flying by hand: the fastest step allowed above each height AGL (feet)
  TIME_ACCEL_MANUAL: [{ aglFt: 1000, max: 2 }, { aglFt: 3000, max: 4 }, { aglFt: 6000, max: 8 },
    { aglFt: 8000, max: 16 }, { aglFt: 9000, max: 32 }, { aglFt: 10000, max: 64 }],
  TAXI_LIMIT_KT: 20,           // the taxi speed limit the prompts give
  TAXI_OVERSPEED_KT: 40,       // twice the limit off the runway: a taxi overspeed, reported and fined
  TAXI_OVERSPEED_FINE: 0.03,   // ... of the contract's pay
  NO_CLEARANCE_FINE: 0.05,     // lifting off before the take-off clearance costs this share of the contract pay
  MAX_STEPS_PER_FRAME: 300,    // physics steps per rendered frame at most (x128 at 25 fps)
  CRUISE_ALT_MIN: 2500,
  CRUISE_ALT_MAX: 11300,
  FUEL_BURN_TAXI_PER_ENGINE: 22,  // kg/h per engine while taxiing
  GEAR_TRANSIT_S: 6,
  FLAP_TRANSIT_S: 2.5,         // seconds per flap notch
  BRAKE_RAMP_S: 0.35,          // seconds for the wheel brakes to reach full pressure
  NOSEWHEEL_MAX_STEER_DEG: 38,
  NOSEWHEEL_STEER_RATE_DEG: 22, // degrees per second the hydraulic nosewheel steering turns at
  GROUND_YAW_ACCEL: 0.9,       // rad/s² at most: how fast the turn rate on the ground builds up (the aeroplane's inertia)
  ENGINE_IDLE_N1: 0.22,        // N1 at idle, thrust scales from here to 100 %
  PUSHBACK_S: 14,              // how long the tug takes
  CRASH_BANK_DEG: 25,          // a wing on the ground at more bank than this is a crash
  SPOILER_BRAKE_GAIN: 0.35,    // the spoiler out on the ground: the wheel brakes this much stronger
  FLARE_TRIM_HOLD_M: 150,      // by hand on the approach below this height (AGL) the pitch trim stays put
  RADIO_ALT_MAX_FT: 2500,      // the radio altitude (height above the ground) shows in the attitude indicator below this
  DECISION_HEIGHT_FT: 200,     // ... and turns amber below this on the way down to land
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
  FLAPS_PROMPT_NM: 15,         // on the approach the prompt asks for the flaps from here (whenever the next step fits the speed) ...
  GEAR_PROMPT_NM: 8,           // ... and for the gear from here
  LOC_TIME_S: 22,              // the localiser closes a cross-track error with this time constant
  LOC_TURN_MARGIN: 1.25,       // the localiser intercept plans its turn on this many times the autopilot's turn radius
  AP_ROLL_IN_S: 3,             // ... after this long rolling into the bank (for a roll rate of AP_ROLL_IN_REF; slower types take longer)
  AP_ROLL_IN_REF: 0.85,
  LOC_MIN_EST_NM: 5,           // the localiser is captured only where the turn onto it ends at least this far out
  AP_BANK_DEG: 25,             // the autopilot's bank in a turn
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
  EXIT_DECEL_MS2: 1.5,         // braking assumed to slow down for a runway exit ...
  EXIT_TURN_M: 25,             // ... plus the room for the turn itself
  EXIT_MIN_LEAD_M: 30,         // an exit nearer than this ahead is never the one to take
  EXIT_COMMIT_DEG: 20          // turned this far off the runway heading: you are taking this exit, it stays
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
  EXITS: [0.45, 0.65, 0.85],   // runway exits as a fraction of the length
  APRON_LANE: 300,             // taxi lane on the apron (100 m lead-in to the stands: room for a 747 to straighten up)
  STAND: 400,                  // the parking position (nose-in towards the terminal)
  TERMINAL: 470,               // terminal building centre
  APRON_START: 0.3,            // where the apron starts, fraction of the runway length
  GATE_SPACING: 80,
  TERMINAL_GAP: 70,            // between two terminals of a big airport, along the apron
  // the terminals and their stands by the airport's size and its runway, from one terminal with
  // one stand to three with three each: [the runway at least (m), terminals, stands in each]
  // (the last row whose runway length the airport's runway reaches)
  TERMINAL_PLANS: {
    tiny: [[0, 1, 1]],
    small: [[0, 1, 2]],
    medium: [[0, 1, 3], [3000, 1, 4]],
    big: [[0, 2, 2], [3200, 3, 2], [3800, 3, 3]]
  },
  LANE_MAX_STANDS: 2,          // a lane off the taxiway into the apron at least every this many stands
  LANE_SNAP_M: 50,             // a lane this near a runway exit along the taxiway meets it at the exit (or
                               // moves this far from it)
  LANE_STAND_CLEAR_M: 25,      // ... if it stays this far from every stand's lead-in
  // the wingspan an airport's stands and taxiways take (ICAO Annex 14 codes: C under 36 m, D under
  // 52 m, E under 65 m, F under 80 m); a bigger aeroplane may still be flown there, with a warning
  MAX_SPAN: { tiny: 36, small: 52, medium: 65, big: 80 },
  FILLET_R: 38,                // the centreline radius where taxiways meet at an angle
  FILLET_STAND_R: 30,          // ... and where a stand's lead-in leaves the apron lane
  FILLET_EXIT_R: 60,           // ... and where a runway exit (or the line-up) leaves the runway, on both sides
  CORRIDOR_LEN: 32000,         // approach / departure corridors cut into the terrain, metres from the runway ends
  CORRIDOR_HALF_WIDTH: 1200,   // plus 12 % of the distance, then 2.5 km to blend into the terrain
  APPROACH_SLOPE_DEG: 2.4,     // the ground stays under this slope before the threshold (the glideslope is 3°)
  APPROACH_FLOOR_FT: 1500,     // ... and at most this far over the field: 1 000 ft under the 2 500 ft the
                               // autopilot levels at before it meets the glide path
  DEPARTURE_SLOPE_DEG: 3.5,    // and under this one past the far end of the runway
  TAXI_KT: 15                  // comfortable taxi speed, knots
};
// the buildings behind the terminal, beyond the car park, by the terminal's size:
// [t from the apron's middle, across (from the runway centreline), along, across size, height] in metres, kind
const LANDSIDE = {
  tiny: [],
  small: [[40, 700, 50, 26, 13, 'office']],
  medium: [[-80, 705, 110, 50, 13, 'carpark'], [40, 698, 44, 22, 34, 'hotel'], [110, 700, 54, 28, 17, 'office']],
  big: [[-150, 705, 140, 50, 16, 'carpark'], [-30, 698, 50, 24, 46, 'hotel'], [60, 700, 64, 30, 28, 'office'], [150, 700, 56, 30, 38, 'office']]
};

// ---------- Difficulty ----------
const DIFFICULTY = {
  easy: {
    id: 'easy', name: 'Easy',
    windFactor: 0.5, turbulence: 0.45, icingChance: 0.5,
    qrhTimeFactor: 1.5, emergencyOverlap: 0,
    qrhHint: true,
    deadlineFactor: 2.0, touchdownTolerance: 0.35, gradeBonus: 0.15,
    fuelPenaltyFactor: 0.5, damageFactor: 0.6,
    description: 'Calm weather, one problem at a time with a long grace period, checklists come with hints, generous landing grading and no deadlines.'
  },
  medium: {
    id: 'medium', name: 'Medium',
    windFactor: 1.0, turbulence: 1.0, icingChance: 1.0,
    qrhTimeFactor: 1.0, emergencyOverlap: 1,
    qrhHint: false,
    deadlineFactor: 1.0, touchdownTolerance: 0.25, gradeBonus: 0,
    fuelPenaltyFactor: 1.0, damageFactor: 1.0,
    description: 'Real wind and turbulence, problems may overlap, standard deadlines and standard grading.'
  },
  hard: {
    id: 'hard', name: 'Hard',
    windFactor: 1.5, turbulence: 1.8, icingChance: 1.7,
    qrhTimeFactor: 0.75, emergencyOverlap: 2,
    qrhHint: false,
    deadlineFactor: 0.8, touchdownTolerance: 0.2, gradeBonus: -0.1,
    fuelPenaltyFactor: 1.6, damageFactor: 1.5,
    description: 'Storm season: strong wind and severe turbulence, failures with no warning, two problems at once, short deadlines and strict grading.'
  }
};

// ---------- Aircraft ----------
// Thrust is the total of all engines in newtons at sea level static, full throttle.
// dims: real length, wingspan and fuselage diameter (m; the width of a tall or double-deck body);
// look: how models.js draws it.
// FLAPS: cl/cd deltas and the maximum speed each setting may be extended at.
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
    rent: 36000, price: 0, bonus: 1.5, unlock: 'cargo5',
    dims: { len: 68.96, span: 73.3, fus: 7.3 },
    look: { wing: 'high', engines: 'wing4', tail: 'low', base: '#e9ecef', color: '#1f4fa0', sweep: 32, dihedral: -3, tall: 1.1, mainRows: 5, freighter: true },
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
    rent: 33800, price: 0, bonus: 1.4, unlock: 'cargo4',
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
    rent: 39000, price: 0, bonus: 1.45, unlock: 'pax4',
    dims: { len: 72.72, span: 79.75, fus: 7.14 },
    look: { wing: 'low', engines: 'wing4', tail: 'low', base: '#f3f5f7', color: '#6a2c82', sweep: 33.5, fan: 0.47, tall: 1.18, decks: 2, bodyRows: 3 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  }
];

// ---------- The hangar's weight filter (ui/filters.js) ----------
const HANGAR_FILTER = {
  LIGHT_T: 30,                 // "light": up to this maximum take-off weight, tonnes
  HEAVY_T: 100                 // "heavy": over this one (and the widebodies are the jets over it)
};

// ---------- Payload types ----------
const PAYLOAD = {
  pax: { name: 'Passengers', ratePerKg: 3.4, label: 'passengers' },
  bag: { name: 'Hold baggage', ratePerKg: 0.5, label: 'kg of baggage' },
  cargo: { name: 'General freight', ratePerKg: 1.1, label: 'kg of freight' },
  reefer: { name: 'Reefer freight', ratePerKg: 1.9, label: 'kg of reefer freight', coldChain: true },
  hazmat: { name: 'Dangerous goods', ratePerKg: 3.1, label: 'kg of dangerous goods', hazard: true },
  mail: { name: 'Mail and light freight', ratePerKg: 2.2, label: 'kg of mail' },
  medevac: { name: 'Medevac', ratePerKg: 6.5, label: 'kg of medevac load', urgent: true },
  fish: { name: 'Fresh fish', ratePerKg: 1.5, label: 'kg of fish', coldChain: true }
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
  OUTCOME_SEC: 9            // how long the result of a checklist stays on the screen
};

// ---------- Training courses ----------
// The technology tree: one general branch plus three career branches, four tiers each.
const COURSES = [
  // General
  { id: 'gen1', branch: 'general', tier: 0, name: 'Ground School', cost: 0, requires: [],
    blurb: 'Basic theory, aircraft handling, the standard operating procedures of a small operator. Everyone starts here.',
    effect: 'The foundation of your career.', course: 'pax' },
  { id: 'gen2', branch: 'general', tier: 1, name: 'Aviation Weather', cost: 1800, requires: ['gen1'],
    blurb: 'METAR, TAF, windshear and icing analysis. Better forecasts mean better fuel plans.',
    effect: 'Shows the full forecast at both ends, +10% fuel margin planning, 20% less icing.', course: 'pax' },
  { id: 'gen3', branch: 'general', tier: 2, name: 'Advanced Systems', cost: 5200, requires: ['gen2'],
    blurb: 'Hydraulics, generators, pressurisation and the QRH — and how to work it under pressure.',
    effect: 'Checklist hints explain every step, +40% response time on every emergency.', course: 'pax' },
  { id: 'gen4', branch: 'general', tier: 3, name: 'CRM & Cabin Safety', cost: 11000, requires: ['gen3'],
    blurb: 'Crew resource management, cabin crew briefing, medical response and awkward passengers.',
    effect: '+60% emergency response time, medical emergencies pay, +5 reputation per flight.', course: 'pax' },
  // Passenger
  { id: 'pax1', branch: 'pax', tier: 1, name: 'Regional Jet Ops', cost: 2600, requires: ['gen1'], rep: 0,
    blurb: 'Jet handling for the CRJ200: high rotation thrust, higher stall speeds, pressurised climb profiles.',
    effect: 'Unlocks the Bombardier CRJ200 and regional jet contracts.', course: 'pax' },
  { id: 'paxtp', branch: 'pax', tier: 1, name: 'Regional Turboprops', cost: 2400, requires: ['gen1'], rep: 0,
    blurb: 'The ATR 72 on short hops: propeller handling, feathering, de-icing boots and six sectors a day.',
    effect: 'Unlocks the ATR 72-600; +10% pay on legs under 300 nm in a turboprop.', course: 'pax' },
  { id: 'pax2', branch: 'pax', tier: 2, name: 'Instrument Rating (IFR)', cost: 7500, requires: ['pax1'], rep: 15,
    blurb: 'Flying the approach when you cannot see the runway: ILS, NDB, circling and a missed approach flown well.',
    effect: 'Unlocks the Boeing 737-800, low-visibility and IMC contracts.', course: 'pax' },
  { id: 'paxfbw', branch: 'pax', tier: 2, name: 'Fly-by-Wire Jets', cost: 9000, requires: ['pax1'], rep: 15,
    blurb: 'Side-sticks, flight computers and envelope protection: how a modern jet flies, and what is left when its computers degrade.',
    effect: 'Unlocks the Embraer E195-E2 and the Airbus A220-300.', course: 'pax' },
  { id: 'pax3', branch: 'pax', tier: 3, name: 'Mountain & Adverse Weather', cost: 16000, requires: ['pax2'], rep: 35,
    blurb: 'Bergen in the rain, Tromsø in January: terrain, windshear, downdrafts and steep approaches.',
    effect: 'Unlocks the Airbus A320-200 and A320neo, mountain and arctic passenger routes, +15% payout on adverse-weather contracts.', course: 'pax' },
  { id: 'pax4', branch: 'pax', tier: 4, name: 'Widebody Procedures', cost: 34000, requires: ['pax3'], rep: 60,
    blurb: 'Two hundred tonnes of aeroplane: longer checklists, heavier landings, higher Vref and hot-and-high limits.',
    effect: 'Unlocks the Airbus A350-900, the Boeing 777-300ER, the Airbus A380 and the long-haul contracts.', course: 'pax' },
  { id: 'paxetops', branch: 'pax', tier: 4, name: 'ETOPS & Ocean Crossings', cost: 30000, requires: ['pax3'], rep: 60,
    blurb: 'Two engines over the ocean: diversion times, alternates, the drift-down and the fuel for the worst case.',
    effect: 'Unlocks the Airbus A330-300 and the Boeing 787-9; +10% pay on legs over 1 500 nm in a twin-engine jet.', course: 'pax' },
  // Cargo
  { id: 'cargo1', branch: 'cargo', tier: 1, name: 'Dangerous Goods', cost: 2200, requires: ['gen1'], rep: 0,
    blurb: 'Class 3 flammable liquids, lithium batteries and the paperwork that comes with them.',
    effect: 'Unlocks hazardous-goods contracts (+80% rate).', course: 'cargo' },
  { id: 'cargo2', branch: 'cargo', tier: 2, name: 'Weight & Balance', cost: 6800, requires: ['cargo1'], rep: 15,
    blurb: 'Loading, trim, aft CG limits and what a badly loaded freighter does on rotation.',
    effect: 'Unlocks the Fokker F27-600F, +15% payload tolerance, load-shift emergencies handled better.', course: 'cargo' },
  { id: 'cargo3', branch: 'cargo', tier: 3, name: 'Arctic Ground Handling', cost: 15000, requires: ['cargo2'], rep: 35,
    blurb: 'De-icing procedures, cargo holds in the cold, snow banks and gravel aprons.',
    effect: 'Unlocks ice-field and reefer contracts, icing builds 35% slower.', course: 'cargo' },
  { id: 'cargo4', branch: 'cargo', tier: 4, name: 'Heavy Freighter Ops', cost: 32000, requires: ['cargo3'], rep: 60,
    blurb: 'Main-deck loading, fifty tonnes of freight and the most demanding schedules in the north.',
    effect: 'Unlocks the Boeing 767-300F, the Boeing 747-8F and ultra-long contracts.', course: 'cargo' },
  { id: 'cargo5', branch: 'cargo', tier: 5, name: 'Outsize Cargo', cost: 48000, requires: ['cargo4'], rep: 80,
    blurb: 'Turbines, helicopters and locomotives: the An-124\'s lifting nose, kneeling gear, roof cranes and tie-downs for loads that fit nothing else.',
    effect: 'Unlocks the Antonov An-124 Ruslan: 120 tonnes onto long gravel and ice runways.', course: 'cargo' },
  // Bush & SAR
  { id: 'bush1', branch: 'bush', tier: 1, name: 'Short Field Ops', cost: 2000, requires: ['gen1'], rep: 0,
    blurb: 'Take-off and landing in half the distance, on grass, gravel and sand.',
    effect: 'Unlocks the DHC-6 Twin Otter, grass strips and STOL contracts.', course: 'bush' },
  { id: 'bush2', branch: 'bush', tier: 2, name: 'De-icing & Winter Survival', cost: 7200, requires: ['bush1'], rep: 15,
    blurb: 'Carburettor and airframe icing, engine anti-ice, and survival in a winter cabin.',
    effect: 'Icing builds 45% slower, icing emergencies give 30% more time, winter contracts pay +20%.', course: 'bush' },
  { id: 'bush3', branch: 'bush', tier: 3, name: 'Medevac & SAR Contracts', cost: 17000, requires: ['bush2'], rep: 35,
    blurb: 'Search and rescue, medevac flights and getting there before the weather closes the strip.',
    effect: 'Unlocks urgent SAR and medevac contracts (short deadlines, up to 3x the rate).', course: 'bush' },
  { id: 'bush4', branch: 'bush', tier: 4, name: 'Seaplane & Remote Bases', cost: 33000, requires: ['bush3'], rep: 60,
    blurb: 'Floats, skis and strips with no fuel, no lights and no second attempt.',
    effect: 'Unlocks ice fields and remote strips for every aircraft type.', course: 'bush' }
];

// The exam questions (in English, Russian and Swedish) are in data/quizzes.js.

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
  BASE_PAY_PER_NM: 58,           // SEK per real nautical mile, before the payload fee
  PAYLOAD_FEE_NM: 650,           // load fee = kg x PAYLOAD rate x nm / this
  FACTION_MULT: { pax: 1.0, cargo: 1.05, bush: 1.2 },
  URGENT_MULT: 2.1,
  TURBOPROP_SHORT_NM: 300,       // Regional Turboprops: legs shorter than this (real nm) in a turboprop
  TURBOPROP_SHORT_MULT: 1.1,     // ... pay this much more
  ETOPS_NM: 1500,                // ETOPS & Ocean Crossings: legs longer than this in a twin-engine jet
  ETOPS_MULT: 1.1,               // ... pay this much more
  // starting at the gate and flying the whole ground procedure yourself (push back, start, taxi
  // out) pays this share of the contract and this much reputation; starting after pushback
  // saves those minutes on the ground (and their lease) but earns neither
  FULL_GROUND_BONUS: 0.06,
  FULL_GROUND_REP: 0.3,
  GROUND_ALLOWANCE_S: 480,       // pushback, start, taxi out and taxi in, real seconds
  APPROACH_ALLOWANCE_S: 300,     // the approach, flown at 1x, real seconds
  CRUISE_ACCEL_EXPECTED: 6,      // the time acceleration the schedule assumes en route (short legs)
  CRUISE_ACCEL_PER_NM: 1 / 30,   // ... and more on long legs (per game nm), up to
  CRUISE_ACCEL_MAX: 90,
  MAX_NM: 4500,                  // the longest contract, real nm (further: fly there in legs)
  TIME_ALLOWANCE_FACTOR: 1.3,    // deadline slack on top of the block time
  FUEL_RESERVE_FACTOR: 1.45,     // block fuel = trip fuel x this + taxi fuel
  FUEL_MIN_FACTOR: 1.15,         // the load is cut so that the trip fuel x this still fits under the maximum take-off weight
  FUEL_TAXI_KG_PER_ENGINE: 25,
  REP_PER_FLIGHT: 1.2,
  REP_PERFECT_LANDING: 1.0,
  FUEL_RATE: 4.3,                // SEK per kg of fuel burnt
  START_MONEY: 48000,
  START_DEBT_LIMIT: -50000,
  GRADE_MULT: { 'A+': 1.35, A: 1.22, B: 1.08, C: 0.95, D: 0.75, E: 0.55, F: 0.4 }
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
const QUALITY = {
  low:    { name: 'Low',    nearCells: 48, nearCell: 240, farCell: 6000, drawFar: 80000, maxPolys: 2600, clouds: 22, trees: 0,   pixelRatio: 1,   rain: false, maxCanvas: 1280, groundLights: 14000 },
  medium: { name: 'Medium', nearCells: 64, nearCell: 150, farCell: 5000, drawFar: 130000, maxPolys: 4200, clouds: 44, trees: 260, pixelRatio: 1.25, rain: true, maxCanvas: 1600, groundLights: 32000 },
  high:   { name: 'High',   nearCells: 80, nearCell: 110, farCell: 4200, drawFar: 200000, maxPolys: 6500, clouds: 70, trees: 620, pixelRatio: 2,   rain: true, maxCanvas: 2560, groundLights: 60000 }
};

const VIEW = {
  FOV_DEG: 68,
  // the pilot's eye in the aircraft's own axes: x = right, y = up, z = forward (metres, an 18 m aeroplane)
  COCKPIT_EYE: { x: 0, y: 1.6, z: 5.5 },
  // the captain's seat: this far left of the centreline, as a fraction of the fuselage diameter
  // (about 0.5 m in an airliner), so the centre window post is off to the right, not ahead
  COCKPIT_SEAT_X: -0.14,
  // the centre post seen from that seat: how far ahead of the eye it is (as a fraction of the
  // fuselage diameter), so it sits about 30 degrees to the right
  CENTRE_POST_AHEAD: 0.24,
  // the views C (and Shift+C) cycle through, and their names
  MODES: ['cockpit', 'chase', 'front', 'wing', 'tail', 'gear', 'top', 'down', 'tower'],
  NAMES: {
    cockpit: 'cockpit', chase: 'chase', front: 'front, looking back', wing: 'wing', tail: 'tail fin',
    gear: 'landing gear', top: 'top down', down: 'straight down, under the belly', tower: 'tower / fly-by'
  },
  // the tower / fly-by view (Scene3D.towerShot): a shot is held SHOT_S seconds of real time (a
  // random length in the range), from the nearest tower within TOWER_M, en route the fly-by shots
  // in this ORDER; a pass only while the aeroplane flies at most PASS_MAX_M in half a shot
  FLYBY: { SHOT_S: [3, 5], TOWER_M: 14000, PASS_MAX_M: 3000, ORDER: ['pass', 'lead', 'side', 'trail'] },
  NEAR_CLIP: 0.7,
  FOG_DENSITY: 1 / 62000,      // 1/e per metre
  COCKPIT_DRAW_DIST: 12000
};

// The camera's flights at both ends of a flight (render/cinematic.js): before the start it
// flies from a wide shot of the aeroplane and the terminal (or the runway) into the captain's
// seat; parked at the arrival gate it flies out of the cockpit to a wide shot of the aeroplane
// at its gate, then the debrief. Enter, Space, Esc or a tap skips it.
const CINEMATIC = {
  INTRO_S: 6.5,                // the fly-in, seconds (the last tenth inside the cockpit)
  OUTRO_S: 5.5,                // the fly-out ...
  OUTRO_HOLD_S: 1.2,           // ... and how long its last shot holds before the debrief
  CAPTION_S: 4.2               // the route under the intro's picture: shown this long
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

const CONTROLS = {
  THROTTLE_CURVE: 1.8,         // thrust = lever position ^ this: the low end of the lever is finer (taxi power)
  THROTTLE_KEY_RATE: 0.45,     // lever travel per second with Z / X
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
  MINIMAP_FPS: 6               // the mini map is redrawn this often
};

const PALETTE = {
  skyTop: '#2b6fb5',
  skyHorizon: '#bcd8ef',
  skyGround: '#9fb0a6',
  night: '#0a1226',
  sun: '#fff6d8',
  fogDay: '#c3d6e6'
};

const CURSOR_HIDE_MS = 3000;    // ms the mouse must stay still in fullscreen before the cursor hides (core/cursor.js)
