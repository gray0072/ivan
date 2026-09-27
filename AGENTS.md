# AGENTS.md

Instructions for AI coding agents working in this repository.

## What this repo is

A gallery of small, self-contained browser games and experiments, deployed as a static site to GitHub Pages. There is no build tool, no package manager, and no framework — every project is a folder with an `index.html`, its own CSS/JS files, an icon, a screenshot and three READMEs (English, Russian, Swedish). See `SPEC.md` for the full technical spec.

## Ground rules

- **English is the primary language.** All in-game text (titles, HUD labels, instructions, buttons, messages) and code comments must be written in English. `README.md` is English; `README_RU.md` (Russian) and `README_SV.md` (Swedish) are translations for players, but the games themselves are English-only.
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
    - Device tilt (`deviceorientation`) may be offered only as an optional extra, never as the only way to steer (on iOS it needs `DeviceOrientationEvent.requestPermission()` from a user gesture). `2 - fish frenzy/input.js` is the reference implementation of the split-screen scheme.
  - Mention the touch controls in all three READMEs (`README.md`, `README_RU.md`, `README_SV.md`) for the project, and in its in-game instructions.
- **Every project has an icon.** Each project folder contains an `icon.svg` (square 512×512 viewBox, rounded-tile style with `rx="112"`, readable at 16–32 px, matching the game's theme). It is used as the page favicon (`<link rel="icon" type="image/svg+xml" href="icon.svg?v=N">`), next to the title in both project READMEs, on the project's card in the root gallery, and in the root README game table. The repo-level icon and social preview live in `assets/`.
- **Three difficulty levels.** Every game offers exactly three difficulty levels — **Easy**, **Medium**, **Hard** — selectable on the start screen **and** in every restart / game-over / "Play Again" dialog (pre-selected to the current level, so restarting on the same level is one click/keypress). The choice is remembered in `localStorage` between visits. Describe what each level changes in the project's READMEs.
- **Debug cheats.** Every game has simple, easy-to-understand cheats for testing, e.g. digit keys jumping straight to a level / stage / size (`2 - fish frenzy`: 1–5 = each stage, 6–9 = bigger, 0 = max size). Each cheat shows a short on-screen banner saying what it did. Once any cheat is used in a run, that run is marked as cheated and never updates best times / high scores / records in `localStorage`. Cheats are keyboard-only, aren't mentioned in the in-game instructions and must not trigger by accident during normal play.
- **Screenshots are in English.** Every `screenshot.png` (and any other preview image) must show the English UI — it's used by all three READMEs, including the Russian and Swedish ones.
- **Start/restart buttons must work everywhere.** Any overlay button (e.g. "Start", "Play Again") must stay tappable on Android/iOS (plain `<button>` elements already are — don't intercept touch events on top of them) and must also be triggerable by **Space** or **Enter** on desktop, via a global `keydown` listener that clicks whichever button is currently visible in the overlay.
- **JS and CSS live in separate files — always.** Never inline `<script>`/`<style>` blocks or `style=`/`onclick=` attributes in a project's `index.html` — put CSS in a `styles.css` and JS in one or more `.js` files (split JS into multiple files by concern/module when it grows large enough to benefit from it; `index.html` just references them). This still satisfies "no build step" and "self-contained" — the extra files live in the same project folder and are plain `<link>`/`<script src>` references, no bundler involved.
- **Game constants live in their own file.** Every gameplay tuning value — sizes, speeds, counts, timings, probabilities, hit shapes, difficulty tables, stage lists — goes into `constants.js` in the project folder, as top-level `const`s with a short comment on units or meaning. It is loaded via `<script src>` before the files that use it; game logic files must not declare their own gameplay constants (purely visual constants of an art/render module, like colour palettes or decoration cell sizes, may stay in that module). Runtime state (arrays of entities, the player object, scores) stays in the logic files.
- **Version query strings on asset links.** Every `<link>`/`<script src>` referencing a local CSS/JS file must include a `?v=N` query string (e.g. `styles.css?v=2`), and that version must be bumped whenever the referenced file changes, so players don't need to clear their browser cache to see updates.

## Project folder layout

Every project lives in a numbered folder at the repo root, e.g. `2 - <name>/`, and must contain:

```
2 - <name>/
├── index.html        # markup only, links to the CSS/JS files below (versioned query strings)
├── styles.css         # all CSS for the project
├── constants.js       # game tuning constants (loaded before the game logic)
├── game.js            # JS (split into multiple .js files as needed)
├── README.md          # player-facing docs, in English
├── README_RU.md        # player-facing docs, in Russian
├── README_SV.md        # player-facing docs, in Swedish
├── icon.svg            # project icon: favicon, READMEs, gallery card
└── screenshot.png      # preview image (English UI), referenced by all READMEs and the root gallery
```

`README.md`, `README_RU.md` and `README_SV.md` must link to each other at the top — each one links to the other two (`*[Read in English](README.md)*`, `*[Читать на русском](README_RU.md)*`, `*[Läs på svenska](README_SV.md)*`), matching the pattern used at the repo root.

## When adding a new project

1. Create the numbered folder and the files above (including `icon.svg`).
2. Add a card to the root `index.html` gallery page (copy the existing `.card` block, update the image, icon, title, link, and description).
3. Add a card (screenshot, icon, description, Play/Source links) to the games table in all three root READMEs (`README.md`, `README_RU.md`, `README_SV.md`).
4. Update the `Projects` and `Project structure` sections of `SPEC.md`.
5. Do not touch the GitHub Pages deployment setup (`Settings → Pages → Deploy from a branch → main / (root)`) — it already picks up every new file automatically, no workflow or build config needed.

## Docs to keep in sync

- `README.md` / `README_RU.md` / `README_SV.md` (root) — end-user facing, gallery index.
- `SPEC.md` — authoritative dev/agent spec, source of truth for structure and conventions.
- `CLAUDE.md` — do not duplicate instructions there; it only points here.
