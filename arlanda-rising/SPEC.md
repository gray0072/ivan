# Arlanda Rising — SPEC

Developer/agent spec for the `arlanda-rising` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

> **Status: sessions 1–6 of the build order done — all eight chapters (1958–2040, 88 missions) are playable end to end in a browser, on a phone and a desktop, in English, Russian and Swedish; installable and offline; Free Play; three Challenge Days; the cloud save through Google; in the gallery.** In code: the simulation (`sim/`) and its data (`data/`), the isometric map (`render/`), the screens (`ui/`), the flow and the autosave (`game.js`, `progress.js`), the cloud save (`core/save.js`, `core/cloud.js`, `supabase/schema.sql`), the translations, the icons, the manifest and the offline worker, and `tools/missions-check.js` (see "Testing and balancing"); what session 2 built is summed up in "The game in the browser (session 2)", what session 3 built in "People, systems, chapters 2–3, Free Play and the cloud (session 3)", what session 4 built in "The terminals, brands, the economy screens, chapter 4 and Challenge Days (session 4)", what session 5 built in "The border, two runways, de-icing, real estate, events, the green rating, chapters 5–6 (session 5)", what session 6 built in "The storm years and the future, chapters 7–8 (session 6)". Not yet: the terminal's desks, seating and arrivals in the Terminal view, adverts, contracts with promises and penalties, the hints 💡 1–3 and the Debrief, the Archive and the Album, Keep the shift going, wildlife as a domain of its own (birds and moose come only as random events), the arrivals' passport control. Settled with the user: the name *Arlanda Rising* (folder `arlanda-rising`); **real airlines with their emblems and real brands** (Swedavia, Arlanda Express, Flygbussarna and the like); **isometric** graphics; **short missions** (at most about 10 minutes, split into stages, never lost when interrupted) for a child with a 40-minute phone limit; **at least 20 hours** of campaign; **one airport through the whole campaign that grows by the historical master plan** — freedom within each mission's frame, full freedom only in small things (adverts, banners, which airlines to court), the architecture and the look of the buildings follow the historical checkpoints (see "The master plan"). The settled decisions are listed at the end ("Decisions").

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
- **Runways** (real, final state): **runway 1 = 01L/19R, 3 300 m** (the long one); **runway 3 = 01R/19L, 2 500 m**, parallel, opened 2003, away from the terminals and reached over **taxiway bridges**, with its own remote **de-icing area** near it; **runway 2 = 08/26, 2 500 m**, the crosswind runway. Runways 1 and 3 can be used independently. High-speed exits on all but 08/26. *Exact positions, the taxiway system and the terminal area's place between them are taken from the official aerodrome chart (Swedish AIP, ESSA AD 2) before the map is drawn — not guessed.* In code (`data/layout.js`): the three runways' real ends from OurAirports' `runways.csv` (the AIP's data): runway 1 from 59.637298° N 17.913200° E (01L) to 59.666401° N 17.923800° E (19R), 3 301 × 45 m, true heading 10°; runway 3 about 2 km east of it, runway 2 to the north-east. The map's origin is the 01L threshold, x east and y north in metres. The first apron, its stands, the first terminal and tower, the 1960s taxiways and the road are the game's drawing in the right place (east of runway 1, where the terminals still are), marked to be checked against a chart of the era; so are Halmsjön's outline and place.
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

### The rules as the sim has them (session 1)

What `sim/` does today, with its numbers in `constants.js`; later sessions add to it.

- **Steps.** Ops time runs in fixed steps of `OPS_STEP_MIN` (¼ game minute), plan time one day at a time (`sim/sim.js`), whatever the frame rate. The order of an ops step: scripted events, runways and snow, flights, the check-in queue, the tray, the running costs, the meters. A decision in plan time stops the clock until it is taken.
- **Flights** (`sim/schedule.js`, `sim/flights.js`) come from the stage's script as series (an airline's type, how many, between which times, the planned time on the ground); arrivals are early or late by the difficulty (`DIFFICULTY.jitter`). The "pick a stand" task appears `STAND_TASK_LEAD` minutes before landing. An arrival holds while the runway is closed and is sent elsewhere after `HOLD_MAX`; a departure waiting for a usable runway is cancelled after `DEP_WAIT_MAX`. Arrivals go before departures; one movement per `RWY_SEP` minutes with a tower, `RWY_SEP_NO_TOWER` without.
- **Turnaround** (`sim/turnaround.js`): passengers off, then the airline's own cleaning, catering and bags (the type's `svc`) beside the fuel, then boarding — not before `BOARD_LEAD` minutes ahead of departure and only once the flight's passengers are through check-in (or `BOARD_WAIT_MAX` after departure without the late ones). Snow on the apron makes every step slower. Fuel is the oil company's until a mission puts it in the player's hands; then a fuel truck must be sent and one truck serves one aircraft at a time.
- **Delay and the airport's part.** A departure is on time up to `ONTIME_MIN` late. The airport's part of a delay is how much later it left than it could have with everything on time here — counted from its real arrival time, so a late inbound is not the airport's fault but waiting for a stand on the taxiway is. Penalties to the airlines and their mood follow the airport's part only; goals use either (`onTime`, `avgDelay`, `airportDelay`).
- **Check-in** (`sim/passengers.js`): each departure's passengers come between `PAX_ARRIVE_FIRST` and `PAX_ARRIVE_LAST` minutes before it and join one first-come queue served by the open desks; those who came before the stage began are through already. A queue of `CHECKIN_TASK_WAIT` minutes makes the "open a desk" task. The time left before boarding sets the café's takings.
- **Snow** (`sim/runways.js`): the snowfall's millimetres build up on the runway and the apron. A runway's braking action is medium from 1 mm, poor from `SNOW_POOR_MM` (a landing then risks a close call), and it closes at `SNOW_CLOSE_MM`; the task appears at `SNOW_TASK_MM`. The plough convoy clears one runway at a time (slower with fewer than `PLOUGH_CONVOY` ploughs, the runway closed while it works); the apron has its own small team beside it. Heavy snowfall also hides the runway like fog (`FOG_VIS_MIN`, `FOG_VIS_APPROACH` with approach lights).
- **The dark and the noise.** The sun follows 59.65° N and the date; a runway without lights takes no movement in civil darkness. When the wind is under `CALM_WIND` the player picks the direction: landing on 01 comes in over Märsta, taking off on 19 climbs out over it; night movements count `NOISE_NIGHT_X` times.
- **The tray's other hands** (`sim/tasks.js`): a task not done by its deadline, or one that finds the tray full, goes to the duty manager, who does it `DUTY_LATE` minutes later and picks the right stand only `MANUAL_SUMMARY_EFF` of the time (a wrong one costs `WRONG_STAND_DELAY`). A kind of task the mission does not put in the player's hands is done at once by someone else; a domain handed to people does its tasks after its level's delay (`data/domains.js`).
- **Meters** (`sim/meters.js`) move as moving averages of each departure's result (`METER_EMA`): the waits, the delay, walking from a remote stand, missed passengers; noise pulls the Neighbours toward their base minus the noise; Safety drops at a close call and recovers slowly to the airport's base.
- **Plan time** (`sim/plan.js`, `sim/construction.js`): a stage of a project starts when the stages before it are done and a crew is free; it is paid day by day as it progresses (a fast pace: `PACE`), at half speed in December–February unless a mod says otherwise. An optional stage has its own effect. A stage with `endEarly` ends once its goal is met and no work is still going on. The open airport's traffic runs in summary (`sim/summary.js`): flights a day from the airlines' routes, fees, shops and parking, less `SUMMARY_LOSS` for every domain still done by hand.
- **Between missions** the calendar jumps in summary; the owner builds the historical projects a mission `requires` (free), and a campaign that comes in below zero gets the owner's loan for the gap, so it never gets stuck.

## The game in the browser (session 2)

What `render/`, `ui/`, `game.js` and `progress.js` do today; the screens of "Screens" not listed here come with the later sessions.

- **The map** (`render/`): isometric 2:1, north to the upper right, the viewer in the south-east; one world in metres (`data/layout.js`), drawn live every frame with no cached layer but the forest's texture. The forest is a texture from afar and single pines, spruces and birches from `ZOOM_TREES` on (bare birches in winter and April); fields, lakes (ice in winter), granite, Märsta's red and white houses and its church, the E4. The site project shows as it goes: the runway strip cleared from the south, the bog drying, the apron plot cleared from the west, the road in as gravel. Runway 1 with its markings, designators, snow (swept behind the convoy), cables being laid, edge, threshold and approach lights; the parallel taxiway and its links; the apron with its stands (lit green or red while a stand is picked, red when closed) and the remote stands bought later, each paved on its own (`LAYOUT.remote`) with a paved way straight to the apron's edge along the line the aircraft taxi. No tree stands on what is built: the strip, the road and the link from the taxiway to the apron keep a corridor wide enough for the trees in front not to stand over them, and a remote stand, its way and every building with a plot in `data/layout.js` (the car parks east of the road in, by the bus stop; the café…) clear the forest round them (`render/map.js` `clearings`). The trees are drawn whole, the crown's tip included. Buildings rise by their stages: the terminal's slab and walls, the waiting room, the kiosk; the tower's foundations, shaft, cab and antenna; cranes over the stages being built. Aircraft are drawn to scale from `data/aircraft.js` with the shape of each type (`AIRCRAFT_SHAPE`: sweep, jet pods or propellers, rear engines), a layered fuselage that shows the cheatline, the fin with the airline's emblem (`art/emblems.js`, the livery of the year from `data/airlines.js`; made smaller where the fin is narrower than the letters), a shadow that fades as they climb, and their lights. `render/traffic.js` turns the sim's times into motion, drawn at the sim's clock plus the part of the next step already run (`Sim.clockNow`), so the aircraft and the vehicles move every frame and not once a step: the approach (a holding circle when the runway is not free), the flare and the rollout, the taxi to the stand (on runway 1 the arrivals come onto the apron by the middle link and the departures leave by their own link at its north end, `LAYOUT.taxi.apronOut`, along a lane `outLane` m west of the arrivals' — one way in, one way out, never head-on), the turnaround (stairs, passengers walking, catering, baggage carts, the fuel truck from its depot and back, the tug), the pushback, the taxi out, the take-off roll and the climb; the plough convoy in echelon; trucks and ploughs at their depots. Over each aircraft its flight number and, at a stand, a little Gantt bar (off · services · fuel · boarding). The light follows `Calendar.sunElevation`: dawn and dusk tint, the dark, fog, falling snow, then the lamps glowing through the dark (sodium floodlights, lit windows, the tower's cab, beacons).
- **Five small additions to the sim for the map** (none changes a result): a flight keeps `rdir` (the runway direction it used), `airborne` (when it rolled) and `divertedAt`; a surface keeps `ploughFrom`; a turnaround keeps `fuelFrom`.
- **Play**: the HUD (money, the date and clock, the weather, the five meters, ⏸ ▶ ▶▶ ▶▶▶, Skip, pause), the stage's goals live (in the plan panel in plan time), the task tray (a ring for each deadline; a tap does the obvious, **Pick** or a drag chooses the stand on the map), the toolbar (desks open, ploughs, the runway direction when calm, the small builds with a second tap to confirm), the plan panel (each project's stages with Start / Fast, progress and what they wait for, its options, cash / loan / the owner's grant, the fee level, loans), the decision card (the option's effects worked out from its data: money, days, a crew, the meters), the flight card. Panels below the HUD start under its real height (`--hudH`), so a phone in portrait works too; there the money shows short and without its currency (`1.2 M`, `45 k`, `1,2 млн`) in a chip of one width, so the first row does not jump as the sum changes. Every stage starts at ▶, whatever speed the stage before ran at (⏸ and back within a stage keeps the speed). Under the money the mission's result so far (`Missions.result()`: its income less its costs, green or red), so the player sees whether the airport earns or spends; under the date a line of how far the stage has gone (the clock between its start and end, or its days); the goals' box of an ops stage says the stage's end and the time left ("Until 10:00: 1 h 45 min left"), and a goal of the whole mission (1-8's profit) is shown live under the stage's goals and in the plan panel (`Text.missionGoals`, from `Missions.liveTotal()`). The toolbar of plan time shows the shops' places taken of SHOP_MAX (a kiosk ½, a café 1, a restaurant 0.6, a duty-free shop 1.2, those being built included) and the car parks' share of the drivers, each shop and car park button with how many there are (×2); once the room is full the button says so and `Airport.buy` refuses one more (it would earn nothing).
- **Help**: Kaj's live hints (`ui/hints.js`, at most one per `HINT_GAP`, each `HINT_REPEAT` times; Settings: Full / Short / Off) and the guiding finger in `GUIDED_MISSIONS` until the player has acted twice. The mission hints 💡 1–3, the concept cards and the Debrief come later.
- **The flow** (`game.js`): start screen (over the airport of 1962, or the campaign's own) → timeline → mission card → the card before each stage (the first one with "Meanwhile…": the months skipped, the flights in summary, the money, the owner's loan) → play → the stage card (Continue, or Retry stage / Restart mission) → the results (stars, the goals with their values, the meters, the work done by hand and by others, a line from Astrid or Kaj; after the exam the front page of *Arlanda-Bladet*, a fictional local paper) → the Office (the campaign's money and loans — borrow or repay there —, the last six months' books, what the airport has, the meters) → the next mission. The "Meanwhile…" report sits on the first stage's card rather than in the Office, as the skipped time is simulated when the mission starts.
- **The campaign and the stars** (`progress.js`): `Progress` keeps the best stars per mission and difficulty (a cheated run saves none); `Campaign` keeps the airport after the last mission passed in it, its difficulty (the mission card's choice becomes it) and the next mission; the world a campaign mission started from is kept in `arlandaRising.snapshots.v1` (plain JSON for now, a few kB a mission in chapter 1) for replays, which never touch the campaign. A mission opened with no snapshot (after a new campaign) starts from the forest with the owner building what it requires.
- **The autosave**: `{ run, data: Missions.save() }` under `arlandaRising.mission.v1`, every `AUTOSAVE_SECONDS` of play, at every stage's end, in the pause menu and on `visibilitychange` / `pagehide`; **Continue mission** resumes it paused at that very moment with a line on the aim, or on the stage card when it was saved there.
- **Keys and cheats** as in "Controls" and "Cheats" (in session 2 Shift+2…8 said the chapter was not in the game yet; session 3 opened chapters 2 and 3, the strike and the failure).
- **Texts**: every text through `tr()`; the tables `data/lang-ru.js` and `data/lang-sv.js` hold the screens' texts and the data's (mission names, briefings, aims, stages, news, decisions, projects, buildings), Astrid's and Kaj's lines and the help. A mission's data gained `aim` (its one line, which used to clash with the goal list `goal`), `news` and, for each decision, `icon`, `title`, `text` and each option's `label`.

## People, systems, chapters 2–3, Free Play and the cloud (session 3)

What session 3 added; its numbers are in `constants.js` (the people, the systems, the airfield), the data in `data/domains.js`, `data/people.js`, `data/masterplan.js`, `data/missions/ch2.js` and `ch3.js`.

- **The ladder** (`data/domains.js`, `sim/tasks.js`, `sim/systems.js`): six domains — stands, turnaround (fuel), check-in, snow, baggage (bags) and information (announcements); each level has its staff, price, monthly cost, delay and share of good choices, a system (level 2) also its IT jobs, mean time between failures, fix time and days to install. A domain is part of the game once a mission opens it (`setup.opens`), so chapter 1's worlds are untouched. A task goes to the level that works now: a system (`by: 'system'`), a team (its skill and its manager change its delay and choices; when it is short or on strike, the task falls to the player's tray — `st.short`), or the player's hands. A system that fails hands its work to the team kept beside it (worse with a low readiness: delay × (2 − readiness)) or, laid off, to the tray. The Office may buy a level once a mission has unlocked it (`S.unlock`, `setup.unlock`); systems need the computer room (the belts the baggage hall).
- **Systems** (`sim/systems.js`): random failures in ops time at the system's MTBF × the IT factor (too few IT people: more often, longer), scripted ones (`events: fail`), a power cut (every system without a backup generator); the readiness falls READINESS_DECAY a month without a drill (DRILL_COST); in summary a system loses its share of SUMMARY_LOSS by its downtime and fallback. Buying: `keep` (retrain the team, RETRAIN_COST a job; its wages go on; morale up) or `layoff` (every team's morale −LAYOFF_MORALE, the unions' mood down, Neighbours −3, no fallback).
- **People** (`sim/people.js`): a department per domain with a team (and IT): morale (drifts to MORALE_BASE + the manager + a wage deal's fading bonus − fatigue), fatigue (overtime; halves every month), skill (SKILL_START, +SKILL_MONTH, a course +TRAIN_SKILL; check-in desks work at 0.8 + 0.4 × skill, ×CHECKIN_SYSTEM_X with the computers), absence (ABSENCE_BASE × the flu season FLU × morale and fatigue × the difficulty, + SUMMER_AWAY in July unless spread, − the temps); a team's capacity is 1 − (absence − ABSENCE_SLACK) × SHORT_K, STRIKE_CAPACITY on strike, 1 with overtime (OVERTIME_STAGE of a day's wages × OVERTIME_X, +OVERTIME_FATIGUE). Hiring takes HIRE_DAYS in plan time (CLEARANCE_DAYS where a department needs a clearance — none before chapter 5), at once between missions. The Staff meter is the departments' morale weighted by their jobs.
- **Unions**: a mission's wage round is a decision (`kind: 'union'`): accept (WAGE_DEMAND), a counter-offer the union takes when 0.15 + 0.6 × offer / demand + (mood − 50) / 100 + the manager's `strike` perk ≥ 0.6 (deterministic, its likely outcome shown), the mediator (¾ of the demand), refuse — a strike notice, the strike STRIKE_NOTICE_DAYS later for STRIKE_DAYS, ending with the demand met. A deal calls a notice off. A round that falls due between missions is settled at WAGE_DRIFT (no inflation in the game).
- **Managers** (`data/people.js`): ten fictional people for five departments, each with a salary, two strengths and a flaw as numbers the sim reads (`perk`); candidates in pairs (a decision, the People screen, Free Play's offers); their mood, a raise asked every MANAGER_RAISE_MONTHS (answered in People, or "not now" at the next mission), poaching (MANAGER_POACH a month under 40) and retiring (MANAGER_YEARS).
- **The airfield**: the fire category (FIRE_CAT_BASE + a crash tender each, up to FIRE_CAT_MAX; an arrival needing more is sent elsewhere unless it has a `waiver`), emergencies (`events: emergency`: the next arrival lands first, the runway closed EMERGENCY_CLOSE, longer and a close call with too low a category), runway 2 (08/26, the AIP's ends; used when runway 1 cannot take movements: a crosswind over CROSSWIND_MAX, snow, a convoy), the instrument landing system (FOG_VIS_ILS, LVP_SEP_X), bags (BAG_CART_MIN; boarding waits; a wrong cart loses LOST_BAG_SHARE), announcements (a flight ANNOUNCE_LEAD minutes late must be told within ANNOUNCE_OK, or ANNOUNCE_MOOD off the Passengers).
- **New goals**: level, manager, noStrike, lostBags, unannounced, fireCat, systems, handsOff, handTasks, lastMonth (the last month's result without one-off sums: the payback of an investment).
- **Free Play** (`sim/freeplay.js`): opens with 2-11; three eras (1963 always, 1976 after 2-11, 1990 after 3-11), each built by the owner; then rounds made from the airport (a seed and the round's number): a plan stage of FREE_PLAN_DAYS with two offers of different groups (an airline's slots, a shop or a car park, a manager pair, a team or a system, a wage round, a crash tender) and an ops peak flown from the airlines' routes, its goal FREE_GOAL_ONTIME on time; no stars. Kept in `arlandaRising.freeplay.v1`; a round being played is in the mission autosave (its definition in `S.mission.def`). Between rounds the Office works on Free Play's airport.
- **Screens**: the People screen and the Ops Center (from the Office, keys P and O, at once; during play to look only, the game paused), the plan panel's Teams and systems, the toolbar's short teams with Overtime and the systems down, the decision card with the managers' lines and the union's mood, "Meanwhile…" with the people's news, the stage card with who is away or on strike, the results with the teams' and systems' work, the exams' front pages (`paper`), Kaj's new hints, the flight card's bags and emergency, the Free Play screen and its results.
- **The map**: runway 2 with its taxiway, the jet apron, the domestic apron, the international terminal (hall and pier), the domestic terminal, the baggage hall, the computer room, the generator, a restaurant, duty free, crash tenders, the airport coaches, the localizer; stands placed by their project (`at`); aircraft on runway 2 land, roll out and taxi by its own way; the DC-9, 727, 747, DC-10, F28 and MD-81 drawn to scale.
- **Cheats**: Shift+2 and Shift+3 the chapter's first mission (with the owner's arrangement of its year), Shift+K a strike of the first team, Shift+F a failure of the first system.

### Chapter 2 as built (`data/missions/ch2.js`)

Checked and told: the 1957 plan's two runways (runway 2 of 2.5 km; its building year was not found, so the briefing does not give one), SAS's first 747 (1971), the international terminal of 1976 (today Terminal 5), Transair Sweden (1950–1981) and Sterling Airways (1962–1993). The game's own story: the jet apron, the charter slots, the people and the deals; runway 2's ends are the AIP's.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 2-1 | Room for the Jets (1965) | plan 75 days, ops 07–10 | pave the jet apron; haul the earth or a noise bank | airport delay ≤ 2 · spent ≤ 75 MSEK |
| 2-2 | Charter Summer (1967) | plan 80 days, ops 06–09 | Transair, Sterling, both or none; two more desks | profit ≥ 4.5 MSEK · check-in wait ≤ 6 |
| 2-3 | Hire a Hand (1968) | plan 25 days, ops 07–10 | the first teams take whole kinds of tasks | airport delay ≤ 2 · teams do ≥ 30 tasks |
| 2-4 | Two Managers (1969) | plan 20 days, ops 07–10 | an operations head and a snow chief with a team, in pairs | an operations head · on time ≥ 90 % |
| 2-5 | Jumbo! (1971) | plan 50 days, ops 10–13 | the E stand for the 747 (a one-off fire waiver) | check-in wait ≤ 9 · Airlines ≥ 72 |
| 2-6 | Fire Category (1971) | plan 40 days, ops 08–11 | two crash tenders for category 9; an emergency | Safety ≥ 82 · on time ≥ 85 % |
| 2-7 | The Wage Round (1972) | plan 30 days, ops 07–10 | accept, counter, the mediator or a strike on the day | no strike · Staff ≥ 62 |
| 2-8 | The Bag Belt (1973) | ops, plan 60 days, ops | bags by hand, then handlers and belts; a jam | ≤ 6 bags lost · Passengers ≥ 70 |
| 2-9 | Fog Morning (1974) | plan 40 days, ops 06–09 | the instrument landing system | nothing sent away · on time ≥ 70 % |
| 2-10 | Crosswind (1975) | plan 160 days, ops 07–10 | runway 2 with the owner's grant; a westerly gale | on time ≥ 85 % · Neighbours ≥ 66 |
| 2-11 | Exam: The International Terminal (1976) | plan 100 days, ops 07–10, 16–19 | the terminal, then a day with an emergency, a jam and a gale | airport delay ≤ 2 · Passengers ≥ 72 |

### Chapter 3 as built (`data/missions/ch3.js`)

Checked and told: the Riksdag's decision of 17 December 1980 to move the jets from Bromma, the domestic terminal (today Terminal 4) opened on 1 October 1983 and Linjeflyg's move that month, Linjeflyg's F28s, SL's airport coaches under the name Flygbussarna from 1989. Reordered by the checked dates: Flygbussarna is the 10th mission. The MD-81's and the DC-10's years at Arlanda are marked to check in `data/aircraft.js`.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 3-1 | Linjeflyg Moves In (1983) | plan 110 days, ops 06:30–09:30 | the domestic terminal and its apron; Linjeflyg's terms | airport delay ≤ 2 · Airlines ≥ 75 |
| 3-2 | Morning Peak (1984) | plan 20 days, ops 06–09, 09–12 | a head of terminal service; desks open before the peak | check-in wait ≤ 3 · on time ≥ 90 % |
| 3-3 | The Computer Room (1984) | plan 50 days, ops 07–10 | an IT department, the room, the stand computer (keep or lay off); it fails | airport delay ≤ 2 · Passengers ≥ 78 |
| 3-4 | Screens (1985) | ops, plan 40 days, ops | announcements by hand, then a PA operator and screens | ≤ 1 not announced · Passengers ≥ 74 |
| 3-5 | Flu Season (1986) | plan 14 days, ops 06:30–09:30 | temps and overtime against the absence | ≤ 3 tasks by hand · on time ≥ 85 % |
| 3-6 | Strike Notice (1986) | plan 7 days, ops 07–10 | pay, the mediator or ride out the strike | no strike · airport delay ≤ 3 |
| 3-7 | The Big Freeze (1987) | plan 20 days, ops 06–09, 12–15 | the weather-based clearing plan; it fails in the cold | no close call · on time ≥ 85 % |
| 3-8 | Planner or Computer? (1987) | plan 30 days, ops 06–09, 16–19 | check-in computers, or a course and four desks | check-in wait ≤ 2 · on time ≥ 90 % |
| 3-9 | Payback (1988) | plan 3 × 70 days | duty free, a car park, restaurants: what the last month earns | last month ≥ 20 MSEK · Airlines ≥ 70 |
| 3-10 | Flygbussarna (1989) | plan 40 days, ops 16–19 | coach stops (Neighbours) or another car park | Passengers ≥ 92 · on time ≥ 90 % |
| 3-11 | Exam: Domestic Rush (1989) | ops 06–08:30, 11–13:30, 15–17:30 | snow and the flu, a power cut, a failing computer and an emergency | airport delay ≤ 2 · Passengers ≥ 74 |

`tools/missions-check.js` measures them at ▶: chapter 2 3.9–8.2 minutes, chapter 3 3.6–9.7; the reference strategies are in `data/strategies/ch2.js` and `ch3.js`. The choice missions (2-2, 2-4, 2-7, 3-6, 3-8, 3-10) were also played with their other options: each passes, with other stars.

### The cloud save as built

As "Cloud save" below, with these specifics: the snapshot is `{ v, progress, campaign, mission, freeplay, challenges }` in the `data` column, the replays' snapshots in a `snaps` column sent only at idle moments and while the page is in view; idle moments are the start screen, the timeline, the Office and the Free Play screen (not the stage card: the running mission is in memory there); a mission that ended leaves a `{ cleared, savedAt }` mark so another device's older copy of it is not merged back; a campaign mission's autosave carries its campaign's id (`run.cid`) and is dropped when another campaign wins; the body is not compressed — a keepalive upload goes when it is under CLOUD_KEEPALIVE_MAX characters, else as an ordinary request. Tested with `tools/cloud-mock.js`: a merge (stars from both, the newer campaign, a newer version's field kept and sent back, the same copy merged again changes nothing), offline (`loadFailed` with the choice), a hanging request (the timeout), and a copy changed by another device while a stage runs (the upload waits; at the start screen it merges and goes up).

## The terminals, brands, the economy screens, chapter 4 and Challenge Days (session 4)

What session 4 added; its numbers are in `constants.js` (the terminal's flow, brands and ground transport; airlines, incentives, rivals and offers; Challenge Days), the data in `data/terminals.js`, `data/brands.js`, `data/airlines.js`, `data/masterplan.js`, `data/missions/ch4.js` and `data/challenges.js`. Nothing of it runs before a chapter 4 mission turns it on (`setup.openSkies`, `units`, `lanes`, `rivals`), so chapters 1–3 play exactly as before (`tools/missions-check.js` gives the same numbers).

- **The terminals' insides** (`sim/terminal.js`): a departure goes through a terminal by its airline (`S.airlines[code].term`, Terminal 2 for SAS domestic from 1990) or by domestic / international. Each terminal has **shop units** of three sizes (kiosk, unit, big; `data/terminals.js`) and the kerb has desks; `setup.units` makes them for every terminal standing (the first terminal has none once the international and domestic ones stand). A **brand** (`data/brands.js`: 34 real chains, each from its checked first year in Sweden, with its rent, its spend per passenger, whom it draws — everybody, business, holiday, families in FAMILY_MONTHS, international only — and the Passengers points it gives) opens in a unit that fits it for the fit-out (UNIT_FIT), pays its rent every month (the line `rent`) and its share of what each departing passenger of that terminal spends at full free time airside (× SHOP_SPEND; a second brand of a kind shares with the first, BRAND_SAME_KIND). A brand is never in one terminal twice.
- **Security** (from chapter 4, `S.airport.lanes`): after check-in the passengers queue for the lanes (LANE_RATE each, every lane open, LANE_COST_HOUR in ops time, LANE_MONTH in summary); the free time for the shops is counted when they come through, so a long queue costs shop money, and boarding waits for them like for check-in. A lane is a small build (`lane`); an ops event `lanesShut` closes some for the stage. The Passengers meter counts both waits.
- **Ground transport:** the coaches (as before), the car parks, and **Arlanda Express** (`arlandaExpress`: the tunnel, the line, Arlanda South and North; the deal `own` — the airport builds it, the owner's grant pays half, TRAIN_TICKET per train passenger — or `concession` — a partner builds it with its own money (`finance: 'partner'`), TRAIN_STATION_FEE). It runs from TRAIN_FIRST_DAY (24 November 1999) whenever it was built: TRAIN_SHARE of the departing passengers, TRAIN_PARKING of the car parks' takings gone, TRAIN_PAX on the Passengers meter, TRAIN_NEIGHBOURS on the Neighbours' base.
- **Airlines** (`sim/airlines.js`): each airline's fees, on-time share and mood; a **route incentive** (a share of its fees off for INCENTIVE_MONTHS, INCENTIVE_MOOD × the share on its mood); **courting** an airline that is not here (`court` in `data/airlines.js`: the route it starts and the share it `need`s — it says no to less); from chapter 4 the routes won are the player's own (`own`, kept when a mission sets the historical routes again), an airline after its last year at Arlanda flies no more (Linjeflyg after 1993, Transwede after 1998), and with **rivals** on (`setup.rivals`: Copenhagen's new terminal in Hub Wars) the home and network airlines lose RIVAL_PULL a month (not below RIVAL_FLOOR, not while their incentive runs, RIVAL_LATER of it once the news is old), and an airline under LEAVE_MOOD may move a daily flight to its rival (`rival`: Copenhagen, Oslo, Helsinki, Bromma, Skavsta) — never because of the real company, only because the game's airport served it badly.
- **The Offers board** (`sim/offers.js`): what may be offered now, by group (Free Play's offers moved here), plus a brand that wants a unit and an airline that would start a route for an incentive; Free Play's rounds draw two, and from chapter 4 the Office shows a board of two between missions (`S.board`, made from the seed and the day), taken at once.
- **Payback and NPV** (`sim/invest.js`): from the last TRAFFIC_DAYS days of traffic in summary (`S.traffic`), each car park, shop, brand, lane, system and the train gets what it earns and costs a month, its payback in months (none when it never pays back at today's traffic) and its net present value over NPV_YEARS at NPV_RATE; the same as a what-if before buying (the decisions' effects show "pays back in …").
- **Baggage level 3**: the bar-code sorting system in the sorting hall (`sorterHall`); when it fails, the belts take over (a level 3 system falls to level 2).
- **New goals**: securityWait, brands, brandsIn, mood (an airline's), perDay (an airline's flights a day), carriers, train, score (a Challenge Day). New option fields: brand, court, incentive, term, train; new setup fields: openSkies, units, lanes, rivals, terms, brands, trainDeal; a mission's `partners`; an ops event's `unless` (a flag that prevents it).
- **Challenge Days** (`data/challenges.js`, `sim/challenges.js`): Christmas Week, 1989 and The Great Snow, 1987 (open after 3-11), Record Day, 1999 (after 4-11): six peaks of about 3.6 minutes each (about 22 minutes at ▶), from the owner's arrangement of the year; a score — CHALLENGE_POINTS per departure on time and late, × the Passengers meter at the end, less for flights lost, close calls, delays not announced, bags lost, minutes of airport-caused delay and of waiting — and three stars at fixed scores. Run like a mission from its own definition (in the state, so the autosave resumes it); the best score and stars per difficulty in `arlandaRising.challenges.v1`, merged with the cloud by keeping the larger.
- **Free Play** gains the era *Open skies, 2000* (after 4-11), with the units, lanes, the train and a weak rival.
- **Screens** (`ui/terminalview.js` with `render/terminal.js` and `art/brands.js`, `ui/finance.js`, `ui/airlines.js`, `ui/challenges.js`): the **Terminal view** (T; a tab per terminal and the kerb; live in an ops stage — the stage runs on behind it — and a brand picker with each brand's rent, earnings, payback and whom it draws in the Office and in plan time); **Finance** (F, or the money in the HUD: the books by line this month and last, the money month by month with each month's result, the investments with their payback, under Details the net present value and the what-ifs, its state remembered as `finDetails`); **Airlines** (A: the Offers board, each airline's card — emblem, kind, mood, flights, fees a month, on-time share, incentive, terminal, temper in words, rival — and the incentive buttons); the **Challenge Days** screen and their results (the score and its parts); the Office's buttons for all of them; the toolbar's security queue and lanes; Kaj's hints on security, empty units and unhappy airlines; "Meanwhile…" tells of flights moved to a rival and incentives that ended.
- **The map**: Terminal 2 and its apron, the sorting hall, Arlanda Express (the line and its tunnel as they are built, the station entrances, the yellow train from 24 November 1999), the 1990s types drawn to scale (Boeing 737-300, 767-300ER, 757, MD-87, Fokker 100 and 50, BAe 146, A320).

### Chapter 4 as built (`data/missions/ch4.js`)

Checked and told: Inrikes 2 (today Terminal 2) opened in 1990 for SAS's domestic flights; domestic flying deregulated on 1 July 1992 and Transwede's first domestic route (Stockholm–Visby, 22 July 1992); Linjeflyg merged into SAS on 1 January 1993; the Arlanda Express consortium picked in August 1994, building from 1995, the first train on 24 November 1999, Arlanda South and North; Sweden in the EU from 1 January 1995, tax-free between EU countries until 1 July 1999; Braathens' Oslo–Stockholm from 6 November 1996; Ryanair's first Stockholm route, Skavsta–Stansted, in June 1997; Copenhagen's Terminal 3 and its station in 1998; Premiair (from 1994) and Novair (flying from November 1997); Y2K at Arlanda (nothing happened; two aircraft checked the landing aids at about two o'clock); 17.1 million passengers in 1999 (SIKA, Luftfart 1999). The game's own story: the brands in the units, the 1990s sorting hall (the first documented tilt-tray sorter came in 2002), Ryanair at Arlanda (a what-if: it flew to Skavsta), the deals and the flights of each day; not found and so not told: a 1990s move of SAS's long-haul to Copenhagen.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 4-1 | Terminal 2 (1990) | plan 120 days, ops 06:30–09:30 | build Terminal 2; brands in the units; who moves in | brands earn ≥ 60 kSEK · check-in wait ≤ 4 |
| 4-2 | Deregulation (1992) | plan 30 days, ops 06:30–09:30 | Transwede for a quarter off; the fee level | on time ≥ 90 % · Airlines ≥ 80 |
| 4-3 | The Train Question (1994) | plan 2 × 60 days | own line or concession; a car park before the train? | last month ≥ 20 MSEK · Neighbours ≥ 72 |
| 4-4 | Duty Free (1995) | ops 15–18, plan 60 days, ops 15–18 | two lanes closed; lanes, duty free, brands | security wait ≤ 8 · brands earn ≥ 3 MSEK |
| 4-5 | Building the Tunnel (1995) | plan 110 + 55 days | the tunnel, the line, the stations; a car park closed | Passengers ≥ 76 · Neighbours ≥ 72 |
| 4-6 | Route Incentive (1996) | plan 40 days, ops 07–10 | Braathens' Oslo route: a tenth, a quarter, half off | Braathens' mood ≥ 77 · on time ≥ 90 % |
| 4-7 | Bags by Machine (1997) | ops 07–10, plan 70 days, ops 07–10 | the sorting hall and the bar-code system; it fails | ≤ 30 bags lost · Passengers ≥ 90 |
| 4-8 | The Low-Fare Question (1997) | plan 30 days, ops 16–19 | invite a low-fare airline, or keep the fees for all | brands earn ≥ 50 kSEK · Airlines ≥ 72 |
| 4-9 | Hub Wars (1998) | ops 06:30–09:30, plan 150 days | a transfer wave; Copenhagen pulls; a deal for SAS | Airlines ≥ 80 · airport delay ≤ 3.5 |
| 4-10 | Christmas Rush (1998) | plan 18 days, ops 06–09, 15–18 | charters to the sun, snow, a toy shop or burgers | Passengers ≥ 88 · brands earn ≥ 80 kSEK |
| 4-11 | Exam: Millennium Night (1999) | plan 20 days, ops 13–16, 22–01 | test every system for the year 2000 or trust the suppliers | airport delay ≤ 3 · Passengers ≥ 85 |

`tools/missions-check.js` measures them at ▶: 2.1–9.1 minutes; the reference strategies are in `data/strategies/ch4.js` (with the Challenge Days'). The choice missions were also played with their other options (4-1 Linjeflyg in Terminal 2, 4-3 and 4-5 the own line, 4-8 no low-fare deal): each passes, with other stars.

## The border, two runways, de-icing, real estate, events, the green rating, chapters 5–6 (session 5)

What session 5 added; its numbers are in `constants.js` (the border, the security rules, runway 3, de-icing, Sky City; A-CDM, self bag drop, energy, biofuel, the green rating, the permit, events), the data in `data/domains.js`, `data/people.js`, `data/buildings.js`, `data/masterplan.js`, `data/layout.js`, `data/terminals.js`, `data/airlines.js`, `data/aircraft.js`, `data/events.js`, `data/missions/ch5.js` and `ch6.js`. Nothing of it runs before a chapter 5 mission turns it on (`schengen`, `opens`, `secRule`, `events`, `green`, `permit`, the new projects), so chapters 1–4 play exactly as before (`tools/missions-check.js` gives the same numbers).

- **The border** (`sim/terminal.js`, `sim/passengers.js`, domain `border`): from Schengen (`S.airport.schengen`, the project `schengen` with its passport hall and booths) a departure outside the Schengen area (`ns` on a flight series, or the airline's own `ns`: British Airways, Emirates, Qatar, SAS's long-haul) queues a third time after security, at the passport booths (BOOTH_RATE each, `S.airport.booths`, `S.ops.boothsOpen`; the airport pays BOOTH_MONTH a booth for the space, Polisen the officers). A queue of BORDER_TASK_WAIT makes the "open a booth" task; level 1 is the police's shift planner (no wages for the airport; the police's absence is not the airport's), level 2 the e-gates (×EGATE_X). The Passengers meter counts the wait (`borderWait`).
- **Security as a domain** (domain `security`, from chapter 5): the lanes are opened and closed (`S.ops.lanesOpen`, a stage's `lanes`; only the open ones cost LANE_COST_HOUR); a queue of SEC_TASK_WAIT makes the "open a lane" task; level 1 a shift planner (its new staff need the security clearance, CLEARANCE_DAYS, as do ground handling, baggage and de-icing from 2002), level 2 queue sensors (the task at SEC_SENSOR_WAIT), level 3 CT scanners (from 2018). The rules of the day slow every lane (`secRule`: SEC_RULE_X — 1 after 2001, 2 with the liquids of 6 November 2006; CT_X undoes the liquids). A head of security in a pair (Leila Nordin, Göran Falk).
- **Runway 3 and the bridges** (`runway3`, `bridges`): runway 3 (01R/19L, SkyVector's ends) becomes the runway `r3` when its taxiway bridges are built; then the arrivals use runway 1 and the departures runway 3, each taking the other's traffic when its own cannot (`Runways.forArr` / `forDep`; without runway 3 both are `inUse`), with R3_TAXI more minutes of taxiing; its noise falls on Upplands Väsby. The new tower of 2001 (`tower2`) shortens the separation to RWY_SEP_NEW.
- **De-icing** (domain `deice`): at or below DEICE_TEMP every departure needs de-icing once boarding has begun — a truck (`deicer`, DEICE_MIN, by hand or by the crew; the fluid GLYCOL_COST, the line `deicing`) before pushback; from level 2 the remote pads (`deicePads`) do it on the way out (DEICE_PAD_MIN more taxiing, no truck), level 3 glycol recovery buys GLYCOL_RECOVER less. In summary a winter's departures pay their fluid.
- **Pier F** (`pierF`): four stands for big jets, by the terminal only once its optional jet bridges are built (they turn its stands to contact stands). **The A380 gate** (`gateF`, 2018): a Code F stand with over-the-wing boarding.
- **Real estate**: what pays rent every month (`BUILDINGS.rent`, the line `estate`): Sky City (owner-built for chapter 5, 1993) and its hotel, Cargo City and its offices, office buildings and a hotel wing on the free plots. **Sky City** is also a terminal of six units whose brands earn SKY_SPEND of their spend from every departing passenger, landside, whatever the time left.
- **Events** (`sim/events.js`, `data/events.js`): scripted ones a stage may have (`storm`, `wildlife`, `secPause`, `vipStand`, `update`, `ash`) and, once a mission turns them on (`events`), at most one random one per ops stage (EVENT_CHANCE × the difficulty's weather, after EVENT_GAP; not in a `calm` stage): a thunderstorm, a moose or geese, a lost child at security, a state visit's stand, a medical emergency, a bad software update. Their lines come up as banners; a random event never blames a real company. **The ash cloud** (`ash`) closes every runway for the rest of the stage (what cannot leave is cancelled, without a penalty), and a plan stage's `skyClosed` keeps the traffic in summary at zero. A series' `stay` aircraft (the wedding guests', the Nobel guests') keep their stands and leave another day.
- **Integrated systems** (level 3): A-CDM for the stands (from 2009: the taxi out × ACDM_TAXI_X), kiosks and self bag drop for check-in (× SBD_X a desk), CT scanners, glycol recovery.
- **The green rating and the permit** (`sim/green.js`, from chapter 6, setup `green`): energy every month (ENERGY_MONTH, ×1.5 in the cold months; the aquifer and the solar park take ENERGY_SAVE off), biofuel paid for a share of the fuel (BIOFUEL_MONTH × the share), a green rating 0–100 (GREEN_BASE + GREEN_PTS: the train, the coaches, the aquifer, up to two solar parks, glycol recovery, biofuel, electric apron vehicles, less each big car park), shown in the HUD (🌿) and the Office. The permit (`permit`: { perDay, green, from }) caps the departures a day and asks for a green rating; each month it is broken costs PERMIT_FINE and PERMIT_NEIGHBOURS. The owner becomes Swedavia (`owner`) on 1 April 2010.
- **New goals**: borderWait, estate, green, permitOk, runways, owner; the `flag` goals are named on screen (`FLAG_NAMES` in `ui/text.js`). New option fields: booths, lanes, biofuel, stranded, permit; new setup fields: schengen, booths, secRule, events, owner, green, permit; new stage fields: lanes, booths, calm, skyClosed; new series fields: ns, stay.
- **Screens**: the toolbar's lanes and booths (− / +), de-icing trucks, booths, offices, a hotel wing, a solar park and electric vehicles; the HUD's green rating with the permit; the Office's card of the rents, the green rating, the energy, the biofuel and the permit; Finance's new lines and what-ifs; the Terminal view's passport control and the Sky City tab; the flight card's de-icing; Kaj's hints on the border, closed lanes, frost, two runways, the permit and a low green rating; banners for scripted and random events.
- **The map**: runway 3 and its taxiway over the two bridges (built as they progress), the new tower, Pier F with its jet bridges and the A380 gate, Sky City and its hotel, Cargo City, offices, the de-icing pads, the aquifer's pump house, the solar parks; aircraft land on runway 1 and take off from runway 3 by their own paths; a de-icing truck at the wing; the 2000s' and 2010s' types to scale (737-600 and -800, A319, A321, CRJ900, ATR 72, A330, A340, 777-300ER, 787-9, A380, Gulfstream G550) and the new liveries (Norwegian's red nose and tail hero, Emirates' flag on the fin, Qatar, British Airways, the guests' business jets).
- **Free Play** gains the era *A new millennium, 2009* (after 5-11). **Cheats**: Shift+5 and Shift+6 open their chapters; Shift+E the next random event now.
- `tools/debug-mission.js <id> [difficulty] [--idle] [--flights]` plays the campaign to a mission and prints each stage's flights, events and goals — the balancing's magnifying glass.

### Chapter 5 as built (`data/missions/ch5.js`)

Checked and told: Schengen from 25 March 2001 (Council Decision 2000/777/EC) and how Arlanda was split (Terminal 2 international only, a fourth level in Terminal 5); Sky City of 1993; the new tower by Wingårdh, built July 1999–May 2001, in service 23 December 2001, 83 m (90 with its mast); 18.1 and 16.4 million passengers in 2001 and 2002; Swedavia's history for Pier F in January 2002 (other sources say 2003: marked); runway 3 begun on 10 November 1998, 2 500 m, first used on 17 April 2003 after the downturn; the taxiway bridges to runway 3; Regulation (EC) 2320/2002 (in force January 2003, every hold bag screened from 31 December 2002); Norwegian's first Arlanda flight on 1 September 2003; the de-icing areas by runway 3 and the southern apron draining to the glycol collection; Cargo City of 2006; the liquids rule of 6 November 2006 (Regulation 1546/2006); "Arlanda has not closed for snow since 1962"; 18.1 and 16.1 million passengers in 2008 and 2009. The game's own story: the flights of each day, the bridges' crossings and building in early 2003, the pads' year (2004), the security strike of the exam, the deals and the people; the runway's cost was not found.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 5-1 | Schengen (2001) | plan 70 days, ops 16–19 | a new floor and the passport booths before 25 March (heated tents); who opens the booths | border wait ≤ 3 · Passengers ≥ 85 |
| 5-2 | The New Tower (2001) | plan 90 days, ops 07–10 | fit out the tower by 23 December (a fast pace); lower fees after 11 September | airport delay ≤ 2.5 · Airlines ≥ 75 |
| 5-3 | Pier F (2002) | plan 50 days, ops 10–13 | the pier's gates in the winter, its jet bridges; a long-haul wave | Airlines ≥ 80 · Passengers ≥ 86 |
| 5-4 | Runway Three (2002) | plan 115 days | finish runway 3 before the winter (the owner's grant, which stage to hurry), Upplands Väsby | spent ≤ 1 350 MSEK · Neighbours ≥ 75 |
| 5-5 | Security After 2001 (2002) | ops 06:30–09:30, plan 45 days, ops | the lanes by hand under the new rules, a team hired before its clearance runs out | security wait ≤ 4 · Passengers ≥ 85 |
| 5-6 | Taxiway Bridges (2003) | plan 72 days, ops 07–10 | two bridges in the cold, then the first morning on two runways | on time ≥ 90 % · airport delay ≤ 4 |
| 5-7 | Norwegian Arrives (2003) | plan 30 days, ops 06:30–09:30 | 30 % or half off for Norwegian; random events from now on | brands earn ≥ 13.6 MSEK · Airlines ≥ 92 |
| 5-8 | Remote De-icing (2004) | ops, plan 72 days, ops | trucks by hand in the frost, then a crew and the pads | airport delay ≤ 4 · Passengers ≥ 85 |
| 5-9 | Rent Is Steady (2006) | plan 2 × 90 days | Cargo City, its offices, a hotel wing, a shop in Sky City | rents ≥ 6 MSEK a month · last month ≥ 44 MSEK |
| 5-10 | Liquids in Bags (2006) | ops, plan 40 days, ops | the first morning of the liquids rule, then queue sensors and lanes for Christmas | security wait ≤ 5 · brands earn ≥ 150 kSEK |
| 5-11 | Exam: The Snowy Peak (2009) | ops 06–08:15, 11–13:15, 16–18:15 | snow on two runways, de-icing, the border, a security strike with the sensors down, a power cut | airport delay ≤ 3 · Passengers ≥ 82 |

### Chapter 6 as built (`data/missions/ch6.js`)

Checked and told: Swedavia from 1 April 2010; the aquifer in use since the summer of 2009 (about 600 000 m³, about 19 GWh a year); Airport Carbon Accreditation from 2009; the ash cloud — the airspace closed at 20:00 UTC on 15 April 2010, Arlanda open to the north and west on the 19th, closed again on the 20th, reopening from the 21st; the royal wedding of 19 June 2010, guests from the 17th; Sweden's first self bag drop at Arlanda on 10 October 2012 (SAS and Norwegian first); Emirates from 5 September 2013 with a 777, Qatar Airways from 27 November 2007; the permit of 27 November 2013 (350 000 movements, the CO2 cap of 1991 — removed by the appeal court in November 2014, so later missions keep only the movements' cap); the Nobel Prizes on 10 December; Eurovision 2016 in Stockholm (10, 12 and 14 May); Swedavia's 450 tonnes of biofuel and the first fuelling on 5 January 2017, the Fly Green Fund of 2014; A-CDM in full on 8 June 2017; the A380 gate at Pier F in January 2018 (the first A380 at Arlanda was Lufthansa's visit in 2010; no scheduled A380 is known); 26.8 million passengers in 2018, the record; flygskam among the new words of 2018. Reordered by the checked dates: The Giant became Emirates (no A380 flew there on a schedule), e-Gates went into the exam (their year was not found), Glycol and the Aquifer became Fly Green (the aquifer is the owner's from 2009), the exam is the record year 2018 (2019 fell by 4 %). The game's own story: the guests' aircraft and the stands, the stranded passengers' choices, the business jets' lounge, the fans, the deals and the flights of each day.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 6-1 | Swedavia (2010) | plan 12 days, ops 07–10 | the new owner's colours and target; the green rating and the energy bill | Staff ≥ 67 · Passengers ≥ 92 |
| 6-2 | The Ash Cloud (2010) | ops 18:30–21:30, plan 5 days, ops 07–10 | get the last flights out before the sky closes; the stranded; the reopening | the stranded looked after · check-in wait ≤ 3 |
| 6-3 | A Royal Wedding (2010) | plan 25 days, ops 12–15 | where the guests' aircraft stand for days | airport delay ≤ 3 · Passengers ≥ 88 |
| 6-4 | Self Bag Drop (2012) | ops 06–09, plan 40 days, ops 06–09 | the full hall, the bag drop, the desk staff kept or not | check-in wait ≤ 2.5 · Staff ≥ 60 |
| 6-5 | Emirates (2013) | plan 40 days, ops 13–16 | a tenth, a quarter or 40 % off for the 777 | Emirates' mood ≥ 78 · border wait ≤ 3 |
| 6-6 | The Permit (2013) | plan 2 × 70 days | the permit's caps; a solar park and electric vehicles, no car park, no extra flights | green ≥ 68 · last month ≥ 35 MSEK |
| 6-7 | Nobel Week (2015) | plan 14 days, ops 13–16 | a lounge and booths, or stands for the business jets; frost and snow | airport delay ≤ 3 · border wait ≤ 3 |
| 6-8 | Eurovision Week (2016) | plan 14 days, ops 14–17 | four more lanes or a LEGO pop-up for the fans | security wait ≤ 3.5 · brands earn ≥ 150 kSEK |
| 6-9 | Fly Green (2017) | plan 2 × 60 days | biofuel, glycol recovery, a second solar park | green ≥ 86 · last month ≥ 55 MSEK |
| 6-10 | A-CDM (2017) | ops 06:30–09:30, plan 60 days, ops | the queue at the runway, then A-CDM with more IT people | airport delay ≤ 3 · on time ≥ 90 % |
| 6-11 | Exam: Record Summer (2018) | plan 50 days, ops 06–08:45, 15–17:45 | the A380 gate, e-gates, more lanes; the record morning and evening | airport delay ≤ 3 · Passengers ≥ 85 |

`tools/missions-check.js` measures them at ▶: chapter 5 1.9–9.8 minutes, chapter 6 2.1–8.1; the reference strategies are in `data/strategies/ch5.js` and `ch6.js`. Doing nothing fails every mission (in the most automated ones the goal is a decision only the player takes: who sets the owner's target, whether the stranded are looked after, where the guests' and the business jets' aircraft stand).

## The storm years and the future, chapters 7–8 (session 6)

What session 6 added; its numbers are in `constants.js` (the last section: demand, mothballing, furlough and lay-offs, freight, charging, hydrogen, robots, heat, cyber, the blackout), the data in `data/aircraft.js`, `data/airlines.js`, `data/buildings.js`, `data/domains.js`, `data/masterplan.js`, `data/layout.js`, `data/events.js`, `data/missions/ch7.js` and `ch8.js`. Nothing of it runs before a chapter 7 mission turns it on (`demand`, `mothball`, `cut`, `leavers`, `cyber`, the new kinds, types and projects), so chapters 1–6 play exactly as before (`tools/missions-check.js` gives the same numbers).

- **Demand** (`S.airport.demand`, setup, a stage's or an option's `demand`): the share of the normal passenger traffic in summary (not below DEMAND_MIN); the freighters fly on. `Summary.demand()`.
- **Mothballing** (`sim/terminal.js`): Terminal 2 or the domestic terminal (Terminal 4) mothballed (`S.airport.mothballed[term]`: true, or the day it opens again) keeps 1 − MOTHBALL_SAVE of its building's jobs and upkeep, takes MOTHBALL_ENERGY off the energy bill each, pays no rent from its brands, and its flights go through Terminal 5; reopening costs REOPEN_COST and takes REOPEN_DAYS in plan time. **Rent relief** (`relief`): RENT_RELIEF of the brands' rent off for a year, or every second brand closes. The Office has a card of the terminals (Mothball / Open again).
- **Furlough, lay-offs, the people who left** (`sim/people.js`): `staff: { how: 'furlough', share, months }` — that share of every department at home, paid FURLOUGH_PAY of its wage; `how: 'layoff'` — the share's jobs gone (`dept.cut`) after LAYOFF_PAY_MONTHS of wages (the line `layoffs`), morale and the unions down. Setup `leavers` (once a campaign): the furloughed departments lose LEAVERS_2022 of their jobs to other work, the others half of it; setup `cut` makes a department short at the start. A department with jobs gone does 1 − cut × CUT_K of its work itself (the rest comes to the tray), and the buildings' own staff shrink with the average cut and furlough. **Rehiring** (`rehire`, People's Recruit, `Actions.rehire`) costs HIRE_COST a job and takes HIRE_DAYS, or CLEARANCE_DAYS where the job needs a security clearance (the summer of 2022); a second company's cleared people fill a share at once (`cutFill`). A security lane needs its screeners: `Terminal.lanesUp()` × (1 − the security team's cut and furlough).
- **Freight**: freighters (`AIRCRAFT.cargo`: tonnes, no seats; a series' `cargo` flies a passenger aircraft with freight only) pay CARGO_TONNES_FEE a tonne (the line `cargo`) at pushback and in summary; **cargo stands** (`cargoStand`, by Cargo City, with their own pad) are taken first by freighters and last by the others; the cargo airlines DHL and UPS.
- **Closed skies**: the event `ban` (`al`) cancels every flight of the airline not yet gone, not as the airport's fault (`st.banned`), and ends its routes; Aeroflot's years end in 2022.
- **Outages** (`sim/systems.js`): a *deep* failure takes a level 3 system down past its level 2 to the team kept beside it (or the tray); the events `outage` (every system, the faulty update of 19 July 2024), `blackout` (every system, even with backup power; the stands' chargers dark, the lanes at BLACKOUT_LANE_X) and `cyber` (CYBER_SPREAD linked systems, the integrated first; with a **security operations centre**, `cyberCentre`, one system for a third of the time). From chapter 7 the random events include a cyber attack (setup `cyber`; an event's `needs`). The teams then work as well as their readiness lets them; `drills` (an option) drill every system; the goal `readiness`.
- **One terminal** (`t4t5`, 2022): Terminals 4 and 5 joined airside (`S.airport.joined`): their passengers walk past the brands of both.
- **The future** (chapter 8, the game's own types and generic future airlines — no real company's future is told): **electric aircraft** (`AIRCRAFT.electric`, the type EL30, the airline ELECTRIC) are charged instead of fuelled: by themselves on a stand with a charger (`charger`, a small build: the best stand without one; CHARGE_MIN), else by the mobile charger (`mcharger`, one aircraft at a time, CHARGE_MOBILE_MIN) sent by hand (the task `charge`), by the ramp team or the robots; they take charging stands first. **Apron robots** (turnaround level 2): the services × ROBOT_X, fuel without waiting for a truck, the heat does not slow them. **Self-driving ploughs** (snow level 3): a convoy × AUTO_PLOUGH_X. **Hydrogen** (`AIRCRAFT.hydrogen`, H2P, HYDRO): sent elsewhere without a hydrogen depot (`h2depot`), H2_MIN to fuel. **Biometric boarding** (border level 3): BIO_X a booth, boarding × BIO_BOARD_X. **Heat** (HEAT_TEMP): a heavy jet (HEAT_HEAVY_T) takes off from runway 1 only, people on the ramp × HEAT_SLOW (unless the robots or `shaded`), the passengers HEAT_PAX less unless `cooled`. **Your pier** (`pier2040`, the plot north of Pier F): its design is a decision (`pier`: finger — 6 contact stands; satellite — 8, two of them E, × 1.3 the price; green — 6 with chargers and a solar roof, × 1.15), an optional second arm; a project's own price factor (`p.k`). The **night train** platform (`nightTrain`) pays rent. Green points (GREEN_PTS_6) for charging stands, the night train, the hydrogen depot and the green pier.
- **New goals**: loss, cargo, mothballed, laidOff, readiness, chargers, joined. New option fields: demand, mothball, reopen, relief, staff, rehire, cutFill, drills, pier; new setup fields: demand, cyber, mothball, unmothball, leavers, cut, chargers, pierDesign; new stage field: demand; new event fields: ban (`al`), cyber, outage, blackout, a failure's `deep`.
- **Screens**: the People screen's furlough, empty jobs and Recruit; the Office's terminals card; the task tray's charging; the flight card's charging and hydrogen; the decisions' effects of every new field; Kaj's hints on empty terminals, empty jobs, charging, outages and the heat; the results after the final exam (the campaign played to its end).
- **The map**: the cargo stands' pads, the chargers' green posts, a mothballed terminal's dark windows, the security operations centre, the hydrogen depot's tanks, the night train's platform, the player's pier (a finger, a satellite or a green pier with its solar roof) and its apron and arm; the freighters (767-300F, 777F), A320neo, 737 MAX 8, A350-900, the electric commuter and the hydrogen airliner to scale; the liveries of DHL, UPS, Aeroflot, SAS's of 2019 and the future airlines.
- **Free Play** gains the era *After the storm, 2024* (after 7-11). Shift+7 and Shift+8 open their chapters.

### Chapter 7 as built (`data/missions/ch7.js`)

Checked and told: all of Arlanda's operations moved to Terminal 5 at the start of the pandemic, at times virtually no commercial traffic (Swedavia); travel at Swedavia's airports −74 % in 2020 (10.3 million, from 40.2 in 2019; Swedavia's year-end report 2020); almost all belly cargo lost, the freight-only airlines flying on (Swedavia 2020), SAS's freight flights from China from 8 May 2020 and Qatar Airways Cargo twice a week (newstodate.aero, May 2020); Terminal 2 open again on 26 October 2021; Swedish airspace closed to Russian aviation and Aeroflot's departures from Arlanda stopped (Transportstyrelsen), Aeroflot's flights to Europe cancelled on 27 February 2022 (Reuters); the security queues of over an hour in May 2022 and the staff shortage at the security company (Swedavia, The Local), a second company and the three-hour rule in June, about 100 new screeners by July; Terminal 4 open again on 15 June 2022 with a walking tunnel airside to Terminal 5 (Swedavia); the faulty update of a security program on 19 July 2024 (Reuters, The Local); close to 22 million passengers in 2023 and 22.7 million in 2024 (Swedavia). The game's own story: the flights of each day, the deals and the people, the leavers, the cyber attack of 2023 and the drill of 2024 (told as the game's), the exam's preparation.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 7-1 | Empty Skies (2020) | ops 16–19, plan 45 days | the last busy evening; mothball Terminals 2 and 4; rent relief or half the shops close | 2 terminals mothballed · 10 brands |
| 7-2 | Furlough or Lay Off (2020) | plan 60 days | furlough seven in ten, lay off four in ten, or keep everybody | lose ≤ 20 MSEK · Staff ≥ 60 |
| 7-3 | Cargo Saves the Day (2020) | plan 30 days, ops 20–23 | two cargo stands and two more freighters a day; a night of freighters | freight ≥ 7 MSEK · airport delay ≤ 3 |
| 7-4 | Coming Back (2021) | plan 30 days, ops 06–09 | Terminal 2 open again; recruit for the jobs the leavers left | airport delay ≤ 3 · ≤ 5 % of the jobs empty |
| 7-5 | Closed Skies (2022) | ops 07–10, plan 30 days | the Aeroflot flight banned; its slots to Finnair or Norwegian | every delay announced · Airlines ≥ 80 |
| 7-6 | Clearance Takes Weeks (2022) | plan 46 days, ops 06–09 | recruit on the first day, or wait and see | security wait ≤ 5 · ≤ 2 % of the jobs empty |
| 7-7 | One Terminal (2022) | plan 50 days, ops 06–09 | the tunnel by mid-June; Terminal 4 open again | brands earn ≥ 6 MSEK · check-in wait ≤ 3 |
| 7-8 | The Summer of Queues (2022) | plan 5 days, ops 05:30–08:30, 13–16 | a second security company, temps, overtime | security wait ≤ 5 · Passengers ≥ 85 |
| 7-9 | Cyber Morning (2023) | plan 35 days, ops 06:30–09:30 | a security operations centre or four IT people; the attack | airport delay ≤ 3 · Passengers ≥ 80 |
| 7-10 | Fallback Drill (2024) | plan 20 days, ops 06:30–09:30 | drills, then the stand and check-in systems switched off | airport delay ≤ 3 · check-in wait ≤ 4 |
| 7-11 | Exam: The Day the Screens Went Blue (2024) | plan 25 days, ops 06–08:45, 14–16:45 | drills or the centre; every system down for the morning | airport delay ≤ 5 · Passengers ≥ 85 |

### Chapter 8 as built (`data/missions/ch8.js`)

The player's own future: no history is told but that Swedavia's board stopped Pier G in November 2026 (in *Your Pier*). The electric commuter (30 seats) and the hydrogen airliner (70 seats) are the game's types, flown by "Electric regional flights" and "Hydrogen test flights"; the other airlines fly their 2020s types.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 8-1 | Electric Wings (2030) | ops 07–10, plan 20 days, ops 07–10 | the mobile charger by hand; two more, or two charging stands | airport delay ≤ 4 · Passengers ≥ 85 |
| 8-2 | Charging Stands (2031) | plan 45 days, ops 07–10 | four chargers from the toolbar; twice the electric flights | green ≥ 96 · airport delay ≤ 3.5 |
| 8-3 | Robots on the Apron (2033) | plan 35 days, ops 07–10 | the robots, the ramp team kept or laid off; the robots stop | airport delay ≤ 4 · Staff ≥ 60 |
| 8-4 | Self-driving Ploughs (2034) | plan 28 days, ops 06–09 | the ploughs; a snowstorm, the sensors iced | no close call · on time ≥ 85 % |
| 8-5 | Hydrogen Morning (2035) | plan 45 days, ops 07–10 | the hydrogen depot; the first hydrogen flights | green ≥ 98 · airport delay ≤ 3 |
| 8-6 | Your Pier (2036) | plan 50 + 75 days | a finger, a satellite or a green pier, built | spent ≤ 3 300 MSEK · 10 charging stands |
| 8-7 | Faces as Boarding Passes (2038) | plan 30 days, ops 13–16 | biometric boarding; an afternoon outside Schengen | border wait ≤ 2 · on time ≥ 90 % |
| 8-8 | Heatwave 2040 | plan 14 days, ops 13–16 | cool the terminals or shade the ramp; 34 °C | airport delay ≤ 3 · Passengers ≥ 88 |
| 8-9 | Night Train or Night Flight (2040) | plan 2 × 60 days | night freighters or the night train | last month ≥ 70 MSEK · Neighbours ≥ 80 |
| 8-10 | Peak Day 2040 | plan 6 days, ops 06–08:45, 15–17:45 | temps or four lanes; the busiest day | airport delay ≤ 3 · Passengers ≥ 88 |
| 8-11 | Final Exam: Blackout (2040) | plan 7 days, ops 06–08:45, 11–13:45 | drills; the busiest morning, then every system dark | airport delay ≤ 6 · Passengers ≥ 70 |

`tools/missions-check.js` measures them at ▶: chapter 7 1.1–7.8 minutes, chapter 8 1.3–7.7; the reference strategies are in `data/strategies/ch7.js` and `ch8.js`. Doing nothing fails every mission (in the most automated ones the goal is a decision only the player takes: the shops' answer, the staff's, the slots, the network, the nights, the peak, the drills).

## Events

Each mission has scripted events; between them random events come by season and difficulty: snowstorms, freezing rain, fog, thunderstorms, a heatwave, the flu, a power cut, a bad software update, a cyber attack (later chapters), a baggage system jam, a strike notice, a VIP flight, a lost child at security (kids love the happy end), a fuel shortage, a medical diversion, a moose. Big historical ones are missions of their own: the **ash cloud of April 2010** (European airspace closed for days — stranded passengers to feed and house), the **pandemic** (traffic near zero for months — mothball terminals, furlough or lay off, keep the cash alive), the **summer of queues 2022**, a **global IT outage** (July 2024). Cultural events bring peaks: **Nobel week** in December, **Midsummer**, Christmas charters to Lapland, a royal wedding (2010), **Eurovision in Stockholm (2016)**, world-famous concerts, ice-hockey championships.

## Campaign

**Eight chapters (eras) × 11 missions** (the 11th the chapter's **exam**) = **88 missions**, each at most about 10 minutes in 2–3 stages. The airport **carries over** from mission to mission and grows by the **master plan** (see above): the big structures reach every historical checkpoint, because building them is part of the missions' goals; what differs from player to player is the money, the people and their managers, the automation levels, the airlines, the insides of the terminals, the free plots and the adverts. Each mission saves a snapshot at its start, so it can be replayed for stars without touching the campaign (the campaign keeps the result of the first pass; a replay only improves stars). Between chapters the years jump; a **"Meanwhile…"** card tells what happened in the world and shows the historical projects finished in those years (built by the owner, as they were in reality; the player's choices of options and financing for them come in the next chapter's first mission). A player far behind in money gets an owner's loan to start the next chapter (so no campaign gets stuck), at the cost of the 🏅 for that chapter.

Mission names and years are a first plan; each is checked against history and balanced by `tools/missions-check.js`.

| # | Era | Missions (the exam last) | New things |
|---|---|---|---|
| 1 | **The Forest Field** (1958–1963) · 4–7 min, the exam 10 | Clear the Forest (1958) · First Wheels (14 Dec 1959: school flying, the first landing an SAS Caravelle; stands picked by hand) · The Tower (1960) · The First Terminal (ends on 26 June 1960, the first regular flight: an SAS DC-8 to New York) · The First Jets (summer 1960) · The Fuel Truck · First Snow · Make It Pay (1961) · Night Lights · Opening Day, 1 April 1962 · *Exam: The First Winter* (1963) | Map, runway, taxiway, stand, small terminal, tower; manual stands and turnaround; check-in; snow by hand; money basics; noise over Märsta |
| 2 | **The Jet Age** (1963–1979) | Longer for the Jets · Charter Summer (Transair, Sterling to Mallorca) · Hire a Hand · Two Managers · Jumbo! (the 747) · Fire Category · The Wage Round · The Bag Belt · Fog Morning · Crosswind (runway 2) · *Exam: The International Terminal* | People level, managers in pairs, airline choices, upkeep, loans, fire category, the first union round; Free Play opens after it |
| 3 | **Everyone Comes to Arlanda** (1980s) | Linjeflyg Moves In (domestic flights from Bromma) · Morning Peak · Flygbussarna · The Computer Room · Screens · Flu Season · Strike Notice · Planner or Computer? · The Big Freeze · Payback · *Exam: Domestic Rush* | Domestic terminal, peaks, buses and roads, sickness, first systems and their failures, the Ops Center; Challenge Days open after it |
| 4 | **Open Skies** (1990s) | Terminal 2 · Deregulation (new domestic airlines) · The Low-Fare Question · The Train Question (Arlanda Express: own or concession) · Building the Tunnel · Bags by Machine · Duty Free · Route Incentive · Hub Wars (Copenhagen) · Christmas Rush · *Exam: Millennium Night (Y2K)* | Competition, route incentives, rail, the baggage system, payback and NPV |
| 5 | **A New Millennium** (2001–2009) | *As built:* Schengen (2001) · The New Tower · Pier F · Runway Three · Security After 2001 · Taxiway Bridges (2003) · Norwegian Arrives · Remote De-icing · Rent Is Steady (Cargo City) · Liquids in Bags (2006) · *Exam: The Snowy Peak* | Border domain, security rules, parallel runways and bridges, Sky City and real estate, de-icing, random events, integrated systems |
| 6 | **Bigger and Greener** (2010–2018) | *As built:* Swedavia (2010) · The Ash Cloud · A Royal Wedding · Self Bag Drop · Emirates (2013) · The Permit · Nobel Week · Eurovision Week (2016) · Fly Green · A-CDM (2017) · *Exam: Record Summer 2018* | Green rating, permit, energy, biofuel, glycol, the aquifer, e-gates, self bag drop, A-CDM, the Gulf airlines, event peaks; *flygskam* in the last news |
| 7 | **Storm Years** (2020–2024) | *As built:* Empty Skies (2020) · Furlough or Lay Off · Cargo Saves the Day · Coming Back (2021) · Closed Skies (2022) · Clearance Takes Weeks · One Terminal (T4 joins T5) · The Summer of Queues · Cyber Morning (2023) · Fallback Drill (2024) · *Exam: The Day the Screens Went Blue (July 2024)* | Mothballing, furlough vs lay-off, security clearance delays, cyber, fallback readiness tested |
| 8 | **Arlanda 2040** (the player's future) | *As built:* Electric Wings · Charging Stands · Robots on the Apron · Self-driving Ploughs · Hydrogen Morning · Your Pier (the player's answer to the dropped Pier G) · Faces as Boarding Passes · Heatwave 2040 · Night Train or Night Flight · Peak Day 2040 · *Final Exam: Blackout* | Charging stands, self-driving vehicles, the player's own pier design, the final test: the busiest day ever, then a total blackout — the airport must survive on people and hand skills |

The final exam is the game's message: the most automated airport still needs people who know how to do it by hand.

### Chapter 1 as built (`data/missions/ch1.js`)

The chapter follows the checked dates, so its order differs from the first plan: the first aircraft to land (14 December 1959, school flying only) was an SAS Caravelle, regular traffic began with an SAS DC-8 to New York on 26 June 1960, and the official opening came last (1 April 1962, King Gustaf VI Adolf; all international traffic moved from Bromma that day). Sources: sv.wikipedia *Arlanda* (Historia), en.wikipedia *Stockholm Arlanda Airport*; the Riksdag's decision of December 1957 (153 million kronor, two runways, runway 1 planned at 3.3 km) and the name from the 1958 contest in *Året Runt* come from the same Swedish page. Not found and therefore not told: the year and look of the first tower, the first terminal's buildings ("at first very primitive buildings"), the as-built length of runway 1 in 1959 (chapter 2's *Longer for the Jets* must be checked against the 3.3 km of the 1957 plan), the early passenger numbers (so chapter 1 has no Real Arlanda 🏅), and any airline but SAS at Arlanda in 1960–62 (Transair Sweden's charters in *Make It Pay* are marked to check in `data/airlines.js`).

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 1-1 | Clear the Forest (May 1958) | plan 180 + 150 days | the order of four clearing jobs for two crews before the winter halves their speed; sell the timber or burn it; keep a tree belt toward Märsta | own money ≥ 10 MSEK · Neighbours ≥ 75 |
| 1-2 | First Wheels (14 Dec 1959) | ops 09–12, 12–15 | pick a stand for each training sortie; the runway has no lights and it gets dark at about 15:30 | no task left to the duty manager · airport-caused delay ≤ 1 min |
| 1-3 | The Tower (Jan 1960) | plan 75 + 60 days, ops 09–12 | heated winter tents against a fast pace in January; then a morning of sorties at the tower's shorter separation | spent ≤ 44 MSEK · Safety ≥ 84 (the backup radio) |
| 1-4 | The First Terminal (Apr 1960) | plan 42 + 40 days, ops 26 June 08–11 | one crew (or hire a second): the hall, desks, waiting room and a kiosk by the deadline; check in the first regular flight | a kiosk · check-in wait ≤ 10 min |
| 1-5 | The First Jets (summer 1960) | ops 07–10, 15–18 | DC-8s fit only stands 1–2; open desks before the queue grows | on time ≥ 92 % · check-in wait ≤ 9 min |
| 1-6 | The Fuel Truck (Oct 1960) | ops 07–10, 14–17 | fuel by hand with one truck and three DC-8s; buy a second? | airport-caused delay ≤ 1.5 min · Airlines ≥ 85 |
| 1-7 | First Snow (Dec 1960) | ops 07–10, 11:30–14:30 | snow on the runway and the apron; two ploughs are slow, a full convoy has four | no close call · on time ≥ 85 % |
| 1-8 | Make It Pay (Mar 1961) | plan 3 × 80 days | the open airport loses money: fees, a café or a kiosk, summer charters, a car park that pays back only in years | profit ≥ 6 MSEK · Airlines ≥ 65 |
| 1-9 | Night Lights (Nov 1961) | plan 45 days, ops 15–18, 20:30–23:30 | edge lights for the dark, approach lights for the fog; the runway direction that spares Märsta at night | nothing sent away · Neighbours ≥ 62 |
| 1-10 | Opening Day (1 Apr 1962) | ops 07–10, 11–14 | stand 1 closed for the ceremony 11–13; a remote stand built in a hurry | airport-caused delay ≤ 2 min · Passengers ≥ 72 |
| 1-11 | Exam: The First Winter (Jan 1963) | ops 07–10, 11–14, 14:30–17:30 | everything by hand in one snowy, dark day | airport-caused delay ≤ 2 min · no close call |

`tools/missions-check.js` measures them at ▶: 4.2–6.7 minutes, the exam 9.6. Each mission also has `aim`, `news` and the decisions' texts for the screens (see "The game in the browser").

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

- **Free Play** (opens after chapter 2): any era as a start (the forest, 1983, 2003, today), any difficulty, the campaign's unlocked tech; an endless calendar with rolling goals and the Offers board; saved like the campaign; the Album and the Archive keep filling. A **Today's Arlanda** start gives the real airport of the latest chapter to run. *As built in session 3:* three eras (1963, 1976, 1990), rounds of a month of offers and a peak, no stars — see "People, systems, chapters 2–3, Free Play and the cloud (session 3)"; session 4 added 2000, session 5 2009, session 6 2024.
- **Challenge Days** (open after chapter 3): longer fixed scenarios (20–60 min) with a score and three stars — a whole record day, Christmas week, the ash cloud week, the blackout — saved at any moment. *As built in session 4:* Christmas Week 1989, The Great Snow 1987 and Record Day 1999, about 22 minutes each — see "The terminals, brands, the economy screens, chapter 4 and Challenge Days (session 4)".

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

`arlandaRising.campaign.v1` (the airport, calendar, people, airlines, money), `arlandaRising.mission.v1` (the running mission's full state and its stage checkpoints — written every `AUTOSAVE_SECONDS`, at each stage's end and on `visibilitychange` / `pagehide`; cleared when the mission ends), `arlandaRising.snapshots.v1` (each mission's starting state, compressed), `arlandaRising.progress.v1` (stars per mission per difficulty, hint 3 used, 🏅, Archive cards, Album), `arlandaRising.freeplay.v1` (Free Play's airport, its era and round), `arlandaRising.challenges.v1`, `arlandaRising.settings.v1` (hints, quality, sums in full or short), `arlandaRising.difficulty`, `arlandaRising.sound`, `arlandaRising.lang`; for the cloud save `arlandaRising.cloud` (the Google account the progress syncs with) and `arlandaRising.auth` (its session, kept by supabase-js). Every key starts with `arlandaRising.`; the game never clears anything else on the origin.

## Cloud save (sync through Google)

Optional, on top of `localStorage`, built like `lift-logic`'s (start from `lift-logic/core/cloud.js` and follow `docs/cloud-save.md` in full — its rules, recipe and typical mistakes): signed in with Google, the campaign and the progress are kept in the cloud, so the child plays on the phone and goes on at the computer — or the other way — with the same airport, stars, Album and Archive. Without signing in nothing changes and no network call is made; the game plays fully without the cloud.

- **Where it lives.** The Supabase project shared with `world-aviation`, `lift-logic`, `swedish` and `tanks`: its URL and publishable key in `core/cloud.js` (`CLOUD_URL`, `CLOUD_KEY`), not secrets — the table's row-level security guards the rows. `supabase/schema.sql` (safe to run again) makes `arlandarising_saves (user_id → auth.users, data jsonb, updated_at)`, one row per account, with policies prefixed `arlandarising:` letting a signed-in user read, insert, update and delete only their own row. The page's address goes into the project's Auth → URL Configuration → Redirect URLs (`https://gray0072.github.io/ivan/arlanda-rising/`, and `http://localhost:…/arlanda-rising/` for testing).
- **The library.** `lib/supabase.min.js`, the same vendored supabase-js file as `lift-logic`'s (UMD, global `supabase`); the **PKCE** sign-in; the session under `arlandaRising.auth` (never the library's default key, shared by the whole origin). From `file://` or without the library the game has no cloud and shows none of it.
- **What travels** (`Save.snapshot`): `arlandaRising.progress.v1`, `campaign.v1`, `mission.v1` (the running mission, so a stage started on the phone goes on at the computer), `freeplay.v1`, `challenges.v1`; the mission snapshots for replays (`snapshots.v1`) go in the same row but only at idle moments, as they are big. The settings, the difficulty, the sound and the language stay this device's.
- **Sync** (`Cloud.syncNow`): read the account's copy, merge it into the save here, write the result back — never a write without a read and a merge first. It runs on the sign-in, at start, on every return to the foreground or to the network (`online`), 10 s after the last change (`CLOUD_PUSH_MS`: a stage or a mission finished, a decision in the Office) and at once when the page goes to the background (`keepalive`, so it outlives a phone that locks or a time limit that closes the app; the body kept under 64 KB, compressed, `CLOUD_KEEPALIVE_MAX`). A failed sync is tried again every 30 s while the page is in view (`CLOUD_RETRY_MS`), on the next change and on every return. Reads with `.retry(false)`. Every request ends by a timeout (`CLOUD_REQUEST_MS` 10 s, a whole sync `CLOUD_SYNC_MS` 25 s).
- **Never under the player.** A merge runs only at idle moments — the start screen, the timeline, the Office, the Free Play screen — never in a running stage. While a stage runs, an upload is **deferred**: it reads the copy's `updated_at` again and uploads only if it is still the one this device last read or wrote (nobody changed it meanwhile); otherwise it waits for the stage's end to merge first. The merge never schedules another upload by itself (`Cloud.quietly`).
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

Each shows a banner and marks the run as cheated (no stars, no 🏅, no records): `Shift+1…8` jump to that chapter's first mission with the real Arlanda of that year; `Shift+M` +100 MSEK; `Shift+S` a snowstorm now; `Shift+K` a strike notice; `Shift+F` a system failure; `Shift+E` the next random event now; `Shift+A` every domain one level up; `Shift+W` win the current stage; `Shift+D` skip to the end of the stage. Their effects are in `sim/cheats.js` (money, snowstorm, domains up, win and skip the stage, a strike of the first team, a failure of the first system, an event); the keys and banners are in `game.js`. The cheated mark (`S.cheated`) belongs to the mission being played and is cleared at every mission's start; its result says `cheated`, and the progress saves nothing for it.

## Testing and balancing

- `sim/` is deterministic from a seed and has no DOM: a whole mission runs in Node; a mission saved and resumed at any second gives the same result as one run straight through (a test for the autosave).
- `tools/missions-check.js` runs every mission with its **reference strategy** (a scripted list of decisions in `data/strategies/`, played by `sim/strategy.js`) at every difficulty and reports the stars, the money curve, the meters and the minutes at ▶; it fails when the reference misses ★★★ on Easy or Medium, when doing nothing passes, when the previous chapter's strategy gets ★★★, when a "Real Arlanda" 🏅 is unreachable, or when a mission is longer than `MISSION_MINUTES_MAX`.
  - Run it after any change to `sim/`, `constants.js` or `data/`: `node arlanda-rising/tools/missions-check.js [mission id…] [--verbose]` (all of chapter 1 takes about two seconds; everything about half a minute). It also plays each Challenge Day (`c1`, `c2`, `c3`) from its own airport with its reference strategy: it fails when the reference misses ★★★ on Easy or Medium, when doing nothing gets ★★★, and when a resumed day ends differently. It plays the campaign as a chain — each mission starts from the airport the reference left after the one before, at the same difficulty — so a change early in a chapter moves the money of every later mission.
  - It also fails when the reference does not pass on Hard, when a stage is longer than `STAGE_MINUTES_MAX`, and when the mission played with a save, a throw-away and a resume in the middle of every stage (`Missions.save` / `Missions.resume`, as the autosave does) does not end in exactly the same state as one played straight through. The strategy of the mission before getting ★★★ too is a warning (`?`), not a failure: an exam reuses the chapter's moves.
  - `--verbose` shows every stage's goals with their values, the stars and why doing nothing fails. To see one stage flight by flight, load the same files in a `vm` context (the list at the top of the checker) and print `S.ops.flights` at the stage's end: each flight keeps its planned and real times, its stand, its check-in and its turnaround's steps.
  - A stage, an option or a rule changed: run the checker, then tune the mission's goals and stars to the reference's numbers with a margin, so the reference keeps ★★★ and doing nothing fails.
- Browser checks with `tools/cdp.js` (see `docs/testing.md`), short and one at a time; one check locks the page mid-stage (`visibilitychange`) and reloads it to see the mission continue. Recipes for a steps file (after `page('arlanda-rising')`):
  - English first: `I18N.set('en')`; a clean start: `localStorage.clear(); Progress.load(); Campaign.load()` (only in the test's own Chrome profile).
  - A mission at once: `Game.startMission('1-5', 'medium'); Game.play(); Game.speed = 3`; a moment of it: `Cam.centerOn(800, 1250, 3)`, `S.clock = 22 * 60` (the night), `FlightCard.open(S.ops.flights[0])`.
  - The campaign played by the reference strategies through the game's own flow (a few seconds): for each mission `Game.startMission(id, d)`, then `Strategy.act(r); Sim.step()` in a loop (`Missions.next()` on `stageDone`) with `GameEvents.mute(true)`, then `Game.missionEnd()`.
  - The resume: `Game.save(); location.reload()`, then `Game.continueMission()` and compare `S.clock` and `S.money`.
  - The screenshot: 1280 × 720, the campaign played to Opening Day, `S.clock` 08:25 by the reference strategy, `Cam.centerOn(760, 1240, 1.55)`.

## Files

Those in code are listed by name; the rest are planned.

```
arlanda-rising/
├── SPEC.md
├── index.html, styles.css, constants.js (every tuning value, the difficulty table, the screen's and the hints' numbers)
├── game.js (the main loop, the flow, the gestures, the keys and the cheats, the autosave), progress.js (stars, the campaign, snapshots)
├── data/        aircraft.js (the types of the era, with sources), airlines.js (real airlines: years at Arlanda, kind, temper,
│                liveries by era, sources), buildings.js (what the airport owns: price, jobs, shops, car parks), masterplan.js (the
│                historical projects: year, plot, stages, mods, effects, sources), layout.js (the map: the real runways, the apron
│                and stands, buildings, roads, Märsta, fields, lakes, the site's clearings), domains.js (the automation ladder; levels
│                0–2), people.js (departments, unions, managers), missions/missions.js (the chapters, the list of missions and the
│                fields) + missions/ch1.js, ch2.js, ch3.js, strategies/strategies.js (the list) + strategies/ch1.js, ch2.js, ch3.js
│                (the reference strategies), lang-ru.js, lang-sv.js, icons.js (generated by tools/icons-build.js);
│                session 4: terminals.js (the terminals' units), brands.js (the real shops, cafés and services, with
│                their years in Sweden), missions/ch4.js, strategies/ch4.js, challenges.js (the Challenge Days);
│                session 5: events.js (the random events), missions/ch5.js, ch6.js, strategies/ch5.js, ch6.js;
│                session 6: missions/ch7.js, ch8.js, strategies/ch7.js, ch8.js;
│                planned: archive.js, album.js, hints.js
├── core/        utils.js (math, the generator kept in the save, clock times, money()), events.js (the bus), storage.js (the keys
│                and the mission autosave), i18n.js (tr(), the language switcher, dates), settings.js (hints, quality, sums, the
│                difficulty; sek()), audio.js (Sfx: the synthesized sounds, one master gain), input.js (map gestures: tap, long
│                press, drag, pan, pinch, wheel, keys; fullscreen), cursor.js, update.js (new deploys at idle moments, the
│                offline worker), icons.js (generated), save.js (the cloud's snapshot and merge), cloud.js (the sign-in and the
│                sync, from lift-logic)
├── lib/         supabase.min.js (vendored supabase-js, the same file as lift-logic's)
├── supabase/    schema.sql (the arlandarising_saves table and its row-level security)
├── sim/         state (S, the generator, the log), calendar (dates, the sun), weather, finance, meters, airport (what is built,
│                projects' effects, small builds, running costs), stands, schedule, runways (direction, closures, noise, snow,
│                ploughs), passengers (check-in), turnaround, flights, tasks (the tray, the duty manager), construction, summary
│                (traffic in summary, the skipped time), plan (plan time, decisions), ops (ops time), goals (counters, goals,
│                stars), missions (start, stages, checkpoints, results, save / resume), actions (everything the player can do),
│                sim (the clock), strategy (a player made of a reference strategy), cheats, people (departments, absence,
│                hiring, overtime, unions, managers), systems (levels, failures, IT, readiness, drills), freeplay (eras, rounds),
│                terminal (units, brands, security lanes, the train), airlines (fees, incentives, courting, rivals), offers
│                (the Offers board), invest (payback and NPV), challenges (the score, the bests), events (scripted and
│                random events, the ash cloud), green (the green rating, energy, biofuel, the permit); planned: taxi,
│                wildlife, debrief
├── art/         emblems.js (airline fin art and square logos), brands.js (the brands' signs), flag-gb / flag-ru /
│                flag-se.svg (the language switcher)
├── render/      palette.js (the Arlanda palette, the land by season), iso.js (projection, camera, boxes), ground.js (forest,
│                fields, lakes, the bog, clearings, roads, Märsta, single trees), airport.js (runways 1 and 2, taxiways, aprons,
│                stands, the terminals and buildings by stage, cranes, lamps), aircraft.js (types to scale in their liveries), traffic.js (where every
│                flight is, vehicles, people, the plough convoy, labels and turnaround bars, taps), sky.js (light, fog, snow,
│                lamps), map.js (the scene, a frame, what a tap hit, the camera's framings), terminal.js (the Terminal
│                view's cut-away plan)
├── ui/          text.js (goals, tasks, meters, minutes, effects), screens.js (overlay panels, the start screen, help, settings,
│                pause, confirm, the difficulty picker), hud.js, tray.js, toolbar.js, plan.js (the plan panel, decisions),
│                cards.js (the flight card), timeline.js, missioncard.js (and the card before each stage), results.js (the stage
│                card, the results, the newspaper), office.js, people.js (the People screen), opscenter.js (the Ops Center),
│                hints.js (Kaj, the finger), sounds.js, terminalview.js (the Terminal view), finance.js (Finance and its
│                chart), airlines.js (Airlines, the Offers board), challenges.js (the Challenge Days and their results);
│                planned: archive, album
├── tools/       missions-check.js, debug-mission.js (one mission flight by flight)
├── README.md, README_RU.md, README_SV.md (with the not-affiliated note, how to install)
├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png (tools/pwa-icons.sh)
├── manifest.webmanifest, sw.js (generated by tools/sw-build.js), screenshot.png
```

## Build order (sessions)

1. **Core sim headless** *(done)*: calendar, weather, schedule, runways, stands, turnaround, passengers as flows, finance, stages and the autosave/resume; chapter 1 missions with reference strategies; `missions-check.js`.
2. **Map and look** *(done)*: isometric renderer with the Arlanda palette, seasons and light, aircraft with real liveries and emblems, vehicles, build tools, the task tray, the Office; chapter 1 playable end to end on a phone; **installable and offline** (manifest, icons, `update.js`, `sw.js`); gallery card, root `SPEC.md` and READMEs.
3. **People and the ladder** *(done)*: departments, managers in pairs, absence, unions and strikes, the Ops Center, systems and failures; chapters 2–3, Free Play; **the cloud save through Google** (the table, the sync, the states, tested with `tools/cloud-mock.js`).
4. **Terminal view, brands and the economy screens** *(done)*: passenger flow, real shops and ground transport, finance with payback and NPV, offers, airlines' tempers; chapter 4, Challenge Days.
5. **Chapters 5–6** *(done)*: border, security, parallel runways, de-icing, real estate, green rating and the permit, events.
6. **Chapters 7–8** *(done)*: crises, fallback readiness, the future tech, the final exam.
7. Translations, icons, READMEs, screenshot (from session 2 on, kept up to date with every later one; done for chapters 1–8).

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
