# Fun Training — SPEC

Developer/agent spec for the `fun-training` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

## Idea

A training game for school kids. Something is happening on screen (a flower dries out, zombies walk toward a house, a train runs out of rails, a balloon sinks, a campfire burns down, a panda gets hungry) and the player keeps it going by answering tasks in time. Every correct answer "feeds" the process (waters the flower, throws a stone at the zombie); a wrong answer just brings a new task while the process keeps running. The name is deliberately not tied to math: tasks come in **task types** (Math, Scales and Reading today), more will follow.

The coins and diamonds won in lessons are spent on the player's own **character** — a cute animal that starts out poor and hungry in a bare room: feed it, dress it up and furnish its room (see Characters, room and shop). That's what makes it worth earning more.

Targets: **TV / big screen** with a keyboard or a TV remote (arrows, Enter, digits, Back; reference: LG 55NANO766QA, webOS browser), desktop with a mouse, and **phones** by touch (reference: Poco X6 Pro, 444 × 987 CSS px, both orientations).

## Screens

1. **Players** — "Who's training today?": a card per saved player (their character as it looks now — outfit, mood, a pulsing 🍽 when hungry; name, coins, stars) and a **New player** card. Each player card has a small delete button that needs a second press within 3 s. The last used player is focused.
2. **New player** — name field (up to `NAME_MAX` chars) and the 10 characters to pick from (`CHARACTERS`, drawn; a random one is preselected and waves, "Kitty loves fish and milk."), **Create** / **Cancel**. Enter in the name field creates.
3. **Home** (the player's account) — the character's head and the name as a button to the room ("🏠 My room", or "🏠 Kitty is hungry!" in yellow with a 🍽 badge), coins 🪙 and diamonds 💎, **🛍️ Shop** (also opens the room), **Settings** and **Players** buttons, a one-line summary of the current training settings, and one row per process with its progress track (see below). Every playable step of a track is a button: the next step, or any finished step to replay it. ‹ › at the track's ends page through earlier levels. The row's side shows the current level (its star, dim until earned), the next step — or, when the level is finished but not perfect, "🔒 ↻ N steps to open <next level>" — the earned stars and "↻ N to improve". Rows of processes that aren't built yet (`ready: false`) are shown dimmed as "Coming soon".
4. **Settings** — per player: a tab per task type (🔢 Math, 📏 Scales, 📖 Reading; a ✓ on the tab = used in lessons, 🔇 = can't run on this device) with that type's settings, then the global Answers and Tasks per lesson. Changes are saved immediately; **Done** returns home.
5. **Lesson** — the process scene (canvas, left) and the task panel (right): lesson info (process, step, "· Boss", task n / N, mistakes, 🪙 coins of the correct answers so far / the lesson's price, the boss's hearts), the task card with its price in the corner (a math example, a scale with a pointer and "▼ = ?", or a big 🔊 button and "Which one did you hear?"), and the answers.
6. **Pause** dialog (Esc / Back / the ⏸ button, or leaving the tab): the **Coin Muncher** (see Pause costs coins), **🐢 Too fast?** / **🚀 Can go faster?** for the current task type, Continue, Quit to home.
7. **Victory** dialog: process-specific title, coins earned ("45 for the answers × 67% for 2 mistakes", less what the Coin Muncher ate in pauses, for a replay "· 45 − 30 from before" / "you got 45 here before"), total coins, on a boss step the diamonds ("+4 💎", "Big boss: 4 of 6 💎"), the step's level on the track, a hint to replay when fewer than 3 coins per task were earned (or which ↻ steps still shut the next level), the slower offer after 2+ mistakes (see Slower offer), confetti and a fanfare. When the lesson completes a level: the level-up block (see Levels and stars) with fireworks. **Next lesson** (default: the next new step, or "Replay step N ↻" — the first ↻ step of a shut level) / **Home**.
   A won lesson that makes something new affordable adds "🛍️ Now you can buy: Top hat (🪙 400)" (the priciest such item).
8. **Defeat** dialog: process-specific title ("The flower wilted…", "The zombies got in!"…), how many tasks were solved (or how many hits the boss still needed), a sad trombone. **Try again** (the same step) / **🐢 Try slower** (default, see Slower offer) / **Home**.

9. **Room** — the character's room (left; on top in portrait) and the shop panel (right; below): see Characters, room and shop. **‹ Home** / Esc / Back returns home.

Navigation: arrow keys move the focus spatially between the visible buttons (nearest in that direction, preferring the same row/column); Enter/Space press the focused button, or the screen's default button when nothing is focused. Every screen focuses its default button when shown (the lesson focuses the first answer in choice mode). Esc / Backspace-outside-inputs / TV Back (`keyCode` 461 webOS, 10009 Tizen) = back / pause.

## Progress, levels, stars, bosses, coins, diamonds

- Stored per player and per process: the number of completed steps (`progress[processId]`) and, per completed step, the best rate (`rates[processId][i]`, 0–3, by mistakes), the most coins earned on it (`best[processId][i]`) and the most diamonds (`bestGems[processId][i]`). Levels, stars and the next step are derived (`progress.js`).
- The track shows one level of `TRACK_LEN` = 10 steps (by default the current one): steps done with 0–1 mistakes (rate 3) are green ✓; steps done with 2+ mistakes show ↻ on amber (rate 2), orange (rate 1) or red (rate 0) — they can be replayed for the missing coins; the next step is yellow and pulsing; later steps are grey and disabled; the level's goal star ends the track (dim until earned). Step 5 shows 🐲 (boss), step 10 👑 (big boss).
- A lesson = `lessonLength` tasks (10 / 15 / 20, a setting). Winning the next step adds it to `progress` with its rate.
- Coins are awarded only for a won lesson: the sum of the **prices** of its correct answers (see Task price; every boss hit counts as an answer), times a share by the lesson's mistakes (`COIN_RULES`, rate / 3): 0–1 mistakes → 100 %, 2–3 → 67 %, 4–5 → 33 %, 6+ → 0, rounded. A replay of a finished step pays only what beats the step's best (`best`), and keeps the better rate and best — so a step can be replayed for more coins with fewer mistakes *or* with harder settings. A replay that earns nothing new hints that harder settings or a faster speed pay more. Coins accumulate on the player and are shown on the Players and Home screens; they are spent in the shop (see Characters, room and shop).

### Levels and stars

- Each process has its own road of levels, 10 steps each. A level is **complete** when all 10 steps (both bosses included) are done with 0–1 mistakes (all ✓). That earns the level's star and opens the next level: its 10 steps become playable.
- Finishing step 10 with ↻ steps left keeps the next level shut: the home row says "🔒 ↻ N steps to open Stone", the ↻ step is the default button and **Next lesson** becomes "Replay step N ↻". The star comes the moment the last ↻ step is replayed perfectly — on any step, not only the boss. Steps already played in a later level (older saves) stay open.
- Levels (`STAR_TIERS`), from wood to diamond: **Wooden, Stone, Bronze, Iron, Silver, Gold, Platinum, Emerald, Ruby, Diamond**; every level after Diamond is Diamond again. Each star is an SVG in its material (`stars.js`): a gradient of the material's light / base / dark colours with a dark outline, plus wood grain (Wooden), speckles (Stone), a shine (metals), cut facets (Emerald, Ruby, Diamond) and a twinkling sparkle (Diamond).
- Where they show: the goal star at the end of every track; the level name with its star on the home row; the earned stars under it; the player card shows the best star and the star count; the level-up block.
- **Level-up**: the result dialog adds the new star spinning in ("You earned the Wooden star! The Stone level is open — 10 new steps.") and the ladder of all 10 levels — earned ones bright, the next one pulsing with its name, the rest grey (on phones only the next one is named). Confetti plus `FIREWORKS_TIME` = 4 s of fireworks (bursts of sparks with a pop and crackle) and the star fanfare. Home then shows the new level.

### Task price

Every task type's settings give a **price**: whole coins for each correct answer, shown in the settings (a big "🪙 N per task" badge with the steps that make it up, and on each type's tab), on the home summary and in the corner of the task card. Harder settings always pay more per task, and a lesson's coins grow with the price, so the harder the settings, the more a lesson pays. The price tracks the expected effort: about 4 coins per 10 s of a task's expected time at Medium, for every type.

- Points are added up: the hardest choice of the type, plus a fixed amount for each further complication. Then multipliers apply. The result is rounded, at least 1.
- **Math**: the hardest enabled operation by its limit (`OP_PRICE`, each step up the limits adds at least 1: + 2…9, − 2…10, × 2…12, ÷ 2…13 for limits 10…10 000), + `PRICE_EXTRA_OP` = 1 for each other enabled operation, + `PRICE_MIX` = 2 when one task mixes operations; × `PRICE_OPERANDS` for numbers in a task (2 → ×1, 3 → ×1.75, 4 → ×2.5: 2 and 3 operators instead of 1).
- **Scales**: points by "numbers up to" (`SCALE_LIMIT_PRICE` 1–4) + the hardest parts choice (`SCALE_PARTS_PRICE`: 2 → 1, 4 or 5 → 2, 10 → 3) + `SCALE_SOME_PRICE` = 2 with every other number.
- **Reading**: points by letters / word length (`READ_SIZE_PRICE`: letters, up to 3 or 4 → 2; 5–7 → 3; 8–10 → 4) × words in a task (`READ_WORDS_PRICE`: 1 → ×1, 2 → ×1.5, 3 → ×2). The language doesn't change it.
- All: × `PRICE_TYPED` = 1.25 when answers are typed (no guessing among four; not for Reading, which is always picked), × the speed's `price` (Very slow ×0.5, Slow ×0.75, Medium ×1, Fast ×1.5, Very fast ×2) — less time and more risk pay more.
- Examples (pick 1–4, Medium unless said): + up to 20 → 3; + up to 100 or the times table (× up to 100) → 5; + − × up to 100, 3 numbers mixed, Fast → 24; Scales 4/5/10 parts up to 100 → 5; Scales up to 10 000, every other number → 9; Reading letters → 2; Reading 3 words up to 10 letters → 8.
- In a lesson each task pays its own type's price, so mixed lessons add up both.
- **Lesson price** = the coins of all its correct answers with no mistakes (`Tasks.lessonCoins`): the answers split evenly between the types, each paid its price, so it grows with the tasks per lesson — 10 tasks of 🪙 3 = 🪙 30, 20 tasks = 🪙 60; a boss step has `lessonLength − 1 + BOSS_HITS` answers. Shown on the home summary ("20 tasks = 🪙 100 per lesson"), under Tasks per lesson in the settings ("Up to 🪙 100 per lesson, 🪙 110 with a boss") and in the lesson info as "🪙 earned / price", computed fresh from the current settings at each lesson's start.

### Bosses

- Every `BOSS_EVERY` = 5th step is a boss step; its kind by its place in the level (`BOSS_KINDS`): step 5 → **Boss** (🐲), step 10 → **Big boss** (👑). The lesson shows "Step 10 · Big boss" and "Get ready! Big boss at the end 👑 / Beat it for up to 6 💎" — the lesson's boss texts and hearts use the kind's icon.
- A boss lesson has `lessonLength − 1` normal tasks; the last task is the boss: it needs `BOSS_HITS` = 3 correct answers. When it starts, the safety level is refilled once and a note shows ("🐲 BOSS!" / "👑 BIG BOSS! … twice as fast!"); then it drains over `timeMul` × the current task's fail time and is **not** refilled by the boss hits. Boss: `timeMul` = 2 (three answers in twice the time of one task, as before). Big boss: `timeMul` = 1 — twice as fast, three answers in the time of one task. Wrong answers bring a new task and the clock keeps running. The panel shows the boss's hearts and "up to N 💎".
- **Diamonds 💎** — the premium for bosses, a separate currency for the shop: up to `gems` = 3 for the Boss and 6 for the Big boss, by the lesson's mistakes like coins (0–1 → all, 2–3 → 2/3, 4–5 → 1/3, 6+ → 0: Boss 3/2/1/0, Big boss 6/4/2/0). A replay pays only what beats the step's best diamonds. Shown on the Players and Home screens and in the result dialog with a sparkle sound.
- Each process has its own boss (see below); it walks / climbs / drifts toward the player by `f`, shows its hearts over its head, reacts to each hit, and is driven off by the third one. The big boss uses the same figure for now.

## Task types

Each type is a module in `tasks/` with `make(cfg)`, `expectedTime(task, cfg)` (without the answer time), `price(cfg)` and either `mistakes(task)` (weighted wrong numbers; the options are built in `tasks.js`) or `choices(task)` (its own four options, e.g. words), registered in `Tasks` (`tasks/tasks.js`), listed in `TASK_TYPES` and given a settings tab. Optional: `choiceOnly` (always picked among four, never typed) and `blocked(cfg)` (why it can't run on this device, or null — Reading without a voice).

Settings are grouped by task type (`settings.math`, `settings.scale`, `settings.read`) so each type has its own difficulty and speed. Each tab has a **Used in lessons** switch (`settings.types`, at least one stays on — switching off the last one shakes). With several types on, a lesson mixes them: the correct answers are split evenly between the types (the extra ones of an uneven split go to the first types; the boss's hits count as answers) in random order, and a wrong answer brings another task of the same type — so a lesson pays the same with the same settings every time it is played. Global per-player settings: answer mode and lesson length. Every task has a `solution` text shown under the card after a mistake.

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

### Reading

Listening and reading: a voice says a letter, a word or a short phrase, and the child picks what it said among four written options. The voice is the device's own speech synthesis (Web Speech API, `speech.js`), no sound files: per language the best voice is used (natural / neural ones first, then Google's, then the offline ones); a voice that fails (an online one while offline) is skipped for the rest of the session. Speech rate `READ_VOICE_RATE` = 0.85, a bit slower for kids.

- **Language** (`READ_LANGS`): Swedish, English, Russian. A new player gets the browser's language when it is one of them. The data per language is in `tasks/words.js`: the alphabet, everyday words a school kid knows (about 300–600 per language, 2–10 letters, grouped by length on load) and short meaningful phrases of 2 and 3 words ("go home", "lila blommor", "кошка на дереве", "the cat sleeps", "vi går hem").
- **Letters, or words up to N letters** (`READ_SIZES`): Letters, 3, 4 … 10. A letter is shown as "B b"; the voice says the letter itself, in Russian its name ("бэ", "эль", "и краткое" — a lone в / к / с would be read as a preposition). A word "up to N letters" is N − `READ_SPAN` … N letters long (at least 2).
- **Words in a task**: 1, 2 or 3 (off with letters, which come one at a time). 2 and 3 words = a phrase from the list whose longest word fits N, those with the longest word near N first (if fewer than `READ_MIN_PICK` = 6 of them, any that fit; if none fit, the shortest ones).
- The task card shows a big 🔊 button and "Which one did you hear?" instead of the text. The voice speaks when the task appears; the button, **0** or **R** say it again; pausing stops the voice, continuing says it again.
- Always picked among four, also when answers are typed: a lesson mixing Reading with typed tasks switches per task between the four buttons and typing / the number pad. Keys 1–4 pick.
- Wrong options are close, all different, never the answer, and spread over different kinds:
  - letters: ones that sound alike (English B C D E G P T V Z; Swedish be, ce, de…; Russian Б / П, Ж / Ш / Щ, И / Й / Ы) or look alike (b d p q, m n w, И Н П, Ш Щ), rarely any other letter;
  - words: only real words — it's reading, not a spelling test, so no made-up misspellings. From the word list and the words of the phrases (with their inflected forms: дереве, tänderna), the `READ_NEAR_WORDS` = 8 spelled most like the answer (fewest letters apart, then the same first letter and a close length; the nearest weigh most): cat → hat, cut, car; кошка → мошка, ложка, кошки;
  - phrases: one word changed to such a real word (longer words more often, a different word in each option), or the first and last words swapped ("пёс и кот").
- An answer doesn't come back within `READ_RECENT` = 40 reading tasks (at most half of the possible ones).
- **Speed**: the same 5 steps, its own setting. Expected time = `READ_TIME` + `READ_LISTEN_TIME` = 1.2 s + (a letter: `READ_LETTER_TIME` = 1.2 s; words: `READ_CHAR_TIME` = 0.35 s per letter + `READ_WORD_TIME` = 1 s per word after the first): a letter ≈ 6 s at Medium, a 5-letter word ≈ 7 s, 3 words up to 10 letters ≈ 16–20 s.
- After a mistake: "🔊 It said: кошка на дереве".
- **Devices without speech** (TV browsers: no `speechSynthesis`, or no voices): the Reading tab shows 🔇 and an explanation ("This device can't speak … It works on a computer or a phone."), its switch shakes instead of turning on, and lessons use the other enabled types — Math when Reading was the only one. The home summary shows "🔇 off on this device". A language with no voice on this device is marked 🔇 in the language switch, explained the same way and left out of lessons. Voices load asynchronously, so the settings and home screens refresh when the voice list changes.

### Answer modes

Both modes work for every task type except Reading (always picked).

- **Pick 1–4**: four answer buttons in a 2×2 grid, pressed with keys 1–4, arrows + Enter, or a click. Wrong options are close and plausible; for scales see above. For math:
  - Close ones keep the units digit, so the last digit doesn't give the answer away: ±10, ±20, ±100, ±1000 (answers ≥ 10), plus ±1 rarely and the last two digits swapped. Answers below 10 get ±1–3.
  - Typical slips, weighted higher: + a forgotten carry (47 + 36 → 73); − the smaller digit taken from the bigger one (52 − 37 → 25) or a borrow that doesn't lower the next column (61 − 25 → 46); × by a one-digit number with the carry forgotten (14 × 8 → 82) and a neighbouring table result (answer ± a factor up to 20); ÷ the quotient ±1; with mixed operations, the task worked left to right without doing × and ÷ first (20 − 8 ÷ 4 → 3).
  - Options far from the answer (below half of it − 10 or above twice + 20) are dropped as unbelievable. About two thirds of the math wrong options share the answer's units digit.
- **Type**: digits typed on the keyboard / remote, Backspace deletes, Enter or Space submits. On touch screens (`pointer: coarse`) an on-screen number pad replaces the "press Enter" hint: 1–9, ⌫, 0, ✓ (a 3 × 4 grid in portrait, 6 × 2 in a low landscape panel).

### Future task types (ideas)

Clock reading, comparing numbers (<, =, >), number sequences, spelling / missing letter (typed on a letter keyboard), multiplication-table drill, word meanings (picture ↔ word, translations), scales with decimals (0.1, 0.5 — needs a decimal point key).

## Lesson flow

- The lesson owns a **safety level** `f` from 1 (safe) to 0 (fail). It drains at `1 / failTime(task)` per second; each process draws it its own way.
- Start: a short "Get ready" (`INTRO_TIME`) while the first task is already visible; then the process starts running.
- A reading task is spoken when it appears (see Reading).
- Correct answer: a chime, the card flashes green, `f` is restored to 1 (not during the boss round) and the process reacts (see below); the next task appears after `FEEDBACK_TIME`, during which the process is frozen.
- Wrong answer: a buzz, the card shakes red, the solved example (`47 + 36 = 83`) stays visible under the card for `WRONG_SHOW_TIME`, and a new task appears after `FEEDBACK_TIME` — the process keeps draining meanwhile.
- Below `WARN_LEVEL` a soft tick plays (faster when almost empty).
- `f` reaches 0 → the process plays its defeat animation (`END_ANIM_TIME`) → Defeat dialog.
- The last correct answer → victory animation → Victory dialog; the step and coins are saved.
- Leaving the tab pauses the lesson.
- Debug cheat (keyboard only, not documented for players): `]` answers the current task correctly and shows a banner; the lesson is then marked as cheated and a win doesn't add a step or coins.

### Pause costs coins

A pause gives time to think, so it has a price — otherwise Very fast pays ×2 per task, and a pause on every task would give all the time of Very slow. So:

- Pausing at once eats `PAUSE_FEE` = 1 coin of the **current task** (its price on the task card), then the **Coin Muncher** eats the rest of that task's coins evenly over `PAUSE_EAT_TIME` = 30 s of real time while the dialog is open (a hidden tab doesn't count). Only the current task's coins can be eaten — never the coins already won in the lesson nor the player's saved ones. The task card shows what is left ("🪙 2 😋"), and when the task is answered correctly it pays its price less what was eaten; the lesson info shows "😋 −N" eaten so far, and the result says "45 for the answers − 3 😋 eaten in pauses × 67%". In the feedback moment after a correct answer, the "current task" is the next one.
- A pause is **extra time to think**, but not free: the dialog covers only the scene, the task stays readable next to it (answers are blocked until Continue; a reading task's 🔊 still works), and Continue goes on with the same task (a reading one is said again). The safety level stays where it was. On a phone in portrait the dialog sits over the scene above the task panel.
- No pause during the win / lose animation.
- The dialog (`muncher.js`): a fluffy purple monster with horns next to a pile of the task's coins; it chomps, coins fly from the pile into its mouth with a "−1" and a chomp-and-clink sound (at most one every `PAUSE_CHOMP_GAP` s, "−N" when it eats faster), and the text says what's happening: eating ("eats this task's coins while you pause — all of them in 30 s!") or full (eyes happy, a burp: "It ate all the coins of this task"). "🤔 The task is still there — think it over."
- **Speed in the pause**: two buttons change the speed of the current task's type by one step — **🐢 Too fast?** "🔢 Math: 🐇 → 🐢 Slow · 🪙 3 → 2 per task" and **🚀 Can go faster?** "🔢 Math: 🐇 → 🐆 Fast · 🪙 3 → 5 per task" (each hidden at the end of the scale). A press saves the setting, the lesson's price for that type, the task card, the remaining part of the lesson price ("🪙 earned / price") and the fail time change at once, a note confirms it ("✓ 🔢 Math is now 🐆 Fast: 🪙 5 per task"), and the buttons show the next step, so it can be pressed again. The Muncher's pile follows the new price.

### Slower offer

After a defeat, or a won lesson that lost coins to mistakes (2+ mistakes), the result dialog offers the same step one speed slower: "Too fast? Try it slower: 🔢 Math 🐇 Medium → 🐢 Slow (🪙 30 → 20 per lesson)" and a **🐢 Try slower** / **🐢 Replay slower** button, so nobody has to go to the settings. It slows the task types that had a mistake or ran out of time in that lesson (all the lesson's types if none), one step each, saves the settings and starts the step again. After a defeat it is the default button; after a win the default stays Next lesson / Replay. Not offered when those types are all at Very slow already.

## Processes

All six processes are built. Scenes are drawn on a canvas in a fixed design space (`fitScene`: scaled to fit, centred, anchored to the bottom, backgrounds full-bleed). Each scene module (`scenes/<process>.js`, a `create…Scene` factory registered in `SCENES` in `lesson.js`) exposes `correct`, `wrong`, `win`, `lose`, `bossStart`, `bossHit`, `update(dt, f)`, `draw`, and picks its colours by the step number.

1. **🌷 Grow a Flower** (built). A pot on a sunny windowsill and a glass water gauge with a ½ mark. The water level is `f` and goes down all the time. Below half the flower starts to wilt: the stem droops, leaves turn yellow then brown, petals fade and the flower's face frowns. A correct answer brings a watering can that pours (sound, droplets), the gauge refills to the top, the flower recovers smoothly and grows a little: over one lesson it goes from a sprout through a bud to full bloom. Each step has its own petal colour / shape. Defeat: the flower collapses and drops its petals. Victory: sparkles around the bloom. **Boss:** a caterpillar climbs the stem toward the flower (the gauge stays full); each hit sprays it with water, the third one turns it into a butterfly that flies away; if it reaches the flower it munches the petals.
2. **🧟 Zombie Defense** (built). Evening, a house on the left with the family in the window and a kid in the attic window. A zombie rises from the ground on the right and walks to the door; its position is `f`. Correct answer: the kid throws a stone — the hit zombie stops and stays until the stone lands — BONK — it falls over and fades, and only then (`ZOMBIE_NEXT_DELAY` after the hit) the next one rises on the right. Wrong answer: the stone falls short, the zombie keeps walking. Defeat: the zombie reaches the door and the lights go out. Victory: fireworks over the house. Zombies are cartoonish (random shirt colours, sizes, hats), not scary. **Boss:** a big zombie king with a crown; each stone makes it stagger, the third knocks it over.
3. **🚂 Railway Rush** (built). Side view, the camera follows a steam train (locomotive, tender, passenger car with faces) through parallax mountains, hills, trees and telegraph poles. The rails end `f × RAIL_AHEAD` in front of the locomotive; the train moves exactly as much as `f` drains, so the rail end stays put in the world. A correct answer lays rail pieces up to `RAIL_AHEAD` ahead: they drop in one by one with a clank. A wrong answer drops a piece that bounces off. A warning sign blinks at the rail end when it's close. Defeat: the locomotive tips over the rail end in a cloud of dust. Victory: the train speeds up and rolls into a station with bunting, whistle. **Boss:** a ravine with a river opens where the rails end; each hit drops one of three bridge sections in; the train crashes into the ravine if it gets there first.
4. **🎈 Balloon Flight** (built). A striped hot-air balloon with a pilot in goggles over the sea; its height is `f`. A correct answer fires the burner (flame, roar) and the balloon climbs back up; a wrong one gives a sad puff of smoke. A shark fin circles when the balloon is low. An island with a palm and a flag comes closer with each correct answer. Defeat: the basket splashes into the sea and the envelope deflates. **Boss:** an angry thundercloud with rain drifts toward the balloon (the sky darkens, thunder and flashes); each hit is a gust that shrinks it, the third blows it away and a rainbow appears; if it reaches the balloon, lightning knocks it into the sea.
5. **🔥 Campfire Night** (built). Night forest, a tent and a kid toasting a marshmallow by the fire. The fire's size and the lit circle are `f`; glowing wolf eyes sit at the edge of the light and creep closer as it dims (their silhouettes show when close). A correct answer throws a log in: the fire flares with sparks and a crackle, and the eyes back off. Wrong answer: a puff of smoke. Defeat: the fire goes out and the wolves howl. Victory: dawn — the sky brightens, the sun rises, the wolves leave, birds chirp. **Boss:** the pack leader walks into the light (the fire stays full); each hit is a burning stick that makes it yelp, the third sends it running.
6. **🐼 Panda Snack** (built). A bamboo forest (morning / midday / sunset by step) with a chubby panda sitting next to a basket of food; a heart in the corner fills with `f`. The panda's mood follows `f` and shows in stages: content (smile, blush, a gentle sway) → hungry below 0.6 (looks at the basket, tummy rumbles "~grr~") → sad below `PANDA_SAD_LEVEL` (droopy ears and brows, tears roll down) → below `PANDA_SUCK_LEVEL` it sucks its paw and sniffles. A correct answer tosses a treat from the basket (bamboo, apple, carrot or a bao bun, in turn): the panda catches it with both paws and munches it (`PANDA_CHEW_TIME`, crunching sounds, crumbs, "Yum!", little hearts), and its mood comes back up while it eats; its belly gets rounder over the lesson. Wrong answer: the treat falls short and rolls away, the panda watches it. Defeat: it bursts into tears. Victory: a happy bouncing dance with arms up and a stream of hearts. Each step has its own accessory (a bow in one of five colours or a flower). **Boss:** a cheeky monkey creeps toward the basket to steal it (the mood stays full); each hit is the panda's "ROAR!" that startles it, the third sends it fleeing; if it reaches the basket it runs off with it and the panda cries. The big boss (step 10) is a bigger monkey with a crown.

## Characters, room and shop

### Characters

- 10 characters (`CHARACTERS`), not split into boys' and girls': **Kitty, Puppy, Bunny, Panda, Fox, Bear, Unicorn, Dragon, Penguin, Lion** — cute, popular and easy to draw; the style (bows and gowns or caps and armor) comes from the clothes, so everyone finds theirs. Older saves get the character nearest to their old emoji avatar (`OLD_AVATARS`).
- Drawn as SVG (`characters/`): one shared chibi body (big round head, round body, short limbs) and per-species parts (`species.js`: colours, ears, tail / wings, face markings, nose). Because the body is shared, **every piece of clothing fits every character**.
- Faces (`Look.FACES`): by fullness — happy (≥ `FULL_HAPPY` = 70), ok, hungry (< `FULL_HUNGRY` = 35: worried brows, frown, the tummy rumbles "I'm hungry…" every `HUNGRY_RUMBLE` = 6 s in the room), very hungry (< `FULL_STARVING` = 12: a tear) — and reactions: love (heart eyes, arms up), chew, yum, bleh (green face, tongue out), sour (squint, pucker), spicy (red face, steam from the ears), fire (the dragon breathes fire), cold (blue, shivering, chattering teeth), sparkle (star eyes), giggle, proud. Eyes blink; tails wag.
- Each character loves two foods and dislikes one: Kitty fish, milk / carrot; Puppy sausage, pizza / broccoli; Bunny carrot, strawberries / sausage; Panda bamboo, dumplings / fish; Fox drumstick, strawberries / bamboo; Bear honey, fish / broccoli; Unicorn rainbow cupcake, apple / drumstick; Dragon chili, drumstick / ice cream; Penguin fish, ice cream / chili; Lion steak, sausage / broccoli.

### Room screen

- The room (`room.js`, one SVG, viewBox 800 × 500: wall, floor, furniture, the character in the middle, toy and pet in front) with a HUD: the player's name, the character and what it loves, a tummy bar (Full / Happy / Peckish / Hungry / Very hungry!).
- **The poor start**: a bare character in a room with old cracked plaster with a cobweb, worn boards, a cardboard box for a bed, a crate for a table, a bare bulb on a wire and a small cracked window; a new character is a bit hungry (`FULL_START` = 50) and the player has no coins yet — the first lesson buys the first food.
- The shop panel: **🍎 Food / 👕 Clothes / 🛋️ Room** tabs; Clothes and Room have slot chips (a green dot = something there is affordable now), then a grid of item cards (thumbnail + price, "✓" in use, "Owned", greyed when too expensive, 💎 prices in blue, ❤ on favourite food) and an info line with the action button.
- Picking a piece of clothing **tries it on** (the character shows it off), a room item is shown in the room; the action is **Buy 🪙 N** (then it's worn / placed at once, cash-register sound, "Looking good!" with sparkles), **Wear it** / **Put it in the room**, **Take off** / **Put back: Cardboard box** (slots with a default go back to it). Too expensive: the button is grey and shakes, the note says "Need 🪙 40 more — about 2 lessons" (by the lesson price with the current settings) or "Need 💎 5 more — beat bosses".
- **Feeding**: Feed 🪙 N pays and the food flies to the mouth, is munched in `FOOD_BITES` = 3 bites with crumbs, then the reaction (`REACT_TIME` = 2.2 s, a popup, a sound): favourite → hearts, a jump, "My favorite!" (and ×`FOOD_LOVE_FILL` = 1.5 fullness); disliked → "Bleh!"; lemon → "Sooo sour!" for everyone; chili → "Hot hot hot!" with steam, the dragon breathes fire ("ROAR!"); ice cream → "Brrr!" for the dragon; cake → loved by all; golden apple → star eyes and sparkles. At ≥ `FULL_REFUSE` = 95 it's "I'm full!".
- **Hunger**: fullness drops from full to empty in `HUNGER_HOURS` = 48 real hours, also while the game is closed (stored as the value at `fedAt`). It's only looks and a nudge — nothing is lost when it's hungry.
- Tapping the character makes it giggle and jump (or say it's hungry).
- Debug cheat (keyboard, room screen): `[` takes 25 fullness away (banner).

### Catalog and prices

`FOODS` and `ITEM_SLOTS` are in `constants.js`, food drawings in `items/food.js`. Items: one file per slot (`items/wear/<slot>.js`, `items/room/<slot>.js`); each entry is the catalog item and its drawing together (`{ id, name, price | gems, draw, box? … }`), added to `ITEMS` / `WEAR_ART` / `ROOM_ART` by `addItems`, in shop order (cheap → elite). Prices follow the lessons: a lesson pays about 🪙 30–60 with starter settings (more with harder ones), and a level of one process (10 steps) gives up to 9 💎.

- **Food** (20, eaten at once, the steady coin sink): lemon 🪙 3, broccoli 4, apple / carrot / bamboo 5, banana / chili 6, milk 8, fish / sausage 10, strawberries 12, drumstick 14, honey 15, dumplings 18, steak / ice cream 20, pizza 25, rainbow cupcake 30, birthday cake 60, golden apple 💎 2. Fill 8–100; keeping the tummy full costs about 🪙 15–30 a day.
- **About 20 items in every slot**, on a smooth price ladder from humble to luxurious (🪙 10–15 steps at the bottom, then 20, 30, 40, 50, 60, 80, 100 … 1000, 1500, 2000, then 3–4 diamond pieces of 💎 10–60): cheap = homemade and simple, middle = nice and colourful, expensive = shiny and often animated, diamond = gold, gems and sparkles. Each slot has Halloween, Swedish (Midsummer, Lucia, Dala horse, Falu-red cottage, Vikings, northern lights, crayfish party, fika) and Christmas pieces. Many items are animated (CSS classes `an-bob, an-sway, an-spin, an-twinkle, an-swim, an-flicker, an-pulse, an-float, an-wiggle, an-glow, an-blink, an-rise, an-fall, an-drift, an-jump` with delays `an-d1…an-d4`, and SMIL for turning around a fixed point). Drawings are flat SVG with ink outlines, no `<defs>`, ids, gradients or filters (many copies are on screen at once), deterministic (no random).
- **Clothes** (142) in 7 slots, e.g. Hats (paper party hat 🪙 15 … pumpkin hat, Midsummer wreath, tomte hat, propeller beanie, Viking helmet, witch hat, Lucia candle crown 600, unicorn headband 1000, ice queen crown 💎 15 … phoenix crown 💎 50), Glasses (cardboard glasses 15 … Swedish flag glasses, pumpkin / bat glasses, ski goggles, disco glasses, laser visor 1000, northern lights glasses 💎 10, ruby heart shades 💎 40), Neck (daisy chain 15 … crayfish party bib, Lovikka scarf, bat bow tie, Viking amulet, headphones, feather boa 1200, diamond collar 💎 40), Outfits (patched overalls 15 … ghost costume, Christmas jumper, Lucia gown, Midsummer folk costume, Viking tunic, glow skeleton suit, wizard robe 1200, space suit 1500, ice queen gown 💎 20, dragon-scale armor 💎 60), Back (paper wings 15 … Swedish flag cape, pumpkin backpack, balloon bunch, bat wings, tomte's sack, butterfly / dragon wings 1500, northern lights cape 💎 10, peacock tail 💎 40), Shoes (worn-out sneakers 15 … Swedish clogs, witch boots, ice skates, elf shoes, light-up sneakers, moon boots 1000, glass slippers 💎 20, diamond boots 💎 50), In hand (lollipop 15 … kanelbulle, Swedish flag, sparkler, ghost balloon, trick-or-treat bucket, crayfish party lantern, bubble wand, knight torch, rainbow wand 800, golden trophy 💎 10, crystal ball 💎 40).
- **Room** (227) in 11 slots, e.g. Walls (old plaster → patched plaster 15, painted 30 … Falu-red planks, pumpkin and Dala horse wallpapers, library, jungle, Midsummer mural, spooky bats, Christmas garland, aquarium, space station 1500, northern lights 💎 10 … crystal palace 💎 50), Floors (bare boards → swept boards 15 … pine, rag-rug runners, pumpkin patch, Midsummer meadow, sand beach, ice rink, sea floor, lava, gold tiles 1500, starry glass / cloud / rainbow light 💎 10–30), Beds (cardboard box → straw pile 15, sleeping bag 30 … hammock, Swedish kitchen sofa, Falu cottage bed, pumpkin carriage, coffin bed with a bat, Viking longship, sleigh, pirate ship, cloud bed, rocket bed 2000, unicorn / dragon nest / starry night beds 💎 20–60), Tables (crate → plank on bricks 15 … fika table, art easel, jack-o'-lantern, crayfish party, witch potion, Advent candles, gingerbread house, aquarium, DJ table 2000, crystal orb / golden feast / robot workshop 💎 20–50), Lamps (bare bulb → tin can 20 … jar of fireflies, straw stars, crayfish lanterns, bat mobile, rain cloud, Advent star, fairy lights, Lucia candle ring, planet mobile, lava globe, northern lights 1200, golden sun 💎 15 … phoenix 💎 60), Windows (small window → patched 15 … rainy, cat, Falu-red cottage view, snowy, Midsummer, Halloween, sea view, Advent star, city at night, porthole, stained glass, northern lights, space 1000, crystal bay / magic portal 💎 30–50), Rugs (old doormat 15, rag rug 30 … Dala horse, spider web, polar bear, race track with a driving car, ocean, Persian, flying carpet 2000, star map / gold / rainbow dance mat 💎 15–30), Pictures (sticky note 10 … Dala print, Falu cottage, moose, haunted house, Viking ship, ghost portrait, Christmas wreath, aquarium, cuckoo clock, magic painting 1000, family portrait / starry night / crystal portrait 💎 10–30 — the portraits show the player's own character), Plants (sprout in a tin can 10 … sunflower, lingonberry bush, pumpkin vine, Midsummer birch, poinsettia, flytrap, spooky tree, Christmas tree, cherry blossom, glowing mushrooms 1000, dancing rainbow flower / crystal tree / magic beanstalk 💎 10–40), Toys (wooden blocks 15 … spinning top, jack-in-the-box, Dala horse, straw goat, snow globe, Falu-red dollhouse, toy rocket 1500, unicorn plush / music box / rainbow carousel 💎 10–60), Pets (snail in a jar 15, ladybug, hamster in a wheel … crayfish in a bucket, hedgehog, kitten, black cat with a witch hat, friendly ghost, owl, axolotl, baby moose, reindeer calf, jellyfish tank 1000, star buddy / baby unicorn / phoenix chick 💎 15–35, baby dragon 💎 45).
- Pace: something new after the first lesson and then every lesson or two (the ladder has a step every few lessons in every slot), 🪙 100–300 pieces every few days, 🪙 1000+ in weeks, diamond pieces after one or a few levels of bosses. Everything costs about 🪙 100 000 and 💎 1 900 — a long-term goal; nobody needs it all. Adding an item = a new entry with its drawing in its slot file.

## Phones and touch

- The split-screen joystick scheme from the repo conventions doesn't apply: every action is a button (answers, number pad, pause), and plain `<button>`s are tapped directly.
- Starting a lesson on a touch device requests fullscreen (`goFullscreen`, try/catch, works windowed on iPhone). The scene blocks page scroll / pinch zoom (`touch-action: none`, `preventDefault` on `touchstart` / `touchmove`).
- Mouse cursor: in fullscreen it hides once the mouse has been still for `CURSOR_HIDE_MS` (3 s) and comes back as soon as the mouse moves, clicks or scrolls (`core/cursor.js`).
- Portrait: the scene on top, the task panel below (the room: the room on top, the shop below); narrow screens (≤ 620 px) wrap the home top bar, put each process's track on its own full-width line with shrinking cells, use a 2 × 2 grid of operations and a full-width speed switch in the settings. Low landscape screens (≤ 520 px high) get a compact task panel and dialogs that scroll if needed. Safe-area insets are respected; sticky hover zoom is off on touch screens.

## Graphics quality

`quality.js` picks the canvas resolution automatically (`QUALITY_LEVELS`: low / medium / high = max device-pixel ratio 1 / 1.5 / 2, backing store capped at 1280 × 720 / 1920 × 1080 / 2560 × 1440 pixels; low also drops the soft glow of the wolves' eyes and halves the confetti).

- Starting ceiling: TV browsers (user agent with webOS / Tizen / SmartTV…) and devices with ≤ 2 GB memory or ≤ 2 cores → low; touch devices → medium; others → high.
- During a lesson the frame rate is averaged over `QUALITY_WINDOW` = 2 s windows (the first 0.6 s after a start / resume and hitches over 0.25 s are skipped): below `QUALITY_LOW_FPS` = 45 → one level down; above `QUALITY_HIGH_FPS` = 57 for `QUALITY_UP_WINDOWS` = 4 windows in a row → one level up, but never above the ceiling nor back to a level that was too slow in this session. The canvas is resized at once.
- The level is remembered in `localStorage["funTraining.quality"]`, so the next visit starts at it.
- Older TV browsers lack `CanvasRenderingContext2D.roundRect` (Chromium < 99); `fx.js` polyfills it — without it every scene threw on its first frame and the lesson froze on the TV. The CSS avoids newer features there too (no `inset`; the focus ring falls back to always visible without `:focus-visible`).

## Sounds

The Reading voice is the device's speech synthesis (`speech.js`). Everything else is synthesized with Web Audio (`audio.js`), no files: UI click, cash register, coins spent, yum, bleh, sour, sizzle, teeth chattering, giggle, correct chime, wrong buzz, warning tick, water pouring, whoosh, bonk, zombie groan, rail clank, train whistle, crash, burner roar, splash, thunder, fire crackle, wolf howl and yelp, birds, munching, tummy rumble, sniffles, crying, a cute roar, monkey chatter, a happy squeak, boss drums and growl, victory fanfare, coins jingle, diamonds sparkle, star fanfare, fireworks pops, defeat sad trombone, the Coin Muncher's chomp and burp.

## Storage

`localStorage["funTraining.v1"]` = `{ players: [{ id, name, character, fullness (at fedAt), fedAt (ms), owned: [item ids], equip: { <slot>: item id }, coins, gems, progress: { <processId>: steps }, rates: { <processId>: [best coins per task of each step] }, best: { <processId>: [most coins earned on each step] }, bestGems: { <processId>: [most diamonds earned on each step] }, settings: { answerMode, lessonLength, types: ['math', 'scale'], math: { ops, operands, mix, limits: { add, sub, mul, div }, speed }, scale: { parts, limit, labels: 'all' | 'some', speed }, read: { lang: 'sv' | 'en' | 'ru', size: 0 (letters) | 3–10, words: 1–3, speed } } }], lastPlayerId }`. Loaded values are validated and merged with `DEFAULT_SETTINGS` (missing rates count as 3, a missing best as rate × lesson length, missing diamonds as 0 — old boss steps can be replayed for them; older saves get `types: ['math']` and the default scale and reading settings, the character nearest to their avatar, `FULL_START` fullness and the poor room; equipped items must be owned or a free default); all access is wrapped in try/catch so the game still works without storage.

## Files

```
fun-training/
├── index.html       # markup of all screens
├── styles.css
├── constants.js     # task types, operations, limits, scale and reading options, time tables, speeds, coin rules, star tiers, processes, characters, food / item catalog and prices, hunger, timings
├── core/            # plumbing with no game rules
│   ├── storage.js   # players and their settings/progress in localStorage
│   ├── audio.js     # Web Audio sound effects
│   ├── speech.js    # speech synthesis: a voice per language, says the Reading tasks
│   ├── nav.js       # spatial keyboard / TV-remote focus navigation
│   ├── quality.js   # automatic graphics quality (canvas resolution by device and frame rate)
│   └── cursor.js    # hides the mouse cursor in fullscreen while it is still
├── progress.js      # levels: boss kinds, which step is open, level complete, stars, diamonds per boss
├── tasks/           # task types, one file each; tasks.js first, then the types
│   ├── tasks.js     # Tasks: picks the type, expected time, answer choices, shared helpers (fmt, rnd, pick)
│   ├── math.js      # Math: example generator, time per operator, plausible mistakes
│   ├── scale.js     # Scales: generator, solution, plausible mistakes, SVG drawing
│   ├── words.js     # Reading data per language: alphabet, alike letters, words, phrases
│   └── read.js      # Reading: letter / word / phrase picker, close options, needs a voice
├── scenes/          # processes, one file each (state + canvas drawing)
│   ├── fx.js        # shared drawing helpers (roundRect polyfill, fitScene, mixColor, starPath…), the victory confetti and level-up fireworks
│   ├── flower.js    # Grow a Flower
│   ├── zombies.js   # Zombie Defense
│   ├── railway.js   # Railway Rush
│   ├── balloon.js   # Balloon Flight
│   ├── campfire.js  # Campfire Night
│   └── panda.js     # Panda Snack
├── characters/      # the characters, drawn as SVG
│   ├── species.js   # per character: colours, ears, tail / wings, face markings, nose
│   └── look.js      # Look: the shared body + species parts + outfit + face (moods, reactions)
├── items/           # things to buy: one file per slot (catalog entries + drawings), plus the shop logic
│   ├── food.js      # food drawings
│   ├── clothes.js   # WEAR_ART, thumbnail boxes and WEAR_KIT: shared helpers for clothes in character coordinates
│   ├── wear/        # head.js, face.js, neck.js, body.js, back.js, feet.js, hand.js — the items of each wear slot
│   ├── furniture.js # ROOM_ART, the room layout (where each slot stands, draw order) and ROOM_KIT helpers
│   ├── room/        # wall.js, floor.js, bed.js, table.js, lamp.js, window.js, rug.js, picture.js, plant.js, toy.js, pet.js
│   └── shop.js      # Shop: owning, buying, wearing / placing, feeding, hunger, tastes, thumbnails
├── ui/              # screens and their parts
│   ├── stars.js     # level stars as SVG in their materials, the ladder of levels
│   ├── lesson.js    # lesson loop: tasks, safety level, answers, win/lose, the paid pause
│   ├── muncher.js   # the Coin Muncher in the pause dialog (drawing, chomping coins)
│   └── room.js      # the room screen: room scene, shop panel, feeding / trying on / buying, reactions
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

- [x] Coin shop: characters, food, clothes, room
- [ ] More rooms / scenes (garden, beach…) and more items
- [x] Scales task type
- [x] Reading task type
- [ ] More task types
