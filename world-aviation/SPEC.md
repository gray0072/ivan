# World Aviation — SPEC

Developer/agent spec for the `world-aviation` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

## Idea

A career flight simulator in the browser: you are a Swedish commercial pilot (EASA ATPL) flying out of **Stockholm Arlanda**. You are only the pilot — there is no company of your own: the clients are real airlines. The career starts with Swedish domestic flying, then Scandinavia and the North Atlantic, then — region by region — the whole world: Europe, the Middle East and Africa, the Americas, Asia and the Pacific. Every flight is a full cockpit-view departure-and-arrival between real airports — push back from the gate, start the engines, taxi, take off, handle whatever the weather and the aeroplane throw at you, land, and taxi to the gate. You earn money, reputation and licences, fly bigger aircraft (up to the Airbus A350 and the Boeing 747-8F), and take contracts from passenger airlines, freight companies and remote operators.

The game speaks **English, Russian or Swedish**, picked at the top of the title screen (see Language below); English is the source text. The sim is arcade-leaning but built on real forces (lift/drag/thrust, stall, weight, wind, icing, fuel burn, pressure altitude) rather than on fake "up = up" controls.

## Tech stack

HTML5 + CSS3 + vanilla ES2017 JavaScript, no build step, no package manager.

The 3D world is rendered with **three.js** (r147, the UMD build), **vendored into the project folder** as `lib/three.min.js` and loaded with a plain `<script src>` tag — no CDN, no bundler, no ES modules, so the folder still works offline, from `file://`, and when copied out of the repo on its own. It is a single vendored file, not a dependency the repo has to install. `WEBGL` is required for the flight view; if WebGL is unavailable the game says so and offers the rest of the career screens.

Rendering layout:

- **`lib/three.min.js`** (vendored, ~594 KB) — WebGL renderer, scene, camera, lighting.
- **WebGL canvas** — the world: sky dome shader, terrain mesh, sea, runways and taxiways (canvas-generated textures with real markings), buildings, trees, clouds, aircraft, other traffic.
- **Canvas 2D overlay** — the cockpit: window frame, glareshield, the full instrument panel (airspeed, attitude, altimeter, HSI, VSI, engine gauges, warning lights), windshield effects (rain, snow, frost, fog, lightning) and the HUD. Rain and snow are particles in the air ahead of the cockpit (world metres around the eye, seen through the cockpit camera): they drift with the wind and fall, and the aeroplane flies through them, so parked the snow drifts down past the glass and at speed it streams out of the point the aeroplane is flying at; each particle is drawn as the streak it makes in a short exposure (`PRECIP_FX` in `ui/cockpit.js`). A 2D overlay keeps the gauges crisp and cheap and lets the cockpit frame be drawn on top of the 3D scene.
- **Web Audio API** — synthesized sounds, no audio files; spoken callouts with `speechSynthesis` where the browser has it.

Terrain: every flight builds a heightmap of its own part of the world (see below) and one near-field mesh that follows the aircraft (110–420 m cells depending on the quality preset and the height, heights and normals rebuilt on the CPU when the aircraft has moved far enough), so the ground stays detailed under the wheels without a huge vertex count. The far mesh sits 30 m under the real ground and the near mesh fades into it at its edge, so they never fight; that holds at its vertices, so every far vertex whose triangles can reach an airport's ground also goes under that field's elevation (`Terrain.farVertexHeight`) — otherwise a 4–6 km triangle between a low coastal field and the hills around it passes over the apron and hides it (Kalmar); the renderer uses a logarithmic depth buffer for the same reason.

**The world of a flight.** The globe cannot be one flat map, so every flight gets its own: an azimuthal equidistant projection centred on the great-circle midpoint of the route (`Theatre` in `utils.js`). The route is then a straight line of its true length, and nothing near it is distorted, anywhere on Earth (the date line included). Distances are compressed by `WORLD.SCALE` = 0.45, so the 3 400 nm Stockholm–New York leg is about 1 530 nm of flying. `World.prepare(from, to)` (about a second, behind a "Preparing the route" screen) builds:

- **the terrain** (`terrain.js`): a grid over the route plus 500 km around it (at least 1 400 km across), 5–18 km real between samples (about 300 across). Land or sea comes from a scanline fill of the coastline polygons in `geodata.js` (every continent and the major islands, coarse — a degree or two — except Scandinavia, which is drawn in detail), with inland seas and lakes cut out (the Black Sea, the Caspian, the Great Lakes, the Nordic lakes and fjords). The height comes from the distance to the coast, about 80 mountain ranges and plateaus (the Scandes, the Alps, the Himalaya and Tibet, the Rockies, the Andes, …) and fBm noise keyed on latitude and longitude, so a place looks the same on every flight. Colours follow the latitude in both hemispheres: tropical green, the great deserts, birch and pine in the north, tundra, and a snow line from 4 800 m in the tropics down to 560 m in the Arctic;
- **the airports** in that area, placed and laid out (`World.airports` / `World.here`); `World.list` / `World.byId` hold every airport's static data for the career and the screens.

Weather follows the latitude, the hemisphere (seasons are reversed in the south) and the field elevation.

World axes: x = east, y = up, z = south at the centre of the projection; headings are clockwise from the projection's north.

Airports are all built from one template around the runway in use (`LAYOUT` in `constants.js`): the runway is flown in its designator's direction for both take-off and landing (the surface wind is always within 70° of it), a parallel taxiway on the right with three exits and the holding point at the runway start, an apron lane with the gate stands (nose-in towards the terminal), a terminal, a tower, hangars, a fuel farm and a cargo shed. Where two taxi lines meet at an angle (a corner, a T, a stand off the apron lane) `World.buildFillets` puts an arc tangent to both (38 m radius on the taxiways, 30 m at the stands, `LAYOUT.FILLET_R` / `FILLET_STAND_R`): the pavement gets a fillet there, the centreline and the edge lines curve round it, and `Flight.surfaceAt` counts it as taxiway.

`airport3d.js` builds them in the airport's own frame (x across towards the terminal, z = −t down the runway):

- **The runway** has its own fine texture (up to 256 × 8192): asphalt with grain, repair patches and crack sealing, concrete ends with slab joints, rubber and tyre streaks in the touchdown zone, paved shoulders, 60 m blast pads with yellow chevrons, and the markings (threshold bar and piano keys, designators, touchdown zone bars, the aiming point at 400 m on long runways). Lights are `THREE.Points` of a fixed pixel size: white edge lights (yellow over the last 600 m), centreline lights (red/white, then red at the end), green threshold and red end bars, an approach light system to 900 m with a crossbar at 300 m and a sequenced flasher running towards the threshold, blue taxiway edge lights, green taxiway centreline lights every 30 m (round the curves too). The lights draw without fog, so they show through haze much further than the ground (out to 2.5 times the visibility), and grow a little at night. The **PAPI** (four lights left of the runway, 300 m in) is live: each light is white when the eye is above its angle (3.5° / 3.17° / 2.83° / 2.5°) and red below, so on the glide path it shows two and two.
- **The ground texture** (4096 px along on Medium/High, 2048 on Low) has grass with mowing stripes and a lighter runway strip, taxiways and the runway connectors with sandy shoulders, the apron in concrete slabs with a service road, an oil stain on each stand, the landside road with a kerb, the car park full of cars, trees, the perimeter road and the fence. Its edges fade out into the terrain. Both planes are cut into cells of 60–100 m: the logarithmic depth buffer needs small triangles near the eye, or the terrain shows through (the buildings' walls are cut into cells of about 12 m for the same reason).
- **The fine markings** are thin strips of geometry just above the ground, not part of the ground texture (1–2 m a texel there, which smeared a half-metre line into a wide band), built in `Airport3D.buildMarkings`:
  - yellow, 0.16 m up: the taxi and apron centrelines (0.45 m, with a small disc at every joint so the turns have no gaps), the **taxiway edge lines** (0.45 m, just inside the pavement edge, round the outside of the whole network only: both sides and the round ends of every taxiway segment, with whatever falls on other pavement — another taxiway, the runway and its shoulders, the apron, a hangar pad — cut away, so the lines stop exactly where the taxiways meet and the outside of every bend is rounded), the curved centrelines round the fillets, the stand lead-in lines and stop bars, and the runway holding position (two solid and two dashed lines);
  - red, 0.155 m up: each stand's safety box and its dashed equipment restraint line;
  - white, 0.15 m up: the runway edge lines and centreline (0.9 m), the landside roads (solid edge lines, dashed lane lines, a solid line in the middle, mitred round the corners and ending where the ground texture fades into the terrain), the zebra crossings, and the lines of the apron service road and of the tail-of-stand road along the apron's airside edge. On desktops the renderer multisamples (antialias), so thin things — the markings, the terminal's window mullions — do not shimmer as you taxi past; phones keep the fill rate.
- **The look of each airport** (`AIRPORT_LOOK` in `data/airports.js`: a city symbol and a colour; the country's flag and greeting in `data/countries.js`): the airport's name in big letters on the terminal roof (facing the apron and the road), the roof slab and the tower band in the airport's colour, a "Welcome to <city>" banner with the city symbol, the local greeting and a flag strip on both fronts of the terminal, three flagpoles on the roof (country, city flag = the symbol on the airport colour, country) and a flag over the tower. The flags and the windsock turn downwind and stream or droop with the surface wind; a flag is bent vertex by vertex about its hoist edge, which stays on the pole (the cloth never swings through it). The hangars have an arched roof (a half cylinder across, its end caps above the walls, never in their plane, which flickered). The hangars carry the home airlines' logos, the cargo shed a cargo carrier's, and the parked aeroplanes at the gates wear the home airlines' liveries (`airlinesAt` in `data/airlines.js`). Also a localiser array past the far end, a glideslope mast, a red runway holding sign and yellow exit signs.
- **Life on the apron** (`render/apron3d.js`): a sharp stand number plate on each lead-in line and a stand board on the terminal; at every stand with a parked aeroplane a jet bridge to its front door (medium and big terminals; at small ones an airstair truck), a GPU, a belt loader with a baggage train at the aft hold, a fuel truck under a jet's wing, a catering truck at a big jet, cones at the nose, the wingtips and the tail. The stands the player uses this flight are empty, their bridge retracted along the terminal. Floodlight masts on both sides of the apron; traffic: baggage trains and a follow-me car on the tail-of-stand road, cars on the landside roads. Static parts are merged into one vertex-coloured mesh per group (`kit()`), so a busy apron is a handful of draw calls. During the push back a tug sits at the nose gear.
- **At night** the apron gets pools of floodlight, the terminal's glass and windows, the name on the roof, the banners, the tower cab, the hangar door lamps, the cargo shed's windows and the stand boards light up, the floodlight lamps and the cars' head and tail lights come on.

## Screens

1. **Title** — the language (English / Русский / Svenska) at the top, Continue / New career, difficulty (Easy / Medium / Hard), Graphics, sound, units, How to fly, reset career.
2. **Ops (career hub)** — five tabs. Next to its name the **Hangar** tab shows how many aircraft types are unlocked (a small count; the tooltip says "of N"), and **Training** and **Network** get a pulsing gold dot when there is something to do there right now — a course that is open and affordable, traffic rights you qualify for and can pay for — so a dot always means an action, never just "something exists".
   - **Dispatch** — the contract board (3–5 offers), each with client, route, load, payout, requirements.
   - **Network** — the regions of the world and their traffic rights (reputation, flights, price).
   - **Hangar** — the aircraft ladder, specs, lease/buy, "which aircraft is selected".
   - **Training** — the technology tree (see below) with branches and tiers, in the game's language: branch names, course names, descriptions, effects, statuses and buttons (`QUIZ_TEXT`, `COURSE_TEXT` in `data/quizzes.js`); the exams run in it too.
   - **Career** — money, reputation with the three client factions, licences, block time, landings, records, cheat count.
3. **Briefing** — route map, runway in use at both ends, distance, block time, payload, fuel plan, weather at departure/arrival/cruise altitude, NOTAM-style hints, and the two start options:
   - **At the gate** — full sequence: doors closed, push back by tug, engine start, taxi. Pays the **full ground procedure** bonus: +6 % of the contract (`CONTRACTS.FULL_GROUND_BONUS`) and +0.3 reputation (`FULL_GROUND_REP`), not when you took off without a clearance. This is the real routine of the job, so doing it is rewarded.
   - **After pushback** — the tug has already moved you to the runway hold: about 5 minutes less block time (less lease on flights over an hour) and about 40 s less of the deadline, but no procedure bonus. For when you just want to fly. Available from the first flight.
   - The choice is the pilot's habit: it is kept in the career (`Career.data.skipPushback`, `Career.setSkipPushback`), pre-selected on every briefing and used by Try again and Restart; a new career starts at the gate.
   - **Practice the landing** (a button next to "Fly it", with its fee): a simulator session of this contract's landing, see **Practice landing** below.
4. **Flight** — the cockpit view, phases: `GATE → PUSHBACK → ENGINE_START → TAXI_OUT → HOLD_SHORT → TAKEOFF → CLIMB → CRUISE → DESCENT → APPROACH → ROLLOUT → EXIT (taxi in) → SHUTDOWN → PARKED`. A prompt always says what to do next (on the left under the contract strip, off the view ahead; on a touch screen a tap folds it to its first line and a new phase unfolds it); **Enter** (touch: **Go**) advances the ground procedure:
   - `GATE`: Enter calls the tug → `PUSHBACK` (14 s, the tug pushes you back onto the apron lane and turns you towards the taxiway; the engines may be started meanwhile) → `ENGINE_START` (Enter starts the engines one after the other; N2, light-off, N1 to idle) → **Space** (touch: **Park**) releases the parking brake → `TAXI_OUT` (Enter there only says so; Enter is kept for the tug, the engine start and the take-off clearance) along the guidance arrow → `HOLD_SHORT` within 30 m of the holding point → set take-off flaps, Enter = take-off clearance → `TAKEOFF` (the arrow leads onto the centreline; rolling faster than 50 kt or lifting off before the clearance also moves the flight on to `TAKEOFF` — the prompts and the arrow follow — with a tower warning, a fine of 5 % of the pay and a small reputation loss) → `CLIMB` at 500 ft AGL → `CRUISE` at the selected altitude → `DESCENT` 45 nm from the destination (the arrival weather takes over) → `APPROACH` once on the localiser inside 19 nm → `ROLLOUT` at the touchdown → `EXIT` below 35 kt (taxi to the arrival gate) → park in the box and set the parking brake → `SHUTDOWN` → `PARKED` → debrief.
   - Flying over the runway and still being airborne at its far end means a go-around: back to `DESCENT`, the approach is flown again. A touch-and-go during the rollout also goes back to `APPROACH`, and only the final landing is graded.
5. **Debrief** — landing grade, touchdown data (vertical speed, speed vs Vref, distance from the threshold, centreline offset, bank and crab), the log, the invoice, the reputation change, the difficulty choice and "Next flight".
6. **Failure** — crash (terrain, ditching, wing or nose strike, gear-up landing, gear collapse), runway excursion, landing back at the departure. Shows the cause and the cost; "Try again" (the same contract) or "Back to ops", with the difficulty choice.
7. **Pause** (Esc) — resume (Esc / Space / Enter), restart the flight, controls, abandon to Ops, the difficulty choice.
8. **Quiz** — a training course's exam (`data/quizzes.js`): four questions drawn from a pool of five, three options each (shuffled), pass mark 3/4. Written for a school pupil: plain words, one clearly right answer. A **Hint** button shows a clue before answering; after each answer the right option is marked and the same text explains it, then **Next**. The exam runs in the game's language (English, Russian or Swedish, picked on the title screen).

## Time of day

The briefing offers four departure times (`TIME_OF_DAY`, remembered in the career, `Career.timeOfDay`): **Day** 13:00, **Dusk** 17:42 (+5 % of the pay), **Night** 23:00 (+15 %), **Dawn** 06:18 (+5 %); the bonus is a line on the invoice ("Night flight"). The clock starts at the departure's local time and runs with the flight (`env.hour0` + the flight time), shown on the strip as LOCAL TIME, so a long dusk flight lands in the dark. The sun follows a generic path (`sunAt` in `utils.js`: equinox, latitude 50°: up at 6, 40° high at noon, down at 18).

- **The sky**: day, dusk and night colours mixed by the sun's height; at dusk the horizon glows on the sun's side; at night 1 400 stars (they fade in as it darkens, and in poor visibility) and a full moon opposite the sun, which lights the world in a pale blue. The fog, the clouds and the ambient light take the colour of the hour.
- **The aircraft lights** (`AircraftModels.build`: points of a fixed pixel size, bigger in the dark): red and green navigation lights on the wingtips and a white one on the tail, a red beacon on top and under the belly (flashing once a second), white strobes on the wingtips (a double flash every 1.2 s), landing lights in the wing roots and a taxi light on the nose gear. The crew's logic (`Scene3D.lightsFor`): navigation lights and beacon with the engines running, strobes on the runway and in the air, landing lights with the gear down on the runway and below 3 000 ft, the taxi light when taxiing. Parked aeroplanes are dark.
- **The landing light pool**: in the dark a soft pool of light lies where the landing (or taxi) lights' beam meets the ground ahead, seen from the cockpit too: on a night approach the runway comes up in it.

## Practice landing

From the briefing, **Practice the landing · {fee}** starts the contract's flight already on the final at the destination: 3 nm out on the glide path (`PRACTICE.START_NM`), **clean** (gear and flaps up, about Vref + 25: the configuration is part of the practice; the prompt asks for the gear, the flaps and Vref), at the chosen time of day, the arrival weather, no emergencies, no deadline, the strip headed PRACTICE LANDING. The autopilot flies the ILS for 5 real seconds (`PRACTICE.AP_SECONDS`), then disconnects with "Your controls — gear, flaps, land and brake below 35 kt"; you land and brake below `SIM.ROLLOUT_EXIT_KT` on the runway, and the practice is over.

- **The fee** is paid when it starts: 5 % of the aircraft's hourly lease, at least 100 kr (`PRACTICE.FEE_LEASE_SHARE`, `FEE_MIN`; 120 kr in the Vikna 19, 1 100 kr in the 737). Restarting from the pause is a new session and is paid again.
- **A landing** is graded like a real one (`Game.gradeLanding`) and earns reputation with the contract's client group: A+ 0.5, A 0.4, B 0.2, C 0.1 (`PRACTICE.REP`). Only the improvement on that contract's best practice counts (`contract.practiceRep`), so repeating a landing does not farm reputation. Cheats void it.
- **No landing** — a crash, a runway excursion, flying past the runway, a touch-and-go, climbing above 3 000 ft AGL or flying 2 nm further out: no damage bill, no lost reputation, no crash in the statistics; only the fee is gone.
- **The result screen** shows the grade and the touchdown numbers (or what went wrong), the reputation gained, the fee, and three buttons: **Try again** (a new paid session), **Back to the briefing**, **Fly it for real**.

## Flight model

Fixed 60 Hz physics step with render interpolation, world in metres (x = east, z = north, y = altitude MSL), speeds in knots internally.

Forces, all real:

- **Lift** `L = ½·ρ·V²·S·CL(α, flaps, slats, ice)` — `CL` from a linear curve with a soft stall break past the critical α, plus stall behaviour: the nose drops, lift collapses, a stall warning sounds at `α` slightly before the break.
- **Drag** `CD = CD0 + k·CL²` with `CD0` raised by gear, flaps, ice and (in a go-around) the spoiler.
- **Thrust** per engine, scaled by throttle, density ratio `σ` (so climb performance decays with altitude) and by airspeed (propellers lose static thrust with speed).
- **Weight** affects `CL` needed, stall speed (`Vs = √(2mg/(ρ S CLmax))`), climb rate, acceleration and touchdown distance — a heavy jet flies nothing like an empty bush plane.
- **Wind** — surface wind per airport (direction/speed), gradient wind increasing with altitude, gusts, turbulence noise, and local effects (sea breeze, rotor near high ground, crosswind on landing).
- **Ground** — normal reaction, tyre friction, nosewheel steering with rudder (hydraulic: the nosewheel turns at most 22°/s, `SIM.NOSEWHEEL_STEER_RATE_DEG`, and the turn rate builds up at most 0.9 rad/s², `SIM.GROUND_YAW_ACCEL`, so a turn starts gently), differential braking, weight-on-wheels, runway/taxiway surface detection, wet/icy grip.
- **Control surfaces** — moved by hydraulic actuators: the ailerons, the elevator and the rudder follow the stick or the keys at 2.0 / 1.6 / 1.2 full deflections a second (`CONTROLS.SURFACE_RATE`), so a key press does not throw a surface to its stop at once (the autopilot sets them directly).
- **Systems** — flaps 0–5 with limits (`Vfe`/`Vlo`), gear with transit time and doors, spoiler, anti-skid, stall break, overshoot at touchdown (`sink rate > 600 fpm` = damage, `> 1000 fpm` = gear collapse).

Ground operations are a real part of the game: push back, engine start (starter + fuel boost + N2 spool-up, watch the gauge), taxi with the guidance arrow, stop at the hold line, line up, takeoff, then after landing roll out, exit at the first taxiway, taxi along the taxiway centreline with a deviation indicator, and stop inside the **parking box** at the assigned gate, aligned, parking brake set, engines shut down.

## Landing and scoring

ILS-style guidance on the approach: localiser and glideslope (3°) deviation diamonds and an "on glide path" callout; a flight path marker shows where the aircraft is going. Scored on:

- touchdown vertical speed (fpm),
- distance from the threshold (touchdown zone),
- centreline offset at touchdown,
- crab/de-crab angle at touchdown,
- speed vs. `Vref`,
- rollout: stopped before the end, or exited at the first taxiway,
- taxi-in: time, centreline deviations, final stop in the parking box,
- damage and fuel used vs. plan.

Overall grade A+ … F feeds the payout multiplier (0.4 … 1.35).

## Autopilot and time acceleration

- **Y** engages the autopilot in the air (moving the stick hard disconnects it). Laterally it flies **NAV** (the default, **N**): to an initial approach fix 15 nm before the threshold on the extended centreline, then it captures the localiser — at an intercept angle under 60°, or at the fix (an aeroplane pointing the wrong way first turns onto a 45° intercept heading towards the centreline) — and tracks it as a track (crabbing into the wind) that closes the cross-track error with a 22 s time constant. Below its selected altitude it never descends under the **minimum safe altitude**: the highest ground 20 km ahead (and 1.5 km to each side) + 450 m, until it is established in the approach corridor. **; '** switch to **HDG** mode and turn the selected heading. Vertically it holds the selected altitude (**, .**, 500 ft steps; set automatically for the climb and the descent) and, on the localiser, captures the glideslope from below and descends on it. It disconnects at 200 ft AGL (decision height) — the landing is always flown by hand. An autothrottle holds the cruise speed, slows down for the descent and the approach (never below Vref, never above the flap and gear limits). It moves the thrust levers smoothly: the speed error drives them, the smoothed speed trend damps them (so they lead the slow engines instead of hunting between idle and full), and they travel at most 12 % a second.
- **Terrain**: every runway has an approach corridor (the ground stays under a 2.4° slope rising away from the threshold, 32 km out; the glideslope is 3°) and a departure corridor (3.5° past the far end), so the final approach and the climb-out are always clear even at Bergen or Tromsø. Flying by hand, **TERRAIN — PULL UP** sounds when the ground 25 s ahead is less than 120 m below the flight path (not on the localiser, where the ground is meant to come up).
- **T** makes the time run one step faster, **R** one step slower: ×1 → ×2 → ×4 → ×8 → ×16 → ×32 → ×64, only in the air above 500 ft AGL. With the autopilot engaged up to ×64 in any phase (the approach included, until the autopilot disconnects at 200 ft); flying by hand ×2 above 1 000 ft AGL, ×4 above 3 000 ft, ×8 above 6 000 ft, ×16 above 8 000 ft, ×32 above 9 000 ft and ×64 above 10 000 ft. When the conditions get stricter (the autopilot off, lower down) it steps down to the fastest allowed step and says so; T at the limit says what would allow more. The descent starts at the top of descent: at least 45 nm out, 3.2 nm per 1 000 ft to lose; long legs cruise up to 92 % of the type's cruise altitude. It drops back to ×1 on any emergency (a checklist runs at ×1) and on the ground. The simulation runs at a fixed 60 Hz on a real-time accumulator, so the speed is the same at any frame rate.

**Trim.** The pitch axis has static stability towards a trim angle of attack, and the trim follows the angle of attack being flown (1.5°/s with the autopilot, 0.6°/s by hand, never past 2° below the stall warning) — like an automatic trim, so a heavy jet flying slowly is not fighting its own stability.

## Emergencies (the point of the game)

Every flight draws its emergencies from the weighted list in `data/emergencies.js` (Easy: one, Medium: one or two, Hard: two), each pinned to one of its phases and a random moment in it (the gear failure only on aircraft with retractable gear). An emergency **interrupts the flight**: time acceleration is cut to 1×, the master caution lights, a caution chime sounds, and the **QRH checklist** panel opens:

- the title, a timer bar, and one line on **what happened** ("Fire warning on engine 2: the bell is ringing and its EGT is climbing.") — with the real engine number;
- the steps **top to bottom, in QRH order**, each with the **control that works it** on the right: the current step is lit, done steps are ticked;
- every step is worked with a real control of the aeroplane, or, for the switches that only exist in the QRH (a fire handle, a crossfeed valve, a call to ATC), with **Enter** / the **Go** button / a tap on the lit step. The checklist moves on by itself as soon as the control has been worked (a step stays ticked even if the autothrottle then moves the levers):
  - `switch` — Enter / Go / tap; `setAlt` / `setAltBy` — Enter sets the autopilot altitude (an absolute value, or so many feet below the present one; never below the arrival field + 600 ft) and engages the autopilot;
  - `idle` — the thrust levers to idle (**0**, the throttle slider down); `thrustMax` / `thrustMin` — the thrust at most / at least a value (the digit keys, the slider);
  - `antiIce` (**K** / Ice), `gearDown` (**G** / Gear, even though the gear does not move), `spoiler` (**/** / Spoiler), `apOff` (**Y** / AP), `parkBrake` (**Space** / Park);
  - `climb` — climbing at 500 fpm or more (pull the nose up); `slowVne` — the speed back below Vne;
- Enter or a tap on a step that is done with a control (or on a later step) does nothing but say which control it wants ("This one is done with the controls: press 0 — thrust to idle");
- **checklist hints** (Easy, or the Advanced Systems course) add one line under the lit step on **why** it is done;
- a few steps can go either way: a fire may still burn after the first bottle (30 %: one more step, "FIRE STILL ON — fire bottle 2"), a failed engine may **relight** (40 %: it runs its start sequence again), and the alternate gear extension drops the gear on its own weight;
- when the checklist is done, the panel turns green for a few seconds with the time used ("complete in 14 s of 25 s") and what the crew now knows ("Fire out. Engine 2 is shut down — set the thrust again and fly on with the other one."); run out of time and it turns red with what went wrong, and the failure escalates (the penalty: damage, lost fuel, lost reputation or pay, plus the specific consequence — a lost engine, a gear that drops hard, …).

The checklist clock is real time; its length is the emergency's limit × the course bonuses × the difficulty factor. The tuning (the chances, how long a ticked step stays, how long the result stays) is `QRH` in `constants.js`.

What the emergencies actually do to the aeroplane: an engine fire or failure removes that engine's thrust, a fuel leak drains 40–80 % of the tank capacity per hour, hydraulic failure weakens the brakes, depressurisation raises the cabin altitude, the gear failure locks the gear up until the checklist is done, a nav failure hides the route guidance, a bird strike limits one engine to 70 % N1, icing keeps building ice (lift down, drag and stall speed up) until anti-ice is on, windshear is a 14 s downdraft with a loss of headwind, a load shift pitches the nose down, an overspeed is a gust that pushes the speed 8 kt past Vne.

| Emergency | Steps (the control) |
| --- | --- |
| Engine fire | thrust levers idle (0) · fire handle pull (Enter) · fire bottle 1 (Enter) · maybe bottle 2 (Enter) |
| Engine failure | confirm on the gauges · check the fuel · relight (Enter each; 40 % it starts again) |
| Fuel leak | compare fuel used and on board · crossfeed open · pumps on the leaking side off (Enter) |
| Fuel state | check fuel to destination · "minimum fuel" to ATC (Enter) |
| Icing | anti-ice on (K) · autopilot 2 000 ft lower, out of the cloud (Enter) · flaps and gear stay up (Enter) |
| Windshear | autopilot off (Y) · full thrust (9) · climb (↓) — 15 s |
| Bird strike | check the gauges (Enter) · thrust 40 % or less (4) · report to ATC (Enter) |
| Cabin altitude | oxygen masks (Enter) · autopilot 10 000 ft, emergency descent (Enter) · speed brake out (/) |
| Gear will not extend (approach only) | gear lever down (G) · alternate extension (Enter — the gear drops) · three green (Enter) |
| Hydraulic failure | find the failed system · brake accumulator arm · landing distance +50 % (Enter) |
| Nav/comm failure | note heading and time · radio 2 · restart the navigation computer (Enter) |
| Medical emergency | cabin crew first aid · PAN PAN medical to ATC (Enter) |
| Load shifted (cargo) | seat belts on, turbulence speed · pitch trim reset (Enter) |
| Overweight / misload (on the ground) | parking brake set (Space) · check the load sheet · offload (Enter) |
| Overspeed | thrust idle (0) · speed brake out (/) · speed below Vne |

Courses change this: e.g. *Advanced Systems* adds the checklist hints, *De-icing & Winter Survival* slows ice accretion, *CRM & Cabin Safety* gives more response time.

## Difficulty

Chosen on the title screen and changeable in settings; applies to every flight of the career.

Also offered in the pause, debrief and failure dialogs (pre-selected), remembered in `localStorage`; a change applies from the next flight or the restart.

- **Easy** — wind ×0.5, turbulence light, one emergency per flight, checklist hints (why each step) and ×1.5 time, generous landing grading, no deadlines, taxi assist (the nosewheel follows the guidance arrow while the player does not steer — it takes over `CONTROLS.TAXI_ASSIST_DELAY_S` after the player lets go and turns the tiller no faster than `TAXI_ASSIST_RATE`, so a turn just made is not snatched back).
- **Medium** — wind ×1.0, moderate turbulence, one or two emergencies, checklists without hints and with normal time, standard deadlines and grading.
- **Hard** — wind ×1.5, severe turbulence, two emergencies every flight, ×0.75 checklist time, deadlines ×0.8, strict grading, ×1.5 damage from mishandled emergencies.

## Career, money and the technology tree

Currency: **Swedish kronor (SEK, kr)**. You are based at **Stockholm Arlanda (ARN)**, your home base for the whole career.

**The network.** 114 real airports in six regions (`AIRPORTS` and `REGIONS` in `data/airports.js`). A new career holds the traffic rights for **Sweden** only (13 airports, Malmö to Kiruna). The **Network** tab sells the rights to the other regions once the pilot has the reputation (the best of the three client groups) and the flights:

| Region | Airports | Reputation | Flights | Price |
| --- | --- | --- | --- | --- |
| Sweden | ARN, BMA, GOT, MMX, VBY, VXO, KLR, RNB, OSD, SDL, UME, LLA, KRN | — | — | — |
| Scandinavia & the North Atlantic | Norway, Finland, Denmark, Iceland, the Faroes, Greenland, Svalbard (23) | 5 | 3 | 20 000 kr |
| Europe | London, Paris, Frankfurt, Amsterdam, the Alps, the Mediterranean, the Baltic (28) | 15 | 10 | 90 000 kr |
| Middle East & Africa | the Gulf, Cairo, Casablanca, Addis Ababa, Nairobi, Johannesburg, … (10) | 28 | 18 | 250 000 kr |
| The Americas | New York, Chicago, the west coast, Mexico City, the Andes, Brazil, … (23) | 38 | 25 | 400 000 kr |
| Asia & the Pacific | Delhi, Bangkok, Singapore, Hong Kong, Tokyo, Sydney, Auckland, … (17) | 50 | 32 | 600 000 kr |

At Arlanda the board offers flights to the open regions within the aircraft's range; away from base it offers the flight home (if it is within range) and onward legs (towards home first). One leg is at most 4 500 nm, so the far side of the world is reached in legs. Three client groups, each with a 0–100 reputation: **Passenger airlines**, **Cargo carriers**, **Bush & air ambulance operators** (the clients themselves are real airlines, see below). Reputation gates contracts, aircraft and course tiers (0 / 15 / 35 / 60).

Aircraft (ten types, leased per sector; each with its real length, span and fuselage diameter and different mass, speeds, `Vs`, payload, fuel burn, range, crosswind limit, runway length and allowed surfaces). The fictional Nordic types sit next to real Boeing and Airbus airliners; ranges are real (Vikna 19 700 nm … A350 8 000 nm):

| Aircraft | Class | Unlocked by | Notes |
| --- | --- | --- | --- |
| Vikna 19 | 19-seat turboprop | — (the starter) | forgiving, grass strips, T-tail |
| Frostwing S-12 | bush STOL turboprop | Short Field Ops | high wing, fixed gear, grass and ice, 380 m take-off |
| Skarv F-27P | freighter turboprop | Weight & Balance | high wing, 3.6 t payload, grass |
| Fjordliner RJ-84 | 50-seat regional jet | Regional Jet Ops | rear-mounted engines, T-tail |
| Boeing 737-800 | 189-seat narrowbody | Instrument Rating | winglets, flattened engine nacelles |
| Airbus A320neo | 180-seat narrowbody | Mountain & Adverse Weather | sharklets, big new-generation fans |
| Nordjet 320 | 164-seat narrowbody | Widebody Procedures | |
| Airbus A350-900 | 315-seat widebody | Widebody Procedures | 2 600 m runway |
| Bulklord 600F | widebody freighter | Heavy Freighter Ops | 51 t payload |
| Boeing 747-8F | four-engine freighter | Heavy Freighter Ops | 134 t payload, upper-deck hump, 3 100 m runway |

Contracts are only offered to airports whose runway is at least 90 % of the type's take-off distance (Arlanda's 3 300 m runway takes every type).

**Airlines.** `data/airlines.js` holds about 85 real airlines with their livery (body, belly, cheatlines, titles, fin and engine colours, a coloured nose) and their emblem (`art/emblems.js` draws simplified versions: the SAS letters, the Lufthansa crane, the KLM crown, the Emirates flag, the Qantas kangaroo, …), the client groups they belong to, their hubs and the regions they work in. Cargo divisions (`like`) borrow the parent airline's paint. A contract's client is picked by `pickAirline`: an airline of that group based at either end of the route (weight 6), else one from either country (2), else one working in both regions (1). The contract stores the airline's code; the board and the briefing show its logo, and the player's aeroplane is painted in its colours for that flight.

Every aircraft is drawn by `models.js` from its dimensions and its `look` (low or high wing, engines under the wings / on the rear fuselage / turboprops, T-tail, winglets, hump, fixed gear, base and accent colours): a fuselage of cross-sections with a drooping nose and a tail cone whose top line stays level while the belly sweeps up, a canvas livery (windows, cheatline, cockpit glass, cargo door on freighters), tapered swept wings with dihedral, fin and tailplane, nacelles with fans and exhaust cones (turboprop nacelles with a tail cone), spinning propellers (blurred into a disc at speed), and gear with bogies on the big jets. The fuselage's triangles face outwards (it is wound from the top towards the right side), and so does every other part: the lofted surfaces are closed at the root and the tip, and the open tube of a jet nacelle has a dark inside (its back faces) and a fan face drawn from both sides, so an engine seen from behind is not half see-through. The wings, the tailplane and the fin are lofted lifting surfaces (`liftingSurface`): a NACA-like section, a little flatter underneath on the wing, thinning from root to tip, with a rounded tip. Behind the hinge line (72–76 % of the chord) they are cut into pieces, and the moving ones hang from pivots on the real hinge line: **flaps** (inner 60 % of the span, down to 35° at full flap), **ailerons** (to 20°, opposite on the two wings), **spoilers** (panels ahead of the flaps, raised 50° with the spoiler), **elevators** (to 23°) and the **rudder** (to 23°), all following the controls. The **gear** folds up about the top of each leg as it travels — the nose gear forwards, a jet's main gear inwards into the belly, a low-wing turboprop's main gear (under the engine nacelles) forwards — and disappears when it is up. In an airline's colours (`build(ac, { airline })`) the canvas also gets the belly, nose, cheatlines, the fin colour running into the tail cone and the titles on both sides (drawn upside down and backwards on the right side, where the canvas runs the other way), and the fin gets two transparent decals clipped to its outline with the airline's fin art, each drawn to read the right way round. The same models stand at the other gates in the home airlines' colours — airliners at the big airports, turboprops at the small ones.

Tree: 4 tiers × 3 branches + a general branch, 13 courses, each with a price, prerequisites, a 4–5 question quiz (pass 3/4) and real effects (unlocks, stat bonuses, procedural unlocks, reputation gates):

- **General** — Ground School (free) · Aviation Weather · Advanced Systems · CRM & Cabin Safety
- **Passenger** — Regional Jet Ops · Instrument Rating (IFR) · Mountain & Adverse Weather · Widebody Procedures
- **Cargo** — Dangerous Goods · Weight & Balance · Arctic Ground Handling · Heavy Freighter Ops
- **Bush & SAR** — Short Field Ops · De-icing & Winter Survival · Medevac & SAR Contracts · Seaplane & Remote Bases

Contracts: distance × rate × faction + load × the payload type's rate × distance / 650 (+ urgent, weather and route bonuses); the debrief adds the landing-grade bonus, on time (+8 %), the full ground procedure (+6 %, a gate start), emergencies handled (+6 % each), and subtracts the aircraft lease (per block hour, at least one hour), the fuel burnt (9.5 kr/kg), repairs (damage × 70 % of the pay), mishandled checklists, medical diversion costs, a take-off without a clearance (−5 %) and lateness (−12 %). A new board is generated after each flight, after a course, after buying traffic rights and when the aircraft or the difficulty changes. The fuel plan is the trip fuel for the compressed distance; the block fuel loaded is 1.45 × that plus taxi fuel. The deadline is in **real seconds**: ground allowance (480 s) + approach (300 s) + the airborne time at the expected time acceleration (×6 on short legs, rising with the distance up to ×40), × 1.3 slack × the difficulty factor. Below −50 000 kr the career ends (nobody will lease you an aeroplane any more).

Aircraft are leased per sector: any unlocked type can be selected in the hangar.

The new-career dialog asks only for the pilot's name (default **Sven Ekman**); it is shown on the title screen, in the ops header, on the career page and in the log. Older saves lose their operator name on load.

## Controls

Keyboard:

- **↑ / ↓** or **W / S** — pitch (elevator)
- **← / →** or **A / D** — roll (aileron)
- **Q / E** — rudder (ground steering on the nosewheel)
- **Z / X** — throttle down / up (also **− / +**, **PageDown / PageUp**)
- **1 … 9** — throttle to 10 % … 90 % instantly · **0** — idle
- **Enter** — the next ground step: push back, start the engines, take-off clearance
- **G** — landing gear (locked with weight on wheels and above Vlo) · **F** — flaps extend one notch (not above that notch's Vfe) · **V** — flaps retract · **B** — wheel brakes (hold) · **Space** — parking brake (releasing it with the engines running starts the taxi) · **/** — spoiler · **K** — engine and wing anti-ice
- **← / →** also steer the nosewheel on the ground (the rudder keys do too)
- **Y** — autopilot · **N** — back to the programme: NAV along the route and the altitude the flight plan wants now (the cruise level, or 2 500 ft above the arrival after the top of descent); engages the autopilot if it is off · **, / .** — selected altitude down / up · **; / '** — selected heading (HDG mode)
- **T / R** — time faster / slower (above 500 ft AGL: up to ×64 with the autopilot in CMD, by hand ×2 / ×4 / ×8 / ×16 / ×32 / ×64 above 1 000 / 3 000 / 6 000 / 8 000 / 9 000 / 10 000 ft) · **M** — moving map (north up; on a large desktop window it cycles mini map → big map → off) · **C** — the next view, **Shift+C** — the previous one (see Views) · **I** — instrument lights · **H** — controls card · **Esc** — pause
- The keys are read by their place on the keyboard (`e.code`), not by the character they type, so the controls work in any layout (Russian, Swedish, …).
- The cheats use **Alt + digit** so they cannot fire in normal play.
- Overlay buttons (title, ops, briefing, debrief, pause) are pressed with Space / Enter, the arrow keys move between them (a button in the same row or column always wins over a nearer one off to the side, so → from Continue career goes to New career, not down to the difficulty chips).

Touch (phones/tablets): the left half is a floating joystick (pitch/roll and nosewheel steering on the ground; its ring appears where the finger lands), the right edge has a vertical throttle slider (a thrust lever: thrust = position^1.8, so the lower half gives fine control of taxi power; the knob shows the thrust in % and follows the autothrottle and the keys when the thumb is off it), and the top right has fifteen buttons in four columns (four rows, clear of the throttle slider even on a 390 px tall landscape phone, and narrow enough to leave room for the messages between them and the contract strip): Go (the Enter step), gear, menu, flap +, flap −, brakes (toggle), parking brake, autopilot, Time +, view, map, spoiler, NAV (back to the programme), Time − and Ice (anti-ice). In a QRH checklist the lit switch is tapped (or Go); the other steps are worked with the real controls. All multi-touch, so you can fly and work a checklist at the same time. Fullscreen is requested by the Continue / Start flying / Fly it buttons on coarse-pointer devices.

## Views

**C** / **Shift+C** (touch: **View**) cycle through `VIEW.MODES` (`scene3d.js` `placeCamera`); the views riding with the aeroplane are in its own axes, scaled to its length, span and fuselage:

- **Cockpit** — the pilot's eye, with the cockpit frame and the windshield effects. You sit in the captain's (left) seat, 0.14 of the fuselage diameter left of the centreline (`VIEW.COCKPIT_SEAT_X`), looking straight ahead, so the centre window post is not in front of the nose but off to the right, where the geometry puts it (`Cockpit.postX`: about 30° right of the eye, `VIEW.CENTRE_POST_AHEAD`), leaning in at the top.
- **Chase** — behind and above.
- **Front, looking back** — high in front of the nose, looking back over the whole aeroplane.
- **Wing** — off the left wingtip, looking forward.
- **Tail fin** — on top of the fin, looking forward along the fuselage.
- **Landing gear** — under the nose, looking back at the main gear and the runway (a landing from here is spectacular).
- **Top down** — straight down from above, nose up.
- **Tower / fly-by** — near an airport (14 km) from above the nearest tower's cab; en route a fly-by camera waits beside the flight path ahead and moves on once the aeroplane has passed. It zooms (the field of view follows the distance) so the aeroplane stays the same size.

The instrument panel stays on screen in every view, so outside the cockpit the projection is shifted up (`setViewOffset`) to keep the aeroplane in the open part of the screen.

## Sound

`audio.js`, all synthesized. Two buses: the world (engines, wheels, airflow) goes through a lowpass that muffles it in the cockpit and opens outside, where the sound also fades with the distance from the camera and shifts in pitch as the aeroplane approaches or leaves (Doppler, from the rate of change of the distance); the cockpit bus (warnings, levers, the stick shaker) is never filtered.

- **Engines** — a jet's fan whine (two detuned tones in a resonant band at 260–2 960 Hz with N1), its roar (noise through a lowpass that opens with the power, louder behind), the core rumble and, above 78 % N1, the buzz-saw of the fan tips (louder in front); a turboprop's blade beat (4 blades) and a thin turbine whine. They follow N2 during the start, so the spool-up is heard.
- **Airflow** — with the airspeed, more with the gear, the flaps and the spoiler out.
- **Wheels** — a rolling rumble with the ground speed (rougher on grass), a bump every 12 m on the taxiways and the apron and every 30 m on the runway (the slab joints), the brakes (a hiss, and a squeal when nearly stopped).
- **Systems** — the hydraulic pumps while the gear or the flaps travel; the gear clunks down-and-locked and up-locked, the flaps stop with a soft clunk, the spoiler hisses out and in, the levers click, the parking brake sets with a puff of air.
- **Touchdown** — a tyre chirp per main gear and a thump as hard as the landing; a hard landing rattles.
- **Warnings** — the master caution, the warning tone, the stick shaker on a stall warning, a two-tone chime crossing 10 000 ft.
- **Callouts** (spoken, en-GB voice where there is one): "eighty knots", "V one", "rotate" on the take-off roll and "positive rate" once climbing; on the way down to land the radio heights 1 000, 500, 100, 50, 40, 30, 20, 10 ft and "minimums" at 200 ft (at ×1 time only). They respect the sound setting.

## Cheats

Keyboard only, `Alt` + digit, never bound to anything used in normal play, each with an on-screen banner, and any use marks the whole run as cheated (no money, no reputation, no records):

- **Alt+1** — full fuel tanks · **Alt+2** — emergencies disabled for this flight · **Alt+3** — jump to a 12 nm final for the arrival runway, on the glideslope, autopilot coupled · **Alt+4** — +10 000 kr · **Alt+5** — repair all damage · **Alt+6** — time acceleration ×128 (in the air) · **Alt+0** — show the cheat list (not a cheat itself).

## Files

```
world-aviation/
├── SPEC.md
├── index.html              markup only, versioned <link>/<script> tags
├── styles.css
├── constants.js            world, aircraft, difficulties, courses, the views, tuning (QRH: the checklist tuning)
├── game.js                 main loop, phase machine, wiring, self-test mode
├── career.js               save/load, contracts, courses, unlocks, payout, reputation
├── lib/
│   └── three.min.js        three.js r147 (UMD), vendored
├── core/
│   ├── i18n.js             the game's language: tr() looks the English text up in data/lang-*.js, LANGS, I18N
│   ├── utils.js            math, noise, RNG, geodesy, the per-flight projection (Theatre), formatting
│   ├── input.js            keyboard, touch joystick/throttle/buttons, fullscreen
│   └── audio.js            synthesized engines, airflow, wheels, brakes, hydraulics, warnings, spoken callouts
├── data/
│   ├── airports.js         the airports, the regions, each airport's look (city symbol, colour)
│   ├── countries.js        each country's flag and its local "welcome"
│   ├── airlines.js         the real airlines: livery, emblem, client groups, hubs; pickAirline, airlinesAt
│   ├── emergencies.js      the emergencies and their QRH checklists
│   ├── quizzes.js          the course exams in English, Russian and Swedish, with hints; the Training tab's words and the course texts in Russian and Swedish
│   ├── lang-ru.js          every other text of the game in Russian (TEXT_RU: English text → translation)
│   ├── lang-sv.js          the same in Swedish (TEXT_SV)
│   └── geodata.js          the world's coastlines, inland water and mountain ranges ([lon, lat])
├── art/
│   ├── flags.js            national flags (Canvas 2D), and small flag images for the screens
│   ├── landmarks.js        the city symbols: about 100 landmark silhouettes
│   └── emblems.js          the airlines' fin art and logos
├── sim/
│   ├── world.js            airports (static data, and placed and laid out for a flight), taxi routing, weather
│   ├── terrain.js          the heightmap of a flight's area, airport flattening and corridors, biome colours
│   ├── flight.js           flight dynamics, ground handling, phases of the flight
│   └── systems.js          engines, fuel, hydraulics, ice, pressurisation, emergencies, QRH checklists
├── render/
│   ├── models.js           3D aircraft models and liveries built from each type's dimensions and look, in an airline's colours
│   ├── airport3d.js        an airport in 3D: runway and ground textures, lights and PAPI, buildings, flags, banners, signs
│   ├── apron3d.js          life on the apron: jet bridges, vehicles, stand plates, floodlights, traffic, the pushback tug
│   └── scene3d.js          three.js scene: sky, terrain, sea, lighting, the views, follow mesh, airports in view
├── ui/
│   ├── instruments.js      airspeed, attitude, altimeter, HSI, VSI, engine gauges, warnings
│   ├── cockpit.js          cockpit frame, windshield effects
│   ├── hud.js              HUD, banners, checklist panel, map, messages
│   └── ui.js               title, ops hub, briefing, debrief, failure, pause, quiz screens
├── README.md / README_RU.md / README_SV.md
├── icon.svg / icon-maskable.svg
├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
├── manifest.webmanifest
└── screenshot.png
```

## Language

`settings.lang`: `en`, `ru` or `sv`, picked with the chips at the top of the title screen and remembered (the first time: the browser's language if it is Russian or Swedish, else English; an old `settings.quizLang` is taken over). Everything the player reads switches: the screens, the briefing and the debrief, the HUD strip, the prompts, the messages and warnings, the QRH checklists (titles, steps, the why, the results), the ILS words, the map hints, the touch buttons and the controls card (`data-i18n` in `index.html`), the aircraft, regions, client groups and payloads, the courses and the exams.

- The English text stays in the code and is the key: `tr('Taxi to {gate}', { gate })` (`core/i18n.js`) looks it up in `TEXT_RU` / `TEXT_SV` (`data/lang-ru.js`, `data/lang-sv.js`) and fills in the `{name}` values; a text with no entry is shown in English. Data tables (aircraft, regions, emergencies…) stay English and are passed through `tr()` where they are shown.
- The units stay as they are in every language (`ft`, `kt`, `nm`, `fpm`, `kg`), so `Units.text` still converts them, and so do the keys in `<kbd>` (on a touch screen the prompts and the messages swap them for the button names, in the same language: Space → Park, Y → AP, T → Time +, …; a message names its key in `<kbd>` too, never as a bare letter).
- The career log and the invoice keep the English template and its values (`logLine` in `career.js`), so they are shown in the language of the day; old saves show their English text.
- Stay English on purpose: the airport, city and airline names, the instruments and annunciator labels (as in a real cockpit), the spoken callouts and the debug cheat banners.
- Adding a text: write it in English through `tr()`, add the same key to both tables. The check: every key used in the code and the data has an entry in both tables, with the same `{params}`.

## HUD layout

The view ahead stays clear for the landing. A left column (`#hudLeft`) holds the contract strip, under it the phase prompt and under that the messages (the last five, fading). On a phone the messages leave the column: they sit at the top between the column and the buttons, the last three. The ILS is on the right on a desktop (see Approach guidance), the QRH checklist on the right (on a phone on the left over the strip), the mini map in the top right corner.

## Units

`settings.units`: `aviation` (ft, kt, nm, fpm — the default) or `metric` (m, km/h, km, m/s), chosen on the title screen and in the pause. Everything inside the game stays in aviation units; `Units` in `utils.js` converts where things are shown: `Units.text` rewrites every "<number> ft|kt|nm|fpm" in prompts, messages, banners, checklists and the HTML screens; the instruments draw metric scales (airspeed in km/h, altimeter one turn = 1 000 m, VSI ±10 m/s), and each gauge's name and unit sit where its dial has no ticks (the altimeter's under the 0, the VSI's in the gap on the left). Text built in code always carries its unit (`Units.alt` / `spd` / `dist`), never a bare number. Metric values are rounded to sensible numbers: altitudes to 10 m (50 m above 1 000 m), speeds to 5 km/h, distances to 1 km (0.1 km under 10 km), vertical speed to 0.1 m/s.

## The map

**M** opens the moving map (north up; on a touch screen the Map button opens it and a tap anywhere on it closes it, and it is scaled to fit a landscape phone): coastlines, airports, the planned route (dashed), and the **track actually flown** — `Flight.recordTrack` keeps a point every 60 m on the ground and every 600 m in the air (sooner on a turn), thins itself out past 2 400 points, and restarts after a jump (the final-approach cheat). Yellow on the ground, green in the air. The scale bar follows the units.

On a large desktop window (at least 1100 × 640, fine pointer) a **mini map** sits in the top right corner (the same map, without the other airports' names, with the distance to go instead of the scale bar, redrawn 6 times a second). It is shown only when it helps: in the air after the take-off phase, not during a QRH checklist, not below 1 000 ft AGL on the approach, not while the big map or the controls card is open. **M** cycles mini → big → off → mini; the choice is remembered. Phones and small windows keep the big map on **M** only.

The arrival runway is drawn on both maps with its final approach: the extended centreline out to 12 nm (dashed magenta), an arrow down it in the landing direction, the runway itself and its number.

## Approach guidance

Both are the **landing aid**: `settings.landingAid` (on by default), switched on the title screen and in the pause.


- **ILS** — on the descent and the approach within 23 nm, two scales that read at a glance: the localiser (magenta, labelled RUNWAY) carries a little runway that sits where the runway is, the glideslope (cyan, labelled GLIDE PATH) a triangle that sits where the glide path is; the yellow marks in the middle are you. Under them a line of plain words says what to do — "runway to the RIGHT ▶ turn right", "HIGH ▼ descend more", or "ON THE CENTRELINE AND THE GLIDE PATH". Outlined text instead of a panel, so the view stays open. On a desktop it is on the right, past the centre window post (in the outside views right of the aeroplane; on the left while a QRH checklist is open on the right); on a phone it is high on the windscreen, between the left column and the buttons.
- **The approach path** — inside 30 nm of the runway (cruise, descent, approach) a magenta dot hangs on the extended centreline at the height of the 3° glide path every nautical mile out to 12 nm, joined by a thin line, with the distance every 4 nm and a white marker with the runway number at the threshold. The dots are projected through whichever camera is in use, so they work from the cockpit and from every outside view: flying down the line of dots is flying the ILS. They grow as they come closer and are hidden with a navigation failure.

## Instruments

The airspeed dial starts at zero (so the needle never rests on a number it is not showing), with a number every 40–100 kt depending on the size, and the digital speed in a window; the VSI has its ticks and numbers on the arc the needle swings on (±2 000 fpm or ±10 m/s at ±150°), so it reads true everywhere; all needles are pointed, their tips exactly on the value.

## Quality presets

Auto / Low / Medium / High (remembered), picked from the device and the measured frame rate: terrain cell size, draw distance, polygon budget, cloud and tree counts, pixel-ratio cap, windshield rain. The FPS counter shows the preset in use.
