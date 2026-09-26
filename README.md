<div align="center">

<img src="assets/icon.svg" alt="Browser Games Gallery icon" width="120" height="120">

# Browser Games Gallery

**Tiny self-contained browser games in vanilla JavaScript. No install — just open and play.**

[![Play online](https://img.shields.io/badge/▶_Play_online-gray0072.github.io%2Fivan-1b4f8a?style=for-the-badge)](https://gray0072.github.io/ivan/)

![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?logo=javascript&logoColor=000&style=flat-square)
![HTML5 Canvas](https://img.shields.io/badge/HTML5_Canvas-E34F26?logo=html5&logoColor=fff&style=flat-square)
![Web Audio](https://img.shields.io/badge/Web_Audio-3fa9f5?style=flat-square)
![No build step](https://img.shields.io/badge/build-none-3ddc97?style=flat-square)
![Mobile friendly](https://img.shields.io/badge/mobile-friendly-ffb627?style=flat-square)
[![License: MIT](https://img.shields.io/badge/license-MIT-9fb0c3?style=flat-square)](LICENSE)

*[Читать на русском](README_RU.md)*

</div>

---

## 🎮 Games

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/1%20-%20flight%20simulator/"><img src="1%20-%20flight%20simulator/screenshot.png" alt="Flight simulator screenshot"></a>
      <h3><img src="1%20-%20flight%20simulator/icon.svg" alt="" width="28" height="28" align="center"> Flight Simulator</h3>
      <p>First-person arcade flight game: steer with the arrow keys, fire a twin-gun with Ctrl to pop balloons for points, and land on the highlighted airport's runway.</p>
      <p><a href="https://gray0072.github.io/ivan/1%20-%20flight%20simulator/"><b>▶ Play</b></a> · <a href="1%20-%20flight%20simulator/">Source</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/2%20-%20fish%20frenzy/"><img src="2%20-%20fish%20frenzy/screenshot.png" alt="Fish frenzy screenshot"></a>
      <h3><img src="2%20-%20fish%20frenzy/icon.svg" alt="" width="28" height="28" align="center"> Fish Frenzy</h3>
      <p>Eat-and-grow arcade game: steer a fish with the arrow keys or a touch joystick, eat plankton and smaller fish with your mouth, avoid bigger ones and jellyfish, and climb the food chain to the Sea King and the maximum size. Three difficulty levels and best-time records.</p>
      <p><a href="https://gray0072.github.io/ivan/2%20-%20fish%20frenzy/"><b>▶ Play</b></a> · <a href="2%20-%20fish%20frenzy/">Source</a></p>
    </td>
  </tr>
</table>

## ✨ Highlights

- **Zero install** — every game runs straight in the browser, on desktop and mobile.
- **Touch controls** — on-screen joysticks, tap-and-hold and device tilt on phones and tablets.
- **Pure web platform** — Canvas 2D for graphics, Web Audio for synthesized sound. No frameworks, no asset pipeline.
- **Self-contained** — each game lives in its own folder and still works when copied out of the repo.

## 🚀 Run locally

```bash
git clone https://github.com/gray0072/ivan.git
cd ivan
npx serve .        # or just open any index.html in a browser
```

## 🌐 Deploy

There is no build step. GitHub Pages serves the `main` branch root directly
(**Settings → Pages → Deploy from a branch → `main` / `(root)`**), so pushing to `main` is the whole deploy.

## 📁 Project structure

```
/
├── index.html                  # root gallery page
├── assets/                     # repo icon and social preview image
├── README.md / README_RU.md
├── SPEC.md                     # technical spec
├── AGENTS.md                   # instructions for AI coding agents
├── CLAUDE.md                   # -> points to AGENTS.md
├── 1 - flight simulator/
│   ├── index.html              # the game
│   ├── README.md / README_RU.md
│   ├── icon.svg
│   └── screenshot.png
├── 2 - fish frenzy/
│   ├── index.html              # markup
│   ├── styles.css, *.js        # styles and game code, split by concern
│   ├── README.md / README_RU.md
│   ├── icon.svg
│   └── screenshot.png
└── ...                         # more games over time, same layout
```

## 🗺️ Roadmap

- [ ] More mini-games and experiments
- [ ] Search/filter on the gallery page
- [ ] Light/dark toggle on the gallery page

## 📄 License

[MIT](LICENSE)
