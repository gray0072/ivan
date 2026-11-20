# Arlanda Rising — SPEC

Developer/agent spec for the `arlanda-rising` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

> **Status: spec, third draft, with the user's decisions taken in. No code yet.** Settled with the user: the name *Arlanda Rising* (folder `arlanda-rising`); **real airlines with their emblems and real brands** (Swedavia, Arlanda Express, Flygbussarna and the like); **isometric** graphics; **short missions** (at most about 10 minutes, split into stages, never lost when interrupted) for a child with a 40-minute phone limit; **at least 20 hours** of campaign; **one airport through the whole campaign that grows by the historical master plan** — freedom within each mission's frame, full freedom only in small things (adverts, banners, which airlines to court), the architecture and the look of the buildings follow the historical checkpoints (see "The master plan"). The game is not in the gallery, the root `SPEC.md` or the root READMEs until session 2 ships something playable (see "Build order"). The settled decisions are listed at the end ("Decisions").

## Idea

A management and strategy game about running a real airport, **Stockholm Arlanda**, from the day the first trees were cut in a pine forest north of Stockholm (1959) to the Arlanda of today, and on to an Arlanda of 2040 that the player designs. The player is the airport's director: builds runways, terminals, stands, roads and the train link; signs real airlines; hires people and their managers; keeps passengers, airlines, neighbours, staff and the owner happy; and fights Swedish winters, strikes, ash clouds, pandemics and IT outages.

The game's heart is **the shift from doing everything by hand to running a machine you built** — and learning that the machine is not free. In the first missions the player personally drags every aircraft to its stand, sends each fuel truck and opens each security lane. As traffic grows this becomes impossible, and the player hires people, then buys systems, then links them together. Each step costs money every month, needs its own people (IT, maintenance), sometimes breaks, and can leave the airport helpless when nobody remembers how to work by hand.

What makes it pull a schoolkid **and** a clever adult in:

- **A living airport to watch.** SAS, Norwegian, Finnair, Lufthansa and Emirates aircraft in their real colours land, taxi, turn round and push back; baggage carts snake across the apron; snowploughs sweep a runway in a staggered convoy with amber beacons; the yellow Arlanda Express pulls into the station; queues grow and shrink in the terminal. Everything you build is visibly doing something.
- **Short and never lost.** A mission is a few minutes long, split into stages, and saved all the time: a phone that locks in the middle continues exactly where it stopped (see "Sessions").
- **Your hands are a resource.** The tray of manual tasks fills up faster than you can tap — and the first automation that empties it feels like magic. The report after each stage says how much work your systems did and what they cost.
- **Real choices with no right answer.** A rich long-haul airline that demands an A380 gate and fines every delay, or a low-cost carrier that haggles over every krona but brings crowds who shop; a fast-paying car park or the slow-paying train that the neighbours love; two managers, each brilliant at one thing and bad at another; lay-offs after automation or retraining that costs a fortune.
- **Real history as the campaign.** Each chapter is an era of the real Arlanda (the jet age, the domestic move from Bromma, Arlanda Express, Schengen, the new tower, runway 3, the ash cloud, the pandemic) and ends with the newspaper of the day. After every mission the player's numbers are compared with **the real Arlanda's** ("Real Arlanda 1999: 18 million passengers · You: 16.2 million") — beating them gives a 🏅.
- **Depth on demand.** A child plays from the map and the task tray; an adult opens the finance screen with cash-flow charts, payback and net present value of every investment, the union's wage round, the environmental permit's caps and the stand-planning Gantt chart.
- **Collections.** The **Plane Spotter's Album** (every real aircraft type and airline livery that ever visited your airport, from a Linjeflyg Convair to an Emirates A380 and an electric commuter plane) and the **Arlanda Archive** (short, checked history cards with a drawn picture).

Target: **at least 20 hours** for a first pass of the campaign with ★ or ★★ on most missions (see "How long it lasts"), more for ★★★, the 🏅, Free Play and the Challenge Days. Phone first in landscape (portrait works with bottom sheets), tablet and desktop.

## Taken from the other games of this repo

| From | What | How it is used here |
|---|---|---|
| `city-builder` | Isometric Canvas 2D map with procedural, cached sprites; map-app gestures; build toolbar with locked tools; building card with Upgrade / Repair; overlays; budget card; debt months before game over; milestones unlocking buildings | The airport map, the build tools, the cards, the noise / queue / coverage overlays, the "the owner replaces you" failure |
| `lift-logic` | Missions with three stars of different aims; chapter = building, the last mission an exam; hints in three steps (Hint 3 caps at ★★); guided finger in the first missions; the Inspector's notes with **Show me**; the Engineer's record → 🏅; comic lines and the newspaper after an exam; the Museum of checked facts; a headless checker that balances every mission with a reference solution | Mission structure, stars, hints, the debrief, the "Real Arlanda" 🏅, the Archive, `tools/missions-check.js` |
| `world-aviation` | Arlanda as home; **real airlines with simplified drawings of their liveries and emblems** (`data/airlines.js`, `art/emblems.js`, about 100 airlines); brand boards (`art/brands.js`); real aircraft types and their numbers; money in Swedish kronor; three languages; cloud save | Copied (not linked — projects are self-contained) and extended with the historic airlines and the local brands, drawn for the isometric view |
| `fish-frenzy` | Auto graphics quality | The renderer drops detail (people, cars, shadows) on slow devices |
| all | Three difficulty levels, Sound On / Off, cheats with banners, PWA, `?v=N`, prefixed storage | As required by `AGENTS.md` |

## The world: Arlanda (binding for every session)

The game must **look and feel like Arlanda** in every session. Before drawing or placing any landmark, check it against the sources at the end of this section. Facts that are shown to the player (the Archive, mission briefings, "Real Arlanda" numbers, which airline flew when) are checked before they ship and noted in `data/archive.js` / `data/airlines.js` with their source.

### Geography and layout

- **Setting:** Sigtuna municipality, about 40 km north of Stockholm. Flat land of **pine and spruce forest with birch edges, granite outcrops, small lakes** (Halmsjön lies north of runway 3), fields, red wooden farmhouses (Falu red). **Märsta** town to the south-west, the **E4** motorway to the west, the **East Coast railway** (Ostkustbanan) to the east, road 273 through the airport area.
- **Runways** (real, final state): **runway 1 = 01L/19R, 3 300 m** (the long one); **runway 3 = 01R/19L, 2 500 m**, parallel, opened 2003, away from the terminals and reached over **taxiway bridges**, with its own remote **de-icing area** near it; **runway 2 = 08/26, 2 500 m**, the crosswind runway. Runways 1 and 3 can be used independently. High-speed exits on all but 08/26. *Exact positions, the taxiway system and the terminal area's place between them are taken from the official aerodrome chart (Swedish AIP, ESSA AD 2) before the map is drawn — not guessed.*
- **Terminals** (final state): **Terminal 5** (international, piers **D, E, F**; **Arlanda North / Pier F** opened 2003; the former **Terminal 4** domestic terminal joined to it airside in 2022), **Terminal 2**, **Terminal 3** (regional), **Sky City** between the terminals (shops, hotel, the station hall). The original 1960s terminal and later ones appear in their era; what became of each is checked in the sources.
- **Towers:** the **old control tower** (1960s) and the **new tower of 2001 by Wingårdh** — a slender concrete sculpture (European Award for Excellence in Concrete 2002; heights given differently by sources, about 74 m to the balcony and about 83 m in all — check before using).
- **Rail:** **Arlanda Express** (opened 1999, a concession) in a tunnel with underground stations (Arlanda South, Arlanda North) and **Arlanda C** for SJ, SL commuter and Upptåget trains. The trains in their real livery (check the current one).
- **Other landmarks to place in their era:** car park houses, the cargo area, fire stations, the de-icing pads, the hotels, the fuel farm, the snow-clearing depot, the jumbo-jet hostel at the entrance road (**Jumbo Stay**, a Boeing 747 turned into a hostel — check whether it is still there; if closed, it appears only in its years).

### Real names and brands

The game uses **real names, liveries and logos**, drawn as **simplified pictures** (procedural canvas drawings or small SVGs made for the game, never copied image files), as `world-aviation` does.

- **The airport and the authorities:** Arlanda is run by **Luftfartsverket (LFV)** until 2010 and by **Swedavia** from 2010 (the owner changes in chapter 6, with Swedavia's colours on signs and vehicles from then on); air traffic control by LFV; **Transportstyrelsen** (the safety authority) in inspections; **Polisen** at the border, **Tullverket** at customs.
- **Airlines:** the real airlines of each era, in their real colours and emblems of that era (see "Airlines").
- **Ground transport:** **Arlanda Express**, **Flygbussarna**, **SL** commuter trains (from 2012) and buses, **SJ**, **Upptåget**, taxis (**Taxi Stockholm**, **Taxi Kurir**, **Sverigetaxi**), car rental (**Hertz**, **Avis**, **Europcar**, **Sixt**).
- **Terminal shops, cafés and restaurants** — many, and ones a Swedish family knows at a glance; recognisable places are what make the terminal feel real. The player picks them for the shop units (see "The master plan"), from a catalogue of real chains, each available **from the year it existed in Sweden** (no Joe & The Juice in 1975). A first list, each to be checked (the exact name, logo and colours, the first year in Sweden; marked when it really was at Arlanda):
  - **Cafés and juice:** **Joe & The Juice**, **Espresso House**, **Waynes Coffee**, **Starbucks**, **Pressbyrån** (coffee and a bun), **7-Eleven**, **Gateau**, **Le Pain Français**.
  - **Fast and casual food:** **Hawaiian Poké** (check the Swedish chain's exact name), **Sushi Yama**, **Max**, **Bastard Burgers**, **Burger King**, **McDonald's**, **Sibylla** (hot dogs), **Vapiano**, **Pinchos**, **O'Learys** (sports bar), **Pizza Hut**.
  - **Shops:** the duty-free operator of the era, **Pressbyrån** (papers, sweets), **Akademibokhandeln** (books), **Clas Ohlson**, **Kicks** (beauty), **Lindex**, **Gina Tricot**, **Polarn O. Pyret** (children's clothes), **Lego**, **BRIO** (toys), **Design House Stockholm**, **Svenskt Tenn**, **Dalahäst** souvenirs, a pick-and-mix sweets shop.
  - **Services:** **Forex** (money exchange), a pharmacy (**Apoteket**, **Apotek Hjärtat**), **SJ** and **SL** ticket desks, the **Flygbussarna** desk, the car-rental desks.
  Each brand has its own numbers in `data/brands.js`: the rent it pays, the spend per passenger, whom it draws (families, business, tourists, children, transfers; Schengen or not), its opening hours, its size (kiosk, unit, big unit), the first year it can open and its sources. Kids' favourites lift the Passengers meter for families; a café near the gate lifts it for everyone in a delay.
- **Hotels:** **Radisson Blu Sky City**, **Clarion Hotel Arlanda Airport**, **Jumbo Stay**, in their real years (`data/brands.js` with sources).
- **Vehicles:** real makers where checked (Volvo and Scania trucks and buses; the snowplough and fire-truck makers actually used at Arlanda).
- **Rules for real brands:**
  - Every real company is shown **respectfully and truthfully**: its temper in the game comes from its public, documented way of doing business (a low-cost carrier asks for low fees and fast turnarounds; a long-haul A380 operator needs a Code F gate), never from invented misconduct.
  - **Random events never blame a real company:** a random breakdown is "the baggage system", a random cyber attack hits "the airport", a random late flight is weather or a turnaround step. Real historical events (a real bankruptcy, the ash cloud, the 2024 IT outage) are told as they happened, neutrally, in their real year.
  - **People are fictional** (managers, staff, the mentor), except public figures in historical facts (the King opening the airport in 1962).
  - The READMEs and the Archive's About card say: *a free, non-commercial fan game; not affiliated with or endorsed by Swedavia or any company shown; names and logos belong to their owners.*

### Look and style

- **View:** isometric 2:1 (like `city-builder`), procedural Canvas 2D drawings cached per zoom step, no photos. The whole airport fits on screen when zoomed out (runways as the dominant lines), and at full zoom one stand with its aircraft, the vehicles and the hi-vis people round it fills the screen; the airline's emblem on the fin is readable there.
- **Seasons and light are part of the identity:** a long dark winter (snow on everything but the cleared surfaces, blue afternoons, warm terminal windows, amber beacons, sodium-orange and later white LED apron lights, steam from engines), a bright short summer with **white nights** (around midsummer the sky never gets fully dark), autumn rain and fog, spring slush. The sun's height follows the real latitude (59.65° N) and date.
- **Palette tokens** (in `render/palette.js`, not in the logic): pine `#2E4A33`, spruce `#1F3326`, birch bark `#E8E4D8`, granite `#8A8F94`, lake `#3E6E8E`, Falu red `#8E2A1E`, snow `#F4F7FA`, asphalt `#3A3D41`, apron concrete `#B9B6AE`, taxiway line yellow `#F2C230`, terminal glass `#6F8FA6`, warm wood `#C89B63`, hi-vis yellow `#E8F23A`, hi-vis orange `#F28A1E`, beacon amber `#FFB000`. Brand colours come from the brand's own data, not from this palette. Interiors use light Scandinavian wood, white and grey stone, glass and daylight.
- **Aircraft** are real types of their era, drawn to scale (wingspan and length from `data/aircraft.js`, shared knowledge with `world-aviation`): DC-3, Convair 440, Caravelle, DC-8, DC-9, Boeing 727, 747, MD-80, Fokker 28 / 50 / 100, Saab 340 / 2000, BAe 146 / Avro RJ, Boeing 737 family, A320 family, ATR 72, CRJ, A330, 767, 777, 787, A350, A380, freighters, and in the future chapter an electric 30-seat commuter and a hydrogen prototype.
- **Swedish touches** next to the English: signs in Swedish and English ("Avgångar · Departures", "Utgång · Gate", "Bagage · Baggage"), fika in the staff room, *semester* in July, Lucia on 13 December, Midsummer, the snow crews' pride.

### Sources to check against

- Swedavia, *About Stockholm Arlanda Airport* and the airport's development plan (Terminal 5 expansion; the planned **Pier G** — 14 bridge-connected gates — was approved for detailed design in 2025 and **discontinued by Swedavia's board in November 2026**: in the future chapter the player decides on their own pier).
- Swedish AIP, ESSA AD 2 (aerodrome data and charts) — the runway and taxiway geometry.
- Wikipedia, *Stockholm Arlanda Airport* — history dates (official opening 1 April 1962 by King Gustav VI Adolf; first used for training flights in 1959), terminals, airlines and destinations, traffic by year.
- The airlines' and brands' own histories for their years at Arlanda, their liveries and logos by era.
- Photos of the terminals, piers, Sky City, the 2001 tower, Arlanda Express and Flygbussarna for the drawings.

## The master plan: freedom within the history

One airport runs through the whole campaign, but it **grows by the real Arlanda's plan**: the player decides *how*, *when within the mission* and *how well*, history decides *what* the big structures are, *where* they stand and *what they look like*. So the airport of every chapter's end looks like the real Arlanda of that year, and every later mission can rely on it.

- **Historical checkpoints (fixed):** the runways, the taxiway system, the terminals and piers, the towers, Sky City, the stations and the rail tunnel, the cargo area and the big car park houses stand on their **real sites with their real footprint and their real architecture of the era** (`data/masterplan.js`: each project with its year, its plot, its look and its stages, with sources). A mission that brings one shows it on the map as an **outlined plot** with the architect's drawing; it cannot be moved, redesigned or left out — building it (or a stage of it) is part of the mission's ★ goal. The look changes only at the checkpoints history had (the 1960s terminal, the 1976 international terminal, the 2001 tower, the 2003 Pier F, the 2022 joining of T4 and T5…).
- **Freedom within the frame (each mission):** the **order** of the plan's stages and **when** each starts; the **pace** (normal, or faster with overtime and a higher price); the **financing** (cash, a loan, the owner's grant with its conditions, a partner — and the partner's terms); **options** the real project had or could have had without changing its look (how many jet bridges on a pier, a bigger baggage hall, solar panels on the roof, backup power); and the **inside** of every terminal in the Terminal view — desks, lanes, gates' seating, shops, lounges, play areas — within the terminal's walls.
- **Free plots:** a mission also opens a few **free plots** in the landside and on the apron edge, where the player places small buildings of their choice from the era's list (an apron bus garage, a de-icing pad, a snow depot, a staff car park, a hotel extension, a solar field, a remote stand) — none of them changes the historical skyline.
- **Full freedom in small things:**
  - **Adverts and sponsorship:** banners in the terminals, boards along the roads and on the car park houses, screens at the gates, the naming of a lounge — real brands of the era bid for them (two or three offers at a time, each with its price and length); too many adverts lower the Passengers meter a little. The player picks, places and changes them freely.
  - **Which airlines to court:** among the real airlines of the era, the player chooses whom to invite, with what incentives, and whom to say no to — so the mix of liveries on the apron, the routes and the shops' passengers are the player's own.
  - **Shops, cafés and restaurants** in each terminal — the player chooses which real chain goes into which unit (Joe & The Juice by the gates, Sushi Yama in the food court, Lego near the family area), from the catalogue of the era (see "Real names and brands"); chains also come to the Offers board asking for a unit. The duty-free operator, the kerbside taxi and car-rental companies, the art in the terminals, the Christmas tree and the Lucia choir's place. The airport's own vehicles always wear the owner's real colours (LFV, then Swedavia).
- **The 2040 chapter** loosens the frame: the plot of the new pier is fixed, its shape and size are the player's (from a few designs and a size slider), as the real Pier G was dropped in November 2026 and the future is open.
- **Free Play** has no frame: any building on any free land.

## Sessions: short missions that are never lost

A child may have **40 minutes a day** on the phone. So:

- **A mission is at most about 10 minutes of play** (chapter 1: 5–7), split into **2–3 stages** of 3–4 minutes each (for example *Morning peak 06–09*, *Midday*, *Evening wave 16–19*). Between stages a short card shows the stage's result and what comes next; the player may stop there.
- **Nothing is ever lost.** The whole state of a running mission is saved **every few seconds** (`AUTOSAVE_SECONDS`), at every stage's end, and at once when the page is hidden (`visibilitychange`, `pagehide` — a phone that locks, a time limit that closes the app, a call). Opening the game again shows **Continue mission** and resumes at that very moment, **paused**, with a one-line reminder of the goal. The sim is deterministic from its seed and state, so a resumed mission plays the same as if it was never stopped.
- **A failed stage is retried, not the mission.** Each stage start is a checkpoint: *Retry stage* (default) or *Restart mission*.
- **Long-term decisions happen between missions**, in the **Office** (see "Screens"): building plans, hiring, offers, finance — with time stopped, so they never eat a mission's minutes, and they can be left half-done and come back to.
- The start screen and the mission card show **about how many minutes** a mission takes; the results show the next one's ("Next: Morning Peak · ~8 min").
- **For those who want more** (an adult, or a weekend):
  - **Next mission** is one tap, and the airport carries over, so several missions in a row feel like one long game.
  - **Keep the shift going:** after a mission's goal is reached, the day may run on with small rolling goals (no stars at stake, the Album and the Archive keep filling, extra income capped by `SHIFT_BONUS_MAX` so the campaign's balance holds).
  - **Challenge Days** (open after chapter 3): longer scenarios of 20–60 minutes — a whole record day of 1999 or 2019, Christmas week, the ash cloud week — saved at any moment like a mission.
  - **Free Play** (opens after chapter 2): an endless airport, see "Free Play".

## Screens

- **Start screen:** the language switcher (EN · RU · SV), the title over a slow flyover of the player's current airport (or the 2040 Arlanda before a campaign exists), **Continue mission** (when one was interrupted: its name, stage and minutes left) or **Continue** (the campaign: the chapter, the year), **New Campaign**, **Free Play** and **Challenge Days** when open, the difficulty (Easy / Medium / Hard with a line on what it changes), Sound On / Off, Settings (hints Full / Short / Off, graphics quality, sums in full or short — `1 200 000 SEK` or `1.2 MSEK`), the Archive and the Album.
- **Timeline (campaign map):** a horizontal timeline 1959 → 2040 with the chapters as eras, each with its missions as stops, their stars and minutes; locked eras greyed; a picture of the airport as it looked at the end of each finished chapter.
- **Office** (between missions; time stopped): the airport map in planning mode — the **master plan** with the next historical projects as outlined plots (their stages, pace, financing and options), the free plots, the terminals' insides, the advert spaces and their offers (see "The master plan"); construction takes the calendar time that passes before the next mission — and the screens People, Airlines with the **Offers** board, Finance and the Ops Center. A **"Meanwhile…"** report opens it: what happened in the weeks or months since the last mission (simulated in summary, see "Time"), with the money, the meters and the news. The next mission's card is a tap away.
- **Mission card:** the year and season, the briefing in two or three speech bubbles by **Astrid** (the mentor, see "Hints"), the goals and the three stars, the stages, the minutes, what is new in this mission (new buildings, systems, airlines, entities — each with a small picture and one line), **Start**.
- **Game view:** the isometric map (airside and landside). HUD at the top: money (opens Finance), date and clock, weather and forecast, the five meters (**Airlines, Passengers, Neighbours, Staff, Safety**), the stage's goals with progress, the speed buttons ⏸ / ▶ / ▶▶ / ▶▶▶ and **Skip to next event** (only when nothing manual is waiting). Left: the **task tray** (see "Hands"). Bottom: the build toolbar by category (Runways & taxiways, Stands, Terminal, Landside, Services, Systems, Green) — small builds only during a mission (a lane, a desk, a bus, a temporary stand); big ones in the Office. Locked items with 🔒 and what opens them. Overlays: delays, queues, noise contours over the towns, fire-service reach, snow on surfaces, stand occupancy, power and IT network.
- **Terminal view:** a cut-away plan of a terminal (one floor at a time) with the passenger flow: kerb → check-in / bag drop → security → (passport) → shops and lounges → gate; and arrivals: gate → (passport) → baggage claim → customs → Arlanda Express, Flygbussarna, taxi, car park. Queues drawn as people with a wait time over each; the player places desks, lanes, shops (real brands), seating, toilets, play areas.
- **Ops Center:** one row per domain (see "Manual, people, systems"): its level, who or what does the work, uptime, the tasks it did today and the time it saved, its monthly cost, the fallback readiness, and the upgrade to the next level with its price, running cost and what it needs.
- **People:** the departments (headcount per shift, morale, fatigue, skill, absence today, wage), their managers, the union and the next wage round, hiring (with the security-clearance wait), training, the seasonal temps.
- **Airlines:** each airline's card (its emblem and livery, mood, contract, fees, demands, routes, flights a day, on-time share), the **Offers** board with the current choices, the route-incentive tool.
- **Finance:** the month's profit and loss by line, cash-flow chart, loans and their interest, the owner's target, every investment with its **payback** (estimated from the last 30 days) and, under *Details*, its net present value; what-if: the payback of a building before it is built.
- **Stage card** and **Mission results:** stars, the five meters, the **Real Arlanda** comparison and 🏅, the **Debrief** (up to three notes with **Show me**, see "Hints"), the automation summary ("Your systems did 2 410 tasks, you did 143; they cost 1.2 MSEK"), a comic line or two; after a chapter's exam the **front page of the local newspaper**.
- **Pause:** Continue, Settings, Sound On / Off, Retry stage, Restart mission (difficulty toggles pre-selected), Office, Main Menu (the mission is kept and can be continued).
- **Archive** and **Plane Spotter's Album.**

## Time

- **Ops time** (a stage of an operations mission): one game hour is about `OPS_HOUR_SECONDS` (60 s) at ▶, so a stage covers a 3–4 hour period of a day (▶▶ ×2, ▶▶▶ ×4, ⏸ stops; small builds, hiring a temp and the task tray work while paused).
- **Plan time** (a stage of a build or business mission): one game day is about `PLAN_DAY_SECONDS` (1 s) at ▶; construction progresses, money comes in and goes out month by month, offers and events arrive; it stops at every event that needs a decision.
- **Between missions** the calendar jumps (weeks to months, by the mission list). The skipped time is **simulated in summary** from the airport's capacity and the levels of its domains and reported in "Meanwhile…". A domain still worked by hand is run in summary by an imaginary **duty manager** at a poor efficiency (`MANUAL_SUMMARY_EFF`, about 60 %), so a manual airport loses money on every day the player does not play — automation pays off in the player's real time too.
- Seasons follow the real airline year: the summer schedule from the last Sunday of March, the winter schedule from the last Sunday of October.

## Hands: the task tray

Every domain that is not yet handed to people or systems creates **manual tasks** for the player: "SAS 412 from Luleå lands in 4 min — pick a stand", "The bag cart for gate 7 is full — send it", "Snow on runway 1 above 3 mm — send the ploughs", "Security queue 18 min — open a lane". Each task has a deadline ring; missed tasks become delays, unhappy passengers or a closed runway. Tasks can be done from the tray (one tap = the obvious choice) or on the map (drag the aircraft to a stand of your choice). The tray has room for `TRAY_MAX` tasks; overflow goes to the duty manager, who does them late and badly.

This is how the game shows the value of automation: chapter 1 is fun by hand, chapter 2 already fills the tray, and the first manager or system that empties a whole kind of task is a felt relief. The stage card counts the tasks the player did, the tasks people and systems did, and what that cost.

## Manual, people, systems: the automation ladder

Every domain of the airport climbs the same ladder. Each step has a build price, a **monthly running cost**, what it needs, its throughput and error rate, and its failure modes.

| Level | Who does the work | Cost | Weak point |
|---|---|---|---|
| 0 · By hand | The player (task tray) | Free, but the player's attention | Does not scale; the duty manager does the rest badly |
| 1 · People | A team of staff with a supervisor, by simple rules | Wages every month; training | Sick days, fatigue, strikes, summer holidays, mistakes when tired |
| 2 · System | A computer system and machines, run by fewer people | Big price; licence, IT staff and maintenance every month | Breakdowns, software updates gone wrong, power cuts; the staff forget the manual way |
| 3 · Integrated | Systems that share data (A-CDM-style planning, predictions) | Biggest price; a strong IT department; data links between domains | One outage takes several domains down at once; a cyber attack |

The domains (each opens in its era):

| Domain | By hand (tasks) | People | System | Integrated |
|---|---|---|---|---|
| Stands | Drag each arrival to a stand | Stand planner (first free stand that fits) | Stand allocation system (1980s) | Planning with predicted arrival times |
| Turnaround | Send fuel, catering, cleaning, baggage, pushback | Ramp supervisor | Turnaround dispatch software | Sensors and predictions (target off-block times) |
| Baggage | Drag carts, sort bags to flights | Handlers sorting by hand | Conveyors and a tilt-tray sorter with bar codes | RFID tags, early bag store, robots |
| Check-in | Open and close desks | Desk scheduler | Kiosks | Self bag drop and the phone app |
| Security | Open and close lanes | Shift planner | Queue sensors open lanes on time | CT scanners (liquids stay in the bag) |
| Border (from Schengen) | Open booths | Police shift planner | e-gates | Biometric boarding |
| Snow and ice | Send each plough to a surface | Snow chief with convoys | Weather-based clearing plan | Self-driving ploughs |
| De-icing | Send a de-icing truck to each departure | De-icing crew | Remote de-icing pads with a sequence | Glycol recovery and infrared hangar |
| Birds and wildlife | Tap birds and the odd moose to scare them | Wildlife controller with a dog | Bird radar and sound cannons | — |
| Information | Announce delays and gate changes | PA operator | Flight information screens | Push messages in the Swedavia app |
| Parking | Cashier booths | — | Pay machines | Number-plate cameras, booking |
| Maintenance | Tap broken things to send a mechanic | Maintenance team | Planned maintenance | Predictive maintenance |
| Fire and rescue | Send the trucks to an emergency | Fire service (always people; the category must fit the biggest aircraft) | Alarm and dispatch system | — |

Rules that make automation **not free** and **not magic**:

- **Running costs are visible.** Every level's monthly cost is a line in Finance; the Ops Center shows the domain's cost per task done.
- **Systems need people:** an **IT department** (and later cyber security) sized to the systems; maintenance staff for machines. A system with too few IT people loses uptime.
- **Failures:** each system has a mean time between failures; a failure drops the domain to the level below **if that level is still staffed**, otherwise to the player's hands. Software updates (offered every few months) bring a gain and a small chance of a bad update. A power cut takes every system without backup power down; the backup generator is a building.
- **Fallback readiness:** each automated domain has a readiness % — how well the staff still know the manual way. It decays every month without a **drill** (a scheduled day costing a little capacity). A failure with low readiness is far worse.
- **Automation and the staff:** replacing people with a system frees jobs. The player chooses **lay off** (money saved now; all departments' morale down, strike risk up, Neighbours down) or **retrain** (costly courses; the people move to IT, maintenance or service; morale up).
- **When it pays:** at low traffic a system costs more than it saves; the investment card shows the break-even traffic. Kids see "pays back in 8 months"; adults see the curve.

## People

- **Departments:** Operations, Ground handling, Baggage, Security, Border (Polisen, from Schengen; the airport pays only the space), Fire and rescue, Snow and maintenance, IT (later Cyber), Terminal service and cleaning, Commercial. Each has headcount per shift (three shifts), wage, **morale** (0–100), **fatigue** (overtime raises it), **skill** (training, experience; falls when new staff join).
- **Absence:** a base share is away every day; it rises in the **flu season** (January–February, up to ×3), with low morale and with fatigue. In **July** much of the staff takes the Swedish summer holiday: the player plans it in spring (spread it out, pay holiday-move bonuses, or hire **seasonal temps**). New staff for security-critical jobs need a **security clearance** that takes weeks (`CLEARANCE_DAYS`), so hiring late does not help — a lesson from the real summer of 2022.
- **Strikes:** each department has a union with a **wage round** every one or two years. The union states its demand; the player accepts, counters (a short negotiation with three offers and the union's mood shown) or asks the mediator (Medlingsinstitutet). A refused round gives a **strike notice** with a date a week ahead (as in Sweden); on strike days the department works at `STRIKE_CAPACITY` (about 15 %). Automated domains are hardly touched — unless the IT staff strike. Lay-offs, broken promises and low morale raise strike risk; a fair deal raises morale for a year. Unions are named by their role ("the security staff's union"), not after real unions.
- **Managers** (fictional people): each department can have a head. Candidates come **in pairs** (sometimes three), each with a salary, two strengths and one flaw, for example:
  - *Karin Ek, Operations* — stands planned 15 % better; knows every airline's temper (their mood shows a week ahead) · flaw: refuses to work with systems older than five years.
  - *Bo Lindqvist, Snow* — "smells snow" (storm warnings 12 h earlier); convoys 20 % faster · flaw: overtime bills in every storm.
  - *Mira Haddad, IT* — failures fixed twice as fast · flaw: wants the newest system every year, morale drops if refused.
  - *Erik Sund, Security* — cheap and calm, strikes less likely · flaw: lanes 10 % slower.
  Managers gain experience, ask for raises, can be **poached** by a rival airport (Copenhagen, Oslo, Helsinki) unless kept happy, and can retire with a farewell card in the Archive.

## Airlines and contracts

Airlines are **real**, each in its **real years at Arlanda** (checked), with its livery and emblem of the era (an airline that changed its look — SAS, Finnair, Lufthansa — shows the right one for the year). Each has a **temper** from its documented business model: how much it pays, what it needs and how it reacts. `data/airlines.js` (started from `world-aviation`'s) adds per airline: years at Arlanda, kind, fleet by era, temper numbers, sources.

| Kind | Examples by era (to check) | Pays | Needs | Temper |
|---|---|---|---|---|
| Home carrier | **SAS** (from the start) | High, many flights | A hub: transfers, its own pier, lounges, priority in snow | Loyal but shares its flights among Copenhagen, Oslo and Stockholm — serves them where it is best served |
| Domestic | **Linjeflyg** (until 1993), **Malmö Aviation / BRA**, Skyways, Nextjet, later **Norwegian** domestic | Low per flight, many | Morning and evening peaks, quick stands near the terminal | Easy; some went bankrupt in their real years |
| Charter and tour operators | **Transair Sweden**, **Sterling**, **Scanair**, **Novair**, **TUI fly Nordic**, **Sunclass**; tour operators **Ving**, **Fritidsresor / TUI**, **Apollo** | Medium | Summer and Christmas peaks, big jets for a few weeks | Easy, seasonal |
| European network | **Finnair**, **Lufthansa**, **British Airways**, **KLM**, **Air France**, **Icelandair**, **airBaltic**, **LOT**, **Turkish Airlines**; **Aeroflot** until 2022 | Medium–high | Connections at their own hubs, punctuality | Business-like |
| Low-cost | **Norwegian**, **Ryanair**, **easyJet**, **Wizz Air** | Low fees, haggles for discounts | Remote stands and walking are fine, 25-minute turnarounds, low costs | Easy to serve, hard to keep: moves aircraft to a cheaper airport if fees rise; brings crowds who shop |
| Gulf and long-haul | **Emirates**, **Qatar Airways**, **Thai Airways**, **Singapore Airlines**, **Air China**, **Ethiopian**, **Delta**, **United**; **Pan Am** in the early years | Very high per flight | Code E/F stands, jet bridges, lounges, fire category 9–10, fast transfers; penalties for delays | Demanding; a new route is a prize |
| Cargo | **DHL**, **UPS**, **FedEx**, **West Atlantic**, **Cargolux**, the long-haul airlines' cargo arms | Medium | Night slots, cargo apron and warehouse, fast trucks | Easy with the airport, hard on the neighbours |
| Business jets and state flights | Business-jet operators; the Swedish government's aircraft | High per flight, few | VIP terminal, discretion | Easy; Nobel week, summits |
| Future (chapter 8) | Electric commuter aircraft (for example **Heart Aerospace ES-30** — check its status), hydrogen prototypes | Low | Charging stands, short stands near the gate | Eager; green rating ++ |

- **History is the backbone, the player's choices bend it:** an airline arrives in its real era when the airport can take it (an A380 operator only with a Code F stand and fire category 10); it leaves earlier if it is treated badly, and later chapters keep the consequences. Real historical endings (a merger, a bankruptcy, the 2022 closure of airspace for Russian airlines) happen in their real year and are told neutrally; the game rule "the last month's fees are lost unless a deposit was asked" is a game rule, not a claim about the real company.
- **Fees** the airline pays: landing (per tonne of maximum take-off weight), per departing passenger, stand time beyond the free hour, security, and its share of shared services. The player can give a **route incentive** (a discount for the first years) to attract a new route — a real tool of real airports.
- **Contracts** run for a number of seasons, with promises both ways (on-time share, stands, number of flights) and penalties. An airline's mood follows delays the airport causes, lost bags, queues its passengers met, how its demands were met, and how it was treated against its rivals.
- **Offers come as choices.** Every few weeks the **Offers** board shows two cards, and the player can take one, sometimes neither, rarely both: two airlines wanting the same evening slot (Emirates' long-haul against Norwegian's three domestic rotations), a rich demanding airline against an easy poor one, a cargo hub against a quiet night, a sponsor for the new terminal against the neighbours' park. Manager candidates, investment partners (the railway built by a private partner who keeps most of the ticket income for decades, against building it with your own money — the real Arlanda Express choice) and event bids also come as pairs.
- **Rivals:** Copenhagen, Oslo and Helsinki compete for transfer passengers and for SAS's flights; Bromma for domestic business travellers until it closes (check the current plans); Skavsta and Västerås for low-cost carriers. Poor connectivity or high fees push routes there. A rival's move is announced as news.

## Economy

**Every sum in the game is in SEK** (Swedish kronor), at today's prices throughout the campaign (no inflation): never any other currency. The number first with a space between thousands; the unit by the language: English **SEK**, **kSEK**, **MSEK** (`4 700 SEK`, `20 kSEK`, `120 MSEK`), Russian **крон**, **тыс. крон**, **млн крон**, Swedish **kr**, **tkr**, **Mkr** — "SEK" is fine in every language too. One formatting function (`core/utils.js` `money()`) writes them all. This spec writes SEK. Numbers below are the starting design; final values live in `constants.js` and `data/` and are balanced by `tools/missions-check.js`.

### Income

| Source | Rule of thumb | Lesson |
|---|---|---|
| Landing fee | ~60 SEK per tonne MTOW (A320 ≈ 4 700 SEK, 747 ≈ 24 000 SEK) | Big aircraft pay more but need more |
| Passenger fee | ~110 SEK per departing passenger (domestic ~70) | Volume matters |
| Security fee | ~50 SEK per departing passenger | Covers security, roughly |
| Stand time | After the first hour, per hour (contact stand more than remote) | Long stays cost space |
| Shops, food, duty free | The airport's share per passenger, 15–60 SEK, **× the free time airside** (fast security = more shopping) and the passenger mix (international and leisure spend more) | Fast queues earn money twice |
| Parking, car rental | ~30 % of local departing passengers drive; per day | The train cuts this income |
| Real estate | Rents from hotels, offices, Sky City, the cargo area | Slow but steady |
| Rail and buses | Station fees or a ticket share (depends on the deal) | The concession choice |

Revenue per passenger starts at about two thirds aeronautical (fees) and one third commercial in the 1960s; the player can push it to about half and half by the 2010s, as real airports did.

### Costs

Staff (≈ 45 000 SEK per full-time job a month, all included; overtime ×1.5), the systems' running costs, upkeep (2–5 % of each building's price a year), energy (heating in winter is big), de-icing fluid (per litre; an aircraft takes from a few hundred to a few thousand litres), snow clearing fuel, insurance, interest on loans (`LOAN_RATE`, about 4 % a year), penalties to airlines for airport-caused delays, fines for breaking the environmental permit.

### The owner

The airport belongs to the state: **Luftfartsverket** until 2010, **Swedavia** from then. Each chapter the owner sets a **return target** (profit over the chapter) and may give **grants** for national projects (the first runway, the train, runway 3). Loans are available up to a limit set by the owner, which grows with the profit. Cash below zero for `DEBT_MONTHS` months in a row fails the mission: **the owner replaces the director** (retry the stage, or restart the mission, with the difficulty pre-selected).

### Investments: fast and slow paybacks

Illustrative starting numbers (the in-game card computes the payback live from the airport's own traffic):

| Investment | Price | Monthly cost | What it gives | Payback |
|---|---|---|---|---|
| Apron bus | 1.5 MSEK | driver wages | Remote stands usable, airlines content | weeks |
| Self-service kiosks (10) | 2 MSEK | 20 kSEK | Fewer check-in staff | months |
| Car park house (2 000 places) | 120 MSEK | 0.3 MSEK | Parking income | ~2 years (fast, but the neighbours and the green rating dislike it) |
| Walk-through duty free | 60 MSEK | rent paid to you | Shop income × international passengers | ~1.5 years |
| Jet bridge (per gate) | 25 MSEK | 0.1 MSEK | Faster boarding, Passengers ↑; long-haul airlines require it | ~5 years direct, more via contracts |
| Baggage sorting system | 400 MSEK | 3 MSEK + IT | Needed above ~1 500 bags an hour; fewer handlers, fewer lost bags | ~6 years |
| Glycol recovery | 80 MSEK | 0.5 MSEK | 30 % less fluid bought; green rating ↑ | ~7 years |
| Aquifer energy store (Arlanda really has one in the esker) | 50 MSEK | small | Heating and cooling −20 % | ~6 years |
| Solar park | 40 MSEK | small | Energy −5 %; green rating ↑ | ~10 years |
| Hotel in Sky City | 300 MSEK | — | Rent, Passengers ↑ | ~10 years |
| Flygbussarna terminal stops | 10 MSEK | — | Bus share ↑, Passengers ↑, a share of tickets | ~3 years |
| Runway 3 | 4 000 MSEK | 5 MSEK | Peak capacity +60 %, independent parallel runways, new contracts | 15+ years (the owner's grant helps) |
| Arlanda Express | 6 000 MSEK own money, **or** a concession | — | Passengers ↑↑, Neighbours ↑, green ↑, parking income ↓ | own: very slow; concession: free now, almost no ticket income for decades |

The fast investments keep the cash alive; the slow ones decide the next chapter. A good player mixes them; the Finance screen's chart shows the cash dip and the climb of each.

## The five meters

- **Airlines** — the average of the airlines' moods, weighted by their flights. Low: routes leave, contracts are not renewed.
- **Passengers** — 1 to 5 stars from waits, walking, cleanliness, information, shops and food, seating, lost bags, delays caused by the airport, train, buses and parking. Low: fewer passengers choose the airport, less shop income.
- **Neighbours** — noise over Märsta, Sigtuna, Upplands Väsby and Knivsta (night flights count most), traffic on the roads, jobs given. Low: complaints, the permit's caps get stricter, a court case blocks a runway project.
- **Staff** — the departments' morale. Low: absence, strikes, mistakes.
- **Safety** — runway incursions, bird strikes, fire-service reach and category, worn surfaces, snow and ice, security misses. Low: Transportstyrelsen inspects, closures. **Safety is a hard floor:** below `SAFETY_MIN` the affected runway or terminal is closed until fixed. There are no crashes in the game: a serious event is a "close call" with an investigation that costs time and money.
- Plus the **green rating** (from chapter 6): CO2 from the airport's own operations, energy, glycol, biofuel share, ground transport by train and bus. The **environmental permit** (also chapter 6) caps movements per year and CO2 from traffic to and from the airport, as Arlanda's real permit does; breaking it means fines and stricter rules.

## Operations in a stage

- **Flights:** the period's schedule comes from the contracts (with randomness by difficulty: early, late, diverted, cancelled). An arrival needs a runway slot, a free exit, a taxi route, a **stand that fits** (size code A–F, contact or remote, Schengen or not), then the **turnaround** — a little Gantt bar over the aircraft: deboarding, cleaning, catering, fuel, baggage off and on, boarding, pushback. A late step delays the departure; the delay follows the aircraft to its next airport and back (reactionary delay).
- **Runways:** capacity per hour by the runways in use and the weather; wind decides the direction (and runway 2 is for crosswinds); low visibility cuts capacity; snow closes a runway until cleared (braking action shown as good / medium / poor).
- **Passengers:** each flight's passengers walk through the terminal as small groups (business, families, tourists, transfers — with a minimum connecting time). Queues build at every step; long ones show in red with a time.
- **Snow and ice:** snowfall puts millimetres on every paved surface; ploughs, sweepers and blowers clear in convoy; runways first. De-icing makes departures slower in cold weather.
- **Emergencies:** an aircraft declaring an emergency gets priority and the fire service must reach the runway in time (the ICAO response-time rule, simplified).
- **Wildlife:** birds over the runways (more in spring and autumn migration), a moose or deer in the fence's gap — they stop movements until scared away.

## Events

Each mission has scripted events; between them random events come by season and difficulty: snowstorms, freezing rain, fog, thunderstorms, a heatwave, the flu, a power cut, a bad software update, a cyber attack (later chapters), a baggage system jam, a strike notice, a VIP flight, a lost child at security (kids love the happy end), a fuel shortage, a medical diversion, a moose. Big historical ones are missions of their own: the **ash cloud of April 2010** (European airspace closed for days — stranded passengers to feed and house), the **pandemic** (traffic near zero for months — mothball terminals, furlough or lay off, keep the cash alive), the **summer of queues 2022**, a **global IT outage** (July 2024). Cultural events bring peaks: **Nobel week** in December, **Midsummer**, Christmas charters to Lapland, a royal wedding (2010), **Eurovision in Stockholm (2016)**, world-famous concerts, ice-hockey championships.

## Campaign

**Eight chapters (eras) × 11 missions** (the 11th the chapter's **exam**) = **88 missions**, each at most about 10 minutes in 2–3 stages. The airport **carries over** from mission to mission and grows by the **master plan** (see above): the big structures reach every historical checkpoint, because building them is part of the missions' goals; what differs from player to player is the money, the people and their managers, the automation levels, the airlines, the insides of the terminals, the free plots and the adverts. Each mission saves a snapshot at its start, so it can be replayed for stars without touching the campaign (the campaign keeps the result of the first pass; a replay only improves stars). Between chapters the years jump; a **"Meanwhile…"** card tells what happened in the world and shows the historical projects finished in those years (built by the owner, as they were in reality; the player's choices of options and financing for them come in the next chapter's first mission). A player far behind in money gets an owner's loan to start the next chapter (so no campaign gets stuck), at the cost of the 🏅 for that chapter.

Mission names and years are a first plan; each is checked against history and balanced by `tools/missions-check.js`.

| # | Era | Missions (the exam last) | New things |
|---|---|---|---|
| 1 | **The Forest Field** (1959–1962) · 5–7 min | Clear the Forest · First Wheels (a training flight, its stand picked by hand) · The Tower · The First Terminal · The Fuel Truck · Opening Day, 1 April 1962 · First Snow · The First Jets (an SAS Caravelle) · Money Month · Night Lights · *Exam: The First Winter* | Map, runway, taxiway, stand, small terminal, tower; manual stands and turnaround; check-in; snow by hand; money basics; noise over Märsta |
| 2 | **The Jet Age** (1963–1979) | Longer for the Jets · Charter Summer (Transair, Sterling to Mallorca) · Hire a Hand · Two Managers · Jumbo! (the 747) · Fire Category · The Wage Round · The Bag Belt · Fog Morning · Crosswind (runway 2) · *Exam: The International Terminal* | People level, managers in pairs, airline choices, upkeep, loans, fire category, the first union round; Free Play opens after it |
| 3 | **Everyone Comes to Arlanda** (1980s) | Linjeflyg Moves In (domestic flights from Bromma) · Morning Peak · Flygbussarna · The Computer Room · Screens · Flu Season · Strike Notice · Planner or Computer? · The Big Freeze · Payback · *Exam: Domestic Rush* | Domestic terminal, peaks, buses and roads, sickness, first systems and their failures, the Ops Center; Challenge Days open after it |
| 4 | **Open Skies** (1990s) | Terminal 2 · Deregulation (new domestic airlines) · The Low-Fare Question · The Train Question (Arlanda Express: own or concession) · Building the Tunnel · Bags by Machine · Duty Free · Route Incentive · Hub Wars (Copenhagen) · Christmas Rush · *Exam: Millennium Night (Y2K)* | Competition, route incentives, rail, the baggage system, payback and NPV |
| 5 | **A New Millennium** (2000–2009) | Schengen (split the terminal, 2001) · The New Tower · Security After 2001 · Liquids in Bags (2006) · Norwegian Arrives · Runway Three · Taxiway Bridges · Pier F and Arlanda North · Sky City · Remote De-icing · *Exam: The Snowy Peak* | Border domain, security rules, parallel runways and bridges, Sky City and real estate, integrated systems |
| 6 | **Bigger and Greener** (2010–2019) | Swedavia (a new owner, new targets) · The Ash Cloud · A Royal Wedding · The Giant (the Emirates A380, Code F) · A-CDM · The Permit · Glycol and the Aquifer · e-Gates · Nobel Week · Eurovision Week · *Exam: Record Summer 2019* | Green rating, permit, biofuel, glycol, aquifer, e-gates, self bag drop, the Gulf airlines, event peaks; *flygskam* in the last news |
| 7 | **Storm Years** (2020–2024) | Empty Skies · Mothball · Furlough or Lay Off · Cargo Saves the Day · Closed Skies (2022) · Coming Back · Clearance Takes Weeks · The Summer of Queues · One Terminal (T4 joins T5) · Cyber Morning · *Exam: The Day the Screens Went Blue (July 2024)* | Mothballing, furlough vs lay-off, security clearance delays, cyber, fallback readiness tested |
| 8 | **Arlanda 2040** (the player's future) | Electric Wings · Charging Stands · Robots on the Apron · Self-driving Ploughs · Hydrogen Morning · Your Pier (the player's answer to the dropped Pier G) · Faces as Boarding Passes · Heatwave 2040 · Night Train or Night Flight · Peak Day 2040 · *Final Exam: Blackout* | Charging stands, self-driving vehicles, the player's own pier design, the final test: the busiest day ever, then a total blackout — the airport must survive on people and hand skills |

The final exam is the game's message: the most automated airport still needs people who know how to do it by hand.

### Mission kinds

- **Build** (plan time) — finish the master plan's project (or its stage) by a date within a budget: the player chooses the order of the stages, the pace, the financing and the options; the building itself is the historical one.
- **Operate** (ops time) — run a period with targets (on-time share, queues, no safety events).
- **Business** (plan time) — reach a profit, win an airline, keep the owner's target.
- **Crisis** (ops time) — survive an event (a storm, a strike, an outage, the ash cloud).
- **Choice** — a mission built around offers in pairs; both paths can win, with different stars.
- **Exam** — the chapter's last mission: everything of the chapter in three stages.

### Stars

- ★ the mission's goal (always passes the mission).
- ★★ and ★★★ two of: profit ≥ X, on-time share ≥ X, Passengers ≥ X, Neighbours ≥ X, no strike, no safety event, manual tasks ≤ N (an automation mission) or **systems ≤ N** (a "do it by hand" mission), the story's extra.
- 🏅 **Real Arlanda**: beat the real airport's number for that year (passengers, punctuality, a record day), shown with its source.

Stars are kept per difficulty; the next mission opens when one is passed on any difficulty.

## Hints and help

- **Astrid Holm**, a retired air traffic controller who was there in 1959 (fictional), is the mentor: two or three speech bubbles per mission, one **concept card** for each new idea (what a stand code is, why fast security earns money, what payback means, what A-CDM is), kept in the Archive.
- **Kaj**, a cheeky jackdaw (the birds are the airport's enemies — this one changed sides), gives the **live hints**: short lines next to the thing they are about, triggered by situations, never more than one per `HINT_GAP` seconds: "The security queue is 20 minutes. Open a lane — or will someone do it for you?", "Three tasks missed in a row. Maybe it's time to hire a stand planner?", "Snow is coming tonight. Are the ploughs fuelled?", "This car park pays back fast, but the neighbours won't love it." Each hint is shown at most `HINT_REPEAT` times; Settings: **Full / Short / Off**.
- **Mission hints** like `lift-logic`: 💡 1 the idea; 💡 2 (after a failed stage or 5 minutes) the buildings and screens to look at light up; 💡 3 (after two failed tries, asks first) the reference plan's main moves — the mission then gives at most ★★ until ★★★ is earned without it.
- **Guided start:** the first three missions show a finger on what to tap, gone as soon as it is done.
- **Debrief** (`sim/debrief.js`, after each stage and mission): up to three notes from patterns with **Show me** (replays the stage to that moment): the longest queue and its cause, a flight delayed by the airport and the step that made it late, a domain whose tray overflowed, a system whose running cost is above what it saves at today's traffic, an airline close to leaving, a manager about to be poached. On Easy the note says what would help.
- **Payback everywhere:** every buildable and every system shows "pays back in …" from the airport's own numbers; a red line when it never will at today's traffic.

## How long it lasts

- Chapter 1: 11 missions × about 6 min, plus a minute in the Office each (≈ 1.5 h with retries).
- Chapters 2–8: 77 missions × about 9 min of play + about 3 min in the Office, × about 1.2 for retried stages (≈ 18.5 h).

A first pass is therefore **≈ 20 hours** with ★ or ★★ on most missions; at about four missions a day within a 40-minute limit, the campaign lasts a few weeks. ★★★, the 🏅, Challenge Days and Free Play go well beyond. `tools/missions-check.js` measures each mission's minutes at ▶ and keeps every mission within `MISSION_MINUTES_MAX` (10) and every stage within 4.

## Free Play and Challenge Days

- **Free Play** (opens after chapter 2): any era as a start (the forest, 1983, 2003, today), any difficulty, the campaign's unlocked tech; an endless calendar with rolling goals and the Offers board; saved like the campaign; the Album and the Archive keep filling. A **Today's Arlanda** start gives the real airport of the latest chapter to run.
- **Challenge Days** (open after chapter 3): longer fixed scenarios (20–60 min) with a score and three stars — a whole record day, Christmas week, the ash cloud week, the blackout — saved at any moment.

## Difficulty

| | Easy | Medium | Hard |
|---|---|---|---|
| Starting money and loan limit | × 1.5 | × 1 | × 0.75 |
| Schedule randomness (early / late flights) | low | medium | high |
| Airlines' patience | × 1.5 | × 1 | × 0.7 |
| Absence, strikes, system failures | × 0.6 | × 1 | × 1.4 |
| Weather events | milder, fewer | normal | harsher, more |
| Task deadlines | × 1.5 | × 1 | × 0.75 |
| Hints 2 / 3 | after 1 / 2 failed tries | 2 / 3 | 3 / 4 |
| Debrief | says what helps | the cause | the moment only |
| Months in debt before replacement | 6 | 4 | 3 |

Picked on the start screen, the mission card, the pause menu and the results (pre-selected); remembered as `arlandaRising.difficulty`. A campaign keeps one difficulty; replays may use any.

## Controls

- **Touch** (like `city-builder`, a map app, no joystick): one finger taps to select, build or open a card, drags an aircraft from the tray or the map to a stand, drags a line for taxiways, roads and fences, pans otherwise; two fingers pan and pinch-zoom; a long press on anything shows its card. Big buildings show a ghost with ✔ / ✖ first. Start / Continue request fullscreen on coarse-pointer devices.
- **Desktop:** click and drag like touch; right or middle drag and the arrow keys pan, the wheel zooms at the pointer. Keys by their place (work on a Russian layout): **Space** pause / play, **1–4** speeds, **N** skip to next event, **T** terminal view, **O** Ops Center, **F** finance, **P** people, **A** airlines, **Q** the oldest task, **Esc** back / pause. Menus: arrows move the focus, Space / Enter press the focused (or default) button.
- Mouse cursor hidden in fullscreen while still; updates and offline: see "Offline and install".

## Saved in the browser

`arlandaRising.campaign.v1` (the airport, calendar, people, airlines, money), `arlandaRising.mission.v1` (the running mission's full state and its stage checkpoints — written every `AUTOSAVE_SECONDS`, at each stage's end and on `visibilitychange` / `pagehide`; cleared when the mission ends), `arlandaRising.snapshots.v1` (each mission's starting state, compressed), `arlandaRising.progress.v1` (stars per mission per difficulty, hint 3 used, 🏅, Archive cards, Album), `arlandaRising.freeplay.v1`, `arlandaRising.challenges.v1`, `arlandaRising.settings.v1` (hints, quality, sums in full or short), `arlandaRising.difficulty`, `arlandaRising.sound`, `arlandaRising.lang`; for the cloud save `arlandaRising.cloud` (the Google account the progress syncs with) and `arlandaRising.auth` (its session, kept by supabase-js). Every key starts with `arlandaRising.`; the game never clears anything else on the origin.

## Cloud save (sync through Google)

Optional, on top of `localStorage`, built like `lift-logic`'s (start from `lift-logic/core/cloud.js` and follow `docs/cloud-save.md` in full — its rules, recipe and typical mistakes): signed in with Google, the campaign and the progress are kept in the cloud, so the child plays on the phone and goes on at the computer — or the other way — with the same airport, stars, Album and Archive. Without signing in nothing changes and no network call is made; the game plays fully without the cloud.

- **Where it lives.** The Supabase project shared with `world-aviation`, `lift-logic`, `swedish` and `tanks`: its URL and publishable key in `core/cloud.js` (`CLOUD_URL`, `CLOUD_KEY`), not secrets — the table's row-level security guards the rows. `supabase/schema.sql` (safe to run again) makes `arlandarising_saves (user_id → auth.users, data jsonb, updated_at)`, one row per account, with policies prefixed `arlandarising:` letting a signed-in user read, insert, update and delete only their own row. The page's address goes into the project's Auth → URL Configuration → Redirect URLs (`https://gray0072.github.io/ivan/arlanda-rising/`, and `http://localhost:…/arlanda-rising/` for testing).
- **The library.** `lib/supabase.min.js`, the same vendored supabase-js file as `lift-logic`'s (UMD, global `supabase`); the **PKCE** sign-in; the session under `arlandaRising.auth` (never the library's default key, shared by the whole origin). From `file://` or without the library the game has no cloud and shows none of it.
- **What travels** (`Save.snapshot`): `arlandaRising.progress.v1`, `campaign.v1`, `mission.v1` (the running mission, so a stage started on the phone goes on at the computer), `freeplay.v1`, `challenges.v1`; the mission snapshots for replays (`snapshots.v1`) go in the same row but only at idle moments, as they are big. The settings, the difficulty, the sound and the language stay this device's.
- **Sync** (`Cloud.syncNow`): read the account's copy, merge it into the save here, write the result back — never a write without a read and a merge first. It runs on the sign-in, at start, on every return to the foreground or to the network (`online`), 10 s after the last change (`CLOUD_PUSH_MS`: a stage or a mission finished, a decision in the Office) and at once when the page goes to the background (`keepalive`, so it outlives a phone that locks or a time limit that closes the app; the body kept under 64 KB, compressed, `CLOUD_KEEPALIVE_MAX`). A failed sync is tried again every 30 s while the page is in view (`CLOUD_RETRY_MS`), on the next change and on every return. Reads with `.retry(false)`. Every request ends by a timeout (`CLOUD_REQUEST_MS` 10 s, a whole sync `CLOUD_SYNC_MS` 25 s).
- **Never under the player.** A merge runs only at idle moments — the start screen, the timeline, the Office, a stage card — never in a running stage. While a stage runs, an upload is **deferred**: it reads the copy's `updated_at` again and uploads only if it is still the one this device last read or wrote (nobody changed it meanwhile); otherwise it waits for the stage's end to merge first. The merge never schedules another upload by itself (`Cloud.quietly`).
- **The merge** (`Save.merge`): what only grows is kept from both — the stars per mission and difficulty (the larger), the 🏅, the Archive and concept cards, the Album, the newspapers, hint 3 used, the Challenge Days' bests, what is open. What is a current state comes from the copy saved last (`savedAt`): the campaign (the airport, the money — never the larger balance — the people, the airlines, the calendar), Free Play and the running mission; the start screen then says where it came from (**Continue mission — saved on another device at 18:42**). What this version does not know (a newer version's field or part of the copy) is kept as it came and sent back. Merging the same copy again changes nothing; the local save is never replaced, only merged.
- **A new campaign is explicit:** **New Campaign** (after its confirm) gives the campaign a new `campaignId` and writes it as an explicit overwrite of the cloud's campaign, so another device's old campaign is never merged back in; stars, 🏅, the Album and the Archive stay.
- **On screen:** the start screen's account row: **Sign in with Google** with a line on what it is for; signed in, the status dot (green synced, blue syncing, amber failed or signed out), the account's e-mail and **Sign out** (which merges and sends the last changes first, and keeps everything on this device).
- **Cloud states** (`Cloud.status`, as in `lift-logic`): `unavailable` (no row) · `off` (**Sign in with Google**) · `syncing` · `synced` · `loadFailed` (signed in, the copy not read in this session: **Couldn't load your cloud progress** with **Try again** and **Play with the progress on this device**) · `local` (the player chose to play on: **Playing with the progress on this device — it syncs once the network is back**, not asked again this session) · `error` (**Sync failed — it tries again later**) · `signedOut` (sign in again). Under the row a note for a sign-in that could not start offline (**No network — sign in once you are online.**: Google's page is not opened) or did not finish. Never a dialog in the middle of a mission. A session that cannot be refreshed offline is kept: the player stays signed in and the sync runs on `TOKEN_REFRESHED`.
- Every text translated; the READMEs tell the player in all three languages. Tested without a real account with `tools/cloud-mock.js` (offline, error, hang, ok), as `docs/cloud-save.md` describes, including a mission running on two devices and a field from a newer version.

## Offline and install

Like every app in the repo (follow `docs/pwa.md` in full):

- **Installable:** `manifest.webmanifest` with `id` `/ivan/arlanda-rising/`, `start_url` / `scope` `./`, `display` `fullscreen`, `short_name` **Arlanda** (≤ 12 characters), theme and background colours of the page, the icons `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` rendered from `icon.svg` / `icon-maskable.svg` by `tools/pwa-icons.sh`; the `<head>` links with `?v=N`. Installed from the browser ("Add to Home screen" / "Install app"), it starts full screen from its own icon, like a native game; the READMEs say how, in all three languages.
- **Offline:** `sw.js` generated by `node tools/sw-build.js` (never edited by hand; run after every change to the app's files) keeps every file in Cache Storage (`/ivan/arlanda-rising/offline.<version>`): once opened online — or once the gallery has been opened, which installs every game's worker — the game starts and plays the whole campaign with no network. Nothing in the game needs the network except the cloud save, which simply waits for it.
- **Updates:** `core/update.js` (`AppUpdate.watch`) picks up a new deploy and reloads only at an idle moment — the start screen, the timeline, the Office — never in a running mission, a stage card or a dialog; a running mission is saved anyway, so even a forced reload loses nothing.

## Languages

English (source), Russian and Swedish, as in `world-aviation` and `lift-logic`: every text through `tr()`, tables in `data/lang-ru.js` / `data/lang-sv.js`, `node tools/i18n-check.js arlanda-rising` before committing. Place names, company and brand names and aircraft types are the same in every language. Signs in the terminal stay bilingual Swedish / English in every language.

## Sound

Synthesized with Web Audio, through one master gain (Sound On / Off on the start screen and in pause, `arlandaRising.sound`): jet and turboprop sounds by distance and zoom, the reverse thrust, the PA chime before an announcement, the hum of the terminal growing with the crowd, baggage belts, the snowplough convoy's rumble and beacons' tick, the bird-scare bang, the fire alarm, coins for income at the end of a stage, a rising chord when a system goes live, a sad trombone when it breaks, the newspaper's press. No recorded jingles of real brands.

## Cheats (keyboard only, Shift + key, for testing)

Each shows a banner and marks the run as cheated (no stars, no 🏅, no records): `Shift+1…8` jump to that chapter's first mission with the real Arlanda of that year; `Shift+M` +100 MSEK; `Shift+S` a snowstorm now; `Shift+K` a strike notice; `Shift+F` a system failure; `Shift+A` every domain one level up; `Shift+W` win the current stage; `Shift+D` skip to the end of the stage.

## Testing and balancing

- `sim/` is deterministic from a seed and has no DOM: a whole mission runs in Node; a mission saved and resumed at any second gives the same result as one run straight through (a test for the autosave).
- `tools/missions-check.js` runs every mission with its **reference strategy** (a scripted list of decisions in `data/strategies/`) at every difficulty and reports the stars, the money curve, the meters and the minutes at ▶; it fails when the reference misses ★★★ on Easy or Medium, when doing nothing passes, when the previous chapter's strategy gets ★★★, when a "Real Arlanda" 🏅 is unreachable, or when a mission is longer than `MISSION_MINUTES_MAX`.
- Browser checks with `tools/cdp.js` (see `docs/testing.md`), short and one at a time; one check locks the page mid-stage (`visibilitychange`) and reloads it to see the mission continue.

## Files (planned)

```
arlanda-rising/
├── SPEC.md
├── index.html, styles.css, constants.js, game.js (thin main loop)
├── data/        aircraft.js, airlines.js (real airlines: years at Arlanda, liveries and emblems by era, tempers, sources),
│                brands.js (ground transport, shops, hotels, authorities, advertisers by era, with sources), buildings.js,
│                masterplan.js (the historical projects: year, plot, footprint, look, stages, options, sources; the free plots),
│                domains.js (the automation ladder), people.js (departments, manager candidates), missions.js (chapters,
│                missions, stages, stars, events), events.js, archive.js (facts with sources), album.js, hints.js,
│                strategies/ (reference strategies), lang-ru.js, lang-sv.js, icons.js
├── core/        i18n, utils (seeded random, money()), events (bus), audio, input, storage (incl. the mission autosave), save (snapshot and
│                merge for the cloud), cloud (Google sign-in and sync, from lift-logic), cursor, icons, update (new deploys at idle moments)
├── lib/         supabase.min.js (vendored supabase-js, the same file as lift-logic's)
├── supabase/    schema.sql (the arlandarising_saves table and its row-level security)
├── sim/         state, calendar, weather, schedule, runways, taxi, stands, turnaround, passengers, terminal, baggage, snow, deicing,
│                wildlife, domains (levels, failures, readiness), people, unions, airlines, offers, finance, meters, permit,
│                missions (stages, checkpoints), summary (the skipped time), debrief
├── art/         emblems.js (airline fin art and logos, from world-aviation), brands.js (brand signs and vehicle titles), flags
├── render/      palette, iso, sprites (buildings, aircraft with liveries, vehicles, people, trees), map, terminal, sky (sun, seasons,
│                white nights), effects
├── ui/          screens, timeline, office, missioncard, hud, tray, toolbar, cards, opscenter, people, airlines, offers,
│                finance (charts), stagecard, results, newspaper, archive, album, hints, sounds
├── tools/       missions-check.js
├── README.md, README_RU.md, README_SV.md (with the not-affiliated note, how to install, the cloud save)
├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png (tools/pwa-icons.sh)
├── manifest.webmanifest, sw.js (generated by tools/sw-build.js), screenshot.png
```

## Build order (sessions)

1. **Core sim headless:** calendar, weather, schedule, runways, stands, turnaround, passengers as flows, finance, stages and the autosave/resume; chapter 1 missions with reference strategies; `missions-check.js`.
2. **Map and look:** isometric renderer with the Arlanda palette, seasons and light, aircraft with real liveries and emblems, vehicles, build tools, the task tray, the Office; chapter 1 playable end to end on a phone; **installable and offline** (manifest, icons, `update.js`, `sw.js`); gallery card, root `SPEC.md` and READMEs.
3. **People and the ladder:** departments, managers in pairs, absence, unions and strikes, the Ops Center, systems and failures; chapters 2–3, Free Play; **the cloud save through Google** (the table, the sync, the states, tested with `tools/cloud-mock.js`).
4. **Terminal view, brands and the economy screens:** passenger flow, real shops and ground transport, finance with payback and NPV, offers, airlines' tempers; chapter 4, Challenge Days.
5. Chapters 5–6: border, security, parallel runways, real estate, green rating and the permit, events.
6. Chapters 7–8: crises, fallback readiness, the future tech, the final exam.
7. Translations, icons, READMEs, screenshot (from session 2 on, kept up to date with every later one).

## Decisions

Settled:

- **Name:** Arlanda Rising, folder `arlanda-rising`.
- **Real airlines with emblems and real brands** (Swedavia, LFV, Arlanda Express, Flygbussarna, SL, SJ, taxis, shops, hotels), drawn as simplified pictures, shown respectfully; people fictional; the not-affiliated note in the READMEs.
- **Isometric** Canvas 2D graphics.
- **Missions at most ~10 minutes**, in stages, autosaved every few seconds and resumed exactly; the campaign **at least 20 hours**; longer play through Next mission, Keep the shift going, Challenge Days and Free Play.

- **One airport through the campaign, growing by the historical master plan:** the architecture, the sites and the look of the big structures follow the historical checkpoints; the player has freedom within each mission's frame (order, pace, financing, options, the insides, free plots) and full freedom in small things (adverts and banners, which airlines to court, shops); the 2040 chapter loosens the frame; Free Play has none.

- **Every sum in Swedish kronor (SEK)**: "SEK" or "kronor / крон / kr" by the language.
- **Sync through Google** like the other games (optional, `docs/cloud-save.md`), the running mission included, so play goes on from the phone to the computer; **installable and fully offline** like every app in the repo (`docs/pwa.md`).
- **The youngest player is 10 and reads well:** mission cards, concept cards and hints are written in full, plain sentences (no baby talk, no walls of text: a briefing at most three bubbles, a concept card at most about 60 words); every number the goals need is shown on the main screens; the deeper finance (NPV, the cash-flow what-ifs) sits behind *Details*, closed by default, its state remembered.
- **Many real shops and cafés** the family knows (Joe & The Juice, Hawaiian Poké, Sushi Yama and the rest of the catalogue), chosen freely by the player for the terminal's units.
