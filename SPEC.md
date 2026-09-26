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
- Touch: on coarse-pointer devices the start button requests fullscreen; a floating joystick in the left half of the screen sets the swim direction (the fish turns toward it), any touch held in the right half boosts; multi-touch so both work together
- Difficulty (picked on the start screen): Easy = food ×1.2, NPC speed ×0.9, boost capacity and regen ×1.5; Medium = baseline; Hard = food ×0.8, NPC speed ×1.1, boost capacity and regen ×0.75
- Growth: eating plankton grows the player slightly; eating a smaller fish grows it more and scores points proportional to that fish's size. Each meal's area is queued and applied linearly over 5 seconds (`GROW_TIME`) instead of instantly
- Eating is mouth-only: a mouth circle in front of the gill line (`MOUTH_HIT`) must overlap any hit circle of the smaller fish (or the food). This applies both ways, so the player is safe right behind a bigger fish's tail until it turns around
- Eat/be-eaten rule: a fish can only eat another fish whose radius is smaller by at least 15% (`EAT_MARGIN`); near-equal sizes just bounce off each other with no effect
- Readability: every fish on screen is outlined green (safely eatable), red (dangerous to the player) or neutral white (similar size), computed live each frame
- NPC AI: each fish flees the nearest bigger threat in range, otherwise chases the nearest smaller prey in range, otherwise wanders; NPC sizes are spawned relative to the player's current size so difficulty scales with growth
- Infinite world: no side or top boundary — entities are continuously spawned within a radius of the player and recycled once they drift far away, so exploration never hits a wall
- The only boundary is the sea floor (a fixed world y). Depth (distance to the floor) drives difficulty and atmosphere: near the floor the water is dark, food is dense, and fish skew smallest; higher up the water lightens and fish skew larger and more dangerous. A HUD "depth" bar shows the player's position in that gradient
- Jellyfish are a non-lethal hazard: touching one shrinks the player slightly and slows them briefly, rather than ending the game. NPC fish take the same sting (shrink + brief slowdown) and steer away from any jellyfish within a short edge-to-edge distance, with that avoidance overriding flee/chase
- A short spawn invulnerability window (with a visible glow) prevents unfair instant deaths right after (re)starting
- Five size-based stages (fry → fish → big fish → shark → Sea King) drive the player's color and a camera that gradually zooms out as the player grows
- Rendering is devicePixelRatio-aware (capped at 2.5) so it stays sharp on phones
- Scenery (`scenery.js`, stateless): water gradient, surface light rays fading with depth, parallax motes, two parallax layers of far ridges, sand with ripples, and seaweed / rocks / starfish / shells generated per 64-unit floor cell from a deterministic hash; a vignette on top. Jellyfish come in several hues and glow more in dark water; boosting leaves a bubble trail
- Fish model: rounded body with a blunt snout; body and tail are one closed outline with an animated tail wag (faster while boosting), fins, gill line and a back-to-belly gradient; it's mirrored vertically when heading left so the belly stays down, and squashed near vertical headings for a rolling look
- Collisions use shapes that match the drawing: fish = 4 circles along the body axis (tail included), jellyfish = pulsing half-disk bell + 4 curved tentacles (each tested as two segments through the curve's midpoint), with the geometry cached once per frame and shared by collision and rendering; food, eating/being eaten and stings all test against these instead of a single center radius
- Reaching the final stage pauses the game and shows a Sea King dialog with the run's in-game time and the best time per difficulty (localStorage), with a "New record!" badge when beaten. Runs where the test cheat was used are marked and never saved. Options: Continue (default, grants a short invulnerability) or Play Again
- Test cheat: while playing, digit keys 1–9 set the player's radius (1–5 = one size inside each stage, 6–9 = progressively larger Sea King), 0 = max size
- Size cap `MAX_R = 500` for the player (growth is clamped) and for every spawned NPC. Reaching it pauses the game and shows the "Maximum size reached!" variant of the milestone dialog with its own per-difficulty best time (`fishFrenzy.bestMaxTime.<difficulty>`), a fanfare and a fireworks show (`fireworks.js`, separate canvas above the overlay, runs until the dialog closes). Continue keeps playing at the cap; Play Again restarts. In the last stage the HUD growth bar tracks progress toward the cap
- Sea King stage: jellyfish no longer sting the player; touching one with the mouth eats it (score + queued growth)
- Crowd control: NPC count scales down with player size (`npcCount`, down to 60% of `NPC_COUNT`) and their spawn/cull radius scales up (`npcSpawnRadius`, up to 1.5×); surplus bots are retired off-screen, farthest first

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
│   ├── scenery.js            # background: water, light rays, ridges, sand, seaweed, rocks
│   ├── fireworks.js          # fireworks show for the max-size dialog
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
