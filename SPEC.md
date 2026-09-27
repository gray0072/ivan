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

A growing gallery of small, self-contained browser games and experiments. Each project lives in its own numbered folder with its own `index.html`, an English `README.md`, a Russian `README_RU.md`, a Swedish `README_SV.md`, and a `screenshot.png` (always showing the English UI). Every game has three difficulty levels (Easy / Medium / Hard), chosen on the start screen and in the restart dialog. The repository root hosts an `index.html` gallery page that links out to every project, plus a screenshot preview for each.

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
- Difficulty (picked on the start screen): Easy = food ×2, NPC speed ×0.9, boost capacity and regen ×1.5, NPC aim error ±20°, reaction 0.3 s; Medium = food ×1.5, NPC speed ×0.95, boost capacity and regen ×1.25, aim error ±10°, reaction 0.25 s; Hard = baseline, aim error ±5°, reaction 0.2 s
- Growth: eating plankton grows the player slightly; eating a smaller fish grows it more. There is no score; the HUD shows the player's weight and length, and the game-over text repeats them. Every meal plays a quick bite animation (`CHOMP_TIME`: a dark wedge opens in the snout and snaps shut), for the player and NPCs alike; from the Shark stage on (`NO_FOOD_CHOMP_STAGE`) plankton is swallowed without it. Each meal's area is queued and applied linearly over 3 seconds (`GROW_TIME`) instead of instantly
- Eating is mouth-only: a mouth circle in front of the gill line (`MOUTH_HIT`) must overlap any hit circle of the smaller fish (or the food). This applies both ways, so the player is safe right behind a bigger fish's tail until it turns around
- Eat/be-eaten rule: a fish can only eat another fish whose radius is smaller by at least 15% (`EAT_MARGIN`); near-equal sizes just bounce off each other with no effect
- Readability: every fish on screen is outlined green (safely eatable), red (dangerous to the player) or neutral white (similar size), computed live each frame. Danger radar (`drawDangerRadar` in `render.js`, `RADAR_*` constants): every NPC that could eat the player whose body is off-screen but within `RADAR_RANGE` (1.2 screen half-diagonals) beyond the edge draws an additive red glow sprite stretched along the screen border where the line from the screen center to the fish crosses it, plus a chevron just inside pointing at it. Strength = fade-in (first 40 px off-screen) × closeness^1.4 × size factor (radius ratio from `EAT_MARGIN` up to `RADAR_FULL_RATIO` = 3) × 0.75 (1 when the fish is chasing and heading within ~37° of the player, which also doubles the chevron). The glow beats with a double-thump heartbeat whose rate goes from `RADAR_BEAT_MIN` to `RADAR_BEAT_MAX` with closeness (×1.3 when hunting); the phase is integrated per fish. Shown only while playing, on both graphics presets
- NPC AI: each fish flees the nearest bigger threat in range, otherwise chases the nearest smaller prey in range, otherwise wanders. Threats and prey are re-scanned only every `npcReaction` s (±20%, a human-like reaction delay; the fish acts on the last seen direction in between); flee / chase directions carry an aim error that drifts smoothly within ±`npcAimError` (new target every 0.8–1.6 s, eased), and turning is proportional to the heading error (`NPC_TURN_GAIN`), capped by the size's turn rate, so there's no jitter; NPC sizes are spawned relative to the player's current size so difficulty scales with growth: the size ratio is log-normal (σ = 0.25, with 20% of the mass moved from the ±1σ middle to the tails: 20% of samples are drawn only from |z| > 1) around a center that depends mostly on the player's depth (×0.8 near the floor … ×1.2 in the shallows), plus 10% small fry (×0.3–0.55), clamped to `MAX_R`. Giants are thinned out: a spawn bigger than `GIANT_R` = 180 is kept with probability (180 / r)² (52% at r = 250, 26% at 350, 13% at 500), otherwise it becomes a small fish (×0.3–0.55 the player), so a Sea King meets ~2–4 fellow kings around instead of 10–18; each NPC also gets a fixed ±3% speed variation
- Spawning never pops into view: fish and jellyfish are placed in an area-uniform ring around the player whose inner radius is "screen half-diagonal / zoom + the object's full extent" (fish extent = 1.9r, so even a huge tail stays off-screen); points outside the water column are mirrored vertically. Cull distances are likewise kept above the off-screen distance
- Infinite world sideways: no side boundary — entities are continuously spawned within a radius of the player and recycled once they drift far away, so exploration never hits a wall
- Vertical bounds: the sea floor (`FLOOR_Y`) and the water surface (`SURFACE_Y = FLOOR_Y - WATER_DEPTH`, `WATER_DEPTH = 2600`). The depth is sized so a full-dash climb takes 10–20 s at every size (fry 150×1.7 u/s → 10.2 s; giants at the 77 u/s speed floor → 19.9 s) and the largest fish (r = 500, ~1050 tall, ~1400 long) still fits ~2.5 times. Depth drives difficulty and atmosphere: near the floor the water is dark, food is dense, and fish skew smallest; toward the surface the water lightens and fish skew larger and more dangerous. A HUD "depth" bar shows the player's position in the column. Food, jellyfish and spawns stay inside the column (spawn points outside it are mirrored vertically)
- Leaps: when a fish's center crosses the surface going up it either skims (held at the surface) or launches, if its arc would lift it at least 0.3r. A dash (player boost, or NPC chase/flee/leap) guarantees an exit speed high enough to rise 1.3r on a steep exit; the launch angle is capped at ~69° so the fish arcs over instead of flipping. In the air only gravity acts (`450 × (r/14)^0.35`, so big fish don't hang for ages), the nose follows the velocity, and there's no steering. Exit and splashdown spawn a splash: ballistic droplets, a spray crown, foam on the waterline, entry bubbles and a filtered-noise sound. Wandering NPCs near the surface occasionally decide to leap (dash steeply up)
- Seagulls (easter egg): 6 gulls fly over the water at 50–450 above the surface (skewed low), flapping and gliding, recycled horizontally around the player. The lowest height is set so a fry's full-dash leap reaches it (center apex 238² / 900 = 63 plus mouth and hit radius). What a leaping fish (player or NPC) does to a gull depends on its stage (`GULL_PREY_STAGE`, `GULL_SCARE_STAGE`): a Fry whose body touches a gull is snatched — the gull flies off up and away with the fish dangling from its beak and a laughing squawk; for the player that's game over ("A seagull got you!"; not while invulnerable), and the gull keeps flying behind the game-over panel. A Small Fish that touches a gull knocks it: a few feathers, a thump and a "kek-kek!", and the gull flies off. Big Fish and bigger eat a gull their mouth reaches: growth, a burst of feathers that sway down and float on the water, a "Gull snack!" banner and a dead-gull sound (chomp, a "KYAAH!" squawk and a sagging strangled wail: vibrato sawtooth through a bandpass). Leaving gulls climb away and are removed above `BIRD_LEAVE_H`; NPC encounters play the same sounds scaled by distance and size, like splashes. Gull eating isn't spelled out in the player docs, only hinted at, but the fry danger is
- Jellyfish are a non-lethal hazard: touching one shrinks the player slightly and slows them briefly, rather than ending the game. NPC fish take the same sting (shrink + brief slowdown) and steer away from any jellyfish within a short edge-to-edge distance, with that avoidance overriding flee/chase
- A short spawn invulnerability window (with a visible glow) prevents unfair instant deaths right after (re)starting
- Five size-based stages (fry → fish → big fish → shark → Sea King) drive the player's color and a camera that gradually zooms out as the player grows
- Rendering is devicePixelRatio-aware (capped at 2.5) so it stays sharp on phones; on huge screens the canvas backing store is further capped at 2560×1440 pixels (`canvasScale` in `utils.js`) and the browser upscales it, and the game and fireworks loops are limited to 60 fps (`frameLimiter`) so 120/144 Hz monitors don't double the GPU load. A Graphics switch on the start screen (High / Low, `GRAPHICS` in `render.js`, remembered in `localStorage` as `fishFrenzy.graphics`) picks the preset: High = up to 2560×1440 with sun rays, vignette and plankton glow; Low = up to 1600×900 without them. Game logic (`game.js`) and drawing (`render.js`, `createRenderer`) are separate: every frame the game passes the renderer a `view` of its state (entity arrays, camera helpers)
- Demo mode (Demo button under the Graphics switch): an Easy run marked as cheated (no records) where `createDemoPilot` in `demo.js` steers the player. It reuses the bots' `avoidEdges` / `nearestJelly` helpers from `game.js` but, unlike them, re-evaluates every frame with no aim error, sticks to its current prey (`DEMO_TARGET_STICKY`), flees a weighted sum of the threats whose mouth is within `DEMO_FLEE_R`·r + `DEMO_FLEE_BASE` (`DEMO_TAIL_THREAT` for ones showing their tail; dash within `DEMO_FLEE_DASH` of that) while prey is seen `DEMO_VIEW_MUL` times further than bots and skipped near a predator; after `DEMO_MAX_LEAPS` leaps in `DEMO_LEAP_WINDOW` s or `DEMO_MAX_SKIM` s of skimming it dives (`DEMO_DIVE_*`); chases the best meal-size/distance prey with a lead of up to `DEMO_LEAD_MAX` s, seeks plankton up to `DEMO_FOOD_MAX_STAGE` (-1 = off, the default) and never leaps as a Fry. It dashes to flee, near prey, or while spending full stamina down to `DEMO_DASH_RESERVE`. Milestones show as banners; after a death it restarts in `DEMO_RESTART_DELAY` s; any key or tap returns to the menu
- Scenery (`scenery.js`, stateless): above the surface a sky with sun, drifting clouds, far hazy islands and nearer palm islands on parallax layers, and gulls; a swelling wavy surface with a bright waterline and translucent film drawn over the fish; water colored by true depth, sun rays on a slow parallax layer (hashed 170px cells: some empty for irregular gaps, each ray with its own width, slant, sway and a 4–12 s fade cycle, so rays slide past when swimming sideways and keep fading in/out; fade out with depth; each ray is one of four pre-rendered sprites, stretched and sheared into place with a single `drawImage`), parallax motes, two parallax layers of far ridges, sand with ripples, and seaweed / rocks / starfish / shells generated per 64-unit floor cell from a deterministic hash; a vignette on top (rendered once per screen size into a quarter-resolution canvas, depth only changes its opacity). Jellyfish come in several hues and glow more in dark water; boosting leaves a bubble trail
- Fish model: rounded body with a blunt snout; body and tail are one closed outline with an animated tail wag (faster while boosting), dorsal/ventral fins that ripple and a pectoral fin that flaps around its base (all driven by the same swim phase, slightly out of sync), gill line and a back-to-belly gradient; it's mirrored vertically when heading left so the belly stays down, and squashed near vertical headings for a rolling look
- Collisions use shapes that match the drawing: fish = 4 circles along the body axis (tail included), jellyfish = pulsing half-disk bell + 4 curved tentacles (each tested as two segments through the curve's midpoint), with the geometry cached once per frame and shared by collision and rendering; food, eating/being eaten and stings all test against these instead of a single center radius
- Reaching the final stage pauses the game and shows a Sea King dialog with the run's in-game time and the best time per difficulty (localStorage), with a "New record!" badge when beaten. Runs where the test cheat was used are marked and never saved. Options: Continue (default, grants a short invulnerability) or Play Again
- Test cheat: while playing, digit keys 1–9 set the player's radius (1–5 = one size inside each stage, 6–9 = progressively larger Sea King), 0 = max size
- The HUD shows the player's weight and length instead of r (length = `BASE_LENGTH_CM` 10 cm × (weight / 10 g)^⅓, 27 m at 200 t, shown in cm / m). Weight is a power law through both ends, weight = 10 g × (r / 15)^4.8: `BASE_WEIGHT_G` = 10 g at `BASE_R` = 15 (start size) up to `MAX_WEIGHT_G` = 200 t at `MAX_R`. Stage bounds come from plausible weights: Fry r ≤ 24 (~100 g), Small Fish ≤ 45 (~2 kg), Big Fish ≤ 89 (~50 kg), Shark ≤ 180 (~1.5 t), Sea King up to 500 (200 t), formatted as g / kg / t
- NPCs eat too, by the player's rules (mouth only, `EAT_MARGIN`): a bigger NPC eats a smaller NPC its mouth reaches (+0.55 of its area), and any NPC eats food whose glow its mouth touches (+food area). They never steer toward food. Growth is queued and applied over `GROW_TIME`, capped at `MAX_R`
- Splash sounds: the player's own splashes play at full volume; other fish's splashes fade with distance from the player (1 / (1 + (d / half-screen)²)) and scale with their size relative to the player ((r / player r)^0.5, clamped 0.3–1.6); splashes quieter than 0.03 are skipped
- Size cap `MAX_R = 500` for the player (growth is clamped) and for every spawned NPC. Reaching it pauses the game and shows the "Maximum size reached!" variant of the milestone dialog with its own per-difficulty best time (`fishFrenzy.bestMaxTime.<difficulty>`), a fanfare and a fireworks show (`fireworks.js`, separate canvas above the overlay, runs until the dialog closes). Continue keeps playing at the cap; Play Again restarts. In the last stage the HUD growth bar tracks progress toward the cap
- Sea King stage: jellyfish no longer sting the player; touching one with the mouth eats it (queued growth)
- Crowd control: NPC count scales down with player size (`npcCount`, down to 60% of `NPC_COUNT`) and their spawn/cull radius scales up (`npcSpawnRadius`, up to 1.5×); surplus bots are retired off-screen, farthest first

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
├── assets/                  # icon.svg (favicon + README logo), icon-512.png, social-preview.png (GitHub social preview, og:image)
├── 1 - flight simulator/
│   ├── index.html           # the game itself, fully self-contained
│   ├── README.md             # project documentation (English, player-facing)
│   ├── README_RU.md           # project documentation (Russian, player-facing)
│   ├── README_SV.md           # project documentation (Swedish, player-facing)
│   ├── icon.svg              # project icon (favicon, READMEs, gallery card)
│   └── screenshot.png        # preview image (English UI) used by the gallery and all READMEs
├── 2 - fish frenzy/
│   ├── index.html           # markup only, links versioned CSS/JS
│   ├── styles.css
│   ├── utils.js              # math helpers
│   ├── audio.js              # Web Audio sound effects
│   ├── input.js              # keyboard, touch joystick/boost zones, fullscreen
│   ├── scenery.js            # background: water, light rays, ridges, sand, seaweed, rocks
│   ├── fireworks.js          # fireworks show for the max-size dialog
│   ├── constants.js          # game tuning constants (sizes, speeds, counts, timings, hit shapes)
│   ├── render.js             # canvas setup and drawing of fish, jellyfish, gulls, food, effects, touch controls
│   ├── demo.js               # demo-mode pilot: steers the player with a bot-like brain (createDemoPilot)
│   ├── game.js               # world, difficulty, update loop; hands its state to render.js each frame
│   ├── README.md
│   ├── README_RU.md
│   ├── README_SV.md
│   ├── icon.svg
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
3. Add a `README.md` (English), a `README_RU.md` (Russian) and a `README_SV.md` (Swedish), each written for players and linking to the other two (same pattern as this repo's root READMEs).
4. Give the game three difficulty levels (Easy / Medium / Hard), selectable on the start screen and in the restart dialog.
5. Add a `screenshot.png` preview image showing the English UI.
6. Add a card for it to the root `index.html` gallery and a row to the tables in the root `README.md` / `README_RU.md` / `README_SV.md`.

## Backlog

- [ ] Add more mini-games/experiments to the gallery
- [ ] Add a search/filter control to the root gallery page once there are enough projects
- [ ] Add a light/dark toggle to the root gallery page (currently dark-only, matching the first project's cockpit theme)
