'use strict';

// Arlanda Rising — every tuning value of the game: time, the task tray and the duty manager, runways,
// stands and turnarounds, the terminal's check-in, snow, the night, money, the meters, construction and
// the difficulty table. Loaded before every other game file (also by tools/missions-check.js in Node).
// Times inside a day are game minutes; sums are SEK.

// ---------- time ----------
const OPS_HOUR_SECONDS = 60;       // real s per game hour at ▶ in an ops stage
const PLAN_DAY_SECONDS = 1;        // real s per game day at ▶ in a plan stage
const OPS_STEP_MIN = 0.25;         // game minutes per simulation step in ops time
const SPEEDS = [0, 1, 2, 4];       // ⏸ ▶ ▶▶ ▶▶▶
const AUTOSAVE_SECONDS = 5;        // real s between autosaves of a running mission
const MISSION_MINUTES_MAX = 10;    // real minutes at ▶ a mission may take (tools/missions-check.js)
const STAGE_MINUTES_MAX = 4;       // real minutes at ▶ a stage may take
const DECISION_SECONDS = 4;        // real s a decision in a plan stage is counted as, for the mission's minutes
const LATITUDE = 59.65;            // ° N, for the sun
const EPOCH_YEAR = 1950;           // day 0 of the calendar is 1 January of this year

// ---------- the task tray and the duty manager ----------
const TRAY_MAX = 6;                // tasks the tray holds; more go to the duty manager at once
// game minutes a task waits for the player before the duty manager takes it
const TASK_DEADLINE = { stand: 5, fuel: 6, checkin: 8, plough: 10 };
// game minutes the duty manager is late on top of that (and right only MANUAL_SUMMARY_EFF of the time)
const DUTY_LATE = { stand: 15, fuel: 15, checkin: 20, plough: 25 };
const MANUAL_SUMMARY_EFF = 0.6;    // the duty manager's efficiency, also for the skipped time between missions
// share of the income lost in summary (plan time, the skipped time) per domain still done by hand at that efficiency
const SUMMARY_LOSS = { stands: 0.04, turnaround: 0.03, checkin: 0.04, snow: 0.06 };
const STAND_TASK_LEAD = 6;         // game minutes before the landing that "pick a stand" appears

// ---------- runways ----------
const RWY_SEP = 3;                 // game minutes between two movements on one runway with a tower
const RWY_SEP_NO_TOWER = 6;        // … without a control tower
const HOLD_MAX = 30;               // game minutes an arrival holds before it diverts
const DEP_WAIT_MAX = 90;           // game minutes a departure waits for a usable runway before it is cancelled
const TAXI_BASE = 3;               // game minutes of taxiing, plus the stand's own distance
const ONTIME_MIN = 15;             // a departure up to this late is on time
const CALM_WIND = 6;               // kt: below it the player may choose the runway direction

// ---------- stands and turnarounds ----------
const SIZE_CODES = 'ABCDEF';       // ICAO aerodrome reference codes, small to large
const DEBOARD_PER_PAX = 0.06;      // game minutes per passenger leaving the aircraft (by stairs)
const BOARD_PER_PAX = 0.08;        // … getting on
const BOARD_LEAD = 25;             // boarding starts at the latest this many minutes before departure
const BOARD_WAIT_MAX = 20;         // minutes past departure an aircraft waits for passengers still at check-in
const FUEL_MIN_PER_T = 0.18;       // game minutes of fuelling per tonne of MTOW
const FUEL_DRIVE = 4;              // game minutes for a fuel truck to drive to a stand and back
const REMOTE_WALK_MOOD = 1.5;      // Passengers points lost per flight boarded at a remote stand (×2 in snow)
const WRONG_STAND_DELAY = 6;       // minutes lost when the duty manager sends an aircraft to a poor stand

// ---------- the terminal ----------
const DESK_RATE = 0.9;             // passengers checked in per game minute per open desk
const DESK_COST_HOUR = 250;        // SEK per hour per open desk (the clerk)
const PAX_ARRIVE_FIRST = 120;      // minutes before departure the first passengers come to the terminal
const PAX_ARRIVE_LAST = 35;        // … the last ones
const CHECKIN_TASK_WAIT = 10;      // minutes of queue that make the "open a desk" task
const CHECKIN_CLOSE = 40;          // minutes before departure the flight's check-in closes
const SHOP_MINUTES_FULL = 40;      // minutes of free time airside for the full shop spend

// ---------- snow and weather ----------
const SNOW_TASK_MM = 2;            // mm on a runway that make the "send the ploughs" task
const SNOW_POOR_MM = 3;            // mm: braking action poor (medium from 1)
const SNOW_CLOSE_MM = 6;           // mm: the runway closes
const SNOW_APRON_SLOW_MM = 4;      // mm on the apron that make every turnaround step slower
const SNOW_APRON_SLOW = 1.3;       // × the steps' time
const PLOUGH_MIN = { runway: 14, apron: 18 }; // game minutes a convoy of PLOUGH_CONVOY ploughs takes a runway; the apron team
const PLOUGH_CONVOY = 4;           // ploughs of a full convoy; fewer take longer
const PLOUGH_LEFT_MM = 0.3;        // what a cleared surface keeps
const PLOUGH_RUN_COST = 1500;      // SEK of fuel and overtime per convoy run
const CLOSE_CALL_POOR = 0.12;      // chance of a close call per landing on poor braking action
const FOG_VIS_MIN = 400;           // m: below it the runway takes no movements (no landing system yet)
const FOG_VIS_APPROACH = 250;      // … with approach lights

// ---------- the night ----------
const NIGHT_FROM = 22 * 60, NIGHT_TO = 6 * 60; // minutes of the day counted as night for the noise
const NOISE_ARR_TOWN = 1, NOISE_DEP_TOWN = 2, NOISE_FOREST = 0.3; // noise units per movement
const NOISE_NIGHT_X = 3;           // × at night

// ---------- money ----------
const LANDING_FEE_PER_T = 60;      // SEK per tonne of MTOW
const PAX_FEE = 110;               // SEK per departing passenger (international)
const PAX_FEE_DOMESTIC = 70;       // … domestic
const SHOP_SPEND = 25;             // SEK the airport gets per departing passenger from a café with full free time
const SHOP_MAX = 1.5;              // the shops' shares (data/buildings.js `shop`) add up to at most this
const PARKING_PER_PAX = 14;        // SEK of parking per departing passenger when the car parks take them all
const STAND_FREE_MIN = 60;         // minutes on a stand included in the landing fee
const STAND_FEE_HOUR = 800;        // SEK per hour beyond it
const DIVERT_PENALTY = 30000;      // SEK paid to the airline for a diversion the airport caused
const DELAY_PENALTY_MIN = 120;     // SEK per minute of airport-caused delay beyond ONTIME_MIN
const FEE_LEVELS = { low: 0.8, normal: 1, high: 1.25 }; // × every fee
const FEE_MOOD = { low: 3, normal: 0, high: -4 };       // airline mood points per month
const LOAN_RATE = 0.04;            // a year
const DEBT_MONTHS = { easy: 6, medium: 4, hard: 3 }; // months below zero before the owner replaces you
const STAFF_MONTH = 45000;         // SEK per full-time job a month, everything included
const UPKEEP_YEAR = 0.02;          // share of a building's price a year
const OVERTIME_X = 1.5;
const SHIFT_BONUS_MAX = 200000;    // SEK at most from "Keep the shift going"

// ---------- the meters (0–100; Passengers shown as 1–5 stars) ----------
const METER_START = { airlines: 70, passengers: 70, neighbours: 70, staff: 70, safety: 80 };
const METER_EMA = { airlines: 0.08, passengers: 0.05, neighbours: 0.02 }; // weight of one flight's result
const SAFETY_RECOVER_HOUR = 0.5;   // Safety points back per game hour, up to the airport's base
const SAFETY_CLOSE_CALL = 15;      // Safety points lost per close call
const SAFETY_MIN = 30;             // below it the runway closes until fixed
const NEIGHBOURS_NOISE_K = 6;      // Neighbours points lost per noise unit (through the EMA)

// ---------- construction (plan time) ----------
const PACE = { normal: { time: 1, cost: 1 }, fast: { time: 0.7, cost: 1.3 } };
const WINTER_WORK = 0.5;           // × construction speed in December–February
const GRANT_SHARE = 0.5;           // share of a project's price an owner's grant pays

// ---------- difficulty ----------
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];
const DIFFICULTY = {
  easy: { money: 1.5, jitter: 4, patience: 1.5, failures: 0.6, weather: 0.7, deadline: 1.5 },
  medium: { money: 1, jitter: 8, patience: 1, failures: 1, weather: 1, deadline: 1 },
  hard: { money: 0.75, jitter: 14, patience: 0.7, failures: 1.4, weather: 1.3, deadline: 0.75 }
};
