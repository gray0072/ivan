# Arlanda Rising — the missions: structure, budgets, what the player learns

For developers. What the 88 missions of the campaign ask of the player, what they cost, what they teach, and where the game should go now that the task tray is quiet for most of it. The rules themselves are in `SPEC.md` (linked by section); the missions' data is in `data/missions/ch1.js` … `ch8.js` (fields: the header of `data/missions/missions.js`), the reference solutions in `data/strategies/`.

**Where the numbers come from.** The campaign played by the reference strategies at Medium, mission after mission with the airport carried over (`node arlanda-rising/tools/missions-check.js --verbose --money`): the minutes at ▶, the stars, the owner's budget, the cash, the debt and the loan room at each mission's start and end. The task counts (who did the work) and the "what if the player did less" variants were measured with throwaway scripts over the same sim (not in the repo). Numbers are as of the commit that adds this file; re-run the checker after any balance change.

Units: MSEK; **bn** = 1 000 MSEK. "Cash" is `S.money`, "debt" `S.loans`, "room" `Finance.room()` (what can still be borrowed).

---

## 1. The campaign's arc

The design (SPEC "Idea", "Manual, people, systems: the automation ladder"): **hands → people → systems → integrated**, and at the end the lesson that the machine still needs people who can work by hand. Measured, the shift happens much earlier than the chapters suggest: the tray is the game for chapter 1 and the first two missions of chapter 2; from **2-3 Hire a Hand** on, teams do the tasks and the tray comes back only in a few "by hand first" stages and crises.

| Ch | Years | The player's main job | New mechanics | Taken out of the player's hands | Tray tasks you / teams / systems (reference, whole chapter) |
|---|---|---|---|---|---|
| 1 The Forest Field | 1958–1963 | **Hands**: stands, desks, fuel, ploughs; first builds and money | Plan and ops time, the tray, stands, check-in, fuel, snow, the buy menu, loans, fees, payback, noise | nothing — everything is by hand | **241** / 0 / 0 |
| 2 The Jet Age | 1963–1979 | **Hiring**: the first teams and heads; big projects on loans | Teams (level 1), heads in pairs, the wage round, fire category, the first system (belts), the fallback team, ILS, runway 2 | stands, turnaround, check-in (2-3); snow (2-4); bags (2-8) | 94 / 482 / 60 |
| 3 Everyone Comes to Arlanda | 1980s | **Running systems**: IT, failures, keep or lay off, absence, strikes | Systems (level 2) and their IT, failures and fallback, readiness and drills, the generator, temps, overtime, strike notice, payback | stand allocation, screens, clearing plan, check-in computers | 21 / 686 / 815 |
| 4 Open Skies | 1990s | **Commercial director**: brands, airlines, fees, the train | Shops and brands, security lanes, incentives, rivals, the train deal, NPV, bar-code sorter (level 3) | bags to level 3; Y2K tests the fallback | 29 / 520 / 1 266 |
| 5 A New Millennium | 2000–2009 | **Builder of capacity**: border, runway 3, de-icing, real estate | Border domain, security domain and clearance, two runways, de-icing ladder, rents, random events | border (police planner), security (sensors), de-icing (pads) | 86 / 774 / 1 525 |
| 6 Bigger and Greener | 2010–2018 | **Strategist**: owner, permit, green rating, event peaks | Green rating, permit, energy, biofuel, self bag drop, A-CDM, e-gates | check-in and stands to level 3; e-gates | 64 / 582 / 2 132 |
| 7 Storm Years | 2020–2024 | **Crisis manager of people and resilience** | Demand, mothballing, furlough / lay-off, leavers and rehiring, clearance lead time, cyber, outages, drills tested | — (teams are cut; the tray returns when they are short) | 134 / 468 / 1 625 |
| 8 Arlanda 2040 | 2025–2040 | **Designer of the future**; the final test of readiness | Charging, robots, self-driving ploughs, hydrogen, biometric boarding, your pier, heat, blackout | turnaround (robots), snow (level 3), border (level 3) | **0** / 406 / 2 298 |

- **Where the clicking peaks:** chapter 1 (1-11: 60 tray tasks, 1-10: 41, 1-6: 40), then 2-1 and 2-2 (28 each, before the first teams).
- **Where it falls away:** from 2-3. Measured: without the tray (left to the duty manager) and with no move at all in ops time — only the decisions and the plan-time moves — the reference keeps ★★★ in **64 of the 77 missions of chapters 2–8**. The ops stages there are watched, not played.
- **Where it comes back:** the deliberate "by hand first" stages (2-8 bags, 3-4 announcements, 4-4's evening with two lanes shut, 5-8 de-icing trucks) and three late missions where the **ramp team is short** and fuel tasks fall to the tray: 6-11 (64 fuel taps: the July holidays), 7-8 (61) and 7-11 (57; the ramp team cut since 7-6 is never refilled). That clicking is a staffing problem answered by tapping.
- **What the player's role becomes:** a director managing teams, heads, systems, money and risk. The data already models all of it (`sim/people.js`, `sim/systems.js`); section 5 shows how little of it the missions ask for.

---

## 2. Mission kinds and the anatomy of a mission

**Kinds** (SPEC "Mission kinds"): build 25 · operate 24 · choice 13 · business 10 · crisis 8 · exam 8. The kind shapes the stages, never the buy menu.

| Kind | Typical stages | The player's work |
|---|---|---|
| build | plan (the project's stages, pace, options, financing), then an ops stage using it | order of stages, pace, mods, loan or grant |
| operate | one or two ops stages, often a short plan stage first | the decision of the plan stage; the tray when the domain is by hand |
| business | two or three plan stages (60–90 days), no ops | offers in a row; the goal is profit or the last month |
| crisis | an ops stage with a scripted event (snow, strike, ash, cyber) | preparation in plan time, then riding it out |
| choice | a plan stage with a decision in pairs or threes, then an ops stage | the decision; both paths pass with other stars |
| exam | three ops stages (or plan + two ops) with the chapter's events | everything of the chapter |

**Stages** (`stages[]`): `ops` — a clock window of 2¼–3 hours, flights, weather, scripted `events` (≈ 3–4 min at ▶); `plan` — days at a day a second, crews, `choices` (time stops until one is picked), `endEarly` when its goal is met. Each stage start is a checkpoint: a failed stage is retried, not the mission (SPEC "Sessions"). A stage's `date` jumps the calendar forward only (`Missions.beginStage`), never back — see the calendar slips in section 6.

**Goals and stars** (SPEC "Stars", `sim/goals.js`): every stage has its own goals (all must pass); the mission's `goal` must pass for ★; the two `stars` goals add one star each (not ordered: either one gives ★★). Doing nothing must fail every mission; the reference must get ★★★ on Easy and Medium (`tools/missions-check.js`).

**Hands** (`hands`): the kinds of tray task the mission lets the player do; a domain with a team or system does its own.

**Unlocks** (SPEC "What the campaign opens"): a small build is opened by the mission that teaches it (`unlocks`) and locked before it; a goal about adding something is never met at a mission's start.

**Budget, owner, loans** (SPEC "The owner"): `setup.budget` (× the difficulty's money: Easy 1.5, Medium 1, Hard 0.75) is booked at the start; `setup.minMoney` tops the cash up (matters only after a cheat's jump: from 5-2 on every mission has 300 MSEK, the reference has billions); `setup.loanLimit` sets the room on top of the debt (it stays the limit until a later mission sets another, or the airport's worth — 8 % of it, at least 20 MSEK — is bigger). Money goals count cash less debt. Below zero for `DEBT_MONTHS` (6 / 4 / 3) months fails the stage. A campaign that starts a mission below zero gets the owner's loan (never needed by the reference).

**What carries over:** the whole airport — cash and debt, buildings, vehicles, teams, heads, systems and their readiness, brands, airlines and their moods. Between missions the calendar runs in summary ("Meanwhile…"): traffic earns, wage rounds settle at `WAGE_DRIFT`, heads retire or are poached, the owner builds the `requires` projects, `setup.domains` raises levels to the owner's arrangement and `setup.items` tops vehicles up (told on the first stage card). The money earned "meanwhile" is most of the campaign's money (section 4).

---

## 3. Mission by mission

Columns: **Min** — minutes at ▶ (Medium reference). **Budget** — owner's budget · cash at the start · loan room (Medium reference, MSEK; — = none). **Does** — what the player does. **Decides** — the key decisions (the reference's pick in brackets). **Learns** — the lesson. **★ · ★★ · ★★★** — the key goal to pass (the mission's `goal`, or the stage goal that carries the lesson; — = only the usual stage goals: on time, delay, nothing lost) and the two star goals ("delay" = airport-caused delay in minutes, "wait" = check-in wait in minutes, money in MSEK).

### Chapter 1 — The Forest Field (1958–1963): hands

| # | Mission (year) | Kind | Min | Budget | Does | Decides | Learns | ★ · ★★ · ★★★ |
|---|---|---|---|---|---|---|---|---|
| 1-1 | Clear the Forest (1958) | build | 5.5 | 95 · 95 · 30 | orders four clearing jobs for two crews | sell or burn the timber (sell); keep the tree belt (keep); borrow (20) | plan time, crews, winter pace, money against Neighbours | site cleared · own money ≥ 10 · Neighbours ≥ 75 |
| 1-2 | First Wheels (1959) | operate | 6.0 | — · 29 · 18 | a stand for each training sortie (14 tray tasks) | which stand, before dusk | the tray, deadlines, stand sizes | delay ≤ 3 · nothing to the duty manager · delay ≤ 1 |
| 1-3 | The Tower (1960) | build | 4.8 | 52 · 80 · 18 | builds the tower, then a denser sortie morning | heated tents or a fast pace; backup radio | pace against the price of options | tower · spent ≤ 44 · Safety ≥ 84 |
| 1-4 | The First Terminal (1960) | build | 4.6 | 76 · 116 · 12 | the hall and the fire station (category 7), then desks and the waiting room; checks in the first DC-8 | a second crew (no); order of jobs; a kiosk | the fire category, desks, a deadline | on time ≥ 80 % · a kiosk · wait ≤ 10 |
| 1-5 | The First Jets (1960) | operate | 6.0 | — · 67 · 15 | stands (DC-8s only on 1–2) and desks (19 tasks) | desks open before the queue | stand codes, queues | — · on time ≥ 92 % · wait ≤ 9 |
| 1-6 | The Fuel Truck (1960) | operate | 6.2 | — · 67 · 15 | fuels by hand with one truck (40 tasks) | buy a second truck (yes, 1.2) | vehicles are capacity; the buy menu | — · delay ≤ 1.5 · Airlines ≥ 85 |
| 1-7 | First Snow (1960) | crisis | 6.1 | 4.5 · 70 · 15 | buys ploughs in 21 days, then clears snow by hand (27 tasks) | two or four ploughs (four, from savings) | invest before the event | 2 ploughs · no close call · on time ≥ 85 % |
| 1-8 | Make It Pay (1961) | business | 4.2 | — · 58 · 16 | three 80-day plan stages | café / kiosk (café, on a 5 loan); charters (yes); car park (no); fee level | profit, payback, fees against airlines | profit ≥ 0 · ≥ 6 · Airlines ≥ 65 |
| 1-9 | Night Lights (1961) | operate | 6.7 | 10 · 80 · 11 | builds the lights; a dark evening and a night (24 tasks) | runway direction that spares Märsta | night ops, noise | lights · nothing sent away · Neighbours ≥ 62 |
| 1-10 | Opening Day (1962) | operate | 6.7 | 12 · 74 · 12 | a busy day by hand (41 tasks), stand 1 closed 11–13 | a remote stand in a hurry (yes) | slack for the unexpected | — · delay ≤ 2 · Passengers ≥ 72 |
| 1-11 | Exam: The First Winter (1963) | exam | 9.6 | — · 72 · 13 | everything by hand in snow and dark (60 tasks) | two more ploughs, a remote stand | the limit of one pair of hands | — · delay ≤ 2 · no close call |

### Chapter 2 — The Jet Age (1963–1979): people

| # | Mission (year) | Kind | Min | Budget | Does | Decides | Learns | ★ · ★★ · ★★★ |
|---|---|---|---|---|---|---|---|---|
| 2-1 | Room for the Jets (1965) | build | 4.6 | 55 · 120 · 90 | paves the jet apron; a summer morning by hand (28) | haul the earth or a noise bank (haul); borrow 30 | a project on a loan, a spending cap | — · delay ≤ 2 · spent ≤ 75 |
| 2-2 | Charter Summer (1967) | choice | 5.0 | 10 · 99 · 60 | signs charters; a Saturday by hand (28) | Transair, Sterling, both, none (both); two desks | seasonal airlines: profit against queues | profit ≥ 3.5 · ≥ 4.5 · wait ≤ 6 |
| 2-3 | Hire a Hand (1968) | operate | 3.9 | — · 129 · 60 | hires the first teams; the tray empties | which team first (stands, then ramp and desks) | level 1: a team takes a whole kind of task, for wages | — · delay ≤ 2 · teams ≥ 30 tasks |
| 2-4 | Two Managers (1969) | choice | 3.8 | — · 180 · 60 | picks heads from pairs | ops head Karin / Lars; snow chief Bo / Anna (Karin, Bo) | a head's perks and flaw | a snow team · an ops head · on time ≥ 90 % |
| 2-5 | Jumbo! (1971) | build | 3.9 | 25 · 256 · 60 | the E stand for the 747, fuel trucks | the jumbo fee (yes); two trucks, desks | big aircraft need stands and vehicles | — · wait ≤ 9 · Airlines ≥ 72 |
| 2-6 | Fire Category (1971) | operate | 4.0 | — · 273 · 60 | two crash tenders for category 9; an emergency | a fire drill (yes) | the fire category | category 9 · Safety ≥ 82 · on time ≥ 85 % |
| 2-7 | The Wage Round (1972) | choice | 4.0 | — · 279 · 60 | answers the union | accept, counter 4.5 % or 3 %, mediator, refuse (counter 4.5) | unions, morale, a strike's cost | — · no strike · Staff ≥ 62 |
| 2-8 | The Bag Belt (1973) | build | 7.5 | — · 343 · 60 | bags by hand (15), the hall, the belts straight from the hands; a jam | belts (30); handlers hired back as the fallback (yes) | a system's price, its failure, the fallback | ≤ 12 / ≤ 6 bags lost · ≤ 6 · Passengers ≥ 70 |
| 2-9 | Fog Morning (1974) | build | 4.2 | — · 380 · 60 | the ILS; a fog morning | low-visibility procedures (yes) | equipment against weather | ILS · nothing sent away · on time ≥ 70 % |
| 2-10 | Crosswind (1975) | build | 5.8 | 60 · 431 · 300 | runway 2 with the grant and a loan (100) | spare the forest (yes); financing | a big project's financing; a second runway | runway 2 · on time ≥ 85 % · Neighbours ≥ 66 |
| 2-11 | Exam: The International Terminal (1976) | exam | 8.2 | 60 · 465 · 300 | the terminal on a 200 loan; an emergency, a jam, a gale | the loan; trucks | the chapter in one | — · delay ≤ 2 · Passengers ≥ 72 |

### Chapter 3 — Everyone Comes to Arlanda (1980s): systems

| # | Mission (year) | Kind | Min | Budget | Does | Decides | Learns | ★ · ★★ · ★★★ |
|---|---|---|---|---|---|---|---|---|
| 3-1 | Linjeflyg Moves In (1983) | build | 4.5 | 40 · 0.80 bn · 150 | the domestic terminal (on a 100 loan) | Linjeflyg's terms (yes) | an airline deal | — · delay ≤ 2 · Airlines ≥ 75 |
| 3-2 | Morning Peak (1984) | operate | 7.5 | — · 0.82 bn · 50 | a head for terminal service; a morning peak | Maja (reads the departures) / Erik / nobody (Maja) | a head changes how a team works | max wait ≤ 7 · wait ≤ 3 · on time ≥ 90 % |
| 3-3 | The Computer Room (1984) | build | 4.2 | 20 · 0.92 bn · 50 | IT department, the room with backup, the stand computer; it fails | IT head Mira / Jonas (Mira); keep or lay off the planners (keep) | systems need IT; failure falls to the team | stands level 2 · delay ≤ 2 · Passengers ≥ 78 |
| 3-4 | Screens (1985) | build | 7.3 | — · 0.93 bn · 50 | announcements by hand (13), a PA operator, screens | keep the operator (yes) | the information domain | — · ≤ 1 not announced · Passengers ≥ 74 |
| 3-5 | Flu Season (1986) | crisis | 3.8 | — · 1.05 bn · 50 | temps and overtime against the flu | temps for ramp / desks / bags (ramp); overtime | absence, temps, fatigue | — · ≤ 3 tasks by hand · on time ≥ 85 % |
| 3-6 | Strike Notice (1986) | choice | 3.6 | — · 1.16 bn · 50 | a ramp strike in nine days | settle, mediator, ride it out (mediator) | what a strike costs | — · no strike · delay ≤ 3 |
| 3-7 | The Big Freeze (1987) | crisis | 7.6 | — · 1.17 bn · 50 | the clearing plan; it fails in the cold | keep or lay off the snow team (keep) | readiness, the fallback | snow level 2 · no close call · on time ≥ 85 % |
| 3-8 | Planner or Computer? (1987) | choice | 8.0 | — · 1.26 bn · 50 | check-in computers or a course and four desks | computer / train / none (computer) | when automation pays | — · wait ≤ 2 · on time ≥ 90 % |
| 3-9 | Payback (1988) | business | 3.7 | — · 1.31 bn · 50 | three 70-day plan stages | duty free, a car park, a second restaurant (all) | the last month's result, payback | last month ≥ 17 · ≥ 20 · Airlines ≥ 70 |
| 3-10 | Flygbussarna (1989) | choice | 4.2 | — · 1.51 bn · 50 | coaches or a car park | stops / parking (stops) | ground transport and the neighbours | Neighbours ≥ 74 · Passengers ≥ 92 · on time ≥ 90 % |
| 3-11 | Exam: Domestic Rush (1989) | exam | 9.7 | — · 1.70 bn · 50 | snow, flu, a power cut, a failing computer, an emergency | generator, a drill, overtime | resilience | — · delay ≤ 2 · Passengers ≥ 74 |

### Chapter 4 — Open Skies (1990s): commerce

| # | Mission (year) | Kind | Min | Budget | Does | Decides | Learns | ★ · ★★ · ★★★ |
|---|---|---|---|---|---|---|---|---|
| 4-1 | Domestic 2 (1990) | build | 4.9 | 60 · 1.80 bn · 250 | builds Domestic 2; lets eight units | who moves in (SAS); which brands | shops, rent, spend per passenger | T2 and 4 brands · brands ≥ 60 k · wait ≤ 4 |
| 4-2 | Deregulation (1992) | business | 4.6 | — · 2.09 bn · 250 | a new domestic airline | Transwede (yes); fee level (normal) | competition, fees against airlines | Transwede 4 a day · on time ≥ 90 % · Airlines ≥ 80 |
| 4-3 | The Train Question (1994) | choice | 2.1 | — · 2.48 bn · 250 | two 60-day plan stages | own line / concession / wait (concession); car park (no) | concession against own money | decided · last month ≥ 20 · Neighbours ≥ 72 |
| 4-4 | Duty Free (1995) | business | 9.1 | — · 2.75 bn · 250 | two lanes shut: the tray (20); then lanes, duty free, brands | five lanes; duty free (yes); brands | fast queues earn twice | ≤ 5 to the duty manager · security wait ≤ 8 · brands ≥ 3 M |
| 4-5 | Building the Tunnel (1995) | build | 2.7 | 40 · 2.81 bn · 2 500 | tunnel, line, stations | temporary car park or buses (car park) | a megaproject with a partner | the train · Passengers ≥ 76 · Neighbours ≥ 72 |
| 4-6 | Route Incentive (1996) | business | 4.2 | — · 3.21 bn · 2 500 | Braathens' Oslo route | 10 / 25 / 50 % off (25) | route incentives | 3 a day · Braathens ≥ 77 · on time ≥ 90 % |
| 4-7 | Bags by Machine (1997) | build | 8.2 | 20 · 3.39 bn · 2 500 | the belts fail; the sorting hall, the bar-code sorter, three IT people; it fails | keep the handlers; IT size | level 3; IT sizing | baggage level 3 · ≤ 30 bags lost · Passengers ≥ 90 |
| 4-8 | The Low-Fare Question (1997) | choice | 4.0 | — · 3.37 bn · 2 500 | a low-fare airline or the fees for all | invite / no / later (invite) | low-cost crowds who shop | answered · brands ≥ 50 k · Airlines ≥ 72 |
| 4-9 | Hub Wars (1998) | operate | 5.9 | — · 3.91 bn · 2 500 | a transfer wave; Copenhagen pulls SAS | incentive / fees / none (incentive) | rivals | SAS ≥ 70 · Airlines ≥ 80 · delay ≤ 3.5 |
| 4-10 | Christmas Rush (1998) | operate | 7.5 | — · 4.03 bn · 2 500 | charters, snow, the shops' Christmas | BRIO / Max / units by hand (Max) | seasonal takings | brands ≥ 2 M · Passengers ≥ 88 · brands ≥ 2.5 M |
| 4-11 | Exam: Millennium Night (1999) | exam | 7.7 | — · 4.34 bn · 2 500 | Y2K: untested systems stop at midnight | test (25) or trust (test) | testing against trust; the fallback | — · delay ≤ 3 · Passengers ≥ 85 |

### Chapter 5 — A New Millennium (2000–2009): capacity

| # | Mission (year) | Kind | Min | Budget | Does | Decides | Learns | ★ · ★★ · ★★★ |
|---|---|---|---|---|---|---|---|---|
| 5-1 | Schengen (2001) | build | 4.6 | 60 · 4.80 bn · 400 | a new floor and booths by 25 March | who opens the booths: police / booths / self (police) | the border domain | — · border wait ≤ 3 · Passengers ≥ 85 |
| 5-2 | The New Tower (2001) | build | 5.1 | — · 5.00 bn · 400 | fits out the tower by 23 December | lower fees after 11 September (yes) | fees in a downturn | — · delay ≤ 2.5 · Airlines ≥ 75 |
| 5-3 | Pier F (2002) | build | 3.9 | — · 4.93 bn · 400 | the pier and its jet bridges; a long-haul wave | the bridges | contact stands | — · Airlines ≥ 80 · Passengers ≥ 86 |
| 5-4 | Runway Three (2002) | build | 1.9 | 100 · 5.09 bn · 1 500 | runway 3 before the winter | the grant; insulate Väsby or routes (insulate) | a megaproject and its neighbours | — · spent ≤ 1 350 · Neighbours ≥ 75 |
| 5-5 | Security After 2001 (2002) | operate | 7.7 | — · 4.46 bn · 1 500 | lanes under the new rules; a team before its clearance | a team (yes); head Leila / Göran (Leila) | clearance lead time | — · security wait ≤ 4 · Passengers ≥ 85 |
| 5-6 | Taxiway Bridges (2003) | build | 4.4 | — · 4.49 bn · 1 500 | two bridges; the first two-runway morning | the bridges' options | parallel runways | 3 runways · on time ≥ 90 % · delay ≤ 4 |
| 5-7 | Norwegian Arrives (2003) | choice | 4.1 | — · 4.02 bn · 1 500 | Norwegian's terms; random events from now | 30 % / half / no (30 %) | low-cost growth | Norwegian 4 a day · brands ≥ 12.5 M · Airlines ≥ 92 |
| 5-8 | Remote De-icing (2004) | build | 8.1 | — · 4.50 bn · 1 500 | trucks by hand in the frost (32), a crew, the pads | trucks, crew, pads | the de-icing ladder in one mission | de-icing level 2 · delay ≤ 4 · Passengers ≥ 85 |
| 5-9 | Rent Is Steady (2006) | business | 3.1 | — · 4.68 bn · 1 500 | Cargo City and its offices | hotel wing (yes); a Sky City shop (O'Learys) | real estate | rents ≥ 5 M · ≥ 6 M a month · last month ≥ 44 |
| 5-10 | Liquids in Bags (2006) | operate | 7.8 | — · 4.54 bn · 1 500 | the liquids morning; queue sensors and lanes for Christmas | sensors (keep the team); four lanes | the security system | — · security wait ≤ 5 · brands ≥ 150 k |
| 5-11 | Exam: The Snowy Peak (2009) | exam | 9.8 | — · 5.42 bn · 1 500 | snow on two runways, de-icing, border, a security strike with the sensors down, a power cut | none (the tray: 31) | the chapter in one | — · delay ≤ 3 · Passengers ≥ 82 |

### Chapter 6 — Bigger and Greener (2010–2018): strategy

| # | Mission (year) | Kind | Min | Budget | Does | Decides | Learns | ★ · ★★ · ★★★ |
|---|---|---|---|---|---|---|---|---|
| 6-1 | Swedavia (2010) | business | 4.1 | — · 5.90 bn · 1 500 | the new owner; the green rating appears | colours now / later (now); target: fees high / flights / wait (flights) | the owner, the green rating | Swedavia, a target · Staff ≥ 67 · Passengers ≥ 92 |
| 6-2 | The Ash Cloud (2010) | crisis | 7.9 | — · 5.90 bn · 1 500 | gets the last flights out; the stranded | cots / hotels / nothing (hotels); cafés open (yes) | stranded passengers | mood ≥ 80 in the days, ≥ 75 · wait ≤ 3 · Passengers ≥ 96 |
| 6-3 | A Royal Wedding (2010) | operate | 4.1 | — · 5.91 bn · 1 500 | the guests' aircraft stay for days | remote / pier / later (pier) | stand planning for stays | planned · delay ≤ 3 · Passengers ≥ 88 |
| 6-4 | Self Bag Drop (2012) | operate | 8.0 | — · 7.28 bn · 1 500 | the full hall; the bag drop | keep the desk staff (keep) | level 3 and the staff's morale | check-in level 3 · wait ≤ 2.5 · Staff ≥ 60 |
| 6-5 | Emirates (2013) | choice | 4.4 | — · 7.61 bn · 1 500 | the 777 route | 10 / 25 / 40 % off (40) | the long-haul prize | Emirates daily · Emirates ≥ 78 · border wait ≤ 3 |
| 6-6 | The Permit (2013) | business | 2.5 | — · 8.01 bn · 1 500 | the permit's caps; solar, electric vehicles | no car park, no extra flights | the permit, green | permit kept · green ≥ 68 · last month ≥ 35 |
| 6-7 | Nobel Week (2015) | operate | 4.0 | — · 9.31 bn · 1 500 | the business jets | lounge and booths / apron (lounge) | event peaks | jets ready · delay ≤ 3 · border wait ≤ 3 |
| 6-8 | Eurovision Week (2016) | operate | 4.0 | — · 9.58 bn · 1 500 | the fans | four lanes / a LEGO pop-up (lanes) | capacity against revenue | — · security wait ≤ 3.5 · brands ≥ 150 k |
| 6-9 | Fly Green (2017) | business | 2.1 | — · 10.2 bn · 1 500 | biofuel, glycol recovery, solar | 5 / 10 % biofuel (5) | green investments | green ≥ 78 · ≥ 86 · last month ≥ 55 |
| 6-10 | A-CDM (2017) | build | 7.7 | — · 10.3 bn · 1 500 | the queue at the runway; A-CDM with four more IT | IT size; keep the team | integrated systems, IT sizing | stands level 3 · delay ≤ 3 · on time ≥ 90 % |
| 6-11 | Exam: Record Summer (2018) | exam | 8.1 | — · 10.9 bn · 1 500 | A380 gate, e-gates, six lanes; the record morning (64 fuel taps) and evening | e-gates (yes) | capacity planning | ≤ 10 to the duty manager · delay ≤ 3.5 · Passengers ≥ 85 |

### Chapter 7 — Storm Years (2020–2024): people and resilience

| # | Mission (year) | Kind | Min | Budget | Does | Decides | Learns | ★ · ★★ · ★★★ |
|---|---|---|---|---|---|---|---|---|
| 7-1 | Empty Skies (2020) | crisis | 4.5 | — · 12.7 bn · 1 500 | the last busy evening; the sky empties | mothball T2 and T4 (both); rent relief (yes) | mothballing, tenants | shops answered · 2 mothballed · 10 brands kept |
| 7-2 | Furlough or Lay Off (2020) | choice | 1.1 | — · 12.7 bn · 1 500 | one 60-day plan stage | furlough / lay off / keep (furlough) | people costs against the return | answered · loss ≤ 20 · Staff ≥ 60 |
| 7-3 | Cargo Saves the Day (2020) | business | 4.3 | — · 12.6 bn · 1 500 | cargo stands; a night of freighters (11 fuel taps) | the cargo apron (yes) | freight income | freight ≥ 5.5 M · ≥ 7 M · delay ≤ 3 |
| 7-4 | Coming Back (2021) | operate | 4.2 | — · 12.6 bn · 1 500 | T2 reopens; recruits for the leavers | reopen now; hire now (both) | rehiring lead time | — · delay ≤ 3 · ≤ 5 % jobs empty |
| 7-5 | Closed Skies (2022) | crisis | 4.2 | — · 12.7 bn · 1 500 | the Aeroflot flight banned | its slots: Finnair / Norwegian (Finnair) | slots | slots given · all announced · Airlines ≥ 80 |
| 7-6 | Clearance Takes Weeks (2022) | operate | 4.4 | — · 12.8 bn · 1 500 | recruits before the summer | now / later (now) | clearance lead time | — · security wait ≤ 5 · ≤ 2 % jobs empty |
| 7-7 | One Terminal (2022) | build | 4.3 | — · 12.9 bn · 1 500 | the tunnel T4–T5 | reopen T4 now (yes) | one airside, shared shops | joined · brands ≥ 6 M · wait ≤ 3 |
| 7-8 | The Summer of Queues (2022) | operate | 7.4 | — · 12.7 bn · 1 500 | a second security company, temps, overtime; 61 fuel taps | second company (yes); temps; overtime | short-term staffing | — · security wait ≤ 3 · Passengers ≥ 85 |
| 7-9 | Cyber Morning (2023) | crisis | 4.3 | — · 14.0 bn · 1 500 | a security operations centre or four IT; the attack | centre / IT / no (centre) | cyber defence | answered · delay ≤ 3 · Passengers ≥ 80 |
| 7-10 | Fallback Drill (2024) | operate | 4.0 | — · 14.4 bn · 1 500 | drills, then two systems switched off | drill (yes) | readiness | readiness ≥ 90 · delay ≤ 3 · wait ≤ 4 |
| 7-11 | Exam: The Day the Screens Went Blue (2024) | exam | 7.8 | — · 14.6 bn · 1 500 | every system down for the morning (57 fuel taps) | drills / centre / none (drills); overtime | the outage | — · delay ≤ 5 · Passengers ≥ 85 |

### Chapter 8 — Arlanda 2040 (2025–2040): the future and the final test

| # | Mission (year) | Kind | Min | Budget | Does | Decides | Learns | ★ · ★★ · ★★★ |
|---|---|---|---|---|---|---|---|---|
| 8-1 | Electric Wings (2030) | operate | 7.6 | — · 21.4 bn · 1 500 | electric aircraft charged by the mobile charger (the ramp team does it) | two more mobile chargers or two charging stands (stands) | charging | — · delay ≤ 4 · Passengers ≥ 85 |
| 8-2 | Charging Stands (2031) | build | 3.9 | — · 21.9 bn · 1 500 | four chargers from the buy menu | more electric flights (yes) | the buy menu's Build | 4 chargers · green ≥ 96 · delay ≤ 3.5 |
| 8-3 | Robots on the Apron (2033) | choice | 4.2 | — · 23.9 bn · 1 500 | apron robots; they stop | keep / lay off the ramp team / no robots (keep) | robots need a fallback too | turnaround level 2 · delay ≤ 4 · Staff ≥ 60 |
| 8-4 | Self-driving Ploughs (2034) | operate | 4.1 | — · 24.5 bn · 1 500 | the ploughs; a storm, the sensors iced | buy them (yes) | level 3 for snow | snow level 3 · no close call · on time ≥ 85 % |
| 8-5 | Hydrogen Morning (2035) | build | 4.4 | — · 26.1 bn · 1 500 | the hydrogen depot; the first flights | the depot (yes) | new fuels | the depot · green ≥ 98 · delay ≤ 3 |
| 8-6 | Your Pier (2036) | build | 1.3 | 1 500 · 28.0 bn · 3 000 | designs and builds the pier | finger / satellite / green (green) | design trade-offs | the pier · spent ≤ 3 300 · 10 chargers |
| 8-7 | Faces as Boarding Passes (2038) | operate | 3.9 | — · 26.7 bn · 3 000 | biometric boarding; an afternoon outside Schengen | buy it (yes) | level 3 at the border | border level 3 · border wait ≤ 2 · on time ≥ 90 % |
| 8-8 | Heatwave 2040 | crisis | 4.2 | — · 28.7 bn · 3 000 | 34 °C | cool the terminals / shade the ramp (cool) | heat | Passengers ≥ 90 in the afternoon · delay ≤ 4 · Passengers ≥ 88 |
| 8-9 | Night Train or Night Flight (2040) | choice | 2.1 | — · 28.8 bn · 3 000 | two 60-day plan stages | night freighters / night train (train) | the nights and the neighbours | chosen · last month ≥ 70 · Neighbours ≥ 80 |
| 8-10 | Peak Day 2040 | operate | 7.3 | — · 29.1 bn · 3 000 | the busiest day | temps / four lanes (lanes) | peak capacity | ready · delay ≤ 3 · Passengers ≥ 88 |
| 8-11 | Final Exam: Blackout (2040) | exam | 7.4 | — · 29.1 bn · 3 000 | the busiest morning, then every system dark | drills (yes); overtime | the airport survives on its people | readiness ≥ 90 · delay ≤ 6 · Passengers ≥ 70 |

**Minutes:** chapter totals at ▶ 66 · 55 · 64 · 61 · 61 · 57 · 51 · 50 (≈ 7.8 h for the campaign at ▶, 5.3 min a mission on average; the exams 7.4–9.8, the pure plan missions 1.1–2.7).

**Stars on Hard:** the reference gets ★★ in 1-1, 1-2, 1-7, 1-9, 3-11, 4-2, 5-2, 6-2, 6-3, 8-2 and ★ in 6-10; ★★★ everywhere else.

---

## 4. Budgets

### Money along the campaign (reference; net = cash − debt, MSEK)

| After | Easy | Medium | Hard | Medium cash · debt |
|---|---|---|---|---|
| 1-4 First Terminal | 148 | 37 | −19 | 67 · 30 |
| 1-11 (chapter 1) | 158 | 33 | −30 | 68 · 35 |
| 2-1 Room for the Jets | 168 | 16 | −60 | 81 · 65 |
| 2-11 (chapter 2) | 288 | 57 | −60 | 422 · 365 |
| 3-11 (chapter 3) | 1 505 | 1 239 | 1 101 | 1 704 · 465 |
| 4-11 (chapter 4) | 4 203 | 3 874 | 3 706 | 4 339 · 465 |
| 5-11 (chapter 5) | 5 368 | 4 956 | 4 743 | 5 421 · 465 |
| 6-11 (chapter 6) | 11 140 | 10 724 | 10 505 | 11 189 · 465 |
| 7-11 (chapter 7) | 14 661 | 14 243 | 14 020 | 14 708 · 465 |
| 8-11 (the end) | 29 845 | 28 671 | 28 066 | 29 136 · 465 |

- **Chapter 1 and the start of chapter 2 are tight**, as designed: on Hard the cash between missions is 2–10 MSEK and the loan room 2–5 MSEK through chapter 1, and 2-1 ends with 3.6 MSEK of cash; the budgets of 1-3 (52), 1-4 (76), 1-7 (4.5), 1-9 (10), 1-10 (12), 2-1 (55) are what keeps the reference above zero.
- **From the middle of chapter 2 the money stops mattering.** The years between missions earn far more than any mission spends: +337 MSEK in 1976–1983 (before 3-1), +1.3 bn before 6-4, +1.5 bn before 7-1, **+6.7 bn in 2024–2030** (before 8-1). Within a mission the reference's net result is between −0.6 bn (5-4) and +0.27 bn (8-9); only 8-6 (−3.1 bn) is bigger.
- **The difficulty's money (× 1.5 / × 0.75) is gone by chapter 3**: the three difficulties end chapter 3 within 0.4 bn of each other and the campaign within 6 %.
- **Running costs are noise late on:** at the end the airport pays about 19 MSEK a month in wages, 3.1 in systems and 15.5 in upkeep, against about 90 MSEK a month earned between missions (2024–2030); a system's 60–600 kSEK a month (`data/domains.js`) or a team's wages never show in a decision.

### The big spends (Medium, construction and small builds within the mission)

| Ch | Biggest spends |
|---|---|
| 1 | 1-1 site 82 · 1-3 tower 43 · 1-4 terminal and fire station 42 · 1-9 lights 15 · 1-7 four ploughs 6.4 |
| 2 | 2-11 international terminal 260 · 2-10 runway 2 156 · 2-1 jet apron 70 · 2-8 hall and belts 45 · 2-5 stand and trucks 23 |
| 3 | 3-1 domestic terminal 143 · 3-9 duty free, car park, restaurant 56 · 3-3 computer room and computer 38 · 3-8 check-in computers 18 |
| 4 | 4-1 Domestic 2 and brands 237 · 4-7 sorting hall and sorter 120 · 4-4 lanes and duty free 46 · 4-11 Y2K tests 25 (Arlanda Express: concession, the partner pays) |
| 5 | 5-4 runway 3 660 (+60 Väsby) · 5-6 bridges 585 · 5-9 Cargo City, offices, hotel wing 469 · 5-8 pads and crew 197 · 5-1 Schengen 175 · 5-2 tower 168 · 5-3 Pier F 168 |
| 6 | 6-11 A380 gate, e-gates, lanes 155 · 6-9 glycol, solar 100 · 6-6 solar, e-vehicles 75 · 6-10 A-CDM 60 |
| 7 | 7-7 tunnel T4–T5 272 · 7-9 security operations centre 30 · 7-4 reopening 25 |
| 8 | 8-6 your pier 3 289 · 8-5 depot 90 · 8-3 robots 70 · 8-7 biometrics 60 · 8-9 night train 60 |

### Where loans are meant to be used

The missions that set a loan room (`setup.loanLimit`, × the difficulty): **1-1** (30), **2-1** (90), **2-10 / 2-11** (300), **3-1** (150), **4-1** (250), **4-5** (2 500), **5-1** (400), **5-4** (1 500), **8-6** (3 000); elsewhere the room is 8 % of the airport's worth or the last mission's room. The reference borrows 20 (1-1), 10 (1-3), 5 (1-8, the café), 30 (2-1), 100 (2-10), 200 (2-11), 100 (3-1): **465 MSEK, never repaid** — it pays about 19 MSEK a year in interest from 1983 to 2040 while holding billions. After 3-1 no loan is ever needed.

---

## 5. Shifting the focus to the team and the systems

> **Proposals — not implemented.** Sizes: **S** a day or less (data, a goal kind, a text), **M** a few days (a new mechanic's edges, UI), **L** a rebalance of the whole campaign.

### What the measurements say

1. **The tray is quiet from 2-3.** In chapters 2–8, 64 of 77 missions keep ★★★ with no tray and no ops-time move; in 58 of 88 missions the reference does no tray task at all. The ops stage is a show to watch.
2. **The counters are clicks nobody needs.** Since the teams run desks, lanes and booths (SPEC "Manual, people, systems": *Teams and systems run their counters*), the reference's `desks` / `lanes` / `booths` moves — in 71 of its strategies — change no star in any mission when removed (in chapter 1 the tray's desk tasks do the same).
3. **The late tray is a staffing problem.** The 64 / 61 / 57 fuel taps of 6-11, 7-8 and 7-11 come from a ramp team short in July or cut since 7-6; the game answers it with taps, not with a staffing decision.
4. **Heads are thin.** The reference hires five heads (2-4 Karin, Bo; 3-2 Maja; 3-3 Mira; 5-5 Leila). Karin and Bo retire before 3-2, Mira is poached before 4-2 (her flaw: no new system in a year), Maja retires before 4-9, Leila before 6-9. **From 6-9 to 8-11 the airport has no head at all** and keeps ★★★: successors are offered, never needed. 25 raise requests go unanswered without a visible cost.
5. **Unions are automatic.** 343 wage rounds settle silently between missions at `WAGE_DRIFT`; two are played (2-7, 3-6). The Staff meter stays at 63–66 for the whole campaign.
6. **Systems fail, teams catch them, nobody notices.** 112 failures in the reference run, all absorbed by the teams kept beside the systems (the reference always keeps them); drills only in 3-11, 7-10, 7-11, 8-11.
7. **Money does not constrain anything after chapter 2** (section 4), so "keep or let go", "is the system worth it at this traffic", "how many IT people" have no cost the player feels.

### Proposals — the economy as the management lever

| # | Proposal | Size | Missions |
|---|---|---|---|
| E1 | **The owner takes the surplus.** Between missions the owner keeps a reserve (e.g. 6 months of running costs, or the chapter's budget) and takes the rest as the state's dividend, told on the "Meanwhile…" card; the chapter's **return target** (SPEC "The owner") becomes a number the dividend is measured against. Cash stays in the tens to hundreds of MSEK, so wages, licences and loans weigh again. | L | every mission's budget and money goals; `sim/missions.js`, `sim/summary.js`; the checker's thresholds |
| E2 | **Running cost as a star.** A goal kind `runningCost` (the month's wages + systems ≤ X) or `costPerTask` (a domain's cost per task done) as ★★/★★★ where the mission is about a level: 3-8, 4-7, 6-4, 6-10, 8-3. Keep vs let go then has a price both ways. | S | 3-8, 4-7, 6-4, 6-10, 8-3 |
| E3 | **Pay the debt back.** The reference repays when the room allows; a ★ "debt below X" in one business mission per chapter (1-8, 3-9, 5-9, 6-9) and interest shown on the stage card. | S | 1-8, 3-9, 5-9, 6-9 |

### Proposals — missions about people

| # | Proposal | Size | Missions |
|---|---|---|---|
| P1 | **Successors as the mission's decision.** 3-2 opens with Karin and Bo retired (they always are by 1984): the plan stage offers the successors for operations and snow besides the terminal head; ★★ "heads for 3 departments". 4-2 opens with Mira poached ("Copenhagen took your IT head — she wanted a new system"): a successor or nobody, with IT failures in the ops stage to feel it. | M | 3-2, 4-2 |
| P2 | **Heads that pay their way late on.** Give the chapter 6–8 missions a head with a perk that matters there (A-CDM, security, turnaround) and a star that needs it (`manager`), or let a vacant department lose skill each month. Today nothing changes without heads after 6-9. | M | 6-10, 7-8, 8-3, 8-11 |
| P3 | **Raises answered in plan time.** A raise request becomes a decision in the next plan stage (raise / not now / let go), with the poaching risk shown; unanswered ones drop the head's mood visibly. | S | any mission with a head and a plan stage |
| P4 | **One wage round a chapter in a mission.** Pick each chapter's biggest round (security 1990s, ramp 2000s, the rehire round of 2021) and put it into a plan stage; make 5-11's security strike the consequence of a refused round in 5-5 or 5-10 (a flag) instead of a script. The rest stay silent but are listed on "Meanwhile…". | M | 4-4, 5-5, 5-10, 5-11, 7-4 |
| P5 | **The summer holidays as a decision.** 6-11's record morning fails on 64 fuel taps because the ramp team is away in July: a plan-stage choice (spread the holidays, temps for the ramp, holiday-move bonus) with a goal "≤ N tasks to the tray"; the same for 7-8 and 7-11 with the ramp's cut (rehire the ramp in 7-6, not only security). | S–M | 6-11, 7-6, 7-8, 7-11 |
| P6 | **Morale with levers.** Stars on Staff (6-1, 6-4, 7-2, 8-3) cannot move today (63–66). Let wage deals, training, lay-offs and overtime move it by tens, and make a low-morale team slower at its counters. | M | 2-7, 3-6, 6-1, 6-4, 7-2, 8-3 |

### Proposals — missions about systems

| # | Proposal | Size | Missions |
|---|---|---|---|
| S1 | **Readiness as a running chore.** A ★ "readiness ≥ 70 %" in the missions with a scripted failure (3-7, 4-7, 5-11, 6-10, 8-3, 8-4) and an Office warning under 50 %; drills planned, not only in the chapter-7 missions about them. | S | 3-7, 4-7, 5-11, 6-10, 8-3, 8-4 |
| S2 | **IT sizing measured.** A goal kind `uptime` (a system's or all systems' uptime ≥ X) where IT is the decision: 3-3, 4-7, 6-10, 7-9; too few IT people then costs a star, not only longer failures. | S | 3-3, 4-7, 6-10, 7-9 |
| S3 | **When automation pays, at today's traffic.** Missions where the system is optional and the star is on cost: e-gates against the police planner (6-11), robots against the ramp team (8-3), the sorter against handlers (4-7); the investment card's break-even traffic (SPEC "When it pays") shown in the decision. | M | 4-7, 6-11, 8-3 |
| S4 | **Failures without a net.** One mission per chapter from 3 on where a system fails with its team let go, so the "lay off" option has a felt cost (today the reference always keeps, and the "lay off" branch is never tested by a failure). | S | 3-7, 6-4, 8-3 |

### Proposals — UI and feedback: the management layer as the game

| # | Proposal | Size |
|---|---|---|
| U1 | **The stage card's automation summary.** Per domain: who did the work (you / team / system / duty manager), failures and who caught them, tasks that came to the tray and why (absent, strike, cut, holiday), the stage's cost of that domain, and one line of what to change ("Ramp: 12 of 20 away in July — temps next time?"). Today it shows only the totals (`ui/results.js` `work`). | M |
| U2 | **The Ops Center as the main screen between missions.** The Office opens on it; each row gets what SPEC promises and the code lacks — tasks done, time saved, **cost per task** — plus the head, the readiness and the next step of the ladder with its payback at today's traffic. | M |
| U3 | **Alerts from the heads.** In plan time and on the "Meanwhile…" card, the heads speak: "IT: 3 of 5 people needed — failures will last longer", "Security: the union's round is due in May", "Ramp: half the team is on holiday in July". No head → the alert comes late or not at all: that is what a head is for. | M |
| U4 | **A quiet tray means watching the machine.** In ops time with an empty tray, the side panel shows the teams' counters and the systems' state live (who opened desk 7, a failure and its fallback, a team short) instead of an empty tray. | S |
| U5 | **Clean reference strategies.** Drop the `desks` / `lanes` / `booths` moves the teams make redundant, so 💡 3 (the reference's main moves) shows decisions, not clicks. | S |

### Suggested order

U5 and E2 / S1 / S2 (small, measurable with the checker) → P5 (removes the late tapping) → U1 and U3 (the player sees the layer) → P1 / P3 / P4 (people decisions) → E1 (the economy rebalance, last: it moves every number in this file).

---

## 6. Open issues

**Calendar slips.** A stage's `date` only jumps forward, so a mission that starts after its own date plays its days late (Medium reference):

| Mission | Planned | Played | Note |
|---|---|---|---|
| 1-4 The First Terminal | starts 4 Apr 1960; ops "26 June 1960" | starts 16 May (1-3 ends then); ops on **14 Aug 1960** | the aim says "by 26 June"; 1-5 is dated 15 Aug |
| 4-10 Christmas Rush | 1 Dec 1998; ops 19 Dec | starts **4 Mar 1999** (4-9's 150-day stage); ops 22 Mar | Christmas in March |
| 5-5 Security After 2001 | 16 Dec 2002; ops 27 Jan | 23 Dec; ops 6 Feb 2003 | 5-4's 115 days |
| 6-10 A-CDM | "A morning in April", 3 Apr 2017 | 5 May | 6-9's two 60-day stages |
| 7-3 Cargo Saves the Day | ops 8 Jun 2020 | 26 Jul | 7-2's 60 days |
| 7-7 / 7-8 | T4 open 15 Jun; "The morning before Midsummer" 23 Jun 2022 | 26 Jun; **1 Jul** | after Midsummer |
| 8-10 / 8-11 | 11 and 21 Dec 2040 | 24 Dec (Christmas Eve) and 31 Dec | 8-9's 120 days |
| 3-7, 3-8, 4-5, 6-1, 8-5 | — | 1–10 days late | harmless |

Fix by shortening the plan stages of the mission before, or by moving the dates.

**Budget oddities.**
- The money balloons from chapter 3 (section 4): every money goal after 2-11 (3-9's last month, 7-2's "lose ≤ 20 MSEK", 8-6's "spent ≤ 3 300") is about the mission's own flow, never the cash; the owner still gives 100 MSEK for runway 3 (cash 5 bn) and 1.5 bn for the pier (cash 28 bn).
- `minMoney: 300 MSEK` in every mission from 5-2: only for a cheat's jump; in the campaign it never fires.
- The reference keeps 465 MSEK of debt from 1983 to 2040.
- The difficulty's money multiplier has no effect after chapter 2.

**Missions whose lesson is unclear or not felt.**
- **8-1 Electric Wings** — "the mobile charger by hand" (SPEC chapter 8 table): the ramp team (level 1 since 2-3) does the charging; the reference does no tray task. Either the charge task is the player's (`hands`) while the ramp team does not know chargers yet, or the text should say the team does it.
- **8-11 Final Exam: Blackout** — the message "the airport survives on its people" holds through the teams' readiness, but the player does no tray task (the briefing mentions "your hands"); the exam could ask for one hand domain.
- **7-2 Furlough or Lay Off** — 1.1 minutes, one decision whose money stake is invisible against 12.7 bn.
- **Exams beaten by the previous mission's strategy** (checker warnings): 1-11, 4-11, 5-11, 6-11, 7-11 — the exam asks nothing the mission before did not; also 1-5, 2-2, 3-8.
- **Three event-peak missions in chapter 6** (6-3, 6-7, 6-8) teach the same thing (a decision, then a watched afternoon); one of them could carry a people or system lesson (section 5).
- Chapter 7's random cyber attacks and outages are absorbed by the teams; the drills of 7-10 matter only for its `readiness` goal.

**Spec against code.**
- SPEC "Screens" (Ops Center: "the tasks it did today and the time it saved") and "Manual, people, systems" ("the Ops Center shows the domain's cost per task done"): `ui/opscenter.js` shows level, uptime, the month's cost, readiness, the head and the ladder — no tasks, time saved or cost per task.
- SPEC "The owner": "Each chapter the owner sets a return target" — in the sim only 6-1's `targetSet` flag exists.
- SPEC "How long it lasts" assumes about 9 minutes of play per mission in chapters 2–8; measured at ▶ they average 5.2 (the campaign ≈ 7.8 h at ▶ before the Office and retries).
