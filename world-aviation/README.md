# <img src="icon.svg" alt="" width="48" height="48" align="center"> World Aviation

*[Читать на русском](README_RU.md)* · *[Läs på svenska](README_SV.md)*

A cockpit-view flight simulator and airline career in the browser. You are a Swedish commercial pilot with an EASA ATPL, based at **Stockholm Arlanda**. You start with Swedish domestic flights — Gothenburg, Malmö, Visby, Kiruna above the Arctic Circle — then win Scandinavia and the North Atlantic, and region by region the whole world: London and Paris, Dubai and Johannesburg, New York and Mexico City, Tokyo and Sydney. Every flight goes from gate to gate: push back, start the engines, taxi, take off, cope with the weather and with whatever breaks, land, and park at the gate.

![Screenshot](screenshot.png)

**▶ Play: [gray0072.github.io/ivan/world-aviation/](https://gray0072.github.io/ivan/world-aviation/)**

## How to run

Open [index.html](index.html) in a browser — no build step, no server required. The 3D view needs WebGL (three.js is included in the folder).

## A flight

1. **At the gate** press **Enter** — the tug pushes you back onto the apron. Start the engines (**Enter**) and watch N1 and EGT come up.
2. **Taxi**: **Space** releases the parking brake (on a phone: **Park**); a little power (**1**–**3**), steer with **← →**, brake with **B**, and follow the yellow arrow to the holding point.
3. At the **holding point** set the take-off flaps (**F**) and ask for the clearance (**Enter**). Line up, full power (**9**), pull back (**↓**) at Vr, gear up (**G**).
4. **Autopilot** (**Y**): in NAV mode it flies the route, slows down on the descent (using the speed brake itself when it is high), turns onto the final approach without swinging through the centreline and follows the ILS glideslope down to 200 ft (60 m). **T** speeds up time, **R** slows it down: with the autopilot on up to ×128, flying by hand ×2 above 1 000 ft, ×4 above 3 000, ×8 above 6 000, ×16 above 8 000, ×32 above 9 000 and ×64 above 10 000 ft. Near the destination the time slows down by itself, a step every 3 seconds, back to ×1 5 km (2.7 nm) out.
5. **Approach**: flaps and gear down, land by hand from 200 ft (60 m) at Vref, brake, and slow below 35 kt (65 km/h).
6. **Taxi in** along the arrow, stop in the parking box at your gate and set the parking brake (**Space**). The engines shut down and the debrief shows your grade and the invoice.

Pick the **departure time** on the briefing — day, dusk, night or dawn; dusk and dawn pay 5 % more, night 15 %. At night the stars and the moon are out, the airport is its lights (approach lights, PAPI, blue and green taxiway lights, floodlit aprons and lit terminals), your aeroplane shows its navigation lights, beacon and strobes, and your landing lights light up the runway ahead. Below, the real towns and cities glow orange with white centres, roads string them together and villages dot the land, so Stockholm, the Ruhr or Tokyo are where they should be. The clock runs on, so a long evening flight lands in the dark.

Before a flight you can **practise the landing** for a small fee (a share of the hourly lease): you start on the final at the destination, clean — gear and flaps up — the autopilot holds the glide path for 10 seconds and hands over 3 nm out, then you lower the gear and the flaps, land and brake below 35 kt. A good landing earns a little reputation with the client (A+ the most, C the least; only your best practice on each contract counts); a bad one costs nothing more than the fee. Then try again, go back to the briefing or fly it for real.

Starting **at the gate** and flying the whole ground routine yourself pays a bonus: +6 % of the contract and a little reputation. When you just want to fly, start **after pushback** — the tug has already taken you to the holding point: about 5 minutes less on the ground (and less lease on long flights), but no bonus. The game remembers which start you prefer.

## Controls

- **↑ ↓** or **W S** — pitch (↓ pulls the nose up) · **← →** or **A D** — roll, and steering on the ground · **Q E** — rudder
- **Z X** or **− +** — throttle · **1**…**8** — 10 %…80 % · **9** — full power · **0** — idle
- **Enter** — the next step on the ground: push back, engine start, take-off clearance
- **G** gear · **F / V** flaps down / up · **B** brakes (hold) · **Space** parking brake · **/** spoiler · **K** anti-ice
- **Y** autopilot · **N** back to the programme (NAV along the route and the planned altitude, after you changed the heading or the altitude) · **, .** selected altitude · **; '** selected heading (HDG mode)
- **T / R** time faster / slower · **C / Shift+C** next / previous view: cockpit, chase, front looking back, wing, tail fin, landing gear, top down, tower / fly-by · **M** moving map (on a big screen: mini map, big map, off) · **I** instrument lights · **H** controls card · **Esc** pause

**On a phone or tablet** the game goes fullscreen when you start (where the browser allows it). The **left half** of the screen is a floating joystick — it appears where your thumb lands: drag down to pull the nose up, left and right to roll and to steer on the ground (the nosewheel and the control surfaces are hydraulic: they follow your thumb smoothly, not at once). The **slider on the right edge** is the throttle — its lower half gives fine control of low power for taxiing. The flight strip and the hint text sit on the left; tap either to fold or open it (the strip folds to the route, the fuel and the time left). The buttons come in rows of related ones: **Menu · View · Map · Ice** (anti-ice), **AP · NAV** (back to the programme) **· Time − · Time +**, **Flap − · Flap + · Gear · Spoiler**, **Go** (push back, start, take-off clearance) **· Brake · Park** (the parking brake — release it to taxi). The map closes with a tap anywhere on it. A switch that stays on lights up on its button: the autopilot, NAV and the gear down in green, the spoiler and the parking brake in red. Held upright the buttons run across the top and the four main gauges sit two by two on a taller panel; on its side the climb rate is a number next to the altimeter. Both thumbs work at the same time, so you can fly and work a checklist together.

The controls work in any keyboard layout (the keys are read by their place on the keyboard).

**Sound**: jet fans whine and roar with the power, propellers beat, the wheels rumble over the slab joints, the brakes hiss, the gear and the flaps whir and clunk, the tyres chirp on touchdown — and a voice calls "V one", "rotate" and the radio heights down to "ten" on landing.

## Emergencies

Every flight draws its problems: engine fire or failure, a fuel leak, icing, windshear, a bird strike, cabin depressurisation, a gear that will not come down, hydraulic or navigation failure, a medical emergency, a shifted load… When one happens the time acceleration stops, the caution sounds and a **QRH checklist** opens. It says what happened and lists the steps in order; the lit one is next, and each step shows the control that does it. Most are the real controls — thrust to idle with **0**, anti-ice **K**, the gear lever **G**, the speed brake **/**, the autopilot **Y**, pulling up with **↓** — and the checklist ticks them off as you do them; the switches that only exist in the checklist (a fire handle, a crossfeed valve, a call to ATC) are worked with **Enter** (on a phone: tap the lit step or **Go**). Some things can go either way: the fire may need the second bottle, a failed engine may start again. Finish before the timer runs out and you see how long it took; run out of time and the failure escalates — damage, lost engines, lost fuel, a lower pay.

## Difficulty

Chosen on the title screen and in the pause and debrief dialogs, remembered between visits:

- **Easy** — half the wind and light turbulence, one problem at a time, checklists explain why each step is done and give 50 % more time, generous landing grading and no deadlines.
- **Medium** — real wind and turbulence, sometimes two problems in one flight, checklists without the explanations, standard deadlines and grading.
- **Hard** — strong wind and severe turbulence, two problems every flight, 25 % less time on the checklists, short deadlines, strict grading and more damage.

## Career

Money is in Swedish kronor. Each contract pays for the distance and the load, plus bonuses for the landing grade, being on time and handled emergencies, minus the aircraft lease (per flight hour), the fuel burnt, repairs and penalties.

- **Network** — the world is opened a region at a time: **Sweden** (where you start), **Scandinavia & the North Atlantic** (Norway's fjords, Finland, Denmark, Iceland, Greenland, Svalbard), **Europe**, **the Middle East & Africa**, **the Americas** and **Asia & the Pacific** — 114 real airports. Each region's traffic rights need reputation and flights, and cost money. From Arlanda the board offers the open regions; away from home it offers the flight back and onward legs, so the far side of the world is reached in legs of up to 4 500 nm (8 300 km).
- **Long haul** — on the autopilot the time acceleration goes up to ×128 over a world at its real size; Stockholm–New York takes about ten minutes of real time.

- **Hangar** — ten real aircraft, from the 19-seat **Beechcraft 1900D** turboprop, the **DHC-6 Twin Otter** bush plane, the **Fokker F27** freighter and the **Bombardier CRJ200** regional jet to the **Boeing 737-800**, the **Airbus A320** and **A320neo**, the **Boeing 767-300F**, the **Airbus A350-900** and the four-engine **Boeing 747-8F** freighter, each with its real maximum take-off and empty weight (on its hangar card; the briefing and the flight strip show the weight of your flight against it), speeds, range, runway needs and its own 3D model.
- **Training** — 16 courses in four branches (General, Passenger, Cargo, Bush & SAR). Each ends in a short exam (3 of 4 right) and unlocks aircraft, contract types or real advantages: checklist hints, more time in emergencies, slower icing.
- The **Hangar** tab shows how many types you may fly; a gold dot on **Training** or **Network** means a course or traffic rights are ready for you right now.
- **Career** — reputation with three client groups, licences, records and the log. Below −50 000 kr nobody will lease you an aeroplane any more and the career is over.

## Airlines and airports

The clients are real airlines: SAS, Norwegian, Finnair and Widerøe at home, then Lufthansa, British Airways, KLM, Emirates, Qatar Airways, Delta, Qantas and about 75 more — passenger airlines, cargo carriers (DHL, FedEx, UPS, Cargolux, West Atlantic) and bush and air ambulance operators. Each has its logo on the contract board, and your aeroplane flies in the colours of the airline that hired it, titles on the fuselage and the emblem on the fin; the home carriers stand at the gates and have their logos on the hangars.

Every airport is recognisable from the cockpit: its name in big letters on the terminal roof, a "Welcome" banner with the city's landmark (the Three Crowns of Stockholm, Big Ben, the Eiffel Tower, the Burj Khalifa, the Sydney Opera House…), the national flag and the city flag on the roof and over the tower — they stream with the wind, like the windsock. Runways have concrete ends with joints, tyre marks, shoulders and blast pads, edge and centreline lights, approach lights with a running flasher and a working PAPI (two white, two red: on the glide path); taxiways have shoulders and edge lines, the apron has concrete slabs and stand markings, and a road, a car park and a perimeter road surround the field.

## Exams

Every course ends in a short exam: four questions, three right to pass. They are written in plain words — a school pupil can work them out — with a **Hint** button and an explanation after every answer, and they run in the game's language — **English, Russian or Swedish**.

## Language

The whole game — the menus, the briefings and debriefs, the prompts and messages in flight, the emergency checklists, the touch buttons, the courses and the exams — is in **English, Russian or Swedish**. Pick the language at the top of the title screen; the choice is remembered (the first time the game follows your browser's language). Airport, city and airline names, the instrument labels and the spoken callouts stay as in a real cockpit.

## Units and the map

**Units** on the title screen (and in the pause): aviation units — feet, knots, nautical miles, fpm — or **metric**: metres, km/h, kilometres, m/s, rounded to sensible numbers. Prompts, messages, screens and the instruments all follow the setting.

The **moving map** (**M**) draws the track you have actually flown — yellow on the ground, green in the air — over the planned route. On a big computer screen a **mini map** stays in the top right corner while you fly; **M** switches between the mini map, the big map and no map. The maps show the arrival runway with its final approach (a dashed line and an arrow in the landing direction).

On the approach the **ILS** shows a little magenta runway on the RUNWAY scale where the runway is and a cyan triangle on the GLIDE PATH scale where the glide path is, with plain words underneath ("runway to the RIGHT — turn right", "HIGH — descend more"). A line of **magenta dots** in the sky, one every nautical mile, marks the glide path down to the runway — in every camera view; fly down the dots and you are on the ILS. On a computer the ILS scales sit on the right, off the view ahead; the hints and messages sit on the left under the flight card. Both helpers can be switched off with **Landing aid** on the title screen or in the pause.

## Graphics

**Auto** (the default) picks Medium on phones and High elsewhere and steps down if the frame rate drops; **Low**, **Medium** and **High** set the terrain detail, draw distance, clouds and trees.

## Tech stack

Plain HTML + CSS + vanilla JavaScript split by concern into folders — `core/` (helpers, language, input, sound), `data/` (airports, countries, airlines, exams, the Russian and Swedish texts, coastlines), `art/` (flags, city symbols, airline emblems), `sim/` (the world, terrain, flight dynamics, systems), `render/` (the 3D models, airports and scene) and `ui/` (instruments, cockpit, HUD, screens), with `game.js` and `career.js` on top — no build step. The 3D world uses three.js (vendored as `lib/three.min.js`), the cockpit and instruments are Canvas 2D, and the sound is synthesized with the Web Audio API.
