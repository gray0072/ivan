<div align="center">

<img src="assets/icon.svg" alt="Иконка галереи браузерных игр" width="96" height="96">

# Галерея браузерных игр

**Маленькие самостоятельные браузерные игры на чистом JavaScript. Ничего не нужно устанавливать — просто открой и играй.**

[![Играть онлайн](https://img.shields.io/badge/▶_Играть_онлайн-gray0072.github.io%2Fivan-1b4f8a?style=for-the-badge)](https://gray0072.github.io/ivan/)

![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?logo=javascript&logoColor=000&style=flat-square)
![Без сборки](https://img.shields.io/badge/сборка-нет-3ddc97?style=flat-square)
![Для телефона](https://img.shields.io/badge/телефон-работает-ffb627?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-устанавливается-5a0fc8?style=flat-square)
[![Лицензия: MIT](https://img.shields.io/badge/лицензия-MIT-9fb0c3?style=flat-square)](LICENSE)

*[Read in English](README.md)* · *[Läs på svenska](README_SV.md)*

<a href="https://gray0072.github.io/ivan/"><img src="assets/showcase.gif" alt="World Aviation, Fish Frenzy, Fun Training и Flight Simulator в движении" width="800"></a>

</div>

## 🎮 Игры

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/world-aviation/"><img src="world-aviation/screenshot.png" alt="Скриншот World Aviation"></a>
      <h3><img src="world-aviation/icon.svg" alt="" width="28" height="28" align="center"> World Aviation</h3>
      <p>Авиасимулятор с видом из кабины и карьера пилота: от шведских внутренних рейсов из Арланды до всего мира. Буксировка, руление, заход по ILS, посадка и стоянка у гейта.</p>
      <p><a href="https://gray0072.github.io/ivan/world-aviation/"><b>▶ Играть</b></a> · <a href="world-aviation/">Исходники</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/fish-frenzy/"><img src="fish-frenzy/screenshot.png" alt="Скриншот Fish Frenzy"></a>
      <h3><img src="fish-frenzy/icon.svg" alt="" width="28" height="28" align="center"> Fish Frenzy</h3>
      <p>Аркада «съешь и расти»: ешь планктон и рыб мельче себя, уворачивайся от крупных рыб и медуз и поднимайся по пищевой цепи до Морского Царя.</p>
      <p><a href="https://gray0072.github.io/ivan/fish-frenzy/"><b>▶ Играть</b></a> · <a href="fish-frenzy/">Исходники</a></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/fun-training/"><img src="fun-training/screenshot.png" alt="Скриншот Fun Training"></a>
      <h3><img src="fun-training/icon.svg" alt="" width="28" height="28" align="center"> Fun Training</h3>
      <p>Игра-тренажёр для школьников: успевай отвечать на задания, чтобы полить цветок, остановить зомби или накормить панду, а на монеты наряжай своего персонажа.</p>
      <p><a href="https://gray0072.github.io/ivan/fun-training/"><b>▶ Играть</b></a> · <a href="fun-training/">Исходники</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/flight-simulator/"><img src="flight-simulator/screenshot.png" alt="Скриншот Flight Simulator"></a>
      <h3><img src="flight-simulator/icon.svg" alt="" width="28" height="28" align="center"> Flight Simulator</h3>
      <p>Аркадный полёт от первого лица: сбивай воздушные шарики из спаренной пушки и садись на полосу отмеченного аэропорта.</p>
      <p><a href="https://gray0072.github.io/ivan/flight-simulator/"><b>▶ Играть</b></a> · <a href="flight-simulator/">Исходники</a></p>
    </td>
  </tr>
</table>

## ✨ Особенности

- **Без установки** — игры запускаются прямо в браузере, на компьютере и на телефоне, и ставятся на главный экран как приложение.
- **Сенсорное управление** — экранные джойстики и кнопки на телефонах и планшетах, клавиатура и мышь на компьютере.
- **Только веб-платформа** — Canvas 2D и WebGL для графики, Web Audio для синтезированного звука. Без фреймворков и сборки.
- **Самостоятельные проекты** — каждая игра живёт в своей папке и работает, даже если скопировать её из репозитория.

## 🛠️ Разработчикам

<details>
<summary><b>Запуск локально</b></summary>

```bash
git clone https://github.com/gray0072/ivan.git
cd ivan
npx serve .        # или просто открой любой index.html в браузере
```

</details>

<details>
<summary><b>Деплой</b></summary>

Сборки нет. GitHub Pages отдаёт файлы прямо из корня ветки `main`
(**Settings → Pages → Deploy from a branch → `main` / `(root)`**), так что пуш в `main` — это и есть весь деплой.

</details>

<details>
<summary><b>Структура проекта</b></summary>

```
/
├── index.html, manifest.webmanifest   # страница-галерея (устанавливается как PWA)
├── assets/                  # стили и скрипты галереи, иконки, флаги, showcase.gif, картинка для соцсетей
├── tools/                   # cdp.js (headless Chrome), i18n-check.js, pwa-icons.sh
├── README.md / README_RU.md / README_SV.md
├── SPEC.md                  # спецификация и правила всего репозитория
├── AGENTS.md                # инструкции для AI-агентов (CLAUDE.md ссылается сюда)
└── <игра>/                  # по папке на игру: world-aviation, fish-frenzy, fun-training, flight-simulator
    ├── SPEC.md              # спецификация этой игры
    ├── index.html, styles.css, constants.js, game.js
    ├── core/, data/, sim/, render/, ui/, …   # код, разложенный по ролям
    ├── README.md / README_RU.md (/ README_SV.md)
    ├── icon.svg, manifest.webmanifest, иконки PWA
    └── screenshot.png
```

</details>

<details>
<summary><b>Планы</b></summary>

- [ ] Больше мини-игр и экспериментов
- [ ] Поиск/фильтр на странице галереи
- [ ] Переключатель светлой/тёмной темы на странице галереи

</details>

## 📄 Лицензия

[MIT](LICENSE)
