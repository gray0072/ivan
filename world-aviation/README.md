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
4. **Autopilot** (**Y**): in NAV mode it flies the route, joins the final approach and follows the ILS glideslope down to 200 ft. **T** speeds up time en route (×2 … ×8, up to ×64 in the cruise) — only with the autopilot on.
5. **Approach**: flaps and gear down, land by hand from 200 ft at Vref, brake, and slow below 35 kt.
6. **Taxi in** along the arrow, stop in the parking box at your gate and set the parking brake (**Space**). The engines shut down and the debrief shows your grade and the invoice.

You can also start a contract **after pushback** — the tug has already taken you to the holding point and the client pays a ground-handling bonus.

## Controls

- **↑ ↓** or **W S** — pitch (↓ pulls the nose up) · **← →** or **A D** — roll, and steering on the ground · **Q E** — rudder
- **Z X** or **− +** — throttle · **1**…**9** — 10 %…90 % · **0** — idle
- **Enter** — the next step on the ground: push back, start, taxi, take-off clearance
- **G** gear · **F / V** flaps down / up · **B** brakes (hold) · **Space** parking brake · **R** spoiler · **K** anti-ice
- **Y** autopilot · **N** NAV mode · **, .** selected altitude · **; '** selected heading (HDG mode)
- **T** time acceleration · **C** camera (cockpit, chase, wing) · **M** moving map · **I** instrument lights · **H** controls card · **Esc** pause

**On a phone or tablet** the game goes fullscreen when you start (where the browser allows it). The **left half** of the screen is a floating joystick — it appears where your thumb lands: drag down to pull the nose up, left and right to roll and to steer on the ground. The **slider on the right edge** is the throttle. The buttons at the top right are **Go** (push back, start, taxi, clearance), gear, flaps, brakes, parking brake, autopilot, time acceleration and the menu. Both thumbs work at the same time, so you can fly and work a checklist together.

## Emergencies

Every flight draws its problems: engine fire or failure, a fuel leak, icing, windshear, a bird strike, cabin depressurisation, a gear that will not come down, hydraulic or navigation failure, a medical emergency, a shifted load… When one happens the time acceleration stops, the caution sounds and a **QRH checklist** opens: click its steps in the right order before the timer runs out, or the failure escalates — damage, lost engines, lost fuel, a lower pay.

## Difficulty

Chosen on the title screen and in the pause and debrief dialogs, remembered between visits:

- **Easy** — half the wind and light turbulence, one problem at a time, checklists show their steps in order with the next one highlighted and 50 % more time, generous landing grading, no deadlines, and a taxi assist that keeps you on the line.
- **Medium** — real wind and turbulence, sometimes two problems in one flight, the checklist steps are shuffled (you have to know the order), standard deadlines and grading.
- **Hard** — strong wind and severe turbulence, two problems every flight, 25 % less time on the checklists, short deadlines, strict grading and more damage.

## Career

Money is in Swedish kronor. Each contract pays for the distance and the load, plus bonuses for the landing grade, being on time and handled emergencies, minus the aircraft lease (per flight hour), the fuel burnt, repairs and penalties.

- **Network** — the world is opened a region at a time: **Sweden** (where you start), **Scandinavia & the North Atlantic** (Norway's fjords, Finland, Denmark, Iceland, Greenland, Svalbard), **Europe**, **the Middle East & Africa**, **the Americas** and **Asia & the Pacific** — 114 real airports. Each region's traffic rights need reputation and flights, and cost money. From Arlanda the board offers the open regions; away from home it offers the flight back and onward legs, so the far side of the world is reached in legs of up to 4 500 nm.
- **Long haul** — on long legs the time acceleration goes up to ×64 in the cruise; Stockholm–New York takes about ten minutes of real time.

- **Hangar** — ten aircraft, from the 19-seat Vikna 19 turboprop and the Frostwing bush plane to the **Boeing 737-800**, the **Airbus A320neo**, the **Airbus A350-900** and the four-engine **Boeing 747-8F** freighter, each with its own weight, speeds, range, runway needs and its own 3D model.
- **Training** — 16 courses in four branches (General, Passenger, Cargo, Bush & SAR). Each ends in a short exam (3 of 4 right) and unlocks aircraft, contract types or real advantages: checklist hints, more time in emergencies, slower icing.
- **Career** — reputation with three client groups, licences, records and the log. Below −50 000 kr the operator certificate is revoked and the career is over.

## Airlines and airports

The clients are real airlines: SAS, Norwegian, Finnair and Widerøe at home, then Lufthansa, British Airways, KLM, Emirates, Qatar Airways, Delta, Qantas and about 75 more — passenger airlines, cargo carriers (DHL, FedEx, UPS, Cargolux, West Atlantic) and bush and air ambulance operators. Each has its logo on the contract board, and your aeroplane flies in the colours of the airline that hired it, titles on the fuselage and the emblem on the fin; the home carriers stand at the gates and have their logos on the hangars.

Every airport is recognisable from the cockpit: its name in big letters on the terminal roof, a "Welcome" banner with the city's landmark (the Three Crowns of Stockholm, Big Ben, the Eiffel Tower, the Burj Khalifa, the Sydney Opera House…), the national flag and the city flag on the roof and over the tower — they stream with the wind, like the windsock. Runways have concrete ends with joints, tyre marks, shoulders and blast pads, edge and centreline lights, approach lights with a running flasher and a working PAPI (two white, two red: on the glide path); taxiways have shoulders and edge lines, the apron has concrete slabs and stand markings, and a road, a car park and a perimeter road surround the field.

## Graphics

**Auto** (the default) picks Medium on phones and High elsewhere and steps down if the frame rate drops; **Low**, **Medium** and **High** set the terrain detail, draw distance, clouds and trees.

## Tech stack

Plain HTML + CSS + vanilla JavaScript split by concern (`flight.js`, `systems.js`, `world.js`, `geodata.js`, `terrain.js`, `models.js`, `airport3d.js`, `scene3d.js`, `instruments.js`, `game.js`, …), with the airports, countries and airlines in `data/` and the flags, city symbols and airline emblems drawn by `art/`, no build step. The 3D world uses three.js (vendored as `three.min.js`), the cockpit and instruments are Canvas 2D, and the sound is synthesized with the Web Audio API.
