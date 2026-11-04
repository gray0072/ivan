# Icons

Arrows, symbols and emoji are drawn the same on every device, see "Arrows and icons are drawn" in `AGENTS.md`.

- `engine.js`: the runtime, copied into each project by `tools/icons-build.js`.
- `mono.js`: the one-colour drawings (arrows, ticks, triangles), shown in the colour of the text. The aeroplane is reshaped from Google's Material Icons (Apache 2.0).
- `color/`: the emoji, one SVG per character, named by its code point. They are [Twemoji](https://github.com/jdecked/twemoji), © Twitter, Inc and other contributors, licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). Files appear here the first time `tools/icons-build.js` meets the character.
