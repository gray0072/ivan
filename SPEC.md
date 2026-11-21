# SPEC

Authoritative developer/AI working spec for this repository. Not end-user documentation — see `README.md` for that.

## Stack

- No build tool, no package manager, no framework. Each project is a self-contained static page.
- HTML5 + CSS3
- Vanilla JavaScript (ES2017+)
- Canvas 2D API for rendering
- Web Audio API for sound effects (synthesized, no audio files)
- Deployment target: GitHub Pages, serving the repository root directly (no build step)

## Overview

A growing gallery of small, self-contained browser games and experiments. Each project lives in its own folder (lowercase, hyphen-separated, e.g. `flight-simulator`) with its own `index.html`, an English `README.md`, a Russian `README_RU.md`, a Swedish `README_SV.md`, and a `screenshot.png` (always showing the English UI). Every game has three difficulty levels (Easy / Medium / Hard), chosen on the start screen and in the restart dialog. The repository root hosts an `index.html` gallery page that links out to every project, plus a screenshot preview for each; a switcher with flags in its top left corner shows it in English, Russian or Swedish (first the browser's language, then the one picked last).

## Projects

Every project has its own `SPEC.md` inside its folder — that file is the source of truth for the game (idea, rules, controls, difficulty, files). This section only lists the projects.

### flight-simulator

First-person arcade flight game: fly over varied terrain, shoot balloons, land on target airports. Full spec: [`flight-simulator/SPEC.md`](flight-simulator/SPEC.md).

### fish-frenzy

Top-down eat-and-grow arcade game ("Feeding Frenzy" style): eat smaller fish, avoid bigger ones and jellyfish, grow through five stages up to the Sea King. Full spec: [`fish-frenzy/SPEC.md`](fish-frenzy/SPEC.md).

### fun-training

Training game for school kids: a process runs (a flower dries out, zombies approach a house, a train runs out of rails, a balloon sinks, a campfire burns down, a panda gets hungry) and the player keeps it going by answering tasks in time. Players, per-process progress tracks with stars, boss steps and replays for more coins, per-task-type settings; each player has an animal character to feed, dress and give a room, bought with the coins and diamonds. For TV (remote), desktop and phones. Full spec: [`fun-training/SPEC.md`](fun-training/SPEC.md).

### world-aviation

Cockpit-view flight simulator and airline career (three.js, vendored): it starts with Swedish domestic flights out of Stockholm Arlanda, then Scandinavia, then the whole world region by region (141 real airports, terrain built per flight from world coastline and mountain data). Gate-to-gate flights with pushback, engine start, taxi guidance, a real-forces flight model, an autopilot with NAV/ILS, emergencies worked with QRH checklists, contracts, eighteen real aircraft to lease, a training tree and a flight school of seven short lessons for a beginner — and, at the end, the An-225 Mriya to build again part by part and a flight round the world by the rules of the real records; playable in English, Russian or Swedish. Full spec: [`world-aviation/SPEC.md`](world-aviation/SPEC.md).

### city-builder

Isometric city-building game for kids (a simple SimCity): roads, houses, shops, factories and parks on a random map with a river, a lake and forests; residents, jobs, happiness and taxes; houses that grow into apartment blocks; milestones from Hamlet to Metropolis that unlock new buildings; fires, spring floods and bankruptcy; the city saved in the browser; playable in English, Russian or Swedish. Full spec: [`city-builder/SPEC.md`](city-builder/SPEC.md).

### yacht

The dice game Yacht (Yahtzee, dice poker) by the rules and score sheet of a family's paper game, for 1–10 players on one device: a leather cup and 3D dice on a table of your choice of colour and texture, saved groups of players, statistics, hints on three levels; playable in English, Russian or Swedish. Full spec: [`yacht/SPEC.md`](yacht/SPEC.md).

### wiggle-wars

Turn-based artillery game in the genre of Worms (original simple graphics): two teams of worms on a destructible 2D land over the water, a dozen weapons and tools (bazooka, homing missile, grenades, shotgun, bat, dynamite, mines, air strike, drill, jetpack, teleport, plank), wind, parachuted crates, mines, oil barrels, sudden death with rising water; one against one hot seat on one phone or tablet, against a computer that aims with the game's own physics, or a twelve-mission campaign with three stars each; worms per team, health, weapons, map kind and theme (a low-gravity Moon among them) are set before a match; playable in English, Russian or Swedish. Full spec: [`wiggle-wars/SPEC.md`](wiggle-wars/SPEC.md).

### lift-logic

Programming puzzle game: the player is the brain of a lift and builds its program from Scratch-like blocks (own look, a tap-first editor for phones), then watches a cut-away building live by it — people press the hall and cabin buttons, ride, get impatient and take the stairs; the program only reads what a real lift senses. A deterministic simulation and a block VM (events, threads, the lift's plan); missions with three stars, hints in three steps, an Inspector with "Show me" replays, the Engineer's record, comic lines and a Lift Museum of checked facts; the first chapters are Grandma's House, Maple School, the Grand Sunrise Hotel, St. Hope Hospital, the Glass Tower (several lifts running one program), the Mega Mall, the Eiffel Tower (own blocks with inputs, changing lifts) and the Empire State Building (zones, express trips, SCAN) — 72 missions, more buildings are planned up to a space elevator; playable in English, Russian or Swedish, the progress synced through Google. Full spec: [`lift-logic/SPEC.md`](lift-logic/SPEC.md).

### arlanda-rising

Management and strategy game about running Stockholm Arlanda through its real history, from the pine forest of 1958 to an Arlanda of 2040: an isometric Canvas 2D airport on the real runway geometry (seasons, the sun at 59.65° N, night lights, snow), real airlines in their liveries (simplified drawings), a deterministic headless simulation (flights, stands, turnarounds, check-in queues, snow and ploughs, money, five meters, plan-time construction by the historical master plan, decisions) with a task tray the player works by hand and a duty manager for what is missed; short missions in stages, autosaved every few seconds and resumed exactly, three stars each, balanced by a headless checker with reference strategies; the Office between missions; the automation ladder (teams, managers in pairs, unions and strikes, absence, systems with failures, fallback readiness, IT) with the People screen and the Ops Center; the terminals' shop units with real brands, security lanes, the airlines' tempers, route incentives, rivals and the Offers board, Finance with payback and net present value, Arlanda Express; the border and Schengen, security rules and lanes as a domain, two parallel runways, de-icing, real estate, random events, the green rating and the environmental permit; the storm years (mothballed terminals, furlough or lay-offs and rehiring through the security clearance, freighters, cyber attacks and outages that take every system down) and the future (electric aircraft and charging stands, apron robots, self-driving ploughs, hydrogen, the player's own pier, a final blackout); all eight chapters (1958–2040, 88 missions) playable, Free Play, three Challenge Days, a cloud save through Google; playable in English, Russian or Swedish. Full spec: [`arlanda-rising/SPEC.md`](arlanda-rising/SPEC.md).

## Project structure

```
/
├── index.html              # root gallery page, links to every project
├── README.md                # repo documentation (English)
├── README_RU.md              # repo documentation (Russian)
├── README_SV.md              # repo documentation (Swedish)
├── SPEC.md                  # this file
├── AGENTS.md                 # instructions for AI coding agents working in this repo
├── CLAUDE.md                 # Claude Code entry point, points to AGENTS.md
├── LICENSE                  # MIT
├── manifest.webmanifest      # PWA manifest of the gallery (icons from assets/)
├── sw.js                    # offline service worker of the gallery (generated by tools/sw-build.js)
├── tools/sw-build.js        # writes every app's offline service worker (sw.js) from tools/sw-template.js: its file list and a version hashed from them
├── tools/pwa-icons.sh        # renders a folder's PWA PNG icons from its SVGs with headless Chrome
├── tools/icons-build.js      # packs each game's arrows, symbols and emoji as drawings (tools/icons/: the engine, the one-colour signs, the Twemoji files)
├── tools/i18n-check.js       # lists the tr() texts a translated game's language tables miss
├── tools/cdp.js              # drives a page in headless Chrome (phone or desktop) from a steps file: screenshots, page errors
├── tools/showcase-gif.js     # joins screenshots of a game's stages into an animated, cross-faded docs/showcase.gif for its READMEs (plain Node)
├── tools/cloud-mock.js       # for testing a cloud save with tools/cdp.js: the repo over http, a fake Supabase session, a mock of its REST (offline, error, hang, ok)
├── docs/                    # the rules by area, for agents (AGENTS.md links each and sums it up): languages.md, mobile.md, pwa.md (icons, manifest, updates, offline), icons.md (arrows and emoji drawn), code-layout.md, new-project.md, cloud-save.md (rules, recipe, typical mistakes, tests), testing.md
├── .gitattributes            # every text file stored with LF line endings
├── assets/                  # gallery.css, gallery-lang.js (the gallery's texts in English, Russian and Swedish), gallery.js (the language switcher, remembered as ivanGallery.lang; picks up a new deploy via update.js; installs every game's offline worker), flag-gb/ru/se.svg (the switcher's flags), icon.svg (favicon + README logo), icon-maskable.svg, PWA PNGs (icon-192/512, icon-maskable-512, apple-touch-icon), social-preview.png (GitHub social preview, og:image), showcase.gif (the animated preview at the top of the root READMEs: 800 × 450 slides of the games, English UI, about 4.5 MB)
├── flight-simulator/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html           # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── lang.js              # texts in English, Russian and Swedish, tr(), the language switcher
│   ├── game.js              # the whole game: world, plane, balloons, rendering, screens
│   ├── flag-gb.svg, flag-ru.svg, flag-se.svg  # the language switcher's flags
│   ├── update.js            # picks up a new deploy, reloading only on the start screen; registers sw.js
│   ├── README.md             # project documentation (English, player-facing)
│   ├── README_RU.md           # project documentation (Russian, player-facing)
│   ├── README_SV.md           # project documentation (Swedish, player-facing)
│   ├── icon.svg              # project icon (favicon, READMEs, gallery card)
│   ├── icon-maskable.svg     # full-bleed Android home-screen icon (artwork in the safe circle)
│   ├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png  # PWA icons, rendered by tools/pwa-icons.sh
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                # offline service worker (tools/sw-build.js)
│   └── screenshot.png        # preview image (English UI) used by the gallery and all READMEs
├── fish-frenzy/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html           # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── constants.js          # game tuning constants (sizes, speeds, counts, timings, hit shapes)
│   ├── game.js               # main loop: graphics setting, flow between the screens, per-frame update; hands the state to render/render.js
│   ├── data/                 # milestones.js — Sea King / max size milestone texts and record keys
│   ├── core/                 # utils, events (bus from the logic to sounds and messages), audio, input (keyboard, touch joystick/boost zones, fullscreen), quality (Auto graphics), cursor (hidden in fullscreen while still), update (picks up a new deploy)
│   ├── sim/                  # state, fish (stages, growth, sizes, hit shapes), camera, spawn, effects, leaps, jellyfish, gulls, npc (bot brain), player, records, demo (demo-mode pilot)
│   ├── render/               # render.js (canvas, fish, jellyfish, gulls, effects), scenery.js (background)
│   ├── ui/                   # overlay (panels, banner), menu (records table), dialogs (milestone, game over), hud, sounds (game events → sounds), fireworks
│   ├── README.md
│   ├── README_RU.md
│   ├── README_SV.md
│   ├── icon.svg
│   ├── icon-maskable.svg     # full-bleed Android home-screen icon (artwork in the safe circle)
│   ├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png  # PWA icons, rendered by tools/pwa-icons.sh
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                # offline service worker (tools/sw-build.js)
│   └── screenshot.png
├── fun-training/
│   ├── SPEC.md               # the game's own spec (screens, rules, files)
│   ├── index.html            # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── constants.js, progress.js, app.js  # tuning, levels and stars, screens and the main loop
│   ├── core/                 # storage, audio, speech, nav (keyboard / TV-remote focus), quality, cursor (hidden in fullscreen while still), update (picks up a new deploy)
│   ├── ui/                   # stars, lesson, muncher (pause dialog), room
│   ├── tasks/                # task types (tasks.js dispatcher, math.js, scale.js, read.js + words.js)
│   ├── scenes/               # fx.js shared drawing helpers + processes (flower, zombies, railway, balloon, campfire, panda)
│   ├── characters/           # the player's animal characters as SVG (species.js, look.js)
│   ├── items/                # shop: food.js, clothes.js + wear/<slot>.js, furniture.js + room/<slot>.js, shop.js
│   ├── README.md
│   ├── README_RU.md
│   ├── icon.svg
│   ├── icon-maskable.svg     # full-bleed Android home-screen icon (artwork in the safe circle)
│   ├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png  # PWA icons, rendered by tools/pwa-icons.sh
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                # offline service worker (tools/sw-build.js)
│   └── screenshot.png
├── world-aviation/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html            # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── constants.js, game.js, career.js  # tuning, main loop and phase machine, the career
│   ├── lib/                  # three.min.js — three.js r147 (UMD), supabase.min.js — supabase-js (the cloud save), vendored
│   ├── supabase/             # schema.sql — the cloud save's table (worldaviation_careers, a row per career), run in Supabase
│   ├── core/                 # i18n (the game's language), utils, input, cursor (hidden in fullscreen while still), audio, crowd, fanfare, update (picks up a new deploy), cloud (the cloud save: a Google sign-in per career, sync)
│   ├── data/                 # airports, countries, airlines, emergencies, lessons (the flight school), quizzes, mriya (the An-225's parts), rtw (the routes round the world, the sponsor), lang-ru / lang-sv (translations), geodata (coastlines, mountains)
│   ├── art/                  # flags, landmarks (city symbols), airline emblems, region maps, the Mriya's blueprint, globe (the globe round the world)
│   ├── sim/                  # world (airports, taxiing, weather), terrain, flight dynamics, systems, guidance, taxilimit (taxi speeds), copilot (the first officer taxiing in), lesson (the flight school's lesson under way, the instructor's help), airframe (an aeroplane's shape), collide (collisions with the buildings and the parked aeroplanes), traffic (the other aeroplanes taxiing, taking off and landing), rtw (round the world: the rules, the expedition)
│   ├── render/               # three.js: aircraft models, hangar pictures, the Mriya's hologram, airport3d, apron3d, baggage3d, servicing (the ground crew's ways clear of the wings), cargo3d, ga3d, responders3d, turnaround3d (the ground crew at the arrival stand), salute3d (the water arch home from round the world), followme3d, incident3d (after a collision), traffic3d (the other aeroplanes), landcover, scene3d
│   ├── ui/                   # instruments, cockpit, hud, ui (screens), coach (a lesson's steps in the flight), school (the flight school's screens), filters (board and hangar), title (the title's sky), mriya (the assembly hall), fireworks, rtw (round the world: its screen, the finish, the certificate), incident (after a collision)
│   ├── README.md, README_RU.md, README_SV.md
│   ├── docs/                 # instrument screenshots and showcase.gif (English UI) used by the READMEs
│   ├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                # offline service worker (tools/sw-build.js)
│   └── screenshot.png
├── city-builder/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html            # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── constants.js, game.js # tuning, main loop and the flow (menu, play, pause, milestones, bankruptcy, cheats)
│   ├── data/                 # buildings (the toolbar's tools), milestones, lang-ru / lang-sv (translations)
│   ├── core/                 # i18n, utils, events, audio, input (mouse, touch gestures, keys, fullscreen), storage (the saved city, records), cursor, update
│   ├── sim/                  # state, mapgen (the random map), roads, build, city (the monthly life), disasters (fires, floods), traffic
│   ├── art/                  # flag-gb / flag-ru / flag-se.svg (the language switcher)
│   ├── render/               # sprites (procedural isometric drawings), render (camera, ground, depth-sorted objects, effects)
│   ├── ui/                   # screens, hud, toolbar, info (the building card), budget, sounds, fireworks
│   ├── README.md, README_RU.md, README_SV.md
│   ├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                # offline service worker (tools/sw-build.js)
│   └── screenshot.png
├── yacht/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html            # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── constants.js, game.js # tuning, the flow (screens, buttons, keys, saving, cheats)
│   ├── data/                 # rows (the rows of the sheet), lang-ru / lang-sv (translations)
│   ├── core/                 # i18n, utils, events, audio, groups (the saved groups and settings), cursor, update
│   ├── sim/                  # state, scoring, turn (rolling, holding, writing, undo), advisor (the best move), stats
│   ├── art/                  # cup.svg (the leather cup), flag-gb / flag-ru / flag-se.svg (the language switcher)
│   ├── ui/                   # dice (the cup and the 3D dice), table (the score sheet), card, screens, groups (the editor), statsview, tabletop (the table's colour and texture), sounds, fireworks
│   ├── README.md, README_RU.md, README_SV.md
│   ├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                # offline service worker (tools/sw-build.js)
│   └── screenshot.png
├── wiggle-wars/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html            # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── constants.js, game.js # tuning, the flow (menu with the CPU demo, setup, campaign, match, pause, results, cheats)
│   ├── data/                 # weapons, themes (and the map kinds), missions (the campaign), names (worms, team colours), lang-ru / lang-sv (translations)
│   ├── core/                 # i18n, utils, events, audio, input (keys, touch joystick, taps, pinch, mouse, fullscreen), storage (setup, campaign stars), cursor, update
│   ├── sim/                  # state, terrain (the land bitmap), mapgen (the four map kinds), physics (bodies), weapons (shots, explosions), objects (crates, mines, barrels, targets), turn (the turn's phases, Control), match (a new match or mission), ai (the computer)
│   ├── art/                  # weapons (the weapons' pictures), flag-gb / flag-ru / flag-se.svg (the language switcher)
│   ├── render/               # camera, terrainview (the land canvas, craters), backdrop (sky, parallax, water), render (worms, objects, shots, effects, aim)
│   ├── ui/                   # screens, setup (the versus setup), hud, arsenal (the weapon panel), sounds, fireworks
│   ├── README.md, README_RU.md, README_SV.md
│   ├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                # offline service worker (tools/sw-build.js)
│   └── screenshot.png
├── lift-logic/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html            # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── constants.js, game.js, progress.js # tuning, the flow (menu, buildings, mission card, editor, runs, results, pause, cheats), stars and unlocks (and the cloud copy's merge)
│   ├── lib/                  # supabase.min.js — supabase-js (the cloud save), vendored
│   ├── supabase/             # schema.sql — the cloud save's table (liftlogic_progress, a row per account), run in Supabase
│   ├── data/                 # blocks (the language), buildings, lifts, people, missions/ and solutions/ (per building), facts (Museum, concept cards), jokes, lang-ru / lang-sv
│   ├── core/                 # i18n, utils, events, storage, audio (sounds and the lift music), cursor, update, icons, cloud (the cloud save: a Google sign-in, sync)
│   ├── sim/                  # state, building (hall calls), lift (motion, doors, plan), people, sensors, program (blocks tree, text notation, Text view), vm (threads, events), run, stats (stars), inspector
│   ├── art/                  # people, cabins, interiors, buildings (silhouettes, logo), flag-gb / flag-ru / flag-se.svg
│   ├── render/               # view (camera, layout, taps), building (the cut-away building)
│   ├── ui/                   # blockview, editor, palette, slots, runbar, hud, hints (and the guide), textview, results, jokes (and the newspaper), museum, screens, sounds, fireworks
│   ├── tools/                # missions-check (runs every reference solution), texts-check (every text translated)
│   ├── docs/                 # showcase.gif (the buildings from Grandma's House to the Empire State Building, English UI) used by the READMEs
│   ├── README.md, README_RU.md, README_SV.md
│   ├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                # offline service worker (tools/sw-build.js)
│   └── screenshot.png
├── arlanda-rising/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html            # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── constants.js, game.js, progress.js # tuning, the flow (menu, timeline, mission card, play, stage cards, results, Office, cheats, autosave), stars and the campaign
│   ├── data/                 # aircraft, airlines (liveries by era), buildings, masterplan (historical projects), layout (the map: real runway geometry, apron, roads, Märsta), domains, missions/ and strategies/ (per chapter), lang-ru / lang-sv, icons
│   ├── core/                 # utils (money()), events, storage (keys, mission autosave), i18n, settings, audio, input (map gestures), cursor, update, icons
│   ├── sim/                  # state, calendar (the sun), weather, finance, meters, airport, stands, schedule, runways (snow, ploughs, noise), passengers, turnaround, flights, tasks (the tray, the duty manager), construction, summary, plan, ops, goals, missions, actions, sim (the clock), strategy, cheats
│   ├── art/                  # emblems (airline fin art), flag-gb / flag-ru / flag-se.svg
│   ├── render/               # palette, iso (camera, projection), ground (forest, fields, lakes, clearings, Märsta), airport (runway, apron, buildings by stage), aircraft, traffic (aircraft paths, vehicles, people, turnaround bars), sky (light, fog, snow, lamps), map (a frame, taps)
│   ├── ui/                   # text, screens, hud, tray, toolbar, plan (projects, decisions), cards (the flight card), timeline, missioncard, results, office, hints (Kaj, the guiding finger), sounds
│   ├── tools/                # missions-check (plays every mission with its reference strategy, balances the chapter)
│   ├── docs/                 # showcase.gif (the eras from 1958 to 2040, English UI) used by the READMEs
│   ├── README.md, README_RU.md, README_SV.md
│   ├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                # offline service worker (tools/sw-build.js)
│   └── screenshot.png
└── ... (future project folders, same layout)
```

## GitHub Pages deployment

- Repo settings → Pages → **Deploy from a branch** → branch `main`, folder `/ (root)`.
- No build step: every file is served as-is. Pushing to `main` is the entire deploy process.
- All links between pages (root gallery → project folders, project → screenshot) use relative paths so the site works correctly under a subpath (`https://<user>.github.io/<repo>/`).
- Live URL: `https://gray0072.github.io/ivan/`

## Adding a new project

1. Create a new folder at the root named in lowercase kebab-case, e.g. `<name>/` (`flight-simulator`).
2. **Spec first:** write `<name>/SPEC.md` (idea, screens, rules, controls incl. touch, difficulty levels, cheats, files) and agree on it before writing any game code.
3. Put a self-contained `index.html` inside it (plus any assets it needs), implementing the spec.
4. Add a `README.md` (English), a `README_RU.md` (Russian) and a `README_SV.md` (Swedish), each written for players and linking to the other two (same pattern as this repo's root READMEs).
5. Give the game three difficulty levels (Easy / Medium / Hard), selectable on the start screen and in the restart dialog, and a Sound On / Off switch on the start screen and in the pause (see `AGENTS.md`; the whole procedure: `docs/new-project.md`).
6. Add a `screenshot.png` preview image showing the English UI.
7. Make it an installable PWA: `icon-maskable.svg`, the PNGs from `tools/pwa-icons.sh <name>`, a `manifest.webmanifest`, the `<head>` links and its offline `sw.js` from `node tools/sw-build.js <name>` (see `docs/pwa.md`).
8. Add a card for it to the root `index.html` gallery and a row to the tables in the root `README.md` / `README_RU.md` / `README_SV.md`.
9. List it in the `Projects` section above with a one-line summary and a link to its `SPEC.md`.

## Backlog

- [ ] Add more mini-games/experiments to the gallery
- [ ] Add a search/filter control to the root gallery page once there are enough projects
- [ ] Add a light/dark toggle to the root gallery page (currently dark-only, matching the first project's cockpit theme)
