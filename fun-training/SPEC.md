# Fun Training — SPEC

Developer/agent spec for the `fun-training` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

## Idea

A training game for school kids. Something is happening on screen (a flower dries out, zombies walk toward a house, a train runs out of rails, a balloon sinks, a campfire burns down) and the player keeps it going by answering tasks in time. Every correct answer "feeds" the process (waters the flower, throws a stone at the zombie); a wrong answer just brings a new task while the process keeps running. The name is deliberately not tied to math: tasks come in **task types** (Math and Scales today), more will follow.

Targets: **TV / big screen** with a keyboard or a TV remote (arrows, Enter, digits, Back; reference: LG 55NANO766QA, webOS browser), desktop with a mouse, and **phones** by touch (reference: Poco X6 Pro, 444 × 987 CSS px, both orientations).

## Screens

1. **Players** — "Who's training today?": a card per saved player (avatar, name, coins, stars) and a **New player** card. Each player card has a small delete button that needs a second press within 3 s. The last used player is focused.
2. **New player** — name field (up to `NAME_MAX` chars) and an avatar grid (`AVATARS`), **Create** / **Cancel**. Enter in the name field creates.
3. **Home** (the player's account) — avatar, name, coins 🪙, **Settings** and **Players** buttons, a one-line summary of the current training settings, and one row per process with its progress track (see below). Every playable step of a track is a button: the next step, or any finished step to replay it. ‹ › at the track's ends page through earlier blocks of 10. The row's side shows the next step, the earned stars and "↻ N to improve". Rows of processes that aren't built yet (`ready: false`) are shown dimmed as "Coming soon".
4. **Settings** — per player: a tab per task type (🔢 Math, 📏 Scales; a ✓ on the tab = used in lessons) with that type's settings, then the global Answers and Tasks per lesson. Changes are saved immediately; **Done** returns home.
5. **Lesson** — the process scene (canvas, left) and the task panel (right): lesson info (process, step, "· Boss", task n / N, mistakes, 🪙 coins of the correct answers so far, the boss's hearts), the task card with its price in the corner (a math example, or a scale with a pointer and "▼ = ?"), and the answers.
6. **Pause** dialog (Esc / Back / the ⏸ button, or leaving the tab): Continue, Quit to home.
7. **Victory** dialog: process-specific title, coins earned ("45 for the answers × 67% for 2 mistakes", for a replay "· 45 − 30 from before" / "you got 45 here before"), total coins, the step's block on the track, a star message when a block of 10 is completed, a hint to replay when fewer than 3 coins per task were earned, confetti and a fanfare. **Next lesson** (default, the next unfinished step) / **Home**.
8. **Defeat** dialog: process-specific title ("The flower wilted…", "The zombies got in!"…), how many tasks were solved (or how many hits the boss still needed), a sad trombone. **Try again** (default, the same step) / **Home**.

Navigation: arrow keys move the focus spatially between the visible buttons (nearest in that direction, preferring the same row/column); Enter/Space press the focused button, or the screen's default button when nothing is focused. Every screen focuses its default button when shown (the lesson focuses the first answer in choice mode). Esc / Backspace-outside-inputs / TV Back (`keyCode` 461 webOS, 10009 Tizen) = back / pause.

## Progress, stars, bosses, coins

- Stored per player and per process: the number of completed steps (`progress[processId]`) and, per completed step, the best rate (`rates[processId][i]`, 0–3, by mistakes) and the most coins earned on it (`best[processId][i]`). Stars and the next step are derived.
- The track shows a block of `TRACK_LEN` = 10 steps (by default the current one): steps done with 0–1 mistakes (rate 3) are green ✓; steps done with 2+ mistakes show ↻ on amber (rate 2), orange (rate 1) or red (rate 0) — they can be replayed for the missing coins; the next step is yellow and pulsing; later steps are grey and disabled; a goal star in the block's tier colour ends the track (full colour once earned).
- Every 10 steps = a star. Tiers in order (`STAR_TIERS`): Bronze, Silver, Gold, Platinum, Diamond, Ruby, Emerald, Sapphire, then Rainbow for every further one. The list is expected to grow.
- A lesson = `lessonLength` tasks (10 / 15 / 20, a setting). Winning the next step adds it to `progress` with its rate.
- Coins are awarded only for a won lesson: the sum of the **prices** of its correct answers (see Task price; every boss hit counts as an answer), times a share by the lesson's mistakes (`COIN_RULES`, rate / 3): 0–1 mistakes → 100 %, 2–3 → 67 %, 4–5 → 33 %, 6+ → 0, rounded. A replay of a finished step pays only what beats the step's best (`best`), and keeps the better rate and best — so a step can be replayed for more coins with fewer mistakes *or* with harder settings. A replay that earns nothing new hints that harder settings or a faster speed pay more. Coins accumulate on the player and are shown on the Players and Home screens. A shop to spend them comes later.

### Task price

Every task type's settings give a **price**: whole coins for each correct answer, shown in the settings (a big "🪙 N per task" badge with the steps that make it up, and on each type's tab), on the home summary and in the corner of the task card. Harder settings always pay more per task, and a lesson's coins grow with the price, so the harder the settings, the more a lesson pays. The price tracks the expected effort: about 4 coins per 10 s of a task's expected time at Medium, for every type.

- Points are added up: the hardest choice of the type, plus a fixed amount for each further complication. Then multipliers apply. The result is rounded, at least 1.
- **Math**: the hardest enabled operation by its limit (`OP_PRICE`, each step up the limits adds at least 1: + 2…9, − 2…10, × 2…12, ÷ 2…13 for limits 10…10 000), + `PRICE_EXTRA_OP` = 1 for each other enabled operation, + `PRICE_MIX` = 2 when one task mixes operations; × `PRICE_OPERANDS` for numbers in a task (2 → ×1, 3 → ×1.75, 4 → ×2.5: 2 and 3 operators instead of 1).
- **Scales**: points by "numbers up to" (`SCALE_LIMIT_PRICE` 1–4) + the hardest parts choice (`SCALE_PARTS_PRICE`: 2 → 1, 4 or 5 → 2, 10 → 3) + `SCALE_SOME_PRICE` = 2 with every other number.
- Both: × `PRICE_TYPED` = 1.25 when answers are typed (no guessing among four), × the speed's `price` (Very slow ×0.5, Slow ×0.75, Medium ×1, Fast ×1.5, Very fast ×2) — less time and more risk pay more.
- Examples (pick 1–4, Medium unless said): + up to 20 → 3; + up to 100 or the times table (× up to 100) → 5; + − × up to 100, 3 numbers mixed, Fast → 24; Scales 4/5/10 parts up to 100 → 5; Scales up to 10 000, every other number → 9.
- In a lesson each task pays its own type's price, so mixed lessons add up both.

### Bosses

- Every `BOSS_EVERY` = 5th step is a **boss** step (💀 on the track, "Step 5 · Boss" in the lesson).
- A boss lesson has `lessonLength − 1` normal tasks; the last task is the boss: it needs `BOSS_HITS` = 3 correct answers. When it starts, the safety level is refilled once and a "👹 BOSS!" note shows; then it drains over `BOSS_TIME_MUL` = 2 × the current task's fail time and is **not** refilled by the boss hits — so the three answers must fit into twice the time of one task. Wrong answers bring a new task and the clock keeps running. The panel shows the boss's hearts.
- Each process has its own boss (see below); it walks / climbs / drifts toward the player by `f`, shows its hearts over its head, reacts to each hit, and is driven off by the third one.

## Task types

Each type is a module in `tasks/` with `make(cfg)`, `expectedTime(task, cfg)` (without the answer time) and `mistakes(task)` (weighted wrong answers), registered in `Tasks` (`tasks/tasks.js`), listed in `TASK_TYPES` and given a settings tab.

Settings are grouped by task type (`settings.math`, `settings.scale`) so each type has its own difficulty and speed. Each tab has a **Used in lessons** switch (`settings.types`, at least one stays on — switching off the last one shakes). With several types on, a lesson mixes them: the correct answers are split evenly between the types (the extra ones of an uneven split go to the first types; the boss's hits count as answers) in random order, and a wrong answer brings another task of the same type — so a lesson pays the same with the same settings every time it is played. Global per-player settings: answer mode and lesson length. Every task has a `solution` text shown under the card after a mistake.

### Math

- **Operations**: addition, subtraction, multiplication, division — any combination, at least one.
- **Numbers in a task**: 2, 3 or 4 operands.
- **Mix operations** (available only with more than one operation and 3–4 numbers, disabled otherwise, with a hint why): off — every task uses one operation (picked at random from the selected ones); on — each operator in a task is picked independently, so one task can combine them (needs 3–4 numbers; standard order of operations, × and ÷ before + and −).
- **Limit per operation** (`LIMITS`): up to 10, 20, 50, 100, 500, 1000, 5000, 10000.
  - Addition: every running sum ≤ limit.
  - Subtraction: every minuend ≤ limit, results never negative (and not 0 mid-way).
  - Multiplication: every product ≤ limit; factors ≥ 2.
  - Division: every dividend ≤ limit; always exact; divisors ≥ 2 (the quotient may be 1). Leading division chains are built backwards (quotient × divisors) so they look like the multiplication table.
  - Generation is constructive per step with retries; if a shape keeps failing (e.g. 4 numbers of ÷ up to 10) it falls back to fewer numbers.
- **Speed** (a 5-step slider-like switch with icons): Very slow 🐌, Slow 🐢, Medium 🐇, Fast 🐆, Very fast 🚀.
  - Each task has an *expected time*: `READ_TIME` (or `TYPE_TIME` + `TYPE_DIGIT_TIME` per answer digit when typing) + the sum of `OP_TIME[op][limit]` for its operators — e.g. 7 + 5 (up to 10, choice) ≈ 4 s, 47 + 36 (up to 100) ≈ 7.5 s, 345 + 278 (up to 1000) ≈ 12.5 s.
  - The time until the process fails = expected time × the speed's multiplier (Very slow ×3, Slow ×2.2, Medium ×1.6, Fast ×1.2, Very fast ×0.9), at least `MIN_TASK_TIME`. With Medium a child answering at the expected pace stays in the "safe" half.
  - The settings screen shows the resulting "≈ N s per task" and an example task for the current settings.

### Scales

Reading a ruler-like scale (grades 4–5): numbers stand under the big ticks, the parts between them are small ticks (a slightly longer one in the middle for 4 and 10 parts), a red pointer ▼ sits above one tick; the answer is the number it points at. Example: big ticks 10 and 20 with 4 small ticks between them (5 parts), the pointer on the second small tick → each part is 2, the answer is 14. Drawn as inline SVG (`tasks/scale.js`), faded ticks past the ends make it look like a piece of a longer ruler (none left of 0).

- **Parts between big ticks** (`SCALE_PARTS`): 2, 4, 5, 10 — any combination, at least one; each task picks one of them.
- **Numbers up to** (`SCALE_LIMITS`): 20, 100, 1 000, 10 000 — every number on the scale is ≤ the limit. The big-tick step is picked from `SCALE_MAJORS` (2, 4, 5, 10, 20, 25, 40, 50, 100 … 5000) so it splits evenly into the parts and is at least limit / 200 (no 1-steps up to 10 000); the scale starts at a random multiple of it.
- **Numbers on**: *Every big tick* (3 big intervals shown) or *Every other one* (4 big intervals, only every second big tick has a number — the child first works out the blank big ticks). If that doesn't fit the limit, 2 big intervals are shown.
- The pointer is never on a tick with a number (it can be on a blank big tick).
- **Speed**: the same 5 steps as Math, its own setting. Expected time = `READ_TIME` (or the typing time) + `SCALE_TIME[parts]` (3–5 s) + `SCALE_LIMIT_TIME` (0–4 s by the limit) + `SCALE_SOME_TIME` = 2.5 s with every other number; e.g. 5 parts up to 100, pick 1–4 ≈ 7 s × 1.6 ≈ 11 s at Medium.
- Wrong choices: ± one or two parts, small ticks counted as ones (when a part is < 10), ticks counted instead of parts, counted from the other number, the blank big ticks missed; never one of the numbers on the scale.
- After a mistake the two-line solution: `1 part = (20 − 10) ÷ 5 = 2` / `10 + 2 × 2 = 14` (the task panel keeps room for both lines when Scales are on, so the answers don't jump).

### Answer modes

Both modes work for every task type.

- **Pick 1–4**: four answer buttons in a 2×2 grid, pressed with keys 1–4, arrows + Enter, or a click. Wrong options are close and plausible; for scales see above. For math:
  - Close ones keep the units digit, so the last digit doesn't give the answer away: ±10, ±20, ±100, ±1000 (answers ≥ 10), plus ±1 rarely and the last two digits swapped. Answers below 10 get ±1–3.
  - Typical slips, weighted higher: + a forgotten carry (47 + 36 → 73); − the smaller digit taken from the bigger one (52 − 37 → 25) or a borrow that doesn't lower the next column (61 − 25 → 46); × by a one-digit number with the carry forgotten (14 × 8 → 82) and a neighbouring table result (answer ± a factor up to 20); ÷ the quotient ±1; with mixed operations, the task worked left to right without doing × and ÷ first (20 − 8 ÷ 4 → 3).
  - Options far from the answer (below half of it − 10 or above twice + 20) are dropped as unbelievable. About two thirds of the math wrong options share the answer's units digit.
- **Type**: digits typed on the keyboard / remote, Backspace deletes, Enter or Space submits. On touch screens (`pointer: coarse`) an on-screen number pad replaces the "press Enter" hint: 1–9, ⌫, 0, ✓ (a 3 × 4 grid in portrait, 6 × 2 in a low landscape panel).

### Future task types (ideas)

Clock reading, comparing numbers (<, =, >), number sequences, spelling / missing letter, multiplication-table drill, English words, scales with decimals (0.1, 0.5 — needs a decimal point key).

## Lesson flow

- The lesson owns a **safety level** `f` from 1 (safe) to 0 (fail). It drains at `1 / failTime(task)` per second; each process draws it its own way.
- Start: a short "Get ready" (`INTRO_TIME`) while the first task is already visible; then the process starts running.
- Correct answer: a chime, the card flashes green, `f` is restored to 1 (not during the boss round) and the process reacts (see below); the next task appears after `FEEDBACK_TIME`, during which the process is frozen.
- Wrong answer: a buzz, the card shakes red, the solved example (`47 + 36 = 83`) stays visible under the card for `WRONG_SHOW_TIME`, and a new task appears after `FEEDBACK_TIME` — the process keeps draining meanwhile.
- Below `WARN_LEVEL` a soft tick plays (faster when almost empty).
- `f` reaches 0 → the process plays its defeat animation (`END_ANIM_TIME`) → Defeat dialog.
- The last correct answer → victory animation → Victory dialog; the step and coins are saved.
- Leaving the tab pauses the lesson.
- Debug cheat (keyboard only, not documented for players): `]` answers the current task correctly and shows a banner; the lesson is then marked as cheated and a win doesn't add a step or coins.

## Processes

All five processes are built. Scenes are drawn on a canvas in a fixed design space (`fitScene`: scaled to fit, centred, anchored to the bottom, backgrounds full-bleed). Each scene module (`scenes/<process>.js`, a `create…Scene` factory registered in `SCENES` in `lesson.js`) exposes `correct`, `wrong`, `win`, `lose`, `bossStart`, `bossHit`, `update(dt, f)`, `draw`, and picks its colours by the step number.

1. **🌷 Grow a Flower** (built). A pot on a sunny windowsill and a glass water gauge with a ½ mark. The water level is `f` and goes down all the time. Below half the flower starts to wilt: the stem droops, leaves turn yellow then brown, petals fade and the flower's face frowns. A correct answer brings a watering can that pours (sound, droplets), the gauge refills to the top, the flower recovers smoothly and grows a little: over one lesson it goes from a sprout through a bud to full bloom. Each step has its own petal colour / shape. Defeat: the flower collapses and drops its petals. Victory: sparkles around the bloom. **Boss:** a caterpillar climbs the stem toward the flower (the gauge stays full); each hit sprays it with water, the third one turns it into a butterfly that flies away; if it reaches the flower it munches the petals.
2. **🧟 Zombie Defense** (built). Evening, a house on the left with the family in the window and a kid in the attic window. A zombie rises from the ground on the right and walks to the door; its position is `f`. Correct answer: the kid throws a stone — the hit zombie stops and stays until the stone lands — BONK — it falls over and fades, and only then (`ZOMBIE_NEXT_DELAY` after the hit) the next one rises on the right. Wrong answer: the stone falls short, the zombie keeps walking. Defeat: the zombie reaches the door and the lights go out. Victory: fireworks over the house. Zombies are cartoonish (random shirt colours, sizes, hats), not scary. **Boss:** a big zombie king with a crown; each stone makes it stagger, the third knocks it over.
3. **🚂 Railway Rush** (built). Side view, the camera follows a steam train (locomotive, tender, passenger car with faces) through parallax mountains, hills, trees and telegraph poles. The rails end `f × RAIL_AHEAD` in front of the locomotive; the train moves exactly as much as `f` drains, so the rail end stays put in the world. A correct answer lays rail pieces up to `RAIL_AHEAD` ahead: they drop in one by one with a clank. A wrong answer drops a piece that bounces off. A warning sign blinks at the rail end when it's close. Defeat: the locomotive tips over the rail end in a cloud of dust. Victory: the train speeds up and rolls into a station with bunting, whistle. **Boss:** a ravine with a river opens where the rails end; each hit drops one of three bridge sections in; the train crashes into the ravine if it gets there first.
4. **🎈 Balloon Flight** (built). A striped hot-air balloon with a pilot in goggles over the sea; its height is `f`. A correct answer fires the burner (flame, roar) and the balloon climbs back up; a wrong one gives a sad puff of smoke. A shark fin circles when the balloon is low. An island with a palm and a flag comes closer with each correct answer. Defeat: the basket splashes into the sea and the envelope deflates. **Boss:** an angry thundercloud with rain drifts toward the balloon (the sky darkens, thunder and flashes); each hit is a gust that shrinks it, the third blows it away and a rainbow appears; if it reaches the balloon, lightning knocks it into the sea.
5. **🔥 Campfire Night** (built). Night forest, a tent and a kid toasting a marshmallow by the fire. The fire's size and the lit circle are `f`; glowing wolf eyes sit at the edge of the light and creep closer as it dims (their silhouettes show when close). A correct answer throws a log in: the fire flares with sparks and a crackle, and the eyes back off. Wrong answer: a puff of smoke. Defeat: the fire goes out and the wolves howl. Victory: dawn — the sky brightens, the sun rises, the wolves leave, birds chirp. **Boss:** the pack leader walks into the light (the fire stays full); each hit is a burning stick that makes it yelp, the third sends it running.

## Phones and touch

- The split-screen joystick scheme from the repo conventions doesn't apply: every action is a button (answers, number pad, pause), and plain `<button>`s are tapped directly.
- Starting a lesson on a touch device requests fullscreen (`goFullscreen`, try/catch, works windowed on iPhone). The scene blocks page scroll / pinch zoom (`touch-action: none`, `preventDefault` on `touchstart` / `touchmove`).
- Portrait: the scene on top, the task panel below; narrow screens (≤ 620 px) wrap the home top bar, put each process's track on its own full-width line with shrinking cells, use a 2 × 2 grid of operations and a full-width speed switch in the settings. Low landscape screens (≤ 520 px high) get a compact task panel and dialogs that scroll if needed. Safe-area insets are respected; sticky hover zoom is off on touch screens.

## Graphics quality

`quality.js` picks the canvas resolution automatically (`QUALITY_LEVELS`: low / medium / high = max device-pixel ratio 1 / 1.5 / 2, backing store capped at 1280 × 720 / 1920 × 1080 / 2560 × 1440 pixels; low also drops the soft glow of the wolves' eyes and halves the confetti).

- Starting ceiling: TV browsers (user agent with webOS / Tizen / SmartTV…) and devices with ≤ 2 GB memory or ≤ 2 cores → low; touch devices → medium; others → high.
- During a lesson the frame rate is averaged over `QUALITY_WINDOW` = 2 s windows (the first 0.6 s after a start / resume and hitches over 0.25 s are skipped): below `QUALITY_LOW_FPS` = 45 → one level down; above `QUALITY_HIGH_FPS` = 57 for `QUALITY_UP_WINDOWS` = 4 windows in a row → one level up, but never above the ceiling nor back to a level that was too slow in this session. The canvas is resized at once.
- The level is remembered in `localStorage["funTraining.quality"]`, so the next visit starts at it.
- Older TV browsers lack `CanvasRenderingContext2D.roundRect` (Chromium < 99); `fx.js` polyfills it — without it every scene threw on its first frame and the lesson froze on the TV. The CSS avoids newer features there too (no `inset`; the focus ring falls back to always visible without `:focus-visible`).

## Sounds

Synthesized with Web Audio (`audio.js`), no files: UI click, correct chime, wrong buzz, warning tick, water pouring, whoosh, bonk, zombie groan, rail clank, train whistle, crash, burner roar, splash, thunder, fire crackle, wolf howl and yelp, birds, boss drums and growl, victory fanfare, coins jingle, star fanfare, defeat sad trombone.

## Storage

`localStorage["funTraining.v1"]` = `{ players: [{ id, name, avatar, coins, progress: { <processId>: steps }, rates: { <processId>: [best coins per task of each step] }, best: { <processId>: [most coins earned on each step] }, settings: { answerMode, lessonLength, types: ['math', 'scale'], math: { ops, operands, mix, limits: { add, sub, mul, div }, speed }, scale: { parts, limit, labels: 'all' | 'some', speed } } }], lastPlayerId }`. Loaded values are validated and merged with `DEFAULT_SETTINGS` (missing rates count as 3, a missing best as rate × lesson length; older saves get `types: ['math']` and the default scale settings); all access is wrapped in try/catch so the game still works without storage.

## Files

```
fun-training/
├── index.html       # markup of all screens
├── styles.css
├── constants.js     # task types, operations, limits, scale options, time tables, speeds, coin rules, star tiers, processes, avatars, timings
├── storage.js       # players and their settings/progress in localStorage
├── tasks/           # task types, one file each; tasks.js first, then the types
│   ├── tasks.js     # Tasks: picks the type, expected time, answer choices, shared helpers (fmt, rnd, pick)
│   ├── math.js      # Math: example generator, time per operator, plausible mistakes
│   └── scale.js     # Scales: generator, solution, plausible mistakes, SVG drawing
├── audio.js         # Web Audio sound effects
├── nav.js           # spatial keyboard / TV-remote focus navigation
├── quality.js       # automatic graphics quality (canvas resolution by device and frame rate)
├── fx.js            # shared drawing helpers (roundRect polyfill, fitScene, mixColor, starPath…) and the victory confetti
├── scenes/          # processes, one file each (state + canvas drawing)
│   ├── flower.js    # Grow a Flower
│   ├── zombies.js   # Zombie Defense
│   ├── railway.js   # Railway Rush
│   ├── balloon.js   # Balloon Flight
│   └── campfire.js  # Campfire Night
├── lesson.js        # lesson loop: tasks, safety level, answers, win/lose
├── app.js           # screens, settings UI, keyboard routing, main loop
├── README.md / README_RU.md   # short, link to the live page
├── icon.svg
├── icon-maskable.svg, icon-*.png, apple-touch-icon.png, manifest.webmanifest   # PWA (installable, Android icon)
└── screenshot.png
```

## Differences from the repo conventions

- No Easy / Medium / Hard: difficulty is the per-task-type settings (limits, number of operands, parts, labels, speed).
- No split-screen joystick on phones: the game is played with buttons only (see Phones and touch).
- README is minimal: title and link to the live page.

## Backlog

- [ ] Coin shop
- [x] Scales task type
- [ ] More task types
