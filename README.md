<div align="center">

<img src="assets/icon.svg" alt="Browser Games Gallery icon" width="96" height="96">

# Browser Games Gallery

**Tiny self-contained browser games in vanilla JavaScript. No install — just open and play.**

[![Play online](https://img.shields.io/badge/▶_Play_online-gray0072.github.io%2Fivan-1b4f8a?style=for-the-badge)](https://gray0072.github.io/ivan/)

![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?logo=javascript&logoColor=000&style=flat-square)
![No build step](https://img.shields.io/badge/build-none-3ddc97?style=flat-square)
![Mobile friendly](https://img.shields.io/badge/mobile-friendly-ffb627?style=flat-square)
![Installable PWA](https://img.shields.io/badge/PWA-installable-5a0fc8?style=flat-square)
[![License: MIT](https://img.shields.io/badge/license-MIT-9fb0c3?style=flat-square)](LICENSE)

*[Читать на русском](README_RU.md)* · *[Läs på svenska](README_SV.md)*

<a href="https://gray0072.github.io/ivan/"><img src="assets/showcase.gif" alt="World Aviation, Fish Frenzy, Fun Training and Flight Simulator in motion" width="800"></a>

</div>

## 🎮 Games

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/world-aviation/"><img src="world-aviation/screenshot.png" alt="World Aviation screenshot"></a>
      <h3><img src="world-aviation/icon.svg" alt="" width="28" height="28" align="center"> World Aviation</h3>
      <p>Cockpit-view flight simulator and airline career: from Swedish domestic hops out of Arlanda to the whole world. Push back, taxi, fly the ILS, land and park at the gate.</p>
      <p><a href="https://gray0072.github.io/ivan/world-aviation/"><b>▶ Play</b></a> · <a href="world-aviation/">Source</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/fish-frenzy/"><img src="fish-frenzy/screenshot.png" alt="Fish Frenzy screenshot"></a>
      <h3><img src="fish-frenzy/icon.svg" alt="" width="28" height="28" align="center"> Fish Frenzy</h3>
      <p>Eat-and-grow arcade: eat plankton and smaller fish, dodge bigger ones and jellyfish, and climb the food chain to the Sea King.</p>
      <p><a href="https://gray0072.github.io/ivan/fish-frenzy/"><b>▶ Play</b></a> · <a href="fish-frenzy/">Source</a></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/fun-training/"><img src="fun-training/screenshot.png" alt="Fun Training screenshot"></a>
      <h3><img src="fun-training/icon.svg" alt="" width="28" height="28" align="center"> Fun Training</h3>
      <p>A training game for school kids: answer tasks in time to water a flower, stop the zombies or keep a panda fed, then spend the coins on your own character.</p>
      <p><a href="https://gray0072.github.io/ivan/fun-training/"><b>▶ Play</b></a> · <a href="fun-training/">Source</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/flight-simulator/"><img src="flight-simulator/screenshot.png" alt="Flight Simulator screenshot"></a>
      <h3><img src="flight-simulator/icon.svg" alt="" width="28" height="28" align="center"> Flight Simulator</h3>
      <p>First-person arcade flight: pop balloons with the twin gun for points and land on the highlighted airport's runway.</p>
      <p><a href="https://gray0072.github.io/ivan/flight-simulator/"><b>▶ Play</b></a> · <a href="flight-simulator/">Source</a></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/city-builder/"><img src="city-builder/screenshot.png" alt="City Builder screenshot"></a>
      <h3><img src="city-builder/icon.svg" alt="" width="28" height="28" align="center"> City Builder</h3>
      <p>City-building game: lay roads, build houses, shops and factories, keep the residents happy and grow a hamlet into a metropolis — mind the fires and the spring floods.</p>
      <p><a href="https://gray0072.github.io/ivan/city-builder/"><b>▶ Play</b></a> · <a href="city-builder/">Source</a></p>
    </td>
    <td width="50%" valign="top"></td>
  </tr>
</table>

## ✨ Highlights

- **Zero install** — runs straight in the browser on desktop and mobile, and installs to the home screen as an app.
- **Touch controls** — on-screen joysticks and buttons on phones and tablets, keyboard and mouse on desktop.
- **Pure web platform** — Canvas 2D and WebGL for graphics, Web Audio for synthesized sound. No frameworks, no build step.
- **Self-contained** — each game lives in its own folder and still works when copied out of the repo.

## 🛠️ For developers

<details>
<summary><b>Run locally</b></summary>

```bash
git clone https://github.com/gray0072/ivan.git
cd ivan
npx serve .        # or just open any index.html in a browser
```

</details>

<details>
<summary><b>Deploy</b></summary>

There is no build step. GitHub Pages serves the `main` branch root directly
(**Settings → Pages → Deploy from a branch → `main` / `(root)`**), so pushing to `main` is the whole deploy.

</details>

<details>
<summary><b>Project structure</b></summary>

```
/
├── index.html, manifest.webmanifest   # the gallery page (an installable PWA)
├── assets/                  # gallery styles and scripts, icons, flags, showcase.gif, social preview
├── tools/                   # cdp.js (headless Chrome), i18n-check.js, pwa-icons.sh
├── README.md / README_RU.md / README_SV.md
├── SPEC.md                  # repo-wide spec and conventions
├── AGENTS.md                # instructions for AI coding agents (CLAUDE.md points here)
└── <game>/                  # one folder per game: world-aviation, fish-frenzy, fun-training, flight-simulator, city-builder
    ├── SPEC.md              # spec of this game
    ├── index.html, styles.css, constants.js, game.js
    ├── core/, data/, sim/, render/, ui/, …   # the code, by role
    ├── README.md / README_RU.md (/ README_SV.md)
    ├── icon.svg, manifest.webmanifest, PWA icons
    └── screenshot.png
```

</details>

<details>
<summary><b>Roadmap</b></summary>

- [ ] More mini-games and experiments
- [ ] Search/filter on the gallery page
- [ ] Light/dark toggle on the gallery page

</details>

## 📄 License

[MIT](LICENSE)
