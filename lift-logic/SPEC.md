# Lift Logic — SPEC

Developer/agent spec for the `lift-logic` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

> **Status: first release — build sessions 1–3 done** (see "Build order" and "What is built"). Chapters 1–3 (Grandma's House, Maple School, Grand Sunrise Hotel, 27 missions) are playable end to end; the later buildings show on the map as under construction. Numbers come from `tools/missions-check.js` (see "Balancing").

## What is built

- **Done:** the simulation and the VM with every block of chapters 1–6 (lists and `for each` too; the palette shows a block from its chapter on); the tap-first editor on a phone (palette sheet, select / move / copy / wrap / delete, drag from the palette and inside the canvas, long press moves one block, slots with the number pad, dropdowns, conditions, "use a block", undo / redo, pinch and pan, copy / paste with the keyboard), the Text view; the building view with the HUD, the plan flags, monitors, floating words, person and cabin cards, the Lift's eyes; the run bar (run, pause, step, speeds, skip, resize); the start menu, the buildings map, the building screen, the mission card with Grandpa Gears' concept card and the new blocks, the pause menu; the results with stars, the Engineer's record and 🏅, the wait chart, the Inspector's notes with "Show me", the comic lines, the Museum card, the newspaper after an exam; hints 1–3 and the guided finger of the first missions; the Lift Museum (cards and concept cards); sounds and the lift music; the cheats; English, Russian and Swedish.
- **Missions:** chapters 1–3 with reference solutions in `data/solutions/`, balanced by the checker (the reference gets ★★★ on Easy and Medium in every mission).
- **Not yet (later sessions):** chapters 4–10 and the World Tour (the hospital and the office have their building data; their missions, emergencies in play, several lifts on screen side by side are the next session), own blocks (chapter 7), zones / express, double-deck cars, Endless, Daily challenge, Sandbox, sharing programs (`core/share.js`), Wardrobe, Achievements, the minimap of tall buildings, "Different day", saved named versions of a program, the start screen's demo lift.

### Rules settled while building

- A lift standing idle with its doors closed opens for a call at its own floor (or a cabin button for it), as real lifts do; that stop does not fire `when I arrive at floor` and does not count as a stop.
- The arrow: set by the program for the stop; else an **empty lift answering a call of one direction shows that direction for the whole stop**; else the way to the next floor of the plan; none with an empty plan (then everyone gets on).
- When the doors close, whoever was left behind presses again, and **a call still lit at that floor is announced again** (`when call button pressed` fires once more), so an event-driven program never loses a call it was told about while it could not take it.
- A run ends when everyone is delivered or gone and the lifts stand still with the doors closed (a last `say` still runs), or `END_GRACE` s later when a program keeps a lift moving.
- On Hard the energy limits of the stars don't get stricter (the engineer's energy is often the least possible); waits do.
- Missions and solutions are written in a small text notation (`Prog.parse`, see `sim/program.js`): one block per line, two spaces of indent inside a C block, `( )` values and reporters, `< >` conditions, `[ ]` dropdowns and variables, `_` an empty slot, `#lock` a locked block.
- Changes to the first mission list: Tiny Lift is The Forever Lift on four floors in at most 6 blocks; The Patrol takes everyone up to the gym; Up First, Then Down and No Zig-Zag judge rides the wrong way first; Suitcases judges stops of a full lift for nothing.

## Idea

A programming puzzle game for kids from about 10 and for adults: the player is the **brain of a lift**. People appear on the floors of a building, press the call buttons, ride and get off; the player writes the lift's program from **blocks** (in the spirit of Scratch, with its own look) and watches the building live by it. The program only knows what a real lift knows — its floor, its buttons, the call buttons on the floors, its load, the clock — it does not see the people. Good programs deliver everyone quickly, nobody waits long, nobody gives up and takes the stairs.

The game goes from a grandmother's three-storey house with one slow old lift to a school, a hotel, a hospital, an office tower, a mall with an underground car park, and then to real famous buildings — the Eiffel Tower, the Empire State Building, the Burj Khalifa — and ends with a space elevator. On the way the player learns, in this order: sequences, loops, conditions, sensing, events, variables, lists, own blocks with inputs, several agents working together, and real lift algorithms (collective control, zoning, SCAN, destination dispatch, double-deck cars).

Target: **at least 20 hours** of first play (see "How long it lasts"), phone-first in portrait, light 2D graphics.

What makes it pull kids and adults in:

- **You watch your code live.** The block that runs lights up, the lift says what it thinks in a speech bubble (the `say` block), people's faces go from 🙂 to 😠 — a bug is something you see, not an error message.
- **"Lift's eyes" mode**: one tap dims everything the lift can't sense — the people turn into grey shadows and only the lit buttons remain. The player sees why "the obvious" isn't obvious to a machine.
- **Three stars per mission** with different aims — deliver everyone, short waits, little energy, few blocks — so one mission can be replayed three times for three different reasons.
- **The Inspector**: after a run it points at a concrete moment ("Mia waited 74 s on floor 4 — your lift passed floor 4 three times without stopping") and offers "Show me", which replays the day to that moment.
- **Engineer's record** for adults: every mission has a reference solution; its numbers are shown after the player's ("Your average wait 16.8 s · Engineer 14.2 s"), and beating it gives a 🏅.
- **Characters with habits**: Grandma Rosa with her cat, a pizza courier with no patience, a prankster boy who presses every button, bellboys with suitcases, doctors with a hospital bed, tourist groups. Each has a name, a face and a short line ("Finally!", "I'm taking the stairs!").
- **Jokes in the results**: every run ends with a funny line or two about what happened in it, and every exam with the front page of the building's newspaper (see "Run results").
- **Real lift lore**: every finished mission adds a card to the **Lift Museum** (Otis's safety brake, the paternoster, why a lift chimes once going up and twice going down, the fastest lifts in the world) — short facts with a picture.
- **Variety of mission kinds**: build, fix the bug, fill the gaps, fit into N blocks, beat a number, a chapter exam.
- **After the campaign**: an endless mode per building, a daily challenge, a sandbox, sharing programs with friends as a code.

## Story frame

The player is **Lifty**, a small new lift computer, just installed in an old house. Its mentor **Grandpa Gears**, a retired lift mechanic, explains each new idea in one or two speech bubbles. Each building has a client (Grandma Rosa, Principal Oak, the hotel manager Ms. Bellamy, Dr. Patel, …) who gives the missions. Word about Lifty spreads, and it is invited to bigger and more famous buildings, up to the opening of the first space elevator. The story is a few lines per mission — never a wall of text, always skippable.

## Screens

Layout is phone portrait first; on a landscape screen (tablet, desktop) the same parts stand side by side.

- **Start screen:** the language switcher (EN · RU · SV) at the top, the logo (a lift cabin whose doors are two puzzle blocks), **Continue** (the next unfinished mission; the default button), **Buildings** (the campaign map), **More** (Endless, Daily challenge, Sandbox, Lift Museum, Wardrobe, Achievements — each greyed with 🔒 and the condition until it opens), the difficulty (Easy / Medium / Hard toggles with a line on what it changes), Sound On / Off, Music On / Off. Behind it a lift runs one of the player's own finished programs in a small building (or a built-in one at the start).
- **Buildings (campaign map):** a city skyline that scrolls sideways (on a phone held upright: the buildings one under the other as big cards). Each building: its silhouette, name, stars earned / possible, 🔒 with the condition. The World Tour buildings stand apart on a world map strip.
- **Building screen:** the client's portrait and a line, the missions of the building as a path of numbered stops (stars under each, the exam at the end with a trophy), 🔒 until the one before is passed.
- **Mission card (briefing):** the client's speech bubble with the task (2–3 short lines), the goal, the three stars and what each needs, a small preview of the building, the **new blocks** of this mission (each with a tiny looping animation of what it does and "Try it"), **Start** (opens the editor), Back. Grandpa Gears' concept card when the mission introduces a programming idea (one picture, two lines, an everyday comparison: "A loop is like walking round the block until you find the dog").
- **Editor + building (the main screen),** portrait:
  - **Top bar** (44 px): ☰ (pause menu), mission name, the three star targets as small icons that light up live while the run meets them, 💡 hints.
  - **Building view** (top ≈ 45 %): the cut-away building (see "The building view"). Over it, small HUD chips: the clock, delivered / total, waiting now, gave up, ⚡ energy, 👁 Lift's eyes toggle.
  - **Run bar** (between the halves, 56 px): big ▶ **Run** (turns into ■ **Stop**), ⏸ / step ⏭ (one block), the speed (×1 / ×2 / ×4 / ×16, a tap cycles), ⏩ **Skip to the end** (runs the rest at full speed without drawing). Dragging the bar resizes the halves; a double tap gives the whole screen to the building or to the code and back.
  - **Code area** (bottom ≈ 50 %): the category chips (Lift, Sensing, Events, Control, Operators, Variables, My Blocks — only those with unlocked blocks), the scripts canvas (scrolls both ways, pinch zooms), undo ↶ / redo ↷, the block count ("Blocks 9 / 12" when the mission has a limit), **Text** (shows the program as JS-like text, read-only).
  - Landscape: building on the left, palette in the middle, scripts on the right (the classic block-editor layout).
- **Run results:** the stars (each line ✓ / ✗ with the number: "Average wait 18.4 s · needed ≤ 20 s"), "New best!", the Engineer's record next to the player's numbers, a small bar chart of the wait times (each passenger a bar, the gave-ups red; tap a bar → "Show me"), up to three **Inspector** notes, one or two **comic lines** about the run (see below), the Museum card won (first completion), a note when cheats were used or hint 3 was used; **Edit** (back to the program, the default after a failed run), **Next** (the default after a pass), **Retry**, Buildings.
- **The comic lines** (`ui/jokes.js`, texts in `data/jokes.js`, like `world-aviation`'s debrief): under the numbers, one or two lines, each an icon and an italic quote from a passenger, the client or Grandpa Gears. The first is about the run's most notable trait, measured against thresholds in `constants.js` (`JOKE`) and taken in this order: someone gave up ("Mr. Brown took the stairs. He says thanks for the workout."), the longest wait ("Mia has finished her book. And started the sequel."), empty trips ("The lift went sightseeing. Alone. Eleven times."), the lift full past a waiting floor, the prankster ("Tommy pressed every button. The lift said: no."), a ride that went the wrong way first, a lot of `say` ("The lift talks more than Grandma."), an energy record; with nothing rough: a good-run line or a ★★★ line ("Grandma Rosa: faster than my cat!"). The second is about a moment of the day: a rush hour, an emergency, the wedding cake carried up, the boy who rode up and down for fun, a dog on board, the pizza delivered while still hot. Lines exist per building (its people and places) and for any building; ≈ 8–15 per trait and per moment, so they rarely repeat. The pick is a hash of the mission and the run's numbers, so the same run always shows the same line (also after a language switch). A run stopped by the player or cheated: no lines.
- **The building's newspaper** (after an exam and the first ★★★ of a building): the front page of a small paper with the building's own name ("The Maple School Times", "Hotel Gazette", "Le Petit Ascenseur", "The Burj Daily"), a headline made from the run ("LIFT DELIVERS 214 GUESTS, CAKE ARRIVES IN ONE PIECE"), a photo-like drawing of the lift and the happiest passenger, two short columns of jokes picked as above, an interview line from the client, and the weather "forecast" of the next building as a teaser. Kept in the Museum to read again.
- **Pause menu (☰):** Continue, Restart run, Mission card, Buildings, Main Menu, Sound On / Off, Music On / Off, the difficulty (a change restarts the run), **Share program** / **Paste program** (see "Sharing"), Clear program (asks first).
- **Lift Museum:** a grid of the cards won (the rest as grey frames with "?"); a card opens big with its picture and text.
- **Wardrobe:** the lift's looks: cabin skins (wood, steel, glass, candy, rocket…), the face on the cabin's display, the chime sound, the waiting music; each opened by stars or an achievement (shown under it).
- **Achievements:** a list with a picture each, earned / not, the condition.
- **Sandbox setup:** building (any opened one, or "Plain tower"), floors (3–200), lifts (1–8, the program groups), capacity, speed, the traffic (Up-peak / Down-peak / Lunch / Mixed / Random, intensity), length of the day; then the editor as in a mission, with the stats but no stars.

## The building view

Canvas 2D, all drawn in code (no image files), a flat, friendly style with few details: a vertical cut-away of the building like a doll's house.

- **Floors** are horizontal bands (`FLOOR_PX` 44 px high at zoom 1) with the floor number at the left edge and the building's own interior (classrooms, hotel corridor, hospital ward, offices, shop windows, the parking with cars), drawn simply from a few shapes per building (`art/interiors.js`).
- **The shaft(s)** run up the middle; the **cabin** shows its doors (sliding), the people inside (little round-head figures), its display (the floor number and the arrow ▲ / ▼) and the skin from the Wardrobe. Several lifts stand side by side, each with a letter (A, B, C…).
- **Each floor's landing**: the call buttons ▲ ▼ (lit when pressed), the waiting people in a short queue, each with a mood face above the head (🙂 → 😐 → 😟 → 😠 with the wait) and, small, the floor they are going to (the player sees it; the lift does not — see "Lift's eyes").
- **Tap a person**: a card with the name, where from and to, how long waiting / riding, the mood, the character's line.
- **Tap the cabin**: its plan (the list of floors it is going to), load, direction, the variables of this lift.
- **The plan** (from chapter 3) is drawn as little flags with the floor numbers next to the shaft at those floors, numbered in order, so the to-do list of the lift is visible.
- **Tall buildings**: the view follows the lifts (one followed lift chosen by tapping it), drag to scroll, pinch to zoom; a **minimap strip** at the right edge shows the whole building — a dot per lift, a lit tick per floor with a call, red when someone waits long; tap it to jump there.
- **Lift's eyes 👁**: everything the lift can't sense is drawn grey and blurred (people, their destinations, their moods); the buttons, the cabin's display and sensors stay bright, with a small label over each sensor the program reads this run.
- **Monitors**: variables shown with `show variable` sit as small chips over the building, like in Scratch.
- **Floating words**: "+1" when someone arrives, "I'll take the stairs!" when someone gives up, the `say` bubble from the cabin, "Too heavy!" when the lift is full.

## The simulation

Fixed step `SIM_DT` (0.05 s of game time). Everything is deterministic from the mission's seed, so the same program on the same mission always gives the same day (this is what makes "Show me", step-back and the reference checks possible). A "Different day" button in the run bar's long-press menu reruns with another seed for curiosity; stars are judged on the mission's own seed.

### Building

- Floors from the lowest to the highest. The ground floor is **1**; basements are **−1, −2, …** (from the mall chapter on; there is no floor 0 in the numbering, so the floor below 1 is −1). The lobby (where people come in from the street) is floor 1 unless the mission says otherwise; some buildings have **sky lobbies** (transfer floors).
- A lift **group** is a set of lifts that share the hall call buttons and run copies of the same program. Each lift has its served floors (all, a zone, or express: lobby + a range).

### Lift

- Moves along the shaft with a top speed `speed` (floors/s) and an acceleration `accel` (floors/s²) per lift type (`data/lifts.js`): Old (0.5 / 0.5), Standard (1 / 1), Fast (2.5 / 1.5), Express (6 / 2), Space climber (its own scale). A trip is a trapezoid of speed; the **braking point** for a floor is where it must start to slow down to stop there.
- **Doors**: open `DOOR_TIME` (1.2 s), stay open at least `DWELL_MIN` (2.5 s) plus `BOARD_TIME` (0.8 s) per person getting on or off, close `DOOR_TIME`; someone in the doorway re-opens them (`someone in the doorway?` sensor). `hold doors (s)` adds time; `close doors` closes as soon as nobody is in the doorway (latecomers stay behind). The lift never moves with the doors open.
- **Plan**: an ordered list of floors the lift will stop at. The lift always drives towards the first floor of the plan; arriving there it stops, removes that floor from the plan (and any other entry of the same floor), opens the doors. With the plan empty and the doors closed it is **idle** and stands still.
- **Arrow** (the direction lamps over the doors and on the display): automatic by default — the direction towards the next floor of the plan after this stop, none when the plan is empty; `set arrow to (up/down/none)` overrides it for the current stop.
- **Capacity** in places (4 in Grandma's house to 20+); a person takes 1, a person with a suitcase or a cart 2, a hospital bed with a nurse 6, a piano 8.
- **Energy** ⚡: `ENERGY_PER_FLOOR` (1) per floor travelled + `ENERGY_PER_START` (2) per start; from chapter 9 a lift going down full gives back `REGEN_SHARE` (30 %) of it (regenerative braking).

### Passengers

- Come from the mission's **schedule** (`data/missions/*.js`): fixed people at fixed times (early missions, so a story works out exactly), and **flows** (from, to, rate per minute, time window, the character mix) drawn from the seeded random. Traffic patterns: up-peak (lobby → upper floors), down-peak (→ lobby), lunch (to and from the canteen floor), inter-floor, mixed.
- A person appears on the landing, presses ▲ or ▼ if it isn't lit (the hall call), waits. When a lift of the group opens there: the people for this floor get off first, then those waiting get on if the lift's arrow matches their direction (or shows none) and there are places left, in queue order; each presses their floor's button inside (cabin call). The hall call goes off when a lift opens there with a matching arrow (both go off with no arrow); someone left behind presses it again.
- **Patience** per character (`data/people.js`, × the difficulty): the face changes at 25 / 50 / 75 % of it; at 100 % the person **gives up** — walks to the stairs (a counted "gave up"), or, when the trip is longer than `STAIRS_MAX` (4) floors, stays furious (every second after that counts double in the stats).
- Wait = from appearing to getting on; trip = from appearing to getting off at the destination.
- Characters (examples, with patience in s at Medium): Grandma Rosa (90, slow: boards in 2 s), the Postman (60, visits several floors in a row), the Pizza Courier (25), Kids (40; the Prankster: presses every button inside), the Bellboy (60, a suitcase), a Doctor (30; with a bed: 6 places), Tourists (in groups that board together or not at all), Office workers (45), Shoppers (50, a cart), the Firefighter (ignores the queue in a drill).

### What the lift knows (sensors)

The program never reads a person; only these. Each opens at its chapter (the palette shows only opened blocks).

| Sensor block | Gives | Opens |
|---|---|---|
| `current floor` | the floor it is at or passing | 1 |
| `call on floor (f) [▲ / ▼ / any]?` | the hall call button lit | 2 |
| `button (f) pressed inside?` | the cabin call lit | 2 |
| `my direction` | up / down / stopped | 2 |
| `doors open?` | | 2 |
| `top floor`, `bottom floor` | the building's range (my served range in a zone) | 2 |
| `plan length`, `item (i) of plan`, `plan contains (f)?` | the lift's to-do list | 3 |
| `load %`, `full?` | weight sensor, 0–100 | 3 |
| `someone in the doorway?` | the door's light curtain | 4 |
| `waiting time on floor (f) [▲ / ▼]` | how long that call has been lit, s (0 if not) | 4 |
| `emergency call on floor (f)?` | the hospital's priority key | 4 |
| `clock` | time of day, minutes since midnight; `clock hour` | 5 |
| `my number`, `lifts in group` | 1…n | 5 |
| `floor of lift (n)`, `direction of lift (n)`, `plan length of lift (n)`, `load % of lift (n)` | the others in the group | 5 |
| `lift (n) working?` | out of service or not | 6 |
| `buttons pressed inside` | how many cabin calls are lit (anti-prank) | 6 |
| `tickets to (f)` | people who scanned a ticket at the entrance for floor f (Eiffel Tower) | 7 |
| `my zone lowest`, `my zone highest`, `can I stop at (f)?` | zoning | 8 |
| `waiting from (f) to (g)`, `deck` | destination dispatch kiosks; which deck of a double-deck car | 9 |
| `sunlight %`, `battery %` | the space elevator's power | 10 |

## The language (blocks)

### Shapes

Same visual grammar as the Scratch family, own drawing: **hat** (starts a script, rounded top), **stack** (a command, notch above and below), **C** (holds blocks inside: loops, if), **cap** (nothing goes under it: `forever`, `stop`), **reporter** (rounded, gives a number or a text), **boolean** (hexagon, gives yes / no). An input slot takes a typed value or a fitting reporter; a hexagonal slot only takes a boolean. Colours by category (own palette, high contrast, readable text): Lift — blue, Sensing — teal, Events — yellow, Control — orange, Operators — green, Variables — red-orange (lists darker), My Blocks — pink.

### Blocks and when they open

| Category | Blocks | Opens |
|---|---|---|
| Events | `when ▶ clicked` | 1 |
| Lift | `go to floor (n)` (waits until it has stopped there and the doors closed), `say (text)`, `say (text) for (s) seconds` | 1 |
| Control | `wait (s) seconds`, `repeat (n)`, `forever` | 1 |
| Control | `if <> then`, `if <> then / else`, `wait until <>`, `repeat until <>` | 2 |
| Operators | `( ) + ( )`, `−`, `×`, `÷`, `( ) < ( )`, `=`, `>`, `<> and <>`, `or`, `not <>`, `pick random ( ) to ( )` | 2 |
| Events | `when call button pressed (floor) (direction)`, `when button pressed inside (floor)`, `when I arrive at floor (floor)`, `when I'm idle`, `when doors close` | 3 |
| Lift | `add floor (n) to plan`, `put floor (n) first in plan`, `remove floor (n) from plan`, `clear plan` | 3 |
| Variables | `set [v] to ( )`, `change [v] by ( )`, `show variable [v]`, `hide variable [v]` (+ Make a variable) | 3 |
| Events | `when I'm about to pass floor (floor)` | 3 |
| Lift | `stop here` (only inside `about to pass`: the lift stops at that floor) | 3 |
| Lift | `set arrow to [up / down / none]`, `hold doors (s) seconds`, `close doors` | 4 |
| Events | `when emergency call (floor)` | 4 |
| Operators | `distance from ( ) to ( )` (absolute difference), `min`, `max` | 4 |
| Events | `every (s) seconds`, `when clock is (hh:mm)`, `broadcast [msg]`, `broadcast [msg] and wait`, `when I receive [msg]` | 5 |
| Variables | `for all lifts` / `for this lift only` when making a variable | 5 |
| Variables | lists: `add ( ) to [list]`, `delete (i) of [list]`, `delete all of [list]`, `insert ( ) at (i) of [list]`, `item (i) of [list]`, `item # of ( ) in [list]`, `length of [list]`, `[list] contains ( )?` | 6 |
| Control | `for each [i] from (a) to (b)`, `stop [this script / all]` | 6 |
| Operators | `( ) mod ( )`, `round ( )`, `join ( ) ( )` | 6 |
| My Blocks | `define (name) (inputs…)` and the custom block itself; inputs: number, boolean, text | 7 |
| Events | `when weather changes`, `when message from building [msg]` | 7 |
| Lift | `go express to floor (n)` (stops nowhere on the way) | 8 |
| Events / Sensing | `when destination entered (from) (to)`, the double-deck sensors | 9 |

Each hat with inputs (floor, direction…) carries them as small reporter blocks that can be dragged out of it and used inside its script, like the inputs of a custom block.

### How the program runs (the VM, `sim/vm.js`)

- A program is a set of scripts, each starting with a hat. Each lift of a group runs its own copy (its own threads and "for this lift only" variables; "for all lifts" variables are shared).
- Every step of the simulation: the world moves, then the events of this step are delivered (each starts a new **thread** of its hat's script, with its inputs), then every running thread runs until it **yields**. A thread yields at: `wait`, `wait until` (false), `go to floor` (until arrived and the doors closed), `broadcast and wait`, `say … for`, and at the end of each turn of a loop (as in Scratch, so `forever` never freezes the game).
- A thread doing more than `VM_STEPS_MAX` (2 000) blocks in one step without yielding is paused until the next step, and the editor shows "Your lift is thinking too hard here" on that block (a loop with nothing that waits).
- An event fires once per change: a call button pressed goes `off → on`, pressing a lit button again is nothing. A hat's own threads may run side by side (up to `THREADS_MAX` 32 per lift; more are dropped with a warning).
- `when I'm about to pass floor (f)` fires when a moving lift reaches the braking point of a floor that is not its target; `stop here` inside it puts that floor first in the plan (too late anywhere else: the block flashes "Too late to stop").
- `when I'm idle` fires when the lift becomes idle; `when doors close` before it starts moving, so the script can still change the plan.
- Mistakes never crash the run: a floor out of range, a list item that isn't there, a division by zero — the block gets a red outline with the reason in a bubble ("There is no floor 12 here"), the value used is 0 / nothing, the run goes on.
- The running blocks glow (each lift its own glow colour when several run one program; the followed lift's glow is the strong one).
- A run ends when the mission's day ends (the clock reaches its end) and nobody is still waiting or riding (at most `OVERTIME_MAX` 120 s more), or when the player stops it.

### Text view

**Text** shows the same program as JS-like text (`when.callPressed((floor, dir) => { plan.add(floor) })`), read-only, the running line highlighted. It is there for adults and as a bridge to "real" code. A Pro mode where the text can be edited is planned for later (see "Later").

## The block editor on a phone

Drag and drop of small blocks is hard with a finger, so the editor is **tap first**, drag as a bonus:

- **Adding**: tap a category chip → a bottom sheet with that category's blocks (big, real shapes, scrollable); tap a block → it is placed at the **insert point**: below the selected block, or at the end of the selected script, or as a new script when nothing is selected. The insert point is shown as a blinking white notch. Drag from the sheet works too (and is the main way with a mouse).
- **Selecting**: tap a block → it is outlined and a small toolbar appears above it: **Edit**, **Move**, **Copy**, **Wrap** (put it inside a new `if` / `repeat` / `forever`), **Delete**. Move: then tap where it should go (the possible places light up), or drag it. A block moves with everything below it, like in Scratch; a long press moves just this one.
- **Inputs**: tap a number slot → a big number pad (with − / + steppers and "use a sensor…" which opens the reporter blocks that fit); a dropdown slot → a short list; a hexagonal slot → the boolean blocks; a text slot → the keyboard.
- **Undo / redo** for every change (`EDITOR_UNDO_MAX` 100).
- Every block at least 40 px high, text 15 px; the whole scripts canvas pinch-zooms 0.6–1.6.
- Starting programs: a mission may come with blocks already placed (fill-the-gaps and fix-the-bug missions), some of them **locked** (a padlock, can't be moved or deleted).
- The program of each mission is saved as it changes; a new mission of the same building offers "Start from your last program" or "Start empty".
- The editor works the same during a run (changes apply at the next ▶).

## Hints and help

- **💡 Hint 1** (any time): the idea in words ("The lift only needs to come when someone calls. Which block can check a call?").
- **💡 Hint 2** (after one run that did not pass, or 3 minutes): the blocks needed light up in the palette, and a sketch of the solution's shape (the blocks as empty outlines).
- **💡 Hint 3** (after two runs that did not pass, asks first): the engineer's solution is shown and can be loaded. The mission can then still be passed, but gets at most ★★ (a small 💡 next to its stars) until ★★★ is earned with an own program: changing the loaded solution by at least a few blocks, or starting empty, counts as own (`OWN_PROGRAM_MIN_DIFF` blocks differ from the reference).
- **The Inspector** (`sim/inspector.js`, after each run): looks at the run's log and picks up to three notes from a list of patterns, each with "Show me": the longest wait and what the lift did meanwhile, a floor called many times and never served, a lift that went somewhere and came back empty, a full lift that stopped for a call, two lifts that went to the same call, a loop with no wait, a variable never read, the energy spent on empty trips. On Easy the note also names the block that would help.
- **Guided start**: the first three missions show a finger that points at what to tap (ScratchJr-like); it disappears as soon as the player does it.
- **Concept cards** of Grandpa Gears, kept in the Museum to read again.

## Missions

### Kinds

- **Build** — write a program for the task.
- **Fill the gaps** — a program with empty slots / missing blocks (early in each chapter).
- **Fix the bug** — a program that almost works; the briefing says what goes wrong ("Grandma has been waiting for an hour!").
- **Tiny program** — pass with at most N blocks (the counter turns red over it).
- **Beat the number** — an average wait, an energy or a gave-up count to beat.
- **Exam** — the last mission of a building: a busy day with everything of the chapter; passing it opens the next building.

### Stars

Every mission has three star conditions (`stars` in its data), the first one always passes the mission:

- ★ the goal (deliver everyone / at least N, nobody / at most N gave up, the story's goal);
- ★★ and ★★★ two of: average wait ≤ X, longest wait ≤ X, energy ≤ X, blocks ≤ N, nobody gave up, the story's extra.

Stars are kept per difficulty; the building's next mission opens when one is passed on any difficulty. Every mission also has the **Engineer's record** (the reference solution's numbers); beating it on the average wait or the energy gives a 🏅 for the mission.

### Buildings and missions

10 campaign buildings × 9 missions (the 9th is the exam) + 12 World Tour challenges = **102 missions**.

**1. Grandma's House** — 3–4 floors, one old lift (slow, 4 places). *Sequences, repeat, forever.*

| # | Name | Kind | What it is about |
|---|---|---|---|
| 1 | Hello, Lift! | Fill (guided) | Grandma on 3 wants to go down to 1: `go to floor 3`, `go to floor 1`. |
| 2 | Morning Bread | Build | Down to the bakery and back up after 20 s: `wait`. |
| 3 | The Postman | Build | He rides 1 → 2 → 3 → 1: a longer sequence. |
| 4 | Oops! | Fix | The floors are in the wrong order; the cat Biscuit misses the vet. |
| 5 | Talking Lift | Build | Say the floor at every stop: `say`. |
| 6 | Moving Day | Build | The grandson carries 5 boxes up: `repeat`. |
| 7 | The Forever Lift | Build | Neighbours come at any time: go up and down `forever`. |
| 8 | Tiny Lift | Tiny | Mission 7 in at most 4 blocks. |
| 9 | Grandma's Birthday | Exam | 12 guests arrive, some leave early; 4 floors. |

**2. Maple School** — 5 floors, one standard lift. *Conditions, sensing, comparisons.*

| # | Name | Kind | What it is about |
|---|---|---|---|
| 1 | Who's Calling? | Fill | `if <call on floor 3?>`: stop only where someone called. |
| 2 | The Patrol | Build | Check every floor in a loop, go where called. |
| 3 | Inside Buttons | Build | Take the kids where they pressed: `button pressed inside?`. |
| 4 | Don't Move for Nothing | Beat (energy) | `wait until` a call: no empty trips. |
| 5 | Wrong Way | Fix | A `<` that should be `>`: the lift skips the top floor. |
| 6 | The Bell Rings | Build | Break time: every floor calls at once. |
| 7 | Up First, Then Down | Build | Serve the ▲ calls going up, the ▼ ones going down (a first sweep). |
| 8 | Tiny Sweep | Tiny | Mission 7 in few blocks with `repeat until`. |
| 9 | Last Day of School | Exam | A long busy day with the bell three times. |

**3. Grand Sunrise Hotel** — 8 floors, one lift with a plan. *Events, the plan, variables, collective control.*

| # | Name | Kind | What it is about |
|---|---|---|---|
| 1 | Ring the Bell | Fill | `when call button pressed` → `add floor to plan`. The lift starts to serve itself. |
| 2 | Room Service | Build | Add the cabin calls too: a complete simple lift in two scripts. |
| 3 | Counting Guests | Build | A variable counts the stops; the concierge checks it at the end. |
| 4 | Suitcases | Build | Bellboys fill the lift: `full?` — don't stop for calls when full, come back for them later. |
| 5 | Lost Calls | Fix | Calls pressed while the lift stands there are forgotten. |
| 6 | On the Way | Build | `when I'm about to pass floor` + `stop here`: pick people up on the way (the big "aha"). |
| 7 | No Zig-Zag | Beat | Put a floor first or last in the plan by direction, so the lift doesn't go 1 → 8 → 2. |
| 8 | Night Porter | Beat | `when I'm idle` → wait in the lobby, where the guests come. |
| 9 | The Wedding | Exam | Guests, suitcases and the ballroom on 8. |

**4. St. Hope Hospital** — 10 floors, a big bed lift, later two lifts. *Boolean logic, priorities, fairness.*

| # | Name | Kind | What it is about |
|---|---|---|---|
| 1 | Code Blue | Build | `when emergency call` → that floor first, the doctors can't wait. |
| 2 | Bed on Board | Build | With a bed inside (`load % > 50`) go straight there, `and` / `not`. |
| 3 | Slow Steps | Build | Physiotherapy on 2: `someone in the doorway?`, `hold doors`. |
| 4 | Who Waited Longest? | Beat (longest wait) | `waiting time on floor`: serve the longest wait first. |
| 5 | Arrows Matter | Build | `set arrow`: people only get on going their way. |
| 6 | Emergency Bug | Fix | The emergency script fights the normal one. |
| 7 | Visiting Hours | Build | A wave of visitors up to the wards and back. |
| 8 | Tiny Hospital | Tiny | A whole hospital lift in few blocks. |
| 9 | Night Shift | Exam | Quiet nights with sudden emergencies; energy counts. |

**5. Glass Tower (offices)** — 16 floors, 2 then 3 lifts. *Several agents, messages, shared variables, the clock.*

| # | Name | Kind | What it is about |
|---|---|---|---|
| 1 | Two Is Better? | Build | Two lifts with the same simple program run to the same calls. |
| 2 | The Nearest One Goes | Build | `floor of lift (n)`, `distance`: the nearest lift takes the call. |
| 3 | Talk to Each Other | Build | `broadcast` / `when I receive`, a shared list of taken calls. |
| 4 | Morning Rush | Beat | Up-peak: everyone from the lobby; go back there when idle, leave when full or after a few seconds. |
| 5 | Lunch Time | Build | To and from the canteen on 8. |
| 6 | Evening Rush | Beat | Down-peak: wait high up after 17:00 (`clock`). |
| 7 | The Twins | Fix | Both lifts always move together. |
| 8 | Three Lifts | Build | The same program for three lifts with `my number`. |
| 9 | A Day at the Office | Exam | 07:00–19:00 compressed into 8 minutes. |

**6. Mega Mall** — floors −3 … 5 (car park below), 3 lifts. *Lists, for-each, negative numbers, robustness.*

| # | Name | Kind | What it is about |
|---|---|---|---|
| 1 | Underground | Build | Basements: floors −1, −2, −3. |
| 2 | My Own Plan | Build | A list variable as the lift's own to-do list. |
| 3 | Shopping Carts | Build | Carts take two places: count the room left. |
| 4 | The Prankster | Build | A boy presses every button: few people inside and many buttons → clear them (real anti-nuisance). |
| 5 | For Each Floor | Tiny | `for each` instead of ten `if`s. |
| 6 | Sale at Ten! | Build | `when clock is 10:00` a crowd heads for floor 4. |
| 7 | Lost in the Car Park | Fix | A bug with negative floors. |
| 8 | Out of Order | Build | One lift breaks (`lift (n) working?`), the others cover. |
| 9 | Black Friday | Exam | Everything at once. |

**7. Eiffel Tower, Paris** — ground, 1st, 2nd floor and the top; lifts in the pillars up to the 2nd floor, a second bank from the 2nd floor to the top. *Own blocks with inputs, transfers, events from outside.*

| # | Name | Kind | What it is about |
|---|---|---|---|
| 1 | Bonjour, Paris! | Build | Long trips, few stops: how long to wait for more people? |
| 2 | Change at the Second | Build | Two banks: visitors to the top change lifts. |
| 3 | My First Block | Build | `define serve calls`: one block used by both banks. |
| 4 | Tickets, Please | Build | `tickets to (f)`: the scanners say how many go where. |
| 5 | Wind at the Top | Build | `when weather changes`: the top closes, the visitors come down. |
| 6 | Blocks With Inputs | Tiny | A custom block with a floor input. |
| 7 | The Sightseer Loop | Fix | A custom block that calls itself forever. |
| 8 | Engineer's Challenge | Beat | Beat the engineer's average wait. |
| 9 | Bastille Day | Exam | The evening crowd before the fireworks of 14 July. |

**8. Empire State Building, New York** — 102 floors, banks of lifts by zones, an express to the observatory on 86, then 102. *Zoning, express, sorting, SCAN.*

| # | Name | Kind | What it is about |
|---|---|---|---|
| 1 | Too Many Floors | Build | One lift for 30 floors: why it can't keep up. |
| 2 | Zones | Build | Three lifts, each for the lobby and its own range of floors. |
| 3 | Express to 80 | Build | `go express`: no stops on the way. |
| 4 | Sort the Plan | Build | Insert each floor at its place in the list (sorting). |
| 5 | SCAN | Beat | The classic lift algorithm: up serving everything, then down. |
| 6 | Observatory | Build | Tourists to 86, some change for 102. |
| 7 | Overlapping Zones | Fix | Two zones fight for the same floors. |
| 8 | Engineer's Challenge | Beat | Beat the engineer. |
| 9 | New Year's Eve | Exam | Offices and tourists, a busy evening. |

**9. Burj Khalifa, Dubai** — 160 floors with sky lobbies, double-deck lifts, destination kiosks. *Double-deck, destination dispatch, energy.*

| # | Name | Kind | What it is about |
|---|---|---|---|
| 1 | Two Floors at Once | Build | A double-deck car: the lower deck at odd floors, the upper at even (`mod`). |
| 2 | Kiosks in the Lobby | Build | `when destination entered`: group people going to the same floors. |
| 3 | Sky Lobby | Build | Express to the sky lobby, locals from there. |
| 4 | Energy Saver | Beat (energy) | Regenerative braking: plan full trips down. |
| 5 | Desert Noon | Build | Midday rush, nobody takes the stairs in the heat (patience low). |
| 6 | Deck Mix-Up | Fix | The decks stop at the wrong floors. |
| 7 | At the Top | Build | Visitors to the observation decks. |
| 8 | Engineer's Challenge | Beat | Beat the engineer. |
| 9 | New Year Fireworks | Exam | The famous New Year's evening at the tower. |

**10. Skyhook, the space elevator** (fantasy finale) — the ground station, Cloud Station, Stratosphere, Low Orbit, Geostation; climbers on one ribbon. *Everything together + several cabins on one track.*

| # | Name | Kind | What it is about |
|---|---|---|---|
| 1 | Lift-off | Build | Very long trips: when is it worth going? |
| 2 | Day and Night | Build | `sunlight %`, `battery %`: run on solar power. |
| 3 | One Ribbon, Two Climbers | Build | Two cabins on one track can't pass each other. |
| 4 | Meteor Shower | Build | A section closes for a while (`when message from building`). |
| 5 | Cargo or People | Beat | Cargo pods and passengers share the climbers. |
| 6 | The Stuck Climber | Fix | A climber waits forever for the other one. |
| 7 | Tiny Space Program | Tiny | |
| 8 | Engineer's Challenge | Beat | |
| 9 | Grand Opening | Exam | The finale; the credits and Lifty's certificate. |

**World Tour** (12 challenges, opened by the total of stars, 2 at a time: 40, 70, 100, 130, 160, 190 ★; each one building, one twist, three stars):

| Building | Twist |
|---|---|
| CN Tower, Toronto | Fast glass lifts to the observation deck; very few stops, a very long shaft. |
| Gateway Arch, St. Louis | Small egg-shaped pods in a train of eight that climb the curved legs: all pods go together. |
| The Shard, London | Offices, a hotel and flats in one tower: three kinds of people, three rush hours. |
| Kaknästornet, Stockholm | One tower, a restaurant at the top, tourists. |
| Turning Torso, Malmö | Nine blocks of five floors each; flats only, quiet days and rush hours. |
| Globen SkyView, Stockholm | A gondola outside on the dome: two cabins, one curved track. |
| A paternoster, Prague | Open cabins that never stop: the program can only decide the speed. |
| Taipei 101 | The race of the fastest lifts. |
| Shanghai Tower | Express shuttles and a speed record. |
| Tokyo Skytree | Two observation decks, huge queues. |
| Petronas Towers, Kuala Lumpur | Two towers, a bridge on 41–42: transfers between towers. |
| Lifty's Own Tower | Build every rule you know into one program. |

Every real building is simplified for the game (floor count, number of lifts, speeds), and its card in the Museum says what is real. **Facts in the Museum cards must be checked against sources before they ship** (heights, lift speeds, years, record holders); the list in `data/facts.js` carries a `source` for each.

### Other modes

- **Endless** (opens per building with its exam): the traffic grows every minute; the run ends when 10 people have given up; the score is the number delivered; best per building and difficulty.
- **Daily challenge** (opens after Glass Tower): a building, a traffic pattern and a twist chosen from the date (the same for everyone on that day); best result of the day kept; a streak counter of days in a row.
- **Sandbox** (opens after Grand Sunrise Hotel): see the setup screen; no stars, stats only.

## Sharing

**Share program** packs the program (JSON → compressed → base64url) into a short text code, with the mission or sandbox it belongs to; the system share sheet on a phone, the clipboard elsewhere. **Paste program** reads such a code, shows the program as a picture first, then loads it into the current mission (as a new version; undo brings the old one back). No server is needed in the first version (online features: see "Later").

## Meta and rewards

- **Stars** open the World Tour and the Wardrobe items; the exam of a building opens the next one.
- **Achievements** (≈ 30): Nobody Gave Up (a busy exam with 0), Featherweight (≤ 5 blocks on a Build), Bug Hunter (all Fix missions), Engineer (beat 10 records), Night Owl (a mission between 22:00 and 06:00 of real time — just for fun), Prankster Tamer, Zero Empty Trips, Speed Demon (×16 whole day), Museum Curator (all cards)…
- **Museum cards**: one per mission's first pass (≈ 100), a few per achievement.
- **Wardrobe**: cabin skins, display faces, chimes, waiting music.
- No ads, no shop, no currency to buy.

## How long it lasts

- Grandma's House and the School: 5–10 min a mission (≈ 3 h for both, the first stars).
- Hotel, Hospital, Office: 10–15 min a mission, more for ★★★ (≈ 6 h).
- Mall, Eiffel Tower, Empire State: 15–20 min (≈ 6 h).
- Burj Khalifa, Skyhook: 20–25 min (≈ 4 h).
- World Tour: 15–30 min each (≈ 4 h).

A first pass is therefore ≈ 20–23 h for a ten-year-old with some ★★★ hunting; all ★★★ and the engineer's medals, Endless and the daily challenge go well beyond. The checker (see "Balancing") measures the reference solution's block count per mission to keep the curve smooth: the solution of an exam is never more than about twice the size of the one before.

## Difficulty

| | Easy (default) | Medium | Hard |
|---|---|---|---|
| Patience | × 1.5 | × 1 | × 0.7 |
| Star limits (wait; energy only looser) | × 1.25 looser | × 1 | × 0.9 stricter (waits) |
| Passengers in flows | × 0.8 | × 1 | × 1.2 |
| Hint 2 / Hint 3 | after 1 / 2 runs that did not pass | after 2 / 3 | after 3 / 4 |
| Inspector | names the block that helps | the idea | the moment only |

Picked on the start screen, in the pause menu and on the results screen (pre-selected); remembered as `liftLogic.difficulty`. The block limits of Tiny missions don't change with it.

## Balancing (`tools/missions-check.js`)

Every mission has a reference solution in `data/solutions/` (also used by Hint 3 and the Engineer's record). The checker loads the `sim/` files in Node, runs every solution on its mission at every difficulty and reports: passes or not, the stars it gets, its numbers, how close each star limit is. It fails when a reference doesn't get ★★★ on Medium, or when a "naïve" program (the previous chapter's exam solution, where it applies) already gets ★★★ — so each mission really needs its new idea. Star limits are written in the mission data, not computed at run time; the tool prints proposed ones (★★★ ≈ the reference × 1.1, ★★ ≈ × 1.4).

## Controls

- **Touch:** everything is tap (see "The block editor on a phone"); one-finger drag scrolls the scripts and the building, two fingers pinch-zoom. Start / Continue / Run request fullscreen on coarse-pointer devices (`requestFullscreen`, try/catch). There is no joystick: this is not an action game.
- **Desktop:** drag and drop from the palette, right click on a block = its toolbar; keys: **Space** run / stop, **P** pause, **S** step, **1–4** the speed, **Ctrl+Z / Ctrl+Y** undo / redo, **Delete** deletes the selected block, **Ctrl+C / Ctrl+V** copy / paste blocks, **E** Lift's eyes, **Esc** back / pause. Keys go by their place, so a Russian layout works too; keys are ignored while typing in a slot.
- Menus: arrow keys move the focus, Space / Enter press the focused button (the default when nothing is focused), Esc goes back.
- Mouse cursor: hidden in fullscreen while still (`core/cursor.js`). Updates: a new deploy reloads only on the start screen, the buildings map and the building screen (`core/update.js`).

## Saved in the browser

`liftLogic.progress.v1` (stars per mission per difficulty, hint 3 used, medals, achievements, museum cards, the wardrobe), `liftLogic.programs.v1` (each mission's last program, up to 5 named versions per mission, the sandbox programs), `liftLogic.records.v1` (Endless, daily, sandbox bests), `liftLogic.settings.v1` (difficulty, speed, wardrobe choice, split position), `liftLogic.sound`, `liftLogic.music`, `liftLogic.lang`, `liftLogic.difficulty`. A run itself is not saved. A program larger than `PROGRAM_MAX_BLOCKS` (400) is refused with a message.

## Languages

English (default), Russian and Swedish like `wiggle-wars`: `tr()` (`core/i18n.js`), `data/lang-ru.js` / `data/lang-sv.js`. Block texts are templates with slots (`"go to floor %1"`) translated as a whole, so the slot can move in another language's word order. Texts through a variable: block templates (`data/blocks.js`), mission texts (`data/missions/*.js`), characters' names and lines (`data/people.js`), Museum cards (`data/facts.js`), concept cards, Inspector notes (`data/inspector.js`), the comic lines and headlines (`data/jokes.js`). Characters' names stay the same in every language. The Text view uses English keywords in every language (it is code).

## Sound

Synthesized with Web Audio (`core/audio.js`, played only by `ui/sounds.js`): the arrival chime (once going up, twice going down — as real lifts do), the doors, a soft motor hum while moving (pitch by speed), a button's click, the "+1" of an arrival, a grumble when someone gives up, the overload buzzer, the run start and stop, star clinks on the results, fanfare on a pass, fireworks after an exam, the UI taps of the editor (block placed, block deleted, error). **Music** (on by default — the game should feel lively): lift muzak, a few short procedural loops (bossa nova, lounge, chiptune, a calmer one for the editor) chosen in the Wardrobe; the calm loop plays softly while editing, a livelier one during the run, speeding up a little in a rush hour and when someone is about to give up, a short jingle on a pass. Sound On / Off (master gain) and Music On / Off on the start screen and in the pause menu (`liftLogic.sound`, `liftLogic.music`). At ×4 and faster only the chimes and the results sounds play.

## Cheats (keyboard only, Shift + digit, for testing)

Each shows a banner and marks the run as cheated (no stars, records or achievements saved):

- `Shift+1` — the current mission passes with ★★★ (marked cheated; it opens the next one, nothing else)
- `Shift+2` — the reference solution is loaded
- `Shift+3` — every block in the palette
- `Shift+4` — speed ×100
- `Shift+5` — everyone waiting gets on (and off) by magic: a check of the rest of the day
- `Shift+6` — a prankster / a wave of 10 people appears on a random floor
- `Shift+7` — everyone's patience is endless
- `Shift+8` — the VM debug overlay (threads, their blocks, the events of the step)
- `Shift+9` — every building and mission opens (saved)
- `Shift+0` — the run fails at once (to see the failed results)

## Testing recipes

- **Headless:** load `constants.js`, `data/blocks.js`, `lifts.js`, `people.js`, `buildings.js`, `data/missions/missions.js`, `data/missions/*.js`, `data/solutions/*.js`, `core/utils.js`, `core/events.js` and every `sim/` file into a `vm` context; `simulate('3-6', Prog.parse(SOLUTIONS['3-6']), 'medium')` gives `{ run, stats, judged }` (or `Run.start(mission, program, difficulty)` and `Run.step()` in a loop until `run.over`, then `Stars.judge(run)`). A whole mission takes well under a second. `node lift-logic/tools/missions-check.js [ids] [--verbose]` does this for every mission and difficulty; run it after changing a mission, a solution or the sim.
- **Texts:** `node lift-logic/tools/texts-check.js` lists every text the player sees (also those from data/ and index.html, which `tools/i18n-check.js` can't see) missing in `lang-ru.js` / `lang-sv.js`, translations that lost a `{param}` or a `%1` slot, and keys no longer used; `--json` prints them all.
- **In the browser** (`tools/cdp.js`): `localStorage.clear(); Progress.load(); I18N.set('en')`, `Screens.openBrief(MISSION['3-6'])`, `document.getElementById('briefStart').click()`, `Editor.load(Prog.parse(SOLUTIONS['3-6']), MISSION['3-6'])`, `Runner.go()`, `Runner.cycleSpeed(16)`, `Runner.skip()`; `Progress.openAll()` opens everything.

## Files

```
lift-logic/
├── SPEC.md
├── index.html          markup only, versioned <link>/<script> tags
├── styles.css
├── constants.js        tuning: sim step, doors, boarding, energy, patience, VM limits, editor sizes, difficulty table
├── game.js             main loop and the flow (start, buildings, mission card, editor, run, results, pause, cheats)
├── progress.js         stars, medals, achievements, museum cards, wardrobe, unlocks
├── data/
│   ├── blocks.js       every block: category, shape, template, slots, the chapter that opens it, the text view
│   ├── buildings.js    the buildings: floors, groups of lifts, interiors, client, colours
│   ├── lifts.js        lift types: speed, acceleration, capacity, look
│   ├── people.js       characters: names, looks, patience, places taken, lines
│   ├── missions/       missions.js (the list, addMissions) and one file per building (grandma.js, school.js, hotel.js, …, tour.js): briefing, schedule, stars, hints, starting program, new blocks
│   ├── solutions/      the reference solution of every mission (one file per building), in the text notation
│   ├── jokes.js        the comic lines of the results and the newspaper's headlines, by trait, moment and building
│   ├── facts.js        Lift Museum cards and Grandpa Gears' concept cards, with sources
│   ├── wardrobe.js, achievements.js   (later)
│   ├── icons.js        (tools/icons-build.js)
│   └── lang-ru.js, lang-sv.js
├── core/
│   ├── i18n.js, utils.js (seeded random, math), events.js (bus), storage.js
│   ├── audio.js        Web Audio engine, sound recipes, the muzak loops
│   ├── share.js        program ⇄ share code (later)
│   ├── cursor.js, icons.js, update.js
├── sim/                no drawing, no DOM, no sound — runs in Node
│   ├── state.js        the run's shared state
│   ├── building.js     floors, hall calls, groups, zones
│   ├── lift.js         motion, braking points, doors, plan, arrow, energy
│   ├── people.js       schedule and flows, boarding, moods, giving up
│   ├── sensors.js      what a lift can read
│   ├── program.js      the program's structure: blocks tree, count, clone, diff, the text notation (parse), the Text view
│   ├── vm.js           threads, events, scheduler, executing each block
│   ├── run.js          a run: start, step, fast-forward, replay to a time
│   ├── stats.js        the numbers of a run and the stars
│   └── inspector.js    the notes after a run (patterns and texts)
├── art/
│   ├── interiors.js    each building's floors
│   ├── people.js       the figures, faces, moods
│   ├── cabins.js       cabins and skins
│   ├── buildings.js    silhouettes for the map and the cards
│   └── flag-gb.svg, flag-ru.svg, flag-se.svg
├── render/
│   ├── view.js         camera, scroll, zoom, follow
│   ├── building.js     floors, landings, shafts, cabins, plan flags, monitors, Lift's eyes
│   └── minimap.js      (later)
├── ui/
│   ├── screens.js      start, buildings map, building screen, mission card, results, pause
│   ├── editor.js       the scripts canvas: select, move, wrap, undo, insert point
│   ├── blockview.js    drawing a block (DOM + SVG shapes) from its definition
│   ├── palette.js      categories, the bottom sheet, drag from it
│   ├── slots.js        number pad, dropdowns, text input
│   ├── runbar.js       run, stop, step, speed, skip, the split; Runner drives the run, Show me
│   ├── hud.js          the chips over the building, the star targets, banners
│   ├── hints.js        hints 1–3, the guided finger (Guide)
│   ├── results.js      stars, chart, inspector notes, record
│   ├── jokes.js        picks a run's comic lines; the building's newspaper
│   ├── textview.js     the program as text
│   ├── museum.js       the Lift Museum (wardrobe.js, achievements.js, sandbox.js later)
│   ├── sounds.js       game events → sounds
│   └── fireworks.js
├── tools/
│   ├── missions-check.js   runs every reference solution, checks the stars, proposes limits
│   └── texts-check.js      every text the player sees, checked against lang-ru / lang-sv
├── README.md / README_RU.md / README_SV.md
├── icon.svg / icon-maskable.svg
├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
├── manifest.webmanifest
└── screenshot.png
```

Prefix for storage and events: `liftLogic.`; manifest `short_name`: "Lift Logic".

## Build order (sessions)

1. ✓ **Core loop:** `sim/` (building, lift, people, plan, sensors) + `vm.js` with the chapter 1–3 blocks, headless; the checker with the first 9 missions and their solutions.
2. ✓ **Editor on a phone:** blocks drawn, palette sheet, select / move / wrap / delete, slots, undo, the text view; the building view with the HUD and the run bar.
3. ✓ **Chapters 1–3 playable end to end:** mission card, hints, results with the Inspector, progress, the first Museum cards, sounds, the guided start. Play-test with a ten-year-old here before going on.
4. Chapters 4–6 (priorities, several lifts, lists), the Lift's eyes, the minimap.
5. Chapters 7–8 (own blocks, zones, express, tall buildings).
6. Chapters 9–10, World Tour, Endless, Daily, Sandbox, sharing, Wardrobe, achievements.
7. ✓ Translations, icons, README ×3, screenshot, gallery card, root SPEC / READMEs (done with session 3, kept up to date with every later one).

## Decisions

- **Name:** Lift Logic, folder `lift-logic`.
- **Real buildings:** international — Paris, New York, Dubai in the campaign; the World Tour across North America, Europe and Asia (two Swedish buildings for the Swedish players). Facts are checked before they ship.
- **Hint 3** caps a mission at ★★ until ★★★ is earned with an own program.
- **Floor 1 is the ground floor;** basements are −1, −2…
- **Music** is on by default; the results are lively, with comic lines and the building's newspaper.
- **Pro mode, cloud save, online leaderboards:** later, see "Later".

## Later

- **Pro mode:** edit the Text view as real JavaScript (run sandboxed, with the same sensors and commands), for adults.
- **Cloud save of the progress** with a Google sign-in, like `world-aviation`: Supabase Auth (PKCE) + Postgres on the shared project, `lib/supabase.min.js` vendored, a table `liftlogic_progress` (a row per account: progress, programs, records) with row-level security and policies prefixed `liftlogic_`, its schema in `supabase/schema.sql`; the session kept under `liftLogic.auth.<user id>`; without signing in nothing changes and no network call is made.
- **Online leaderboards** of the Engineer's challenges, Endless and the daily challenge, on the same project (`liftlogic_scores`).
