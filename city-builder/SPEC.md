# City Builder — SPEC

Developer/agent spec for the `city-builder` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

## Idea

A small city-building game for kids, in the spirit of SimCity but much simpler. The player lays roads and places houses, shops, factories and parks on a map with a river, a lake and forests. Residents move into the houses, work in the shops and factories and pay taxes; happy residents make their houses grow from small cottages into big apartment blocks. The city passes milestones (Village → Town → City → Metropolis) that unlock new buildings. Fires and floods can hit the city; fire stations and embankments protect it. The city is saved in the browser and can be continued later.

## Screens

- **Start screen:** the language switcher (EN · RU · SV) at the top, the title, **Continue** (only when a saved city exists, with its name, population, date and difficulty under it; the default button then), the difficulty (Easy / Medium / Hard toggles with a line on what the level changes), **New City** (a new random map; asks first when a saved city would be replaced), Sound On / Off, a **How to play** toggle and the records table. Behind it the saved city is drawn (or, with none, a fixed preview map that is never saved).
- **Game:** the map fills the screen. HUD at the top: money (a button: opens the budget; red and blinking in debt), population, date (month and year), the current title with a progress bar to the next one (its tooltip says how many residents that takes), the speed buttons ⏸ / ▶ / ▶▶ / ▶▶▶, the 😊 happiness overlay toggle and the pause button. Under it the alerts: a fire (with **Show me**, which centres the map on it), the flood, the damaged buildings (with **Repair all · $…**) and the debt (months left before bankruptcy). The build toolbar at the bottom: one button per tool (its picture drawn by the renderer, name, price, keyboard key); locked ones greyed out with 🔒 and the icon of the title that opens them, tapping one says which title that is; prices out of reach turn red. A tip next to the pointer (or above a ghost waiting for ✔) shows the price, or why it can't be built there. A short banner at the bottom shows messages.
- **Building card** (tap a building with no tool in hand): the name (a house by its level: Cottage / House / Apartment block; Ruins), what it does, residents and level, happiness with a bar and its parts (each +/− with its reason), hints (it will grow soon / needs a school), workers, upkeep, the "no road" / on fire / damaged warnings, and the Repair · $… / Demolish · $5 (Clear for ruins) buttons. The building's area of effect is tinted on the map and the building outlined while the card is open.
- **Budget card** (tap the money, or Budget in the pause dialog): last month's taxes from residents and businesses, upkeep of roads and bridges and of parks and services, the monthly total, jobs filled / jobs, unemployment, and the tax slider (0–20 %, default 9 %).
- **Pause dialog:** Continue (default), Budget, New City (asks to confirm), Main Menu (the city is saved first), Sound On / Off.
- **Milestone dialog:** the title's icon, "<name> is now a <title>!", what it unlocked, the in-game time it took and the best time for this difficulty, "New record!" when beaten, a note when cheats were used; fireworks at Metropolis. Continue keeps playing.
- **Game over (bankrupt):** the population and the age of the city, the difficulty toggles (pre-selected to the current level), Play Again (a new city at that level) / Main Menu. The saved city is deleted.

## The map

- A square grid of `MAP_SIZE` × `MAP_SIZE` tiles (48 × 48), drawn **isometric** (2:1 diamond tiles, `TILE_HW` × `TILE_HH` = 32 × 16 px at zoom 1) with Canvas 2D on a board with earth sides; all graphics procedural (no image files).
- Generated from a random seed for every new city (`sim/mapgen.js`): a river 2–3 tiles wide meandering from the top edge to the bottom one on the right part of the map (x 26–42), a lake away from the highway, forest patches (smooth noise) and small groves. The city starts empty except for the **highway**: `HIGHWAY_LEN` (7) road tiles coming in from the left edge (they can't be bulldozed), drawn fading out beyond the map; the field where it ends is cleared of forest. Land next to water is drawn as sand.
- Camera: pan and zoom (`ZOOM_MIN` 0.22 … `ZOOM_MAX` 2.6, starting at 1.1, 0.8 on a coarse pointer), clamped to the map; it starts centred on the houses (or the highway's end).
- Rendering (`render/render.js`): the ground is batched into one path per colour; buildings and forest tiles are drawn once into cached images per look and zoom step (2^¼ apart) by `render/sprites.js`; objects are sorted front to back (a is behind b when it lies wholly on the far side of b along u or v, else by the centre sum). While a tool is in hand a light grid shows; the ghost of a building is tinted green / red with its area of effect.
- Decorative life: cars drive the connected roads (one per `CAR_PER_RESIDENTS` 25 residents, up to `CARS_MAX` 60), factories smoke, planes take off from an airport every `PLANE_EVERY` 14 s, fire trucks drive to a fire along the roads and spray it, burning buildings flame and smoke, water ripples. Icons over buildings: 🚧 no road, 🔧 damaged, and with the 😊 overlay a face per house (green ≥ 70, light green ≥ 50, yellow ≥ 30, red below).

## Buildings and tools

| Tool | Key | Size | Price | Upkeep / month | Jobs | Unlocked at | What it does |
|---|---|---|---|---|---|---|---|
| Road | R | 1×1 | $10 ($50 over water: a bridge) | $1 ($3 a bridge) | — | start | Connects buildings; drag to draw a line. Every building must touch a road connected to the highway. |
| House | H | 1×1 | $100 | — | — | start | Home for residents. Grows on its own: level 1 cottage (4 people) → level 2 house (12) → level 3 apartment block (40). |
| Shop | S | 1×1 | $250 | — | 8 | start | Houses within 6 tiles +10 happiness. |
| Factory | F | 2×2 | $400 | — | 30 | start | Houses within 4 tiles −25 (each more factory −5, down to −40). |
| Park | P | 1×1 | $150 | $5 | — | start | Houses within 4 tiles +15. |
| Fire Station | E | 2×2 | $1 000 | $50 | 10 | Village | Covers 8 tiles: fires there are put out by its truck; houses in it +5. |
| Embankment | K | 1×1 | $50 | $1 | — | Village | Only on a land tile next to water; a flood does not spread past it. Drag to draw a line. |
| School | C | 2×2 | $1 500 | $80 | 20 | Town | Houses within 8 tiles +10, and they may grow to level 3. |
| Stadium | M | 3×3 | $5 000 | $150 | 30 | City | Houses within 10 tiles +15. |
| Airport | A | 4×8 | $20 000 | $300 | 150 | Metropolis | Doubles the new residents' draw (+1 to the demand per airport); houses within 6 tiles −15 (noise). |
| Bulldozer | B | — | $5 (a forest tile $20) | — | — | start | Removes a building, a road, ruins or trees; drag to clear a line. |

- Building on forest clears it for `FOREST_CLEAR_PRICE` ($20) a tile, added to the price. Nothing can be built on water, on a road, on another building, outside the map or on a flooded tile.
- A line (drag) goes from the first tile along the longer side, then the shorter one (an L); tiles that can't change are skipped; it is built as far as the money goes. The price of the whole line shows while dragging.
- Demolishing gives nothing back. Repairing costs half the price (`REPAIR_SHARE`).
- Upkeep is × the difficulty's `upkeepMul`. Prices, sizes and effects live in `data/buildings.js`, every other number in `constants.js`.

## Rules

- **Time:** one in-game month lasts `MONTH_SECONDS` (10 s) at ▶; ▶▶ is ×2, ▶▶▶ ×4, ⏸ stops it. Building is allowed while time is stopped. The month and everything in it (fires, trucks, floods, cars) run on game time.
- **Connection:** the road tiles connected to the highway's first tile are found by a flood fill whenever a road or a building changes; a building works only if one of them touches its side.
- **Jobs:** `WORKER_SHARE` (35 %) of the residents work. They fill the jobs of the working buildings (connected, not damaged, not burning, not ruins); unemployment = workers without a job / workers.
- **Happiness** (0–100 per house, `houseHappiness`): `HAPPY_BASE` 50 + the effects of the buildings around it (one of each kind counts, the strongest; factories add `HAPPY_EXTRA_FACTORY` per extra one) + 5 in a fire station's cover − unemployment × `HAPPY_UNEMPLOYMENT` (30) ± `HAPPY_TAX` (3) per tax % away from 9 % − 100 when damaged. Recomputed when something is built or removed, the tax changes, and every month.
- **Residents** (every month): a house with no road, damaged or in ruins empties. Below `LEAVE_HAPPINESS` (20) a fifth of its residents leave. At `MOVE_IN_HAPPINESS` (30) or more, its free room fills by free × `ARRIVE_RATE` (0.5) × demand × (0.5 + happiness / 100), at least one. Demand = 0.5 + (jobs − workers) / max(8, workers / 4), clamped to 0.15 … 1.5, +1 per working airport.
- **House growth:** a full house with happiness ≥ `GROW_HAPPINESS` (70) for `GROW_MONTHS` (3) months in a row grows a level, while unemployment is ≤ 10 %; level 3 also needs a working school within its radius. A house below `SHRINK_HAPPINESS` (25) for 3 months goes down a level.
- **Money:** every month taxes come in — residents × tax % × `TAX_PER_RESIDENT` ($40) and employed × tax % × `TAX_PER_WORKER` ($40), × the difficulty's `taxMul` — and the upkeep of roads, bridges and buildings (not ruins) goes out.
- **Bankruptcy:** money may drop below zero; after `debtMonths` months in a row in debt (Easy 6, Medium 4, Hard 3) the city is bankrupt and the game is over. A banner and a sound warn every month in debt; the HUD shows how many months are left.
- **Milestones** (`data/milestones.js`): Village at 50 residents, Town at 250, City at 1 000, Metropolis at 3 000, checked at the end of the month. Each unlocks new buildings (see the table). Metropolis is the "win": fireworks and a record, and the game goes on.

## Disasters

Disasters start once the city is a Village (`DISASTER_MILESTONE`); how often depends on the difficulty (`fireMonths`, `floodYears`).

- **Fire:** every month a fire starts with a chance of 1 / `fireMonths`, in a random building that can burn (houses, shops, factories, fire stations, schools, stadiums, airports; factories `FIRE_FACTORY_WEIGHT` 3× as often). Every `FIRE_SPREAD_EVERY` (5 s) it may jump (`FIRE_SPREAD_CHANCE` 0.15) to a building within `FIRE_SPREAD_GAP` (1 tile). If a fire station covers the building and its truck is free and a road path exists, the truck drives there at `TRUCK_SPEED` (5 tiles/s), sprays for `EXTINGUISH_TIME` (2 s) and drives back: the building is only damaged. A building still burning after `FIRE_BURN_TIME` (16 s) burns down to ruins, which do nothing until the bulldozer clears them.
- **Flood:** in the spring months (March–May) a flood starts with a chance of 1 / (`floodYears` × 3) a month. The water spreads `FLOOD_REACH_MIN`–`MAX` (2–3) tiles from every water tile over land (an embankment is neither flooded nor passed), rises over `FLOOD_RISE_TIME` (6 s), stays `FLOOD_HOLD` (10 s), and goes down over 6 s. Every building it reaches is damaged (an embankment never). Roads stay usable.
- **Damaged** buildings give no jobs, effects or homes until repaired (half the price, from the card or Repair all). A banner and a sound announce every disaster.

## Difficulty

| | Easy | Medium | Hard |
|---|---|---|---|
| Starting money | $20 000 | $12 000 | $8 000 |
| Taxes | ×1.2 | ×1.0 | ×0.85 |
| Upkeep | ×0.8 | ×1.0 | ×1.2 |
| A fire, on average | every 24 months | every 12 months | every 6 months |
| A flood, on average | every 4 years | every 2 years | every year |
| Months in debt before bankruptcy | 6 | 4 | 3 |

The difficulty is picked on the start screen and on the game-over screen, and remembered in `localStorage` (`cityBuilder.difficulty`). A saved city keeps the difficulty it was started with.

## Controls

- **Desktop:** pick a tool in the toolbar or by its key (R, H, S, F, P, E, K, C, M, A, B — by the key's place, `KeyR` etc., so they work on a Russian layout too; the same key again drops it). Left click builds (the ghost centred on the pointer shows where, green or red, with the price); with Road, Embankment or Bulldozer a left drag draws a line. With no tool, a click opens a building's card and a left drag pans; with a building tool a left drag pans. Right (or middle) drag or the arrow keys pan (`PAN_KEY_SPEED`), the wheel zooms at the pointer. Space stops / restarts time, `+` / `-` change the speed. Esc drops a line or a pending ghost, then the tool, then closes the card or the budget, then pauses.
- **Touch:** the split-screen joystick scheme of the other games does not fit a building game, so the map is handled like a map app: **one finger** taps to build (with a tool) or to open a building's card (without one); with the Road, Embankment or Bulldozer tool a one-finger drag draws a line, otherwise it pans; **two fingers** always pan and pinch-zoom (a line being drawn is dropped). Anything bigger than 1×1 shows the ghost first with a ✔ / ✖ bar; another tap moves the ghost, ✔ builds. On coarse-pointer devices Start / Continue / Play Again request fullscreen.
- Menus: arrow keys move the focus between the visible buttons, Space / Enter press the focused button (the default one when nothing is focused), Esc in the pause dialog continues.
- Mouse cursor: hidden in fullscreen while still (`core/cursor.js`).
- Updates: a new deploy reloads the page only on the start screen (`core/update.js`).

## Save and records

- The city is saved to `localStorage` (`cityBuilder.save.v1`: the city object with the terrain and roads as digit strings) every in-game month, on pause, on a milestone, on Main Menu and when the page is hidden. One saved city at a time; New City asks before overwriting it; bankruptcy deletes it.
- Records (`cityBuilder.records.v1`): per difficulty, the fewest in-game months to each milestone and the biggest population. A cheated city never updates them.

## Languages

English (default), Russian and Swedish, like `world-aviation`: every text goes through `tr()` (`core/i18n.js`), the static texts of `index.html` carry `data-i18n` (their inner HTML is the key) or `data-i18n-title`, and the translations live in `data/lang-ru.js` / `data/lang-sv.js`. Texts passed to `tr()` through a variable: the building and tool names and descriptions, house level names, milestone names (`data/`), month names and difficulty texts (`ui/screens.js`), the reasons a thing can't be built (`sim/build.js`) and the happiness parts (`sim/city.js`). The choice is remembered as `cityBuilder.lang` (first visit: the gallery's choice, then the browser's language, then English). City names are place names, the same in every language.

## Sound

Synthesized with Web Audio (`core/audio.js`, played only by `ui/sounds.js`): build thunk (bigger for big buildings), road click, bulldozer, error buzz, coins at the monthly tax, a chime when a house grows, fire alarm, burning down, the water spray, flood rush, repair, milestone fanfare, debt warning, bankruptcy, fireworks, and a soft city hum while playing that grows with the population. Sound On / Off on the start screen and in the pause dialog (`cityBuilder.sound`), through one master gain.

## Cheats (keyboard only, for testing)

Each shows a banner and marks the city as cheated (no records):

- `1`–`4` — the city becomes a Village / Town / City / Metropolis (its title and the buildings it unlocks)
- `5` — +$10 000
- `6` — start a fire at a random building
- `7` — start a flood
- `8` — every house fills up and grows one level
- `0` — unlock every building

## Testing recipes

- Headless logic: load `constants.js`, `data/buildings.js`, `data/milestones.js`, `core/utils.js`, `core/events.js`, `core/storage.js` (with a `localStorage` stub) and every `sim/` file into a `vm` context, then `newCity('medium', seed)`, `applyLine('road', lineTiles(...))`, `placeBuilding(type, x, y)` and call `cityUpdate(0.1)` / `trafficUpdate(0.1)` in a loop (100 calls = one month).
- In the browser (`tools/cdp.js`): `localStorage.clear(); I18N.set('en'); document.getElementById('newBtn').click()` starts a city; the same functions build it; `city.cheatUnlockAll = true; city.money = 1e6` opens everything; `Renderer.centerOn(u, v, zoom)` moves the camera; `startFire(b)` / `startFlood()` start a disaster.

## Files

```
city-builder/
├── SPEC.md
├── index.html          markup only, versioned <link>/<script> tags
├── styles.css
├── constants.js        tuning: map, camera, time, money, residents, happiness, disasters, decoration, difficulty table
├── game.js             main loop and the flow (menu, new / continue, pause, milestones, bankruptcy, cheats),
│                       gestures and keys turned into building, the per-frame update that runs sim/
├── data/
│   ├── buildings.js    the buildings and tools: size, price, upkeep, jobs, effects, unlock, key, texts
│   ├── milestones.js   the titles: population, name, icon; the city names
│   └── lang-ru.js, lang-sv.js   translations
├── core/
│   ├── i18n.js         tr(), the language switcher
│   ├── utils.js        math, seeded random, tile hash, money / number text, canvas scale, frame limiter
│   ├── events.js       the event bus from the logic to sounds and banners
│   ├── audio.js        Web Audio engine, the sound recipes (Sfx), the city hum (Ambience)
│   ├── input.js        mouse, touch (tap, drag, pinch), wheel, keys held, fullscreen
│   ├── storage.js      save / load of the city, the difficulty, the records
│   ├── cursor.js       hides the mouse cursor in fullscreen while it is still
│   └── update.js       picks up a new deploy, reloading only on the start screen
├── sim/                no drawing, no DOM, no sound
│   ├── state.js        shared state: the city (saved) and run (rebuilt), tile helpers
│   ├── mapgen.js       the random map: river, lake, forests, highway; newCity
│   ├── roads.js        connection to the highway, roads around a building, road paths
│   ├── build.js        placing, lines, demolishing, repairing; checks and prices
│   ├── city.js         happiness, the monthly update (residents, growth, taxes, debt, milestones), the clock
│   ├── disasters.js    fires (spread, trucks) and floods
│   └── traffic.js      decorative cars on the connected roads
├── art/
│   └── flag-gb.svg, flag-ru.svg, flag-se.svg   the language switcher's flags
├── render/
│   ├── sprites.js      procedural isometric drawings: buildings, ruins, trees, cars, trucks, planes
│   └── render.js       the canvas, camera, image cache, ground, depth-sorted objects, effects, ghost, tool icons
├── ui/
│   ├── screens.js      start menu, pause, milestone, game over, "new city?", records; date texts; menu keys
│   ├── hud.js          money, population, date, title bar, speed buttons, alerts, banner
│   ├── toolbar.js      the build tools
│   ├── info.js         the building card
│   ├── budget.js       the budget card and the tax slider
│   ├── sounds.js       game events → sounds
│   └── fireworks.js    the fireworks at Metropolis
├── README.md / README_RU.md / README_SV.md
├── icon.svg / icon-maskable.svg
├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
├── manifest.webmanifest
└── screenshot.png
```
