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
const TASK_DEADLINE = { stand: 5, fuel: 6, checkin: 8, plough: 10, bags: 6, announce: 4, lane: 6, booth: 6, deice: 6, charge: 6 };
// game minutes the duty manager is late on top of that (and right only MANUAL_SUMMARY_EFF of the time)
const DUTY_LATE = { stand: 15, fuel: 15, checkin: 20, plough: 25, bags: 15, announce: 12, lane: 15, booth: 15, deice: 15, charge: 15 };
const MANUAL_SUMMARY_EFF = 0.6;    // the duty manager's efficiency, also for the skipped time between missions
// share of the income lost in summary (plan time, the skipped time) per domain still done by hand at that efficiency
const SUMMARY_LOSS = { stands: 0.04, turnaround: 0.03, checkin: 0.04, snow: 0.06, baggage: 0.03, info: 0.02, security: 0.03, border: 0.02, deice: 0.04 };
const STAND_TASK_LEAD = 6;         // game minutes before the landing that "pick a stand" appears

// ---------- runways ----------
const RWY_SEP = 3;                 // game minutes between two movements on one runway with a tower
const RWY_SEP_NO_TOWER = 6;        // … without a control tower
const RWY_SEP_NEW = 2.5;           // … from the new tower of 2001 (its radar and its view of every runway)
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
const SHOP_MAX = 3;                // the shops' shares (data/buildings.js `shop`) add up to at most this
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

// ---------- the screen, the controls and the hints (session 2) ----------
const CURSOR_HIDE_MS = 2000;       // ms the mouse must be still in fullscreen before the cursor hides
const TAP_SLOP = 9;                // px a finger may move and still tap
const LONG_PRESS_MS = 550;         // ms of a press that opens a card
const ZOOM_MIN = 0.05;             // screen px per metre, zoomed out (the whole airport and more)
const ZOOM_MAX = 6;                // … zoomed in (one stand fills a phone)
const ZOOM_OPS = 0.9;              // where an ops stage starts: the apron and a stretch of runway
const ZOOM_TREES = 1.3;            // from this zoom single trees are drawn over the forest
const KEY_PAN = 700;               // screen px per second the arrow keys pan
const HINT_GAP = 25;               // real s at least between two of Kaj's hints
const HINT_REPEAT = 3;             // times one hint is shown at most (Settings: Short shows each once)
const BANNER_MS = 2600;            // ms a banner stays
const BUY_CONFIRM_MS = 2500;       // ms a buy button waits for its second tap
const GUIDED_MISSIONS = ['1-1', '1-2', '1-3']; // missions with the guiding finger

// ---------- people, unions and managers (session 3, sim/people.js) ----------
const ABSENCE_BASE = 0.04;         // share of a team away on an ordinary day
const FLU = { 12: 1.3, 1: 2.2, 2: 3, 3: 1.4 }; // × the absence by month: the flu season
const SUMMER_AWAY = 0.3;           // extra share away in July (the Swedish summer holiday) unless it was spread out
const ABSENCE_SLACK = 0.05;        // a team covers this much absence itself
const SHORT_K = 3;                 // each point of absence above the slack sends this share of the team's tasks to the tray
const STRIKE_CAPACITY = 0.15;      // a team on strike does this share of its work
const OVERTIME_FATIGUE = 15;       // fatigue points a stage of overtime adds to a team
const OVERTIME_STAGE = 0.35;       // × a team's monthly wages / 30 (a day) a stage of overtime costs
const TEMPS_COVER = 0.15;          // absence the seasonal temps cover
const TEMPS_DAYS = 90;             // days the temps stay
const TEMPS_JOB = 30000;           // SEK per temp job a month (a temp for every job of the team × TEMPS_COVER)
const SPREAD_COST = 15000;         // SEK per job for spreading the summer holidays (the holiday-move bonus)
const HIRE_DAYS = 14;              // days from hiring a team to its first shift (plan time)
const CLEARANCE_DAYS = 42;         // … for a job that needs a security clearance
const HIRE_COST = 40000;           // SEK per job to recruit and train a new team
const TRAIN_COST = 25000;          // SEK per job for a course
const TRAIN_SKILL = 15;            // skill points a course adds
const SKILL_START = 45, SKILL_MAX = 85, SKILL_MONTH = 2; // a new team's skill, the most, what a month of work adds
const MORALE_START = 65;           // a new team's morale
const MORALE_BASE = 62;            // the morale a team drifts toward with a fair wage and no trouble
const MORALE_DRIFT = 0.3;          // share of the way to it a month goes
const FATIGUE_DECAY = 0.5;         // share of the fatigue left after a month
const LAYOFF_MORALE = 12;          // morale points every team loses at a lay-off
const MANAGER_SALARY = 90000;      // SEK a month, a manager's base salary (× the candidate's own)
const MANAGER_POACH = 0.1;         // chance a month that an unhappy manager (mood under 40) leaves for a rival airport
const MANAGER_RAISE_MONTHS = 24;   // months between a manager's raise requests
const MANAGER_YEARS = 14;          // years before a manager retires
const WAGE_ROUND_MONTHS = 18;      // months between two wage rounds of a team
const WAGE_DEMAND = 0.06;          // the union's demand in a mission's wage round (a raise of the wages)
const WAGE_DRIFT = 0.015;          // the raise of a round settled between missions (no inflation in the game)
const MORALE_BONUS_KEEP = 0.92;    // share of a wage deal's morale bonus left after a month
const STRIKE_NOTICE_DAYS = 7;      // a strike starts a week after its notice (as in Sweden)
const STRIKE_DAYS = 3;             // days a strike lasts
const STRIKE_LOSS = 2;             // × the summary loss of a domain on strike days

// ---------- systems and their failures (session 3, sim/systems.js) ----------
const IT_JOB = 55000;              // SEK a month per IT job
const READINESS_DECAY = 0.1;       // fallback readiness lost a month without a drill
const READINESS_MIN = 0.2;
const CHECKIN_SYSTEM_X = 1.5;      // × the passengers a desk checks in with check-in computers working
const DRILL_COST = 150000;         // SEK for a drill day
const RETRAIN_COST = 30000;        // SEK per job to retrain the team a system replaces
const POWER_CUT_MIN = 40;          // game minutes a power cut takes the systems without backup power down
const SUMMARY_DOWN = 0.5;          // × a system's share of the summary loss while it is down

// ---------- the airfield (session 3) ----------
const CROSSWIND_MAX = 20;          // kt of crosswind a runway takes; more and the other runway (or none) is used
const FOG_VIS_ILS = 120;           // m: the landing minimum with an instrument landing system
const LVP_SEP_X = 1.6;             // × the separation in low visibility (under FOG_VIS_APPROACH, with the ILS)
const FIRE_CAT_BASE = 7;           // the fire service's category with the first fire station; + 1 per crash tender
const FIRE_CAT_MAX = 10;
const EMERGENCY_CLOSE = 12;        // game minutes the runway stays closed after an emergency landing
const EMERGENCY_CLOSE_LOW = 25;    // … when the fire category is too low for the aircraft
const BAG_CART_MIN = 6;            // game minutes the carts take to unload and load the bags
const LOST_BAG_SHARE = 0.04;       // share of the bags lost when the duty manager sends the carts wrong
const LOST_BAG_MOOD = 6;           // Passengers points per flight with lost bags
const ANNOUNCE_LEAD = 2;           // minutes past its departure time a late flight's delay must be announced
const ANNOUNCE_OK = 6;             // minutes the announcement may take before the passengers count it as none
const ANNOUNCE_MOOD = 14;          // Passengers points lost for a late flight nobody told them about
const BUS_PARKING = 0.3;           // share of the car parks' takings the airport coaches take away

// ---------- the terminal's flow, brands and ground transport (session 4, sim/terminal.js) ----------
const LANE_RATE = 2.5;             // passengers through one security lane per game minute
const LANE_COST_HOUR = 500;        // SEK per hour per security lane (the screeners), in ops time
const LANE_MONTH = 60000;          // SEK a month per security lane, in summary
const UNIT_FIT = { kiosk: 0.6e6, unit: 2.5e6, big: 9e6, desk: 0.3e6 }; // SEK to fit out a unit for a brand
const BRAND_SAME_KIND = 0.6;       // × the spend of each further brand of the same kind in one terminal
const BRAND_PAX_MAX = 6;           // Passengers points a terminal's brands give at most
const FAMILY_MONTHS = [6, 7, 8, 12]; // months when families fly: the kids' brands draw more
const TRAIN_SHARE = 0.22;          // share of the departing passengers who come by train once it runs
const TRAIN_TICKET = 45;           // SEK per train passenger the airport gets when it owns the line
const TRAIN_STATION_FEE = 6;       // … with a concession: the station fee
const TRAIN_PARKING = 0.35;        // share of the car parks' takings the train takes away
const TRAIN_PAX = 5;               // Passengers points the train gives
const TRAIN_NEIGHBOURS = 4;        // + the Neighbours' base once the trains run (fewer cars)
const TRAIN_FIRST_DAY = '1999-11-24';   // the first Arlanda Express train (sv.wikipedia Arlandabanan; en.wikipedia says the 25th)

// ---------- airlines, incentives, rivals and offers (session 4, sim/airlines.js, sim/offers.js) ----------
const INCENTIVE_MONTHS = 24;       // months a route incentive's discount lasts
const INCENTIVE_MOOD = 20;         // airline mood points for a whole discount (× the share)
const LEAVE_MOOD = 45;             // an airline under this mood may move flights to a rival airport
const LEAVE_CHANCE = 0.3;          // chance a month that it does (× the difficulty's patience)
const RIVAL_PULL = 3;              // mood points a month a rival takes off the home and network airlines (× its pull)
const RIVAL_FLOOR = 55;            // … but never below this: only bad service drives an airline lower
const RIVAL_LATER = 0.25;          // × the pull once the rival's news is old (after the mission's `months`)
const NPV_RATE = 0.06;             // a year: the discount rate of the net present value
const NPV_YEARS = 20;              // years an investment is counted over
const TRAFFIC_DAYS = 30;           // days of traffic kept for the payback estimates

// ---------- Challenge Days (session 4, sim/challenges.js) ----------
// points of a Challenge Day: per departure on time and late, × the Passengers meter at the end, per flight lost, close
// call, delay not announced and bag lost, per minute of delay the airport caused, per departure × its average wait
const CHALLENGE_POINTS = { onTime: 10, late: 3, paxMeter: 10, lost: -120, closeCall: -200, unannounced: -15, lostBag: -10, adelay: -2, wait: -3 };

// ---------- the border, security rules, runway 3, de-icing, real estate (session 5, chapter 5) ----------
const SCHENGEN_DAY = '2001-03-25'; // Sweden's first day in the Schengen area: passport control only for non-Schengen flights
const BOOTH_RATE = 2.2;            // passengers through one passport booth a game minute
const BORDER_TASK_WAIT = 8;        // minutes of queue at the border that make the "open a booth" task
const BOOTH_MONTH = 15000;         // SEK a month per booth: the airport pays the space, Polisen the officers
const EGATE_X = 1.8;               // × a booth's passengers with the e-gates working
const SEC_RULE_X = [1, 0.78, 0.68]; // × LANE_RATE by the rules of the day: before 2001, after 2001, liquids in bags (2006)
const CT_X = 1.45;                 // × the lane's rate with CT scanners (liquids and laptops stay in the bag), from the 2001 rules
const SEC_TASK_WAIT = 8;           // minutes at security that make the "open a lane" task (the security domain)
const SEC_SENSOR_WAIT = 3;         // … with the queue sensors working: they open a lane before the queue builds
const R3_TAXI = 5;                 // game minutes more taxiing to or from runway 3 over the taxiway bridges
const DEICE_TEMP = 0;              // °C: at or below it every departure needs de-icing (once the domain is open)
const DEICE_MIN = 7;               // game minutes a de-icing truck works on an aircraft at its stand
const DEICE_PAD_MIN = 3;           // game minutes more taxiing out through a remote de-icing pad
const GLYCOL_COST = 12000;         // SEK of de-icing fluid per aircraft (a few hundred to a few thousand litres)
const GLYCOL_RECOVER = 0.3;        // share of the fluid bought less with glycol recovery
const DEICE_WINTER_SHARE = 0.5;    // share of the winter departures de-iced, in summary
const SKY_SPEND = 0.35;            // × the spend of the brands in Sky City for every departing passenger (landside, no free-time rule)

// ---------- A-CDM, self bag drop, the green rating, the permit, events (session 5, chapter 6) ----------
const ACDM_TAXI_X = 0.7;           // × the taxi-out minutes with A-CDM working (start-up given in sequence)
const SBD_X = 1.6;                 // × a desk's passengers with self bag drop working
const ENERGY_MONTH = 5e6;          // SEK a month of heating and power for the terminals (from chapter 6), × 1.5 in winter
const ENERGY_SAVE = { aquifer: 0.2, solar: 0.05 }; // share of the energy bill each saves
const BIOFUEL_MONTH = 40e6;        // SEK a month the airport pays for a whole share of biofuel (× the share)
const GREEN_BASE = 30;             // the green rating of an airport that does nothing
// green rating points: the train, the coaches, the aquifer, the solar park, glycol recovery, biofuel (× the share ×
// 100), electric apron vehicles; minus each big car park
const GREEN_PTS = { train: 10, bus: 4, aquifer: 14, solar: 7, glycol: 10, biofuel: 0.6, electric: 8, carPark: -3 };
const PERMIT_FINE = 3e6;           // SEK a month the environmental permit is broken
const PERMIT_NEIGHBOURS = 2;       // Neighbours points lost each month it is broken
const EVENT_CHANCE = 0.4;          // chance an ops stage gets a random event (once a mission turns them on)
const EVENT_GAP = 60;              // game minutes from the stage's start before a random event may come
const VIP_STAND_MIN = 75;          // game minutes a stand is kept for a VIP or state flight
const ASH_HOTEL = 900;             // SEK a night per stranded passenger the airport helps with (cots, food, hotels)

// ---------- the storm years and the future (session 6, chapters 7 and 8) ----------
const DEMAND_MIN = 0.05;           // the least share of the normal traffic a crisis leaves (S.airport.demand, in summary)
const MOTHBALL_SAVE = 0.85;        // share of a mothballed terminal's jobs, upkeep and energy saved while it is closed
const MOTHBALL_ENERGY = 0.12;      // share of the energy bill each terminal mothballed saves (from chapter 6's bill)
const REOPEN_COST = 25e6;          // SEK to clean, test and staff a mothballed terminal again
const REOPEN_DAYS = 21;            // days from the decision until it opens (plan time)
const RENT_RELIEF = 0.7;           // share of the brands' rent let off while the relief runs
const RENT_STAY = 0.5;             // share of the brands that stay through a crisis without relief (the rest close)
const FURLOUGH_PAY = 0.25;         // share of a furloughed job's wage the airport still pays (the state pays the rest)
const LAYOFF_PAY_MONTHS = 3;       // months of wages paid out to each job laid off (notice)
const CUT_K = 1.4;                 // a team with this share of its jobs gone does (1 − share × CUT_K) of its work itself
const CARGO_TONNES_FEE = 1400;     // SEK the airport earns per tonne of cargo loaded or unloaded (handling, the cargo apron)
const CHARGE_MIN = 12;             // game minutes an electric aircraft charges at a stand with a charger
const CHARGE_MOBILE_MIN = 26;      // … from the mobile charger, sent to it by hand or by the ramp team
const H2_MIN = 15;                 // game minutes a hydrogen aircraft takes on fuel at the hydrogen depot
const ROBOT_X = 0.8;               // × the turnaround's service minutes with the apron robots working
const AUTO_PLOUGH_X = 0.6;         // × the convoy's minutes with the self-driving ploughs working
const BIO_BOARD_X = 0.7;           // × the boarding minutes with biometric boarding working (faces as boarding passes)
const BIO_X = 2.6;                 // × a booth's passengers with biometric boarding working (instead of EGATE_X)
const HEAT_TEMP = 30;              // °C: from here the heat slows the ramp (unless the robots do it) and the heavy jets need the long runway
const HEAT_PAX = 25;                // Passengers points off each departure's result in the heat in a terminal not cooled
const HEAT_SLOW = 1.35;            // × the turnaround's minutes in the heat with people on the ramp
const HEAT_HEAVY_T = 200;          // t of maximum take-off weight from which a departure needs runway 1 (3 300 m) in the heat
const CYBER_SPREAD = 4;            // systems a cyber attack takes down at most without a security operations centre (the integrated first)
const GREEN_PTS_6 = { charger: 1.5, nightTrain: 6, h2: 4, greenPier: 6 }; // green rating points: each charging stand (up to 6), the night train, the hydrogen depot, the green pier
const BLACKOUT_LANE_X = 0.75;      // × a security lane's passengers in a blackout (the bags searched by hand)
const LEAVERS_2022 = 0.3;          // share of the furloughed staff who found other work in the long pause (half of it of those kept on)
