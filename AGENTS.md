# AGENTS.md

Instructions for AI coding agents working in this repository.

## What this repo is

A gallery of small, self-contained browser games and experiments, deployed as a static site to GitHub Pages. There is no build tool, no package manager, and no framework — every project is a folder with an `index.html`, its own CSS/JS files, an icon, a screenshot and three READMEs (English, Russian, Swedish). See the root `SPEC.md` for repo-wide conventions and each project's own `<name>/SPEC.md` for that game.

## Ground rules

- **Every game has its own spec, and the spec comes first.** Each project folder contains a `SPEC.md` describing that game (idea, screens, rules, controls incl. touch, difficulty levels, cheats, files) — it is the source of truth for the game. Game-specific details never go into the root `SPEC.md`, which only lists the projects with a one-line summary and a link. When creating a new game, write its `SPEC.md` first and agree on it with the user, then implement the game. When changing a game, update its `SPEC.md` in the same change.
- **English is the primary language.** All in-game text (titles, HUD labels, instructions, buttons, messages) and code comments must be written in English. `README.md` is English; `README_RU.md` (Russian) and `README_SV.md` (Swedish) are translations for players. A game may also be playable in Russian and Swedish (`world-aviation` is): the language is picked on the start screen and remembered, English stays the default and the source text in the code — every text goes through `tr('English text', { params })` (`core/i18n.js`), and the translations live in `data/lang-ru.js` / `data/lang-sv.js`, keyed by the English text, with a matching entry for every key. Local-language text is allowed for authenticity (place names, signs, greetings, scenery such as a "Välkommen" banner at a Swedish airport), as long as the main text is in English or the local text is shown next to its English version.
- **Translations are maintained, never left behind.** In a translated game (one with `data/lang-*.js`, like `world-aviation`), every change that adds or rewords a text the player sees — a message, a warning, a prompt, a label, a button, a screen — adds or updates its entry in every language table in the same change; a text that shows up in English in a translated game is a bug. Drop entries whose key is no longer in the code. Before committing run `node tools/i18n-check.js <folder>`: it lists every literal `tr('…')` text missing from a table and every key that is in one table but not in the other. Texts passed to `tr()` through a variable (titles from `data/` tables) it cannot see — check those by hand. The same goes for the docs: a change described in `README.md` is described in `README_RU.md` and `README_SV.md` too.
- **No build step.** Don't introduce a bundler, framework, or `package.json` unless the user explicitly asks for one for a specific new project. Everything must keep working by opening `index.html` directly or serving the folder as static files.
- **Self-contained projects.** Each project folder should not depend on files outside itself (aside from the shared conventions below). It must work if copied out of the repo on its own.
- **Relative links only.** Every link (gallery card → project, project → screenshot, README image, etc.) must use a relative path, since the site is served from a subpath (`https://gray0072.github.io/ivan/`), not the domain root.
- **Mobile adaptation is required.** Every project must work on a phone/tablet, not just desktop with mouse/keyboard:
  - The canvas/layout must be responsive (resize to `window.innerWidth`/`innerHeight`, no fixed pixel dimensions) and devicePixelRatio-aware so it stays sharp.
  - **Fullscreen on phones.** On touch devices (`matchMedia('(pointer: coarse)')`) the "Start" button handler must call `requestFullscreen` (with `webkitRequestFullscreen` fallback, `{ navigationUI: 'hide' }`), wrapped in try/catch — iPhone Safari doesn't support it, so the game must still work windowed. Use `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`, the `mobile-web-app-capable` / `apple-mobile-web-app-capable` metas, respect safe-area insets for HUD, and block page scroll/zoom gestures on the canvas (`touch-action: none`, `preventDefault` on `touchstart`/`touchmove`).
  - **Minecraft-style touch controls, when the game allows it.** Split the screen in two halves:
    - **Left half = direction.** A floating joystick: it appears where the finger touches down and its offset from that point sets the direction/steering (replaces arrow keys / WASD).
    - **Right half = actions.** A plain tap or hold anywhere in the right half performs the main action (fire, boost, jump…). If there are extra actions, add a few large on-screen buttons in the upper part of the right half (e.g. a second weapon, pause).
    - Use multi-touch (track each `Touch.identifier`), so steering and actions work at the same time. Show the controls only on touch devices; keep keyboard/mouse fully working on desktop.
    - Device tilt (`deviceorientation`) may be offered only as an optional extra, never as the only way to steer (on iOS it needs `DeviceOrientationEvent.requestPermission()` from a user gesture). `fish-frenzy/core/input.js` is the reference implementation of the split-screen scheme.
  - **The mouse cursor hides in fullscreen.** In fullscreen (the Fullscreen API, an installed app with `display: fullscreen`, or the browser's own F11 fullscreen) the cursor hides once the mouse has been still for `CURSOR_HIDE_MS` (3 s, in `constants.js`) and shows again as soon as the mouse moves, clicks or scrolls: `core/cursor.js` toggles an `html.cursor-hidden` class (`cursor: none !important` on everything, in `styles.css`) and counts a `mousemove` only when the position really changed, since browsers send one when the page changes under a still cursor. `world-aviation/core/cursor.js` is the reference; copy it into every new game.
  - Mention the touch controls in all three READMEs (`README.md`, `README_RU.md`, `README_SV.md`) for the project, and in its in-game instructions.
- **Every project has an icon.** Each project folder contains an `icon.svg` (square 512×512 viewBox, rounded-tile style with `rx="112"`, readable at 16–32 px, matching the game's theme). It is used as the page favicon (`<link rel="icon" type="image/svg+xml" href="icon.svg?v=N">`), next to the title in both project READMEs, on the project's card in the root gallery, and in the root README game table. The repo-level icon and social preview live in `assets/`.
- **Every app is an installable PWA with a crisp Android icon.** Whatever gets deployed to GitHub Pages — every project and the root gallery itself — must be installable to a phone's home screen:
  - `manifest.webmanifest` in the folder (root gallery: at the repo root) with `name`, `short_name` (≤ 12 chars, fits under the launcher icon), `description`, `id` / `start_url` / `scope` = `"./"`, `display` (`fullscreen` for games, `standalone` for the gallery), `theme_color` / `background_color` matching the page background, and three icons: `icon-192.png` + `icon-512.png` (`"purpose": "any"`) and `icon-maskable-512.png` (`"purpose": "maskable"`), all with `?v=N`.
  - `<head>` links next to the favicon: `<link rel="manifest" href="manifest.webmanifest?v=N">`, `<link rel="apple-touch-icon" href="apple-touch-icon.png?v=N">`, `<meta name="theme-color" content="…">`.
  - **The Android icon is drawn for Android, not just the favicon reused.** Next to `icon.svg` keep an `icon-maskable.svg`: the same artwork as a full-bleed square (no `rx`, no clip — the launcher applies its own circle/squircle mask) with everything that matters inside the central circle of radius ≈ 170 of the 512 viewBox (the launcher shows only about the middle two thirds). Bold shapes and strong contrast between the subject and the background — dark details (tracks, barrels, outlines) never sit on a dark background — so the icon stays clear at 48 px.
  - The PNGs are rendered from the SVGs, never drawn by hand: `bash tools/pwa-icons.sh <folder>` (`.` = the root gallery, writes into `assets/`) produces `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` and `apple-touch-icon.png` (180 px, from the maskable SVG) with headless Chrome. Re-run it and bump the `?v=N` in the manifest and `<head>` whenever an icon SVG changes. Before committing, look at the maskable PNG cropped to a circle of two thirds of its size to make sure nothing is cut off.
- **Three difficulty levels.** Every game offers exactly three difficulty levels — **Easy**, **Medium**, **Hard** — selectable on the start screen **and** in every restart / game-over / "Play Again" dialog (pre-selected to the current level, so restarting on the same level is one click/keypress). The choice is remembered in `localStorage` between visits. Describe what each level changes in the project's READMEs.
- **Debug cheats.** Every game has simple, easy-to-understand cheats for testing, e.g. digit keys jumping straight to a level / stage / size (`fish-frenzy`: 1–5 = each stage, 6–9 = bigger, 0 = max size). Each cheat shows a short on-screen banner saying what it did. Once any cheat is used in a run, that run is marked as cheated and never updates best times / high scores / records in `localStorage`. Cheats are keyboard-only, aren't mentioned in the in-game instructions and must not trigger by accident during normal play.
- **Screenshots are in English.** Every `screenshot.png` (and any other preview image) must show the English UI — it's used by all three READMEs, including the Russian and Swedish ones.
- **Start/restart buttons must work everywhere.** Any overlay button (e.g. "Start", "Play Again") must stay tappable on Android/iOS (plain `<button>` elements already are — don't intercept touch events on top of them) and must also be triggerable by **Space** or **Enter** on desktop, via a global `keydown` listener that clicks whichever button is currently visible in the overlay.
- **JS and CSS live in separate files — always.** Never inline `<script>`/`<style>` blocks or `style=`/`onclick=` attributes in a project's `index.html` — put CSS in a `styles.css` and JS in one or more `.js` files (split JS into multiple files by concern/module when it grows large enough to benefit from it; `index.html` just references them). This still satisfies "no build step" and "self-contained" — the extra files live in the same project folder and are plain `<link>`/`<script src>` references, no bundler involved.
- **Game constants live in their own file.** Every gameplay tuning value — sizes, speeds, counts, timings, probabilities, hit shapes, difficulty tables, stage lists — goes into `constants.js` in the project folder, as top-level `const`s with a short comment on units or meaning. It is loaded via `<script src>` before the files that use it; game logic files must not declare their own gameplay constants (purely visual constants of an art/render module, like colour palettes or decoration cell sizes, may stay in that module). Runtime state (arrays of entities, the player object, scores) stays in the logic files.
- **Code is organised into folders by meaning.** Once a project has more than a handful of JS files, the project root keeps only the entry points — `index.html`, `styles.css`, `constants.js`, the main loop (`game.js` / `app.js`) and at most a top-level state module (e.g. a career or progress file) — plus the docs, icons, manifest and screenshot, which always stay in the root. Everything else goes into subfolders named after their role (`world-aviation/` is the reference layout):
  - `lib/` — vendored third-party libraries (e.g. `three.min.js`), never edited by hand;
  - `core/` — shared plumbing with no game rules: math/utils, input, audio, storage, speech;
  - `data/` — static content as plain declarations, no logic: levels, maps, airports, item and character lists, texts, quizzes and their translations, geographic shapes;
  - `art/` — procedural drawings used by the renderer and the screens (sprites, flags, emblems, silhouettes);
  - `sim/` (or `logic/`) — game rules and simulation: the world, physics, systems, enemies — no drawing, no DOM;
  - `render/` — drawing the world (Canvas 2D / WebGL scene, models);
  - `ui/` — what sits on top: HUD, instruments, overlays and the screens (menus, briefings, results, pause, dialogs);
  - feature folders when they fit the game better, with one file per kind of thing (`fun-training/`: `tasks/`, `scenes/`, `characters/`, `items/wear/<slot>.js`).

  Rules that go with it:
  - **Data is separate from code.** Big tables and content lists live in `data/` (tuning numbers still go to `constants.js`), so adding an airport, a level or a quiz question never means touching logic.
  - **Every screen and every self-contained feature gets its own file** once it grows beyond a few dozen lines; one file, one concern. Split a file that passes about 1 000 lines.
  - **Logic doesn't draw.** `sim/` and the state modules only change state; `render/` and `ui/` read it and draw it, so the logic can run headless (e.g. in Node for long tests).
  - **Every file starts with a short header comment** saying what it is and what it is used by.
  - **Plain scripts, not ES modules,** so the game still opens from `file://`: each file defines its globals, and `index.html` loads them in dependency order — `lib/`, `constants.js`, `data/`, `core/`, `sim/`, `art/`, `render/`, `ui/`, the main loop last.
  - When files move, update the file tree in the game's `SPEC.md`, the root `SPEC.md` and the READMEs in the same change.
- **Version query strings on asset links.** Every `<link>`/`<script src>` referencing a local CSS/JS file must include a `?v=N` query string (e.g. `styles.css?v=2`), and that version must be bumped whenever the referenced file changes, so players don't need to clear their browser cache to see updates.

## Project folder layout

Every project lives in its own folder at the repo root.

**Folder naming:** lowercase English words separated by hyphens (kebab-case) — no spaces, no number prefix, no other punctuation, e.g. `flight-simulator/`, `fish-frenzy/`. The folder name is part of the public URL (`https://gray0072.github.io/ivan/flight-simulator/`), so keep it short and don't rename it once published.

Each project folder must contain:

```
<name>/
├── SPEC.md           # the game's own spec (written first, kept in sync with the code)
├── index.html        # markup only, links to the CSS/JS files below (versioned query strings)
├── styles.css         # all CSS for the project
├── constants.js       # game tuning constants (loaded before the game logic)
├── game.js            # main loop; the rest of the JS goes into subfolders by role
├── core/, data/, sim/, render/, ui/, …  # see "Code is organised into folders by meaning"
├── README.md          # player-facing docs, in English
├── README_RU.md        # player-facing docs, in Russian
├── README_SV.md        # player-facing docs, in Swedish
├── icon.svg            # project icon: favicon, READMEs, gallery card
├── icon-maskable.svg   # full-bleed Android icon, artwork inside the safe circle
├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png  # PWA icons (tools/pwa-icons.sh)
├── manifest.webmanifest # PWA manifest
└── screenshot.png      # preview image (English UI), referenced by all READMEs and the root gallery
```

`README.md`, `README_RU.md` and `README_SV.md` must link to each other at the top — each one links to the other two (`*[Read in English](README.md)*`, `*[Читать на русском](README_RU.md)*`, `*[Läs på svenska](README_SV.md)*`), matching the pattern used at the repo root.

## When adding a new project

1. Create the project folder and write its `SPEC.md` first; agree on it with the user before writing game code.
2. Create the rest of the files above (including `icon.svg`, `icon-maskable.svg`, the rendered PWA PNGs and `manifest.webmanifest`), implementing the spec.
3. Add a card to the root `index.html` gallery page (copy the existing `.card` block, update the image, icon, title, link, and description).
4. Add a card (screenshot, icon, description, Play/Source links) to the games table in all three root READMEs (`README.md`, `README_RU.md`, `README_SV.md`).
5. Update the `Projects` (one-line summary + link to the game's `SPEC.md`) and `Project structure` sections of the root `SPEC.md`.
6. Do not touch the GitHub Pages deployment setup (`Settings → Pages → Deploy from a branch → main / (root)`) — it already picks up every new file automatically, no workflow or build config needed.

## Testing the games

- No Playwright/Puppeteer is installed. Drive a page in headless Chrome over raw CDP: spawn `C:/Program Files/Google/Chrome/Application/chrome.exe --headless=new --remote-debugging-port=N --user-data-dir=<temp>`, fetch `http://127.0.0.1:N/json`, open the page's websocket and send `Runtime.evaluate`, `Page.captureScreenshot`, `Input.dispatchKeyEvent`, `Emulation.setDeviceMetricsOverride` / `setTouchEmulationEnabled` (phone, `pointer: coarse`). Node 20 needs `node --experimental-websocket` for the global `WebSocket`. Pages open fine from `file:///D:/Projects/my/ivan/<game>/index.html`.
- Stop Chrome with `taskkill /PID <pid> /T /F` — killing only the main process leaves the GPU/renderer children running.
- Headless Chrome renders WebGL in software (SwiftShader): 5–20 fps and 100 % CPU. Keep browser runs short (boot, a few screenshots, about a minute) and never run several in parallel.
- Long gameplay tests (e.g. whole `world-aviation` flights) run in Node instead: load the game's logic files (constants, data/airports, data/countries, data/airlines, data/emergencies, data/lang-ru, data/lang-sv, core/i18n, core/utils, data/geodata, sim/terrain, sim/world, core/audio, sim/flight, sim/systems, career, core/input, game) into a `vm` context with stub `HUD` / `Scene3D` / `UI` / DOM objects, replace `Input.axes` with a bot, and call `Game.frame(1 / 30)` in a plain loop under `os.setPriority(BELOW_NORMAL)` with a wall-clock limit. A gate-to-gate flight takes 7–25 s that way.
- Headless Chrome on this machine has speech voices: Microsoft en-GB (George, Hazel, Susan), Microsoft Bengt sv-SE, plus online Google voices (incl. Russian).

## Docs to keep in sync

- `README.md` / `README_RU.md` / `README_SV.md` (root) — end-user facing, gallery index.
- `SPEC.md` (root) — authoritative dev/agent spec, source of truth for repo structure and conventions.
- `<name>/SPEC.md` — source of truth for that game; update it together with the game's code.
- `CLAUDE.md` — do not duplicate instructions there; it only points here.
