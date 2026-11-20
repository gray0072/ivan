# Wiggle Wars — SPEC

Developer/agent spec for the `wiggle-wars` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

## Idea

A turn-based artillery game in the genre of Worms, Scorched Earth and Pocket Tanks, with original simple graphics: two teams of little worms on a destructible 2D landscape over the water take turns walking, jumping and firing a dozen weapons at each other, with wind, crates parachuted in, mines and oil barrels. Two people play it **one against one on one phone or tablet** (hot seat), or a player against the computer, or the **campaign**: twelve missions against the computer with three stars each. The number of worms in a team, their health, the weapons, the map and its theme, the turn time and the rest are picked before a match.

Taken from other games to make it better than the genre's classic:

- **Last shot trace** (Pocket Tanks): the path of the team's previous shot stays as a faint dotted line while it aims again, so correcting a shot is a skill, not a guess.
- **Aim guide** by difficulty (Angry Birds): on Easy the first part of the flight is drawn as dots, on Medium a short piece, on Hard none.
- **Three stars per mission** (Angry Birds) and missions with different goals: shooting targets, grabbing a golden crate, beating a team.
- **Moon map with low gravity** and a **rising-water** sudden death (Gunbound / Worms).
- **Power-up crates**: double damage and low gravity for a turn, besides health and weapons.
- **Slow motion on the winning kill**, a short vibration on big explosions on phones, CPU vs CPU matches running silently behind the menu.

## Screens

- **Start screen:** the language switcher (EN · RU · SV) at the top, the logo and a line on the game, **Versus** (default), **Campaign** (with the stars earned so far), the difficulty (Easy / Medium / Hard toggles with a line on what it changes), Sound On / Off, a **How to play** toggle. Behind it a CPU vs CPU match plays silently (the demo), a new one when it ends.
- **Versus setup:** the two teams side by side — the name (a text field), the colour (six swatches; the two teams can't share one) and **Human / CPU**; then the match settings, each a row of toggles: worms per team (1–6), health (50 / 100 / 150 / 200), turn time (30 / 45 / 60 / 90 s), the map (Hills / Islands / Cavern / Canyon / Random), the theme (Meadow / Desert / Snow / Moon / Random) with a preview of the map and **New map** (another random map of that kind), wind (Off / Normal / Strong), crates (Off / Some / Many), mines on the map (0 / 3 / 6), oil barrels (0 / 3 / 6), sudden death (Off / after 8 / 12 / 20 rounds), and the **weapons**: one toggle per weapon (its picture and name; All / None buttons; Skip turn is always there). **Start** and **Back**. Every choice is remembered.
- **Campaign:** the twelve missions as cards (number, name, stars for the current difficulty, 🔒 until the one before is won on any difficulty), the total of stars, Back. A card opens the **briefing**: the name, the story line, the goal, your team against theirs, the weapons, the best stars, **Start** / Back.
- **Game:** the world fills the screen. HUD at the top: the turn timer in the active team's colour with the worm's name under it (🤖 for a CPU worm), the wind gauge in the middle (a bar filled left or right, its strength in arrows), the mission's goal (campaign: "Targets 2 / 5 · Turn 3 / 8") and the pause button. The teams' health bars (name, total health, a bar per team) at the bottom in the middle (on a touch screen at the bottom left; on a phone held upright above the weapon button). The weapon button (picture, name, ammo) at the bottom right opens the **arsenal**; for grenades a fuse button (1–5 s) above it. A short banner in the upper middle shows messages ("Red Team — Bob", in hot seat "Red Team, your turn! — Bob", "Sudden death! The water rises after every turn.", "Bob: +30 health", "Red Team: +1 Cluster Bomb", "A crate is coming!", why a weapon can't be used there). Floating words over the world: the damage, "Drowned!", "Bye, Bob!", what a crate held.
- **Arsenal** (a panel over the game): a grid of the weapons — the picture, the name, the ammo (∞ or a number), greyed with "in N rounds" when it isn't available yet, hidden when the match has it off and the team has none from a crate. Tap / click picks one and closes it; **Skip turn** at the end. Opened by the weapon button, the right mouse button or `Q` / `W` / `Tab`.
- **Pause dialog:** Continue (default), Restart (the same match again on the same map), Main Menu, Sound On / Off. Hiding the page (another app, the screen off) pauses the match.
- **Results:** who won ("Red Team wins!", "Draw!", "Mission complete!", "Mission failed"), in the campaign the stars (with "New best!"), each team's damage dealt, kills and worms left, a note when cheats were used, the difficulty toggles (pre-selected), and **Next mission** (campaign, after a win) / **Play Again** (versus: the same settings on a new map) or **Retry** (campaign) / **Main Menu** (back to the campaign list after a mission). Fireworks when a human team wins.

## The world

- A `WORLD_W` × `WORLD_H` (2400 × 1200) world, the bottom under water at `WATER_Y` (`WORLD_H − 60`). The land is a bitmap of one byte per world pixel (`sim/terrain.js`: 1 = solid), drawn from a canvas of the same size (`render/terrainview.js`). Everything is drawn with Canvas 2D, all procedural (no image files).
- Explosions carve circles out of the bitmap; the canvas loses the same circle and gets a dark scorched rim. A plank adds a rotated rectangle of steel to both.
- **Maps** (`sim/mapgen.js`, from a seed, so the same seed gives the same map):
  - **Hills** — one long rolling landscape from edge to edge, falling into the water near both ends, with a few small caves and overhangs.
  - **Islands** — three to four islands of different heights with water between them.
  - **Cavern** — a big cave: a rock ceiling and a rock floor with tunnels, pillars and ledges, the sky only in a few holes.
  - **Canyon** — two high plateaus at the sides, a deep valley with ledges in the middle and a few floating rocks.
- **Themes** (`data/themes.js`): Meadow (grass, brown soil, blue sky, green hills behind), Desert (sand, red rock, an orange sky, dunes), Snow (snow on blue-grey rock, a pale sky, mountains), Moon (grey dust, a black sky with stars and the Earth, **gravity × `MOON_GRAVITY` 0.45**, wind at most a third).
- **Water**: a worm whose middle goes under the water drowns at once; anything else under the water sinks and is gone. Out of the sides of the world there is only water.
- **Camera** (`render/camera.js`): follows what matters — the active worm, a flying shot, a dying worm, a falling crate — and lerps to it; one-finger / mouse drag pans it (it then stays until something new needs following), pinch / the wheel zoom it (from the whole width of the world to `ZOOM_MAX` 2). It starts zoomed so the screen shows about `VIEW_W` × `VIEW_W` / 2 (1100 × 550) world px, whatever its shape. It may look up to 500 px above the world (in a cavern only 30 px).
- Decoration: parallax hills / dunes / mountains / stars behind, clouds drifting with the wind, animated waves, smoke, sparks and dirt from explosions, floating damage numbers.

## Worms

- Each worm has a name (from `data/names.js`, a team's names never repeat), a team colour, health (the match setting) shown with the name above it in the team's colour, and a facing. Its body is a capsule of radius `WORM_R` (8) over its feet.
- **Walking** (`WALK_SPEED` 45 px/s) follows the ground pixel by pixel, climbing steps up to `STEP_UP` (4 px) and walking down steps up to 4 px; a steeper wall stops it; walking off an edge falls.
- **Jump** forward (`JUMP_VX` 110, `JUMP_VY` 230 px/s) and **back flip** (`FLIP_VX` 55 backwards, `FLIP_VY` 330) — only from the ground.
- **Falling**: gravity `GRAVITY` 520 px/s²; hitting the ground faster than `FALL_SAFE` (380 px/s) hurts (`FALL_DMG` 0.12 per px/s over it); a worm thrown by an explosion bounces off walls (restitution 0.3) until it lands.
- **Damage** shows at once as a floating number, the health label counts down. A worm at 0 is not dead yet: when the turn is over every worm at 0 blows up in turn (a small explosion, radius 25, 10 damage, which may kill more) and leaves a gravestone. Drowning kills at once.
- Worms don't collide with each other: a worm walks through another one.
- **Where they start:** on free spots under the open sky (in a cavern under at least 70 px of room; with too few such spots, under 160 px of room, then anywhere), the teams in turn, as far apart as the map allows (at least `SPAWN_GAP` 70 px), facing the middle of the map. Map mines are at least 60 px from them, barrels 40 px; the campaign's targets stand under the open sky at least 260 px from the player's worm.

## Turns

1. **Turn start:** the next team in turn (teams alternate; inside a team its living worms take turns in order), its next worm. The camera goes to it, a bouncing arrow over it until it moves, the banner names it. Wind is rolled (`WIND_MAX` × the setting: Off 0, Normal 1, Strong 1.8, × −1 … 1). A crate may parachute in (Crates: Some 35 %, Many 70 % chance per turn).
2. **Playing:** the timer counts down from the turn time; the worm walks, jumps, aims, picks a weapon and uses it. The last 5 seconds tick. Time running out ends the turn (a shot being charged is lost).
3. **Retreat:** after a weapon that ends the turn the worm may still walk and jump for `RETREAT_TIME` (3 s; 5 s after a dropped weapon) but can't fire.
4. **Settling:** the turn waits until nothing moves: no shot in the air, no lit fuse, no worm flying or falling, no crate falling, no mine counting down (at most `SETTLE_MAX` 12 s).
5. **Turn end:** worms at 0 health blow up one by one (then settle again); a team with no worm left loses; both gone at once is a draw. Then sudden death if it is due and the next turn.

- **Sudden death** (after the set number of rounds — a round is every team having had a turn): the water rises `SD_RISE` (28 px) after every turn.
- In hot seat the banner says whose turn it is; there is no hidden information, the device is simply passed on. A CPU team moves by itself, the human's controls are hidden meanwhile.

## Weapons

Numbers live in `data/weapons.js`. "Charged": hold Fire to fill the power (0 → 1 in `CHARGE_TIME` 1.6 s; full fires by itself), let go to fire. Damage falls linearly from the full value at the blast's centre to 0 at its radius + the worm's radius; the push away from the centre grows with the damage (`KNOCK` 9 px/s per point, a lift upwards). Delay = rounds from the start of the match before it can be used.

| Weapon | Use | Ammo | Delay | Blast radius / damage | Notes |
|---|---|---|---|---|---|
| Bazooka | charged, in the wind | ∞ | — | 38 / 48 | Explodes on touching the land or a worm. |
| Homing Missile | pick a target, then charged | 1 | 2 | 38 / 48 | Flies normally for 0.5 s, then turns towards the target at 520 px/s for 3.5 s. No wind. |
| Grenade | charged, fuse 1–5 s | ∞ | — | 40 / 48 | Bounces (restitution 0.45); explodes when the fuse runs out. No wind. |
| Cluster Bomb | charged, fuse 1–5 s | 3 | 1 | 30 / 30 | Bounces like a grenade; on exploding throws 5 bomblets (20 / 18, explode on impact). |
| Shotgun | aim and fire | ∞ | — | 12 / 25 | Two shots a turn, instant, range 650 px; the first worm or land in the line is hit. |
| Bat | aim and swing | 2 | — | — / 30 | Hits every worm within 22 px in front and throws it along the aim at 620 px/s. |
| Dynamite | drop | 1 | 1 | 72 / 75 | Falls from the worm, fuse 5 s. 5 s to run. |
| Mine | drop | 2 | — | 42 / 45 | Armed after 2 s; a worm within 28 px starts a 1.5 s countdown. 5 s to run. |
| Air Strike | pick a target | 1 | 3 | 5 × 30 / 28 | Five bombs fall on the target in a row, from the side the worm faces; wind pushes them. |
| Drill | aim and fire | 2 | — | tunnel 11 | The worm drills along the aim for 2.8 s (or until Fire again), then falls. |
| Jetpack | fire to start | 2 | — | — | 4 s of fuel: up / Fire thrusts up, left / right sideways. Doesn't end the turn: land and use another weapon. |
| Teleport | pick a target | 2 | — | — | The worm appears at any free place out of the water. |
| Plank | pick a target, up / down turn it | 3 | — | — | A steel beam 110 × 10 within 220 px of the worm, at any angle, not on a worm. |
| Double Damage | from crates only | 0 | — | — | The rest of this turn every hit does double. Doesn't end the turn. |
| Low Gravity | from crates only | 0 | — | — | Gravity × 0.5 for the rest of this turn. Doesn't end the turn. |
| Skip Turn | — | ∞ | — | — | Ends the turn. |

- Aiming: up / down turn the aim between −85° and +85° from the facing (`AIM_SPEED` 70°/s, or the joystick's height); the crosshair sits 44 px from the worm. While charging, a growing wedge of yellow-to-red marks the power along the aim.
- A weapon switched off in the setup starts with no ammo; a crate never gives one.
- Shooting, throwing and swinging also emit an event the sounds and the camera follow.

## Objects

- **Crates** (`sim/objects.js`) fall from the top under a parachute (`CRATE_FALL` 70 px/s) to a random place on the land and stay; a worm touching one picks it up. **Health** (white, red cross; 35 %): +`HEALTH_CRATE` (30) health. **Weapon** (wooden; 45 %): one of a random enabled limited weapon (weighted by `crate` in `data/weapons.js`). **Tool** (blue, "?"; 20 %): a Jetpack, a Teleport, a Plank, a Drill, Double Damage or Low Gravity. An explosion destroys a crate in its radius (a puff).
- **Mines** on the map at the start (0 / 3 / 6, `MINE_*`), kept 60 px away from the worms; armed from the start; work like the weapon.
- **Oil barrels** (0 / 3 / 6): 30 health; damage from explosions takes it, at 0 they explode (48 / 40) — chains are possible.
- **Gravestones** where worms died; they fall when the land goes.
- **Targets** (campaign) on stakes: any blast reaching them or a shotgun hit breaks them.
- **The golden crate** (campaign): picking it up wins the mission.

## The computer (`sim/ai.js`)

A CPU worm waits `AI_THINK` (0.9 s); a crate lying within 80 px on its level it walks to first. Then it tries the weapons it has and understands — Bazooka, Grenade (fuse 3 s), Cluster Bomb, Shotgun, Bat, Air Strike, Homing Missile — simulating each flight with the game's own physics (`Weapons.predict`: wind, bounces, fuses) against the current land and worms. The flying shots are tried on a coarse grid first — both facings, aims −50° … 85° every `AI_ANGLE_STEP` (10°), powers in `AI_POWER_STEPS` (10) steps — then twice more, each time 4× finer, round the `AI_REFINE` (6) best tries (those that score, else those landing nearest an enemy). Each end is scored: damage to the other team (+30 for a kill, +25 when the hit worm is within 60 px of the water or the world's side; a barrel or mine set off adds 0.8 × its own blast's score) minus 1.5 × the damage to its own (itself included); weapons with little ammo count 8 % less. The trying is spread over the frames (7 ms a step), so the game never stalls. It then selects the weapon, turns, aims at `AI_AIM_SPEED` (90°/s) and charges visibly like a player and fires (a shotgun twice). When nothing scores `AI_MIN_SCORE` (8), it walks towards the nearest enemy for up to `AI_WALK_TIME` (2.5 s; it stops at a cliff, jumps at a wall) once and thinks again; with still nothing to hit it teleports 140–420 px from the nearest enemy, else drills towards it, else skips the turn. The difficulty spoils the aim: Easy picks at random among the five best tries that score at least 40 % of the best and misses by up to ±7° and ±10 % power, Medium ±2.5° / ±4 %, Hard ±0.6° / ±1 %.

## Campaign (`data/missions.js`)

Each mission has a fixed seed, so its map is the same every time. Stars are kept per difficulty (`wiggleWars.campaign.v1`); a mission opens when the one before is won on any difficulty. Goals:

- **Defeat the enemy:** ★ a win, ★★ the team keeps ≥ 30 % of its starting health, ★★★ ≥ 60 %.
- **Targets:** break every target within the turns given: ★★★ within `par` turns, ★★ within par + 2, ★ later. Out of turns = failed.
- **Golden crate:** pick it up within the turns given (the enemy defends it): ★★★ within `par`, ★★ within par + 2, ★ later.
- Losing every worm fails any mission.

| # | Name | Goal | Map | You | Enemy | New weapons |
|---|---|---|---|---|---|---|
| 1 | Boot Camp | 5 targets in 10 turns, par 5 | Hills, Meadow, no wind | 1 | — | Bazooka |
| 2 | First Contact | defeat | Hills, Meadow, calm | 2 × 100 | 2 × 60 | Grenade |
| 3 | Bouncing Practice | 5 targets in 10, par 6 | Canyon, Meadow | 1 | — | — (Bazooka, Grenade) |
| 4 | Sand Trap | defeat | Canyon, Desert, 4 barrels | 3 × 100 | 3 × 80 | Shotgun, Bat, Dynamite |
| 5 | Island Hopping | defeat | Islands, Meadow, crates | 3 × 100 | 3 × 100 | Teleport, Jetpack, Air Strike |
| 6 | Minefield | defeat | Hills, Desert, 8 mines | 3 × 100 | 4 × 80 | Mine, Cluster Bomb |
| 7 | Underground | defeat; the water rises from round 16 | Cavern, Snow, no wind | 3 × 100 | 3 × 100 | Drill, Plank |
| 8 | Supply Run | golden crate in 8 turns, par 3 | Canyon, Snow | 3 × 100 | 3 × 100 | — |
| 9 | Frozen Peaks | defeat | Canyon, Snow, strong wind | 4 × 100 | 4 × 100 | — |
| 10 | Moonwalk | defeat | Hills, Moon | 4 × 100 | 4 × 100 | Homing Missile |
| 11 | Rising Tide | defeat; the water rises from round 3 | Islands, Desert | 4 × 100 | 5 × 100 | — |
| 12 | Final Battle | defeat | Cavern, Meadow, many crates, barrels, mines | 4 × 100 | 6 × 120 | — |

The weapons of a mission are those opened so far (a mission's own list in `data/missions.js`). The player's team is "Heroes" in their last versus colour, the enemy "The Rotters" in grey-green (other names per mission).

## Difficulty

| | Easy | Medium | Hard |
|---|---|---|---|
| The CPU's aim | the five best, ±7°, ±10 % | ±2.5°, ±4 % | ±0.6°, ±1 % |
| Aim guide | the first 0.9 s of the flight | 0.3 s | none |
| Enemy health in the campaign | × 0.8 | × 1 | × 1.25 |

The difficulty is picked on the start screen and on the results screen (pre-selected), remembered as `wiggleWars.difficulty` (Easy on the first visit). It applies to every CPU team and to the aim guide of the human ones.

## Controls

- **Desktop:** ← / → walk (and turn), ↑ / ↓ aim (turn a plank; with Shift 0.3 × as fast, for a fine aim), **Space** — hold to charge and let go to fire (a press for the other weapons), **Enter** jump, **Backspace** back flip, `1`–`5` the fuse, `Q` / `W` / `Tab` / right click the arsenal, Esc pause (closes the arsenal first). The mouse: left click picks a weapon's target, a left drag pans, the wheel zooms; `C` brings the camera back to the worm. Keys go by their place (`KeyQ`…), so a Russian layout works too.
- **Touch** (split screen, `fish-frenzy`'s scheme): the **left half** is a floating joystick — sideways walks (and turns), up / down aims (and turns a plank; thrusts with the jetpack). In the **right half**: a big **Fire** button at the bottom right (hold to charge, let go to fire; it reads **Up** with the jetpack, where holding it thrusts, and **Stop** while drilling), **Jump** and **Back flip** above it, the weapon button left of Fire with the fuse above it, the pause button at the top. A tap elsewhere in the right half picks a weapon's target (so does a short touch in the left half that doesn't move the joystick); a one-finger drag there pans the camera, two fingers pinch-zoom (anywhere). The joystick only appears on a human team's turn; otherwise the left half pans too. Multi-touch: walking and firing work together. Start / Play Again / Next mission request fullscreen on coarse-pointer devices.
- Menus: arrow keys move the focus between the visible buttons, Space / Enter press the focused one (the default when nothing is focused), Esc goes back. Typing in a team's name is never taken as a key of the game.
- Mouse cursor: hidden in fullscreen while still (`core/cursor.js`). Updates: a new deploy reloads the page only on the start, setup and campaign screens (`core/update.js`). Offline: once opened online (or once the gallery has been opened), the game starts and plays without a network — `sw.js`, generated by `tools/sw-build.js`.

## Saved in the browser

- `wiggleWars.settings.v1` — the versus setup (teams, every setting, the weapons). `wiggleWars.campaign.v1` — the best stars per mission per difficulty. `wiggleWars.difficulty`, `wiggleWars.sound`, `wiggleWars.lang`. A match itself is not saved.

## Languages

English (default), Russian and Swedish, like `city-builder`: every text goes through `tr()` (`core/i18n.js`), the static texts of `index.html` carry `data-i18n` / `data-i18n-title`, the translations live in `data/lang-ru.js` / `data/lang-sv.js`. Texts passed to `tr()` through a variable: weapon names and descriptions (`data/weapons.js`), themes and map kinds (`data/themes.js`), mission names, stories and team names (`data/missions.js`), the setting names (`ui/setup.js`), the difficulty texts (`ui/screens.js`). Worm names are names, the same in every language.

## Sound

Synthesized with Web Audio (`core/audio.js`, played only by `ui/sounds.js`): explosions by size, the launch whoosh, a grenade's clink, the fuse tick, the shotgun, the bat's whack, jump and back flip, landing hard, splash and bubbles, a crate's parachute and pickup, the mine's beep, teleport, jetpack and drill noise while they run, the turn chime, the last seconds' ticks, a worm's "oof" when hit, victory / defeat fanfares, fireworks. The demo behind the menu is silent. Sound On / Off on the start screen and in the pause dialog (`wiggleWars.sound`), through one master gain. Explosions of 40 px and more vibrate the phone briefly (`navigator.vibrate`), only with the sound on.

## Cheats (keyboard only, Shift + digit, for testing)

Each shows a banner and marks the match as cheated (no stars saved):

- `Shift+1` — every enemy worm dies (win), `Shift+2` — every worm of the active team dies (lose)
- `Shift+3` — the active team gets every weapon with ∞ ammo, no delays
- `Shift+4` — the active team's worms back to full health
- `Shift+5` — a crate falls right above the active worm
- `Shift+6` — the wind turns to 0
- `Shift+7` — sudden death now
- `Shift+8` — every enemy worm at 1 health
- `Shift+9` — every campaign mission opens (saved)
- `Shift+0` — the turn timer stops for this turn

## Testing recipes

- Headless logic: load `constants.js`, `data/*.js` (but `icons.js`), `core/utils.js`, `core/events.js` and every `sim/` file into a `vm` context, then `newMatch(settings)` (or `newMission(i, difficulty)`) with every team set to CPU and call `simStep(SIM_DT)` in a loop: a whole CPU-vs-CPU match takes a few seconds; `match.over` is set at the end.
- In the browser (`tools/cdp.js`): `localStorage.clear(); I18N.set('en')`, `startVersus()` / `startMission(0)` start a match; `match`, `activeWorm()` and `Control.*` drive it; `Camera.focusOn(x, y)` moves the view.

## Files

```
wiggle-wars/
├── SPEC.md
├── index.html          markup only, versioned <link>/<script> tags
├── styles.css
├── constants.js        tuning: world, physics, worms, turns, crates, objects, AI, camera, difficulty table
├── game.js             main loop and the flow (menu with the demo, setup, campaign, match, pause, results, cheats),
│                       keys and touch turned into the worm's controls
├── data/
│   ├── weapons.js      the weapons: kind, ammo, delay, blast, damage, crate weight, texts
│   ├── themes.js       the themes (colours, gravity, wind) and the map kinds
│   ├── missions.js     the campaign's missions
│   ├── names.js        worm names, default team names and colours
│   └── lang-ru.js, lang-sv.js   translations
├── core/
│   ├── i18n.js         tr(), the language switcher
│   ├── utils.js        math, seeded random, canvas scale, frame limiter
│   ├── events.js       the event bus from the logic to sounds, the camera and banners
│   ├── audio.js        Web Audio engine and the sound recipes (Sfx), loops (jetpack, drill)
│   ├── input.js        keys held, mouse, touch: joystick, buttons, target taps, pan and pinch; fullscreen
│   ├── storage.js      settings, campaign stars, difficulty
│   ├── cursor.js       hides the mouse cursor in fullscreen while it is still
│   ├── icons.js        arrows, symbols and emoji drawn the same on every device (tools/icons-build.js)
│   └── update.js       picks up a new deploy, reloading only on the menus; registers sw.js
├── sim/                no drawing, no DOM, no sound
│   ├── state.js        shared state: the match, teams, worms, objects, shots; helpers
│   ├── terrain.js      the land bitmap: solid(), carve, add a plank, normals, surface spots
│   ├── mapgen.js       the four map kinds from a seed; placing worms, mines, barrels, targets
│   ├── physics.js      bodies: walking, jumping, falling, bouncing, fall damage, water
│   ├── weapons.js      using a weapon, shots in flight, explosions, damage and push
│   ├── objects.js      crates, mines, barrels, targets, gravestones
│   ├── turn.js         the turn's phases, timer, wind, sudden death, deaths, win and stars; Control (the worm's actions)
│   ├── match.js        a new versus match or campaign mission from the settings
│   └── ai.js           the computer player
├── art/
│   ├── weapons.js      the weapons' pictures (arsenal, buttons, in the worm's hands)
│   └── flag-gb.svg, flag-ru.svg, flag-se.svg   the language switcher's flags
├── render/
│   ├── camera.js       follow, pan, zoom, world ↔ screen
│   ├── terrainview.js  the land canvas: texture, craters with scorched rims, planks
│   ├── backdrop.js     sky, parallax, clouds, water
│   └── render.js       worms, objects, shots, effects, aim, guide, trace, joystick
├── ui/
│   ├── screens.js      start menu, campaign list, briefing, pause, results; menu keys
│   ├── setup.js        the versus setup and the map preview
│   ├── hud.js          timer, wind, goal, team bars, banner, the weapon / fuse / touch buttons
│   ├── arsenal.js      the weapon panel
│   ├── sounds.js       game events → sounds and vibration
│   └── fireworks.js    the fireworks on a human win
├── README.md / README_RU.md / README_SV.md
├── icon.svg / icon-maskable.svg
├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
├── manifest.webmanifest
├── sw.js               offline service worker (generated by tools/sw-build.js)
└── screenshot.png
```
