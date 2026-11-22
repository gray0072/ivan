# Arlanda Rising — Free Play from the forest: design and plan

For developers and agents. The design of a **non-stop Free Play**: one airport from the pine forest of 1958 to the Arlanda of 2040, with no missions and no stages, its time running all the way, its pace set by what the player has to do. It **replaces** today's Free Play (rounds of a month of offers and a peak, `sim/freeplay.js`); its eras stay as start points. The decisions below were proposed on 2026-11-22 and agreed with the user the same day (section 15); once a step of the plan (section 14) builds a part, that part's rules move into `SPEC.md` in the same change, and this file keeps the plan and the reasons.

Words used here: **played day** — the one day of each month the game flies flight by flight; **night** — the jump to the next month's played day; **era** — one of eight tiers of the airport's history (the campaign's chapters); **attention / cruise pace** — how fast the clock runs when the player has something to do or not.

---

## 1. What the player should feel

- **The history of Arlanda in one go**, at a pace the player enjoys: from cutting the first trees to the pier of 2040, each era recognisable (its buildings, aircraft, airlines, shops, problems).
- **Light tiredness from doing things by hand** — enough to *want* a team or a system, never so much that the game becomes a clicking test. The relief of the first team that empties the tray is the moment the game is about.
- **Time to explore**: roofs off, the cards, the flights, the queues; pause and half speed whenever wanted.
- **Seeing what to improve and planning it**: what the airport is short of, what each thing needs, what it would earn.
- **Choosing a strategy**: which airlines to court, which projects first, own money or loans, people or systems, shops or car parks.
- **People**: hiring teams, choosing heads from candidates, wage rounds, the summer holidays.
- **Problems to solve**: snow, fog, strikes, failures, a full apron, an angry neighbour, an airline about to leave.
- **Never lost**: saved all the time; a bankrupt airport goes on from a checkpoint.

## 2. The decisions in short

| Question | Decision |
|---|---|
| Missions and stages | None. One continuous game, from the forest (or a later era's airport) to 2040, then endless. |
| The time problem (ops vs plan time) | **A played day stands for a month.** Each month one day is flown flight by flight; the **night** runs the rest of the month in summary (construction, money, people, offers) in a few seconds. One clock, one rule. |
| Pace | **Adaptive**: the clock runs at the missions' pace (`OPS_HOUR_SECONDS`) while the player has something to do, fast when nothing needs them, and a month with no traffic passes in seconds. Automation literally buys time. Speeds **½ · 1 · 2 · 4**. |
| The year | Not shown as a date. The HUD shows the **month** (seasons matter) and the **era** with an indicative year: *Jet Age · ≈1971*. The night report counts *Month 37 of your airport*. |
| Day and night | Kept, short and useful: the day carries the traffic's peaks; the night is ~8 s, the month's report and a save point; darkness matters (runway lights, night flights against the neighbours, December afternoons, white nights). Optional *Stop at dawn*. |
| Construction time | In **nights** (= months), never in days: *Ready in 3 nights*. A terminal takes 2–4 nights. That is the price of the model, as the user expected; other builders do the same (buildings rise far faster than the calendar would allow). |
| Length | **Shortest pass ≈ 3 h at ▶** (the bot's reference, no idling; 2.5–3.5 h accepted). A first pass by a person **5–7 h**, in sessions; an era ≈ 15–30 min fits a child's 40-minute day. |
| Progress | Eight **eras** as soft tiers. A clear **dependency graph** in data: every project, small build, team, system, airline and brand says what it needs; one evaluator gives the reason for every lock. |
| Traffic | A **market** grows with the era and the airport's appeal; airlines, routes and shops **come when the airport is ready for them, one at a time**. |
| Decisions | An **inbox** that does not stop time (each offer has a deadline and a default); big screens pause the game while open. |
| Failure | The owner replaces the director after `DEBT_MONTHS` played months below zero → **continue from a checkpoint** (dawns, milestones, era starts). |
| Testing | `tools/freeplay-bot.js`: a director bot with a human-hands model, at the three difficulties and in profiles (reference, hands only, idle, no tray); it reports time per era, money, hand load, idle time, what never pays back, and fails outside the targets. |
| Code | One sim; the free mode is a new driver on top of the same modules (ops, summary, construction, people, offers, finance). Missions stay byte-identical: `missions-check.js` output diffed before and after every shared refactor. |

---

## 3. Time: a played day stands for a month

### 3.1 The rule

The calendar moves **a month at a time**. Each month the game flies **one played day** (the 15th) in full, flight by flight, as in ops time today. At the end of the day (23:30) the **night** comes: the other days of the month up to the next month's 15th are run **in summary** — exactly what plan time and the time between missions do already (`Summary.day`, `Construction.day`, the small builds, the running costs, the month's books, people's monthly drift, wage rounds, failures in summary) — in a few seconds of animation. Then the next played day begins at 05:00.

So:
- **Durations of projects stay in days in data** and are shown in nights: a stage of 120 days is *4 nights*. A scale `FREE_BUILD_X` (start 1.0) tunes it for the free mode without touching the missions.
- **Hiring, a team's days, a system's install, a clearance** — all in days in data — finish at the dawn after their days have passed: *Ready tomorrow*, *in 2 nights*.
- **Small builds** are there at once by day (as in ops time today); bought at night they come at dawn.
- **Money** is booked by the same lines as now; Finance's months are the played months.
- **The month matters**: snow and de-icing from November to March, the flu in January–February, the July holidays, the summer charters, Lucia, Nobel week. A year is 12 played days, so every era lives through its winters and summers.

### 3.2 The played day is a sample of the month

The played day is not decoration: **how well it went sets the month**. The night's summary uses, for each domain, a blend of the domain's structural efficiency (its level, team, system — as `Summary` does now) and the efficiency the player achieved in the day (tasks on time, airport delay, waits, lost bags): `FREE_DAY_WEIGHT` (start 0.5). The meters move the same way. So playing the day well pays for the month, and walking away from a manual airport costs money — the campaign's lesson (`MANUAL_SUMMARY_EFF`) made visible. The month's weather in summary uses the month's climate (an average of snow days), not the played day's draw, so one blizzard day does not ruin a whole month.

### 3.3 Adaptive pace

The sim always steps by `OPS_STEP_MIN` in the day and by days at night; **pace only maps real seconds to steps**, so results never depend on it (determinism holds; the bot computes real time from the same function).

| Pace | When | Real seconds per game hour at ▶ |
|---|---|---|
| **Attention** | a task is in the tray; a task for the player's hands is due within `FREE_LOOKAHEAD_MIN` (15 game min); an incident in a domain the player works (snow on a runway with ploughs by hand, a failure with no team, an emergency); the player holds 👁️ *Watch* | `OPS_HOUR_SECONDS` (60) — the missions' pace, so deadlines feel the same |
| **Cruise** | nothing needs the player | `FREE_CRUISE_HOUR_SECONDS` (start 6) |
| **Night** | 23:30 → 05:00 and the month's summary | `FREE_NIGHT_SECONDS` (start 8) in all |
| **Idle month** | no traffic at all (the forest, the building years) | the day collapses: `FREE_IDLE_DAY_SECONDS` (start 15) for the whole month |

- The pace eases over `FREE_PACE_EASE` (1.5 s) so the aircraft never jerk; a small 🐢 / 🐇 sign by the speeds says which pace runs and why on hover/tap (*Your tray has 2 tasks*).
- **Speeds ½ · 1 · 2 · 4** multiply it; **½** is new (also offered in missions: it changes nothing in the sim). **Auto-slow** (setting, on by default on Easy): with `FREE_SLOW_TRAY` (3) tasks waiting the speed drops to ½ until the tray is down to one.
- **Settings — Auto pace:** *Gentle* (cruise 12 s/h), *Normal* (6 s/h, default), *Off* (always attention pace, for players who want to watch).
- **What the curve gives**, estimated (the bot measures it, section 11): a manual day of 1960 with ~13 flights ≈ 5–7 min; a day of teams ≈ 3 min; an automated day ≈ 2 min (cruise only, plus incidents); a building month with nothing flying ≈ 15 s. **The more the airport runs itself, the faster the months pass** — the reward of automation is the player's own time, and the progress through history speeds up with it.

### 3.4 Pausing and comfort

- **Big screens pause** the game while open (Finance and its tabs, People, the Ops Center, Airlines, Development, the inbox card, a decision): reading and planning never eat the clock. Setting *Pause while I plan* (on by default). The buy menu and the bar's − / + do not pause (as in missions: buying while watching the queue).
- A hidden page pauses (as now); on return the game waits paused.
- **Comfortable rhythm**: a simple tap 3–6 s, a planning decision 20–60 s paused. Attention pace keeps the tray at 2–5 tasks a minute in a manual era — the missions' measured comfort zone (chapter 1: about 4–6 a minute; the 1963 exam's 6 a minute is "the limit of one pair of hands").

### 3.5 Day and night that help

- The **day** has the real shape of an airport: a morning wave 06–09, a quieter midday, an evening wave 16–19, cargo and late charters at night once those airlines come. The waves are where the player is busy; midday is where they plan (at cruise).
- The **night** is short (~8 s): the lamps, the cranes in time-lapse, the month's numbers counting up. It is also the **night report** — a card in the corner (not blocking): money of the month (income, costs, result), the meters' change, what was finished, who arrived, what is due next month (a wage round, a head's raise, a strike notice, a contract), with links. Dawn = an autosave and a checkpoint (section 9).
- **Darkness is a mechanic, not a nuisance**: before the runway lights no movement in civil darkness (so December is hard in era 1); night movements pay (cargo, charters) but cost the Neighbours (`NOISE_NIGHT_X`); June's white nights; heavy snow at night means ploughing before the morning wave.
- **Stop at dawn** (setting, off by default) for those who like a turn-based rhythm; **Stop when something important happened** (on by default): the night report opens and the game waits only when the month brought a decision with a deadline tomorrow, a strike notice, an airline about to leave or money below zero.

### 3.6 What the HUD shows

- The **month** and the time of day (*March · 07:42*), the weather.
- The **era chip**: *✈️ The Jet Age · ≈1971* — the indicative year, never a full date. Tap: the era's card (what it is about, its projects done / left, what opens the next era, the Real Arlanda comparison).
- The pace sign, the speeds ½ · 1 · 2 · 4, Skip (as now: to the next task).
- An **inbox** badge with the number of open offers and the nearest deadline.
- No stage goals; instead a slim line of the **owner's current ask** (section 6.4) and the next era's progress.

**The indicative year** (`eraYear`): within an era it advances with the months spent in it, from the era's first year toward its last, and **stops one year before the next era's start** until its gate is passed. It decides which aircraft types and liveries are flown, which airlines and brands exist, the terminal names (`data/terminals.js names`) — so the look stays historical even when the player is fast or slow. *Month 37 of your airport* (the played months) is the honest clock: it is shown in the night report and is the record (section 9.5).

---

## 4. How long it lasts

**Shortest pass ≈ 3 h at ▶** (the reference bot, sensible play, no idling; accepted 2.5–3.5 h). Why not 2 h: an era would be ~15 min, too little to feel the hand work grow and then the relief; the campaign spends 66 min on chapter 1 alone. Why not 5: Free Play is the brisk second way through the same history; the long way is the campaign (7.8 h at ▶ measured).

A person's first pass: **5–7 h** (reading, exploring, pauses, half speed, a bankruptcy or two). Each era is a natural stopping point.

| Era | Indicative years | Target minutes at ▶ (reference) | Played months (estimate) |
|---|---|---|---|
| 1 The Forest Field | 1958–1963 | 30 (building months fast, flying months by hand) | 18 (10 of them building) |
| 2 The Jet Age | 1963–1979 | 25 | 10 |
| 3 Everyone Flies | 1980–1989 | 20 | 8 |
| 4 Open Skies | 1990–1999 | 22 | 9 |
| 5 A New Millennium | 2000–2009 | 25 | 10 |
| 6 Bigger and Greener | 2010–2019 | 20 | 8 |
| 7 Storm Years | 2020–2024 | 15 | 6 |
| 8 Arlanda 2040 | 2025–2040 | 20 | 8 |
| **All** | | **≈ 180** | **≈ 77 (≈ 6½ years of seasons)** |

The bot's report (section 11) is the source of truth; the plan's step 4 tunes `FREE_*` and the era gates until the reference lands in these bands (±40 % per era, 2.5–3.5 h in all).

---

## 5. Progress: eras and what needs what

### 5.1 Eras as soft tiers

There are no stages, but there is a direction: **eight eras**, the campaign's chapters. An era opens its projects, small builds, ladder levels, airlines and brands; its **gate** opens the next one when the era's **core projects** stand and the airport carries the era's traffic (`gate.pax`, departing passengers a day, from the market — so the gate means *the airport has grown into its era*). Passing a gate: Astrid's short briefing of the new era, the local paper's front page (the campaign's `paper`), the **Real Arlanda** comparison for that era (🏅 when beaten), a checkpoint. Nothing forces the player through a gate; an airport may stay in an era as long as it likes.

| Era | Core projects (the gate) | Other projects | Small builds opened | Ladder | Airlines that may come | Problems that appear |
|---|---|---|---|---|---|---|
| 1 Forest Field | site, runway1, apron1, tower1, terminal1, fireStation, lights1 | — | desk, kiosk, fuel truck, plough, café, car parks, remote stand | everything by hand (stands, fuel, check-in, snow) | SAS: school flights, then Caravelles, the DC-8 (fire category 7) | snow, the dark, the first queues, noise over Märsta |
| 2 Jet Age | apron2 (+bigStand), bagHall, intlTerminal, runway2 | ils1 | restaurant, crash tender | **teams** (stands, turnaround, check-in, snow, baggage) and heads in pairs; the bag belts (system) | Lufthansa, Finnair, Transair and Sterling charters (summer), the 747 (Code E, category 9) | the first wage round, fog, crosswinds |
| 3 Everyone Flies | domTerminal, computerRoom | terminal3 | duty-free shop, coach stops, backup generator | **systems**: stand allocation, check-in computers, screens (information), the clearing plan; IT people | Linjeflyg (the domestic move), more SAS | failures, flu season, strike notices, power cuts |
| 4 Open Skies | terminal2, sorterHall, skyCity | arlandaExpress (own or concession) | security lane, the brands' units | bags level 3; incentives | Braathens, Transwede, low-cost; rivals pull | rivals, the train's deal, Y2K (history) |
| 5 New Millennium | schengen, tower2, pierF, runway3, bridges | deicePads, cargoCity | passport booth, de-icing truck, office building, hotel extension | border, security, de-icing domains; integrated levels | Norwegian, British Airways, Qatar | clearance weeks, the liquids rule, random events |
| 6 Bigger and Greener | gateF (needs oldHall torn down), aquifer | — | solar park, electric apron vehicles | self bag drop, A-CDM, e-gates; the green rating and the permit | Emirates (A380: Code F, category 10) | the permit's caps, event weeks |
| 7 Storm Years | t4t5 | — | cargo stand, security operations centre | drills, fallback tested, cyber | DHL, UPS; airlines leave with the demand (history) | the pandemic, closed skies, the summer of queues, the IT outage (history) |
| 8 Arlanda 2040 | pier2040 (the player's design) | — | mobile charger, charging stand, hydrogen depot, night train platform | robots, self-driving ploughs, biometric boarding | electric commuters, hydrogen prototypes | heat, the busiest day, the blackout (the finale) |

The table is the first proposal; step 2 checks it against `data/masterplan.js`, `data/domains.js` and the eras of today's Free Play (`FREE_ERAS`, whose `requires`, `domains` and `unlock` already say what each era's airport had).

### 5.2 One dependency graph, one evaluator

Today the locks are spread: a project's stages have `after`, a mission `requires` projects, a small build has `from` and `needs` (`kerb`, `intl`, `security`…), a mission `unlocks` it, `setup.unlock` opens ladder levels, the computer room gates systems. Free Play needs **one** answer to *can I have this, and if not, why?* — for the buy menu, the plan panel, the Ops Center, the airline offers and the Development screen alike.

- **Data**: each thing gets a `free` field (or a table in `data/freeplay.js` keyed by the thing) with `era` (the era that opens it) and `needs`: a short list of conditions in one tiny syntax — `'project:intlTerminal'`, `'stage:apron2.bigStand'`, `'level:baggage>=1'`, `'fireCat>=9'`, `'pax>=800'`, `'stand:E'`, `'term:schengen'`, `'domain:border'`, `'flag:t1Gone'`. Existing `needs` words of `data/buildings.js` map onto it.
- **Code**: `sim/needs.js` — `Needs.check(list)` → `{ ok, first: { cond, text } }`, and `Needs.why(thing)` used by `Airport.why`, `Actions`, the plan panel and the UI (one sentence per condition in `ui/text.js`, translated). In missions it is not consulted (their locks stay as they are); in Free Play it replaces the mission locks.
- **Checked**: `tools/freeplay-bot.js --graph` fails on a cycle, a thing no path reaches, an era whose gate cannot be met with its own era's things, a `needs` naming something unknown.
- **Shown**: the **Development screen** (section 8): eras as columns, things as cards, lines to what they need; each locked card with its first unmet condition (*Needs: the international terminal*), each available one with price, nights, running cost, payback.

### 5.3 Everything bought must be useful

Every project, small build, ladder level and option has a **measurable effect** in the sim: capacity, income, a meter, a risk. Cosmetic things (banners, the Christmas tree, art, a livery for the apron vehicles) are marked `cosmetic: true`, cheap, and grouped apart. The bot's **ablation run** (section 11) plays the reference with one kind of purchase forbidden at a time: a non-cosmetic thing whose absence changes nothing (money, delays, meters, time to the next era) is reported as **useless** and fails the check. A thing at its limit is refused with the reason (as the buy menu does now), so nothing can be bought that does nothing.

---

## 6. Traffic, airlines, shops, the owner

### 6.1 The market

Missions script their airlines' routes (`setup.airlines`). Free Play needs traffic that grows by itself:

- **Potential demand**: departing passengers a day by `eraYear`, a curve in `data/freeplay.js` (anchored on the traffic of today's era presets and the real Arlanda's growth, scaled to the game's numbers), × the season (summer charters, Christmas), × the airport's **appeal**: the Passengers and Airlines meters, the fee level, the ground links (coaches, the train), the rivals' pull.
- **Served traffic** = what the airlines fly, limited by **capacity**: stands that fit at the peak hour, runway movements an hour, check-in, security and the border at the peak, the terminals' rooms.
- **Unserved demand is shown** with its bottleneck: *Demand 2 400 a day · you serve 1 900 · short of: stands 07–09 (Code C), check-in at 06:30*. This is the main "what should I build next" signal, in the Development screen, the night report and Kaj's hints.

### 6.2 Airlines come when the airport is ready, one at a time

- An airline is a **candidate** when `eraYear` is within its `years` and its needs are met (stand code, fire category, a terminal of its kind, Schengen or not, jet bridges, a cargo apron, charging stands). Needs come from its kind and temper (`data/airlines.js`), so they also explain *why not yet* (*Emirates would come with a Code F gate and fire category 10*).
- At most one new airline offer every `FREE_AIRLINE_EVERY` played months (start 2), in the inbox: its emblem, the flights it wants, its fees and temper, the incentive it asks; *Welcome* / *With an incentive* / *Not now* (it comes back later, less keen).
- **Existing airlines grow** by small steps (+1 flight a day on a route) when there is unserved demand for them and the capacity at their peak; they **shrink or leave** when their mood stays low (as in chapter 4 on: `Airlines.applyCut`). Real endings (Linjeflyg 1993…) happen by `eraYear`, told neutrally.
- **Contracts with promises and penalties** (planned in SPEC, not built) fit here later; not needed for the first version.

### 6.3 Shops, brands, rents

- The airport's own shops in cells (as now) from era 1; the **brands** ask for a unit from era 4, each from its year (`data/brands.js`), when a terminal has a free unit of its size and its passenger kind is there (families, business, transfers); one brand offer at a time, `FREE_BRAND_EVERY` months apart.
- Rents (offices, the hotel extension, Sky City, Cargo City) as now; the night report shows them.

### 6.4 The owner: budget, loans, grants, asks

- **Start**: the owner's budget of the era started from (the old eras' `setup.budget`) × the difficulty's money.
- **Loans** as now: `Finance.limit()` (8 % of what the airport owns, the era preset's `loanLimit` while bigger), interest every month.
- **Grants**: the owner pays a share of the **core** master-plan projects (`FREE_GRANT` by difficulty, start Easy 50 %, Medium 30 %, Hard 15 %), the state's projects (runway 3, the train with its concession choice) more — a lever to keep the pace within the targets.
- **The owner's asks** (rolling goals, replacing the missions' guidance): 2–4 per era in `data/freeplay.js`, one or two shown at a time — *Fly the first DC-8 to New York*, *Fire category 9 before the jumbo comes*, *No airline below 50 for six months*, *Keep the permit's caps*. Each uses `sim/goals.js` conditions and pays a grant and an Archive card; the historical ones carry their real date (*Real Arlanda: 26 June 1960*) as flavour. They are suggestions, never required.

---

## 7. Hands, people and automation without stages

- **The tray** works as now; the domains open by era, and every domain at level 0 is the player's hands (`hands` = all opened kinds).
- **The fatigue curve** (targets the bot measures): era 1 at attention pace 2–5 tasks a minute, rising to 6–8 at its end as SAS grows — the felt limit; era 2's teams bring it to 0–2; systems later. Hand work comes back in **crises**: a strike, a failure with the team laid off, a short team in July, the blackout. Each era should keep **1–3 real decisions per played month** (offers, builds, hires), so automated eras are not idle.
- **People**: hiring teams, heads in pairs from candidates (`People.candidates`), raises, poaching, retirements, wage rounds, the summer holidays and temps — as now, through the inbox. **Careers are scaled**: a game year is 12 played days, so `MANAGER_YEARS`, `MANAGER_RAISE_MONTHS`, wage rounds every 1–2 years and the readiness decay are read through `FREE_PEOPLE_X` so that a head lasts about two eras and a wage round comes about once an era, not every few minutes.
- **The ladder's lesson stays**: automation costs every month, needs IT people, fails, and the staff forget the manual way without drills; the finale's blackout tests it.

---

## 8. Screens

- **Start screen**: **Free Play** opens a small dialog: *From the forest (1958)* or *From an era* (the old era presets, each open once the campaign or an earlier Free Play reached it), the difficulty, **Historical events** On / Off (the pandemic, the ash cloud, closed skies, the IT outage in their eras), Auto pace. *Continue Free Play* when one exists (its era, month and money).
- **Game view**: the HUD of 3.6; the bar, the buy menu, the tray as now; the plan panel (projects, pace, mods, financing) open in the day too.
- **Development** (new, key **D**): the dependency graph by era (section 5.2): what is available now with price, nights and payback, what is locked and its first reason, the bottlenecks of the market (6.1), the next era's gate with its progress, the owner's asks. On a phone a list by era with filters (*Available*, *Locked*, *Built*).
- **Inbox** (new): offers and decisions with their deadlines and defaults, the decision card as now.
- **Night report** (new): section 3.5.
- **Era card / era change**: Astrid's briefing, the paper, Real Arlanda, the checkpoint.
- **Checkpoints** (new): from the pause menu and after a bankruptcy (section 9).
- The Office is not used: its screens (Finance, People, Ops Center, Airlines) open from the game, paused.

---

## 9. Saves, checkpoints, bankruptcy

Measured: an airport of 2040 is about **28 kB** of JSON (3 kB gzipped) without the history; an era-1 airport 11 kB.

### 9.1 Kinds of save

| Kind | When | Kept |
|---|---|---|
| **Autosave** | every `AUTOSAVE_SECONDS`, on hiding the page, in the pause menu (as missions) | 1 — the exact moment |
| **Dawn** | every dawn | the last `FREE_DAWNS_KEPT` (3) |
| **Milestone** | a core project finished, an owner's ask done, every 12 played months | the last `FREE_MILESTONES_KEPT` (6) |
| **Era start** | each era's gate passed (and the start) | all (≤ 9) |

Storage budget for Free Play: ≤ **600 kB** (the origin's localStorage is shared with every app: AGENTS.md), checked by the bot; compressed if needed. `S.log` and `S.stats` must stay bounded over a long game (the log is trimmed nightly, the stats already have caps).

### 9.2 Bankruptcy

Cash below zero for `DEBT_MONTHS` played months in a row (6 / 4 / 3 by difficulty): **the owner replaces the director**. Warnings come in the night report each month below zero (the owner's letter, the months left), with *Borrow* and what could be sold. The screen after it lists the checkpoints (dawns, milestones, era starts) with their era, month, money and debt; *Continue from here* (the difficulty may be changed, pre-selected), or *Start again*. Loading a checkpoint is also in the pause menu at any time.

### 9.3 Keys, cloud, old saves

- `arlandaRising.freeplay.v2` — the running game (its autosave); `arlandaRising.freeplay.cp.v1` — the checkpoints. The cloud syncs `freeplay.v2` like the campaign (the copy saved last wins, unknown fields kept) and the newest era start; dawns and milestones stay on the device (size).
- An old `freeplay.v1` (rounds) is **migrated**: its world goes on as a free game at its next dawn, its era from what it has built.

### 9.4 Determinism

The sim stays deterministic from its seed and state; the day's flights are made from the world's seed and the month (`hashOf('free', seed, month)`), so a resumed day plays the same. The bot checks a save and resume in the middle of a day and of a night.

### 9.5 Records

A run's record is **played months to 2040** (and the money then), per difficulty — independent of the speed buttons; a cheated run keeps none. Shown on the Free Play start and at the finale.

---

## 10. Difficulty

The three levels of `DIFFICULTY` (money, randomness, the airlines' patience, absence and failures, weather, deadlines, `DEBT_MONTHS`) apply as they are. Free Play adds:

| | Easy | Medium | Hard |
|---|---|---|---|
| Owner's grant on core projects (`FREE_GRANT`) | 50 % | 30 % | 15 % |
| Market growth | × 1.1 | × 1 | × 0.9 |
| Offer deadlines | 2 months | 1 month | 1 month |
| Auto-slow by default | on | off | off |

---

## 11. The bot: `tools/freeplay-bot.js`

Runs in Node with the same `vm` loading as `tools/missions-check.js` (no DOM), plays Free Play from the forest to 2040, and checks the balance. Its policy lives in `tools/freeplay-policy.js` (test code; it uses only `sim/actions.js`, as a player would).

**The reference director** (good, plain play): builds the core projects of its era in dependency order when the cash and the loan room allow, keeping a reserve; buys the small builds the bottleneck asks for; hires a team when its hand load passes a threshold, a system when its payback is under `N` months; accepts airline and brand offers when the capacity allows; answers wage rounds with the likely-accepted counter-offer; uses loans for big projects within the limit; repays when rich.

**The human hands model**: the bot does the tray's tasks only at `FREE_BOT_HANDS` tasks per **real** minute (start 5) after a reaction of `FREE_BOT_REACT` real seconds (start 3), with real time worked out from the pace function — so adaptive pace and the speed buttons are part of what is measured.

**Profiles**: `reference` · `hands` (never hires a team or buys a system) · `idle` (does nothing, every decision its default) · `notray` (leaves the tray to the duty manager) · `greedy` (borrows to the limit, builds everything) — each at Easy, Medium and Hard.

**Report** (stdout and the generated `docs/freeplay-balance.md`, regenerated like `docs/layout.svg`): per era and in all — real minutes at ▶ (attention, cruise, night, idle months, an estimate of decision time), played months, `eraYear` at the gate, hand tasks per real minute (mean and the busiest minute), the share of time at attention pace, decisions per month, cash (min, max, at the gate), debt and loan room, income and result a month, departing passengers a day and unserved demand, the meters, each purchase with its payback (and those that never pay back), the asks done, milliseconds of computing per played day.

**Fails when** (Medium unless said):
- the reference's whole run is outside 2.5–3.5 h at ▶, or an era is outside its target ±40 %;
- the reference goes bankrupt at any difficulty, or does not reach 2040;
- `idle` survives past era 2, or `hands` reaches era 4 (automation must be needed);
- the busiest minute of hand work passes 8 tasks, or era 1's mean is under 2 (too boring);
- an era has under 1 decision per played month on average;
- the graph check fails (`--graph`, section 5.2), or `--ablation` finds a useless non-cosmetic purchase (slow; run on demand);
- a save and resume in the middle of a day or a night ends differently;
- the stored saves pass the budget of 9.1, or a played day takes more than `FREE_DAY_MS_MAX` of computing.

Usage (planned): `node arlanda-rising/tools/freeplay-bot.js [--difficulty d] [--profile p] [--until era] [--graph] [--ablation] [--report]`.

---

## 12. Architecture: little new code, missions untouched

**Principle**: Free Play is **a new driver over the same sim**. Missions call `Ops.begin` / `Plan.begin` per stage; the free driver runs `day → night → day` with the same modules. Free-only behaviour sits in new files or behind `S.free`; every shared change is a refactor that keeps the missions' results identical.

| Piece | Reused | New or changed |
|---|---|---|
| The clock | `Sim.advance` / `Sim.step`, `OPS_STEP_MIN` | `Sim.advance` asks a **pace** provider for the seconds per step: missions keep their constant; Free Play uses `FreePace` (`sim/freepace.js`) |
| The day's flights | `Schedule.flight`, routes in `S.airlines` | `Schedule.fromRoutes(day profile)`: today's `FreePlay.flights` generalised to a whole day with waves by airline kind (`data/freeplay.js waves`) |
| Overnight aircraft | the `parked` series | `Ops.begin` gets a `carry` option: the aircraft of the evening stay on their stands to the morning (only Free Play uses it) |
| The night | `Summary.day`, `Construction.day`, `Plan.day`'s pieces, `Finance.running`, people's monthly drift | `Plan.dayCore()` extracted from `Plan.day` (same order, so missions do not change); `FreePlay.night()` runs it for the month's days |
| Decisions | the decision card, `Plan.choose`, `Offers.make` | `sim/inbox.js`: decisions with a deadline and a default that do not stop time |
| Locks | `Airport.why`, `Airport.needs`, `Missions.lockedBy` | `sim/needs.js` (section 5.2), consulted when `S.free` |
| Traffic growth | `Airlines`, `Meters`, `Summary.demand` | `sim/market.js` (section 6) |
| Eras, asks, gates | `Goals`, the eras of `FREE_ERAS` (as start presets) | `data/freeplay.js` (eras, gates, asks, the market curve, waves, start presets), `sim/freeplay.js` rewritten (lifecycle, day/night loop, eras, checkpoints' data) |
| Constants | — | `FREE_*` in `constants.js`, each with its unit |
| UI | HUD, bar, buy menu, tray, plan panel, cards, Finance, People, Ops Center, Airlines | `ui/development.js`, `ui/inbox.js`, `ui/nightreport.js`, `ui/checkpoints.js`; HUD and `game.js` read `S.free` |
| Tests | the `vm` loader of `missions-check.js` | `tools/freeplay-bot.js`, `tools/freeplay-policy.js`; the loader's file list shared (one list, not two) |

**Guardrails for every step**:
- `node arlanda-rising/tools/missions-check.js > before.txt` before touching shared code, the same after, `diff` empty (the method `SPEC.md` already uses for `sim/stats.js`); `terminals-check.js`, `turnaround-check.js`, `layout-check.js` pass.
- Free Play's numbers in `constants.js` and `data/freeplay.js`, never in logic files.
- Every new text through `tr()`, in the RU and SV tables in the same change; `i18n-check.js`.
- `SPEC.md` updated with what the step built; `?v=N` bumped; `sw-build.js` run.

---

## 13. What else must be thought of (risks and open points)

1. **The map in any build order.** The renderer, the fence and `layout-check.js` know the history's order (eras 1960, 1976, 1990, 2003, 2018, 2040). Free Play allows other orders (Sky City before Terminal 2, Pier F before the Schengen split). Needed: a check that builds **random valid orders** (by the graph) and runs the layout and fence checks and a render smoke test on each; the dependency graph may forbid orders the map cannot draw.
2. **Historical removals and renames**: the first terminal torn down (`oldHall`, needed for Gate F), Terminal 4 joined to 5, Terminal 3 mothballed and back — become player projects or era events; names follow `eraYear`.
3. **Overnight continuity**: aircraft parked overnight, a queue carried from the evening, snow left on the runway into the next month's day (each played day starts from the month's weather, not from yesterday: decided per state field).
4. **Event rates**: random events and failures were tuned for 3-hour stages; a 18-hour day and a summarised month need rates per month (`FREE_EVENTS_PER_MONTH`), or every day would have three failures.
5. **Performance on phones**: a played day of 2040 traffic is about 4 000 steps; at ▶▶▶▶ cruise that is a few hundred steps a real second (≈ 0.2 ms each in Node on a desktop, several times slower on a phone). Cap steps per frame and measure on a phone in step 5.
6. **The state growing over hours**: `S.log` trimmed, `S.traffic`, `S.stats` capped, offers and gone heads pruned — the bot checks the size after 77 months.
7. **Decision fatigue**: at most `FREE_OFFERS_MONTH` (2) new offers a month besides the urgent ones; defaults that are safe; deadlines that are clear.
8. **AFK**: a hidden tab pauses; a visible but untouched game runs, and its manual domains lose money (the sample rule of 3.2): by design, but the night report should say *Your duty manager ran the stands this month*.
9. **Exploits**: buying and selling back shops, borrowing to the limit before a gate, fees at the top then down, pausing a crisis — check with the `greedy` profile; pausing is allowed.
10. **The finale and after**: 2040's gate shows the finale (the busiest day, then the blackout if Historical events are on) and the record; then **endless** play with the market growing slowly and random events.
11. **Cheats** for testing (keyboard only, marked cheated): next era (its core projects built by the owner), skip a month, finish the projects, +money, the next event.
12. **When the mode opens** (agreed): *From the forest* is open from the start (it is the brisk way through the history; the start screen recommends the campaign to a newcomer); *From an era* is opened by the campaign or by reaching that era in Free Play.
13. **Spoilers of the campaign**: the eras use the campaign's history and newspapers; acceptable (Free Play is the second way), the campaign keeps its missions and story.
14. **The showcase, screenshot, READMEs** in three languages describe the mode at the end.

---

## 14. The plan, in steps of 2–3 hours

Each step ends in a working state, committed, with `SPEC.md` brought up to date for what it built, the missions unchanged (`missions-check.js` diff empty) and its own check runnable. A step may run into the next one's start if there is time; it never leaves shared code half refactored.

**Step 1 — The time core, headless.** `data/freeplay.js` (start presets from `FREE_ERAS`, waves), `FREE_*` constants, `sim/freepace.js`, the day/night loop in the new `sim/freeplay.js` (a played day from the routes with waves, overnight aircraft, the night with `Plan.dayCore()` over the month's days, `FREE_BUILD_X`, durations in nights), `Sim.advance` with the pace provider; `tools/freeplay-bot.js` v0: plays N months from an era preset with the routes fixed, prints the real seconds per day by pace, the milliseconds per day, and checks a resume mid-day and mid-night. *Done when* 24 months from the 1963 preset run deterministically and the missions' output is unchanged.

**Step 2 — Eras and dependencies.** `sim/needs.js` and the conditions' words; `free` fields (or tables) for projects, small builds, ladder levels; eras with core projects and gates; `eraYear`; the owner's grants; `Actions` and `Airport.why` through `Needs` when `S.free`; the start *From the forest*; `--graph`. *Done when* a scripted builder gets from the forest to era 3 headless and the graph check passes.

**Step 3 — Market, airlines, shops, inbox, asks.** `sim/market.js` (demand curve, appeal, capacity, bottlenecks), airline candidates and growth, brand offers, `sim/inbox.js` (deadlines, defaults, no time stop), the owner's asks with grants, careers scaled (`FREE_PEOPLE_X`), event rates per month. *Done when* traffic grows from era 1 to era 5 without scripted routes and the inbox is answered by defaults without stopping.

**Step 4 — The director bot and the first balance.** `tools/freeplay-policy.js` with the hands model and the profiles; the full report and `docs/freeplay-balance.md`; the fail criteria; the first tuning of `FREE_*`, gates, grants and the market so the reference lands near 3 h with the eras in their bands. *Done when* the reference reaches 2040 at the three difficulties and `idle` / `hands` fail where they should.

**Step 5 — Playable in the browser.** The start dialog, `Game` driving Free Play (pace, ½ speed, auto-slow, Watch, pause on big screens), the HUD (month, era chip, pace sign, inbox badge, the owner's ask), the night report, autosave and dawns, Stop at dawn; texts in three languages. *Done when* a game from the forest plays on a phone and a computer through era 1 (`tools/cdp.js` shots), resumes after a reload.

**Step 6 — Plan and explore.** The Development screen (graph, reasons, bottlenecks, the gate's progress), the inbox screen, the era change (Astrid, the paper, Real Arlanda, 🏅), Kaj's hints for Free Play (*SAS wants more flights — no Code C stand free at 07:00*). *Done when* `screens-shots.js` (or a free variant) shows them without overflow in EN and RU.

**Step 7 — Checkpoints, bankruptcy, saves.** Dawns, milestones, era starts; the checkpoints screen; the owner's warnings and the replacement; the storage budget and compression; `freeplay.v2` in the cloud save and the merge; the migration of `freeplay.v1`; the old rounds' code and screens removed. *Done when* a forced bankruptcy goes on from a checkpoint, a `freeplay.v1` save is migrated, `cloud-mock.js` passes.

**Step 8 — The map in any order, history and the end.** The random-order layout and render check and its fixes; razing and joining as projects; historical events by era (On / Off); the finale and endless play; the cheats. *Done when* 50 random orders pass and the finale plays headless.

**Step 9 — Balance with a person, texts, release.** A human playtest of era 1–2 and the bot's tuning after it; the RU and SV tables; the three READMEs; `SPEC.md` final; a showcase slide and the gallery card's line; `icons-build.js`, `sw-build.js`, the versions. *Done when* every check passes and the user has played an era.

**Step 10 — Buffer** for what the playtests find (expected: pace numbers, the market's curve, the number of offers).

---

## 15. Agreed with the user (2026-11-22)

1. **Opening**: *From the forest* is available from the start, not only after chapter 2.
2. **Auto pace default**: *Normal* (cruise 6 s a game hour).
3. **Historical crises** (the pandemic, closed skies, the IT outage): **Historical events** on by default.
4. **Old Free Play** (rounds): removed; its saves migrated (step 7).
5. **The target**: shortest pass ≈ 3 h at ▶ (2.5–3.5 h accepted).
