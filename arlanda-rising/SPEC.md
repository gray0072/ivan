# Arlanda Rising — SPEC

Developer/agent spec for the `arlanda-rising` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

> **Status: sessions 1–7 of the build order done — all eight chapters (1958–2040, 88 missions) are playable end to end in a browser, on a phone and a desktop, in English, Russian and Swedish; installable and offline; Free Play; three Challenge Days; the cloud save through Google; in the gallery.** In code: the simulation (`sim/`) and its data (`data/`), the isometric map (`render/`), the screens (`ui/`), the flow and the autosave (`game.js`, `progress.js`), the cloud save (`core/save.js`, `core/cloud.js`, `supabase/schema.sql`), the translations, the icons, the manifest and the offline worker, and `tools/missions-check.js` (see "Testing and balancing"); what each session built is listed in "As built, session by session". Not yet: the terminal's desks, seating and arrivals in the Terminal view, adverts, contracts with promises and penalties, the hints 💡 1–3 and the Debrief, the Archive and the Album, Keep the shift going, wildlife as a domain of its own (birds and moose come only as random events), the arrivals' passport control. Settled with the user: the name *Arlanda Rising* (folder `arlanda-rising`); **real airlines with their emblems and real brands** (Swedavia, Arlanda Express, Flygbussarna and the like); **isometric** graphics; **short missions** (at most about 10 minutes, split into stages, never lost when interrupted) for a child with a 40-minute phone limit; a **long campaign** (88 missions, about 7.8 hours of play at ▶ measured, more with the Office and retries — "How long it lasts"); **one airport through the whole campaign that grows by the historical master plan** — freedom within each mission's frame, full freedom only in small things (adverts, banners, which airlines to court), the architecture and the look of the buildings follow the historical checkpoints (see "The master plan"). The settled decisions are listed at the end ("Decisions").

## The spec's files

This file holds the game's core: the idea, the master plan, the rules of play, the economy, the campaign's outline, the settings, the files and the decisions — read it in full before any change. The large parts by area live in `spec/`; **read the ones the task touches, in full, before changing anything there**, and keep them in sync with the code like this file.

| Working on… | Read |
|---|---|
| the map, the drawings, the vehicles' places, the fence, a name, a brand, a shop, the palette, any text that names the real Arlanda | [spec/world.md](spec/world.md) — the world: geography and layout, real names and brands, look and style, sources |
| a screen, a panel, a card, the HUD, the buy menu, the roofs off, the map's renderer, the flow of `game.js`, the autosave | [spec/ui.md](spec/ui.md) — the screens and the game in the browser (session 2) |
| the sim, `constants.js`, `data/` (flights, turnarounds, check-in, snow, the build limits, shops, car parks, people, systems, terminals, airlines, the border, de-icing, the green rating, the storm years, the future) | [spec/sim.md](spec/sim.md) — the rules as built, session by session |
| a mission, a chapter, the unlocks, a reference strategy | [spec/chapters.md](spec/chapters.md) — the chapters as built and what each mission opens; [spec/missions.md](spec/missions.md) — every mission's budget, decisions, lessons and stars, the money along the campaign, proposals and open issues |
| the checkers, balancing, a browser test, screenshots, the showcase GIF, debugging | [spec/testing.md](spec/testing.md) — testing and balancing, the recipes |
| the cloud save, `core/save.js`, `core/cloud.js`, `supabase/` | [spec/cloud-save.md](spec/cloud-save.md) |
| Free Play | [spec/freeplay.md](spec/freeplay.md) — the design and step plan of the non-stop Free Play from the forest to 2040 |

A code comment that names a section of `SPEC.md` ("Screens", "Look and style", "Cloud save"…) finds it here or, through its short summary here, in its file of `spec/`.

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

Length: the 88 missions take **about 7.8 hours of play at ▶** (measured, see "How long it lasts"); a first pass is longer by the Office, the decisions and the retried stages, and ★★★, the 🏅, Free Play and the Challenge Days go beyond. Phone first in landscape (portrait works with bottom sheets), tablet and desktop.

## Taken from the other games of this repo

| From | What | How it is used here |
|---|---|---|
| `city-builder` | Isometric Canvas 2D map with procedural, cached sprites; map-app gestures; build toolbar with locked tools; building card with Upgrade / Repair; overlays; budget card; debt months before game over; milestones unlocking buildings | The airport map, the build tools, the cards, the noise / queue / coverage overlays, the "the owner replaces you" failure |
| `lift-logic` | Missions with three stars of different aims; chapter = building, the last mission an exam; hints in three steps (Hint 3 caps at ★★); guided finger in the first missions; the Inspector's notes with **Show me**; the Engineer's record → 🏅; comic lines and the newspaper after an exam; the Museum of checked facts; a headless checker that balances every mission with a reference solution | Mission structure, stars, hints, the debrief, the "Real Arlanda" 🏅, the Archive, `tools/missions-check.js` |
| `world-aviation` | Arlanda as home; **real airlines with simplified drawings of their liveries and emblems** (`data/airlines.js`, `art/emblems.js`, about 100 airlines); brand boards (`art/brands.js`); real aircraft types and their numbers; money in Swedish kronor; three languages; cloud save | Copied (not linked — projects are self-contained) and extended with the historic airlines and the local brands, drawn for the isometric view |
| `fish-frenzy` | Auto graphics quality | The renderer drops detail (people, cars, shadows) on slow devices |
| all | Three difficulty levels, Sound On / Off, cheats with banners, PWA, `?v=N`, prefixed storage | As required by `AGENTS.md` |

## The world: Arlanda (binding for every session)

The game must **look and feel like Arlanda** in every session. The world is in **[spec/world.md](spec/world.md)** — read it in full before any change to the map, the drawings, the vehicles, a name, a brand or a text the player sees: "Geography and layout" (the runways, the terminals, the towers, the rail, "The map as built" in `data/layout.js` and its rules, the vehicles' places, the E4, the airside fence), "Real names and brands" (the airlines, the ground transport, the shops and cafés, the hotels, the rules for real brands), "Look and style" (the view, seasons and light, the palette tokens, the aircraft, the Swedish touches) and "Sources to check against".

## The master plan: freedom within the history

One airport runs through the whole campaign, but it **grows by the real Arlanda's plan**: the player decides *how*, *when within the mission* and *how well*, history decides *what* the big structures are, *where* they stand and *what they look like*. So the airport of every chapter's end looks like the real Arlanda of that year, and every later mission can rely on it.

- **Historical checkpoints (fixed):** the runways, the taxiway system, the terminals and piers, the towers, Sky City, the stations and the rail tunnel, the cargo area and the big car park houses stand on their **real sites with their real footprint and their real architecture of the era** (`data/masterplan.js`: each project with its year, its plot, its look and its stages, with sources). A mission that brings one shows it on the map as an **outlined plot** with the architect's drawing; it cannot be moved, redesigned or left out — building it (or a stage of it) is part of the mission's ★ goal. The look changes only at the checkpoints history had (the 1960s terminal, the 1976 international terminal, the 2001 tower, the 2003 Pier F, the 2022 joining of T4 and T5…).
- **Freedom within the frame (each mission):** the **order** of the plan's stages and **when** each starts; the **pace** (normal, or faster with overtime and a higher price); the **financing** (cash, a loan, the owner's grant with its conditions, a partner — and the partner's terms); **options** the real project had or could have had without changing its look (how many jet bridges on a pier, a bigger baggage hall, solar panels on the roof, backup power); and the **inside** of every terminal in the Terminal view — desks, lanes, gates' seating, shops, lounges, play areas — within the terminal's walls.
- **Free plots:** a mission also opens a few **free plots** in the landside and on the apron edge, where the player places small buildings of their choice from the era's list (an apron bus garage, a de-icing pad, a snow depot, a staff car park, a hotel extension, a solar field, a remote stand) — none of them changes the historical skyline.
- **Full freedom in small things:**
  - **Adverts and sponsorship:** banners in the terminals, boards along the roads and on the car park houses, screens at the gates, the naming of a lounge — real brands of the era bid for them (two or three offers at a time, each with its price and length); too many adverts lower the Passengers meter a little. The player picks, places and changes them freely.
  - **Which airlines to court:** among the real airlines of the era, the player chooses whom to invite, with what incentives, and whom to say no to — so the mix of liveries on the apron, the routes and the shops' passengers are the player's own.
  - **Shops, cafés and restaurants** in each terminal — the player chooses which real chain goes into which unit (Joe & The Juice by the gates, Sushi Yama in the food court, Lego near the family area), from the catalogue of the era (see "Real names and brands" in [spec/world.md](spec/world.md)); chains also come to the Offers board asking for a unit. The duty-free operator, the kerbside taxi and car-rental companies, the art in the terminals, the Christmas tree and the Lucia choir's place. The airport's own vehicles always wear the owner's real colours (LFV, then Swedavia).
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

Every screen — the start screen, the timeline, the Office, the mission card, the game view with its HUD, "The buy menu", "Roofs off and the cards of the map", the Terminal view, the Ops Center, People, Airlines, Finance with its analytics tabs, the stage card and the results, Pause, the Archive and the Album — is in **[spec/ui.md](spec/ui.md)**, with "The game in the browser (session 2)": the map in `render/`, play, help, the flow of `game.js`, the campaign in `progress.js`, the autosave and the texts.

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

- **Running costs are visible.** Every level's monthly cost is a line in Finance; the Ops Center shows each domain's cost a month (the team's wages and the system's licence). Its cost per task done is planned, not yet shown.
- **Systems need people:** an **IT department** (and later cyber security) sized to the systems; maintenance staff for machines. A system with too few IT people loses uptime.
- **Failures:** each system has a mean time between failures; a failure drops the domain to the level below **if that level is still staffed**, otherwise to the player's hands. Software updates (offered every few months) bring a gain and a small chance of a bad update. A power cut takes every system without backup power down; the backup generator is a building.
- **Fallback readiness:** each automated domain has a readiness % — how well the staff still know the manual way. It decays every month without a **drill** (a scheduled day costing a little capacity). A failure with low readiness is far worse.
- **Automation and the staff:** replacing people with a system frees jobs. The player chooses **lay off** (money saved now; all departments' morale down, strike risk up, Neighbours down) or **retrain** (costly courses; the people move to IT, maintenance or service; morale up).
- **A system straight from the hands** (session 7): the first system (level 2) can be bought from level 0 as well as from a team — it comes with its own operators (its level's `staff`); with no team beside it a failure hands the work to the player. A team can be **hired back** beside any system without one (`People.hireBack`: `HIRE_COST` × the team's jobs, ready after `HIRE_DAYS` — or the clearance — in plan time, at once between missions; also while the system is still being put in, when it works as the team until the system is live): it becomes the fallback (`kept`, readiness 1). Teams are never hired in ops time.
- **Teams and systems run their counters** (session 7, `Passengers.runCounters`): with the check-in, security or border domain at level 1 or more, its team or system opens and closes the desks, the lanes and the booths itself. A team looks every `COUNTER_TEAM_EVERY` minutes (× its skill and its head's `fast` / `slow`; a team short of people or a wrong guess — `right` — misses a look, by a roll of its own hash, so the world's random numbers stay as they were) and opens or closes `COUNTER_TEAM_STEP` of them toward what is needed: the queue cleared within `COUNTER_AIM_WAIT` and the busiest minute of the departures due kept up with — without a head with `fast` it goes by the passengers coming in now (so a steep peak catches it late), with one it reads `COUNTER_LOOK_TEAM` minutes ahead; it closes only with nobody queueing. A system looks every minute, `COUNTER_LOOK_SYS` ahead, and sets the number at once. Each change counts as a task of the team or the system. The player's − / + holds for `COUNTER_HOLD_MIN` (the bar says *Your call: n min*, otherwise *Terminal service runs them* or the system's name); a queue past the task's wait still makes the old task (the tray when the team is short).
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
  Managers gain experience, ask for raises, can be **poached** by a rival airport (Copenhagen, Oslo, Helsinki) unless kept happy, and retire after `MANAGER_YEARS`.
- **A head makes a team better; the team does the work** (session 7): a head's perks act only through a team, so a head for a department with no team (and none on its way) comes with the team — hired as usual, its price and days on the card (`Text.headTeam`, the decision's effects); never in ops time. When a head retires or is poached (`People.leave`) the department is marked vacant (`S.people.vacant`), the head goes to `S.people.gone` and never comes back; in plan time a banner says so at once (the team keeps working — only the head's skill is gone) and the next day a decision offers the two successors (`Offers.head`, *A new head for …*, or *Nobody for now*); a head who left between missions is told on the "Meanwhile…" card, in the Office (with **Find a new head**) and offered in the mission's first plan time. The candidates (`People.candidates`) are the department's own heads of `MANAGERS` first, then successors made of `HEAD_NAMES` and `HEAD_STYLES` (`next:<dept>:<n>`, `People.mdef`): every department of people (baggage, information and de-icing too) always has two. Ordinary staff do not retire or leave one by one: a team is a number of jobs, and replacing leavers every few years would be a chore without a decision — the people who go are the crisis's (lay-offs, the long pause, `cut`), filled again with **Recruit**.

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

**Every sum in the game is in SEK** (Swedish kronor), at today's prices throughout the campaign (no inflation): never any other currency. The number first with a space between thousands; the unit by the language: English **SEK**, **kSEK**, **MSEK** (`4 700 SEK`, `20 kSEK`, `120 MSEK`), Russian **крон**, **тыс. крон**, **млн крон**, Swedish **kr**, **tkr**, **Mkr** — "SEK" is fine in every language too. One formatting function (`core/utils.js` `money()`) writes them all. **The unit only where there is room:** sentences, the big sums (the money in Finance and the Office, the HUD on a wide screen) and the loan buttons keep it; table cells (the books, the investments, the what-ifs, the last months, the Ops Center's costs), prices on buttons (the toolbar, the plan panel, the Ops Center, People) and the chart's axis drop the currency and keep the k / M (`20.5 M`, `964 k`, `1,2 млн`; `sekBare()` in `core/settings.js`). A thing that cost the airport nothing shows `—` as its price and payback. This spec writes SEK. Numbers below are the starting design; final values live in `constants.js` and `data/` and are balanced by `tools/missions-check.js`.

### Income

| Source | Rule of thumb | Lesson |
|---|---|---|
| Landing fee | ~60 SEK per tonne MTOW (A320 ≈ 4 700 SEK, 747 ≈ 24 000 SEK) | Big aircraft pay more but need more |
| Passenger fee | ~110 SEK per departing passenger (domestic ~70) | Volume matters |
| Security fee | ~50 SEK per departing passenger | Covers security, roughly |
| Stand time | After the first hour, per hour (contact stand more than remote) | Long stays cost space |
| Shops, food, duty free | The airport's share per passenger, 15–60 SEK, **× the free time airside** (fast security = more shopping) and the passenger mix (international and leisure spend more); the airport's own shops fill the terminals' **cells** (see "The rules as the sim has them" in [spec/sim.md](spec/sim.md)) | Fast queues earn money twice |
| Parking, car rental | The drivers among the departing passengers, per day, as far as the car parks' places cover those they need at today's traffic (see "Car parks" in [spec/sim.md](spec/sim.md)) | The coaches and the train cut this income |
| Real estate | Rents from hotels, offices, Sky City, the cargo area | Slow but steady |
| Rail and buses | Station fees or a ticket share (depends on the deal) | The concession choice |

Revenue per passenger starts at about two thirds aeronautical (fees) and one third commercial in the 1960s; the player can push it to about half and half by the 2010s, as real airports did.

### Costs

Staff (≈ 45 000 SEK per full-time job a month, all included; overtime ×1.5), the systems' running costs, upkeep (2–5 % of each building's price a year), energy (heating in winter is big), de-icing fluid (per litre; an aircraft takes from a few hundred to a few thousand litres), snow clearing fuel, insurance, interest on loans (`LOAN_RATE`, about 4 % a year), penalties to airlines for airport-caused delays, fines for breaking the environmental permit.

### The owner

The airport belongs to the state: **Luftfartsverket** until 2010, **Swedavia** from then. The owner gives a mission its **budget** (`setup.budget`, × the difficulty's money) and may give **grants** for national projects (the first runway, the train, runway 3); it sets **no standing return target**. Profit and money are the goals of particular missions, each its own: own money left after the clearing (1-1), a profit over the months played (1-8 Make It Pay, 2-2 Charter Summer), the last month's result (3-9, 4-3, 5-9, 6-6, 6-9, 8-9), a loss kept small (7-2), a cap on what a project costs (1-3, 2-1, 5-4, 8-6), and in 6-1 the decision how to meet Swedavia's call for a better return (higher fees, or more flights: the flag `targetSet`, no number). The other missions are judged on service, the meters, builds and decisions (every mission's goals: [spec/missions.md](spec/missions.md)). Loans are available up to a limit set by the owner (`Finance.limit()`), **always there and growing with the airport**: `LOAN_VALUE_SHARE` (8 %) of what the airport owns (the prices of its buildings, runways and vehicles), at least `LOAN_MIN` (20 MSEK), × the difficulty's money — about 46 MSEK in 1960 (1-6), so after 1-1's 30 MSEK loan a few vehicles can still be bought on credit; a mission's own `setup.loanLimit` (room on top of what is owed at its start: 1-1, 2-1, 2-10, the exams…) wins while it is bigger, and Free Play's eras and the Challenge Days get the same limit. It is a ceiling on the whole debt, not a gift each mission: a project paid with *A loan* borrows only up to it and pays the rest in cash. A loan is a choice, not free money: `LOAN_RATE` interest every month, every `money` goal counts the money less the loans, and the owner's patience below zero is unchanged. Cash below zero for `DEBT_MONTHS` months in a row fails the mission: **the owner replaces the director** (retry the stage, or restart the mission, with the difficulty pre-selected).

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

**Before buying** (`sim/invest.js`, the same estimates as Finance's): the buy menu's card of a shop, a car park, a rent or the solar park shows what it would earn and cost a month, its profit and its payback at **today's departing passengers** (the last `TRAFFIC_DAYS` days in summary), and the same at **twice the passengers** (`Invest.at(2, fn)` runs any estimate at k × today's traffic: the car parks' need grows with it too), so a café that pays back in 31 months at 160 passengers a day reads *×2 passengers: pays back in 15 months* — the traffic must grow for the shops to pay. In 1961 (1-8, about 160 departing passengers a day): a kiosk 600 kSEK earns ~43 kSEK a month (payback 14 months), a café 2.5 MSEK ~86 kSEK (31 months), the small car park ~69 kSEK against 55 kSEK of wages and upkeep while the drivers need 33 places (it pays back only as the traffic grows).

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

The rules as the sim has them — the steps, flights, the turnaround and its bar, delays, check-in, snow, "The build limits", the dark and the noise, the tray's other hands, the meters, plan time, the airport's own shops in their cells, "Car parks", between missions — are in **[spec/sim.md](spec/sim.md)**, with what sessions 3–6 added (see "As built, session by session").

## As built, session by session

What each session of the build order added, in detail, with its numbers in `constants.js` and its data in `data/`:

| Session | What it built | Where |
|---|---|---|
| 1 | "The rules as the sim has them": the core sim | [spec/sim.md](spec/sim.md) |
| 2 | "The game in the browser (session 2)": the map, play, help, the flow, the campaign, the autosave, the texts | [spec/ui.md](spec/ui.md) |
| 3 | "People, systems, chapters 2–3, Free Play and the cloud (session 3)": the ladder, systems, people, unions, managers, the airfield | [spec/sim.md](spec/sim.md); the cloud in [spec/cloud-save.md](spec/cloud-save.md) |
| 4 | "The terminals, brands, the economy screens, chapter 4 and Challenge Days (session 4)": the terminals' insides, security, ground transport, airlines, offers, payback and NPV, Challenge Days | [spec/sim.md](spec/sim.md) |
| 5 | "The border, two runways, de-icing, real estate, events, the green rating, chapters 5–6 (session 5)" | [spec/sim.md](spec/sim.md) |
| 6 | "The storm years and the future, chapters 7–8 (session 6)" | [spec/sim.md](spec/sim.md) |
| 1–6 | "Chapter 1 as built" … "Chapter 8 as built", "What the campaign opens" | [spec/chapters.md](spec/chapters.md) |

## Events

Each mission has scripted events; between them random events come by season and difficulty: snowstorms, freezing rain, fog, thunderstorms, a heatwave, the flu, a power cut, a bad software update, a cyber attack (later chapters), a baggage system jam, a strike notice, a VIP flight, a lost child at security (kids love the happy end), a fuel shortage, a medical diversion, a moose. Big historical ones are missions of their own: the **ash cloud of April 2010** (European airspace closed for days — stranded passengers to feed and house), the **pandemic** (traffic near zero for months — mothball terminals, furlough or lay off, keep the cash alive), the **summer of queues 2022**, a **global IT outage** (July 2024). Cultural events bring peaks: **Nobel week** in December, **Midsummer**, Christmas charters to Lapland, a royal wedding (2010), **Eurovision in Stockholm (2016)**, world-famous concerts, ice-hockey championships.

## Campaign

**Eight chapters (eras) × 11 missions** (the 11th the chapter's **exam**) = **88 missions**, each at most about 10 minutes in 2–3 stages. The airport **carries over** from mission to mission and grows by the **master plan** (see above): the big structures reach every historical checkpoint, because building them is part of the missions' goals; what differs from player to player is the money, the people and their managers, the automation levels, the airlines, the insides of the terminals, the free plots and the adverts. Each mission saves a snapshot at its start, so it can be replayed for stars without touching the campaign (the campaign keeps the result of the first pass; a replay only improves stars). Between chapters the years jump; a **"Meanwhile…"** card tells what happened in the world and shows the historical projects finished in those years (built by the owner, as they were in reality; the player's choices of options and financing for them come in the next chapter's first mission). A player far behind in money gets an owner's loan to start the next chapter (so no campaign gets stuck), at the cost of the 🏅 for that chapter.

Mission names and years are a first plan; each is checked against history and balanced by `tools/missions-check.js`.

Every mission as built — what the player does and decides, its budget, minutes and stars, what it teaches, the money along the campaign, and proposals for moving the game from the tray to managing teams and systems — is in [spec/missions.md](spec/missions.md) (for developers).

| # | Era | Missions (the exam last) | New things |
|---|---|---|---|
| 1 | **The Forest Field** (1958–1963) · 4–7 min, the exam 10 | Clear the Forest (1958) · First Wheels (14 Dec 1959: school flying, the first landing an SAS Caravelle; stands picked by hand) · The Tower (winter 1959–60) · The First Terminal (ends on 26 June 1960, the first regular flight: an SAS DC-8 to New York) · The First Jets (summer 1960) · The Fuel Truck · First Snow · Make It Pay (1961) · Night Lights · Opening Day, 1 April 1962 · *Exam: The First Winter* (1963) | Map, runway, taxiway, stand, small terminal, tower; manual stands and turnaround; check-in; snow by hand; money basics; noise over Märsta |
| 2 | **The Jet Age** (1963–1979) | Longer for the Jets · Charter Summer (Transair, Sterling to Mallorca) · Hire a Hand · Two Managers · Jumbo! (the 747) · Fire Category · The Wage Round · The Bag Belt · Fog Morning · Crosswind (runway 2) · *Exam: The International Terminal* | People level, managers in pairs, airline choices, upkeep, loans, fire category, the first union round; Free Play opens after it |
| 3 | **Everyone Comes to Arlanda** (1980s) | Linjeflyg Moves In (domestic flights from Bromma) · Morning Peak · Flygbussarna · The Computer Room · Screens · Flu Season · Strike Notice · Planner or Computer? · The Big Freeze · Payback · *Exam: Domestic Rush* | Domestic terminal, peaks, buses and roads, sickness, first systems and their failures, the Ops Center; Challenge Days open after it |
| 4 | **Open Skies** (1990s) | Terminal 2 · Deregulation (new domestic airlines) · The Low-Fare Question · The Train Question (Arlanda Express: own or concession) · Building the Tunnel · Bags by Machine · Duty Free · Route Incentive · Hub Wars (Copenhagen) · Christmas Rush · *Exam: Millennium Night (Y2K)* | Competition, route incentives, rail, the baggage system, payback and NPV |
| 5 | **A New Millennium** (2001–2009) | *As built:* Schengen (2001) · The New Tower · Pier F · Runway Three · Security After 2001 · Taxiway Bridges (2003) · Norwegian Arrives · Remote De-icing · Rent Is Steady (Cargo City) · Liquids in Bags (2006) · *Exam: The Snowy Peak* | Border domain, security rules, parallel runways and bridges, Sky City and real estate, de-icing, random events, integrated systems |
| 6 | **Bigger and Greener** (2010–2018) | *As built:* Swedavia (2010) · The Ash Cloud · A Royal Wedding · Self Bag Drop · Emirates (2013) · The Permit · Nobel Week · Eurovision Week (2016) · Fly Green · A-CDM (2017) · *Exam: Record Summer 2018* | Green rating, permit, energy, biofuel, glycol, the aquifer, e-gates, self bag drop, A-CDM, the Gulf airlines, event peaks; *flygskam* in the last news |
| 7 | **Storm Years** (2020–2024) | *As built:* Empty Skies (2020) · Furlough or Lay Off · Cargo Saves the Day · Coming Back (2021) · Closed Skies (2022) · Clearance Takes Weeks · One Terminal (T4 joins T5) · The Summer of Queues · Cyber Morning (2023) · Fallback Drill (2024) · *Exam: The Day the Screens Went Blue (July 2024)* | Mothballing, furlough vs lay-off, security clearance delays, cyber, fallback readiness tested |
| 8 | **Arlanda 2040** (the player's future) | *As built:* Electric Wings · Charging Stands · Robots on the Apron · Self-driving Ploughs · Hydrogen Morning · Your Pier (the player's answer to the dropped Pier G) · Faces as Boarding Passes · Heatwave 2040 · Night Train or Night Flight · Peak Day 2040 · *Final Exam: Blackout* | Charging stands, self-driving vehicles, the player's own pier design, the final test: the busiest day ever, then a total blackout — the airport must survive on people and hand skills |

The final exam is the game's message: the most automated airport still needs people who know how to do it by hand.

### Mission kinds

- **Build** (plan time) — finish the master plan's project (or its stage) by a date within a budget: the player chooses the order of the stages, the pace, the financing and the options; the building itself is the historical one.
- **Operate** (ops time) — run a period with targets (on-time share, queues, no safety events).
- **Business** (plan time) — meet the mission's money goal (a profit, the last month's result, the shops' or the freight's takings), win an airline.
- **Crisis** (ops time) — survive an event (a storm, a strike, an outage, the ash cloud).
- **Choice** — a mission built around offers in pairs; both paths can win, with different stars.
- **Exam** — the chapter's last mission: everything of the chapter in three stages.

The kind decides the stages, never what can be bought: the buy menu is the same in every kind of mission, in ops and plan time (the bar's buys once depended on the kind and on the hands — a player could not buy a café in an operate mission, but could buy crash tenders ahead in 2-1…2-5 and then see 2-6 end at once).

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

Measured by `tools/missions-check.js`: the reference strategies at Medium, the real minutes of play at ▶ (normal speed) of every stage, with nothing played twice — no time in the Office, on the briefings and stage cards, in paused decisions, at slower speeds, or in retried stages.

- Chapter 1: 11 missions, 66 minutes (6.0 a mission; the exam 9.6).
- Chapters 2–8: 77 missions, about 400 minutes (5.2 a mission; chapter totals 55 · 64 · 61 · 61 · 57 · 50 · 50; the exams 7.4–9.8, the pure plan missions 1.1–2.7).
- The campaign: **≈ 7.8 hours at ▶**.

A first pass takes longer than that by the Office, the reading and the retries, which are not measured; at about four missions a day the campaign lasts about three weeks. ★★★, the 🏅, Challenge Days and Free Play go beyond. The checker keeps every mission within `MISSION_MINUTES_MAX` (10) and every stage within `STAGE_MINUTES_MAX` (4).

## Free Play and Challenge Days

- **Free Play** (opens after chapter 2): any era as a start (the forest, 1983, 2003, today), any difficulty, the campaign's unlocked tech; an endless calendar with rolling goals and the Offers board; saved like the campaign; the Album and the Archive keep filling. A **Today's Arlanda** start gives the real airport of the latest chapter to run. *As built in session 3:* three eras (1963, 1976, 1990), rounds of a month of offers and a peak, no stars — see "People, systems, chapters 2–3, Free Play and the cloud (session 3)" in [spec/sim.md](spec/sim.md); session 4 added 2000, session 5 2009, session 6 2024. *Planned:* a non-stop Free Play from the forest to 2040 that replaces the rounds (a played day stands for a month, adaptive pace, eras with a dependency graph, a market, checkpoints, a balance bot) — the design and the step plan are in [spec/freeplay.md](spec/freeplay.md); each step moves what it builds into this spec.
- **Challenge Days** (open after chapter 3): longer fixed scenarios (20–60 min) with a score and three stars — a whole record day, Christmas week, the ash cloud week, the blackout — saved at any moment. *As built in session 4:* Christmas Week 1989, The Great Snow 1987 and Record Day 1999, about 22 minutes each — see "The terminals, brands, the economy screens, chapter 4 and Challenge Days (session 4)" in [spec/sim.md](spec/sim.md).

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
- **Desktop:** click and drag like touch; right or middle drag and the arrow keys pan, the wheel zooms at the pointer. Keys by their place (work on a Russian layout): **Space** pause / play, **1–4** speeds, **5 / 6 / 7** the buy menu's Services, Vehicles, Build (Esc closes it), **N** skip to next event, **R** roofs on / off, **T** terminal view, **O** Ops Center, **F** finance, **P** people, **A** airlines, **Q** the oldest task, **Esc** back / pause. Menus: arrows move the focus, Space / Enter press the focused (or default) button.
- Mouse cursor hidden in fullscreen while still; updates and offline: see "Offline and install".

## Saved in the browser

`arlandaRising.campaign.v1` (the airport, calendar, people, airlines, money, and in `S.stats` the analytics' history: `sim/stats.js`, rows of whole numbers — the last `STATS_RECENT_MAX` points of the ops stages' quarter hours and the plan stages' days, and `STATS_MONTHS_MAX` months — about 6–8 kB; the replays' snapshots leave it out), `arlandaRising.mission.v1` (the running mission's full state and its stage checkpoints — written every `AUTOSAVE_SECONDS`, at each stage's end and on `visibilitychange` / `pagehide`; cleared when the mission ends), `arlandaRising.snapshots.v1` (each mission's starting state, compressed), `arlandaRising.progress.v1` (stars per mission per difficulty, hint 3 used, 🏅, Archive cards, Album), `arlandaRising.freeplay.v1` (Free Play's airport, its era and round), `arlandaRising.challenges.v1`, `arlandaRising.settings.v1` (hints, quality, sums in full or short, the roofs on or off, whether Skip's banner was shown once), `arlandaRising.difficulty`, `arlandaRising.sound`, `arlandaRising.lang`; for the cloud save `arlandaRising.cloud` (the Google account the progress syncs with) and `arlandaRising.auth` (its session, kept by supabase-js). Every key starts with `arlandaRising.`; the game never clears anything else on the origin.

## Cloud save (sync through Google)

Optional, on top of `localStorage`, built like `lift-logic`'s and following `docs/cloud-save.md` in full: what is synced, the merge, the start screen, the table and "The cloud save as built" are in **[spec/cloud-save.md](spec/cloud-save.md)** — read it before touching `core/save.js`, `core/cloud.js` or `supabase/`.

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

- `sim/` is deterministic from a seed and has no DOM: a whole mission runs in Node.
- **After any change to `sim/`, `constants.js` or `data/` run `node arlanda-rising/tools/missions-check.js [mission id…] [--verbose] [--money]`** (everything in about half a minute): every mission with its reference strategy at every difficulty; it must stay green.
- Every checker (`missions-check`, `terminals-check`, `turnaround-check`, `layout-check` and the rest), what each one fails on, the browser recipes that put the game into a state and the screenshot and showcase recipes are in **[spec/testing.md](spec/testing.md)** — read it before testing, balancing or debugging.

## Files

Those in code are listed by name; the rest are planned.

```
arlanda-rising/
├── SPEC.md
├── index.html, styles.css, constants.js (every tuning value, the difficulty table, the screen's and the hints' numbers)
├── game.js (the main loop, the flow, the gestures, the keys and the cheats, the autosave), progress.js (stars, the campaign, snapshots)
├── data/        aircraft.js (the types of the era, with sources), airlines.js (real airlines: years at Arlanda, kind, temper,
│                liveries by era, sources), buildings.js (what the airport owns: price, jobs, shops and the cells they take, car parks), masterplan.js (the
│                historical projects: year, plot, stages, mods, effects, sources), layout.js (the map: the real runways, the apron
│                and stands, buildings, roads, Märsta, fields, lakes, the site's clearings), domains.js (the automation ladder; levels
│                0–2), people.js (departments, unions, managers), missions/missions.js (the chapters, the list of missions and the
│                fields) + missions/ch1.js, ch2.js, ch3.js, strategies/strategies.js (the list) + strategies/ch1.js, ch2.js, ch3.js
│                (the reference strategies), lang-ru.js, lang-sv.js, icons.js (generated by tools/icons-build.js);
│                session 4: terminals.js (the terminals' units and the cells for the airport's own shops), brands.js (the real shops, cafés and services, with
│                their years in Sweden), missions/ch4.js, strategies/ch4.js, challenges.js (the Challenge Days);
│                session 5: events.js (the random events), missions/ch5.js, ch6.js, strategies/ch5.js, ch6.js;
│                session 6: missions/ch7.js, ch8.js, strategies/ch7.js, ch8.js; sites.js (the buildings' and vehicles' cards);
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
│                random events, the ash cloud), green (the green rating, energy, biofuel, the permit), fleet (what each fuel
│                truck and plough did, for their cards), stats (the history of the meters, the green rating, the staff, the
│                departures, noise and close calls for the analytics tabs; read by nothing in the sim); planned: taxi,
│                wildlife, debrief
├── art/         emblems.js (airline fin art and square logos), brands.js (the brands' signs), flag-gb / flag-ru /
│                flag-se.svg (the language switcher)
├── render/      palette.js (the Arlanda palette, the land by season), iso.js (projection, camera, boxes), fence.js (the airside
│                fence worked out from what is built), vehicles.js (the ground vehicles built of simple solids), ground.js (forest,
│                fields, lakes, the bog, clearings, roads, the E4 and its bridge over the road in, Märsta, single trees), airport.js (runways 1 and 2, taxiways, aprons,
│                stands, the ploughs' standing and the fuel yard, the terminals and buildings by stage, cranes, lamps), aircraft.js (types to scale in their liveries), traffic.js (where every
│                flight is, vehicles, people, the plough convoy, labels and turnaround bars, taps), sky.js (light, fog, snow,
│                lamps), map.js (the scene, a frame, what a tap hit, the camera's framings), terminal.js (the Terminal
│                view's cut-away plan), interiors.js (the map's buildings with the roofs off)
├── ui/          text.js (goals, tasks, meters, minutes, effects), screens.js (overlay panels, the start screen, help, settings,
│                pause, confirm, the difficulty picker), hud.js, tray.js, toolbar.js (the bar: its live part), buymenu.js (the bar's buy menu: Services, Vehicles, Build and their sheet), plan.js (the plan panel, decisions),
│                cards.js (the flight card), sitecard.js (the card of a building, a fuel truck or a plough), timeline.js, missioncard.js (and the card before each stage, and the running mission's info from the pause menu), results.js (the stage
│                card, the results, the newspaper), office.js, people.js (the People screen), opscenter.js (the Ops Center),
│                hints.js (Kaj, the finger), sounds.js, terminalview.js (the Terminal view), finance.js (Finance and its
│                chart), analytics.js (Finance's tabs for the meters and the green rating), airlines.js (Airlines, the Offers board), challenges.js (the Challenge Days and their results);
│                planned: archive, album
├── tools/       missions-check.js, debug-mission.js (one mission flight by flight), turnaround-check.js (the turnaround's bar and card against the sim), terminals-check.js (the terminals through the years), layout-check.js (the map's geometry,
│                and the plan docs/layout.svg), map-shots.js (the map in its eras, for tools/cdp.js), screens-shots.js (the text screens at four sizes, with an overflow check), inside-shots.js (the roofs off and the cards at four sizes), shops-shots.js (the own shops in the terminals' cells, sold and bought, from the roofs and the card), buymenu-shots.js (the buy menu at four sizes, with an overflow check), showcase-slides.js (the slides of docs/showcase.gif for tools/showcase.js)
├── README.md, README_RU.md, README_SV.md (with the not-affiliated note, how to install)
├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png (tools/pwa-icons.sh)
├── manifest.webmanifest, sw.js (generated by tools/sw-build.js), screenshot.png (the gallery card)
├── docs/        showcase.gif (the eras from 1958 to 2040 at the top of the READMEs, English UI; tools/showcase-gif.js),
│                layout.svg (the plan of the map from above, written by tools/layout-check.js --svg), left out of the offline
│                worker
├── spec/        the parts of this spec by area (see "The spec's files" at the top); left out of the offline worker
```

## Build order (sessions)

1. **Core sim headless** *(done)*: calendar, weather, schedule, runways, stands, turnaround, passengers as flows, finance, stages and the autosave/resume; chapter 1 missions with reference strategies; `missions-check.js`.
2. **Map and look** *(done)*: isometric renderer with the Arlanda palette, seasons and light, aircraft with real liveries and emblems, vehicles, build tools, the task tray, the Office; chapter 1 playable end to end on a phone; **installable and offline** (manifest, icons, `update.js`, `sw.js`); gallery card, root `SPEC.md` and READMEs.
3. **People and the ladder** *(done)*: departments, managers in pairs, absence, unions and strikes, the Ops Center, systems and failures; chapters 2–3, Free Play; **the cloud save through Google** (the table, the sync, the states, tested with `tools/cloud-mock.js`).
4. **Terminal view, brands and the economy screens** *(done)*: passenger flow, real shops and ground transport, finance with payback and NPV, offers, airlines' tempers; chapter 4, Challenge Days.
5. **Chapters 5–6** *(done)*: border, security, parallel runways, de-icing, real estate, green rating and the permit, events.
6. **Chapters 7–8** *(done)*: crises, fallback readiness, the future tech, the final exam.
7. **Translations, icons, READMEs, screenshot** *(done)*: kept up to date from session 2 on; checked for chapters 1–8 (every text translated, the icons built, the READMEs telling all eight chapters), and the screenshot taken anew on the airport of 2018.

## Decisions

Settled:

- **Name:** Arlanda Rising, folder `arlanda-rising`.
- **Real airlines with emblems and real brands** (Swedavia, LFV, Arlanda Express, Flygbussarna, SL, SJ, taxis, shops, hotels), drawn as simplified pictures, shown respectfully; people fictional; the not-affiliated note in the READMEs.
- **Isometric** Canvas 2D graphics.
- **Missions at most ~10 minutes**, in stages, autosaved every few seconds and resumed exactly; the campaign planned at 20 hours, measured at about 7.8 hours of missions at ▶ ("How long it lasts"); longer play through Next mission, Keep the shift going, Challenge Days and Free Play.

- **One airport through the campaign, growing by the historical master plan:** the architecture, the sites and the look of the big structures follow the historical checkpoints; the player has freedom within each mission's frame (order, pace, financing, options, the insides, free plots) and full freedom in small things (adverts and banners, which airlines to court, shops); the 2040 chapter loosens the frame; Free Play has none.

- **Every sum in Swedish kronor (SEK)**: "SEK" or "kronor / крон / kr" by the language.
- **Sync through Google** like the other games (optional, `docs/cloud-save.md`), the running mission included, so play goes on from the phone to the computer; **installable and fully offline** like every app in the repo (`docs/pwa.md`).
- **The youngest player is 10 and reads well:** mission cards, concept cards and hints are written in full, plain sentences (no baby talk, no walls of text: a briefing at most three bubbles, a concept card at most about 60 words); every number the goals need is shown on the main screens; the deeper finance (NPV, the cash-flow what-ifs) sits behind *Details*, closed by default, its state remembered.
- **Many real shops and cafés** the family knows (Joe & The Juice, Hawaiian Poké, Sushi Yama and the rest of the catalogue), chosen freely by the player for the terminal's units.
