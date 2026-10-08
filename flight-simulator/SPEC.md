# Flight Simulator — SPEC

Developer/agent spec for the `flight-simulator` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

## Idea

First-person arcade flight game.

## Features

- First-person cockpit view (pseudo-3D perspective projection onto a 2D canvas, no WebGL)
- Steering: arrow keys (left/right = yaw with eased turn rate and visual bank, up/down = climb/descend with visual pitch)
- Twin-gun shooting (Ctrl, held to fire continuously) with synthesized "pew" sound effects, used to shoot down floating balloons for points
- Fly to a highlighted target airport, descend, align with the runway heading, and land within the runway bounds for points; missing the runway at zero altitude crashes the game
- Instrument panel: airspeed gauge, artificial horizon (mirrors bank/pitch), altimeter
- Terrain color/texture varies by world region and blends smoothly while flying
- Mouse cursor: in fullscreen it hides once the mouse has been still for `CURSOR_HIDE_MS` (3 s) and comes back as soon as the mouse moves, clicks or scrolls
- Updates: a page left open (above all the installed Android app, resumed from the background) looks for a new deploy on every return to the foreground and once an hour, and reloads into it only on the start screen, never mid-flight (`update.js`).
- Languages: English, Russian or Swedish, picked with the flag switcher (EN · RU · SV) at the top of the start and game-over screens and remembered (`flightSimulator.lang`; the first time the gallery's choice, then the browser's language, then English). Everything switches at once: the start and game-over texts, the HUD, the bars, the gauges, the compass line, the landing messages and the airport names (North / Northern / Norra…). Texts in `lang.js` (`LANG`, `tr()`), `data-i18n` in `index.html`.
- Files: `index.html` (markup), `styles.css`, `lang.js`, `game.js`, `update.js`, the flags `flag-gb.svg` / `flag-ru.svg` / `flag-se.svg`.
- Cockpit framing (canopy pillars, windshield header) fixed on screen; clouds stay level and do not rotate with aircraft bank
