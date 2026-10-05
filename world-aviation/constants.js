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
  AIRLINE_DEFAULT: 'Svea Flyg',
  PILOT_LICENSE: 'EASA ATPL',
  PILOT_COUNTRY: 'Sweden',
  PILOT_CITY: 'Stockholm',
  INTRO: 'You are a Swedish commercial pilot with an EASA ATPL and a job that nobody wanted: a small operator out of Stockholm Arlanda and one leased turboprop. Start with Sweden, win Scandinavia, then buy the traffic rights to the rest of the world, one region at a time.'
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
  TIME_ACCEL_STEPS: [1, 2, 4, 8, 16, 32, 64],
  TIME_ACCEL_LOW_MAX: 3,       // index of the fastest step outside the cruise (x8)
  TIME_ACCEL_CHEAT: 128,       // the Alt+6 cheat
  TIME_ACCEL_MIN_ALT_M: 150,   // time acceleration only above this height AGL
  TIME_ACCEL_NEEDS_AP: true,
  MAX_STEPS_PER_FRAME: 160,    // physics steps per rendered frame at most
  CRUISE_ALT_MIN: 2500,
  CRUISE_ALT_MAX: 11300,
  FUEL_BURN_TAXI_PER_ENGINE: 22,  // kg/h per engine while taxiing
  GEAR_TRANSIT_S: 6,
  FLAP_TRANSIT_S: 2.5,         // seconds per flap notch
  BRAKE_RAMP_S: 0.35,          // seconds for the wheel brakes to reach full pressure
  NOSEWHEEL_MAX_STEER_DEG: 38,
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
    fuelPenaltyFactor: 0.5, damageFactor: 0.6, taxiAssist: true,
    description: 'Calm weather, one problem at a time with a long grace period, checklists come with hints, generous landing grading and no deadlines.'
  },
  medium: {
    id: 'medium', name: 'Medium',
    windFactor: 1.0, turbulence: 1.0, icingChance: 1.0,
    qrhTimeFactor: 1.0, emergencyOverlap: 1,
    qrhHint: false,
    deadlineFactor: 1.0, touchdownTolerance: 0.25, gradeBonus: 0,
    fuelPenaltyFactor: 1.0, damageFactor: 1.0, taxiAssist: false,
    description: 'Real wind and turbulence, problems may overlap, standard deadlines and standard grading.'
  },
  hard: {
    id: 'hard', name: 'Hard',
    windFactor: 1.5, turbulence: 1.8, icingChance: 1.7,
    qrhTimeFactor: 0.75, emergencyOverlap: 2,
    qrhHint: false,
    deadlineFactor: 0.8, touchdownTolerance: 0.2, gradeBonus: -0.1,
    fuelPenaltyFactor: 1.6, damageFactor: 1.5, taxiAssist: false,
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

// ---------- Emergency quick-reference checklists ----------
// kind: 'do' = confirm the step, 'setAlt' / 'setHdg' / 'setPower' = a value to dial in,
// 'note' = information the player just reads and acknowledges.
const EMERGENCIES = [
  {
    id: 'eng_fire', title: 'ENGINE FIRE', weight: 1.0, phase: ['CLIMB', 'CRUISE', 'DESCENT', 'APPROACH'],
    alert: 'continuous', limit: 25, escTitle: 'Engine fire not contained',
    esc: 'The fire burns through the nacelle, the engine shuts down and you fly the rest on one engine with a fire warning you cannot clear.',
    penalty: { damage: 0.18, fuel: 0.1 },
    steps: [
      { kind: 'setPower', value: 0, text: 'Throttle to the idle stop' },
      { kind: 'do', text: 'Pull the engine fire handle' },
      { kind: 'do', text: 'Engine master switch OFF' },
      { kind: 'do', text: 'Confirm the fire warning light is out' },
      { kind: 'note', text: 'Inflight shutdown complete. Note the failure, continue the flight.' }
    ]
  },
  {
    id: 'eng_fail', title: 'ENGINE FAILURE', weight: 1.2, phase: ['CLIMB', 'CRUISE', 'DESCENT'],
    alert: 'continuous', limit: 40, escTitle: 'Engine failure mishandled',
    esc: 'You kept the failed engine at high power. It tore itself apart and you lost altitude you did not have.',
    penalty: { damage: 0.25 },
    steps: [
      { kind: 'do', text: 'Verify the failure on the engine page' },
      { kind: 'setPower', value: 0, text: 'Throttle the failed engine to idle' },
      { kind: 'do', text: 'Propeller feather / engine start valve closed' },
      { kind: 'do', text: 'Attempt a restart on the remaining fuel pressure' },
      { kind: 'note', text: 'Restart failed. Drift down at best-glide speed and plan for the nearest suitable airport.' }
    ]
  },
  {
    id: 'fuel_leak', title: 'FUEL LEAK', weight: 1.1, phase: ['CLIMB', 'CRUISE', 'DESCENT', 'APPROACH'],
    alert: 'continuous', limit: 45, escTitle: 'Fuel leak unchecked',
    esc: 'The leak drained the tanks while you flew on. You reached the coast with nothing left in reserve.',
    penalty: { fuel: 0.35, damage: 0.05 },
    steps: [
      { kind: 'do', text: 'Fuel pump for the leaking side OFF' },
      { kind: 'do', text: 'Crossfeed valve OPEN' },
      { kind: 'do', text: 'Declare the emergency to ATC' },
      { kind: 'note', text: 'Recirculate on the remaining tank. Recompute your landing fuel and expect a delay.' }
    ]
  },
  {
    id: 'low_fuel', title: 'FUEL STATE', weight: 0.9, phase: ['CRUISE', 'DESCENT'],
    alert: 'single', limit: 60, escTitle: 'Ran the tanks dry',
    esc: 'Both engines flamed out with the destination still on the nose. You glided, and you did not have enough height.',
    penalty: { damage: 0.3 },
    steps: [
      { kind: 'do', text: 'Recalculate fuel to destination' },
      { kind: 'do', text: 'Review the nearest diversion field' },
      { kind: 'setAlt', value: 10000, text: 'Level off at 10 000 ft, economy power' },
      { kind: 'note', text: 'Declare minimum fuel state and continue to the planned airport.' }
    ]
  },
  {
    id: 'icing', title: 'ICE ACCRETION', weight: 1.3, phase: ['CLIMB', 'CRUISE'],
    alert: 'single', limit: 50, escTitle: 'Iced beyond recovery',
    esc: 'Ice kept building on the wings. Lift fell away, the aeroplane stalled, and it broke up in the cloud.',
    penalty: { damage: 0.45 },
    steps: [
      { kind: 'do', text: 'Exit the icing conditions — turn or descend out of the moisture' },
      { kind: 'do', text: 'Engine anti-ice ON, both engines' },
      { kind: 'do', text: 'Pitot heat ON' },
      { kind: 'do', text: 'Do NOT extend gear or flaps while ice remains' },
      { kind: 'note', text: 'Hold level until the ice sheds. Expect the stall speed to be higher.' }
    ]
  },
  {
    id: 'windshear', title: 'WINDSHEAR ALERT', weight: 1.0, phase: ['APPROACH'],
    alert: 'continuous', limit: 12, escTitle: 'Windshear not escaped',
    esc: 'The shear hit you below the glideslope. You touched down 20 kt fast, into a sink, on the numbers.',
    penalty: { damage: 0.4 },
    steps: [
      { kind: 'note', text: 'WINDSHEAR, WINDSHEAR — runway performance degraded' },
      { kind: 'note', text: 'Pitch attitude 15°, thrust to the go-around limit' },
      { kind: 'do', text: 'Windshield wipers and landing lights ON' },
      { kind: 'note', text: 'Fly through the shear and land long, or go around if you are not stable.' }
    ]
  },
  {
    id: 'bird', title: 'BIRD STRIKE', weight: 0.8, phase: ['CLIMB', 'CRUISE', 'TAKEOFF', 'APPROACH'],
    alert: 'single', limit: 40, escTitle: 'Struck bird, engine lost',
    esc: 'The bird went into the intake. The engine flamed out and the aeroplane was no longer flyable.',
    penalty: { damage: 0.3 },
    steps: [
      { kind: 'do', text: 'Check the affected engine: N1, EGT, vibration' },
      { kind: 'setPower', value: 0.4, text: 'Reduce the affected engine to flight idle' },
      { kind: 'do', text: 'Report the strike to ATC' },
      { kind: 'note', text: 'Monitor for a flameout. Continue the flight and land at the planned destination.' }
    ]
  },
  {
    id: 'depress', title: 'CABIN ALTITUDE', weight: 0.7, phase: ['CLIMB', 'CRUISE', 'DESCENT'],
    alert: 'continuous', limit: 30, escTitle: 'Cabin depressurised',
    esc: 'The cabin blew out at cruise altitude. Everybody on board got a hypoxia warning they never heard.',
    penalty: { damage: 0.1, penaltyRep: 8 },
    steps: [
      { kind: 'do', text: 'Crew and passenger oxygen masks ON' },
      { kind: 'setAlt', value: 10000, text: 'Emergency descent to 10 000 ft' },
      { kind: 'do', text: 'Pack the depressurisation, then re-pressurise' },
      { kind: 'note', text: 'Cabin altitude back inside limits. Report the defect and continue.' }
    ]
  },
  {
    id: 'gear', title: 'GEAR WILL NOT EXTEND', weight: 0.9, phase: ['APPROACH', 'DESCENT'],
    alert: 'single', limit: 55, escTitle: 'Gear not down',
    esc: 'The gear hung half extended. You landed with it not locked — and the leg collapsed under the load.',
    penalty: { damage: 0.5 },
    steps: [
      { kind: 'do', text: 'Gear selector DOWN, then check the hydraulic page' },
      { kind: 'do', text: 'Blow down the gear reservoir (AUTO to GROUND to UP slowly)' },
      { kind: 'do', text: 'Manual extension / free-fall release' },
      { kind: 'note', text: 'Gear status: three green. If still not down: land on a grass strip or go around.' }
    ]
  },
  {
    id: 'hydraulic', title: 'HYDRAULIC FAILURE', weight: 0.7, phase: ['CLIMB', 'CRUISE', 'DESCENT', 'APPROACH'],
    alert: 'single', limit: 60, escTitle: 'Systems low',
    esc: 'Without hydraulics the gear and the brakes went with them. You touched down and could not steer or stop.',
    penalty: { damage: 0.35 },
    steps: [
      { kind: 'do', text: 'Verify which system failed on the hydraulic page' },
      { kind: 'do', text: 'Gear selector down — electric extension backup' },
      { kind: 'do', text: 'Accumulate the brakes, expect slow pressure build-up' },
      { kind: 'note', text: 'Maximum deflection only. Plan for a longer rollout and a firm landing.' }
    ]
  },
  {
    id: 'nav', title: 'NAV / COMM FAILURE', weight: 0.6, phase: ['CLIMB', 'CRUISE', 'DESCENT'],
    alert: 'single', limit: 70, escTitle: 'Lost the route',
    esc: 'With no navigation and no radio you drifted. The fuel ran low over terrain instead of over the coastline.',
    penalty: { fuel: 0.2 },
    steps: [
      { kind: 'do', text: 'Try both radios and both transponders' },
      { kind: 'do', text: 'Compass and clock: note heading and time' },
      { kind: 'do', text: 'Dead-reckon to the destination, monitor fuel to the field' },
      { kind: 'note', text: 'Declare the failure when the radios come back. Keep the magenta line.' }
    ]
  },
  {
    id: 'medical', title: 'MEDICAL EMERGENCY', weight: 0.6, phase: ['CLIMB', 'CRUISE', 'DESCENT'],
    alert: 'single', limit: 120, escTitle: 'Passenger critical',
    esc: 'A passenger went critical and needed a hospital. The diversion and the paperwork cost more than the contract paid.',
    penalty: { penaltyRep: 10, moneyFactor: -0.25 },
    steps: [
      { kind: 'do', text: 'Cabin crew: first aid, oxygen, declare a medical emergency' },
      { kind: 'do', text: 'Request the nearest hospital diversion' },
      { kind: 'note', text: 'Contract void — you are paid for the flying time you did, not the delivery.' }
    ]
  },
  {
    id: 'cargoshift', title: 'LOAD SHIFTED', weight: 0.7, phase: ['CLIMB', 'CRUISE', 'DESCENT'], cargoOnly: true,
    alert: 'single', limit: 60, escTitle: 'Load shift unchecked',
    esc: 'The pallets walked aft in the turbulence. The aeroplane trimmed itself nose-down and it never recovered.',
    penalty: { damage: 0.2 },
    steps: [
      { kind: 'do', text: 'Reduce speed to the turbulence penetration speed' },
      { kind: 'do', text: 'Trim for the new centre of gravity' },
      { kind: 'note', text: 'Do not exceed the aft CG limit. Re-check the landing distance and the Vref.' }
    ]
  },
  {
    id: 'overweight', title: 'OVERWEIGHT / MISLOAD', weight: 0.6, phase: ['TAXI_OUT', 'HOLD_SHORT'], preflight: true,
    alert: 'single', limit: 75, escTitle: 'Rotated overweight',
    esc: 'You took off over the maximum weight. The aeroplane used every metre of the runway and you barely cleared the fence.',
    penalty: { damage: 0.2 },
    steps: [
      { kind: 'do', text: 'Recompute the takeoff distance for the actual weight' },
      { kind: 'setPower', value: 0.85, text: 'Set the reduced takeoff thrust' },
      { kind: 'note', text: 'Offload the excess, or compute a lower Vref and a longer ground roll.' }
    ]
  },
  {
    id: 'overspeed', title: 'OVERSPEED', weight: 0.5, phase: ['DESCENT', 'APPROACH'],
    alert: 'continuous', limit: 20, escTitle: 'Exceeded Vne',
    esc: 'You flew the approach 40 kt over Vne. The airframe gave up before the runway did.',
    penalty: { damage: 0.35 },
    steps: [
      { kind: 'do', text: 'Immediately reduce thrust and check the energy' },
      { kind: 'note', text: 'Recover level, decelerate, then continue the approach' },
      { kind: 'note', text: 'Overspeed is a maintenance event — file it in the technical log' }
    ]
  }
];

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
    effect: 'Checklist hints show the next step, +40% response time on every emergency.', course: 'pax' },
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

// Quiz pools. Each course asks 4 questions (3 correct answers needed to pass).
const QUIZZES = {
  gen1: [
    { q: 'What is the first thing you do after a cold and dark start?', o: ['Chop check the fuel', 'Start the APU', 'Take a photo'], a: 0 },
    { q: 'Maximum operating altitude of the pressurisation system is set to...', o: ['8000 ft', '10 000 ft', 'FL 200'], a: 1 },
    { q: 'Vref is the speed at which you...', o: ['Retract the flaps', 'Cross the fence at 50 ft', 'Start the descent'], a: 1 },
    { q: 'A QRH checklist is worked...', o: ['In any order, fast', 'In the listed order, out loud', 'Only when the captain asks'], a: 1 },
    { q: 'Fuel on board is checked against...', o: ['The fuel log', 'The last landing', 'The weather forecast'], a: 0 }
  ],
  gen2: [
    { q: 'The last four digits of a METAR give the...', o: ['Visibility', 'Runway state', 'Cloud base'], a: 1 },
    { q: 'Icing is most likely between...', o: ['0 and 15 °C', '−20 and 0 °C', '+5 and +25 °C'], a: 1 },
    { q: 'Windshear on approach is a sudden change of...', o: ['QNH', 'Temperature', 'Wind speed and direction'], a: 2 },
    { q: 'Visibility in metres is reported as...', o: ['M10 = less than 1 km', 'Always in km', 'Only above 10 km'], a: 0 },
    { q: 'A windshear warning means you should expect...', o: ['A longer runway', 'A wind change at low level', 'Clear skies'], a: 1 }
  ],
  gen3: [
    { q: 'The hydraulic page shows low pressure when...', o: ['The gear is down', 'A system is not available', 'The brakes are cold'], a: 1 },
    { q: 'The master caution light can be reset...', o: ['Once, after the cause is clear', 'Any time', 'Only with the gear down'], a: 0 },
    { q: 'After an engine fire the first action is...', o: ['Feather the prop', 'Throttle to idle', 'Shut off the fuel pumps'], a: 1 },
    { q: 'Free-fall extension of the gear is used when...', o: ['Hydraulics are gone', 'The gear doors are closed', 'On the ground'], a: 0 },
    { q: 'Crossfeed feeds...', o: ['Both tanks from both pumps', 'Only the left tank', 'The hydraulics'], a: 0 }
  ],
  gen4: [
    { q: 'CRM stands for...', o: ['Crew resource management', 'Cabin radio management', 'Crash recovery mode'], a: 0 },
    { q: 'On a medical emergency the first duty is...', o: ['Land immediately', 'Declare it and give first aid', 'Ask for payment'], a: 1 },
    { q: 'A nervous passenger is best handled by...', o: ['Ignoring them', 'A calm factual briefing', 'Threats'], a: 1 },
    { q: 'Cabin crew briefing for a diversion should include...', o: ['Nothing', 'The plan and the fuel state', 'Only the seat belt sign'], a: 1 },
    { q: 'Fatigue risk is reduced by...', o: ['Caffeine only', 'Rest and crew pairing', 'Extra long sectors'], a: 1 }
  ],
  pax1: [
    { q: 'Compared with a turboprop, a regional jet has...', o: ['Lower stall speed', 'A higher stall speed', 'No pressurisation'], a: 1 },
    { q: 'Jet rotation thrust is...', o: ['Constant for the whole take-off', 'Severe for the first metres', 'Used only in the climb'], a: 1 },
    { q: 'Flap extension on a jet is limited by...', o: ['Vfe', 'M0.5', 'The altimeter'], a: 0 },
    { q: 'A pressurised climb profile climbs...', o: ['Above FL100 first', 'To FL100 then steps up', 'Straight to FL400'], a: 1 },
    { q: 'Jets do not need...', o: ['Stall speed data', 'Propeller feathering', 'Trim settings'], a: 1 }
  ],
  pax2: [
    { q: 'The ILS localizer shows your alignment...', o: ['Vertically', 'Horizontally', 'With the wind'], a: 1 },
    { q: 'The glideslope is normally...', o: ['3 degrees', '10 degrees', '30 degrees'], a: 0 },
    { q: 'Decision height on a low-visibility approach is...', o: ['60 m above the runway', '600 ft', 'The top of descent'], a: 0 },
    { q: 'Without an IFR rating you must...', o: ['Fly below the minima', 'Make the approach visual or go around', 'Ask ATC to look'], a: 1 },
    { q: 'A missed approach is flown from...', o: ['Any point', 'The decision height', 'The top of the descent'], a: 1 }
  ],
  pax3: [
    { q: 'Downdrafts near a ridge are strongest...', o: ['At the same height as the ridge', 'Close to the surface', 'Above the ridge'], a: 0 },
    { q: 'A crosswind landing technique starts with...', o: ['Straight-in descent', 'Crab, then de-crab in the flare', 'Sideways roll'], a: 1 },
    { q: 'Cold dense air makes the aeroplane...', o: ['More sluggish', 'Nimbler and needing a higher Vref', 'Heavier on the controls'], a: 1 },
    { q: 'Mountain wave turbulence is found...', o: ['Downwind of a ridge above the crest', 'Only in valleys', 'On the sea'], a: 0 },
    { q: 'Circling approaches need...', o: ['Extra fuel', 'Less fuel', 'No weather'], a: 0 }
  ],
  pax4: [
    { q: 'A widebody Vref is typically...', o: ['25 kt above V1', '5-10 kt above Vs1', 'Below Vs0'], a: 1 },
    { q: 'Heavy jet takeoff needs...', o: ['A reduced rotation thrust', 'Max thrust and a long runway', 'Lower flaps'], a: 1 },
    { q: 'Downwind braking in the wet with anti-skid...', o: ['Is not allowed', 'Is required to the threshold', 'Is optional'], a: 1 },
    { q: 'Hot-and-high performance is...', o: ['Better', 'Degraded', 'Unchanged'], a: 1 },
    { q: 'Flap 3 for a heavy approach is set when...', o: ['At 1000 ft', 'Just before the flare', 'Never'], a: 0 }
  ],
  cargo1: [
    { q: 'Class 3 dangerous goods are...', o: ['Flammable liquids', 'Compressed gas', 'Corrosives'], a: 0 },
    { q: 'The shipper is responsible for...', o: ['The paperwork and the declaration', 'Nothing', 'The loading'], a: 0 },
    { q: 'Lithium batteries are shipped...', o: ['With the cargo', 'In the cabin only', 'Never'], a: 0 },
    { q: 'A hazmat load requires...', o: ['A briefing and segregation', 'Nothing special', 'A different airline'], a: 0 },
    { q: 'Segregation means...', o: ['Keeping incompatible loads apart', 'Loading by weight', 'Cold chain'], a: 0 }
  ],
  cargo2: [
    { q: 'A forward centre of gravity...', o: ['Raises the stall speed', 'Lowers the stall speed', 'Does not matter'], a: 1 },
    { q: 'A load shift aft in flight causes...', o: ['A nose-down trim change', 'A nose-up trim change', 'Nothing'], a: 0 },
    { q: 'The zero fuel weight is...', o: ['Empty weight + payload', 'Takeoff weight − block fuel', 'Payload only'], a: 1 },
    { q: 'Overweight take-off performance...', o: ['Improves', 'Degrades', 'Is unchanged'], a: 1 },
    { q: 'Trim is set for...', o: ['Any speed', 'Take-off trim', 'Landing trim'], a: 1 }
  ],
  cargo3: [
    { q: 'De-icing must be completed...', o: ['Within the holdover time', 'Whenever', 'Before landing only'], a: 0 },
    { q: 'Holdover time depends on...', o: ['The precipitation and temperature', 'The load', 'The airline'], a: 0 },
    { q: 'Ice on the wing leading edge...', o: ['Is harmless', 'Reduces lift and raises drag', 'Increases lift'], a: 1 },
    { q: 'Anti-ice is used...', o: ['On the ground', 'In flight through icing', 'Only in the hold'], a: 1 },
    { q: 'Cold holds need...', o: ['Pre-cooling and power', 'Nothing', 'More drag'], a: 0 }
  ],
  cargo4: [
    { q: 'Main-deck loading uses...', o: ['Ramp loaders', 'Cargo holds', 'Nothing'], a: 0 },
    { q: 'A fifty-tonne load means...', o: ['The same landing distance', 'A much longer landing distance', 'A shorter one'], a: 1 },
    { q: 'Ultrasonic inspection is used to find...', o: ['Fatigue cracks', 'Ice', 'Fuel'], a: 0 },
    { q: 'Freighters carry...', o: ['No crew', 'A very small crew', 'A full cabin crew'], a: 1 },
    { q: 'Overload of a freighter is...', o: ['Never allowed', 'Common and profitable', 'Only fuel'], a: 0 }
  ],
  bush1: [
    { q: 'STOL stands for...', o: ['Short take-off and landing', 'Standard taxi and loading', 'Short turbulence and low altitude'], a: 0 },
    { q: 'On a grass strip the rolling resistance is...', o: ['Lower', 'Higher', 'Zero'], a: 1 },
    { q: 'STOL take-off power is...', o: ['Maximum available', 'Reduced', 'Idle'], a: 0 },
    { q: 'A prop strike on landing usually comes from...', o: ['Too much power', 'A nose-low touchdown', 'A crosswind'], a: 1 },
    { q: 'Bush strips are often...', o: ['Lit and paved', 'One-way', 'Short, gravel and unlit'], a: 2 }
  ],
  bush2: [
    { q: 'Carburettor icing happens at...', o: ['High altitude and low power', 'Only on the ground', 'Never'], a: 0 },
    { q: 'Survival kit contents matter when...', o: ['The aircraft is far from help', 'Always', 'Never'], a: 0 },
    { q: 'Engine anti-ice costs...', o: ['Nothing', 'Performance and fuel', 'Landing distance'], a: 1 },
    { q: 'Ice on the pitot tube can make the airspeed read...', o: ['Zero', 'Too high', 'Correct'], a: 0 },
    { q: 'Cold-soaked aircraft must be...', o: ['Inspected', 'Ignored', 'Accelerated'], a: 0 }
  ],
  bush3: [
    { q: 'A medevac flight is dispatched with...', o: ['Full fuel and no alternates', 'Extra medical equipment', 'No oxygen'], a: 1 },
    { q: 'SAR sectors are searched...', o: ['By grid and drift', 'Randomly', 'Only on the ground'], a: 0 },
    { q: 'Time on a SAR contract is the...', o: ['Cheapest factor', 'Most important factor', 'Ignored'], a: 1 },
    { q: 'The captain may divert a medevac when...', o: ['Never', 'The patient requires it', 'Fuel is high'], a: 1 },
    { q: 'Night SAR needs...', o: ['NVG training', 'Nothing special', 'Extra paint'], a: 0 }
  ],
  bush4: [
    { q: 'A float landing depends most on...', o: ['A flat, level attitude and low speed', 'Power', 'Weight'], a: 0 },
    { q: 'On skis the biggest risk is...', o: ['Directional control on ice', 'Overheating', 'Noise'], a: 0 },
    { q: 'Remote strips usually have...', o: ['Fuel, but no lights', 'Everything', 'No fuel at all'], a: 1 },
    { q: 'Back-country flying needs...', o: ['Survival skills', 'A bigger aircraft', 'A longer runway'], a: 0 },
    { q: 'Sea ice thickness is checked...', o: ['Before landing on it', 'In flight', 'Never'], a: 0 }
  ]
};

// ---------- Contract generation ----------
// All money is Swedish kronor (SEK).
const CONTRACTS = {
  OFFERS: 4,
  BASE_PAY_PER_NM: 58,           // SEK per real nautical mile, before the payload fee
  PAYLOAD_FEE_NM: 650,           // load fee = kg x PAYLOAD rate x nm / this
  FACTION_MULT: { pax: 1.0, cargo: 1.05, bush: 1.2 },
  URGENT_MULT: 2.1,
  PUSHBACK_BONUS: 1200,
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

const PALETTE = {
  skyTop: '#2b6fb5',
  skyHorizon: '#bcd8ef',
  skyGround: '#9fb0a6',
  night: '#0a1226',
  sun: '#fff6d8',
  fogDay: '#c3d6e6'
};
