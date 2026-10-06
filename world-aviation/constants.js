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
  SCALE: 0.45,                 // horizontal compression: game metres per real metre
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
  TIME_ACCEL_STEPS: [1, 2, 4, 8, 16, 32, 64],   // T one step faster, R one step slower
  TIME_ACCEL_CHEAT: 128,       // the Alt+6 cheat
  TIME_ACCEL_MIN_ALT_M: 150,   // time acceleration only above this height AGL
  TIME_ACCEL_AP_MAX: 64,       // with the autopilot engaged: up to x64 in any phase
  // flying by hand: the fastest step allowed above each height AGL (feet)
  TIME_ACCEL_MANUAL: [{ aglFt: 1000, max: 2 }, { aglFt: 3000, max: 4 }, { aglFt: 6000, max: 8 },
    { aglFt: 8000, max: 16 }, { aglFt: 9000, max: 32 }, { aglFt: 10000, max: 64 }],
  TAKEOFF_NO_CLEARANCE_KT: 50, // rolling faster than this before the clearance counts as a take-off without one
  NO_CLEARANCE_FINE: 0.05,     // ... and costs this share of the contract pay
  MAX_STEPS_PER_FRAME: 160,    // physics steps per rendered frame at most
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
  APPROACH_NM: 19,             // the approach phase starts on the localiser inside this distance
  LOC_TIME_S: 22,              // the localiser closes a cross-track error with this time constant
  FINAL_FIX_NM: 10,            // the autopilot NAV mode joins the extended centreline here
  MSA_LOOKAHEAD_M: 20000,      // the autopilot keeps clear of the terrain this far ahead
  MSA_MARGIN_M: 450,           // by this much
  GPWS_LOOKAHEAD_S: 25,        // TERRAIN — PULL UP when the ground this many seconds ahead is too close
  ROLLOUT_EXIT_KT: 35          // below this the landing roll becomes the taxi-in
};

// ---------- Airport layout (metres) ----------
// Every airport is drawn from the same template around its runway:
// t = along the runway from its middle (positive towards the departure end),
// across = to the right of the runway centreline.
const LAYOUT = {
  RWY_HALF_WIDTH: 23,
  TWY_OFFSET: 160,             // parallel taxiway centreline
  TWY_WIDTH: 23,
  HOLD_OFFSET: 80,             // holding point, from the runway centreline
  HOLD_T: 90,                  // holding point, from the runway start
  EXITS: [0.45, 0.65, 0.85],   // runway exits as a fraction of the length
  APRON_LANE: 300,             // taxi lane on the apron (100 m lead-in to the stands: room for a 747 to straighten up)
  STAND: 400,                  // the parking position (nose-in towards the terminal)
  TERMINAL: 470,               // terminal building centre
  APRON_START: 0.3,            // where the apron starts, fraction of the runway length
  GATE_SPACING: 80,
  FILLET_R: 38,                // the centreline radius where taxiways meet at an angle
  FILLET_STAND_R: 30,          // ... and where a stand's lead-in leaves the apron lane
  CORRIDOR_LEN: 32000,         // approach / departure corridors cut into the terrain, metres from the runway ends
  CORRIDOR_HALF_WIDTH: 1200,   // plus 12 % of the distance, then 2.5 km to blend into the terrain
  APPROACH_SLOPE_DEG: 2.4,     // the ground stays under this slope before the threshold (the glideslope is 3°)
  DEPARTURE_SLOPE_DEG: 3.5,    // and under this one past the far end of the runway
  TAXI_KT: 15                  // comfortable taxi speed, knots
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
// dims: real length, wingspan and fuselage diameter (m); look: how models.js draws it.
// FLAPS: cl/cd deltas and the maximum speed each setting may be extended at.
const AIRCRAFT = [
  {
    id: 'VIKNA19', name: 'Vikna 19', klass: 'Turboprop', branch: 'start',
    blurb: 'Workhorse 19-seat turboprop. Slow, noisy, and happy on short grass strips.',
    seats: 19, payloadKg: 1500, mtow: 5670, emptyKg: 3350,
    engines: 2, engineType: 'prop', thrust: 30000,
    wingArea: 39, clMaxClean: 1.45, clMaxFlap: 2.15, cd0: 0.036, kInd: 0.048,
    cruiseAlt: 7600, cruiseTas: 268, climbRate: 6.0,
    fuelCapKg: 1250, fuelFlowCruise: 145, fuelFlowIdle: 26,
    vne: 320, vr: 82, vsRatio: 1.26, vrefAdd: 12, vlo: 130,
    flaps: [
      { notch: 1, cl: 0.18, cd: 0.010, vfe: 150 },
      { notch: 2, cl: 0.36, cd: 0.024, vfe: 130 },
      { notch: 3, cl: 0.55, cd: 0.048, vfe: 112 },
      { notch: 4, cl: 0.72, cd: 0.082, vfe: 112 },
      { notch: 5, cl: 0.88, cd: 0.130, vfe: 104 }
    ],
    gearCd: 0.016, rollRate: 1.0, pitchRate: 1.0, yawRate: 1.0,
    takeoffDist: 720, crosswindLimit: 22, maxRangeNm: 700, surfaces: ['asphalt', 'grass'],
    rent: 2400, price: 0, bonus: 1.0, unlock: null,
    dims: { len: 17.6, span: 17.7, fus: 1.95 },
    look: { wing: 'low', engines: 'prop2', tail: 't', base: '#f3f5f7', color: '#1f5fa0' },
    propRpmIdle: 0.62, propRpmCruise: 0.88
  },
  {
    id: 'RJ84', name: 'Fjordliner RJ-84', klass: 'Regional jet', branch: 'pax',
    blurb: '50-seat regional jet. Climbs like a rocket, flies fast, hates ice and crosswinds.',
    seats: 50, payloadKg: 5200, mtow: 21500, emptyKg: 12500,
    engines: 2, engineType: 'jet', thrust: 72000,
    wingArea: 55, clMaxClean: 1.42, clMaxFlap: 2.1, cd0: 0.026, kInd: 0.042,
    cruiseAlt: 10500, cruiseTas: 430, climbRate: 14,
    fuelCapKg: 4400, fuelFlowCruise: 240, fuelFlowIdle: 38,
    vne: 440, vr: 140, vsRatio: 1.24, vrefAdd: 8, vlo: 200,
    flaps: [
      { notch: 1, cl: 0.12, cd: 0.006, vfe: 220 },
      { notch: 2, cl: 0.30, cd: 0.018, vfe: 185 },
      { notch: 3, cl: 0.50, cd: 0.038, vfe: 155 },
      { notch: 4, cl: 0.68, cd: 0.070, vfe: 155 },
      { notch: 5, cl: 0.85, cd: 0.120, vfe: 145 }
    ],
    gearCd: 0.020, rollRate: 1.05, pitchRate: 0.85, yawRate: 1.1,
    takeoffDist: 1150, crosswindLimit: 28, maxRangeNm: 1600, surfaces: ['asphalt'],
    rent: 7200, price: 0, bonus: 1.15, unlock: 'pax1',
    dims: { len: 29.0, span: 26.3, fus: 2.7 },
    look: { wing: 'low', engines: 'rear2', tail: 't', base: '#f3f5f7', color: '#0f7a6a', sweep: 26 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'SKARV27', name: 'Skarv F-27P', klass: 'Freighter turboprop', branch: 'cargo',
    blurb: 'Front-loader freighter. Lifts four tonnes onto a gravel strip and keeps on flying.',
    seats: 4, payloadKg: 3600, mtow: 13500, emptyKg: 7800,
    engines: 2, engineType: 'prop', thrust: 62000,
    wingArea: 57, clMaxClean: 1.5, clMaxFlap: 2.3, cd0: 0.042, kInd: 0.05,
    cruiseAlt: 7600, cruiseTas: 245, climbRate: 5.0,
    fuelCapKg: 2800, fuelFlowCruise: 205, fuelFlowIdle: 32,
    vne: 285, vr: 95, vsRatio: 1.22, vrefAdd: 14, vlo: 120,
    flaps: [
      { notch: 1, cl: 0.16, cd: 0.009, vfe: 135 },
      { notch: 2, cl: 0.34, cd: 0.022, vfe: 120 },
      { notch: 3, cl: 0.52, cd: 0.044, vfe: 128 },
      { notch: 4, cl: 0.70, cd: 0.078, vfe: 122 },
      { notch: 5, cl: 0.90, cd: 0.135, vfe: 116 }
    ],
    gearCd: 0.018, rollRate: 0.9, pitchRate: 0.9, yawRate: 0.95,
    takeoffDist: 1050, crosswindLimit: 18, maxRangeNm: 1000, surfaces: ['asphalt', 'grass'],
    rent: 4600, price: 0, bonus: 1.2, unlock: 'cargo2',
    dims: { len: 23.6, span: 29.0, fus: 2.7 },
    look: { wing: 'high', engines: 'prop2', tail: 'low', base: '#e6e9ec', color: '#d9921f', freighter: true },
    propRpmIdle: 0.58, propRpmCruise: 0.85
  },
  {
    id: 'FROST12', name: 'Frostwing S-12', klass: 'Bush turboprop', branch: 'bush',
    blurb: 'Floats and a 450-metre strip. Hauls fish, mail and medevacs to places with no roads.',
    seats: 12, payloadKg: 1050, mtow: 5100, emptyKg: 2750,
    engines: 2, engineType: 'prop', thrust: 28000,
    wingArea: 39, clMaxClean: 1.5, clMaxFlap: 2.4, cd0: 0.040, kInd: 0.055,
    cruiseAlt: 4500, cruiseTas: 168, climbRate: 4.2,
    fuelCapKg: 1100, fuelFlowCruise: 105, fuelFlowIdle: 24,
    vne: 210, vr: 62, vsRatio: 1.20, vrefAdd: 8, vlo: 95,
    flaps: [
      { notch: 1, cl: 0.14, cd: 0.008, vfe: 100 },
      { notch: 2, cl: 0.30, cd: 0.020, vfe: 88 },
      { notch: 3, cl: 0.48, cd: 0.040, vfe: 96 },
      { notch: 4, cl: 0.66, cd: 0.072, vfe: 92 },
      { notch: 5, cl: 0.84, cd: 0.120, vfe: 88 }
    ],
    gearCd: 0.014, rollRate: 1.15, pitchRate: 1.15, yawRate: 1.2,
    takeoffDist: 380, crosswindLimit: 16, maxRangeNm: 750, surfaces: ['asphalt', 'grass', 'ice'],
    rent: 1900, price: 0, bonus: 1.35, unlock: 'bush1',
    dims: { len: 15.8, span: 19.8, fus: 1.75 },
    look: { wing: 'high', engines: 'prop2', tail: 'low', base: '#f4f1e8', color: '#d64534', fixedGear: true },
    propRpmIdle: 0.6, propRpmCruise: 0.9
  },
  {
    id: 'NJ320', name: 'Nordjet 320', klass: 'Narrowbody jet', branch: 'pax',
    blurb: '164 seats, two hundred tonnes of momentum. Fast, heavy, and unforgiving of ice.',
    seats: 164, payloadKg: 14000, mtow: 68000, emptyKg: 42000,
    engines: 2, engineType: 'jet', thrust: 215000,
    wingArea: 123, clMaxClean: 1.4, clMaxFlap: 2.05, cd0: 0.024, kInd: 0.04,
    cruiseAlt: 11300, cruiseTas: 448, climbRate: 12,
    fuelCapKg: 12000, fuelFlowCruise: 1050, fuelFlowIdle: 105,
    vne: 480, vr: 155, vsRatio: 1.22, vrefAdd: 6, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.12, cd: 0.006, vfe: 230 },
      { notch: 2, cl: 0.30, cd: 0.018, vfe: 215 },
      { notch: 3, cl: 0.50, cd: 0.038, vfe: 200 },
      { notch: 4, cl: 0.68, cd: 0.070, vfe: 185 },
      { notch: 5, cl: 0.84, cd: 0.120, vfe: 175 }
    ],
    gearCd: 0.022, rollRate: 0.85, pitchRate: 0.65, yawRate: 0.85,
    takeoffDist: 1900, crosswindLimit: 32, maxRangeNm: 3000, surfaces: ['asphalt'],
    rent: 21000, price: 0, bonus: 1.25, unlock: 'pax4',
    dims: { len: 37.6, span: 35.8, fus: 3.95 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#3b4fa8', sweep: 25 },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  {
    id: 'BL600F', name: 'Bulklord 600F', klass: 'Widebody freighter', branch: 'cargo',
    blurb: 'Fifty-two tonnes of freight, main-deck loading and a cruise that eats the horizon.',
    seats: 6, payloadKg: 51000, mtow: 190000, emptyKg: 113000,
    engines: 2, engineType: 'jet', thrust: 540000,
    wingArea: 288, clMaxClean: 1.35, clMaxFlap: 2.0, cd0: 0.022, kInd: 0.038,
    cruiseAlt: 11300, cruiseTas: 466, climbRate: 9,
    fuelCapKg: 26000, fuelFlowCruise: 2400, fuelFlowIdle: 190,
    vne: 490, vr: 160, vsRatio: 1.2, vrefAdd: 5, vlo: 250,
    flaps: [
      { notch: 1, cl: 0.10, cd: 0.005, vfe: 260 },
      { notch: 2, cl: 0.26, cd: 0.016, vfe: 220 },
      { notch: 3, cl: 0.46, cd: 0.036, vfe: 220 },
      { notch: 4, cl: 0.64, cd: 0.066, vfe: 210 },
      { notch: 5, cl: 0.80, cd: 0.115, vfe: 200 }
    ],
    gearCd: 0.024, rollRate: 0.75, pitchRate: 0.55, yawRate: 0.7,
    takeoffDist: 2400, crosswindLimit: 30, maxRangeNm: 4900, surfaces: ['asphalt'],
    rent: 38000, price: 0, bonus: 1.3, unlock: 'cargo4',
    dims: { len: 63.7, span: 64.8, fus: 6.2 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#eceff2', color: '#e0a030', sweep: 31, freighter: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  },
  // ---- real airliners: Boeing and Airbus
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
    takeoffDist: 2000, crosswindLimit: 33, maxRangeNm: 2900, surfaces: ['asphalt'],
    rent: 22000, price: 0, bonus: 1.25, unlock: 'pax2',
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
    takeoffDist: 1950, crosswindLimit: 33, maxRangeNm: 3400, surfaces: ['asphalt'],
    rent: 23000, price: 0, bonus: 1.25, unlock: 'pax3',
    dims: { len: 37.6, span: 35.8, fus: 3.95 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#14325c', sweep: 25, winglets: true, bigFans: true },
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
    rent: 52000, price: 0, bonus: 1.35, unlock: 'pax4',
    dims: { len: 66.8, span: 64.8, fus: 5.96 },
    look: { wing: 'low', engines: 'wing2', tail: 'low', base: '#f3f5f7', color: '#1d6b5a', sweep: 31, winglets: true, bigFans: true },
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
    rent: 75000, price: 0, bonus: 1.4, unlock: 'cargo4',
    dims: { len: 76.3, span: 68.4, fus: 6.5 },
    look: { wing: 'low', engines: 'wing4', tail: 'low', base: '#eceff2', color: '#e0a030', sweep: 37, hump: true, freighter: true },
    propRpmIdle: 0.0, propRpmCruise: 0.0
  }
];

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
    blurb: 'Jet handling for the RJ-84: high rotation thrust, higher stall speeds, pressurised climb profiles.',
    effect: 'Unlocks the Fjordliner RJ-84 and regional jet contracts.', course: 'pax' },
  { id: 'pax2', branch: 'pax', tier: 2, name: 'Instrument Rating (IFR)', cost: 7500, requires: ['pax1'], rep: 15,
    blurb: 'Flying the approach when you cannot see the runway: ILS, NDB, circling and a missed approach flown well.',
    effect: 'Unlocks the Boeing 737-800, low-visibility and IMC contracts.', course: 'pax' },
  { id: 'pax3', branch: 'pax', tier: 3, name: 'Mountain & Adverse Weather', cost: 16000, requires: ['pax2'], rep: 35,
    blurb: 'Bergen in the rain, Tromsø in January: terrain, windshear, downdrafts and steep approaches.',
    effect: 'Unlocks the Airbus A320neo, mountain and arctic passenger routes, +15% payout on adverse-weather contracts.', course: 'pax' },
  { id: 'pax4', branch: 'pax', tier: 4, name: 'Widebody Procedures', cost: 34000, requires: ['pax3'], rep: 60,
    blurb: 'Two hundred tonnes of aeroplane: longer checklists, heavier landings, higher Vref and hot-and-high limits.',
    effect: 'Unlocks the Nordjet 320, the Airbus A350-900 and the long-haul contracts.', course: 'pax' },
  // Cargo
  { id: 'cargo1', branch: 'cargo', tier: 1, name: 'Dangerous Goods', cost: 2200, requires: ['gen1'], rep: 0,
    blurb: 'Class 3 flammable liquids, lithium batteries and the paperwork that comes with them.',
    effect: 'Unlocks hazardous-goods contracts (+80% rate).', course: 'cargo' },
  { id: 'cargo2', branch: 'cargo', tier: 2, name: 'Weight & Balance', cost: 6800, requires: ['cargo1'], rep: 15,
    blurb: 'Loading, trim, aft CG limits and what a badly loaded freighter does on rotation.',
    effect: 'Unlocks the Skarv F-27P, +15% payload tolerance, load-shift emergencies handled better.', course: 'cargo' },
  { id: 'cargo3', branch: 'cargo', tier: 3, name: 'Arctic Ground Handling', cost: 15000, requires: ['cargo2'], rep: 35,
    blurb: 'De-icing procedures, cargo holds in the cold, snow banks and gravel aprons.',
    effect: 'Unlocks ice-field and reefer contracts, icing builds 35% slower.', course: 'cargo' },
  { id: 'cargo4', branch: 'cargo', tier: 4, name: 'Heavy Freighter Ops', cost: 32000, requires: ['cargo3'], rep: 60,
    blurb: 'Main-deck loading, fifty tonnes of freight and the most demanding schedules in the north.',
    effect: 'Unlocks the Bulklord 600F, the Boeing 747-8F and ultra-long contracts.', course: 'cargo' },
  // Bush & SAR
  { id: 'bush1', branch: 'bush', tier: 1, name: 'Short Field Ops', cost: 2000, requires: ['gen1'], rep: 0,
    blurb: 'Take-off and landing in half the distance, on grass, gravel and sand.',
    effect: 'Unlocks the Frostwing S-12, grass strips and STOL contracts.', course: 'bush' },
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
  OFFERS: 4,
  BASE_PAY_PER_NM: 58,           // SEK per real nautical mile, before the payload fee
  PAYLOAD_FEE_NM: 650,           // load fee = kg x PAYLOAD rate x nm / this
  FACTION_MULT: { pax: 1.0, cargo: 1.05, bush: 1.2 },
  URGENT_MULT: 2.1,
  // starting at the gate and flying the whole ground procedure yourself (push back, start, taxi
  // out) pays this share of the contract and this much reputation; starting after pushback
  // saves those minutes on the ground (and their lease) but earns neither
  FULL_GROUND_BONUS: 0.06,
  FULL_GROUND_REP: 0.3,
  GROUND_ALLOWANCE_S: 480,       // pushback, start, taxi out and taxi in, real seconds
  APPROACH_ALLOWANCE_S: 300,     // the approach, flown at 1x, real seconds
  CRUISE_ACCEL_EXPECTED: 6,      // the time acceleration the schedule assumes en route (short legs)
  CRUISE_ACCEL_PER_NM: 1 / 30,   // ... and more on long legs (per game nm), up to
  CRUISE_ACCEL_MAX: 40,
  MAX_NM: 4500,                  // the longest contract, real nm (further: fly there in legs)
  TIME_ALLOWANCE_FACTOR: 1.3,    // deadline slack on top of the block time
  FUEL_RESERVE_FACTOR: 1.45,     // block fuel = trip fuel x this + taxi fuel
  FUEL_TAXI_KG_PER_ENGINE: 25,
  REP_PER_FLIGHT: 1.2,
  REP_PERFECT_LANDING: 1.0,
  FUEL_RATE: 9.5,                // SEK per kg of block fuel
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
  ICING_TEMP_MIN: -20, ICING_TEMP_MAX: 1,   // airframe icing in cloud or precipitation, deg C
  ICING_RATE: 0.012,            // ice fraction per second
  STORM_CHANCE_HARD: 0.3
};

// ---------- Camera / rendering presets ----------
const QUALITY = {
  low:    { name: 'Low',    nearCells: 48, nearCell: 240, farCell: 6000, drawFar: 80000, maxPolys: 2600, clouds: 22, trees: 0,   pixelRatio: 1,   rain: false, maxCanvas: 1280 },
  medium: { name: 'Medium', nearCells: 64, nearCell: 150, farCell: 5000, drawFar: 130000, maxPolys: 4200, clouds: 44, trees: 260, pixelRatio: 1.25, rain: true, maxCanvas: 1600 },
  high:   { name: 'High',   nearCells: 80, nearCell: 110, farCell: 4200, drawFar: 200000, maxPolys: 6500, clouds: 70, trees: 620, pixelRatio: 2,   rain: true, maxCanvas: 2560 }
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
  MODES: ['cockpit', 'chase', 'front', 'wing', 'tail', 'gear', 'top', 'tower'],
  NAMES: {
    cockpit: 'cockpit', chase: 'chase', front: 'front, looking back', wing: 'wing', tail: 'tail fin',
    gear: 'landing gear', top: 'top down', tower: 'tower / fly-by'
  },
  NEAR_CLIP: 0.7,
  FOG_DENSITY: 1 / 62000,      // 1/e per metre
  COCKPIT_DRAW_DIST: 12000
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
  START_NM: 3,                 // how far out on the final it starts
  AP_SECONDS: 5,               // the autopilot flies it this long (real seconds), then hands over
  MAX_AGL_FT: 3000,            // climbing above this (or flying 2 nm further out) ends it: no landing
  FEE_LEASE_SHARE: 0.05,       // the fee: this share of the aircraft's hourly lease ...
  FEE_MIN: 100,                // ... and at least this much (SEK)
  REP: { 'A+': 0.5, A: 0.4, B: 0.2, C: 0.1 }   // reputation by grade; per contract only the best grade counts
};

const CONTROLS = {
  THROTTLE_CURVE: 1.8,         // thrust = lever position ^ this: the low end of the lever is finer (taxi power)
  THROTTLE_KEY_RATE: 0.45,     // lever travel per second with Z / X
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
