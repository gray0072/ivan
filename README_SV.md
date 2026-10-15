<div align="center">

<img src="assets/icon.svg" alt="Ikon för galleriet med webbläsarspel" width="96" height="96">

# Galleri med webbläsarspel

**Små fristående webbläsarspel i ren JavaScript. Ingen installation — öppna bara och spela.**

[![Spela online](https://img.shields.io/badge/▶_Spela_online-gray0072.github.io%2Fivan-1b4f8a?style=for-the-badge)](https://gray0072.github.io/ivan/)

![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?logo=javascript&logoColor=000&style=flat-square)
![Inget byggsteg](https://img.shields.io/badge/bygge-inget-3ddc97?style=flat-square)
![Fungerar i mobilen](https://img.shields.io/badge/mobil-fungerar-ffb627?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-installerbar-5a0fc8?style=flat-square)
[![Licens: MIT](https://img.shields.io/badge/licens-MIT-9fb0c3?style=flat-square)](LICENSE)

*[Read in English](README.md)* · *[Читать на русском](README_RU.md)*

<a href="https://gray0072.github.io/ivan/"><img src="assets/showcase.gif" alt="World Aviation, Fish Frenzy, Fun Training och Flygsimulator i rörelse" width="800"></a>

</div>

## 🎮 Spel

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/world-aviation/"><img src="world-aviation/screenshot.png" alt="Skärmbild från World Aviation"></a>
      <h3><img src="world-aviation/icon.svg" alt="" width="28" height="28" align="center"> World Aviation</h3>
      <p>En flygsimulator med vy från cockpit och en karriär som trafikpilot: från inrikesflyg i Sverige från Arlanda till hela världen. Pushback, taxning, ILS-inflygning, landning och parkering vid gaten.</p>
      <p><a href="https://gray0072.github.io/ivan/world-aviation/"><b>▶ Spela</b></a> · <a href="world-aviation/">Källkod</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/fish-frenzy/"><img src="fish-frenzy/screenshot.png" alt="Skärmbild från Fish Frenzy"></a>
      <h3><img src="fish-frenzy/icon.svg" alt="" width="28" height="28" align="center"> Fish Frenzy</h3>
      <p>Ett ät-och-väx-arkadspel: ät plankton och mindre fiskar, undvik större fiskar och maneter och klättra uppför näringskedjan till Havskungen.</p>
      <p><a href="https://gray0072.github.io/ivan/fish-frenzy/"><b>▶ Spela</b></a> · <a href="fish-frenzy/">Källkod</a></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/fun-training/"><img src="fun-training/screenshot.png" alt="Skärmbild från Fun Training"></a>
      <h3><img src="fun-training/icon.svg" alt="" width="28" height="28" align="center"> Fun Training</h3>
      <p>Ett övningsspel för skolbarn: lös uppgifter i tid för att vattna en blomma, stoppa zombierna eller hålla en panda mätt, och lägg sedan mynten på din egen figur.</p>
      <p><a href="https://gray0072.github.io/ivan/fun-training/"><b>▶ Spela</b></a> · <a href="fun-training/">Källkod</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/flight-simulator/"><img src="flight-simulator/screenshot.png" alt="Skärmbild från flygsimulatorn"></a>
      <h3><img src="flight-simulator/icon.svg" alt="" width="28" height="28" align="center"> Flygsimulator</h3>
      <p>Arkadflyg i förstapersonsvy: skjut ballonger med dubbelkanonen för poäng och landa på banan vid den markerade flygplatsen.</p>
      <p><a href="https://gray0072.github.io/ivan/flight-simulator/"><b>▶ Spela</b></a> · <a href="flight-simulator/">Källkod</a></p>
    </td>
  </tr>
</table>

## ✨ Det bästa

- **Ingen installation** — spelen körs direkt i webbläsaren, på datorn och i mobilen, och kan läggas på hemskärmen som en app.
- **Pekskärmsstyrning** — joystickar och knappar på skärmen i telefoner och surfplattor, tangentbord och mus på datorn.
- **Ren webbplattform** — Canvas 2D och WebGL för grafiken, Web Audio för syntetiserat ljud. Inga ramverk, inget byggsteg.
- **Fristående** — varje spel ligger i sin egen mapp och fungerar även om det kopieras ut ur repot.

## 🛠️ För utvecklare

<details>
<summary><b>Kör lokalt</b></summary>

```bash
git clone https://github.com/gray0072/ivan.git
cd ivan
npx serve .        # eller öppna bara valfri index.html i en webbläsare
```

</details>

<details>
<summary><b>Publicering</b></summary>

Det finns inget byggsteg. GitHub Pages serverar roten av grenen `main` direkt
(**Settings → Pages → Deploy from a branch → `main` / `(root)`**), så en push till `main` är hela publiceringen.

</details>

<details>
<summary><b>Projektets struktur</b></summary>

```
/
├── index.html, manifest.webmanifest   # gallerisidan (installerbar som PWA)
├── assets/                  # galleriets stilar och skript, ikoner, flaggor, showcase.gif, bild för sociala medier
├── tools/                   # cdp.js (headless Chrome), i18n-check.js, pwa-icons.sh
├── README.md / README_RU.md / README_SV.md
├── SPEC.md                  # specifikation och regler för hela repot
├── AGENTS.md                # instruktioner för AI-agenter (CLAUDE.md pekar hit)
└── <spel>/                  # en mapp per spel: world-aviation, fish-frenzy, fun-training, flight-simulator
    ├── SPEC.md              # spelets specifikation
    ├── index.html, styles.css, constants.js, game.js
    ├── core/, data/, sim/, render/, ui/, …   # koden, ordnad efter roll
    ├── README.md / README_RU.md (/ README_SV.md)
    ├── icon.svg, manifest.webmanifest, PWA-ikoner
    └── screenshot.png
```

</details>

<details>
<summary><b>Planer</b></summary>

- [ ] Fler minispel och experiment
- [ ] Sökning och filter på gallerisidan
- [ ] Ljust/mörkt läge på gallerisidan

</details>

## 📄 Licens

[MIT](LICENSE)
