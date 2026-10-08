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

Cockpit-view flight simulator and airline career (three.js, vendored): it starts with Swedish domestic flights out of Stockholm Arlanda, then Scandinavia, then the whole world region by region (115 real airports, terrain built per flight from world coastline and mountain data). Gate-to-gate flights with pushback, engine start, taxi guidance, a real-forces flight model, an autopilot with NAV/ILS, emergencies worked with QRH checklists, contracts, ten aircraft and a training tree; playable in English, Russian or Swedish. Full spec: [`world-aviation/SPEC.md`](world-aviation/SPEC.md).

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
├── tools/pwa-icons.sh        # renders a folder's PWA PNG icons from its SVGs with headless Chrome
├── tools/i18n-check.js       # lists the tr() texts a translated game's language tables miss
├── assets/                  # gallery.css, gallery-lang.js (the gallery's texts in English, Russian and Swedish), gallery.js (the language switcher, remembered as ivanGallery.lang; picks up a new deploy via update.js), flag-gb/ru/se.svg (the switcher's flags), icon.svg (favicon + README logo), icon-maskable.svg, PWA PNGs (icon-192/512, icon-maskable-512, apple-touch-icon), social-preview.png (GitHub social preview, og:image)
├── flight-simulator/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html           # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── lang.js              # texts in English, Russian and Swedish, tr(), the language switcher
│   ├── game.js              # the whole game: world, plane, balloons, rendering, screens
│   ├── flag-gb.svg, flag-ru.svg, flag-se.svg  # the language switcher's flags
│   ├── update.js            # picks up a new deploy, reloading only on the start screen
│   ├── README.md             # project documentation (English, player-facing)
│   ├── README_RU.md           # project documentation (Russian, player-facing)
│   ├── README_SV.md           # project documentation (Swedish, player-facing)
│   ├── icon.svg              # project icon (favicon, READMEs, gallery card)
│   ├── icon-maskable.svg     # full-bleed Android home-screen icon (artwork in the safe circle)
│   ├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png  # PWA icons, rendered by tools/pwa-icons.sh
│   ├── manifest.webmanifest  # PWA manifest
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
│   └── screenshot.png
├── world-aviation/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html            # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── constants.js, game.js, career.js  # tuning, main loop and phase machine, the career
│   ├── lib/                  # three.min.js — three.js r147 (UMD), vendored
│   ├── core/                 # i18n (the game's language), utils, input, cursor (hidden in fullscreen while still), audio, update (picks up a new deploy)
│   ├── data/                 # airports, countries, airlines, emergencies, quizzes, lang-ru / lang-sv (translations), geodata (coastlines, mountains)
│   ├── art/                  # flags, landmarks (city symbols), airline emblems, region maps
│   ├── sim/                  # world (airports, taxiing, weather), terrain, flight dynamics, systems
│   ├── render/               # three.js: aircraft models, hangar pictures, airport3d, apron3d, scene3d
│   ├── ui/                   # instruments, cockpit, hud, ui (screens), filters (board and hangar), title (the title's sky)
│   ├── README.md, README_RU.md, README_SV.md
│   ├── docs/                 # instrument screenshots (English UI) used by the READMEs
│   ├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
│   ├── manifest.webmanifest  # PWA manifest
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
5. Give the game three difficulty levels (Easy / Medium / Hard), selectable on the start screen and in the restart dialog.
6. Add a `screenshot.png` preview image showing the English UI.
7. Make it an installable PWA: `icon-maskable.svg`, the PNGs from `tools/pwa-icons.sh <name>`, a `manifest.webmanifest` and the `<head>` links (see `AGENTS.md`).
8. Add a card for it to the root `index.html` gallery and a row to the tables in the root `README.md` / `README_RU.md` / `README_SV.md`.
9. List it in the `Projects` section above with a one-line summary and a link to its `SPEC.md`.

## Backlog

- [ ] Add more mini-games/experiments to the gallery
- [ ] Add a search/filter control to the root gallery page once there are enough projects
- [ ] Add a light/dark toggle to the root gallery page (currently dark-only, matching the first project's cockpit theme)
