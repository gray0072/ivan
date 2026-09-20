# AGENTS.md

Instructions for AI coding agents working in this repository.

## What this repo is

A gallery of small, self-contained browser games and experiments, deployed as a static site to GitHub Pages. There is no build tool, no package manager, and no framework — every project is a single `index.html` (plus a screenshot and two READMEs). See `SPEC.md` for the full technical spec.

## Ground rules

- **English is the primary language.** All in-game text (titles, HUD labels, instructions, buttons, messages) and code comments must be written in English. `README.md` is English; `README_RU.md` is a Russian translation for players, but the games themselves are English-only.
- **No build step.** Don't introduce a bundler, framework, or `package.json` unless the user explicitly asks for one for a specific new project. Everything must keep working by opening `index.html` directly or serving the folder as static files.
- **Self-contained projects.** Each project folder should not depend on files outside itself (aside from the shared conventions below). It must work if copied out of the repo on its own.
- **Relative links only.** Every link (gallery card → project, project → screenshot, README image, etc.) must use a relative path, since the site is served from a subpath (`https://gray0072.github.io/ivan/`), not the domain root.
- **Mobile adaptation is required.** Every project must work on a phone/tablet, not just desktop with mouse/keyboard:
  - The canvas/layout must be responsive (resize to `window.innerWidth`/`innerHeight`, no fixed pixel dimensions).
  - Replace or supplement desktop-only input with touch equivalents: keyboard steering → device tilt (`deviceorientation`, calibrated against a baseline captured at game start, not absolute angles); mouse clicks / held keys for firing or actions → tap and tap-and-hold on the canvas.
  - On iOS, motion sensor access needs `DeviceOrientationEvent.requestPermission()` called from inside a user-gesture handler (e.g. the "Start" button) — request it there, and keep desktop controls fully working when permission is denied or the API doesn't exist.
  - Mention the touch/tilt controls in both `README.md` and `README_RU.md` for the project, and in its in-game instructions.
- **Start/restart buttons must work everywhere.** Any overlay button (e.g. "Start", "Play Again") must stay tappable on Android/iOS (plain `<button>` elements already are — don't intercept touch events on top of them) and must also be triggerable by **Space** or **Enter** on desktop, via a global `keydown` listener that clicks whichever button is currently visible in the overlay.
- **JS and CSS live in separate files.** Don't inline `<script>`/`<style>` blocks in `index.html` — put CSS in a `styles.css` and JS in one or more `.js` files (split JS into multiple files by concern/module when it grows large enough to benefit from it; `index.html` just references them). This still satisfies "no build step" and "self-contained" — the extra files live in the same project folder and are plain `<link>`/`<script src>` references, no bundler involved.
- **Version query strings on asset links.** Every `<link>`/`<script src>` referencing a local CSS/JS file must include a `?v=N` query string (e.g. `styles.css?v=2`), and that version must be bumped whenever the referenced file changes, so players don't need to clear their browser cache to see updates.

## Project folder layout

Every project lives in a numbered folder at the repo root, e.g. `2 - <name>/`, and must contain:

```
2 - <name>/
├── index.html        # markup only, links to the CSS/JS files below (versioned query strings)
├── styles.css         # all CSS for the project
├── game.js            # JS (split into multiple .js files as needed)
├── README.md          # player-facing docs, in English
├── README_RU.md        # player-facing docs, in Russian
└── screenshot.png      # preview image, referenced by both READMEs and the root gallery
```

`README.md` and `README_RU.md` must link to each other at the top (`*[Читать на русском](README_RU.md)*` / `*[Read in English](README.md)*`), matching the pattern already used at the repo root.

## When adding a new project

1. Create the numbered folder and the four files above.
2. Add a card to the root `index.html` gallery page (copy the existing `.card` block, update the image, title, link, and description).
3. Add a row to the projects table in both root `README.md` and `README_RU.md`.
4. Update the `Projects` and `Project structure` sections of `SPEC.md`.
5. Do not touch the GitHub Pages deployment setup (`Settings → Pages → Deploy from a branch → main / (root)`) — it already picks up every new file automatically, no workflow or build config needed.

## Docs to keep in sync

- `README.md` / `README_RU.md` (root) — end-user facing, gallery index.
- `SPEC.md` — authoritative dev/agent spec, source of truth for structure and conventions.
- `CLAUDE.md` — do not duplicate instructions there; it only points here.
