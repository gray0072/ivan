# Code organised into folders by meaning

Part of the repo's rules, kept out of `AGENTS.md` because not every session needs it. **Read it in full before creating, moving or splitting files, adding a module, or creating a game**; `AGENTS.md` only sums it up.

- **Code is organised into folders by meaning.** Once a project has more than a handful of JS files, the project root keeps only the entry points — `index.html`, `styles.css`, `constants.js`, the main loop (`game.js` / `app.js`) and at most a top-level state module (e.g. a career or progress file) — plus the docs, icons, manifest and screenshot, which always stay in the root. Everything else goes into subfolders named after their role (`world-aviation/` is the reference layout):
  - `lib/` — vendored third-party libraries (e.g. `three.min.js`), never edited by hand;
  - `core/` — shared plumbing with no game rules: the Icons engine (see [icons.md](icons.md)), math/utils, input, the audio engine and sound recipes, storage, speech, the event bus between the logic and the presentation;
  - `data/` — static content as plain declarations, no logic: levels, maps, airports, item and character lists, texts, quizzes and their translations, geographic shapes;
  - `art/` — procedural drawings used by the renderer and the screens (sprites, flags, emblems, silhouettes);
  - `sim/` (or `logic/`) — game rules and simulation, one file per kind of thing: the shared state, the world, physics, spawning, each kind of creature or system, the player, saved records/progress — no drawing, no DOM, no sound;
  - `render/` — drawing the world (Canvas 2D / WebGL scene, models);
  - `ui/` — what sits on top: HUD, instruments, overlays and the screens (menus, briefings, results, pause, dialogs), and the sounds (game events turned into sounds, in one file);
  - feature folders when they fit the game better, with one file per kind of thing (`fun-training/`: `tasks/`, `scenes/`, `characters/`, `items/wear/<slot>.js`).

  Rules that go with it:
  - **Data is separate from code.** Big tables and content lists live in `data/` (tuning numbers still go to `constants.js`), so adding an airport, a level or a quiz question never means touching logic.
  - **Every screen and every self-contained feature gets its own file** once it grows beyond a few dozen lines; one file, one concern. Split a file that passes about 1 000 lines.
  - **Logic doesn't draw, play sounds or show messages.** `sim/` and the state modules only change state; `render/` and `ui/` read it and draw it, so the logic can run headless (e.g. in Node for long tests).
  - **Logic reports what happened as game events.** Whatever should be heard or announced — a hit, a meal, a splash, a stage-up, a game over — the logic emits as a named event with its data through a tiny event bus in `core/` (`on` / `emit`). A single sounds file in `ui/` subscribes and plays the sounds (deciding volume, distance falloff and which events are heard at all); the main loop and the screens subscribe for messages and banners. With nothing subscribed the logic runs silent, so headless runs simply leave the sounds file out.
  - **Shared state lives in one place.** The state the logic files share — the player, the entity lists, the run's flags, the difficulty, the screen size — is declared once in a state file in `sim/` as plain globals; the other files read and change it there instead of passing it around or keeping their own copies.
  - **The main loop stays thin.** The main file creates the renderer, wires the buttons and keys to the flow (start, pause, resume, game over, cheats), and each frame reads the controls and calls the `sim/` updates in a fixed order, then renders; the rules themselves live in `sim/`, the screens in `ui/`.
  - **Every file starts with a short header comment** saying what it is and what it is used by.
  - **Plain scripts, not ES modules,** so the game still opens from `file://`: each file defines its globals, and `index.html` loads them in dependency order — `lib/`, `constants.js`, `data/`, `core/`, `sim/`, `art/`, `render/`, `ui/`, the main loop last.
  - When files move, update the file tree in the game's `SPEC.md`, the root `SPEC.md` and the READMEs in the same change.
