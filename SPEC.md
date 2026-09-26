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

A growing gallery of small, self-contained browser games and experiments. Each project lives in its own numbered folder with its own `index.html`, an English `README.md`, a Russian `README_RU.md`, and a `screenshot.png`. The repository root hosts an `index.html` gallery page that links out to every project, plus a screenshot preview for each.

## Projects

### 1 - flight simulator

First-person arcade flight game.

- First-person cockpit view (pseudo-3D perspective projection onto a 2D canvas, no WebGL)
- Steering: arrow keys (left/right = yaw with eased turn rate and visual bank, up/down = climb/descend with visual pitch)
- Twin-gun shooting (Ctrl, held to fire continuously) with synthesized "pew" sound effects, used to shoot down floating balloons for points
- Fly to a highlighted target airport, descend, align with the runway heading, and land within the runway bounds for points; missing the runway at zero altitude crashes the game
- Instrument panel: airspeed gauge, artificial horizon (mirrors bank/pitch), altimeter
- Terrain color/texture varies by world region and blends smoothly while flying
- Cockpit framing (canopy pillars, windshield header) fixed on screen; clouds stay level and do not rotate with aircraft bank

### 2 - fish frenzy

Top-down eat-and-grow arcade game ("Feeding Frenzy" style).

- Steering: arrow keys (left/right = turn, Ctrl or up = boost/dash that drains and regenerates a stamina meter)
- Touch: on coarse-pointer devices the start button requests fullscreen; a floating joystick in the left third of the screen sets the swim direction (the fish turns toward it), any touch held on the right two-thirds boosts; multi-touch so both work together
- Difficulty (picked on the start screen): Easy = food ×1.2, NPC speed ×0.9, boost capacity and regen ×1.5; Medium = baseline; Hard = food ×0.8, NPC speed ×1.1, boost capacity and regen ×0.75
- Growth: eating plankton grows the player slightly; eating a smaller fish grows it more and scores points proportional to that fish's size
- Eat/be-eaten rule: a fish can only eat another fish whose radius is smaller by at least 15% (`EAT_MARGIN`); near-equal sizes just bounce off each other with no effect
- Readability: every fish on screen is outlined green (safely eatable), red (dangerous to the player) or neutral white (similar size), computed live each frame
- NPC AI: each fish flees the nearest bigger threat in range, otherwise chases the nearest smaller prey in range, otherwise wanders; NPC sizes are spawned relative to the player's current size so difficulty scales with growth
- Infinite world: no side or top boundary — entities are continuously spawned within a radius of the player and recycled once they drift far away, so exploration never hits a wall
- The only boundary is the sea floor (a fixed world y). Depth (distance to the floor) drives difficulty and atmosphere: near the floor the water is dark, food is dense, and fish skew smallest; higher up the water lightens and fish skew larger and more dangerous. A HUD "depth" bar shows the player's position in that gradient
- Jellyfish are a non-lethal hazard: touching one shrinks the player slightly and slows them briefly, rather than ending the game. NPC fish take the same sting (shrink + brief slowdown) and steer away from any jellyfish within a short edge-to-edge distance, with that avoidance overriding flee/chase
- A short spawn invulnerability window (with a visible glow) prevents unfair instant deaths right after (re)starting
- Five size-based stages (fry → fish → big fish → shark → Sea King) drive the player's color and a camera that gradually zooms out as the player grows
- Reaching the final stage shows a one-time celebration banner; play continues afterwards as an endless high-score chase
- Test cheat: while playing, digit keys 1–9 set the player's radius (1–5 = one size inside each stage, 6–9 = progressively larger Sea King)

## Project structure

```
/
├── index.html              # root gallery page, links to every project
├── README.md                # repo documentation (English)
├── README_RU.md              # repo documentation (Russian)
├── SPEC.md                  # this file
├── AGENTS.md                 # instructions for AI coding agents working in this repo
├── CLAUDE.md                 # Claude Code entry point, points to AGENTS.md
├── LICENSE                  # MIT
├── 1 - flight simulator/
│   ├── index.html           # the game itself, fully self-contained
│   ├── README.md             # project documentation (English, player-facing)
│   ├── README_RU.md           # project documentation (Russian, player-facing)
│   └── screenshot.png        # preview image used by the gallery and both READMEs
├── 2 - fish frenzy/
│   ├── index.html           # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── utils.js              # math helpers
│   ├── audio.js              # Web Audio sound effects
│   ├── input.js              # keyboard, touch joystick/boost zones, fullscreen
│   ├── game.js               # world, difficulty, update and render loop
│   ├── README.md
│   ├── README_RU.md
│   └── screenshot.png
└── ... (future numbered project folders, same layout)
```

## GitHub Pages deployment

- Repo settings → Pages → **Deploy from a branch** → branch `main`, folder `/ (root)`.
- No build step: every file is served as-is. Pushing to `main` is the entire deploy process.
- All links between pages (root gallery → project folders, project → screenshot) use relative paths so the site works correctly under a subpath (`https://<user>.github.io/<repo>/`).
- Live URL: `https://gray0072.github.io/ivan/`

## Adding a new project

1. Create a new numbered folder at the root, e.g. `2 - <name>/`.
2. Put a self-contained `index.html` inside it (plus any assets it needs).
3. Add a `README.md` (English) and a `README_RU.md` (Russian), each written for players and linking to the other (same pattern as this repo's root READMEs).
4. Add a `screenshot.png` (or similar) preview image.
5. Add a card for it to the root `index.html` gallery and a row to the tables in the root `README.md` / `README_RU.md`.

## Backlog

- [ ] Add more mini-games/experiments to the gallery
- [ ] Add a search/filter control to the root gallery page once there are enough projects
- [ ] Add a light/dark toggle to the root gallery page (currently dark-only, matching the first project's cockpit theme)
