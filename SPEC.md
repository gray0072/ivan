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

A growing gallery of small, self-contained browser games and experiments. Each project lives in its own numbered folder with its own `index.html` and `README.md`. The repository root hosts an `index.html` gallery page that links out to every project, plus a screenshot preview for each.

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

## Project structure

```
/
├── index.html              # root gallery page, links to every project
├── README.md                # repo documentation (English)
├── SPEC.md                  # this file
├── LICENSE                  # MIT
├── 1 - flight simulator/
│   ├── index.html           # the game itself, fully self-contained
│   ├── README.md             # project documentation (Russian, player-facing)
│   └── screenshot.png        # preview image used by the gallery and both READMEs
└── ... (future numbered project folders)
```

## GitHub Pages deployment

- Repo settings → Pages → **Deploy from a branch** → branch `main`, folder `/ (root)`.
- No build step: every file is served as-is. Pushing to `main` is the entire deploy process.
- All links between pages (root gallery → project folders, project → screenshot) use relative paths so the site works correctly under a subpath (`https://<user>.github.io/<repo>/`).
- Live URL: `https://gray0072.github.io/ivan/`

## Adding a new project

1. Create a new numbered folder at the root, e.g. `2 - <name>/`.
2. Put a self-contained `index.html` inside it (plus any assets it needs) and a `README.md` written for players, in whichever language fits the project.
3. Add a `screenshot.png` (or similar) preview image.
4. Add a card for it to the root `index.html` gallery and a row to the table in the root `README.md`.

## Backlog

- [ ] Add more mini-games/experiments to the gallery
- [ ] Add a search/filter control to the root gallery page once there are enough projects
- [ ] Add a light/dark toggle to the root gallery page (currently dark-only, matching the first project's cockpit theme)
