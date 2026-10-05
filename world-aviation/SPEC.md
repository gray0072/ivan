# World Aviation — SPEC

Developer/agent spec for the `world-aviation` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

## Idea

A career flight simulator in the browser: you are a Swedish commercial pilot (EASA ATPL) flying out of **Stockholm Arlanda** for a small Swedish operator. The career starts with Swedish domestic flying, then Scandinavia and the North Atlantic, then — region by region — the whole world: Europe, the Middle East and Africa, the Americas, Asia and the Pacific. Every flight is a full cockpit-view departure-and-arrival between real airports — push back from the gate, start the engines, taxi, take off, handle whatever the weather and the aeroplane throw at you, land, and taxi to the gate. You earn money, reputation and licences, fly bigger aircraft (up to the Airbus A350 and the Boeing 747-8F), and take contracts from passenger airlines, freight companies and remote operators.

Everything in-game is English. The sim is arcade-leaning but built on real forces (lift/drag/thrust, stall, weight, wind, icing, fuel burn, pressure altitude) rather than on fake "up = up" controls.

## Tech stack

HTML5 + CSS3 + vanilla ES2017 JavaScript, no build step, no package manager.

The 3D world is rendered with **three.js** (r147, the UMD build), **vendored into the project folder** as `three.min.js` and loaded with a plain `<script src>` tag — no CDN, no bundler, no ES modules, so the folder still works offline, from `file://`, and when copied out of the repo on its own. It is a single vendored file, not a dependency the repo has to install. `WEBGL` is required for the flight view; if WebGL is unavailable the game says so and offers the rest of the career screens.

Rendering layout:

- **`three.min.js`** (vendored, ~594 KB) — WebGL renderer, scene, camera, lighting.
- **WebGL canvas** — the world: sky dome shader, terrain mesh, sea, runways and taxiways (canvas-generated textures with real markings), buildings, trees, clouds, aircraft, other traffic.
- **Canvas 2D overlay** — the cockpit: window frame, glareshield, the full instrument panel (airspeed, attitude, altimeter, HSI, VSI, engine gauges, warning lights), windshield effects (rain, frost, fog, lightning) and the HUD. A 2D overlay keeps the gauges crisp and cheap and lets the cockpit frame be drawn on top of the 3D scene.
- **Web Audio API** — synthesized sounds, no audio files; spoken callouts with `speechSynthesis` where the browser has it.

Terrain: every flight builds a heightmap of its own part of the world (see below) and one near-field mesh that follows the aircraft (110–420 m cells depending on the quality preset and the height, heights and normals rebuilt on the CPU when the aircraft has moved far enough), so the ground stays detailed under the wheels without a huge vertex count. The far mesh sits 30 m under the real ground and the near mesh fades into it at its edge, so they never fight; the renderer uses a logarithmic depth buffer for the same reason.

**The world of a flight.** The globe cannot be one flat map, so every flight gets its own: an azimuthal equidistant projection centred on the great-circle midpoint of the route (`Theatre` in `utils.js`). The route is then a straight line of its true length, and nothing near it is distorted, anywhere on Earth (the date line included). Distances are compressed by `WORLD.SCALE` = 0.45, so the 3 400 nm Stockholm–New York leg is about 1 530 nm of flying. `World.prepare(from, to)` (about a second, behind a "Preparing the route" screen) builds:

- **the terrain** (`terrain.js`): a grid over the route plus 500 km around it (at least 1 400 km across), 5–18 km real between samples (about 300 across). Land or sea comes from a scanline fill of the coastline polygons in `geodata.js` (every continent and the major islands, coarse — a degree or two — except Scandinavia, which is drawn in detail), with inland seas and lakes cut out (the Black Sea, the Caspian, the Great Lakes, the Nordic lakes and fjords). The height comes from the distance to the coast, about 80 mountain ranges and plateaus (the Scandes, the Alps, the Himalaya and Tibet, the Rockies, the Andes, …) and fBm noise keyed on latitude and longitude, so a place looks the same on every flight. Colours follow the latitude in both hemispheres: tropical green, the great deserts, birch and pine in the north, tundra, and a snow line from 4 800 m in the tropics down to 560 m in the Arctic;
- **the airports** in that area, placed and laid out (`World.airports` / `World.here`); `World.list` / `World.byId` hold every airport's static data for the career and the screens.

Weather follows the latitude, the hemisphere (seasons are reversed in the south) and the field elevation.

World axes: x = east, y = up, z = south at the centre of the projection; headings are clockwise from the projection's north.

Airports are all built from one template around the runway in use (`LAYOUT` in `constants.js`): the runway is flown in its designator's direction for both take-off and landing (the surface wind is always within 70° of it), a parallel taxiway on the right with three exits and the holding point at the runway start, an apron lane with the gate stands (nose-in towards the terminal), a terminal, a tower, hangars, a fuel farm and a cargo shed.

`airport3d.js` builds them in the airport's own frame (x across towards the terminal, z = −t down the runway):

- **The runway** has its own fine texture (up to 256 × 8192): asphalt with grain, repair patches and crack sealing, concrete ends with slab joints, rubber and tyre streaks in the touchdown zone, paved shoulders, 60 m blast pads with yellow chevrons, and the markings (edge and centre lines, threshold bar and piano keys, designators, touchdown zone bars, the aiming point at 400 m on long runways). Lights are `THREE.Points` of a fixed pixel size: white edge lights (yellow over the last 600 m), centreline lights (red/white, then red at the end), green threshold and red end bars, an approach light system to 900 m with a crossbar at 300 m and a sequenced flasher running towards the threshold, blue taxiway edge lights. The **PAPI** (four lights left of the runway, 300 m in) is live: each light is white when the eye is above its angle (3.5° / 3.17° / 2.83° / 2.5°) and red below, so on the glide path it shows two and two.
- **The ground texture** (4096 px along on Medium/High, 2048 on Low) has grass with mowing stripes and a lighter runway strip, taxiways with sandy shoulders, a yellow edge line round the outside of the network and a centreline, the apron in concrete slabs with a service road, stands with lead-in line, stop bar, red safety box, stand number and an oil stain, the landside road with lane lines, a kerb and zebra crossings, the car park full of cars, trees, the perimeter road and the fence. Its edges fade out into the terrain. Both planes are cut into cells of 60–100 m: the logarithmic depth buffer needs small triangles near the eye, or the terrain shows through.
- **The look of each airport** (`AIRPORT_LOOK` in `data/airports.js`: a city symbol and a colour; the country's flag and greeting in `data/countries.js`): the airport's name in big letters on the terminal roof (facing the apron and the road), the roof slab and the tower band in the airport's colour, a "Welcome to <city>" banner with the city symbol, the local greeting and a flag strip on both fronts of the terminal, three flagpoles on the roof (country, city flag = the symbol on the airport colour, country) and a flag over the tower. The flags and the windsock turn downwind and stream or droop with the surface wind. The hangars carry the home airlines' logos, the cargo shed a cargo carrier's, and the parked aeroplanes at the gates wear the home airlines' liveries (`airlinesAt` in `data/airlines.js`). Also a localiser array past the far end, a glideslope mast, a red runway holding sign and yellow exit signs.

## Screens

1. **Title** — Continue / New career, difficulty (Easy / Medium / Hard), Graphics, How to fly, sound, reset career.
2. **Ops (career hub)** — four tabs:
   - **Dispatch** — the contract board (3–5 offers), each with client, route, load, payout, requirements.
   - **Hangar** — the aircraft ladder, specs, lease/buy, "which aircraft is selected".
   - **Training** — the technology tree (see below) with branches and tiers.
   - **Career** — money, reputation with the three client factions, licences, block time, landings, records, cheat count.
3. **Briefing** — route map, runway in use at both ends, distance, block time, payload, fuel plan, weather at departure/arrival/cruise altitude, NOTAM-style hints, and the two start options:
   - **At the gate** — full sequence: doors closed, push back by tug, engine start, taxi.
   - **After pushback** — the tug has already moved you to the runway hold; skips ~40 s, pays a **ground-handling bonus** (the client saved the tug fee). Available from the first flight.
4. **Flight** — the cockpit view, phases: `GATE → PUSHBACK → ENGINE_START → TAXI_OUT → HOLD_SHORT → TAKEOFF → CLIMB → CRUISE → DESCENT → APPROACH → ROLLOUT → EXIT (taxi in) → SHUTDOWN → PARKED`. A prompt at the bottom always says what to do next; **Enter** (touch: **Go**) advances the ground procedure:
   - `GATE`: Enter calls the tug → `PUSHBACK` (14 s, the tug pushes you back onto the apron lane and turns you towards the taxiway; the engines may be started meanwhile) → `ENGINE_START` (Enter starts the engines one after the other; N2, light-off, N1 to idle) → Enter releases the parking brake → `TAXI_OUT` along the guidance arrow → `HOLD_SHORT` within 30 m of the holding point → set take-off flaps, Enter = take-off clearance → `TAKEOFF` (the arrow leads onto the centreline) → `CLIMB` at 500 ft AGL → `CRUISE` at the selected altitude → `DESCENT` 45 nm from the destination (the arrival weather takes over) → `APPROACH` once on the localiser inside 19 nm (time acceleration drops to 1×) → `ROLLOUT` at the touchdown → `EXIT` below 35 kt (taxi to the arrival gate) → park in the box and set the parking brake → `SHUTDOWN` → `PARKED` → debrief.
   - Flying over the runway and still being airborne at its far end means a go-around: back to `DESCENT`, the approach is flown again. A touch-and-go during the rollout also goes back to `APPROACH`, and only the final landing is graded.
5. **Debrief** — landing grade, touchdown data (vertical speed, speed vs Vref, distance from the threshold, centreline offset, bank and crab), the log, the invoice, the reputation change, the difficulty choice and "Next flight".
6. **Failure** — crash (terrain, ditching, wing or nose strike, gear-up landing, gear collapse), runway excursion, landing back at the departure. Shows the cause and the cost; "Try again" (the same contract) or "Back to ops", with the difficulty choice.
7. **Pause** (Esc) — resume (Esc / Space / Enter), restart the flight, controls, abandon to Ops, the difficulty choice.
8. **Quiz** — a training course: 4–5 multiple-choice questions, pass mark 3/4.

## Flight model

Fixed 60 Hz physics step with render interpolation, world in metres (x = east, z = north, y = altitude MSL), speeds in knots internally.

Forces, all real:

- **Lift** `L = ½·ρ·V²·S·CL(α, flaps, slats, ice)` — `CL` from a linear curve with a soft stall break past the critical α, plus stall behaviour: the nose drops, lift collapses, a stall warning sounds at `α` slightly before the break.
- **Drag** `CD = CD0 + k·CL²` with `CD0` raised by gear, flaps, ice and (in a go-around) the spoiler.
- **Thrust** per engine, scaled by throttle, density ratio `σ` (so climb performance decays with altitude) and by airspeed (propellers lose static thrust with speed).
- **Weight** affects `CL` needed, stall speed (`Vs = √(2mg/(ρ S CLmax))`), climb rate, acceleration and touchdown distance — a heavy jet flies nothing like an empty bush plane.
- **Wind** — surface wind per airport (direction/speed), gradient wind increasing with altitude, gusts, turbulence noise, and local effects (sea breeze, rotor near high ground, crosswind on landing).
- **Ground** — normal reaction, tyre friction, nosewheel steering with rudder, differential braking, weight-on-wheels, runway/taxiway surface detection, wet/icy grip.
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
- **T** cycles the time acceleration ×1 → ×2 → ×4 → ×8, and in the cruise on to ×16 → ×32 → ×64 (for the long legs), only in the air above 500 ft AGL with the autopilot engaged. The descent starts at the top of descent: at least 45 nm out, 3.2 nm per 1 000 ft to lose; long legs cruise up to 92 % of the type's cruise altitude. It drops back to ×1 on the approach, on any emergency, and when the conditions are no longer met. The simulation runs at a fixed 60 Hz on a real-time accumulator, so the speed is the same at any frame rate.

**Trim.** The pitch axis has static stability towards a trim angle of attack, and the trim follows the angle of attack being flown (1.5°/s with the autopilot, 0.6°/s by hand, never past 2° below the stall warning) — like an automatic trim, so a heavy jet flying slowly is not fighting its own stability.

## Emergencies (the point of the game)

Every flight draws its emergencies from the weighted list (Easy: one, Medium: one or two, Hard: two), each pinned to one of its phases and a random moment in it. An emergency **interrupts the flight**: time acceleration is cut to 1×, the master caution lights, a caution chime sounds, and a **QRH checklist** opens — an ordered list of steps that must be clicked in the correct order, some of them *set* steps (power, altitude). With a hint (Easy, or the Advanced Systems course) the steps are listed in order and the next one is named; otherwise the remaining steps are shuffled and the player has to know the order. A wrong step only costs time. Run out of time and the failure escalates (the penalty in the table: damage, lost fuel, lost reputation or pay, plus the specific consequence — a lost engine, a gear that drops hard, …). The checklist clock is real time; its length is the emergency's limit × the course bonuses × the difficulty factor.

What the emergencies actually do to the aeroplane: an engine fire or failure removes that engine's thrust, a fuel leak drains 40–80 % of the tank capacity per hour, hydraulic failure weakens the brakes, depressurisation raises the cabin altitude, the gear failure locks the gear up until the checklist is done, a nav failure hides the route guidance, a bird strike limits one engine to 70 % N1, icing keeps building ice (lift down, drag and stall speed up) until anti-ice is on, windshear is a 14 s downdraft with a loss of headwind, a load shift pitches the nose down.

Checklist example (Engine Fire):

1. Throttle to idle · 2. Fire handle pull · 3. Engine master off · 4. Confirm warning light out · 5. "Inflight shutdown complete"

The full list (12 + variants), each with trigger, weight, time limit, escalation and countermeasure:

| Emergency | What you do |
| --- | --- |
| Engine fire | idle, handle, master off, confirm |
| Engine failure | idle the dead one, feather, restart attempt, drift down / divert |
| Fuel leak | pump off, crossfeed, declare, bingo fuel |
| Low fuel / fuel exhaustion | decide now: divert or hold |
| Icing | exit the moisture, anti-ice, pitot heat, do not extend gear/flaps |
| Wind shear / microburst | pitch attitude 15°, max thrust, hold it out |
| Bird strike | engine check, flameout risk, may need shutdown |
| Cabin depressurization | masks, emergency descent, pressurize below 10 000 ft |
| Gear will not extend | gear lever, blow down, manual release, land gear-up or go around |
| Hydraulic failure | verify, manual gear, degraded brakes/steering |
| Nav/comm failure | dead reckoning, fly the magenta line |
| Medical emergency | priority, diversion, time limit |
| Cargo shift (cargo branch) | re-secure, CG change, limits |
| Overweight / misload | pre-takeoff performance check |
| Overshoot on approach | go around |

Courses change this: e.g. *Advanced Systems* shows a checklist hint, *De-icing & Winter Survival* slows ice accretion, *CRM & Cabin Safety* gives 50 % more response time.

## Difficulty

Chosen on the title screen and changeable in settings; applies to every flight of the career.

Also offered in the pause, debrief and failure dialogs (pre-selected), remembered in `localStorage`; a change applies from the next flight or the restart.

- **Easy** — wind ×0.5, turbulence light, one emergency per flight, checklists in order with the next step named and ×1.5 time, generous landing grading, no deadlines, taxi assist (the nosewheel follows the guidance arrow while the player does not steer).
- **Medium** — wind ×1.0, moderate turbulence, one or two emergencies, shuffled checklists with normal time, standard deadlines and grading.
- **Hard** — wind ×1.5, severe turbulence, two emergencies every flight, ×0.75 checklist time, deadlines ×0.8, strict grading, ×1.5 damage from mishandled emergencies.

## Career, money and the technology tree

Currency: **Swedish kronor (SEK, kr)**. You are based at **Stockholm Arlanda (ARN)**, your home base for the whole career.

**The network.** 114 real airports in six regions (`AIRPORTS` and `REGIONS` in `data/airports.js`). A new operator holds the traffic rights for **Sweden** only (13 airports, Malmö to Kiruna). The **Network** tab sells the rights to the other regions once the operator has the reputation (the best of the three client groups) and the flights:

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

Every aircraft is drawn by `models.js` from its dimensions and its `look` (low or high wing, engines under the wings / on the rear fuselage / turboprops, T-tail, winglets, hump, fixed gear, base and accent colours): a fuselage of cross-sections with a drooping nose and a tail cone whose top line stays level while the belly sweeps up, a canvas livery (windows, cheatline, cockpit glass, cargo door on freighters), tapered swept wings with dihedral, fin and tailplane, nacelles with fans and exhaust cones, spinning propellers (blurred into a disc at speed), and retractable gear with bogies on the big jets. In an airline's colours (`build(ac, { airline })`) the canvas also gets the belly, nose, cheatlines, the fin colour running into the tail cone and the titles on both sides (drawn upside down and backwards on the right side, where the canvas runs the other way), and the fin gets two transparent decals clipped to its outline with the airline's fin art, each drawn to read the right way round. The same models stand at the other gates in the home airlines' colours — airliners at the big airports, turboprops at the small ones.

Tree: 4 tiers × 3 branches + a general branch, 13 courses, each with a price, prerequisites, a 4–5 question quiz (pass 3/4) and real effects (unlocks, stat bonuses, procedural unlocks, reputation gates):

- **General** — Ground School (free) · Aviation Weather · Advanced Systems · CRM & Cabin Safety
- **Passenger** — Regional Jet Ops · Instrument Rating (IFR) · Mountain & Adverse Weather · Widebody Procedures
- **Cargo** — Dangerous Goods · Weight & Balance · Arctic Ground Handling · Heavy Freighter Ops
- **Bush & SAR** — Short Field Ops · De-icing & Winter Survival · Medevac & SAR Contracts · Seaplane & Remote Bases

Contracts: distance × rate × faction + load × the payload type's rate × distance / 650 (+ urgent, weather and route bonuses); the debrief adds the landing-grade bonus, on time (+8 %), no tug needed, emergencies handled (+6 % each), and subtracts the aircraft lease (per block hour, at least one hour), the fuel burnt (9.5 kr/kg), repairs (damage × 70 % of the pay), mishandled checklists, medical diversion costs and lateness (−12 %). A new board is generated after each flight, after a course, after buying traffic rights and when the aircraft or the difficulty changes. The fuel plan is the trip fuel for the compressed distance; the block fuel loaded is 1.45 × that plus taxi fuel. The deadline is in **real seconds**: ground allowance (480 s) + approach (300 s) + the airborne time at the expected time acceleration (×6 on short legs, rising with the distance up to ×40), × 1.3 slack × the difficulty factor. Below −50 000 kr the career ends ("operator certificate revoked").

Aircraft are leased per sector: any unlocked type can be selected in the hangar.

The new-career dialog lets you set the pilot's name (default **Sven Ekman**) and the operator's name (default **Svea Flyg**); both are shown on the career page and in the debrief.

## Controls

Keyboard:

- **↑ / ↓** or **W / S** — pitch (elevator)
- **← / →** or **A / D** — roll (aileron)
- **Q / E** — rudder (ground steering on the nosewheel)
- **Z / X** — throttle down / up (also **− / +**, **PageDown / PageUp**)
- **1 … 9** — throttle to 10 % … 90 % instantly · **0** — idle
- **Enter** — the next ground step: push back, start the engines, taxi, take-off clearance
- **G** — landing gear (locked with weight on wheels and above Vlo) · **F** — flaps extend one notch (not above that notch's Vfe) · **V** — flaps retract · **B** — wheel brakes (hold) · **Space** — parking brake · **R** — spoiler · **K** — engine and wing anti-ice
- **← / →** also steer the nosewheel on the ground (the rudder keys do too)
- **Y** — autopilot · **N** — autopilot NAV mode · **, / .** — selected altitude down / up · **; / '** — selected heading (HDG mode)
- **T** — time acceleration (×1 … ×8, up to ×64 in the cruise; only above 500 ft with the autopilot in CMD) · **M** — moving map (north up) · **C** — the next view, **Shift+C** — the previous one (see Views) · **I** — instrument lights · **H** — controls card · **Esc** — pause
- The keys are read by their place on the keyboard (`e.code`), not by the character they type, so the controls work in any layout (Russian, Swedish, …).
- The cheats use **Alt + digit** so they cannot fire in normal play.
- Overlay buttons (title, ops, briefing, debrief, pause) are pressed with Space / Enter, the arrow keys move between them.

Touch (phones/tablets): the left half is a floating joystick (pitch/roll and nosewheel steering on the ground; its ring appears where the finger lands), the right edge has a vertical throttle slider, and the top right has twelve large buttons: Go (the Enter step), gear, menu, flap +, flap −, brakes (toggle), parking brake, autopilot, time acceleration, view, map and spoiler. The QRH checklist buttons are tapped directly. All multi-touch, so you can fly and work a checklist at the same time. Fullscreen is requested by the Continue / Start flying / Fly it buttons on coarse-pointer devices.

## Views

**C** / **Shift+C** (touch: **View**) cycle through `VIEW.MODES` (`scene3d.js` `placeCamera`); the views riding with the aeroplane are in its own axes, scaled to its length, span and fuselage:

- **Cockpit** — the pilot's eye, with the cockpit frame and the windshield effects.
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
├── constants.js            world, aircraft, difficulties, emergencies, courses, tuning
├── data/
│   ├── airports.js         the airports, the regions, each airport's look (city symbol, colour)
│   ├── countries.js        each country's flag and its local "welcome"
│   └── airlines.js         the real airlines: livery, emblem, client groups, hubs; pickAirline, airlinesAt
├── art/
│   ├── flags.js            national flags (Canvas 2D), and small flag images for the screens
│   ├── landmarks.js        the city symbols: about 100 landmark silhouettes
│   └── emblems.js          the airlines' fin art and logos
├── utils.js                math, noise, RNG, geodesy, the per-flight projection (Theatre), formatting
├── geodata.js              the world's coastlines, inland water and mountain ranges ([lon, lat])
├── terrain.js              the heightmap of a flight's area, airport flattening and corridors, biome colours
├── models.js               3D aircraft models and liveries built from each type's dimensions and look, in an airline's colours
├── airport3d.js            an airport in 3D: runway and ground textures, lights and PAPI, buildings, flags, banners, signs
├── scene3d.js              three.js scene: sky, terrain, sea, lighting, the views, follow mesh, airports in view
├── world.js                airports (static data, and placed and laid out for a flight), taxi routing, weather
├── flight.js               flight dynamics, ground handling, phases of the flight
├── systems.js              engines, fuel, hydraulics, ice, pressurisation, emergencies, QRH checklists
├── instruments.js          airspeed, attitude, altimeter, HSI, VSI, engine gauges, warnings
├── cockpit.js              cockpit frame, windshield effects
├── hud.js                  HUD, banners, checklist panel, map, messages
├── career.js               save/load, contracts, courses, unlocks, payout, reputation
├── audio.js                synthesized engines, airflow, wheels, brakes, hydraulics, warnings, spoken callouts
├── input.js                keyboard, touch joystick/throttle/buttons, fullscreen
├── ui.js                   title, ops hub, briefing, debrief, failure, pause, quiz screens
├── game.js                 main loop, phase machine, wiring, self-test mode
├── README.md / README_RU.md / README_SV.md
├── icon.svg / icon-maskable.svg
├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
├── manifest.webmanifest
└── screenshot.png
```

## Quality presets

Auto / Low / Medium / High (remembered), picked from the device and the measured frame rate: terrain cell size, draw distance, polygon budget, cloud and tree counts, pixel-ratio cap, windshield rain. The FPS counter shows the preset in use.
