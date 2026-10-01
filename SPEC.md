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

A growing gallery of small, self-contained browser games and experiments. Each project lives in its own folder (lowercase, hyphen-separated, e.g. `flight-simulator`) with its own `index.html`, an English `README.md`, a Russian `README_RU.md`, a Swedish `README_SV.md`, and a `screenshot.png` (always showing the English UI). Every game has three difficulty levels (Easy / Medium / Hard), chosen on the start screen and in the restart dialog. The repository root hosts an `index.html` gallery page that links out to every project, plus a screenshot preview for each.

## Projects

Every project has its own `SPEC.md` inside its folder — that file is the source of truth for the game (idea, rules, controls, difficulty, files). This section only lists the projects.

### flight-simulator

First-person arcade flight game: fly over varied terrain, shoot balloons, land on target airports. Full spec: [`flight-simulator/SPEC.md`](flight-simulator/SPEC.md).

### fish-frenzy

Top-down eat-and-grow arcade game ("Feeding Frenzy" style): eat smaller fish, avoid bigger ones and jellyfish, grow through five stages up to the Sea King. Full spec: [`fish-frenzy/SPEC.md`](fish-frenzy/SPEC.md).

### fun-training

Training game for school kids: a process runs (a flower dries out, zombies approach a house, a train runs out of rails, a balloon sinks, a campfire burns down, a panda gets hungry) and the player keeps it going by answering tasks in time. Players, per-process progress tracks with stars, boss steps and replays for more coins, per-task-type settings. For TV (remote), desktop and phones. Full spec: [`fun-training/SPEC.md`](fun-training/SPEC.md).

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
├── assets/                  # icon.svg (favicon + README logo), icon-maskable.svg, PWA PNGs (icon-192/512, icon-maskable-512, apple-touch-icon), social-preview.png (GitHub social preview, og:image)
├── flight-simulator/
│   ├── SPEC.md               # the game's own spec
│   ├── index.html           # the game itself, fully self-contained
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
│   ├── utils.js              # math helpers
│   ├── audio.js              # Web Audio sound effects
│   ├── input.js              # keyboard, touch joystick/boost zones, fullscreen
│   ├── scenery.js            # background: water, light rays, ridges, sand, seaweed, rocks
│   ├── fireworks.js          # fireworks show for the max-size dialog
│   ├── constants.js          # game tuning constants (sizes, speeds, counts, timings, hit shapes)
│   ├── render.js             # canvas setup and drawing of fish, jellyfish, gulls, food, effects, touch controls
│   ├── quality.js            # Auto graphics: picks the preset from the device and the measured frame rate
│   ├── demo.js               # demo-mode pilot: steers the player with a bot-like brain (createDemoPilot)
│   ├── game.js               # world, difficulty, update loop; hands its state to render.js each frame
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
│   ├── *.js                  # constants, storage, audio, speech, nav, quality, fx, lesson, app
│   ├── tasks/                # task types (tasks.js dispatcher, math.js, scale.js, read.js + words.js)
│   ├── scenes/               # processes (flower, zombies, railway, balloon, campfire, panda)
│   ├── README.md
│   ├── README_RU.md
│   ├── icon.svg
│   ├── icon-maskable.svg     # full-bleed Android home-screen icon (artwork in the safe circle)
│   ├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png  # PWA icons, rendered by tools/pwa-icons.sh
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
