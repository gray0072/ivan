# Arlanda Rising — the chapters as built

Part of the spec of `arlanda-rising`; the core rules and the index of these files are in [SPEC.md](../SPEC.md). Keep it in sync with the code like the rest of the spec. Each chapter's missions as they are in `data/missions/ch1.js` … `ch8.js`, then what each mission opens. The campaign's overview, the mission kinds and the stars are in SPEC.md "Campaign"; the missions' budgets, money and lessons are in [missions.md](missions.md).

## Chapter 1 as built (`data/missions/ch1.js`)

The chapter follows the checked dates, so its order differs from the first plan: the first aircraft to land (14 December 1959, school flying only) was an SAS Caravelle, regular traffic began with an SAS DC-8 to New York on 26 June 1960, and the official opening came last (1 April 1962, King Gustaf VI Adolf; all international traffic moved from Bromma that day). Sources: sv.wikipedia *Arlanda* (Historia), en.wikipedia *Stockholm Arlanda Airport*; the Riksdag's decision of December 1957 (153 million kronor, two runways, runway 1 planned at 3.3 km) and the name from the 1958 contest in *Året Runt* come from the same Swedish page. Not found and therefore not told: the year and look of the first tower, the first terminal's buildings ("at first very primitive buildings"), the as-built length of runway 1 in 1959 (chapter 2's *Longer for the Jets* must be checked against the 3.3 km of the 1957 plan), the early passenger numbers (so chapter 1 has no Real Arlanda 🏅), and any airline but SAS at Arlanda in 1960–62 (Transair Sweden's charters in *Make It Pay* are marked to check in `data/airlines.js`).

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 1-1 | Clear the Forest (May 1958) | plan 180 + 150 days | the order of four clearing jobs for two crews before the winter halves their speed; sell the timber or burn it; keep a tree belt toward Märsta | own money ≥ 10 MSEK · Neighbours ≥ 75 |
| 1-2 | First Wheels (14 Dec 1959) | ops 09–12, 12–15 | pick a stand for each training sortie; the runway has no lights and it gets dark at about 15:30; the building site's fire watch covers the sorties (no fire station yet) | no task left to the duty manager · airport-caused delay ≤ 1 min |
| 1-3 | The Tower (Dec 1959) | plan 75 + 60 days, ops 21 March 09–12 | heated winter tents against a fast pace in the winter; then a morning of sorties at the tower's shorter separation | spent ≤ 44 MSEK · Safety ≥ 84 (the backup radio) |
| 1-4 | The First Terminal (Mar 1960) | plan 56 + 40 days, ops 26 June 08–11 | one crew (or hire a second): the hall and the fire station (10 MSEK, 20 days: category 7 before the passengers come), then the desks, waiting room and a kiosk by the deadline; check in the first regular flight; budget 80 MSEK | a kiosk · check-in wait ≤ 10 min |
| 1-5 | The First Jets (summer 1960) | ops 07–10, 15–18 | DC-8s fit only stands 1–2; open desks before the queue grows | on time ≥ 92 % · check-in wait ≤ 9 min |
| 1-6 | The Fuel Truck (Oct 1960) | ops 07–10, 14–17 | fuel by hand with one truck and three DC-8s; buy a second? | airport-caused delay ≤ 1.5 min · Airlines ≥ 85 |
| 1-7 | First Snow (Nov–Dec 1960) | plan 21 days, ops 07–10, 11:30–14:30 | buy at least two ploughs before the snow (the owner's 4.5 MSEK pays for two; a full convoy of four takes a loan or savings), then snow on the runway and the apron | no close call · on time ≥ 85 % |
| 1-8 | Make It Pay (Mar 1961) | plan 3 × 80 days | the open airport loses money: fees, a café or a kiosk, summer charters, a car park that pays back only in years | profit ≥ 6 MSEK · Airlines ≥ 65 |
| 1-9 | Night Lights (Nov 1961) | plan 45 days, ops 15–18, 20:30–23:30 | edge lights for the dark, approach lights for the fog; the runway direction that spares Märsta at night | nothing sent away · Neighbours ≥ 62 |
| 1-10 | Opening Day (1 Apr 1962) | ops 07–10, 11–14 | stand 1 closed for the ceremony 11–13; a remote stand built in a hurry | airport-caused delay ≤ 2 min · Passengers ≥ 72 |
| 1-11 | Exam: The First Winter (Jan 1963) | ops 07–10, 11–14, 14:30–17:30 | everything by hand in one snowy, dark day | airport-caused delay ≤ 2 min · no close call |

`tools/missions-check.js` measures them at ▶: 4.2–6.7 minutes, the exam 9.6. Each mission also has `aim`, `news` and the decisions' texts for the screens (see "The game in the browser" in [ui.md](ui.md)).

Nothing the buy menu sells comes by itself: the fire station is built and paid in 1-4 (1-2 and 1-3 fly on the building site's fire watch), the ploughs are bought in 1-7's first stage, and the missions after top the vehicles up only to what an earlier mission asked for (`setup.items`: one fuel truck, the one 1-6 brings; two ploughs, 1-7's goal) — that only matters after a cheat's jump. The budgets let the reference pay its way on Hard too (1-3 52 MSEK, 1-4 76, 1-7 4.5, 1-10 12; 1-8 borrows 5 MSEK for its café), so its cash never goes below zero and no mission starts on the owner's loan.

## Chapter 2 as built (`data/missions/ch2.js`)

Checked and told: the 1957 plan's two runways (runway 2 of 2.5 km; its building year was not found, so the briefing does not give one), SAS's first 747 (1971), the international terminal of 1976 (today Terminal 5), Transair Sweden (1950–1981) and Sterling Airways (1962–1993). The game's own story: the jet apron, the charter slots, the people and the deals; runway 2's ends are the AIP's.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 2-1 | Room for the Jets (1965) | plan 75 days, ops 07–10 | pave the jet apron; haul the earth or a noise bank | airport delay ≤ 2 · spent ≤ 75 MSEK |
| 2-2 | Charter Summer (1967) | plan 80 days, ops 06–09 | Transair, Sterling, both or none; two more desks | profit ≥ 4.5 MSEK · check-in wait ≤ 6 |
| 2-3 | Hire a Hand (1968) | plan 25 days, ops 07–10 | the first teams take whole kinds of tasks | airport delay ≤ 2 · teams do ≥ 30 tasks |
| 2-4 | Two Managers (1969) | plan 20 days, ops 07–10 | an operations head and a snow chief with a team, in pairs | an operations head · on time ≥ 90 % |
| 2-5 | Jumbo! (1971) | plan 50 days, ops 10–13 | the E stand for the 747 (a one-off fire waiver); more fuel trucks for it are the player's to buy | check-in wait ≤ 9 · Airlines ≥ 72 |
| 2-6 | Fire Category (1971) | plan 40 days, ops 08–11 | two crash tenders for category 9; an emergency | Safety ≥ 82 · on time ≥ 85 % |
| 2-7 | The Wage Round (1972) | plan 30 days, ops 07–10 | accept, counter, the mediator or a strike on the day (airport delay ≤ 4) | no strike · Staff ≥ 62 |
| 2-8 | The Bag Belt (1973) | ops, plan 70 days, ops | bags by hand, the hall (25 days), then the belts straight from the hands (25 days, 30 MSEK); handlers hired beside them as the fallback, or not — a jam shows what they are worth | ≤ 6 bags lost · Passengers ≥ 70 |
| 2-9 | Fog Morning (1974) | plan 40 days, ops 06–09 | the instrument landing system | nothing sent away · on time ≥ 70 % |
| 2-10 | Crosswind (1975) | plan 160 days, ops 07–10 | runway 2 with the owner's grant; a westerly gale | on time ≥ 85 % · Neighbours ≥ 66 |
| 2-11 | Exam: The International Terminal (1976) | plan 100 days, ops 07–10, 16–19 | the terminal, then a day with an emergency, a jam and a gale | airport delay ≤ 2 · Passengers ≥ 72 |

## Chapter 3 as built (`data/missions/ch3.js`)

Checked and told: Terminal 3 opened in August 1989 for the smaller airlines' propeller routes from Bromma (sv.wikipedia; en.wikipedia gives 1990), built by the owner before the exam; the Riksdag's decision of 17 December 1980 to move the jets from Bromma, the domestic terminal (today Terminal 4) opened on 1 October 1983 and Linjeflyg's move that month, Linjeflyg's F28s, SL's airport coaches under the name Flygbussarna from 1989. Reordered by the checked dates: Flygbussarna is the 10th mission. The MD-81's and the DC-10's years at Arlanda are marked to check in `data/aircraft.js`.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 3-1 | Linjeflyg Moves In (1983) | plan 110 days, ops 06:30–09:30 | the domestic terminal and its apron; Linjeflyg's terms | airport delay ≤ 2 · Airlines ≥ 75 |
| 3-2 | Morning Peak (1984) | plan 20 days, ops 06–09, 09–12 | a head of terminal service; desks open before the peak (nobody waits over 7 min: the desk scheduler alone opens one desk at a time, Maja Ström reads the departures) | check-in wait ≤ 3 · on time ≥ 90 % |
| 3-3 | The Computer Room (1984) | plan 50 days, ops 07–10 | an IT department, the room, the stand computer (keep or lay off); it fails | airport delay ≤ 2 · Passengers ≥ 78 |
| 3-4 | Screens (1985) | ops, plan 40 days, ops | announcements by hand, then a PA operator and screens | ≤ 1 not announced · Passengers ≥ 74 |
| 3-5 | Flu Season (1986) | plan 14 days, ops 06:30–09:30 | temps and overtime against the absence | ≤ 3 tasks by hand · on time ≥ 85 % |
| 3-6 | Strike Notice (1986) | plan 7 days, ops 07–10 | pay, the mediator or ride out the strike (airport delay ≤ 4) | no strike · airport delay ≤ 3 |
| 3-7 | The Big Freeze (1987) | plan 20 days, ops 06–09, 12–15 | the weather-based clearing plan; it fails in the cold | no close call · on time ≥ 85 % |
| 3-8 | Planner or Computer? (1987) | plan 30 days, ops 06–09, 16–19 | check-in computers, or a course and four desks (and the first desks opened by hand: nobody waits over 5 min) | check-in wait ≤ 2 · on time ≥ 90 % |
| 3-9 | Payback (1988) | plan 3 × 70 days | duty free, a car park, restaurants: what the last month earns | last month ≥ 20 MSEK · Airlines ≥ 70 |
| 3-10 | Flygbussarna (1989) | plan 40 days, ops 16–19 | coach stops (Neighbours) or another car park | Passengers ≥ 92 · on time ≥ 90 % |
| 3-11 | Exam: Domestic Rush (1989) | ops 06–08:30, 11–13:30, 15–17:30 | snow and the flu, a power cut, a failing computer and an emergency | airport delay ≤ 2 · Passengers ≥ 74 |

`tools/missions-check.js` measures them at ▶: chapter 2 3.9–8.2 minutes, chapter 3 3.6–9.7; the reference strategies are in `data/strategies/ch2.js` and `ch3.js`. The choice missions (2-2, 2-4, 2-7, 3-6, 3-8, 3-10) were also played with their other options: each passes, with other stars.

## Chapter 4 as built (`data/missions/ch4.js`)

Checked and told: Inrikes 2 (today Terminal 2) opened in 1990 for SAS's domestic flights; domestic flying deregulated on 1 July 1992 and Transwede's first domestic route (Stockholm–Visby, 22 July 1992); Linjeflyg merged into SAS on 1 January 1993; the Arlanda Express consortium picked in August 1994, building from 1995, the first train on 24 November 1999, Arlanda South and North; Sweden in the EU from 1 January 1995, tax-free between EU countries until 1 July 1999; Braathens' Oslo–Stockholm from 6 November 1996; Ryanair's first Stockholm route, Skavsta–Stansted, in June 1997; Copenhagen's Terminal 3 and its station in 1998; Premiair (from 1994) and Novair (flying from November 1997); Y2K at Arlanda (nothing happened; two aircraft checked the landing aids at about two o'clock); 17.1 million passengers in 1999 (SIKA, Luftfart 1999). The game's own story: the brands in the units, the 1990s sorting hall (the first documented tilt-tray sorter came in 2002), Ryanair at Arlanda (a what-if: it flew to Skavsta), the deals and the flights of each day; not found and so not told: a 1990s move of SAS's long-haul to Copenhagen.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 4-1 | Domestic 2 (1990; Terminal 2 from 1993) | plan 120 days, ops 06:30–09:30 | build Domestic 2; brands in the units; who moves in | brands earn ≥ 60 kSEK · check-in wait ≤ 4 |
| 4-2 | Deregulation (1992) | plan 30 days, ops 06:30–09:30 | Transwede for a quarter off; the fee level (on time ≥ 75 %) | on time ≥ 90 % · Airlines ≥ 80 |
| 4-3 | The Train Question (1994) | plan 2 × 60 days | own line or concession; a car park before the train? | last month ≥ 20 MSEK · Neighbours ≥ 72 |
| 4-4 | Duty Free (1995) | ops 15–18, plan 60 days, ops 15–18 | two lanes closed (the tray yours: at most 5 tasks to the duty manager); lanes, duty free, brands | security wait ≤ 8 · brands earn ≥ 3 MSEK |
| 4-5 | Building the Tunnel (1995) | plan 110 + 55 days | the tunnel, the line, the stations; a car park closed | Passengers ≥ 76 · Neighbours ≥ 72 |
| 4-6 | Route Incentive (1996) | plan 40 days, ops 07–10 | Braathens' Oslo route: a tenth, a quarter, half off | Braathens' mood ≥ 77 · on time ≥ 90 % |
| 4-7 | Bags by Machine (1997) | ops 07–10, plan 70 days, ops 07–10 | the sorting hall and the bar-code system; it fails | ≤ 30 bags lost · Passengers ≥ 90 |
| 4-8 | The Low-Fare Question (1997) | plan 30 days, ops 16–19 | invite a low-fare airline, or keep the fees for all | brands earn ≥ 50 kSEK · Airlines ≥ 72 |
| 4-9 | Hub Wars (1998) | ops 06:30–09:30, plan 150 days | a transfer wave; Copenhagen pulls; a deal for SAS | Airlines ≥ 80 · airport delay ≤ 3.5 |
| 4-10 | Christmas Rush (1999) | plan 18 days, ops 06–09, 15–18 | charters to the sun, snow; the shops' Christmas takings ≥ 2.75 MSEK (the goal): BRIO's toy kiosk by the international gates (cheap, little), Max in a unit of Terminal 2 (more, a dearer fit-out), or units let by hand in the Terminal view | Passengers ≥ 88 · brands earn ≥ 3.4 MSEK |
| 4-11 | Exam: Millennium Night (1999) | plan 12 days, ops 13–16, 22–01 | test every system for the year 2000 (25 MSEK, a quiet night) or trust the suppliers: the untested systems stop at midnight, half of each team is at home, and their work comes to the tray — at most 2 tasks to the duty manager | airport delay ≤ 3 · Passengers ≥ 85 |

`tools/missions-check.js` measures them at ▶: 2.1–9.1 minutes; the reference strategies are in `data/strategies/ch4.js` (with the Challenge Days'). The choice missions were also played with their other options (4-1 Linjeflyg in Domestic 2, 4-3 and 4-5 the own line, 4-8 no low-fare deal): each passes, with other stars. No decision is a mission's goal: 4-10 measures the shops' takings, 4-11 the hands at midnight.

## Chapter 5 as built (`data/missions/ch5.js`)

Checked and told: Schengen from 25 March 2001 (Council Decision 2000/777/EC) and how Arlanda was split (Terminal 2 international only, a fourth level in Terminal 5); Sky City of 1993; the new tower by Wingårdh, built July 1999–May 2001, in service 23 December 2001, 83 m (90 with its mast); 18.1 and 16.4 million passengers in 2001 and 2002; Swedavia's history for Pier F in January 2002 (other sources say 2003: marked); runway 3 begun on 10 November 1998, 2 500 m, first used on 17 April 2003 after the downturn; the taxiway bridges to runway 3; Regulation (EC) 2320/2002 (in force January 2003, every hold bag screened from 31 December 2002); Norwegian's first Arlanda flight on 1 September 2003; the de-icing areas by runway 3 and the southern apron draining to the glycol collection; Cargo City of 2006; the liquids rule of 6 November 2006 (Regulation 1546/2006); "Arlanda has not closed for snow since 1962"; 18.1 and 16.1 million passengers in 2008 and 2009. The game's own story: the flights of each day, the bridges' crossings and building in early 2003, the pads' year (2004), the security strike of the exam, the deals and the people; the runway's cost was not found.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 5-1 | Schengen (2001) | plan 70 days, ops 16–19 | a new floor and the passport booths before 25 March (heated tents); who opens the booths | border wait ≤ 3 · Passengers ≥ 85 |
| 5-2 | The New Tower (2001) | plan 90 days, ops 07–10 | fit out the tower by 23 December (a fast pace); lower fees after 11 September | airport delay ≤ 2.5 · Airlines ≥ 75 |
| 5-3 | Pier F (2002) | plan 50 days, ops 10–13 | the pier's gates in the winter, its jet bridges; a long-haul wave | Airlines ≥ 80 · Passengers ≥ 86 |
| 5-4 | Runway Three (2002) | plan 115 days | finish runway 3 before the winter (the owner's grant, which stage to hurry), Upplands Väsby | spent ≤ 1 350 MSEK · Neighbours ≥ 75 |
| 5-5 | Security After 2001 (2002) | ops 06:30–09:30, plan 45 days, ops | the lanes by hand under the new rules, a team hired before its clearance runs out | security wait ≤ 4 · Passengers ≥ 85 |
| 5-6 | Taxiway Bridges (2003) | plan 72 days, ops 07–10 | two bridges in the cold, then the first morning on two runways | on time ≥ 90 % · airport delay ≤ 4 |
| 5-7 | Norwegian Arrives (2003) | plan 30 days, ops 06:30–09:30 | 30 % or half off for Norwegian; random events from now on | brands earn ≥ 12.5 MSEK · Airlines ≥ 92 |
| 5-8 | Remote De-icing (2004) | ops, plan 72 days, ops | trucks by hand in the frost, then a crew and the pads | airport delay ≤ 4 · Passengers ≥ 85 |
| 5-9 | Rent Is Steady (2006) | plan 2 × 90 days | Cargo City, its offices, a hotel wing, a shop in Sky City | rents ≥ 6 MSEK a month · last month ≥ 44 MSEK |
| 5-10 | Liquids in Bags (2006) | ops, plan 40 days, ops | the first morning of the liquids rule, then queue sensors and lanes for Christmas | security wait ≤ 5 · brands earn ≥ 150 kSEK |
| 5-11 | Exam: The Snowy Peak (2009) | ops 06–08:15, 11–13:15, 16–18:15 | snow on two runways, de-icing, the border, a security strike with the sensors down, a power cut | airport delay ≤ 3 · Passengers ≥ 82 |

## Chapter 6 as built (`data/missions/ch6.js`)

Checked and told: the first international hall of 1962 torn down in 2017 to make room as the airport grew (Flygtorget, 13 April 2017; torn down by the owner before the exam); Swedavia from 1 April 2010; the aquifer in use since the summer of 2009 (about 600 000 m³, about 19 GWh a year); Airport Carbon Accreditation from 2009; the ash cloud — the airspace closed at 20:00 UTC on 15 April 2010, Arlanda open to the north and west on the 19th, closed again on the 20th, reopening from the 21st; the royal wedding of 19 June 2010, guests from the 17th; Sweden's first self bag drop at Arlanda on 10 October 2012 (SAS and Norwegian first); Emirates from 5 September 2013 with a 777, Qatar Airways from 27 November 2007; the permit of 27 November 2013 (350 000 movements, the CO2 cap of 1991 — removed by the appeal court in November 2014, so later missions keep only the movements' cap); the Nobel Prizes on 10 December; Eurovision 2016 in Stockholm (10, 12 and 14 May); Swedavia's 450 tonnes of biofuel and the first fuelling on 5 January 2017, the Fly Green Fund of 2014; A-CDM in full on 8 June 2017; the A380 gate at Pier F in January 2018 (the first A380 at Arlanda was Lufthansa's visit in 2010; no scheduled A380 is known); 26.8 million passengers in 2018, the record; flygskam among the new words of 2018. Reordered by the checked dates: The Giant became Emirates (no A380 flew there on a schedule), e-Gates went into the exam (their year was not found), Glycol and the Aquifer became Fly Green (the aquifer is the owner's from 2009), the exam is the record year 2018 (2019 fell by 4 %). The game's own story: the guests' aircraft and the stands, the stranded passengers' choices, the business jets' lounge, the fans, the deals and the flights of each day.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 6-1 | Swedavia (2010) | plan 12 days, ops 07–10 | the new owner's colours and target; the green rating and the energy bill | Staff ≥ 67 · Passengers ≥ 92 |
| 6-2 | The Ash Cloud (2010) | ops 18:30–21:30, plan 5 days, ops 07–10 | get the last flights out before the sky closes; the stranded passengers' mood when the sky opens ≥ 80 (the days' goal): camp beds (6 MSEK, +8), hotels (22 MSEK, +14, the safe one from an unhappy terminal) or the cafés open all night (2 MSEK, +6) — the floor alone costs 15; the reopening | check-in wait ≤ 3 · Passengers ≥ 96 |
| 6-3 | A Royal Wedding (2010) | plan 25 days, ops 12–15 | where the guests' aircraft stand for days | airport delay ≤ 3 · Passengers ≥ 88 |
| 6-4 | Self Bag Drop (2012) | ops 06–09, plan 40 days, ops 06–09 | the full hall, the bag drop, the desk staff kept or not | check-in wait ≤ 2.5 · Staff ≥ 60 |
| 6-5 | Emirates (2013) | plan 40 days, ops 13–16 | a tenth, a quarter or 40 % off for the 777 (on time ≥ 80 %) | Emirates' mood ≥ 78 · border wait ≤ 3 |
| 6-6 | The Permit (2013) | plan 2 × 70 days | the permit's caps; a solar park and electric vehicles, no car park, no extra flights | green ≥ 68 · last month ≥ 35 MSEK |
| 6-7 | Nobel Week (2015) | plan 14 days, ops 13–16 | a lounge and booths, or stands for the business jets; frost and snow | airport delay ≤ 3 · border wait ≤ 3 |
| 6-8 | Eurovision Week (2016) | plan 14 days, ops 14–17 | four more lanes or a LEGO pop-up for the fans | security wait ≤ 3.5 · brands earn ≥ 150 kSEK |
| 6-9 | Fly Green (2017) | plan 2 × 60 days | biofuel, glycol recovery, a second solar park | green ≥ 86 · last month ≥ 55 MSEK |
| 6-10 | A-CDM (2017) | ops 06:30–09:30, plan 60 days, ops | the queue at the runway, then A-CDM with more IT people | airport delay ≤ 3 · on time ≥ 90 % |
| 6-11 | Exam: Record Summer (2018) | plan 50 days, ops 06–08:45, 15–17:45 | the A380 gate, e-gates, more lanes; the record morning (at most 10 tasks to the duty manager) and evening | airport delay ≤ 3.5 · Passengers ≥ 85 |

`tools/missions-check.js` measures them at ▶: chapter 5 1.9–9.8 minutes, chapter 6 2.1–8.1; the reference strategies are in `data/strategies/ch5.js` and `ch6.js`. Doing nothing fails every mission (in the most automated ones the goal is a decision only the player takes: who sets the owner's target, where the guests' and the business jets' aircraft stand; 6-2 measures the stranded passengers' mood instead, which more than one answer keeps up).

## Chapter 7 as built (`data/missions/ch7.js`)

Checked and told: all of Arlanda's operations moved to Terminal 5 at the start of the pandemic, at times virtually no commercial traffic (Swedavia); travel at Swedavia's airports −74 % in 2020 (10.3 million, from 40.2 in 2019; Swedavia's year-end report 2020); almost all belly cargo lost, the freight-only airlines flying on (Swedavia 2020), SAS's freight flights from China from 8 May 2020 and Qatar Airways Cargo twice a week (newstodate.aero, May 2020); Terminal 2 open again on 26 October 2021; Swedish airspace closed to Russian aviation and Aeroflot's departures from Arlanda stopped (Transportstyrelsen), Aeroflot's flights to Europe cancelled on 27 February 2022 (Reuters); the security queues of over an hour in May 2022 and the staff shortage at the security company (Swedavia, The Local), a second company and the three-hour rule in June, about 100 new screeners by July; Terminal 4 open again on 15 June 2022 with a walking tunnel airside to Terminal 5 (Swedavia); the faulty update of a security program on 19 July 2024 (Reuters, The Local); close to 22 million passengers in 2023 and 22.7 million in 2024 (Swedavia). The game's own story: the flights of each day, the deals and the people, the leavers, the cyber attack of 2023 and the drill of 2024 (told as the game's), the exam's preparation.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 7-1 | Empty Skies (2020) | ops 16–19, plan 45 days | the last busy evening; mothball Terminals 2 and 4; rent relief or half the shops close | 2 terminals mothballed · 10 brands |
| 7-2 | Furlough or Lay Off (2020) | plan 60 days | furlough seven in ten, lay off four in ten, or keep everybody | lose ≤ 20 MSEK · Staff ≥ 60 |
| 7-3 | Cargo Saves the Day (2020) | plan 30 days, ops 20–23 | two cargo stands and two more freighters a day; a night of freighters | freight ≥ 7 MSEK · airport delay ≤ 3 |
| 7-4 | Coming Back (2021) | plan 30 days, ops 06–09 | Terminal 2 open again; recruit for the jobs the leavers left | airport delay ≤ 3 · ≤ 5 % of the jobs empty |
| 7-5 | Closed Skies (2022) | ops 07–10, plan 21 days | the Aeroflot flight banned; its slots to Finnair or Norwegian | every delay announced · Airlines ≥ 80 |
| 7-6 | Clearance Takes Weeks (2022) | plan 46 days, ops 06–09 | recruit on the first day, or wait and see | security wait ≤ 5 · ≤ 2 % of the jobs empty |
| 7-7 | One Terminal (2022) | plan 50 days, ops 06–09 | the tunnel by mid-June; Terminal 4 open again | brands earn ≥ 6 MSEK · check-in wait ≤ 3 |
| 7-8 | The Summer of Queues (2022) | plan 5 days, ops 05:30–08:30, 13–16 | a second security company, temps, overtime | security wait ≤ 3 · Passengers ≥ 85 |
| 7-9 | Cyber Morning (2023) | plan 35 days, ops 06:30–09:30 | a security operations centre or four IT people; the attack | airport delay ≤ 3 · Passengers ≥ 80 |
| 7-10 | Fallback Drill (2024) | plan 20 days, ops 06:30–09:30 | drills, then the stand and check-in systems switched off | airport delay ≤ 3 · check-in wait ≤ 4 |
| 7-11 | Exam: The Day the Screens Went Blue (2024) | plan 25 days, ops 06–08:45, 14–16:45 | drills or the centre; every system down for the morning | airport delay ≤ 5 · Passengers ≥ 85 |

## Chapter 8 as built (`data/missions/ch8.js`)

The player's own future: no history is told but that Swedavia's board stopped Pier G in November 2026 (in *Your Pier*). The electric commuter (30 seats) and the hydrogen airliner (70 seats) are the game's types, flown by "Electric regional flights" and "Hydrogen test flights"; the other airlines fly their 2020s types.

| # | Mission | Stages | The idea | ★★ / ★★★ |
|---|---|---|---|---|
| 8-1 | Electric Wings (2030) | ops 07–10, plan 20 days, ops 07–10 | the mobile charger, driven by the ramp team (a team since 2-3: no tray task); two more, or two charging stands | airport delay ≤ 4 · Passengers ≥ 85 |
| 8-2 | Charging Stands (2031) | plan 45 days, ops 07–10 | four chargers from the buy menu (Build); twice the electric flights (a calm morning: no random event) | green ≥ 96 · airport delay ≤ 3.5 |
| 8-3 | Robots on the Apron (2033) | plan 35 days, ops 07–10 | the robots, the ramp team kept or laid off; the robots stop | airport delay ≤ 4 · Staff ≥ 60 |
| 8-4 | Self-driving Ploughs (2034) | plan 28 days, ops 06–09 | the ploughs; a snowstorm, the sensors iced | no close call · on time ≥ 85 % |
| 8-5 | Hydrogen Morning (2035) | plan 45 days, ops 07–10 | the hydrogen depot; the first hydrogen flights | green ≥ 98 · airport delay ≤ 3 |
| 8-6 | Your Pier (2036) | plan 50 + 75 days | a finger, a satellite or a green pier, built | spent ≤ 3 300 MSEK · 10 charging stands |
| 8-7 | Faces as Boarding Passes (2038) | plan 30 days, ops 13–16 | biometric boarding; an afternoon outside Schengen | border wait ≤ 2 · on time ≥ 90 % |
| 8-8 | Heatwave 2040 | plan 14 days, ops 13–16 | cool the terminals or shade the ramp; 34 °C (Passengers ≥ 90 in the afternoon) | airport delay ≤ 4 · Passengers ≥ 88 |
| 8-9 | Night Train or Night Flight (2040) | plan 2 × 60 days | night freighters or the night train | last month ≥ 70 MSEK · Neighbours ≥ 80 |
| 8-10 | Peak Day 2040 | plan 6 days, ops 06–08:45, 15–17:45 | temps or four lanes; the busiest day | airport delay ≤ 3 · Passengers ≥ 88 |
| 8-11 | Final Exam: Blackout (2040) | plan 7 days, ops 06–08:45, 11–13:45 | drills; the busiest morning, then every system dark | airport delay ≤ 6 · Passengers ≥ 70 |

`tools/missions-check.js` measures them at ▶: chapter 7 1.1–7.8 minutes, chapter 8 1.3–7.7; the reference strategies are in `data/strategies/ch7.js` and `ch8.js`. Doing nothing fails every mission (in the most automated ones the goal is a decision only the player takes: the shops' answer, the staff's, the slots, the network, the nights, the peak, the drills).

## What the campaign opens

A small build a mission teaches is **opened by that mission** (`unlocks` in its data, `Missions.unlockAt`): before it the campaign shows it under the buy menu's *Later* with 🔒 and *Opens in mission 2-6: Fire Category*, and the sim refuses it (`Missions.lockedBy`, `Airport.why`); from its start on it stays open (the campaign only goes forward; an earlier mission replayed has what it had then). The mission card lists it: *🔓 New under 🚜 Vehicles: 🚒 Crash tender*, and the card in the menu says **New**. A small build no mission names is there from its year (`from`). Free Play and the Challenge Days lock nothing but the year. A decision's option (`build`) builds past the locks — that is how 1-8's café, 3-9's duty-free or 7-3's cargo stands come.

| Mission | Opens |
|---|---|
| 1-4 The First Terminal | check-in desk, kiosk |
| 1-6 The Fuel Truck | fuel truck |
| 1-7 First Snow | snowplough |
| 1-8 Make It Pay | café, both car parks |
| 1-10 Opening Day | remote stand |
| 2-6 Fire Category | crash tender |
| 2-11 Exam: The International Terminal | restaurant |
| 3-9 Payback | duty-free shop |
| 3-10 Flygbussarna | airport coach stops |
| 3-11 Exam: Domestic Rush | backup generator |
| 4-1 Domestic 2 | security lane |
| 5-1 Schengen | passport booth |
| 5-8 Remote De-icing | de-icing truck |
| 5-9 Rent Is Steady | office building, hotel extension |
| 6-6 The Permit | solar park, electric apron vehicles |
| 7-3 Cargo Saves the Day | cargo stand |
| 7-9 Cyber Morning | security operations centre |
| 8-1 Electric Wings | mobile charger |
| 8-2 Charging Stands | charging stand |
| 8-5 Hydrogen Morning | hydrogen depot |
| 8-9 Night Train or Night Flight | night train platform |

So a goal about adding something — `built`, `fireCat`, `chargers`, `estate`, `runways`, `brands`, above all in a plan stage with `endEarly` — is never met before its mission starts: what it counts can only be bought from that mission on. The goals stay absolute counts (the simplest rule that holds: no "built during this mission" bookkeeping in the saves), and `tools/missions-check.js` fails when one is met at the start of its mission in the reference campaign at any difficulty; a goal that asks to *keep* what is there says `keep: true` (7-1's ten brands through the pandemic). With the locks no goal of the campaign is met at its start. Nor does a vehicle or a small build come silently: what a mission's `setup.items` adds to a world that has fewer (the years between two chapters, a cheat's jump) is told on its first stage card — *🛒 The owner bought for the airport: 2 × Fuel truck* (`S.mission.gave`, `Missions.setup`) — and within a chapter the top-ups stay at what an earlier mission asked the player to have (see "Chapter 1 as built").
