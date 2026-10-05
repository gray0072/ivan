# <img src="icon.svg" alt="" width="48" height="48" align="center"> World Aviation

*[Читать на русском](README_RU.md)* · *[Läs på svenska](README_SV.md)*

A cockpit-view flight simulator and airline career in the browser. You are a Swedish commercial pilot with an EASA ATPL and a small operator based at **Stockholm Arlanda**. You start with Swedish domestic flights — Gothenburg, Malmö, Visby, Kiruna above the Arctic Circle — then win Scandinavia and the North Atlantic, and region by region the whole world: London and Paris, Dubai and Johannesburg, New York and Mexico City, Tokyo and Sydney. Every flight goes from gate to gate: push back, start the engines, taxi, take off, cope with the weather and with whatever breaks, land, and park at the gate.

![Screenshot](screenshot.png)

**▶ Play: [gray0072.github.io/ivan/world-aviation/](https://gray0072.github.io/ivan/world-aviation/)**

## How to run

Open [index.html](index.html) in a browser — no build step, no server required. The 3D view needs WebGL (three.js is included in the folder).

## A flight

1. **At the gate** press **Enter** — the tug pushes you back onto the apron. Start the engines (**Enter**) and watch N1 and EGT come up.
2. **Taxi**: **Enter** releases the parking brake; a little power (**1**–**3**), steer with **← →**, brake with **B**, and follow the yellow arrow to the holding point.
3. At the **holding point** set the take-off flaps (**F**) and ask for the clearance (**Enter**). Line up, full power (**9**), pull back (**↓**) at Vr, gear up (**G**).
4. **Autopilot** (**Y**): in NAV mode it flies the route, joins the final approach and follows the ILS glideslope down to 200 ft (60 m). **T** speeds up time, **R** slows it down: with the autopilot on up to ×64, flying by hand ×2 above 1 000 ft, ×4 above 3 000, ×8 above 6 000, ×16 above 8 000, ×32 above 9 000 and ×64 above 10 000 ft.
5. **Approach**: flaps and gear down, land by hand from 200 ft (60 m) at Vref, brake, and slow below 35 kt (65 km/h).
6. **Taxi in** along the arrow, stop in the parking box at your gate and set the parking brake (**Space**). The engines shut down and the debrief shows your grade and the invoice.

You can also start a contract **after pushback** — the tug has already taken you to the holding point and the client pays a ground-handling bonus.

## Controls

- **↑ ↓** or **W S** — pitch (↓ pulls the nose up) · **← →** or **A D** — roll, and steering on the ground · **Q E** — rudder
- **Z X** or **− +** — throttle · **1**…**9** — 10 %…90 % · **0** — idle
- **Enter** — the next step on the ground: push back, start, taxi, take-off clearance
- **G** gear · **F / V** flaps down / up · **B** brakes (hold) · **Space** parking brake · **/** spoiler · **K** anti-ice
- **Y** autopilot · **N** back to the programme (NAV along the route and the planned altitude, after you changed the heading or the altitude) · **, .** selected altitude · **; '** selected heading (HDG mode)
- **T / R** time faster / slower · **C / Shift+C** next / previous view: cockpit, chase, front looking back, wing, tail fin, landing gear, top down, tower / fly-by · **M** moving map (on a big screen: mini map, big map, off) · **I** instrument lights · **H** controls card · **Esc** pause

**On a phone or tablet** the game goes fullscreen when you start (where the browser allows it). The **left half** of the screen is a floating joystick — it appears where your thumb lands: drag down to pull the nose up, left and right to roll and to steer on the ground. The **slider on the right edge** is the throttle — its lower half gives fine control of low power for taxiing. The hint text sits on the left; tap it to fold it to one line. The buttons at the top right are **Go** (push back, start, taxi, clearance), gear, flaps, brakes, parking brake, autopilot, **Time +** / **Time −**, view, map (tap anywhere on the map to close it), spoiler, NAV (back to the programme), anti-ice (Ice) and the menu. Both thumbs work at the same time, so you can fly and work a checklist together.

The controls work in any keyboard layout (the keys are read by their place on the keyboard).

**Sound**: jet fans whine and roar with the power, propellers beat, the wheels rumble over the slab joints, the brakes hiss, the gear and the flaps whir and clunk, the tyres chirp on touchdown — and a voice calls "V one", "rotate" and the radio heights down to "ten" on landing.

## Emergencies

Every flight draws its problems: engine fire or failure, a fuel leak, icing, windshear, a bird strike, cabin depressurisation, a gear that will not come down, hydraulic or navigation failure, a medical emergency, a shifted load… When one happens the time acceleration stops, the caution sounds and a **QRH checklist** opens. It says what happened and lists the steps in order; the lit one is next, and each step shows the control that does it. Most are the real controls — thrust to idle with **0**, anti-ice **K**, the gear lever **G**, the speed brake **/**, the autopilot **Y**, pulling up with **↓** — and the checklist ticks them off as you do them; the switches that only exist in the checklist (a fire handle, a crossfeed valve, a call to ATC) are worked with **Enter** (on a phone: tap the lit step or **Go**). Some things can go either way: the fire may need the second bottle, a failed engine may start again. Finish before the timer runs out and you see how long it took; run out of time and the failure escalates — damage, lost engines, lost fuel, a lower pay.

## Difficulty

Chosen on the title screen and in the pause and debrief dialogs, remembered between visits:

- **Easy** — half the wind and light turbulence, one problem at a time, checklists explain why each step is done and give 50 % more time, generous landing grading, no deadlines, and a taxi assist that keeps you on the line.
- **Medium** — real wind and turbulence, sometimes two problems in one flight, checklists without the explanations, standard deadlines and grading.
- **Hard** — strong wind and severe turbulence, two problems every flight, 25 % less time on the checklists, short deadlines, strict grading and more damage.

## Career

Money is in Swedish kronor. Each contract pays for the distance and the load, plus bonuses for the landing grade, being on time and handled emergencies, minus the aircraft lease (per flight hour), the fuel burnt, repairs and penalties.

- **Network** — the world is opened a region at a time: **Sweden** (where you start), **Scandinavia & the North Atlantic** (Norway's fjords, Finland, Denmark, Iceland, Greenland, Svalbard), **Europe**, **the Middle East & Africa**, **the Americas** and **Asia & the Pacific** — 114 real airports. Each region's traffic rights need reputation and flights, and cost money. From Arlanda the board offers the open regions; away from home it offers the flight back and onward legs, so the far side of the world is reached in legs of up to 4 500 nm (8 300 km).
- **Long haul** — on the autopilot the time acceleration goes up to ×64; Stockholm–New York takes about ten minutes of real time.

- **Hangar** — ten aircraft, from the 19-seat Vikna 19 turboprop and the Frostwing bush plane to the **Boeing 737-800**, the **Airbus A320neo**, the **Airbus A350-900** and the four-engine **Boeing 747-8F** freighter, each with its own weight, speeds, range, runway needs and its own 3D model.
- **Training** — 16 courses in four branches (General, Passenger, Cargo, Bush & SAR). Each ends in a short exam (3 of 4 right) and unlocks aircraft, contract types or real advantages: checklist hints, more time in emergencies, slower icing.
- **Career** — reputation with three client groups, licences, records and the log. Below −50 000 kr the operator certificate is revoked and the career is over.

## Airlines and airports

The clients are real airlines: SAS, Norwegian, Finnair and Widerøe at home, then Lufthansa, British Airways, KLM, Emirates, Qatar Airways, Delta, Qantas and about 75 more — passenger airlines, cargo carriers (DHL, FedEx, UPS, Cargolux, West Atlantic) and bush and air ambulance operators. Each has its logo on the contract board, and your aeroplane flies in the colours of the airline that hired it, titles on the fuselage and the emblem on the fin; the home carriers stand at the gates and have their logos on the hangars.

Every airport is recognisable from the cockpit: its name in big letters on the terminal roof, a "Welcome" banner with the city's landmark (the Three Crowns of Stockholm, Big Ben, the Eiffel Tower, the Burj Khalifa, the Sydney Opera House…), the national flag and the city flag on the roof and over the tower — they stream with the wind, like the windsock. Runways have concrete ends with joints, tyre marks, shoulders and blast pads, edge and centreline lights, approach lights with a running flasher and a working PAPI (two white, two red: on the glide path); taxiways have shoulders and edge lines, the apron has concrete slabs and stand markings, and a road, a car park and a perimeter road surround the field.

## Exams

Every course ends in a short exam: four questions, three right to pass. They are written in plain words — a school pupil can work them out — with a **Hint** button and an explanation after every answer, and they can be taken in **English, Russian or Swedish** (pick the language on the Training tab — the course names and descriptions switch to it too, the exams then start in it, and the choice is remembered).

## Units and the map

**Units** on the title screen (and in the pause): aviation units — feet, knots, nautical miles, fpm — or **metric**: metres, km/h, kilometres, m/s, rounded to sensible numbers. Prompts, messages, screens and the instruments all follow the setting.

The **moving map** (**M**) draws the track you have actually flown — yellow on the ground, green in the air — over the planned route. On a big computer screen a **mini map** stays in the top right corner while you fly; **M** switches between the mini map, the big map and no map. The maps show the arrival runway with its final approach (a dashed line and an arrow in the landing direction).

On the approach the **ILS** shows a little magenta runway on the RUNWAY scale where the runway is and a cyan triangle on the GLIDE PATH scale where the glide path is, with plain words underneath ("runway to the RIGHT — turn right", "HIGH — descend more"). A line of **magenta dots** in the sky, one every nautical mile, marks the glide path down to the runway — in every camera view; fly down the dots and you are on the ILS.

## Graphics

**Auto** (the default) picks Medium on phones and High elsewhere and steps down if the frame rate drops; **Low**, **Medium** and **High** set the terrain detail, draw distance, clouds and trees.

## Tech stack

Plain HTML + CSS + vanilla JavaScript split by concern into folders — `core/` (helpers, input, sound), `data/` (airports, countries, airlines, exams, coastlines), `art/` (flags, city symbols, airline emblems), `sim/` (the world, terrain, flight dynamics, systems), `render/` (the 3D models, airports and scene) and `ui/` (instruments, cockpit, HUD, screens), with `game.js` and `career.js` on top — no build step. The 3D world uses three.js (vendored as `lib/three.min.js`), the cockpit and instruments are Canvas 2D, and the sound is synthesized with the Web Audio API.
