<div align="center">

<img src="assets/icon.svg" alt="Ikon för galleriet med webbläsarspel" width="120" height="120">

# Galleri med webbläsarspel

**Små fristående webbläsarspel i ren JavaScript. Ingen installation — öppna bara och spela.**

[![Spela online](https://img.shields.io/badge/▶_Spela_online-gray0072.github.io%2Fivan-1b4f8a?style=for-the-badge)](https://gray0072.github.io/ivan/)

![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?logo=javascript&logoColor=000&style=flat-square)
![HTML5 Canvas](https://img.shields.io/badge/HTML5_Canvas-E34F26?logo=html5&logoColor=fff&style=flat-square)
![Web Audio](https://img.shields.io/badge/Web_Audio-3fa9f5?style=flat-square)
![Inget byggsteg](https://img.shields.io/badge/bygge-inget-3ddc97?style=flat-square)
![Fungerar i mobilen](https://img.shields.io/badge/mobil-fungerar-ffb627?style=flat-square)
[![Licens: MIT](https://img.shields.io/badge/licens-MIT-9fb0c3?style=flat-square)](LICENSE)

*[Read in English](README.md)* · *[Читать на русском](README_RU.md)*

</div>

---

## 🎮 Spel

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/flight-simulator/"><img src="flight-simulator/screenshot.png" alt="Skärmbild från flygsimulatorn"></a>
      <h3><img src="flight-simulator/icon.svg" alt="" width="28" height="28" align="center"> Flygsimulator</h3>
      <p>Ett arkadflygspel i förstapersonsvy: styr med piltangenterna, skjut med dubbelkanonen (Ctrl) mot ballonger för poäng och landa på banan vid den markerade flygplatsen.</p>
      <p><a href="https://gray0072.github.io/ivan/flight-simulator/"><b>▶ Spela</b></a> · <a href="flight-simulator/">Källkod</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/fish-frenzy/"><img src="fish-frenzy/screenshot.png" alt="Skärmbild från Fish Frenzy"></a>
      <h3><img src="fish-frenzy/icon.svg" alt="" width="28" height="28" align="center"> Fish Frenzy</h3>
      <p>Ett ät-och-väx-arkadspel: styr en fisk med piltangenterna eller en joystick på skärmen, ät plankton och mindre fiskar med munnen, undvik större fiskar och maneter och klättra uppför näringskedjan till Havskungen och den största storleken. Tre svårighetsgrader och rekord för bästa tid.</p>
      <p><a href="https://gray0072.github.io/ivan/fish-frenzy/"><b>▶ Spela</b></a> · <a href="fish-frenzy/">Källkod</a></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/fun-training/"><img src="fun-training/screenshot.png" alt="Skärmbild från Fun Training"></a>
      <h3><img src="fun-training/icon.svg" alt="" width="28" height="28" align="center"> Fun Training</h3>
      <p>Ett övningsspel för skolbarn: vattna en blomma, stoppa zombier, lägg räls åt ett tåg, håll en ballong i luften, en lägereld brinnande eller en panda mätt och glad genom att lösa uppgifter i tid. Lägg mynten på din egen figur: ge den mat, klä upp den och möblera dess rum.</p>
      <p><a href="https://gray0072.github.io/ivan/fun-training/"><b>▶ Spela</b></a> · <a href="fun-training/">Källkod</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/world-aviation/"><img src="world-aviation/screenshot.png" alt="Skärmbild från World Aviation"></a>
      <h3><img src="world-aviation/icon.svg" alt="" width="28" height="28" align="center"> World Aviation</h3>
      <p>En flygsimulator med vy från cockpit och en karriär som trafikpilot: börja med inrikesflyg i Sverige från Arlanda, vinn Skandinavien och sedan hela världen, region för region. Pushback, taxning, start, nödlägen med checklistorna, ILS-inflygning, landning och taxning in till gaten.</p>
      <p><a href="https://gray0072.github.io/ivan/world-aviation/"><b>▶ Spela</b></a> · <a href="world-aviation/">Källkod</a></p>
    </td>
  </tr>
</table>

## ✨ Det bästa

- **Ingen installation** — alla spel körs direkt i webbläsaren, på datorn och i mobilen.
- **Pekskärmsstyrning** — joystickar på skärmen, tryck och håll, och lutning av enheten på telefoner och surfplattor.
- **Ren webbplattform** — Canvas 2D för grafiken, Web Audio för syntetiserat ljud. Inga ramverk, ingen tillgångspipeline.
- **Fristående** — varje spel ligger i sin egen mapp och fungerar även om det kopieras ut ur repot.

## 🚀 Kör lokalt

```bash
git clone https://github.com/gray0072/ivan.git
cd ivan
npx serve .        # eller öppna bara valfri index.html i en webbläsare
```

## 🌐 Publicering

Det finns inget byggsteg. GitHub Pages serverar roten av grenen `main` direkt
(**Settings → Pages → Deploy from a branch → `main` / `(root)`**), så en push till `main` är hela publiceringen.

## 📁 Projektets struktur

```
/
├── index.html                  # galleriets startsida
├── assets/                     # repots ikon och förhandsbild för sociala medier
├── README.md / README_RU.md / README_SV.md
├── SPEC.md                     # teknisk specifikation
├── AGENTS.md                   # instruktioner för AI-kodagenter
├── CLAUDE.md                   # -> pekar på AGENTS.md
├── flight-simulator/
│   ├── SPEC.md                 # spelets specifikation
│   ├── index.html              # spelet
│   ├── README.md / README_RU.md
│   ├── icon.svg
│   └── screenshot.png
├── fish-frenzy/
│   ├── SPEC.md                 # spelets specifikation
│   ├── index.html              # markup
│   ├── styles.css, *.js        # stilar och spelkod, uppdelade efter ansvar
│   ├── README.md / README_RU.md
│   ├── icon.svg
│   └── screenshot.png
├── fun-training/
│   ├── SPEC.md                 # spelets specifikation
│   ├── index.html, styles.css, *.js
│   ├── README.md / README_RU.md
│   ├── icon.svg
│   └── screenshot.png
├── world-aviation/
│   ├── SPEC.md                 # spelets specifikation
│   ├── index.html, styles.css, constants.js, game.js, career.js
│   ├── lib/, core/, data/, art/, sim/, render/, ui/
│   ├── README.md / README_RU.md / README_SV.md
│   ├── icon.svg
│   └── screenshot.png
└── ...                         # fler spel med tiden, samma upplägg
```

## 🗺️ Planer

- [ ] Fler minispel och experiment
- [ ] Sökning och filter på gallerisidan
- [ ] Ljust/mörkt läge på gallerisidan

## 📄 Licens

[MIT](LICENSE)
