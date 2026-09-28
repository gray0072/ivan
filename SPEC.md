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

### flight-simulator

First-person arcade flight game.

- First-person cockpit view (pseudo-3D perspective projection onto a 2D canvas, no WebGL)
- Steering: arrow keys (left/right = yaw with eased turn rate and visual bank, up/down = climb/descend with visual pitch)
- Twin-gun shooting (Ctrl, held to fire continuously) with synthesized "pew" sound effects, used to shoot down floating balloons for points
- Fly to a highlighted target airport, descend, align with the runway heading, and land within the runway bounds for points; missing the runway at zero altitude crashes the game
- Instrument panel: airspeed gauge, artificial horizon (mirrors bank/pitch), altimeter
- Terrain color/texture varies by world region and blends smoothly while flying
- Cockpit framing (canopy pillars, windshield header) fixed on screen; clouds stay level and do not rotate with aircraft bank

### fish-frenzy

Top-down eat-and-grow arcade game ("Feeding Frenzy" style).

- Steering: arrow keys (left/right = turn, Ctrl or up = boost/dash that drains and regenerates a stamina meter)
- Touch: on coarse-pointer devices the start button requests fullscreen; a floating joystick in the left half of the screen sets the swim direction (the fish turns toward it), any touch held in the right half boosts; multi-touch so both work together
- Difficulty (picked on the start screen): Easy = food ×2, NPC speed ×0.9, boost capacity and regen ×1.5, NPC aim error ±20°, reaction 0.3 s; Medium = food ×1.5, NPC speed ×0.95, boost capacity and regen ×1.25, aim error ±10°, reaction 0.25 s; Hard = baseline, aim error ±5°, reaction 0.2 s. Share of an eaten fish's / gull's area the player grows by (`meal`): Easy 60%, Medium 50%, Hard 40% (bots: `NPC_MEAL` 55%). NPC dash stamina (`npcBoost`, a share of the player's boost capacity) and the delay after a dash until the whole tank comes back at once (`npcBoostRecharge`): Easy 1/8, 20 s; Medium 3/16, 15 s; Hard 1/4, 10 s
- Growth: eating plankton grows the player slightly; eating a smaller fish grows it more. There is no score; the HUD shows the player's weight and length, and the game-over text repeats them. Every meal plays a quick bite animation (`CHOMP_TIME`: a dark wedge opens in the snout and snaps shut), for the player and NPCs alike; from the Shark stage on (`NO_FOOD_CHOMP_STAGE`) plankton is swallowed without it. Each meal's area is queued and applied linearly over 3 seconds (`GROW_TIME`) instead of instantly
- Eating is mouth-only: a mouth circle in front of the gill line (`MOUTH_HIT`) must overlap any hit circle of the smaller fish (or the food). This applies both ways, so the player is safe right behind a bigger fish's tail until it turns around
- Eat/be-eaten rule: a fish can only eat another fish whose radius is smaller by at least 15% (`EAT_MARGIN`); near-equal sizes just bounce off each other with no effect
- Readability: every fish on screen is outlined green (safely eatable), red (dangerous to the player) or neutral white (similar size), computed live each frame. Danger radar (`drawDangerRadar` in `render.js`, `RADAR_*` constants), only while the screen is too small to react in time (`updateRadarNeed` in `game.js`): on when half the shorter screen side in world units, over the closing speed of the player cruising head-on into a predator chasing at full dash, is under `RADAR_REACTION` 0.5 s plus a quarter turn at the player's turn rate (off again only above ×`RADAR_HYSTERESIS` 1.15 of that) — a phone in landscape gets it at every stage, a 1920×1080 monitor never: every NPC that could eat the player whose body is off-screen but within `RADAR_RANGE` (1.2 screen half-diagonals) beyond the edge draws an additive red glow sprite stretched along the screen border where the line from the screen center to the fish crosses it, plus a chevron just inside pointing at it. Strength = fade-in (first 40 px off-screen) × closeness^1.4 × size factor (radius ratio from `EAT_MARGIN` up to `RADAR_FULL_RATIO` = 3) × 0.75 (1 when the fish is chasing and heading within ~37° of the player, which also doubles the chevron). The glow beats with a double-thump heartbeat whose rate goes from `RADAR_BEAT_MIN` to `RADAR_BEAT_MAX` with closeness (×1.3 when hunting); the phase is integrated per fish. Shown only while playing, on both graphics presets
- Menus: arrow keys move the focus between the visible panel's buttons (spatially, to the nearest button in that direction, preferring the same row / column; with nothing focused the default button counts as focused, so the first arrow already moves away from it), Space/Enter press the focused button, or the default one when nothing is focused
- Jellyfish avoidance (bots below `JELLY_EATER_STAGE` and the demo fish): a jellyfish counts as its bell plus a stalk `JELLY_TENTACLE_REACH` radii down through the tentacles; fish steer away within `JELLY_AVOID_DIST` (×`DEMO_VIEW_MUL` for the demo fish) plus their own turning radius (cruise speed / turn rate), so big, slow-turning fish start earlier; near the surface a jellyfish below is passed sideways, since the stay-under-the-surface rule would bend an upward escape back into it
- NPC AI: each fish flees the nearest bigger threat in range, otherwise chases the nearest smaller prey in range, otherwise wanders. Threats and prey are re-scanned only every `npcReaction` s (±20%, a human-like reaction delay; the fish acts on the last seen direction in between); flee / chase directions carry an aim error that drifts smoothly within ±`npcAimError` (new target every 0.8–1.6 s, eased), and turning is proportional to the heading error (`NPC_TURN_GAIN`), capped by the size's turn rate, so there's no jitter; NPC sizes are spawned relative to the player's current size so difficulty scales with growth: the size ratio is log-normal (σ = 0.25, with 20% of the mass moved from the ±1σ middle to the tails: 20% of samples are drawn only from |z| > 1) around a center that depends mostly on the player's depth (×0.8 near the floor … ×1.2 in the shallows), plus 10% small fry (×0.3–0.55), clamped to `MAX_R`. Giants are thinned out: a spawn bigger than `GIANT_R` = 180 is kept with probability (180 / r)² (52% at r = 250, 26% at 350, 13% at 500), otherwise it becomes a small fish (×0.3–0.55 the player), so a Sea King meets ~2–4 fellow kings around instead of 10–18; each NPC also gets a fixed ±3% speed variation. NPCs dash only while fleeing or chasing: a dash starts on a full tank and burns it all at the player's drain rate (or stops when the flee / chase ends), adding half the player's dash gain (`NPC_BOOST_ADD` = +0.35 × cruise) to the flee / chase speed; the tank then comes back full all at once `npcBoostRecharge` s after the dash ends, so dashes are rare, visible bursts
- Spawning never pops into view: fish and jellyfish are placed in an area-uniform ring around the player whose inner radius is "screen half-diagonal / zoom + the object's full extent" (fish extent = 1.9r, so even a huge tail stays off-screen); points outside the water column are mirrored vertically. Cull distances are likewise kept above the off-screen distance
- Infinite world sideways: no side boundary — entities are continuously spawned within a radius of the player and recycled once they drift far away, so exploration never hits a wall
- Vertical bounds: the sea floor (`FLOOR_Y`) and the water surface (`SURFACE_Y = FLOOR_Y - WATER_DEPTH`, `FLOOR_Y = 5000`, `WATER_DEPTH = 4600`). The depth is sized so a full-dash climb takes 13–18 s at every size (fry 150×1.7 u/s → 18 s; a max-size player at 213 u/s → 12.7 s) and the largest fish (r = 500, ~1050 tall, ~1400 long) still fits ~4.4 times. Speed: cruise = 150 × (r / 15)^0.1 u/s (fry ~3.6 body lengths/s, 29 m giant ~0.15) for the player and every fish up to the player's size; bigger fish are slower than the player by (player r / r)^0.25, so a predator never outswims you at cruise. Depth drives difficulty and atmosphere: near the floor the water is dark, food is dense, and fish skew smallest; toward the surface the water lightens and fish skew larger and more dangerous. A HUD "depth" bar shows the player's position in the column. Food, jellyfish and spawns stay inside the column (spawn points outside it are mirrored vertically)
- Leaps: when a fish's center crosses the surface going up it either skims (held at the surface) or launches, if its arc would lift it at least 0.3r. A dash (player boost, or NPC chase/flee/leap) guarantees an exit speed high enough to rise 1.3r on a steep exit; the launch angle is capped at ~69° so the fish arcs over instead of flipping. In the air only gravity acts (`450 × (r/14)^0.35`, so big fish don't hang for ages), the nose follows the velocity, and there's no steering. Exit and splashdown spawn a splash: ballistic droplets, a spray crown, foam on the waterline, entry bubbles and a soft sound (low-passed noise whoosh, a low cavity "plop" and a few bubble blips; no ringing). Wandering NPCs near the surface occasionally decide to leap (dash steeply up)
- Seagulls (easter egg): 6 gulls fly over the water at 50–450 above the surface (skewed low), flapping and gliding, recycled horizontally around the player. The lowest height is set so a fry's full-dash leap reaches it (center apex 238² / 900 = 63 plus mouth and hit radius). What a leaping fish (player or NPC) does to a gull depends on its stage (`GULL_PREY_STAGE`, `GULL_SCARE_STAGE`): a Fry whose body touches a gull is snatched — the gull flies off up and away with the fish dangling from its beak and a laughing squawk; for the player that's game over ("A seagull got you!"; not while invulnerable), and the gull keeps flying behind the game-over panel. A Small Fish that touches a gull knocks it: a few feathers, a thump and a "kek-kek!", and the gull flies off. Big Fish and bigger eat a gull their mouth reaches: growth, a burst of feathers that sway down and float on the water, a "Gull snack!" banner and a dead-gull sound (chomp, a "KYAAH!" squawk and a sagging strangled wail: vibrato sawtooth through a bandpass). Leaving gulls climb away and are removed above `BIRD_LEAVE_H`; NPC encounters play the same sounds scaled by distance and size, like splashes. Gull eating isn't spelled out in the player docs, only hinted at, but the fry danger is
- Jellyfish are a non-lethal hazard: touching one shrinks the player slightly and slows them briefly, rather than ending the game. Sizes vary: bell radius `JELLY_R_MIN`–`JELLY_R_MAX` × a scale 1…`JELLY_SCALE_MAX` (3) drawn as 1 + 2·u^`JELLY_SCALE_EXP`, so most are normal size and ~1 in 5 is over 2×; bigger ones drift (`JELLY_DRIFT`) and pulse (`JELLY_PULSE`) ÷ √scale, have tentacles × √scale thicker, and sting harder (area loss `JELLY_SHRINK` → `JELLY_SHRINK_BIG` linearly with scale); they bounce off the surface by the bell top (`JELLY_SURFACE_MARGIN`) and off the floor by the tentacle tips, and spawn/cull distances follow each one's size. A young Shark (r 151) is still ~2× the biggest (r 78), so the stage rule for eating them stays. NPC fish take the same sting (shrink + brief slowdown) and steer away from any jellyfish within a short edge-to-edge distance, with that avoidance overriding flee/chase
- A short spawn invulnerability window (with a visible glow) prevents unfair instant deaths right after (re)starting
- Five size-based stages (fry → fish → big fish → shark → Sea King) drive the player's color and a camera that gradually zooms out as the player grows (`zoomForR`: from `START_ZOOM` the zoom is divided by the same step `MAX_ZOOM_DIVISOR`^(1/4) per stage, spread geometrically over each stage's radius range, reaching `START_ZOOM / MAX_ZOOM_DIVISOR` at the Sea King and staying there, so the fish grows only ≈ 1.44× on screen per stage)
- Rendering is devicePixelRatio-aware (capped at 2.5) so it stays sharp on phones; on huge screens the canvas backing store is further capped at 2560×1440 pixels (`canvasScale` in `utils.js`) and the browser upscales it, and the game and fireworks loops are limited to 60 fps (`frameLimiter`) so 120/144 Hz monitors don't double the GPU load. A Graphics switch on the start screen (High / Low, `GRAPHICS` in `render.js`, remembered in `localStorage` as `fishFrenzy.graphics`) picks the preset: High = up to 2560×1440 with sun rays, vignette and plankton glow; Low = up to 1600×900 without them. Game logic (`game.js`) and drawing (`render.js`, `createRenderer`) are separate: every frame the game passes the renderer a `view` of its state (entity arrays, camera helpers)
- Demo mode (Demo button under the Graphics switch): an Easy run marked as cheated (no records) where `createDemoPilot` in `demo.js` steers the player. It reuses the bots' `avoidEdges` / `nearestJelly` helpers from `game.js` but, unlike them, re-evaluates every frame with no aim error, sticks to its current prey (`DEMO_TARGET_STICKY`), flees a weighted sum of the threats whose mouth is within `DEMO_FLEE_R`·r + `DEMO_FLEE_BASE` (`DEMO_TAIL_THREAT` for ones showing their tail; dash within `DEMO_FLEE_DASH` of that) while prey is seen `DEMO_VIEW_MUL` times further than bots and skipped near a predator, and picked by efficiency: meal area per estimated catch time (turning toward it plus the gap over our chase speed `DEMO_CHASE_SPEED` × cruise minus its getaway speed, its flee speed once it can notice us, + `DEMO_CATCH_OVERHEAD`), so a small fish nearby beats a near-equal one that would outswim us for ages; after `DEMO_MAX_LEAPS` leaps in `DEMO_LEAP_WINDOW` s or `DEMO_MAX_SKIM` s of skimming it dives (`DEMO_DIVE_*`); chases the best meal-size/distance prey with a lead of up to `DEMO_LEAD_MAX` s, seeks plankton up to `DEMO_FOOD_MAX_STAGE` (-1 = off, the default) and never leaps as a Fry. It dashes to flee, near prey, or while spending full stamina down to `DEMO_DASH_RESERVE`. Milestones show as banners; after a death it restarts in `DEMO_RESTART_DELAY` s; any key or tap returns to the menu
- Scenery (`scenery.js`, stateless): above the surface a sky with sun, drifting clouds, far hazy islands and nearer palm islands on parallax layers, and gulls; a swelling wavy surface with a bright waterline and translucent film drawn over the fish; water colored by true depth, sun rays on a slow parallax layer (hashed 170px cells: some empty for irregular gaps, each ray with its own width, slant, sway and a 4–12 s fade cycle, so rays slide past when swimming sideways and keep fading in/out; fade out with depth; each ray is one of four pre-rendered sprites, stretched and sheared into place with a single `drawImage`), parallax motes, two parallax layers of far ridges, sand with ripples, and seaweed / rocks / starfish / shells generated per 64-unit floor cell from a deterministic hash; a vignette on top (rendered once per screen size into a quarter-resolution canvas, depth only changes its opacity). Jellyfish come in several hues and glow more in dark water; boosting leaves a bubble trail
- Fish model: rounded body with a blunt snout; body and tail are one closed outline with an animated tail wag (`wagRate`: `WAG_RATE` for a fry at cruise, ×2 at the player's full dash, and slower for bigger fish, × (r / 15)^-0.4, the way real tail-beat frequency falls with length: ~3.6 s per stroke at the max size), dorsal/ventral fins that ripple and a pectoral fin that flaps around its base, rooted just inside the flank and the eyes sunk in with a third of them sticking out when the fish shows its back (big fish hold it steadier: the swing shrinks from 0.35 rad for a fry to ~0.14 at the max size) (all driven by the same swim phase, slightly out of sync), gill line and a back-to-belly gradient; it's mirrored vertically when heading left so the belly stays down, and squashed near vertical headings for a rolling look
- Collisions use shapes that match the drawing: fish = 4 circles along the body axis (tail included), jellyfish = pulsing half-disk bell + 4 curved tentacles (each tested as two segments through the curve's midpoint), with the geometry cached once per frame and shared by collision and rendering; food, eating/being eaten and stings all test against these instead of a single center radius
- FPS counter (frames drawn per second, over half-second windows) left of the pause button
- Pause: a round pause button under the bars in the top-right corner (hidden outside play and in the demo), or Esc / P, pauses the game and shows a Paused dialog: Continue (default; Esc / P also resume), Play Again, Change Difficulty (back to the start menu). Leaving the tab or switching apps pauses automatically; on phones the first tap after coming back restores fullscreen (browsers allow it only from a user gesture)
- Reaching the final stage pauses the game and shows a Sea King dialog with the run's in-game time and the best time per difficulty (localStorage), with a "New record!" badge when beaten. Runs where the test cheat was used are marked and never saved. Options: Continue (default, grants a short invulnerability), Play Again or Change Difficulty (back to the start menu)
- Test cheat: while playing, digit keys 1–9 set the player's radius (1–5 = one size inside each stage, 6–9 = progressively larger Sea King), 0 = max size
- The HUD shows the player's weight and length instead of r, formatted as g / kg / t and cm / m. Length is a power law through both ends, `MIN_LENGTH_CM` = 5 cm at `BASE_R` = 15 up to `MAX_LENGTH_CM` = 29 m at `MAX_R` = 500 (length ∝ r^1.81, `lengthCmForR`), and weight is strictly ∝ length³, pinned at `MAX_WEIGHT_G` = 200 t at 29 m (so the fry weighs ≈ 1 g, `weightForR`). Stage bounds are spaced geometrically (each ≈ 2.2× the previous): Fry r ≤ 32 (≤ 63 g, 20 cm), Small Fish ≤ 70 (≤ 4.5 kg, 82 cm), Big Fish ≤ 151 (≤ 295 kg, 3.3 m), Shark ≤ 327 (≤ 20 t, 13 m), Sea King up to 500 (200 t, 29 m)
- NPCs eat too, by the player's rules (mouth only, `EAT_MARGIN`): a bigger NPC eats a smaller NPC its mouth reaches (+0.55 of its area), and any NPC eats food whose glow its mouth touches (+food area). They never steer toward food. Growth is queued and applied over `GROW_TIME`, capped at `MAX_R`
- Splash sounds: the player's own splashes play at full volume; other fish's splashes fade with distance from the player (1 / (1 + (d / half-screen)²)) and scale with their size relative to the player ((r / player r)^0.5, clamped 0.3–1.6); splashes quieter than 0.03 are skipped
- Size cap `MAX_R = 500` for the player (growth is clamped) and for every spawned NPC. Reaching it pauses the game and shows the "Maximum size reached!" variant of the milestone dialog with its own per-difficulty best time (`fishFrenzy.bestMaxTime.<difficulty>`), a fanfare and a fireworks show (`fireworks.js`, separate canvas above the overlay, runs until the dialog closes). Continue keeps playing at the cap; Play Again restarts; Change Difficulty returns to the start menu. In the last stage the HUD growth bar tracks progress toward the cap
- Start-screen records: once any record is saved, a table (`renderRecords` in `game.js`) replaces the description (`#about`): per difficulty the biggest radius reached (`fishFrenzy.biggestR.<difficulty>`, shown as weight · length; saved on death, milestone dialogs, pause and right before a cheat, never for cheated/demo runs; older saves fall back to the size implied by a milestone time) and the Sea King / max-size best times. Under it, a Show description / Show records toggle and Clear records (needs a second press within 3 s) that removes all these keys
- Sea King stage: jellyfish no longer sting the player; touching one with the mouth eats it (queued growth)
- Spawn / cull distances follow the view (`spawnRadius` = `SPAWN_SCREENS` × the larger screen side / current zoom, `cullDist` = × `CULL_MUL` 1.3), for fish, jellyfish and plankton alike; the plankton count follows the spawn box clipped to the water column (`FOOD_DENSITY`, capped at `FOOD_MAX`) so its density doesn't depend on the zoom or the screen size. The fish count (`NPC_COUNT`), the jellyfish count (`JELLY_COUNT`) and the plankton cap are tuned for a phone in landscape (larger side `REF_SCREEN_SIDE` = 900 CSS px) and multiplied by the populated area of the actual screen relative to that one at the same zoom (clipped to the water column; ×1 … ×`SCREEN_MUL_MAX` 6), so a big monitor is as crowded as a phone
- Crowd control: NPC count scales down with player size (`npcCount`, down to 60% of `NPC_COUNT`); surplus bots are retired off-screen, farthest first

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
├── flight-simulator/
│   ├── index.html           # the game itself, fully self-contained
│   ├── README.md             # project documentation (English, player-facing)
│   ├── README_RU.md           # project documentation (Russian, player-facing)
│   ├── README_SV.md           # project documentation (Swedish, player-facing)
│   ├── icon.svg              # project icon (favicon, READMEs, gallery card)
│   └── screenshot.png        # preview image (English UI) used by the gallery and all READMEs
├── fish-frenzy/
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
└── ... (future project folders, same layout)
```

## GitHub Pages deployment

- Repo settings → Pages → **Deploy from a branch** → branch `main`, folder `/ (root)`.
- No build step: every file is served as-is. Pushing to `main` is the entire deploy process.
- All links between pages (root gallery → project folders, project → screenshot) use relative paths so the site works correctly under a subpath (`https://<user>.github.io/<repo>/`).
- Live URL: `https://gray0072.github.io/ivan/`

## Adding a new project

1. Create a new folder at the root named in lowercase kebab-case, e.g. `<name>/` (`flight-simulator`).
2. Put a self-contained `index.html` inside it (plus any assets it needs).
3. Add a `README.md` (English), a `README_RU.md` (Russian) and a `README_SV.md` (Swedish), each written for players and linking to the other two (same pattern as this repo's root READMEs).
4. Give the game three difficulty levels (Easy / Medium / Hard), selectable on the start screen and in the restart dialog.
5. Add a `screenshot.png` preview image showing the English UI.
6. Add a card for it to the root `index.html` gallery and a row to the tables in the root `README.md` / `README_RU.md` / `README_SV.md`.

## Backlog

- [ ] Add more mini-games/experiments to the gallery
- [ ] Add a search/filter control to the root gallery page once there are enough projects
- [ ] Add a light/dark toggle to the root gallery page (currently dark-only, matching the first project's cockpit theme)
